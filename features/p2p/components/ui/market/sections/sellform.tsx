"use client";
import React, { useEffect, useState, useRef } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import CopyButton from "@/components/ui/CopyButton";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { AppDispatch } from "@/store/index";
import { TimeDisplay } from "./TimeDisplay";
import { P2POrder } from "@/features/p2p/types";
import {
  fetchSingleOrder,
  fetchConfirmOrder,
  cancelP2POrderThunk,
  completeP2PTradeThunk,
} from "@/features/p2p/slices/orderSlice";
import { submitFeedbackThunk } from "@/features/p2p/slices/feedbackSubmissionSlice";
import AppealModal from "./appeal";
import { UserStatusBadge } from "./UserStatusBadge";
import ChatBox from "./ChatBox";
import { showToast } from "@/lib/utils/toast";
import dynamic from "next/dynamic";
import { RefreshCw, Copy, MessageCircle } from "lucide-react";
import { FaChevronRight } from "react-icons/fa";
import { useTradeStatusWebSocket } from "@/features/p2p/hooks/useTradeStatusWebSocket";
import { handleCopyToClipboard, parseDurationToSeconds, formatDurationForDisplay } from "@/features/p2p/components/Common/utils";

import { logger } from '@/lib/utils/logger';

interface FinalSellProps {
  orderData?: P2POrder;
}

// Create a client-only version of the component
const FinalSellClient = dynamic(() => Promise.resolve(FinalSell), {
  ssr: false,
});

const FinalSell: React.FC<FinalSellProps> = ({ orderData }) => {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const orderDataFromUrl = searchParams?.get("orderData");
  const parsedOrderData = orderDataFromUrl ? (() => { try { return JSON.parse(orderDataFromUrl); } catch { return null; } })() : null;
  const dispatch = useDispatch<AppDispatch>();
  const { singleOrder, confirmOrder, cancelLoading, confirmTradeLoading } =
    useSelector((state: RootState) => state.p2pMarket);
  const { loading: feedbackLoading, error: feedbackError, success: feedbackSuccess } = useSelector(
    (state: RootState) => state.feedbackSubmission
  );
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<boolean | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const prevStatusRef = useRef<string | undefined>(undefined);
  const prevTradeIdRef = useRef<string | null>(null);
  const lastActionTradeIdRef = useRef<string | null>(null);
  const [copiedButton, setCopiedButton] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  // Use limit_duration from order only (e.g. "00:00:05" = 5 min) - never use trade's limit (30 min default)
  const displaySeconds = parseDurationToSeconds(singleOrder?.limit_duration);

  const [countdown, setCountdown] = useState(displaySeconds);
  const initialFetchDone = useRef(false);

  // WebSocket status update callback - use useCallback to prevent reconnections
  const handleStatusUpdate = React.useCallback((status: any) => {
    logger.debug('p2p', "🔔 Trade status update received in sellform:", status);
    logger.debug('p2p', "📊 Current confirmOrder:", confirmOrder);
    logger.debug('p2p', "📊 Current confirmOrder.id:", confirmOrder?.id);
    logger.debug('p2p', "📊 Current confirmOrder.status:", confirmOrder?.status);
    logger.debug('p2p', "📊 New status:", status.status);

    const oldStatus = confirmOrder?.status;
    const newStatus = status.status;

    // Always refresh if we have a valid status update
    if (confirmOrder?.id && newStatus) {
      logger.debug('p2p', "✅ Conditions met - will update UI");

      // Show toast notification for status changes
      if (oldStatus !== newStatus) {
        logger.debug('p2p', `📢 Status changed: ${oldStatus} → ${newStatus}`);
        if (oldStatus === "matched" && newStatus === "half-matched") {
        } else if (oldStatus === "half-matched" && newStatus === "completed") {
        } else if (newStatus === "cancelled") {
          showToast.error("Trade Cancelled", "The trade has been cancelled");
        } else {
        }
      } else {
        logger.debug('p2p', "ℹ️ Status unchanged, still refreshing data");
      }

      logger.debug('p2p', "🔄 Refreshing trade data for ID:", confirmOrder.id);
      dispatch(fetchConfirmOrder(confirmOrder.id))
        .unwrap()
        .then((updatedOrder) => {
          logger.debug('p2p', "✅ fetchConfirmOrder SUCCESS:", updatedOrder);
          logger.debug('p2p', "✅ Updated status:", updatedOrder?.status);
        })
        .catch((error) => {
          console.error("❌ fetchConfirmOrder FAILED:", error);
        });
    } else {
      console.warn("❌ Conditions NOT met:", {
        hasConfirmOrderId: !!confirmOrder?.id,
        hasNewStatus: !!newStatus,
        confirmOrderId: confirmOrder?.id,
        newStatus: newStatus
      });
    }
  }, [confirmOrder, dispatch]);

  // WebSocket for real-time trade status updates
  logger.debug('p2p', "🔌 WebSocket Config (sellform):", {
    tradeId: confirmOrder?.id,
    enabled: isAuthenticated && !!confirmOrder?.id,
    isAuthenticated,
    hasConfirmOrder: !!confirmOrder,
    confirmOrderId: confirmOrder?.id,
    paramsId: params?.id
  });

  const { isConnected: statusWsConnected } = useTradeStatusWebSocket({
    tradeId: confirmOrder?.id || "",
    enabled: isAuthenticated && !!confirmOrder?.id,
    onStatusUpdate: handleStatusUpdate,
  });

  // Debug useEffect to monitor confirmOrder changes
  useEffect(() => {
    logger.debug('p2p', "🔍 confirmOrder CHANGED:", {
      id: confirmOrder?.id,
      status: confirmOrder?.status,
      amount: confirmOrder?.amount,
      fullObject: confirmOrder
    });
  }, [confirmOrder]);


  // Handle initial data fetch
  useEffect(() => {
    if (initialFetchDone.current) return;

    // Use trade_id from localStorage first, then fallback to params
    const tradeIdFromStorage = localStorage.getItem('p2p_trade_id');
    const orderId = tradeIdFromStorage || params?.id as string;

    logger.debug('p2p', "🔍 sellform.tsx useEffect:", {
      orderId,
      tradeIdFromStorage,
      paramsId: params?.id,
      localStorageKeys: Object.keys(localStorage).filter(key => key.includes('p2p'))
    });

    if (isAuthenticated && orderId) {
      dispatch(fetchConfirmOrder(orderId))
        .unwrap()
        .then(() => {
          initialFetchDone.current = true;
        })
        .catch((error) => {
          showToast.error(
            "Failed to fetch order",
            error.message || "Please try again"
          );
        });
    }
  }, [params?.id, dispatch, isAuthenticated]);

  // Fetch single order only when the order id changes (not on every confirmOrder ref from WebSocket refresh)
  const orderIdToFetch = confirmOrder?.buy_order ?? confirmOrder?.sell_order;
  useEffect(() => {
    if (orderIdToFetch) {
      dispatch(fetchSingleOrder(String(orderIdToFetch)))
        .unwrap()
        .catch((error) => {
          showToast.error(
            "Failed to fetch order details",
            error.message || "Please try again"
          );
        });
    }
  }, [orderIdToFetch, dispatch]);

  // Reset modal and previous status when switching to a different trade
  useEffect(() => {
    if (confirmOrder?.id !== prevTradeIdRef.current) {
      setShowSuccessModal(false);
      prevTradeIdRef.current = confirmOrder?.id || null;
      prevStatusRef.current = undefined;
      // Reset lastActionTradeIdRef when viewing a different trade
      // This prevents showing loading state for actions on different trades
      lastActionTradeIdRef.current = null;
    } else if (confirmOrder?.id && !prevTradeIdRef.current) {
      // Reset on initial load when confirmOrder is first set
      lastActionTradeIdRef.current = null;
    }
  }, [confirmOrder?.id]);

  // Show success modal only on transition to completed for the current trade
  useEffect(() => {
    const currentId = confirmOrder?.id || "";
    const newStatus = confirmOrder?.status;
    const prevStatus = prevStatusRef.current;
    const paramId = (params?.id as string) || localStorage.getItem('p2p_trade_id') || "";

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
        localStorage.setItem(modalShownKey, 'true');
      }
    }

    prevStatusRef.current = newStatus;
  }, [confirmOrder?.status, confirmOrder?.id, params?.id]);

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

  // Handle countdown
  useEffect(() => {
    if (confirmOrder?.status === "matched") {
      setCountdown(displaySeconds);
    }
  }, [displaySeconds, confirmOrder?.status]);

  useEffect(() => {
    if (confirmOrder?.status !== "matched") return;
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [confirmOrder?.status, countdown]);

  // Auto-cancel when countdown reaches 0 - DISABLED
  useEffect(() => {
    if (confirmOrder?.status === "matched" && countdown === 0) {
      handleCancelTransaction();
      logger.debug('p2p', "Countdown reached 0, auto-cancel is disabled");
      return;
    }
  }, [
    confirmOrder?.status,
    countdown,
    confirmOrder?.id,
    dispatch,
    isAuthenticated,
  ]);

  // Reset countdown when status changes
  useEffect(() => {
    if (confirmOrder?.status !== "matched") {
      setCountdown(displaySeconds);
    }
  }, [confirmOrder?.status, displaySeconds]);

  // Use payment_details from singleOrder, confirmOrder, or URL - prefer source with most methods
  const fromSingle = Array.isArray(singleOrder?.payment_details) ? singleOrder.payment_details : [];
  const fromConfirm = Array.isArray(confirmOrder?.payment_details) ? confirmOrder.payment_details : [];
  const fromUrl = Array.isArray(parsedOrderData?.payment_details) ? parsedOrderData.payment_details : [];
  const paymentDetailsList = fromSingle.length > 0 ? fromSingle : fromConfirm.length > 0 ? fromConfirm : fromUrl;
  // Range currency (KES or USD) for display - from order/trade/URL
  const rangeCurrency = ((singleOrder as any)?.range_currency || (confirmOrder as any)?.buy_order?.range_currency || (confirmOrder as any)?.sell_order?.range_currency || parsedOrderData?.range_currency || "USD")?.toString().toUpperCase();
  const rangeSuffix = rangeCurrency === "KES" ? "KES" : "USD";
  const rangeSymbol = rangeCurrency === "KES" ? "KES" : "$";
  const sendAmount = Number(confirmOrder?.amount) || 0;
  const commissionRate = Number(singleOrder?.commission_rate) || 0;
  const orderType = singleOrder?.order_type || "buy";
  let receiveAmount = sendAmount;

  if (orderType === "buy") {
    receiveAmount = sendAmount * commissionRate;
  } else {
    receiveAmount = sendAmount / commissionRate;
  }

  const formatAmount = (amt: number) =>
    amt.toLocaleString(undefined, { maximumFractionDigits: 6 });

  // Format commission rate for display (e.g. 1.00 shows as "1.00", not "1")
  const formatCommissionRate = (rate: number) =>
    Number(rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleCancelTransaction = () => {
    if (isAuthenticated && confirmOrder?.id) {
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
          showToast.error(
            "Failed to cancel transaction",
            error.message || "Please try again"
          );
        });
    }
  };

  const handleConfirmTrade = () => {
    if (isAuthenticated && confirmOrder?.id) {
      lastActionTradeIdRef.current = confirmOrder.id;
      dispatch(completeP2PTradeThunk(confirmOrder.id))
        .unwrap()
        .then(() => {
          showToast.success("Money Sent successfully!");
          dispatch(fetchConfirmOrder(confirmOrder.id));
          setTimeout(() => {
            router.push("/dashboard/p2p");
          }, 2000);
        })
        .catch((error) => {
          showToast.error(
            "Failed to complete trade",
            error.message || "Please try again"
          );
        });
    }
  };

  const handleRefresh = () => {
    // Use trade_id from localStorage first, then fallback to params
    const tradeIdFromStorage = localStorage.getItem('p2p_trade_id');
    const orderId = tradeIdFromStorage || params?.id as string;
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
      <div className="final-buy-container grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-6 p-1 sm:p-2 lg:p-6 min-h-screen bg-[#EEF1F4] dark:bg-(--bg-color)">
        <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-900 dark:text-white text-[13px]">
              Advertiser Information
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowChat((prev) => !prev)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D8751] text-white text-xs font-medium hover:bg-[#166b3e] transition-colors"
                aria-label={showChat ? "Close chat" : "Open chat"}
              >
                <MessageCircle className="w-4 h-4" />
                {showChat ? "Close Chat" : "Chat"}
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1 bg-gray-100 dark:bg-[var(--card-color)] text-[#1D8751] rounded-lg px-2 py-1 border border-gray-200 dark:border-[#35353E] hover:bg-gray-200 dark:hover:bg-[#35353E] transition-colors"
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* Advertiser Info - Image, Name, Live, Time in one row */}
          <section className="advertiser-info rounded-[18px] p-2 md:p-4 flex flex-col md:flex-row items-start md:items-center gap-4 border-2 border-gray-200 dark:border-[#35353E] bg-gray-50 dark:bg-[var(--card-color)]">
            <div className="flex flex-col justify-start gap-2 flex-1 min-w-0 w-full">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="icon rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center overflow-hidden bg-[#1D8751] text-white">
                  {(confirmOrder?.seller_photo || singleOrder?.advertiser_photo || (singleOrder as any)?.seller_photo) ? (
                    <img
                      src={confirmOrder?.seller_photo || singleOrder?.advertiser_photo || (singleOrder as any)?.seller_photo || ""}
                      alt={singleOrder?.advertiser_name || "Advertiser"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector(".avatar-fallback")) {
                          const fallback = document.createElement("span");
                          fallback.className = "avatar-fallback text-[#1D8751] font-bold text-lg";
                          fallback.textContent = (
                            singleOrder?.advertiser_first_name?.[0] ||
                            singleOrder?.advertiser_name?.[0] ||
                            "A"
                          ).toUpperCase();
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <span className="text-[#1D8751] font-bold text-lg">
                      {(singleOrder?.advertiser_first_name?.[0] ||
                        singleOrder?.advertiser_name?.[0] ||
                        "A"
                      ).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-gray-900 dark:text-white text-sm font-medium truncate min-w-0">
                  {singleOrder?.advertiser_first_name && singleOrder?.advertiser_last_name
                    ? `${singleOrder.advertiser_first_name} ${singleOrder.advertiser_last_name}`
                    : singleOrder?.advertiser_name || "Advertiser"}
                </span>
                <UserStatusBadge isLive={statusWsConnected} className="flex-shrink-0" />
                <span className="text-[10px] text-[#1D8751] flex items-center gap-1 flex-shrink-0">
                  Transaction time:{" "}
                  {isAuthenticated ? (
                    <TimeDisplay
                      seconds={confirmOrder?.status === "matched" ? countdown : displaySeconds}
                    />
                  ) : (
                    <span>--:--</span>
                  )}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-[#788099]">
                {singleOrder?.user_total_buy_orders || 120} Orders |{" "}
                {singleOrder?.completion_rate || "99.20"}% Completion
              </div>
              Rating: 99% | Commission: {singleOrder?.commission_rate || "0.5"}
            </div>
            <div className="w-full md:w-auto flex flex-wrap md:flex-nowrap gap-4 md:gap-8 text-xs md:ml-auto flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-200 dark:border-[#35353E]">
              <div>
                <span className="text-[13px] text-gray-900 dark:text-white">
                  {formatDurationForDisplay(singleOrder?.limit_duration) || "10 Minutes"}
                </span>
                <br />
                <span className="text-gray-500 dark:text-[#788099]">
                  Time limit
                </span>
              </div>
              <div>
                <span className="text-[13px] text-gray-900 dark:text-white">
                  {formatDurationForDisplay(singleOrder?.completion_time) || formatDurationForDisplay(confirmOrder?.completion_time) || "2 Minutes"}
                </span>
                <br />
                <span className="text-gray-500 dark:text-[#788099]">
                  Avg. real-time
                </span>
              </div>
              <div>
                <span className="text-[13px] text-gray-900 dark:text-white">
                  {singleOrder?.amount || "1,200"}{" "}
                  {singleOrder?.currency || "USDT"}
                </span>
                <br />
                <span className="text-gray-500 dark:text-[#788099]">
                  Available assets
                </span>
              </div>
            </div>
          </section>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div className="text-[13px] text-base text-gray-900 dark:text-white">
              Order Info
            </div>
            <div className="text-xs text-gray-500 dark:text-[#788099] text-[0.75rem] flex items-center gap-2">
              Order Number:{" "}
              <div className="flex items-center gap-1">
                <button
                  className="underline text-[#1D8751] cursor-pointer bg-transparent border-none p-0"
                  aria-label="Copy order number"
                >
                  {confirmOrder?.id || "9346457687345"}
                </button>
                <CopyButton
                  value={confirmOrder?.id || singleOrder?.id || "9346457687345"}
                  className="text-[#1D8751]"
                  showIcon={true}
                />
              </div>
            </div>
          </div>

          <section className="order-info rounded-[18px] p-2 md:p-4 border-2 border-gray-200 dark:border-[#35353E] bg-gray-50 dark:bg-[var(--card-color)]">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Sell: I want to Send = USDT, I want to Receive = fiat (KES/USD) */}
              <div className="flex-1 flex flex-col mb-2 md:mb-0">
                <div className="mb-1 text-gray-600 dark:text-[#788099] text-[0.95rem] font-medium">
                  I want to Send
                </div>
                <div className="flex items-center h-[46px] rounded-2xl border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] px-2">
                  <span className="text-[#1D8751] text-2xl mr-2">
                    <img src="/images/tether.svg" alt="USDT" className="w-6 h-6" />
                  </span>
                  <span className="text-[#1D8751] text-xl font-semibold">
                    {formatAmount(sendAmount)}
                  </span>
                  <span className="ml-auto text-gray-900 dark:text-white text-base font-medium">
                    USDT
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col mb-2 md:mb-0">
                <div className="mb-1 text-gray-600 dark:text-[#788099] text-[0.95rem] font-medium">
                  I want to Receive
                </div>
                <div className="flex items-center h-[46px] rounded-2xl border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] px-2">
                  <span className="text-[#1D8751] text-2xl mr-2">{rangeSymbol}</span>
                  <span className="text-[#1D8751] text-xl font-semibold">
                    {formatAmount(Math.round(Number(sendAmount) * Number(commissionRate) * 100) / 100)}
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white text-base font-medium">
                    {rangeSuffix}
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="mb-1 text-gray-600 dark:text-[#788099] text-[0.95rem] font-medium">
                  Rate
                </div>
                <div className="flex items-center h-[46px] rounded-2xl border border-gray-200 dark:border-[#35353E] bg-gray-100 dark:bg-[#35353E] px-2">
                  <span className="text-[#1D8751] text-2xl mr-2">{rangeSymbol}</span>
                  {commissionRate}
                  <span className="ml-auto text-gray-900 dark:text-white text-base font-medium">
                    {rangeSuffix}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="send-money rounded-[18px] p-2 md:p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2 md:gap-0">
              <div className="text-[13px] flex-1 text-gray-900 dark:text-white">
                You will receive money to this account below:
              </div>
              <div className="text-xs flex items-center gap-1">
                <span className="text-[#1D8751]">Transaction time:</span>
                {isAuthenticated ? (
                  <TimeDisplay
                    seconds={confirmOrder?.status === "matched" ? countdown : displaySeconds}
                  />
                ) : (
                  <span>--:--</span>
                )}
              </div>
            </div>

            <div className="rounded-[18px] flex flex-col p-2 md:p-4 gap-4 bg-gray-50 dark:bg-[var(--card-color)]">
              <div className="flex flex-col gap-4">
                {paymentDetailsList.length > 0 ? (
                  paymentDetailsList.map((paymentDetails: { id?: number; provider?: string; payment_method?: string; account_name?: string; account_number?: string; provider_logo?: string; logo?: string; logo_url?: string }) => (
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
                            <div className="flex flex-col sm:flex-row w-full items-stretch sm:items-center gap-2 sm:gap-3">
                              <div className="w-full flex flex-col min-w-0">
                                <span className="text-[#788099] text-xs md:text-sm mb-2">Account Name</span>
                                <span className="flex-1 min-w-0 px-3 md:px-4 py-2 rounded-full border border-[#1D8751] text-[#1D8751] bg-transparent font-semibold text-sm md:text-base flex items-center truncate">
                                  <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#1D8751] inline-block mr-2 shrink-0"></span>
                                  <span className="truncate">{paymentDetails?.account_name}</span>
                                </span>
                              </div>
                              <button
                                className="w-full sm:w-auto px-3 md:px-4 py-2 rounded-full border border-gray-200 dark:border-accent text-[#1D8751] bg-gray-100 dark:bg-(--card-color) font-semibold text-sm flex items-center justify-center gap-1.5 shrink-0"
                                onClick={() =>
                                  handleCopyToClipboard(paymentDetails?.account_name || "", `account-name-${paymentDetails?.id}`, setCopiedButton)
                                }
                              >
                                {copiedButton === `account-name-${paymentDetails?.id}` ? "Copied!" : "Copy"}
                                <Copy className="w-2 h-2 md:w-3 md:h-3" />
                              </button>
                            </div>
                            <div className="flex flex-col sm:flex-row w-full items-stretch sm:items-center gap-2 sm:gap-3">
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

                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <div className="rounded-2xl border border-[#1D8751] bg-gray-50 dark:bg-(--bg-color) p-4 md:p-6 mt-2 text-base flex flex-col gap-2">
                      <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                        <span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block shrink-0"></span>
                        Please send the money from your own account Only
                      </div>
                      <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                        <span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block shrink-0"></span>
                        Put transaction ID in the description field of the bank
                      </div>
                      <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                        <span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block shrink-0 "></span>
                        Please note, If you do not follow above conditions, we
                        will reject your transaction and send you back your money.
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    {/* {(confirmOrder?.status !== "matched" || countdown === 0) && (
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
                    )} */}
                    <div className="flex flex-col md:flex-row gap-4 mt-4">
                      <button
                        className={`w-full md:w-auto flex-1 py-2 rounded-2xl border-2 border-gray-200 dark:border-[#3C3C47] text-lg ${confirmOrder?.status === "half-matched"
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
                        className={`w-full md:w-auto flex-1 py-2 rounded-2xl text-lg ${confirmOrder?.status === "matched"
                          ? "bg-gray-100 dark:bg-[var(--card-color)] text-gray-400 dark:text-[#888]"
                          : "bg-[#F79330] text-white"
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
                              confirmOrder?.status === "matched"
                            );
                          })()
                        }
                      >
                        {(() => {
                          const isThisTradeLoading =
                            confirmTradeLoading &&
                            !!confirmOrder?.id &&
                            lastActionTradeIdRef.current === confirmOrder.id;
                          return isThisTradeLoading ? "Notifying seller..." : "Payments Received";
                        })()}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className={`lg:col-span-1 pt-4 lg:pt-10 flex flex-col gap-4 lg:gap-6 mt-4 lg:mt-0 ${!showChat ? "hidden lg:flex" : "order-first lg:order-none flex"}`}>
          <ChatBox
            onClose={() => setShowChat(false)}
            tradeId={confirmOrder?.id || ""}
            userId={user?.id.toString() || ""}
            userName={
              singleOrder?.advertiser_first_name && singleOrder?.advertiser_last_name
                ? `${singleOrder.advertiser_first_name} ${singleOrder.advertiser_last_name}`
                : singleOrder?.advertiser_name || ""
            }
            autoreply={singleOrder?.auto_reply || ""}
            // Prefer photos from the trade (confirmOrder) but fall back to data already available on this page.
            seller_photo={confirmOrder?.seller_photo || singleOrder?.advertiser_photo || ""}
            buyer_photo={
              confirmOrder?.buyer_photo ||
              (singleOrder as any)?.buy_photo ||
              (singleOrder as any)?.buyer_photo ||
              ""
            }
            buyer={confirmOrder?.buyer || ""}
            seller={confirmOrder?.seller || ""}
            currentUserEmail={user?.email || ""}
            advertiserEmail={
              (singleOrder as { advertiser_email?: string })?.advertiser_email ||
              (confirmOrder as { advertiser_email?: string })?.advertiser_email
            }
            owner={confirmOrder?.owner || ""}
            sellerName={
              singleOrder?.advertiser_first_name && singleOrder?.advertiser_last_name
                ? `${singleOrder.advertiser_first_name} ${singleOrder.advertiser_last_name}`
                : singleOrder?.advertiser_name || confirmOrder?.advertiser_name || "Seller"
            }
            buyerName={user?.email === confirmOrder?.buyer ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "You" : "Buyer"}
          />

          <section className="advertiser-terms rounded-lg p-4 bg-gray-50 dark:bg-[var(--card-color)]">
            <div className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
              Advertiser's Terms <span className="text-[#E23D3A]">⦿</span>
            </div>
            <div className="text-xs flex flex-col gap-2">
              <div className="text-[#1D8751]">
                {singleOrder?.terms_and_conditions || ""}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[var(--card-color)] rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-[#35353E]">
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Trade Completed Successfully!
                </h2>

                {/* Trade Details */}
                <div className="bg-gray-50 dark:bg-[var(--bg-color)] rounded-xl p-4 mb-6 border border-gray-200 dark:border-[#35353E]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 dark:text-[#A3A3C2]">
                      Amount Sent:
                    </span>
                    <span className="text-[#F79330] font-semibold">
                      ${formatAmount(sendAmount)} USD
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 dark:text-[#A3A3C2]">
                      Commission:
                    </span>
                    {formatCommissionRate(commissionRate)}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-[#A3A3C2]">
                      Amount Received:
                    </span>
                    <span className="text-[#1D8751] font-semibold">
                      {formatAmount(receiveAmount)} USDT
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setShowFeedbackModal(true)}
                    className="w-full bg-[#F79330] text-white rounded-lg px-6 py-3 font-semibold hover:bg-[#e6821a] transition-colors"
                  >
                    Provide Feedback
                  </button>
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      // Clean up the localStorage key so modal can be shown again for new trades
                      if (confirmOrder?.id) {
                        localStorage.removeItem(`success_modal_shown_${confirmOrder.id}`);
                      }
                      // router.push("/dashboard");
                      window.location.href = "/dashboard/p2p/";
                    }}
                    className="w-full bg-[#1D8751] text-white rounded-lg px-6 py-3 font-semibold hover:bg-[#167a45] transition-colors"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[var(--card-color)] rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-[#35353E]">
              <div className="text-center">
                {/* Feedback Icon */}
                <div className="w-16 h-16 bg-[#F79330] rounded-full flex items-center justify-center mx-auto mb-6">
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
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                </div>

                {/* Feedback Title */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Rate Your Experience
                </h2>

                {/* Rating Buttons */}
                <div className="flex gap-4 justify-center mb-6">
                  <button
                    onClick={() => setFeedbackRating(true)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${feedbackRating === true
                      ? "bg-[#1D8751] text-white shadow-lg scale-105"
                      : "bg-gray-100 dark:bg-[#35353E] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#404040] hover:scale-105"
                      }`}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558-.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.833 0-1.612.453-1.918 1.227z" />
                    </svg>
                    Positive
                  </button>
                  <button
                    onClick={() => setFeedbackRating(false)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${feedbackRating === false
                      ? "bg-[#E23D3A] text-white shadow-lg scale-105"
                      : "bg-gray-100 dark:bg-[#35353E] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#404040] hover:scale-105"
                      }`}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15.73 5.25h1.035A7.465 7.465 0 0118 9.375a7.465 7.465 0 01-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218C7.74 15.724 7.366 15 8.25 15h3.126c.618 0 .991.724.725 1.282A7.471 7.471 0 0012 19.5a7.471 7.471 0 00-.1-3.218c-.266-.558.107-1.282.725-1.282H12.75c-.445 0-.72-.498-.523-.898a8.963 8.963 0 01.924-3.977c0-1.708-.476-3.305-1.302-4.666-.245-.403.028-.959.5-.959H15.73zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.833 0-1.612.453-1.918 1.227z" />
                    </svg>
                    Negative
                  </button>
                </div>

                {/* Comment Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                    Comment (Optional)
                  </label>
                  <textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Share your experience..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-[#35353E] rounded-lg bg-white dark:bg-[var(--bg-color)] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#1D8751] focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowFeedbackModal(false);
                      setFeedbackRating(null);
                      setFeedbackComment("");
                    }}
                    className="flex-1 bg-gray-100 dark:bg-[#35353E] text-gray-700 dark:text-gray-300 rounded-lg px-6 py-3 font-semibold hover:bg-gray-200 dark:hover:bg-[#404040] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={feedbackLoading || feedbackRating === null}
                    className="flex-1 bg-[#1D8751] text-white rounded-lg px-6 py-3 font-semibold hover:bg-[#167a45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

// Export the client-only version
export default FinalSellClient;
