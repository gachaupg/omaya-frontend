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
import { FaChevronRight } from "react-icons/fa";
import {
  fetchSingleOrder,
  fetchConfirmOrder,
  cancelP2POrderThunk,
  completeP2PTradeThunk,
} from "@/features/p2p/slices/orderSlice";
import { submitFeedbackThunk } from "@/features/p2p/slices/feedbackSubmissionSlice";
import {
  FileIcon,
  SendIcon,
  RefreshCw,
  CopyIcon,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import AppealModal from "./appeal";
import { UserStatusBadge } from "./UserStatusBadge";
import ChatBox from "./ChatBox";
import { showToast } from "@/lib/utils/toast";
import { handleCopy, parseDurationToSeconds } from "../../../Common/utils";
import Image from "next/image";
import { useTradeStatusWebSocket } from "@/features/p2p/hooks/useTradeStatusWebSocket";
import { useP2pTradeCanceledRedirect } from "@/features/p2p/hooks/useP2pTradeCanceledRedirect";
import { useMarketTradeStatusWsHandler } from "@/features/p2p/hooks/useMarketTradeStatusWsHandler";
import { useBackgroundAwareCountdown } from "@/features/p2p/hooks/useBackgroundAwareCountdown";
import { getSellAdOwnerCounterpartyBuyerName } from "@/features/p2p/utils/matchedTradeNotifications";
import {
  canSellerConfirmReceipt,
  getEffectiveConfirmFlags,
  getEffectiveTradeStatus,
  isPendingAcceptanceStatus,
  type WsTradeSnapshot,
} from "@/features/p2p/utils/tradeWsAcceptanceGate";

import { logger } from "@/lib/utils/logger";

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
  const { loading: feedbackLoading, error: feedbackError, success: feedbackSuccess } = useSelector(
    (state: RootState) => state.feedbackSubmission
  );
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<boolean | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isClient, setIsClient] = useState(false);
  const prevStatusRef = useRef<string | undefined>(undefined);
  const prevTradeIdRef = useRef<string | null>(null);
  const lastActionTradeIdRef = useRef<string | null>(null);
  const [wsTradeSnapshot, setWsTradeSnapshot] = useState<{
    rawStatus: string;
    can_confirm_receipt?: boolean;
    can_confirm_payment?: boolean;
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

  const mapSellerWsSnapshot = (snap: WsTradeSnapshot) => ({
    rawStatus: snap.rawStatus,
    can_confirm_receipt: snap.can_confirm_receipt,
    can_confirm_payment: snap.can_confirm_payment,
  });

  const handleStatusUpdate = useMarketTradeStatusWsHandler({
    confirmOrder,
    logLabel: "TradeBuyOwner",
    onCanceledPayload: handleWsStatusPayload,
    onSnapshot: (snap) => {
      const sellerSnap = mapSellerWsSnapshot(snap);
      setWsTradeSnapshot(sellerSnap);
      wsSnapshotRef.current = sellerSnap;
    },
  });

  // WebSocket for real-time trade status updates
  const { isConnected: statusWsConnected } = useTradeStatusWebSocket({
    tradeId: confirmOrder?.id || "",
    enabled: isAuthenticated && !!confirmOrder?.id,
    onStatusUpdate: handleStatusUpdate,
  });

  // Use limit_duration from order only (e.g. "00:00:05" = 5 min) - never use trade's limit (30 min default)
  const displaySeconds = parseDurationToSeconds(singleOrder?.limit_duration);
  const effectiveStatus = getEffectiveTradeStatus(
    confirmOrder?.status,
    wsTradeSnapshot
  );
  const effectiveFlags = getEffectiveConfirmFlags(confirmOrder, wsTradeSnapshot);
  const inPendingAcceptanceSeller =
    isPendingAcceptanceStatus(wsTradeSnapshot.rawStatus) ||
    isPendingAcceptanceStatus(String(confirmOrder?.status || ""));
  const sellerPaymentPhaseActive =
    effectiveStatus === "matched" && !inPendingAcceptanceSeller;
  const sellerMayMarkReceived = canSellerConfirmReceipt(
    effectiveStatus,
    effectiveFlags,
    inPendingAcceptanceSeller
  );
  const appealTimerMatched = sellerPaymentPhaseActive;
  const handleCancelTransactionRef = useRef<() => void>(() => {});
  const confirmStatusRef = useRef(confirmOrder?.status);
  confirmStatusRef.current = effectiveStatus;

  // Fetch confirm order when authenticated and orderId is available
  useEffect(() => {
    const orderId = params?.id as string;
    if (isAuthenticated && orderId) {
      dispatch(fetchConfirmOrder(orderId));
    }
  }, [params?.id, dispatch, isAuthenticated]);

  const saveOrder = localStorage.getItem("new_order")
    ? JSON.parse(localStorage.getItem("new_order")!)
    : null;
  const orderIdToFetch = confirmOrder?.buy_order ?? confirmOrder?.sell_order;

  /** Sell-ad owner screen: counterparty is always the buyer (full name when API provides it). */
  const counterpartyDisplayName = getSellAdOwnerCounterpartyBuyerName(
    confirmOrder,
    singleOrder,
    saveOrder
  );

  // Fetch single order only when the order id changes (not on every confirmOrder ref from WebSocket refresh)
  useEffect(() => {
    if (isAuthenticated && orderIdToFetch) {
      dispatch(fetchSingleOrder(String(orderIdToFetch)));
    }
  }, [orderIdToFetch, dispatch, isAuthenticated]);

  // REST may expose pending_acceptance / flags before WebSocket fires
  useEffect(() => {
    if (!confirmOrder?.id) return;
    const st = String(confirmOrder.status || "");
    if (isPendingAcceptanceStatus(st)) {
      setWsTradeSnapshot((prev) => ({
        rawStatus: "pending_acceptance",
        can_confirm_receipt:
          confirmOrder.can_confirm_receipt ?? prev.can_confirm_receipt,
        can_confirm_payment:
          confirmOrder.can_confirm_payment ?? prev.can_confirm_payment,
      }));
      wsSnapshotRef.current = {
        rawStatus: "pending_acceptance",
        can_confirm_receipt:
          confirmOrder.can_confirm_receipt ?? wsSnapshotRef.current.can_confirm_receipt,
        can_confirm_payment:
          confirmOrder.can_confirm_payment ?? wsSnapshotRef.current.can_confirm_payment,
      };
    }
    if (typeof confirmOrder.can_confirm_receipt === "boolean") {
      setWsTradeSnapshot((prev) => ({
        ...prev,
        can_confirm_receipt: confirmOrder.can_confirm_receipt,
      }));
      wsSnapshotRef.current = {
        ...wsSnapshotRef.current,
        can_confirm_receipt: confirmOrder.can_confirm_receipt,
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
  }, [confirmOrder?.id, confirmOrder?.status, confirmOrder?.can_confirm_receipt, confirmOrder?.can_confirm_payment]);

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
        can_confirm_receipt:
          confirmOrder.can_confirm_receipt ?? wsSnapshotRef.current.can_confirm_receipt,
        can_confirm_payment:
          confirmOrder.can_confirm_payment ?? wsSnapshotRef.current.can_confirm_payment,
      };
      wsSnapshotRef.current = snap;
      setWsTradeSnapshot(snap);
    }
  }, [
    confirmOrder?.id,
    confirmOrder?.status,
    confirmOrder?.can_confirm_receipt,
    confirmOrder?.can_confirm_payment,
  ]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset modal and previous status when switching to a different trade
  useEffect(() => {
    if (confirmOrder?.id !== prevTradeIdRef.current) {
      setShowSuccessModal(false);
      prevTradeIdRef.current = confirmOrder?.id || null;
      prevStatusRef.current = undefined;
      // Reset lastActionTradeIdRef when viewing a different trade
      // This prevents showing loading state for actions on different trades
      lastActionTradeIdRef.current = null;
      setWsTradeSnapshot({ rawStatus: "" });
      wsSnapshotRef.current = { rawStatus: "" };
    } else if (confirmOrder?.id && !prevTradeIdRef.current) {
      // Reset on initial load when confirmOrder is first set
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
        // Reset redux state for confirm and single order
        // Imported from orderSlice
        // We inline import usage to avoid circular deps here
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
  const fromSaveOrder = Array.isArray(saveOrder?.payment_details) ? saveOrder.payment_details : [];
  const paymentDetailsList = fromConfirm.length > 0 ? fromConfirm : fromSingle.length > 0 ? fromSingle : fromSaveOrder;

  // Range currency (KES or USD) for display - from order/trade
  const rangeCurrency = ((singleOrder as any)?.range_currency || (confirmOrder as any)?.buy_order?.range_currency || (confirmOrder as any)?.sell_order?.range_currency || "USD")?.toString().toUpperCase();
  const rangeSuffix = rangeCurrency === "KES" ? "KES" : "USD";
  const rangeSymbol = rangeCurrency === "KES" ? "KES" : "$";

  // --- Calculation logic ---
  const sendAmount = Number(confirmOrder?.amount) || 0;
  const commissionRate = Number(confirmOrder?.commission_rate) || 0;
  const orderType = singleOrder?.order_type || "buy";
  let receiveAmount = sendAmount;

  if (orderType === "buy") {
    receiveAmount = sendAmount * commissionRate;
  } else {
    receiveAmount = sendAmount / commissionRate;
  }

  // Format numbers
  const formatAmount = (amt: number) =>
    amt.toLocaleString(undefined, { maximumFractionDigits: 6 });

  // Format commission rate for display (e.g. 1.00 shows as "1.00", not "1")
  const formatCommissionRate = (rate: number) =>
    Number(rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Format countdown seconds as M:SS for "Appeal after" display
  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleCancelTransaction = () => {
    if (confirmOrder?.id) {
      dispatch(cancelP2POrderThunk(confirmOrder.id))
        .unwrap()
        .then(() => {
          showToast.success("Transaction cancelled successfully!");
          // Redirect to dashboard immediately after cancellation
          setTimeout(() => {
            window.location.href = "/dashboard/p2p/";
          }, 1000);
        })
        .catch((error) => {
          showToast.error("Failed to cancel transaction", error.message || "Please try again");
        });
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

  const getButtonText = () => {
    const isThisTradeLoading =
      confirmTradeLoading &&
      !!confirmOrder?.id &&
      lastActionTradeIdRef.current === confirmOrder.id;
    if (effectiveStatus.toLowerCase() === "completed") {
      return "Trade completed";
    }
    if (isThisTradeLoading) return "Confirming payment...";
    return "Payments Received Notify Seller";
  };

  const handleRefresh = () => {
    const orderId = params?.id as string;
    if (orderId) {
      dispatch(fetchConfirmOrder(orderId));
    }
  };

  const handleFeedbackSubmit = () => {
    if (feedbackRating === null) {
      showToast.error("Please select a rating", "Choose positive or negative feedback");
      return;
    }

    if (confirmOrder?.id) {
      dispatch(submitFeedbackThunk({
        trade_id: confirmOrder.id,
        is_positive: feedbackRating,
        comment: feedbackComment,
      }))
        .unwrap()
        .then(() => {
          showToast.success("Feedback submitted successfully!", "Thank you for your feedback");
          setShowFeedbackModal(false);
          setFeedbackRating(null);
          setFeedbackComment("");
          // Redirect to dashboard after successful feedback
          setTimeout(() => {
            window.location.href = "/dashboard/p2p/";
          }, 1500);
        })
        .catch((error) => {
          showToast.error("Failed to submit feedback", error.message || "Please try again");
        });
    }
  };

  const handleConfirmTrade = () => {
    const orderId = params?.id as string;

    if (confirmOrder?.id) {
      lastActionTradeIdRef.current = confirmOrder.id;
      dispatch(completeP2PTradeThunk(confirmOrder.id))
        .unwrap()
        .then(() => {
          showToast.success(
            "Trade completed successfully!",
            "You will be redirected to the dashboard"
          );
          // Refresh confirm order after successful trade
          dispatch(fetchConfirmOrder(confirmOrder.id));
          // setTimeout(() => {
          //   router.push("/dashboard");
          // }, 2000);
        })
        .catch((error) => {
          showToast.error(
            "Failed to complete trade",
            error.message || "Please try again"
          );
        });
    }
  };

  logger.debug("p2p", "Confirm order:", confirmOrder);
  return (
    <div className="min-[900px]:mt-20">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Notification center", href: "/dashboard/notifications" },
          { label: "View order" },
        ]}
        className="mt-1 overflow-x-auto pb-2"
      />
      <div className="grid grid-cols-1 mt-6 sm:mt-10 min-[900px]:grid-cols-3 gap-4 sm:gap-6 p-3 sm:p-4 min-[900px]:p-6 min-h-screen bg-[#EEF1F4] dark:bg-[var(--bg-color)]">
        {/* Left: Timeline/Steps */}
        <div className="min-[900px]:col-span-2 flex flex-col gap-4">
          {/* Title row with Chat button (small screens) */}
          <div className="flex items-center justify-between mb-2 min-[900px]:hidden">
            <p className="text-gray-900 dark:text-white text-[13px] font-medium">
              Trade Details
            </p>
            <button
              type="button"
              onClick={() => setShowChat((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D8751] text-white text-xs font-medium hover:bg-[#166b3e] transition-colors"
              aria-label={showChat ? "Close chat" : "Open chat"}
            >
              <MessageCircle className="w-4 h-4" />
              {showChat ? "Close Chat" : "Chat"}
            </button>
          </div>
          {/* Step 1: Order Created */}
          <div className="relative pl-6 sm:pl-8 pb-4 border-l-2 border-gray-200 dark:border-[#35353E]">
            <div className="absolute -left-3 sm:-left-4 top-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 dark:bg-[var(--card-color)] border-2 border-[#1D8751] flex items-center justify-center text-[#1D8751] font-bold text-sm sm:text-lg">
              1
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="text-gray-900 dark:text-white font-semibold text-base sm:text-lg">
                  Order Created
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                <svg
                  width="20"
                  height="20"
                  className="sm:w-6 sm:h-6"
                  viewBox="0 0 64 64"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="64" height="64" fill="none" />
                  <path
                    d="M22 8h20a2 2 0 0 1 2 2v40l-4-3.5-4 3.5-4-3.5-4 3.5-4-3.5-4 3.5V10a2 2 0 0 1 2-2z"
                    fill="none"
                    stroke="#1D8751"
                    strokeWidth="4"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="24"
                    y1="20"
                    x2="40"
                    y2="20"
                    stroke="#1D8751"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <line
                    x1="24"
                    y1="28"
                    x2="40"
                    y2="28"
                    stroke="#1D8751"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <line
                    x1="24"
                    y1="36"
                    x2="32"
                    y2="36"
                    stroke="#1D8751"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>

                <span className="text-xs sm:text-sm text-gray-500 dark:text-[#A3A3C2]">
                  Order Number :
                  <button
                    className="text-[#1D8751] underline ml-1 break-all"
                    onClick={() => handleCopy(confirmOrder?.id?.toString())}
                  >
                    {confirmOrder?.id}
                  </button>
                </span>
                <CopyIcon
                  className="w-3 h-3 sm:w-4 sm:h-4 text-[#1D8751] ml-1 cursor-pointer flex-shrink-0"
                  onClick={() => handleCopy(confirmOrder?.id?.toString())}
                />

              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 border border-gray-200 dark:border-accent p-3 sm:p-4 rounded-xl mt-4 bg-white dark:bg-[var(--card-color)]">
              {/* Buy: fiat receive, rate, USDT send — same colors as buyform / TradeSellerOwner */}
              <div className="flex flex-col gap-2 w-full">
                <p className="text-[#788099] text-xs sm:text-sm font-medium">I will receive</p>
                <div className="flex flex-row items-center justify-between w-full bg-[#EEF1F4] dark:bg-accent rounded-xl px-3 sm:px-4 py-2.5 min-h-[52px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[#1D8751] text-lg sm:text-xl font-bold shrink-0">{rangeSymbol}</span>
                    <span className="text-[#1D8751] text-lg sm:text-xl font-bold">
                      {formatAmount(Math.round(Number(sendAmount) * Number(commissionRate) * 100) / 100)}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-900 dark:text-white font-medium ml-2 shrink-0">
                    {rangeSuffix}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <p className="text-[#788099] text-xs sm:text-sm font-medium">Rate</p>
                <div className="flex w-full flex-row justify-between items-center bg-[#EEF1F4] dark:bg-accent rounded-xl px-3 sm:px-4 py-2.5 min-h-[52px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[#1D8751] text-lg sm:text-xl font-bold shrink-0">{rangeSymbol}</span>
                    <span className="text-[#1D8751] text-lg sm:text-xl font-bold">
                      {commissionRate}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-900 dark:text-white font-medium ml-2 shrink-0">
                    {rangeSuffix}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <p className="text-[#788099] text-xs sm:text-sm font-medium">I will send</p>
                <div className="flex flex-row justify-between w-full items-center bg-[#EEF1F4] dark:bg-accent rounded-xl px-3 sm:px-4 py-2.5 min-h-[52px]">
                  <div className="flex flex-row items-center gap-2 min-w-0">
                    <Image
                      src="/assets/tether_1_yim48g.png"
                      alt="USDT"
                      width={20}
                      height={20}
                      className="w-4 h-4 sm:w-5 sm:h-5 shrink-0"
                    />
                    <span className="text-[#1D8751] text-lg sm:text-xl font-bold">
                      {formatAmount(Math.ceil(Number(saveOrder?.amount ?? 0)))}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-900 dark:text-white font-medium ml-2 shrink-0">
                    USDT
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Confirm Payment From Buyer */}
          <div className="relative pl-6 sm:pl-8 pb-4 border-l-2 border-gray-200 dark:border-[#35353E]">
            <div className="absolute -left-3 sm:-left-4 top-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 dark:bg-[var(--card-color)] border-2 border-[#1D8751] flex items-center justify-center text-[#1D8751] font-bold text-sm sm:text-lg">
              2
            </div>
            <span className="text-gray-900 dark:text-white font-semibold text-base sm:text-lg block pr-2">
              Your Payments Will Be Sent To:{" "}

            </span>
            <div className="bg-white dark:bg-[var(--card-color)] rounded-2xl p-4 sm:p-6 mt-4 flex flex-col gap-4 sm:gap-6 border border-gray-200 dark:border-[#35353E]">
              {/* Payment methods from API - display all from payment_details */}
              {paymentDetailsList.length > 0 ? (
                paymentDetailsList.map((paymentDetails: { id?: number; provider?: string; payment_method?: string; account_name?: string; account_number?: string; wallet_address?: string; provider_logo?: string }) => (
                  <div key={paymentDetails?.id ?? paymentDetails?.provider ?? Math.random()} className="flex flex-col gap-4 p-3 sm:p-4 border border-gray-200 dark:border-[#35353E] rounded-xl">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {paymentDetails?.provider_logo ? (
                        <img
                          src={paymentDetails.provider_logo}
                          alt={paymentDetails?.provider || "Provider"}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector(".fallback-initial")) {
                              const fallback = document.createElement("div");
                              fallback.className = "fallback-initial w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1D8751] flex items-center justify-center flex-shrink-0";
                              fallback.innerHTML = `<span class="text-white font-bold text-sm">${(paymentDetails?.provider?.[0] || "B").toUpperCase()}</span>`;
                              parent.insertBefore(fallback, parent.firstChild);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1D8751] flex items-center justify-center overflow-hidden text-sm sm:text-base font-bold text-white shadow-sm">
                          {(paymentDetails?.provider?.[0] || "B").toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-gray-900 dark:text-white font-medium text-sm sm:text-lg">
                          {paymentDetails?.provider}
                        </span>
                        {paymentDetails?.payment_method && (
                          <span className="text-[#788099] text-xs">
                            {paymentDetails.payment_method.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="text-gray-600 dark:text-[#A3A3C2] text-sm sm:text-base sm:mb-1 sm:w-1/4 sm:min-w-[100px]">
                        Account Name
                      </div>
                      <div className="flex items-center bg-gray-100 dark:bg-[#35353E] border border-[#1D8751] rounded-full px-4 sm:px-6 py-2 flex-1 min-w-0">
                        <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#1D8751] mr-2 sm:mr-3 inline-block flex-shrink-0"></span>
                        <span className="text-[#1D8751] font-semibold text-sm sm:text-lg truncate">
                          {paymentDetails?.account_name || "—"}
                        </span>
                        <div className="flex-1" />
                        <button
                          className="ml-2 sm:ml-3 text-[#1D8751] hover:text-[#F79330] focus:outline-none flex-shrink-0"
                          onClick={() => handleCopy(paymentDetails?.account_name || "")}
                          title="Copy Account Name"
                        >
                          <FileIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="text-gray-600 dark:text-[#A3A3C2] text-sm sm:text-base sm:mb-1 sm:w-1/4 sm:min-w-[100px]">
                        Account Number
                      </div>
                      <div className="flex items-center bg-gray-100 dark:bg-[#35353E] border border-[#1D8751] rounded-full px-4 sm:px-6 py-2 flex-1 min-w-0">
                        <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#1D8751] mr-2 sm:mr-3 inline-block flex-shrink-0"></span>
                        <span className="text-[#1D8751] font-semibold text-sm sm:text-lg truncate">
                          {paymentDetails?.account_number || "—"}
                        </span>
                        <div className="flex-1" />
                        <button
                          className="ml-2 sm:ml-3 text-[#1D8751] hover:text-[#F79330] focus:outline-none flex-shrink-0"
                          onClick={() => handleCopy(paymentDetails?.account_number || "")}
                          title="Copy Account Number"
                        >
                          <FileIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                      </div>
                    </div>
                    {paymentDetails?.wallet_address ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="text-gray-600 dark:text-[#A3A3C2] text-sm sm:text-base sm:mb-1 sm:w-1/4 sm:min-w-[100px]">
                          Wallet Address
                        </div>
                        <div className="flex items-center bg-gray-100 dark:bg-[#35353E] border border-[#1D8751] rounded-full px-4 sm:px-6 py-2 flex-1 min-w-0">
                          <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#1D8751] mr-2 sm:mr-3 inline-block flex-shrink-0"></span>
                          <span className="text-[#1D8751] font-semibold text-sm sm:text-lg truncate">
                            {paymentDetails.wallet_address}
                          </span>
                          <div className="flex-1" />
                          <button
                            className="ml-2 sm:ml-3 text-[#1D8751] hover:text-[#F79330] focus:outline-none flex-shrink-0"
                            onClick={() => handleCopy(paymentDetails.wallet_address || "")}
                            title="Copy Wallet Address"
                          >
                            <FileIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="text-[#788099] text-sm py-4">No payment methods available</div>
              )}
              {/* Buyer's name (counterparty — not the ad owner) */}
              <div className="border border-warning rounded-2xl px-3 sm:px-4 min-[900px]:px-8 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mt-2 bg-white dark:bg-[var(--card-color)]">
                <p className="text-warning font-semibold text-sm sm:text-lg sm:mr-6 shrink-0">
                  Buyer&apos;s name
                </p>
                <div className="flex items-center flex-wrap gap-2 min-w-0">
                  <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#051015] dark:bg-white flex-shrink-0"></span>
                  <span className="text-gray-900 dark:text-white font-semibold text-sm sm:text-lg break-words">
                    {counterpartyDisplayName}
                  </span>
                  <UserStatusBadge isLive={statusWsConnected} className="flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Confirm Payment Received */}
          <div className="relative pl-6 sm:pl-8">
            <div className="absolute -left-3 sm:-left-4 top-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 dark:bg-[var(--card-color)] border-2 border-[#1D8751] flex items-center justify-center text-[#1D8751] font-bold text-sm sm:text-lg">
              3
            </div>
            <span className="text-gray-900 dark:text-white font-semibold text-base sm:text-lg block pr-2">
              Confirm payment is received.
            </span>
            <div className="text-sm sm:text-base text-gray-500 dark:text-[#A3A3C2] mt-2 pr-2">
              After confirming the payment, be sure to click Payment Received
              button below
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
              {sellerPaymentPhaseActive && countdown > 0 && (
                <span className="inline-flex items-center rounded-lg px-4 sm:px-6 py-2 text-sm sm:text-base border border-gray-200 dark:border-[#35353E] bg-gray-50 dark:bg-[var(--card-color)] text-gray-500 dark:text-[#A3A3C2] w-full sm:w-auto">
                  Appeal after {formatCountdown(countdown)}
                </span>
              )}
              {(!sellerPaymentPhaseActive || countdown === 0) && (
                <button
                  onClick={() => window.location.href = "/dashboard/p2p/"}
                  className="bg-gray-100 dark:bg-[var(--card-color)] text-gray-600 dark:text-[#A3A3C2] rounded-lg px-4 sm:px-6 py-2 text-sm sm:text-base border border-gray-200 dark:border-[#35353E] w-full sm:w-auto hover:bg-gray-200 dark:hover:bg-[#404040] transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                className={`${!sellerMayMarkReceived
                  ? "bg-gray-100 dark:bg-[var(--card-color)]"
                  : "bg-[#1D8751] text-white hover:bg-[#167a45] transition-colors"
                  } dark:text-white rounded-lg px-4 sm:px-6 py-2 text-sm sm:text-base font-semibold w-full sm:w-auto ${(() => {
                    const isThisTradeLoading =
                      confirmTradeLoading &&
                      !!confirmOrder?.id &&
                      lastActionTradeIdRef.current === confirmOrder.id;
                    return isThisTradeLoading || !confirmOrder?.id || !sellerMayMarkReceived
                      ? "opacity-50 cursor-not-allowed"
                      : "";
                  })()}`}
                onClick={handleConfirmTrade}
                disabled={
                  (() => {
                    const isThisTradeLoading =
                      confirmTradeLoading &&
                      !!confirmOrder?.id &&
                      lastActionTradeIdRef.current === confirmOrder.id;
                    return (
                      isThisTradeLoading || !confirmOrder?.id || !sellerMayMarkReceived
                    );
                  })()
                }
              >
                {getButtonText()}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Chat - on mobile hidden unless Chat button clicked, opens on top */}
        <div className={`min-[900px]:col-span-1 pt-6 sm:pt-10 flex flex-col gap-4 sm:gap-6 mt-6 min-[900px]:mt-0 ${!showChat ? "hidden min-[900px]:flex" : "order-first min-[900px]:order-none flex"}`}>
          <ChatBox
            onClose={() => setShowChat(false)}
            tradeId={confirmOrder?.id || ""}
            userId={user?.id.toString() || ""}
            userName={
              confirmOrder?.advertiser_name || saveOrder?.advertiser_name || ""
            }
            autoreply={saveOrder?.auto_reply || ""}
            // Prefer photos from the trade (confirmOrder) but fall back to data already available on this page.
            seller_photo={
              confirmOrder?.seller_photo ||
              singleOrder?.advertiser_photo ||
              (saveOrder as any)?.advertiser_photo ||
              (saveOrder as any)?.seller_photo ||
              ""
            }
            buyer_photo={
              confirmOrder?.buyer_photo ||
              (saveOrder as any)?.buy_photo ||
              (saveOrder as any)?.buyer_photo ||
              ""
            }
            buyer={confirmOrder?.buyer || ""}
            seller={confirmOrder?.seller || ""}
            currentUserEmail={user?.email || ""}
            advertiserEmail={
              (singleOrder as { advertiser_email?: string })?.advertiser_email ||
              (confirmOrder as { advertiser_email?: string })?.advertiser_email ||
              (saveOrder as { advertiser_email?: string })?.advertiser_email
            }
            orderType={
              confirmOrder?.order_type ||
              singleOrder?.order_type ||
              saveOrder?.order_type ||
              orderType
            }
            owner={confirmOrder?.owner || ""}
            sellerName={
              confirmOrder?.seller_full_name?.trim() ||
              (singleOrder?.advertiser_first_name &&
                singleOrder?.advertiser_last_name
                ? `${singleOrder.advertiser_first_name} ${singleOrder.advertiser_last_name}`
                : singleOrder?.advertiser_name ||
                confirmOrder?.advertiser_name ||
                counterpartyDisplayName ||
                "Seller")
            }
            buyerName={
              confirmOrder?.buyer_full_name?.trim() ||
              (user?.email === confirmOrder?.buyer
                ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
                "You"
                : "Buyer")
            }
          />
          {/* Advertiser's Terms */}
          <section className="advertiser-terms rounded-lg p-3 sm:p-4 bg-gray-50 dark:bg-[var(--card-color)] overflow-hidden w-full">
            <div className="font-semibold text-base sm:text-lg mb-2 text-gray-900 dark:text-white flex items-center gap-1 sm:gap-2 min-w-0">
              <span className="truncate">Advertiser's Terms</span>
              <AlertCircle className="w-4 h-4 text-[#E23D3A] flex-shrink-0" />
            </div>
            <div className="text-xs sm:text-sm flex flex-col gap-2">
              <div className="text-[#1D8751] break-words overflow-wrap-anywhere whitespace-pre-wrap max-w-full">
                {saveOrder?.terms_and_conditions}
              </div>
            </div>
          </section>
        </div>

        <AppealModal
          open={showAppealModal}
          onClose={() => setShowAppealModal(false)}
          tradeId={confirmOrder?.id || ""}
        />

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[var(--card-color)] rounded-2xl p-4 sm:p-6 min-[900px]:p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-[#35353E] max-h-[90vh] overflow-y-auto">
              <div className="text-center">
                {/* Success Icon */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#1D8751] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-white"
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
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Trade Completed Successfully!
                </h2>

                {/* Trade Details */}
                <div className="bg-gray-50 dark:bg-[var(--bg-color)] rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-200 dark:border-[#35353E]">
                  <div className="flex justify-between items-center mb-2 text-sm sm:text-base">
                    <span className="text-gray-600 dark:text-[#A3A3C2]">
                      Amount Sent:
                    </span>
                    <span className="text-[#1D8751] font-semibold break-words ml-2">
                      ${formatAmount(sendAmount)} USD
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2 text-sm sm:text-base">
                    <span className="text-gray-600 dark:text-[#A3A3C2]">
                      Rate:
                    </span>
                    <span className="text-[#1D8751] font-semibold">
                      {formatCommissionRate(commissionRate)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm sm:text-base">
                    <span className="text-gray-600 dark:text-[#A3A3C2]">
                      Amount Received:
                    </span>
                    <span className="text-[#1D8751] font-semibold break-words ml-2">
                      {formatAmount(receiveAmount)} USDT
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      // Clean up the localStorage key so modal can be shown again for new trades
                      if (confirmOrder?.id) {
                        localStorage.removeItem(`success_modal_shown_${confirmOrder.id}`);
                      }
                      window.location.href = "/dashboard/p2p/";
                    }}
                    className="w-full bg-[#1D8751] text-white rounded-lg px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold hover:bg-[#167a45] transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[var(--card-color)] rounded-2xl p-4 sm:p-6 min-[900px]:p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-[#35353E] max-h-[90vh] overflow-y-auto">
              <div className="text-center">
                {/* Feedback Icon */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#1D8751] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                </div>

                {/* Feedback Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Rate Your Experience
                </h2>

                {/* Rating Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-4 sm:mb-6">
                  <button
                    onClick={() => setFeedbackRating(true)}
                    className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 ${feedbackRating === true
                      ? "bg-[#1D8751] text-white shadow-lg scale-105"
                      : "bg-gray-100 dark:bg-[#35353E] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#404040] hover:scale-105"
                      }`}
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558-.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.833 0-1.612.453-1.918 1.227z" />
                    </svg>
                    Positive
                  </button>
                  <button
                    onClick={() => setFeedbackRating(false)}
                    className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 ${feedbackRating === false
                      ? "bg-[#E23D3A] text-white shadow-lg scale-105"
                      : "bg-gray-100 dark:bg-[#35353E] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#404040] hover:scale-105"
                      }`}
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15.73 5.25h1.035A7.465 7.465 0 0118 9.375a7.465 7.465 0 01-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218C7.74 15.724 7.366 15 8.25 15h3.126c.618 0 .991.724.725 1.282A7.471 7.471 0 0012 19.5a7.471 7.471 0 00-.1-3.218c-.266-.558.107-1.282.725-1.282H12.75c-.445 0-.72-.498-.523-.898a8.963 8.963 0 01.924-3.977c0-1.708-.476-3.305-1.302-4.666-.245-.403.028-.959.5-.959H15.73zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.833 0-1.612.453-1.918 1.227z" />
                    </svg>
                    Negative
                  </button>
                </div>

                {/* Comment Input */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                    Comment (Optional)
                  </label>
                  <textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Share your experience..."
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-[#35353E] rounded-lg bg-white dark:bg-[var(--card-color)] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#1D8751] focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setShowFeedbackModal(false);
                      setFeedbackRating(null);
                      setFeedbackComment("");
                    }}
                    className="flex-1 bg-gray-100 dark:bg-[#35353E] text-gray-700 dark:text-gray-300 rounded-lg px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold hover:bg-gray-200 dark:hover:bg-[#404040] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={feedbackLoading || feedbackRating === null}
                    className="flex-1 bg-[#1D8751] text-white rounded-lg px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold hover:bg-[#167a45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {feedbackLoading ? "Submitting..." : "Submit Feedback"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinalSell;