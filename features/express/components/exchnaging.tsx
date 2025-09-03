import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SuccessPage from "./success";
import {
  useTransactionStatusWebSocket,
  TransactionStatusMessage,
} from "../websockets";
import { API_CONFIG } from "@/lib/appConfig";
import { useTheme } from "@/context/theme";
import CopyButton from "@/components/ui/CopyButton";

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
  const { isDark } = useTheme();
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("pending");
  const [persistedTransactionData, setPersistedTransactionData] =
    useState<any>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);

  // Store final websocket data for success page
  const [finalWebsocketData, setFinalWebsocketData] = useState<any>(null);
  const [liveAmount, setLiveAmount] = useState<number | null>(null);
  const [liveCurrency, setLiveCurrency] = useState<string | null>(null);
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
        // console.error("Fallback polling error:", error);
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
        } catch (error) {}
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
      console.log("Stored transaction data in localStorage:", transactionData);
    }
  }, [transactionData]);

  // Clear localStorage when transaction is completed
  useEffect(() => {
    if (showSuccess) {
      localStorage.removeItem("express_transaction_data");
      console.log(
        "Cleared transaction data from localStorage - transaction completed"
      );
    }
  }, [showSuccess]);

  // Use WebSocket for both deposit and withdrawal transactions
  const shouldUseWebSocket =
    effectiveTransactionData?.transactionId &&
    (effectiveTransactionData?.type === "withdrawal" ||
      effectiveTransactionData?.type === "deposit");

  // WebSocket hook for both deposit and withdrawal transactions
  console.log("DEBUG: transactionData received:", effectiveTransactionData);
  console.log(
    "DEBUG: transactionId being passed to WebSocket:",
    effectiveTransactionData?.transactionId
  );
  console.log("DEBUG: transaction type:", effectiveTransactionData?.type);
  console.log(
    "DEBUG: WebSocket URL (camelCase):",
    effectiveTransactionData?.websocketUrl
  );
  console.log(
    "DEBUG: WebSocket URL (snake_case):",
    effectiveTransactionData?.websocket_url
  );

  // Extract WebSocket URL from transaction data (handle both camelCase and snake_case)
  let websocketUrl =
    effectiveTransactionData?.websocketUrl ||
    effectiveTransactionData?.websocket_url ||
    undefined;

  // Fix protocol mismatch: ensure WebSocket URL matches the API base URL protocol
  if (websocketUrl) {
    const apiBaseUrl = API_CONFIG.BASE_URL;
    const apiIsSecure = apiBaseUrl.startsWith("https://");
    const wsIsSecure = websocketUrl.startsWith("wss://");

    console.log("DEBUG: API base URL:", apiBaseUrl);
    console.log("DEBUG: API is secure:", apiIsSecure);
    console.log("DEBUG: WebSocket is secure:", wsIsSecure);

    if (apiIsSecure && !wsIsSecure) {
      // API is HTTPS but WebSocket is WS - convert to WSS
      websocketUrl = websocketUrl.replace("ws://", "wss://");
      console.log(
        "DEBUG: Converted WebSocket URL from ws:// to wss://:",
        websocketUrl
      );
    } else if (!apiIsSecure && wsIsSecure) {
      // API is HTTP but WebSocket is WSS - convert to WS (for local development)
      websocketUrl = websocketUrl.replace("wss://", "ws://");
      console.log(
        "DEBUG: Converted WebSocket URL from wss:// to ws://:",
        websocketUrl
      );
    }
  }

  console.log("DEBUG: Extracted websocketUrl:", websocketUrl);
  console.log(
    "DEBUG: effectiveTransactionData?.websocketUrl:",
    effectiveTransactionData?.websocketUrl
  );
  console.log(
    "DEBUG: effectiveTransactionData type:",
    typeof effectiveTransactionData?.websocketUrl
  );
  console.log("DEBUG: websocketUrl type:", typeof websocketUrl);
  console.log(
    "DEBUG: Full effectiveTransactionData:",
    effectiveTransactionData
  );

  // Check if websocketUrl is valid
  if (websocketUrl) {
    console.log("DEBUG: websocketUrl is valid:", websocketUrl);
    console.log("DEBUG: websocketUrl length:", websocketUrl.length);
    console.log(
      "DEBUG: websocketUrl starts with ws:// or wss://:",
      websocketUrl.startsWith("ws://") || websocketUrl.startsWith("wss://")
    );
  } else {
    console.log("DEBUG: websocketUrl is invalid or undefined");
  }

  // Check if this is a USDT/USDC transaction (should use backend WebSocket)
  const isUSDTCurrency =
    effectiveTransactionData?.asset?.ticker?.toLowerCase() === "usdt" ||
    effectiveTransactionData?.asset?.ticker?.toLowerCase() === "usdc" ||
    effectiveTransactionData?.asset?.symbol?.toLowerCase().includes("usdt") ||
    effectiveTransactionData?.asset?.symbol?.toLowerCase().includes("usdc") ||
    effectiveTransactionData?.asset?.name?.toLowerCase().includes("usdt") ||
    effectiveTransactionData?.asset?.name?.toLowerCase().includes("usdc");
  const finalWebsocketUrl = websocketUrl;
  const { isConnected, lastMessage, disconnect, sendMessage } =
    useTransactionStatusWebSocket(
      effectiveTransactionData?.transactionId || "",
      effectiveTransactionData?.type || "withdrawal",
      finalWebsocketUrl,
      {
        onMessage: (data: TransactionStatusMessage) => {
          console.log("Transaction status update:", data);
          console.log(
            "Raw WebSocket message received:",
            JSON.stringify(data, null, 2)
          );

          // Log ChangeNow specific data if present
          if (data.type === "status_update") {
            console.log("ChangeNow status update detected");
            console.log("ChangeNow data:", JSON.stringify(data.data, null, 2));
          }

          // Clear any WebSocket errors when we receive a message
          setWsError(null);
          setConnectionAttempts(0); // Reset connection attempts on successful message

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
            console.log(
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
                currency: currencyToUpdate || "USDT",
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
            console.log(
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
            console.log("Final status received:", status, message);
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

          console.log("Extracted status:", status, "message:", message);
          console.log("DEBUG: is_final check:", {
            "data.is_final": data.is_final,
            "(data as any).is_final": (data as any).is_final,
            "data.data?.is_final": data.data?.is_final,
            "data.type": data.type,
            "Raw data": data
          });

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
            
            console.log("DEBUG: Flow detection:", {
              isChangeNowFlow,
              "changenow_id": effectiveTransactionData?.details?.changenow_id,
              "fromCurrency": effectiveTransactionData?.fromCurrency,
              "toCurrency": effectiveTransactionData?.toCurrency,
              "asset": effectiveTransactionData?.asset,
              status
            });

            if (isChangeNowFlow) {
              // ChangeNow flow - combine some statuses for better UX
              if (status === "waiting") {
                uiStatus = "pending"; // waiting -> pending (awaiting deposit)
              } else if (status === "pending_blockchain") {
                uiStatus = "confirming"; // pending_blockchain -> confirming (next step after pending)
              } else if (status === "confirming") {
                uiStatus = "confirming"; // confirming stays the same
              } else if (status === "exchanging") {
                uiStatus = "exchanging"; // exchanging stays the same
              } else if (status === "sending") {
                uiStatus = "sending"; // sending stays the same
              } else if (status === "finished") {
                uiStatus = "sending"; // finished -> sending (waiting for completed status)
              } else if (status === "completed") {
                console.log("🔥 COMPLETED STATUS IN CHANGENOW FLOW DETECTED!");
                uiStatus = "completed"; // completed -> should trigger success page
              }
            } else {
              // Regular flow (first two assets)
              if (status === "pending_blockchain") {
                uiStatus = "confirming"; // pending_blockchain -> confirming (next step after pending)
              } else if (status === "transaction_created") {
                uiStatus = "confirming";
              } else if (status === "processing_transfer") {
                uiStatus = "exchanging";
              } else if (status === "approval_required") {
                uiStatus = "exchanging"; // Show as exchanging while waiting for approval
              } else if (status === "admin_approval_required") {
                uiStatus = "sending"; // Admin approval means exchanging is complete, move to sending
              } else if (status === "completed" || status === "finished") {
                // Check if this is a final completed status
                if (data.is_final === true || data.type === "final_status" || (data as any).is_final === true || data.data?.is_final === true) {
                  uiStatus = "completed"; // Show as completed when final
                } else {
                  uiStatus = "sending"; // Show as "sending to you" when completed but not final
                }
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
              data.data?.is_final === true
            );
            console.log("DEBUG: Auto-navigation check:", {
              status,
              "status === completed": status === "completed",
              "data.type": data.type,
              "data.type === final_status": data.type === "final_status",
              "data.is_final": data.is_final,
              "(data as any).is_final": (data as any).is_final,
              "data.data?.is_final": data.data?.is_final,
              "shouldAutoNavigate": shouldAutoNavigate
            });
            
            if (shouldAutoNavigate) {
              console.log("🚀 AUTO-NAVIGATION TRIGGERED! Redirecting to success page in 2 seconds...");
              // Store final websocket data for success page
              setFinalWebsocketData(data);
              // Give users time to see the completion status before redirecting
              setTimeout(() => {
                console.log("🎉 NAVIGATING TO SUCCESS PAGE NOW!");
                setShowSuccess(true);
              }, 2000); // 2 seconds delay to show completion status
            }

            // Auto-navigate to success page when transaction is agent approved
            if (status === "agent_approve") {
              // Store final websocket data for success page
              setFinalWebsocketData(data);
              // Give users time to see the completion status before redirecting
              setTimeout(() => {
                setShowSuccess(true);
                // Remove auto-redirect - let users click the button manually
              }, 1000);
            }
          } else {
            console.log(
              "Bypassing status:",
              status,
              "- not in valid statuses list"
            );
          }

          // Special handling for deposit status updates with new format
          // Check if this is a deposit status update with the new format
          if (data.type === "status_update" && data.data) {
            const depositData = data.data as any;
            
            // Check if this is a deposit transaction
            if (depositData.transaction_type === "deposit") {
              console.log("📥 DEPOSIT STATUS UPDATE DETECTED:", depositData);
              
              // Store websocket data for success page
              setFinalWebsocketData(data);
              
              // Log specific status updates for debugging
              if (depositData.status === "pending_blockchain") {
                console.log("⏳ DEPOSIT PENDING BLOCKCHAIN - Transaction hash:", depositData.tx_hash);
              }
              
              // Check if deposit is completed
              if (depositData.status === "completed") {
                console.log("🎉 DEPOSIT COMPLETED! Redirecting to success page in 2 seconds...");
                
                // Give users time to see the completion status before redirecting
                setTimeout(() => {
                  console.log("🚀 NAVIGATING TO SUCCESS PAGE FOR COMPLETED DEPOSIT!");
                  setShowSuccess(true);
                }, 2000); // 2 seconds delay
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
              console.log(
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
      console.log("WebSocket reconnected, stopping fallback polling");
      stopFallbackPolling();
    }
  }, [isConnected, fallbackPolling]);

  // Debug logging
  useEffect(() => {
    if (shouldUseWebSocket) {
      console.log(
        "WebSocket enabled for transaction:",
        effectiveTransactionData?.transactionId
      );
      console.log(
        "Transaction ID source:",
        effectiveTransactionData?.transactionId ? "provided" : "missing"
      );
      console.log("Current status:", currentStatus);
      console.log("WebSocket connected:", isConnected);
    }
  }, [
    shouldUseWebSocket,
    effectiveTransactionData?.transactionId,
    currentStatus,
    isConnected,
  ]);

  // If showing success page, render it with real transaction data and websocket data
  if (showSuccess) {
    return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center pt-2">
        <SuccessPage
        transactionData={effectiveTransactionData}
        websocketData={finalWebsocketData}
      />
    </div>
    );
  }

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
      {/* Top Card */}
      <div
        className={`flex flex-col md:flex-row justify-between items-stretch bg-[#FFFFFF] dark:${
          isDark
            ? "bg-[#23232B]  border:[#E8EFF5] dark:border-[#35353E]"
            : "bg-white border-gray-200"
        } border-2 rounded-2xl p-4 shadow-lg w-full max-w-4xl mb-4 min-h-[180px]`}
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
                  : effectiveTransactionData?.amount || 0}{" "}
                <span className="uppercase">
                  {liveCurrency ||
                    effectiveTransactionData?.asset?.ticker ||
                    effectiveTransactionData?.asset?.symbol ||
                    effectiveTransactionData?.asset?.name ||
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
                      src="https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                      alt={effectiveTransactionData.paymentDetail.provider_name}
                      className="w-6 h-6 rounded-full mr-2"
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
                effectiveTransactionData?.paymentDetail
                  ? effectiveTransactionData.paymentDetail.account_number
                  : effectiveTransactionData?.walletAddress || ""
              }`}
              alt="QR Code"
              className="w-32 h-32"
            />
          </div>
        </div>
      </div>
      {/* WebSocket Connection Status */}
      {/* {shouldUseWebSocket && (
        <div className="w-full max-w-4xl mb-4">
          <div
            className={`${
              isDark ? 'bg-[#23232B]' : 'bg-white'
            } border-2 rounded-2xl p-4 shadow-lg ${
              isConnected
                ? "border-green-500"
                : fallbackPolling
                  ? "border-blue-500"
                  : wsError
                    ? "border-red-500"
                    : "border-yellow-500"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected
                      ? "bg-green-500 animate-pulse"
                      : wsError
                        ? "bg-red-500"
                        : "bg-yellow-500 animate-pulse"
                  }`}
                ></div>
                <span
                  className={`font-semibold text-base ${
                    isConnected
                      ? "text-green-400"
                      : fallbackPolling
                        ? "text-blue-400"
                        : wsError
                          ? "text-red-400"
                          : "text-yellow-400"
                  }`}
                >
                  {isConnected
                    ? "WebSocket Connected"
                    : fallbackPolling
                      ? "Fallback Mode (Polling)"
                      : wsError
                        ? "WebSocket Error"
                        : "Connecting..."}
                </span>
              </div>
              <div className="text-right">
                <div className={`${
                  isDark ? 'text-[#7B7B7B]' : 'text-gray-600'
                } text-sm`}>
                  Transaction ID:{" "}
                  {effectiveTransactionData?.transactionId?.slice(0, 8)}...
                </div>
                {connectionAttempts > 0 && (
                  <div className={`${
                    isDark ? 'text-[#7B7B7B]' : 'text-gray-600'
                  } text-xs`}>
                    Attempts: {connectionAttempts}
                  </div>
                )}
                {wsError && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        disconnect();
                        setWsError(null);
                        setConnectionAttempts(0);
                        // Force reconnection by updating the component
                        setTimeout(() => {
                          window.location.reload();
                        }, 100);
                      }}
                      className="mt-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-colors"
                    >
                      Reconnect
                    </button>
                    <button
                      onClick={() => {
                        // Log comprehensive diagnostics
                        console.log("=== WebSocket Diagnostics ===");
                        console.log("Transaction Data:", effectiveTransactionData);
                        console.log("WebSocket URL:", finalWebsocketUrl);
                        console.log("API Base URL:", API_CONFIG.BASE_URL);
                        console.log("Connection Attempts:", connectionAttempts);
                        console.log("Is Connected:", isConnected);
                        console.log("Last Message:", lastMessage);
                        console.log("Current Error:", wsError);
                        console.log("Protocol Check:", {
                          apiIsSecure: API_CONFIG.BASE_URL.startsWith("https://"),
                          wsProtocol: finalWebsocketUrl ? (finalWebsocketUrl.startsWith("wss://") ? "secure" : "insecure") : "unknown"
                        });
                      }}
                      className="mt-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors"
                    >
                      Debug
                    </button>
                  </div>
                )}
              </div>
            </div>
                            {wsError && (
                  <div className={`mt-2 ${
                    isDark ? 'text-red-400' : 'text-red-600'
                  } text-sm`}>{wsError}</div>
                )}
            {isConnected && lastMessage && (
              <div className={`mt-2 ${
                isDark ? 'text-green-400' : 'text-green-600'
              } text-sm`}>
                Last update: {new Date().toLocaleTimeString()}
              </div>
            )}
            {lastMessage && (
              <div className={`mt-3 p-3 ${
                isDark ? 'bg-[#1A1A1A] border-[#35353E]' : 'bg-gray-100 border-gray-300'
              } rounded-lg border`}>
                <div className={`${
                  isDark ? 'text-[#7B7B7B]' : 'text-gray-600'
                } text-xs font-semibold mb-2`}>
                  WebSocket Status Data:
                </div>

                {/* User-friendly status display */}
      {/* <div className={`mb-3 p-2 ${
                  isDark ? 'bg-[#23232B] border-[#35353E]' : 'bg-white border-gray-200'
                } rounded border`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`${
                      isDark ? 'text-[#7B7B7B]' : 'text-gray-600'
                    } text-xs`}>Status:</span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        lastMessage.data?.status === "completed" ||
                        lastMessage.data?.status === "confirmed" ||
                        lastMessage.data?.status === "finished"
                          ? "bg-green-500/20 text-green-400"
                          : lastMessage.data?.status === "failed"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {(() => {
                        const status =
                          lastMessage.data?.status || lastMessage.status;
                        // Check if this is a ChangeNow flow
                        const isChangeNowFlow =
                          effectiveTransactionData?.details?.changenow_id ||
                          effectiveTransactionData?.fromCurrency ||
                          effectiveTransactionData?.toCurrency;

                        // Map backend statuses to user-friendly display names
                        switch (status) {
                          case "pending":
                            return "AWAITING DEPOSIT";
                          case "waiting":
                            return isChangeNowFlow
                              ? "AWAITING DEPOSIT"
                              : "WAITING";
                          case "confirming":
                            return "CONFIRMING";
                          case "exchanging":
                            return "EXCHANGING";
                          case "sending":
                            return "SENDING TO YOU";
                          case "transaction_created":
                            return "CONFIRMING";
                          case "processing_transfer":
                            return "EXCHANGING";
                          case "approval_required":
                            return "EXCHANGING";
                          case "completed":
                          case "finished":
                            return isChangeNowFlow
                              ? "SENDING TO YOU"
                              : "COMPLETED";
                          case "failed":
                            return "FAILED";
                          default:
                            return status?.toUpperCase() || "UNKNOWN";
                        }
                      })()}
                    </span>
                  </div>

                  {/* Live Amount Display */}
      {/* {lastMessage.data?.amount && (
                    <div className="flex items-center justify-between mb-1 mt-2">
                      <span className={`${
                        isDark ? 'text-[#7B7B7B]' : 'text-gray-600'
                      } text-xs`}>Amount:</span>
                      <div className="flex items-center gap-1">
                        <span className={`${
                          isDark ? 'text-green-400' : 'text-green-600'
                        } text-xs font-semibold`}>
                          {parseFloat(lastMessage.data.amount).toFixed(8)}{" "}
                          {lastMessage.data.currency || "USDT"}
                        </span>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  )}

                  {lastMessage.data?.message && (
                    <div className={`${
                      isDark ? 'text-white' : 'text-gray-900'
                    } text-xs mt-1`}>
                      {(() => {
                        const message = lastMessage.data.message;
                        // Map backend messages to user-friendly messages
                        switch (message) {
                          case "Withdrawal transaction created":
                            return "Transaction has been created and is being processed";
                          case "Processing transfer attempt 1/3":
                            return "Processing your withdrawal request";
                          case "Approval required before transfer":
                            return "Approval process in progress";
                          case "Successfully transferred USDC to destination address":
                            return "Successfully sent to your wallet address";
                          default:
                            return message;
                        }
                      })()}
                    </div>
                  )}
                  {lastMessage.data?.timestamp && (
                    <div className={`${
                      isDark ? 'text-[#7B7B7B]' : 'text-gray-600'
                    } text-xs mt-1`}>
                      Time:{" "}
                      {new Date(lastMessage.data.timestamp).toLocaleString()}
                    </div>
                  )}

                  {/* Amount Change History */}
      {/* {amountHistory.length > 1 && (
                    <div className={`mt-3 p-2 ${
                      isDark ? 'bg-[#1A1A1A] border-[#35353E]' : 'bg-gray-100 border-gray-300'
                    } rounded border`}>
                      <div className={`${
                        isDark ? 'text-[#7B7B7B]' : 'text-gray-600'
                      } text-xs font-semibold mb-2`}>
                        Amount Changes:
                      </div>
                      <div className="space-y-1">
                        {amountHistory.slice(-3).map((entry, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className={`${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {entry.amount.toFixed(8)} {entry.currency}
                            </span>
                            <span className={`${
                              isDark ? 'text-[#7B7B7B]' : 'text-gray-600'
                            }`}>
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Raw JSON data */}
      {/* <details className={`${
                  isDark ? 'text-[#7B7B7B]' : 'text-gray-600'
                } text-xs`}>
                  <summary className={`cursor-pointer ${
                    isDark ? 'hover:text-white' : 'hover:text-gray-900'
                  }`}>
                    Show Raw Data
                  </summary>
                  <div className={`${
                    isDark ? 'text-white' : 'text-gray-900'
                  } text-xs font-mono break-all mt-2`}>
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(lastMessage, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}
            <div className={`mt-2 ${
              isDark ? 'text-[#7B7B7B]' : 'text-gray-600'
            } text-xs break-all`}>
              URL: {finalWebsocketUrl}
            </div>
          </div>
        </div>
      )} */}
      {/* Stepper */}
      <div className="flex items-center justify-between w-full max-w-4xl mb-4 relative">
        {/* Connecting Lines */}
        <div className="absolute top-5 left-[12.5%] right-[12.5%] h-0.5 z-0">
          <div
            className={`h-0.5 transition-all duration-500 ${
              currentStatus === "completed" || currentStatus === "finished"
                ? "bg-[#1D8751] w-full"
                : currentStatus === "sending"
                  ? "bg-[#1D8751] w-full"
                  : currentStatus === "exchanging"
                    ? "bg-[#FF9500] w-3/4"
                    : currentStatus === "confirming"
                      ? "bg-[#FF9500] w-1/2"
                      : currentStatus === "pending" ||
                          currentStatus === "waiting"
                        ? "bg-[#FF9500] w-1/4"
                        : "bg-[#7B7B7B] w-0"
            }`}
          ></div>
        </div>

        {/* Step 1: Awaiting Deposit */}
        <div className="flex flex-col items-center flex-1 relative z-10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 border-4 ${
              currentStatus === "pending" ||
              currentStatus === "waiting" ||
              !shouldUseWebSocket
                ? "bg-[#FF9500] border-[#FF95001A]"
                : currentStatus === "confirming" ||
                    currentStatus === "exchanging" ||
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
                  currentStatus === "waiting" ||
                  !shouldUseWebSocket
                    ? "#fff"
                    : currentStatus === "confirming" ||
                        currentStatus === "exchanging" ||
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
                  currentStatus === "waiting" ||
                  !shouldUseWebSocket
                    ? "#fff"
                    : currentStatus === "exchanging" ||
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
                currentStatus === "waiting" ||
                !shouldUseWebSocket
                  ? "text-[#FF9500]"
                  : currentStatus === "confirming" ||
                      currentStatus === "exchanging" ||
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
              currentStatus === "waiting" ||
              !shouldUseWebSocket) && (
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
              currentStatus === "exchanging" ||
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
                : currentStatus === "exchanging" ||
                    currentStatus === "sending" ||
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
                  currentStatus === "exchanging" ||
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
                  currentStatus === "exchanging" ||
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
                  : currentStatus === "exchanging" ||
                      currentStatus === "sending" ||
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
            {(currentStatus === "exchanging" ||
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
        {/* Step 3: Exchanging */}
        <div className="flex flex-col items-center flex-1 relative z-10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 border-4 ${
              currentStatus === "exchanging"
                ? "bg-[#FF9500] border-[#FF95001A]"
                : currentStatus === "sending" ||
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
                  currentStatus === "exchanging" ||
                  currentStatus === "sending" ||
                  currentStatus === "completed" ||
                  currentStatus === "finished"
                    ? "#fff"
                    : "#7B7B7B"
                }
                strokeWidth="2"
              />
              <path
                d="M8 12h8M12 8v8"
                stroke={
                  currentStatus === "exchanging" ||
                  currentStatus === "sending" ||
                  currentStatus === "completed" ||
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
                currentStatus === "exchanging"
                  ? "text-[#FF9500]"
                  : currentStatus === "sending" ||
                      currentStatus === "completed" ||
                      currentStatus === "finished"
                    ? "text-[#1D8751]"
                    : "text-[#7B7B7B]"
              }`}
            >
              Exchanging
            </span>
            {currentStatus === "exchanging" && (
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
        {/* Step 4: Sending to you */}
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
              {currentStatus === "completed" ? "Transaction Completed" : "Sending to you"}
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
      {(currentStatus === "completed" || currentStatus === "finished") && (
        <div className="w-full max-w-4xl mb-4">
          <div className="bg-[#1D8751]/10 border-2 border-[#1D8751] rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-[#1D8751] rounded-full flex items-center justify-center">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-[#1D8751] text-lg font-semibold">
                  Transaction Completed Successfully!
                </div>
                <div className="text-[#1D8751]/80 text-sm">
                  Your funds have been sent to your wallet address
                </div>
              </div>
            </div>
            {/* Success button for ChangeNow flow */}
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setShowSuccess(true)}
                className="bg-[#1D8751] hover:bg-[#1D8751]/80 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                View Transaction Details
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Transaction Details Card */}
      <div
        className={`${
          isDark ? "bg-[#23232B] border-[#35353E]" : "bg-white border-gray-200"
        } border-2 rounded-2xl p-6 shadow-lg w-full max-w-4xl mb-4`}
      >
        {/* Title */}
        <div
          className={`${
            isDark ? "text-white" : "text-gray-900"
          } text-2xl font-semibold mb-4`}
        >
          Transaction Details
        </div>
        {/* Transaction ID Row */}
        <div className="flex items-center justify-between mb-1">
          <div
            className={`${
              isDark ? "text-[#7B7B7B]" : "text-gray-600"
            } text-base font-medium`}
          >
            Transaction ID
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`${
                isDark ? "text-white" : "text-gray-900"
              } text-base font-mono font-semibold`}
            >
              {effectiveTransactionData?.transactionId}
            </span>
            <CopyButton
              value={effectiveTransactionData?.transactionId || ""}
              className="text-[#FFA200] hover:text-[#FFB833] transition-colors"
              showIcon={true}
            />
          </div>
        </div>
        {/* Dashed Divider */}
        <div
          className={`border-t border-dashed ${
            isDark ? "border-[#7B7B7B]" : "border-gray-400"
          } mb-4`}
        ></div>
        {/* From/To Labels Row */}
        <div className="flex items-center justify-between mb-2">
          <div
            className={`${
              isDark ? "text-[#7B7B7B]" : "text-gray-600"
            } text-base font-medium`}
          >
            From
          </div>
          <div
            className={`${
              isDark ? "text-[#7B7B7B]" : "text-gray-600"
            } text-base font-medium`}
          >
            To
          </div>
        </div>
        {/* From/To Content Row */}
        <div className="flex items-center justify-between mt-2">
          {/* From */}
          <div className="flex items-center gap-2">
            {effectiveTransactionData?.type === "deposit" &&
            effectiveTransactionData?.paymentDetail ? (
              <>
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                  alt={effectiveTransactionData.paymentDetail.provider_name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-base font-semibold`}
                  >
                    {effectiveTransactionData.paymentDetail.provider_name}
                  </div>
                  <div
                    className={`${
                      isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-sm font-mono`}
                  >
                    {effectiveTransactionData.paymentDetail.account_number}
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
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                  }}
                />
                <div>
                  <div
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-base font-semibold`}
                  >
                    {effectiveTransactionData?.asset?.ticker || effectiveTransactionData?.asset?.symbol || effectiveTransactionData?.asset?.name || "USDT"}
                  </div>
                  <div
                    className={`${
                      isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-sm font-mono`}
                  >
                    {effectiveTransactionData?.walletAddress ||
                      "TQn9Y2khEsLJW1ChVWFM...RDow5oRP7bX"}
                  </div>
                </div>
              </>
            )}
          </div>
          {/* To */}
          <div className="flex items-center gap-2">
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
                <div className="text-right">
                  <div
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-base font-semibold inline-block align-middle`}
                  >
                    {effectiveTransactionData?.asset?.ticker || effectiveTransactionData?.asset?.symbol || effectiveTransactionData?.asset?.name || "USDT"}
                  </div>
                  <span
                    className={`${
                      isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-base font-normal ml-1 align-middle`}
                  >
                    {effectiveTransactionData?.asset?.description ||
                      "Tether US"}
                  </span>
                  <div
                    className={`${
                      isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-sm font-mono break-all`}
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
                <div className="text-right">
                  <div
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-base font-semibold inline-block align-middle`}
                  >
                    Bank Transfer
                  </div>
                  <span
                    className={`${
                      isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-base font-normal ml-1 align-middle`}
                  >
                    To your account
                  </span>
                  <div
                    className={`${
                      isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-sm font-mono`}
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
      {/* Live Status Display (for withdrawal transactions) */}
      {/* {shouldUseWebSocket && lastMessage && (
        <div className="w-full max-w-3xl mb-4">
          <div className="bg-[#23232B] border border-[#1D8751] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#1D8751] font-semibold text-base">
                Live Status
              </span>
              <span
                className={`text-sm px-2 py-1 rounded-full ${
                  (lastMessage.data?.status || lastMessage.status) ===
                  "completed"
                    ? "bg-green-500/20 text-green-400"
                    : (lastMessage.data?.status || lastMessage.status) ===
                      "failed"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {(
                  lastMessage.data?.status || lastMessage.status
                )?.toUpperCase() || "PENDING"}
              </span>
            </div>
            {lastMessage.data?.confirmations && (
              <div className="text-[#7B7B7B] text-sm mb-1">
                Confirmations: {lastMessage.data.confirmations}
              </div>
            )}
            {lastMessage.data?.block_number && (
              <div className="text-[#7B7B7B] text-sm mb-1">
                Block: {lastMessage.data.block_number}
              </div>
            )}
            {lastMessage.data?.timestamp && (
              <div className="text-[#7B7B7B] text-sm">
                Updated: {new Date(lastMessage.data.timestamp).toLocaleString()}
              </div>
            )}
            {lastMessage.data?.error && (
              <div className="text-red-400 text-sm mt-2">
                Error: {lastMessage.data.error}
              </div>
            )}
          </div>
        </div>
      )} */}
      {/* Terms and Conditions Summary Bar */}
      <div className="w-full max-w-4xl rounded-2xl flex ">
        {/* Faded clock icon */}
        {/* <img
          src="https://res.cloudinary.com/pitz/image/upload/v1752248844/Frame_34947_hxlr7o.png"
          alt=""
        /> */}
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
