/**
 * VolumeChart.tsx – Transaction Volume Summary
 */

import React from "react";
import { TransactionSummary } from "../types";
import {
  getP2PCombinedVolume,
  parseSummaryNumber,
} from "@/lib/utils/normalizeTransactionSummary";

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

  const summary = transactionSummary as Record<string, any>;
  const byStatus = summary?.total_moneyx_by_status;
  const moneyXVolume =
    (typeof byStatus === "object" && byStatus !== null
      ? parseSummaryNumber(byStatus.approved) +
        parseSummaryNumber(byStatus.completed) +
        parseSummaryNumber(byStatus.agent_approved) +
        parseSummaryNumber(byStatus.reviewer_approved)
      : 0) ||
    parseSummaryNumber(summary?.total_approved_moneyx_volume) ||
    parseSummaryNumber(summary?.total_moneyx_volume) ||
    parseSummaryNumber(summary?.total_completed_moneyx) ||
    0;

  const totalValue =
    parseSummaryNumber(transactionSummary?.total_volume) ||
    parseSummaryNumber(transactionSummary?.total_approved_volume) ||
    parseSummaryNumber(transactionSummary?.total_approved_net);

  const exchangeVolume =
    parseSummaryNumber(transactionSummary.total_approved_exchange_volume) ||
    parseSummaryNumber(transactionSummary.total_approved_exchange_net) ||
    parseSummaryNumber(transactionSummary.total_approved_exchange_combined);

  /** P2P trades + approved deposits + approved withdrawals */
  const p2pVolume = getP2PCombinedVolume(transactionSummary);

  const swapVolume =
    parseSummaryNumber(summary?.total_approved_changenow_swap_volume) ||
    parseSummaryNumber(summary?.total_changenow_swap_volume) ||
    parseSummaryNumber(transactionSummary.total_completed_changenow_swaps);

  const volumeData = [
    {
      title: "Total Value",
      value: formatValue(totalValue),
      currency: "USD" as const,
    },
    {
      title: "Exchange",
      value: formatValue(exchangeVolume),
      currency: "USD" as const,
    },
    {
      title: "Money X",
      value: formatValue(moneyXVolume),
      currency: "USD" as const,
    },
    {
      title: "P2P",
      value: formatValue(p2pVolume),
      currency: "USD" as const,
    },
    {
      title: "Swap",
      value: formatValue(swapVolume),
      currency: "USD" as const,
    },
  ];

  return (
    <div className="w-full">
      <h2 className="dark:text-white text-gray-900 text-sm sm:text-base mb-3 sm:mb-4">
        Transaction Volume
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 overflow-x-auto pb-2 sm:pb-4">
        {volumeData.map((item, idx) => (
          <div
            key={idx}
            className="relative flex flex-col items-center justify-center w-full min-h-[120px] sm:min-h-[140px] bg-white dark:bg-[var(--card-color)] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-[#35353E]"
          >
            <span className="dark:text-gray-400 text-gray-600 text-xs sm:text-sm mb-2 text-center relative z-10">
              {item.title}
            </span>
            <span className="text-[#F79330] text-base sm:text-lg md:text-xl font-bold text-center relative z-10 inline-flex flex-wrap items-baseline justify-center gap-x-1">
              <span className="tabular-nums">{item.value}</span>
              <span className="tracking-wide">{item.currency}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VolumeChart;
