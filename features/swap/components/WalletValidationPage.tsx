/**
 * WalletValidationPage.tsx – Wallet address validation component
 */
"use client";
import React, { useState, useCallback, useEffect } from "react";
import { validateWalletAddress } from "@/lib/addressValidaion";

interface SupportedAsset {
  id: string;
  name: string;
  symbol: string;
  ticker: string;
  network: string;
  icon_url: string;
  image: string;
  is_fiat: boolean;
}

interface WalletValidationPageProps {
  selectedAsset: SupportedAsset | null;
  onValidationSuccess: (address: string) => void;
  onBack: () => void;
  initialAddress?: string;
}

const WalletValidationPage: React.FC<WalletValidationPageProps> = ({
  selectedAsset,
  onValidationSuccess,
  onBack,
  initialAddress = "",
}) => {
  const [walletAddress, setWalletAddress] = useState(initialAddress);
  const [validationError, setValidationError] = useState<string>("");
  const [confirm, setConfirm] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Validate wallet address based on selected asset
  const validateWalletAddressForAsset = useCallback(
    (address: string, asset: SupportedAsset) => {
      if (!address.trim()) {
        return { isValid: false, message: "Wallet address is required" };
      }

      if (!asset?.network) {
        return { isValid: false, message: "Please select an asset first" };
      }

      // Debug: Log the network type being validated
      console.log("Validating address for network:", asset.network);
      console.log("Asset details:", asset);

      // Normalize network type to handle variations
      let normalizedNetwork = asset.network.toUpperCase();

      // Handle common variations
      if (
        normalizedNetwork.includes("TRON") ||
        normalizedNetwork.includes("TRC")
      ) {
        normalizedNetwork = "TRC20";
      } else if (
        normalizedNetwork.includes("BSC") ||
        normalizedNetwork.includes("BINANCE")
      ) {
        normalizedNetwork = "BEP20";
      } else if (
        normalizedNetwork.includes("ETHEREUM") ||
        normalizedNetwork.includes("ETH")
      ) {
        normalizedNetwork = "ETH";
      } else if (normalizedNetwork.includes("ERC")) {
        normalizedNetwork = "ERC20";
      }

      console.log("Normalized network type:", normalizedNetwork);

      return validateWalletAddress(address, normalizedNetwork);
    },
    []
  );

  // Handle wallet address change with validation
  const handleWalletAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setWalletAddress(value);

    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError("");
    }

    // Validate if we have a selectedAsset
    if (selectedAsset && value.trim()) {
      const validation = validateWalletAddressForAsset(value, selectedAsset);
      if (!validation.isValid) {
        setValidationError(validation.message || "Invalid wallet address");
      }
    }
  };

  // Handle paste with validation
  const handlePasteAddress = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setWalletAddress(text);

      // Validate the pasted address
      if (selectedAsset && text.trim()) {
        const validation = validateWalletAddressForAsset(text, selectedAsset);
        if (!validation.isValid) {
          setValidationError(validation.message || "Invalid wallet address");
        } else {
          setValidationError("");
        }
      }
    } catch (err) {
      console.error("Failed to paste from clipboard:", err);
      setValidationError("Failed to paste from clipboard");
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedAsset) {
      setValidationError("Please select an asset first");
      return;
    }

    if (!walletAddress.trim()) {
      setValidationError("Wallet address is required");
      return;
    }

    if (!confirm) {
      setValidationError("Please confirm the wallet address");
      return;
    }

    setIsValidating(true);

    try {
      const validation = validateWalletAddressForAsset(
        walletAddress,
        selectedAsset
      );
      if (!validation.isValid) {
        setValidationError(validation.message || "Invalid wallet address");
        return;
      }

      // If validation passes, call the success callback
      onValidationSuccess(walletAddress);
    } catch (error) {
      setValidationError("Validation failed. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  // Auto-validate when asset changes
  useEffect(() => {
    if (selectedAsset && walletAddress.trim()) {
      const validation = validateWalletAddressForAsset(
        walletAddress,
        selectedAsset
      );
      if (!validation.isValid) {
        setValidationError(validation.message || "Invalid wallet address");
      } else {
        setValidationError("");
      }
    }
  }, [selectedAsset, walletAddress, validateWalletAddressForAsset]);

  return (
    <div className="mx-auto bg-[#181820] p-6 rounded-2xl text-white">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">
          Wallet Address Validation
        </h2>
        <p className="text-sm text-[#8C8CA1]">
          Please enter and validate your wallet address for the selected
          cryptocurrency
        </p>
      </div>

      <div className="bg-[#23232b] border border-[#35353E] rounded-xl p-5">
        {/* Selected Asset Info */}
        {selectedAsset && (
          <div className="mb-6 bg-[#181820] border border-[#35353E] rounded-lg p-4">
            <div className="text-xs text-[#8C8CA1] mb-2">Selected Asset:</div>
            <div className="flex items-center">
              <img
                src={selectedAsset.image || undefined}
                alt={selectedAsset.name || "Asset"}
                className="w-8 h-8 mr-3"
              />
              <div className="flex flex-col">
                <span className="text-white font-medium">
                  {selectedAsset.name}
                </span>
                <span className="text-[#8C8CA1] text-sm">
                  {selectedAsset.network}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Address Input */}
        <div className="mb-4">
          <label className="block text-sm text-[#8C8CA1] mb-2">
            Wallet/Account Address
          </label>
          <div className="relative">
            {/* Wallet Icon */}
            <span className="absolute left-4 top-1/2 -translate-y-1/2">
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1749724441/wallet-01_hugnf4.png"
                alt="Wallet Icon"
                className="w-4 h-4"
              />
            </span>

            <input
              type="text"
              placeholder="Paste here your Crypto address"
              value={walletAddress}
              onChange={handleWalletAddressChange}
              className={`w-full bg-[#181820] border rounded-[18px] px-12 py-3 text-white outline-none placeholder-[#8C8CA1] text-base transition-colors ${
                validationError
                  ? "border-red-500 focus:border-red-400"
                  : "border-[#35353E] focus:border-[#1D8751]"
              }`}
            />

            {/* Paste Button */}
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-[#35353E] text-[#8C8CA1] px-4 py-2 rounded-[18px] font-medium hover:bg-[#45454E] transition-colors"
              onClick={handlePasteAddress}
              type="button"
            >
              Paste
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1749724441/wallet-01_hugnf4.png"
                alt="Paste Icon"
                className="w-4 h-4 ml-1"
              />
            </button>
          </div>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="mb-4 text-red-500 text-sm bg-red-900/20 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {validationError}
            </div>
          </div>
        )}

        {/* Network Requirements */}
        {selectedAsset && (
          <div className="mb-4 bg-[#181820] border border-[#35353E] rounded-lg p-3">
            <div className="text-xs text-[#8C8CA1] mb-2">
              Network Requirements:
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center">
                <span className="text-white">Network:</span>
                <span className="ml-2 text-[#1D8751] font-medium">
                  {selectedAsset.network}
                </span>
              </div>
              <div className="text-xs text-[#8C8CA1]">
                {(() => {
                  const network = selectedAsset.network.toUpperCase();
                  if (network.includes("TRON") || network.includes("TRC")) {
                    return "Address must start with 'T' and be 34 characters long";
                  } else if (
                    network.includes("BSC") ||
                    network.includes("BINANCE") ||
                    network.includes("BEP")
                  ) {
                    return "Address must start with '0x' and be 42 characters long";
                  } else if (
                    network.includes("ETHEREUM") ||
                    network.includes("ETH") ||
                    network.includes("ERC")
                  ) {
                    return "Address must start with '0x' and be 42 characters long";
                  } else if (
                    network.includes("BITCOIN") ||
                    network.includes("BTC")
                  ) {
                    return "Address must start with '1', '3', or 'bc1' and be 26-90 characters long";
                  } else {
                    return "Please check the network requirements for your selected asset";
                  }
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Checkbox */}
        <div className="mb-6">
          <div className="flex items-start">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
              className="mr-3 mt-1 accent-[#1D8751] w-5 h-5 rounded border border-[#F79330] cursor-pointer"
              id="confirm-address"
            />
            <label
              htmlFor="confirm-address"
              className="text-sm text-white leading-relaxed"
            >
              I confirm that the above submitted address is correct for the{" "}
              <span className="text-[#1D8751] font-medium">
                {selectedAsset?.network || "selected"} network
              </span>{" "}
              and not for any other cryptocurrency. I understand that sending to
              the wrong network may result in permanent loss of funds.
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            className="bg-[#35353E] hover:bg-[#45454E] text-white px-6 py-3 rounded-[24px] font-semibold transition-colors"
            onClick={onBack}
            disabled={isValidating}
          >
            Back
          </button>
          <button
            className="bg-[#1D8751] hover:bg-[#16663d] text-white px-8 py-3 rounded-[24px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              !walletAddress || !confirm || !!validationError || isValidating
            }
            onClick={handleSubmit}
          >
            {isValidating ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Validating...
              </div>
            ) : (
              "Validate & Continue"
            )}
          </button>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-6 bg-[#23232b] border border-[#35353E] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-2">
          Important Notes:
        </h3>
        <ul className="text-xs text-[#8C8CA1] space-y-1">
          <li>• Always double-check the wallet address before confirming</li>
          <li>
            • Ensure you're using the correct network for your cryptocurrency
          </li>
          <li>
            • Sending to the wrong network may result in permanent loss of funds
          </li>
          <li>• We recommend testing with a small amount first</li>
        </ul>
      </div>
    </div>
  );
};

export default WalletValidationPage;
