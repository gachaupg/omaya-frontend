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
}) => {
  return (
    <div className="mb-8">
      <div className="mb-2 text-base font-semibold">1- Transaction Info</div>
      <div className="bg-[#1D1D23] border-2 border-[#35353E] rounded-xl p-5 mb-2">
      <div className="dark:bg-[#23232b] bg-[#F5F5F5] border dark:border-[#35353E] border-gray-300 rounded-xl p-5 mb-2">
        <div className="flex flex-col gap-4">
          {/* You Send */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="text-xs mb-1">You Send</div>
              <AssetDropdown
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
            <div className="flex-1">
              <div className="text-xs mb-1">I want to Send</div>
              <div className="flex items-center dark:bg-[#181820] bg-white rounded-[18px] px-3 py-2">
                <input
                  type="text"
                  value={fromAmount}
                  onChange={onFromAmountChange}
                  className="bg-transparent outline-none w-full dark:text-white text-[#0D0D0D]"
                  placeholder="0.00"
                />
                <span className="ml-2 text-xs">{fromAsset?.ticker}</span>
              </div>
            </div>
          </div>

          {/* Swap Icon */}
          <div className="flex justify-center">
            <button className="dark:bg-[#35353E] bg-gray-300 hover:dark:bg-[#40404A] hover:bg-gray-400 rounded-lg p-2 transition-colors">
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1752243765/Vector_2_xauedx.png"
                alt="Exchange"
                className="w-5 h-5"
              />
            </button>
          </div>

          {/* You Get */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="text-xs mb-1">You Get</div>
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
            <div className="flex-1">
              <div className="text-xs mb-1">I want to Receive</div>
              <div className="flex items-center dark:bg-[#181820] bg-white rounded-[18px] px-3 py-2">
                <input
                  type="text"
                  value={toAmount}
                  onChange={onToAmountChange}
                  className="bg-transparent outline-none w-full dark:text-white text-[#0D0D0D]"
                  placeholder="0.00"
                  readOnly
                />
                <span className="ml-2 text-xs">{toAsset?.ticker}</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 dark:bg-[#3a2a1a] bg-orange-50 rounded-lg">
            <div className="w-5 h-5 flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 dark:text-orange-400 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs dark:text-orange-300 text-orange-700 leading-relaxed">
                The final amount you receive may vary slightly. We use floating
                rates to ensure you get the best exchange rate at the time of
                completion.
              </p>
            </div>
          </div>
        </div>
        {!hideContinueButton && (
          <div className="flex w-full mt-4">
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
              {swapLoading ? "Loading..." : "Continue"}
            </button>
          </div>
        )}


        {/* Display estimated price */}
        <EstimatedPriceDisplay
          estimate={estimate}
          fromAsset={fromAsset}
          toAsset={toAsset}
          fromAmount={fromAmount}
          estimateLoading={estimateLoading}
        />

        {/* Error display */}
        {(estimateError || localSwapError) && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">
              {estimateError || localSwapError}
            </p>
          </div>
        )}

        {/* Next button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={onSubmit}
            disabled={swapLoading || estimateLoading || !estimate}
            className="px-6 py-3 bg-[#1D8751] hover:bg-[#16663d] disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {swapLoading || estimateLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading...
              </div>
            ) : (
              "Next Step"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionInfoStep;
