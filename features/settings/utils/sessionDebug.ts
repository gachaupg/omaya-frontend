import { DeviceSession } from "../types";

import { logger } from '@/lib/utils/logger';

/**
 * Debug utility for session management
 */
export const sessionDebug = {
  /**
   * Log current session state
   */
  logSessionState: (sessions: DeviceSession[]) => {
    console.group("🔍 Session Debug Info");
    logger.debug('dashboard', "Total sessions:", sessions.length);
    logger.debug('dashboard', "Active sessions:", sessions.filter(s => s.is_active).length);
    logger.debug('dashboard', "Current sessions:", sessions.filter(s => s.is_current).length);
    
    if (sessions.length > 0) {
      console.table(sessions.map(s => ({
        id: s.session_id,
        ip: s.ip_address,
        location: s.location,
        browser: s.browser,
        active: s.is_active,
        current: s.is_current,
        signInTime: s.sign_in_time
      })));
    }
    console.groupEnd();
  },

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
      console.warn("⚠️ Found duplicate IP addresses:", duplicates);
    } else {
      logger.debug('dashboard', "✅ No duplicate IP addresses found");
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
      console.warn("⚠️ Session validation issues:", issues);
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
