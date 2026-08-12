import {
  getBrowserCapabilities,
  getBrowserType,
  getCurrentIPAddress,
  getDeviceData,
  getFingerprintData,
  getLocationFromCoordinates,
  getLocationFromIP,
  getNetworkData,
  getScreenResolution,
} from "@/features/settings/utils/sessionUtils";
import { logger } from "@/lib/utils/logger";

const DEVICE_ID_STORAGE_KEY = "omaya_device_id";
const DEVICE_COORDS_STORAGE_KEY = "omaya_device_coords";
const DEVICE_INFO_CACHE_MS = 60_000;
const GEOLOCATION_TIMEOUT_MS = 25_000;
const GPS_CACHE_MAX_AGE_MS = 5 * 60_000;
const IP_CACHE_MAX_AGE_MS = 30 * 60_000;
const GPS_GOOD_ACCURACY_METERS = 150;

export type LocationPermissionState =
  | "granted"
  | "denied"
  | "prompt"
  | "unsupported";

export interface DeviceInfo {
  device_type: string;
  device_model: string;
  os_version: string;
  app_version: string;
  device_id: string;
  latitude: number | null;
  longitude: number | null;
  location_permission: LocationPermissionState;
  location: string;
  device_data: Record<string, unknown>;
  network_data: Record<string, unknown>;
  fingerprint_data: Record<string, unknown>;
  browser_capabilities: Record<string, unknown>;
}

/** POST endpoints that must include `device_info` on the request body. */
const DEVICE_INFO_POST_PATTERNS: RegExp[] = [
  /\/api\/register\/?$/,
  /\/api\/verify-otp\/?$/,
  /\/trading_engine\/deposits\/?$/,
  /\/trading_engine\/withdraw\/?$/,
  /\/trading_engine\/p2p\/orders\/[^/]+\/match\/?$/,
  /\/trading_engine\/p2p\/deposit\/create\/?$/,
  /\/trading_engine\/p2p-withdraw\/?$/,
  /\/trading_engine\/referral\/withdraw\/?$/,
  /\/trading_engine\/forex\/?$/,
  /\/trading_engine\/forex\/create-exchange\/?$/,
  /\/api\/moneyx\/transactions\/?$/,
  /\/api\/changenow\/create\/?$/,
];

let cachedDeviceInfo: DeviceInfo | null = null;
let cachedAt = 0;
let inFlightCollection: Promise<DeviceInfo> | null = null;

const getOrCreateDeviceId = (): string => {
  if (typeof window === "undefined") return "server";
  try {
    const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, id);
    return id;
  } catch {
    return "unknown";
  }
};

const parseOsVersion = (): string => {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  const windows = ua.match(/Windows NT ([0-9.]+)/i);
  if (windows?.[1]) return `Windows ${windows[1]}`;
  const android = ua.match(/Android ([0-9.]+)/i);
  if (android?.[1]) return `Android ${android[1]}`;
  const ios = ua.match(/OS ([0-9_]+) like Mac OS X/i);
  if (ios?.[1]) return `iOS ${ios[1].replace(/_/g, ".")}`;
  const mac = ua.match(/Mac OS X ([0-9_]+)/i);
  if (mac?.[1]) return `macOS ${mac[1].replace(/_/g, ".")}`;
  return navigator.platform || "Unknown";
};

const parseDeviceModel = (): string => {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  const android = ua.match(/;\s*([^;]+)\s+Build\//i);
  if (android?.[1]) return android[1].trim();
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  return getBrowserType();
};

const getCanvasHash = (): string | null => {
  if (typeof document === "undefined") return null;
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("omaya-device-fingerprint", 2, 2);
    const data = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i);
      hash &= hash;
    }
    return String(Math.abs(hash));
  } catch {
    return null;
  }
};

const getGeolocationPermission =
  async (): Promise<LocationPermissionState> => {
    if (typeof navigator === "undefined" || !navigator.permissions) {
      return "unsupported";
    }
    try {
      const status = await navigator.permissions.query({
        name: "geolocation",
      });
      return status.state as LocationPermissionState;
    } catch {
      return "unsupported";
    }
  };

type GeoCoords = { latitude: number; longitude: number };
type CoordsSource = "gps" | "ip";

type StoredCoordsPayload = GeoCoords & {
  source: CoordsSource;
  accuracy?: number;
  storedAt: number;
};

type StoredCoords = StoredCoordsPayload & {
  ageMs: number;
};

const readStoredCoords = (): StoredCoords | null => {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DEVICE_COORDS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredCoordsPayload>;
    if (
      !Number.isFinite(parsed.latitude) ||
      !Number.isFinite(parsed.longitude)
    ) {
      return null;
    }

    const storedAt =
      typeof parsed.storedAt === "number" ? parsed.storedAt : 0;
    const source: CoordsSource =
      parsed.source === "gps" ? "gps" : "ip";

    return {
      latitude: parsed.latitude as number,
      longitude: parsed.longitude as number,
      source,
      accuracy:
        typeof parsed.accuracy === "number" ? parsed.accuracy : undefined,
      storedAt,
      ageMs: storedAt > 0 ? Date.now() - storedAt : Number.POSITIVE_INFINITY,
    };
  } catch {
    return null;
  }
};

const storeCoords = (
  coords: GeoCoords,
  source: CoordsSource,
  accuracy?: number
): void => {
  if (typeof sessionStorage === "undefined") return;
  try {
    const payload: StoredCoordsPayload = {
      ...coords,
      source,
      accuracy,
      storedAt: Date.now(),
    };
    sessionStorage.setItem(
      DEVICE_COORDS_STORAGE_KEY,
      JSON.stringify(payload)
    );
  } catch {
    // ignore
  }
};

const clearStoredCoords = (): void => {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(DEVICE_COORDS_STORAGE_KEY);
  } catch {
    // ignore
  }
};

const getCoordinatesFromIP = async (
  ipAddress?: string
): Promise<GeoCoords | null> => {
  try {
    let ip = ipAddress;
    if (!ip || ip === "Unknown") {
      ip = await getCurrentIPAddress();
    }
    if (!ip || ip === "Unknown") return null;

    const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!geoRes.ok) return null;
    const geo = await geoRes.json();
    const latitude = parseFloat(String(geo.latitude ?? ""));
    const longitude = parseFloat(String(geo.longitude ?? ""));
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }
    return { latitude, longitude };
  } catch (error) {
    logger.warn("api", "Failed to get coordinates from IP:", error);
    return null;
  }
};

const getBrowserGeolocation = (
  timeoutMs = GEOLOCATION_TIMEOUT_MS
): Promise<{
  coords: GeoCoords | null;
  permission: LocationPermissionState;
  accuracy?: number;
}> =>
  new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ coords: null, permission: "unsupported" });
      return;
    }

    let settled = false;
    let watchId: number | null = null;
    let best: { coords: GeoCoords; accuracy: number } | null = null;

    const finish = (permission: LocationPermissionState) => {
      if (settled) return;
      settled = true;
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(timer);

      if (best) {
        storeCoords(best.coords, "gps", best.accuracy);
        resolve({
          coords: best.coords,
          permission: "granted",
          accuracy: best.accuracy,
        });
        return;
      }

      resolve({ coords: null, permission });
    };

    const timer = window.setTimeout(
      () => finish("prompt"),
      timeoutMs + 500
    );

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const accuracy = position.coords.accuracy ?? Number.POSITIVE_INFINITY;
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        if (!best || accuracy < best.accuracy) {
          best = { coords, accuracy };
        }

        if (accuracy <= GPS_GOOD_ACCURACY_METERS) {
          finish("granted");
        }
      },
      (error) => {
        const permission: LocationPermissionState =
          error.code === error.PERMISSION_DENIED
            ? "denied"
            : error.code === error.POSITION_UNAVAILABLE
              ? "prompt"
              : "prompt";
        finish(permission);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: timeoutMs,
      }
    );
  });

/** Resolve lat/long for API payloads. Prefers precise GPS over IP estimates. */
const resolveDeviceCoordinates = async (
  ipAddress: string,
  { requestBrowserLocation = false }: { requestBrowserLocation?: boolean } = {}
): Promise<{
  latitude: number | null;
  longitude: number | null;
  location_permission: LocationPermissionState;
}> => {
  const stored = readStoredCoords();
  if (
    stored?.source === "gps" &&
    stored.ageMs < GPS_CACHE_MAX_AGE_MS
  ) {
    return {
      latitude: stored.latitude,
      longitude: stored.longitude,
      location_permission: "granted",
    };
  }

  let permission = await getGeolocationPermission();

  if (requestBrowserLocation || permission === "granted") {
    const attempt = await getBrowserGeolocation();

    if (attempt.coords) {
      return {
        ...attempt.coords,
        location_permission: "granted",
      };
    }

    permission = attempt.permission || permission;
  }

  if (
    stored?.source === "gps" &&
    Number.isFinite(stored.latitude) &&
    Number.isFinite(stored.longitude)
  ) {
    return {
      latitude: stored.latitude,
      longitude: stored.longitude,
      location_permission: permission === "denied" ? permission : "granted",
    };
  }

  if (
    stored?.source === "ip" &&
    stored.ageMs < IP_CACHE_MAX_AGE_MS
  ) {
    return {
      latitude: stored.latitude,
      longitude: stored.longitude,
      location_permission: permission,
    };
  }

  const ipCoords = await getCoordinatesFromIP(ipAddress);
  if (ipCoords) {
    storeCoords(ipCoords, "ip");
    return {
      latitude: ipCoords.latitude,
      longitude: ipCoords.longitude,
      location_permission: permission,
    };
  }

  return {
    latitude: null,
    longitude: null,
    location_permission: permission,
  };
};

/** Ask for browser location once when the user enters the site (not on POST). */
export const prefetchDeviceLocation = async (): Promise<void> => {
  if (typeof window === "undefined") return;

  const stored = readStoredCoords();
  if (stored?.source === "gps" && stored.ageMs < GPS_CACHE_MAX_AGE_MS) {
    return;
  }

  if (stored?.source === "ip") {
    clearStoredCoords();
  }

  try {
    const ipAddress = await getCurrentIPAddress();
    await resolveDeviceCoordinates(ipAddress, { requestBrowserLocation: true });
  } catch (error) {
    logger.warn("api", "prefetchDeviceLocation failed:", error);
  }
};

const buildFingerprintData = (): Record<string, unknown> => {
  const base = getFingerprintData();
  const canvasHash = getCanvasHash();
  return {
    ...base,
    canvas_hash: canvasHash,
    any_fingerprint_signal: canvasHash || base.hash,
  };
};

const buildDeviceData = (): Record<string, unknown> => {
  const base = getDeviceData();
  return {
    ...base,
    battery_level: null,
    is_rooted: false,
    anything_else_device_related: {
      screen_resolution: getScreenResolution(),
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    },
  };
};

const buildNetworkData = (): Record<string, unknown> => {
  const base = getNetworkData();
  const conn =
    typeof navigator !== "undefined"
      ? (navigator as Navigator & {
          connection?: {
            effectiveType?: string;
            type?: string;
          };
        }).connection
      : undefined;

  return {
    ...base,
    carrier: "Unknown",
    connection_type:
      conn?.effectiveType || conn?.type || (base.effective_type as string) || "unknown",
  };
};

const buildBrowserCapabilities = (): Record<string, unknown> => {
  const caps = getBrowserCapabilities();
  return {
    cookies_enabled: caps.cookies_enabled ?? false,
    webgl_supported: caps.webgl_available ?? false,
    local_storage_available: caps.localStorage_available ?? false,
    session_storage_available: caps.session_storage_available ?? false,
  };
};

export const normalizeRequestPath = (url: string): string => {
  const withoutQuery = url.split("?")[0] || "";
  try {
    if (/^https?:\/\//i.test(withoutQuery)) {
      return new URL(withoutQuery).pathname;
    }
  } catch {
    // fall through
  }
  return withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
};

export const shouldAttachDeviceInfoToRequest = (
  url: string,
  method?: string
): boolean => {
  if ((method || "get").toLowerCase() !== "post") return false;
  const path = normalizeRequestPath(url);
  return DEVICE_INFO_POST_PATTERNS.some((pattern) => pattern.test(path));
};

/** Collect device_info payload for transaction / registration APIs. */
export const collectDeviceInfo = async (): Promise<DeviceInfo> => {
  const now = Date.now();
  if (
    cachedDeviceInfo &&
    now - cachedAt < DEVICE_INFO_CACHE_MS &&
    cachedDeviceInfo.latitude != null &&
    cachedDeviceInfo.longitude != null
  ) {
    return cachedDeviceInfo;
  }
  if (inFlightCollection) return inFlightCollection;

  inFlightCollection = (async () => {
    const deviceData = getDeviceData();
    const ipAddress = await getCurrentIPAddress();
    const permission = await getGeolocationPermission();
    const [coordinates, locationFromIp] = await Promise.all([
      resolveDeviceCoordinates(ipAddress, {
        requestBrowserLocation: permission === "granted",
      }),
      getLocationFromIP(ipAddress),
    ]);

    const locationLabel =
      coordinates.latitude != null && coordinates.longitude != null
        ? await getLocationFromCoordinates(
            coordinates.latitude,
            coordinates.longitude
          )
        : locationFromIp;

    const info: DeviceInfo = {
      device_type: String(deviceData.device_type || "Unknown"),
      device_model: parseDeviceModel(),
      os_version: parseOsVersion(),
      app_version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      device_id: getOrCreateDeviceId(),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      location_permission: coordinates.location_permission,
      location:
        locationLabel !== "Unknown" ? locationLabel : locationFromIp,
      device_data: buildDeviceData(),
      network_data: buildNetworkData(),
      fingerprint_data: buildFingerprintData(),
      browser_capabilities: buildBrowserCapabilities(),
    };

    cachedDeviceInfo = info;
    cachedAt = Date.now();
    inFlightCollection = null;
    return info;
  })().catch((error) => {
    inFlightCollection = null;
    logger.warn("api", "collectDeviceInfo failed:", error);
    const fallback: DeviceInfo = {
      device_type: "Unknown",
      device_model: "Unknown",
      os_version: "Unknown",
      app_version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      device_id: getOrCreateDeviceId(),
      latitude: null,
      longitude: null,
      location_permission: "unsupported",
      location: "Unknown",
      device_data: {},
      network_data: {},
      fingerprint_data: {},
      browser_capabilities: {},
    };
    cachedDeviceInfo = fallback;
    cachedAt = Date.now();
    return fallback;
  });

  return inFlightCollection;
};

export const mergeDeviceInfoIntoRequestData = (
  data: unknown,
  deviceInfo: DeviceInfo
): unknown => {
  if (data instanceof FormData) {
    if (!data.has("device_info")) {
      data.append("device_info", JSON.stringify(deviceInfo));
    }
    return data;
  }

  if (typeof data === "string") {
    return data;
  }

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;
    if (record.device_info) return data;
    return { ...record, device_info: deviceInfo };
  }

  return { device_info: deviceInfo };
};
