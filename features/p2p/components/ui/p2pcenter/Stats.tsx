import React from "react";
import { statsData } from "../../../data";

const stats = [
  { value: statsData.trades, label: "Trades" },
  { value: `${statsData.completionRate}%`, label: "Completion rate" },
  {
    value: (
      <>
        <span>{statsData.avgReleaseTime}</span>{" "}
        <span className="text-[#A1A1AA] text-[16px] sm:text-[18px]">Min</span>
      </>
    ),
    label: "Avg. release time",
  },
  {
    value: (
      <>
        <span>{statsData.avgPayTime}</span>{" "}
        <span className="text-[#A1A1AA] text-[16px] sm:text-[18px]">Min</span>
      </>
    ),
    label: "Avg. pay time",
  },
  { value: `${statsData.rating}%`, label: "Rating" },
  {
    value: (
      <>
        <span>{statsData.totalVolume.toLocaleString()}</span>{" "}
        <span className="text-[#A1A1AA] text-[16px] sm:text-[18px]">
          {statsData.currency}
        </span>
      </>
    ),
    label: "Total volume",
  },
];

const Stats = () => {
  return (
    <div className="w-full min-h-[100px] rounded-[24px] border-2 border-[#35353E] bg-[#1D1D23] p-4 sm:p-6 box-border">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 w-full">
        {stats.map((stat, idx) => (
          <div key={idx} className="text-center w-full">
            <div className="text-white text-[18px] sm:text-[22px] font-medium flex items-center justify-center gap-1">
              {stat.value}
            </div>
            <div className="text-[#788099] text-[13px] sm:text-[15px]">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stats;
