import React, { useState, useEffect, useRef } from "react";
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
import { toNumber } from "@/lib/finanacial";
import { fetchAdminPaymentDetails } from "@/features/exchange/slices/paymentSlice";
import { logger } from "@/lib/logger";

interface TradePreviewProps {
  advertiserData: MarketRow;
  onClose?: () => void;
  tradeType?: "buy" | "sell";
  paymentDetails?: any[];
}



const TradePreview: React.FC<TradePreviewProps> = ({
  advertiserData,
  onClose,
  tradeType,
  paymentDetails,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { data: wallets, loading: walletLoading } = useSelector(
    (state: RootState) => state.wallets || { data: null, loading: false }
  );
  const { adminPaymentDetails } = useSelector(
    (state: RootState) => state.payment || { adminPaymentDetails: [] }
  );
  const [transactionSummary, setTransactionSummary] =
    useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendAmount, setSendAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string[]>([]);
  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
  const [isAmountValid, setIsAmountValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [numericAmount, setNumericAmount] = useState(0);

  const paymentDropdownRef = useRef<HTMLDivElement>(null);

  const commissionRate = parseFloat(advertiserData.commission);
  const minAmount = advertiserData.minAmount;
  const maxAmount = advertiserData.maxAmount;

  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          setLoading(true);
          dispatch(fetchWallets());
          dispatch(fetchAdminPaymentDetails(false));
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

  // Create payment options from row payment details
  const paymentOptions = React.useMemo(() => {
    if (!paymentDetails || !Array.isArray(paymentDetails)) return [];
    
    // Create options for each payment method from the row
    return paymentDetails.map((detail: any, index: number) => ({
      id: detail.id || index,
      value: detail.provider,
      label: detail.provider,
    }));
  }, [paymentDetails]);

  const selectedPaymentSummary = React.useMemo(() => {
    if (paymentMethod.length === 0) return "Select payment methods";
    if (paymentMethod.length <= 2) return paymentMethod.join(", ");
    return `${paymentMethod.length} methods selected`;
  }, [paymentMethod]);

  // Close payment dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        paymentDropdownRef.current &&
        !paymentDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPaymentDropdownOpen(false);
      }
    };

    if (isPaymentDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPaymentDropdownOpen]);


  // Get USDT wallet balance from the wallet response structure
  const walletBalance =wallets?.total_balance ? toNumber(wallets.total_balance) : 0;
  const handleSendAmountChange = (value: string) => {
    if (!value) {
      setSendAmount("");
      setIsAmountValid(true);
      setErrorMessage("");
      setReceiveAmount("");
      return;
    }

    // Handle invalid input (empty or just minus sign)
    if (value === "-" || value === "." || value === ",") {
      setSendAmount(value);
      return;
    }

    let numericAmount = parseFloat(value);
    
    // Always set the input value (allow user to type anything)
    setSendAmount(value);
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
      
      // Calculate receive amount for sell orders
      const calculatedReceive = (numericAmount * commissionRate).toFixed(2);
      setReceiveAmount(calculatedReceive);
      return;
    } else {
      // For buy orders, calculate receive amount first to validate against available amount
      if (isNaN(numericAmount)) {
        setReceiveAmount("");
        setIsAmountValid(true);
        setErrorMessage("");
        return;
      }
      
      const calculatedReceive = numericAmount / commissionRate;
      const availableAmount = advertiserData.availableAmount || 0;
      const maxSendAmount = availableAmount * commissionRate;
      
      // Validate against available amount (show error but don't cap input)
      if (calculatedReceive > availableAmount) {
        setIsAmountValid(false);
        setErrorMessage(`Maximum available is ${availableAmount.toFixed(2)} USDT (${maxSendAmount.toFixed(2)} USD)`);
        setReceiveAmount("");
        return;
      }
      
      // Check minimum amount (convert minAmount USD to USDT for comparison)
      // For buy: send is USD, receive is USDT, minAmount and maxAmount are in USDT
      // So we need to check if calculatedReceive (USDT) is within min/max
      if (calculatedReceive < minAmount) {
        setIsAmountValid(false);
        setErrorMessage(`Minimum amount is ${minAmount} USDT (${(minAmount * commissionRate).toFixed(2)} USD)`);
        setReceiveAmount("");
        return;
      }
      
      if (calculatedReceive > maxAmount) {
        setIsAmountValid(false);
        setErrorMessage(`Maximum amount is ${maxAmount} USDT (${(maxAmount * commissionRate).toFixed(2)} USD)`);
        setReceiveAmount("");
        return;
      }
      
      // Validation passed - calculate and set receive amount
      setIsAmountValid(true);
      setErrorMessage("");
      setReceiveAmount(calculatedReceive.toFixed(2));
      return;
    }
  };

  const handleReceiveAmountChange = (value: string) => {
    if (!value) {
      setReceiveAmount("");
      setIsAmountValid(true);
      setErrorMessage("");
      setSendAmount("");
      return;
    }

    // Handle invalid input (empty or just minus sign)
    if (value === "-" || value === "." || value === ",") {
      setReceiveAmount(value);
      return;
    }

    let numericAmount = parseFloat(value);
    
    // Always set the input value (allow user to type anything)
    setReceiveAmount(value);
    setNumericAmount(numericAmount);
    
    // Handle invalid number input
    if (isNaN(numericAmount)) {
      setIsAmountValid(true);
      setErrorMessage("");
      setSendAmount("");
      return;
    }
    
    // Get available amount from the order
    const availableAmount = advertiserData.availableAmount || 0;

    // Validate against available amount (show error but don't cap input)
    if (numericAmount > availableAmount) {
      setIsAmountValid(false);
      setErrorMessage(`Amount cannot exceed available balance (${availableAmount.toFixed(2)} USDT)`);
      setSendAmount("");
      return;
    }

    // Check minimum amount
    if (numericAmount < minAmount) {
      setIsAmountValid(false);
      setErrorMessage(`Minimum amount is ${minAmount} USDT`);
      setSendAmount("");
      return;
    }

    // Check maximum amount (this should not exceed availableAmount, but check for consistency)
    if (numericAmount > maxAmount) {
      setIsAmountValid(false);
      setErrorMessage(`Maximum amount is ${maxAmount} USDT`);
      setSendAmount("");
      return;
    }

    // If validation passes, calculate send amount and clear errors
    setIsAmountValid(true);
    setErrorMessage("");
    const calculatedSend = 
      tradeType === "sell"
        ? (numericAmount / commissionRate).toFixed(2)
        : (numericAmount * commissionRate).toFixed(2);
    setSendAmount(calculatedSend);
  };

  const isFormValid = () => {
    if (!sendAmount || paymentMethod.length === 0) {
      return false;
    }
    return isAmountValid;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      if (!sendAmount) {
        setErrorMessage("Please enter an amount");
        showToast.error("Validation Error", "Please enter an amount");
      } else if (paymentMethod.length === 0) {
        setErrorMessage("Please select at least one payment method");
        showToast.error("Validation Error", "Please select at least one payment method");
      }
      return;
    }

    try {
      setIsSubmitting(true);
      // Create order data with commission
      const orderData: OrderMatchRequest = {
        amount: receiveAmount,
      };




      const response = await matchP2POrder(advertiserData.id, orderData);
      
      
      // Store trade_id in local storage
      let tradeIdFromResponse = null;
      if (response && 'trade_id' in response) {
        tradeIdFromResponse = (response as any).trade_id;
        localStorage.setItem('p2p_trade_id', tradeIdFromResponse);
      } else {
      }
      
      // Navigate with state using URL search params
      const searchParams = new URLSearchParams();
      searchParams.set(
        "orderData",
        JSON.stringify({
          order_type: tradeType === "buy" ? "sell" : "buy",
          commission: advertiserData.commission,
        })
      );

      // Use trade_id in URL instead of advertiserData.id
      const urlId = tradeIdFromResponse || advertiserData.id;
      router.push(
        `/p2p/${urlId}/matched?${searchParams.toString()}`
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
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Left Panel */}
          <div className="flex-1 flex flex-col gap-3">
          {/* Advertiser Info */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold bg-[#1D8751] text-white flex-shrink-0">
              {advertiserData.advertiserInitials} 
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                <span className="truncate">{advertiserData.advertiser}</span>
                <div className="bg-[#E59906] text-base w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full flex-shrink-0"></div>
              </div>
              <div className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 text-[#1D8751] flex-wrap">
                <span>{advertiserData.orders} Orders</span>
                <span className="text-gray-400 dark:text-[#788099] hidden sm:inline">|</span>
                <span>{advertiserData.completion} Completion</span>
                <span className="text-[#1D8751]">👍 95%</span>
              </div>
            </div>
          </div>
            <div className="flex flex-wrap gap-4 sm:gap-6">
              <div className="flex-1 min-w-[80px]">
                <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  {advertiserData.timeLimit}
                </div>
                <div className="text-xs text-gray-500 dark:text-[#788099]">
                  Time limit
                </div>
              </div>
              <div className="flex-1 min-w-[80px]">
                <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  {advertiserData.avgRealiseTime}
                </div>
                <div className="text-xs text-gray-500 dark:text-[#788099]">
                  Avg. realise time
                </div>
              </div>
              <div className="flex-1 min-w-[80px]">
                <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  {advertiserData.available}
                </div>
                <div className="text-xs text-gray-500 dark:text-[#788099]">
                  Available assets
                </div>
              </div>
            </div>
            <div className="rounded-xl p-3 border border-gray-300 dark:border-[#35353E] bg-gray-100 dark:bg-transparent">
              <div className="flex items-start sm:items-center gap-2 mb-1 flex-wrap">
                <svg 
                 xmlns="http://www.w3.org/2000/svg" 
                 width="18" 
                 height="18" 
                 viewBox="0 0 24 24" 
                 fill="none" 
                 stroke="currentColor" 
                 strokeWidth="2" 
                 strokeLinecap="round" 
                 strokeLinejoin="round"
                 className="text-[#E23D3A] flex-shrink-0 mt-0.5 sm:mt-0"
                 >
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" x2="12" y1="8" y2="12"/>
                <line x1="12" x2="12.01" y1="16" y2="16"/>
                </svg>
                <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                  Advertiser's Terms
                </span>
                <span className="text-[#E23D3A] font-medium text-xs sm:text-sm">
                  (Please read carefully)
                </span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-[#788099] leading-relaxed">
                {advertiserData.terms_and_conditions}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 flex flex-col gap-3">
              {/* Commission */}
            <div className="text-left text-base sm:text-lg font-semibold text-gray-900 dark:text-white mt-0 lg:mt-4">
              Rate:{" "}
              <span className="text-[#1D8751]">{advertiserData.commission}</span>
            </div>
            {/* I Want to Send */}
            <div className="rounded-xl p-3 sm:p-3 flex flex-col gap-2 sm:gap-2 border border-gray-300 dark:border-[#35353E] bg-gray-100 dark:bg-transparent">
              <div className="text-sm sm:text-base text-gray-500 dark:text-[#788099] font-semibold">
                I Want to Send
              </div>
              <div className="flex flex-col gap-2 sm:gap-2">
                <div className="text-sm text-gray-500 dark:text-[#788099] pl-0 sm:pl-2 font-medium">
                  Range: {minAmount}-{maxAmount} USDT
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <span className="text-2xl sm:text-3xl text-[#1D8751] font-semibold flex-shrink-0">$</span>
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => handleSendAmountChange(e.target.value)}
                    placeholder="220"
                    max={
                      tradeType === "buy"
                        ? (advertiserData.availableAmount || 0) * commissionRate
                        : undefined
                    }
                    className={`flex-1 bg-transparent text-lg sm:text-xl font-semibold focus:outline-none rounded-xl px-3 sm:px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#788099] ${
                      !isAmountValid && sendAmount ? "border border-red-500" : ""
                    }`}
                  />
                  <div className="relative w-full sm:w-auto">
                    <select
                      className="rounded px-3 py-2 text-sm sm:text-base font-semibold min-w-[90px] sm:min-w-[100px] w-full bg-white dark:bg-transparent text-gray-900 dark:text-white border border-gray-300 dark:border-[#35353E]"
                      value={tradeType === "buy" ? "USD" : "USDT"}
                      disabled
                    >
                      <option>{tradeType === "buy" ? "USD" : "USDT"}</option>
                    </select>
                  </div>
                </div>
                {!isAmountValid && sendAmount && (
                  <div className="text-sm text-red-500 pl-0 sm:pl-2 font-semibold">
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>
            {/* I Want to Receive */}
            <div className="rounded-xl p-3 sm:p-3 flex flex-col gap-2 sm:gap-2 border border-gray-300 dark:border-[#35353E] bg-gray-100 dark:bg-transparent">
              <div className="text-sm sm:text-base text-gray-500 dark:text-[#788099] font-semibold">
                I Want to Receive
              </div>
              <div className="flex flex-col gap-2 sm:gap-2">
                <div className="text-sm text-gray-500 dark:text-[#788099] pl-0 sm:pl-2 font-medium">
                  Available: {advertiserData.available}
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <span className="text-2xl sm:text-3xl text-[#1D8751] font-semibold flex-shrink-0">
                    <img src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png" alt="" />
                  </span>
                  <input
                    type="number"
                    value={receiveAmount}
                    onChange={(e) => handleReceiveAmountChange(e.target.value)}
                    placeholder={`220 ${tradeType === "buy" ? "USDT" : "USD"}`}
                    max={advertiserData.availableAmount || 0}
                    className={`flex-1 bg-transparent text-lg sm:text-xl font-semibold focus:outline-none rounded-xl px-3 sm:px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#788099] ${
                      !isAmountValid && receiveAmount ? "border border-red-500" : ""
                    }`}
                  />
                </div>
                {!isAmountValid && receiveAmount && (
                  <div className="text-sm text-red-500 pl-0 sm:pl-2 font-semibold">
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>
            {/* Payment Method Select */}
            <div className="flex flex-col gap-2" ref={paymentDropdownRef}>
            
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPaymentDropdownOpen((prev) => !prev)}
                  className="w-full rounded-xl px-3 sm:px-4 py-2.5 pr-12 text-sm sm:text-base font-semibold border border-gray-300 dark:border-[#35353E] bg-white dark:bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D8751] flex items-center justify-between"
                >
                  <span className="truncate text-left">
                    {selectedPaymentSummary}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-500 dark:text-[#788099] transition-transform ${
                      isPaymentDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {isPaymentDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-gray-300 dark:border-[#35353E] bg-white dark:bg-transparent shadow-lg z-20 max-h-60 overflow-y-auto">
                    {paymentOptions.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-[#788099]">
                        No payment methods available
                      </div>
                    ) : (
                      paymentOptions.map((opt) => {
                        const isSelected = paymentMethod.includes(opt.value);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setPaymentMethod((prev) =>
                                prev.includes(opt.value)
                                  ? prev.filter((m) => m !== opt.value)
                                  : [...prev, opt.value]
                              );
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-[#35353E] ${
                              isSelected
                                ? "text-gray-900 dark:text-white"
                                : "text-gray-700 dark:text-[#C7CAD1]"
                            }`}
                          >
                            <span className="text-sm sm:text-base font-semibold">{opt.label}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                className="w-full sm:flex-1 py-2.5 sm:py-2 rounded-lg border font-semibold text-sm sm:text-base transition border-gray-400 dark:border-[#788099] text-gray-700 dark:text-[#788099] hover:bg-gray-200 dark:hover:bg-[var(--card-color)]"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Close
              </button>
              <button
                className={`w-full sm:flex-1 py-2.5 sm:py-2 rounded-lg font-semibold text-sm sm:text-base transition text-white ${
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
    <div className="rounded-2xl p-3 sm:p-4 lg:p-6 w-full max-w-5xl mx-auto flex flex-col gap-3 sm:gap-4 border border-gray-300 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] text-gray-900 dark:text-white">
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