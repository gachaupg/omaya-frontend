"use client";
import React, { useState, useEffect, useRef } from "react";
import { FaBitcoin, FaUniversity } from "react-icons/fa";
import { FiChevronDown, FiInfo } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../store";
import { RootState } from "../../../store/rootReducer";
import {
  fetchAssets,
  createDeposit,
  updateDepositAddress,
} from "../../exchange/slices/exchangeSlice";
import {
  fetchSupportedAssets,
  fetchSwapEstimate,
} from "../../swap/slices/swapSlice";
import { fetchUserPaymentDetails } from "../../p2p/slices/paymentMethodsSlice";
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
import Exchanging from "../../express/components/exchnaging";

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

const RatesCalculator = () => {
  const { t } = useRatesI18n();
  const [activeTab, setActiveTab] = useState("deposit");
  const [isDepositMode, setIsDepositMode] = useState(true);

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
  const [showExchanging, setShowExchanging] = useState(false);
  const [exchangingData, setExchangingData] = useState<any>(null);

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
  console.log('estimate',estimate);
  

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

  const { userPaymentDetails, userDetailsLoading, userDetailsError } =
    useSelector((state: RootState) => state.paymentMethods);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const methodDropdownRef = useRef<HTMLDivElement>(null);

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
  }, [dispatch]);

  useEffect(() => {
    if (
      assetsDisplay.displayData &&
      assetsDisplay.displayData.length > 0 &&
      !selectedAsset
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
  }, [assetsDisplay.displayData, selectedAsset]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
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

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
    setIsMethodDropdownOpen(false);
  };

  const handleModeSwitch = () => {
    setIsDepositMode(!isDepositMode);
    // Reset transaction state when switching modes
    setIsFirstCardSubmitted(false);
    setTransactionId("");
    setResponseData(null);
    setDepositCode("");
    setWithdrawalAddress("");
    setPayoutAddress("");
    setQrCodeUrl("");
    setWalletAddress("");
    setWalletError("");
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

  // Get unique payment methods from userPaymentDetails
  const uniquePaymentMethods = Array.from(
    new Set(userPaymentDetails.map((detail: any) => detail.payment_method_name))
  ) as string[];

  // Filter user payment details based on selected payment method (for withdrawal mode)
  const filteredUserPaymentDetails = selectedPaymentMethod
    ? (userPaymentDetails || []).filter(
        (detail: any) => detail.payment_method_name === selectedPaymentMethod
      )
    : [];

  // Enhanced filtering with fallback options
  const enhancedFilteredUserPaymentDetails = selectedPaymentMethod
    ? (userPaymentDetails || []).filter((detail: any) => {
        // Try multiple possible field names for payment method
        const paymentMethodName =
          detail.payment_method_name ||
          detail.payment_provider_name ||
          detail.provider_name ||
          detail.payment_provider;

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
  const allPaymentMethods = uniquePaymentMethods.includes("Bank")
    ? uniquePaymentMethods
    : ["Bank", ...uniquePaymentMethods];

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
            className="w-6 h-6 rounded-full object-cover"
            onError={(e) => {
              logger.debug('general', "Image failed to load for asset:", asset);
              e.currentTarget.src =
                "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
            }}
          />
          <div className="flex-1">
            <div className="text-[#35353e] dark:text-[#ffffff] font-medium flex items-center gap-2">
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
            <div className="text-[#35353e] dark:text-[#788099] text-sm">
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

  const handleSubmit = async () => {
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

        showToast.success("Deposit transaction submitted successfully!");
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

      showToast.error(errorMessage);
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

  // If showing exchanging component, render it instead of the main form
  if (showExchanging && exchangingData) {
    return <Exchanging transactionData={exchangingData} />;
  }

  return (
    <div className="bg-white dark:bg-[#18181D] p-6 rounded-2xl border border-gray-200 dark:border-[#35353E] shadow-md container mx-auto">
      <div className="relative flex flex-col gap-2">
        <div className="p-2 border border-[#E8EFF5] dark:border-[#35353E] rounded-[18px]">
          <p className="mb-2">{t("rates.youSend", "You send")}</p>
          <div className="grid grid-cols-2 gap-2 mb-4 items-stretch">
            {isDepositMode ? (
              // Deposit Mode: Asset + You Send
              <>
            <div className="relative" ref={dropdownRef}>
              <label className="text-sm text-gray-600 dark:text-[#788099] mb-2 block">
                {t("rates.asset", "Asset")}
              </label>
              <div
                className="border border-[#E8EFF5] dark:border-[#35353E] p-3 rounded-[18px] flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-[#35353E] transition-colors"
                onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
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
                              logger.debug('general', 
                                "Image failed to load for selected asset:",
                                selectedAsset
                              );
                              e.currentTarget.src =
                                "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                            }}
                          />
                          <span className="text-[#35353e] dark:text-[#788099]">
                            {(
                              selectedAsset.ticker ||
                              selectedAsset.symbol ||
                              selectedAsset.name ||
                              "Unknown"
                            ).toUpperCase()}
                          </span>
                          <span className="ml-2 bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-semibold px-2 py-0.5 rounded-full">
                            {getNetworkDisplayName(
                              getAssetNetwork(selectedAsset)
                            )}
                  </span>
                        </>
                      ) : (
                        <>
                          <img
                            src="https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                            alt="asset icon"
                            className="w-6 h-6"
                          />
                          <span className="text-[#7e7e8f] dark:text-[#788099]">
                            {assetsDisplay.isLoading
                              ? "Loading assets..."
                              : "Select Asset"}
                          </span>
                        </>
                      )}
                </div>
                <FiChevronDown
                  className={`transition-transform duration-200 ${
                    isAssetDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* Asset Dropdown */}
              {isAssetDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#ffffff] dark:bg-[#1D1D23] border border-[#A2A4A9FF] dark:border-[#35353E] rounded-2xl z-50 max-h-80 overflow-hidden">
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
                      <div className="max-h-60 overflow-y-auto">
                        {renderAssetDropdown()}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-[#788099] mb-2 block">
                    {t("rates.youSend", "You Send")}
                  </label>
                  <div className="flex items-center border border-[#E8EFF5] dark:border-[#35353E] rounded-[18px]">
                    <span className="p-3 text-[#F79330]">$</span>
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => {
                        const value = e.target.value;
                        logger.debug('general', "You Send input changed:", {
                          value,
                          selectedAsset: selectedAsset?.ticker,
                        });

                        // Only allow numbers and decimals (including 0.006 format)
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setAmount(value);
                          const newAmount = parseFloat(value) || 0;
                          setIsCalculatingFromPay(true);

                          // For direct assets (USDT on BSC, USDC on BSC), calculate immediately
                          if (
                            selectedAsset &&
                            newAmount > 0 &&
                            isSimpleCalculationAsset(selectedAsset)
                          ) {
                            logger.debug('general', 
                              "Triggering immediate forward calculation for direct asset:",
                              newAmount
                            );
                            const calculatedReceiveAmount =
                              newAmount < 2
                                ? newAmount
                                : Math.max(0, newAmount - 2);
                            setReceiveAmount(
                              calculatedReceiveAmount.toFixed(2)
                            );

                            // Simple assets don't need loading states - calculation is instant
                          } else if (selectedAsset && newAmount > 0) {
                            // For complex assets, trigger API calculation
                            logger.debug('general', 
                              "Triggering API forward calculation for complex asset:",
                              newAmount
                            );

                            // Set loading states to show spinner in "I want to Receive" field
                            setIsCalculating(true);
                            setIsCalculatingReceive(true);

                            // The API calculation will be handled by the useEffect
                          } else {
                            // No calculation needed, ensure loading states are off
                            setIsCalculatingReceive(false);
                            setIsCalculating(false);
                          }
                        }
                      }}
                      onFocus={() => setIsCalculatingFromPay(true)}
                      className="bg-transparent p-3 w-full focus:outline-none text-gray-900 dark:text-white"
                      placeholder="Enter amount"
                    />
                    <div className="p-3 flex items-center text-gray-900 dark:text-white">
                      <span>USD</span>
                      <FiChevronDown className="ml-1" />
                    </div>

                    {/* Show loading spinner when calculating "I want to Receive" from "You Send" */}
                    {(isCalculating || isCalculatingReceive) &&
                      isCalculatingFromPay && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D8751]"></div>
                    </div>
                  )}
                  </div>

                  {/* Show info for non-direct assets when typing in You Send */}
                  {selectedAsset &&
                    !isSimpleCalculationAsset(selectedAsset) &&
                    isCalculatingFromPay &&
                    parseFloat(amount) > 0 && (
                      <div className="mt-2 text-xs text-[#788099]">
                        {estimateLoading
                          ? "⏳ Fetching live rate..."
                          : estimate
                            ? "✅ Using live rate"
                            : "⏳ Calculating..."}
                      </div>
                    )}
                  {estimateError &&
                    !estimateLoading &&
                    isCalculatingFromPay && (
                      <div className="flex items-center justify-between gap-2 text-[#F79330] text-sm mt-2">
                        <div className="flex items-center gap-2">
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M12 8v4m0 4h.01"
                              stroke="#F79330"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="#F79330"
                              strokeWidth="2"
                            />
                          </svg>
                          <span>{estimateError}</span>
                        </div>
                        <button
                          onClick={() => {
                            // Retry API call
                            if (parseFloat(amount) > 0) {
                              // Trigger recalculation
                              setIsCalculating(true);
                              setIsCalculatingReceive(true);
                            }
                          }}
                          className="text-[#1D8751] hover:text-[#166b3e] text-xs underline"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                </div>
              </>
            ) : (
              // Withdrawal Mode: Payment Method + You Send
              <>
                <div className="relative" ref={methodDropdownRef}>
                  <label className="text-sm text-gray-600 dark:text-[#788099] mb-2 block">
                    {t("rates.bankPaymentMethod", "Bank/Payment Method")}
                  </label>
                  <div
                    className="border border-[#E8EFF5] dark:border-[#35353E] p-3 rounded-[18px] flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-[#35353E] transition-colors"
                    onClick={() =>
                      setIsMethodDropdownOpen(!isMethodDropdownOpen)
                    }
                  >
                    <div className="flex items-center">
                      <FaUniversity />
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {selectedPaymentMethod ||
                          t("rates.selectMethod", "Select Method")}
                      </span>
                    </div>
                    <FiChevronDown
                      className={`transition-transform duration-200 ${
                        isMethodDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {/* Payment Method Dropdown */}
                  {isMethodDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1D1D23] rounded-[18px] border border-gray-200 dark:border-gray-700 z-10 max-h-60 overflow-y-auto shadow-lg">
                      {userDetailsLoading ? (
                        <div className="p-3 text-center text-gray-600 dark:text-[#788099]">
                          {t(
                            "rates.loadingMethods",
                            "Loading payment methods..."
                          )}
                        </div>
                      ) : userDetailsError ? (
                        <div className="p-3 text-center text-red-500">
                          {t(
                            "rates.errorMethods",
                            "Error loading payment methods"
                          )}
                        </div>
                      ) : allPaymentMethods.length > 0 ? (
                        allPaymentMethods.map((method: string) => (
                          <div
                            key={method}
                            className="p-3 flex items-center hover:bg-gray-100 dark:hover:bg-[#35353E] cursor-pointer transition-colors first:rounded-t-[18px] last:rounded-b-[18px]"
                            onClick={() => handlePaymentMethodSelect(method)}
                          >
                            <FaUniversity />
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                              {method}
                        </span>
                      </div>
                        ))
                      ) : (
                      <div className="p-3 text-center text-gray-600 dark:text-[#788099]">
                          {t("rates.noMethods", "No payment methods available")}
                      </div>
                    )}
                </div>
              )}
            </div>

                {/* User Payment Details Dropdown (for withdrawal mode) */}
                {selectedPaymentMethod && (
                  <div className="mt-3">
                    <label className="text-sm text-gray-600 dark:text-[#788099] mb-2 block">
                      {t("rates.registeredAccount", "Registered Account")}
                    </label>
                    {enhancedFilteredUserPaymentDetails.length > 0 ? (
                      <div className="relative">
                        <img
                          src="https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                          alt="account icon"
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none z-10"
                        />
                        <select
                          value={selectedPaymentDetail?.id || ""}
                          onChange={(e) => {
                            const selectedId = Number(e.target.value);
                            const selectedDetail = enhancedFilteredUserPaymentDetails.find(
                              (detail: any) => detail.id === selectedId
                            );
                            if (selectedDetail) {
                              setSelectedPaymentDetail(selectedDetail);
                            }
                          }}
                          className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#788099] rounded-2xl px-9 py-2 text-lg focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E] appearance-none cursor-pointer relative"
                          style={{
                            backgroundImage:
                              'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22/%3E%3C/svg%3E")',
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 8px center",
                            backgroundSize: "12px auto",
                          }}
                        >
                          <option value="">
                            {userDetailsLoading
                              ? "Loading accounts..."
                              : "Select Registered Account"}
                          </option>
                          {enhancedFilteredUserPaymentDetails.map(
                            (detail: any) => (
                              <option key={detail.id} value={detail.id}>
                                {detail.payment_provider_name || detail.provider_name} - {detail.account_number}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    ) : (
                      <p className="text-[#F79330] text-sm">
                        <button
                          type="button"
                          className="hover:underline cursor-pointer"
                        >
                          Don't have an account? Register Now
                        </button>
                      </p>
                    )}
                  </div>
                )}

            <div>
              <label className="text-sm text-gray-600 dark:text-[#788099] mb-2 block">
                    {t("rates.youSend", "You Send")}
              </label>
              <div className="flex items-center border border-[#E8EFF5] dark:border-[#35353E] rounded-[18px]">
                    <span className="p-3 text-[#F79330]">$</span>
                <input
                  type="text"
                  value={amount}
                      onChange={(e) => {
                        const value = e.target.value;
                        logger.debug('general', "You Send input changed:", {
                          value,
                          selectedAsset: selectedAsset?.ticker,
                        });

                        // Only allow numbers and decimals (including 0.006 format)
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setAmount(value);
                          const newAmount = parseFloat(value) || 0;
                          setIsCalculatingFromPay(true);

                          // For direct assets (USDT on BSC, USDC on BSC), calculate immediately
                          if (
                            selectedAsset &&
                            newAmount > 0 &&
                            isSimpleCalculationAsset(selectedAsset)
                          ) {
                            logger.debug('general', 
                              "Triggering immediate forward calculation for direct asset:",
                              newAmount
                            );
                            const calculatedReceiveAmount =
                              newAmount < 2
                                ? newAmount
                                : Math.max(0, newAmount - 2);
                            setReceiveAmount(
                              calculatedReceiveAmount.toFixed(2)
                            );

                            // Simple assets don't need loading states - calculation is instant
                          } else if (selectedAsset && newAmount > 0) {
                            // For complex assets, trigger API calculation
                            logger.debug('general', 
                              "Triggering API forward calculation for complex asset:",
                              newAmount
                            );

                            // Set loading states to show spinner in "I want to Receive" field
                            setIsCalculating(true);
                            setIsCalculatingReceive(true);

                            // The API calculation will be handled by the useEffect
                          } else {
                            // No calculation needed, ensure loading states are off
                            setIsCalculatingReceive(false);
                            setIsCalculating(false);
                          }
                        }
                      }}
                      onFocus={() => setIsCalculatingFromPay(true)}
                  className="bg-transparent p-3 w-full focus:outline-none text-gray-900 dark:text-white"
                      placeholder="Enter amount"
                />
                <div className="p-3 flex items-center text-gray-900 dark:text-white">
                  <span>USD</span>
                  <FiChevronDown className="ml-1" />
                </div>

                    {/* Show loading spinner when calculating "I want to Receive" from "You Send" */}
                    {(isCalculating || isCalculatingReceive) &&
                      isCalculatingFromPay && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D8751]"></div>
              </div>
                      )}
            </div>

                  {/* Show info for non-direct assets when typing in You Send */}
                  {selectedAsset &&
                    !isSimpleCalculationAsset(selectedAsset) &&
                    isCalculatingFromPay &&
                    parseFloat(amount) > 0 && (
                      <div className="mt-2 text-xs text-[#788099]">
                        {estimateLoading
                          ? "⏳ Fetching live rate..."
                          : estimate
                            ? "✅ Using live rate"
                            : "⏳ Calculating..."}
                      </div>
                    )}
                  {estimateError &&
                    !estimateLoading &&
                    isCalculatingFromPay && (
                      <div className="flex items-center justify-between gap-2 text-[#F79330] text-sm mt-2">
                        <div className="flex items-center gap-2">
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M12 8v4m0 4h.01"
                              stroke="#F79330"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="#F79330"
                              strokeWidth="2"
                            />
                          </svg>
                          <span>{estimateError}</span>
                        </div>
                        <button
                          onClick={() => {
                            // Retry API call
                            if (parseFloat(amount) > 0) {
                              // Trigger recalculation
                              setIsCalculating(true);
                              setIsCalculatingReceive(true);
                            }
                          }}
                          className="text-[#1D8751] hover:text-[#166b3e] text-xs underline"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Centered Swap Icon */}
        <div className="flex justify-center relative -my-5 z-10">
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#18181D] border border-[#E8EFF5] dark:border-[#35353E] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            onClick={handleModeSwitch}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Down arrow (left side) - Orange */}
              <path d="m3 16 4 4 4-4" stroke="#F79330" />
              <path d="M7 20V4" stroke="#F79330" />
              {/* Up arrow (right side) - Green */}
              <path d="m21 8-4-4-4 4" stroke="#1D8751" />
              <path d="M17 4v16" stroke="#1D8751" />
            </svg>
          </button>
        </div>

        <div className="p-2 border border-[#E8EFF5] dark:border-[#35353E] rounded-[18px]">
          <p className="mb-2">{t("rates.method", "Method")}</p>
          <div className="grid grid-cols-2 gap-2 mb-4 items-stretch">
            {isDepositMode ? (
              // Deposit Mode: Payment Method + I want to Receive
              <>
            <div className="relative" ref={methodDropdownRef}>
              <label className="text-sm text-gray-600 dark:text-[#788099] mb-2 block">
                {t("rates.bankPaymentMethod", "Bank/Payment Method")}
              </label>
              <div
                className="border border-[#E8EFF5] dark:border-[#35353E] p-3 rounded-[18px] flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-[#35353E] transition-colors"
                    onClick={() =>
                      setIsMethodDropdownOpen(!isMethodDropdownOpen)
                    }
              >
                <div className="flex items-center">
                  <FaUniversity />
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {selectedPaymentMethod ||
                      t("rates.selectMethod", "Select Method")}
                  </span>
                </div>
                <FiChevronDown
                  className={`transition-transform duration-200 ${
                    isMethodDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* Payment Method Dropdown */}
              {isMethodDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1D1D23] rounded-[18px] border border-gray-200 dark:border-gray-700 z-10 max-h-60 overflow-y-auto shadow-lg">
                  {userDetailsLoading ? (
                    <div className="p-3 text-center text-gray-600 dark:text-[#788099]">
                          {t(
                            "rates.loadingMethods",
                            "Loading payment methods..."
                          )}
                    </div>
                  ) : userDetailsError ? (
                    <div className="p-3 text-center text-red-500">
                          {t(
                            "rates.errorMethods",
                            "Error loading payment methods"
                          )}
                    </div>
                  ) : allPaymentMethods.length > 0 ? (
                    allPaymentMethods.map((method: string) => (
                      <div
                        key={method}
                        className="p-3 flex items-center hover:bg-gray-100 dark:hover:bg-[#35353E] cursor-pointer transition-colors first:rounded-t-[18px] last:rounded-b-[18px]"
                        onClick={() => handlePaymentMethodSelect(method)}
                      >
                        <FaUniversity />
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {method}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-gray-600 dark:text-[#788099]">
                      {t("rates.noMethods", "No payment methods available")}
                    </div>
                  )}
                </div>
              )}
            </div>

                <div>
              <label className="text-sm text-gray-600 dark:text-[#788099] mb-2 block">
                    {t("rates.iWantToReceive", "I want to Receive")}
              </label>
                  <div className="flex items-center border border-[#E8EFF5] dark:border-[#35353E] rounded-[18px]">
                    <span className="p-3 text-[#1D8751]">$</span>
                    <input
                      type="text"
                      value={receiveAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        logger.debug('general', "I want to Receive input changed:", {
                          value,
                          selectedAsset: selectedAsset?.ticker,
                        });

                        // Only allow numbers and decimals (including 0.006 format)
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setReceiveAmount(value);
                          const newAmount = parseFloat(value) || 0;
                          setIsCalculatingFromPay(false);

                          // For direct assets (USDT on BSC, USDC on BSC), calculate immediately
                          if (
                            selectedAsset &&
                            newAmount > 0 &&
                            isSimpleCalculationAsset(selectedAsset)
                          ) {
                            logger.debug('general', 
                              "Triggering immediate reverse calculation for direct asset:",
                              newAmount
                            );
                            const calculatedSendAmount =
                              newAmount < 2 ? newAmount : newAmount + 2;
                            setAmount(calculatedSendAmount.toFixed(2));

                            // Simple assets don't need loading states - calculation is instant
                          } else if (selectedAsset && newAmount > 0) {
                            // For complex assets, trigger API calculation
                            logger.debug('general', 
                              "Triggering API reverse calculation for complex asset:",
                              newAmount
                            );

                            // Set loading states to show spinner in "You Send" field
                            setIsCalculating(true);
                            setIsCalculatingReceive(true);

                            // The API calculation will be handled by the useEffect
                          } else {
                            // No calculation needed, ensure loading states are off
                            setIsCalculatingReceive(false);
                            setIsCalculating(false);
                          }
                        }
                      }}
                      onFocus={() => setIsCalculatingFromPay(false)}
                      className="bg-transparent p-3 w-full focus:outline-none text-gray-900 dark:text-white"
                      placeholder="Enter amount"
                    />
                    <div className="p-3 flex items-center text-gray-900 dark:text-white">
                      <span>USD</span>
                      <FiChevronDown className="ml-1" />
                    </div>

                    {/* Show loading spinner when calculating "You Send" from "I want to Receive" */}
                    {(isCalculating || isCalculatingReceive) &&
                      !isCalculatingFromPay && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D8751]"></div>
                        </div>
                      )}
                  </div>

                  {/* Show API estimate status for non-direct assets */}
                  {selectedAsset &&
                    !isSimpleCalculationAsset(selectedAsset) && (
                      <div className="mt-2">
                        {estimateLoading && !isCalculatingFromPay && (
                          <div className="flex items-center gap-2 text-[#1D8751] text-sm">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1D8751]"></div>
                            <span>Calculating ...</span>
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
                              <span>
                                Using live rate for reverse calculation
                              </span>
                    </div>
                          )}
                        {estimateError && !estimateLoading && (
                          <div className="flex items-center justify-between gap-2 text-[#F79330] text-sm">
                            <div className="flex items-center gap-2">
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  d="M12 8v4m0 4h.01"
                                  stroke="#F79330"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="#F79330"
                                  strokeWidth="2"
                                />
                              </svg>
                              <span>{estimateError}</span>
                            </div>
                            <button
                              onClick={() => {
                                // Retry API call
                                if (
                                  isCalculatingFromPay &&
                                  parseFloat(amount) > 0
                                ) {
                                  setIsCalculating(true);
                                  setIsCalculatingReceive(true);
                                } else if (
                                  !isCalculatingFromPay &&
                                  parseFloat(receiveAmount) > 0
                                ) {
                                  setIsCalculating(true);
                                  setIsCalculatingReceive(true);
                                }
                              }}
                              className="text-[#1D8751] hover:text-[#166b3e] text-xs underline"
                            >
                              Retry
                            </button>
                    </div>
                  )}
                      </div>
                    )}
                </div>
              </>
            ) : (
              // Withdrawal Mode: Asset + I want to Receive
              <>
                <div className="relative" ref={dropdownRef}>
                  <label className="text-sm text-gray-600 dark:text-[#788099] mb-2 block">
                    {t("rates.asset", "Asset")}
                  </label>
                  <div
                    className="border border-[#E8EFF5] dark:border-[#35353E] p-3 rounded-[18px] flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-[#35353E] transition-colors"
                    onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
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
                              logger.debug('general', 
                                "Image failed to load for selected asset:",
                                selectedAsset
                              );
                              e.currentTarget.src =
                                "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                            }}
                          />
                          <span className="text-[#35353e] dark:text-[#788099]">
                            {(
                              selectedAsset.ticker ||
                              selectedAsset.symbol ||
                              selectedAsset.name ||
                              "Unknown"
                            ).toUpperCase()}
                  </span>
                          <span className="ml-2 bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-semibold px-2 py-0.5 rounded-full">
                            {getNetworkDisplayName(
                              getAssetNetwork(selectedAsset)
                            )}
                          </span>
                        </>
                      ) : (
                        <>
                          <img
                            src="https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                            alt="asset icon"
                            className="w-6 h-6"
                          />
                          <span className="text-[#7e7e8f] dark:text-[#788099]">
                            {assetsDisplay.isLoading
                              ? "Loading assets..."
                              : "Select Asset"}
                          </span>
                        </>
                      )}
                </div>
                <FiChevronDown
                  className={`transition-transform duration-200 ${
                        isAssetDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

                  {/* Asset Dropdown */}
                  {isAssetDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#ffffff] dark:bg-[#1D1D23] border border-[#A2A4A9FF] dark:border-[#35353E] rounded-2xl z-50 max-h-80 overflow-hidden">
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
                      <div className="max-h-60 overflow-y-auto">
                        {renderAssetDropdown()}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-600 dark:text-[#788099] mb-2 block">
                    {t("rates.iWantToReceive", "I want to Receive")}
                  </label>
                  <div className="flex items-center border border-[#E8EFF5] dark:border-[#35353E] rounded-[18px]">
                    <span className="p-3 text-[#1D8751]">$</span>
                    <input
                      type="text"
                      value={receiveAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        logger.debug('general', "I want to Receive input changed:", {
                          value,
                          selectedAsset: selectedAsset?.ticker,
                        });

                        // Only allow numbers and decimals (including 0.006 format)
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setReceiveAmount(value);
                          const newAmount = parseFloat(value) || 0;
                          setIsCalculatingFromPay(false);

                          // For direct assets (USDT on BSC, USDC on BSC), calculate immediately
                          if (
                            selectedAsset &&
                            newAmount > 0 &&
                            isSimpleCalculationAsset(selectedAsset)
                          ) {
                            logger.debug('general', 
                              "Triggering immediate reverse calculation for direct asset:",
                              newAmount
                            );
                            const calculatedSendAmount =
                              newAmount < 2 ? newAmount : newAmount + 2;
                            setAmount(calculatedSendAmount.toFixed(2));

                            // Simple assets don't need loading states - calculation is instant
                          } else if (selectedAsset && newAmount > 0) {
                            // For complex assets, trigger API calculation
                            logger.debug('general', 
                              "Triggering API reverse calculation for complex asset:",
                              newAmount
                            );

                            // Set loading states to show spinner in "You Send" field
                            setIsCalculating(true);
                            setIsCalculatingReceive(true);

                            // The API calculation will be handled by the useEffect
                          } else {
                            // No calculation needed, ensure loading states are off
                            setIsCalculatingReceive(false);
                            setIsCalculating(false);
                          }
                        }
                      }}
                      onFocus={() => setIsCalculatingFromPay(false)}
                      className="bg-transparent p-3 w-full focus:outline-none text-gray-900 dark:text-white"
                      placeholder="Enter amount"
                    />
                    <div className="p-3 flex items-center text-gray-900 dark:text-white">
                      <span>USD</span>
                      <FiChevronDown className="ml-1" />
                    </div>

                    {/* Show loading spinner when calculating "You Send" from "I want to Receive" */}
                    {(isCalculating || isCalculatingReceive) &&
                      !isCalculatingFromPay && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D8751]"></div>
                        </div>
                      )}
                  </div>

                  {/* Show API estimate status for non-direct assets */}
                  {selectedAsset &&
                    !isSimpleCalculationAsset(selectedAsset) && (
                      <div className="mt-2">
                        {estimateLoading && !isCalculatingFromPay && (
                          <div className="flex items-center gap-2 text-[#1D8751] text-sm">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1D8751]"></div>
                            <span>Calculating ...</span>
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
                              <span>
                                Using live rate for reverse calculation
                        </span>
                      </div>
                          )}
                        {estimateError && !estimateLoading && (
                          <div className="flex items-center justify-between gap-2 text-[#F79330] text-sm">
                            <div className="flex items-center gap-2">
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  d="M12 8v4m0 4h.01"
                                  stroke="#F79330"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="#F79330"
                                  strokeWidth="2"
                                />
                              </svg>
                              <span>{estimateError}</span>
                            </div>
                            <button
                              onClick={() => {
                                // Retry API call
                                if (
                                  isCalculatingFromPay &&
                                  parseFloat(amount) > 0
                                ) {
                                  setIsCalculating(true);
                                  setIsCalculatingReceive(true);
                                } else if (
                                  !isCalculatingFromPay &&
                                  parseFloat(receiveAmount) > 0
                                ) {
                                  setIsCalculating(true);
                                  setIsCalculatingReceive(true);
                                }
                              }}
                              className="text-[#1D8751] hover:text-[#166b3e] text-xs underline"
                            >
                              Retry
                            </button>
                    </div>
                  )}
                </div>
              )}
            </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info Row */}
      <div className="flex items-start text-white text-sm mt-2 mb-4">
        <AlertCircle className="w-4 h-4 text-[#E23D3A] mr-2 mt-0.5 flex-shrink-0" />
        <span>
          {t(
            "rates.alert.estimate",
            "This is only estimated price and its based on current Market Price. We will fix the price when we receive the funds."
          )}
        </span>
      </div>

      {/* Amount & Fees */}
      <div className="border border-[#E8EFF5] dark:border-[#35353E] rounded-xl p-4 bg-transparent mb-4">
        <p className="text-[#788099] text-sm font-medium mb-2">
          {t("rates.amountAndFees", "Amount & Fees")}
        </p>
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
          <div className="flex-1 flex flex-col justify-start">
            <span className="text-white text-sm mb-2">
              {t("rates.netAmount", "Net Amount to Transfer")}
            </span>
            <div className="w-full">
              <div className="w-full bg-white dark:bg-[#35353E] border border-[#E8EFF5] rounded-2xl flex items-center px-2 py-2">
                <button className="flex-1 flex items-center justify-center bg-transparent">
                  <span className="text-[#051015] dark:text-[#BDF4D8] text-sm ml-4">
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
          <div className="flex flex-col justify-between min-w-[220px] bg-white dark:bg-[#1D1D23] border border-[#E8EFF5] dark:border-[#35353E] rounded-lg px-4 py-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#051015] dark:text-[#E8EFF5]">
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
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#051015] dark:text-[#E8EFF5]">
                {t("rates.networkFee", "Network Fee:")}
              </span>
              <span className="text-[#1D8751]">
                {selectedAsset && !isSimpleCalculationAsset(selectedAsset) && estimate?.network_fee 
                  ? `$${estimate.network_fee}` 
                  : amountNum > 0 ? `$${networkFee.toFixed(2)}` : "$0.00"}
              </span>
            </div>
            <div className="border-t border-[#E8EFF5] dark:border-[#35353E] mt-2 pt-2 flex justify-between text-sm">
              <span className="text-[#F79330] font-semibold">
                {t("rates.totalFees", "Total Fees")}
              </span>
              <span className="text-[#F79330] font-semibold">
                {selectedAsset && !isSimpleCalculationAsset(selectedAsset) && estimate?.total_fee 
                  ? `$${estimate.total_fee}` 
                  : amountNum > 0 ? `$${totalFees.toFixed(2)}` : "$0.00"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center text-[#F79330] text-lg mb-6 p-3 rounded-md">
        <FiInfo className="text-[#F79330]" />
        <p className="ml-2 text-gray-700 dark:text-gray-300">
          {t(
            "rates.feeInfo",
            "Transactions are subject to commission, above is the information on the commission rates"
          )}
        </p>
      </div>

      <div className="flex justify-center">
        <button
          className={`py-3 px-12 rounded-full font-semibold transition-colors text-white ${
            isSubmitting
              ? "bg-gray-500 cursor-not-allowed"
              : activeTab === "deposit"
                ? "bg-[#1D8751] hover:bg-opacity-90"
                : "bg-red-500 hover:bg-opacity-90"
          }`}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? t("rates.processing", "Processing...")
            : t("rates.exchangeNow", "Exchange Now")}
        </button>
      </div>

      {/* Expanded Pages - shown after first card submission */}
      {selectedPaymentDetail && isFirstCardSubmitted && (
        <>
          {/* Payment Details Card */}
          <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
            <span className="text-[#7e7e8f] dark:text-[#788099]">2-</span>{" "}
            Payment Details
          </h2>
          <div className="mt-1 mb-2 w-full flex flex-col gap-3 max-w-4xl mx-auto px-2">
            <div className="flex-1 dark:bg-[#1D1D23] rounded-2xl border border-[#39394a] dark:border-[#35353E] flex flex-col justify-between p-5 relative min-h-[120px]">
              {/* Bank and logo */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[#7e7e8f] dark:text-[#788099] text-base font-semibold">
                  Bank:
                </span>
                <div className="flex items-center gap-2">
                  <img
                    src={
                      selectedPaymentDetail.logo ||
                      "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                    }
                    alt="Bank Logo"
                    className="w-8 h-8 rounded-full object-contain"
                  />
                  <span className="text-[#35353e] dark:text-[#788099] text-base font-semibold">
                    {selectedPaymentDetail.payment_provider_name}
                  </span>
                </div>
              </div>
              <div className="border-t border-dashed border-[#39394a] mb-2"></div>
              {/* Account Name */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#7e7e8f] dark:text-[#788099] text-base font-medium">
                  Account Name :
                </span>
                <span className="text-[#35353e] dark:text-[#788099] text-base font-medium">
                  {selectedPaymentDetail.account_name}
                </span>
              </div>
              <div className="border-t border-dashed border-[#39394a] mb-2"></div>
              {/* Account Number */}
              <div className="flex items-center justify-between">
                <span className="text-[#7e7e8f] dark:text-[#788099] text-base font-medium">
                  Account Number :
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
                      showToast.success("Copied!");
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

          {/* Transaction Code Card - for deposit mode */}
          {isDepositMode && responseData && responseData.deposit_code && (
            <>
              <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
                <span className="text-[#7e7e8f] dark:text-[#788099]">3-</span>{" "}
                Transaction Code
              </h2>
              <div className="mb-6 flex flex-col gap-3 max-w-4xl mx-auto w-full px-2">
                <div className="dark:bg-[#1D1D23] border-2 border-[#35353E] rounded-2xl p-4 shadow-lg w-full text-[#35353e] dark:text-[#788099]">
                  {/* Transaction Code Row */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-3">
                    <span className="text-[#7e7e8f] dark:text-[#788099] text-base font-semibold">
                      Transaction Code:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#35353e] dark:text-[#788099] text-lg font-mono font-bold">
                        {responseData.deposit_code}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            responseData.deposit_code
                          );
                          showToast.success("Copied!");
                        }}
                        className="flex items-center gap-1 bg-[#23232b] dark:bg-[#35353E] border border-[#1D8751] text-[#1D8751] rounded-full px-4 py-1 font-semibold text-base hover:bg-[#1D8751] hover:text-[#35353e] transition-colors"
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
                        Copy
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
                        Note
                      </span>
                    </div>
                    <div className="dark:bg-[#1D1D23] border border-[#1D8751] rounded-xl p-3">
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
          <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
            <span className="text-[#7e7e8f] dark:text-[#788099]">
              {isDepositMode ? "4-" : "3-"}
            </span>
            Wallet Address
          </h2>
          <div className="flex flex-col dark:bg-[#1D1D23] border-2 border-[#35353E] rounded-2xl p-5 shadow-lg w-full max-w-4xl mx-auto text-[#35353e] dark:text-[#788099] mb-6">
            {isDepositMode ? (
              // Deposit Mode: Input field for wallet address
              <>
                <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                  Wallet/Account Address
                </label>
                <div className="flex items-center dark:bg-[#1D1D23] border border-[#39394a] dark:border-[#35353E] rounded-2xl px-4 py-2 mb-4">
                  <span className="mr-2 text-[#1D8751]">
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M7 17v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
                        stroke="#1D8751"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 7H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"
                        stroke="#1D8751"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13 7h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2"
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
                      setWalletAddress(e.target.value);
                      setWalletError("");
                    }}
                    placeholder="Enter your wallet address"
                    className="flex-1 bg-transparent text-[#35353e] dark:text-[#788099] placeholder-[#7e7e8f] focus:outline-none"
                  />
                </div>
                {walletError && (
                  <p className="text-red-500 text-sm mb-4">{walletError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={resetTransaction}
                    className="flex-1 bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProceedToExchanging}
                    disabled={
                      isSubmitting || !walletAddress.trim() || !!walletError
                    }
                    className={`flex-1 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      isSubmitting || !walletAddress.trim() || !!walletError
                        ? "bg-gray-500 cursor-not-allowed text-white"
                        : "bg-[#1D8751] hover:bg-[#166b3f] text-white"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing...</span>
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
              </>
            ) : (
              // Withdrawal Mode: Only transaction details and proceed button
              <div className="mt-6 p-1 bg-[#1D8751] bg-opacity-10 border border-[#1D8751] rounded-xl">
                <button
                  onClick={handleProceedToExchanging}
                  disabled={isSubmitting}
                  className={`w-full font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    isSubmitting
                      ? "bg-gray-500 cursor-not-allowed text-white"
                      : "bg-[#1D8751] hover:bg-[#166b3f] text-white"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
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
