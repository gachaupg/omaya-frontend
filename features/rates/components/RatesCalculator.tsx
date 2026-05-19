"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaBitcoin, FaUniversity } from "react-icons/fa";
import { FiChevronDown, FiInfo } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../store";
import { RootState } from "../../../store/rootReducer";
import { setAuthRedirectPath } from "@/lib/utils/authRedirect";
import {
  createDeposit,
  updateDepositAddress,
} from "../../exchange/slices/exchangeSlice";
import {
  fetchSwapEstimate,
} from "../../swap/slices/swapSlice";
import { fetchUserPaymentDetails, fetchPublicPaymentMethods } from "../../p2p/slices/paymentMethodsSlice";
import { fetchAdminWalletList, fetchAdminPaymentDetails } from "../../exchange/slices/paymentSlice";
import PaymentMethodsModal from "../../p2p/components/ui/p2pdashboard/sections/PaymentMethodsModal";
import {
  createExpressWithdrawal,
  fetchCommissionDetails,
  fetchExchangeCommissionLookup,
  getCommissionApiAsset,
  getExchangeLookupParams,
  isExchangeCommissionLookupAsset,
  isForexPrimusAsset,
  type CommissionLookupResponse,
  type ExchangeCommissionLookupResponse,
} from "../../express/api";
import { Asset, DepositResponse } from "../../exchange/types";
import { SupportedAsset } from "../../swap/types";
import { ExpressWithdrawalPayload } from "../../express/types";
import { useAssetsDisplay, usePaymentMethodsDisplay } from "../../express/hooks/useDataDisplay";
import CustomSelect from "@/components/ui/CustomSelect";
import {
  PAYMENT_LOGO_BASE_CLASS,
  PAYMENT_LOGO_SIZE,
} from "../../express/utils/imageHelpers";
import { calculateCommission } from "@/features/exchange/components/utils/calculations/commissionCalculator";
import {
  calculateNetworkFee,
  calculateTotalFees,
} from "@/features/exchange/components/utils/calculations/feeCalculator";
import { useRatesI18n } from "@/lib/useRatesI18n";
import { FaSearch } from "react-icons/fa";
import { showToast } from "@/lib/utils/toast";
import { openKYCModal, checkKYCStatus } from "@/features/auth/slices/authSlice";
import { useTheme } from "@/context/theme";
import MoneyXRates from "./MoneyXRates";
import { ClipboardPaste } from "lucide-react";
import CopyButton from "@/components/ui/CopyButton";
import { API_CONFIG } from "@/lib/appConfig";
import { useValidateAddress } from "@/hooks/useValidateAddress";
import { resolveForexDepositAdminPaymentDetailId } from "../../express/utils/forexDepositResolution";
import { assetMatchesSearchTerm } from "@/lib/utils/assetSearch";
import {
  ExpressBankWithdrawalTermsPanel,
  resolveExpressBankWithdrawalTermsFields,
} from "@/features/express/components/legal/ExpressBankWithdrawalTermsPanel";
import { EXPRESS_P2P_WITHDRAWAL_TERMS_OF_SERVICE_MODAL } from "@/features/express/constants/expressP2PWithdrawalTerms";
import ForexWithdrawal from "../../express/components/forms/ForexWithdrawal";
import InfoModal from "../../express/components/forms/info";
import { useBookmarkedAddresses } from "../../express/hooks/useBookmarkedAddresses";
import { BookmarkDropdown } from "../../express/components/forms/BookmarkDropdown";
import FrozenAccountModal from "@/components/ui/FrozenAccountModal";

import { logger } from '@/lib/utils/logger';
import { stripLeadingZerosFromDecimalInput } from "@/lib/utils/decimalAmountInput";
import { useChangeNowAssets } from "@/features/express/home/hooks/useChangeNowAssets";
import {
  RatesAssetImage,
  RATES_ASSET_ICON_FALLBACK,
  normalizeRatesAssetIconForPayload,
  pickRatesAssetImageRaw,
} from "./RatesAssetImage";

const MISSING_FXP_USD_RATE_ERROR =
  "No exchange rate configured for FXP to USD";
const MISSING_FXP_FXP_RATE_ERROR =
  "No exchange rate configured for FXP to FXP";
const isFxpUnsupportedRateError = (message: string) => {
  const m = String(message || "").toLowerCase();
  return (
    m.includes("not_valid_params") ||
    m.includes("currency fxp is not supported") ||
    m.includes("could not get rate for fxp/usdt")
  );
};
const NEGATIVE_RECEIVE_ERROR =
  "Receive amount cannot be negative. Please adjust the amount.";
const EXPRESS_FIXED_MIN_AMOUNT = 5;
const buildNegativeReceiveError = (value: number) =>
  `${NEGATIVE_RECEIVE_ERROR} Calculated value: ${value.toFixed(2)}.`;

interface UserPaymentDetail {
  id: number;
  user_payment_detail_id?: string;
  payment_method_name: string;
  payment_provider_name: string;
  account_name: string;
  account_number: string;
  provider_name?: string;
  provider_logo?: string;
  wallet_address?: string;
  status?: string;
}

const isAxiosGenericStatusMessage = (msg: string): boolean =>
  /^request failed with status code \d{3}$/i.test(String(msg || "").trim());

/** True when integer part exceeds JS safe integer range or fractional part is extremely long (avoids pointless API calls and opaque 500s). */
const isAmountStringTooLargeForSafeCalculation = (input: string): boolean => {
  const s = String(input ?? "")
    .replace(/,/g, "")
    .trim();
  if (!s) return false;
  const unsigned = s.replace(/^[-+]+/, "");
  if (!unsigned || unsigned === ".") return false;
  const noExponent = unsigned.split(/e/i)[0];
  const [intPartRaw, frac = ""] = noExponent.split(".");
  const intPart = (intPartRaw || "0").replace(/^0+/, "") || "0";
  if (frac.length > 24) return true;
  if (intPart.length > 16) return true;
  if (intPart.length === 16) {
    try {
      return BigInt(intPart) > BigInt(Number.MAX_SAFE_INTEGER);
    } catch {
      return true;
    }
  }
  return false;
};

const extractApiErrorMessage = (error: any, fallback: string): string => {
  const cleanMessage = (msg: string): string => {
    const v = String(msg || "").trim();
    if (!v) return "";
    if (isAxiosGenericStatusMessage(v)) return "";
    return v;
  };
  const responseData = error?.response?.data;
  if (typeof responseData === "string" && responseData.trim()) return responseData;

  const direct =
    responseData?.message ||
    responseData?.error ||
    responseData?.response_data?.message ||
    responseData?.response_data?.error ||
    responseData?.details ||
    responseData?.detail ||
    "";
  const cleanedDirect = cleanMessage(direct);
  if (cleanedDirect) return cleanedDirect;

  const fieldErrors = responseData?.errors || responseData?.error;
  if (fieldErrors && typeof fieldErrors === "object" && !Array.isArray(fieldErrors)) {
    const firstKey = Object.keys(fieldErrors)[0];
    if (firstKey) {
      const value = fieldErrors[firstKey];
      if (Array.isArray(value) && value.length > 0) {
        return `${firstKey}: ${String(value[0])}`;
      }
      if (typeof value === "string" && value.trim()) {
        return `${firstKey}: ${value}`;
      }
    }
  }

  if (typeof error === "string") {
    const cleanedStringError = cleanMessage(error);
    if (cleanedStringError) return cleanedStringError;
  }
  if (error?.message && String(error.message).trim()) {
    const cleanedMessage = cleanMessage(String(error.message));
    if (cleanedMessage) return cleanedMessage;
  }
  return fallback;
};

// Helper function to get network value from asset (handles both Asset and SupportedAsset types)
const getAssetNetwork = (asset: any): string => {
  if (!asset) return "";

  // Prefer canonical ids/types from selected asset first.
  if (asset.network_id) return String(asset.network_id);
  if (asset.network_type) return String(asset.network_type);

  // For SupportedAsset (swap assets) - has network property
  if (asset.network) {
    return String(asset.network);
  }

  // For Asset (exchange assets) - has networks array
  if (asset.networks && asset.networks.length > 0) {
    return (
      String(asset.networks[0].network_id || "") ||
      String(asset.networks[0].network_type || "")
    );
  }

  return "";
};

// Same as express deposit: USDT/USDC on BSC + exchange commission-lookup assets (USDT BEP20, BNB, USDT ERC20, USDC, …)
const isSimpleCalculationAsset = (asset: any) => {
  if (!asset) return false;
  const ticker = (asset?.ticker || asset?.symbol || "").toLowerCase();
  const network = (asset?.network || "").toLowerCase();
  return (
    (ticker === "usdt" && network === "bsc") ||
    (ticker === "usdc" && network === "bsc") ||
    isExchangeCommissionLookupAsset(asset)
  );
};

const resolveCommissionApiAsset = (asset: any): string | null => {
  const candidates = [
    asset?.ticker,
    asset?.symbol,
    asset?.name,
    (asset as any)?.legacyTicker,
    (asset as any)?.legacy_ticker,
    (asset as any)?.original_ticker,
    (asset as any)?.change_now_ticker,
  ];
  for (const c of candidates) {
    const resolved = getCommissionApiAsset(String(c || ""));
    if (resolved) return resolved;
  }
  // Last fallback: FX Primus detector is more tolerant (e.g. "FX Primus")
  if (isForexPrimusAsset(asset)) return "fxprimus";
  return null;
};

const isCommissionApiAsset = (asset: any) => !!resolveCommissionApiAsset(asset);

/** Commission % via fetchCommission — crypto exchange-lookup assets use lookup; FX Primus uses legacy API only (lookup returns "no FXP rate" when unset). */
const usesLegacyPercentCommission = (asset: any) =>
  !!asset &&
  isCommissionApiAsset(asset) &&
  (!isExchangeCommissionLookupAsset(asset) || isForexPrimusAsset(asset));

/** Instant amount update without waiting on exchange / swap */
const isInstantAmountAsset = (asset: any) => usesLegacyPercentCommission(asset);
const isOtcPopupAsset = (asset: any) =>
  !!asset && !isSimpleCalculationAsset(asset) && !isForexPrimusAsset(asset);
const isFixedMinWithdrawalAsset = (asset: any) => {
  const raw = String(asset?.ticker || asset?.symbol || asset?.name || "")
    .trim()
    .toLowerCase();
  return raw === "usd" || raw === "usdt" || raw.startsWith("usdt ");
};

const toNonNegativeAmount = (value: unknown): number => {
  const parsed =
    typeof value === "number" ? value : parseFloat(String(value ?? ""));
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed);
};

interface RatesCalculatorProps {
  activeTab?: 'crypto' | 'moneyx';
}

const RatesCalculator = ({ activeTab = 'crypto' }: RatesCalculatorProps) => {
  const { t } = useRatesI18n();
  const swapEstimateUnavailable = () =>
    t(
      "rates.swapEstimateUnavailable",
      "We could not get a rate for this amount. Try a smaller amount or try again shortly."
    );
  const amountTooLargeInput = () =>
    t(
      "rates.amountTooLargeInput",
      "This amount is too large to calculate accurately. Enter a smaller amount."
    );
  const mapSwapEstimateFailureText = (
    error: any,
    preferredDetail: string,
    preferredError: string
  ): string => {
    const data = error?.response?.data;
    let fromApi = "";
    if (typeof data === "string" && data.trim()) {
      fromApi = data.trim();
    } else if (data && typeof data === "object") {
      fromApi = String(data.message || data.error || data.detail || "").trim();
    }
    if (fromApi && !isAxiosGenericStatusMessage(fromApi)) return fromApi;

    const primary = String(preferredDetail || preferredError || "").trim();
    if (
      primary &&
      !isAxiosGenericStatusMessage(primary) &&
      !/^request timeout$/i.test(primary)
    ) {
      return primary;
    }
    return swapEstimateUnavailable();
  };
  const { isDark } = useTheme();
  const router = useRouter();
  const [internalActiveTab, setInternalActiveTab] = useState("deposit");
  const [isDepositMode, setIsDepositMode] = useState(true);
  const [showFrozenModal, setShowFrozenModal] = useState(false);

  // Get authentication state and user (for verification check)
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const isFrozenUser = isAuthenticated && user?.freeze === true;

  // Network mapping function
  const getNetworkDisplayName = (network: string) => {
    const networkMap: { [key: string]: string } = {
      bsc: "BSC",
      matic: "Polygon",
      avaxc: "Avalanche",
      eth: "Ethereum",
      osmo: "Osmosis",
      band: "Band Protocol",
      sol: "Solana",
      nano: "Nano",
      sxp: "Solar",
      luna: "Terra",
      base: "Base",
      trc20: "TRON",
      trx: "TRON",
      fxprimus: "FXPrimus",
    };

    return networkMap[network?.toLowerCase()] || network || "Unknown";
  };
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [assetSearchTerm, setAssetSearchTerm] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");
  const [isMethodDropdownOpen, setIsMethodDropdownOpen] = useState(false);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<any>(null);
  // For withdrawal: provider selection + registered account (like express)
  const [payBank, setPayBank] = useState<string>("");
  const [selectedProviderData, setSelectedProviderData] = useState<any>(null);
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<UserPaymentDetail[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethodError, setPaymentMethodError] = useState<string | null>(null);
  const [isFieldsSwapped, setIsFieldsSwapped] = useState(false); // Track if payment method and asset positions are swapped
  const [amount, setAmount] = useState("100");
  const [receiveAmount, setReceiveAmount] = useState("98");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFirstCardSubmitted, setIsFirstCardSubmitted] = useState(false);
  const [transactionId, setTransactionId] = useState<string>("");
  const [responseData, setResponseData] = useState<any>(null);
  const [depositCode, setDepositCode] = useState<string>("");
  const [withdrawalAddress, setWithdrawalAddress] = useState<string>("");
  const [payoutAddress, setPayoutAddress] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isWalletAddressCopied, setIsWalletAddressCopied] = useState(false);
  const [isPayoutAddressCopied, setIsPayoutAddressCopied] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [walletError, setWalletError] = useState<string>("");
  const [isWalletValidating, setIsWalletValidating] = useState(false);
  const [isPasted, setIsPasted] = useState(false);
  const [expandedP2pWithdrawalTerms, setExpandedP2pWithdrawalTerms] =
    useState(false);
  const [isP2pWithdrawalTermsAccepted, setIsP2pWithdrawalTermsAccepted] =
    useState(false);
  const [legalModal, setLegalModal] = useState<{
    title: string;
    content: string[];
  } | null>(null);
  const openLegalModal = useCallback((title: string, content: string[]) => {
    setLegalModal({ title, content });
  }, []);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const bookmarkAnchorRef = useRef<HTMLSpanElement>(null);
  /** FX Primus — same as express deposit.tsx (forex account + optional notes) */
  const [forexAccountNumber, setForexAccountNumber] = useState<string>("");
  const [forexUserNotes, setForexUserNotes] = useState<string>("");
  const selectedAssetTicker = String(
    selectedAsset?.ticker || selectedAsset?.symbol || selectedAsset?.name || ""
  )
    .trim()
    .toUpperCase();
  const shouldShowTemporaryWalletAddressNotice =
    !!selectedAssetTicker &&
    !selectedAssetTicker.includes("USDT") &&
    !selectedAssetTicker.includes("USDC");

  const getValidationCurrency = (asset: any): string => {
    const ticker = String(asset?.ticker || asset?.symbol || asset?.name || "").trim();
    if (!ticker) return "usdt";
    return ticker === "USDT Tether" ? "usdt" : ticker.toLowerCase();
  };

const normalizePaymentStatus = (status?: string) =>
  (status || "").toString().trim().toLowerCase();

const isApprovedPaymentStatus = (status?: string) =>
  ["approved", "verified"].includes(normalizePaymentStatus(status));

const isFrozenPaymentStatus = (status?: string) => {
  const normalized = normalizePaymentStatus(status);
  return (
    normalized.includes("frozen") ||
    normalized.includes("freeze") ||
    normalized.includes("blocked") ||
    normalized.includes("suspend") ||
    normalized.includes("disabled")
  );
};

const getPaymentRestrictionMessage = (status?: string) =>
  isFrozenPaymentStatus(status)
    ? "This account is frozen. Please contact Customer Support."
    : "Selected payment method is pending verification";

  const validationCurrency = selectedAsset ? getValidationCurrency(selectedAsset) : undefined;
  const validationNetwork = selectedAsset
    ? String(getAssetNetwork(selectedAsset) || "bsc").toLowerCase()
    : undefined;
  const bookmarkAsset = String(
    selectedAsset?.ticker || selectedAsset?.symbol || selectedAsset?.name || "USDT"
  )
    .trim()
    .toUpperCase();
  const bookmarkNetwork = String(getAssetNetwork(selectedAsset) || "BSC")
    .trim()
    .toUpperCase();
  const {
    bookmarks,
    loading: bookmarksLoading,
    saving: bookmarkSaving,
    fetchBookmarks,
    saveBookmark,
    saveBookmarkError,
    clearSaveBookmarkError,
  } = useBookmarkedAddresses(bookmarkAsset, bookmarkNetwork);

  /** FX Primus: same as express deposit — no crypto wallet address on this step */
  const isRatesFxpDeposit =
    isDepositMode && !!selectedAsset && isForexPrimusAsset(selectedAsset);
  /** FX Primus withdrawal: same as express withdrawal — ForexWithdrawal + forex create-exchange + forex-status WS (not createExpressWithdrawal / Exchanging). */
  const isRatesFxpWithdrawal =
    !isDepositMode && !!selectedAsset && isForexPrimusAsset(selectedAsset);
  const getFxpReverseAmount = (receiveValue: number): number => {
    if (!Number.isFinite(receiveValue)) return 0;
    const backendFromAmount = Number(apiCommissionDetails?.from_amount);
    const backendToAmount = Number(apiCommissionDetails?.to_amount);
    if (
      Number.isFinite(backendFromAmount) &&
      Number.isFinite(backendToAmount) &&
      backendFromAmount > 0 &&
      backendToAmount > 0
    ) {
      return receiveValue * (backendFromAmount / backendToAmount);
    }
    const feeFromPayload = Number(apiCommissionDetails?.calculated_fee ?? apiCommissionDetails?.fee);
    if (Number.isFinite(feeFromPayload) && feeFromPayload >= 0) {
      return receiveValue + feeFromPayload;
    }
    const mode = (apiCommissionDetails?.commission_mode || "").toString().toLowerCase();
    const isPercentageFlag = apiCommissionDetails?.is_percentage;
    const treatAsFlatFee = mode === "flat_fee" || isPercentageFlag === false;
    if (treatAsFlatFee) {
      return receiveValue;
    }
    const rate = Number(apiCommissionDetails?.commission_rate ?? apiCommission ?? 0);
    if (Number.isFinite(rate) && rate > 0 && rate < 100) {
      return receiveValue / (1 - rate / 100);
    }
    return receiveValue;
  };

  const sanitizeNumericInput = (raw: string): string => {
    if (!raw) return "";
    const compact = raw
      .replace(/,/g, "")
      .replace(/\s+/g, "")
      .replace(/[^\d.]/g, "");
    if (!compact) return "";
    const firstDot = compact.indexOf(".");
    let result: string;
    if (firstDot === -1) result = compact;
    else {
      const intPart = compact.slice(0, firstDot + 1);
      const fracPart = compact.slice(firstDot + 1).replace(/\./g, "");
      result = `${intPart}${fracPart}`;
    }
    return stripLeadingZerosFromDecimalInput(result);
  };

  const applyReceiveAmountInput = (rawValue: string) => {
    const normalizedValue = sanitizeNumericInput(rawValue);
    logger.debug('general', "You Get input changed:", {
      rawValue,
      normalizedValue,
      selectedAsset: selectedAsset?.ticker,
    });

    if (normalizedValue === "" || /^\d*\.?\d*$/.test(normalizedValue)) {
      setReceiveAmount(normalizedValue);
      if (normalizedValue === "") {
        setAmount("");
        setReceiveAmountError(null);
        setIsCalculating(false);
        setIsCalculatingReceive(false);
        return;
      }
      const newAmount = parseFloat(normalizedValue) || 0;
      setIsCalculatingFromPay(false);

      // Force FX Primus reverse path first (paste + typing).
      // This avoids any branch skips from generic asset guards.
      if (selectedAsset && newAmount > 0 && isForexPrimusAsset(selectedAsset)) {
        const apiAsset = resolveCommissionApiAsset(selectedAsset) || "fxprimus";
        setIsCalculating(true);
        setIsCalculatingReceive(true);
        console.log("[Rates FXP reverse] force request commission", {
          apiAsset,
          amount: newAmount,
          mode: isDepositMode ? "deposit" : "withdrawal",
          assetId: (selectedAsset as any)?.asset_id,
          selectedAsset,
        });
        fetchCommissionDetails(
          apiAsset,
          newAmount,
          isDepositMode ? "deposit" : "withdrawal",
          (selectedAsset as any)?.asset_id
        )
          .then((details) => {
            setApiCommission(Number(details?.commission_rate ?? 0));
            setApiCommissionDetails(details);
            const backendToAmount = Number(details?.to_amount);
            const backendFromAmount = Number(details?.from_amount);
            if (
              Number.isFinite(backendFromAmount) &&
              Number.isFinite(backendToAmount) &&
              backendToAmount > 0
            ) {
              const normalizedFromAmount =
                newAmount * (backendFromAmount / backendToAmount);
              setAmount(Math.max(0, normalizedFromAmount).toFixed(2));
            } else if (Number.isFinite(backendFromAmount)) {
              setAmount(Math.max(0, backendFromAmount).toFixed(2));
            } else {
              setAmount(Math.max(0, getFxpReverseAmount(newAmount)).toFixed(2));
            }
          })
          .catch(() => {
            setAmount(Math.max(0, getFxpReverseAmount(newAmount)).toFixed(2));
          })
          .finally(() => {
            setIsCalculating(false);
            setIsCalculatingReceive(false);
          });
        return;
      }

      if (
        selectedAsset &&
        newAmount > 0 &&
        isExchangeCommissionLookupAsset(selectedAsset)
      ) {
        setIsCalculating(true);
        setIsCalculatingReceive(true);
      } else if (
        selectedAsset &&
        newAmount > 0 &&
        usesLegacyPercentCommission(selectedAsset)
      ) {
        const calculatedSendAmount = isForexPrimusAsset(selectedAsset)
          ? getFxpReverseAmount(newAmount)
          : newAmount / (1 - (apiCommission ?? 2) / 100);
        setAmount(calculatedSendAmount.toFixed(2));
        setIsCalculating(false);
        setIsCalculatingReceive(false);
      } else if (selectedAsset && newAmount > 0) {
        setIsCalculating(true);
        setIsCalculatingReceive(true);
      } else {
        setIsCalculatingReceive(false);
        setIsCalculating(false);
      }
    }
  };

  // Shared address validation (same API + messages as other pages).
  const {
    result: addressValidationResult,
    isValidating: isAddressValidating,
    error: addressValidationError,
    validate: validateAddress,
    reset: resetAddressValidation,
  } = useValidateAddress({
    currency: validationCurrency,
    network: validationNetwork,
    debounceMs: 500,
    minLength: 0, // Let API handle real validation
    validateEmpty: false,
  });

  // Mirror hook state into existing local UI state.
  useEffect(() => {
    setIsWalletValidating(isAddressValidating);
  }, [isAddressValidating]);

  useEffect(() => {
    if (isRatesFxpDeposit || isRatesFxpWithdrawal) {
      setWalletError("");
      resetAddressValidation();
      return;
    }
    const trimmed = walletAddress.trim();
    if (!trimmed) {
      setWalletError("");
      return;
    }

    if (isAddressValidating) return;

    if (addressValidationResult) {
      setWalletError(
        addressValidationResult.isValid
          ? ""
          : addressValidationResult.message ||
              addressValidationResult.error ||
              "Invalid wallet/account address"
      );
    } else if (addressValidationError) {
      setWalletError(addressValidationError);
    }
  }, [
    addressValidationResult,
    addressValidationError,
    isAddressValidating,
    walletAddress,
    isRatesFxpDeposit,
    isRatesFxpWithdrawal,
    resetAddressValidation,
  ]);

  // Reset + re-validate when asset/network changes.
  useEffect(() => {
    if (isRatesFxpDeposit || isRatesFxpWithdrawal) return;
    const trimmed = walletAddress.trim();
    if (!trimmed) return;
    if (!validationCurrency) return;
    resetAddressValidation();
    void validateAddress(trimmed, validationCurrency, validationNetwork);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validationCurrency, validationNetwork, isRatesFxpDeposit, isRatesFxpWithdrawal]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setWalletAddress(text);
        const trimmed = text.trim();
        if (trimmed && validationCurrency) {
          void validateAddress(trimmed, validationCurrency, validationNetwork);
        } else {
          setWalletError("");
          resetAddressValidation();
        }
        setIsPasted(true);
        setTimeout(() => setIsPasted(false), 2000);
      }
    } catch (err) {
      console.error("Paste failed", err);
    }
  };
  const hasRestoredState = useRef(false);

  // API calculation states
  const [estimate, setEstimate] = useState<any>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [apiValidationError, setApiValidationError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCalculatingReceive, setIsCalculatingReceive] = useState(false);
  const [isCalculatingFromPay, setIsCalculatingFromPay] = useState(true);
  const [receiveAmountError, setReceiveAmountError] = useState<string | null>(
    null
  );
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const otcThresholdExceededRef = useRef(false);

  // Debounce and cache for faster, fewer API calls (separate refs so forward/reverse effects never cancel each other's timeout)
  const estimateForwardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const estimateReverseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [apiCommission, setApiCommission] = useState<number | null>(null);
  const [apiCommissionDetails, setApiCommissionDetails] =
    useState<CommissionLookupResponse | null>(null);
  const commissionFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [exchangeLookupResponse, setExchangeLookupResponse] = useState<ExchangeCommissionLookupResponse | null>(null);
  const exchangeLookupFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [estimateCache, setEstimateCache] = useState<
    Map<string, { data: any; timestamp: number }>
  >(new Map());
  const ESTIMATE_CACHE_MS = 2 * 60 * 1000; // 2 min cache
  const ESTIMATE_DEBOUNCE_MS = 350; // Wait 350ms after last keystroke


  const dispatch = useDispatch<AppDispatch>();

  // Use the same public supported-tokens list as Home so Rates shows
  // the full asset dropdown (USDC, FXPRIMUS, etc.).
  const {
    assets: homeAssets,
    loading: homeAssetsLoading,
    error: homeAssetsError,
  } = useChangeNowAssets(true, {
    feature: "exchange",
    source: "public",
  });

  const assetsDisplay = useAssetsDisplay(
    homeAssets,
    [],
    homeAssetsLoading,
    false,
    homeAssetsError,
    null
  );



  const {
    userPaymentDetails,
    userDetailsLoading,
    userDetailsError,
    publicPaymentMethods,
    publicMethodsLoading,
    publicMethodsError
  } = useSelector((state: RootState) => state.paymentMethods);

  const { adminPaymentDetails, adminWalletList, loading: paymentLoading, error: paymentError } = useSelector(
    (state: RootState) => (state as any).payment || {}
  );
  const { userPaymentDetails: userPaymentDetailsFromPayment } = useSelector(
    (state: RootState) => (state as any).payment || {}
  );
  const effectiveUserPaymentDetailsFromRedux =
    (userPaymentDetailsFromPayment?.length > 0 ? userPaymentDetailsFromPayment : userPaymentDetails) || [];
  // Match dashboard withdrawal source priority: prefer payment slice first.
  const rawUserDetails = userPaymentDetailsFromPayment ?? userPaymentDetails;
  const effectiveUserPaymentDetails = (() => {
    if (Array.isArray(rawUserDetails) && rawUserDetails.length > 0) return rawUserDetails;
    if (Array.isArray((rawUserDetails as any)?.data)) return (rawUserDetails as any).data;
    if (Array.isArray((rawUserDetails as any)?.results)) return (rawUserDetails as any).results;
    return Array.isArray(rawUserDetails) ? rawUserDetails : [];
  })();

  const [forexWhitelistOpen, setForexWhitelistOpen] = useState(false);
  const forexWhitelistAnchorRef = useRef<HTMLButtonElement | null>(null);
  const forexWhitelistDropdownRef = useRef<HTMLDivElement | null>(null);

  const approvedForexPaymentMethods = useMemo(() => {
    const list = Array.isArray(effectiveUserPaymentDetails)
      ? effectiveUserPaymentDetails
      : [];
    return list.filter((d: any) => {
      if (!isApprovedPaymentStatus(d?.status)) return false;
      const method = String(
        d?.payment_method_name || d?.payment_method || d?.payment_method_type || ""
      ).toLowerCase();
      const provider = String(
        d?.provider_name || d?.payment_provider_name || d?.provider || ""
      ).toLowerCase();
      return (
        method.includes("forex") ||
        method.includes("fxp") ||
        method.includes("fxprimus") ||
        provider.includes("fxp") ||
        provider.includes("fxprimus") ||
        provider.includes("forex")
      );
    });
  }, [effectiveUserPaymentDetails]);

  useEffect(() => {
    if (!forexWhitelistOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (forexWhitelistAnchorRef.current?.contains(target)) return;
      if (forexWhitelistDropdownRef.current?.contains(target)) return;
      setForexWhitelistOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [forexWhitelistOpen]);

  const paymentMethodsRef = useRef<any[]>([]);
  const userPaymentMethodsRef = useRef<any[]>([]);
  const walletListRef = useRef<any[]>([]);

  const adminWalletListDisplayData = useMemo(() => {
    if (!adminWalletList || adminWalletList.length === 0) return [];
    return adminWalletList.filter((wallet: any) => {
      const paymentDetail = wallet?.admin_payment_detail;
      if (!paymentDetail) return false;
      if (paymentDetail.is_active === undefined || paymentDetail.is_active === null) return true;
      return paymentDetail.is_active === true || paymentDetail.is_active === "true" || paymentDetail.is_active === 1 || paymentDetail.is_active === "1";
    });
  }, [adminWalletList]);

  useEffect(() => {
    if (adminWalletListDisplayData.length > 0) walletListRef.current = adminWalletListDisplayData;
  }, [adminWalletListDisplayData]);

  useEffect(() => {
    if (effectiveUserPaymentDetails.length > 0) userPaymentMethodsRef.current = effectiveUserPaymentDetails;
  }, [effectiveUserPaymentDetails, userDetailsLoading]);

  const adminWalletListDisplay = {
    displayData: adminWalletListDisplayData,
    isLoading: paymentLoading && (!adminWalletList || adminWalletList.length === 0),
    hasData: adminWalletListDisplayData.length > 0,
  };

  const userPaymentMethodsDisplay = usePaymentMethodsDisplay(
    effectiveUserPaymentDetails,
    userDetailsLoading,
    null
  );

  const effectiveUserPaymentMethods = userPaymentMethodsRef.current;
  const fallbackProviderNames = ["Bank", "Crypto", "Forex", "Mobile", "Marchant"];
  const [directPublicPaymentMethods, setDirectPublicPaymentMethods] = useState<any>(null);

  const assetDropdownRef = useRef<HTMLDivElement>(null);
  const assetDropdownContentRef = useRef<HTMLDivElement | null>(null);  // dropdown panel

  const methodDropdownRef = useRef<HTMLDivElement>(null);
  const methodDropdownContentRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    // Fetch user payment details
    dispatch(fetchUserPaymentDetails());

    // Fetch public payment methods — served from 5-min in-memory cache after first load;
    // no separate raw fetch needed.
    dispatch(fetchPublicPaymentMethods());

    // Fetch admin wallet list for fallback (like express withdrawal)
    if (isAuthenticated) {
      dispatch(fetchAdminWalletList());
      dispatch(fetchAdminPaymentDetails());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    // Don't auto-select if we're trying to restore a saved asset
    // Also add a delay to ensure restore happens first
    const hasSavedAsset = localStorage.getItem("rates_calculator_state") || localStorage.getItem("rates_calculator_asset");

    // Use a timeout to ensure restore useEffect runs first
    const timeoutId = setTimeout(() => {
      // Double-check that restoration hasn't happened
      const stillHasSavedAsset = localStorage.getItem("rates_calculator_asset");

      if (
        assetsDisplay.displayData &&
        assetsDisplay.displayData.length > 0 &&
        !selectedAsset &&
        !hasSavedAsset &&
        !stillHasSavedAsset // Only auto-select if there's no saved asset to restore
      ) {
        // Use the sorted assets to get the first one (USDT on BSC first, USDC on BSC second)
        const sortedAssets = [...assetsDisplay.displayData].sort((a, b) => {
          const tickerA = (a?.ticker || a?.symbol || a?.name || "")
            .toString()
            .toLowerCase();
          const tickerB = (b?.ticker || b?.symbol || b?.name || "")
            .toString()
            .toLowerCase();
          const networkA = (a?.network || "").toString().toLowerCase();
          const networkB = (b?.network || "").toString().toLowerCase();

          // Priority 1: USDT on BSC
          if (
            tickerA === "usdt" &&
            networkA === "bsc" &&
            !(tickerB === "usdt" && networkB === "bsc")
          ) {
            return -1;
          }
          if (
            tickerB === "usdt" &&
            networkB === "bsc" &&
            !(tickerA === "usdt" && networkA === "bsc")
          ) {
            return 1;
          }

          // Priority 2: USDC on BSC
          if (
            tickerA === "usdc" &&
            networkA === "bsc" &&
            !(tickerB === "usdc" && networkB === "bsc")
          ) {
            return -1;
          }
          if (
            tickerB === "usdc" &&
            networkB === "bsc" &&
            !(tickerA === "usdc" && networkA === "bsc")
          ) {
            return 1;
          }

          return 0;
        });

        const firstAsset = sortedAssets[0];
        setSelectedAsset(firstAsset);
      }
    }, 100); // Small delay to let restore happen first

    return () => clearTimeout(timeoutId);
  }, [assetsDisplay.displayData, selectedAsset]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        assetDropdownRef.current &&
        !assetDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAssetDropdownOpen(false);
      }
      if (
        methodDropdownRef.current &&
        !methodDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMethodDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isAssetDropdownOpen && !isMethodDropdownOpen) return;

    const handleScroll = (event: Event) => {
      const target = event.target as Node | null;
      if (!target) return;

      // ---- ASSET DROPDOWN ----
      if (isAssetDropdownOpen) {
        if (
          assetDropdownContentRef.current?.contains(target) ||
          assetDropdownRef.current?.contains(target)
        ) {
          return;
        }
        setIsAssetDropdownOpen(false);
      }

      // ---- PAYMENT METHOD DROPDOWN ----
      if (isMethodDropdownOpen) {
        if (
          methodDropdownContentRef.current?.contains(target) ||
          methodDropdownRef.current?.contains(target)
        ) {
          return;
        }
        setIsMethodDropdownOpen(false);
      }
    };

    // capture phase is required
    window.addEventListener("scroll", handleScroll, true);
    document.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [isAssetDropdownOpen, isMethodDropdownOpen]);

  // Drive commission APIs from the field the user is editing only. Including both amount and receiveAmount
  // caused a second identical exchange-lookup after setReceiveAmount(from to_amount).
  const commissionApiDriverKey = `${isDepositMode ? "dep" : "wd"}:${isCalculatingFromPay ? "pay" : "recv"}:${isCalculatingFromPay ? amount : receiveAmount}`;

  // Legacy commission % API — crypto exchange-lookup assets skip this; FX Primus uses it (no FOREX commission-lookup).
  useEffect(() => {
    const apiAsset = selectedAsset ? resolveCommissionApiAsset(selectedAsset) : null;
    if (!apiAsset || !selectedAsset) {
      setApiCommission(null);
      return;
    }
    // Crypto USDT/USDC (etc.) use exchange-lookup; FX Primus uses direct commission API only (same as home).
    if (
      isExchangeCommissionLookupAsset(selectedAsset) &&
      !isForexPrimusAsset(selectedAsset)
    ) {
      setApiCommission(null);
      setApiCommissionDetails(null);
      return;
    }
    const amt = isCalculatingFromPay ? (parseFloat(amount) || 0) : (parseFloat(receiveAmount) || 0);
    const fxpSendAmount = isCalculatingFromPay
      ? (parseFloat(amount) || 0)
      : (parseFloat(receiveAmount) || 0);
    const commissionLookupAmount = isForexPrimusAsset(selectedAsset)
      ? fxpSendAmount
      : amt;
    if (amt <= 0) {
      setApiCommission(null);
      setApiCommissionDetails(null);
      return;
    }
    if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
    commissionFetchTimeoutRef.current = setTimeout(() => {
      fetchCommissionDetails(
        apiAsset,
        commissionLookupAmount,
        isDepositMode ? "deposit" : "withdrawal",
        isForexPrimusAsset(selectedAsset) ? (selectedAsset as any)?.asset_id : undefined
      )
        .then((details) => {
          setApiCommission(Number(details?.commission_rate ?? 0));
          setApiCommissionDetails(details);
          if (isForexPrimusAsset(selectedAsset)) {
            const backendToAmount = Number(details?.to_amount);
            const backendFromAmount = Number(details?.from_amount);
            if (isCalculatingFromPay && Number.isFinite(backendToAmount)) {
              setReceiveAmount(String(Math.max(0, backendToAmount)));
            } else if (!isCalculatingFromPay && Number.isFinite(backendFromAmount)) {
              const requestedReceive = parseFloat(receiveAmount) || 0;
              // Normalize reverse calc to the exact requested "You Get" amount using backend ratio.
              if (
                requestedReceive > 0 &&
                Number.isFinite(backendToAmount) &&
                backendToAmount > 0
              ) {
                const normalizedFromAmount =
                  requestedReceive * (backendFromAmount / backendToAmount);
                setAmount(String(Math.max(0, normalizedFromAmount)));
              } else {
                setAmount(String(Math.max(0, backendFromAmount)));
              }
            }
          }
        })
        .catch((error: any) => {
          const responseData = error?.response?.data;
          const rawMessage =
            responseData?.error ||
            responseData?.message ||
            error?.message;
          const backendMessage =
            typeof rawMessage === "string"
              ? rawMessage
              : Array.isArray(rawMessage)
                ? rawMessage[0]
                : rawMessage && typeof rawMessage === "object"
                  ? JSON.stringify(rawMessage)
                  : null;
          const normalizedMessage = String(
            backendMessage || "Failed to fetch exchange rate"
          );

          if (isForexPrimusAsset(selectedAsset)) {
            // FXP: on any commission API error, keep user-entered amount and mirror it to the other field.
            setApiValidationError(null);
            if (isCalculatingFromPay) {
              setReceiveAmount(amount || "0");
            } else {
              setAmount(receiveAmount || "0");
            }
            setApiCommission(0);
            setApiCommissionDetails(null);
            setIsCalculating(false);
            setIsCalculatingReceive(false);
            return;
          }

          setApiCommission(null);
          setApiCommissionDetails(null);
          if (
            typeof backendMessage === "string" &&
            isAxiosGenericStatusMessage(backendMessage)
          ) {
            setApiValidationError(swapEstimateUnavailable());
          }
        });
    }, 300);
    return () => {
      if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
    };
  }, [selectedAsset, commissionApiDriverKey, isCalculatingFromPay, isDepositMode]);

  // Exchange commission-lookup for crypto→USD assets (local_commission). FX Primus uses commission API only.
  useEffect(() => {
    if (!selectedAsset) {
      setExchangeLookupResponse(null);
      return;
    }

    if (!isExchangeCommissionLookupAsset(selectedAsset)) {
      setExchangeLookupResponse(null);
      return;
    }

    if (isForexPrimusAsset(selectedAsset)) {
      setExchangeLookupResponse(null);
      return;
    }

    const params = getExchangeLookupParams(selectedAsset);
    const amt = isCalculatingFromPay ? (parseFloat(amount) || 0) : (parseFloat(receiveAmount) || 0);
    if (!params || amt <= 0) {
      setExchangeLookupResponse(null);
      return;
    }

    const lookupAmountRaw = isCalculatingFromPay ? amount : receiveAmount;
    if (isAmountStringTooLargeForSafeCalculation(lookupAmountRaw)) {
      setExchangeLookupResponse(null);
      setApiCommission(null);
      setApiValidationError(amountTooLargeInput());
      setReceiveAmount("0");
      setIsCalculating(false);
      setIsCalculatingReceive(false);
      return;
    }

    if (exchangeLookupFetchTimeoutRef.current) clearTimeout(exchangeLookupFetchTimeoutRef.current);
    exchangeLookupFetchTimeoutRef.current = setTimeout(() => {
      fetchExchangeCommissionLookup(
        amt,
        isDepositMode ? "deposit" : "withdrawal",
        params.from_currency,
        "USD",
        params.from_network,
        params.from_asset_id
      )
        .then((res) => {
          setExchangeLookupResponse(res);
          setApiCommission(null);
          setApiValidationError(null);

          // When calculating from "You Send", backend gives us to_amount directly.
          if (isCalculatingFromPay && res.to_amount != null) {
            const rawToAmount = parseFloat(String(res.to_amount));
            if (Number.isFinite(rawToAmount) && rawToAmount < 0) {
              setApiValidationError(buildNegativeReceiveError(rawToAmount));
              setReceiveAmount("0");
            } else {
              const toAmount = toNonNegativeAmount(res.to_amount);
              setApiValidationError(null);
              setReceiveAmount(toAmount.toFixed(2));
            }
          }
          setIsCalculating(false);
          setIsCalculatingReceive(false);
        })
        .catch((error: any) => {
          setExchangeLookupResponse(null);

          let errorMessage = "";
          let errorDetails = "";
          const responseData = error?.response?.data;
          const responseInner = responseData?.response_data;
          const rawMessage =
            responseData?.error ||
            responseData?.message ||
            responseInner?.error ||
            responseInner?.message ||
            error?.message;

          if (typeof rawMessage === "string") errorMessage = rawMessage;
          if (typeof responseData?.payload === "object") {
            errorDetails = responseData?.payload?.range?.minAmount ? String(responseData.payload.range.minAmount) : "";
          }

          if (errorMessage.includes("Exchange service error:")) {
            errorMessage = errorMessage.replace("Exchange service error: ", "");
          }

          if (errorMessage.includes("deposit_too_small") || errorDetails.includes("Out of min amount")) {
            setApiValidationError(
              `Amount entered is too small. Minimum amount is ${Number(
                EXPRESS_FIXED_MIN_AMOUNT
              ).toFixed(8)}.`
            );
            setReceiveAmount("0");
            return;
          }

          if (errorMessage.includes("deposit_too_large") || errorDetails.includes("Out of max amount")) {
            const maxAmount = responseInner?.payload?.range?.maxAmount ?? responseData?.payload?.range?.maxAmount;
            setApiValidationError(
              maxAmount
                ? `Amount entered is too large. Maximum amount is ${Number(maxAmount).toFixed(8)}.`
                : "Amount entered is too large. Please enter a smaller amount."
            );
            setReceiveAmount("0");
            return;
          }

          setApiValidationError(
            (() => {
              const trimmed = (errorMessage || "").trim();
              if (trimmed && !isAxiosGenericStatusMessage(trimmed)) return trimmed;
              return swapEstimateUnavailable();
            })()
          );
          setIsCalculating(false);
          setIsCalculatingReceive(false);
        });
    }, 300);

    return () => {
      if (exchangeLookupFetchTimeoutRef.current) clearTimeout(exchangeLookupFetchTimeoutRef.current);
    };
  }, [selectedAsset, commissionApiDriverKey, isCalculatingFromPay, isDepositMode]);

  // Apply local_commission when calculating from "You Get" (reverse direction)
  useEffect(() => {
    const parseCommissionRule = () => {
      const local = exchangeLookupResponse?.local_commission as any;
      if (local?.commission_mode) {
        return {
          commission_mode: local.commission_mode as "flat_fee" | "percentage",
          rate: local.rate,
          fee: local.fee,
        };
      }
      const crypto = exchangeLookupResponse?.crypto_commission as any;
      if (crypto?.commission_mode) {
        return {
          commission_mode: crypto.commission_mode as "flat_fee" | "percentage",
          rate: crypto.rate,
          fee: crypto.fee,
        };
      }
      return null;
    };

    if (!selectedAsset) return;
    if (!isExchangeCommissionLookupAsset(selectedAsset)) return;
    if (isCalculatingFromPay) return;

    const recv = parseFloat(receiveAmount) || 0;
    if (recv <= 0) return;

    const lc = parseCommissionRule();
    if (!lc) return;
    const fee = lc.fee != null ? parseFloat(lc.fee) : NaN;
    if (!Number.isNaN(fee)) {
      setAmount((recv + fee).toFixed(2));
    } else if (lc.commission_mode === "percentage" && lc.rate != null) {
      const rate = parseFloat(lc.rate);
      if (!Number.isNaN(rate) && rate < 100) {
        const calculatedPayAmount = recv / (1 - rate / 100);
        setAmount(calculatedPayAmount.toFixed(2));
      }
    }
  }, [exchangeLookupResponse, selectedAsset, isCalculatingFromPay, receiveAmount]);

  // Recalculate receive/send when apiCommission arrives (legacy % — incl. FX Primus, not crypto exchange-lookup)
  useEffect(() => {
    if (
      !selectedAsset ||
      (isExchangeCommissionLookupAsset(selectedAsset) &&
        !isForexPrimusAsset(selectedAsset))
    )
      return;
    if (!usesLegacyPercentCommission(selectedAsset) || apiCommission === null) return;
    if (isCalculatingFromPay && parseFloat(amount) > 0) {
      if (isForexPrimusAsset(selectedAsset)) {
        const backendToAmount = Number(apiCommissionDetails?.to_amount);
        if (Number.isFinite(backendToAmount)) {
          setReceiveAmount(Math.max(0, backendToAmount).toFixed(2));
          return;
        }
      }
      const amt = parseFloat(amount) || 0;
      const calculatedReceive = Math.max(0, amt * (1 - apiCommission / 100));
      setReceiveAmount(calculatedReceive.toFixed(2));
    } else if (!isCalculatingFromPay && parseFloat(receiveAmount) > 0) {
      const recv = parseFloat(receiveAmount) || 0;
      const calculatedAmount = isForexPrimusAsset(selectedAsset)
        ? (() => {
            const backendFromAmount = Number(apiCommissionDetails?.from_amount);
            const backendToAmount = Number(apiCommissionDetails?.to_amount);
            if (
              Number.isFinite(backendFromAmount) &&
              Number.isFinite(backendToAmount) &&
              backendFromAmount > 0 &&
              backendToAmount > 0
            ) {
              return recv * (backendFromAmount / backendToAmount);
            }
            if (Number.isFinite(backendFromAmount) && backendFromAmount > 0) {
              return backendFromAmount;
            }
            return getFxpReverseAmount(recv);
          })()
        : recv / (1 - apiCommission / 100);
      setAmount(calculatedAmount.toFixed(2));
    }
  }, [apiCommission, apiCommissionDetails, selectedAsset, isCalculatingFromPay, amount, receiveAmount]);

  // Fetch estimate for non-direct assets - debounced + cached for faster response
  useEffect(() => {
    if (estimateForwardTimeoutRef.current) {
      clearTimeout(estimateForwardTimeoutRef.current);
      estimateForwardTimeoutRef.current = null;
    }

    if (
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset) &&
      !isExchangeCommissionLookupAsset(selectedAsset) &&
      !isForexPrimusAsset(selectedAsset) &&
      parseFloat(amount) > 0 &&
      isCalculatingFromPay
    ) {
      if (isAmountStringTooLargeForSafeCalculation(amount)) {
        setEstimate(null);
        setEstimateError(null);
        setEstimateLoading(false);
        setIsCalculating(false);
        setIsCalculatingReceive(false);
        setApiValidationError(amountTooLargeInput());
        setReceiveAmount("0");
        return;
      }
      const isWithdrawal = !isDepositMode;
      const cacheKey = `fwd_${selectedAsset.ticker}_${getAssetNetwork(selectedAsset)}_${amount}_${isWithdrawal}`;
      const cached = estimateCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < ESTIMATE_CACHE_MS) {
        setEstimate(cached.data);
        setEstimateLoading(false);
        setIsCalculating(false);
        setIsCalculatingReceive(false);
        return;
      }

      setEstimateLoading(true);
      setEstimateError(null);
      setApiValidationError(null);

      estimateForwardTimeoutRef.current = setTimeout(() => {
        estimateForwardTimeoutRef.current = null;
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timeout")), 15000);
        });

        const params = isWithdrawal
          ? {
              fromCurrency: selectedAsset.ticker,
              fromNetwork: getAssetNetwork(selectedAsset),
              toCurrency: "USDT",
              toNetwork: "BSC",
              amount: parseFloat(amount),
              usePublicApi: !isAuthenticated,
            }
          : {
              fromCurrency: "USDT",
              fromNetwork: "BSC",
              toCurrency: selectedAsset.ticker,
              toNetwork: getAssetNetwork(selectedAsset),
              amount: parseFloat(amount),
              usePublicApi: !isAuthenticated,
            };

        Promise.race([dispatch(fetchSwapEstimate(params)), timeoutPromise])
          .then((result: any) => {
            if (result?.meta?.requestStatus === "rejected") {
              const p = result?.payload as any;
              const rd =
                p?.response_data ??
                p?.response?.data?.response_data ??
                p?.response?.data;
              let raw =
                (typeof rd?.message === "string" && rd.message.trim())
                  ? rd.message.trim()
                  : (typeof p?.message === "string" && p.message.trim())
                    ? p.message.trim()
                    : (typeof rd?.error === "string" && rd.error.trim())
                      ? rd.error.trim()
                      : "";
              if (isAxiosGenericStatusMessage(raw)) raw = "";
              const message = raw || swapEstimateUnavailable();
              setApiValidationError(message);
              setEstimateError(null);
              setReceiveAmount("0");
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              setEstimateLoading(false);
              return;
            }
            if (result.payload) {
              setEstimate(result.payload);
              setEstimateCache((prev) =>
                new Map(prev).set(cacheKey, {
                  data: result.payload,
                  timestamp: Date.now(),
                })
              );
            }
            setIsCalculating(false);
            setIsCalculatingReceive(false);
          })
          .catch((error) => {
            console.error("Failed to fetch swap estimate:", error);

            let errorMessage = "";
            let errorDetails = "";

            if ((error as any)?.response_data?.error) {
              errorMessage = (error as any).response_data.error;
              errorDetails = (error as any).response_data.message || "";
            } else if ((error as any)?.error && typeof (error as any).error === "string") {
              errorMessage = (error as any).error;
              errorDetails = (error as any).message || "";
            } else if ((error as any)?.message) {
              errorMessage = (error as any).message;
            }

            if (errorMessage.includes("Exchange service error:")) {
              errorMessage = errorMessage.replace("Exchange service error: ", "");
            }

            const amountErrorsFromRoot =
              (Array.isArray((error as any)?.error?.amount) && (error as any).error.amount) ||
              (Array.isArray((error as any)?.response_data?.error?.amount) &&
                (error as any).response_data.error.amount);

            if (amountErrorsFromRoot && amountErrorsFromRoot.length > 0) {
              const firstMessage = String(amountErrorsFromRoot[0]);
              setApiValidationError(firstMessage);
              setEstimateError(null);
              setReceiveAmount("0");
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              setEstimateLoading(false);
              return;
            }

            if (
              errorMessage.includes("deposit_too_small") ||
              errorDetails.includes("Out of min amount")
            ) {
              const text = `Amount entered is too small. Minimum amount is ${Number(
                EXPRESS_FIXED_MIN_AMOUNT
              ).toFixed(8)}.`;
              setApiValidationError(text);
              setEstimateError(null);
              setReceiveAmount("0");
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              setEstimateLoading(false);
              return;
            }

            if (
              errorMessage.includes("deposit_too_large") ||
              errorDetails.includes("Out of max amount")
            ) {
              const maxAmount =
                (error as any)?.response_data?.payload?.range?.maxAmount;
              const text = maxAmount
                ? `Amount entered is too large. Maximum amount is ${Number(
                    maxAmount
                  ).toFixed(8)}.`
                : "Amount entered is too large. Please enter a smaller amount.";
              setApiValidationError(text);
              setEstimateError(null);
              setReceiveAmount("0");
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              setEstimateLoading(false);
              return;
            }

            // Any other backend error (e.g. not_valid_params): show message and stop.
            const genericText = mapSwapEstimateFailureText(error, errorDetails, errorMessage);
            setApiValidationError(genericText);
            setEstimateError(null);
            setReceiveAmount("0");
            setIsCalculating(false);
            setIsCalculatingReceive(false);
            setEstimateLoading(false);
            return;

            setEstimateError("Using fallback calculation");
            const commissionRate =
              selectedAsset && isCommissionApiAsset(selectedAsset)
                ? apiCommission ?? 2
                : (() => {
                    const rate = selectedAsset?.range_commissions?.[0]?.commission
                      ? parseFloat(selectedAsset.range_commissions[0].commission)
                      : 2;
                    return rate;
                  })();
            const commissionAmount = (parseFloat(amount) * commissionRate) / 100;
            const rawReceive = parseFloat(amount) - commissionAmount;
            if (Number.isFinite(rawReceive) && rawReceive < 0) {
              setApiValidationError(buildNegativeReceiveError(rawReceive));
            } else {
              setApiValidationError(null);
            }
            const safeReceive = toNonNegativeAmount(rawReceive);
            setReceiveAmount(safeReceive.toFixed(2));
            setIsCalculating(false);
            setIsCalculatingReceive(false);
          })
          .finally(() => {
            setEstimateLoading(false);
          });
      }, ESTIMATE_DEBOUNCE_MS);
    } else {
      setEstimate(null);
      setEstimateError(null);
      setEstimateLoading(false);
      setIsCalculating(false);
      setIsCalculatingReceive(false);
    }

    return () => {
      if (estimateForwardTimeoutRef.current) {
        clearTimeout(estimateForwardTimeoutRef.current);
      }
    };
  }, [selectedAsset, amount, isCalculatingFromPay, isDepositMode]);

  // Fetch reverse estimate - debounced + cached
  useEffect(() => {
    if (estimateReverseTimeoutRef.current) {
      clearTimeout(estimateReverseTimeoutRef.current);
      estimateReverseTimeoutRef.current = null;
    }

    if (
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset) &&
      !isExchangeCommissionLookupAsset(selectedAsset) &&
      !isForexPrimusAsset(selectedAsset) &&
      parseFloat(receiveAmount) > 0 &&
      !isCalculatingFromPay
    ) {
      if (isAmountStringTooLargeForSafeCalculation(receiveAmount)) {
        setEstimate(null);
        setEstimateError(null);
        setEstimateLoading(false);
        setIsCalculating(false);
        setIsCalculatingReceive(false);
        setApiValidationError(amountTooLargeInput());
        setAmount("0");
        return;
      }
      const isWithdrawal = !isDepositMode;
      const cacheKey = `rev_${selectedAsset.ticker}_${getAssetNetwork(selectedAsset)}_${receiveAmount}_${isWithdrawal}`;
      const cached = estimateCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < ESTIMATE_CACHE_MS) {
        const amt = (cached.data as any)?.estimated_amount;
        if (amt && amt > 0) setAmount(amt.toString());
        setEstimate(cached.data);
        setEstimateLoading(false);
        setIsCalculating(false);
        setIsCalculatingReceive(false);
        return;
      }

      setEstimateLoading(true);
      setEstimateError(null);
      setApiValidationError(null);

      estimateReverseTimeoutRef.current = setTimeout(() => {
        estimateReverseTimeoutRef.current = null;
        const reverseParams = isWithdrawal
        ? {
            fromCurrency: "USDT",
            fromNetwork: "BSC",
            toCurrency: selectedAsset.ticker,
            toNetwork: getAssetNetwork(selectedAsset),
            amount: parseFloat(receiveAmount),
            usePublicApi: !isAuthenticated,
          }
        : {
            fromCurrency: selectedAsset.ticker,
            fromNetwork: getAssetNetwork(selectedAsset),
            toCurrency: "USDT",
            toNetwork: "BSC",
            amount: parseFloat(receiveAmount),
            usePublicApi: !isAuthenticated,
          };

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timeout")), 15000);
        });

        Promise.race([dispatch(fetchSwapEstimate(reverseParams)), timeoutPromise])
          .then((result: any) => {
            if (result?.meta?.requestStatus === "rejected") {
              const p = result?.payload as any;
              const rd =
                p?.response_data ??
                p?.response?.data?.response_data ??
                p?.response?.data;
              let raw =
                (typeof rd?.message === "string" && rd.message.trim())
                  ? rd.message.trim()
                  : (typeof p?.message === "string" && p.message.trim())
                    ? p.message.trim()
                    : (typeof rd?.error === "string" && rd.error.trim())
                      ? rd.error.trim()
                      : "";
              if (isAxiosGenericStatusMessage(raw)) raw = "";
              const message = raw || swapEstimateUnavailable();
              setApiValidationError(message);
              setEstimateError(null);
              setAmount("0");
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              setEstimateLoading(false);
              return;
            }
            if (result?.meta?.requestStatus === "fulfilled" && result.payload) {
              const payload = result.payload as any;
              const requiredAmountRaw =
                payload?.estimated_amount ?? payload?.toAmount ?? payload?.user_amount;
              const requiredAmount = Number(requiredAmountRaw);
              if (Number.isFinite(requiredAmount) && requiredAmount >= 0) {
                setAmount(requiredAmount.toString());
                setEstimate(payload);
                setEstimateCache((prev) =>
                  new Map(prev).set(cacheKey, {
                    data: payload,
                    timestamp: Date.now(),
                  })
                );
              }
            }
            setIsCalculating(false);
            setIsCalculatingReceive(false);
          })
          .catch((error) => {
            console.error("Failed to fetch reverse estimate:", error);

            let errorMessage = "";
            let errorDetails = "";

            if ((error as any)?.response_data?.error) {
              errorMessage = (error as any).response_data.error;
              errorDetails = (error as any).response_data.message || "";
            } else if ((error as any)?.error && typeof (error as any).error === "string") {
              errorMessage = (error as any).error;
              errorDetails = (error as any).message || "";
            } else if ((error as any)?.message) {
              errorMessage = (error as any).message;
            }

            if (errorMessage.includes("Exchange service error:")) {
              errorMessage = errorMessage.replace("Exchange service error: ", "");
            }

            const amountErrorsFromRoot =
              (Array.isArray((error as any)?.error?.amount) && (error as any).error.amount) ||
              (Array.isArray((error as any)?.response_data?.error?.amount) &&
                (error as any).response_data.error.amount);

            if (amountErrorsFromRoot && amountErrorsFromRoot.length > 0) {
              const firstMessage = String(amountErrorsFromRoot[0]);
              setApiValidationError(firstMessage);
              setEstimateError(null);
              setAmount("0");
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              setEstimateLoading(false);
              return;
            }

            if (
              errorMessage.includes("deposit_too_small") ||
              errorDetails.includes("Out of min amount")
            ) {
              const text = `Amount entered is too small. Minimum amount is ${Number(
                EXPRESS_FIXED_MIN_AMOUNT
              ).toFixed(8)}.`;
              setApiValidationError(text);
              setEstimateError(null);
              setAmount("0");
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              setEstimateLoading(false);
              return;
            }

            if (
              errorMessage.includes("deposit_too_large") ||
              errorDetails.includes("Out of max amount")
            ) {
              const maxAmount =
                (error as any)?.response_data?.payload?.range?.maxAmount;
              const text = maxAmount
                ? `Amount entered is too large. Maximum amount is ${Number(
                    maxAmount
                  ).toFixed(8)}.`
                : "Amount entered is too large. Please enter a smaller amount.";
              setApiValidationError(text);
              setEstimateError(null);
              setAmount("0");
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              setEstimateLoading(false);
              return;
            }

            const genericText = mapSwapEstimateFailureText(error, errorDetails, errorMessage);
            setApiValidationError(genericText);
            setEstimateError(null);
            setAmount("0");
            setIsCalculating(false);
            setIsCalculatingReceive(false);
            setEstimateLoading(false);
            return;

            setEstimateError("Using fallback calculation");
            const recv = parseFloat(receiveAmount);
            const fallbackAmount =
              selectedAsset &&
              isCommissionApiAsset(selectedAsset) &&
              isForexPrimusAsset(selectedAsset)
                ? getFxpReverseAmount(recv)
                : selectedAsset && isCommissionApiAsset(selectedAsset)
                  ? recv / (1 - (apiCommission ?? 2) / 100)
                  : (() => {
                      let commissionRate = 2;
                      if (selectedAsset?.range_commissions?.length) {
                        commissionRate = parseFloat(
                          selectedAsset.range_commissions[0]?.commission || "2"
                        );
                      } else if (selectedAsset?.commission) {
                        commissionRate = parseFloat(selectedAsset.commission);
                      } else if (selectedAsset?.fee_rate) {
                        commissionRate = parseFloat(selectedAsset.fee_rate);
                      }
                      return isDepositMode
                        ? recv * (1 + commissionRate / 100)
                        : recv / (1 - commissionRate / 100);
                    })();
            setAmount(fallbackAmount.toString());
            setIsCalculating(false);
            setIsCalculatingReceive(false);
          })
          .finally(() => {
            setEstimateLoading(false);
          });
      }, ESTIMATE_DEBOUNCE_MS);
    }

    return () => {
      if (estimateReverseTimeoutRef.current) {
        clearTimeout(estimateReverseTimeoutRef.current);
      }
    };
  }, [selectedAsset, receiveAmount, isCalculatingFromPay, isDepositMode]);

  // Update amounts when estimate is received or for direct assets
  useEffect(() => {
    logger.debug('general', "Estimate effect triggered:", {
      hasEstimate: !!estimate,
      estimateLoading,
      isCalculatingFromPay,
      amount,
      receiveAmount,
      estimateAmount: (estimate as any)?.estimated_amount,
    });

    if (estimate && !estimateLoading) {
      if (isCalculatingFromPay && parseFloat(amount) > 0) {
        // Forward calculation: update receive amount
        logger.debug('general',
          "Estimate received, updating receive amount:",
          (estimate as any)?.estimated_amount
        );

        const estAmt =
          (estimate as any)?.toAmount ?? (estimate as any)?.estimated_amount;
        if (
          Number.isFinite(Number(estAmt)) &&
          Number(estAmt) < 0
        ) {
          setApiValidationError(buildNegativeReceiveError(Number(estAmt)));
        } else {
          setApiValidationError(null);
        }
        const safeEstAmt = toNonNegativeAmount(estAmt);
        if (safeEstAmt > 0) {
          setReceiveAmount(safeEstAmt.toString());
          setReceiveAmountError(null);
          setIsCalculating(false);
          setIsCalculatingReceive(false);
        } else {
          logger.debug('general',
            "DEBUG: Invalid estimate received, clearing loading state"
          );
          setReceiveAmount("0");
          setReceiveAmountError("Invalid estimate received");
          setIsCalculating(false);
          setIsCalculatingReceive(false);
        }
      } else if (!isCalculatingFromPay && parseFloat(receiveAmount) > 0) {
        // Reverse calculation: estimate already handled in reverse useEffect
        setIsCalculating(false);
        setIsCalculatingReceive(false);
        setReceiveAmountError(null);
      }
    } else if (estimateLoading) {
      // Loading states are managed by the input handlers and calculateAmounts function
      // Don't interfere with them here
    } else if (!estimate && !estimateLoading) {
      // No estimate available - loading states are managed elsewhere
      // Don't interfere with them here
    }
  }, [
    estimate,
    estimateLoading,
    isCalculatingFromPay,
    amount,
    receiveAmount,
    selectedAsset,
  ]);

  const handleAssetSelect = (asset: Asset) => {
    // Debug selected asset object to trace missing/invalid asset_id issues.
    console.log("[Rates] Selected asset object:", asset);
    logger.debug("general", "[Rates] Selected asset object:", asset);
    logger.debug("general", "[Rates] Selected asset identifiers:", {
      asset_id: (asset as any)?.asset_id,
      id: (asset as any)?.id,
      ticker: (asset as any)?.ticker,
      symbol: (asset as any)?.symbol,
      network: (asset as any)?.network,
      networks: (asset as any)?.networks,
    });
    setSelectedAsset(asset);
    setIsAssetDropdownOpen(false);

    // Clear stale estimate when asset changes
    setEstimate(null);
    setEstimateError(null);
    setApiValidationError(null);
    // Express deposit: refetch commission / rates for the new asset (avoid stale % and to_amount)
    setExchangeLookupResponse(null);
    setApiCommission(null);

    if (
      asset &&
      isExchangeCommissionLookupAsset(asset) &&
      !isForexPrimusAsset(asset)
    ) {
      // Crypto exchange-lookup: amounts from commission-lookup (to_amount / local_commission)
      setReceiveAmountError(null);
      const amountNum = parseFloat(amount) || 0;
      const receiveNum = parseFloat(receiveAmount) || 0;
      if (isCalculatingFromPay && amountNum > 0) {
        setIsCalculating(true);
        setIsCalculatingReceive(true);
      } else if (!isCalculatingFromPay && receiveNum > 0) {
        setIsCalculating(true);
        setIsCalculatingReceive(true);
      } else {
        setIsCalculating(false);
        setIsCalculatingReceive(false);
      }
    } else if (asset && usesLegacyPercentCommission(asset)) {
      // After setApiCommission(null), React state is still stale in this tick — use default until fetch completes.
      const commissionRate = isForexPrimusAsset(asset) ? 0 : 2;
      if (isCalculatingFromPay) {
        const amountNum = parseFloat(amount) || 0;
        if (amountNum > 0) {
          const calculatedReceive = Math.max(0, amountNum * (1 - commissionRate / 100));
          setReceiveAmount(calculatedReceive.toFixed(2));
        }
        setReceiveAmountError(null);
      } else {
        const receiveNum = parseFloat(receiveAmount) || 0;
        if (receiveNum > 0) {
          const calculatedAmount = receiveNum / (1 - commissionRate / 100);
          setAmount(calculatedAmount.toFixed(2));
        }
        setReceiveAmountError(null);
      }
      setIsCalculating(false);
      setIsCalculatingReceive(false);
    } else if (asset && !isSimpleCalculationAsset(asset)) {
      // ChangeNow / swap path
      const amountNum = parseFloat(amount) || 0;
      const receiveNum = parseFloat(receiveAmount) || 0;
      if (isCalculatingFromPay && amountNum > 0) {
        setIsCalculating(true);
        setIsCalculatingReceive(true);
      } else if (!isCalculatingFromPay && receiveNum > 0) {
        setIsCalculating(true);
        setIsCalculatingReceive(true);
      } else {
        setIsCalculating(false);
        setIsCalculatingReceive(false);
      }
    } else {
      setIsCalculating(false);
      setIsCalculatingReceive(false);
    }
  };

  const handlePaymentMethodSelect = (method: string | any) => {
    if (typeof method === 'string') {
      setSelectedPaymentMethod(method);
      setPayBank(method);
      setSelectedPaymentDetail(null);
      setSelectedProviderData(null);
      setSelectedPaymentDetails([]);
    } else if (method?.provider_name || method?.payment_provider_name) {
      const displayName = method.provider_name || method.payment_provider_name;
      setSelectedPaymentMethod(displayName);
      setPayBank(displayName);
      setSelectedProviderData(method);
      setSelectedPaymentDetail(isDepositMode ? method : null);
      setSelectedPaymentDetails([]);
    }
    setPaymentMethodError(null);
    setIsMethodDropdownOpen(false);
  };

  // Match express OTC UX: open modal immediately when crossing threshold.
  useEffect(() => {
    const payNum = parseFloat(amount) || 0;
    const recvNum = parseFloat(receiveAmount) || 0;
    const exceeded =
      isOtcPopupAsset(selectedAsset) && (payNum > 15000 || recvNum > 15000);
    if (exceeded && !otcThresholdExceededRef.current) {
      setIsInfoModalOpen(true);
    }
    otcThresholdExceededRef.current = exceeded;
  }, [selectedAsset, amount, receiveAmount]);

  const handleModeSwitch = () => {
    const willBeWithdrawal = !isFieldsSwapped;
    const firstProvider = publicPaymentProviders?.[0];
    const secondProvider = publicPaymentProviders?.[1] || firstProvider;
    const firstProviderName =
      firstProvider?.provider_name || firstProvider?.payment_provider_name || "";
    const secondProviderName =
      secondProvider?.provider_name || secondProvider?.payment_provider_name || firstProviderName;
    setIsFieldsSwapped(!isFieldsSwapped);
    setIsDepositMode(!willBeWithdrawal);

    if (willBeWithdrawal) {
      setSelectedPaymentDetail(null);
      setPayBank(firstProviderName || selectedPaymentMethod || payBank || "");
      setSelectedPaymentMethod(secondProviderName || selectedPaymentMethod || "");
      setSelectedProviderData(firstProvider || (selectedPaymentDetail && typeof selectedPaymentDetail === 'object' ? selectedPaymentDetail : selectedProviderData));
      setSelectedPaymentDetails([]);
    } else {
      if (firstProviderName) {
        setPayBank(firstProviderName);
        setSelectedPaymentMethod(secondProviderName || firstProviderName);
        setSelectedProviderData(firstProvider);
        setSelectedPaymentDetail(firstProvider);
      }
      setSelectedPaymentDetails([]);
    }

    // Reset transaction state when switching
    setIsFirstCardSubmitted(false);
    setTransactionId("");
    setResponseData(null);
    setDepositCode("");
    setWithdrawalAddress("");
    setPayoutAddress("");
    setQrCodeUrl("");
    setWalletAddress("");
    setWalletError("");
    setIsP2pWithdrawalTermsAccepted(false);
    setExpandedP2pWithdrawalTerms(false);

    // Clear estimate to force recalculation
    setEstimate(null);
    setEstimateError(null);
  };

  const resetTransaction = () => {
    setIsFirstCardSubmitted(false);
    setTransactionId("");
    setResponseData(null);
    setDepositCode("");
    setWithdrawalAddress("");
    setPayoutAddress("");
    setQrCodeUrl("");
    setWalletAddress("");
    setWalletError("");
    setForexAccountNumber("");
    setForexUserNotes("");
    setIsP2pWithdrawalTermsAccepted(false);
    setExpandedP2pWithdrawalTerms(false);
    setForceUpdate((prev) => prev + 1);
  };

  const handleProceedToExchanging = async () => {
    const payNum = parseFloat(amount) || 0;
    if (
      selectedAsset &&
      !isDepositMode &&
      isFixedMinWithdrawalAsset(selectedAsset) &&
      payNum > 0 &&
      payNum < EXPRESS_FIXED_MIN_AMOUNT
    ) {
      const minMsg = `Minimum amount for this asset is ${EXPRESS_FIXED_MIN_AMOUNT}.`;
      setReceiveAmountError(minMsg);
      showToast.error(minMsg);
      return;
    }
    const recvNum = parseFloat(receiveAmount) || 0;
    if (
      selectedAsset &&
      isOtcPopupAsset(selectedAsset) &&
      (payNum > 15000 || recvNum > 15000)
    ) {
      showToast.error("Amount cannot exceed $15,000. Please contact OTC Desk for larger amounts.");
      setIsInfoModalOpen(true);
      return;
    }

    let effectiveTxId = transactionId;
    let effectiveResponse: any = responseData;
    let effectiveDepositCode = depositCode;

    // FX Primus uses trading_engine forex create-exchange + forex-status WebSocket — not crypto createDeposit / Exchanging WS.
    if (isDepositMode && isRatesFxpDeposit) {
      if (!selectedPaymentDetail) {
        showToast.error("Please select a payment method");
        return;
      }
    } else if (!isDepositMode && isRatesFxpWithdrawal) {
      if (!selectedPaymentDetails?.length) {
        showToast.error("Please select your registered account");
        return;
      }
    } else if (!effectiveResponse || !effectiveTxId) {
      showToast.error("No transaction data available");
      return;
    }

    // Strict KYC gate on final proceed as well.
    // Use local auth state first for immediate UX, then verify with API.
    if (isAuthenticated) {
      if (user?.is_verified === false) {
        dispatch(openKYCModal());
        return;
      }
      try {
        const kycResult = await dispatch(checkKYCStatus()).unwrap();
        const kycStatus = kycResult as any;
        if (!kycStatus || kycStatus.is_verified !== true) {
          dispatch(openKYCModal());
          return;
        }
      } catch {
        dispatch(openKYCModal());
        return;
      }
    }

    if (isDepositMode && isRatesFxpDeposit) {
      if (!forexAccountNumber.trim()) {
        showToast.error(
          t(
            "rates.forexAccountNumberRequired",
            "Please enter your forex account number"
          )
        );
        return;
      }
    }

    if (isDepositMode && !isRatesFxpDeposit) {
      const trimmed = walletAddress.trim();
      if (!trimmed) {
        showToast.error("Please enter a valid wallet/account address");
        return;
      }
      if (isWalletValidating) {
        showToast.error("Validating address...");
        return;
      }
      if (walletError) {
        showToast.error(walletError);
        return;
      }
    }

    // FX Primus withdrawal is completed inside ForexWithdrawal (createForexExchangeThunk → forex-status), not this handler.
    if (!isDepositMode && isRatesFxpWithdrawal) {
      return;
    }

    if (!isDepositMode && !isRatesFxpWithdrawal && !isP2pWithdrawalTermsAccepted) {
      showToast.error(
        "Please read and accept the withdrawal terms before continuing."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // FX Primus — same API as express deposit.tsx (forex create-exchange); navigate to forex-status (forexStatusWebSocket).
      if (isDepositMode && isRatesFxpDeposit) {
        const publicMethodsData = (directPublicPaymentMethods || publicPaymentMethods) as any;
        const methodsList =
          (Array.isArray(publicMethodsData?.data?.providers) && publicMethodsData.data.providers) ||
          (Array.isArray(publicMethodsData?.data?.payment_methods) && publicMethodsData.data.payment_methods) ||
          (Array.isArray(publicPaymentMethods) && publicPaymentMethods) ||
          (Array.isArray(adminPaymentDetails)
            ? adminPaymentDetails
            : Array.isArray((adminPaymentDetails as any)?.data)
              ? (adminPaymentDetails as any).data
              : []) ||
          [];

        let exchangeDetailsForForex: any[] = Array.isArray(adminPaymentDetails)
          ? adminPaymentDetails
          : [];
        try {
          const fresh = await dispatch(fetchAdminPaymentDetails(false)).unwrap();
          if (Array.isArray(fresh) && fresh.length > 0) {
            exchangeDetailsForForex = fresh;
          }
        } catch {
          /* keep selector snapshot */
        }

        const resolvedAdminId = resolveForexDepositAdminPaymentDetailId({
          effective: selectedPaymentDetail,
          selected: selectedPaymentDetail,
          payBank,
          methods: methodsList,
          adminMethods: adminWalletListDisplayData,
          exchangeAdminPaymentDetails: exchangeDetailsForForex,
        });

        if (!resolvedAdminId?.trim()) {
          showToast.error(
            t(
              "rates.forexPaymentDetailMissing",
              "We could not link this bank to an admin payment record. Open the payment dropdown and choose your bank again, then submit."
            )
          );
          return;
        }

        const payNum = parseFloat(amount) || 0;
        const recvNum = parseFloat(receiveAmount) || 0;
        if (payNum <= 0 || recvNum <= 0) {
          showToast.error(
            t("rates.invalidForexAmounts", "Please enter valid send and receive amounts.")
          );
          return;
        }

        const FXP_EXCHANGE_RATE = payNum > 0 ? recvNum / payNum : 0;
        if (!Number.isFinite(FXP_EXCHANGE_RATE) || FXP_EXCHANGE_RATE <= 0) {
          showToast.error(
            t("rates.invalidForexRate", "Invalid forex rate. Please re-enter amounts.")
          );
          return;
        }
        const providerLabel =
          selectedPaymentDetail.provider_name ||
          selectedPaymentDetail.payment_provider_name ||
          "Bank";

        const forexPayload = {
          transaction_type: "deposit" as const,
          from_currency: "USD",
          from_amount: payNum.toFixed(2),
          to_currency: "FXP",
          to_amount: recvNum.toFixed(2),
          exchange_rate: FXP_EXCHANGE_RATE.toFixed(4),
          additional_info: `Wire transfer from ${providerLabel}`,
          user_notes:
            forexUserNotes.trim() ||
            t("rates.forexDepositExchange", "Forex deposit exchange"),
          user_forex_account: forexAccountNumber.trim(),
          admin_payment_detail_id: resolvedAdminId,
        };

        try {
          const { createForexExchangeThunk } = await import(
            "../../express/slices/forexSlice"
          );
          const result = await dispatch(createForexExchangeThunk(forexPayload)).unwrap();

          localStorage.setItem("currentForexExchange", JSON.stringify(result));
          showToast.success(
            t("rates.forexExchangeCreated", "Forex exchange created successfully!")
          );
          router.push(
            `/dashboard/express-exchange/forex-status?transactionId=${result.forex_transaction_id}`
          );
        } catch (error: any) {
          const msg =
            (typeof error === "string" && error) ||
            error?.message ||
            t("rates.forexExchangeFailed", "Failed to create forex exchange");
          showToast.error(msg);
        }
        return;
      }

      if (isDepositMode) {
        // For deposit mode, update the wallet address first (if provided). FXP skips — same as express deposit.
        if (walletAddress.trim() && !isRatesFxpDeposit) {
          try {
            const updateResponse = await dispatch(
              updateDepositAddress({
                transactionId: effectiveTxId,
                depositAddress: walletAddress,
              })
            ).unwrap();

            logger.debug('general', "Address update response:", updateResponse);
            showToast.success("Wallet address updated successfully!");

            // Use the updated response data if available
            if (updateResponse && typeof updateResponse === "object") {
              const responseData = updateResponse as any;
              if (
                responseData.websocket_url ||
                responseData.expected_amount ||
                responseData.net_amount ||
                responseData.changenow_id
              ) {
                // This response contains the additional fields we need
                setResponseData({
                  ...responseData,
                  transaction_id: responseData.transaction_id || effectiveTxId,
                  deposit_code: responseData.deposit_code || effectiveDepositCode,
                });
                effectiveResponse = {
                  ...responseData,
                  transaction_id: responseData.transaction_id || effectiveTxId,
                  deposit_code: responseData.deposit_code || effectiveDepositCode,
                };
              }
            }
          } catch (error: any) {
            console.error("Failed to update deposit address:", error);
            let errorMessage = "Failed to update wallet address";
            if (error.response?.data?.message) {
              errorMessage = error.response.data.message;
            } else if (error.message) {
              errorMessage = error.message;
            }
            showToast.error(errorMessage);
            return;
          }
        }
      }

      // Same payload shape as `features/express/components/forms/deposit.tsx` / `withdrwal.tsx` → `onExchange` → `exchnaging.tsx`
      const receiveNum = parseFloat(String(receiveAmount)) || 0;
      const payNum = parseFloat(String(amount)) || 0;
      const transactionData: Record<string, unknown> = {
        type: isDepositMode ? ("deposit" as const) : ("withdrawal" as const),
        amount: payNum,
        receiveAmount: receiveNum,
        asset: {
          ...selectedAsset,
          ticker:
            (selectedAsset as any)?.ticker ||
            (selectedAsset as any)?.symbol ||
            (selectedAsset as any)?.name,
          icon: normalizeRatesAssetIconForPayload(
            pickRatesAssetImageRaw(selectedAsset) ?? ""
          ),
        },
        paymentDetail: selectedPaymentDetail || {
          provider_name: "direct",
          payment_method_type: "crypto",
        },
        walletAddress: isDepositMode
          ? isRatesFxpDeposit
            ? ""
            : walletAddress
          : withdrawalAddress || "",
        network: {
          network_id: getAssetNetwork(selectedAsset),
          network_type: getAssetNetwork(selectedAsset),
        },
        transactionId: effectiveTxId,
        ...(isDepositMode && {
          depositCode: effectiveDepositCode,
          totalAmountDue: effectiveResponse?.total_amount_due,
          commission: effectiveResponse?.commission,
          networkFee: effectiveResponse?.network_fee,
          currency:
            effectiveResponse?.currency ||
            (selectedAsset as any)?.ticker ||
            (selectedAsset as any)?.symbol,
          websocketUrl: effectiveResponse?.websocket_url,
          websocket_url: effectiveResponse?.websocket_url,
          net_amount: effectiveResponse?.net_amount,
          fees: effectiveResponse?.fees,
        }),
        ...(!isDepositMode && {
          withdrawalAddress: withdrawalAddress,
          payoutAddress: payoutAddress,
          websocketUrl: effectiveResponse?.websocket_url,
          websocket_url: effectiveResponse?.websocket_url,
          message: effectiveResponse?.message,
          responseType: effectiveResponse?.response_type,
          details: {
            withdrawal_address: withdrawalAddress,
            payout_address: payoutAddress,
            from_currency: effectiveResponse?.from_currency,
            to_currency: "USD",
            to_network: effectiveResponse?.to_network,
            estimated_amount: effectiveResponse?.estimated_amount,
            changenow_id: effectiveResponse?.changenow_id,
          },
        }),
        status: effectiveResponse?.status || "pending",
        ...(isDepositMode &&
          isRatesFxpDeposit && {
            user_forex_account: forexAccountNumber.trim(),
            ...(forexUserNotes.trim()
              ? { user_notes: forexUserNotes.trim() }
              : {}),
          }),
      };

      logger.debug('general',
        "Proceeding to Express exchanging (exchnaging) with transaction data:",
        transactionData
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("rates-flow-visibility", { detail: { active: false } })
        );
        localStorage.setItem(
          "express_transaction_data",
          JSON.stringify(transactionData)
        );
      }
      const mode = isDepositMode ? "deposit" : "withdrawal";
      router.push(
        `/dashboard/express-exchange?resumeStatus=1&mode=${encodeURIComponent(mode)}`
      );
    } catch (error: any) {
      console.error("Failed to proceed to exchanging:", error);
      showToast.error("Failed to proceed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get unique payment methods from userPaymentDetails or public payment methods
  // Ensure we always have an array to work with
  // Handle potential API response wrappers
  const userPaymentArray = Array.isArray(userPaymentDetails)
    ? userPaymentDetails
    : Array.isArray((userPaymentDetails as any)?.data)
      ? (userPaymentDetails as any).data
      : [];

  // Handle the new API response structure for public payment methods
  // Extract providers array from the response
  const publicMethodsData = (directPublicPaymentMethods || publicPaymentMethods) as any;

  const publicPaymentProviders = useMemo(() => {
    if (Array.isArray(publicMethodsData?.data?.providers)) return publicMethodsData.data.providers;
    if (Array.isArray(publicMethodsData?.data)) return publicMethodsData.data;
    if (Array.isArray(publicMethodsData)) return publicMethodsData;
    return [];
  }, [publicMethodsData]);
  const orderedProviderNames = useMemo(
    () =>
      (publicPaymentProviders || [])
        .map((provider: any) => (provider?.provider_name || provider?.payment_provider_name || "").trim())
        .filter((name: string) => Boolean(name)),
    [publicPaymentProviders]
  );

  const publicPaymentArray = Array.isArray(publicPaymentMethods)
    ? publicPaymentMethods
    : Array.isArray(publicMethodsData?.data?.payment_methods)
      ? publicMethodsData.data.payment_methods
      : Array.isArray(publicMethodsData?.data?.providers)
        ? publicMethodsData.data.providers
        : Array.isArray(publicMethodsData?.data)
          ? publicMethodsData.data
          : [];

  // Extract payment method names based on the API structure
  const getPaymentMethodName = (item: any) => {
    // For user payment details (old structure)
    if (item?.payment_method_name) {
      return item.payment_method_name;
    }
    // For public payment methods provider structure (new structure)
    if (item?.method?.method_name) {
      return item.method.method_name;
    }
    // For public payment methods (new structure)
    if (item?.method_name) {
      return item.method_name;
    }
    return null;
  };

  const availablePaymentMethods = userPaymentArray.length > 0 ? userPaymentArray : publicPaymentArray;

  // Process payment methods - exact as express withdrawal
  const processedPaymentMethods = useMemo(() => {
    if (Array.isArray(publicMethodsData?.data?.providers)) return publicMethodsData.data.providers;
    if (Array.isArray(publicMethodsData?.data?.payment_methods)) return publicMethodsData.data.payment_methods;
    if (Array.isArray(publicPaymentMethods)) return publicPaymentMethods;
    return [];
  }, [publicMethodsData, publicPaymentMethods]);

  const uniquePaymentMethods = Array.from(
    new Set((processedPaymentMethods || []).map(getPaymentMethodName).filter(Boolean))
  ).filter(method => method && typeof method === 'string' && method.trim().length > 0) as string[];

  // Normalize payment method names (like express withdrawal)
  const normalizePaymentMethodName = (methodName: string | null | undefined): string | null => {
    if (!methodName || typeof methodName !== 'string') return null;
    const methodMap: Record<string, string> = {
      'Money_Transfer': 'Money_Transfer',
      'money_transfer': 'Money_Transfer',
      'Money Transfer': 'Money_Transfer',
      'money transfer': 'Money_Transfer',
    };
    return methodMap[methodName] || methodName;
  };

  // Available payment method names from API (for matching user payment details)
  const availablePaymentMethodNames = React.useMemo(() => {
    const methods = new Set<string>();
    if (Array.isArray(publicMethodsData?.data?.providers)) {
      publicMethodsData.data.providers.forEach((provider: any) => {
        const name = getPaymentMethodName(provider);
        if (name) methods.add(name);
      });
    }
    uniquePaymentMethods.forEach(m => m && methods.add(m));
    return Array.from(methods);
  }, [publicMethodsData, uniquePaymentMethods]);

  // Enhanced filtering - exact as express withdrawal
  const enhancedFilteredUserPaymentDetails = useMemo(() => {
    if (!payBank) return [];

    let rawUserDetails = effectiveUserPaymentDetailsFromRedux.length > 0 ? effectiveUserPaymentDetailsFromRedux : effectiveUserPaymentDetails;
    if (rawUserDetails && typeof rawUserDetails === "object" && !Array.isArray(rawUserDetails)) {
      rawUserDetails = (rawUserDetails as any)?.data || (rawUserDetails as any)?.payment_details || rawUserDetails;
    }

    const sourceData = userPaymentMethodsDisplay.displayData ||
      effectiveUserPaymentMethods ||
      (Array.isArray(rawUserDetails) ? rawUserDetails : []) ||
      [];

    const filtered = (Array.isArray(sourceData) ? sourceData : []).filter((detail: any) => {
      const normalizeProviderName = (name: string | null | undefined): string => {
        if (!name) return "";
        const base = name.includes(" - ") ? name.split(" - ")[0].trim() : name.trim();
        return base.toLowerCase();
      };

      const selectedProviderField = selectedProviderData?.provider || normalizeProviderName(payBank);
      const normalizedPayBank = normalizeProviderName(payBank);
      const normalizedDetailProvider = normalizeProviderName(detail.payment_provider_name);
      const normalizedDetailName = normalizeProviderName(detail.provider_name);
      const normalizedDetailPaymentProvider = normalizeProviderName(detail.payment_provider);
      const normalizedSelectedProvider = normalizeProviderName(selectedProviderField);

      const providerMatch1 = detail.payment_provider_name === selectedProviderField || normalizedDetailProvider === normalizedSelectedProvider || normalizedDetailProvider === normalizedPayBank || detail.payment_provider_name === payBank;
      const providerMatch2 = normalizedDetailName === normalizedSelectedProvider || normalizedDetailName === normalizedPayBank || detail.provider_name === payBank;
      const providerMatch3 = normalizedDetailPaymentProvider === normalizedSelectedProvider || normalizedDetailPaymentProvider === normalizedPayBank || detail.payment_provider === payBank;
      const matchesProvider = providerMatch1 || providerMatch2 || providerMatch3;

      return matchesProvider;
    });

    return filtered;
  }, [payBank, userPaymentMethodsDisplay.displayData, effectiveUserPaymentMethods, effectiveUserPaymentDetails, effectiveUserPaymentDetailsFromRedux, selectedProviderData]);

  // Legacy: filteredUserPaymentDetails for backward compat
  const filteredUserPaymentDetails = selectedPaymentMethod
    ? availablePaymentMethods.filter(
      (detail: any) => getPaymentMethodName(detail) === selectedPaymentMethod
    )
    : [];

  // Deterministic defaults from API order:
  // first select -> index 0, second select -> index 1 (or index 0 if missing).
  useEffect(() => {
    if (!Array.isArray(publicPaymentProviders) || publicPaymentProviders.length === 0) return;
    const firstProvider = publicPaymentProviders[0];
    const secondProvider = publicPaymentProviders[1] || firstProvider;
    const firstName = orderedProviderNames[0] || "";
    if (!firstName) return;
    const secondName = orderedProviderNames[1] || firstName;

    if (!isFieldsSwapped) {
      if (isDepositMode) {
        setPayBank(firstName);
        setSelectedPaymentMethod(secondName);
        setSelectedProviderData(firstProvider);
        setSelectedPaymentDetail(firstProvider);
      } else {
        // Withdrawal: keep registered-account provider in sync with visible selector
        setPayBank(secondName);
        setSelectedPaymentMethod(secondName);
        setSelectedProviderData(secondProvider || firstProvider);
      }
    } else {
      // When swapped, show second provider in the visible selector.
      setSelectedPaymentMethod(secondName);
      setPayBank(secondName);
      setSelectedProviderData(secondProvider || firstProvider);
    }
  }, [isFieldsSwapped, publicPaymentProviders, orderedProviderNames, isDepositMode]);

  // Keep selected account synced to the currently selected provider.
  // When provider changes, always reset to that provider's first account.
  const lastRegisteredProviderRef = useRef<string>("");
  useEffect(() => {
    const providerKey = (payBank || "").trim().toLowerCase();
    const providerChanged = lastRegisteredProviderRef.current !== providerKey;
    const hasAccounts = enhancedFilteredUserPaymentDetails.length > 0;
    const selectedId = selectedPaymentDetails[0]?.id;
    const selectedStillValid =
      selectedId != null &&
      enhancedFilteredUserPaymentDetails.some((d: any) => d?.id === selectedId);

    if (providerChanged) {
      lastRegisteredProviderRef.current = providerKey;
      if (hasAccounts) {
        setSelectedPaymentDetails([enhancedFilteredUserPaymentDetails[0]]);
      } else {
        setSelectedPaymentDetails([]);
      }
      return;
    }

    if (!selectedStillValid) {
      if (hasAccounts) {
        setSelectedPaymentDetails([enhancedFilteredUserPaymentDetails[0]]);
      } else if (selectedPaymentDetails.length > 0) {
        setSelectedPaymentDetails([]);
      }
    }
  }, [payBank, enhancedFilteredUserPaymentDetails, selectedPaymentDetails]);

  // Add "Bank" as a default option if not already present
  // Ensure all payment methods are valid strings
  const validPaymentMethods = uniquePaymentMethods.filter(method =>
    method && typeof method === 'string' && method.trim().length > 0
  );

  const allPaymentMethods = validPaymentMethods.includes("Bank")
    ? validPaymentMethods
    : ["Bank", ...validPaymentMethods];

  // Fallback payment methods - exact as express
  const fallbackPaymentMethods = ["Bank", "Crypto", "Forex", "Mobile", "Marchant"];
  const finalPaymentMethods = allPaymentMethods.length > 0 && allPaymentMethods.every(method =>
    typeof method === 'string' && method.trim().length > 0
  ) ? allPaymentMethods : fallbackPaymentMethods;

  // selectedPaymentDetail is now a state variable

  const hasAssetSearch = assetSearchTerm.trim().length > 0;
  // Filter assets based on search term - search by ticker, name, symbol, and network
  const filteredAssets =
    assetsDisplay.displayData?.filter((asset: any) =>
      assetMatchesSearchTerm(asset, assetSearchTerm)
    ) || [];

  // Sort assets: USDT on BSC, then rest in original order
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    // Ensure tickers exist and are strings (using ticker as primary, fallback to symbol/name)
    const tickerA = (a?.ticker || a?.symbol || a?.name || "")
      .toString()
      .toLowerCase();
    const tickerB = (b?.ticker || b?.symbol || b?.name || "")
      .toString()
      .toLowerCase();
    const legacyA = (a?.legacyTicker || a?.legacy_ticker || a?.original_ticker || a?.change_now_ticker || "")
      .toString()
      .toLowerCase();
    const legacyB = (b?.legacyTicker || b?.legacy_ticker || b?.original_ticker || b?.change_now_ticker || "")
      .toString()
      .toLowerCase();
    const networkA = (a?.network || "").toString().toLowerCase();
    const networkB = (b?.network || "").toString().toLowerCase();

    // Priority 1: USDT on BSC
    if (
      tickerA === "usdt" &&
      networkA === "bsc" &&
      !(tickerB === "usdt" && networkB === "bsc")
    ) {
      return -1;
    }
    if (
      tickerB === "usdt" &&
      networkB === "bsc" &&
      !(tickerA === "usdt" && networkA === "bsc")
    ) {
      return 1;
    }

    // Priority 2: USDC on BSC
    if (
      (tickerA === "usdc" || legacyA.includes("usdc")) &&
      networkA === "bsc" &&
      !((tickerB === "usdc" || legacyB.includes("usdc")) && networkB === "bsc")
    ) {
      return -1;
    }
    if (
      (tickerB === "usdc" || legacyB.includes("usdc")) &&
      networkB === "bsc" &&
      !((tickerA === "usdc" || legacyA.includes("usdc")) && networkA === "bsc")
    ) {
      return 1;
    }

    // Priority 3: FXP / FXPRIMUS (forex)
    const isFxpA = tickerA === "fxp" || tickerA === "fxprimus";
    const isFxpB = tickerB === "fxp" || tickerB === "fxprimus";
    if (isFxpA && !isFxpB) return -1;
    if (isFxpB && !isFxpA) return 1;

    // Default: preserve original order (no change)
    return 0;
  });

  const normalizePopularTicker = (value: unknown) => {
    const t = String(value || "").trim().toUpperCase();
    if (!t) return "";
    if (t === "FXPRIMUS") return "FXP";
    return t;
  };
  const POPULAR_TICKERS = ["USDT", "USDC", "FXP"];
  const dedupeByKey = <T,>(items: T[], getKey: (item: T) => string): T[] => {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const item of items) {
      const key = getKey(item);
      if (!key) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out;
  };

  const getPopularKey = (asset: any) => {
    const ticker = normalizePopularTicker(asset?.ticker || asset?.symbol || asset?.name);
    const network = String(getAssetNetwork(asset) || asset?.network || "").trim().toLowerCase();
    return `${ticker}:${network}`;
  };

  const popularAssets = dedupeByKey(
    sortedAssets.filter((asset: any) =>
      POPULAR_TICKERS.includes(
        normalizePopularTicker(asset?.ticker || asset?.symbol || asset?.name)
      )
    ),
    getPopularKey
  );

  const popularKeys = new Set(popularAssets.map(getPopularKey));
  const otherAssets = dedupeByKey(
    sortedAssets.filter((asset: any) => !popularKeys.has(getPopularKey(asset))),
    (asset: any) => {
      const ticker = String(asset?.ticker || asset?.symbol || asset?.name || "").trim().toUpperCase();
      const network = String(getAssetNetwork(asset) || asset?.network || "").trim().toLowerCase();
      return `${ticker}:${network}:${String(asset?.asset_id || asset?.id || "")}`;
    }
  );

  // Show top 3 "Popular" assets, then everything else under "Others"
  const POPULAR_LIMIT = 3;
  const popularTop = popularAssets.slice(0, POPULAR_LIMIT);
  const popularTopKeys = new Set(popularTop.map(getPopularKey));
  const othersAfterTop = otherAssets.filter((asset: any) => !popularTopKeys.has(getPopularKey(asset)));

  // Extract nested ternary into a function
  const renderAssetDropdown = () => {
    if (assetsDisplay.isLoading) {
      return (
        <div className="p-3 text-center text-[#788099]">Loading assets...</div>
      );
    }

    if (assetsDisplay.hasError) {
      return (
        <div className="p-3 text-center text-red-500">Error loading assets</div>
      );
    }

    const renderRow = (asset: any, index: number) => (
      <div
        key={`${asset.asset_id || "asset"}-${asset.symbol || asset.ticker || asset.name}-${asset.network || "unknown"}-${index}`}
        className="flex items-center gap-2 px-4 py-2.5 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#23232B] cursor-pointer border-b border-gray-200 dark:border-[#35353E] last:border-b-0"
        onClick={() => {
          logger.debug('general', "Asset selected:", {
            ticker: asset.ticker,
            network: asset.network || "unknown",
            image: asset.image_url || asset.asset_image,
          });
          handleAssetSelect(asset);
          setIsAssetDropdownOpen(false);
          setAssetSearchTerm("");
        }}
      >
        <RatesAssetImage
          remoteUrl={pickRatesAssetImageRaw(asset)}
          alt={asset?.name || asset?.ticker || asset?.symbol || "Asset"}
          className="w-6 h-6 rounded-full object-cover flex-shrink-0"
          onError={() => {
            logger.debug("general", "Image failed to load for asset:", asset);
          }}
        />
        <div className="flex-1 min-w-0">
          <div
            className="text-[#35353e] dark:text-white font-semibold text-sm flex items-center gap-2"
            title={(
              asset.ticker ||
              asset.symbol ||
              asset.name ||
              "Unknown"
            ).toUpperCase()}
          >
            <span className="truncate">
              {(
                asset.ticker ||
                asset.symbol ||
                asset.name ||
                "Unknown"
              ).toUpperCase()}
            </span>
            <span className="bg-[#1D8751] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
              {getNetworkDisplayName(getAssetNetwork(asset))}
            </span>
          </div>
          <div
            className="text-[#475569] dark:text-[#788099] text-xs truncate"
            title={
              asset.name ||
              (asset.ticker || "").toUpperCase() ||
              (asset.symbol || "").toUpperCase() ||
              "Unknown Asset"
            }
          >
            {asset.name ||
              (asset.ticker || "").toUpperCase() ||
              (asset.symbol || "").toUpperCase() ||
              "Unknown Asset"}
          </div>
        </div>
        {selectedAsset?.asset_id === asset.asset_id && (
          <div className="w-2 h-2 bg-[#1D8751] rounded-full"></div>
        )}
      </div>
    );

    if (sortedAssets.length > 0) {
      return (
        <>
          {!hasAssetSearch && popularTop.length > 0 && (
            <div className="px-4 pt-2 pb-1 text-[11px] font-semibold text-gray-500 dark:text-[#8B90A5] uppercase tracking-wide">
              Popular
            </div>
          )}
          {(hasAssetSearch ? sortedAssets : popularTop).map((asset: any, index: number) =>
            renderRow(asset, index)
          )}
          {!hasAssetSearch && (
            <div className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-500 dark:text-[#8B90A5] uppercase tracking-wide">
              Others
            </div>
          )}
          {!hasAssetSearch &&
            (othersAfterTop.length > 0 ? (
              othersAfterTop.map((asset: any, index: number) =>
                renderRow(asset, index + popularTop.length + 1000)
              )
            ) : (
              <div className="px-4 py-3 text-xs text-gray-500 dark:text-[#788099]">
                No other assets.
              </div>
            ))}
        </>
      );
    }

    return (
      <div className="p-4 text-center text-[#7e7e8f] dark:text-[#788099]">
        {assetSearchTerm ? "No assets found" : "No assets available"}
      </div>
    );
  };

  // Save calculator state to localStorage before redirecting to login
  const saveCalculatorState = () => {
    try {
      const stateToSave = {
        selectedAsset: selectedAsset ? {
          asset_id: selectedAsset.asset_id,
          ticker: selectedAsset.ticker,
          symbol: selectedAsset.symbol,
          name: selectedAsset.name,
          network: getAssetNetwork(selectedAsset), // Use the same function to get network
          image_url: selectedAsset.image_url,
          asset_image: selectedAsset.asset_image,
          networks: selectedAsset.networks,
          // Save all possible identifiers
          id: selectedAsset.id,
          assetId: selectedAsset.assetId,
        } : null,
        selectedPaymentMethod,
        selectedPaymentDetail: selectedPaymentDetail ? {
          provider_id: selectedPaymentDetail.provider_id,
          provider_name: selectedPaymentDetail.provider_name,
          payment_provider_name: selectedPaymentDetail.payment_provider_name,
          payment_method_name: selectedPaymentDetail.payment_method_name,
          logo: selectedPaymentDetail.logo,
          account_name: selectedPaymentDetail.account_name,
          account_number: selectedPaymentDetail.account_number,
        } : null,
        amount,
        receiveAmount,
        isFieldsSwapped,
        isDepositMode,
      };
      logger.debug('general', "Saving calculator state:", stateToSave);
      localStorage.setItem("rates_calculator_state", JSON.stringify(stateToSave));
      // Reset restore flag so it can restore on next login
      assetRestoreAttempted.current = false;
    } catch (error) {
      console.error("Failed to save calculator state:", error);
    }
  };

  // Restore calculator state from localStorage
  // NOTE: This should restore even when user is not logged in (so after redirect-back it still pre-fills).
  // Payment-detail restoration is handled separately and remains gated by auth.
  useEffect(() => {
    if (hasRestoredState.current) return;

    try {
      const savedState = localStorage.getItem("rates_calculator_state");
      if (!savedState) return;

      const state = JSON.parse(savedState);

      // Restore basic values
      if (state.amount) setAmount(state.amount);
      if (state.receiveAmount) setReceiveAmount(state.receiveAmount);
      if (state.isFieldsSwapped !== undefined) setIsFieldsSwapped(state.isFieldsSwapped);
      if (state.isDepositMode !== undefined) setIsDepositMode(state.isDepositMode);
      // Don't restore selectedPaymentMethod directly; let current provider list auto-select first.

      // Store asset and payment detail separately for later restoration (when they load)
      if (state.selectedAsset) {
        localStorage.setItem("rates_calculator_asset", JSON.stringify(state.selectedAsset));
      }

      if (state.selectedPaymentDetail) {
        localStorage.setItem("rates_calculator_payment_detail", JSON.stringify(state.selectedPaymentDetail));
      }

      // Mark as restored
      hasRestoredState.current = true;

      // Clear saved state after extracting asset and payment detail
      localStorage.removeItem("rates_calculator_state");
    } catch (error) {
      console.error("Failed to restore calculator state:", error);
      // Clear corrupted state
      localStorage.removeItem("rates_calculator_state");
      localStorage.removeItem("rates_calculator_asset");
      localStorage.removeItem("rates_calculator_payment_detail");
      hasRestoredState.current = true; // Mark as restored even on error to prevent retries
    }
  }, [isAuthenticated]);

  // Restore asset separately when assets are loaded - MUST run before auto-select
  // Use a ref to track if we've already attempted restoration
  const assetRestoreAttempted = useRef(false);

  useEffect(() => {
    if (!assetsDisplay.displayData || assetsDisplay.displayData.length === 0) return;
    if (assetRestoreAttempted.current) return; // Already attempted restoration

    const savedAsset = localStorage.getItem("rates_calculator_asset");
    if (!savedAsset) {
      assetRestoreAttempted.current = true; // Mark as attempted even if no saved asset
      return;
    }

    try {
      const state = JSON.parse(savedAsset);

      logger.debug('general', "Attempting to restore asset:", {
        saved: state,
        availableAssetsCount: assetsDisplay.displayData.length,
      });

      const normalizeTickerForMatch = (value: unknown) => {
        const raw = String(value ?? "").trim().toLowerCase();
        if (!raw) return "";
        const compact = raw.replace(/\s+/g, "");
        // Treat FX Primus variants as the same ticker.
        if (compact === "fxprimus" || compact === "fxp" || compact.includes("fxprimus")) return "fxp";
        return compact;
      };

      // Try multiple matching strategies
      const assetToRestore = assetsDisplay.displayData.find((asset: any) => {
        // Strategy 1: Match by asset_id (most reliable)
        if (state.asset_id && asset.asset_id && String(asset.asset_id) === String(state.asset_id)) {
          logger.debug('general', "Matched by asset_id:", asset.asset_id);
          return true;
        }

        // Strategy 1b: Match by id or assetId
        if (state.id && asset.id && String(asset.id) === String(state.id)) {
          logger.debug('general', "Matched by id:", asset.id);
          return true;
        }
        if (state.assetId && asset.assetId && String(asset.assetId) === String(state.assetId)) {
          logger.debug('general', "Matched by assetId:", asset.assetId);
          return true;
        }

        // Strategy 2: Match by ticker/symbol and network
        const savedTicker = normalizeTickerForMatch(state.ticker || state.symbol || state.name);
        const savedNetwork = (state.network || "").toLowerCase().trim();

        if (!savedTicker) return false;

        const assetTicker = normalizeTickerForMatch(asset.ticker || asset.symbol || asset.name);
        const assetNetwork = getAssetNetwork(asset).toLowerCase().trim();

        // Check if ticker matches
        const tickerMatches = assetTicker && assetTicker === savedTicker;

        // Check network - use getAssetNetwork for consistency
        const networkMatches = savedNetwork ? assetNetwork === savedNetwork : true;

        if (tickerMatches && networkMatches) {
          logger.debug('general', "Matched by ticker and network:", {
            ticker: assetTicker,
            network: assetNetwork,
          });
          return true;
        }

        return false;
      });

      if (assetToRestore) {
        logger.debug('general', "Successfully restored asset:", {
          saved: state,
          restored: {
            asset_id: assetToRestore.asset_id,
            ticker: assetToRestore.ticker,
            network: getAssetNetwork(assetToRestore),
          }
        });
        setSelectedAsset(assetToRestore);
        // Clear saved asset after successful restoration
        localStorage.removeItem("rates_calculator_asset");
      } else {
        logger.debug('general', "Could not find asset to restore:", {
          saved: state,
          availableAssets: assetsDisplay.displayData.slice(0, 5).map((a: any) => ({
            asset_id: a.asset_id,
            id: a.id,
            assetId: a.assetId,
            ticker: a.ticker,
            symbol: a.symbol,
            network: getAssetNetwork(a),
          }))
        });
        // Clear saved asset if we couldn't find it (to prevent retries)
        localStorage.removeItem("rates_calculator_asset");
      }

      // Mark as attempted
      assetRestoreAttempted.current = true;
    } catch (error) {
      console.error("Failed to restore asset:", error);
      localStorage.removeItem("rates_calculator_asset");
      assetRestoreAttempted.current = true;
    }
  }, [isAuthenticated, assetsDisplay.displayData]);

  // Restore payment detail separately when payment methods are loaded
  useEffect(() => {
    if (!isAuthenticated) return;

    try {
      const savedPaymentDetail = localStorage.getItem("rates_calculator_payment_detail");
      if (!savedPaymentDetail) return;

      const state = JSON.parse(savedPaymentDetail);

      // Get current payment methods
      const publicMethodsData = (directPublicPaymentMethods || publicPaymentMethods) as any;
      const publicPaymentProviders = Array.isArray(publicMethodsData?.data?.providers)
        ? publicMethodsData.data.providers
        : [];

      const userPaymentArray = Array.isArray(userPaymentDetails)
        ? userPaymentDetails
        : Array.isArray((userPaymentDetails as any)?.data)
          ? (userPaymentDetails as any).data
          : [];

      const publicPaymentArray = Array.isArray(publicPaymentMethods)
        ? publicPaymentMethods
        : Array.isArray(publicMethodsData?.data?.payment_methods)
          ? publicMethodsData.data.payment_methods
          : Array.isArray(publicMethodsData?.data?.providers)
            ? publicMethodsData.data.providers
            : Array.isArray(publicMethodsData?.data)
              ? publicMethodsData.data
              : [];

      const availablePaymentMethods = userPaymentArray.length > 0
        ? userPaymentArray
        : publicPaymentArray;

      // Try to find the payment detail
      const paymentDetailToRestore =
        publicPaymentProviders.find((provider: any) =>
          provider.provider_id === state.provider_id ||
          provider.provider_name === state.provider_name
        ) ||
        availablePaymentMethods.find((detail: any) =>
          detail.provider_id === state.provider_id ||
          detail.provider_name === state.provider_name ||
          detail.payment_provider_name === state.payment_provider_name
        );

      if (paymentDetailToRestore) {
        setSelectedPaymentDetail(paymentDetailToRestore);
        // Clear saved payment detail after restoring
        localStorage.removeItem("rates_calculator_payment_detail");
      } else if (publicPaymentProviders.length > 0 || availablePaymentMethods.length > 0) {
        // Payment methods are loaded but we couldn't find the saved one
        // Clear the saved state to prevent retries
        localStorage.removeItem("rates_calculator_payment_detail");
      }
    } catch (error) {
      console.error("Failed to restore payment detail:", error);
      localStorage.removeItem("rates_calculator_payment_detail");
    }
  }, [isAuthenticated, publicPaymentMethods, userPaymentDetails]);

  /** Rates deposit POST — shared by first submit (non-FXP) and FX Primus "proceed" (FXP first submit does not POST). */
  const submitRatesCalculatorDeposit = async (): Promise<DepositResponse> => {
    const pickNonEmpty = (...values: Array<unknown>) => {
      for (const v of values) {
        const s = String(v ?? "").trim();
        if (s) return s;
      }
      return "";
    };

    const paymentDetail = selectedPaymentDetail as any;
    const nestedDetail = paymentDetail?.payment_details?.[0] || {};
    const providerName = pickNonEmpty(
      paymentDetail?.payment_provider_name,
      paymentDetail?.provider_name,
      paymentDetail?.provider,
      nestedDetail?.payment_provider_name,
      nestedDetail?.provider_name
    );
    const methodName = pickNonEmpty(
      paymentDetail?.payment_method_name,
      paymentDetail?.payment_method,
      paymentDetail?.payment_method_type,
      paymentDetail?.method?.method_name,
      paymentDetail?.method?.method_display,
      nestedDetail?.payment_method_name,
      nestedDetail?.payment_method,
      nestedDetail?.payment_method_type
    );
    const accountNumber = pickNonEmpty(
      paymentDetail?.account_number,
      nestedDetail?.account_number,
      paymentDetail?.mobile_number,
      nestedDetail?.mobile_number
    );
    const accountName = pickNonEmpty(
      paymentDetail?.account_name,
      nestedDetail?.account_name,
      providerName
    );
    const isUuid = (v: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        v
      );
    const assetId = String(
      (selectedAsset as any)?.asset_id || (selectedAsset as any)?.id || ""
    ).trim();
    if (!isUuid(assetId)) {
      throw new Error("Asset ID is missing or invalid");
    }

    const formData = new FormData();
    formData.append("requested_amount", amount);

    formData.append("deposit_address", accountNumber || "");

    formData.append("payment_provider", providerName);
    formData.append("payment_method", methodName || providerName);

    let currencyValue = "";
    if (selectedAsset!.ticker) {
      currencyValue = selectedAsset!.ticker;
    } else if (selectedAsset!.symbol) {
      currencyValue =
        selectedAsset!.symbol === "USDT Tether"
          ? "USDT"
          : selectedAsset!.symbol;
    } else if (selectedAsset!.name) {
      currencyValue = selectedAsset!.name;
    }
    currencyValue = currencyValue?.trim();

    if (!currencyValue) {
      throw new Error("Currency information is missing");
    }
    formData.append("currency", currencyValue);

    const networkValue = getAssetNetwork(selectedAsset!);
    if (!networkValue) {
      throw new Error("Network information is missing");
    }
    formData.append("network", networkValue);

    let assetValue = "";
    if (selectedAsset!.ticker) {
      assetValue = selectedAsset!.ticker;
    } else if (selectedAsset!.symbol) {
      assetValue =
        selectedAsset!.symbol === "USDT Tether"
          ? "USDT"
          : selectedAsset!.symbol;
    } else if (selectedAsset!.name) {
      assetValue = selectedAsset!.name;
    }
    assetValue = assetValue?.trim();

    if (!assetValue) {
      throw new Error("Asset information is missing");
    }
    formData.append("asset", assetValue);
    formData.append("asset_id", assetId);
    // Backend currently accepts null; send empty string in multipart as temporary null.
    formData.append("network_id", "");

    formData.append("additional_info", `Account: ${accountName || "N/A"}`);
    formData.append("sent_from", accountName || providerName || "Customer");

    logger.debug("general", "DEBUG: Complete FormData entries:");
    for (let [key, value] of formData.entries()) {
      logger.debug("general", `${key}:`, value);
    }

    return (await dispatch(
      createDeposit({
        payload: formData,
        config: {},
      })
    ).unwrap()) as unknown as DepositResponse;
  };

  const handleSubmit = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Save calculator state before redirecting
      saveCalculatorState();
      // Set redirect path to return to rates page after login
      setAuthRedirectPath("/rates");
      // Redirect to login page
      router.push("/auth/login");
      return;
    }

    // Strict KYC gate for rates submit (both deposit/withdrawal).
    // Use local auth state first for immediate UX, then verify with API.
    if (isAuthenticated) {
      if (user?.is_verified === false) {
        dispatch(openKYCModal());
        return;
      }
      try {
        const kycResult = await dispatch(checkKYCStatus()).unwrap();
        const kycStatus = kycResult as any;
        if (!kycStatus || kycStatus.is_verified !== true) {
          dispatch(openKYCModal());
          return;
        }
      } catch {
        dispatch(openKYCModal());
        return;
      }
    }

    if (!selectedAsset || !selectedPaymentMethod) {
      showToast.error("Please select all required fields");
      return;
    }
    const payNum = parseFloat(amount) || 0;
    if (
      selectedAsset &&
      !isDepositMode &&
      isFixedMinWithdrawalAsset(selectedAsset) &&
      payNum > 0 &&
      payNum < EXPRESS_FIXED_MIN_AMOUNT
    ) {
      const minMsg = `Minimum amount for this asset is ${EXPRESS_FIXED_MIN_AMOUNT}.`;
      setReceiveAmountError(minMsg);
      showToast.error(minMsg);
      return;
    }
    const recvNum = parseFloat(receiveAmount) || 0;
    if (
      selectedAsset &&
      isOtcPopupAsset(selectedAsset) &&
      (payNum > 15000 || recvNum > 15000)
    ) {
      showToast.error("Amount cannot exceed $15,000. Please contact OTC Desk for larger amounts.");
      setIsInfoModalOpen(true);
      return;
    }
    if (!isDepositMode && selectedPaymentDetails.length === 0) {
      setPaymentMethodError("Please select your registered account");
      showToast.error("Please select your registered account");
      return;
    }

    // Block pending payment methods before submitting (withdrawal only).
    // Deposit mode should not require/verify payment-method approval.
    // We key off `isFieldsSwapped` because the UI (registered account) is rendered only for withdrawal.
    if (isFieldsSwapped && selectedPaymentDetails.length > 0) {
      const status = selectedPaymentDetails[0]?.status;
      const isRestricted = status && !isApprovedPaymentStatus(status);
      if (isRestricted) {
        const msg = getPaymentRestrictionMessage(status);
        setPaymentMethodError(msg);
        showToast.error(msg);
        return;
      }
    }
    if (isDepositMode && !selectedPaymentDetail) {
      showToast.error("Please select a payment method");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isDepositMode) {
        // FX Primus: match express deposit — first action only expands the flow; no deposit POST yet.
        if (isRatesFxpDeposit) {
          setIsFirstCardSubmitted(true);
          setForceUpdate((prev) => prev + 1);
        } else {
          const depositResponse = await submitRatesCalculatorDeposit();

          logger.debug("general", "DEBUG: Deposit response:", depositResponse);

          setTransactionId(depositResponse.transaction_id || "");
          setResponseData(depositResponse);
          setDepositCode(depositResponse.deposit_code || "");
          setIsFirstCardSubmitted(true);
          setForceUpdate((prev) => prev + 1);
        }
      } else {
        // FX Primus withdrawal: match express withdrawal — first Submit only opens the forex step (ForexWithdrawal); no createExpressWithdrawal.
        if (isRatesFxpWithdrawal) {
          const payNum = parseFloat(amount) || 0;
          if (!payNum || payNum <= 0) {
            showToast.error(
              t("rates.validFxpAmount", "Please enter a valid amount")
            );
            return;
          }
          if (selectedPaymentDetails.length === 0) {
            setPaymentMethodError("Please select your registered account");
            showToast.error("Please select your registered account");
            return;
          }
          setIsFirstCardSubmitted(true);
          setForceUpdate((prev) => prev + 1);
        } else {
          // Withdrawal API structure — crypto / non–FX Primus
          const withdrawalDetail = selectedPaymentDetails[0];
          const resolvedUserPaymentDetailId = Number(withdrawalDetail?.id);
          if (!Number.isFinite(resolvedUserPaymentDetailId) || resolvedUserPaymentDetailId <= 0) {
            throw new Error("Selected payment method is missing account ID");
          }
          const withdrawalPayload: ExpressWithdrawalPayload = {
            asset: (selectedAsset.ticker?.toUpperCase() || selectedAsset.symbol?.toUpperCase()) as string,
            asset_id: (() => {
              const raw = String(
                (selectedAsset as any)?.asset_id || (selectedAsset as any)?.id || ""
              ).trim();
              if (
                !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                  raw
                )
              ) {
                throw new Error("Asset ID is missing or invalid");
              }
              return raw;
            })(),
            amount: amount,
            network: getAssetNetwork(selectedAsset),
            ...(selectedAsset?.network_id
              ? { network_id: String(selectedAsset.network_id) }
              : {}),
            user_payment_detail_id: String(resolvedUserPaymentDetailId),
          };

          logger.debug('general', "Submitting withdrawal request:", withdrawalPayload);

          const withdrawalResponse =
            await createExpressWithdrawal(withdrawalPayload);

          logger.debug('general', "Withdrawal response received:", withdrawalResponse);

          const responseData =
            (withdrawalResponse as any).data || (withdrawalResponse as any);

          setTransactionId(responseData.transaction_id || responseData.id || "");
          setResponseData(responseData);
          setIsFirstCardSubmitted(true);
          setForceUpdate((prev) => prev + 1);

          const nextWithdrawalAddress =
            responseData?.withdrawal_address ||
            responseData?.details?.withdrawal_address ||
            responseData?.data?.withdrawal_address ||
            "";
          const nextPayoutAddress =
            responseData?.payout_address ||
            responseData?.details?.payout_address ||
            responseData?.data?.payout_address ||
            "";
          const nextQrCodeUrl =
            responseData?.qr_code_url ||
            responseData?.details?.qr_code_url ||
            responseData?.data?.qr_code_url ||
            (nextWithdrawalAddress
              ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  nextWithdrawalAddress
                )}`
              : "");

          setWithdrawalAddress(nextWithdrawalAddress);
          setPayoutAddress(nextPayoutAddress);
          setQrCodeUrl(nextQrCodeUrl);

          showToast.success("Withdrawal transaction submitted successfully!");
        }
      }
    } catch (error: any) {
      console.error("Error submitting transaction:", error);
      const errorMessage = extractApiErrorMessage(
        error,
        "Failed to submit transaction. Please try again."
      );

      // Check if error is about account verification - show KYC modal instead of toast
      const isVerificationError =
        errorMessage.toLowerCase().includes("account_not_verified") ||
        errorMessage.toLowerCase().includes("not verified") ||
        errorMessage.toLowerCase().includes("verification") ||
        errorMessage.toLowerCase().includes("pending verification") ||
        errorMessage.toLowerCase().includes("admin approval");

      if (isVerificationError) {
        dispatch(openKYCModal());
      } else {
        showToast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  function mapAssetToExchangeAsset(asset: any): any {
    return {
      ...asset,
      name: asset.name || asset.symbol || asset.ticker, // fallback if name missing
      symbol: asset.symbol || asset.ticker,
      // Add any other required fields with sensible defaults if missing
    };
  }

  // Helper to map Network to Exchange Network type
  function mapNetworkToExchangeNetwork(network: any): any {
    if (!network) return null;
    return {
      ...network,
      // Add/rename properties as needed to match the expected Network type
    };
  }

  const mappedAsset = selectedAsset
    ? mapAssetToExchangeAsset(selectedAsset)
    : null;
  const mappedNetwork = selectedAsset?.networks?.[0]
    ? mapNetworkToExchangeNetwork(selectedAsset.networks[0])
    : null;

  const amountNum = parseFloat(amount) || 0;
  const receiveAmountNum = parseFloat(receiveAmount) || 0;
  const isLookupMinGuard =
    !isDepositMode &&
    !!selectedAsset &&
    isFixedMinWithdrawalAsset(selectedAsset);
  const isAmountBelowFixedMin =
    isLookupMinGuard &&
    amountNum > 0 &&
    amountNum < EXPRESS_FIXED_MIN_AMOUNT;
  const hasDecimalPlacesError =
    /decimal places/i.test(String(apiValidationError || "")) ||
    /decimal places/i.test(String(receiveAmountError || ""));
  const isOtcThresholdReached =
    !!selectedAsset &&
    isOtcPopupAsset(selectedAsset) &&
    (amountNum >= 15000 || receiveAmountNum >= 15000);

  // Network fee: prefer backend-provided `network_fee` (when present), otherwise fallback to asset network config.
  const networkFee = (() => {
    const fromEstimate = Number((estimate as any)?.network_fee);
    if (Number.isFinite(fromEstimate) && fromEstimate >= 0) return fromEstimate;
    const fromResponse = Number((responseData as any)?.network_fee);
    if (Number.isFinite(fromResponse) && fromResponse >= 0) return fromResponse;
    const fromAssetNetwork = Number((selectedAsset as any)?.networks?.[0]?.deposit_fee);
    if (Number.isFinite(fromAssetNetwork) && fromAssetNetwork >= 0) return fromAssetNetwork;
    return 0;
  })();

  // Commission: can be flat fee or percentage depending on backend config.
  let commissionAmount = 0;
  let commissionRate = 0;
  let commissionDisplayMode: "flat_fee" | "percentage" = "percentage";
  const exchangeCommissionRule =
    (exchangeLookupResponse?.local_commission as any)?.commission_mode
      ? (exchangeLookupResponse?.local_commission as any)
      : (exchangeLookupResponse?.crypto_commission as any)?.commission_mode
        ? (exchangeLookupResponse?.crypto_commission as any)
        : null;

  if (
    selectedAsset &&
    isExchangeCommissionLookupAsset(selectedAsset) &&
    exchangeCommissionRule
  ) {
    const lc = exchangeCommissionRule;
    if (lc.commission_mode === "flat_fee") {
      const fee = lc.fee != null ? parseFloat(lc.fee) : 0;
      commissionAmount = Number.isNaN(fee) ? 0 : fee;
      commissionRate = 0;
      commissionDisplayMode = "flat_fee";
    } else if (lc.commission_mode === "percentage") {
      const rate = lc.rate != null ? parseFloat(lc.rate) : 0;
      commissionRate = Number.isNaN(rate) ? 0 : rate;
      commissionAmount = (amountNum * commissionRate) / 100;
      commissionDisplayMode = "percentage";
    }
  } else if (
    selectedAsset &&
    isExchangeCommissionLookupAsset(selectedAsset) &&
    !isForexPrimusAsset(selectedAsset)
  ) {
    // Crypto exchange-lookup pending — do not use legacy % or asset.range_commissions
    commissionAmount = 0;
    commissionRate = 0;
  } else if (selectedAsset && usesLegacyPercentCommission(selectedAsset)) {
    // FXP Primus can be configured as flat fee. Prefer explicit fee fields from the API response.
    if (isForexPrimusAsset(selectedAsset)) {
      const feeFromPayload = Number(
        (apiCommissionDetails as any)?.calculated_fee ?? (apiCommissionDetails as any)?.fee
      );
      const mode = String((apiCommissionDetails as any)?.commission_mode || "").toLowerCase();
      const isPercentageFlag = (apiCommissionDetails as any)?.is_percentage;
      const treatAsFlatFee = mode === "flat_fee" || isPercentageFlag === false;
      if (Number.isFinite(feeFromPayload) && feeFromPayload >= 0 && treatAsFlatFee) {
        commissionAmount = feeFromPayload;
        commissionRate = 0;
        commissionDisplayMode = "flat_fee";
      } else if (apiCommission == null) {
        commissionRate = 0;
        commissionAmount = 0;
        commissionDisplayMode = "percentage";
      } else {
        commissionRate = apiCommission ?? 2;
        commissionAmount = (amountNum * commissionRate) / 100;
        commissionDisplayMode = "percentage";
      }
    } else {
      commissionRate = apiCommission ?? 2;
      commissionAmount = (amountNum * commissionRate) / 100;
      commissionDisplayMode = "percentage";
    }
  } else {
    // Fallback: try to use the asset-provided commission fields
    const rateFromAsset =
      selectedAsset?.range_commissions?.[0]?.commission
        ? parseFloat(selectedAsset.range_commissions[0].commission)
        : selectedAsset?.commission
          ? parseFloat(selectedAsset.commission)
          : selectedAsset?.fee_rate
            ? parseFloat(selectedAsset.fee_rate)
            : 2; // Default 2% commission for other assets
    commissionRate = Number.isNaN(rateFromAsset) ? 2 : rateFromAsset;
    commissionAmount = (amountNum * commissionRate) / 100;
    commissionDisplayMode = "percentage";
  }

  const totalFees = networkFee + commissionAmount;

  // In rates summary, Total Amount should always match "You Send".
  const totalAmount = amountNum;

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("rates-flow-visibility", {
        detail: { active: false },
      })
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent("rates-flow-visibility", { detail: { active: false } })
      );
    };
  }, []);

  // If MoneyX tab is active, render MoneyX rates component (check first, after all hooks)
  if (activeTab === 'moneyx') {
    return (
      <>
        <div
          onSubmitCapture={(e) => {
            if (!isFrozenUser) return;
            e.preventDefault();
            e.stopPropagation();
            setShowFrozenModal(true);
          }}
          onClickCapture={(e) => {
            if (!isFrozenUser) return;
            const target = e.target as HTMLElement | null;
            const button = target?.closest?.("button");
            if (!button || (button as HTMLButtonElement).disabled) return;
            e.preventDefault();
            e.stopPropagation();
            setShowFrozenModal(true);
          }}
        >
          <MoneyXRates commissionType={isDepositMode ? "deposit" : "withdrawal"} />
        </div>
        <FrozenAccountModal
          isOpen={showFrozenModal}
          onClose={() => setShowFrozenModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <div
        onSubmitCapture={(e) => {
          if (!isFrozenUser) return;
          e.preventDefault();
          e.stopPropagation();
          setShowFrozenModal(true);
        }}
        onClickCapture={(e) => {
          if (!isFrozenUser) return;
          const target = e.target as HTMLElement | null;
          const button = target?.closest?.("button");
          if (!button || (button as HTMLButtonElement).disabled) return;
          e.preventDefault();
          e.stopPropagation();
          setShowFrozenModal(true);
        }}
      >
        <div className="bg-white dark:bg-[#18181D] p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-xl lg:rounded-2xl border-[1.5px] border-gray-200 dark:border-[#35353E] shadow-md container mx-auto">
          <div className="mb-2" />
          <div className={`w-full ${isDark ? "text-white" : "text-[#1F2937]"}`}>
        {/* Top Section - You Send: Amount and Bank/Payment Method in one card */}
        <div className="relative mb-0 pb-2">
          {/* Swap Indicator - Clickable */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full -translate-y-[60%] sm:-translate-y-[45%] z-10">
            <button
              type="button"
              onClick={handleModeSwitch}
              className="flex items-center justify-center p-0 bg-transparent border-none shadow-none"
            >
              <img
                src={
                  isDark
                    ? "/assets/Frame_36261_ledmyw.png"
                    : "/assets/Frame_36261_1_d9cnq1.png"
                }
                alt="swap"
                className="w-11 h-11"
              />
            </button>
          </div>
          <div
            data-asset-card="true"
            data-select-card="true"
            className={`relative rounded-2xl p-4 sm:p-6 overflow-visible border-[1.5px] ${isDark ? "border-[#2F2F3A]" : "border-[#E2E8F0] shadow-sm"
              } bg-transparent`}
          >
            <div className="text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
              {t("rates.youSend", "From")}
              <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              {/* Amount Section */}
              <div className="flex-1 min-w-0">
                <div className="hidden sm:block text-[15px] mb-2 font-semibold invisible" aria-hidden="true">&nbsp;</div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      const normalizedValue = stripLeadingZerosFromDecimalInput(
                        sanitizeNumericInput(value)
                      );
                      logger.debug('general', "You Send input changed:", {
                        value,
                        normalizedValue,
                        selectedAsset: selectedAsset?.ticker,
                      });

                      // Only allow numbers and decimals
                      if (normalizedValue === "" || /^\d*\.?\d*$/.test(normalizedValue)) {
                        setAmount(normalizedValue);
                        if (normalizedValue === "") {
                          setReceiveAmount("");
                          setReceiveAmountError(null);
                          setIsCalculating(false);
                          setIsCalculatingReceive(false);
                          return;
                        }
                        const newAmount = parseFloat(normalizedValue) || 0;
                        setIsCalculatingFromPay(true);
                        if (
                          selectedAsset &&
                          !isDepositMode &&
                          isFixedMinWithdrawalAsset(selectedAsset) &&
                          newAmount > 0 &&
                          newAmount < EXPRESS_FIXED_MIN_AMOUNT
                        ) {
                          setReceiveAmountError(
                            `Minimum amount for this asset is ${EXPRESS_FIXED_MIN_AMOUNT}.`
                          );
                        } else {
                          setReceiveAmountError(null);
                        }

                        if (
                          selectedAsset &&
                          newAmount > 0 &&
                          isExchangeCommissionLookupAsset(selectedAsset)
                        ) {
                          if (exchangeCommissionRule) {
                            const lc = exchangeCommissionRule as any;
                            let calculatedReceiveAmount = newAmount;
                            if (lc.commission_mode === "flat_fee" && lc.fee != null) {
                              const fee = parseFloat(lc.fee);
                              if (!Number.isNaN(fee)) {
                                calculatedReceiveAmount = Math.max(0, newAmount - fee);
                              }
                            } else if (lc.commission_mode === "percentage" && lc.rate != null) {
                              const rate = parseFloat(lc.rate);
                              if (!Number.isNaN(rate) && rate < 100) {
                                calculatedReceiveAmount = Math.max(
                                  0,
                                  newAmount * (1 - rate / 100)
                                );
                              }
                            }
                            setReceiveAmount(calculatedReceiveAmount.toFixed(2));
                            setIsCalculating(false);
                            setIsCalculatingReceive(false);
                          } else {
                            setIsCalculating(true);
                            setIsCalculatingReceive(true);
                          }
                        } else if (
                          selectedAsset &&
                          newAmount > 0 &&
                          usesLegacyPercentCommission(selectedAsset)
                        ) {
                          const commissionRate = apiCommission ?? 2;
                          const calculatedReceiveAmount = Math.max(
                            0,
                            newAmount * (1 - commissionRate / 100)
                          );
                          setReceiveAmount(calculatedReceiveAmount.toFixed(2));
                          setIsCalculating(false);
                          setIsCalculatingReceive(false);
                        } else if (selectedAsset && newAmount > 0) {
                          setIsCalculating(true);
                          setIsCalculatingReceive(true);
                        } else {
                          setIsCalculatingReceive(false);
                          setIsCalculating(false);
                        }
                      }
                    }}
                    placeholder={t("rates.enterAmount", "Enter amount")}
                    className={`w-full rounded-2xl px-4 py-2 pr-16 text-base sm:text-lg focus:outline-none border appearance-none bg-transparent ${(isCalculating || isCalculatingReceive) &&
                      isCalculatingFromPay &&
                      selectedAsset &&
                      !isInstantAmountAsset(selectedAsset)
                      ? "border-[#1D8751]"
                      : isDark
                        ? "border-white/10 text-white"
                        : "border-gray-200 text-[#111827]"
                      }`}
                  />
                  {/* Show loading spinner */}
                  {(isCalculating || isCalculatingReceive) &&
                    isCalculatingFromPay && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D8751]"></div>
                      </div>
                    )}
                </div>
                {(receiveAmountError || apiValidationError) && (
                  <div className="mt-2 text-xs text-red-500">
                    {receiveAmountError || apiValidationError}
                  </div>
                )}
              </div>

              {/* Conditionally render Payment Method or Asset based on isFieldsSwapped */}
              {!isFieldsSwapped ? (
                /* Bank/Payment Method Section - exact as express withdrawal */
                <div className="flex-1 min-w-0">
                  <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                    {t(
                      "rates.fromPaymentMethod",
                      isDepositMode ? "From Payment Method" : "To Payment Method"
                    )}
                  </label>
                  <div className="relative z-0">
                    {(() => {
                      let paymentMethodOptions: Array<{ value: string; label: string; subtitle?: string; logo?: string }> = [];

                      if (publicPaymentProviders.length > 0) {
                        paymentMethodOptions = publicPaymentProviders.map((provider: any) => {
                          const providerName = provider.provider_name || provider.payment_provider_name || "Unknown";
                          const methodName = provider.method_display || provider.method || provider.method?.method_name || provider.method?.method_display || provider.method_name || null;
                          
                          // Extract account details (account_name and account_number)
                          const details = provider.payment_details?.[0];
                          const accountInfo = details ? `${details.account_name || ''} - ${details.account_number || ''}` : null;
                          
                          // Use account details as subtitle if available, otherwise fall back to method name
                          const subtitle = accountInfo || (methodName ? `${providerName} - ${methodName}` : null);
                          
                          return {
                            value: providerName,
                            label: providerName,
                            subtitle: subtitle || undefined,
                            logo: provider.logo || provider.provider_logo || undefined,
                          };
                        }).filter((opt: any) => opt.value && opt.value.trim());
                      }

                      const isLoading = publicMethodsLoading && paymentMethodOptions.length === 0;

                      return (
                        <CustomSelect
                          options={paymentMethodOptions}
                          value={payBank}
                          logoSize={PAYMENT_LOGO_SIZE}
                          logoClassName={`${PAYMENT_LOGO_BASE_CLASS} rounded-full`}
                          sizeMode="card"
                          onChange={(value) => {
                            const selectedProvider = publicPaymentProviders.find((p: any) => (p.provider_name || p.payment_provider_name) === value);
                            setPayBank(value);
                            setSelectedProviderData(selectedProvider);
                            setSelectedPaymentDetail(selectedProvider || null);
                            setSelectedPaymentDetails([]);
                            setPaymentMethodError(null);
                          }}
                          placeholder={
                            isLoading
                              ? "Loading payment methods..."
                              : paymentMethodOptions.length > 0
                                ? isDepositMode
                                  ? "Select From Payment Method"
                                  : "Select To Payment Method"
                                : "No payment methods available"
                          }
                          disabled={isLoading}
                          loading={isLoading}
                          loadingText="Loading payment methods..."
                          emptyText="No payment methods available"
                          searchable={true}
                          className="w-full"
                        />
                      );
                    })()}
                  </div>
                  {paymentMethodError && <p className="text-red-500 text-sm mt-1">{paymentMethodError}</p>}

                  {/* Registered Account - withdrawal only, exact as express */}
                  {isFieldsSwapped && payBank && (
                    <div className="mt-3 w-full relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <label
                          className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] font-semibold"
                        >
                          {t("rates.registeredAccount", "Registered Account")}
                        </label>
                        {(() => {
                          const status = (
                            selectedPaymentDetails[0]?.status || ""
                          )
                            .toString()
                            .toLowerCase();
                          const isPending =
                            status !== "" &&
                            status !== "approved" &&
                            status !== "verified";
                          if (!isPending) return null;

                          const accountNumber =
                            selectedPaymentDetails[0]?.account_number ||
                            selectedPaymentDetails[0]?.wallet_address ||
                            "";
                          const accountName =
                            selectedPaymentDetails[0]?.account_name || "";

                          return (
                            <span
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-[#F79330]/40 bg-[#F79330]/10 text-[#F79330]"
                              title="Account pending approval"
                            >
                              {accountNumber} - {accountName} (Pending)
                            </span>
                          );
                        })()}
                      </div>
                      {(() => {
                        const allUserAccounts = (userPaymentMethodsDisplay.displayData && userPaymentMethodsDisplay.displayData.length > 0
                          ? userPaymentMethodsDisplay.displayData
                          : effectiveUserPaymentMethods) || [];
                        const hasAnyAccounts = allUserAccounts.length > 0;
                        const hasFilteredAccounts = enhancedFilteredUserPaymentDetails.length > 0;

                        if (hasFilteredAccounts) {
                          return (
                            <div className="relative w-full z-10">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                  {enhancedFilteredUserPaymentDetails.length} account(s) found
                                </span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await dispatch(fetchUserPaymentDetails()).unwrap();
                                    } catch {
                                      showToast.error("Failed to refresh payment details");
                                    }
                                  }}
                                  className="text-xs text-[#1D8751] hover:text-[#166b3e] underline"
                                >
                                  Refresh
                                </button>
                              </div>
                              <CustomSelect
                                options={(enhancedFilteredUserPaymentDetails || []).map((detail: UserPaymentDetail) => {
                                  const status = detail?.status;
                                  const isPending = !!(status && !isApprovedPaymentStatus(status));
                                  const isFrozen = isFrozenPaymentStatus(status);
                                  let providerName = detail.payment_provider_name || detail.provider_name || "Unknown Provider";
                                  let providerLogo = detail.provider_logo;
                                  if (publicPaymentProviders.length > 0) {
                                    const pub = publicPaymentProviders.find(
                                      (p: any) =>
                                        (p.provider_name || p.payment_provider_name) === detail.payment_provider_name ||
                                        (p.provider_name || p.payment_provider_name) === detail.provider_name
                                    );
                                    if (pub) {
                                      providerName = pub.provider_name || pub.payment_provider_name || providerName;
                                      providerLogo = pub.logo || pub.provider_logo || providerLogo;
                                    }
                                  }
                                  const adminDetail = (adminWalletListDisplay.displayData || []).find((w: any) => w.admin_payment_detail?.provider_name === detail.payment_provider_name)?.admin_payment_detail;
                                  if (!providerLogo && adminDetail) {
                                    providerName = adminDetail.provider_name || providerName;
                                    providerLogo = adminDetail.provider_logo || providerLogo;
                                  }
                                  const accountName = detail.account_name || "No Name";
                                  const accountNumber = detail.account_number || detail.wallet_address || "No Account";
                                  const displayLabel = `${accountNumber} - ${accountName}`;
                                  return {
                                    value: detail.id.toString(),
                                    label: isPending
                                      ? `${displayLabel} (${isFrozen ? "Frozen" : "Pending"})`
                                      : displayLabel,
                                    logo: providerLogo || undefined,
                                    title: `Account Number: ${accountNumber} | Account Name: ${accountName}${providerName ? ` | Provider: ${providerName}` : ""}`,
                                    disabled: isPending,
                                  };
                                })}
                                value={selectedPaymentDetails.length > 0 ? selectedPaymentDetails[0].id.toString() : ""}
                                onChange={(value) => {
                                  const selectedDetail = enhancedFilteredUserPaymentDetails.find((d: UserPaymentDetail) => d.id === Number(value));
                                  if (selectedDetail) {
                                    setSelectedPaymentDetails([selectedDetail]);
                                    setPaymentMethodError(null);
                                  }
                                }}
                                placeholder={userPaymentMethodsDisplay.isLoading ? "Loading accounts..." : "Select Registered Account"}
                                disabled={userPaymentMethodsDisplay.isLoading}
                                loading={userPaymentMethodsDisplay.isLoading}
                                loadingText="Loading accounts..."
                                emptyText="No registered accounts available"
                                searchable={true}
                                logoSize={PAYMENT_LOGO_SIZE}
                                logoClassName={`${PAYMENT_LOGO_BASE_CLASS} rounded-full`}
                                sizeMode="card"
                                className="w-full min-w-0"
                              />
                            </div>
                          );
                        } else if (hasAnyAccounts) {
                          return (
                            <p className="text-[#F79330] text-sm">
                              No account found for this payment method.{" "}
                              <button type="button" onClick={() => setIsPaymentModalOpen(true)} className="hover:underline cursor-pointer font-medium text-[#1D8751] hover:text-[#166b3e]">
                                Add Account
                              </button>
                            </p>
                          );
                        } else {
                          return (
                            <p className="text-[#F79330] text-sm">
                              <button type="button" onClick={() => setIsPaymentModalOpen(true)} className="hover:underline cursor-pointer">
                                Don&apos;t have an account? Register Now
                              </button>
                            </p>
                          );
                        }
                      })()}

                      {isFieldsSwapped &&
                        !isFirstCardSubmitted &&
                        selectedPaymentDetails.length > 0 &&
                        (() => {
                          const status = selectedPaymentDetails[0]?.status;
                          return !!(status && !isApprovedPaymentStatus(status));
                        })() && (
                          <div className="mb-3 flex items-start gap-3 p-4 rounded-2xl bg-[#F79330]/10 border border-[#F79330]/40">
                            <svg className="w-5 h-5 text-[#F79330] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-[#F79330]">
                                {isFrozenPaymentStatus(selectedPaymentDetails[0]?.status)
                                  ? "Account Frozen"
                                  : "Account Pending Approval"}
                              </p>
                              <p className="text-xs text-[#F79330]/80 mt-1">
                                {isFrozenPaymentStatus(selectedPaymentDetails[0]?.status)
                                  ? "Your account is frozen. Please contact support for assistance."
                                  : "Your account is pending approval. Please contact support to get it approved."}
                              </p>
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              ) : (
                /* Asset Section (when swapped) */
                <div className="flex-1 min-w-0">
                  <label
                    className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold"
                  >
                    {t("rates.provider", "Provider")}
                  </label>
                  <div className="relative" ref={assetDropdownRef}>
                    <div
                      className={`w-full rounded-2xl px-4 py-2 text-sm focus:outline-none border flex items-center justify-between gap-3 cursor-pointer bg-transparent ${isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200"
                        }`}
                      onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {selectedAsset ? (
                          <>
                            <RatesAssetImage
                              remoteUrl={pickRatesAssetImageRaw(selectedAsset)}
                              alt={
                                selectedAsset?.name ||
                                selectedAsset?.ticker ||
                                selectedAsset?.symbol ||
                                "Asset"
                              }
                              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-semibold text-sm ${isDark ? "text-white" : "text-[#111827]"}`}
                                  title={(
                                    selectedAsset.ticker ||
                                    selectedAsset.symbol ||
                                    selectedAsset.name ||
                                    "Unknown"
                                  ).toUpperCase()}
                                >
                                  {(
                                    selectedAsset.ticker ||
                                    selectedAsset.symbol ||
                                    selectedAsset.name ||
                                    "Unknown"
                                  ).toUpperCase()}
                                </span>
                                <span
                                  className="bg-[#1D8751] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                  title={getNetworkDisplayName(
                                    getAssetNetwork(selectedAsset)
                                  )}
                                >
                                  {getNetworkDisplayName(
                                    getAssetNetwork(selectedAsset)
                                  )}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <img
                              src={RATES_ASSET_ICON_FALLBACK}
                              alt="asset icon"
                              className="w-6 h-6 flex-shrink-0"
                            />
                            <span className={`${isDark ? "text-[#788099]" : "text-[#64748B]"}`}>
                              {assetsDisplay.isLoading
                                ? t("rates.loadingAssets", "Loading assets...")
                                : t("rates.selectAsset", "Select Asset")}
                            </span>
                          </>
                        )}
                      </div>
                      <FiChevronDown
                        className={`transition-transform ${isAssetDropdownOpen ? "rotate-180" : ""
                          }`}
                      />
                    </div>

                    {/* Asset Dropdown */}
                    {isAssetDropdownOpen && (
                      <div ref={assetDropdownContentRef} className={`absolute top-full left-0 right-0 mt-1 ${isDark ? "bg-[#1D1D23]" : "bg-white"} border ${isDark ? "border-[#35353E]" : "border-gray-200"} rounded-2xl z-45 max-h-80 overflow-hidden shadow-lg`}>
                        {/* Search Input */}
                        <div className={`p-2 border-b ${isDark ? "border-[#35353E]" : "border-gray-200"}`}>
                          <div className="relative">
                            <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? "text-[#788099]" : "text-[#7e7e8f]"} w-4 h-4`} />
                            <input
                              type="text"
                              placeholder={t("rates.searchPlaceholder", "Search...")}
                              value={assetSearchTerm}
                              onChange={(e) => setAssetSearchTerm(e.target.value)}
                              className={`w-full ${isDark ? "text-white bg-[#1D1D23]" : "text-gray-900 bg-white"} rounded-lg px-10 py-2 text-sm focus:outline-none border ${isDark ? "border-[#35353E]" : "border-gray-300"}`}
                            />
                          </div>
                        </div>

                        {/* Asset List */}
                        <div className="max-h-60 overflow-y-auto">
                          {renderAssetDropdown()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Close inner flex container */}
            </div>
          </div>
        </div>

        {/* Bottom Section - You Get: Amount and Provider in one card */}
        <div className="relative mb-0 pb-2">
          <div
            data-asset-card="true"
            className={`relative rounded-2xl p-4 sm:p-6 overflow-visible border-[1.5px] ${isDark ? "border-[#2F2F3A]" : "border-[#E2E8F0] shadow-sm"
              } bg-transparent`}
          >
            <div className="text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
              {t("rates.youGet", "To")}
              <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              {/* You Get Section */}
              <div className="flex-1 min-w-0">
                <div className="hidden sm:block text-[15px] mb-2 font-semibold invisible" aria-hidden="true">&nbsp;</div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={receiveAmount}
                    onChange={(e) => applyReceiveAmountInput(e.target.value)}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedText = e.clipboardData?.getData("text") ?? "";
                      applyReceiveAmountInput(pastedText);
                    }}
                    placeholder={t("rates.enterAmount", "Enter amount")}
                    className={`w-full rounded-2xl px-4 py-2 pr-16 text-base sm:text-lg focus:outline-none border appearance-none bg-transparent ${(isCalculating || isCalculatingReceive) &&
                      !isCalculatingFromPay &&
                      selectedAsset &&
                      !isInstantAmountAsset(selectedAsset)
                      ? "border-[#1D8751]"
                      : isDark
                        ? "border-white/10 text-white"
                        : "border-gray-200 text-[#111827]"
                      }`}
                  />
                  {/* Show loading spinner */}
                  {(isCalculating || isCalculatingReceive) &&
                    !isCalculatingFromPay && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D8751]"></div>
                      </div>
                    )}
                </div>
              </div>

              {/* Conditionally render Asset or Payment Method based on isFieldsSwapped */}
              {!isFieldsSwapped ? (
                /* Asset Section */
                <div className="flex-1 min-w-0">
                  <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                    {t("rates.provider", "Provider")}
                  </label>
                  <div className="relative" ref={assetDropdownRef}>
                    <div
                      className={`w-full rounded-2xl px-4 py-2 text-sm focus:outline-none border flex items-center justify-between gap-3 cursor-pointer bg-transparent ${isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200"
                        }`}
                      onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {selectedAsset ? (
                          <>
                            <RatesAssetImage
                              remoteUrl={pickRatesAssetImageRaw(selectedAsset)}
                              alt={
                                selectedAsset?.name ||
                                selectedAsset?.ticker ||
                                selectedAsset?.symbol ||
                                "Asset"
                              }
                              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-semibold text-sm ${isDark ? "text-white" : "text-[#111827]"}`}
                                  title={(
                                    selectedAsset.ticker ||
                                    selectedAsset.symbol ||
                                    selectedAsset.name ||
                                    "Unknown"
                                  ).toUpperCase()}
                                >
                                  {(
                                    selectedAsset.ticker ||
                                    selectedAsset.symbol ||
                                    selectedAsset.name ||
                                    "Unknown"
                                  ).toUpperCase()}
                                </span>
                                <span
                                  className="bg-[#1D8751] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                  title={getNetworkDisplayName(
                                    getAssetNetwork(selectedAsset)
                                  )}
                                >
                                  {getNetworkDisplayName(
                                    getAssetNetwork(selectedAsset)
                                  )}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <img
                              src={RATES_ASSET_ICON_FALLBACK}
                              alt="asset icon"
                              className="w-6 h-6 flex-shrink-0"
                            />
                            <span className={`${isDark ? "text-[#788099]" : "text-[#64748B]"}`}>
                              {assetsDisplay.isLoading
                                ? t("rates.loadingAssets", "Loading assets...")
                                : t("rates.selectAsset", "Select Asset")}
                            </span>
                          </>
                        )}
                      </div>
                      <FiChevronDown
                        className={`transition-transform ${isAssetDropdownOpen ? "rotate-180" : ""
                          }`}
                      />
                    </div>

                    {/* Asset Dropdown */}
                    {isAssetDropdownOpen && (
                      <div className={`absolute top-full left-0 right-0 mt-1 ${isDark ? "bg-[#1D1D23]" : "bg-white"} border ${isDark ? "border-[#35353E]" : "border-gray-200"} rounded-2xl z-45 max-h-80 overflow-hidden shadow-lg`}>
                        {/* Search Input */}
                        <div className={`p-2 border-b ${isDark ? "border-[#35353E]" : "border-gray-200"}`}>
                          <div className="relative">
                            <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? "text-[#788099]" : "text-[#7e7e8f]"} w-4 h-4`} />
                            <input
                              type="text"
                              placeholder={t("rates.searchPlaceholder", "Search...")}
                              value={assetSearchTerm}
                              onChange={(e) => setAssetSearchTerm(e.target.value)}
                              className={`w-full ${isDark ? "text-white bg-[#1D1D23]" : "text-gray-900 bg-white"} rounded-lg px-10 py-2 text-sm focus:outline-none border ${isDark ? "border-[#35353E]" : "border-gray-300"}`}
                            />
                          </div>
                        </div>

                        {/* Asset List */}
                        <div className="max-h-60 overflow-y-auto">
                          {renderAssetDropdown()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Payment Method Section (when swapped) - same CustomSelect as above */
                <div className="flex-1 min-w-0">
                  <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                    {t(
                      "rates.toPaymentMethod",
                      isDepositMode ? "To Payment Method" : "From Payment Method"
                    )}
                  </label>
                  <div className="relative z-0">
                    {(() => {
                      let paymentMethodOptions: Array<{ value: string; label: string; subtitle?: string; logo?: string }> = [];
                      if (publicPaymentProviders.length > 0) {
                        paymentMethodOptions = publicPaymentProviders.map((provider: any) => {
                          const providerName = provider.provider_name || provider.payment_provider_name || "Unknown";
                          const methodName = provider.method_display || provider.method || provider.method?.method_name || provider.method?.method_display || provider.method_name || null;
                          
                          // Extract account details (account_name and account_number)
                          const details = provider.payment_details?.[0];
                          const accountInfo = details ? `${details.account_name || ''} - ${details.account_number || ''}` : null;
                          
                          // Use account details as subtitle if available, otherwise fall back to method name
                          const subtitle = accountInfo || (methodName ? `${providerName} - ${methodName}` : null);
                          
                          return {
                            value: providerName,
                            label: providerName,
                            subtitle: subtitle || undefined,
                            logo: provider.logo || provider.provider_logo || undefined,
                          };
                        }).filter((opt: any) => opt.value && opt.value.trim());
                      }
                      const isLoading = publicMethodsLoading && paymentMethodOptions.length === 0;
                      return (
                        <CustomSelect
                          options={paymentMethodOptions}
                          value={selectedPaymentMethod}
                          logoSize={PAYMENT_LOGO_SIZE}
                          logoClassName={`${PAYMENT_LOGO_BASE_CLASS} rounded-full`}
                          sizeMode="card"
                          onChange={(value) => {
                            const selectedProvider = publicPaymentProviders.find((p: any) => (p.provider_name || p.payment_provider_name) === value);
                            setSelectedPaymentMethod(value);
                            setPayBank(value);
                            setSelectedProviderData(selectedProvider);
                            setSelectedPaymentDetail(selectedProvider || null);
                            setSelectedPaymentDetails([]);
                            setPaymentMethodError(null);
                          }}
                          placeholder={
                            isLoading
                              ? "Loading payment methods..."
                              : isDepositMode
                                ? "Select To Payment Method"
                                : "Select From Payment Method"
                          }
                          disabled={isLoading}
                          loading={isLoading}
                          searchable={true}
                          className="w-full"
                        />
                      );
                    })()}
                  </div>
                  {!isDepositMode && payBank && (
                    <div className="mt-3 w-full">
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] font-semibold">
                          {t("rates.registeredAccount", "Registered Account")}
                        </label>
                        {(() => {
                          const status = selectedPaymentDetails[0]?.status;
                          const isPending = !!(status && !isApprovedPaymentStatus(status));
                          if (!isPending) return null;

                          return (
                            <span
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-[#F79330]/40 bg-[#F79330]/10 text-[#F79330]"
                              title={
                                isFrozenPaymentStatus(status)
                                  ? "Account frozen"
                                  : "Account pending approval"
                              }
                            >
                              {isFrozenPaymentStatus(status)
                                ? "Frozen Registered Account"
                                : "Pending Registered Account"}
                            </span>
                          );
                        })()}
                      </div>
                      {(() => {
                        const allUserAccounts = (userPaymentMethodsDisplay.displayData && userPaymentMethodsDisplay.displayData.length > 0
                          ? userPaymentMethodsDisplay.displayData
                          : effectiveUserPaymentMethods) || [];
                        const hasAnyAccounts = allUserAccounts.length > 0;
                        const hasFilteredAccounts = enhancedFilteredUserPaymentDetails.length > 0;

                        if (hasFilteredAccounts) {
                          return (
                            <CustomSelect
                              options={enhancedFilteredUserPaymentDetails.map((detail: UserPaymentDetail) => {
                                const normalizeProviderName = (name: string | null | undefined): string => {
                                  if (!name) return "";
                                  const base = name.includes(" - ") ? name.split(" - ")[0].trim() : name.trim();
                                  return base.toLowerCase();
                                };

                                let providerLogo = detail.provider_logo;
                                const normalizedDetailProvider = normalizeProviderName(
                                  detail.payment_provider_name || detail.provider_name || (detail as any).payment_provider
                                );
                                const pub = publicPaymentProviders.find((p: any) => {
                                  const providerName = p.provider_name || p.payment_provider_name || p.provider;
                                  return normalizeProviderName(providerName) === normalizedDetailProvider;
                                });
                                if (pub) providerLogo = pub.logo || pub.provider_logo || providerLogo;

                                const accountName = detail.account_name || "No Name";
                                const accountNumber = detail.account_number || detail.wallet_address || "No Account";
                                return {
                                  value: detail.id.toString(),
                                  label: `${accountNumber} - ${accountName}`,
                                  logo: providerLogo || undefined,
                                };
                              })}
                              value={selectedPaymentDetails.length > 0 ? selectedPaymentDetails[0].id.toString() : ""}
                              onChange={(value) => {
                                const d = enhancedFilteredUserPaymentDetails.find((x: UserPaymentDetail) => x.id === Number(value));
                                if (d) setSelectedPaymentDetails([d]);
                              }}
                              placeholder={userPaymentMethodsDisplay.isLoading ? "Loading accounts..." : "Select Registered Account"}
                              disabled={userPaymentMethodsDisplay.isLoading}
                              loading={userPaymentMethodsDisplay.isLoading}
                              searchable={true}
                              logoSize={PAYMENT_LOGO_SIZE}
                              logoClassName={`${PAYMENT_LOGO_BASE_CLASS} rounded-full`}
                              sizeMode="card"
                              className="w-full"
                            />
                          );
                        }

                        if (hasAnyAccounts) {
                          return (
                            <p className="text-[#F79330] text-sm">
                              No account found for this payment method.{" "}
                              <button type="button" onClick={() => setIsPaymentModalOpen(true)} className="hover:underline cursor-pointer font-medium text-[#1D8751]">
                                Add Account
                              </button>
                            </p>
                          );
                        }

                        return (
                          <p className="text-[#F79330] text-sm">
                            <button type="button" onClick={() => setIsPaymentModalOpen(true)} className="hover:underline cursor-pointer">
                              Don&apos;t have an account? Register Now
                            </button>
                          </p>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Close inner flex container */}
          </div>
        </div>
      </div>


      {/* Amount & Fees */}
      <div className={`border ${isDark ? "border-[#35353E]" : "border-[#E8EFF5]"} rounded-xl p-4 bg-transparent mb-4`}>
        <p className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-sm font-medium mb-2`}>
          {t("rates.amountAndFees", "Amount & Fees")}
        </p>
        <div className="flex flex-col lg:flex-row gap-7 items-center">
          <div className="flex-1 flex flex-col justify-start">
            <span className={`${isDark ? "text-white" : "text-[#1F2937]"} text-sm mb-2`}>
              {t("rates.netAmount", "Net Amount to Transfer")}
            </span>
            <div className="max-w-xl">
              <div className={`w-full ${isDark ? "bg-[#35353E]" : "bg-white"} border ${isDark ? "border-[#35353E]" : "border-[#E8EFF5]"} rounded-2xl flex items-center px-2 py-2`}>
                <button className="flex-1 flex items-center justify-center bg-transparent">
                  <span className={`${isDark ? "text-[#BDF4D8]" : "text-[#051015]"} text-sm ml-4`}>
                    {t("rates.totalAmount", "Total Amount")}
                  </span>
                  <span className="bg-[#1D8751] text-white text-lg font-semibold rounded-full px-8 py-1 ml-2">
                    ${amountNum > 0 ? totalAmount.toFixed(2) : "0.00"}
                  </span>
                </button>
              </div>
            </div>
          </div>
          {/* Right: Fee Breakdown */}
          <div className={`max-w-lg flex flex-col justify-between  ${isDark ? "bg-[#1D1D23]" : "bg-white"} border ${isDark ? "border-accent" : "border-[#E8EFF5]"} rounded-md px-4 py-3`}>
            <div className="flex justify-between gap-20 text-sm mb-1">
              <span className={isDark ? "text-[#E8EFF5]" : "text-[#051015]"}>
                {t("rates.commission", "Commission:")}{" "}
                {selectedAsset && !isSimpleCalculationAsset(selectedAsset) && estimate?.omaya_fee_percentage
                  ? `${estimate.omaya_fee_percentage}%`
                  : commissionDisplayMode === "flat_fee"
                    ? `$${commissionAmount.toFixed(2).replace(/\.00$/, "")}`
                    : amountNum > 0
                      ? `${commissionRate.toFixed(2).replace(/\.?0+$/, "")}%`
                      : "0%"}
              </span>
              <span className="text-[#1D8751]">
                {selectedAsset && !isSimpleCalculationAsset(selectedAsset) && estimate?.total_fee
                  ? `$${estimate.total_fee}`
                  : amountNum > 0 ? `$${commissionAmount.toFixed(2)}` : "$0.00"}
              </span>
            </div>
            <div className="flex justify-between gap-20 text-sm mb-1">
              <span className={isDark ? "text-[#E8EFF5]" : "text-[#051015]"}>
                {t("rates.networkFee", "Network fee")}
              </span>
              <span className="text-[#1D8751]">
                {amountNum > 0 ? `$${networkFee.toFixed(2)}` : "$0.00"}
              </span>
            </div>
            <div className={`border-t ${isDark ? "border-[#35353E]" : "border-[#E8EFF5]"} mt-2 pt-2 flex justify-between text-sm`}>
              <span className="text-[#F79330] font-semibold">
                {t("rates.totalFees", "Total Fees")}
              </span>
              <span className="text-[#F79330] font-semibold">
                {selectedAsset && !isSimpleCalculationAsset(selectedAsset) && estimate?.total_fee
                  ? `$${estimate.total_fee}`
                  : amountNum > 0 ? `$${totalFees.toFixed(2)}` : "$0.00"}
              </span>
            </div>
          </div>
        </div>
      </div>



      <div className="flex items-start sm:items-center text-[#F79330] text-sm sm:text-lg mb-6 py-3 rounded-md gap-2 sm:gap-0">
        <FiInfo className="text-red-600 flex-shrink-0 w-5 h-5 sm:w-4 sm:h-4 mt-0.5 sm:mt-0" />
        <p className="ml-0 sm:ml-2 text-gray-700 dark:text-gray-300 text-xs sm:text-base">
          {t(
            "rates.feeInfo",
            "Transactions are subject to commission, above is the information on the commission rates"
          )}
        </p>
      </div>

      {!isFirstCardSubmitted && (
        <button
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            isAmountBelowFixedMin ||
            isOtcThresholdReached ||
            hasDecimalPlacesError
          }
          className={`w-full py-3 px-4 rounded-xl font-semibold text-white bg-[#1D8751] hover:bg-[#0f8f4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
        >
          {isSubmitting
            ? t("rates.processing", "Processing...")
            : "Submit"}
        </button>
      )}

      {/* Expanded Pages - shown after first card submission */}
      {isFirstCardSubmitted && (
        <>
          {/* Payment Details Card - deposit only */}
          {isDepositMode && selectedPaymentDetail && (
            <>
              <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
                <span className="text-[#7e7e8f] dark:text-[#788099]">2-</span>{" "}
                {t("rates.paymentDetails", "Payment Details")}
              </h2>
              <div className="mt-1 mb-2 w-full flex flex-col gap-3 max-w-4xl mx-auto px-2">
                <div className="flex-1 dark:bg-[#1D1D23] rounded-2xl border border-[#39394a] dark:border-[#35353E] flex flex-col justify-between p-3 sm:p-5 relative min-h-[120px]">
                  <div className="flex items-center justify-between mb-4 gap-2">
                    <span className="text-[#7e7e8f] dark:text-[#788099] text-sm sm:text-base font-semibold flex-shrink-0">
                      {t("rates.bankLabel", "Bank:")}
                    </span>
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={
                          selectedPaymentDetail.logo ||
                          selectedPaymentDetail.provider_logo ||
                          "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                        }
                        alt="Bank Logo"
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-contain flex-shrink-0"
                      />
                      <span className="text-[#35353e] dark:text-[#788099] text-sm sm:text-base font-semibold truncate">
                        {selectedPaymentDetail.provider_name || selectedPaymentDetail.payment_provider_name}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-dashed border-[#39394a] mb-2"></div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-1">
                    <span className="text-[#7e7e8f] dark:text-[#788099] text-sm sm:text-base font-medium flex-shrink-0">
                      {t("rates.accountNameLabel", "Account Name :")}
                    </span>
                    <span className="text-[#35353e] dark:text-[#788099] text-sm sm:text-base font-medium break-all">
                      {selectedPaymentDetail.payment_details?.[0]?.account_name || selectedPaymentDetail.account_name || "-"}
                    </span>
                  </div>
                  <div className="border-t border-dashed border-[#39394a] mb-2"></div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-[#7e7e8f] dark:text-[#788099] text-sm sm:text-base font-medium flex-shrink-0">
                      {t("rates.accountNumberLabel", "Account Number :")}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#35353e] dark:text-[#788099] text-sm sm:text-base font-medium break-all">
                        {selectedPaymentDetail.payment_details?.[0]?.account_number || selectedPaymentDetail.account_number || "-"}
                      </span>
                      <CopyButton
                        value={selectedPaymentDetail.payment_details?.[0]?.account_number || selectedPaymentDetail.account_number || ""}
                        className="text-warning hover:text-[#1D8751] transition-colors p-1 rounded"
                        showIcon={true}
                        showInlineMessage={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Transaction Code Card - for deposit mode */}
          {isDepositMode && responseData && responseData.deposit_code && (
            <>
              <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
                <span className="text-[#7e7e8f] dark:text-[#788099]">3-</span>{" "}
                {t("rates.transactionCode", "Transaction Code")}
              </h2>
              <div className="mb-6 flex flex-col gap-3 max-w-4xl mx-auto w-full px-2">
                <div className="bg-white dark:bg-[#1D1D23] border-2 border-gray-200 dark:border-[#35353E] rounded-2xl p-4 shadow-lg w-full text-gray-700 dark:text-[#788099]">
                  {/* Transaction Code Row */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-3">
                    <span className="text-gray-600 dark:text-[#788099] text-base font-semibold">
                      {t("rates.transactionCodeLabel", "Transaction Code:")}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#1D8751] dark:text-[#1D8751] text-lg font-mono font-bold">
                        {responseData.deposit_code}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            responseData.deposit_code
                          );
                          showToast.success("Copied!");
                        }}
                        className="flex items-center gap-1 bg-gray-100 dark:bg-[#35353E] border border-[#1D8751] text-[#1D8751] rounded-full px-4 py-1 font-semibold text-base hover:bg-[#1D8751] hover:text-white transition-colors"
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
                        {t("rates.copy", "Copy")}
                      </button>
                    </div>
                  </div>
                  {/* Note Section */}
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center mb-2">
                      <span className="mr-2 text-[#1D8751]">
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="#1D8751"
                            strokeWidth="2"
                          />
                          <line
                            x1="12"
                            y1="8"
                            x2="12"
                            y2="12"
                            stroke="#1D8751"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <circle cx="12" cy="16" r="1" fill="#1D8751" />
                        </svg>
                      </span>
                      <span className="text-sm font-semibold text-[#7e7e8f] dark:text-[#788099]">
                        {t("rates.note", "Note")}
                      </span>
                    </div>
                    <div className="dark:bg-[#1D1D23] border border-[#1D8751] rounded-xl p-3">
                      <ul className="list-none space-y-1">
                        <li className="flex items-start">
                          <span className="w-2 h-2 mt-1 rounded-full bg-[#1D8751] inline-block mr-2 shrink-0"></span>
                          <span className="text-[#35353e] dark:text-[#788099] text-xs">
                            {t("rates.noteInstructions", "Please write this Transaction Code in the bank message or note section.")}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 mt-1 rounded-full bg-[#1D8751] inline-block mr-2 shrink-0"></span>
                          <span className="text-[#35353e] dark:text-[#788099] text-xs">
                            {t("rates.noteAccuracy", "This helps us process your payment quickly and accurately.")}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Wallet address (crypto) or continue (FX Primus deposit — same as express deposit) */}
          <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
            <span className="text-[#7e7e8f] dark:text-[#788099]">
              {isDepositMode ? "4-" : "3-"}
            </span>
            {isDepositMode && isRatesFxpDeposit
              ? t("rates.forexAccountDetails", "Forex Account Details")
              : !isDepositMode && isRatesFxpWithdrawal
                ? t("rates.fxpWithdrawalConfirm", "Confirm FX Primus withdrawal")
                : t("rates.walletAddress", "Wallet Address")}
          </h2>
          <div
            className={`flex flex-col dark:bg-[#1D1D23] border-2 ${
              isDepositMode
                ? "border-[#E2E8F0] dark:border-[#35353E]"
                : "border-[#E2E8F0] dark:border-[#35353E]"
            } rounded-2xl p-5 shadow-lg w-full max-w-4xl mx-auto text-[#35353e] dark:text-[#788099] mb-6`}
          >
            {isDepositMode ? (
              isRatesFxpDeposit ? (
              <>
                <p className="text-[#35353e] dark:text-[#788099] text-sm sm:text-base mb-4">
                  {t(
                    "rates.fxpDepositNoWalletStep",
                    "No crypto wallet address is required here (same as Express deposit). Enter your FX Primus account number below."
                  )}
                </p>

                <div className="flex flex-col bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#35353E] rounded-2xl p-3 sm:p-4 md:p-5 shadow-lg mb-4">
                  <label className="block text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                    {t(
                      "rates.yourForexAccountNumber",
                      "Your Forex Account Number"
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={forexAccountNumber}
                      onChange={(e) =>
                        setForexAccountNumber(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder={t(
                        "rates.forexAccountNumberPlaceholder",
                        "Enter your forex account number"
                      )}
                      className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff] rounded-2xl px-4 py-2 pr-11 text-lg focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E]"
                    />
                    <button
                      ref={forexWhitelistAnchorRef}
                      type="button"
                      onClick={() => {
                        // Lazy fetch: load user payment methods when opening the whitelist.
                        setForexWhitelistOpen((v) => !v);
                        if (!forexWhitelistOpen && effectiveUserPaymentDetails.length === 0) {
                          dispatch(fetchUserPaymentDetails() as any);
                        }
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#A2A4A9FF] dark:border-[#35353E] text-gray-600 dark:text-[#A2A4A9] hover:bg-gray-50 dark:hover:bg-[#14141B] transition-colors"
                      title="Load approved Forex accounts"
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>

                    {forexWhitelistOpen && (
                      <div
                        ref={forexWhitelistDropdownRef}
                        className="absolute right-0 top-full mt-2 z-[11000] w-full max-w-[420px] rounded-xl shadow-lg border bg-white dark:bg-[#1D1D23] border-gray-200 dark:border-[#35353E]"
                      >
                        <div className="p-2 max-h-[280px] overflow-y-auto">
                          <div className="text-xs font-semibold px-2 py-1 text-[#788099]">
                            Approved Forex accounts
                          </div>
                          {userDetailsLoading ? (
                            <div className="flex items-center justify-center py-6">
                              <span className="w-5 h-5 border-2 border-[#1D8751] border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : approvedForexPaymentMethods.length === 0 ? (
                            <p className="text-sm py-4 text-center text-gray-500 dark:text-[#788099]">
                              No approved Forex accounts found.
                            </p>
                          ) : (
                            <div className="space-y-0.5">
                              {approvedForexPaymentMethods.map((d: any, idx: number) => {
                                const raw = String(d?.wallet_address || d?.account_number || "").trim();
                                const display = raw.length > 16 ? `${raw.slice(0, 6)}...${raw.slice(-4)}` : raw;
                                const title =
                                  String(d?.provider_name || d?.payment_provider_name || d?.provider || "Forex").trim() ||
                                  "Forex";
                                return (
                                  <button
                                    key={`${d?.id || d?.user_payment_detail_id || idx}`}
                                    type="button"
                                    onClick={() => {
                                      setForexAccountNumber(raw.replace(/\D/g, ""));
                                      setForexWhitelistOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left text-sm hover:bg-gray-100 dark:hover:bg-[#2A2A32] transition-colors text-gray-900 dark:text-white"
                                  >
                                    <span className="font-medium truncate">{title}</span>
                                    <span className="text-xs font-mono text-gray-500 dark:text-[#788099]">
                                      {display}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#35353E] rounded-2xl p-3 sm:p-4 md:p-5 shadow-lg mb-6">
                  <label className="block text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                    {t(
                      "rates.additionalNotesOptional",
                      "Additional Notes (Optional)"
                    )}
                  </label>
                  <textarea
                    value={forexUserNotes}
                    onChange={(e) => setForexUserNotes(e.target.value)}
                    placeholder={t(
                      "rates.forexNotesPlaceholder",
                      "Add any special instructions or notes..."
                    )}
                    className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff] rounded-2xl px-3 sm:px-4 py-2 text-lg focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E] min-h-[100px] resize-none"
                  />
                </div>

                <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
                  <button
                    type="button"
                    onClick={resetTransaction}
                    className="flex-1 bg-gray-500 text-white font-semibold py-2 sm:py-2 px-3 sm:px-4 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
                  >
                    {t("rates.cancel", "Cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToExchanging}
                    disabled={isSubmitting || !forexAccountNumber.trim()}
                    className={`flex-1 font-semibold py-2 sm:py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base ${
                      isSubmitting || !forexAccountNumber.trim()
                        ? "bg-gray-500 cursor-not-allowed text-white"
                        : "bg-[#1D8751] hover:bg-[#166b3f] text-white"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                        <span>{t("rates.processing", "Processing...")}</span>
                      </>
                    ) : (
                      <span className="tracking-wide">EXCHANGE</span>
                    )}
                  </button>
                </div>
              </>
            ) : (
              // Deposit Mode: Input field for wallet address (non–FX Primus)
              <>
                <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                  {t("rates.walletAccountAddress", "Wallet/Account Address")}
                </label>
                <div className="flex items-center dark:bg-[#1D1D23] border border-gray-200 dark:border-[#35353E] rounded-2xl px-4 py-2 mb-4">

                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => {
                      clearSaveBookmarkError();
                      const value = e.target.value;
                      setWalletAddress(value);
                      const trimmed = value.trim();
                      if (trimmed && validationCurrency) {
                        void validateAddress(trimmed, validationCurrency, validationNetwork);
                      } else {
                        setWalletError("");
                        resetAddressValidation();
                      }
                    }}
                    placeholder={t("rates.enterWalletAddressPlaceholder", "Enter your wallet address")}
                    className="flex-1 bg-transparent text-[#35353e] dark:text-[#788099] placeholder-[#7e7e8f] focus:outline-none min-w-0"
                  />
                  <span
                    ref={bookmarkAnchorRef}
                    className="relative mx-2 text-[#1D8751] cursor-pointer flex-shrink-0 hover:opacity-80 transition-opacity"
                    onClick={async () => {
                      if (bookmarkOpen) {
                        setBookmarkOpen(false);
                        return;
                      }
                      setBookmarkOpen(true);
                      await fetchBookmarks();
                    }}
                    title="Load from saved addresses"
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    <BookmarkDropdown
                      isOpen={bookmarkOpen}
                      onClose={() => setBookmarkOpen(false)}
                      bookmarks={bookmarks}
                      loading={bookmarksLoading}
                      saving={bookmarkSaving}
                      currentAddress={walletAddress}
                      asset={bookmarkAsset}
                      network={bookmarkNetwork}
                      onSelect={(addr) => {
                        clearSaveBookmarkError();
                        setWalletAddress(addr);
                        setWalletError("");
                        if (addr.trim() && validationCurrency) {
                          void validateAddress(addr.trim(), validationCurrency, validationNetwork);
                        }
                      }}
                      onSaveCurrent={async (label) => {
                        try {
                          if (!walletAddress.trim()) return;
                          await saveBookmark({
                            address: walletAddress.trim(),
                            label,
                            network: bookmarkNetwork,
                            asset: bookmarkAsset,
                          });
                        } catch {
                          // handled by hook
                        }
                      }}
                      saveError={saveBookmarkError}
                      anchorRef={bookmarkAnchorRef}
                      isDark={isDark}
                      saveDisabled={!!walletError}
                    />
                  </span>
                  <button
                    type="button"
                    onClick={handlePaste}
                    className={`flex items-center gap-1.5 px-3 py-1.5 ${isDark ? "bg-[#2A2A35]/50 hover:bg-[#35353E]" : "bg-gray-100 hover:bg-gray-200"} border border-[#4A4A5A] rounded-xl text-[#1D8751] transition-all duration-200 shrink-0`}
                  >
                    <ClipboardPaste size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {isPasted ? t("rates.pasted", "Pasted!") : t("rates.paste", "Paste")}
                    </span>
                  </button>
                </div>
                {walletAddress.trim() && isWalletValidating && (
                  <p className="text-[#1D8751] text-sm mb-2">Validating address...</p>
                )}
                {walletAddress.trim() && !isWalletValidating && !walletError && (
                  <p className="text-[#1D8751] text-sm mb-2">Wallet address is valid.</p>
                )}
                {walletError && (
                  <p className="text-red-500 text-sm mb-4">{walletError}</p>
                )}
                {saveBookmarkError && (
                  <p className="text-red-500 text-sm mb-4">{saveBookmarkError}</p>
                )}
                <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
                  <button
                    onClick={resetTransaction}
                    className="flex-1 bg-gray-500 text-white font-semibold py-2 sm:py-2 px-3 sm:px-4 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
                  >
                    {t("rates.cancel", "Cancel")}
                  </button>
                  <button
                    onClick={handleProceedToExchanging}
                    disabled={
                      isSubmitting ||
                      isAmountBelowFixedMin ||
                      !walletAddress.trim() ||
                      !!walletError ||
                      isWalletValidating ||
                      hasDecimalPlacesError
                    }
                    className={`flex-1 font-semibold py-2 sm:py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base ${isSubmitting || !walletAddress.trim() || !!walletError
                      ? "bg-gray-500 cursor-not-allowed text-white"
                      : "bg-[#1D8751] hover:bg-[#166b3f] text-white"
                      }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                        <span>{t("rates.processing", "Processing...")}</span>
                      </>
                    ) : (
                      <span className="tracking-wide">EXCHANGE</span>
                    )}
                  </button>
                </div>
              </>
            )
            ) : (
              isRatesFxpWithdrawal ? (
              <ForexWithdrawal
                payAmount={parseFloat(amount) || 0}
                getAmount={parseFloat(receiveAmount) || 0}
                selectedPaymentDetails={selectedPaymentDetails}
              />
            ) : (
              // Withdrawal Mode: Show destination address + QR after submission (crypto)
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm sm:text-base text-[#35353e] dark:text-[#788099] font-semibold mb-2">
                    USDT Wallet Address
                  </h3>
                  {shouldShowTemporaryWalletAddressNotice && (
                    <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 mb-3">
                      This wallet address is temporary and may change if you repeat this process. Please use the latest generated address.
                    </p>
                  )}
                  <div className="border border-[#1D8751] rounded-xl p-3 sm:p-4">
                    {withdrawalAddress ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[#35353e] dark:text-[#788099] text-xs sm:text-sm font-mono break-all">
                          {withdrawalAddress}
                        </span>
                        <CopyButton
                          value={withdrawalAddress}
                          className="text-warning hover:text-[#1D8751] transition-colors p-1 rounded"
                          showIcon={true}
                          showInlineMessage={true}
                        />
                      </div>
                    ) : (
                      <p className="text-[#1D8751] text-sm">
                        Transaction submitted successfully. Waiting for address...
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="border border-[#A2A4A9FF] dark:border-[#35353E] rounded-xl p-4 flex justify-center">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="QR Code" className="w-44 h-44 sm:w-48 sm:h-48" />
                    ) : (
                      <p className="text-[#7e7e8f] dark:text-[#788099] text-sm">QR Code not available</p>
                    )}
                  </div>
                </div>

                <ExpressBankWithdrawalTermsPanel
                  expandedTerms={expandedP2pWithdrawalTerms}
                  setExpandedTerms={setExpandedP2pWithdrawalTerms}
                  variant="dashboard"
                  isDark={isDark}
                  {...resolveExpressBankWithdrawalTermsFields({
                    paymentDetail:
                      selectedPaymentDetail || selectedPaymentDetails[0],
                    providerData: selectedProviderData,
                    payBank,
                    asset: selectedAsset,
                  })}
                />

                <div className="mt-4">
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
                      input[type="checkbox"].rates-p2p-terms-checkbox:checked {
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
                      className="rates-p2p-terms-checkbox mt-1 mr-3 w-4 h-4 rounded border-2 border-[#1D8751] focus:ring-[#1D8751] appearance-none bg-transparent checked:bg-[#1D8751] checked:border-[#1D8751] flex-shrink-0"
                      checked={isP2pWithdrawalTermsAccepted}
                      onChange={(e) =>
                        setIsP2pWithdrawalTermsAccepted(e.target.checked)
                      }
                    />
                    <span className="text-[#35353e] dark:text-[#788099] text-sm">
                      I confirm that I have read and accepted all the terms listed
                      above and the{" "}
                      <button
                        type="button"
                        className="text-[#1D8751] cursor-pointer hover:underline"
                        onClick={() =>
                          openLegalModal(
                            "Terms of Service",
                            EXPRESS_P2P_WITHDRAWAL_TERMS_OF_SERVICE_MODAL
                          )
                        }
                      >
                        Terms of Service
                      </button>
                      , together with the{" "}
                      <button
                        type="button"
                        className="text-[#1D8751] cursor-pointer hover:underline"
                        onClick={() =>
                          openLegalModal("Privacy Policy", [
                            "OMAYA collects only the information necessary to provide secure withdrawal services, including identity, wallet/account, transaction, and technical session data.",
                            "Your data is used for transaction processing, fraud prevention, account security, customer support, service improvement, and legal/compliance obligations.",
                            "We implement technical and organizational safeguards to protect your data, but you are also responsible for safeguarding account credentials and devices.",
                            "Data may be shared with payment partners, compliance providers, and regulators where required to complete transactions or satisfy legal obligations.",
                            "By using the service, you consent to data handling described in this policy and acknowledge that retention periods may apply for audit, legal, and security purposes.",
                          ])
                        }
                      >
                        Privacy Policy
                      </button>
                      ,{" "}
                      <button
                        type="button"
                        className="text-[#1D8751] cursor-pointer hover:underline"
                        onClick={() =>
                          openLegalModal("Payment Policies", [
                            "Withdrawals are processed based on available liquidity, provider uptime, and internal risk controls. Processing time estimates are not guaranteed settlement deadlines.",
                            "You must ensure that submitted payment details are valid and compatible with the selected provider. Incorrect details can lead to delays or failed payouts.",
                            "Applicable charges may include network fees, provider fees, and platform commissions. Final settlement values may differ slightly from initial estimates.",
                            "Transactions may be placed on hold for verification if unusual patterns, mismatched identity data, or suspicious activity is detected.",
                            "Payments may be rejected, reversed, or returned where required by provider rules, legal obligations, or operational risk controls.",
                          ])
                        }
                      >
                        Payment Policies
                      </button>
                      ,{" "}
                      <button
                        type="button"
                        className="text-[#1D8751] cursor-pointer hover:underline"
                        onClick={() =>
                          openLegalModal("AML", [
                            "OMAYA enforces Anti-Money Laundering (AML) controls to detect and prevent illicit financial activity across all withdrawal and exchange operations.",
                            "You may be required to complete identity verification (KYC), provide source-of-funds information, or submit additional supporting documentation.",
                            "Transactions linked to sanctioned entities, high-risk patterns, structuring behavior, or suspicious blockchain activity may be delayed or blocked.",
                            "OMAYA may file reports to relevant authorities and cooperate with lawful investigations where required by applicable regulations.",
                            "Use of this service confirms your commitment to lawful financial activity and compliance with AML/CFT obligations.",
                          ])
                        }
                      >
                        AML
                      </button>
                      ,{" "}
                      <button
                        type="button"
                        className="text-[#1D8751] cursor-pointer hover:underline"
                        onClick={() =>
                          openLegalModal("Risk Disclosure Statements", [
                            "Digital asset and fiat settlement services involve operational, market, network, and counterparty risks that may affect execution and timing.",
                            "Blockchain transactions can be delayed, congested, or irreversible depending on network conditions and confirmation requirements.",
                            "Quoted prices and estimated outputs can change before completion due to volatility, liquidity shifts, and provider-side updates.",
                            "Service interruptions, maintenance, third-party outages, and regulatory actions may temporarily limit or suspend certain transaction paths.",
                            "By proceeding, you acknowledge these risks and accept responsibility for transaction decisions made on the platform.",
                          ])
                        }
                      >
                        Risk Disclosure Statements
                      </button>
                      .
                    </span>
                  </label>
                </div>

                <div className="mt-2 p-1 bg-[#1D8751] bg-opacity-10 border border-[#1D8751] rounded-xl">
                  <button
                    onClick={handleProceedToExchanging}
                    disabled={
                      isSubmitting ||
                      hasDecimalPlacesError ||
                      !isP2pWithdrawalTermsAccepted
                    }
                    className={`w-full font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      isSubmitting || !isP2pWithdrawalTermsAccepted
                        ? "bg-gray-500 cursor-not-allowed text-white"
                        : "bg-[#1D8751] hover:bg-[#166b3f] text-white"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>{t("rates.processing", "Processing...")}</span>
                      </>
                    ) : (
                      <span className="tracking-wide">EXCHANGE</span>
                    )}
                  </button>
                </div>
              </div>
            )
            )}
          </div>
        </>
      )}

      {/* PaymentMethodsModal - exact as express withdrawal */}
      <PaymentMethodsModal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onAdd={async () => {
          try {
            await Promise.all([
              dispatch(fetchUserPaymentDetails()).unwrap(),
              dispatch(fetchAdminWalletList()).unwrap(),
            ]);
            showToast.success("Payment method added successfully!");
          } catch {
            showToast.error("Payment method added, but failed to refresh. Please reload the page.");
          }
        }}
      />
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        onContactUs={() => {
          setIsInfoModalOpen(false);
          window.open("https://wa.me/252615066247", "_blank");
        }}
      />
        </div>
      </div>
      {legalModal && (
        <div className="fixed inset-0 z-[9990] bg-black/60 flex items-center justify-center p-3 sm:p-4 sm:pl-16">
          <div className="w-full max-w-3xl h-[70vh] bg-white dark:bg-[#18181D] rounded-2xl border border-border dark:border-accent overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-accent">
              <h3 className="text-sm sm:text-base font-semibold text-[#35353e] dark:text-white">
                {legalModal.title}
              </h3>
              <button
                type="button"
                className="text-[#1D8751] hover:text-[#166b3e] text-sm font-semibold"
                onClick={() => setLegalModal(null)}
              >
                Close
              </button>
            </div>
            <div className="w-full h-full overflow-y-auto p-4 sm:p-6 text-sm leading-6 text-[#35353e] dark:text-[#D6D6E0] space-y-3">
              {legalModal.content.map((line, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#1D8751] font-semibold">{idx + 1}.</span>
                  <p>{line}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <FrozenAccountModal
        isOpen={showFrozenModal}
        onClose={() => setShowFrozenModal(false)}
      />
    </>
  );
};

export default RatesCalculator;
