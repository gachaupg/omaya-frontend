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
  confirmP2PTradeThunk,
} from "@/features/p2p/slices/orderSlice";
import { FileIcon, SendIcon } from "lucide-react";
import AppealModal from "./appeal";
import ChatBox from "./ChatBox";
import { showToast } from "@/lib/utils/toast";
import { handleCopy } from "@/features/p2p/components/Common/utils";
import { Dialog } from "@headlessui/react";
import { RefreshCw } from "lucide-react";

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
  const [isClient, setIsClient] = useState(false);
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

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

  // Auto-cancel when countdown reaches 0 and status is matched
  useEffect(() => {
    if (isAuthenticated) {
      if (confirmOrder?.status === "matched" && countdown === 0) {
        if (confirmOrder?.id) {
          dispatch(cancelP2POrderThunk(confirmOrder.id));
        }
      }
    }
  }, [confirmOrder?.status, countdown, confirmOrder?.id, dispatch]);

  useEffect(() => {
    const orderId = params.id as string;
    const orderToFetch = confirmOrder?.buy_order || confirmOrder?.sell_order;

    if (isAuthenticated && orderId) {
      dispatch(fetchConfirmOrder(orderId));
      if (orderToFetch) {
        dispatch(fetchSingleOrder(orderToFetch));
      }
      if (confirmOrder?.status === "completed") {
        showToast.success("Order Completed Successfully!");
        dispatch(fetchConfirmOrder(confirmOrder.id));
        setTimeout(() => {
          router.push("/dashboard/p2p");
        }, 2000);
      }
    }
  }, [params.id, dispatch]);

  // New useEffect to check for completed status and show success modal
  useEffect(() => {
    if (confirmOrder?.status === "completed" && !showSuccessModal) {
      setShowSuccessModal(true);
    }
  }, [confirmOrder?.status, showSuccessModal]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset countdown to displaySeconds when status is not 'matched'
  useEffect(() => {
    if (confirmOrder?.status !== "matched") {
      setCountdown(displaySeconds);
    }
  }, [confirmOrder?.status, displaySeconds]);

  // Get payment details from order data
  const paymentDetails = singleOrder?.payment_details?.[0] || null;

  // --- Calculation logic ---
  const sendAmount = Number(confirmOrder?.amount) || 0;
  const commissionRate = Number(singleOrder?.commission_rate) || 0;
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
    const orderId = params.id as string;
    if (orderId) {
      dispatch(fetchConfirmOrder(orderId));
    }
  };

  return (
    <div className="final-buy-container grid grid-cols-1 md:grid-cols-3 gap-6 p-2 md:p-6 min-h-screen">
      {/* Left Column: Main Info */}
      <div className="md:col-span-2 flex flex-col mt-6 md:mt-10 gap-6">
        <div className="flex items-center justify-between">
          <p className="text-white text-[13px]" style={{ fontSize: "13px" }}>
            Advertiser Information
          </p>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 bg-[#23232A] text-[#1D8751] rounded-lg px-2 py-1 border border-[#35353E] hover:bg-[#35353E] transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        {/* Advertiser Info */}
        <section className="advertiser-info rounded-[18px] p-2 flex items-center gap-4 border border-2 border-[#35353E]  ">
          <div className="icon rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold bg-[#1D8751] text-white">
            {singleOrder?.advertiser_first_name?.[0] || "A"}
          </div>
          <div>
            <div
              className="text-white text-[13px]"
              style={{ fontSize: "13px" }}
            >
              {singleOrder
                ? `${singleOrder.advertiser_first_name} ${singleOrder.advertiser_last_name}`
                : "Advertiser User Name"}
              <span className="text-[#E23D3A]">✔️</span>
            </div>
            <div className="text-xs text-[#788099]">
              {singleOrder?.user_total_buy_orders || 120} Orders |{" "}
              {singleOrder?.completion_rate || "99.20"}% Completion
            </div>
            <div className="text-xs text-[#1D8751]">
              Rating: 99% | Commission: {singleOrder?.commission_rate || "0.5"}%
            </div>
          </div>
          <div className="ml-auto flex gap-8 text-xs">
            <div>
              <span className="text-[13px] text-white">
                {singleOrder?.limit_duration || "10 Minutes"}
              </span>
              <br />
              <span className="text-[#788099]">Time limit</span>
            </div>
            <div>
              <span className="text-[13px] text-white">
                {singleOrder?.completion_time || "2 Minutes"}
              </span>
              <br />
              <span className="text-[#788099]">Avg. real-time</span>
            </div>
            <div>
              <span className="text-[13px] text-white">
                {singleOrder?.amount || "1,200"}{" "}
                {singleOrder?.currency || "USDT"}
              </span>
              <br />
              <span className="text-[#788099]">Available assets</span>
            </div>
          </div>
        </section>

        {/* Order Info */}
        <div className="flex items-center justify-between ">
          <div className="text-[13px] text-base text-white">Order Info</div>
          <div className="text-xs text-[#788099] text-[0.75rem]">
            Order Number:{" "}
            <button
              className="underline text-[#1D8751] cursor-pointer bg-transparent border-none p-0"
              onClick={() => handleCopy(singleOrder?.id)}
              aria-label="Copy order number"
            >
              {singleOrder?.id || "9346457687345"}
            </button>
          </div>
        </div>
        <section className="order-info rounded-[18px] p-2   border-2 border-[#35353E] ">
          <div className="flex flex-col md:flex-row gap-4">
            {/* I want to Send */}
            <div className="flex-1 flex flex-col mb-2 md:mb-0">
              <div className="mb-1 text-[#788099] text-[0.95rem] font-medium">
                I want to Send
              </div>
              <div className="flex items-center h-[46px] rounded-2xl border border-[#35353E] bg-[#23232A] px-2">
                <span className="text-[#1D8751] text-2xl mr-2">$</span>
                <span className="text-[#1D8751] text-xl font-semibold">
                  {formatAmount(sendAmount)}
                </span>
                <span className="ml-auto text-white text-base font-medium">
                  USD
                </span>
              </div>
            </div>
            {/* I want to Receive */}
            <div className="flex-1 flex flex-col mb-2 md:mb-0">
              <div className="mb-1 text-[#788099] text-[0.95rem] font-medium">
                I want to Receive
              </div>
              <div className="flex items-center h-[46px] rounded-2xl border border-[#35353E] bg-[#23232A] px-2">
                {/* Placeholder for Tether/USDT icon */}
                <span className="text-[#1D8751] text-2xl mr-2">&#x20BF;</span>
                <span className="text-[#1D8751] text-xl font-semibold">
                  {formatAmount(receiveAmount)}
                </span>
                <span className="ml-2 text-white text-base font-medium">
                  USDT
                </span>
              </div>
            </div>
            {/* Commission */}
            <div className="flex-1 flex flex-col">
              <div className="mb-1 text-[#788099] text-[0.95rem] font-medium">
                Commission
              </div>
              <div className="flex items-center h-[46px] rounded-2xl border border-[#35353E] bg-[#35353E] px-2">
                <span className="text-[#1D8751] text-2xl mr-2">$</span>
                <span className="text-[#1D8751] text-xl font-semibold">
                  {commissionRate}%
                </span>
                <span className="ml-auto text-white text-base font-medium">
                  USD
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Send Money To */}
        <section className="send-money rounded-[18px] p-2 md:p-4 ">
          <div className="flex justify-between   items-start mb-4 gap-2 md:gap-0">
            <div className=" text-[13px] flex-1 text-white">Send Money To</div>
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
          <div className="rounded-[18px] flex flex-col  p-2 md:p-4 gap-4 bg-[#1D1D23]">
            {/* Left: Bank Info */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-row gap-4">
                <div className="flex p-3 gap-2 w-full md:w-1/3 min-h-[220px] border border-[#3C3C47] rounded-2xl bg-[#18181D] mb-4 md:mb-0">
                  {/* Replace with actual logo if available */}
                  <div className="w-10 h-10  rounded-full bg-white flex items-center justify-center mb-2">
                    <span className="text-[#1D8751] font-bold">
                      {paymentDetails?.provider[0]}
                    </span>
                  </div>
                  <span className="text-white text-[13px] font-medium">
                    {paymentDetails?.provider}
                  </span>
                </div>
                <div className=" flex flex-col gap-4 w-full">
                  <div className="flex flex-col gap-4">
                    {/* Account Name */}
                    <div className="flex w-full items-center gap-3">
                      <div className=" w-full flex flex-col">
                        <span className="text-[#788099] w-32">
                          Account Name
                        </span>
                        <span className="flex-1 px-6 py-2 rounded-full border border-[#1D8751] text-[#1D8751] bg-transparent font-semibold text-lg flex items-center">
                          <span className="w-3 h-3 font-[13px] rounded-full bg-[#1D8751] inline-block mr-2"></span>
                          {paymentDetails?.account_name}
                        </span>
                      </div>
                      <button
                        className="ml-2 px-5 py-2 rounded-full border border-[#35353E] text-[#1D8751] bg-[#23232A] font-semibold flex items-center gap-2"
                        onClick={() => handleCopy(paymentDetails?.account_name)}
                      >
                        Copy
                        <svg
                          className="w-4 h-4"
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
                    <div className="flex w-full items-center gap-3">
                      <div className=" w-full flex flex-col">
                        <span className="text-[#788099] w-32">
                          Account Number
                        </span>
                        <span className="flex-1 px-6 py-2 rounded-full border border-[#1D8751] text-[#1D8751] bg-transparent font-semibold text-lg flex items-center">
                          <span className="w-3 h-3 font-[13px] rounded-full bg-[#1D8751] inline-block mr-2"></span>
                          {paymentDetails?.account_number}
                        </span>
                      </div>
                      <button
                        className="ml-2 px-5 py-2 rounded-full border border-[#35353E] text-[#1D8751] bg-[#23232A] font-semibold flex items-center gap-2"
                        onClick={() =>
                          handleCopy(paymentDetails?.account_number)
                        }
                      >
                        Copy
                        <svg
                          className="w-4 h-4"
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
                    <div className="flex items-center gap-3">
                      <div className=" w-full flex flex-col">
                        <span className="text-[#788099] w-32">
                          Transaction ID
                        </span>
                        <span className="flex-1 font-[13px] px-6 py-2 rounded-full border border-[#1D8751] text-[#1D8751] bg-transparent   flex items-center">
                          {singleOrder?.id}
                        </span>
                      </div>
                      <button
                        className="ml-2 px-5 py-2 font-[13px] rounded-full border border-[#35353E] text-[#1D8751] bg-[#23232A]  flex items-center gap-2"
                        onClick={() => handleCopy(singleOrder?.id)}
                      >
                        Copy
                        <svg
                          className="w-4 h-4"
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
                  <div className="rounded-2xl border border-[#1D8751] bg-[#18181D] p-6 mt-2 text-base flex flex-col gap-2">
                    <div className="flex items-center gap-3 text-white">
                      <span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block"></span>
                      Please send the money from your own account Only
                    </div>
                    <div className="flex items-center gap-3 text-white">
                      <span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block"></span>
                      Put transaction ID in the description field of the bank
                    </div>
                    <div className="flex items-center gap-3 text-white">
                      <span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block"></span>
                      Please note, If you do not follow above conditions, we
                      will reject your transaction and send you back your money.
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mt-4 mb-2 text-lg">
                    <span className="text-white">
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
                      className={`w-full md:w-auto flex-1 py-2 rounded-2xl border-2 border-[#3C3C47] text-lg  ${
                        confirmOrder?.status === "half-matched"
                          ? "bg-[#23232A] text-[#888]"
                          : "bg-transparent text-[#788099]"
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
                          ? "bg-[#23232A] text-[#888]"
                          : "bg-[#E23D3A] text-white"
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
            `${singleOrder?.advertiser_first_name} ${singleOrder?.advertiser_last_name}` ||
            ""
          }
          autoreply={singleOrder?.auto_reply || ""}
        />
        {/* Advertiser's Terms */}
        <section className="advertiser-terms rounded-lg p-4">
          <div className="font-semibold text-lg mb-2">
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
          <Dialog.Panel className="mx-auto w-full max-w-md rounded-2xl bg-[#23232A] text-white border border-[#35353E]">
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
                <Dialog.Title className="text-2xl font-bold text-white mb-4">
                  Trade Completed Successfully!
                </Dialog.Title>

                {/* Trade Details */}
                <div className="bg-[#18181D] rounded-xl p-4 mb-6 border border-[#35353E]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#A3A3C2]">Amount Sent:</span>
                    <span className="text-[#F79330] font-semibold">
                      ${formatAmount(sendAmount)} USD
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#A3A3C2]">Commission:</span>
                    <span className="text-[#1D8751] font-semibold">
                      {commissionRate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#A3A3C2]">Amount Received:</span>
                    <span className="text-[#1D8751] font-semibold">
                      {formatAmount(receiveAmount)} USDT
                    </span>
                  </div>
                </div>

                {/* Go to Dashboard Button */}
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push("/dashboard");
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

export default FinalSell;
