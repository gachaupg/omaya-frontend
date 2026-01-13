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
    <div className="dark:bg-[#23232b] bg-gray-50 dark:border-[#35353E] border-gray-200 border rounded-2xl p-2 ">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          {/* Network Fee */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 dark:bg-white bg-gray-400 rounded-full"></div>
            <div className="bg-orange-500/20 border h-8 border-orange-500/30 rounded-full px-2 py-1">
              <span className="text-orange-400 text-sm">
                Network fee: {networkFee > 0 ? `${networkFee} USD` : "00"}
              </span>
            </div>
          </div>

          {/* Estimated Rate */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 dark:bg-white bg-gray-400 rounded-full"></div>
            <div className="bg-green-500/20 border h-8 border-green-500/30 rounded-full px-2 py-1">
              <span className="text-green-400 text-sm">
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
          className="dark:bg-[#35353E] bg-gray-200 dark:hover:bg-[#40404A] hover:bg-gray-300 rounded-lg p-2 transition-colors"
          onClick={onSwapAssets}
          disabled={!fromAsset || !toAsset}
        >
          <img
            src="https://res.cloudinary.com/pitz/image/upload/v1752243765/Vector_2_xauedx.png"
            alt="Exchange"
            className="w-5 h-5"
          />
        </button>
      </div>
    </div>
  );
};

export default EstimatedPriceDisplay;
