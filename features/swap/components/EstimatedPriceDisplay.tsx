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
  // Prioritize user_amount (which includes fees) over estimated_amount
  const rate =
    estimate && fromAmount && parseFloat(fromAmount) > 0
      ? ((estimate.user_amount || estimate.toAmount || estimate.estimated_amount) || 0) / parseFloat(fromAmount)
      : 0;

  // Use gas_fee from estimate for network fee, show "00" if not available
  const networkFee = estimate?.gas_fee || 0;

  return (
    <div className="dark:bg-[var(--card-color)] bg-gray-50 dark:border-[#35353E] border-gray-200 border rounded-xl sm:rounded-2xl p-2.5 sm:p-3 md:p-4">
      <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
        <div className="flex flex-col gap-1.5 sm:gap-2 md:gap-2.5 flex-1 min-w-0">
          {/* Network Fee */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 dark:bg-white bg-gray-400 rounded-full flex-shrink-0"></div>
            <div className="bg-orange-500/20 border h-7 sm:h-8 md:h-9 border-orange-500/30 rounded-full px-2 sm:px-3 md:px-4 py-0.5 sm:py-1 min-w-0">
              <span className="text-orange-400 text-xs sm:text-sm md:text-base whitespace-nowrap">
                Network fee: {networkFee > 0 ? `${networkFee} USD` : "00"}
              </span>
            </div>
          </div>

          {/* Estimated Rate */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 dark:bg-white bg-gray-400 rounded-full flex-shrink-0"></div>
            <div className="bg-green-500/20 border h-7 sm:h-8 md:h-9 border-green-500/30 rounded-full px-2 sm:px-3 md:px-4 py-0.5 sm:py-1 min-w-0">
              <span className="text-green-400 text-xs sm:text-sm md:text-base break-words">
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
          className="dark:bg-[#35353E] bg-gray-200 dark:hover:bg-[#40404A] hover:bg-gray-300 rounded-lg p-1.5 sm:p-2 md:p-2.5 transition-colors flex-shrink-0"
          onClick={onSwapAssets}
          disabled={!fromAsset || !toAsset}
        >
          <img
            src="https://res.cloudinary.com/pitz/image/upload/v1752243765/Vector_2_xauedx.png"
            alt="Exchange"
            className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"
          />
        </button>
      </div>
    </div>
  );
};

export default EstimatedPriceDisplay;
