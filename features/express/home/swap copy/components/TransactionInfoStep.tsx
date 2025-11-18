import React from "react";
import AssetDropdown from "./AssetDropdown";
import EstimatedPriceDisplay from "./EstimatedPriceDisplay";
import { SupportedAsset, SwapEstimate } from "../types";
import { useTheme } from "@/context/theme";
import SuccessPage from "./success";

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
  activeInputField,
}) => {
  const { isDark } = useTheme();

  return (
    <div className="w-full flex flex-col mt-2">
      <div className={`w-full mx-auto ${isDark ? "text-white" : "text-[#1F2937]"}`}>
        {/* Top Section - You Send and You Get in one card */}
        <div className="relative mb-4">
          {/* Top Card Container */}
          <div
            className={`relative flex rounded-2xl p-4 overflow-visible ${
              isDark ? "border border-[#2F2F3A] bg-[#0F0F17]" : "border border-[#E2E8F0] bg-white shadow-sm"
            }`}
          >
            {/* You Send Section */}
            <div className="flex-1 pr-4">
              <label
                className={`block text-[15px] mb-2 font-semibold flex items-center gap-2 ${
                  isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                }`}
              >
                You Send
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={fromAmount}
                  onChange={onFromAmountChange}
                  placeholder="Enter amount"
                  className={`w-full rounded-2xl px-4 py-2 pr-16 text-lg focus:outline-none border appearance-none ${
                    isDark ? "border-[#35353E] bg-transparent text-white" : "border-[#CBD5F5] bg-white text-[#111827]"
                  }`}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className={`text-sm font-medium ${isDark ? "text-white" : "text-[#35353e]"}`}>
                    {fromAsset
                      ? fromAsset.ticker?.toUpperCase() ||
                        fromAsset.symbol?.toUpperCase() ||
                        "USDT"
                      : "USDT"}
                  </span>
                </div>
              </div>
            </div>

            {/* You Get Section */}
            <div className="flex-1 pl-4">
              <label
                className={`block text-[15px] mb-2 font-semibold ${
                  isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                }`}
              >
                Asset
              </label>
              <div className="relative">
                <div
                  className={`w-full rounded-2xl px-4 py-2 text-lg focus:outline-none border flex items-center justify-between cursor-pointer ${
                    isDark ? "bg-transparent text-white border-[#39394A]" : "bg-white text-[#1F2937] border-[#CBD5F5]"
                  }`}
                  onClick={onFromAssetToggle}
                >
                  <div className="flex items-center gap-3">
                    {fromAsset ? (
                      <>
                        <img
                          src={
                            fromAsset.image ||
                            fromAsset.image_url ||
                            fromAsset.asset_image ||
                            "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                          }
                          alt={fromAsset.name}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>
                            {(() => {
                              // Prioritize ticker/symbol, but show name if ticker/symbol is not available
                              const ticker = fromAsset.ticker?.toUpperCase() || fromAsset.symbol?.toUpperCase();
                              return ticker || fromAsset.name || "Unknown";
                            })()}
                          </span>
                          <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-semibold px-2 py-0.5 rounded-full">
                            {fromAsset.network || "Unknown"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <img
                          src="https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                          alt="asset icon"
                          className="w-6 h-6"
                        />
                        <span className={isDark ? "text-[#788099]" : "text-[#64748B]"}>
                          {supportedAssets.length === 0 ? "Loading assets..." : "Select Asset"}
                        </span>
                      </>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-[#7e7e8f] transition-transform ${
                      isFromAssetOpen ? "rotate-180" : ""
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
                {isFromAssetOpen && (
                  <div className={`absolute top-full left-0 right-0 mt-1 rounded-2xl z-50 max-h-80 overflow-hidden ${
                    isDark ? "bg-[#1D1D23] border border-[#A2A4A9FF]" : "bg-white border border-[#A2A4A9FF]"
                  }`}>
                    {/* Search Input */}
                    <div className={`p-3 border-b ${isDark ? "border-[#A2A4A9FF]" : "border-[#A2A4A9FF]"}`}>
                      <div className="relative">
                        <svg
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7e7e8f] w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search assets..."
                          value={searchTerm}
                          onChange={(e) => onSearchTermChange(e.target.value)}
                          className={`w-full rounded-xl px-10 py-2 text-sm focus:outline-none border ${
                            isDark ? "bg-[#1D1D23] text-white border-[#35353E] placeholder-gray-400" : "bg-white text-gray-900 border-[#35353E] placeholder-gray-500"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Asset List */}
                    <div className="max-h-60 overflow-y-auto">
                      {(() => {
                        const filteredAssets = supportedAssets.filter(
                          (asset: SupportedAsset) => {
                            if (!searchTerm) return true;

                            const searchLower = searchTerm.toLowerCase();
                            const ticker = asset.ticker?.toLowerCase() || "";
                            const name = asset.name?.toLowerCase() || "";
                            const network = asset.network?.toLowerCase() || "";

                            return (
                              ticker.includes(searchLower) ||
                              name.includes(searchLower) ||
                              network.includes(searchLower)
                            );
                          }
                        );

                        return filteredAssets.length > 0 ? (
                          filteredAssets.map((asset: SupportedAsset, index) => (
                            <div
                              key={`${asset.ticker}-${asset.network}-${index}`}
                              className={`flex items-center gap-3 p-3 cursor-pointer border-b last:border-b-0 ${
                                isDark 
                                  ? "text-white hover:bg-[#35353E] border-[#A2A4A9FF]" 
                                  : "text-black hover:bg-[#78787AFF] border-[#A2A4A9FF]"
                              }`}
                              onClick={() => {
                                onFromAssetSelect(asset);
                                onFromAssetToggle();
                              }}
                            >
                              <img
                                src={
                                  asset.image ||
                                  asset.image_url ||
                                  asset.asset_image ||
                                  "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                                }
                                alt={asset.name}
                                className="w-6 h-6 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                                }}
                              />
                              <div className="flex-1">
                                <div className={`font-medium flex items-center gap-2 ${
                                  isDark ? "text-white" : "text-[#111827]"
                                }`}>
                                  {asset.ticker?.toUpperCase() ||
                                    asset.symbol?.toUpperCase() ||
                                    asset.name ||
                                    "Unknown"}
                                  <span className="bg-[#1D8751] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                    {asset.network || "Unknown"}
                                  </span>
                                </div>
                                <div className={`text-sm ${
                                  isDark ? "text-[#788099]" : "text-[#475569]"
                                }`}>
                                  {asset.name ||
                                    asset.ticker?.toUpperCase() ||
                                    asset.symbol?.toUpperCase() ||
                                    "Unknown Asset"}
                                </div>
                              </div>
                              {fromAsset?.ticker === asset.ticker &&
                                fromAsset?.network === asset.network && (
                                  <div className="w-2 h-2 bg-[#1D8751] rounded-full"></div>
                                )}
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-[#7e7e8f]">
                            {searchTerm
                              ? "No assets found"
                              : "No assets available"}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Swap Circle - positioned to touch both borders equally */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full -translate-y-1/3 z-10">
            <button
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105"
              onClick={onSwapAssets}
            >
              {/* Light mode image */}
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1756579504/Frame_36261_1_d9cnq1.png"
                alt="swap icon"
                className="w-16 h-16 dark:hidden"
              />
              {/* Dark mode image */}
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1755500509/Frame_36261_ledmyw.png"
                alt="swap icon"
                className="w-16 h-16 hidden dark:block"
              />
            </button>
          </div>
        </div>

        {/* Bottom Section - You Receive and Asset in one card */}
        <div className="relative mb-3">
          <div
            className={`relative flex rounded-2xl p-4 overflow-visible ${
              isDark ? "border border-[#2F2F3A] bg-[#0F0F17]" : "border border-[#E2E8F0] bg-white shadow-sm"
            }`}
          >
            {/* You Receive Section */}
            <div className="flex-1 pr-4">
              <label
                className={`block text-[15px] mb-2 font-semibold flex items-center gap-2 ${
                  isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                }`}
              >
                You Receive
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={toAmount}
                  onChange={onToAmountChange}
                  placeholder="Enter amount"
                  className={`w-full rounded-2xl px-4 py-2 pr-16 text-lg focus:outline-none border appearance-none ${
                    activeInputField === "to"
                      ? "border-[#1D8751]"
                      : isDark
                      ? "border-[#35353E] bg-transparent text-white"
                      : "border-[#CBD5F5] bg-white text-[#111827]"
                  }`}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className={`text-sm font-medium ${isDark ? "text-white" : "text-[#35353e]"}`}>
                    {toAsset
                      ? toAsset.ticker?.toUpperCase() ||
                        toAsset.symbol?.toUpperCase() ||
                        "USDT"
                      : "USDT"}
                  </span>
                </div>
                {estimateLoading && activeInputField === "to" && (
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D8751]"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Asset Section */}
            <div className="flex-1 pl-4">
              <label
                className={`block text-[15px] mb-2 font-semibold ${
                  isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                }`}
              >
                Asset
              </label>
              <div className="relative">
                <div
                  className={`w-full rounded-2xl px-4 py-2 text-lg focus:outline-none border flex items-center justify-between cursor-pointer ${
                    isDark ? "bg-transparent text-white border-[#39394A]" : "bg-white text-[#1F2937] border-[#CBD5F5]"
                  }`}
                  onClick={onToAssetToggle}
                >
                  <div className="flex items-center gap-3">
                    {toAsset ? (
                      <>
                        <img
                          src={
                            toAsset.image ||
                            toAsset.image_url ||
                            toAsset.asset_image ||
                            "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                          }
                          alt={toAsset.name}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>
                            {(() => {
                              // Prioritize ticker/symbol, but show name if ticker/symbol is not available
                              const ticker = toAsset.ticker?.toUpperCase() || toAsset.symbol?.toUpperCase();
                              return ticker || toAsset.name || "Unknown";
                            })()}
                          </span>
                          <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-semibold px-2 py-0.5 rounded-full">
                            {toAsset.network || "Unknown"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <img
                          src="https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                          alt="asset icon"
                          className="w-6 h-6"
                        />
                        <span className={isDark ? "text-[#788099]" : "text-[#64748B]"}>
                          {supportedAssets.length === 0 ? "Loading assets..." : "Select Asset"}
                        </span>
                      </>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-[#7e7e8f] transition-transform ${
                      isToAssetOpen ? "rotate-180" : ""
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
                {isToAssetOpen && (
                  <div className={`absolute top-full left-0 right-0 mt-1 rounded-2xl z-50 max-h-80 overflow-hidden ${
                    isDark ? "bg-[#1D1D23] border border-[#A2A4A9FF]" : "bg-white border border-[#A2A4A9FF]"
                  }`}>
                    {/* Search Input */}
                    <div className={`p-3 border-b ${isDark ? "border-[#A2A4A9FF]" : "border-[#A2A4A9FF]"}`}>
                      <div className="relative">
                        <svg
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7e7e8f] w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search assets..."
                          value={toSearchTerm}
                          onChange={(e) => onToSearchTermChange(e.target.value)}
                          className={`w-full rounded-xl px-10 py-2 text-sm focus:outline-none border ${
                            isDark ? "bg-[#1D1D23] text-white border-[#35353E] placeholder-gray-400" : "bg-white text-gray-900 border-[#35353E] placeholder-gray-500"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Asset List */}
                    <div className="max-h-60 overflow-y-auto">
                      {(() => {
                        const filteredAssets = supportedAssets.filter(
                          (asset: SupportedAsset) => {
                            if (!toSearchTerm) return true;

                            const searchLower = toSearchTerm.toLowerCase();
                            const ticker = asset.ticker?.toLowerCase() || "";
                            const name = asset.name?.toLowerCase() || "";
                            const network = asset.network?.toLowerCase() || "";

                            return (
                              ticker.includes(searchLower) ||
                              name.includes(searchLower) ||
                              network.includes(searchLower)
                            );
                          }
                        );

                        return filteredAssets.length > 0 ? (
                          filteredAssets.map((asset: SupportedAsset, index) => (
                            <div
                              key={`${asset.ticker}-${asset.network}-${index}`}
                              className={`flex items-center gap-3 p-3 cursor-pointer border-b last:border-b-0 ${
                                isDark 
                                  ? "text-white hover:bg-[#35353E] border-[#A2A4A9FF]" 
                                  : "text-black hover:bg-[#78787AFF] border-[#A2A4A9FF]"
                              }`}
                              onClick={() => {
                                onToAssetSelect(asset);
                                onToAssetToggle();
                              }}
                            >
                              <img
                                src={
                                  asset.image ||
                                  asset.image_url ||
                                  asset.asset_image ||
                                  "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                                }
                                alt={asset.name}
                                className="w-6 h-6 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                                }}
                              />
                              <div className="flex-1">
                                <div className={`font-medium flex items-center gap-2 ${
                                  isDark ? "text-white" : "text-[#111827]"
                                }`}>
                                  {asset.ticker?.toUpperCase() ||
                                    asset.symbol?.toUpperCase() ||
                                    asset.name ||
                                    "Unknown"}
                                  <span className="bg-[#1D8751] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                    {asset.network || "Unknown"}
                                  </span>
                                </div>
                                <div className={`text-sm ${
                                  isDark ? "text-[#788099]" : "text-[#475569]"
                                }`}>
                                  {asset.name ||
                                    asset.ticker?.toUpperCase() ||
                                    asset.symbol?.toUpperCase() ||
                                    "Unknown Asset"}
                                </div>
                              </div>
                              {toAsset?.ticker === asset.ticker &&
                                toAsset?.network === asset.network && (
                                  <div className="w-2 h-2 bg-[#1D8751] rounded-full"></div>
                                )}
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-[#7e7e8f]">
                            {toSearchTerm
                              ? "No assets found"
                              : "No assets available"}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      
        {/* Submit Button */}
        {!hideContinueButton && (
          <div className="mt-4">
            <button
              className={`w-full text-base font-medium py-2 rounded-2xl flex items-center justify-center gap-2 transition-colors text-white ${
                !fromAsset ||
                !toAsset ||
                !fromAmount ||
                parseFloat(fromAmount) <= 0 ||
                !estimate ||
                estimateLoading ||
                swapLoading
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#1D8751] hover:bg-[#166b3e]"
              }`}
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
            >
              {swapLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center">
                  <span className="text-base font-bold dark:text-white text-white">E</span>
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

        {/* Error Display */}
        {localSwapError && (
          <div className="mt-4 bg-red-500/10 border border-red-500 rounded-2xl p-4">
            <h3 className="text-red-500 font-semibold mb-2">Error</h3>
            <p className="text-red-400 text-sm">{localSwapError}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionInfoStep;
