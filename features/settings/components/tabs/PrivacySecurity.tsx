import React, { useState, useEffect } from "react";
import {
  getActiveSessions,
  clearAllSessions,
  removeSession,
  BrowserSession,
} from "@/lib/utils/browserUtils";

const PrivacySecurity = () => {
  const [twoFA, setTwoFA] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [sessions, setSessions] = useState<BrowserSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const activeSessions = await getActiveSessions();
        setSessions(activeSessions);
      } catch (error) {
        console.error("Error loading sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  const handleTwoFactorToggle = async (enabled: boolean) => {
    setUpdating(true);
    // Simulate API call
    setTimeout(() => {
      setTwoFA(enabled);
      setUpdating(false);
    }, 1000);
  };

  const handleSignOutAllDevices = () => {
    clearAllSessions();
    setSessions([]);
    // You might want to call your auth API to invalidate all sessions
    // dispatch(logoutFromAllDevices());
  };

  const handleRemoveSession = (sessionToRemove: BrowserSession) => {
    removeSession(sessionToRemove);
    setSessions((prev) =>
      prev.filter(
        (session) =>
          !(
            session.userAgent === sessionToRemove.userAgent &&
            session.ip === sessionToRemove.ip
          )
      )
    );
  };

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

      {/* Active Browser Session */}
      <div className="bg-[#18181D] border border-[#35353E] rounded-2xl p-4 w-full max-w-2xl mx-auto">
        <div className="text-base font-semibold mb-2">
          Active Browser Sessions
        </div>
        <div className="text-[#808080] text-sm mb-3">
          These Browsers Are Currently Signed In To Your Account
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#1D8751]"></div>
            <span className="ml-3 text-[#808080] text-sm">
              Loading sessions...
            </span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-6 text-[#808080] text-sm">
            No active sessions found
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 text-[#808080] text-xs font-medium border-b border-[#35353E] pb-2 mb-2">
              <div>Signed In</div>
              <div>Location</div>
              <div>IP Address</div>
              <div>Browser</div>
            </div>
            <div className="flex flex-col gap-3">
              {sessions.map((session, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-4 text-sm text-white border-b border-[#35353E] pb-2 relative group"
                >
                  <div>{session.time}</div>
                  <div>{session.location}</div>
                  <div>{session.ip}</div>
                  <div className="flex items-center justify-between">
                    <span>{session.browser}</span>
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
