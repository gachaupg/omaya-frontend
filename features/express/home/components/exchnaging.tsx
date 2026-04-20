import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SuccessPage from "./success";
import {
  useTransactionStatusWebSocket,
  TransactionStatusMessage,
} from "../../websockets";
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
} from "../../slices/transactionSlice";
import FailureStatusModal from "../../components/FailureStatusModal";
import { resolveExpressTransactionFailureMessage } from "@/lib/utils/websocketUtils";

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
    receiveAmount?: number; // Net amount user will receive (form's "You Receive")
    createdAt?: number;
  };
  isHomePage?: boolean;
}

export default function Exchanging({ transactionData, isHomePage = false }: ExchangingProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isDark } = useTheme();
  const { tokens } = useSelector((state: any) => state.auth);
  const token = tokens?.access ?? cookieUtils.getCookie("access_token") ?? (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("pending");
  const [persistedTransactionData, setPersistedTransactionData] =
    useState<any>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);

  // Timer state - 15 minutes, wall-clock based (immune to tab throttling)
  const TIMER_DURATION_SEC = 15 * 60;
  const expiryTimestampRef = React.useRef<number | null>(null);
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
  const [expandedTerms, setExpandedTerms] = useState(false);
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

  // Compute remaining time from wall-clock (immune to tab throttling)
  const computeTimeRemaining = React.useCallback(() => {
    const expiry = expiryTimestampRef.current;
    if (!expiry) return TIMER_DURATION_SEC;
    return Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
  }, []);

  // Initialize expiry timestamp when we have transaction data
  const effectiveDataForTimer = transactionData || persistedTransactionData;
  useEffect(() => {
    if (!effectiveDataForTimer?.transactionId || !timerActive || showSuccess) return;
    const storageKey = "express_transaction_expiry";
    const txId = effectiveDataForTimer.transactionId;
    if (!expiryTimestampRef.current) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const { transactionId, expiry } = JSON.parse(stored);
          if (transactionId === txId) {
            expiryTimestampRef.current = expiry;
            if (expiry <= Date.now()) {
              setTimeRemaining(0);
              setTimerActive(false);
              return;
            }
            setTimeRemaining(computeTimeRemaining());
            return;
          }
        }
      } catch {}
      const expiry = Date.now() + TIMER_DURATION_SEC * 1000;
      expiryTimestampRef.current = expiry;
      localStorage.setItem(storageKey, JSON.stringify({ transactionId: txId, expiry }));
    }
    setTimeRemaining(computeTimeRemaining());
  }, [effectiveDataForTimer?.transactionId, timerActive, showSuccess, computeTimeRemaining]);

  // Timer: wall-clock + Page Visibility for tab-inactive accuracy
  useEffect(() => {
    if (!timerActive || showSuccess) return;
    const tick = () => {
      const remaining = computeTimeRemaining();
      setTimeRemaining(remaining);
      if (remaining <= 0) setTimerActive(false);
    };
    const interval = setInterval(tick, 1000);
    tick();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [timerActive, showSuccess, computeTimeRemaining]);

  // Auto-cancel when timer expires (guard to prevent double redirect on tab switch/reload)
  const hasRedirectedOnExpiry = React.useRef(false);
  const effectiveDataForExpiry = transactionData || persistedTransactionData;
  useEffect(() => {
    if (timeRemaining !== 0 || hasRedirectedOnExpiry.current) return;
    const txId = effectiveDataForExpiry?.transactionId;
    if (!txId) return;
    hasRedirectedOnExpiry.current = true;
    handleCancelTransaction();
  }, [timeRemaining, effectiveDataForExpiry?.transactionId]);

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
      localStorage.removeItem("express_transaction_data");
      localStorage.removeItem("express_transaction_expiry");

      // Redirect to home page
      router.push("/");
    } catch (error) {
      logger.error('general', "Failed to cancel transaction:", error);
      // Still redirect even if cancel fails
      router.push("/");
    }
  };

  // Stop timer when transaction is completed
  useEffect(() => {
    if (currentStatus === "completed" || showSuccess) {
      setTimerActive(false);
      localStorage.removeItem("express_transaction_expiry");
    }
  }, [currentStatus, showSuccess]);

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

  const getStableReceiveCurrency = React.useCallback(
    (fallback?: string) => {
      if (
        effectiveTransactionData?.type === "deposit" ||
        effectiveTransactionData?.type === "withdrawal"
      ) {
        return "USD";
      }
      const detailsToCurrency = effectiveTransactionData?.details?.to_currency
        ?.toString()
        .toUpperCase();
      if (detailsToCurrency) {
        return detailsToCurrency;
      }
      return fallback || "USD";
    },
    [effectiveTransactionData]
  );

  const getStableSendCurrency = React.useCallback(
    (fallback?: string) => {
      const detailsFromCurrency = effectiveTransactionData?.details?.from_currency
        ?.toString()
        .toUpperCase();
      if (detailsFromCurrency) {
        return detailsFromCurrency;
      }
      return (
        fallback ||
        effectiveTransactionData?.asset?.ticker ||
        effectiveTransactionData?.asset?.symbol ||
        effectiveTransactionData?.asset?.name ||
        "USD"
      );
    },
    [effectiveTransactionData]
  );

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
        "express_transaction_data",
        JSON.stringify(dataToStore)
      );
    }
  }, [transactionData]);

  // Clear localStorage when transaction is completed
  useEffect(() => {
    if (showSuccess) {
      localStorage.removeItem("express_transaction_data");
    }
  }, [showSuccess]);

  // Net amount from props (form's "You Receive")
  useEffect(() => {
    const recv = (effectiveTransactionData as any)?.receiveAmount;
    if (recv != null) {
      const parsed = parseFloat(String(recv));
      if (!isNaN(parsed)) {
        setLiveNetAmount(parsed);
        setLiveNetCurrency(
          getStableReceiveCurrency(
            effectiveTransactionData?.asset?.ticker ||
              effectiveTransactionData?.asset?.symbol ||
              "USD"
          )
        );
      }
    }
  }, [effectiveTransactionData, getStableReceiveCurrency]);

  // Keep payout currency fixed for bank payout flows (deposit/withdrawal).
  useEffect(() => {
    if (
      effectiveTransactionData?.type === "deposit" ||
      effectiveTransactionData?.type === "withdrawal"
    ) {
      setLiveNetCurrency("USD");
    }
  }, [effectiveTransactionData?.transactionId, effectiveTransactionData?.type]);

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

  // Check if websocketUrl is valid
  if (websocketUrl) {
  }

  // Check if this is a USDT transaction (should use backend WebSocket)
  const isUSDTCurrency =
    effectiveTransactionData?.asset?.ticker?.toLowerCase() === "usdt" ||
    effectiveTransactionData?.asset?.symbol?.toLowerCase()?.includes("usdt") ||
    effectiveTransactionData?.asset?.name?.toLowerCase()?.includes("usdt");
  const finalWebsocketUrl = websocketUrl;
  const { isConnected, lastMessage, disconnect, sendMessage } =
    useTransactionStatusWebSocket(
      effectiveTransactionData?.transactionId || "",
      effectiveTransactionData?.type || "withdrawal",
      finalWebsocketUrl,
      {
        token: token ?? undefined,
        onMessage: (data: TransactionStatusMessage) => {
          const rootPayload = ((data as any)?.data &&
            typeof (data as any).data === "object")
            ? ((data as any).data as Record<string, any>)
            : ({} as Record<string, any>);
          const statusPayload =
            data.type === "status_update" &&
            rootPayload?.data &&
            typeof rootPayload.data === "object"
              ? (rootPayload.data as Record<string, any>)
              : rootPayload;

          // Clear any WebSocket errors when we receive a message
          setWsError(null);
          setConnectionAttempts(0); // Reset connection attempts on successful message

          // Update transaction ID from WebSocket data if available
          const txIdFromSocket = String(
            statusPayload?.transaction_id || rootPayload?.transaction_id || ""
          ).trim();
          if (txIdFromSocket) {
            setLiveTransactionId(txIdFromSocket);
          }

          // Update amount and currency from WebSocket data
          // Check for both regular amount format and ChangeNow status update format
          let amountToUpdate: number | null = null;
          let currencyToUpdate: string | null = null;

          // Store websocket data for potential success page use
          setFinalWebsocketData(data);

          // Check regular amount format
          if (statusPayload?.amount != null) {
            const amount = parseFloat(String(statusPayload.amount));
            if (!isNaN(amount)) {
              amountToUpdate = amount;
              currencyToUpdate =
                statusPayload?.currency ||
                getStableSendCurrency();
            }
          }

          // Check ChangeNow status update format and direct flow format
          if (data.type === "status_update" && data.data) {
            const wsData = statusPayload as any;

            // Handle amount_from (what user sent/paid)
            if (
              wsData.amount_from !== null &&
              wsData.amount_from !== undefined
            ) {
              const amountFrom = parseFloat(wsData.amount_from);
              if (!isNaN(amountFrom)) {
                amountToUpdate = amountFrom;
                currencyToUpdate =
                  wsData.from_currency?.toUpperCase() ||
                  getStableSendCurrency();
              }
            }

            const toCurrencyLabel =
              wsData.to_currency?.toUpperCase() ||
              wsData.currency?.toUpperCase() ||
              getStableReceiveCurrency(
                effectiveTransactionData?.asset?.ticker ||
                  effectiveTransactionData?.asset?.symbol ||
                  "USD"
              );
            const amountTo = parseFloat(String(wsData.amount_to ?? ""));
            const netAmount = parseFloat(String(wsData.net_amount ?? ""));
            const estimatedAmount = parseFloat(String(wsData.estimated_amount ?? ""));
            const expectedAmountTo = parseFloat(String(wsData.amount_expected_to ?? ""));
            // Prefer non-zero receive values for pending ChangeNOW responses.
            const preferredNetAmount =
              (Number.isFinite(amountTo) && amountTo > 0 ? amountTo : null) ??
              (Number.isFinite(estimatedAmount) && estimatedAmount > 0
                ? estimatedAmount
                : null) ??
              (Number.isFinite(expectedAmountTo) && expectedAmountTo > 0
                ? expectedAmountTo
                : null) ??
              (Number.isFinite(netAmount) ? netAmount : null);
            if (preferredNetAmount !== null) {
              setLiveNetAmount(preferredNetAmount);
              setLiveNetCurrency(getStableReceiveCurrency(toCurrencyLabel));
            }

            // Handle expected amounts if actual amounts are not available
            if (
              amountToUpdate === null &&
              wsData.amount_expected_from !== null &&
              wsData.amount_expected_from !== undefined
            ) {
              const expectedAmount = parseFloat(wsData.amount_expected_from);
              if (!isNaN(expectedAmount)) {
                amountToUpdate = expectedAmount;
                currencyToUpdate =
                  wsData.from_currency?.toUpperCase() ||
                  getStableSendCurrency();
              }
            }

            // Handle paid_amount for direct flows
            if (
              wsData.paid_amount !== null &&
              wsData.paid_amount !== undefined
            ) {
              const paidAmount = parseFloat(wsData.paid_amount);
              if (!isNaN(paidAmount)) {
                amountToUpdate = paidAmount;
                currencyToUpdate =
                  wsData.from_currency?.toUpperCase() ||
                  getStableSendCurrency();
              }
            }

            // Handle estimated_amount for direct flows
            if (
              wsData.estimated_amount !== null &&
              wsData.estimated_amount !== undefined
            ) {
              const estimatedAmount = parseFloat(wsData.estimated_amount);
              if (!isNaN(estimatedAmount)) {
                setLiveNetAmount(estimatedAmount);
                setLiveNetCurrency(
                  getStableReceiveCurrency(
                    wsData.to_currency?.toUpperCase() ||
                      effectiveTransactionData?.asset?.ticker ||
                      effectiveTransactionData?.asset?.symbol ||
                      "USD"
                  )
                );
              }
            }

            // amount_expected_to can contain the pending receive estimate.
            if (
              wsData.amount_expected_to !== null &&
              wsData.amount_expected_to !== undefined
            ) {
              const expectedTo = parseFloat(String(wsData.amount_expected_to));
              if (!isNaN(expectedTo) && expectedTo > 0) {
                setLiveNetAmount(expectedTo);
                setLiveNetCurrency(
                  getStableReceiveCurrency(
                    wsData.to_currency?.toUpperCase() ||
                      effectiveTransactionData?.asset?.ticker ||
                      effectiveTransactionData?.asset?.symbol ||
                      "USD"
                  )
                );
              }
            }
          }

          // Update state if we found valid amounts
          if (amountToUpdate !== null) {
            // Store previous amount before updating
            setPreviousAmount(liveAmount);

            setLiveAmount(amountToUpdate);

            // Track amount changes in history
            setAmountHistory((prev) => {
              const wsData = data.data as any;
              const newEntry = {
                amount: amountToUpdate!,
                timestamp:
                  data.timestamp ||
                  wsData?.last_checked ||
                  wsData?.updatedAt ||
                  data.data?.timestamp ||
                  new Date().toISOString(),
                currency:
                  currencyToUpdate ||
                  wsData?.from_currency?.toUpperCase() ||
                  transactionData?.details?.to_currency ||
                  getStableSendCurrency(),
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
          }

          // Handle different WebSocket message formats
          let status: string | undefined;
          let message: string | undefined;

          // Check if it's a final_status message (transaction completed)
          if (data.type === "final_status" && data.data?.status) {
            // Final status format - transaction completed
            status = data.data.status;
            message = data.data.message;
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
            "rejected",
            "stopped",
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

          // Show failure modal for failed, rejected, or stopped statuses
          if (status && ["failed", "rejected", "stopped"].includes(status)) {
            const rawNotification =
              (data as any)?.data?.notification ??
              (data as any)?.notification;
            let wsNotificationReason: unknown =
              (data as any)?.data?.notification?.reason ??
              (data as any)?.notification?.reason;
            if (!wsNotificationReason && typeof rawNotification === "string") {
              try {
                const parsed = JSON.parse(rawNotification) as { reason?: unknown };
                wsNotificationReason = parsed?.reason;
              } catch {
                // Keep existing value if notification is not valid JSON.
              }
            }
            const wsNotificationReasonText =
              typeof wsNotificationReason === "string"
                ? wsNotificationReason.trim()
                : typeof wsNotificationReason === "number"
                  ? String(wsNotificationReason)
                  : "";
            let failureMessage =
              (wsNotificationReasonText || undefined) ??
              resolveExpressTransactionFailureMessage(data) ?? message;
            if (
              !failureMessage &&
              status === "rejected" &&
              (data.data as any)?.assign_to_name
            ) {
              failureMessage = `Rejected by ${(data.data as any).assign_to_name}`;
            }
            setFailureModal({
              isOpen: true,
              status,
              message: failureMessage || undefined,
            });
            setCurrentStatus(status);
            setTimerActive(false);
          } else if (status && validStatuses.includes(status)) {
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
              } else if (status === "exchanging") {
                uiStatus = "exchanging"; // exchanging stays the same
              } else if (status === "sending") {
                uiStatus = "sending"; // sending stays the same
              } else if (status === "finished") {
                uiStatus = "sending"; // finished -> sending (waiting for completed status)
              } else if (status === "completed") {
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
                if (
                  data.is_final === true ||
                  data.type === "final_status" ||
                  (data as any).is_final === true ||
                  data.data?.is_final === true
                ) {
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
            // Navigate on ANY completed status - whether from ChangeNow or direct transfer
            const shouldAutoNavigate =
              uiStatus === "completed" || status === "completed";

            if (shouldAutoNavigate) {
              // Store final websocket data for success page
              setFinalWebsocketData(data);
              // Create snapshot of websocket data to prevent changes in success page
              setSnapshotWebsocketData(data);
              // Give users time to see the completion status before redirecting
              setTimeout(() => {
                setShowSuccess(true);
              }, 2000); // 2 seconds delay to show completion status
            }

            // Auto-navigate to success page when transaction is agent approved
            if (status === "agent_approve") {
              // Store final websocket data for success page
              setFinalWebsocketData(data);
              // Create snapshot of websocket data to prevent changes in success page
              setSnapshotWebsocketData(data);
              // Give users time to see the completion status before redirecting
              setTimeout(() => {
                setShowSuccess(true);
                // Remove auto-redirect - let users click the button manually
              }, 1000);
            }
          } else {
          }

          // Special handling for P2P deposit status updates
          // Check if this is a P2P deposit status update (has receiver_wallet field)
          if (data.type === "status_update" && data.data) {
            const depositData = data.data as any;

            // Check if this is a P2P deposit transaction (has receiver_wallet field)
            if (
              depositData.receiver_wallet ||
              depositData.transaction_type === "deposit"
            ) {
              // Store websocket data for success page
              setFinalWebsocketData(data);

              // Update live amount and currency from P2P deposit data
              if (depositData.amount && depositData.currency) {
                const amount = parseFloat(depositData.amount);
                if (!isNaN(amount)) {
                  setLiveAmount(amount);
                  setLiveCurrency(depositData.currency);
                }
              }

              // Log specific status updates for debugging
              if (depositData.status === "pending_blockchain") {
              }

              // Check if P2P deposit is completed
              if (depositData.status === "completed") {
                // Create snapshot of websocket data to prevent changes in success page
                setSnapshotWebsocketData(data);

                // Give users time to see the completion status before redirecting
                setTimeout(() => {
                  setShowSuccess(true);
                }, 2000); // 2 seconds delay
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
      stopFallbackPolling();
    }
  }, [isConnected, fallbackPolling]);

  // Debug logging
  useEffect(() => {
    if (shouldUseWebSocket) {
    }
  }, [
    shouldUseWebSocket,
    effectiveTransactionData?.transactionId,
    currentStatus,
    isConnected,
  ]);

  const handleFailureModalClose = () => {
    setFailureModal({ isOpen: false, status: "", message: undefined });
    localStorage.removeItem("express_transaction_data");
    window.location.reload();
  };

  // If showing success page, render it with real transaction data and snapshot websocket data
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

  const wsNetCandidates = {
    amountTo: parseFloat(String((finalWebsocketData as any)?.data?.amount_to ?? "")),
    estimatedAmount: parseFloat(
      String((finalWebsocketData as any)?.data?.estimated_amount ?? "")
    ),
    expectedAmountTo: parseFloat(
      String((finalWebsocketData as any)?.data?.amount_expected_to ?? "")
    ),
    netAmount: parseFloat(String((finalWebsocketData as any)?.data?.net_amount ?? "")),
  };
  const resolvedDisplayNetAmount =
    (liveNetAmount != null && liveNetAmount > 0 ? liveNetAmount : null) ??
    (Number.isFinite(wsNetCandidates.amountTo) && wsNetCandidates.amountTo > 0
      ? wsNetCandidates.amountTo
      : null) ??
    (Number.isFinite(wsNetCandidates.estimatedAmount) &&
    wsNetCandidates.estimatedAmount > 0
      ? wsNetCandidates.estimatedAmount
      : null) ??
    (Number.isFinite(wsNetCandidates.expectedAmountTo) &&
    wsNetCandidates.expectedAmountTo > 0
      ? wsNetCandidates.expectedAmountTo
      : null) ??
    (Number.isFinite(wsNetCandidates.netAmount) ? wsNetCandidates.netAmount : null) ??
    ((effectiveTransactionData as any)?.receiveAmount ?? 0);

  return (
    <div className={`w-full ${isHomePage ? 'min-h-0' : 'min-h-screen'} flex flex-col items-center ${isHomePage ? 'pt-0 px-2 sm:px-4' : 'pt-2'}`}>
      {/* Timer Banner */}
      {timerActive && timeRemaining > 0 && (
        <div
          className={`w-full ${isHomePage ? 'mb-2 sm:mb-3' : 'max-w-4xl mb-4'} ${
            timeRemaining <= 60
              ? "bg-red-500/20 border-red-500"
              : timeRemaining <= 300
                ? "bg-orange-500/20 border-orange-500"
                : "bg-[#1D8751]/20 border-[#1D8751]"
          } border-2 rounded-2xl ${isHomePage ? 'p-2 sm:p-3' : 'p-4'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2`}
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
            className={`${isHomePage ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold ${
              timeRemaining <= 60
                ? "text-red-500"
                : timeRemaining <= 300
                  ? "text-orange-500"
                  : "text-[#1D8751]"
            } self-start sm:self-auto`}
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
        } border-2 rounded-2xl ${isHomePage ? 'p-2 sm:p-3' : 'p-4'} shadow-lg w-full ${isHomePage ? '' : 'max-w-4xl'} ${isHomePage ? 'mb-2 sm:mb-3' : 'mb-4'} ${isHomePage ? 'min-h-[120px] sm:min-h-[140px]' : 'min-h-[180px]'} overflow-hidden`}
      >
        <div className={`flex-1 flex flex-col justify-between ${isHomePage ? 'py-1 sm:py-2 pr-0 sm:pr-2' : 'py-2 pr-2'} min-w-0`}>
          <div className="space-y-3 sm:space-y-4">
            {/* Amount row */}
            <div className="flex flex-wrap gap-4 sm:gap-6">
              <div className="min-w-0">
                <p className={`text-xs font-medium mb-0.5 ${isDark ? "text-[#7B7B7B]" : "text-gray-500"}`}>Amount</p>
                <p className={`text-base font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                  {liveAmount !== null ? liveAmount : effectiveTransactionData?.amount || 0}{" "}
                  {(liveCurrency ||
                    getStableSendCurrency(
                      effectiveTransactionData?.asset?.ticker ||
                        effectiveTransactionData?.asset?.symbol ||
                        effectiveTransactionData?.asset?.name
                    )).toUpperCase()}
                </p>
              </div>
              {(effectiveTransactionData as any)?.receiveAmount != null ||
              liveNetAmount != null ? (
                <div className="min-w-0">
                  <p className={`text-xs font-medium mb-0.5 ${isDark ? "text-[#7B7B7B]" : "text-gray-500"}`}>Net amount you&apos;ll receive</p>
                  <p className="text-base font-semibold text-[#1D8751]">
                    {(resolvedDisplayNetAmount).toFixed(8).replace(/\.?0+$/, "")}{" "}
                    <span className="uppercase">
                      {liveNetCurrency || getStableReceiveCurrency()}
                    </span>
                  </p>
                </div>
              ) : null}
            </div>
            {/* {liveAmount !== null &&
              liveAmount !== effectiveTransactionData?.amount && (
                <div className={`${
                  isDark ? 'text-[#7B7B7B]' : 'text-gray-600'
                } text-xs mb-1`}>
                  Initial: {effectiveTransactionData?.amount || 0}{" "}
                  {effectiveTransactionData?.asset?.ticker || (effectiveTransactionData?.type === "deposit" ? "USD" : effectiveTransactionData?.type === "withdrawal" ? "USD" : "USDT")}
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
                      getStableSendCurrency()}
                  </div>
                  <div className="text-green-400 text-xs">
                    Current: {liveAmount.toFixed(8)}{" "}
                    {liveCurrency ||
                      effectiveTransactionData?.asset?.ticker ||
                      effectiveTransactionData?.asset?.symbol ||
                      effectiveTransactionData?.asset?.name ||
                      getStableSendCurrency()}
                  </div>
                </div>
              )}
            {/* Deposit-specific information display */}
            {effectiveTransactionData?.type === "deposit" && (
              <>
                {/* Asset and Network */}
                <div className="pt-2 border-t border-gray-200 dark:border-[#35353E]">
                  <p className={`text-xs font-medium mb-1.5 ${isDark ? "text-[#7B7B7B]" : "text-gray-500"}`}>Asset & Network</p>
                  <div className="flex items-center gap-2">
                    <img
                      src={
                        effectiveTransactionData?.asset?.icon ||
                        effectiveTransactionData?.asset?.icon_url ||
                        effectiveTransactionData?.asset?.image_url ||
                        effectiveTransactionData?.asset?.image ||
                        "/assets/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                      }
                      alt={effectiveTransactionData?.asset?.ticker || effectiveTransactionData?.asset?.symbol || effectiveTransactionData?.asset?.name || "Asset"}
                      className="w-5 h-5 rounded-full shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = "/assets/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                      }}
                    />
                    <span className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                      {effectiveTransactionData?.asset?.ticker ||
                        effectiveTransactionData?.asset?.symbol ||
                        effectiveTransactionData?.asset?.name ||
                        getStableSendCurrency()}
                    </span>
                    <span className="bg-[#1D8751] text-white text-xs font-medium px-2 py-0.5 rounded-full">{effectiveTransactionData?.asset?.network || effectiveTransactionData?.network?.network_type || "BSC"}</span>
                  </div>
                </div>

                {/* Wallet Address */}
                {effectiveTransactionData?.walletAddress && (
                  <div className="pt-2 border-t border-gray-200 dark:border-[#35353E]">
                    <p className={`text-xs font-medium mb-1.5 ${isDark ? "text-[#7B7B7B]" : "text-gray-500"}`}>Wallet Address</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className={`text-sm font-mono break-all px-2 py-1 rounded-lg ${isDark ? "bg-[#2A2A30] text-white" : "bg-gray-100 text-gray-900"}`}>
                        {effectiveTransactionData.walletAddress}
                      </code>
                      <CopyButton value={effectiveTransactionData.walletAddress} className="shrink-0" />
                    </div>
                  </div>
                )}

                {/* Bank Information */}
                {effectiveTransactionData?.paymentDetail && effectiveTransactionData.paymentDetail.provider_name !== "direct" && (
                  <div className="pt-2 border-t border-gray-200 dark:border-[#35353E]">
                    <p className={`text-xs font-medium mb-1.5 ${isDark ? "text-[#7B7B7B]" : "text-gray-500"}`}>Bank</p>
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src="/assets/image_7_jijlik.png"
                        alt={effectiveTransactionData.paymentDetail.provider_name}
                        className="w-5 h-5 rounded-full shrink-0"
                      />
                      <span className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{effectiveTransactionData.paymentDetail.provider_name}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className={`text-xs font-medium mb-0.5 ${isDark ? "text-[#7B7B7B]" : "text-gray-500"}`}>Account Name</p>
                        <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{effectiveTransactionData.paymentDetail.account_name}</p>
                      </div>
                      <div>
                        <p className={`text-xs font-medium mb-0.5 ${isDark ? "text-[#7B7B7B]" : "text-gray-500"}`}>Account Number</p>
                        <p className={`text-sm font-mono font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{effectiveTransactionData.paymentDetail.account_number}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            {effectiveTransactionData?.type === "withdrawal" && effectiveTransactionData?.walletAddress && (
              <div className="pt-2 border-t border-gray-200 dark:border-[#35353E]">
                <p className={`text-xs font-medium mb-1.5 ${isDark ? "text-[#7B7B7B]" : "text-gray-500"}`}>Wallet Address</p>
                <code className={`text-sm font-mono break-all block px-2 py-1 rounded-lg ${isDark ? "bg-[#2A2A30] text-white" : "bg-gray-100 text-gray-900"}`}>
                  {effectiveTransactionData.walletAddress}
                </code>
              </div>
            )}
          </div>
        </div>
        <div className={`flex-shrink-0 ${isHomePage ? 'ml-0 mt-2 md:mt-0 md:ml-3' : 'ml-0 md:ml-6'} flex items-center justify-center ${isHomePage ? 'py-1 sm:py-2' : 'py-2'}`}>
          {/* QR code */}
          {(() => {
            // For deposits, use account number; for withdrawals, use wallet address
            let qrData = "";
            
            if (effectiveTransactionData?.type === "deposit" && effectiveTransactionData?.paymentDetail?.account_number) {
              // For deposits, show account number in QR code
              qrData = effectiveTransactionData.paymentDetail.account_number;
            } else if (effectiveTransactionData?.type === "withdrawal" && effectiveTransactionData?.walletAddress) {
              // For withdrawals, show wallet address
              qrData = effectiveTransactionData.walletAddress;
            } else if (effectiveTransactionData?.type === "deposit" && effectiveTransactionData?.paymentDetail) {
              // Fallback: try to get account_number from payment_details array if not at root level
              const firstDetail = effectiveTransactionData.paymentDetail.payment_details?.[0];
              if (firstDetail?.account_number || firstDetail?.mobile_number) {
                qrData = firstDetail.account_number || firstDetail.mobile_number;
              }
            }
            
            if (!qrData) {
              return (
                <div className={`${isHomePage ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-36 h-36'} bg-white rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <span className="text-gray-400 text-xs">No QR data</span>
                </div>
              );
            }

            const encodedData = encodeURIComponent(qrData);
            return (
              <div className={`${isHomePage ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-36 h-36'} bg-white rounded-lg flex items-center justify-center flex-shrink-0`}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=${isHomePage ? '112' : '180'}x${isHomePage ? '112' : '180'}&data=${encodedData}`}
                  alt="QR Code"
                  className={isHomePage ? "w-20 h-20 sm:w-24 sm:h-24" : "w-32 h-32"}
                  onError={(e) => {
                    // Fallback if QR code fails to load
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = '<span class="text-gray-400 text-xs">QR unavailable</span>';
                    }
                  }}
                />
              </div>
            );
          })()}
        </div>
      </div>

      <div className={`flex items-center justify-between w-full ${isHomePage ? '' : 'max-w-4xl'} ${isHomePage ? 'mb-2 sm:mb-3 px-1' : 'mb-4'} relative overflow-x-auto`}>
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
        } border-2 rounded-2xl ${isHomePage ? 'p-3 sm:p-4' : 'p-6'} shadow-lg w-full ${isHomePage ? '' : 'max-w-4xl'} ${isHomePage ? 'mb-2 sm:mb-3' : 'mb-4'} overflow-hidden`}
      >
        {/* Title */}
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
              {liveTransactionId || effectiveTransactionData?.transactionId}
            </span>
            <CopyButton
              value={
                liveTransactionId ||
                effectiveTransactionData?.transactionId ||
                ""
              }
              className="text-[#FFA200] hover:text-[#FFB833] transition-colors flex-shrink-0"
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
            {effectiveTransactionData?.type === "deposit" &&
            effectiveTransactionData?.paymentDetail ? (
              <>
                <img
                  src="/assets/image_7_jijlik.png"
                  alt={effectiveTransactionData.paymentDetail.provider_name}
                  className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5"
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-sm sm:text-base font-semibold truncate`}
                  >
                    {effectiveTransactionData.paymentDetail.provider_name}
                  </div>
                  <div
                    className={`${
                      isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-xs sm:text-sm font-mono truncate`}
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
                    "/assets/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                  }
                  alt={
                    effectiveTransactionData?.asset?.symbol ||
                    (effectiveTransactionData?.type === "deposit"
                      ? "USD"
                      : effectiveTransactionData?.type === "withdrawal"
                        ? "USD"
                        : "USDT")
                  }
                  className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5"
                  onError={(e) => {
                    e.currentTarget.src =
                      "/assets/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                  }}
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-sm sm:text-base font-semibold truncate`}
                  >
                    {effectiveTransactionData?.asset?.ticker ||
                      effectiveTransactionData?.asset?.symbol ||
                      effectiveTransactionData?.asset?.name ||
                      (effectiveTransactionData?.type === "deposit"
                        ? "USD"
                        : effectiveTransactionData?.type === "withdrawal"
                          ? "USD"
                          : "USDT")}
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
          {/* Right: To — from center to end */}
          <div className="flex items-start gap-3 min-w-0 flex-1 pl-2 sm:pl-4 border-l border-dashed border-gray-300 dark:border-[#35353E]">
            {effectiveTransactionData?.type === "deposit" ? (
              <>
                <img
                  src={
                    effectiveTransactionData?.asset?.icon ||
                    effectiveTransactionData?.asset?.icon_url ||
                    effectiveTransactionData?.asset?.image_url ||
                    effectiveTransactionData?.asset?.image ||
                    "/assets/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                  }
                  alt={
                    effectiveTransactionData?.asset?.symbol ||
                    (effectiveTransactionData?.type === "deposit"
                      ? "USD"
                      : effectiveTransactionData?.type === "withdrawal"
                        ? "USD"
                        : "USDT")
                  }
                  className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5"
                  onError={(e) => {
                    e.currentTarget.src =
                      "/assets/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                  }}
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-sm sm:text-base font-semibold truncate`}
                  >
                    {effectiveTransactionData?.asset?.ticker ||
                      effectiveTransactionData?.asset?.symbol ||
                      effectiveTransactionData?.asset?.name ||
                      (effectiveTransactionData?.type === "deposit"
                        ? "USD"
                        : effectiveTransactionData?.type === "withdrawal"
                          ? "USD"
                          : "USDT")}
                  </div>
                  {effectiveTransactionData?.asset?.description && (
                    <span
                      className={`${
                        isDark ? "text-[#7B7B7B]" : "text-gray-600"
                      } text-xs sm:text-sm font-normal block truncate`}
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
                  src="/assets/image_7_jijlik.png"
                  alt="Bank"
                  className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5"
                />
                <div className="min-w-0 flex-1 space-y-0.5">
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
                    } text-xs sm:text-sm font-normal block truncate`}
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

      <div className={`w-full ${isHomePage ? "" : "max-w-4xl"} rounded-2xl flex`}>
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
                  <span className="font-semibold">Send the correct asset and network:</span> Only send{" "}
                  {transactionData?.asset?.ticker ||
                    transactionData?.asset?.symbol ||
                    transactionData?.asset?.name ||
                    getStableSendCurrency()} ({transactionData?.asset?.network}) to this address.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#1D8751] font-bold text-sm flex-shrink-0">2.</span>
                <p className={`text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-[#475569]"}`}>
                  <span className="font-semibold">Send exactly the amount specified:</span> Send exactly the amount specified below.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#1D8751] font-bold text-sm flex-shrink-0">3.</span>
                <p className={`text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-[#475569]"}`}>
                  <span className="font-semibold">Send from your own wallet only:</span> Do not send from exchange accounts. Minimum confirmations required: 1.
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