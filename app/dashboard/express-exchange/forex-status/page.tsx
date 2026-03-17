"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { useTheme } from "@/context/theme";
import CopyButton from "@/components/ui/CopyButton";
import { fetchForexExchangeThunk, setForexExchangeFromCache } from "@/features/express/slices/forexSlice";
import { forexStatusWebSocket } from "@/features/express/services/forexStatusWebSocket";
import type { AppDispatch } from "@/store";
import { useRouteProtection } from "@/features/auth/hooks/useRouteProtection";
import Loader from "@/features/p2p/components/Common/Loader";
import { withTimeout } from "@/lib/utils/fetchWithTimeout";

function ForexStatusContent() {
  const { isChecking, isVerified } = useRouteProtection();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isDark } = useTheme();
  const transactionId = searchParams?.get("transactionId") || null;

  const { currentExchange, loading, error } = useSelector(
    (state: any) => state.forex
  );

  const authState = useSelector((state: any) => state.auth);
  const accessToken = authState?.tokens?.access || null;

  const [copySuccess, setCopySuccess] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsConnectionState, setWsConnectionState] = useState<string>("Not initialized");
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);

  // Debug auth state on mount
  useEffect(() => {
    // console.log("🔐 Auth State Debug:", {
    //   authState,
    //   accessToken: accessToken ? "Present" : "Missing",
    //   tokenLength: accessToken?.length,
    //   transactionId
    // });
  }, [authState, accessToken, transactionId]);

  // Fetch exchange details when page loads with a transactionId
  useEffect(() => {
    if (!transactionId) return;

    // Check if we already have the correct exchange in Redux (from recent creation)
    if (currentExchange?.forex_transaction_id === transactionId) {
      // Keep data in localStorage for future reloads
      localStorage.setItem('currentForexExchange', JSON.stringify(currentExchange));
      return;
    }

    // Check localStorage for cached data first
    const cachedExchange = localStorage.getItem('currentForexExchange');

    if (cachedExchange) {
      try {
        const exchangeData = JSON.parse(cachedExchange);
        // Verify it's the same transaction
        if (exchangeData.forex_transaction_id === transactionId) {
          // Load from localStorage and DON'T fetch from API
          dispatch(setForexExchangeFromCache(exchangeData));
          // WebSocket will handle real-time updates, no need to fetch from API
          return;
        } else {
          // Different transaction, clear old data
          localStorage.removeItem('currentForexExchange');
        }
      } catch (e) {
        console.error('❌ Failed to parse cached forex exchange:', e);
        localStorage.removeItem('currentForexExchange');
      }
    }

    withTimeout(dispatch(fetchForexExchangeThunk(transactionId)).unwrap(), 15_000)
      .then((data) => {
        localStorage.setItem('currentForexExchange', JSON.stringify(data));
      })
      .catch((error) => {
        console.error('❌ Failed to load forex exchange:', error);
      });
  }, [transactionId, currentExchange, dispatch]);

  // WebSocket connection for real-time status updates
  useEffect(() => {
   

    if (!transactionId) {
      setWsConnectionState("Missing transaction ID");
      return;
    }

    if (!accessToken) {
      setWsConnectionState("Missing access token");
      return;
    }

    

    // Connect to WebSocket
    forexStatusWebSocket.connect(transactionId, accessToken);

    // Set up event handlers
    const unsubscribeMessage = forexStatusWebSocket.onMessage((message) => {

      if (message.type === "initial_status" && message.data) {
        // Initial status received on connection - use this data directly
        dispatch(setForexExchangeFromCache(message.data));
        localStorage.setItem('currentForexExchange', JSON.stringify(message.data));
        setLastUpdateTime(new Date().toLocaleTimeString());
      } else if (message.type === "status_update" && message.data) {
        // Status update received - update with new data
        dispatch(setForexExchangeFromCache(message.data));
        localStorage.setItem('currentForexExchange', JSON.stringify(message.data));
        setLastUpdateTime(new Date().toLocaleTimeString());
      } else if (message.type === "connection_established") {
      } else {
      }
    });

    const unsubscribeOpen = forexStatusWebSocket.onOpen(() => {
      setWsConnected(true);
      setWsConnectionState(forexStatusWebSocket.getConnectionStateString());
    });

    const unsubscribeClose = forexStatusWebSocket.onClose(() => {
      setWsConnected(false);
      setWsConnectionState(forexStatusWebSocket.getConnectionStateString());
    });

    const unsubscribeError = forexStatusWebSocket.onError((error) => {
      console.error("❌ WebSocket error", error);
      setWsConnectionState(forexStatusWebSocket.getConnectionStateString());
    });

    // Update connection state periodically
    const stateInterval = setInterval(() => {
      setWsConnectionState(forexStatusWebSocket.getConnectionStateString());
    }, 1000);

    // Cleanup on unmount
    return () => {
      clearInterval(stateInterval);
      unsubscribeMessage();
      unsubscribeOpen();
      unsubscribeClose();
      unsubscribeError();
      forexStatusWebSocket.disconnect();
    };
  }, [transactionId, accessToken, dispatch]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Map status to UI status
  const getUIStatus = (status: string) => {
    const statusLower = status?.toLowerCase() || 'pending';
    if (statusLower === 'completed' || statusLower === 'success') return 'completed';
    if (statusLower === 'processing' || statusLower === 'pending_review') return 'processing';
    return 'pending';
  };

  const currentStatus = currentExchange ? getUIStatus(currentExchange.status) : 'pending';

  // Redirect to success page when transaction is completed
  useEffect(() => {
    if (currentExchange && currentStatus === 'completed') {
      // Small delay to show the completed animation before redirect
      const redirectTimer = setTimeout(() => {
        router.push(`/dashboard/express-exchange/forex-success?transactionId=${transactionId}`);
      }, 2000); // 2 second delay to show completed state

      return () => clearTimeout(redirectTimer);
    }
  }, [currentStatus, currentExchange, router, transactionId]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" color="#1D8751" />
      </div>
    );
  }

  if (isVerified === false) {
    return null; // Modal will be shown by the hook
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#18181D]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#1D8751]"></div>
          <p className="text-[#788099] text-lg">Loading forex exchange details...</p>
        </div>
      </div>
    );
  }

  if (error || !currentExchange) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#18181D] p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#1D1D23] rounded-2xl border-2 border-red-500 p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                <path d="M12 8v4m0 4h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#788099]">Error Loading Exchange</h2>
            <p className="text-[#788099] text-center">{error || "Failed to load forex exchange details"}</p>
            <button
              onClick={() => router.push("/dashboard/express-exchange")}
              className="mt-4 px-6 py-2 bg-[#1D8751] text-white rounded-2xl hover:bg-[#166b3e] transition-colors"
            >
              Back to Exchange
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 sm:px-6 md:px-8 min-h-screen flex flex-col items-center pt-2 overflow-x-hidden ${isDark ? 'bg-[#18181D]' : 'bg-transparent'}`}>
      {/* WebSocket Connection Status Indicator */}
      <div className="w-full max-w-4xl mb-2 flex justify-between items-center">
        <div className="flex-1" />
        <div className="flex gap-2">
          {lastUpdateTime && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isDark
                  ? "bg-blue-900/30 text-blue-400 border border-blue-700/50"
                  : "bg-blue-100 text-blue-700 border border-blue-300"
                }`}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                <path
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Updated: {lastUpdateTime}</span>
            </div>
          )}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${wsConnected
                ? isDark
                  ? "bg-green-900/30 text-green-400 border border-green-700/50"
                  : "bg-green-100 text-green-700 border border-green-300"
                : isDark
                  ? "bg-gray-800/50 text-gray-400 border border-gray-700/50"
                  : "bg-gray-100 text-gray-600 border border-gray-300"
              }`}
          >
            <div className="relative">
              <div
                className={`w-2 h-2 rounded-full ${wsConnected ? "bg-green-500" : "bg-gray-400"
                  }`}
              />
              {wsConnected && (
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75" />
              )}
            </div>
            <span>
              {wsConnected ? "Live Updates" : `WebSocket: ${wsConnectionState}`}
            </span>
          </div>
        </div>
      </div>

      {/* Top Card - Transaction Summary */}
      <div
        className={`flex flex-col md:flex-row justify-between items-stretch ${isDark
            ? "bg-[#23232B] border-[#35353E]"
            : "bg-white border-gray-200"
          } border-2 rounded-2xl p-4 shadow-lg w-full max-w-4xl mb-4 min-h-[180px]`}
      >
        <div className="flex-1 flex flex-col justify-between py-2 pr-2">
          <div>
            <div
              className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                } text-xs font-semibold mb-0.5`}
            >
              Exchange Summary:
            </div>
            <div
              className={`${isDark ? "text-white" : "text-gray-900"
                } text-base font-semibold mb-1 flex items-center gap-2`}
            >
              <span>
                {currentExchange.from_amount} {currentExchange.from_currency} → {currentExchange.to_amount} {currentExchange.to_currency}
              </span>
            </div>

            {/* Reference Number */}
            <div
              className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                } text-xs font-semibold mb-0.5 mt-3`}
            >
              Reference Number:
            </div>
            <div className="flex items-center mb-2">
              <span
                className={`${isDark ? "text-white" : "text-gray-900"
                  } text-sm font-mono bg-gray-500/10 px-2 py-1 rounded text-xs`}
              >
                {currentExchange.transaction_reference || currentExchange.transaction_id}
              </span>
              <CopyButton
                value={currentExchange.transaction_reference || currentExchange.transaction_id}
                className="ml-2"
              />
            </div>

            {/* Exchange Rate */}
            <div
              className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                } text-xs font-semibold mb-0.5 mt-3`}
            >
              Exchange Rate:
            </div>
            <div
              className={`${isDark ? "text-white" : "text-gray-900"
                } text-sm`}
            >
              1 {currentExchange.from_currency} = {currentExchange.exchange_rate} {currentExchange.to_currency}
            </div>

            {/* Bank Information */}
            {currentExchange.admin_payment_info && (
              <>
                <div
                  className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-xs font-semibold mb-0.5 mt-3`}
                >
                  Bank:
                </div>
                <div className="flex items-center mb-1">
                  <img
                    src="/assets/image_7_jijlik.png"
                    alt={currentExchange.admin_payment_info.provider_name}
                    className="w-6 h-6 rounded-full mr-2"
                  />
                  <span
                    className={`${isDark ? "text-white" : "text-gray-900"
                      } text-sm font-semibold`}
                  >
                    {currentExchange.admin_payment_info.provider_name}
                  </span>
                </div>
              </>
            )}

            {/* Forex Account */}
            {currentExchange.user_forex_account && (
              <>
                <div
                  className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-xs font-semibold mb-0.5 mt-3`}
                >
                  Your Forex Account:
                </div>
                <div
                  className={`${isDark ? "text-white" : "text-gray-900"
                    } text-sm font-mono`}
                >
                  {currentExchange.user_forex_account}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 ml-0 md:ml-6 flex items-center justify-center py-2">
          {/* QR code */}
          <div className="w-36 h-36 bg-white rounded-lg flex items-center justify-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${currentExchange.transaction_reference || currentExchange.transaction_id
                }`}
              alt="QR Code"
              className="w-32 h-32"
            />
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between w-full max-w-4xl mb-4 relative">
        {/* Connecting Line Background (gray) */}
        <div className="absolute top-5 left-[16.66%] right-[16.66%] h-0.5 bg-[#7B7B7B] z-0"></div>

        {/* Connecting Line Progress (colored) */}
        <div className="absolute top-5 left-[16.66%] right-[16.66%] h-0.5 z-0">
          <div
            className={`h-0.5 transition-all duration-500 ${currentStatus === "completed"
                ? "bg-[#1D8751] w-full"
                : currentStatus === "processing"
                  ? "bg-[#FF9500] w-1/2"
                  : currentStatus === "pending"
                    ? "bg-[#FF9500] w-0"
                    : "bg-[#7B7B7B] w-0"
              }`}
          ></div>
        </div>

        {/* Step 1: Pending Review */}
        <div className="flex flex-col items-center flex-1 relative z-10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 border-4 ${currentStatus === "pending"
                ? "bg-[#FF9500] border-[#FF95001A]"
                : currentStatus === "processing" || currentStatus === "completed"
                  ? "bg-[#1D8751] border-[#1D87511A]"
                  : "bg-[#23232B] border-[#35353E]"
              }`}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke={currentStatus === "pending" || currentStatus === "processing" || currentStatus === "completed" ? "#fff" : "#7B7B7B"}
                strokeWidth="2"
              />
              <path
                d="M12 8v4l2 2"
                stroke={currentStatus === "pending" || currentStatus === "processing" || currentStatus === "completed" ? "#fff" : "#7B7B7B"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`font-semibold text-base ${currentStatus === "pending"
                  ? "text-[#FF9500]"
                  : currentStatus === "processing" || currentStatus === "completed"
                    ? "text-[#1D8751]"
                    : "text-[#7B7B7B]"
                }`}
            >
              Pending Review
            </span>
            {currentStatus === "pending" && (
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-[#FF9500] rounded-full inline-block animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-[#FF9500] rounded-full inline-block animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-[#FF9500] rounded-full inline-block animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
            )}
            {(currentStatus === "processing" || currentStatus === "completed") && (
              <div className="flex items-center gap-1">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="#1D8751"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Processing */}
        <div className="flex flex-col items-center flex-1 relative z-10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 border-4 ${currentStatus === "processing"
                ? "bg-[#FF9500] border-[#FF95001A]"
                : currentStatus === "completed"
                  ? "bg-[#1D8751] border-[#1D87511A]"
                  : "bg-[#23232B] border-[#35353E]"
              }`}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke={currentStatus === "processing" || currentStatus === "completed" ? "#fff" : "#7B7B7B"}
                strokeWidth="2"
              />
              <path
                d="M8 12h8M12 8v8"
                stroke={currentStatus === "processing" || currentStatus === "completed" ? "#fff" : "#7B7B7B"}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`font-semibold text-base ${currentStatus === "processing"
                  ? "text-[#FF9500]"
                  : currentStatus === "completed"
                    ? "text-[#1D8751]"
                    : "text-[#7B7B7B]"
                }`}
            >
              Processing
            </span>
            {currentStatus === "processing" && (
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-[#FF9500] rounded-full inline-block animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-[#FF9500] rounded-full inline-block animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-[#FF9500] rounded-full inline-block animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
            )}
            {currentStatus === "completed" && (
              <div className="flex items-center gap-1">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="#1D8751"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Completed */}
        <div className="flex flex-col items-center flex-1 relative z-10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 border-4 ${currentStatus === "completed"
                ? "bg-[#1D8751] border-[#1D87511A]"
                : "bg-[#23232B] border-[#35353E]"
              }`}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke={currentStatus === "completed" ? "#fff" : "#7B7B7B"}
                strokeWidth="2"
              />
              <path
                d="M9 12l2 2 4-4"
                stroke={currentStatus === "completed" ? "#fff" : "#7B7B7B"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`font-semibold text-base ${currentStatus === "completed"
                  ? "text-[#1D8751]"
                  : "text-[#7B7B7B]"
                }`}
            >
              Completed
            </span>
            {currentStatus === "completed" && (
              <div className="flex items-center gap-1">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="#1D8751"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[#1D8751] text-xs font-medium">
                  Complete
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Details Card */}
      <div
        className={`${isDark ? "bg-[#23232B] border-[#35353E]" : "bg-white border-gray-200"
          } border-2 rounded-2xl p-6 shadow-lg w-full max-w-4xl mb-4`}
      >
        {/* Title */}
        <div
          className={`${isDark ? "text-white" : "text-gray-900"
            } text-2xl font-semibold mb-4`}
        >
          Transaction Details
        </div>

        {/* Transaction ID Row */}
        <div className="flex items-center justify-between mb-1">
          <div
            className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
              } text-base font-medium`}
          >
            Transaction ID
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`${isDark ? "text-white" : "text-gray-900"
                } text-base font-mono font-semibold`}
            >
              {currentExchange.forex_transaction_id || currentExchange.transaction_id}
            </span>
            <CopyButton
              value={currentExchange.forex_transaction_id || currentExchange.transaction_id}
              className="text-[#FFA200] hover:text-[#FFB833] transition-colors"
              showIcon={true}
            />
          </div>
        </div>

        {/* Dashed Divider */}
        <div
          className={`border-t border-dashed ${isDark ? "border-[#7B7B7B]" : "border-gray-400"
            } mb-4`}
        ></div>

        {/* From/To Labels Row */}
        <div className="flex items-center justify-between mb-2">
          <div
            className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
              } text-base font-medium`}
          >
            From
          </div>
          <div
            className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
              } text-base font-medium`}
          >
            To
          </div>
        </div>

        {/* From/To Content Row */}
        <div className="flex items-center justify-between mt-2">
          {/* From - Bank/USD */}
          <div className="flex items-center gap-2">
            <img
              src="/assets/image_7_jijlik.png"
              alt={currentExchange.admin_payment_info?.provider_name || "Bank"}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <div
                className={`${isDark ? "text-white" : "text-gray-900"
                  } text-base font-semibold`}
              >
                {currentExchange.from_amount} {currentExchange.from_currency}
              </div>
              <div
                className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                  } text-sm`}
              >
                {currentExchange.admin_payment_info?.provider_name || "Bank Transfer"}
              </div>
            </div>
          </div>

          {/* To - FXP */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div
                className={`${isDark ? "text-white" : "text-gray-900"
                  } text-base font-semibold`}
              >
                {currentExchange.to_amount} {currentExchange.to_currency}
              </div>
              <div
                className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                  } text-sm`}
              >
                FXPRIMUS Account
              </div>
            </div>
            <img
              src="https://content-api.changenow.io/uploads/fxprimus_logo.svg"
              alt="FXPRIMUS"
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                e.currentTarget.src = "/images/tether.svg";
              }}
            />
          </div>
        </div>

        {/* Additional Details */}
        {currentExchange.user_notes && (
          <>
            <div
              className={`border-t border-dashed ${isDark ? "border-[#7B7B7B]" : "border-gray-400"
                } my-4`}
            ></div>
            <div className="flex items-center justify-between">
              <div
                className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                  } text-base font-medium`}
              >
                Notes
              </div>
              <div
                className={`${isDark ? "text-white" : "text-gray-900"
                  } text-base`}
              >
                {currentExchange.user_notes}
              </div>
            </div>
          </>
        )}

        {/* Timestamps */}
        <div
          className={`border-t border-dashed ${isDark ? "border-[#7B7B7B]" : "border-gray-400"
            } my-4`}
        ></div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div
              className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                } text-sm font-medium mb-1`}
            >
              Created At
            </div>
            <div
              className={`${isDark ? "text-white" : "text-gray-900"
                } text-sm`}
            >
              {new Date(currentExchange.timestamp || currentExchange.created_at).toLocaleString()}
            </div>
          </div>
          <div>
            <div
              className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                } text-sm font-medium mb-1`}
            >
              Updated At
            </div>
            <div
              className={`${isDark ? "text-white" : "text-gray-900"
                } text-sm`}
            >
              {new Date(currentExchange.updated_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}

// Loading component for Suspense boundary
function ForexStatusLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#18181D]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#1D8751]"></div>
        <p className="text-[#788099] text-lg">Loading forex exchange details...</p>
      </div>
    </div>
  );
}

// Wrap with Suspense boundary
export default function ForexStatusPage() {
  return (
    <Suspense fallback={<ForexStatusLoading />}>
      <ForexStatusContent />
    </Suspense>
  );
}
