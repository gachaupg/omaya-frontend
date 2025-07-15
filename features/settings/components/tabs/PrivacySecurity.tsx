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
    try {
      await dispatch(toggleTwoFactor(enabled)).unwrap();
      setTwoFA(enabled);
    } catch (error) {
      console.error("Failed to toggle 2FA:", error);
    }
  };

  const handleSignOutAllDevices = async () => {
    try {
      await dispatch(logoutAllDevices()).unwrap();
      showToast.success("All devices logged out successfully");
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
    <div className="p-3 text-white flex flex-col gap-4">
      {/* 2 Factor Authentication */}
      <div className="bg-[#18181D] border border-[#35353E] rounded-2xl p-4 flex flex-col gap-4 w-full max-w-2xl mx-auto">
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
                <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" />
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
                <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" />
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
            <span className="text-[#808080] text-xs ml-2">Updating 2FA...</span>
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
      <div className="bg-[#18181D] border border-[#35353E] rounded-2xl p-4 w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="text-base font-semibold">Active Device Sessions</div>
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
        ) : allSessions.length === 0 ? (
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
              {validDeviceSessions.length} | Fallback: {fallbackSessions.length}{" "}
              | Total: {allSessions.length}
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
              {allSessions.map((session: DeviceSession) => (
                <div
                  key={session.session_id}
                  className="grid grid-cols-6 text-sm text-white border-b border-[#35353E] pb-2 relative group"
                >
                  <div className="text-xs text-[#808080] font-mono">
                    {session.session_id.substring(0, 8)}...
                  </div>
                  <div>{formatDate(session.sign_in_time)}</div>
                  <div>{session.location}</div>
                  <div className="font-mono text-xs">{session.ip_address}</div>
                  <div>{session.browser}</div>
                  <div className="flex items-center justify-between">
                    <span
                      className={
                        session.is_active ? "text-[#1D8751]" : "text-[#808080]"
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
      </div>
    </div>
  );
};

export default PrivacySecurity;
