import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useTransactionStatusWebSocket,
  TransactionStatusMessage,
} from "../websockets";
import { API_CONFIG } from "@/lib/appConfig";
import { useTheme } from "@/context/theme";
import CopyButton from "@/components/ui/CopyButton";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/rootReducer";
import { logger } from '@/lib/utils/logger';

import {
  cancelP2PDepositTransaction,
} from "@/features/express/slices/transactionSlice";

interface ExchangingProps {
  transactionData?: {
    type: "deposit" | "withdrawal";
    amount: number;
    asset: any;
    paymentDetail?: any;
    paymentDetails?: any[];
    walletAddress: string;
    network: any;
    transactionId?: string;
    // Deposit-specific fields (from API response)
    depositCode?: string;
    totalAmountDue?: string;
    commission?: string;
    networkFee?: string;
    currency?: string;
    websocketUrl?: string;
    websocket_url?: string; // API response uses snake_case
    net_amount?: string;
    fees?: {
      commission: string;
      network_fee: string;
      total_fees: string;
    };
    // Additional fields for different transaction types
    status?: string;
    message?: string;
    withdrawalAddress?: string;
    details?: {
      withdrawal_address?: string;
      payout_address?: string;
      from_currency?: string;
      to_currency?: string;
      to_network?: string;
      estimated_amount?: number;
      changenow_id?: string;
    };
  };
}

export default function Exchanging({ transactionData }: ExchangingProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isDark } = useTheme();
  const [currentStatus, setCurrentStatus] = useState<string>("pending");
  const [persistedTransactionData, setPersistedTransactionData] =
    useState<any>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  
  // Timer state - 15 minutes in seconds
  const [timeRemaining, setTimeRemaining] = useState<number>(15 * 60);
  const [timerActive, setTimerActive] = useState<boolean>(true);

  // Store final websocket data for success page
  const [finalWebsocketData, setFinalWebsocketData] = useState<any>(null);
  const [liveAmount, setLiveAmount] = useState<number | null>(null);
  const [liveCurrency, setLiveCurrency] = useState<string | null>(null);
  const [liveTransactionId, setLiveTransactionId] = useState<string | null>(null);
  const [amountHistory, setAmountHistory] = useState<
    Array<{ amount: number; timestamp: string; currency: string }>
  >([]);
  const [previousAmount, setPreviousAmount] = useState<number | null>(null);
  const [fallbackPolling, setFallbackPolling] = useState<boolean>(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );


  // Fallback polling function
  const startFallbackPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const poll = async () => {
      if (!effectiveTransactionData?.transactionId) return;

      try {
      } catch (error) {
        // logger.error('p2p', "Fallback polling error:", error);
      }
    };

    // Poll every 10 seconds
    const interval = setInterval(poll, 10000);
    setPollingInterval(interval);

    // Initial poll
    poll();
  };

  const stopFallbackPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
      setFallbackPolling(false);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Timer countdown effect
  useEffect(() => {
    if (!timerActive) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive]);

  // Auto-cancel when timer expires
  useEffect(() => {
    if (timeRemaining === 0 && effectiveTransactionData?.transactionId) {
      handleCancelTransaction();
    }
  }, [timeRemaining]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle transaction cancellation for P2P deposits
  const handleCancelTransaction = async () => {
    if (!effectiveTransactionData?.transactionId) return;

    try {
      await dispatch(cancelP2PDepositTransaction(effectiveTransactionData.transactionId)).unwrap();
      
      // Clear localStorage
      localStorage.removeItem("express_transaction_data");
      
      // Redirect to home page
      router.push("/");
    } catch (error) {
      logger.error('p2p', "Failed to cancel transaction:", error);
      // Still redirect even if cancel fails
      router.push("/");
    }
  };

  // Stop timer when transaction is completed
  useEffect(() => {
    if (currentStatus === "completed") {
      setTimerActive(false);
    }
  }, [currentStatus]);

  // This will be moved after isConnected is declared

  // Check for transaction ID from URL and persisted transaction data on component mount
  useEffect(() => {
    const transactionIdFromUrl = searchParams?.get("transactionId");


    if (transactionIdFromUrl) {
      // Check if we have persisted data for this transaction
      const stored = localStorage.getItem("express_transaction_data");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.transactionId === transactionIdFromUrl) {
            setPersistedTransactionData(parsed);
            return;
          }
        } catch (error) {
          // Silent error handling
        }
      }

      // If no persisted data found, create a basic transaction data object
      // This will allow the WebSocket to connect and fetch status
      const basicTransactionData = {
        transactionId: transactionIdFromUrl,
        type: "deposit", // Default to deposit type
        amount: 0, // Will be updated by WebSocket
        asset: { symbol: "USDT" }, // Default asset
        walletAddress: "", // Will be updated by WebSocket
        network: "BSC", // Default network
      };

      setPersistedTransactionData(basicTransactionData);
    } else {
      // Fallback to checking localStorage for transaction data
      const stored = localStorage.getItem("express_transaction_data");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPersistedTransactionData(parsed);
        } catch (error) {
          localStorage.removeItem("express_transaction_data");
        }
      }
    }
  }, [searchParams]);

  // Use persisted data if no transactionData is provided (page reload scenario)
  const effectiveTransactionData = transactionData || persistedTransactionData;


  // Store transaction data in localStorage when it's provided
  useEffect(() => {
    if (transactionData && transactionData.transactionId) {
      localStorage.setItem(
        "express_transaction_data",
        JSON.stringify(transactionData)
      );
    
    }
  }, [transactionData]);


  // Use WebSocket for both deposit and withdrawal transactions
  const shouldUseWebSocket =
    effectiveTransactionData?.transactionId &&
    (effectiveTransactionData?.type === "withdrawal" ||
      effectiveTransactionData?.type === "deposit");


  // Extract WebSocket URL from transaction data (handle both camelCase and snake_case)
  let websocketUrl =
    effectiveTransactionData?.websocketUrl ||
    effectiveTransactionData?.websocket_url ||
    undefined;

  // Clean up malformed URLs (remove //http: or //https: from WebSocket URLs)
  if (websocketUrl && (websocketUrl.includes('//http:') || websocketUrl.includes('//https:'))) {
    websocketUrl = websocketUrl.replace('//http:', '').replace('//https:', '');
  }

  // Fix protocol mismatch: ensure WebSocket URL matches the API base URL protocol
  if (websocketUrl) {
    const apiBaseUrl = API_CONFIG.BASE_URL;
    const apiIsSecure = apiBaseUrl.startsWith("https://");
    const wsIsSecure = websocketUrl.startsWith("wss://");

    if (apiIsSecure && !wsIsSecure) {
      // API is HTTPS but WebSocket is WS - convert to WSS
      websocketUrl = websocketUrl.replace("ws://", "wss://");
    } else if (!apiIsSecure && wsIsSecure) {
      // API is HTTP but WebSocket is WSS - convert to WS (for local development)
      websocketUrl = websocketUrl.replace("wss://", "ws://");
    }
  }


  // Check if this is a USDT transaction (should use backend WebSocket)
  const isUSDTCurrency =
    effectiveTransactionData?.asset?.ticker?.toLowerCase() === "usdt" ||
    effectiveTransactionData?.asset?.symbol?.toLowerCase().includes("usdt") ||
    effectiveTransactionData?.asset?.name?.toLowerCase().includes("usdt");
  const finalWebsocketUrl = websocketUrl;

  const { isConnected, lastMessage, disconnect, sendMessage } =
    useTransactionStatusWebSocket(
      effectiveTransactionData?.transactionId || "",
      effectiveTransactionData?.type || "withdrawal",
      finalWebsocketUrl,
      {
        onMessage: (data: TransactionStatusMessage) => {


          // Clear any WebSocket errors when we receive a message
          setWsError(null);
          setConnectionAttempts(0); // Reset connection attempts on successful message

          // Update transaction ID from WebSocket data if available
          if (data.data?.transaction_id) {
            setLiveTransactionId(data.data.transaction_id);
          }

          // Update amount and currency from WebSocket data
          // Check for both regular amount format and ChangeNow status update format
          let amountToUpdate: number | null = null;
          let currencyToUpdate: string | null = null;

          // Check regular amount format
          if (data.data?.amount) {
            const amount = parseFloat(data.data.amount);
            if (!isNaN(amount)) {
              amountToUpdate = amount;
              currencyToUpdate = data.data?.currency || "USDT";
            }
          }

          // Check ChangeNow status update format - only consider amountFrom
          if (data.type === "status_update" && data.data) {
            const changeNowData = data.data as any; // Type assertion for ChangeNow format

            // Store websocket data for potential success page use
            setFinalWebsocketData(data);

            // Only consider amountFrom from ChangeNow
            if (
              changeNowData.amountFrom !== null &&
              changeNowData.amountFrom !== undefined
            ) {
              const amountFrom = parseFloat(changeNowData.amountFrom);
              if (!isNaN(amountFrom)) {
                amountToUpdate = amountFrom;
                currencyToUpdate =
                  changeNowData.fromCurrency?.toUpperCase() || "USDT";
              }
            }
          }

          // Update state if we found valid amounts
          if (amountToUpdate !== null) {
            // Store previous amount before updating
            setPreviousAmount(liveAmount);

            setLiveAmount(amountToUpdate);
            logger.debug('p2p', 
              "Updated live amount from WebSocket:",
              amountToUpdate,
              "currency:",
              currencyToUpdate
            );

            // Track amount changes in history
            setAmountHistory((prev) => {
              const changeNowData = data.data as any; // Type assertion for ChangeNow format
              const newEntry = {
                amount: amountToUpdate!,
                timestamp:
                  data.data?.timestamp ||
                  (changeNowData as any)?.updatedAt ||
                  new Date().toISOString(),
                currency: currencyToUpdate || transactionData?.details?.to_currency || "USDT",
              };

              // Only add if amount is different from last entry
              if (
                prev.length === 0 ||
                prev[prev.length - 1].amount !== amountToUpdate
              ) {
                return [...prev, newEntry];
              }
              return prev;
            });
          }

          if (currencyToUpdate) {
            setLiveCurrency(currencyToUpdate);
            logger.debug('p2p', 
              "Updated live currency from WebSocket:",
              currencyToUpdate
            );
          }

          // Handle different WebSocket message formats
          let status: string | undefined;
          let message: string | undefined;

          // Check if it's a final_status message (transaction completed)
          if (data.type === "final_status" && data.data?.status) {
            // Final status format - transaction completed
            status = data.data.status;
            message = data.data.message;
            logger.debug('p2p', "Final status received:", status, message);
          } else if (data.type === "status_update" && data.data?.status) {
            // ChangeNow status update format
            status = data.data.status;
            message = data.data.message;
          } else if (data.status && typeof data.status === "string") {
            // ChangeNow format
            status = data.status;
            message = (data as any).message;
          } else if (data.data?.status) {
            // Backend format
            status = data.data.status;
            message = data.data.message;
          } else if (data.status) {
            // Legacy format
            status = data.status;
            message = (data as any).message;
          }


          // Process statuses for both deposit and withdrawal
          const validStatuses = [
            "pending",
            "pending_blockchain",
            "processing",
            "completed",
            "failed",
            "awaiting_payment",
            "exchanging",
            "sending",
            "finished", // ChangeNow uses "finished" instead of "completed"
            "confirming",
            "transaction_created",
            "processing_transfer",
            "approval_required",
            "admin_approval_required", // New status for admin approval
            "agent_approve", // New status for agent approval
            "waiting", // ChangeNow status
          ];

          if (status && validStatuses.includes(status)) {
            // Map backend statuses to UI statuses for better user experience
            let uiStatus = status;

            // Check if this is a non-first-two assets flow (ChangeNow flow)
            const isChangeNowFlow =
              effectiveTransactionData?.details?.changenow_id ||
              effectiveTransactionData?.fromCurrency ||
              effectiveTransactionData?.toCurrency;

            if (isChangeNowFlow) {
              // ChangeNow flow - combine some statuses for better UX
              if (status === "waiting") {
                uiStatus = "pending"; // waiting -> pending (awaiting deposit)
              } else if (status === "pending_blockchain") {
                uiStatus = "confirming"; // pending_blockchain -> confirming (next step after pending)
              } else if (status === "confirming") {
                uiStatus = "confirming"; // confirming stays the same
              } else if (status === "processing") {
                uiStatus = "confirming"; // processing -> confirming (transaction is being processed)
              } else if (status === "exchanging") {
                uiStatus = "sending"; // exchanging -> sending (skip exchanging step)
              } else if (status === "sending") {
                uiStatus = "sending"; // sending stays the same
              } else if (status === "finished") {
                uiStatus = "sending"; // finished -> sending (waiting for completed status)
              } else if (status === "completed") {
                uiStatus = "completed"; // completed -> show all steps as completed
              }
            } else {
              // Regular flow (first two assets) - skip exchanging step
              if (status === "pending_blockchain") {
                uiStatus = "confirming"; // pending_blockchain -> confirming (next step after pending)
              } else if (status === "transaction_created") {
                uiStatus = "confirming";
              } else if (status === "processing") {
                uiStatus = "confirming"; // processing -> confirming (transaction is being processed)
              } else if (status === "processing_transfer") {
                uiStatus = "sending"; // processing_transfer -> sending (skip exchanging)
              } else if (status === "approval_required") {
                uiStatus = "sending"; // approval_required -> sending (skip exchanging)
              } else if (status === "admin_approval_required") {
                uiStatus = "sending"; // Admin approval means exchanging is complete, move to sending
              } else if (status === "completed" || status === "finished") {
                // Always show as completed when status is completed
                uiStatus = "completed"; // Show as completed
              } else if (status === "agent_approve") {
                uiStatus = "sending"; // Show as "sending to you" when agent approved
              }
            }

            setCurrentStatus(uiStatus);

            // Auto-navigate to success page when transaction is completed
            const shouldAutoNavigate = status === "completed" && (
              data.type === "final_status" || 
              data.is_final === true || 
              (data as any).is_final === true ||
              data.data?.is_final === true ||
              // For direct exchanges, completed status should always trigger navigation
              (data.type === "status_update" && status === "completed")
            );
            
            if (shouldAutoNavigate) {
              // Store final websocket data
              setFinalWebsocketData(data);
              // Give users time to see the completion status before reloading
              setTimeout(() => {
                window.location.reload();
              }, 3000); // 3 seconds delay to show completion status
            }

            // Auto-reload when transaction is agent approved
            if (status === "agent_approve") {
              // Store final websocket data
              setFinalWebsocketData(data);
              // Give users time to see the completion status before reloading
              setTimeout(() => {
                window.location.reload();
              }, 3000);
            }
          } else {
            // Status not in valid list - ignore
          }

          // Special handling for P2P deposit status updates
          // Check if this is a P2P deposit status update (has receiver_wallet field)
          if (data.type === "status_update" && data.data) {
            const depositData = data.data as any;
            
            // Check if this is a P2P deposit transaction (has receiver_wallet field)
            if (depositData.receiver_wallet || depositData.transaction_type === "deposit") {
              logger.debug('p2p', "📥 P2P DEPOSIT STATUS UPDATE DETECTED:", depositData);
              
              // Store websocket data for success page
              setFinalWebsocketData(data);
              
              // Update live amount and currency from P2P deposit data
              if (depositData.amount && depositData.currency) {
                const amount = parseFloat(depositData.amount);
                if (!isNaN(amount)) {
                  setLiveAmount(amount);
                  setLiveCurrency(depositData.currency);
                  logger.debug('p2p', "Updated live amount from P2P deposit:", amount, depositData.currency);
                }
              }
              
              // Log specific status updates for debugging
              if (depositData.status === "pending_blockchain") {
                logger.debug('p2p', "⏳ P2P DEPOSIT PENDING BLOCKCHAIN - Transaction hash:", depositData.transaction_hash);
              }
              
              // Check if P2P deposit is completed
              if (depositData.status === "completed") {
                // Give users time to see the completion status before reloading
                setTimeout(() => {
                  window.location.reload();
                }, 3000); // 3 seconds delay
              }
            }
          }
        },
        onError: (error) => {
          // Minimal error logging
          console.warn(
            `WebSocket error for transaction ${effectiveTransactionData?.transactionId}`
          );

          if (finalWebsocketUrl) {
            console.warn(`URL: ${finalWebsocketUrl}`);
          } else {
            console.warn("No WebSocket URL provided");
          }

          // Increment connection attempts
          setConnectionAttempts((prev) => prev + 1);

          // Only show error in UI after multiple attempts
          // This prevents showing errors for initial connection attempts
          if (!isConnected && connectionAttempts > 2) {
            const userFriendlyError = `Connection issue (attempt ${connectionAttempts}). ${
              finalWebsocketUrl ? "Retrying..." : "No WebSocket URL available"
            }`;

            setWsError(userFriendlyError);

            // Clear error after 5 seconds
            setTimeout(() => setWsError(null), 5000);

            // Start fallback polling after 5 failed attempts
            if (connectionAttempts >= 5 && !fallbackPolling) {
              logger.debug('p2p', 
                "Starting fallback polling mechanism due to WebSocket failures"
              );
              setFallbackPolling(true);
              startFallbackPolling();
            }
          }

          // Don't crash the component on WebSocket errors
          // Just log them and continue
        },
        autoReconnect: true,
      }
    );

  // Stop polling when WebSocket reconnects successfully
  useEffect(() => {
    if (isConnected && fallbackPolling) {
      logger.debug('p2p', "WebSocket reconnected, stopping fallback polling");
      stopFallbackPolling();
    }
  }, [isConnected, fallbackPolling]);

  // Debug logging
  useEffect(() => {
    if (shouldUseWebSocket) {
      logger.debug('p2p', 
        "WebSocket enabled for transaction:",
        effectiveTransactionData?.transactionId
      );
      logger.debug('p2p', 
        "Transaction ID source:",
        effectiveTransactionData?.transactionId ? "provided" : "missing"
      );
      logger.debug('p2p', "Current status:", currentStatus);
      logger.debug('p2p', "WebSocket connected:", isConnected);
    }
  }, [
    shouldUseWebSocket,
    effectiveTransactionData?.transactionId,
    currentStatus,
    isConnected,
  ]);

  // Success page disabled - always reload instead

  // If no transaction data available (not from form submission or localStorage), show loading or redirect
  if (!effectiveTransactionData) {
    return (
      <div
        className={`w-full min-h-screen flex flex-col items-center justify-center pt-2 ${
          isDark ? "bg-[#0A0A0A]" : "bg-gray-50"
        }`}
      >
        <div className={`${isDark ? "text-white" : "text-gray-900"} text-lg`}>
          Loading transaction data...
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full min-h-screen flex flex-col items-center pt-2`}>
      {/* Timer Banner */}
      {timerActive && timeRemaining > 0 && (
        <div className={`w-full max-w-4xl mb-4 ${
          timeRemaining <= 60 
            ? 'bg-red-500/20 border-red-500' 
            : timeRemaining <= 300 
              ? 'bg-orange-500/20 border-orange-500'
              : 'bg-[#1D8751]/20 border-[#1D8751]'
        } border-2 rounded-2xl p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <svg 
              className={`w-6 h-6 ${
                timeRemaining <= 60 
                  ? 'text-red-500' 
                  : timeRemaining <= 300 
                    ? 'text-orange-500'
                    : 'text-[#1D8751]'
              }`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <div>
              <div className={`text-sm font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Transaction Timeout
              </div>
              <div className={`text-xs ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {timeRemaining <= 60 
                  ? 'Transaction will be cancelled soon!' 
                  : 'Complete your transaction before time expires'}
              </div>
            </div>
          </div>
          <div className={`text-2xl font-bold ${
            timeRemaining <= 60 
              ? 'text-red-500' 
              : timeRemaining <= 300 
                ? 'text-orange-500'
                : 'text-[#1D8751]'
          }`}>
            {formatTime(timeRemaining)}
          </div>
        </div>
      )}
      
      {/* Top Card */}
      <div
        className={`flex flex-col md:flex-row justify-between items-stretch bg-[#FFFFFF] dark:${
          isDark
            ? "bg-[#23232B]  border:[#E8EFF5] dark:border-[#35353E]"
            : "bg-white border-gray-200"
        } border-2 rounded-2xl p-4 shadow-lg w-full  mb-4 min-h-[180px]`}
      >
        <div className="flex-1 flex flex-col justify-between py-2 pr-2">
          <div>
            <div
              className={`${
                isDark ? "text-[#7B7B7B]" : "text-gray-600"
              } text-xs font-semibold mb-0.5`}
            >
              Amount:
            </div>
            <div
              className={`${
                isDark ? "text-white" : "text-gray-900"
              } text-base font-semibold mb-1 flex items-center gap-2`}
            >
             <span>
                {liveAmount !== null
                  ? liveAmount
                  :  0}{" "}
                <span className="uppercase">
                {liveCurrency ||
                    effectiveTransactionData?.asset?.ticker ||
                    effectiveTransactionData?.asset?.symbol ||
                    effectiveTransactionData?.asset?.name ||
                    transactionData?.details?.to_currency ||
                    "USDT"}
                </span>
              </span>
            </div>
            {/* {liveAmount !== null &&
              liveAmount !== effectiveTransactionData?.amount && (
                <div className={`${
                  isDark ? 'text-[#7B7B7B]' : 'text-gray-600'
                } text-xs mb-1`}>
                  Initial: {effectiveTransactionData?.amount || 0}{" "}
                  {effectiveTransactionData?.asset?.ticker || "USDT"}
                </div>
              )} */}

            {/* Display previous amount if it changed */}
            {previousAmount !== null &&
              liveAmount !== null &&
              previousAmount !== liveAmount && (
                <div
                  className={`mt-2 p-2 ${
                    isDark
                      ? "bg-[#1A1A1A] border-[#35353E]"
                      : "bg-gray-100 border-gray-300"
                  } rounded border`}
                >
                  <div
                    className={`${
                      isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-xs font-semibold mb-1`}
                  >
                    Amount Change:
                  </div>
                  <div
                    className={`${
                      isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-xs mb-0.5`}
                  >
                    Previous: {previousAmount.toFixed(8)}{" "}
                    {liveCurrency ||
                      effectiveTransactionData?.asset?.ticker ||
                      effectiveTransactionData?.asset?.symbol ||
                      effectiveTransactionData?.asset?.name ||
                      "USDT"}
                  </div>
                  <div className="text-green-400 text-xs">
                    Current: {liveAmount.toFixed(8)}{" "}
                    {liveCurrency ||
                      effectiveTransactionData?.asset?.ticker ||
                      effectiveTransactionData?.asset?.symbol ||
                      effectiveTransactionData?.asset?.name ||
                      "USDT"}
                  </div>
                </div>
              )}
            {/* Deposit-specific information display */}
            {effectiveTransactionData?.type === "deposit" && (
                <>
                  {/* Deposit Code - Most important for deposits */}
                 

                  {/* Asset and Network Information */}
                  <div
                    className={`${
                      isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-xs font-semibold mb-0.5 mt-3`}
                  >
                    Asset & Network:
                  </div>
                  <div className="flex items-center mb-2">
                    <img
                      src={
                        effectiveTransactionData?.asset?.icon ||
                        effectiveTransactionData?.asset?.icon_url ||
                        effectiveTransactionData?.asset?.image_url ||
                        effectiveTransactionData?.asset?.image ||
                        "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                      }
                      alt={effectiveTransactionData?.asset?.ticker || effectiveTransactionData?.asset?.symbol || effectiveTransactionData?.asset?.name || "Asset"}
                      className="w-6 h-6 rounded-full mr-2"
                      onError={(e) => {
                        e.currentTarget.src = "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                      }}
                    />
                    <span
                      className={`${
                        isDark ? "text-white" : "text-gray-900"
                      } text-sm font-semibold`}
                    >
                      {effectiveTransactionData?.asset?.ticker || effectiveTransactionData?.asset?.symbol || effectiveTransactionData?.asset?.name || "USDT"}
                    </span>
                    <span className="ml-2 bg-[#1D8751] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {effectiveTransactionData?.asset?.network || effectiveTransactionData?.network?.network_type || "BSC"}
                    </span>
                  </div>

                

                  {/* Wallet Address (if provided) */}
                  {effectiveTransactionData?.walletAddress && (
                    <>
                      <div
                        className={`${
                          isDark ? "text-[#7B7B7B]" : "text-gray-600"
                        } text-xs font-semibold mb-0.5 mt-3`}
                      >
                        Wallet Address:
                      </div>
                      <div className="flex items-center mb-2">
                        <span
                          className={`${
                            isDark ? "text-white" : "text-gray-900"
                          } text-sm font-mono bg-gray-500/10 px-2 py-1 rounded text-xs break-all`}
                        >
                          {effectiveTransactionData.walletAddress}
                        </span>
                        <CopyButton
                          value={effectiveTransactionData.walletAddress}
                          className="ml-2"
                        />
                      </div>
                    </>
                  )}

                  {/* Status from WebSocket */}
                 

                 
                </>
              )}

            {/* Bank Information (for non-direct deposits) */}
            {effectiveTransactionData?.type === "deposit" && effectiveTransactionData?.paymentDetail && effectiveTransactionData.paymentDetail.provider_name !== "direct" && (
                    <>
                      <div
                        className={`${
                          isDark ? "text-[#7B7B7B]" : "text-gray-600"
                        } text-xs font-semibold mb-0.5 mt-3`}
                  >
                    Bank:
                  </div>
                  <div className="flex items-center mb-1">
                    <img
                      src={
                        effectiveTransactionData.paymentDetail.logo_url ||
                        effectiveTransactionData.paymentDetail.logo ||
                        effectiveTransactionData.paymentDetail.provider_logo ||
                        "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                      }
                      alt={effectiveTransactionData.paymentDetail.provider_name}
                      className="w-5 h-5 rounded-full mr-2"
                      onError={(e) => {
                        if (e.currentTarget.src !== "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png") {
                          e.currentTarget.src = "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png";
                        }
                      }}
                    />
                    <span
                      className={`${
                        isDark ? "text-white" : "text-gray-900"
                      } text-sm font-semibold`}
                    >
                      {effectiveTransactionData.paymentDetail.provider_name}
                    </span>
                  </div>
                  <div
                    className={`${
                      isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-xs font-semibold mb-0.5`}
                  >
                    Account Name:
                  </div>
                  <div
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-sm mb-1`}
                  >
                    {effectiveTransactionData.paymentDetail.account_name}
                  </div>
                  <div
                    className={`${
                      isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-xs font-semibold mb-0.5`}
                  >
                    Account Number:
                  </div>
                  <div
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-sm font-mono`}
                  >
                    {effectiveTransactionData.paymentDetail.account_number}
                  </div>
                </>
              )}
            {effectiveTransactionData?.type === "withdrawal" && (
              <>
                <div
                  className={`${
                    isDark ? "text-[#7B7B7B]" : "text-gray-600"
                  } text-xs font-semibold mb-0.5`}
                >
                  Wallet Address:
                </div>
                <div
                  className={`${
                    isDark ? "text-white" : "text-gray-900"
                  } text-sm font-mono break-all`}
                >
                  {effectiveTransactionData.walletAddress}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 ml-0 md:ml-6 flex items-center justify-center py-2">
          {/* QR code */}
          <div className="w-36 h-36 bg-white rounded-lg flex items-center justify-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${
                effectiveTransactionData?.type === "deposit" &&
                effectiveTransactionData?.paymentDetail &&
                effectiveTransactionData.paymentDetail.provider_name !== "direct"
                  ? effectiveTransactionData.paymentDetail.account_number
                  : effectiveTransactionData?.walletAddress || ""
              }`}
              alt="QR Code"
              className="w-32 h-32"
            />
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between w-full  mb-4 relative">
        {/* Connecting Lines */}
        <div className="absolute top-5 left-[16.66%] right-[16.66%] h-0.5 z-0">
          <div
            className={`h-0.5 transition-all duration-500 ${
              currentStatus === "completed" || currentStatus === "finished"
                ? "bg-[#1D8751] w-full"
                : currentStatus === "sending"
                  ? "bg-[#1D8751] w-full"
                  : currentStatus === "confirming"
                    ? "bg-[#FF9500] w-1/2"
                    : currentStatus === "pending" ||
                        currentStatus === "waiting"
                      ? "bg-[#FF9500] w-1/3"
                      : "bg-[#7B7B7B] w-0"
            }`}
          ></div>
        </div>

        {/* Step 1: Awaiting Deposit */}
        <div className="flex flex-col items-center flex-1 relative z-10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 border-4 ${
              currentStatus === "pending" ||
              currentStatus === "waiting"
                ? "bg-[#FF9500] border-[#FF95001A]"
                : currentStatus === "confirming" ||
                    currentStatus === "sending" ||
                    currentStatus === "completed" ||
                    currentStatus === "finished"
                  ? "bg-[#1D8751] border-[#1D87511A]"
                  : "bg-[#23232B] border-[#35353E]"
            }`}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke={
                  currentStatus === "pending" ||
                  currentStatus === "waiting"
                    ? "#fff"
                    : currentStatus === "confirming" ||
                        currentStatus === "sending" ||
                        currentStatus === "completed" ||
                        currentStatus === "finished"
                      ? "#fff"
                      : "#7B7B7B"
                }
                strokeWidth="2"
              />
              <path
                d="M12 8v4l2 2"
                stroke={
                  currentStatus === "pending" ||
                  currentStatus === "waiting"
                    ? "#fff"
                    : currentStatus === "confirming" ||
                        currentStatus === "sending" ||
                        currentStatus === "completed" ||
                        currentStatus === "finished"
                      ? "#fff"
                      : "#7B7B7B"
                }
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`font-semibold text-base ${
                currentStatus === "pending" ||
                currentStatus === "waiting"
                  ? "text-[#FF9500]"
                  : currentStatus === "confirming" ||
                      currentStatus === "sending" ||
                      currentStatus === "completed" ||
                      currentStatus === "finished"
                    ? "text-[#1D8751]"
                    : "text-[#7B7B7B]"
              }`}
            >
              Awaiting Deposit
            </span>
            {(currentStatus === "pending" ||
              currentStatus === "waiting") && (
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
            {(currentStatus === "confirming" ||
              currentStatus === "sending" ||
              currentStatus === "completed" ||
              currentStatus === "finished") && (
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
        {/* Step 2: Confirming */}
        <div className="flex flex-col items-center flex-1 relative z-10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 border-4 ${
              currentStatus === "confirming"
                ? "bg-[#FF9500] border-[#FF95001A]"
                : currentStatus === "sending" ||
                    currentStatus === "completed" ||
                    currentStatus === "finished"
                  ? "bg-[#1D8751] border-[#1D87511A]"
                  : `${isDark ? "bg-[#23232B] border-[#35353E]" : "bg-gray-200 border-gray-300"}`
            }`}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke={
                  currentStatus === "confirming" ||
                  currentStatus === "sending" ||
                  currentStatus === "completed" ||
                  currentStatus === "finished"
                    ? "#fff"
                    : "#7B7B7B"
                }
                strokeWidth="2"
              />
              <path
                d="M9 12l2 2 4-4"
                stroke={
                  currentStatus === "confirming" ||
                  currentStatus === "sending" ||
                  currentStatus === "completed" ||
                  currentStatus === "finished"
                    ? "#fff"
                    : "#7B7B7B"
                }
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`font-semibold text-base ${
                currentStatus === "confirming"
                  ? "text-[#FF9500]"
                  : currentStatus === "sending" ||
                      currentStatus === "completed" ||
                      currentStatus === "finished"
                    ? "text-[#1D8751]"
                    : "text-[#7B7B7B]"
              }`}
            >
              Confirming
            </span>
            {currentStatus === "confirming" && (
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
            {(currentStatus === "sending" ||
              currentStatus === "completed" ||
              currentStatus === "finished") && (
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
        {/* Step 3: Sending to you */}
        <div className="flex flex-col items-center flex-1 relative z-10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 border-4 ${
              currentStatus === "sending"
                ? "bg-[#FF9500] border-[#FF95001A]"
                : currentStatus === "completed" || currentStatus === "finished"
                  ? "bg-[#1D8751] border-[#1D87511A]"
                  : "bg-[#23232B] border-[#35353E]"
            }`}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke={
                  currentStatus === "sending"
                    ? "#fff"
                    : currentStatus === "completed" ||
                        currentStatus === "finished"
                      ? "#fff"
                      : "#7B7B7B"
                }
                strokeWidth="2"
              />
              <path
                d="M8 12h8M16 12l-4 4m4-4l-4-4"
                stroke={
                  currentStatus === "sending"
                    ? "#fff"
                    : currentStatus === "completed" ||
                        currentStatus === "finished"
                      ? "#fff"
                      : "#7B7B7B"
                }
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`font-semibold text-base ${
                currentStatus === "sending"
                  ? "text-[#FF9500]"
                  : currentStatus === "completed" ||
                      currentStatus === "finished"
                    ? "text-[#1D8751]"
                    : "text-[#7B7B7B]"
              }`}
            >
              {currentStatus === "completed" ? "Transaction Completed" : "Completed"}
            </span>
            {currentStatus === "sending" && (
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
                <span className="text-[#1D8751] text-xs font-medium">Complete</span>
              </div>
            )}
            {(currentStatus === "completed" ||
              currentStatus === "finished") && (
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
      </div>
      {/* Completion Status */}
      
      {/* Transaction Details Card */}
      <div
        className={`${
          isDark ? "bg-[#23232B] border-[#35353E]" : "bg-white border-gray-200"
        } border-2 rounded-2xl p-4 sm:p-6 shadow-lg w-full mb-4`}
      >
        {/* Title */}
        <div
          className={`${
            isDark ? "text-white" : "text-gray-900"
          } text-xl sm:text-2xl font-semibold mb-4`}
        >
          Transaction Details
        </div>
        {/* Transaction ID Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-1">
          <div
            className={`${
              isDark ? "text-[#7B7B7B]" : "text-gray-600"
            } text-sm sm:text-base font-medium`}
          >
            Transaction ID
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`${
                isDark ? "text-white" : "text-gray-900"
              } text-sm sm:text-base font-mono font-semibold break-all`}
            >
              {liveTransactionId || effectiveTransactionData?.transactionId}
            </span>
            <CopyButton
              value={liveTransactionId || effectiveTransactionData?.transactionId || ""}
              className="text-[#FFA200] hover:text-[#FFB833] transition-colors flex-shrink-0"
              showIcon={true}
            />
          </div>
        </div>
        {/* Dashed Divider */}
        <div
          className={`border-t border-dashed ${
            isDark ? "border-[#7B7B7B]" : "border-gray-400"
          } mb-4 mt-4`}
        ></div>
        {/* From/To Labels Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-2">
          <div
            className={`${
              isDark ? "text-[#7B7B7B]" : "text-gray-600"
            } text-sm sm:text-base font-medium`}
          >
            From
          </div>
          <div
            className={`${
              isDark ? "text-[#7B7B7B]" : "text-gray-600"
            } text-sm sm:text-base font-medium`}
          >
            To
          </div>
        </div>
        {/* From/To Content Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-2 mt-2">
          {/* From */}
          <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
            {effectiveTransactionData?.type === "deposit" &&
            effectiveTransactionData?.paymentDetail ? (
              <>
                <img
                  src={
                    effectiveTransactionData.paymentDetail.logo_url ||
                    effectiveTransactionData.paymentDetail.logo ||
                    effectiveTransactionData.paymentDetail.provider_logo ||
                    "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                  }
                  alt={effectiveTransactionData.paymentDetail.provider_name}
                  className="w-7 h-7 rounded-full flex-shrink-0"
                  onError={(e) => {
                    if (e.currentTarget.src !== "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png") {
                      e.currentTarget.src = "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png";
                    }
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-sm sm:text-base font-semibold truncate`}
                  >
                    {effectiveTransactionData.paymentDetail.provider_name || "direct"}
                  </div>
                  <div
                    className={`${
                      isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-xs sm:text-sm font-mono break-all`}
                  >
                    {effectiveTransactionData.paymentDetail.account_number || "direct"}
                  </div>
                </div>
              </>
            ) : (
              <>
                <img
                  src={
                    effectiveTransactionData?.asset?.icon ||
                    effectiveTransactionData?.asset?.icon_url ||
                    effectiveTransactionData?.asset?.image_url ||
                    effectiveTransactionData?.asset?.image ||
                    "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                  }
                  alt={effectiveTransactionData?.asset?.symbol || "USDT"}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-sm sm:text-base font-semibold truncate`}
                  >
                    {effectiveTransactionData?.asset?.ticker || effectiveTransactionData?.asset?.symbol || effectiveTransactionData?.asset?.name || "USDT"}
                  </div>
                  <div
                    className={`${
                      isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-xs sm:text-sm font-mono break-all`}
                  >
                    {effectiveTransactionData?.walletAddress ||
                      "TQn9Y2khEsLJW1ChVWFM...RDow5oRP7bX"}
                  </div>
                </div>
              </>
            )}
          </div>
          {/* To */}
          <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial sm:justify-end">
            {effectiveTransactionData?.type === "deposit" ? (
              <>
                <img
                  src={
                    effectiveTransactionData?.asset?.icon ||
                    effectiveTransactionData?.asset?.icon_url ||
                    effectiveTransactionData?.asset?.image_url ||
                    effectiveTransactionData?.asset?.image ||
                    "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                  }
                  alt={effectiveTransactionData?.asset?.symbol || "USDT"}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                  }}
                />
                <div className="text-left sm:text-right min-w-0 flex-1">
                  <div
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-sm sm:text-base font-semibold truncate`}
                  >
                    {effectiveTransactionData?.asset?.ticker || effectiveTransactionData?.asset?.symbol || effectiveTransactionData?.asset?.name || "USDT"}
                  </div>
                  {effectiveTransactionData?.asset?.description && (
                    <span
                      className={`${
                        isDark ? "text-[#7B7B7B]" : "text-gray-600"
                      } text-xs sm:text-sm font-normal block sm:inline sm:ml-1`}
                    >
                      {effectiveTransactionData?.asset?.description}
                    </span>
                  )}
                  <div
                    className={`${
                      isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-xs sm:text-sm font-mono break-all mt-1`}
                  >
                    {effectiveTransactionData?.walletAddress ||
                      "TQn9Y2khEsLJW1ChVWFM...RDow5oRP7bX"}
                  </div>
                </div>
              </>
            ) : (
              <>
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                  alt="Bank"
                  className="w-8 h-8 rounded-full"
                />
                <div className="text-left sm:text-right min-w-0 flex-1">
                  <div
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-sm sm:text-base font-semibold truncate`}
                  >
                    Bank Transfer
                  </div>
                  <span
                    className={`${
                      isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-xs sm:text-sm font-normal block sm:inline sm:ml-1`}
                  >
                    To your account
                  </span>
                  <div
                    className={`${
                      isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-xs sm:text-sm font-mono break-all mt-1`}
                  >
                    {effectiveTransactionData?.paymentDetails?.[0]
                      ?.account_number || "Account Number"}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

     
      <div className="w-full  rounded-2xl flex ">
       
        <div className="w-full bg-[#FF9500]/50 border-2 border-solid border-[#FF9500]/50 rounded-[18px] flex flex-col gap-2 p-3">
          <h2 className="text-white text-base font-semibold">
            Terms and Conditions Summary
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li className="text-white text-sm">
              Only send
              {`${ transactionData?.asset?.ticker || transactionData?.asset?.symbol || transactionData?.asset?.name || "USDT"} (${transactionData?.asset?.network})`}{" "}
              to this address{" "}
            </li>
            <li className="text-white text-sm">
              Send exactly the amount specified below
            </li>
            <li className="text-white text-sm">
              Do not send from exchange accounts
            </li>
            <li className="text-white text-sm">
              Minimum confirmations required: 1
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
