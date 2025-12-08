import React from "react";
import { SwapEstimate, SupportedAsset } from "../types";

interface EstimatedPriceDisplayProps {
  estimate: SwapEstimate | null;
  fromAsset: SupportedAsset | null;
  toAsset: SupportedAsset | null;
  fromAmount: string;
  estimateLoading: boolean;
  onSwapAssets?: () => void; // New prop for handling asset swap
}

const EstimatedPriceDisplay: React.FC<EstimatedPriceDisplayProps> = ({
  estimate,
  fromAsset,
  toAsset,
  fromAmount,
  estimateLoading,
  onSwapAssets,
}) => {
  // Calculate the rate if estimate is available
  const rate =
    estimate && fromAmount && parseFloat(fromAmount) > 0
      ? ((estimate.toAmount || estimate.estimated_amount) || 0) / parseFloat(fromAmount)
      : 0;

  // Use gas_fee from estimate for network fee, show "00" if not available
  const networkFee = estimate?.gas_fee || 0;

  return (
    <div className="dark:bg-[var(--card-color)] bg-gray-50 dark:border-[#35353E] border-gray-200 border rounded-2xl p-2 sm:p-3">
      <div className="flex items-center justify-between gap-2 sm:gap-0">
        <div className="flex flex-col gap-1.5 sm:gap-2 flex-1 min-w-0">
          {/* Network Fee */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 dark:bg-white bg-gray-400 rounded-full flex-shrink-0"></div>
            <div className="bg-orange-500/20 border h-7 sm:h-8 border-orange-500/30 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 min-w-0">
              <span className="text-orange-400 text-xs sm:text-sm whitespace-nowrap">
                Network fee: {networkFee > 0 ? `${networkFee} USD` : "00"}
              </span>
            </div>
          </div>

          {/* Estimated Rate */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 dark:bg-white bg-gray-400 rounded-full flex-shrink-0"></div>
            <div className="bg-green-500/20 border h-7 sm:h-8 border-green-500/30 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 min-w-0">
              <span className="text-green-400 text-xs sm:text-sm break-words">
                Estimated rate:{" "}
                {fromAsset && toAsset
                  ? `1 ${fromAsset.ticker} ~ ${rate > 0 ? rate.toFixed(6) : "00"} ${toAsset.ticker}`
                  : "00"}
              </span>
            </div>
          </div>
        </div>

        {/* Swap Icon Button */}
        <button
          className="dark:bg-[#35353E] bg-gray-200 dark:hover:bg-[#40404A] hover:bg-gray-300 rounded-lg p-1.5 sm:p-2 transition-colors flex-shrink-0"
          onClick={onSwapAssets}
          disabled={!fromAsset || !toAsset}
        >
          <img
            src="https://res.cloudinary.com/pitz/image/upload/v1752243765/Vector_2_xauedx.png"
            alt="Exchange"
            className="w-4 h-4 sm:w-5 sm:h-5"
          />
        </button>
      </div>
    </div>
  );
};

export default EstimatedPriceDisplay;
