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
import Link from "next/link";
import { FaExchangeAlt, FaExclamationCircle } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../../../store";
import {
  fetchAdminPaymentDetails,
  fetchUserPaymentDetails,
  fetchAdminWalletList,
} from "../../../../exchange/slices/paymentSlice";
import { fetchPublicPaymentMethods } from "../../../../p2p/slices/paymentMethodsSlice";
import { fetchAssets, createDeposit } from "../../../../exchange/slices/exchangeSlice";
import {
  fetchSupportedAssets,
  fetchSwapEstimate,
} from "../../../../swap/slices/swapSlice";
import { validateWalletAddress } from "../../../../../lib/addressValidaion";
import { showToast } from "../../../../../lib/utils/toast";
import { DepositResponse } from "../../../../exchange/types";
import { SupportedAsset } from "../../../../swap/types";
import { FaSearch } from "react-icons/fa";
import { createExpressWithdrawal } from "../../../api";
import {
  ExpressWithdrawalPayload,
  ExpressWithdrawalResponse,
} from "../../../types";
import PaymentMethodsModal from "../../../../p2p/components/ui/p2pdashboard/sections/PaymentMethodsModal";
import InfoModal from "./info";
import { debugAssetFetching } from "../../../../../lib/utils/debugAssets";
import {
  useAssetsDisplay,
  usePaymentMethodsDisplay,
} from "../../../hooks/useDataDisplay";
import { useChangeNowAssets } from "../../hooks/useChangeNowAssets";
import CustomSelect from "@/components/ui/HomeCommonSelect";
import ForexWithdrawal from "./ForexWithdrawal";
import { useTheme } from "@/context/theme";
import {
  buildExpressRedirectPath,
  setAuthRedirectPath,
} from "@/lib/utils/authRedirect";
import { openKYCModal, checkKYCStatus } from "@/features/auth/slices/authSlice";

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
    amountValue?: number;
    amountInput?: string;
    asset?: any;
    paymentDetails?: UserPaymentDetail[];
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
    'trx': 'TRON'
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
  const [transactionMode, setTransactionMode] = useState<"crypto" | "forex">("crypto");

  // Declare all refs early to avoid initialization errors
  const paymentDetailsRef = useRef<HTMLDivElement>(null);
  const assetDropdownRef = useRef<HTMLDivElement>(null);
  const assetDropdownContentRef = useRef<HTMLDivElement | null>(null);

  // Helper function to check if asset is FXP (forex) - defined early to avoid hoisting issues
  const isForexAsset = (asset: any) => {
    if (!asset) return false;
    const ticker = (asset?.ticker || asset?.symbol || "").toLowerCase();
    return ticker === "fxp";
  };

  const { adminPaymentDetails, adminWalletList, loading, error } = useSelector(
    (state: any) => state.payment
  );

  // Add public payment methods state for home page
  const { publicPaymentMethods, publicMethodsLoading, publicMethodsError } = useSelector(
    (state: any) => state.paymentMethods
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
    // Always try to use public payment methods first (they have logos)
    // Handle new API structure for public payment methods
    if (Array.isArray(publicPaymentMethods?.data?.providers)) {
      return publicPaymentMethods.data.providers;
    }
    // Check for payment_methods array (older structure)
    if (Array.isArray(publicPaymentMethods?.data?.payment_methods)) {
      return publicPaymentMethods.data.payment_methods;
    }
    // Check if publicPaymentMethods itself is an array (fallback)
    if (Array.isArray(publicPaymentMethods)) {
      return publicPaymentMethods;
    }

    // Fallback to admin payment details if public methods not available
    const adminArray = Array.isArray(adminPaymentDetails)
      ? adminPaymentDetails
      : Array.isArray(adminPaymentDetails?.data)
        ? adminPaymentDetails.data
        : [];
    return adminArray;
  }, [publicPaymentMethods, adminPaymentDetails]);

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
    isHomePage ? publicMethodsLoading : loading,
    isHomePage ? publicMethodsError : error
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


      await dispatch(fetchSupportedAssets(true)).unwrap();

    } catch (error) {
    }
  };

  // Force refresh assets
  const handleForceRefreshAssets = async () => {
    try {
      await dispatch(fetchSupportedAssets(true)).unwrap();
    } catch (error) {
    }
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
    initialState?.amountInput ?? "0"
  );
  const [selectedAsset, setSelectedAsset] = useState<any>(
    initialState?.asset || null
  );
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const [isCalculatingFromPay, setIsCalculatingFromPay] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");
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

  // Forex-specific state for withdrawal
  const [userNotesForex, setUserNotesForex] = useState<string>("");
  const [showForexWithdrawalForm, setShowForexWithdrawalForm] = useState<boolean>(false);
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

  const updateAssetDropdownPosition = useCallback(() => {
    if (!assetDropdownRef.current) {
      return;
    }
    const rect = assetDropdownRef.current.getBoundingClientRect();
    const cardElement = assetDropdownRef.current.closest(
      "[data-asset-card='true']"
    ) as HTMLElement | null;
    const cardRect = cardElement?.getBoundingClientRect();
    setAssetDropdownPosition({
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
    const handleReposition = () => updateAssetDropdownPosition();

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
  const [isFirstCardSubmitted, setIsFirstCardSubmitted] = useState(false);

  // Add loading state for "You Receive" calculation
  const [isCalculatingReceive, setIsCalculatingReceive] = useState(false);

  // Add payment selection state
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<
    UserPaymentDetail[]
  >([]);

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

  // Add PaymentMethodsModal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Add InfoModal state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

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
  const MAX_RETRIES = 3;

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
        return name.includes(" - ") ? name.split(" - ")[0].trim() : name.trim();
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

      // Compare payment_method_name from user details with available methods from API
      const userPaymentMethodName = normalizePaymentMethodName(detail.payment_method_name);
      const hasValidPaymentMethod = userPaymentMethodName
        ? availablePaymentMethodNames.includes(userPaymentMethodName)
        : false;

      // If FXP is selected, only show approved payment methods
      if (selectedAsset && isForexAsset(selectedAsset)) {
        const isApproved = detail.status?.toLowerCase() === 'approved';
        return matchesProvider && isApproved && hasValidPaymentMethod;
      }

      // Only return payment details that match provider AND have a valid payment method name
      return matchesProvider && hasValidPaymentMethod;
    });

    return filtered;
  }, [payBank, userPaymentMethodsDisplay.displayData, effectiveUserPaymentMethods, selectedAsset, availablePaymentMethodNames, userPaymentDetails, selectedProviderData]);

  // Auto-select first payment method when payment methods are available
  useEffect(() => {
    // Only auto-select if no payment method is currently selected
    if (payBank) {
      return;
    }

    // Check if payment methods are available from public payment methods
    if (Array.isArray(publicPaymentMethods?.data?.providers) && publicPaymentMethods.data.providers.length > 0) {
      const firstProvider = publicPaymentMethods.data.providers[0];
      const firstProviderName = firstProvider.provider_name || firstProvider.payment_provider_name;

      if (firstProviderName) {
        setPayBank(firstProviderName);
        setSelectedProviderData(firstProvider);
        setSelectedPaymentDetail(firstProvider);
        return;
      }
    }

    // Fallback to admin wallet list if public methods not available
    if (adminWalletListDisplay.displayData && adminWalletListDisplay.displayData.length > 0) {
      const providerNames = Array.from(
        new Set(
          adminWalletListDisplay.displayData.map(
            (wallet: any) => wallet?.admin_payment_detail?.provider_name
          )
        )
      ).filter((type) => Boolean(type && type.trim())) as string[];

      if (providerNames.length > 0) {
        const firstProviderName = providerNames[0];
        const selectedWallet = adminWalletListDisplay.displayData.find(
          (wallet: any) =>
            wallet.admin_payment_detail?.provider_name === firstProviderName
        );

        if (selectedWallet?.admin_payment_detail) {
          setPayBank(firstProviderName);
          setSelectedProviderData(selectedWallet.admin_payment_detail);
          setSelectedPaymentDetail(selectedWallet.admin_payment_detail);
        }
      }
    }
  }, [payBank, publicPaymentMethods, adminWalletListDisplay.displayData]);

  // Auto-select first account when accounts are available for selected payment type
  useEffect(() => {
    if (
      payBank &&
      enhancedFilteredUserPaymentDetails.length > 0 &&
      selectedPaymentDetails.length === 0
    ) {

      const firstAccount = enhancedFilteredUserPaymentDetails[0];
      setSelectedPaymentDetails([firstAccount]);
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

  useEffect(() => {
    // Skip API calls on home page - buttons will redirect to login
    if (isHomePage) {
      return;
    }

    // First try to get from cache, then force refresh if no data
    dispatch(fetchAdminPaymentDetails(false))
      .unwrap()
      .then((data) => {
        // Update ref immediately
        if (data && data.length > 0) {
          paymentMethodsRef.current = data.filter((p: any) =>
            p.is_active === undefined || p.is_active === null || p.is_active === true || p.is_active === 'true'
          );
        }
        // If no payment methods in cache, force refresh
        if (!data || (Array.isArray(data) && data.length === 0)) {
          return dispatch(fetchAdminPaymentDetails(true)).unwrap();
        }
        return data;
      })
      .catch((error: unknown) => {
        // If cache fetch fails, try force refresh
        return dispatch(fetchAdminPaymentDetails(true))
          .unwrap()
          .then((data) => {
            // Update ref immediately
            if (data && data.length > 0) {
              paymentMethodsRef.current = data.filter((p: any) =>
                p.is_active === undefined || p.is_active === null || p.is_active === true || p.is_active === 'true'
              );
            }
            return data;
          })
          .catch((refreshError: unknown) => {
            console.error('❌ Force refresh also failed:', refreshError);
            // Don't show toast error - the UI will handle the loading/error state gracefully
          });
      });
  }, [dispatch, isHomePage]);

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
    // Skip API calls on home page
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
            showToast.error(`Failed to fetch assets after ${MAX_RETRIES} attempts`);
          }
          setHasFetchedAssets(true);
        }
      });
  }, [dispatch, isHomePage, hasFetchedAssets, assetsRetryCount]);

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
        // If cache fetch fails, try force refresh
        return dispatch(fetchUserPaymentDetails(true))
          .unwrap()
          .then((data) => {
            // Update ref immediately
            if (data && data.length > 0) {
              userPaymentMethodsRef.current = data;
            }
            return data;
          })
          .catch((refreshError: unknown) => {
            // Don't show toast error - the UI will handle the loading/error state gracefully
            throw refreshError;
          });
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

      // Set fallback assets after max retries
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

    dispatch(fetchSupportedAssets(false))
      .unwrap()
      .then((data) => {
        console.log("✅ Swap assets fetched successfully");
        setHasFetchedSwapAssets(true);
        setSwapAssetsRetryCount(0); // Reset retry count on success

        // If no assets in cache, try one force refresh (counts as a retry)
        if ((!data || data.length === 0) && swapAssetsRetryCount === 0) {
          setSwapAssetsRetryCount(1);
          dispatch(fetchSupportedAssets(true)).unwrap()
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
            showToast.warning("Unable to fetch swap assets. Using fallback data.");
          }

          // Set fallback assets
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

        // Priority 3: FXPRIMUS (ticker: fxp)
        if (
          tickerA === "fxp" &&
          !(tickerB === "fxp")
        ) {
          return -1;
        }
        if (
          tickerB === "fxp" &&
          !(tickerA === "fxp")
        ) {
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
        // For FXP, calculate immediately without API
        calculateAmounts(payAmount, true);
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

  // Check if asset is one of the first two direct assets (USDT on BSC or USDC on BSC)
  const isSimpleCalculationAsset = (asset: any) => {
    if (!asset) return false;
    const ticker = (asset?.ticker || asset?.symbol || "").toLowerCase();
    const network = (asset?.network || "").toLowerCase();

    // First two assets: USDT on BSC and USDC on BSC
    return (ticker === "usdt" && network === "bsc") ||
      (ticker === "usdc" && network === "bsc");
  };

  // FXP withdrawal rate: 1 FXP = 1.1 USD (user sends FXP, receives USD)
  const FXP_TO_USD_RATE = 1.1;

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
    const ticker = (asset?.ticker || asset?.symbol || "").toLowerCase();
    return ticker === "usdt" || ticker === "usdc" ? 100 : 0.1;
  };

  // Get minimum amount based on asset type
  const getMinimumAmount = (asset: any) => {
    if (!asset) return 10; // Default minimum
    const ticker = (asset?.ticker || asset?.symbol || "").toLowerCase();
    return ticker === "usdt" || ticker === "usdc" ? 2 : 10; // 2 for direct assets, 10 for others
  };

  // Validate receive amount - allow any amount for now
  const validateReceiveAmount = (amount: number, asset: any) => {
    // Allow any amount - no validation for now
    return null; // No error
  };

  // Fetch estimate for non-direct assets with debouncing for better performance
  useEffect(() => {
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
      isCalculatingFromPay // Only fetch estimate when calculating from pay amount
    ) {
      // Check cache first - if found and valid, use immediately without any loading states
      const cacheKey = `${selectedAsset.ticker?.toUpperCase()}_${selectedAsset.network}_${payAmount}`;
      const cachedEntry = estimateCache.get(cacheKey);

      if (cachedEntry && isCacheValid(cachedEntry.timestamp)) {
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
        }, 1500); // Ultra-fast 1.5 second timeout for immediate response
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
            clearTimeout(timeoutId); // Clear timeout on success
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
      }, 50); // 50ms debounce for immediate response while preventing duplicate calls

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
            setIsCalculating(false);
            setIsCalculatingReceive(false);
            setEstimateLoading(false);
          } else {
            // No valid result, clear loading states
            setIsCalculating(false);
            setIsCalculatingReceive(false);
            setEstimateLoading(false);
          }
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

          const fallbackPayAmount = getAmount * (1 + commissionRate / 100);
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

  // Filter swap assets based on search term and filter tab - search by ticker and name
  const filteredSwapAssets = useMemo(() => {
    let filtered = assetsDisplay.displayData?.filter((asset: SupportedAsset) => {
      const ticker = asset?.ticker?.toUpperCase() || "";
      const name = asset?.name?.toUpperCase() || "";
      const symbol = asset?.symbol?.toUpperCase() || "";
      const searchTerm = assetSearchTerm.toUpperCase();

      // Apply search filter
      const matchesSearch = !searchTerm || 
        ticker.includes(searchTerm) ||
        name.includes(searchTerm) ||
        symbol.includes(searchTerm);

      if (!matchesSearch) return false;

      // Apply filter tab (only for home page)
      if (isHomePage) {
        switch (assetFilterTab) {
          case "new":
            // Show featured assets or assets with is_changenow_asset as "new"
            return asset.featured === true || asset.is_changenow_asset === true;
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

  // Sort assets: USDT on BSC, USDC on BSC, fxprimus, then rest in original order
  const sortedSwapAssets = [...filteredSwapAssets].sort((a, b) => {
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

    // Priority 3: FXPRIMUS (ticker: fxp)
    if (
      tickerA === "fxp" &&
      !(tickerB === "fxp")
    ) {
      return -1;
    }
    if (
      tickerB === "fxp" &&
      !(tickerA === "fxp")
    ) {
      return 1;
    }

    // Default: preserve original order (no change)
    return 0;
  });

  const renderAssetDropdown = () => {
    if (!isComponentMounted || !isAssetDropdownOpen) {
      return null;
    }

    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0;
    const minMargin = 16;
    const minWidth = 280;
    const maxWidth = 450;

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

      // Check if this is "You Send" section (has data-asset-card) or "You Receive" section
      // "You Send" has both data-asset-card and data-select-card
      // "You Receive" has only data-select-card
      const isYouSend = currentCard.hasAttribute('data-asset-card');

      // Calculate reduced width so dropdowns don't cover amount inputs (40% of card width)
      let desiredWidth = Math.min(maxWidth, Math.max(minWidth, cardRect.width * 0.4));

      // Position dropdown vertically based on section
      let top = cardRect.top - 45; // default: above the card
      if (isYouSend) {
        top = cardRect.top + 1; // push "You Send" asset dropdown down a little more
      } else {
        // "You Receive" section - pushed down significantly below the card bottom
        top = cardRect.bottom + 20; // Push "You Receive" dropdown down by 20px below card bottom
      }

      let left: number;

      // Both "You Send" and "You Receive" - position from right side of card, pushed more right
      // Position it very close to the right edge
      left = cardRect.right - desiredWidth - 3; // 3px from right edge of card

      // Push "You Send" dropdown further to the right
      if (isYouSend) {
        left += 18; // additional right offset for "You Send"
      } else {
        // Push "You Receive" dropdown to the right a little more
        left += 40; // additional right offset for "You Receive"
      }

      // Ensure it doesn't go off the left edge
      if (left < cardRect.left) {
        left = cardRect.left;
      }

      // Ensure it doesn't go off screen on the right
      if (left + desiredWidth > viewportWidth - minMargin) {
        left = viewportWidth - desiredWidth - minMargin;
      }

      // Ensure it doesn't go off the left edge
      if (left < minMargin) {
        left = minMargin;
      }

      // If card is too narrow, center it
      if (cardRect.width < desiredWidth + 16) {
        left = cardRect.left + (cardRect.width - desiredWidth) / 2;
      }

      // Final boundary check to ensure it doesn't go off screen
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

    return createPortal(
      (
        <div
          ref={assetDropdownContentRef}
          className="bg-white dark:bg-[#1D1D23] border border-gray-300 dark:border-[#35353E] rounded-2xl shadow-xl z-[9999] max-h-[70vh] sm:max-h-[60vh] overflow-hidden"
          style={dropdownStyle}
        >
          {/* Dropdown Title */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-600">
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
          <div className="p-2 border-b border-gray-200 dark:border-gray-600">
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
            <div className="flex items-center gap-2 px-2 py-2 border-b border-gray-200 dark:border-gray-600 overflow-x-auto">
              <button
                onClick={() => setAssetFilterTab("all")}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-2xl whitespace-nowrap transition-colors ${
                  assetFilterTab === "all"
                    ? "bg-[#1D8751] text-white"
                    : "bg-[#35353E] text-gray-300 hover:bg-[#40404A]"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setAssetFilterTab("new")}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-2xl whitespace-nowrap transition-colors ${
                  assetFilterTab === "new"
                    ? "bg-[#1D8751] text-white"
                    : "bg-[#35353E] text-gray-300 hover:bg-[#40404A]"
                }`}
              >
                New
              </button>
              <button
                onClick={() => setAssetFilterTab("gainers")}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-2xl whitespace-nowrap transition-colors ${
                  assetFilterTab === "gainers"
                    ? "bg-[#1D8751] text-white"
                    : "bg-[#35353E] text-gray-300 hover:bg-[#40404A]"
                }`}
              >
                Gainers
              </button>
              <button
                onClick={() => setAssetFilterTab("losers")}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-2xl whitespace-nowrap transition-colors ${
                  assetFilterTab === "losers"
                    ? "bg-[#1D8751] text-white"
                    : "bg-[#35353E] text-gray-300 hover:bg-[#40404A]"
                }`}
              >
                Losers
              </button>
            </div>
          )}

          <div className="max-h-[60vh] sm:max-h-[50vh] overflow-y-auto p-1">
            {sortedSwapAssets.length > 0 ? (
              <>
                {!assetSearchTerm && sortedSwapAssets.length > 3 && (
                  <>
                    <div className="px-3 sm:px-4 py-2 bg-[#F5F6F7] dark:bg-[#23232B] border-b border-gray-200 dark:border-gray-600">
                      <span className="text-xs font-semibold text-[#788099] uppercase tracking-wider">
                        Popular Currencies
                      </span>
                    </div>
                    {sortedSwapAssets
                      .slice(0, 3)
                      .map((asset: SupportedAsset, index: number) => {
                        const handleAssetClick = () => {
                          if (calculationTimeout) {
                            clearTimeout(calculationTimeout);
                          }
                          if (estimateTimeout) {
                            clearTimeout(estimateTimeout);
                          }

                          setEstimate(null);
                          setEstimateError(null);
                          setEstimateLoading(false);
                          setCalculationError(null);
                          setReceiveAmountError(null);
                          setApiValidationError(null);
                          setApiValidationError(null);

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

                        return (
                          <div
                            key={`popular-${asset.asset_id}-${asset.ticker}-${asset.network}-${index}`}
                            className="flex items-center gap-4 p-4 sm:p-5 text-black dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-200 dark:border-gray-600 transition-colors duration-150"
                            onClick={handleAssetClick}
                          >
                            <img
                              src={
                                asset?.image_url ||
                                asset?.asset_image ||
                                (asset as any)?.image ||
                                "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                              }
                              alt={
                                asset?.name ||
                                asset?.ticker ||
                                asset?.symbol ||
                                "Asset"
                              }
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                              }}
                            />
                            <div className="flex-1">
                              <div className="text-[#1F2937] dark:text-[#ffffff] font-medium text-base flex items-center gap-2">
                                {(asset.ticker ||
                                  asset.symbol ||
                                  asset.name ||
                                  "Unknown"
                                ).toUpperCase()}
                                <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-normal px-2 py-0.5 rounded-full">
                                  {getNetworkDisplayName(asset.network)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
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
                              <div className="w-2 h-2 bg-[#1D8751] rounded-full"></div>
                            )}
                          </div>
                        );
                      })}

                    <div className="border-t-2 border-gray-200 dark:border-gray-600"></div>
                  </>
                )}

                {(assetSearchTerm
                  ? sortedSwapAssets
                  : sortedSwapAssets.slice(3)
                ).map((asset: SupportedAsset, index: number) => (
                  <div
                    key={`${asset.asset_id}-${asset.ticker}-${asset.network}-${index}`}
                    className="flex items-center gap-4 p-4 sm:p-5 text-black dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0 transition-colors duration-150"
                    onClick={() => {
                      if (calculationTimeout) {
                        clearTimeout(calculationTimeout);
                      }
                      if (estimateTimeout) {
                        clearTimeout(estimateTimeout);
                      }

                      setEstimate(null);
                      setEstimateError(null);
                      setEstimateLoading(false);
                      setCalculationError(null);
                      setReceiveAmountError(null);
                      setApiValidationError(null);
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
                    }}
                  >
                    <img
                      src={
                        asset?.image_url ||
                        asset?.asset_image ||
                        (asset as any)?.image ||
                        "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                      }
                      alt={
                        asset?.name || asset?.ticker || asset?.symbol || "Asset"
                      }
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                      }}
                    />
                    <div className="flex-1">
                      <div className="text-[#1F2937] dark:text-[#ffffff] font-medium text-base flex items-center gap-2">
                        {(asset.ticker ||
                          asset.symbol ||
                          asset.name ||
                          "Unknown"
                        ).toUpperCase()}
                        <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-normal px-2 py-0.5 rounded-full">
                          {getNetworkDisplayName(asset.network)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
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
                      <div className="w-2 h-2 bg-[#1D8751] rounded-full"></div>
                    )}
                  </div>
                ))}
              </>
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

  // Use flat $2 fee for direct assets (USDT on BSC, USDC on BSC), percentage for other assets
  let commissionAmount = 0;
  if (selectedAsset && isSimpleCalculationAsset(selectedAsset)) {
    // For direct assets, only apply $2 fee if amount is $2 or more
    commissionAmount = payAmount >= 2 ? 2 : 0; // Flat $2 fee for direct assets (only if amount >= $2)
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

    // For simple calculations, do them immediately without any delays
    if (fromPay && selectedAsset && isSimpleCalculationAsset(selectedAsset)) {
      // Immediate calculation for direct assets (USDT on BSC, USDC on BSC) - simply subtract 2
      let calculatedGetAmount;
      if (fromAmount < 2) {
        calculatedGetAmount = fromAmount;
      } else {
        calculatedGetAmount = Math.max(0, fromAmount - 2); // Simply subtract 2 for direct assets
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

    // For FXP (forex), use manual calculation with fixed rate
    if (fromPay && selectedAsset && isForexAsset(selectedAsset)) {
      // For withdrawal: FXP to USD (multiply by 1.1)
      const calculatedGetAmount = fromAmount * FXP_TO_USD_RATE;

      setGetAmount(calculatedGetAmount);
      setGetAmountInput(calculatedGetAmount.toFixed(2));
      setPreviousValidAmount(calculatedGetAmount.toFixed(2));

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

      // No loading states for FXP - instant result
      setIsCalculating(false);
      setIsCalculatingReceive(false);
      return;
    }

    // For FXP reverse calculation (user types USD, get FXP amount)
    if (!fromPay && selectedAsset && isForexAsset(selectedAsset)) {
      // For reverse: USD to FXP (divide by 1.1)
      const calculatedPayAmount = fromAmount / FXP_TO_USD_RATE;

      setPayAmount(calculatedPayAmount);
      setPayAmountInput(calculatedPayAmount.toFixed(2));

      // No loading states for FXP - instant result
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
              calculatedGetAmount = Math.max(0, fromAmount - 2); // Simply subtract 2 for direct assets
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
              // For non-direct assets, only show loading until API estimate is available
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
              newPayAmount = fromAmount + 2; // Simply add 2 for direct assets
            }
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

  // Clear validation errors on component unmount
  useEffect(() => {
    return () => {
      setApiValidationError(null);
      setReceiveAmountError(null);
      setEstimateError(null);
      setCalculationError(null);
    };
  }, []);

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
        // Create withdrawal payload for express API
        const withdrawalPayload: ExpressWithdrawalPayload = {
          asset:
            selectedAsset.ticker?.toUpperCase() ||
            selectedAsset.symbol?.toUpperCase(),
          amount: payAmount.toString(),
          network:
            selectedNetwork?.network_id ||
            selectedNetwork?.network_type ||
            selectedAsset.network,
          // For FXP, use user_payment_detail_id; for others, use id
          user_payment_detail_id: isForexAsset(selectedAsset)
            ? selectedPaymentDetails[0].user_payment_detail_id
            : String(selectedPaymentDetails[0].id),
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
        let errorMessage = "Failed to submit withdrawal request";

        if (error.response?.data) {
          const responseData = error.response.data;
          if (responseData.message) {
            errorMessage = responseData.message;
          } else if (responseData.error) {
            errorMessage = responseData.error;
          } else if (responseData.details) {
            errorMessage = responseData.details;
          } else if (typeof responseData === "string") {
            errorMessage = responseData;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

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
    if (payAmount > 15000 || getAmount > 15000) {
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
        // Handle withdrawal submission
        const withdrawalPayload: ExpressWithdrawalPayload = {
          asset:
            selectedAsset.ticker?.toUpperCase() ||
            selectedAsset.symbol?.toUpperCase(),
          amount: payAmount.toString(),
          network:
            selectedNetwork?.network_id ||
            selectedNetwork?.network_type ||
            selectedAsset.network,
          // For FXP, use user_payment_detail_id; for others, use id
          user_payment_detail_id: isForexAsset(selectedAsset)
            ? selectedPaymentDetails[0].user_payment_detail_id
            : String(selectedPaymentDetails[0].id),
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
        depositPayload.append("asset", selectedAsset.asset_id);
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
      let errorMessage = `Failed to submit ${mode} request`;

      if (error.response?.data) {
        // Try to extract specific error message from response
        const responseData = error.response.data;
        if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        } else if (responseData.details) {
          errorMessage = responseData.details;
        } else if (typeof responseData === "string") {
          errorMessage = responseData;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

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

          {/* API Validation Error - Show as simple red text */}
          {apiValidationError && (
            <div className="mb-4 text-red-500 text-sm font-medium">
              {apiValidationError}
            </div>
          )}

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
                    You Send
                    {isCalculatingFromPay &&
                      (isCalculating || isCalculatingReceive) && (
                        <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
                      )}
                  </label>
                  <div className={`text-xs mb-1 ${isDark ? "text-[#788099]" : "text-[#64748B]"
                    }`}>
                    Amount
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={payAmountInput}
                      onChange={(e) => {
                        const inputValue = e.target.value;

                        // Allow any numeric input including negative numbers and 0
                        if (inputValue === "" || /^-?\d*\.?\d*$/.test(inputValue)) {
                          // Check for decimal places validation
                          if (inputValue.includes(".")) {
                            const decimalPart = inputValue.split(".")[1];
                            if (decimalPart && decimalPart.length > 8) {
                              setApiValidationError("Number cannot have more than 8 decimal places.");
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

                            // Only calculate if we have a valid amount and asset
                            if (selectedAsset && newValue >= 0) {
                              // Check asset type first and handle accordingly
                              if (isSimpleCalculationAsset(selectedAsset)) {
                                // For direct assets (USDT on BSC, USDC on BSC), calculate immediately
                                calculateAmounts(newValue, true);
                              } else if (isForexAsset(selectedAsset)) {
                                // For FXP, calculate immediately without API
                                calculateAmounts(newValue, true);
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
                            ? "border-white/10 text-white font-normal"
                            : "border-gray-200 text-[#111827] font-bold"
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

                {/* You Get Section */}
                <div className="flex-1 min-w-0">
                  <div className={`text-xs mb-1 mt-[30px] ${isDark ? "text-[#788099]" : "text-[#64748B]"
                    }`}>
                    Asset
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
                            <img
                              src={
                                selectedAsset?.image_url ||
                                selectedAsset?.asset_image ||
                                (selectedAsset as any)?.image ||
                                "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                              }
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
                                e.currentTarget.src =
                                  "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
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
                              src="https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                              alt="asset icon"
                              className="w-6 h-6"
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
                    src="https://res.cloudinary.com/pitz/image/upload/v1756579504/Frame_36261_1_d9cnq1.png"
                    alt="swap icon"
                    className="w-10 h-10 dark:hidden"
                  />
                  {/* Dark mode image */}
                  <img
                    src="https://res.cloudinary.com/pitz/image/upload/v1755500509/Frame_36261_ledmyw.png"
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
                    You Receive
                    {!isCalculatingFromPay &&
                      (isCalculating || isCalculatingReceive) && (
                        <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
                      )}
                  </label>
                  <div className={`text-xs mb-1 ${isDark ? "text-[#788099]" : "text-[#64748B]"
                    }`}>
                    Amount
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
                          // Check for decimal places validation
                          if (value.includes(".")) {
                            const decimalPart = value.split(".")[1];
                            if (decimalPart && decimalPart.length > 8) {
                              setApiValidationError("Number cannot have more than 8 decimal places.");
                              return;
                            }
                          }

                          const newAmount = parseFloat(value) || 0;

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
                                // For direct assets (USDT on BSC, USDC on BSC), calculate immediately
                                const commissionRate = selectedAsset
                                  ?.range_commissions?.[0]?.commission
                                  ? parseFloat(
                                    selectedAsset.range_commissions[0].commission
                                  )
                                  : 2;
                                const commissionAmount =
                                  (newAmount * commissionRate) / 100;
                                const calculatedPayAmount =
                                  newAmount + commissionAmount;
                                setPayAmount(calculatedPayAmount);
                                setPayAmountInput(calculatedPayAmount.toString());

                                // Simple assets don't need loading states - calculation is instant
                                setIsCalculating(false);
                                setIsCalculatingReceive(false);
                              } else if (isForexAsset(selectedAsset)) {
                                // For FXP, calculate immediately without API (reverse: USD to FXP)
                                const calculatedPayAmount = newAmount / FXP_TO_USD_RATE;
                                setPayAmount(calculatedPayAmount);
                                setPayAmountInput(calculatedPayAmount.toFixed(2));

                                // FXP doesn't need loading states - calculation is instant
                                setIsCalculating(false);
                                setIsCalculatingReceive(false);
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
                              ? "border-white/10 text-white font-normal"
                              : "border-gray-200 text-[#111827] font-extrabold"
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
                  {apiValidationError && (
                    <p className="text-sm mt-1 text-yellow-500">
                      {apiValidationError}
                    </p>
                  )}
                </div>

                {/* Payment Method Section */}
                <div className="flex-1 min-w-0 relative z-0">
                  <div className={`text-xs mb-1 mt-[30px] ${isDark ? "text-[#788099]" : "text-[#64748B]"
                    }`}>
                    Payment Method
                  </div>
                  <div className="relative z-0">
                    {(() => {
                      // Use public payment methods if available (they have logos)
                      let paymentMethodOptions: Array<{ value: string; label: string; logo?: string }> = [];

                      if (Array.isArray(publicPaymentMethods?.data?.providers) && publicPaymentMethods.data.providers.length > 0) {
                        // Use public payment methods with logos
                        paymentMethodOptions = publicPaymentMethods.data.providers.map((provider: any) => {
                          const providerName = provider.provider_name || provider.payment_provider_name || "Unknown";
                          const methodName = provider.method?.method_name || provider.method?.method_display || provider.method_name || null;
                          const subtitle = methodName ? `${providerName} - ${methodName}` : null;

                          return {
                            value: providerName,
                            label: providerName,
                            subtitle: subtitle || undefined,
                            logo: provider.logo || provider.provider_logo || undefined,
                          };
                        }).filter((opt: any) => opt.value && opt.value.trim());
                      } else {
                        // Fallback to admin wallet list
                        const providerNames = Array.from(
                          new Set(
                            (adminWalletListDisplay.displayData || []).map(
                              (wallet: any) => wallet?.admin_payment_detail?.provider_name
                            )
                          )
                        ).filter((type) => Boolean(type && type.trim())) as string[];

                        paymentMethodOptions = providerNames.map((paymentType: string) => {
                          const adminDetail = adminWalletListDisplay.displayData?.find(
                            (wallet: any) =>
                              wallet.admin_payment_detail?.provider_name === paymentType
                          )?.admin_payment_detail;

                          const providerName = adminDetail?.provider_name || paymentType;
                          const methodName = adminDetail?.payment_method_type || adminDetail?.payment_method_name || null;
                          const subtitle = methodName ? `${providerName} - ${methodName}` : null;

                          return {
                            value: paymentType,
                            label: providerName,
                            subtitle: subtitle || undefined,
                            logo: adminDetail?.provider_logo || undefined,
                          };
                        });
                      }

                      // Use fallback if no options available
                      if (paymentMethodOptions.length === 0) {
                        paymentMethodOptions = fallbackProviderNames.map((name: string) => ({
                          value: name,
                          label: name,
                        }));
                      }

                      const isLoading = publicMethodsLoading || adminWalletListDisplay.isLoading;

                      return (
                        <CustomSelect
                          options={paymentMethodOptions}
                          value={payBank}
                          className={`w-full ${paymentMethodError ? "border-red-500 dark:border-red-500" : ""
                            }`}
                          triggerClassName={`px-4 py-2 text-lg border rounded-2xl bg-transparent ${isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200"
                            }`}
                          placeholderClassName="text-white dark:text-white"
                          onChange={(value) => {
                            // Find the selected provider from public payment methods or admin wallet list
                            let selectedWallet = null;
                            let selectedProvider = null;

                            // First try to find in public payment methods
                            if (Array.isArray(publicPaymentMethods?.data?.providers)) {
                              selectedProvider = publicPaymentMethods.data.providers.find(
                                (provider: any) =>
                                  (provider.provider_name || provider.payment_provider_name) === value
                              );
                            }

                            // If not found in public methods, try admin wallet list
                            if (!selectedProvider) {
                              selectedWallet = adminWalletListDisplay.displayData?.find(
                                (wallet: any) =>
                                  wallet.admin_payment_detail?.provider_name === value
                              );
                            }

                            // Keep the full value for dropdown matching, but store provider data for filtering
                            setPayBank(value); // Keep full value for dropdown to work
                            setSelectedProviderData(selectedProvider); // Store full provider data for comparison
                            setSelectedPaymentDetail(
                              selectedWallet?.admin_payment_detail || selectedProvider || null
                            );

                            setSelectedPaymentDetails([]);
                            setPaymentMethodError(null);
                          }}
                          placeholder={
                            isLoading
                              ? "Loading payment methods..."
                              : "Payment Method"
                          }
                          disabled={isLoading}
                          loading={isLoading}
                          loadingText="Loading payment methods..."
                          emptyText="No payment methods available"
                          searchable={true}
                          dropdownTitle="Select a payment methods"
                          dropdownOffsetY={-68}
                          dropdownOffsetX={20}
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
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await dispatch(fetchUserPaymentDetails(true)).unwrap();
                                      showToast.success("Payment details refreshed!");
                                    } catch (error) {
                                      showToast.error("Failed to refresh payment details");
                                    }
                                  }}
                                  className="text-xs text-[#1D8751] hover:text-[#166b3e] underline"
                                >
                                  Refresh
                                </button>
                              </div>
                              <div className="w-full min-w-0 relative z-[100] isolate">
                                <CustomSelect
                                  options={(enhancedFilteredUserPaymentDetails || []).map(
                                    (detail: UserPaymentDetail) => {
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

                                      return {
                                        value: detail.id.toString(),
                                        label: displayLabel,
                                        logo: providerLogo || undefined,
                                        // Add full information for tooltip on hover
                                        title: fullInfo,
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
                                  dropdownTitle="Select a registered account from"
                                  className={`w-full min-w-0 ${paymentMethodError
                                    ? "border-red-500 dark:border-red-500"
                                    : ""
                                    }`}
                                  triggerClassName={`px-4 py-2 text-lg border rounded-2xl w-full min-w-0 bg-transparent ${isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200"
                                    }`}
                                  largeDropdownItems={true}
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
                                className="hover:underline cursor-pointer font-medium"
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
                Commission: {selectedAsset && isSimpleCalculationAsset(selectedAsset) ? `$2 flat fee (direct assets)` : `${selectedAsset?.range_commissions?.[0]?.commission || 2}% of $${payAmount}`} = $
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
                  src="https://res.cloudinary.com/pitz/image/upload/v1765784047/alert-circle_1_ujybne.png"
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
                  className={`w-full text-[#35353e] dark:text-[#788099] text-base font-medium py-1.5 rounded-full flex items-center justify-center gap-2 transition-colors ${isHomePage
                    ? payAmount >= 15000 || getAmount >= 15000
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-[#1D8751] hover:bg-[#1D8751]/80 cursor-pointer"
                    : isSubmitting ||
                      isTransactionSubmitted ||
                      isInfoModalOpen ||
                      payAmount >= 15000 ||
                      getAmount >= 15000
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
                      ? payAmount >= 15000 || getAmount >= 15000
                      : isSubmitting ||
                      isTransactionSubmitted ||
                      isInfoModalOpen ||
                      payAmount >= 15000 ||
                      getAmount >= 15000
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
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-base font-medium text-white">Express</span>
                      <img
                        className="h-5 w-auto mt-3"
                        src="https://res.cloudinary.com/pitz/image/upload/v1752244135/Group_5_gkxzdz.png"
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
              <div className="dark:bg-[#1D1D23] border-2 border-[#35353e] rounded-2xl p-3 sm:p-5 shadow-lg w-full text-[#35353e] dark:text-[#788099]">
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

                {/* Terms and Conditions Summary */}
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center mb-2">
                    <span className="mr-2 text-[#1D8751]">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
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
                    <span className="text-base font-semibold text-[#7e7e8f] dark:text-[#788099]">
                      Terms and Conditions Summary
                    </span>
                  </div>
                  <div className=" dark:bg-[#1D1D23] border border-[#1D8751] rounded-xl p-4">
                    <ul className="list-none space-y-2">
                      <li className="flex items-start">
                        <span className="w-2 h-2 mt-1.5 rounded-full bg-[#1D8751] dark:bg-[#1D8751] flex-shrink-0 mr-3"></span>
                        <span className="text-[#35353e] dark:text-[#788099] text-sm">
                          Please send the money from your own account Only
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 mt-1.5 rounded-full bg-[#1D8751] dark:bg-[#1D8751] flex-shrink-0 mr-3"></span>
                        <span className="text-[#35353e] dark:text-[#788099] text-sm">
                          Put transaction ID in the description field of the bank
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 mt-1.5 rounded-full bg-[#1D8751] dark:bg-[#1D8751] flex-shrink-0 mr-3"></span>
                        <span className="text-[#35353e] dark:text-[#788099] text-sm">
                          Please note, If you do not follow above conditions, we
                          will reject your transaction and send you back your money.
                        </span>
                      </li>
                    </ul>
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
                    />
                    <span className="text-[#35353e] dark:text-[#788099] text-sm">
                      I've read and agree to the{" "}
                      <Link href="/legal/terms-of-service" target="_blank" className="text-[#1D8751] cursor-pointer hover:underline">
                        Terms of Use
                      </Link>
                      ,{" "}
                      <Link href="/legal/privacy-policy" target="_blank" className="text-[#1D8751] cursor-pointer hover:underline">
                        Privacy Policy
                      </Link>
                      ,{" "}
                      <Link href="/legal/payment-policy" target="_blank" className="text-[#1D8751] cursor-pointer hover:underline">
                        Payment Policies
                      </Link>
                      ,{" "}
                      <Link href="/legal/aml-policy" target="_blank" className="text-[#1D8751] cursor-pointer hover:underline">
                        AML
                      </Link>
                      ,{" "}
                      <Link href="/legal/risk-disclosure-statement" target="_blank" className="text-[#1D8751] cursor-pointer hover:underline">
                        Risk Disclosure Statements
                      </Link>
                    </span>
                  </label>
                </div>
              </div>
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
                    // Navigate to exchanging page with websocket URL
                    if (onExchange) {
                      const transactionData = {
                        type: "withdrawal" as const,
                        amount: payAmount,
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
                  disabled={isSubmitting || isInfoModalOpen || getAmount > 15000}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#A2A4A9FF] dark:border-[#35353E]"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center">

                      <img
                        className="mt-2"
                        src="https://res.cloudinary.com/pitz/image/upload/v1752244135/Group_5_gkxzdz.png"
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
                  dispatch(fetchUserPaymentDetails(true)).unwrap(),
                  dispatch(fetchAdminWalletList(true)).unwrap(),
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
              // When modal closes, reset amount to maximum allowed (15000)
              if (payAmount > 15000) {
                setPayAmount(15000);
                setPayAmountInput("15000");
              }
              if (getAmount > 15000) {
                setGetAmount(15000);
                setGetAmountInput("15000");
              }
              setIsInfoModalOpen(false);
            }}
            onContactUs={() => {
              // Handle contact us action - you can customize this
              window.open("https://wa.me/your-whatsapp-number", "_blank");
              // When modal closes, reset amount to maximum allowed (15000)
              if (payAmount > 15000) {
                setPayAmount(15000);
                setPayAmountInput("15000");
              }
              if (getAmount > 15000) {
                setGetAmount(15000);
                setGetAmountInput("15000");
              }
              setIsInfoModalOpen(false);
            }}
          />
        </>
      )}
    </div>
  );
}
