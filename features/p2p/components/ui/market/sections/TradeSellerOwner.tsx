"use client";
import React, { useEffect, useState, useRef } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { tokens } from "@/styles/tokens";
import { P2POrder } from "@/features/p2p/types";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { AppDispatch } from "@/store/index";
import { TimeDisplay } from "./TimeDisplay";
import {
  fetchSingleOrder,
  fetchConfirmOrder,
  cancelP2POrderThunk,
  completeP2PTradeThunk,
  confirmP2PTradeThunk,
} from "@/features/p2p/slices/orderSlice";
import { FileIcon, SendIcon, Copy, CheckCircle2, RefreshCw, MessageCircle } from "lucide-react";
import { FaChevronRight } from "react-icons/fa";
import AppealModal from "./appeal";
import { UserStatusBadge } from "./UserStatusBadge";
import ChatBox from "./ChatBox";
import {
  getBuyAdOwnerCounterpartySellerName,
  resolveAdvertiserDisplayName,
} from "@/features/p2p/utils/matchedTradeNotifications";
import { showToast } from "@/lib/utils/toast";
import {
  handleCopyToClipboard,
  parseDurationToSeconds,
  formatDurationForDisplay,
} from "@/features/p2p/components/Common/utils";
import { Dialog } from "@headlessui/react";
import { useTradeStatusWebSocket } from "@/features/p2p/hooks/useTradeStatusWebSocket";
import { useP2pTradeCanceledRedirect } from "@/features/p2p/hooks/useP2pTradeCanceledRedirect";
import { useMarketTradeStatusWsHandler } from "@/features/p2p/hooks/useMarketTradeStatusWsHandler";
import { useBackgroundAwareCountdown } from "@/features/p2p/hooks/useBackgroundAwareCountdown";
import {
  buyFiatFromUsdtReceived,
  roundP2PFiat,
} from "@/features/p2p/utils/p2pTradeRateAmounts";
import {
  getEffectiveConfirmFlags,
  getEffectiveTradeStatus,
  isPendingAcceptanceStatus,
  isTransactionCountdownActive,
} from "@/features/p2p/utils/tradeWsAcceptanceGate";

import { logger } from '@/lib/utils/logger';

interface FinalSellProps {
  orderData?: P2POrder;
}

const FinalSell: React.FC<FinalSellProps> = ({ orderData }) => {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const {
    singleOrder,
    confirmOrder,
    cancelLoading,
    confirmTradeLoading,
    confirmTradeSuccess,
  } = useSelector((state: RootState) => state.p2pMarket);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showMoneySentModal, setShowMoneySentModal] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [tradeDataJson, setTradeDataJson] = useState<any>({});
  const [copiedButton, setCopiedButton] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const prevStatusRef = useRef<string | undefined>(undefined);
  const prevTradeIdRef = useRef<string | null>(null);
  const lastActionTradeIdRef = useRef<string | null>(null);
  const [wsTradeSnapshot, setWsTradeSnapshot] = useState<{
    rawStatus: string;
    can_confirm_payment?: boolean;
    can_confirm_receipt?: boolean;
  }>({ rawStatus: "" });
  const wsSnapshotRef = useRef(wsTradeSnapshot);
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const { handleWsStatusPayload } = useP2pTradeCanceledRedirect({
    tradeId: confirmOrder?.id,
    confirmOrderStatus: confirmOrder?.status,
    enabled: isAuthenticated && !!confirmOrder?.id,
  });

  const handleStatusUpdate = useMarketTradeStatusWsHandler({
    confirmOrder,
    logLabel: "TradeSellerOwner",
    onCanceledPayload: handleWsStatusPayload,
    onSnapshot: (snap) => {
      setWsTradeSnapshot(snap);
      wsSnapshotRef.current = snap;
    },
  });

  // WebSocket for real-time trade status updates
  const { isConnected: statusWsConnected } = useTradeStatusWebSocket({
    tradeId: confirmOrder?.id || "",
    enabled: isAuthenticated && !!confirmOrder?.id,
    onStatusUpdate: handleStatusUpdate,
  });

  // Use limit_duration for countdown (e.g. "00:00:05" = 5 min) - prefer order's limit over trade default
  const displaySeconds = parseDurationToSeconds(singleOrder?.limit_duration);
  const effectiveStatus = getEffectiveTradeStatus(
    confirmOrder?.status,
    wsTradeSnapshot
  );
  const effectiveFlags = getEffectiveConfirmFlags(confirmOrder, wsTradeSnapshot);
  const inPendingAcceptance =
    isPendingAcceptanceStatus(wsTradeSnapshot.rawStatus) ||
    isPendingAcceptanceStatus(String(confirmOrder?.status || ""));
  const buyerMayMarkMoneySent =
    effectiveStatus === "matched" &&
    effectiveFlags.can_confirm_payment !== false &&
    (!inPendingAcceptance || effectiveFlags.can_confirm_payment === true);
  const buyerPaymentPhaseActive =
    effectiveStatus === "matched" && !inPendingAcceptance;
  const transactionTimerActive = isTransactionCountdownActive(
    displaySeconds,
    confirmOrder?.id,
    effectiveStatus
  );
  const appealTimerMatched = buyerPaymentPhaseActive;
  const handleCancelTransactionRef = useRef<() => void>(() => {});
  const confirmStatusRef = useRef(confirmOrder?.status);
  confirmStatusRef.current = confirmOrder?.status;

  // Fetch confirm order when authenticated and orderId is available
  useEffect(() => {
    const orderId = params?.id as string;
    logger.debug('p2p', orderId)
    if (isAuthenticated && orderId) {
      dispatch(fetchConfirmOrder(orderId));
    }
  }, [params?.id, dispatch, isAuthenticated]);

  // Fetch single order only when the order id changes (not on every confirmOrder ref from WebSocket refresh)
  const orderIdToFetch = confirmOrder?.buy_order ?? confirmOrder?.sell_order;
  useEffect(() => {
    if (isAuthenticated && orderIdToFetch) {
      dispatch(fetchSingleOrder(String(orderIdToFetch)));
    }
  }, [orderIdToFetch, dispatch, isAuthenticated]);

  const counterpartyDisplayName = getBuyAdOwnerCounterpartySellerName(
    confirmOrder,
    singleOrder,
    tradeDataJson
  );

  // REST may expose pending_acceptance / flags before WebSocket fires
  useEffect(() => {
    if (!confirmOrder?.id) return;
    const st = String(confirmOrder.status || "");
    if (isPendingAcceptanceStatus(st)) {
      setWsTradeSnapshot((prev) => ({
        rawStatus: "pending_acceptance",
        can_confirm_payment: confirmOrder.can_confirm_payment ?? prev.can_confirm_payment,
      }));
      wsSnapshotRef.current = {
        rawStatus: "pending_acceptance",
        can_confirm_payment:
          confirmOrder.can_confirm_payment ?? wsSnapshotRef.current.can_confirm_payment,
      };
    }
    if (typeof confirmOrder.can_confirm_payment === "boolean") {
      setWsTradeSnapshot((prev) => ({
        ...prev,
        can_confirm_payment: confirmOrder.can_confirm_payment,
      }));
      wsSnapshotRef.current = {
        ...wsSnapshotRef.current,
        can_confirm_payment: confirmOrder.can_confirm_payment,
      };
    }
  }, [confirmOrder?.id, confirmOrder?.status, confirmOrder?.can_confirm_payment]);

  // Keep WS snapshot aligned when REST reaches a terminal phase (avoids stale "matched" from WS)
  useEffect(() => {
    if (!confirmOrder?.id) return;
    const st = String(confirmOrder.status || "").trim();
    if (!st) return;
    const lowered = st.toLowerCase();
    if (
      lowered === "completed" ||
      lowered === "cancelled" ||
      lowered === "canceled" ||
      lowered === "half-matched" ||
      lowered === "half_matched"
    ) {
      const snap = {
        ...wsSnapshotRef.current,
        rawStatus: st,
        can_confirm_payment:
          confirmOrder.can_confirm_payment ?? wsSnapshotRef.current.can_confirm_payment,
        can_confirm_receipt:
          confirmOrder.can_confirm_receipt ?? wsSnapshotRef.current.can_confirm_receipt,
      };
      wsSnapshotRef.current = snap;
      setWsTradeSnapshot(snap);
    }
  }, [
    confirmOrder?.id,
    confirmOrder?.status,
    confirmOrder?.can_confirm_payment,
    confirmOrder?.can_confirm_receipt,
  ]);

  useEffect(() => {
    setIsClient(true);
    // Load trade data from localStorage on client side only
    if (typeof window !== 'undefined') {
      const tradeData = localStorage.getItem("new_order");
      if (tradeData) {
        try {
          const parsedData = JSON.parse(tradeData);
          setTradeDataJson(parsedData);
        } catch (error) {
                    setTradeDataJson({});
        }
      }
    }
  }, []);

  // Reset modal and previous status when switching to a different trade
  useEffect(() => {
    if (confirmOrder?.id !== prevTradeIdRef.current) {
      setShowSuccessModal(false);
      prevTradeIdRef.current = confirmOrder?.id || null;
      prevStatusRef.current = undefined;
      lastActionTradeIdRef.current = null;
      setWsTradeSnapshot({ rawStatus: "" });
      wsSnapshotRef.current = { rawStatus: "" };
    } else if (confirmOrder?.id && !prevTradeIdRef.current) {
      lastActionTradeIdRef.current = null;
    }
  }, [confirmOrder?.id]);

  // Show success modal only on transition to completed for the current trade
  useEffect(() => {
    const currentId = confirmOrder?.id || "";
    const newStatus = getEffectiveTradeStatus(
      confirmOrder?.status,
      wsSnapshotRef.current
    ).toLowerCase();
    const prevStatus = (prevStatusRef.current || "").toLowerCase();
    const paramId =
      (params?.id as string) ||
      (typeof window !== "undefined" ? localStorage.getItem("p2p_trade_id") : null) ||
      "";

    // Ensure we're reacting only to the currently viewed trade
    if (!currentId || (paramId && currentId !== paramId)) {
      prevStatusRef.current = newStatus;
      return;
    }

    if (newStatus === "completed" && prevStatus !== "completed") {
      const modalShownKey = `success_modal_shown_${currentId}`;
      const hasShownModal = localStorage.getItem(modalShownKey);
      if (!hasShownModal) {
        setShowSuccessModal(true);
        localStorage.setItem(modalShownKey, "true");
      }
    }

    prevStatusRef.current = newStatus;
  }, [confirmOrder?.status, confirmOrder?.id, params?.id, wsTradeSnapshot.rawStatus]);

  // Cleanup on unmount to treat next visit as new
  useEffect(() => {
    return () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const orderSlice = require("@/features/p2p/slices/orderSlice");
        if (orderSlice?.resetConfirmOrderState) {
          dispatch(orderSlice.resetConfirmOrderState());
        }
        if (orderSlice?.resetSingleOrderState) {
          dispatch(orderSlice.resetSingleOrderState());
        }
      } catch (_) {
        // no-op
      }
      prevStatusRef.current = undefined;
      prevTradeIdRef.current = null;
      setShowSuccessModal(false);
    };
  }, [dispatch]);

  // Get all payment details from order data - use multiple sources for robustness
  const fromSingle = Array.isArray(singleOrder?.payment_details) ? singleOrder.payment_details : [];
  const fromConfirm = Array.isArray(confirmOrder?.payment_details) ? confirmOrder.payment_details : [];
  const fromTradeData = Array.isArray(tradeDataJson?.payment_details) ? tradeDataJson.payment_details : [];
  const paymentDetailsList = fromConfirm.length > 0 ? fromConfirm : fromSingle.length > 0 ? fromSingle : fromTradeData;

  // Range currency (KES or USD) for display - from order/trade
  const rangeCurrency = ((singleOrder as any)?.range_currency || (confirmOrder as any)?.buy_order?.range_currency || (confirmOrder as any)?.sell_order?.range_currency || tradeDataJson?.range_currency || "USD")?.toString().toUpperCase();
  const rangeSuffix = rangeCurrency === "KES" ? "KES" : "USD";
  const rangeSymbol = rangeCurrency === "KES" ? "KES" : "$";
  const normalizedAvailableUnit =
    String(singleOrder?.currency || "USDT").toUpperCase() === "KES"
      ? "USD"
      : singleOrder?.currency || "USDT";

  // Buy-ad owner: send fiat = USDT × rate, receive USDT.
  const tradeUsdtAmount = Number(confirmOrder?.amount) || 0;
  const commissionRate =
    Number(confirmOrder?.commission_rate) ||
    Number(singleOrder?.commission_rate) ||
    Number(tradeDataJson?.commission_rate) ||
    0;
  const fiatPaid = roundP2PFiat(buyFiatFromUsdtReceived(tradeUsdtAmount, commissionRate));
  const orderType = singleOrder?.order_type || "sell";

  // Format numbers
  const formatAmount = (amt: number) =>
    amt.toLocaleString(undefined, { maximumFractionDigits: 6 });

  // Format commission rate for display (e.g. 1.00 shows as "1.00", not "1")
  const formatCommissionRate = (rate: number) =>
    Number(rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleCancelTransaction = () => {
    if (isAuthenticated && confirmOrder?.id) {
      dispatch(cancelP2POrderThunk(confirmOrder.id));
      showToast.success("Transaction Cancelled Successfully!");
      setTimeout(() => {
        router.push("/dashboard/p2p");
      }, 2000);
    }
  };
  handleCancelTransactionRef.current = handleCancelTransaction;

  const countdown = useBackgroundAwareCountdown({
    durationSeconds: displaySeconds,
    active: Boolean(confirmOrder?.id) && displaySeconds > 0,
    armed: appealTimerMatched,
    resetKey: `${confirmOrder?.id ?? ""}-matched`,
    onExpire: () => {
      if (confirmStatusRef.current !== "matched") return;
      logger.debug("p2p", "Appeal countdown reached 0, auto-cancelling transaction");
      handleCancelTransactionRef.current();
    },
  });

  // Add handler for confirming trade
  const handleConfirmTrade = () => {
    if (isAuthenticated && confirmOrder?.id) {
      lastActionTradeIdRef.current = confirmOrder.id;
      dispatch(confirmP2PTradeThunk(confirmOrder.id))
        .unwrap()
        .then(() => {
          setShowMoneySentModal(true);
          dispatch(fetchConfirmOrder(confirmOrder.id));
        })
        .catch((error) => {
          showToast.error(
            "Failed to confirm trade",
            error?.message || "Please try again"
          );
        });
    }
  };

  const handleRefresh = () => {
    const orderId = params?.id as string;
    if (orderId) {
      dispatch(fetchConfirmOrder(orderId));
    }
  };

  return (
    <div className="md:mt-20">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Notification center", href: "/dashboard/notifications" },
          { label: "View order" },
        ]}
      />
      <div className="final-buy-container grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 sm:gap-4 md:gap-6 p-0 sm:p-1 md:p-3 min-h-screen bg-[#EEF1F4] dark:bg-[var(--bg-color)] overflow-x-hidden">
        {/* Left Column: Main Info */}
        <div className="md:col-span-2 flex flex-col gap-6 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <p
                className="text-gray-900 dark:text-white text-xs sm:text-[13px] font-medium"
              >
                Advertiser Information
              </p>
              <span className="text-[10px] sm:text-xs text-[#1D8751] flex items-center gap-1 whitespace-nowrap">
                Transaction time:{" "}
                {isClient ? (
                  <TimeDisplay
                    seconds={transactionTimerActive ? countdown : displaySeconds}
                  />
                ) : (
                  <span>--:--</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowChat((prev) => !prev)}
                className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D8751] text-white text-xs font-medium hover:bg-[#166b3e] transition-colors"
                aria-label={showChat ? "Close chat" : "Open chat"}
              >
                <MessageCircle className="w-4 h-4" />
                {showChat ? "Close Chat" : "Chat"}
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1 bg-gray-100 dark:bg-[var(--card-color)] text-[#1D8751] rounded-lg px-2 py-1.5 sm:py-1 border border-gray-200 dark:border-[#35353E] hover:bg-gray-200 dark:hover:bg-[#35353E] transition-colors self-start sm:self-auto"
                title="Refresh"
              >
                <RefreshCw size={12} className="sm:w-[14px] sm:h-[14px]" />
              </button>
            </div>
          </div>
          {/* Advertiser Info */}
          <section className="advertiser-info rounded-[18px] p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border-2 border-gray-200 dark:border-[#35353E] bg-transparent">
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <div className="icon rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-lg sm:text-xl font-bold bg-[#1D8751] text-white flex-shrink-0 overflow-hidden">
                {(tradeDataJson?.buy_photo ||
                  confirmOrder?.buyer_photo ||
                  singleOrder?.advertiser_photo) ? (
                  <img
                    className="w-full h-full object-cover"
                    src={
                      tradeDataJson?.buy_photo ||
                      confirmOrder?.buyer_photo ||
                      singleOrder?.advertiser_photo ||
                      ""
                    }
                    alt={singleOrder?.advertiser_name || "Advertiser"}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-[#1D8751] font-bold text-sm sm:text-lg">
                    {(
                      singleOrder?.advertiser_first_name?.[0] ||
                      singleOrder?.advertiser_name?.[0] ||
                      "?"
                    ).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-gray-900 dark:text-white text-xs sm:text-[13px] font-medium flex items-center gap-2 flex-wrap">
                  {singleOrder ? (
                    <span className="truncate block sm:inline">
                      {singleOrder.advertiser_first_name && singleOrder.advertiser_last_name
                        ? `${singleOrder.advertiser_first_name} ${singleOrder.advertiser_last_name}`
                        : singleOrder.advertiser_name || "Advertiser User Name"}
                    </span>
                  ) : (
                    <span className="truncate block sm:inline">Advertiser User Name</span>
                  )}
                  <UserStatusBadge isLive={statusWsConnected} className="flex-shrink-0 ml-1" />
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-[#788099] mt-0.5 sm:mt-0">
                  <span className="whitespace-nowrap">{singleOrder?.user_total_buy_orders || 120} Orders</span>{" "}
                  <span className="hidden sm:inline">|</span>{" "}
                  <span className="whitespace-nowrap">{Number(singleOrder?.completion_rate ?? 99.2).toFixed(2)}% Completion</span>
                </div>
                <div className="text-[10px] sm:text-xs text-[#1D8751] mt-0.5 sm:mt-0">
                  <span className="whitespace-nowrap">Rating: 99%</span>{" "}
                  <span className="hidden sm:inline">|</span>{" "}
                  <span className="whitespace-nowrap">Commission: {tradeDataJson?.commission_rate || "0.5"}</span>
                </div>
              </div>
            </div>
            <div className="sm:ml-auto flex flex-wrap sm:flex-nowrap gap-4 sm:gap-6 lg:gap-8 text-xs justify-start sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-200 dark:border-[#35353E] min-w-0">
              <div className="flex-shrink-0">
                <span className="text-xs sm:text-[13px] text-gray-900 dark:text-white font-medium block">
                  {formatDurationForDisplay(singleOrder?.limit_duration) || "10 Minutes"}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-[#788099]">
                  Time limit
                </span>
              </div>
              <div className="flex-shrink-0">
                <span className="text-xs sm:text-[13px] text-gray-900 dark:text-white font-medium block">
                  {formatDurationForDisplay(singleOrder?.completion_time) || formatDurationForDisplay(confirmOrder?.completion_time) || "2 Minutes"}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-[#788099]">
                  Avg. real-time
                </span>
              </div>
              <div className="flex-shrink-0">
                <span className="text-xs sm:text-[13px] text-gray-900 dark:text-white font-medium block">
                  {singleOrder?.amount || "1,200"}{" "}
                  {normalizedAvailableUnit}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-[#788099]">
                  Available assets
                </span>
              </div>
            </div>
          </section>

          {/* Order Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-xs sm:text-[13px] text-base text-gray-900 dark:text-white font-medium">
              Order Info
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-[#788099]">
              Order Number:{" "}
              <button
                className="underline text-[#1D8751] cursor-pointer bg-transparent border-none p-0 break-all text-left sm:text-right"
                onClick={() => handleCopyToClipboard(confirmOrder?.id || singleOrder?.id, "order-number", setCopiedButton)}
                aria-label="Copy order number"
              >
                <span className="break-all">{copiedButton === "order-number" ? "Copied!" : (confirmOrder?.id || "9346457687345")}</span>
              </button>
            </div>
          </div>
          <section className="order-info rounded-[18px] p-2   border-2 border-gray-200 dark:border-[#35353E] bg-gray-50 dark:bg-[var(--card-color)] ">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Buy-ad owner: send fiat, receive USDT */}
              <div className="flex-1 flex flex-col mb-2 md:mb-0">
                <div className="mb-1 text-gray-600 dark:text-[#788099] text-[0.95rem] font-medium">
                  I want to Send
                </div>
                <div className="flex items-center h-[46px] rounded-2xl border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] px-2">
                  <span className="text-[#1D8751] text-2xl mr-2">{rangeSymbol}</span>
                  <span className="text-[#1D8751] text-xl font-semibold">
                    {formatAmount(fiatPaid)}
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white text-base font-medium">
                    {rangeSuffix}
                  </span>
                </div>
              </div>
              <div className="flex-1 flex flex-col mb-2 md:mb-0">
                <div className="mb-1 text-gray-600 dark:text-[#788099] text-[0.95rem] font-medium">
                  I want to Receive
                </div>
                <div className="flex items-center h-[46px] rounded-2xl border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] px-2">
                  <span className="text-[#1D8751] text-2xl mr-2">
                    <img src="/images/tether.svg" alt="USDT" className="w-6 h-6" />
                  </span>
                  <span className="text-[#1D8751] text-xl font-semibold">
                    {formatAmount(tradeUsdtAmount)}
                  </span>
                  <span className="ml-auto text-gray-900 dark:text-white text-base font-medium">
                    USDT
                  </span>
                </div>
              </div>
              {/* Rate */}
              <div className="flex-1 flex flex-col">
                <div className="mb-1 text-gray-600 dark:text-[#788099] text-[0.95rem] font-medium">
                  Rate
                </div>
                <div className="flex items-center h-[46px] rounded-2xl border border-gray-200 dark:border-[#35353E] bg-gray-100 dark:bg-[#35353E] px-2">
                  <span className="text-[#1D8751] text-2xl mr-2">{rangeSymbol}</span>
                  <span className="text-[#1D8751] text-xl font-semibold">
                    {formatCommissionRate(commissionRate)}
                  </span>
                  <span className="ml-auto text-gray-900 dark:text-white text-base font-medium">
                    {rangeSuffix}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Send Money To */}
          <section className="send-money rounded-[18px] p-2 md:p-4 ">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
              <div className="text-xs sm:text-[13px] flex-1 text-gray-900 dark:text-white font-medium">
                Send Money To
              </div>
              <div className="text-[10px] sm:text-xs flex items-center gap-1">
                <span className="text-[#1D8751] whitespace-nowrap">Transaction time:</span>
                {isClient ? (
                  <TimeDisplay
                    seconds={transactionTimerActive ? countdown : displaySeconds}
                  />
                ) : (
                  <span>--:--</span>
                )}
              </div>
            </div>
            <div className="rounded-[18px] flex flex-col  p-2 md:p-4 gap-4 bg-gray-50 dark:bg-[var(--card-color)]">
              {/* Left: Bank Info */}
              <div className="flex flex-col gap-4">
                {paymentDetailsList.length > 0 ? (
                  paymentDetailsList.map((paymentDetails: { id?: number; provider?: string; payment_method?: string; account_name?: string; account_number?: string; wallet_address?: string; provider_logo?: string; logo?: string; logo_url?: string }) => (
                    <div key={paymentDetails?.id ?? paymentDetails?.provider ?? Math.random()} className="flex flex-col gap-3 p-3 md:p-4 border border-gray-200 dark:border-[#3C3C47] rounded-2xl bg-white dark:bg-[var(--bg-color)]">
                      <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                        <div className="flex flex-row gap-2 md:gap-3 items-center p-2 md:p-3 w-full md:w-auto md:min-w-[140px]">
                          {paymentDetails?.logo || paymentDetails?.logo_url || paymentDetails?.provider_logo ? (
                            <img
                              src={paymentDetails?.logo || paymentDetails?.logo_url || paymentDetails?.provider_logo}
                              alt={paymentDetails?.provider || "Provider"}
                              className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-contain flex-shrink-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector(".fallback-initial")) {
                                  const fallback = document.createElement("div");
                                  fallback.className = "fallback-initial w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#1D8751] flex items-center justify-center flex-shrink-0";
                                  fallback.innerHTML = `<span class="text-white font-bold text-sm">${(paymentDetails?.provider?.[0] || "B").toUpperCase()}</span>`;
                                  parent.insertBefore(fallback, parent.firstChild);
                                }
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#1D8751] flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-sm">
                                {(paymentDetails?.provider?.[0] || "B").toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-gray-900 dark:text-white text-sm md:text-base font-semibold">
                              {paymentDetails?.provider}
                            </span>
                            {paymentDetails?.payment_method && (
                              <span className="text-[#788099] text-xs">
                                {paymentDetails.payment_method.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 md:gap-4 w-full md:flex-1 min-w-0">
                          <div className="flex flex-col gap-3 md:gap-4">
                            <div className="flex w-full flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                              <div className="w-full flex flex-col min-w-0">
                                <span className="text-[#788099] text-xs md:text-sm mb-2">Account Name</span>
                                <span className="flex-1 min-w-0 px-3 md:px-4 py-2 rounded-full border border-[#1D8751] text-[#1D8751] bg-transparent font-semibold text-sm md:text-base flex items-center truncate">
                                  <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#1D8751] inline-block mr-2 flex-shrink-0"></span>
                                  <span className="truncate">{paymentDetails?.account_name}</span>
                                </span>
                              </div>
                              <button
                                className="w-full sm:w-auto px-3 md:px-4 py-2 rounded-full border border-gray-200 dark:border-[#35353E] text-[#1D8751] bg-gray-100 dark:bg-[var(--card-color)] font-semibold text-sm flex items-center justify-center gap-1.5 flex-shrink-0"
                                onClick={() =>
                                  handleCopyToClipboard(paymentDetails?.account_name || "", `account-name-${paymentDetails?.id}`, setCopiedButton)
                                }
                              >
                                {copiedButton === `account-name-${paymentDetails?.id}` ? "Copied!" : "Copy"}
                                <Copy className="w-2 h-2 md:w-3 md:h-3" />
                              </button>
                            </div>
                            <div className="flex w-full flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                              <div className="w-full flex flex-col min-w-0">
                                <span className="text-[#788099] text-xs md:text-sm mb-2">Account Number</span>
                                <span className="flex-1 min-w-0 px-3 md:px-4 py-2 rounded-full border border-[#1D8751] text-[#1D8751] bg-transparent font-semibold text-sm md:text-base flex items-center truncate">
                                  <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#1D8751] inline-block mr-2 flex-shrink-0"></span>
                                  <span className="truncate">{paymentDetails?.account_number}</span>
                                </span>
                              </div>
                              <button
                                className="w-full sm:w-auto px-3 md:px-4 py-2 rounded-full border border-gray-200 dark:border-[#35353E] text-[#1D8751] bg-gray-100 dark:bg-[var(--card-color)] font-semibold text-sm flex items-center justify-center gap-1.5 flex-shrink-0"
                                onClick={() =>
                                  handleCopyToClipboard(paymentDetails?.account_number || "", `account-number-${paymentDetails?.id}`, setCopiedButton)
                                }
                              >
                                {copiedButton === `account-number-${paymentDetails?.id}` ? "Copied!" : "Copy"}
                                <Copy className="w-2 h-2 md:w-3 md:h-3" />
                              </button>
                            </div>
                            {paymentDetails?.wallet_address ? (
                              <div className="flex w-full flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                                <div className="w-full flex flex-col min-w-0">
                                  <span className="text-[#788099] text-xs md:text-sm mb-2">Wallet Address</span>
                                  <span className="flex-1 min-w-0 px-3 md:px-4 py-2 rounded-full border border-[#1D8751] text-[#1D8751] bg-transparent font-semibold text-sm md:text-base flex items-center truncate">
                                    <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#1D8751] inline-block mr-2 flex-shrink-0"></span>
                                    <span className="truncate">{paymentDetails.wallet_address}</span>
                                  </span>
                                </div>
                                <button
                                  className="w-full sm:w-auto px-3 md:px-4 py-2 rounded-full border border-gray-200 dark:border-[#35353E] text-[#1D8751] bg-gray-100 dark:bg-[var(--card-color)] font-semibold text-sm flex items-center justify-center gap-1.5 flex-shrink-0"
                                  onClick={() =>
                                    handleCopyToClipboard(paymentDetails.wallet_address || "", `wallet-address-${paymentDetails?.id}`, setCopiedButton)
                                  }
                                >
                                  {copiedButton === `wallet-address-${paymentDetails?.id}` ? "Copied!" : "Copy"}
                                  <Copy className="w-2 h-2 md:w-3 md:h-3" />
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[#788099] text-sm py-4">No payment methods available</div>
                )}
                {paymentDetailsList.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <div className="w-full flex flex-col min-w-0">
                      <span className="text-[#788099] text-xs md:text-sm mb-2">Transaction ID</span>
                      <span className="flex-1 min-w-0 font-[11px] md:font-[13px] px-3 md:px-4 py-2 rounded-full border border-[#1D8751] text-[#1D8751] bg-transparent flex items-center truncate">
                        <span className="truncate">{singleOrder?.id}</span>
                      </span>
                    </div>
                    <button
                      className="w-full sm:w-auto px-3 md:px-4 py-2 font-[11px] md:font-[13px] rounded-full border border-gray-200 dark:border-[#35353E] text-[#1D8751] bg-gray-100 dark:bg-[var(--card-color)] flex items-center justify-center gap-1.5 flex-shrink-0"
                      onClick={() => handleCopyToClipboard(singleOrder?.id || "", "transaction-id", setCopiedButton)}
                    >
                      {copiedButton === "transaction-id" ? "Copied!" : "Copy"}
                      <Copy className="w-2 h-2 md:w-3 md:h-3" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-col  gap-4">
                <div className="flex-1">
                  <div className="rounded-2xl border border-[#1D8751] bg-gray-50 dark:bg-[var(--bg-color)] p-6 mt-2 text-base flex flex-col gap-2">
                    <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                      <span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block shrink-0"></span>
                      Please send the money from your own account Only
                    </div>
                    <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                      <span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block shrink-0"></span>
                      Put transaction ID in the description field of the bank
                    </div>
                    <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                      <span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block shrink-0"></span>
                      Please note, If you do not follow above conditions, we
                      will reject your transaction and send you back your money.
                    </div>
                  </div>
                  <div className="flex-1">
                    {(!buyerPaymentPhaseActive || countdown === 0) && (
                      <div className="mt-4 mb-2 text-lg">
                        <span className="text-gray-900 dark:text-white">
                          I have an issue with transaction.{" "}
                        </span>
                        <span
                          className="text-[#E23D3A] cursor-pointer"
                          onClick={() => setShowAppealModal(true)}
                        >
                          Appeal/Complain
                        </span>
                      </div>
                    )}
                    <div className="mt-4 flex flex-row items-stretch gap-2 sm:gap-4">
                      <button
                        className={`flex-[2] min-w-0 sm:flex-1 flex items-center justify-center text-center px-3 sm:px-4 py-2.5 sm:py-2 rounded-2xl border-2 border-gray-200 dark:border-[#3C3C47] text-xs sm:text-lg leading-tight ${confirmOrder?.status === "half-matched"
                          ? "bg-gray-100 dark:bg-[var(--card-color)] text-gray-400 dark:text-[#888]"
                          : "bg-transparent text-gray-600 dark:text-[#788099]"
                          }`}
                        onClick={handleCancelTransaction}
                        disabled={
                          cancelLoading || confirmOrder?.status === "half-matched"
                        }
                      >
                        {cancelLoading ? "Cancelling..." : "Cancel Transaction"}
                      </button>
                      <button
                        className={`flex-[3] min-w-0 sm:flex-1 flex items-center justify-center text-center px-3 sm:px-4 py-2.5 sm:py-2 rounded-2xl text-xs sm:text-lg leading-tight ${confirmOrder?.status === "half-matched" || !buyerMayMarkMoneySent
                          ? "bg-gray-100 dark:bg-[var(--card-color)] text-gray-400 dark:text-[#888]"
                          : "bg-[#1D8751] text-white hover:bg-[#167a45] transition-colors"
                          } ${(() => {
                            const isThisTradeLoading =
                              confirmTradeLoading &&
                              !!confirmOrder?.id &&
                              lastActionTradeIdRef.current === confirmOrder.id;
                            return isThisTradeLoading ? "opacity-60 cursor-not-allowed" : "";
                          })()}`}
                        onClick={handleConfirmTrade}
                        disabled={
                          (() => {
                            const isThisTradeLoading =
                              confirmTradeLoading &&
                              !!confirmOrder?.id &&
                              lastActionTradeIdRef.current === confirmOrder.id;
                            return (
                              isThisTradeLoading ||
                              !confirmOrder?.id ||
                              confirmOrder?.status === "half-matched" ||
                              !buyerMayMarkMoneySent
                            );
                          })()
                        }
                      >
                        {(() => {
                          const isThisTradeLoading =
                            confirmTradeLoading &&
                            !!confirmOrder?.id &&
                            lastActionTradeIdRef.current === confirmOrder.id;
                          if (effectiveStatus.toLowerCase() === "completed") {
                            return "Trade completed";
                          }
                          return isThisTradeLoading
                            ? "Notifying seller..."
                            : "Money Sent Notify Seller";
                        })()}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right: Account Details and Actions */}
            </div>
          </section>
        </div>

        {/* Right Column: Chat and Terms - on mobile hidden unless Chat button clicked, opens on top */}
        <div className={`md:col-span-1 pt-10 flex flex-col gap-6 mt-6 md:mt-0 min-w-0 overflow-hidden ${!showChat ? "hidden md:flex" : "order-first md:order-none flex"}`}>
          <ChatBox
            onClose={() => setShowChat(false)}
            tradeId={confirmOrder?.id || ""}
            userId={user?.id.toString() || ""}
            userName={resolveAdvertiserDisplayName(singleOrder, confirmOrder)}
            autoreply={singleOrder?.auto_reply || ""}
            // Prefer photos from the trade (confirmOrder) but fall back to data already available on this page.
            seller_photo={
              confirmOrder?.seller_photo ||
              singleOrder?.advertiser_photo ||
              (singleOrder as any)?.seller_photo ||
              ""
            }
            buyer_photo={
              confirmOrder?.buyer_photo ||
              (tradeDataJson as any)?.buy_photo ||
              (tradeDataJson as any)?.buyer_photo ||
              ""
            }
            buyer={confirmOrder?.buyer || ""}
            seller={confirmOrder?.seller || ""}
            currentUserEmail={user?.email || ""}
            advertiserEmail={
              (singleOrder as { advertiser_email?: string })?.advertiser_email ||
              (confirmOrder as { advertiser_email?: string })?.advertiser_email
            }
            orderType={
              confirmOrder?.order_type ||
              singleOrder?.order_type ||
              orderType
            }
            owner={confirmOrder?.owner || ""}
            peerName={counterpartyDisplayName}
            sellerName={
              confirmOrder?.seller_full_name?.trim() ||
              resolveAdvertiserDisplayName(singleOrder, confirmOrder) ||
              "Seller"
            }
            buyerName={
              confirmOrder?.buyer_full_name?.trim() ||
              counterpartyDisplayName ||
              "Buyer"
            }
          />
          {/* Advertiser's Terms */}
          <section className="advertiser-terms rounded-lg p-4 bg-gray-50 dark:bg-[var(--card-color)]">
            <div className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
              Advertiser's Terms <span className="text-[#E23D3A]">⦿</span>
            </div>
            <div className="text-xs flex flex-col gap-2">
              <div className="text-[#1D8751]">
                {singleOrder?.terms_and_conditions}
              </div>
            </div>
          </section>
        </div>
        <AppealModal
          open={showAppealModal}
          onClose={() => setShowAppealModal(false)}
          tradeId={confirmOrder?.id || ""}
        />

        {/* Money Sent - Notify Seller Success Modal */}
        <Dialog
          open={showMoneySentModal}
          onClose={() => setShowMoneySentModal(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto w-full max-w-md rounded-2xl bg-white dark:bg-[var(--card-color)] text-gray-900 dark:text-white border border-gray-200 dark:border-[#35353E] shadow-xl">
              <div className="p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-[#1D8751]/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-[#1D8751]" strokeWidth={2} />
                  </div>
                  <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Payment Notification Sent
                  </Dialog.Title>
                  <p className="text-gray-600 dark:text-[#788099] text-sm mb-6 leading-relaxed">
                    The seller has been notified that you&apos;ve sent the payment. Please wait for them to confirm receipt. You can track the status in this chat.
                  </p>
                  <button
                    onClick={() => setShowMoneySentModal(false)}
                    className="w-full bg-[#1D8751] text-white rounded-xl px-6 py-3 font-semibold hover:bg-[#167a45] transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* Success Modal - Using Headless UI Dialog */}
        <Dialog
          open={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto w-full max-w-md rounded-2xl bg-white dark:bg-[var(--card-color)] text-gray-900 dark:text-white border border-gray-200 dark:border-[#35353E]">
              <div className="p-8">
                <div className="text-center">
                  {/* Success Icon */}
                  <div className="w-16 h-16 bg-[#1D8751] rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>

                  {/* Success Title */}
                  <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Trade Completed Successfully!
                  </Dialog.Title>

                  {/* Trade Details */}
                  <div className="bg-gray-50 dark:bg-[var(--bg-color)] rounded-xl p-4 mb-6 border border-gray-200 dark:border-[#35353E]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-[#A3A3C2]">
                        Amount Sent:
                      </span>
                      <span className="text-[#F79330] font-semibold">
                        {rangeSymbol}{formatAmount(fiatPaid)} {rangeSuffix}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-[#A3A3C2]">
                        Rate:
                      </span>
                      <span className="text-[#1D8751] font-semibold">
                        {formatCommissionRate(commissionRate)} {rangeSuffix}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-[#A3A3C2]">
                        Amount Received:
                      </span>
                      <span className="text-[#1D8751] font-semibold">
                        {formatAmount(tradeUsdtAmount)} USDT
                      </span>
                    </div>
                  </div>

                  {/* Go to Dashboard Button */}
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      // Clean up the localStorage key so modal can be shown again for new trades
                      if (confirmOrder?.id) {
                        localStorage.removeItem(`success_modal_shown_${confirmOrder.id}`);
                      }
                      window.location.href = "/dashboard/p2p/";
                    }}
                    className="w-full bg-[#1D8751] text-white rounded-lg px-6 py-3 font-semibold hover:bg-[#167a45] transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default FinalSell;
