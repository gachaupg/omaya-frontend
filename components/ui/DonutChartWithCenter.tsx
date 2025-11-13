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

  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      {data.map((d, i) => {
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
      })}
      <text
        x={center}
        y={center - 2}
        textAnchor="middle"
        className="fill-black dark:fill-white"
        fontSize="18"
        fontWeight="bold"
      >
        {displayValue === 0
          ? "0.0"
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
