"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { createUserWalletAddress } from "@/features/settings/slices/userWalletAddressesSlice";
import { fetchSupportedAssets } from "@/features/swap/slices/swapSlice";
import { useValidateAddress } from "@/hooks/useValidateAddress";
import { showToast } from "@/lib/utils/toast";
import type { SupportedAsset } from "@/features/swap/types";

interface AddWalletAddressModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddWalletAddressModal = ({
  open,
  onClose,
  onSuccess,
}: AddWalletAddressModalProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { supportedAssets, loading: swapLoading } = useSelector(
    (s: RootState) => s.swap
  );

  const [selectedAssetTicker, setSelectedAssetTicker] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [address, setAddress] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);

  const assetDropdownRef = useRef<HTMLDivElement>(null);
  const networkDropdownRef = useRef<HTMLDivElement>(null);

  const allAssets: SupportedAsset[] = supportedAssets ?? [];

  // Deduplicate assets by ticker for the asset dropdown (networks shown separately)
  const uniqueAssets = useMemo(() => {
    const seen = new Map<string, SupportedAsset>();
    for (const a of allAssets) {
      const key = a.ticker?.toUpperCase();
      if (key && !seen.has(key)) {
        seen.set(key, a);
      }
    }
    return Array.from(seen.values());
  }, [allAssets]);

  // Get all network variations for the selected ticker
  const networksForAsset = useMemo(() => {
    if (!selectedAssetTicker) return [];
    return allAssets.filter(
      (a) => a.ticker?.toUpperCase() === selectedAssetTicker.toUpperCase()
    );
  }, [allAssets, selectedAssetTicker]);

  const selectedAsset = useMemo(() => {
    if (!selectedAssetTicker || !selectedNetwork) return null;
    return (
      allAssets.find(
        (a) =>
          a.ticker?.toUpperCase() === selectedAssetTicker.toUpperCase() &&
          a.network?.toLowerCase() === selectedNetwork.toLowerCase()
      ) ?? null
    );
  }, [allAssets, selectedAssetTicker, selectedNetwork]);

  const currencyForValidation = selectedAssetTicker?.toLowerCase() || "";
  const networkForValidation = selectedNetwork?.toLowerCase() || "";

  const {
    result: validationResult,
    isValidating,
    validate,
    reset: resetValidation,
  } = useValidateAddress({
    currency: currencyForValidation,
    network: networkForValidation,
    debounceMs: 600,
    minLength: 10,
  });

  useEffect(() => {
    if (open && allAssets.length === 0 && !swapLoading) {
      dispatch(fetchSupportedAssets(false) as any);
    }
  }, [open, allAssets.length, swapLoading, dispatch]);

  useEffect(() => {
    setSelectedNetwork("");
    setAddress("");
    resetValidation();
  }, [selectedAssetTicker]);

  useEffect(() => {
    if (address.trim()) {
      setAddress("");
    }
    resetValidation();
  }, [selectedNetwork]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        assetDropdownRef.current &&
        !assetDropdownRef.current.contains(e.target as Node)
      ) {
        setAssetDropdownOpen(false);
      }
      if (
        networkDropdownRef.current &&
        !networkDropdownRef.current.contains(e.target as Node)
      ) {
        setNetworkDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    if (value.trim().length >= 10 && currencyForValidation) {
      validate(value, currencyForValidation, networkForValidation);
    } else {
      resetValidation();
    }
  };

  const addressIsValid = validationResult?.isValid === true;
  const addressIsInvalid =
    validationResult !== null && validationResult.isValid === false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAssetTicker) {
      showToast.error("Please select an asset");
      return;
    }
    if (!selectedNetwork) {
      showToast.error("Please select a network");
      return;
    }
    if (!address.trim()) {
      showToast.error("Wallet address is required");
      return;
    }
    if (addressIsInvalid) {
      showToast.error(validationResult?.message || "Invalid wallet address");
      return;
    }
    if (!accountName.trim()) {
      showToast.error("Account name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await dispatch(
        createUserWalletAddress({
          address: address.trim(),
          account_name: accountName.trim(),
          label: "OMAYA Wallets",
          asset: selectedAssetTicker.toUpperCase(),
          network: selectedNetwork,
        }) as any
      );

      if (createUserWalletAddress.fulfilled.match(result)) {
        showToast.success("Wallet address added successfully!");
        handleClose();
        onSuccess?.();
      } else if (createUserWalletAddress.rejected.match(result)) {
        showToast.error(result.payload || "Failed to create wallet address");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedAssetTicker("");
    setSelectedNetwork("");
    setAddress("");
    setAccountName("");
    setAssetSearch("");
    setAssetDropdownOpen(false);
    setNetworkDropdownOpen(false);
    resetValidation();
    onClose();
  };

  if (!open) return null;

  const filteredAssets = uniqueAssets.filter((a) => {
    if (!assetSearch.trim()) return true;
    const q = assetSearch.toLowerCase();
    return (
      a.ticker?.toLowerCase().includes(q) ||
      a.name?.toLowerCase().includes(q) ||
      a.symbol?.toLowerCase().includes(q)
    );
  });

  const getAssetImage = (a: SupportedAsset) =>
    a.image || a.image_url || a.asset_image || "/default-provider-logo.svg";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md rounded-2xl border border-[#E3E6F0] dark:border-[#2A2A35] bg-white dark:bg-[var(--card-color)] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            Add Wallet Address
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#2D2D33] text-gray-500 dark:text-[#8B90A5] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Asset dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#8B90A5] mb-2">
              Asset
            </label>
            <div className="relative" ref={assetDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setAssetDropdownOpen(!assetDropdownOpen);
                  setNetworkDropdownOpen(false);
                }}
                className="w-full cursor-pointer flex items-center justify-between dark:bg-[var(--card-color)] bg-white border border-[#E3E6F0] dark:border-[#2A2A35] rounded-xl px-4 py-3 text-left"
              >
                {selectedAssetTicker ? (
                  <div className="flex items-center gap-3">
                    {(() => {
                      const displayAsset = uniqueAssets.find(
                        (a) =>
                          a.ticker?.toUpperCase() ===
                          selectedAssetTicker.toUpperCase()
                      );
                      return displayAsset ? (
                        <>
                          <img
                            src={getAssetImage(displayAsset)}
                            alt={displayAsset.ticker}
                            className="w-6 h-6 rounded-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = "/default-provider-logo.svg";
                            }}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {displayAsset.ticker?.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-[#8C8CA1]">
                              {displayAsset.name}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-900 dark:text-white">
                          {selectedAssetTicker.toUpperCase()}
                        </span>
                      );
                    })()}
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 dark:text-[#5C6175]">
                    Select Asset
                  </span>
                )}
                <svg
                  className={`w-4 h-4 text-gray-500 dark:text-[#8C8CA1] transition-transform ${
                    assetDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {assetDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[var(--card-color)] border border-[#E3E6F0] dark:border-[#2A2A35] rounded-xl z-50 shadow-lg">
                  <div className="p-2 border-b border-[#E3E6F0] dark:border-[#2A2A35]">
                    <input
                      type="text"
                      placeholder="Search assets..."
                      value={assetSearch}
                      onChange={(e) => setAssetSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-gray-50 dark:bg-[#23232B] border border-[#E3E6F0] dark:border-[#2A2A35] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#5C6175] outline-none"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {swapLoading ? (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">
                        Loading tokens...
                      </div>
                    ) : filteredAssets.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">
                        {assetSearch.trim() ? "No matching assets" : "No assets available"}
                      </div>
                    ) : (
                      filteredAssets.map((a, idx) => (
                        <div
                          key={`${a.ticker}-${idx}`}
                          onClick={() => {
                            setSelectedAssetTicker(a.ticker);
                            setAssetDropdownOpen(false);
                            setAssetSearch("");
                          }}
                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#23232B] transition-colors ${
                            selectedAssetTicker?.toUpperCase() ===
                            a.ticker?.toUpperCase()
                              ? "bg-[#1D8751]/5"
                              : ""
                          }`}
                        >
                          <img
                            src={getAssetImage(a)}
                            alt={a.ticker}
                            className="w-6 h-6 rounded-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = "/default-provider-logo.svg";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {a.ticker?.toUpperCase()}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-[#8C8CA1] truncate block">
                              {a.name}
                            </span>
                          </div>
                          {selectedAssetTicker?.toUpperCase() ===
                            a.ticker?.toUpperCase() && (
                            <div className="w-2 h-2 rounded-full bg-[#1D8751] flex-shrink-0" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Network dropdown */}
          {selectedAssetTicker && networksForAsset.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#8B90A5] mb-2">
                Network
              </label>
              <div className="relative" ref={networkDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setNetworkDropdownOpen(!networkDropdownOpen);
                    setAssetDropdownOpen(false);
                  }}
                  className="w-full cursor-pointer flex items-center justify-between dark:bg-[var(--card-color)] bg-white border border-[#E3E6F0] dark:border-[#2A2A35] rounded-xl px-4 py-3 text-left"
                >
                  {selectedNetwork ? (
                    <div className="flex items-center gap-2">
                      <span className="bg-[#1D8751] text-white text-xs px-2 py-0.5 rounded-full">
                        {selectedNetwork}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-[#5C6175]">
                      Select Network
                    </span>
                  )}
                  <svg
                    className={`w-4 h-4 text-gray-500 dark:text-[#8C8CA1] transition-transform ${
                      networkDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {networkDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[var(--card-color)] border border-[#E3E6F0] dark:border-[#2A2A35] rounded-xl z-50 shadow-lg max-h-60 overflow-y-auto py-1">
                    {networksForAsset.map((n, idx) => (
                      <div
                        key={`${n.network}-${idx}`}
                        onClick={() => {
                          setSelectedNetwork(n.network);
                          setNetworkDropdownOpen(false);
                        }}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#23232B] transition-colors ${
                          selectedNetwork?.toLowerCase() ===
                          n.network?.toLowerCase()
                            ? "bg-[#1D8751]/5"
                            : ""
                        }`}
                      >
                        <img
                          src={getAssetImage(n)}
                          alt={n.network}
                          className="w-5 h-5 rounded-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "/default-provider-logo.svg";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {n.network}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-[#8C8CA1] ml-2">
                            {n.name}
                          </span>
                        </div>
                        {selectedNetwork?.toLowerCase() ===
                          n.network?.toLowerCase() && (
                          <div className="w-2 h-2 rounded-full bg-[#1D8751] flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Wallet address with live validation */}
          {selectedAsset && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#8B90A5] mb-2">
                Wallet Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={handleAddressChange}
                  placeholder="Enter wallet address"
                  className={`w-full rounded-xl border pr-10 ${
                    addressIsInvalid
                      ? "border-red-500 dark:border-red-500 focus:ring-red-500/50"
                      : addressIsValid
                        ? "border-[#1D8751] dark:border-[#1D8751] focus:ring-[#1D8751]/50"
                        : "border-[#E3E6F0] dark:border-[#2A2A35] focus:ring-[#1D8751]/50"
                  } bg-white dark:bg-[var(--card-color)] px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#5C6175] focus:outline-none focus:ring-2`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValidating && (
                    <svg className="animate-spin h-4 w-4 text-[#1D8751]" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  )}
                  {!isValidating && addressIsValid && (
                    <svg className="w-5 h-5 text-[#1D8751]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {!isValidating && addressIsInvalid && (
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              </div>
              {addressIsInvalid && (
                <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">
                  {validationResult?.message || "Invalid wallet address"}
                </p>
              )}
              {addressIsValid && (
                <p className="mt-1.5 text-xs text-[#1D8751]">
                  Address is valid
                </p>
              )}
            </div>
          )}

          {/* 4. Account name */}
          {selectedAsset && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#8B90A5] mb-2">
                Account Name
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="My Main Wallet"
                className="w-full rounded-xl border border-[#E3E6F0] dark:border-[#2A2A35] bg-white dark:bg-[var(--card-color)] px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#5C6175] focus:outline-none focus:ring-2 focus:ring-[#1D8751]/50"
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 rounded-xl border border-[#E3E6F0] dark:border-[#2A2A35] text-gray-700 dark:text-[#8B90A5] font-medium hover:bg-gray-50 dark:hover:bg-[#2D2D33] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedAssetTicker ||
                !selectedNetwork ||
                !address.trim() ||
                addressIsInvalid ||
                isValidating
              }
              className="flex-1 px-4 py-3 rounded-xl bg-[#1D8751] text-white font-medium hover:bg-[#0f8f4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Adding...
                </>
              ) : (
                "Add Address"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWalletAddressModal;
