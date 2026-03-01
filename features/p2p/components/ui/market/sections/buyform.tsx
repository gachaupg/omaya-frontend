"use client";
import React, { useEffect, useState, useRef } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { P2POrder } from "@/features/p2p/types";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { AppDispatch } from "@/store/index";
import { TimeDisplay } from "./TimeDisplay";
import {
  fetchSingleOrder,
  fetchConfirmOrder,
  cancelP2POrderThunk,
  confirmP2PTradeThunk,
} from "@/features/p2p/slices/orderSlice";
import { submitFeedbackThunk } from "@/features/p2p/slices/feedbackSubmissionSlice";
import AppealModal from "./appeal";
import { UserStatusBadge } from "./UserStatusBadge";
import ChatBox from "./ChatBox";
import { showToast } from "@/lib/utils/toast";
import { AlertCircle, ChevronRight, RefreshCw, CheckCircle2, MessageCircle } from "lucide-react";
import CopyButton from "@/components/ui/CopyButton";
import { FaChevronRight } from "react-icons/fa";
import { Dialog } from "@headlessui/react";
import { useTradeStatusWebSocket } from "@/features/p2p/hooks/useTradeStatusWebSocket";

import { logger } from '@/lib/utils/logger';
import { parseDurationToSeconds, formatDurationForDisplay } from "@/features/p2p/components/Common/utils";

interface FinalBuyProps {
  orderData?: P2POrder;
}

function FinalBuy({ orderData }: FinalBuyProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const {
    singleOrder,
    confirmOrder,
    cancelLoading,
    confirmTradeLoading,
    confirmOrderError,
    singleOrderError,
  } = useSelector((state: RootState) => state.p2pMarket);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showMoneySentModal, setShowMoneySentModal] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const prevStatusRef = useRef<string | undefined>(undefined);
  const prevTradeIdRef = useRef<string | null>(null);
  const lastActionTradeIdRef = useRef<string | null>(null);
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const [showCancelMsg, setShowCancelMsg] = useState(false);
  const [copiedButton, setCopiedButton] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<boolean | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const router = useRouter();

  const { loading: feedbackLoading } = useSelector(
    (state: RootState) => state.feedbackSubmission
  );

  // WebSocket status update callback - use useCallback to prevent reconnections
  const handleStatusUpdate = React.useCallback((status: any) => {
    logger.debug('p2p', "🔔 Trade status update received in buyform:", status);
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
  const { isConnected: statusWsConnected } = useTradeStatusWebSocket({
    tradeId: confirmOrder?.id || "",
    enabled: isAuthenticated && !!confirmOrder?.id,
    onStatusUpdate: handleStatusUpdate,
  });

  // Extract commission from URLSearchParams
  const orderDataFromUrl = searchParams?.get("orderData");
  const parsedOrderData = orderDataFromUrl ? JSON.parse(orderDataFromUrl) : null;
  const commissionFromUrl = parsedOrderData?.commission;

  // Use limit_duration from order only (e.g. "00:00:05" = 5 min) - never use trade's limit (30 min default)
  const displaySeconds = parseDurationToSeconds(singleOrder?.limit_duration);
  // Remove this line - we'll get tradeId from localStorage inside useEffect
  // Local countdown state for auto-cancel logic
  const [countdown, setCountdown] = useState(displaySeconds);
  const prevStatus = useRef(confirmOrder?.status);

  // Sync countdown ONLY when status becomes 'matched'
  useEffect(() => {
    if (confirmOrder?.status === "matched") {
      setCountdown(displaySeconds);
    }
    // Do not reset countdown if status is not matched
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displaySeconds, confirmOrder?.status]);

  // Countdown effect
  useEffect(() => {
    if (confirmOrder?.status !== "matched") return;
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // When countdown reaches 0, auto-cancel the transaction
          logger.debug('p2p', "Countdown reached 0, auto-cancelling transaction");
          handleCancelTransaction();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [confirmOrder?.status, countdown]);

  useEffect(() => {
    // Use trade_id from localStorage first, then fallback to params
    const tradeIdFromStorage = localStorage.getItem('p2p_trade_id');
    const orderId = tradeIdFromStorage || params?.id as string;

    logger.debug('p2p', "🔍 DEBUG - useEffect:", {
      orderId,
      tradeIdFromStorage,
      paramsId: params?.id,
      localStorageKeys: Object.keys(localStorage).filter(key => key.includes('p2p')),
      allLocalStorage: { ...localStorage }
    });

    if (isAuthenticated && orderId) {


      dispatch(fetchConfirmOrder(orderId))
        .unwrap()
        .then((result) => {
          logger.debug('p2p', "✅ Fetch confirm order success:", result);
        })
        .catch((error) => {
          console.error("❌ Fetch confirm order error:", error);
        });
    } else {
      logger.debug('p2p', "⚠️ Not fetching - missing auth or orderId:", { isAuthenticated, orderId });
    }
  }, [params?.id, dispatch, isAuthenticated]);

  // Separate useEffect for fetching singleOrder when confirmOrder is available
  useEffect(() => {
    const orderToFetch = confirmOrder?.buy_order || confirmOrder?.sell_order;

    logger.debug('p2p', "SingleOrder useEffect:", {
      orderToFetch,
      confirmOrder,
      singleOrder,
      confirmOrderId: confirmOrder?.id,
    });

    if (isAuthenticated && orderToFetch && !singleOrder?.id) {
      logger.debug('p2p', "Fetching single order:", orderToFetch);
      dispatch(fetchSingleOrder(orderToFetch.toString()));
    }
  }, [confirmOrder, isAuthenticated, singleOrder?.id, dispatch]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset countdown to displaySeconds when status is not 'matched'
  useEffect(() => {
    if (confirmOrder?.status !== "matched") {
      setCountdown(displaySeconds);
    }
  }, [confirmOrder?.status, displaySeconds]);

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
    const newStatus = confirmOrder?.status as string | undefined;
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

  // Use payment_details from singleOrder (order API), confirmOrder (trade API), or URL - prefer source with most methods
  const fromSingle = Array.isArray(singleOrder?.payment_details) ? singleOrder.payment_details : [];
  const fromConfirm = Array.isArray(confirmOrder?.payment_details) ? confirmOrder.payment_details : [];
  const fromUrl = Array.isArray(parsedOrderData?.payment_details) ? parsedOrderData.payment_details : [];
  const paymentDetailsList = fromSingle.length > 0 ? fromSingle : fromConfirm.length > 0 ? fromConfirm : fromUrl;
  // Range currency (KES or USD) for display - from order/trade/URL
  const rangeCurrency = ((singleOrder as any)?.range_currency || (confirmOrder as any)?.buy_order?.range_currency || (confirmOrder as any)?.sell_order?.range_currency || parsedOrderData?.range_currency || "USD")?.toString().toUpperCase();
  const rangeSuffix = rangeCurrency === "KES" ? "KES" : "USD";
  const rangeSymbol = rangeCurrency === "KES" ? "KES" : "$";
  // --- Calculation logic ---
  const sendAmount = Number(confirmOrder?.amount) || 0;
  const commissionRate = Number(singleOrder?.commission_rate) || Number(commissionFromUrl) || 0;
  const orderType = singleOrder?.order_type || "buy";
  let receiveAmount = sendAmount;

  if (orderType === "buy") {
    // For buy orders, multiply by commission rate (assuming rate is in decimal form, e.g., 0.98 for 98%)
    receiveAmount = commissionRate > 0 ? sendAmount / commissionRate : sendAmount;
  } else {
    // For sell orders, divide by commission rate
    receiveAmount = commissionRate > 0 ? sendAmount * commissionRate : sendAmount;
  }

  // Format numbers
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
          setShowCancelMsg(true);
          setTimeout(() => {
            router.push("/dashboard/p2p");
          }, 2000);
        })
        .catch((error) => {
          showToast.error(
            "Failed to cancel transaction",
            error.message || "Please try again"
          );
        });
    }
  };

  // Add handler for confirming trade
  const handleConfirmTrade = () => {
    if (isAuthenticated && confirmOrder?.id) {
      lastActionTradeIdRef.current = confirmOrder.id;
      dispatch(confirmP2PTradeThunk(confirmOrder.id))
        .unwrap()
        .then(() => {
          setShowMoneySentModal(true);
          // Refresh confirm order after successful trade
          dispatch(fetchConfirmOrder(confirmOrder.id));
        })
        .catch((error) => {
          showToast.error(
            "Failed to confirm trade",
            error.message || "Please try again"
          );
        });
    }
  };

  const handleFeedbackSubmit = () => {
    if (feedbackRating === null) {
      showToast.error("Please select a rating", "Choose positive or negative feedback");
      return;
    }
    if (confirmOrder?.id) {
      dispatch(submitFeedbackThunk({
        trade_id: String(confirmOrder.id),
        is_positive: feedbackRating,
        comment: feedbackComment,
      }))
        .unwrap()
        .then(() => {
          showToast.success("Feedback submitted successfully!", "Thank you for your feedback");
          setShowFeedbackModal(false);
          setFeedbackRating(null);
          setFeedbackComment("");
          setTimeout(() => {
            window.location.href = "/dashboard/p2p/";
          }, 1500);
        })
        .catch((error) => {
          showToast.error("Failed to submit feedback", error.message || "Please try again");
        });
    }
  };

  const handleRefresh = () => {
    const orderId = params?.id as string;
    if (orderId) {
      dispatch(fetchConfirmOrder(orderId));
    }
  };

  // Custom copy handler that shows "Copied" in button
  const handleCopyToClipboard = (value: string | undefined, buttonId: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedButton(buttonId);
    setTimeout(() => setCopiedButton(null), 2000);
  };

  const content = (
    <div className="md:mt-20">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Notification center", href: "/dashboard/notifications" },
          { label: "View order" },
        ]}
        className="mt-1"
      />
      <div className="final-buy-container grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6 p-1 sm:p-2 lg:p-6 min-h-screen bg-[#EEF1F4] dark:bg-[var(--bg-color)]">
        {/* Left Column: Main Info */}
        <div className="lg:col-span-2 flex flex-col mt-2 gap-1">
          {confirmOrderError && (
            <div className="text-red-500 text-[13px] mb-2">
              {confirmOrderError}
            </div>
          )}
          {singleOrderError && (
            <div className="text-red-500 text-[13px] mb-2">
              {singleOrderError}
            </div>
          )}
          <div className="flex items-center justify-between mb-2">
            <p
              className="text-gray-900 dark:text-white text-[13px]"
              style={{ fontSize: "16px" }}
            >
              Advertiser Info
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
                className="flex items-center gap-1 bg-white dark:bg-[var(--bg-color)] text-[#1D8751] rounded-lg px-2 py-1 border border-[#E8EFF5] dark:border-[#35353E] hover:bg-gray-200 dark:hover:bg-[#35353E] transition-colors"
                title="Refresh"
              >
              </button>
            </div>
          </div>
          {/* Advertiser Info - Image, Name, Live, Time in one row */}
          <section className="rounded-[18px] p-4 flex flex-col md:flex-row md:items-center gap-4 border-2 border-[#E8EFF5] dark:border-[#35353E] bg-gray-50 dark:bg-[var(--bg-color)] mb-2">
            <div className="flex flex-col justify-start gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="icon rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center overflow-hidden bg-[#1D8751] text-white">
                  {(confirmOrder?.seller_photo || singleOrder?.advertiser_photo || (singleOrder as any)?.seller_photo) ? (
                    <img
                      className="w-full h-full object-cover"
                      src={confirmOrder?.seller_photo || singleOrder?.advertiser_photo || (singleOrder as any)?.seller_photo || ""}
                      alt=""
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector(".avatar-fallback")) {
                          const fallback = document.createElement("span");
                          fallback.className = "avatar-fallback text-[#1D8751] font-bold text-lg";
                          fallback.textContent = singleOrder?.advertiser_name?.[0] || singleOrder?.advertiser_first_name?.[0] || "A";
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <span className="text-[#1D8751] font-bold text-lg">
                      {singleOrder?.advertiser_name?.[0] || singleOrder?.advertiser_first_name?.[0] || "A"}
                    </span>
                  )}
                </div>
                <span className="text-gray-900 dark:text-white text-sm font-medium truncate min-w-0">
                  {singleOrder?.advertiser_name || singleOrder?.advertiser_first_name || "Advertiser"}
                </span>
                <UserStatusBadge isLive={statusWsConnected} className="flex-shrink-0" />
                <span className="text-[10px] text-[#1D8751] flex items-center gap-1 flex-shrink-0">
                  Transaction time:{" "}
                  {isClient ? (
                    <TimeDisplay
                      seconds={confirmOrder?.status === "matched" ? countdown : displaySeconds}
                    />
                  ) : (
                    <span>--:--</span>
                  )}
                </span>
              </div>

              <div>
                <div className="text-sm text-gray-500 dark:text-[#788099]">
                  {singleOrder?.user_total_buy_orders || 120} Orders |{" "}
                  {singleOrder?.completion_rate || "99.20"}% Completion
                </div>
                <div className="text-sm text-[#1D8751]">
                  Rating: 99% | Rate: {commissionFromUrl || singleOrder?.commission_rate}
                </div>
              </div>

            </div>

            <div className="md:ml-auto flex flex-wrap gap-4 sm:gap-6 md:gap-8 text-md flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E8EFF5] dark:border-[#35353E]">
              <div>
                <span className="text-sm text-gray-900 dark:text-white mb-2">
                  {formatDurationForDisplay(singleOrder?.limit_duration) || "10 Minutes"}
                </span>
                <br />
                <span className="text-gray-500 dark:text-[#788099]">
                  Time limit
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-900 dark:text-white mb-2">
                  {formatDurationForDisplay(singleOrder?.completion_time) || formatDurationForDisplay(confirmOrder?.completion_time) || "2 Minutes"}
                </span>
                <br />
                <span className="text-gray-500 dark:text-[#788099]">
                  Avg. real-time
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-900 dark:text-white mb-2">
                  {singleOrder?.amount || singleOrder?.min_order_amount}{" "}
                  {singleOrder?.currency || "USDT"}
                </span>
                <br />
                <span className="text-gray-500 dark:text-[#788099]">
                  Available assets
                </span>
              </div>
            </div>
          </section>

          {/* Order Info */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-[13px] text-base text-gray-900 dark:text-white">
              Order Info
            </div>
            <div className="text-xs text-gray-500 dark:text-[#788099] text-[0.75rem] flex items-center gap-2">
              Order Number:{" "}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="underline text-[#1D8751] cursor-pointer inline-flex items-center gap-1 hover:text-[#16663d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D8751] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#18181D]"
                >
                  <span>{confirmOrder?.id || "9346457687345"}</span>
                </button>
                <CopyButton
                  value={confirmOrder?.id || singleOrder?.id || singleOrder?.buy_order || "9346457687345"}
                  className="text-[#1D8751]"
                  showIcon={true}
                />
              </div>
            </div>
          </div>
          <section className="order-info rounded-[18px] p-4 border-2 border-[#E8EFF5] dark:border-[#35353E] bg-gray-50 dark:bg-[var(--bg-color)] ">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Buy: I want to Send = fiat (KES/USD), I want to Receive = USDT */}
              <div className="flex-1 flex flex-col mb-2 md:mb-0">
                <div className="mb-1 text-gray-600 dark:text-[#788099] text-[0.95rem] font-medium">
                  I want to Send
                </div>
                <div className="flex items-center h-[46px] rounded-2xl border border-[#E8EFF5] dark:border-[#35353E] bg-white dark:bg-[var(--bg-color)] px-2">
                  <span className="text-[#1D8751] text-2xl mr-2">{rangeSymbol}</span>
                  <span className="text-[#1D8751] text-xl font-semibold">
                    {formatAmount(receiveAmount)}
                  </span>
                  <span className="ml-auto text-gray-900 dark:text-white text-base font-medium">
                    {rangeSuffix}
                  </span>
                </div>
              </div>
              {/* I want to Receive */}
              <div className="flex-1 flex flex-col mb-2 md:mb-0">
                <div className="mb-1 text-gray-600 dark:text-[#788099] text-[0.95rem] font-medium">
                  I want to Receive
                </div>
                <div className="flex items-center h-[46px] rounded-2xl border border-[#E8EFF5] dark:border-[#35353E] bg-white dark:bg-[var(--bg-color)] px-2">
                  <span className="text-[#1D8751] text-2xl mr-2">
                    <img
                      src="/images/tether.svg"
                      alt="USDT"
                      className="w-6 h-6"
                    />
                  </span>
                  <span className="text-[#1D8751] text-xl font-semibold">
                    {formatAmount(sendAmount)}
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white text-base font-medium">
                    USDT
                  </span>
                </div>
              </div>
              {/* Commission */}
              <div className="flex-1 flex flex-col">
                <div className="mb-1 text-gray-600 dark:text-[#788099] text-[0.95rem] font-medium">
                  Rate
                </div>
                <div className="flex items-center h-[46px] rounded-2xl border border-[#E8EFF5] dark:border-[#35353E] bg-white dark:bg-[#35353E] px-2">
                  <span className="text-[#1D8751] text-2xl mr-2">$</span>
                  <span className="text-[#1D8751] text-xl font-semibold">
                    {commissionFromUrl || singleOrder?.commission_rate}
                  </span>
                  <span className="ml-auto text-gray-900 dark:text-white text-base font-medium">
                    USD
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Send Money To */}
          <section className="rounded-[18px] p-2 md:p-4 w-full">
            <div className="flex flex-col md:flex-row justify-between w-full items-center mb-4 gap-2 md:gap-0">
              <div className="text-lg flex-1 text-gray-900 dark:text-white">
                Send Money To
              </div>
              <div className="text-xs flex items-center gap-1">
                <span className="text-[#1D8751]">Transaction time:</span>
                {isClient ? (
                  <TimeDisplay
                    seconds={confirmOrder?.status === "matched" ? countdown : displaySeconds}
                  />
                ) : (
                  <span>--:--</span>
                )}
              </div>
            </div>
            <div className="rounded-[18px] flex flex-col p-2 md:p-4 gap-4 bg-gray-50 dark:bg-[var(--bg-color)] border-1 border-[#E8EFF5] dark:border-[#35353E]">
              {/* Payment methods - display all from payment_details */}
              <div className="flex flex-col gap-4">
                {paymentDetailsList.length > 0 ? (
                  paymentDetailsList.map((paymentDetails: { id?: number; provider?: string; payment_method?: string; account_name?: string; account_number?: string; provider_logo?: string }) => (
                    <div key={paymentDetails?.id ?? paymentDetails?.provider ?? Math.random()} className="flex flex-col md:flex-row gap-3 md:gap-4 p-3 md:p-4 border border-[#E8EFF5] dark:border-[#3C3C47] rounded-2xl bg-white dark:bg-[var(--bg-color)]">
                      <div className="flex flex-row gap-2 md:gap-3 items-center w-full md:w-auto md:min-w-[140px]">
                        {paymentDetails?.provider_logo ? (
                          <img src={paymentDetails.provider_logo} alt={paymentDetails?.provider} className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-contain flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#1D8751] flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">{paymentDetails?.provider?.[0]?.toUpperCase() || "B"}</span>
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-gray-900 dark:text-white text-sm md:text-base font-semibold">{paymentDetails?.provider}</span>
                          {paymentDetails?.payment_method && (
                            <span className="text-[#788099] text-xs">{paymentDetails.payment_method.replace(/_/g, " ")}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 md:gap-4 w-full md:flex-1 min-w-0">
                        <div>
                          <p className="text-[#788099] text-xs md:text-sm mb-2">Account Name</p>
                          <div className="w-full flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <p className="flex-1 min-w-0 px-3 md:px-4 py-2 rounded-full border border-[#1D8751] text-[#1D8751] bg-[#E8EFF5] dark:bg-[#35353E] font-semibold text-sm md:text-base flex items-center truncate">
                              <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#1D8751] inline-block mr-2 flex-shrink-0"></span>
                              <span className="truncate">{paymentDetails?.account_name}</span>
                            </p>
                            <button className="w-full sm:w-auto px-3 md:px-4 py-2 rounded-full border border-[#E8EFF5] dark:border-[#35353E] text-[#1D8751] bg-[#E8EFF5] dark:bg-[#35353E] font-semibold text-sm flex items-center justify-center gap-1.5 flex-shrink-0" onClick={() => handleCopyToClipboard(paymentDetails?.account_name || "", `account-name-${paymentDetails?.id}`)}>
                              {copiedButton === `account-name-${paymentDetails?.id}` ? "Copied!" : "Copy"}
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-[#788099] text-xs md:text-sm mb-2">Account Number</p>
                          <div className="w-full flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <p className="flex-1 min-w-0 px-3 md:px-4 py-2 rounded-full border border-[#1D8751] text-[#1D8751] bg-[#E8EFF5] dark:bg-[#35353E] font-semibold text-sm md:text-base flex items-center truncate">
                              <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#1D8751] inline-block mr-2 flex-shrink-0"></span>
                              <span className="truncate">{paymentDetails?.account_number}</span>
                            </p>
                            <button className="w-full sm:w-auto px-3 md:px-4 py-2 rounded-full border border-[#E8EFF5] dark:border-[#35353E] text-[#1D8751] bg-[#E8EFF5] dark:bg-[#35353E] font-semibold text-sm flex items-center justify-center gap-1.5 flex-shrink-0" onClick={() => handleCopyToClipboard(paymentDetails?.account_number || "", `account-number-${paymentDetails?.id}`)}>
                              {copiedButton === `account-number-${paymentDetails?.id}` ? "Copied!" : "Copy"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[#788099] text-sm py-4">No payment methods available</div>
                )}
                {paymentDetailsList.length > 0 && (
                  <div>
                    <p className="text-[#788099] text-xs md:text-sm mb-2">Transaction ID</p>
                    <div className="w-full flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <p className="flex-1 min-w-0 font-[11px] md:font-[13px] px-3 md:px-4 py-2 rounded-full border border-[#1D8751] text-[#1D8751] bg-[#E8EFF5] dark:bg-[#35353E] flex items-center truncate">
                        <span className="truncate">{singleOrder?.id}</span>
                      </p>
                      <button className="w-full sm:w-auto px-3 md:px-4 py-2 font-[11px] md:font-[13px] rounded-full border border-[#E8EFF5] dark:border-[#35353E] text-[#1D8751] bg-[#E8EFF5] dark:bg-[#35353E] flex items-center justify-center gap-1.5 flex-shrink-0" onClick={() => handleCopyToClipboard(singleOrder?.id || "", "transaction-id")}>
                        {copiedButton === "transaction-id" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex flex-col  gap-4">
                  <div className="flex-1">
                    <div className="rounded-2xl border border-[#1D8751] bg-white dark:bg-[var(--bg-color)] p-6 mt-2 text-base flex flex-col gap-2">
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
                  </div>
                  <div className="flex-1">
                    {(confirmOrder?.status !== "matched" || countdown === 0) && (
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
                    <div className="flex flex-col md:flex-row gap-4 mt-4">
                      <button
                        className={`w-full md:w-auto flex-1 py-2 rounded-2xl border-2 border-[#E8EFF5] dark:border-[#3C3C47] text-lg transition-colors ${confirmOrder?.status === "half-matched" || cancelLoading
                          ? "bg-white dark:bg-[var(--card-color)] text-gray-400 dark:text-[#888] cursor-not-allowed opacity-60"
                          : "bg-transparent text-gray-600 dark:text-[#788099] hover:bg-gray-100 dark:hover:bg-[#35353E] cursor-pointer"
                          }`}
                        onClick={handleCancelTransaction}
                        disabled={
                          cancelLoading || confirmOrder?.status === "half-matched"
                        }
                      >
                        {cancelLoading ? "Cancelling..." : "Cancel Transaction"}
                      </button>
                      <button
                        className={`w-full md:w-auto flex-1 py-2 rounded-2xl text-lg  ${confirmOrder?.status === "half-matched"
                          ? "bg-white dark:bg-[var(--card-color)] text-gray-400 dark:text-[#888]"
                          : "bg-[#1D8751] text-white"
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
                              confirmOrder?.status === "half-matched"
                            );
                          })()
                        }
                      >
                        {(() => {
                          const isThisTradeLoading =
                            confirmTradeLoading &&
                            !!confirmOrder?.id &&
                            lastActionTradeIdRef.current === confirmOrder.id;
                          return isThisTradeLoading
                            ? "Notifying seller..."
                            : "Money sent, notify seller";
                        })()}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Chat and Terms - on mobile hidden unless Chat button clicked, opens on top */}
        <div className={`lg:col-span-1 pt-10 flex flex-col gap-6 mt-6 lg:mt-0 ${!showChat ? "hidden lg:flex" : "order-first lg:order-none flex"}`}>
          <ChatBox
            onClose={() => setShowChat(false)}
            tradeId={confirmOrder?.id || ""}
            userId={user?.id.toString() || ""}
            userName={singleOrder?.advertiser_name || singleOrder?.advertiser_first_name || ""}
            autoreply={singleOrder?.auto_reply || ""}
            // Prefer photos from the trade (confirmOrder) but fall back to data already available on this page.
            seller_photo={
              confirmOrder?.seller_photo ||
              (singleOrder as any)?.seller_photo ||
              singleOrder?.advertiser_photo ||
              ""
            }
            buyer_photo={
              confirmOrder?.buyer_photo ||
              (singleOrder as any)?.buy_photo ||
              ""
            }
            buyer={confirmOrder?.buyer || ""}
            seller={confirmOrder?.seller || ""}
            currentUserEmail={user?.email || ""}
            owner={confirmOrder?.owner || ""}
            sellerName={
              singleOrder?.advertiser_first_name && singleOrder?.advertiser_last_name
                ? `${singleOrder.advertiser_first_name} ${singleOrder.advertiser_last_name}`
                : singleOrder?.advertiser_name || confirmOrder?.advertiser_name || "Seller"
            }
            buyerName={user?.email === confirmOrder?.buyer ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "You" : "Buyer"}
          />
          {/* Advertiser's Terms */}
          <section className="advertiser-terms rounded-lg p-4 bg-white dark:bg-[var(--card-color)]">
            <div className="font-semibold text-lg mb-2 text-gray-900 dark:text-white flex gap-4 items-center">
              Advertiser's Terms
              <AlertCircle className="w-5 h-5 text-[#E23D3A]" />
            </div>
            <div className="text-xs flex flex-col gap-2">
              <div className="text-[#1D8751]">
                {singleOrder?.terms_and_conditions || singleOrder?.terms_and_conditions || ""}
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
            <Dialog.Panel className="mx-auto w-full max-w-md rounded-2xl bg-white dark:bg-[var(--card-color)] text-gray-900 dark:text-white border border-[#E8EFF5] dark:border-[#35353E] shadow-xl">
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

        {showCancelMsg && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-[var(--card-color)] text-gray-900 dark:text-white px-6 py-3 rounded-xl shadow-lg z-50 border border-[#E23D3A] text-[13px]">
            Trade cancelled
          </div>
        )}

        {/* Success Modal - Using Headless UI Dialog */}
        <Dialog
          open={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto w-full max-w-md rounded-2xl bg-white dark:bg-[var(--card-color)] text-gray-900 dark:text-white border border-[#E8EFF5] dark:border-[#35353E]">
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
                  <div className="bg-gray-50 dark:bg-[var(--bg-color)] rounded-xl p-4 mb-6 border border-[#E8EFF5] dark:border-[#35353E]">
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
                        Rate:
                      </span>
                      <span className="text-[#1D8751] font-semibold">
                        {formatCommissionRate(commissionRate)}
                      </span>
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
                      type="button"
                      onClick={() => {
                        setShowSuccessModal(false);
                        setShowFeedbackModal(true);
                      }}
                      className="w-full bg-[#F79330] text-white rounded-lg px-6 py-3 font-semibold hover:bg-[#e6821a] transition-colors"
                    >
                      Provide Feedback
                    </button>
                    <button
                      onClick={() => {
                        setShowSuccessModal(false);
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
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* Feedback Modal - only one modal open so clicks work */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowFeedbackModal(false); setFeedbackRating(null); setFeedbackComment(""); } }}>
            <div className="bg-white dark:bg-[var(--card-color)] rounded-2xl p-4 sm:p-6 min-[900px]:p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-[#35353E] max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#F79330] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Rate Your Experience</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Tap Positive or Negative to enable Submit</p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-4 sm:mb-6">
                  <button
                    type="button"
                    onClick={() => setFeedbackRating(true)}
                    className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 border-2 min-w-[120px] ${feedbackRating === true ? "bg-[#1D8751] text-white border-[#1D8751] shadow-lg ring-2 ring-[#1D8751] ring-offset-2" : "bg-gray-100 dark:bg-[#35353E] text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-[#404040]"}`}
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558-.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.833 0-1.612.453-1.918 1.227z" /></svg>
                    Positive
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackRating(false)}
                    className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 border-2 min-w-[120px] ${feedbackRating === false ? "bg-[#E23D3A] text-white border-[#E23D3A] shadow-lg ring-2 ring-[#E23D3A] ring-offset-2" : "bg-gray-100 dark:bg-[#35353E] text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-[#404040]"}`}
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M15.73 5.25h1.035A7.465 7.465 0 0118 9.375a7.465 7.465 0 01-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218C7.74 15.724 7.366 15 8.25 15h3.126c.618 0 .991.724.725 1.282A7.471 7.471 0 0012 19.5a7.471 7.471 0 00-.1-3.218c-.266-.558.107-1.282.725-1.282H12.75c-.445 0-.72-.498-.523-.898a8.963 8.963 0 01.924-3.977c0-1.708-.476-3.305-1.302-4.666-.245-.403.028-.959.5-.959H15.73zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.833 0-1.612.453-1.918 1.227z" /></svg>
                    Negative
                  </button>
                </div>
                <div className="mb-4 sm:mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">Comment (Optional)</label>
                  <textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Share your experience..."
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-[#35353E] rounded-lg bg-white dark:bg-[var(--card-color)] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#1D8751] focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowFeedbackModal(false); setFeedbackRating(null); setFeedbackComment(""); }}
                    className="flex-1 bg-gray-100 dark:bg-[#35353E] text-gray-700 dark:text-gray-300 rounded-lg px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold hover:bg-gray-200 dark:hover:bg-[#404040] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleFeedbackSubmit}
                    disabled={feedbackLoading || feedbackRating === null}
                    className={`flex-1 rounded-lg px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-colors ${feedbackRating !== null && !feedbackLoading ? "bg-[#1D8751] text-white hover:bg-[#167a45] cursor-pointer" : "bg-[#1D8751]/50 text-white cursor-not-allowed"}`}
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
  return content;
}

export default FinalBuy;
