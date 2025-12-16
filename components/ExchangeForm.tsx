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
import { FaSearch } from "react-icons/fa";
import Express from "@/features/express/home/express/express";
import SwapWidget from "@/features/express/home/swap copy/components/SwapWidget";
import MoneyX from "@/features/express/home/components/moneyX/components/MoneyX";

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
  return "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
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
        .catch((error) => {
          console.error("Failed to fetch swap estimate:", error);

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
  } catch (error) {
    console.error("Calculation error:", error);
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
  const { isAuthenticated } = useSelector((state: any) => state.auth);

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const assetDropdownRef = useRef<HTMLDivElement>(null);
  const paymentDropdownRef = useRef<HTMLDivElement>(null);
  const getDropdownContainerRef = useRef<HTMLDivElement>(null);

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
    return "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png";
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
    console.log("🔍 Using fallback payment methods:", fallbackPaymentMethods);
    return fallbackPaymentMethods;
  }, [validPaymentMethods]);

  // Don't use usePaymentMethodsDisplay for string arrays - handle loading state directly
  const paymentMethodsLoading = isHomePage
    ? publicMethodsLoading
    : paymentLoading;
  const paymentMethodsError = isHomePage ? publicMethodsError : null;

  // Debug logging for data display
  console.log("🔍 ExchangeForm Debug:", {
    isHomePage,
    isAuthenticated,
    publicPaymentMethods: publicPaymentMethods,
    processedPaymentMethods: processedPaymentMethods,
    uniquePaymentMethods: uniquePaymentMethods,
    validPaymentMethods: validPaymentMethods,
    finalPaymentMethods: finalPaymentMethods,
    publicMethodsLoading: publicMethodsLoading,
    publicMethodsError: publicMethodsError,
    paymentMethodsLoading: paymentMethodsLoading,
    paymentMethodsError: paymentMethodsError,
    finalPaymentMethodsLength: finalPaymentMethods.length,
  });

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

  /* ------------------- Data Fetching ------------------- */
  useEffect(() => {
    // Skip API calls on home page if user is not authenticated
    if (isHomePage && !isAuthenticated) {
      console.log(
        "Skipping asset fetch: isHomePage =",
        isHomePage,
        "isAuthenticated =",
        isAuthenticated
      );
      return;
    }

    console.log(
      "Fetching exchange assets: isHomePage =",
      isHomePage,
      "isAuthenticated =",
      isAuthenticated
    );
    // Fetch assets
    dispatch(fetchAssets(false))
      .unwrap()
      .then((result) => {
        console.log("Exchange assets fetched successfully:", result);
      })
      .catch((error: unknown) => {
        console.error("Failed to fetch exchange assets:", error);
      });
  }, [dispatch, isHomePage, isAuthenticated]);

  useEffect(() => {
    // Skip API calls on home page if user is not authenticated
    if (isHomePage && !isAuthenticated) {
      return;
    }

    console.log(
      "Fetching swap assets: isHomePage =",
      isHomePage,
      "isAuthenticated =",
      isAuthenticated
    );
    // Fetch swap assets
    dispatch(fetchSupportedAssets(false))
      .unwrap()
      .then((result) => {
        console.log("Swap assets fetched successfully:", result);
      })
      .catch((error: unknown) => {
        console.error("Failed to fetch swap assets:", error);
      });
  }, [dispatch, isHomePage, isAuthenticated]);

  useEffect(() => {
    console.log(
      "Fetching payment methods: isHomePage =",
      isHomePage,
      "isAuthenticated =",
      isAuthenticated
    );

    if (isHomePage) {
      // For home page, use public payment methods (no authentication required)
      dispatch(fetchPublicPaymentMethods())
        .unwrap()
        .then((result) => {
          console.log("Public payment methods fetched successfully:", result);
        })
        .catch((error: unknown) => {
          console.error("Failed to fetch public payment methods:", error);
        });
    } else {
      // For authenticated pages, use admin payment methods
      if (!isAuthenticated) {
        return;
      }

      dispatch(fetchAdminPaymentDetails(false))
        .unwrap()
        .then((result) => {
          console.log("Payment methods fetched successfully:", result);
        })
        .catch((error: unknown) => {
          console.error("Failed to fetch payment details:", error);
        });
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
    const providerLogo = provider.logo || "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png";

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
        const providerLogo = selectedPaymentMethod.logo || "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png";
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
        const providerLogo = selectedPaymentMethod.logo || "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png";
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
        className="absolute top-full left-0 right-3 mt-2 bg-white dark:bg-[#0505F0FF] border border-gray-200 dark:border-[#35353E] rounded-xl shadow-lg z-[9999] w-full"
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
            console.log("🔍 Dropdown Render Debug:", {
              isLoading: paymentMethodsLoading,
              filteredLength: filteredPaymentProviders.length,
              filteredProviders: filteredPaymentProviders,
              paymentProviders: paymentProviders,
              paymentProvidersLength: paymentProviders.length,
              paymentSearchTerm: paymentSearchTerm,
            });

            if (paymentMethodsLoading && paymentProviders.length === 0) {
              return (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Loading payment methods...
                </div>
              );
            }

            if (filteredPaymentProviders.length === 0) {
              console.log(
                "🔍 No filtered payment providers - showing empty state"
              );
              return (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {paymentProviders.length === 0
                    ? "No payment methods available"
                    : "No payment providers found"}
                </div>
              );
            }

            console.log(
              "🔍 Rendering payment providers:",
              filteredPaymentProviders
            );

            return filteredPaymentProviders.map(
              (provider: any, index: number) => {
                const isSelected = isProviderSelected(provider);
                const fallbackLogo = "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png";
                
                return (
                  <div
                    key={provider.provider_id || index}
                    className={`p-3 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] cursor-pointer border-b border-gray-100 dark:border-[#35353E] last:border-b-0 ${
                      isSelected ? "bg-[#1D8751]/10" : ""
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
                        <div className="text-[#1F2937] dark:text-[#ffffff] font-medium flex items-center gap-2 flex-wrap">
                          <span className="truncate">{provider.provider_name}</span>
                          {isSelected && (
                            <span className="text-[#1D8751] text-sm">✓</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {provider.method_display || provider.method_name || "Payment Method"}
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
      window.addEventListener('resize', checkScreenSize);
      return () => window.removeEventListener('resize', checkScreenSize);
    }, []);
    
    const clipPath = isActive
      ? position === "first"
        ? "polygon(0 0, 94% 0, 100% 100%, 0 100%)" // express: slant on the right
        : position === "middle"
        ? "polygon(6% 0, 94% 0, 100% 100%, 0 100%)" // moneyX: slant both sides
        : "polygon(6% 0, 100% 0, 100% 100%, 0 100%)" // swap: slant on the left
      : "polygon(0 0, 100% 0, 100% 100%, 0 100%)";

    const buttonClasses = [
      "relative flex w-full items-center justify-center overflow-hidden transition-all duration-200",
      "px-3 sm:px-4 md:px-5 lg:px-6 xl:px-7 py-2 sm:py-2.5 md:py-3 lg:py-3.5 min-h-[44px] sm:min-h-[48px] md:min-h-[52px] lg:min-h-[56px]",
      isActive
        ? "bg-transparent text-white"
        : isDark
        ? "bg-[#0e1018] text-[#7C8A97]"
        : "bg-[#F4F7F6] text-[#627180]"
    ].join(" ");

    const borderColors = (() => {
      if (!isActive) return "transparent transparent transparent transparent";
      if (position === "first") return "transparent #2f323b transparent transparent"; // right only
      if (position === "middle") return "#2f323b #2f323b transparent #2f323b"; // left & right (top clipped by bg)
      return "#2f323b transparent transparent #2f323b"; // last: left only
    })();

    const labelWrapperClasses = [
      "relative z-[1] flex items-center",
      label?.trim() && variant !== "moneyx" ? "gap-1 sm:gap-2" : "gap-0",
      "text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold tracking-wide transition-colors whitespace-nowrap"
    ].join(" ");

    // For express variant in light mode, use greyish text when active
    const expressTextColorClass = variant === "express" && isActive && !isDark
      ? "text-[#788099]"
      : isActive
      ? isDark
        ? "text-white"
        : "text-[#0B1418]"
      : "text-[#727272]";
    
    const textColorClass = expressTextColorClass;

    // Use Group_9_momvgo.png for active express tab in light mode
    const expressActiveIconSrc = variant === "express" && isActive && !isDark
      ? "https://res.cloudinary.com/pitz/image/upload/v1764698096/Group_9_momvgo.png"
      : "https://res.cloudinary.com/pitz/image/upload/v1764698106/Group_8_hjhlxe.png";
    const expressInactiveIconSrc =
      "https://res.cloudinary.com/pitz/image/upload/v1764698096/Group_9_momvgo.png";

    // MoneyX icon: use green X when active in dark mode, dark X for active in light mode, dark X for inactive
    const moneyXIconSrc = isActive
      ? isDark
        ? "https://res.cloudinary.com/pitz/image/upload/v1764663236/Group_7_ichuyz.png" // green X for dark mode active
        : "https://res.cloudinary.com/pitz/image/upload/v1764661972/Group_6_ohph9q.png" // dark X for light mode active (visible on white)
      : "https://res.cloudinary.com/pitz/image/upload/v1764661972/Group_6_ohph9q.png"; // dark X for inactive

    const ariaLabel =
      variant === "express"
        ? t("marketing.exchange.tabs.express", "Express Exchange")
        : variant === "moneyx"
        ? t("marketing.exchange.tabs.moneyx", "Money X")
        : label || t("marketing.exchange.tabs.swap", "Swap");

    // Process label for moneyx variant - replace "X" with icon
    const renderLabel = () => {
      if (variant === "moneyx" && label) {
        // Replace "X" with icon (case insensitive, handles "Money X" or "Money x")
        const parts = label.split(/[Xx]/);
        if (parts.length === 2) {
          // Split into "Money" and everything after X
          return (
            <>
              <span className={`${textColorClass} text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-semibold`}>{parts[0].trim()}</span>
              <img
                src={moneyXIconSrc}
                alt="X"
                className="inline-block w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 object-contain -ml-0.5"
                style={{ verticalAlign: 'middle' }}
                onError={(e) => {
                  // Fallback if image fails to load
                  console.error('MoneyX icon failed to load:', moneyXIconSrc);
                }}
              />
            </>
          );
        }
        // Fallback if pattern doesn't match
        return <span className={textColorClass}>{label}</span>;
      }
      // Default rendering for other variants
      return label?.trim() ? <span className={textColorClass}>{label}</span> : null;
    };

    const flexGrowValue = variant === "express" || variant === "swap" ? 2 : 1.6;
    const isLast = position === "last";

    return (
      <button
        type="button"
        onClick={() => handleTabClick(id)}
        aria-pressed={isActive}
        aria-label={ariaLabel}
        className={`group flex-1 px-0 rounded-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D8751] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent`}
        style={{
          clipPath,
          flexGrow: flexGrowValue,
          flexBasis: 0,
          borderStyle: "solid",
          borderWidth: isActive ? "1px" : "0px",
          borderColor: borderColors,
        }}
      >
        <div className={buttonClasses}>
          <span className={labelWrapperClasses}>
            {renderLabel()}
            {variant === "express" && (
              <img
                src={isActive ? expressActiveIconSrc : expressInactiveIconSrc}
                alt="Express Exchange"
                className="mt-1 sm:mt-1.5 md:mt-2 ml-0 h-[1em] w-auto object-contain flex-shrink-0"
              />
            )}
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
      className={`border border-gray-300 dark:border-gray-300/20 bg-white dark:bg-transparent text-gray-900 dark:text-white w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 rounded-3xl placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1D8751] focus:border-transparent min-h-[44px] text-sm sm:text-base ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
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
              <div
                key={`${asset.asset_id || "asset"}-${asset.symbol || asset.ticker || asset.name}-${asset.network || "unknown"}-${index}`}
                className="flex items-center gap-3 p-3 text-black dark:text-white hover:bg-[#78787AFF] dark:hover:bg-[#35353E] cursor-pointer border-b border-[#A2A4A9FF] dark:border-[#35353E] last:border-b-0 min-w-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(asset);
                }}
              >
                <img
                  src={getAssetImageUrl(asset)}
                  alt={asset?.name || asset?.ticker || asset?.symbol || "Asset"}
                  className="w-6 h-6 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[#111827] dark:text-[#ffffff] font-medium flex items-center gap-2 flex-wrap">
                    <span className="truncate">
                      {(
                        asset.ticker ||
                        asset.symbol ||
                        asset.name ||
                        "Unknown"
                      ).toUpperCase()}
                    </span>
                    <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                      {getNetworkDisplayName(getAssetNetwork(asset))}
                    </span>
                  </div>
                  <div className="text-[#475569] dark:text-[#788099] text-sm truncate">
                    {(() => {
                      // Clean up asset name to remove redundant network information
                      let displayName =
                        asset.name ||
                        asset.ticker ||
                        asset.symbol ||
                        "Unknown Asset";
                      const originalName = displayName;

                      // Remove common redundant patterns - less aggressive approach
                      // Only remove redundant network info when it's duplicated in the network badge
                      displayName = displayName
                        // Handle cases like "Tether (Binance Smart Chain) (BSC)" - remove duplicate BSC
                        .replace(/\s*\(Binance Smart Chain\)\s*\(BSC\)/gi, "")
                        .replace(/\s*\(Ethereum\)\s*\(ETH\)/gi, "")
                        .replace(/\s*\(Polygon\)\s*\(MATIC\)/gi, "")
                        .replace(/\s*\(Avalanche\)\s*\(AVAX\)/gi, "")
                        .replace(/\s*\(TRON\)\s*\(TRX\)/gi, "")
                        .replace(/\s*\(Solana\)\s*\(SOL\)/gi, "")
                        // Only remove single network references if they're clearly redundant
                        .replace(/\s*\(BSC\)$/gi, "") // Only remove BSC at the end
                        .replace(/\s*\(ETH\)$/gi, "") // Only remove ETH at the end
                        .replace(/\s*\(MATIC\)$/gi, "") // Only remove MATIC at the end
                        .replace(/\s*\(AVAX\)$/gi, "") // Only remove AVAX at the end
                        .replace(/\s*\(TRX\)$/gi, "") // Only remove TRX at the end
                        .replace(/\s*\(SOL\)$/gi, "") // Only remove SOL at the end
                        .trim();

                      // Debug logging for all assets to see the pattern
                      console.log("🔍 Asset name processing:", {
                        original: originalName,
                        cleaned: displayName,
                        assetName: asset.name,
                        assetTicker: asset.ticker,
                        assetSymbol: asset.symbol,
                        assetNetwork: asset.network,
                        changed: originalName !== displayName,
                      });

                      return displayName;
                    })()}
                  </div>
                </div>
                {selectedAsset?.asset_id === asset.asset_id && (
                  <div className="w-2 h-2 bg-[#1D8751] rounded-full"></div>
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
  const renderTabs = () => (
    <div
      className="relative flex w-full overflow-hidden bg-transparent mt-0 mb-0 rounded-t-[28px] border border-[#2f323b]"
    >
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
    </div>
  );

  // If Swap Crypto tab is active, render SwapWidget with tab controls
  if (activeTab === "swap") {
    return (
      <div 
      className={`w-full mx-auto bg-white dark:bg-[#18181D] 
        rounded-2xl sm:rounded-3xl ${isHomePage ? 
          "" : ""} shadow-lg ${isDeem ? "border border-[#35353E]" : ""} ${
        isHomePage 
          ? "max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl" 
          : "max-w-none"
      }`}>
        {renderTabs()}
        <div className="mt-2 sm:mt-3 px-3 sm:px-4 md:px-5">
          <SwapWidget usePublicApi={isHomePage} />
        </div>
      </div>
    );
  }

  // If Money X tab is active, render MoneyX component
  if (activeTab === "moneyx") {
    return (
      <div 
      className={`w-full mx-auto bg-white dark:bg-[#18181D] 
        rounded-2xl sm:rounded-3xl ${isHomePage ? 
          "" : ""} shadow-lg ${isDeem ? "border border-[#35353E]" : ""} ${
        isHomePage 
          ? "max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl" 
          : "max-w-none"
      }`}>
        {renderTabs()}
        <div className="mt-2 sm:mt-3 px-3 sm:px-4 md:px-5">
          <MoneyX isHomePage={isHomePage} />
        </div>
      </div>
    );
  }

  // Default: Express Exchange tab
  return (
    <div 
    className={`w-full mx-auto bg-white dark:bg-[#18181D] 
      rounded-2xl sm:rounded-3xl ${isHomePage ? 
        "" : ""} shadow-lg ${isDeem ? "border border-[#35353E]" : ""} ${
      isHomePage 
        ? "max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl" 
        : "max-w-none"
    }`}>
      {renderTabs()}
      {/* Express Exchange Content */}

      
      <div className="mt-2 sm:mt-3 px-3 sm:px-4 md:px-5">
        <Express isHomePage={isHomePage} />
      </div>
    </div>
  );
}
