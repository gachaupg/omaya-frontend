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
      <div className="mt-2 flex items-center gap-2 border border-[#35353E] justify-center rounded-[24px] px-3 py-2">
        <span className="text-[#8C8CA1] bg-[#35353E] text-xs px-3 py-1 rounded-full">
          {estimateLoading
            ? "Calculating rate..."
            : estimate &&
              fromAsset &&
              toAsset &&
              estimate.estimated_amount &&
              fromAmount
            ? `1 ${fromAsset.ticker} = ${(
                estimate.estimated_amount / parseFloat(fromAmount || "1")
              ).toFixed(6)} ${toAsset.ticker}`
            : "Select assets and amount to see rate"}
        </span>
      </div>
    </>
  );
};

export default FeeBreakdown;
