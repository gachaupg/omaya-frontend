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
  updateConfirmOrderStatus,
} from "@/features/p2p/slices/orderSlice";
import { FileIcon, SendIcon, RefreshCw, CopyIcon, AlertCircle } from "lucide-react";
import AppealModal from "./appeal";
import ChatBox from "./ChatBox";
import { showToast } from "@/lib/utils/toast";
import { handleCopy } from "../../../Common/utils";
import Image from "next/image";
import { useTradeStatusWebSocket } from "@/features/p2p/hooks/useTradeStatusWebSocket";

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
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCancelledModal, setShowCancelledModal] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // Ref to track previous status to prevent duplicate status updates
  const previousStatusRef = useRef<string | null>(null);

  // WebSocket status update callback - use useCallback to prevent reconnections
  const handleStatusUpdate = React.useCallback((status: any) => {
    console.log('🔔 WebSocket Status Update Received (TradeBuyOwner):', {
      receivedStatus: status,
      currentConfirmOrder: confirmOrder,
      tradeId: confirmOrder?.id
    });
    
    const newStatus = status.status;
    const oldStatus = previousStatusRef.current;
    
    console.log('📊 Status Comparison:', {
      newStatus,
      oldStatus,
      willUpdate: newStatus && oldStatus !== newStatus
    });
    
    // Only update if the status has actually changed
    if (newStatus && oldStatus !== newStatus) {
      // Update the ref to the new status
      previousStatusRef.current = newStatus;
      
      console.log('✅ Dispatching status update to Redux:', newStatus);
      // Update Redux store directly with WebSocket status
      dispatch(updateConfirmOrderStatus({ status: newStatus }));
      
      // Show toast notification for status changes
      if (oldStatus === "matched" && newStatus === "half-matched") {
        showToast.success("Status Updated", "Seller has notified payment sent");
      } else if (oldStatus === "half-matched" && newStatus === "completed") {
        showToast.success("Trade Completed!", "Transaction completed successfully");
      } else if (newStatus === "cancelled") {
        showToast.error("Trade Cancelled", "The trade has been cancelled");
      } else {
        showToast.success("Status Updated", `Trade status is now: ${newStatus}`);
      }
    } else {
      console.log('⏭️ Skipping status update (same status or invalid)');
    }
  }, [dispatch, confirmOrder]);

  // WebSocket for real-time trade status updates
  const { isConnected: statusWsConnected } = useTradeStatusWebSocket({
    tradeId: confirmOrder?.id || "",
    enabled: isAuthenticated && !!confirmOrder?.id,
    onStatusUpdate: handleStatusUpdate,
  });

  // Log WebSocket connection status
  useEffect(() => {
    console.log('🔌 WebSocket Connection Status (TradeBuyOwner):', {
      connected: statusWsConnected,
      tradeId: confirmOrder?.id,
      enabled: isAuthenticated && !!confirmOrder?.id,
      isAuthenticated,
      hasTradeId: !!confirmOrder?.id
    });
  }, [statusWsConnected, confirmOrder?.id, isAuthenticated]);

  // Initialize previousStatusRef with current status when confirmOrder first loads
  useEffect(() => {
    if (confirmOrder?.status && previousStatusRef.current === null) {
      previousStatusRef.current = confirmOrder.status;
    }
  }, [confirmOrder?.status]);

  // Log confirmOrder changes for debugging
  useEffect(() => {
    console.log('🔄 confirmOrder Updated in TradeBuyOwner:', {
      status: confirmOrder?.status,
      id: confirmOrder?.id,
      amount: confirmOrder?.amount,
      commission_rate: confirmOrder?.commission_rate,
      fullOrder: confirmOrder
    });
  }, [confirmOrder]);

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
  }, [confirmOrder?.buy_order, confirmOrder?.sell_order, dispatch, isAuthenticated, singgleuseid]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset countdown to displaySeconds when status is not 'matched'
  useEffect(() => {
    if (confirmOrder?.status !== "matched") {
      setCountdown(displaySeconds);
    }
  }, [confirmOrder?.status, displaySeconds]);

  // Show success modal when trade is completed
  useEffect(() => {
    console.log('🎉 Checking if should show success modal:', {
      currentStatus: confirmOrder?.status,
      isCompleted: confirmOrder?.status === "completed",
      showSuccessModal
    });
    
    if (confirmOrder?.status === "completed") {
      console.log('✅ Trade completed! Showing success modal');
      setShowSuccessModal(true);
      // Auto-redirect to dashboard after 10 seconds
      setTimeout(() => {
        window.location.href = "/dashboard/p2p/";
      }, 10000);
    }
  }, [confirmOrder?.status, showSuccessModal]);

  // Show cancelled modal when trade is cancelled
  useEffect(() => {
    console.log('❌ Checking if should show cancelled modal:', {
      currentStatus: confirmOrder?.status,
      isCancelled: confirmOrder?.status === "cancelled",
      showCancelledModal
    });
    
    if (confirmOrder?.status === "cancelled") {
      console.log('🚫 Trade cancelled! Showing cancelled modal');
      setShowCancelledModal(true);
      // Auto-redirect to dashboard after 10 seconds
      setTimeout(() => {
        window.location.href = "/dashboard/p2p/";
      }, 10000);
    }
  }, [confirmOrder?.status, showCancelledModal]);

  // Log button state based on status
  useEffect(() => {
    const isButtonDisabled = 
      confirmTradeLoading ||
      !confirmOrder?.id ||
      confirmOrder?.status === "matched" ||
      confirmOrder?.status === "completed";
    
    const buttonText = 
      confirmTradeLoading 
        ? "Processing..." 
        : confirmOrder?.status === "half-matched" 
        ? "Payment Received, Release USDT"
        : confirmOrder?.status === "completed"
        ? "Trade Completed"
        : "Waiting for Buyer Payment";
    
    console.log('🔘 Payment Received Button State:', {
      status: confirmOrder?.status,
      isDisabled: isButtonDisabled,
      buttonText,
      confirmTradeLoading,
      hasOrderId: !!confirmOrder?.id
    });
  }, [confirmOrder?.status, confirmTradeLoading, confirmOrder?.id]);

  // Get payment details from order data
  const paymentDetails = saveOrder?.payment_details?.[0] || null;

  // --- Calculation logic ---
  const sendAmount = Number(confirmOrder?.amount) || 0;
  const commissionRate = Number(confirmOrder?.commission_rate) || 0;
  const orderType = singleOrder?.order_type || "buy";
  let receiveAmount = sendAmount;

  if (orderType === "buy") {
    receiveAmount = sendAmount / commissionRate;
  } else {
    receiveAmount = sendAmount * commissionRate;
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

  const handleRefresh = () => {
    const orderId = params?.id as string;
    if (orderId) {
      dispatch(fetchConfirmOrder(orderId));
    }
  };

  const handleConfirmTrade = () => {
    const orderId = params?.id as string;

    if (confirmOrder?.id) {
      dispatch(completeP2PTradeThunk(confirmOrder.id))
        .unwrap()
        .then(() => {
          showToast.success(
            "Trade completed successfully!",
            "You will be redirected to the dashboard"
          );
          // WebSocket will automatically update the status
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
             
             
            </div>
            <div className="flex items-center gap-1.5">
            <svg width="24" height="24" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              <rect width="64" height="64" fill="none"/>
              <path 
                d="M22 8h20a2 2 0 0 1 2 2v40l-4-3.5-4 3.5-4-3.5-4 3.5-4-3.5-4 3.5V10a2 2 0 0 1 2-2z" 
                fill="none" 
                stroke="#1D8751" 
                strokeWidth="4" 
                strokeLinejoin="round"
              />
              <line x1="24" y1="20" x2="40" y2="20" stroke="#1D8751" strokeWidth="4" strokeLinecap="round"/>
              <line x1="24" y1="28" x2="40" y2="28" stroke="#1D8751" strokeWidth="4" strokeLinecap="round"/>
              <line x1="24" y1="36" x2="32" y2="36" stroke="#1D8751" strokeWidth="4" strokeLinecap="round"/>
            </svg>

              <span className="text-[14px] text-gray-500 dark:text-[#A3A3C2]">
                Order Number :
                <button
                  className="text-[#1D8751] underline ml-1"
                  onClick={() => handleCopy(singleOrder?.id)}
                >
                  {confirmOrder?.id}
                </button>
              </span>
              <CopyIcon className="w-4 h-4 text-[#1D8751] ml-1"  onClick={() => handleCopy(singleOrder?.id)}/>
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
                <span className="text-[#1D8751] text-xl">$ {confirmOrder?.commission_rate ?? commissionRate}</span>
                <span className="text-sm text-[#051015] dark:text-[#F79330]">USD</span>
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
                    {formatAmount((saveOrder?.amount ?? 0) )}
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
            Confirm Payment is from {singleOrder?.advertiser_first_name || user?.first_name}{" "}
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
          <div className="text-md text-gray-500 dark:text-[#A3A3C2] mt-2 flex items-center gap-2">
            After confirming the payment, be sure to click Payment Received button below
            
          </div>
          <div className="flex gap-4 mt-6">
            <button 
              className="bg-gray-100 dark:bg-[#23232A] text-gray-600 dark:text-[#A3A3C2] rounded-lg px-6 py-2 border border-gray-200 dark:border-[#35353E]"
              onClick={() => setShowAppealModal(true)}
            >
              Appeal
            </button>
            <button
              className={`${
                confirmOrder?.status === "matched" || confirmOrder?.status === "completed"
                  ? "bg-gray-100 dark:bg-[#23232A] text-gray-600 dark:text-[#A3A3C2]"
                  : "bg-[#1D8751] text-white"
              } rounded-lg px-6 py-2 font-semibold ${
                confirmTradeLoading ||
                !confirmOrder?.id ||
                confirmOrder?.status === "matched" ||
                confirmOrder?.status === "completed"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={handleConfirmTrade}
              disabled={
                confirmTradeLoading ||
                !confirmOrder?.id ||
                confirmOrder?.status === "matched" ||
                confirmOrder?.status === "completed"
              }
            >
              {confirmTradeLoading 
                ? "Processing..." 
                : confirmOrder?.status === "half-matched" 
                ? "Payment Received, Release USDT"
                : confirmOrder?.status === "completed"
                ? "Trade Completed"
                : "Waiting for Buyer Payment"}
            </button>
          </div>
        </div>
      </div>

      {/* Right: Chat */}
      <div className="md:col-span-1 pt-10 flex flex-col gap-6 mt-6 md:mt-0">
        <ChatBox
          tradeId={confirmOrder?.id || ""}
          userId={user?.id.toString() || ""}
          userName={confirmOrder?.advertiser_name || saveOrder?.advertiser_name || ""}
          autoreply={saveOrder?.auto_reply || ""}
          seller_photo={confirmOrder?.seller_photo || ""}
          buyer_photo={confirmOrder?.buyer_photo || ""}
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
                    {commissionRate}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-[#A3A3C2]">
                    Amount Received:
                  </span>
                  <span className="text-[#1D8751] font-semibold">
                    {formatAmount(sendAmount)} USDT
                  </span>
                </div>
              </div>

              {/* Go to Dashboard Button */}
              <button
                onClick={() => {
                  setShowSuccessModal(false);
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
      )}

      {/* Appeal Modal */}
      <AppealModal
        open={showAppealModal}
        onClose={() => setShowAppealModal(false)}
        tradeId={confirmOrder?.id || ""}
      />

      {/* Cancelled Modal */}
      {showCancelledModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#23232A] rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-[#35353E]">
            <div className="text-center">
              {/* Cancelled Icon */}
              <div className="w-16 h-16 bg-[#E23D3A] rounded-full flex items-center justify-center mx-auto mb-6">
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>

              {/* Cancelled Title */}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Trade Cancelled
              </h2>

              {/* Message */}
              <p className="text-gray-600 dark:text-[#A3A3C2] mb-6">
                This trade has been cancelled. If you have any questions or concerns, please contact support.
              </p>

              {/* Go to Dashboard Button */}
              <button
                onClick={() => {
                  setShowCancelledModal(false);
                  window.location.href = "/dashboard/p2p/";
                }}
                className="w-full bg-[#1D8751] text-white rounded-lg px-6 py-3 font-semibold hover:bg-[#167a45] transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalSell;
