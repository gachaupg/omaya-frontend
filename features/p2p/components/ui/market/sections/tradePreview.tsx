import React, { useState, useEffect } from "react";
import { MarketRow } from "../types";
import { validateBalance } from "@/utils/balanceValidator";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { fetchWallets } from "@/features/p2p/slices/walletSlice";
import { getTransactionSummary, matchP2POrder } from "@/features/p2p/api";
import { TransactionSummary, OrderMatchRequest } from "@/features/p2p/types";
import { useRouter } from "next/navigation";
import { RootState } from "@/store/rootReducer";
import Loader from "../../../Common/Loader";
import { showToast } from "@/lib/utils/toast";

interface TradePreviewProps {
  advertiserData: MarketRow;
  onClose?: () => void;
  tradeType?: "buy" | "sell";
}

const paymentOptions = [
  { value: "bank", label: "Bank" },
  { value: "mobile", label: "Mobile" },
  { value: "merchant", label: "Merchant" },
];

const TradePreview: React.FC<TradePreviewProps> = ({
  advertiserData,
  onClose,
  tradeType,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { data: wallets, loading: walletLoading } = useSelector(
    (state: RootState) => state.wallets || { data: null, loading: false }
  );
  const [transactionSummary, setTransactionSummary] =
    useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sendAmount, setSendAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isAmountValid, setIsAmountValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [numericAmount, setNumericAmount] = useState(0);

  const commissionRate = parseFloat(advertiserData.commission);
  const minAmount = advertiserData.minAmount;
  const maxAmount = advertiserData.maxAmount;

  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          setLoading(true);
          dispatch(fetchWallets());
          const summary = await getTransactionSummary();
          setTransactionSummary(summary);
        } catch (error) {
          // Error handling
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [dispatch, isAuthenticated]);

  // Get USDT wallet balance from the new wallet response structure
  const walletBalance = wallets?.wallet?.currency === "USDT" 
    ? parseFloat(wallets.wallet.balance) 
    : 0;

  const handleSendAmountChange = (value: string) => {
    setSendAmount(value);

    if (!value) {
      setIsAmountValid(true);
      setErrorMessage("");
      setReceiveAmount("");
      return;
    }

    const numericAmount = parseFloat(value);
    setNumericAmount(numericAmount);

    // Only validate balance for sell orders
    if (tradeType === "sell") {
      const validation = validateBalance({
        walletBalance,
        transactionSummary,
        amount: numericAmount,
        minAmount,
        maxAmount,
        tradeType,
      });

      setIsAmountValid(validation.isValid);
      setErrorMessage(validation.errorMessage || "");

      if (!validation.isValid) {
        setReceiveAmount("");
        return;
      }
    } else {
      // For buy orders, only check min/max amounts
      if (numericAmount < minAmount) {
        setIsAmountValid(false);
        setErrorMessage(`Minimum amount is ${minAmount} USDT`);
        setReceiveAmount("");
        return;
      }
      if (numericAmount > maxAmount) {
        setIsAmountValid(false);
        setErrorMessage(`Maximum amount is ${maxAmount} USDT`);
        setReceiveAmount("");
        return;
      }
      setIsAmountValid(true);
      setErrorMessage("");
    }

    // Calculate receive amount based on trade type
    const calculatedReceive =
      tradeType === "buy"
        ? (numericAmount * commissionRate).toFixed(2)
        : (numericAmount / commissionRate).toFixed(2);
    setReceiveAmount(calculatedReceive);
  };

  const handleReceiveAmountChange = (value: string) => {
    setReceiveAmount(value);
    const numericAmount = parseFloat(value);
    setNumericAmount(numericAmount);
    const calculatedSend =
      tradeType === "buy"
        ? (numericAmount / commissionRate).toFixed(2)
        : (numericAmount * commissionRate).toFixed(2);
    setSendAmount(calculatedSend);
  };

  const isFormValid = () => {
    if (!sendAmount || !paymentMethod) {
      return false;
    }
    return isAmountValid;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      if (!sendAmount) {
        setErrorMessage("Please enter an amount");
        showToast.error("Validation Error", "Please enter an amount");
      } else if (!paymentMethod) {
        setErrorMessage("Please select a payment method");
        showToast.error("Validation Error", "Please select a payment method");
      }
      return;
    }

    try {
      setIsSubmitting(true);
      const orderData: OrderMatchRequest = {
        id: advertiserData.id,
        advertiser_first_name: advertiserData.advertiser.split(" ")[0] || "",
        advertiser_last_name: advertiserData.advertiser.split(" ")[1] || "",
        advertiser_email: "", // This should come from the advertiser data
        asset: "TRON",
        order_type: tradeType === "buy" ? "sell" : "buy",
        currency: "USDT",
        amount: sendAmount,
        min_order_amount: advertiserData.minAmount.toString(),
        max_order_amount: advertiserData.maxAmount.toString(),
        commission_rate: advertiserData.commission,
        exchange_rate: advertiserData.commission,
        status: "pending",
        created_on: new Date().toISOString(),
        limit_duration: advertiserData.timeLimit,
        completion_time: advertiserData.timeLimit,
        completion_rate: advertiserData.completion,
        terms_and_conditions: advertiserData.terms_and_conditions,
        auto_reply: advertiserData.autoReply || "",
        user_total_sell_orders: null,
        user_total_buy_orders: advertiserData.orders,
        total_trades_as_buyer: 0,
        total_trades_as_seller: 0,
        payment_details: advertiserData.payment_details || [],
      };

      const response = await matchP2POrder(advertiserData.id, orderData);
      // Navigate with state using URL search params
      const searchParams = new URLSearchParams();
      searchParams.set(
        "orderData",
        JSON.stringify({
          order_type: orderData.order_type === "buy" ? "sell" : "buy",
        })
      );

      router.push(
        `/p2p/${advertiserData.id}/matched?${searchParams.toString()}`
      );
    } catch (error: any) {
      let errorMessage = "";

      if (error.response?.data) {
        errorMessage =
          error.response.data.error ||
          error.response.data.message ||
          error.response.data;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrorMessage(errorMessage);
      showToast.error("Order Creation Failed", errorMessage);
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    return (
      <>
        {/* Main Content Section */}
        <div className="flex gap-6">
          {/* Left Panel */}
          <div className="flex-1 flex flex-col gap-3">
          {/* Advertiser Info */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold bg-[#1D8751] text-white">
              {advertiserData.advertiserInitials}
            </div>
            <div>
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                {advertiserData.advertiser}
                <div className="bg-[#E59906] text-base w-3.5 h-3.5 rounded-full"></div>
              </div>
              <div className="text-sm font-medium flex items-center gap-2 text-[#1D8751]">
                <span>{advertiserData.orders} Orders</span>
                <span className="text-gray-400 dark:text-[#788099]">|</span>
                <span>{advertiserData.completion} Completion</span>
                <span className="ml-1 text-[#1D8751]">👍 95%</span>
              </div>
            </div>
          </div>
            <div className="flex gap-6">
              <div>
                <div className="text-base font-semibold text-gray-900 dark:text-white">
                  {advertiserData.timeLimit}
                </div>
                <div className="text-xs text-gray-500 dark:text-[#788099]">
                  Time limit
                </div>
              </div>
              <div>
                <div className="text-base font-semibold text-gray-900 dark:text-white">
                  {advertiserData.avgRealiseTime}
                </div>
                <div className="text-xs text-gray-500 dark:text-[#788099]">
                  Avg. realise time
                </div>
              </div>
              <div>
                <div className="text-base font-semibold text-gray-900 dark:text-white">
                  {advertiserData.available}
                </div>
                <div className="text-xs text-gray-500 dark:text-[#788099]">
                  Available assets
                </div>
              </div>
            </div>
            <div className="rounded-xl h-full p-3 border border-gray-300 dark:border-[#35353E] bg-gray-100 dark:bg-[#23242A]">
              <div className="flex items-center gap-2 mb-1">
                <svg 
                 xmlns="http://www.w3.org/2000/svg" 
                 width="20" 
                 height="20" 
                 viewBox="0 0 24 24" 
                 fill="none" 
                 stroke="currentColor" 
                 strokeWidth="2" 
                 strokeLinecap="round" 
                 strokeLinejoin="round"
                 className="text-[#E23D3A]"
                 >
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" x2="12" y1="8" y2="12"/>
                <line x1="12" x2="12.01" y1="16" y2="16"/>
                </svg>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Advertiser's Terms
                </span>
                <span className="text-[#E23D3A] font-medium">
                  (Please read carefully)
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-[#788099]">
                {advertiserData.terms_and_conditions}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 flex flex-col gap-3">
              {/* Commission */}
            <div className="text-left text-base font-medium text-gray-900 dark:text-white mt-4">
              Commission:{" "}
              <span className="text-[#1D8751]">{advertiserData.commission}</span>
            </div>
            {/* I Want to Send */}
            <div className="rounded-xl p-2 flex flex-col gap-1 border border-gray-300 dark:border-[#35353E] bg-gray-100 dark:bg-[#23242A]">
              <div className="text-sm text-gray-500 dark:text-[#788099]">
                I Want to Send
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-500 dark:text-[#788099] pl-2">
                  Range: {minAmount}-{maxAmount} USDT
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl text-[#1D8751]">$</span>
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => handleSendAmountChange(e.target.value)}
                    placeholder="220"
                    className={`flex-1 bg-transparent text-xl font-semibold focus:outline-none rounded-xl px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#788099] ${
                      !isAmountValid && sendAmount
                        ? "border border-red-500"
                        : ""
                    }`}
                  />
                  <select
                    className="rounded px-2 py-2 text-sm min-w-[80px] bg-white dark:bg-[#23242A] text-gray-900 dark:text-white"
                    value="USD"
                    disabled
                  >
                    <option>USD</option>
                  </select>
                </div>
                {!isAmountValid && sendAmount && (
                  <div className="text-xs text-red-500 pl-2">
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>
            {/* I Want to Receive */}
            <div className="rounded-xl p-2 flex flex-col gap-1 border border-gray-300 dark:border-[#35353E] bg-gray-100 dark:bg-[#23242A]">
              <div className="text-sm text-gray-500 dark:text-[#788099]">
                I Want to Receive
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl text-[#1D8751]">$</span>
                <input
                  type="number"
                  value={receiveAmount}
                  onChange={(e) => handleReceiveAmountChange(e.target.value)}
                  placeholder="220 USDT"
                  className="flex-1 bg-transparent text-xl font-semibold focus:outline-none rounded-xl px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#788099]"
                />
              </div>
            </div>
            {/* Payment Method Select */}
            <select
              className="rounded-xl px-4 py-2 text-sm border border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#23242A] text-gray-900 dark:text-[#788099]"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="" disabled>
                Set my payment method
              </option>
              {paymentOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="flex gap-4">
              <button
                className="flex-1 py-2 rounded-lg border font-semibold transition border-gray-400 dark:border-[#788099] text-gray-700 dark:text-[#788099] hover:bg-gray-200 dark:hover:bg-[#23242A]"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Close
              </button>
              <button
                className={`flex-1 py-2 rounded-lg font-semibold transition text-white ${
                  tradeType === "sell"
                    ? "bg-[#E23D3A] hover:bg-[#b71c1c]"
                    : "bg-[#1D8751] hover:bg-[#17643a]"
                } ${
                  !isFormValid() || isSubmitting
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={handleSubmit}
                disabled={!isFormValid() || isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : tradeType === "sell" ? (
                  "SELL USDT"
                ) : (
                  "BUY USDT"
                )}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="rounded-2xl p-3 w-full max-w-5xl mx-auto flex flex-col gap-4 border border-gray-300 dark:border-[#35353E] bg-white dark:bg-transparent text-gray-900 dark:text-white">
      {!isAuthenticated ? (
        <div className="text-center py-4 text-red-500">
          Please login to continue with the trade
        </div>
      ) : loading ? (
        <Loader
          size="md"
          color="#1D8751"
          showText={true}
          text="Loading data..."
          textColor="text-gray-500 dark:text-[#788099]"
        />
      ) : (
        renderContent()
      )}
    </div>
  );
};

export default TradePreview;
