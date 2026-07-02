import React from "react";
import {
  formatSummaryPercent,
  getP2PCompletionRateDisplay,
  parseSummaryNumber,
} from "@/lib/utils/normalizeTransactionSummary";

const Stats = ({ summary }: { summary?: any }) => {
  const safe =
    summary && typeof summary === "object" && !Array.isArray(summary)
      ? summary
      : {};

  const stats = [
    { value: parseSummaryNumber(safe.total_trades) || 0, label: "Trades" },
    {
      value: getP2PCompletionRateDisplay(safe),
      label: "Completion rate",
    },
    {
      value: <span>{safe.avg_release_time ?? "0 Min"}</span>,
      label: "Avg. release time",
    },
    {
      value: <span>{safe.avg_payment_time ?? "0 Min"}</span>,
      label: "Avg. pay time",
    },
    {
      value: formatSummaryPercent(safe.rating, "0%"),
      label: "Rating",
    },
    {
      value: (
        <span>{(parseSummaryNumber(safe.escrow) || 0).toLocaleString()}</span>
      ),
      label: "In Escrow / Locked",
    },
  ];

  return (
    <div className="w-full min-h-[90px] rounded-[24px] border-2 bg-white dark:bg-[var(--card-color)] border-gray-200 dark:border-[#35353E] p-3 sm:p-5 box-border">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5 w-full">
        {stats.map((stat, idx) => (
          <div key={idx} className="text-center w-full">
            <div className="text-gray-900 dark:text-white text-base sm:text-lg font-semibold flex items-center justify-center gap-1 mb-0.5">
              {stat.value}
            </div>
            <div className="text-gray-500 dark:text-[#788099] text-xs font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stats;
