import type { AppDispatch } from "@/store";
import {
  createDeviceSession,
  fetchDeviceSessions,
} from "@/features/settings/slices/settingsSlice";
import type {
  CreateDeviceSessionPayload,
  DeviceSession,
} from "@/features/settings/types";
import {
  getCurrentIPAddress,
  getLocationFromIP,
  getDeviceData,
  getNetworkData,
  getFingerprintData,
  getBrowserCapabilities,
  getFailedLoginAttempts,
} from "@/features/settings/utils/sessionUtils";
import { persistCurrentDeviceSessionId } from "./deviceSessionStorage";
import { pickCurrentDeviceSession } from "./deviceSessionRevocation";
import { logger } from "@/lib/utils/logger";

const getDeviceType = (): string => {
  const userAgent = navigator.userAgent;
  if (/Android/i.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Mac/i.test(userAgent)) return "macOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Unknown";
};

const getBrowserInfo = (userAgent: string): string => {
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  return "Unknown Browser";
};

function buildCreatePayload(
  ipAddress: string,
  location: string
): CreateDeviceSessionPayload {
  const userAgent = navigator.userAgent;
  return {
    ip_address: ipAddress,
    location,
    browser: getBrowserInfo(userAgent),
    description: `${getDeviceType()} - ${getBrowserInfo(userAgent)}`,
    sign_in_time: new Date().toISOString(),
    user_agent: userAgent,
    device_type: getDeviceType(),
    device_data: getDeviceData(),
    network_data: getNetworkData(),
    fingerprint_data: getFingerprintData(),
    browser_capabilities: getBrowserCapabilities(),
    login_patterns: {},
    session_duration: 0,
    failed_login_attempts: getFailedLoginAttempts(),
    suspicious_behavior_detected: false,
  };
}

function trackSessionsFromList(sessions: DeviceSession[]): boolean {
  const current = pickCurrentDeviceSession(sessions);
  if (current?.session_id) {
    persistCurrentDeviceSessionId(current.session_id);
    return true;
  }
  return false;
}

/**
 * Ensures this browser has an active device session after login.
 * Safe to call multiple times (deduped by IP / existing current session).
 */
export async function ensureDeviceSessionForBrowser(
  dispatch: AppDispatch,
  existingSessions: DeviceSession[] = []
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    let currentSessions = existingSessions;
    if (!currentSessions?.length) {
      try {
        const fetched = await dispatch(fetchDeviceSessions()).unwrap();
        currentSessions = Array.isArray(fetched) ? fetched : [];
      } catch {
        currentSessions = [];
      }
    }

    if (trackSessionsFromList(currentSessions)) {
      return true;
    }

    const ipAddress = await getCurrentIPAddress();
    const location = await getLocationFromIP(ipAddress);

    const existingByIp = (currentSessions || []).find(
      (session: DeviceSession) =>
        session?.ip_address === ipAddress && session.is_active !== false
    );
    if (existingByIp?.session_id) {
      persistCurrentDeviceSessionId(existingByIp.session_id);
      return true;
    }

    const payload = buildCreatePayload(ipAddress, location);
    const created = await dispatch(createDeviceSession(payload)).unwrap();

    const createdList = Array.isArray(created) ? created : created ? [created] : [];
    if (createdList.length > 0) {
      trackSessionsFromList(createdList as DeviceSession[]);
    } else {
      const refreshed = await dispatch(fetchDeviceSessions()).unwrap();
      trackSessionsFromList(Array.isArray(refreshed) ? refreshed : []);
    }

    logger.debug("device-session", "ensureDeviceSessionForBrowser: created session");
    return true;
  } catch (error) {
    logger.warn("device-session", "ensureDeviceSessionForBrowser failed", error);
    return false;
  }
}
