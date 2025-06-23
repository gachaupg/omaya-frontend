import React from "react";
import { Estimate, Asset } from "./types";

interface FeeBreakdownProps {
  estimate: Estimate | null;
  fromAsset: Asset | null;
  toAsset: Asset | null;
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
            ? `Estimated rate: 1 ${fromAsset.ticker} = ${(
                estimate.estimated_amount / parseFloat(fromAmount || "1")
              ).toFixed(6)} ${toAsset.ticker}`
            : "Select assets and amount to see rate"}
        </span>
      </div>

      {/* Fee Information */}
      <div className="bg-[#181820] border border-[#35353E] rounded-lg p-3">
        <div className="text-xs text-[#8C8CA1] mb-2">Fee Breakdown:</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Omaya Fee ({estimate.omaya_fee_percentage || 0}%):</span>
            <span>
              {(estimate.omaya_fee || 0).toFixed(6)} {fromAsset?.ticker}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Gas Fee:</span>
            <span>
              {(estimate.gas_fee || 0).toFixed(6)} {fromAsset?.ticker}
            </span>
          </div>
          <div className="flex justify-between border-t border-[#35353E] pt-1">
            <span className="font-medium">Total Fee:</span>
            <span className="font-medium">
              {(estimate.total_fee || 0).toFixed(6)} {fromAsset?.ticker}
            </span>
          </div>
          <div className="flex justify-between">
            <span>You'll receive:</span>
            <span className="text-[#1D8751] font-medium">
              {(estimate.estimated_amount || 0).toFixed(6)} {toAsset?.ticker}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeeBreakdown;
