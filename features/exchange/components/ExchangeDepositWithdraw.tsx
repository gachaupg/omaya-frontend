import React from "react";
import { formatCurrency } from "@/lib/globalFormatter";

type ExchangeDepositWithdrawProps = {
  title: string;
  total: number;
  completed: number;
  inEscrow: number;
  color: "primary" | "secondary" | "danger";
};

const ExchangeDepositWithdraw: React.FC<ExchangeDepositWithdrawProps> = ({
  title,
  total,
  completed,
  inEscrow,
  color,
}) => {
  // Color mapping with direct values
  const colorMap = {
    primary: "#1D8751",   // Brand-primary
    secondary: "#E23D3A", // Brand-secondary
    danger: "#E23D3A"     // Same as secondary for error states
  };

  const progressPercentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="w-full rounded-[14px] bg-[#1D1D23] border border-[#35353E] p-3">
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-sm text-white">
            {title}
          </h3>
          <div className="relative">
            <select
              className="px-2 py-1 rounded text-xs appearance-none pr-8 bg-[#1D1D23] border border-[#35353E] text-white"
            >
              <option>Month</option>
              <option>Week</option>
              <option>Day</option>
            </select>
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-white">
              ▼
            </span>
          </div>
        </div>

        <div className="text-xl font-bold mb-3 text-white">
          {formatCurrency(total || 0)}
        </div>

        <div className="mb-2 w-full rounded-full h-4 bg-[#35353E]">
          <div
            className="h-4 rounded-full"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor: colorMap[color]
            }}
          ></div>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colorMap[color] }}
              ></div>
              <span className="text-sm text-[#788099]">
                Completed
              </span>
            </div>
            <span className="text-white">
              {formatCurrency(completed || 0)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#35353E]"></div>
              <span className="text-sm text-[#788099]">
                In Escrow
              </span>
            </div>
            <span className="text-white">
              {formatCurrency(inEscrow || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangeDepositWithdraw;