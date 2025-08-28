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
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value?.toFixed(2);
  };

  const volumeData = [
    {
      title: "Total Approved",
      value: formatValue(transactionSummary?.total_approved_all),
    },
    {
      title: "Exchange Volume",
      value: formatValue(transactionSummary.total_approved_exchange_combined),
    },
    {
      title: "P2P Volume",
      value: formatValue(transactionSummary.total_approved_p2p_combined),
    },
    {
      title: "Pending Exchange",
      value: formatValue(
        transactionSummary.total_pending_exchange_deposits +
          transactionSummary.total_pending_exchange_withdrawals
      ),
    },
    {
      title: "Pending P2P",
      value: formatValue(
        transactionSummary.total_pending_p2p_deposits +
          transactionSummary.total_pending_p2p_withdrawals
      ),
    },
    {
      title: "Swap ",
      value: '00',
    },
  ];

  return (
    <div className="w-full">
      <h2 className="dark:text-white text-[16px] mb-4">Transaction Volume</h2>
      <div className="flex flex-col sm:flex-row gap-4 overflow-x-auto pb-4">
        {volumeData.map((item, idx) => (
          <Card
            key={idx}
            className="flex flex-col items-center justify-center w-full sm:w-[225px] h-[175px] border border-[#E8EFF5] dark:border-[#35353E] dark:bg-[#1D1D23] bg-white rounded-[24px]"
          >
            <span className="dark:text-[#ffff] text-[#0D0D0D] text-[16px] sm:text-[19px] mb-2 text-center">
              {item.title}
            </span>
            <span className="text-[#F79330] text-[20px] sm:text-[26px] font-semibold text-center">
              {item.value}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VolumeChart;
