"use client";
import React, { useEffect, useState, useRef } from "react";
import { tokens } from "@/styles/tokens";
import { P2POrder } from "@/features/p2p/types";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import AppealModal from "./appeal";
import ChatBox from "./ChatBox";
import { showToast } from "@/lib/utils/toast";
import { handleCopy } from "@/features/p2p/components/Common/utils";
import { AlertCircle, Copy, RefreshCw } from "lucide-react";
import { Dialog } from "@headlessui/react";
import { useTradeStatusWebSocket } from "@/features/p2p/hooks/useTradeStatusWebSocket";

interface FinalBuyProps {
  orderData?: P2POrder;
}

const FinalBuy: React.FC<FinalBuyProps> = ({ orderData }) => {
  const params = useParams();
  const searchParams = useSearchParams();
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
  const [isClient, setIsClient] = useState(false);
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const [showCancelMsg, setShowCancelMsg] = useState(false);
  const router = useRouter();

  // WebSocket status update callback - use useCallback to prevent reconnections
  const handleStatusUpdate = React.useCallback((status: any) => {
   
    
    const oldStatus = confirmOrder?.status;
    const newStatus = status.status;
    
    // Always refresh if we have a valid status update
    if (confirmOrder?.id && newStatus) {
      
      // Show toast notification for status changes
      if (oldStatus !== newStatus) {
        if (oldStatus === "matched" && newStatus === "half-matched") {
          showToast.success("Status Updated", "Payment notification sent to seller");
        } else if (oldStatus === "half-matched" && newStatus === "completed") {
          showToast.success("Trade Completed!", "Transaction completed successfully");
        } else if (newStatus === "cancelled") {
          showToast.error("Trade Cancelled", "The trade has been cancelled");
        } else {
          showToast.success("Status Updated", `Trade status is now: ${newStatus}`);
        }
      } else {
      }
      
      dispatch(fetchConfirmOrder(confirmOrder.id))
        .unwrap()
        .then((updatedOrder) => {
        })
        .catch((error) => {
        });
    } else {
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
      setCountdown((prev) => {
        if (prev <= 1) {
          // When countdown reaches 0, auto-cancel the transaction
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
    


    if (isAuthenticated && orderId) {
      
      
      dispatch(fetchConfirmOrder(orderId))
        .unwrap()
        .then((result) => {
        })
        .catch((error) => {
        });
    } else {
    }
  }, [params?.id, dispatch, isAuthenticated]);

  // Separate useEffect for fetching singleOrder when confirmOrder is available
  useEffect(() => {
    const orderToFetch = confirmOrder?.buy_order || confirmOrder?.sell_order;

    if (isAuthenticated && orderToFetch && !singleOrder?.id) {
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

  // Show success modal when trade is completed
  useEffect(() => {
    if ((confirmOrder?.status as string) === "completed") {
      setShowSuccessModal(true);
    }
  }, [confirmOrder?.status]);

  // Get payment details from order data
  const paymentDetails = singleOrder?.payment_details?.[0];
  // --- Calculation logic ---
  const sendAmount = Number(confirmOrder?.amount ) || 0;
  const commissionRate = Number(confirmOrder?.commission_rate) || Number(commissionFromUrl) || 0;
  const orderType = singleOrder?.order_type || "buy";
  let receiveAmount = sendAmount;

  if (orderType === "buy") {
    // For buy orders, multiply by commission rate (assuming rate is in decimal form, e.g., 0.98 for 98%)
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
      dispatch(confirmP2PTradeThunk(confirmOrder.id))
        .unwrap()
        .then(() => {
          showToast.success(
            "Trade confirmed successfully!",
            "Waiting for seller confirmation"
          );
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

  const handleRefresh = () => {
    const orderId = params?.id as string;
    if (orderId) {
      dispatch(fetchConfirmOrder(orderId));
    }
  };

  return (
    <div className="final-buy-container grid grid-cols-1 md:grid-cols-3 gap-6 p-2 md:p-6 min-h-screen bg-[#EEF1F4] dark:bg-[#18181D]">
      {/* Left Column: Main Info */}
      <div className="md:col-span-2 flex flex-col mt-6  gap-1">
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
          <div className="flex items-center gap-3">
            <p
              className="text-gray-900 dark:text-white text-[13px]"
              style={{ fontSize: "16px" }}
            >
              Advertiser Info
            </p>
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
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 bg-white dark:bg-[#18181D] text-[#1D8751] rounded-lg px-2 py-1 border border-[#E8EFF5] dark:border-[#35353E] hover:bg-gray-200 dark:hover:bg-[#35353E] transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        {/* Advertiser Info */}
        <section className=" rounded-[18px] p-4 flex items-center gap-4  border-2 border-[#E8EFF5] dark:border-[#35353E] bg-gray-50 dark:bg-[#18181D] mb-2 ">
          <div className="flex flex-col justify-start gap-2">
            <div className="flex items-center gap-2">
              <div className="icon rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold bg-[#1D8751] text-white">
             {singleOrder?.seller_photo ?   <img className="w-8 h-8 rounded-full" src={singleOrder?.seller_photo || ""} alt="" /> : <span className="text-[#1D8751] font-bold text-lg">{singleOrder?.advertiser_name?.[0] || "A"}</span>}
              </div>
              <div
                className="text-gray-900 dark:text-white text-sm"
              >
                {singleOrder?.advertiser_name || 
                 singleOrder?.advertiser_first_name}
                <span className="text-[#E23D3A]">✔️</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 dark:text-[#788099]">
                {singleOrder?.user_total_buy_orders || 120} Orders |{" "}
                {singleOrder?.completion_rate || "99.20"}% Completion
              </div>
              <div className="text-sm text-[#1D8751]">
                Rating: 99% | Commission: {commissionFromUrl ||confirmOrder?.commission_rate}Commission
              </div>
            </div>

          </div>

          <div className="ml-auto flex gap-8 text-md">
            <div>
              <span className="text-sm text-gray-900 dark:text-white mb-2">
                {singleOrder?.limit_duration || "10 Minutes"}
              </span>
              <br />
              <span className="text-gray-500 dark:text-[#788099]">
                Time limit
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-900 dark:text-white mb-2">
                {singleOrder?.completion_time || singleOrder?.limit_duration}
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
          <div className="text-xs text-gray-500 dark:text-[#788099] text-[0.75rem]">
            Order Number:{" "}
            <span
              className="underline text-[#1D8751] cursor-pointer"
              onClick={() => handleCopy(singleOrder?.id || singleOrder?.buy_order)}
            >
              {singleOrder?.id || "9346457687345"}
            </span>
          </div>
        </div>
        <section className="order-info rounded-[18px] p-4 border-2 border-[#E8EFF5] dark:border-[#35353E] bg-gray-50 dark:bg-[#18181D] ">
          <div className="flex flex-col md:flex-row gap-4">
            {/* I want to Send */}
            <div className="flex-1 flex flex-col mb-2 md:mb-0">
              <div className="mb-1 text-gray-600 dark:text-[#788099] text-[0.95rem] font-medium">
                I want to Send
              </div>
              <div className="flex items-center h-[46px] rounded-2xl border border-[#E8EFF5] dark:border-[#35353E] bg-white dark:bg-[#18181D] px-2">
                <span className="text-[#1D8751] text-2xl mr-2">$</span>
                <span className="text-[#1D8751] text-xl font-semibold">
                  {formatAmount(sendAmount) }
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
              <div className="flex items-center h-[46px] rounded-2xl border border-[#E8EFF5] dark:border-[#35353E] bg-white dark:bg-[#18181D] px-2">
                {/* Placeholder for Tether/USDT icon */}
                <span className="text-[#1D8751] text-2xl mr-2">
                  <img
                    src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
                    alt=""
                  />
                </span>
                <span className="text-[#1D8751] text-xl font-semibold">
                  {formatAmount(receiveAmount)}
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
              <div className="flex items-center h-[46px] rounded-2xl border border-[#E8EFF5] dark:border-[#35353E] bg-white dark:bg-[#35353E] px-2">
                <span className="text-[#1D8751] text-2xl mr-2">$</span>
                <span className="text-[#1D8751] text-xl font-semibold">
                  {commissionFromUrl || confirmOrder?.commission_rate}
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
          <div className="flex flex-col md:flex-row justify-between w-full items-start mb-4 gap-2 md:gap-0">
            <div className="text-lg flex-1 text-gray-900 dark:text-white">
              Send Money To
            </div>
            <div className="text-xs flex items-center gap-1">
              <span className="text-[#1D8751]">Transaction time:</span>
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
          <div className="rounded-[18px] flex flex-col p-2 md:p-4 gap-4 bg-gray-50 dark:bg-[#18181D] border-1 border-[#E8EFF5] dark:border-[#35353E]">
            {/* Left: Bank Info */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex flex-row gap-1 p-3 w-full md:w-1/3 min-h-[120px] md:min-h-[220px] border border-[#E8EFF5] dark:border-[#3C3C47] rounded-2xl bg-white dark:bg-[#18181D] mb-4 md:mb-0">
                  {/* Replace with actual logo if available */}
                  <div className="w-5 h-5 rounded-full bg-[#E8EFF5] dark:bg-white flex items-center justify-center mb-2">
                    <span className="text-[#1D8751] font-bold">
                      {paymentDetails?.provider[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="text-gray-900 dark:text-white text-[13px] font-medium">
                    {paymentDetails?.provider}
                  </span>
                </div>
                <div className="flex flex-col gap-4 w-full">
                  <div className="flex flex-col gap-4">
                    {/* Account Name */}
                    <div>
                        <p className="text-[#788099] w-32 mb-2">
                          Account Name
                        </p>
                      <div className="w-full flex gap-4">
                        <p className="flex-1 px-6 py-2 rounded-full border border-[#1D8751] text-[#1D8751] bg-[#E8EFF5] dark:bg-[#35353E] font-semibold text-lg flex items-center">
                          <span className="w-3 h-3 font-[13px] rounded-full bg-[#1D8751] inline-block mr-2"></span>
                          {paymentDetails?.account_name}
                        </p>
                        <button
                        className="w-full md:w-auto mt-2 md:mt-0 px-5 py-2 rounded-full border border-[#E8EFF5] dark:border-[#35353E] text-[#1D8751] bg-[#E8EFF5] dark:bg-[#35353E] font-semibold flex items-center justify-center gap-2"
                        onClick={() =>
                          handleCopy(paymentDetails?.account_name || "")
                        }
                      >
                        Copy
                        <Copy className="w-4 h-4" />
                      </button>
                      </div>
                    </div>
                    {/* Account Number */}
                    <div>
                        <p className="text-[#788099] w-32 mb-2">
                          Account Number
                        </p>
                      <div className="w-full flex gap-4">
                        <p className="flex-1 px-6 py-2 rounded-full border border-[#1D8751] text-[#1D8751] bg-[#E8EFF5] dark:bg-[#35353E] font-semibold text-lg flex items-center">
                          <span className="w-3 h-3 font-[13px] rounded-full bg-[#1D8751] inline-block mr-2"></span>
                          {paymentDetails?.account_number}
                        </p>
                        <button
                          className="w-full md:w-auto mt-2 md:mt-0 px-5 py-2 rounded-full border border-[#E8EFF5] dark:border-[#35353E] text-[#1D8751] bg-[#E8EFF5] dark:bg-[#35353E] font-semibold flex items-center justify-center gap-2"
                          onClick={() =>
                            handleCopy(paymentDetails?.account_number || "")
                          }
                        >
                          Copy
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {/* Transaction ID */}
                    <div>
                        <p className="text-[#788099] w-32 text mb-2">
                          Transaction ID
                        </p>
                      <div className="w-full flex gap-4">
                        <p className="flex-1 font-[13px] px-6 py-2 rounded-full border border-[#1D8751] text-[#1D8751] bg-[#E8EFF5] dark:bg-[#35353E] flex items-center">
                          {singleOrder?.id}
                        </p>
                        <button
                          className="w-full md:w-auto mt-2 md:mt-0 px-5 py-2 font-[13px] rounded-full border border-[#E8EFF5] dark:border-[#35353E] text-[#1D8751] bg-[#E8EFF5] dark:bg-[#35353E] flex items-center justify-center gap-2"
                          onClick={() => handleCopy(singleOrder?.id || "")}
                        >
                          Copy
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col  gap-4">
                <div className="flex-1">
                  <div className="rounded-2xl border border-[#1D8751] bg-white dark:bg-[#18181D] p-6 mt-2 text-base flex flex-col gap-2">
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
                      className={`w-full md:w-auto flex-1 py-2 rounded-2xl border-2 border-[#E8EFF5] dark:border-[#3C3C47] text-lg  ${
                        confirmOrder?.status === "half-matched"
                          ? "bg-white dark:bg-[#23232A] text-gray-400 dark:text-[#888]"
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
                      className={`w-full md:w-auto flex-1 py-2 rounded-2xl text-lg  ${
                        confirmOrder?.status === "half-matched"
                          ? "bg-white dark:bg-[#23232A] text-gray-400 dark:text-[#888]"
                          : "bg-[#1D8751] text-white"
                      } ${
                        confirmTradeLoading
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
                        : "Money sent, notify seller"}
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
          userName={singleOrder?.advertiser_name || singleOrder?.advertiser_first_name || ""}
          autoreply={singleOrder?.auto_reply || ""}
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
        <section className="advertiser-terms rounded-lg p-4 bg-white dark:bg-[#23232B]">
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
      {showCancelMsg && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-[#23232A] text-gray-900 dark:text-white px-6 py-3 rounded-xl shadow-lg z-50 border border-[#E23D3A] text-[13px]">
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
          <Dialog.Panel className="mx-auto w-full max-w-md rounded-2xl bg-white dark:bg-[#23232A] text-gray-900 dark:text-white border border-[#E8EFF5] dark:border-[#35353E]">
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
                <div className="bg-gray-50 dark:bg-[#18181D] rounded-xl p-4 mb-6 border border-[#E8EFF5] dark:border-[#35353E]">
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
                    // router.push("/dashboard");
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
  );
};

export default FinalBuy;
