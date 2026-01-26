import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import AssetDropdown from "./AssetDropdown";
import EstimatedPriceDisplay from "./EstimatedPriceDisplay";
import { SupportedAsset, SwapEstimate } from "../types";
import { useTheme } from "@/context/theme";
import SuccessPage from "./success";
import { FaSearch } from "react-icons/fa";

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
  const fromAssetDropdownRef = useRef<HTMLDivElement>(null);
  const fromAssetDropdownContentRef = useRef<HTMLDivElement | null>(null);
  const toAssetDropdownRef = useRef<HTMLDivElement>(null);
  const toAssetDropdownContentRef = useRef<HTMLDivElement | null>(null);
  const [isComponentMounted, setIsComponentMounted] = useState(false);

  useEffect(() => {
    setIsComponentMounted(true);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is outside from asset dropdown
      if (
        isFromAssetOpen &&
        fromAssetDropdownRef.current &&
        !fromAssetDropdownRef.current.contains(target) &&
        (!fromAssetDropdownContentRef.current ||
          !fromAssetDropdownContentRef.current.contains(target))
      ) {
        onFromAssetToggle();
      }

      // Check if click is outside to asset dropdown
      if (
        isToAssetOpen &&
        toAssetDropdownRef.current &&
        !toAssetDropdownRef.current.contains(target) &&
        (!toAssetDropdownContentRef.current ||
          !toAssetDropdownContentRef.current.contains(target))
      ) {
        onToAssetToggle();
      }
    };

    if (isFromAssetOpen || isToAssetOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFromAssetOpen, isToAssetOpen, onFromAssetToggle, onToAssetToggle]);

  // Close dropdowns when scrolling the page, but NOT when scrolling inside the dropdown lists
  useEffect(() => {
    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement | null;

      // If the scroll originated from inside an asset dropdown, ignore it
      if (
        target &&
        target.closest &&
        target.closest("[data-asset-dropdown='true']")
      ) {
        return;
      }

      if (isFromAssetOpen) {
        onFromAssetToggle();
      }
      if (isToAssetOpen) {
        onToAssetToggle();
      }
    };

    if (isFromAssetOpen || isToAssetOpen) {
      window.addEventListener("scroll", handleScroll, true);
      document.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [isFromAssetOpen, isToAssetOpen, onFromAssetToggle, onToAssetToggle]);

  const updateDropdownPosition = (isFrom: boolean): React.CSSProperties => {
    if (typeof window === "undefined") {
      return {
        position: "fixed",
        top: 200,
        left: "50%",
        transform: "translateX(-50%)",
        width: 280,
      };
    }

    const viewportWidth = window.innerWidth || 0;
    const minMargin = 16;
    const minWidth = 280;
    const maxWidth = 450;

    // Find the card that contains the dropdown trigger
    const dropdownElement = isFrom ? fromAssetDropdownRef.current : toAssetDropdownRef.current;
    let currentCard: Element | null = null;

    if (dropdownElement) {
      let parent = dropdownElement.parentElement;
      while (parent) {
        if (parent.hasAttribute("data-swap-card")) {
          currentCard = parent;
          break;
        }
        parent = parent.parentElement;
      }
    }

    // Fallback to card order if we can't find via DOM traversal
    if (!currentCard) {
      const allCards = document.querySelectorAll("[data-swap-card='true']");
      if (isFrom && allCards.length > 0) {
        currentCard = allCards[0];
      } else if (!isFrom && allCards.length > 1) {
        currentCard = allCards[1];
      } else if (allCards.length > 0) {
        currentCard = allCards[0];
      }
    }

    let dropdownStyle: React.CSSProperties = {
      position: "fixed",
      top: 200,
      left: (viewportWidth - minWidth) / 2,
      width: minWidth,
    };

    if (currentCard && dropdownElement) {
      const cardRect = currentCard.getBoundingClientRect();
      const dropdownRect = dropdownElement.getBoundingClientRect();

      // Calculate reduced width so dropdowns don't cover amount inputs (40% of card width)
      let desiredWidth = Math.min(maxWidth, Math.max(minWidth, cardRect.width * 0.4));

      // Position at the top of the card, allow different offsets per section
      let top = cardRect.top - 15; // default: slightly above card
      if (isFrom) {
        top = cardRect.top + 1; // push "You Send" dropdown down a little more
      } else {
        top = cardRect.top - 15 + 15.7; // push "You Receive" dropdown down
      }

      let left: number;

      // Both "You Send" and "You Receive" - position from right side of card, pushed more right
      // Position it very close to the right edge
      left = cardRect.right - desiredWidth - 3; // 3px from right edge of card

      // Push both dropdowns to the right
      left += 18; // additional right offset for both dropdowns

      // Ensure it doesn't go off the left edge
      if (left < cardRect.left) {
        left = cardRect.left;
      }

      // Ensure it doesn't go off screen on the right
      if (left + desiredWidth > viewportWidth - minMargin) {
        left = viewportWidth - desiredWidth - minMargin;
      }

      // Ensure it doesn't go off the left edge
      if (left < minMargin) {
        left = minMargin;
      }

      // If card is too narrow, center it
      if (cardRect.width < desiredWidth + 16) {
        left = cardRect.left + (cardRect.width - desiredWidth) / 2;
      }

      // Final boundary check to ensure it doesn't go off screen
      if (left + desiredWidth > viewportWidth - minMargin) {
        left = viewportWidth - desiredWidth - minMargin;
      }

      dropdownStyle = {
        position: "fixed",
        top,
        left,
        width: desiredWidth,
      };
    }

    return dropdownStyle;
  };

  const renderAssetDropdown = (
    asset: SupportedAsset | null,
    isOpen: boolean,
    toggle: () => void,
    onSelect: (asset: SupportedAsset) => void,
    searchValue: string,
    onSearchChange: (value: string) => void,
    isFrom: boolean
  ) => {
    if (!isComponentMounted || !isOpen) {
      return null;
    }

    const dropdownStyle = updateDropdownPosition(isFrom);
    const filteredAssets = supportedAssets.filter((asset: SupportedAsset) => {
      if (!searchValue) return true;
      const searchLower = searchValue.toLowerCase();
      const ticker = asset.ticker?.toLowerCase() || "";
      const name = asset.name?.toLowerCase() || "";
      const network = asset.network?.toLowerCase() || "";
      return (
        ticker.includes(searchLower) ||
        name.includes(searchLower) ||
        network.includes(searchLower)
      );
    });

    return createPortal(
      (
        <div
          ref={isFrom ? fromAssetDropdownContentRef : toAssetDropdownContentRef}
          data-asset-dropdown="true"
          className="bg-white dark:bg-[#1D1D23] border border-gray-300 dark:border-[#35353E] rounded-2xl shadow-xl z-[9999] max-h-[70vh] sm:max-h-[60vh] overflow-hidden flex flex-col"
          style={dropdownStyle}
        >
          {/* Dropdown Title */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-600 shrink-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Currency {isFrom ? "from" : "to"}</h3>
            <button
              onClick={toggle}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-600 shrink-0">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7e7e8f] w-4 h-4" />
              <input
                type="text"
                placeholder="Type a currency"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full text-gray-900 dark:text-white dark:bg-gray-800 bg-gray-50 rounded-lg px-10 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Asset List */}
          <div className="overflow-y-auto p-1 flex-1 min-h-0">
            {filteredAssets.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                {searchValue ? "No assets found" : "No assets available"}
              </div>
            ) : (
              filteredAssets.map((assetItem: SupportedAsset, index) => (
                <div
                  key={`${assetItem.ticker}-${assetItem.network}-${index}`}
                  className="flex items-center gap-3 p-3 sm:p-4 text-black dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0 transition-colors duration-150"
                  onClick={() => {
                    onSelect(assetItem);
                    toggle();
                  }}
                >
                  <img
                    src={
                      assetItem.image ||
                      assetItem.image_url ||
                      assetItem.asset_image ||
                      "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                    }
                    alt={assetItem.name || "Asset"}
                    className="w-6 h-6 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                    }}
                  />
                  <div className="flex-1">
                    <div className={`font-normal text-sm flex items-center gap-2 ${isDark ? "text-white" : "text-[#1F2937]"
                      }`}>
                      {(assetItem.ticker || assetItem.symbol || assetItem.name || "Unknown").toUpperCase()}
                      {assetItem.network && (
                        <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-normal px-2 py-0.5 rounded-full">
                          {assetItem.network}
                        </span>
                      )}
                    </div>
                    <div className={`text-sm text-gray-500 dark:text-gray-400`}>
                      {assetItem.name || assetItem.ticker || "Unknown Asset"}
                    </div>
                  </div>
                  {asset?.ticker === assetItem.ticker &&
                    asset?.network === assetItem.network && (
                      <div className="w-2 h-2 bg-[#1D8751] rounded-full"></div>
                    )}
                </div>
              ))
            )}
          </div>
        </div>
      ),
      document.body
    );
  };

  return (
    <div className="w-full flex flex-col mt-0 overflow-x-hidden">
      <div className={`w-full mx-auto ${isDark ? "text-white" : "text-[#1F2937]"}`}>
        {/* Top Section - You Send and You Get in one card */}
        <div className="relative mb-4">
          {/* Top Card Container */}
          <div
            data-swap-card="true"
            className={`relative flex flex-col sm:flex-row gap-4 rounded-2xl p-3 sm:p-4 overflow-hidden ${isDark ? "border border-[#2F2F3A] bg-[#0F0F17]" : "border border-[#E2E8F0] bg-white shadow-sm"
              }`}
          >
            {/* You Send Section */}
            <div className="flex-1 min-w-0">
              <label
                className={`block text-[15px] mb-2 font-semibold flex items-center gap-2 ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                  }`}
              >
                You Send
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
              </label>
              <div className={`text-xs mb-1 ${isDark ? "text-[#788099]" : "text-[#64748B]"
                }`}>
                Amount
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={fromAmount}
                  onChange={onFromAmountChange}
                  placeholder="Enter amount"
                  className={`w-full rounded-2xl px-4 py-2 pr-16 text-lg focus:outline-none border appearance-none bg-transparent ${isDark ? "border-[#35353E] text-white" : "border-[#CBD5F5] text-[#111827]"
                    }`}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className={`text-sm font-normal ${isDark ? "text-white" : "text-[#1F2937]"}`}>
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
            <div className="flex-1 min-w-0">
              <div className={`text-xs mb-1 mt-[30px] ${isDark ? "text-[#788099]" : "text-[#64748B]"
                }`}>
                Asset
              </div>
              <div className="relative" ref={fromAssetDropdownRef}>
                <div
                  className={`w-full rounded-2xl px-4 py-2 text-lg focus:outline-none border flex items-center justify-between cursor-pointer bg-transparent ${isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200"
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
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={`font-normal text-sm truncate ${isDark ? "text-white" : "text-[#1F2937]"}`}>
                            {(() => {
                              // Prioritize ticker/symbol, but show name if ticker/symbol is not available
                              const ticker = fromAsset.ticker?.toUpperCase() || fromAsset.symbol?.toUpperCase();
                              return ticker || fromAsset.name || "Unknown";
                            })()}
                          </span>
                          <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-normal px-2 py-0.5 rounded-full flex-shrink-0">
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
                    className={`w-5 h-5 text-[#7e7e8f] transition-transform ${isFromAssetOpen ? "rotate-180" : ""
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
                {renderAssetDropdown(fromAsset, isFromAssetOpen, onFromAssetToggle, onFromAssetSelect, searchTerm, onSearchTermChange, true)}
              </div>
            </div>
          </div>

          {/* Swap Circle - positioned to touch both borders equally */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full -translate-y-1/3 z-10">
            <button
              className=" flex items-center justify-center transition-all duration-200  hover:scale-105"
              onClick={onSwapAssets}
            >
              {/* Light mode image */}
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1756579504/Frame_36261_1_d9cnq1.png"
                alt="swap icon"
                className="w-10 h-10 dark:hidden"
              />
              {/* Dark mode image */}
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1755500509/Frame_36261_ledmyw.png"
                alt="swap icon"
                className="w-10 h-10 hidden dark:block"
              />
            </button>
          </div>
        </div>

        {/* Bottom Section - You Receive and Asset in one card */}
        <div className="relative mb-3">
          <div
            data-swap-card="true"
            className={`relative flex flex-col sm:flex-row gap-4 rounded-2xl p-3 sm:p-4 overflow-hidden ${isDark ? "border border-[#2F2F3A] bg-[#0F0F17]" : "border border-[#E2E8F0] bg-white shadow-sm"
              }`}
          >
            {/* You Receive Section */}
            <div className="flex-1 min-w-0">
              <label
                className={`block text-[15px] mb-2 font-semibold flex items-center gap-2 ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                  }`}
              >
                You Receive
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
              </label>
              <div className={`text-xs mb-1 ${isDark ? "text-[#788099]" : "text-[#64748B]"
                }`}>
                Amount
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={toAmount}
                  onChange={onToAmountChange}
                  placeholder="Enter amount"
                  className={`w-full rounded-2xl px-4 py-2 pr-16 text-lg focus:outline-none border appearance-none bg-transparent ${activeInputField === "to"
                      ? "border-[#1D8751]"
                      : isDark
                        ? "border-[#35353E] text-white"
                        : "border-[#CBD5F5] text-[#111827]"
                    }`}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className={`text-sm font-normal ${isDark ? "text-white" : "text-[#1F2937]"}`}>
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
            <div className="flex-1 min-w-0">
              <div className={`text-xs mb-1 mt-[30px] ${isDark ? "text-[#788099]" : "text-[#64748B]"
                }`}>
                Asset
              </div>
              <div className="relative" ref={toAssetDropdownRef}>
                <div
                  className={`w-full rounded-2xl px-4 py-2 text-lg focus:outline-none border flex items-center justify-between cursor-pointer bg-transparent ${isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200"
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
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={`font-normal text-sm truncate ${isDark ? "text-white" : "text-[#1F2937]"}`}>
                            {(() => {
                              // Prioritize ticker/symbol, but show name if ticker/symbol is not available
                              const ticker = toAsset.ticker?.toUpperCase() || toAsset.symbol?.toUpperCase();
                              return ticker || toAsset.name || "Unknown";
                            })()}
                          </span>
                          <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-normal px-2 py-0.5 rounded-full flex-shrink-0">
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
                    className={`w-5 h-5 text-[#7e7e8f] transition-transform ${isToAssetOpen ? "rotate-180" : ""
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
                {renderAssetDropdown(toAsset, isToAssetOpen, onToAssetToggle, onToAssetSelect, toSearchTerm, onToSearchTermChange, false)}
              </div>
            </div>
          </div>
        </div>

        {/* Warning Message */}
        {!hideContinueButton && (
          <div className="mt-4 mb-3 flex items-center gap-3 p-3 rounded-2xl bg-transparent">
            <img
              src="https://res.cloudinary.com/pitz/image/upload/v1765784047/alert-circle_1_ujybne.png"
              alt="Warning"
              className="w-5 h-5 flex-shrink-0"
            />
            <p className={`text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
              This is only an estimated price based on current market rates. The final price will be confirmed when we receive the funds.
            </p>
          </div>
        )}

        {/* Submit Button */}
        {!hideContinueButton && (
          <div className="mt-4">
            <button
              className={`w-full text-base font-medium py-1.5 rounded-full flex items-center justify-center gap-2 transition-colors text-white ${!fromAsset ||
                  !toAsset ||
                  !fromAmount ||
                  parseFloat(fromAmount) <= 0 ||
                  !estimate ||
                  estimateLoading ||
                  swapLoading
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#1D8751] hover:bg-[#1D8751]/80"
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
                <span className="flex items-center justify-center gap-2">
                  <span className="text-base font-medium text-white">Swap</span>
                </span>
              )}
            </button>
          </div>
        )}

        {/* Error Display */}
        {localSwapError && (
          <div className="mt-4 bg-red-500/10 border border-red-500 rounded-2xl p-3 sm:p-4">
            <h3 className="text-red-500 font-semibold mb-2">Error</h3>
            <p className="text-red-400 text-sm">{localSwapError}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionInfoStep;
