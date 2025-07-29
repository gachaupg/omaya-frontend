import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../../store";
import {
  fetchDeviceSessions,
  logoutDevice,
  logoutAllDevices,
  toggleTwoFactor,
} from "../../slices/settingsSlice";
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
    try {
      await dispatch(logoutAllDevices()).unwrap();
      showToast.success("All devices logged out successfully");
      // Log out locally and redirect to login page
      if (typeof window !== "undefined") {
        localStorage.clear();
        document.cookie =
          "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict";
        window.location.href = "/auth/login";
      }
    } catch (error) {
      console.error("Failed to logout all devices:", error);
    }
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
          <div className="bg-[#23232B] p-6 rounded-xl w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-2 text-white">
              Enable 2FA
            </h3>
            {qrData && (
              <div className="flex flex-col items-center mb-4">
                <img
                  src={qrData}
                  alt="2FA QR Code"
                  className="w-40 h-40 mb-2"
                />
                <div className="text-xs text-[#8C8CA1] break-all">
                  Scan this QR code with your authenticator app.
                </div>
              </div>
            )}
            <input
              type="text"
              className="w-full p-2 rounded border border-[#35353E] mb-2 bg-[#18181D] text-white"
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
                className="flex-1 bg-[#35353E] text-white rounded px-4 py-2 font-semibold"
                onClick={() => setShow2FAModal(false)}
                disabled={verifyLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="p-3 text-white flex flex-col gap-4">
        {/* 2 Factor Authentication */}
        <div className="w-full border-2 border-[#35353E] rounded-2xl p-4 flex flex-col gap-4 max-w-none mx-auto bg-[#1D1D23]">
          <div className="text-base font-semibold mb-2">
            2 Factor Authentication
          </div>
          <div className="flex gap-3 mb-2">
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold border transition-all ${
                twoFA
                  ? "bg-[#1D8751] text-white border-[#1D8751]"
                  : "bg-transparent text-[#808080] border-[#35353E]"
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
                  : "bg-transparent text-[#808080] border-[#35353E]"
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
              <span className="text-[#808080] text-xs ml-2">
                Updating 2FA...
              </span>
            </div>
          )}
          <button
            className="w-full py-2 rounded-xl border border-[#1D8751] text-[#1D8751] hover:bg-[#1D8751] hover:text-white transition font-semibold text-sm"
            onClick={handleSignOutAllDevices}
          >
            Sign out from all devices
          </button>
        </div>

        {/* Active Device Sessions */}
        <div className="w-full border-2 border-[#35353E] rounded-2xl p-4 max-w-none mx-auto bg-[#1D1D23]">
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
          <div className="text-[#808080] text-sm mb-3">
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
              <span className="ml-3 text-[#808080] text-sm">
                Loading device sessions...
              </span>
            </div>
          ) : paginatedSessions.length === 0 ? (
            <div className="text-center py-6 text-[#808080] text-sm">
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
              <div className="grid grid-cols-6 text-[#808080] text-xs font-medium border-b border-[#35353E] pb-2 mb-2">
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
                    className="grid grid-cols-6 text-sm text-white border-b border-[#35353E] pb-2 relative group"
                  >
                    <div className="text-xs text-[#808080] font-mono">
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
                            : "text-[#808080]"
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
                className="px-2 py-1 rounded bg-[#35353E] text-white disabled:opacity-50"
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
                      : "bg-[#35353E] text-[#8C8CA1]"
                  }`}
                  onClick={() => setCurrentPage(idx + 1)}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                className="px-2 py-1 rounded bg-[#35353E] text-white disabled:opacity-50"
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
