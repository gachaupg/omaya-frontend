import {
  collectDeviceInfo,
  collectSyncDeviceInfo,
  type DeviceInfo,
} from "@/lib/utils/deviceInfo";
import {
  getBrowserType,
  getDeviceTimezone,
  getFailedLoginAttempts,
  getIPGeoData,
  getScreenResolution,
  type IPGeoData,
} from "@/features/settings/utils/sessionUtils";
import { logger } from "@/lib/utils/logger";

const DEVICE_COORDS_STORAGE_KEY = "omaya_device_coords";

type CoordsSource = "gps" | "ip" | "unknown";

const EMPTY_IP_GEO: IPGeoData = {
  ip_address: "Unknown",
  ip_country: "Unknown",
  ip_region: "Unknown",
  ip_city: "Unknown",
  isp: "Unknown",
  is_vpn: false,
};

const readStoredCoordsMeta = (): {
  source: CoordsSource;
  accuracy: number | null;
} => {
  if (typeof sessionStorage === "undefined") {
    return { source: "unknown", accuracy: null };
  }
  try {
    const raw = sessionStorage.getItem(DEVICE_COORDS_STORAGE_KEY);
    if (!raw) return { source: "unknown", accuracy: null };
    const parsed = JSON.parse(raw) as {
      source?: string;
      accuracy?: number;
    };
    const source: CoordsSource =
      parsed.source === "gps"
        ? "gps"
        : parsed.source === "ip"
          ? "ip"
          : "unknown";
    return {
      source,
      accuracy:
        typeof parsed.accuracy === "number" ? parsed.accuracy : null,
    };
  } catch {
    return { source: "unknown", accuracy: null };
  }
};

export type KycDeviceDetailsBundle = {
  userDetails: Record<string, unknown>;
  formContext: Record<string, string | number | boolean | object>;
};

export const defaultKycFormContext = (): KycDeviceDetailsBundle["formContext"] => ({
  device_type: "Unknown",
  device_model: "Unknown",
  browser_type: "Unknown",
  screen_resolution: "Unknown",
  device_timezone: "Unknown",
  os_version: "Unknown",
  device_id: "unknown",
  latitude: "",
  longitude: "",
  precise_location: "Unknown",
  location_source: "unknown",
  gps_accuracy_meters: "",
  location_permission: "unsupported",
  ip_address: "Unknown",
  ip_country: "Unknown",
  ip_region: "Unknown",
  ip_city: "Unknown",
  is_vpn: false,
  isp: "Unknown",
  device_fingerprint: "unknown",
  unique_device_id: "unknown",
  login_patterns: {},
  session_duration: 0,
  failed_login_attempts: 0,
  suspicious_behavior_detected: false,
});

const resolveLocationSource = (
  coordsMeta: ReturnType<typeof readStoredCoordsMeta>,
  deviceInfo: DeviceInfo
): CoordsSource => {
  if (coordsMeta.source !== "unknown") return coordsMeta.source;
  if (deviceInfo.latitude != null && deviceInfo.longitude != null) return "gps";
  return "ip";
};

const buildKycDeviceBundle = (
  deviceInfo: DeviceInfo,
  ipGeo: IPGeoData,
  coordsMeta: ReturnType<typeof readStoredCoordsMeta>
): KycDeviceDetailsBundle => {
  const fingerprint = deviceInfo.fingerprint_data as Record<string, unknown>;
  const fingerprintHash = String(fingerprint.hash ?? "unknown");
  const canvasHash = fingerprint.canvas_hash ?? null;
  const deviceFingerprint = String(
    fingerprint.any_fingerprint_signal ?? fingerprint.hash ?? "unknown"
  );
  const locationSource = resolveLocationSource(coordsMeta, deviceInfo);
  const preciseLocation =
    deviceInfo.location !== "Unknown"
      ? deviceInfo.location
      : ipGeo.ip_city !== "Unknown"
        ? `${ipGeo.ip_city}, ${ipGeo.ip_country}`
        : "Unknown";

  const userDetails: Record<string, unknown> = {
    precise_location: preciseLocation,
    location: preciseLocation,
    latitude: deviceInfo.latitude,
    longitude: deviceInfo.longitude,
    gps_latitude: deviceInfo.latitude,
    gps_longitude: deviceInfo.longitude,
    gps_accuracy_meters: coordsMeta.accuracy,
    location_source: locationSource,
    location_permission: deviceInfo.location_permission,
    device_information: {
      device_type: deviceInfo.device_type,
      device_model: deviceInfo.device_model,
      os_version: deviceInfo.os_version,
      browser_type: getBrowserType(),
      screen_resolution: getScreenResolution(),
      device_timezone: getDeviceTimezone(),
      device_id: deviceInfo.device_id,
      app_version: deviceInfo.app_version,
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
      platform:
        typeof navigator !== "undefined" ? navigator.platform : "Unknown",
      ...(deviceInfo.device_data as Record<string, unknown>),
    },
    network_information: {
      ip_address: ipGeo.ip_address,
      ip_country: ipGeo.ip_country,
      ip_region: ipGeo.ip_region,
      ip_city: ipGeo.ip_city,
      isp: ipGeo.isp,
      is_vpn: ipGeo.is_vpn,
      ...(deviceInfo.network_data as Record<string, unknown>),
    },
    device_fingerprint: {
      device_fingerprint: deviceFingerprint,
      unique_device_id: deviceInfo.device_id,
      fingerprint_hash: fingerprintHash,
      canvas_hash: canvasHash,
      fingerprint_data: deviceInfo.fingerprint_data,
      browser_capabilities: deviceInfo.browser_capabilities,
    },
  };

  const formContext: KycDeviceDetailsBundle["formContext"] = {
    device_type: deviceInfo.device_type,
    device_model: deviceInfo.device_model,
    browser_type: getBrowserType(),
    screen_resolution: getScreenResolution(),
    device_timezone: getDeviceTimezone(),
    os_version: deviceInfo.os_version,
    device_id: deviceInfo.device_id,
    latitude: deviceInfo.latitude ?? "",
    longitude: deviceInfo.longitude ?? "",
    precise_location: preciseLocation,
    location_source: locationSource,
    gps_accuracy_meters: coordsMeta.accuracy ?? "",
    location_permission: deviceInfo.location_permission,
    ip_address: ipGeo.ip_address,
    ip_country: ipGeo.ip_country,
    ip_region: ipGeo.ip_region,
    ip_city: ipGeo.ip_city,
    is_vpn: ipGeo.is_vpn,
    isp: ipGeo.isp,
    device_fingerprint: deviceFingerprint,
    unique_device_id: deviceInfo.device_id,
    login_patterns: {},
    session_duration: 0,
    failed_login_attempts: getFailedLoginAttempts(),
    suspicious_behavior_detected: false,
  };

  return { userDetails, formContext };
};

/** Collect device, GPS, network, and fingerprint data for KYC submit. */
export const collectKycDeviceDetails =
  async (): Promise<KycDeviceDetailsBundle> => {
    if (typeof window === "undefined") {
      return {
        userDetails: {},
        formContext: defaultKycFormContext(),
      };
    }

    const coordsMeta = readStoredCoordsMeta();
    const syncBaseline = buildKycDeviceBundle(
      collectSyncDeviceInfo(),
      EMPTY_IP_GEO,
      coordsMeta
    );

    try {
      const [deviceInfo, ipGeo] = await Promise.all([
        collectDeviceInfo(),
        getIPGeoData(),
      ]);
      return buildKycDeviceBundle(deviceInfo, ipGeo, readStoredCoordsMeta());
    } catch (error) {
      logger.warn("kyc", "Async KYC device enrichment failed, using sync baseline:", error);
      try {
        const ipGeo = await getIPGeoData();
        return buildKycDeviceBundle(
          collectSyncDeviceInfo(),
          ipGeo,
          readStoredCoordsMeta()
        );
      } catch {
        return syncBaseline;
      }
    }
  };
