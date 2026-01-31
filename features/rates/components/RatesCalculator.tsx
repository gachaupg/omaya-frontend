"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaBitcoin, FaUniversity } from "react-icons/fa";
import { FiChevronDown, FiInfo } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../store";
import { RootState } from "../../../store/rootReducer";
import { setAuthRedirectPath } from "@/lib/utils/authRedirect";
import {
  fetchAssets,
  createDeposit,
  updateDepositAddress,
} from "../../exchange/slices/exchangeSlice";
import {
  fetchSupportedAssets,
  fetchSwapEstimate,
} from "../../swap/slices/swapSlice";
import { fetchUserPaymentDetails, fetchPublicPaymentMethods } from "../../p2p/slices/paymentMethodsSlice";
import { createExpressWithdrawal } from "../../express/api";
import { Asset, DepositResponse } from "../../exchange/types";
import { SupportedAsset } from "../../swap/types";
import { ExpressWithdrawalPayload } from "../../express/types";
import { useAssetsDisplay } from "../../express/hooks/useDataDisplay";
import { AlertCircle } from "lucide-react";
import { calculateCommission } from "@/features/exchange/components/utils/calculations/commissionCalculator";
import {
  calculateNetworkFee,
  calculateTotalFees,
} from "@/features/exchange/components/utils/calculations/feeCalculator";
import { useRatesI18n } from "@/lib/useRatesI18n";
import { FaSearch } from "react-icons/fa";
import { showToast } from "@/lib/utils/toast";
import { openKYCModal } from "@/features/auth/slices/authSlice";
import Exchanging from "../../express/components/exchnaging";
import { useTheme } from "@/context/theme";
import MoneyXRates from "./MoneyXRates";
import { ClipboardPaste } from "lucide-react";
import CopyButton from "@/components/ui/CopyButton";

import { logger } from '@/lib/utils/logger';

interface UserPaymentDetail {
  id: number;
  payment_method_name: string;
  payment_provider_name: string;
  account_name: string;
  account_number: string;
}

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

interface RatesCalculatorProps {
  activeTab?: 'crypto' | 'moneyx';
}

const RatesCalculator = ({ activeTab = 'crypto' }: RatesCalculatorProps) => {
  // Debug: Log activeTab on every render
  console.log('RatesCalculator render - activeTab:', activeTab, 'type:', typeof activeTab, '=== moneyx?', activeTab === 'moneyx');

  const { t } = useRatesI18n();
  const { isDark } = useTheme();
  const router = useRouter();
  const [internalActiveTab, setInternalActiveTab] = useState("deposit");
  const [isDepositMode, setIsDepositMode] = useState(true);

  // Debug: Log activeTab changes
  useEffect(() => {
    console.log('RatesCalculator activeTab changed:', activeTab);
    console.log('Will render MoneyX?', activeTab === 'moneyx');
  }, [activeTab]);

  // Get authentication state and user (for verification check)
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const isVerified = user?.is_verified === true;

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
  const [isPasted, setIsPasted] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setWalletAddress(text);
        setWalletError("");
        setIsPasted(true);
        setTimeout(() => setIsPasted(false), 2000);
      }
    } catch (err) {
      console.error("Paste failed", err);
    }
  };
  const [showExchanging, setShowExchanging] = useState(false);
  const [exchangingData, setExchangingData] = useState<any>(null);
  const hasRestoredState = useRef(false);

  // API calculation states
  const [estimate, setEstimate] = useState<any>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCalculatingReceive, setIsCalculatingReceive] = useState(false);
  const [isCalculatingFromPay, setIsCalculatingFromPay] = useState(true);
  const [receiveAmountError, setReceiveAmountError] = useState<string | null>(
    null
  );
  console.log('estimate', estimate);


  const dispatch = useDispatch<AppDispatch>();

  // Exchange assets state
  const {
    assets: exchangeAssets,
    loading: exchangeAssetsLoading,
    error: exchangeAssetsError,
  } = useSelector((state: RootState) => state.exchange);

  // Swap assets state
  const {
    supportedAssets: swapAssets,
    loading: swapAssetsLoading,
    error: swapAssetsError,
  } = useSelector((state: RootState) => state.swap);

  // Use the data display hooks for consistent data handling
  const assetsDisplay = useAssetsDisplay(
    exchangeAssets?.assets,
    swapAssets,
    exchangeAssetsLoading,
    swapAssetsLoading,
    exchangeAssetsError,
    swapAssetsError
  );



  const {
    userPaymentDetails,
    userDetailsLoading,
    userDetailsError,
    publicPaymentMethods,
    publicMethodsLoading,
    publicMethodsError
  } = useSelector((state: RootState) => state.paymentMethods);
  const assetDropdownRef = useRef<HTMLDivElement>(null);
  const assetDropdownContentRef = useRef<HTMLDivElement | null>(null);  // dropdown panel

  const methodDropdownRef = useRef<HTMLDivElement>(null);
  const methodDropdownContentRef = useRef<HTMLDivElement | null>(null)
  console.log('publicPaymentMethods', publicPaymentMethods);
  useEffect(() => {
    // Fetch exchange assets
    dispatch(fetchAssets(false))
      .unwrap()
      .then((data) => {
        logger.debug('general', "DEBUG: Exchange assets loaded in rates calculator:", {
          hasAssets: !!data?.assets,
          assetsLength: data?.assets?.length || 0,
          totalBalance: data?.total_wallet_balance,
        });

        // If no assets in cache, force refresh
        if (!data?.assets || data.assets.length === 0) {
          logger.debug('general', "🔄 No exchange assets in cache, forcing refresh...");
          return dispatch(fetchAssets(true)).unwrap();
        }
        return data;
      })
      .catch((error: unknown) => {
        console.error(
          "Failed to fetch exchange assets from cache, trying force refresh:",
          error
        );
        // If cache fetch fails, try force refresh
        return dispatch(fetchAssets(true))
          .unwrap()
          .catch((refreshError: unknown) => {
            console.error(`Failed to fetch assets: ${refreshError}`);
            throw refreshError;
          });
      });

    // Fetch swap assets
    dispatch(fetchSupportedAssets(false))
      .unwrap()
      .catch((error: unknown) => {
        console.error("Failed to fetch swap assets:", error);
        // If cache fetch fails, try force refresh
        return dispatch(fetchSupportedAssets(true))
          .unwrap()
          .catch((refreshError: unknown) => {
            console.error(`Failed to fetch swap assets: ${refreshError}`);
            throw refreshError;
          });
      });

    // Fetch user payment details
    dispatch(fetchUserPaymentDetails());

    // Fetch public payment methods (for non-authenticated users)
    dispatch(fetchPublicPaymentMethods());
  }, [dispatch]);

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


  // Fetch estimate for non-direct assets - triggers immediately on asset or amount change
  useEffect(() => {
    logger.debug('general', "Estimate useEffect triggered:", {
      selectedAsset: selectedAsset?.ticker,
      isSimple: selectedAsset ? isSimpleCalculationAsset(selectedAsset) : null,
      amount: parseFloat(amount),
      shouldFetch:
        selectedAsset &&
        !isSimpleCalculationAsset(selectedAsset) &&
        parseFloat(amount) > 0 &&
        isCalculatingFromPay,
    });

    if (
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset) &&
      parseFloat(amount) > 0 &&
      isCalculatingFromPay
    ) {
      setEstimateLoading(true);
      setEstimateError(null);

      // Add timeout to prevent hanging API calls
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), 30000); // 30 second timeout
      });

      Promise.race([
        dispatch(
          fetchSwapEstimate({
            fromCurrency: "USDT",
            fromNetwork: "BSC",
            toCurrency: selectedAsset.ticker,
            toNetwork: getAssetNetwork(selectedAsset),
            amount: parseFloat(amount),
          })
        ),
        timeoutPromise,
      ])
        .then((result: any) => {
          if (result.payload) {
            setEstimate(result.payload);
          }

          // Clear loading states after successful calculation
          setIsCalculating(false);
          setIsCalculatingReceive(false);
        })
        .catch((error) => {
          console.error("Failed to fetch swap estimate:", error);

          // Handle different types of errors gracefully
          if (error.message?.includes("Request timeout")) {
            setEstimateError("Request timeout: Using fallback calculation");
            logger.debug('general', "Using fallback calculation due to request timeout");
          } else if (
            error.message?.includes("Network Error") ||
            error.code === "ECONNREFUSED" ||
            error.code === "ENOTFOUND"
          ) {
            setEstimateError("Network error: Using fallback calculation");
            logger.debug('general', "Using fallback calculation due to network error");
          } else if (error.message?.includes("Server Error")) {
            setEstimateError("Server error: Using fallback calculation");
            logger.debug('general', "Using fallback calculation due to server error");
          } else if (error.message?.includes("Invalid swap parameters")) {
            setEstimateError("Invalid parameters: Using fallback calculation");
          } else {
            setEstimateError("API error: Using fallback calculation");
          }

          // Common fallback calculation for all error types
          const commissionRate = selectedAsset?.range_commissions?.[0]
            ?.commission
            ? parseFloat(selectedAsset.range_commissions[0].commission)
            : 2;
          const commissionAmount = (parseFloat(amount) * commissionRate) / 100;
          const calculatedReceiveAmount = parseFloat(amount) - commissionAmount;
          setReceiveAmount(calculatedReceiveAmount.toFixed(2));

          // Clear loading states after fallback calculation
          setIsCalculating(false);
          setIsCalculatingReceive(false);
        })
        .finally(() => {
          setEstimateLoading(false);
        });
    } else {
      // Clear estimate for USDT or when conditions not met
      setEstimate(null);
      setEstimateError(null);
    }
  }, [selectedAsset, amount, isCalculatingFromPay]);

  // Fetch reverse estimate for non-direct assets when calculating from receive amount
  useEffect(() => {
    logger.debug('general', "Reverse estimate useEffect triggered:", {
      selectedAsset: selectedAsset?.ticker,
      isSimple: selectedAsset ? isSimpleCalculationAsset(selectedAsset) : null,
      receiveAmount: parseFloat(receiveAmount),
      shouldFetch:
        selectedAsset &&
        !isSimpleCalculationAsset(selectedAsset) &&
        parseFloat(receiveAmount) > 0 &&
        !isCalculatingFromPay,
    });

    if (
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset) &&
      parseFloat(receiveAmount) > 0 &&
      !isCalculatingFromPay
    ) {
      setEstimateLoading(true);
      setEstimateError(null);

      logger.debug('general', "Fetching reverse estimate for rates:", {
        fromCurrency: selectedAsset.ticker, // We're converting FROM the selected asset
        fromNetwork: getAssetNetwork(selectedAsset),
        toCurrency: "USDT", // TO USDT (since we want to know how much USDT we need)
        toNetwork: "BSC",
        amount: parseFloat(receiveAmount), // Use the receive amount directly
      });

      // Add timeout to prevent hanging API calls
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), 30000); // 30 second timeout
      });

      Promise.race([
        dispatch(
          fetchSwapEstimate({
            fromCurrency: selectedAsset.ticker, // FROM selected asset
            fromNetwork: getAssetNetwork(selectedAsset),
            toCurrency: "USDT", // TO USDT
            toNetwork: "BSC",
            amount: parseFloat(receiveAmount), // Use receive amount directly
          })
        ),
        timeoutPromise,
      ])
        .then((result: any) => {
          logger.debug('general', "Reverse estimate result:", result);
          if (result.payload && (result.payload as any)?.estimated_amount) {
            // The API now returns how much USDT we need to get the desired amount
            const requiredUsdtAmount = (result.payload as any)
              ?.estimated_amount;

            if (requiredUsdtAmount && requiredUsdtAmount > 0) {
              // Set the amount to the required USDT amount
              setAmount(requiredUsdtAmount.toString());
              setEstimate(result.payload);
              logger.debug('general', "Reverse calculation successful:", {
                desiredReceive: parseFloat(receiveAmount),
                requiredAmount: requiredUsdtAmount,
              });
            }

            // Clear loading states after successful calculation
            setIsCalculating(false);
            setIsCalculatingReceive(false);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch reverse estimate:", error);

          // Handle different types of errors gracefully
          if (error.message?.includes("Request timeout")) {
            setEstimateError("Request timeout: Using fallback calculation");
            logger.debug('general', "Using fallback calculation due to request timeout");
          } else if (
            error.message?.includes("Network Error") ||
            error.code === "ECONNREFUSED" ||
            error.code === "ENOTFOUND"
          ) {
            setEstimateError("Network error: Using fallback calculation");
            logger.debug('general', "Using fallback calculation due to network error");
          } else if (error.message?.includes("Server Error")) {
            setEstimateError("Server error: Using fallback calculation");
            logger.debug('general', "Using fallback calculation due to server error");
          } else if (error.message?.includes("Invalid swap parameters")) {
            setEstimateError("Invalid parameters: Using fallback calculation");
            logger.debug('general',
              "Using fallback calculation due to invalid API parameters"
            );
          } else {
            setEstimateError("API error: Using fallback calculation");
            logger.debug('general', "Using fallback calculation due to API error");
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

          const fallbackAmount =
            parseFloat(receiveAmount) * (1 + commissionRate / 100);
          setAmount(fallbackAmount.toString());

          // Clear loading states after fallback calculation
          setIsCalculating(false);
          setIsCalculatingReceive(false);
        })
        .finally(() => {
          setEstimateLoading(false);
        });
    }
  }, [selectedAsset, receiveAmount, isCalculatingFromPay]);

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

        if (
          (estimate as any)?.estimated_amount &&
          (estimate as any)?.estimated_amount > 0
        ) {
          setReceiveAmount((estimate as any).estimated_amount.toString());
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
    setSelectedAsset(asset);
    setIsAssetDropdownOpen(false);
  };

  const handlePaymentMethodSelect = (method: string | any) => {
    // Handle both string (old format) and provider object (new format)
    if (typeof method === 'string') {
      setSelectedPaymentMethod(method);
      setSelectedPaymentDetail(null); // Clear provider object for string method
    } else if (method?.provider_name) {
      // For provider objects, use provider_name as display name
      const displayName = method.provider_name;
      setSelectedPaymentMethod(displayName);
      // Store the selected provider object for later use (contains logo, payment_details, etc.)
      setSelectedPaymentDetail(method);
    }
    setIsMethodDropdownOpen(false);
  };

  const handleModeSwitch = () => {
    // Simply swap the positions of payment method and asset fields
    // Payment method goes down, asset comes up (and vice versa)
    setIsFieldsSwapped(!isFieldsSwapped);

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
    setShowExchanging(false);
    setExchangingData(null);
    setForceUpdate((prev) => prev + 1);
  };

  const handleProceedToExchanging = async () => {
    if (!responseData || !transactionId) {
      showToast.error("No transaction data available");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isDepositMode) {
        // For deposit mode, update the wallet address first (if provided)
        if (walletAddress.trim()) {
          try {
            const updateResponse = await dispatch(
              updateDepositAddress({
                transactionId: transactionId,
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
                  transaction_id: responseData.transaction_id || transactionId,
                  deposit_code: responseData.deposit_code || depositCode,
                });
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

      // Prepare transaction data for the exchanging page
      const transactionData = {
        type: isDepositMode ? ("deposit" as const) : ("withdrawal" as const),
        amount: amount,
        asset: {
          ...selectedAsset,
          icon:
            selectedAsset?.image_url ||
            selectedAsset?.asset_image ||
            selectedAsset?.icon_url ||
            selectedAsset?.image,
        },
        paymentDetail: selectedPaymentDetail || {
          provider_name: "direct",
          payment_method_type: "crypto",
        },
        walletAddress: isDepositMode ? walletAddress : withdrawalAddress || "",
        network: {
          network_id: getAssetNetwork(selectedAsset),
          network_type: getAssetNetwork(selectedAsset),
        },
        transactionId: transactionId,
        // Deposit-specific fields
        ...(isDepositMode && {
          depositCode: depositCode,
          totalAmountDue: responseData?.total_amount_due,
          commission: responseData?.commission,
          networkFee: responseData?.network_fee,
          currency: responseData?.currency,
          websocketUrl: responseData?.websocket_url,
          net_amount: responseData?.net_amount,
          fees: responseData?.fees,
        }),
        // Withdrawal-specific fields
        ...(!isDepositMode && {
          withdrawalAddress: withdrawalAddress,
          payoutAddress: payoutAddress,
          websocketUrl: responseData?.websocket_url,
          message: responseData?.message,
          responseType: responseData?.response_type,
          details: {
            withdrawal_address: withdrawalAddress,
            payout_address: payoutAddress,
            from_currency: responseData?.from_currency,
            to_currency: responseData?.to_currency,
            to_network: responseData?.to_network,
            estimated_amount: responseData?.estimated_amount,
            changenow_id: responseData?.changenow_id,
          },
        }),
        status: responseData?.status || "pending",
      };

      logger.debug('general',
        "Proceeding to exchanging with transaction data:",
        transactionData
      );

      // Set the exchanging data and show the exchanging component
      setExchangingData(transactionData);
      setShowExchanging(true);
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
  const publicMethodsData = publicPaymentMethods as any;

  const publicPaymentProviders = Array.isArray(publicMethodsData?.data?.providers)
    ? publicMethodsData.data.providers
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

  const availablePaymentMethods = userPaymentArray.length > 0
    ? userPaymentArray
    : publicPaymentArray;

  // Debug logging
  console.log("RatesCalculator Debug:", {
    userPaymentDetails: userPaymentDetails,
    publicPaymentMethods: publicPaymentMethods,
    publicPaymentProviders: publicPaymentProviders.length,
    userPaymentArray: userPaymentArray.length,
    publicPaymentArray: publicPaymentArray.length,
    availablePaymentMethods: availablePaymentMethods.length,
    isArray: Array.isArray(availablePaymentMethods),
    firstItem: availablePaymentMethods[0],
    firstProvider: publicPaymentProviders[0],
    paymentMethodNames: availablePaymentMethods.map(getPaymentMethodName)
  });

  const uniquePaymentMethods = Array.from(
    new Set(availablePaymentMethods.map(getPaymentMethodName).filter(Boolean))
  ).filter(method => method && typeof method === 'string' && method.trim().length > 0) as string[];

  // Filter user payment details based on selected payment method (for withdrawal mode)
  const filteredUserPaymentDetails = selectedPaymentMethod
    ? availablePaymentMethods.filter(
      (detail: any) => getPaymentMethodName(detail) === selectedPaymentMethod
    )
    : [];

  // Enhanced filtering with fallback options
  const enhancedFilteredUserPaymentDetails = selectedPaymentMethod
    ? availablePaymentMethods.filter((detail: any) => {
      // Try multiple possible field names for payment method
      const paymentMethodName = getPaymentMethodName(detail);

      return paymentMethodName === selectedPaymentMethod;
    })
    : [];

  // Auto-select first account when accounts are available for selected payment method (withdrawal mode)
  useEffect(() => {
    if (
      isDepositMode === false && // Only for withdrawal mode
      selectedPaymentMethod &&
      enhancedFilteredUserPaymentDetails.length > 0 &&
      !selectedPaymentDetail
    ) {
      logger.debug('general', "DEBUG: Auto-selecting first account for payment method:", selectedPaymentMethod);
      const firstAccount = enhancedFilteredUserPaymentDetails[0];
      setSelectedPaymentDetail(firstAccount);
    }
  }, [isDepositMode, selectedPaymentMethod, enhancedFilteredUserPaymentDetails, selectedPaymentDetail]);

  // Add "Bank" as a default option if not already present
  // Ensure all payment methods are valid strings
  const validPaymentMethods = uniquePaymentMethods.filter(method =>
    method && typeof method === 'string' && method.trim().length > 0
  );

  const allPaymentMethods = validPaymentMethods.includes("Bank")
    ? validPaymentMethods
    : ["Bank", ...validPaymentMethods];

  // Debug final payment methods
  console.log("Final Payment Methods:", {
    uniquePaymentMethods,
    validPaymentMethods,
    allPaymentMethods
  });

  // Fallback payment methods if data is corrupted
  const fallbackPaymentMethods = ["Bank Transfer", "Mobile Money", "Credit Card"];
  const finalPaymentMethods = allPaymentMethods.length > 0 && allPaymentMethods.every(method =>
    typeof method === 'string' && method.trim().length > 0
  ) ? allPaymentMethods : fallbackPaymentMethods;

  // Auto-select the first payment method when methods are available
  useEffect(() => {
    // Auto-select first provider if available (prioritize publicPaymentProviders)
    if (isDepositMode && publicPaymentProviders.length > 0 && !selectedPaymentDetail) {
      const firstProvider = publicPaymentProviders[0];
      setSelectedPaymentDetail(firstProvider);
      setSelectedPaymentMethod(
        firstProvider?.provider_name ||
        firstProvider?.payment_provider_name ||
        finalPaymentMethods[0] ||
        ""
      );
    } else if (!selectedPaymentMethod && finalPaymentMethods.length > 0) {
      const firstMethod = finalPaymentMethods[0];
      setSelectedPaymentMethod(firstMethod);

      // Try to also pick a sensible default payment detail for this method
      // Prefer public providers (for deposit mode), otherwise user payment details
      let defaultDetail: any = null;

      if (isDepositMode && publicPaymentProviders.length > 0) {
        defaultDetail =
          publicPaymentProviders.find((provider: any) => {
            const methodName =
              provider?.method?.method_name ||
              provider?.method_name ||
              provider?.provider_name ||
              null;
            return methodName === firstMethod;
          }) || publicPaymentProviders[0];
      } else if (!isDepositMode && availablePaymentMethods.length > 0) {
        defaultDetail =
          availablePaymentMethods.find(
            (detail: any) => getPaymentMethodName(detail) === firstMethod
          ) || availablePaymentMethods[0];
      }

      if (defaultDetail) {
        setSelectedPaymentDetail(defaultDetail);
      }
    }
  }, [
    selectedPaymentMethod,
    selectedPaymentDetail,
    finalPaymentMethods,
    isDepositMode,
    publicPaymentProviders,
    availablePaymentMethods,
  ]);

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
          <img
            src={
              asset?.image_url ||
              asset?.asset_image ||
              (asset as any)?.image ||
              "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
            }
            alt={asset?.name || asset?.ticker || asset?.symbol || "Asset"}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            onError={(e) => {
              logger.debug('general', "Image failed to load for asset:", asset);
              e.currentTarget.src =
                "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
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
      if (state.selectedPaymentMethod) setSelectedPaymentMethod(state.selectedPaymentMethod);

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
      const publicMethodsData = publicPaymentMethods as any;
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

    if (!selectedAsset || !selectedPaymentMethod || !selectedPaymentDetail) {
      showToast.error("Please select all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isDepositMode) {
        // Deposit API structure - same as deposit.tsx
        const formData = new FormData();
        formData.append("requested_amount", amount);

        // Wallet address is optional for initial submission
        if (selectedPaymentDetail.account_number?.trim()) {
          formData.append(
            "deposit_address",
            selectedPaymentDetail.account_number
          );
        } else {
          formData.append("deposit_address", "");
        }

        formData.append(
          "payment_provider",
          selectedPaymentDetail.payment_provider_name
        );
        formData.append(
          "payment_method",
          selectedPaymentDetail.payment_method_name
        );

        // Handle currency field - try multiple properties to get the currency value
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
          throw new Error("Currency information is missing");
        }
        formData.append("currency", currencyValue);

        // Handle network field
        const networkValue = getAssetNetwork(selectedAsset);
        if (!networkValue) {
          throw new Error("Network information is missing");
        }
        formData.append("network", networkValue);

        // Handle asset field
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
          throw new Error("Asset information is missing");
        }
        formData.append("asset", assetValue);

        formData.append(
          "additional_info",
          `Account: ${selectedPaymentDetail.account_name}`
        );
        formData.append("sent_from", selectedPaymentDetail.account_name);

        // Log the complete FormData for debugging
        logger.debug('general', "DEBUG: Complete FormData entries:");
        for (let [key, value] of formData.entries()) {
          logger.debug('general', `${key}:`, value);
        }

        // Use Redux action for deposit
        const depositResponse = (await dispatch(
          createDeposit({
            payload: formData,
            config: {
              // Don't set Content-Type manually for FormData - let axios handle it
            },
          })
        ).unwrap()) as unknown as DepositResponse;

        logger.debug('general', "DEBUG: Deposit response:", depositResponse);

        // Set transaction data
        setTransactionId(depositResponse.transaction_id || "");
        setResponseData(depositResponse);
        setDepositCode(depositResponse.deposit_code || "");
        setIsFirstCardSubmitted(true);
        setForceUpdate((prev) => prev + 1);
      } else {
        // Withdrawal API structure - same as withdrawal.tsx
        const withdrawalPayload: ExpressWithdrawalPayload = {
          asset: (selectedAsset.ticker?.toUpperCase() ||
            selectedAsset.symbol?.toUpperCase()) as string,
          amount: amount,
          network: getAssetNetwork(selectedAsset),
          user_payment_detail_id: selectedPaymentDetail.id,
        };

        logger.debug('general', "Submitting withdrawal request:", withdrawalPayload);

        // Use Redux action for withdrawal
        const withdrawalResponse =
          await createExpressWithdrawal(withdrawalPayload);

        logger.debug('general', "Withdrawal response received:", withdrawalResponse);

        // Extract response data - handle both direct response and nested data
        const responseData =
          (withdrawalResponse as any).data || (withdrawalResponse as any);

        // Set transaction data
        setTransactionId(responseData.transaction_id || responseData.id || "");
        setResponseData(responseData);
        setIsFirstCardSubmitted(true);
        setForceUpdate((prev) => prev + 1);

        // Extract addresses from response (similar to withdrawal.tsx)
        if (responseData.withdrawal_address) {
          setWithdrawalAddress(responseData.withdrawal_address);
        }
        if (responseData.payout_address) {
          setPayoutAddress(responseData.payout_address);
        }
        if (responseData.qr_code_url) {
          setQrCodeUrl(responseData.qr_code_url);
        }

        showToast.success("Withdrawal transaction submitted successfully!");
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

  if (selectedAsset && isSimpleCalculationAsset(selectedAsset)) {
    // For direct assets, only apply $2 fee if amount is $2 or more
    commissionAmount = amountNum >= 2 ? 2 : 0; // Flat $2 fee for direct assets (only if amount >= $2)
    commissionRate = amountNum > 0 ? (commissionAmount / amountNum) * 100 : 0;
  } else {
    // Use default commission rate for other assets
    commissionRate = selectedAsset?.range_commissions?.[0]?.commission
      ? parseFloat(selectedAsset.range_commissions[0].commission)
      : 2; // Default 2% commission for other assets
    commissionAmount = (amountNum * commissionRate) / 100;
  }

  const totalFees = networkFee + commissionAmount;

  const assetAmount = amountNum + totalFees;

  // If MoneyX tab is active, render MoneyX rates component (check first, after all hooks)
  if (activeTab === 'moneyx') {
    console.log('Rendering MoneyXRates component, activeTab:', activeTab);
    return <MoneyXRates />;
  }

  console.log('Rendering Crypto calculator, activeTab:', activeTab);

  // If showing exchanging component, render it instead of the main form
  if (showExchanging && exchangingData) {
    return <Exchanging transactionData={exchangingData} />;
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
                    ? "https://res.cloudinary.com/pitz/image/upload/v1755500509/Frame_36261_ledmyw.png"
                    : "https://res.cloudinary.com/pitz/image/upload/v1756579504/Frame_36261_1_d9cnq1.png"
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

                        // For direct assets, calculate immediately
                        if (
                          selectedAsset &&
                          newAmount > 0 &&
                          isSimpleCalculationAsset(selectedAsset)
                        ) {
                          const calculatedReceiveAmount =
                            newAmount < 2
                              ? newAmount
                              : Math.max(0, newAmount - 2);
                          setReceiveAmount(
                            calculatedReceiveAmount.toFixed(2)
                          );
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
                      !isSimpleCalculationAsset(selectedAsset)
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
              </div>

              {/* Conditionally render Payment Method or Asset based on isFieldsSwapped */}
              {!isFieldsSwapped ? (
                /* Bank/Payment Method Section */
                <div className="flex-1 min-w-0">
                  <label
                    className={`block text-[15px] mb-2 font-semibold ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                      }`}
                  >
                    {t("rates.bankPaymentMethod", "Bank/Payment Method")}
                  </label>
                  <div className="relative" ref={methodDropdownRef}>
                    <div
                      className={`w-full rounded-2xl px-4 py-2 text-base sm:text-lg focus:outline-none border flex items-center justify-between gap-3 cursor-pointer bg-transparent ${isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200"
                        }`}
                      onClick={() =>
                        setIsMethodDropdownOpen(!isMethodDropdownOpen)
                      }
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {selectedPaymentDetail && typeof selectedPaymentDetail === 'object' && selectedPaymentDetail.logo ? (
                          <img
                            src={selectedPaymentDetail.logo}
                            alt={selectedPaymentDetail.provider_name || 'Selected provider'}
                            className="w-8 h-8 object-contain rounded flex-shrink-0"
                          />
                        ) : (
                          <FaUniversity className="w-8 h-8 flex-shrink-0" />
                        )}
                        <span
                          className={`block truncate max-w-[140px] sm:max-w-xs ${isDark ? "text-white" : "text-[#1F2937]"}`}
                          title={selectedPaymentDetail?.payment_provider_name ||
                            selectedPaymentDetail?.provider_name ||
                            selectedPaymentMethod ||
                            t("rates.selectMethod", "Select Method")}
                        >
                          {selectedPaymentDetail?.payment_provider_name ||
                            selectedPaymentDetail?.provider_name ||
                            selectedPaymentMethod ||
                            t("rates.selectMethod", "Select Method")}
                        </span>
                      </div>
                      <FiChevronDown
                        className={`transition-transform duration-200 ${isMethodDropdownOpen ? "rotate-180" : ""
                          }`}
                      />
                    </div>

                    {/* Payment Method Dropdown */}
                    {isMethodDropdownOpen && (
                      <div className={`absolute top-full left-0 right-0 mt-1 ${isDark ? "bg-[#1D1D23]" : "bg-white"} rounded-2xl border ${isDark ? "border-[#35353E]" : "border-gray-200"} z-10 max-h-60 overflow-y-auto shadow-lg`}>
                        {(userDetailsLoading || publicMethodsLoading) ? (
                          <div className={`p-3 text-center ${isDark ? "text-[#788099]" : "text-gray-600"}`}>
                            {t("rates.loadingMethods", "Loading payment methods...")}
                          </div>
                        ) : publicPaymentProviders.length > 0 ? (
                          publicPaymentProviders.map((provider: any) => (
                            <div
                              key={provider.provider_id || provider.provider_name}
                              className={`p-3 flex items-center hover:${isDark ? "bg-[#35353E]" : "bg-gray-100"} cursor-pointer transition-colors`}
                              onClick={() => handlePaymentMethodSelect(provider)}
                            >
                              {provider.logo ? (
                                <img
                                  src={provider.logo}
                                  alt={provider.provider_name || 'Provider logo'}
                                  className="w-10 h-10 object-contain rounded mr-3 flex-shrink-0"
                                />
                              ) : (
                                <FaUniversity className="w-10 h-10 mr-3 flex-shrink-0" />
                              )}
                              <span
                                className={`truncate text-sm sm:text-base ${isDark ? "text-white" : "text-gray-900"}`}
                                title={provider.provider_name || 'Unknown Provider'}
                              >
                                {provider.provider_name || 'Unknown Provider'}
                              </span>
                            </div>
                          ))
                        ) : finalPaymentMethods.length > 0 ? (
                          finalPaymentMethods.map((method: string) => (
                            <div
                              key={method}
                              className={`p-3 flex items-center hover:${isDark ? "bg-[#35353E]" : "bg-gray-100"} cursor-pointer transition-colors`}
                              onClick={() => handlePaymentMethodSelect(method)}
                            >
                              <FaUniversity className="w-10 h-10 mr-3 flex-shrink-0" />
                              <span
                                className={`truncate text-sm sm:text-base ${isDark ? "text-white" : "text-gray-900"}`}
                                title={method}
                              >
                                {method}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className={`p-3 text-center ${isDark ? "text-[#788099]" : "text-gray-600"}`}>
                            {t("rates.noMethods", "No payment methods available")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                              src="https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
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

                        // For direct assets, calculate immediately
                        if (
                          selectedAsset &&
                          newAmount > 0 &&
                          isSimpleCalculationAsset(selectedAsset)
                        ) {
                          const calculatedSendAmount =
                            newAmount < 2 ? newAmount : newAmount + 2;
                          setAmount(calculatedSendAmount.toFixed(2));
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
                      !isSimpleCalculationAsset(selectedAsset)
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
                              src="https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
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
                /* Payment Method Section (when swapped) */
                <div className="flex-1 min-w-0">
                  <label
                    className={`block text-[15px] mb-2 font-semibold ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                      }`}
                  >
                    {t("rates.bankPaymentMethod", "Bank/Payment Method")}
                  </label>
                  <div className="relative" ref={methodDropdownRef}>
                    <div
                      className={`w-full rounded-2xl px-4 py-2 text-base sm:text-lg focus:outline-none border flex items-center justify-between gap-3 cursor-pointer bg-transparent ${isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200"
                        }`}
                      onClick={() =>
                        setIsMethodDropdownOpen(!isMethodDropdownOpen)
                      }
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {selectedPaymentDetail && typeof selectedPaymentDetail === 'object' && selectedPaymentDetail.logo ? (
                          <img
                            src={selectedPaymentDetail.logo}
                            alt={selectedPaymentDetail.provider_name || 'Selected provider'}
                            className="w-8 h-8 object-contain rounded flex-shrink-0"
                          />
                        ) : (
                          <FaUniversity className="w-8 h-8 flex-shrink-0" />
                        )}
                        <span
                          className={`block truncate max-w-[140px] sm:max-w-xs ${isDark ? "text-white" : "text-[#1F2937]"}`}
                          title={selectedPaymentDetail?.payment_provider_name ||
                            selectedPaymentDetail?.provider_name ||
                            selectedPaymentMethod ||
                            t("rates.selectMethod", "Select Method")}
                        >
                          {selectedPaymentDetail?.payment_provider_name ||
                            selectedPaymentDetail?.provider_name ||
                            selectedPaymentMethod ||
                            t("rates.selectMethod", "Select Method")}
                        </span>
                      </div>
                      <FiChevronDown
                        className={`transition-transform duration-200 ${isMethodDropdownOpen ? "rotate-180" : ""
                          }`}
                      />
                    </div>

                    {/* Payment Method Dropdown */}
                    {isMethodDropdownOpen && (
                      <div ref={methodDropdownContentRef} className={`absolute top-full left-0 right-0 mt-1 ${isDark ? "bg-[#1D1D23]" : "bg-white"} rounded-2xl border ${isDark ? "border-[#35353E]" : "border-gray-200"} z-10 max-h-60 overflow-y-auto shadow-lg`}>
                        {(userDetailsLoading || publicMethodsLoading) ? (
                          <div className={`p-3 text-center ${isDark ? "text-[#788099]" : "text-gray-600"}`}>
                            {t("rates.loadingMethods", "Loading payment methods...")}
                          </div>
                        ) : publicPaymentProviders.length > 0 ? (
                          publicPaymentProviders.map((provider: any) => (
                            <div
                              key={provider.provider_id || provider.provider_name}
                              className={`p-3 flex items-center hover:${isDark ? "bg-[#35353E]" : "bg-gray-100"} cursor-pointer transition-colors`}
                              onClick={() => handlePaymentMethodSelect(provider)}
                            >
                              {provider.logo ? (
                                <img
                                  src={provider.logo}
                                  alt={provider.provider_name || 'Provider logo'}
                                  className="w-10 h-10 object-contain rounded mr-3 flex-shrink-0"
                                />
                              ) : (
                                <FaUniversity className="w-10 h-10 mr-3 flex-shrink-0" />
                              )}
                              <span
                                className={`truncate text-sm sm:text-base ${isDark ? "text-white" : "text-gray-900"}`}
                                title={provider.provider_name || 'Unknown Provider'}
                              >
                                {provider.provider_name || 'Unknown Provider'}
                              </span>
                            </div>
                          ))
                        ) : finalPaymentMethods.length > 0 ? (
                          finalPaymentMethods.map((method: string) => (
                            <div
                              key={method}
                              className={`p-3 flex items-center hover:${isDark ? "bg-[#35353E]" : "bg-gray-100"} cursor-pointer transition-colors`}
                              onClick={() => handlePaymentMethodSelect(method)}
                            >
                              <FaUniversity className="w-10 h-10 mr-3 flex-shrink-0" />
                              <span
                                className={`truncate text-sm sm:text-base ${isDark ? "text-white" : "text-gray-900"}`}
                                title={method}
                              >
                                {method}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className={`p-3 text-center ${isDark ? "text-[#788099]" : "text-gray-600"}`}>
                            {t("rates.noMethods", "No payment methods available")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Close inner flex container */}
          </div>
        </div>
      </div>

      {/* Estimated Price Warning */}
      <div className={`flex items-start ${isDark ? "text-white" : "text-[#1F2937]"} text-xs sm:text-sm lg:text-sm mt-2 mb-4`}>
        <AlertCircle className="w-4 h-4 text-[#E23D3A] mr-2 mt-0.5 flex-shrink-0" />
        <span>
          {t(
            "rates.alert.estimate",
            "This is only estimated price and its based on current Market Price. We will fix the price when we receive the funds."
          )}
        </span>
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



      <div className="flex items-start sm:items-center text-[#F79330] text-sm sm:text-lg mb-6 p-3 rounded-md gap-2 sm:gap-0">
        <FiInfo className="text-[#F79330] flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 mt-0.5 sm:mt-0" />
        <p className="ml-0 sm:ml-2 text-gray-700 dark:text-gray-300 text-xs sm:text-base">
          {t(
            "rates.feeInfo",
            "Transactions are subject to commission, above is the information on the commission rates"
          )}
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !isVerified}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-white bg-[#1D8751] hover:bg-[#0f8f4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${(isSubmitting || !isVerified) ? "opacity-50 cursor-not-allowed" : ""
          }`}
      >
        {isSubmitting
          ? t("rates.processing", "Processing...")
          : !isVerified
            ? t("rates.verifyToContinue", "Verify account to continue")
            : t("rates.exchangeNow", "Exchange Now")}
      </button>

      {/* Expanded Pages - shown after first card submission */}
      {selectedPaymentDetail && isFirstCardSubmitted && (
        <>
          {/* Payment Details Card */}
          <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
            <span className="text-[#7e7e8f] dark:text-[#788099]">2-</span>{" "}
            {t("rates.paymentDetails", "Payment Details")}
          </h2>
          <div className="mt-1 mb-2 w-full flex flex-col gap-3 max-w-4xl mx-auto px-2">
            <div className="flex-1 dark:bg-[#1D1D23] rounded-2xl border border-[#39394a] dark:border-[#35353E] flex flex-col justify-between p-3 sm:p-5 relative min-h-[120px]">
              {/* Bank and logo */}
              <div className="flex items-center justify-between mb-4 gap-2">
                <span className="text-[#7e7e8f] dark:text-[#788099] text-sm sm:text-base font-semibold flex-shrink-0">
                  {t("rates.bankLabel", "Bank:")}
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={
                      selectedPaymentDetail.logo ||
                      "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                    }
                    alt="Bank Logo"
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-contain flex-shrink-0"
                  />
                  <span className="text-[#35353e] dark:text-[#788099] text-sm sm:text-base font-semibold truncate">
                    {selectedPaymentDetail.payment_provider_name}
                  </span>
                </div>
              </div>
              <div className="border-t border-dashed border-[#39394a] mb-2"></div>
              {/* Account Name */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-1">
                <span className="text-[#7e7e8f] dark:text-[#788099] text-sm sm:text-base font-medium flex-shrink-0">
                  {t("rates.accountNameLabel", "Account Name :")}
                </span>
                <span className="text-[#35353e] dark:text-[#788099] text-sm sm:text-base font-medium break-all">
                  {selectedPaymentDetail.account_name}
                </span>
              </div>
              <div className="border-t border-dashed border-[#39394a] mb-2"></div>
              {/* Account Number */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-[#7e7e8f] dark:text-[#788099] text-sm sm:text-base font-medium flex-shrink-0">
                  {t("rates.accountNumberLabel", "Account Number :")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#35353e] dark:text-[#788099] text-sm sm:text-base font-medium break-all">
                    {selectedPaymentDetail.account_number}
                  </span>
                  <CopyButton
                    value={selectedPaymentDetail.account_number}
                    className="text-warning hover:text-[#1D8751] transition-colors p-1 rounded"
                    showIcon={true}
                    showInlineMessage={true}
                  />
                </div>
              </div>
            </div>
          </div>

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

          {/* Wallet Address Section */}
          <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
            <span className="text-[#7e7e8f] dark:text-[#788099]">
              {isDepositMode ? "4-" : "3-"}
            </span>
            {t("rates.walletAddress", "Wallet Address")}
          </h2>
          <div className="flex flex-col dark:bg-[#1D1D23] border-2 border-border rounded-2xl p-5 shadow-lg w-full max-w-4xl mx-auto text-[#35353e] dark:text-[#788099] mb-6">
            {isDepositMode ? (
              // Deposit Mode: Input field for wallet address
              <>
                <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                  {t("rates.walletAccountAddress", "Wallet/Account Address")}
                </label>
                <div className="flex items-center dark:bg-[#1D1D23] border border-[#39394a] dark:border-[#35353E] rounded-2xl px-4 py-2 mb-4">
                 
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => {
                      setWalletAddress(e.target.value);
                      setWalletError("");
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
                      isSubmitting || !isVerified || !walletAddress.trim() || !!walletError
                    }
                    className={`flex-1 font-semibold py-2 sm:py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base ${isSubmitting || !isVerified || !walletAddress.trim() || !!walletError
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
                      <>
                        <img
                          src="https://res.cloudinary.com/pitz/image/upload/v1752429993/Express_1_ggdxth.png"
                          alt="Express"
                          className="h-4 sm:h-5 w-auto"
                        />
                        <img
                          className="mt-1 sm:mt-2 h-3 sm:h-4 w-auto"
                          src="https://res.cloudinary.com/pitz/image/upload/v1752244135/Group_5_gkxzdz.png"
                          alt="XCHANGE"
                        />
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              // Withdrawal Mode: Only transaction details and proceed button
              <div className="mt-6 p-1 bg-[#1D8751] bg-opacity-10 border border-[#1D8751] rounded-xl">
                <button
                  onClick={handleProceedToExchanging}
                  disabled={isSubmitting || !isVerified}
                  className={`w-full font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${(isSubmitting || !isVerified)
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
            )}
          </div>
        </>
      )}
    </div>

  );
};

export default RatesCalculator;
