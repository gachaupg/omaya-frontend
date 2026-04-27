import Image from "next/image";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTheme } from "@/context/theme";
import { useMarketingI18n } from "@/lib/useMarketingI18n";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { fetchAssets } from "@/features/exchange/slices/exchangeSlice";
import {
  fetchSupportedAssets,
  fetchSwapEstimate,
} from "@/features/swap/slices/swapSlice";
import { fetchAdminPaymentDetails } from "@/features/exchange/slices/paymentSlice";
import { fetchPublicPaymentMethods } from "@/features/p2p/slices/paymentMethodsSlice";
import {
  useAssetsDisplay,
  usePaymentMethodsDisplay,
} from "@/features/express/hooks/useDataDisplay";
import { withTimeout } from "@/lib/utils/fetchWithTimeout";
import { FaSearch } from "react-icons/fa";
import Express from "@/features/express/home/express/express";
import SwapWidget from "@/features/express/home/swap copy/components/SwapWidget";
import MoneyX from "@/features/express/home/components/moneyX/components/MoneyX";
import FrozenAccountModal from "@/components/ui/FrozenAccountModal";


/**
 * ExchangeForm – TypeScript version with BTC ⇄ ETH swap support.
 * Image assets expected in /public/images:
 *   - salam.svg
 *   - tether.svg
 *   - Bitcoin.svg (note the capital B)
 *   - eth.svg
 *   - swap.svg / swap-light.svg
 *   - Express Excahnge.svg / Express Excahnge-light.svg
 */

type Tab = "express" | "moneyx" | "swap";
type Mode = "deposit" | "withdrawal";
const RETURNING_FROM_LEGAL_KEY = "omaya_returning_from_legal";
const MONEYX_LEGAL_RETURN_STATE_KEY = "omaya_moneyx_legal_return_state";
const SWAP_LEGAL_RETURN_STATE_KEY = "omaya_swap_legal_return_state";

interface Currency {
  label: string;
  sub?: string;
  icon: string;
}

interface Preset {
  pay: Currency;
  get: Currency;
}

interface Asset {
  asset_id?: string;
  ticker?: string;
  symbol?: string;
  name?: string;
  network?: string;
  image_url?: string;
  asset_image?: string;
  icon?: string;
  icon_url?: string;
  is_fiat?: boolean;
  is_stable?: boolean;
  range_commissions?: Array<{ commission: string | number }>;
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

// Get asset network
const getAssetNetwork = (asset: Asset) => {
  if (asset?.network) {
    return asset.network;
  }

  return "";
};

// Get asset image URL with fallbacks
const getAssetImageUrl = (asset: Asset) => {
  // Try multiple possible image URL fields
  const possibleUrls = [
    asset?.image_url,
    asset?.asset_image,
    asset?.icon,
    asset?.icon_url,
    (asset as any)?.image,
    (asset as any)?.logo,
    (asset as any)?.logo_url,
  ].filter(Boolean);

  if (possibleUrls.length > 0) {
    return possibleUrls[0];
  }

  // Generate common crypto asset image URLs based on ticker/symbol
  const ticker = (asset?.ticker || asset?.symbol || "").toLowerCase();

  if (ticker) {
    // Common crypto asset image patterns
    const commonPatterns = [
      `https://cryptologos.cc/logos/${ticker}-${ticker}-logo.png`,
      `https://assets.coingecko.com/coins/images/1/large/${ticker}.png`,
      `https://cryptoicons.org/api/color/${ticker}/200`,
      `https://cryptoicons.org/api/icon/${ticker}/200`,
      `https://s2.coinmarketcap.com/static/img/coins/64x64/${ticker}.png`,
      `https://s2.coinmarketcap.com/static/img/coins/32x32/${ticker}.png`,
    ];

    // Return the first pattern (we'll let the onError handle fallbacks)
    return commonPatterns[0];
  }

  // Final fallback
  return "/images/tether.svg";
};

// Check if asset uses simple calculation (USDT on BSC, USDC on BSC) - only for Express Exchange
const isSimpleCalculationAsset = (asset: Asset, activeTab: Tab) => {
  if (!asset || activeTab !== "express") return false;

  const ticker = (asset?.ticker || asset?.symbol || "").toLowerCase();
  const network = (asset?.network || "").toLowerCase();

  return (
    (ticker === "usdt" && network === "bsc") ||
    (ticker === "usdc" && network === "bsc")
  );
};

// Calculate amounts based on mode and asset type
const calculateAmounts = (
  fromAmount: number,
  fromPay: boolean,
  selectedAsset: Asset | null,
  activeTab: Tab,
  usePublicApi: boolean = false,
  dispatch: AppDispatch,
  setPayAmount: (amount: number) => void,
  setPayAmountInput: (input: string) => void,
  setGetAmount: (amount: number) => void,
  setGetAmountInput: (input: string) => void,
  setIsCalculating: (calculating: boolean) => void,
  setCalculationError: (error: string | null) => void,
  setEstimate: (estimate: any) => void,
  setEstimateLoading: (loading: boolean) => void,
  setEstimateError: (error: string | null) => void
) => {
  if (!selectedAsset || fromAmount <= 0) {
    setIsCalculating(false);
    setCalculationError(null);
    return;
  }

  setIsCalculating(true);
  setCalculationError(null);

  try {
    if (
      activeTab === "express" &&
      isSimpleCalculationAsset(selectedAsset, activeTab)
    ) {
      // Express Exchange: Simple calculation for USDT/USDC on BSC - Flat $2 fee
      let calculatedAmount;

      if (fromPay) {
        // From pay amount to get amount
        calculatedAmount =
          fromAmount >= 2 ? Math.max(0, fromAmount - 2) : fromAmount;
        setGetAmount(calculatedAmount);
        setGetAmountInput(calculatedAmount.toString());
      } else {
        // From get amount to pay amount
        calculatedAmount = fromAmount + 2;
        setPayAmount(calculatedAmount);
        setPayAmountInput(calculatedAmount.toString());
      }
    } else if (activeTab === "express") {
      // Express Exchange: Complex calculation for other assets - use API like deposit.tsx
      setEstimateLoading(true);
      setEstimateError(null);

      // Use the same API call as deposit.tsx
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), 30000);
      });

      Promise.race([
        dispatch(
          fetchSwapEstimate({
            fromCurrency: "USDT",
            fromNetwork: "BSC",
            toCurrency: selectedAsset.ticker || selectedAsset.symbol || "",
            toNetwork: getAssetNetwork(selectedAsset),
            amount: fromAmount,
            usePublicApi,
          })
        ),
        timeoutPromise,
      ])
        .then((result: any) => {
          if (result.payload) {
            setEstimate(result.payload);
            if (fromPay) {
              const estimatedAmount =
                result.payload.estimated_amount || result.payload.toAmount;
              if (estimatedAmount) {
                setGetAmount(estimatedAmount);
                setGetAmountInput(estimatedAmount.toString());
              }
            } else {
              // For reverse calculation, we need to estimate from the receive amount
              const estimatedAmount =
                result.payload.estimated_amount || result.payload.toAmount;
              if (estimatedAmount) {
                setPayAmount(estimatedAmount);
                setPayAmountInput(estimatedAmount.toString());
              }
            }
          }
          setIsCalculating(false);
        })
        .catch(() => {
          // Handle errors gracefully - fallback to percentage calculation
          const commissionRate = selectedAsset?.range_commissions?.[0]
            ?.commission
            ? parseFloat(String(selectedAsset.range_commissions[0].commission))
            : 2; // Default 2%

          const networkFee = 0;

          if (fromPay) {
            const commissionAmount = (fromAmount * commissionRate) / 100;
            const totalFees = networkFee + commissionAmount;
            const calculatedAmount = Math.max(0, fromAmount - totalFees);
            setGetAmount(calculatedAmount);
            setGetAmountInput(calculatedAmount.toString());
          } else {
            const commissionAmount = (fromAmount * commissionRate) / 100;
            const totalFees = networkFee + commissionAmount;
            const calculatedAmount = fromAmount + totalFees;
            setPayAmount(calculatedAmount);
            setPayAmountInput(calculatedAmount.toString());
          }

          setEstimateError("API unavailable, using fallback calculation");
          setIsCalculating(false);
        })
        .finally(() => {
          setEstimateLoading(false);
        });
    } else {
      // Swap Crypto: Use SwapWidget logic - API-based calculation
      // For now, use percentage-based commission until SwapWidget integration
      const commissionRate = selectedAsset?.range_commissions?.[0]?.commission
        ? parseFloat(String(selectedAsset.range_commissions[0].commission))
        : 0.5; // Default 0.5% for swap

      const networkFee = 0;

      if (fromPay) {
        // From pay amount to get amount
        const commissionAmount = (fromAmount * commissionRate) / 100;
        const totalFees = networkFee + commissionAmount;
        const calculatedAmount = Math.max(0, fromAmount - totalFees);
        setGetAmount(calculatedAmount);
        setGetAmountInput(calculatedAmount.toString());
      } else {
        // From get amount to pay amount
        const commissionAmount = (fromAmount * commissionRate) / 100;
        const totalFees = networkFee + commissionAmount;
        const calculatedAmount = fromAmount + totalFees;
        setPayAmount(calculatedAmount);
        setPayAmountInput(calculatedAmount.toString());
      }
    }
  } catch {
    setCalculationError("Calculation failed. Please try again.");
  } finally {
    setIsCalculating(false);
  }
};

interface ExchangeFormProps {
  isHomePage?: boolean;
}

export default function ExchangeForm({
  isHomePage = false,
}: ExchangeFormProps) {
  const { isDark, isDeem } = useTheme();
  const { t } = useMarketingI18n();
  const dispatch = useDispatch<AppDispatch>();

  /* ------------------- Redux State ------------------- */
  const { assets, loading: assetsLoading } = useSelector(
    (state: any) => state.exchange
  );
  const { supportedAssets: swapAssets, loading: swapAssetsLoading } =
    useSelector((state: any) => state.swap);
  const { adminPaymentDetails, loading: paymentLoading } = useSelector(
    (state: any) => state.payment
  );
  const { publicPaymentMethods, publicMethodsLoading, publicMethodsError } =
    useSelector((state: any) => state.paymentMethods);
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);

  /* ------------------- State ------------------- */
  const [activeTab, setActiveTab] = useState<Tab>("express");
  const [mode, setMode] = useState<Mode>("deposit");
  const [payAmount, setPayAmount] = useState(100);
  const [payAmountInput, setPayAmountInput] = useState("100");
  const [getAmount, setGetAmount] = useState(98);
  const [getAmountInput, setGetAmountInput] = useState("98");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
  const [assetSearchTerm, setAssetSearchTerm] = useState("");
  const [paymentSearchTerm, setPaymentSearchTerm] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [isCalculatingFromPay, setIsCalculatingFromPay] = useState(true);

  // API calculation states
  const [estimate, setEstimate] = useState<any>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [showFrozenModal, setShowFrozenModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const assetDropdownRef = useRef<HTMLDivElement>(null);
  const paymentDropdownRef = useRef<HTMLDivElement>(null);
  const getDropdownContainerRef = useRef<HTMLDivElement>(null);
  const isFrozenUser = isAuthenticated && user?.freeze === true;

  // Use the data display hooks for consistent data handling
  const assetsDisplay = useAssetsDisplay(
    assets?.assets,
    swapAssets,
    assetsLoading,
    swapAssetsLoading,
    null, // exchange error
    null // swap error
  );

  // Process payment methods data based on API structure - same logic as RatesCalculator
  const processedPaymentMethods = useMemo(() => {
    if (isHomePage) {
      // Handle new API structure for public payment methods
      // First check for providers array (new structure)
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
      return []; // Return empty array if no valid data
    }
    // For authenticated users, use admin payment details
    const adminArray = Array.isArray(adminPaymentDetails)
      ? adminPaymentDetails
      : Array.isArray(adminPaymentDetails?.data)
        ? adminPaymentDetails.data
        : [];
    return adminArray;
  }, [isHomePage, publicPaymentMethods, adminPaymentDetails]);

  // Extract payment method names based on the API structure - same as RatesCalculator
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

  // Normalize processed payment methods to a plain array before mapping
  const normalizedPaymentMethods = useMemo<any[]>(() => {
    if (Array.isArray(processedPaymentMethods)) return processedPaymentMethods;
    const viaDataArray = (processedPaymentMethods as any)?.data;
    if (Array.isArray(viaDataArray)) return viaDataArray;
    const viaDataPaymentMethods = (processedPaymentMethods as any)?.data?.payment_methods;
    if (Array.isArray(viaDataPaymentMethods)) return viaDataPaymentMethods;
    return [];
  }, [processedPaymentMethods]);

  // Get provider name from provider object
  const getProviderName = (provider: any) => {
    if (provider?.provider_name) {
      return provider.provider_name;
    }
    if (provider?.payment_provider_name) {
      return provider.payment_provider_name;
    }
    return null;
  };

  // Get provider logo from provider object
  const getProviderLogo = (provider: any) => {
    if (provider?.logo) {
      return provider.logo;
    }
    if (provider?.provider_logo) {
      return provider.provider_logo;
    }
    return "/assets/image_7_jijlik.png";
  };

  // Get unique payment methods from normalized data
  const uniquePaymentMethods = Array.from(
    new Set(
      (normalizedPaymentMethods || [])
        .map(getPaymentMethodName)
        .filter(Boolean)
    )
  ).filter(
    (method) => method && typeof method === "string" && method.trim().length > 0
  ) as string[];

  // Add "Bank" as a default option if not already present
  const validPaymentMethods = uniquePaymentMethods.filter(
    (method) => method && typeof method === "string" && method.trim().length > 0
  );

  // Create a list of providers with their method names for display
  // This will show all providers with their names and logos
  const paymentProviders = useMemo(() => {
    if (!processedPaymentMethods || processedPaymentMethods.length === 0) {
      return [];
    }

    // Map providers to include method name for filtering
    return processedPaymentMethods.map((provider: any) => ({
      provider_id: provider.provider_id || provider.id,
      provider_name: getProviderName(provider),
      logo: getProviderLogo(provider),
      method_name: getPaymentMethodName(provider),
      method_display: provider?.method?.method_display || getPaymentMethodName(provider),
      provider: provider, // Keep full provider object for reference
    })).filter((item: any) => item.provider_name && item.method_name);
  }, [processedPaymentMethods]);

  // Fallback payment methods if data is corrupted or not loaded yet
  const fallbackPaymentMethods = [
    "Bank",
    "Crypto",
    "Forex",
    "Mobile",
    "Marchant",
  ];

  // Use API data if available and valid, otherwise use fallback
  const finalPaymentMethods = useMemo(() => {
    // If we have valid payment methods from API, use them (with Bank added if not present)
    if (validPaymentMethods.length > 0) {
      const methodsWithBank = validPaymentMethods.includes("Bank")
        ? validPaymentMethods
        : ["Bank", ...validPaymentMethods];
      return methodsWithBank;
    }

    // Otherwise, use fallback methods
    return fallbackPaymentMethods;
  }, [validPaymentMethods]);

  // Don't use usePaymentMethodsDisplay for string arrays - handle loading state directly
  const paymentMethodsLoading = isHomePage
    ? publicMethodsLoading
    : paymentLoading;
  const paymentMethodsError = isHomePage ? publicMethodsError : null;

  // Debug logging for data display
 
  const presets: Record<Tab, Preset> = {
    express: {
      pay: { label: "Salam Bank", icon: "/images/salam.svg" },
      get: { label: "USDT", sub: "Tether US", icon: "/images/tether.svg" },
    },
    moneyx: {
      pay: { label: "Bank", icon: "/images/salam.svg" },
      get: { label: "Bank", sub: "Bank Transfer", icon: "/images/salam.svg" },
    },
    swap: {
      pay: { label: "BTC", sub: "Bitcoin", icon: "/images/Bitcoin.svg" },
      get: { label: "ETH", sub: "Ethereum", icon: "/images/eth.svg" },
    },
  };

  const [payCurrency, setPayCurrency] = useState<Currency>(presets.express.pay);
  const [getCurrency, setGetCurrency] = useState<Currency>(presets.express.get);

  // If user is returning from Terms/Privacy from MoneyX form, reopen MoneyX tab first.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const returningFromLegal = sessionStorage.getItem(RETURNING_FROM_LEGAL_KEY);
      const hasSwapLegalState = sessionStorage.getItem(SWAP_LEGAL_RETURN_STATE_KEY);
      const hasMoneyXLegalState = sessionStorage.getItem(MONEYX_LEGAL_RETURN_STATE_KEY);
      const hasMoneyXLocalState =
        localStorage.getItem("moneyx_form_state") ||
        localStorage.getItem("moneyx_restore_from") ||
        localStorage.getItem("moneyx_restore_to");

      if (returningFromLegal && hasSwapLegalState) {
        setActiveTab("swap");
        return;
      }

      if (returningFromLegal && (hasMoneyXLegalState || hasMoneyXLocalState)) {
        setActiveTab("moneyx");
      }
    } catch {
      // Ignore storage read errors
    }
  }, []);

  /* ------------------- Data Fetching ------------------- */
  useEffect(() => {
    // Skip API calls on home page if user is not authenticated
    if (isHomePage && !isAuthenticated) {
      return;
    }

    withTimeout(dispatch(fetchAssets(false)).unwrap(), 15_000).catch(() => {});
  }, [dispatch, isHomePage, isAuthenticated]);

  useEffect(() => {
    if (isHomePage && !isAuthenticated) {
      return;
    }
    withTimeout(
      dispatch(
        fetchSupportedAssets({ forceRefresh: false, feature: "exchange" })
      ).unwrap(),
      15_000
    ).catch(() => {});
  }, [dispatch, isHomePage, isAuthenticated]);

  useEffect(() => {
    if (isHomePage) {
      withTimeout(dispatch(fetchPublicPaymentMethods()).unwrap(), 15_000).catch(() => {});
    } else {
      if (!isAuthenticated) {
        return;
      }
      withTimeout(dispatch(fetchAdminPaymentDetails(false)).unwrap(), 15_000).catch(() => {});
    }
  }, [dispatch, isHomePage, isAuthenticated]);

  /* ------------------- Asset Selection ------------------- */
  // Auto-select first asset when assets are loaded
  useEffect(() => {
    if (
      assetsDisplay.shouldShowData &&
      assetsDisplay.displayData.length > 0 &&
      !selectedAsset
    ) {
      // Sort assets based on active tab
      const sortedAssets = [...assetsDisplay.displayData].sort((a, b) => {
        if (activeTab === "express") {
          // For Express Exchange: USDT on BSC first, then USDC on BSC, then others
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
        } else {
          // For Swap Crypto: keep original order
          return 0;
        }
      });

      const firstAsset = sortedAssets[0];
      setSelectedAsset(firstAsset);

      // Update currency display based on mode
      if (mode === "deposit") {
        // For deposit: payment method -> asset
        setPayCurrency(presets.express.pay); // Keep bank as pay
        setGetCurrency({
          label: firstAsset?.ticker || firstAsset?.symbol || "USDT",
          sub: firstAsset?.name || "Tether US",
          icon: getAssetImageUrl(firstAsset),
        });
      } else {
        // For withdrawal: asset -> payment method
        setPayCurrency({
          label: firstAsset?.ticker || firstAsset?.symbol || "USDT",
          sub: firstAsset?.name || "Tether US",
          icon: getAssetImageUrl(firstAsset),
        });
        setGetCurrency(presets.express.pay); // Bank as get
      }
    }
  }, [assetsDisplay.displayData, selectedAsset, mode]);

  /* ------------------- Click Outside Handler ------------------- */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is inside any dropdown using refs
      const isInsideAssetDropdown = assetDropdownRef.current?.contains(target);
      const isInsidePaymentDropdown =
        paymentDropdownRef.current?.contains(target);
      const isInsideMainDropdown = dropdownRef.current?.contains(target);
      const isInsideGetDropdown =
        getDropdownContainerRef.current?.contains(target);

      // Only close dropdowns if click is completely outside all dropdown areas
      if (
        !isInsideAssetDropdown &&
        !isInsidePaymentDropdown &&
        !isInsideMainDropdown &&
        !isInsideGetDropdown
      ) {
        setIsAssetDropdownOpen(false);
        setIsPaymentDropdownOpen(false);
      }
    };

    // Use regular event listener (not capture) to avoid conflicts
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* Sync currencies when tab switches */
  useEffect(() => {
    setPayCurrency(presets[activeTab].pay);
    setGetCurrency(presets[activeTab].get);
    setPayAmount(0);
    setGetAmount(0);
  }, [activeTab]);

  /* ------------------- Payment Method Selection ------------------- */
  const handlePaymentMethodSelect = (provider: any) => {
    setSelectedPaymentMethod(provider);
    setIsPaymentDropdownOpen(false);
    setPaymentSearchTerm("");

    const providerName = provider.provider_name || provider.method_name || "Payment Method";
    const providerLogo = provider.logo || "/assets/image_7_jijlik.png";

    // Update currency display based on current mode
    if (mode === "deposit") {
      // For deposit: payment method -> asset
      setPayCurrency({
        label: providerName,
        sub: provider.method_display || provider.method_name || "Payment Method",
        icon: providerLogo,
      });
    } else {
      // For withdrawal: asset -> payment method
      setGetCurrency({
        label: providerName,
        sub: provider.method_display || provider.method_name || "Payment Method",
        icon: providerLogo,
      });
    }
  };

  /* ------------------- Mode Switching ------------------- */
  const handleModeToggle = () => {
    const newMode = mode === "deposit" ? "withdrawal" : "deposit";
    setMode(newMode);

    // Update currency display based on new mode
    if (newMode === "deposit") {
      // For deposit: payment method -> asset
      if (selectedPaymentMethod) {
        const providerName = selectedPaymentMethod.provider_name || selectedPaymentMethod.method_name || "Payment Method";
        const providerLogo = selectedPaymentMethod.logo || "/assets/image_7_jijlik.png";
        setPayCurrency({
          label: providerName,
          sub: selectedPaymentMethod.method_display || selectedPaymentMethod.method_name || "Payment Method",
          icon: providerLogo,
        });
      } else {
        setPayCurrency(presets.express.pay); // Fallback to default
      }

      if (selectedAsset) {
        setGetCurrency({
          label: selectedAsset?.ticker || selectedAsset?.symbol || "USDT",
          sub: selectedAsset?.name || "Tether US",
          icon: getAssetImageUrl(selectedAsset),
        });
      }
    } else {
      // For withdrawal: asset -> payment method
      if (selectedAsset) {
        setPayCurrency({
          label: selectedAsset?.ticker || selectedAsset?.symbol || "USDT",
          sub: selectedAsset?.name || "Tether US",
          icon: getAssetImageUrl(selectedAsset),
        });
      }

      if (selectedPaymentMethod) {
        const providerName = selectedPaymentMethod.provider_name || selectedPaymentMethod.method_name || "Payment Method";
        const providerLogo = selectedPaymentMethod.logo || "/assets/image_7_jijlik.png";
        setGetCurrency({
          label: providerName,
          sub: selectedPaymentMethod.method_display || selectedPaymentMethod.method_name || "Payment Method",
          icon: providerLogo,
        });
      } else {
        setGetCurrency(presets.express.pay); // Fallback to default
      }
    }
  };

  /* ------------------- Amount Calculation ------------------- */
  const handlePayAmountChange = (value: string) => {
    setPayAmountInput(value);
    const numValue = parseFloat(value) || 0;
    setPayAmount(numValue);
    setIsCalculatingFromPay(true);

    // If user cleared input, clear the other side too (avoid stale converted values).
    if (value.trim() === "") {
      setGetAmount(0);
      setGetAmountInput("");
      setIsCalculating(false);
      setCalculationError(null);
      setEstimate(null);
      setEstimateLoading(false);
      setEstimateError(null);
      return;
    }

    // Calculate get amount
    calculateAmounts(
      numValue,
      true, // fromPay = true
      selectedAsset,
      activeTab,
      isHomePage,
      dispatch,
      setPayAmount,
      setPayAmountInput,
      setGetAmount,
      setGetAmountInput,
      setIsCalculating,
      setCalculationError,
      setEstimate,
      setEstimateLoading,
      setEstimateError
    );
  };

  const handleGetAmountChange = (value: string) => {
    setGetAmountInput(value);
    const numValue = parseFloat(value) || 0;
    setGetAmount(numValue);
    setIsCalculatingFromPay(false);

    // If user cleared input, clear the other side too (avoid stale converted values).
    if (value.trim() === "") {
      setPayAmount(0);
      setPayAmountInput("");
      setIsCalculating(false);
      setCalculationError(null);
      setEstimate(null);
      setEstimateLoading(false);
      setEstimateError(null);
      return;
    }

    // Calculate pay amount
    calculateAmounts(
      numValue,
      false, // fromPay = false
      selectedAsset,
      activeTab,
      isHomePage,
      dispatch,
      setPayAmount,
      setPayAmountInput,
      setGetAmount,
      setGetAmountInput,
      setIsCalculating,
      setCalculationError,
      setEstimate,
      setEstimateLoading,
      setEstimateError
    );
  };

  /* Swap currencies + amounts */
  const handleSwap = () => {
    setPayCurrency(getCurrency);
    setGetCurrency(payCurrency);
    setPayAmount(getAmount);
    setGetAmount(payAmount);
    setPayAmountInput(getAmountInput);
    setGetAmountInput(payAmountInput);
  };

  /* ------------------- Asset Filtering and Sorting ------------------- */
  // Filter assets based on search term - search by ticker and name
  const filteredAssets =
    assetsDisplay.displayData?.filter((asset: Asset) => {
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

  // Sort assets based on active tab
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    if (activeTab === "express") {
      // For Express Exchange: USDT on BSC first, then USDC on BSC, then rest
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
    } else {
      // For Swap Crypto: keep original order
      return 0;
    }
  });

  /* ------------------- Payment Method Filtering ------------------- */
  // Filter payment providers based on search term - search by provider name and method name
  const filteredPaymentProviders = paymentProviders.filter(
    (provider: any) => {
      const searchTerm = paymentSearchTerm.toUpperCase();
      const providerName = (provider.provider_name || "").toUpperCase();
      const methodName = (provider.method_name || "").toUpperCase();
      return providerName.includes(searchTerm) || methodName.includes(searchTerm);
    }
  );



  /* ------------------- Asset Selection ------------------- */
  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsAssetDropdownOpen(false);
    setAssetSearchTerm(""); // Clear search term when asset is selected

    // Update currency display based on current mode
    if (mode === "deposit") {
      // For deposit: payment method -> asset
      setGetCurrency({
        label: asset?.ticker || asset?.symbol || "USDT",
        sub: asset?.name || "Tether US",
        icon: getAssetImageUrl(asset),
      });
    } else {
      // For withdrawal: asset -> payment method
      setPayCurrency({
        label: asset?.ticker || asset?.symbol || "USDT",
        sub: asset?.name || "Tether US",
        icon: getAssetImageUrl(asset),
      });
    }
  };

  /* ------------------- Payment Method Dropdown Component ------------------- */
  const PaymentMethodDropdown: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (payment: any) => void;
    selectedPayment: any;
  }> = ({ isOpen, onClose, onSelect, selectedPayment }) => {
    if (!isOpen) return null;

    // Helper to check if provider is selected
    const isProviderSelected = (provider: any) => {
      if (!selectedPayment) return false;
      if (typeof selectedPayment === 'string') {
        return selectedPayment === provider.provider_name || selectedPayment === provider.method_name;
      }
      return selectedPayment.provider_id === provider.provider_id ||
        selectedPayment.provider_name === provider.provider_name;
    };

    return (
      <div
        ref={paymentDropdownRef}
        className="absolute top-full left-0 right-3 mt-2 bg-white dark:bg-[var(--bg-color)] border border-gray-200 dark:border-[#35353E] rounded-xl shadow-lg z-[9999] w-full"
      >
        {/* Search Input */}
        <div className="p-3 border-b border-gray-200 dark:border-[#35353E]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search payment providers..."
              value={paymentSearchTerm}
              onChange={(e) => setPaymentSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-transparent text-[#1F2937] dark:text-[#ffffff] placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Payment Providers List */}
        <div className="max-h-60 overflow-y-auto">
          {(() => {
            if (paymentMethodsLoading && paymentProviders.length === 0) {
              return (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Loading payment methods...
                </div>
              );
            }

            if (filteredPaymentProviders.length === 0) {
              return (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {paymentProviders.length === 0
                    ? "No payment methods available"
                    : "No payment providers found"}
                </div>
              );
            }

            return filteredPaymentProviders.map(
              (provider: any, index: number) => {
                const isSelected = isProviderSelected(provider);
                const fallbackLogo = "/assets/image_7_jijlik.png";

                return (
                  <div
                    key={provider.provider_id || index}
                    className={`p-3 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] cursor-pointer border-b border-gray-100 dark:border-[#35353E] last:border-b-0 ${isSelected ? "bg-[#1D8751]/10" : ""
                      }`}
                    onClick={() => {
                      onSelect(provider);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={provider.logo || fallbackLogo}
                        alt={provider.provider_name || "provider icon"}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          if (e.currentTarget.src !== fallbackLogo) {
                            e.currentTarget.src = fallbackLogo;
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[#1F2937] dark:text-[#ffffff] font-normal text-sm flex items-center gap-2 flex-wrap">
                          <span className="truncate">{provider.provider_name}</span>
                          {isSelected && (
                            <span className="text-[#1D8751] text-sm">✓</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {provider.provider_name} - {provider.method_display || provider.method_name || "Payment Method"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            );
          })()}
        </div>
      </div>
    );
  };

  /* ------------------- Helpers ------------------- */
  const handleTabClick = (tabId: Tab) => {
    if (isFrozenUser) {
      setShowFrozenModal(true);
      return;
    }
    // Allow tab switching without forcing navigation to the login page
    setActiveTab(tabId);
  };

  const TabButton: React.FC<{
    id: Tab;
    label: string;
    variant: "express" | "moneyx" | "swap";
    position?: "first" | "middle" | "last";
  }> = ({ id, label, variant, position = "middle" }) => {
    const isActive = activeTab === id;
    const [isSmallScreen, setIsSmallScreen] = useState(false);

    useEffect(() => {
      const checkScreenSize = () => {
        setIsSmallScreen(window.innerWidth < 640);
      };
      checkScreenSize();
      window.addEventListener("resize", checkScreenSize);
      return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    // Determine if neighbors are active to know where to apply slanting
    const leftNeighborActive = (position === "middle" && activeTab === "express") || (position === "last" && activeTab === "moneyx");
    const rightNeighborActive = (position === "first" && activeTab === "moneyx") || (position === "middle" && activeTab === "swap");

    // Only apply slanting when:
    // 1. This tab is active (slants where it meets inactive neighbors)
    // 2. This tab is inactive but neighbor is active (slants where it meets active neighbor)
    // When both tabs are inactive, no slanting - straight rectangle
    let clipPath: string | undefined;

    if (!isActive && !leftNeighborActive && !rightNeighborActive) {
      // Both neighbors inactive - straight rectangle, no slanting
      clipPath = undefined;
    } else if (position === "first") {
      // Express tab: slanted at top-right if active, or bottom-right (opposite) if MoneyX is active
      if (isActive) {
        // Express active: normal top-right slant
        clipPath = "polygon(0 0, 92% 0, 100% 100%, 0 100%)";
      } else if (rightNeighborActive) {
        // MoneyX active: opposite direction - bottom-right slant (downward curve)
        clipPath = "polygon(0 0, 100% 0, 92% 100%, 0 100%)";
      } else {
        clipPath = undefined;
      }
    } else if (position === "last") {
      // Swap tab: slanted at top-left (opposite) if active, or bottom-left if MoneyX is active
      if (isActive) {
        // Swap active: opposite direction - top-left slant (downward curve)
        clipPath = "polygon(8% 0, 100% 0, 100% 100%, 0 100%)";
      } else if (leftNeighborActive) {
        // MoneyX active: normal bottom-left slant
        clipPath = "polygon(0 0, 100% 0, 100% 100%, 8% 100%)";
      } else {
        clipPath = undefined;
      }
    } else {
      // Middle tab (MoneyX): slanted on both sides only where it meets active neighbors
      const slantRight = isActive || rightNeighborActive;
      const slantLeft = isActive || leftNeighborActive;

      if (slantRight && slantLeft) {
        // When MoneyX is active, left side curves downward (from 8% top to 0 bottom)
        clipPath = isActive
          ? "polygon(8% 0, 92% 0, 100% 100%, 0 100%)"
          : "polygon(0 0, 92% 0, 100% 100%, 8% 100%)";
      } else if (slantRight) {
        clipPath = "polygon(0 0, 92% 0, 100% 100%, 0 100%)";
      } else if (slantLeft) {
        // When MoneyX is active, left side curves downward (from 8% top to 0 bottom)
        clipPath = isActive
          ? "polygon(8% 0, 100% 0, 100% 100%, 0 100%)"
          : "polygon(0 0, 100% 0, 100% 100%, 8% 100%)";
      } else {
        clipPath = undefined;
      }
    }

    // Determine border styling: outer edges only, no borders between buttons
    const borderColor = isDark ? "#2f323b" : "#6B7280";
    const hasLeftBorder = position === "first"; // Only first tab has left border
    const hasRightBorder = position === "last"; // Only last tab has right border
    // No borders between buttons (no right border on first/middle, no left border on middle/last)

    // When MoneyX is active, remove all borders from Express tab
    const shouldHideBorders = position === "first" && activeTab === "moneyx";

    const buttonClasses = [
      "relative flex w-full items-center justify-center overflow-hidden transition-all duration-200",
      "px-3 sm:px-4 md:px-5 lg:px-6 xl:px-7 py-2 sm:py-2.5 md:py-3 lg:py-3.5 min-h-[44px] sm:min-h-[48px] md:min-h-[52px] lg:min-h-[56px]",
      isActive
        ? "bg-transparent"
        : isDark
          ? "bg-[#0e1018]"
          : "bg-gray-300",
      // Text Alignment and Transformations to match Sidebar
      "capitalize font-bold"
    ].join(" ");

    // We don't use the normal border to draw the joint; it's all done with
    // the small slanted segments below.
    const borderColors = "transparent";

    // Text Color Logic to match Sidebar
    // Sidebar Active: Light Mode = text-[#727272] (Grey), Dark Mode = text-white.
    // Sidebar Inactive: text-[#727272] (Grey) for both.
    const textColorClass = isActive
      ? (isDark ? "text-white" : "text-[#727272]")
      : "text-[#727272]";

    const labelWrapperClasses = [
      "relative z-[1] flex items-center justify-center",
      "gap-0", // Gap handled inside specific labels
      "text-[10px] sm:text-xs md:text-sm lg:text-base transition-colors whitespace-nowrap",
      textColorClass
    ].join(" ");

    const ariaLabel =
      variant === "express"
        ? t("marketing.exchange.tabs.express", "Express Exchange")
        : variant === "moneyx"
          ? t("marketing.exchange.tabs.moneyx", "Money X")
          : label || t("marketing.exchange.tabs.swap", "Swap");

    // Icon Sources
    // Express / Exchange Icons (from Sidebar)
    // Light Mode / Inactive: Group_9 (Usually Dark/Grey X)
    // Dark Mode Active: Group_8 (Usually White/Green X)
    const exchangeIconSrc1 = "/images/Group_9_momvgo.png";
    const exchangeIconSrc2 = "/images/Group_5_gkxzdz.png";

    // MoneyX Icons (from Sidebar)
    // Light Mode / Inactive: Group_6 (Dark X)
    // Dark Mode Active: Group_7 (Green/White X)
    const moneyXIconSrc1 = "/images/x.png";
    const moneyXIconSrc2 = "/assets/Group_7_ichuyz.png";

    // Process label rendering
    const renderLabel = () => {
      if (variant === "express") {
        // "E_X" Style - E followed by X icon only (matching sidebar)
        return (
          <span className="flex flex-row items-center justify-center h-full">
            <span className={`${textColorClass} text-[10px] sm:text-xs md:text-sm lg:text-base font-bold uppercase`} style={{ lineHeight: 1 }}>E</span>
            <img
              src={isActive && isDark ? exchangeIconSrc2 : exchangeIconSrc1}
              className="h-[10px] mt-2 sm:h-[11px] md:h-[13px] lg:h-[15px] w-auto"
              alt="X"
              style={{ display: 'inline-block' }}
            />
          </span>
        );
      } else if (variant === "moneyx") {
        // "Money_X" Style - Money followed by X icon
        return (
          <span className="flex flex-row items-center justify-center h-full">
            <span className={`${textColorClass} text-[10px] sm:text-xs md:text-sm lg:text-base font-bold`} style={{ lineHeight: 1 }}>Money</span>
            <img
              src={isActive && isDark ? moneyXIconSrc2 : moneyXIconSrc1}
              className="h-[10px] mt-2 sm:h-[11px] md:h-[13px] lg:h-[15px] w-auto"
              alt="X"
              style={{ display: 'inline-block' }}
            />
          </span>
        );
      }
      // Default rendering for Swap 
      return label?.trim() ? <span className={textColorClass}>{label}</span> : null;
    };

    const flexGrowValue = variant === "express" || variant === "swap" ? 2 : 1.6;

    // Determine which edges have slants (for border drawing)
    const hasSlantRightTop = clipPath && clipPath.includes("92% 0"); // Right edge slants top-right (Express active)
    const hasSlantRightBottom = clipPath && clipPath.includes("92% 100%"); // Right edge slants bottom-right (MoneyX active, Express inactive)
    const hasSlantRight = hasSlantRightTop || hasSlantRightBottom;
    // Check if left edge has downward curve (8% at top) or upward curve (8% at bottom)
    const hasSlantLeftDownward = clipPath && clipPath.startsWith("polygon(8% 0"); // Downward curve (MoneyX active or Swap active)
    const hasSlantLeftUpward = clipPath && clipPath.includes("8% 100%"); // Upward curve (MoneyX inactive, Swap inactive)
    const hasSlantLeft = hasSlantLeftDownward || hasSlantLeftUpward;

    // Calculate border-radius for curved meeting points
    const getBorderRadius = () => {
      // Apply curves at meeting points where tabs connect
      if (position === "first") {
        // Express tab: curve at top-right meeting point (where it meets MoneyX)
        // When MoneyX is active, make it straight (no curve)
        if (hasSlantRight && !shouldHideBorders) {
          return '0 12px 0 0'; // Top-right corner curved
        }
        return '0';
      } else if (position === "last") {
        // Swap tab: curve at bottom-left meeting point (where it meets MoneyX)
        if (hasSlantLeft) {
          return '0 0 0 12px'; // Bottom-left corner curved
        }
        return '0';
      } else {
        // MoneyX tab: curve at both meeting points
        if (hasSlantLeft && hasSlantRight) {
          return '0 12px 12px 0'; // Top-right and bottom-left corners curved
        } else if (hasSlantLeft) {
          return '0 0 12px 0'; // Bottom-left corner curved
        } else if (hasSlantRight) {
          return '0 12px 0 0'; // Top-right corner curved
        }
        return '0';
      }
    };

    return (
      <button
        type="button"
        onClick={() => handleTabClick(id)}
        aria-pressed={isActive}
        aria-label={ariaLabel}
        className={`group flex-1 px-0 rounded-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D8751] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent relative overflow-visible`}
        style={{
          clipPath,
          flexGrow: flexGrowValue,
          flexBasis: 0,
          borderRadius: getBorderRadius(),
          // Outer edges only - no borders between buttons (slanted edges handled separately)
          // When MoneyX is active, remove all borders from Express tab
          borderLeft: hasLeftBorder && !isActive && !hasSlantLeft && !shouldHideBorders ? `0px solid ${borderColor}` : "none",
          borderRight:
            hasRightBorder && !isActive && !hasSlantRight && !shouldHideBorders
              ? `0px solid ${borderColor}`
              : "none",
          borderTop: !isActive && !shouldHideBorders ? `0px solid ${borderColor}` : "none",
          borderBottom: !isActive && !shouldHideBorders ? `0px solid ${borderColor}` : "none",
        }}
      >
        {/* Border on slanted right edge */}
        {hasSlantRight && !isActive && (
          <svg
            className="pointer-events-none absolute top-0 right-0 z-10"
            style={{ width: '100%', height: '100%', overflow: 'visible' }}
            aria-hidden="true"
          >
            {hasSlantRightTop ? (
              // Top-right slant: from 92% at top to 100% at bottom (Express active)
              <line
                x1="92%"
                y1="0"
                x2="100%"
                y2="100%"
                stroke={borderColor}
                strokeWidth="2"
              />
            ) : hasSlantRightBottom ? (
              // Bottom-right slant: from 100% at top to 92% at bottom (MoneyX active, Express inactive - opposite direction)
              <line
                x1="100%"
                y1="0"
                x2="92%"
                y2="100%"
                stroke={borderColor}
                strokeWidth="2"
              />
            ) : null}
          </svg>
        )}
        {/* Border on slanted left edge */}
        {hasSlantLeft && !isActive && !shouldHideBorders && (
          <svg
            className="pointer-events-none absolute top-0 left-0 z-10"
            style={{ width: '100%', height: '100%', overflow: 'visible' }}
            aria-hidden="true"
          >
            {hasSlantLeftUpward ? (
              // Upward curve: from 0 at top to 8% at bottom (when MoneyX is inactive and Express is active)
              <line
                x1="0"
                y1="0"
                x2="8%"
                y2="100%"
                stroke={borderColor}
                strokeWidth="2"
              />
            ) : null}
          </svg>
        )}
        <div className={buttonClasses}>
          <span className={labelWrapperClasses}>
            {renderLabel()}
          </span>
        </div>
      </button>
    );
  };



  const AmountInput: React.FC<{
    amount: string;
    onChange: (v: string) => void;
    disabled?: boolean;
  }> = ({ amount, onChange, disabled = false }) => (
    <input
      type="text"
      inputMode="decimal"
      value={amount}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="0"
      className={`border border-gray-300 dark:border-gray-300/20 bg-white dark:bg-transparent text-gray-900 dark:text-white w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 rounded-3xl placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1D8751] focus:border-transparent min-h-[44px] text-sm sm:text-base ${disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
    />
  );

  const AssetDropdown: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (asset: Asset) => void;
    selectedAsset: Asset | null;
  }> = ({ isOpen, onClose, onSelect, selectedAsset }) => {
    if (!isOpen) return null;

    return (
      <div
        ref={assetDropdownRef}
        className="absolute top-full left-0 right-0 mt-1 bg-[#ffffff] dark:bg-[#23211DFF] border border-[#A2A4A9FF] dark:border-[#35353E] rounded-2xl z-[9999] max-h-[60vh] overflow-hidden w-full shadow-lg"
      >
        {/* Search Input */}
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

        {/* Asset List */}
        <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {assetsDisplay.isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Loading assets...
            </div>
          ) : sortedAssets.length > 0 ? (
            sortedAssets.map((asset: Asset, index: number) => (
              // Updated AssetDropdown item with fixed overflow issue
              // Updated AssetDropdown item with improved responsive layout

              <div
                key={`${asset.asset_id || "asset"}-${asset.symbol || asset.ticker || asset.name}-${asset.network || "unknown"}-${index}`}
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 text-black dark:text-white hover:bg-[#78787AFF] dark:hover:bg-[#35353E] cursor-pointer border-b border-[#A2A4A9FF] dark:border-[#35353E] last:border-b-0 w-full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(asset);
                }}
              >
                <img
                  src={getAssetImageUrl(asset)}
                  alt={asset?.name || asset?.ticker || asset?.symbol || "Asset"}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.src =
                      "/images/tether.svg";
                  }}
                />
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                    <span className="text-[#111827] dark:text-[#ffffff] font-medium text-sm sm:text-base truncate">
                      {(
                        asset.ticker ||
                        asset.symbol ||
                        asset.name ||
                        "Unknown"
                      ).toUpperCase()}
                    </span>
                    <span className="bg-[#1D8751] text-[#ffffff] text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                      {getNetworkDisplayName(getAssetNetwork(asset))}
                    </span>
                  </div>
                  <div className="text-[#475569] dark:text-[#788099] text-xs sm:text-sm truncate">
                    {(() => {
                      // Clean up asset name to remove redundant network information
                      let displayName =
                        asset.name ||
                        asset.ticker ||
                        asset.symbol ||
                        "Unknown Asset";

                      // Remove common redundant patterns
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
                  <div className="w-2 h-2 bg-[#1D8751] rounded-full flex-shrink-0"></div>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-[#7e7e8f] dark:text-[#788099]">
              {assetSearchTerm ? "No assets found" : "No assets available"}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ------------------- UI ------------------- */
  // Render tabs and content based on active tab
  const renderTabs = () => {
    const borderColor = isDark ? "#2f323b" : "#6B7280";

    // Tab layout math (flexGrow: Express=2, MoneyX=1.6, Swap=2 => total=5.6)
    // Express width = 2/5.6 = 35.714%
    // MoneyX width  = 1.6/5.6 = 28.571%
    // Swap starts at 64.285%
    // Slants used in clipPaths:
    // - Right slant uses 92% at top (or 92% at bottom depending on state)
    // - Left slant uses 8% at bottom for the "upward" cut
    const P_EXPRESS = "35.714%";
    const P_SWAP_START = "64.285%";
    const P_MONEYX_W = "28.571%";
    const P_MONEYX_LEFT_BOTTOM_INSET = "2.286%"; // 8% of MoneyX width (0.08 * 28.571)
    const P_EXPRESS_RIGHT_BOTTOM_INSET = "32.857%"; // 92% of Express width (0.92 * 35.714)
    const P_MONEYX_RIGHT_TOP_CUT = "62%"; // Express start + (92% of MoneyX width) = 35.714 + 26.285 ≈ 62
    // Swap width = 100% - 64.285% = 35.715%, 8% of Swap width = 2.857%
    const P_SWAP_LEFT_BOTTOM_INSET = "2.857%"; // 8% of Swap width (0.08 * 35.715)
    const P_SWAP_BOTTOM_END = "67.142%"; // Swap start + 8% of Swap width = 64.285 + 2.857

    return (
      <div
        className="relative flex w-full overflow-hidden mt-0 mb-0 rounded-t-2xl bg-gray-300 dark:bg-[#18181D] gap-0 border border-b-0 dark:border-accent border-gray-400"
      >
        {/* Uniform OUTER border that DOES NOT touch the active tab area (segmented). */}
        {/* Left / Right borders (hide the side border next to the active outer tab) */}
        {activeTab !== "express" && (
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0 z-30"
            style={{ borderColor }}
            aria-hidden="true"
          />
        )}
        {activeTab !== "swap" && (
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 z-30"
            style={{ borderColor }}
            aria-hidden="true"
          />
        )}

        {/* Rounded top corners (hide the corner border next to the active tab) */}
        {activeTab !== "express" && (
          <div
            className="pointer-events-none absolute top-0 left-0 h-10 w-10 sm:w-12 z-30"
            style={{ borderColor }}
            aria-hidden="true"
          />
        )}
        {activeTab !== "swap" && (
          <div
            className="pointer-events-none absolute top-0 right-0 h-10 w-10 sm:w-12 z-30"
            style={{ borderColor }}
            aria-hidden="true"
          />
        )}

        {/* Top border segments (skip the active tab width) */}
        {activeTab === "express" && (
          <div
            className="pointer-events-none absolute top-0 z-30"
            // Express active => MoneyX inactive has a LEFT slant at the BOTTOM only, so TOP join is straight.
            style={{ borderColor, left: P_EXPRESS, right: 0 }}
            aria-hidden="true"
          />
        )}
        {activeTab === "moneyx" && (
          <>
            <div
              className="pointer-events-none absolute top-0 left-0  z-30"
              // MoneyX active => Express top border extends until it meets the start of slanting part (full Express width)
              style={{ borderColor, width: P_EXPRESS }}
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute top-0 z-30"
              // MoneyX active => Swap inactive join is straight at the TOP.
              style={{ borderColor, left: P_SWAP_START, right: 0 }}
              aria-hidden="true"
            />
          </>
        )}
        {activeTab === "swap" && (
          <div
            className="pointer-events-none absolute top-0 left-0 z-30"
            // Swap active => MoneyX inactive has a RIGHT slant at the TOP (92%), so stop before the slant point.
            style={{ borderColor, width: P_MONEYX_RIGHT_TOP_CUT }}
            aria-hidden="true"
          />
        )}
        <TabButton
          id="express"
          variant="express"
          position="first"
          label={t("marketing.exchange.tabs.express", "Express")}
        />
        <TabButton
          id="moneyx"
          variant="moneyx"
          position="middle"
          label={t("marketing.exchange.tabs.moneyx", "Money X")}
        />
        <TabButton
          id="swap"
          variant="swap"
          position="last"
          label={t("marketing.exchange.tabs.swap", "Swap")}
        />

        {/* Bottom border segments (skip the active tab width) */}
        {activeTab === "express" && (
          <div
            className="pointer-events-none absolute bottom-0 h-[2px] z-30"
            // Express active => MoneyX inactive LEFT edge is inset by 8% at the BOTTOM.
            style={{
              backgroundColor: borderColor,
              left: `calc(${P_EXPRESS} + ${P_MONEYX_LEFT_BOTTOM_INSET})`,
              right: 0,
            }}
            aria-hidden="true"
          />
        )}
        {activeTab === "moneyx" && (
          <>
            <div
              className="pointer-events-none absolute bottom-0 left-0 h-[2px] z-30"
              // MoneyX active => Express inactive RIGHT edge is inset by 92% at the BOTTOM.
              // Border stops at the slant point (92% of Express width)
              style={{ backgroundColor: borderColor, width: P_EXPRESS_RIGHT_BOTTOM_INSET }}
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute bottom-0 h-[2px] z-30"
              // MoneyX active => Swap inactive LEFT edge slant starts at 8% from Swap's left edge.
              // Border starts at Swap start + 8% of Swap width, ends at right edge
              style={{
                backgroundColor: borderColor,
                left: P_SWAP_BOTTOM_END,
                right: 0,
              }}
              aria-hidden="true"
            />
          </>
        )}
        {activeTab === "swap" && (
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-[2px] z-30"
            // Swap active => MoneyX inactive RIGHT edge reaches 100% at the BOTTOM (slant goes to full width).
            style={{ backgroundColor: borderColor, width: P_SWAP_START }}
            aria-hidden="true"
          />
        )}
      </div>
    );
  };

  // If Swap Crypto tab is active, render SwapWidget with tab controls
  if (activeTab === "swap") {
    return (
      <div
        className={`w-full mx-auto bg-background dark:bg-[#18181D]
        rounded-2xl ${isHomePage
            ? "max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl"
            : "max-w-none"
          }`}>
        {renderTabs()}
        <div className="pt-5 sm:pt-5 px-3 sm:px-4 md:px-5 py-3 border-l border-r border-b border-border dark:border-accent rounded-b-2xl">
          {isFrozenUser ? (
            <div className="rounded-xl border border-[#E23D3A]/40 bg-[#E23D3A]/10 p-4 text-sm text-[#E23D3A]">
              Your account is frozen. Please contact Customer Support to unfreeze and continue transactions.
            </div>
          ) : (
            <SwapWidget usePublicApi={isHomePage} />
          )}
        </div>
        <FrozenAccountModal
          isOpen={showFrozenModal}
          onClose={() => setShowFrozenModal(false)}
        />
      </div>
    );
  }

  // If Money X tab is active, render MoneyX component
  if (activeTab === "moneyx") {
    return (
      <div
        className={`w-full mx-auto bg-background dark:bg-[#18181D] 
        rounded-2xl ${isHomePage
            ? "max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl"
            : "max-w-none"
          }`}>
        {renderTabs()}
        <div className="pt-2 sm:pt-3 px-3 sm:px-4 md:px-5 py-3 border-l border-r border-b border-border dark:border-accent rounded-b-2xl">
          {isFrozenUser ? (
            <div className="rounded-xl border border-[#E23D3A]/40 bg-[#E23D3A]/10 p-4 text-sm text-[#E23D3A]">
              Your account is frozen. Please contact Customer Support to unfreeze and continue transactions.
            </div>
          ) : (
            <MoneyX isHomePage={isHomePage} commissionType="deposit" />
          )}
        </div>
        <FrozenAccountModal
          isOpen={showFrozenModal}
          onClose={() => setShowFrozenModal(false)}
        />
      </div>
    );
  }

  // Default: Express Exchange tab
  return (
    <div
      className={`w-full mx-auto bg-background dark:bg-[#18181D] 
      rounded-2xl ${isHomePage
          ? "max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl"
          : "max-w-none"
        }`}>
      {renderTabs()}
      {/* Express Exchange Content */}
      <div className="pt-2 sm:pt-3 px-3 sm:px-4 md:px-5 py-3 border-l border-r border-b border-border dark:border-accent rounded-b-2xl">
        {isFrozenUser ? (
          <div className="rounded-xl border border-[#E23D3A]/40 bg-[#E23D3A]/10 p-4 text-sm text-[#E23D3A]">
            Your account is frozen. Please contact Customer Support to unfreeze and continue transactions.
          </div>
        ) : (
          <Express isHomePage={isHomePage} />
        )}
      </div>
      <FrozenAccountModal
        isOpen={showFrozenModal}
        onClose={() => setShowFrozenModal(false)}
      />
    </div>
  );
}

