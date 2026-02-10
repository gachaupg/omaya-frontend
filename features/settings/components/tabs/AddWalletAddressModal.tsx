"use client";

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { createUserWalletAddress } from "@/features/settings/slices/userWalletAddressesSlice";
import { showToast } from "@/lib/utils/toast";

const ASSETS = [
  "USDT",
  "USDC",
  "BNB",
  "ETH",
  "TRX",
  "BTC",
  "SOL",
  "XRP",
  "MATIC",
  "AVAX",
  "DOGE",
];

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
  const [address, setAddress] = useState("");
  const [accountName, setAccountName] = useState("");
  const [label, setLabel] = useState("");
  const [asset, setAsset] = useState("USDT");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Validate wallet address as user types
  const validateAddress = (value: string) => {
    const trimmed = value.trim();
    
    if (!trimmed) {
      setAddressError(null);
      return;
    }

    // Minimum length check (most crypto addresses are at least 26 chars, but some like BTC are shorter)
    // Using 20 as minimum for most chains
    if (trimmed.length < 20) {
      setAddressError("Address is too short. Minimum 20 characters required.");
      return;
    }

    // Check for invalid characters (spaces, special characters that shouldn't be in addresses)
    // Most crypto addresses are alphanumeric, some include specific characters like 0x prefix
    // Allow: alphanumeric, 0x prefix, hyphens (for some formats)
    const invalidPattern = /[^a-zA-Z0-9x\-]/;
    if (invalidPattern.test(trimmed)) {
      setAddressError("Address contains invalid characters. Only letters, numbers, and hyphens are allowed.");
      return;
    }

    // Check for spaces
    if (/\s/.test(trimmed)) {
      setAddressError("Address cannot contain spaces.");
      return;
    }

    setAddressError(null);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    validateAddress(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      showToast.error("Wallet address is required");
      return;
    }
    if (addressError) {
      showToast.error(addressError);
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
          label: label.trim() || accountName.trim(),
          asset,
        }) as any
      );

      if (createUserWalletAddress.fulfilled.match(result)) {
        showToast.success("Wallet address created successfully. It is pending admin approval.");
        setAddress("");
        setAccountName("");
        setLabel("");
        setAsset("USDT");
        setAddressError(null);
        onClose();
        onSuccess?.();
      } else if (createUserWalletAddress.rejected.match(result)) {
        const errorMsg = result.payload || "Failed to create wallet address";
        showToast.error(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAddress("");
    setAccountName("");
    setLabel("");
    setAsset("USDT");
    setAddressError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md rounded-2xl border border-[#E3E6F0] dark:border-[#2A2A35] bg-white dark:bg-[var(--card-color)] p-6 shadow-xl">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#8B90A5] mb-2">
              Wallet Address
            </label>
            <input
              type="text"
              value={address}
              onChange={handleAddressChange}
              placeholder="0x1234...5678"
              className={`w-full rounded-xl border ${
                addressError
                  ? "border-red-500 dark:border-red-500"
                  : "border-[#E3E6F0] dark:border-[#2A2A35]"
              } bg-white dark:bg-[var(--card-color)] px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#5C6175] focus:outline-none focus:ring-2 ${
                addressError
                  ? "focus:ring-red-500/50"
                  : "focus:ring-[#1D8751]/50"
              }`}
              required
            />
            {addressError && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">
                {addressError}
              </p>
            )}
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#8B90A5] mb-2">
              Label (optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Binance Wallet"
              className="w-full rounded-xl border border-[#E3E6F0] dark:border-[#2A2A35] bg-white dark:bg-[var(--card-color)] px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#5C6175] focus:outline-none focus:ring-2 focus:ring-[#1D8751]/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#8B90A5] mb-2">
              Asset
            </label>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              className="w-full rounded-xl border border-[#E3E6F0] dark:border-[#2A2A35] bg-white dark:bg-[var(--card-color)] px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D8751]/50"
            >
              {ASSETS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-gray-500 dark:text-[#7B819C]">
            New addresses require admin approval before use.
          </p>

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
              disabled={isSubmitting || !!addressError || !address.trim()}
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
