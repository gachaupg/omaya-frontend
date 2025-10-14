"use client";
import React, { useEffect, useState, useRef } from "react";
import { FaExchangeAlt, FaExclamationCircle } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../../store";
import {
  fetchAdminPaymentDetails,
  fetchUserPaymentDetails,
  fetchAdminWalletList,
} from "../../../exchange/slices/paymentSlice";
import { fetchAssets } from "../../../exchange/slices/exchangeSlice";
import { createDeposit } from "../../../exchange/slices/exchangeSlice";
import {
  fetchSupportedAssets,
  fetchSwapEstimate,
} from "../../../swap/slices/swapSlice";
import { validateWalletAddress } from "../../../../lib/addressValidaion";
import { showToast } from "../../../../lib/utils/toast";
import { DepositResponse } from "../../../exchange/types";
import { SupportedAsset } from "../../../swap/types";
import { FaSearch } from "react-icons/fa";
import { createExpressWithdrawal } from "../../api";
import {
  ExpressWithdrawalPayload,
  ExpressWithdrawalResponse,
} from "../../types";
import PaymentMethodsModal from "../../../p2p/components/ui/p2pdashboard/sections/PaymentMethodsModal";
import InfoModal from "./info";
import { debugAssetFetching } from "../../../../lib/utils/debugAssets";
import { useAssetsDisplay, usePaymentMethodsDisplay } from "../../hooks/useDataDisplay";

// Add UserPaymentDetail interface
interface UserPaymentDetail {
  id: number;
  payment_provider_name: string;
  payment_method_name: string;
  account_name: string;
  account_number: string;
  wallet_address?: string;
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
}: {
  userPaymentDetails: UserPaymentDetail[];
  onSelect: (detail: UserPaymentDetail) => void;
  onRemove: (detail: UserPaymentDetail) => void;
  selectedDetails: UserPaymentDetail[];
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
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  isSelected
                    ? "border-[#1D8751] bg-[#1D8751]/10"
                    : "border-[#A2A4A9FF] bg-[#A2A4A9FF]"
                }`}
              >
                <div className="flex-1">
                  <div className="text-white font-medium">
                    {detail.payment_provider_name ||
                      detail.provider_name ||
                      "Unknown Provider"}{" "}
                    - {detail.payment_method_name || "Unknown Method"}
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isSelected
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
}: DepositFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { adminPaymentDetails, adminWalletList, loading, error } = useSelector(
    (state: any) => state.payment
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

  // Use the data display hooks for consistent data handling
  const assetsDisplay = useAssetsDisplay(
    assets?.assets,
    swapAssets,
    assetsLoading,
    swapAssetsLoading,
    null, // exchange error
    swapAssetsError
  );

  // Add user payment details state
  const { userPaymentDetails, loading: userPaymentLoading } = useSelector(
    (state: any) => state.payment
  );

  const paymentMethodsDisplay = usePaymentMethodsDisplay(
    adminPaymentDetails,
    loading,
    error
  );

  const userPaymentMethodsDisplay = usePaymentMethodsDisplay(
    userPaymentDetails,
    userPaymentLoading,
    null
  );

  // Debug logging for assets
  console.log("DEBUG: Swap assets state:", {
    swapAssets,
    swapAssetsLoading,
    swapAssetsError,
    assetsLength: swapAssets?.length || 0,
  });

  // Debug function to test asset fetching
  const handleDebugAssets = async () => {
    try {
      console.log("=== Starting debug asset fetch for express withdrawal ===");
      console.log("Current exchange assets:", assets);
      console.log("Current swap assets:", swapAssets);
      
      // Force refresh both asset types
      console.log("🔄 Force refreshing exchange assets...");
      await dispatch(fetchAssets(true)).unwrap();
      
      console.log("🔄 Force refreshing swap assets...");
      await dispatch(fetchSupportedAssets(true)).unwrap();
      
      console.log("✅ Assets force refreshed");
    } catch (error) {
      console.error("Debug failed:", error);
    }
  };

  // Force refresh assets
  const handleForceRefreshAssets = async () => {
    try {
      console.log("=== Force refreshing assets ===");
      await dispatch(fetchSupportedAssets(true)).unwrap();
      console.log("✅ Assets force refreshed");
    } catch (error) {
      console.error("❌ Force refresh failed:", error);
    }
  };

  const [payAmount, setPayAmount] = useState(100);
  const [payBank, setPayBank] = useState("");
  const [getAmount, setGetAmount] = useState(0);
  const [payAmountInput, setPayAmountInput] = useState("100");
  const [getAmountInput, setGetAmountInput] = useState("0");
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
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
  const paymentDetailsRef = useRef<HTMLDivElement>(null);
  // Asset selection state for search functionality
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [assetSearchTerm, setAssetSearchTerm] = useState("");
  const assetDropdownRef = useRef<HTMLDivElement>(null);

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

  // Add calculation error state for display below "You Send" input
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Add API validation error state for display below "You will receive" input
  const [apiValidationError, setApiValidationError] = useState<string | null>(
    null
  );

  // Filter user payment details based on selected payment type
  // Match payment_method_name from user payment details with payment_type from admin wallet list
  const filteredUserPaymentDetails = payBank
    ? (userPaymentDetails || []).filter(
        (detail: any) => detail.payment_method_name === payBank
      )
    : [];

  // Enhanced filtering with fallback options
  const enhancedFilteredUserPaymentDetails = payBank
    ? (userPaymentDetails || []).filter((detail: any) => {
        // Match payment_method_name with selected payment_type
        const paymentMethodName =
          detail.payment_method_name ||
          detail.payment_method ||
          detail.method_name;

        return paymentMethodName === payBank;
      })
    : [];

  // Auto-select first account when accounts are available for selected payment type
  useEffect(() => {
    if (
      payBank &&
      enhancedFilteredUserPaymentDetails.length > 0 &&
      selectedPaymentDetails.length === 0
    ) {
      console.log("DEBUG: Auto-selecting first account for payment type:", payBank);
      const firstAccount = enhancedFilteredUserPaymentDetails[0];
      setSelectedPaymentDetails([firstAccount]);
    }
  }, [payBank, enhancedFilteredUserPaymentDetails, selectedPaymentDetails]);

  // Track isTransactionSubmitted changes
  useEffect(() => {
    // Force a re-render when isTransactionSubmitted changes
    if (isTransactionSubmitted) {
      setForceUpdate((prev) => prev + 1);
    }
  }, [isTransactionSubmitted, withdrawalAddress, qrCodeUrl, responseMessage]);

  // Monitor wallet section visibility
  useEffect(() => {}, [
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
    // Try to fetch from cache first, then API if needed
    dispatch(fetchAdminPaymentDetails(false)) // false = don't force refresh
      .unwrap()
      .then((data) => {
        // console.log("DEBUG: Admin payment details fetched:", data);
      })
      .catch((error: unknown) => {
        showToast.error(`Failed to fetch admin payment details: ${error}`);
      });
  }, [dispatch]);

  // Fetch admin wallet list
  useEffect(() => {
    console.log("DEBUG: Starting to fetch admin wallet list...");
    dispatch(fetchAdminWalletList(false))
      .unwrap()
      .then((data) => {
        console.log("DEBUG: Admin wallet list loaded in express withdrawal:", {
          hasData: !!data,
          count: data?.count || 0,
          resultsLength: data?.results?.length || 0
        });
        
        // If no data in cache, force refresh
        if (!data || !data.results || data.results.length === 0) {
          console.log("🔄 No admin wallet list in cache, forcing refresh...");
          return dispatch(fetchAdminWalletList(true)).unwrap();
        }
        return data;
      })
      .catch((error: unknown) => {
        console.error("Failed to fetch admin wallet list from cache, trying force refresh:", error);
        // If cache fetch fails, try force refresh
        return dispatch(fetchAdminWalletList(true))
          .unwrap()
          .catch((refreshError: unknown) => {
            showToast.error(`Failed to fetch admin wallet list: ${refreshError}`);
            throw refreshError;
          });
      });
  }, [dispatch]);

  useEffect(() => {
    // First try to get from cache, then force refresh if no data
    dispatch(fetchAssets(false))
      .unwrap()
      .then((data) => {
        console.log("DEBUG: Exchange assets loaded in express withdrawal:", {
          hasAssets: !!data?.assets,
          assetsLength: data?.assets?.length || 0,
          totalBalance: data?.total_wallet_balance
        });
        
        // If no assets in cache, force refresh
        if (!data?.assets || data.assets.length === 0) {
          console.log("🔄 No exchange assets in cache, forcing refresh...");
          return dispatch(fetchAssets(true)).unwrap();
        }
        return data;
      })
      .catch((error: unknown) => {
        console.error("Failed to fetch exchange assets from cache, trying force refresh:", error);
        // If cache fetch fails, try force refresh
        return dispatch(fetchAssets(true))
          .unwrap()
          .catch((refreshError: unknown) => {
            showToast.error(`Failed to fetch assets: ${refreshError}`);
            throw refreshError;
          });
      });
  }, [dispatch]);

  // Fetch user payment details
  useEffect(() => {
    // Try to fetch from cache first, then API if needed
    dispatch(fetchUserPaymentDetails(false)) // false = don't force refresh
      .unwrap()
      .catch((error: unknown) => {
        showToast.error(`Failed to fetch user payment details: ${error}`);
      });
  }, [dispatch]);

  // Fetch swap assets
  useEffect(() => {
    console.log("DEBUG: Starting to fetch swap assets...");
    dispatch(fetchSupportedAssets(false))
      .unwrap()
      .then((data) => {
        console.log("DEBUG: Swap assets loaded in express withdrawal:", {
          hasAssets: !!data,
          assetsLength: data?.length || 0
        });
        
        // If no assets in cache, force refresh
        if (!data || data.length === 0) {
          console.log("🔄 No swap assets in cache, forcing refresh...");
          return dispatch(fetchSupportedAssets(true)).unwrap();
        }
        return data;
      })
      .catch((error: unknown) => {
        console.error("Failed to fetch swap assets from cache, trying force refresh:", error);
        // If cache fetch fails, try force refresh
        return dispatch(fetchSupportedAssets(true))
          .unwrap()
          .catch((refreshError: unknown) => {
            console.error("Failed to fetch swap assets even with force refresh:", refreshError);
            
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
            
            // Update the Redux store with fallback assets
            dispatch({
              type: "swap/fetchSupportedAssets/fulfilled",
              payload: fallbackAssets
            });
            
            throw refreshError;
          });
      });
  }, [dispatch]);

  // Auto-select first asset and calculate received amount when assets are loaded
  useEffect(() => {
    if (assetsDisplay.shouldShowData && assetsDisplay.displayData.length > 0 && !selectedAsset) {
      // Sort assets to get USDT on BSC first, then USDC on BSC, then others
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
      console.log("Auto-selecting first asset:", firstAsset);
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
    console.log("Selected asset changed:", selectedAsset);
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
        console.log("Asset changed to simple asset, calculating immediately");
        // For simple assets, calculate immediately
        calculateAmounts(payAmount, true);
      } else {
        console.log("Asset changed to non-simple asset, going to API");
        // For non-simple assets, the estimate useEffect will handle the API call
        // Just set loading states for visual feedback
        setIsCalculating(true);
        setIsCalculatingReceive(true);
        setEstimateLoading(true);
      }
    }
  }, [selectedAsset]);

  // Handle estimate updates and trigger recalculation - ONLY for forward calculations
  useEffect(() => {
    console.log("Estimate effect triggered:", {
      hasEstimate: !!estimate,
      estimateLoading,
      isCalculatingFromPay,
      payAmount,
      estimateAmount: estimate?.toAmount || estimate?.estimated_amount,
      apiValidationError,
    });

    // Only handle forward calculations (when calculating from pay amount)
    if (estimate && !estimateLoading && isCalculatingFromPay && payAmount > 0) {
      const estimateAmount = estimate.toAmount || estimate.estimated_amount;
      console.log(
        "Estimate received, updating receive amount:",
        estimateAmount
      );

      // Check if estimate has a valid amount
      if (
        estimateAmount !== undefined &&
        estimateAmount !== null &&
        !isNaN(estimateAmount)
      ) {
        // Estimate has been received, update the receive amount
        const finalAmount = Math.max(0, estimateAmount);
        setGetAmount(finalAmount);
        setGetAmountInput(finalAmount.toString());

        const validationError = validateReceiveAmount(
          finalAmount,
          selectedAsset
        );
        setReceiveAmountError(validationError);

        if (finalAmount > 15000) {
          setIsInfoModalOpen(true);
        }

        // Clear loading states
        setIsCalculating(false);
        setIsCalculatingReceive(false);
      } else {
        // Estimate is invalid, keep loading state until we get a valid estimate
        console.log("DEBUG: Invalid estimate received, keeping loading state");
        setGetAmount(0);
        setGetAmountInput("");
        if (!apiValidationError) {
          if (!apiValidationError) {
            setReceiveAmountError("Calculating..."); // Show immediate feedback
          }
        }
        // Keep loading states active
      }
    } else if (
      estimateLoading &&
      isCalculatingFromPay &&
      payAmount > 0 &&
      !apiValidationError
    ) {
      // Keep field empty during loading - no intermediate estimates
      if (selectedAsset && !isSimpleCalculationAsset(selectedAsset)) {
        // Keep field completely empty during calculation
        setGetAmount(0);
        setGetAmountInput("");
        if (!apiValidationError) {
          if (!apiValidationError) {
            setReceiveAmountError("Calculating..."); // Show immediate feedback
          }
        }
      }
      // Set loading states for visual feedback
      console.log("Setting loading states in estimate useEffect");
      setIsCalculating(true);
      setIsCalculatingReceive(true);
    } else if (
      !estimate &&
      !estimateLoading &&
      isCalculatingFromPay &&
      payAmount > 0 &&
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset) &&
      !apiValidationError
    ) {
      // No estimate available but we're calculating from pay - keep loading
      console.log("DEBUG: No estimate available, keeping loading state");
      setGetAmount(0);
      setGetAmountInput("");
      if (!apiValidationError) {
        setReceiveAmountError("Calculating..."); // Show immediate feedback
      }
      // Keep loading states active
    }
  }, [
    estimate,
    estimateLoading,
    isCalculatingFromPay,
    payAmount,
    selectedAsset,
    apiValidationError,
  ]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        assetDropdownRef.current &&
        !assetDropdownRef.current.contains(event.target as Node)
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
    return (ticker === "usdt" && network === "bsc") || 
           (ticker === "usdc" && network === "bsc");
  };

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
    return ticker === "usdt" || ticker === "usdc" ? 100 : 0.001;
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
      payAmount &&
      payAmount > 0 &&
      isCalculatingFromPay // Only fetch estimate when calculating from pay amount
    ) {
      // Check cache first - if found and valid, use immediately without any loading states
      const cacheKey = `${selectedAsset.ticker?.toUpperCase()}_${selectedAsset.network}_${payAmount}`;
      const cachedEntry = estimateCache.get(cacheKey);

      if (cachedEntry && isCacheValid(cachedEntry.timestamp)) {
        console.log("Using cached estimate:", cachedEntry.data);
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

      // Debounce the API call to prevent too many requests (increased to 300ms for better performance)
      const debounceTimeout = setTimeout(() => {
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.log(
            "DEBUG: Estimate request timed out, keeping loading state"
          );
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

        // Use the actual fetchSwapEstimate API call for deposit
        // Note: fromCurrency is the selected asset, toCurrency is always "USDT" for deposits
        console.log("Fetching estimate for deposit:", {
          toCurrency: "USDT",
          toNetwork: "BSC",
          fromCurrency: selectedAsset.ticker?.toUpperCase(),
          fromNetwork: selectedAsset.network,
          amount: payAmount,
        });

        dispatch(
          fetchSwapEstimate({
            toCurrency: "USDT",
            toNetwork: "BSC",
            fromCurrency: selectedAsset.ticker?.toUpperCase(),
            fromNetwork: selectedAsset.network,
            amount: payAmount,
          })
        )
          .then((result) => {
            clearTimeout(timeoutId); // Clear timeout on success
            console.log("Estimate result:", result);
            if (result.payload) {
              console.log("Setting new estimate:", result.payload);
              setEstimate(result.payload);
              setCalculationError(null); // Clear any previous errors
              setApiValidationError(null);
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
            console.error("Failed to fetch swap estimate:", error);
            console.error("Error response data:", error.response?.data);
            console.error("Error response status:", error.response?.status);

            // Handle API validation errors for receive amount
            if (
              error.response?.data?.error ||
              error.response?.data?.response_data?.error
            ) {
              const errorData =
                error.response.data.error ||
                error.response.data.response_data?.error;
              const responseData = error.response.data.response_data;

              console.log("API ERROR DETECTED:", { errorData, responseData });

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
                  console.log(
                    "API ERROR: Decimal places validation error detected"
                  );
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
                  console.log(
                    "API ERROR: Loading states cleared for decimal places error"
                  );
                  // Don't clear the input - let user see their value and fix it
                  return;
                }
                if (
                  amountErrors.some((err: string) =>
                    err.includes("12 digits before the decimal point")
                  )
                ) {
                  console.log(
                    "API ERROR: 12 digits before decimal point validation error detected"
                  );
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
                  console.log(
                    "API ERROR: Loading states cleared for 12 digits error"
                  );
                  // Don't clear the input - let user see their value and fix it
                  return;
                }
                if (
                  amountErrors.some((err: string) => err.includes("too small"))
                ) {
                  console.log(
                    "API ERROR: Amount too small validation error detected"
                  );
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
                  console.log(
                    "API ERROR: Loading states cleared for too small error"
                  );
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
                console.log("API ERROR: Deposit too small error detected");
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
                console.log(
                  "API ERROR: Loading states cleared for deposit too small error"
                );
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
                console.log("API ERROR: Generic error handled:", errorMessage);
                return;
              }
            }

            // Fallback: Handle any other error formats that weren't caught above
            console.log(
              "FALLBACK ERROR HANDLING - No specific error format matched"
            );
            console.log("Raw error data:", error.response?.data);

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

            console.log(
              "FALLBACK: Setting error message:",
              fallbackErrorMessage
            );
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
      }, 300); // 300ms debounce to prevent rapid API calls while maintaining responsiveness

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
    console.log("Reverse calculation useEffect triggered:", {
      selectedAsset: !!selectedAsset,
      isSimpleAsset: selectedAsset
        ? isSimpleCalculationAsset(selectedAsset)
        : false,
      getAmount,
      isCalculatingFromPay,
      isCalculating,
      isCalculatingReceive,
      estimateLoading,
    });

    if (
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset) &&
      getAmount &&
      getAmount > 0 &&
      !isCalculatingFromPay
    ) {
      console.log("Starting reverse calculation - setting loading states");
      if (!apiValidationError) {
        setEstimateLoading(true);
        setEstimateError(null);
      }

      // For reverse calculation, we need to estimate the pay amount from the receive amount
      // We'll call the API with the correct direction to get the required USDT amount
      console.log("Starting reverse calculation for amount:", getAmount);

      // Add timeout to prevent hanging API calls
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), 30000); // 30 second timeout
      });

      Promise.race([
        dispatch(
          fetchSwapEstimate({
            fromCurrency: "USDT", // FROM USDT (what we want to receive)
            fromNetwork: "BSC",
            toCurrency: selectedAsset.ticker, // TO selected asset (what we need to send)
            toNetwork: selectedAsset.network,
            amount: getAmount, // Use receive amount directly
          })
        ),
        timeoutPromise,
      ])
        .then((result: any) => {
          console.log("Reverse calculation result:", result);
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
            console.log("Clearing loading states after successful calculation");
            setIsCalculating(false);
            setIsCalculatingReceive(false);
            setEstimateLoading(false);
            console.log(
              "Reverse calculation completed successfully - loading states cleared"
            );
          } else {
            // No valid result, clear loading states
            console.log("No valid result from reverse calculation");
            setIsCalculating(false);
            setIsCalculatingReceive(false);
            setEstimateLoading(false);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch reverse estimate:", error);
          console.error("Reverse error response data:", error.response?.data);
          console.error(
            "Reverse error response status:",
            error.response?.status
          );

          // Handle API validation errors for receive amount first
          if (
            error.response?.data?.error ||
            error.response?.data?.response_data?.error
          ) {
            const errorData =
              error.response.data.error ||
              error.response.data.response_data?.error;
            const responseData = error.response.data.response_data;

            console.log("REVERSE API ERROR DETECTED:", {
              errorData,
              responseData,
            });

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
                console.log(
                  "REVERSE API ERROR: 12 digits before decimal point validation error detected"
                );
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
                console.log(
                  "REVERSE API ERROR: Loading states cleared for 12 digits error"
                );
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
              console.log(
                "REVERSE API ERROR: Deposit too small error detected"
              );
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
              console.log(
                "REVERSE API ERROR: Loading states cleared for deposit too small error"
              );
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
              console.log("API ERROR: Generic error handled:", errorMessage);
              return;
            }

            // Fallback: Handle any other error formats that weren't caught above
            console.log(
              "REVERSE FALLBACK ERROR HANDLING - No specific error format matched"
            );
            console.log("Reverse raw error data:", error.response?.data);

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

            console.log(
              "REVERSE FALLBACK: Setting error message:",
              fallbackErrorMessage
            );
            setApiValidationError(fallbackErrorMessage);
            setReceiveAmountError(fallbackErrorMessage);
            // Stop loading states and show error
            setEstimateLoading(false);
            setIsCalculating(false);
            setIsCalculatingReceive(false);
            return;
          }

          // Handle different types of errors gracefully
          if (error.message?.includes("Request timeout")) {
            setEstimateError("Request timeout: Using fallback calculation");
            showToast.warning("Request timeout: Using estimated rate");
          } else if (
            error.message?.includes("Network Error") ||
            error.code === "ECONNREFUSED" ||
            error.code === "ENOTFOUND"
          ) {
            setEstimateError("Network error: Using fallback calculation");
            showToast.warning("Using estimated rate due to network issues");
          } else if (error.message?.includes("Server Error")) {
            setEstimateError("Server error: Using fallback calculation");
            showToast.warning("Using estimated rate due to server issues");
          } else if (error.message?.includes("Invalid swap parameters")) {
            setEstimateError("Invalid parameters: Using fallback calculation");
            showToast.warning("Invalid parameters: Using estimated rate");
          } else {
            setEstimateError("API error: Using fallback calculation");
            showToast.warning("Using estimated rate due to API unavailability");
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
          console.log("Finally block - clearing all loading states");
          setEstimateLoading(false);
          setIsCalculating(false);
          setIsCalculatingReceive(false);
          console.log("Reverse calculation finished - loading states cleared");
        });
    } else if (!isCalculatingFromPay && getAmount === 0) {
      // Clear loading states when receive amount is 0
      setIsCalculating(false);
      setIsCalculatingReceive(false);
      setEstimateLoading(false);
    }
  }, [selectedAsset, getAmount, isCalculatingFromPay, apiValidationError]);

  // Filter swap assets based on search term - search by ticker and name
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

  // Sort assets: USDT on BSC first, USDC on BSC second, then rest in original order
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
    
    // Default: preserve original order (no change)
    return 0;
  });

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
        console.error("Calculation error:", error);
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

  // Validate first card data
  const validateFirstCard = () => {
    // Clear previous payment method error
    setPaymentMethodError(null);
    
    if (!selectedAsset) {
      return false;
    }
    if (!payAmount) {
      return false;
    }

    // Allow any amount including negative values
    // No validation for negative amounts
    if (selectedPaymentDetails.length === 0) {
      setPaymentMethodError("Please select a payment method");
      return false;
    }

    // Check if receive amount meets minimum requirements (only if user has entered a value)
    if (getAmount > 0) {
      const validationError = validateReceiveAmount(getAmount, selectedAsset);
      if (validationError) {
        return false;
      }
    }

    return true;
  };

  const handleFirstCardSubmit = async () => {
    if (validateFirstCard()) {
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
          user_payment_detail_id: selectedPaymentDetails[0].id,
        };

        console.log("Submitting withdrawal request:", withdrawalPayload);

        // Submit to express withdrawal API
        const withdrawalResponse =
          await createExpressWithdrawal(withdrawalPayload);

        console.log("Withdrawal response received:", withdrawalResponse);

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
        setForceUpdate((prev) => prev + 1);

        console.log("Withdrawal addresses generated successfully:", {
          withdrawalAddress,
          payoutAddress,
          transactionId,
        });
      } catch (error: any) {
        console.error("Error submitting withdrawal request:", error);

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

    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      showToast.error("Please fix the following errors: " + errors.join(", "));
      return;
    }

    setIsSubmitting(true);

    try {
      // Debug logging

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
          user_payment_detail_id: selectedPaymentDetails[0].id, // Use first selected payment detail
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
              setForceUpdate((prev) => prev + 1); // Force re-render
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
              setForceUpdate((prev) => prev + 1); // Force re-render
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

        // Log the complete FormData for debugging

        for (let [key, value] of depositPayload.entries()) {
        }

        // Submit to API - let axios set the correct Content-Type for FormData
        const depositResponse = (await dispatch(
          createDeposit({
            payload: depositPayload,
            config: {
              // Don't set Content-Type manually for FormData - let axios handle it
            },
          })
        ).unwrap()) as unknown as DepositResponse;

        console.log(
          "DEBUG: Deposit code from response:",
          depositResponse.deposit_code
        );

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
      console.log(error);

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
      <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
        <span className="text-[#7e7e8f] dark:text-[#788099]">1-</span> Transaction Info
      </h2>

      <div className="w-full max-w-4xl mx-auto text-white">
        {/* Top Section - You Send and You Get in one card */}
        <div className="relative mb-4">
          {/* Top Card Container */}
          <div className="flex border border-[#D1D2D4FF] dark:border-[#35353E] rounded-2xl p-4">
            {/* You Send Section */}
            <div className="flex-1 pr-4">
              <label className="block text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
                You Send
                {isCalculatingFromPay &&
                  (isCalculating || isCalculatingReceive) && (
                    <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
                  )}
              </label>
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
                          setCalculationError(
                            "Ensure that there are no more than 8 decimal places."
                          );
                          return;
                        }
                      }

                      setPayAmountInput(inputValue);

                      // Convert to number for calculations
                      const parsedValue =
                        inputValue === "" ? 0 : parseFloat(inputValue) || 0;

                      const newValue = parsedValue;
                      setPayAmount(newValue);
                      setIsCalculatingFromPay(true);

                      // Mark that user has manually modified the amount
                      setIsUserModifiedAmount(true);

                      // Clear any previous errors when user starts typing
                      setReceiveAmountError(null);
                      setApiValidationError(null);
                      setCalculationError(null);
                      setApiValidationError(null);

                      // Only calculate if we have a valid amount and asset
                      if (selectedAsset && newValue >= 0) {
                        // Check asset type first and handle accordingly
                        if (isSimpleCalculationAsset(selectedAsset)) {
                          // For direct assets (USDT on BSC, USDC on BSC), calculate immediately
                          console.log(
                            "You Send: Direct asset detected, calculating immediately"
                          );
                          calculateAmounts(newValue, true);
                        } else if (newValue > 0) {
                          // For non-simple assets, stop normal calculation and go directly to API
                          console.log(
                            "You Send: Non-simple asset detected, going directly to API"
                          );

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
                          console.log(
                            "You Send: Going directly to API calculation for amount:",
                            newValue
                          );
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
                  }}
                  onKeyDown={(e) => {
                    // Allow all numeric input including negative signs
                  }}
                  onFocus={() => setIsCalculatingFromPay(true)}
                  onBlur={() => {
                    // Allow any value on blur
                  }}
                  placeholder={
                    (isCalculating || isCalculatingReceive) &&
                    !apiValidationError
                      ? "Calculating..."
                      : "Enter amount"
                  }
                  className={`w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff] rounded-2xl px-4 py-2 pr-16 text-lg  focus:outline-none border appearance-none ${
                    apiValidationError
                      ? "border-red-500"
                      : isCalculating || isCalculatingReceive
                        ? "border-[#1D8751]"
                        : "border-[#A2A4A9FF] dark:border-[#35353E]"
                  }`}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-[#35353e] dark:text-[#ffffff] text-sm font-medium">
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
            <div className="flex-1 pl-4">
              <label className="block text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                Asset
              </label>
              <div className="relative" ref={assetDropdownRef}>
                <div
                  className={`w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff] rounded-2xl px-4 py-2 text-lg  focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E] flex items-center justify-between cursor-pointer`}
                  onClick={() => {
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
                        <span className="text-[#35353e] dark:text-[#788099]">
                          {(
                            selectedAsset.ticker ||
                            selectedAsset.symbol ||
                            selectedAsset.name ||
                            "Unknown"
                          ).toUpperCase()}
                        </span>
                        <span className="ml-2 bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-semibold px-2 py-0.5 rounded-full">
                          {getNetworkDisplayName(selectedAsset.network)}
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
                {isAssetDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#ffffff] dark:bg-[#1D1D23] border border-[#A2A4A9FF] dark:border-[#35353E] rounded-2xl z-50 max-h-80 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-3 border-b border-[#A2A4A9FF] dark:border-[#35353E]">
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7e7e8f] w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search assets..."
                          className="w-full text-gray-900 dark:text-white dark:bg-[#1D1D23] bg-white rounded-xl px-10 py-2 text-sm focus:outline-none border dark:border-[#35353E] border-[#35353E] placeholder-gray-500 dark:placeholder-gray-400"
                          value={assetSearchTerm}
                          onChange={(e) => setAssetSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Asset List */}
                    <div className="max-h-60 overflow-y-auto">
                      {sortedSwapAssets.length > 0 ? (
                        sortedSwapAssets.map(
                          (asset: SupportedAsset, index: number) => (
                            <div
                              key={`${asset.asset_id}-${asset.ticker}-${asset.network}-${index}`}
                              className="flex items-center gap-3 p-3 text-black dark:text-white hover:bg-[#78787AFF] dark:hover:bg-[#35353E] cursor-pointer border-b border-[#A2A4A9FF] dark:border-[#35353E] last:border-b-0"
                              onClick={() => {
                                console.log("Asset selected:", asset);

                                // First, stop any ongoing calculations and clear previous states
                                if (calculationTimeout) {
                                  clearTimeout(calculationTimeout);
                                }
                                if (estimateTimeout) {
                                  clearTimeout(estimateTimeout);
                                }

                                // Clear all previous calculation states
                                setEstimate(null);
                                setEstimateError(null);
                                setEstimateLoading(false);
                                setCalculationError(null);
                                setReceiveAmountError(null);
                                setApiValidationError(null);
                                setApiValidationError(null);

                                // Set the new asset
                                setSelectedAsset(asset);
                                setIsAssetDropdownOpen(false);
                                setAssetSearchTerm("");

                                // Check asset type first and handle accordingly
                                if (isSimpleCalculationAsset(asset)) {
                                  // For direct assets (USDT on BSC, USDC on BSC), calculate immediately
                                  console.log(
                                    "Selected direct asset, calculating immediately"
                                  );
                                  setIsCalculatingFromPay(true);

                                  // Only set default amount if user hasn't manually modified the amount
                                  if (!isUserModifiedAmount) {
                                    const defaultAmount =
                                      getDefaultAmount(asset);
                                    setPayAmount(defaultAmount);
                                    setPayAmountInput(defaultAmount.toString());
                                    calculateAmounts(defaultAmount, true);
                                  } else {
                                    // User has custom amount, just recalculate with existing amount
                                    calculateAmounts(payAmount, true);
                                  }
                                } else {
                                  // For non-simple assets, go directly to API
                                  console.log(
                                    "Selected non-simple asset, going directly to API"
                                  );
                                  setIsCalculatingFromPay(true);

                                  // Set loading states immediately for visual feedback
                                  setIsCalculating(true);
                                  setIsCalculatingReceive(true);
                                  setEstimateLoading(true);

                                  // Only set default amount if user hasn't manually modified the amount
                                  if (!isUserModifiedAmount) {
                                    const defaultAmount =
                                      getDefaultAmount(asset);
                                    setPayAmount(defaultAmount);
                                    setPayAmountInput(defaultAmount.toString());
                                  }
                                  // The estimate useEffect will handle the API call
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
                                alt={asset?.name || asset?.ticker || asset?.symbol || "Asset"}
                                className="w-6 h-6 rounded-full object-cover"
                                onError={(e) => {
                                  console.log("Image failed to load for asset:", asset);
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
                                    {getNetworkDisplayName(asset.network)}
                                  </span>
                                </div>
                                <div className="text-[#35353e] dark:text-[#788099] text-sm">
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
                          )
                        )
                      ) : (
                        <div className="p-4 text-center text-[#7e7e8f] dark:text-[#788099]">
                          {assetSearchTerm
                            ? "No assets found"
                            : "No assets available"}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Swap Circle - positioned to touch both borders equally */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full -translate-y-1/3 z-10">
            <button
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105"
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
                className="w-16 h-16 dark:hidden"
              />
              {/* Dark mode image */}
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1755500509/Frame_36261_ledmyw.png"
                alt="swap icon"
                className="w-16 h-16 hidden dark:block"
              />
            </button>
          </div>
        </div>

        {/* Bottom Section - You Receive and Bank/Payment Method in one card */}
        <div className="relative mb-3">
          <div className="flex border border-[#D1D2D4FF] dark:border-[#35353E] rounded-2xl p-4">
            {/* You Receive Section */}
            <div className="flex-1 pr-4">
              <label className="block text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
                You Receive
                {!isCalculatingFromPay &&
                  (isCalculating || isCalculatingReceive) && (
                    <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
                  )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={getAmountInput}
                  onChange={(e) => {
                    const value = e.target.value;

                    // Only allow numbers and decimals (including 0.006 format)
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      // Check for decimal places validation
                      if (value.includes(".")) {
                        const decimalPart = value.split(".")[1];
                        if (decimalPart && decimalPart.length > 8) {
                          setApiValidationError(
                            "Ensure that there are no more than 8 decimal places."
                          );
                          setReceiveAmountError(
                            "Ensure that there are no more than 8 decimal places."
                          );
                          return;
                        }
                      }

                      setGetAmountInput(value); // Store the string value for display
                      const newAmount = parseFloat(value) || 0;
                      setGetAmount(newAmount);
                      setIsCalculatingFromPay(false);

                      // Clear any previous errors when user starts typing
                      setReceiveAmountError(null);
                      setApiValidationError(null);
                      setCalculationError(null);
                      setApiValidationError(null);

                      // Only calculate if we have a valid amount and asset
                      if (selectedAsset && newAmount >= 0) {
                        // Check asset type first and handle accordingly
                        if (isSimpleCalculationAsset(selectedAsset)) {
                          // For direct assets (USDT on BSC, USDC on BSC), calculate immediately
                          console.log(
                            "You Receive: Direct asset detected, calculating immediately"
                          );
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
                        } else if (newAmount > 0) {
                          // For non-simple assets, stop normal calculation and go directly to API
                          console.log(
                            "You Receive: Non-simple asset detected, going directly to API"
                          );

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
                          console.log(
                            "You Receive: Going directly to API calculation for amount:",
                            newAmount
                          );
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
                  }}
                  onKeyDown={(e) => {
                    // Allow all numeric input including negative signs
                  }}
                  onFocus={() => setIsCalculatingFromPay(false)}
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
                  className={`w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff] rounded-2xl px-4 py-2 pr-16 text-lg  focus:outline-none border appearance-none ${
                    (receiveAmountError &&
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
                          : "border-[#A2A4A9FF] dark:border-[#35353E]"
                  }`}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-[#35353e] dark:text-[#ffffff] text-sm font-medium">
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
                  className={`text-sm mt-1 ${
                    receiveAmountError.includes("Rough estimate") ||
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
            <div className="flex-1 pl-4">
              <label className="block text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                Payment Method
              </label>
              <div className="relative">
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                  alt="bank icon"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none z-10"
                />
                <select
                  value={payBank}
                  onChange={(e) => {
                    console.log("DEBUG: Selected payment type:", e.target.value);
                    console.log(
                      "DEBUG: Available adminWalletList:",
                      adminWalletList
                    );
                    const selectedWallet = adminWalletList?.find(
                      (wallet: any) => wallet.admin_payment_detail?.payment_type === e.target.value
                    );
                    console.log("DEBUG: Selected wallet:", selectedWallet);
                    setPayBank(e.target.value);
                    setSelectedPaymentDetail(selectedWallet?.admin_payment_detail || null);
                    // Clear selected payment details when changing payment type
                    setSelectedPaymentDetails([]);
                    // Clear payment method error when selecting a payment type
                    setPaymentMethodError(null);
                  }}
                  className={`w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff] rounded-2xl px-9 py-2 text-lg focus:outline-none border appearance-none cursor-pointer relative ${
                    paymentMethodError 
                      ? "border-red-500 dark:border-red-500" 
                      : "border-[#A2A4A9FF] dark:border-[#35353E]"
                  }`}
                  style={{
                    backgroundImage:
                      'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22/%3E%3C/svg%3E")',
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 8px center",
                    backgroundSize: "12px auto",
                    paddingRight: "40px",
                  }}
                >
                  <option value="">
                    {loading
                      ? "Loading payment methods..."
                      : adminWalletList?.length === 0
                        ? "No payment methods available"
                        : "Select Payment Method"}
                  </option>
                  {/* Filter unique payment types */}
                  {Array.from(
                    new Set(
                      adminWalletList?.map((wallet: any) => wallet.admin_payment_detail?.payment_type)
                    )
                  )
                    .filter((type) => type) // Remove null/undefined values
                    .map((paymentType: any, index: number) => (
                      <option key={index} value={paymentType}>
                        {paymentType}
                      </option>
                    ))}
                </select>
              </div>
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              {paymentMethodError && <p className="text-red-500 text-sm mt-1">{paymentMethodError}</p>}

              {/* Registered Account Section */}
              {payBank && (
                <div className="mt-3">
                  <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                    Registered Account
                  </label>
                  {enhancedFilteredUserPaymentDetails.length > 0 ? (
                    <div className="relative">
                      <img
                        src="https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                        alt="account icon"
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none z-10"
                      />
                      <select
                        value={
                          selectedPaymentDetails.length > 0
                            ? selectedPaymentDetails[0].id
                            : ""
                        }
                        onChange={(e) => {
                          const selectedId = Number(e.target.value);
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
                        className={`w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#788099] rounded-2xl px-9 py-2 text-lg focus:outline-none border appearance-none cursor-pointer relative ${
                          paymentMethodError 
                            ? "border-red-500 dark:border-red-500" 
                            : "border-[#A2A4A9FF] dark:border-[#35353E]"
                        }`}
                        style={{
                          backgroundImage:
                            'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22/%3E%3C/svg%3E")',
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 8px center",
                          backgroundSize: "12px auto",
                          paddingRight: "40px",
                        }}
                      >
                        <option value="">
                          {userPaymentLoading
                            ? "Loading accounts..."
                            : "Select Registered Account"}
                        </option>
                        {enhancedFilteredUserPaymentDetails.map(
                          (detail: UserPaymentDetail) => (
                            <option key={detail.id} value={detail.id}>
                              {detail.payment_provider_name}{" "}
                              {detail.account_number}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  ) : (
                    <p className="text-[#F79330] text-sm">
                      <button
                        type="button"
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="hover:underline cursor-pointer"
                      >
                        Don't have an account? Register Now
                      </button>
                    </p>
                  )}
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

        {/* Disclaimer Banner */}
        <div className="flex items-center rounded-2xl px-4 py-3 mb-4 dark:bg-[#1D1D23]">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#1D8751] rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path
                  d="M12 8v4m0 4h.01"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            <span className="text-[#35353e] dark:text-[#788099] text-sm font-medium">
              This is only an estimated price based on current market rates. The
              final price will be confirmed when we receive the funds.
            </span>
          </div>
        </div>

        {/* Submit Button for First Card */}
        <div className="mt-4">
          {isTransactionSubmitted ? (
            ""
          ) : (
            <button
              className={`w-full text-[#35353e] dark:text-[#788099] text-base font-medium py-2 rounded-2xl flex items-center justify-center gap-2 transition-colors ${
                isSubmitting ||
                isTransactionSubmitted ||
                isInfoModalOpen ||
                getAmount > 15000
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#1D8751] hover:bg-[#166b3e]"
              }`}
              onClick={handleFirstCardSubmit}
              disabled={
                isSubmitting ||
                isTransactionSubmitted ||
                isInfoModalOpen ||
                getAmount > 15000
              }
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#A2A4A9FF] dark:border-[#35353E]"></div>
                  <span>Getting Withdrawal Addresses...</span>
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
                <span className="flex items-center justify-center">
                 
                  <img
                    className="mt-2"
                    src="https://res.cloudinary.com/pitz/image/upload/v1752244135/Group_5_gkxzdz.png"
                    alt=""
                  />
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Wallet Address Section - shown after transaction submission */}
      {isTransactionSubmitted && (
        <div
          key={`wallet-section-${forceUpdate}`}
          className="mb-6 flex flex-col gap-3 max-w-4xl mx-auto w-full px-2"
        >
          <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
            <span className="text-[#7e7e8f] dark:text-[#788099]">2-</span>
            Wallet Address
          </h2>
          <div className="dark:bg-[#1D1D23] border-2 border-[#35353e] rounded-2xl p-5 shadow-lg w-full text-[#35353e] dark:text-[#788099]">
            {/* USDT Wallet Address */}
            <div className="mb-4">
              <h3 className="text-[#35353e] dark:text-[#788099] font-semibold mb-2">
                USDT Wallet Address
              </h3>
              {withdrawalAddress ? (
                <div className=" dark:bg-[#1D1D23]  border border-[#1D8751] rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#35353e] dark:text-[#788099] text-sm font-mono break-all">
                      {withdrawalAddress}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(withdrawalAddress);
                          setIsWalletAddressCopied(true);
                          // Reset the copied state after 2 seconds
                          setTimeout(() => {
                            setIsWalletAddressCopied(false);
                          }, 2000);
                        }}
                        className="flex items-center gap-1 bg-[#23232b] dark:bg-[#35353E] border border-[#1D8751] text-[#1D8751] rounded-full px-4 py-1 font-semibold text-base hover:bg-[#1D8751] hover:text-[#35353e] transition-colors"
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
                    <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] dark:bg-[#1D8751] inline-block mr-3"></span>
                    <span className="text-[#35353e] dark:text-[#788099] text-sm">
                      Please send the money from your own account Only
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] dark:bg-[#1D8751] inline-block mr-3"></span>
                    <span className="text-[#35353e] dark:text-[#788099] text-sm">
                      Put transaction ID in the description field of the bank
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] dark:bg-[#1D8751] inline-block mr-3"></span>
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
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 mr-3 w-4 h-4 text-[#1D8751] bg-[#1D1D23] dark:bg-[#35353E] border-[#A2A4A9FF] dark:border-[#35353E ] rounded focus:ring-[#1D8751] focus:ring-2"
                />
                <span className="text-[#35353e] dark:text-[#788099] text-sm">
                  I've read and agree to the{" "}
                  <span className="text-[#1D8751] cursor-pointer hover:underline">
                    Terms of Use
                  </span>
                  ,{" "}
                  <span className="text-[#1D8751] cursor-pointer hover:underline">
                    Privacy Policy
                  </span>
                  ,{" "}
                  <span className="text-[#1D8751] cursor-pointer hover:underline">
                    Payment Policies
                  </span>
                  ,{" "}
                  <span className="text-[#1D8751] cursor-pointer hover:underline">
                    AML
                  </span>
                  ,{" "}
                  <span className="text-[#1D8751] cursor-pointer hover:underline">
                    Risk Disclosure Statements
                  </span>
                </span>
              </label>
            </div>
          </div>
          {/* Disclaimer and Button outside the card */}
          <div className="flex flex-col gap-3 max-w-4xl mx-auto w-full px-2">
            <div className="flex items-center text-[#35353e] dark:text-[#788099] text-[16px] font-semibold">
              <FaExclamationCircle className="mr-2 text-[#1D8751]" />
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
              className={`w-full text-[#35353e] dark:text-[#788099] text-base font-medium py-2 rounded-2xl flex items-center justify-center gap-2 transition-colors ${
                isSubmitting || isInfoModalOpen || getAmount > 15000
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
        <div className="max-w-4xl mt-4 mx-auto w-full px-2 mb-4">
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
        onAdd={() => {
          // Refresh user payment details after adding (force refresh)
          dispatch(fetchUserPaymentDetails(true));
          showToast.success("Payment method added successfully!");
        }}
      />

      {/* InfoModal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => {
          setIsInfoModalOpen(false);
          // Don't automatically acknowledge when just closing - user must reduce amount
        }}
        onContactUs={() => {
          // Handle contact us action - you can customize this
          window.open("https://wa.me/your-whatsapp-number", "_blank");
          setIsInfoModalOpen(false);
        }}
      />
    </div>
  );
}
