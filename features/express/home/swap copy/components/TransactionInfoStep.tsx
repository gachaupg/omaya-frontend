import React, { useMemo, useCallback } from "react";
import EstimatedPriceDisplay from "./EstimatedPriceDisplay";
import { SupportedAsset, SwapEstimate } from "../types";
import { useTheme } from "@/context/theme";
import SuccessPage from "./success";
import CustomSelect from "@/components/ui/HomeCommonSelect";
import {
  isNonEmptyInvalidZeroSwapAmount,
  isPositiveSwapAmount,
} from "@/lib/utils/swapAmountInput";
import {
  isSameSwapAssetPair,
  SWAP_SAME_COIN_MESSAGE,
} from "@/lib/utils/swapAssetValidation";
import { useSwapI18n } from "@/lib/useSwapI18n";
import { resolveSwapAssetIconSrc } from "@/features/swap/utils/swapAssetIcon";
import { sortAssetsForDisplay } from "@/lib/utils/assetSearch";
import {
  formatAssetSubtitle,
  getAssetPrimaryLabel,
} from "@/lib/utils/networkDisplay";
import {
  PAYMENT_LOGO_BASE_CLASS,
  PAYMENT_LOGO_SIZE,
} from "@/features/express/utils/imageHelpers";
import {
  swapAmountFieldClass,
  swapAmountTickerClass,
} from "@/features/swap/components/swapFieldStyles";

const ZERO_AMOUNT_INVALID_MSG =
  "0 is not a valid amount input. Enter an amount greater than zero.";

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
  sameCoinPair?: boolean;
}

/** Allow typing "0" without showing stale estimate errors */
const hasPositiveAmount = (s: string) => isPositiveSwapAmount(s);

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
  isFromAssetOpen: _isFromAssetOpen,
  isToAssetOpen: _isToAssetOpen,
  searchTerm: _searchTerm,
  toSearchTerm: _toSearchTerm,
  onFromAssetSelect,
  onToAssetSelect,
  onFromAmountChange,
  onToAmountChange,
  onFromAssetToggle: _onFromAssetToggle,
  onToAssetToggle: _onToAssetToggle,
  onSearchTermChange: _onSearchTermChange,
  onToSearchTermChange: _onToSearchTermChange,
  onSubmit,
  swapLoading,
  hideContinueButton,
  onSwapAssets,
  activeInputField,
  sameCoinPair = false,
}) => {
  const sameCoinBlocksSubmit =
    sameCoinPair || isSameSwapAssetPair(fromAsset, toAsset);
  const { isDark } = useTheme();
  const { t } = useSwapI18n();

  const estimateErrorBlocksSubmit =
    typeof estimateError === "string" &&
    estimateError.trim() !== "" &&
    (activeInputField !== "to"
      ? hasPositiveAmount(fromAmount)
      : hasPositiveAmount(toAmount));

  const invalidZeroFrom = isNonEmptyInvalidZeroSwapAmount(fromAmount);
  const invalidZeroTo = isNonEmptyInvalidZeroSwapAmount(toAmount);
  const invalidZeroBlocksSubmit = invalidZeroFrom || invalidZeroTo;

  const assetSelectTriggerClass = `!px-4 !py-[8px] !min-h-0 text-sm font-medium border rounded-2xl bg-transparent !h-[44px] ${
    isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200"
  }`;

  const getSwapAssetKey = useCallback((asset: SupportedAsset | null) => {
    if (!asset) return "";
    const ticker = (asset.ticker || asset.symbol || "").toLowerCase();
    const network = (asset.network || "").toLowerCase();
    return network ? `${ticker}::${network}` : ticker;
  }, []);

  const buildAssetOptions = useCallback(
    (excludeAsset: SupportedAsset | null) => {
      let list = supportedAssets;
      if (excludeAsset) {
        list = list.filter((option) => !isSameSwapAssetPair(option, excludeAsset));
      }
      return sortAssetsForDisplay(list, "").map((asset) => {
        const subtitle = formatAssetSubtitle(asset);
        return {
          value: getSwapAssetKey(asset),
          label: getAssetPrimaryLabel(asset),
          subtitle: subtitle || undefined,
          logo: resolveSwapAssetIconSrc(asset),
        };
      });
    },
    [supportedAssets, getSwapAssetKey]
  );

  const fromAssetOptions = useMemo(
    () => buildAssetOptions(toAsset),
    [buildAssetOptions, toAsset]
  );

  const toAssetOptions = useMemo(
    () => buildAssetOptions(fromAsset),
    [buildAssetOptions, fromAsset]
  );

  const handleFromAssetChange = useCallback(
    (value: string) => {
      const selected = supportedAssets.find(
        (asset) => getSwapAssetKey(asset) === value
      );
      if (selected) onFromAssetSelect(selected);
    },
    [supportedAssets, getSwapAssetKey, onFromAssetSelect]
  );

  const handleToAssetChange = useCallback(
    (value: string) => {
      const selected = supportedAssets.find(
        (asset) => getSwapAssetKey(asset) === value
      );
      if (selected) onToAssetSelect(selected);
    },
    [supportedAssets, getSwapAssetKey, onToAssetSelect]
  );

  return (
    <div className="w-full flex flex-col mt-0 overflow-x-hidden">
      <div className={`w-full mx-auto ${isDark ? "text-white" : "text-[#1F2937]"}`}>
        {/* Top Section - You Send and You Get in one card */}
        <div className="relative mb-4">
          {/* Top Card Container */}
          <div
            data-swap-card="true"
            data-asset-card="true"
            data-select-card="true"
            className={`relative flex flex-col sm:flex-row gap-4 rounded-2xl p-3 sm:p-4 overflow-visible ${isDark ? "border border-[#2F2F3A] bg-[#0F0F17]" : "border border-[#E2E8F0] bg-white shadow-sm"
              }`}
          >
            {/* You Send Section */}
            <div className="flex-1 min-w-0">
              <label
                className={`block text-[15px] mb-2 font-semibold flex items-center gap-2 ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                  }`}
              >
                {t("swap.youSend", "You Send")}
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
              </label>
              <div className={`text-xs mb-1 ${isDark ? "text-[#788099]" : "text-[#64748B]"
                }`}>
                {t("swap.amount", "Amount")}
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={fromAmount}
                  onChange={onFromAmountChange}
                  placeholder={t("swap.enterAmount", "Enter amount")}
                  className={swapAmountFieldClass(isDark)}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className={swapAmountTickerClass(isDark)}>
                    {fromAsset
                      ? fromAsset.ticker?.toUpperCase() ||
                      fromAsset.symbol?.toUpperCase() ||
                      "USDT"
                      : "USDT"}
                  </span>
                </div>
              </div>
              {invalidZeroFrom && (
                <p className={`mt-2 text-sm ${isDark ? "text-red-300" : "text-red-600"}`}>
                  {ZERO_AMOUNT_INVALID_MSG}
                </p>
              )}
              {/* Backend estimate error under input */}
              {!invalidZeroFrom &&
                estimateError &&
                typeof estimateError === "string" &&
                hasPositiveAmount(fromAmount) &&
                (activeInputField === "from" || !activeInputField) && (
                <p className={`mt-2 text-sm ${isDark ? "text-red-300" : "text-red-600"}`}>
                  {estimateError}
                </p>
              )}
            </div>

            {/* You Get Section */}
            <div className="flex-1 min-w-0">
              <div className={`text-xs mb-1 mt-0 sm:mt-[30px] ${isDark ? "text-[#788099]" : "text-[#64748B]"
                }`}>
                {t("swap.asset", "Asset")}
              </div>
              <div className="relative w-full">
                <CustomSelect
                  options={fromAssetOptions}
                  value={getSwapAssetKey(fromAsset)}
                  logoSize={PAYMENT_LOGO_SIZE}
                  logoClassName={`${PAYMENT_LOGO_BASE_CLASS} rounded-full`}
                  sizeMode="card"
                  dropdownMatchTriggerWidth={true}
                  dropdownMinWidth={460}
                  dropdownMaxWidth={460}
                  className="w-full"
                  placeholderClassName="text-white dark:text-white"
                  triggerClassName={assetSelectTriggerClass}
                  onChange={handleFromAssetChange}
                  placeholder={
                    supportedAssets.length === 0
                      ? t("swap.loading", "Loading...")
                      : t("swap.selectAsset", "Select Asset")
                  }
                  disabled={supportedAssets.length === 0}
                  loading={supportedAssets.length === 0}
                  loadingText={t("swap.loading", "Loading...")}
                  emptyText={t("swap.noAssets", "No assets available")}
                  searchable={true}
                  dropdownTitle="Currency from"
                  dropdownOffsetY={-68}
                  dropdownOffsetX={0}
                  largeDropdownItems={true}
                />
              </div>
            </div>
          </div>

          {/* Swap Circle - same assets as deposit form (local /public/assets) */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full -translate-y-1/3 z-10">
            <button
              type="button"
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105"
              onClick={onSwapAssets}
            >
              <img
                src="/assets/Frame_36261_1_d9cnq1.png"
                alt="swap icon"
                className="w-10 h-10 dark:hidden"
              />
              <img
                src="/assets/Frame_36261_ledmyw.png"
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
            data-asset-card="true"
            className={`relative flex flex-col sm:flex-row gap-4 rounded-2xl p-3 sm:p-4 overflow-visible ${isDark ? "border border-[#2F2F3A] bg-[#0F0F17]" : "border border-[#E2E8F0] bg-white shadow-sm"
              }`}
          >
            {/* You Receive Section */}
            <div className="flex-1 min-w-0">
              <label
                className={`block text-[15px] mb-2 font-semibold flex items-center gap-2 ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                  }`}
              >
                {t("swap.youReceive", "You Receive")}
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
              </label>
              <div className={`text-xs mb-1 ${isDark ? "text-[#788099]" : "text-[#64748B]"
                }`}>
                {t("swap.amount", "Amount")}
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={toAmount}
                  onChange={onToAmountChange}
                  placeholder={t("swap.enterAmount", "Enter amount")}
                  className={swapAmountFieldClass(isDark, {
                    active: activeInputField === "to",
                  })}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className={swapAmountTickerClass(isDark)}>
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
              {invalidZeroTo && (
                <p className={`mt-2 text-sm ${isDark ? "text-red-300" : "text-red-600"}`}>
                  {ZERO_AMOUNT_INVALID_MSG}
                </p>
              )}
              {/* Backend estimate error under input */}
              {!invalidZeroTo &&
                estimateError &&
                typeof estimateError === "string" &&
                hasPositiveAmount(toAmount) &&
                activeInputField === "to" && (
                <p className={`mt-2 text-sm ${isDark ? "text-red-300" : "text-red-600"}`}>
                  {estimateError}
                </p>
              )}
            </div>

            {/* Asset Section */}
            <div className="flex-1 min-w-0">
              <div className={`text-xs mb-1 mt-0 sm:mt-[30px] ${isDark ? "text-[#788099]" : "text-[#64748B]"
                }`}>
                Asset
              </div>
              <div className="relative w-full">
                <CustomSelect
                  options={toAssetOptions}
                  value={getSwapAssetKey(toAsset)}
                  logoSize={PAYMENT_LOGO_SIZE}
                  logoClassName={`${PAYMENT_LOGO_BASE_CLASS} rounded-full`}
                  sizeMode="card"
                  dropdownMatchTriggerWidth={true}
                  dropdownMinWidth={460}
                  dropdownMaxWidth={460}
                  className="w-full"
                  placeholderClassName="text-white dark:text-white"
                  triggerClassName={assetSelectTriggerClass}
                  onChange={handleToAssetChange}
                  placeholder={
                    supportedAssets.length === 0
                      ? t("swap.loading", "Loading...")
                      : t("swap.selectAsset", "Select Asset")
                  }
                  disabled={supportedAssets.length === 0}
                  loading={supportedAssets.length === 0}
                  loadingText={t("swap.loading", "Loading...")}
                  emptyText={t("swap.noAssets", "No assets available")}
                  searchable={true}
                  dropdownTitle="Currency to"
                  dropdownOffsetY={-68}
                  dropdownOffsetX={0}
                  largeDropdownItems={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Warning Message */}
        {!hideContinueButton && (
          <div className="mt-4 mb-3 flex items-center gap-3 p-3 rounded-2xl bg-transparent">
            <img
              src="/assets/alert-circle_1_ujybne.png"
              alt="Warning"
              className="w-5 h-5 flex-shrink-0 mt-1"
            />
            <p className={`text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
              This is only an estimated price based on current market rates. The final price will be confirmed when we receive the funds.
            </p>
          </div>
        )}

        {/* estimateError is shown under the relevant input */}

        {sameCoinBlocksSubmit && (
          <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm mb-2">
            {SWAP_SAME_COIN_MESSAGE}
          </p>
        )}

        {/* Submit Button */}
        {!hideContinueButton && (
          <div className="mt-4">
            <button
              className={`w-full text-base font-medium py-1.5 rounded-full flex items-center justify-center gap-2 transition-colors text-white ${!fromAsset ||
                  !toAsset ||
                  !fromAmount ||
                  !isPositiveSwapAmount(fromAmount) ||
                  invalidZeroBlocksSubmit ||
                  !estimate ||
                  estimateLoading ||
                  swapLoading ||
                  estimateErrorBlocksSubmit ||
                  sameCoinBlocksSubmit
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#1D8751] hover:bg-[#1D8751]/80"
                }`}
              onClick={onSubmit}
              disabled={
                !fromAsset ||
                !toAsset ||
                !fromAmount ||
                !isPositiveSwapAmount(fromAmount) ||
                invalidZeroBlocksSubmit ||
                !estimate ||
                estimateLoading ||
                swapLoading ||
                estimateErrorBlocksSubmit ||
                sameCoinBlocksSubmit
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
