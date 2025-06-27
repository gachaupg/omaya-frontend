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

  return (
    <div className=" p-6 rounded-lg">
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab("deposit")}
          className={`px-6 py-2 rounded-[18px] font-semibold flex items-center justify-center transition-colors ${
            activeTab === "deposit"
              ? "bg-[#1D8751] text-white"
              : "bg-[#1D1D23] text-[#788099] hover:bg-[#1D8751]"
          }`}
        >
          <span className="mr-2">↑</span> Deposit
        </button>
        <button
          onClick={() => setActiveTab("withdraw")}
          className={`px-6 py-2 rounded-[18px] font-semibold flex items-center justify-center transition-colors ${
            activeTab === "withdraw"
              ? "bg-red-500 text-white"
              : "bg-[#1D1D23] text-[#788099] hover:bg-red-600"
          }`}
        >
          <span className="mr-2">↓</span> Withdraw
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="relative" ref={dropdownRef}>
          <label className="text-sm text-[#788099] mb-2 block">Asset</label>
          <div
            className="bg-[#1D1D23] p-3 rounded-[18px] flex items-center justify-between cursor-pointer hover:bg-[#35353E] transition-colors"
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
              <span className="ml-2">
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
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1D1D23] rounded-[18px] border border-gray-700 z-10 max-h-60 overflow-y-auto shadow-lg">
              {assetsLoading && (
                <div className="p-3 text-center text-[#788099]">
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
                ))}
              {!assetsLoading &&
                !assetsError &&
                (!assetsData?.assets || assetsData.assets.length === 0) && (
                  <div className="p-3 text-center text-[#788099]">
                    No assets available
                  </div>
                )}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm text-[#788099] mb-2 block">
            I want to recieve
          </label>
          <div className="flex items-center bg-[#1D1D23] rounded-[18px]">
            <span className="p-3 text-[#1D8751]">$</span>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent p-3 w-full focus:outline-none"
            />
            <div className="p-3 flex items-center">
              <span>USD</span>
              <FiChevronDown className="ml-1" />
            </div>
          </div>
        </div>

        <div className="relative" ref={methodDropdownRef}>
          <label className="text-sm text-[#788099] mb-2 block">Method</label>
          <div
            className="bg-[#1D1D23] p-3 rounded-[18px] flex items-center justify-between cursor-pointer hover:bg-[#35353E] transition-colors"
            onClick={() => setIsMethodDropdownOpen(!isMethodDropdownOpen)}
          >
            <div className="flex items-center">
              <FaUniversity />
              <span className="ml-2">
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
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1D1D23] rounded-[18px] border border-gray-700 z-10 max-h-60 overflow-y-auto shadow-lg">
              {userDetailsLoading ? (
                <div className="p-3 text-center text-[#788099]">
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
                    className="p-3 flex items-center hover:bg-[#35353E] cursor-pointer transition-colors first:rounded-t-[18px] last:rounded-b-[18px]"
                    onClick={() => handlePaymentMethodSelect(method)}
                  >
                    <FaUniversity />
                    <span className="ml-2 font-medium">{method}</span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-[#788099]">
                  No payment methods available
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={providerDropdownRef}>
          <label className="text-sm text-[#788099] mb-2 block">Provider</label>
          <div
            className={`bg-[#1D1D23] p-3 rounded-[18px] flex items-center justify-between cursor-pointer transition-colors ${
              selectedPaymentMethod
                ? "hover:bg-[#35353E]"
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
              <span className="ml-2">
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
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1D1D23] rounded-[18px] border border-gray-700 z-10 max-h-60 overflow-y-auto shadow-lg">
              {uniqueProviders.length > 0 ? (
                uniqueProviders.map((provider: string) => (
                  <div
                    key={provider}
                    className="p-3 flex items-center hover:bg-[#35353E] cursor-pointer transition-colors first:rounded-t-[18px] last:rounded-b-[18px]"
                    onClick={() => handleProviderSelect(provider)}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#1D8751] flex items-center justify-center text-white text-xs font-bold">
                      {provider.charAt(0).toUpperCase()}
                    </div>
                    <span className="ml-2 font-medium">{provider}</span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-[#788099]">
                  No providers available for this method
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1D8751] text-white p-4 rounded-[18px] flex justify-between items-center mb-4">
        <span className="font-semibold">Amount including total fees</span>
        <span className="text-2xl font-bold">$103</span>
      </div>

      <div className="bg-[#1D1D23] p-3 rounded-[18px] flex items-center justify-center space-x-6 text-sm mb-6">
        <span className="text-[#788099] bg-[#35353E] p-2 rounded-[18px]">
          Commission: 3% <span className="text-[#788099]">$3</span>
        </span>
        <span className="w-px h-4 bg-gray-600"></span>
        <span className="text-[#788099] bg-[#35353E] p-2 rounded-[18px]">
          Network Fee <span className="text-[#788099]">$3</span>
        </span>
        <span className="w-px h-4 bg-gray-600"></span>
        <span className="text-[#788099] bg-[#35353E] p-2 rounded-[18px]">
          Total Fees <span className="text-[#788099]">$3</span>
        </span>
      </div>

      <div className="flex items-center text-yellow-500 text-sm mb-6 bg-yellow-500/10 p-3 rounded-md">
        <FiInfo className="text-yellow-500" />
        <p className="ml-2 text-gray-300">
          Transactions are subject to commission, above is the information on
          the commission rates
        </p>
      </div>

      <button
        className={`w-full py-3 rounded-[18px] font-semibold transition-colors ${
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
          ? "Deposit Now"
          : "Withdraw Now"}
      </button>
    </div>
  );
};

export default RatesCalculator;
