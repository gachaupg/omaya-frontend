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
import { cookieUtils } from "@/lib/utils/cookieUtils";
import { useTheme } from "@/context/theme";
import CopyButton from "@/components/ui/CopyButton";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store/rootReducer";
import { logger } from '@/lib/utils/logger';

import {
  cancelDepositTransaction,
  cancelWithdrawalTransaction,
} from "@/features/express/slices/transactionSlice";
import FailureStatusModal from "@/features/express/components/FailureStatusModal";

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
    createdAt?: number;
  };
  onBackToTransfer?: () => void;
  isHomePage?: boolean;
}

export default function Exchanging({ transactionData, onBackToTransfer, isHomePage = false }: ExchangingProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isDark } = useTheme();
  const { tokens } = useSelector((state: any) => state.auth);
  const token = tokens?.access ?? cookieUtils.getCookie("access_token") ?? (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("pending");
  const [expandedTerms, setExpandedTerms] = useState(false);
  
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
  const [liveNetAmount, setLiveNetAmount] = useState<number | null>(null);
  const [liveNetCurrency, setLiveNetCurrency] = useState<string | null>(null);
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
  const [failureModal, setFailureModal] = useState<{
    isOpen: boolean;
    status: string;
    message?: string;
  }>({ isOpen: false, status: "", message: undefined });

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

  // Initialize timer based on transaction creation time
  useEffect(() => {
    if (effectiveTransactionData?.createdAt && typeof effectiveTransactionData.createdAt === 'number') {
      const TIMER_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
      const elapsed = Date.now() - effectiveTransactionData.createdAt;
      const remaining = Math.max(0, TIMER_DURATION - elapsed);
      const remainingSeconds = Math.floor(remaining / 1000);
      setTimeRemaining(remainingSeconds);
      
      // If timer has already expired, set to 0 and disable timer
      if (remainingSeconds <= 0) {
        setTimerActive(false);
      } else {
        setTimerActive(true);
      }
    } else {
      // If no creation time, start with full 15 minutes
      setTimeRemaining(15 * 60);
      setTimerActive(true);
    }
  }, [effectiveTransactionData?.createdAt, effectiveTransactionData?.transactionId]);

  // Store transaction data in localStorage when it's provided (include createdAt if missing)
  useEffect(() => {
    if (transactionData && transactionData.transactionId) {
      // Ensure createdAt is stored if not already present
      const dataToStore = {
        ...transactionData,
        createdAt: transactionData.createdAt || Date.now(),
      };
      localStorage.setItem(
        "moneyx_transaction_data",
        JSON.stringify(dataToStore)
      );
      localStorage.setItem(
        "express_transaction_data",
        JSON.stringify(dataToStore)
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

  // Net amount from props (form's "You Receive") – display before websockets, then sockets can override
  useEffect(() => {
    const recv = (effectiveTransactionData as any)?.receiveAmount;
    if (recv != null) {
      const parsed = parseFloat(String(recv));
      if (!isNaN(parsed)) {
        setLiveNetAmount(parsed);
        setLiveNetCurrency(
          effectiveTransactionData?.type === "deposit"
            ? (effectiveTransactionData?.asset?.ticker ||
                effectiveTransactionData?.asset?.symbol ||
                "USDT")
            : "USD"
        );
      }
    }
  }, [effectiveTransactionData]);

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
          "rejected",
          "stopped",
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

        // Show failure modal for failed, rejected, or stopped statuses
        if (["failed", "rejected", "stopped"].includes(wsData.status)) {
          setFailureModal({
            isOpen: true,
            status: wsData.status,
            message: wsData.message,
          });
          setCurrentStatus(wsData.status);
          return;
        }

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
      token: token ?? undefined,
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
      token: token ?? undefined,
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
              const amountTo = parseFloat(wsData.amount_to);
              setLiveAmount(amountTo);
              setLiveCurrency(wsData.to_currency?.toUpperCase() || "USD");
              // Let websocket override net amount
              setLiveNetAmount(amountTo);
              setLiveNetCurrency(wsData.to_currency?.toUpperCase() || "USD");
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
            "rejected",
            "stopped",
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

          // Show failure modal for failed, rejected, or stopped statuses
          if (status && ["failed", "rejected", "stopped"].includes(status)) {
            setFailureModal({
              isOpen: true,
              status,
              message: message || undefined,
            });
            setCurrentStatus(status);
          } else if (status && validStatuses.includes(status)) {
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

  const handleFailureModalClose = () => {
    setFailureModal({ isOpen: false, status: "", message: undefined });
    localStorage.removeItem("moneyx_transaction_data");
    localStorage.removeItem("express_transaction_data");
    window.location.reload();
  };

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
    <div className={`w-full ${isHomePage ? 'min-h-0' : 'min-h-screen'} flex flex-col ${isHomePage ? 'pt-0 px-2 sm:px-4' : 'pt-2'} overflow-x-hidden`}>
      {/* Timer Banner */}
      {timerActive && timeRemaining > 0 && (
        <div
          className={`w-full ${isHomePage ? 'mb-2 sm:mb-3' : 'mb-4'} ${
            timeRemaining <= 60
              ? "bg-red-500/20 border-red-500"
              : timeRemaining <= 300
                ? "bg-orange-500/20 border-orange-500"
                : "bg-[#1D8751]/20 border-[#1D8751]"
          } border-2 rounded-2xl ${isHomePage ? 'p-2 sm:p-3' : 'p-4'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
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
            className={`${isHomePage ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold ${
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
        } border-2 rounded-2xl ${isHomePage ? 'p-2 sm:p-3' : 'p-4'} shadow-lg w-full ${isHomePage ? 'mb-2 sm:mb-3' : 'mb-4'} ${isHomePage ? 'min-h-[120px] sm:min-h-[140px]' : 'min-h-[180px]'} overflow-hidden`}
      >
        <div className={`flex-1 flex flex-col justify-between ${isHomePage ? 'py-1 sm:py-2 pr-0 sm:pr-2' : 'py-2 pr-2'} min-w-0`}>
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
            {(effectiveTransactionData as any)?.receiveAmount != null && (
              <div>
                <div
                  className={`${
                    isDark ? "text-[#7B7B7B]" : "text-gray-600"
                  } text-xs font-semibold mb-0.5`}
                >
                  Net amount you&apos;ll receive:
                </div>
                <div
                  className={`${
                    isDark ? "text-[#1D8751]" : "text-[#15803D]"
                  } text-base font-semibold flex items-center gap-2`}
                >
                  <span>
                    {(
                      liveNetAmount ??
                      (effectiveTransactionData as any)?.receiveAmount ??
                      0
                    )
                      .toFixed(8)
                      .replace(/\.?0+$/, "")}{" "}
                    {liveNetCurrency ??
                      (effectiveTransactionData?.type === "deposit"
                        ? effectiveTransactionData?.asset?.ticker ||
                          effectiveTransactionData?.asset?.symbol ||
                          "USDT"
                        : "USD")}
                  </span>
                </div>
              </div>
            )}

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
        <div className={`flex-shrink-0 ${isHomePage ? 'ml-0 mt-2 md:mt-0 md:ml-3' : 'ml-0 md:ml-6'} flex items-center justify-center ${isHomePage ? 'py-1 sm:py-2' : 'py-2'}`}>
          {/* QR code */}
          <div className={`${isHomePage ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-36 h-36'} bg-white rounded-lg flex items-center justify-center flex-shrink-0`}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=${isHomePage ? '112' : '180'}x${isHomePage ? '112' : '180'}&data=${
                effectiveTransactionData?.walletAddress || ""
              }`}
              alt="QR Code"
              className={isHomePage ? "w-20 h-20 sm:w-24 sm:h-24" : "w-32 h-32"}
            />
          </div>
        </div>
      </div>

      {/* Progress Steps - Same as express */}
      <div className={`flex items-center justify-between w-full ${isHomePage ? 'mb-2 sm:mb-3 px-1' : 'mb-4'} relative overflow-x-auto`}>
        {/* Connecting Lines */}
        <div className={`absolute ${isHomePage ? 'top-3 sm:top-4' : 'top-5'} left-[12.5%] right-[12.5%] h-0.5 z-0 hidden sm:block`}>
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
        <div className={`flex flex-col items-center ${isHomePage ? 'flex-shrink-0 min-w-[70px] sm:min-w-[80px]' : 'flex-1'} relative z-10`}>
          <div
            className={`${isHomePage ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center ${isHomePage ? 'mb-0.5 sm:mb-1' : 'mb-1'} border-4 ${
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
          <div className={`flex items-center gap-1 ${isHomePage ? 'flex-wrap justify-center' : ''}`}>
            <span
              className={`font-semibold ${isHomePage ? 'text-xs sm:text-sm' : 'text-base'} ${
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
        <div className={`flex flex-col items-center ${isHomePage ? 'flex-shrink-0 min-w-[70px] sm:min-w-[80px]' : 'flex-1'} relative z-10`}>
          <div
            className={`${isHomePage ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center ${isHomePage ? 'mb-0.5 sm:mb-1' : 'mb-1'} border-4 ${
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
          <div className={`flex items-center gap-1 ${isHomePage ? 'flex-wrap justify-center' : ''}`}>
            <span
              className={`font-semibold ${isHomePage ? 'text-xs sm:text-sm' : 'text-base'} ${
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
        <div className={`flex flex-col items-center ${isHomePage ? 'flex-shrink-0 min-w-[70px] sm:min-w-[80px]' : 'flex-1'} relative z-10`}>
          <div
            className={`${isHomePage ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center ${isHomePage ? 'mb-0.5 sm:mb-1' : 'mb-1'} border-4 ${
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
          <div className={`flex items-center gap-1 ${isHomePage ? 'flex-wrap justify-center' : ''}`}>
            <span
              className={`font-semibold ${isHomePage ? 'text-xs sm:text-sm' : 'text-base'} ${
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
        <div className={`flex flex-col items-center ${isHomePage ? 'flex-shrink-0 min-w-[70px] sm:min-w-[80px]' : 'flex-1'} relative z-10`}>
          <div
            className={`${isHomePage ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center ${isHomePage ? 'mb-0.5 sm:mb-1' : 'mb-1'} border-4 ${
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
          <div className={`flex items-center gap-1 ${isHomePage ? 'flex-wrap justify-center' : ''}`}>
            <span
              className={`font-semibold ${isHomePage ? 'text-xs sm:text-sm' : 'text-base'} ${
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
        } border-2 rounded-2xl ${isHomePage ? 'p-3 sm:p-4' : 'p-6'} shadow-lg w-full ${isHomePage ? 'mb-2 sm:mb-3' : 'mb-4'} overflow-hidden`}
      >
        <div
          className={`${
            isDark ? "text-white" : "text-gray-900"
          } ${isHomePage ? 'text-lg sm:text-xl' : 'text-2xl'} font-semibold ${isHomePage ? 'mb-2 sm:mb-3' : 'mb-4'}`}
        >
          Transaction Details
        </div>
        {/* Transaction ID Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-1 min-w-0">
          <div
            className={`${
              isDark ? "text-[#7B7B7B]" : "text-gray-600"
            } text-sm sm:text-base font-medium flex-shrink-0`}
          >
            Transaction ID
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial sm:justify-end">
            <span
              className={`${
                isDark ? "text-white" : "text-gray-900"
              } text-xs sm:text-sm md:text-base font-mono font-semibold truncate min-w-0`}
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
        {/* From (left) | To (start of second part) — aligned UI */}
        <div className="flex mb-2">
          <div
            className={`flex-shrink-0 w-1/2 ${
              isDark ? "text-[#7B7B7B]" : "text-gray-600"
            } text-sm sm:text-base font-medium`}
          >
            From
          </div>
          <div
            className={`flex-1 min-w-0 text-left pl-2 sm:pl-4 ${
              isDark ? "text-[#7B7B7B]" : "text-gray-600"
            } text-sm sm:text-base font-medium`}
          >
            To
          </div>
        </div>
        <div className="flex mt-2 items-start gap-0">
          {/* Left: From */}
          <div className="flex items-start gap-3 min-w-0 w-1/2 flex-shrink-0 pr-2 sm:pr-4">
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
                    className="w-8 h-8 rounded-md object-contain bg-white flex-shrink-0 mt-0.5"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png";
                    }}
                  />
                )}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-sm sm:text-base font-semibold truncate`}
                  >
                    {effectiveTransactionData.fromPaymentMethod.provider_name}
                  </div>
                  {effectiveTransactionData.fromPaymentMethod.account_number && (
                    <div
                      className={`${
                        isDark ? "text-[#7B7B7B]" : "text-gray-600"
                      } text-xs sm:text-sm font-mono truncate`}
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
                } text-sm sm:text-base font-semibold`}
              >
                N/A
              </div>
            )}
          </div>
          {/* Right: To — from center to end */}
          <div className="flex items-start gap-3 min-w-0 flex-1 pl-2 sm:pl-4 border-l border-dashed border-gray-300 dark:border-[#35353E]">
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
                    className="w-8 h-8 rounded-md object-contain bg-white flex-shrink-0 mt-0.5"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png";
                    }}
                  />
                )}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-sm sm:text-base font-semibold truncate`}
                  >
                    {effectiveTransactionData.toPaymentMethod.provider_name}
                  </div>
                  {effectiveTransactionData.toPaymentMethod.account_number && (
                    <div
                      className={`${
                        isDark ? "text-[#7B7B7B]" : "text-gray-600"
                      } text-xs sm:text-sm font-mono truncate mt-1`}
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
                } text-sm sm:text-base font-semibold`}
              >
                N/A
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="w-full rounded-2xl flex">
        <div className={`w-full border border-[#1D8751] rounded-xl overflow-hidden transition-all duration-300 ${isDark ? "bg-[#1D1D23]" : "bg-[#F8FAFF]"}`}>
          <div className={`flex flex-col ${isHomePage ? "gap-1 sm:gap-2 p-2 sm:p-3" : "gap-2 p-3"}`}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#1D8751]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className={`font-medium ${isHomePage ? "text-sm sm:text-base" : "text-base"} ${isDark ? "text-white" : "text-gray-900"}`}>
                Terms & Conditions
              </h3>
            </div>
            <div className={`space-y-2 ${expandedTerms ? "" : "line-clamp-3"}`}>
              <div className="flex items-start gap-2">
                <span className="text-[#1D8751] font-bold text-sm flex-shrink-0">1.</span>
                <p className={`text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-[#475569]"}`}>
                  <span className="font-semibold">Send from your own account only:</span> Please send the money from your own account only.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#1D8751] font-bold text-sm flex-shrink-0">2.</span>
                <p className={`text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-[#475569]"}`}>
                  <span className="font-semibold">Put transaction ID in the description field:</span> You must put the transaction ID in the description field of the bank.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#1D8751] font-bold text-sm flex-shrink-0">3.</span>
                <p className={`text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-[#475569]"}`}>
                  <span className="font-semibold">Non-compliance:</span> Please note, if you do not follow the above conditions, we will reject your transaction and send you back your money.
                </p>
              </div>
            </div>
            <button
              onClick={() => setExpandedTerms(!expandedTerms)}
              className="mt-2 text-[#1D8751] hover:text-[#166b3e] font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
            >
              {expandedTerms ? (
                <>
                  <span>Show Less</span>
                  <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </>
              ) : (
                <>
                  <span>Show More</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Failure Status Modal */}
      <FailureStatusModal
        isOpen={failureModal.isOpen}
        status={failureModal.status}
        message={failureModal.message}
        onClose={() => setFailureModal({ isOpen: false, status: "", message: undefined })}
        onBackToForm={handleFailureModalClose}
        isDark={isDark}
      />
    </div>
  );
}


