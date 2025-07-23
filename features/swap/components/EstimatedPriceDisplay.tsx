import React from "react";
import { SwapEstimate, SupportedAsset } from "../types";

interface EstimatedPriceDisplayProps {
  estimate: SwapEstimate | null;
  fromAsset: SupportedAsset | null;
  toAsset: SupportedAsset | null;
  fromAmount: string;
  estimateLoading: boolean;
}

const EstimatedPriceDisplay: React.FC<EstimatedPriceDisplayProps> = ({
  estimate,
  fromAsset,
  toAsset,
  fromAmount,
  estimateLoading,
}) => {
  if (!estimate || !fromAsset || !toAsset || !fromAmount) return null;

  // Calculate the rate
  const rate = estimate.estimated_amount / parseFloat(fromAmount || "1");

  // Use gas_fee from estimate for network fee
  const networkFee = estimate.gas_fee || 1; // Default to 1 USD if not available

  return (
    <div className="dark:bg-[#23232b] bg-[#F5F5F5] border dark:border-[#35353E] border-gray-300 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          {/* Network Fee */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 dark:bg-white bg-gray-600 rounded-full"></div>
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-full px-3 py-1">
              <span className="text-orange-400 text-sm">
                Network fee: {networkFee} USD
              </span>
            </div>
          </div>

          {/* Estimated Rate */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 dark:bg-white bg-gray-600 rounded-full"></div>
            <div className="bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1">
              <span className="text-green-400 text-sm">
                Estimated rate: 1 {fromAsset.ticker} ~ {rate.toFixed(6)}{" "}
                {toAsset.ticker}
              </span>
            </div>
          </div>
        </div>

        {/* Swap Icon Button */}
        <button className="dark:bg-[#35353E] bg-gray-300 hover:dark:bg-[#40404A] hover:bg-gray-400 rounded-lg p-2 transition-colors">
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
