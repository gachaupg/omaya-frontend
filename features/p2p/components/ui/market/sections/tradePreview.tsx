import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
import {
  fetchUserPaymentDetails,
} from "@/features/p2p/slices/paymentMethodsSlice";
import PaymentMethodsModal from "@/features/p2p/components/ui/p2pdashboard/sections/PaymentMethodsModal";
import { logger } from "@/lib/logger";

interface TradePreviewProps {
  advertiserData: MarketRow;
  onClose?: () => void;
  tradeType?: "buy" | "sell";
  paymentDetails?: any[];
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

/** Shorten long names to "first last" (e.g. "visual company limited Kariuki Beth" → "visual Beth") */
const shortenLongName = (name: string | undefined | null, maxLength = 25): string => {
  if (!name || typeof name !== "string") return "";
  const trimmed = name.trim();
  if (trimmed.length <= maxLength) return trimmed;
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return trimmed;
  const first = parts[0];
  const last = parts[parts.length - 1];
  return first === last ? first : `${first} ${last}`;
};

const TradePreview: React.FC<TradePreviewProps> = ({
  advertiserData,
  onClose,
  tradeType,
  paymentDetails,
  scrollContainerRef,
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

  const [transactionSummary, setTransactionSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendAmount, setSendAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
  const [isAmountValid, setIsAmountValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [numericAmount, setNumericAmount] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [paymentSearchTerm, setPaymentSearchTerm] = useState("");
  const [selectedUserPaymentDetail, setSelectedUserPaymentDetail] = useState<any>(null);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [activeField, setActiveField] = useState<"send" | "receive" | null>(null);

  const paymentDropdownRef = useRef<HTMLButtonElement>(null);

  const { userPaymentDetails, userDetailsLoading } = useSelector(
    (state: RootState) =>
      state.paymentMethods || {
        userPaymentDetails: [],
        userDetailsLoading: false,
      }
  );

  // Reset image error when advertiser data changes
  useEffect(() => {
    setImageError(false);
  }, [advertiserData.id, advertiserData.advertiser_photo]);

  const commissionRate = parseFloat(advertiserData.commission);
  const minAmount = advertiserData.minAmount;
  const maxAmount = advertiserData.maxAmount;
  const rangeLimitSuffix =
    advertiserData.range_currency?.toUpperCase() === "KES" ? "KES" : "USD";

  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          setLoading(true);
          dispatch(fetchWallets());
          dispatch(fetchAdminPaymentDetails(false));
          dispatch(fetchUserPaymentDetails() as any);
          const summary = await getTransactionSummary();
          setTransactionSummary(summary);
        } catch (error) {
          // Error handling
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [dispatch, isAuthenticated]);

  // Reset selected user payment when advertiser payment method changes
  useEffect(() => {
    setSelectedUserPaymentDetail(null);
  }, [paymentMethod]);

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
    if (!paymentMethod) return "Select payment method";
    return paymentMethod;
  }, [paymentMethod]);

  // Filter payment options based on search term
  const filteredPaymentOptions = React.useMemo(() => {
    if (!paymentSearchTerm.trim()) return paymentOptions;
    return paymentOptions.filter((opt) =>
      opt.label.toLowerCase().includes(paymentSearchTerm.toLowerCase())
    );
  }, [paymentOptions, paymentSearchTerm]);

  // User's payment methods that match the selected advertiser payment method (sell only, includes verified + pending)
  const matchingUserPaymentMethods = React.useMemo(() => {
    if (tradeType !== "sell" || !paymentMethod || !userPaymentDetails?.length)
      return [];
    const selectedLower = paymentMethod.toLowerCase().trim();
    return (userPaymentDetails as any[]).filter((d: any) => {
      if (!d || typeof d !== "object") return false;
      const userProvider = (
        d.payment_provider_name ||
        d.provider_name ||
        d.provider ||
        ""
      )
        .toLowerCase()
        .trim();
      if (!userProvider) return false;
      return (
        selectedLower.includes(userProvider) || userProvider.includes(selectedLower)
      );
    });
  }, [tradeType, paymentMethod, userPaymentDetails]);

  // When selling and a payment method is chosen, auto-scroll the surrounding
  // modal container to the bottom so the user's matching payment methods
  // section is brought into view.
  useEffect(() => {
    if (tradeType !== "sell") return;
    if (!paymentMethod) return;
    if (!scrollContainerRef?.current) return;

    const timeoutId = setTimeout(() => {
      if (!scrollContainerRef.current) return;
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [
    tradeType,
    paymentMethod,
    matchingUserPaymentMethods.length,
    scrollContainerRef,
  ]);

  // Position and show dropdown outside modal (portal) on sell
  const paymentDropdownPortalRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!isPaymentDropdownOpen || tradeType !== "sell") {
      setDropdownPosition(null);
      return;
    }

    const measure = () => {
      if (paymentDropdownRef.current) {
        const rect = paymentDropdownRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [isPaymentDropdownOpen, tradeType]);

  // Close payment dropdown on outside click (trigger or portaled dropdown)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (paymentDropdownRef.current?.contains(target)) return;
      if (paymentDropdownPortalRef.current?.contains(target)) return;
      setIsPaymentDropdownOpen(false);
    };

    if (isPaymentDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPaymentDropdownOpen]);

  // Compute available P2P balance the same way as in P2pProfile:
  // 1) Derive the profile balance from wallets (USDT wallet vs total_balance)
  // 2) Subtract escrow / locked amounts from the transaction summary
  const totalBalance = wallets?.total_balance ? toNumber(wallets.total_balance) : 0;
  const baseWalletBalance = wallets?.wallet?.balance
    ? parseFloat(wallets.wallet.balance)
    : 0;
  const isUSDTWallet = wallets?.wallet?.currency === "USDT";
  const profileBalance =
    isUSDTWallet && baseWalletBalance > 0
      ? baseWalletBalance
      : totalBalance && !isNaN(totalBalance) && totalBalance > 0
      ? totalBalance
      : baseWalletBalance;

  const totalLocked =
    (transactionSummary?.total_pending_p2p_withdrawals || 0) +
    (transactionSummary?.total_sell_orders_by_status?.pending || 0);

  // This is the same "available" amount implied by P2pProfile
  const walletBalance = profileBalance - totalLocked;

  const handleSendAmountChange = (value: string) => {
    setActiveField("send");
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
      // Calculate receive amount first (always show it)
      const calculatedReceive = (numericAmount * commissionRate).toFixed(2);
      setReceiveAmount(calculatedReceive);

      // Check balance first
      if (numericAmount > walletBalance) {
        setIsAmountValid(false);
        setErrorMessage(
          `Insufficient balance. Available: ${walletBalance.toFixed(2)} USDT`
        );
        return;
      }

      // Check min/max amounts (USDT)
      if (numericAmount < minAmount) {
        setIsAmountValid(false);
        setErrorMessage(`Minimum amount is ${minAmount} USDT`);
        return;
      }

      if (numericAmount > maxAmount) {
        setIsAmountValid(false);
        setErrorMessage(`Maximum amount is ${maxAmount} USDT`);
        return;
      }

      // Check available amount (though usually maxAmount covers this, double check against ad availability)
      const availableAmount = advertiserData.availableAmount || 0;
      if (numericAmount > availableAmount) {
        setIsAmountValid(false);
        setErrorMessage(`Maximum available is ${availableAmount.toFixed(2)} USDT`);
        return;
      }

      // Validation passed
      setIsAmountValid(true);
      setErrorMessage("");
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
        setErrorMessage(
          `Maximum available is ${availableAmount.toFixed(
            2
          )} USDT (${maxSendAmount.toFixed(2)} USD)`
        );
        setReceiveAmount("");
        return;
      }

      // Check minimum amount (convert minAmount USD to USDT for comparison)
      // For buy: send is USD, receive is USDT, minAmount and maxAmount are in USDT
      // So we need to check if calculatedReceive (USDT) is within min/max
      if (calculatedReceive < minAmount) {
        setIsAmountValid(false);
        setErrorMessage(
          `Minimum amount is ${minAmount} USDT (${(
            minAmount * commissionRate
          ).toFixed(2)} USD)`
        );
        setReceiveAmount("");
        return;
      }

      if (calculatedReceive > maxAmount) {
        setIsAmountValid(false);
        setErrorMessage(
          `Maximum amount is ${maxAmount} USDT (${(
            maxAmount * commissionRate
          ).toFixed(2)} USD)`
        );
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
    setActiveField("receive");
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

    const availableAmount = advertiserData.availableAmount || 0;

    if (tradeType === "sell") {
      // For sell: receiveAmount is USD, sendAmount is USDT.
      // numericAmount is USD (what user typed)
      const calculatedSendUsdt = numericAmount / commissionRate;

      // Always show the calculated amount
      setSendAmount(calculatedSendUsdt.toFixed(2));

      // Check balance first
      if (calculatedSendUsdt > walletBalance) {
        setIsAmountValid(false);
        setErrorMessage(
          `Insufficient balance. Available: ${walletBalance.toFixed(2)} USDT`
        );
        return;
      }

      // Check min/max amounts in USD terms
      const minUsd = minAmount * commissionRate;
      const maxUsd = maxAmount * commissionRate;

      if (numericAmount < minUsd) {
        setIsAmountValid(false);
        setErrorMessage(`Minimum receive amount is ${minUsd.toFixed(2)} USD`);
        return;
      }

      if (numericAmount > maxUsd) {
        setIsAmountValid(false);
        setErrorMessage(`Maximum receive amount is ${maxUsd.toFixed(2)} USD`);
        return;
      }

      // Check available amount
      if (calculatedSendUsdt > availableAmount) {
        setIsAmountValid(false);
        setErrorMessage(
          `Maximum available is ${availableAmount.toFixed(2)} USDT (${(
            availableAmount * commissionRate
          ).toFixed(2)} USD)`
        );
        return;
      }

      setIsAmountValid(true);
      setErrorMessage("");
    } else {
      // For buy: receiveAmount is USDT, sendAmount is USD
      // numericAmount is USDT (what user typed)
      if (numericAmount > availableAmount) {
        setIsAmountValid(false);
        setErrorMessage(
          `Amount cannot exceed available balance (${availableAmount.toFixed(
            2
          )} USDT)`
        );
        setSendAmount("");
        return;
      }

      if (numericAmount < minAmount) {
        setIsAmountValid(false);
        setErrorMessage(`Minimum amount is ${minAmount} USDT`);
        setSendAmount("");
        return;
      }

      if (numericAmount > maxAmount) {
        setIsAmountValid(false);
        setErrorMessage(`Maximum amount is ${maxAmount} USDT`);
        setSendAmount("");
        return;
      }

      setIsAmountValid(true);
      setErrorMessage("");
      setSendAmount((numericAmount * commissionRate).toFixed(2));
    }
  };

  const isFormValid = () => {
    if (!sendAmount || !paymentMethod) {
      return false;
    }

    if (!isAmountValid) {
      return false;
    }

    if (tradeType === "sell" && paymentMethod && !userDetailsLoading) {
      if (matchingUserPaymentMethods.length > 0 && !selectedUserPaymentDetail)
        return false;
      if (matchingUserPaymentMethods.length === 0) return false; // Must add one first
    }

    return true;
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

      // Create order data: API expects USDT amount (asset being traded)
      // For buy: receiveAmount is USDT. For sell: sendAmount is USDT.
      const orderData: OrderMatchRequest = {
        amount: tradeType === "sell" ? sendAmount : receiveAmount,
      };

      if (tradeType === "sell" && selectedUserPaymentDetail?.id != null) {
        orderData.payment_details_ids = [Number(selectedUserPaymentDetail.id)];
      }

      const response = await matchP2POrder(advertiserData.id, orderData);

      // Store trade_id in local storage
      let tradeIdFromResponse = null;
      if (response && "trade_id" in response) {
        tradeIdFromResponse = (response as any).trade_id;
        localStorage.setItem("p2p_trade_id", tradeIdFromResponse);
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
      router.push(`/p2p/${urlId}/matched?${searchParams.toString()}`);
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
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Panel */}
          <div className="flex-1 space-y-6">
            {/* Advertiser Info */}
            <div className="flex items-center gap-3">
              {advertiserData.advertiser_photo && !imageError ? (
                <img
                  src={advertiserData.advertiser_photo}
                  alt={advertiserData.advertiser}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#1D8751] text-white flex items-center justify-center font-semibold text-lg">
                  {advertiserData.advertiserInitials}
                </div>
              )}
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {shortenLongName(advertiserData.advertiser)}
                </div>
                <div className="text-xs text-gray-500 dark:text-[#788099]">
                  {advertiserData.orders} Orders | {advertiserData.completion}{" "}
                  Completion 👍 95%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-[#23232B] rounded-xl p-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {advertiserData.timeLimit}
                </div>
                <div className="text-xs text-gray-500 dark:text-[#788099] mt-1">
                  Time limit
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-[#23232B] rounded-xl p-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {advertiserData.avgRealiseTime}
                </div>
                <div className="text-xs text-gray-500 dark:text-[#788099] mt-1">
                  Avg. realise time
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-[#23232B] rounded-xl p-4 col-span-2">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {advertiserData.available}
                </div>
                <div className="text-xs text-gray-500 dark:text-[#788099] mt-1">
                  Available assets
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-[#C7CAD1] mb-2">
                Advertiser's Terms (Please read carefully)
              </div>
              <div className="bg-gray-50 dark:bg-[#23232B] rounded-xl p-4 text-sm text-gray-600 dark:text-[#788099]">
                {advertiserData.terms_and_conditions}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 space-y-4">
            {/* Commission */}
            <div className="bg-gray-50 dark:bg-[#23232B] rounded-xl p-4 text-center">
              <span className="text-sm text-gray-500 dark:text-[#788099]">
                Rate:{" "}
              </span>
              <span className="text-xl font-bold text-[#1D8751]">
                {advertiserData.commission}
              </span>
            </div>

            {/* For Sell: I Want to Sell (USDT) first, I Want to Receive (USD) second. For Buy: I Want to Send (USD) first, I Want to Receive (USDT) second. */}
            {tradeType === "sell" ? (
              <>
                {/* I Want to Sell - USDT (seller sells this) */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-[#C7CAD1]">
                    I Want to Sell
                  </label>
                  <div className="text-xs text-gray-500 dark:text-[#788099] mb-2">
                    Range: {minAmount}-{maxAmount} {rangeLimitSuffix}
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-[var(--card-color)] rounded-xl border border-gray-300 dark:border-[#35353E] px-3 sm:px-4 py-2">
                    <input
                      type="number"
                      value={sendAmount}
                      onChange={(e) => handleSendAmountChange(e.target.value)}
                      placeholder="220"
                      className={`flex-1 bg-transparent text-lg sm:text-xl font-semibold focus:outline-none rounded-xl px-3 sm:px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#788099] ${
                        !isAmountValid && sendAmount ? "border border-red-500" : ""
                      }`}
                    />
                    <div className="text-sm font-semibold text-gray-500 dark:text-[#788099]">
                      USDT
                    </div>
                  </div>
                  {!isAmountValid && sendAmount && activeField === "send" && (
                    <div className="text-xs text-red-500 mt-1">{errorMessage}</div>
                  )}
                </div>

                {/* I Want to Receive - range currency (USD or KES, buyer sends this to seller) */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-[#C7CAD1]">
                    I Want to Receive
                  </label>
                  <div className="flex items-center gap-2 bg-white dark:bg-[var(--card-color)] rounded-xl border border-gray-300 dark:border-[#35353E] px-3 sm:px-4 py-2">
                    <div className="text-sm font-semibold text-gray-500 dark:text-[#788099]">
                      {rangeLimitSuffix === "KES" ? "KES" : "$"}
                    </div>
                    <input
                      type="number"
                      value={receiveAmount}
                      onChange={(e) => handleReceiveAmountChange(e.target.value)}
                      placeholder={`220 ${rangeLimitSuffix}`}
                      max={advertiserData.availableAmount || 0}
                      className={`flex-1 bg-transparent text-lg sm:text-xl font-semibold focus:outline-none rounded-xl px-3 sm:px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#788099] ${
                        !isAmountValid && receiveAmount
                          ? "border border-red-500"
                          : ""
                      }`}
                    />
                    <div className="text-sm font-semibold text-gray-500 dark:text-[#788099]">
                      {rangeLimitSuffix}
                    </div>
                  </div>
                  {!isAmountValid && receiveAmount && activeField === "receive" && (
                    <div className="text-xs text-red-500 mt-1">{errorMessage}</div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* I Want to Send - range currency (USD or KES, buy flow) */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-[#C7CAD1]">
                    I Want to Send
                  </label>
                  <div className="text-xs text-gray-500 dark:text-[#788099] mb-2">
                    Range: {minAmount}-{maxAmount} {rangeLimitSuffix}
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-[var(--card-color)] rounded-xl border border-gray-300 dark:border-[#35353E] px-3 sm:px-4 py-2">
                    <div className="text-sm font-semibold text-gray-500 dark:text-[#788099]">
                      {rangeLimitSuffix === "KES" ? "KES" : "$"}
                    </div>
                    <input
                      type="number"
                      value={sendAmount}
                      onChange={(e) => handleSendAmountChange(e.target.value)}
                      placeholder={`220 ${rangeLimitSuffix}`}
                      max={
                        tradeType === "buy"
                          ? (advertiserData.availableAmount || 0) * commissionRate
                          : undefined
                      }
                      className={`flex-1 min-w-0 bg-transparent text-lg sm:text-xl font-semibold focus:outline-none rounded-xl px-2 sm:px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#788099] ${
                        !isAmountValid && sendAmount ? "border border-red-500" : ""
                      }`}
                    />
                    <div className="text-sm font-semibold text-gray-500 dark:text-[#788099]">
                      {rangeLimitSuffix}
                    </div>
                  </div>
                  {!isAmountValid && sendAmount && (
                    <div className="text-xs text-red-500 mt-1">{errorMessage}</div>
                  )}
                </div>

                {/* I Want to Receive - USDT (buy flow) */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-[#C7CAD1]">
                    I Want to Receive
                  </label>
                  <div className="flex items-center gap-2 bg-white dark:bg-[var(--card-color)] rounded-xl border border-gray-300 dark:border-[#35353E] px-3 sm:px-4 py-2">
                    <input
                      type="number"
                      value={receiveAmount}
                      onChange={(e) => handleReceiveAmountChange(e.target.value)}
                      placeholder="220 USDT"
                      max={advertiserData.availableAmount || 0}
                      className={`flex-1 bg-transparent text-lg sm:text-xl font-semibold focus:outline-none rounded-xl px-3 sm:px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#788099] ${
                        !isAmountValid && receiveAmount
                          ? "border border-red-500"
                          : ""
                      }`}
                    />
                  </div>
                  {!isAmountValid && receiveAmount && (
                    <div className="text-xs text-red-500 mt-1">{errorMessage}</div>
                  )}
                </div>
              </>
            )}

            {/* Payment Method Select */}
            <div className="space-y-2">
              <button
                ref={paymentDropdownRef}
                onClick={() => setIsPaymentDropdownOpen((prev) => !prev)}
                className="w-full rounded-xl px-3 sm:px-4 py-2.5 text-sm sm:text-base font-semibold border border-gray-300 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D8751] flex items-center justify-between"
              >
                {selectedPaymentSummary}
                <svg
                  className={`w-5 h-5 transition-transform ${
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

              {/* Unified dropdown for both buy and sell */}
              {isPaymentDropdownOpen &&
                (tradeType === "sell" && dropdownPosition
                  ? createPortal(
                      <div
                        ref={paymentDropdownPortalRef}
                        style={{
                          position: "fixed",
                          top: `${dropdownPosition.top}px`,
                          left: `${dropdownPosition.left}px`,
                          width: `${dropdownPosition.width}px`,
                          zIndex: 9999,
                        }}
                        className="bg-white dark:bg-[var(--card-color)] rounded-xl shadow-lg border border-gray-200 dark:border-[#35353E] max-h-64 overflow-y-auto"
                      >
                        <div className="p-3 border-b border-gray-200 dark:border-[#35353E]">
                          <input
                            type="text"
                            placeholder="Search payment methods..."
                            value={paymentSearchTerm}
                            onChange={(e) => setPaymentSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-[#35353E] bg-gray-50 dark:bg-[#23232B] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#788099] focus:outline-none focus:ring-2 focus:ring-[#1D8751]"
                          />
                        </div>
                        <div className="py-1">
                          {paymentOptions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-[#788099] text-center">
                              No payment methods available
                            </div>
                          ) : filteredPaymentOptions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-[#788099] text-center">
                              No matching payment methods
                            </div>
                          ) : (
                            filteredPaymentOptions.map((opt) => {
                              const isSelected = paymentMethod === opt.value;
                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => {
                                    setPaymentMethod(opt.value);
                                    setIsPaymentDropdownOpen(false);
                                    setPaymentSearchTerm("");
                                  }}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-[#35353E] transition-colors ${
                                    isSelected
                                      ? "text-gray-900 dark:text-white bg-gray-50 dark:bg-[#35353E]"
                                      : "text-gray-700 dark:text-[#C7CAD1]"
                                  }`}
                                >
                                  <div className="flex-shrink-0">
                                    {isSelected && (
                                      <svg
                                        className="w-5 h-5 text-[#1D8751]"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    )}
                                  </div>
                                  <span className="text-sm font-medium">
                                    {opt.label}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>,
                      document.body
                    )
                  : (
                      <div className="bg-white dark:bg-[var(--card-color)] rounded-xl shadow-lg border border-gray-200 dark:border-[#35353E] max-h-64 overflow-y-auto mt-2">
                        <div className="py-1">
                          {filteredPaymentOptions.map((opt) => {
                            const isSelected = paymentMethod === opt.value;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => {
                                  setPaymentMethod(opt.value);
                                  setIsPaymentDropdownOpen(false);
                                  setPaymentSearchTerm("");
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-[#35353E] ${
                                  isSelected
                                    ? "text-gray-900 dark:text-white bg-gray-50 dark:bg-[#35353E]"
                                    : "text-gray-700 dark:text-[#C7CAD1]"
                                }`}
                              >
                                <div className="flex-shrink-0">
                                  {isSelected && (
                                    <svg
                                      className="w-5 h-5 text-[#1D8751]"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </div>
                                <span className="text-sm font-medium">
                                  {opt.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
            </div>

            {/* Sell: User's matching payment methods - select one or add new */}
            {tradeType === "sell" && paymentMethod && (
              <div className="bg-gray-50 dark:bg-[#23232B] rounded-xl p-4 space-y-3">
                <div className="text-sm font-semibold text-gray-700 dark:text-[#C7CAD1]">
                  Your {paymentMethod} payment methods
                </div>
                <div className="text-xs text-gray-500 dark:text-[#788099]">
                  Newly added methods may show as pending until verified.
                </div>

                {userDetailsLoading ? (
                  <div className="text-sm text-gray-500 dark:text-[#788099] text-center py-4">
                    Loading your payment methods...
                  </div>
                ) : matchingUserPaymentMethods.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {matchingUserPaymentMethods.map((detail: any) => {
                        const isSelected =
                          selectedUserPaymentDetail?.id === detail.id;
                        const status = (detail.status || "").toLowerCase();
                        const isPending =
                          status && status !== "approved" && status !== "verified";

                        return (
                          <div
                            key={detail.id}
                            className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-[var(--card-color)] rounded-lg border border-gray-200 dark:border-[#35353E]"
                          >
                            {detail.provider_logo || detail.logo_url ? (
                              <img
                                src={detail.provider_logo || detail.logo_url}
                                alt={detail.payment_provider_name || "Provider"}
                                className="w-8 h-8 object-contain flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#1D8751] text-white flex items-center justify-center font-semibold text-xs flex-shrink-0">
                                {(detail.payment_provider_name || "?")[0]}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {detail.account_name || "Account"}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-[#788099] truncate">
                                {detail.account_number ||
                                  detail.wallet_address ||
                                  "—"}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                !isPending &&
                                setSelectedUserPaymentDetail(
                                  isSelected ? null : detail
                                )
                              }
                              disabled={isPending}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-shrink-0 ${
                                isPending
                                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 cursor-not-allowed"
                                  : isSelected
                                  ? "bg-[#1D8751] text-white"
                                  : "border border-[#1D8751] text-[#1D8751] hover:bg-[#1D8751] hover:text-white"
                              }`}
                            >
                              {isPending
                                ? "Pending"
                                : isSelected
                                ? "Selected"
                                : "Select"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setShowAddPaymentModal(true)}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#1D8751] text-white text-sm font-semibold hover:bg-[#166b3e] transition"
                    >
                      Add new {paymentMethod} payment method
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-500 dark:text-[#788099] text-center py-2">
                      No matching {paymentMethod} payment method found. Add one to
                      continue.
                    </div>
                    <button
                      onClick={() => setShowAddPaymentModal(true)}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#1D8751] text-white text-sm font-semibold hover:bg-[#166b3e] transition"
                    >
                      Add new {paymentMethod} payment method
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-[#35353E] text-gray-700 dark:text-[#C7CAD1] font-semibold hover:bg-gray-50 dark:hover:bg-[#35353E] transition"
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-[#1D8751] text-white font-semibold hover:bg-[#166b3e] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : tradeType === "sell" ? (
              "SELL USDT"
            ) : (
              "BUY USDT"
            )}
          </button>
        </div>
      </>
    );
  };

  return (
    <>
      <div className="bg-white dark:bg-[var(--card-color)] rounded-2xl shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-[#35353E]">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {tradeType === "sell" ? "Sell USDT" : "Buy USDT"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-[#788099] dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-[#35353E] rounded-lg"
          >
            <svg
              className="w-6 h-6"
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
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6">
          {!isAuthenticated ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-[#788099] mb-4">
                Please login to continue with the trade
              </p>
            </div>
          ) : loading ? (
            <Loader />
          ) : (
            renderContent()
          )}
        </div>
      </div>

      <PaymentMethodsModal
        open={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
        onAdd={async () => {
          await dispatch(fetchUserPaymentDetails() as any);
        }}
        filterByProviderName={
          tradeType === "sell" ? paymentMethod || undefined : undefined
        }
      />
    </>
  );
};

export default TradePreview;