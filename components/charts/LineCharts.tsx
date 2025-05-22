"use client";
import React, { useState } from "react";
import {
  exchangeOverviewData,
  p2pOverviewData,
  overviewTotalData,
  referralCommissionsData,
  overviewTotalSummary,
  referralCommissionsSummary,
  LineChartData,
  DonutChartData,
} from "../../utils/chartData";
import Button from "../ui/Button";

const months = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];
const yTicks = [10000, 7500, 5000, 2500, 1000];

function GradientLineChart({ data }: { data: LineChartData }) {
  const max = Math.max(...data.data);
  const min = Math.min(...data.data);
  const chartWidth = "100%";
  const chartHeight = 240;
  const chartLeft = 40;
  const chartRight = 360;
  const chartTop = 40;
  const chartBottom = 200;
  const points = data.data
    .map(
      (v, i) =>
        `${chartLeft + (i / 11) * (chartRight - chartLeft)},${
          chartTop +
          (chartBottom - chartTop) -
          ((v - min) / (max - min)) * (chartBottom - chartTop)
        }`
    )
    .join(" ");
  const areaPoints = `${chartLeft},${chartBottom} ${data.data
    .map(
      (v, i) =>
        `${chartLeft + (i / 11) * (chartRight - chartLeft)},${
          chartTop +
          (chartBottom - chartTop) -
          ((v - min) / (max - min)) * (chartBottom - chartTop)
        }`
    )
    .join(" ")} ${chartRight},${chartBottom}`;
  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={chartWidth}
        height={chartHeight}
        className="block w-full min-w-[400px]"
        viewBox={`0 0 ${400} ${chartHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ maxWidth: "100%" }}
      >
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#23262F" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Y-axis grid lines and labels */}
        {yTicks.map((y) => (
          <g key={y}>
            <line
              x1={chartLeft}
              x2={chartRight}
              y1={
                chartTop +
                (chartBottom - chartTop) -
                ((y - min) / (max - min)) * (chartBottom - chartTop)
              }
              y2={
                chartTop +
                (chartBottom - chartTop) -
                ((y - min) / (max - min)) * (chartBottom - chartTop)
              }
              stroke="#44454A"
              strokeDasharray="6 6"
              strokeWidth={1}
            />
            <text
              x={chartLeft - 10}
              y={
                chartTop +
                (chartBottom - chartTop) -
                ((y - min) / (max - min)) * (chartBottom - chartTop) +
                2
              }
              fill="#A3A3A3"
              fontSize="11"
              textAnchor="end"
              alignmentBaseline="middle"
              className="font-medium"
            >
              {y.toLocaleString()}
            </text>
          </g>
        ))}
        {/* Gradient area */}
        <polygon points={areaPoints} fill="url(#lineGradient)" />
        {/* Line */}
        <polyline
          fill="none"
          stroke="#22c55e"
          strokeWidth="4"
          points={points}
          style={{ filter: "drop-shadow(0px 2px 6px #22c55e55)" }}
        />
        {/* X-axis labels (show every other month) */}
        {months.map((m, i) =>
          i % 2 === 0 ? (
            <text
              key={m}
              x={chartLeft + (i / 11) * (chartRight - chartLeft)}
              y={chartBottom + 22}
              fill="#A3A3A3"
              fontSize="12"
              textAnchor="middle"
              className="font-semibold"
            >
              {m}
            </text>
          ) : null
        )}
      </svg>
    </div>
  );
}

function SimpleDonutChart({
  data,
  total,
}: {
  data: DonutChartData[];
  total: number;
}) {
  // Simple SVG donut chart for demo
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      {data.map((d, i) => {
        const value = (d.value / total) * circumference;
        const el = (
          <circle
            key={d.label}
            r={radius}
            cx={50}
            cy={50}
            fill="transparent"
            stroke={d.color}
            strokeWidth="12"
            strokeDasharray={`${value} ${circumference - value}`}
            strokeDashoffset={-offset}
            style={{ transition: "stroke-dasharray 0.3s" }}
          />
        );
        offset += value;
        return el;
      })}
    </svg>
  );
}

function DonutChartWithCenter({
  data,
  total,
  label,
}: {
  data: DonutChartData[];
  total: number;
  label: string;
}) {
  const radius = 64;
  const stroke = 20;
  const center = 90;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const gap = 0.06 * circumference;
  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      {data.map((d, i) => {
        const value = (d.value / total) * (circumference - gap * data.length);
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
            strokeDashoffset={-offset}
            strokeLinecap="round"
          />
        );
        offset += value + gap;
        return el;
      })}
      <text
        x={center}
        y={center - 2}
        textAnchor="middle"
        fill="#fff"
        fontSize="13"
        fontWeight="bold"
      >
        {total.toLocaleString()} USD
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
}

const Dropdown = ({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) => (
  <div className="relative ml-4">
    <select
      className="appearance-none bg-transparent text-[#A3A3A3] border border-[#44454A] rounded-full px-5 py-1.5 text-base pr-8 focus:outline-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ minWidth: 90 }}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
    <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-[#A3A3A3] text-lg">
      ▼
    </span>
  </div>
);

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-[#23232B] shadow-md w-full ${className}`}
    style={{ minHeight: 290, padding: "1rem" }}
  >
    {children}
  </div>
);

const Legend = ({ data }: { data: DonutChartData[] }) => (
  <div className="flex flex-col gap-4 justify-center min-w-[170px]">
    {data.map((d) => (
      <div
        key={d.label}
        className="flex items-center gap-3"
        style={{ fontSize: "13px" }}
      >
        <span
          style={{
            background: d.color,
            minWidth: 13,
            minHeight: 13,
            display: "inline-block",
            borderRadius: "50%",
          }}
        ></span>
        <span className="text-[#A3A3A3] font-medium flex-1">{d.label}</span>
        <span className="text-white font-semibold ml-auto min-w-[70px] text-right">
          {d.value.toLocaleString()} USD
        </span>
      </div>
    ))}
  </div>
);

const LineCharts = () => {
  const [filter, setFilter] = useState<"All" | "Deposits" | "Withdrawals">(
    "Deposits"
  );
  const [p2pFilter, setP2pFilter] = useState<"All" | "Sells" | "Buys">("Sells");
  const [period, setPeriod] = useState("Month");

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 w-full">
        {/* Exchange Overview */}
        <Card className="w-full rounded-none lg:rounded-2xl">
          <h3 className="text-white text-[14px] mb-2 font-semibold">
            Exchange Overview (USD)
          </h3>
          <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={filter === "All" ? "primary" : "outline"}
                onClick={() => setFilter("All")}
                className="whitespace-nowrap"
              >
                All
              </Button>
              <Button
                size="sm"
                variant={filter === "Deposits" ? "primary" : "outline"}
                onClick={() => setFilter("Deposits")}
                className="whitespace-nowrap"
              >
                Deposits
              </Button>
              <Button
                size="sm"
                variant={filter === "Withdrawals" ? "primary" : "outline"}
                onClick={() => setFilter("Withdrawals")}
                className="whitespace-nowrap"
              >
                Withdrawals
              </Button>
              <Dropdown
                value={period}
                options={["Month", "Week", "Year"]}
                onChange={setPeriod}
              />
            </div>
          </div>
          <div className="w-full">
            <GradientLineChart data={exchangeOverviewData} />
          </div>
        </Card>
        {/* P2P Overview */}
        <Card className="w-full rounded-none lg:rounded-2xl">
          <h3 className="text-white text-[14px] mb-2 font-semibold">
            P2P Overview (USD)
          </h3>
          <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={p2pFilter === "All" ? "primary" : "outline"}
                onClick={() => setP2pFilter("All")}
                className="whitespace-nowrap"
              >
                All
              </Button>
              <Button
                size="sm"
                variant={p2pFilter === "Sells" ? "primary" : "outline"}
                onClick={() => setP2pFilter("Sells")}
                className="whitespace-nowrap"
              >
                Sells
              </Button>
              <Button
                size="sm"
                variant={p2pFilter === "Buys" ? "primary" : "outline"}
                onClick={() => setP2pFilter("Buys")}
                className="whitespace-nowrap"
              >
                Buys
              </Button>
              <Dropdown
                value={period}
                options={["Month", "Week", "Year"]}
                onChange={setPeriod}
              />
            </div>
          </div>
          <div className="w-full">
            <GradientLineChart data={p2pOverviewData} />
          </div>
        </Card>
        {/* Overview Total */}
        <Card className="w-full rounded-none lg:rounded-2xl flex flex-col lg:flex-row items-center h-full relative">
          <div className="absolute left-0 top-0 px-2 pt-2 flex flex-wrap w-full justify-between items-center gap-2">
            <h3 className="text-white text-[18px] font-semibold">
              Overview Total
            </h3>
            <div className="flex flex-wrap gap-2">
              <button className="bg-[#1D8751] text-white px-3 py-1 rounded-full text-[13px] font-semibold whitespace-nowrap">
                Exchange
              </button>
              <button className="bg-transparent border border-[#1D8751] text-[#1D8751] px-3 py-1 rounded-full text-[13px] font-semibold whitespace-nowrap">
                P2P
              </button>
              <button className="bg-transparent border border-[#1D8751] text-[#1D8751] px-3 py-1 rounded-full text-[13px] font-semibold whitespace-nowrap">
                Swap
              </button>
              <button className="bg-transparent border border-[#1D8751] text-[#1D8751] px-3 py-1 rounded-full text-[13px] font-semibold whitespace-nowrap">
                Buy
              </button>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row w-full pt-10">
            <Legend data={overviewTotalData} />
            <div className="flex-1 flex flex-col items-center justify-center mt-4 lg:mt-0">
              <DonutChartWithCenter
                data={overviewTotalData}
                total={overviewTotalSummary.total}
                label="Transactions"
              />
            </div>
          </div>
        </Card>
        {/* Referral Commissions */}
        <Card className="w-full rounded-none lg:rounded-2xl flex flex-col lg:flex-row items-center h-full relative">
          <div className="absolute left-0 top-0 px-2 pt-2 flex flex-wrap w-full justify-between items-center gap-2">
            <h3 className="text-white text-[14px] mb-2 font-semibold">
              Your Referal Commissions
            </h3>
            <Dropdown
              value={period}
              options={["Month", "Week", "Year"]}
              onChange={setPeriod}
            />
          </div>
          <div className="flex flex-col lg:flex-row w-full pt-10">
            <Legend data={referralCommissionsData} />
            <div className="flex-1 flex flex-col items-center justify-center mt-4 lg:mt-0">
              <DonutChartWithCenter
                data={referralCommissionsData}
                total={referralCommissionsSummary.total}
                label="Commissions"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LineCharts;
