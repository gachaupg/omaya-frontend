import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { MarketRow } from "../types";
import { useDispatch, useSelector } from "react-redux";
import {
  getBuyOrderLimits,
  isBuyAvailableBelowAdMin,
  isIncompleteTradeAmountInput,
  parseTradeAmountInput,
  validateBuyReceiveUsdt,
  validateBuySendAmount,
  validateSellReceiveFiat,
  validateSellSendUsdt,
  type AmountValidationResult,
} from "./tradePreviewAmountValidation";
import { AppDispatch } from "@/store";
import { fetchWallets } from "@/features/p2p/slices/walletSlice";
import { setConfirmOrderSnapshot } from "@/features/p2p/slices/orderSlice";
import { getTransactionSummary, matchP2POrder } from "@/features/p2p/api";
import { PresenceIndicator } from "./UserStatusBadge";
import { PendingAcceptanceWaitModal } from "./PendingAcceptanceWaitModal";
import { isTradeAcceptedFromConfirmOrder } from "@/features/p2p/utils/tradeWsAcceptanceGate";
import {
  extractTradeIdFromMatchResponse,
  fetchP2PTradeConfirmOnce,
  canonicalTradeIdFromConfirm,
} from "@/features/p2p/utils/resolveP2PTradeId";
import {
  logTradePreview,
  logTradePreviewSockets,
} from "@/features/p2p/utils/tradePreviewDebug";
import { TransactionSummary, OrderMatchRequest } from "@/features/p2p/types";
import { getWalletAmountsFromSummary } from "@/features/p2p/walletAmounts";
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
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
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

/** Rate label without trailing currency (e.g. "1.00 USD" → "1.00"). */
const formatRateWithoutCurrency = (raw: string | undefined | null): string => {
  if (raw == null || raw === "") return "—";
  const s = String(raw).trim().replace(/,/g, "");
  const n = parseFloat(s);
  if (Number.isFinite(n)) return n.toFixed(2);
  const noSuffix = s.replace(
    /\s*(USD|USDT|KES|EUR|GBP|UGX|TZS|NGN|ZAR|CNY)\s*$/i,
    ""
  ).trim();
  const n2 = parseFloat(noSuffix);
  return Number.isFinite(n2) ? n2.toFixed(2) : noSuffix || "—";
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
  const [transactionSummary, setTransactionSummary] =
    useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendAmount, setSendAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
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
    maxHeight: number;
  } | null>(null);
  const [activeField, setActiveField] = useState<"send" | "receive" | null>(null);
  const [awaitingAcceptanceTradeId, setAwaitingAcceptanceTradeId] = useState<string | null>(null);

  const paymentDropdownRef = useRef<HTMLDivElement>(null);
  const pendingTradeIdRef = useRef<string | null>(null);

  const navigateToMatched = useCallback(
    (tradeId: string) => {
      const id =
        tradeId?.trim() ||
        pendingTradeIdRef.current?.trim() ||
        (typeof window !== "undefined"
          ? localStorage.getItem("p2p_trade_id")?.trim()
          : null) ||
        "";
      if (!id) return;

      try {
        localStorage.setItem("p2p_trade_id", id);
      } catch {
        /* no-op */
      }

      const searchParams = new URLSearchParams();
      searchParams.set(
        "orderData",
        JSON.stringify({
          order_type: tradeType === "buy" ? "sell" : "buy",
          commission: advertiserData.commission,
        })
      );
      const path = `/p2p/${encodeURIComponent(id)}/matched/?${searchParams.toString()}`;

      logTradePreview("navigate → matched page", { tradeId: id, path });

      // Full navigation so market modal unmount / table refetch cannot cancel client routing.
      if (typeof window !== "undefined") {
        window.location.assign(path);
        return;
      }
      router.replace(path);
    },
    [tradeType, advertiserData.commission, router]
  );

  const navigateToMatchedRef = useRef(navigateToMatched);
  navigateToMatchedRef.current = navigateToMatched;

  const handleNavigateToMatched = useCallback((resolvedTradeId: string) => {
    const id =
      resolvedTradeId?.trim() ||
      pendingTradeIdRef.current?.trim() ||
      (typeof window !== "undefined"
        ? localStorage.getItem("p2p_trade_id")?.trim()
        : null) ||
      "";
    if (!id) return;
    pendingTradeIdRef.current = id;
    navigateToMatchedRef.current(id);
  }, []);

  const { userPaymentDetails, userDetailsLoading } = useSelector(
    (state: RootState) => state.paymentMethods || { userPaymentDetails: [], userDetailsLoading: false }
  );

  const getPaymentDetailId = (detail: any): number | null => {
    if (!detail || typeof detail !== "object") return null;
    const rawId =
      detail.id ??
      detail.user_payment_detail_id ??
      detail.payment_detail_id ??
      detail.provider_id;
    const normalized = Number(rawId);
    return Number.isFinite(normalized) ? normalized : null;
  };

  // Log when user opens trade preview from market table
  useEffect(() => {
    logTradePreview("opened", {
      marketOrderId: advertiserData.id,
      advertiser: advertiserData.advertiser,
      tradeType: tradeType ?? "(unknown)",
      commission: advertiserData.commission,
      limit: advertiserData.limit,
      available: advertiserData.available,
    });
    logTradePreviewSockets(advertiserData.id, "preview-open (order id until match)");
  }, [
    advertiserData.id,
    advertiserData.advertiser,
    advertiserData.commission,
    advertiserData.limit,
    advertiserData.available,
    tradeType,
  ]);

  // Reset image error when advertiser data changes
  useEffect(() => {
    setImageError(false);
  }, [advertiserData.id, advertiserData.advertiser_photo]);

  const commissionRate = parseFloat(advertiserData.commission);
  const minAmount = advertiserData.minAmount;
  const maxAmount = advertiserData.maxAmount;
  const rangeLimitSuffix = advertiserData.range_currency?.toUpperCase() === "KES" ? "KES" : "USD";
  // Buy flow limits are already returned in their range currency (KES/USD).
  const buyRangeMin = minAmount;
  const buyRangeMax = maxAmount;
  const availableAmount = advertiserData.availableAmount || 0;
  // When commissionRate is 0, limits are treated as already in USDT (legacy).
  const effectiveSellMinUsdt =
    commissionRate <= 0 && availableAmount < minAmount ? 0.01 : minAmount;
  const effectiveSellMaxUsdt = (() => {
    // Sell-side ad limits are in USDT, same unit as available assets.
    return Math.max(0, Math.min(maxAmount, availableAmount));
  })();
  const displayedAvailableAssets =
    rangeLimitSuffix === "KES" && commissionRate > 0
      ? `${availableAmount.toFixed(2)} USDT (${(
          availableAmount * commissionRate
        ).toFixed(2)} KES)`
      : `${availableAmount.toFixed(2)} USDT`;
  const buyBelowAdMin =
    tradeType === "buy" &&
    isBuyAvailableBelowAdMin({
      rangeMin: buyRangeMin,
      rangeMax: buyRangeMax,
      availableUsdt: availableAmount,
      commissionRate,
      rangeCurrency: rangeLimitSuffix,
    });
  const buyRemainderMaxFiat =
    commissionRate > 0 ? availableAmount * commissionRate : availableAmount;
  // When leftover USDT is below ad min, show remainder range instead of full order limits.
  const displayedLimitRange = buyBelowAdMin
    ? `Up to ${availableAmount.toFixed(2)} USDT (${buyRemainderMaxFiat.toFixed(2)} ${rangeLimitSuffix})`
    : `${buyRangeMin.toFixed(2)} - ${buyRangeMax.toFixed(2)} ${rangeLimitSuffix}`;
  // Sell input and limits are both in USDT.
  const sellRangeMinUsdt = effectiveSellMinUsdt;
  const sellRangeMaxUsdt = effectiveSellMaxUsdt;
  const displayedSellRange =
    rangeLimitSuffix === "KES"
      ? `${minAmount.toFixed(2)} - ${maxAmount.toFixed(2)} KES`
      : `${sellRangeMinUsdt.toFixed(2)} - ${sellRangeMaxUsdt.toFixed(2)} USDT`;

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
    return paymentDetails.map((detail: any, index: number) => {
      const provider = detail.provider || detail.provider_name || "Payment Method";
      const accountNumber =
        detail.account_number ||
        detail.wallet_address ||
        detail.account ||
        detail.number ||
        "";
      return {
        id: detail.id || index,
        value: provider,
        label: accountNumber ? `${provider} (${accountNumber})` : provider,
      };
    });
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

  const shouldShowPaymentSearch = paymentOptions.length > 1;

  // User's payment methods that match the selected advertiser payment method (sell only, includes verified + pending)
  const matchingUserPaymentMethods = React.useMemo(() => {
    if (tradeType !== "sell" || !paymentMethod || !userPaymentDetails?.length) return [];
    const selectedLower = paymentMethod.toLowerCase().trim();

    const cryptoKeywords = /\b(crypto|wallet|usdt|bsc|bep20|trc20|tron|tether|erc20|polygon|matic|arb|bitcoin|btc|eth)\b/i;

    const chainHints = (s: string) => ({
      bsc: /\b(bsc|bep20|binance)\b/i.test(s),
      trc: /\b(trc20|tron)\b/i.test(s),
      erc: /\b(erc20|ethereum|\beth\b)\b/i.test(s),
    });

    return (userPaymentDetails as any[]).filter((d: any) => {
      if (!d || typeof d !== "object") return false;
      const userProvider = (d.payment_provider_name || d.provider_name || d.provider || "").toLowerCase().trim();
      const userMethod = (d.payment_method_name || "").toLowerCase().trim();
      if (!userProvider && !userMethod) return false;

      if (userProvider && (selectedLower.includes(userProvider) || userProvider.includes(selectedLower))) {
        return true;
      }

      const adCrypto = cryptoKeywords.test(selectedLower);
      const userCrypto =
        cryptoKeywords.test(userProvider) ||
        cryptoKeywords.test(userMethod) ||
        (String(d.payment_method_name || "").toLowerCase().includes("crypto") &&
          String(d.wallet_address || "").trim().length > 0);

      if (adCrypto && userCrypto) {
        const adC = chainHints(selectedLower);
        const usrC = chainHints(`${userProvider} ${userMethod}`);
        const adHasChain = adC.bsc || adC.trc || adC.erc;
        const usrHasChain = usrC.bsc || usrC.trc || usrC.erc;
        if (adHasChain && usrHasChain) {
          return (adC.bsc && usrC.bsc) || (adC.trc && usrC.trc) || (adC.erc && usrC.erc);
        }
        // Generic ad label (e.g. "Crypto Wallet") with no explicit chain → match any saved crypto wallet
        if (!adHasChain && usrHasChain) return true;
        if (adHasChain && !usrHasChain) return false;
        return true;
      }

      return false;
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
  }, [tradeType, paymentMethod, matchingUserPaymentMethods.length, scrollContainerRef]);

  // Position and show dropdown outside modal (portal) on sell
  const paymentDropdownPortalRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!isPaymentDropdownOpen) {
      setDropdownPosition(null);
      return;
    }
    const measure = () => {
      if (paymentDropdownRef.current) {
        const rect = paymentDropdownRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const margin = 8;
        const estimatedDropdownHeight = 320; // Search + options list area.
        const spaceBelow = viewportHeight - rect.bottom - margin;
        // Always open below the trigger.
        const top = Math.max(margin, rect.bottom + margin);
        const maxHeight = Math.max(
          120,
          Math.min(estimatedDropdownHeight, Math.max(120, spaceBelow))
        );

        // Keep dropdown horizontally visible on narrow screens.
        const maxWidth = viewportWidth - margin * 2;
        const width = Math.max(220, Math.min(rect.width, maxWidth));
        const left = Math.max(
          margin,
          Math.min(rect.left, viewportWidth - width - margin)
        );

        setDropdownPosition({ top, left, width, maxHeight });
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


  // For sell: use common wallet amounts from transaction summary (available_amount) when available
  const summaryAmounts = transactionSummary ? getWalletAmountsFromSummary(transactionSummary) : null;
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

  const fallbackWalletBalance = Math.max(0, profileBalance - totalLocked);
  const summaryAvailableBalance = summaryAmounts?.availableAmount ?? 0;
  const directWalletBalance = Math.max(0, baseWalletBalance);
  const totalWalletBalance = Math.max(0, totalBalance);
  // Prefer a non-zero source to avoid false "0.00 USDT" when one source lags.
  const walletBalanceCandidates = [
    summaryAvailableBalance,
    fallbackWalletBalance,
    directWalletBalance,
    totalWalletBalance,
  ].filter((v) => Number.isFinite(v) && v >= 0);
  const walletBalance = Math.max(0, ...walletBalanceCandidates, 0);
  const sellAvailableBalance =
    summaryAmounts?.availableAmount ?? walletBalance;

  const buyOrderBounds = React.useMemo(
    () => ({
      rangeMin: buyRangeMin,
      rangeMax: buyRangeMax,
      availableUsdt: availableAmount,
      commissionRate,
      rangeCurrency: rangeLimitSuffix,
    }),
    [
      buyRangeMin,
      buyRangeMax,
      availableAmount,
      commissionRate,
      rangeLimitSuffix,
    ]
  );

  const sellOrderBounds = React.useMemo(
    () => ({
      minUsdt: sellRangeMinUsdt,
      maxUsdt: sellRangeMaxUsdt,
      walletBalance: sellAvailableBalance,
      commissionRate,
      rangeCurrency: rangeLimitSuffix,
    }),
    [
      sellRangeMinUsdt,
      sellRangeMaxUsdt,
      sellAvailableBalance,
      commissionRate,
      rangeLimitSuffix,
    ]
  );

  const applyAmountValidation = (result: AmountValidationResult) => {
    setIsAmountValid(result.valid);
    setErrorMessage(result.message);
  };

  const handleSetMaxAmount = () => {
    if (tradeType === "sell") {
      const sellMaxAmount = Math.min(sellRangeMaxUsdt, sellAvailableBalance);
      handleSendAmountChange(sellMaxAmount > 0 ? sellMaxAmount.toFixed(2) : "");
      return;
    }

    const { maxSend } = getBuyOrderLimits(buyOrderBounds);
    handleSendAmountChange(maxSend > 0 ? maxSend.toFixed(2) : "");
  };

  const handleSendAmountChange = (value: string) => {
    setActiveField("send");
    setSendAmount(value);

    if (!value.trim()) {
      setIsAmountValid(true);
      setErrorMessage("");
      setReceiveAmount("");
      return;
    }

    if (isIncompleteTradeAmountInput(value)) {
      setIsAmountValid(true);
      setErrorMessage("");
      return;
    }

    const parsed = parseTradeAmountInput(value);
    if (parsed === null) {
      setIsAmountValid(false);
      setErrorMessage("Enter a valid amount");
      setReceiveAmount("");
      return;
    }

    setNumericAmount(parsed);
    const rate = commissionRate > 0 ? commissionRate : 1;

    if (tradeType === "sell") {
      setReceiveAmount((parsed * rate).toFixed(2));
      applyAmountValidation(validateSellSendUsdt(parsed, sellOrderBounds));
      return;
    }

    setReceiveAmount((parsed / rate).toFixed(2));
    applyAmountValidation(validateBuySendAmount(parsed, buyOrderBounds));
  };

  const handleReceiveAmountChange = (value: string) => {
    setActiveField("receive");
    setReceiveAmount(value);

    if (!value.trim()) {
      setIsAmountValid(true);
      setErrorMessage("");
      setSendAmount("");
      return;
    }

    if (isIncompleteTradeAmountInput(value)) {
      setIsAmountValid(true);
      setErrorMessage("");
      return;
    }

    const parsed = parseTradeAmountInput(value);
    if (parsed === null) {
      setIsAmountValid(false);
      setErrorMessage("Enter a valid amount");
      setSendAmount("");
      return;
    }

    setNumericAmount(parsed);
    const rate = commissionRate > 0 ? commissionRate : 1;

    if (tradeType === "sell") {
      setSendAmount((parsed / rate).toFixed(2));
      applyAmountValidation(validateSellReceiveFiat(parsed, sellOrderBounds));
      return;
    }

    setSendAmount((parsed * rate).toFixed(2));
    applyAmountValidation(validateBuyReceiveUsdt(parsed, buyOrderBounds));
  };

  const isFormValid = () => {
    if (!sendAmount || !paymentMethod) {
      return false;
    }
    if (!isAmountValid) {
      return false;
    }
    if (tradeType === "sell" && paymentMethod && !userDetailsLoading) {
      if (matchingUserPaymentMethods.length > 0 && !selectedUserPaymentDetail) return false;
      if (
        matchingUserPaymentMethods.length > 0 &&
        selectedUserPaymentDetail &&
        getPaymentDetailId(selectedUserPaymentDetail) == null
      ) {
        return false;
      }
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
      logTradePreview("submit → match order", {
        marketOrderId: advertiserData.id,
        tradeType,
        amount: tradeType === "sell" ? sendAmount : receiveAmount,
      });
      // Create order data: API expects USDT amount (asset being traded)
      // For buy: receiveAmount is USDT. For sell: sendAmount is USDT.
      const orderData: OrderMatchRequest = {
        amount: tradeType === "sell" ? sendAmount : receiveAmount,
      };

      if (tradeType === "sell") {
        const selectedPaymentDetailId = getPaymentDetailId(selectedUserPaymentDetail);
        if (selectedPaymentDetailId != null) {
          orderData.payment_details_ids = [selectedPaymentDetailId];
        }
      }

      const response = await matchP2POrder(advertiserData.id, orderData);
      logTradePreview("match API response", { response });

      const tradeIdFromResponse = extractTradeIdFromMatchResponse(response);
      const confirmHint = tradeIdFromResponse || advertiserData.id;
      const confirm = await fetchP2PTradeConfirmOnce(confirmHint);
      const tradeId = confirm
        ? canonicalTradeIdFromConfirm(confirm)
        : tradeIdFromResponse || advertiserData.id;

      if (confirm) {
        dispatch(setConfirmOrderSnapshot(confirm));
      }

      pendingTradeIdRef.current = tradeId;
      if (tradeId) {
        try {
          localStorage.setItem("p2p_trade_id", tradeId);
        } catch {
          /* no-op */
        }
      }

      const alreadyAccepted = confirm
        ? isTradeAcceptedFromConfirmOrder(confirm)
        : false;

      logTradePreview("confirm fetched once after match", {
        marketOrderId: advertiserData.id,
        sell_order: confirm?.sell_order,
        buy_order: confirm?.buy_order,
        tradeIdFromResponse,
        confirmId: confirm?.id,
        tradeId,
        status: confirm?.status,
        alreadyAccepted,
      });
      logTradePreviewSockets(tradeId, "after-match");

      if (alreadyAccepted) {
        logTradePreview("already accepted → navigating immediately");
        navigateToMatched(tradeId);
        setIsSubmitting(false);
        return;
      }
      logTradePreview("showing wait modal (pending acceptance)", { tradeId });
      setAwaitingAcceptanceTradeId(tradeId);
      setIsSubmitting(false);
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
              <div className="relative shrink-0">
                {advertiserData.advertiser_photo && !imageError ? (
                  <img
                    src={advertiserData.advertiser_photo}
                    alt={advertiserData.advertiser}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold bg-[#1D8751] text-white flex-shrink-0">
                    {advertiserData.advertiserInitials}
                  </div>
                )}
                <PresenceIndicator isOnline={advertiserData.online} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  <span className="truncate" title={advertiserData.advertiser}>
                    {shortenLongName(advertiserData.advertiser)}
                  </span>
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
                  {displayedAvailableAssets}
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
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
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
            <div className="text-left text-base sm:text-lg font-semibold text-gray-900 dark:text-white mt-0 lg:mt-1">
              Rate:{" "}
              <span className="text-[#1D8751]">
                {formatRateWithoutCurrency(advertiserData.commission)}
              </span>
            </div>
            {/* For Sell: I Want to Sell (USDT) first, I Want to Receive (USD) second. For Buy: I Want to Send (USD) first, I Want to Receive (USDT) second. */}
            {tradeType === "sell" ? (
              <>
                {/* I Want to Sell - USDT (seller sells this) */}
                <div className="flex flex-col gap-2 sm:gap-2 rounded-xl p-3 sm:p-3 border border-gray-300 dark:border-[#35353E] bg-gray-100 dark:bg-transparent">
                  <div className="text-sm sm:text-base text-gray-500 dark:text-[#788099] font-semibold">
                    I Want to Sell
                  </div>
                  <div className="flex flex-col gap-2 sm:gap-2">
                    <div className="flex items-center justify-between gap-2 pl-0 sm:pl-2">
                      <div className="text-sm text-gray-500 dark:text-[#788099] font-medium">
                        Range: {displayedSellRange}
                      </div>
                      <button
                        type="button"
                        onClick={handleSetMaxAmount}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold border border-[#1D8751] text-[#1D8751] hover:bg-[#1D8751] hover:text-white transition"
                      >
                        Max
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <span className="text-2xl sm:text-3xl text-[#1D8751] font-semibold flex-shrink-0">
                        <img src="/images/tether.svg" alt="USDT" className="w-6 h-6 sm:w-8 sm:h-8" />
                      </span>
                      <input
                        type="number"
                        value={sendAmount}
                        onChange={(e) => handleSendAmountChange(e.target.value)}
                        placeholder="220"
                        className={`flex-1 bg-transparent text-lg sm:text-xl font-semibold focus:outline-none rounded-xl px-3 sm:px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#788099] ${!isAmountValid && errorMessage && activeField === "send" ? "border border-red-500" : ""
                          }`}
                      />
                      <div className="relative w-full sm:w-auto">
                        <select
                          className="rounded px-3 py-2 text-sm sm:text-base font-semibold min-w-[90px] sm:min-w-[100px] w-full bg-white dark:bg-transparent text-gray-900 dark:text-white"
                          value="USDT"
                          disabled
                        >
                          <option>USDT</option>
                        </select>
                      </div>
                    </div>
                    {!isAmountValid && errorMessage && activeField === "send" && (
                      <div className="text-sm text-red-500 pl-0 sm:pl-2 font-semibold">
                        {errorMessage}
                      </div>
                    )}
                  </div>
                </div>
                {/* I Want to Receive - range currency (USD or KES, buyer sends this to seller) */}
                <div className="rounded-xl p-3 sm:p-3 flex flex-col gap-2 sm:gap-2 border border-gray-300 dark:border-[#35353E] bg-gray-100 dark:bg-transparent">
                  <div className="text-sm sm:text-base text-gray-500 dark:text-[#788099] font-semibold">
                    I Want to Receive
                  </div>
                  <div className="flex flex-col gap-2 sm:gap-2">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <span className="text-2xl sm:text-3xl text-[#1D8751] font-semibold flex-shrink-0">
                        {rangeLimitSuffix === "KES" ? "KES" : "$"}
                      </span>
                      <input
                        type="number"
                        value={receiveAmount}
                        onChange={(e) => handleReceiveAmountChange(e.target.value)}
                        placeholder={`220 ${rangeLimitSuffix}`}
                        max={advertiserData.availableAmount || 0}
                        className={`flex-1 bg-transparent text-lg sm:text-xl font-semibold focus:outline-none rounded-xl px-3 sm:px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#788099] ${!isAmountValid && errorMessage && activeField === "receive" ? "border border-red-500" : ""
                          }`}
                      />
                      <div className="relative w-full sm:w-auto">
                        <select
                          className="rounded px-3 py-2 text-sm sm:text-base font-semibold min-w-[90px] sm:min-w-[100px] w-full bg-white dark:bg-transparent text-gray-900 dark:text-white"
                          value={rangeLimitSuffix}
                          disabled
                        >
                          <option>{rangeLimitSuffix}</option>
                        </select>
                      </div>
                    </div>
                    {!isAmountValid && errorMessage && activeField === "receive" && (
                      <div className="text-sm text-red-500 pl-0 sm:pl-2 font-semibold">
                        {errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* I Want to Send - range currency (USD or KES, buy flow) */}
                <div className="flex flex-col gap-2 sm:gap-2 rounded-xl p-3 sm:p-3 border border-gray-300 dark:border-[#35353E] bg-gray-100 dark:bg-transparent">
                  <div className="text-sm sm:text-base text-gray-500 dark:text-[#788099] font-semibold">
                    I Want to Send
                  </div>
                  <div className="flex flex-col gap-2 sm:gap-2">
                    <div className="flex items-center justify-between gap-2 pl-0 sm:pl-2">
                      <div className="text-sm text-gray-500 dark:text-[#788099] font-medium">
                        Range: {displayedLimitRange}
                      </div>
                      <button
                        type="button"
                        onClick={handleSetMaxAmount}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold border border-[#1D8751] text-[#1D8751] hover:bg-[#1D8751] hover:text-white transition"
                      >
                        Max
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <span className="text-2xl sm:text-3xl text-[#1D8751] font-semibold flex-shrink-0">
                        {rangeLimitSuffix === "KES" ? "KES" : "$"}
                      </span>
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
                        className={`flex-1 bg-transparent text-lg sm:text-xl font-semibold focus:outline-none rounded-xl px-3 sm:px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#788099] ${!isAmountValid && errorMessage && activeField === "send" ? "border border-red-500" : ""
                          }`}
                      />
                      <div className="relative w-full sm:w-auto">
                        <select
                          className="rounded px-3 py-2 text-sm sm:text-base font-semibold min-w-[90px] sm:min-w-[100px] w-full bg-white dark:bg-transparent text-gray-900 dark:text-white"
                          value={rangeLimitSuffix}
                          disabled
                        >
                          <option>{rangeLimitSuffix}</option>
                        </select>
                      </div>
                    </div>
                    {!isAmountValid && errorMessage && activeField === "send" && (
                      <div className="text-sm text-red-500 pl-0 sm:pl-2 font-semibold">
                        {errorMessage}
                      </div>
                    )}
                  </div>
                </div>
                {/* I Want to Receive - USDT (buy flow) */}
                <div className="rounded-xl p-3 sm:p-3 flex flex-col gap-2 sm:gap-2 border border-gray-300 dark:border-[#35353E] bg-gray-100 dark:bg-transparent">
                  <div className="text-sm sm:text-base text-gray-500 dark:text-[#788099] font-semibold">
                    I Want to Receive
                  </div>
                  <div className="flex flex-col gap-2 sm:gap-2">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <span className="text-2xl sm:text-3xl text-[#1D8751] font-semibold flex-shrink-0">
                        <img src="/images/tether.svg" alt="USDT" className="w-6 h-6 sm:w-8 sm:h-8" />
                      </span>
                      <input
                        type="number"
                        value={receiveAmount}
                        onChange={(e) => handleReceiveAmountChange(e.target.value)}
                        placeholder="220 USDT"
                        max={advertiserData.availableAmount || 0}
                        className={`flex-1 bg-transparent text-lg sm:text-xl font-semibold focus:outline-none rounded-xl px-3 sm:px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#788099] ${!isAmountValid && errorMessage && activeField === "receive" ? "border border-red-500" : ""
                          }`}
                      />
                    </div>
                    {!isAmountValid && errorMessage && activeField === "receive" && (
                      <div className="text-sm text-red-500 pl-0 sm:pl-2 font-semibold">
                        {errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            {/* Payment Method Select - Buy: inside a card like "I Want to Send/Receive"; Sell: standalone then card for user methods */}
            {tradeType === "buy" ? (
              <div className="rounded-xl p-3 sm:p-3 border border-gray-300 dark:border-[#35353E] bg-gray-100 dark:bg-transparent flex flex-col gap-2 sm:gap-2" ref={paymentDropdownRef}>
                <div className="text-sm sm:text-base text-gray-500 dark:text-[#788099] font-semibold">
                  Payment method
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPaymentDropdownOpen((prev) => !prev)}
                    className="w-full rounded-xl px-3 sm:px-4 py-2.5 pr-12 text-sm sm:text-base font-semibold border border-gray-300 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D8751] flex items-center justify-between"
                  >
                    <span className="truncate text-left">
                      {selectedPaymentSummary}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-500 dark:text-[#788099] transition-transform flex-shrink-0 ${isPaymentDropdownOpen ? "rotate-180" : ""
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
                  {typeof document !== "undefined" &&
                    isPaymentDropdownOpen &&
                    dropdownPosition &&
                    createPortal(
                      <div
                        ref={paymentDropdownPortalRef}
                        className="rounded-xl border border-gray-300 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] shadow-lg overflow-hidden flex flex-col"
                        style={{
                          position: "fixed",
                          top: dropdownPosition.top,
                          left: dropdownPosition.left,
                          width: dropdownPosition.width,
                          maxHeight: dropdownPosition.maxHeight,
                          zIndex: 2147483647,
                        }}
                      >
                        {shouldShowPaymentSearch && (
                          <div className="p-2 border-b border-gray-200 dark:border-[#35353E]">
                            <input
                              type="text"
                              placeholder="Search payment method..."
                              value={paymentSearchTerm}
                              onChange={(e) => setPaymentSearchTerm(e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-[#35353E] bg-gray-50 dark:bg-[#23232B] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#788099] focus:outline-none focus:ring-2 focus:ring-[#1D8751]"
                            />
                          </div>
                        )}
                        <div className="overflow-y-auto">
                          {paymentOptions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-[#788099]">
                              No payment methods available
                            </div>
                          ) : filteredPaymentOptions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-[#788099]">
                              No matching payment methods
                            </div>
                          ) : (
                            filteredPaymentOptions.map((opt) => {
                              const isSelected = paymentMethod === opt.value;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    setPaymentMethod(opt.value);
                                    setIsPaymentDropdownOpen(false);
                                    setPaymentSearchTerm("");
                                  }}
                                  className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-[#35353E] ${isSelected
                                      ? "text-gray-900 dark:text-white bg-gray-50 dark:bg-[#35353E]"
                                      : "text-gray-700 dark:text-[#C7CAD1]"
                                    }`}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected
                                      ? "border-[#1D8751] bg-[#1D8751]"
                                      : "border-gray-400 dark:border-[#788099]"
                                    }`}>
                                    {isSelected && (
                                      <div className="w-2 h-2 rounded-full bg-white"></div>
                                    )}
                                  </div>
                                  <span className="text-sm sm:text-base font-semibold">{opt.label}</span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>,
                      document.body
                    )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2" ref={paymentDropdownRef}>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPaymentDropdownOpen((prev) => !prev)}
                    className="w-full rounded-xl px-3 sm:px-4 py-2.5 pr-12 text-sm sm:text-base font-semibold border border-gray-300 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D8751] flex items-center justify-between"
                  >
                    <span className="truncate text-left">
                      {selectedPaymentSummary}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-500 dark:text-[#788099] transition-transform ${isPaymentDropdownOpen ? "rotate-180" : ""
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
                  {typeof document !== "undefined" &&
                    isPaymentDropdownOpen &&
                    dropdownPosition &&
                    createPortal(
                      <div
                        ref={paymentDropdownPortalRef}
                        className="rounded-xl border border-gray-300 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] shadow-lg overflow-hidden flex flex-col"
                        style={{
                          position: "fixed",
                          top: dropdownPosition.top,
                          left: dropdownPosition.left,
                          width: dropdownPosition.width,
                          maxHeight: dropdownPosition.maxHeight,
                          zIndex: 2147483647,
                        }}
                      >
                        {shouldShowPaymentSearch && (
                          <div className="p-2 border-b border-gray-200 dark:border-[#35353E]">
                            <input
                              type="text"
                              placeholder="Search payment method..."
                              value={paymentSearchTerm}
                              onChange={(e) => setPaymentSearchTerm(e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-[#35353E] bg-gray-50 dark:bg-[#23232B] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#788099] focus:outline-none focus:ring-2 focus:ring-[#1D8751]"
                            />
                          </div>
                        )}
                        <div className="overflow-y-auto">
                          {paymentOptions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-[#788099]">
                              No payment methods available
                            </div>
                          ) : filteredPaymentOptions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-[#788099]">
                              No matching payment methods
                            </div>
                          ) : (
                            filteredPaymentOptions.map((opt) => {
                              const isSelected = paymentMethod === opt.value;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    setPaymentMethod(opt.value);
                                    setIsPaymentDropdownOpen(false);
                                    setPaymentSearchTerm("");
                                  }}
                                  className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-[#35353E] ${isSelected
                                      ? "text-gray-900 dark:text-white bg-gray-50 dark:bg-[#35353E]"
                                      : "text-gray-700 dark:text-[#C7CAD1]"
                                    }`}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected
                                      ? "border-[#1D8751] bg-[#1D8751]"
                                      : "border-gray-400 dark:border-[#788099]"
                                    }`}>
                                    {isSelected && (
                                      <div className="w-2 h-2 rounded-full bg-white"></div>
                                    )}
                                  </div>
                                  <span className="text-sm sm:text-base font-semibold">{opt.label}</span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>,
                      document.body
                    )}
                </div>
              </div>
            )}

            {/* Sell: User's matching payment methods - select one or add new */}
            {tradeType === "sell" && paymentMethod && (
              <div className="flex flex-col gap-2 rounded-xl p-3 border border-gray-300 dark:border-[#35353E] bg-gray-50 dark:bg-[#1D1D23]">
                <div className="text-sm font-semibold text-gray-700 dark:text-[#788099]">
                  Your {paymentMethod} payment methods
                </div>
                <p className="text-xs text-gray-500 dark:text-[#788099]">
                  Newly added methods may show as pending until verified.
                </p>
                {userDetailsLoading ? (
                  <div className="flex items-center gap-2 py-2 text-sm text-gray-500 dark:text-[#788099]">
                    <div className="w-4 h-4 border-2 border-[#1D8751] border-t-transparent rounded-full animate-spin" />
                    Loading your payment methods...
                  </div>
                ) : matchingUserPaymentMethods.length > 0 ? (
                  <>
                    <div className="flex flex-col gap-2">
                      {matchingUserPaymentMethods.map((detail: any) => {
                        const selectedId = getPaymentDetailId(selectedUserPaymentDetail);
                        const currentId = getPaymentDetailId(detail);
                        const isSelected =
                          selectedId != null &&
                          currentId != null &&
                          selectedId === currentId;
                        const status = (detail.status || "").toLowerCase();
                        const isPending = status && status !== "approved" && status !== "verified";
                        return (
                          <div
                            key={detail.id}
                            className={`flex items-center justify-between gap-2 p-2 rounded-lg border transition-colors ${isSelected
                                ? "border-[#1D8751] bg-[#1D8751]/10 dark:bg-[#1D8751]/20"
                                : "border-gray-200 dark:border-[#35353E] hover:bg-gray-100 dark:hover:bg-[#23232B]"
                              }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {detail.provider_logo || detail.logo_url ? (
                                <img
                                  src={detail.provider_logo || detail.logo_url}
                                  alt=""
                                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-[#1D8751]/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-[#1D8751] text-xs font-bold">
                                    {(detail.payment_provider_name || "?")[0]}
                                  </span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {(detail.account_name || "Account") +
                                    ` (${detail.account_number || detail.wallet_address || "—"})`}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => !isPending && setSelectedUserPaymentDetail(isSelected ? null : detail)}
                              disabled={isPending}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-shrink-0 ${isPending
                                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 cursor-not-allowed"
                                  : isSelected
                                    ? "bg-[#1D8751] text-white"
                                    : "border border-[#1D8751] text-[#1D8751] hover:bg-[#1D8751] hover:text-white"
                                }`}
                            >
                              {isPending ? "Pending" : isSelected ? "Selected" : "Select"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddPaymentModal(true)}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#1D8751] text-white text-sm font-semibold hover:bg-[#166b3e] transition"
                      >
                        Add new {paymentMethod} payment method
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-600 dark:text-[#788099]">
                      No matching {paymentMethod} payment method found. Add one to continue.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddPaymentModal(true)}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#1D8751] text-white text-sm font-semibold hover:bg-[#166b3e] transition"
                    >
                      Add new {paymentMethod} payment method
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-1">
              <button
                className="w-full sm:flex-1 py-2.5 sm:py-2 rounded-lg border font-semibold text-sm sm:text-base transition border-gray-400 dark:border-[#788099] text-gray-700 dark:text-[#788099] hover:bg-gray-200 dark:hover:bg-[var(--card-color)]"
                onClick={onClose}
                disabled={isSubmitting || !!awaitingAcceptanceTradeId}
              >
                Close
              </button>
              <button
                className={`w-full sm:flex-1 py-2.5 sm:py-2 rounded-lg font-semibold text-sm sm:text-base transition text-white ${tradeType === "sell"
                    ? "bg-[#E23D3A] hover:bg-[#b71c1c]"
                    : "bg-[#1D8751] hover:bg-[#17643a]"
                  } ${!isFormValid() || isSubmitting || !!awaitingAcceptanceTradeId
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                  }`}
                onClick={handleSubmit}
                disabled={!isFormValid() || isSubmitting || !!awaitingAcceptanceTradeId}
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
    <>
      <div className="rounded-2xl pt-2 pb-3 px-3 sm:pt-3 sm:pb-4 sm:px-4 lg:pt-3 lg:pb-5 lg:px-6 w-full max-w-5xl mx-auto flex flex-col gap-2 sm:gap-3 border border-gray-300 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] text-gray-900 dark:text-white">
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

      <PaymentMethodsModal
        open={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
        onAdd={async () => {
          await dispatch(fetchUserPaymentDetails() as any);
        }}
        filterByProviderName={tradeType === "sell" ? paymentMethod || undefined : undefined}
      />

      {awaitingAcceptanceTradeId && (
        <PendingAcceptanceWaitModal
          open
          tradeId={awaitingAcceptanceTradeId}
          advertiserOrderId={advertiserData.id}
          advertiserName={advertiserData.advertiser}
          advertiserPhoto={advertiserData.advertiser_photo}
          advertiserInitials={advertiserData.advertiserInitials}
          isOnline={advertiserData.online}
          onNavigateToMatched={handleNavigateToMatched}
          onClose={() => {
            setAwaitingAcceptanceTradeId(null);
            onClose?.();
          }}
        />
      )}
    </>
  );
};

export default TradePreview;