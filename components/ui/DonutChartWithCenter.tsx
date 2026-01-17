import React from "react";
import { DonutChartData } from "@/utils/chartData";
import { formatCurrency } from "@/lib/globalFormatter";

export interface DonutChartWithCenterProps {
  data: DonutChartData[];
  total: number;
  label: string;
  centerValue?: number;
}

export const DonutChartWithCenter: React.FC<DonutChartWithCenterProps> = ({
  data,
  total,
  label,
  centerValue,
}) => {
  const radius = 64;
  const stroke = 20;
  const center = 90;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const gap = 0.06 * circumference;

  // Calculate total from actual data values
  const actualTotal = data.reduce((sum, item) => sum + item.value, 0);

  const displayValue =
    typeof centerValue === "number" ? centerValue : actualTotal;

  // Check if amount is 0.00 or all values are 0
  const isZero = displayValue === 0 || actualTotal === 0;
  const greyColor = "#9CA3AF"; // Grey color for zero amounts

  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      {isZero ? (
        // Show grey circle when amount is 0.00
        <circle
          r={radius}
          cx={center}
          cy={center}
          fill="transparent"
          stroke={greyColor}
          strokeWidth={stroke}
          strokeDasharray={`${circumference} 0`}
          strokeLinecap="round"
          style={{ opacity: 1 }}
        />
      ) : (
        // Show normal donut chart when there are values
        data.map((d, i) => {
          const value =
            actualTotal > 0
              ? (d.value / actualTotal) * (circumference - gap * data.length)
              : 0;
          const el = (
            <circle
              key={d.label}
              r={radius}
              cx={center}
              cy={center}
              fill="transparent"
              stroke={d.color}
              strokeWidth={stroke}
              strokeDasharray={`${value} ${circumference - value}`}
              strokeDashoffset={Number.isFinite(-offset) ? -offset : 0}
              strokeLinecap="round"
              style={{ opacity: 1 }}
            />
          );
          offset += value + gap;
          return el;
        })
      )}
      <text
        x={center}
        y={center - 2}
        textAnchor="middle"
        className={isZero ? "fill-gray-400 dark:fill-gray-500" : "fill-black dark:fill-white"}
        fontSize="18"
        fontWeight="bold"
      >
        {displayValue === 0
          ? "0.00"
          : formatCurrency(displayValue).replace(" USD", "")}
      </text>
      <text
        x={center}
        y={center + 22}
        textAnchor="middle"
        fill="#A3A3A3"
        fontSize="13"
      >
        {label}
      </text>
    </svg>
  );
};
