"use client";
import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { FaExchangeAlt, FaExclamationCircle } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../../../store";
import {
  fetchUserPaymentDetails,
  fetchAdminWalletList,
} from "../../../../exchange/slices/paymentSlice";
import {
  fetchPublicPaymentMethods,
} from "../../../../p2p/slices/paymentMethodsSlice";
import { fetchAssets, createDeposit } from "../../../../exchange/slices/exchangeSlice";
import {
  fetchSupportedAssets,
  fetchSwapEstimate,
} from "../../../../swap/slices/swapSlice";
import { validateWalletAddress } from "../../../../../lib/addressValidaion";
import { showToast } from "../../../../../lib/utils/toast";
import {
  enforceExpressAmountDigitLimit,
  EXPRESS_AMOUNT_DIGIT_LIMIT_MESSAGE,
  getExpressAmountFieldErrorsFromResponse,
  mapExpressAmountApiMessages,
  resolveExpressAmountInlineError,
} from "@/lib/utils/expressAmountValidation";
import {
  buildExpressMinAmountErrorText,
  formatExpressMinAmountMessage,
  isExpressBelowMinAmountError,
  normalizeExpressApiErrorMessage,
  resolveExpressMinAmountDisplayError,
} from "@/lib/utils/expressMinAmount";
import { reportAssetLoadIssue } from "@/lib/utils/assetLoadNotice";
import { useExpressI18n } from "@/lib/useExpressI18n";
import { DepositResponse } from "../../../../exchange/types";
import { SupportedAsset } from "../../../../swap/types";
import { FaSearch } from "react-icons/fa";
import {
  createExpressWithdrawal,
  fetchCommissionDetails,
  fetchExchangeCommissionLookup,
  getCommissionApiAsset,
  type CommissionLookupResponse,
  getExchangeLookupParams,
  type ExchangeCommissionLookupResponse,
  isExchangeCommissionLookupAsset,
  isForexPrimusAsset,
} from "../../../api";
import {
  ExpressWithdrawalPayload,
  ExpressWithdrawalResponse,
} from "../../../types";
import PaymentMethodsModal from "../../../../p2p/components/ui/p2pdashboard/sections/PaymentMethodsModal";
import InfoModal from "./info";
import { debugAssetFetching } from "../../../../../lib/utils/debugAssets";
import { stripLeadingZerosFromDecimalInput } from "@/lib/utils/decimalAmountInput";
import { swapAmountValueClass } from "@/features/swap/components/swapFieldStyles";
import {
  useAssetsDisplay,
  usePaymentMethodsDisplay,
} from "../../../hooks/useDataDisplay";
import { useChangeNowAssetsContext } from "@/features/express/home/context/ChangeNowAssetsProvider";
import CustomSelect from "@/components/ui/HomeCommonSelect";
import { AssetWithNetworkIcon } from "@/components/ui/AssetWithNetworkIcon";
import ForexWithdrawal from "./ForexWithdrawal";
import { useTheme } from "@/context/theme";
import {
  buildExpressRedirectPath,
  setAuthRedirectPath,
  setExpressHomeFormState,
} from "@/lib/utils/authRedirect";
import { openKYCModal, checkKYCStatus } from "@/features/auth/slices/authSlice";
import {
  ASSET_ICON_BASE_CLASS,
  ASSET_ICON_SIZE,
  getHighResAssetIcon,
  getHighResPaymentLogo,
  PAYMENT_LOGO_BASE_CLASS,
  PAYMENT_LOGO_SIZE,
} from "@/features/express/utils/imageHelpers";
import {
  AssetDropdownVirtualized,
  buildAssetDropdownRows,
} from "@/features/express/components/forms/AssetDropdownVirtualized";
import {
  assetMatchesSearchTerm,
  compareAssetsForDisplay,
} from "@/lib/utils/assetSearch";
import {
  ExpressBankWithdrawalTermsPanel,
  resolveExpressBankWithdrawalTermsFields,
} from "@/features/express/components/legal/ExpressBankWithdrawalTermsPanel";
import { ExpressLegalTermsLinks } from "@/features/express/components/legal/ExpressLegalTermsLinks";
import { CryptoSendOnlyWarningBanner } from "@/features/express/components/CryptoSendOnlyWarningBanner";
import { getCryptoDepositAddressHeading } from "@/lib/utils/cryptoSendWarning";
import {
  resolveAllUserPaymentAccounts,
  getRegisteredAccountDropdownList,
  findAddedPaymentDetail,
  refreshRegisteredAccountsAfterAdd,
  type RegisteredAccountDetail,
} from "@/features/express/utils/registeredAccountHelpers";

const MISSING_USDT_USD_RATE_ERROR =
  "No exchange rate configured for USDT to USD";
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
const buildNegativeReceiveError = (value: number) =>
  `${NEGATIVE_RECEIVE_ERROR} Calculated value: ${value.toFixed(2)}.`;
const ASSET_ICON_FALLBACK_URL = "/assets/image_7_jijlik.png";
const FX_PRIMUS_ASSET_ICON_URL = "/assets/fx-primus-custom.svg";

/** When ChangeNOW public tokens omit FX Primus, still show it under Popular on home express withdrawal. */

const getAssetDropdownIcon = (asset: any): string => {
  if (isForexPrimusAsset(asset)) {
    return FX_PRIMUS_ASSET_ICON_URL;
  }
  return getHighResAssetIcon(asset, ASSET_ICON_SIZE) || ASSET_ICON_FALLBACK_URL;
};

/** Parse amount allowing comma as decimal separator (e.g. "0,1" → 0.1) */
const parseLocalizedAmountString = (raw: string): number => {
  if (raw === "" || raw === "-") return 0;
  const normalized = String(raw).trim().replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
};

const formatAmountForInput = (n: number): string => {
  if (!Number.isFinite(n)) return "";
  if (n === 0) return "0";
  const s = n.toFixed(8).replace(/\.?0+$/, "");
  return s || "0";
};

type UserPaymentDetail = RegisteredAccountDetail;

const getPublicProviderName = (provider: any): string =>
  String(provider?.provider_name || provider?.payment_provider_name || "").trim();

/** Match deposit form: prefer Salaam, else second provider, else first. */
const getDefaultPublicPaymentProvider = (providers: any[]) => {
  if (!providers.length) return null;
  const salaamProvider = providers.find((provider) =>
    getPublicProviderName(provider).toLowerCase().includes("salaam")
  );
  if (salaamProvider) return salaamProvider;
  return providers[1] || providers[0];
};

const isUuid = (value: unknown): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim()
  );

const extractApiErrorMessage = (error: any, fallback: string): string => {
  const cleanMessage = (msg: string): string => {
    const v = String(msg || "").trim();
    if (!v) return "";
    if (/request failed with status code 400/i.test(v)) return "";
    return v;
  };
  const toUserFacingMessage = (message: string): string => {
    const v = String(message || "").trim();
    if (!v) return v;
    return normalizeExpressApiErrorMessage(v, error?.response?.data, error);
  };
  const toFrozenMessageIfNeeded = (message: string): string => {
    const normalized = message.toLowerCase();
    const isFrozenError =
      (normalized.includes("account") || normalized.includes("payment detail")) &&
      (normalized.includes("frozen") ||
        normalized.includes("freeze") ||
        normalized.includes("blocked") ||
        normalized.includes("suspend") ||
        normalized.includes("disabled"));
    return isFrozenError
      ? "This account is frozen. Please contact Customer Support."
      : message;
  };

  const responseData = error?.response?.data;
  if (typeof responseData === "string" && responseData.trim()) {
    return toFrozenMessageIfNeeded(toUserFacingMessage(responseData));
  }

  const direct =
    responseData?.message ||
    responseData?.error ||
    responseData?.response_data?.message ||
    responseData?.response_data?.error ||
    responseData?.details ||
    responseData?.detail ||
    "";
  const cleanedDirect = cleanMessage(direct);
  if (cleanedDirect) {
    return toFrozenMessageIfNeeded(toUserFacingMessage(cleanedDirect));
  }

  if (typeof error === "string") {
    const cleanedStringError = cleanMessage(error);
    if (cleanedStringError) {
      return toFrozenMessageIfNeeded(toUserFacingMessage(cleanedStringError));
    }
  }

  if (error?.message) {
    const cleanedMessage = cleanMessage(String(error.message));
    if (cleanedMessage) {
      return toFrozenMessageIfNeeded(toUserFacingMessage(cleanedMessage));
    }
  }

  if (typeof direct === "string" && direct.trim()) {
    return toFrozenMessageIfNeeded(toUserFacingMessage(direct));
  }

  const fieldErrors = responseData?.errors || responseData?.error;
  if (fieldErrors && typeof fieldErrors === "object" && !Array.isArray(fieldErrors)) {
    const firstKey = Object.keys(fieldErrors)[0];
    if (firstKey) {
      const value = fieldErrors[firstKey];
      if (Array.isArray(value) && value.length > 0) {
        return toFrozenMessageIfNeeded(
          toUserFacingMessage(`${firstKey}: ${String(value[0])}`)
        );
      }
      if (typeof value === "string" && value.trim()) {
        return toFrozenMessageIfNeeded(
          toUserFacingMessage(`${firstKey}: ${value}`)
        );
      }
    }
  }

  return toUserFacingMessage(fallback);
};

const FROZEN_ACCOUNT_MESSAGE =
  "This account is frozen. Please contact Customer Support.";

const normalizePaymentStatus = (status?: string) =>
  (status || "").toString().trim().toLowerCase();

const isApprovedPaymentStatus = (status?: string) =>
  [
    "approved",
    "verified",
    "active",
    "enabled",
    "accepted",
    "completed",
    "success",
  ].includes(normalizePaymentStatus(status));

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
    ? FROZEN_ACCOUNT_MESSAGE
    : "Selected payment method is pending verification";

// Add UserPaymentSelector component
const UserPaymentSelector = ({
  userPaymentDetails,
  onSelect,
  onRemove,
  selectedDetails,
  adminWalletListDisplay,
}: {
  userPaymentDetails: UserPaymentDetail[];
  onSelect: (detail: UserPaymentDetail) => void;
  onRemove: (detail: UserPaymentDetail) => void;
  selectedDetails: UserPaymentDetail[];
  adminWalletListDisplay: any;
}) => {
  return (
    <div className="bg-[#1D1D23] rounded-2xl border border-[#39394a] p-4">
      <h3 className="text-white font-semibold mb-3">Select Payment Methods</h3>
      <div className="space-y-2">
        {userPaymentDetails && userPaymentDetails.length > 0 ? (
          userPaymentDetails.map((detail) => {
            const isSelected = selectedDetails.some((d) => d.id === detail.id);

            return (
              <div
                key={detail.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${isSelected
                  ? "border-[#1D8751] bg-[#1D8751]/10"
                  : "border-[#A2A4A9FF] bg-[#A2A4A9FF]"
                  }`}
              >
                <div className="flex-1">
                  <div className="text-white font-medium">
                    {(() => {
                      // Get the admin provider name for this payment method
                      const adminDetail = adminWalletListDisplay.displayData?.find(
                        (wallet: any) => wallet.admin_payment_detail?.payment_method_type === detail.payment_method_name
                      )?.admin_payment_detail;

                      return adminDetail?.provider_name || detail.payment_provider_name || detail.provider_name || "Unknown Provider";
                    })()} - {detail.account_name || detail.account_number}
                  </div>
                  <div className="text-[#788099] text-sm">
                    {detail.account_name} ({detail.account_number})
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isSelected
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
          <div className="text-center text-[#788099] py-4">
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
    paymentDetail: any;
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
    paymentDetails?: UserPaymentDetail[];
  }) => void;
  mode: "deposit" | "withdrawal";
  onModeChange?: (mode: "deposit" | "withdrawal") => void;
  isHomePage?: boolean;
  initialState?: {
    mode?: "deposit" | "withdrawal";
    amountValue?: number;
    amountInput?: string;
    receiveAmountValue?: number;
    receiveAmountInput?: string;
    asset?: any;
    paymentDetails?: UserPaymentDetail[];
    payBank?: string;
    payment?: {
      provider_name?: string;
      payment_provider_name?: string;
      [key: string]: unknown;
    };
    walletAddress?: string;
    selectedNetwork?: any;
    termsAccepted?: boolean;
    isFirstCardSubmitted?: boolean;
    isTransactionSubmitted?: boolean;
    expandedTerms?: boolean;
    withdrawalAddress?: string;
    payoutAddress?: string;
    qrCodeUrl?: string;
    transactionId?: string;
    responseMessage?: string;
    websocketUrl?: string;
  };
}

// Network mapping function
const getNetworkDisplayName = (network: string) => {
  const networkMap: { [key: string]: string } = {
    'bsc': 'BSC',
    'matic': 'Polygon',
    'avaxc': 'Avalanche',
    'eth': 'Ethereum',
    'osmo': 'Osmosis',
    'band': 'Band Protocol',
    'sol': 'Solana',
    'nano': 'Nano',
    'sxp': 'Solar',
    'luna': 'Terra',
    'base': 'Base',
    'trc20': 'TRON',
    'trx': 'TRON',
    'fxprimus': 'FXPrimus'
  };

  return networkMap[network?.toLowerCase()] || network || 'Unknown';
};

export default function WithdrawalForm({
  onExchange,
  mode,
  onModeChange,
  isHomePage = false,
  initialState,
}: DepositFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { t } = useExpressI18n();
  const [transactionMode, setTransactionMode] = useState<"crypto" | "forex">("crypto");

  // Declare all refs early to avoid initialization errors
  const paymentDetailsRef = useRef<HTMLDivElement>(null);
  const assetListRef = useRef<HTMLDivElement>(null);
  const assetDropdownRef = useRef<HTMLDivElement>(null);
  const assetDropdownContentRef = useRef<HTMLDivElement | null>(null);
  const estimateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Blocks estimate effects from clearing submit errors (e.g. ChangeNOW min amount). */
  const submitAmountErrorRef = useRef<string | null>(null);

  const isForexAsset = (asset: any) => isForexPrimusAsset(asset);
  const getFxpReversePayAmount = (receiveAmount: number): number => {
    if (!Number.isFinite(receiveAmount)) return 0;
    const feeFromPayload = Number(apiCommissionDetails?.calculated_fee ?? apiCommissionDetails?.fee);
    if (Number.isFinite(feeFromPayload) && feeFromPayload >= 0) {
      return receiveAmount + feeFromPayload;
    }
    const mode = (apiCommissionDetails?.commission_mode || "").toString().toLowerCase();
    const isPercentageFlag = apiCommissionDetails?.is_percentage;
    const treatAsFlatFee = mode === "flat_fee" || isPercentageFlag === false;
    if (treatAsFlatFee) {
      return receiveAmount;
    }
    const rate = Number(apiCommissionDetails?.commission_rate ?? apiCommission ?? 0);
    if (Number.isFinite(rate) && rate > 0 && rate < 100) {
      return receiveAmount / (1 - rate / 100);
    }
    return receiveAmount;
  };

  const { adminPaymentDetails, adminWalletList, loading, error } = useSelector(
    (state: any) => state.payment
  );

  // Add public payment methods state for home page
  const { publicPaymentMethods, publicMethodsLoading, publicMethodsError, adminMethods, loading: adminMethodsLoading, error: adminMethodsError } = useSelector(
    (state: any) => state.paymentMethods
  );
  const [directPublicPaymentMethods, setDirectPublicPaymentMethods] = useState<any>(null);
  const activePublicPaymentMethods = directPublicPaymentMethods || publicPaymentMethods;
  const activePublicProviders = useMemo(() => {
    if (Array.isArray(activePublicPaymentMethods?.data?.providers)) {
      return activePublicPaymentMethods.data.providers;
    }
    if (Array.isArray(activePublicPaymentMethods?.data)) {
      return activePublicPaymentMethods.data;
    }
    if (Array.isArray(activePublicPaymentMethods)) {
      return activePublicPaymentMethods;
    }
    return [];
  }, [activePublicPaymentMethods]);

  const { assets, loading: assetsLoading } = useSelector(
    (state: any) => state.exchange
  );
  const {
    assets: publicAssets,
    loading: publicAssetsLoading,
  } = useChangeNowAssetsContext();

  // Add swap assets state
  const {
    supportedAssets: swapAssets,
    loading: swapAssetsLoading,
    error: swapAssetsError,
  } = useSelector((state: any) => state.swap);
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const { isDark } = useTheme();

  const exchangeAssetsSource = isHomePage ? publicAssets : assets?.assets;
  const swapAssetsSource = isHomePage ? [] : swapAssets;
  const exchangeAssetsLoadingState = isHomePage
    ? publicAssetsLoading
    : assetsLoading;
  const swapAssetsLoadingState = isHomePage ? false : swapAssetsLoading;
  const exchangeAssetsErrorState = null;
  const swapAssetsErrorState = isHomePage ? null : swapAssetsError;
  const requiresLoginRedirect = isHomePage && !isAuthenticated;
  const shouldHideGuestPaymentDetails = isHomePage && !isAuthenticated;

  // Use the data display hooks for consistent data handling
  const assetsDisplay = useAssetsDisplay(
    exchangeAssetsSource,
    swapAssetsSource,
    exchangeAssetsLoadingState,
    swapAssetsLoadingState,
    exchangeAssetsErrorState,
    swapAssetsErrorState
  );

  // Add user payment details state - check both slices
  const { userPaymentDetails, loading: userPaymentLoading } = useSelector(
    (state: any) => state.payment
  );

  // Also check paymentMethods slice (some components use this)
  const { userPaymentDetails: userPaymentDetailsFromP2P, userDetailsLoading: userDetailsLoadingP2P } = useSelector(
    (state: any) => state.paymentMethods || {}
  );

  // Use whichever has data, prefer payment slice
  const effectiveUserPaymentDetailsFromRedux = userPaymentDetails?.length > 0
    ? userPaymentDetails
    : (userPaymentDetailsFromP2P?.length > 0 ? userPaymentDetailsFromP2P : []);

  // Process payment methods data based on API structure - prioritize public payment methods
  const processedPaymentMethods = useMemo(() => {
    const publicSource = directPublicPaymentMethods || publicPaymentMethods;

    // Always try to use public payment methods first (they have logos)
    // Handle new API structure for public payment methods
    if (Array.isArray(publicSource?.data?.providers)) {
      return publicSource.data.providers;
    }
    // Check for payment_methods array (older structure)
    if (Array.isArray(publicSource?.data?.payment_methods)) {
      return publicSource.data.payment_methods;
    }
    // Check if publicPaymentMethods itself is an array (fallback)
    if (Array.isArray(publicSource)) {
      return publicSource;
    }

    // Use same admin payment-methods source as deposit form first.
    const adminArray = Array.isArray(adminMethods) && adminMethods.length > 0
      ? adminMethods
      : Array.isArray(adminPaymentDetails)
      ? adminPaymentDetails
      : Array.isArray(adminPaymentDetails?.data)
      ? adminPaymentDetails.data
      : [];
    return adminArray;
  }, [directPublicPaymentMethods, publicPaymentMethods, adminMethods, adminPaymentDetails]);

  // Extract payment method names based on the API structure - same as ExchangeForm
  const getPaymentMethodName = (item: any) => {
    // For user payment details (old structure)
    if (item?.payment_method_name) {
      return item.payment_method_name;
    }
    // For public payment methods provider structure (new structure)
    if (item?.method?.method_name) {
      return item.method.method_name;
    }
    // For public payment methods (older structure)
    if (item?.method_name) {
      return item.method_name;
    }
    return null;
  };

  // Normalize payment method names to handle mismatches between user details and API
  const normalizePaymentMethodName = (methodName: string | null | undefined): string | null => {
    if (!methodName || typeof methodName !== 'string') return null;

    // Map variations to standard method names
    const methodMap: Record<string, string> = {
      'Money_Transfer': 'Money_Transfer', // Keep as is, will be filtered if not in API
      'money_transfer': 'Money_Transfer',
      'Money Transfer': 'Money_Transfer',
      'money transfer': 'Money_Transfer',
    };

    const normalized = methodMap[methodName] || methodName;
    return normalized;
  };

  // Get unique payment methods from processed data
  const uniquePaymentMethods = Array.from(
    new Set((processedPaymentMethods || []).map(getPaymentMethodName).filter(Boolean))
  ).filter(method => method && typeof method === 'string' && method.trim().length > 0) as string[];

  // Get available payment method names from API (for comparison with user payment details)
  const availablePaymentMethodNames = useMemo(() => {
    const methods = new Set<string>();

    // Extract from public payment methods API response
    if (Array.isArray(publicPaymentMethods?.data?.providers)) {
      publicPaymentMethods.data.providers.forEach((provider: any) => {
        const methodName = getPaymentMethodName(provider);
        if (methodName) {
          methods.add(methodName);
        }
      });
    }

    // Also include from processed payment methods
    uniquePaymentMethods.forEach(method => {
      if (method) methods.add(method);
    });

    const methodList: string[] = Array.from(methods);

    // Debug: Log comparison between user payment details and API methods
    if (userPaymentDetails && Array.isArray(userPaymentDetails) && userPaymentDetails.length > 0) {
      const userMethodNames = new Set<string>(
        userPaymentDetails
          .map((detail: any) => normalizePaymentMethodName(detail?.payment_method_name))
          .filter((m): m is string => m !== null && typeof m === 'string')
      );

      const userMethodsArray: string[] = Array.from(userMethodNames);
    }

    return methodList;
  }, [publicPaymentMethods, uniquePaymentMethods, userPaymentDetails]);

  // Add "Bank" as a default option if not already present
  const validPaymentMethods = uniquePaymentMethods.filter(method =>
    method && typeof method === 'string' && method.trim().length > 0
  );

  const allPaymentMethods = validPaymentMethods.includes("Bank")
    ? validPaymentMethods
    : ["Bank", ...validPaymentMethods];

  // Fallback payment methods if data is corrupted or not loaded yet
  const fallbackPaymentMethods = ["Bank", "Crypto", "Forex", "Mobile", "Marchant"];
  const finalPaymentMethods = allPaymentMethods.length > 0 && allPaymentMethods.every(method =>
    typeof method === 'string' && method.trim().length > 0
  ) ? allPaymentMethods : fallbackPaymentMethods;

  // Use refs to keep payment methods stable across ALL re-renders (never cleared)
  const paymentMethodsRef = useRef<any[]>([]);
  const userPaymentMethodsRef = useRef<any[]>([]);
  const walletListRef = useRef<any[]>([]);

  const paymentMethodsDisplay = usePaymentMethodsDisplay(
    finalPaymentMethods,
    isHomePage ? publicMethodsLoading : adminMethodsLoading || loading,
    isHomePage ? publicMethodsError : adminMethodsError || error
  );

  const userPaymentMethodsDisplay = usePaymentMethodsDisplay(
    userPaymentDetails,
    userPaymentLoading,
    null
  );

  // Update refs whenever we get new payment data
  useEffect(() => {
    if (adminPaymentDetails && adminPaymentDetails.length > 0) {
      const activeMethods = adminPaymentDetails.filter((payment: any) => {
        if (payment.is_active === undefined || payment.is_active === null) return true;
        return payment.is_active === true || payment.is_active === 'true' || payment.is_active === 1 || payment.is_active === '1';
      });

      if (activeMethods.length > 0) {
        paymentMethodsRef.current = activeMethods;
      }
    }
  }, [adminPaymentDetails]);

  // Get full Redux payment state at component level (not in useEffect)
  const fullPaymentState = useSelector((state: any) => state.payment);

  useEffect(() => {
    if (userPaymentDetails && userPaymentDetails.length > 0) {
      userPaymentMethodsRef.current = userPaymentDetails;
    }
  }, [userPaymentDetails, userPaymentLoading, fullPaymentState]);

  // Always use ref data - completely stable, never changes unless ref is updated
  const effectivePaymentMethods = paymentMethodsRef.current;
  const effectiveUserPaymentMethods = userPaymentMethodsRef.current;

  // Fetch public payment methods for withdrawal (always fetch, not just for home page)
  useEffect(() => {
    dispatch(fetchPublicPaymentMethods());
  }, [dispatch]);

  // Public payment methods are served by the cached Redux thunk dispatched above
  // (fetchPublicPaymentMethods). No separate raw fetch needed here.

  // Initialize refs with cached data IMMEDIATELY on mount (runs only once)
  useEffect(() => {
    if (isHomePage) return;

    const initializePaymentMethods = async () => {
      try {
        const { sliceCache } = await import("@/lib/utils/sliceCache");

        // Load admin payment methods
        const cachedAdmin = await sliceCache.get<any[]>('payment', 'fetchAdminPaymentDetails');
        if (cachedAdmin && cachedAdmin.length > 0) {
          const filtered = cachedAdmin.filter((p: any) =>
            p.is_active === undefined || p.is_active === null || p.is_active === true || p.is_active === 'true'
          );

          // Initialize ref FIRST
          paymentMethodsRef.current = filtered;

          dispatch({
            type: 'payment/fetchAdminPaymentDetails/fulfilled',
            payload: cachedAdmin,
          });
        }

        // Load user payment methods
        const cachedUser = await sliceCache.get<any[]>('payment', 'fetchUserPaymentDetails');
        if (cachedUser && cachedUser.length > 0) {
          // Initialize ref FIRST
          userPaymentMethodsRef.current = cachedUser;

          dispatch({
            type: 'payment/fetchUserPaymentDetails/fulfilled',
            payload: cachedUser,
          });
        }
      } catch (error) {
        // Silent fail
      }
    };

    initializePaymentMethods();
  }, []); // Empty deps - runs only once on mount

  // Update wallet list ref whenever we get new data
  useEffect(() => {
    if (adminWalletList && adminWalletList.length > 0) {
      const displayData = adminWalletList.filter((wallet: any) => {
        const paymentDetail = wallet?.admin_payment_detail;
        if (!paymentDetail) return false;

        if (paymentDetail.is_active === undefined || paymentDetail.is_active === null) return true;

        return paymentDetail.is_active === true ||
          paymentDetail.is_active === 'true' ||
          paymentDetail.is_active === 1 ||
          paymentDetail.is_active === '1';
      });

      if (displayData.length > 0) {
        walletListRef.current = displayData;
      }
    }
  }, [adminWalletList]);

  // Always use ref data - completely stable
  const adminWalletListDisplay = {
    displayData: walletListRef.current,
    isLoading: loading && (!adminWalletList || adminWalletList.length === 0),
    hasData: walletListRef.current.length > 0,
  };

  const fallbackProviderNames = ["Bank", "Crypto", "Forex", "Mobile", "Marchant"];



  // Debug function to test asset fetching
  const handleDebugAssets = async () => {
    try {

      await dispatch(fetchAssets(true)).unwrap();


      await dispatch(
        fetchSupportedAssets({ forceRefresh: true, feature: "exchange" })
      ).unwrap();

    } catch (error) {
    }
  };

  // Force refresh assets
  const handleForceRefreshAssets = async () => {
    try {
      await dispatch(
        fetchSupportedAssets({ forceRefresh: true, feature: "exchange" })
      ).unwrap();
    } catch (error) {
    }
  };

  const [payAmount, setPayAmount] = useState(initialState?.amountValue ?? 100);
  const [payBank, setPayBank] = useState(
    initialState?.payBank ||
      initialState?.paymentDetails?.[0]?.payment_provider_name ||
      initialState?.payment?.provider_name ||
      initialState?.payment?.payment_provider_name ||
      ""
  );
  const [selectedProviderData, setSelectedProviderData] =
    useState<any>(initialState?.paymentDetails?.[0] || null);
  const [getAmount, setGetAmount] = useState(
    initialState?.receiveAmountValue ?? initialState?.amountValue ?? 0
  );
  const [payAmountInput, setPayAmountInput] = useState(
    initialState?.amountInput ?? "100"
  );
  const [getAmountInput, setGetAmountInput] = useState(
    initialState?.receiveAmountInput ?? initialState?.amountInput ?? ""
  );

  // Keep receive amount non-negative; OTC threshold check is handled separately.
  const MAX_RECEIVE_AMOUNT_USD = 15000;
  const capReceiveAmount = (value: number) => Math.max(0, Number(value));

  const [selectedAsset, setSelectedAsset] = useState<any>(
    initialState?.asset || null
  );
  const [selectedNetwork, setSelectedNetwork] = useState<any>(
    initialState?.selectedNetwork ?? null
  );
  const [isCalculatingFromPay, setIsCalculatingFromPay] = useState(true);
  const [walletAddress, setWalletAddress] = useState(initialState?.walletAddress ?? "");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commissionRefreshSeed, setCommissionRefreshSeed] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  // Add state for payment method validation error
  const [paymentMethodError, setPaymentMethodError] = useState<string | null>(null);
  // Add state for wallet address copy feedback
  const [isWalletAddressCopied, setIsWalletAddressCopied] = useState(false);
  // Add state for API response data
  const [withdrawalAddress, setWithdrawalAddress] = useState(
    initialState?.withdrawalAddress ?? ""
  );
  const [payoutAddress, setPayoutAddress] = useState(
    initialState?.payoutAddress ?? ""
  );
  const [qrCodeUrl, setQrCodeUrl] = useState(initialState?.qrCodeUrl ?? "");
  const [isTransactionSubmitted, setIsTransactionSubmitted] = useState(
    Boolean(initialState?.isTransactionSubmitted)
  );
  const [responseMessage, setResponseMessage] = useState(
    initialState?.responseMessage ?? ""
  );
  const [websocketUrl, setWebsocketUrl] = useState(
    initialState?.websocketUrl ?? ""
  );
  const [transactionId, setTransactionId] = useState(
    initialState?.transactionId ?? ""
  );
  const [isTermsAccepted, setIsTermsAccepted] = useState(
    Boolean(initialState?.termsAccepted)
  );
  const [expandedTerms, setExpandedTerms] = useState(
    Boolean(initialState?.expandedTerms)
  );

  // Forex-specific state for withdrawal
  const [userNotesForex, setUserNotesForex] = useState<string>("");
  const [showForexWithdrawalForm, setShowForexWithdrawalForm] = useState<boolean>(false);
  const selectedAssetTicker = String(
    selectedAsset?.ticker || selectedAsset?.symbol || selectedAsset?.name || ""
  )
    .trim()
    .toUpperCase();
  const shouldShowTemporaryWalletAddressNotice =
    !!selectedAssetTicker &&
    !selectedAssetTicker.includes("USDT") &&
    !selectedAssetTicker.includes("USDC");
  // Asset selection state for search functionality
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [assetSearchTerm, setAssetSearchTerm] = useState("");
  const [assetFilterTab, setAssetFilterTab] = useState<"all" | "new" | "gainers" | "losers">("all");
  const [assetDropdownPosition, setAssetDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    cardLeft: 0,
    cardTop: 0,
    cardWidth: 0,
  });
  const [isComponentMounted, setIsComponentMounted] = useState(false);

  useEffect(() => {
    if (!selectedAsset) return;
    setCommissionRefreshSeed((prev) => prev + 1);
  }, [selectedAsset?.asset_id, selectedAsset?.ticker, selectedAsset?.symbol, selectedAsset?.network]);

  const updateAssetDropdownPosition = useCallback(() => {
    if (!assetDropdownRef.current) {
      return;
    }
    const rect = assetDropdownRef.current.getBoundingClientRect();
    const cardElement = assetDropdownRef.current.closest(
      "[data-asset-card='true']"
    ) as HTMLElement | null;
    const cardRect = cardElement?.getBoundingClientRect();
    const next = {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      cardLeft: cardRect
        ? cardRect.left + window.scrollX
        : rect.left + window.scrollX,
      cardTop: cardRect
        ? cardRect.top + window.scrollY
        : rect.top + window.scrollY,
      cardWidth: cardRect ? cardRect.width : rect.width,
    };
    setAssetDropdownPosition((prev) => {
      const unchanged =
        Math.abs(prev.top - next.top) < 0.5 &&
        Math.abs(prev.left - next.left) < 0.5 &&
        Math.abs(prev.width - next.width) < 0.5 &&
        Math.abs(prev.cardLeft - next.cardLeft) < 0.5 &&
        Math.abs(prev.cardTop - next.cardTop) < 0.5 &&
        Math.abs(prev.cardWidth - next.cardWidth) < 0.5;
      return unchanged ? prev : next;
    });
  }, []);

  // Never show cached payment/account details on home when logged out.
  useEffect(() => {
    if (!shouldHideGuestPaymentDetails) {
      return;
    }
    setSelectedPaymentDetails([]);
    setSelectedPaymentDetail(null);
    setSelectedProviderData(null);
    setPayBank("");
    setPaymentMethodError(null);
  }, [shouldHideGuestPaymentDetails]);

  useEffect(() => {
    setIsComponentMounted(true);
  }, []);

  useEffect(() => {
    if (!isAssetDropdownOpen) {
      return;
    }

    updateAssetDropdownPosition();
    const handleReposition = (event: Event) => {
      const target = event.target;
      if (
        event.type === "scroll" &&
        target instanceof Node &&
        assetDropdownContentRef.current?.contains(target)
      ) {
        return;
      }
      updateAssetDropdownPosition();
    };

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isAssetDropdownOpen, updateAssetDropdownPosition]);

  // Estimate calculation state
  const [estimate, setEstimate] = useState<any>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  // First card submission state
  const [isFirstCardSubmitted, setIsFirstCardSubmitted] = useState(
    Boolean(
      initialState?.isTransactionSubmitted ?? initialState?.isFirstCardSubmitted
    )
  );
  const restoredFromLegal = Boolean(
    initialState?.isTransactionSubmitted ?? initialState?.isFirstCardSubmitted
  );
  const hasRestoredFromLegalRef = useRef(restoredFromLegal);
  const isRestoringFromLegalRef = useRef(restoredFromLegal);

  // Add loading state for "You Receive" calculation
  const [isCalculatingReceive, setIsCalculatingReceive] = useState(false);

  // Add payment selection state
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<
    UserPaymentDetail[]
  >(initialState?.paymentDetails ?? []);

  const handleBeforeLegalNavigate = useCallback(() => {
    if (!isHomePage) return;
    setExpressHomeFormState({
      mode: "withdrawal",
      amountValue: payAmount,
      amountInput: payAmountInput,
      receiveAmountValue: getAmount,
      receiveAmountInput: getAmountInput,
      payBank,
      paymentDetails: selectedPaymentDetails,
      asset: selectedAsset,
      selectedAsset,
      selectedNetwork,
      walletAddress,
      termsAccepted: isTermsAccepted,
      isFirstCardSubmitted: isTransactionSubmitted,
      isTransactionSubmitted,
      expandedTerms,
      withdrawalAddress,
      payoutAddress,
      qrCodeUrl,
      transactionId,
      responseMessage,
      websocketUrl,
    });
  }, [
    isHomePage,
    payAmount,
    payAmountInput,
    getAmount,
    getAmountInput,
    payBank,
    selectedPaymentDetails,
    selectedAsset,
    selectedNetwork,
    walletAddress,
    isTermsAccepted,
    isTransactionSubmitted,
    expandedTerms,
    withdrawalAddress,
    payoutAddress,
    qrCodeUrl,
    transactionId,
    responseMessage,
    websocketUrl,
  ]);

  // Add calculation stability state
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationTimeout, setCalculationTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [calculationComplete, setCalculationComplete] = useState(false);
  const [previousValidAmount, setPreviousValidAmount] = useState<string>("");
  const [isUserModifiedAmount, setIsUserModifiedAmount] = useState(false);


  // Add caching for API responses with timestamp
  const [estimateCache, setEstimateCache] = useState<
    Map<string, { data: any; timestamp: number }>
  >(new Map());

  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Add PaymentMethodsModal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const paymentAddRefreshInFlightRef = useRef(false);
  const paymentAddRefreshErrorToastShownRef = useRef(false);

  const handlePaymentMethodAddSuccess = useCallback(async () => {
    if (paymentAddRefreshInFlightRef.current) return;
    paymentAddRefreshInFlightRef.current = true;
    try {
      const accounts = await refreshRegisteredAccountsAfterAdd(dispatch);
      const match = findAddedPaymentDetail(accounts);
      if (match) {
        setSelectedPaymentDetails([match as UserPaymentDetail]);
      }
      showToast.success("Payment method added successfully!");
    } catch (error) {
      console.error("Failed to refresh payment details:", error);
      if (!paymentAddRefreshErrorToastShownRef.current) {
        paymentAddRefreshErrorToastShownRef.current = true;
        showToast.error(
          "Payment method added, but failed to refresh. Please reload the page."
        );
      }
    } finally {
      paymentAddRefreshInFlightRef.current = false;
    }
  }, [dispatch]);

  useEffect(() => {
    if (isPaymentModalOpen) {
      paymentAddRefreshErrorToastShownRef.current = false;
    }
  }, [isPaymentModalOpen]);

  // Add InfoModal state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Add validation state for minimum receive amount
  const [receiveAmountError, setReceiveAmountError] = useState<string | null>(
    null
  );

  // Add state for API validation errors
  const [apiValidationError, setApiValidationError] = useState<string | null>(null);
  const [apiCommission, setApiCommission] = useState<number | null>(null);
  const [apiCommissionDetails, setApiCommissionDetails] = useState<CommissionLookupResponse | null>(null);
  const commissionFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Exchange commission lookup for first assets (local_commission rules)
  const [exchangeLookupResponse, setExchangeLookupResponse] =
    useState<ExchangeCommissionLookupResponse | null>(null);
  const exchangeLookupFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add calculation error state for display below "You Send" input
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Add state for refresh loading
  const [isRefreshingAccounts, setIsRefreshingAccounts] = useState(false);

  // Add retry counters for remaining fetches (admin wallet, assets, swap assets)
  const [adminWalletRetryCount, setAdminWalletRetryCount] = useState(0);
  const [assetsRetryCount, setAssetsRetryCount] = useState(0);
  const [swapAssetsRetryCount, setSwapAssetsRetryCount] = useState(0);
  const [hasFetchedAdminWallet, setHasFetchedAdminWallet] = useState(false);
  const [hasFetchedAssets, setHasFetchedAssets] = useState(false);
  const [hasFetchedSwapAssets, setHasFetchedSwapAssets] = useState(false);
  const MAX_RETRIES = 2;

  // Filter user payment details based on selected provider
  // Match payment_provider_name from user payment details with provider_name from admin
  const filteredUserPaymentDetails = payBank
    ? ((userPaymentMethodsDisplay.displayData && userPaymentMethodsDisplay.displayData.length > 0
      ? userPaymentMethodsDisplay.displayData
      : effectiveUserPaymentMethods) || []).filter(
      (detail: any) => {
        // Match user payment provider name with selected admin provider name
        return detail.payment_provider_name === payBank;
      }
    )
    : [];

  // Enhanced filtering with fallback options
  const enhancedFilteredUserPaymentDetails = useMemo(() => {
    if (!payBank) {
      return [];
    }

    // Try multiple sources for user payment details
    // Handle different data structures (array, object with data property, etc.)
    // Use effectiveUserPaymentDetailsFromRedux which checks both slices
    let rawUserDetails = effectiveUserPaymentDetailsFromRedux.length > 0
      ? effectiveUserPaymentDetailsFromRedux
      : userPaymentDetails;

    if (rawUserDetails && typeof rawUserDetails === 'object' && !Array.isArray(rawUserDetails)) {
      // Check if data is nested in a data property
      rawUserDetails = (rawUserDetails as any)?.data || (rawUserDetails as any)?.payment_details || rawUserDetails;
    }

    const sourceData = (userPaymentMethodsDisplay.displayData && userPaymentMethodsDisplay.displayData.length > 0
      ? userPaymentMethodsDisplay.displayData
      : (effectiveUserPaymentMethods && effectiveUserPaymentMethods.length > 0
        ? effectiveUserPaymentMethods
        : (Array.isArray(rawUserDetails) ? rawUserDetails : [])));

    const filtered = sourceData.filter((detail: any) => {
      // Match user payment provider name with selected admin provider name
      // Try multiple matching strategies to ensure we catch all cases
      // Also handle format differences (e.g., "Equity Bank" vs "Equity Bank - Bank")
      const normalizeProviderName = (name: string | null | undefined): string => {
        if (!name) return "";
        // Remove " - Method" suffix if present
        const base = name.includes(" - ") ? name.split(" - ")[0].trim() : name.trim();
        return base.toLowerCase();
      };

      // Get the provider field from selected provider (e.g., "Equity Bank" from API)
      // This is the key field to compare with user payment_provider_name
      const selectedProviderField = selectedProviderData?.provider ||
        normalizeProviderName(payBank);

      const normalizedPayBank = normalizeProviderName(payBank);
      const normalizedDetailProvider = normalizeProviderName(detail.payment_provider_name);
      const normalizedDetailName = normalizeProviderName(detail.provider_name);
      const normalizedDetailPaymentProvider = normalizeProviderName(detail.payment_provider);
      const normalizedSelectedProvider = normalizeProviderName(selectedProviderField);

      // Primary comparison: API provider.provider field with user payment_provider_name
      const providerMatch1 = detail.payment_provider_name === selectedProviderField ||
        normalizedDetailProvider === normalizedSelectedProvider ||
        normalizedDetailProvider === normalizedPayBank ||
        detail.payment_provider_name === payBank;

      // Secondary comparisons
      const providerMatch2 = normalizedDetailName === normalizedSelectedProvider ||
        normalizedDetailName === normalizedPayBank ||
        detail.provider_name === payBank;

      const providerMatch3 = normalizedDetailPaymentProvider === normalizedSelectedProvider ||
        normalizedDetailPaymentProvider === normalizedPayBank ||
        detail.payment_provider === payBank;

      const matchesProvider = providerMatch1 || providerMatch2 || providerMatch3;

      // If FXP is selected, show accounts that are usable for submit.
      if (selectedAsset && isForexAsset(selectedAsset)) {
        const status = String(detail.status || "").toLowerCase();
        const isUsableStatus = status === "approved" || status === "verified";
        return matchesProvider && isUsableStatus;
      }

      // Return payment details that match selected provider.
      return matchesProvider;
    });

    return filtered;
  }, [payBank, userPaymentMethodsDisplay.displayData, effectiveUserPaymentMethods, selectedAsset, userPaymentDetails, selectedProviderData]);

  // Auto-select payment method — match deposit defaults (Salaam when available).
  useEffect(() => {
    if (activePublicProviders.length === 0) {
      return;
    }

    if (initialState?.payment || initialState?.paymentDetails?.length) {
      const savedProvider =
        initialState?.payBank ||
        initialState?.payment?.provider_name ||
        initialState?.payment?.payment_provider_name ||
        initialState?.paymentDetails?.[0]?.payment_provider_name ||
        initialState?.paymentDetails?.[0]?.provider_name ||
        "";
      if (savedProvider && selectedProviderData) {
        return;
      }
    }

    const hasSelected = payBank
      ? activePublicProviders.some(
          (provider: any) => getPublicProviderName(provider) === payBank
        )
      : false;

    if (!payBank || !hasSelected) {
      const defaultProvider = getDefaultPublicPaymentProvider(
        activePublicProviders
      );
      const providerName = defaultProvider
        ? getPublicProviderName(defaultProvider)
        : "";
      if (providerName) {
        setPayBank(providerName);
        setSelectedProviderData(defaultProvider);
        setSelectedPaymentDetail(defaultProvider);
      }
    } else if (!selectedProviderData) {
      const matchedProvider = activePublicProviders.find(
        (provider: any) => getPublicProviderName(provider) === payBank
      );
      if (matchedProvider) {
        setSelectedProviderData(matchedProvider);
        setSelectedPaymentDetail(matchedProvider);
      }
    }
  }, [
    activePublicProviders,
    payBank,
    selectedProviderData,
    initialState,
  ]);

  // Keep selected account synced to the currently selected payment provider only.
  const lastRegisteredProviderRef = useRef<string>("");
  useEffect(() => {
    const providerKey = (payBank || "").trim().toLowerCase();
    const providerChanged = lastRegisteredProviderRef.current !== providerKey;
    const hasAccounts = enhancedFilteredUserPaymentDetails.length > 0;
    const selectedId = selectedPaymentDetails[0]?.id;
    const selectedStillValid =
      selectedId != null &&
      enhancedFilteredUserPaymentDetails.some(
        (detail) => detail.id === selectedId
      );

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

  // Use selected account, or fallback to the first filtered one.
  const effectiveSelectedPaymentDetails =
    selectedPaymentDetails.length > 0
      ? selectedPaymentDetails
      : enhancedFilteredUserPaymentDetails.length > 0
        ? [enhancedFilteredUserPaymentDetails[0]]
        : [];

  // Reset form if user changes asset, payment method, or amount after submission
  const selectedAssetKey = selectedAsset
    ? (selectedAsset.asset_id ??
        selectedAsset.ticker ??
        selectedAsset.symbol ??
        selectedAsset.name ??
        "")
    : "";
  useEffect(() => {
    if (isRestoringFromLegalRef.current) {
      isRestoringFromLegalRef.current = false;
      return;
    }
    if (hasRestoredFromLegalRef.current) {
      return;
    }
    if (!isTransactionSubmitted) {
      return;
    }

    setIsTransactionSubmitted(false);
    setWithdrawalAddress("");
    setPayoutAddress("");
    setQrCodeUrl("");
    setResponseMessage("");
    setWebsocketUrl("");
    setTransactionId("");
    setWalletAddress("");
    setWalletError(null);
  }, [selectedAssetKey, payBank, payAmount, getAmount]);

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

  // Payment selection handlers
  const handleSelectPaymentDetail = (detail: UserPaymentDetail) => {
    setSelectedPaymentDetails((prev) =>
      prev.some((d) => d.id === detail.id) ? prev : [...prev, detail]
    );
  };

  const handleRemovePaymentDetail = (detail: UserPaymentDetail) => {
    setSelectedPaymentDetails((prev) => prev.filter((d) => d.id !== detail.id));
  };

  const selectedPaymentStatus = normalizePaymentStatus(
    selectedPaymentDetails[0]?.status || ""
  );
  const isSelectedPaymentApproved = isApprovedPaymentStatus(selectedPaymentStatus);
  const isSelectedPaymentFrozen = isFrozenPaymentStatus(selectedPaymentStatus);
  const isSelectedPaymentPending = !!(
    payBank &&
    selectedPaymentDetails.length > 0 &&
    selectedPaymentStatus &&
    !isSelectedPaymentApproved
  );
  const hasRegisteredAccountSelected =
    selectedPaymentDetails.length > 0 &&
    enhancedFilteredUserPaymentDetails.some(
      (detail) => detail.id === selectedPaymentDetails[0]?.id
    );
  const isRegisteredAccountMissing = !!payBank && !hasRegisteredAccountSelected;

  // Sync selectedPaymentDetails when accounts refresh and status changes (e.g. Pending → APPROVED)
  useEffect(() => {
    if (selectedPaymentDetails.length === 0 || enhancedFilteredUserPaymentDetails.length === 0) return;
    const selectedId = selectedPaymentDetails[0].id;
    const freshDetail = enhancedFilteredUserPaymentDetails.find(
      (d: any) => d.id === selectedId || String(d.id) === String(selectedId)
    );
    const current = selectedPaymentDetails[0];
    const hasMeaningfulChange =
      !!freshDetail &&
      (
        String(current?.id) !== String(freshDetail.id) ||
        (current?.status ?? "") !== (freshDetail.status ?? "") ||
        (current?.account_name ?? "") !== (freshDetail.account_name ?? "") ||
        (current?.account_number ?? "") !== (freshDetail.account_number ?? "") ||
        (current?.wallet_address ?? "") !== (freshDetail.wallet_address ?? "")
      );
    if (hasMeaningfulChange) {
      setSelectedPaymentDetails([freshDetail]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync when source data changes
  }, [enhancedFilteredUserPaymentDetails]);

  // Fetch admin wallet list
  useEffect(() => {
    // Skip API calls on home page
    if (isHomePage || hasFetchedAdminWallet) {
      return;
    }

    // Prevent infinite retries - max 3 attempts
    if (adminWalletRetryCount >= MAX_RETRIES) {
      console.warn('⚠️ Max retries reached for admin wallet list');
      setHasFetchedAdminWallet(true);
      return;
    }

    dispatch(fetchAdminWalletList(false))
      .unwrap()
      .then((data) => {
        console.log("✅ Admin wallet list fetched successfully");
        setHasFetchedAdminWallet(true);
        setAdminWalletRetryCount(0); // Reset retry count on success

        // If no data in cache, try one force refresh (counts as a retry)
        if ((!data || !data.results || data.results.length === 0) && adminWalletRetryCount === 0) {
          setAdminWalletRetryCount(1);
          dispatch(fetchAdminWalletList(true)).unwrap()
            .then(() => {
              setHasFetchedAdminWallet(true);
            })
            .catch(() => {
              setHasFetchedAdminWallet(true);
            });
        }
      })
      .catch((error: unknown) => {
        console.error(`❌ Failed to fetch admin wallet list (attempt ${adminWalletRetryCount + 1}/${MAX_RETRIES}):`, error);
        setAdminWalletRetryCount(prev => prev + 1);

        // Only show toast on final retry
        if (adminWalletRetryCount + 1 >= MAX_RETRIES) {
          if (!isHomePage) {
            showToast.error(`Failed to fetch admin wallet list after ${MAX_RETRIES} attempts`);
          }
          setHasFetchedAdminWallet(true);
        }
      });
  }, [dispatch, isHomePage, hasFetchedAdminWallet, adminWalletRetryCount]);

  useEffect(() => {
    // Home page uses public ChangeNOW supported-tokens endpoint (no auth).
    if (isHomePage || hasFetchedAssets) {
      return;
    }

    // Prevent infinite retries - max 3 attempts
    if (assetsRetryCount >= MAX_RETRIES) {
      console.warn('⚠️ Max retries reached for assets');
      setHasFetchedAssets(true);
      return;
    }

    // First try to get from cache, then force refresh if no data
    dispatch(fetchAssets(false))
      .unwrap()
      .then((data) => {
        console.log("✅ Assets fetched successfully");
        setHasFetchedAssets(true);
        setAssetsRetryCount(0); // Reset retry count on success

        // If no assets in cache, try one force refresh (counts as a retry)
        if ((!data?.assets || data.assets.length === 0) && assetsRetryCount === 0) {
          setAssetsRetryCount(1);
          dispatch(fetchAssets(true)).unwrap()
            .then(() => {
              setHasFetchedAssets(true);
            })
            .catch(() => {
              setHasFetchedAssets(true);
            });
        }
      })
      .catch((error: unknown) => {
        console.error(`❌ Failed to fetch assets (attempt ${assetsRetryCount + 1}/${MAX_RETRIES}):`, error);
        setAssetsRetryCount(prev => prev + 1);

        // Only show toast on final retry
        if (assetsRetryCount + 1 >= MAX_RETRIES) {
          if (!isHomePage) {
            reportAssetLoadIssue("home-express-withdrawal:exchange-assets", error);
          }
          setHasFetchedAssets(true);
        }
      });
  }, [dispatch, isHomePage, isAuthenticated, hasFetchedAssets, assetsRetryCount]);

  // Fetch user payment details
  useEffect(() => {
    // Only fetch if user is authenticated (needed for both home page and regular page)
    if (!isAuthenticated) {
      return;
    }

    // First try to get from cache, then force refresh if no data
    dispatch(fetchUserPaymentDetails(false))
      .unwrap()
      .then((data) => {
        // Update ref immediately
        if (data && data.length > 0) {
          userPaymentMethodsRef.current = data;
        }

        // If no payment methods in cache, force refresh
        if (!data || (Array.isArray(data) && data.length === 0)) {
          return dispatch(fetchUserPaymentDetails(true))
            .unwrap()
            .then((freshData) => {
              if (freshData && freshData.length > 0) {
                userPaymentMethodsRef.current = freshData;
              }
              return freshData;
            })
            .catch((freshError: unknown) => {
              throw freshError;
            });
        }
        return data;
      })
      .catch((error: unknown) => {
        console.error("❌ Failed to fetch user payment details:", error);
      });
  }, [dispatch, isHomePage, isAuthenticated]);

  // Fetch swap assets
  useEffect(() => {
    // Skip API calls on home page
    if (isHomePage || hasFetchedSwapAssets) {
      return;
    }

    // Prevent infinite retries - max 3 attempts
    if (swapAssetsRetryCount >= MAX_RETRIES) {
      console.warn('⚠️ Max retries reached for swap assets');
      setHasFetchedSwapAssets(true);
      return;
    }

    dispatch(fetchSupportedAssets({ forceRefresh: false, feature: "exchange" }))
      .unwrap()
      .then((data) => {
        console.log("✅ Swap assets fetched successfully");
        setHasFetchedSwapAssets(true);
        setSwapAssetsRetryCount(0); // Reset retry count on success

        // If no assets in cache, try one force refresh (counts as a retry)
        if ((!data || data.length === 0) && swapAssetsRetryCount === 0) {
          setSwapAssetsRetryCount(1);
          dispatch(
            fetchSupportedAssets({ forceRefresh: true, feature: "exchange" })
          ).unwrap()
            .then(() => {
              setHasFetchedSwapAssets(true);
            })
            .catch(() => {
              setHasFetchedSwapAssets(true);
            });
        }
      })
      .catch((error: unknown) => {
        console.error(`❌ Failed to fetch swap assets (attempt ${swapAssetsRetryCount + 1}/${MAX_RETRIES}):`, error);
        setSwapAssetsRetryCount(prev => prev + 1);

        // Only show toast on final retry
        if (swapAssetsRetryCount + 1 >= MAX_RETRIES) {
          if (!isHomePage) {
            showToast.warning("Unable to fetch swap assets. Please try again.");
          }
          setHasFetchedSwapAssets(true);
        }
      });
  }, [dispatch, isHomePage, hasFetchedSwapAssets, swapAssetsRetryCount]);

  // Auto-select first asset and calculate received amount when assets are loaded
  useEffect(() => {
    if (assetsDisplay.shouldShowData && assetsDisplay.displayData.length > 0 && !selectedAsset) {
      // Sort assets to get USDT on BSC, USDC on BSC, fxprimus, then others
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

        // Priority 3: FX Primus (match ticker, name, legacy fields)
        const isFxpA = isForexPrimusAsset(a);
        const isFxpB = isForexPrimusAsset(b);
        if (isFxpA && !isFxpB) {
          return -1;
        }
        if (isFxpB && !isFxpA) {
          return 1;
        }

        return 0;
      });

      const firstAsset = sortedAssets[0];
      setSelectedAsset(firstAsset);

      // Only set default amount if user hasn't manually modified the amount
      if (!isUserModifiedAmount) {
        const defaultAmount = getDefaultAmount(firstAsset);
        setPayAmount(defaultAmount);
        setPayAmountInput(defaultAmount.toString());
      }
    }
  }, [assetsDisplay.displayData, selectedAsset, isUserModifiedAmount]);

  // Recalculate when asset changes
  useEffect(() => {
    if (selectedAsset && payAmount > 0 && isCalculatingFromPay) {
      // Clear any existing estimate when asset changes
      setEstimate(null);
      setEstimateError(null);
      setEstimateLoading(false);
      setCalculationError(null);
      setReceiveAmountError(null);
      setApiValidationError(null);
      setExchangeLookupResponse(null);

      // Check asset type first and handle accordingly
      if (isSimpleCalculationAsset(selectedAsset)) {
        // For simple assets, calculate immediately
        calculateAmounts(payAmount, true);
      } else if (isForexAsset(selectedAsset)) {
        // FXP must use commission lookup API (not local math)
        setIsCalculating(true);
        setIsCalculatingReceive(true);
        setEstimateLoading(false);
      } else {
        // For non-simple assets, the estimate useEffect will handle the API call
        // Just set loading states for visual feedback
        setIsCalculating(true);
        setIsCalculatingReceive(true);
        setEstimateLoading(true);
      }
    }
  }, [selectedAsset]);

  // Simplified estimate handler - UI updates now happen immediately in API response handlers
  // This just acts as a safety net to clear loading states if they get stuck
  useEffect(() => {
    if (estimate && !estimateLoading) {
      // Ensure loading states are cleared when we have an estimate
      setIsCalculating(false);
      setIsCalculatingReceive(false);
    }
  }, [estimate, estimateLoading]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        assetDropdownRef.current &&
        !assetDropdownRef.current.contains(event.target as Node) &&
        (!assetDropdownContentRef.current ||
          !assetDropdownContentRef.current.contains(event.target as Node))
      ) {
        setIsAssetDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close asset dropdown when page scrolls, but NOT when the user scrolls inside the dropdown itself
  useEffect(() => {
    const handleScroll = (event: Event) => {
      const target = event.target as Node | null;
      const isPageScrollTarget =
        target === document ||
        target === document.documentElement ||
        target === document.body;
      // Ignore scroll events that originate from inside the dropdown content
      if (
        assetDropdownContentRef.current &&
        target &&
        assetDropdownContentRef.current.contains(target)
      ) {
        return;
      }
      if (
        assetDropdownRef.current &&
        target &&
        assetDropdownRef.current.contains(target)
      ) {
        return;
      }
      if (!isPageScrollTarget) {
        return;
      }
      if (isAssetDropdownOpen) {
        setIsAssetDropdownOpen(false);
      }
    };

    if (isAssetDropdownOpen) {
      window.addEventListener("scroll", handleScroll, true);
      document.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [isAssetDropdownOpen]);

  useEffect(() => {
    if (!isPaymentModalOpen) return;

    const handlePageScroll = (event: Event) => {
      const target = event.target as Node | null;
      const isPageScrollTarget =
        target === document ||
        target === document.documentElement ||
        target === document.body;
      if (!isPageScrollTarget) {
        return;
      }
      setIsPaymentModalOpen(false);
    };

    window.addEventListener("scroll", handlePageScroll, true);
    document.addEventListener("scroll", handlePageScroll, true);

    return () => {
      window.removeEventListener("scroll", handlePageScroll, true);
      document.removeEventListener("scroll", handlePageScroll, true);
    };
  }, [isPaymentModalOpen]);

  // Check if asset is one of the first two direct assets (USDT on BSC or USDC on BSC)
  const isSimpleCalculationAsset = (asset: any) => {
    if (!asset) return false;
    const ticker = (asset?.ticker || asset?.symbol || "").toLowerCase();
    const network = (asset?.network || "").toLowerCase();

    // First two assets: USDT on BSC and USDC on BSC
    return (ticker === "usdt" && network === "bsc") ||
      (ticker === "usdc" && network === "bsc");
  };
  const isOtcPopupAsset = (asset: any) =>
    !!asset && !isSimpleCalculationAsset(asset) && !isForexAsset(asset);
  const otcThresholdExceededRef = useRef(false);

  useEffect(() => {
    const exceeded =
      isOtcPopupAsset(selectedAsset) && (payAmount > 15000 || getAmount > 15000);
    if (exceeded && !otcThresholdExceededRef.current) {
      setIsInfoModalOpen(true);
    }
    otcThresholdExceededRef.current = exceeded;
  }, [selectedAsset, payAmount, getAmount]);

  const isCommissionApiAsset = (asset: any) => !!getCommissionApiAsset(asset?.ticker || asset?.symbol || "");

  useEffect(() => {
    if (isSubmitting) {
      if (commissionFetchTimeoutRef.current)
        clearTimeout(commissionFetchTimeoutRef.current);
      if (exchangeLookupFetchTimeoutRef.current)
        clearTimeout(exchangeLookupFetchTimeoutRef.current);
      return;
    }
    const amount = isCalculatingFromPay
      ? (parseLocalizedAmountString(payAmountInput) || payAmount)
      : (parseLocalizedAmountString(getAmountInput) || getAmount);

    if (!selectedAsset) {
      setApiCommission(null);
      setApiCommissionDetails(null);
      setExchangeLookupResponse(null);
      return;
    }

    if (amount <= 0) {
      setApiCommission(null);
      setApiCommissionDetails(null);
      if (!isForexAsset(selectedAsset)) {
        setExchangeLookupResponse(null);
      }
      setApiValidationError(null);
      return;
    }

    if (isExchangeCommissionLookupAsset(selectedAsset) && !isForexAsset(selectedAsset)) {
      const params = getExchangeLookupParams(selectedAsset);
      if (!params) {
        setExchangeLookupResponse(null);
        setApiCommission(null);
        return;
      }

      if (exchangeLookupFetchTimeoutRef.current)
        clearTimeout(exchangeLookupFetchTimeoutRef.current);
      exchangeLookupFetchTimeoutRef.current = setTimeout(() => {
        fetchExchangeCommissionLookup(
          amount,
          "withdrawal",
          params.from_currency,
          "USD",
          params.from_network,
          params.from_asset_id
        )
          .then((res) => {
            setExchangeLookupResponse(res);
            setApiCommission(null);
            setApiCommissionDetails(null);
            setApiValidationError(null);
            if (isCalculatingFromPay && res.to_amount != null) {
              const toAmount = parseFloat(res.to_amount);
              if (!Number.isNaN(toAmount)) {
                if (toAmount < 0) {
                  setApiValidationError(buildNegativeReceiveError(toAmount));
                  setGetAmount(0);
                  setGetAmountInput("0");
                  setPreviousValidAmount("0");
                } else {
                  const calculatedGetAmount = capReceiveAmount(Math.max(0, toAmount));
                  setApiValidationError(null);
                  setGetAmount(calculatedGetAmount);
                  setGetAmountInput(calculatedGetAmount.toString());
                  setPreviousValidAmount(calculatedGetAmount.toString());
                }
              }
            }
          })
          .catch((error: any) => {
            setExchangeLookupResponse(null);
            setApiCommission(null);

            const responseData = error?.response?.data;
            const responseInner = responseData?.response_data;
            const rawMessage =
              responseData?.error ||
              responseData?.message ||
              responseInner?.error ||
              responseInner?.message ||
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
            if (normalizedMessage.includes(MISSING_USDT_USD_RATE_ERROR)) {
              setApiValidationError(
                "Exchange rate is currently unavailable. Please contact support."
              );
              setIsSupportModalOpen(true);
              return;
            }
            setApiValidationError(normalizedMessage);
          });
      }, 300);

      return () => {
        if (exchangeLookupFetchTimeoutRef.current) {
          clearTimeout(exchangeLookupFetchTimeoutRef.current);
        }
      };
    }


    const apiAsset = getCommissionApiAsset(
      selectedAsset.ticker || selectedAsset.symbol || ""
    );
    if (!apiAsset) {
      setApiCommission(null);
      setExchangeLookupResponse(null);
      return;
    }

    const fxpSendAmount = isCalculatingFromPay
      ? (parseLocalizedAmountString(payAmountInput) || payAmount)
      : (parseLocalizedAmountString(getAmountInput) || getAmount);
    const commissionLookupAmount = isForexAsset(selectedAsset)
      ? fxpSendAmount
      : amount;
    if (commissionFetchTimeoutRef.current)
      clearTimeout(commissionFetchTimeoutRef.current);
    if (isForexAsset(selectedAsset)) {
      setIsCalculating(true);
      setIsCalculatingReceive(true);
    }
    commissionFetchTimeoutRef.current = setTimeout(() => {
      fetchCommissionDetails(
        apiAsset,
        commissionLookupAmount,
        "withdrawal",
        isForexAsset(selectedAsset) ? selectedAsset?.asset_id : undefined
      )
        .then((details) => {
          setApiCommission(Number(details?.commission_rate ?? 0));
          setApiCommissionDetails(details);
          setIsCalculating(false);
          setIsCalculatingReceive(false);
          if (isForexAsset(selectedAsset)) {
            const backendToAmount = Number(details?.to_amount);
            const backendFromAmount = Number(details?.from_amount);
            if (isCalculatingFromPay && Number.isFinite(backendToAmount)) {
              const safeToAmount = capReceiveAmount(Math.max(0, backendToAmount));
              setGetAmount(safeToAmount);
              setGetAmountInput(String(safeToAmount));
              setPreviousValidAmount(String(safeToAmount));
            } else if (!isCalculatingFromPay && Number.isFinite(backendFromAmount)) {
              const requestedGetAmount =
                parseLocalizedAmountString(getAmountInput) || getAmount;
              const normalizedFromAmount =
                Number.isFinite(backendToAmount) && backendToAmount > 0
                  ? requestedGetAmount * (backendFromAmount / backendToAmount)
                  : backendFromAmount;
              setPayAmount(Math.max(0, normalizedFromAmount));
              setPayAmountInput(String(Math.max(0, normalizedFromAmount)));
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

          if (isForexAsset(selectedAsset)) {
            // FXP: on any commission API error, keep user-entered amount and mirror it to the other field.
            setApiValidationError(null);
            if (isCalculatingFromPay) {
              setGetAmount(amount);
              setGetAmountInput(String(amount));
              setPreviousValidAmount(String(amount));
            } else {
              setPayAmount(amount);
              setPayAmountInput(String(amount));
            }
            setApiCommission(0);
            setApiCommissionDetails(null);
            setExchangeLookupResponse(null);
            setIsCalculating(false);
            setIsCalculatingReceive(false);
            return;
          }

          setApiCommission(null);
          setApiCommissionDetails(null);
          setIsCalculating(false);
          setIsCalculatingReceive(false);
        });
    }, 300);
    return () => {
      if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
    };
  }, [selectedAsset, payAmountInput, getAmountInput, payAmount, getAmount, isCalculatingFromPay, isSubmitting, commissionRefreshSeed]);

  // Recalculate receive amount when apiCommission arrives (was null during initial calculation)
  useEffect(() => {
    if (
      selectedAsset &&
      isCommissionApiAsset(selectedAsset) &&
      (!isExchangeCommissionLookupAsset(selectedAsset) ||
        isForexAsset(selectedAsset)) &&
      apiCommission !== null
    ) {
      if (isCalculatingFromPay && payAmount > 0) {
        // Forward: You Send -> You Receive
        if (isForexAsset(selectedAsset)) {
          const backendToAmount = Number(apiCommissionDetails?.to_amount);
          if (Number.isFinite(backendToAmount)) {
            const safeAmount = capReceiveAmount(Math.max(0, backendToAmount));
            setGetAmount(safeAmount);
            setGetAmountInput(String(safeAmount));
            setPreviousValidAmount(String(safeAmount));
            return;
          }
        }
        const commissionAmount = (payAmount * apiCommission) / 100;
        const calculatedGetAmount = capReceiveAmount(Math.max(0, payAmount - commissionAmount));
        setGetAmount(calculatedGetAmount);
        setGetAmountInput(calculatedGetAmount.toString());
        setPreviousValidAmount(calculatedGetAmount.toString());
        if (isOtcPopupAsset(selectedAsset) && calculatedGetAmount >= MAX_RECEIVE_AMOUNT_USD) {
          setIsInfoModalOpen(true);
        }
      } else if (!isCalculatingFromPay && getAmount > 0) {
        // Reverse: You Receive -> You Send
        const calculatedPayAmount = isForexAsset(selectedAsset)
          ? (Number.isFinite(Number(apiCommissionDetails?.from_amount))
              ? Number(apiCommissionDetails?.from_amount)
              : getFxpReversePayAmount(getAmount))
          : getAmount / (1 - apiCommission / 100);
        setPayAmount(calculatedPayAmount);
        setPayAmountInput(calculatedPayAmount.toString());
      }
    }
  }, [apiCommission, apiCommissionDetails, payAmount, getAmount, isCalculatingFromPay, selectedAsset]);

  // Exchange-lookup recalc when local_commission arrives
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

    if (
      !selectedAsset ||
      !isExchangeCommissionLookupAsset(selectedAsset) ||
      isForexAsset(selectedAsset) ||
      !exchangeLookupResponse
    ) {
      return;
    }

    if (isCalculatingFromPay && payAmount > 0) {
      const toAmountStr = exchangeLookupResponse.to_amount;
      const toAmount = toAmountStr != null ? parseFloat(toAmountStr) : NaN;
      if (!Number.isNaN(toAmount)) {
        const calculatedGetAmount = capReceiveAmount(Math.max(0, toAmount));
        setGetAmount(calculatedGetAmount);
        setGetAmountInput(calculatedGetAmount.toString());
        setPreviousValidAmount(calculatedGetAmount.toString());

        if (isOtcPopupAsset(selectedAsset) && calculatedGetAmount >= MAX_RECEIVE_AMOUNT_USD) {
          setIsInfoModalOpen(true);
        }
      }
    } else if (!isCalculatingFromPay && getAmount > 0) {
      const lc = parseCommissionRule();
      if (!lc) {
        return;
      }
      const fee = lc.fee != null ? parseFloat(lc.fee) : NaN;
      if (!Number.isNaN(fee)) {
        const calculatedPayAmount = getAmount + fee;
        setPayAmount(calculatedPayAmount);
        setPayAmountInput(calculatedPayAmount.toString());
      } else if (lc.commission_mode === "percentage" && lc.rate != null) {
        const rate = parseFloat(lc.rate);
        if (!Number.isNaN(rate) && rate < 100) {
          const calculatedPayAmount = getAmount / (1 - rate / 100);
          setPayAmount(calculatedPayAmount);
          setPayAmountInput(calculatedPayAmount.toString());
        }
      }
    }
  }, [exchangeLookupResponse, selectedAsset, isCalculatingFromPay, payAmount, getAmount]);

  // Helper function to check if cache entry is still valid
  const isCacheValid = (timestamp: number) => {
    return Date.now() - timestamp < CACHE_DURATION;
  };

  // Helper function to extract error message from API response
  const extractErrorMessage = (error: any): string => {
    if (error.response?.data) {
      const responseData = error.response.data;
      if (responseData.error === "deposit_too_small") {
        return buildExpressMinAmountErrorText([
          responseData,
          responseData.response_data,
        ]);
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
    const responseData = error.response?.data;
    const fieldErrors = getExpressAmountFieldErrorsFromResponse(responseData);
    if (fieldErrors) {
      const mapped = mapExpressAmountApiMessages(fieldErrors);
      if (mapped) {
        setApiValidationError(mapped);
        setReceiveAmountError(mapped);
        return;
      }
    }

    if (error.response?.data?.error) {
      const errorData = error.response.data.error;

      // Handle amount validation errors
      if (errorData.amount && Array.isArray(errorData.amount)) {
        const amountErrors = errorData.amount;
        if (
          amountErrors.some((err: string) => err.includes("decimal places"))
        ) {
          setApiValidationError(
            "Ensure that there are no more than 5 decimal places."
          );
          return;
        }
        if (amountErrors.some((err: string) => err.includes("too small"))) {
          setApiValidationError(
            "Amount is too small. Please enter a larger amount to proceed."
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
    if (!asset) return 100;
    if (isForexPrimusAsset(asset)) return 100;
    const ticker = (asset?.ticker || asset?.symbol || "").toLowerCase();
    return ticker === "usdt" || ticker === "usdc" ? 100 : 0.1;
  };

  // Get minimum amount based on asset type
  const isFixedMinWithdrawalAsset = (asset: any) => {
    const raw = String(
      asset?.ticker || asset?.symbol || asset?.name || ""
    )
      .trim()
      .toLowerCase();
    return raw === "usd" || raw === "usdt" || raw.startsWith("usdt ");
  };

  const getMinimumAmount = (asset: any) => {
    if (!asset) return 0;
    if (isFixedMinWithdrawalAsset(asset)) return 5;
    return 0; // No minimum for other assets
  };

  const persistSubmitAmountError = useCallback(
    (message: string) => {
      const msg = String(message || "").trim();
      if (!msg) return;
      submitAmountErrorRef.current = msg;
      setApiValidationError(msg);
      setReceiveAmountError(msg);
      setEstimateLoading(false);
      setIsCalculating(false);
      setIsCalculatingReceive(false);
      if (isHomePage) {
        setValidationErrors([msg]);
        showToast.error(msg);
      } else {
        setValidationErrors([]);
      }
    },
    [isHomePage]
  );

  // Validate receive amount
  const validateReceiveAmount = (amount: number, asset: any) => {
    const minAmount = getMinimumAmount(asset);
    if (minAmount > 0 && amount > 0 && amount < minAmount) {
      return formatExpressMinAmountMessage(minAmount);
    }
    return null;
  };

  const isTransientAmountMessage = (msg: string | null | undefined): boolean => {
    if (!msg) return false;
    return (
      msg === "Calculating..." ||
      msg.includes("Rough estimate") ||
      msg.includes("Using estimated rate")
    );
  };

  const hasBlockingAmountMessage = (msg: string | null | undefined): boolean =>
    !!msg && !isTransientAmountMessage(msg);

  const isPayBelowFixedMin =
    !!selectedAsset &&
    isFixedMinWithdrawalAsset(selectedAsset) &&
    payAmount > 0 &&
    payAmount < getMinimumAmount(selectedAsset);

  const receiveMinError =
    getAmount > 0 ? validateReceiveAmount(getAmount, selectedAsset) : null;

  const hasBlockingValidationError =
    isPayBelowFixedMin ||
    !!receiveMinError ||
    hasBlockingAmountMessage(apiValidationError) ||
    hasBlockingAmountMessage(receiveAmountError) ||
    hasBlockingAmountMessage(calculationError) ||
    validationErrors.length > 0;

  const inlineAmountError =
    (hasBlockingAmountMessage(calculationError) ? calculationError : null) ||
    (hasBlockingAmountMessage(apiValidationError) ? apiValidationError : null) ||
    (hasBlockingAmountMessage(receiveAmountError) ? receiveAmountError : null);

  const nonInlineValidationErrors = inlineAmountError
    ? validationErrors.filter((error) => error !== inlineAmountError)
    : validationErrors;

  const isFirstCardSubmitDisabled =
    requiresLoginRedirect
      ? (isOtcPopupAsset(selectedAsset) && payAmount >= 15000) ||
        isSelectedPaymentPending ||
        hasBlockingValidationError
      : isSubmitting ||
        isTransactionSubmitted ||
        isInfoModalOpen ||
        (isOtcPopupAsset(selectedAsset) && payAmount >= 15000) ||
        isSelectedPaymentPending ||
        isRegisteredAccountMissing ||
        hasBlockingValidationError;

  const isSecondCardSubmitDisabled =
    isSubmitting ||
    isInfoModalOpen ||
    (isOtcPopupAsset(selectedAsset) && getAmount > 15000) ||
    !isTermsAccepted ||
    isSelectedPaymentPending ||
    isRegisteredAccountMissing ||
    hasBlockingValidationError;

  // Fetch estimate for non-direct assets with debouncing for better performance
  useEffect(() => {
    if (isSubmitting) {
      if (estimateTimeoutRef.current) {
        clearTimeout(estimateTimeoutRef.current);
        estimateTimeoutRef.current = null;
      }
      setEstimateLoading(false);
      return;
    }
    if (submitAmountErrorRef.current) {
      setEstimateLoading(false);
      setIsCalculating(false);
      setIsCalculatingReceive(false);
      return;
    }
    if (estimateTimeoutRef.current) {
      clearTimeout(estimateTimeoutRef.current);
      estimateTimeoutRef.current = null;
    }

    if (
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset) &&
      !isForexAsset(selectedAsset) && // Skip FXP - uses manual calculation
      payAmount &&
      payAmount > 0 &&
      isCalculatingFromPay // Only fetch estimate when calculating from pay amount
    ) {
      // Check cache first - if found and valid, use immediately without any loading states
      const cacheKey = `${selectedAsset.ticker?.toUpperCase()}_${selectedAsset.network}_${payAmount}`;
      const cachedEntry = estimateCache.get(cacheKey);

      if (cachedEntry && isCacheValid(cachedEntry.timestamp)) {
        setEstimate(cachedEntry.data);
        setCalculationError(null); // Clear any previous errors
        if (!submitAmountErrorRef.current) {
          setApiValidationError(null);
        }
        // Don't set any loading states for cached results
        return;
      }

      // Set loading state immediately for visual feedback (only if no API validation errors)
      if (!apiValidationError && !submitAmountErrorRef.current) {
        setEstimateLoading(true);
        setEstimateError(null);
        setIsCalculating(true);
        setIsCalculatingReceive(true);
      }

      // For non-simple assets, don't show fallback calculation - go directly to API
      // Keep field empty during calculation - no intermediate values
      if (!submitAmountErrorRef.current) {
        setGetAmount(0);
        setGetAmountInput("");
        if (!apiValidationError) {
          setReceiveAmountError("Calculating..."); // Show immediate feedback
        }
      }

      // Minimal debounce to prevent rapid duplicate requests but keep UI responsive
      const debounceTimeout = setTimeout(() => {
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
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
        }, 12000); // Align with public estimate API budget; 1.5s was aborting slow but successful calls

        const handleSwapEstimateApiFailure = (actionOrError: any) => {
            const error = actionOrError?.payload ?? actionOrError;
            const responseData = error?.response_data ?? error?.response?.data?.response_data ?? error?.response?.data;
            const errorData = responseData?.error ?? error?.response?.data?.error;

            const minAmountMessage = resolveExpressMinAmountDisplayError(
              actionOrError,
              error,
              responseData,
              error?.response?.data
            );
            if (minAmountMessage) {
              setApiValidationError(minAmountMessage);
              setReceiveAmountError(minAmountMessage);
              setCalculationError(minAmountMessage);
              setEstimateLoading(false);
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              return;
            }

            if (responseData?.error || error?.response?.data?.error) {
              const errorData = responseData?.error ?? error?.response?.data?.error;


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
                    "Ensure that there are no more than 5 decimal places."
                  );
                  setReceiveAmountError(
                    "Ensure that there are no more than 5 decimal places."
                  );
                  // Stop loading states and show error
                  setEstimateLoading(false);
                  setIsCalculating(false);
                  setIsCalculatingReceive(false);
                  // Don't clear the input - let user see their value and fix it
                  return;
                }
                if (
                  amountErrors.some((err: string) =>
                    err.includes("12 digits") || err.includes("20 digits")
                  )
                ) {
                  setApiValidationError(EXPRESS_AMOUNT_DIGIT_LIMIT_MESSAGE);
                  setReceiveAmountError(EXPRESS_AMOUNT_DIGIT_LIMIT_MESSAGE);
                  // Stop loading states and show error
                  setEstimateLoading(false);
                  setIsCalculating(false);
                  setIsCalculatingReceive(false);
                  // Don't clear the input - let user see their value and fix it
                  return;
                }
                if (
                  amountErrors.some((err: string) => err.includes("too small"))
                ) {
                  setApiValidationError(
                    "Amount is too small. Please enter a larger amount to proceed."
                  );
                  setReceiveAmountError(
                    "Amount is too small. Please enter a larger amount to proceed."
                  );
                  // Stop loading states and show error
                  setEstimateLoading(false);
                  setIsCalculating(false);
                  setIsCalculatingReceive(false);
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

              // Handle deposit_too_small error (show min amount from API to user)
              // Backend can return 400 with body { error, response_data: { error, message, payload } } – use inner response_data for payload
              if (
                errorData === "deposit_too_small" ||
                errorData === "Exchange service error: deposit_too_small" ||
                (typeof errorData === "string" && errorData.includes("deposit_too_small")) ||
                responseData?.error === "deposit_too_small"
              ) {
                const innerData = responseData?.response_data ?? responseData;
                const errorMessage = buildExpressMinAmountErrorText([
                  innerData,
                  responseData,
                ]);
                setApiValidationError(errorMessage);
                setReceiveAmountError(errorMessage);
                setCalculationError(errorMessage);
                setEstimateLoading(false);
                setIsCalculating(false);
                setIsCalculatingReceive(false);
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

                const displayMessage = normalizeExpressApiErrorMessage(
                  errorMessage,
                  responseData,
                  error
                );
                setApiValidationError(displayMessage);
                setReceiveAmountError(displayMessage);
                // Stop loading states and show error
                setEstimateLoading(false);
                setIsCalculating(false);
                setIsCalculatingReceive(false);
                return;
              }
            }

            // Fallback: extract message from payload or axios response
            const rawData = error?.response?.data ?? error;
            let fallbackErrorMessage = "Validation error occurred. Please check your input.";
            if (rawData?.error) {
              if (typeof rawData.error === "string") {
                fallbackErrorMessage = rawData.error;
              } else if (typeof rawData.error === "object") {
                const errorObj = rawData.error;
                if (errorObj.amount && Array.isArray(errorObj.amount)) {
                  fallbackErrorMessage = errorObj.amount[0];
                } else if (errorObj.message) {
                  fallbackErrorMessage = errorObj.message;
                }
              }
            } else if (responseData?.message) {
              fallbackErrorMessage = responseData.message;
            } else if (error?.message) {
              fallbackErrorMessage = error.message;
            }

            const displayFallback = normalizeExpressApiErrorMessage(
              fallbackErrorMessage,
              rawData,
              responseData,
              error
            );
            setApiValidationError(displayFallback);
            setReceiveAmountError(displayFallback);
            setEstimateLoading(false);
            setIsCalculating(false);
            setIsCalculatingReceive(false);
        };

        dispatch(
          fetchSwapEstimate({
            toCurrency: "USDT",
            toNetwork: "BSC",
            fromCurrency: selectedAsset.ticker?.toUpperCase(),
            fromNetwork: selectedAsset.network,
            amount: payAmount,
            usePublicApi: !!isHomePage,
          })
        )
          .then((result: any) => {
            clearTimeout(timeoutId);
            if (result?.meta?.requestStatus === "rejected") {
              handleSwapEstimateApiFailure(result);
              return;
            }
            if (result?.meta?.requestStatus !== "fulfilled" || !result.payload) {
              return;
            }
            const payload = result.payload as any;
            if (
              payload?.response_data &&
              payload?.estimated_amount == null &&
              payload?.toAmount == null
            ) {
              handleSwapEstimateApiFailure({ payload });
              return;
            }
            setEstimate(payload);
            setCalculationError(null);
            if (!submitAmountErrorRef.current) {
              setApiValidationError(null);
            }
            const estimatedAmount = payload?.toAmount ?? payload?.estimated_amount;
            if (estimatedAmount !== undefined && estimatedAmount !== null && !isNaN(estimatedAmount)) {
              const finalAmount = capReceiveAmount(Math.max(0, estimatedAmount));
              if (!submitAmountErrorRef.current) {
                setGetAmount(finalAmount);
                setGetAmountInput(finalAmount.toString());
                setReceiveAmountError(null);
              }
              if (isOtcPopupAsset(selectedAsset) && finalAmount >= MAX_RECEIVE_AMOUNT_USD) {
                setIsInfoModalOpen(true);
              }
              setIsCalculating(false);
              setIsCalculatingReceive(false);
            }
            setEstimateCache((prev) =>
              new Map(prev).set(cacheKey, {
                data: payload,
                timestamp: Date.now(),
              })
            );
          })
          .catch((e: any) => {
            clearTimeout(timeoutId);
            handleSwapEstimateApiFailure(e);
          })
          .finally(() => {
            setEstimateLoading(false);
          });
      }, 50); // 50ms debounce for immediate response while preventing duplicate calls

      estimateTimeoutRef.current = debounceTimeout;
    } else if (
      !isCalculatingFromPay &&
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset)
    ) {
      // For reverse calculations on complex assets, don't set loading states here
      // The reverse calculation useEffect will handle the loading states and API call
      // Don't set loading states here to avoid conflicts
    }
    return () => {
      if (estimateTimeoutRef.current) {
        clearTimeout(estimateTimeoutRef.current);
        estimateTimeoutRef.current = null;
      }
    };
  }, [selectedAsset, payAmount, isCalculatingFromPay, isSubmitting]);

  // Reverse calculation effect for non-simple assets when user types in "You Receive"
  useEffect(() => {
    if (isSubmitting) {
      setEstimateLoading(false);
      return;
    }
    if (submitAmountErrorRef.current) {
      setEstimateLoading(false);
      setIsCalculating(false);
      setIsCalculatingReceive(false);
      return;
    }

    if (
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset) &&
      !isForexAsset(selectedAsset) && // Skip FXP - uses manual calculation
      getAmount &&
      getAmount > 0 &&
      !isCalculatingFromPay
    ) {
      if (!apiValidationError) {
        setEstimateLoading(true);
        setEstimateError(null);
      }



      // Add timeout to prevent hanging API calls
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), 12000); // 12 second timeout (10s API + 2s buffer)
      });

      Promise.race([
        dispatch(
          fetchSwapEstimate({
            fromCurrency: "USDT", // FROM USDT (what we want to receive)
            fromNetwork: "BSC",
            toCurrency: selectedAsset.ticker, // TO selected asset (what we need to send)
            toNetwork: selectedAsset.network,
            amount: getAmount, // Use receive amount directly
            usePublicApi: !!isHomePage,
          })
        ),
        timeoutPromise,
      ])
        .then((result: any) => {
          if (result?.meta?.requestStatus === "fulfilled" && result.payload) {
            const payload = result.payload as any;
            // Support backend variants so UI updates reliably.
            const requiredUsdtAmountRaw =
              payload?.estimated_amount ?? payload?.toAmount ?? payload?.user_amount;
            const requiredUsdtAmount = Number(requiredUsdtAmountRaw);

            if (Number.isFinite(requiredUsdtAmount) && requiredUsdtAmount >= 0) {
              // Set the pay amount to the required USDT amount
              if (!submitAmountErrorRef.current) {
                setPayAmount(requiredUsdtAmount);
                setPayAmountInput(requiredUsdtAmount.toString());
                setEstimate(payload);
                setApiValidationError(null);
              }
            }
          }
          // Always clear loading states after this response branch.
          setIsCalculating(false);
          setIsCalculatingReceive(false);
          setEstimateLoading(false);
        })
        .catch((error) => {
          // IMMEDIATELY clear all loading states to prevent stuck loading
          setIsCalculating(false);
          setIsCalculatingReceive(false);
          setEstimateLoading(false);

          // Handle API validation errors for receive amount first
          if (
            error.response?.data?.error ||
            error.response?.data?.response_data?.error
          ) {
            const errorData =
              error.response.data.error ||
              error.response.data.response_data?.error;
            const responseData = error.response.data.response_data;

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
                  "Ensure that there are no more than 5 decimal places."
                );
                setReceiveAmountError(
                  "Ensure that there are no more than 5 decimal places."
                );
                // Stop loading states and show error
                setEstimateLoading(false);
                setIsCalculating(false);
                setIsCalculatingReceive(false);
                return;
              }
              if (
                amountErrors.some((err: string) =>
                  err.includes("12 digits") || err.includes("20 digits")
                )
              ) {
                setApiValidationError(EXPRESS_AMOUNT_DIGIT_LIMIT_MESSAGE);
                setReceiveAmountError(EXPRESS_AMOUNT_DIGIT_LIMIT_MESSAGE);
                // Stop loading states and show error
                setEstimateLoading(false);
                setIsCalculating(false);
                setIsCalculatingReceive(false);
                return;
              }
              if (
                amountErrors.some((err: string) => err.includes("too small"))
              ) {
                setApiValidationError(
                  "Amount is too small. Please enter a larger amount to proceed."
                );
                setReceiveAmountError(
                  "Amount is too small. Please enter a larger amount to proceed."
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

            // Handle deposit_too_small error (support 400 body with response_data.payload.range.minAmount)
            if (
              errorData === "deposit_too_small" ||
              errorData === "Exchange service error: deposit_too_small" ||
              (typeof errorData === "string" && errorData.includes("deposit_too_small")) ||
              errorData?.error === "deposit_too_small" ||
              responseData?.error === "deposit_too_small"
            ) {
              const innerData = responseData?.response_data ?? responseData;
              const errorMessage = buildExpressMinAmountErrorText([
                innerData,
                responseData,
              ]);
              setApiValidationError(errorMessage);
              setReceiveAmountError(errorMessage);
              setCalculationError(errorMessage);
              setEstimateLoading(false);
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              return;
            }

            // Fallback: Handle any other error formats that weren't caught above
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

            setApiValidationError(fallbackErrorMessage);
            setReceiveAmountError(fallbackErrorMessage);
            // Stop loading states and show error
            setEstimateLoading(false);
            setIsCalculating(false);
            setIsCalculatingReceive(false);
            return;
          }

          // Normalize thunk rejection (payload) vs axios error
          const err = error?.payload ?? error;
          const resData = err?.response_data ?? err?.response?.data?.response_data ?? err?.response?.data;
          let errorMessage = "";
          let errorDetails = "";
          if (resData?.error) {
            errorMessage = resData.error;
            errorDetails = resData.message || "";
          } else if (err?.error) {
            errorMessage = typeof err.error === "string" ? err.error : "";
            errorDetails = err.message || "";
          } else if (err?.message) {
            errorMessage = err.message;
          }
          if (errorMessage.includes("Exchange service error:")) {
            errorMessage = errorMessage.replace("Exchange service error: ", "");
          }

          // Home page: don't suppress real backend validation errors like not_valid_params.
          // Only keep silent for transient network/timeout/server issues.
          if (isHomePage) {
            const maybeMsg =
              (typeof errorDetails === "string" && errorDetails.trim())
                ? errorDetails.trim()
                : (typeof errorMessage === "string" && errorMessage.trim())
                  ? errorMessage.trim()
                  : "";
            const m = maybeMsg.toLowerCase();
            const isTransient =
              m.includes("request timeout") ||
              m.includes("network error") ||
              m.includes("server error");
            if (isTransient) {
              setEstimateError(null);
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              setEstimateLoading(false);
              return;
            }
            const minMsg = resolveExpressMinAmountDisplayError(err, resData, error);
            if (minMsg) {
              setApiValidationError(minMsg);
              setReceiveAmountError(minMsg);
              setEstimateError(null);
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              setEstimateLoading(false);
              return;
            }
            if (maybeMsg) {
              const displayMsg = normalizeExpressApiErrorMessage(
                maybeMsg,
                resData,
                err,
                error
              );
              setApiValidationError(displayMsg);
              setReceiveAmountError(displayMsg);
            }
            setEstimateError(null);
            setIsCalculating(false);
            setIsCalculatingReceive(false);
            setEstimateLoading(false);
            return;
          }

          setIsCalculating(false);
          setIsCalculatingReceive(false);
          setEstimateLoading(false);

          // Handle deposit_too_small error (show min amount from API to user; support 400 body with nested response_data)
          if (
            isExpressBelowMinAmountError(errorMessage) ||
            isExpressBelowMinAmountError(errorDetails)
          ) {
            const innerResData = resData?.response_data ?? resData;
            const errorText = buildExpressMinAmountErrorText([
              innerResData,
              resData,
              error,
            ]);

            setApiValidationError(errorText);
            setEstimateError(null);
            setGetAmount(0);
            setGetAmountInput("0");
            setIsCalculating(false);
            setIsCalculatingReceive(false);
            setEstimateLoading(false);
            return;
          }

          // Handle other specific validation errors
          if (errorMessage.includes("deposit_too_large") || errorDetails.includes("Out of max amount")) {
            const maxAmount = resData?.payload?.range?.maxAmount;
            const errorText = maxAmount
              ? `Amount entered is too large. Maximum amount is ${maxAmount.toFixed(8)}.`
              : "Amount entered is too large. Please enter a smaller amount.";

            setApiValidationError(errorText);
            setEstimateError(null);
            setGetAmount(0);
            setGetAmountInput("0");
            setIsCalculating(false);
            setIsCalculatingReceive(false);
            setEstimateLoading(false);
            return;
          }

          // Clear API validation errors for network/timeout issues
          setApiValidationError(null);

          const msg = err?.message || "";
          if (msg.includes("Request timeout")) {
            setEstimateError(null);
          } else if (
            msg.includes("Network Error") ||
            (error as any)?.code === "ECONNREFUSED" ||
            (error as any)?.code === "ENOTFOUND"
          ) {
            setEstimateError(null);
          } else if (msg.includes("Server Error")) {
            setEstimateError(null);
          } else {
            setEstimateError(null);
          }

          // Common fallback calculation for all error types (commission as % e.g. 2 = 2%)
          let commissionRate = 2;
          if (selectedAsset?.range_commissions?.length > 0) {
            const firstCommission = selectedAsset.range_commissions[0];
            if (firstCommission?.commission) commissionRate = parseFloat(firstCommission.commission);
          } else if (selectedAsset?.commission) {
            commissionRate = parseFloat(selectedAsset.commission);
          } else if (selectedAsset?.fee_rate) {
            commissionRate = parseFloat(selectedAsset.fee_rate);
          }
          const fallbackPayAmount =
            selectedAsset &&
            isExchangeCommissionLookupAsset(selectedAsset) &&
            exchangeCommissionRule
              ? getExchangeLookupGrossAmount(getAmount)
              : getAmount /
                  (1 -
                    (selectedAsset && isCommissionApiAsset(selectedAsset)
                      ? apiCommission ?? 2
                      : commissionRate) /
                      100);
          setPayAmount(fallbackPayAmount);
          setPayAmountInput(fallbackPayAmount.toString());

          // Clear loading states after fallback calculation
          setIsCalculating(false);
          setIsCalculatingReceive(false);
        })
        .finally(() => {
          // Always clear estimate loading and calculation states
          setEstimateLoading(false);
          setIsCalculating(false);
          setIsCalculatingReceive(false);
        });
    } else if (!isCalculatingFromPay && getAmount === 0) {
      // Clear loading states when receive amount is 0
      setIsCalculating(false);
      setIsCalculatingReceive(false);
      setEstimateLoading(false);
    }
  }, [selectedAsset, getAmount, isCalculatingFromPay, apiValidationError, isSubmitting]);

  // Filter swap assets based on search term and filter tab - search by ticker, name, symbol, and network
  const filteredSwapAssets = useMemo(() => {
    let filtered = assetsDisplay.displayData?.filter((asset: SupportedAsset) => {
      const searchTerm = assetSearchTerm.toUpperCase();

      // Apply search filter
      if (searchTerm && !assetMatchesSearchTerm(asset, searchTerm)) return false;

      // Apply filter tab (only for home page)
      // Important: while the user is searching, do not apply tab filtering
      // (otherwise non-featured assets like USDC can never appear).
      if (isHomePage && !searchTerm) {
        switch (assetFilterTab) {
          case "new":
            // Show featured/new assets, and always include USDC on BSC in Popular/New.
            {
              const tickerLower = (asset?.ticker || asset?.symbol || "").toString().toLowerCase();
              const legacyLower = (
                (asset as any)?.legacyTicker ||
                (asset as any)?.legacy_ticker ||
                (asset as any)?.original_ticker ||
                (asset as any)?.change_now_ticker ||
                ""
              )
                .toString()
                .toLowerCase();
              const networkLower = (
                asset?.network ||
                (asset as any)?.networks?.[0]?.network_type ||
                (asset as any)?.networks?.[0]?.network_id ||
                ""
              )
                .toString()
                .toLowerCase();
              const isUsdcBsc =
                (tickerLower === "usdc" || legacyLower.includes("usdc")) &&
                (networkLower === "bsc" || networkLower === "bep20");

              return (
                asset.featured === true ||
                asset.is_changenow_asset === true ||
                isUsdcBsc ||
                isForexPrimusAsset(asset)
              );
            }
          case "gainers":
            // For now, show all assets (can be enhanced with price data)
            // You can add price change logic here when available
            return true;
          case "losers":
            // For now, show all assets (can be enhanced with price data)
            // You can add price change logic here when available
            return true;
          case "all":
          default:
            return true;
        }
      }

      return true;
    }) || [];

    // Sort based on filter tab for home page
    if (isHomePage && assetFilterTab !== "all" && !assetSearchTerm) {
      switch (assetFilterTab) {
        case "gainers":
          // Sort by ticker name ascending (can be enhanced with price change data)
          filtered = [...filtered].sort((a, b) => {
            const tickerA = (a.ticker || "").toUpperCase();
            const tickerB = (b.ticker || "").toUpperCase();
            return tickerA.localeCompare(tickerB);
          });
          break;
        case "losers":
          // Sort by ticker name descending (can be enhanced with price change data)
          filtered = [...filtered].sort((a, b) => {
            const tickerA = (a.ticker || "").toUpperCase();
            const tickerB = (b.ticker || "").toUpperCase();
            return tickerB.localeCompare(tickerA);
          });
          break;
        case "new":
          // Show featured/new assets first
          filtered = [...filtered].sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return 0;
          });
          break;
      }
    }

    return filtered;
  }, [assetsDisplay.displayData, assetSearchTerm, assetFilterTab, isHomePage]);

  const sortedSwapAssets = useMemo(
    () =>
      [...filteredSwapAssets].sort((a, b) =>
        compareAssetsForDisplay(a, b, assetSearchTerm)
      ),
    [filteredSwapAssets, assetSearchTerm]
  );

  const getAssetKeyForGrouping = (asset: any): string => {
    return `${(asset?.ticker || asset?.symbol || asset?.name || "")
      .toString()
      .toLowerCase()}|${(asset?.network || "")
      .toString()
      .toLowerCase()}`;
  };

  const getCurrencyLower = (asset: any): string => {
    if (!asset) return "";
    if (asset.ticker) return String(asset.ticker).toLowerCase();
    if (asset.symbol) {
      if (asset.symbol === "USDT Tether") return "usdt";
      return String(asset.symbol).toLowerCase();
    }
    if (asset.name) return String(asset.name).toLowerCase();
    return "";
  };

  // Force "Popular Currencies" to always be: USDT (BSC), USDC (BSC), FXPRIMUS.
  // This prevents BTC (or others) from accidentally landing in Popular due to sorting quirks.
  const popularAssets = useMemo(() => {
    const sourceAssets: SupportedAsset[] = (assetsDisplay.displayData ||
      []) as SupportedAsset[];

    const usdtAsset = sourceAssets.find(
      (a) =>
        getCurrencyLower(a) === "usdt" && String(a?.network || "").toLowerCase() === "bsc"
    );
    const usdcAsset = sourceAssets.find(
      (a) =>
        getCurrencyLower(a) === "usdc" && String(a?.network || "").toLowerCase() === "bsc"
    );
    const fxprimusAsset = sourceAssets.find((a) => isForexPrimusAsset(a));

    return [usdtAsset, usdcAsset, fxprimusAsset].filter(Boolean) as SupportedAsset[];
  }, [assetsDisplay.displayData, isHomePage]);

  const popularKeySet = useMemo(
    () => new Set(popularAssets.map((a) => getAssetKeyForGrouping(a))),
    [popularAssets]
  );

  const allAssetsList = useMemo(() => {
    if (assetSearchTerm) return sortedSwapAssets;
    return sortedSwapAssets.filter((a) => !popularKeySet.has(getAssetKeyForGrouping(a)));
  }, [assetSearchTerm, sortedSwapAssets, popularKeySet]);

  const assetDropdownRows = useMemo(
    () =>
      buildAssetDropdownRows(
        sortedSwapAssets,
        assetSearchTerm,
        [],
        allAssetsList,
        popularAssets
      ),
    [sortedSwapAssets, assetSearchTerm, allAssetsList, popularAssets]
  );

  const renderAssetDropdown = () => {
    if (!isComponentMounted || !isAssetDropdownOpen) {
      return null;
    }

    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0;
    const minMargin = 16;
    const isMobileViewport = viewportWidth < 640;
    const minWidth = isMobileViewport ? 0 : 460;
    const maxWidth = isMobileViewport ? viewportWidth - minMargin * 2 : 460;

    // Find the card that contains the asset dropdown trigger
    const assetDropdownElement = assetDropdownRef.current;
    let currentCard: Element | null = null;

    if (assetDropdownElement) {
      // Traverse up the DOM to find the parent card
      let parent = assetDropdownElement.parentElement;
      while (parent) {
        if (parent.hasAttribute('data-asset-card') || parent.hasAttribute('data-select-card')) {
          currentCard = parent;
          break;
        }
        parent = parent.parentElement;
      }
    }

    // Fallback to first card if we can't find the current card
    if (!currentCard) {
      currentCard = document.querySelector("[data-select-card='true']") ||
        document.querySelector("[data-asset-card='true']");
    }

    let dropdownStyle: React.CSSProperties = {
      position: "fixed",
      top: 200,
      left: (viewportWidth - minWidth) / 2,
      width: minWidth,
    };

    if (currentCard && assetDropdownElement) {
      const cardRect = currentCard.getBoundingClientRect();
      const dropdownRect = assetDropdownElement.getBoundingClientRect();

      if (isMobileViewport) {
        let width = Math.min(cardRect.width, viewportWidth - minMargin * 2);
        let left = cardRect.left;

        if (left < minMargin) {
          left = minMargin;
        }
        if (left + width > viewportWidth - minMargin) {
          width = Math.max(0, viewportWidth - minMargin * 2);
          left = minMargin;
        }

        dropdownStyle = {
          position: "fixed",
          top: cardRect.top,
          left,
          width,
        };
      } else {
      // Check if this is "You Send" section (has data-asset-card) or "You Receive" section
      // "You Send" has both data-asset-card and data-select-card
      // "You Receive" has only data-select-card
      const isYouSend = currentCard.hasAttribute('data-asset-card');

      // Width: make the dropdown a bit wider and ensure it grows to the right.
      // Match Payment Method dropdown sizing behavior (no extra right-side growth).
      let desiredWidth = Math.min(
        maxWidth,
        Math.max(minWidth, dropdownRect.width)
      );

      // Position dropdown starting at the top of the card container
      let top = cardRect.top;

      // Left-align with the asset selector element's left edge
      let left = dropdownRect.left;

      // Ensure it doesn't go off the left edge
      if (left < minMargin) {
        left = minMargin;
      }

      // Keep dropdown aligned to the right side and inside viewport/card.
      desiredWidth = Math.max(0, Math.min(desiredWidth, viewportWidth - minMargin * 2));
      if (left + desiredWidth > viewportWidth - minMargin) {
        // Keep left edge fixed; shrink from the right if needed.
        desiredWidth = Math.max(0, viewportWidth - minMargin - left);
      }
      if (left < cardRect.left) left = cardRect.left;
      if (left + desiredWidth > cardRect.right) {
        // Keep left edge fixed; shrink from the right inside card bounds.
        desiredWidth = Math.max(0, cardRect.right - left);
      }

      dropdownStyle = {
        position: "fixed",
        top,
        left,
        width: desiredWidth,
      };
      }
    }

    const handlePickAsset = (asset: SupportedAsset) => {
      if (calculationTimeout) {
        clearTimeout(calculationTimeout);
      }
      if (estimateTimeoutRef.current) {
        clearTimeout(estimateTimeoutRef.current);
        estimateTimeoutRef.current = null;
      }

      setEstimate(null);
      setEstimateError(null);
      setEstimateLoading(false);
      setCalculationError(null);
      setReceiveAmountError(null);
      setApiValidationError(null);
      setExchangeLookupResponse(null);

      setSelectedAsset(asset);
      setIsAssetDropdownOpen(false);
      setAssetSearchTerm("");
      if (isHomePage) setAssetFilterTab("all");

      if (isSimpleCalculationAsset(asset)) {
        setIsCalculatingFromPay(true);
        if (!isUserModifiedAmount) {
          const defaultAmount = getDefaultAmount(asset);
          setPayAmount(defaultAmount);
          setPayAmountInput(defaultAmount.toString());
          calculateAmounts(defaultAmount, true);
        } else {
          calculateAmounts(payAmount, true);
        }
      } else if (isForexAsset(asset)) {
        setIsCalculatingFromPay(true);
        if (!isUserModifiedAmount) {
          const defaultAmount = getDefaultAmount(asset);
          setPayAmount(defaultAmount);
          setPayAmountInput(defaultAmount.toString());
          calculateAmounts(defaultAmount, true);
        } else {
          calculateAmounts(payAmount, true);
        }
      } else {
        setIsCalculatingFromPay(true);
        setIsCalculating(true);
        setIsCalculatingReceive(true);
        setEstimateLoading(true);
        if (!isUserModifiedAmount) {
          const defaultAmount = getDefaultAmount(asset);
          setPayAmount(defaultAmount);
          setPayAmountInput(defaultAmount.toString());
        }
      }
    };

    return createPortal(
      (
        <div
          ref={assetDropdownContentRef}
          className="bg-white dark:bg-[#1D1D23] border border-gray-300 dark:border-[#35353E] rounded-2xl shadow-xl z-[9999] max-h-[85vh] sm:max-h-[70vh] overflow-hidden flex flex-col"
          style={dropdownStyle}
        >
          {/* Dropdown Title */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-600 shrink-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Currency from</h3>
            <button
              onClick={() => {
                setIsAssetDropdownOpen(false);
                if (isHomePage) setAssetFilterTab("all");
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-600 shrink-0">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7e7e8f] w-4 h-4" />
              <input
                type="text"
                placeholder="Type a currency"
                className="w-full text-gray-900 dark:text-white dark:bg-gray-800 bg-gray-50 rounded-lg px-10 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
                value={assetSearchTerm}
                onChange={(e) => setAssetSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Tabs - Only show for home page */}
          {isHomePage && (
            <div className="flex items-center gap-2 px-2 py-2 border-b border-gray-200 dark:border-gray-600 overflow-x-auto shrink-0">
              <button
                onClick={() => {
                  setAssetFilterTab("all");
                  if (assetListRef.current) assetListRef.current.scrollTop = 0;
                }}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-2xl whitespace-nowrap transition-colors ${assetFilterTab === "all"
                  ? "bg-[#1D8751] text-white"
                  : "bg-[#35353E] text-gray-300 hover:bg-[#40404A]"
                  }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setAssetFilterTab("new");
                  if (assetListRef.current) assetListRef.current.scrollTop = 0;
                }}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-2xl whitespace-nowrap transition-colors ${assetFilterTab === "new"
                  ? "bg-[#1D8751] text-white"
                  : "bg-[#35353E] text-gray-300 hover:bg-[#40404A]"
                  }`}
              >
                New
              </button>
              <button
                onClick={() => {
                  setAssetFilterTab("gainers");
                  if (assetListRef.current) assetListRef.current.scrollTop = 0;
                }}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-2xl whitespace-nowrap transition-colors ${assetFilterTab === "gainers"
                  ? "bg-[#1D8751] text-white"
                  : "bg-[#35353E] text-gray-300 hover:bg-[#40404A]"
                  }`}
              >
                Gainers
              </button>
              <button
                onClick={() => {
                  setAssetFilterTab("losers");
                  if (assetListRef.current) assetListRef.current.scrollTop = 0;
                }}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-2xl whitespace-nowrap transition-colors ${assetFilterTab === "losers"
                  ? "bg-[#1D8751] text-white"
                  : "bg-[#35353E] text-gray-300 hover:bg-[#40404A]"
                  }`}
              >
                Losers
              </button>
            </div>
          )}

          <div ref={assetListRef} className="overflow-y-auto p-1 flex-1 min-h-0">
            {sortedSwapAssets.length > 0 ? (
              <AssetDropdownVirtualized
                rows={assetDropdownRows}
                selectedAsset={selectedAsset}
                onAssetSelect={handlePickAsset}
              />
            ) : (
              <div className="p-4 text-center text-[#7e7e8f] dark:text-[#788099]">
                {assetSearchTerm ? "No assets found" : "No assets available"}
              </div>
            )}
          </div>
        </div>
      ),
      document.body
    );
  };

  // Calculate fees and amounts - Network fee is always 0 for BEP20
  const networkFee = 0;
  const exchangeCommissionRule =
    (exchangeLookupResponse?.local_commission as any)?.commission_mode
      ? (exchangeLookupResponse?.local_commission as any)
      : (exchangeLookupResponse?.crypto_commission as any)?.commission_mode
        ? (exchangeLookupResponse?.crypto_commission as any)
        : null;
  const getExchangeLookupCommissionAmount = (baseAmount: number): number => {
    if (!exchangeCommissionRule) return 0;
    if (exchangeCommissionRule.commission_mode === "flat_fee") {
      const fee = exchangeCommissionRule.fee != null ? parseFloat(exchangeCommissionRule.fee) : NaN;
      return Number.isNaN(fee) ? 0 : fee;
    }
    const rate = exchangeCommissionRule.rate != null ? parseFloat(exchangeCommissionRule.rate) : NaN;
    return Number.isNaN(rate) ? 0 : (baseAmount * rate) / 100;
  };
  const getExchangeLookupGrossAmount = (netAmount: number): number => {
    if (!exchangeCommissionRule) return netAmount;
    const fee = exchangeCommissionRule.fee != null ? parseFloat(exchangeCommissionRule.fee) : NaN;
    if (!Number.isNaN(fee)) return netAmount + fee;
    const rate = exchangeCommissionRule.rate != null ? parseFloat(exchangeCommissionRule.rate) : NaN;
    return Number.isNaN(rate) || rate >= 100 ? netAmount : netAmount / (1 - rate / 100);
  };

  // Use commission API for USDT/USDC/FX Primus - API returns % (e.g. {"commission":"2.00"} = 2%)
  let commissionAmount = 0;
  if (
    selectedAsset &&
    isExchangeCommissionLookupAsset(selectedAsset) &&
    exchangeCommissionRule
  ) {
    const lc = exchangeCommissionRule;
    if (lc.commission_mode === "flat_fee") {
      const fee = lc.fee != null ? parseFloat(lc.fee) : NaN;
      commissionAmount = Number.isNaN(fee) ? 0 : fee;
    } else if (lc.commission_mode === "percentage") {
      const rate = lc.rate != null ? parseFloat(lc.rate) : NaN;
      commissionAmount = Number.isNaN(rate) ? 0 : (payAmount * rate) / 100;
    }
  } else if (selectedAsset && isSimpleCalculationAsset(selectedAsset)) {
    if (isCommissionApiAsset(selectedAsset)) {
      const rate = apiCommission ?? 2; // Default 2% while API loads
      commissionAmount = (payAmount * rate) / 100;
    } else {
      const commissionRate = selectedAsset?.range_commissions?.[0]?.commission
        ? parseFloat(selectedAsset.range_commissions[0].commission)
        : 2;
      commissionAmount = (payAmount * commissionRate) / 100;
    }
  } else if (
    selectedAsset &&
    isForexAsset(selectedAsset) &&
    isCommissionApiAsset(selectedAsset)
  ) {
    commissionAmount =
      apiCommission == null ? 0 : (payAmount * apiCommission) / 100;
  } else {
    // Use default commission rate for other assets
    const commissionRate = selectedAsset?.range_commissions?.[0]?.commission
      ? parseFloat(selectedAsset.range_commissions[0].commission)
      : 2; // Default 2% commission for other assets
    commissionAmount = (payAmount * commissionRate) / 100;
  }

  const totalFees = networkFee + commissionAmount;

  // Stable calculation function with debouncing
  const calculateAmounts = (fromAmount: number, fromPay: boolean = true) => {
    // Clear any existing timeout
    if (calculationTimeout) {
      clearTimeout(calculationTimeout);
    }

    // For simple calculations, do them immediately without any delays (API commission is % e.g. 2 = 2%)
    if (fromPay && selectedAsset && isSimpleCalculationAsset(selectedAsset)) {
      const commissionAmount = isCommissionApiAsset(selectedAsset)
        ? (fromAmount * (apiCommission ?? 2)) / 100
        : (fromAmount * (selectedAsset?.range_commissions?.[0]?.commission ? parseFloat(selectedAsset.range_commissions[0].commission) : 2)) / 100;
      const calculatedGetAmount = capReceiveAmount(Math.max(0, fromAmount - commissionAmount));

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
      if (isOtcPopupAsset(selectedAsset) && calculatedGetAmount >= MAX_RECEIVE_AMOUNT_USD) {
        setIsInfoModalOpen(true);
      }

      // No loading states for simple calculations - instant result
      setIsCalculating(false);
      setIsCalculatingReceive(false);
      return;
    }

    // FX Primus: commission % from API, or 1:1 when no commission configured
    if (fromPay && selectedAsset && isForexAsset(selectedAsset)) {
      const hasPct =
        apiCommission != null && !Number.isNaN(Number(apiCommission));
      const rawReceive = hasPct
        ? Math.max(0, fromAmount - (fromAmount * Number(apiCommission)) / 100)
        : fromAmount;
      const calculatedGetAmount = capReceiveAmount(rawReceive);

      if (fromAmount <= 0) {
        setGetAmount(0);
        setGetAmountInput("");
        setPreviousValidAmount("");
      } else {
        const inputStr = formatAmountForInput(calculatedGetAmount);
        setGetAmount(calculatedGetAmount);
        setGetAmountInput(inputStr);
        setPreviousValidAmount(inputStr);
      }

      const validationError = validateReceiveAmount(
        calculatedGetAmount,
        selectedAsset
      );
      setReceiveAmountError(validationError);

      if (isOtcPopupAsset(selectedAsset) && calculatedGetAmount >= MAX_RECEIVE_AMOUNT_USD) {
        setIsInfoModalOpen(true);
      }

      setIsCalculating(false);
      setIsCalculatingReceive(false);
      return;
    }

    if (!fromPay && selectedAsset && isForexAsset(selectedAsset)) {
      const calculatedPayAmount = getFxpReversePayAmount(fromAmount);

      setPayAmount(calculatedPayAmount);
      setPayAmountInput(formatAmountForInput(calculatedPayAmount));

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
          // Calculate from pay amount to receive amount (API commission is % e.g. 2 = 2%)
          if (isSimpleCalculationAsset(selectedAsset)) {
            const commissionAmount =
              selectedAsset &&
              isExchangeCommissionLookupAsset(selectedAsset) &&
              exchangeCommissionRule
                ? getExchangeLookupCommissionAmount(fromAmount)
                : isCommissionApiAsset(selectedAsset)
                  ? (fromAmount * (apiCommission ?? 2)) / 100
                  : (fromAmount *
                      (selectedAsset?.range_commissions?.[0]?.commission
                        ? parseFloat(selectedAsset.range_commissions[0].commission)
                        : 2)) /
                    100;
            const calculatedGetAmount = capReceiveAmount(Math.max(0, fromAmount - commissionAmount));

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
            if (isOtcPopupAsset(selectedAsset) && calculatedGetAmount >= MAX_RECEIVE_AMOUNT_USD) {
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
              const finalAmount = capReceiveAmount(
                Math.max(0, estimate.toAmount || estimate.estimated_amount)
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

              if (isOtcPopupAsset(selectedAsset) && finalAmount >= MAX_RECEIVE_AMOUNT_USD) {
                setIsInfoModalOpen(true);
              }
            } else if (estimateLoading) {
              // Show loading state while estimate is being fetched
              setIsCalculating(true);
              setIsCalculatingReceive(true);
              // Don't update amounts yet, wait for estimate
            } else {
              // For non-direct assets, only show loading until API estimate is available
              // Don't do manual calculations - wait for API
              setIsCalculating(true);
              setIsCalculatingReceive(true);
            }
          }
        } else {
          // Calculate from receive amount to pay amount (API commission is % e.g. 2 = 2%)
          if (isSimpleCalculationAsset(selectedAsset)) {
            const newPayAmount =
              selectedAsset &&
              isExchangeCommissionLookupAsset(selectedAsset) &&
              exchangeCommissionRule
                ? getExchangeLookupGrossAmount(fromAmount)
                : (() => {
                    const commissionRate = isCommissionApiAsset(selectedAsset)
                      ? apiCommission ?? 2
                      : selectedAsset?.range_commissions?.[0]?.commission
                        ? parseFloat(selectedAsset.range_commissions[0].commission)
                        : 2;
                    return fromAmount / (1 - commissionRate / 100);
                  })();
            setPayAmount(newPayAmount);
            setPayAmountInput(newPayAmount.toString());

            // Clear loading states for simple assets - calculation is instant
            setIsCalculating(false);
            setIsCalculatingReceive(false);
          } else {
            // For non-direct assets, we need to fetch estimate for reverse calculation
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
    const fixedMin = getMinimumAmount(selectedAsset);
    if (
      selectedAsset &&
      isFixedMinWithdrawalAsset(selectedAsset) &&
      payAmount > 0 &&
      payAmount < fixedMin
    ) {
      setReceiveAmountError(formatExpressMinAmountMessage(fixedMin));
      return;
    }

    if (getAmount > 0) {
      setReceiveAmountError(validateReceiveAmount(getAmount, selectedAsset));
    } else {
      setReceiveAmountError(null);
    }
  }, [getAmount, payAmount, selectedAsset]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (calculationTimeout) {
        clearTimeout(calculationTimeout);
      }
      if (estimateTimeoutRef.current) {
        clearTimeout(estimateTimeoutRef.current);
        estimateTimeoutRef.current = null;
      }
    };
  }, [calculationTimeout]);

  // Re-validate wallet address when asset changes (always BEP20)
  useEffect(() => {
    if (walletAddress.trim() && selectedAsset) {
      const validation = validateWalletAddress(walletAddress, "BEP20");
      if (!validation.isValid) {
        setWalletError(validation.message || "Invalid wallet address format");
      } else {
        setWalletError(null);
      }
    }
  }, [selectedAsset, walletAddress]);

  // Clear calculation-only errors when amount is cleared or form is reset
  useEffect(() => {
    if (!payAmount || payAmount === 0 || payAmountInput === "" || payAmountInput === "0") {
      // Keep apiValidationError so backend min-amount / format errors stay visible
      setReceiveAmountError(null);
      setEstimateError(null);
      setCalculationError(null);
    }
  }, [payAmount, payAmountInput]);

  // Clear persisted submit error when user changes amount or asset
  useEffect(() => {
    submitAmountErrorRef.current = null;
  }, [payAmount, payAmountInput, selectedAsset?.asset_id, selectedAsset?.ticker, selectedAsset?.network]);

  // Validate first card data
  const validateFirstCard = () => {
    const errors: string[] = [];

    // Clear previous payment method error
    setPaymentMethodError(null);

    // Check if amount is entered
    if (!payAmountInput || payAmountInput.trim() === "") {
      errors.push("Please enter an amount");
      showToast.error("Please enter an amount");
      return false;
    }

    // Check if amount is valid
    if (!payAmount || payAmount <= 0) {
      errors.push("Please enter a valid amount greater than 0");
      showToast.error("Please enter a valid amount greater than 0");
      return false;
    }

    // Check if asset is selected
    if (!selectedAsset) {
      errors.push("Please select an asset");
      showToast.error("Please select an asset");
      return false;
    }

    // Check if payment method is selected
    if (effectiveSelectedPaymentDetails.length === 0) {
      setPaymentMethodError("Please select a payment method");
      errors.push("Please select a payment method");
      showToast.error("Please select a payment method");
      return false;
    }

    // Check if selected payment is pending (not approved/verified)
    const selected = effectiveSelectedPaymentDetails[0];
    if (selected?.status && !isApprovedPaymentStatus(selected.status)) {
      const restrictionMessage = getPaymentRestrictionMessage(selected.status);
      setPaymentMethodError(restrictionMessage);
      errors.push(restrictionMessage);
      showToast.error(restrictionMessage);
      return false;
    }

    // Check if pay amount meets minimum for fixed-min assets
    if (isPayBelowFixedMin) {
      const minMsg = formatExpressMinAmountMessage(getMinimumAmount(selectedAsset));
      errors.push(minMsg);
      showToast.error(minMsg);
      setValidationErrors(errors);
      return false;
    }

    // Check if receive amount meets minimum requirements (only if user has entered a value)
    if (getAmount > 0) {
      const validationError = validateReceiveAmount(getAmount, selectedAsset);
      if (validationError) {
        errors.push(validationError);
        showToast.error(validationError);
        setValidationErrors(errors);
        return false;
      }
    }

    setValidationErrors(errors);
    return true;
  };

  const handleFirstCardSubmit = async () => {
    if (validateFirstCard()) {
      // Check if user is verified (KYC check) - verify with API
      if (isAuthenticated && user) {
        // Check KYC status from API to get the latest status
        try {
          const kycResult = await dispatch(checkKYCStatus()).unwrap();
          const kycStatus = kycResult as any;

          // Strict KYC gate: only explicit verified=true can proceed.
          if (!kycStatus || kycStatus.is_verified !== true) {
            dispatch(openKYCModal());
            return;
          }
        } catch (error) {
          // On verification check failure, block progression and show KYC modal.
          dispatch(openKYCModal());
          return;
        }
      }

      setIsSubmitting(true);
      setIsTransactionSubmitted(false);

      try {
        const selectedAssetId = String((selectedAsset as any)?.asset_id || "").trim();
        if (!isUuid(selectedAssetId)) {
          throw new Error("Asset ID is missing or invalid");
        }
        const resolvedUserPaymentDetailId = Number(selectedPaymentDetails[0]?.id);
        if (!Number.isFinite(resolvedUserPaymentDetailId) || resolvedUserPaymentDetailId <= 0) {
          throw new Error("Selected payment method is missing account ID");
        }
        // Create withdrawal payload for express API
        const withdrawalPayload: ExpressWithdrawalPayload = {
          asset: isForexPrimusAsset(selectedAsset)
            ? "fxprimus"
            : selectedAsset.ticker?.toUpperCase() ||
              selectedAsset.symbol?.toUpperCase(),
          asset_id: selectedAssetId,
          amount: payAmount.toString(),
          network:
            selectedNetwork?.network_id ||
            selectedNetwork?.network_type ||
            selectedAsset.network,
          ...(selectedNetwork?.network_id
            ? { network_id: String(selectedNetwork.network_id) }
            : {}),
          // Backend expects the numeric payment detail row id (e.g. 3502).
          user_payment_detail_id: String(resolvedUserPaymentDetailId),
        };


        // Submit to express withdrawal API
        const withdrawalResponse =
          await createExpressWithdrawal(withdrawalPayload);


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
          // Direct transfer response for direct assets
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

        // Mark transaction as submitted and stop loading
        setIsTransactionSubmitted(true);
        setForceUpdate(forceUpdate + 1);


      } catch (error: any) {
        const errorMessage = extractApiErrorMessage(
          error,
          "Failed to submit withdrawal request"
        );

        const amountInline =
          resolveExpressAmountInlineError(error) ||
          resolveExpressAmountInlineError(errorMessage);
        const displayError = (amountInline || errorMessage).trim();
        persistSubmitAmountError(displayError);
        if (!isHomePage && !amountInline) {
          showToast.error(errorMessage);
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

    // Clear previous payment method error
    setPaymentMethodError(null);

    if (!payAmount || payAmount <= 0) {
      errors.push("Please enter a valid amount");
    }

    if (!selectedAsset) {
      errors.push("Please select an asset");
    }

    if (effectiveSelectedPaymentDetails.length === 0) {
      errors.push("Please select at least one payment method");
      setPaymentMethodError("Please select a payment method");
    }

    if (!walletAddress.trim()) {
      errors.push("Please enter your wallet address");
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

    // Prevent submission if amount exceeds $15,000
    if (isOtcPopupAsset(selectedAsset) && (payAmount > 15000 || getAmount > 15000)) {
      showToast.error("Amount cannot exceed $15,000. Please contact OTC Desk for larger amounts.");
      setIsInfoModalOpen(true);
      return;
    }

    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      showToast.error("Please fix the following errors: " + errors.join(", "));
      return;
    }

    // Check if user is verified (KYC check) - verify with API
    if (isAuthenticated && user) {
      // Check KYC status from API to get the latest status
      try {
        const kycResult = await dispatch(checkKYCStatus()).unwrap();
        const kycStatus = kycResult as any;

        // Strict KYC gate: only explicit verified=true can proceed.
        if (!kycStatus || kycStatus.is_verified !== true) {
          dispatch(openKYCModal());
          return;
        }
      } catch (error) {
        // On verification check failure, block progression and show KYC modal.
        dispatch(openKYCModal());
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === "withdrawal") {
        const selectedAssetId = String((selectedAsset as any)?.asset_id || "").trim();
        if (!isUuid(selectedAssetId)) {
          throw new Error("Asset ID is missing or invalid");
        }
        const resolvedUserPaymentDetailId = Number(selectedPaymentDetails[0]?.id);
        if (!Number.isFinite(resolvedUserPaymentDetailId) || resolvedUserPaymentDetailId <= 0) {
          throw new Error("Selected payment method is missing account ID");
        }
        // Handle withdrawal submission
        const withdrawalPayload: ExpressWithdrawalPayload = {
          asset: isForexPrimusAsset(selectedAsset)
            ? "fxprimus"
            : selectedAsset.ticker?.toUpperCase() ||
              selectedAsset.symbol?.toUpperCase(),
          asset_id: selectedAssetId,
          amount: payAmount.toString(),
          network:
            selectedNetwork?.network_id ||
            selectedNetwork?.network_type ||
            selectedAsset.network,
          ...(selectedNetwork?.network_id
            ? { network_id: String(selectedNetwork.network_id) }
            : {}),
          // Backend expects the numeric payment detail row id (e.g. 3502).
          user_payment_detail_id: String(resolvedUserPaymentDetailId),
        };

        // Submit to express withdrawal API
        const withdrawalResponse =
          await createExpressWithdrawal(withdrawalPayload);

        // Handle different response types based on asset
        const isSimpleAsset = isSimpleCalculationAsset(selectedAsset);

        if (isSimpleAsset) {
          // Direct transfer response for direct assets
          const directTransferResponse = withdrawalResponse as any;

          if (directTransferResponse.type === "direct_transfer") {
            if (onExchange) {
              const transactionData = {
                type: "withdrawal" as const,
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
                paymentDetail: selectedPaymentDetail,
                walletAddress: walletAddress,
                network: selectedNetwork,
                transactionId: directTransferResponse.transaction_id,
                withdrawalAddress: directTransferResponse.withdrawal_address,
                message: directTransferResponse.message,
                websocketUrl: directTransferResponse.websocket_url,
                responseType: "direct_transfer",
                paymentDetails: selectedPaymentDetails,
              };

              onExchange(transactionData);
              setIsTransactionSubmitted(true);
              setForceUpdate(forceUpdate + 1); // Force re-render
            }
          }
        } else {
          // ChangeNow swap response for other assets
          const changeNowResponse = withdrawalResponse as any;

          if (changeNowResponse.data?.type === "changenow_swap") {
            if (onExchange) {
              const transactionData = {
                type: "withdrawal" as const,
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
                paymentDetail: selectedPaymentDetail,
                walletAddress: walletAddress,
                network: selectedNetwork,
                transactionId: changeNowResponse.data?.transaction_id,
                withdrawalAddress:
                  changeNowResponse.data?.details?.withdrawal_address,
                payoutAddress: changeNowResponse.data?.details?.payout_address,
                fromCurrency: changeNowResponse.data?.details?.from_currency,
                toCurrency: "USD",
                toNetwork: changeNowResponse.data?.details?.to_network,
                estimatedAmount:
                  changeNowResponse.data?.details?.estimated_amount,
                changeNowId: changeNowResponse.data?.details?.changenow_id,
                message: changeNowResponse.data?.message,
                websocketUrl: changeNowResponse.data?.websocket_url,
                responseType: "changenow_swap",
                paymentDetails: selectedPaymentDetails,
              };

              onExchange(transactionData);
              setIsTransactionSubmitted(true);
              setForceUpdate(forceUpdate + 1); // Force re-render
            }
          }
        }
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

        const providerName = selectedPaymentDetail.payment_provider_name || selectedPaymentDetail.provider_name;
        if (!providerName) {
          throw new Error("Payment provider is missing");
        }
        depositPayload.append(
          "payment_provider",
          providerName
        );

        if (!selectedPaymentDetail.payment_method_type) {
          throw new Error("Payment method is missing");
        }
        depositPayload.append(
          "payment_method",
          selectedPaymentDetail.payment_method_type
        );
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
        depositPayload.append(
          "asset",
          isForexPrimusAsset(selectedAsset)
            ? "fxprimus"
            : selectedAsset.asset_id
        );
        depositPayload.append(
          "additional_info",
          `Account: ${selectedPaymentDetail.account_name}, Account Number: ${selectedPaymentDetail.account_number}`
        );

        // Submit to API - let axios set the correct Content-Type for FormData
        const depositResponse = (await dispatch(
          createDeposit({
            payload: depositPayload,
            config: {
              // Don't set Content-Type manually for FormData - let axios handle it
            },
          })
        ).unwrap()) as unknown as DepositResponse;

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
            paymentDetail: selectedPaymentDetail,
            walletAddress: walletAddress,
            network: selectedNetwork,
            transactionId: depositResponse.transaction_id,
            depositCode: depositResponse.deposit_code,
            totalAmountDue: depositResponse.total_amount_due,
            commission: depositResponse.commission as string,
            networkFee: depositResponse.network_fee as string,
            currency: depositResponse.currency,
            websocketUrl: depositResponse.websocket?.url,
            paymentDetails: selectedPaymentDetails,
          };

          onExchange(transactionData);
        }
      }
    } catch (error: any) {
      const errorMessage = extractApiErrorMessage(
        error,
        `Failed to submit ${mode} request`
      );

      const amountInline =
        resolveExpressAmountInlineError(error) ||
        resolveExpressAmountInlineError(errorMessage);
      const displayError = (amountInline || errorMessage).trim();
      persistSubmitAmountError(displayError);
      if (!isHomePage && !amountInline) {
        showToast.error(errorMessage);
        setValidationErrors([errorMessage]);
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

  useEffect(() => {
    if (selectedPaymentDetail && paymentDetailsRef.current) {
      paymentDetailsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setTimeout(() => {
        window.scrollBy({ top: -80, left: 0, behavior: "smooth" });
      }, 400);
    }
  }, [selectedPaymentDetail]);

  return (
    <div className="w-full flex flex-col dark:bg-[#18181D]  ">
      {/* Crypto/Forex Toggle Buttons Removed */}

      {transactionMode === "forex" ? (
        <ForexWithdrawal
          payAmount={payAmount}
          getAmount={getAmount}
          selectedPaymentDetails={selectedPaymentDetails}
        />
      ) : (
        <>
          <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
            {/* <span className="text-[#7e7e8f] dark:text-[#788099]">1-</span> Transaction Info */}
          </h2>

          <div className="w-full text-white">
            {/* Top Section - You Send and You Get in one card */}
            <div className="relative mb-2">
              {/* Top Card Container */}
              <div
                data-asset-card="true"
                data-select-card="true"
                className={`relative flex flex-col sm:flex-row gap-4 rounded-2xl p-3 sm:p-4 overflow-visible ${isDark ? "bg-[#0F0F17] border border-[#2F2F3A]" : "bg-white border border-[#E2E8F0] shadow-sm"
                  }`}
              >
                {/* You Send Section */}
                <div className="flex-1 min-w-0">
                  <label className="block text-[15px] text-[#475569] dark:text-[#9CA3AF] mb-2 font-semibold flex items-center gap-2">
                    {t("express.youSend", "You Send")}
                    {isCalculatingFromPay &&
                      (isCalculating || isCalculatingReceive) && (
                        <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
                      )}
                  </label>
                  <div className={`text-xs mb-1 ${isDark ? "text-[#788099]" : "text-[#64748B]"
                    }`}>
                    {t("express.amount", "Amount")}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={payAmountInput}
                      onChange={(e) => {
                        const rawInput = stripLeadingZerosFromDecimalInput(
                          e.target.value
                        );
                        const inputValue = enforceExpressAmountDigitLimit(rawInput);

                        // Allow any numeric input including negative numbers and 0
                        if (inputValue === "" || /^-?\d*\.?\d*$/.test(inputValue)) {
                          if (inputValue !== rawInput) {
                            setApiValidationError(EXPRESS_AMOUNT_DIGIT_LIMIT_MESSAGE);
                          }
                          // Check for decimal places validation
                          if (inputValue.includes(".")) {
                            const decimalPart = inputValue.split(".")[1];
                            if (decimalPart && decimalPart.length > 5) {
                              setApiValidationError("Number cannot have more than 5 decimal places.");
                              return;
                            }
                          }

                          // Convert to number for calculations
                          const parsedValue =
                            inputValue === "" ? 0 : parseFloat(inputValue) || 0;

                          const newValue = parsedValue;

                          // Only update state and calculate if value actually changed
                          if (newValue !== payAmount || inputValue !== payAmountInput) {
                            setPayAmountInput(inputValue);
                            setPayAmount(newValue);
                            setIsCalculatingFromPay(true);

                            // Mark that user has manually modified the amount
                            setIsUserModifiedAmount(true);

                            // Clear any previous errors when user starts typing
                            setReceiveAmountError(null);
                            setApiValidationError(null);
                            setCalculationError(null);

                            // If user cleared input, clear the other side too.
                            if (inputValue.trim() === "") {
                              setGetAmount(0);
                              setGetAmountInput("");
                              setPreviousValidAmount("");
                              setIsCalculating(false);
                              setIsCalculatingReceive(false);
                              return;
                            }

                            // Only calculate if we have a valid amount and asset
                            if (selectedAsset && newValue >= 0) {
                              // Check asset type first and handle accordingly
                              if (isSimpleCalculationAsset(selectedAsset)) {
                                // For direct assets (USDT on BSC, USDC on BSC), calculate immediately (API commission is % e.g. 2 = 2%)
                                const commissionAmount = isCommissionApiAsset(selectedAsset)
                                  ? (newValue * (apiCommission ?? 2)) / 100
                                  : (newValue * (selectedAsset?.range_commissions?.[0]?.commission ? parseFloat(selectedAsset.range_commissions[0].commission) : 2)) / 100;
                                const calculatedGetAmount = capReceiveAmount(Math.max(0, newValue - commissionAmount));
                                setGetAmount(calculatedGetAmount);
                                setGetAmountInput(calculatedGetAmount.toString());
                                setPreviousValidAmount(calculatedGetAmount.toString());
                                if (isOtcPopupAsset(selectedAsset) && calculatedGetAmount >= MAX_RECEIVE_AMOUNT_USD) {
                                  setIsInfoModalOpen(true);
                                }
                                // Clear loading states for simple assets - calculation is instant
                                setIsCalculating(false);
                                setIsCalculatingReceive(false);
                              } else if (isForexAsset(selectedAsset)) {
                                const hasPct =
                                  apiCommission != null &&
                                  !Number.isNaN(Number(apiCommission));
                                const rawReceive = hasPct
                                  ? Math.max(
                                      0,
                                      newValue -
                                        (newValue * Number(apiCommission)) / 100
                                    )
                                  : newValue;
                                const calculatedGetAmount =
                                  capReceiveAmount(rawReceive);
                                const inputStr = hasPct
                                  ? formatAmountForInput(calculatedGetAmount)
                                  : inputValue;
                                setGetAmount(calculatedGetAmount);
                                setGetAmountInput(inputStr);
                                setPreviousValidAmount(inputStr);
                                if (isOtcPopupAsset(selectedAsset) && calculatedGetAmount >= MAX_RECEIVE_AMOUNT_USD) {
                                  setIsInfoModalOpen(true);
                                }
                                setIsCalculating(false);
                                setIsCalculatingReceive(false);
                              } else if (newValue > 0) {
                                // For non-simple assets, stop normal calculation and go directly to API

                                // Stop any ongoing normal calculations first
                                if (calculationTimeout) {
                                  clearTimeout(calculationTimeout);
                                }
                        if (estimateTimeoutRef.current) {
                          clearTimeout(estimateTimeoutRef.current);
                          estimateTimeoutRef.current = null;
                        }

                                // Clear previous calculation states
                                setEstimate(null);
                                setEstimateError(null);
                                setEstimateLoading(false);
                                setCalculationError(null);
                                setReceiveAmountError(null);
                                setApiValidationError(null);
                                setApiValidationError(null);

                                // Store current value as previous valid amount before showing loading
                                if (
                                  getAmountInput &&
                                  getAmountInput !== "0" &&
                                  !isCalculating
                                ) {
                                  setPreviousValidAmount(getAmountInput);
                                }

                                // Keep field empty during calculation - no intermediate values
                                setGetAmount(0);
                                setGetAmountInput("");
                                if (!apiValidationError) {
                                  if (!apiValidationError) {
                                    setReceiveAmountError("Calculating..."); // Show immediate feedback
                                  }
                                }

                                // Set loading state for visual feedback
                                setIsCalculating(true);
                                setIsCalculatingReceive(true);
                                setEstimateLoading(true);

                                // Go directly to API calculation - the estimate useEffect will handle it
                              } else {
                                // For zero/negative values, clear the receive amount but don't show "0"
                                setGetAmount(0);
                                setGetAmountInput("");
                                setReceiveAmountError(null);
                                setApiValidationError(null);
                                setIsCalculating(false);
                                setIsCalculatingReceive(false);
                              }
                            } else {
                              // For invalid input, clear the receive amount but don't show "0"
                              setGetAmount(0);
                              setGetAmountInput("");
                              setReceiveAmountError(null);
                              setApiValidationError(null);
                              setIsCalculating(false);
                              setIsCalculatingReceive(false);
                            }
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        // Allow all numeric input including negative signs
                      }}
                      onBlur={() => {
                        // Allow any value on blur
                      }}
                      placeholder={
                        (isCalculating || isCalculatingReceive) &&
                          !apiValidationError &&
                          !calculationError &&
                          (!receiveAmountError ||
                            receiveAmountError === "Calculating..." ||
                            receiveAmountError.includes("Rough estimate") ||
                            receiveAmountError.includes("Using estimated rate"))
                          ? "Calculating..."
                          : "Enter amount"
                      }
                      className={`w-full rounded-2xl px-4 py-2 pr-16 focus:outline-none border appearance-none bg-transparent ${
                        isCalculating || isCalculatingReceive
                          ? "border-[#1D8751]"
                          : isDark
                            ? "border-white/10"
                            : "border-gray-200"
                      } ${swapAmountValueClass(isDark)}`}
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <span className={`${isDark ? "text-white" : "text-[#1F2937]"} text-sm font-medium`}>
                        {selectedAsset
                          ? (
                            selectedAsset.ticker ||
                            selectedAsset.symbol ||
                            "USDT"
                          ).toUpperCase()
                          : "USDT"}
                      </span>
                    </div>
                    {(isCalculatingReceive || isCalculating) &&
                      !apiValidationError &&
                      !calculationError &&
                      (!receiveAmountError ||
                        receiveAmountError === "Calculating..." ||
                        receiveAmountError.includes("Rough estimate") ||
                        receiveAmountError.includes("Using estimated rate")) && (
                        <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D8751]"></div>
                        </div>
                      )}
                    {/* No input highlighting; message-only UX */}
                  </div>
                  {inlineAmountError && (
                    <p
                      className={`mt-2 text-sm font-medium ${
                        inlineAmountError.includes("Rough estimate") ||
                        inlineAmountError.includes("Using estimated rate")
                          ? "text-[#F79330]"
                          : "text-red-500 dark:text-red-400"
                      }`}
                    >
                      {inlineAmountError}
                    </p>
                  )}
                </div>

                {/* You Get Section */}
                <div className="flex-1 min-w-0">
                  <div className={`text-xs mb-1 mt-1 sm:mt-[30px] ${isDark ? "text-[#788099]" : "text-[#64748B]"
                    }`}>
                    {t("express.asset", "Asset")}
                  </div>
                  <div className="relative" ref={assetDropdownRef}>
                    <div
                      className={`w-full rounded-2xl px-4 py-2 text-lg focus:outline-none border flex items-center justify-between cursor-pointer bg-transparent ${isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200"
                        }`}
                      onClick={() => {
                        if (!isAssetDropdownOpen) {
                          updateAssetDropdownPosition();
                        }
                        setIsAssetDropdownOpen(!isAssetDropdownOpen);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {selectedAsset ? (
                          <>
                            <AssetWithNetworkIcon
                              asset={selectedAsset}
                              size={24}
                              assetIconSrc={getAssetDropdownIcon(selectedAsset)}
                              onAssetIconError={(e) => {
                                console.log(
                                  "Image failed to load for asset:",
                                  selectedAsset
                                );
                                e.currentTarget.src = ASSET_ICON_FALLBACK_URL;
                              }}
                            />
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm ${isDark ? "text-white font-normal" : "text-[#1F2937] font-extrabold"
                                  }`}>
                                  {(
                                    selectedAsset.ticker ||
                                    selectedAsset.symbol ||
                                    selectedAsset.name ||
                                    "Unknown"
                                  ).toUpperCase()}
                                </span>
                                <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-normal px-2 py-0.5 rounded-full">
                                  {getNetworkDisplayName(selectedAsset.network)}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <img
                              src={ASSET_ICON_FALLBACK_URL}
                              alt="asset icon"
                              className={`${ASSET_ICON_BASE_CLASS} w-6 h-6 rounded-full`}
                            />
                            <span className={`${isDark ? "text-[#788099]" : "text-[#64748B]"}`}>
                              {assetsDisplay.isLoading
                                ? "Loading assets..."
                                : "Select Asset"}
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

                    {renderAssetDropdown()}
                  </div>
                </div>
              </div>

              {/* Swap Circle - positioned to touch both borders equally */}
              <div className="absolute left-1/2 transform -translate-x-1/2 top-full -translate-y-8 sm:-translate-y-6 z-10">
                <button
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105"
                  onClick={() => {
                    // Switch between deposit and withdrawal modes
                    if (onModeChange) {
                      onModeChange(mode === "deposit" ? "withdrawal" : "deposit");
                    }
                  }}
                >
                  {/* Light mode image */}
                  <img
                    src="/assets/Frame_36261_1_d9cnq1.png"
                    alt="swap icon"
                    className="w-10 h-10 dark:hidden"
                  />
                  {/* Dark mode image */}
                  <img
                    src="/assets/Frame_36261_ledmyw.png"
                    alt="swap icon"
                    className="w-10 h-10 hidden dark:block"
                  />
                </button>
              </div>
            </div>

            {/* Bottom Section - You Receive and Payment Method in one card */}
            <div className="relative mb-2 mt-4">
              <div
                data-select-card="true"
                className={`relative flex flex-col sm:flex-row gap-4 rounded-2xl p-3 sm:p-4 overflow-visible ${isDark ? "bg-[#0F0F17] border border-[#2F2F3A]" : "bg-white border border-[#E2E8F0] shadow-sm"
                  }`}
              >
                {/* You Receive Section */}
                <div className="flex-1 min-w-0">
                  <label className="block text-[15px] text-[#475569] dark:text-[#9CA3AF] mb-2 font-semibold flex items-center gap-2">
                    {t("express.youReceive", "You Receive")}
                    {!isCalculatingFromPay &&
                      (isCalculating || isCalculatingReceive) && (
                        <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
                      )}
                  </label>
                  <div className={`text-xs mb-1 ${isDark ? "text-[#788099]" : "text-[#64748B]"
                    }`}>
                    {t("express.amount", "Amount")}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={getAmountInput}
                      onChange={(e) => {
                        const value = e.target.value;

                        // Don't do anything if the value hasn't actually changed
                        if (value === getAmountInput) {
                          return;
                        }

                        // Only allow numbers and decimals (including 0.006 format)
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          const normalizedValue =
                            stripLeadingZerosFromDecimalInput(value);

                          // If user cleared input, clear the other side too.
                          if (normalizedValue.trim() === "") {
                            setGetAmountInput("");
                            setGetAmount(0);
                            setPayAmountInput("");
                            setPayAmount(0);
                            setPreviousValidAmount("");
                            setReceiveAmountError(null);
                            setApiValidationError(null);
                            setCalculationError(null);
                            setIsCalculating(false);
                            setIsCalculatingReceive(false);
                            return;
                          }

                          // Check for decimal places validation
                          if (normalizedValue.includes(".")) {
                            const decimalPart = normalizedValue.split(".")[1];
                            if (decimalPart && decimalPart.length > 5) {
                              setApiValidationError("Number cannot have more than 5 decimal places.");
                              return;
                            }
                          }

                          const newAmount = capReceiveAmount(
                            parseFloat(normalizedValue) || 0
                          );

                          // Only update state and calculate if value actually changed
                          if (
                            newAmount !== getAmount ||
                            normalizedValue !== getAmountInput
                          ) {
                            setGetAmountInput(normalizedValue);
                            setGetAmount(newAmount);
                            setIsCalculatingFromPay(false);

                            // If user-entered receive amount hits the cap, show OTC modal
                            if (isOtcPopupAsset(selectedAsset) && newAmount >= MAX_RECEIVE_AMOUNT_USD) {
                              setIsInfoModalOpen(true);
                            }

                            // Clear any previous errors when user starts typing
                            setReceiveAmountError(null);
                            setApiValidationError(null);
                            setCalculationError(null);

                            // Only calculate if we have a valid amount and asset
                            if (selectedAsset && newAmount >= 0) {
                              // Check asset type first and handle accordingly
                              if (isForexAsset(selectedAsset)) {
                                const r =
                                  apiCommission != null &&
                                  !Number.isNaN(Number(apiCommission)) &&
                                  Number(apiCommission) < 100
                                    ? Number(apiCommission)
                                    : null;
                                const calculatedPayAmount =
                                  getFxpReversePayAmount(newAmount);
                                const payStr =
                                  r != null
                                    ? formatAmountForInput(calculatedPayAmount)
                                    : value;
                                setPayAmount(calculatedPayAmount);
                                setPayAmountInput(payStr);

                                setIsCalculating(false);
                                setIsCalculatingReceive(false);
                              } else if (isSimpleCalculationAsset(selectedAsset)) {
                                const calculatedPayAmount =
                                  selectedAsset &&
                                  isExchangeCommissionLookupAsset(selectedAsset) &&
                                  exchangeCommissionRule
                                    ? getExchangeLookupGrossAmount(newAmount)
                                    : (() => {
                                        const commissionRate = isCommissionApiAsset(selectedAsset)
                                          ? (apiCommission ?? 2)
                                          : (selectedAsset?.range_commissions?.[0]?.commission
                                              ? parseFloat(selectedAsset.range_commissions[0].commission)
                                              : 2);
                                        return newAmount / (1 - commissionRate / 100);
                                      })();
                                setPayAmount(calculatedPayAmount);
                                setPayAmountInput(calculatedPayAmount.toString());

                                // Simple assets don't need loading states - calculation is instant
                                setIsCalculating(false);
                                setIsCalculatingReceive(false);
                              } else if (newAmount > 0) {
                                // For non-simple assets, stop normal calculation and go directly to API

                                // Stop any ongoing normal calculations first
                                if (calculationTimeout) {
                                  clearTimeout(calculationTimeout);
                                }
                        if (estimateTimeoutRef.current) {
                          clearTimeout(estimateTimeoutRef.current);
                          estimateTimeoutRef.current = null;
                        }

                                // Clear previous calculation states
                                setEstimate(null);
                                setEstimateError(null);
                                setEstimateLoading(false);
                                setCalculationError(null);
                                setReceiveAmountError(null);
                                setApiValidationError(null);
                                setApiValidationError(null);

                                // Store current value as previous valid amount before showing loading
                                if (
                                  payAmountInput &&
                                  payAmountInput !== "0" &&
                                  !isCalculating
                                ) {
                                  setPreviousValidAmount(payAmountInput);
                                }

                                // Keep field empty during calculation - no intermediate values
                                setPayAmount(0);
                                setPayAmountInput("");
                                if (!apiValidationError) {
                                  if (!apiValidationError) {
                                    setReceiveAmountError("Calculating..."); // Show immediate feedback
                                  }
                                }

                                // Set loading state for visual feedback
                                setIsCalculating(true);
                                setIsCalculatingReceive(true);
                                setEstimateLoading(true);

                                // Go directly to API calculation - the reverse calculation useEffect will handle it
                              } else {
                                // For zero/negative values, clear the pay amount but don't show "0"
                                setPayAmount(0);
                                setPayAmountInput("");
                                setReceiveAmountError(null);
                                setApiValidationError(null);
                                setIsCalculating(false);
                                setIsCalculatingReceive(false);
                              }
                            } else {
                              // For invalid input, clear the pay amount but don't show "0"
                              setPayAmount(0);
                              setPayAmountInput("");
                              setReceiveAmountError(null);
                              setApiValidationError(null);
                              setIsCalculating(false);
                              setIsCalculatingReceive(false);
                            }
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        // Allow all numeric input including negative signs
                      }}
                      onBlur={() => {
                        // Allow any value on blur, but still validate if positive
                        const currentValue = parseFloat(getAmountInput) || 0;
                        if (currentValue > 0) {
                          const validationError = validateReceiveAmount(
                            currentValue,
                            selectedAsset
                          );
                          setReceiveAmountError(validationError);
                        }
                      }}
                      placeholder={
                        (isCalculating || isCalculatingReceive) &&
                          !apiValidationError &&
                          !calculationError &&
                          (!receiveAmountError ||
                            receiveAmountError === "Calculating..." ||
                            receiveAmountError.includes("Rough estimate") ||
                            receiveAmountError.includes("Using estimated rate"))
                          ? "Calculating..."
                          : "Enter amount"
                      }
                      className={`w-full rounded-2xl px-4 py-2 pr-16 focus:outline-none border appearance-none bg-transparent ${
                        isCalculating || isCalculatingReceive
                          ? "border-[#1D8751]"
                          : isDark
                            ? "border-white/10"
                            : "border-gray-200"
                      } ${swapAmountValueClass(isDark)}`}
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <span className={`${isDark ? "text-white" : "text-[#1F2937]"} text-sm font-medium`}>
                        USD
                      </span>
                    </div>
                    {(isCalculatingReceive || isCalculating) &&
                      !apiValidationError &&
                      !calculationError &&
                      (!receiveAmountError ||
                        receiveAmountError === "Calculating..." ||
                        receiveAmountError.includes("Rough estimate") ||
                        receiveAmountError.includes("Using estimated rate")) && (
                        <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D8751]"></div>
                        </div>
                      )}
                    {/* No input highlight; message-only UX */}
                    {/* No input highlight; message-only UX */}
                  </div>
                </div>

                {/* Payment Method Section */}
                <div className="flex-1 min-w-0 relative z-0">
                  <div className={`text-xs mb-1 mt-1 sm:mt-[30px] ${isDark ? "text-[#788099]" : "text-[#64748B]"
                    }`}>
                    {t("express.paymentMethod", "Payment Method")}
                  </div>
                  <div className="relative z-0">
                    {(() => {
                      // Use public payment methods if available (they have logos)
                      let paymentMethodOptions: Array<{ value: string; label: string; logo?: string }> = [];
                      const activePublicPaymentMethods = directPublicPaymentMethods || publicPaymentMethods;
                      const activePublicProviders = Array.isArray(activePublicPaymentMethods?.data?.providers)
                        ? activePublicPaymentMethods.data.providers
                        : Array.isArray(activePublicPaymentMethods?.data)
                          ? activePublicPaymentMethods.data
                          : Array.isArray(activePublicPaymentMethods)
                            ? activePublicPaymentMethods
                            : [];

                      if (activePublicProviders.length > 0) {
                        // Use public payment methods with logos (available to guests too on home page).
                        paymentMethodOptions = activePublicProviders.map((provider: any) => {
                          const providerName = provider.provider_name || provider.payment_provider_name || "Unknown";
                          const methodName =
                            provider.method_display ||
                            provider.method ||
                            provider.method?.method_name ||
                            provider.method?.method_display ||
                            provider.method_name ||
                            null;
                          const subtitle = methodName ? `${providerName} - ${methodName}` : null;

                          return {
                            value: providerName,
                            label: providerName,
                            subtitle: subtitle || undefined,
                            logo: getHighResPaymentLogo(
                              provider.logo || provider.provider_logo || undefined,
                              undefined,
                              PAYMENT_LOGO_SIZE
                            ),
                          };
                        }).filter((opt: any) => opt.value && opt.value.trim());
                      }

                      const isLoading = publicMethodsLoading && paymentMethodOptions.length === 0;

                      return (
                        <CustomSelect
                          options={paymentMethodOptions}
                          logoSize={PAYMENT_LOGO_SIZE}
                          logoClassName={`${PAYMENT_LOGO_BASE_CLASS} rounded-full`}
                          sizeMode="card"
                          dropdownMatchTriggerWidth={true}
                          dropdownMinWidth={460}
                          dropdownMaxWidth={460}
                          className="w-full"
                          triggerClassName={`px-4 py-2 text-sm font-medium border rounded-2xl bg-transparent ${isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200"
                            }`}
                          placeholderClassName="text-white dark:text-white"
                          onChange={(value) => {
                            const selectedProvider = activePublicProviders.find(
                              (provider: any) =>
                                (provider.provider_name || provider.payment_provider_name) === value
                            );

                            // Keep the full value for dropdown matching, but store provider data for filtering
                            setPayBank(value); // Keep full value for dropdown to work
                            setSelectedProviderData(selectedProvider); // Store full provider data for comparison
                            setSelectedPaymentDetail(selectedProvider || null);

                            setSelectedPaymentDetails([]);
                            setPaymentMethodError(null);
                          }}
                          placeholder={
                            isLoading
                              ? "Loading payment methods..."
                              : "Payment Method"
                          }
                          value={payBank}
                          disabled={isLoading}
                          loading={isLoading}
                          loadingText="Loading payment methods..."
                          emptyText={
                            "No payment methods available"
                          }
                          searchable={true}
                          dropdownTitle="Select a payment methods"
                          dropdownOffsetY={-68}
                          dropdownOffsetX={0}
                          largeDropdownItems={true}
                        />
                      );
                    })()}
                  </div>
                  {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                  {paymentMethodError && <p className="text-red-500 text-sm mt-1">{paymentMethodError}</p>}

                  {/* Registered Account Section */}
                  {payBank && (
                    <div className="mt-3 w-full relative z-10">
                      <label className="block text-[17px] text-[#475569] dark:text-[#9CA3AF] mb-2 font-semibold">
                        Registered Account
                      </label>
                      {!isAuthenticated ? (
                        <p className="text-[#F79330] text-sm">
                          Login to view your registered accounts.{" "}
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                setAuthRedirectPath("/?mode=withdrawal");
                              } catch {}
                              router.push("/auth/login");
                            }}
                            className="hover:underline cursor-pointer font-medium"
                          >
                            Login
                          </button>
                        </p>
                      ) : (
                        <>
                          {(() => {
                            const allUserAccounts = resolveAllUserPaymentAccounts(
                              userPaymentMethodsDisplay.displayData,
                              effectiveUserPaymentMethods
                            );
                            const hasAnyAccounts = allUserAccounts.length > 0;
                            const hasFilteredAccounts =
                              enhancedFilteredUserPaymentDetails.length > 0;
                            const dropdownAccounts = getRegisteredAccountDropdownList(
                              allUserAccounts,
                              enhancedFilteredUserPaymentDetails
                            );

                            if (!hasAnyAccounts) {
                              return (
                                <p className="text-[#F79330] text-sm">
                                  <button
                                    type="button"
                                    onClick={() => setIsPaymentModalOpen(true)}
                                    className="hover:underline cursor-pointer"
                                  >
                                    Don't have an account? Register Now
                                  </button>
                                </p>
                              );
                            }

                            return (
                              <div className="relative w-full z-10">
                                {!hasFilteredAccounts && (
                                  <p className="text-[#F79330] text-sm mb-2">
                                    No account found for this payment method.{" "}
                                    <button
                                      type="button"
                                      onClick={() => setIsPaymentModalOpen(true)}
                                      className="hover:underline cursor-pointer font-medium"
                                    >
                                      Add Account
                                    </button>
                                  </p>
                                )}
                                {hasFilteredAccounts && (
                                  <>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {enhancedFilteredUserPaymentDetails.length} account(s) found
                                    </span>
                                    <button
                                      type="button"
                                      disabled={isRefreshingAccounts}
                                      onClick={async () => {
                                        try {
                                          setIsRefreshingAccounts(true);
                                          await dispatch(fetchUserPaymentDetails(true)).unwrap();
                                          showToast.success("Accounts refreshed");
                                        } catch (error) {
                                          showToast.error("Failed to refresh payment details");
                                        } finally {
                                          setIsRefreshingAccounts(false);
                                        }
                                      }}
                                      className="text-xs text-[#1D8751] hover:text-[#166b3e] underline disabled:opacity-50"
                                    >
                                      {isRefreshingAccounts ? "Refreshing..." : "Refresh"}
                                    </button>
                                  </div>
                                <div className="w-full min-w-0 relative z-[100] isolate">
                                <CustomSelect
                                  options={(dropdownAccounts || []).map(
                                    (detail) => {
                                      // Try to get provider info from public payment methods first
                                      let providerName = detail.payment_provider_name || detail.provider_name || "Unknown Provider";
                                      let providerLogo = detail.provider_logo;

                                      if (Array.isArray(publicPaymentMethods?.data?.providers)) {
                                        const publicProvider = publicPaymentMethods.data.providers.find(
                                          (provider: any) =>
                                            (provider.provider_name || provider.payment_provider_name) === detail.payment_provider_name ||
                                            (provider.provider_name || provider.payment_provider_name) === detail.provider_name
                                        );
                                        if (publicProvider) {
                                          providerName = publicProvider.provider_name || publicProvider.payment_provider_name || providerName;
                                          providerLogo = publicProvider.logo || publicProvider.provider_logo || providerLogo;
                                        }
                                      }

                                      // Fallback to admin detail if not found in public methods
                                      if (!providerLogo) {
                                        const adminDetail = adminWalletListDisplay.displayData?.find(
                                          (wallet: any) => wallet.admin_payment_detail?.provider_name === detail.payment_provider_name
                                        )?.admin_payment_detail;
                                        if (adminDetail) {
                                          providerName = adminDetail.provider_name || providerName;
                                          providerLogo = adminDetail.provider_logo || providerLogo;
                                        }
                                      }

                                      // Display account name and account number
                                      const accountName = detail.account_name || 'No Name';
                                      const accountNumber = detail.account_number || detail.wallet_address || 'No Account';
                                      const displayLabel = `${accountNumber} - ${accountName}`;
                                      // Create a full tooltip with all information (using separators since HTML title doesn't support newlines)
                                      const fullInfo = `Account Number: ${accountNumber} | Account Name: ${accountName}${providerName ? ` | Provider: ${providerName}` : ''}`;
                                      const isPending = !!(
                                        detail.status &&
                                        !isApprovedPaymentStatus(detail.status)
                                      );
                                      const isFrozen = isFrozenPaymentStatus(detail.status);

                                      return {
                                        value: detail.id.toString(),
                                        label: isPending
                                          ? `${displayLabel} (${isFrozen ? "Frozen" : "Pending"})`
                                          : displayLabel,
                                        logo: getHighResPaymentLogo(
                                          providerLogo || undefined,
                                          undefined,
                                          PAYMENT_LOGO_SIZE
                                        ),
                                        // Add full information for tooltip on hover
                                        title: fullInfo,
                                        disabled: isPending,
                                        subtitle: isPending
                                          ? isFrozen
                                            ? "Frozen"
                                            : "Pending"
                                          : undefined,
                                      };
                                    }
                                  )}
                                  value={
                                    selectedPaymentDetails.length > 0
                                      ? selectedPaymentDetails[0].id.toString()
                                      : ""
                                  }
                                  onChange={(value) => {
                                    const selectedId = Number(value);
                                    const selectedDetail = enhancedFilteredUserPaymentDetails.find(
                                      (detail) => detail.id === selectedId
                                    );
                                    if (selectedDetail) {
                                      setSelectedPaymentDetails([selectedDetail]);
                                      setPaymentMethodError(null);
                                    }
                                  }}
                                  placeholder={
                                    userPaymentMethodsDisplay.isLoading
                                      ? "Loading accounts..."
                                      : "Select Registered Account"
                                  }
                                  disabled={userPaymentMethodsDisplay.isLoading}
                                  loading={userPaymentMethodsDisplay.isLoading}
                                  loadingText="Loading accounts..."
                                  emptyText="No registered accounts available"
                                  searchable={true}
                                  dropdownTitle="Select a registered account from"
                                  className="w-full min-w-0"
                                  logoSize={PAYMENT_LOGO_SIZE}
                                  logoClassName={`${PAYMENT_LOGO_BASE_CLASS} rounded-full`}
                                  triggerClassName={`px-4 py-2 text-sm font-medium border rounded-2xl w-full min-w-0 bg-transparent ${isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200"
                                    }`}
                                  largeDropdownItems={true}
                                  dropdownMatchTriggerWidth={true}
                                  dropdownMinWidth={460}
                                  dropdownMaxWidth={460}
                                />
                                {(() => {
                                  if (!payBank) return null;

                                  const pendingAccount =
                                    isSelectedPaymentPending &&
                                    selectedPaymentDetails[0]
                                      ? selectedPaymentDetails[0]
                                      : enhancedFilteredUserPaymentDetails.find(
                                          (detail) =>
                                            detail.status &&
                                            !isApprovedPaymentStatus(detail.status)
                                        );

                                  if (!pendingAccount) return null;

                                  const accountFrozen = isFrozenPaymentStatus(
                                    pendingAccount.status
                                  );

                                  return (
                                    <div className="mt-2 flex items-start gap-3 rounded-2xl border border-[#F79330]/40 bg-[#F79330]/10 p-3">
                                      <svg
                                        className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#F79330]"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                        />
                                      </svg>
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-[#F79330]">
                                          {accountFrozen
                                            ? "Account Frozen"
                                            : "Account Pending Approval"}
                                        </p>
                                        <p className="mt-1 text-xs text-[#F79330]/80">
                                          Your account
                                          {pendingAccount.account_name
                                            ? ` "${pendingAccount.account_name}"`
                                            : ""}
                                          {pendingAccount.account_number ||
                                          pendingAccount.wallet_address
                                            ? ` (${pendingAccount.account_number || pendingAccount.wallet_address})`
                                            : ""}{" "}
                                          {accountFrozen
                                            ? "is frozen. Please "
                                            : "is pending approval. Please "}
                                          <a
                                            href="/contactUs"
                                            className="font-semibold text-[#1D8751] underline transition-colors hover:text-[#17693f]"
                                          >
                                            contact support
                                          </a>{" "}
                                          {accountFrozen
                                            ? "for assistance."
                                            : "to get your account approved."}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                              </>
                                )}
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fee & Rate - Dynamic based on selected asset */}
            {/* <div className="flex items-center rounded-2xl border border-[#39394a] bg-[#23232b] px-2 py-2 mb-3">
            <div className="flex flex-col gap-2 flex-1">
              <span className="flex items-center bg-[#F79330] text-white rounded-full px-5 py-1 text-sm font-medium w-fit">
                <span className="w-2 h-2 bg-white rounded-full mr-2 inline-block"></span>
                Network fee: $0
              </span>

              <span className="flex items-center bg-[#1D8751] text-white rounded-full px-5 py-1 text-sm font-medium w-fit">
                <span className="w-2 h-2 bg-white rounded-full mr-2 inline-block"></span>
                Commission: {selectedAsset && isSimpleCalculationAsset(selectedAsset) ? `${isCommissionApiAsset(selectedAsset) ? (apiCommission ?? 0) : (selectedAsset?.range_commissions?.[0]?.commission || 2)}% of $${payAmount}` : `${selectedAsset?.range_commissions?.[0]?.commission || 2}% of $${payAmount}`} = $
                {commissionAmount}
              </span>
            </div>
            <img
              src="https://res.cloudinary.com/pitz/image/upload/v1753424863/Screenshot_2025-07-25_092724_rjinec.png"
              alt=""
              style={{ cursor: "pointer" }}
              onClick={() =>
                onModeChange &&
                onModeChange(mode === "deposit" ? "withdrawal" : "deposit")
              }
            />
          </div>  */}



            {/* Warning Message */}
            {!isTransactionSubmitted && !showForexWithdrawalForm && (
              <div className="mt-4 mb-3 flex items-center gap-3 p-3 rounded-2xl bg-transparent">
                <img
                  src="/assets/alert-circle_1_ujybne.png"
                  alt="Warning"
                  className="w-5 h-5 flex-shrink-0 mt-1"
                />
                <p className={`text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                  This is only an estimated price based on current market rates. The final price will be confirmed when we receive the funds.
                </p>
              </div>
            )}

            {/* Submit Button for First Card */}
            {!isTransactionSubmitted && !showForexWithdrawalForm && (
              <div className="relative">
                <button
                  type="button"
                  className={`w-full text-base font-medium py-1.5 rounded-full flex items-center justify-center gap-2 transition-colors ${isFirstCardSubmitDisabled
                    ? "bg-gray-500 cursor-not-allowed text-white opacity-70"
                    : "bg-[#1D8751] hover:bg-[#1D8751]/80 text-white cursor-pointer"
                    }`}
                  onClick={() => {
                    if (requiresLoginRedirect) {
                      const state = {
                        mode,
                        // Send amounts (You Send)
                        amountInput: payAmountInput,
                        amountValue: payAmount,
                        // Receive amounts (You Receive)
                        receiveAmountInput: getAmountInput,
                        receiveAmountValue: getAmount,
                        // Asset - save FULL object
                        asset: selectedAsset ? { ...selectedAsset } : null,
                        // Payment details - save FULL objects
                        paymentDetails: selectedPaymentDetails.map((detail: UserPaymentDetail) => ({ ...detail })),
                        // Keep currently selected provider/bank (even if user hasn't selected an account yet)
                        payBank,
                      };
                      setAuthRedirectPath(
                        buildExpressRedirectPath(mode, state)
                      );
                      router.push("/auth/login");
                      return;
                    }

                    if (selectedAsset && isForexAsset(selectedAsset)) {
                      if (!payAmount || payAmount <= 0) {
                        showToast.error("Please enter a valid amount");
                        return;
                      }
                      if (effectiveSelectedPaymentDetails.length === 0) {
                        showToast.error("Please select a payment method");
                        return;
                      }
                      if (selectedPaymentDetails.length === 0) {
                        setSelectedPaymentDetails(effectiveSelectedPaymentDetails);
                      }
                      setShowForexWithdrawalForm(true);
                    } else {
                      handleFirstCardSubmit();
                    }
                  }}
                  disabled={isFirstCardSubmitDisabled}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#A2A4A9FF] dark:border-[#35353E]"></div>
                      <span>Submitting...</span>
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
                        />
                      </svg>
                      <span>Withdraw addresses generated</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center text-muted">
                      E
                      <img
                        className="mt-2"
                        src="/assets/Group_5_gkxzdz.png"
                        alt=""
                      />
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Forex Withdrawal Form - Shows when FXP is selected */}
            {showForexWithdrawalForm && selectedAsset && isForexAsset(selectedAsset) && (
              <ForexWithdrawal
                payAmount={payAmount}
                getAmount={getAmount}
                selectedPaymentDetails={effectiveSelectedPaymentDetails}
              />
            )}
          </div>

          {/* Wallet Address Section - shown after transaction submission */}
          {isTransactionSubmitted && (
            <div
              key={`wallet-section-${forceUpdate}`}
              className="mb-6 flex flex-col gap-3 w-full px-0 sm:px-2"
            >
              <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
                Wallet Address
              </h2>
              <div className="dark:bg-[#0F0F17] border-1 border-[#35353e] rounded-2xl p-3 sm:p-5 shadow-lg w-full text-[#35353e] dark:text-[#788099]">
                {selectedAsset && (
                  <CryptoSendOnlyWarningBanner
                    asset={selectedAsset}
                    network={selectedAsset?.network}
                    className="mb-4"
                    showTemporaryAddressNotice={
                      shouldShowTemporaryWalletAddressNotice
                    }
                  />
                )}
                <div className="mb-4">
                  <h3 className="text-sm sm:text-base text-[#35353e] dark:text-[#788099] font-semibold mb-2">
                    {getCryptoDepositAddressHeading(selectedAsset)}
                  </h3>
                  {withdrawalAddress ? (
                    <div className=" dark:bg-[#1D1D23]  border border-[#1D8751] rounded-xl p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                        <span className="text-[#35353e] dark:text-[#788099] text-xs sm:text-sm font-mono break-all flex-1">
                          {withdrawalAddress}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(withdrawalAddress);
                              setIsWalletAddressCopied(true);
                              // Reset the copied state after 2 seconds
                              setTimeout(() => {
                                setIsWalletAddressCopied(false);
                              }, 2000);
                            }}
                            className="flex items-center gap-1 bg-[#23232b] dark:bg-[#35353E] border border-[#1D8751] text-[#1D8751] rounded-full px-2 sm:px-4 py-1 font-semibold text-xs sm:text-base hover:bg-[#1D8751] hover:text-[#35353e] transition-colors"
                          >
                            {isWalletAddressCopied ? (
                              <>
                                <svg
                                  width="16"
                                  height="16"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    d="M9 12l2 2 4-4"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                Copied
                              </>
                            ) : (
                              <>
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
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className=" dark:bg-[#1D1D23] border border-[#1D8751] rounded-xl p-4">
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
                  <div className=" dark:bg-[#1D1D23] border border-[#A2A4A9FF] dark:border-[#35353E] rounded-xl p-4 flex justify-center">
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

                {/* Terms & Conditions — bank withdrawal */}
                <ExpressBankWithdrawalTermsPanel
                  expandedTerms={expandedTerms}
                  setExpandedTerms={setExpandedTerms}
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
                      checked={isTermsAccepted}
                      onChange={(e) => setIsTermsAccepted(e.target.checked)}
                    />
                    <ExpressLegalTermsLinks onBeforeNavigate={handleBeforeLegalNavigate} />
                  </label>
                </div>
              </div>
              {/* Disclaimer and Button outside the card */}
              <div className="flex flex-col gap-3 w-full px-2">
                <div className="mt-4 mb-3 flex items-center gap-3 p-3 rounded-2xl bg-transparent">
                  <img
                    src="/assets/alert-circle_1_ujybne.png"
                    alt="Warning"
                    className="w-5 h-5 flex-shrink-0 mt-1"
                  />
                  <p className={`text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                    This is only an estimated price based on current market rates. The final price will be confirmed when we receive the funds.
                  </p>
                </div>

                {/* Warning message for amounts over $15,000 */}
                {isOtcPopupAsset(selectedAsset) && getAmount > 15000 && (
                  <div className="flex items-start sm:items-center gap-2 text-[#1D8751] text-xs sm:text-sm font-medium bg-[#EFFAF3] dark:bg-[#35353E] border border-[#1D8751] rounded-xl p-2.5 sm:p-3">
                    <FaExclamationCircle className="mt-0.5 sm:mt-0 text-[#1D8751] flex-shrink-0" />
                    <span className="leading-relaxed break-words">
                    </span>
                  </div>
                )}
                <button
                  className={`w-full text-[#35353e] dark:text-[#788099] text-base font-medium py-2 rounded-2xl flex items-center justify-center gap-2 transition-colors ${isSecondCardSubmitDisabled
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-[#1D8751] hover:bg-[#166b3e]"
                    }`}
                  onClick={() => {
                    // Navigate to exchanging page with websocket URL
                    if (onExchange) {
                      const transactionData = {
                        type: "withdrawal" as const,
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
                        paymentDetail: selectedPaymentDetail,
                        walletAddress: withdrawalAddress,
                        network: selectedNetwork,
                        transactionId: transactionId,
                        withdrawalAddress: withdrawalAddress,
                        message: responseMessage,
                        toCurrency: "USD",
                        websocketUrl: websocketUrl,
                        paymentDetails: selectedPaymentDetails,
                      };
                      onExchange(transactionData);
                    }
                  }}
                  disabled={isSecondCardSubmitDisabled}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#A2A4A9FF] dark:border-[#35353E]"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center text-muted">
                      E
                      <img
                        className="mt-2"
                        src="/assets/Group_5_gkxzdz.png"
                        alt=""
                      />
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Validation Errors Display */}
          {nonInlineValidationErrors.length > 0 && (
            <div className="w-full mt-4 px-2 mb-4">
              <div className="bg-[#23232b] dark:bg-[#35353E] border border-[#1D8751] rounded-2xl p-4">

                <ul className="list-disc list-inside text-[#1D8751] space-y-1">
                  {nonInlineValidationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* PaymentMethodsModal */}
          <PaymentMethodsModal
            open={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            filterByProviderName={payBank?.trim() || undefined}
            onAddSuccess={handlePaymentMethodAddSuccess}
          />
        </>
      )}

      {/* InfoModal - outside ternary so it's always mounted and visible in both crypto and forex */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => {
          setIsInfoModalOpen(false);
        }}
        onContactUs={() => {
          setIsInfoModalOpen(false);
          router.push("/contactUs");
        }}
      />
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Exchange Rate Unavailable
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              We could not get the required exchange rate for this transaction.
              Please contact support and our team will help you.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => {
                  setIsSupportModalOpen(false);
                  router.push("/contactUs");
                }}
                className="w-full rounded-lg bg-[#1d8751] px-4 py-3 font-medium text-white transition-colors hover:bg-[#166b3e]"
              >
                Contact Support
              </button>
              <button
                onClick={() => setIsSupportModalOpen(false)}
                className="w-full rounded-lg border border-border px-4 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
