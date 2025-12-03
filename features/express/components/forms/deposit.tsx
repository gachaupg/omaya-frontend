"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { FaExchangeAlt, FaExclamationCircle } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../../store";
import {
  fetchPublicPaymentMethods,
  fetchAdminPaymentMethods,
} from "../../../p2p/slices/paymentMethodsSlice";
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

// Helper function to normalize payment details and ensure account_name/account_number are extracted
const normalizePaymentDetails = (payment: any): any => {
  if (!payment) return null;

  // Get payment details from either payment_details or admin_payment_details
  const rawDetails =
    (payment as any).payment_details && (payment as any).payment_details.length > 0
      ? (payment as any).payment_details
      : (payment as any).admin_payment_details &&
        (payment as any).admin_payment_details.length > 0
      ? (payment as any).admin_payment_details
      : [];

  const firstDetail = rawDetails.length > 0 ? rawDetails[0] : null;

  // Ensure account_name and account_number are set (prefer root level, fallback to first detail)
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

  // Return normalized payment object
  return {
    ...payment,
    payment_details: rawDetails,
    account_name,
    account_number,
    mobile_number,
    wallet_address,
  };
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

  // Use appropriate payment methods data based on isHomePage
  const paymentMethodsData = isHomePage ? publicPaymentMethods : adminMethods;
  const paymentMethodsLoading = isHomePage
    ? publicMethodsLoading
    : adminMethodsLoading;
  const paymentMethodsError = isHomePage
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

    // Check if we have payment methods data
    const hasPaymentData = isHomePage
      ? publicPaymentMethods?.data?.providers &&
        Array.isArray(publicPaymentMethods.data.providers) &&
        publicPaymentMethods.data.providers.length > 0
      : paymentMethodsData &&
        Array.isArray(paymentMethodsData) &&
        paymentMethodsData.length > 0;

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

      if (activeMethods.length > 0) {
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
        console.log("🔍 No active methods found after filtering");
      }
    } else {
      console.log("🔍 No payment methods data available", {
        isHomePage,
        hasPublicPaymentMethods: !!publicPaymentMethods,
        hasPaymentMethodsData: !!paymentMethodsData,
        publicPaymentMethodsStructure: publicPaymentMethods,
      });
    }
  }, [paymentMethodsData, isHomePage, publicPaymentMethods]); // Update when payment data changes

  // Use stable state - React will properly render this
  const effectivePaymentMethods = stablePaymentMethods;

  // Fallback payment methods if no data is available
  const fallbackPaymentMethods = useMemo(
    () => [
      {
        provider_name: "Bank",
        payment_method: "Bank Transfer",
        is_active: true,
      },
      {
        provider_name: "Crypto",
        payment_method: "Cryptocurrency",
        is_active: true,
      },
      { provider_name: "Forex", payment_method: "Forex", is_active: true },
      {
        provider_name: "Mobile",
        payment_method: "Mobile Money",
        is_active: true,
      },
      {
        provider_name: "Marchant",
        payment_method: "Marchant",
        is_active: true,
      },
    ],
    []
  );

  // Use fallback if no effective payment methods
  const finalPaymentMethods = useMemo(
    () =>
      effectivePaymentMethods.length > 0
        ? effectivePaymentMethods
        : fallbackPaymentMethods,
    [effectivePaymentMethods, fallbackPaymentMethods]
  );

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
    return 98;
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
    return "98";
  });
  // Don't set asset directly from initialState - let matching logic handle it
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const [isCalculatingFromPay, setIsCalculatingFromPay] = useState(true);
  const [walletAddress, setWalletAddress] = useState(
    initialState?.walletAddress || ""
  );
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

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

  // Address validation hook
  const {
    result: addressValidationResult,
    isValidating: isAddressValidating,
    error: addressValidationError,
    validate: validateAddress,
    reset: resetAddressValidation,
  } = useValidateAddress({
    currency: currentCurrency,
    debounceMs: 500,
    minLength: 10,
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
        setIsAddressConfirmed(true);
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

  // Reset validation when asset changes
  useEffect(() => {
    if (walletAddress.trim() && currentCurrency) {
      resetAddressValidation();
      validateAddress(walletAddress, currentCurrency);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCurrency]); // Only run when currency changes
  // Initialize selectedPaymentDetail from initialState if available (immediate, no waiting)
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<any>(() => {
    // If we have initialState with payment, use it immediately (normalized)
    if (initialState?.payment) {
      return normalizePaymentDetails(initialState.payment);
    }
    return null;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);
  const [isRestoringFromInitialState, setIsRestoringFromInitialState] = useState(false);

  useEffect(() => {
    // If we have initialState with payment (full object from home page), ensure it's set and payBank is correct
    if (initialState?.payment) {
      const initialStatePayment = initialState.payment;
      
      // Use the payment object directly from initialState (exact object from home page) - normalize to ensure account details
      if (!selectedPaymentDetail || selectedPaymentDetail !== initialStatePayment) {
        const normalized = normalizePaymentDetails(initialStatePayment);
        setSelectedPaymentDetail(normalized);
      }
      // Ensure payBank is set correctly
      const correctPayBank = initialStatePayment.provider_name || initialStatePayment.payment_provider_name || initialState.payBank || "";
      if (payBank !== correctPayBank) {
        setPayBank(correctPayBank);
      }
      return; // Don't proceed to defaults
    }

    // Only apply defaults if we don't have initialState payment
    if (!initialState?.payment && finalPaymentMethods && finalPaymentMethods.length > 0) {
      const matchingSelection = finalPaymentMethods.find(
        (method: any) => method?.provider_name === payBank
      );

      if (matchingSelection) {
        if (
          !selectedPaymentDetail ||
          selectedPaymentDetail?.provider_name !== matchingSelection.provider_name
        ) {
          // Normalize payment details before setting
          const normalized = normalizePaymentDetails(matchingSelection);
          setSelectedPaymentDetail(normalized);
        }
        return;
      }

      const firstMethod = finalPaymentMethods[0];
      if (!firstMethod?.provider_name) {
        return;
      }

      setPayBank(firstMethod.provider_name);
      // Normalize payment details before setting
      const normalized = normalizePaymentDetails(firstMethod);
      setSelectedPaymentDetail(normalized);
    }
  }, [finalPaymentMethods, payBank, selectedPaymentDetail, initialState]);

  // Add transaction code state
  const [transactionCode, setTransactionCode] = useState<string>("");
  const paymentDetailsRef = useRef<HTMLDivElement>(null);

  // Asset selection state for search functionality
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [assetSearchTerm, setAssetSearchTerm] = useState("");
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
    setAssetDropdownPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
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

  // Add state to store API response
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isUserModifiedAmount, setIsUserModifiedAmount] = useState(false);

  // Add InfoModal state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

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

  useEffect(() => {
    if (isHomePage) {
      return;
    }

    dispatch(fetchAdminPaymentMethods());
  }, [dispatch, isHomePage]);

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
    if (initialState?.asset && !selectedAsset) {
      const initialStateAsset = initialState.asset;
      
      // Try to find the exact asset in available assets by asset_id
      const matchingAsset = assetsDisplay.displayData.find((asset: any) => {
        if (initialStateAsset.asset_id && asset.asset_id) {
          return String(initialStateAsset.asset_id).toLowerCase().trim() === String(asset.asset_id).toLowerCase().trim();
        }
        return false;
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
    if (!selectedAsset && !initialState?.asset) {
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

  // Check if asset is one of the first two direct assets (USDT on BSC or USDC on BSC)
  const isSimpleCalculationAsset = (asset: any) => {
    if (!asset) return false;
    const ticker = (asset?.ticker || asset?.symbol || "").toLowerCase();
    const network = (asset?.network || "").toLowerCase();

    // First two assets: USDT on BSC and USDC on BSC
    return (
      (ticker === "usdt" && network === "bsc") ||
      (ticker === "usdc" && network === "bsc")
    );
  };

  // Check if asset is FXP (forex)
  const isForexAsset = (asset: any) => {
    if (!asset) return false;
    const ticker = (asset?.ticker || asset?.symbol || "").toLowerCase();
    return ticker === "fxp";
  };

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
              const serviceError = errorMessage.replace(
                "Exchange service error: ",
                ""
              );
              errorMessage = serviceError;
            }

            console.log("Error parsing:", {
              errorMessage,
              errorDetails,
              hasResponseData: !!error?.response_data,
            });

            // Handle deposit_too_small error
            if (
              errorMessage.includes("deposit_too_small") ||
              errorDetails.includes("Out of min amount")
            ) {
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
            if (
              errorMessage.includes("deposit_too_large") ||
              errorDetails.includes("Out of max amount")
            ) {
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
            if (result.payload && (result.payload as any)?.estimated_amount) {
              const requiredUsdtAmount = (result.payload as any)
                ?.estimated_amount;

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

            console.log("API Error Debug (reverse):", {
              error,
              errorMessage,
              errorDetails,
            });

            // Handle deposit_too_small error
            if (
              errorMessage.includes("deposit_too_small") ||
              errorDetails.includes("Out of min amount")
            ) {
              setApiValidationError(
                "Amount entered is too small. Please enter a larger amount."
              );
              setEstimateError(null);
              setPayAmount(0);
              setPayAmountInput("0");
              setIsCalculating(false);
              setIsCalculatingReceive(false);
              return;
            }

            // Handle other specific validation errors
            if (
              errorMessage.includes("deposit_too_large") ||
              errorDetails.includes("Out of max amount")
            ) {
              setApiValidationError(
                "Amount entered is too large. Please enter a smaller amount."
              );
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

    // Priority 3: FXPRIMUS (ticker: fxp)
    if (tickerA === "fxp" && !(tickerB === "fxp")) {
      return -1;
    }
    if (tickerB === "fxp" && !(tickerA === "fxp")) {
      return 1;
    }

    // Default: preserve original order (no change)
    return 0;
  });

  const renderAssetDropdown = () => {
    if (!isComponentMounted || !isAssetDropdownOpen) {
      return null;
    }

    return createPortal(
      (
        <div
          ref={assetDropdownContentRef}
          className="mt-1 bg-[#ffffff] dark:bg-[#1D1D23] border border-[#A2A4A9FF] dark:border-[#35353E] rounded-2xl shadow-lg z-[1200]"
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
                className="w-full text-gray-900 dark:text-white dark:bg-[#1D1D23] bg-white rounded-xl px-10 py-2 text-sm focus:outline-none border dark:border-[#35353E] border-[#35353E] placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {sortedSwapAssets.length > 0 ? (
              <>
                {!assetSearchTerm && sortedSwapAssets.length > 3 && (
                  <>
                    <div className="px-3 py-2 bg-[#F5F6F7] dark:bg-[#23232B] border-b border-[#A2A4A9FF] dark:border-[#35353E]">
                      <span className="text-xs font-semibold text-[#788099] uppercase tracking-wider">
                        Popular
                      </span>
                    </div>
                    {sortedSwapAssets.slice(0, 3).map((asset: SupportedAsset, index: number) => (
                      <div
                        key={`popular-${asset.asset_id || "asset"}-${asset.symbol || asset.ticker || asset.name}-${asset.network || "unknown"}-${index}`}
                        className="flex items-center gap-3 p-3 text-black dark:text-white hover:bg-[#78787AFF] dark:hover:bg-[#35353E] cursor-pointer border-b border-[#A2A4A9FF] dark:border-[#35353E]"
                        onClick={() => {
                          handleAssetSelection(asset);
                          setIsAssetDropdownOpen(false);
                          setAssetSearchTerm("");
                        }}
                      >
                        <img
                          src={getHighResAssetIcon(asset, ASSET_ICON_SIZE)}
                          alt={asset?.name || asset?.ticker || asset?.symbol || "Asset"}
                          className={`${ASSET_ICON_BASE_CLASS} w-9 h-9`}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = getHighResAssetIcon(null, ASSET_ICON_SIZE);
                          }}
                        />
                        <div className="flex-1">
                          <div className="text-[#35353e] dark:text-[#ffffff] font-medium flex items-center gap-2">
                            {(asset.ticker || asset.symbol || asset.name || "Unknown").toUpperCase()}
                            <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-semibold px-2 py-0.5 rounded-full">
                              {getNetworkDisplayName(getAssetNetwork(asset))}
                            </span>
                          </div>
                          <div className="text-[#35353e] dark:text-[#788099] text-sm">
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

                    <div className="border-t-2 border-[#D1D2D4FF] dark:border-[#35353E]"></div>

                    <div className="px-3 py-2 bg-[#F5F6F7] dark:bg-[#23232B] border-b border-[#A2A4A9FF] dark:border-[#35353E]">
                      <span className="text-xs font-semibold text-[#788099] uppercase tracking-wider">
                        All Assets
                      </span>
                    </div>
                  </>
                )}

                {(assetSearchTerm ? sortedSwapAssets : sortedSwapAssets.slice(3)).map(
                  (asset: SupportedAsset, index: number) => (
                    <div
                      key={`${asset.asset_id || "asset"}-${asset.symbol || asset.ticker || asset.name}-${asset.network || "unknown"}-${index}`}
                      className="flex items-center gap-3 p-3 text-black dark:text-white hover:bg-[#78787AFF] dark:hover:bg-[#35353E] cursor-pointer border-b border-[#A2A4A9FF] dark:border-[#35353E] last:border-b-0"
                      onClick={() => {
                        handleAssetSelection(asset);
                        setIsAssetDropdownOpen(false);
                        setAssetSearchTerm("");
                      }}
                    >
                      <img
                        src={getHighResAssetIcon(asset, ASSET_ICON_SIZE)}
                        alt={asset?.name || asset?.ticker || asset?.symbol || "Asset"}
                        className={`${ASSET_ICON_BASE_CLASS} w-9 h-9`}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = getHighResAssetIcon(null, ASSET_ICON_SIZE);
                        }}
                      />
                      <div className="flex-1">
                        <div className="text-[#35353e] dark:text-[#ffffff] font-medium flex items-center gap-2">
                          {(asset.ticker || asset.symbol || asset.name || "Unknown").toUpperCase()}
                          <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-semibold px-2 py-0.5 rounded-full">
                            {getNetworkDisplayName(getAssetNetwork(asset))}
                          </span>
                        </div>
                        <div className="text-[#35353e] dark:text-[#788099] text-sm">
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
                  )
                )}
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
  // Use default commission rate for swap assets (can be updated based on asset type)
  const commissionRate = selectedAsset?.range_commissions?.[0]?.commission
    ? parseFloat(selectedAsset.range_commissions[0].commission)
    : 2; // Default 2% commission for swap assets
  const commissionAmount = (getAmount * commissionRate) / 100;
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

    // For direct assets (USDT on BSC, USDC on BSC), calculate immediately
    if (isSimpleCalculationAsset(selectedAsset)) {
      let commissionRate = 2; // Default fallback

      // Safely access commission rate with multiple fallback options
      if (
        selectedAsset?.range_commissions &&
        selectedAsset.range_commissions.length > 0
      ) {
        const firstCommission = selectedAsset.range_commissions[0];
        if (firstCommission?.commission) {
          commissionRate = parseFloat(firstCommission.commission);
        }
      } else if (selectedAsset?.commission) {
        // Try alternative commission property
        commissionRate = parseFloat(selectedAsset.commission);
      } else if (selectedAsset?.fee_rate) {
        // Try fee_rate property
        commissionRate = parseFloat(selectedAsset.fee_rate);
      }

      // Ensure commission rate is a valid number
      if (isNaN(commissionRate) || commissionRate <= 0) {
        commissionRate = 2; // Default to 2% if invalid
      }

      if (fromPay) {
        // Forward calculation: from pay amount to receive amount
        const commissionAmount = (fromAmount * commissionRate) / 100;
        const networkFee = 0;
        const totalFees = networkFee + commissionAmount;
        const calculatedGetAmount = fromAmount - totalFees;
        setGetAmount(calculatedGetAmount);
        setGetAmountInput(calculatedGetAmount.toString());
      } else {
        // Reverse calculation: from receive amount to pay amount
        const commissionAmount = (fromAmount * commissionRate) / 100;
        const networkFee = 0;
        const totalFees = networkFee + commissionAmount;
        const calculatedPayAmount = fromAmount + totalFees;
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
          // Forward calculation: from pay amount to receive amount
          if (isSimpleCalculationAsset(selectedAsset)) {
            // Simple calculation for direct assets (USDT on BSC, USDC on BSC) - simply subtract 2
            let calculatedGetAmount;
            if (fromAmount < 2) {
              calculatedGetAmount = fromAmount;
            } else {
              calculatedGetAmount = Math.max(0, fromAmount - 2); // Simply subtract 2 for direct assets
            }
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
          // Reverse calculation: from receive amount to pay amount
          if (isSimpleCalculationAsset(selectedAsset)) {
            // Simple reverse calculation for direct assets (USDT on BSC, USDC on BSC) - simply add 2
            let calculatedPayAmount;
            if (fromAmount < 2) {
              calculatedPayAmount = fromAmount;
            } else {
              calculatedPayAmount = fromAmount + 2; // Simply add 2 for direct assets
            }
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
            const roughEstimate = fromAmount * 1.02; // Rough estimate with 2% commission
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

  useEffect(() => {
    setIsAddressConfirmed(false);
  }, [walletAddress]);

  // Terms & Conditions acceptance
  const [termsAccepted, setTermsAccepted] = useState(false);

  const isProceedDisabled =
    isSubmitting ||
    !walletAddress.trim() ||
    !!walletError ||
    !isAddressConfirmed ||
    !termsAccepted;

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
          currencyValue =
            selectedAsset.symbol === "USDT Tether"
              ? "USDT"
              : selectedAsset.symbol;
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
            if (typeof value === "string" && value.trim()) {
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
          assetValue =
            selectedAsset.symbol === "USDT Tether"
              ? "USDT"
              : selectedAsset.symbol;
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
            if (typeof value === "string" && value.trim()) {
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

        // Show success message
        showToast.success("Deposit request submitted successfully!");

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

    // Wait for required data to be loaded
    if (
      !selectedAsset ||
      !selectedPaymentDetail ||
      !finalPaymentMethods ||
      finalPaymentMethods.length === 0
    ) {
      return;
    }

    // Check if we have all required data
    const hasRequiredData =
      initialState.amountValue &&
      initialState.asset &&
      initialState.payment;

    if (!hasRequiredData) {
      return;
    }

    // Auto-expand: If it's a forex asset, show forex form; otherwise, submit first card
    if (selectedAsset && isForexAsset(selectedAsset)) {
      setShowForexForm(true);
      setHasAutoExpanded(true);
    } else if (selectedAsset && selectedPaymentDetail && !isFirstCardSubmitted && !isSubmitting) {
      // Auto-submit the first card
      const timer = setTimeout(() => {
        if (!isFirstCardSubmitted && !isSubmitting) {
          handleFirstCardSubmit();
          setHasAutoExpanded(true);
        }
      }, 1000); // Delay to ensure everything is ready

      return () => clearTimeout(timer);
    }
  }, [
    initialState,
    selectedAsset,
    selectedPaymentDetail,
    finalPaymentMethods,
    isHomePage,
    hasAutoExpanded,
    isFirstCardSubmitted,
    isSubmitting,
  ]);

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
        currencyValue =
          selectedAsset.symbol === "USDT Tether"
            ? "USDT"
            : selectedAsset.symbol;
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
          if (typeof value === "string" && value.trim()) {
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
            if (typeof value === "string" && value.trim()) {
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
        assetValue =
          selectedAsset.symbol === "USDT Tether"
            ? "USDT"
            : selectedAsset.symbol;
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
          if (typeof value === "string" && value.trim()) {
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
      let errorMessage = "Failed to submit deposit request";

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
    <div className="w-full flex flex-col dark:bg-[#18181D]  ">
      <h2 className="text-xl font-bold mb-2 text-[#788099] dark:text-[#788099] inline-flex items-center gap-2">
        <span className="text-[#7e7e8f] dark:text-[#788099]">1-</span>{" "}
        {t("express.transactionInfo", "Transaction Info")}
      </h2>

      {/* API Validation Error - Show as simple red text */}
      {apiValidationError && (
        <div className="mb-4 text-red-500 text-sm font-medium">
          {apiValidationError}
        </div>
      )}

      <div className="w-full text-white">
        {/* Top Section - Amount and Bank/Payment Method in one card */}
        <div className="relative mb-4">
          {/* Top Card Container */}
          <div className="relative flex flex-col sm:flex-row border border-[#D1D2D4FF] dark:border-[#35353E] rounded-xl sm:rounded-2xl p-3 sm:p-4 overflow-visible gap-3 sm:gap-0">
            {/* Amount Section */}
            <div className="flex-1 sm:pr-4">
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
                {t("express.youSend", "You Send")}
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
                {/* {isCalculatingFromPay && (
                  <span className="text-xs text-[#1D8751] font-medium">(Active)</span>
                )} */}
              </label>
              <div className="text-xs text-[#788099] dark:text-[#788099] mb-1">Amount</div>
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
                        if (decimalPart && decimalPart.length > 8) {
                          setApiValidationError(
                            "Number cannot have more than 8 decimal places."
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
                        if (newAmount > 15000) {
                          setIsInfoModalOpen(true);
                        }

                        // For direct assets, calculate immediately
                        if (
                          selectedAsset &&
                          newAmount > 0 &&
                          isSimpleCalculationAsset(selectedAsset)
                        ) {
                          const calculatedGetAmount =
                            newAmount < 2
                              ? newAmount
                              : Math.max(0, newAmount - 2);
                          setGetAmount(calculatedGetAmount);
                          setGetAmountInput(calculatedGetAmount.toString());

                          // Simple assets don't need loading states - calculation is instant
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
                  className={`w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff] rounded-2xl px-4 py-3 pr-12 sm:pr-16 text-base sm:text-lg focus:outline-none border appearance-none min-h-[60px] ${
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

    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      if (value.includes(".")) {
        const decimalPart = value.split(".")[1];
        if (decimalPart && decimalPart.length > 8) {
          setApiValidationError("Number cannot have more than 8 decimal places.");
          return;
        }
      }

      const newAmount = parseFloat(value) || 0;

      if (newAmount !== payAmount || value !== payAmountInput) {
        setPayAmountInput(value);
        setPayAmount(newAmount);
        setIsCalculatingFromPay(true);
        setApiValidationError(null);
        setIsUserModifiedAmount(true);

        if (newAmount > 15000) setIsInfoModalOpen(true);

        if (selectedAsset && newAmount > 0 && isSimpleCalculationAsset(selectedAsset)) {
          const calculatedGetAmount =
            newAmount < 2 ? newAmount : Math.max(0, newAmount - 2);
          setGetAmount(calculatedGetAmount);
          setGetAmountInput(calculatedGetAmount.toString());
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
  className={`w-full h-[60px] text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff]
    rounded-2xl px-4 pr-12 sm:pr-16 text-base sm:text-lg focus:outline-none
    border appearance-none
    ${
      (isCalculating || isCalculatingReceive) &&
      isCalculatingFromPay &&
      selectedAsset &&
      !isForexAsset(selectedAsset)
        ? "border-[#1D8751]"
        : "border-[#A2A4A9FF] dark:border-[#35353E]"
    }`}
/>


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
              className="flex-1 sm:pl-4 border-t sm:border-t-0 sm:border-l border-[#D1D2D4FF] dark:border-[#35353E] pt-3 sm:pt-0 sm:border-none"
            >
              <div className="text-xs text-[#788099] dark:text-[#788099] mb-1 mt-[30px] sm:mt-[34px]">{t("express.bankPaymentMethod", "Bank/Payment Method")}</div>
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
                    // Include initialState payment in options if it exists and isn't already in finalPaymentMethods
                    let optionsToMap = [...(finalPaymentMethods || [])];
                    if (initialState?.payment && selectedPaymentDetail) {
                      const initialStatePayment = initialState.payment;
                      const isAlreadyInOptions = finalPaymentMethods?.some(
                        (method: any) => 
                          method.provider_name === initialStatePayment.provider_name ||
                          (method.id && initialStatePayment.id && String(method.id) === String(initialStatePayment.id))
                      );
                      if (!isAlreadyInOptions) {
                        optionsToMap = [initialStatePayment, ...optionsToMap];
                      }
                    }
                    
                    const mappedOptions = optionsToMap.map(
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

                        if (index < 3) {
                          console.log(`🔍 Payment Method Option ${index}:`, {
                            isHomePage,
                            provider_name: payment.provider_name,
                            provider_logo: payment.provider_logo,
                            logo: payment.logo,
                            logo_url: payment.logo_url,
                            detailLogo,
                            logoUrl: logoUrl,
                            rawLogo,
                            logoUrlType: typeof logoUrl,
                            rawLogoIsValid: !!rawLogo,
                            payment_method: payment.payment_method,
                            admin_payment_detail_id:
                              payment.admin_payment_detail_id,
                            allKeys: Object.keys(payment),
                          });
                        }

                        if (!rawLogo && index < 3) {
                          console.warn(
                            `⚠️ No logo found for payment method ${index}: ${payment.provider_name}`,
                            {
                              paymentKeys: Object.keys(payment),
                              hasProviderLogo: !!payment.provider_logo,
                              hasLogo: !!payment.logo,
                                hasLogoUrl: !!payment.logo_url,
                                hasDetailLogo: !!detailLogo,
                              providerLogoValue: payment.provider_logo,
                              logoValue: payment.logo,
                                logoUrlValue: payment.logo_url,
                                detailLogo,
                              providerLogoType: typeof payment.provider_logo,
                              logoType: typeof payment.logo,
                                logoUrlType: typeof payment.logo_url,
                            }
                          );
                        }

                        return {
                          value: payment.provider_name,
                          label: `${payment.provider_name} - ${payment.payment_method || payment.payment_method_type || payment.payment_type}`,
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
                    const selectedPayment = finalPaymentMethods?.find(
                      (payment: any) => payment.provider_name === value
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
                    onModeChange(mode === "deposit" ? "withdrawal" : "deposit");
                  }
                }}
              >
                {/* Light mode image */}
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1756579504/Frame_36261_1_d9cnq1.png"
                  alt="swap icon"
                  className="w-10 h-10 sm:w-10 sm:h-10 dark:hidden"
                />
                {/* Dark mode image */}
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1755500509/Frame_36261_ledmyw.png"
                  alt="swap icon"
                  className="w-10 h-10 sm:w-10 sm:h-10 hidden dark:block"
                />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Section - You Receive and Asset in one card */}
        <div className="relative mb-3">
          <div className="relative flex flex-col sm:flex-row border border-[#D1D2D4FF] dark:border-[#35353E] rounded-xl sm:rounded-2xl p-3 sm:p-4 overflow-visible gap-3 sm:gap-0">
            {/* You Receive Section */}
            <div className="flex-1 sm:pr-4">
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
                {t("express.youReceive", "You Receive")}
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
                {!isCalculatingFromPay && (
                  <span className="text-xs text-[#1D8751] font-medium hidden sm:inline">
                    {t("express.active", "(Active)")}
                  </span>
                )}
              </label>
              <div className="text-xs text-[#788099] dark:text-[#788099] mb-1">Amount</div>
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
                          setApiValidationError(
                            "Number cannot have more than 8 decimal places."
                          );
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

                        // For direct assets, calculate immediately
                        if (
                          selectedAsset &&
                          newAmount > 0 &&
                          isSimpleCalculationAsset(selectedAsset)
                        ) {
                          const calculatedPayAmount =
                            newAmount < 2 ? newAmount : newAmount + 2;
                          setPayAmount(calculatedPayAmount);
                          setPayAmountInput(calculatedPayAmount.toString());

                          // Simple assets don't need loading states - calculation is instant
                        } else if (
                          selectedAsset &&
                          newAmount > 0 &&
                          isForexAsset(selectedAsset)
                        ) {
                          // For FXP, calculate immediately with 1.06 rate (reverse)
                          const calculatedPayAmount =
                            newAmount * FXP_EXCHANGE_RATE;
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
                  className={`w-full h-[60px] text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff] rounded-2xl px-4 pr-16 text-base sm:text-lg focus:outline-none border appearance-none ${
                    receiveAmountError &&
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
                      className={`text-sm font-medium ${
                        receiveAmountError.includes("Rough estimate") ||
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
            <div className="flex-1 sm:pl-4 border-t sm:border-t-0 sm:border-l border-[#D1D2D4FF] dark:border-[#35353E] pt-3 sm:pt-0 sm:border-none">
              <div className="text-xs text-[#788099] dark:text-[#788099] mb-1 mt-[30px] sm:mt-[34px]">{t("express.youGet", "You Get")}</div>
              <div className="relative" ref={assetDropdownRef}>
                <div
                  className={`h-[60px] w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff] rounded-2xl px-4 text-base sm:text-lg border border-[#A2A4A9FF] dark:border-[#35353E] flex items-center justify-between cursor-pointer`}
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
                          className={`${ASSET_ICON_BASE_CLASS} w-9 h-9`}
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
                    className={`w-5 h-5 text-[#7e7e8f] transition-transform ${
                      isAssetDropdownOpen ? "rotate-180" : ""
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

        {/* Disclaimer Banner */}
        <div className="flex items-center rounded-2xl px-4 py-3 mb-4 dark:bg-[#1D1D23]">
          <div className="flex items-center gap-3">
              <img src="https://res.cloudinary.com/pitz/image/upload/v1764062160/Icon_2_tppzgw.png" alt="" />
            <span className="text-[#35353e] dark:text-[#788099] text-sm font-medium">
              {t("express.estimate.notice", "This is only an estimated price based on current market rates. The final price will be confirmed when we receive the funds.")}
            </span>
          </div>
        </div>

        {/* Submit Button for First Card */}
        {!isFirstCardSubmitted && !showForexForm && (
          <div className="mt-4 relative">
            <button
              className={`w-full text-white dark:text-white text-sm sm:text-base font-medium py-3 sm:py-2 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-colors min-h-[44px] sm:min-h-0 ${
                isHomePage
                  ? "bg-[#1D8751] hover:bg-[#166b3e] cursor-pointer"
                  : isSubmitting ||
                      !selectedAsset ||
                      !payBank ||
                      (selectedAsset &&
                        !isSimpleCalculationAsset(selectedAsset) &&
                        !isForexAsset(selectedAsset) &&
                        estimateLoading)
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-[#1D8751] hover:bg-[#166b3e]"
              }`}
              onClick={() => {
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
                isHomePage
                  ? false
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
                  <span>{t("express.posting", "Posting...")}</span>
                </div>
              ) : (
                <span className="flex items-center justify-center">
                  <span className="text-base font-medium dark:text-white text-white">
                    {t("express.express", "Express")}
                  </span>
                  <img
                    className="mt-2"
                    src="https://res.cloudinary.com/pitz/image/upload/v1752244135/Group_5_gkxzdz.png"
                    alt=""
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
                <h2 className="text-xl font-bold mb-2 text-[#788099] dark:text-[#788099] inline-flex items-center gap-2">
                  <span className="text-[#7e7e8f] dark:text-[#788099]">2-</span>{" "}
                  {t("express.paymentDetails", "Payment Details")}
                </h2>
                <div className="flex-1 dark:bg-[#1D1D23] rounded-2xl border border-[#39394a] dark:border-[#35353E] flex flex-col justify-between p-5 relative min-h-[120px]">
                  {/* Bank and logo */}
                  <div className="flex items-center justify-between mb-4">
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
                      {selectedPaymentDetail.account_name}
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
                        {selectedPaymentDetail.account_number}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            selectedPaymentDetail.account_number
                          );
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
            <div className="flex flex-col dark:bg-[#1D1D23] border-2 border-[#35353E] rounded-2xl p-5 shadow-lg">
              <label className="block text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                {t("express.yourForexAccountNumber", "Your Forex Account Number")}
              </label>
              <input
                type="text"
                value={forexAccountNumber}
                onChange={(e) => setForexAccountNumber(e.target.value)}
                placeholder="Enter your forex account number (e.g., EUR9876543210)"
                className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff] rounded-2xl px-4 py-2 text-lg focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E]"
              />
            </div>

            {/* User Notes */}
            <div className="flex flex-col dark:bg-[#1D1D23] border-2 border-[#35353E] rounded-2xl p-5 shadow-lg">
              <label className="block text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                {t("express.additionalNotesOptional", "Additional Notes (Optional)")}
              </label>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="Add any special instructions or notes..."
                className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff] rounded-2xl px-4 py-2 text-lg focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E] min-h-[100px] resize-none"
              />
            </div>

            {/* Submit Forex Exchange Button */}
            <button
              className={`w-full text-white text-sm sm:text-base font-medium py-3 sm:py-3 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-colors min-h-[44px] sm:min-h-0 ${
                isSubmitting || !forexAccountNumber.trim()
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#1D8751] hover:bg-[#166b3e]"
              }`}
              onClick={async () => {
                if (!forexAccountNumber.trim()) {
                  showToast.error("Please enter your forex account number");
                  return;
                }

                if (!selectedPaymentDetail?.admin_payment_detail_id) {
                  showToast.error(
                    "Invalid payment method selected. Please select a valid payment method."
                  );
                  return;
                }

                setIsSubmitting(true);

                try {
                  const { createForexExchangeThunk } = await import(
                    "../../slices/forexSlice"
                  );

                  const forexPayload = {
                    transaction_type: "deposit" as const,
                    from_currency: "USD",
                    from_amount: payAmount.toFixed(2),
                    to_currency: "FXP",
                    to_amount: getAmount.toFixed(2),
                    exchange_rate: FXP_EXCHANGE_RATE.toFixed(4),
                    additional_info: selectedPaymentDetail
                      ? `Wire transfer from ${selectedPaymentDetail.provider_name}`
                      : "Wire transfer",
                    user_notes: userNotes.trim() || t("express.forexDepositExchange", "Forex deposit exchange"),
                    user_forex_account: forexAccountNumber.trim(),
                    admin_payment_detail_id:
                      selectedPaymentDetail.admin_payment_detail_id,
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
            <span className="text-[#7e7e8f] dark:text-[#788099]">2-</span>{" "}
            {t("express.paymentDetails", "Payment Details")}
          </h2>
          <div
            ref={paymentDetailsRef}
            className="mt-1 mb-2 w-full flex flex-col gap-3 px-2 "
          >
            <div className="flex-1  dark:bg-[#1D1D23] rounded-2xl border border-[#39394a] dark:border-[#35353E] flex flex-col justify-between p-5 relative min-h-[120px]">
              {/* Bank and logo */}
              <div className="flex items-center justify-between mb-4">
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
                  {selectedPaymentDetail.account_name}
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
              <h2 className="text-xl font-bold mb-2 text-[#788099] dark:text-[#788099] inline-flex items-center gap-2">
                <span className="text-[#7e7e8f] dark:text-[#788099]">3-</span>{" "}
                {t("express.transactionCode", "Transaction Code")}
              </h2>
              <div className="mb-6 flex flex-col gap-3 w-full px-2">
                <div className=" dark:bg-[#1D1D23] border-2 border-[#35353E] rounded-2xl p-4 shadow-lg w-full text-[#35353e] dark:text-[#788099]">
                  {/* Transaction Code Row */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-3">
                    {/* Display deposit code from API response - each character in its own box */}
                    <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
                      {apiResponse.deposit_code
                        .split("")
                        .map((char: string, index: number) => (
                          <div
                            key={index}
                            className="w-8 h-10 sm:w-10 sm:h-12 bg-[#35353E] border border-[#4A4A4A] rounded-lg flex items-center justify-center"
                          >
                            <span className="text-lg sm:text-xl font-bold text-white font-mono">
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
                      className="flex items-center gap-2 bg-[#35353E] border border-[#1D8751] text-white rounded-full px-3 py-2 sm:px-4 font-semibold text-xs sm:text-sm hover:bg-[#1D8751] hover:text-white transition-colors"
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
                    <div className=" dark:bg-[#1D1D23] border border-[#1D8751] rounded-xl p-3">
                      <ul className="list-none space-y-1">
                        <li className="flex items-start">
                          <span className="w-2 h-2 mt-1 rounded-full bg-[#1D8751] inline-block mr-2"></span>
                          <span className="text-[#35353e] dark:text-[#788099] text-xs">
                            Please write this Transaction Code in the bank
                            message or note section.
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 mt-1 rounded-full bg-[#1D8751] inline-block mr-2"></span>
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
            <span className="text-[#7e7e8f] dark:text-[#788099]">4-</span>{" "}
            {t("express.walletAddress", "Wallet Address")}
          </h2>
          <div className="flex flex-col dark:bg-[#1D1D23] border-2 border-[#35353E] rounded-2xl p-5 shadow-lg w-full text-[#35353e] dark:text-[#788099] mb-6">
            {/* Wallet/Account Address Label */}
            <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
              {t("express.walletAccountAddress", "Wallet/Account Address")}
            </label>
            {/* Input + Paste row */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              {/* Input group */}
              <div className="relative flex items-center dark:bg-[#1D1D23] border border-[#39394a] dark:border-[#35353E] rounded-2xl px-4 py-2 mb-0 flex-1">
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
                    setIsAddressConfirmed(false);
                    setWalletError(null); // Clear error immediately for better UX

                    // Validate address in real-time using the validation hook
                    if (value.trim() === "") {
                      resetAddressValidation();
                      setWalletError(null); // No error when empty - address is optional
                    } else {
                      // Trigger validation as user types
                      validateAddress(value, currentCurrency);
                    }
                    setForceUpdate((prev) => prev + 1);
                  }}
                  placeholder="Paste here your Crypto address"
                  className={`flex-1 bg-transparent border-none outline-none text-[#35353e] dark:text-[#788099] placeholder-[#788099] text-base ${
                    walletError
                      ? "border-red-500"
                      : walletAddress.trim() && !walletError && addressValidationResult?.isValid
                        ? "border-green-500"
                        : ""
                  }`}
                />
                {/* Validation status indicator */}
                {walletAddress.trim() && currentCurrency && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                    {isAddressValidating ? (
                      <div className="w-4 h-4 border-2 border-[#1D8751] border-t-transparent rounded-full animate-spin"></div>
                    ) : addressValidationResult?.isValid ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#1D8751]">
                        <path
                          d="M9 12l2 2 4-4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    ) : walletError ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#E23D3A]">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        <path
                          d="M12 8v4M12 16h.01"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : null}
                  </div>
                )}
                {/* Bookmark icon */}
                <span className="mx-2 text-[#788099] cursor-pointer">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                      stroke="#788099"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>

              {/* Paste button - same row as input */}
              <button
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setWalletAddress(text);
                    setIsAddressConfirmed(false);
                    // Trigger validation after pasting
                    if (text.trim()) {
                      validateAddress(text, currentCurrency);
                    } else {
                      resetAddressValidation();
                    }
                  } catch (err) {
                    console.error("Failed to read clipboard:", err);
                    showToast.error("Failed to paste from clipboard");
                  }
                }}
                className="mt-3 sm:mt-0 flex items-center justify-center gap-2 bg-[#2A2A35] dark:bg-[#2A2A35] border border-[#4A4A5A] dark:border-[#4A4A5A] 
                text-[#1D8751] dark:text-[#1D8751] rounded-2xl px-4 py-2 font-semibold text-sm sm:text-base hover:bg-[#35353E] dark:hover:bg-[#35353E] hover:text-[#1D8751] dark:hover:text-[#1D8751] transition-colors min-h-[44px] sm:min-h-0 touch-manipulation w-full sm:w-auto"
              >
                <span>{t("express.paste", "Paste")}</span>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-[#1D8751]">
                  <path
                    d="M19 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-2h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2z"
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
                    <div className="w-4 h-4 border-2 border-[#1D8751] border-t-transparent rounded-full animate-spin"></div>
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

           
            <label className="flex mb-4 items-center gap-2 mt-4 text-sm text-[#35353e] dark:text-[#788099]">
              <input
                type="checkbox"
                checked={isAddressConfirmed}
                onChange={(event) =>
                  setIsAddressConfirmed(event.target.checked)
                }
                className="w-4 h-4 rounded border-[#1D8751] text-[#1D8751] focus:ring-[#1D8751]"
              />
              <span>{t("express.confirmWalletAddress", "I confirm that this wallet address is correct.")}</span>
            </label>

            {/* {!walletAddress.trim() && (
              <p className="text-[#7e7e8f] dark:text-[#788099] text-sm mt-2 font-medium">
                ℹ️ Wallet address is optional. You can provide it later if needed.
              </p>
            )} */}

            {/* Terms and Conditions Summary */}
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
                {t("express.termsAndConditionsSummary", "Terms and Conditions Summary")}
              </span>
            </div>
            <div className=" dark:bg-[#1D1D23] border border-[#1D8751] rounded-xl p-4">
              <ul className="list-none space-y-2">
                <li className="flex items-start">
                  <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] inline-block mr-3"></span>
                  <span className="text-[#35353e] dark:text-[#788099] text-sm">
                    Please send the money from your own account Only
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] inline-block mr-3"></span>
                  <span className="text-[#35353e] dark:text-[#788099] text-sm">
                    Put transaction ID in the description field of the bank
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] inline-block mr-3"></span>
                  <span className="text-[#35353e] dark:text-[#788099] text-sm">
                    Please note, If you do not follow above conditions, we will
                    reject your transaction and send you back your money.
                  </span>
                </li>
              </ul>
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
            <label className="flex items-start gap-2 text-xs sm:text-sm text-[#35353e] dark:text-[#788099] mb-1">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-2 border-[#F79330] text-[#F79330] focus:ring-[#F79330] appearance-none bg-transparent checked:bg-[#F79330] checked:border-[#F79330]"
              />
              <span>
                I've read and agree to the OMAYA EXCHANGE{" "}
                <a
                  href="/terms-of-use"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#1D8751]"
                >
                  Terms of Use
                </a>
                ,{" "}
                <a
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#1D8751]"
                >
                  Privacy Policy
                </a>
                ,{" "}
                <a
                  href="/payment-policies"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#1D8751]"
                >
                  Payment Policies
                </a>
                ,{" "}
                <a
                  href="/aml-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#1D8751]"
                >
                  AML
                </a>
                ,{" "}
                <a
                  href="/risk-disclosure"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#1D8751]"
                >
                  Risk Disclosure Statements
                </a>
                .
              </span>
            </label>

            {/* Button outside the card */}
            <button
              className={`w-full text-white dark:text-white text-sm sm:text-base font-medium py-3 sm:py-2 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-colors min-h-[44px] sm:min-h-0 ${
                isProceedDisabled
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
                  <span className="text-base font-bold dark:text-white text-white">
                    {t("express.express", "Express")}
                  </span>
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
        onClose={() => setIsInfoModalOpen(false)}
        onContactUs={() => {
          // Handle contact us action - you can customize this
          window.open("https://wa.me/your-whatsapp-number", "_blank");
          setIsInfoModalOpen(false);
        }}
      />
    </div>
  );
}