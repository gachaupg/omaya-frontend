import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useTransactionStatusWebSocket,
  TransactionStatusMessage,
} from "../websockets";
import { API_CONFIG } from "@/lib/appConfig";
import { cookieUtils } from "@/lib/utils/cookieUtils";
import { useTheme } from "@/context/theme";
import CopyButton from "@/components/ui/CopyButton";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store/rootReducer";
import { logger } from '@/lib/utils/logger';

import {
  cancelP2PDepositTransaction,
} from "@/features/express/slices/transactionSlice";
import { fetchDepositStatus } from "../api";
import SuccessPage from "./success";
import FailureStatusModal from "@/features/express/components/FailureStatusModal";
import { resolveExpressTransactionFailureMessage } from "@/lib/utils/websocketUtils";
import { useScrollAppToTopWhen } from "@/hooks/useScrollAppToTopWhen";
import { encodeQrScanData } from "@/lib/utils/ussdDial";
import { P2P_STATUS_SCROLL_FRACTION } from "@/lib/utils/scrollAppToTop";
import HowToSendDialBlock from "@/components/ui/HowToSendDialBlock";
import CryptoSendToAddressBlock from "@/components/ui/CryptoSendToAddressBlock";
import { shouldSkipAssetFetchError } from "@/lib/utils/assetLoadNotice";
import { formatHowToSend } from "@/features/moneyX/utils/howToSend";

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/i;

const resolveCryptoPayinAddress = (tx: {
  payin_address?: string;
  walletAddress?: string;
  details?: { payin_address?: string };
}): string => {
  return (
    String(tx?.payin_address || "").trim() ||
    String(tx?.details?.payin_address || "").trim() ||
    String(tx?.walletAddress || "").trim()
  );
};

const resolveTxAssetTicker = (tx: {
  asset?: { ticker?: string; symbol?: string; name?: string };
  details?: { to_currency?: string };
}): string =>
  tx?.asset?.ticker ||
  tx?.asset?.symbol ||
  tx?.asset?.name ||
  tx?.details?.to_currency ||
  "USDT";

const resolveTxNetworkLabel = (tx: {
  asset?: { network?: string };
  network?: { network_type?: string; network?: string; network_id?: string };
  details?: { to_network?: string };
}): string =>
  tx?.asset?.network ||
  tx?.network?.network_type ||
  tx?.network?.network ||
  tx?.network?.network_id ||
  tx?.details?.to_network ||
  "BSC";

const isDirectPaymentProvider = (name?: string | null): boolean =>
  !name || String(name).trim().toLowerCase() === "direct";

const formatNetworkDisplayLabel = (tx: Parameters<typeof resolveTxNetworkLabel>[0]): string => {
  const raw = String(resolveTxNetworkLabel(tx) || "").trim();
  const normalized = raw.toUpperCase().replace(/[\s_-]+/g, "");
  if (
    !normalized ||
    normalized === "BSC" ||
    normalized === "BEP20" ||
    normalized.startsWith("BEP")
  ) {
    return "BEP 20";
  }
  return raw;
};

/** Match Exchange Deposit status page width and spacing */
const STATUS_PAGE_MAX_W = "max-w-4xl";
const statusCardSurface = (dark: boolean) =>
  dark
    ? "bg-[#23232B] border-[#35353E]"
    : "bg-white border-gray-200";

interface ExchangingProps {
  transactionData?: {
    type: "deposit" | "withdrawal";
    amount: number;
    asset: any;
    paymentDetail?: any;
    paymentDetails?: any[];
    walletAddress: string;
    /** Deposit-only: address user should send crypto to (how-to-send/pay-in address). */
    payin_address?: string;
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
  const { tokens } = useSelector((state: any) => state.auth);
  const token = tokens?.access ?? cookieUtils.getCookie("access_token") ?? (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);
  useScrollAppToTopWhen(true, "smooth", P2P_STATUS_SCROLL_FRACTION);
  const [currentStatus, setCurrentStatus] = useState<string>(() =>
    transactionData?.status || "pending"
  );
  const [persistedTransactionData, setPersistedTransactionData] =
    useState<any>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);

  // Timer state - 15 minutes, based on wall-clock to avoid tab throttling
  const TIMER_DURATION_SEC = 15 * 60;
  const expiryTimestampRef = React.useRef<number | null>(null);
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
  const pollingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const [failureModal, setFailureModal] = useState<{
    isOpen: boolean;
    status: string;
    message?: string;
  }>({ isOpen: false, status: "", message: undefined });

  const resolveHowToSendFromPaymentDetail = (pd: any): string => {
    if (!pd) return "";
    const nested = pd?.payment_details?.[0];
    const admin = Array.isArray(pd?.admin_payment_details)
      ? pd.admin_payment_details[0]
      : null;
    const pick = (v: unknown) =>
      v != null && String(v).trim() !== "" ? String(v).trim() : "";
    const account =
      pick(pd.account_number) ||
      pick(pd.account_no) ||
      pick(nested?.account_number) ||
      pick(nested?.account_no) ||
      pick(pd.mobile_number) ||
      pick(nested?.mobile_number) ||
      pick(pd.iban) ||
      pick(nested?.iban) ||
      "";
    return (
      pick(pd.how_to_send) ||
      pick(nested?.how_to_send) ||
      pick(admin?.how_to_send) ||
      account
    );
  };

  const resolveHowToSendFromTx = (tx: {
    paymentDetail?: any;
    paymentDetails?: any[];
  }): string => {
    const ordered = [tx?.paymentDetails?.[0], tx?.paymentDetail].filter(Boolean);
    for (const pd of ordered) {
      const v = resolveHowToSendFromPaymentDetail(pd);
      if (v) return v;
    }
    return "";
  };

  const renderSendInstructionsBlock = () => {
    if (!effectiveTransactionData) return null;

    const assetTicker = resolveTxAssetTicker(effectiveTransactionData);
    const networkLabel = resolveTxNetworkLabel(effectiveTransactionData);

    if (effectiveTransactionData.type === "withdrawal") {
      const address = String(
        effectiveTransactionData.walletAddress || ""
      ).trim();
      if (!EVM_ADDRESS_RE.test(address)) return null;
      return (
        <CryptoSendToAddressBlock
          address={address}
          assetTicker={assetTicker}
          networkLabel={networkLabel}
          isDark={isDark}
          className="w-full"
        />
      );
    }

    if (effectiveTransactionData.type !== "deposit") return null;

    const payin = resolveCryptoPayinAddress(effectiveTransactionData);
    if (EVM_ADDRESS_RE.test(payin)) {
      return (
        <CryptoSendToAddressBlock
          address={payin}
          assetTicker={assetTicker}
          networkLabel={networkLabel}
          isDark={isDark}
          className="w-full"
        />
      );
    }

    const howToSendRaw = resolveHowToSendFromTx(effectiveTransactionData);
    const amountForHowToSend =
      liveAmount ?? (effectiveTransactionData as { amount?: number }).amount ?? null;
    const ussdValue = formatHowToSend(howToSendRaw, amountForHowToSend);
    if (!ussdValue || EVM_ADDRESS_RE.test(ussdValue)) return null;

    return (
      <HowToSendDialBlock
        value={ussdValue}
        isDark={isDark}
        compact
        dialOnMobileOnly
        className="w-full"
      />
    );
  };

  const handleFailureModalClose = () => {
    setFailureModal({ isOpen: false, status: "", message: undefined });
    localStorage.removeItem("express_transaction_data");
    window.location.reload();
  };

  const stopFallbackPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setPollingInterval(null);
    setFallbackPolling(false);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Compute remaining time from wall-clock (immune to tab throttling)
  const computeTimeRemaining = React.useCallback(() => {
    const expiry = expiryTimestampRef.current;
    if (!expiry) return TIMER_DURATION_SEC;
    const remaining = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
    return remaining;
  }, []);

  // Initialize expiry timestamp - always set so countdown runs even before txId is available
  const effectiveDataForTimer = transactionData || persistedTransactionData;
  const txIdForTimer =
    effectiveDataForTimer?.transactionId ||
    (effectiveDataForTimer as { transaction_id?: string })?.transaction_id ||
    liveTransactionId;

  useEffect(() => {
    if (!timerActive) return;

    const storageKey = "express_transaction_expiry";

    if (!expiryTimestampRef.current) {
      const fallbackExpiry = Date.now() + TIMER_DURATION_SEC * 1000;
      if (txIdForTimer) {
        try {
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const { transactionId, expiry } = JSON.parse(stored);
            if (transactionId === txIdForTimer) {
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
        } catch {
          // Invalid stored data, use fresh expiry
        }
        expiryTimestampRef.current = fallbackExpiry;
        localStorage.setItem(
          storageKey,
          JSON.stringify({ transactionId: txIdForTimer, expiry: fallbackExpiry })
        );
      } else {
        // No txId yet - use session expiry so countdown runs (will sync when txId arrives)
        expiryTimestampRef.current = fallbackExpiry;
      }
    }
    setTimeRemaining(computeTimeRemaining());
  }, [txIdForTimer, timerActive, computeTimeRemaining]);

  // Timer: setInterval + wall-clock; recalc when tab becomes active (countdown accurate even when tab inactive)
  useEffect(() => {
    if (!timerActive) return;

    const tick = () => {
      const remaining = computeTimeRemaining();
      setTimeRemaining(remaining);
      if (remaining <= 0) setTimerActive(false);
    };

    tick(); // initial tick
    const intervalId = setInterval(tick, 1000);

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibilityOrFocus);
    window.addEventListener("focus", onVisibilityOrFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
      window.removeEventListener("focus", onVisibilityOrFocus);
    };
  }, [timerActive, computeTimeRemaining]);

  // Auto-cancel when timer expires, then redirect to dashboard
  const hasRedirectedOnExpiry = React.useRef(false);
  const effectiveData = transactionData || persistedTransactionData;
  useEffect(() => {
    if (timeRemaining !== 0 || hasRedirectedOnExpiry.current) return;

    hasRedirectedOnExpiry.current = true;

    const onTimeExpired = async () => {
      // Only auto-cancel deposits. Withdrawals can legitimately wait for admin approval
      // longer than the client timer and should not be marked as failed/canceled.
      if (effectiveData?.type && effectiveData.type !== "deposit") {
        setTimerActive(false);
        return;
      }
      // If we reached an admin/agent approval gate, do not auto-cancel.
      if (
        ["admin_approval_required", "approval_required", "agent_approve"].includes(
          String(currentStatus || "").toLowerCase()
        )
      ) {
        setTimerActive(false);
        return;
      }
      const txId = effectiveData?.transactionId;
      if (txId) {
        try {
          await dispatch(cancelP2PDepositTransaction(txId)).unwrap();
        } catch (error) {
          if (!shouldSkipAssetFetchError(error)) {
            logger.error("p2p", "Failed to cancel transaction:", error);
          }
        }
        localStorage.removeItem("express_transaction_data");
        localStorage.removeItem("express_transaction_expiry");
      }
      router.push("/dashboard");
    };

    onTimeExpired();
  }, [timeRemaining, effectiveData?.transactionId, effectiveData?.type, currentStatus, dispatch, router]);

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
      localStorage.removeItem("express_transaction_expiry");

      // Redirect to home page
      router.push("/");
    } catch (error) {
      if (!shouldSkipAssetFetchError(error)) {
        logger.error("p2p", "Failed to cancel transaction:", error);
      }
      // Still redirect even if cancel fails
      router.push("/");
    }
  };

  // Stop timer when transaction is completed or waiting for admin/agent approval
  useEffect(() => {
    const s = String(currentStatus || "").toLowerCase();
    if (s === "completed" || ["admin_approval_required", "approval_required", "agent_approve"].includes(s)) {
      setTimerActive(false);
      localStorage.removeItem("express_transaction_expiry");
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

  // Fallback polling - fetches status when WebSocket may have missed updates (e.g. user sent money before deposit)
  // Use shorter interval (3s) for deposits so we detect completion soon after opening the page
  const startFallbackPolling = React.useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    const txId = effectiveTransactionData?.transactionId;
    if (!txId || effectiveTransactionData?.type !== "deposit") return;

    const poll = async () => {
      try {
        const result = await fetchDepositStatus(txId);
        if (result?.status) {
          setCurrentStatus(result.status);
        }
      } catch {
        // Silent - WebSocket may still deliver updates
      }
    };

    const intervalMs = effectiveTransactionData?.type === "deposit" ? 3000 : 10000;
    const interval = setInterval(poll, intervalMs);
    pollingIntervalRef.current = interval;
    setPollingInterval(interval);
    poll(); // run immediately
  }, [effectiveTransactionData?.transactionId, effectiveTransactionData?.type]);

  // Sync initial status from persisted data when it loads (e.g. page refresh)
  useEffect(() => {
    if (persistedTransactionData?.status && !transactionData) {
      setCurrentStatus(persistedTransactionData.status);
    }
  }, [persistedTransactionData?.status, transactionData]);

  // Fetch latest status on mount when user sent money before hitting deposit
  // Also start polling as backup - updates progress automatically without refresh
  useEffect(() => {
    const txId = effectiveTransactionData?.transactionId;
    const isDeposit = effectiveTransactionData?.type === "deposit";
    if (!txId || !isDeposit) return;

    const fetchStatus = async () => {
      const result = await fetchDepositStatus(txId);
      if (result?.status) setCurrentStatus(result.status);
    };
    fetchStatus();

    // Second fetch after short delay so we catch completion that happened right after page load
    const earlyRetry = setTimeout(fetchStatus, 1500);

    startFallbackPolling();
    return () => {
      clearTimeout(earlyRetry);
      stopFallbackPolling();
    };
  }, [effectiveTransactionData?.transactionId, effectiveTransactionData?.type, startFallbackPolling]);

  // Stop polling when transaction is completed
  useEffect(() => {
    if (currentStatus === "completed") {
      stopFallbackPolling();
    }
  }, [currentStatus]);

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
        token: token ?? undefined,
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

            // Deposit-only: capture payin address from socket for QR/How-to-send.
            const payin =
              String(
                changeNowData?.payin_address ||
                  changeNowData?.payinAddress ||
                  changeNowData?.payin_address?.address ||
                  ""
              ).trim();
            if (payin && effectiveTransactionData?.type === "deposit") {
              setPersistedTransactionData((prev: any) => ({
                ...(prev || {}),
                payin_address: payin,
              }));
            }

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
          } else if (data.type === "status_update" && (data.data as { transaction_hash?: string })?.transaction_hash && !data.data?.status) {
            // P2P deposit: backend sent transaction_hash but no status (e.g. tx detected) – show confirming and sync with API
            status = "pending_blockchain";
            message = data.data.message;
            logger.debug('p2p', "Status update with transaction_hash (no status), syncing with API");
            const txId = effectiveTransactionData?.transactionId || data.data?.transaction_id;
            if (txId) {
              fetchDepositStatus(txId).then((result) => {
                if (!result?.status) return;
                const s = result.status;
                setCurrentStatus(s === "completed" ? "completed" : s === "pending_blockchain" ? "confirming" : s);
              }).catch(() => { });
            }
          } else if (data.status && typeof data.status === "string") {
            // ChangeNow format
            status = data.status;
            message = (data as any).message;
          } else if (data.data?.status || (data.data as any)?.stage) {
            // Backend format (status or stage e.g. P2P deposit)
            const d = data.data as any;
            status = d.status ?? d.stage;
            message = d.message;
          } else if (data.status) {
            // Legacy format
            status = data.status;
            message = (data as any).message;
          }

          // Withdrawal approval gate can live in `operational_status` even when the UI status is mapped.
          const opStatus = String((data.data as any)?.operational_status || "")
            .trim()
            .toLowerCase();
          if (
            effectiveTransactionData?.type === "withdrawal" &&
            ["admin_approval_required", "approval_required", "agent_approve"].includes(
              opStatus
            )
          ) {
            setTimerActive(false);
          }

          if (status && ["failed", "rejected", "stopped"].includes(status)) {
            let failureMessage =
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
            return;
          }

          // Process statuses for both deposit and withdrawal
          const validStatuses = [
            "pending",
            "pending_blockchain",
            "processing",
            "completed",
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
                uiStatus =
                  effectiveTransactionData?.type === "deposit" ||
                  (data.data as any)?.transaction_type === "deposit"
                    ? "pending"
                    : "confirming";
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
                uiStatus =
                  effectiveTransactionData?.type === "deposit" ||
                  (data.data as any)?.transaction_type === "deposit"
                    ? "pending"
                    : "confirming";
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
                    if (finalWebsocketUrl) {
                      } else {
                      }

          // Increment connection attempts
          setConnectionAttempts((prev) => prev + 1);

          // Only show error in UI after multiple attempts
          // This prevents showing errors for initial connection attempts
          if (!isConnected && connectionAttempts > 2) {
            const userFriendlyError = `Connection issue (attempt ${connectionAttempts}). ${finalWebsocketUrl ? "Retrying..." : "No WebSocket URL available"
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

  // When WebSocket connects, fetch current status so we don't miss updates that happened before opening the page
  useEffect(() => {
    if (!isConnected) return;
    const txId = effectiveTransactionData?.transactionId;
    if (!txId || effectiveTransactionData?.type !== "deposit") return;
    fetchDepositStatus(txId).then((result) => {
      if (result?.status) setCurrentStatus(result.status);
    }).catch(() => { });
  }, [isConnected, effectiveTransactionData?.transactionId, effectiveTransactionData?.type]);

  // Debug logging (and print socket URL + data for debugging)
  useEffect(() => {
    if (shouldUseWebSocket) {
      const url = effectiveTransactionData?.websocketUrl || effectiveTransactionData?.websocket_url || "(fallback: by transactionId)";
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
        className={`w-full min-h-screen flex flex-col items-center justify-center pt-2 ${isDark ? "bg-[#0A0A0A]" : "bg-gray-50"
          }`}
      >
        <div className={`${isDark ? "text-white" : "text-gray-900"} text-lg`}>
          Loading transaction data...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-0 flex flex-col items-center pt-2 px-3 sm:px-4 pb-6">
      <div className={`w-full ${STATUS_PAGE_MAX_W} flex flex-col`}>
      {/* Timer Banner */}
      {timerActive && timeRemaining > 0 && (
        <div className={`w-full mb-2 sm:mb-4 ${timeRemaining <= 60
          ? 'bg-red-500/20 border-red-500'
          : timeRemaining <= 300
            ? 'bg-orange-500/20 border-orange-500'
            : 'bg-[#1D8751]/20 border-[#1D8751]'
          } border-2 rounded-2xl p-2 sm:p-3 md:p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <svg
              className={`w-6 h-6 ${timeRemaining <= 60
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
              <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'
                }`}>
                Transaction Timeout
              </div>
              <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                {timeRemaining <= 60
                  ? 'Transaction will be cancelled soon!'
                  : 'Complete your transaction before time expires'}
              </div>
            </div>
          </div>
          <div className={`text-2xl font-bold ${timeRemaining <= 60
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
        className={`flex flex-col ${statusCardSurface(isDark)} border-2 rounded-2xl p-3 sm:p-4 shadow-lg w-full mb-2 sm:mb-4`}
      >
        <div className="flex flex-col md:flex-row justify-between items-stretch gap-4 w-full">
        <div className="flex-1 flex flex-col justify-between py-1 sm:py-2 min-w-0 w-full">
          <div>
            <div className="flex flex-row flex-wrap gap-x-6 gap-y-2 items-baseline">
              <div>
                <div
                  className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-xs font-semibold mb-0.5`}
                >
                  Amount you&apos;re sending:
                </div>
                <div
                  className={`${isDark ? "text-white" : "text-gray-900"
                    } text-base font-semibold flex items-center gap-2`}
                >
                  <span>
                    {liveAmount !== null
                      ? liveAmount
                      : effectiveTransactionData?.amount ?? 0}{" "}
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
              </div>
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

          
            {/* Deposit-specific information display */}
            {effectiveTransactionData?.type === "deposit" && (
              <>
                {/* Deposit Code - Most important for deposits */}


                {/* Asset and Network Information */}
                <div
                  className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-xs font-semibold mb-0.5 mt-3`}
                >
                  Asset & Network:
                </div>
                <div className="flex items-center mb-1 sm:mb-2">
                  <img
                    src={
                      effectiveTransactionData?.asset?.icon ||
                      effectiveTransactionData?.asset?.icon_url ||
                      effectiveTransactionData?.asset?.image_url ||
                      effectiveTransactionData?.asset?.image ||
                      "/images/tether.svg"
                    }
                    alt={effectiveTransactionData?.asset?.ticker || effectiveTransactionData?.asset?.symbol || effectiveTransactionData?.asset?.name || "Asset"}
                    className="w-6 h-6 rounded-full mr-2"
                    onError={(e) => {
                      e.currentTarget.src = "/images/tether.svg";
                    }}
                  />
                  <span
                    className={`${isDark ? "text-white" : "text-gray-900"
                      } text-sm font-semibold uppercase`}
                  >
                    {effectiveTransactionData?.asset?.ticker || effectiveTransactionData?.asset?.symbol || effectiveTransactionData?.asset?.name || "USDT"}
                  </span>
                  <span className="ml-2 bg-[#1D8751] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    {effectiveTransactionData?.asset?.network || effectiveTransactionData?.network?.network_type || "BSC"}
                  </span>
                </div>
              </>
            )}

            {/* Bank Information (for non-direct deposits) */}
            {effectiveTransactionData?.type === "deposit" && effectiveTransactionData?.paymentDetail && effectiveTransactionData.paymentDetail.provider_name !== "direct" && (
              <>
                <div
                  className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
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
                      "/assets/image_7_jijlik.png"
                    }
                    alt={effectiveTransactionData.paymentDetail.provider_name}
                    className="w-5 h-5 rounded-full mr-2"
                    onError={(e) => {
                      if (e.currentTarget.src !== "/assets/image_7_jijlik.png") {
                        e.currentTarget.src = "/assets/image_7_jijlik.png";
                      }
                    }}
                  />
                  <span
                    className={`${isDark ? "text-white" : "text-gray-900"
                      } text-sm font-semibold`}
                  >
                    {effectiveTransactionData.paymentDetail.provider_name}
                  </span>
                </div>
                <div
                  className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-xs font-semibold mb-0.5`}
                >
                  Account Name:
                </div>
                <div
                  className={`${isDark ? "text-white" : "text-gray-900"
                    } text-sm mb-1`}
                >
                  {effectiveTransactionData.paymentDetail.account_name}
                </div>
                <div
                  className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-xs font-semibold mb-0.5`}
                >
                  Account Number:
                </div>
                <div
                  className={`${isDark ? "text-white" : "text-gray-900"
                    } text-sm font-mono`}
                >
                  {effectiveTransactionData.paymentDetail.account_number}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 w-full md:w-auto md:ml-6 flex flex-col items-center justify-center py-2 md:py-0">
          {/* QR code */}
          {(() => {
            // For deposits: use selected payment method "How to send" (formatted with real amount). For withdrawals: wallet address.
            let qrData = "";

            if (effectiveTransactionData?.type === "deposit") {
              const amountForHowToSend =
                liveAmount ??
                (effectiveTransactionData as any)?.amount ??
                null;

              const howToSendRaw = resolveHowToSendFromTx(effectiveTransactionData);
              const howToSend = formatHowToSend(howToSendRaw, amountForHowToSend);
              const payin =
                String((effectiveTransactionData as any)?.payin_address || "").trim() ||
                String((effectiveTransactionData as any)?.details?.payin_address || "").trim();
              qrData =
                howToSend ||
                payin ||
                String(effectiveTransactionData?.walletAddress || "").trim();
            } else if (effectiveTransactionData?.type === "withdrawal" && effectiveTransactionData?.walletAddress) {
              // For withdrawals, show wallet address
              qrData = effectiveTransactionData.walletAddress;
            }

            if (!qrData) {
              return (
                <div className="w-36 h-36 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No QR data</span>
                </div>
              );
            }

            const encodedData = encodeQrScanData(qrData);
            return (
              <div className="w-36 h-36 bg-white rounded-lg flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodedData}`}
                  alt="QR Code"
                  className="w-32 h-32"
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
        {(() => {
          const sendBlock = renderSendInstructionsBlock();
          if (!sendBlock) return null;
          return (
            <div
              className={`w-full mt-2 pt-2 border-t border-dashed ${
                isDark ? "border-[#35353E]" : "border-gray-300"
              }`}
            >
              {sendBlock}
            </div>
          );
        })()}
      </div>

      <div className="flex items-center justify-between w-full mb-2 sm:mb-4 relative px-2 sm:px-0 overflow-x-auto">
        {/* Connecting Lines */}
        <div className="absolute top-3 sm:top-4 md:top-5 left-[10%] sm:left-[12.5%] right-[10%] sm:right-[12.5%] h-0.5 z-0">
          <div
            className={`h-0.5 transition-all duration-500 ${currentStatus === "completed" || currentStatus === "finished"
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
        <div className="flex flex-col items-center flex-1 relative z-10 min-w-[70px] sm:min-w-0">
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1 border-2 sm:border-4 ${currentStatus === "pending" ||
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
            <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24">
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
          <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap justify-center">
            <span
              className={`font-semibold text-[10px] sm:text-base text-center ${currentStatus === "pending" ||
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
              <span className="hidden sm:inline">Awaiting Deposit</span>
              <span className="sm:hidden">Awaiting</span>
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
        <div className="flex flex-col items-center flex-1 relative z-10 min-w-[70px] sm:min-w-0">
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1 border-2 sm:border-4 ${currentStatus === "confirming"
              ? "bg-[#FF9500] border-[#FF95001A]"
              : currentStatus === "sending" ||
                currentStatus === "completed" ||
                currentStatus === "finished"
                ? "bg-[#1D8751] border-[#1D87511A]"
                : `${isDark ? "bg-[#23232B] border-[#35353E]" : "bg-gray-200 border-gray-300"}`
              }`}
          >
            <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24">
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
          <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap justify-center">
            <span
              className={`font-semibold text-[10px] sm:text-base text-center ${currentStatus === "confirming"
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
        <div className="flex flex-col items-center flex-1 relative z-10 min-w-[70px] sm:min-w-0">
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1 border-2 sm:border-4 ${currentStatus === "sending"
              ? "bg-[#FF9500] border-[#FF95001A]"
              : currentStatus === "completed" || currentStatus === "finished"
                ? "bg-[#1D8751] border-[#1D87511A]"
                : "bg-[#23232B] border-[#35353E]"
              }`}
          >
            <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24">
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
          <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap justify-center">
            <span
              className={`font-semibold text-[10px] sm:text-base text-center ${currentStatus === "sending"
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
        className={`${statusCardSurface(isDark)} border-2 rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg w-full mb-2 sm:mb-4 overflow-hidden`}
      >
        {/* Title */}
        <div
          className={`${isDark ? "text-white" : "text-gray-900"
            } text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4`}
        >
          Transaction Details
        </div>
        {/* Transaction ID Row - for deposit show wallet address from create response */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-1">
          <div
            className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
              } text-sm sm:text-base font-medium`}
          >
            {effectiveTransactionData?.type === "deposit"
              ? `Send ${resolveTxAssetTicker(effectiveTransactionData)} (${resolveTxNetworkLabel(effectiveTransactionData)}) address`
              : "Transaction ID"}
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial sm:justify-end">
            <span
              className={`${isDark ? "text-white" : "text-gray-900"
                } text-xs sm:text-sm md:text-base font-mono font-semibold truncate min-w-0`}
            >
              {effectiveTransactionData?.type === "deposit"
                ? (effectiveTransactionData?.walletAddress || liveTransactionId || effectiveTransactionData?.transactionId)
                : (liveTransactionId || effectiveTransactionData?.transactionId)}
            </span>
            <CopyButton
              value={
                effectiveTransactionData?.type === "deposit"
                  ? (effectiveTransactionData?.walletAddress || liveTransactionId || effectiveTransactionData?.transactionId || "")
                  : (liveTransactionId || effectiveTransactionData?.transactionId || "")
              }
              className="text-[#FFA200] hover:text-[#FFB833] transition-colors flex-shrink-0"
              showIcon={true}
            />
          </div>
        </div>
        {/* Dashed Divider */}
        <div
          className={`border-t border-dashed ${isDark ? "border-[#7B7B7B]" : "border-gray-400"
            } mb-4 mt-4`}
        ></div>
        {/* From (left) | To (from center to end) — asset + network (e.g. USDT / BEP 20) */}
        <div className="flex mb-2">
          <div
            className={`flex-shrink-0 w-1/2 ${isDark ? "text-[#7B7B7B]" : "text-gray-600"
              } text-sm sm:text-base font-medium`}
          >
            From
          </div>
          <div
            className={`flex-1 min-w-0 text-left pl-2 sm:pl-4 ${isDark ? "text-[#7B7B7B]" : "text-gray-600"
              } text-sm sm:text-base font-medium`}
          >
            To
          </div>
        </div>
        <div className="flex mt-2 items-start gap-0">
          {/* Left: From — icon + asset (USDT) + network (BEP 20) */}
          <div className="flex items-start gap-3 min-w-0 w-1/2 flex-shrink-0 pr-2 sm:pr-4">
            {effectiveTransactionData?.type === "deposit" &&
              effectiveTransactionData?.paymentDetail &&
              !isDirectPaymentProvider(
                effectiveTransactionData.paymentDetail.provider_name
              ) ? (
              <>
                <img
                  src={
                    effectiveTransactionData.paymentDetail.logo_url ||
                    effectiveTransactionData.paymentDetail.logo ||
                    effectiveTransactionData.paymentDetail.provider_logo ||
                    "/assets/image_7_jijlik.png"
                  }
                  alt={effectiveTransactionData.paymentDetail.provider_name}
                  className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5"
                  onError={(e) => {
                    if (e.currentTarget.src !== "/assets/image_7_jijlik.png") {
                      e.currentTarget.src = "/assets/image_7_jijlik.png";
                    }
                  }}
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div
                    className={`${isDark ? "text-white" : "text-gray-900"
                      } text-sm sm:text-base font-semibold`}
                  >
                    {effectiveTransactionData.paymentDetail.provider_name}
                  </div>
                  <div
                    className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                      } text-xs sm:text-sm`}
                  >
                    {resolveTxAssetTicker(effectiveTransactionData)}
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
                    "/images/tether.svg"
                  }
                  alt={resolveTxAssetTicker(effectiveTransactionData)}
                  className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5"
                  onError={(e) => {
                    e.currentTarget.src = "/images/tether.svg";
                  }}
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div
                    className={`${isDark ? "text-white" : "text-gray-900"
                      } text-sm sm:text-base font-semibold uppercase`}
                  >
                    {resolveTxAssetTicker(effectiveTransactionData)}
                  </div>
                  <div
                    className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                      } text-xs sm:text-sm`}
                  >
                    {formatNetworkDisplayLabel(effectiveTransactionData)}
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Right: To — asset (USDT) + deposit address */}
          <div className="flex items-start gap-3 min-w-0 flex-1 pl-2 sm:pl-4 border-l border-dashed border-gray-300 dark:border-[#35353E]">
            {effectiveTransactionData?.type === "deposit" ? (
              <>
                <img
                  src={
                    effectiveTransactionData?.asset?.icon ||
                    effectiveTransactionData?.asset?.icon_url ||
                    effectiveTransactionData?.asset?.image_url ||
                    effectiveTransactionData?.asset?.image ||
                    "/images/tether.svg"
                  }
                  alt={resolveTxAssetTicker(effectiveTransactionData)}
                  className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5"
                  onError={(e) => {
                    e.currentTarget.src = "/images/tether.svg";
                  }}
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div
                    className={`${isDark ? "text-white" : "text-gray-900"
                      } text-sm sm:text-base font-semibold uppercase`}
                  >
                    {resolveTxAssetTicker(effectiveTransactionData)}
                  </div>
                  <div
                    className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                      } text-xs sm:text-sm font-mono break-all`}
                  >
                    {resolveCryptoPayinAddress(effectiveTransactionData) ||
                      effectiveTransactionData?.walletAddress ||
                      liveTransactionId ||
                      effectiveTransactionData?.transactionId ||
                      ""}
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
                    className={`${isDark ? "text-white" : "text-gray-900"
                      } text-sm sm:text-base font-semibold`}
                  >
                    Bank Transfer
                  </div>
                  <div
                    className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                      } text-xs sm:text-sm font-mono break-all`}
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


      <div className="w-full rounded-2xl flex">

        <div className="w-full border border-[#1D8751] rounded-xl bg-[#F8FAFF] dark:bg-[#1D1D23] flex flex-col gap-2 p-3 sm:p-4">
          <h2 className="text-gray-900 dark:text-white text-sm sm:text-base font-semibold">
            Terms and Conditions Summary
          </h2>
          <ul className="list-disc list-outside ml-4 space-y-1">
            <li className="text-[#475569] dark:text-[#C5C9D6] text-xs sm:text-sm">
              Only send
              {` ${transactionData?.asset?.ticker || transactionData?.asset?.symbol || transactionData?.asset?.name || "USDT"} (${transactionData?.asset?.network})`}{" "}
              to this address{" "}
            </li>
            <li className="text-[#475569] dark:text-[#C5C9D6] text-xs sm:text-sm">
              Send exactly the amount specified below
            </li>
            <li className="text-[#475569] dark:text-[#C5C9D6] text-xs sm:text-sm">
              Do not send from exchange accounts
            </li>
           
          </ul>
        </div>
      </div>

      </div>

      <FailureStatusModal
        isOpen={failureModal.isOpen}
        status={failureModal.status}
        message={failureModal.message}
        onClose={() =>
          setFailureModal({ isOpen: false, status: "", message: undefined })
        }
        onBackToForm={handleFailureModalClose}
        isDark={isDark}
      />
    </div>
  );
}
