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
import { fetchAdminPaymentDetails } from "../../../../exchange/slices/paymentSlice";
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
import { useChangeNowAssets } from "@/features/express/home/hooks/useChangeNowAssets";
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
import {
  fetchCommission,
  fetchCommissionDetails,
  getCommissionApiAsset,
  fetchExchangeCommissionLookup,
  getExchangeLookupParams,
  isExchangeCommissionLookupAsset,
  isForexPrimusAsset,
  type CommissionLookupResponse,
  type ExchangeCommissionLookupResponse,
} from "@/features/express/api";
import { withTimeout } from "@/features/express/utils/fetchWithTimeout";
import { resolveForexDepositAdminPaymentDetailId } from "@/features/express/utils/forexDepositResolution";
import { getHighResAssetIcon, ASSET_ICON_SIZE } from "@/features/express/utils/imageHelpers";
import {
  AssetDropdownVirtualized,
  buildAssetDropdownRows,
} from "@/features/express/components/forms/AssetDropdownVirtualized";

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

const MISSING_USDT_USD_RATE_ERROR =
  "No exchange rate configured for USDT to USD";
const MISSING_FXP_USD_RATE_ERROR =
  "No exchange rate configured for FXP to USD";
const getNetworkMatchKeys = (network: string): string[] => {
  const n = (network || "").toLowerCase();
  return NETWORK_ALIASES[n] ? [...NETWORK_ALIASES[n], n] : [n];
};

// Use a local placeholder so missing icons always render in home flow.
const ASSET_ICON_FALLBACK_URL = "/assets/image_7_jijlik.png";
const FX_PRIMUS_ASSET_ICON_URL = "/assets/fx-primus-custom.svg";

/** Keep FX Primus visible in Popular when ChangeNOW public assets omit it. */
const homePopularFxPrimusFallback = (): SupportedAsset =>
  ({
    asset_id: "",
    ticker: "FXP",
    symbol: "FXP",
    name: "FX Primus",
    network: "bsc",
    networks: [{ network_id: "bsc", network_type: "bsc" }],
    image_url: FX_PRIMUS_ASSET_ICON_URL,
    change_now_ticker: "fxp",
    original_ticker: "fxp",
    featured: true,
    is_changenow_asset: true,
    range_commissions: [{ commission: "2" }],
    commission: "2",
    fee_rate: "2",
  }) as SupportedAsset;

const getAssetDropdownIcon = (asset: any): string => {
  if (isForexPrimusAsset(asset)) {
    return FX_PRIMUS_ASSET_ICON_URL;
  }
  return getHighResAssetIcon(asset, ASSET_ICON_SIZE) || ASSET_ICON_FALLBACK_URL;
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

const isUuid = (value: unknown): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim()
  );

const normalizeNetworkKey = (value: unknown): string => {
  const key = String(value || "").trim().toLowerCase();
  if (!key) return "";
  if (["bsc", "bep20", "bnb smart chain", "binance smart chain"].includes(key)) return "bsc";
  if (["eth", "erc20", "ethereum"].includes(key)) return "eth";
  if (["trx", "trc20", "tron"].includes(key)) return "trx";
  if (["matic", "polygon", "polygon pos"].includes(key)) return "matic";
  if (["sol", "solana"].includes(key)) return "sol";
  return key;
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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Helper to resolve admin_payment_detail_id from payment object (API may use id or nest in payment_details - e.g. FXPRIMUS)
const getAdminPaymentDetailId = (payment: any): string | null => {
  if (!payment) return null;
  const p = payment as any;
  const firstDetail = (p.payment_details?.[0] ?? p.admin_payment_details?.[0]) || null;
  const idCandidate =
    p.admin_payment_detail_id ??
    firstDetail?.admin_payment_detail_id ??
    firstDetail?.payment_detail_id ??
    firstDetail?.detail_id ??
    firstDetail?.id ??
    p.payment_detail_id ??
    p.detail_id ??
    p.admin_payment_id ??
    p.provider_id ??
    p.id ??
    null;
  const id = idCandidate != null ? String(idCandidate).trim() : "";
  return UUID_REGEX.test(id) ? id : null;
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
  const { adminPaymentDetails: exchangeAdminPaymentDetails } = useSelector(
    (state: any) => state.payment
  );
  const { assets, loading: assetsLoading } = useSelector(
    (state: any) => state.exchange
  );
  const {
    assets: publicAssets,
    loading: publicAssetsLoading,
  } = useChangeNowAssets(isHomePage);

  // Add swap assets state
  const { supportedAssets: swapAssets, loading: swapAssetsLoading } =
    useSelector((state: any) => state.swap);
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const { isDark } = useTheme();

  const exchangeAssetsSource = isHomePage ? publicAssets : assets?.assets;
  const swapAssetsSource = isHomePage ? [] : swapAssets;
  const exchangeAssetsLoadingState = isHomePage
    ? publicAssetsLoading
    : assetsLoading;
  const swapAssetsLoadingState = isHomePage ? false : swapAssetsLoading;
  const exchangeAssetsErrorState = null;
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

    // Check if we have payment methods data (support all known public API shapes)
    const hasHomePublicData =
      (Array.isArray(publicPaymentMethods?.data?.providers) && publicPaymentMethods.data.providers.length > 0) ||
      (Array.isArray(publicPaymentMethods?.data) && publicPaymentMethods.data.length > 0) ||
      (Array.isArray(publicPaymentMethods) && publicPaymentMethods.length > 0);
    const hasPaymentData = isHomePage
      ? hasHomePublicData
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
            // Support both payment_details and admin_payment_details payload shapes
            const firstPaymentDetail =
              (Array.isArray(provider.payment_details) && provider.payment_details.length > 0
                ? provider.payment_details[0]
                : null) ||
              (Array.isArray(provider.admin_payment_details) && provider.admin_payment_details.length > 0
                ? provider.admin_payment_details[0]
                : null) ||
              {};

            const flattened = {
              provider_name: provider.provider_name,
              payment_method:
                provider.method_display ||
                provider.method ||
                provider.method?.method_name ||
                provider.method?.method_display ||
                '',
              payment_method_type:
                provider.method ||
                provider.method_display ||
                provider.method?.method_name ||
                provider.method?.method_display ||
                '',
              provider_logo: provider.logo,
              logo: provider.logo, // Also add as 'logo' for backward compatibility
              is_active: true, // All public methods are considered active
              payment_details:
                provider.payment_details ||
                provider.admin_payment_details ||
                [],
              // Flatten first payment detail for easy access
              account_name: provider.account_name || firstPaymentDetail.account_name || '',
              account_number:
                provider.account_number ||
                firstPaymentDetail.account_number ||
                firstPaymentDetail.mobile_number ||
                provider.mobile_number ||
                provider.wallet_address ||
                '',
              mobile_number:
                provider.mobile_number ||
                firstPaymentDetail.mobile_number ||
                null,
              wallet_address:
                provider.wallet_address ||
                firstPaymentDetail.wallet_address ||
                null,
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
        } else if (Array.isArray(publicPaymentMethods?.data)) {
          const providers = publicPaymentMethods.data;
          flattenedMethods = providers.map((provider: any) => {
            const firstPaymentDetail =
              (Array.isArray(provider.payment_details) && provider.payment_details[0]) ||
              (Array.isArray(provider.admin_payment_details) && provider.admin_payment_details[0]) ||
              {};
            return {
              provider_name: provider.provider_name || provider.payment_provider_name || provider.provider || "",
              payment_method: provider.method_display || provider.method || provider.payment_method || "",
              payment_method_type: provider.method || provider.method_display || provider.payment_method_type || "",
              provider_logo: provider.logo || provider.provider_logo || undefined,
              logo: provider.logo || provider.provider_logo || undefined,
              is_active: true,
              payment_details: provider.payment_details || provider.admin_payment_details || [],
              account_name: provider.account_name || firstPaymentDetail.account_name || "",
              account_number:
                provider.account_number ||
                firstPaymentDetail.account_number ||
                firstPaymentDetail.mobile_number ||
                provider.mobile_number ||
                provider.wallet_address ||
                "",
              mobile_number: provider.mobile_number || firstPaymentDetail.mobile_number || null,
              wallet_address: provider.wallet_address || firstPaymentDetail.wallet_address || null,
              provider_id: provider.provider_id || provider.id,
            };
          });
        } else if (Array.isArray(publicPaymentMethods)) {
          const providers = publicPaymentMethods;
          flattenedMethods = providers.map((provider: any) => {
            const firstPaymentDetail =
              (Array.isArray(provider.payment_details) && provider.payment_details[0]) ||
              (Array.isArray(provider.admin_payment_details) && provider.admin_payment_details[0]) ||
              {};
            return {
              provider_name: provider.provider_name || provider.payment_provider_name || provider.provider || "",
              payment_method: provider.method_display || provider.method || provider.payment_method || "",
              payment_method_type: provider.method || provider.method_display || provider.payment_method_type || "",
              provider_logo: provider.logo || provider.provider_logo || undefined,
              logo: provider.logo || provider.provider_logo || undefined,
              is_active: true,
              payment_details: provider.payment_details || provider.admin_payment_details || [],
              account_name: provider.account_name || firstPaymentDetail.account_name || "",
              account_number:
                provider.account_number ||
                firstPaymentDetail.account_number ||
                firstPaymentDetail.mobile_number ||
                provider.mobile_number ||
                provider.wallet_address ||
                "",
              mobile_number: provider.mobile_number || firstPaymentDetail.mobile_number || null,
              wallet_address: provider.wallet_address || firstPaymentDetail.wallet_address || null,
              provider_id: provider.provider_id || provider.id,
            };
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
      console.log("🔍 No payment methods data available", {
        isHomePage,
        hasPublicPaymentMethods: !!publicPaymentMethods,
        hasPaymentMethodsData: !!paymentMethodsData,
        publicPaymentMethodsStructure: publicPaymentMethods
      });
      setStablePaymentMethods([]);
    }
  }, [paymentMethodsData, isHomePage, publicPaymentMethods]); // Update when payment data changes

  // Use stable state - React will properly render this
  const effectivePaymentMethods = stablePaymentMethods;

  // Use only real provider data (no generic fallback methods).
  const finalPaymentMethods = effectivePaymentMethods;

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
  const [getAmount, setGetAmount] = useState(0); // Start empty; fill after calculation
  const [getAmountInput, setGetAmountInput] = useState(""); // Don't show placeholder value before calculation
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const [isCalculatingFromPay, setIsCalculatingFromPay] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const bookmarkAnchorRef = useRef<HTMLSpanElement>(null);
  const [apiCommission, setApiCommission] = useState<number | null>(null);
  const [apiCommissionDetails, setApiCommissionDetails] = useState<CommissionLookupResponse | null>(null);
  const [exchangeLookupResponse, setExchangeLookupResponse] = useState<ExchangeCommissionLookupResponse | null>(null);
  const commissionFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commissionRefreshSeed, setCommissionRefreshSeed] = useState(0);

  useEffect(() => {
    if (!selectedAsset) return;
    setCommissionRefreshSeed((prev) => prev + 1);
  }, [selectedAsset?.asset_id, selectedAsset?.ticker, selectedAsset?.symbol, selectedAsset?.network]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const normalizeProviderName = (name: string) =>
    (name || "")
      .split(" - ")[0]
      .trim()
      .toLowerCase();
  const normalizedPayBank = normalizeProviderName(payBank || "");
  const effectiveSelectedPaymentDetail =
    selectedPaymentDetail ||
    finalPaymentMethods.find((method: any) => {
      const providerName = normalizeProviderName(method?.provider_name || "");
      return providerName === normalizedPayBank;
    }) ||
    null;

  const hasMoreThanFiveDecimals = (value: string) => {
    if (!value.includes(".")) return false;
    const decimalPart = value.split(".")[1];
    return !!decimalPart && decimalPart.length > 5;
  };
  const normalizeToFiveDecimals = (value: string) => {
    if (!value.includes(".")) return value;
    const [whole, decimal = ""] = value.split(".");
    if (decimal.length <= 5) return value;
    return `${whole}.${decimal.slice(0, 5)}`;
  };
  // Do not disable submit from API-estimated receive decimals.
  // Precision validation should only gate user-entered send amount.
  const exceedsDecimalPrecisionLimit = hasMoreThanFiveDecimals(payAmountInput);


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
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Terms & Conditions expansion
  const [expandedTerms, setExpandedTerms] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [legalModal, setLegalModal] = useState<{
    title: string;
    content: string[];
  } | null>(null);

  const openLegalModal = useCallback((title: string, content: string[]) => {
    setLegalModal({ title, content });
  }, []);


  // Add validation state for minimum receive amount
  const [receiveAmountError, setReceiveAmountError] = useState<string | null>(null);

  // Add state for API validation errors
  const [apiValidationError, setApiValidationError] = useState<string | null>(null);

  const resolveCanonicalAssetMeta = useCallback(
    (asset: any, network: any) => {
      const allExchangeAssets = Array.isArray(
        isHomePage ? publicAssets : assets?.assets
      )
        ? (isHomePage ? publicAssets : assets?.assets)
        : [];
      const preferredNetwork = normalizeNetworkKey(
        network?.network_id || network?.network_type || network?.network || getAssetNetwork(asset)
      );
      const selectedTicker = String(asset?.ticker || asset?.symbol || asset?.name || "")
        .trim()
        .toLowerCase();

      const findMatchingNetwork = (exchangeAsset: any) => {
        const networks = Array.isArray(exchangeAsset?.networks) ? exchangeAsset.networks : [];
        if (networks.length === 0) return null;
        if (!preferredNetwork) return networks[0];
        return (
          networks.find((n: any) => {
            const nType = normalizeNetworkKey(n?.network_type);
            const nId = normalizeNetworkKey(n?.network_id);
            return nType === preferredNetwork || nId === preferredNetwork;
          }) || networks[0]
        );
      };

      const selectedId = String(asset?.asset_id || "").trim();
      let matchedAsset =
        allExchangeAssets.find(
          (a: any) => isUuid(a?.asset_id) && isUuid(selectedId) && String(a.asset_id).trim() === selectedId
        ) ||
        allExchangeAssets.find((a: any) => {
          if (!isUuid(a?.asset_id)) return false;
          const ticker = String(a?.symbol || a?.ticker || a?.name || "")
            .trim()
            .toLowerCase();
          if (!ticker || ticker !== selectedTicker) return false;
          const net = findMatchingNetwork(a);
          return !!net;
        });

      if (!matchedAsset && isUuid(selectedId)) {
        return {
          assetId: selectedId,
          network: String(network?.network_type || network?.network_id || getAssetNetwork(asset) || "").trim(),
          networkId: String(network?.network_id || "").trim() || null,
        };
      }

      if (!matchedAsset) {
        return null;
      }

      const matchedNetwork = findMatchingNetwork(matchedAsset);
      return {
        assetId: String(matchedAsset.asset_id || "").trim(),
        network: String(
          matchedNetwork?.network_type || matchedNetwork?.network_id || network?.network_type || network?.network_id || getAssetNetwork(asset) || ""
        ).trim(),
        networkId: String(matchedNetwork?.network_id || "").trim() || null,
      };
    },
    [assets?.assets, isHomePage, publicAssets]
  );


  const getPaymentMethodKey = (method: any): string => {
    const providerKey =
      method?.provider_name ||
      method?.payment_provider_name ||
      method?.payment_provider ||
      method?.name ||
      "";
    return String(providerKey).trim();
  };

  // Auto-select the second payment method by default (fallback to first when only one exists)
  useEffect(() => {
    if (finalPaymentMethods.length === 0) {
      return;
    }

    const hasSelected = finalPaymentMethods.some(
      (method: any) => getPaymentMethodKey(method) === payBank
    );

    if (!payBank || !hasSelected) {
      const defaultMethod = finalPaymentMethods[1] || finalPaymentMethods[0];
      setPayBank(getPaymentMethodKey(defaultMethod));
      setSelectedPaymentDetail(defaultMethod);
    } else if (!selectedPaymentDetail) {
      const matchedMethod = finalPaymentMethods.find(
        (method: any) => getPaymentMethodKey(method) === payBank
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
    saveBookmarkError,
    clearSaveBookmarkError,
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
    debounceMs: 0,
    minLength: 1,
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
    // Home page uses public ChangeNOW supported-tokens endpoint (no auth).
    if (isHomePage) {
      return;
    }

    withTimeout(dispatch(fetchAssets(false)).unwrap(), 15_000)
      .then((data) => {
        if (!data?.assets || data.assets.length === 0) {
          return withTimeout(dispatch(fetchAssets(true)).unwrap(), 15_000);
        }
        return data;
      })
      .catch((error: unknown) => {
        return withTimeout(dispatch(fetchAssets(true)).unwrap(), 15_000).catch(
          (refreshError: unknown) => {
            showToast.error(`Failed to fetch assets: ${refreshError}`);
            throw refreshError;
          }
        );
      });
  }, [dispatch, isHomePage, isAuthenticated]);

  // Fetch swap assets
  useEffect(() => {
    // Skip API calls on home page - buttons will redirect to login
    if (isHomePage) {
      return;
    }

    withTimeout(dispatch(fetchSupportedAssets(false)).unwrap(), 15_000)
      .then((data) => {
        if (!data || data.length === 0) {
          return withTimeout(dispatch(fetchSupportedAssets(true)).unwrap(), 15_000);
        }
        return data;
      })
      .catch((error: unknown) => {
        return withTimeout(dispatch(fetchSupportedAssets(true)).unwrap(), 15_000).catch(
          (refreshError: unknown) => {
            if (refreshError instanceof Error) {
              if (
                refreshError.message.includes("Network Error") ||
                refreshError.message.includes("Network connection issue")
              ) {
                showToast.warning(
                  "Network Issue",
                  "Unable to fetch assets due to network problems. Please try again."
                );
              } else if (refreshError.message.includes("Server Error")) {
                showToast.error(
                  "Server Error",
                  "Unable to fetch assets from server. Please try again later."
                );
              } else if (!refreshError.message.includes("Cache")) {
                showToast.error(
                  "Asset Loading Error",
                  `Failed to fetch swap assets: ${refreshError.message}`
                );
              }
            }
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

  const isSimpleCalculationAsset = (asset: any) => {
    if (!asset) return false;
    const ticker = (asset?.ticker || asset?.symbol || "").toLowerCase();
    const network = (asset?.network || "").toLowerCase();
    return (ticker === "usdt" && network === "bsc") ||
      (ticker === "usdc" && network === "bsc") ||
      isExchangeCommissionLookupAsset(asset);
  };

  const isForexAsset = (asset: any) => isForexPrimusAsset(asset);
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

  // FXP uses manual calculation with fixed 1.06 rate
  const FXP_EXCHANGE_RATE = 1.06;
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

  const isCommissionApiAsset = (asset: any) => !!getCommissionApiAsset(asset?.ticker || asset?.symbol || "");

  useEffect(() => {
    if (isSubmitting) {
      if (commissionFetchTimeoutRef.current)
        clearTimeout(commissionFetchTimeoutRef.current);
      return;
    }
    if (!selectedAsset) {
      setApiCommission(null);
      setApiCommissionDetails(null);
      setExchangeLookupResponse(null);
      return;
    }
    const amount = isCalculatingFromPay
      ? (parseFloat(payAmountInput) || payAmount)
      : (parseFloat(getAmountInput) || getAmount);
    if (amount <= 0) {
      setExchangeLookupResponse(null);
      setApiCommission(null);
      setApiCommissionDetails(null);
      setApiValidationError(null);
      return;
    }

    const params = getExchangeLookupParams(selectedAsset);
    if (params && !isForexAsset(selectedAsset)) {
      if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
      commissionFetchTimeoutRef.current = setTimeout(() => {
        // Home: deposit = crypto -> USD with network for USDT/USDC
        fetchExchangeCommissionLookup(amount, "deposit", params.from_currency, "USD", params.from_network, params.from_asset_id)
          .then((res) => {
            setExchangeLookupResponse(res);
            setApiCommission(null);
            setApiCommissionDetails(null);
            setApiValidationError(null);
            if (isCalculatingFromPay && res.to_amount != null) {
              const toAmount = parseFloat(res.to_amount);
              if (!Number.isNaN(toAmount)) {
                setGetAmount(toAmount);
                setGetAmountInput(res.to_amount);
              }
            }
          })
          .catch((error: any) => {
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
            if (normalizedMessage.includes(MISSING_FXP_USD_RATE_ERROR)) {
              // For FXP without configured commission, fallback to zero-commission UI.
              setApiValidationError(null);
              if (isCalculatingFromPay) {
                setGetAmount(amount);
                setGetAmountInput(String(amount));
              } else {
                setPayAmount(amount);
                setPayAmountInput(String(amount));
              }
              return;
            }
            setApiValidationError(
              normalizedMessage
            );
          });
      }, 300);
      return () => { if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current); };
    }
    const apiAsset = getCommissionApiAsset(selectedAsset.ticker || selectedAsset.symbol || "");
    if (!apiAsset) { setApiCommission(null); return; }
    if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
    commissionFetchTimeoutRef.current = setTimeout(() => {
      fetchCommissionDetails(apiAsset, amount, "deposit")
        .then((details) => {
          setApiCommission(Number(details?.commission_rate ?? 0));
          setApiCommissionDetails(details);
          setExchangeLookupResponse(null);
        })
        .catch(() => {
          setApiCommission(null);
          setApiCommissionDetails(null);
        });
    }, 300);
    return () => { if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current); };
  }, [selectedAsset, payAmountInput, getAmountInput, payAmount, getAmount, isCalculatingFromPay, isSubmitting, commissionRefreshSeed]);

  useEffect(() => {
    if (
      !selectedAsset ||
      (isExchangeCommissionLookupAsset(selectedAsset) && !isForexAsset(selectedAsset))
    )
      return;
    if (isCommissionApiAsset(selectedAsset) && apiCommission !== null) {
      if (isCalculatingFromPay && payAmount > 0) {
        const commissionAmount = (payAmount * apiCommission) / 100;
        setGetAmount(Math.max(0, payAmount - commissionAmount));
        setGetAmountInput((Math.max(0, payAmount - commissionAmount)).toString());
      } else if (!isCalculatingFromPay && getAmount > 0) {
        const calculatedPayAmount = isForexAsset(selectedAsset)
          ? getFxpReversePayAmount(getAmount)
          : getAmount / (1 - apiCommission / 100);
        setPayAmount(calculatedPayAmount);
        setPayAmountInput(calculatedPayAmount.toString());
      }
    }
  }, [apiCommission, payAmount, getAmount, isCalculatingFromPay, selectedAsset]);

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
      isCalculatingFromPay ||
      getAmount <= 0
    )
      return;
    const lc = parseCommissionRule();
    if (!lc) return;
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

  // Fetch estimate for non-direct assets - debounced to avoid rapid API calls
  const estimateDebounceMs = isHomePage ? 280 : 800;

  useEffect(() => {
    if (isSubmitting) {
      setEstimateLoading(false);
      return;
    }

    if (
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset) &&
      !isForexAsset(selectedAsset) && // Skip FXP - uses manual calculation
      payAmount &&
      payAmount > 0 &&
      isCalculatingFromPay
    ) {
      setEstimateError(null);

      // Debounce: shorter on marketing home so estimates feel snappy; longer when logged in (typing stability)
      const debounceTimer = setTimeout(() => {
        setEstimateLoading(true);
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
            // Thunk always resolves; check fulfilled vs rejected
            if (result?.meta?.requestStatus === "fulfilled" && result.payload) {
              const payload = result.payload as any;
              setEstimate(payload);

              // Accept all backend variants so UI always updates on success.
              const estimatedAmountRaw =
                payload?.toAmount ?? payload?.estimated_amount ?? payload?.user_amount;
              const estimatedAmount = Number(estimatedAmountRaw);
              if (Number.isFinite(estimatedAmount) && estimatedAmount >= 0) {
                setGetAmount(estimatedAmount);
                setGetAmountInput(estimatedAmount.toString());
                setReceiveAmountError(null);
                setApiValidationError(null); // Clear API validation errors on success
              }
            }

            // Handle rejected thunk (validation errors like deposit_too_small)
            if (result?.meta?.requestStatus === "rejected") {
              const actionOrError: any = result;
              const error = actionOrError?.payload ?? actionOrError;

              // response_data can be on payload (from thunk) or on raw error
              const responseData = error?.response_data ?? actionOrError?.response_data;

              let errorMessage = "";
              let errorDetails = "";

              if (responseData?.error) {
                errorMessage = responseData.error;
                errorDetails = responseData.message || "";
              } else if (error?.error) {
                errorMessage = typeof error.error === "string" ? error.error : "";
                errorDetails = error.message || "";
              } else if (error?.message) {
                errorMessage = String(error.message);
              }

              if (errorMessage.includes("Exchange service error:")) {
                errorMessage = errorMessage.replace("Exchange service error: ", "");
              }

              // Always show deposit_too_small to user in red (min amount from API when present)
              if (errorMessage.includes("deposit_too_small") || errorDetails.includes("Out of min amount")) {
                const minAmount = responseData?.payload?.range?.minAmount;
                const errorText = minAmount != null && !isNaN(minAmount)
                  ? `Amount entered is too small. Minimum amount is ${Number(minAmount).toFixed(8)}.`
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
                const maxAmount = responseData?.payload?.range?.maxAmount;
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

              // Handle DRF-style field validation errors
              const amountErrorsFromRoot =
                (Array.isArray(error?.error?.amount) && error.error.amount) ||
                (Array.isArray(responseData?.error?.amount) && responseData.error.amount);

              if (amountErrorsFromRoot && amountErrorsFromRoot.length > 0) {
                const firstMessage = String(amountErrorsFromRoot[0]);
                setApiValidationError(firstMessage);
                setEstimateError(null);
                setGetAmount(0);
                setGetAmountInput("0");
                setIsCalculating(false);
                setIsCalculatingReceive(false);
                setEstimateLoading(false);
                return;
              }
            }

            // Clear loading states after successful calculation
            setIsCalculating(false);
            setIsCalculatingReceive(false);
          })
          .catch((actionOrError: any) => {
            console.log("[EXPRESS HOME DEPOSIT] ESTIMATE CATCH", { actionOrError });
            // Thunk rejects with action { payload: { message, response_data } }; normalize to payload
            const error = actionOrError?.payload ?? actionOrError;
            console.log("[EXPRESS HOME DEPOSIT] PARSED ERROR BEFORE MESSAGE", {
              message: error?.message,
              rawError: error,
              response_data: (error as any)?.response_data,
            });
            console.error("Failed to fetch swap estimate:", actionOrError);

            // IMMEDIATELY clear all loading states so user never stays on "Calculating..."
            setIsCalculating(false);
            setIsCalculatingReceive(false);
            setEstimateLoading(false);

            let errorMessage = "";
            let errorDetails = "";
            // response_data can be on payload (from thunk) or on raw error
            const responseData = error?.response_data ?? actionOrError?.response_data;

            if (responseData?.error) {
              errorMessage = responseData.error;
              errorDetails = responseData.message || "";
            } else if (error?.error) {
              errorMessage = typeof error.error === "string" ? error.error : "";
              errorDetails = error.message || "";
            } else if (error?.message) {
              errorMessage = String(error.message);
            }

            if (errorMessage.includes("Exchange service error:")) {
              errorMessage = errorMessage.replace("Exchange service error: ", "");
            }

            // Always show deposit_too_small to user in red (min amount from API when present)
            if (errorMessage.includes("deposit_too_small") || errorDetails.includes("Out of min amount")) {
              const minAmount = responseData?.payload?.range?.minAmount;
              const errorText = minAmount != null && !isNaN(minAmount)
                ? `Amount entered is too small. Minimum amount is ${Number(minAmount).toFixed(8)}.`
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
              const maxAmount = responseData?.payload?.range?.maxAmount;
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

            // Handle DRF-style field validation errors
            const amountErrorsFromRoot =
              (Array.isArray(error?.error?.amount) && error.error.amount) ||
              (Array.isArray(responseData?.error?.amount) && responseData.error.amount);

            if (amountErrorsFromRoot && amountErrorsFromRoot.length > 0) {
              const firstMessage = String(amountErrorsFromRoot[0]);
              setApiValidationError(firstMessage);
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
            const msg = error?.message || "";
            if (msg.includes("Request timeout")) {
              setEstimateError(null);
            } else if (msg.includes("Network Error") || (actionOrError as any)?.code === "ECONNREFUSED" || (actionOrError as any)?.code === "ENOTFOUND") {
              setEstimateError(null);
            } else if (msg.includes("Server Error")) {
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
      }, estimateDebounceMs);

      // Cleanup function to clear debounce timer on unmount or dependency change
      return () => {
        clearTimeout(debounceTimer);
        setEstimateLoading(false);
      };
    } else {
      // Clear estimate for USDT or when conditions not met
      setEstimate(null);
      setEstimateError(null);
      setEstimateLoading(false);
    }
  }, [selectedAsset, payAmount, isCalculatingFromPay, isHomePage, isSubmitting]);

  // Fetch reverse estimate for non-direct assets when calculating from receive amount - debounced
  useEffect(() => {
    if (isSubmitting) {
      setEstimateLoading(false);
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
      setEstimateError(null);

      const debounceTimer = setTimeout(() => {
        setEstimateLoading(true);
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
            if (result?.meta?.requestStatus === "fulfilled" && result.payload) {
              const payload = result.payload as any;
              const requiredUsdtAmountRaw =
                payload?.estimated_amount ?? payload?.toAmount ?? payload?.user_amount;
              const requiredUsdtAmount = Number(requiredUsdtAmountRaw);

              if (Number.isFinite(requiredUsdtAmount) && requiredUsdtAmount >= 0) {
                // Update UI immediately
                setPayAmount(requiredUsdtAmount);
                setPayAmountInput(requiredUsdtAmount.toString());
                setEstimate(payload);
                setApiValidationError(null); // Clear API validation errors on success
              }
            }

            // Clear loading states immediately after successful calculation
            setIsCalculating(false);
            setIsCalculatingReceive(false);
          })
          .catch((actionOrError: any) => {
            const error = actionOrError?.payload ?? actionOrError;
            const responseData = error?.response_data ?? actionOrError?.response_data;
            let errorMessage = "";
            let errorDetails = "";
            if (responseData?.error) {
              errorMessage = responseData.error;
              errorDetails = responseData.message || "";
            } else if (error?.error) {
              errorMessage = typeof error.error === "string" ? error.error : "";
              errorDetails = error.message || "";
            } else if (error?.message) {
              errorMessage = error.message;
            }
            if (errorMessage.includes("Exchange service error:")) {
              errorMessage = errorMessage.replace("Exchange service error: ", "");
            }

            setIsCalculating(false);
            setIsCalculatingReceive(false);
            setEstimateLoading(false);

            // Handle DRF-style field validation errors
            const amountErrorsFromRoot =
              (Array.isArray(error?.error?.amount) && error.error.amount) ||
              (Array.isArray(responseData?.error?.amount) && responseData.error.amount);

            if (amountErrorsFromRoot && amountErrorsFromRoot.length > 0) {
              const firstMessage = String(amountErrorsFromRoot[0]);
              setApiValidationError(firstMessage);
              setEstimateError(null);
              setPayAmount(0);
              setPayAmountInput("0");
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              setEstimateLoading(false);
              return;
            }

            // Handle deposit_too_small error (show min amount from API)
            if (errorMessage.includes("deposit_too_small") || errorDetails.includes("Out of min amount")) {
              const minAmount = responseData?.payload?.range?.minAmount;
              const errorText = minAmount != null && !isNaN(minAmount)
                ? `Amount entered is too small. Minimum amount is ${Number(minAmount).toFixed(8)}.`
                : "Amount entered is too small. Please enter a larger amount.";
              setApiValidationError(errorText);
              setEstimateError(null);
              setPayAmount(0);
              setPayAmountInput("0");
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              setEstimateLoading(false);
              return;
            }

            if (errorMessage.includes("deposit_too_large") || errorDetails.includes("Out of max amount")) {
              const maxAmount = responseData?.payload?.range?.maxAmount;
              const errorText = maxAmount
                ? `Amount entered is too large. Maximum amount is ${maxAmount.toFixed(8)}.`
                : "Amount entered is too large. Please enter a smaller amount.";
              setApiValidationError(errorText);
              setEstimateError(null);
              setPayAmount(0);
              setPayAmountInput("0");
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              setEstimateLoading(false);
              return;
            }

            // Clear API validation errors for network/timeout issues
            setApiValidationError(null);

            // Handle timeout / network / server errors with simple fallback
            if (error && typeof (error as any).message === "string") {
              const msg = (error as any).message as string;
              if (
                msg.includes("Request timeout") ||
                msg.includes("Network Error") ||
                msg.includes("Server Error")
              ) {
                setEstimateError(null);
              }
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
      }, estimateDebounceMs);

      // Cleanup function to clear debounce timer on unmount or dependency change
      return () => {
        clearTimeout(debounceTimer);
        setEstimateLoading(false);
      };
    }
  }, [selectedAsset, getAmount, isCalculatingFromPay, isHomePage, isSubmitting]);

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

  // Clear calculation-only errors when amount is cleared or form is reset
  useEffect(() => {
    if (!payAmount || payAmount === 0 || payAmountInput === "" || payAmountInput === "0") {
      // Keep apiValidationError so backend min-amount / format errors stay visible
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
              const networkLower = (getAssetNetwork(asset) || asset?.network || "").toString().toLowerCase();
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
  });

  const getAssetKeyForGrouping = (asset: any): string => {
    return `${(asset?.ticker || asset?.symbol || asset?.name || "")
      .toString()
      .toLowerCase()}|${(asset?.network || getAssetNetwork(asset) || "")
      .toString()
      .toLowerCase()}`;
  };

  // Force "Popular" group to always be: USDT (BSC) and USDC (BSC)
  // This avoids BTC (or other assets) accidentally landing inside Popular because of imperfect ticker/network sorting.
  const popularAssets = useMemo(() => {
    const sourceAssets: SupportedAsset[] = (assetsDisplay.displayData ||
      []) as SupportedAsset[];

    const normalizeCurrency = (asset: any): string =>
      (getCurrencyFromAsset(asset) || "").toString().toLowerCase();

    const isBscLike = (asset: any): boolean => {
      const n = (getAssetNetwork(asset) || asset?.network || "").toString().toLowerCase();
      return getNetworkMatchKeys(n).includes("bsc");
    };

    const usdtAsset = sourceAssets.find(
      (a) => normalizeCurrency(a) === "usdt" && isBscLike(a)
    );
    const usdcAsset = sourceAssets.find(
      (a) => normalizeCurrency(a) === "usdc" && isBscLike(a)
    );

    let fxprimusAsset = sourceAssets.find((a) => isForexPrimusAsset(a));
    if (isHomePage && !fxprimusAsset) {
      fxprimusAsset = homePopularFxPrimusFallback();
    }

    const selected: SupportedAsset[] = [usdtAsset, usdcAsset, fxprimusAsset].filter(
      Boolean
    ) as SupportedAsset[];
    return selected;
  }, [assetsDisplay.displayData, getCurrencyFromAsset, isHomePage]);

  const popularKeySet = useMemo(
    () => new Set(popularAssets.map((a) => getAssetKeyForGrouping(a))),
    [popularAssets]
  );

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
    return sortedSwapAssets.filter((a) => {
      const key = getAssetKeyForGrouping(a);
      return whitelistKeys.has(key) && !popularKeySet.has(key);
    });
  }, [sortedSwapAssets, whitelistKeys, popularKeySet]);

  const whitelistKeySet = useMemo(
    () => new Set(whitelistAssets.map((a) => `${(a?.ticker || a?.symbol || a?.name || "").toString().toLowerCase()}|${(a?.network || getAssetNetwork(a) || "").toString().toLowerCase()}`)),
    [whitelistAssets]
  );

  const allAssetsList = useMemo(() => {
    if (assetSearchTerm) return sortedSwapAssets;
    if (sortedSwapAssets.length <= 3) return sortedSwapAssets;
    return sortedSwapAssets.filter((a) => {
      const key = getAssetKeyForGrouping(a);
      return !popularKeySet.has(key) && !whitelistKeySet.has(key);
    });
  }, [assetSearchTerm, sortedSwapAssets, whitelistKeySet, popularKeySet]);

  const assetDropdownRows = useMemo(
    () =>
      buildAssetDropdownRows(
        sortedSwapAssets,
        assetSearchTerm,
        whitelistAssets,
        allAssetsList
      ),
    [sortedSwapAssets, assetSearchTerm, whitelistAssets, allAssetsList]
  );

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
      // Increase width so it expands more to the right side.
      // Keep left anchored to the trigger so the panel grows rightwards.
      let desiredWidth = Math.min(maxWidth, Math.max(minWidth, dropdownRect.width) * 1);

      // Position dropdown starting at the top of the card container
      let top = cardRect.top;

      // Left-align with the asset selector element's left edge
      let left = dropdownRect.left;

      // Ensure it doesn't go off the left edge
      if (left < minMargin) {
        left = minMargin;
      }

      // Ensure it doesn't go off screen on the right by shrinking width (not shifting left)
      const maxAllowedWidth = viewportWidth - left - minMargin;
      desiredWidth = Math.max(0, Math.min(desiredWidth, maxAllowedWidth));

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
              <AssetDropdownVirtualized
                rows={assetDropdownRows}
                selectedAsset={selectedAsset}
                onAssetSelect={(asset) => {
                  handleAssetSelection(asset);
                  setIsAssetDropdownOpen(false);
                  setAssetSearchTerm("");
                  if (isHomePage) setAssetFilterTab("all");
                }}
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

  const networkFee = 0;
  const exchangeCommissionRule =
    (exchangeLookupResponse?.local_commission as any)?.commission_mode
      ? (exchangeLookupResponse?.local_commission as any)
      : (exchangeLookupResponse?.crypto_commission as any)?.commission_mode
        ? (exchangeLookupResponse?.crypto_commission as any)
        : null;
  const getExchangeLookupGrossAmount = (netAmount: number): number => {
    if (!exchangeCommissionRule) return netAmount;
    const lc = exchangeCommissionRule as any;
    const fee = lc.fee != null ? parseFloat(lc.fee) : NaN;
    if (Number.isFinite(fee)) return netAmount + fee;
    if (lc.commission_mode === "percentage" && lc.rate != null) {
      const rate = parseFloat(lc.rate);
      if (Number.isFinite(rate) && rate < 100) {
        return netAmount / (1 - rate / 100);
      }
    }
    return netAmount;
  };
  let commissionAmount: number;
  if (selectedAsset && isExchangeCommissionLookupAsset(selectedAsset) && exchangeCommissionRule) {
    const lc = exchangeCommissionRule;
    if (lc.commission_mode === "flat_fee" && lc.fee != null) commissionAmount = parseFloat(lc.fee) || 0;
    else if (lc.commission_mode === "percentage" && lc.rate != null) commissionAmount = (payAmount * parseFloat(lc.rate)) / 100;
    else commissionAmount = 0;
  } else if (selectedAsset && isCommissionApiAsset(selectedAsset)) {
    commissionAmount = (payAmount * (apiCommission ?? 2)) / 100;
  } else {
    const commissionRate = selectedAsset?.range_commissions?.[0]?.commission ? parseFloat(selectedAsset.range_commissions[0].commission) : 2;
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

    if (isSimpleCalculationAsset(selectedAsset)) {
      if (isExchangeCommissionLookupAsset(selectedAsset)) {
        setReceiveAmountError(null);
        return;
      }
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
      return;
    }

    // For FXP (forex), use commission-based calculation
    if (isForexAsset(selectedAsset)) {
      if (fromPay) {
        // Forward calculation: USD to FXP (divide by 1.06)
        const calculatedGetAmount = fromAmount / FXP_EXCHANGE_RATE;
        setGetAmount(calculatedGetAmount);
        setGetAmountInput(calculatedGetAmount.toFixed(2));
      } else {
        // Reverse calculation: You Receive -> You Send using commission when available.
        const commissionRate =
          apiCommission != null &&
          !Number.isNaN(Number(apiCommission)) &&
          Number(apiCommission) < 100
            ? Number(apiCommission)
            : null;
        const calculatedPayAmount = getFxpReversePayAmount(fromAmount);
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
    // First 3 assets (exchange lookup) must be >= 5; validate live while typing/rate updates
    if (selectedAsset && isExchangeCommissionLookupAsset(selectedAsset) && payAmount > 0 && payAmount < 5) {
      setReceiveAmountError("Minimum amount for this asset is 5.");
    } else {
      setReceiveAmountError(null);
    }
  }, [getAmount, payAmount, selectedAsset]);

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
    } else if (selectedAsset && isExchangeCommissionLookupAsset(selectedAsset) && payAmount < 5) {
      errors.push("Minimum amount for this asset is 5.");
      showToast.error("Minimum amount for this asset is 5.");
    }

    // Check if asset is selected
    if (!selectedAsset) {
      errors.push("Please select an asset");
      showToast.error("Please select an asset");
    }

    // Check if payment method is selected
    if (!effectiveSelectedPaymentDetail || !payBank) {
      errors.push("Please select a payment method");
      showToast.error("Please select a payment method");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleFirstCardSubmit = async () => {
    if (exceedsDecimalPrecisionLimit) {
      showToast.error("Number cannot have more than 5 decimal places.");
      return;
    }
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
        if (!effectiveSelectedPaymentDetail) {
          throw new Error("Please select a payment method");
        }

        if (!effectiveSelectedPaymentDetail.provider_name) {
          throw new Error("Payment provider is missing");
        }
        depositPayload.append("payment_provider", effectiveSelectedPaymentDetail.provider_name);

        if (!effectiveSelectedPaymentDetail.payment_method_type) {
          throw new Error("Payment method is missing");
        }
        depositPayload.append("payment_method", effectiveSelectedPaymentDetail.payment_method_type);
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
        const resolvedMeta = resolveCanonicalAssetMeta(selectedAsset, selectedNetwork);
        if (!resolvedMeta || !isUuid(resolvedMeta.assetId)) {
          throw new Error("Asset ID is missing or invalid");
        }
        const networkValue =
          resolvedMeta.network ||
          selectedNetwork?.network_id ||
          selectedNetwork?.network_type ||
          "";
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
        depositPayload.append(
          "asset_id",
          resolvedMeta.assetId
        );
        // Backend expects nullable network_id; for multipart omit this field when unknown.
        // Sending empty string triggers UUID validation errors.
        if (resolvedMeta.networkId && isUuid(resolvedMeta.networkId)) {
          depositPayload.append("network_id", resolvedMeta.networkId);
        }
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

    if (!effectiveSelectedPaymentDetail) {
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
    if (exceedsDecimalPrecisionLimit) {
      showToast.error("Number cannot have more than 5 decimal places.");
      return;
    }
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
    if (isOtcPopupAsset(selectedAsset) && (payAmount > 15000 || getAmount > 15000)) {
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

      if (!effectiveSelectedPaymentDetail?.provider_name) {
        throw new Error("Payment provider is missing");
      }
      depositPayload.append(
        "payment_provider",
        effectiveSelectedPaymentDetail.provider_name
      );

      if (!effectiveSelectedPaymentDetail?.payment_method_type) {
        throw new Error("Payment method is missing");
      }
      depositPayload.append(
        "payment_method",
        effectiveSelectedPaymentDetail.payment_method_type
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

      const resolvedMeta = resolveCanonicalAssetMeta(selectedAsset, selectedNetwork);
      if (!resolvedMeta || !isUuid(resolvedMeta.assetId)) {
        throw new Error("Asset ID is missing or invalid");
      }

      // Handle network field - use canonical exchange network when available
      let networkValue = "";

      if (resolvedMeta.network) {
        networkValue = resolvedMeta.network;
      } else if (selectedNetwork?.network_id) {
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
      depositPayload.append(
        "asset_id",
        resolvedMeta.assetId
      );
      // Backend expects nullable network_id; for multipart omit this field when unknown.
      // Sending empty string triggers UUID validation errors.
      if (resolvedMeta.networkId && isUuid(resolvedMeta.networkId)) {
        depositPayload.append("network_id", resolvedMeta.networkId);
      }

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

                    const normalizedValue = normalizeToFiveDecimals(value);
                    // Only allow numbers and decimals (including 0.006 format)
                    if (normalizedValue === "" || /^\d*\.?\d*$/.test(normalizedValue)) {
                      if (value !== normalizedValue) {
                        setApiValidationError("Number cannot have more than 5 decimal places.");
                      }
                      // Check for decimal places validation
                      if (normalizedValue.includes(".")) {
                        const decimalPart = normalizedValue.split(".")[1];
                        if (decimalPart && decimalPart.length > 5) {
                          setApiValidationError("Number cannot have more than 5 decimal places.");
                          return;
                        }
                      }

                      const newAmount = parseFloat(normalizedValue) || 0;

                      // Only update and calculate if the numeric value actually changed
                      if (newAmount !== payAmount || normalizedValue !== payAmountInput) {
                        setPayAmountInput(normalizedValue); // Store the string value for display
                        setPayAmount(newAmount);
                        setIsCalculatingFromPay(true);

                        // Clear API validation error when user changes amount
                        setApiValidationError(null);

                        // Mark that user has manually modified the amount
                        setIsUserModifiedAmount(true);

                        // Show info modal if amount exceeds $15,000
                        if (isOtcPopupAsset(selectedAsset) && newAmount > 15000) {
                          setIsInfoModalOpen(true);
                        }

                        if (selectedAsset && newAmount > 0 && isSimpleCalculationAsset(selectedAsset)) {
                          if (!isExchangeCommissionLookupAsset(selectedAsset)) {
                            const commissionAmount = isCommissionApiAsset(selectedAsset)
                              ? (newAmount * (apiCommission ?? 2)) / 100
                              : (newAmount * (selectedAsset?.range_commissions?.[0]?.commission ? parseFloat(selectedAsset.range_commissions[0].commission) : 2)) / 100;
                            const calculatedGetAmount = Math.max(0, newAmount - commissionAmount);
                            setGetAmount(calculatedGetAmount);
                            setGetAmountInput(calculatedGetAmount.toString());
                          }
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


                {apiValidationError && (
                  <div className="mt-2 text-xs text-red-500">
                    {apiValidationError}
                  </div>
                )}

                {/* Show loading spinner when calculating "You Receive" from "You Send" */}
                {(isCalculating || isCalculatingReceive) && isCalculatingFromPay && selectedAsset && !isForexAsset(selectedAsset) && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#1D8751]"></div>
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
                      const providerKey = getPaymentMethodKey(payment);

                      return {
                        value: providerKey,
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
                      (payment: any) => getPaymentMethodKey(payment) === value
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

                    setPayBank(String(value || "").trim());
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

                    const normalizedValue = normalizeToFiveDecimals(value);
                    // Only allow numbers and decimals (including 0.006 format)
                    if (normalizedValue === "" || /^\d*\.?\d*$/.test(normalizedValue)) {
                      if (value !== normalizedValue) {
                        setApiValidationError("Number cannot have more than 5 decimal places.");
                      }
                      // Check for decimal places validation
                      if (normalizedValue.includes(".")) {
                        const decimalPart = normalizedValue.split(".")[1];
                        if (decimalPart && decimalPart.length > 5) {
                          setApiValidationError("Number cannot have more than 5 decimal places.");
                          return;
                        }
                      }

                      const newAmount = parseFloat(normalizedValue) || 0;

                      // Only update and calculate if the numeric value actually changed
                      if (newAmount !== getAmount || normalizedValue !== getAmountInput) {
                        setGetAmountInput(normalizedValue); // Store the string value for display
                        setGetAmount(newAmount);
                        setIsCalculatingFromPay(false);

                        // Clear API validation error when user changes amount
                        setApiValidationError(null);

                        if (selectedAsset && newAmount > 0 && isForexAsset(selectedAsset)) {
                          // For FXP, reverse uses commission when available.
                          const commissionRate =
                            apiCommission != null &&
                            !Number.isNaN(Number(apiCommission)) &&
                            Number(apiCommission) < 100
                              ? Number(apiCommission)
                              : null;
                          const calculatedPayAmount = getFxpReversePayAmount(newAmount);
                          setPayAmount(calculatedPayAmount);
                          setPayAmountInput(calculatedPayAmount.toFixed(2));

                          // FXP doesn't need loading states - calculation is instant
                        } else if (selectedAsset && newAmount > 0 && isSimpleCalculationAsset(selectedAsset)) {
                          if (isExchangeCommissionLookupAsset(selectedAsset)) {
                            // Use exchange local_commission rules immediately when available.
                            if (exchangeCommissionRule) {
                              const calculatedPayAmount = getExchangeLookupGrossAmount(newAmount);
                              setPayAmount(calculatedPayAmount);
                              setPayAmountInput(calculatedPayAmount.toString());
                              setIsCalculatingReceive(false);
                              setIsCalculating(false);
                            } else {
                              // Wait for commission-lookup response, but keep UI in calculating state.
                              setIsCalculating(true);
                              setIsCalculatingReceive(true);
                            }
                          } else {
                            const commissionRate = isCommissionApiAsset(selectedAsset) ? (apiCommission ?? 2) : (selectedAsset?.range_commissions?.[0]?.commission ? parseFloat(selectedAsset.range_commissions[0].commission) : 2);
                            const calculatedPayAmount = newAmount / (1 - commissionRate / 100);
                            setPayAmount(calculatedPayAmount);
                            setPayAmountInput(calculatedPayAmount.toString());
                          }
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
                          src={getAssetDropdownIcon(selectedAsset)}
                          alt={selectedAsset?.name || selectedAsset?.ticker || selectedAsset?.symbol || "Asset"}
                          className="w-6 h-6 rounded-full object-cover"
                          onError={(e) => {
                            console.log(
                              "Image failed to load for asset:",
                              selectedAsset
                            );
                            e.currentTarget.src = ASSET_ICON_FALLBACK_URL;
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
                          src={ASSET_ICON_FALLBACK_URL}
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
            src="/assets/Screenshot_2025-07-25_092724_rjinec.png"
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
        {!isFirstCardSubmitted && !showForexForm && (
          <div className="relative">
            <button
              type="button"
              className={`w-full text-base font-medium py-1.5 rounded-full flex items-center justify-center gap-2 transition-colors text-white ${isHomePage
                ? (isOtcPopupAsset(selectedAsset) && payAmount >= 15000) || exceedsDecimalPrecisionLimit
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#1D8751] hover:bg-[#1D8751]/80 cursor-pointer"
                : isSubmitting ||
                  !selectedAsset ||
                  (isOtcPopupAsset(selectedAsset) && payAmount >= 15000) ||
                  exceedsDecimalPrecisionLimit ||
                  (selectedAsset &&
                    !isSimpleCalculationAsset(selectedAsset) &&
                    !isForexAsset(selectedAsset) &&
                    estimateLoading)
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#1D8751] hover:bg-[#1D8751]/80"
                }`}
              onClick={async () => {
                if (exceedsDecimalPrecisionLimit) {
                  showToast.error("Number cannot have more than 5 decimal places.");
                  return;
                }

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

                if (selectedAsset && isForexAsset(selectedAsset)) {
                  if (!payAmount || payAmount <= 0) {
                    showToast.error("Please enter a valid amount");
                    return;
                  }
                  if (!effectiveSelectedPaymentDetail) {
                    showToast.error("Please select a payment method");
                    return;
                  }
                  if (!selectedPaymentDetail && effectiveSelectedPaymentDetail) {
                    setSelectedPaymentDetail(effectiveSelectedPaymentDetail);
                  }
                  setShowForexForm(true);
                } else {
                  handleFirstCardSubmit();
                }
              }}
              disabled={
                requiresLoginRedirect
                  ? (isOtcPopupAsset(selectedAsset) && payAmount >= 15000) || exceedsDecimalPrecisionLimit
                  : isSubmitting ||
                  !selectedAsset ||
                  (walletAddress.trim() && !!walletError) ||
                  exceedsDecimalPrecisionLimit
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
                    src="/assets/Group_5_gkxzdz.png"
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
            {effectiveSelectedPaymentDetail && (
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
                          effectiveSelectedPaymentDetail.provider_logo ||
                          effectiveSelectedPaymentDetail.logo ||
                          "/assets/image_7_jijlik.png"
                        }
                        alt={`${effectiveSelectedPaymentDetail.provider_name || 'Bank'} Logo`}
                        className="w-8 h-8 rounded-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/assets/image_7_jijlik.png";
                        }}
                      />
                      <span className={`${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"} text-base font-semibold`}>
                        {effectiveSelectedPaymentDetail.provider_name}
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
                      {effectiveSelectedPaymentDetail.account_name}
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
                        {effectiveSelectedPaymentDetail.account_number}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            effectiveSelectedPaymentDetail.account_number
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

                let exchangeDetailsForForex: any[] = Array.isArray(
                  exchangeAdminPaymentDetails
                )
                  ? exchangeAdminPaymentDetails
                  : [];
                try {
                  const fresh = await dispatch(
                    fetchAdminPaymentDetails(false)
                  ).unwrap();
                  if (Array.isArray(fresh) && fresh.length > 0) {
                    exchangeDetailsForForex = fresh;
                  }
                } catch {
                  // keep selector snapshot
                }

                const adminPaymentDetailId = resolveForexDepositAdminPaymentDetailId({
                  effective: effectiveSelectedPaymentDetail,
                  selected: selectedPaymentDetail,
                  payBank,
                  methods: finalPaymentMethods,
                  adminMethods: Array.isArray(adminMethods) ? adminMethods : [],
                  exchangeAdminPaymentDetails: exchangeDetailsForForex,
                });
                if (!adminPaymentDetailId) {
                  showToast.error(
                    "We could not link this bank to a valid payment detail. Please open Payment Method and select your bank again."
                  );
                  return;
                }

                setIsSubmitting(true);

                try {
                  const { createForexExchangeThunk } = await import("../../../slices/forexSlice");

                  const forexPayload = {
                    transaction_type: "deposit" as const,
                    from_currency: "USD",
                    from_amount: payAmount.toFixed(2),
                    to_currency: "FXPRIMUS",
                    to_amount: getAmount.toFixed(2),
                    exchange_rate: FXP_EXCHANGE_RATE.toFixed(4),
                    additional_info: effectiveSelectedPaymentDetail ? `Wire transfer from ${effectiveSelectedPaymentDetail.provider_name}` : "Wire transfer",
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
                      "/assets/image_7_jijlik.png"
                    }
                    alt={`${selectedPaymentDetail.provider_name || 'Bank'} Logo`}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/image_7_jijlik.png";
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
            <div className="relative flex items-center min-w-0 bg-transparent dark:bg-transparent border border-[#39394a] dark:border-[#39394A] rounded-2xl px-2 sm:px-4 py-2 mb-4 gap-1 sm:gap-2">
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
                  clearSaveBookmarkError();
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
                className={`flex-1 min-w-0 bg-transparent border-none outline-none text-[#35353e] dark:text-[#788099] placeholder-[#788099] text-sm sm:text-base ${walletError
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
                    clearSaveBookmarkError();
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

            {saveBookmarkError && (
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
                {saveBookmarkError}
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
              className={`w-full text-base font-medium py-2 rounded-2xl flex items-center justify-center gap-2 transition-colors text-white ${isSubmitting || (isOtcPopupAsset(selectedAsset) && (payAmount >= 15000 || getAmount >= 15000)) || !isTermsAccepted
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-[#1D8751] hover:bg-[#166b3e]"
                }`}
              onClick={handleProceedToNext}
              disabled={isSubmitting || !walletAddress.trim() || !!walletError || (isOtcPopupAsset(selectedAsset) && (payAmount >= 15000 || getAmount >= 15000)) || !isTermsAccepted}
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
                    src="/assets/Group_5_gkxzdz.png"
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