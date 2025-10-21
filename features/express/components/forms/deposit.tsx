"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaExchangeAlt, FaExclamationCircle } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../../store";
import { fetchAdminPaymentDetails } from "../../../exchange/slices/paymentSlice";
import { fetchAssets } from "../../../exchange/slices/exchangeSlice";
import { createDeposit, updateDepositAddress } from "../../../exchange/slices/exchangeSlice";
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
import { useAssetsDisplay, usePaymentMethodsDisplay } from "../../hooks/useDataDisplay";

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

export default function DepositForm({
  onExchange,
  mode,
  onModeChange,
  isHomePage = false,
}: DepositFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { adminPaymentDetails, loading, error } = useSelector(
    (state: any) => state.payment
  );
  const { assets, loading: assetsLoading } = useSelector(
    (state: any) => state.exchange
  );

  // Add swap assets state
  const { supportedAssets: swapAssets, loading: swapAssetsLoading } =
    useSelector((state: any) => state.swap);
    const { isDark } = useTheme();

  // Use the data display hooks for consistent data handling
  const assetsDisplay = useAssetsDisplay(
    assets?.assets,
    swapAssets,
    assetsLoading,
    swapAssetsLoading,
    null, // exchange error
    null  // swap error
  );

  const paymentMethodsDisplay = usePaymentMethodsDisplay(
    adminPaymentDetails,
    loading,
    error
  );

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
  const [forceUpdate, setForceUpdate] = useState(0);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);


  // Add transaction code state
  const [transactionCode, setTransactionCode] = useState<string>("");
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

  // Add validation state for minimum receive amount
  const [receiveAmountError, setReceiveAmountError] = useState<string | null>(null);


  useEffect(() => {
    // Skip API calls on home page - buttons will redirect to login
    if (isHomePage) {
      return;
    }
    
    // Eagerly fetch payment details - optimized to show cached data immediately
    // The fetchAdminPaymentDetails now uses a race condition to prevent long waits
    dispatch(fetchAdminPaymentDetails(false)) // false = don't force refresh
      .unwrap()
      .catch((error: unknown) => {
        // Only show error if we have no payment methods at all
        if (!adminPaymentDetails || adminPaymentDetails.length === 0) {
          console.error('Failed to fetch admin payment details:', error);
          // Don't show toast error to avoid annoying users - fallback will handle it
        }
      });
  }, [dispatch, isHomePage, adminPaymentDetails]);

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

  // Fetch estimate for non-direct assets - triggers immediately on asset or amount change
  useEffect(() => {
    
    if (
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset) &&
      payAmount &&
      payAmount > 0 &&
      isCalculatingFromPay
    ) {
      setEstimateLoading(true);
      setEstimateError(null);

      // Use the actual fetchSwapEstimate API call for deposit
      // For deposits: fromCurrency is USDT, toCurrency is the selected asset
      

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
          amount: payAmount,
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
            }
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
            showToast.warning("Request timeout: Using estimated rate");
          } else if (error.message?.includes("Network Error") || error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
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
    } else {
      // Clear estimate for USDT or when conditions not met
      setEstimate(null);
      setEstimateError(null);
    }
  }, [selectedAsset, payAmount, isCalculatingFromPay]);

  // Fetch reverse estimate for non-direct assets when calculating from receive amount
  useEffect(() => {
    if (
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset) &&
      getAmount &&
      getAmount > 0 &&
      !isCalculatingFromPay
    ) {
      setEstimateLoading(true);
      setEstimateError(null);

      // For reverse calculation, we need to estimate the pay amount from the receive amount
      // We'll call the API with the correct direction to get the required USDT amount
      

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
            amount: getAmount, // Use receive amount directly
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
            }
          }
          
          // Clear loading states immediately after successful calculation
          setIsCalculating(false);
          setIsCalculatingReceive(false);
        })
        .catch((error) => {
          
          // Handle different types of errors gracefully
          if (error.message?.includes("Request timeout")) {
            setEstimateError("Request timeout: Using fallback calculation");
            showToast.warning("Request timeout: Using estimated rate");
          } else if (error.message?.includes("Network Error") || error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
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
    }
  }, [selectedAsset, getAmount, isCalculatingFromPay]);

  // Safety timeout to clear loading states if they get stuck
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (isCalculating || isCalculatingReceive) {
        setIsCalculating(false);
        setIsCalculatingReceive(false);
      }
    }, 15000); // 15 second safety timeout
    
    return () => clearTimeout(safetyTimeout);
  }, [isCalculating, isCalculatingReceive]);

  // Filter assets based on search term - search by ticker and name
  const filteredSwapAssets =
    assetsDisplay.displayData?.filter((asset: SupportedAsset) => {
      const ticker = asset?.ticker?.toUpperCase() || "";
      const name = asset?.name?.toUpperCase() || "";
      const symbol = asset?.symbol?.toUpperCase() || "";
      const searchTerm = assetSearchTerm.toUpperCase();

      return ticker.includes(searchTerm) || 
             name.includes(searchTerm) || 
             symbol.includes(searchTerm);
    }) || [];

  // Sort assets: USDT on BSC, then rest in original order
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
        if (selectedAsset?.range_commissions && selectedAsset.range_commissions.length > 0) {
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



  // Recalculate when asset changes
  useEffect(() => {
    console.log("Selected asset changed:", selectedAsset);
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
          asset: {
            ...selectedAsset,
            icon: selectedAsset.image_url || selectedAsset.asset_image || selectedAsset.icon_url || selectedAsset.image
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
      <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
        <span className="text-[#7e7e8f] dark:text-[#788099]">1-</span> Transaction Info
      </h2>
      
      {/* Network Status Indicator */}
      {estimateError && !estimateLoading && (
        <div className="mb-4 p-3 bg-[#F79330] bg-opacity-10 border border-[#F79330] rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#F79330]">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path d="M12 8v4m0 4h.01" stroke="#F79330" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="10" stroke="#F79330" strokeWidth="2"/>
              </svg>
              <span className="text-sm font-medium">
                {estimateError.includes("Network error") ? "Network Issues Detected" :
                 estimateError.includes("Server error") ? "Server Issues Detected" :
                 estimateError.includes("Request timeout") ? "Request Timeout" :
                 "API Issues Detected"}
              </span>
            </div>
            <span className="text-xs text-[#F79330] opacity-75">
              Using fallback calculations
            </span>
          </div>
          <p className="text-xs text-[#F79330] mt-1 opacity-75">
            Live rates are temporarily unavailable. Calculations are based on estimated rates.
          </p>
        </div>
      )}
      <div className="w-full text-white">
        {/* Top Section - Amount and Bank/Payment Method in one card */}
        <div className="relative mb-4">
          {/* Top Card Container */}
          <div className="flex border border-[#D1D2D4FF] dark:border-[#35353E]  rounded-2xl p-4">
            {/* Amount Section */}
            <div className="flex-1 pr-4">
              <label className="block text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
                You Send
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
                {/* {isCalculatingFromPay && (
                  <span className="text-xs text-[#1D8751] font-medium">(Active)</span>
                )} */}
              </label>
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
                      const newAmount = parseFloat(value) || 0;
                      
                      // Only update and calculate if the numeric value actually changed
                      if (newAmount !== payAmount || value !== payAmountInput) {
                        setPayAmountInput(value); // Store the string value for display
                      setPayAmount(newAmount);
                      setIsCalculatingFromPay(true);
                      
                      // Mark that user has manually modified the amount
                      setIsUserModifiedAmount(true);
                      
                      // Show info modal if amount exceeds $15,000
                      if (newAmount > 15000) {
                        setIsInfoModalOpen(true);
                      }
                      
                      // For direct assets, calculate immediately
                      if (selectedAsset && newAmount > 0 && isSimpleCalculationAsset(selectedAsset)) {
                        const calculatedGetAmount = newAmount < 2 ? newAmount : Math.max(0, newAmount - 2);
                        setGetAmount(calculatedGetAmount);
                        setGetAmountInput(calculatedGetAmount.toString());
                        
                        // Simple assets don't need loading states - calculation is instant
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
                  className={`w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff] rounded-2xl px-4 py-2 pr-16 text-lg  focus:outline-none border appearance-none ${
                    (isCalculating || isCalculatingReceive) && isCalculatingFromPay ? 'border-[#1D8751]' : 'border-[#A2A4A9FF] dark:border-[#35353E]'
                  }`}
                />

                
                {/* Show loading spinner when calculating "You Receive" from "You Send" */}
                {(isCalculating || isCalculatingReceive) && isCalculatingFromPay && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D8751]"></div>
                  </div>
                )}

                {/* Show info for non-direct assets when typing in You Send */}
                {selectedAsset && !isSimpleCalculationAsset(selectedAsset) && isCalculatingFromPay && payAmount > 0 && (
                  <div className="mt-2 text-xs text-[#788099]">
                    {estimateLoading ? "⏳ Fetching live rate..." : estimate ? "✅ Using live rate" : "⏳ Calculating..."}
                  </div>
                )}
                {estimateError && !estimateLoading && isCalculatingFromPay && (
                  <div className="flex items-center justify-between gap-2 text-[#F79330] text-sm mt-2">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <path d="M12 8v4m0 4h.01" stroke="#F79330" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="10" stroke="#F79330" strokeWidth="2"/>
                      </svg>
                      <span>{estimateError}</span>
                    </div>
                    <button
                      onClick={() => {
                        // Retry API call
                        if (payAmount > 0) {
                          calculateAmounts(payAmount, true);
                        }
                      }}
                      className="text-[#1D8751] hover:text-[#166b3e] text-xs underline"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bank/Payment Method Section */}
            <div className="flex-1 pl-4">
              <label className="block text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                Bank/Payment Method
              </label>
              <div className="relative">
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                  alt="bank icon"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none"
                />
                <select
                  value={payBank}
                  onChange={(e) => {
                    const selectedPayment = paymentMethodsDisplay.displayData?.find(
                      (payment: any) => payment.provider_name === e.target.value
                    );
                    
                    setPayBank(e.target.value);
                    setSelectedPaymentDetail(selectedPayment || null);
                  }}
                  disabled={paymentMethodsDisplay.isLoading}
                  className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff] rounded-2xl px-9 py-2 text-lg  focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E] appearance-none disabled:opacity-50"
                >
                  <option value="" className="bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff]">
                    {paymentMethodsDisplay.isLoading
                      ? "Loading payment methods..."
                      : "Select Payment Method"}
                  </option>
                  {paymentMethodsDisplay.displayData?.map((payment: any, index: number) => (
                    <option key={index} value={payment.provider_name} className="bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff]">
                      {payment.provider_name} - {payment.payment_method_type}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
          </div>

          {/* Swap Circle - positioned to touch both borders equally */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full -translate-y-1/3 z-10">
            {!isHomePage && (
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
            )}
          </div>
        </div>

                {/* Bottom Section - You Receive and Asset in one card */}
        <div className="relative mb-3">
          
         
          
          <div className="flex border border-[#D1D2D4FF] dark:border-[#35353E] rounded-2xl p-4">
            {/* You Receive Section */}
            <div className="flex-1 pr-4">
              <label className="block text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
                You Receive
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
                {!isCalculatingFromPay && (
                  <span className="text-xs text-[#1D8751] font-medium">(Active)</span>
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
                    
                    // Only allow numbers and decimals (including 0.006 format)
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      const newAmount = parseFloat(value) || 0;
                      
                      // Only update and calculate if the numeric value actually changed
                      if (newAmount !== getAmount || value !== getAmountInput) {
                        setGetAmountInput(value); // Store the string value for display
                      setGetAmount(newAmount);
                      setIsCalculatingFromPay(false);
                      
                      // For direct assets, calculate immediately
                      if (selectedAsset && newAmount > 0 && isSimpleCalculationAsset(selectedAsset)) {
                        const calculatedPayAmount = newAmount < 2 ? newAmount : newAmount + 2;
                        setPayAmount(calculatedPayAmount);
                        setPayAmountInput(calculatedPayAmount.toString());
                        
                        // Simple assets don't need loading states - calculation is instant
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
                  className={`w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff] rounded-2xl px-4 py-2 pr-16 text-lg  focus:outline-none border appearance-none ${
                    receiveAmountError && (receiveAmountError.includes('Rough estimate') || receiveAmountError.includes('Using estimated rate')) ? 'border-[#F79330]' : 
                    receiveAmountError ? 'border-red-500' :
                    (isCalculating || isCalculatingReceive) ? 'border-[#1D8751]' : 'border-[#A2A4A9FF] dark:border-[#35353E]'
                  }`}
                />
                {/* Show loading spinner when calculating "You Send" from "You Receive" */}
                {(isCalculating || isCalculatingReceive) && !isCalculatingFromPay && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D8751]"></div>
                  </div>
                )}
                {receiveAmountError && (
                  <div className="flex items-center gap-2 mt-2">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F79330]"/>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="text-[#F79330]"/>
                    </svg>
                    <span className={`text-sm font-medium ${
                      receiveAmountError.includes('Rough estimate') || receiveAmountError.includes('Using estimated rate') ? 'text-[#F79330]' : 'text-red-500'
                    }`}>
                      {receiveAmountError}
                    </span>
                  </div>
                )}

                {/* Show API estimate status for non-direct assets */}
                {selectedAsset && !isSimpleCalculationAsset(selectedAsset) && (
                  <div className="mt-2">
                    {/* {estimateLoading && isCalculatingFromPay && (
                      <div className="flex items-center gap-2 text-[#1D8751] text-sm">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1D8751]"></div>
                        <span>Fetching live rate from API...</span>
                      </div>
                    )} */}
                    {estimate && !estimateLoading && isCalculatingFromPay && (
                      <div className="flex items-center gap-2 text-[#1D8751] text-sm">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <path d="M12 8v4m0 4h.01" stroke="#1D8751" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="10" stroke="#1D8751" strokeWidth="2"/>
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
                          <path d="M12 8v4m0 4h.01" stroke="#1D8751" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="10" stroke="#1D8751" strokeWidth="2"/>
                        </svg>
                        <span>Using live rate for reverse calculation</span>
                      </div>
                    )}
                    {estimateError && !estimateLoading && (
                      <div className="flex items-center justify-between gap-2 text-[#F79330] text-sm">
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                            <path d="M12 8v4m0 4h.01" stroke="#F79330" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="12" cy="12" r="10" stroke="#F79330" strokeWidth="2"/>
                          </svg>
                          <span>{estimateError}</span>
                        </div>
                        <button
                          onClick={() => {
                            // Retry API call
                            if (isCalculatingFromPay && payAmount > 0) {
                              calculateAmounts(payAmount, true);
                            } else if (!isCalculatingFromPay && getAmount > 0) {
                              calculateAmounts(getAmount, false);
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
            </div>

            {/* Asset Section */}
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
                          alt={selectedAsset?.name || selectedAsset?.ticker || selectedAsset?.symbol || "Asset"}
                          className="w-6 h-6 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                          }}
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-[#35353e] dark:text-[#788099] font-medium">
                              {(selectedAsset.ticker ||
                                selectedAsset.symbol ||
                                selectedAsset.name ||
                                "Unknown").toUpperCase()}
                            </span>
                            <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-semibold px-2 py-0.5 rounded-full">
                              {getNetworkDisplayName(getAssetNetwork(selectedAsset))}
                            </span>
                          </div>
                          <span className="text-[#788099] text-xs">
                            {selectedAsset.name || 
                             (selectedAsset.ticker || selectedAsset.symbol || "Unknown")} ({getNetworkDisplayName(getAssetNetwork(selectedAsset))})
                          </span>
                        </div>
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
                          value={assetSearchTerm}
                          onChange={(e) => setAssetSearchTerm(e.target.value)}
                          className="w-full text-gray-900 dark:text-white dark:bg-[#1D1D23] bg-white rounded-xl px-10 py-2 text-sm focus:outline-none border dark:border-[#35353E] border-[#35353E] placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                    </div>

                    {/* Asset List */}
                    <div className="max-h-60 overflow-y-auto">
                      {sortedSwapAssets.length > 0 ? (
                        <>
                          {/* Popular Section - First 2 assets only if no search */}
                          {!assetSearchTerm && sortedSwapAssets.length > 2 && (
                            <>
                              <div className="px-3 py-2 bg-[#F5F6F7] dark:bg-[#23232B] border-b border-[#A2A4A9FF] dark:border-[#35353E]">
                                <span className="text-xs font-semibold text-[#788099] uppercase tracking-wider">
                                  Popular
                                </span>
                              </div>
                              {sortedSwapAssets.slice(0, 2).map((asset: SupportedAsset, index: number) => (
                                <div
                                  key={`popular-${asset.asset_id || 'asset'}-${asset.symbol || asset.ticker || asset.name}-${asset.network || 'unknown'}-${index}`}
                                  className="flex items-center gap-3 p-3 text-black dark:text-white hover:bg-[#78787AFF] dark:hover:bg-[#35353E] cursor-pointer border-b border-[#A2A4A9FF] dark:border-[#35353E]"
                                  onClick={() => {
                                    setSelectedAsset(asset);
                                    const networkValue = getAssetNetwork(asset);
                                    setSelectedNetwork({
                                      network_id: networkValue,
                                      network_type: networkValue,
                                    });
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
                                      e.currentTarget.src =
                                        "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                                    }}
                                  />
                                  <div className="flex-1">
                                    <div className="text-[#35353e] dark:text-[#ffffff] font-medium flex items-center gap-2">
                                      {(asset.ticker ||
                                        asset.symbol ||
                                        asset.name ||
                                        "Unknown").toUpperCase()}
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
                              ))}
                              
                              {/* Separator Line */}
                              <div className="border-t-2 border-[#D1D2D4FF] dark:border-[#35353E]"></div>
                              
                              {/* All Assets Header */}
                              <div className="px-3 py-2 bg-[#F5F6F7] dark:bg-[#23232B] border-b border-[#A2A4A9FF] dark:border-[#35353E]">
                                <span className="text-xs font-semibold text-[#788099] uppercase tracking-wider">
                                  All Assets
                                </span>
                              </div>
                            </>
                          )}
                          
                          {/* Rest of the assets or all assets if searching */}
                          {(assetSearchTerm ? sortedSwapAssets : sortedSwapAssets.slice(2)).map((asset: SupportedAsset, index: number) => (
                          <div
                            key={`${asset.asset_id || 'asset'}-${asset.symbol || asset.ticker || asset.name}-${asset.network || 'unknown'}-${index}`}
                            className="flex items-center gap-3 p-3 text-black dark:text-white hover:bg-[#78787AFF] dark:hover:bg-[#35353E] cursor-pointer border-b border-[#A2A4A9FF] dark:border-[#35353E] last:border-b-0"
                            onClick={() => {
                              setSelectedAsset(asset);
                              const networkValue = getAssetNetwork(asset);
                              setSelectedNetwork({
                                network_id: networkValue,
                                network_type: networkValue,
                              });
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
                                e.currentTarget.src =
                                  "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                              }}
                            />
                            <div className="flex-1">
                              <div className="text-[#35353e] dark:text-[#ffffff] font-medium flex items-center gap-2">
                                {(asset.ticker ||
                                  asset.symbol ||
                                  asset.name ||
                                  "Unknown").toUpperCase()}
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
                          ))}
                        </>
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
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M12 8v4m0 4h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <span className="text-[#35353e] dark:text-[#788099] text-sm font-medium">
              This is only an estimated price based on current market rates. The final price will be confirmed when we receive the funds.
            </span>
          </div>
        </div>

        {/* Submit Button for First Card */}
          {!isFirstCardSubmitted && (
            <div 
              className="mt-4 relative"
              onClick={(e) => {
                // On home page, redirect to login on any click
                if (isHomePage) {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push("/auth/login");
                }
              }}
            >
              <button
                className={`w-full text-[#35353e] dark:text-[#788099] text-base font-medium py-2 rounded-2xl flex items-center justify-center gap-2 transition-colors ${
                  isHomePage 
                    ? "bg-[#1D8751] hover:bg-[#166b3e] cursor-pointer"
                    : isSubmitting ||
                      !selectedAsset ||
                      (selectedAsset &&
                        !isSimpleCalculationAsset(selectedAsset) &&
                        estimateLoading)
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-[#1D8751] hover:bg-[#166b3e]"
                }`}
                onClick={isHomePage ? undefined : handleFirstCardSubmit}
                disabled={
                  isHomePage ? false : (
                    isSubmitting ||
                    !selectedAsset ||
                    (walletAddress.trim() && !!walletError) ||
                    (selectedAsset &&
                      !isSimpleCalculationAsset(selectedAsset) &&
                      estimateLoading)
                  )
                }
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#35353e] dark:border-[#788099]"></div>
                    <span>Posting...</span>
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
          )}
        </div>

      {selectedPaymentDetail && isFirstCardSubmitted && (
        <>
          {/* Payment Details Card */}
          <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
            <span className="text-[#7e7e8f] dark:text-[#788099]">2-</span> Payment Details
          </h2>
          <div
            ref={paymentDetailsRef}
            className="mt-1 mb-2 w-full flex flex-col gap-3 px-2 "
          >
            <div className="flex-1  dark:bg-[#1D1D23] rounded-2xl border border-[#39394a] dark:border-[#35353E] flex flex-col justify-between p-5 relative min-h-[120px]">
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
                    {selectedPaymentDetail.provider_name}
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
                <span className="text-[#7e7e8f] dark:text-[#788099]">3-</span> Transaction Code
              </h2>
              <div className="mb-6 flex flex-col gap-3 w-full px-2">
              <div className=" dark:bg-[#1D1D23] border-2 border-[#35353E] rounded-2xl p-4 shadow-lg w-full text-[#35353e] dark:text-[#788099]">
                {/* Transaction Code Row */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-3">
                  {/* Display deposit code from API response - each character in its own box */}
                  <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
                    {apiResponse.deposit_code.split('').map((char: string, index: number) => (
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
                      showToast.success("Transaction code copied!");
                    }}
                    className="flex items-center gap-2 bg-[#35353E] border border-[#1D8751] text-white rounded-full px-3 py-2 sm:px-4 font-semibold text-xs sm:text-sm hover:bg-[#1D8751] hover:text-white transition-colors"
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
                        <span className="w-2 h-2 mt-1 rounded-full bg-[#1D8751] inline-block mr-2"></span>
                          <span className="text-[#35353e] dark:text-[#788099] text-xs">
                          Please write this Transaction Code in the bank message
                          or note section.
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
            <span className="text-[#7e7e8f] dark:text-[#788099]">4-</span> Wallet Address
          </h2>
          <div className="flex flex-col dark:bg-[#1D1D23] border-2 border-[#35353E] rounded-2xl p-5 shadow-lg w-full text-[#35353e] dark:text-[#788099] mb-6">
            {/* Wallet/Account Address Label */}
            <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
              Wallet/Account Address
            </label>
            {/* Input group */}
            <div className="flex items-center dark:bg-[#1D1D23] border border-[#39394a] dark:border-[#35353E] rounded-2xl px-4 py-2 mb-4">
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

                  // Validate immediately as user types (wallet address is optional for initial submission)
                  if (value.trim() === "") {
                    setWalletError(null); // No error when empty - address is optional
                  } else if (!selectedAsset) {
                    setWalletError("Please select an asset first");
                  } else {
                    // Allow all address types - no specific network validation
                    if (value.trim().length < 10) {
                      setWalletError("Address seems too short");
                      setForceUpdate((prev) => prev + 1);
                    } else {
                      setWalletError(null);
                      setForceUpdate((prev) => prev + 1);
                    }
                  }
                }}
                placeholder="Paste here your Crypto address"
                className={`flex-1 bg-transparent border-none outline-none text-[#35353e] dark:text-[#788099] placeholder-[#788099] text-base ${
                  walletError
                    ? "border-red-500"
                    : walletAddress.trim() && !walletError
                      ? "border-green-500"
                      : ""
                }`}
              />
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
              {/* Paste button */}
              <button
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setWalletAddress(text);
                  } catch (err) {
                    console.error("Failed to read clipboard:", err);
                    showToast.error("Failed to paste from clipboard");
                  }
                }}
                className="flex items-center gap-1 dark:bg-[#1D1D23] border border-[#1D8751] text-[#1D8751] rounded-full px-4 py-1 ml-2 font-semibold text-base hover:bg-[#1D8751] hover:text-white transition-colors"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M19 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-2h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Paste
              </button>
            </div>

            {/* Show validation messages below the wallet address input */}
            {walletError && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                ❌ {walletError}
              </p>
            )}

            {walletAddress.trim() && !walletError && selectedAsset && (
              <p className="text-[#1D8751] text-sm mt-2 font-medium">
                ✅ Valid address
              </p>
            )}

          

           

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
                Terms and Conditions Summary
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

          {/* Disclaimer and Button outside the card */}
          <div className="flex flex-col gap-3 w-full px-2">
            <div className="flex items-center text-[#35353e] dark:text-[#788099] text-[16px] font-semibold">
              <FaExclamationCircle className="mr-2 text-[#1D8751]" />
              <span>
                This is only an estimated price based on current market rates.
                The final price will be confirmed when we receive the funds.
              </span>
            </div>
            <button
              className={`w-full text-[#35353e] dark:text-[#788099] text-base font-medium py-2 rounded-2xl flex items-center justify-center gap-2 transition-colors ${
                isSubmitting
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#1D8751] hover:bg-[#166b3e]"
              }`}
              onClick={handleProceedToNext}
              disabled={isSubmitting || !walletAddress.trim() || !!walletError}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#35353e] dark:border-[#35353E]"></div>
                  <span>Processing...</span>
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
        </>
      )}

      {/* InfoModal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        onContactUs={() => {
          // Handle contact us action - you can customize this
          window.open('https://wa.me/your-whatsapp-number', '_blank');
          setIsInfoModalOpen(false);
        }}
      />
    </div>
  );
}
