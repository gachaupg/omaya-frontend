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

interface TradePreviewProps {
  advertiserData: MarketRow;
  onClose?: () => void;
  tradeType?: "buy" | "sell";
}



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

  // Create payment options from admin payment details
  const paymentOptions = React.useMemo(() => {
    if (!adminPaymentDetails || !Array.isArray(adminPaymentDetails)) return [];
    
    // Filter active details and deduplicate by provider_name
    const uniqueProviders = new Map();
    adminPaymentDetails
      .filter((detail: any) => detail.is_active)
      .forEach((detail: any) => {
        if (!uniqueProviders.has(detail.provider_name)) {
          uniqueProviders.set(detail.provider_name, {
            id: detail.admin_payment_detail_id,
            value: detail.provider_name,
            label: detail.provider_name,
          });
        }
      });
    
    return Array.from(uniqueProviders.values());
  }, [adminPaymentDetails]);

  // Close dropdown when clicking outside
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
      tradeType === "sell"
        ? (numericAmount * commissionRate).toFixed(2)
        : (numericAmount / commissionRate).toFixed(2);
    setReceiveAmount(calculatedReceive);
  };

  const handleReceiveAmountChange = (value: string) => {
    setReceiveAmount(value);

    if (!value) {
      setIsAmountValid(true);
      setErrorMessage("");
      setSendAmount("");
      return;
    }

    const numericAmount = parseFloat(value);
    setNumericAmount(numericAmount);

    // Get available amount from the order
    const availableAmount = parseFloat(advertiserData.available);
    
    // Validate against available amount
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

    // Check maximum amount
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
              Rate:{" "}
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
                    value="USDT"
                    disabled
                  >
                    <option> {tradeType === "buy" ? "USD" : "USDT"}</option>
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
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-500 dark:text-[#788099] pl-2">
                  Available: {advertiserData.available} USDT
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl text-[#1D8751]">$</span>
                  <input
                    type="number"
                    value={receiveAmount}
                    onChange={(e) => handleReceiveAmountChange(e.target.value)}
                    placeholder={`220 ${tradeType === "buy" ? "USD" : "USDT"}`}
                    className={`flex-1 bg-transparent text-xl font-semibold focus:outline-none rounded-xl px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#788099] ${
                      !isAmountValid && receiveAmount
                        ? "border border-red-500"
                        : ""
                    }`}
                  />
                </div>
                {!isAmountValid && receiveAmount && (
                  <div className="text-xs text-red-500 pl-2">
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>
            {/* Payment Method Multi-Select Dropdown */}
            <div className="relative" ref={paymentDropdownRef}>
              <div
                onClick={() => setIsPaymentDropdownOpen(!isPaymentDropdownOpen)}
                className="rounded-xl px-4 py-2 text-sm border border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#23242A] cursor-pointer flex justify-between items-center"
              >
                <span className="text-gray-900 dark:text-white">
                  {paymentMethod.length === 0
                    ? "Select payment method"
                    : `${paymentMethod.length} method(s) selected`}
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
              </div>
              {isPaymentDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#23242A] border border-gray-300 dark:border-[#35353E] rounded-xl shadow-lg z-10">
                  <div className="p-2">
              {paymentOptions.map((opt) => (
                      <label
                        key={opt.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-[#35353E] rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={paymentMethod.includes(opt.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPaymentMethod([...paymentMethod, opt.value]);
                            } else {
                              setPaymentMethod(
                                paymentMethod.filter((m) => m !== opt.value)
                              );
                            }
                          }}
                          className="w-4 h-4 text-[#1D8751] bg-white dark:bg-[#23242A] border-gray-300 dark:border-[#35353E] rounded focus:ring-[#1D8751] focus:ring-2"
                        />
                        <span className="text-gray-900 dark:text-white text-sm">
                  {opt.label}
                        </span>
                      </label>
              ))}
                  </div>
                </div>
              )}
            </div>
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
