"use client";
import React, { useState, useEffect, useRef } from "react";
import { FaBitcoin, FaUniversity } from "react-icons/fa";
import { FiChevronDown, FiInfo } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../store";
import { RootState } from "../../../store/rootReducer";
import { fetchAssets } from "../../p2p/slices/assetsSlice";
import { fetchUserPaymentDetails } from "../../p2p/slices/paymentMethodsSlice";
import { Asset } from "../../p2p/types";
import { AlertCircle } from "lucide-react";
import { calculateCommission } from "@/features/exchange/components/utils/calculations/commissionCalculator";
import { calculateNetworkFee, calculateTotalFees } from "@/features/exchange/components/utils/calculations/feeCalculator";

interface UserPaymentDetail {
  id: number;
  payment_method_name: string;
  payment_provider_name: string;
  account_name: string;
  account_number: string;
}

const RatesCalculator = () => {
  const [activeTab, setActiveTab] = useState("deposit");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [isMethodDropdownOpen, setIsMethodDropdownOpen] = useState(false);
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const [amount, setAmount] = useState("100");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const {
    data: assetsData,
    loading: assetsLoading,
    error: assetsError,
  } = useSelector((state: RootState) => state.assets);
  const { userPaymentDetails, userDetailsLoading, userDetailsError } =
    useSelector((state: RootState) => state.paymentMethods);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const methodDropdownRef = useRef<HTMLDivElement>(null);
  const providerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchAssets());
    dispatch(fetchUserPaymentDetails());
  }, [dispatch]);

  useEffect(() => {
    if (assetsData?.assets && assetsData.assets.length > 0 && !selectedAsset) {
      setSelectedAsset(assetsData.assets[0]);
    }
  }, [assetsData, selectedAsset]);

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
      if (
        providerDropdownRef.current &&
        !providerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProviderDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsAssetDropdownOpen(false);
  };

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
    setSelectedProvider(""); // Reset provider when method changes
    setIsMethodDropdownOpen(false);
  };

  const handleProviderSelect = (provider: string) => {
    setSelectedProvider(provider);
    setIsProviderDropdownOpen(false);
  };

  // Get unique payment methods from userPaymentDetails
  const uniquePaymentMethods = Array.from(
    new Set(userPaymentDetails.map((detail: any) => detail.payment_method_name))
  ) as string[];

  // Add "Bank" as a default option if not already present
  const allPaymentMethods = uniquePaymentMethods.includes("Bank")
    ? uniquePaymentMethods
    : ["Bank", ...uniquePaymentMethods];

  // Get unique providers for the selected payment method
  const uniqueProviders = Array.from(
    new Set(
      userPaymentDetails
        .filter(
          (detail: any) => detail.payment_method_name === selectedPaymentMethod
        )
        .map((detail: any) => detail.payment_provider_name)
    )
  ) as string[];

  // Get selected payment detail
  const selectedPaymentDetail = userPaymentDetails.find(
    (detail: any) =>
      detail.payment_method_name === selectedPaymentMethod &&
      detail.payment_provider_name === selectedProvider
  );

  // Extract nested ternary into a function
  const renderAssetDropdown = () => {
    if (assetsLoading) {
      return (
        <div className="p-3 text-center text-[#788099]">Loading assets...</div>
      );
    }

    if (assetsError) {
      return (
        <div className="p-3 text-center text-red-500">Error loading assets</div>
      );
    }

    if (assetsData?.assets && assetsData.assets.length > 0) {
      return assetsData.assets.map((asset: Asset) => (
        <div
          key={asset.asset_id}
          className="p-3 flex items-center hover:bg-[#35353E] cursor-pointer transition-colors first:rounded-t-[18px] last:rounded-b-[18px]"
          onClick={() => handleAssetSelect(asset)}
        >
          {asset.asset_image ? (
            <img
              src={asset.asset_image}
              alt={asset.symbol}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <FaBitcoin className="text-yellow-500" />
          )}
          <span className="ml-2 font-medium">{asset.symbol}</span>
          {asset.description && (
            <span className="ml-2 text-sm text-[#788099]">
              ({asset.description})
            </span>
          )}
        </div>
      ));
    }

    return (
      <div className="p-3 text-center text-[#788099]">No assets available</div>
    );
  };

  const handleSubmit = async () => {
    if (
      !selectedAsset ||
      !selectedPaymentMethod ||
      !selectedProvider ||
      !selectedPaymentDetail
    ) {
      alert("Please select all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();

      if (activeTab === "deposit") {
        // Deposit API structure
        formData.append("requested_amount", amount);
        formData.append(
          "deposit_address",
          selectedPaymentDetail.account_number
        );
        formData.append(
          "payment_provider",
          selectedPaymentDetail.payment_provider_name
        );
        formData.append(
          "payment_method",
          selectedPaymentDetail.payment_method_name
        );
        formData.append(
          "additional_info",
          `Account: ${selectedPaymentDetail.account_name}`
        );
        formData.append("currency", "USDT");

        // Determine if it's crypto based on the asset
        const isCrypto =
          selectedAsset.symbol === "BTC" ||
          selectedAsset.symbol === "ETH" ||
          selectedAsset.symbol === "USDT";

        if (isCrypto) {
          // Get the first available network for the asset
          const network = selectedAsset.networks?.[0]?.network_type || "";
          formData.append("network", network);
        } else {
          formData.append("network", "");
        }

        formData.append("asset", selectedAsset.symbol);
        formData.append("sent_from", selectedPaymentDetail.account_name);

        // Make the API call to trading engine deposit
        const response = await fetch("/trading_engine/deposit/", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          alert("Deposit transaction submitted successfully!");
          console.log("Deposit result:", result);
        } else {
          const error = await response.json();
          alert(
            `Error: ${error.message || "Failed to submit deposit transaction"}`
          );
        }
      } else {
        // Withdrawal API structure
        formData.append("requested_amount", amount);
        formData.append(
          "payment_provider",
          selectedPaymentDetail.payment_provider_name
        );
        formData.append(
          "payment_method",
          selectedPaymentDetail.payment_method_name
        );
        formData.append(
          "additional_info",
          `Account: ${selectedPaymentDetail.account_name}`
        );
        // formData.append("commission", widthdrwal.commission);
        // formData.append("asset_type", widthdrwal.asset_type);
        // formData.append("network", widthdrwal.network);
        formData.append("asset", selectedAsset.symbol);
        formData.append(
          "user_payment_detail_id",
          selectedPaymentDetail.id.toString()
        );
        formData.append("currency", selectedAsset.symbol); // Using asset symbol as currency

        // Make the API call to trading engine withdraw
        const response = await fetch("/trading_engine/withdraw/", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          alert("Withdrawal transaction submitted successfully!");
          console.log("Withdrawal result:", result);
        } else {
          const error = await response.json();
          alert(
            `Error: ${
              error.message || "Failed to submit withdrawal transaction"
            }`
          );
        }
      }
    } catch (error) {
      console.error("Error submitting transaction:", error);
      alert("Failed to submit transaction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  function mapP2PAssetToExchangeAsset(asset: Asset): any {
  return {
    ...asset,
    name: asset.symbol, // fallback if name missing
    // Add any other required fields with sensible defaults if missing
  };
}

// Helper to map P2P Network to Exchange Network type
function mapP2PNetworkToExchangeNetwork(network: any): any {
  if (!network) return null;
  return {
    ...network,
    // Add/rename properties as needed to match the expected Network type
  };
}

const mappedAsset = selectedAsset ? mapP2PAssetToExchangeAsset(selectedAsset) : null;
const mappedNetwork = selectedAsset?.networks?.[0]
  ? mapP2PNetworkToExchangeNetwork(selectedAsset.networks[0])
  : null;

  
const amountNum = parseFloat(amount) || 0;

const { commission, commissionRate } = mappedAsset
  ? calculateCommission(mappedAsset, amountNum)
  : { commission: 0, commissionRate: 0 };

const networkFee = calculateNetworkFee("Crypto", mappedNetwork, amountNum);

const totalFees = calculateTotalFees(commission, networkFee);

const assetAmount = amountNum + totalFees;

  return (
    <div className="bg-white dark:bg-[#18181D] p-6 rounded-2xl border border-gray-200 dark:border-[#35353E] shadow-md">
      <div className="relative flex flex-col gap-2">
        <div className="p-2 border border-[#E8EFF5] dark:border-[#35353E] rounded-[18px]">
          <p className="mb-2">You send</p>
          <div className="grid grid-cols-2 gap-2 mb-4 items-stretch">
            <div className="relative" ref={dropdownRef}>
              <label className="text-sm text-gray-600 dark:text-[#788099] mb-2 block">
                Asset
              </label>
              <div
                className="border border-[#E8EFF5] dark:border-[#35353E] p-3 rounded-[18px] flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-[#35353E] transition-colors"
                onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
              >
                <div className="flex items-center">
                  {selectedAsset?.asset_image ? (
                    <img
                      src={selectedAsset.asset_image}
                      alt={selectedAsset.symbol}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <FaBitcoin className="text-yellow-500" />
                  )}
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {selectedAsset?.symbol || "Loading..."}
                  </span>
                </div>
                <FiChevronDown
                  className={`transition-transform duration-200 ${
                    isAssetDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* Asset Dropdown */}
              {isAssetDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1D1D23] rounded-[18px] border border-gray-200 dark:border-gray-700 z-10 max-h-60 overflow-y-auto shadow-lg">
                  {assetsLoading && (
                    <div className="p-3 text-center text-gray-600 dark:text-[#788099]">
                      Loading assets...
                    </div>
                  )}
                  {assetsError && (
                    <div className="p-3 text-center text-red-500">
                      Error loading assets
                    </div>
                  )}
                  {!assetsLoading &&
                    !assetsError &&
                    assetsData?.assets &&
                    assetsData.assets.length > 0 &&
                    assetsData.assets.map((asset: Asset) => (
                      <div
                        key={asset.asset_id}
                        className="p-3 flex items-center hover:bg-gray-100 dark:hover:bg-[#35353E] cursor-pointer transition-colors first:rounded-t-[18px] last:rounded-b-[18px]"
                        onClick={() => handleAssetSelect(asset)}
                      >
                        {asset.asset_image ? (
                          <img
                            src={asset.asset_image}
                            alt={asset.symbol}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <FaBitcoin className="text-yellow-500" />
                        )}
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {asset.symbol}
                        </span>
                        {asset.description && (
                          <span className="ml-2 text-sm text-gray-600 dark:text-[#788099]">
                            ({asset.description})
                          </span>
                        )}
                      </div>
                    ))}
                  {!assetsLoading &&
                    !assetsError &&
                    (!assetsData?.assets || assetsData.assets.length === 0) && (
                      <div className="p-3 text-center text-gray-600 dark:text-[#788099]">
                        No assets available
                      </div>
                    )}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-[#788099] mb-2 block">
                I want to recieve
              </label>
              <div className="flex items-center border border-[#E8EFF5] dark:border-[#35353E] rounded-[18px]">
                <span className="p-3 text-[#1D8751]">$</span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-transparent p-3 w-full focus:outline-none text-gray-900 dark:text-white"
                />
                <div className="p-3 flex items-center text-gray-900 dark:text-white">
                  <span>USD</span>
                  <FiChevronDown className="ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      
        {/* Centered Swap Icon */}
        <div className="flex justify-center relative -my-5 z-10">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#18181D] border border-[#E8EFF5] dark:border-[#35353E]">
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
              <path d="m3 16 4 4 4-4" stroke="#F79330"/>
              <path d="M7 20V4" stroke="#F79330"/>
              {/* Up arrow (right side) - Green */}
              <path d="m21 8-4-4-4 4" stroke="#1D8751"/>
              <path d="M17 4v16" stroke="#1D8751"/>
            </svg>
          </div>
        </div>

        <div className="p-2 border border-[#E8EFF5] dark:border-[#35353E] rounded-[18px]">
          <p className="mb-2">Method</p>
          <div className="grid grid-cols-2 gap-2 mb-4 items-stretch">
          <div className="relative" ref={methodDropdownRef}>
            <label className="text-sm text-gray-600 dark:text-[#788099] mb-2 block">
              Bank/Payment Method
            </label>
            <div
              className="border border-[#E8EFF5] dark:border-[#35353E] p-3 rounded-[18px] flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-[#35353E] transition-colors"
              onClick={() => setIsMethodDropdownOpen(!isMethodDropdownOpen)}
            >
              <div className="flex items-center">
                <FaUniversity />
                <span className="ml-2 text-gray-900 dark:text-white">
                  {selectedPaymentMethod || "Select Method"}
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
                    Loading payment methods...
                  </div>
                ) : userDetailsError ? (
                  <div className="p-3 text-center text-red-500">
                    Error loading payment methods
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
                    No payment methods available
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative" ref={providerDropdownRef}>
            <label className="text-sm text-gray-600 dark:text-[#788099] mb-2 block">
              Provider
            </label>
            <div
              className={`border border-[#E8EFF5] dark:border-[#35353E] p-3 rounded-[18px] flex items-center justify-between cursor-pointer transition-colors ${
                selectedPaymentMethod
                  ? "hover:bg-gray-100 dark:hover:bg-[#35353E]"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() =>
                selectedPaymentMethod &&
                setIsProviderDropdownOpen(!isProviderDropdownOpen)
              }
            >
              <div className="flex items-center">
                {selectedPaymentDetail ? (
                  <div className="w-6 h-6 rounded-full bg-[#1D8751] flex items-center justify-center text-white text-xs font-bold">
                    {selectedPaymentDetail.account_name.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
                    <span className="text-xs">?</span>
                  </div>
                )}
                <span className="ml-2 text-gray-900 dark:text-white">
                  {selectedProvider || "Select Provider"}
                </span>
              </div>
              <FiChevronDown
                className={`transition-transform duration-200 ${
                  isProviderDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>

            {/* Provider Dropdown */}
            {isProviderDropdownOpen && selectedPaymentMethod && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1D1D23] rounded-[18px] border border-gray-200 dark:border-gray-700 z-10 max-h-60 overflow-y-auto shadow-lg">
                {uniqueProviders.length > 0 ? (
                  uniqueProviders.map((provider: string) => (
                    <div
                      key={provider}
                      className="p-3 flex items-center hover:bg-gray-100 dark:hover:bg-[#35353E] cursor-pointer transition-colors first:rounded-t-[18px] last:rounded-b-[18px]"
                      onClick={() => handleProviderSelect(provider)}
                    >
                      <div className="w-6 h-6 rounded-full bg-[#1D8751] flex items-center justify-center text-white text-xs font-bold">
                        {provider.charAt(0).toUpperCase()}
                      </div>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {provider}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-600 dark:text-[#788099]">
                    No providers available for this method
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        </div>
      </div>
   
        {/* Info Row */}
        <div className="flex items-start text-white text-sm mt-2 mb-4">
          <AlertCircle className="w-4 h-4 text-[#E23D3A] mr-2 mt-0.5 flex-shrink-0" />
          <span>This is only estimated price and its based on current Market Price. We will fix the price when we receive the funds.</span>
        </div>

        {/* Amount & Fees */}
        <div className="border border-[#E8EFF5] dark:border-[#35353E] rounded-xl p-4 bg-transparent mb-4">
          <p className="text-[#788099] text-sm font-medium mb-2">Amount & Fees</p>
          <div className="flex flex-col lg:flex-row gap-4 items-stretch">
            <div className="flex-1 flex flex-col justify-start">
              <span className="text-white text-sm mb-2">Net Amount to Transfer</span>
              <div className="w-full">
                <div className="w-full bg-white dark:bg-[#35353E] border border-[#E8EFF5] rounded-2xl flex items-center px-2 py-2">
                  <button className="flex-1 flex items-center justify-center bg-transparent">
                    <span className="text-[#051015] dark:text-[#BDF4D8] text-sm ml-4">Amount including Total Fees</span>
                    <span className="bg-[#1D8751] text-white text-lg font-semibold rounded-full px-8 py-1 ml-2">
                      ${amountNum > 0 ? assetAmount.toFixed(2) : '0.00'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
            {/* Right: Fee Breakdown */}
            <div className="flex flex-col justify-between min-w-[220px] bg-white dark:bg-[#1D1D23] border border-[#E8EFF5] dark:border-[#35353E] rounded-lg px-4 py-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#051015] dark:text-[#E8EFF5]">
                  Commission: {amountNum > 0 ? `${commissionRate}%` : '0%'}
                </span>
                <span className="text-[#1D8751]">
                  {amountNum > 0 ? `$${commission.toFixed(2)}` : '$0.00'}
                </span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#051015] dark:text-[#E8EFF5]">Network Fee:</span>
                <span className="text-[#1D8751]">
                  {amountNum > 0 ? `$${networkFee.toFixed(2)}` : '$0.00'}
                </span>
              </div>
              <div className="border-t border-[#E8EFF5] dark:border-[#35353E] mt-2 pt-2 flex justify-between text-sm">
                <span className="text-[#F79330] font-semibold">Total Fees</span>
                <span className="text-[#F79330] font-semibold">
                  {amountNum > 0 ? `$${totalFees.toFixed(2)}` : '$0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

      <div className="flex items-center text-[#F79330] text-lg mb-6 p-3 rounded-md">
        <FiInfo className="text-[#F79330]" />
        <p className="ml-2 text-gray-700 dark:text-gray-300">
          Transactions are subject to commission, above is the information on
          the commission rates
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
          ? "Processing..."
          : activeTab === "deposit"
          ? "Exchange Now"
          : "Exchange Now"}
      </button>

      </div>
    </div>
  );
};

export default RatesCalculator;
