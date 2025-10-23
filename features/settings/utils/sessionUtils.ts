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
