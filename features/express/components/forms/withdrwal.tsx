"use client";
import React, { useEffect, useState, useRef } from "react";
import { FaExchangeAlt, FaExclamationCircle, FaSearch } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../../store";
import { fetchUserPaymentDetails } from "../../../exchange/slices/paymentSlice";
import {
  fetchAssets,
  createWithdrawal,
} from "../../../exchange/slices/exchangeSlice";
import { fetchAdminPaymentMethods } from "../../../p2p/slices/paymentMethodsSlice";
import { fetchWithdrawalAddresses } from "../../../p2p/slices/orderSlice";
import {
  fetchSupportedAssets,
  fetchSwapEstimate,
} from "../../../swap/slices/swapSlice";
import { WithdrawalAddress } from "../../../p2p/types";
import { SupportedAsset } from "../../../swap/types";
import { validateWalletAddress } from "../../../../lib/addressValidaion";
import { showToast } from "../../../../lib/utils/toast";
import UserPaymentSelector, {
  UserPaymentDetail,
} from "../../../p2p/components/ui/p2pdashboard/sections/UserPaymentSelector";
import QRCode from "qrcode";
import { createExpressWithdrawal } from "../../api";
import { ExpressWithdrawalResponse } from "../../types";

// Default BSC address fallback - using a valid BEP20 format
const DEFAULT_BSC_ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

interface WithdrawalFormProps {
  onExchange?: (transactionData: {
    type: "withdrawal";
    amount: number;
    asset: any;
    paymentDetails: any[];
    walletAddress: string;
    network: any;
    transactionId?: string;
  }) => void;
  mode: "deposit" | "withdrawal";
  onModeChange?: (mode: "deposit" | "withdrawal") => void;
}

export default function WithdrawalForm({
  onExchange,
  mode,
  onModeChange,
}: WithdrawalFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const {
    userPaymentDetails,
    loading: paymentLoading,
    error: paymentError,
  } = useSelector((state: any) => state.payment);
  const { assets, loading: assetsLoading } = useSelector(
    (state: any) => state.exchange
  );
  const {
    adminMethods,
    loading: adminLoading,
    error: adminError,
  } = useSelector((state: any) => state.paymentMethods);
  const { getWithdrawalAddresses, getWithdrawalAddressesLoading } = useSelector(
    (state: any) => state.p2pMarket
  );

  // Add swap assets state
  const { supportedAssets: swapAssets, loading: swapAssetsLoading } =
    useSelector((state: any) => state.swap);

  const [payAmount, setPayAmount] = useState(0);
  const [getAmount, setGetAmount] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const [isCalculatingFromPay, setIsCalculatingFromPay] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedBscAddress, setSelectedBscAddress] = useState<string>("");
  const [payBank, setPayBank] = useState("");
  const {
    adminPaymentDetails,
    loading: adminPaymentLoading,
    error: adminPaymentError,
  } = useSelector((state: any) => state.payment);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<any>(null);

  // Payment selection state - same as Adds page
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<
    UserPaymentDetail[]
  >([]);

  // QR Code state
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [showQRCode, setShowQRCode] = useState(false);

  // Asset selection state for search functionality
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [assetSearchTerm, setAssetSearchTerm] = useState("");

  // New state for express withdrawal
  const [withdrawalResponse, setWithdrawalResponse] =
    useState<ExpressWithdrawalResponse | null>(null);
  const [isFirstCardSubmitted, setIsFirstCardSubmitted] = useState(false);

  // Estimate calculation state
  const [estimate, setEstimate] = useState<any>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [debouncedPayAmount, setDebouncedPayAmount] =
    useState<number>(payAmount);

  // All assets now use direct withdrawal
  const isWithdrawalAsset = selectedAsset;

  // Filter user payment details based on selected payment method
  const filteredUserPaymentDetails = payBank
    ? (userPaymentDetails || []).filter(
        (detail: any) => detail.payment_provider_name === payBank
      )
    : userPaymentDetails || [];

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

  // Debug search functionality
  console.log("Search term:", assetSearchTerm);
  console.log("Total swap assets:", swapAssets?.length || 0);
  console.log("Filtered assets:", filteredSwapAssets.length);
  if (assetSearchTerm) {
    console.log("Searching for:", assetSearchTerm);
    console.log(
      "Available assets:",
      swapAssets?.map((a: SupportedAsset) => a.ticker || a.symbol || a.name)
    );
  }

  // Robust Binance network matcher
  const isBinanceNetwork = (network: string) => {
    const n = network.toLowerCase();
    return n === "binance" || n === "bsc" || n === "bep20";
  };

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

  const walletSectionRef = useRef<HTMLDivElement>(null);
  const assetDropdownRef = useRef<HTMLDivElement>(null);
  const [prevPaymentDetailsCount, setPrevPaymentDetailsCount] = useState(0);

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

  // Update debounced amount immediately when payAmount changes
  useEffect(() => {
    setDebouncedPayAmount(payAmount);
  }, [payAmount]);

  // Generate QR code for wallet address
  const generateQRCode = async (address: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(address, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

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

      // Use the actual fetchSwapEstimate API call for withdrawal
      // Note: toCurrency is always "USDT" and toNetwork is always "BSC" for withdrawals
      console.log("Fetching estimate for:", {
        fromCurrency: "USDT",
        fromNetwork: "BSC",
        toCurrency: selectedAsset.ticker,
        toNetwork: selectedAsset.network,
        amount: payAmount,
      });

      dispatch(
        fetchSwapEstimate({
          fromCurrency: "USDT", // Always USDT for withdrawals
          fromNetwork: "BSC", // Always BSC for withdrawals
          toCurrency: selectedAsset.ticker,
          toNetwork: selectedAsset.network,
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

  // No longer need to set destination asset since we use fixed constants

  useEffect(() => {
    dispatch(fetchUserPaymentDetails())
      .unwrap()
      .catch((error: unknown) => {
        showToast.error(`Failed to fetch user payment details: ${error}`);
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

  useEffect(() => {
    dispatch(fetchAdminPaymentMethods())
      .unwrap()
      .catch((error: unknown) => {
        showToast.error(`Failed to fetch admin payment methods: ${error}`);
      });
  }, [dispatch]);

  // Calculate fees and amounts - Network fee is always 0 for BEP20
  const networkFee = 0;
  // Use default commission rate for swap assets (can be updated based on asset type)
  const commissionRate = selectedAsset?.range_commissions?.[0]?.commission
    ? parseFloat(selectedAsset.range_commissions[0].commission)
    : 2; // Default 2% commission for swap assets
  const commissionAmount = (payAmount * commissionRate) / 100;
  const totalFees = networkFee + commissionAmount;
  const calculatedGetAmount = payAmount - totalFees;

  // Update getAmount when payAmount changes (if calculating from pay) - REMOVED, now handled in the estimate effect above

  // Update payAmount when getAmount changes (if calculating from get)
  useEffect(() => {
    if (!isCalculatingFromPay) {
      const newPayAmount = getAmount + totalFees;
      setPayAmount(newPayAmount);
    }
  }, [getAmount, totalFees, isCalculatingFromPay]);

  // Re-validate wallet address when asset changes
  useEffect(() => {
    const addressToValidate = selectedBscAddress || walletAddress;
    if (addressToValidate.trim() && selectedAsset) {
      const validation = validateWalletAddress(
        addressToValidate,
        selectedAsset.network
      );
      if (!validation.isValid) {
        setWalletError(
          validation.message ||
            `Invalid ${selectedAsset.network} wallet address format`
        );
      } else {
        setWalletError(null);
      }
    } else {
      setWalletError(null);
    }
  }, [selectedAsset, walletAddress, selectedBscAddress]);

  // Clear wallet errors when default address is set
  useEffect(() => {
    if (selectedBscAddress === DEFAULT_BSC_ADDRESS) {
      setWalletError(null);
    }
  }, [selectedBscAddress]);

  // Generate QR code when selected address changes
  useEffect(() => {
    if (selectedBscAddress) {
      generateQRCode(selectedBscAddress);
    }
  }, [selectedBscAddress]);

  // Payment selection handlers - same as Adds page
  const handleSelectPaymentDetail = (detail: UserPaymentDetail) => {
    setSelectedPaymentDetails((prev) =>
      prev.some((d) => d.id === detail.id) ? prev : [...prev, detail]
    );
  };

  const handleRemovePaymentDetail = (detail: UserPaymentDetail) => {
    setSelectedPaymentDetails((prev) => prev.filter((d) => d.id !== detail.id));
  };

  // Validate form data for first card submission
  const validateFirstCard = () => {
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

    return errors;
  };

  // Handle first card submission
  const handleFirstCardSubmit = async () => {
    // Clear previous errors
    setValidationErrors([]);

    // Validate form
    const errors = validateFirstCard();
    if (errors.length > 0) {
      setValidationErrors(errors);
      showToast.error("Please fix the following errors: " + errors.join(", "));
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare payload based on asset type
      const payload = {
        asset: selectedAsset.ticker.toUpperCase(),
        amount: payAmount.toString(),
        network: selectedAsset.network.toUpperCase(),
        user_payment_detail_id: selectedPaymentDetails[0].id, // Use first selected payment detail
      };

      console.log("Submitting express withdrawal with payload:", payload);

      const response = await createExpressWithdrawal(payload);
      console.log("Express withdrawal response:", response);

      const responseData = response.data as ExpressWithdrawalResponse;
      setWithdrawalResponse(responseData);
      setIsFirstCardSubmitted(true);
      showToast.success("Withdrawal request submitted successfully!");

      // Generate QR code for the withdrawal address
      const withdrawalAddress =
        responseData.type === "changenow_swap"
          ? responseData.details.withdrawal_address
          : responseData.withdrawal_address;

      if (withdrawalAddress) {
        generateQRCode(withdrawalAddress);
      }
    } catch (error: any) {
      let errorMessage = "Failed to submit withdrawal request";

      // Handle different error response formats
      if (error?.error) {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      showToast.error(errorMessage);
      setValidationErrors([errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate form data for final submission
  const validateForm = () => {
    const errors: string[] = [];

    if (!withdrawalResponse) {
      errors.push("Please submit the withdrawal request first");
    }

    return errors;
  };

  // Handle final form submission
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

    // Proceed to next page
    if (onExchange && withdrawalResponse) {
      const withdrawalAddress =
        withdrawalResponse.type === "changenow_swap"
          ? withdrawalResponse.details.withdrawal_address
          : withdrawalResponse.withdrawal_address;

      const transactionData = {
        type: "withdrawal" as const,
        amount: payAmount,
        asset: selectedAsset,
        paymentDetails: selectedPaymentDetails,
        walletAddress: withdrawalAddress,
        network: selectedNetwork,
        transactionId: withdrawalResponse.transaction_id,
      };
      console.log("DEBUG: Calling onExchange with:", transactionData);
      onExchange(transactionData);
    }
  };

  useEffect(() => {
    if (
      prevPaymentDetailsCount === 0 &&
      selectedPaymentDetails.length > 0 &&
      walletSectionRef.current
    ) {
      const y =
        walletSectionRef.current.getBoundingClientRect().top +
        window.pageYOffset -
        100; // 100px offset
      window.scrollTo({ top: y, behavior: "smooth" });
    }
    setPrevPaymentDetailsCount(selectedPaymentDetails.length);
  }, [selectedPaymentDetails.length]);

  return (
    <div className="w-full min-h-screen flex flex-col justify- bg-[#18181f]">
      <h2 className="text-xl font-bold  mb-2 text-[#788099]">
        <span className="text-[#7e7e8f]">1-</span> Transaction Info
      </h2>
      <div className=" flex items-center justify-center ">
        <div className="bg-[#23232b] border-2 border-[#35353E]  rounded-2xl p-3 shadow-lg w-full max-w-4xl mx-auto text-white">
          {/* First Row - Amount and Asset */}
          <div className="flex flex-col md:flex-row gap-3 mb-2">
            <div className="flex-1">
              <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
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
                className="w-full bg-[#1D1D23] rounded-2xl px-4 py-2 text-lg text-white focus:outline-none border border-[#39394a] appearance-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                Asset
              </label>
              <div className="relative" ref={assetDropdownRef}>
                <div
                  className={`w-full bg-[#1D1D23] rounded-2xl px-4 py-2 text-lg text-white focus:outline-none border border-[#39394a] flex items-center justify-between ${
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
                        <span className="text-white">
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
                        <span className="text-[#7e7e8f]">
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
                          onChange={(e) => {
                            console.log(
                              "Search input changed:",
                              e.target.value
                            );
                            setAssetSearchTerm(e.target.value);
                          }}
                          className="w-full bg-[#23232b] rounded-xl px-10 py-2 text-white text-sm focus:outline-none border border-[#39394a]"
                        />
                      </div>
                    </div>

                    {/* Asset List */}
                    <div className="max-h-60 overflow-y-auto">
                      {sortedSwapAssets.length > 0 ? (
                        sortedSwapAssets.map((asset: SupportedAsset) => (
                          <div
                            key={asset.id}
                            className="flex items-center gap-3 p-3 hover:bg-[#23232b] cursor-pointer border-b border-[#39394a] last:border-b-0"
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
                              <div className="text-white font-medium flex items-center gap-2">
                                {asset.ticker ||
                                  asset.symbol ||
                                  asset.name ||
                                  "Unknown"}
                                <span className="bg-[#1D8751] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                  {asset.network || "Unknown"}
                                </span>
                              </div>
                              <div className="text-[#7e7e8f] text-sm">
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
          {/* Fee & Rate - Dynamic based on selected asset */}
          <div className="flex items-center rounded-2xl border border-[#39394a] bg-[#23232b] px-2 py-2 mb-3">
            <div className="flex flex-col gap-2 flex-1">
              {/* Mode indicator */}
            

              <span className="flex items-center bg-[#F79330] text-white rounded-full px-5 py-1 text-sm font-medium w-fit">
                <span className="w-2 h-2 bg-white rounded-full mr-2 inline-block"></span>
                Network fee: $0 USD (BSC)
              </span>

              <span className="flex items-center bg-[#1D8751] text-white rounded-full px-5 py-1 text-sm font-medium w-fit">
                <span className="w-2 h-2 bg-white rounded-full mr-2 inline-block"></span>
                Commission: {commissionRate}% of ${payAmount} = $
                {commissionAmount.toFixed(2)}
              </span>

           

              {/* Show estimate loading for non-USDT/USDC assets */}
              {selectedAsset &&
                !isSimpleCalculationAsset(selectedAsset) &&
                estimateLoading && (
                  <span className="flex items-center bg-blue-500 text-white rounded-full px-5 py-1 text-sm font-medium w-fit">
                    <span className="w-2 h-2 bg-white rounded-full mr-2 inline-block"></span>
                    Calculating estimate...
                  </span>
                )}

              {/* Show estimate error for non-USDT/USDC assets */}
              {selectedAsset &&
                !isSimpleCalculationAsset(selectedAsset) &&
                estimateError && (
                  <span className="flex items-center bg-red-500 text-white rounded-full px-5 py-1 text-sm font-medium w-fit">
                    <span className="w-2 h-2 bg-white rounded-full mr-2 inline-block"></span>
                    Estimate error: {estimateError}
                  </span>
                )}
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
          {/* Second Row - You Get Amount and Payment Method Selection */}
          <div className="flex flex-col md:flex-row gap-3 mb-2">
            <div className="flex-1">
              <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                You Get
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
                className="w-full bg-[#1D1D23] rounded-2xl px-4 py-2 text-lg text-white focus:outline-none border border-[#39394a] appearance-none"
              />
              {/* Show loading indicator for non-USDT/USDC assets */}
              {selectedAsset &&
                !isSimpleCalculationAsset(selectedAsset) &&
                estimateLoading && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1D8751]"></div>
                    <span className="text-[#7e7e8f] text-sm">
                      Calculating estimate...
                    </span>
                  </div>
                )}
            </div>
            <div className="flex-1">
              <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
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
                  disabled={adminLoading}
                  className="w-full bg-[#1D1D23] rounded-2xl px-9 py-2 text-lg text-white focus:outline-none border border-[#39394a] appearance-none disabled:opacity-50"
                >
                  <option value="">
                    {adminLoading
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
              {adminError && (
                <p className="text-red-500 text-sm mt-1">{adminError}</p>
              )}
            </div>
          </div>

          {/* Payment Method Selection - Using UserPaymentSelector like Adds page */}
          {payBank && (
            <div className="mt-6">
              <UserPaymentSelector
                userPaymentDetails={filteredUserPaymentDetails}
                onSelect={handleSelectPaymentDetail}
                onRemove={handleRemovePaymentDetail}
                selectedDetails={selectedPaymentDetails}
              />
            </div>
          )}

          {paymentError && (
            <p className="text-red-500 text-sm mt-1">{paymentError}</p>
          )}

          {/* Submit Button for First Card */}
          {!isFirstCardSubmitted && (
            <div className="mt-4">
              <button
                className="w-full text-white text-base font-medium py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors bg-[#1D8751] hover:bg-[#166b3e] disabled:opacity-50"
                onClick={handleFirstCardSubmit}
                disabled={
                  isSubmitting ||
                  !selectedAsset ||
                  !payAmount ||
                  selectedPaymentDetails.length === 0 ||
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

      {/* Show withdrawal response and address after first card submission */}
      {isFirstCardSubmitted && withdrawalResponse && (
        <div ref={walletSectionRef}>
          <h2 className="text-xl font-bold mb-2 text-[#788099]">
            <span className="text-[#7e7e8f]">2-</span> Withdrawal Address
          </h2>
          <div className="flex flex-col bg-[#23232b] border-2 border-[#35353E] rounded-2xl p-5 shadow-lg w-full max-w-4xl mx-auto text-white mb-6">
            {/* Response Type Indicator */}
           

          

            {/* Withdrawal Address */}
            <div className="mb-4">
              <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                Withdrawal Address
              </label>
              <div className="bg-[#1D1D23] border border-[#39394a] rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[#788099] text-sm font-mono break-all flex-1 mr-4">
                    {withdrawalResponse.type === "changenow_swap"
                      ? withdrawalResponse.details.withdrawal_address
                      : withdrawalResponse.withdrawal_address}
                  </p>
                  <button
                    onClick={() => {
                      const address =
                        withdrawalResponse.type === "changenow_swap"
                          ? withdrawalResponse.details.withdrawal_address
                          : withdrawalResponse.withdrawal_address;
                      navigator.clipboard.writeText(address);
                      showToast.success("Address copied to clipboard!");
                    }}
                    className="bg-[#1D8751] text-white px-3 py-1 rounded-lg text-sm hover:bg-[#166b3e] transition-colors flex-shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="mt-3 mb-3 flex flex-col items-center justify-center">
              <img
                src={qrCodeDataUrl}
                alt="QR Code for withdrawal address"
                className="w-48 h-48"
              />
              <p className="text-white text-center text-sm mt-2">
                Scan QR code to send{" "}
                {selectedAsset?.ticker?.toUpperCase() || "CRYPTO"}
              </p>
            </div>

          
            {/* Terms and Conditions Summary */}
            <div className="flex items-center mb-2 mt-4">
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

          {/* Disclaimer and Final Submit Button */}
          <div className="flex flex-col gap-3 max-w-4xl mx-auto w-full px-2">
            <div className="flex items-center text-white text-[16px] font-semibold">
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
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
