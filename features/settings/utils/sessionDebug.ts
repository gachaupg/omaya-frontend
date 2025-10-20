import { DeviceSession } from "../types";

/**
 * Debug utility for session management
 */
export const sessionDebug = {

  /**
   * Check for duplicate IP addresses
   */
  checkDuplicateIPs: (sessions: DeviceSession[]) => {
    const ipCounts = new Map<string, number>();
    
    sessions.forEach(session => {
      const ip = session.ip_address;
      ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
    });

    const duplicates = Array.from(ipCounts.entries())
      .filter(([ip, count]) => count > 1)
      .map(([ip, count]) => ({ ip, count }));

    if (duplicates.length > 0) {
    } else {
    }

    return duplicates;
  },

  /**
   * Validate session data
   */
  validateSession: (session: DeviceSession) => {
    const issues: string[] = [];
    
    if (!session.session_id) issues.push("Missing session_id");
    if (!session.ip_address) issues.push("Missing ip_address");
    if (!session.browser) issues.push("Missing browser");
    if (!session.sign_in_time) issues.push("Missing sign_in_time");
    
    if (issues.length > 0) {
      return false;
    }
    
    return true;
  },

  /**
   * Get browser environment info
   */
  getBrowserInfo: () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      timestamp: new Date().toISOString()
    };
  }
};
