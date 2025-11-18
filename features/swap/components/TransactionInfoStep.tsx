import React from "react";
import { SupportedAsset, SwapEstimate } from "../types";
import { useTheme } from "@/context/theme";

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
  onSwapAssets?: () => void;
  activeInputField?: "from" | "to";
}

const baseCard =
  "rounded-[26px] border dark:border-[#2E2E3A] border-gray-300 bg-transparent dark:text-white text-gray-900";
const labelCopy = "text-[12px] uppercase tracking-wide dark:text-[#7d7f95] text-gray-600";
const inputBase =
  "rounded-2xl dark:bg-[#1B1B23] bg-white dark:border-[#2E2E3A] border-gray-300 dark:text-white text-gray-900 px-4 py-3 w-full min-h-[52px] dark:placeholder:text-[#5f6070] placeholder:text-gray-400 focus:outline-none";

const TransactionInfoStep: React.FC<TransactionInfoStepProps> = (props) => {
  const { isDark } = useTheme();
  const {
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
    activeInputField,
  } = props;

  const renderAssetSelector = (
    asset: SupportedAsset | null,
    isOpen: boolean,
    toggle: () => void,
    onSelect: (asset: SupportedAsset) => void,
    searchValue: string,
    onSearchChange: (value: string) => void
  ) => (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center justify-between w-full rounded-2xl border dark:border-[#2E2E3A] border-gray-300 dark:bg-[#1B1B23] bg-white px-4 py-3 min-h-[52px]"
      >
          <div className="flex items-center gap-3 text-left">
          <img
            src={
              asset?.image ||
              asset?.image_url ||
              asset?.asset_image ||
              "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
            }
            alt={asset?.name || "asset icon"}
            className="w-7 h-7 rounded-full"
            onError={(e) => {
              e.currentTarget.src =
                "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
            }}
          />
          <p className="text-sm dark:text-white text-gray-900 font-semibold flex items-center gap-2">
            <span>
              {asset
                ? asset.ticker?.toUpperCase() ||
                  asset.symbol?.toUpperCase() ||
                  asset.name
                : "Select Asset"}
            </span>
            {asset?.name && (
              <span className="dark:text-[#a4a6be] text-gray-500 font-normal text-xs">
                {asset.name}
              </span>
            )}
          </p>
        </div>
        <svg
          className={`w-5 h-5 dark:text-[#7d7f95] text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 rounded-2xl border dark:border-[#2E2E3A] border-gray-300 dark:bg-[#14141C] bg-white shadow-2xl z-50 max-h-[60vh] overflow-hidden">
          <div className="p-3 border-b dark:border-[#2E2E3A] border-gray-300">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-[#7d7f95] text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search assets..."
                className="w-full rounded-xl border dark:border-[#2E2E3A] border-gray-300 dark:bg-[#1F1F27] bg-gray-50 pl-9 pr-3 py-2 text-sm dark:text-white text-gray-900 dark:placeholder:text-[#6c6d82] placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="max-h-[45vh] overflow-y-auto">
            {(() => {
              const filtered = supportedAssets.filter((option) => {
                if (!searchValue) return true;
                const term = searchValue.toLowerCase();
                return (
                  option.ticker?.toLowerCase().includes(term) ||
                  option.name?.toLowerCase().includes(term) ||
                  option.network?.toLowerCase().includes(term)
                );
              });

              if (!filtered.length) {
                return (
                  <div className="p-4 text-center text-sm dark:text-[#7d7f95] text-gray-500">
                    {searchValue ? "No assets found" : "No assets available"}
                  </div>
                );
              }

              return filtered.map((option, idx) => (
                <button
                  key={`${option.ticker}-${option.network}-${idx}`}
                  type="button"
                  className="w-full flex items-center gap-3 p-3 text-left border-b dark:border-[#2E2E3A] border-gray-200 last:border-b-0 dark:hover:bg-[#1F1F27] hover:bg-gray-100"
                  onClick={() => {
                    onSelect(option);
                    toggle();
                  }}
                >
                  <img
                    src={
                      option.image ||
                      option.image_url ||
                      option.asset_image ||
                      "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                    }
                    alt={option.name}
                    className="w-6 h-6 rounded-full"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium dark:text-white text-gray-900">
                      {option.ticker?.toUpperCase() ||
                        option.symbol?.toUpperCase() ||
                        option.name ||
                        "Unknown"}
                    </p>
                    <p className="text-xs dark:text-[#7d7f95] text-gray-500">
                      {option.network || "Unknown"}
                    </p>
                  </div>
                  {asset?.ticker === option.ticker &&
                    asset?.network === option.network && (
                      <span className="w-2 h-2 rounded-full bg-[#1D8751]" />
                    )}
                </button>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );

  const renderAmountInput = (
    label: string,
    value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    asset: SupportedAsset | null,
    isActive: boolean
  ) => (
    <div className="space-y-2">
      {label && <p className={labelCopy}>{label}</p>}
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={onChange}
          placeholder="Enter amount"
          className={inputBase}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold dark:text-white/80 text-gray-700">
          {asset?.ticker?.toUpperCase() ||
            asset?.symbol?.toUpperCase() ||
            "USDT"}
        </span>
        {estimateLoading && isActive && (
          <span className="absolute right-12 top-1/2 -translate-y-1/2">
            <span className="h-5 w-5 rounded-full border-b-2 border-[#1D8751] animate-spin" />
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col px-3 sm:px-4 dark:text-white text-gray-900">
      <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-4 dark:text-[#9ba3c5] text-gray-700">
        <span className="dark:text-[#7e7e8f] text-gray-500 mr-1">1-</span>
        Transaction Info
      </h2>

      {/* You Send */}
      <div className="relative mb-4">
        <div className={`${baseCard} p-1 sm:p-6 space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-4">
            <div className="space-y-1 sm:flex-1">
              <p className="text-sm sm:text-base font-semibold">You Send</p>
              <p className={labelCopy}>Asset</p>
            </div>
            <p className="text-xs dark:text-[#7d7f95] text-gray-500 pb-1 ml-2 sm:ml-0 sm:flex-1 sm:pl-10 lg:pl-10">
              I want to Send
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
            {renderAssetSelector(
              fromAsset,
              isFromAssetOpen,
              onFromAssetToggle,
              onFromAssetSelect,
              searchTerm,
              onSearchTermChange
            )}
            {renderAmountInput(
              "",
              fromAmount,
              onFromAmountChange,
              fromAsset,
              activeInputField === "from"
            )}
          </div>
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2 top-full -translate-y-1/2 sm:-translate-y-1/3 z-10">
          <button
            type="button"
            onClick={onSwapAssets}
            className="flex items-center justify-center p-0 bg-transparent border-none shadow-none"
          >
            <img
              src={
                isDark
                  ? "https://res.cloudinary.com/pitz/image/upload/v1755500509/Frame_36261_ledmyw.png"
                  : "https://res.cloudinary.com/pitz/image/upload/v1756579504/Frame_36261_1_d9cnq1.png"
              }
              alt="swap"
              className="w-11 h-11"
            />
          </button>
        </div>
      </div>

      {/* You Receive */}
      <div className="mb-4">
        <div className={`${baseCard} p-4 sm:p-6 space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-4">
            <div className="space-y-1 sm:flex-1">
              <p className="text-sm sm:text-base font-semibold">You Receive</p>
              <p className={labelCopy}>Asset</p>
            </div>
            <p className="text-xs dark:text-[#7d7f95] text-gray-500 pb-1 ml-4 sm:ml-0 sm:flex-1 sm:pl-10 lg:pl-16">
              I want to Receive
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
            {renderAssetSelector(
              toAsset,
              isToAssetOpen,
              onToAssetToggle,
              onToAssetSelect,
              toSearchTerm,
              onToSearchTermChange
            )}
            {renderAmountInput(
              "",
              toAmount,
              onToAmountChange,
              toAsset,
              activeInputField === "to"
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-center gap-2 text-xs sm:text-sm dark:text-[#d5d7e2] text-gray-600 mb-3">
        <span className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-red-500 text-red-400 text-[10px]">
          !
        </span>
        <p>
          This is only an estimated price based on current market rates. The final price will be
          confirmed when we receive the funds.
        </p>
      </div>

      {!hideContinueButton && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={
            !fromAsset ||
            !toAsset ||
            !fromAmount ||
            parseFloat(fromAmount) <= 0 ||
            !estimate ||
            estimateLoading ||
            swapLoading
          }
          className={`w-full text-white text-sm sm:text-base font-medium py-3 sm:py-2.5 rounded-2xl flex items-center justify-center gap-2 transition-colors min-h-[48px] mb-2 ${
            !fromAsset ||
            !toAsset ||
            !fromAmount ||
            parseFloat(fromAmount) <= 0 ||
            !estimate ||
            estimateLoading ||
            swapLoading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-[#1D8751] hover:bg-[#147043]"
          }`}
        >
          {swapLoading ? (
            <>
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Loading...
            </>
          ) : (
            "Submit"
          )}
        </button>
      )}

      {estimateError && (
        <div className="mt-4 bg-red-500/10 dark:bg-red-500/10 border border-red-500 rounded-2xl p-3 sm:p-4 dark:text-red-200 text-red-700">
          <h3 className="font-semibold mb-1 text-sm sm:text-base">Estimate Error</h3>
          <p className="text-xs sm:text-sm break-words">{estimateError}</p>
        </div>
      )}
      {localSwapError && (
        <div className="mt-4 bg-red-500/10 dark:bg-red-500/10 border border-red-500 rounded-2xl p-3 sm:p-4 dark:text-red-200 text-red-700">
          <h3 className="font-semibold mb-1 text-sm sm:text-base">Error</h3>
          <p className="text-xs sm:text-sm break-words">{localSwapError}</p>
        </div>
      )}
    </div>
  );
};

export default TransactionInfoStep;

