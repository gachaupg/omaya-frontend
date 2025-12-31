import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SuccessPage from "@/features/express/components/success";
import {
  useTransactionStatusWebSocket,
  TransactionStatusMessage,
} from "@/features/express/websockets";
import {
  useMoneyXStatusWebSocket,
} from "../websockets/moneyXStatusWebSocket";
import { API_CONFIG } from "@/lib/appConfig";
import { useTheme } from "@/context/theme";
import CopyButton from "@/components/ui/CopyButton";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/rootReducer";
import { logger } from '@/lib/utils/logger';

import {
  cancelDepositTransaction,
  cancelWithdrawalTransaction,
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
    // MoneyX specific fields
    fromPaymentMethod?: any;
    toPaymentMethod?: any;
    receiveAmount?: number;
    moneyxTransactionId?: string;
    isMoneyX?: boolean;
    moneyXTransaction?: any;
  };
  onBackToTransfer?: () => void;
}

export default function Exchanging({ transactionData, onBackToTransfer }: ExchangingProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isDark } = useTheme();
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("pending");
  
  // Initialize persistedTransactionData synchronously from localStorage to prevent redirect on refresh
  const [persistedTransactionData, setPersistedTransactionData] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("moneyx_transaction_data");
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.error("Error loading transaction data from localStorage:", error);
      }
    }
    return null;
  });
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [wsError, setWsError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);

  // Timer state - 15 minutes in seconds
  const [timeRemaining, setTimeRemaining] = useState<number>(15 * 60);
  const [timerActive, setTimerActive] = useState<boolean>(true);

  // Store final websocket data for success page
  const [finalWebsocketData, setFinalWebsocketData] = useState<any>(null);
  // Store snapshot of websocket data when navigating to success (prevents data changes)
  const [snapshotWebsocketData, setSnapshotWebsocketData] = useState<any>(null);
  const [liveAmount, setLiveAmount] = useState<number | null>(null);
  const [liveCurrency, setLiveCurrency] = useState<string | null>(null);
  const [liveTransactionId, setLiveTransactionId] = useState<string | null>(
    null
  );
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
        // logger.error('general', "Fallback polling error:", error);
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
    if (!timerActive || showSuccess) return;

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
  }, [timerActive, showSuccess]);

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
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle transaction cancellation
  const handleCancelTransaction = async () => {
    if (!effectiveTransactionData?.transactionId) return;

    try {
      if (effectiveTransactionData.type === "deposit") {
        await dispatch(
          cancelDepositTransaction(effectiveTransactionData.transactionId)
        ).unwrap();
      } else if (effectiveTransactionData.type === "withdrawal") {
        await dispatch(
          cancelWithdrawalTransaction(effectiveTransactionData.transactionId)
        ).unwrap();
      }

      // Clear localStorage
      localStorage.removeItem("moneyx_transaction_data");
      localStorage.removeItem("express_transaction_data");

      // Use callback if provided (tab mode), otherwise use router (standalone mode)
      if (onBackToTransfer) {
        onBackToTransfer();
      } else {
        router.push("/dashboard/exchange/");
      }
    } catch (error) {
      logger.error('general', "Failed to cancel transaction:", error);
      // Still redirect even if cancel fails - use callback if provided (tab mode), otherwise use router (standalone mode)
      if (onBackToTransfer) {
        onBackToTransfer();
      } else {
        router.push("/dashboard/exchange/");
      }
    }
  };

  // Stop timer when transaction is completed
  useEffect(() => {
    if (currentStatus === "completed" || showSuccess) {
      setTimerActive(false);
    }
  }, [currentStatus, showSuccess]);

  // Check for transaction ID from URL and update persisted transaction data
  useEffect(() => {
    setIsLoadingData(true);
    const transactionIdFromUrl = searchParams?.get("transactionId");

    if (transactionIdFromUrl) {
      // Check if we have persisted data for this transaction
      const stored = localStorage.getItem("moneyx_transaction_data");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.transactionId === transactionIdFromUrl || parsed.moneyxTransactionId === transactionIdFromUrl) {
            setPersistedTransactionData(parsed);
            setIsLoadingData(false);
            return;
          }
        } catch (error) {
          console.error("Error parsing stored transaction data:", error);
        }
      }

      // If no persisted data found, create a basic transaction data object
      const basicTransactionData = {
        transactionId: transactionIdFromUrl,
        moneyxTransactionId: transactionIdFromUrl,
        type: "deposit",
        amount: 0,
        asset: { symbol: "USD" },
        walletAddress: "",
        network: { network_type: "Bank Transfer" },
        isMoneyX: true,
      };

      setPersistedTransactionData(basicTransactionData);
    } else {
      // If no URL transaction ID, check if we already have data from initial state
      // If not, check localStorage again (in case it was cleared)
      if (!persistedTransactionData) {
        const stored = localStorage.getItem("moneyx_transaction_data");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setPersistedTransactionData(parsed);
          } catch (error) {
            console.error("Error parsing stored transaction data:", error);
            localStorage.removeItem("moneyx_transaction_data");
          }
        }
      }
    }
    setIsLoadingData(false);
  }, [searchParams]);

  // Use persisted data if no transactionData is provided (page reload scenario)
  const effectiveTransactionData = transactionData || persistedTransactionData;

  // Store transaction data in localStorage when it's provided
  useEffect(() => {
    if (transactionData && transactionData.transactionId) {
      localStorage.setItem(
        "moneyx_transaction_data",
        JSON.stringify(transactionData)
      );
      localStorage.setItem(
        "express_transaction_data",
        JSON.stringify(transactionData)
      );
    }
  }, [transactionData]);

  // Clear localStorage when transaction is completed
  useEffect(() => {
    if (showSuccess) {
      localStorage.removeItem("moneyx_transaction_data");
      localStorage.removeItem("express_transaction_data");
    }
  }, [showSuccess]);

  // Check if this is a MoneyX transaction
  const isMoneyXTransaction = effectiveTransactionData?.isMoneyX || 
    effectiveTransactionData?.moneyxTransactionId || 
    localStorage.getItem("moneyx_transaction_data");

  // Get MoneyX transaction ID
  const moneyXTransactionId = effectiveTransactionData?.moneyxTransactionId || 
    effectiveTransactionData?.transactionId;

  // Use WebSocket for both deposit and withdrawal transactions
  const shouldUseWebSocket =
    (effectiveTransactionData?.transactionId || moneyXTransactionId) &&
    (effectiveTransactionData?.type === "withdrawal" ||
      effectiveTransactionData?.type === "deposit" ||
      isMoneyXTransaction);

  // Extract WebSocket URL from transaction data (handle both camelCase and snake_case)
  let websocketUrl =
    effectiveTransactionData?.websocketUrl ||
    effectiveTransactionData?.websocket_url ||
    undefined;

  // For MoneyX transactions, use the MoneyX WebSocket URL
  if (isMoneyXTransaction && moneyXTransactionId && !websocketUrl) {
    websocketUrl = API_CONFIG.MONEYX.SOCKETS.STATUS(moneyXTransactionId);
  }

  // Fix protocol mismatch: ensure WebSocket URL matches the API base URL protocol
  if (websocketUrl) {
    const apiBaseUrl = API_CONFIG.BASE_URL;
    const apiIsSecure = apiBaseUrl.startsWith("https://");
    const wsIsSecure = websocketUrl.startsWith("wss://");

    if (apiIsSecure && !wsIsSecure) {
      websocketUrl = websocketUrl.replace("ws://", "wss://");
    } else if (!apiIsSecure && wsIsSecure) {
      websocketUrl = websocketUrl.replace("wss://", "ws://");
    }
  }

  const finalWebsocketUrl = websocketUrl;

  // Shared message handler for WebSocket messages
  const handleWebSocketMessage = (data: TransactionStatusMessage) => {
    setWsError(null);
    setConnectionAttempts(0);

    // Handle MoneyX transaction ID
    if (data.data?.moneyx_transaction_id) {
      setLiveTransactionId(data.data.moneyx_transaction_id);
    } else if (data.data?.transaction_id) {
      setLiveTransactionId(data.data.transaction_id);
    }

    let amountToUpdate: number | null = null;
    let currencyToUpdate: string | null = null;

    setFinalWebsocketData(data);

    if (data.data?.amount) {
      const amount = parseFloat(data.data.amount);
      if (!isNaN(amount)) {
        amountToUpdate = amount;
        currencyToUpdate = data.data?.currency || "USD";
      }
    }

    if (data.type === "status_update" && data.data) {
      const wsData = data.data as any;

      if (wsData.status) {
        const validStatuses = [
          "pending",
          "pending_review",
          "pending_blockchain",
          "processing",
          "completed",
          "failed",
          "awaiting_payment",
          "exchanging",
          "sending",
          "finished",
          "confirming",
          "transaction_created",
          "processing_transfer",
          "approval_required",
          "admin_approval_required",
          "agent_approve",
          "waiting",
          "approved",
        ];

        if (validStatuses.includes(wsData.status)) {
          let uiStatus = wsData.status;
          if (wsData.status === "pending_review" || wsData.status === "pending_blockchain") {
            uiStatus = "confirming";
          } else if (wsData.status === "completed" || wsData.status === "finished" || wsData.status === "approved") {
            uiStatus = "completed";
          }
          setCurrentStatus(uiStatus);

          if (wsData.status === "completed" || wsData.status === "finished" || wsData.status === "approved") {
            setFinalWebsocketData(data);
            setSnapshotWebsocketData(data);
            setTimeout(() => {
              setShowSuccess(true);
            }, 2000);
          }
        }
      }
    }

    if (amountToUpdate !== null) {
      setLiveAmount(amountToUpdate);
    }

    if (currencyToUpdate) {
      setLiveCurrency(currencyToUpdate);
    }
  };

  // Use MoneyX WebSocket for MoneyX transactions
  const moneyXWs = useMoneyXStatusWebSocket(
    isMoneyXTransaction && moneyXTransactionId ? moneyXTransactionId : "",
    isMoneyXTransaction ? finalWebsocketUrl : undefined,
    {
      onMessage: handleWebSocketMessage,
      onError: (error) => {
        setConnectionAttempts((prev) => prev + 1);
        if (connectionAttempts > 2) {
          setWsError("Connection issue. Retrying...");
          setTimeout(() => setWsError(null), 5000);
        }
      },
      autoReconnect: true,
    }
  );

  // Use standard WebSocket for non-MoneyX transactions
  const standardWs = useTransactionStatusWebSocket(
    !isMoneyXTransaction && effectiveTransactionData?.transactionId ? effectiveTransactionData.transactionId : "",
    effectiveTransactionData?.type || "deposit",
    !isMoneyXTransaction ? finalWebsocketUrl : undefined,
      {
        onMessage: (data: TransactionStatusMessage) => {
          setWsError(null);
          setConnectionAttempts(0);

          if (data.data?.transaction_id) {
            setLiveTransactionId(data.data.transaction_id);
          }

          let amountToUpdate: number | null = null;
          let currencyToUpdate: string | null = null;

          setFinalWebsocketData(data);

          if (data.data?.amount) {
            const amount = parseFloat(data.data.amount);
            if (!isNaN(amount)) {
              amountToUpdate = amount;
              currencyToUpdate =
                data.data?.currency ||
                (effectiveTransactionData?.type === "deposit"
                  ? "USD"
                  : effectiveTransactionData?.type === "withdrawal"
                    ? "USD"
                    : "USD");
            }
          }

          if (data.type === "status_update" && data.data) {
            const wsData = data.data as any;

            if (
              wsData.amount_from !== null &&
              wsData.amount_from !== undefined
            ) {
              const amountFrom = parseFloat(wsData.amount_from);
              if (!isNaN(amountFrom)) {
                amountToUpdate = amountFrom;
                currencyToUpdate =
                  wsData.from_currency?.toUpperCase() || "USD";
              }
            }

            if (wsData.amount_to !== null && wsData.amount_to !== undefined) {
              setLiveAmount(parseFloat(wsData.amount_to));
              setLiveCurrency(
                wsData.to_currency?.toUpperCase() || "USD"
              );
            }
          }

          if (amountToUpdate !== null) {
            setPreviousAmount(liveAmount);
            setLiveAmount(amountToUpdate);

            setAmountHistory((prev) => {
              const wsData = data.data as any;
              const newEntry = {
                amount: amountToUpdate!,
                timestamp:
                  data.timestamp ||
                  wsData?.last_checked ||
                  new Date().toISOString(),
                currency: currencyToUpdate || "USD",
              };

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
          }

          let status: string | undefined;
          let message: string | undefined;

          if (data.type === "final_status" && data.data?.status) {
            status = data.data.status;
            message = data.data.message;
          } else if (data.type === "status_update" && data.data?.status) {
            status = data.data.status;
            message = data.data.message;
          } else if (data.status && typeof data.status === "string") {
            status = data.status;
            message = (data as any).message;
          } else if (data.data?.status) {
            status = data.data.status;
            message = data.data.message;
          }

          const validStatuses = [
            "pending",
            "pending_blockchain",
            "processing",
            "completed",
            "failed",
            "awaiting_payment",
            "exchanging",
            "sending",
            "finished",
            "confirming",
            "transaction_created",
            "processing_transfer",
            "approval_required",
            "admin_approval_required",
            "agent_approve",
            "waiting",
            "approved",
          ];

          if (status && validStatuses.includes(status)) {
            let uiStatus = status;

            if (status === "pending_blockchain") {
              uiStatus = "confirming";
            } else if (status === "transaction_created") {
              uiStatus = "confirming";
            } else if (status === "processing_transfer") {
              uiStatus = "exchanging";
            } else if (status === "approval_required") {
              uiStatus = "exchanging";
            } else if (status === "admin_approval_required") {
              uiStatus = "sending";
            } else if (status === "completed" || status === "finished" || status === "approved") {
              if (
                data.is_final === true ||
                data.type === "final_status" ||
                (data as any).is_final === true ||
                data.data?.is_final === true ||
                status === "approved"
              ) {
                uiStatus = "completed";
              } else {
                uiStatus = "sending";
              }
            } else if (status === "agent_approve") {
              uiStatus = "sending";
            }

            setCurrentStatus(uiStatus);

            const shouldAutoNavigate =
              uiStatus === "completed" || status === "completed" || status === "approved";

            if (shouldAutoNavigate) {
              setFinalWebsocketData(data);
              setSnapshotWebsocketData(data);
              setTimeout(() => {
                setShowSuccess(true);
              }, 2000);
            }

            if (status === "agent_approve") {
              setFinalWebsocketData(data);
              setSnapshotWebsocketData(data);
              setTimeout(() => {
                setShowSuccess(true);
              }, 1000);
            }
          }

          if (data.type === "status_update" && data.data) {
            const depositData = data.data as any;

            if (
              depositData.receiver_wallet ||
              depositData.transaction_type === "deposit"
            ) {
              setFinalWebsocketData(data);

              if (depositData.amount && depositData.currency) {
                const amount = parseFloat(depositData.amount);
                if (!isNaN(amount)) {
                  setLiveAmount(amount);
                  setLiveCurrency(depositData.currency);
                }
              }

              if (depositData.status === "completed" || depositData.status === "approved") {
                setSnapshotWebsocketData(data);
                setTimeout(() => {
                  setShowSuccess(true);
                }, 2000);
              }
            }
          }
        },
        onError: (error) => {
          if (finalWebsocketUrl) {
            console.warn(`URL: ${finalWebsocketUrl}`);
          } else {
            console.warn("No WebSocket URL provided");
          }

          setConnectionAttempts((prev) => prev + 1);

          if (!isConnected && connectionAttempts > 2) {
            const userFriendlyError = `Connection issue (attempt ${connectionAttempts}). ${
              finalWebsocketUrl ? "Retrying..." : "No WebSocket URL available"
            }`;

            setWsError(userFriendlyError);
            setTimeout(() => setWsError(null), 5000);

            if (connectionAttempts >= 5 && !fallbackPolling) {
              setFallbackPolling(true);
              startFallbackPolling();
            }
          }
        },
        autoReconnect: true,
      }
    );

  // Select the appropriate WebSocket result based on transaction type
  const { isConnected, lastMessage, disconnect, sendMessage } = isMoneyXTransaction ? moneyXWs : standardWs;

  // Stop polling when WebSocket reconnects successfully
  useEffect(() => {
    if (isConnected && fallbackPolling) {
      stopFallbackPolling();
    }
  }, [isConnected, fallbackPolling]);

  // Redirect to exchange page if no transaction data found after loading
  useEffect(() => {
    if (!isLoadingData && !effectiveTransactionData) {
      // Use callback if provided (tab mode), otherwise use router (standalone mode)
      if (onBackToTransfer) {
        onBackToTransfer();
      } else {
        router.push("/dashboard/exchange/");
      }
    }
  }, [isLoadingData, effectiveTransactionData, router, onBackToTransfer]);

  // If showing success page, render it
  if (showSuccess) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center pt-2">
        <SuccessPage
          transactionData={effectiveTransactionData}
          websocketData={snapshotWebsocketData || finalWebsocketData}
        />
      </div>
    );
  }

  // Show loading state while checking localStorage
  if (isLoadingData) {
    return (
      <div
        className={`w-full min-h-screen flex flex-col items-center justify-center pt-2 ${
          isDark ? "bg-[#0A0A0A]" : "bg-gray-50"
        }`}
      >
        <div className={`${isDark ? "text-white" : "text-gray-900"} text-lg`}>
          Loading transaction...
        </div>
      </div>
    );
  }

  // If no transaction data available after loading, show redirect message
  if (!effectiveTransactionData) {
    return (
      <div
        className={`w-full min-h-screen flex flex-col items-center justify-center pt-2 ${
          isDark ? "bg-[#0A0A0A]" : "bg-gray-50"
        }`}
      >
        <div className={`${isDark ? "text-white" : "text-gray-900"} text-lg`}>
          No transaction data found. Redirecting...
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full min-h-screen flex flex-col pt-2 overflow-x-hidden`}>
      {/* Timer Banner */}
      {timerActive && timeRemaining > 0 && (
        <div
          className={`w-full mb-4 ${
            timeRemaining <= 60
              ? "bg-red-500/20 border-red-500"
              : timeRemaining <= 300
                ? "bg-orange-500/20 border-orange-500"
                : "bg-[#1D8751]/20 border-[#1D8751]"
          } border-2 rounded-2xl p-4 flex items-center justify-between`}
        >
          <div className="flex items-center gap-3">
            <svg
              className={`w-6 h-6 ${
                timeRemaining <= 60
                  ? "text-red-500"
                  : timeRemaining <= 300
                    ? "text-orange-500"
                    : "text-[#1D8751]"
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
              <div
                className={`text-sm font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Transaction Timeout
              </div>
              <div
                className={`text-xs ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {timeRemaining <= 60
                  ? "Transaction will be cancelled soon!"
                  : "Complete your transaction before time expires"}
              </div>
            </div>
          </div>
          <div
            className={`text-2xl font-bold ${
              timeRemaining <= 60
                ? "text-red-500"
                : timeRemaining <= 300
                  ? "text-orange-500"
                  : "text-[#1D8751]"
            }`}
          >
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
        } border-2 rounded-2xl p-4 shadow-lg w-full mb-4 min-h-[180px] overflow-hidden`}
      >
        <div className="flex-1 flex flex-col justify-between py-2 pr-2 min-w-0">
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
                USD
              </span>
            </div>

            {/* MoneyX specific: Show From and To payment methods */}
            {effectiveTransactionData?.fromPaymentMethod && (
              <>
                <div
                  className={`${
                    isDark ? "text-[#7B7B7B]" : "text-gray-600"
                  } text-xs font-semibold mb-0.5 mt-3`}
                >
                  From Payment Method:
                </div>
                <div className="flex items-center mb-2 min-w-0">
                  {effectiveTransactionData.fromPaymentMethod.provider_logo ||
                  effectiveTransactionData.fromPaymentMethod.logo ? (
                    <img
                      src={
                        effectiveTransactionData.fromPaymentMethod.provider_logo ||
                        effectiveTransactionData.fromPaymentMethod.logo
                      }
                      alt={effectiveTransactionData.fromPaymentMethod.provider_name}
                      className="w-6 h-6 mr-2 rounded-md object-contain bg-white flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png";
                      }}
                    />
                  ) : null}
                  <span
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-sm font-semibold truncate`}
                  >
                    {effectiveTransactionData.fromPaymentMethod.provider_name}
                  </span>
                </div>
              </>
            )}

            {effectiveTransactionData?.toPaymentMethod && (
              <>
                <div
                  className={`${
                    isDark ? "text-[#7B7B7B]" : "text-gray-600"
                  } text-xs font-semibold mb-0.5 mt-3`}
                >
                  To Payment Method:
                </div>
                <div className="flex items-center mb-2 min-w-0">
                  {effectiveTransactionData.toPaymentMethod.provider_logo ||
                  effectiveTransactionData.toPaymentMethod.logo ? (
                    <img
                      src={
                        effectiveTransactionData.toPaymentMethod.provider_logo ||
                        effectiveTransactionData.toPaymentMethod.logo
                      }
                      alt={effectiveTransactionData.toPaymentMethod.provider_name}
                      className="w-6 h-6 mr-2 rounded-md object-contain bg-white flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png";
                      }}
                    />
                  ) : null}
                  <span
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-sm font-semibold truncate`}
                  >
                    {effectiveTransactionData.toPaymentMethod.provider_name}
                  </span>
                </div>
              </>
            )}

            {/* Bank Account Address */}
            {effectiveTransactionData?.walletAddress && (
              <>
                <div
                  className={`${
                    isDark ? "text-[#7B7B7B]" : "text-gray-600"
                  } text-xs font-semibold mb-0.5 mt-3`}
                >
                  Bank Account Address:
                </div>
                <div className="flex items-center mb-2 min-w-0">
                  <span
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-sm font-mono bg-gray-500/10 px-2 py-1 rounded text-xs break-all flex-1 min-w-0`}
                  >
                    {effectiveTransactionData.walletAddress}
                  </span>
                  <CopyButton
                    value={effectiveTransactionData.walletAddress}
                    className="ml-2 flex-shrink-0"
                  />
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
                effectiveTransactionData?.walletAddress || ""
              }`}
              alt="QR Code"
              className="w-32 h-32"
            />
          </div>
        </div>
      </div>

      {/* Progress Steps - Same as express */}
      <div className="flex items-center justify-between w-full mb-4 relative">
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
              {currentStatus === "completed"
                ? "Transaction Completed"
                : "Sending to you"}
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
        className={`${
          isDark ? "bg-[#23232B] border-[#35353E]" : "bg-white border-gray-200"
        } border-2 rounded-2xl p-6 shadow-lg w-full mb-4 overflow-hidden`}
      >
        <div
          className={`${
            isDark ? "text-white" : "text-gray-900"
          } text-2xl font-semibold mb-4`}
        >
          Transaction Details
        </div>
        {/* Transaction ID Row */}
        <div className="flex items-center justify-between mb-1 gap-2 min-w-0">
          <div
            className={`${
              isDark ? "text-[#7B7B7B]" : "text-gray-600"
            } text-base font-medium flex-shrink-0`}
          >
            Transaction ID
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span
              className={`${
                isDark ? "text-white" : "text-gray-900"
              } text-base font-mono font-semibold truncate min-w-0`}
            >
              {liveTransactionId || effectiveTransactionData?.transactionId || "Pending..."}
            </span>
            {(liveTransactionId || effectiveTransactionData?.transactionId) && (
              <CopyButton
                value={
                  liveTransactionId ||
                  effectiveTransactionData?.transactionId ||
                  ""
                }
                className="text-[#FFA200] hover:text-[#FFB833] transition-colors flex-shrink-0"
                showIcon={true}
              />
            )}
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
        <div className="flex items-start justify-between mt-2 gap-4 min-w-0">
          {/* From */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {effectiveTransactionData?.fromPaymentMethod ? (
              <>
                {(effectiveTransactionData.fromPaymentMethod.provider_logo ||
                  effectiveTransactionData.fromPaymentMethod.logo) && (
                  <img
                    src={
                      effectiveTransactionData.fromPaymentMethod.provider_logo ||
                      effectiveTransactionData.fromPaymentMethod.logo
                    }
                    alt={effectiveTransactionData.fromPaymentMethod.provider_name}
                    className="w-8 h-8 rounded-md object-contain bg-white"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png";
                    }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-base font-semibold truncate`}
                  >
                    {effectiveTransactionData.fromPaymentMethod.provider_name}
                  </div>
                  {effectiveTransactionData.fromPaymentMethod.account_number && (
                    <div
                      className={`${
                        isDark ? "text-[#7B7B7B]" : "text-gray-600"
                      } text-sm font-mono break-all`}
                    >
                      {effectiveTransactionData.fromPaymentMethod.account_number}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div
                className={`${
                  isDark ? "text-white" : "text-gray-900"
                } text-base font-semibold`}
              >
                N/A
              </div>
            )}
          </div>
          {/* To */}
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
            {effectiveTransactionData?.toPaymentMethod ? (
              <>
                {(effectiveTransactionData.toPaymentMethod.provider_logo ||
                  effectiveTransactionData.toPaymentMethod.logo) && (
                  <img
                    src={
                      effectiveTransactionData.toPaymentMethod.provider_logo ||
                      effectiveTransactionData.toPaymentMethod.logo
                    }
                    alt={effectiveTransactionData.toPaymentMethod.provider_name}
                    className="w-8 h-8 rounded-md object-contain bg-white"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png";
                    }}
                  />
                )}
                <div className="text-right min-w-0 flex-1">
                  <div
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-base font-semibold truncate`}
                  >
                    {effectiveTransactionData.toPaymentMethod.provider_name}
                  </div>
                  {effectiveTransactionData.toPaymentMethod.account_number && (
                    <div
                      className={`${
                        isDark ? "text-[#7B7B7B]" : "text-gray-600"
                      } text-sm font-mono break-all`}
                    >
                      {effectiveTransactionData.toPaymentMethod.account_number}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div
                className={`${
                  isDark ? "text-white" : "text-gray-900"
                } text-base font-semibold`}
              >
                N/A
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="w-full rounded-2xl flex">
        <div className="w-full bg-[#FF9500]/50 border-2 border-solid border-[#FF9500]/50 rounded-[18px] flex flex-col gap-2 p-3">
          <h2 className="text-white text-base font-semibold">
            Terms and Conditions Summary
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li className="text-white text-sm">
              Please send the money from your own account Only
            </li>
            <li className="text-white text-sm">
              Put transaction ID in the description field of the bank
            </li>
            <li className="text-white text-sm">
              Please note, If you do not follow above conditions, we will reject
              your transaction and send you back your money.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}


