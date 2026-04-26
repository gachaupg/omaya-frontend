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
import { useDispatch, useSelector, useStore } from "react-redux";
import { AppDispatch, type RootState } from "@/store";
import {
  fetchUserPaymentDetails,
  fetchAdminWalletList,
} from "../../../exchange/slices/paymentSlice";
import {
  fetchPublicPaymentMethods,
} from "../../../p2p/slices/paymentMethodsSlice";
import { fetchAssets, createDeposit } from "../../../exchange/slices/exchangeSlice";
import {
  fetchSupportedAssets,
  fetchSwapEstimate,
} from "../../../swap/slices/swapSlice";
import { validateWalletAddress } from "@/lib/addressValidaion";
import { showToast } from "@/lib/utils/toast";
import { DepositResponse } from "../../../exchange/types";
import { SupportedAsset } from "../../../swap/types";
import { FaSearch } from "react-icons/fa";
import {
  createExpressWithdrawal,
  fetchCommissionDetails,
  getCommissionApiAsset,
  fetchExchangeCommissionLookup,
  getExchangeLookupParams,
  isExchangeCommissionLookupAsset,
  isForexPrimusAsset,
  type CommissionLookupResponse,
  type ExchangeCommissionLookupResponse,
} from "@/features/express/api";
import {
  ExpressWithdrawalPayload,
  ExpressWithdrawalResponse,
} from "@/features/express/types";
import PaymentMethodsModal from "../../../p2p/components/ui/p2pdashboard/sections/PaymentMethodsModal";
import InfoModal from "./info";
import { debugAssetFetching } from "@/lib/utils/debugAssets";
import {
  useAssetsDisplay,
  usePaymentMethodsDisplay,
} from "@/features/express/hooks/useDataDisplay";
import { useChangeNowAssets } from "@/features/express/home/hooks/useChangeNowAssets";
import CustomSelect from "@/components/ui/CustomSelect";
import {
  PAYMENT_LOGO_BASE_CLASS,
  PAYMENT_LOGO_SIZE,
  getHighResAssetIcon,
} from "../../utils/imageHelpers";
import ForexWithdrawal from "./ForexWithdrawal";
import { useTheme } from "@/context/theme";
import {
  buildExpressRedirectPath,
  setAuthRedirectPath,
} from "@/lib/utils/authRedirect";
import {
  clearExpressCancelled,
  isExpressCancelled,
} from "@/features/express/utils/cancelExpressWork";
import { openKYCModal, checkKYCStatus } from "@/features/auth/slices/authSlice";
import { bookmarkedAddressesApi } from "@/features/express/services/bookmarkedAddressesApi";
import { withTimeout } from "@/features/express/utils/fetchWithTimeout";
import {
  AssetDropdownVirtualized,
  buildAssetDropdownRows,
} from "./AssetDropdownVirtualized";

// Add UserPaymentDetail interface
interface UserPaymentDetail {
  id: number;
  user_payment_detail_id: string;
  payment_provider_name: string;
  payment_method_name: string;
  account_name: string;
  account_number: string;
  wallet_address?: string;
  provider_logo?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
  // Add fallback properties for compatibility
  provider_name?: string;
  payment_provider?: string;
}

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
    return toFrozenMessageIfNeeded(responseData);
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
    return toFrozenMessageIfNeeded(cleanedDirect);
  }

  if (typeof error === "string") {
    const cleanedStringError = cleanMessage(error);
    if (cleanedStringError) {
      return toFrozenMessageIfNeeded(cleanedStringError);
    }
  }

  if (error?.message) {
    const cleanedMessage = cleanMessage(String(error.message));
    if (cleanedMessage) {
      return toFrozenMessageIfNeeded(cleanedMessage);
    }
  }

  if (typeof direct === "string" && direct.trim()) {
    return toFrozenMessageIfNeeded(direct);
  }

  const fieldErrors = responseData?.errors || responseData?.error;
  if (fieldErrors && typeof fieldErrors === "object" && !Array.isArray(fieldErrors)) {
    const firstKey = Object.keys(fieldErrors)[0];
    if (firstKey) {
      const value = fieldErrors[firstKey];
      if (Array.isArray(value) && value.length > 0) {
        return toFrozenMessageIfNeeded(`${firstKey}: ${String(value[0])}`);
      }
      if (typeof value === "string" && value.trim()) {
        return toFrozenMessageIfNeeded(`${firstKey}: ${value}`);
      }
    }
  }

  return fallback;
};

const isThunkConditionSkipError = (error: unknown): boolean => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return (
    message.includes("Aborted due to condition callback returning false") ||
    message.includes("ConditionError")
  );
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
    receiveAmount?: number; // "You Receive" from form – shown as net amount on exchanging page
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
    amountValue?: number;
    amountInput?: string;
    receiveAmountValue?: number;
    receiveAmountInput?: string;
    asset?: any;
    paymentDetails?: UserPaymentDetail[];
    walletAddress?: string;
    termsAccepted?: boolean;
  };
}

// Network aliases for whitelist matching
const NETWORK_ALIASES: Record<string, string[]> = {
  trc20: ["trx", "trc20"],
  trx: ["trx", "trc20"],
  erc20: ["eth", "erc20"],
  eth: ["eth", "erc20"],
  bep20: ["bsc", "bep20"],
  bep2: ["bsc", "bep2"],
  bsc: ["bsc", "bep20", "bep2"],
  matic: ["matic", "polygon"],
  polygon: ["matic", "polygon"],
};

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
const getNetworkMatchKeys = (network: string): string[] => {
  const n = (network || "").toLowerCase();
  return NETWORK_ALIASES[n] ? [...NETWORK_ALIASES[n], n] : [n];
};

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

/** Parse amount allowing comma as decimal separator (e.g. "0,1" → 0.1) */
const parseLocalizedAmountString = (raw: string): number => {
  if (raw === "" || raw === "-") return 0;
  const normalized = String(raw).trim().replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
};

/** Display number in amount fields without float noise (trims trailing zeros, max 8 dp) */
const formatAmountForInput = (n: number): string => {
  if (!Number.isFinite(n)) return "";
  if (n === 0) return "0";
  const s = n.toFixed(8).replace(/\.?0+$/, "");
  return s || "0";
};

export default function WithdrawalForm({
  onExchange,
  mode,
  onModeChange,
  isHomePage = false,
  initialState,
}: DepositFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore<RootState>();
  const router = useRouter();
  const [transactionMode, setTransactionMode] = useState<"crypto" | "forex">("crypto");

  // Declare all refs early to avoid initialization errors
  const paymentDetailsRef = useRef<HTMLDivElement>(null);
  const assetDropdownRef = useRef<HTMLDivElement>(null);
  const assetDropdownContentRef = useRef<HTMLDivElement | null>(null);

  const isForexAsset = (asset: any) => isForexPrimusAsset(asset);

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
    if (!activePublicPaymentMethods) return [];
    // Shape A: { data: { providers: [...] } }
    if (Array.isArray(activePublicPaymentMethods?.data?.providers)) {
      return activePublicPaymentMethods.data.providers;
    }
    // Shape B: { data: [...] }
    if (Array.isArray(activePublicPaymentMethods?.data)) {
      return activePublicPaymentMethods.data;
    }
    // Shape C: [...]
    if (Array.isArray(activePublicPaymentMethods)) {
      return activePublicPaymentMethods;
    }
    return [];
  }, [activePublicPaymentMethods]);

  const { assets, loading: assetsLoading } = useSelector(
    (state: any) => state.exchange
  );

  // Add swap assets state
  const {
    supportedAssets: swapAssets,
    loading: swapAssetsLoading,
    error: swapAssetsError,
  } = useSelector((state: any) => state.swap);
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const { isDark } = useTheme();

  const {
    assets: homeAssets,
    loading: homeAssetsLoading,
    error: homeAssetsError,
  } = useChangeNowAssets(isHomePage);

  const exchangeAssetsSource = isHomePage ? homeAssets : assets?.assets;
  const swapAssetsSource = isHomePage ? [] : swapAssets;
  const exchangeAssetsLoadingState = isHomePage
    ? homeAssetsLoading
    : assetsLoading;
  const swapAssetsLoadingState = isHomePage ? false : swapAssetsLoading;
  const exchangeAssetsErrorState = isHomePage ? homeAssetsError : null;
  const swapAssetsErrorState = isHomePage ? null : swapAssetsError;
  const requiresLoginRedirect = isHomePage && !isAuthenticated;

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
    const publicSource = activePublicPaymentMethods;

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
  }, [activePublicPaymentMethods, adminMethods, adminPaymentDetails]);

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
    if (activePublicProviders.length > 0) {
      activePublicProviders.forEach((provider: any) => {
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
  }, [activePublicProviders, uniquePaymentMethods, userPaymentDetails]);

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

  // Fetch public payment methods for withdrawal (same as home: direct public API)
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

  const [payAmount, setPayAmount] = useState(initialState?.amountValue ?? 100);
  const [payBank, setPayBank] = useState(
    initialState?.paymentDetails?.[0]?.payment_provider_name || ""
  );
  const [selectedProviderData, setSelectedProviderData] =
    useState<any>(initialState?.paymentDetails?.[0] || null);
  const [getAmount, setGetAmount] = useState(initialState?.amountValue ?? 0);
  const [payAmountInput, setPayAmountInput] = useState(
    initialState?.amountInput ?? "100"
  );
  const [getAmountInput, setGetAmountInput] = useState(
    initialState?.amountInput ?? ""
  );
  const hasAppliedPrefillRef = useRef(false);

  // Restore amounts when initialState arrives async (e.g. prefill parsed after first render from login redirect)
  useEffect(() => {
    if (
      !hasAppliedPrefillRef.current &&
      initialState?.amountValue !== undefined &&
      initialState?.amountValue !== null
    ) {
      hasAppliedPrefillRef.current = true;
      setPayAmount(initialState.amountValue);
      setPayAmountInput(
        initialState.amountInput || String(initialState.amountValue)
      );
      if (initialState.receiveAmountValue !== undefined) {
        setGetAmount(initialState.receiveAmountValue);
        setGetAmountInput(
          initialState.receiveAmountInput ||
            String(initialState.receiveAmountValue)
        );
      } else {
        setGetAmount(initialState.amountValue);
        setGetAmountInput(
          initialState.amountInput || String(initialState.amountValue)
        );
      }
    }
  }, [initialState?.amountValue, initialState?.amountInput, initialState?.receiveAmountValue, initialState?.receiveAmountInput]);

  const [selectedAsset, setSelectedAsset] = useState<any>(
    initialState?.asset || null
  );
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const [isCalculatingFromPay, setIsCalculatingFromPay] = useState(true);
  const [walletAddress, setWalletAddress] = useState(initialState?.walletAddress ?? "");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  // Add state for payment method validation error
  const [paymentMethodError, setPaymentMethodError] = useState<string | null>(null);
  // Add state for wallet address copy feedback
  const [isWalletAddressCopied, setIsWalletAddressCopied] = useState(false);
  // Add state for API response data
  const [withdrawalAddress, setWithdrawalAddress] = useState<string>("");
  const [payoutAddress, setPayoutAddress] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isTransactionSubmitted, setIsTransactionSubmitted] = useState(false);
  const [responseMessage, setResponseMessage] = useState<string>("");
  const [websocketUrl, setWebsocketUrl] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [isTermsAccepted, setIsTermsAccepted] = useState(!!initialState?.termsAccepted);
  const [expandedTerms, setExpandedTerms] = useState(false);

  // Forex-specific state for withdrawal
  const [userNotesForex, setUserNotesForex] = useState<string>("");
  const [showForexWithdrawalForm, setShowForexWithdrawalForm] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedAsset || !isForexAsset(selectedAsset)) {
      setShowForexWithdrawalForm(false);
      setUserNotesForex("");
    }
  }, [selectedAsset]);

  // Asset selection state for search functionality
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [assetSearchTerm, setAssetSearchTerm] = useState("");
  const [whitelistBookmarks, setWhitelistBookmarks] = useState<Array<{ asset: string; network: string }>>([]);
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
    // Reset the navigation-cancel flag whenever this form mounts.
    clearExpressCancelled();
  }, []);

  // Commission from API for USDT, USDC, FX Primus (null = not yet fetched, 0 = API returned 0)
  const [apiCommission, setApiCommission] = useState<number | null>(null);
  const [apiCommissionDetails, setApiCommissionDetails] =
    useState<CommissionLookupResponse | null>(null);
  const [exchangeLookupResponse, setExchangeLookupResponse] = useState<ExchangeCommissionLookupResponse | null>(null);
  const commissionFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

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

  useEffect(() => {
    if (!isAssetDropdownOpen) return;
    bookmarkedAddressesApi
      .list()
      .then((list) => {
        const pairs = Array.from(
          new Map(list.map((b) => [`${b.asset.toLowerCase()}|${b.network.toLowerCase()}`, { asset: b.asset, network: b.network }])).values()
        );
        setWhitelistBookmarks(pairs);
      })
      .catch(() => setWhitelistBookmarks([]));
  }, [isAssetDropdownOpen]);

  // Estimate calculation state
  const [estimate, setEstimate] = useState<any>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<{
    title: string;
    content: string[];
  } | null>(null);

  // First card submission state
  const [isFirstCardSubmitted, setIsFirstCardSubmitted] = useState(false);

  // Add loading state for "You Receive" calculation
  const [isCalculatingReceive, setIsCalculatingReceive] = useState(false);

  // Add payment selection state
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<
    UserPaymentDetail[]
  >(initialState?.paymentDetails ?? []);

  const openLegalModal = useCallback((title: string, content: string[]) => {
    setLegalModal({ title, content });
  }, []);

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
  const estimateRequestSeqRef = useRef(0);

  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Add PaymentMethodsModal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Add InfoModal state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Add validation state for minimum receive amount
  const [receiveAmountError, setReceiveAmountError] = useState<string | null>(
    null
  );

  // Add state for API validation errors
  const [apiValidationError, setApiValidationError] = useState<string | null>(null);

  // Add calculation error state for display below "You Send" input
  const [calculationError, setCalculationError] = useState<string | null>(null);


  // Add retry counters for remaining fetches (admin wallet, assets, swap assets)
  const [adminWalletRetryCount, setAdminWalletRetryCount] = useState(0);
  const [assetsRetryCount, setAssetsRetryCount] = useState(0);
  const [swapAssetsRetryCount, setSwapAssetsRetryCount] = useState(0);
  const [hasFetchedAdminWallet, setHasFetchedAdminWallet] = useState(false);
  const [hasFetchedAssets, setHasFetchedAssets] = useState(false);
  const [hasFetchedSwapAssets, setHasFetchedSwapAssets] = useState(false);
  const MAX_RETRIES = 2;
  const assetsFetchInFlightRef = useRef(false);

  // Filter user payment details based on selected provider
  // Match payment_provider_name from user payment details with provider_name from admin
  const filteredUserPaymentDetails = payBank
    ? (userPaymentMethodsDisplay.displayData || effectiveUserPaymentMethods || []).filter(
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

    const sourceData = userPaymentMethodsDisplay.displayData ||
      effectiveUserPaymentMethods ||
      (Array.isArray(rawUserDetails) ? rawUserDetails : []) ||
      [];

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

      // If FXP is selected, only show approved payment methods
      if (selectedAsset && isForexAsset(selectedAsset)) {
        const isApproved = detail.status?.toLowerCase() === 'approved';
        return matchesProvider && isApproved;
      }

      // Return payment details that match selected provider.
      return matchesProvider;
    });

    return filtered;
  }, [payBank, userPaymentMethodsDisplay.displayData, effectiveUserPaymentMethods, selectedAsset, userPaymentDetails, selectedProviderData]);

  // Auto-select first payment method when payment methods are available
  useEffect(() => {
    // Only auto-select if no payment method is currently selected
    if (payBank) {
      return;
    }

    // Check if payment methods are available from public payment methods
    if (activePublicProviders.length > 0) {
      const firstProvider = activePublicProviders[0];
      const firstProviderName = firstProvider.provider_name || firstProvider.payment_provider_name;

      if (firstProviderName) {
        setPayBank(firstProviderName);
        setSelectedProviderData(firstProvider);
        setSelectedPaymentDetail(firstProvider);
        return;
      }
    }

  }, [payBank, activePublicProviders]);

  // Auto-select account when accounts are available for selected payment type.
  // Also recover from stale selections that no longer exist in the filtered list.
  useEffect(() => {
    if (!payBank || enhancedFilteredUserPaymentDetails.length === 0) return;

    const selectedId = selectedPaymentDetails[0]?.id;
    const selectedStillValid =
      selectedId != null &&
      enhancedFilteredUserPaymentDetails.some(
        (detail: UserPaymentDetail) => detail.id === selectedId
      );

    if (!selectedStillValid) {
      setSelectedPaymentDetails([enhancedFilteredUserPaymentDetails[0]]);
    }
  }, [payBank, enhancedFilteredUserPaymentDetails, selectedPaymentDetails]);

  // Reset form if user changes asset or payment method after submission
  useEffect(() => {
    // Only reset if the transaction was already submitted
    if (isTransactionSubmitted) {
      // Clear the submission state and API response
      setIsTransactionSubmitted(false);
      setWithdrawalAddress("");
      setPayoutAddress("");
      setQrCodeUrl("");
      setResponseMessage("");
      setWebsocketUrl("");
      setTransactionId("");
      setWalletAddress("");
      setWalletError(null);
    }
  }, [selectedAsset, payBank]);

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
  const hasDecimalPlacesError =
    /decimal places/i.test(String(apiValidationError || "")) ||
    /decimal places/i.test(String(receiveAmountError || "")) ||
    /decimal places/i.test(String(calculationError || ""));

  // Sync selectedPaymentDetails when WebSocket refetches and status changes (e.g. Pending → APPROVED)
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

  // Fetch admin wallet list with caching (1 hour TTL)
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

    const fetchWithCache = async () => {
      try {
        const { sliceCache } = await import("@/lib/utils/sliceCache");

        // Try to get from cache first
        const cachedData = await sliceCache.get<any>('payment', 'fetchAdminWalletList');

        if (cachedData && cachedData.results && cachedData.results.length > 0) {
          setHasFetchedAdminWallet(true);
          setAdminWalletRetryCount(0);
          dispatch({
            type: 'payment/fetchAdminWalletList/fulfilled',
            payload: cachedData,
          });
        } else {
          const data = await withTimeout(dispatch(fetchAdminWalletList(true)).unwrap(), 15_000);
          if (data && data.results && data.results.length > 0) {
            setHasFetchedAdminWallet(true);
            setAdminWalletRetryCount(0);
            await sliceCache.set('payment', 'fetchAdminWalletList', data, undefined, 60 * 60 * 1000); // 1 hour TTL
          }
        }
      } catch (error: unknown) {
        console.error(`❌ Failed to fetch admin wallet list (attempt ${adminWalletRetryCount + 1}/${MAX_RETRIES}):`, error);
        setAdminWalletRetryCount(prev => prev + 1);

        // Only show toast on final retry
        if (adminWalletRetryCount + 1 >= MAX_RETRIES) {
          if (!isHomePage) {
            showToast.error(`Failed to fetch admin wallet list after ${MAX_RETRIES} attempts`);
          }
          setHasFetchedAdminWallet(true);
        }
      }
    };

    fetchWithCache();
  }, [dispatch, isHomePage, hasFetchedAdminWallet, adminWalletRetryCount]);

  useEffect(() => {
    // Skip API calls on home page
    if (isHomePage || hasFetchedAssets) {
      return;
    }

    // Prevent parallel asset fetch storms (StrictMode / rerenders / retries).
    if (assetsFetchInFlightRef.current) {
      return;
    }

    // Prevent infinite retries - max 3 attempts
    if (assetsRetryCount >= MAX_RETRIES) {
      console.warn('⚠️ Max retries reached for assets');
      setHasFetchedAssets(true);
      return;
    }

    const run = async () => {
      assetsFetchInFlightRef.current = true;
      try {
        // First try cache, then force refresh; timeout so slow API doesn't freeze the form
        const data = await withTimeout(dispatch(fetchAssets(false)).unwrap(), 15_000);
        console.log("✅ Assets fetched successfully");
        setHasFetchedAssets(true);
        setAssetsRetryCount(0);

        if ((!data?.assets || data.assets.length === 0) && assetsRetryCount === 0) {
          // Force refresh once when initial payload is empty.
          await withTimeout(dispatch(fetchAssets(true)).unwrap(), 15_000);
          setHasFetchedAssets(true);
        }
      } catch (error: unknown) {
        if (isThunkConditionSkipError(error)) {
          // Redux thunk condition skip means we already have fresh cached assets.
          setHasFetchedAssets(true);
          return;
        }
        console.error(`❌ Failed to fetch assets (attempt ${assetsRetryCount + 1}/${MAX_RETRIES}):`, error);
        setAssetsRetryCount((prev) => prev + 1);
        if (assetsRetryCount + 1 >= MAX_RETRIES) {
          // Only toast if we truly have no assets in state.
          if (!isHomePage && (!assets || assets.length === 0)) {
            showToast.error(`Failed to fetch assets after ${MAX_RETRIES} attempts`);
          }
          setHasFetchedAssets(true);
        }
      } finally {
        assetsFetchInFlightRef.current = false;
      }
    };

    run();
  }, [dispatch, isHomePage, hasFetchedAssets, assetsRetryCount]);

  // Track previous authentication state to detect login
  const prevIsAuthenticatedRef = useRef(isAuthenticated);

  // Fetch user payment details with caching (1 hour TTL) and refetch on login
  useEffect(() => {
    // Only fetch if user is authenticated (needed for both home page and regular page)
    if (!isAuthenticated) {
      prevIsAuthenticatedRef.current = isAuthenticated;
      return;
    }

    // Detect login: if user just logged in (wasn't authenticated before, now is)
    const justLoggedIn = !prevIsAuthenticatedRef.current && isAuthenticated;
    prevIsAuthenticatedRef.current = isAuthenticated;

    const fetchWithCache = async () => {
      try {
        const { sliceCache } = await import("@/lib/utils/sliceCache");

        // If user just logged in, clear cache and force refresh
        if (justLoggedIn) {
          await sliceCache.delete('payment', 'fetchUserPaymentDetails');
          await sliceCache.delete('paymentMethods', 'fetchPublicPaymentMethods');
          await sliceCache.delete('payment', 'fetchAdminPaymentDetails');
          await sliceCache.delete('payment', 'fetchAdminWalletList');
        }

        // Try to get from cache first (unless just logged in)
        if (!justLoggedIn) {
          const cachedData = await sliceCache.get<any[]>('payment', 'fetchUserPaymentDetails');
          if (cachedData && cachedData.length > 0) {
            userPaymentMethodsRef.current = cachedData;
            dispatch({
              type: 'payment/fetchUserPaymentDetails/fulfilled',
              payload: cachedData,
            });
            return;
          }
        }

        // Fetch fresh data and cache it; timeout so slow API doesn't freeze
        const data = await withTimeout(dispatch(fetchUserPaymentDetails(true)).unwrap(), 15_000);
        if (data && data.length > 0) {
          userPaymentMethodsRef.current = data;
          await sliceCache.set('payment', 'fetchUserPaymentDetails', data, undefined, 60 * 60 * 1000);
        }
      } catch (error) {
        console.error("❌ Failed to fetch user payment details:", error);
      }
    };

    fetchWithCache();
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

      const existingSwap = store.getState().swap.supportedAssets;
      if (Array.isArray(existingSwap) && existingSwap.length > 0) {
        return;
      }

      // Set fallback assets after max retries (only if Redux has no list)
      const fallbackAssets = [
        {
          ticker: "USDT",
          symbol: "USDT",
          name: "Tether USD",
          network: "BSC",
          range_commissions: [{ commission: "2" }],
          commission: "2",
          fee_rate: "2"
        },
        {
          ticker: "USDT",
          symbol: "USDT",
          name: "USD Coin",
          network: "BSC",
          range_commissions: [{ commission: "2" }],
          commission: "2",
          fee_rate: "2"
        }
      ];

      dispatch({
        type: "swap/fetchSupportedAssets/fulfilled",
        payload: fallbackAssets
      });
      return;
    }

    const resolveSwapPayload = (force: boolean): Promise<SupportedAsset[]> => {
      return dispatch(
        fetchSupportedAssets({ forceRefresh: force, feature: "exchange" })
      ).then(
        (action): SupportedAsset[] | Promise<SupportedAsset[]> => {
          if (fetchSupportedAssets.fulfilled.match(action)) {
            return action.payload;
          }
          if (
            fetchSupportedAssets.rejected.match(action) &&
            (action as { meta?: { condition?: boolean } }).meta?.condition
          ) {
            const existing = store.getState().swap.supportedAssets;
            if (Array.isArray(existing) && existing.length > 0) {
              return existing;
            }
            if (!force) {
              return resolveSwapPayload(true);
            }
          }
          if (fetchSupportedAssets.rejected.match(action)) {
            throw new Error(
              action.error?.message || "Failed to fetch swap assets"
            );
          }
          throw new Error("Unexpected swap assets fetch result");
        }
      );
    };

    // Must exceed getSupportedAssets axios timeout (30s) or UI shows "Request timeout" first
    withTimeout(resolveSwapPayload(false), 35_000)
      .then((data) => {
        console.log("✅ Swap assets fetched successfully");
        setHasFetchedSwapAssets(true);
        setSwapAssetsRetryCount(0);

        if ((!data || data.length === 0) && swapAssetsRetryCount === 0) {
          setSwapAssetsRetryCount(1);
          withTimeout(resolveSwapPayload(true), 35_000)
            .then(() => setHasFetchedSwapAssets(true))
            .catch(() => setHasFetchedSwapAssets(true));
        }
      })
      .catch((error: unknown) => {
        console.error(`❌ Failed to fetch swap assets (attempt ${swapAssetsRetryCount + 1}/${MAX_RETRIES}):`, error);
        setSwapAssetsRetryCount((prev) => {
          const nextRetry = prev + 1;
          if (nextRetry >= MAX_RETRIES) {
            const existingSwap = store.getState().swap.supportedAssets;
            if (!(Array.isArray(existingSwap) && existingSwap.length > 0)) {
              if (!isHomePage) {
                showToast.warning("Unable to fetch swap assets. Using fallback data.");
              }
              const fallbackAssets = [
                {
                  ticker: "USDT",
                  symbol: "USDT",
                  name: "Tether USD",
                  network: "BSC",
                  range_commissions: [{ commission: "2" }],
                  commission: "2",
                  fee_rate: "2",
                },
                {
                  ticker: "USDC",
                  symbol: "USDC",
                  name: "USD Coin",
                  network: "BSC",
                  range_commissions: [{ commission: "2" }],
                  commission: "2",
                  fee_rate: "2",
                },
              ];

              dispatch({
                type: "swap/fetchSupportedAssets/fulfilled",
                payload: fallbackAssets,
              });
            }
            setHasFetchedSwapAssets(true);
          }
          return nextRetry;
        });
      });
  }, [dispatch, isHomePage, hasFetchedSwapAssets, swapAssetsRetryCount, store]);

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

        // Priority 3: FX Primus (API may use fxp or fxprimus)
        const isFxpA = tickerA === "fxp" || tickerA === "fxprimus";
        const isFxpB = tickerB === "fxp" || tickerB === "fxprimus";
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

  // First two: USDT/USDC on BSC; first three (exchange lookup): USDT BEP20, BNB BSC, USDT ERC20
  const isSimpleCalculationAsset = (asset: any) => {
    if (!asset) return false;
    const ticker = (asset?.ticker || asset?.symbol || "").toLowerCase();
    const network = (asset?.network || "").toLowerCase();
    return (ticker === "usdt" && network === "bsc") ||
      (ticker === "usdc" && network === "bsc") ||
      isExchangeCommissionLookupAsset(asset);
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

  // Check if asset uses commission API (USDT, USDC, FX Primus)
  const isCommissionApiAsset = (asset: any) => !!getCommissionApiAsset(asset?.ticker || asset?.symbol || "");

  // Fetch commission: first 3 assets use exchange commission-lookup; else USDT/USDC/FXP use legacy % API
  useEffect(() => {
    if (isExpressCancelled()) return;
    if (!selectedAsset) {
      setApiCommission(null);
      setApiCommissionDetails(null);
      setExchangeLookupResponse(null);
      return;
    }
    const amount = isCalculatingFromPay
      ? (parseLocalizedAmountString(payAmountInput) || payAmount)
      : (parseLocalizedAmountString(getAmountInput) || getAmount);
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
        setApiCommissionDetails(null);
        return;
      }
      if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
      commissionFetchTimeoutRef.current = setTimeout(() => {
        if (isExpressCancelled()) return;
        fetchExchangeCommissionLookup(amount, "withdrawal", params.from_currency, "USD", params.from_network, params.from_asset_id)
          .then((res) => {
            if (isExpressCancelled()) return;
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
                  setApiValidationError(null);
                  setGetAmount(toAmount);
                  setGetAmountInput(res.to_amount);
                  setPreviousValidAmount(res.to_amount);
                }
              }
            }
          })
          .catch((error: any) => {
            if (isExpressCancelled()) return;
            setExchangeLookupResponse(null);
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
            setApiValidationError(
              normalizedMessage
            );
          });
      }, 300);
      return () => {
        if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
      };
    }
    const apiAsset = getCommissionApiAsset(selectedAsset.ticker || selectedAsset.symbol || "");
    if (!apiAsset) {
      setApiCommission(null);
      setApiCommissionDetails(null);
      return;
    }
    const fxpSendAmount = isCalculatingFromPay
      ? (parseLocalizedAmountString(payAmountInput) || payAmount)
      : getFxpReversePayAmount((parseLocalizedAmountString(getAmountInput) || getAmount));
    const commissionLookupAmount = isForexAsset(selectedAsset)
      ? fxpSendAmount
      : amount;
    if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
    commissionFetchTimeoutRef.current = setTimeout(() => {
      if (isExpressCancelled()) return;
      fetchCommissionDetails(
        apiAsset,
        commissionLookupAmount,
        "withdrawal",
        isForexAsset(selectedAsset) ? selectedAsset?.asset_id : undefined
      )
        .then((details) => {
          if (isExpressCancelled()) return;
          setApiCommission(Number(details?.commission_rate ?? 0));
          setApiCommissionDetails(details);
          setExchangeLookupResponse(null);
          setIsCalculating(false);
          setIsCalculatingReceive(false);
          if (isForexAsset(selectedAsset)) {
            const backendToAmount = Number(details?.to_amount);
            const backendFromAmount = Number(details?.from_amount);
            if (isCalculatingFromPay && Number.isFinite(backendToAmount)) {
              const safeToAmount = Math.max(0, backendToAmount);
              setGetAmount(safeToAmount);
              setGetAmountInput(String(safeToAmount));
              setPreviousValidAmount(String(safeToAmount));
            } else if (!isCalculatingFromPay && Number.isFinite(backendFromAmount)) {
              setPayAmount(Math.max(0, backendFromAmount));
              setPayAmountInput(String(Math.max(0, backendFromAmount)));
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
  }, [selectedAsset, payAmountInput, getAmountInput, payAmount, getAmount, isCalculatingFromPay]);

  // Recalculate when apiCommission arrives (legacy; not for crypto exchange-lookup assets — FX Primus uses this path)
  useEffect(() => {
    if (
      !selectedAsset ||
      (isExchangeCommissionLookupAsset(selectedAsset) && !isForexAsset(selectedAsset))
    )
      return;
    if (isCommissionApiAsset(selectedAsset) && apiCommission !== null) {
      if (isCalculatingFromPay && payAmount > 0) {
        if (isForexAsset(selectedAsset)) {
          const backendToAmount = Number(apiCommissionDetails?.to_amount);
          if (Number.isFinite(backendToAmount)) {
            const safeAmount = Math.max(0, backendToAmount);
            setGetAmount(safeAmount);
            setGetAmountInput(String(safeAmount));
            setPreviousValidAmount(String(safeAmount));
            return;
          }
        }
        const commissionAmount = (payAmount * apiCommission) / 100;
        const calculatedGetAmount = Math.max(0, payAmount - commissionAmount);
        setGetAmount(calculatedGetAmount);
        setGetAmountInput(calculatedGetAmount.toString());
        setPreviousValidAmount(calculatedGetAmount.toString());
      } else if (!isCalculatingFromPay && getAmount > 0) {
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

  // Reverse (You Receive -> You Send) for first 3 assets using exchange lookup local_commission
  useEffect(() => {
    if (!selectedAsset || !isExchangeCommissionLookupAsset(selectedAsset) || !exchangeLookupResponse?.local_commission || isCalculatingFromPay || getAmount <= 0) return;
    const lc = exchangeLookupResponse.local_commission;
    const fee = lc.fee != null ? parseFloat(lc.fee) : NaN;
    if (!Number.isNaN(fee)) {
      const calculatedPay = getAmount + fee;
      setPayAmount(calculatedPay);
      setPayAmountInput(calculatedPay.toString());
    } else if (lc.commission_mode === "percentage" && lc.rate != null) {
      const rate = parseFloat(lc.rate);
      if (!Number.isNaN(rate) && rate < 100) {
        const calculatedPay = getAmount / (1 - rate / 100);
        setPayAmount(calculatedPay);
        setPayAmountInput(calculatedPay.toString());
      }
    }
  }, [selectedAsset, exchangeLookupResponse, isCalculatingFromPay, getAmount]);

  // Helper function to check if cache entry is still valid
  const isCacheValid = (timestamp: number) => {
    return Date.now() - timestamp < CACHE_DURATION;
  };

  // Helper function to extract error message from API response
  const extractErrorMessage = (error: any): string => {
    if (error.response?.data) {
      const responseData = error.response.data;
      if (responseData.error === "deposit_too_small") {
        return "Amount is too small. Please enter a larger amount to proceed.";
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

  // Validate receive amount
  const validateReceiveAmount = (amount: number, asset: any) => {
    const minAmount = getMinimumAmount(asset);
    if (minAmount > 0 && amount > 0 && amount < minAmount) {
      return `Minimum amount for this asset is ${minAmount}.`;
    }
    return null;
  };

  // Manual estimate trigger for non-direct assets (avoids blocking navigation on every keystroke)
  useEffect(() => {
    if (isExpressCancelled()) return;
    // Clear any existing estimate timeout
    if (estimateTimeout) {
      clearTimeout(estimateTimeout);
    }

    if (
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset) &&
      !isForexAsset(selectedAsset) && // Skip FXP - uses manual calculation
      payAmount &&
      payAmount > 0 &&
      isCalculatingFromPay // forward flow: "You Send" → estimate receive
    ) {
      const requestSeq = ++estimateRequestSeqRef.current;

      // Check cache first - if found and valid, use immediately without any loading states
      const cacheKey = `${selectedAsset.ticker?.toUpperCase()}_${selectedAsset.network}_${payAmount}`;
      const cachedEntry = estimateCache.get(cacheKey);

      if (cachedEntry && isCacheValid(cachedEntry.timestamp)) {
        if (!isMountedRef.current || requestSeq !== estimateRequestSeqRef.current) return;
        setEstimate(cachedEntry.data);
        setCalculationError(null); // Clear any previous errors
        setApiValidationError(null);
        // Don't set any loading states for cached results
        return;
      }

      // Keep loading indicators minimal to avoid heavy re-renders while navigating
      if (!apiValidationError) {
        setEstimateLoading(true);
        setEstimateError(null);
      }

      // Minimal debounce to prevent rapid duplicate requests but keep UI responsive
      const debounceTimeout = setTimeout(() => {
        if (isExpressCancelled()) return;
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
          .then((result) => {
            if (isExpressCancelled()) return;
            if (!isMountedRef.current || requestSeq !== estimateRequestSeqRef.current) return;
            if (result.payload) {
              setEstimate(result.payload);
              setCalculationError(null); // Clear any previous errors
              setApiValidationError(null);

              // Update UI immediately instead of waiting for another useEffect
              const estimatedAmount = (result.payload as any)?.toAmount || (result.payload as any)?.estimated_amount;
              if (estimatedAmount !== undefined && estimatedAmount !== null && !isNaN(estimatedAmount)) {
                const finalAmount = Math.max(0, estimatedAmount);
                setGetAmount(finalAmount);
                setGetAmountInput(finalAmount.toString());
                setReceiveAmountError(null);

                // Clear loading states immediately
                setIsCalculating(false);
                setIsCalculatingReceive(false);
              }

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
            if (isExpressCancelled()) return;
            if (!isMountedRef.current || requestSeq !== estimateRequestSeqRef.current) return;
            // Handle API validation errors for receive amount
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
                    "Ensure that there are no more than 8 decimal places."
                  );
                  setReceiveAmountError(
                    "Ensure that there are no more than 8 decimal places."
                  );
                  // Don't clear the input - let user see their value and fix it
                  return;
                }
                if (
                  amountErrors.some((err: string) =>
                    err.includes("12 digits before the decimal point")
                  )
                ) {
                  setApiValidationError(
                    "Ensure that there are no more than 12 digits before the decimal point."
                  );
                  setReceiveAmountError(
                    "Ensure that there are no more than 12 digits before the decimal point."
                  );
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
                const errorMessage =
                  responseData?.message ||
                  "Amount is too small. Please enter a larger amount to proceed.";
                setApiValidationError(errorMessage);
                setReceiveAmountError(errorMessage);
                setCalculationError(errorMessage); // Show error below "You Send" input
                // Stop loading states and show error
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

                setApiValidationError(errorMessage);
                setReceiveAmountError(errorMessage);
                // Stop loading states and show error
                setEstimateLoading(false);
                setIsCalculating(false);
                setIsCalculatingReceive(false);
                return;
              }
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

            // Handle other error types
            const errorMessage = extractErrorMessage(error);
            setEstimateError(errorMessage);
            setCalculationError(errorMessage); // Show error below "You Send" input

            // Keep loading state instead of showing fallback (don't clear inputs)
            if (!apiValidationError) {
              if (!apiValidationError) {
                setReceiveAmountError("Calculating..."); // Show immediate feedback
              }
            }
            // Keep loading states active
          })
          .finally(() => {
            if (isExpressCancelled()) return;
            if (!isMountedRef.current || requestSeq !== estimateRequestSeqRef.current) return;
            setEstimateLoading(false);
          });
      }, 250); // reduce UI churn while typing

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
    if (isExpressCancelled()) return;


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
          if (isExpressCancelled()) return;
          if (result?.meta?.requestStatus === "fulfilled" && result.payload) {
            const payload = result.payload as any;
            const requiredUsdtAmountRaw =
              payload?.estimated_amount ?? payload?.toAmount ?? payload?.user_amount;
            const requiredUsdtAmount = Number(requiredUsdtAmountRaw);

            if (Number.isFinite(requiredUsdtAmount) && requiredUsdtAmount >= 0) {
              // Set the pay amount to the required USDT amount
              setPayAmount(requiredUsdtAmount);
              setPayAmountInput(requiredUsdtAmount.toString());
              setEstimate(payload);
              setApiValidationError(null);
            }
          }
          // Always clear loading states after this response branch.
          setIsCalculating(false);
          setIsCalculatingReceive(false);
          setEstimateLoading(false);
        })
        .catch((error) => {
          if (isExpressCancelled()) return;
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

            // Handle deposit_too_small error
            if (
              errorData === "deposit_too_small" ||
              errorData === "Exchange service error: deposit_too_small" ||
              errorData?.error === "deposit_too_small" ||
              responseData?.error === "deposit_too_small"
            ) {
              const errorMessage =
                responseData?.message ||
                "Amount is too small. Please enter a larger amount to proceed.";
              setApiValidationError(errorMessage);
              setReceiveAmountError(errorMessage);
              setCalculationError(errorMessage); // Show error below "You Send" input
              // Stop loading states and show error
              setEstimateLoading(false);
              setIsCalculating(false);
              setIsCalculatingReceive(false);

              setApiValidationError(errorMessage);
              setReceiveAmountError(errorMessage);
              // Stop loading states and show error
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

          // Suppress all errors on home page (silently)
          if (isHomePage) {
            setEstimateError(null);
            setIsCalculating(false);
            setIsCalculatingReceive(false);
            return;
          }

          // Check for specific API validation errors - handle different error structures
          let errorMessage = "";
          let errorDetails = "";

          // Handle the exact structure you provided
          if (error?.response_data?.error) {
            errorMessage = error.response_data.error;
            errorDetails = error.response_data.message || "";
          } else if (error?.error) {
            errorMessage = error.error;
            errorDetails = error.message || "";
          } else if (error?.message) {
            errorMessage = error.message;
          }

          // Also check for the specific "Exchange service error" format
          if (errorMessage.includes("Exchange service error:")) {
            const serviceError = errorMessage.replace("Exchange service error: ", "");
            errorMessage = serviceError;
          }

          console.log("Error parsing (withdrawal):", { errorMessage, errorDetails, hasResponseData: !!error?.response_data });

          // Handle deposit_too_small error
          if (errorMessage.includes("deposit_too_small") || errorDetails.includes("Out of min amount")) {
            // Try to get minimum amount from error payload
            const minAmount = error?.response_data?.payload?.range?.minAmount;
            const errorText = minAmount
              ? `Amount entered is too small. Minimum amount is ${minAmount.toFixed(8)}.`
              : "Amount entered is too small. Please enter a larger amount.";

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
            // Try to get maximum amount from error payload
            const maxAmount = error?.response_data?.payload?.range?.maxAmount;
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

          // Handle timeout - just clear error and allow retry
          if (error.message?.includes("Request timeout")) {
            setEstimateError(null);
          } else if (
            error.message?.includes("Network Error") ||
            error.code === "ECONNREFUSED" ||
            error.code === "ENOTFOUND"
          ) {
            setEstimateError(null);
          } else if (error.message?.includes("Server Error")) {
            setEstimateError(null);
          } else {
            setEstimateError(null);
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

          const fallbackPayAmount = getAmount / (1 - (selectedAsset && isCommissionApiAsset(selectedAsset) ? (apiCommission ?? 2) : commissionRate) / 100);
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
  }, [selectedAsset, getAmount, isCalculatingFromPay, apiValidationError]);

  // Filter + sort only when data or search changes (not on every keystroke elsewhere)
  const filteredSwapAssets = useMemo(() => {
    const data = [...(assetsDisplay.displayData || [])] as SupportedAsset[];
    if (!data?.length) return [] as SupportedAsset[];
    const term = assetSearchTerm.toUpperCase();
    if (!term) return data as SupportedAsset[];
    return (data as SupportedAsset[]).filter((asset: SupportedAsset) => {
      const ticker = asset?.ticker?.toUpperCase() || "";
      const name = asset?.name?.toUpperCase() || "";
      const symbol = asset?.symbol?.toUpperCase() || "";
      return (
        ticker.includes(term) || name.includes(term) || symbol.includes(term)
      );
    });
  }, [assetsDisplay.displayData, assetSearchTerm]);

  const sortedSwapAssets = useMemo(() => [...filteredSwapAssets].sort((a, b) => {
    // Ensure tickers exist and are strings (using ticker as primary, fallback to symbol/name)
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

    // Default: preserve original order (no change)
    return 0;
  }), [filteredSwapAssets]);

  const whitelistKeys = useMemo(() => {
    const keys = new Set<string>();
    whitelistBookmarks.forEach((b) => {
      const assetKey = b.asset.toLowerCase();
      getNetworkMatchKeys(b.network).forEach((net) => keys.add(`${assetKey}|${net}`));
    });
    return keys;
  }, [whitelistBookmarks]);

  const popularAssets = useMemo(() => {
    const normalize = (asset: any) =>
      (asset?.ticker || asset?.symbol || asset?.name || "")
        .toString()
        .toLowerCase();
    const network = (asset: any) => (asset?.network || "").toString().toLowerCase();
    const usdtBsc = sortedSwapAssets.find(
      (a) => normalize(a) === "usdt" && network(a) === "bsc"
    );
    const usdcBsc = sortedSwapAssets.find(
      (a) => normalize(a) === "usdc" && network(a) === "bsc"
    );
    const fxp = sortedSwapAssets.find((a) => isForexPrimusAsset(a));
    return [usdtBsc, usdcBsc, fxp].filter(Boolean) as SupportedAsset[];
  }, [sortedSwapAssets]);

  const popularSet = useMemo(
    () =>
      new Set(
        popularAssets.map(
          (a) =>
            `${(a?.ticker || a?.symbol || a?.name || "")
              .toString()
              .toLowerCase()}|${(a?.network || "").toString().toLowerCase()}`
        )
      ),
    [popularAssets]
  );

  const whitelistAssets = useMemo(() => {
    if (whitelistKeys.size === 0) return [];
    return sortedSwapAssets.filter((a) => {
      const key = `${(a?.ticker || a?.symbol || a?.name || "").toString().toLowerCase()}|${(a?.network || "").toString().toLowerCase()}`;
      return whitelistKeys.has(key) && !popularSet.has(key);
    });
  }, [sortedSwapAssets, whitelistKeys, popularSet]);

  const whitelistKeySet = useMemo(
    () => new Set(whitelistAssets.map((a) => `${(a?.ticker || a?.symbol || a?.name || "").toString().toLowerCase()}|${(a?.network || "").toString().toLowerCase()}`)),
    [whitelistAssets]
  );

  const allAssetsList = useMemo(() => {
    if (assetSearchTerm) return sortedSwapAssets;
    return sortedSwapAssets.filter((a) => {
      const key = `${(a?.ticker || a?.symbol || a?.name || "").toString().toLowerCase()}|${(a?.network || "").toString().toLowerCase()}`;
      return !popularSet.has(key) && !whitelistKeySet.has(key);
    });
  }, [assetSearchTerm, sortedSwapAssets, whitelistKeySet, popularSet]);

  const assetDropdownRows = useMemo(
    () =>
      buildAssetDropdownRows(
        sortedSwapAssets,
        assetSearchTerm,
        whitelistAssets,
        allAssetsList,
        popularAssets
      ),
    [
      sortedSwapAssets,
      assetSearchTerm,
      whitelistAssets,
      allAssetsList,
      popularAssets,
    ]
  );

  // Calculate fees and amounts - Network fee is always 0 for BEP20
  const networkFee = 0;

  // First 3 assets: exchange lookup local_commission; else USDT/USDC/FXP API %; else range_commissions
  let commissionAmount = 0;
  if (selectedAsset && isExchangeCommissionLookupAsset(selectedAsset) && exchangeLookupResponse?.local_commission) {
    const lc = exchangeLookupResponse.local_commission;
    if (lc.commission_mode === "flat_fee" && lc.fee != null) {
      commissionAmount = parseFloat(lc.fee) || 0;
    } else if (lc.commission_mode === "percentage" && lc.rate != null) {
      commissionAmount = (payAmount * parseFloat(lc.rate)) / 100;
    }
  } else if (selectedAsset && isCommissionApiAsset(selectedAsset)) {
    if (isForexAsset(selectedAsset) && apiCommission == null) {
      commissionAmount = 0;
    } else {
      const rate = apiCommission ?? 2;
      commissionAmount = (payAmount * rate) / 100;
    }
  } else if (selectedAsset && isSimpleCalculationAsset(selectedAsset)) {
    const commissionRate = selectedAsset?.range_commissions?.[0]?.commission
      ? parseFloat(selectedAsset.range_commissions[0].commission)
      : 2;
    commissionAmount = (payAmount * commissionRate) / 100;
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

    // For simple assets; crypto exchange-lookup amounts set by useEffect — FX Primus uses commission % or 1:1 pass-through
    if (fromPay && selectedAsset && isSimpleCalculationAsset(selectedAsset)) {
      if (isExchangeCommissionLookupAsset(selectedAsset) && !isForexAsset(selectedAsset)) {
        setReceiveAmountError(null);
        setIsCalculating(false);
        setIsCalculatingReceive(false);
        return;
      }
      if (isForexAsset(selectedAsset)) {
        const hasPct =
          apiCommission != null && !Number.isNaN(Number(apiCommission));
        const calculatedGetAmount = hasPct
          ? Math.max(0, fromAmount - (fromAmount * Number(apiCommission)) / 100)
          : fromAmount;
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
        setReceiveAmountError(
          validateReceiveAmount(calculatedGetAmount, selectedAsset)
        );
        if (isOtcPopupAsset(selectedAsset) && calculatedGetAmount > 15000) setIsInfoModalOpen(true);
        setIsCalculating(false);
        setIsCalculatingReceive(false);
        return;
      }
      const commissionAmount = isCommissionApiAsset(selectedAsset)
        ? (fromAmount * (apiCommission ?? 2)) / 100
        : (fromAmount * (selectedAsset?.range_commissions?.[0]?.commission ? parseFloat(selectedAsset.range_commissions[0].commission) : 2)) / 100;
      const calculatedGetAmount = Math.max(0, fromAmount - commissionAmount);

      setGetAmount(calculatedGetAmount);
      setGetAmountInput(calculatedGetAmount.toString());
      setPreviousValidAmount(calculatedGetAmount.toString());
      const validationError = validateReceiveAmount(calculatedGetAmount, selectedAsset);
      setReceiveAmountError(validationError);
      if (isOtcPopupAsset(selectedAsset) && calculatedGetAmount > 15000) setIsInfoModalOpen(true);
      setIsCalculating(false);
      setIsCalculatingReceive(false);
      return;
    }

    // Set calculating state immediately for complex calculations (only if no API validation errors)
    if (!apiValidationError) {
      setIsCalculating(true);
      setIsCalculatingReceive(true);
    }

    // Debounce calculation to prevent rapid updates (avoid 1ms queues that can delay clicks/navigation)
    const timeout = setTimeout(() => {
      if (!isMountedRef.current) return;
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
          if (isSimpleCalculationAsset(selectedAsset)) {
            if (isExchangeCommissionLookupAsset(selectedAsset) && !isForexAsset(selectedAsset)) {
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              return;
            }
            if (isForexAsset(selectedAsset)) {
              const hasPct =
                apiCommission != null && !Number.isNaN(Number(apiCommission));
              const calculatedGetAmount = hasPct
                ? Math.max(0, fromAmount - (fromAmount * Number(apiCommission)) / 100)
                : fromAmount;
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
              setReceiveAmountError(
                validateReceiveAmount(calculatedGetAmount, selectedAsset)
              );
              if (isOtcPopupAsset(selectedAsset) && calculatedGetAmount > 15000) setIsInfoModalOpen(true);
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              return;
            }
            const commissionAmount = isCommissionApiAsset(selectedAsset)
              ? (fromAmount * (apiCommission ?? 2)) / 100
              : (fromAmount * (selectedAsset?.range_commissions?.[0]?.commission ? parseFloat(selectedAsset.range_commissions[0].commission) : 2)) / 100;
            const calculatedGetAmount = Math.max(0, fromAmount - commissionAmount);

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
            if (isOtcPopupAsset(selectedAsset) && calculatedGetAmount > 15000) {
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

              if (isOtcPopupAsset(selectedAsset) && finalAmount > 15000) {
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
          if (isSimpleCalculationAsset(selectedAsset)) {
            if (isExchangeCommissionLookupAsset(selectedAsset) && !isForexAsset(selectedAsset)) {
              setIsCalculating(false);
              setIsCalculatingReceive(false);
            } else if (isForexAsset(selectedAsset)) {
              const newPayAmount = getFxpReversePayAmount(fromAmount);
              const payStr = formatAmountForInput(newPayAmount);
              setPayAmount(newPayAmount);
              setPayAmountInput(payStr);
              setIsCalculating(false);
              setIsCalculatingReceive(false);
            } else {
              const commissionRate = isCommissionApiAsset(selectedAsset) ? (apiCommission ?? 2) : (selectedAsset?.range_commissions?.[0]?.commission ? parseFloat(selectedAsset.range_commissions[0].commission) : 2);
              const newPayAmount = fromAmount / (1 - commissionRate / 100);
              setPayAmount(newPayAmount);
              setPayAmountInput(newPayAmount.toString());
            }
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
          if (isMountedRef.current) setCalculationComplete(false);
        }, 2000);
      }
    }, 200); // 200ms debounce keeps UI responsive

    setCalculationTimeout(timeout);
  };

  const renderAssetDropdown = () => {
    if (!isComponentMounted || !isAssetDropdownOpen) {
      return null;
    }

    const assetDropdownElement = assetDropdownRef.current;
    let dropdownStyle: React.CSSProperties;

    if (!isHomePage && assetDropdownElement) {
      dropdownStyle = {
        position: "absolute",
        top: assetDropdownPosition.top,
        left: assetDropdownPosition.left,
        width:
          assetDropdownPosition.width ||
          assetDropdownElement.offsetWidth ||
          undefined,
      };
    } else {
      const viewportWidth =
        typeof window !== "undefined" ? window.innerWidth : 0;
      const minMargin = 16;
      const minWidth = 280;
      const maxWidth = 450;

      let currentCard: Element | null = null;
      if (assetDropdownElement) {
        let parent = assetDropdownElement.parentElement;
        while (parent) {
          if (
            parent.hasAttribute("data-asset-card") ||
            parent.hasAttribute("data-select-card")
          ) {
            currentCard = parent;
            break;
          }
          parent = parent.parentElement;
        }
      }
      if (!currentCard) {
        currentCard =
          document.querySelector("[data-select-card='true']") ||
          document.querySelector("[data-asset-card='true']");
      }

      dropdownStyle = {
        position: "fixed",
        top: 200,
        left: (viewportWidth - minWidth) / 2,
        width: minWidth,
      };

      if (currentCard && assetDropdownElement) {
        const cardRect = currentCard.getBoundingClientRect();
        const isYouSend = currentCard.hasAttribute("data-asset-card");
        let desiredWidth = Math.min(
          maxWidth,
          Math.max(minWidth, cardRect.width * 0.4)
        );
        let top = cardRect.top - 45;
        if (isYouSend) {
          top = cardRect.top + 1;
        } else {
          top = cardRect.bottom + 20;
        }
        let left = cardRect.right - desiredWidth - 3;
        if (isYouSend) {
          left += 18;
        } else {
          left += 40;
        }
        if (left < cardRect.left) left = cardRect.left;
        if (left + desiredWidth > viewportWidth - minMargin) {
          left = viewportWidth - desiredWidth - minMargin;
        }
        if (left < minMargin) left = minMargin;
        if (cardRect.width < desiredWidth + 16) {
          left = cardRect.left + (cardRect.width - desiredWidth) / 2;
        }
        if (left + desiredWidth > viewportWidth - minMargin) {
          left = viewportWidth - desiredWidth - minMargin;
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
      if (calculationTimeout) clearTimeout(calculationTimeout);
      if (estimateTimeout) clearTimeout(estimateTimeout);
      setEstimate(null);
      setEstimateError(null);
      setEstimateLoading(false);
      setCalculationError(null);
      setReceiveAmountError(null);
      setApiValidationError(null);
      setSelectedAsset(asset);
      setIsAssetDropdownOpen(false);
      setAssetSearchTerm("");

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
          const defaultAmount = 1000;
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
          className="mt-1 bg-[#ffffff] dark:bg-[#1D1D23] border border-[#A2A4A9FF] dark:border-[#35353E] rounded-2xl shadow-lg z-40"
          style={dropdownStyle}
        >
          <div className="p-3 border-b border-[#A2A4A9FF] dark:border-[#35353E]">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7e7e8f] w-4 h-4" />
              <input
                type="text"
                placeholder="Type a currency"
                className="w-full text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 rounded-xl px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
                value={assetSearchTerm}
                onChange={(e) => setAssetSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {sortedSwapAssets.length === 0 ? (
            <div className="p-4 text-center text-[#7e7e8f] dark:text-[#788099]">
              {assetSearchTerm ? "No assets found" : "No assets available"}
            </div>
          ) : (
            <AssetDropdownVirtualized
              rows={assetDropdownRows}
              selectedAsset={selectedAsset}
              onAssetSelect={handlePickAsset}
            />
          )}
        </div>
      ),
      document.body
    );
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

  // Cleanup timeouts on unmount (prevents delayed navigation / late state updates)
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
      if (calculationTimeout) clearTimeout(calculationTimeout);
      if (estimateTimeout) clearTimeout(estimateTimeout);
    };
  }, [calculationTimeout, estimateTimeout]);

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

  // Clear validation errors when amount is cleared or form is reset
  useEffect(() => {
    if (!payAmount || payAmount === 0 || payAmountInput === "" || payAmountInput === "0") {
      setApiValidationError(null);
      setReceiveAmountError(null);
      setEstimateError(null);
      setCalculationError(null);
    }
  }, [payAmount, payAmountInput]);

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
    if (selectedPaymentDetails.length === 0) {
      setPaymentMethodError("Please select a payment method");
      errors.push("Please select a payment method");
      showToast.error("Please select a payment method");
      return false;
    }

    // Check if selected payment is pending (not approved/verified)
    const selected = selectedPaymentDetails[0];
    if (selected?.status && !isApprovedPaymentStatus(selected.status)) {
      const restrictionMessage = getPaymentRestrictionMessage(selected.status);
      setPaymentMethodError(restrictionMessage);
      errors.push(restrictionMessage);
      showToast.error(restrictionMessage);
      return false;
    }

    // Check if receive amount meets minimum requirements (only if user has entered a value)
    if (getAmount > 0) {
      const validationError = validateReceiveAmount(getAmount, selectedAsset);
      if (validationError) {
        errors.push(validationError);
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

          // Only open modal if API confirms user is NOT verified
          if (kycStatus && kycStatus.is_verified === false) {
            dispatch(openKYCModal());
            return;
          }
          // If verified (is_verified === true), continue with the flow
        } catch (error) {
          // If API check fails, fallback to user.is_verified
          // But only open modal if explicitly false (not undefined/null)
          if (user.is_verified === false) {
            dispatch(openKYCModal());
            return;
          }
          // If verification status is unknown, allow the action to proceed
          console.warn("KYC status check failed, proceeding with caution:", error);
        }
      }

      setIsSubmitting(true);
      setIsTransactionSubmitted(false);

      try {
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
          asset_id: String((selectedAsset as any)?.asset_id || ""),
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

        showToast.error(errorMessage);
        setValidationErrors([errorMessage]);
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

    if (selectedPaymentDetails.length === 0) {
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

        // Only open modal if API confirms user is NOT verified
        if (kycStatus && kycStatus.is_verified === false) {
          dispatch(openKYCModal());
          return;
        }
        // If verified (is_verified === true), continue with the flow
      } catch (error) {
        // If API check fails, fallback to user.is_verified
        // But only open modal if explicitly false (not undefined/null)
        if (user.is_verified === false) {
          dispatch(openKYCModal());
          return;
        }
        // If verification status is unknown, allow the action to proceed
        console.warn("KYC status check failed, proceeding with caution:", error);
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === "withdrawal") {
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
          asset_id: String((selectedAsset as any)?.asset_id || ""),
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
                receiveAmount: parseLocalizedAmountString(getAmountInput) || getAmount, // From "You Receive" input
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
                receiveAmount: parseLocalizedAmountString(getAmountInput) || getAmount, // From "You Receive" input
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
                toCurrency: changeNowResponse.data?.details?.to_currency,
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
            receiveAmount: parseLocalizedAmountString(getAmountInput) || getAmount, // From "You Receive" input
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

      showToast.error(errorMessage);
      setValidationErrors([errorMessage]);
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
    <div className="flex flex-col dark:bg-[var(--bg-color)] pl-0 pr-2 sm:pr-0 mr-0 sm:mr-40 w-full mx-auto">
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
            <div className="relative mb-2 sm:mb-3 md:mb-4">
              {/* Top Card Container */}
              <div
                data-asset-card="true"
                data-select-card="true"
                className="relative flex flex-col sm:flex-row border border-border dark:border-accent rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 overflow-visible gap-2 sm:gap-3 md:gap-0 bg-white dark:bg-[#18181D]"
              >
                {/* You Send Section */}
                <div className="flex-1 min-w-0">
                  <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
                    You Send
                    <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
                    {isCalculatingFromPay &&
                      (isCalculating || isCalculatingReceive) && (
                        <span className="text-xs text-[#1D8751] font-medium hidden sm:inline">(Active)</span>
                      )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={payAmountInput}
                      onChange={(e) => {
                        const inputValue = e.target.value;

                        // Allow digits with . or , as decimal separator (e.g. 0,1)
                        if (inputValue === "" || /^-?\d*[.,]?\d*$/.test(inputValue)) {
                          const normalizedForDecimals = inputValue.replace(",", ".");
                          const decSep = normalizedForDecimals.includes(".")
                            ? normalizedForDecimals.split(".").slice(1).join("")
                            : "";
                          if (decSep.length > 8) {
                            setApiValidationError("Number cannot have more than 8 decimal places.");
                            return;
                          }

                          const parsedValue =
                            inputValue === "" ? 0 : parseLocalizedAmountString(inputValue);

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

                            // Only calculate if we have a valid amount and asset
                            if (selectedAsset && newValue >= 0) {
                              // Check asset type first and handle accordingly
                              if (isSimpleCalculationAsset(selectedAsset)) {
                                if (isExchangeCommissionLookupAsset(selectedAsset) && !isForexAsset(selectedAsset)) {
                                  setIsCalculating(false);
                                  setIsCalculatingReceive(false);
                                } else if (isForexAsset(selectedAsset)) {
                                  const hasPct =
                                    apiCommission != null &&
                                    !Number.isNaN(Number(apiCommission));
                                  const calculatedGetAmount = hasPct
                                    ? Math.max(
                                        0,
                                        newValue -
                                          (newValue * Number(apiCommission)) / 100
                                      )
                                    : newValue;
                                  const inputStr = hasPct
                                    ? formatAmountForInput(calculatedGetAmount)
                                    : inputValue;
                                  setGetAmount(calculatedGetAmount);
                                  setGetAmountInput(inputStr);
                                  setPreviousValidAmount(inputStr);
                                  setIsCalculating(false);
                                  setIsCalculatingReceive(false);
                                } else {
                                  const commissionAmount = isCommissionApiAsset(selectedAsset)
                                    ? (newValue * (apiCommission ?? 2)) / 100
                                    : (newValue * (selectedAsset?.range_commissions?.[0]?.commission ? parseFloat(selectedAsset.range_commissions[0].commission) : 2)) / 100;
                                  const calculatedGetAmount = Math.max(0, newValue - commissionAmount);
                                  setGetAmount(calculatedGetAmount);
                                  setGetAmountInput(calculatedGetAmount.toString());
                                  setPreviousValidAmount(calculatedGetAmount.toString());
                                  setIsCalculating(false);
                                  setIsCalculatingReceive(false);
                                }
                              } else if (newValue > 0) {
                                // For non-simple assets, stop normal calculation and go directly to API

                                // Stop any ongoing normal calculations first
                                if (calculationTimeout) {
                                  clearTimeout(calculationTimeout);
                                }
                                if (estimateTimeout) {
                                  clearTimeout(estimateTimeout);
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
                          !apiValidationError
                          ? "Calculating..."
                          : "Enter amount"
                      }
                      className={`w-full rounded-2xl px-4 py-2 pr-16 text-lg focus:outline-none border appearance-none bg-transparent ${apiValidationError
                        ? "border-red-500"
                        : isCalculating || isCalculatingReceive
                          ? "border-[#1D8751]"
                          : isDark
                            ? "border-white/10 text-white"
                            : "border-gray-200 text-[#111827]"
                        }`}
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
                      !apiValidationError && (
                        <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D8751]"></div>
                        </div>
                      )}
                    {apiValidationError && (
                      <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-red-500"
                          />
                          <line
                            x1="12"
                            y1="8"
                            x2="12"
                            y2="12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            className="text-red-500"
                          />
                          <circle
                            cx="12"
                            cy="16"
                            r="1"
                            fill="currentColor"
                            className="text-red-500"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Display calculation error below You Send input */}
                  {calculationError && (
                    <div className="mt-2 text-sm text-yellow-500 dark:text-yellow-400">
                      {calculationError}
                    </div>
                  )}
                  {apiValidationError && (
                    <div className="mt-2 text-sm text-yellow-500 dark:text-yellow-400">
                      {apiValidationError}
                    </div>
                  )}
                </div>

                {/* Asset Section */}
                <div className="flex-1 min-w-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-[#35353E] dark:border-[#35353E] pt-2 sm:pt-0 sm:border-none">
                  <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                    Asset
                  </label>
                  <div className="relative" ref={assetDropdownRef}>
                    <div
                      className={`w-full rounded-2xl px-4 py-2 text-lg focus:outline-none border flex items-center justify-between cursor-pointer bg-transparent border-[#A2A4A9FF] dark:border-[#35353E] text-[#35353e] dark:text-[#ffffff]`}
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
                            <img
                              src={getHighResAssetIcon(selectedAsset, 72)}
                              alt={
                                selectedAsset?.name ||
                                selectedAsset?.ticker ||
                                selectedAsset?.symbol ||
                                "Asset"
                              }
                              className="w-6 h-6 rounded-full object-cover"
                              onError={(e) => {
                                console.log(
                                  "Image failed to load for asset:",
                                  selectedAsset
                                );
                                e.currentTarget.src = getHighResAssetIcon(null, 72);
                              }}
                            />
                            <div className="flex flex-col text-left">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium text-base ${isDark ? "text-white" : "text-[#1F2937]"
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
                              <span className="text-[#788099] text-sm">
                                {selectedAsset.name ||
                                  selectedAsset.ticker ||
                                  selectedAsset.symbol ||
                                  "Unknown"}{" "}
                                (
                                {getNetworkDisplayName(selectedAsset.network)}
                                )
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <img
                              src="/images/tether.svg"
                              alt="asset icon"
                              className="w-6 h-6 rounded-full object-cover"
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
            <div className="relative mb-2 sm:mb-3 md:mb-4">
              <div
                data-select-card="true"
                className="relative flex flex-col sm:flex-row border border-border dark:border-accent rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 overflow-visible gap-2 sm:gap-3 md:gap-0 bg-white dark:bg-[#18181D]"
              >
                {/* You Receive Section */}
                <div className="flex-1 min-w-0">
                  <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
                    You Receive
                    <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
                    {!isCalculatingFromPay &&
                      (isCalculating || isCalculatingReceive) && (
                        <span className="text-xs text-[#1D8751] font-medium hidden sm:inline">(Active)</span>
                      )}
                  </label>
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

                        if (value === "" || /^\d*[.,]?\d*$/.test(value)) {
                          const normalizedForDecimals = value.replace(",", ".");
                          const decSep = normalizedForDecimals.includes(".")
                            ? normalizedForDecimals.split(".").slice(1).join("")
                            : "";
                          if (decSep.length > 8) {
                            setApiValidationError("Number cannot have more than 8 decimal places.");
                            return;
                          }

                          const newAmount =
                            value === "" ? 0 : parseLocalizedAmountString(value);

                          // Only update state and calculate if value actually changed
                          if (newAmount !== getAmount || value !== getAmountInput) {
                            setGetAmountInput(value); // Store the string value for display
                            setGetAmount(newAmount);
                            setIsCalculatingFromPay(false);

                            // Clear any previous errors when user starts typing
                            setReceiveAmountError(null);
                            setApiValidationError(null);
                            setCalculationError(null);

                            // Only calculate if we have a valid amount and asset
                            if (selectedAsset && newAmount >= 0) {
                              // Check asset type first and handle accordingly
                              if (isSimpleCalculationAsset(selectedAsset)) {
                                if (isExchangeCommissionLookupAsset(selectedAsset) && !isForexAsset(selectedAsset)) {
                                  setIsCalculating(false);
                                  setIsCalculatingReceive(false);
                                } else if (isForexAsset(selectedAsset)) {
                                  const calculatedPayAmount =
                                    getFxpReversePayAmount(newAmount);
                                  const payStr =
                                    formatAmountForInput(calculatedPayAmount);
                                  setPayAmount(calculatedPayAmount);
                                  setPayAmountInput(payStr);
                                  setIsCalculating(false);
                                  setIsCalculatingReceive(false);
                                } else {
                                  const commissionRate = selectedAsset?.range_commissions?.[0]?.commission
                                    ? parseFloat(selectedAsset.range_commissions[0].commission)
                                    : 2;
                                  const calculatedPayAmount = isCommissionApiAsset(selectedAsset)
                                    ? newAmount / (1 - (apiCommission ?? 2) / 100)
                                    : newAmount / (1 - commissionRate / 100);
                                  setPayAmount(calculatedPayAmount);
                                  setPayAmountInput(calculatedPayAmount.toString());
                                  setIsCalculating(false);
                                  setIsCalculatingReceive(false);
                                }
                              } else if (newAmount > 0) {
                                // For non-simple assets, stop normal calculation and go directly to API

                                // Stop any ongoing normal calculations first
                                if (calculationTimeout) {
                                  clearTimeout(calculationTimeout);
                                }
                                if (estimateTimeout) {
                                  clearTimeout(estimateTimeout);
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
                        const currentValue =
                          parseLocalizedAmountString(getAmountInput) || 0;
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
                          !apiValidationError
                          ? "Calculating..."
                          : "Enter amount"
                      }
                      className={`w-full rounded-2xl px-4 py-2 pr-16 text-lg focus:outline-none border appearance-none bg-transparent ${(receiveAmountError &&
                        (receiveAmountError.includes("Rough estimate") ||
                          receiveAmountError.includes("Using estimated rate"))) ||
                        (apiValidationError &&
                          (apiValidationError.includes("Rough estimate") ||
                            apiValidationError.includes("Using estimated rate")))
                        ? "border-[#F79330]"
                        : (receiveAmountError &&
                          !receiveAmountError.includes("Rough estimate") &&
                          !receiveAmountError.includes(
                            "Using estimated rate"
                          )) ||
                          (apiValidationError &&
                            !apiValidationError.includes("Rough estimate") &&
                            !apiValidationError.includes(
                              "Using estimated rate"
                            ))
                          ? "border-red-500"
                          : isCalculating || isCalculatingReceive
                            ? "border-[#1D8751]"
                            : isDark
                              ? "border-white/10 text-white"
                              : "border-gray-200 text-[#111827]"
                        }`}
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <span className={`${isDark ? "text-white" : "text-[#1F2937]"} text-sm font-medium`}>
                        USD
                      </span>
                    </div>
                    {(isCalculatingReceive || isCalculating) &&
                      !apiValidationError && (
                        <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D8751]"></div>
                        </div>
                      )}
                    {((receiveAmountError &&
                      !receiveAmountError.includes("Rough estimate") &&
                      !receiveAmountError.includes("Using estimated rate")) ||
                      apiValidationError) && (
                        <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="text-red-500"
                            />
                            <line
                              x1="12"
                              y1="8"
                              x2="12"
                              y2="12"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              className="text-red-500"
                            />
                            <circle
                              cx="12"
                              cy="16"
                              r="1"
                              fill="currentColor"
                              className="text-red-500"
                            />
                          </svg>
                        </div>
                      )}
                    {((receiveAmountError &&
                      (receiveAmountError.includes("Rough estimate") ||
                        receiveAmountError.includes("Using estimated rate"))) ||
                      (apiValidationError &&
                        (apiValidationError.includes("Rough estimate") ||
                          apiValidationError.includes(
                            "Using estimated rate"
                          )))) && (
                        <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                            <path
                              d="M12 8v4m0 4h.01"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-[#F79330]"
                            />
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="text-[#F79330]"
                            />
                          </svg>
                        </div>
                      )}
                  </div>
                  {receiveAmountError && (
                    <p
                      className={`text-sm mt-1 ${receiveAmountError.includes("Rough estimate") ||
                        receiveAmountError.includes("Using estimated rate")
                        ? "text-[#F79330]"
                        : "text-red-500"
                        }`}
                    >
                      {receiveAmountError}
                    </p>
                  )}
                </div>

                {/* Payment Method Section */}
                <div className="flex-1 sm:pl-4 border-t sm:border-t-0 sm:border-l border-[#35353E] dark:border-[#35353E] pt-2 sm:pt-0 sm:border-none relative z-0">
                  <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                    Payment Method
                  </label>
                  <div className="relative z-0">
                    {(() => {
                      // Use public payment methods if available (they have logos)
                      let paymentMethodOptions: Array<{ value: string; label: string; logo?: string }> = [];
      if (activePublicProviders.length > 0) {
                        // Use public payment methods with logos
                        paymentMethodOptions = activePublicProviders.map((provider: any) => {
                          const providerName = provider.provider_name || provider.payment_provider_name || "Unknown";
          const methodName =
            provider.method?.method_name ||
            provider.method?.method_display ||
            provider.method_display ||
            provider.method_name ||
            provider.method ||
            null;
                          const subtitle = methodName ? `${providerName} - ${methodName}` : null;

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
                          logoClassName={PAYMENT_LOGO_BASE_CLASS}
                          sizeMode="card"
                          onChange={(value) => {
                            const selectedProvider = activePublicProviders.find(
                              (provider: any) =>
                                (provider.provider_name || provider.payment_provider_name) === value
                            );

                            setPayBank(value); // Keep full value for dropdown to work
                            setSelectedProviderData(selectedProvider); // Store full provider data for comparison
                            setSelectedPaymentDetail(selectedProvider || null);

                            setSelectedPaymentDetails([]);
                            setPaymentMethodError(null);
                          }}
                          placeholder={
                            isLoading
                              ? "Loading payment methods..."
                              : paymentMethodOptions.length > 0
                                ? "Select Payment Method"
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
                  {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                  {paymentMethodError && <p className="text-red-500 text-sm mt-1">{paymentMethodError}</p>}

                  {/* Registered Account Section */}
                  {payBank && (
                    <div className="mt-3 w-full relative z-10">
                      <label className="block text-[17px] text-[#475569] dark:text-[#9CA3AF] mb-2 font-semibold">
                        Registered Account
                      </label>
                      {(() => {
                        // Check if user has ANY accounts at all (not just filtered ones)
                        const allUserAccounts = userPaymentMethodsDisplay.displayData || effectiveUserPaymentMethods || [];
                        const hasAnyAccounts = allUserAccounts.length > 0;
                        const hasFilteredAccounts = enhancedFilteredUserPaymentDetails.length > 0;

                        if (hasFilteredAccounts) {
                          return (
                            <div className="relative w-full z-10">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {enhancedFilteredUserPaymentDetails.length} account(s) found
                                </span>

                              </div>
                              <div className="w-full min-w-0 relative z-[100] isolate">
                                <CustomSelect
                                  sizeMode="card"
                                  options={(enhancedFilteredUserPaymentDetails || []).map(
                                    (detail: UserPaymentDetail) => {
                                      // Try to get provider info from public payment methods first
                                      let providerName = detail.payment_provider_name || detail.provider_name || "Unknown Provider";
                                      let providerLogo = detail.provider_logo;

                                      if (activePublicProviders.length > 0) {
                                        const publicProvider = activePublicProviders.find(
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
                                        logo: providerLogo || undefined,
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
                                    selectedPaymentDetails.length > 0 && selectedPaymentDetails[0]
                                      ? String(selectedPaymentDetails[0].id ?? selectedPaymentDetails[0].user_payment_detail_id ?? "")
                                      : ""
                                  }
                                  onChange={(value) => {
                                    const selectedId = Number(value);
                                    const selectedDetail =
                                      enhancedFilteredUserPaymentDetails.find(
                                        (detail: UserPaymentDetail) =>
                                          detail.id === selectedId
                                      );
                                    if (selectedDetail) {
                                      setSelectedPaymentDetails([selectedDetail]);
                                      // Clear payment method error when selecting an account
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
                                  className="w-full min-w-0"
                                />
                              </div>
                            </div>
                          );
                        } else if (hasAnyAccounts) {
                          // User has accounts but not for this payment method
                          return (
                            <p className="text-[#F79330] text-sm">
                              No account found for this payment method.{" "}
                              <button
                                type="button"
                                onClick={() => setIsPaymentModalOpen(true)}
                                className="hover:underline cursor-pointer font-medium text-[#1D8751] hover:text-[#166b3e]"
                              >
                                Add Account
                              </button>
                            </p>
                          );
                        } else {
                          // User has no accounts at all
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
                      })()}
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
                Commission: {selectedAsset && isSimpleCalculationAsset(selectedAsset) ? `${isCommissionApiAsset(selectedAsset) ? (apiCommission ?? 2) : (selectedAsset?.range_commissions?.[0]?.commission || 2)}% of $${payAmount}` : `${selectedAsset?.range_commissions?.[0]?.commission || 2}% of $${payAmount}`} = $
                {commissionAmount}
              </span>
            </div>
            <img
              src="/assets/Screenshot_2025-07-25_092724_rjinec.png"
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

            {/* Pending Account Warning */}
            {!isTransactionSubmitted && !showForexWithdrawalForm && isSelectedPaymentPending && selectedPaymentDetails.length > 0 && (
              <div className="mb-3 flex items-start gap-3 p-4 rounded-2xl bg-[#F79330]/10 border border-[#F79330]/40">
                <svg className="w-5 h-5 text-[#F79330] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#F79330]">
                    {isSelectedPaymentFrozen ? "Account Frozen" : "Account Pending Approval"}
                  </p>
                  <p className="text-xs text-[#F79330]/80 mt-1">
                    Your account{selectedPaymentDetails[0]?.account_name ? ` "${selectedPaymentDetails[0].account_name}"` : ""}{selectedPaymentDetails[0]?.account_number ? ` (${selectedPaymentDetails[0].account_number})` : ""}{" "}
                    {isSelectedPaymentFrozen
                      ? "is frozen. Please "
                      : "is pending approval. Please "}
                    <a href="/contactUs" className="text-[#1D8751] underline font-semibold hover:text-[#17693f] transition-colors">contact support</a>{" "}
                    {isSelectedPaymentFrozen
                      ? "for assistance."
                      : "to get your account approved."}
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button for First Card */}
            {!isTransactionSubmitted && !showForexWithdrawalForm && (
              <div className="relative">
                <button
                  type="button"
                  className={`w-full text-[#35353e] dark:text-[#788099] text-base font-medium py-1.5 rounded-full flex items-center justify-center gap-2 transition-colors ${isHomePage
                    ? (isOtcPopupAsset(selectedAsset) && (payAmount >= 15000 || getAmount >= 15000)) || isSelectedPaymentPending
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-[#1D8751] hover:bg-[#1D8751]/80 cursor-pointer"
                    : isSubmitting ||
                      isTransactionSubmitted ||
                      isInfoModalOpen ||
                      (isOtcPopupAsset(selectedAsset) && (payAmount >= 15000 || getAmount >= 15000)) ||
                      isSelectedPaymentPending
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-[#1D8751] hover:bg-[#1D8751]/80"
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
                      if (selectedPaymentDetails.length === 0) {
                        showToast.error("Please select a payment method");
                        return;
                      }
                      setShowForexWithdrawalForm(true);
                    } else {
                      handleFirstCardSubmit();
                    }
                  }}
                  disabled={
                    requiresLoginRedirect
                      ? (isOtcPopupAsset(selectedAsset) &&
                          (payAmount >= 15000 || getAmount >= 15000)) ||
                        isSelectedPaymentPending ||
                        hasDecimalPlacesError
                      : isSubmitting ||
                      isTransactionSubmitted ||
                      isInfoModalOpen ||
                      (isOtcPopupAsset(selectedAsset) && (payAmount >= 15000 || getAmount >= 15000)) ||
                      isSelectedPaymentPending ||
                      hasDecimalPlacesError
                  }
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
                      <span>Withdrawal Addresses Generated</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center ">
                      <span className="text-base font-medium text-white">E</span>
                      <img
                        className="h-5 w-auto mt-2"
                        src="/assets/Group_5_gkxzdz.png"
                        alt="Express icon"
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
                selectedPaymentDetails={selectedPaymentDetails}
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
                <span className="text-[#7e7e8f] dark:text-[#788099]">2-</span>
                Wallet Address
              </h2>
              <div className="bg-white dark:bg-[#1D1D23] border border-border dark:border-[#35353e] rounded-2xl p-3 sm:p-5 shadow-lg w-full text-[#35353e] dark:text-[#788099]">
                {/* USDT Wallet Address */}
                <div className="mb-4">
                  <h3 className="text-sm sm:text-base text-[#35353e] dark:text-[#788099] font-semibold mb-2">
                    USDT Wallet Address
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
                            className="flex items-center gap-1 bg-[#E8EFF5] dark:bg-[#35353E] border border-[#1D8751] text-[#1D8751] rounded-full px-2 sm:px-4 py-1 font-semibold text-xs sm:text-base hover:bg-[#1D8751] hover:text-[#35353e] transition-colors"
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

                {/* Terms & Conditions */}
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-[#1D8751]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className={`font-medium text-sm sm:text-base ${isDark ? "text-white" : "text-gray-900"}`}>
                    Terms & Conditions
                  </h3>
                </div>
                <div className={`border border-[#1D8751] rounded-xl overflow-hidden transition-all duration-300 ${isDark ? "bg-[#1D1D23]" : "bg-[#F8FAFF]"}`}>
                  <div className="p-4">
                    <div className={`space-y-2 sm:space-y-3 ${expandedTerms ? "" : "line-clamp-3"}`}>
                      <div className="flex items-start gap-2 sm:gap-3">
                        <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">1.</span>
                        <p className={`text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-[#475569]"}`}>
                          <span className="font-semibold">Your receiving account:</span> We will send money to your{" "}
                          <span className="font-semibold text-[#1D8751]">{selectedPaymentDetail?.provider_name || selectedProviderData?.provider_name || payBank || "the selected provider"}</span>{" "}
                          account <span className="font-semibold text-[#1D8751]">{selectedPaymentDetail?.account_number || selectedPaymentDetail?.payment_details?.[0]?.account_number || selectedPaymentDetail?.payment_details?.[0]?.mobile_number || "—"}</span>{" "}
                          for withdrawal of <span className="font-semibold text-[#1D8751]">{selectedAsset?.ticker || selectedAsset?.symbol || "crypto"}</span>. Please ensure this is your own account.
                        </p>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-3">
                        <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">2.</span>
                        <p className={`text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-[#475569]"}`}>
                          <span className="font-semibold">Put transaction ID in the description field:</span> You must put the transaction ID in the description/memo field of the bank.
                        </p>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-3">
                        <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">3.</span>
                        <p className={`text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-[#475569]"}`}>
                          <span className="font-semibold">Non-compliance:</span> Please note, if you do not follow the above conditions, we may reject your transaction and return your funds, but delays may apply.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedTerms(!expandedTerms)}
                      className="mt-3 sm:mt-4 text-[#1D8751] hover:text-[#166b3e] font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                    >
                      {expandedTerms ? (
                        <>
                          <span>Show Less</span>
                          <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </>
                      ) : (
                        <>
                          <span>Show More</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>

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
                    <span className="text-[#35353e] dark:text-[#788099] text-sm">
                      I've read and agree to the{" "}
                      <button
                        type="button"
                        className="text-[#1D8751] cursor-pointer hover:underline"
                        onClick={() =>
                          openLegalModal("Terms of Use", [
                            "By using this withdrawal service, you confirm that all payment details and receiving account information submitted by you are true, accurate, and belong to you. You are solely responsible for ensuring the account number, account name, provider details, and network/asset selections are correct before submitting any request.",
                            "You agree to provide complete transaction information, including required references such as transaction identifiers or descriptions where requested. If mandatory information is missing or incorrect, your transaction may be delayed, placed under review, rejected, or returned according to operational and compliance procedures.",
                            "Processing times, fees, commissions, exchange rates, and applicable limits may vary depending on network conditions, liquidity, provider availability, security checks, and market volatility. Any estimate shown before completion is indicative only and does not constitute a final guaranteed settlement amount.",
                            "You acknowledge that OMAYA may perform verification, compliance, and fraud-prevention checks at any stage of the transaction lifecycle. Transactions that appear suspicious, violate policy, or conflict with AML/KYC requirements may be paused, restricted, cancelled, or escalated for manual review without prior notice.",
                            "By proceeding, you confirm that you have read and accepted these Terms of Use and related legal documents, including the Privacy Policy, Payment Policies, AML Policy, and Risk Disclosure Statements. Continued use of this service indicates your consent to be bound by current terms and any lawful updates published by OMAYA."
                          ])
                        }
                      >
                        Terms of Use
                      </button>
                      ,{" "}
                      <button
                        type="button"
                        className="text-[#1D8751] cursor-pointer hover:underline"
                        onClick={() =>
                          openLegalModal("Privacy Policy", [
                            "OMAYA collects only the information necessary to provide secure withdrawal services, including identity, wallet/account, transaction, and technical session data.",
                            "Your data is used for transaction processing, fraud prevention, account security, customer support, service improvement, and legal/compliance obligations.",
                            "We implement technical and organizational safeguards to protect your data, but you are also responsible for safeguarding account credentials and devices.",
                            "Data may be shared with payment partners, compliance providers, and regulators where required to complete transactions or satisfy legal obligations.",
                            "By using the service, you consent to data handling described in this policy and acknowledge that retention periods may apply for audit, legal, and security purposes."
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
                            "Payments may be rejected, reversed, or returned where required by provider rules, legal obligations, or operational risk controls."
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
                            "Use of this service confirms your commitment to lawful financial activity and compliance with AML/CFT obligations."
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
                          openLegalModal(
                            "Risk Disclosure Statements",
                            [
                              "Digital asset and fiat settlement services involve operational, market, network, and counterparty risks that may affect execution and timing.",
                              "Blockchain transactions can be delayed, congested, or irreversible depending on network conditions and confirmation requirements.",
                              "Quoted prices and estimated outputs can change before completion due to volatility, liquidity shifts, and provider-side updates.",
                              "Service interruptions, maintenance, third-party outages, and regulatory actions may temporarily limit or suspend certain transaction paths.",
                              "By proceeding, you acknowledge these risks and accept responsibility for transaction decisions made on the platform."
                            ]
                          )
                        }
                      >
                        Risk Disclosure Statements
                      </button>
                    </span>
                  </label>
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
              {/* Disclaimer and Button outside the card */}
              <div className="flex flex-col gap-3 w-full px-2">
                <div className="flex items-center text-[#35353e] dark:text-[#788099] text-[16px] font-semibold">
                  <div className="w-5 h-5 border-2 border-[#E23D3A] rounded-full flex items-center justify-center flex-shrink-0 mr-2">
                    <span className="text-[#E23D3A] text-xs font-bold">i</span>
                  </div>
                  <span>
                    This is only an estimated price based on current market rates.
                    The final price will be confirmed when we receive the funds.
                  </span>
                </div>

                {/* Pending Account Warning */}
                {isSelectedPaymentPending && selectedPaymentDetails.length > 0 && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#F79330]/10 border border-[#F79330]/40">
                    <svg className="w-5 h-5 text-[#F79330] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#F79330]">
                        {isSelectedPaymentFrozen ? "Account Frozen" : "Account Pending Approval"}
                      </p>
                      <p className="text-xs text-[#F79330]/80 mt-1">
                        Your account{selectedPaymentDetails[0]?.account_name ? ` "${selectedPaymentDetails[0].account_name}"` : ""}{selectedPaymentDetails[0]?.account_number ? ` (${selectedPaymentDetails[0].account_number})` : ""}{" "}
                        {isSelectedPaymentFrozen
                          ? "is frozen. Please "
                          : "is pending approval. Please "}
                        <a href="/contactUs" className="text-[#1D8751] underline font-semibold hover:text-[#17693f] transition-colors">contact support</a>{" "}
                        {isSelectedPaymentFrozen
                          ? "for assistance."
                          : "to get your account approved."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Warning message for amounts over $15,000 */}
                {isOtcPopupAsset(selectedAsset) && getAmount > 15000 && (
                  <div className="flex items-center text-[#1D8751] text-[14px] font-medium bg-[#23232b] dark:bg-[#35353E] border border-[#1D8751] rounded-xl p-3">
                    <FaExclamationCircle className="mr-2 text-[#1D8751]" />
                    <span>
                      Amount exceeds $15,000. Please reduce the amount or contact
                      our OTC Desk for better rates.
                    </span>
                  </div>
                )}
                <button
                  className={`w-full text-white text-base font-medium py-2 rounded-2xl flex items-center justify-center gap-2 transition-colors ${isSubmitting || isInfoModalOpen || (isOtcPopupAsset(selectedAsset) && getAmount > 15000) || !isTermsAccepted || isSelectedPaymentPending
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-[#1D8751] hover:bg-[#166b3e]"
                    }`}
                  onClick={() => {
                    // Navigate to exchanging page with websocket URL
                    if (onExchange) {
                      const transactionData = {
                        type: "withdrawal" as const,
                        amount: payAmount,
                        receiveAmount: parseLocalizedAmountString(getAmountInput) || getAmount, // From "You Receive" input
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
                        websocketUrl: websocketUrl,
                        paymentDetails: selectedPaymentDetails,
                      };
                      onExchange(transactionData);
                    }
                  }}
                  disabled={
                    isSubmitting ||
                    isInfoModalOpen ||
                    (isOtcPopupAsset(selectedAsset) && getAmount > 15000) ||
                    !isTermsAccepted ||
                    isSelectedPaymentPending ||
                    hasDecimalPlacesError
                  }
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
          {validationErrors.length > 0 && (
            <div className="w-full mt-4 px-2 mb-4">
              <div className="bg-[#23232b] dark:bg-[#35353E] border border-[#1D8751] rounded-2xl p-4">

                <ul className="list-disc list-inside text-[#1D8751] space-y-1">
                  {validationErrors.map((error, index) => (
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
            onAdd={async () => {
              try {
                // Refresh both user and admin payment details after adding (force refresh)
                await Promise.all([
                  withTimeout(dispatch(fetchUserPaymentDetails(true)).unwrap(), 15_000),
                  withTimeout(dispatch(fetchAdminWalletList(true)).unwrap(), 15_000),
                ]);
                showToast.success("Payment method added successfully!");
              } catch (error) {
                console.error("Failed to refresh payment details:", error);
                showToast.error("Payment method added, but failed to refresh. Please reload the page.");
              }
            }}
          />

          {/* InfoModal */}
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
        </>
      )}
    </div>
  );
}
