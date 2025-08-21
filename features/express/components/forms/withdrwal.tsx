"use client";
import React, { useEffect, useState, useRef } from "react";
import { FaExchangeAlt, FaExclamationCircle } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../../store";
import {
  fetchAdminPaymentDetails,
  fetchUserPaymentDetails,
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
                    : "border-[#39394a] bg-[#23232b]"
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

export default function WithdrawalForm({
  onExchange,
  mode,
  onModeChange,
}: DepositFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { adminPaymentDetails, loading, error } = useSelector(
    (state: any) => state.payment
  );




  const { assets, loading: assetsLoading } = useSelector(
    (state: any) => state.exchange
  );

  // Add swap assets state
  const { supportedAssets: swapAssets, loading: swapAssetsLoading } =
    useSelector((state: any) => state.swap);

  // Add user payment details state
  const { userPaymentDetails, loading: userPaymentLoading } = useSelector(
    (state: any) => state.payment
  );

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
  const [calculationTimeout, setCalculationTimeout] = useState<NodeJS.Timeout | null>(null);
  const [calculationComplete, setCalculationComplete] = useState(false);

  // Add PaymentMethodsModal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // Add InfoModal state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  
  // Add state to track if user has acknowledged the $5,000+ limit warning
  const [hasAcknowledgedLimit, setHasAcknowledgedLimit] = useState(false);

  // Add validation state for minimum receive amount
  const [receiveAmountError, setReceiveAmountError] = useState<string | null>(null);

  // Filter user payment details based on selected payment method
  const filteredUserPaymentDetails = payBank
    ? (userPaymentDetails || []).filter(
        (detail: any) => detail.payment_provider_name === payBank
      )
    : [];


  // Enhanced filtering with fallback options
  const enhancedFilteredUserPaymentDetails = payBank
    ? (userPaymentDetails || []).filter((detail: any) => {
        // Try multiple possible field names for provider name
        const providerName =
          detail.payment_provider_name ||
          detail.provider_name ||
          detail.payment_provider;
       
        return providerName === payBank;
      })
    : [];

  // Auto-select first account when accounts are available for selected bank
  useEffect(() => {
    if (payBank && enhancedFilteredUserPaymentDetails.length > 0 && selectedPaymentDetails.length === 0) {
      console.log("DEBUG: Auto-selecting first account for bank:", payBank);
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
  useEffect(() => {
  
   
  }, [isTransactionSubmitted, withdrawalAddress, qrCodeUrl, websocketUrl]);

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
    dispatch(fetchAdminPaymentDetails())
      .unwrap()
      .then((data) => {
        // console.log("DEBUG: Admin payment details fetched:", data);
      })
      .catch((error: unknown) => {
        showToast.error(`Failed to fetch admin payment details: ${error}`);
      });
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchAssets())
      .unwrap()
      .catch((error: unknown) => {
        showToast.error(`Failed to fetch assets: ${error}`);
      });
  }, [dispatch]);

  // Fetch user payment details
  useEffect(() => {
    dispatch(fetchUserPaymentDetails())
      .unwrap()
      .catch((error: unknown) => {
        showToast.error(`Failed to fetch user payment details: ${error}`);
      });
  }, [dispatch]);

  // Fetch swap assets
  useEffect(() => {
    dispatch(fetchSupportedAssets())
      .unwrap()
      .then((data) => {
        // console.log("DEBUG: Swap assets fetched:", data);
      })
      .catch((error: unknown) => {
        showToast.error(`Failed to fetch swap assets: ${error}`);
      });
  }, [dispatch]);

  // Auto-select first asset and calculate received amount when assets are loaded
  useEffect(() => {
    if (swapAssets && swapAssets.length > 0 && !selectedAsset) {
      // Sort assets to get USDT on BSC first, then USDC on BSC, then others
      const sortedAssets = [...swapAssets].sort((a, b) => {
        const tickerA = (a.ticker || a.symbol || a.name || "").toString().toUpperCase();
        const tickerB = (b.ticker || b.symbol || b.name || "").toString().toUpperCase();
        const networkA = (a.network || "").toString().toLowerCase();
        const networkB = (b.network || "").toString().toLowerCase();

        // Priority 1: USDT on BSC
        if (tickerA === "USDT" && networkA === "bsc" && !(tickerB === "USDT" && networkB === "bsc")) {
          return -1;
        }
        if (tickerB === "USDT" && networkB === "bsc" && !(tickerA === "USDT" && networkA === "bsc")) {
          return 1;
        }
        // Priority 2: USDC on BSC
        if (tickerA === "USDC" && networkA === "bsc" && !(tickerB === "USDC" && networkB === "bsc")) {
          return -1;
        }
        if (tickerB === "USDC" && networkB === "bsc" && !(tickerA === "USDC" && networkA === "bsc")) {
          return 1;
        }
        return 0;
      });

      const firstAsset = sortedAssets[0];
      console.log("Auto-selecting first asset:", firstAsset);
      setSelectedAsset(firstAsset);
    }
  }, [swapAssets, selectedAsset]);

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

  // Handle estimate updates and trigger recalculation
  useEffect(() => {
    console.log("Estimate effect triggered:", { 
      hasEstimate: !!estimate, 
      estimateLoading, 
      isCalculatingFromPay, 
      payAmount,
      estimateAmount: estimate?.estimated_amount 
    });
    
    if (estimate && !estimateLoading && isCalculatingFromPay && payAmount > 0) {
      console.log("Estimate received, updating receive amount:", estimate.estimated_amount);
      // Estimate has been received, update the receive amount
      const finalAmount = Math.max(0, estimate.estimated_amount);
      setGetAmount(finalAmount);
      setGetAmountInput(finalAmount.toString());
      
      const validationError = validateReceiveAmount(finalAmount, selectedAsset);
      setReceiveAmountError(validationError);
      
      if (finalAmount > 5000) {
        setIsInfoModalOpen(true);
        setHasAcknowledgedLimit(false);
      }
      
      // Clear loading states
      setIsCalculating(false);
      setIsCalculatingReceive(false);
    } else if (estimateLoading && isCalculatingFromPay && payAmount > 0) {
      // Show loading state while estimate is being fetched
      setIsCalculating(true);
      setIsCalculatingReceive(true);
    } else if (!estimate && !estimateLoading && isCalculatingFromPay && payAmount > 0 && selectedAsset && !isSimpleCalculationAsset(selectedAsset)) {
      // No estimate available but we're calculating from pay - show loading
      setIsCalculating(true);
      setIsCalculatingReceive(true);
    }
  }, [estimate, estimateLoading, isCalculatingFromPay, payAmount, selectedAsset]);

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

  // Check if asset is USDT or USDC (should use simple calculation)
  const isSimpleCalculationAsset = (asset: any) => {
    if (!asset) return false;
    const ticker = (asset.ticker || asset.symbol || "").toLowerCase();
    return ticker === "usdt" || ticker === "usdc";
  };

  // Get minimum amount based on asset type
  const getMinimumAmount = (asset: any) => {
    if (!asset) return 10; // Default minimum
    const ticker = (asset.ticker || asset.symbol || "").toLowerCase();
    return ticker === "usdt" || ticker === "usdc" ? 2 : 10; // 2 for USDT/USDC, 10 for others
  };

  // Validate receive amount - allow any amount for now
  const validateReceiveAmount = (amount: number, asset: any) => {
    // Allow any amount - no validation for now
    return null; // No error
  };

  // Fetch estimate for non-USDT/USDC assets - triggers immediately on asset or amount change
  useEffect(() => {
    if (
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset) &&
      payAmount &&
      payAmount > 0
    ) {
      setEstimateLoading(true);
      setEstimateError(null);

      // Use the actual fetchSwapEstimate API call for deposit
      // Note: fromCurrency is the selected asset, toCurrency is always "USDT" for deposits
      console.log("Fetching estimate for deposit:", {
       toCurrency : "USDT",
       toNetwork : "BSC",
     fromCurrency   : selectedAsset.ticker?.toUpperCase(),
       fromNetwork : selectedAsset.network,
        amount: payAmount,
      });

      dispatch(
        fetchSwapEstimate({
          toCurrency : "USDT",
          toNetwork : "BSC",
        fromCurrency   : selectedAsset.ticker?.toUpperCase(),
          fromNetwork : selectedAsset.network,
           amount: payAmount,
        })
      )
        .then((result) => {
          console.log("Estimate result:", result);
          if (result.payload) {
            console.log("Setting new estimate:", result.payload);
            setEstimate(result.payload);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch swap estimate:", error);
          setEstimateError("Failed to calculate estimate");
        })
        .finally(() => {
          setEstimateLoading(false);
        });
    } else {
      // Clear estimate for USDT/USDC or when conditions not met
      setEstimate(null);
      setEstimateError(null);
    }
  }, [selectedAsset, payAmount]);

  // Filter swap assets based on search term
  const filteredSwapAssets =
    swapAssets?.filter((asset: SupportedAsset) => {
      const name = asset.name?.toLowerCase() || "";
      const symbol = asset.symbol?.toLowerCase() || "";
      const ticker = asset.ticker?.toUpperCase() || "";
      const searchTerm = assetSearchTerm.toLowerCase();

      return (
        name.includes(searchTerm) ||
        symbol.includes(searchTerm) ||
        ticker.toLowerCase().includes(searchTerm)
      );
    }) || [];

  // Sort assets: USDT on BSC, USDC on BSC, then rest in original order
  const sortedSwapAssets = [...filteredSwapAssets].sort((a, b) => {
    // Ensure tickers exist and are strings (using ticker as primary, fallback to symbol/name)
    const tickerA = (a.ticker || a.symbol || a.name || "")
      .toString()
      .toUpperCase();
    const tickerB = (b.ticker || b.symbol || b.name || "")
      .toString()
      .toUpperCase();
    const networkA = (a.network || "").toString().toLowerCase();
    const networkB = (b.network || "").toString().toLowerCase();

    // Priority 1: USDT on BSC
    if (
      tickerA === "USDT" &&
      networkA === "bsc" &&
      !(tickerB === "USDT" && networkB === "bsc")
    ) {
      return -1;
    }
    if (
      tickerB === "USDT" &&
      networkB === "bsc" &&
      !(tickerA === "USDT" && networkA === "bsc")
    ) {
      return 1;
    }
    // Priority 2: USDC on BSC
    if (
      tickerA === "USDC" &&
      networkA === "bsc" &&
      !(tickerB === "USDC" && networkB === "bsc")
    ) {
      return -1;
    }
    if (
      tickerB === "USDC" &&
      networkB === "bsc" &&
      !(tickerA === "USDC" && networkA === "bsc")
    ) {
      return 1;
    }
    // Default: preserve original order (no change)
    return 0;
  });

  // Calculate fees and amounts - Network fee is always 0 for BEP20
  const networkFee = 0;
  
  // Use flat $2 fee for USDT/USDC, percentage for other assets
  let commissionAmount = 0;
  if (selectedAsset && isSimpleCalculationAsset(selectedAsset)) {
    // For USDT/USDC, only apply $2 fee if amount is $2 or more
    commissionAmount = payAmount >= 2 ? 2 : 0; // Flat $2 fee for USDT/USDC (only if amount >= $2)
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

    // Set calculating state immediately
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
          // Calculate from pay amount to receive amount
      if (isSimpleCalculationAsset(selectedAsset)) {
        // Simple calculation for USDT/USDC
        let calculatedGetAmount;
            if (fromAmount < 2) {
              calculatedGetAmount = fromAmount;
        } else {
              const commissionAmount = 2;
          const networkFee = 0;
          const totalFees = networkFee + commissionAmount;
              calculatedGetAmount = Math.max(0, fromAmount - totalFees);
            }
            
            setGetAmount(calculatedGetAmount);
            setGetAmountInput(calculatedGetAmount.toString());
            
            // Validate the calculated amount
            const validationError = validateReceiveAmount(calculatedGetAmount, selectedAsset);
        setReceiveAmountError(validationError);
        
        // Show info modal if receive amount exceeds $5,000
            if (calculatedGetAmount > 5000) {
          setIsInfoModalOpen(true);
              setHasAcknowledgedLimit(false);
        }
               } else {
           // For other assets, ONLY use API estimate - no manual calculations
           if (estimate && !estimateLoading && estimate.estimated_amount !== undefined) {
             const finalAmount = Math.max(0, estimate.estimated_amount);
             setGetAmount(finalAmount);
             setGetAmountInput(finalAmount.toString());
             
             const validationError = validateReceiveAmount(finalAmount, selectedAsset);
             setReceiveAmountError(validationError);
             
             if (finalAmount > 5000) {
               setIsInfoModalOpen(true);
               setHasAcknowledgedLimit(false);
             }
           } else if (estimateLoading) {
             // Show loading state while estimate is being fetched
             setIsCalculating(true);
             setIsCalculatingReceive(true);
             // Don't update amounts yet, wait for estimate
           } else {
             // For non-USDT/USDC assets, only show loading until API estimate is available
             // Don't do manual calculations - wait for API
             setIsCalculating(true);
             setIsCalculatingReceive(true);
           }
         }
                             } else {
             // Calculate from receive amount to pay amount - ONLY update pay amount, don't reload input
             if (isSimpleCalculationAsset(selectedAsset)) {
               let newPayAmount;
               if (fromAmount < 2) {
                 newPayAmount = fromAmount;
               } else {
                 const commissionAmount = 2;
                 const networkFee = 0;
                 const totalFees = networkFee + commissionAmount;
                 newPayAmount = Math.max(0, fromAmount + totalFees);
               }
               setPayAmount(newPayAmount);
               // Don't update payAmountInput to avoid reloading the input field
             } else {
               // For non-USDT/USDC assets, we need to fetch estimate for reverse calculation
               // This is more complex as we need to find the pay amount that gives us the desired receive amount
               // For now, show loading state and let user adjust the pay amount instead
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
    }, 300); // 300ms debounce

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (calculationTimeout) {
        clearTimeout(calculationTimeout);
      }
    };
  }, [calculationTimeout]);

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
  

    if (!selectedAsset) {
    
      return false;
    }
    if (!payAmount) {
      return false;
    }
    
    // Allow any amount including negative values
    // No validation for negative amounts
    if (selectedPaymentDetails.length === 0) {
    
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

      // Reset transaction state at the beginning
      setIsTransactionSubmitted(false);

      try {
        // Create withdrawal payload for express API
        const withdrawalPayload: ExpressWithdrawalPayload = {
          asset: selectedAsset.ticker?.toUpperCase() || selectedAsset.symbol?.toUpperCase(),
          amount: payAmount.toString(),
          network:
            selectedNetwork?.network_id ||
            selectedNetwork?.network_type ||
            selectedAsset.network,
          user_payment_detail_id: selectedPaymentDetails[0].id,
        };

       

        // Submit to express withdrawal API
       
        const withdrawalResponse = await createExpressWithdrawal(
          withdrawalPayload
        );

       

        // Handle different response types based on asset
        const isSimpleAsset = isSimpleCalculationAsset(selectedAsset);
       

        // Ensure we have a valid response
        if (!withdrawalResponse) {
          throw new Error("No response received from server");
        }

        if (isSimpleAsset) {
          // Direct transfer response for USDT/USDC
          const directTransferResponse = withdrawalResponse as any;
          

          if (directTransferResponse.data?.type === "direct_transfer") {
           
            // For direct transfer, withdrawal_address is in data object
            const withdrawalAddress =
              directTransferResponse.data?.withdrawal_address || "";
           

            const extractedWebsocketUrl =
              directTransferResponse.data?.websocket_url || "";
           

            setWithdrawalAddress(withdrawalAddress);
            setPayoutAddress(""); // No payout address for direct transfer
            setWebsocketUrl(extractedWebsocketUrl);
            setTransactionId(directTransferResponse.data?.transaction_id || "");
            setQrCodeUrl(
              withdrawalAddress
                ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${withdrawalAddress}`
                : ""
            );
            setResponseMessage(
              directTransferResponse.data?.message ||
                "Transaction submitted successfully"
            );
           
            setIsTransactionSubmitted(true);
            setForceUpdate((prev) => prev + 1); // Force re-render
            showToast.success("Withdrawal request submitted successfully!");
           

            // Small delay to ensure state updates are processed
            setTimeout(() => {
             
            }, 100);
          } else {
           
            // Handle unexpected response type
            const withdrawalAddress =
              directTransferResponse.data?.withdrawal_address || "";
           

            const extractedWebsocketUrl =
              directTransferResponse.data?.websocket_url || "";
           

            setWithdrawalAddress(withdrawalAddress);
            setPayoutAddress("");
            setWebsocketUrl(extractedWebsocketUrl);
            setTransactionId(directTransferResponse.data?.transaction_id || "");
            setQrCodeUrl(
              withdrawalAddress
                ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${withdrawalAddress}`
                : ""
            );
            setResponseMessage(
              directTransferResponse.data?.message ||
                "Transaction submitted successfully"
            );
            setIsTransactionSubmitted(true);
            setForceUpdate((prev) => prev + 1);
            showToast.success("Withdrawal request submitted successfully!");

            // Small delay to ensure state updates are processed
            setTimeout(() => {
             
            }, 100);
          }
        } else {
          // ChangeNow swap response for other assets
          const changeNowResponse = withdrawalResponse as any;
         

          if (changeNowResponse.data?.type === "changenow_swap") {
           
            // For ChangeNow, withdrawal_address is in data.details object
            const withdrawalAddress =
              changeNowResponse.data?.details?.withdrawal_address || "";
           

            const extractedWebsocketUrl =
              changeNowResponse.data?.websocket_url || "";


            setWithdrawalAddress(withdrawalAddress);
            setPayoutAddress(
              changeNowResponse.data?.details?.payout_address || ""
            );
            setWebsocketUrl(extractedWebsocketUrl);
            setTransactionId(changeNowResponse.data?.transaction_id || "");
            setQrCodeUrl(
              withdrawalAddress
                ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${withdrawalAddress}`
                : ""
            );
            setResponseMessage(
              changeNowResponse.data?.message ||
                "Transaction submitted successfully"
            );
           
            setIsTransactionSubmitted(true);
            setForceUpdate((prev) => prev + 1); // Force re-render
            showToast.success("Withdrawal request submitted successfully!");

            // Small delay to ensure state updates are processed
            setTimeout(() => {
             
            }, 100);
          } else {
            // Handle unexpected response type for non-simple assets
            const withdrawalAddress =
              changeNowResponse.data?.details?.withdrawal_address || "";
           

            const extractedWebsocketUrl =
              changeNowResponse.data?.websocket_url || "";
           

            setWithdrawalAddress(withdrawalAddress);
            setPayoutAddress(
              changeNowResponse.data?.details?.payout_address || ""
            );
            setWebsocketUrl(extractedWebsocketUrl);
            setTransactionId(changeNowResponse.data?.transaction_id || "");
            setQrCodeUrl(
              withdrawalAddress
                ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${withdrawalAddress}`
                : ""
            );
            setResponseMessage(
              changeNowResponse.data?.message ||
                "Transaction submitted successfully"
            );
            setIsTransactionSubmitted(true);
            setForceUpdate((prev) => prev + 1);
            showToast.success("Withdrawal request submitted successfully!");

            // Small delay to ensure state updates are processed
            setTimeout(() => {
             
            }, 100);
          }
        }

        // Final fallback: if we reach here, the API call was successful
        // but we didn't match any expected response type
        if (!isTransactionSubmitted) {
         

          // Try to extract data based on response type
          const response = withdrawalResponse as any;
          let withdrawalAddress = "";
          let extractedWebsocketUrl = "";

          if (response.data?.type === "direct_transfer") {
            // Direct transfer: withdrawal_address in data object
            withdrawalAddress = response.data?.withdrawal_address || "";
            extractedWebsocketUrl = response.data?.websocket_url || "";
           
          } else if (response.data?.type === "changenow_swap") {
            // ChangeNow: withdrawal_address in data.details
            withdrawalAddress =
              response.data?.details?.withdrawal_address || "";
            extractedWebsocketUrl = response.data?.websocket_url || "";
           
          } else {
            // Unknown type, try both locations
            withdrawalAddress =
              response.data?.withdrawal_address ||
              response.data?.details?.withdrawal_address ||
              "";
            extractedWebsocketUrl = response.data?.websocket_url || "";
           
          }

         

          setWithdrawalAddress(withdrawalAddress);
          setPayoutAddress("");
          setWebsocketUrl(extractedWebsocketUrl);
          setTransactionId(response.data?.transaction_id || "");
          setQrCodeUrl(
            withdrawalAddress
              ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${withdrawalAddress}`
              : ""
          );
          setResponseMessage("Transaction submitted successfully");
          setIsTransactionSubmitted(true);
          setForceUpdate((prev) => prev + 1);
          showToast.success("Withdrawal request submitted successfully!");

          // Small delay to ensure state updates are processed
          setTimeout(() => {
           
          }, 100);
        }
      } catch (error: any) {
       
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
        // Reset transaction state on error
        setIsTransactionSubmitted(false);
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

    if (selectedPaymentDetails.length === 0) {
      errors.push("Please select at least one payment method");
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
          asset: selectedAsset.ticker?.toUpperCase() || selectedAsset.symbol?.toUpperCase(),
          amount: payAmount.toString(),
          network:
            selectedNetwork?.network_id ||
            selectedNetwork?.network_type ||
            selectedAsset.network,
          user_payment_detail_id: selectedPaymentDetails[0].id, // Use first selected payment detail
        };

       

        // Submit to express withdrawal API
        const withdrawalResponse = await createExpressWithdrawal(
          withdrawalPayload
        );

       

        // Handle different response types based on asset
        const isSimpleAsset = isSimpleCalculationAsset(selectedAsset);

        if (isSimpleAsset) {
          // Direct transfer response for USDT/USDC
          const directTransferResponse = withdrawalResponse as any;
         

          if (directTransferResponse.type === "direct_transfer") {
            showToast.success("Withdrawal request submitted successfully!");

            if (onExchange) {
              const transactionData = {
                type: "withdrawal" as const,
                amount: payAmount,
                asset: selectedAsset,
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
              showToast.success("Withdrawal request submitted successfully!");
            }
          }
        } else {
          // ChangeNow swap response for other assets
          const changeNowResponse = withdrawalResponse as any;
         

          if (changeNowResponse.data?.type === "changenow_swap") {
            showToast.success("Withdrawal request submitted successfully!");

            if (onExchange) {
              const transactionData = {
                type: "withdrawal" as const,
                amount: payAmount,
                asset: selectedAsset,
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
              showToast.success("Withdrawal request submitted successfully!");
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
            asset: selectedAsset,
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
    <div className="w-full min-h-screen flex flex-col justify- bg-[#18181f]">
      <h2 className="text-xl font-bold mb-2 text-[#788099]">
        <span className="text-[#7e7e8f]">1-</span> Transaction Info
      </h2>
      <div className="w-full max-w-4xl mx-auto text-white">
        {/* Top Section - You Send and You Get in one card */}
        <div className="relative mb-4">
          {/* Top Card Container */}
          <div className="flex border border-[#39394a] rounded-2xl p-4">
            {/* You Send Section */}
            <div className="flex-1 pr-4">
              <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                You Send
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
                      setPayAmountInput(inputValue);
                      
                      // Convert to number for calculations
                      const parsedValue = inputValue === "" ? 0 : parseFloat(inputValue) || 0;
                      
                      const newValue = parsedValue;
                      setPayAmount(newValue);
                      setIsCalculatingFromPay(true);
                      
                      // Only calculate if we have a valid amount and asset
                      if (selectedAsset && newValue >= 0) {
                        // For estimate-based assets, ensure estimate is fetched
                        if (!isSimpleCalculationAsset(selectedAsset) && newValue > 0) {
                          // Set pay amount to trigger estimate fetch
                          setPayAmount(newValue);
                          // Show loading state immediately
                          setIsCalculating(true);
                          setIsCalculatingReceive(true);
                        } else {
                          // For simple assets, calculate immediately
                          calculateAmounts(newValue, true);
                        }
                      } else {
                        // Clear receive amount if no valid input
                        setGetAmount(0);
                        setGetAmountInput("0");
                        setReceiveAmountError(null);
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
                  placeholder={(isCalculating || isCalculatingReceive) ? "Calculating..." : "Enter amount"}
                  className={`w-full bg-[#1D1D23] rounded-2xl px-4 py-2 pr-16 text-lg text-white focus:outline-none border appearance-none ${
                    (isCalculating || isCalculatingReceive) ? 'border-[#1D8751]' : 'border-[#39394a]'
                  }`}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-white text-sm font-medium">
                    {selectedAsset ? ((selectedAsset.ticker || selectedAsset.symbol || "USDT").toUpperCase()) : "USDT"}
                  </span>
                </div>
                {(isCalculatingReceive || isCalculating) && isCalculatingFromPay && (
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D8751]"></div>
                  </div>
                )}
              </div>
            </div>

            {/* You Get Section */}
            <div className="flex-1 pl-4">
              <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                Asset
              </label>
              <div className="relative" ref={assetDropdownRef}>
                <div
                  className={`w-full bg-[#1D1D23] rounded-2xl px-4 py-2 text-lg text-white focus:outline-none border border-[#39394a] flex items-center justify-between cursor-pointer`}
                  onClick={() => {
                    setIsAssetDropdownOpen(!isAssetDropdownOpen);
                  }}
                >
                  <div className="flex items-center gap-3">
                    {selectedAsset ? (
                      <>
                        <img
                          src={
                            selectedAsset.image_url ||
                            selectedAsset.asset_image ||
                            selectedAsset.icon_url ||
                            selectedAsset.image ||
                            "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                          }
                          alt={selectedAsset.name || selectedAsset.ticker || "Asset"}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            console.log("Image failed to load for asset:", selectedAsset);
                            e.currentTarget.src =
                              "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                          }}
                        />
                        <span className="text-white">
                          {(selectedAsset.ticker ||
                            selectedAsset.symbol ||
                            selectedAsset.name ||
                            "Unknown").toUpperCase()}
                        </span>
                        <span className="ml-2 bg-[#1D8751] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                          {selectedAsset.network || "Unknown"}
                        </span>
                      </>
                    ) : (
                      <>
                        <img
                          src="https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                          alt="asset icon"
                          className="w-6 h-6"
                        />
                        <span className="text-[#7e7e8f]">
                          {swapAssetsLoading
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
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1D1D23] border border-[#39394a] rounded-2xl z-50 max-h-80 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-3 border-b border-[#39394a]">
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7e7e8f] w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search assets..."
                          value={assetSearchTerm}
                          onChange={(e) => setAssetSearchTerm(e.target.value)}
                          className="w-full bg-[#23232b] rounded-xl px-10 py-2 text-white text-sm focus:outline-none border border-[#39394a]"
                        />
                      </div>
                    </div>

                    {/* Asset List */}
                    <div className="max-h-60 overflow-y-auto">
                      {sortedSwapAssets.length > 0 ? (
                        sortedSwapAssets.map((asset: SupportedAsset, index: number) => (
                          <div
                            key={`${asset.asset_id}-${asset.ticker}-${asset.network}-${index}`}
                            className="flex items-center gap-3 p-3 hover:bg-[#23232b] cursor-pointer border-b border-[#39394a] last:border-b-0"
                            onClick={() => {
                              console.log("Asset selected:", asset);
                              setSelectedAsset(asset);
                              setIsAssetDropdownOpen(false);
                              setAssetSearchTerm("");
                              
                              // Trigger recalculation if there's an existing pay amount
                              if (payAmount > 0) {
                                setIsCalculatingFromPay(true);
                                if (isSimpleCalculationAsset(asset)) {
                                  calculateAmounts(payAmount, true);
                                } else {
                                  // For estimate-based assets, the estimate useEffect will handle it
                                  setIsCalculating(true);
                                  setIsCalculatingReceive(true);
                                }
                              }
                            }}
                          >
                            <img
                              src={
                                asset.image_url ||
                                asset.asset_image ||
                                "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                              }
                              alt={asset.name}
                              className="w-6 h-6 rounded-full"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                              }}
                            />
                            <div className="flex-1">
                              <div className="text-white font-medium flex items-center gap-2">
                                {(asset.ticker ||
                                  asset.symbol ||
                                  asset.name ||
                                  "Unknown").toUpperCase()}
                                <span className="bg-[#1D8751] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                  {asset.network || "Unknown"}
                                </span>
                              </div>
                              <div className="text-[#7e7e8f] text-sm">
                                {asset.name ||
                                  (asset.ticker || "").toUpperCase() ||
                                  (asset.symbol || "").toUpperCase() ||
                                  "Unknown Asset"} 
                                  {asset.legacy_ticker && (
                                    <span className="text-xs text-[#f7c624] bg-[#f7c6241a] px-1 py-0.5 rounded-full">
                                      {asset.legacy_ticker}
                                    </span>
                                  )}
                              </div>
                            </div>
                            {selectedAsset?.asset_id === asset.asset_id && (
                              <div className="w-2 h-2 bg-[#1D8751] rounded-full"></div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-[#7e7e8f]">
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
              className="w-16 h-16 bg-transparent rounded-full flex items-center justify-center hover:bg-[#23232b]/10 transition-colors shadow-lg"
              onClick={() => {
                // Switch between deposit and withdrawal modes
                if (onModeChange) {
                  onModeChange(mode === "deposit" ? "withdrawal" : "deposit");
                }
              }}
            >
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1755500509/Frame_36261_ledmyw.png"
                alt="swap icon"
                className="w-12 h-12"
              />
            </button>
          </div>
        </div>

        {/* Bottom Section - You Receive and Bank/Payment Method in one card */}
        <div className="relative mb-3">
          <div className="flex border border-[#39394a] rounded-2xl p-4">
            {/* You Receive Section */}
            <div className="flex-1 pr-4">
              <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                You Receive
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={getAmountInput}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    
                    // Allow any numeric input including negative numbers and 0
                    if (inputValue === "" || /^-?\d*\.?\d*$/.test(inputValue)) {
                      setGetAmountInput(inputValue);
                      
                      // Convert to number for calculations
                      const parsedValue = inputValue === "" ? 0 : parseFloat(inputValue) || 0;
                      
                      const newValue = parsedValue;
                      setGetAmount(newValue);
                      setIsCalculatingFromPay(false);
                      
                      // Only calculate if we have a valid amount and asset
                      if (selectedAsset && newValue >= 0) {
                        // For non-USDT/USDC assets, reverse calculation is complex
                        // We should encourage users to adjust the "You Send" amount instead
                        if (isSimpleCalculationAsset(selectedAsset)) {
                          calculateAmounts(newValue, false);
                        } else {
                          // For estimate-based assets, show message that they should adjust "You Send"
                          setReceiveAmountError("Please adjust the 'You Send' amount for accurate calculations");
                          setIsCalculating(true);
                          setIsCalculatingReceive(true);
                        }
                      } else {
                        // Clear pay amount if no valid input
                        setPayAmount(0);
                        setPayAmountInput("0");
                        setReceiveAmountError(null);
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
                      const validationError = validateReceiveAmount(currentValue, selectedAsset);
                      setReceiveAmountError(validationError);
                    }
                  }}
                  placeholder={(isCalculating || isCalculatingReceive) ? "Calculating..." : "Enter amount"}
                  className={`w-full bg-[#1D1D23] rounded-2xl px-4 py-2 pr-16 text-lg text-white focus:outline-none border appearance-none ${
                    receiveAmountError ? 'border-red-500' : (isCalculating || isCalculatingReceive) ? 'border-[#1D8751]' : 'border-[#39394a]'
                  }`}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-white text-sm font-medium">
                    USD
                  </span>
                </div>
                {(isCalculatingReceive || isCalculating) && (
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D8751]"></div>
                  </div>
                )}
                {receiveAmountError && (
                  <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="text-red-500"/>
                      <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-red-500"/>
                      <circle cx="12" cy="16" r="1" fill="currentColor" className="text-red-500"/>
                    </svg>
                  </div>
                )}
              </div>
              {receiveAmountError && (
                <p className="text-red-500 text-sm mt-1">{receiveAmountError}</p>
              )}
            </div>

            {/* Bank/Payment Method Section */}
            <div className="flex-1 pl-4">
              <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                Bank/Payment Method
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
                    console.log("DEBUG: Selected bank:", e.target.value);
                    console.log(
                      "DEBUG: Available adminPaymentDetails:",
                      adminPaymentDetails
                    );
                    const selectedPayment = adminPaymentDetails?.find(
                      (payment: any) => payment.provider_name === e.target.value
                    );
                    console.log("DEBUG: Selected payment:", selectedPayment);
                    setPayBank(e.target.value);
                    setSelectedPaymentDetail(selectedPayment || null);
                    // Clear selected payment details when changing bank
                    setSelectedPaymentDetails([]);
                  }}
                  className="w-full bg-[#1D1D23] rounded-2xl px-9 py-2 text-lg text-white focus:outline-none border border-[#39394a] appearance-none cursor-pointer relative"
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
                      : adminPaymentDetails?.length === 0
                      ? "No payment methods available"
                      : "Select Payment Method"}
                  </option>
                  <option value="test">Test Payment Method</option>
                  {adminPaymentDetails?.map((payment: any, index: number) => (
                    <option key={index} value={payment.provider_name}>
                      {payment.provider_name} - {payment.payment_method}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

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
                          }
                        }}
                        className="w-full bg-[#1D1D23] rounded-2xl px-9 py-2 text-lg text-white focus:outline-none border border-[#39394a] appearance-none cursor-pointer relative"
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
                Commission: {selectedAsset && isSimpleCalculationAsset(selectedAsset) ? `$2 flat fee` : `${selectedAsset?.range_commissions?.[0]?.commission || 2}% of $${payAmount}`} = $
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
          <div className="flex items-center rounded-2xl px-4 py-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path d="M12 8v4m0 4h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
                </svg>
              </div>
              <span className="text-white text-sm font-medium">
                This is only an estimated price based on current market rates. The final price will be confirmed when we receive the funds.
              </span>
            </div>
          </div>



          {/* Warning message for amounts over $5,000 */}
          {getAmount > 5000 && !hasAcknowledgedLimit && (
            <div className="flex items-center text-yellow-400 text-[14px] font-medium bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 mb-4">
              <FaExclamationCircle className="mr-2 text-yellow-400" />
              <span>
                Amount exceeds $5,000. Please review the information above and acknowledge to proceed.
              </span>
            </div>
          )}

          {/* Submit Button for First Card */}
          <div className="mt-4">
         { isTransactionSubmitted ? "":
          <button
                     className={`w-full text-white text-base font-medium py-2 rounded-2xl flex items-center justify-center gap-2 transition-colors ${
             isSubmitting || isTransactionSubmitted || isInfoModalOpen || (getAmount > 5000 && !hasAcknowledgedLimit)
               ? "bg-gray-500 cursor-not-allowed"
               : "bg-[#1D8751] hover:bg-[#166b3e]"
           }`}
           onClick={handleFirstCardSubmit}
           disabled={isSubmitting || isTransactionSubmitted || isInfoModalOpen || (getAmount > 5000 && !hasAcknowledgedLimit)}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
                src="https://res.cloudinary.com/pitz/image/upload/v1752429993/Express_1_ggdxth.png"
                alt=""
              />
              <img
                className="mt-2"
                src="https://res.cloudinary.com/pitz/image/upload/v1752244135/Group_5_gkxzdz.png"
                alt=""
              />
            </span>
          )}
        </button>
}   
          </div>
        </div>

        {/* Wallet Address Section - shown after transaction submission */}
        {isTransactionSubmitted && (
          <div
            key={`wallet-section-${forceUpdate}`}
            className="mb-6 flex flex-col gap-3 max-w-4xl mx-auto w-full px-2"
          >
            <h2 className="text-xl font-bold mb-2 text-[#788099]">
              <span className="text-[#7e7e8f]">2-</span> Wallet Address
            </h2>
            <div className="bg-[#23232b] border-2 border-[#35353E] rounded-2xl p-5 shadow-lg w-full text-white">
              {/* USDT Wallet Address */}
              <div className="mb-4">
                <h3 className="text-white font-semibold mb-2">
                  USDT Wallet Address
                </h3>
                {withdrawalAddress ? (
                  <div className="bg-[#1D1D23] border border-[#1D8751] rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-mono break-all">
                        {withdrawalAddress}
                      </span>
                      <div className="flex items-center gap-2">
                        <button className="text-[#788099] hover:text-white transition-colors">
                          <svg
                            width="18"
                            height="18"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M12 3v12l4-4-4-4"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(withdrawalAddress);
                            showToast.success("Wallet address copied!");
                          }}
                          className="flex items-center gap-1 bg-[#23232b] border border-[#1D8751] text-[#1D8751] rounded-full px-4 py-1 font-semibold text-base hover:bg-[#1D8751] hover:text-white transition-colors"
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
                  </div>
                ) : (
                  <div className="bg-[#1D8751]/10 border border-[#1D8751] rounded-xl p-4">
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
                <div className="bg-[#1D1D23] border border-[#39394a] rounded-xl p-4 flex justify-center">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="flex flex-col items-center justify-center w-48 h-48 text-[#788099]">
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
                <p className="text-center text-[#788099] text-sm mt-2">
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
                  <span className="text-base font-semibold text-[#7e7e8f]">
                    Terms and Conditions Summary
                  </span>
                </div>
                <div className="bg-[#23232b] border border-[#1D8751] rounded-xl p-4">
                  <ul className="list-none space-y-2">
                    <li className="flex items-start">
                      <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] inline-block mr-3"></span>
                      <span className="text-white text-sm">
                        Please send the money from your own account Only
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] inline-block mr-3"></span>
                      <span className="text-white text-sm">
                        Put transaction ID in the description field of the bank
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] inline-block mr-3"></span>
                      <span className="text-white text-sm">
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
                    className="mt-1 mr-3 w-4 h-4 text-[#1D8751] bg-[#1D1D23] border-[#39394a] rounded focus:ring-[#1D8751] focus:ring-2"
                  />
                  <span className="text-white text-sm">
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
              <div className="flex items-center text-white text-[16px] font-semibold">
                <FaExclamationCircle className="mr-2 text-red-500" />
                <span>
                  This is only an estimated price based on current market rates.
                  The final price will be confirmed when we receive the funds.
                </span>
              </div>
              
              {/* Warning message for amounts over $5,000 */}
              {getAmount > 5000 && !hasAcknowledgedLimit && (
                <div className="flex items-center text-yellow-400 text-[14px] font-medium bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3">
                  <FaExclamationCircle className="mr-2 text-yellow-400" />
                  <span>
                    Amount exceeds $5,000. Please review the information above and acknowledge to proceed.
                  </span>
                </div>
              )}
              <button
                className={`w-full text-white text-base font-medium py-2 rounded-2xl flex items-center justify-center gap-2 transition-colors ${
                  isSubmitting || isInfoModalOpen || (getAmount > 5000 && !hasAcknowledgedLimit)
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-[#1D8751] hover:bg-[#166b3e]"
                }`}
                onClick={() => {
                  // Navigate to exchanging page with websocket URL
                  if (onExchange) {
                    const transactionData = {
                      type: "withdrawal" as const,
                      amount: payAmount,
                      asset: selectedAsset,
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
                disabled={isSubmitting || isInfoModalOpen || (getAmount > 5000 && !hasAcknowledgedLimit)}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center">
                    <img
                      src="https://res.cloudinary.com/pitz/image/upload/v1752429993/Express_1_ggdxth.png"
                      alt=""
                    />
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
          <div className="max-w-4xl mx-auto w-full px-2 mb-4">
            <div className="bg-red-500/10 border border-red-500 rounded-2xl p-4">
              <h3 className="text-red-500 font-semibold mb-2">
                Please fix the following errors:
              </h3>
              <ul className="list-disc list-inside text-red-400 space-y-1">
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
            // Refresh user payment details after adding
            dispatch(fetchUserPaymentDetails());
            showToast.success("Payment method added successfully!");
          }}
        />

        {/* InfoModal */}
        <InfoModal
          isOpen={isInfoModalOpen}
          onClose={() => {
            setIsInfoModalOpen(false);
            setHasAcknowledgedLimit(true); // User has seen the warning
          }}
          onContactUs={() => {
            // Handle contact us action - you can customize this
            window.open('https://wa.me/your-whatsapp-number', '_blank');
            setIsInfoModalOpen(false);
            setHasAcknowledgedLimit(true); // User has seen the warning
          }}
        />
      </div>
  );
}
