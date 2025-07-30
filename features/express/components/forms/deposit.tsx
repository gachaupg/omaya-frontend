"use client";
import React, { useEffect, useState, useRef } from "react";
import { FaExchangeAlt, FaExclamationCircle } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../../store";
import { fetchAdminPaymentDetails } from "../../../exchange/slices/paymentSlice";
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

interface DepositFormProps {
  onExchange?: (transactionData: {
    type: "deposit";
    amount: number;
    asset: any;
    paymentDetail: any;
    walletAddress: string;
    network: any;
  }) => void;
  mode: "deposit" | "withdrawal";
  onModeChange?: (mode: "deposit" | "withdrawal") => void;
}

export default function DepositForm({
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

  const [payAmount, setPayAmount] = useState(0);
  const [payBank, setPayBank] = useState("");
  const [getAmount, setGetAmount] = useState(0);
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

  // Generate transaction code on mount
  useEffect(() => {
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setTransactionCode(code);
  }, []);

  useEffect(() => {
    dispatch(fetchAdminPaymentDetails())
      .unwrap()
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

  // Fetch swap assets
  useEffect(() => {
    dispatch(fetchSupportedAssets())
      .unwrap()
      .catch((error: unknown) => {
        showToast.error(`Failed to fetch swap assets: ${error}`);
      });
  }, [dispatch]);

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
        fromCurrency: selectedAsset.ticker,
        fromNetwork: selectedAsset.network,
        toCurrency: "USDT",
        toNetwork: "BSC",
        amount: payAmount,
      });

      dispatch(
        fetchSwapEstimate({
          fromCurrency: selectedAsset.ticker,
          fromNetwork: selectedAsset.network,
          toCurrency: "USDT", // Always USDT for deposits
          toNetwork: "BSC", // Always BSC for deposits
          amount: payAmount,
        })
      )
        .then((result) => {
          console.log("Estimate result:", result);
          if (result.payload) {
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
      const ticker = asset.ticker?.toLowerCase() || "";
      const searchTerm = assetSearchTerm.toLowerCase();

      return (
        name.includes(searchTerm) ||
        symbol.includes(searchTerm) ||
        ticker.includes(searchTerm)
      );
    }) || [];

  // Sort assets: USDT on BSC, USDC on BSC, then rest in original order
  const sortedSwapAssets = [...filteredSwapAssets].sort((a, b) => {
    // Ensure tickers exist and are strings (using ticker as primary, fallback to symbol/name)
    const tickerA = (a.ticker || a.symbol || a.name || "")
      .toString()
      .toLowerCase();
    const tickerB = (b.ticker || b.symbol || b.name || "")
      .toString()
      .toLowerCase();
    const networkA = (a.network || "").toString().toLowerCase();
    const networkB = (b.network || "").toString().toLowerCase();

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
  // Use default commission rate for swap assets (can be updated based on asset type)
  const commissionRate = selectedAsset?.range_commissions?.[0]?.commission
    ? parseFloat(selectedAsset.range_commissions[0].commission)
    : 2; // Default 2% commission for swap assets
  const commissionAmount = (payAmount * commissionRate) / 100;
  const totalFees = networkFee + commissionAmount;

  // Debug logging
  console.log("Selected Asset:", selectedAsset);
  console.log("Commission Rate:", commissionRate);
  console.log("Commission Amount:", commissionAmount);
  console.log("Pay Amount:", payAmount);
  console.log("Estimate:", estimate);

  // Update getAmount when estimate is received or for simple calculation assets
  useEffect(() => {
    if (selectedAsset && payAmount > 0) {
      if (isSimpleCalculationAsset(selectedAsset)) {
        // Simple calculation for USDT/USDC
        const commissionRate = selectedAsset?.range_commissions?.[0]?.commission
          ? parseFloat(selectedAsset.range_commissions[0].commission)
          : 2;
        const commissionAmount = (payAmount * commissionRate) / 100;
        const networkFee = 0;
        const totalFees = networkFee + commissionAmount;
        const calculatedGetAmount = payAmount - totalFees;

        // Auto-populate for simple calculation assets
        if (isCalculatingFromPay) {
          setGetAmount(calculatedGetAmount);
        }
      } else if (
        estimate &&
        !estimateLoading &&
        estimate.estimated_amount !== undefined
      ) {
        // Auto-populate for other assets using estimate
        if (isCalculatingFromPay) {
          setGetAmount(estimate.estimated_amount);
        }
      }
    }
  }, [
    selectedAsset,
    payAmount,
    estimate,
    estimateLoading,
    isCalculatingFromPay,
  ]);

  // Update payAmount when getAmount changes (if calculating from get)
  useEffect(() => {
    if (!isCalculatingFromPay && selectedAsset) {
      if (isSimpleCalculationAsset(selectedAsset)) {
        // Simple calculation for USDT/USDC
        const commissionRate = selectedAsset?.range_commissions?.[0]?.commission
          ? parseFloat(selectedAsset.range_commissions[0].commission)
          : 2;
        const commissionAmount = (getAmount * commissionRate) / 100;
        const networkFee = 0;
        const totalFees = networkFee + commissionAmount;
        const newPayAmount = getAmount + totalFees;
        setPayAmount(newPayAmount);
      } else if (estimate && !estimateLoading) {
        // For other assets, we would need to reverse calculate from estimate
        // This is more complex and may require a separate API call
        // For now, we'll use the simple calculation as fallback
        const commissionRate = 2; // Default commission
        const commissionAmount = (getAmount * commissionRate) / 100;
        const networkFee = 0;
        const totalFees = networkFee + commissionAmount;
        const newPayAmount = getAmount + totalFees;
        setPayAmount(newPayAmount);
      }
    }
  }, [
    getAmount,
    selectedAsset,
    estimate,
    estimateLoading,
    isCalculatingFromPay,
  ]);

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

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleFirstCardSubmit = async () => {
    if (validateFirstCard()) {
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
      console.log("DEBUG: Form data being submitted:", {
        payAmount,
        walletAddress,
        selectedPaymentDetail,
        selectedAsset,
        selectedNetwork,
      });

      // Create FormData for API submission
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
        selectedAsset.symbol === "USDT Tether" ? "USDT" : selectedAsset.symbol;
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
      console.log("DEBUG: Complete FormData entries:");
      for (let [key, value] of depositPayload.entries()) {
        console.log(`${key}:`, value);
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

      console.log("DEBUG: Deposit response:", depositResponse);
      console.log(
        "DEBUG: Transaction ID from response:",
        depositResponse.transaction_id
      );
      console.log(
        "DEBUG: WebSocket URL from response:",
        depositResponse.websocket?.url
      );
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
          commission: depositResponse.commission,
          networkFee: depositResponse.network_fee,
          currency: depositResponse.currency,
          websocketUrl: depositResponse.websocket?.url,
        };
        console.log("DEBUG: Calling onExchange with:", transactionData);
        onExchange(transactionData);
      }
    } catch (error: any) {
      console.error("DEBUG: Deposit submission error:", error);
      console.error("DEBUG: Error response:", error.response?.data);
      console.error("DEBUG: Error status:", error.response?.status);

      let errorMessage = "Failed to submit deposit request";

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
    <div className="w-full min-h-screen flex flex-col justify- dark:bg-[#18181f] bg-white">
      <h2 className="text-xl font-bold  mb-2 dark:text-[#788099] text-gray-600">
        <span className="dark:text-[#7e7e8f] text-gray-500">1-</span>{" "}
        Transaction Info
      </h2>
      <div className=" flex items-center justify-center ">
        <div className="dark:bg-[#23232b] bg-white dark:border-[#35353E] border-gray-200 border-2 rounded-2xl p-3 shadow-lg w-full max-w-4xl mx-auto dark:text-white text-gray-900">
          {/* First Row - Amount and Asset */}
          <div className="flex flex-col md:flex-row gap-3 mb-2">
            <div className="flex-1">
              <label className="block text-[17px] dark:text-[#7e7e8f] text-gray-600 mb-2 font-semibold">
                Amount
              </label>
              <input
                type="number"
                value={payAmount || ""}
                onChange={(e) => {
                  setPayAmount(Number(e.target.value));
                  setIsCalculatingFromPay(true);
                }}
                onFocus={() => setIsCalculatingFromPay(true)}
                placeholder="Enter amount"
                className="w-full !bg-white dark:!bg-[#1D1D23] rounded-2xl px-4 py-2 text-lg dark:text-white text-gray-900 focus:outline-none dark:border-[#39394a] border-gray-300 border appearance-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[17px] dark:text-[#7e7e8f] text-gray-600 mb-2 font-semibold">
                Asset
              </label>
              <div className="relative" ref={assetDropdownRef}>
                <div
                  className={`w-full !bg-white dark:!bg-[#1D1D23] rounded-2xl px-4 py-2 text-lg dark:text-white text-gray-900 focus:outline-none dark:border-[#39394a] border-gray-300 border flex items-center justify-between ${
                    !payAmount || payAmount <= 0
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  onClick={() => {
                    if (payAmount && payAmount > 0) {
                      setIsAssetDropdownOpen(!isAssetDropdownOpen);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    {selectedAsset ? (
                      <>
                        <img
                          src={selectedAsset.icon_url || selectedAsset.image}
                          alt={selectedAsset.name}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                          }}
                        />
                        <span className="dark:text-white text-gray-900">
                          {selectedAsset.ticker ||
                            selectedAsset.symbol ||
                            selectedAsset.name ||
                            "Unknown"}
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
                        <span className="dark:text-[#7e7e8f] text-gray-600">
                          {swapAssetsLoading
                            ? "Loading assets..."
                            : !payAmount || payAmount <= 0
                              ? "Enter amount first"
                              : "Select Asset"}
                        </span>
                      </>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 dark:text-[#7e7e8f] text-gray-600 transition-transform ${
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
                  <div className="absolute top-full left-0 right-0 mt-1 dark:bg-[#1D1D23] bg-white dark:border-[#39394a] border-gray-300 border rounded-2xl z-50 max-h-80 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-3 dark:border-b dark:border-[#39394a] border-b border-gray-300">
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 dark:text-[#7e7e8f] text-gray-600 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search assets..."
                          value={assetSearchTerm}
                          onChange={(e) => setAssetSearchTerm(e.target.value)}
                          className="w-full dark:bg-[#23232b] bg-gray-50 rounded-xl px-10 py-2 dark:text-white text-gray-900 text-sm focus:outline-none dark:border-[#39394a] border-gray-300 border"
                        />
                      </div>
                    </div>

                    {/* Asset List */}
                    <div className="max-h-60 overflow-y-auto">
                      {sortedSwapAssets.length > 0 ? (
                        sortedSwapAssets.map((asset: SupportedAsset) => (
                          <div
                            key={asset.id}
                            className="flex items-center gap-3 p-3 dark:hover:bg-[#23232b] hover:bg-gray-50 cursor-pointer dark:border-b dark:border-[#39394a] border-b border-gray-300 last:border-b-0"
                            onClick={() => {
                              setSelectedAsset(asset);
                              setIsAssetDropdownOpen(false);
                              setAssetSearchTerm("");
                            }}
                          >
                            <img
                              src={asset.icon_url || asset.image}
                              alt={asset.name}
                              className="w-6 h-6 rounded-full"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                              }}
                            />
                            <div className="flex-1">
                              <div className="dark:text-white text-gray-900 font-medium flex items-center gap-2">
                                {asset.ticker ||
                                  asset.symbol ||
                                  asset.name ||
                                  "Unknown"}
                                <span className="bg-[#1D8751] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                  {asset.network || "Unknown"}
                                </span>
                              </div>
                              <div className="dark:text-[#7e7e8f] text-gray-600 text-sm">
                                {asset.name ||
                                  asset.ticker ||
                                  asset.symbol ||
                                  "Unknown Asset"}
                              </div>
                            </div>
                            {selectedAsset?.id === asset.id && (
                              <div className="w-2 h-2 bg-[#1D8751] rounded-full"></div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center dark:text-[#7e7e8f] text-gray-600">
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
          {/* Fee & Rate - Dynamic based on selected asset */}
          <div className="flex items-center rounded-2xl dark:border-[#39394a] border-gray-300 border dark:bg-[#23232b] bg-gray-50 px-2 py-2 mb-3">
            <div className="flex flex-col gap-2 flex-1">
              <span className="flex items-center bg-[#F79330] text-white rounded-full px-5 py-1 text-sm font-medium w-fit">
                <span className="w-2 h-2 bg-white rounded-full mr-2 inline-block"></span>
                Network fee: $0
              </span>

              <span className="flex items-center bg-[#1D8751] text-white rounded-full px-5 py-1 text-sm font-medium w-fit">
                <span className="w-2 h-2 bg-white rounded-full mr-2 inline-block"></span>
                Commission: {commissionRate}% of ${payAmount} = $
                {commissionAmount.toFixed(2)}
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
          </div>
          {/* Second Row - You Get Amount and Bank/Payment Method */}
          <div className="flex flex-col md:flex-row gap-3 mb-2">
            <div className="flex-1">
              <label className="block text-[17px] dark:text-[#7e7e8f] text-gray-600 mb-2 font-semibold">
                You Recieve
              </label>
              <input
                type="number"
                value={getAmount || ""}
                onChange={(e) => {
                  setGetAmount(Number(e.target.value));
                  setIsCalculatingFromPay(false);
                }}
                onFocus={() => setIsCalculatingFromPay(false)}
                placeholder="Enter amount"
                className="w-full !bg-white dark:!bg-[#1D1D23] rounded-2xl px-4 py-2 text-lg dark:text-white text-gray-900 focus:outline-none dark:border-[#39394a] border-gray-300 border appearance-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[17px] dark:text-[#7e7e8f] text-gray-600 mb-2 font-semibold">
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
                    const selectedPayment = adminPaymentDetails?.find(
                      (payment: any) => payment.provider_name === e.target.value
                    );
                    setPayBank(e.target.value);
                    setSelectedPaymentDetail(selectedPayment || null);
                  }}
                  disabled={loading}
                  className="w-full !bg-white dark:!bg-[#1D1D23] rounded-2xl px-9 py-2 text-lg dark:text-white text-gray-900 focus:outline-none dark:border-[#39394a] border-gray-300 border appearance-none disabled:opacity-50"
                >
                  <option value="">
                    {loading
                      ? "Loading payment methods..."
                      : "Select Payment Method"}
                  </option>
                  {adminPaymentDetails?.map((payment: any, index: number) => (
                    <option key={index} value={payment.provider_name}>
                      {payment.provider_name} - {payment.payment_method_type}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
          </div>

          {/* Submit Button for First Card */}
          {!isFirstCardSubmitted && (
            <div className="mt-4">
              <button
                className="w-full text-white text-base font-medium py-2 rounded-2xl flex items-center justify-center gap-2 transition-colors bg-[#1D8751] hover:bg-[#166b3e] disabled:opacity-50"
                onClick={handleFirstCardSubmit}
                disabled={
                  isSubmitting ||
                  !selectedAsset ||
                  !payAmount ||
                  !selectedPaymentDetail ||
                  (selectedAsset &&
                    !isSimpleCalculationAsset(selectedAsset) &&
                    estimateLoading)
                }
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
          )}
        </div>
      </div>

      {selectedPaymentDetail && isFirstCardSubmitted && (
        <>
          {/* Payment Details Card */}
          <div
            ref={paymentDetailsRef}
            className="mt-1 mb-2 flex flex-col gap-3"
          >
            <h2 className="text-xl font-bold mb-2 dark:text-[#788099] text-gray-600">
              <span className="dark:text-[#7e7e8f] text-gray-500">2-</span>{" "}
              Payment Details
            </h2>
            <div className="flex-1 dark:bg-[#1D1D23] bg-white rounded-2xl dark:border-[#39394a] border-gray-300 border flex flex-col justify-between p-5 relative min-h-[120px]">
              {/* Bank and logo */}
              <div className="flex items-center justify-between mb-4">
                <span className="dark:text-[#7e7e8f] text-gray-600 text-base font-semibold">
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
                  <span className="dark:text-white text-gray-900 text-base font-semibold">
                    {selectedPaymentDetail.provider_name}
                  </span>
                </div>
              </div>
              <div className="border-t border-dashed dark:border-[#39394a] border-gray-400 mb-2"></div>
              {/* Account Name */}
              <div className="flex items-center justify-between mb-2">
                <span className="dark:text-[#7e7e8f] text-gray-600 text-base font-medium">
                  Account Name :
                </span>
                <span className="dark:text-white text-gray-900 text-base font-medium">
                  {selectedPaymentDetail.account_name}
                </span>
              </div>
              <div className="border-t border-dashed dark:border-[#39394a] border-gray-400 mb-2"></div>
              {/* Account Number */}
              <div className="flex items-center justify-between">
                <span className="dark:text-[#7e7e8f] text-gray-600 text-base font-medium">
                  Account Number :
                </span>
                <div className="flex items-center gap-2">
                  <span className="dark:text-white text-gray-900 text-base font-medium">
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

          {/* All sections below are only shown after payment method is selected */}
          {/* Transaction Code Card - below Payment Details, before Wallet Address */}
          <div className="mb-6 flex flex-col gap-3 max-w-4xl mx-auto w-full px-2">
            <h2 className="text-xl font-bold mb-2 dark:text-[#788099] text-gray-600">
              <span className="dark:text-[#7e7e8f] text-gray-500">3-</span>{" "}
              Transaction Code
            </h2>
            <div className="dark:bg-[#23232b] bg-white dark:border-[#35353E] border-gray-200 border-2 rounded-2xl p-5 shadow-lg w-full dark:text-white text-gray-900">
              {/* Transaction Code Row */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {/* Example transaction code, replace with real code if available */}
                {[...transactionCode].map((digit, idx) => (
                  <span
                    key={idx}
                    className="dark:bg-[#1D1D23] bg-gray-50 rounded-lg px-4 py-2 text-2xl font-bold dark:border-[#39394a] border-gray-300 border tracking-widest"
                  >
                    {digit}
                  </span>
                ))}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(transactionCode);
                    showToast.success("Transaction code copied!");
                  }}
                  className="flex items-center gap-1 dark:bg-[#23232b] bg-gray-50 border border-[#1D8751] text-[#1D8751] rounded-full px-4 py-1 ml-2 font-semibold text-base hover:bg-[#1D8751] hover:text-white transition-colors"
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
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
                  <span className="text-base font-semibold dark:text-[#7e7e8f] text-gray-600">
                    Note
                  </span>
                </div>
                <div className="dark:bg-[#23232b] bg-gray-50 border border-[#1D8751] rounded-xl p-4">
                  <ul className="list-none space-y-2">
                    <li className="flex items-start">
                      <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] inline-block mr-3"></span>
                      <span className="dark:text-white text-gray-900 text-sm">
                        Please write this Transaction Code in the bank message
                        or note section.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] inline-block mr-3"></span>
                      <span className="dark:text-white text-gray-900 text-sm">
                        This helps us process your payment quickly and
                        accurately.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Address Section */}
          <h2 className="text-xl font-bold  mb-2 dark:text-[#788099] text-gray-600">
            <span className="dark:text-[#7e7e8f] text-gray-500">4-</span> Wallet
            Address
          </h2>
          <div className="flex flex-col dark:bg-[#23232b] bg-white dark:border-[#35353E] border-gray-200 border-2 rounded-2xl p-5 shadow-lg w-full max-w-4xl mx-auto dark:text-white text-gray-900 mb-6">
            {/* Wallet/Account Address Label */}
            <label className="block text-[17px] dark:text-[#7e7e8f] text-gray-600 mb-2 font-semibold">
              Wallet/Account Address
            </label>
            {/* Input group */}
            <div className="flex items-center dark:bg-[#23232b] bg-gray-50 dark:border-[#39394a] border-gray-300 border rounded-2xl px-4 py-2 mb-4">
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

                  // Validate immediately as user types
                  if (value.trim() === "") {
                    setWalletError(null);
                  } else if (!selectedAsset) {
                    setWalletError("Please select an asset first");
                  } else {
                    const validation = validateWalletAddress(value, "BEP20");

                    if (!validation.isValid) {
                      const errorMessage =
                        validation.message || "Invalid wallet address format";
                      setWalletError(errorMessage);
                      setForceUpdate((prev) => prev + 1);
                    } else {
                      setWalletError(null);
                      setForceUpdate((prev) => prev + 1);
                    }
                  }
                }}
                placeholder="Paste here your Crypto address"
                className={`flex-1 !bg-transparent border-none outline-none dark:text-white text-gray-900 dark:placeholder-[#788099] placeholder-gray-500 text-base ${
                  walletError
                    ? "border-red-500"
                    : walletAddress.trim() && !walletError
                      ? "border-green-500"
                      : ""
                }`}
              />
              {/* Bookmark icon */}
              <span className="mx-2 dark:text-[#788099] text-gray-600 cursor-pointer">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                    stroke="currentColor"
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
                className="flex items-center gap-1 dark:bg-[#23232b] bg-gray-50 border border-[#1D8751] text-[#1D8751] rounded-full px-4 py-1 ml-2 font-semibold text-base hover:bg-[#1D8751] hover:text-white transition-colors"
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
              <p className="text-green-500 text-sm mt-2 font-medium">
                ✅ Valid BEP20 address
              </p>
            )}

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
              <span className="text-base font-semibold dark:text-[#7e7e8f] text-gray-600">
                Terms and Conditions Summary
              </span>
            </div>
            <div className="dark:bg-[#23232b] bg-gray-50 border border-[#1D8751] rounded-xl p-4">
              <ul className="list-none space-y-2">
                <li className="flex items-start">
                  <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] inline-block mr-3"></span>
                  <span className="dark:text-white text-gray-900 text-sm">
                    Please send the money from your own account Only
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] inline-block mr-3"></span>
                  <span className="dark:text-white text-gray-900 text-sm">
                    Put transaction ID in the description field of the bank
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] inline-block mr-3"></span>
                  <span className="dark:text-white text-gray-900 text-sm">
                    Please note, If you do not follow above conditions, we will
                    reject your transaction and send you back your money.
                  </span>
                </li>
              </ul>
            </div>
          </div>

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

          {/* Disclaimer and Button outside the card */}
          <div className="flex flex-col gap-3 max-w-4xl mx-auto w-full px-2">
            <div className="flex items-center dark:text-white text-gray-900 text-[16px] font-semibold">
              <FaExclamationCircle className="mr-2 text-red-500" />
              <span>
                This is only an estimated price based on current market rates.
                The final price will be confirmed when we receive the funds.
              </span>
            </div>
            <button
              className="w-full text-white text-base font-medium py-2 rounded-2xl flex items-center justify-center gap-2 transition-colors bg-[#1D8751] hover:bg-[#166b3e] disabled:opacity-50"
              onClick={handleSubmit}
              disabled={isSubmitting}
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
        </>
      )}
    </div>
  );
}
