"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
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
  fetchCommission,
  fetchExchangeCommissionLookup,
  getCommissionApiAsset,
  getExchangeLookupParams,
  isExchangeCommissionLookupAsset,
  isForexPrimusAsset,
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
import ForexWithdrawal from "../../express/components/forms/ForexWithdrawal";

import { logger } from '@/lib/utils/logger';
import { useChangeNowAssets } from "@/features/express/home/hooks/useChangeNowAssets";
import {
  RatesAssetImage,
  RATES_ASSET_ICON_FALLBACK,
  normalizeRatesAssetIconForPayload,
  pickRatesAssetImageRaw,
} from "./RatesAssetImage";

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

const isCommissionApiAsset = (asset: any) => !!getCommissionApiAsset(asset?.ticker || asset?.symbol || "");

/** Commission % via fetchCommission — crypto exchange-lookup assets use lookup; FX Primus uses legacy API only (lookup returns "no FXP rate" when unset). */
const usesLegacyPercentCommission = (asset: any) =>
  !!asset &&
  isCommissionApiAsset(asset) &&
  (!isExchangeCommissionLookupAsset(asset) || isForexPrimusAsset(asset));

/** Instant amount update without waiting on exchange / swap */
const isInstantAmountAsset = (asset: any) => usesLegacyPercentCommission(asset);

interface RatesCalculatorProps {
  activeTab?: 'crypto' | 'moneyx';
}

const RatesCalculator = ({ activeTab = 'crypto' }: RatesCalculatorProps) => {
  const { t } = useRatesI18n();
  const { isDark } = useTheme();
  const router = useRouter();
  const [internalActiveTab, setInternalActiveTab] = useState("deposit");
  const [isDepositMode, setIsDepositMode] = useState(true);

  // Get authentication state and user (for verification check)
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

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
  /** FX Primus — same as express deposit.tsx (forex account + optional notes) */
  const [forexAccountNumber, setForexAccountNumber] = useState<string>("");
  const [forexUserNotes, setForexUserNotes] = useState<string>("");

  const getValidationCurrency = (asset: any): string => {
    const ticker = String(asset?.ticker || asset?.symbol || asset?.name || "").trim();
    if (!ticker) return "usdt";
    return ticker === "USDT Tether" ? "usdt" : ticker.toLowerCase();
  };

  const validationCurrency = selectedAsset ? getValidationCurrency(selectedAsset) : undefined;
  const validationNetwork = selectedAsset
    ? String(getAssetNetwork(selectedAsset) || "bsc").toLowerCase()
    : undefined;

  /** FX Primus: same as express deposit — no crypto wallet address on this step */
  const isRatesFxpDeposit =
    isDepositMode && !!selectedAsset && isForexPrimusAsset(selectedAsset);
  /** FX Primus withdrawal: same as express withdrawal — ForexWithdrawal + forex create-exchange + forex-status WS (not createExpressWithdrawal / Exchanging). */
  const isRatesFxpWithdrawal =
    !isDepositMode && !!selectedAsset && isForexPrimusAsset(selectedAsset);

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

  // Debounce and cache for faster, fewer API calls (separate refs so forward/reverse effects never cancel each other's timeout)
  const estimateForwardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const estimateReverseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [apiCommission, setApiCommission] = useState<number | null>(null);
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
  } = useChangeNowAssets(true);

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

    // Fetch public payment methods (for non-authenticated users)
    dispatch(fetchPublicPaymentMethods());

    // Force exact public endpoint payload for rates payment methods.
    let mounted = true;
    (async () => {
      try {
        const response = await fetch("https://dev.backend.omaya.io/payments/public/payment-methods/", {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;
        const data = await response.json();
        if (mounted) setDirectPublicPaymentMethods(data);
      } catch {
        // keep redux source as fallback
      }
    })();

    // Fetch admin wallet list for fallback (like express withdrawal)
    if (isAuthenticated) {
      dispatch(fetchAdminWalletList());
      dispatch(fetchAdminPaymentDetails());
    }
    return () => {
      mounted = false;
    };
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
    const apiAsset = selectedAsset ? getCommissionApiAsset(selectedAsset.ticker || selectedAsset.symbol || "") : null;
    if (!apiAsset || !selectedAsset) {
      setApiCommission(null);
      return;
    }
    if (
      isExchangeCommissionLookupAsset(selectedAsset) &&
      !isForexPrimusAsset(selectedAsset)
    ) {
      setApiCommission(null);
      return;
    }
    const amt = isCalculatingFromPay ? (parseFloat(amount) || 0) : (parseFloat(receiveAmount) || 0);
    if (amt <= 0) {
      setApiCommission(null);
      return;
    }
    if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
    commissionFetchTimeoutRef.current = setTimeout(() => {
      fetchCommission(apiAsset, amt, isDepositMode ? "deposit" : "withdrawal")
        .then((c) => setApiCommission(c))
        .catch(() => setApiCommission(null));
    }, 300);
    return () => {
      if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
    };
  }, [selectedAsset, commissionApiDriverKey, isCalculatingFromPay, isDepositMode]);

  // Exchange commission-lookup for first assets (local_commission fee rules) — not FX Primus (backend error when unset).
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
      setApiValidationError(null);
      return;
    }

    const params = getExchangeLookupParams(selectedAsset);
    const amt = isCalculatingFromPay ? (parseFloat(amount) || 0) : (parseFloat(receiveAmount) || 0);
    if (!params || amt <= 0) {
      setExchangeLookupResponse(null);
      return;
    }

    if (exchangeLookupFetchTimeoutRef.current) clearTimeout(exchangeLookupFetchTimeoutRef.current);
    exchangeLookupFetchTimeoutRef.current = setTimeout(() => {
      fetchExchangeCommissionLookup(
        amt,
        isDepositMode ? "deposit" : "withdrawal",
        params.from_currency,
        "USD",
        params.from_network
      )
        .then((res) => {
          setExchangeLookupResponse(res);
          setApiCommission(null);
          setApiValidationError(null);

          // When calculating from "You Send", backend gives us to_amount directly.
          if (isCalculatingFromPay && res.to_amount != null) {
            const toAmount = parseFloat(res.to_amount);
            if (!Number.isNaN(toAmount)) {
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
            const minAmount = responseInner?.payload?.range?.minAmount ?? responseData?.payload?.range?.minAmount;
            setApiValidationError(
              minAmount
                ? `Amount entered is too small. Minimum amount is ${Number(minAmount).toFixed(8)}.`
                : "Amount entered is too small. Please enter a larger amount."
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

          setApiValidationError(errorMessage || "Failed to fetch exchange rate");
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
    if (!selectedAsset) return;
    if (!isExchangeCommissionLookupAsset(selectedAsset)) return;
    if (isForexPrimusAsset(selectedAsset)) return;
    if (!exchangeLookupResponse?.local_commission) return;
    if (isCalculatingFromPay) return;

    const recv = parseFloat(receiveAmount) || 0;
    if (recv <= 0) return;

    const lc = exchangeLookupResponse.local_commission;
    if (lc.commission_mode === "flat_fee" && lc.fee != null) {
      const fee = parseFloat(lc.fee);
      if (!Number.isNaN(fee)) setAmount((recv + fee).toFixed(2));
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
      const amt = parseFloat(amount) || 0;
      const calculatedReceive = Math.max(0, amt * (1 - apiCommission / 100));
      setReceiveAmount(calculatedReceive.toFixed(2));
    } else if (!isCalculatingFromPay && parseFloat(receiveAmount) > 0) {
      const recv = parseFloat(receiveAmount) || 0;
      const calculatedAmount = recv / (1 - apiCommission / 100);
      setAmount(calculatedAmount.toFixed(2));
    }
  }, [apiCommission, selectedAsset, isCalculatingFromPay, amount, receiveAmount]);

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
      parseFloat(amount) > 0 &&
      isCalculatingFromPay
    ) {
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
            }
          : {
              fromCurrency: "USDT",
              fromNetwork: "BSC",
              toCurrency: selectedAsset.ticker,
              toNetwork: getAssetNetwork(selectedAsset),
              amount: parseFloat(amount),
            };

        Promise.race([dispatch(fetchSwapEstimate(params)), timeoutPromise])
          .then((result: any) => {
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
              const minAmount =
                (error as any)?.response_data?.payload?.range?.minAmount;
              const text = minAmount
                ? `Amount entered is too small. Minimum amount is ${Number(
                    minAmount
                  ).toFixed(8)}.`
                : "Amount entered is too small. Please enter a larger amount.";
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
            setReceiveAmount((parseFloat(amount) - commissionAmount).toFixed(2));
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
      parseFloat(receiveAmount) > 0 &&
      !isCalculatingFromPay
    ) {
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
          }
        : {
            fromCurrency: selectedAsset.ticker,
            fromNetwork: getAssetNetwork(selectedAsset),
            toCurrency: "USDT",
            toNetwork: "BSC",
            amount: parseFloat(receiveAmount),
          };

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timeout")), 15000);
        });

        Promise.race([
          dispatch(fetchSwapEstimate(reverseParams)),
          timeoutPromise,
        ])
          .then((result: any) => {
            if (result.payload && (result.payload as any)?.estimated_amount) {
              const requiredAmount = (result.payload as any).estimated_amount;
              if (requiredAmount > 0) {
                setAmount(requiredAmount.toString());
                setEstimate(result.payload);
                setEstimateCache((prev) =>
                  new Map(prev).set(cacheKey, {
                    data: result.payload,
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
              const minAmount =
                (error as any)?.response_data?.payload?.range?.minAmount;
              const text = minAmount
                ? `Amount entered is too small. Minimum amount is ${Number(
                    minAmount
                  ).toFixed(8)}.`
                : "Amount entered is too small. Please enter a larger amount.";
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

            setEstimateError("Using fallback calculation");
            const recv = parseFloat(receiveAmount);
            const fallbackAmount =
              selectedAsset && isCommissionApiAsset(selectedAsset)
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

        const estAmt = (estimate as any)?.toAmount ?? (estimate as any)?.estimated_amount;
        if (estAmt && estAmt > 0) {
          setReceiveAmount(estAmt.toString());
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
    setForceUpdate((prev) => prev + 1);
  };

  const handleProceedToExchanging = async () => {
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

        const FXP_EXCHANGE_RATE = 1.06;
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
            to_currency: effectiveResponse?.to_currency,
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

  // Filter assets based on search term - search by ticker and name
  const filteredAssets =
    assetsDisplay.displayData?.filter((asset: any) => {
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

    if (sortedAssets.length > 0) {
      return sortedAssets.map((asset: any, index: number) => (
        <div
          key={`${asset.asset_id || "asset"}-${asset.symbol || asset.ticker || asset.name}-${asset.network || "unknown"}-${index}`}
          className="flex items-center gap-3 p-3 text-black dark:text-white hover:bg-[#78787AFF] dark:hover:bg-[#35353E] cursor-pointer border-b border-[#A2A4A9FF] dark:border-[#35353E] last:border-b-0"
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
            remoteUrl={
              asset?.image_url || asset?.asset_image || (asset as any)?.image
            }
            alt={asset?.name || asset?.ticker || asset?.symbol || "Asset"}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            onError={() => {
              logger.debug("general", "Image failed to load for asset:", asset);
            }}
          />
          <div className="flex-1 min-w-0">
            <div
              className="text-[#35353e] dark:text-[#ffffff] font-medium flex items-center gap-2"
              title={(
                asset.ticker ||
                asset.symbol ||
                asset.name ||
                "Unknown"
              ).toUpperCase()}
            >
              {(
                asset.ticker ||
                asset.symbol ||
                asset.name ||
                "Unknown"
              ).toUpperCase()}
              <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-semibold px-2 py-0.5 rounded-full">
                {getNetworkDisplayName(getAssetNetwork(asset))}
              </span>
            </div>
            <div
              className="text-[#35353e] dark:text-[#788099] text-sm truncate"
              title={asset.name ||
                (asset.ticker || "").toUpperCase() ||
                (asset.symbol || "").toUpperCase() ||
                "Unknown Asset"}
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
      ));
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
  useEffect(() => {
    if (hasRestoredState.current || !isAuthenticated) return;

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
    if (!isAuthenticated || !assetsDisplay.displayData || assetsDisplay.displayData.length === 0) return;
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
        const savedTicker = (state.ticker || state.symbol || "").toLowerCase().trim();
        const savedNetwork = (state.network || "").toLowerCase().trim();

        if (!savedTicker) return false;

        const assetTicker = (asset.ticker || asset.symbol || "").toLowerCase().trim();
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
    if (!isDepositMode && selectedPaymentDetails.length === 0) {
      setPaymentMethodError("Please select your registered account");
      showToast.error("Please select your registered account");
      return;
    }

    // Block pending payment methods before submitting (withdrawal only).
    // Deposit mode should not require/verify payment-method approval.
    // We key off `isFieldsSwapped` because the UI (registered account) is rendered only for withdrawal.
    if (isFieldsSwapped && selectedPaymentDetails.length > 0) {
      const status = (selectedPaymentDetails[0]?.status || "").toString().toLowerCase();
      const isPending = status !== "" && status !== "approved" && status !== "verified";
      if (isPending) {
        const msg = "Selected payment method is pending verification";
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
            network_id: null,
            user_payment_detail_id: String(withdrawalDetail?.id),
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
      let errorMessage = "Failed to submit transaction. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

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

  // Calculate fees and amounts - Network fee is always 0
  const networkFee = 0;

  // Use flat $2 fee for direct assets (USDT on BSC, USDC on BSC), percentage for other assets
  let commissionAmount = 0;
  let commissionRate = 0;

  if (
    selectedAsset &&
    isExchangeCommissionLookupAsset(selectedAsset) &&
    exchangeLookupResponse?.local_commission
  ) {
    const lc = exchangeLookupResponse.local_commission;
    if (lc.commission_mode === "flat_fee") {
      const fee = lc.fee != null ? parseFloat(lc.fee) : 0;
      commissionAmount = Number.isNaN(fee) ? 0 : fee;
      commissionRate = amountNum > 0 ? (commissionAmount / amountNum) * 100 : 0;
    } else if (lc.commission_mode === "percentage") {
      const rate = lc.rate != null ? parseFloat(lc.rate) : 0;
      commissionRate = Number.isNaN(rate) ? 0 : rate;
      commissionAmount = (amountNum * commissionRate) / 100;
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
    if (isForexPrimusAsset(selectedAsset) && apiCommission == null) {
      commissionRate = 0;
      commissionAmount = 0;
    } else {
      commissionRate = apiCommission ?? 2;
      commissionAmount = (amountNum * commissionRate) / 100;
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
  }

  const totalFees = networkFee + commissionAmount;

  const assetAmount = amountNum + totalFees;

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
    return <MoneyXRates commissionType={isDepositMode ? "deposit" : "withdrawal"} />;
  }

  return (
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
            <div className={`text-sm mb-4 font-semibold flex items-center gap-2 ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"}`}>
              {t("rates.youSend", "You Send")}
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
                      logger.debug('general', "You Send input changed:", {
                        value,
                        selectedAsset: selectedAsset?.ticker,
                      });

                      // Only allow numbers and decimals
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        setAmount(value);
                        const newAmount = parseFloat(value) || 0;
                        setIsCalculatingFromPay(true);

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
                {apiValidationError && (
                  <div className="mt-2 text-xs text-red-500">
                    {apiValidationError}
                  </div>
                )}
              </div>

              {/* Conditionally render Payment Method or Asset based on isFieldsSwapped */}
              {!isFieldsSwapped ? (
                /* Bank/Payment Method Section - exact as express withdrawal */
                <div className="flex-1 min-w-0">
                  <label className={`block text-[15px] mb-2 font-semibold ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"}`}>
                    {t("rates.bankPaymentMethod", "Bank/Payment Method")}
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
                          logoClassName={PAYMENT_LOGO_BASE_CLASS}
                          sizeMode="card"
                          onChange={(value) => {
                            const selectedProvider = publicPaymentProviders.find((p: any) => (p.provider_name || p.payment_provider_name) === value);
                            setPayBank(value);
                            setSelectedProviderData(selectedProvider);
                            setSelectedPaymentDetail(selectedProvider || null);
                            setSelectedPaymentDetails([]);
                            setPaymentMethodError(null);
                          }}
                          placeholder={isLoading ? "Loading payment methods..." : paymentMethodOptions.length > 0 ? "Select Payment Method" : "No payment methods available"}
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
                          className={`block text-[17px] font-semibold ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"}`}
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
                                  const status = (detail?.status || "")
                                    .toString()
                                    .toLowerCase();
                                  const isPending =
                                    status !== "" && status !== "approved" && status !== "verified";
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
                                    label: isPending ? `${displayLabel} (Pending)` : displayLabel,
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
                                logoClassName={PAYMENT_LOGO_BASE_CLASS}
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
                          const status = (selectedPaymentDetails[0]?.status || "")
                            .toString()
                            .toLowerCase();
                          return (
                            status !== "" &&
                            status !== "approved" &&
                            status !== "verified"
                          );
                        })() && (
                          <div className="mb-3 flex items-start gap-3 p-4 rounded-2xl bg-[#F79330]/10 border border-[#F79330]/40">
                            <svg className="w-5 h-5 text-[#F79330] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-[#F79330]">Account Pending Approval</p>
                              <p className="text-xs text-[#F79330]/80 mt-1">
                                Your account is pending approval. Please contact support to get it approved.
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
                    className={`block text-[15px] mb-2 font-semibold ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                      }`}
                  >
                    {t("rates.provider", "Provider")}
                  </label>
                  <div className="relative" ref={assetDropdownRef}>
                    <div
                      className={`w-full rounded-2xl px-4 py-2 text-base sm:text-lg focus:outline-none border flex items-center justify-between gap-3 cursor-pointer bg-transparent ${isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200"
                        }`}
                      onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {selectedAsset ? (
                          <>
                            <RatesAssetImage
                              remoteUrl={
                                selectedAsset?.image_url ||
                                selectedAsset?.asset_image ||
                                (selectedAsset as any)?.image
                              }
                              alt={
                                selectedAsset?.name ||
                                selectedAsset?.ticker ||
                                selectedAsset?.symbol ||
                                "Asset"
                              }
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}
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
                                  className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-semibold px-2 py-0.5 rounded-full"
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
                              className="w-8 h-8 flex-shrink-0"
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
            <div className={`text-sm mb-4 font-semibold flex items-center gap-2 ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"}`}>
              {t("rates.youGet", "You Get")}
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
                    onChange={(e) => {
                      const value = e.target.value;
                      logger.debug('general', "You Get input changed:", {
                        value,
                        selectedAsset: selectedAsset?.ticker,
                      });

                      // Only allow numbers and decimals
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        setReceiveAmount(value);
                        const newAmount = parseFloat(value) || 0;
                        setIsCalculatingFromPay(false);

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
                          const commissionRate = apiCommission ?? 2;
                          const calculatedSendAmount = newAmount / (1 - commissionRate / 100);
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
                  <label
                    className={`block text-[15px] mb-2 font-semibold ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                      }`}
                  >
                    {t("rates.provider", "Provider")}
                  </label>
                  <div className="relative" ref={assetDropdownRef}>
                    <div
                      className={`w-full rounded-2xl px-4 py-2 text-base sm:text-lg focus:outline-none border flex items-center justify-between gap-3 cursor-pointer bg-transparent ${isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200"
                        }`}
                      onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {selectedAsset ? (
                          <>
                            <RatesAssetImage
                              remoteUrl={
                                selectedAsset?.image_url ||
                                selectedAsset?.asset_image ||
                                (selectedAsset as any)?.image
                              }
                              alt={
                                selectedAsset?.name ||
                                selectedAsset?.ticker ||
                                selectedAsset?.symbol ||
                                "Asset"
                              }
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}
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
                                  className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-semibold px-2 py-0.5 rounded-full"
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
                              className="w-8 h-8 flex-shrink-0"
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
                  <label className={`block text-[15px] mb-2 font-semibold ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"}`}>
                    {t("rates.bankPaymentMethod", "Bank/Payment Method")}
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
                          logoClassName={PAYMENT_LOGO_BASE_CLASS}
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
                          placeholder={isLoading ? "Loading payment methods..." : "Select Payment Method"}
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
                        <label className={`block text-sm font-semibold ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"}`}>
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

                          return (
                            <span
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-[#F79330]/40 bg-[#F79330]/10 text-[#F79330]"
                              title="Account pending approval"
                            >
                              Pending Registered Account
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
                              logoClassName={PAYMENT_LOGO_BASE_CLASS}
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
                    {t(
                      "rates.amountIncludingFees",
                      "Amount including Total Fees"
                    )}
                  </span>
                  <span className="bg-[#1D8751] text-white text-lg font-semibold rounded-full px-8 py-1 ml-2">
                    ${selectedAsset && !isSimpleCalculationAsset(selectedAsset) && estimate?.user_amount
                      ? estimate.user_amount.toFixed(2)
                      : amountNum > 0 ? amountNum.toFixed(2) : estimate?.user_amount ? estimate.user_amount.toFixed(2) : estimate?.total_fee ? `$${estimate.total_fee}` : "0.00"}
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
                  : amountNum > 0 ? `${commissionRate.toFixed(1)}%` : "0%"}
              </span>
              <span className="text-[#1D8751]">
                {selectedAsset && !isSimpleCalculationAsset(selectedAsset) && estimate?.total_fee
                  ? `$${estimate.total_fee}`
                  : amountNum > 0 ? `$${commissionAmount.toFixed(2)}` : "$0.00"}
              </span>
            </div>
            <div className={`border-t ${isDark ? "border-[#35353E]" : "border-[#E8EFF5]"} mt-2 pt-2 flex justify-between text-sm`}>
              <span className="text-[#F79330] font-semibold">
                {t("rates.totalFees", "Total Fees")}
              </span>
              <span className="text-[#F79330] font-semibold">
                {selectedAsset && !isSimpleCalculationAsset(selectedAsset) && estimate?.total_fee
                  ? `$${estimate.total_fee}`
                  : amountNum > 0 ? `$${commissionAmount.toFixed(2)}` : "$0.00"}
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
          disabled={isSubmitting}
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
                    className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff] rounded-2xl px-4 py-2 text-lg focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E]"
                  />
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
                      !walletAddress.trim() ||
                      !!walletError ||
                      isWalletValidating
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

                <div className="mt-2 p-1 bg-[#1D8751] bg-opacity-10 border border-[#1D8751] rounded-xl">
                  <button
                    onClick={handleProceedToExchanging}
                    disabled={isSubmitting}
                    className={`w-full font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${(isSubmitting)
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
                      <>
                        <img
                          src="https://res.cloudinary.com/pitz/image/upload/v1752429993/Express_1_ggdxth.png"
                          alt=""
                        />
                        <img
                          className="mt-2"
                          src="https://res.cloudinary.com/pitz/image/upload/v1752244135/Group_5_gkxzdz.png"
                          alt=""
                        />
                      </>
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
    </div>
  );
};

export default RatesCalculator;
