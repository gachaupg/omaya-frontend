import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../../store";
import {
  fetchDeviceSessions,
  logoutDevice,
  logoutAllDevices,
  toggleTwoFactor,
  createDeviceSession,
} from "../../slices/settingsSlice";
import { logout } from "../../../auth/slices/authSlice";
import { DeviceSession, CreateDeviceSessionPayload } from "../../types";
import { showToast } from "../../../../lib/utils/toast";
import {
  getActiveSessions,
  BrowserSession,
} from "../../../../lib/utils/browserUtils";
import { enable2FA, verify2FASetup } from "../../../auth/slices/authSlice";
import { getCurrentIPAddress, getLocationFromIP } from "../../utils/sessionUtils";

import { logger } from '@/lib/utils/logger';

// Helper functions for device info
const getDeviceType = (): string => {
  const userAgent = navigator.userAgent;
  if (/Android/i.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Mac/i.test(userAgent)) return "macOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Unknown";
};

const getBrowserInfo = (): string => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  return "Unknown Browser";
};

// Custom hook for 2FA state management with localStorage persistence
const use2FAState = () => {
  const [twoFA, setTwoFA] = useState<boolean>(() => {
    // Initialize from localStorage immediately
    const stored2FA = localStorage.getItem('twoFA_enabled');
    logger.debug('dashboard', `Initializing 2FA state from localStorage: ${stored2FA}`);
    // Check if the stored value indicates 2FA is enabled
    return stored2FA === 'true' || stored2FA === '{"error":"2FA already enabled."}' || stored2FA?.includes('2FA already enabled') || false;
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load 2FA status from localStorage on component mount
    const stored2FA = localStorage.getItem('twoFA_enabled');
    logger.debug('dashboard', `Component mounted, localStorage value: ${stored2FA}`);
    if (stored2FA !== null) {
      // Check if the stored value indicates 2FA is enabled
      const newState = stored2FA === 'true' || stored2FA === '{"error":"2FA already enabled."}' || stored2FA?.includes('2FA already enabled') || false;
      setTwoFA(newState);
      logger.debug('dashboard', `Set 2FA state to: ${newState}`);
    }
    setIsInitialized(true);
  }, []);

  const update2FA = (enabled: boolean, responseText?: string) => {
    logger.debug('dashboard', `Updating 2FA state from ${twoFA} to ${enabled}`);
    setTwoFA(enabled);
    
    // Always store the actual response text, never boolean
    if (responseText) {
      localStorage.setItem('twoFA_enabled', responseText);
    } else if (enabled) {
      localStorage.setItem('twoFA_enabled', '{"error":"2FA already enabled."}');
    } else {
      localStorage.setItem('twoFA_enabled', '{"status":"2FA disabled"}');
    }
    logger.debug('dashboard', `2FA state updated to: ${enabled}, localStorage set to: ${localStorage.getItem('twoFA_enabled')}`);
  };

  return { twoFA, update2FA, isInitialized };
};

const PrivacySecurity = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    security,
    deviceSessions,
    deviceSessionsLoading,
    deviceSessionsError,
    updating,
  } = useSelector((state: any) => state.settings);
  const { isAuthenticated } = useSelector((state: any) => state.auth);

  // Use custom hook for 2FA state management
  const { twoFA, update2FA, isInitialized } = use2FAState();
  
  const [fallbackSessions, setFallbackSessions] = useState<DeviceSession[]>([]);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 5;

  // Enhanced logout states
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutMode, setLogoutMode] = useState<"all" | "one-by-one" | null>(
    null
  );
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutProgress, setLogoutProgress] = useState(0);
  const [currentLogoutSession, setCurrentLogoutSession] =
    useState<DeviceSession | null>(null);

  // Track session creation to prevent premature auto-logout
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Convert browser sessions to device sessions format
  const convertBrowserSessionsToDeviceSessions = (
    browserSessions: BrowserSession[]
  ): DeviceSession[] => {
    return browserSessions.map((session, index) => ({
      id: index + 1,
      session_id: `browser-session-${index}`,
      ip_address: session.ip,
      location: session.location,
      browser: session.browser,
      sign_in_time: session.time,
      is_active: true,
      last_activity: session.time,
      is_current: index === 0,
      user_agent: session.userAgent,
      device_type: session.platform,
    }));
  };

  useEffect(() => {
    // Fetch device sessions on component mount
    dispatch(fetchDeviceSessions())
      .unwrap()
      .then((data) => {
        logger.debug('dashboard', "Device sessions loaded from API:", data);
        logger.debug('dashboard', "Data type:", typeof data);
        logger.debug('dashboard', "Is array:", Array.isArray(data));
        logger.debug('dashboard', "Data length:", data?.length);
      })
      .catch(async (error: unknown) => {
        console.error("Error loading device sessions:", error);
        
        // Only use fallback if it's a network error, not an auth error
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes("401") && !errorMessage.includes("403")) {
          // Fallback to local browser sessions
          try {
            const browserSessions = await getActiveSessions();
            const deviceSessions =
              convertBrowserSessionsToDeviceSessions(browserSessions);
            setFallbackSessions(deviceSessions);
            logger.debug('dashboard', "Using fallback browser sessions:", deviceSessions);
          } catch (fallbackError) {
            console.error("Error loading fallback sessions:", fallbackError);
          }
        } else {
          logger.debug('dashboard', "Auth error detected, not using fallback sessions");
        }
      });

    // Check current 2FA status from server to sync with local state
    const check2FAFromServer = async () => {
      try {
        const result = await dispatch(enable2FA()).unwrap();
        // If we reach here, 2FA was not enabled, so we can show QR code
        update2FA(false);
        logger.debug('dashboard', "2FA is not enabled on server");
      } catch (error: any) {
        // If we get "2FA already enabled" error, update local state
        if (error?.error === "2FA already enabled." || 
            error?.message === "2FA already enabled." ||
            error?.includes("2FA already enabled")) {
          update2FA(true, error.message); // Store the actual error message
          logger.debug('dashboard', "2FA is already enabled on server - setting state to enabled");
        } else {
          console.error("Failed to check 2FA status:", error);
          // Keep the current local state if we can't check server status
        }
      }
    };

    // Only check from server if we don't have a stored value
    const stored2FA = localStorage.getItem('twoFA_enabled');
    if (stored2FA === null) {
      // No stored value, check from server
      check2FAFromServer();
    } else {
      // We have a stored value, use it and don't override
      const storedValue = stored2FA === 'true' || stored2FA === '{"error":"2FA already enabled."}' || stored2FA?.includes('2FA already enabled') || false;
      // Use update2FA but pass the existing stored value to prevent overwriting
      update2FA(storedValue, stored2FA);
      logger.debug('dashboard', `Using stored 2FA value: ${storedValue}`);
    }
  }, [dispatch, isAuthenticated]); // Added isAuthenticated to dependencies

  useEffect(() => {
    // Sync Redux state with localStorage when security settings change
    // Only sync if we don't already have a valid localStorage value
    const stored2FA = localStorage.getItem('twoFA_enabled');
    const hasValidStoredValue = stored2FA && (stored2FA === 'true' || stored2FA === '{"error":"2FA already enabled."}' || stored2FA?.includes('2FA already enabled'));
    
    if (isInitialized && security?.two_factor_enabled !== undefined && !hasValidStoredValue) {
      update2FA(security.two_factor_enabled);
    }
  }, [security?.two_factor_enabled, isInitialized]);

  const handleTwoFactorToggle = async (enabled: boolean) => {
    if (enabled) {
      try {
        setVerifyError(null);
        setVerifyLoading(true);
        
        // Try to enable 2FA
        const result = await dispatch(enable2FA()).unwrap();
        // If we reach here, 2FA was not enabled, show QR code for setup
        setQrData(result.qr_code || result.qrCode || result.qr || null);
        setShow2FAModal(true);
      } catch (error: any) {
        // If we get "2FA already enabled" error, it means 2FA is enabled
        if (error?.error === "2FA already enabled." || 
            error?.message === "2FA already enabled." ||
            error?.includes("2FA already enabled")) {
          update2FA(true, error.message); // Store the actual error message
          showToast.success("2FA is already enabled!");
        } else {
          setVerifyError("Failed to check 2FA status: " + (error?.message || error));
        }
      } finally {
        setVerifyLoading(false);
      }
    } else {
      try {
        const result = await dispatch(toggleTwoFactor(false)).unwrap();
        update2FA(false, JSON.stringify(result)); // Store the disable response
      } catch (error) {
        setVerifyError("Failed to disable 2FA: " + error);
      }
    }
  };

  const handleVerify2FA = async () => {
    setVerifyLoading(true);
    setVerifyError(null);
    try {
      const result = await dispatch(verify2FASetup({ code: verifyCode })).unwrap();
      setShow2FAModal(false);
      update2FA(true, JSON.stringify(result)); // Store the success response
      showToast.success("2FA enabled successfully!");
    } catch (error) {
      setVerifyError("Invalid code or failed to verify: " + error);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleSignOutAllDevices = async () => {
    setShowLogoutModal(true);
  };

  const handleLogoutAllDevices = async () => {
    setLogoutLoading(true);
    setLogoutMode("all");
    setLogoutProgress(0);

    try {
      await dispatch(logoutAllDevices()).unwrap();
      setLogoutProgress(100);
      showToast.success("All devices logged out successfully");

      // Log out locally and redirect to login page
      dispatch(logout());
      if (typeof window !== "undefined") {
        // Clear all localStorage data
        localStorage.clear();
        // Clear all cookies
        document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        document.cookie = "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        document.cookie = "twoFA_enabled=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        // Clear sessionStorage
        sessionStorage.clear();
        // Clear any other stored data
        if (typeof window !== 'undefined' && 'indexedDB' in window) {
          window.indexedDB.databases().then(databases => {
            databases.forEach(db => {
              if (db.name) {
                window.indexedDB.deleteDatabase(db.name);
              }
            });
          });
        }
        // Redirect to login page
        window.location.href = "/auth/login";
      }
    } catch (error) {
      console.error("Failed to logout all devices:", error);
      showToast.error("Failed to logout all devices");
    } finally {
      setLogoutLoading(false);
      setShowLogoutModal(false);
      setLogoutMode(null);
      setLogoutProgress(0);
    }
  };

  const handleLogoutOneByOne = async () => {
    setLogoutLoading(true);
    setLogoutMode("one-by-one");
    setLogoutProgress(0);

    const activeSessions = deviceSessions.filter(
      (session: DeviceSession) => session.is_active && !session.is_current
    );
    const totalSessions = activeSessions.length;

    if (totalSessions === 0) {
      showToast.info("No other active sessions to logout");
      setLogoutLoading(false);
      setShowLogoutModal(false);
      setLogoutMode(null);
      return;
    }

    try {
      for (let i = 0; i < activeSessions.length; i++) {
        const session: DeviceSession = activeSessions[i];
        setCurrentLogoutSession(session);
        setLogoutProgress(((i + 1) / totalSessions) * 100);

        await dispatch(logoutDevice(session.session_id)).unwrap();
        await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay for UX
      }

      showToast.success("All other devices logged out successfully");
    } catch (error) {
      console.error("Failed to logout devices one by one:", error);
      showToast.error("Failed to logout some devices");
    } finally {
      setLogoutLoading(false);
      setShowLogoutModal(false);
      setLogoutMode(null);
      setLogoutProgress(0);
      setCurrentLogoutSession(null);
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
    setLogoutMode(null);
    setLogoutProgress(0);
    setCurrentLogoutSession(null);
  };

  const handleRemoveSession = async (sessionToRemove: DeviceSession) => {
    try {
      await dispatch(logoutDevice(sessionToRemove.session_id)).unwrap();
      showToast.success("Device session removed successfully");
    } catch (error) {
      console.error("Failed to remove device session:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getBrowserInfo = (userAgent: string) => {
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Unknown Browser";
  };

  // Filter out any invalid sessions and ensure type safety
  const validDeviceSessions = (deviceSessions || []).filter(
    (session: any): session is DeviceSession => {
      const isValid =
        session &&
        typeof session === "object" &&
        session.session_id &&
        session.sign_in_time &&
        session.ip_address &&
        session.location &&
        session.browser;

      if (!isValid) {
        logger.debug('dashboard', "Invalid session filtered out:", session);
      }

      return isValid;
    }
  );

  // Use API sessions if available, otherwise use fallback sessions
  const allSessions =
    validDeviceSessions.length > 0 ? validDeviceSessions : fallbackSessions;

  // Check if there are any signed-in devices (excluding current device)
  const hasOtherActiveSessions = allSessions.some(
    (session: DeviceSession) => session.is_active && !session.is_current
  );

  // Check if there are any signed-in devices at all
  const hasAnyActiveSessions = allSessions.some(
    (session: DeviceSession) => session.is_active
  );

  // Auto logout if no devices are signed in
  useEffect(() => {
    const checkAndAutoLogout = () => {
      const hasAnyActiveSessions = allSessions.some(
        (session: DeviceSession) => session.is_active
      );

      // Auto-logout conditions:
      // 1. Not currently loading sessions
      // 2. User is authenticated (to avoid logging out unauthenticated users)
      // 3. No active sessions found
      // 4. Not on auth pages (to avoid logging out during login process)
      // 5. Not currently creating a session
      if (
        !deviceSessionsLoading &&
        isAuthenticated &&
        !hasAnyActiveSessions &&
        !isCreatingSession &&
        typeof window !== "undefined" &&
        !window.location.pathname.includes('/auth/')
      ) {
        logger.debug('dashboard', "No active devices detected, auto logging out...");
        logger.debug('dashboard', "Sessions state:", {
          totalSessions: allSessions.length,
          activeSessions: allSessions.filter((s: DeviceSession) => s.is_active).length,
          deviceSessionsLoading,
          isAuthenticated
        });
        
        showToast.info("No active devices detected, logging out automatically");

        // Auto logout after a short delay
        setTimeout(() => {
          logger.debug('dashboard', "Executing auto logout...");
          dispatch(logout());
          if (typeof window !== "undefined") {
            // Clear all localStorage data
            localStorage.clear();
            // Clear all cookies
            document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
            document.cookie = "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
            document.cookie = "twoFA_enabled=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
            // Clear sessionStorage
            sessionStorage.clear();
            // Clear any other stored data
            if (typeof window !== 'undefined' && 'indexedDB' in window) {
              window.indexedDB.databases().then(databases => {
                databases.forEach(db => {
                  if (db.name) {
                    window.indexedDB.deleteDatabase(db.name);
                  }
                });
              });
            }
            // Redirect to login page
            window.location.href = "/auth/login";
          }
        }, 2000);
      }
    };

    // Check after sessions are loaded
    if (!deviceSessionsLoading) {
      checkAndAutoLogout();
    }
  }, [deviceSessionsLoading, allSessions, isAuthenticated, isCreatingSession, dispatch]);

  const totalPages = Math.ceil(allSessions.length / sessionsPerPage);
  const paginatedSessions = allSessions.slice(
    (currentPage - 1) * sessionsPerPage,
    currentPage * sessionsPerPage
  );

  // Debug logging
  logger.debug('dashboard', "Device sessions state:", {
    deviceSessions,
    deviceSessionsLoading,
    deviceSessionsError,
    validDeviceSessions: validDeviceSessions.length,
    fallbackSessions: fallbackSessions.length,
    allSessions: allSessions.length,
  });

  return (
    <>
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="dark:bg-[#23232B] bg-white p-4 sm:p-6 rounded-xl w-full max-w-md sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2 dark:text-white text-gray-900">
              Enable 2FA
            </h3>
            {qrData && (
              <div className="flex flex-col items-center mb-3 sm:mb-4">
                <img
                  src={qrData}
                  alt="2FA QR Code"
                  className="w-32 h-32 sm:w-40 sm:h-40 mb-2"
                />
                <div className="text-xs dark:text-[#8C8CA1] text-gray-600 break-all px-2 text-center">
                  Scan this QR code with your authenticator app.
                </div>
              </div>
            )}
            <input
              type="text"
              className="w-full p-2 sm:p-2.5 rounded dark:border-[#35353E] border-gray-300 border mb-2 dark:bg-[#18181D] bg-gray-100 dark:text-white text-gray-900 text-sm sm:text-base"
              placeholder="Enter code from app"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              disabled={verifyLoading}
            />
            {verifyError && (
              <div className="text-red-500 text-xs sm:text-sm mb-2 break-words">{verifyError}</div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                className="flex-1 bg-[#1D8751] text-white rounded px-4 py-2 sm:py-2.5 font-semibold"
                onClick={handleVerify2FA}
                disabled={verifyLoading}
              >
                {verifyLoading ? "Verifying..." : "Verify"}
              </button>
              <button
                className="flex-1 dark:bg-[#35353E] bg-gray-400 dark:text-white text-gray-900 rounded px-4 py-2 sm:py-2.5 font-semibold"
                onClick={() => setShow2FAModal(false)}
                disabled={verifyLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="dark:bg-[#23232B] bg-white p-4 sm:p-6 rounded-xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 dark:text-white text-gray-900">
              Sign Out Options
            </h3>

            {!logoutLoading ? (
              <>
                <div className="dark:text-[#8C8CA1] text-gray-600 text-sm mb-4">
                  Choose how you want to sign out from your devices:
                </div>

                <div className="flex flex-col gap-3 mb-4">
                  <button
                    className="w-full py-2.5 sm:py-3 px-4 rounded-xl border border-[#E23D3A] text-[#E23D3A] hover:bg-[#E23D3A] hover:text-white transition font-semibold text-sm"
                    onClick={handleLogoutAllDevices}
                  >
                    Sign out from ALL devices (including this one)
                    <div className="text-xs mt-1 opacity-75">
                      {
                        allSessions.filter((s: DeviceSession) => s.is_active)
                          .length
                      }{" "}
                      active sessions
                    </div>
                  </button>

                  <button
                    className={`w-full py-2.5 sm:py-3 px-4 rounded-xl border transition font-semibold text-sm ${
                      hasOtherActiveSessions
                        ? "border-[#1D8751] text-[#1D8751] hover:bg-[#1D8751] hover:text-white"
                        : "border-[#808080] text-[#808080] cursor-not-allowed"
                    }`}
                    onClick={handleLogoutOneByOne}
                    disabled={!hasOtherActiveSessions}
                  >
                    Sign out from other devices only
                    <div className="text-xs mt-1 opacity-75">
                      {hasOtherActiveSessions
                        ? `${
                            allSessions.filter(
                              (s: DeviceSession) => s.is_active && !s.is_current
                            ).length
                          } other active sessions`
                        : "No other active sessions"}
                    </div>
                  </button>
                </div>

                <button
                  className="w-full py-2 rounded-xl dark:bg-[#35353E] bg-gray-400 dark:text-white text-gray-900 font-semibold text-sm"
                  onClick={handleCancelLogout}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div className="dark:text-[#8C8CA1] text-gray-600 text-sm mb-4">
                  {logoutMode === "all"
                    ? "Signing out from all devices..."
                    : "Signing out from other devices..."}
                </div>

                {/* Progress bar */}
                <div className="w-full dark:bg-[#35353E] bg-gray-300 rounded-full h-2 mb-4">
                  <div
                    className="bg-[#1D8751] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${logoutProgress}%` }}
                  ></div>
                </div>

                {logoutMode === "one-by-one" && currentLogoutSession && (
                  <div className="dark:text-[#8C8CA1] text-gray-600 text-xs mb-4">
                    Currently signing out: {currentLogoutSession.browser} -{" "}
                    {currentLogoutSession.location}
                  </div>
                )}

                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#1D8751]"></div>
                  <span className="ml-3 dark:text-[#8C8CA1] text-gray-600 text-sm">
                    {Math.round(logoutProgress)}% Complete
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="p-3 dark:text-white text-gray-900 flex flex-col gap-4 w-full">
        {/* 2 Factor Authentication */}
        <div className="w-full dark:border-[#35353E] border-gray-300 border-2 rounded-2xl p-4 flex flex-col gap-4 max-w-none mx-auto dark:bg-[#1D1D23] bg-gray-50">
          <div className="text-base font-semibold mb-2 dark:text-white text-gray-900">
            2 Factor Authentication
          </div>
          <div className="flex gap-3 mb-2">
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold border transition-all ${
                twoFA
                  ? "bg-[#1D8751] text-white border-[#1D8751]"
                  : "bg-transparent dark:text-[#808080] text-gray-600 dark:border-[#35353E] border-gray-300"
              }`}
              onClick={() => handleTwoFactorToggle(true)}
              disabled={updating}
            >
              <span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="#fff"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </span>
              Yes
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold border transition-all ${
                !twoFA
                  ? "bg-[#E23D3A] text-white border-[#E23D3A]"
                  : "bg-transparent dark:text-[#808080] text-gray-600 dark:border-[#35353E] border-gray-300"
              }`}
              onClick={() => handleTwoFactorToggle(false)}
              disabled={updating}
            >
              <span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <path
                    d="M9 9l6 6M15 9l-6 6"
                    stroke="#fff"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </span>
              No
            </button>
          </div>
          {updating && (
            <div className="text-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#1D8751] mx-auto"></div>
              <span className="dark:text-[#808080] text-gray-500 text-xs ml-2">
                Updating 2FA...
              </span>
            </div>
          )}
          <button
            className={`w-full py-2 rounded-xl border font-semibold text-sm transition ${
              hasAnyActiveSessions
                ? "border-[#1D8751] text-[#1D8751] hover:bg-[#1D8751] hover:text-white"
                : "border-[#808080] text-[#808080] cursor-not-allowed"
            }`}
            onClick={handleSignOutAllDevices}
            disabled={!hasAnyActiveSessions}
          >
            {hasAnyActiveSessions
              ? `Sign out from all devices (${
                  allSessions.filter((s: DeviceSession) => s.is_active).length
                } active)`
              : "No active sessions to sign out from"}
          </button>
        </div>

        {/* Active Device Sessions */}
        <div className="w-full dark:border-[#35353E] border-gray-300 border-2 rounded-2xl p-4 max-w-none mx-auto dark:bg-[#1D1D23] bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-base font-semibold">
              Active Device Sessions
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => dispatch(fetchDeviceSessions())}
                className="text-[#1D8751] text-sm hover:underline"
                disabled={deviceSessionsLoading}
              >
                {deviceSessionsLoading ? "Refreshing..." : "Refresh"}
              </button>
              {/* <button
              onClick={async () => {
                // Load fallback sessions for testing
                try {
                  const browserSessions = await getActiveSessions();
                  const deviceSessions =
                    convertBrowserSessionsToDeviceSessions(browserSessions);
                  setFallbackSessions(deviceSessions);
                  logger.debug('dashboard', "Loaded fallback sessions:", deviceSessions);
                } catch (error) {
                  console.error("Error loading fallback sessions:", error);
                }
              }}
              className="text-[#FACC15] text-sm hover:underline"
            >
              Load Local
            </button> */}
            </div>
          </div>
          <div className="dark:text-[#808080] text-gray-600 text-sm mb-3">
             These Devices Are Currently Signed In To Your Account
             <div className="text-[#1D8751] text-xs mt-1">
               💡 Duplicate sessions from the same IP address are automatically prevented
             </div>
             {isCreatingSession && (
               <div className="text-[#FACC15] text-xs mt-1">
               🔄 Creating new session...
             </div>
             )}
            {/* <div className="text-[#1D8751] text-xs mt-1">
            Total Sessions: {allSessions.length}
          </div> */}
            {/* {fallbackSessions.length > 0 && validDeviceSessions.length === 0 && (
            <div className="text-[#FACC15] text-xs mt-1">
              ⚠️ Using local session data (API unavailable)
            </div>
          )}
          {validDeviceSessions.length > 0 && (
            <div className="text-[#1D8751] text-xs mt-1">
              ✅ Using API data ({validDeviceSessions.length} sessions)
            </div>
          )} */}
          </div>

          {deviceSessionsError && (
            <div className="text-red-500 text-sm mb-3">
              Error: {deviceSessionsError}
            </div>
          )}

          {deviceSessionsLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#1D8751]"></div>
              <span className="ml-3 dark:text-[#808080] text-gray-600 text-sm">
                Loading device sessions...
              </span>
            </div>
          ) : paginatedSessions.length === 0 ? (
            <div className="text-center py-6 dark:text-[#808080] text-gray-600 text-sm">
              No active device sessions found
              {deviceSessionsError && (
                <div className="mt-2 text-xs text-red-400">
                  API Error: {deviceSessionsError}
                </div>
              )}
              {/* Debug info */}
              <div className="mt-2 text-xs text-gray-500">
                Raw sessions: {deviceSessions?.length || 0} | Valid sessions:{" "}
                {validDeviceSessions.length} | Fallback:{" "}
                {fallbackSessions.length} | Total: {allSessions.length}
              </div>
                             {/* Manual session creation button for testing */}
               {isAuthenticated && (
                 <button
                   onClick={async () => {
                     try {
                       setIsCreatingSession(true);
                       const ipAddress = await getCurrentIPAddress();
                       const location = await getLocationFromIP(ipAddress);
                       
                       // Check if a session with the same IP address already exists
                       const existingSessionWithSameIP = allSessions.find((session: DeviceSession) => 
                         session.ip_address === ipAddress && session.is_active
                       );
                       
                       if (existingSessionWithSameIP) {
                         logger.debug('dashboard', "Session with IP address already exists:", existingSessionWithSameIP);
                         showToast.info("Session with this IP address already exists");
                         return;
                       }
                       
                       const payload: CreateDeviceSessionPayload = {
                         ip_address: ipAddress,
                         location: location,
                         browser: getBrowserInfo(navigator.userAgent),
                         sign_in_time: new Date().toISOString(),
                         user_agent: navigator.userAgent,
                         device_type: getDeviceType(),
                       };
                       
                       await dispatch(createDeviceSession(payload)).unwrap();
                       dispatch(fetchDeviceSessions(undefined));
                       showToast.success("Session created successfully!");
                     } catch (error) {
                       console.error("Failed to create session:", error);
                       showToast.error("Failed to create session");
                     } finally {
                       setIsCreatingSession(false);
                     }
                   }}
                   className="mt-4 px-4 py-2 bg-[#1D8751] text-white rounded-lg text-sm hover:bg-[#1a7a47] transition-colors disabled:opacity-50"
                   disabled={isCreatingSession}
                 >
                   {isCreatingSession ? "Creating Session..." : "Create Session"}
                 </button>
               )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-6 dark:text-[#808080] text-gray-600 text-xs font-medium dark:border-[#35353E] border-gray-300 border-b pb-2 mb-2">
                <div>Session ID</div>
                <div>Signed In</div>
                <div className="hidden sm:block">Location</div>
                <div className="hidden sm:block">IP Address</div>
                <div className="hidden sm:block">Browser</div>
                <div>Status</div>
              </div>
              <div className="flex flex-col gap-3">
                {paginatedSessions.map((session: DeviceSession) => (
                  <div
                    key={session.session_id}
                    className="grid grid-cols-3 sm:grid-cols-6 text-sm dark:text-white text-gray-900 dark:border-[#35353E] border-gray-300 border-b pb-2 relative group"
                  >
                    <div className="text-xs dark:text-[#808080] text-gray-600 font-mono break-all">
                      {session.session_id.substring(0, 8)}...
                    </div>
                    <div className="truncate">{formatDate(session.sign_in_time)}</div>
                    <div className="hidden sm:block truncate">{session.location}</div>
                    <div className="hidden sm:block font-mono text-xs break-all">
                      {session.ip_address}
                    </div>
                    <div className="hidden sm:block truncate">{session.browser}</div>
                    <div className="flex items-center justify-between">
                      <span
                        className={
                          session.is_active
                            ? "text-[#1D8751]"
                            : "dark:text-[#808080] text-gray-600"
                        }
                      >
                        {session.is_active ? "Active" : "Inactive"}
                      </span>
                      {session.is_active && (
                        <button
                          onClick={() => handleRemoveSession(session)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[#E23D3A] hover:text-red-400 text-xs"
                          title="Remove session"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M6 18L18 6M6 6l12 12"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                className="px-2 py-1 rounded dark:bg-[#35353E] bg-gray-400 dark:text-white text-gray-900 disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  className={`px-2 py-1 rounded ${
                    currentPage === idx + 1
                      ? "bg-[#1D8751] text-white"
                      : "dark:bg-[#35353E] bg-gray-400 dark:text-[#8C8CA1] text-gray-600"
                  }`}
                  onClick={() => setCurrentPage(idx + 1)}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                className="px-2 py-1 rounded dark:bg-[#35353E] bg-gray-400 dark:text-white text-gray-900 disabled:opacity-50"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PrivacySecurity;
