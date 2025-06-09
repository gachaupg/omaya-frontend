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
import { FileIcon, SendIcon } from "lucide-react";
import AppealModal from "./appeal";
import ChatBox from "./ChatBox";
import { showToast } from "@/lib/utils/toast";
import { handleCopy } from "../../../Common/utils";

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
  const [isClient, setIsClient] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);

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

  // Auto-cancel when countdown reaches 0 and status is matched
  useEffect(() => {
    if (confirmOrder?.status === "matched" && countdown === 0) {
      if (confirmOrder?.id) {
        dispatch(cancelP2POrderThunk(confirmOrder.id));
      }
    }
  }, [confirmOrder?.status, countdown, confirmOrder?.id, dispatch]);

  useEffect(() => {
    const orderId = params.id as string;
    if (orderId) {
      dispatch(fetchConfirmOrder(orderId));
    }
  }, [params.id, dispatch]);

  useEffect(() => {
    const orderToFetch = confirmOrder?.buy_order || confirmOrder?.sell_order;
    if (orderToFetch) {
      dispatch(fetchSingleOrder(orderToFetch));
    }
  }, [confirmOrder, dispatch]);


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
    if (confirmOrder?.id) {
      dispatch(cancelP2POrderThunk(confirmOrder.id));
    }
  };

  // Add handler for confirming trade
  const handleConfirmTrade = () => {
    const orderId = params.id as string;

    if (confirmOrder?.id) {
      dispatch(completeP2PTradeThunk(confirmOrder.id))
        .unwrap()
        .then(() => {
          showToast.success(
            "Trade completed successfully!",
            "You will be redirected to the dashboard"
          );
          dispatch(fetchConfirmOrder(confirmOrder.id));
          setTimeout(() => {
            router.push("/dashboard");
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

  const getButtonText = () => {

    if (confirmTradeLoading) return "Notifying seller...";
    return "Payments Received Notify Seller";
  };

 

  // if (!paymentDetails) {
  //   return (
  //     <div className="text-center p-4">
  //       <p>No payment details available for this order.</p>
  //     </div>
  //   );
  // }

  return (
    <div className="grid grid-cols-1 mt-10 md:grid-cols-3 gap-6 p-6 min-h-screen bg-[#18181D]">
      {/* Left: Timeline/Steps */}
      <div className="md:col-span-2 flex flex-col gap-8">
        {/* Step 1: Order Created */}
        <div className="relative pl-8 pb-8 border-l-2 border-[#35353E]">
          <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-[#23232A] border-2 border-[#1D8751] flex items-center justify-center text-[#1D8751] font-bold text-lg">
            1
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white font-semibold text-lg">
              Order Created
            </span>
            <span className="text-xs text-[#A3A3C2]">
              Order Number :
              <button
                className="text-[#1D8751] underline ml-1"
                onClick={() => handleCopy(singleOrder?.id)}
              >
                {singleOrder?.id}
              </button>
            </span>
          </div>
          <div className="flex gap-4 mt-4">
            <div className="flex flex-row items-center justify-between w-full  bg-[#35353E] rounded-xl px-6 py-2">
              <span className="text-[#F79330] text-lg font-bold">
                ${formatAmount(sendAmount)}
              </span>
              <span className="text-xs text-[#F79330]">USD</span>
            </div>
            <div className="flex f w-full flex-row  justify-between items-center bg-[#35353E] rounded-xl px-6 py-2">
              <span className="text-[#F79330] text-lg font-bold">
                {commissionRate}%
              </span>
              <span className="text-xs text-[#F79330]">Commission</span>
            </div>
            <div className="flex flex-row justify-between w-full items-center bg-[#35353E] rounded-xl px-6 py-2">
              <span className="text-[#1D8751] text-lg font-bold">
                {formatAmount(receiveAmount)}
              </span>
              <span className="text-xs text-[#A3A3C2]">USDT</span>
            </div>
          </div>
        </div>

        {/* Step 2: Confirm Payment From Buyer */}
        <div className="relative pl-8 pb-8 border-l-2 border-[#35353E]">
          <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-[#23232A] border-2 border-[#1D8751] flex items-center justify-center text-[#1D8751] font-bold text-lg">
            2
          </div>
          <span className="text-white font-semibold text-lg">
            Confirm Payment From Buyer
          </span>
          <div className="bg-[#23232A] rounded-2xl p-6 mt-4 flex flex-col gap-6 border border-[#31313C]">
            {/* Bank Info */}
            <div className="flex items-center gap-4 border border-[#35353E] rounded-xl px-4 py-3 w-fit mb-2">
              <div className="w-10 h-10 rounded-full text-black bg-white flex items-center justify-center overflow-hidden">
                {/* Use logo mapped from provider */}
                 {paymentDetails?.provider[0]}
              </div>
              <span className="text-white font-medium text-lg">
                {paymentDetails?.provider }
              </span>
            </div>
            {/* Account Name */}
            <div>
              <div className="text-[#A3A3C2] text-base mb-1">Account Name</div>
              <div className="flex items-center bg-[#35353E] rounded-full px-6 py-3">
                <span className="w-3 h-3 rounded-full bg-[#1D8751] mr-3 inline-block"></span>
                <span className="text-[#1D8751] font-semibold text-lg">
                  {paymentDetails?.account_name || "Omar Ali"}
                </span>
              </div>
            </div>
            {/* Account Number */}
            <div>
              <div className="text-[#A3A3C2] text-base mb-1">
                Account Number
              </div>
              <div className="flex items-center bg-[#35353E] rounded-full px-6 py-3">
                <span className="w-3 h-3 rounded-full bg-[#1D8751] mr-3 inline-block"></span>
                <span className="text-[#1D8751] font-semibold text-lg">
                  {paymentDetails?.account_number || "123456789"}
                </span>
              </div>
            </div>
            {/* Buyer's Name */}
            <div className="border-2 border-[#F6A948] rounded-xl px-2 md:px-2 py-2 flex items-center mt-2 bg-[#23232A]">
              <span className="text-[#F6A948] font-semibold text-xl mr-6">
                Buyer&apos;s Name
              </span>
              <span className="w-3 h-3 rounded-full bg-white mr-3 inline-block"></span>
              <span className="text-white font-semibold text-lg">
                {singleOrder?.advertiser_first_name || user?.first_name}{" "}
                {singleOrder?.advertiser_last_name ||
                  user?.last_name ||
                  "Mohammed Zyad Yousef"}
              </span>
            </div>
          </div>
        </div>

        {/* Step 3: Confirm Payment Received */}
        <div className="relative pl-8">
          <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-[#23232A] border-2 border-[#1D8751] flex items-center justify-center text-[#1D8751] font-bold text-lg">
            3
          </div>
          <span className="text-white font-semibold text-lg">
            Confirm payment is received.
          </span>
          <div className="text-xs text-[#A3A3C2] mt-2">
            After confirming the payment, be sure to click Payment Received
            button below
          </div>
          <div className="flex gap-4 mt-6">
            <button className="bg-[#23232A] text-[#A3A3C2] rounded-lg px-6 py-2 border border-[#35353E]">
              Appeal After 9:45
            </button>
            <button
              className={`${confirmOrder?.status === "matched" ? "bg-[#23232A]": "bg-[#1D8751]"} text-white rounded-lg px-6 py-2 font-semibold ${
                confirmTradeLoading ||
                !confirmOrder?.id ||
                confirmOrder?.status === "matched"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={handleConfirmTrade}
                disabled={
                  confirmTradeLoading ||
                  !confirmOrder?.id ||
                  confirmOrder?.status === "matched"
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
    </div>
  );
};

export default FinalSell;
