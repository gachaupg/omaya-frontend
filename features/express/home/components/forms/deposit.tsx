"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { FaExclamationCircle } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../../../store";
import {
  fetchPublicPaymentMethods,
  fetchAdminPaymentMethods,
} from "../../../../p2p/slices/paymentMethodsSlice";
import {
  fetchAssets,
  createDeposit,
  updateDepositAddress,
} from "../../../../exchange/slices/exchangeSlice";
import {
  fetchSupportedAssets,
  fetchSwapEstimate,
} from "../../../../swap/slices/swapSlice";

import { showToast } from "../../../../../lib/utils/toast";
import { DepositResponse } from "../../../../exchange/types";
import { SupportedAsset } from "../../../../swap/types";
import { FaSearch } from "react-icons/fa";
import InfoModal from "./info";
import { useTheme } from "@/context/theme";
import {
  useAssetsDisplay,
  usePaymentMethodsDisplay,
} from "../../../hooks/useDataDisplay";
import { useChangeNowAssets } from "../../hooks/useChangeNowAssets";
import CustomSelect from "@/components/ui/HomeCommonSelect";
import Select from "@/features/p2p/components/Common/Select";
import {
  buildExpressRedirectPath,
  setAuthRedirectPath,
  setExpressPrefillState,
} from "@/lib/utils/authRedirect";
import { useValidateAddress } from "@/hooks/useValidateAddress";
import { openKYCModal, checkKYCStatus } from "@/features/auth/slices/authSlice";
import { useBookmarkedAddresses } from "@/features/express/hooks/useBookmarkedAddresses";
import { BookmarkDropdown } from "@/features/express/components/forms/BookmarkDropdown";
import { bookmarkedAddressesApi } from "@/features/express/services/bookmarkedAddressesApi";
import { fetchCommission, getCommissionApiAsset } from "@/features/express/api";

interface DepositFormProps {
  onExchange?: (transactionData: {
    type: "deposit";
    amount: number;
    asset: any;
    paymentDetail: any;
    walletAddress: string;
    network: any;
    // Additional fields for complex assets (optional)
    transactionId?: string;
    depositCode?: string;
    websocket_url?: string;
    expectedAmount?: string;
    netAmount?: string;
    changenowId?: string;
    finalDepositAddress?: string;
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
    payment?: any;
    payBank?: string;
    walletAddress?: string;
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
const getNetworkMatchKeys = (network: string): string[] => {
  const n = (network || "").toLowerCase();
  return NETWORK_ALIASES[n] ? [...NETWORK_ALIASES[n], n] : [n];
};

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

// Helper function to get network value from asset (handles both Asset and SupportedAsset types)
const getAssetNetwork = (asset: any): string => {
  // For SupportedAsset (swap assets) - has network property
  if (asset.network) {
    return asset.network;
  }

  // For Asset (exchange assets) - has networks array
  if (asset.networks && asset.networks.length > 0) {
    return asset.networks[0].network_type || asset.networks[0].network_id || '';
  }

  return '';
};

const networkSuffixesToStrip = [
  'BSC',
  'Binance Smart Chain',
  'ETH',
  'Ethereum',
  'MATIC',
  'Polygon',
  'AVAX',
  'Avalanche',
  'TRX',
  'Tron',
  'Solana',
  'SOL',
  'Base',
];

const stripNetworkSuffix = (value: string): string => {
  if (typeof value !== 'string') {
    return value;
  }

  const pattern = new RegExp(
    `\\s*\\((?:${networkSuffixesToStrip
      .map((suffix) => suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')})\\)`,
    'gi'
  );

  return value.replace(pattern, '').trim();
};

const getCleanAssetName = (asset: any): string => {
  const rawName =
    (typeof asset?.name === 'string' && asset?.name) ||
    (typeof asset?.ticker === 'string' && asset?.ticker) ||
    (typeof asset?.symbol === 'string' && asset?.symbol) ||
    '';

  if (!rawName) {
    return 'Unknown Asset';
  }

  return stripNetworkSuffix(rawName);
};

const getAssetPrimaryLabel = (asset: any): string => {
  const raw =
    (typeof asset?.ticker === 'string' && asset?.ticker?.trim()) ||
    (typeof asset?.symbol === 'string' && asset?.symbol?.trim());

  if (raw) {
    const cleaned = stripNetworkSuffix(raw);
    return cleaned || raw;
  }

  return getCleanAssetName(asset);
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getPaymentMethodNameToStrip = (payment: any): string | null => {
  if (typeof payment?.method_display === "string" && payment.method_display.trim()) {
    return payment.method_display.trim();
  }
  if (typeof payment?.method_name === "string" && payment.method_name.trim()) {
    return payment.method_name.trim();
  }
  if (
    typeof payment?.payment_method_name === "string" &&
    payment.payment_method_name.trim()
  ) {
    return payment.payment_method_name.trim();
  }
  if (
    typeof payment?.payment_method_type === "string" &&
    payment.payment_method_type.trim()
  ) {
    return payment.payment_method_type.trim();
  }
  return null;
};

const formatPaymentProviderLabel = (payment: any): string => {
  const providerName =
    (typeof payment?.provider_name === "string" && payment.provider_name.trim()) ||
    (typeof payment?.payment_provider_name === "string" &&
      payment.payment_provider_name.trim()) ||
    "";

  if (!providerName) {
    return "Payment Provider";
  }

  const methodToStrip = getPaymentMethodNameToStrip(payment);

  if (!methodToStrip) {
    return providerName;
  }

  try {
    const suffixPattern = new RegExp(
      `\\s*-\\s*${escapeRegex(methodToStrip)}\\s*$`,
      "i"
    );
    const cleaned = providerName.replace(suffixPattern, "").trim();
    return cleaned || providerName;
  } catch (error) {
    console.warn("Failed to format provider label", {
      providerName,
      methodToStrip,
      error,
    });
    return providerName;
  }
};

// Helper to resolve admin_payment_detail_id from payment object (API may use id or nest in payment_details - e.g. FXPRIMUS)
const getAdminPaymentDetailId = (payment: any): string | null => {
  if (!payment) return null;
  const p = payment as any;
  const firstDetail = (p.payment_details?.[0] ?? p.admin_payment_details?.[0]) || null;
  const id =
    p.admin_payment_detail_id ??
    p.id ??
    firstDetail?.admin_payment_detail_id ??
    firstDetail?.id ??
    null;
  return id != null ? String(id) : null;
};

export default function DepositForm({
  onExchange,
  mode,
  onModeChange,
  isHomePage = false,
}: DepositFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const {
    adminMethods,
    loading: adminMethodsLoading,
    error: adminMethodsError,
    publicPaymentMethods,
    publicMethodsLoading,
    publicMethodsError,
  } = useSelector((state: any) => state.paymentMethods);
  const { assets, loading: assetsLoading } = useSelector(
    (state: any) => state.exchange
  );

  // Add swap assets state
  const { supportedAssets: swapAssets, loading: swapAssetsLoading } =
    useSelector((state: any) => state.swap);
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
  const swapAssetsErrorState = isHomePage ? null : null;
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

  // Use state to hold payment methods - will trigger re-render when updated
  const [stablePaymentMethods, setStablePaymentMethods] = useState<any[]>([]);

  // Use appropriate payment methods data based on isHomePage
  const paymentMethodsData = isHomePage ? publicPaymentMethods : adminMethods;
  const paymentMethodsLoading = isHomePage ? publicMethodsLoading : adminMethodsLoading;
  const paymentMethodsError = isHomePage ? publicMethodsError : adminMethodsError;

  const paymentMethodsDisplay = usePaymentMethodsDisplay(
    paymentMethodsData,
    paymentMethodsLoading,
    paymentMethodsError
  );

  // Update payment methods state ONLY when payment data changes (not when asset changes)
  useEffect(() => {
    console.log("🔍 DepositForm Payment Methods Debug:", {
      isHomePage,
      paymentMethodsData,
      publicPaymentMethods,
      adminMethods,
      hasProviders: !!publicPaymentMethods?.data?.providers,
      providersLength: publicPaymentMethods?.data?.providers?.length || 0,
      paymentMethodsDataLength: Array.isArray(paymentMethodsData) ? paymentMethodsData.length : 0
    });

    // Check if we have payment methods data
    const hasPaymentData = isHomePage
      ? (publicPaymentMethods?.data?.providers && Array.isArray(publicPaymentMethods.data.providers) && publicPaymentMethods.data.providers.length > 0)
      : (paymentMethodsData && Array.isArray(paymentMethodsData) && paymentMethodsData.length > 0);

    if (hasPaymentData) {
      let activeMethods;

      if (isHomePage) {
        // For public payment methods, handle the new API structure
        let flattenedMethods: any[] = [];

        // Check for new structure: data.providers (direct providers array)
        if (Array.isArray(publicPaymentMethods?.data?.providers)) {
          const providers = publicPaymentMethods.data.providers;
          console.log("🔍 Processing providers from API:", {
            providersCount: providers.length,
            firstProvider: providers[0] ? {
              provider_name: providers[0].provider_name,
              logo: providers[0].logo,
              method: providers[0].method
            } : null
          });

          // Flatten providers directly (new structure)
          flattenedMethods = providers.map((provider: any) => {
            // Get the first payment detail for easy access
            const firstPaymentDetail = provider.payment_details && provider.payment_details.length > 0
              ? provider.payment_details[0]
              : {};

            const flattened = {
              provider_name: provider.provider_name,
              payment_method: provider.method?.method_name || provider.method?.method_display || '',
              payment_method_type: provider.method?.method_name || provider.method?.method_display || '',
              provider_logo: provider.logo,
              logo: provider.logo, // Also add as 'logo' for backward compatibility
              is_active: true, // All public methods are considered active
              payment_details: provider.payment_details || [],
              // Flatten first payment detail for easy access
              account_name: firstPaymentDetail.account_name || '',
              account_number: firstPaymentDetail.account_number || firstPaymentDetail.mobile_number || '',
              mobile_number: firstPaymentDetail.mobile_number || null,
              wallet_address: firstPaymentDetail.wallet_address || null,
              how_to_send: firstPaymentDetail.how_to_send || null,
              account_type: firstPaymentDetail.account_type || null,
              provider_id: provider.provider_id,
            };

            console.log("🔍 Flattened provider:", {
              provider_name: flattened.provider_name,
              provider_logo: flattened.provider_logo,
              logo: flattened.logo,
              hasLogo: !!(flattened.provider_logo || flattened.logo)
            });

            return flattened;
          });
        } else {
          // Fallback to old structure: data.payment_methods -> providers
          const methods = publicPaymentMethods?.data?.payment_methods || publicPaymentMethods || [];
          console.log("🔍 Public payment methods structure:", {
            publicPaymentMethods,
            methods,
            methodsLength: Array.isArray(methods) ? methods.length : 0
          });

          // Flatten the nested structure: payment_methods -> providers
          if (Array.isArray(methods)) {
            methods.forEach((method: any) => {
              if (method.providers && Array.isArray(method.providers) && method.providers.length > 0) {
                method.providers.forEach((provider: any) => {
                  // Get the first payment detail for easy access
                  const firstPaymentDetail = provider.payment_details && provider.payment_details.length > 0
                    ? provider.payment_details[0]
                    : {};

                  flattenedMethods.push({
                    provider_name: provider.provider_name,
                    payment_method: method.method_name,
                    payment_method_type: method.method_name,
                    provider_logo: provider.logo,
                    logo: provider.logo, // Also add as 'logo' for backward compatibility
                    is_active: true, // All public methods are considered active
                    payment_details: provider.payment_details || [],
                    // Flatten first payment detail for easy access
                    account_name: firstPaymentDetail.account_name || '',
                    account_number: firstPaymentDetail.account_number || firstPaymentDetail.mobile_number || '',
                    mobile_number: firstPaymentDetail.mobile_number || null,
                    wallet_address: firstPaymentDetail.wallet_address || null,
                    how_to_send: firstPaymentDetail.how_to_send || null,
                    account_type: firstPaymentDetail.account_type || null,
                    provider_id: provider.provider_id,
                  });
                });
              }
            });
          }
        }

        console.log("🔍 Flattened payment methods:", {
          flattenedMethods,
          flattenedLength: flattenedMethods.length,
          // Log first provider for debugging
          firstProvider: flattenedMethods.length > 0 ? {
            provider_name: flattenedMethods[0].provider_name,
            provider_logo: flattenedMethods[0].provider_logo,
            logo: flattenedMethods[0].logo,
            payment_method: flattenedMethods[0].payment_method,
          } : null
        });

        activeMethods = flattenedMethods;
      } else {
        // For admin payment methods, use the existing logic
        console.log("🔍 Processing admin payment methods:", {
          paymentMethodsData,
          paymentMethodsDataLength: Array.isArray(paymentMethodsData) ? paymentMethodsData.length : 0,
          firstPayment: Array.isArray(paymentMethodsData) && paymentMethodsData.length > 0 ? {
            provider_name: paymentMethodsData[0].provider_name,
            provider_logo: paymentMethodsData[0].provider_logo,
            logo: paymentMethodsData[0].logo,
            admin_payment_detail_id: paymentMethodsData[0].admin_payment_detail_id
          } : null
        });

        activeMethods = paymentMethodsData.filter((payment: any) => {
          if (payment.is_active === undefined || payment.is_active === null) return true;
          return payment.is_active === true || payment.is_active === 'true' || payment.is_active === 1 || payment.is_active === '1';
        }).map((payment: any) => {
          // Ensure admin payment methods have logo field properly set
          return {
            ...payment,
            // Ensure logo field is available (admin payment methods might have provider_logo)
            logo: payment.logo || payment.provider_logo || undefined,
            provider_logo: payment.provider_logo || payment.logo || undefined,
          };
        });
      }

      console.log("🔍 Active methods after filtering:", {
        activeMethods,
        activeMethodsLength: activeMethods.length
      });

      if (activeMethods.length > 0) {
        console.log("🔍 Setting stable payment methods:", {
          count: activeMethods.length,
          firstMethod: activeMethods[0] ? {
            provider_name: activeMethods[0].provider_name,
            provider_logo: activeMethods[0].provider_logo,
            logo: activeMethods[0].logo
          } : null
        });
        setStablePaymentMethods(activeMethods);
      } else {
        console.log("🔍 No active methods found after filtering");
      }
    } else {
      console.log("🔍 No payment methods data available", {
        isHomePage,
        hasPublicPaymentMethods: !!publicPaymentMethods,
        hasPaymentMethodsData: !!paymentMethodsData,
        publicPaymentMethodsStructure: publicPaymentMethods
      });
    }
  }, [paymentMethodsData, isHomePage, publicPaymentMethods]); // Update when payment data changes

  // Use stable state - React will properly render this
  const effectivePaymentMethods = stablePaymentMethods;

  // Fallback payment methods if no data is available
  const fallbackPaymentMethods = [
    {
      provider_name: "Bank",
      payment_method: "Bank Transfer",
      payment_method_type: "Bank Transfer",
      is_active: true,
    },
    {
      provider_name: "Crypto",
      payment_method: "Cryptocurrency",
      payment_method_type: "Cryptocurrency",
      is_active: true,
    },
    {
      provider_name: "Forex",
      payment_method: "Forex",
      payment_method_type: "Forex",
      is_active: true,
    },
    {
      provider_name: "Mobile",
      payment_method: "Mobile Money",
      payment_method_type: "Mobile Money",
      is_active: true,
    },
    {
      provider_name: "Marchant",
      payment_method: "Marchant",
      payment_method_type: "Marchant",
      is_active: true,
    },
  ];

  // Use fallback if no effective payment methods
  const finalPaymentMethods = effectivePaymentMethods.length > 0 ? effectivePaymentMethods : fallbackPaymentMethods;

  console.log("🔍 Effective Payment Methods:", {
    isHomePage,
    effectivePaymentMethods,
    effectivePaymentMethodsLength: effectivePaymentMethods.length,
    finalPaymentMethods,
    finalPaymentMethodsLength: finalPaymentMethods.length,
    stablePaymentMethodsLength: stablePaymentMethods.length,
    // Log first method details if available
    firstMethod: finalPaymentMethods.length > 0 ? {
      provider_name: finalPaymentMethods[0].provider_name,
      provider_logo: finalPaymentMethods[0].provider_logo,
      logo: finalPaymentMethods[0].logo,
      hasLogo: !!(finalPaymentMethods[0].provider_logo || finalPaymentMethods[0].logo)
    } : null
  });

  const [payAmount, setPayAmount] = useState(100); // Set default amount to $100
  const [payAmountInput, setPayAmountInput] = useState("100"); // String value for input display
  const [payBank, setPayBank] = useState("");
  const [getAmount, setGetAmount] = useState(98); // Default amount after 2% commission (100 - 2 = 98)
  const [getAmountInput, setGetAmountInput] = useState("98"); // String value for input display
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const [isCalculatingFromPay, setIsCalculatingFromPay] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const bookmarkAnchorRef = useRef<HTMLSpanElement>(null);
  const [apiCommission, setApiCommission] = useState<number | null>(null);
  const commissionFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);


  // Add transaction code state
  const [transactionCode, setTransactionCode] = useState<string>("");
  const paymentDetailsRef = useRef<HTMLDivElement>(null);
  const assetListRef = useRef<HTMLDivElement>(null);

  // Asset selection state for search functionality
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [assetSearchTerm, setAssetSearchTerm] = useState("");
  const [assetFilterTab, setAssetFilterTab] = useState<"all" | "new" | "gainers" | "losers">("all");
  const [whitelistBookmarks, setWhitelistBookmarks] = useState<Array<{ asset: string; network: string }>>([]);
  const assetDropdownRef = useRef<HTMLDivElement>(null);
  const assetDropdownContentRef = useRef<HTMLDivElement | null>(null);
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
    if (!assetDropdownRef.current) return;
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
    if (!isAssetDropdownOpen) return;
    updateAssetDropdownPosition();
    const handleReposition = () => updateAssetDropdownPosition();
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

  // First card submission state
  const [isFirstCardSubmitted, setIsFirstCardSubmitted] = useState(false);

  // Add loading state for "You Receive" calculation
  const [isCalculatingReceive, setIsCalculatingReceive] = useState(false);

  // Add calculation stability state
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationTimeout, setCalculationTimeout] = useState<NodeJS.Timeout | null>(null);
  const [calculationComplete, setCalculationComplete] = useState(false);
  const [estimateTimeout, setEstimateTimeout] = useState<NodeJS.Timeout | null>(null);

  // Add state to store API response
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isUserModifiedAmount, setIsUserModifiedAmount] = useState(false);

  // Add InfoModal state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Terms & Conditions expansion
  const [expandedTerms, setExpandedTerms] = useState(false);


  // Add validation state for minimum receive amount
  const [receiveAmountError, setReceiveAmountError] = useState<string | null>(null);

  // Add state for API validation errors
  const [apiValidationError, setApiValidationError] = useState<string | null>(null);


  // Auto-select the first payment method on home page so the button behaves like the dashboard form
  useEffect(() => {
    if (finalPaymentMethods.length === 0) {
      return;
    }

    const hasSelected = finalPaymentMethods.some(
      (method: any) => method?.provider_name === payBank
    );

    if (!payBank || !hasSelected) {
      const defaultMethod = finalPaymentMethods[0];
      setPayBank(defaultMethod.provider_name);
      setSelectedPaymentDetail(defaultMethod);
    } else if (!selectedPaymentDetail) {
      const matchedMethod = finalPaymentMethods.find(
        (method: any) => method?.provider_name === payBank
      );
      if (matchedMethod) {
        setSelectedPaymentDetail(matchedMethod);
      }
    }
  }, [finalPaymentMethods, payBank, selectedPaymentDetail]);

  // Handle asset selection with inline calculation
  const handleAssetSelection = (asset: any) => {
    // Set asset immediately
    setSelectedAsset(asset);
    const networkValue = getAssetNetwork(asset);
    setSelectedNetwork({
      network_id: networkValue,
      network_type: networkValue,
    });

    // For complex assets, trigger inline calculation
    if (!isSimpleCalculationAsset(asset) && !isForexAsset(asset) && payAmount > 0) {
      // Set loading states for inline calculation
      setIsCalculating(true);
      setIsCalculatingReceive(true);

      // Trigger the existing calculation logic
      calculateAmounts(payAmount, true);
    }
  };

  // Get currency from selectedAsset for validation
  const getCurrencyFromAsset = useCallback((asset: any): string | undefined => {
    if (!asset) return undefined;

    // Try different properties in order of preference
    if (asset.ticker) {
      return asset.ticker.toUpperCase();
    } else if (asset.symbol) {
      // Handle special case for USDT Tether
      return asset.symbol === "USDT Tether" ? "USDT" : asset.symbol.toUpperCase();
    } else if (asset.name) {
      return asset.name.toUpperCase();
    }

    return undefined;
  }, []);

  const currentCurrency = getCurrencyFromAsset(selectedAsset);

  // Get network from selectedNetwork or selectedAsset
  const getCurrentNetwork = useCallback((): string | undefined => {
    if (selectedNetwork) {
      return selectedNetwork.network_type || selectedNetwork.network_id || selectedNetwork.network || undefined;
    }
    if (selectedAsset) {
      return getAssetNetwork(selectedAsset);
    }
    return undefined;
  }, [selectedNetwork, selectedAsset]);

  const currentNetwork = getCurrentNetwork();

  const {
    bookmarks,
    loading: bookmarksLoading,
    saving: bookmarkSaving,
    fetchBookmarks,
    saveBookmark,
  } = useBookmarkedAddresses(currentCurrency, currentNetwork || undefined);

  // Address validation hook
  const {
    result: addressValidationResult,
    isValidating: isAddressValidating,
    error: addressValidationError,
    validate: validateAddress,
    reset: resetAddressValidation,
  } = useValidateAddress({
    currency: currentCurrency,
    network: currentNetwork,
    debounceMs: 500,
    minLength: 10,
    validateEmpty: false,
  });

  // Update wallet error based on validation result
  useEffect(() => {
    if (walletAddress.trim() === "") {
      setWalletError(null);
      setIsAddressConfirmed(false);
      return;
    }

    if (!currentCurrency) {
      setWalletError("Please select an asset first");
      setIsAddressConfirmed(false);
      return;
    }

    if (isAddressValidating) {
      // Don't show error while validating
      return;
    }

    if (addressValidationResult) {
      if (!addressValidationResult.isValid) {
        setWalletError(
          addressValidationResult.message ||
          addressValidationResult.error ||
          "Invalid address"
        );
        setIsAddressConfirmed(false);
      } else {
        setWalletError(null);
        setIsAddressConfirmed(true);
      }
    } else if (addressValidationError) {
      setWalletError(addressValidationError);
      setIsAddressConfirmed(false);
    }
  }, [
    addressValidationResult,
    addressValidationError,
    isAddressValidating,
    walletAddress,
    currentCurrency,
  ]);

  // Reset validation when asset or network changes
  useEffect(() => {
    if (walletAddress.trim() && selectedAsset) {
      validateAddress(walletAddress, currentCurrency, currentNetwork);
    } else {
      resetAddressValidation();
      setWalletError(null);
      setIsAddressConfirmed(false);
    }
  }, [selectedAsset, currentCurrency, currentNetwork, validateAddress, resetAddressValidation]);

  // Forex-specific state
  const [forexAccountNumber, setForexAccountNumber] = useState<string>("");
  const [userNotes, setUserNotes] = useState<string>("");
  const [showForexForm, setShowForexForm] = useState<boolean>(false);

  useEffect(() => {
    if (isHomePage) {
      return;
    }

    dispatch(fetchAdminPaymentMethods());
  }, [dispatch, isHomePage]);

  // When user changes asset or payment method, reset post state so they can post again
  const selectedAssetKey = selectedAsset
    ? (selectedAsset.asset_id ?? selectedAsset.ticker ?? selectedAsset.symbol ?? selectedAsset.name ?? "")
    : "";
  useEffect(() => {
    setIsFirstCardSubmitted(false);
    setApiResponse(null);
    setTransactionCode("");
    setShowForexForm(false);
  }, [selectedAssetKey, payBank]);

  // Fetch public payment methods for home page
  useEffect(() => {
    if (!isHomePage) {
      return;
    }

    console.log("Fetching public payment methods for home page");
    dispatch(fetchPublicPaymentMethods())
      .unwrap()
      .then((result) => {
        console.log("Public payment methods fetched successfully:", result);
      })
      .catch((error: unknown) => {
        console.error("Failed to fetch public payment methods:", error);
      });
  }, [dispatch, isHomePage]);

  useEffect(() => {
    // Skip API calls on home page - buttons will redirect to login
    if (isHomePage) {
      return;
    }

    // First try to get from cache, then force refresh if no data
    dispatch(fetchAssets(false))
      .unwrap()
      .then((data) => {


        // If no assets in cache, force refresh
        if (!data?.assets || data.assets.length === 0) {
          return dispatch(fetchAssets(true)).unwrap();
        }
        return data;
      })
      .catch((error: unknown) => {
        // If cache fetch fails, try force refresh
        return dispatch(fetchAssets(true))
          .unwrap()
          .catch((refreshError: unknown) => {
            showToast.error(`Failed to fetch assets: ${refreshError}`);
            throw refreshError;
          });
      });
  }, [dispatch]);

  // Fetch swap assets
  useEffect(() => {
    // Skip API calls on home page - buttons will redirect to login
    if (isHomePage) {
      return;
    }

    dispatch(fetchSupportedAssets(false))
      .unwrap()
      .then((data) => {
        // If no assets in cache, force refresh
        if (!data || data.length === 0) {
          return dispatch(fetchSupportedAssets(true)).unwrap();
        }
        return data;
      })
      .catch((error: unknown) => {
        // If cache fetch fails, try force refresh
        return dispatch(fetchSupportedAssets(true))
          .unwrap()
          .catch((refreshError: unknown) => {

            // Only show error if it's a network issue, not cache issues
            if (refreshError instanceof Error) {
              if (refreshError.message.includes("Network Error") || refreshError.message.includes("Network connection issue")) {
                showToast.warning("Network Issue", "Unable to fetch assets due to network problems. Using fallback data.");
              } else if (refreshError.message.includes("Server Error")) {
                showToast.error("Server Error", "Unable to fetch assets from server. Please try again later.");
              } else if (!refreshError.message.includes("Cache")) {
                // Only show error if it's not a cache-related issue
                showToast.error("Asset Loading Error", `Failed to fetch swap assets: ${refreshError.message}`);
              }
            }

            // Set fallback assets so the form can still work
            const fallbackAssets = [
              {
                ticker: "USDT",
                symbol: "USDT",
                name: "Tether USD",
                network: "BSC",
                range_commissions: [{ commission: "2" }],
                commission: "2",
                fee_rate: "2"
              }
            ];

            // Update the Redux store with fallback assets
            dispatch({
              type: "swap/fetchSupportedAssets/fulfilled",
              payload: fallbackAssets
            });

            throw refreshError;
          });
      });
  }, [dispatch]);

  // Auto-select first asset when assets are loaded
  useEffect(() => {
    if (assetsDisplay.shouldShowData && assetsDisplay.displayData.length > 0 && !selectedAsset) {
      // Use the sorted assets to get the first one (USDT on BSC first, USDC on BSC second)
      const sortedAssets = [...assetsDisplay.displayData].sort((a, b) => {
        const tickerA = (a?.ticker || a?.symbol || a?.name || "").toString().toLowerCase();
        const tickerB = (b?.ticker || b?.symbol || b?.name || "").toString().toLowerCase();
        const networkA = (a?.network || "").toString().toLowerCase();
        const networkB = (b?.network || "").toString().toLowerCase();

        // Priority 1: USDT on BSC
        if (tickerA === "usdt" && networkA === "bsc" && !(tickerB === "usdt" && networkB === "bsc")) {
          return -1;
        }
        if (tickerB === "usdt" && networkB === "bsc" && !(tickerA === "usdt" && networkA === "bsc")) {
          return 1;
        }

        // Priority 2: USDC on BSC
        if (tickerA === "usdc" && networkA === "bsc" && !(tickerB === "usdc" && networkB === "bsc")) {
          return -1;
        }
        if (tickerB === "usdc" && networkB === "bsc" && !(tickerA === "usdc" && networkA === "bsc")) {
          return 1;
        }

        return 0;
      });

      const firstAsset = sortedAssets[0];
      setSelectedAsset(firstAsset);
      const networkValue = getAssetNetwork(firstAsset);
      setSelectedNetwork({
        network_id: networkValue,
        network_type: networkValue,
      });
    }
  }, [assetsDisplay.displayData, selectedAsset]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        assetDropdownRef.current &&
        !assetDropdownRef.current.contains(target) &&
        (!assetDropdownContentRef.current ||
          !assetDropdownContentRef.current.contains(target))
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

  // Check if asset is FXP (forex)
  const isForexAsset = (asset: any) => {
    if (!asset) return false;
    const ticker = (asset?.ticker || asset?.symbol || "").toLowerCase();
    return ticker === "fxp";
  };

  // FXP uses manual calculation with fixed 1.06 rate
  const FXP_EXCHANGE_RATE = 1.06;

  const isCommissionApiAsset = (asset: any) => !!getCommissionApiAsset(asset?.ticker || asset?.symbol || "");

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
      fetchCommission(apiAsset, amount, "deposit")
        .then((c) => setApiCommission(c))
        .catch(() => setApiCommission(null));
    }, 300);
    return () => {
      if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
    };
  }, [selectedAsset, payAmountInput, getAmountInput, payAmount, getAmount, isCalculatingFromPay]);

  // Recalculate receive amount when apiCommission arrives (was null during initial calculation)
  useEffect(() => {
    if (selectedAsset && isCommissionApiAsset(selectedAsset) && apiCommission !== null) {
      if (isCalculatingFromPay && payAmount > 0) {
        // Forward: You Send -> You Receive
        const commissionAmount = (payAmount * apiCommission) / 100;
        const calculatedGetAmount = Math.max(0, payAmount - commissionAmount);
        setGetAmount(calculatedGetAmount);
        setGetAmountInput(calculatedGetAmount.toString());
      } else if (!isCalculatingFromPay && getAmount > 0) {
        // Reverse: You Receive -> You Send
        const commissionRate = apiCommission;
        const calculatedPayAmount = getAmount / (1 - commissionRate / 100);
        setPayAmount(calculatedPayAmount);
        setPayAmountInput(calculatedPayAmount.toString());
      }
    }
  }, [apiCommission, payAmount, getAmount, isCalculatingFromPay, selectedAsset]);

  // Fetch estimate for non-direct assets - debounced to avoid rapid API calls
  useEffect(() => {

    if (
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset) &&
      !isForexAsset(selectedAsset) && // Skip FXP - uses manual calculation
      payAmount &&
      payAmount > 0 &&
      isCalculatingFromPay
    ) {
      setEstimateLoading(true);
      setEstimateError(null);

      // Debounce API call by 800ms to avoid rapid requests while user is typing
      const debounceTimer = setTimeout(() => {
        // Add timeout to prevent hanging API calls
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timeout")), 12000); // 12 second timeout (10s API + 2s buffer)
        });

        Promise.race([
          dispatch(
            fetchSwapEstimate({
              fromCurrency: "USDT",
              fromNetwork: "BSC",
              toCurrency: selectedAsset.ticker,
              toNetwork: getAssetNetwork(selectedAsset),
              amount: payAmount,
              usePublicApi: !!isHomePage,
            })
          ),
          timeoutPromise
        ])
          .then((result: any) => {
            if (result.payload && (result.payload as any)?.estimated_amount) {
              setEstimate(result.payload);

              // Update UI immediately instead of waiting for another useEffect
              const estimatedAmount = (result.payload as any).estimated_amount;
              if (estimatedAmount > 0) {
                setGetAmount(estimatedAmount);
                setGetAmountInput(estimatedAmount.toString());
                setReceiveAmountError(null);
                setApiValidationError(null); // Clear API validation errors on success
              }
            }

            // Clear loading states after successful calculation
            setIsCalculating(false);
            setIsCalculatingReceive(false);
          })
          .catch((error) => {
            console.error("Failed to fetch swap estimate:", error);
            console.log("API Error caught:", error);

            // IMMEDIATELY clear all loading states to prevent stuck loading
            setIsCalculating(false);
            setIsCalculatingReceive(false);
            setEstimateLoading(false);

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

            console.log("Error parsing:", { errorMessage, errorDetails, hasResponseData: !!error?.response_data });

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
            } else if (error.message?.includes("Network Error") || error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
              setEstimateError(null);
            } else if (error.message?.includes("Server Error")) {
              setEstimateError(null);
            } else {
              setEstimateError(null);
            }

            // Common fallback calculation for network/timeout errors only
            const commissionRate = selectedAsset?.range_commissions?.[0]?.commission
              ? parseFloat(selectedAsset.range_commissions[0].commission)
              : 2;
            const commissionAmount = (payAmount * commissionRate) / 100;
            const calculatedGetAmount = payAmount - commissionAmount;
            setGetAmount(calculatedGetAmount);
            setGetAmountInput(calculatedGetAmount.toString());

            // Clear loading states after fallback calculation
            setIsCalculating(false);
            setIsCalculatingReceive(false);
          })
          .finally(() => {
            setEstimateLoading(false);
          });
      }, 800); // 800ms debounce

      // Cleanup function to clear debounce timer on unmount or dependency change
      return () => clearTimeout(debounceTimer);
    } else {
      // Clear estimate for USDT or when conditions not met
      setEstimate(null);
      setEstimateError(null);
    }
  }, [selectedAsset, payAmount, isCalculatingFromPay]);

  // Fetch reverse estimate for non-direct assets when calculating from receive amount - debounced
  useEffect(() => {
    if (
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset) &&
      !isForexAsset(selectedAsset) && // Skip FXP - uses manual calculation
      getAmount &&
      getAmount > 0 &&
      !isCalculatingFromPay
    ) {
      setEstimateLoading(true);
      setEstimateError(null);

      // Debounce API call by 800ms to avoid rapid requests while user is typing
      const debounceTimer = setTimeout(() => {
        // Add timeout to prevent hanging API calls
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timeout")), 12000); // 12 second timeout (10s API + 2s buffer)
        });

        Promise.race([
          dispatch(
            fetchSwapEstimate({
              fromCurrency: selectedAsset.ticker, // FROM selected asset
              fromNetwork: getAssetNetwork(selectedAsset),
              toCurrency: "USDT", // TO USDT
              toNetwork: "BSC",
              amount: getAmount, // Use receive amount directly
              usePublicApi: !!isHomePage,
            })
          ),
          timeoutPromise
        ])
          .then((result: any) => {
            if (result.payload && (result.payload as any)?.estimated_amount) {
              const requiredUsdtAmount = (result.payload as any)?.estimated_amount;

              if (requiredUsdtAmount && requiredUsdtAmount > 0) {
                // Update UI immediately
                setPayAmount(requiredUsdtAmount);
                setPayAmountInput(requiredUsdtAmount.toString());
                setEstimate(result.payload);
                setApiValidationError(null); // Clear API validation errors on success
              }
            }

            // Clear loading states immediately after successful calculation
            setIsCalculating(false);
            setIsCalculatingReceive(false);
          })
          .catch((error) => {

            // Check for specific API validation errors - handle different error structures
            let errorMessage = "";
            let errorDetails = "";

            // Handle different error response structures
            if (error?.response_data?.error) {
              errorMessage = error.response_data.error;
              errorDetails = error.response_data.message || "";
            } else if (error?.error) {
              errorMessage = error.error;
              errorDetails = error.message || "";
            } else if (error?.message) {
              errorMessage = error.message;
            }

            // Handle the specific structure you provided
            if (error?.response_data && !errorMessage) {
              errorMessage = error.response_data.error || "";
              errorDetails = error.response_data.message || "";
            }

            console.log("API Error Debug (reverse):", { error, errorMessage, errorDetails });

            // Handle deposit_too_small error
            if (errorMessage.includes("deposit_too_small") || errorDetails.includes("Out of min amount")) {
              setApiValidationError("Amount entered is too small. Please enter a larger amount.");
              setEstimateError(null);
              setPayAmount(0);
              setPayAmountInput("0");
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              return;
            }

            // Handle other specific validation errors
            if (errorMessage.includes("deposit_too_large") || errorDetails.includes("Out of max amount")) {
              setApiValidationError("Amount entered is too large. Please enter a smaller amount.");
              setEstimateError(null);
              setPayAmount(0);
              setPayAmountInput("0");
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              return;
            }

            // Clear API validation errors for network/timeout issues
            setApiValidationError(null);

            // Handle timeout - just clear error and allow retry
            if (error.message?.includes("Request timeout")) {
              setEstimateError(null);
            } else if (error.message?.includes("Network Error") || error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
              setEstimateError(null);
            } else if (error.message?.includes("Server Error")) {
              setEstimateError(null);
            } else {
              setEstimateError(null);
            }

            // Common fallback calculation for network/timeout errors only
            let commissionRate = 2; // Default fallback
            if (selectedAsset?.range_commissions && selectedAsset.range_commissions.length > 0) {
              const firstCommission = selectedAsset.range_commissions[0];
              if (firstCommission?.commission) {
                commissionRate = parseFloat(firstCommission.commission);
              }
            } else if (selectedAsset?.commission) {
              commissionRate = parseFloat(selectedAsset.commission);
            } else if (selectedAsset?.fee_rate) {
              commissionRate = parseFloat(selectedAsset.fee_rate);
            }

            const fallbackPayAmount = getAmount / (1 - commissionRate / 100);
            setPayAmount(fallbackPayAmount);
            setPayAmountInput(fallbackPayAmount.toString());

            // Clear loading states after fallback calculation
            setIsCalculating(false);
            setIsCalculatingReceive(false);
          })
          .finally(() => {
            setEstimateLoading(false);
          });
      }, 800); // 800ms debounce

      // Cleanup function to clear debounce timer on unmount or dependency change
      return () => clearTimeout(debounceTimer);
    }
  }, [selectedAsset, getAmount, isCalculatingFromPay]);

  // Safety timeout to clear loading states if they get stuck
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (isCalculating || isCalculatingReceive || estimateLoading) {
        setIsCalculating(false);
        setIsCalculatingReceive(false);
        setEstimateLoading(false);
        console.log("Safety timeout: Cleared all loading states");
      }
    }, 10000); // 10 second safety timeout (reduced from 15s)

    return () => clearTimeout(safetyTimeout);
  }, [isCalculating, isCalculatingReceive, estimateLoading]);

  // Clear validation errors when amount is cleared or form is reset
  useEffect(() => {
    if (!payAmount || payAmount === 0 || payAmountInput === "" || payAmountInput === "0") {
      setApiValidationError(null);
      setReceiveAmountError(null);
      setEstimateError(null);
    }
  }, [payAmount, payAmountInput]);

  // Clear validation errors on component unmount
  useEffect(() => {
    return () => {
      setApiValidationError(null);
      setReceiveAmountError(null);
      setEstimateError(null);
    };
  }, []);

  // Filter assets based on search term and filter tab - search by ticker and name
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
            return true;
          case "losers":
            // For now, show all assets (can be enhanced with price data)
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

  const whitelistKeys = useMemo(() => {
    const keys = new Set<string>();
    whitelistBookmarks.forEach((b) => {
      const assetKey = b.asset.toLowerCase();
      getNetworkMatchKeys(b.network).forEach((net) => keys.add(`${assetKey}|${net}`));
    });
    return keys;
  }, [whitelistBookmarks]);

  const whitelistAssets = useMemo(() => {
    if (whitelistKeys.size === 0) return [];
    const popularSlice = sortedSwapAssets.slice(0, 3);
    const popularSet = new Set(
      popularSlice.map((a) => `${(a?.ticker || a?.symbol || a?.name || "").toString().toLowerCase()}|${(a?.network || getAssetNetwork(a) || "").toString().toLowerCase()}`)
    );
    return sortedSwapAssets.filter((a) => {
      const key = `${(a?.ticker || a?.symbol || a?.name || "").toString().toLowerCase()}|${(a?.network || getAssetNetwork(a) || "").toString().toLowerCase()}`;
      return whitelistKeys.has(key) && !popularSet.has(key);
    });
  }, [sortedSwapAssets, whitelistKeys]);

  const whitelistKeySet = useMemo(
    () => new Set(whitelistAssets.map((a) => `${(a?.ticker || a?.symbol || a?.name || "").toString().toLowerCase()}|${(a?.network || getAssetNetwork(a) || "").toString().toLowerCase()}`)),
    [whitelistAssets]
  );

  const allAssetsList = useMemo(() => {
    if (assetSearchTerm) return sortedSwapAssets;
    if (sortedSwapAssets.length <= 3) return sortedSwapAssets;
    const excludePopular = sortedSwapAssets.slice(3);
    return excludePopular.filter((a) => {
      const key = `${(a?.ticker || a?.symbol || a?.name || "").toString().toLowerCase()}|${(a?.network || getAssetNetwork(a) || "").toString().toLowerCase()}`;
      return !whitelistKeySet.has(key);
    });
  }, [assetSearchTerm, sortedSwapAssets, whitelistKeySet]);

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

      // Check if this is "You Send" section (has data-select-card) or "You Receive" section
      const isYouSend = currentCard.hasAttribute('data-select-card');

      // Width: match only the asset selector element (right column), not the full card
      let desiredWidth = dropdownRect.width;

      // Position dropdown starting at the top of the card container
      let top = cardRect.top;

      // Left-align with the asset selector element's left edge
      let left = dropdownRect.left;

      // Ensure it doesn't go off screen on the right
      if (left + desiredWidth > viewportWidth - minMargin) {
        left = viewportWidth - desiredWidth - minMargin;
      }

      // Ensure it doesn't go off the left edge
      if (left < minMargin) {
        left = minMargin;
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
          className="bg-white dark:bg-[#1D1D23] border border-gray-300 dark:border-accent rounded-2xl shadow-xl z-9999 max-h-[70vh] sm:max-h-[60vh] overflow-hidden flex flex-col"
          style={dropdownStyle}
        >
          {/* Dropdown Title */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Currency To</h3>
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
          <div className="p-2 shrink-0">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7e7e8f] w-4 h-4" />
              <input
                type="text"
                placeholder="Type a currency"
                value={assetSearchTerm}
                onChange={(e) => setAssetSearchTerm(e.target.value)}
                className="w-full text-gray-900 dark:text-white dark:bg-gray-800 bg-gray-50 rounded-lg px-10 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
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
                  : "bg-[#E8EFF5] text-gray-700 hover:bg-[#D8E2EC] dark:bg-accent dark:text-gray-300 dark:hover:bg-[#40404A]"
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
                  : "bg-[#E8EFF5] text-gray-700 hover:bg-[#D8E2EC] dark:bg-accent dark:text-gray-300 dark:hover:bg-[#40404A]"
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
                  : "bg-[#E8EFF5] text-gray-700 hover:bg-[#D8E2EC] dark:bg-accent dark:text-gray-300 dark:hover:bg-[#40404A]"
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
                  : "bg-[#E8EFF5] text-gray-700 hover:bg-[#D8E2EC] dark:bg-accent dark:text-gray-300 dark:hover:bg-[#40404A]"
                  }`}
              >
                Losers
              </button>
            </div>
          )}

          {/* Asset List */}
          <div ref={assetListRef} className="overflow-y-auto p-1 flex-1 min-h-0">
            {sortedSwapAssets.length > 0 ? (
              <>
                {/* Popular Section - First 3 assets only if no search */}
                {!assetSearchTerm && sortedSwapAssets.length > 3 && (
                  <>
                    <div className="px-3 sm:px-4 py-2 bg-[#F5F6F7] dark:bg-[#23232B]">
                      <span className="text-xs font-semibold text-[#788099] uppercase tracking-wider">
                        Popular Currencies
                      </span>
                    </div>
                    {sortedSwapAssets
                      .slice(0, 3)
                      .map((asset: SupportedAsset, index: number) => (
                        <div
                          key={`popular-${asset.asset_id || "asset"}-${asset.symbol || asset.ticker || asset.name}-${asset.network || "unknown"}-${index}`}
                          className="flex items-center gap-4 p-4 sm:p-5 text-black dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors duration-150"
                          onClick={() => {
                            handleAssetSelection(asset);
                            setIsAssetDropdownOpen(false);
                            setAssetSearchTerm("");
                            if (isHomePage) setAssetFilterTab("all");
                          }}
                        >
                          <img
                            src={
                              asset?.image_url ||
                              asset?.asset_image ||
                              (asset as any)?.image ||
                              "/images/tether.svg"
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
                                "/images/tether.svg";
                            }}
                          />
                          <div className="flex-1">
                            <div
                              className={`font-medium text-base flex items-center gap-2 ${isDark ? "text-white" : "text-[#1F2937]"
                                }`}
                            >
                              {(asset.ticker || asset.symbol || asset.name || "Unknown").toUpperCase()}
                              <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-normal px-2 py-0.5 rounded-full">
                                {getNetworkDisplayName(getAssetNetwork(asset))}
                              </span>
                            </div>
                            <div
                              className={`text-sm text-gray-500 dark:text-gray-400`}
                            >
                              {(() => {
                                let displayName =
                                  asset.name || asset.ticker || asset.symbol || "Unknown Asset";

                                displayName = displayName
                                  .replace(/\s*\(Binance Smart Chain\)\s*\(BSC\)/gi, "")
                                  .replace(/\s*\(Ethereum\)\s*\(ETH\)/gi, "")
                                  .replace(/\s*\(Polygon\)\s*\(MATIC\)/gi, "")
                                  .replace(/\s*\(Avalanche\)\s*\(AVAX\)/gi, "")
                                  .replace(/\s*\(TRON\)\s*\(TRX\)/gi, "")
                                  .replace(/\s*\(Solana\)\s*\(SOL\)/gi, "")
                                  .replace(/\s*\(BSC\)$/gi, "")
                                  .replace(/\s*\(ETH\)$/gi, "")
                                  .replace(/\s*\(MATIC\)$/gi, "")
                                  .replace(/\s*\(AVAX\)$/gi, "")
                                  .replace(/\s*\(TRX\)$/gi, "")
                                  .replace(/\s*\(SOL\)$/gi, "")
                                  .trim();

                                return displayName;
                              })()}
                            </div>
                          </div>
                          {selectedAsset?.asset_id === asset.asset_id && (
                            <div className="w-2 h-2 bg-[#1D8751] rounded-full"></div>
                          )}
                        </div>
                      ))}

                    {whitelistAssets.length > 0 && (
                      <>
                        <div className="px-3 sm:px-4 py-2 bg-[#F5F6F7] dark:bg-[#23232B]">
                          <span className="text-xs font-semibold text-[#788099] uppercase tracking-wider">
                            Whitelist
                          </span>
                        </div>
                        {whitelistAssets.map((asset: SupportedAsset, index: number) => (
                          <div
                            key={`whitelist-${asset.asset_id || "asset"}-${asset.symbol || asset.ticker || asset.name}-${asset.network || "unknown"}-${index}`}
                            className="flex items-center gap-4 p-4 sm:p-5 text-black dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors duration-150"
                            onClick={() => {
                              handleAssetSelection(asset);
                              setIsAssetDropdownOpen(false);
                              setAssetSearchTerm("");
                              if (isHomePage) setAssetFilterTab("all");
                            }}
                          >
                            <img
                              src={asset?.image_url || asset?.asset_image || (asset as any)?.image || "/images/tether.svg"}
                              alt={asset?.name || asset?.ticker || asset?.symbol || "Asset"}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => { e.currentTarget.src = "/images/tether.svg"; }}
                            />
                            <div className="flex-1">
                              <div className={`font-medium text-base flex items-center gap-2 ${isDark ? "text-white" : "text-[#1F2937]"}`}>
                                {(asset.ticker || asset.symbol || asset.name || "Unknown").toUpperCase()}
                                <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-normal px-2 py-0.5 rounded-full">
                                  {getNetworkDisplayName(getAssetNetwork(asset))}
                                </span>
                              </div>
                              <div className={`text-sm text-gray-500 dark:text-gray-400`}>
                                {asset.name || asset.ticker || asset.symbol || "Unknown Asset"}
                              </div>
                            </div>
                            {selectedAsset?.asset_id === asset.asset_id && (
                              <div className="w-2 h-2 bg-[#1D8751] rounded-full"></div>
                            )}
                          </div>
                        ))}
                      </>
                    )}

                    <div className="border-t-2 border-gray-200 dark:border-gray-600"></div>
                  </>
                )}

                {(assetSearchTerm ? sortedSwapAssets : allAssetsList).map((asset: SupportedAsset, index: number) => (
                  <div
                    key={`${asset.asset_id || "asset"}-${asset.symbol || asset.ticker || asset.name}-${asset.network || "unknown"}-${index}`}
                    className="flex items-center gap-4 p-4 sm:p-5 text-black dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors duration-150"
                    onClick={() => {
                      handleAssetSelection(asset);
                      setIsAssetDropdownOpen(false);
                      setAssetSearchTerm("");
                      if (isHomePage) setAssetFilterTab("all");
                    }}
                  >
                    <img
                      src={
                        asset?.image_url ||
                        asset?.asset_image ||
                        (asset as any)?.image ||
                        "/images/tether.svg"
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
                          "/images/tether.svg";
                      }}
                    />
                    <div className="flex-1">
                      <div
                        className={`font-medium text-base flex items-center gap-2 ${isDark ? "text-white" : "text-[#1F2937]"
                          }`}
                      >
                        {(asset.ticker || asset.symbol || asset.name || "Unknown").toUpperCase()}
                        <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-normal px-2 py-0.5 rounded-full">
                          {getNetworkDisplayName(getAssetNetwork(asset))}
                        </span>
                      </div>
                      <div
                        className={`text-sm text-gray-500 dark:text-gray-400`}
                      >
                        {(() => {
                          let displayName =
                            asset.name || asset.ticker || asset.symbol || "Unknown Asset";

                          displayName = displayName
                            .replace(/\s*\(Binance Smart Chain\)\s*\(BSC\)/gi, "")
                            .replace(/\s*\(Ethereum\)\s*\(ETH\)/gi, "")
                            .replace(/\s*\(Polygon\)\s*\(MATIC\)/gi, "")
                            .replace(/\s*\(Avalanche\)\s*\(AVAX\)/gi, "")
                            .replace(/\s*\(TRON\)\s*\(TRX\)/gi, "")
                            .replace(/\s*\(Solana\)\s*\(SOL\)/gi, "")
                            .replace(/\s*\(BSC\)$/gi, "")
                            .replace(/\s*\(ETH\)$/gi, "")
                            .replace(/\s*\(MATIC\)$/gi, "")
                            .replace(/\s*\(AVAX\)$/gi, "")
                            .replace(/\s*\(TRX\)$/gi, "")
                            .replace(/\s*\(SOL\)$/gi, "")
                            .trim();

                          return displayName;
                        })()}
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

  // Calculate fees and amounts - Network fee is always 0
  const networkFee = 0;
  let commissionAmount: number;
  if (selectedAsset && isCommissionApiAsset(selectedAsset)) {
    const rate = apiCommission ?? 2; // Default 2% while API loads
    commissionAmount = (payAmount * rate) / 100;
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

    if (!selectedAsset) {
      setReceiveAmountError(null);
      setIsCalculating(false);
      setIsCalculatingReceive(false);
      return;
    }

    if (fromAmount <= 0) {
      setReceiveAmountError(null);
      setIsCalculating(false);
      setIsCalculatingReceive(false);
      return;
    }

    // Ensure we're not in an infinite loop
    if (isCalculating || isCalculatingReceive) {
      return;
    }

    // For direct assets (USDT on BSC, USDC on BSC), API commission is % e.g. {"commission":"2.00"} = 2%
    if (isSimpleCalculationAsset(selectedAsset)) {
      const commissionAmount = isCommissionApiAsset(selectedAsset)
        ? (fromAmount * (apiCommission ?? 2)) / 100
        : (fromAmount * (selectedAsset?.range_commissions?.[0]?.commission ? parseFloat(selectedAsset.range_commissions[0].commission) : 2)) / 100;

      if (fromPay) {
        const calculatedGetAmount = Math.max(0, fromAmount - commissionAmount);
        setGetAmount(calculatedGetAmount);
        setGetAmountInput(calculatedGetAmount.toString());
      } else {
        const commissionRate = isCommissionApiAsset(selectedAsset) ? (apiCommission ?? 2) : (selectedAsset?.range_commissions?.[0]?.commission ? parseFloat(selectedAsset.range_commissions[0].commission) : 2);
        const calculatedPayAmount = fromAmount / (1 - commissionRate / 100);
        setPayAmount(calculatedPayAmount);
        setPayAmountInput(calculatedPayAmount.toString());
      }

      setReceiveAmountError(null);

      // For direct assets, no loading states needed - calculation is instant
      return;
    }

    // For FXP (forex), use manual calculation with 1.06 rate
    if (isForexAsset(selectedAsset)) {
      if (fromPay) {
        // Forward calculation: USD to FXP (divide by 1.06)
        const calculatedGetAmount = fromAmount / FXP_EXCHANGE_RATE;
        setGetAmount(calculatedGetAmount);
        setGetAmountInput(calculatedGetAmount.toFixed(2));
      } else {
        // Reverse calculation: FXP to USD (multiply by 1.06)
        const calculatedPayAmount = fromAmount * FXP_EXCHANGE_RATE;
        setPayAmount(calculatedPayAmount);
        setPayAmountInput(calculatedPayAmount.toFixed(2));
      }

      setReceiveAmountError(null);

      // For FXP, no loading states needed - calculation is instant
      return;
    }

    // Set calculating state immediately for complex calculations
    setIsCalculating(true);
    setIsCalculatingReceive(true);

    // Debounce calculation to prevent rapid updates
    const timeout = setTimeout(() => {
      if (!selectedAsset) {
        setIsCalculating(false);
        setIsCalculatingReceive(false);
        setReceiveAmountError(null);
        return;
      }

      // Don't reset amounts to 0 - let user keep their input
      if (fromAmount <= 0) {
        setIsCalculating(false);
        setIsCalculatingReceive(false);
        setReceiveAmountError(null);
        return;
      }

      try {
        if (fromPay) {
          // Forward calculation: from pay amount to receive amount (API commission is % e.g. 2 = 2%)
          if (isSimpleCalculationAsset(selectedAsset)) {
            const commissionAmount = isCommissionApiAsset(selectedAsset)
              ? (fromAmount * (apiCommission ?? 2)) / 100
              : (fromAmount * (selectedAsset?.range_commissions?.[0]?.commission ? parseFloat(selectedAsset.range_commissions[0].commission) : 2)) / 100;
            const calculatedGetAmount = Math.max(0, fromAmount - commissionAmount);
            setGetAmount(calculatedGetAmount);
            setGetAmountInput(calculatedGetAmount.toString());
            setReceiveAmountError(null);
          } else {
            // For non-USDT assets, we need to fetch estimate
            // The estimate fetching is handled in the useEffect above
            if (estimate && (estimate.user_amount || estimate.estimated_amount)) {
              const amount = estimate.user_amount || estimate.estimated_amount;
              setGetAmount(amount);
              setGetAmountInput(amount.toString());
              setReceiveAmountError(null);
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
          // Reverse calculation: from receive amount to pay amount (API commission is % e.g. 2 = 2%)
          if (isSimpleCalculationAsset(selectedAsset)) {
            const commissionRate = isCommissionApiAsset(selectedAsset) ? (apiCommission ?? 2) : (selectedAsset?.range_commissions?.[0]?.commission ? parseFloat(selectedAsset.range_commissions[0].commission) : 2);
            const calculatedPayAmount = fromAmount / (1 - commissionRate / 100);
            setPayAmount(calculatedPayAmount);
            setPayAmountInput(calculatedPayAmount.toString());
            setReceiveAmountError(null);
          } else {
            // For non-USDT assets, we need to fetch estimate for reverse calculation
            // Use the API to find the pay amount that gives us the desired receive amount
            setEstimateLoading(true);
            setEstimateError(null);

            // For reverse calculation, we need to estimate from the receive amount
            // We'll use a trial-and-error approach or call the API with different amounts
            // For now, show loading state and calculate a rough estimate
            const commissionRate = selectedAsset?.range_commissions?.[0]?.commission ? parseFloat(selectedAsset.range_commissions[0].commission) : 2;
            const roughEstimate = fromAmount / (1 - commissionRate / 100);
            setPayAmount(roughEstimate);
            setPayAmountInput(roughEstimate.toString());

            // Set loading states
            setIsCalculating(true);
            setIsCalculatingReceive(true);
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
        }, 100);
      }
    }, 50); // Short debounce for better UX

    setCalculationTimeout(timeout);
  };



  // Recalculate when asset changes
  useEffect(() => {
    if (selectedAsset && payAmount > 0 && isCalculatingFromPay) {
      // Clear any existing estimate when asset changes
      setEstimate(null);
      setEstimateError(null);
      // Trigger calculation with new asset
      calculateAmounts(payAmount, true);
    }
  }, [selectedAsset]);

  // Forward calculations are now handled directly in the input handlers
  // This useEffect was causing duplicate calculations and loading state conflicts

  // This useEffect is now simplified - UI updates happen immediately in API response handlers
  // This just acts as a safety net to clear loading states if they get stuck
  useEffect(() => {
    if (estimate && !estimateLoading) {
      // Ensure loading states are cleared when we have an estimate
      setIsCalculating(false);
      setIsCalculatingReceive(false);
    }
  }, [estimate, estimateLoading]);

  // Reverse calculations are now handled directly in the input handlers
  // This useEffect was causing duplicate calculations and loading state conflicts

  // Re-validate wallet address when asset changes (allow all address types)
  useEffect(() => {
    if (walletAddress.trim() && selectedAsset) {
      // Allow all address types - no specific network validation
      if (walletAddress.trim().length < 10) {
        setWalletError("Address seems too short");
      } else {
        setWalletError(null);
      }
    } else if (!walletAddress.trim()) {
      // Clear error when wallet address is empty (optional field for initial submission)
      setWalletError(null);
    }
  }, [selectedAsset, walletAddress]);

  // Auto-validate receive amount whenever it changes
  useEffect(() => {
    // Remove minimum amount validation - any amount is allowed
    setReceiveAmountError(null);
  }, [getAmount]);

  // Validate first card data
  const validateFirstCard = () => {
    const errors: string[] = [];

    // Check if amount is entered
    if (!payAmountInput || payAmountInput.trim() === "") {
      errors.push("Please enter an amount");
      showToast.error("Please enter an amount");
    } else if (!payAmount || payAmount <= 0) {
      errors.push("Please enter a valid amount greater than 0");
      showToast.error("Please enter a valid amount greater than 0");
    }

    // Check if asset is selected
    if (!selectedAsset) {
      errors.push("Please select an asset");
      showToast.error("Please select an asset");
    }

    // Check if payment method is selected
    if (!selectedPaymentDetail || !payBank) {
      errors.push("Please select a payment method");
      showToast.error("Please select a payment method");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleFirstCardSubmit = async () => {
    if (validateFirstCard()) {
      setIsSubmitting(true);

      try {


        // Create FormData for API submission
        const depositPayload = new FormData();
        // Validate and append required fields
        if (!payAmount || payAmount <= 0) {
          throw new Error("Invalid amount");
        }
        depositPayload.append("requested_amount", payAmount.toString());

        // Use the selected payment method details
        if (!selectedPaymentDetail) {
          throw new Error("Please select a payment method");
        }

        if (!selectedPaymentDetail.provider_name) {
          throw new Error("Payment provider is missing");
        }
        depositPayload.append("payment_provider", selectedPaymentDetail.provider_name);

        if (!selectedPaymentDetail.payment_method_type) {
          throw new Error("Payment method is missing");
        }
        depositPayload.append("payment_method", selectedPaymentDetail.payment_method_type);
        // Handle currency field - try multiple properties to get the currency value
        let currencyValue = "";



        // Ensure selectedAsset exists
        if (!selectedAsset) {
          throw new Error("No asset selected");
        }

        // Try different properties in order of preference
        if (selectedAsset.ticker) {
          currencyValue = selectedAsset.ticker;
        } else if (selectedAsset.symbol) {
          // Handle special case for USDT Tether
          currencyValue = selectedAsset.symbol === "USDT Tether" ? "USDT" : selectedAsset.symbol;
        } else if (selectedAsset.name) {
          currencyValue = selectedAsset.name;
        }

        // Clean up the currency value (remove any extra spaces, etc.)
        currencyValue = currencyValue?.trim();

        // Fallback: if still no currency value, try to extract from any available property
        if (!currencyValue) {
          // Try to get any string value from the asset object
          const assetKeys = Object.keys(selectedAsset);
          for (const key of assetKeys) {
            const value = selectedAsset[key];
            if (typeof value === 'string' && value.trim()) {
              currencyValue = value.trim();
              break;
            }
          }
        }

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

        // Handle asset field - use the asset ticker/symbol/name from the selected asset
        let assetValue = "";

        // Try different properties in order of preference
        if (selectedAsset.ticker) {
          assetValue = selectedAsset.ticker;
        } else if (selectedAsset.symbol) {
          // Handle special case for USDT Tether
          assetValue = selectedAsset.symbol === "USDT Tether" ? "USDT" : selectedAsset.symbol;
        } else if (selectedAsset.name) {
          assetValue = selectedAsset.name;
        }

        // Clean up the asset value (remove any extra spaces, etc.)
        assetValue = assetValue?.trim();

        // Fallback: if still no asset value, try to extract from any available property
        if (!assetValue) {
          // Try to get any string value from the asset object
          const assetKeys = Object.keys(selectedAsset);
          for (const key of assetKeys) {
            const value = selectedAsset[key];
            if (typeof value === 'string' && value.trim()) {
              assetValue = value.trim();
              break;
            }
          }
        }

        if (!assetValue) {
          throw new Error("Asset information is missing");
        }
        depositPayload.append("asset", assetValue);
        // For direct crypto deposits, set minimal additional info
        depositPayload.append("additional_info", "Direct crypto deposit");

        // Submit to API - let axios set the correct Content-Type for FormData
        const depositResponse = (await dispatch(
          createDeposit({
            payload: depositPayload,
            config: {
              // Don't set Content-Type manually for FormData - let axios handle it
            },
          })
        ).unwrap()) as unknown as DepositResponse;



        // Store the API response and update transaction code
        setApiResponse(depositResponse);
        setTransactionCode(depositResponse.deposit_code || "");

        // Don't show success toast here - wait until the full process is complete

        setIsFirstCardSubmitted(true);
        // Scroll to the next section
        setTimeout(() => {
          if (paymentDetailsRef.current) {
            paymentDetailsRef.current.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 100);
      } catch (error: any) {

        let errorMessage = "Failed to submit deposit request";

        if (error.response?.data) {
          // Try to extract specific error message from response
          const responseData = error.response.data;
          if (responseData.message) {
            // Check for specific error message and show user-friendly message
            if (responseData.message.includes("Transaction not found or not eligible for address update")) {
              errorMessage = "Your address doesn't match the requested asset";
            } else {
              errorMessage = responseData.message;
            }
          } else if (responseData.error) {
            // Check for specific error in error field
            if (responseData.error.includes("Transaction not found or not eligible for address update")) {
              errorMessage = "Your address doesn't match the requested asset";
            } else {
              errorMessage = responseData.error;
            }
          } else if (responseData.details) {
            errorMessage = responseData.details;
          } else if (typeof responseData === "string") {
            // Check for specific error in string response
            if (responseData.includes("Transaction not found or not eligible for address update")) {
              errorMessage = "Your address doesn't match the requested asset";
            } else {
              errorMessage = responseData;
            }
          }
        } else if (error.message) {
          // Check for specific error in error.message
          if (error.message.includes("Transaction not found or not eligible for address update")) {
            errorMessage = "Your address doesn't match the requested asset";
          } else {
            errorMessage = error.message;
          }
        }

        // For address update failures, show more specific message
        if (errorMessage === "Failed to process request" || errorMessage === "Failed to submit deposit request") {
          errorMessage = "Your wallet address doesn't match the asset requested";
        }

        showToast.error(errorMessage);
        setValidationErrors([errorMessage]);
      } finally {
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

    if (!selectedPaymentDetail) {
      errors.push("Please select a payment method");
    }

    // Wallet address is optional for initial submission - only required for address update step
    if (walletAddress.trim() && walletError) {
      errors.push("Please enter a valid wallet address");
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

  // Handle proceeding to next step (with or without wallet address)
  /**
   * Handles the two-step deposit process:
   * 
   * For Simple Assets (USDT):
   * - Single API call flow
   * - Uses original response data
   * 
   * For Complex Assets (all others):
   * - Step 1: First API call returns basic info with status "pending_address"
   * - Step 2: After updating address, second response contains:
   *   * websocket_url (different from first response)
   *   * expected_amount, net_amount
   *   * changenow_id
   *   * deposit_address
   *   * status: "pending"
   * 
   * The second response should be used for the final transaction data.
   */
  const handleProceedToNext = async () => {
    if (!apiResponse?.transaction_id) {
      showToast.error("No transaction ID available");
      return;
    }

    // Validate wallet address is required for address update
    if (!walletAddress.trim()) {
      showToast.error("Wallet address is required to proceed");
      return;
    }

    if (walletError) {
      showToast.error("Please enter a valid wallet address");
      return;
    }

    // Check if this is a direct asset (USDT on BSC, USDC on BSC)
    const isSimpleAsset = selectedAsset && isSimpleCalculationAsset(selectedAsset);

    setIsSubmitting(true);

    try {
      let finalResponse = apiResponse;
      let updateResponse;

      // For direct assets (USDT on BSC, USDC on BSC), proceed as before
      if (isSimpleAsset) {
        // Only update deposit address if one is provided
        if (walletAddress.trim()) {
          updateResponse = await dispatch(
            updateDepositAddress({
              transactionId: apiResponse.transaction_id,
              depositAddress: walletAddress,
            })
          ).unwrap();
          showToast.success("Address updated successfully!");
        } else {
          // No wallet address provided - use a placeholder or skip update
          updateResponse = { status: "pending" };
          showToast.success("Proceeding without wallet address!");
        }
      } else {

        if (walletAddress.trim()) {
          updateResponse = await dispatch(
            updateDepositAddress({
              transactionId: apiResponse.transaction_id,
              depositAddress: walletAddress,
            })
          ).unwrap();

          if (updateResponse && typeof updateResponse === 'object') {
            // Try to extract additional fields if they exist
            const responseData = updateResponse as any;

            // According to user description, the second response should contain:
            // websocket_url, changenow_id, expected_amount, net_amount, deposit_address, status: "pending"
            if (responseData.websocket_url || responseData.expected_amount || responseData.net_amount || responseData.changenow_id) {
              // This response contains the additional fields we need
              finalResponse = {
                ...apiResponse,
                ...responseData,
                // Ensure we have the transaction_id and deposit_code
                transaction_id: responseData.transaction_id || apiResponse.transaction_id,
                deposit_code: responseData.deposit_code || apiResponse.deposit_code,
              };

              showToast.success("Address updated successfully! Transaction details updated.");
            } else {

              showToast.success("Address updated successfully!");
            }
          } else {
            showToast.success("Address updated successfully!");
          }
        } else {
          // No wallet address provided - this might not work for complex assets
          updateResponse = { status: "pending" };
          showToast.warning("Warning: Complex assets typically require a deposit address");
        }
      }

      // Prepare transaction data for the status page
      const transactionData = {
        type: "deposit" as const,
        amount: payAmount,
        receiveAmount: parseFloat(getAmountInput) || getAmount, // From "You Receive" input
        asset: {
          ...selectedAsset,
          icon: selectedAsset.image_url || selectedAsset.asset_image || selectedAsset.icon_url || selectedAsset.image
        },
        paymentDetail: selectedPaymentDetail || { provider_name: "direct", payment_method_type: "crypto" },
        walletAddress: walletAddress.trim() || "Not provided",
        network: selectedNetwork,
        transactionId: finalResponse.transaction_id,
        depositCode: finalResponse.deposit_code,
        status: updateResponse.status,
        websocket_url: finalResponse.websocket_url, // Use the appropriate websocket URL
        createdAt: Date.now(), // Store transaction creation timestamp for timer
        // Add additional fields from the final response for complex assets
        ...(finalResponse.expected_amount && { expectedAmount: finalResponse.expected_amount }),
        ...(finalResponse.net_amount && { netAmount: finalResponse.net_amount }),
        ...(finalResponse.changenow_id && { changenowId: finalResponse.changenow_id }),
        ...(finalResponse.deposit_address && { finalDepositAddress: finalResponse.deposit_address }),
      };

      // Navigate to the exchanging status page automatically
      if (onExchange) {
        onExchange(transactionData);
      } else {
        // Fallback navigation if onExchange is not provided
        router.push(`/dashboard/express-exchange?transactionId=${finalResponse.transaction_id}`);
      }
    } catch (error: any) {
      console.error("Failed to update deposit address:", error);
      let errorMessage = "Failed to process request";

      if (error.response?.data) {
        const responseData = error.response.data;
        if (responseData.message) {
          // Check for specific error message and show user-friendly message
          if (responseData.message.includes("Transaction not found or not eligible for address update")) {
            errorMessage = "Your address doesn't match the requested asset";
          } else {
            errorMessage = responseData.message;
          }
        } else if (responseData.error) {
          // Check for specific error in error field
          if (responseData.error.includes("Transaction not found or not eligible for address update")) {
            errorMessage = "Your address doesn't match the requested asset";
          } else {
            errorMessage = responseData.error;
          }
        } else if (responseData.details) {
          errorMessage = responseData.details;
        } else if (typeof responseData === "string") {
          // Check for specific error in string response
          if (responseData.includes("Transaction not found or not eligible for address update")) {
            errorMessage = "Your address doesn't match the requested asset";
          } else {
            errorMessage = responseData;
          }
        }
      } else if (error.message) {
        // Check for specific error in error.message
        if (error.message.includes("Transaction not found or not eligible for address update")) {
          errorMessage = "Your address doesn't match the requested asset";
        } else {
          errorMessage = error.message;
        }
      }

      // For address update failures, show more specific message
      if (errorMessage === "Failed to process request" || errorMessage === "Failed to update deposit address") {
        errorMessage = "Your wallet address doesn't match the asset requested";
      }

      showToast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Prevent submission if amount exceeds $15,000
    if (payAmount > 15000 || getAmount > 15000) {
      showToast.error("Amount cannot exceed $15,000. Please contact OTC Desk for larger amounts.");
      setIsInfoModalOpen(true);
      return;
    }
    // Clear previous errors
    setValidationErrors([]);

    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      showToast.error("Please fix the following errors: " + errors.join(", "));
      return;
    }

    setIsSubmitting(true);

    try {

      // Create FormData for API submission
      const depositPayload = new FormData();

      // Validate and append required fields
      if (!payAmount || payAmount <= 0) {
        throw new Error("Invalid amount");
      }
      depositPayload.append("requested_amount", payAmount.toString());

      // Wallet address is optional for initial submission
      if (walletAddress.trim()) {
        depositPayload.append("deposit_address", walletAddress);
      } else {
        // Set empty value when wallet address is not provided
        depositPayload.append("deposit_address", "");
      }

      if (!selectedPaymentDetail.provider_name) {
        throw new Error("Payment provider is missing");
      }
      depositPayload.append(
        "payment_provider",
        selectedPaymentDetail.provider_name
      );

      if (!selectedPaymentDetail.payment_method_type) {
        throw new Error("Payment method is missing");
      }
      depositPayload.append(
        "payment_method",
        selectedPaymentDetail.payment_method_type
      );

      // Handle currency field - use the asset ticker/symbol/name from the selected asset
      let currencyValue = "";

      // Try different properties in order of preference
      if (selectedAsset.ticker) {
        currencyValue = selectedAsset.ticker;
      } else if (selectedAsset.symbol) {
        // Handle special case for USDT Tether
        currencyValue = selectedAsset.symbol === "USDT Tether" ? "USDT" : selectedAsset.symbol;
      } else if (selectedAsset.name) {
        currencyValue = selectedAsset.name;
      }

      // Clean up the currency value (remove any extra spaces, etc.)
      currencyValue = currencyValue?.trim();

      // Fallback: if still no currency value, try to extract from any available property
      if (!currencyValue) {
        // Try to get any string value from the asset object
        const assetKeys = Object.keys(selectedAsset);
        for (const key of assetKeys) {
          const value = selectedAsset[key];
          if (typeof value === 'string' && value.trim()) {
            currencyValue = value.trim();
            break;
          }
        }
      }

      if (!currencyValue) {
        throw new Error("Currency information is missing");
      }
      depositPayload.append("currency", currencyValue);

      // Handle network field - use the network from selected asset or network
      let networkValue = "";

      // Try to get network from selected network first
      if (selectedNetwork?.network_id) {
        networkValue = selectedNetwork.network_id;
      } else if (selectedNetwork?.network_type) {
        networkValue = selectedNetwork.network_type;
      } else if (selectedAsset) {
        // Fallback to asset network
        networkValue = getAssetNetwork(selectedAsset);
      }

      // Clean up the network value
      networkValue = networkValue?.trim();

      // Fallback: if still no network value, try to extract from any available property
      if (!networkValue) {
        // Try to get any string value from the network object
        if (selectedNetwork) {
          const networkKeys = Object.keys(selectedNetwork);
          for (const key of networkKeys) {
            const value = selectedNetwork[key];
            if (typeof value === 'string' && value.trim()) {
              networkValue = value.trim();
              break;
            }
          }
        }
      }

      if (!networkValue) {
        throw new Error("Network information is missing");
      }
      depositPayload.append("network", networkValue);

      // Handle asset field - use the asset ticker/symbol/name from the selected asset
      let assetValue = "";

      // Try different properties in order of preference
      if (selectedAsset.ticker) {
        assetValue = selectedAsset.ticker;
      } else if (selectedAsset.symbol) {
        // Handle special case for USDT Tether
        assetValue = selectedAsset.symbol === "USDT Tether" ? "USDT" : selectedAsset.symbol;
      } else if (selectedAsset.name) {
        assetValue = selectedAsset.name;
      }

      // Clean up the asset value (remove any extra spaces, etc.)
      assetValue = assetValue?.trim();

      // Fallback: if still no asset value, try to extract from any available property
      if (!assetValue) {
        // Try to get any string value from the asset object
        const assetKeys = Object.keys(selectedAsset);
        for (const key of assetKeys) {
          const value = selectedAsset[key];
          if (typeof value === 'string' && value.trim()) {
            assetValue = value.trim();
            break;
          }
        }
      }

      if (!assetValue) {
        throw new Error("Asset information is missing");
      }
      depositPayload.append("asset", assetValue);

      // Add additional info
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



      // Store the API response and update transaction code
      setApiResponse(depositResponse);
      setTransactionCode(depositResponse.deposit_code || "");

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
            icon: selectedAsset.image_url || selectedAsset.asset_image || selectedAsset.icon_url || selectedAsset.image
          },
          paymentDetail: selectedPaymentDetail,
          walletAddress: depositResponse.deposit_address || walletAddress,
          network: selectedNetwork,
          transactionId: depositResponse.transaction_id,
          depositCode: depositResponse.deposit_code,
          totalAmountDue: depositResponse.total_amount_due,
          commission: depositResponse.commission,
          networkFee: depositResponse.network_fee,
          currency: depositResponse.currency,
          websocketUrl: depositResponse.websocket_url,
          createdAt: Date.now(), // Store transaction creation timestamp for timer
        };
        onExchange(transactionData);
      }
    } catch (error: any) {

      let errorMessage = "Failed to submit deposit request";

      if (error.response?.data) {
        // Try to extract specific error message from response
        const responseData = error.response.data;
        if (responseData.message) {
          // Check for specific error message and show user-friendly message
          if (responseData.message.includes("Transaction not found or not eligible for address update")) {
            errorMessage = "Your address doesn't match the requested asset";
          } else {
            errorMessage = responseData.message;
          }
        } else if (responseData.error) {
          // Check for specific error in error field
          if (responseData.error.includes("Transaction not found or not eligible for address update")) {
            errorMessage = "Your address doesn't match the requested asset";
          } else {
            errorMessage = responseData.error;
          }
        } else if (responseData.details) {
          errorMessage = responseData.details;
        } else if (typeof responseData === "string") {
          // Check for specific error in string response
          if (responseData.includes("Transaction not found or not eligible for address update")) {
            errorMessage = "Your address doesn't match the requested asset";
          } else {
            errorMessage = responseData;
          }
        }
      } else if (error.message) {
        // Check for specific error in error.message
        if (error.message.includes("Transaction not found or not eligible for address update")) {
          errorMessage = "Your address doesn't match the requested asset";
        } else {
          errorMessage = error.message;
        }
      }

      // For address update failures, show more specific message
      if (errorMessage === "Failed to process request" || errorMessage === "Failed to submit deposit request") {
        errorMessage = "Your wallet address doesn't match the asset requested";
      }

      showToast.error(errorMessage);
      setValidationErrors([errorMessage]);
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
      <div className="mb-2" />

      {/* API Validation Error - Show as simple red text */}
      {apiValidationError && (
        <div className="mb-4 text-red-500 text-sm font-medium">
          {apiValidationError}
        </div>
      )}


      <div className={`w-full ${isDark ? "text-white" : "text-[#1F2937]"}`}>
        {/* Top Section - Amount and Bank/Payment Method in one card */}
        <div className="relative mb-4">
          {/* Top Card Container */}
          <div
            data-asset-card="true"
            data-select-card="true"
            className={`relative flex flex-col sm:flex-row gap-4 rounded-2xl p-3 sm:p-4 overflow-visible ${isDark ? "bg-[#0F0F17] border border-[#2F2F3A]" : "bg-white border border-[#E2E8F0] shadow-sm"
              }`}
          >
            {/* Amount Section */}
            <div className="flex-1 min-w-0">
              <label
                className={`block text-[15px] mb-2 font-semibold flex items-center gap-2 ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                  }`}
              >
                You Send
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
                {/* {isCalculatingFromPay && (
                  <span className="text-xs text-[#1D8751] font-medium">(Active)</span>
                )} */}
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
                    const value = e.target.value;

                    // Don't do anything if the value hasn't actually changed
                    if (value === payAmountInput) {
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

                      // Only update and calculate if the numeric value actually changed
                      if (newAmount !== payAmount || value !== payAmountInput) {
                        setPayAmountInput(value); // Store the string value for display
                        setPayAmount(newAmount);
                        setIsCalculatingFromPay(true);

                        // Clear API validation error when user changes amount
                        setApiValidationError(null);

                        // Mark that user has manually modified the amount
                        setIsUserModifiedAmount(true);

                        // Show info modal if amount exceeds $15,000
                        if (newAmount > 15000) {
                          setIsInfoModalOpen(true);
                        }

                        // For direct assets, calculate immediately (API commission is % e.g. 2 = 2%)
                        if (selectedAsset && newAmount > 0 && isSimpleCalculationAsset(selectedAsset)) {
                          const commissionAmount = isCommissionApiAsset(selectedAsset)
                            ? (newAmount * (apiCommission ?? 2)) / 100
                            : (newAmount * (selectedAsset?.range_commissions?.[0]?.commission ? parseFloat(selectedAsset.range_commissions[0].commission) : 2)) / 100;
                          const calculatedGetAmount = Math.max(0, newAmount - commissionAmount);
                          setGetAmount(calculatedGetAmount);
                          setGetAmountInput(calculatedGetAmount.toString());

                          // Simple assets don't need loading states - calculation is instant
                        } else if (selectedAsset && newAmount > 0 && isForexAsset(selectedAsset)) {
                          // For FXP, calculate immediately with 1.06 rate
                          const calculatedGetAmount = newAmount / FXP_EXCHANGE_RATE;
                          setGetAmount(calculatedGetAmount);
                          setGetAmountInput(calculatedGetAmount.toFixed(2));

                          // FXP doesn't need loading states - calculation is instant
                        } else if (selectedAsset && newAmount > 0) {
                          // For complex assets, trigger API calculation

                          // Set loading states to show spinner in "You Receive" field
                          setIsCalculating(true);
                          setIsCalculatingReceive(true);

                          // Trigger the calculation
                          calculateAmounts(newAmount, true);
                        } else {
                          // No calculation needed, ensure loading states are off
                          setIsCalculatingReceive(false);
                          setIsCalculating(false);
                        }
                      }
                    }
                  }}
                  placeholder="Enter amount"
                  className={`w-full rounded-2xl px-4 py-2 pr-16 text-lg focus:outline-none border appearance-none bg-transparent h-[44px] ${(isCalculating || isCalculatingReceive) &&
                    isCalculatingFromPay &&
                    selectedAsset &&
                    !isForexAsset(selectedAsset)
                    ? "border-[#1D8751]"
                    : isDark
                      ? "border-white/10 text-white font-normal"
                      : "border-gray-200 text-[#111827] font-extrabold"
                    }`}
                />


                {/* Show loading spinner when calculating "You Receive" from "You Send" */}
                {(isCalculating || isCalculatingReceive) && isCalculatingFromPay && selectedAsset && !isForexAsset(selectedAsset) && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D8751]"></div>
                  </div>
                )}

                {/* Show info for non-direct assets when typing in You Send */}
                {selectedAsset && !isSimpleCalculationAsset(selectedAsset) && !isForexAsset(selectedAsset) && isCalculatingFromPay && payAmount > 0 && (
                  <div className="mt-2 text-xs text-[#788099]">
                    {estimateLoading ? "⏳ Fetching live rate..." : estimate ? "✅ Using live rate" : "⏳ Calculating..."}
                  </div>
                )}
              </div>
            </div>

            {/* Bank/Payment Method Section */}
            <div className="flex-1 min-w-0">
              <label
                className={`block text-[15px] mb-2 font-semibold flex items-center gap-2 ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                  }`}
              >
                Bank/Payment Method
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
              </label>
              <div className={`text-xs mb-1 ${isDark ? "text-[#788099]" : "text-[#64748B]"
                }`}>
                Payment Method
              </div>
              <div className="relative">
                <CustomSelect
                  options={(() => {
                    const mappedOptions = (finalPaymentMethods || []).map((payment: any, index: number) => {
                      // Get logo URL - check both fields and ensure it's a valid string
                      let logoUrl: string | undefined = undefined;

                      if (payment.provider_logo && typeof payment.provider_logo === 'string' && payment.provider_logo.trim()) {
                        logoUrl = payment.provider_logo.trim();
                      } else if (payment.logo && typeof payment.logo === 'string' && payment.logo.trim()) {
                        logoUrl = payment.logo.trim();
                      }

                     

                     

                      const providerName = formatPaymentProviderLabel(payment);
                      const methodName = getPaymentMethodNameToStrip(payment);
                      const subtitle = methodName ? `${providerName} - ${methodName}` : null;

                      return {
                        value: payment.provider_name,
                        label: providerName,
                        subtitle: subtitle || undefined,
                        logo: logoUrl,
                        raw: payment,
                      };
                    });

                    console.log("🔍 Final CustomSelect Options:", {
                      optionsCount: mappedOptions.length,
                      optionsWithLogos: mappedOptions.filter(opt => opt.logo).length,
                      optionsWithoutLogos: mappedOptions.filter(opt => !opt.logo).length,
                      firstOption: mappedOptions[0] || null,
                      allOptions: mappedOptions.map(opt => ({
                        value: opt.value,
                        label: opt.label,
                        hasLogo: !!opt.logo,
                        logo: opt.logo
                      }))
                    });

                    return mappedOptions;
                  })()}
                  value={payBank}
                  className="w-full"
                  placeholderClassName="text-white dark:text-white"
                  triggerClassName={`!px-4 !py-[8px] !min-h-0 text-lg border rounded-2xl bg-transparent !h-[44px] ${isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200"
                    }`}
                  onChange={(value) => {
                    const selectedPayment = finalPaymentMethods?.find(
                      (payment: any) => payment.provider_name === value
                    );

                    // Debug logging when payment method is selected
                    if (selectedPayment) {
                      console.log("🔍 Selected Payment Method:", {
                        isHomePage,
                        provider_name: selectedPayment.provider_name,
                        provider_logo: selectedPayment.provider_logo,
                        logo: selectedPayment.logo,
                        account_name: selectedPayment.account_name,
                        account_number: selectedPayment.account_number,
                        hasLogo: !!(selectedPayment.provider_logo || selectedPayment.logo),
                        admin_payment_detail_id: selectedPayment.admin_payment_detail_id,
                        fullPayment: selectedPayment
                      });
                    }

                    setPayBank(value);
                    setSelectedPaymentDetail(selectedPayment || null);
                  }}
                  placeholder={
                    paymentMethodsDisplay.isLoading && finalPaymentMethods.length === 0
                      ? "Loading payment methods..."
                      : "Payment Method"
                  }
                  disabled={paymentMethodsDisplay.isLoading && finalPaymentMethods.length === 0}
                  loading={paymentMethodsDisplay.isLoading && finalPaymentMethods.length === 0}
                  loadingText="Loading payment methods..."
                  emptyText="No payment methods available"
                  searchable={true}
                  dropdownTitle="Select a payment methods"
                  dropdownOffsetY={-68}
                  dropdownOffsetX={20}
                  largeDropdownItems={true}
                />
              </div>
              {adminMethodsError && <p className="text-red-500 text-sm mt-1">{adminMethodsError}</p>}
            </div>
          </div>

          {/* Swap Circle - positioned to touch both borders equally */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full -translate-y-1/3 z-10">
            <button
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105"
              onClick={() => {
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

        {/* Bottom Section - You Receive and Asset in one card */}
        <div className="relative mb-3">
          <div
            data-asset-card="true"
            className={`relative flex flex-col sm:flex-row gap-4 rounded-2xl p-3 sm:p-4 overflow-visible ${isDark ? "bg-[#0F0F17] border border-[#2F2F3A]" : "bg-white border border-[#E2E8F0] shadow-sm"
              }`}
          >
            {/* You Receive Section */}
            <div className="flex-1 min-w-0">
              <label
                className={`block text-[15px] mb-2 font-semibold flex items-center gap-2 ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                  }`}
              >
                You Receive
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
                {!isCalculatingFromPay && (
                  <span className="text-xs text-[#1D8751] font-medium">(Active)</span>
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

                      // Only update and calculate if the numeric value actually changed
                      if (newAmount !== getAmount || value !== getAmountInput) {
                        setGetAmountInput(value); // Store the string value for display
                        setGetAmount(newAmount);
                        setIsCalculatingFromPay(false);

                        // Clear API validation error when user changes amount
                        setApiValidationError(null);

                        // For direct assets, calculate immediately (API commission is % e.g. 2 = 2%)
                        if (selectedAsset && newAmount > 0 && isSimpleCalculationAsset(selectedAsset)) {
                          const commissionRate = isCommissionApiAsset(selectedAsset) ? (apiCommission ?? 2) : (selectedAsset?.range_commissions?.[0]?.commission ? parseFloat(selectedAsset.range_commissions[0].commission) : 2);
                          const calculatedPayAmount = newAmount / (1 - commissionRate / 100);
                          setPayAmount(calculatedPayAmount);
                          setPayAmountInput(calculatedPayAmount.toString());

                          // Simple assets don't need loading states - calculation is instant
                        } else if (selectedAsset && newAmount > 0 && isForexAsset(selectedAsset)) {
                          // For FXP, calculate immediately with 1.06 rate (reverse)
                          const calculatedPayAmount = newAmount * FXP_EXCHANGE_RATE;
                          setPayAmount(calculatedPayAmount);
                          setPayAmountInput(calculatedPayAmount.toFixed(2));

                          // FXP doesn't need loading states - calculation is instant
                        } else if (selectedAsset && newAmount > 0) {
                          // For complex assets, trigger API calculation

                          // Set loading states to show spinner in "You Send" field
                          setIsCalculating(true);
                          setIsCalculatingReceive(true);

                          // Trigger the calculation
                          calculateAmounts(newAmount, false);
                        } else {
                          // No calculation needed, ensure loading states are off
                          setIsCalculatingReceive(false);
                          setIsCalculating(false);
                        }
                      }
                    }
                  }}
                  placeholder="Enter amount"
                  className={`w-full rounded-2xl px-4 py-2 pr-16 text-lg focus:outline-none border appearance-none bg-transparent h-[44px] ${receiveAmountError &&
                    (receiveAmountError.includes("Rough estimate") ||
                      receiveAmountError.includes("Using estimated rate"))
                    ? "border-[#F79330]"
                    : receiveAmountError
                      ? "border-red-500"
                      : (isCalculating || isCalculatingReceive) &&
                        selectedAsset &&
                        !isForexAsset(selectedAsset)
                        ? "border-[#1D8751]"
                        : isDark
                          ? "border-white/10 text-white font-normal"
                          : "border-gray-200 text-[#111827] font-extrabold"
                    }`}
                />
                {/* Show loading spinner when calculating "You Send" from "You Receive" */}
                {(isCalculating || isCalculatingReceive) && !isCalculatingFromPay && selectedAsset && !isForexAsset(selectedAsset) && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D8751]"></div>
                  </div>
                )}
                {receiveAmountError && (
                  <div className="flex items-center gap-2 mt-2">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F79330]" />
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="text-[#F79330]" />
                    </svg>
                    <span className={`text-sm font-medium ${receiveAmountError.includes('Rough estimate') || receiveAmountError.includes('Using estimated rate') ? 'text-[#F79330]' : 'text-red-500'
                      }`}>
                      {receiveAmountError}
                    </span>
                  </div>
                )}

                {/* Show API estimate status for non-direct assets */}
                {selectedAsset && !isSimpleCalculationAsset(selectedAsset) && !isForexAsset(selectedAsset) && (
                  <div className="mt-2">
                    {estimate && !estimateLoading && isCalculatingFromPay && (
                      <div className="flex items-center gap-2 text-[#1D8751] text-sm">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <path d="M12 8v4m0 4h.01" stroke="#1D8751" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="12" cy="12" r="10" stroke="#1D8751" strokeWidth="2" />
                        </svg>
                        <span>Using live rate</span>
                      </div>
                    )}
                    {estimateLoading && !isCalculatingFromPay && (
                      <div className="flex items-center gap-2 text-[#1D8751] text-sm">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1D8751]"></div>
                        <span>Calculating ...</span>
                      </div>
                    )}
                    {estimate && !estimateLoading && !isCalculatingFromPay && (
                      <div className="flex items-center gap-2 text-[#1D8751] text-sm">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <path d="M12 8v4m0 4h.01" stroke="#1D8751" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="12" cy="12" r="10" stroke="#1D8751" strokeWidth="2" />
                        </svg>
                        <span>Using live rate for reverse calculation</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Asset Section */}
            <div className="flex-1 min-w-0">
              <div className={`text-xs mb-1 mt-[30px] ${isDark ? "text-[#788099]" : "text-[#64748B]"
                }`}>
                Asset
              </div>
              <div className="relative" ref={assetDropdownRef}>
                <div
                  className={`w-full rounded-2xl px-4 py-2 text-lg focus:outline-none border flex items-center justify-between gap-3 cursor-pointer bg-transparent h-[44px] ${isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200"
                    }`}
                  onClick={() => {
                    if (!isAssetDropdownOpen) {
                      updateAssetDropdownPosition();
                    }
                    setIsAssetDropdownOpen(!isAssetDropdownOpen);
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {selectedAsset ? (
                      <>
                        <img
                          src={
                            selectedAsset?.image_url ||
                            selectedAsset?.asset_image ||
                            (selectedAsset as any)?.image ||
                            "/images/tether.svg"
                          }
                          alt={selectedAsset?.name || selectedAsset?.ticker || selectedAsset?.symbol || "Asset"}
                          className="w-6 h-6 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "/images/tether.svg";
                          }}
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm ${isDark ? "text-white font-normal" : "text-[#1F2937] font-extrabold"
                                }`}
                            >
                              {getAssetPrimaryLabel(selectedAsset).toUpperCase()}
                            </span>
                            <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-normal px-2 py-0.5 rounded-full">
                              {getNetworkDisplayName(getAssetNetwork(selectedAsset))}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <img
                          src="/images/tether.svg"
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
                  <div className="ml-4 flex-shrink-0">
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
                </div>

                {/* Asset Dropdown */}
                {renderAssetDropdown()}
              </div>
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
              Commission: {commissionRate}% of ${payAmount} = $
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
        </div> */}



        {/* Warning Message */}
        {!isFirstCardSubmitted && !showForexForm && (
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
        {!isFirstCardSubmitted && !showForexForm && (
          <div className="relative">
            <button
              type="button"
              className={`w-full text-base font-medium py-1.5 rounded-full flex items-center justify-center gap-2 transition-colors text-white ${isHomePage
                ? payAmount >= 15000 || getAmount >= 15000
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#1D8751] hover:bg-[#1D8751]/80 cursor-pointer"
                : isSubmitting ||
                  !selectedAsset ||
                  !payBank ||
                  payAmount >= 15000 ||
                  getAmount >= 15000 ||
                  (selectedAsset &&
                    !isSimpleCalculationAsset(selectedAsset) &&
                    !isForexAsset(selectedAsset) &&
                    estimateLoading)
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#1D8751] hover:bg-[#1D8751]/80"
                }`}
              onClick={async () => {
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
                    // Payment method - save FULL object
                    payment: selectedPaymentDetail ? { ...selectedPaymentDetail } : null,
                    // Also save payBank separately for easier access
                    payBank: payBank,
                    walletAddress,
                  };
                  setAuthRedirectPath(buildExpressRedirectPath(mode, state));
                  setExpressPrefillState(state); // Fallback if URL params are lost
                  router.push("/auth/login");
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

                if (selectedAsset && isForexAsset(selectedAsset)) {
                  if (!payAmount || payAmount <= 0) {
                    showToast.error("Please enter a valid amount");
                    return;
                  }
                  if (!selectedPaymentDetail) {
                    showToast.error("Please select a payment method");
                    return;
                  }
                  setShowForexForm(true);
                } else {
                  handleFirstCardSubmit();
                }
              }}
              disabled={
                requiresLoginRedirect
                  ? payAmount >= 15000 || getAmount >= 15000
                  : isSubmitting ||
                  !selectedAsset ||
                  !payBank ||
                  (walletAddress.trim() && !!walletError) ||
                  (selectedAsset &&
                    !isSimpleCalculationAsset(selectedAsset) &&
                    !isForexAsset(selectedAsset) &&
                    estimateLoading)
              }
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#35353e] dark:border-[#788099]"></div>
                  <span>Submiting...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center">
                  <span className="text-base font-semibold text-white">E</span>
                  <img
                    className="h-5 w-auto mt-2"
                    src="https://res.cloudinary.com/pitz/image/upload/v1752244135/Group_5_gkxzdz.png"
                    alt="Express icon"
                  />
                </span>
              )}
            </button>
          </div>
        )}

        {/* Forex Form - Shows when FXP is selected */}
        {showForexForm && selectedAsset && isForexAsset(selectedAsset) && (
          <div className="mt-4 space-y-4">
            {/* Payment Method Details */}
            {selectedPaymentDetail && (
              <>
                <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
                  Payment Details
                </h2>
                <div
                  className={`flex-1 rounded-2xl flex flex-col justify-between p-5 relative min-h-[120px] ${isDark ? "bg-[#1D1D23] border border-[#35353E]" : "bg-white border border-[#E2E8F0] shadow-sm"
                    }`}
                >
                  {/* Bank and logo */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-base font-semibold`}>
                      Bank:
                    </span>
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          selectedPaymentDetail.provider_logo ||
                          selectedPaymentDetail.logo ||
                          "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                        }
                        alt={`${selectedPaymentDetail.provider_name || 'Bank'} Logo`}
                        className="w-8 h-8 rounded-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png";
                        }}
                      />
                      <span className={`${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"} text-base font-semibold`}>
                        {selectedPaymentDetail.provider_name}
                      </span>
                    </div>
                  </div>
                  <div className={`${isDark ? "border-[#39394A]" : "border-[#E2E8F0]"} border-t border-dashed mb-2`}></div>
                  {/* Account Name */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-base font-medium`}>
                      Account Name :
                    </span>
                    <span className={`${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"} text-base font-medium`}>
                      {selectedPaymentDetail.account_name}
                    </span>
                  </div>
                  <div className={`${isDark ? "border-[#39394A]" : "border-[#E2E8F0]"} border-t border-dashed mb-2`}></div>
                  {/* Account Number */}
                  <div className="flex items-center justify-between">
                    <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-base font-medium`}>
                      Account Number :
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"} text-base font-medium`}>
                        {selectedPaymentDetail.account_number}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            selectedPaymentDetail.account_number
                          );
                          showToast.success("Account number copied!");
                        }}
                        className="text-[#F79330] hover:text-white transition-colors p-1 rounded"
                        title="Copy Account Number"
                      >
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
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
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
              Forex Account Details
            </h2>

            {/* Forex Account Number */}
            <div
              className={`flex flex-col rounded-2xl p-5 shadow-lg ${isDark ? "bg-[#1D1D23] border-2 border-[#35353E]" : "bg-white border-2 border-[#E2E8F0]"
                }`}
            >
              <label className={`block text-[17px] mb-2 font-semibold ${isDark ? "text-white" : "text-[#475569]"}`}>
                Your Forex Account Number
              </label>
              <input
                type="text"
                value={forexAccountNumber}
                onChange={(e) => setForexAccountNumber(e.target.value)}
                placeholder="Enter your forex account number"
                className={`w-full rounded-2xl px-4 py-2 text-lg focus:outline-none border bg-transparent ${isDark ? "text-white border-[#35353E]" : "text-[#111827] border-[#CBD5F5]"
                  }`}
              />
            </div>

            {/* User Notes */}
            <div
              className={`flex flex-col rounded-2xl p-5 shadow-lg ${isDark ? "bg-[#1D1D23] border-2 border-[#35353E]" : "bg-white border-2 border-[#E2E8F0]"
                }`}
            >
              <label className={`block text-[17px] mb-2 font-semibold ${isDark ? "text-white" : "text-[#475569]"}`}>
                Additional Notes (Optional)
              </label>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="Add any special instructions or notes..."
                className={`w-full rounded-2xl px-4 py-2 text-lg focus:outline-none border min-h-[100px] resize-none bg-transparent ${isDark ? "text-white border-[#35353E]" : "text-[#111827] border-[#CBD5F5]"
                  }`}
              />
            </div>

            {/* Submit Forex Exchange Button */}
            <button
              className={`w-full text-white text-base font-medium py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors ${isSubmitting || !forexAccountNumber.trim()
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-[#1D8751] hover:bg-[#166b3e]"
                }`}
              onClick={async () => {
                if (!forexAccountNumber.trim()) {
                  showToast.error("Please enter your forex account number");
                  return;
                }

                const adminPaymentDetailId = getAdminPaymentDetailId(selectedPaymentDetail);
                if (!adminPaymentDetailId) {
                  showToast.error("Please select a payment method");
                  return;
                }

                setIsSubmitting(true);

                try {
                  const { createForexExchangeThunk } = await import("../../../slices/forexSlice");

                  const forexPayload = {
                    transaction_type: "deposit" as const,
                    from_currency: "USD",
                    from_amount: payAmount.toFixed(2),
                    to_currency: "FXP",
                    to_amount: getAmount.toFixed(2),
                    exchange_rate: FXP_EXCHANGE_RATE.toFixed(4),
                    additional_info: selectedPaymentDetail ? `Wire transfer from ${selectedPaymentDetail.provider_name}` : "Wire transfer",
                    user_notes: userNotes.trim() || "Forex deposit exchange",
                    user_forex_account: forexAccountNumber.trim(),
                    admin_payment_detail_id: adminPaymentDetailId,
                  };

                  console.log("🚀 Forex Deposit Payload:", forexPayload);

                  const result = await dispatch(createForexExchangeThunk(forexPayload)).unwrap();

                  // Store exchange data in localStorage to avoid immediate refetch
                  localStorage.setItem('currentForexExchange', JSON.stringify(result));

                  showToast.success("Forex exchange created successfully!");

                  // Navigate to forex status page using correct field name
                  router.push(`/dashboard/express-exchange/forex-status?transactionId=${result.forex_transaction_id}`);
                } catch (error: any) {
                  console.error("Failed to create forex exchange:", error);
                  showToast.error(error || "Failed to create forex exchange");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting || !forexAccountNumber.trim()}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating Forex Exchange...</span>
                </div>
              ) : (
                <span>Submit </span>
              )}
            </button>
          </div>
        )}
      </div>

      {selectedPaymentDetail && isFirstCardSubmitted && (
        <>
          {/* Payment Details Card */}
          <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
            Payment Details
          </h2>
          <div
            ref={paymentDetailsRef}
            className="mt-1 mb-2 w-full flex flex-col gap-3 px-2 "
          >
            <div
              className={`flex-1 rounded-2xl flex flex-col justify-between p-3 sm:p-5 relative min-h-[120px] ${isDark ? "bg-[#0F0F17] border border-[#35353E]" : "bg-white border border-[#E2E8F0] shadow-sm"
                }`}
            >
              {/* Bank and logo */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4">
                <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-sm sm:text-base font-semibold`}>
                  Bank:
                </span>
                <div className="flex items-center gap-2">
                  <img
                    src={
                      selectedPaymentDetail.provider_logo ||
                      selectedPaymentDetail.logo ||
                      "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                    }
                    alt={`${selectedPaymentDetail.provider_name || 'Bank'} Logo`}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png";
                    }}
                  />
                  <span className={`${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"} text-sm sm:text-base font-semibold truncate max-w-[150px] sm:max-w-none`}>
                    {selectedPaymentDetail.provider_name}
                  </span>
                </div>
              </div>
              <div className={`${isDark ? "border-[#39394A]" : "border-[#E2E8F0]"} border-t border-dashed mb-2`}></div>
              {/* Account Name */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2">
                <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-sm sm:text-base font-medium`}>
                  Account Name :
                </span>
                <span className={`${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"} text-sm sm:text-base font-medium break-words text-right sm:text-left`}>
                  {selectedPaymentDetail.account_name}
                </span>
              </div>
              <div className={`${isDark ? "border-[#39394A]" : "border-[#E2E8F0]"} border-t border-dashed mb-2`}></div>
              {/* Account Number */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-sm sm:text-base font-medium`}>
                  Account Number :
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                  <span className={`${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"} text-sm sm:text-base font-medium break-all sm:break-normal`}>
                    {selectedPaymentDetail.account_number}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        selectedPaymentDetail.account_number
                      );
                      showToast.success("copied!");
                    }}
                    className="text-[#F79330] hover:text-white transition-colors p-1 rounded"
                    title="Copy Account Number"
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
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
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Code Card - below Payment Details, before Wallet Address */}
          {apiResponse && apiResponse.deposit_code && (
            <>
              <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
                Transaction Code
              </h2>
              <div className="mb-6 flex flex-col gap-3 w-full px-0 sm:px-2">
                <div
                  className={`border rounded-2xl p-3 sm:p-4 shadow-lg w-full ${isDark ? "bg-[#0F0F17] border-accent text-[#788099]" : "bg-white border-[#E2E8F0] text-[#1F2937]"
                    }`}
                >
                  {/* Transaction Code Row */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-3">
                    {/* Display deposit code from API response - each character in its own box */}
                    <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
                      {apiResponse.deposit_code.split('').map((char: string, index: number) => (
                        <div
                          key={index}
                          className="w-8 h-10 sm:w-10 sm:h-12 text-gray-900 dark:text-white dark:bg-[#35353E] bg-[#F5F6F7] border dark:border-[#4A4A4A] border-[#E2E8F0] rounded-lg flex items-center justify-center"
                        >
                          <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white font-mono">
                            {char}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(apiResponse.deposit_code);
                        showToast.success("Transaction code copied!");
                      }}
                      className="flex items-center gap-2 dark:bg-[#35353E] bg-[#F5F6F7] border dark:border-[#1D8751] border-[#E2E8F0] text-gray-900 dark:text-white rounded-full px-3 py-2 sm:px-4 font-semibold text-xs sm:text-sm hover:bg-[#1D8751] hover:text-white transition-colors"
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
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
                        Note
                      </span>
                    </div>
                    <div className=" dark:bg-[#1D1D23] border border-[#1D8751] rounded-xl p-3">
                      <ul className="list-none space-y-1">
                        <li className="flex items-start">
                          <span className="w-2 h-2 mt-1 rounded-full bg-[#1D8751] inline-block mr-2 shrink-0"></span>
                          <span className="text-[#35353e] dark:text-[#788099] text-xs">
                            Please write this Transaction Code in the bank message
                            or note section.
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 mt-1 rounded-full bg-[#1D8751] inline-block mr-2 shrink-0"></span>
                          <span className="text-[#35353e] dark:text-[#788099] text-xs">
                            This helps us process your payment quickly and
                            accurately.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Dynamic Crypto Warning Banner */}
          {selectedAsset && (
            <div className="mb-4 p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl">
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                  <span className="font-bold">Important:</span> Please send only <span className="font-bold text-yellow-900 dark:text-yellow-100">{selectedAsset?.symbol || selectedAsset?.ticker || "crypto"}</span> on <span className="font-bold text-yellow-900 dark:text-yellow-100">{currentNetwork || selectedAsset?.network || "the selected network"}</span>. Any other Crypto or Network will be <span className="font-bold">lost Permanently</span>.
                </p>
              </div>
            </div>
          )}

          {/* Wallet Address Section */}
          <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
            Wallet Address
          </h2>
          <div className="flex flex-col bg-white dark:bg-[#0F0F17] border-1 dark:border-[#35353E] border-[#E2E8F0] rounded-2xl p-3 sm:p-5 shadow-lg w-full text-[#35353e] dark:text-[#788099] mb-6">
            {/* Wallet/Account Address Label */}
            <label className="block text-sm sm:text-[17px] text-[#7e7e8f] mb-2 font-semibold">
              Wallet/Account Address
            </label>
            {/* Input group */}
            <div className="relative flex items-center bg-transparent dark:bg-transparent border border-[#39394a] dark:border-[#39394A] rounded-2xl px-2 sm:px-4 py-2 mb-4 gap-1 sm:gap-2">
              {/* Left icon */}
              <span className="mr-2 text-[#1D8751]">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M7 17v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
                    stroke="#1D8751"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="3"
                    y="3"
                    width="12"
                    height="12"
                    rx="2"
                    stroke="#1D8751"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => {
                  const value = e.target.value;
                  setWalletAddress(value);

                  // Validate using API if asset is selected
                  if (value.trim() === "") {
                    setWalletError(null); // No error when empty - address is optional
                    setIsAddressConfirmed(false);
                    resetAddressValidation();
                  } else if (!selectedAsset || !currentCurrency) {
                    setWalletError("Please select an asset first");
                    setIsAddressConfirmed(false);
                  } else {
                    // Use API validation hook
                    validateAddress(value, currentCurrency, currentNetwork);
                  }
                }}
                placeholder={`Paste your ${(selectedAsset?.ticker || selectedAsset?.symbol || "crypto").toUpperCase()} address`}
                className={`flex-1 bg-transparent border-none outline-none text-[#35353e] dark:text-[#788099] placeholder-[#788099] text-sm sm:text-base ${walletError
                  ? "border-red-500"
                  : walletAddress.trim() && !walletError
                    ? "border-green-500"
                    : ""
                  }`}
              />
              {/* Bookmark icon - clickable to load from bookmarks */}
              <span
                ref={bookmarkAnchorRef}
                className="relative mx-1 sm:mx-2 text-[#1D8751] cursor-pointer shrink-0 hover:opacity-80 transition-opacity"
                onClick={async () => {
                  if (bookmarkOpen) {
                    setBookmarkOpen(false);
                    return;
                  }
                  setBookmarkOpen(true);
                  await fetchBookmarks();
                }}
                title="Load from bookmarks"
              >
                <svg width="18" height="18" className="sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <BookmarkDropdown
                  isOpen={bookmarkOpen}
                  onClose={() => setBookmarkOpen(false)}
                  bookmarks={bookmarks}
                  loading={bookmarksLoading}
                  saving={bookmarkSaving}
                  currentAddress={walletAddress}
                  asset={currentCurrency}
                  network={currentNetwork || undefined}
                  onSelect={(addr) => {
                    setWalletAddress(addr);
                    if (addr.trim()) validateAddress(addr, currentCurrency, currentNetwork);
                    else resetAddressValidation();
                  }}
                  onSaveCurrent={async () => {
                    if (!walletAddress.trim() || !currentCurrency || !currentNetwork) {
                      showToast.error("Enter address and select asset/network first");
                      return;
                    }
                    await saveBookmark({
                      address: walletAddress.trim(),
                      label: `My ${currentCurrency} wallet`,
                      network: currentNetwork,
                      asset: currentCurrency,
                    });
                  }}
                  anchorRef={bookmarkAnchorRef}
                  isDark={isDark}
                  saveDisabled={isAddressValidating || !(addressValidationResult?.isValid)}
                />
              </span>
              {/* Paste button */}
              <button
                title="Paste"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setWalletAddress(text);
                    // Validate pasted address using API
                    if (text.trim() && selectedAsset && currentCurrency) {
                      validateAddress(text, currentCurrency, currentNetwork);
                    }
                  } catch (err) {
                    console.error("Failed to read clipboard:", err);
                    showToast.error("Failed to paste from clipboard");
                  }
                }}
                className="flex items-center justify-center gap-2 bg-[#1D8751] hover:bg-[#166b3e] text-white rounded-xl px-3 py-1.5 font-semibold text-sm transition-colors min-h-[36px] touch-manipulation flex-shrink-0 whitespace-nowrap"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-white">
                  <path
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Show validation messages below the wallet address input */}
            {isAddressValidating && walletAddress.trim() && selectedAsset && currentCurrency && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-4 h-4 border-2 border-[#1D8751] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[#1D8751] text-sm font-medium">
                  Validating address...
                </p>
              </div>
            )}

            {!isAddressValidating && walletError && (
              <p className="text-red-500 text-sm mt-2 font-medium flex items-center gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M12 8v4M12 16h.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                {walletError}
              </p>
            )}

            {!isAddressValidating && walletAddress.trim() && !walletError && selectedAsset && isAddressConfirmed && (
              <p className="text-[#1D8751] text-sm mt-2 font-medium flex items-center gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                </svg>
                Valid address
              </p>
            )}





            {/* {!walletAddress.trim() && (
              <p className="text-[#7e7e8f] dark:text-[#788099] text-sm mt-2 font-medium">
                ℹ️ Wallet address is optional. You can provide it later if needed.
              </p>
            )} */}

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
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">1.</span>
                    <p className={`text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-[#475569]"}`}>
                      <span className="font-semibold">Send from your own account only:</span> Please send money from your own account only to <span className="font-semibold text-[#1D8751]">{selectedPaymentDetail?.provider_name || payBank || "the selected provider"}</span> account <span className="font-semibold text-[#1D8751]">{selectedPaymentDetail?.account_number || selectedPaymentDetail?.payment_details?.[0]?.account_number || selectedPaymentDetail?.payment_details?.[0]?.mobile_number || "—"}</span> for Asset <span className="font-semibold text-[#1D8751]">{selectedAsset?.ticker || selectedAsset?.symbol || "crypto"}</span>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">2.</span>
                    <p className={`text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-[#475569]"}`}>
                      <span className="font-semibold">Put transaction ID in the description field:</span> You must put the transaction ID in the description/memo field of the bank transfer.
                    </p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">3.</span>
                    <p className={`text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-[#475569]"}`}>
                      <span className="font-semibold">Non-compliance:</span> Please note, if you do not follow the above conditions, we will reject your transaction and send you back your money.
                    </p>
                  </div>
                </div>
              </div>
            </div>


          </div>

          {/* Validation Errors Display */}
          {validationErrors.length > 0 && (
            <div className="w-full px-2 mb-4">
              <div
                className={`border border-[#1D8751] rounded-2xl p-4 ${isDark ? "bg-[#1D1D23]" : "bg-[#F8FAFF]"
                  }`}
              >
                <h3 className="text-[#1D8751] font-semibold mb-2">
                  Please fix the following errors:
                </h3>
                <ul className="list-disc list-inside text-[#1D8751] space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Button outside the card */}
          <div className="flex flex-col gap-3 w-full px-2">
            <button
              className={`w-full text-base font-medium py-2 rounded-2xl flex items-center justify-center gap-2 transition-colors text-white ${isSubmitting || payAmount >= 15000 || getAmount >= 15000
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-[#1D8751] hover:bg-[#166b3e]"
                }`}
              onClick={handleProceedToNext}
              disabled={isSubmitting || !walletAddress.trim() || !!walletError || payAmount >= 15000 || getAmount >= 15000}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#35353e] dark:border-[#35353E]"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center">
                  E
                  <img
                    className="mt-2"
                    src="https://res.cloudinary.com/pitz/image/upload/v1752244135/Group_5_gkxzdz.png"
                    alt=""
                  />
                </span>
              )}
            </button>
          </div>
        </>
      )}

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
          setIsInfoModalOpen(false);
          router.push("/contactUs");
          // When modal closes, reset amount to maximum allowed (15000)
          if (payAmount > 15000) {
            setPayAmount(15000);
            setPayAmountInput("15000");
          }
          if (getAmount > 15000) {
            setGetAmount(15000);
            setGetAmountInput("15000");
          }
        }}
      />

    </div>
  );
}