import React from "react";
import { SwapEstimate, SupportedAsset } from "../types";

interface FeeBreakdownProps {
  estimate: SwapEstimate | null;
  fromAsset: SupportedAsset | null;
  toAsset: SupportedAsset | null;
  fromAmount: string;
  estimateLoading: boolean;
}

const FeeBreakdown: React.FC<FeeBreakdownProps> = ({
  estimate,
  fromAsset,
  toAsset,
  fromAmount,
  estimateLoading,
}) => {
  if (!estimate) return null;

  return (
    <>
      {/* Estimated Rate */}
      <div className="mt-2 flex items-center gap-2 dark:border-[#35353E] border-gray-300 border justify-center rounded-[24px] px-2 sm:px-3 py-1.5 sm:py-2">
        <span className="dark:text-[#8C8CA1] text-gray-600 dark:bg-[#35353E] bg-gray-200 text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full break-words text-center">
          {estimateLoading
            ? "Calculating rate..."
            : estimate &&
                fromAsset &&
                toAsset &&
                (estimate.toAmount || estimate.estimated_amount) &&
                fromAmount
              ? `1 ${fromAsset.ticker} = ${(
                  ((estimate.toAmount || estimate.estimated_amount) || 0) / parseFloat(fromAmount || "1")
                ).toFixed(6)} ${toAsset.ticker}`
              : "Select assets and amount to see rate"}
        </span>
      </div>
    </>
  );
};

export default FeeBreakdown;
