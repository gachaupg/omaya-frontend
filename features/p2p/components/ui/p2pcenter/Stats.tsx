import React from "react";

const Stats = ({ summary }: { summary?: any }) => {
  const safe = summary && typeof summary === "object" && !Array.isArray(summary) ? summary : {};
  const num = (v: any) => (typeof v === "number" && !Number.isNaN(v) ? v : typeof v === "string" ? parseFloat(v) || 0 : 0);
  const stats = [
    { value: num(safe.total_trades) || 0, label: "Trades" },
    { value: `${num(safe.completion_rate) || 0}%`, label: "Completion rate" },
    { value: <><span>{safe.avg_release_time ?? "0"}</span></>, label: "Avg. release time" },
    { value: <><span>{safe.avg_payment_time ?? "0"}</span></>, label: "Avg. pay time" },
    { value: `${num(safe.rating) || 0}`, label: "Rating" },
    { value: <><span>{(num(safe.total_volume) || 0).toLocaleString()}</span></>, label: "" },
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
