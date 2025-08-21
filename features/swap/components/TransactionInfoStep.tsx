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
  onSwapAssets?: () => void;
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
    <div className="w-full min-h-screen flex flex-col justify- bg-[#18181f]">
      <h2 className="text-xl font-bold mb-2 text-[#788099]">
        <span className="text-[#7e7e8f]">1-</span> Transaction Info
      </h2>
      <div className="w-full max-w-4xl mx-auto text-white">
        {/* Top Section - You Send and You Get in one card */}
        <div className="relative mb-4">
          {/* Top Card Container */}
          <div className="flex border border-[#39394a] rounded-2xl p-4">
            {/* You Send Section */}
            <div className="flex-1 pr-4">
              <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                You Send
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={fromAmount}
                  onChange={onFromAmountChange}
                  placeholder="Enter amount"
                  className="w-full bg-[#1D1D23] rounded-2xl px-4 py-2 pr-16 text-lg text-white focus:outline-none border border-[#39394a] appearance-none"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-white text-sm font-medium">
                    {fromAsset ? (fromAsset.ticker?.toUpperCase() || fromAsset.symbol?.toUpperCase() || "USDT") : "USDT"}
                  </span>
                </div>
              </div>
            </div>

            {/* You Get Section */}
            <div className="flex-1 pl-4">
              <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                Asset
              </label>
              <div className="relative">
                <div
                  className={`w-full bg-[#1D1D23] rounded-2xl px-4 py-2 text-lg text-white focus:outline-none border border-[#39394a] flex items-center justify-between cursor-pointer`}
                  onClick={onFromAssetToggle}
                >
                  <div className="flex items-center gap-3">
                    {fromAsset ? (
                      <>
                        <img
                          src={
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
                        <span className="text-white">
                          {fromAsset.ticker?.toUpperCase() ||
                            fromAsset.symbol?.toUpperCase() ||
                            fromAsset.name ||
                            "Unknown"}
                        </span>
                        <span className="ml-2 bg-[#1D8751] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                          {fromAsset.network || "Unknown"}
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
                          Select Asset
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
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1D1D23] border border-[#39394a] rounded-2xl z-50 max-h-80 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-3 border-b border-[#39394a]">
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7e7e8f] w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search assets..."
                          value={searchTerm}
                          onChange={(e) => onSearchTermChange(e.target.value)}
                          className="w-full bg-[#23232b] rounded-xl px-10 py-2 text-white text-sm focus:outline-none border border-[#39394a]"
                        />
                      </div>
                    </div>

                    {/* Asset List */}
                    <div className="max-h-60 overflow-y-auto">
                      {supportedAssets.length > 0 ? (
                        supportedAssets.map((asset: SupportedAsset) => (
                          <div
                            key={asset.asset_id}
                            className="flex items-center gap-3 p-3 hover:bg-[#23232b] cursor-pointer border-b border-[#39394a] last:border-b-0"
                            onClick={() => {
                              onFromAssetSelect(asset);
                              onFromAssetToggle();
                            }}
                          >
                            <img
                              src={
                                asset.image_url ||
                                asset.asset_image ||
                                "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                              }
                              alt={asset.name}
                              className="w-6 h-6 rounded-full"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                              }}
                            />
                            <div className="flex-1">
                              <div className="text-white font-medium flex items-center gap-2">
                                {asset.ticker?.toUpperCase() ||
                                  asset.symbol?.toUpperCase() ||
                                  asset.name ||
                                  "Unknown"}
                                <span className="bg-[#1D8751] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                  {asset.network || "Unknown"}
                                </span>
                              </div>
                              <div className="text-[#7e7e8f] text-sm">
                                {asset.name ||
                                  asset.ticker?.toUpperCase() ||
                                  asset.symbol?.toUpperCase() ||
                                  "Unknown Asset"}
                              </div>
                            </div>
                            {fromAsset?.asset_id === asset.asset_id && (
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
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Swap Circle - positioned to touch both borders equally */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full -translate-y-1/3 z-10">
            <button
              className="w-16 h-16 bg-transparent rounded-full flex items-center justify-center hover:bg-[#23232b]/10 transition-colors shadow-lg"
              onClick={onSwapAssets}
            >
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1755500509/Frame_36261_ledmyw.png"
                alt="swap icon"
                className="w-12 h-12"
              />
            </button>
          </div>
        </div>

        {/* Bottom Section - You Receive and Asset in one card */}
        <div className="relative mb-3">
          <div className="flex border border-[#39394a] rounded-2xl p-4">
            {/* You Receive Section */}
            <div className="flex-1 pr-4">
              <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                You Receive
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={toAmount}
                  onChange={onToAmountChange}
                  placeholder="Enter amount"
                  className="w-full bg-[#1D1D23] rounded-2xl px-4 py-2 pr-16 text-lg text-white focus:outline-none border border-[#39394a] appearance-none"
                  readOnly={estimateLoading}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-white text-sm font-medium">
                    {toAsset ? (toAsset.ticker?.toUpperCase() || toAsset.symbol?.toUpperCase() || "USDT") : "USDT"}
                  </span>
                </div>
                {estimateLoading && (
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D8751]"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Asset Section */}
            <div className="flex-1 pl-4">
              <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                Asset
              </label>
              <div className="relative">
                <div
                  className={`w-full bg-[#1D1D23] rounded-2xl px-4 py-2 text-lg text-white focus:outline-none border border-[#39394a] flex items-center justify-between cursor-pointer`}
                  onClick={onToAssetToggle}
                >
                  <div className="flex items-center gap-3">
                    {toAsset ? (
                      <>
                        <img
                          src={
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
                        <span className="text-white">
                          {toAsset.ticker?.toUpperCase() ||
                            toAsset.symbol?.toUpperCase() ||
                            toAsset.name ||
                            "Unknown"}
                        </span>
                        <span className="ml-2 bg-[#1D8751] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                          {toAsset.network || "Unknown"}
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
                          Select Asset
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
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1D1D23] border border-[#39394a] rounded-2xl z-50 max-h-80 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-3 border-b border-[#39394a]">
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7e7e8f] w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search assets..."
                          value={toSearchTerm}
                          onChange={(e) => onToSearchTermChange(e.target.value)}
                          className="w-full bg-[#23232b] rounded-xl px-10 py-2 text-white text-sm focus:outline-none border border-[#39394a]"
                        />
                      </div>
                    </div>

                    {/* Asset List */}
                    <div className="max-h-60 overflow-y-auto">
                      {supportedAssets.length > 0 ? (
                        supportedAssets.map((asset: SupportedAsset) => (
                          <div
                            key={asset.asset_id}
                            className="flex items-center gap-3 p-3 hover:bg-[#23232b] cursor-pointer border-b border-[#39394a] last:border-b-0"
                            onClick={() => {
                              onToAssetSelect(asset);
                              onToAssetToggle();
                            }}
                          >
                            <img
                              src={
                                asset.image_url ||
                                asset.asset_image ||
                                "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                              }
                              alt={asset.name}
                              className="w-6 h-6 rounded-full"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                              }}
                            />
                            <div className="flex-1">
                              <div className="text-white font-medium flex items-center gap-2">
                                {asset.ticker?.toUpperCase() ||
                                  asset.symbol?.toUpperCase() ||
                                  asset.name ||
                                  "Unknown"}
                                <span className="bg-[#1D8751] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                  {asset.network || "Unknown"}
                                </span>
                              </div>
                              <div className="text-[#7e7e8f] text-sm">
                                {asset.name ||
                                  asset.ticker?.toUpperCase() ||
                                  asset.symbol?.toUpperCase() ||
                                  "Unknown Asset"}
                              </div>
                            </div>
                            {toAsset?.asset_id === asset.asset_id && (
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
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="flex items-center rounded-2xl px-4 py-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M12 8v4m0 4h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <span className="text-white text-sm font-medium">
              This is only an estimated price based on current market rates. The final price will be confirmed when we receive the funds.
            </span>
          </div>
        </div>

        {/* Submit Button */}
        {!hideContinueButton && (
          <div className="mt-4">
            <button
              className={`w-full text-white text-base font-medium py-2 rounded-2xl flex items-center justify-center gap-2 transition-colors ${
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
                <span>Submit</span>
              )}
            </button>
          </div>
        )}

        {/* Error Display */}
        {estimateError && (
          <div className="mt-4 bg-red-500/10 border border-red-500 rounded-2xl p-4">
            <h3 className="text-red-500 font-semibold mb-2">Estimate Error</h3>
            <p className="text-red-400 text-sm">{estimateError}</p>
          </div>
        )}
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
