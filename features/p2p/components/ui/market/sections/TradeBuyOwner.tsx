"use client";
import React, { useEffect, useState, useRef } from "react";
import { tokens } from "@/styles/tokens";
import { P2POrder } from "@/features/p2p/types";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { AppDispatch } from "@/store/index";
import { TimeDisplay } from "./TimeDisplay";
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
} from "lucide-react";
import AppealModal from "./appeal";
import ChatBox from "./ChatBox";
import { showToast } from "@/lib/utils/toast";
import { handleCopy } from "../../../Common/utils";
import Image from "next/image";
import { useTradeStatusWebSocket } from "@/features/p2p/hooks/useTradeStatusWebSocket";

import { logger } from "@/lib/utils/logger";

interface FinalSellProps {
  orderData?: P2POrder;
}

const FinalSell: React.FC<FinalSellProps> = ({ orderData }) => {
  const params = useParams();
  const router = useRouter();
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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<boolean | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isClient, setIsClient] = useState(false);
  const prevStatusRef = useRef<string | undefined>(undefined);
  const prevTradeIdRef = useRef<string | null>(null);
  const lastActionTradeIdRef = useRef<string | null>(null);
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  // WebSocket status update callback - use useCallback to prevent reconnections
  const handleStatusUpdate = React.useCallback(
    (status: any) => {
      logger.debug(
        "p2p",
        "🔔 Trade status update received in TradeBuyOwner:",
        status
      );
      logger.debug("p2p", "📊 Current confirmOrder:", confirmOrder);
      logger.debug("p2p", "📊 Current confirmOrder.id:", confirmOrder?.id);
      logger.debug(
        "p2p",
        "📊 Current confirmOrder.status:",
        confirmOrder?.status
      );
      logger.debug("p2p", "📊 New status:", status.status);

      const oldStatus = confirmOrder?.status;
      const newStatus = status.status;

      // Always refresh if we have a valid status update
      if (confirmOrder?.id && newStatus) {
        logger.debug("p2p", "✅ Conditions met - will update UI");

        // Show toast notification for status changes
        if (oldStatus !== newStatus) {
          logger.debug("p2p", `📢 Status changed: ${oldStatus} → ${newStatus}`);
          if (oldStatus === "matched" && newStatus === "half-matched") {
            // showToast.success(
            //   "Status Updated",
            //   "Seller has notified payment sent"
            // );
          } else if (
            oldStatus === "half-matched" &&
            newStatus === "completed"
          ) {
            // showToast.success(
            //   "Trade Completed!",
            //   "Transaction completed successfully"
            // );
          } else if (newStatus === "cancelled") {
            showToast.error("Trade Cancelled", "The trade has been cancelled");
          } else {
            // showToast.success(
            //   "Status Updated",
            //   `Trade status is now: ${newStatus}`
            // );
          }
        } else {
          logger.debug("p2p", "ℹ️ Status unchanged, still refreshing data");
        }

        logger.debug(
          "p2p",
          "🔄 Refreshing trade data for ID:",
          confirmOrder.id
        );
        dispatch(fetchConfirmOrder(confirmOrder.id))
          .unwrap()
          .then((updatedOrder) => {
            logger.debug("p2p", "✅ fetchConfirmOrder SUCCESS:", updatedOrder);
            logger.debug("p2p", "✅ Updated status:", updatedOrder?.status);
          })
          .catch((error) => {
            console.error("❌ fetchConfirmOrder FAILED:", error);
          });
      } else {
        console.warn("❌ Conditions NOT met:", {
          hasConfirmOrderId: !!confirmOrder?.id,
          hasNewStatus: !!newStatus,
          confirmOrderId: confirmOrder?.id,
          newStatus: newStatus,
        });
      }
    },
    [confirmOrder, dispatch]
  );

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
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [confirmOrder?.status, countdown]);

  // Auto-cancel when countdown reaches 0 and status is matched - DISABLED
  useEffect(() => {
    if (confirmOrder?.status === "matched" && countdown === 0) {
      // AUTO-CANCEL DISABLED - Countdown reached 0 but no auto-cancel
      logger.debug("p2p", "Countdown reached 0, auto-cancel is disabled");
      return;
    }
  }, [confirmOrder?.status, countdown, confirmOrder?.id, dispatch]);

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
  const singgleuseid = confirmOrder?.buy_order;

  // Fetch single order when confirmOrder is loaded
  useEffect(() => {
    const orderToFetch = confirmOrder?.buy_order || confirmOrder?.sell_order;
    if (isAuthenticated && orderToFetch && singgleuseid) {
      dispatch(fetchSingleOrder(singgleuseid.toString()));
    }
  }, [
    confirmOrder?.buy_order,
    confirmOrder?.sell_order,
    dispatch,
    isAuthenticated,
    singgleuseid,
  ]);

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
        localStorage.setItem(modalShownKey, "true");
      }
    }

    prevStatusRef.current = newStatus;
  }, [confirmOrder?.status, confirmOrder?.id, params?.id]);

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

  // Get payment details from order data
  const paymentDetails = saveOrder?.payment_details?.[0] || null;

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

  const getButtonText = () => {
    const isThisTradeLoading =
      confirmTradeLoading &&
      !!confirmOrder?.id &&
      lastActionTradeIdRef.current === confirmOrder.id;
    if (isThisTradeLoading) return "Notifying seller...";
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
    <div className="grid grid-cols-1 mt-10 md:grid-cols-3 gap-6 p-6 min-h-screen bg-[#EEF1F4] dark:bg-[#18181D]">
      {/* Left: Timeline/Steps */}
      <div className="md:col-span-2 flex flex-col gap-4">
        {/* Step 1: Order Created */}
        <div className="relative pl-8 pb-4 border-l-2 border-gray-200 dark:border-[#35353E]">
          <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-[#23232A] border-2 border-[#1D8751] flex items-center justify-center text-[#1D8751] font-bold text-lg">
            1
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-gray-900 dark:text-white font-semibold text-lg">
                Order Created
              </span>
              {statusWsConnected && (
                <span className="flex items-center gap-1.5 text-[10px] text-[#1D8751] font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1D8751] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1D8751]"></span>
                  </span>
                  Live Status
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                width="24"
                height="24"
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

              <span className="text-[14px] text-gray-500 dark:text-[#A3A3C2]">
                Order Number :
                <button
                  className="text-[#1D8751] underline ml-1"
                  onClick={() => handleCopy(singleOrder?.id)}
                >
                  {singleOrder?.id}
                </button>
              </span>
              <CopyIcon
                className="w-4 h-4 text-[#1D8751] ml-1"
                onClick={() => handleCopy(singleOrder?.id)}
              />
              <span className="text-[14px] text-gray-500 dark:text-[#A3A3C2]">
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-1 bg-gray-100 dark:bg-[#23232A] text-[#1D8751] rounded-lg px-2 py-1 border border-gray-200 dark:border-[#35353E] hover:bg-gray-200 dark:hover:bg-[#35353E] transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={14} />
                </button>
              </span>
            </div>
          </div>
          <div className="flex gap-4 border border-gray-200 dark:border-[#35353E] p-4 rounded-xl mt-4 bg-white dark:bg-[#18181D]">
            <div className="flex flex-col gap-2 w-full">
              <p className="text-[#788099] text-sm">Fiat USD</p>
              <div className="flex flex-row items-center justify-between w-full  bg-[#EEF1F4] dark:bg-[#35353E] rounded-xl px-6 py-2">
                <span className="text-[#F79330] text-lg font-bold">
                  <span className="text-[#1D8751] text-xl">$</span>{" "}
                  {formatAmount(sendAmount)}
                </span>
                <span className="text-xs text-[#F79330]">USD</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <p className="text-[#788099] text-sm">Rate</p>
              <div className="flex f w-full flex-row  justify-between items-center bg-[#EEF1F4] dark:bg-[#35353E] rounded-xl px-6 py-2">
                <span className="text-[#1D8751] text-xl">
                  $ {commissionRate}%
                </span>
                <span className="text-sm text-[#051015] dark:text-[#F79330]">
                  USD
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <p className="text-[#788099] text-sm">Total Quantity</p>
              <div className="flex flex-row justify-between w-full items-center bg-[#EEF1F4] dark:bg-[#35353E] rounded-xl px-6 py-2">
                <div className="flex flex-row items-center gap-2">
                  <Image
                    src="https://res.cloudinary.com/pitz/image/upload/v1750918504/tether_1_yim48g.png"
                    alt="USDT"
                    width={20}
                    height={20}
                  />
                  <span className="text-[#1D8751] text-lg font-bold">
                    {formatAmount(saveOrder?.amount)}

                    {formatAmount(receiveAmount)}
                  </span>
                </div>
                <span className="text-xs text-[#F79330] dark:text-[#A3A3C2]">
                  USDT
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Confirm Payment From Buyer */}
        <div className="relative pl-8 pb-4 border-l-2 border-gray-200 dark:border-[#35353E]">
          <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-[#23232A] border-2 border-[#1D8751] flex items-center justify-center text-[#1D8751] font-bold text-lg">
            2
          </div>
          <span className="text-gray-900 dark:text-white font-semibold text-lg">
            Confirm Payment is from{" "}
            {singleOrder?.advertiser_first_name || user?.first_name}{" "}
            {singleOrder?.advertiser_last_name ||
              user?.last_name ||
              "Mohammed Zyad Yousef"}
          </span>
          <div className="bg-white dark:bg-[#18181D] rounded-2xl p-6 mt-4 flex flex-col gap-6 border border-gray-200 dark:border-[#31313C]">
            {/* Bank Info */}
            <div className="flex items-center bg-white dark:bg-[#18181D] gap-4 border border-gray-200 dark:border-[#35353E] rounded-xl px-4 py-3 w-fit mb-2">
              <div className="w-10 h-10 rounded-full text-black bg-white flex items-center justify-center overflow-hidden">
                {/* Use logo mapped from provider */}
                {paymentDetails?.provider[0]}
              </div>
              <span className="text-gray-900 dark:text-white font-medium text-lg">
                {paymentDetails?.provider}
              </span>
            </div>
            {/* Account Name */}
            <div className="flex items-center gap-4">
              <div className="text-gray-600 dark:text-[#A3A3C2] text-base mb-1 w-1/4 min-w-[100px]">
                Account Name
              </div>
              <div className="flex items-center bg-gray-100 dark:bg-[#35353E] border border-[#1D8751] rounded-full px-6 py-2 flex-1">
                <span className="w-3 h-3 rounded-full bg-[#1D8751] mr-3 inline-block"></span>
                <span className="text-[#1D8751] font-semibold text-lg">
                  {paymentDetails?.account_name || "Omar Ali"}
                </span>
                <div className="flex-1" />
                <button
                  className="ml-3 text-[#1D8751] hover:text-[#F79330] focus:outline-none"
                  onClick={() =>
                    handleCopy(paymentDetails?.account_name || "Omar Ali")
                  }
                  title="Copy Account Name"
                >
                  <FileIcon size={18} />
                </button>
              </div>
            </div>
            {/* Account Number */}
            <div className="flex items-center gap-4">
              <div className="text-gray-600 dark:text-[#A3A3C2] text-base mb-1 w-1/4 min-w-[100px]">
                Account Number
              </div>
              <div className="flex items-center bg-gray-100 dark:bg-[#35353E] border border-[#1D8751] rounded-full px-6 py-2 flex-1">
                <span className="w-3 h-3 rounded-full bg-[#1D8751] mr-3 inline-block"></span>
                <span className="text-[#1D8751] font-semibold text-lg">
                  {paymentDetails?.account_number || "123456789"}
                </span>
                <div className="flex-1" />
                <button
                  className="ml-3 text-[#1D8751] hover:text-[#F79330] focus:outline-none"
                  onClick={() =>
                    handleCopy(paymentDetails?.account_number || "123456789")
                  }
                  title="Copy Account Number"
                >
                  <FileIcon size={18} />
                </button>
              </div>
            </div>
            {/* Buyer's Name */}
            <div className="border border-[#F79330] rounded-2xl px-2 md:px-8 py-6 flex items-center justify-between mt-2 bg-white dark:bg-[#23232A]">
              <p className="text-[#F79330] font-semibold text-lg mr-6">
                Buyer&apos;s Name
              </p>
              <div>
                <span className="w-3 h-3 rounded-full bg-[#051015] dark:bg-white mr-3 inline-block"></span>
                <span className="text-gray-900 dark:text-white font-semibold text-lg">
                  {singleOrder?.advertiser_first_name || user?.first_name}{" "}
                  {singleOrder?.advertiser_last_name ||
                    user?.last_name ||
                    "Mohammed Zyad Yousef"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Confirm Payment Received */}
        <div className="relative pl-8">
          <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-[#23232A] border-2 border-[#1D8751] flex items-center justify-center text-[#1D8751] font-bold text-lg">
            3
          </div>
          <span className="text-gray-900 dark:text-white font-semibold text-lg">
            Confirm payment is received.
          </span>
          <div className="text-md text-gray-500 dark:text-[#A3A3C2] mt-2">
            After confirming the payment, be sure to click Payment Received
            button below
          </div>
          <div className="flex gap-4 mt-6">
            <button className="bg-gray-100 dark:bg-[#23232A] text-gray-600 dark:text-[#A3A3C2] rounded-lg px-6 py-2 border border-gray-200 dark:border-[#35353E]">
              Appeal After 9:45
            </button>
            <button
              className={`${
                confirmOrder?.status === "matched"
                  ? "bg-gray-100 dark:bg-[#23232A]"
                  : "bg-[#1D8751] text-white"
              }  dark:text-white rounded-lg px-6 py-2 font-semibold ${(() => {
                const isThisTradeLoading =
                  confirmTradeLoading &&
                  !!confirmOrder?.id &&
                  lastActionTradeIdRef.current === confirmOrder.id;
                return isThisTradeLoading || !confirmOrder?.id || confirmOrder?.status === "matched"
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
                    isThisTradeLoading || !confirmOrder?.id || confirmOrder?.status === "matched"
                  );
                })()
              }
            >
              {getButtonText()}
            </button>
          </div>
        </div>
      </div>

      {/* Right: Chat */}
      <div className="md:col-span-1 pt-10 flex flex-col gap-6 mt-6 md:mt-0">
        <ChatBox
          tradeId={confirmOrder?.id || ""}
          userId={user?.id.toString() || ""}
          userName={
            confirmOrder?.advertiser_name || saveOrder?.advertiser_name || ""
          }
          autoreply={saveOrder?.auto_reply || ""}
          seller_photo={confirmOrder?.seller_photo || ""}
          buyer_photo={confirmOrder?.buyer_photo || ""}
          buyer={confirmOrder?.buyer || ""}
          seller={confirmOrder?.seller || ""}
          currentUserEmail={user?.email || ""}
          owner={confirmOrder?.owner || ""}
          sellerName={
            singleOrder?.advertiser_first_name &&
            singleOrder?.advertiser_last_name
              ? `${singleOrder.advertiser_first_name} ${singleOrder.advertiser_last_name}`
              : singleOrder?.advertiser_name ||
                confirmOrder?.advertiser_name ||
                "Seller"
          }
          buyerName={
            user?.email === confirmOrder?.buyer
              ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
                "You"
              : "Buyer"
          }
        />
        {/* Advertiser's Terms */}
        <section className="advertiser-terms rounded-lg p-4 bg-gray-50 dark:bg-[#23232B]">
          <div className="font-semibold text-lg mb-2 text-gray-900 dark:text-white flex items-center gap-2">
            Advertiser's Terms
            <AlertCircle className="w-5 h-5 text-[#E23D3A]" />
          </div>
          <div className="text-xs flex flex-col gap-2">
            <div className="text-[#1D8751]">
              {saveOrder?.terms_and_conditions}
            </div>
          </div>
        </section>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#23232A] rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-[#35353E]">
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
              <div className="bg-gray-50 dark:bg-[#18181D] rounded-xl p-4 mb-6 border border-gray-200 dark:border-[#35353E]">
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
          <div className="bg-white dark:bg-[#23232A] rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-[#35353E]">
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
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    feedbackRating === true
                      ? "bg-[#1D8751] text-white shadow-lg scale-105"
                      : "bg-gray-100 dark:bg-[#35353E] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#404040] hover:scale-105"
                  }`}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558-.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.833 0-1.612.453-1.918 1.227z"/>
                  </svg>
                  Positive
                </button>
                <button
                  onClick={() => setFeedbackRating(false)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    feedbackRating === false
                      ? "bg-[#E23D3A] text-white shadow-lg scale-105"
                      : "bg-gray-100 dark:bg-[#35353E] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#404040] hover:scale-105"
                  }`}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.73 5.25h1.035A7.465 7.465 0 0118 9.375a7.465 7.465 0 01-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218C7.74 15.724 7.366 15 8.25 15h3.126c.618 0 .991.724.725 1.282A7.471 7.471 0 0012 19.5a7.471 7.471 0 00-.1-3.218c-.266-.558.107-1.282.725-1.282H12.75c-.445 0-.72-.498-.523-.898a8.963 8.963 0 01.924-3.977c0-1.708-.476-3.305-1.302-4.666-.245-.403.028-.959.5-.959H15.73zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.833 0-1.612.453-1.918 1.227z"/>
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-[#35353E] rounded-lg bg-white dark:bg-[#18181D] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#1D8751] focus:border-transparent resize-none"
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
  );
};

export default FinalSell;
