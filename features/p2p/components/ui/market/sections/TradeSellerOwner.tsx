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
import { FileIcon, SendIcon } from "lucide-react";
import { FaChevronRight } from "react-icons/fa";
import AppealModal from "./appeal";
import ChatBox from "./ChatBox";
import { showToast } from "@/lib/utils/toast";
import { handleCopy } from "@/features/p2p/components/Common/utils";
import { Dialog } from "@headlessui/react";
import { RefreshCw } from "lucide-react";
import { useTradeStatusWebSocket } from "@/features/p2p/hooks/useTradeStatusWebSocket";

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
  const [isClient, setIsClient] = useState(false);
  const [tradeDataJson, setTradeDataJson] = useState<any>({});
  const prevStatusRef = useRef<string | undefined>(undefined);
  const prevTradeIdRef = useRef<string | null>(null);
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  // WebSocket status update callback - use useCallback to prevent reconnections
  const handleStatusUpdate = React.useCallback((status: any) => {
    logger.debug('p2p', "🔔 Trade status update received in TradeSellerOwner:", status);
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

  const completionTime = Number(singleOrder?.completion_time);
  const displaySeconds =
    !isNaN(completionTime) && completionTime > 0
      ? completionTime * 60
      : 10 * 60;

  // Local countdown state for auto-cancel logic
  const [countdown, setCountdown] = useState(displaySeconds);

  // Sync countdown ONLY when status becomes 'matched'
  useEffect(() => {
    if (confirmOrder?.status === "matched") {
      setCountdown(displaySeconds);
    }
    // Do not reset countdown if status is not matched
  }, [displaySeconds, confirmOrder?.status]);

  // Countdown effect
  useEffect(() => {
    if (confirmOrder?.status !== "matched") return;
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [confirmOrder?.status, countdown]);

  // Auto-cancel when countdown reaches 0 and status is matched - DISABLED
  useEffect(() => {
    if (isAuthenticated) {
      if (confirmOrder?.status === "matched" && countdown === 0) {
        // AUTO-CANCEL DISABLED - Countdown reached 0 but no auto-cancel
        logger.debug('p2p', "Countdown reached 0, auto-cancel is disabled");
        return;
      }
    }
  }, [confirmOrder?.status, countdown, confirmOrder?.id, dispatch]);

  // Fetch confirm order when authenticated and orderId is available
  useEffect(() => {
    const orderId = params?.id as string;
    logger.debug('p2p', orderId)
    if (isAuthenticated && orderId) {
      dispatch(fetchConfirmOrder(orderId));
    }
  }, [params?.id, dispatch, isAuthenticated]);

  // Fetch single order when confirmOrder is loaded
  useEffect(() => {
    const orderToFetch = confirmOrder?.buy_order || confirmOrder?.sell_order;
    if (isAuthenticated && orderToFetch) {
      dispatch(fetchSingleOrder(orderToFetch.toString()));
    }
  }, [confirmOrder?.buy_order, confirmOrder?.sell_order, dispatch, isAuthenticated]);


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
          console.error("Failed to parse trade data from localStorage:", error);
          setTradeDataJson({});
        }
      }
    }
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
    }
  }, [confirmOrder?.id]);

  // Show success modal only on transition to completed for the current trade
  useEffect(() => {
    const currentId = confirmOrder?.id || "";
    const newStatus = confirmOrder?.status;
    const prevStatus = prevStatusRef.current;
    const paramId = (params?.id as string) || "";

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

  // Get payment details from order data
  const paymentDetails = singleOrder?.payment_details?.[0] || null;

  // --- Calculation logic ---
  const sendAmount = Number(confirmOrder?.amount) || 0;
  const commissionRate = Number(singleOrder?.commission_rate) || Number(tradeDataJson?.commission_rate) || 0;
  const orderType = singleOrder?.order_type || "buy";
  let receiveAmount = sendAmount;

  if (orderType === "buy") {
    // For buy orders, multiply by commission rate
    receiveAmount = commissionRate > 0 ? sendAmount * commissionRate : sendAmount;
  } else {
    // For sell orders, divide by commission rate
    receiveAmount = commissionRate > 0 ? sendAmount / commissionRate : sendAmount;
  }

  // Format numbers
  const formatAmount = (amt: number) =>
    amt.toLocaleString(undefined, { maximumFractionDigits: 6 });

  const handleCancelTransaction = () => {
    if (isAuthenticated && confirmOrder?.id) {
      dispatch(cancelP2POrderThunk(confirmOrder.id));
      showToast.success("Transaction Cancelled Successfully!");
      setTimeout(() => {
        router.push("/dashboard/p2p");
      }, 2000);
    }
  };

  // Add handler for confirming trade

  const handleConfirmTrade = () => {
    if (isAuthenticated && confirmOrder?.id) {
      dispatch(confirmP2PTradeThunk(confirmOrder.id));
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
      <div className="final-buy-container grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 md:gap-6 p-1 sm:p-2 md:p-6 min-h-screen bg-[#EEF1F4] dark:bg-(--bg-color)">
        {/* Left Column: Main Info */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <p
                className="text-gray-900 dark:text-white text-xs sm:text-[13px] font-medium"
              >
                Advertiser Information
              </p>
              {statusWsConnected && (
                <span className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-[#1D8751] font-medium whitespace-nowrap">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1D8751] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1D8751]"></span>
                  </span>
                  Live Status
                </span>
              )}
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1 bg-gray-100 dark:bg-[var(--card-color)] text-[#1D8751] rounded-lg px-2 py-1.5 sm:py-1 border border-gray-200 dark:border-[#35353E] hover:bg-gray-200 dark:hover:bg-[#35353E] transition-colors self-start sm:self-auto"
              title="Refresh"
            >
              <RefreshCw size={12} className="sm:w-[14px] sm:h-[14px]" />
            </button>
          </div>
          {/* Advertiser Info */}
          <section className="advertiser-info rounded-[18px] p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border-2 border-gray-200 dark:border-[#35353E] bg-gray-50 dark:bg-[var(--card-color)]">
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
                <div className="text-gray-900 dark:text-white text-xs sm:text-[13px] font-medium">
                  {singleOrder ? (
                    <>
                      <span className="truncate block sm:inline">
                        {singleOrder.advertiser_first_name && singleOrder.advertiser_last_name
                          ? `${singleOrder.advertiser_first_name} ${singleOrder.advertiser_last_name}`
                          : singleOrder.advertiser_name || "Advertiser User Name"}
                      </span>
                      <span className="text-[#E23D3A]"> ✔️</span>
                    </>
                  ) : (
                    <>
                      <span className="truncate block sm:inline">Advertiser User Name</span>
                      <span className="text-[#E23D3A]"> ✔️</span>
                    </>
                  )}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-[#788099] mt-0.5 sm:mt-0">
                  <span className="whitespace-nowrap">{singleOrder?.user_total_buy_orders || 120} Orders</span>{" "}
                  <span className="hidden sm:inline">|</span>{" "}
                  <span className="whitespace-nowrap">{singleOrder?.completion_rate || "99.20"}% Completion</span>
                </div>
                <div className="text-[10px] sm:text-xs text-[#1D8751] mt-0.5 sm:mt-0">
                  <span className="whitespace-nowrap">Rating: 99%</span>{" "}
                  <span className="hidden sm:inline">|</span>{" "}
                  <span className="whitespace-nowrap">Commission: {tradeDataJson?.commission_rate || "0.5"}%</span>
                </div>
              </div>
            </div>
            <div className="ml-0 sm:ml-auto flex flex-wrap sm:flex-nowrap gap-4 sm:gap-6 lg:gap-8 text-xs justify-start sm:justify-end">
              <div className="flex-shrink-0">
                <span className="text-xs sm:text-[13px] text-gray-900 dark:text-white font-medium block">
                  {tradeDataJson?.limit || "10 Minutes"}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-[#788099]">
                  Time limit
                </span>
              </div>
              <div className="flex-shrink-0">
                <span className="text-xs sm:text-[13px] text-gray-900 dark:text-white font-medium block">
                  {tradeDataJson?.completion_time || "2 Minutes"}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-[#788099]">
                  Avg. real-time
                </span>
              </div>
              <div className="flex-shrink-0">
                <span className="text-xs sm:text-[13px] text-gray-900 dark:text-white font-medium block">
                  {singleOrder?.amount || "1,200"}{" "}
                  {singleOrder?.currency || "USDT"}
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
                onClick={() => handleCopy(singleOrder?.id)}
                aria-label="Copy order number"
              >
                <span className="break-all">{confirmOrder?.id || "9346457687345"}</span>
              </button>
            </div>
          </div>
          <section className="order-info rounded-[18px] p-2   border-2 border-gray-200 dark:border-[#35353E] bg-gray-50 dark:bg-[var(--card-color)] ">
            <div className="flex flex-col md:flex-row gap-4">
              {/* I want to Send */}
              <div className="flex-1 flex flex-col mb-2 md:mb-0">
                <div className="mb-1 text-gray-600 dark:text-[#788099] text-[0.95rem] font-medium">
                  I want to Send
                </div>
                <div className="flex items-center h-[46px] rounded-2xl border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] px-2">
                  <span className="text-[#1D8751] text-2xl mr-2">$</span>
                  <span className="text-[#1D8751] text-xl font-semibold">
                    {formatAmount(Math.round(Number(sendAmount) / Number(commissionRate) * 100) / 100)}
                  </span>
                  <span className="ml-auto text-gray-900 dark:text-white text-base font-medium">
                    USD
                  </span>
                </div>
              </div>
              {/* I want to Receive */}
              <div className="flex-1 flex flex-col mb-2 md:mb-0">
                <div className="mb-1 text-gray-600 dark:text-[#788099] text-[0.95rem] font-medium">
                  I want to Receive
                </div>
                <div className="flex items-center h-[46px] rounded-2xl border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] px-2">
                  {/* Placeholder for Tether/USDT icon */}
                  <span className="text-[#1D8751] text-2xl mr-2">&#x20BF;</span>
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
                  Commission
                </div>
                <div className="flex items-center h-[46px] rounded-2xl border border-gray-200 dark:border-[#35353E] bg-gray-100 dark:bg-[#35353E] px-2">
                  <span className="text-[#1D8751] text-2xl mr-2">$</span>
                  <span className="text-[#1D8751] text-xl font-semibold">
                    {commissionRate}%
                  </span>
                  <span className="ml-auto text-gray-900 dark:text-white text-base font-medium">
                    USD
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Send Money To */}
          <section className="send-money rounded-[18px] p-2 md:p-4 ">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
              <div className="text-xs sm:text-[13px] flex-1 text-gray-900 dark:text-white font-medium">
                Send Money To
              </div>
              <div className="text-[10px] sm:text-xs flex items-center gap-1 flex-shrink-0">
                <span className="text-[#1D8751] whitespace-nowrap">Transaction time:</span>
                {isClient ? (
                  <TimeDisplay
                    seconds={
                      confirmOrder?.status === "matched"
                        ? countdown
                        : displaySeconds
                    }
                  />
                ) : (
                  <span>--:--</span>
                )}
              </div>
            </div>
            <div className="rounded-[18px] flex flex-col  p-2 md:p-4 gap-4 bg-gray-50 dark:bg-[var(--card-color)]">
              {/* Left: Bank Info */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                  <div className="flex p-2 md:p-3 gap-2 w-full md:w-1/4 min-h-[100px] md:min-h-[180px] border border-gray-200 dark:border-[#3C3C47] rounded-2xl bg-white dark:bg-[var(--bg-color)] mb-4 md:mb-0">
                    {/* Replace with actual logo if available */}
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white flex items-center justify-center mb-2">
                      <span className="text-[#1D8751] font-bold text-xs">
                        {paymentDetails?.provider[0]}
                      </span>
                    </div>
                    <span className="text-gray-900 dark:text-white text-xs md:text-[13px] font-medium">
                      {paymentDetails?.provider}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3 md:gap-4 w-full md:flex-1 min-w-0">
                    <div className="flex flex-col gap-3 md:gap-4">
                      {/* Account Name */}
                      <div className="flex w-full flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <div className="w-full flex flex-col min-w-0">
                          <span className="text-[#788099] text-xs md:text-sm mb-2">
                            Account Name
                          </span>
                          <span className="flex-1 min-w-0 px-3 md:px-4 py-2 rounded-full border border-[#1D8751] text-[#1D8751] bg-transparent font-semibold text-sm md:text-base flex items-center truncate">
                            <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#1D8751] inline-block mr-2 flex-shrink-0"></span>
                            <span className="truncate">{paymentDetails?.account_name}</span>
                          </span>
                        </div>
                        <button
                          className="w-full sm:w-auto px-3 md:px-4 py-2 rounded-full border border-gray-200 dark:border-[#35353E] text-[#1D8751] bg-gray-100 dark:bg-[var(--card-color)] font-semibold text-sm flex items-center justify-center gap-1.5 flex-shrink-0"
                          onClick={() => handleCopy(paymentDetails?.account_name)}
                        >
                          Copy
                          <svg
                            className="w-3 h-3 md:w-4 md:h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <rect x="3" y="3" width="13" height="13" rx="2" />
                          </svg>
                        </button>
                      </div>
                      {/* Account Number */}
                      <div className="flex w-full flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <div className="w-full flex flex-col min-w-0">
                          <span className="text-[#788099] text-xs md:text-sm mb-2">
                            Account Number
                          </span>
                          <span className="flex-1 min-w-0 px-3 md:px-4 py-2 rounded-full border border-[#1D8751] text-[#1D8751] bg-transparent font-semibold text-sm md:text-base flex items-center truncate">
                            <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#1D8751] inline-block mr-2 flex-shrink-0"></span>
                            <span className="truncate">{paymentDetails?.account_number}</span>
                          </span>
                        </div>
                        <button
                          className="w-full sm:w-auto px-3 md:px-4 py-2 rounded-full border border-gray-200 dark:border-[#35353E] text-[#1D8751] bg-gray-100 dark:bg-[var(--card-color)] font-semibold text-sm flex items-center justify-center gap-1.5 flex-shrink-0"
                          onClick={() =>
                            handleCopy(paymentDetails?.account_number)
                          }
                        >
                          Copy
                          <svg
                            className="w-3 h-3 md:w-4 md:h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <rect x="3" y="3" width="13" height="13" rx="2" />
                          </svg>
                        </button>
                      </div>
                      {/* Transaction ID */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <div className="w-full flex flex-col min-w-0">
                          <span className="text-[#788099] text-xs md:text-sm mb-2">
                            Transaction ID
                          </span>
                          <span className="flex-1 min-w-0 font-[11px] md:font-[13px] px-3 md:px-4 py-2 rounded-full border border-[#1D8751] text-[#1D8751] bg-transparent flex items-center truncate">
                            <span className="truncate">{singleOrder?.id}</span>
                          </span>
                        </div>
                        <button
                          className="w-full sm:w-auto px-3 md:px-4 py-2 font-[11px] md:font-[13px] rounded-full border border-gray-200 dark:border-[#35353E] text-[#1D8751] bg-gray-100 dark:bg-[var(--card-color)] flex items-center justify-center gap-1.5 flex-shrink-0"
                          onClick={() => handleCopy(singleOrder?.id)}
                        >
                          Copy
                          <svg
                            className="w-3 h-3 md:w-4 md:h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <rect x="3" y="3" width="13" height="13" rx="2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col  gap-4">
                  <div className="flex-1">
                    <div className="rounded-2xl border border-[#1D8751] bg-gray-50 dark:bg-[var(--bg-color)] p-6 mt-2 text-base flex flex-col gap-2">
                      <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                        <span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block"></span>
                        Please send the money from your own account Only
                      </div>
                      <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                        <span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block"></span>
                        Put transaction ID in the description field of the bank
                      </div>
                      <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                        <span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block"></span>
                        Please note, If you do not follow above conditions, we
                        will reject your transaction and send you back your money.
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="mt-4 mb-2 text-lg">
                      <span className="text-gray-900 dark:text-white">
                        I have an issue with transaction.{" "}
                      </span>
                      <span
                        className="text-[#E23D3A]  cursor-pointer"
                        onClick={() => setShowAppealModal(true)}
                      >
                        Appeal/Complain
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 mt-4">
                      <button
                        className={`w-full md:w-auto flex-1 py-2 rounded-2xl border-2 border-gray-200 dark:border-[#3C3C47] text-lg  ${confirmOrder?.status === "half-matched"
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
                        className={`w-full md:w-auto flex-1 py-2 rounded-2xl text-lg  ${confirmOrder?.status === "half-matched"
                          ? "bg-gray-100 dark:bg-[var(--card-color)] text-gray-400 dark:text-[#888]"
                          : "bg-[#E23D3A] text-white"
                          } ${confirmTradeLoading
                            ? "opacity-60 cursor-not-allowed"
                            : ""
                          }`}
                        onClick={handleConfirmTrade}
                        disabled={
                          confirmTradeLoading ||
                          !confirmOrder?.id ||
                          confirmOrder?.status === "half-matched"
                        }
                      >
                        {confirmTradeLoading
                          ? "Notifying seller..."
                          : "Money Sent Notify Seller"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right: Account Details and Actions */}
            </div>
          </section>
        </div>

        {/* Right Column: Chat and Terms */}
        <div className="md:col-span-1 pt-10 flex flex-col gap-6 mt-6 md:mt-0">
          {/* Chat with Advertiser */}
          <ChatBox
            tradeId={confirmOrder?.id || ""}
            userId={user?.id.toString() || ""}
            userName={
              singleOrder?.advertiser_first_name && singleOrder?.advertiser_last_name
                ? `${singleOrder.advertiser_first_name} ${singleOrder.advertiser_last_name}`
                : singleOrder?.advertiser_name || ""
            }
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
            owner={confirmOrder?.owner || ""}
            sellerName={
              singleOrder?.advertiser_first_name && singleOrder?.advertiser_last_name
                ? `${singleOrder.advertiser_first_name} ${singleOrder.advertiser_last_name}`
                : singleOrder?.advertiser_name || confirmOrder?.advertiser_name || "Seller"
            }
            buyerName={user?.email === confirmOrder?.buyer ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "You" : "Buyer"}
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
                        ${formatAmount(sendAmount)} USD
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-[#A3A3C2]">
                        Commission:
                      </span>
                      <span className="text-[#1D8751] font-semibold">
                        {commissionRate}%
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
