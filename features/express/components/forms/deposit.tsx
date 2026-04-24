"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaExchangeAlt, FaExclamationCircle } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../../store";
import {
  fetchPublicPaymentMethods,
  fetchAdminPaymentMethods,
} from "../../../p2p/slices/paymentMethodsSlice";
import { fetchAdminPaymentDetails } from "../../../exchange/slices/paymentSlice";
import { fetchAssets } from "../../../exchange/slices/exchangeSlice";
import {
  createDeposit,
  updateDepositAddress,
} from "../../../exchange/slices/exchangeSlice";
import {
  fetchSupportedAssets,
  fetchSwapEstimate,
} from "../../../swap/slices/swapSlice";

import { showToast } from "../../../../lib/utils/toast";
import { DepositResponse } from "../../../exchange/types";
import { SupportedAsset } from "../../../swap/types";
import { FaSearch } from "react-icons/fa";
import InfoModal from "./info";
import { useTheme } from "@/context/theme";
import {
  useAssetsDisplay,
  usePaymentMethodsDisplay,
} from "../../hooks/useDataDisplay";
import CustomSelect from "@/components/ui/CustomSelect";
import {
  buildExpressRedirectPath,
  setAuthRedirectPath,
  setExpressLegalReturnState,
} from "@/lib/utils/authRedirect";
import { useExpressI18n } from "@/lib/useExpressI18n";
import {
  ASSET_ICON_BASE_CLASS,
  ASSET_ICON_SIZE,
  getHighResAssetIcon,
  getHighResPaymentLogo,
  PAYMENT_LOGO_BASE_CLASS,
  PAYMENT_LOGO_SIZE,
} from "../../utils/imageHelpers";
import { useValidateAddress } from "@/hooks/useValidateAddress";
import { useBookmarkedAddresses } from "../../hooks/useBookmarkedAddresses";
import { BookmarkDropdown } from "./BookmarkDropdown";
import { bookmarkedAddressesApi } from "../../services/bookmarkedAddressesApi";
import {
  fetchCommissionDetails,
  getCommissionApiAsset,
  isForexPrimusAsset,
  fetchExchangeCommissionLookup,
  getExchangeLookupParams,
  isExchangeCommissionLookupAsset,
  type CommissionLookupResponse,
  type ExchangeCommissionLookupResponse,
} from "../../api";
import { withTimeout } from "../../utils/fetchWithTimeout";
import {
  findPaymentMethodInList,
  getPaymentMethodKey,
  normalizePaymentDetails,
  paymentMethodMatchesPayBank,
  resolveForexDepositAdminPaymentDetailId,
} from "../../utils/forexDepositResolution";
import {
  AssetDropdownVirtualized,
  buildAssetDropdownRows,
} from "./AssetDropdownVirtualized";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface DepositFormProps {
  onExchange?: (transactionData: {
    type: "deposit";
    amount: number;
    receiveAmount?: number; // Net amount from form "You Receive"
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
  onModeChange?: (mode: "deposit" | "withdrawal", currentState?: any) => void;
  isHomePage?: boolean;
  initialState?: any;
}

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
  };

  return networkMap[network?.toLowerCase()] || network || "Unknown";
};

// Network aliases for whitelist matching (bookmark may use trc20, swap uses trx, etc.)
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

const extractSubmitErrorMessage = (error: any, fallback: string): string => {
  const clean = (value: unknown): string => {
    const text = String(value ?? "").trim();
    if (!text) return "";
    if (/request failed with status code 400/i.test(text)) return "";
    return text;
  };

  const responseData = error?.response?.data;
  const direct =
    responseData?.message ||
    responseData?.error ||
    responseData?.response_data?.message ||
    responseData?.response_data?.error ||
    responseData?.detail ||
    responseData?.details;
  const cleanedDirect = clean(direct);
  if (cleanedDirect) return cleanedDirect;

  if (typeof error === "string") {
    const cleaned = clean(error);
    if (cleaned) return cleaned;
  }

  if (error?.message) {
    const cleaned = clean(error.message);
    if (cleaned) return cleaned;
  }

  return fallback;
};
const getNetworkMatchKeys = (network: string): string[] => {
  const n = (network || "").toLowerCase();
  return NETWORK_ALIASES[n] ? [...NETWORK_ALIASES[n], n] : [n];
};

// Helper function to get network value from asset (handles both Asset and SupportedAsset types)
const getAssetNetwork = (asset: any): string => {
  // For SupportedAsset (swap assets) - has network property
  if (asset.network) {
    return asset.network;
  }

  // For Asset (exchange assets) - has networks array
  if (asset.networks && asset.networks.length > 0) {
    return asset.networks[0].network_type || asset.networks[0].network_id || "";
  }

  return "";
};

const resolveProviderLogo = (
  ...candidates: Array<string | null | undefined>
) => {
  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return undefined;
};

const extractLogoFromDetail = (detail?: any) => {
  if (!detail) return undefined;
  return resolveProviderLogo(
    detail.logo_url,
    detail.logo,
    detail.provider_logo,
    detail.provider_logo_url,
    detail.logoUrl
  );
};


export default function DepositForm({
  onExchange,
  mode,
  onModeChange,
  isHomePage = false,
  initialState,
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

  // Add swap assets state
  const { supportedAssets: swapAssets, loading: swapAssetsLoading } =
    useSelector((state: any) => state.swap);
  const { isDark } = useTheme();
  const { t } = useExpressI18n();

  // Use the data display hooks for consistent data handling
  const assetsDisplay = useAssetsDisplay(
    assets?.assets,
    swapAssets,
    assetsLoading,
    swapAssetsLoading,
    null, // exchange error
    null // swap error
  );

  // Use state to hold payment methods - will trigger re-render when updated
  const [stablePaymentMethods, setStablePaymentMethods] = useState<any[]>([]);

  // Use public API payment methods when available (same as home); fallback to admin
  const hasPublicMethods =
    publicPaymentMethods?.data?.providers &&
    Array.isArray(publicPaymentMethods.data.providers) &&
    publicPaymentMethods.data.providers.length > 0;
  const paymentMethodsData = hasPublicMethods ? publicPaymentMethods : adminMethods;
  const paymentMethodsLoading = hasPublicMethods
    ? publicMethodsLoading
    : adminMethodsLoading;
  const paymentMethodsError = hasPublicMethods
    ? publicMethodsError
    : adminMethodsError;

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
      paymentMethodsDataLength: Array.isArray(paymentMethodsData)
        ? paymentMethodsData.length
        : 0,
    });

    // Check if we have payment methods data (use public API when available, same as home)
    const hasPublicData =
      publicPaymentMethods?.data?.providers &&
      Array.isArray(publicPaymentMethods.data.providers) &&
      publicPaymentMethods.data.providers.length > 0;
    const hasPaymentData = hasPublicData
      ? true
      : paymentMethodsData &&
        Array.isArray(paymentMethodsData) &&
        paymentMethodsData.length > 0;

    if (hasPaymentData) {
      let activeMethods;

      if (hasPublicData) {
        // For public payment methods, handle the new API structure (same as home)
        let flattenedMethods: any[] = [];

        // Check for new structure: data.providers (direct providers array)
        if (Array.isArray(publicPaymentMethods?.data?.providers)) {
          const providers = publicPaymentMethods.data.providers;
          console.log("🔍 Processing providers from API:", {
            providersCount: providers.length,
            firstProvider: providers[0]
              ? {
                provider_name: providers[0].provider_name,
                logo: providers[0].logo,
                method: providers[0].method,
              }
              : null,
          });

          // Flatten providers directly (new structure)
          flattenedMethods = providers.map((provider: any) => {
            // Get the first payment detail for easy access
            const firstPaymentDetail =
              provider.payment_details && provider.payment_details.length > 0
                ? provider.payment_details[0]
                : {};

            const detailLogo = extractLogoFromDetail(firstPaymentDetail);
            const providerLogo = resolveProviderLogo(
              provider.logo_url,
              provider.logo,
              provider.provider_logo,
              provider.provider_logo_url,
              provider.logoUrl,
              provider.linked_bank_provider?.logo_url,
              provider.linked_bank_provider?.logo,
              provider.linked_bank_provider?.provider_logo,
              detailLogo
            );

            const flattened = {
              ...provider,
              provider_name: provider.provider_name,
              payment_method:
                provider.method?.method_name ||
                provider.method?.method_display ||
                "",
              payment_method_type:
                provider.method?.method_name ||
                provider.method?.method_display ||
                "",
              provider_logo: providerLogo,
              logo: providerLogo, // Also add as 'logo' for backward compatibility
              logo_url: provider.logo_url || detailLogo || providerLogo,
              is_active: true, // All public methods are considered active
              payment_details: provider.payment_details || [],
              // Flatten first payment detail for easy access
              account_name: firstPaymentDetail.account_name || "",
              account_number:
                firstPaymentDetail.account_number ||
                firstPaymentDetail.mobile_number ||
                "",
              mobile_number: firstPaymentDetail.mobile_number || null,
              wallet_address: firstPaymentDetail.wallet_address || null,
              how_to_send: firstPaymentDetail.how_to_send || null,
              account_type: firstPaymentDetail.account_type || null,
              provider_id: provider.provider_id,
              admin_payment_detail_id:
                provider.admin_payment_detail_id ??
                firstPaymentDetail.admin_payment_detail_id ??
                firstPaymentDetail.payment_detail_id ??
                firstPaymentDetail.id,
            };

            console.log("🔍 Flattened provider:", {
              provider_name: flattened.provider_name,
              provider_logo: flattened.provider_logo,
              logo: flattened.logo,
              logo_url: flattened.logo_url,
              hasLogo: !!(flattened.provider_logo || flattened.logo),
              detailLogo,
            });

            return flattened;
          });
        } else {
          // Fallback to old structure: data.payment_methods -> providers
          const methods =
            publicPaymentMethods?.data?.payment_methods ||
            publicPaymentMethods ||
            [];
          console.log("🔍 Public payment methods structure:", {
            publicPaymentMethods,
            methods,
            methodsLength: Array.isArray(methods) ? methods.length : 0,
          });

          // Flatten the nested structure: payment_methods -> providers
          if (Array.isArray(methods)) {
            methods.forEach((method: any) => {
              if (
                method.providers &&
                Array.isArray(method.providers) &&
                method.providers.length > 0
              ) {
                method.providers.forEach((provider: any) => {
                  // Get the first payment detail for easy access
                  const firstPaymentDetail =
                    provider.payment_details &&
                      provider.payment_details.length > 0
                      ? provider.payment_details[0]
                      : {};

                  const detailLogo = extractLogoFromDetail(firstPaymentDetail);
                  const providerLogo = resolveProviderLogo(
                    provider.logo_url,
                    provider.logo,
                    provider.provider_logo,
                    provider.provider_logo_url,
                    provider.logoUrl,
                    provider.linked_bank_provider?.logo_url,
                    provider.linked_bank_provider?.logo,
                    provider.linked_bank_provider?.provider_logo,
                    detailLogo
                  );

                  flattenedMethods.push({
                    ...provider,
                    provider_name: provider.provider_name,
                    payment_method: method.method_name,
                    payment_method_type: method.method_name,
                    provider_logo: providerLogo,
                    logo: providerLogo, // Also add as 'logo' for backward compatibility
                    logo_url: provider.logo_url || detailLogo || providerLogo,
                    is_active: true, // All public methods are considered active
                    payment_details: provider.payment_details || [],
                    // Flatten first payment detail for easy access
                    account_name: firstPaymentDetail.account_name || "",
                    account_number:
                      firstPaymentDetail.account_number ||
                      firstPaymentDetail.mobile_number ||
                      "",
                    mobile_number: firstPaymentDetail.mobile_number || null,
                    wallet_address: firstPaymentDetail.wallet_address || null,
                    how_to_send: firstPaymentDetail.how_to_send || null,
                    account_type: firstPaymentDetail.account_type || null,
                    provider_id: provider.provider_id,
                    admin_payment_detail_id:
                      provider.admin_payment_detail_id ??
                      firstPaymentDetail.admin_payment_detail_id ??
                      firstPaymentDetail.payment_detail_id ??
                      firstPaymentDetail.id,
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
          firstProvider:
            flattenedMethods.length > 0
              ? {
                provider_name: flattenedMethods[0].provider_name,
                provider_logo: flattenedMethods[0].provider_logo,
                logo: flattenedMethods[0].logo,
                payment_method: flattenedMethods[0].payment_method,
              }
              : null,
        });

        activeMethods = flattenedMethods;
      } else {
        // For admin payment methods, use the existing logic
        console.log("🔍 Processing admin payment methods:", {
          paymentMethodsData,
          paymentMethodsDataLength: Array.isArray(paymentMethodsData)
            ? paymentMethodsData.length
            : 0,
          firstPayment:
            Array.isArray(paymentMethodsData) && paymentMethodsData.length > 0
              ? {
                provider_name: paymentMethodsData[0].provider_name,
                provider_logo: paymentMethodsData[0].provider_logo,
                logo: paymentMethodsData[0].logo,
                admin_payment_detail_id:
                  paymentMethodsData[0].admin_payment_detail_id,
              }
              : null,
        });

        activeMethods = paymentMethodsData
          .filter((payment: any) => {
            if (payment.is_active === undefined || payment.is_active === null)
              return true;
            return (
              payment.is_active === true ||
              payment.is_active === "true" ||
              payment.is_active === 1 ||
              payment.is_active === "1"
            );
          })
          .map((payment: any) => {
            // Normalise admin payment methods so the UI can rely on a single shape
            const rawDetails =
              (payment as any).payment_details && (payment as any).payment_details.length > 0
                ? (payment as any).payment_details
                : (payment as any).admin_payment_details &&
                  (payment as any).admin_payment_details.length > 0
                  ? (payment as any).admin_payment_details
                  : [];

            const firstDetail = rawDetails.length > 0 ? rawDetails[0] : null;

            const detailLogo = extractLogoFromDetail(firstDetail);
            const resolvedLogo = resolveProviderLogo(
              payment.logo_url,
              payment.logo,
              payment.provider_logo,
              payment.provider_logo_url,
              payment.logoUrl,
              detailLogo
            );

            // Prefer root-level fields, fall back to first detail record
            const account_name =
              (payment as any).account_name ||
              (firstDetail && firstDetail.account_name) ||
              "";

            const account_number =
              (payment as any).account_number ||
              (firstDetail && (firstDetail.account_number || firstDetail.mobile_number)) ||
              "";

            const mobile_number =
              (payment as any).mobile_number ||
              (firstDetail && firstDetail.mobile_number) ||
              null;

            const wallet_address =
              (payment as any).wallet_address ||
              (firstDetail && firstDetail.wallet_address) ||
              null;

            const how_to_send =
              (payment as any).how_to_send ||
              (firstDetail && firstDetail.how_to_send) ||
              null;

            const account_type =
              (payment as any).account_type ||
              (firstDetail && firstDetail.account_type) ||
              null;

            return {
              ...payment,
              // Always expose a unified payment_details array for the rest of the component
              payment_details: rawDetails,
              account_name,
              account_number,
              mobile_number,
              wallet_address,
              how_to_send,
              account_type,
              // Ensure logo related fields are always present
              logo_url: payment.logo_url || detailLogo || resolvedLogo,
              logo: resolvedLogo || undefined,
              provider_logo: resolvedLogo || undefined,
            };
          });
      }

      console.log("🔍 Active methods after filtering:", {
        activeMethods,
        activeMethodsLength: activeMethods.length,
      });

      console.log("🔍 Setting stable payment methods:", {
        count: activeMethods.length,
        firstMethod: activeMethods[0]
          ? {
            provider_name: activeMethods[0].provider_name,
            provider_logo: activeMethods[0].provider_logo,
            logo: activeMethods[0].logo,
          }
          : null,
      });
      setStablePaymentMethods(activeMethods);
    } else {
      console.log("🔍 No payment methods data available", {
        isHomePage,
        hasPublicPaymentMethods: !!publicPaymentMethods,
        hasPaymentMethodsData: !!paymentMethodsData,
        publicPaymentMethodsStructure: publicPaymentMethods,
      });
      setStablePaymentMethods([]);
    }
  }, [paymentMethodsData, publicPaymentMethods]); // Update when payment data changes

  // Use stable state - React will properly render this
  const effectivePaymentMethods = stablePaymentMethods;

  const finalPaymentMethods = effectivePaymentMethods;

  console.log("🔍 Effective Payment Methods:", {
    isHomePage,
    effectivePaymentMethods,
    effectivePaymentMethodsLength: effectivePaymentMethods.length,
    finalPaymentMethods,
    finalPaymentMethodsLength: finalPaymentMethods.length,
    stablePaymentMethodsLength: stablePaymentMethods.length,
    // Log first method details if available
    firstMethod:
      finalPaymentMethods.length > 0
        ? {
          provider_name: finalPaymentMethods[0].provider_name,
          provider_logo: finalPaymentMethods[0].provider_logo,
          logo: finalPaymentMethods[0].logo,
          hasLogo: !!(
            finalPaymentMethods[0].provider_logo ||
            finalPaymentMethods[0].logo
          ),
        }
        : null,
  });

  const [payAmount, setPayAmount] = useState(
    initialState?.amountValue ?? 100
  );
  const [payAmountInput, setPayAmountInput] = useState(
    initialState?.amountInput ?? "100"
  );
  const hasAppliedPrefillRef = useRef(false);

  const [payBank, setPayBank] = useState(
    initialState?.payBank ||
    initialState?.payment?.provider_name ||
    initialState?.payment?.payment_provider_name ||
    ""
  );
  // Restore both send and receive amounts from initialState
  const [getAmount, setGetAmount] = useState(() => {
    if (initialState?.receiveAmountValue !== undefined) {
      return initialState.receiveAmountValue;
    }
    if (initialState?.amountValue) {
      return Math.max(0, initialState.amountValue - 2);
    }
    return 0;
  });
  const [getAmountInput, setGetAmountInput] = useState(() => {
    if (initialState?.receiveAmountInput) {
      return initialState.receiveAmountInput;
    }
    if (initialState?.receiveAmountValue !== undefined) {
      return initialState.receiveAmountValue.toString();
    }
    if (initialState?.amountValue) {
      return Math.max(0, initialState.amountValue - 2).toString();
    }
    return "";
  });

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
      }
    }
  }, [initialState?.amountValue, initialState?.amountInput, initialState?.receiveAmountValue, initialState?.receiveAmountInput]);

  // Don't set asset directly from initialState - let matching logic handle it
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const [isCalculatingFromPay, setIsCalculatingFromPay] = useState(true);
  const [walletAddress, setWalletAddress] = useState(
    initialState?.walletAddress || ""
  );
  const [walletError, setWalletError] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const bookmarkAnchorRef = useRef<HTMLSpanElement>(null);

  // Commission from API for USDT, USDC, FX Primus (null = not yet fetched, 0 = API returned 0)
  const [apiCommission, setApiCommission] = useState<number | null>(null);
  const [apiCommissionDetails, setApiCommissionDetails] =
    useState<CommissionLookupResponse | null>(null);
  // Exchange commission-lookup response for first 3 assets only (USDT BEP20, BNB BSC, USDT ERC20)
  const [exchangeLookupResponse, setExchangeLookupResponse] = useState<ExchangeCommissionLookupResponse | null>(null);
  const commissionFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      return;
    }

    if (!currentCurrency) {
      setWalletError("Please select an asset first");
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
      } else {
        setWalletError(null);
      }
    } else if (addressValidationError) {
      setWalletError(addressValidationError);
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
    if (walletAddress.trim() && currentCurrency) {
      resetAddressValidation();
      validateAddress(walletAddress, currentCurrency, currentNetwork);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCurrency, currentNetwork]); // Only run when currency or network changes
  // Initialize selectedPaymentDetail from initialState if available (immediate, no waiting)
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<any>(() => {
    // If we have initialState with payment, use it immediately (normalized)
    if (initialState?.payment) {
      return normalizePaymentDetails(initialState.payment);
    }
    return null;
  });

  /** Same merge as CustomSelect options: extra rows (e.g. login-redirect payment) must be resolvable onChange */
  const paymentMethodsForSelect = useMemo(() => {
    let list = [...(finalPaymentMethods || [])];
    if (initialState?.payment && selectedPaymentDetail) {
      const initialStatePayment = initialState.payment;
      const isAlreadyInOptions = finalPaymentMethods?.some(
        (method: any) =>
          (method.provider_name &&
            initialStatePayment.provider_name &&
            String(method.provider_name).toLowerCase() ===
              String(initialStatePayment.provider_name).toLowerCase()) ||
          (method.id &&
            initialStatePayment.id &&
            String(method.id) === String(initialStatePayment.id)) ||
          (method.provider_id != null &&
            initialStatePayment.provider_id != null &&
            String(method.provider_id) === String(initialStatePayment.provider_id))
      );
      if (!isAlreadyInOptions) {
        list = [initialStatePayment, ...list];
      }
    }
    return list;
  }, [finalPaymentMethods, initialState?.payment, selectedPaymentDetail]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);
  const [isRestoringFromInitialState, setIsRestoringFromInitialState] = useState(false);
  // Auto-select payment method - respect initialState from login redirect
  useEffect(() => {
    if (paymentMethodsForSelect.length === 0) {
      return;
    }

    // When we have initialState.payment from login redirect, use it - don't overwrite with first method
    if (initialState?.payment && selectedPaymentDetail) {
      const savedProvider = initialState.payment.provider_name || initialState.payment.payment_provider_name || initialState.payBank;
      const matchInList = paymentMethodsForSelect.some(
        (m: any) =>
          (m?.provider_name && savedProvider && String(m.provider_name).toLowerCase() === String(savedProvider).toLowerCase()) ||
          (m?.payment_provider_name && savedProvider && String(m.payment_provider_name).toLowerCase() === String(savedProvider).toLowerCase()) ||
          (m?.provider_id && initialState.payment?.provider_id && String(m.provider_id) === String(initialState.payment.provider_id))
      );
      if (matchInList) return; // Already matched, keep current
      // No match in list but we have saved payment - keep it (already in selectedPaymentDetail)
      return;
    }

    const hasSelected = paymentMethodsForSelect.some((method: any) =>
      paymentMethodMatchesPayBank(method, payBank)
    );

    if (!payBank || !hasSelected) {
      const defaultMethod = paymentMethodsForSelect[1] || paymentMethodsForSelect[0];
      const key =
        getPaymentMethodKey(defaultMethod) ||
        (defaultMethod?.provider_id != null ? String(defaultMethod.provider_id) : "");
      if (key) setPayBank(key);
      const normalized = normalizePaymentDetails(defaultMethod);
      setSelectedPaymentDetail(normalized);
    } else if (!selectedPaymentDetail) {
      const matchedMethod = findPaymentMethodInList(paymentMethodsForSelect, payBank);
      if (matchedMethod) {
        const normalized = normalizePaymentDetails(matchedMethod);
        setSelectedPaymentDetail(normalized);
      }
    }
  }, [paymentMethodsForSelect, payBank, selectedPaymentDetail, initialState]);

  const effectivePaymentDetail = useMemo(() => {
    if (selectedPaymentDetail) return selectedPaymentDetail;
    const list = paymentMethodsForSelect;
    if (!list?.length) return null;
    if (payBank) {
      const m = findPaymentMethodInList(list, payBank);
      if (m) return normalizePaymentDetails(m);
    }
    if (list.length === 1) {
      return normalizePaymentDetails(list[0]);
    }
    return null;
  }, [selectedPaymentDetail, payBank, paymentMethodsForSelect]);

  useEffect(() => {
    if (effectivePaymentDetail && !selectedPaymentDetail && payBank) {
      setSelectedPaymentDetail(effectivePaymentDetail);
    }
  }, [effectivePaymentDetail, selectedPaymentDetail, payBank]);

  // Add transaction code state
  const [transactionCode, setTransactionCode] = useState<string>(initialState?.transactionCode ?? "");
  const paymentDetailsRef = useRef<HTMLDivElement>(null);
  
  // Inline copy feedback state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Asset selection state for search functionality
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [assetSearchTerm, setAssetSearchTerm] = useState("");
  const [whitelistBookmarks, setWhitelistBookmarks] = useState<Array<{ asset: string; network: string }>>([]);
  const assetDropdownRef = useRef<HTMLDivElement>(null);
  const assetDropdownContentRef = useRef<HTMLDivElement | null>(null);
  const [assetDropdownPosition, setAssetDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [isComponentMounted, setIsComponentMounted] = useState(false);

  const updateAssetDropdownPosition = useCallback(() => {
    if (!assetDropdownRef.current) return;
    const rect = assetDropdownRef.current.getBoundingClientRect();
    const next = {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
    };
    setAssetDropdownPosition((prev) => {
      const unchanged =
        Math.abs(prev.top - next.top) < 0.5 &&
        Math.abs(prev.left - next.left) < 0.5 &&
        Math.abs(prev.width - next.width) < 0.5;
      return unchanged ? prev : next;
    });
  }, []);

  useEffect(() => {
    setIsComponentMounted(true);
  }, []);

  useEffect(() => {
    if (!isAssetDropdownOpen) return;
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

  // First card submission state
  const [isFirstCardSubmitted, setIsFirstCardSubmitted] = useState(!!initialState?.isFirstCardSubmitted);

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

  // Add state to store API response
  const [apiResponse, setApiResponse] = useState<any>(initialState?.apiResponse ?? null);
  const [isUserModifiedAmount, setIsUserModifiedAmount] = useState(false);

  // Add InfoModal state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Add validation state for minimum receive amount
  const [receiveAmountError, setReceiveAmountError] = useState<string | null>(
    null
  );

  // Add state for API validation errors
  const [apiValidationError, setApiValidationError] = useState<string | null>(
    null
  );

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
    if (
      !isSimpleCalculationAsset(asset) &&
      !isForexAsset(asset) &&
      payAmount > 0
    ) {
      // Set loading states for inline calculation
      setIsCalculating(true);
      setIsCalculatingReceive(true);

      // Trigger the existing calculation logic
      calculateAmounts(payAmount, true);
    }
  };

  // Forex-specific state
  const [forexAccountNumber, setForexAccountNumber] = useState<string>("");
  const [userNotes, setUserNotes] = useState<string>("");
  const [showForexForm, setShowForexForm] = useState<boolean>(false);

  // Collapse FX Primus second step when asset changes away from FXP so the main submit stays visible
  useEffect(() => {
    if (!selectedAsset) {
      setShowForexForm(false);
      setForexAccountNumber("");
      setUserNotes("");
      return;
    }
    if (!isForexPrimusAsset(selectedAsset)) {
      setShowForexForm(false);
      setForexAccountNumber("");
      setUserNotes("");
    }
  }, [selectedAsset]);

  useEffect(() => {
    if (isHomePage) {
      return;
    }

    dispatch(fetchAdminPaymentMethods());
    dispatch(fetchAdminPaymentDetails(false));
  }, [dispatch, isHomePage]);

  // Skip reset when restoring from legal pages (user was on second step)
  const hasRestoredFromLegalRef = useRef(!!initialState?.isFirstCardSubmitted);
  // Close expanded section when user changes payment method or asset (user must post again)
  useEffect(() => {
    if (hasRestoredFromLegalRef.current) {
      const t = setTimeout(() => {
        hasRestoredFromLegalRef.current = false;
      }, 600);
      return () => clearTimeout(t);
    }
    if (isFirstCardSubmitted) {
      setIsFirstCardSubmitted(false);
      setApiResponse(null);
      setTransactionCode("");
    }
  }, [selectedAsset, payBank]);

  // Fetch public payment methods (same as home: always use public API when available)
  useEffect(() => {
    dispatch(fetchPublicPaymentMethods());
  }, [dispatch]);

  useEffect(() => {
    // Skip API calls on home page - buttons will redirect to login
    if (isHomePage) {
      return;
    }

    // First try cache, then force refresh if no data; timeout so slow API doesn't freeze the form
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
  }, [dispatch]);

  // Fetch swap assets
  useEffect(() => {
    // Skip API calls on home page - buttons will redirect to login
    if (isHomePage) {
      return;
    }

    // Must exceed getSupportedAssets axios timeout (30s) or UI shows "Request timeout" first
    withTimeout(
      dispatch(
        fetchSupportedAssets({ forceRefresh: false, feature: "exchange" })
      ).unwrap(),
      35_000
    )
      .then((data) => {
        if (!data || data.length === 0) {
          return withTimeout(
            dispatch(
              fetchSupportedAssets({ forceRefresh: true, feature: "exchange" })
            ).unwrap(),
            35_000
          );
        }
        return data;
      })
      .catch((error: unknown) => {
        return withTimeout(
          dispatch(
            fetchSupportedAssets({ forceRefresh: true, feature: "exchange" })
          ).unwrap(),
          35_000
        ).catch(
          (refreshError: unknown) => {
            // Only show error if it's a network issue, not cache issues
            if (refreshError instanceof Error) {
              if (
                refreshError.message.includes("Network Error") ||
                refreshError.message.includes("Network connection issue")
              ) {
                showToast.warning(
                  "Network Issue",
                  "Unable to fetch assets due to network problems. Using fallback data."
                );
              } else if (refreshError.message.includes("Server Error")) {
                showToast.error(
                  "Server Error",
                  "Unable to fetch assets from server. Please try again later."
                );
              } else if (!refreshError.message.includes("Cache")) {
                // Only show error if it's not a cache-related issue
                showToast.error(
                  "Asset Loading Error",
                  `Failed to fetch swap assets: ${refreshError.message}`
                );
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
                fee_rate: "2",
              },
            ];

            // Update the Redux store with fallback assets
            dispatch({
              type: "swap/fetchSupportedAssets/fulfilled",
              payload: fallbackAssets,
            });

            throw refreshError;
          });
      });
  }, [dispatch]);

  // Restore asset from initialState when assets are loaded
  useEffect(() => {
    if (!assetsDisplay.shouldShowData || assetsDisplay.displayData.length === 0) {
      return;
    }

    // If we have initialState with asset, use it directly (full object from home page)
    // Check both initialState.asset and initialState.selectedAsset for backward compatibility
    const assetFromInitialState = initialState?.asset || initialState?.selectedAsset;
    if (assetFromInitialState && !selectedAsset) {
      const initialStateAsset = assetFromInitialState;
      const savedTicker = (initialStateAsset.ticker || initialStateAsset.symbol || initialStateAsset.name || "").toString().toLowerCase().trim();
      const savedNetwork = (initialStateAsset.network || getAssetNetwork(initialStateAsset) || "").toString().toLowerCase().trim();

      // Try to find the exact asset: first by asset_id, then by ticker+network
      const matchingAsset = assetsDisplay.displayData.find((asset: any) => {
        if (initialStateAsset.asset_id && asset.asset_id) {
          if (String(initialStateAsset.asset_id).toLowerCase().trim() === String(asset.asset_id).toLowerCase().trim()) return true;
        }
        const assetTicker = (asset.ticker || asset.symbol || asset.name || "").toString().toLowerCase().trim();
        const assetNetwork = (asset.network || getAssetNetwork(asset) || "").toString().toLowerCase().trim();
        return savedTicker && assetTicker === savedTicker && (!savedNetwork || assetNetwork === savedNetwork);
      });

      // Use matched asset if found, otherwise use initialState asset directly
      const assetToUse = matchingAsset || initialStateAsset;

      setIsRestoringFromInitialState(true);
      setSelectedAsset(assetToUse);
      const networkValue = getAssetNetwork(assetToUse);
      setSelectedNetwork({
        network_id: networkValue,
        network_type: networkValue,
      });
      // Restore exact amounts from initialState
      if (initialState.amountValue !== undefined) {
        setPayAmount(initialState.amountValue);
        setPayAmountInput(initialState.amountInput || initialState.amountValue.toString());
      }
      // Restore receive amount if available
      if (initialState.receiveAmountValue !== undefined) {
        setGetAmount(initialState.receiveAmountValue);
        setGetAmountInput(initialState.receiveAmountInput || initialState.receiveAmountValue.toString());
      } else if (initialState.amountValue) {
        // If no receive amount, calculate it
        setTimeout(() => {
          calculateAmounts(initialState.amountValue, true);
        }, 100);
      }
      setIsRestoringFromInitialState(false);
      return; // Don't proceed to auto-select
    }

    // Auto-select first asset only if no asset is selected and no initialState
    if (!selectedAsset && !initialState?.asset && !initialState?.selectedAsset) {
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
      const networkValue = getAssetNetwork(firstAsset);
      setSelectedNetwork({
        network_id: networkValue,
        network_type: networkValue,
      });
    }
  }, [assetsDisplay.displayData, selectedAsset, initialState]);

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

  useEffect(() => {
    if (!isAssetDropdownOpen) return;

    const handleScroll = (event: Event) => {
      const target = event.target as Node | null;

      // Ignore scrolls coming from inside the dropdown content
      if (
        assetDropdownContentRef.current &&
        target &&
        assetDropdownContentRef.current.contains(target)
      ) {
        return;
      }

      // Ignore scrolls from the trigger itself (edge case)
      if (
        assetDropdownRef.current &&
        target &&
        assetDropdownRef.current.contains(target)
      ) {
        return;
      }

      setIsAssetDropdownOpen(false);
    };

    // Capture phase is required
    window.addEventListener("scroll", handleScroll, true);
    document.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [isAssetDropdownOpen]);


  // Check if asset is one of the first two direct assets (USDT on BSC or USDC on BSC) or first three exchange-lookup assets (USDT BEP20, BNB BSC, USDT ERC20)
  const isSimpleCalculationAsset = (asset: any) => {
    if (!asset) return false;
    const ticker = (asset?.ticker || asset?.symbol || "").toLowerCase();
    const network = (asset?.network || "").toLowerCase();

    // First two: USDT on BSC and USDC on BSC; first three (exchange lookup): USDT BEP20, BNB BSC, USDT ERC20
    return (
      (ticker === "usdt" && network === "bsc") ||
      (ticker === "usdc" && network === "bsc") ||
      isExchangeCommissionLookupAsset(asset)
    );
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

  // Check if asset uses commission API (USDT, USDC, FX Primus)
  const isCommissionApiAsset = (asset: any) => !!getCommissionApiAsset(asset?.ticker || asset?.symbol || "");

  // Fetch commission: for first 3 assets use exchange commission-lookup (to_amount); for USDT/USDC/FXP use legacy percentage API
  useEffect(() => {
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
    // FX Primus uses direct commission API only (same as home — do not use exchange-lookup here).
    if (params && !isForexAsset(selectedAsset)) {
      // First 3 assets only: crypto -> USD with network (USDT/USDC on BSC, etc.)
      if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
      commissionFetchTimeoutRef.current = setTimeout(() => {
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
    if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
    const fxpSendAmount = isCalculatingFromPay
      ? (parseFloat(payAmountInput) || payAmount)
      : getFxpReversePayAmount((parseFloat(getAmountInput) || getAmount));
    const commissionLookupAmount = isForexAsset(selectedAsset)
      ? fxpSendAmount
      : amount;
    commissionFetchTimeoutRef.current = setTimeout(() => {
      fetchCommissionDetails(
        apiAsset,
        commissionLookupAmount,
        "deposit",
        isForexAsset(selectedAsset) ? selectedAsset?.asset_id : undefined
      )
        .then((details) => {
          setApiCommission(Number(details?.commission_rate ?? 0));
          setApiCommissionDetails(details);
          setExchangeLookupResponse(null);
          if (isForexAsset(selectedAsset)) {
            const backendToAmount = Number(details?.to_amount);
            const backendFromAmount = Number(details?.from_amount);
            if (isCalculatingFromPay && Number.isFinite(backendToAmount)) {
              setGetAmount(Math.max(0, backendToAmount));
              setGetAmountInput(String(Math.max(0, backendToAmount)));
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

          if (
            isForexAsset(selectedAsset) &&
            (normalizedMessage.includes(MISSING_FXP_FXP_RATE_ERROR) ||
              isFxpUnsupportedRateError(normalizedMessage))
          ) {
            // FXP deposit: if backend commission isn't configured, treat as no-commission.
            setApiValidationError(null);
            if (isCalculatingFromPay) {
              setGetAmount(amount);
              setGetAmountInput(String(amount));
            } else {
              setPayAmount(amount);
              setPayAmountInput(String(amount));
            }
            setApiCommission(0);
            setApiCommissionDetails(null);
            setExchangeLookupResponse(null);
            return;
          }

          setApiCommission(null);
          setApiCommissionDetails(null);
        });
    }, 300);
    return () => {
      if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
    };
  }, [selectedAsset, payAmountInput, getAmountInput, payAmount, getAmount, isCalculatingFromPay]);

  // Recalculate when apiCommission arrives (legacy % API; not used for crypto exchange-lookup — FX Primus uses this path)
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
            return;
          }
        }
        const commissionAmount = (payAmount * apiCommission) / 100;
        const calculatedGetAmount = Math.max(0, payAmount - commissionAmount);
        setGetAmount(calculatedGetAmount);
        setGetAmountInput(calculatedGetAmount.toString());
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

  // Reverse calculation for first 3 assets (You Receive -> You Send) using last exchange lookup local_commission
  useEffect(() => {
    if (
      !selectedAsset ||
      !isExchangeCommissionLookupAsset(selectedAsset) ||
      isForexAsset(selectedAsset) ||
      !exchangeLookupResponse?.local_commission ||
      isCalculatingFromPay ||
      getAmount <= 0
    )
      return;
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

  // FXP uses manual calculation with fixed 1.06 rate
  const FXP_EXCHANGE_RATE = 1.06;

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
            })
          ),
          timeoutPromise,
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

              // Always show deposit_too_small in red (min amount from API when present)
              if (
                errorMessage.includes("deposit_too_small") ||
                errorDetails.includes("Out of min amount")
              ) {
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
              if (
                errorMessage.includes("deposit_too_large") ||
                errorDetails.includes("Out of max amount")
              ) {
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
            }

            // Clear loading states after successful calculation
            setIsCalculating(false);
            setIsCalculatingReceive(false);
          })
          .catch((actionOrError: any) => {
            console.log("[EXPRESS DASHBOARD DEPOSIT] ESTIMATE CATCH", { actionOrError });
            const error = actionOrError?.payload ?? actionOrError;
            const responseData = error?.response_data ?? actionOrError?.response_data;
            console.log("[EXPRESS DASHBOARD DEPOSIT] PARSED ERROR", {
              message: error?.message,
              rawError: error,
              responseData,
            });
            console.error("Failed to fetch swap estimate:", actionOrError);

            setIsCalculating(false);
            setIsCalculatingReceive(false);
            setEstimateLoading(false);

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

            // Always show deposit_too_small in red (min amount from API when present)
            if (
              errorMessage.includes("deposit_too_small") ||
              errorDetails.includes("Out of min amount")
            ) {
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
            if (
              errorMessage.includes("deposit_too_large") ||
              errorDetails.includes("Out of max amount")
            ) {
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

            // Common fallback calculation for network/timeout errors only
            const commissionRate = selectedAsset?.range_commissions?.[0]
              ?.commission
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
            })
          ),
          timeoutPromise,
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
            if (
              errorMessage.includes("deposit_too_small") ||
              errorDetails.includes("Out of min amount")
            ) {
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

            if (
              errorMessage.includes("deposit_too_large") ||
              errorDetails.includes("Out of max amount")
            ) {
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

            setApiValidationError(null);

            const msg = error?.message || "";
            if (msg.includes("Request timeout")) {
              setEstimateError(null);
            } else if (
              msg.includes("Network Error") ||
              (actionOrError as any)?.code === "ECONNREFUSED" ||
              (actionOrError as any)?.code === "ENOTFOUND"
            ) {
              setEstimateError(null);
            } else if (msg.includes("Server Error")) {
              setEstimateError(null);
            } else {
              setEstimateError(null);
            }

            // Common fallback calculation for network/timeout errors only
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

  // Filter assets based on search term - search by ticker and name
  const filteredSwapAssets =
    assetsDisplay.displayData?.filter((asset: SupportedAsset) => {
      const ticker = asset?.ticker?.toUpperCase() || "";
      const name = asset?.name?.toUpperCase() || "";
      const symbol = asset?.symbol?.toUpperCase() || "";
      const searchTerm = assetSearchTerm.toUpperCase();

      return (
        ticker.includes(searchTerm) ||
        name.includes(searchTerm) ||
        symbol.includes(searchTerm)
      );
    }) || [];

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

    // Priority 3: FX Primus (API may use fxp or fxprimus)
    const isFxpA = tickerA === "fxp" || tickerA === "fxprimus";
    const isFxpB = tickerB === "fxp" || tickerB === "fxprimus";
    if (isFxpA && !isFxpB) {
      return -1;
    }
    if (isFxpB && !isFxpA) {
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

  const popularAssets = useMemo(() => {
    const normalize = (asset: any) =>
      (asset?.ticker || asset?.symbol || asset?.name || "")
        .toString()
        .toLowerCase();
    const network = (asset: any) =>
      (asset?.network || getAssetNetwork(asset) || "").toString().toLowerCase();
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
              .toLowerCase()}|${(a?.network || getAssetNetwork(a) || "")
              .toString()
              .toLowerCase()}`
        )
      ),
    [popularAssets]
  );

  const whitelistAssets = useMemo(() => {
    if (whitelistKeys.size === 0) return [];
    return sortedSwapAssets.filter((a) => {
      const key = `${(a?.ticker || a?.symbol || a?.name || "").toString().toLowerCase()}|${(a?.network || getAssetNetwork(a) || "").toString().toLowerCase()}`;
      return whitelistKeys.has(key) && !popularSet.has(key);
    });
  }, [sortedSwapAssets, whitelistKeys, popularSet]);

  const whitelistKeySet = useMemo(
    () => new Set(whitelistAssets.map((a) => `${(a?.ticker || a?.symbol || a?.name || "").toString().toLowerCase()}|${(a?.network || getAssetNetwork(a) || "").toString().toLowerCase()}`)),
    [whitelistAssets]
  );

  const allAssetsList = useMemo(() => {
    if (assetSearchTerm) return sortedSwapAssets;
    return sortedSwapAssets.filter((a) => {
      const key = `${(a?.ticker || a?.symbol || a?.name || "").toString().toLowerCase()}|${(a?.network || getAssetNetwork(a) || "").toString().toLowerCase()}`;
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
    [sortedSwapAssets, assetSearchTerm, whitelistAssets, allAssetsList, popularAssets]
  );

  const renderAssetDropdown = () => {
    if (!isComponentMounted || !isAssetDropdownOpen) {
      return null;
    }

    return createPortal(
      (
        <div
          ref={assetDropdownContentRef}
          className="mt-1 bg-[#ffffff] dark:bg-[#1D1D23] border border-[#A2A4A9FF] dark:border-[#35353E] rounded-2xl shadow-lg z-40"
          style={{
            position: "absolute",
            top: assetDropdownPosition.top,
            left: assetDropdownPosition.left,
            width:
              assetDropdownPosition.width ||
              assetDropdownRef.current?.offsetWidth ||
              undefined,
          }}
        >
          <div className="p-3 border-b border-[#A2A4A9FF] dark:border-[#35353E]">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7e7e8f] w-4 h-4" />
              <input
                type="text"
                placeholder="Search assets..."
                value={assetSearchTerm}
                onChange={(e) => setAssetSearchTerm(e.target.value)}
                className="w-full text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 rounded-xl px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          <AssetDropdownVirtualized
            rows={assetDropdownRows}
            selectedAsset={selectedAsset}
            onAssetSelect={(asset) => {
              handleAssetSelection(asset);
              setIsAssetDropdownOpen(false);
              setAssetSearchTerm("");
            }}
          />
        </div>
      ),
      document.body
    );
  };

  // Calculate fees and amounts - Network fee is always 0
  const networkFee = 0;
  // First 3 assets: use exchange lookup local_commission; else USDT/USDC/FXP use API %; else range_commissions
  let commissionAmount: number;
  if (selectedAsset && isExchangeCommissionLookupAsset(selectedAsset) && exchangeLookupResponse?.local_commission) {
    const lc = exchangeLookupResponse.local_commission;
    if (lc.commission_mode === "flat_fee" && lc.fee != null) {
      commissionAmount = parseFloat(lc.fee) || 0;
    } else if (lc.commission_mode === "percentage" && lc.rate != null) {
      commissionAmount = (payAmount * parseFloat(lc.rate)) / 100;
    } else {
      commissionAmount = 0;
    }
  } else if (selectedAsset && isCommissionApiAsset(selectedAsset)) {
    const rate = apiCommission ?? 2;
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

    // For direct assets; first 3 use exchange lookup (amounts set by useEffect), others use % or range_commissions
    if (isSimpleCalculationAsset(selectedAsset)) {
      if (isExchangeCommissionLookupAsset(selectedAsset)) {
        // Amounts are set by fetchExchangeCommissionLookup effect; avoid overwriting
        setReceiveAmountError(null);
        return;
      }
      const commissionRate = isCommissionApiAsset(selectedAsset) ? (apiCommission ?? 2) : (() => {
        let r = 2;
        if (selectedAsset?.range_commissions?.length) r = parseFloat(selectedAsset.range_commissions[0]?.commission || "2");
        else if (selectedAsset?.commission) r = parseFloat(selectedAsset.commission);
        else if (selectedAsset?.fee_rate) r = parseFloat(selectedAsset.fee_rate);
        return isNaN(r) || r <= 0 ? 2 : r;
      })();

      if (fromPay) {
        const commissionAmount = (fromAmount * commissionRate) / 100;
        const calculatedGetAmount = Math.max(0, fromAmount - commissionAmount);
        setGetAmount(calculatedGetAmount);
        setGetAmountInput(calculatedGetAmount.toString());
      } else {
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
        // Reverse calculation: You Receive -> You Send (same rules as home)
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
          // Forward calculation: from pay amount to receive amount
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
            if (estimate && estimate.estimated_amount) {
              setGetAmount(estimate.estimated_amount);
              setGetAmountInput(estimate.estimated_amount.toString());
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

  // Recalculate when asset changes (but not when restoring from initialState)
  useEffect(() => {
    if (selectedAsset && payAmount > 0 && isCalculatingFromPay && !isRestoringFromInitialState) {
      // Clear any existing estimate when asset changes
      setEstimate(null);
      setEstimateError(null);
      // Trigger calculation with new asset
      calculateAmounts(payAmount, true);
    }
  }, [selectedAsset, isRestoringFromInitialState]);

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

  // Terms & Conditions acceptance
  const [termsAccepted, setTermsAccepted] = useState(!!initialState?.termsAccepted);
  const [expandedTerms, setExpandedTerms] = useState(false);

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
  const exceedsDecimalPrecisionLimit =
    hasMoreThanFiveDecimals(payAmountInput);

  const isProceedDisabled =
    isSubmitting ||
    !walletAddress.trim() ||
    !!walletError ||
    !termsAccepted ||
    exceedsDecimalPrecisionLimit ||
    (isOtcPopupAsset(selectedAsset) && (payAmount >= 15000 || getAmount >= 15000));

  // Save form state before navigating to legal pages so back button restores it
  const handleBeforeLegalNavigate = useCallback(() => {
    setExpressLegalReturnState({
      mode: "deposit",
      payAmount,
      payAmountInput,
      getAmount,
      getAmountInput,
      scrollY: typeof window !== "undefined" ? window.scrollY : 0,
      payBank,
      selectedPaymentDetail,
      selectedAsset,
      selectedNetwork,
      walletAddress,
      termsAccepted,
      apiResponse,
      transactionCode,
      isFirstCardSubmitted,
    });
  }, [
    payAmount,
    payAmountInput,
    getAmount,
    getAmountInput,
    payBank,
    selectedPaymentDetail,
    selectedAsset,
    selectedNetwork,
    walletAddress,
    termsAccepted,
    apiResponse,
    transactionCode,
    isFirstCardSubmitted,
  ]);

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

    // Non–FX Primus: require a bank/payment row
    if (selectedAsset && !isForexAsset(selectedAsset)) {
      if (!effectivePaymentDetail) {
        errors.push("Please select a payment method");
        showToast.error("Please select a payment method");
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleFirstCardSubmit = async () => {
    if (exceedsDecimalPrecisionLimit) {
      showToast.error("Number cannot have more than 5 decimal places.");
      return;
    }
    if (selectedAsset && isForexAsset(selectedAsset)) {
      return;
    }
    if (validateFirstCard()) {
      setIsSubmitting(true);

      try {
        // Validate required fields
        const safeAmount = parseFloat(String(payAmount));
        if (!safeAmount || isNaN(safeAmount) || safeAmount <= 0) {
          throw new Error("Invalid amount. Please enter a valid number greater than 0.");
        }

        if (!effectivePaymentDetail) {
          throw new Error("Please select a payment method");
        }
        if (!effectivePaymentDetail.provider_name) {
          throw new Error("Payment provider is missing");
        }
        if (!effectivePaymentDetail.payment_method_type) {
          throw new Error("Payment method is missing");
        }
        if (!selectedAsset) {
          throw new Error("No asset selected");
        }

        // Resolve currency value
        let currencyValue = "";
        if (selectedAsset.ticker) {
          currencyValue = selectedAsset.ticker;
        } else if (selectedAsset.symbol) {
          currencyValue =
            selectedAsset.symbol === "USDT Tether"
              ? "USDT"
              : selectedAsset.symbol;
        } else if (selectedAsset.name) {
          currencyValue = selectedAsset.name;
        }
        currencyValue = currencyValue?.trim();
        if (!currencyValue) {
          const assetKeys = Object.keys(selectedAsset);
          for (const key of assetKeys) {
            const value = selectedAsset[key];
            if (typeof value === "string" && value.trim()) {
              currencyValue = value.trim();
              break;
            }
          }
        }
        if (!currencyValue) {
          throw new Error("Currency information is missing");
        }

        // Resolve network value
        const networkValue =
          selectedNetwork?.network_id || selectedNetwork?.network_type || "";
        if (!networkValue) {
          throw new Error("Network information is missing");
        }

        // Resolve asset value
        let assetValue = "";
        if (selectedAsset.ticker) {
          assetValue = selectedAsset.ticker;
        } else if (selectedAsset.symbol) {
          assetValue =
            selectedAsset.symbol === "USDT Tether"
              ? "USDT"
              : selectedAsset.symbol;
        } else if (selectedAsset.name) {
          assetValue = selectedAsset.name;
        }
        assetValue = assetValue?.trim();
        if (!assetValue) {
          const assetKeys = Object.keys(selectedAsset);
          for (const key of assetKeys) {
            const value = selectedAsset[key];
            if (typeof value === "string" && value.trim()) {
              assetValue = value.trim();
              break;
            }
          }
        }
        if (!assetValue) {
          throw new Error("Asset information is missing");
        }

        // Build JSON payload — requested_amount sent as a number
        const depositPayload = {
          requested_amount: safeAmount,
          payment_provider: effectivePaymentDetail.provider_name,
          payment_method: effectivePaymentDetail.payment_method_type,
          currency: currencyValue,
          network: networkValue,
          asset: isForexPrimusAsset(selectedAsset) ? "fxprimus" : assetValue,
          asset_id: String((selectedAsset as any)?.asset_id || ""),
          network_id: null,
          additional_info: "Direct crypto deposit",
        };

        // Submit to API
        const depositResponse = (await dispatch(
          createDeposit({
            payload: depositPayload,
            config: {
              headers: { "Content-Type": "application/json" },
            },
          })
        ).unwrap()) as unknown as DepositResponse;

        // Store the API response and update transaction code
        setApiResponse(depositResponse);
        setTransactionCode(depositResponse.deposit_code || "");

        // Note: Toast moved to handleProceedToNext to avoid showing prematurely

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
        let errorMessage = extractSubmitErrorMessage(
          error,
          "Failed to submit deposit request"
        );

        if (error.response?.data) {
          // Try to extract specific error message from response
          const responseData = error.response.data;
          if (responseData.message) {
            // Check for specific error message and show user-friendly message
            if (
              responseData.message.includes(
                "Transaction not found or not eligible for address update"
              )
            ) {
              errorMessage = "Your address doesn't match the requested asset";
            } else {
              errorMessage = responseData.message;
            }
          } else if (responseData.error) {
            // Check for specific error in error field
            if (
              responseData.error.includes(
                "Transaction not found or not eligible for address update"
              )
            ) {
              errorMessage = "Your address doesn't match the requested asset";
            } else {
              errorMessage = responseData.error;
            }
          } else if (responseData.details) {
            errorMessage = responseData.details;
          } else if (typeof responseData === "string") {
            // Check for specific error in string response
            if (
              responseData.includes(
                "Transaction not found or not eligible for address update"
              )
            ) {
              errorMessage = "Your address doesn't match the requested asset";
            } else {
              errorMessage = responseData;
            }
          }
        } else if (error.message) {
          // Check for specific error in error.message
          if (
            error.message.includes(
              "Transaction not found or not eligible for address update"
            )
          ) {
            errorMessage = "Your address doesn't match the requested asset";
          } else {
            errorMessage = error.message;
          }
        }

        // For address update failures, show more specific message
        if (
          errorMessage === "Failed to process request" ||
          errorMessage === "Failed to submit deposit request"
        ) {
          errorMessage =
            "Your wallet address doesn't match the asset requested";
        }

        showToast.error(errorMessage);
        setValidationErrors([errorMessage]);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Auto-expand and auto-submit when initialState is provided
  useEffect(() => {
    // Only run on dashboard (not home page) and if we have initialState
    if (isHomePage || !initialState || hasAutoExpanded) {
      return;
    }

    if (!selectedAsset) {
      return;
    }
    // FX Primus: do not require a resolved bank/payment row for auto-expand
    if (!isForexAsset(selectedAsset)) {
      if (!paymentMethodsForSelect?.length || !effectivePaymentDetail) {
        return;
      }
    }

    // Check if we have all required data
    const hasRequiredData =
      initialState.amountValue &&
      initialState.asset &&
      initialState.payment;

    if (!hasRequiredData) {
      return;
    }

    // Auto-expand: If it's a forex asset, show forex form; otherwise, just mark expanded (user must click to submit)
    if (selectedAsset && isForexAsset(selectedAsset)) {
      setShowForexForm(true);
      setHasAutoExpanded(true);
    } else if (selectedAsset && effectivePaymentDetail) {
      // Pre-populate form but do NOT auto-submit - user must click the button
      setHasAutoExpanded(true);
    }
  }, [
    initialState,
    selectedAsset,
    effectivePaymentDetail,
    paymentMethodsForSelect,
    isHomePage,
    hasAutoExpanded,
  ]);

  // Validate form data (FX Primus skips bank / network requirements)
  const validateForm = () => {
    const errors: string[] = [];

    if (!payAmount || payAmount <= 0) {
      errors.push("Please enter a valid amount");
    }

    if (!selectedAsset) {
      errors.push("Please select an asset");
    }

    const isFx = selectedAsset && isForexAsset(selectedAsset);
    if (!isFx) {
      if (!effectivePaymentDetail) {
        errors.push("Please select a payment method");
      }
      if (!selectedNetwork) {
        errors.push("Please select a network");
      } else if (!selectedNetwork.network_id && !selectedNetwork.network_type) {
        errors.push("Selected network is missing required information");
      }
    }

    // Wallet address is optional for initial submission - only required for address update step
    if (walletAddress.trim() && walletError) {
      errors.push("Please enter a valid wallet address");
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
    const isSimpleAsset =
      selectedAsset && isSimpleCalculationAsset(selectedAsset);

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

          if (updateResponse && typeof updateResponse === "object") {
            // Try to extract additional fields if they exist
            const responseData = updateResponse as any;

            // According to user description, the second response should contain:
            // websocket_url, changenow_id, expected_amount, net_amount, deposit_address, status: "pending"
            if (
              responseData.websocket_url ||
              responseData.expected_amount ||
              responseData.net_amount ||
              responseData.changenow_id
            ) {
              // This response contains the additional fields we need
              finalResponse = {
                ...apiResponse,
                ...responseData,
                // Ensure we have the transaction_id and deposit_code
                transaction_id:
                  responseData.transaction_id || apiResponse.transaction_id,
                deposit_code:
                  responseData.deposit_code || apiResponse.deposit_code,
              };

              showToast.success(
                "Address updated successfully! Transaction details updated."
              );
            } else {
              showToast.success("Address updated successfully!");
            }
          } else {
            showToast.success("Address updated successfully!");
          }
        } else {
          // No wallet address provided - this might not work for complex assets
          updateResponse = { status: "pending" };
          showToast.warning(
            "Warning: Complex assets typically require a deposit address"
          );
        }
      }

      // Prepare transaction data for the status page
      const receiveFromInput = parseFloat(getAmountInput) || getAmount;
      const transactionData = {
        type: "deposit" as const,
        amount: payAmount,
        receiveAmount: receiveFromInput, // From "You Receive" input
        asset: {
          ...selectedAsset,
          icon:
            selectedAsset.image_url ||
            selectedAsset.asset_image ||
            selectedAsset.icon_url ||
            selectedAsset.image,
        },
        paymentDetail: selectedPaymentDetail || {
          provider_name: "direct",
          payment_method_type: "crypto",
        },
        walletAddress: walletAddress.trim() || "Not provided",
        network: selectedNetwork,
        transactionId: finalResponse.transaction_id,
        depositCode: finalResponse.deposit_code,
        status: updateResponse.status,
        websocket_url: finalResponse.websocket_url, // Use the appropriate websocket URL
        // Add additional fields from the final response for complex assets
        ...(finalResponse.expected_amount && {
          expectedAmount: finalResponse.expected_amount,
        }),
        ...(finalResponse.net_amount && {
          netAmount: finalResponse.net_amount,
        }),
        ...(finalResponse.changenow_id && {
          changenowId: finalResponse.changenow_id,
        }),
        ...(finalResponse.deposit_address && {
          finalDepositAddress: finalResponse.deposit_address,
        }),
      };

      // Navigate to the exchanging status page automatically
      if (onExchange) {
        onExchange(transactionData);
      } else {
        // Fallback navigation if onExchange is not provided
        router.push(
          `/dashboard/express-exchange?transactionId=${finalResponse.transaction_id}`
        );
      }
    } catch (error: any) {
      console.error("Failed to update deposit address:", error);
      let errorMessage = "Failed to process request";

      if (error.response?.data) {
        const responseData = error.response.data;
        if (responseData.message) {
          // Check for specific error message and show user-friendly message
          if (
            responseData.message.includes(
              "Transaction not found or not eligible for address update"
            )
          ) {
            errorMessage = "Your address doesn't match the requested asset";
          } else {
            errorMessage = responseData.message;
          }
        } else if (responseData.error) {
          // Check for specific error in error field
          if (
            responseData.error.includes(
              "Transaction not found or not eligible for address update"
            )
          ) {
            errorMessage = "Your address doesn't match the requested asset";
          } else {
            errorMessage = responseData.error;
          }
        } else if (responseData.details) {
          errorMessage = responseData.details;
        } else if (typeof responseData === "string") {
          // Check for specific error in string response
          if (
            responseData.includes(
              "Transaction not found or not eligible for address update"
            )
          ) {
            errorMessage = "Your address doesn't match the requested asset";
          } else {
            errorMessage = responseData;
          }
        }
      } else if (error.message) {
        // Check for specific error in error.message
        if (
          error.message.includes(
            "Transaction not found or not eligible for address update"
          )
        ) {
          errorMessage = "Your address doesn't match the requested asset";
        } else {
          errorMessage = error.message;
        }
      }

      // For address update failures, show more specific message
      if (
        errorMessage === "Failed to process request" ||
        errorMessage === "Failed to update deposit address"
      ) {
        errorMessage = "Your wallet address doesn't match the asset requested";
      }

      showToast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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

    setIsSubmitting(true);

    try {
      // Validate required fields
      const safeAmount = parseFloat(String(payAmount));
      if (!safeAmount || isNaN(safeAmount) || safeAmount <= 0) {
        throw new Error("Invalid amount. Please enter a valid number greater than 0.");
      }
      if (!selectedPaymentDetail.provider_name) {
        throw new Error("Payment provider is missing");
      }
      if (!selectedPaymentDetail.payment_method_type) {
        throw new Error("Payment method is missing");
      }

      // Resolve currency value
      let currencyValue = "";
      if (selectedAsset.ticker) {
        currencyValue = selectedAsset.ticker;
      } else if (selectedAsset.symbol) {
        currencyValue =
          selectedAsset.symbol === "USDT Tether"
            ? "USDT"
            : selectedAsset.symbol;
      } else if (selectedAsset.name) {
        currencyValue = selectedAsset.name;
      }
      currencyValue = currencyValue?.trim();
      if (!currencyValue) {
        const assetKeys = Object.keys(selectedAsset);
        for (const key of assetKeys) {
          const value = selectedAsset[key];
          if (typeof value === "string" && value.trim()) {
            currencyValue = value.trim();
            break;
          }
        }
      }
      if (!currencyValue) {
        throw new Error("Currency information is missing");
      }

      // Resolve network value
      let networkValue = "";
      if (selectedNetwork?.network_id) {
        networkValue = selectedNetwork.network_id;
      } else if (selectedNetwork?.network_type) {
        networkValue = selectedNetwork.network_type;
      } else if (selectedAsset) {
        networkValue = getAssetNetwork(selectedAsset);
      }
      networkValue = networkValue?.trim();
      if (!networkValue && selectedNetwork) {
        const networkKeys = Object.keys(selectedNetwork);
        for (const key of networkKeys) {
          const value = selectedNetwork[key];
          if (typeof value === "string" && value.trim()) {
            networkValue = value.trim();
            break;
          }
        }
      }
      if (!networkValue) {
        throw new Error("Network information is missing");
      }

      // Resolve asset value
      let assetValue = "";
      if (selectedAsset.ticker) {
        assetValue = selectedAsset.ticker;
      } else if (selectedAsset.symbol) {
        assetValue =
          selectedAsset.symbol === "USDT Tether"
            ? "USDT"
            : selectedAsset.symbol;
      } else if (selectedAsset.name) {
        assetValue = selectedAsset.name;
      }
      assetValue = assetValue?.trim();
      if (!assetValue) {
        const assetKeys = Object.keys(selectedAsset);
        for (const key of assetKeys) {
          const value = selectedAsset[key];
          if (typeof value === "string" && value.trim()) {
            assetValue = value.trim();
            break;
          }
        }
      }
      if (!assetValue) {
        throw new Error("Asset information is missing");
      }

      // Build JSON payload — requested_amount sent as a number
      const depositPayload: Record<string, any> = {
        requested_amount: safeAmount,
        deposit_address: walletAddress.trim() || "",
        payment_provider: selectedPaymentDetail.provider_name,
        payment_method: selectedPaymentDetail.payment_method_type,
        currency: currencyValue,
        network: networkValue,
        asset: isForexPrimusAsset(selectedAsset) ? "fxprimus" : assetValue,
        asset_id: String((selectedAsset as any)?.asset_id || ""),
        network_id: null,
        additional_info: `Account: ${selectedPaymentDetail.account_name}, Account Number: ${selectedPaymentDetail.account_number}`,
      };

      // Submit to API
      const depositResponse = (await dispatch(
        createDeposit({
          payload: depositPayload,
          config: {
            headers: { "Content-Type": "application/json" },
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
        const receiveFromInput = parseFloat(getAmountInput) || getAmount;
        const transactionData = {
          type: "deposit" as const,
          amount: payAmount,
          receiveAmount: receiveFromInput, // From "You Receive" input
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
          commission: depositResponse.commission,
          networkFee: depositResponse.network_fee,
          currency: depositResponse.currency,
          websocketUrl: depositResponse.websocket_url,
        };
        onExchange(transactionData);
      }
    } catch (error: any) {
      let errorMessage = extractSubmitErrorMessage(
        error,
        "Failed to submit deposit request"
      );

      if (error.response?.data) {
        // Try to extract specific error message from response
        const responseData = error.response.data;
        if (responseData.message) {
          // Check for specific error message and show user-friendly message
          if (
            responseData.message.includes(
              "Transaction not found or not eligible for address update"
            )
          ) {
            errorMessage = "Your address doesn't match the requested asset";
          } else {
            errorMessage = responseData.message;
          }
        } else if (responseData.error) {
          // Check for specific error in error field
          if (
            responseData.error.includes(
              "Transaction not found or not eligible for address update"
            )
          ) {
            errorMessage = "Your address doesn't match the requested asset";
          } else {
            errorMessage = responseData.error;
          }
        } else if (responseData.details) {
          errorMessage = responseData.details;
        } else if (typeof responseData === "string") {
          // Check for specific error in string response
          if (
            responseData.includes(
              "Transaction not found or not eligible for address update"
            )
          ) {
            errorMessage = "Your address doesn't match the requested asset";
          } else {
            errorMessage = responseData;
          }
        }
      } else if (error.message) {
        // Check for specific error in error.message
        if (
          error.message.includes(
            "Transaction not found or not eligible for address update"
          )
        ) {
          errorMessage = "Your address doesn't match the requested asset";
        } else {
          errorMessage = error.message;
        }
      }

      // For address update failures, show more specific message
      if (
        errorMessage === "Failed to process request" ||
        errorMessage === "Failed to submit deposit request"
      ) {
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
    <div className="flex flex-col dark:bg-[var(--bg-color)] pl-0 pr-2 sm:pr-0 mr-0 sm:mr-40 w-full mx-auto">
      <h2 className="text-xl font-bold mb-2 text-[#788099] dark:text-[#788099] inline-flex items-center gap-2">

        {t("express.transactionInfo", "Transaction Info")}
      </h2>

      <div className="w-full text-white">
        {/* Top Section - Amount and Bank/Payment Method in one card */}
        <div className="relative mb-2 sm:mb-3 md:mb-4">
          {/* Top Card Container */}
          <div className="relative flex flex-col sm:flex-row items-stretch sm:items-start border border-border dark:border-accent rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 overflow-visible gap-2 sm:gap-3 md:gap-0 bg-white dark:bg-[#18181D]">
            {/* Amount Section */}
            <div className="flex-1 w-full sm:min-w-0">
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
                {t("express.youSend", "You Send")}
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
                {/* {isCalculatingFromPay && (
                  <span className="text-xs text-[#1D8751] font-medium">(Active)</span>
                )} */}
              </label>
              <div className="relative">
                {/* <input
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
                        if (decimalPart && decimalPart.length > 5) {
                          setApiValidationError(
                            "Number cannot have more than 5 decimal places."
                          );
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
                        if (isOtcPopupAsset(selectedAsset) && newAmount > 15000) {
                          setIsInfoModalOpen(true);
                        }

                        // For direct assets, calculate immediately (first 3 use exchange lookup in useEffect)
                        if (
                          selectedAsset &&
                          newAmount > 0 &&
                          isSimpleCalculationAsset(selectedAsset)
                        ) {
                          if (isExchangeCommissionLookupAsset(selectedAsset)) {
                            // getAmount set by fetchExchangeCommissionLookup effect
                          } else {
                            const commissionAmount = isCommissionApiAsset(selectedAsset)
                              ? (newAmount * (apiCommission ?? 2)) / 100
                              : (newAmount * (selectedAsset?.range_commissions?.[0]?.commission ? parseFloat(selectedAsset.range_commissions[0].commission) : 2)) / 100;
                            const calculatedGetAmount = Math.max(0, newAmount - commissionAmount);
                            setGetAmount(calculatedGetAmount);
                            setGetAmountInput(calculatedGetAmount.toString());
                          }
                        } else if (
                          selectedAsset &&
                          newAmount > 0 &&
                          isForexAsset(selectedAsset)
                        ) {
                          // For FXP, calculate immediately with 1.06 rate
                          const calculatedGetAmount =
                            newAmount / FXP_EXCHANGE_RATE;
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
                  className={`w-full text-[#35353e] dark:bg-[#18181D] dark:text-[#ffffff] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 pr-12 sm:pr-16 text-base sm:text-lg focus:outline-none border appearance-none min-h-[60px] ${
                    (isCalculating || isCalculatingReceive) &&
                    isCalculatingFromPay &&
                    selectedAsset &&
                    !isForexAsset(selectedAsset)
                      ? "border-[#1D8751]"
                      : "border-[#A2A4A9FF] dark:border-[#35353E]"
                  }`}
                /> */}
                <input
                  type="text"
                  inputMode="decimal"
                  value={payAmountInput}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (value === payAmountInput) return;

                    const normalizedValue = normalizeToFiveDecimals(value);
                    if (normalizedValue === "" || /^\d*\.?\d*$/.test(normalizedValue)) {
                      if (value !== normalizedValue) {
                        setApiValidationError("Number cannot have more than 5 decimal places.");
                      }
                      if (normalizedValue.includes(".")) {
                        const decimalPart = normalizedValue.split(".")[1];
                        if (decimalPart && decimalPart.length > 5) {
                          setApiValidationError("Number cannot have more than 5 decimal places.");
                          return;
                        }
                      }

                      const newAmount = parseFloat(normalizedValue) || 0;

                      if (newAmount !== payAmount || normalizedValue !== payAmountInput) {
                        setPayAmountInput(normalizedValue);
                        setPayAmount(newAmount);
                        setIsCalculatingFromPay(true);
                        setApiValidationError(null);
                        setIsUserModifiedAmount(true);

                        if (isOtcPopupAsset(selectedAsset) && newAmount > 15000) setIsInfoModalOpen(true);

                        if (selectedAsset && newAmount > 0 && isSimpleCalculationAsset(selectedAsset)) {
                          if (!isExchangeCommissionLookupAsset(selectedAsset)) {
                            const commissionAmount = isCommissionApiAsset(selectedAsset)
                              ? (newAmount * (apiCommission ?? 2)) / 100
                              : (newAmount * (selectedAsset?.range_commissions?.[0]?.commission ? parseFloat(selectedAsset.range_commissions[0].commission) : 2)) / 100;
                            const calculatedGetAmount = Math.max(0, newAmount - commissionAmount);
                            setGetAmount(calculatedGetAmount);
                            setGetAmountInput(calculatedGetAmount.toString());
                          }
                        } else if (
                          selectedAsset &&
                          newAmount > 0 &&
                          isForexAsset(selectedAsset)
                        ) {
                          const calculatedGetAmount = newAmount / FXP_EXCHANGE_RATE;
                          setGetAmount(calculatedGetAmount);
                          setGetAmountInput(calculatedGetAmount.toFixed(2));
                        } else if (selectedAsset && newAmount > 0) {
                          setIsCalculating(true);
                          setIsCalculatingReceive(true);
                          calculateAmounts(newAmount, true);
                        } else {
                          setIsCalculatingReceive(false);
                          setIsCalculating(false);
                        }
                      }
                    }
                  }}
                  placeholder="Enter amount"
                  className={`w-full h-[48px] text-[#35353e] dark:text-white bg-transparent dark:bg-transparent
    rounded-2xl px-3 sm:px-4 pr-12 sm:pr-16 text-base sm:text-lg focus:outline-none
    border appearance-none transition-colors duration-200
    ${(isCalculating || isCalculatingReceive) &&
                      isCalculatingFromPay &&
                      selectedAsset &&
                      !isForexAsset(selectedAsset)
                      ? "border-[#1D8751]"
                      : "border-[#A2A4A9FF] dark:border-[#35353E]"
                    }`}
                />


                {apiValidationError && (
                  <div className="mt-2 text-xs text-red-500">
                    {apiValidationError}
                  </div>
                )}

                {/* Show loading spinner when calculating "You Receive" from "You Send" */}
                {(isCalculating || isCalculatingReceive) &&
                  isCalculatingFromPay &&
                  selectedAsset &&
                  !isForexAsset(selectedAsset) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D8751]"></div>
                    </div>
                  )}

                {/* Show info for non-direct assets when typing in You Send */}
                {selectedAsset &&
                  !apiValidationError &&
                  !isSimpleCalculationAsset(selectedAsset) &&
                  !isForexAsset(selectedAsset) &&
                  isCalculatingFromPay &&
                  payAmount > 0 && (
                    <div className="mt-2 text-xs text-[#788099]">
                      {estimateLoading
                        ? t("express.fetchingLiveRate", "⏳ Fetching live rate...")
                        : estimate
                          ? t("express.usingLiveRate", "✅ Using live rate")
                          : t("express.calculating", "⏳ Calculating...")}
                    </div>
                  )}
              </div>
            </div>

            {/* Bank/Payment Method Section */}
            <div
              data-select-card="true"
              className="flex-1 w-full sm:min-w-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-[#35353E] dark:border-[#35353E] pt-2 sm:pt-0 sm:border-none"
            >
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                {t("express.bankPaymentMethod", "Bank/Payment Method")}
              </label>
              {/* <div>
                hello
                {
                  adminMethods.map((payment: any) => (
                    <div key={payment.id}>
                      <img src={payment.logo} alt={payment.provider_name} className="w-5 h-5" />
                      <span>{payment.provider_name}</span>
                    </div>
                  ))
                }
              </div> */}

              <div className="relative">
                <CustomSelect
                  options={(() => {
                    const mappedOptions = paymentMethodsForSelect.map(
                      (payment: any, index: number) => {
                        // Get logo URL - check all known fields and ensure it's a valid string
                        const firstDetail =
                          payment.payment_details &&
                            payment.payment_details.length > 0
                            ? payment.payment_details[0]
                            : null;
                        const detailLogo = extractLogoFromDetail(firstDetail);
                        const rawLogo = resolveProviderLogo(
                          payment.logo_url,
                          payment.provider_logo,
                          payment.logo,
                          payment.provider_logo_url,
                          payment.logoUrl,
                          detailLogo
                        );

                        const fallbackLogo = resolveProviderLogo(
                          payment.provider_logo,
                          payment.logo,
                          detailLogo
                        );

                        const logoUrl = getHighResPaymentLogo(
                          rawLogo,
                          fallbackLogo
                        );

                       

                       

                        const methodKey = getPaymentMethodKey(payment);
                        const providerLabel =
                          payment?.provider_name ||
                          payment?.payment_provider_name ||
                          payment?.provider ||
                          "Payment Method";
                        return {
                          value: methodKey || String(payment.provider_id ?? index),
                          label: providerLabel,
                          logo: logoUrl,
                        };
                      }
                    );

                    console.log("🔍 Final CustomSelect Options:", {
                      optionsCount: mappedOptions.length,
                      optionsWithLogos: mappedOptions.filter((opt) => opt.logo)
                        .length,
                      optionsWithoutLogos: mappedOptions.filter(
                        (opt) => !opt.logo
                      ).length,
                      firstOption: mappedOptions[0] || null,
                      allOptions: mappedOptions.map((opt) => ({
                        value: opt.value,
                        label: opt.label,
                        hasLogo: !!opt.logo,
                        logo: opt.logo,
                      })),
                    });

                    return mappedOptions;
                  })()}
                  value={payBank}
                  logoSize={PAYMENT_LOGO_SIZE}
                  logoClassName={PAYMENT_LOGO_BASE_CLASS}
                  sizeMode="card"
                  onChange={(value) => {
                    const selectedPayment = findPaymentMethodInList(
                      paymentMethodsForSelect,
                      value
                    );

                    // Normalize payment details to ensure account_name and account_number are extracted
                    const normalizedPayment = normalizePaymentDetails(selectedPayment);

                    // Debug logging when payment method is selected
                    if (normalizedPayment) {
                      console.log("🔍 Selected Payment Method:", {
                        isHomePage,
                        provider_name: normalizedPayment.provider_name,
                        provider_logo: normalizedPayment.provider_logo,
                        logo: normalizedPayment.logo,
                        account_name: normalizedPayment.account_name,
                        account_number: normalizedPayment.account_number,
                        hasLogo: !!(
                          normalizedPayment.provider_logo || normalizedPayment.logo
                        ),
                        admin_payment_detail_id:
                          normalizedPayment.admin_payment_detail_id,
                        hasAdminPaymentDetails: !!(normalizedPayment as any).admin_payment_details,
                        adminPaymentDetailsLength: (normalizedPayment as any).admin_payment_details?.length || 0,
                        hasPaymentDetails: !!(normalizedPayment as any).payment_details,
                        paymentDetailsLength: (normalizedPayment as any).payment_details?.length || 0,
                        fullPayment: normalizedPayment,
                      });
                    }

                    setPayBank(value);
                    setSelectedPaymentDetail(normalizedPayment);
                  }}
                  placeholder={
                    paymentMethodsDisplay.isLoading &&
                      finalPaymentMethods.length === 0
                      ? "Loading payment methods..."
                      : finalPaymentMethods && finalPaymentMethods.length > 0
                        ? "Select Payment Method"
                        : "No payment methods available"
                  }
                  disabled={
                    paymentMethodsDisplay.isLoading &&
                    finalPaymentMethods.length === 0
                  }
                  loading={
                    paymentMethodsDisplay.isLoading &&
                    finalPaymentMethods.length === 0
                  }
                  loadingText="Loading payment methods..."
                  emptyText="No payment methods available"
                  searchable={true}
                  className="w-full"
                />
              </div>
              {adminMethodsError && (
                <p className="text-red-500 text-sm mt-1">{adminMethodsError}</p>
              )}
            </div>
          </div>

          {/* Swap Circle - positioned to touch both borders equally */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full -translate-y-1/3 z-10">
            {!isHomePage && (
              <button
                className="w-10 h-10 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105 sm:min-h-0 touch-manipulation"
                onClick={() => {
                  // Switch between deposit and withdrawal modes
                  if (onModeChange) {
                    // Preserve current state including payment method selection and asset selection
                    // Convert single payment detail to array format for withdrawal form
                    const currentState = {
                      payBank,
                      payment: selectedPaymentDetail,
                      paymentDetails: selectedPaymentDetail ? [selectedPaymentDetail] : [],
                      selectedAsset,
                      asset: selectedAsset,
                      payAmountInput,
                      getAmountInput,
                      amountInput: payAmountInput,
                      receiveAmountInput: getAmountInput,
                      amountValue: parseFloat(payAmountInput) || 0,
                      receiveAmountValue: getAmount,
                      walletAddress,
                    };
                    onModeChange(mode === "deposit" ? "withdrawal" : "deposit", currentState);
                  }
                }}
              >
                {/* Light mode image */}
                <img
                  src="/assets/Frame_36261_1_d9cnq1.png"
                  alt="swap icon"
                  className="w-10 h-10 sm:w-10 sm:h-10 dark:hidden"
                />
                {/* Dark mode image */}
                <img
                  src="/assets/Frame_36261_ledmyw.png"
                  alt="swap icon"
                  className="w-10 h-10 sm:w-10 sm:h-10 hidden dark:block"
                />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Section - You Receive and Asset in one card */}
        <div className="relative mb-2 sm:mb-3">
          <div className="relative flex flex-col sm:flex-row items-stretch sm:items-start border border-border dark:border-accent rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 overflow-visible gap-2 sm:gap-3 md:gap-0 bg-white dark:bg-[#18181D]">
            {/* You Receive Section */}
            <div className="flex-1 w-full sm:min-w-0">
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
                {t("express.youReceive", "You Receive")}
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
                {!isCalculatingFromPay && (
                  <span className="text-xs text-[#1D8751] font-medium hidden sm:inline">
                    {t("express.active", "(Active)")}
                  </span>
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

                    // You Receive supports high precision decimals.
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      const newAmount = parseFloat(value) || 0;

                      // Only update and calculate if the numeric value actually changed
                      if (newAmount !== getAmount || value !== getAmountInput) {
                        setGetAmountInput(value); // Store raw string for display
                        setGetAmount(newAmount);
                        setIsCalculatingFromPay(false);

                        // Clear API validation error when user changes amount
                        setApiValidationError(null);

                        // For direct assets, reverse calculate (first 3 use exchange lookup in useEffect)
                        if (
                          selectedAsset &&
                          newAmount > 0 &&
                          isSimpleCalculationAsset(selectedAsset)
                        ) {
                          if (!isExchangeCommissionLookupAsset(selectedAsset)) {
                            const commissionRate = isCommissionApiAsset(selectedAsset) ? (apiCommission ?? 2) : (selectedAsset?.range_commissions?.[0]?.commission ? parseFloat(selectedAsset.range_commissions[0].commission) : 2);
                            const calculatedPayAmount = newAmount / (1 - commissionRate / 100);
                            setPayAmount(calculatedPayAmount);
                            setPayAmountInput(calculatedPayAmount.toString());
                          }
                        } else if (
                          selectedAsset &&
                          newAmount > 0 &&
                          isForexAsset(selectedAsset)
                        ) {
                          const calculatedPayAmount = getFxpReversePayAmount(newAmount);
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
                  className={`w-full h-[48px] text-[#35353e] dark:text-white bg-transparent dark:bg-transparent rounded-2xl px-4 pr-16 text-base sm:text-lg focus:outline-none border appearance-none transition-colors duration-200 ${receiveAmountError &&
                    (receiveAmountError.includes("Rough estimate") ||
                      receiveAmountError.includes("Using estimated rate"))
                    ? "border-[#F79330]"
                    : receiveAmountError
                      ? "border-red-500"
                      : (isCalculating || isCalculatingReceive) &&
                        selectedAsset &&
                        !isForexAsset(selectedAsset)
                        ? "border-[#1D8751]"
                        : "border-[#A2A4A9FF] dark:border-[#35353E]"
                    }`}
                />
                {/* Show loading spinner when calculating "You Send" from "You Receive" */}
                {(isCalculating || isCalculatingReceive) &&
                  !isCalculatingFromPay &&
                  selectedAsset &&
                  !isForexAsset(selectedAsset) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D8751]"></div>
                    </div>
                  )}
                {(isCalculating || isCalculatingReceive || estimateLoading) &&
                  isCalculatingFromPay &&
                  selectedAsset &&
                  !isForexAsset(selectedAsset) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1D8751]"></div>
                    </div>
                  )}
                {receiveAmountError && (
                  <div className="flex items-center gap-2 mt-2">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
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
                    <span
                      className={`text-sm font-medium ${receiveAmountError.includes("Rough estimate") ||
                        receiveAmountError.includes("Using estimated rate")
                        ? "text-[#F79330]"
                        : "text-red-500"
                        }`}
                    >
                      {receiveAmountError}
                    </span>
                  </div>
                )}

                {/* Show API estimate status for non-direct assets */}
                {selectedAsset &&
                  !isSimpleCalculationAsset(selectedAsset) &&
                  !isForexAsset(selectedAsset) && (
                    <div className="mt-2">
                      {estimate && !estimateLoading && isCalculatingFromPay && (
                        <div className="flex items-center gap-2 text-[#1D8751] text-sm">
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M12 8v4m0 4h.01"
                              stroke="#1D8751"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="#1D8751"
                              strokeWidth="2"
                            />
                          </svg>
                          <span>{t("express.usingLiveRateShort", "Using live rate")}</span>
                        </div>
                      )}
                      {estimateLoading && !isCalculatingFromPay && (
                        <div className="flex items-center gap-2 text-[#1D8751] text-sm">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1D8751]"></div>
                          <span>{t("express.calculatingShort", "Calculating ...")}</span>
                        </div>
                      )}
                      {estimate &&
                        !estimateLoading &&
                        !isCalculatingFromPay && (
                          <div className="flex items-center gap-2 text-[#1D8751] text-sm">
                            <svg
                              width="16"
                              height="16"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M12 8v4m0 4h.01"
                                stroke="#1D8751"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="#1D8751"
                                strokeWidth="2"
                              />
                            </svg>
                            <span>{t("express.usingLiveRateReverse", "Using live rate for reverse calculation")}</span>
                          </div>
                        )}
                    </div>
                  )}
              </div>
            </div>

            {/* Asset Section */}
            <div className="flex-1 w-full sm:min-w-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-[#35353E] dark:border-[#35353E] pt-3 sm:pt-0 sm:border-none">
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                {t("express.asset", "Asset")}
              </label>
              <div className="relative" ref={assetDropdownRef}>
                <div
                  className={`h-[48px] w-full text-[#35353e] bg-transparent dark:bg-transparent dark:text-[#ffffff] rounded-2xl px-3 sm:px-4 text-base sm:text-lg border border-[#A2A4A9FF] dark:border-[#35353E] hover:border-blue-400 dark:hover:border-blue-400 flex items-center justify-between cursor-pointer transition-colors duration-200`}
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
                          className={`${ASSET_ICON_BASE_CLASS} w-6 h-6`}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = getHighResAssetIcon(null, 72);
                          }}
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-[#35353e] dark:text-white font-medium">
                              {(
                                selectedAsset.ticker ||
                                selectedAsset.symbol ||
                                selectedAsset.name ||
                                "Unknown"
                              ).toUpperCase()}
                            </span>
                            <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-semibold px-2 py-0.5 rounded-full">
                              {getNetworkDisplayName(
                                getAssetNetwork(selectedAsset)
                              )}
                            </span>
                          </div>
                          <span className="text-[#788099] text-xs">
                            {selectedAsset.name ||
                              selectedAsset.ticker ||
                              selectedAsset.symbol ||
                              "Unknown"}{" "}
                            (
                            {getNetworkDisplayName(
                              getAssetNetwork(selectedAsset)
                            )}
                            )
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <img
                          src={getHighResAssetIcon(null, 72)}
                          alt="asset icon"
                          className={`${ASSET_ICON_BASE_CLASS} w-9 h-9`}
                          loading="lazy"
                        />
                        <span className="text-[#7e7e8f] dark:text-[#788099]">
                          {assetsDisplay.isLoading
                            ? t("express.loadingAssets", "Loading assets...")
                            : t("express.selectAsset", "Select Asset")}
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
                {renderAssetDropdown()}
              </div>
            </div>
          </div>
        </div>

        {/* Fee & Rate - Dynamic based on selected asset */}
        {/* <div className="flex items-center rounded-2xl border border-border bg-[#23232b] px-2 py-2 mb-3">
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

        {/* Disclaimer Banner */}
        <div className="flex items-center rounded-2xl px-2 sm:px-3 md:px-4 py-2 sm:py-3 mb-2 sm:mb-4 bg-white dark:bg-[#18181D]">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[#E23D3A] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[#E23D3A] text-xs font-bold">i</span>
            </div>
            <span className="text-[#35353e] dark:text-[#788099] text-sm font-medium">
              {t("express.estimate.notice", "This is only an estimated price based on current market rates. The final price will be confirmed when we receive the funds.")}
            </span>
          </div>
        </div>

        {/* Submit Button for First Card */}
        {!isFirstCardSubmitted && !showForexForm && (
          <div className="mt-2 sm:mt-3 md:mt-4 relative">
            <button
              className={`w-full text-white dark:text-white text-sm sm:text-base font-medium py-3 sm:py-2 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-colors min-h-[44px] sm:min-h-0 ${isHomePage
                ? isSubmitting
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#1D8751] hover:bg-[#166b3e] cursor-pointer"
                : isSubmitting
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#1D8751] hover:bg-[#166b3e]"
                }`}
              disabled={isHomePage
                ? isSubmitting
                : isSubmitting
              }
              onClick={() => {
                // Prevent submission if amount is >= 15000
                if (exceedsDecimalPrecisionLimit) {
                  showToast.error("Number cannot have more than 5 decimal places.");
                  return;
                }

                if (isOtcPopupAsset(selectedAsset) && (payAmount >= 15000 || getAmount >= 15000)) {
                  showToast.error("Amount cannot exceed $15,000. Please contact OTC Desk for larger amounts.");
                  setIsInfoModalOpen(true);
                  return;
                }

                if (isHomePage) {
                  const state = {
                    mode,
                    amountInput: payAmountInput,
                    amountValue: payAmount,
                    asset: selectedAsset,
                    payment: selectedPaymentDetail,
                    walletAddress,
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
                  setShowForexForm(true);
                } else {
                  handleFirstCardSubmit();
                }
              }}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#35353e] dark:border-[#788099]"></div>
                  <span>{t("express.posting", "Submiting...")}</span>
                </div>
              ) : (
                <span className="flex items-center justify-center">
                  <span className="text-base font-semibold dark:text-white text-white">
                    {/* {t("express.express", "Express")} */}
                    E
                  </span>
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

        {/* Forex Form - Shows when FXP is selected */}
        {showForexForm && selectedAsset && isForexAsset(selectedAsset) && (
          <div className="mt-2 sm:mt-3 md:mt-4 space-y-2 sm:space-y-3 md:space-y-4">
            {/* Payment Method Details */}
            {effectivePaymentDetail && (
              <>
                <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-[#788099] dark:text-[#788099] inline-flex items-center gap-2">
                  <span className="text-[#7e7e8f] dark:text-[#788099]">2-</span>{" "}
                  {t("express.paymentDetails", "Payment Details")}
                </h2>
                <div className="flex-1 bg-white dark:bg-[#18181D] rounded-2xl border border-border dark:border-[#35353E] flex flex-col justify-between p-3 sm:p-4 md:p-5 relative min-h-[120px]">
                  {/* Bank and logo */}
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <span className="text-[#7e7e8f] dark:text-[#788099] text-base font-semibold">
                      {t("express.bank", "Bank:")}
                    </span>
                    <div className="flex items-center gap-2">
                      <img
                        src={getHighResPaymentLogo(
                          resolveProviderLogo(
                            effectivePaymentDetail.logo_url,
                            extractLogoFromDetail(
                              effectivePaymentDetail.payment_details?.[0]
                            ),
                            effectivePaymentDetail.provider_logo
                          ),
                          effectivePaymentDetail.logo ||
                          effectivePaymentDetail.provider_logo,
                          PAYMENT_LOGO_SIZE
                        )}
                        alt={`${effectivePaymentDetail.provider_name || "Bank"} Logo`}
                        className={`${PAYMENT_LOGO_BASE_CLASS} w-9 h-9`}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = getHighResPaymentLogo(
                            null,
                            null,
                            PAYMENT_LOGO_SIZE
                          );
                        }}
                      />
                      <span className="text-[#35353e] dark:text-[#788099] text-base font-semibold">
                        {effectivePaymentDetail.provider_name}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-dashed border-border mb-2"></div>
                  {/* Account Name */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#7e7e8f] dark:text-[#788099] text-base font-medium">
                      {t("express.accountName", "Account Name :")}
                    </span>
                    <span className="text-[#35353e] dark:text-[#788099] text-base font-medium">
                      {effectivePaymentDetail.account_name || effectivePaymentDetail?.payment_details?.[0]?.account_name || "N/A"}
                    </span>
                  </div>
                  <div className="border-t border-dashed border-border mb-2"></div>
                  {/* Account Number */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#7e7e8f] dark:text-[#788099] text-base font-medium">
                      {t("express.accountNumber", "Account Number :")}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#35353e] dark:text-[#788099] text-base font-medium">
                        {effectivePaymentDetail.account_number || effectivePaymentDetail?.payment_details?.[0]?.account_number || effectivePaymentDetail?.payment_details?.[0]?.mobile_number || "N/A"}
                      </span>
                      <button
                        onClick={() => {
                          const accNumber = effectivePaymentDetail.account_number || effectivePaymentDetail?.payment_details?.[0]?.account_number || effectivePaymentDetail?.payment_details?.[0]?.mobile_number || "";
                          navigator.clipboard.writeText(accNumber);
                          showToast.success(t("express.accountNumberCopied", "Account number copied!"));
                        }}
                        className="text-[#F79330] hover:text-white transition-colors p-2 sm:p-1 rounded min-h-[44px] sm:min-h-0 flex items-center justify-center touch-manipulation"
                        title="Copy Account Number"
                      >
                        <svg
                          width="18"
                          height="18"
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
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            <h2 className="text-xl font-bold mb-2 text-[#788099] dark:text-[#788099] inline-flex items-center gap-2">
              <span className="text-[#7e7e8f] dark:text-[#788099]">3-</span>{" "}
              {t("express.forexAccountDetails", "Forex Account Details")}
            </h2>

            {/* Forex Account Number */}
            <div className="flex flex-col bg-white dark:bg-[#18181D] border border-[#35353E] rounded-2xl p-3 sm:p-4 md:p-5 shadow-lg">
              <label className="block text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                {t("express.yourForexAccountNumber", "Your Forex Account Number")}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={forexAccountNumber}
                onChange={(e) => setForexAccountNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter your forex account number"
                className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff] rounded-2xl px-4 py-2 text-lg focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E]"
              />
            </div>

            {/* User Notes */}
            <div className="flex flex-col bg-white dark:bg-[#18181D] border border-[#35353E] rounded-2xl p-3 sm:p-4 md:p-5 shadow-lg">
              <label className="block text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                {t("express.additionalNotesOptional", "Additional Notes (Optional)")}
              </label>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="Add any special instructions or notes..."
                className="w-full text-[#35353e] dark:bg-[#18181D] dark:text-[#ffffff] rounded-2xl px-3 sm:px-4 py-2 text-lg focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E] min-h-[100px] resize-none"
              />
            </div>

            {/* Submit Forex Exchange Button */}
            <button
              className={`w-full text-white text-sm sm:text-base font-medium py-3 sm:py-3 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-colors min-h-[44px] sm:min-h-0 ${isSubmitting || !forexAccountNumber.trim()
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-[#1D8751] hover:bg-[#166b3e]"
                }`}
              onClick={async () => {
                if (!forexAccountNumber.trim()) {
                  showToast.error("Please enter your forex account number");
                  return;
                }

                setIsSubmitting(true);

                try {
                  const { createForexExchangeThunk } = await import(
                    "../../slices/forexSlice"
                  );

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
                    /* keep selector snapshot */
                  }

                  const resolvedAdminId = resolveForexDepositAdminPaymentDetailId({
                    effective: effectivePaymentDetail,
                    selected: selectedPaymentDetail,
                    payBank,
                    methods: paymentMethodsForSelect,
                    adminMethods: Array.isArray(adminMethods) ? adminMethods : [],
                    exchangeAdminPaymentDetails: exchangeDetailsForForex,
                  });

                  if (!resolvedAdminId?.trim() || !UUID_REGEX.test(resolvedAdminId.trim())) {
                    showToast.error(
                      t(
                        "express.forexPaymentDetailMissing",
                        "We could not link this bank to an admin payment record. Open the payment dropdown and choose your bank again, then submit."
                      )
                    );
                    setIsSubmitting(false);
                    return;
                  }

                  const forexPayload = {
                    transaction_type: "deposit" as const,
                    from_currency: "USD",
                    from_amount: payAmount.toFixed(2),
                    to_currency: "FXPRIMUS",
                    to_amount: getAmount.toFixed(2),
                    exchange_rate: FXP_EXCHANGE_RATE.toFixed(4),
                    additional_info: effectivePaymentDetail
                      ? `Wire transfer from ${effectivePaymentDetail.provider_name}`
                      : "Wire transfer",
                    user_notes: userNotes.trim() || t("express.forexDepositExchange", "Forex deposit exchange"),
                    user_forex_account: forexAccountNumber.trim(),
                    // Backend requires this; resolution tries nested payment_details + provider_id fallback
                    admin_payment_detail_id: resolvedAdminId,
                  };

                  console.log("🚀 Forex Deposit Payload:", forexPayload);

                  const result = await dispatch(
                    createForexExchangeThunk(forexPayload)
                  ).unwrap();

                  // Store exchange data in localStorage to avoid immediate refetch
                  localStorage.setItem(
                    "currentForexExchange",
                    JSON.stringify(result)
                  );

                  showToast.success("Forex exchange created successfully!");

                  // Navigate to forex status page using correct field name
                  router.push(
                    `/dashboard/express-exchange/forex-status?transactionId=${result.forex_transaction_id}`
                  );
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
                  <span>{t("express.creatingForexExchange", "Creating Forex Exchange...")}</span>
                </div>
              ) : (
                <span>{t("express.submitForexExchange", "Submit Forex Exchange")}</span>
              )}
            </button>
          </div>
        )}
      </div>

      {selectedPaymentDetail && isFirstCardSubmitted && (
        <>
          {/* Payment Details Card */}
          <h2 className="text-xl font-bold mb-2 text-[#788099] dark:text-[#788099] inline-flex items-center gap-2">
            {t("express.paymentDetails", "Payment Details")}
          </h2>
          <div
            ref={paymentDetailsRef}
            className="mt-1 mb-2 w-full flex flex-col gap-3 px-2 "
          >
            <div className="flex-1 bg-white dark:bg-[#18181D] rounded-2xl border border-border dark:border-[#35353E] flex flex-col justify-between p-3 sm:p-4 md:p-5 relative min-h-[120px]">
              {/* Bank and logo */}
              <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                <span className="text-[#7e7e8f] dark:text-[#788099] text-base font-semibold">
                  {t("express.bank", "Bank:")}
                </span>
                <div className="flex items-center gap-2">
                  <img
                    src={getHighResPaymentLogo(
                      resolveProviderLogo(
                        selectedPaymentDetail.logo_url,
                        extractLogoFromDetail(
                          selectedPaymentDetail.payment_details?.[0]
                        ),
                        selectedPaymentDetail.provider_logo
                      ),
                      selectedPaymentDetail.logo ||
                      selectedPaymentDetail.provider_logo,
                      PAYMENT_LOGO_SIZE
                    )}
                    alt={`${selectedPaymentDetail.provider_name || "Bank"} Logo`}
                    className={`${PAYMENT_LOGO_BASE_CLASS} w-9 h-9`}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = getHighResPaymentLogo(
                        null,
                        null,
                        PAYMENT_LOGO_SIZE
                      );
                    }}
                  />
                  <span className="text-[#35353e] dark:text-[#788099] text-base font-semibold">
                    {selectedPaymentDetail.provider_name}
                  </span>
                </div>
              </div>
              <div className="border-t border-dashed border-[#39394a] mb-2"></div>
              {/* Account Name */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#7e7e8f] dark:text-[#788099] text-base font-medium">
                  {t("express.accountName", "Account Name :")}
                </span>
                <span className="text-[#35353e] dark:text-[#788099] text-base font-medium">
                  {selectedPaymentDetail.account_name || selectedPaymentDetail?.payment_details?.[0]?.account_name || "N/A"}
                </span>
              </div>
              <div className="border-t border-dashed border-[#39394a] mb-2"></div>
              {/* Account Number */}
              <div className="flex items-center justify-between">
                <span className="text-[#7e7e8f] dark:text-[#788099] text-base font-medium">
                  {t("express.accountNumber", "Account Number :")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#35353e] dark:text-[#788099] text-base font-medium">
                    {selectedPaymentDetail.account_number || selectedPaymentDetail?.payment_details?.[0]?.account_number || selectedPaymentDetail?.payment_details?.[0]?.mobile_number || "N/A"}
                  </span>
                  <button
                    onClick={() => {
                      const accNumber = selectedPaymentDetail.account_number || selectedPaymentDetail?.payment_details?.[0]?.account_number || selectedPaymentDetail?.payment_details?.[0]?.mobile_number || "";
                      navigator.clipboard.writeText(accNumber);
                      setCopiedField("accountNumber");
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="flex items-center gap-1 text-[#F79330] hover:text-white transition-colors p-1 rounded"
                    title="Copy Account Number"
                  >
                    {copiedField === "accountNumber" ? (
                      <span className="text-xs text-[#1D8751] font-medium">copied!</span>
                    ) : (
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
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Code Card - below Payment Details, before Wallet Address */}
          {apiResponse && apiResponse.deposit_code && (
            <>
              <h2 className="text-xl font-bold mb-2 text-[#788099] dark:text-[#788099] inline-flex items-center gap-2">
                {t("express.transactionCode", "Transaction Code")}
              </h2>
              <div className="mb-4 sm:mb-6 flex flex-col gap-2 sm:gap-3 w-full px-1 sm:px-2">
                <div className="bg-white dark:bg-[#18181D] border border-border dark:border-[#35353E] rounded-2xl p-3 sm:p-4 shadow-lg w-full text-[#35353e] dark:text-[#788099]">
                  {/* Transaction Code Row */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-3">
                    {/* Display deposit code from API response - each character in its own box */}
                    <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
                      {apiResponse.deposit_code
                        .split("")
                        .map((char: string, index: number) => (
                          <div
                            key={index}
                            className="w-8 h-10 sm:w-10 sm:h-12 text-gray-900 dark:text-white bg-[#E8EFF5] dark:bg-[#35353E] border border-border dark:border-[#4A4A4A] rounded-lg flex items-center justify-center"
                          >
                            <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white font-mono">
                              {char}
                            </span>
                          </div>
                        ))}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(apiResponse.deposit_code);
                        showToast.success(t("express.transactionCodeCopied", "Transaction code copied!"));
                      }}
                      className="flex items-center text-gray-900 dark:text-white gap-2 dark:bg-[#35353E] bg-[#E8EFF5] border border-[#1D8751] rounded-full px-3 py-2 sm:px-4 font-semibold text-xs sm:text-sm hover:bg-[#1D8751] hover:text-white transition-colors"
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
                      {t("express.copy", "Copy")}
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
                        {t("express.note", "Note")}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-[#18181D] border border-[#1D8751] rounded-xl p-2 sm:p-3">
                      <ul className="list-none space-y-1">
                        <li className="flex items-start">
                          <span className="w-2 h-2 mt-1 rounded-full bg-[#1D8751] inline-block mr-2 shrink-0"></span>
                          <span className="text-[#35353e] dark:text-[#788099] text-xs">
                            Please write this Transaction Code in the bank
                            message or note section.
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

          {/* Wallet Address Section */}
          <h2 className="text-xl font-bold mb-2 text-[#788099] dark:text-[#788099] inline-flex items-center gap-2">
            {t("express.walletAddress", "Wallet Address")}
          </h2>
          
          {/* Dynamic Crypto Warning Banner */}
          {selectedAsset && (
            <div className="mb-4 p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl">
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                  <span className="font-bold">Important:</span> Ensure your wallet address is for <span className="font-bold text-yellow-900 dark:text-yellow-100">{selectedAsset?.symbol || selectedAsset?.ticker || 'the selected asset'}</span> on the <span className="font-bold text-yellow-900 dark:text-yellow-100">{currentNetwork || selectedAsset?.network || 'selected network'}</span> network. Providing an incorrect address or network may result in <span className="font-bold">permanent loss of funds</span>.
                </p>
              </div>
            </div>
          )}
          
          <div className="flex flex-col bg-white dark:bg-[#1D1D23] border border-border dark:border-[#35353E] rounded-2xl p-5 shadow-lg w-full text-[#35353e] dark:text-[#788099] mb-6">
            {/* Wallet/Account Address Label */}
            <label className="block text-sm sm:text-[17px] text-[#7e7e8f] mb-2 font-semibold">
              {t("express.walletAccountAddress", "Wallet/Account Address")}
            </label>
            {/* Input + Paste row - always inline so paste button sits next to input */}
            <div className="flex items-center gap-2 w-full">
            <div className="relative flex items-center flex-1 bg-white dark:bg-[#18181D] border border-[#39394a] dark:border-[#35353E] rounded-2xl px-2 sm:px-3 md:px-4 py-2">
              {/* Left icon */}
                <span className="flex-shrink-0 text-[#1D8751] mr-1">
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
                    setWalletError(null); // Clear error immediately for better UX

                    // Validate address in real-time using the validation hook
                    if (value.trim() === "") {
                      resetAddressValidation();
                      setWalletError(null); // No error when empty - address is optional
                    } else {
                      // Trigger validation as user types
                      validateAddress(value, currentCurrency, currentNetwork);
                    }
                    setForceUpdate((prev) => prev + 1);
                  }}
                  placeholder={`Paste your ${(selectedAsset?.ticker || selectedAsset?.symbol || "crypto").toUpperCase()} address`}
                  className={`flex-1 min-w-[120px] sm:min-w-0 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-[#788099] text-sm sm:text-base font-mono tracking-wide w-full pr-10 ${walletError
                    ? "border-red-500"
                    : walletAddress.trim() && !walletError && addressValidationResult?.isValid
                      ? "border-green-500"
                      : ""
                    }`}
                />
                {/* Bookmark icon - right end inside input, clickable to load from bookmarks */}
                <span
                  ref={bookmarkAnchorRef}
                  className="absolute right-3 flex-shrink-0 text-[#1D8751] cursor-pointer hover:opacity-80 transition-opacity"
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
              </div>
              <button
                title="Paste"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    clearSaveBookmarkError();
                    setWalletAddress(text);
                    // Trigger validation after pasting
                    if (text.trim()) {
                      validateAddress(text, currentCurrency, currentNetwork);
                    } else {
                      resetAddressValidation();
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
            {walletAddress.trim() && currentCurrency && (
              <div className="mt-2">
                {isAddressValidating && (
                  <p className="text-[#1D8751] text-sm font-medium flex items-center gap-2">
                    <span
                      className="w-4 h-4 border-2 border-[#1D8751] border-t-transparent rounded-full animate-spin"
                      aria-hidden="true"
                    />
                    Validating address...
                  </p>
                )}
                {!isAddressValidating && walletError && (
                  <p className="text-red-500 text-sm font-medium flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    {walletError}
                  </p>
                )}
                {!isAddressValidating && !walletError && addressValidationResult?.isValid && (
                  <p className="text-[#1D8751] text-sm font-medium flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    Valid address ✓
                  </p>
                )}
              </div>
            )}
            {walletError && !currentCurrency && walletAddress.trim() && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                ❌ {walletError}
              </p>
            )}

            {saveBookmarkError && (
              <p className="text-red-500 text-sm mt-2 font-medium flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {saveBookmarkError}
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
              <div className=" dark:bg-[#1D1D23] border border-[#1D8751] rounded-2xl p-4">
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

          {/* Agreement checkbox before final button */}
          <div className="flex flex-col gap-3 w-full px-2 pb-3 mb-3 border-b border-[#35353E]">
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
            <label className="flex items-start gap-2 text-xs sm:text-sm text-[#35353e] dark:text-[#788099] mb-1">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="terms-checkbox-green mt-0.5 w-5 h-5 rounded border-2 border-[#1D8751] focus:ring-[#1D8751] appearance-none bg-transparent checked:bg-[#1D8751] checked:border-[#1D8751] flex-shrink-0"
              />
              <span className="text-[#35353e] dark:text-[#788099]">
                I've read and agree to the OMAYA EXCHANGE{" "}
                <Link
                  href="/legal/terms-of-service"
                  className="underline text-[#1D8751]"
                  onClick={handleBeforeLegalNavigate}
                >
                  Terms of Use
                </Link>
                ,{" "}
                <Link
                  href="/legal/privacy-policy"
                  className="underline text-[#1D8751]"
                  onClick={handleBeforeLegalNavigate}
                >
                  Privacy Policy
                </Link>
                ,{" "}
                <Link
                  href="/legal/payment-policy"
                  className="underline text-[#1D8751]"
                  onClick={handleBeforeLegalNavigate}
                >
                  Payment Policies
                </Link>
                ,{" "}
                <Link
                  href="/legal/aml-policy"
                  className="underline text-[#1D8751]"
                  onClick={handleBeforeLegalNavigate}
                >
                  AML
                </Link>
                ,{" "}
                <Link
                  href="/legal/risk-disclosure-statement"
                  className="underline text-[#1D8751]"
                  onClick={handleBeforeLegalNavigate}
                >
                  Risk Disclosure Statements
                </Link>
                .
              </span>
            </label>

            {/* Button outside the card */}
            <button
              className={`w-full text-white dark:text-white text-sm sm:text-base font-medium py-3 sm:py-2 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-colors min-h-[44px] sm:min-h-0 ${isProceedDisabled
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-[#1D8751] hover:bg-[#166b3e]"
                }`}
              onClick={handleProceedToNext}
              disabled={isProceedDisabled}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#35353e] dark:border-[#35353E]"></div>
                  <span>{t("express.processing", "Processing...")}</span>
                </div>
              ) : (
                <span className="flex items-center justify-center">
                  <span className="text-base font-semibold dark:text-white text-white">
                    {/* {t("express.express", "Express")} */}
                    E
                  </span>
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