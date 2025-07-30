import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../../store";
import {
  fetchDeviceSessions,
  logoutDevice,
  logoutAllDevices,
  toggleTwoFactor,
} from "../../slices/settingsSlice";
import { logout } from "../../../auth/slices/authSlice";
import { DeviceSession } from "../../types";
import { showToast } from "../../../../lib/utils/toast";
import {
  getActiveSessions,
  BrowserSession,
} from "../../../../lib/utils/browserUtils";
import { enable2FA, verify2FASetup } from "../../../auth/slices/authSlice";

const PrivacySecurity = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    security,
    deviceSessions,
    deviceSessionsLoading,
    deviceSessionsError,
    updating,
  } = useSelector((state: any) => state.settings);

  const [twoFA, setTwoFA] = useState(security?.two_factor_enabled || false);
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
        console.log("Device sessions loaded from API:", data);
        console.log("Data type:", typeof data);
        console.log("Is array:", Array.isArray(data));
        console.log("Data length:", data?.length);
      })
      .catch(async (error: unknown) => {
        console.error("Error loading device sessions:", error);
        // Fallback to local browser sessions
        try {
          const browserSessions = await getActiveSessions();
          const deviceSessions =
            convertBrowserSessionsToDeviceSessions(browserSessions);
          setFallbackSessions(deviceSessions);
          console.log("Using fallback browser sessions:", deviceSessions);
        } catch (fallbackError) {
          console.error("Error loading fallback sessions:", fallbackError);
        }
      });
  }, [dispatch]);

  useEffect(() => {
    // Update local state when security settings change
    setTwoFA(security?.two_factor_enabled || false);
  }, [security]);

  const handleTwoFactorToggle = async (enabled: boolean) => {
    if (enabled) {
      try {
        setVerifyError(null);
        setVerifyLoading(true);
        const result = await dispatch(enable2FA()).unwrap();
        setQrData(result.qr_code || result.qrCode || result.qr || null);
        setShow2FAModal(true);
      } catch (error) {
        setVerifyError("Failed to enable 2FA: " + error);
      } finally {
        setVerifyLoading(false);
      }
    } else {
      try {
        await dispatch(toggleTwoFactor(false)).unwrap();
        setTwoFA(false);
      } catch (error) {
        setVerifyError("Failed to disable 2FA: " + error);
      }
    }
  };

  const handleVerify2FA = async () => {
    setVerifyLoading(true);
    setVerifyError(null);
    try {
      await dispatch(verify2FASetup({ code: verifyCode })).unwrap();
      setShow2FAModal(false);
      setTwoFA(true);
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
        localStorage.clear();
        document.cookie =
          "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict";
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

    const activeSessions = allSessions.filter(
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
        console.log("Invalid session filtered out:", session);
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

      if (
        !deviceSessionsLoading &&
        !hasAnyActiveSessions &&
        allSessions.length > 0
      ) {
        console.log("No active devices detected, auto logging out...");
        showToast.info("No active devices detected, logging out automatically");

        // Auto logout after a short delay
        setTimeout(() => {
          dispatch(logout());
          if (typeof window !== "undefined") {
            localStorage.clear();
            document.cookie =
              "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict";
            window.location.href = "/auth/login";
          }
        }, 2000);
      }
    };

    // Check after sessions are loaded
    if (!deviceSessionsLoading) {
      checkAndAutoLogout();
    }
  }, [deviceSessionsLoading, allSessions, dispatch]);

  const totalPages = Math.ceil(allSessions.length / sessionsPerPage);
  const paginatedSessions = allSessions.slice(
    (currentPage - 1) * sessionsPerPage,
    currentPage * sessionsPerPage
  );

  // Debug logging
  console.log("Device sessions state:", {
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="dark:bg-[#23232B] bg-white p-6 rounded-xl w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-2 dark:text-white text-gray-900">
              Enable 2FA
            </h3>
            {qrData && (
              <div className="flex flex-col items-center mb-4">
                <img
                  src={qrData}
                  alt="2FA QR Code"
                  className="w-40 h-40 mb-2"
                />
                <div className="text-xs dark:text-[#8C8CA1] text-gray-600 break-all">
                  Scan this QR code with your authenticator app.
                </div>
              </div>
            )}
            <input
              type="text"
              className="w-full p-2 rounded dark:border-[#35353E] border-gray-300 border mb-2 dark:bg-[#18181D] bg-gray-100 dark:text-white text-gray-900"
              placeholder="Enter code from app"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              disabled={verifyLoading}
            />
            {verifyError && (
              <div className="text-red-500 text-xs mb-2">{verifyError}</div>
            )}
            <div className="flex gap-2">
              <button
                className="flex-1 bg-[#1D8751] text-white rounded px-4 py-2 font-semibold"
                onClick={handleVerify2FA}
                disabled={verifyLoading}
              >
                {verifyLoading ? "Verifying..." : "Verify"}
              </button>
              <button
                className="flex-1 dark:bg-[#35353E] bg-gray-400 dark:text-white text-gray-900 rounded px-4 py-2 font-semibold"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="dark:bg-[#23232B] bg-white p-6 rounded-xl w-full max-w-md">
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
                    className="w-full py-3 px-4 rounded-xl border border-[#E23D3A] text-[#E23D3A] hover:bg-[#E23D3A] hover:text-white transition font-semibold text-sm"
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
                    className={`w-full py-3 px-4 rounded-xl border transition font-semibold text-sm ${
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

      <div className="p-3 dark:text-white text-gray-900 flex flex-col gap-4">
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
                  console.log("Loaded fallback sessions:", deviceSessions);
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
            </div>
          ) : (
            <>
              <div className="grid grid-cols-6 dark:text-[#808080] text-gray-600 text-xs font-medium dark:border-[#35353E] border-gray-300 border-b pb-2 mb-2">
                <div>Session ID</div>
                <div>Signed In</div>
                <div>Location</div>
                <div>IP Address</div>
                <div>Browser</div>
                <div>Status</div>
              </div>
              <div className="flex flex-col gap-3">
                {paginatedSessions.map((session: DeviceSession) => (
                  <div
                    key={session.session_id}
                    className="grid grid-cols-6 text-sm dark:text-white text-gray-900 dark:border-[#35353E] border-gray-300 border-b pb-2 relative group"
                  >
                    <div className="text-xs dark:text-[#808080] text-gray-600 font-mono">
                      {session.session_id.substring(0, 8)}...
                    </div>
                    <div>{formatDate(session.sign_in_time)}</div>
                    <div>{session.location}</div>
                    <div className="font-mono text-xs">
                      {session.ip_address}
                    </div>
                    <div>{session.browser}</div>
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
