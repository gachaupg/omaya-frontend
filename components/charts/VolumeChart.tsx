/**
 * VolumeChart.tsx – Transaction Volume Summary
 */

import React from "react";
import { TransactionSummary } from "../types";

interface VolumeChartProps {
  transactionSummary: TransactionSummary;
}

const VolumeChart: React.FC<VolumeChartProps> = ({ transactionSummary }) => {
  const formatValue = (value: number) => {
    // Format with commas and 2 decimal places for actual value display
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  const volumeData = [
    {
      title: "Total Value",
      value: !isNaN(Number(transactionSummary?.total_volume))
        ? formatValue(Number(transactionSummary?.total_volume) || 0)
        : transactionSummary?.total_volume || "0.00",
    },
    {
      title: "Exchange",
      value: formatValue(transactionSummary.total_approved_exchange_volume || transactionSummary.total_approved_exchange_combined || 0),
    },
    {
      title: "P2P",
      value: formatValue(transactionSummary.total_approved_p2p_volume || transactionSummary.total_approved_p2p_combined || 0),
    },
    {
      title: "Swap",
      value: formatValue(transactionSummary.total_completed_changenow_swaps || 0),
    },
  ];

  return (
    <div className="w-full">
      <h2 className="dark:text-white text-gray-900 text-sm sm:text-base mb-3 sm:mb-4">
        Transaction Volume
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto pb-2 sm:pb-4">
        {volumeData.map((item, idx) => (
          <div
            key={idx}
            className="relative flex flex-col items-center justify-center w-full min-h-[120px] sm:min-h-[140px] bg-white dark:bg-[var(--card-color)] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-[#35353E]"
          >
            <span className="dark:text-gray-400 text-gray-600 text-xs sm:text-sm mb-2 text-center relative z-10">
              {item.title}
            </span>
            <span className="text-[#F79330] text-base sm:text-lg md:text-xl font-bold text-center relative z-10">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VolumeChart;
