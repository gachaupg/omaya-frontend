import React, { useRef, useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { SupportedAsset, SwapEstimate } from "../types";
import { useTheme } from "@/context/theme";
import { FaExchangeAlt, FaSearch } from "react-icons/fa";
import { useSwapI18n } from "@/lib/useSwapI18n";
import { isNonEmptyInvalidZeroSwapAmount } from "@/lib/utils/swapAmountInput";

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
  meetsMinimumAmount?: boolean;
  minSwapUsd?: number;
  amountError?: string;
}

const strongBorder =
  "border-[1.5px] border-gray-200 dark:border-[#35353E]";
const baseCard =
  `rounded-2xl ${strongBorder} bg-white dark:bg-[#18181D] dark:text-white text-gray-900`;
const labelCopy = "text-[12px] tracking-wide dark:text-[#7d7f95] text-gray-600";

/** User may type "0" while editing — don't show estimate API errors until amount is positive */
const hasPositiveAmount = (s: string) => {
  const n = parseFloat(s);
  return s !== "" && !Number.isNaN(n) && n > 0;
};

const inputBase =
  `rounded-lg sm:rounded-xl md:rounded-2xl bg-transparent dark:bg-transparent ${strongBorder} dark:text-white text-[#35353e] px-2 sm:px-3 md:px-4 py-2 w-full text-sm sm:text-base md:text-lg dark:placeholder:text-[#5f6070] placeholder:text-gray-400 focus:outline-none h-[42px] sm:h-[46px] md:h-[48px]`;

const TransactionInfoStep: React.FC<TransactionInfoStepProps> = (props) => {
  const { isDark } = useTheme();
  const { t } = useSwapI18n();
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
    meetsMinimumAmount = true,
    minSwapUsd = 1,
    amountError,
  } = props;

  /** Don't block the form on stale API errors while amount is 0 / empty */
  const estimateErrorBlocksSubmit =
    typeof estimateError === "string" &&
    estimateError.trim() !== "" &&
    (activeInputField !== "to"
      ? hasPositiveAmount(fromAmount)
      : hasPositiveAmount(toAmount));

  const invalidZeroBlocksSubmit =
    isNonEmptyInvalidZeroSwapAmount(fromAmount) ||
    isNonEmptyInvalidZeroSwapAmount(toAmount);

  const zeroAmountMsg = t(
    "swap.zeroAmountInvalid",
    "0 is not a valid amount input. Enter an amount greater than zero."
  );

  const fromInputError =
    activeInputField === "from" || !activeInputField
      ? isNonEmptyInvalidZeroSwapAmount(fromAmount)
        ? zeroAmountMsg
        : (hasPositiveAmount(fromAmount) &&
            typeof estimateError === "string" &&
            estimateError
            ? estimateError
            : undefined) || amountError
      : undefined;

  const toInputError =
    activeInputField === "to"
      ? isNonEmptyInvalidZeroSwapAmount(toAmount)
        ? zeroAmountMsg
        : (hasPositiveAmount(toAmount) &&
            typeof estimateError === "string" &&
            estimateError
            ? estimateError
            : undefined) || amountError
      : undefined;

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

  // Close dropdowns when scrolling the page (but NOT when scrolling inside the dropdown lists)
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

      // Close any open dropdowns when page is scrolled
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
        position: "absolute",
        top: 200,
        left: "50%",
        transform: "translateX(-50%)",
        width: 280,
      };
    }

    const viewportWidth = window.innerWidth || 0;
    const minMargin = 16;

    // Get the trigger element
    const triggerEl = isFrom ? fromAssetDropdownRef.current : toAssetDropdownRef.current;
    let currentCard: HTMLElement | null = null;

    // Find the parent card containing this trigger
    if (triggerEl) {
      let parent = triggerEl.parentElement;
      while (parent) {
        if (parent.hasAttribute("data-swap-card")) {
          currentCard = parent as HTMLElement;
          break;
        }
        parent = parent.parentElement;
      }
    }

    // Fallback to first card if none found
    if (!currentCard) {
      currentCard = document.querySelector("[data-swap-card='true']") as HTMLElement;
    }

    // Default dropdown style (fallback)
    let dropdownStyle: React.CSSProperties = {
      position: "absolute",
      top: 200,
      left: "50%",
      transform: "translateX(-50%)",
      width: 280,
    };

    if (triggerEl && currentCard) {
      const triggerRect = triggerEl.getBoundingClientRect();

      // Match dropdown width exactly to trigger button width
      let desiredWidth = triggerRect.width;

      let top = triggerRect.bottom + window.scrollY + 4; // 4px below button
      let left = triggerRect.left + window.scrollX;

      // Ensure dropdown doesn't go off-screen
      if (left + desiredWidth > viewportWidth - minMargin) {
        left = viewportWidth - desiredWidth - minMargin + window.scrollX;
      }
      if (left < minMargin) {
        left = minMargin + window.scrollX;
      }

      dropdownStyle = {
        position: "absolute",
        top,
        left,
        width: desiredWidth,
      };
    }

    return dropdownStyle;
  };


  // Memoize filtered assets to prevent recalculation on every render
  const filteredFromAssets = useMemo(() => {
    if (!searchTerm) return supportedAssets;
    const term = searchTerm.toLowerCase();
    return supportedAssets.filter((option) =>
      option.ticker?.toLowerCase().includes(term) ||
      option.name?.toLowerCase().includes(term) ||
      option.network?.toLowerCase().includes(term)
    );
  }, [supportedAssets, searchTerm]);

  const filteredToAssets = useMemo(() => {
    if (!toSearchTerm) return supportedAssets;
    const term = toSearchTerm.toLowerCase();
    return supportedAssets.filter((option) =>
      option.ticker?.toLowerCase().includes(term) ||
      option.name?.toLowerCase().includes(term) ||
      option.network?.toLowerCase().includes(term)
    );
  }, [supportedAssets, toSearchTerm]);

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
    // Use memoized filtered list
    const filtered = isFrom ? filteredFromAssets : filteredToAssets;

    return createPortal(
      (
        <div
          ref={isFrom ? fromAssetDropdownContentRef : toAssetDropdownContentRef}
          data-asset-dropdown="true"
          className="flex flex-col bg-white dark:bg-[#18181D] border border-gray-300 dark:border-accent rounded-2xl shadow-xl z-45 max-h-[70vh] sm:max-h-[60vh]"
          style={dropdownStyle}
        >
          {/* Dropdown Title */}
          <div className="flex items-center justify-between px-2 sm:px-3 md:px-4 py-2 sm:py-3 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t("swap.currencyFrom", "Currency from")}</h3>
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
          <div className="p-1 sm:p-2 border-b border-gray-200 dark:border-gray-600">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7e7e8f] w-4 h-4" />
              <input
                type="text"
                placeholder={t("swap.typeCurrency", "Type a currency")}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full text-gray-900 dark:text-white dark:bg-gray-800 bg-gray-50 rounded-lg px-10 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Asset List */}
          <div className="flex-1 overflow-y-auto p-0.5 sm:p-1">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                {searchValue ? t("swap.noAssetsFound", "No assets found") : t("swap.noAssetsAvailable", "No assets available")}
              </div>
            ) : (
              <>
                {filtered.map((option, idx) => (
                  <div
                    key={`${option.ticker}-${option.network}-${idx}`}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 md:p-4 text-black dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0 transition-colors duration-150"
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
                        "/images/tether.svg"
                      }
                      alt={option.name || "Asset"}
                      className="w-6 h-6 rounded-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src =
                          "/images/tether.svg";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium flex items-center gap-2 ${isDark ? "text-white" : "text-[#111827]"
                        }`}>
                        {(option.ticker || option.symbol || option.name || "Unknown").toUpperCase()}
                        {option.network && (
                          <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-semibold px-2 py-0.5 rounded-full">
                            {option.network}
                          </span>
                        )}
                      </div>
                      <div className={`text-sm truncate ${isDark ? "text-[#788099]" : "text-[#475569]"
                        }`}>
                        {option.name || option.ticker || "Unknown Asset"}
                      </div>
                    </div>
                    {asset?.ticker === option.ticker &&
                      asset?.network === option.network && (
                        <div className="w-2 h-2 bg-[#1D8751] rounded-full flex-shrink-0"></div>
                      )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      ),
      document.body
    );
  };

  const renderAssetSelector = (
    asset: SupportedAsset | null,
    isOpen: boolean,
    toggle: () => void,
    onSelect: (asset: SupportedAsset) => void,
    searchValue: string,
    onSearchChange: (value: string) => void,
    isFrom: boolean
  ) => {
    // Show subtle loading state on asset selector when estimate is loading
    const isLoadingEstimate = estimateLoading && asset !== null;

    return (
      <div className="relative" ref={isFrom ? fromAssetDropdownRef : toAssetDropdownRef}>
        <button
          type="button"
          onClick={toggle}
          className={`flex items-center justify-between w-full rounded-xl sm:rounded-2xl ${strongBorder} bg-transparent dark:bg-transparent px-3 sm:px-4 py-2 text-base sm:text-lg h-[42px] sm:h-[46px] md:h-[48px] transition-opacity ${isLoadingEstimate ? "opacity-80" : ""}`}
        >
          <div className="flex items-center gap-2 sm:gap-3 text-left min-w-0">
            <img
              src={
                asset?.image ||
                asset?.image_url ||
                asset?.asset_image ||
                "/images/tether.svg"
              }
              alt={asset?.name || "asset icon"}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover flex-shrink-0"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src =
                  "/images/tether.svg";
              }}
            />
            <p className="text-base sm:text-lg dark:text-white text-gray-900 font-semibold truncate">
              {asset
                ? asset.ticker?.toUpperCase() ||
                asset.symbol?.toUpperCase() ||
                asset.name
                : t("swap.selectAsset", "Select Asset")}
            </p>
          </div>
          <svg
            className={`w-5 h-5 dark:text-[#7d7f95] text-gray-500 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""
              }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {renderAssetDropdown(asset, isOpen, toggle, onSelect, searchValue, onSearchChange, isFrom)}
      </div>
    );
  };

  const renderAmountInput = (
    label: string,
    value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    asset: SupportedAsset | null,
    isActive: boolean,
    isYouSend: boolean = false,
    error?: string
  ) => {
    const inputClassName = isYouSend
      ? inputBase
      : inputBase.replace('bg-transparent dark:bg-transparent', 'bg-white dark:bg-[#35353E]');

    // Show loader on the OPPOSITE input (the one receiving calculated value)
    // If user is typing in "from" (isYouSend=true, activeInputField="from"), show loader on "to" (isYouSend=false)
    // If user is typing in "to" (isYouSend=false, activeInputField="to"), show loader on "from" (isYouSend=true)
    const showLoader = estimateLoading && (
      (activeInputField === "from" && !isYouSend) ||
      (activeInputField === "to" && isYouSend)
    );

    return (
      <div className="space-y-2">
        {label && <p className={labelCopy}>{label}</p>}
        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={onChange}
            placeholder={showLoader ? t("swap.calculating", "Calculating...") : t("swap.enterAmount", "Enter amount")}
            className={`${inputClassName} ${showLoader ? "opacity-70" : ""}`}
            disabled={showLoader}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#35353e] dark:text-white/80">
            {asset?.ticker?.toUpperCase() ||
              asset?.symbol?.toUpperCase() ||
              "USDT"}
          </span>
          {showLoader && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2">
              <span className="inline-block h-4 w-4 rounded-full border-2 border-[#1D8751] border-t-transparent animate-spin" />
            </span>
          )}
        </div>
        {error && <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm mt-1">{error}</p>}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col dark:text-white text-gray-900">
      <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 md:mb-4 dark:text-[#9ba3c5] text-gray-700">
        {t("swap.transactionInfo", "Transaction Info")}
      </h2>

      {/* You Send */}
      <div className="relative mb-3 sm:mb-3 md:mb-4">
        <div className={`${baseCard} p-4 sm:p-5 md:p-6 lg:p-6 space-y-3 sm:space-y-3 md:space-y-4`} data-swap-card="true">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-3 md:gap-4">
            <div className="space-y-1 sm:flex-1">
              <p className="text-base sm:text-base md:text-lg dark:text-[#7d7f95] text-gray-600 font-semibold">{t("swap.youSend", "You Send")}</p>
            </div>
            <p className={`${labelCopy} md:text-lg ml-0 sm:ml-0 sm:flex-1`}>
              {t("swap.asset", "Asset")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 md:gap-4">
            <div className="flex-1 min-w-0">
              {renderAmountInput(
                "",
                fromAmount,
                onFromAmountChange,
                fromAsset,
                activeInputField === "from",
                true,
                fromInputError
              )}
            </div>
            <div className="flex-1 min-w-0">
              {renderAssetSelector(
                fromAsset,
                isFromAssetOpen,
                onFromAssetToggle,
                onFromAssetSelect,
                searchTerm,
                onSearchTermChange,
                true
              )}
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2 top-full -translate-y-1/2 sm:-translate-y-1/3 z-10">
          <button
            type="button"
            onClick={onSwapAssets}
            className="flex items-center justify-center p-0 bg-transparent border-none shadow-none"
            aria-label="Swap selected assets"
          >
            <span
              className={`w-11 h-11 rounded-full flex items-center justify-center border ${
                isDark
                  ? "bg-[#1F1F26] border-[#35353E] text-[#C8C8D0]"
                  : "bg-white border-gray-300 text-gray-700"
              }`}
            >
              <FaExchangeAlt className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>

      {/* You Receive */}
      <div className="mb-1 sm:mb-2 md:mb-3">
        <div className={`${baseCard} p-3 sm:p-4 md:p-5 lg:p-6 space-y-2 sm:space-y-3 md:space-y-4`} data-swap-card="true">
          <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-3 md:gap-4">
            <div className="space-y-1 sm:flex-1">
              <p className="text-sm sm:text-base md:text-lg dark:text-[#7d7f95] text-gray-600 font-semibold">{t("swap.youReceive", "You Receive")}</p>
            </div>
            <p className={`${labelCopy}  md:text-lg ml-4 sm:ml-0 sm:flex-1`}>
              {t("swap.asset", "Asset")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
            <div className="flex-1 min-w-0">
              {renderAmountInput(
                "",
                toAmount,
                onToAmountChange,
                toAsset,
                activeInputField === "to",
                false,
                toInputError
              )}
            </div>
            <div className="flex-1 min-w-0">
              {renderAssetSelector(
                toAsset,
                isToAssetOpen,
                onToAssetToggle,
                onToAssetSelect,
                toSearchTerm,
                onToSearchTermChange,
                false
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-center gap-2 text-xs sm:text-sm dark:text-[#d5d7e2] text-gray-600 mb-3">
        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-[#E23D3A] rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-[#E23D3A] text-[10px] font-bold">i</span>
        </div>
        <p>
          {t("swap.disclaimer", "This is only an estimated price based on current market rates. The final price will be confirmed when we receive the funds.")}
        </p>
      </div>

      {/* estimateError is shown under the relevant input */}

      {!meetsMinimumAmount && fromAsset && toAsset && fromAmount && parseFloat(fromAmount) > 0 && toAmount && parseFloat(toAmount) > 0 && (
        <p className="text-amber-600 dark:text-amber-400 text-xs sm:text-sm mb-2">
          Minimum swap value is {minSwapUsd} USD/USDT. Smaller amounts can disappear due to fees.
        </p>
      )}
      {!hideContinueButton && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={
            !fromAsset ||
            !toAsset ||
            !fromAmount ||
            parseFloat(fromAmount) <= 0 ||
            invalidZeroBlocksSubmit ||
            !estimate ||
            estimateLoading ||
            swapLoading ||
            estimateErrorBlocksSubmit ||
            !meetsMinimumAmount
          }
          className={`w-full text-white text-sm sm:text-base font-medium py-3 sm:py-2.5 rounded-3xl flex items-center justify-center gap-2 transition-colors min-h-[48px] mb-2 ${!fromAsset ||
            !toAsset ||
            !fromAmount ||
            parseFloat(fromAmount) <= 0 ||
            invalidZeroBlocksSubmit ||
            !estimate ||
            estimateLoading ||
            swapLoading ||
            estimateErrorBlocksSubmit ||
            !meetsMinimumAmount
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-[#1D8751] hover:bg-[#147043]"
            }`}
        >
          {swapLoading ? (
            <>
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              {t("swap.loading", "Loading...")}
            </>
          ) : (
            t("swap.submit", "Submit")
          )}
        </button>
      )}

      {localSwapError && (
        <div className="mt-4 bg-red-500/10 dark:bg-red-500/10 border border-red-500 rounded-2xl p-3 sm:p-4 dark:text-red-200 text-red-700">
          <h3 className="font-semibold mb-1 text-sm sm:text-base">{t("swap.error.genericTitle", "Error")}</h3>
          <p className="text-xs sm:text-sm break-words">{localSwapError}</p>
        </div>
      )}
    </div>
  );
};

export default TransactionInfoStep;

