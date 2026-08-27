"use client";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { FaExchangeAlt, FaExclamationCircle, FaWallet, FaInfoCircle, FaPaste } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch } from "@/store";
import {
  fetchUserPaymentDetails,
} from "@/features/exchange/slices/paymentSlice";
import { fetchAssets } from "@/features/exchange/slices/exchangeSlice";
import { createDeposit } from "@/features/exchange/slices/exchangeSlice";
import {
  fetchSupportedAssets,
  fetchSwapEstimate,
} from "@/features/swap/slices/swapSlice";
import { validateWalletAddress } from "@/lib/addressValidaion";
import { showToast } from "@/lib/utils/toast";
import { formatNumber, formatBalance } from "@/utils/formatters";
import { formatCurrency } from "@/lib/globalFormatter";
import { DepositResponse } from "@/features/exchange/types";
import { SupportedAsset } from "@/features/swap/types";
// (no asset search UI in this dropdown)
import { createP2PWithdrawal, fetchCommission, getCommissionApiAsset } from "../../api";
import { P2PWithdrawalRequest, P2PWithdrawalResponse } from "../../types";
import {
  verifyWithdrawal,
  resendWithdrawalOTP,
} from "../../../../../slices/withdrawSlice";
import InfoModal from "./info";
import { debugAssetFetching } from "@/lib/utils/debugAssets";
import OTPModal from "./OTPModal";

import { logger } from '@/lib/utils/logger';
import { withTimeout } from "@/lib/utils/fetchWithTimeout";
import { useExpressI18n } from "@/lib/useExpressI18n";
import { useTheme } from "@/context/theme";
import { ExpressP2PWithdrawalTermsPanel } from "@/features/express/components/legal/ExpressP2PWithdrawalTermsPanel";
import { selectP2PWalletAmounts, selectTransactionSummary } from "@/features/p2p/selectors";
import { reportAssetLoadIssue } from "@/lib/utils/assetLoadNotice";
import {
  setP2PLegalReturnState,
  consumeP2PLegalReturnState,
} from "@/lib/utils/authRedirect";
import { scrollAppToTop } from "@/lib/utils/scrollAppToTop";
import { useBookmarkedAddresses } from "@/features/express/hooks/useBookmarkedAddresses";
import { BookmarkDropdown } from "@/features/express/components/forms/BookmarkDropdown";
import { pickPreferredPaymentAccountForAutoSelect } from "@/features/express/utils/paymentAccountStatus";
import { resolveP2pAccountHoldMessage } from "@/features/p2p/utils/errorHandler";
import ScamFlagSubmitBanner from "@/features/express/components/ScamFlagSubmitBanner";
import { isScamFlagUserMessage } from "@/lib/utils/scamFlagError";
import { useAssetsDisplay } from "@/features/express/hooks/useDataDisplay";

const formatUnknownError = (error: unknown): string => {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || "Unknown error";
  const anyErr = error as any;
  const respMsg =
    anyErr?.response?.data?.message ||
    anyErr?.response?.data?.error ||
    anyErr?.response?.data?.detail;
  if (typeof respMsg === "string" && respMsg.trim()) return respMsg;
  const msg = anyErr?.message;
  if (typeof msg === "string" && msg.trim()) return msg;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

const isConditionAbortError = (error: unknown): boolean => {
  const msg = formatUnknownError(error);
  return (
    typeof msg === "string" &&
    msg.toLowerCase().includes("aborted due to condition callback returning false")
  );
};

// Success Modal Component
const SuccessModal = ({
  isOpen,
  onClose,
  amount,
  asset,
  onNavigateToP2P,
}: {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  asset: any;
  onNavigateToP2P: () => void;
}) => {
  const { t } = useExpressI18n();
  const { isDark } = useTheme();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`${isDark ? "bg-[#2A2A2A]" : "bg-white"} rounded-3xl p-6 sm:p-8 max-w-sm w-full mx-4 text-center shadow-2xl`}>
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#4CAF50] rounded-full flex items-center justify-center">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <path
                d="M9 12l2 2 4-4"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Success Title */}
        <h2 className={`${isDark ? "text-white" : "text-gray-900"} text-lg sm:text-xl font-semibold mb-3 sm:mb-4`}>
          Successfully Submitted
        </h2>

        {/* Amount Info */}
        <div className="mb-6">
          <p className={`${isDark ? "text-gray-400" : "text-gray-600"} text-sm mb-2`}>{t("express.youWillReceive", "You Will Receive")}</p>
          <p className={`${isDark ? "text-white" : "text-gray-900"} text-2xl font-bold`}>
            {amount}{" "}
            {asset?.ticker?.toUpperCase() ||
              asset?.symbol?.toUpperCase() ||
              "USDT"}
          </p>
        </div>

        {/* OK Button */}
        <button
          onClick={() => {
            onClose();
            onNavigateToP2P();
          }}
          className="w-full bg-[#4CAF50] text-white py-3 sm:py-3 rounded-xl sm:rounded-2xl text-sm sm:text-lg font-medium hover:bg-[#45a049] transition-colors min-h-[44px] sm:min-h-0"
        >
          OK
        </button>
      </div>
    </div>
  );
};

// Add UserPaymentDetail interface
interface UserPaymentDetail {
  id: number;
  payment_provider_name: string;
  payment_method_name: string;
  account_name: string;
  account_number: string;
  wallet_address?: string;
  // Add fallback properties for compatibility
  provider_name?: string;
  payment_provider?: string;
}

// Add UserPaymentSelector component
const UserPaymentSelector = ({
  userPaymentDetails,
  onSelect,
  onRemove,
  selectedDetails,
}: {
  userPaymentDetails: UserPaymentDetail[];
  onSelect: (detail: UserPaymentDetail) => void;
  onRemove: (detail: UserPaymentDetail) => void;
  selectedDetails: UserPaymentDetail[];
}) => {
  useEffect(() => {
    if (
      userPaymentDetails &&
      userPaymentDetails.length > 0 &&
      selectedDetails.length === 0
    ) {
      const preferred = pickPreferredPaymentAccountForAutoSelect(
        userPaymentDetails
      );
      if (preferred) {
        onSelect(preferred);
      }
    }
  }, [userPaymentDetails, selectedDetails.length, onSelect]);

  return (
    <div className="bg-[var(--card-color)] rounded-xl sm:rounded-2xl border border-[#39394a] p-3 sm:p-4 w-full overflow-hidden">
      <h3 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
        Select Payment Methods
      </h3>
      <div className="space-y-2 w-full">
        {userPaymentDetails && userPaymentDetails.length > 0 ? (
          userPaymentDetails.map((detail) => {
            const isSelected = selectedDetails.some((d) => d.id === detail.id);

            return (
              <div
                key={detail.id}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border w-full overflow-hidden ${isSelected
                  ? "border-[#1D8751] bg-[#1D8751]/10"
                  : "border-[#A2A4A9FF] bg-[#A2A4A9FF]"
                  }`}
              >
                <div className="flex-1 min-w-0 w-full sm:w-auto overflow-hidden pr-0 sm:pr-2">
                  <div className="text-white font-medium text-sm sm:text-base break-words">
                    <span className="break-words inline-block max-w-full">
                      {detail.payment_provider_name ||
                        detail.provider_name ||
                        "Unknown Provider"}
                    </span>
                    <span className="hidden sm:inline"> - </span>
                    <span className="block sm:inline break-words max-w-full">
                      {detail.payment_method_name || "Unknown Method"}
                    </span>
                  </div>
                  <div className="text-[#788099] text-xs sm:text-sm break-words mt-1">
                    <span className="break-words inline-block max-w-full">{detail.account_name}</span>
                    <span className="break-words inline-block max-w-full"> ({detail.account_number})</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (isSelected) {
                      onRemove(detail);
                    } else {
                      onSelect(detail);
                    }
                  }}
                  className={`w-full sm:w-auto sm:flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 flex items-center justify-center whitespace-nowrap ${isSelected
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-[#1D8751] text-white hover:bg-[#166b3e]"
                    }`}
                >
                  {isSelected ? "Remove" : "Select"}
                </button>
              </div>
            );
          })
        ) : (
          <div className="text-center text-[#788099] py-4 text-sm sm:text-base">
            No payment details available
          </div>
        )}
      </div>
    </div>
  );
};

interface DepositFormProps {
  onExchange?: (transactionData: {
    type: "deposit" | "withdrawal";
    amount: number;
    asset: any;
    walletAddress: string;
    network: any;
    transactionId?: string;
    withdrawalAddress?: string;
    message?: string;
    websocketUrl?: string;
    responseType?: string;
    depositCode?: string;
    totalAmountDue?: string;
    commission?: string;
    networkFee?: string;
    currency?: string;
    payoutAddress?: string;
    fromCurrency?: string;
    toCurrency?: string;
    toNetwork?: string;
    estimatedAmount?: number;
    changeNowId?: string;
    status?: string;
  }) => void;
  mode: "deposit" | "withdrawal";
  onModeChange?: (mode: "deposit" | "withdrawal") => void;
  balance?: number;
  isHomePage?: boolean;
  onCancel?: () => void;
  onBeforeLegalNavigate?: () => void;
}

export default function WithdrawalForm({
  onExchange,
  mode,
  onModeChange,
  balance,
  isHomePage = false,
  onCancel,
  onBeforeLegalNavigate,
}: DepositFormProps) {
  const MIN_WITHDRAWAL_AMOUNT = 10;
  const { isDark } = useTheme();
  // Use available amount from transaction summary (same common source as Available.tsx / P2PDashboard)
  const summary = useSelector(selectTransactionSummary);
  const { availableAmount } = useSelector(selectP2PWalletAmounts);
  const availableBalance = summary != null ? availableAmount : (balance ?? 0);
  const effectiveBalance = (typeof availableBalance === "number" && !isNaN(availableBalance))
    ? availableBalance
    : (balance ?? 0);

  logger.debug('p2p', "WithdrawalForm - Received balance:", balance, "availableBalance:", availableBalance);

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { t } = useExpressI18n();
  const { adminPaymentDetails, loading, error } = useSelector(
    (state: any) => state.payment
  );

  const { assets, loading: assetsLoading } = useSelector(
    (state: any) => state.exchange
  );

  // Add swap assets state
  const {
    supportedAssets: swapAssets,
    loading: swapAssetsLoading,
    error: swapAssetsError,
  } = useSelector((state: any) => state.swap);

  const assetsDisplay = useAssetsDisplay(
    assets?.assets,
    swapAssets,
    assetsLoading,
    swapAssetsLoading,
    null,
    swapAssetsError
  );
  const displayAssets = assetsDisplay.displayData;

  // Debug function to test asset fetching
  const handleDebugAssets = async () => {
    try {
      logger.debug('p2p', "=== Starting debug asset fetch ===");
      await debugAssetFetching();
    } catch (error) {
          }
  };

  // Force refresh assets
  const handleForceRefreshAssets = async () => {
    try {
      logger.debug('p2p', "=== Force refreshing assets ===");
      await withTimeout(
        dispatch(
          fetchSupportedAssets({ forceRefresh: true, feature: "exchange" })
        ).unwrap(),
        15_000
      );
      logger.debug('p2p', "✅ Assets force refreshed");
    } catch (error) {
          }
  };

  // Add user payment details state
  const { userPaymentDetails, loading: userPaymentLoading } = useSelector(
    (state: any) => state.payment
  );

  const [payAmount, setPayAmount] = useState(0);
  const [getAmount, setGetAmount] = useState(0);
  const [payAmountInput, setPayAmountInput] = useState("");
  const [getAmountInput, setGetAmountInput] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<any>(() => {
    // Initialize with BSC network immediately
    return {
      network_id: "BSC",
      network_type: "BSC",
      network: "BSC",
      name: "Binance Smart Chain BEP20",
      icon: "/images/tether.svg",
      isDefault: true,
    };
  });
  const [isCalculatingFromPay, setIsCalculatingFromPay] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletCopied, setWalletCopied] = useState(false);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const bookmarkAnchorRef = useRef<HTMLSpanElement>(null);
  const [expandedTerms, setExpandedTerms] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);

  // Network options - only Binance Smart Chain BEP20
  const availableNetworks = [
    {
      network_id: "BSC",
      network_type: "BSC",
      network: "BSC",
      name: "Binance Smart Chain BEP20",
      icon: "/images/tether.svg",
      isDefault: true,
    },
  ];

  const currentCurrency =
    selectedAsset?.ticker || selectedAsset?.symbol || "USDT";
  const currentNetwork =
    selectedNetwork?.network ||
    selectedNetwork?.network_id ||
    selectedNetwork?.network_type ||
    "BSC";

  const {
    bookmarks,
    loading: bookmarksLoading,
    saving: bookmarkSaving,
    fetchBookmarks,
    saveBookmark,
    deleteBookmark,
    saveBookmarkError,
    clearSaveBookmarkError,
  } = useBookmarkedAddresses(currentCurrency, currentNetwork);

  const networkDropdownRef = useRef<HTMLDivElement>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountHoldMessage, setAccountHoldMessage] = useState<string | null>(
    null
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  // Add state for API response data
  const [withdrawalAddress, setWithdrawalAddress] = useState<string>("");
  const [payoutAddress, setPayoutAddress] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isTransactionSubmitted, setIsTransactionSubmitted] = useState(false);
  const [responseMessage, setResponseMessage] = useState<string>("");
  const [websocketUrl, setWebsocketUrl] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  // Asset selection state for search functionality
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  // No asset search: this screen only supports USDT on BSC.
  const assetDropdownRef = useRef<HTMLDivElement>(null);

  // Estimate calculation state
  const [estimate, setEstimate] = useState<any>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  // First card submission state
  const [isFirstCardSubmitted, setIsFirstCardSubmitted] = useState(false);

  // Add loading state for "You Receive" calculation
  const [isCalculatingReceive, setIsCalculatingReceive] = useState(false);

  // Add calculation stability state
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationTimeout, setCalculationTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [calculationComplete, setCalculationComplete] = useState(false);
  const [estimateTimeout, setEstimateTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [previousValidAmount, setPreviousValidAmount] = useState<string>("");
  const [isUserModifiedAmount, setIsUserModifiedAmount] = useState(false);

  // Add caching for API responses with timestamp
  const [estimateCache, setEstimateCache] = useState<
    Map<string, { data: any; timestamp: number }>
  >(new Map());

  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Add InfoModal state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Add Success Modal state
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);

  // Add OTP Modal state
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [pendingWithdrawalData, setPendingWithdrawalData] = useState<any>(null);

  // Add validation state for minimum receive amount
  const [receiveAmountError, setReceiveAmountError] = useState<string | null>(
    null
  );

  // Add balance validation state
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Add calculation error state for display below "You Send" input
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Commission from API for USDT, USDC, FX Primus (null = not yet fetched, 0 = API returned 0)
  const [apiCommission, setApiCommission] = useState<number | null>(null);
  const commissionFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // P2P withdrawal commission (percentage from commission-lookup API, no auth)
  const [p2pCommissionRate, setP2pCommissionRate] = useState<number>(0);
  const [p2pCommissionIsPercentage, setP2pCommissionIsPercentage] = useState<boolean>(true);
  const [p2pFixedCommissionFee, setP2pFixedCommissionFee] = useState<number>(0);
  const [p2pReceiveAmount, setP2pReceiveAmount] = useState("");
  const [isCalculatingFromReceive, setIsCalculatingFromReceive] = useState(false);
  const p2pCommissionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredLegalState = useRef(false);

  const handleBeforeLegalNavigate = useCallback(() => {
    setP2PLegalReturnState({
      mode: "withdrawal",
      isOpenForm: "withdraw",
      payAmount,
      payAmountInput,
      getAmount,
      getAmountInput,
      walletAddress,
      isTermsAccepted,
      expandedTerms,
      p2pReceiveAmount,
      isCalculatingFromPay,
      isCalculatingFromReceive,
      selectedAsset,
      selectedNetwork,
      scrollY: typeof window !== "undefined" ? window.scrollY : 0,
    });
    onBeforeLegalNavigate?.();
  }, [
    payAmount,
    payAmountInput,
    getAmount,
    getAmountInput,
    walletAddress,
    isTermsAccepted,
    expandedTerms,
    p2pReceiveAmount,
    isCalculatingFromPay,
    isCalculatingFromReceive,
    selectedAsset,
    selectedNetwork,
    onBeforeLegalNavigate,
  ]);

  useEffect(() => {
    if (hasRestoredLegalState.current) return;
    if (typeof window === "undefined") return;

    const state = consumeP2PLegalReturnState();
    if (!state || state.mode !== "withdrawal") return;

    hasRestoredLegalState.current = true;

    if (state.payAmountInput !== undefined) {
      setPayAmountInput(state.payAmountInput);
      setPayAmount(
        typeof state.payAmount === "number"
          ? state.payAmount
          : parseFloat(state.payAmountInput) || 0
      );
    }
    if (state.getAmountInput !== undefined) {
      setGetAmountInput(state.getAmountInput);
      setGetAmount(
        typeof state.getAmount === "number"
          ? state.getAmount
          : parseFloat(state.getAmountInput) || 0
      );
    }
    if (state.walletAddress !== undefined) {
      setWalletAddress(state.walletAddress);
    }
    if (state.isTermsAccepted !== undefined) {
      setIsTermsAccepted(state.isTermsAccepted);
    }
    if (state.expandedTerms !== undefined) {
      setExpandedTerms(state.expandedTerms);
    }
    if (state.p2pReceiveAmount !== undefined) {
      setP2pReceiveAmount(state.p2pReceiveAmount);
    }
    if (state.isCalculatingFromPay !== undefined) {
      setIsCalculatingFromPay(state.isCalculatingFromPay);
    }
    if (state.isCalculatingFromReceive !== undefined) {
      setIsCalculatingFromReceive(state.isCalculatingFromReceive);
    }
    if (state.selectedAsset) {
      setSelectedAsset(state.selectedAsset);
    }
    if (state.selectedNetwork) {
      setSelectedNetwork(state.selectedNetwork);
    }

    window.setTimeout(() => {
      scrollAppToTop("auto");
    }, 0);
  }, []);

  // Fetch withdrawal commission from no-auth endpoint (uses p2p feature for commission rates)
  useEffect(() => {
    const amount = payAmount || 0;
    if (amount <= 0) {
      setP2pCommissionRate(0);
      setP2pCommissionIsPercentage(true);
      setP2pFixedCommissionFee(0);
      setP2pReceiveAmount("");
      return;
    }
    if (p2pCommissionTimeoutRef.current) clearTimeout(p2pCommissionTimeoutRef.current);
    p2pCommissionTimeoutRef.current = setTimeout(async () => {
      try {
        const { API_BASE_URL } = await import("@/config/api");
        const { default: axios } = await import("axios");
        const url = `${API_BASE_URL}/administration/commission-lookup/?feature=p2p&commission_type=withdrawal&amount=${amount}`;
        const res = await axios.get(url);
        const data = res.data;
        const rate = parseFloat(data?.commission_rate ?? data?.commission ?? "0") || 0;
        const rawIsPercentage = data?.is_percentage;
        const isPercentage =
          typeof rawIsPercentage === "boolean"
            ? rawIsPercentage
            : typeof rawIsPercentage === "string"
              ? rawIsPercentage.toLowerCase() === "true"
              : typeof rawIsPercentage === "number"
                ? rawIsPercentage === 1
                : true;
        const calculatedFee = parseFloat(data?.calculated_fee ?? "0") || 0;
        const fixedFee = calculatedFee > 0 ? calculatedFee : rate;
        setP2pCommissionRate(rate);
        setP2pCommissionIsPercentage(isPercentage);
        setP2pFixedCommissionFee(isPercentage ? 0 : fixedFee);
      } catch {
        setP2pCommissionRate(0);
        setP2pCommissionIsPercentage(true);
        setP2pFixedCommissionFee(0);
      }
    }, 300);
    return () => { if (p2pCommissionTimeoutRef.current) clearTimeout(p2pCommissionTimeoutRef.current); };
  }, [payAmount]);

  // Recalculate "You Receive" when payAmount or commission changes (forward direction)
  useEffect(() => {
    if (isCalculatingFromReceive) return;
    const fee = p2pCommissionIsPercentage
      ? (payAmount * p2pCommissionRate) / 100
      : p2pFixedCommissionFee;
    const receive = Math.max(0, payAmount - fee);
    setP2pReceiveAmount(payAmount > 0 ? receive.toFixed(2) : "");
  }, [payAmount, p2pCommissionRate, p2pCommissionIsPercentage, p2pFixedCommissionFee, isCalculatingFromReceive]);

  // OTP Modal Functions
  const handleOTPVerify = async (otp: string) => {
    setOtpLoading(true);
    setOtpError("");

    try {
      if (!pendingWithdrawalData?.withdrawal_id) {
        throw new Error("Withdrawal ID not found");
      }

      // Use the real API to verify OTP
      const result = await dispatch(
        verifyWithdrawal({
          withdrawal_id: pendingWithdrawalData.withdrawal_id,
          otp: otp,
        })
      ).unwrap();

      // OTP verified successfully, show success modal
      setIsOTPModalOpen(false);
      setIsSuccessModalOpen(true);
      setOtpLoading(false);
      showToast.success("Withdrawal verified successfully!");
    } catch (error: any) {
      let errorMessage =
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Invalid OTP";
      if (/invalid otp/i.test(errorMessage)) {
        errorMessage = "Invalid OTP";
      } else if (/request failed with status code \d+/i.test(errorMessage)) {
        errorMessage = "Invalid OTP";
      }
      setOtpError(errorMessage);
      setOtpLoading(false);
    }
  };

  const handleOTPResend = async () => {
    setOtpError("");

    try {
      if (!pendingWithdrawalData?.withdrawal_id) {
        throw new Error("Withdrawal ID not found");
      }

      // Use the real API to resend OTP
      await dispatch(
        resendWithdrawalOTP({
          withdrawal_id: pendingWithdrawalData.withdrawal_id,
        })
      ).unwrap();

      showToast.success("New OTP sent successfully");
    } catch (error: any) {
      const responseData = error?.response?.data;
      const errorMessage =
        (typeof responseData === "object" && (responseData?.error ?? responseData?.message ?? responseData?.detail)) ||
        (typeof responseData === "string" ? responseData : null) ||
        error?.message ||
        "Failed to resend OTP. Please try again.";
      setOtpError(errorMessage);
      showToast.error("Failed to resend OTP");
    }
  };

  const handleOTPClose = () => {
    setIsOTPModalOpen(false);
    setOtpError("");
    setPendingWithdrawalData(null);
  };

  // Add API validation error state for display below "You will receive" input
  const [apiValidationError, setApiValidationError] = useState<string | null>(
    null
  );

  // Track isTransactionSubmitted changes
  useEffect(() => {
    // Force a re-render when isTransactionSubmitted changes
    if (isTransactionSubmitted) {
      setForceUpdate((prev) => prev + 1);
    }
  }, [isTransactionSubmitted, withdrawalAddress, qrCodeUrl, responseMessage]);

  // Monitor wallet section visibility
  useEffect(() => { }, [
    isTransactionSubmitted,
    withdrawalAddress,
    qrCodeUrl,
    websocketUrl,
  ]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        networkDropdownRef.current &&
        !networkDropdownRef.current.contains(event.target as Node)
      ) {
        setIsNetworkDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Assets + payment methods preload via MarketDataProvider
  // Auto-select USDT Tether on BSC when assets are loaded
  useEffect(() => {
    if (displayAssets && displayAssets.length > 0 && !selectedAsset) {
      // Find USDT Tether (we'll force BSC network regardless of original network)
      const usdtTetherAsset = displayAssets.find((asset: SupportedAsset) => {
        const ticker = (asset.ticker || asset.symbol || "")
          .toString()
          .toUpperCase();
        const name = (asset.name || "").toString().toUpperCase();

        // Only look for USDT Tether specifically
        return (
          ticker === "USDT" &&
          (name.includes("TETHER") || name.includes("USDT"))
        );
      });

      if (usdtTetherAsset) {
        logger.debug('p2p', "Auto-selecting USDT Tether on BSC:", usdtTetherAsset);
        setSelectedAsset({
          ...usdtTetherAsset,
          network: "BSC", // Force BSC network for USDT Tether
          name: "Tether USD",
        });

        // Set the network to BSC for USDT
        setSelectedNetwork({
          network_id: "BSC",
          network_type: "BSC",
        });

        // Only set default amount if user hasn't manually modified the amount
        if (!isUserModifiedAmount) {
          const defaultAmount = getDefaultAmount(usdtTetherAsset);
          setPayAmount(defaultAmount);
          setPayAmountInput(defaultAmount.toString());
        }
      }
    }
  }, [displayAssets, selectedAsset, isUserModifiedAmount]);

  // Recalculate when asset changes
  useEffect(() => {
    logger.debug('p2p', "Selected asset changed:", selectedAsset);
    if (selectedAsset && payAmount > 0 && isCalculatingFromPay) {
      // Clear any existing estimate when asset changes
      setEstimate(null);
      setEstimateError(null);
      setEstimateLoading(false);
      setCalculationError(null);
      setReceiveAmountError(null);
      setApiValidationError(null);

      // Check asset type first and handle accordingly
      if (isSimpleCalculationAsset(selectedAsset)) {
        logger.debug('p2p', "Asset changed to simple asset, calculating immediately");
        // For simple assets, calculate immediately
        calculateAmounts(payAmount, true);
      } else {
        logger.debug('p2p', "Asset changed to non-simple asset, going to API");
        // For non-simple assets, the estimate useEffect will handle the API call
        // Just set loading states for visual feedback
        setIsCalculating(true);
        setIsCalculatingReceive(true);
        setEstimateLoading(true);
      }
    }
  }, [selectedAsset]);

  // Handle estimate updates and trigger recalculation - ONLY for forward calculations
  useEffect(() => {
    logger.debug('p2p', "Estimate effect triggered:", {
      hasEstimate: !!estimate,
      estimateLoading,
      isCalculatingFromPay,
      payAmount,
      estimateAmount: estimate?.toAmount || estimate?.estimated_amount,
      apiValidationError,
    });

    // Only handle forward calculations (when calculating from pay amount)
    if (estimate && !estimateLoading && isCalculatingFromPay && payAmount > 0) {
      const estimateAmount = estimate.toAmount || estimate.estimated_amount;
      logger.debug('p2p',
        "Estimate received, updating receive amount:",
        estimateAmount
      );

      // Check if estimate has a valid amount
      if (
        estimateAmount !== undefined &&
        estimateAmount !== null &&
        !isNaN(estimateAmount)
      ) {
        // Estimate has been received, update the receive amount
        const finalAmount = Math.max(0, estimateAmount);
        setGetAmount(finalAmount);
        setGetAmountInput(finalAmount.toString());

        const validationError = validateReceiveAmount(
          finalAmount,
          selectedAsset
        );
        setReceiveAmountError(validationError);

        if (finalAmount > 15000) {
          setIsInfoModalOpen(true);
        }

        // Clear loading states
        setIsCalculating(false);
        setIsCalculatingReceive(false);
      } else {
        // Estimate is invalid, keep loading state until we get a valid estimate
        logger.debug('p2p', "DEBUG: Invalid estimate received, keeping loading state");
        setGetAmount(0);
        setGetAmountInput("");
        if (!apiValidationError) {
          if (!apiValidationError) {
            setReceiveAmountError("Calculating..."); // Show immediate feedback
          }
        }
        // Keep loading states active
      }
    } else if (
      estimateLoading &&
      isCalculatingFromPay &&
      payAmount > 0 &&
      !apiValidationError
    ) {
      // Keep field empty during loading - no intermediate estimates
      if (selectedAsset && !isSimpleCalculationAsset(selectedAsset)) {
        // Keep field completely empty during calculation
        setGetAmount(0);
        setGetAmountInput("");
        if (!apiValidationError) {
          if (!apiValidationError) {
            setReceiveAmountError("Calculating..."); // Show immediate feedback
          }
        }
      }
      // Set loading states for visual feedback
      logger.debug('p2p', "Setting loading states in estimate useEffect");
      setIsCalculating(true);
      setIsCalculatingReceive(true);
    } else if (
      !estimate &&
      !estimateLoading &&
      isCalculatingFromPay &&
      payAmount > 0 &&
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset) &&
      !apiValidationError
    ) {
      // No estimate available but we're calculating from pay - keep loading
      logger.debug('p2p', "DEBUG: No estimate available, keeping loading state");
      setGetAmount(0);
      setGetAmountInput("");
      if (!apiValidationError) {
        setReceiveAmountError("Calculating..."); // Show immediate feedback
      }
      // Keep loading states active
    }
  }, [
    estimate,
    estimateLoading,
    isCalculatingFromPay,
    payAmount,
    selectedAsset,
    apiValidationError,
  ]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        assetDropdownRef.current &&
        !assetDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAssetDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Check if asset is USDT (should use simple calculation)
  const isSimpleCalculationAsset = (asset: any) => {
    if (!asset) return false;
    const ticker = (asset.ticker || asset.symbol || "").toLowerCase();
    return ticker === "usdt";
  };

  // Check if asset uses commission API (USDT, USDC, FX Primus)
  const isCommissionApiAsset = (asset: any) => !!getCommissionApiAsset(asset?.ticker || asset?.symbol || "");

  // Fetch commission from API for USDT, USDC, FX Primus - use input values so it triggers as user types
  useEffect(() => {
    const apiAsset = selectedAsset ? getCommissionApiAsset(selectedAsset.ticker || selectedAsset.symbol || "") : null;
    if (!apiAsset || !selectedAsset) {
      setApiCommission(null);
      return;
    }
    const amount = isCalculatingFromPay
      ? (parseFloat(payAmountInput) || payAmount)
      : (parseFloat(getAmountInput) || getAmount);
    if (amount <= 0) {
      setApiCommission(null);
      return;
    }
    if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
    commissionFetchTimeoutRef.current = setTimeout(() => {
      fetchCommission(apiAsset, amount, "withdrawal")
        .then((commission) => setApiCommission(commission))
        .catch(() => setApiCommission(null));
    }, 300);
    return () => {
      if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
    };
  }, [selectedAsset, payAmountInput, getAmountInput, payAmount, getAmount, isCalculatingFromPay]);

  // Helper function to check if cache entry is still valid
  const isCacheValid = (timestamp: number) => {
    return Date.now() - timestamp < CACHE_DURATION;
  };

  // Helper function to extract error message from API response
  const extractErrorMessage = (error: any): string => {
    if (error.response?.data) {
      const responseData = error.response.data;
      if (responseData.error === "deposit_too_small") {
        return "Amount is too small. Please increase the amount.";
      }
      if (responseData.message) {
        return responseData.message;
      }
      if (responseData.error) {
        return responseData.error;
      }
      if (responseData.details) {
        return responseData.details;
      }
      if (typeof responseData === "string") {
        return responseData;
      }
    }
    if (error.message) {
      return error.message;
    }
    return "Failed to calculate estimate";
  };

  // Helper function to handle API validation errors
  const handleApiValidationError = (error: any): void => {
    if (error.response?.data?.error) {
      const errorData = error.response.data.error;

      // Handle amount validation errors
      if (errorData.amount && Array.isArray(errorData.amount)) {
        const amountErrors = errorData.amount;
        if (
          amountErrors.some((err: string) => err.includes("decimal places"))
        ) {
          setApiValidationError(
            "Ensure that there are no more than 8 decimal places."
          );
          return;
        }
        if (amountErrors.some((err: string) => err.includes("too small"))) {
          setApiValidationError(
            "Amount is too small. Please increase the amount."
          );
          return;
        }
        if (amountErrors.some((err: string) => err.includes("too large"))) {
          setApiValidationError(
            "Amount is too large. Please decrease the amount."
          );
          return;
        }
        // Generic amount error
        setApiValidationError(amountErrors[0]);
        return;
      }

      // Handle other validation errors
      if (typeof errorData === "string") {
        setApiValidationError(errorData);
        return;
      }

      // Handle nested error objects
      if (typeof errorData === "object") {
        const firstError = Object.values(errorData)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          setApiValidationError(firstError[0]);
          return;
        }
      }
    }

    // Fallback to generic error message
    setApiValidationError(
      "Validation error occurred. Please check your input."
    );
  };

  // Get default amount based on asset type
  const getDefaultAmount = (asset: any) => {
    if (!asset) return 0;
    const ticker = (asset.ticker || asset.symbol || "").toLowerCase();
    return ticker === "usdt" ? 0 : 0.001;
  };

  // Get minimum amount based on asset type
  const getMinimumAmount = (asset: any) => {
    if (!asset) return 10; // Default minimum
    const ticker = (asset.ticker || asset.symbol || "").toLowerCase();
    return ticker === "usdt" ? 2 : 10; // 2 for USDT, 10 for others
  };

  // Validate receive amount - allow any amount for now
  const validateReceiveAmount = (amount: number, asset: any) => {
    // Allow any amount - no validation for now
    return null; // No error
  };

  // Validate balance - check if amount exceeds available balance
  const validateBalance = (amount: number) => {
    if (amount > 0 && amount < MIN_WITHDRAWAL_AMOUNT) {
      return `Minimum withdrawal amount is ${MIN_WITHDRAWAL_AMOUNT}`;
    }
    if (balance !== undefined && amount > balance) {
      return `Insufficient balance. Available: ${formatBalance(balance)}`;
    }
    return null; // No error
  };

  // Fetch estimate for non-USDT assets with debouncing for better performance
  useEffect(() => {
    // Clear any existing estimate timeout
    if (estimateTimeout) {
      clearTimeout(estimateTimeout);
    }

    if (
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset) &&
      payAmount &&
      payAmount > 0 &&
      isCalculatingFromPay // Only fetch estimate when calculating from pay amount
    ) {
      // Check cache first - if found and valid, use immediately without any loading states
      const cacheKey = `${selectedAsset.ticker?.toUpperCase()}_${selectedAsset.network}_${payAmount}`;
      const cachedEntry = estimateCache.get(cacheKey);

      if (cachedEntry && isCacheValid(cachedEntry.timestamp)) {
        logger.debug('p2p', "Using cached estimate:", cachedEntry.data);
        setEstimate(cachedEntry.data);
        setCalculationError(null); // Clear any previous errors
        setApiValidationError(null);
        // Don't set any loading states for cached results
        return;
      }

      // Set loading state immediately for visual feedback (only if no API validation errors)
      if (!apiValidationError) {
        setEstimateLoading(true);
        setEstimateError(null);
        setIsCalculating(true);
        setIsCalculatingReceive(true);
      }

      // For non-simple assets, don't show fallback calculation - go directly to API
      // Keep field empty during calculation - no intermediate values
      setGetAmount(0);
      setGetAmountInput("");
      if (!apiValidationError) {
        setReceiveAmountError("Calculating..."); // Show immediate feedback
      }

      // Debounce the API call to prevent too many requests (increased to 300ms for better performance)
      const debounceTimeout = setTimeout(() => {
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          logger.debug('p2p',
            "DEBUG: Estimate request timed out, keeping loading state"
          );
          setEstimateLoading(false);
          setEstimateError("Request timed out");

          // Keep loading state instead of showing fallback
          setGetAmount(0);
          setGetAmountInput("");
          if (!apiValidationError) {
            if (!apiValidationError) {
              setReceiveAmountError("Calculating..."); // Show immediate feedback
            }
          }
          // Keep loading states active
        }, 12000); // Align with ChangeNow/estimate API budget (avoid premature abort)

        // Use the actual fetchSwapEstimate API call for deposit
        // Note: fromCurrency is the selected asset, toCurrency is always "USDT" for deposits
        logger.debug('p2p', "Fetching estimate for deposit:", {
          toCurrency: "USDT",
          toNetwork: "BSC",
          fromCurrency: selectedAsset.ticker?.toUpperCase(),
          fromNetwork: selectedAsset.network,
          amount: payAmount,
        });

        dispatch(
          fetchSwapEstimate({
            toCurrency: "USDT",
            toNetwork: "BSC",
            fromCurrency: selectedAsset.ticker?.toUpperCase(),
            fromNetwork: selectedAsset.network,
            amount: payAmount,
          })
        )
          .then((result) => {
            clearTimeout(timeoutId); // Clear timeout on success
            logger.debug('p2p', "Estimate result:", result);
            if (result.payload) {
              logger.debug('p2p', "Setting new estimate:", result.payload);
              setEstimate(result.payload);
              setCalculationError(null); // Clear any previous errors
              setApiValidationError(null);
              // Cache the result with timestamp
              setEstimateCache((prev) =>
                new Map(prev).set(cacheKey, {
                  data: result.payload,
                  timestamp: Date.now(),
                })
              );
            }
          })
          .catch((error) => {
            clearTimeout(timeoutId); // Clear timeout on error
                                                // Handle API validation errors for receive amount
            if (
              error.response?.data?.error ||
              error.response?.data?.response_data?.error
            ) {
              const errorData =
                error.response.data.error ||
                error.response.data.response_data?.error;
              const responseData = error.response.data.response_data;

              logger.debug('p2p', "API ERROR DETECTED:", { errorData, responseData });

              // Handle amount validation errors (decimal places, too small, etc.)
              // Check if errorData is an object with amount property (format 1)
              if (
                errorData &&
                typeof errorData === "object" &&
                errorData.amount &&
                Array.isArray(errorData.amount)
              ) {
                const amountErrors = errorData.amount;
                if (
                  amountErrors.some((err: string) =>
                    err.includes("decimal places")
                  )
                ) {
                  logger.debug('p2p',
                    "API ERROR: Decimal places validation error detected"
                  );
                  setApiValidationError(
                    "Ensure that there are no more than 8 decimal places."
                  );
                  setReceiveAmountError(
                    "Ensure that there are no more than 8 decimal places."
                  );
                  // Stop loading states and show error
                  setEstimateLoading(false);
                  setIsCalculating(false);
                  setIsCalculatingReceive(false);
                  logger.debug('p2p',
                    "API ERROR: Loading states cleared for decimal places error"
                  );
                  // Don't clear the input - let user see their value and fix it
                  return;
                }
                if (
                  amountErrors.some((err: string) =>
                    err.includes("12 digits before the decimal point")
                  )
                ) {
                  logger.debug('p2p',
                    "API ERROR: 12 digits before decimal point validation error detected"
                  );
                  setApiValidationError(
                    "Ensure that there are no more than 12 digits before the decimal point."
                  );
                  setReceiveAmountError(
                    "Ensure that there are no more than 12 digits before the decimal point."
                  );
                  // Stop loading states and show error
                  setEstimateLoading(false);
                  setIsCalculating(false);
                  setIsCalculatingReceive(false);
                  logger.debug('p2p',
                    "API ERROR: Loading states cleared for 12 digits error"
                  );
                  // Don't clear the input - let user see their value and fix it
                  return;
                }
                if (
                  amountErrors.some((err: string) => err.includes("too small"))
                ) {
                  logger.debug('p2p',
                    "API ERROR: Amount too small validation error detected"
                  );
                  setApiValidationError(
                    "Amount is too small. Please increase the amount."
                  );
                  setReceiveAmountError(
                    "Amount is too small. Please increase the amount."
                  );
                  // Stop loading states and show error
                  setEstimateLoading(false);
                  setIsCalculating(false);
                  setIsCalculatingReceive(false);
                  logger.debug('p2p',
                    "API ERROR: Loading states cleared for too small error"
                  );
                  // Don't clear the input - let user see their value and fix it
                  return;
                }
                if (
                  amountErrors.some((err: string) => err.includes("too large"))
                ) {
                  setApiValidationError(
                    "Amount is too large. Please decrease the amount."
                  );
                  setReceiveAmountError(
                    "Amount is too large. Please decrease the amount."
                  );
                  // Stop loading states and show error
                  setEstimateLoading(false);
                  setIsCalculating(false);
                  setIsCalculatingReceive(false);
                  // Don't clear the input - let user see their value and fix it
                  return;
                }
                // Generic amount error
                setApiValidationError(amountErrors[0]);
                setReceiveAmountError(amountErrors[0]);
                // Stop loading states and show error
                setEstimateLoading(false);
                setIsCalculating(false);
                setIsCalculatingReceive(false);
                return;
              }

              // Handle deposit_too_small error
              if (
                errorData === "deposit_too_small" ||
                errorData === "Exchange service error: deposit_too_small" ||
                errorData?.error === "deposit_too_small" ||
                responseData?.error === "deposit_too_small"
              ) {
                logger.debug('p2p', "API ERROR: Deposit too small error detected");
                const errorMessage =
                  responseData?.message ||
                  "Amount is too small. Please increase the amount.";
                setApiValidationError(errorMessage);
                setReceiveAmountError(errorMessage);
                // Stop loading states and show error
                setEstimateLoading(false);
                setIsCalculating(false);
                setIsCalculatingReceive(false);
                logger.debug('p2p',
                  "API ERROR: Loading states cleared for deposit too small error"
                );
                return;
              }

              // Handle other validation errors
              if (typeof errorData === "string") {
                // Extract meaningful error message
                let errorMessage = errorData;
                if (errorData.includes("Exchange service error:")) {
                  errorMessage = errorData.replace(
                    "Exchange service error: ",
                    ""
                  );
                }
                if (responseData?.message) {
                  errorMessage = responseData.message;
                }

                setApiValidationError(errorMessage);
                setReceiveAmountError(errorMessage);
                // Stop loading states and show error
                setEstimateLoading(false);
                setIsCalculating(false);
                setIsCalculatingReceive(false);
                logger.debug('p2p', "API ERROR: Generic error handled:", errorMessage);
                return;
              }
            }

            // Fallback: Handle any other error formats that weren't caught above
            logger.debug('p2p',
              "FALLBACK ERROR HANDLING - No specific error format matched"
            );
            logger.debug('p2p', "Raw error data:", error.response?.data);

            // Try to extract any meaningful error message
            let fallbackErrorMessage =
              "Validation error occurred. Please check your input.";
            if (error.response?.data?.error) {
              if (typeof error.response.data.error === "string") {
                fallbackErrorMessage = error.response.data.error;
              } else if (typeof error.response.data.error === "object") {
                // Try to extract from nested error object
                const errorObj = error.response.data.error;
                if (errorObj.amount && Array.isArray(errorObj.amount)) {
                  fallbackErrorMessage = errorObj.amount[0];
                } else if (errorObj.message) {
                  fallbackErrorMessage = errorObj.message;
                }
              }
            }

            logger.debug('p2p',
              "FALLBACK: Setting error message:",
              fallbackErrorMessage
            );
            setApiValidationError(fallbackErrorMessage);
            setReceiveAmountError(fallbackErrorMessage);
            // Stop loading states and show error
            setEstimateLoading(false);
            setIsCalculating(false);
            setIsCalculatingReceive(false);
            return;

            // Handle other error types
            const errorMessage = extractErrorMessage(error);
            setEstimateError(errorMessage);
            setCalculationError(errorMessage); // Show error below "You Send" input

            // Keep loading state instead of showing fallback
            setGetAmount(0);
            setGetAmountInput("");
            if (!apiValidationError) {
              if (!apiValidationError) {
                setReceiveAmountError("Calculating..."); // Show immediate feedback
              }
            }
            // Keep loading states active
          })
          .finally(() => {
            setEstimateLoading(false);
          });
      }, 300); // 300ms debounce to prevent rapid API calls while maintaining responsiveness

      setEstimateTimeout(debounceTimeout);
    } else if (
      !isCalculatingFromPay &&
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset)
    ) {
      // For reverse calculations on complex assets, don't set loading states here
      // The reverse calculation useEffect will handle the loading states and API call
      // Don't set loading states here to avoid conflicts
    }
  }, [selectedAsset, payAmount, isCalculatingFromPay]);

  // Reverse calculation effect for non-simple assets when user types in "You Receive"
  useEffect(() => {
    logger.debug('p2p', "Reverse calculation useEffect triggered:", {
      selectedAsset: !!selectedAsset,
      isSimpleAsset: selectedAsset
        ? isSimpleCalculationAsset(selectedAsset)
        : false,
      getAmount,
      isCalculatingFromPay,
      isCalculating,
      isCalculatingReceive,
      estimateLoading,
    });

    if (
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset) &&
      getAmount &&
      getAmount > 0 &&
      !isCalculatingFromPay
    ) {
      logger.debug('p2p', "Starting reverse calculation - setting loading states");
      if (!apiValidationError) {
        setEstimateLoading(true);
        setEstimateError(null);
      }

      // For reverse calculation, we need to estimate the pay amount from the receive amount
      // We'll call the API with the correct direction to get the required USDT amount
      logger.debug('p2p', "Starting reverse calculation for amount:", getAmount);

      // Add timeout to prevent hanging API calls
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), 30000); // 30 second timeout
      });

      Promise.race([
        dispatch(
          fetchSwapEstimate({
            fromCurrency: "USDT", // FROM USDT (what we want to receive)
            fromNetwork: "BSC",
            toCurrency: selectedAsset.ticker, // TO selected asset (what we need to send)
            toNetwork: selectedAsset.network,
            amount: getAmount, // Use receive amount directly
          })
        ),
        timeoutPromise,
      ])
        .then((result: any) => {
          logger.debug('p2p', "Reverse calculation result:", result);
          if (result.payload && (result.payload as any)?.estimated_amount) {
            // The API now returns how much USDT we need to get the desired amount
            const requiredUsdtAmount = (result.payload as any)
              ?.estimated_amount;

            if (requiredUsdtAmount && requiredUsdtAmount > 0) {
              // Set the pay amount to the required USDT amount
              setPayAmount(requiredUsdtAmount);
              setPayAmountInput(requiredUsdtAmount.toString());
              setEstimate(result.payload);
              setApiValidationError(null);
            }

            // Clear loading states after successful calculation
            logger.debug('p2p', "Clearing loading states after successful calculation");
            setIsCalculating(false);
            setIsCalculatingReceive(false);
            setEstimateLoading(false);
            logger.debug('p2p',
              "Reverse calculation completed successfully - loading states cleared"
            );
          } else {
            // No valid result, clear loading states
            logger.debug('p2p', "No valid result from reverse calculation");
            setIsCalculating(false);
            setIsCalculatingReceive(false);
            setEstimateLoading(false);
          }
        })
        .catch((error) => {
                                        // Handle API validation errors for receive amount first
          if (
            error.response?.data?.error ||
            error.response?.data?.response_data?.error
          ) {
            const errorData =
              error.response.data.error ||
              error.response.data.response_data?.error;
            const responseData = error.response.data.response_data;

            logger.debug('p2p', "REVERSE API ERROR DETECTED:", {
              errorData,
              responseData,
            });

            // Handle amount validation errors (decimal places, too small, etc.)
            // Check if errorData is an object with amount property (format 1)
            if (
              errorData &&
              typeof errorData === "object" &&
              errorData.amount &&
              Array.isArray(errorData.amount)
            ) {
              const amountErrors = errorData.amount;
              if (
                amountErrors.some((err: string) =>
                  err.includes("decimal places")
                )
              ) {
                setApiValidationError(
                  "Ensure that there are no more than 8 decimal places."
                );
                setReceiveAmountError(
                  "Ensure that there are no more than 8 decimal places."
                );
                // Stop loading states and show error
                setEstimateLoading(false);
                setIsCalculating(false);
                setIsCalculatingReceive(false);
                return;
              }
              if (
                amountErrors.some((err: string) =>
                  err.includes("12 digits before the decimal point")
                )
              ) {
                logger.debug('p2p',
                  "REVERSE API ERROR: 12 digits before decimal point validation error detected"
                );
                setApiValidationError(
                  "Ensure that there are no more than 12 digits before the decimal point."
                );
                setReceiveAmountError(
                  "Ensure that there are no more than 12 digits before the decimal point."
                );
                // Stop loading states and show error
                setEstimateLoading(false);
                setIsCalculating(false);
                setIsCalculatingReceive(false);
                logger.debug('p2p',
                  "REVERSE API ERROR: Loading states cleared for 12 digits error"
                );
                return;
              }
              if (
                amountErrors.some((err: string) => err.includes("too small"))
              ) {
                setApiValidationError(
                  "Amount is too small. Please increase the amount."
                );
                setReceiveAmountError(
                  "Amount is too small. Please increase the amount."
                );
                // Stop loading states and show error
                setEstimateLoading(false);
                setIsCalculating(false);
                setIsCalculatingReceive(false);
                return;
              }
              if (
                amountErrors.some((err: string) => err.includes("too large"))
              ) {
                setApiValidationError(
                  "Amount is too large. Please decrease the amount."
                );
                setReceiveAmountError(
                  "Amount is too large. Please decrease the amount."
                );
                // Stop loading states and show error
                setEstimateLoading(false);
                setIsCalculating(false);
                setIsCalculatingReceive(false);
                return;
              }
              // Generic amount error
              setApiValidationError(amountErrors[0]);
              setReceiveAmountError(amountErrors[0]);
              // Stop loading states and show error
              setEstimateLoading(false);
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              return;
            }

            // Handle deposit_too_small error
            if (
              errorData === "deposit_too_small" ||
              errorData === "Exchange service error: deposit_too_small" ||
              errorData?.error === "deposit_too_small" ||
              responseData?.error === "deposit_too_small"
            ) {
              logger.debug('p2p',
                "REVERSE API ERROR: Deposit too small error detected"
              );
              const errorMessage =
                responseData?.message ||
                "Amount is too small. Please increase the amount.";
              setApiValidationError(errorMessage);
              setReceiveAmountError(errorMessage);
              // Stop loading states and show error
              setEstimateLoading(false);
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              logger.debug('p2p',
                "REVERSE API ERROR: Loading states cleared for deposit too small error"
              );
              return;
            }

            // Handle other validation errors
            if (typeof errorData === "string") {
              // Extract meaningful error message
              let errorMessage = errorData;
              if (errorData.includes("Exchange service error:")) {
                errorMessage = errorData.replace(
                  "Exchange service error: ",
                  ""
                );
              }
              if (responseData?.message) {
                errorMessage = responseData.message;
              }

              setApiValidationError(errorMessage);
              setReceiveAmountError(errorMessage);
              // Stop loading states and show error
              setEstimateLoading(false);
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              logger.debug('p2p', "API ERROR: Generic error handled:", errorMessage);
              return;
            }

            // Fallback: Handle any other error formats that weren't caught above
            logger.debug('p2p',
              "REVERSE FALLBACK ERROR HANDLING - No specific error format matched"
            );
            logger.debug('p2p', "Reverse raw error data:", error.response?.data);

            // Try to extract any meaningful error message
            let fallbackErrorMessage =
              "Validation error occurred. Please check your input.";
            if (error.response?.data?.error) {
              if (typeof error.response.data.error === "string") {
                fallbackErrorMessage = error.response.data.error;
              } else if (typeof error.response.data.error === "object") {
                // Try to extract from nested error object
                const errorObj = error.response.data.error;
                if (errorObj.amount && Array.isArray(errorObj.amount)) {
                  fallbackErrorMessage = errorObj.amount[0];
                } else if (errorObj.message) {
                  fallbackErrorMessage = errorObj.message;
                }
              }
            }

            logger.debug('p2p',
              "REVERSE FALLBACK: Setting error message:",
              fallbackErrorMessage
            );
            setApiValidationError(fallbackErrorMessage);
            setReceiveAmountError(fallbackErrorMessage);
            // Stop loading states and show error
            setEstimateLoading(false);
            setIsCalculating(false);
            setIsCalculatingReceive(false);
            return;
          }

          // Handle different types of errors gracefully
          if (error.message?.includes("Request timeout")) {
            setEstimateError("Request timeout: Using fallback calculation");
            showToast.warning("Request timeout: Using estimated rate");
          } else if (
            error.message?.includes("Network Error") ||
            error.code === "ECONNREFUSED" ||
            error.code === "ENOTFOUND"
          ) {
            setEstimateError("Network error: Using fallback calculation");
            showToast.warning("Using estimated rate due to network issues");
          } else if (error.message?.includes("Server Error")) {
            setEstimateError("Server error: Using fallback calculation");
            showToast.warning("Using estimated rate due to server issues");
          } else if (error.message?.includes("Invalid swap parameters")) {
            setEstimateError("Invalid parameters: Using fallback calculation");
            showToast.warning("Invalid parameters: Using estimated rate");
          } else {
            setEstimateError("API error: Using fallback calculation");
            showToast.warning("Using estimated rate due to API unavailability");
          }

          // Common fallback calculation for all error types
          let commissionRate = 2; // Default fallback
          if (
            selectedAsset?.range_commissions &&
            selectedAsset.range_commissions.length > 0
          ) {
            const firstCommission = selectedAsset.range_commissions[0];
            if (firstCommission?.commission) {
              commissionRate = parseFloat(firstCommission.commission);
            }
          } else if (selectedAsset?.commission) {
            commissionRate = parseFloat(selectedAsset.commission);
          } else if (selectedAsset?.fee_rate) {
            commissionRate = parseFloat(selectedAsset.fee_rate);
          }

          const fallbackPayAmount = getAmount * (1 + commissionRate / 100);
          setPayAmount(fallbackPayAmount);
          setPayAmountInput(fallbackPayAmount.toString());

          // Clear loading states after fallback calculation
          setIsCalculating(false);
          setIsCalculatingReceive(false);
        })
        .finally(() => {
          // Always clear estimate loading and calculation states
          logger.debug('p2p', "Finally block - clearing all loading states");
          setEstimateLoading(false);
          setIsCalculating(false);
          setIsCalculatingReceive(false);
          logger.debug('p2p', "Reverse calculation finished - loading states cleared");
        });
    } else if (!isCalculatingFromPay && getAmount === 0) {
      // Clear loading states when receive amount is 0
      setIsCalculating(false);
      setIsCalculatingReceive(false);
      setEstimateLoading(false);
    }
  }, [selectedAsset, getAmount, isCalculatingFromPay, apiValidationError]);

  // Always show exactly these two assets - no API filtering needed
  const exactAssets = [
    {
      ticker: "USDT",
      symbol: "USDT",
      name: "Tether USD",
      network: "BSC",
      range_commissions: [{ commission: "2" }],
      commission: "2",
      fee_rate: "2",
      image_url:
        "/images/tether.svg",
      asset_id: "usdt-tether-bsc",
    },
  ];

  // Sort assets: USDT Tether first
  const sortedSwapAssets = [...exactAssets].sort((a, b) => {
    // USDT always comes first
    if (a.ticker === "USDT" && b.ticker !== "USDT") {
      return -1;
    }
    if (b.ticker === "USDT" && a.ticker !== "USDT") {
      return 1;
    }
    return 0;
  });

  // Calculate fees and amounts - Network fee is always 0 for BEP20
  const networkFee = 0;

  // Use commission from API for USDT/USDC/FX Primus, else flat $2 for USDT or percentage for others
  let commissionAmount = 0;
  if (selectedAsset && isCommissionApiAsset(selectedAsset)) {
    commissionAmount = apiCommission ?? 0; // Always use API value - no $2 fallback
  } else if (selectedAsset && isSimpleCalculationAsset(selectedAsset)) {
    commissionAmount = payAmount >= 2 ? 2 : 0;
  } else {
    const commissionRate = selectedAsset?.range_commissions?.[0]?.commission
      ? parseFloat(selectedAsset.range_commissions[0].commission)
      : 2;
    commissionAmount = (payAmount * commissionRate) / 100;
  }

  const totalFees = networkFee + commissionAmount;

  // Stable calculation function with debouncing
  const calculateAmounts = (fromAmount: number, fromPay: boolean = true) => {
    // Clear any existing timeout
    if (calculationTimeout) {
      clearTimeout(calculationTimeout);
    }

    // For simple calculations, do them immediately without any delays
    if (fromPay && selectedAsset && isSimpleCalculationAsset(selectedAsset)) {
      // Immediate calculation for USDT - no debouncing at all
      let calculatedGetAmount;
      if (fromAmount < 2) {
        calculatedGetAmount = fromAmount;
      } else {
        const commission = isCommissionApiAsset(selectedAsset) ? (apiCommission ?? 0) : 2;
        const networkFee = 0;
        const totalFees = networkFee + commission;
        calculatedGetAmount = Math.max(0, fromAmount - totalFees);
      }

      // Show result immediately
      setGetAmount(calculatedGetAmount);
      setGetAmountInput(calculatedGetAmount.toString());
      setPreviousValidAmount(calculatedGetAmount.toString());

      // Validate the calculated amount
      const validationError = validateReceiveAmount(
        calculatedGetAmount,
        selectedAsset
      );
      setReceiveAmountError(validationError);

      // Show info modal if receive amount exceeds $15,000
      if (calculatedGetAmount > 15000) {
        setIsInfoModalOpen(true);
      }

      // No loading states for simple calculations - instant result
      setIsCalculating(false);
      setIsCalculatingReceive(false);
      return;
    }

    // Set calculating state immediately for complex calculations (only if no API validation errors)
    if (!apiValidationError) {
      setIsCalculating(true);
      setIsCalculatingReceive(true);
    }

    // Debounce calculation to prevent rapid updates
    const timeout = setTimeout(() => {
      if (!selectedAsset) {
        setIsCalculating(false);
        setIsCalculatingReceive(false);
        setReceiveAmountError(null);
        setApiValidationError(null);
        return;
      }

      // Don't reset amounts to 0 - let user keep their input
      if (fromAmount <= 0) {
        setIsCalculating(false);
        setIsCalculatingReceive(false);
        setReceiveAmountError(null);
        setApiValidationError(null);
        return;
      }

      try {
        if (fromPay) {
          // Calculate from pay amount to receive amount
          if (isSimpleCalculationAsset(selectedAsset)) {
            // This should not happen as we handle it above, but keep as fallback
            let calculatedGetAmount;
            if (fromAmount < 2) {
              calculatedGetAmount = fromAmount;
            } else {
              const commission = isCommissionApiAsset(selectedAsset) ? (apiCommission ?? 0) : 2;
              const networkFee = 0;
              const totalFees = networkFee + commission;
              calculatedGetAmount = Math.max(0, fromAmount - totalFees);
            }

            // Only show calculated amount if it's meaningful (> 0.01), otherwise show empty
            if (calculatedGetAmount >= 0.01) {
              setGetAmount(calculatedGetAmount);
              setGetAmountInput(calculatedGetAmount.toString());
              // Store this as a valid previous amount
              setPreviousValidAmount(calculatedGetAmount.toString());
            } else {
              // For very small amounts, keep field empty
              setGetAmount(0);
              setGetAmountInput("");
              setPreviousValidAmount("");
            }

            // Validate the calculated amount
            const validationError = validateReceiveAmount(
              calculatedGetAmount,
              selectedAsset
            );
            setReceiveAmountError(validationError);

            // Show info modal if receive amount exceeds $15,000
            if (calculatedGetAmount > 15000) {
              setIsInfoModalOpen(true);
            }
          } else {
            // For other assets, ONLY use API estimate - no manual calculations
            if (
              estimate &&
              !estimateLoading &&
              (estimate.toAmount !== undefined ||
                estimate.estimated_amount !== undefined)
            ) {
              const finalAmount = Math.max(
                0,
                estimate.toAmount || estimate.estimated_amount
              );
              setGetAmount(finalAmount);
              setGetAmountInput(finalAmount.toString());

              // Store this as a valid previous amount
              setPreviousValidAmount(finalAmount.toString());

              const validationError = validateReceiveAmount(
                finalAmount,
                selectedAsset
              );
              setReceiveAmountError(validationError);

              if (finalAmount > 15000) {
                setIsInfoModalOpen(true);
              }
            } else if (estimateLoading) {
              // Show loading state while estimate is being fetched
              setIsCalculating(true);
              setIsCalculatingReceive(true);
              // Don't update amounts yet, wait for estimate
            } else {
              // For non-USDT assets, only show loading until API estimate is available
              // Don't do manual calculations - wait for API
              setIsCalculating(true);
              setIsCalculatingReceive(true);
            }
          }
        } else {
          // Calculate from receive amount to pay amount
          if (isSimpleCalculationAsset(selectedAsset)) {
            let newPayAmount;
            if (fromAmount < 2) {
              newPayAmount = fromAmount;
            } else {
              const commission = isCommissionApiAsset(selectedAsset) ? (apiCommission ?? 0) : 2;
              const networkFee = 0;
              const totalFees = networkFee + commission;
              newPayAmount = Math.max(0, fromAmount + totalFees);
            }
            setPayAmount(newPayAmount);
            setPayAmountInput(newPayAmount.toString());

            // Clear loading states for simple assets - calculation is instant
            setIsCalculating(false);
            setIsCalculatingReceive(false);
          } else {
            // For non-USDT assets, we need to fetch estimate for reverse calculation
            // This is more complex as we need to find the pay amount that gives us the desired receive amount
            // The reverse calculation useEffect will handle the API call
            // Just set loading states here - the useEffect will clear them
            setIsCalculating(true);
            setIsCalculatingReceive(true);
            // Don't update payAmountInput to avoid reloading the input field
          }
        }
      } catch (error) {
                setReceiveAmountError("Calculation error occurred");
      } finally {
        setIsCalculating(false);
        setIsCalculatingReceive(false);
        setCalculationComplete(true);

        // Reset completion status after a short delay
        setTimeout(() => {
          setCalculationComplete(false);
        }, 2000);
      }
    }, 1); // Ultra-fast 1ms debounce for immediate response

    setCalculationTimeout(timeout);
  };

  // Auto-validate receive amount whenever it changes
  useEffect(() => {
    if (getAmount > 0) {
      const validationError = validateReceiveAmount(getAmount, selectedAsset);
      setReceiveAmountError(validationError);
    } else {
      setReceiveAmountError(null);
    }
  }, [getAmount, selectedAsset]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (calculationTimeout) {
        clearTimeout(calculationTimeout);
      }
      if (estimateTimeout) {
        clearTimeout(estimateTimeout);
      }
    };
  }, [calculationTimeout, estimateTimeout]);

  // Validate BEP20 wallet address
  const validateBEP20Address = (address: string) => {
    if (!address || address.trim() === "") {
      return { isValid: false, message: "Please add an address" };
    }

    // Remove whitespace
    const cleanAddress = address.trim();

    // BEP20 addresses are Ethereum-compatible (0x prefix, 42 characters total, hexadecimal)
    const bep20Regex = /^0x[a-fA-F0-9]{40}$/;

    if (!bep20Regex.test(cleanAddress)) {
      return {
        isValid: false,
        message:
          "Invalid BEP20 address format. Must start with '0x' followed by 40 hexadecimal characters",
      };
    }

    // Additional validation: check if it's not a zero address
    if (
      cleanAddress.toLowerCase() ===
      "0x0000000000000000000000000000000000000000"
    ) {
      return {
        isValid: false,
        message: "Cannot use zero address (0x0000...)",
      };
    }

    return { isValid: true, message: null };
  };

  // Re-validate wallet address when it changes (always BEP20 for USDT Tether)
  useEffect(() => {
    if (walletAddress.trim()) {
      const validation = validateBEP20Address(walletAddress);
      if (!validation.isValid) {
        setWalletError(
          validation.message || "Invalid BEP20 wallet address format"
        );
      } else {
        setWalletError(null);
        // Clear any validation errors related to wallet address when it becomes valid
        setValidationErrors((prev) =>
          prev.filter(
            (error) =>
              !error.includes("wallet") &&
              !error.includes("address") &&
              !error.includes("BEP20")
          )
        );
      }
    } else {
      setWalletError(null); // Clear error when field is empty
      // Clear validation errors when field is empty
      setValidationErrors((prev) =>
        prev.filter(
          (error) =>
            !error.includes("wallet") &&
            !error.includes("address") &&
            !error.includes("BEP20")
        )
      );
    }
  }, [walletAddress]);

  // Validate first card data
  const validateFirstCard = () => {
    if (!selectedAsset) {
      return false;
    }
    if (!payAmount) {
      return false;
    }

    // Check if amount is greater than 0
    if (payAmount <= 0) {
      return false;
    }

    // Enforce minimum withdrawal amount
    if (payAmount < MIN_WITHDRAWAL_AMOUNT) {
      return false;
    }

    // Check if amount exceeds available balance
    if (effectiveBalance !== undefined && payAmount > effectiveBalance) {
      return false;
    }

    // Allow any amount including negative values
    // No validation for negative amounts
    if (!walletAddress.trim()) {
      return false;
    }

    // Validate BEP20 wallet address format
    const validation = validateBEP20Address(walletAddress);
    if (!validation.isValid) {
      return false;
    }

    // Check if receive amount meets minimum requirements (only if user has entered a value)
    if (getAmount > 0) {
      const validationError = validateReceiveAmount(getAmount, selectedAsset);
      if (validationError) {
        return false;
      }
    }

    return true;
  };

  const handleFirstCardSubmit = async () => {
    if (!isTermsAccepted) {
      showToast.error(
        "Terms required",
        "Please accept the terms and conditions to continue."
      );
      return;
    }

    // Validate amount first
    if (!payAmount || payAmount <= 0) {
      setBalanceError("Amount should be more than 0");
      showToast.error("Validation Error", "Amount should be more than 0");
      return;
    }

    if (payAmount < MIN_WITHDRAWAL_AMOUNT) {
      const msg = `Minimum withdrawal amount is ${MIN_WITHDRAWAL_AMOUNT}`;
      setBalanceError(msg);
      showToast.error("Validation Error", msg);
      return;
    }

    // Validate wallet address
    if (!walletAddress || !walletAddress.trim()) {
      setWalletError("Please add an address");
      showToast.error("Validation Error", "Please add an address");
      return;
    }

    // Validate BEP20 format
    const addressValidation = validateBEP20Address(walletAddress);
    if (!addressValidation.isValid) {
      setWalletError(addressValidation.message || "Please add an address");
      showToast.error("Validation Error", addressValidation.message || "Please add an address");
      return;
    }

    if (validateFirstCard()) {
      setIsSubmitting(true);
      setIsTransactionSubmitted(false);
      setAccountHoldMessage(null);

      try {
        // Create withdrawal payload for P2P API
        const withdrawalPayload: P2PWithdrawalRequest = {
          amount: payAmount.toString(),
          currency:
            selectedAsset.ticker?.toUpperCase() ||
            selectedAsset.symbol?.toUpperCase(),
          network:
            selectedNetwork?.network_id ||
            selectedNetwork?.network_type ||
            selectedAsset.network,
          wallet_type: "crypto",
          receiver_wallet: walletAddress,
        };

        logger.debug('p2p', "Submitting P2P withdrawal request:", withdrawalPayload);

        // Submit to P2P withdrawal API
        const withdrawalResponse = await createP2PWithdrawal(withdrawalPayload);

        logger.debug('p2p', "Withdrawal response received:", withdrawalResponse);

        // Ensure we have a valid response
        if (!withdrawalResponse) {
          throw new Error("No response received from server");
        }

        // Extract response data - handle both direct response and nested data
        const responseData =
          (withdrawalResponse as any).data || withdrawalResponse;
        const isSimpleAsset = isSimpleCalculationAsset(selectedAsset);

        let withdrawalAddress = "";
        let payoutAddress = "";
        let websocketUrl = "";
        let transactionId = "";
        let message = "";

        if (isSimpleAsset) {
          // Direct transfer response for USDT
          if (responseData.type === "direct_transfer") {
            withdrawalAddress = responseData.withdrawal_address || "";
            websocketUrl = responseData.websocket_url || "";
            transactionId = responseData.transaction_id || "";
            message =
              responseData.message || "Transaction submitted successfully";
          } else {
            // Fallback for unexpected response structure
            withdrawalAddress = responseData.withdrawal_address || "";
            websocketUrl = responseData.websocket_url || "";
            transactionId = responseData.transaction_id || "";
            message =
              responseData.message || "Transaction submitted successfully";
          }
        } else {
          // ChangeNow swap response for other assets
          if (responseData.type === "changenow_swap") {
            withdrawalAddress = responseData.details?.withdrawal_address || "";
            payoutAddress = responseData.details?.payout_address || "";
            websocketUrl = responseData.websocket_url || "";
            transactionId = responseData.transaction_id || "";
            message =
              responseData.message || "Transaction submitted successfully";
          } else {
            // Fallback for unexpected response structure
            withdrawalAddress =
              responseData.details?.withdrawal_address ||
              responseData.withdrawal_address ||
              "";
            payoutAddress = responseData.details?.payout_address || "";
            websocketUrl = responseData.websocket_url || "";
            transactionId = responseData.transaction_id || "";
            message =
              responseData.message || "Transaction submitted successfully";
          }
        }

        // Update state with extracted data
        setWithdrawalAddress(withdrawalAddress);
        setPayoutAddress(payoutAddress);
        setWebsocketUrl(websocketUrl);
        setTransactionId(transactionId);
        setQrCodeUrl(
          withdrawalAddress
            ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${withdrawalAddress}`
            : ""
        );
        setResponseMessage(message);

        // Show OTP modal first, then success modal after verification
        setSuccessAmount(payAmount);
        setPendingWithdrawalData({
          amount: payAmount,
          asset: selectedAsset,
          withdrawalAddress,
          payoutAddress,
          transactionId,
          withdrawal_id: responseData.withdrawal_id || responseData.id,
        });
        setAccountHoldMessage(null);
        setIsOTPModalOpen(true);

        logger.debug('p2p', "Withdrawal addresses generated successfully:", {
          withdrawalAddress,
          payoutAddress,
          transactionId,
        });
      } catch (error: unknown) {
        const { holdMessage, userMessage } = resolveP2pAccountHoldMessage(
          error,
          "Failed to submit withdrawal request"
        );
        if (holdMessage) {
          setAccountHoldMessage(holdMessage);
          setValidationErrors([]);
        } else {
          setAccountHoldMessage(null);
          showToast.error(userMessage);
          setValidationErrors([userMessage]);
        }
        setIsTransactionSubmitted(false);
      } finally {
        // Always stop loading state
        setIsSubmitting(false);
      }
    }
  };

  // Validate form data
  const validateForm = () => {
    const errors: string[] = [];

    if (!payAmount || payAmount <= 0) {
      errors.push("Please enter a valid amount");
    }

    if (!selectedAsset) {
      errors.push("Please select an asset");
    }

    if (!walletAddress.trim()) {
      errors.push("Please enter a BEP20 wallet address");
    } else {
      // Validate the wallet address format
      const validation = validateBEP20Address(walletAddress);
      if (!validation.isValid) {
        errors.push(validation.message || "Invalid BEP20 wallet address");
      }
    }

    if (walletError) {
      errors.push("Please fix the wallet address errors");
    }

    if (!selectedNetwork) {
      errors.push("Please select a network");
    } else {
      // Validate that network has required fields
      if (!selectedNetwork.network_id && !selectedNetwork.network_type) {
        errors.push("Selected network is missing required information");
      }
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Clear previous errors
    setValidationErrors([]);
    setAccountHoldMessage(null);

    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      showToast.error("Please fix the following errors: " + errors.join(", "));
      return;
    }

    setIsSubmitting(true);

    try {
      // Debug logging

      if (mode === "withdrawal") {
        // Handle withdrawal submission using P2P API
        const p2pWithdrawalPayload: P2PWithdrawalRequest = {
          amount: payAmount.toString(),
          currency:
            selectedAsset.ticker?.toUpperCase() ||
            selectedAsset.symbol?.toUpperCase(),
          network:
            selectedNetwork?.network_id ||
            selectedNetwork?.network_type ||
            selectedAsset.network,
          wallet_type: "crypto",
          receiver_wallet: walletAddress,
        };

        logger.debug('p2p', "Submitting P2P withdrawal request:", p2pWithdrawalPayload);
        const withdrawalResponse =
          await createP2PWithdrawal(p2pWithdrawalPayload);
        logger.debug('p2p', "P2P withdrawal response received:", withdrawalResponse);

        // Handle P2P withdrawal response
        const p2pResponse = withdrawalResponse as any;
        const responseData = p2pResponse.data || p2pResponse;

        // Show OTP modal first, then success modal after verification
        setSuccessAmount(payAmount);
        setPendingWithdrawalData({
          amount: payAmount,
          asset: selectedAsset,
          response: responseData,
          withdrawal_id: responseData.withdrawal_id || responseData.id,
        });
        setIsOTPModalOpen(true);
      } else {
        // Handle deposit submission
        const depositPayload = new FormData();
        // Validate and append required fields
        if (!payAmount || payAmount <= 0) {
          throw new Error("Invalid amount");
        }
        depositPayload.append("requested_amount", payAmount.toString());

        if (!walletAddress.trim()) {
          throw new Error("Wallet address is required");
        }
        depositPayload.append("deposit_address", walletAddress);

        // Handle currency field
        const currencyValue =
          selectedAsset.symbol === "USDT Tether"
            ? "USDT"
            : selectedAsset.symbol;
        if (!currencyValue) {
          throw new Error("Currency information is missing");
        }
        depositPayload.append("currency", currencyValue);

        // Handle network field more carefully
        const networkValue =
          selectedNetwork?.network_id || selectedNetwork?.network_type || "";
        if (!networkValue) {
          throw new Error("Network information is missing");
        }
        depositPayload.append("network", networkValue);

        // Ensure asset_id is present
        if (!selectedAsset.asset_id) {
          throw new Error("Asset ID is missing");
        }
        depositPayload.append("asset", selectedAsset.asset_id);

        // Log the complete FormData for debugging

        for (let [key, value] of depositPayload.entries()) {
        }

        // Submit to API - let axios set the correct Content-Type for FormData
        const depositResponse = (await dispatch(
          createDeposit({
            payload: depositPayload,
            config: {
              // Don't set Content-Type manually for FormData - let axios handle it
            },
          })
        ).unwrap()) as unknown as DepositResponse;

        logger.debug('p2p',
          "DEBUG: Deposit code from response:",
          depositResponse.deposit_code
        );

        // Show success message
        showToast.success("Deposit request submitted successfully!");

        // Proceed to next page only after successful submission
        if (onExchange) {
          const transactionData = {
            type: "deposit" as const,
            amount: payAmount,
            receiveAmount: parseFloat(getAmountInput) || getAmount, // From "You Receive" input
            asset: {
              ...selectedAsset,
              icon:
                selectedAsset.image_url ||
                selectedAsset.asset_image ||
                selectedAsset.icon_url ||
                selectedAsset.image,
            },
            walletAddress: walletAddress,
            network: selectedNetwork,
            transactionId: depositResponse.transaction_id,
            depositCode: depositResponse.deposit_code,
            totalAmountDue: depositResponse.total_amount_due,
            commission: depositResponse.commission as string,
            networkFee: depositResponse.network_fee as string,
            currency: depositResponse.currency,
            websocketUrl: depositResponse.websocket?.url,
          };

          onExchange(transactionData);
        }
      }
    } catch (error: unknown) {
      const { holdMessage, userMessage } = resolveP2pAccountHoldMessage(
        error,
        `Failed to submit ${mode} request`
      );
      if (holdMessage) {
        setAccountHoldMessage(holdMessage);
        setValidationErrors([]);
      } else {
        setAccountHoldMessage(null);
        showToast.error(userMessage);
        setValidationErrors([userMessage]);
      }
      // Reset transaction state on error
      setIsTransactionSubmitted(false);
      setWithdrawalAddress("");
      setPayoutAddress("");
      setQrCodeUrl("");
      setResponseMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col dark:bg-transparent  ">
      <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-[#788099]">
        Transaction Info
      </h2>

      <div className="w-full mx-auto text-[#35353e] dark:text-[#E8E8E8]">
        {/* Single Outer Card Container */}
        <div className="bg-white dark:bg-[var(--card-color)] border border-[#D1D2D4FF] dark:border-[#35353E] rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 mb-3 sm:mb-4">
          {/* Asset and Network Row */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Asset Section */}
            <div className="flex-1 sm:pr-4">
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                Asset
              </label>
              <div className="relative" ref={assetDropdownRef}>
                <div
                  className={`w-full text-[#35353e] dark:bg-[var(--card-color)] dark:text-[#ffffff] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-lg focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E] flex items-center justify-between cursor-pointer min-h-[44px] sm:min-h-0`}
                  onClick={() => {
                    setIsAssetDropdownOpen(!isAssetDropdownOpen);
                  }}
                >
                  <div className="flex items-center gap-3">
                    {selectedAsset ? (
                      <>
                        <img
                          src={
                            selectedAsset.image_url ||
                            selectedAsset.asset_image ||
                            selectedAsset.icon_url ||
                            selectedAsset.image ||
                            "/images/tether.svg"
                          }
                          alt={
                            selectedAsset.name ||
                            selectedAsset.ticker ||
                            "Asset"
                          }
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            logger.debug('p2p',
                              "Image failed to load for asset:",
                              selectedAsset
                            );
                            e.currentTarget.src =
                              "/images/tether.svg";
                          }}
                        />
                        <span className="text-[#35353e] dark:text-[#788099]">
                          {(
                            selectedAsset.ticker ||
                            selectedAsset.symbol ||
                            selectedAsset.name ||
                            "Unknown"
                          ).toUpperCase()}
                        </span>
                        <span className="ml-2 bg-gray-200 dark:bg-[#23232B] text-gray-900 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full border border-[#E3E6F0] dark:border-[#35353E]">
                          {selectedAsset.network || "Unknown"}
                        </span>
                      </>
                    ) : (
                      <>
                        <img
                          src="/images/tether.svg"
                          alt="asset icon"
                          className="w-6 h-6"
                        />
                        <span className="text-[#7e7e8f] dark:text-[#788099]">
                          {assetsDisplay.isLoading
                            ? "Loading assets..."
                            : "USDT Tether"}
                        </span>
                      </>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-[#7e7e8f] transition-transform ${isAssetDropdownOpen ? "rotate-180" : ""
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

                {/* Asset Dropdown */}
                {isAssetDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#ffffff] dark:bg-[var(--card-color)]  border border-[#A2A4A9FF] dark:border-[#35353E] rounded-xl sm:rounded-2xl z-50 max-h-[60vh] sm:max-h-80 overflow-hidden">
                    {/* Asset List */}
                    <div className="max-h-60 overflow-y-auto">
                      {sortedSwapAssets.length > 0 ? (
                        sortedSwapAssets.map((asset: any, index: number) => (
                          <div
                            key={`${asset.asset_id}-${asset.ticker}-${asset.network}-${index}`}
                            className={`flex items-center gap-3 p-3 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#23232B] cursor-pointer border-b border-[#A2A4A9FF] dark:border-[#35353E] last:border-b-0 ${
                              (selectedAsset?.asset_id &&
                                asset?.asset_id &&
                                String(selectedAsset.asset_id) ===
                                  String(asset.asset_id)) ||
                              (String(
                                selectedAsset?.ticker ||
                                  selectedAsset?.symbol ||
                                  ""
                              ).toLowerCase() ===
                                String(asset?.ticker || asset?.symbol || "").toLowerCase() &&
                                String(selectedAsset?.network || "").toLowerCase() ===
                                  String(asset?.network || "").toLowerCase())
                                ? "bg-gray-100 dark:bg-[#23232B]"
                                : ""
                            }`}
                            onClick={() => {
                              logger.debug('p2p', "Asset selected:", asset);

                              // Force BSC network and proper names for USDT Tether
                              const ticker = (
                                asset.ticker ||
                                asset.symbol ||
                                ""
                              ).toLowerCase();
                              const isUsdtTether = ticker === "usdt";

                              const updatedAsset = {
                                ...asset,
                                network: "BSC", // Force BSC network for both
                                name: isUsdtTether ? "Tether USD" : asset.name,
                              };

                              setSelectedAsset(updatedAsset);
                              setSelectedNetwork({
                                network_id: "BSC",
                                network_type: "BSC",
                              });
                              setIsAssetDropdownOpen(false);
                              // Clear validation errors related to asset selection
                              setValidationErrors((prev) =>
                                prev.filter(
                                  (error) =>
                                    !error.includes("asset") &&
                                    !error.includes("Asset")
                                )
                              );
                            }}
                          >
                            <img
                              src={
                                asset.image_url ||
                                asset.asset_image ||
                                "/images/tether.svg"
                              }
                              alt={asset.name}
                              className="w-6 h-6 rounded-full"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "/images/tether.svg";
                              }}
                            />
                            <div className="flex-1">
                              <div className="text-[#35353e] dark:text-[#ffffff] font-medium flex items-center gap-2">
                                {(
                                  asset.ticker ||
                                  asset.symbol ||
                                  asset.name ||
                                  "Unknown"
                                ).toUpperCase()}
                                <span className="bg-gray-200 dark:bg-[#23232B] text-gray-900 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full border border-[#E3E6F0] dark:border-[#35353E]">
                                  {asset.network || "Unknown"}
                                </span>
                              </div>
                              <div className="text-[#35353e] dark:text-[#788099] text-sm">
                                {asset.name ||
                                  (asset.ticker || "").toUpperCase() ||
                                  (asset.symbol || "").toUpperCase() ||
                                  "Unknown Asset"}
                                {asset.legacy_ticker && (
                                  <span className="text-xs text-[#f7c624] dark:text-[#f7c624] bg-[#f7c6241a] px-1 py-0.5 rounded-full">
                                    {asset.legacy_ticker}
                                  </span>
                                )}
                              </div>
                            </div>
                            {selectedAsset?.asset_id === asset.asset_id && (
                              <div className="w-2 h-2 rounded-full border border-[#A2A4A9FF] dark:border-[#35353E] bg-transparent"></div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-[#7e7e8f] dark:text-[#788099]">
                          Only USDT Tether on BSC is available for withdrawal
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Network Section */}
            <div className="flex-1 sm:pl-4 border-t sm:border-t-0 sm:border-l border-[#D1D2D4FF] dark:border-[#35353E] pt-4 sm:pt-0 sm:border-none">
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                Network
              </label>
              <div className="relative" ref={networkDropdownRef}>
                <div className="w-full text-[#35353e] dark:bg-[var(--card-color)] dark:text-[#ffffff] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-lg focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E] flex items-center justify-between cursor-pointer hover:border-[#A2A4A9FF] dark:hover:border-[#35353E] transition-colors min-h-[44px] sm:min-h-0"
                  onClick={() =>
                    setIsNetworkDropdownOpen(!isNetworkDropdownOpen)
                  }
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedNetwork?.icon || availableNetworks[0].icon}
                      alt="network icon"
                      className="w-6 h-6"
                    />
                    <span className="text-[#35353e] dark:text-[#788099]">
                      {selectedNetwork?.name || "Binance Smart Chain BEP20"}
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-[#7e7e8f] transition-transform ${isNetworkDropdownOpen ? "rotate-180" : ""}`}
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

                {/* Network Dropdown */}
                {isNetworkDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#ffffff] dark:bg-[var(--card-color)] border border-[#A2A4A9FF] dark:border-[#35353E] rounded-xl sm:rounded-2xl z-50 max-h-[60vh] sm:max-h-80 overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      {availableNetworks.map((network, index) => {
                        const selected =
                          selectedNetwork?.network_id === network.network_id;
                        return (
                          <div
                            key={`${network.network_id}-${index}`}
                            className={`flex items-center gap-3 p-3 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#23232B] cursor-pointer border-b border-[#A2A4A9FF] dark:border-[#35353E] last:border-b-0 ${
                              selected ? "bg-gray-100 dark:bg-[#23232B]" : ""
                            }`}
                            onClick={() => {
                              setSelectedNetwork(network);
                              setIsNetworkDropdownOpen(false);
                            }}
                          >
                            <img
                              src={network.icon}
                              alt={`${network.name} icon`}
                              className="w-6 h-6"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-[#35353e] dark:text-[#ffffff]">
                                {network.name}
                              </div>
                              <div className="text-sm text-[#7e7e8f] dark:text-[#788099]">
                                {network.network_id}
                              </div>
                            </div>
                            {network.isDefault && (
                              <span className="text-xs bg-gray-200 dark:bg-[#23232B] text-gray-900 dark:text-white px-2 py-1 rounded-full border border-[#E3E6F0] dark:border-[#35353E]">
                                Default
                              </span>
                            )}
                            {selected && (
                              <div className="w-2 h-2 rounded-full border border-[#A2A4A9FF] dark:border-[#35353E] bg-transparent" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Amount and You Receive Row */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Amount (You Send) Section */}
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] font-semibold flex items-center gap-2">
                  Amount
                  {isCalculatingFromPay &&
                    (isCalculating || isCalculatingReceive) && (
                      <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
                    )}
                </label>
                {effectiveBalance !== undefined && (
                  <span className="text-xs sm:text-sm text-[#1D8751] dark:text-[#1D8751] font-medium">
                    Available: {formatCurrency(effectiveBalance, (selectedAsset?.ticker || selectedAsset?.symbol || "USDT").toUpperCase())}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={payAmountInput}
                  onChange={(e) => {
                    let inputValue = e.target.value;

                    if (inputValue.length > 1) {
                      if (inputValue.startsWith("-")) {
                        const rest = inputValue.slice(1);
                        if (rest.startsWith("0") && rest[1] !== ".")
                          inputValue = "-" + (rest.replace(/^0+/, "") || "0");
                      } else if (inputValue.startsWith("0") && inputValue[1] !== ".") {
                        inputValue = inputValue.replace(/^0+/, "") || "0";
                      }
                    }

                    if (inputValue === "" || /^-?\d*\.?\d*$/.test(inputValue)) {
                      if (inputValue.includes(".")) {
                        const decimalPart = inputValue.split(".")[1];
                        if (decimalPart && decimalPart.length > 8) {
                          setCalculationError(
                            "Ensure that there are no more than 8 decimal places."
                          );
                          return;
                        }
                      }

                      setPayAmountInput(inputValue);
                      setIsCalculatingFromReceive(false);

                      const parsedValue =
                        inputValue === "" ? 0 : parseFloat(inputValue) || 0;

                      const newValue = parsedValue;
                      setPayAmount(newValue);
                      setIsCalculatingFromPay(true);
                      setIsUserModifiedAmount(true);

                      if (newValue <= 0) {
                        setBalanceError("Amount should be more than 0");
                      } else if (newValue < MIN_WITHDRAWAL_AMOUNT) {
                        setBalanceError(`Minimum withdrawal amount is ${MIN_WITHDRAWAL_AMOUNT}`);
                      } else {
                        const balanceValidationError = validateBalance(newValue);
                        setBalanceError(balanceValidationError);
                      }

                      setReceiveAmountError(null);
                      setApiValidationError(null);
                      setCalculationError(null);
                      setValidationErrors((prev) =>
                        prev.filter(
                          (error) =>
                            !error.includes("amount") &&
                            !error.includes("Amount")
                        )
                      );
                    }
                  }}
                  onFocus={() => setIsCalculatingFromPay(true)}
                  placeholder="Enter amount"
                  className={`w-full text-[#35353e] dark:bg-[var(--card-color)] dark:text-[#ffffff] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-2 pr-24 sm:pr-28 text-sm sm:text-lg focus:outline-none border appearance-none min-h-[44px] sm:min-h-0 ${apiValidationError
                    ? "border-red-500"
                    : isCalculating || isCalculatingReceive
                      ? "border-[#1D8751]"
                      : "border-[#A2A4A9FF] dark:border-[#35353E]"
                    }`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  {effectiveBalance !== undefined && effectiveBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const maxVal = effectiveBalance;
                        setPayAmountInput(maxVal.toString());
                        setPayAmount(maxVal);
                        setIsCalculatingFromPay(true);
                        setIsCalculatingFromReceive(false);
                        setIsUserModifiedAmount(true);
                        const err = validateBalance(maxVal);
                        setBalanceError(err);
                      }}
                      className="text-[#1D8751] hover:text-[#166b3e] font-semibold text-xs sm:text-sm px-2 py-0.5 rounded-md hover:bg-[#1D8751]/10 transition-colors"
                    >
                      Max
                    </button>
                  )}
                  <span className="text-[#35353e] dark:text-[#ffffff] text-sm font-medium">
                    {selectedAsset
                      ? (
                        selectedAsset.ticker ||
                        selectedAsset.symbol ||
                        "USDT"
                      ).toUpperCase()
                      : "USDT"}
                  </span>
                </div>
              </div>
              {calculationError && (
                <div className="mt-2 text-sm text-yellow-500 dark:text-yellow-400">
                  {calculationError}
                </div>
              )}
              {balanceError && (
                <div className="mt-2 text-sm text-red-500 dark:text-red-400">
                  {balanceError}
                </div>
              )}
              {apiValidationError && (
                <div className="mt-2 text-sm text-yellow-500 dark:text-yellow-400">
                  {apiValidationError}
                </div>
              )}
            </div>

            {/* You Receive Section */}
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] font-semibold flex items-center gap-2">
                  To
                  <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
                </label>
                {(p2pCommissionRate > 0 || p2pFixedCommissionFee > 0) && (
                  <span className="text-xs sm:text-sm text-[#F79330] font-medium">
                    Fee: {p2pCommissionIsPercentage
                      ? `${p2pCommissionRate}%`
                      : `${p2pFixedCommissionFee.toFixed(2)} ${(
                        selectedAsset?.ticker ||
                        selectedAsset?.symbol ||
                        "USDT"
                      ).toUpperCase()}`}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={p2pReceiveAmount}
                  onChange={(e) => {
                    let inputValue = e.target.value;

                    if (inputValue.length > 1) {
                      if (inputValue.startsWith("0") && inputValue[1] !== ".") {
                        inputValue = inputValue.replace(/^0+/, "") || "0";
                      }
                    }

                    if (inputValue === "" || /^\d*\.?\d*$/.test(inputValue)) {
                      if (inputValue.includes(".")) {
                        const decimalPart = inputValue.split(".")[1];
                        if (decimalPart && decimalPart.length > 8) return;
                      }

                      setP2pReceiveAmount(inputValue);
                      setIsCalculatingFromReceive(true);

                      const receiveVal = inputValue === "" ? 0 : parseFloat(inputValue) || 0;
                      if (receiveVal > 0) {
                        const sendAmount = p2pCommissionIsPercentage
                          ? (p2pCommissionRate >= 100
                            ? receiveVal
                            : receiveVal / (1 - p2pCommissionRate / 100))
                          : (receiveVal + p2pFixedCommissionFee);
                        setPayAmount(sendAmount);
                        setPayAmountInput(sendAmount.toFixed(2));
                        setIsUserModifiedAmount(true);

                        const balanceValidationError = validateBalance(sendAmount);
                        setBalanceError(balanceValidationError);
                      } else {
                        setPayAmount(0);
                        setPayAmountInput("");
                      }

                      setReceiveAmountError(null);
                      setApiValidationError(null);
                      setCalculationError(null);
                    }
                  }}
                  placeholder="Amount after fee"
                  className={`w-full bg-white text-[#111827] dark:bg-[var(--card-color)] dark:text-white rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-2 pr-16 sm:pr-20 text-sm sm:text-lg focus:outline-none border appearance-none min-h-[44px] sm:min-h-0 border-[#A2A4A9FF] dark:border-[#35353E]`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="text-[#35353e] dark:text-[#ffffff] text-sm font-medium">
                    {selectedAsset
                      ? (
                        selectedAsset.ticker ||
                        selectedAsset.symbol ||
                        "USDT"
                      ).toUpperCase()
                      : "USDT"}
                  </span>
                </div>
              </div>
              {(p2pCommissionRate > 0 || p2pFixedCommissionFee > 0) && payAmount > 0 && (
                <div className="mt-2 text-xs text-[#788099] dark:text-[#5A5A65]">
                  Commission: {(p2pCommissionIsPercentage
                    ? ((payAmount * p2pCommissionRate) / 100)
                    : p2pFixedCommissionFee
                  ).toFixed(2)} {(selectedAsset?.ticker || selectedAsset?.symbol || "USDT").toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Wallet Address Section */}
          <div className="mt-4">
            <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
              Wallet Address
              <div className="w-2 h-2 opacity-0"></div>
            </label>
            <div className="relative">
              <FaWallet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#7e7e8f] dark:text-[#788099] pointer-events-none z-10" />
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => {
                  clearSaveBookmarkError();
                  setWalletAddress(e.target.value);
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  clearSaveBookmarkError();
                  const pastedText = e.clipboardData.getData("text");
                  setWalletAddress(pastedText);
                }}
                placeholder="Enter BEP20 wallet address (0x...)"
                className={`w-full text-[#35353e] dark:bg-[var(--card-color)] dark:text-[#ffffff] rounded-xl sm:rounded-2xl pl-11 sm:pl-12 pr-[4.75rem] sm:pr-24 py-2.5 sm:py-2 text-sm sm:text-lg focus:outline-none border min-h-[44px] sm:min-h-0 ${walletError
                  ? "border-red-500 focus:border-red-500"
                  : walletAddress.trim() && !walletError
                    ? "border-green-500"
                    : "border-[#A2A4A9FF] dark:border-[#35353E]"
                  }`}
              />
              <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2">
                <span
                  ref={bookmarkAnchorRef}
                  className="text-[#1D8751] cursor-pointer flex-shrink-0 hover:opacity-80 transition-opacity"
                  onClick={async () => {
                    if (bookmarkOpen) {
                      setBookmarkOpen(false);
                      return;
                    }
                    setBookmarkOpen(true);
                    await fetchBookmarks();
                  }}
                  title="Load from whitelist"
                >
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (!navigator?.clipboard?.readText) {
                        showToast.error("Clipboard paste is not supported");
                        return;
                      }
                      const pastedText = await navigator.clipboard.readText();
                      if (!pastedText.trim()) return;
                      clearSaveBookmarkError();
                      setWalletAddress(pastedText.trim());
                      setWalletCopied(true);
                      setTimeout(() => setWalletCopied(false), 1800);
                    } catch {
                      showToast.error("Failed to paste wallet address");
                    }
                  }}
                  className={`transition-colors ${
                    walletCopied
                      ? "text-green-500 dark:text-green-400"
                      : "text-[#7e7e8f] dark:text-[#788099] hover:text-[#1D8751]"
                  }`}
                  aria-label="Paste wallet address"
                >
                  {walletCopied ? (
                    <span className="text-xs sm:text-sm font-medium">Pasted</span>
                  ) : (
                    <FaPaste className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
              <BookmarkDropdown
                isOpen={bookmarkOpen}
                onClose={() => setBookmarkOpen(false)}
                bookmarks={bookmarks}
                loading={bookmarksLoading}
                saving={bookmarkSaving}
                currentAddress={walletAddress}
                asset={currentCurrency}
                network={currentNetwork}
                onSelect={(addr) => {
                  clearSaveBookmarkError();
                  setWalletAddress(addr);
                  const validation = validateBEP20Address(addr);
                  setWalletError(validation.isValid ? null : validation.message);
                }}
                onSaveCurrent={async (label) => {
                  try {
                    if (!walletAddress.trim() || !currentCurrency || !currentNetwork) {
                      showToast.error("Enter address and select asset/network first");
                      return;
                    }
                    const validation = validateBEP20Address(walletAddress);
                    if (!validation.isValid) {
                      showToast.error("Validation Error", validation.message || "Invalid address");
                      return;
                    }
                    await saveBookmark({
                      address: walletAddress.trim(),
                      label,
                      network: currentNetwork,
                      asset: currentCurrency,
                    });
                  } catch {
                    /* handled by hook */
                  }
                }}
                defaultLabel="My USDT wallet"
                saveError={saveBookmarkError}
                onDelete={(b) => deleteBookmark(b.id)}
                anchorRef={bookmarkAnchorRef}
                isDark={isDark}
                saveDisabled={!validateBEP20Address(walletAddress).isValid}
              />
            </div>
            {saveBookmarkError && (
              <p className="text-red-500 text-sm mt-1">{saveBookmarkError}</p>
            )}
            {walletError && (
              <p className="text-red-500 text-sm mt-1">{walletError}</p>
            )}
            {walletCopied && !walletError && (
              <p className="text-green-500 text-sm mt-1 font-medium transition-all duration-200">Pasted</p>
            )}
            {walletAddress.trim() && !walletError && !walletCopied && (
              <p className="text-green-500 text-sm mt-1">
                ✅ Valid BEP20 address
              </p>
            )}
          </div>

          {/* Terms & Conditions — P2P / USDT BEP20 (shows 3 items, Show More for 4–5) */}
          <div className="mb-4 mt-4 sm:mt-6">
            <ExpressP2PWithdrawalTermsPanel
              expandedTerms={expandedTerms}
              setExpandedTerms={setExpandedTerms}
              variant="dashboard"
              isDark={isDark}
            />

            <div className="mt-4">
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                  input[type="checkbox"].terms-checkbox-green:checked {
                    background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L4.5 10.586l6.293-6.293a1 1 0 011.414 0z'/%3e%3c/svg%3e") !important;
                    background-size: 14px 14px !important;
                    background-repeat: no-repeat !important;
                    background-position: center !important;
                  }
                `,
                }}
              />
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  id="p2p-withdrawal-terms-accepted"
                  className="terms-checkbox-green mt-1 mr-3 w-4 h-4 rounded border-2 border-[#1D8751] focus:ring-[#1D8751] appearance-none bg-transparent checked:bg-[#1D8751] checked:border-[#1D8751] flex-shrink-0"
                  checked={isTermsAccepted}
                  onChange={(e) => setIsTermsAccepted(e.target.checked)}
                />
                <span className="text-[#35353e] dark:text-[#788099] text-sm">
                  I confirm that I have read and accepted all the terms listed above
                  and the{" "}
                  <a
                    href="/legal/terms-of-service"
                    className="text-[#1D8751] cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBeforeLegalNavigate();
                    }}
                  >
                    Terms of Service
                  </a>
                  .
                </span>
              </label>
            </div>
          </div>

        </div>

        {/* Submit Button for First Card */}
        <div className="mt-3 sm:mt-4">
          <ScamFlagSubmitBanner message={accountHoldMessage} className="mb-3" />
          {isTransactionSubmitted ? (
            ""
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full text-sm sm:text-base font-medium py-3 sm:py-2 rounded-xl sm:rounded-2xl border border-[#35353e] dark:border-[#35353e] text-[#35353e] dark:text-white flex items-center justify-center gap-2 transition-colors min-h-[44px] sm:min-h-0 hover:bg-[#f3f4f6] dark:hover:bg-[#2a2a34]"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                className={`w-full text-white dark:text-white text-sm sm:text-base font-medium py-3 sm:py-2 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-colors min-h-[44px] sm:min-h-0 ${isSubmitting ||
                  isTransactionSubmitted ||
                  isInfoModalOpen ||
                  getAmount > 15000 ||
                  payAmount <= 0 ||
                  !!balanceError ||
                  !!accountHoldMessage ||
                  !isTermsAccepted
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#1D8751] hover:bg-[#166b3e]"
                  }`}
                onClick={handleFirstCardSubmit}
                disabled={
                  isSubmitting ||
                  isTransactionSubmitted ||
                  isInfoModalOpen ||
                  getAmount > 15000 ||
                  payAmount <= 0 ||
                  !!balanceError ||
                  !!accountHoldMessage ||
                  !isTermsAccepted
                }
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span className="text-white">
                      Submitting...
                    </span>
                  </div>
                ) : isTransactionSubmitted ? (
                  <div className="flex items-center gap-2">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M9 12l2 2 4-4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white"
                      />
                    </svg>
                    <span className="text-white">
                      Withdraw addresses generated
                    </span>
                  </div>
                ) : (
                  <span className="text-white">Withdraw</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Address Section - shown after transaction submission */}
      {false && isTransactionSubmitted && (
        <div
          key={`wallet-section-${forceUpdate}`}
          className="mb-6 flex flex-col gap-3 w-full px-2"
        >
          <h2 className="text-xl font-bold mb-2  text-[#7e7e8f] dark:text-[#788099]">
            <span className="text-[#7e7e8f] dark:text-[#788099]">2-</span>{" "}
            Wallet Address
          </h2>
          <div className="dark:bg-[var(--card-color)] border border-[#35353e] rounded-2xl p-5 shadow-lg w-full text-[#35353e] dark:text-[#788099]">
            {/* USDT Wallet Address */}
            <div className="mb-4">
              <h3 className="text-[#35353e] dark:text-[#788099] font-semibold mb-2">
                USDT Wallet Address
              </h3>
              {withdrawalAddress ? (
                <div className=" dark:bg-[var(--card-color)]  border border-[#1D8751] rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#35353e] dark:text-[#788099] text-sm font-mono break-all">
                      {withdrawalAddress}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(withdrawalAddress);
                          // showToast.success("Wallet address copied!");
                        }}
                        className="flex items-center gap-1 bg-[#23232b] dark:bg-[#35353E] border border-[#1D8751] text-[#1D8751] rounded-full px-4 py-1 font-semibold text-base hover:bg-[#1D8751] hover:text-[#35353e] transition-colors"
                      >
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <rect
                            x="3"
                            y="3"
                            width="13"
                            height="13"
                            rx="2"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        </svg>
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className=" dark:bg-[var(--card-color)] border border-[#1D8751] rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M9 12l2 2 4-4"
                        stroke="#1D8751"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-[#1D8751] font-medium">
                      Transaction submitted successfully! Please wait for
                      further instructions.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="mb-4">
              <div className=" dark:bg-[var(--card-color)] border border-[#A2A4A9FF] dark:border-[#35353E] rounded-xl p-4 flex justify-center">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                ) : (
                  <div className="flex flex-col items-center justify-center w-48 h-48 text-[#7e7e8f] dark:text-[#788099]">
                    <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4H3V5z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-sm mt-2 text-center">
                      QR Code not available
                    </span>
                  </div>
                )}
              </div>
              <p className="text-center text-[#7e7e8f] dark:text-[#788099] text-sm mt-2">
                {qrCodeUrl
                  ? `Scan QR code to send ${selectedAsset?.ticker?.toUpperCase()}`
                  : "Please wait for further instructions"}
              </p>
            </div>

            {/* Terms & Conditions — P2P / USDT BEP20 withdrawal */}
            <ExpressP2PWithdrawalTermsPanel
              expandedTerms={expandedTerms}
              setExpandedTerms={setExpandedTerms}
              variant="dashboard"
              isDark={isDark}
            />

            {/* Terms Checkbox */}
            <div className="mt-4">
              <style dangerouslySetInnerHTML={{
                __html: `
                  input[type="checkbox"].terms-checkbox-green:checked {
                    background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L4.5 10.586l6.293-6.293a1 1 0 011.414 0z'/%3e%3c/svg%3e") !important;
                    background-size: 14px 14px !important;
                    background-repeat: no-repeat !important;
                    background-position: center !important;
                  }
                `
              }} />
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  className="terms-checkbox-green mt-1 mr-3 w-4 h-4 rounded border-2 border-[#1D8751] focus:ring-[#1D8751] appearance-none bg-transparent checked:bg-[#1D8751] checked:border-[#1D8751] flex-shrink-0"
                />
                <span className="text-[#35353e] dark:text-[#788099] text-sm">
                  I confirm that I have read and accepted all the terms listed above and the{" "}
                  <a
                    href="/legal/terms-of-service"
                    className="text-[#1D8751] cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBeforeLegalNavigate();
                    }}
                  >
                    Terms of Service
                  </a>
                  .
                </span>
              </label>
            </div>
          </div>
          {/* Disclaimer and Button outside the card */}
          <div className="flex flex-col gap-3 w-full px-2">


            {/* Warning message for amounts over $15,000 */}
            {getAmount > 15000 && (
              <div className="flex items-center text-[#1D8751] text-[14px] font-medium bg-[#23232b] dark:bg-[#35353E] border border-[#1D8751] rounded-xl p-3">
                <FaExclamationCircle className="mr-2 text-[#1D8751]" />
                <span>
                  Amount exceeds $15,000. Please reduce the amount or contact
                  our OTC Desk for better rates.
                </span>
              </div>
            )}
            <button
              className={`w-full text-[#35353e] dark:text-[#788099] text-base font-medium py-2 rounded-2xl flex items-center justify-center gap-2 transition-colors ${isSubmitting || isInfoModalOpen || getAmount > 15000
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-[#1D8751] hover:bg-[#166b3e]"
                }`}
              onClick={() => {
                // Show OTP modal first, then success modal after verification
                setSuccessAmount(payAmount);
                setPendingWithdrawalData({
                  amount: payAmount,
                  asset: selectedAsset,
                  withdrawal_id: `demo-${Date.now()}`, // Demo ID for testing UI flow
                });
                setIsOTPModalOpen(true);
              }}
              disabled={isSubmitting || isInfoModalOpen || getAmount > 15000}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span className="text-white">Submitting...</span>
                </div>
              ) : (
                <span className="text-white">Confirm withdraw</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Validation Errors Display */}
      {validationErrors.filter((error) => !isScamFlagUserMessage(error)).length >
        0 && (
        <div className="w-full px-2 mb-4">
          <div className="bg-[#23232b] dark:bg-[#35353E] border border-[#1D8751] rounded-2xl p-4">
            <h3 className="text-[#1D8751] font-semibold mb-2">
              Please fix the following errors:
            </h3>
            <ul className="list-disc list-inside text-[#1D8751] space-y-1">
              {validationErrors
                .filter((error) => !isScamFlagUserMessage(error))
                .map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
            </ul>
          </div>
        </div>
      )}

      {/* InfoModal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => {
          setIsInfoModalOpen(false);
          // Don't automatically acknowledge when just closing - user must reduce amount
        }}
        onContactUs={() => {
          setIsInfoModalOpen(false);
          router.push("/contactUs");
        }}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          // Reset form after success
          setPayAmount(0);
          setPayAmountInput("");
          setWalletAddress("");
          setIsTransactionSubmitted(false);
          // Reload the page after closing the success modal
          window.location.reload();
        }}
        amount={successAmount}
        asset={selectedAsset}
        onNavigateToP2P={() => {
          // Navigate to P2P page
          router.push("/dashboard/p2p");
        }}
      />

      {/* OTP Modal */}
      <OTPModal
        isOpen={isOTPModalOpen}
        onClose={handleOTPClose}
        onVerify={handleOTPVerify}
        onResend={handleOTPResend}
        isLoading={otpLoading}
        error={otpError}
        usePortal
      />
    </div>
  );
}
