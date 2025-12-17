/**
 * VolumeChart.tsx – Transaction Volume Summary
 */

import Card from "../ui/Card";
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
      value: formatValue(transactionSummary?.total_approved_volume || 0),
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
      <h2 className="dark:text-white text-sm sm:text-base mb-3 sm:mb-4">
        Transaction Volume
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto pb-2 sm:pb-4">
        {volumeData.map((item, idx) => (
          <Card
            key={idx}
            className="flex flex-col items-center justify-center w-full h-[150px] sm:h-[175px] border border-[#35353E] bg-card rounded-2xl sm:rounded-[24px] p-4 sm:p-6"
          >
            <span className="dark:text-[#ffff] text-[#0D0D0D] text-xs sm:text-sm md:text-base mb-2 sm:mb-3 text-center">
              {item.title}
            </span>
            <span className="text-[#F79330] text-lg sm:text-xl md:text-2xl font-semibold text-center">
              {item.value}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VolumeChart;
