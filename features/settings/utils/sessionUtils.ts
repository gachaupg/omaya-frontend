import { DeviceSession } from "../types";

import { logger } from '@/lib/utils/logger';

/**
 * Checks if a session with the same IP address already exists
 * @param ipAddress - The IP address to check
 * @param existingSessions - Array of existing device sessions
 * @returns The existing session if found, null otherwise
 */
export const findSessionByIP = (
  ipAddress: string,
  existingSessions: DeviceSession[]
): DeviceSession | null => {
  if (!ipAddress || ipAddress === "Unknown") {
    return null;
  }

  return existingSessions.find(
    (session) => 
      session.ip_address === ipAddress && 
      session.is_active
  ) || null;
};

/**
 * Checks if a session should be created based on IP address
 * @param ipAddress - The IP address to check
 * @param existingSessions - Array of existing device sessions
 * @returns true if session should be created, false if duplicate exists
 */
export const shouldCreateSession = (
  ipAddress: string,
  existingSessions: DeviceSession[]
): boolean => {
  const existingSession = findSessionByIP(ipAddress, existingSessions);
  return !existingSession;
};

/**
 * Gets the current IP address using external API
 * @returns Promise<string> - The IP address or "Unknown" if failed
 */
export const getCurrentIPAddress = async (): Promise<string> => {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    if (response.ok) {
      const data = await response.json();
      return data.ip;
    }
  } catch (error) {
    logger.warn('dashboard', "Failed to get IP address:", error);
  }
  return "Unknown";
};

/**
 * Gets location information from IP address
 * @param ipAddress - The IP address to get location for
 * @returns Promise<string> - Location string or "Unknown" if failed
 */
export const getLocationFromIP = async (ipAddress: string): Promise<string> => {
  if (!ipAddress || ipAddress === "Unknown") {
    return "Unknown";
  }

  try {
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
    if (response.ok) {
      const data = await response.json();
      return `${data.city || "Unknown"}, ${data.country_name || "Unknown"}`;
    }
  } catch (error) {
    logger.warn('dashboard', "Failed to get location from IP:", error);
  }
  return "Unknown";
};

/** Get device type (Windows, iOS, Android, etc.) */
const getDeviceType = (): string => {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown";
};

/** Device info: device type, screen, platform, hardware concurrency, etc. */
export const getDeviceData = (): Record<string, unknown> => {
  if (typeof navigator === "undefined" || typeof screen === "undefined") {
    return { device_type: "Unknown" };
  }
  return {
    device_type: getDeviceType(),
    screen_width: screen.width,
    screen_height: screen.height,
    color_depth: screen.colorDepth,
    pixel_ratio: typeof window !== "undefined" ? window.devicePixelRatio : undefined,
    platform: navigator.platform,
    hardware_concurrency: navigator.hardwareConcurrency,
    device_memory: (navigator as any).deviceMemory,
    language: navigator.language,
    languages: Array.isArray(navigator.languages) ? navigator.languages : [navigator.language],
    timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
    vendor: navigator.vendor,
    max_touch_points: navigator.maxTouchPoints,
  };
};

/** Network info: connection type, effectiveType, onLine, etc. */
export const getNetworkData = (): Record<string, unknown> => {
  if (typeof navigator === "undefined") return { online: false };
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  const base: Record<string, unknown> = {
    online: navigator.onLine,
  };
  if (conn) {
    base.effective_type = conn.effectiveType;
    base.downlink = conn.downlink;
    base.rtt = conn.rtt;
    base.save_data = conn.saveData;
  }
  return base;
};

/** Simple browser fingerprint (hash from userAgent, timezone, language, etc.) */
export const getFingerprintData = (): Record<string, unknown> => {
  if (typeof navigator === "undefined") return { hash: "unknown" };
  const components: string[] = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    typeof screen !== "undefined" ? `${screen.width}x${screen.height}` : "",
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "",
    navigator.hardwareConcurrency?.toString() || "",
  ];
  let hash = 0;
  const str = components.join("|");
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash = hash & hash;
  }
  return {
    hash: String(Math.abs(hash)),
    user_agent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
  };
};

/** Browser capabilities: cookies, localStorage, WebGL, etc. */
export const getBrowserCapabilities = (): Record<string, unknown> => {
  if (typeof navigator === "undefined") return { cookies_enabled: false };
  let localStorageAvailable = false;
  let sessionStorageAvailable = false;
  let webglAvailable = false;
  try {
    const t = "__cap_test__";
    localStorage.setItem(t, t);
    localStorage.removeItem(t);
    localStorageAvailable = true;
  } catch {}
  try {
    const t = "__cap_test__";
    sessionStorage.setItem(t, t);
    sessionStorage.removeItem(t);
    sessionStorageAvailable = true;
  } catch {}
  try {
    const c = typeof document !== "undefined" ? document.createElement("canvas") : null;
    const gl = c ? (c.getContext("webgl") || c.getContext("experimental-webgl")) : null;
    webglAvailable = !!gl;
  } catch {}
  return {
    cookies_enabled: navigator.cookieEnabled,
    localStorage_available: localStorageAvailable,
    session_storage_available: sessionStorageAvailable,
    webgl_available: webglAvailable,
    java_enabled: typeof navigator.javaEnabled === "function" ? navigator.javaEnabled() : false,
    pdf_viewer: navigator.pdfViewerEnabled ?? false,
  };
};

/** Get stored failed login attempts from localStorage if any */
export const getFailedLoginAttempts = (): number => {
  if (typeof localStorage === "undefined") return 0;
  try {
    const v = localStorage.getItem("failed_login_attempts");
    if (v) return parseInt(v, 10) || 0;
  } catch {}
  return 0;
};

/** Get browser type (Chrome, Firefox, Safari, etc.) */
export const getBrowserType = (): string => {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  return "Unknown";
};

/** Get screen resolution string */
export const getScreenResolution = (): string => {
  if (typeof screen === "undefined") return "Unknown";
  return `${screen.width}x${screen.height}`;
};

/** Get device timezone */
export const getDeviceTimezone = (): string => {
  if (typeof Intl === "undefined") return "Unknown";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "Unknown";
  }
};

/** Extended IP geo data (country, region, city, isp, etc.) */
export interface IPGeoData {
  ip_address: string;
  ip_country: string;
  ip_region: string;
  ip_city: string;
  isp: string;
  is_vpn: boolean;
}

export const getIPGeoData = async (): Promise<IPGeoData> => {
  const fallback: IPGeoData = {
    ip_address: "Unknown",
    ip_country: "Unknown",
    ip_region: "Unknown",
    ip_city: "Unknown",
    isp: "Unknown",
    is_vpn: false,
  };
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    if (!ipRes.ok) return fallback;
    const ipData = await ipRes.json();
    const ip = ipData.ip;
    if (!ip) return fallback;

    const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!geoRes.ok) return { ...fallback, ip_address: ip };
    const geo = await geoRes.json();
    return {
      ip_address: ip,
      ip_country: geo.country_name || "Unknown",
      ip_region: geo.region || "Unknown",
      ip_city: geo.city || "Unknown",
      isp: geo.org || "Unknown",
      is_vpn: false, // ipapi.co free tier doesn't provide VPN detection
    };
  } catch (error) {
    logger.warn('dashboard', "Failed to get IP geo data:", error);
    return fallback;
  }
};

/** Collect all KYC context data for submit */
export const getKYCContextData = async (): Promise<Record<string, string | number | boolean | object>> => {
  const deviceData = getDeviceData();
  const fpData = getFingerprintData();
  const geo = await getIPGeoData();
  return {
    device_type: (deviceData.device_type as string) || "Unknown",
    device_model: typeof navigator !== "undefined" ? navigator.platform : "Unknown",
    browser_type: getBrowserType(),
    screen_resolution: getScreenResolution(),
    device_timezone: getDeviceTimezone(),
    ip_address: geo.ip_address,
    ip_country: geo.ip_country,
    ip_region: geo.ip_region,
    ip_city: geo.ip_city,
    is_vpn: geo.is_vpn,
    isp: geo.isp,
    device_fingerprint: (fpData.hash as string) || "unknown",
    unique_device_id: (fpData.hash as string) || "unknown",
    login_patterns: {},
    session_duration: 0,
    failed_login_attempts: getFailedLoginAttempts(),
    suspicious_behavior_detected: false,
  };
};
