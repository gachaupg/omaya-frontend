import React from "react";
import AssetDropdown from "./AssetDropdown";
import EstimatedPriceDisplay from "./EstimatedPriceDisplay";
import { SupportedAsset, SwapEstimate } from "../types";

interface TransactionInfoStepProps {
  fromAsset: SupportedAsset | null;
  toAsset: SupportedAsset | null;
  fromAmount: string;
  toAmount: string;
  supportedAssets: SupportedAsset[];
  estimate: SwapEstimate | null;
  estimateLoading: boolean;
  estimateError: string | null;
  localSwapError: string;
  isFromAssetOpen: boolean;
  isToAssetOpen: boolean;
  searchTerm: string;
  toSearchTerm: string;
  onFromAssetSelect: (asset: SupportedAsset) => void;
  onToAssetSelect: (asset: SupportedAsset) => void;
  onFromAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFromAssetToggle: () => void;
  onToAssetToggle: () => void;
  onSearchTermChange: (term: string) => void;
  onToSearchTermChange: (term: string) => void;
  onSubmit: () => void;
  swapLoading: boolean;
  hideContinueButton?: boolean;
  onSwapAssets?: () => void; // New prop for handling asset swap
}

const TransactionInfoStep: React.FC<TransactionInfoStepProps> = ({
  fromAsset,
  toAsset,
  fromAmount,
  toAmount,
  supportedAssets,
  estimate,
  estimateLoading,
  estimateError,
  localSwapError,
  isFromAssetOpen,
  isToAssetOpen,
  searchTerm,
  toSearchTerm,
  onFromAssetSelect,
  onToAssetSelect,
  onFromAmountChange,
  onToAmountChange,
  onFromAssetToggle,
  onToAssetToggle,
  onSearchTermChange,
  onToSearchTermChange,
  onSubmit,
  swapLoading,
  hideContinueButton,
  onSwapAssets,
}) => {
  return (
    <div className="mb-2">
      <div className="mb-1 text-base dark:text-[#788099] text-gray-600 font-semibold">
        1-Transaction Info
      </div>
      <div className="dark:bg-[#1D1D23] bg-white dark:border-[#35353E] border-gray-200 border-2 rounded-xl p-2 ">
        <div className="flex flex-col gap-4">
          {/* You Send */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="text-xs mb-1 dark:text-white text-gray-900">
                You Send
              </div>
              <div className="flex items-center dark:border-[#35353E] border-gray-300 border rounded-[13px] px-2 py-2">
                <input
                  type="text"
                  value={fromAmount}
                  onChange={onFromAmountChange}
                  className="bg-transparent outline-none w-full dark:text-white text-gray-900"
                  placeholder="0.00"
                />
                <span className="ml-2 text-xs capitalize dark:text-white text-gray-900">
                  {fromAsset?.ticker}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs mb-1 dark:text-white text-gray-900">
                Asset
              </div>
              <AssetDropdown
                className="bg-transparent dark:border-[#35353E] border-gray-300 border rounded-[13px] px-2 py-2 dark:text-white text-gray-900"
                assets={supportedAssets}
                selectedAsset={fromAsset}
                onAssetSelect={onFromAssetSelect}
                isOpen={isFromAssetOpen}
                onToggle={onFromAssetToggle}
                searchTerm={searchTerm}
                onSearchChange={onSearchTermChange}
                placeholder="Select an asset"
                label="From Asset"
              />
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-center text-[#FF4D4D] text-xs mt-1">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs dark:text-[#ffff] text-gray-700">
              This is only estimated price and its based on current Market
              Price. We will fix the price when we receive the funds.
            </span>
          </div>

          {/* Estimated Price Display */}
          <EstimatedPriceDisplay
            estimate={estimate}
            fromAsset={fromAsset}
            toAsset={toAsset}
            fromAmount={fromAmount}
            estimateLoading={estimateLoading}
            onSwapAssets={onSwapAssets}
          />

          <div className="text-xs flex items-center gap-2 justify-between">
            <span className="dark:text-[#ffff] text-gray-900">
              You will receive
            </span>
            <span className="dark:text-[#ffff] text-gray-900">
              {toAsset && (
                <img
                  src={toAsset.image || undefined}
                  alt={toAsset.ticker || "Asset"}
                  className="w-6 h-6 mr-2"
                />
              )}
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="text-xs dark:text-[#8C8CA1] text-gray-600">
                I want to Receive
              </div>
              <div className="flex items-center dark:border-[#35353E] border-gray-300 border rounded-[18px] px-4 py-3">
                <input
                  type="text"
                  value={toAmount}
                  onChange={onToAmountChange}
                  className="bg-transparent outline-none w-full dark:text-white text-gray-900"
                  placeholder="0.00"
                  readOnly={estimateLoading}
                />
                <span className="ml-2 text-xs dark:text-white text-gray-900">
                  {toAsset?.ticker}
                </span>
                {estimateLoading && (
                  <div className="ml-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1D8751]"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs dark:text-[#8C8CA1] text-gray-600 mb-1">
                Asset
              </div>
              <AssetDropdown
                assets={supportedAssets}
                selectedAsset={toAsset}
                onAssetSelect={onToAssetSelect}
                isOpen={isToAssetOpen}
                onToggle={onToAssetToggle}
                searchTerm={toSearchTerm}
                onSearchChange={onToSearchTermChange}
                placeholder="Select an asset"
                label="To Asset"
              />
            </div>
          </div>

          {/* Error Display */}
          {estimateError && (
            <div className="text-red-500 text-xs bg-red-900/20 border border-red-500/30 rounded-lg p-2">
              {estimateError}
            </div>
          )}
          {localSwapError && (
            <div className="text-red-500 text-xs bg-red-900/20 border border-red-500/30 rounded-lg p-2">
              {localSwapError}
            </div>
          )}
        </div>
        {!hideContinueButton && (
          <div className="flex w-full mt-2">
            <button
              className="bg-[#1D8751] w-full hover:bg-[#16663d] text-white px-6 py-2 rounded-[24px] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                !fromAsset ||
                !toAsset ||
                !fromAmount ||
                parseFloat(fromAmount) <= 0 ||
                !estimate ||
                estimateLoading
              }
              onClick={onSubmit}
            >
              {swapLoading ? "Loading..." : "Submit"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionInfoStep;
