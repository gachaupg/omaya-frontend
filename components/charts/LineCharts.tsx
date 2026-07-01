"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import { AppDispatch } from "@/store";
import {
  overviewTotalData,
  referralCommissionsData,
  overviewTotalSummary,
  referralCommissionsSummary,
  LineChartData,
  DonutChartData,
} from "../../utils/chartData";
import { formatLargeNumber } from "@/utils/formatters";
import Button from "../ui/Button";
import { TransactionSummary } from "../types";
import { fetchUserTrades } from "@/features/p2p/slices/userTradesSlice";
import { fetchAllUserTradesPages } from "@/features/p2p/utils/fetchAllUserTradesPages";
import { buildP2PMonthlyChartBuckets } from "@/features/p2p/utils/p2pTradeChartAggregation";
import { fetchAllUserTransactionsPages } from "@/features/transactions/utils/fetchAllUserTransactionsPages";
import {
  buildMoneyXMonthlyChartBuckets,
  buildP2PFundingMonthlyChartBuckets,
  buildSwapMonthlyChartBuckets,
} from "@/features/transactions/utils/userTransactionChartAggregation";
import type { AllTransactionItem } from "@/features/transactions/api";
import { RootState } from "@/store";
import { fetchReferralWallet } from "@/features/settings/slices/referralWalletSlice";
import { storage } from "@/features/auth/utils/storage";
import { useTheme } from "@/context/theme";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  buildExchangeMonthlyChartBuckets,
  reconcileExchangeChartBucketsWithSummary,
} from "@/lib/utils/normalizeTransactionSummary";
import { formatCurrency } from "@/lib/globalFormatter";

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

function uniqueYTicksDescending(ticks: number[]): number[] {
  const seen = new Set<string>();
  const out: number[] = [];
  for (const tick of ticks) {
    const key = Number.isFinite(tick) ? tick.toFixed(8) : String(tick);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tick);
  }
  return out;
}

function getDynamicYTicks(data: number[], minTicks = 5) {
  const max = Math.max(...data, 0);
  if (max === 0) {
    return [0];
  }

  const span = Math.max(minTicks - 1, 1);

  // Small USD amounts (typical Express exchange volumes)
  if (max <= 100) {
    const step =
      max <= 2
        ? 0.5
        : max <= 10
          ? 2
          : max <= 50
            ? 10
            : 25;
    const top = Math.max(step, Math.ceil(max / step) * step);
    const ticks = Array.from({ length: minTicks }, (_, i) =>
      Number(((top * (span - i)) / span).toFixed(2))
    );
    const unique = uniqueYTicksDescending(ticks);
    return unique.length > 0 ? unique : [0, top];
  }

  const roughStep = max / span;
  const pow = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const step = Math.ceil(roughStep / pow) * pow;
  const ticks = Array.from({ length: minTicks }, (_, i) => step * (span - i));
  return uniqueYTicksDescending(ticks);
}

const GradientLineChart = React.memo(
  ({
    data1,
    data2,
    labels = [],
    color1 = "#1D8751",
    color2 = "#FF4D4D",
    showData1 = true,
    showData2 = true,
  }: {
    data1: LineChartData;
    data2: LineChartData;
    labels?: string[];
    color1?: string;
    color2?: string;
    showData1?: boolean;
    showData2?: boolean;
  }) => {
    // Memoize chart dimensions (responsive)
    const [windowWidth, setWindowWidth] = React.useState(
      typeof window !== "undefined" ? window.innerWidth : 1200
    );

    React.useEffect(() => {
      if (typeof window === "undefined") return;
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    const chartDimensions = React.useMemo(() => {
      // Use a responsive internal width for the SVG coordinate system.
      // This ensures we always have enough horizontal drawing room on mobile.
      const baseWidth = windowWidth < 640 ? 360 : 440; // smaller but wide enough on mobile
      const height = windowWidth < 640 ? 200 : 240;
      const left = windowWidth < 640 ? 44 : windowWidth < 1024 ? 52 : 64;
      const right = baseWidth - 20; // draw nearly to the right edge
      const top = windowWidth < 640 ? 24 : 40;
      const bottom = height - (windowWidth < 640 ? 24 : 40);
      return { baseWidth, height, left, right, top, bottom };
    }, [windowWidth]);

    const safeLabels =
      labels && labels.length
        ? labels
        : Array.from(
          { length: Math.max(data1.data.length, data2.data.length, 1) },
          (_, idx) => months[idx] || `#${idx + 1}`
        );

    const visibleValues = React.useMemo(() => {
      const values: number[] = [];
      if (showData1) values.push(...data1.data);
      if (showData2) values.push(...data2.data);
      return values;
    }, [data1.data, data2.data, showData1, showData2]);

    const { min, max } = React.useMemo(() => {
      if (!visibleValues.length) {
        return { min: 0, max: 0 };
      }
      return {
        min: 0,
        max: Math.max(...visibleValues, 0),
      };
    }, [visibleValues]);

    const yTicks = React.useMemo(
      () => getDynamicYTicks(visibleValues),
      [visibleValues]
    );

    const createPoints = React.useCallback(
      (dataset: LineChartData) => {
        const length = Math.min(dataset.data.length, safeLabels.length);
        if (length === 0) return [];
        const denominator = Math.max(length - 1, 1);
        return Array.from({ length }, (_, i) => {
          const normalizedIndex = denominator === 0 ? 0 : i / denominator;
          return {
            x:
              chartDimensions.left +
              normalizedIndex * (chartDimensions.right - chartDimensions.left),
            y:
              chartDimensions.top +
              (chartDimensions.bottom - chartDimensions.top) -
              ((dataset.data[i] - min) / (max - min || 1)) *
              (chartDimensions.bottom - chartDimensions.top),
          };
        });
      },
      [chartDimensions, safeLabels.length, min, max]
    );

    const points1 = React.useMemo(
      () => createPoints(data1),
      [createPoints, data1]
    );
    const points2 = React.useMemo(
      () => createPoints(data2),
      [createPoints, data2]
    );

    // Memoize path generation function
    const generateSmoothPath = React.useCallback(
      (points: { x: number; y: number }[]) => {
        if (points.length === 0) return "";
        if (points.length === 1) {
          const p = points[0];
          return `M ${p.x},${p.y} L ${p.x + 1},${p.y}`;
        }
        const firstPoint = points[0];
        let path = `M ${firstPoint.x},${firstPoint.y}`;
        for (let i = 1; i < points.length; i++) {
          const current = points[i];
          const previous = points[i - 1];
          const controlX = (previous.x + current.x) / 2;
          path += ` C ${controlX},${previous.y} ${controlX},${current.y} ${current.x},${current.y}`;
        }
        return path;
      },
      []
    );

    // Memoize paths
    const linePath1 = React.useMemo(
      () => generateSmoothPath(points1),
      [points1, generateSmoothPath]
    );
    const linePath2 = React.useMemo(
      () => generateSmoothPath(points2),
      [points2, generateSmoothPath]
    );

    // Memoize area points
    const createAreaPoints = React.useCallback(
      (points: { x: number; y: number }[]) => {
        if (!points.length) return "";
        const firstX = points[0].x;
        const lastX = points[points.length - 1].x;
        return `${firstX},${chartDimensions.bottom} ${points
          .map((p) => `${p.x},${p.y}`)
          .join(" ")} ${lastX},${chartDimensions.bottom}`;
      },
      [chartDimensions.bottom]
    );

    const areaPoints1 = React.useMemo(
      () => createAreaPoints(points1),
      [points1, createAreaPoints]
    );
    const areaPoints2 = React.useMemo(
      () => createAreaPoints(points2),
      [points2, createAreaPoints]
    );

    const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);

    const pointCount = Math.max(
      data1.data.length,
      data2.data.length,
      safeLabels.length
    );

    const formatChartAmount = (value: number) => formatCurrency(value, "USD");

    return (
      <div className="w-full overflow-x-auto scrollbar-thin relative">
        {hoverIndex != null && hoverIndex >= 0 && hoverIndex < pointCount && (
          <div
            className="pointer-events-none absolute z-20 rounded-lg border px-3 py-2 text-xs shadow-lg dark:bg-[#18181D] dark:border-[#35353E] dark:text-white bg-white border-gray-200 text-gray-900"
            style={{
              left: `clamp(8px, ${((points1[hoverIndex]?.x ?? points2[hoverIndex]?.x ?? chartDimensions.left) / chartDimensions.baseWidth) * 100}%, calc(100% - 8px))`,
              top: 8,
              transform: "translateX(-50%)",
            }}
          >
            <p className="font-semibold mb-1">{safeLabels[hoverIndex] ?? ""}</p>
            <p style={{ color: color1 }}>
              {data1.label}: {formatChartAmount(data1.data[hoverIndex] ?? 0)}
            </p>
            <p style={{ color: color2 }}>
              {data2.label}: {formatChartAmount(data2.data[hoverIndex] ?? 0)}
            </p>
          </div>
        )}
        <svg
          width="100%"
          height={chartDimensions.height}
          viewBox={`0 0 ${chartDimensions.baseWidth} ${chartDimensions.height}`}
          preserveAspectRatio="xMidYMid meet"
          className="block w-full"
          style={{ display: "block", minHeight: `${chartDimensions.height}px` }}
        >
          <defs>
            <linearGradient
              id={`lineGradient-${color1}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color1} stopOpacity="0.5" />
              <stop offset="100%" stopColor="#23262F" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient
              id={`lineGradient-${color2}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color2} stopOpacity="0.5" />
              <stop offset="100%" stopColor="#23262F" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {yTicks.map((y, tickIndex) => (
            <g key={`y-tick-${tickIndex}-${y}`}>
              <line
                x1={chartDimensions.left}
                x2={chartDimensions.right}
                y1={
                  chartDimensions.top +
                  (chartDimensions.bottom - chartDimensions.top) -
                  ((y - min) / (max - min || 1)) *
                  (chartDimensions.bottom - chartDimensions.top)
                }
                y2={
                  chartDimensions.top +
                  (chartDimensions.bottom - chartDimensions.top) -
                  ((y - min) / (max - min || 1)) *
                  (chartDimensions.bottom - chartDimensions.top)
                }
                stroke="#44454A"
                strokeDasharray="6 6"
                strokeWidth={1}
              />
              <text
                x={chartDimensions.left - (windowWidth < 640 ? 5 : 10)}
                y={
                  chartDimensions.top +
                  (chartDimensions.bottom - chartDimensions.top) -
                  ((y - min) / (max - min || 1)) *
                  (chartDimensions.bottom - chartDimensions.top) +
                  2
                }
                fill="#A3A3A3"
                fontSize={windowWidth < 640 ? "8" : windowWidth < 1024 ? "10" : "11"}
                textAnchor="end"
                alignmentBaseline="middle"
                className="font-medium"
              >
                {y < 1000
                  ? y.toFixed(y % 1 === 0 ? 0 : 2)
                  : windowWidth < 640 && y >= 1000
                    ? `${(y / 1000).toFixed(y >= 1000000 ? 1 : 0)}${y >= 1000000 ? "M" : "K"}`
                    : y.toLocaleString()}
              </text>
            </g>
          ))}
          {showData1 && (
            <>
              <polygon
                points={areaPoints1}
                fill={`url(#lineGradient-${color1})`}
              />
              <path
                d={linePath1}
                fill="none"
                stroke={color1}
                strokeWidth="4"
                style={{ filter: `drop-shadow(0px 2px 6px ${color1}55)` }}
              />
            </>
          )}
          {showData2 && (
            <>
              <polygon
                points={areaPoints2}
                fill={`url(#lineGradient-${color2})`}
              />
              <path
                d={linePath2}
                fill="none"
                stroke={color2}
                strokeWidth="4"
                style={{ filter: `drop-shadow(0px 2px 6px ${color2}55)` }}
              />
            </>
          )}
          {showData1 &&
            points1.map((p, i) =>
              data1.data[i] > 0 ? (
                <circle
                  key={`dep-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={hoverIndex === i ? 6 : 4}
                  fill={color1}
                />
              ) : null
            )}
          {showData2 &&
            points2.map((p, i) =>
              data2.data[i] > 0 ? (
                <circle
                  key={`wd-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={hoverIndex === i ? 6 : 4}
                  fill={color2}
                />
              ) : null
            )}
          {Array.from({ length: pointCount }, (_, i) => {
            const denominator = Math.max(pointCount - 1, 1);
            const normalizedIndex = denominator === 0 ? 0 : i / denominator;
            const x =
              chartDimensions.left +
              normalizedIndex * (chartDimensions.right - chartDimensions.left);
            const bandWidth =
              pointCount > 1
                ? (chartDimensions.right - chartDimensions.left) / (pointCount - 1)
                : chartDimensions.right - chartDimensions.left;
            return (
              <rect
                key={`hover-${i}`}
                x={x - bandWidth / 2}
                y={chartDimensions.top}
                width={Math.max(bandWidth, 12)}
                height={chartDimensions.bottom - chartDimensions.top}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            );
          })}
          {safeLabels.map((label, i) => {
            const shouldRenderLabel =
              safeLabels.length <= 6 || i % 2 === 0 || safeLabels.length <= 0;
            if (!shouldRenderLabel) return null;
            const denominator = Math.max(safeLabels.length - 1, 1);
            const normalizedIndex = denominator === 0 ? 0 : i / denominator;
            return (
              <text
                key={`${label}-${i}`}
                x={
                  chartDimensions.left +
                  normalizedIndex * (chartDimensions.right - chartDimensions.left)
                }
                y={chartDimensions.bottom + (windowWidth < 640 ? 18 : 22)}
                fill="#A3A3A3"
                fontSize={windowWidth < 640 ? "10" : windowWidth < 1024 ? "11" : "12"}
                textAnchor="middle"
                className="font-semibold"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    );
  }
);

GradientLineChart.displayName = "GradientLineChart";

function SimpleDonutChart({
  data,
  total,
}: {
  data: DonutChartData[];
  total: number;
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      className="w-full h-auto max-w-[100px]"
      preserveAspectRatio="xMidYMid meet"
    >
      {data.map((d, i) => {
        const value = total > 0 ? ((d.value || 0) / total) * circumference : 0;
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
            strokeDashoffset={Number.isFinite(-offset) ? -offset : 0}
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
  hideCurrency,
}: {
  data: DonutChartData[];
  total: number;
  label: string;
  hideCurrency?: boolean;
}) {
  const radius = 64;
  const stroke = 12;
  const center = 90;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const gap = 0.06 * circumference;

  // Calculate total from actual data values
  const actualTotal = data.reduce((sum, item) => sum + item.value, 0);
  const displayTotal = total ?? actualTotal;

  // Check if all values are 0
  const allZero = actualTotal === 0;
  const normalizedTotal = allZero ? 1 : actualTotal;

  return (
    <svg
      width="180"
      height="180"
      viewBox="0 0 180 180"
      className="w-full h-auto max-w-[180px]"
      preserveAspectRatio="xMidYMid meet"
    >
      {allZero ? (
        // Show gray circle when all values are 0
        <circle
          r={radius}
          cx={center}
          cy={center}
          fill="transparent"
          stroke="#44454A"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} 0`}
          strokeLinecap="round"
          shapeRendering="geometricPrecision"
        />
      ) : (
        // Show normal donut chart when there are values
        data.map((d, i) => {
          const value =
            normalizedTotal > 0
              ? (d.value / normalizedTotal) *
              (circumference - gap * Math.max(data.length - 1, 0))
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
              shapeRendering="geometricPrecision"
              style={{ opacity: 1 }}
            />
          );
          offset += value + (gap || 0);
          return el;
        })
      )}
      <text
        x={center}
        y={center - 2}
        textAnchor="middle"
        fill="currentColor"
        fontSize="12"
        fontWeight="600"
        className="dark:fill-white fill-black"
        style={{ textRendering: "geometricPrecision" }}
      >
        {hideCurrency
          ? allZero
            ? "0"
            : formatLargeNumber(displayTotal)
          : allZero
            ? "0 USD"
            : `${formatLargeNumber(displayTotal)} USD`}
      </text>
      <text
        x={center}
        y={center + 26}
        textAnchor="middle"
        fill="#B0B4C9"
        fontSize="12"
        fontWeight="500"
        style={{ textRendering: "optimizeLegibility" }}
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
  <div className="relative inline-flex min-w-0 max-w-full mr-1 sm:mr-2 md:mr-3">
    <select
      className="appearance-none bg-white dark:bg-[#23232B] dark:text-white text-gray-700 rounded-full px-1.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs md:text-sm pr-4 sm:pr-6 md:pr-7 focus:outline-none w-full min-w-0 border border-gray-300 dark:border-[#35353E] max-w-[80px] sm:max-w-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-white dark:bg-[#23232B] dark:text-white text-gray-700">
          {opt}
        </option>
      ))}
    </select>
    <Image
      src="/assets/Frame_34634_zwzons.png"
      alt="Dropdown arrow"
      width={15}
      height={15}
      className="pointer-events-none absolute right-0.5 sm:right-1 md:right-1.5 top-1/2 transform -translate-y-1/2 object-contain w-3 h-3 sm:w-[15px] sm:h-[15px]"
    />
  </div>
);

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const [dimensions, setDimensions] = React.useState({ minHeight: 290, padding: "1rem" });

  React.useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setDimensions({ minHeight: 220, padding: "0.75rem" });
      } else if (width < 640) {
        setDimensions({ minHeight: 250, padding: "0.875rem" });
      } else if (width < 768) {
        setDimensions({ minHeight: 270, padding: "1rem" });
      } else {
        setDimensions({ minHeight: 290, padding: "1rem" });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return (
    <div
      className={`bg-card shadow-md w-full overflow-hidden ${className}`}
      style={{ minHeight: dimensions.minHeight, padding: dimensions.padding }}
    >
      {children}
    </div>
  );
};

const TIME_PERIOD_OPTIONS = ["All", "Last Week", "Month", "One Year"];

function HorizontalChartCarousel({ children }: { children: React.ReactNode }) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const updateScrollState = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, children]);

  const scrollByCard = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const step = Math.max(el.clientWidth * 0.85, 280);
    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative w-full mb-4 lg:mb-8">
      {canScrollLeft && (
        <button
          type="button"
          aria-label="Scroll charts left"
          onClick={() => scrollByCard("left")}
          className="absolute left-0 top-1/2 z-10 flex h-8 w-8 sm:h-9 sm:w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-md hover:bg-gray-50 dark:border-[#35353E] dark:bg-[#23232B]/95 dark:text-white dark:hover:bg-[#2A2A32]"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          aria-label="Scroll charts right"
          onClick={() => scrollByCard("right")}
          className="absolute right-0 top-1/2 z-10 flex h-8 w-8 sm:h-9 sm:w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-md hover:bg-gray-50 dark:border-[#35353E] dark:bg-[#23232B]/95 dark:text-white dark:hover:bg-[#2A2A32]"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-thin pb-2 px-1 sm:px-10"
      >
        {children}
      </div>
    </div>
  );
}

type OverviewLineChartCardProps = {
  title: string;
  isDeem?: boolean;
  loading?: boolean;
  filters: { id: string; label: string }[];
  activeFilter: string;
  onFilterChange: (id: string) => void;
  timePeriod: string;
  onTimePeriodChange: (value: string) => void;
  series1: LineChartData;
  series2: LineChartData;
  labels: string[];
  showSeries1: boolean;
  showSeries2: boolean;
};

function OverviewLineChartCard({
  title,
  isDeem,
  loading = false,
  filters,
  activeFilter,
  onFilterChange,
  timePeriod,
  onTimePeriodChange,
  series1,
  series2,
  labels,
  showSeries1,
  showSeries2,
}: OverviewLineChartCardProps) {
  return (
    <Card
      className={`flex-shrink-0 w-[min(100%,340px)] sm:w-[400px] lg:w-[460px] snap-start rounded-none lg:rounded-2xl bg-gray-50 dark:bg-card shadow-sm ${isDeem ? "border border-[#35353E]" : ""}`}
    >
      <h3 className="text-black dark:text-white text-xs sm:text-sm md:text-[14px] mb-2 font-semibold">
        {title}
      </h3>
      <div className="flex flex-nowrap overflow-x-auto overflow-y-hidden scrollbar-thin items-center gap-1 sm:gap-2 mb-4 sm:mb-6 min-w-0 pb-1">
        {filters.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={activeFilter === item.id ? "primary" : "outline"}
            onClick={() => onFilterChange(item.id)}
            className="whitespace-nowrap rounded-3xl text-xs sm:text-sm flex-shrink-0"
          >
            {item.label}
          </Button>
        ))}
        <div className="ml-1 sm:ml-4 flex-shrink-0 min-w-0">
          <Dropdown
            value={timePeriod}
            options={TIME_PERIOD_OPTIONS}
            onChange={onTimePeriodChange}
          />
        </div>
      </div>
      <div className="w-full min-h-[200px] sm:min-h-[240px] flex items-center justify-center">
        {loading ? (
          <span className="text-sm text-gray-500 dark:text-[#788099]">
            Loading...
          </span>
        ) : (
          <GradientLineChart
            data1={series1}
            data2={series2}
            labels={labels}
            showData1={showSeries1}
            showData2={showSeries2}
          />
        )}
      </div>
    </Card>
  );
}

const Legend = ({ data, hideCurrency }: { data: DonutChartData[]; hideCurrency?: boolean }) => (
  <div className="flex flex-col gap-3 sm:gap-4 justify-center min-w-0 sm:min-w-[150px] w-full sm:w-auto">
    {data.map((d) => (
      <div
        key={d.label}
        className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs md:text-sm"
        style={{ textRendering: "optimizeLegibility" }}
      >
        <span
          style={{
            background: d.color,
            width: 15,
            height: 15,
            flexShrink: 0,
          }}
          className="rounded-sm block"
        ></span>
        <span className="text-muted-foreground font-medium flex-1 min-w-0 break-normal sm:text-xs md:text-sm">
          {d.label}
        </span>
        <span className="dark:text-white text-[#051015] font-medium ml-auto min-w-[72px] sm:min-w-[80px] text-right tracking-tight shrink-0 text-[10px] md:text-xs lg:text-sm tabular-nums">
          {formatLargeNumber(d.value)}
          {hideCurrency ? "" : " USD"}
        </span>
      </div>
    ))}
  </div>
);

const LineCharts = React.memo(
  ({ transactionSummary }: { transactionSummary: TransactionSummary }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isDeem } = useTheme();
    const [filter, setFilter] = useState<"All" | "Deposits" | "Withdrawals">(
      "All"
    );
    const [p2pFilter, setP2pFilter] = useState<"All" | "Sell Orders" | "Buy Orders">(
      "All"
    );
    const [period, setPeriod] = useState("Month");
    const [exchangeTimePeriod, setExchangeTimePeriod] = useState("All");
    const [p2pTimePeriod, setP2pTimePeriod] = useState("All");
    const [p2pFundingFilter, setP2pFundingFilter] = useState<
      "All" | "Deposits" | "Withdrawals"
    >("All");
    const [p2pFundingTimePeriod, setP2pFundingTimePeriod] = useState("All");
    const [swapFilter, setSwapFilter] = useState<
      "All" | "Completed" | "Pending"
    >("All");
    const [swapTimePeriod, setSwapTimePeriod] = useState("All");
    const [moneyxFilter, setMoneyxFilter] = useState<
      "All" | "Completed" | "Failed"
    >("All");
    const [moneyxTimePeriod, setMoneyxTimePeriod] = useState("All");
    const [referralTimePeriod, setReferralTimePeriod] = useState("All");
    const [activeTab, setActiveTab] = useState<
      "exchange" | "p2p" | "swap" | "buy"
    >("exchange");
    const [p2pChartData, setP2pChartData] = useState<{
      buyData: LineChartData;
      sellData: LineChartData;
    }>({
      buyData: {
        label: "Buy Orders",
        data: Array(12).fill(0),
      },
      sellData: {
        label: "Sell Orders",
        data: Array(12).fill(0),
      },
    });

    const [allExchangeTransactions, setAllExchangeTransactions] = useState<
      AllTransactionItem[]
    >([]);
    const [allP2pTransactions, setAllP2pTransactions] = useState<
      AllTransactionItem[]
    >([]);
    const [allSwapTransactions, setAllSwapTransactions] = useState<
      AllTransactionItem[]
    >([]);
    const [allMoneyxTransactions, setAllMoneyxTransactions] = useState<
      AllTransactionItem[]
    >([]);
    const [exchangeTxLoaded, setExchangeTxLoaded] = useState(false);
    const [allUserTrades, setAllUserTrades] = useState<any[]>([]);
    const userTrades = useSelector((state: any) => state.userTrades.trades);
    const { user, isAuthenticated } = useSelector(
      (state: RootState) => state.auth
    );

    // Exchange graph: /user/all-transactions/?type=exchange (all pages, completed only in buckets)
    useEffect(() => {
      if (!isAuthenticated) {
        setExchangeTxLoaded(false);
        setAllExchangeTransactions([]);
        setAllP2pTransactions([]);
        setAllSwapTransactions([]);
        setAllMoneyxTransactions([]);
        return;
      }

      let cancelled = false;

      fetchAllUserTransactionsPages({
        type: "exchange",
        fetchAll: true,
        pageSize: 10,
      })
        .then((rows) => {
          if (cancelled) return;
          setAllExchangeTransactions(Array.isArray(rows) ? rows : []);
          setExchangeTxLoaded(true);
        })
        .catch(() => {
          if (cancelled) return;
          setExchangeTxLoaded(true);
        });

      Promise.all([
        fetchAllUserTransactionsPages({
          type: "p2p",
          fetchAll: true,
          pageSize: 10,
        }),
        fetchAllUserTransactionsPages({
          type: "swap",
          fetchAll: true,
          pageSize: 10,
        }),
        fetchAllUserTransactionsPages({
          type: "moneyx",
          fetchAll: true,
          pageSize: 10,
        }),
      ])
        .then(([p2pRows, swapRows, moneyxRows]) => {
          if (cancelled) return;
          setAllP2pTransactions(Array.isArray(p2pRows) ? p2pRows : []);
          setAllSwapTransactions(Array.isArray(swapRows) ? swapRows : []);
          setAllMoneyxTransactions(Array.isArray(moneyxRows) ? moneyxRows : []);
        })
        .catch(() => {
          /* keep previous rows */
        });

      fetchAllUserTradesPages({ fetchAll: true })
        .then((rows) => {
          if (!cancelled) {
            setAllUserTrades(Array.isArray(rows) ? rows : []);
          }
        })
        .catch(() => {
          /* keep previous P2P trade rows */
        });
      dispatch(fetchUserTrades({ page: 1 }));

      return () => {
        cancelled = true;
      };
    }, [dispatch, isAuthenticated]);

    // Process P2P user-trades for P2P Overview (all pages, canceled excluded)
    useEffect(() => {
      const tradeRows =
        allUserTrades.length > 0 ? allUserTrades : userTrades?.results;
      if (!tradeRows?.length) return;

      const { buys, sells } = buildP2PMonthlyChartBuckets(
        tradeRows,
        user?.email
      );

      setP2pChartData({
        buyData: {
          label: "Buy Orders",
          data: buys,
        },
        sellData: {
          label: "Sell Orders",
          data: sells,
        },
      });
    }, [allUserTrades, userTrades?.results, user?.email]);

    const {
      data: walletData,
      loading: walletLoading,
      error: walletError,
    } = useSelector((state: RootState) => state.referralWallet);

    const rollingMonthLabels = React.useMemo(() => {
      const labels: string[] = [];
      const now = new Date();
      for (let offset = 11; offset >= 0; offset--) {
        const target = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        labels.push(
          target
            .toLocaleString("en-US", { month: "short" })
            .toUpperCase()
        );
      }
      return labels;
    }, []);

    const getSliceIndices = React.useCallback((length: number, timePeriod: string) => {
      if (length === 0) return [];
      let sliceCount = length;
      switch (timePeriod) {
        case "Last Week":
          sliceCount = Math.min(4, length);
          break;
        case "Month":
          sliceCount = Math.min(1, length);
          break;
        case "One Year":
        case "All":
        default:
          sliceCount = Math.min(length, 12);
          break;
      }
      const start = Math.max(0, length - sliceCount);
      return Array.from({ length: sliceCount }, (_, idx) => start + idx);
    }, []);

    const getFilteredDataset = React.useCallback(
      (
        series: LineChartData,
        timePeriod: string,
        indices?: number[]
      ): { dataset: LineChartData; labels: string[]; indices: number[] } => {
        const dataLength = series.data.length;
        const sliceIndices =
          indices && indices.length
            ? indices
            : getSliceIndices(dataLength, timePeriod);
        const normalizedIndices = sliceIndices.filter(
          (index) => index >= 0 && index < dataLength
        );
        const filteredData = normalizedIndices.map(
          (index) => series.data[index] ?? 0
        );
        const filteredLabels = normalizedIndices.map(
          (index) => rollingMonthLabels[index] ?? months[index] ?? `#${index + 1}`
        );
        return {
          dataset: { ...series, data: filteredData },
          labels: filteredLabels,
          indices: normalizedIndices,
        };
      },
      [getSliceIndices, rollingMonthLabels]
    );

    const exchangeSeries = React.useMemo(() => {
      const buckets = buildExchangeMonthlyChartBuckets(allExchangeTransactions);
      const syncFullTotals =
        exchangeTimePeriod === "All" || exchangeTimePeriod === "One Year";
      const reconciled = reconcileExchangeChartBucketsWithSummary(
        buckets.deposits,
        buckets.withdrawals,
        transactionSummary,
        {
          syncFullApprovedTotals: syncFullTotals,
          transactionsLoaded: exchangeTxLoaded,
        }
      );
      const depositSeries: LineChartData = {
        label: "Deposits",
        data: reconciled.deposits,
      };
      const withdrawalSeries: LineChartData = {
        label: "Withdrawals",
        data: reconciled.withdrawals,
      };

      const primary = getFilteredDataset(depositSeries, exchangeTimePeriod);
      const secondary = getFilteredDataset(
        withdrawalSeries,
        exchangeTimePeriod,
        primary.indices
      );
      return {
        deposits: primary.dataset,
        withdrawals: secondary.dataset,
        labels: primary.labels,
      };
    }, [
      allExchangeTransactions,
      exchangeTxLoaded,
      exchangeTimePeriod,
      transactionSummary,
      getFilteredDataset,
    ]);

    const showExchangeDeposits = filter === "All" || filter === "Deposits";
    const showExchangeWithdrawals = filter === "All" || filter === "Withdrawals";

    const p2pFundingSeries = React.useMemo(() => {
      const buckets = buildP2PFundingMonthlyChartBuckets(allP2pTransactions);
      const deposits: LineChartData = { label: "Deposits", data: buckets.deposits };
      const withdrawals: LineChartData = {
        label: "Withdrawals",
        data: buckets.withdrawals,
      };
      const primary = getFilteredDataset(deposits, p2pFundingTimePeriod);
      const secondary = getFilteredDataset(
        withdrawals,
        p2pFundingTimePeriod,
        primary.indices
      );
      return {
        deposits: primary.dataset,
        withdrawals: secondary.dataset,
        labels: primary.labels,
      };
    }, [allP2pTransactions, p2pFundingTimePeriod, getFilteredDataset]);

    const swapSeries = React.useMemo(() => {
      const buckets = buildSwapMonthlyChartBuckets(allSwapTransactions);
      const completed: LineChartData = {
        label: "Completed",
        data: buckets.completed,
      };
      const pending: LineChartData = {
        label: "Pending",
        data: buckets.pending,
      };
      const primary = getFilteredDataset(completed, swapTimePeriod);
      const secondary = getFilteredDataset(
        pending,
        swapTimePeriod,
        primary.indices
      );
      return {
        completed: primary.dataset,
        pending: secondary.dataset,
        labels: primary.labels,
      };
    }, [allSwapTransactions, swapTimePeriod, getFilteredDataset]);

    const moneyxSeries = React.useMemo(() => {
      const buckets = buildMoneyXMonthlyChartBuckets(allMoneyxTransactions);
      const completed: LineChartData = {
        label: "Completed",
        data: buckets.completed,
      };
      const failed: LineChartData = { label: "Failed", data: buckets.failed };
      const primary = getFilteredDataset(completed, moneyxTimePeriod);
      const secondary = getFilteredDataset(
        failed,
        moneyxTimePeriod,
        primary.indices
      );
      return {
        completed: primary.dataset,
        failed: secondary.dataset,
        labels: primary.labels,
      };
    }, [allMoneyxTransactions, moneyxTimePeriod, getFilteredDataset]);

    const p2pSeries = React.useMemo(() => {
      const primary = getFilteredDataset(
        p2pChartData.buyData,
        p2pTimePeriod
      );
      const secondary = getFilteredDataset(
        p2pChartData.sellData,
        p2pTimePeriod,
        primary.indices
      );
      return {
        buys: primary.dataset,
        sells: secondary.dataset,
        labels: primary.labels,
      };
    }, [p2pChartData.buyData, p2pChartData.sellData, p2pTimePeriod, getFilteredDataset]);

    const overviewCenterTotal = React.useMemo(() => {
      if (activeTab === "exchange") {
        return Number(
          (transactionSummary as any)?.total_approved_exchange_volume ?? 0
        );
      }
      return overviewTotalSummary(transactionSummary, activeTab).total;
    }, [activeTab, transactionSummary]);

    useEffect(() => {
      const fetchData = async () => {
        if (user?.referral_code && isAuthenticated) {
          try {
            await Promise.all([
              dispatch(fetchReferralWallet()).catch((error) => {
                return null;
              }),
            ]);
            await Promise.all([dispatch(fetchReferralWallet())]);
          } catch (error) { }
        }
      };
      fetchData();
    }, [user?.referral_code, dispatch, isAuthenticated]);

    return (
      <div className="w-full">
        <HorizontalChartCarousel>
          <OverviewLineChartCard
            title="Exchange Overview (USD)"
            isDeem={isDeem}
            loading={isAuthenticated && !exchangeTxLoaded}
            filters={[
              { id: "All", label: "All" },
              { id: "Deposits", label: "Deposits" },
              { id: "Withdrawals", label: "Withdrawals" },
            ]}
            activeFilter={filter}
            onFilterChange={(id) =>
              setFilter(id as "All" | "Deposits" | "Withdrawals")
            }
            timePeriod={exchangeTimePeriod}
            onTimePeriodChange={setExchangeTimePeriod}
            series1={exchangeSeries.deposits}
            series2={exchangeSeries.withdrawals}
            labels={exchangeSeries.labels}
            showSeries1={showExchangeDeposits}
            showSeries2={showExchangeWithdrawals}
          />
          <OverviewLineChartCard
            title="P2P Overview (USD)"
            isDeem={isDeem}
            filters={[
              { id: "All", label: "All" },
              { id: "Sell Orders", label: "Sell Orders" },
              { id: "Buy Orders", label: "Buy Orders" },
            ]}
            activeFilter={p2pFilter}
            onFilterChange={(id) =>
              setP2pFilter(id as "All" | "Sell Orders" | "Buy Orders")
            }
            timePeriod={p2pTimePeriod}
            onTimePeriodChange={setP2pTimePeriod}
            series1={p2pSeries.buys}
            series2={p2pSeries.sells}
            labels={p2pSeries.labels}
            showSeries1={p2pFilter === "All" || p2pFilter === "Buy Orders"}
            showSeries2={p2pFilter === "All" || p2pFilter === "Sell Orders"}
          />
          <OverviewLineChartCard
            title="P2P Withdrawal/Deposit (USD)"
            isDeem={isDeem}
            filters={[
              { id: "All", label: "All" },
              { id: "Deposits", label: "Deposits" },
              { id: "Withdrawals", label: "Withdrawals" },
            ]}
            activeFilter={p2pFundingFilter}
            onFilterChange={(id) =>
              setP2pFundingFilter(id as "All" | "Deposits" | "Withdrawals")
            }
            timePeriod={p2pFundingTimePeriod}
            onTimePeriodChange={setP2pFundingTimePeriod}
            series1={p2pFundingSeries.deposits}
            series2={p2pFundingSeries.withdrawals}
            labels={p2pFundingSeries.labels}
            showSeries1={
              p2pFundingFilter === "All" || p2pFundingFilter === "Deposits"
            }
            showSeries2={
              p2pFundingFilter === "All" || p2pFundingFilter === "Withdrawals"
            }
          />
          <OverviewLineChartCard
            title="Swap Overview (USD)"
            isDeem={isDeem}
            filters={[
              { id: "All", label: "All" },
              { id: "Completed", label: "Completed" },
              { id: "Pending", label: "Pending" },
            ]}
            activeFilter={swapFilter}
            onFilterChange={(id) =>
              setSwapFilter(id as "All" | "Completed" | "Pending")
            }
            timePeriod={swapTimePeriod}
            onTimePeriodChange={setSwapTimePeriod}
            series1={swapSeries.completed}
            series2={swapSeries.pending}
            labels={swapSeries.labels}
            showSeries1={swapFilter === "All" || swapFilter === "Completed"}
            showSeries2={swapFilter === "All" || swapFilter === "Pending"}
          />
          <OverviewLineChartCard
            title="MoneyX Overview (USD)"
            isDeem={isDeem}
            filters={[
              { id: "All", label: "All" },
              { id: "Completed", label: "Completed" },
              { id: "Failed", label: "Failed" },
            ]}
            activeFilter={moneyxFilter}
            onFilterChange={(id) =>
              setMoneyxFilter(id as "All" | "Completed" | "Failed")
            }
            timePeriod={moneyxTimePeriod}
            onTimePeriodChange={setMoneyxTimePeriod}
            series1={moneyxSeries.completed}
            series2={moneyxSeries.failed}
            labels={moneyxSeries.labels}
            showSeries1={moneyxFilter === "All" || moneyxFilter === "Completed"}
            showSeries2={moneyxFilter === "All" || moneyxFilter === "Failed"}
          />
        </HorizontalChartCarousel>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 w-full">
          <Card className={`w-full rounded-none lg:rounded-2xl bg-gray-50 dark:bg-card shadow-sm flex flex-col ${isDeem ? "border border-[#35353E]" : ""}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 pt-4 pb-3">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold dark:text-white text-gray-900">
                Overview Total
              </h3>

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {["exchange", "p2p", "swap", "moneyx"].map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t as any)}
                    className={`px-2 sm:px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] sm:text-xs whitespace-nowrap
            ${activeTab === t
                        ? "bg-[#1D8751] text-white"
                        : "border border-[#1D8751] sm:border-2 text-[#1D8751]"
                      }
          `}
                  >
                    {t === "moneyx" ? "MONEYX" : t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-col xl:flex-row gap-3 px-4 pb-6 flex-1">
              <div className="xl:w-1/2">
                <Legend
                  data={overviewTotalData(transactionSummary, activeTab)}
                  hideCurrency={
                    activeTab === "p2p" ||
                    activeTab === "swap" ||
                    activeTab === "buy"
                  }
                />
              </div>

              <div className="flex-1 flex justify-center items-end">
                <DonutChartWithCenter
                  data={overviewTotalData(transactionSummary, activeTab)}
                  total={overviewCenterTotal}
                  label={
                    activeTab === "swap"
                      ? "Transactions"
                      : activeTab === "buy"
                        ? "Buy Orders"
                        : "Transactions"
                  }
                  hideCurrency={
                    activeTab === "p2p" ||
                    activeTab === "swap" ||
                    activeTab === "buy"
                  }
                />
              </div>
            </div>
          </Card>

          <Card className={`w-full rounded-none lg:rounded-2xl bg-gray-50 dark:bg-card shadow-sm flex flex-col ${isDeem ? "border border-[#35353E]" : "dark:border dark:border-[#35353E]"}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold dark:text-white text-gray-900">
                Your Referral Commissions
              </h3>

              <Dropdown
                value={referralTimePeriod}
                options={["All", "Last Week", "Month", "One Year"]}
                onChange={setReferralTimePeriod}
              />
            </div>

            {/* Body */}
            <div className="flex flex-col xl:flex-row gap-6 px-4 pb-6 flex-1">
              <div className="xl:w-1/2">
                <Legend
                  data={referralCommissionsData(transactionSummary, walletData || undefined, referralTimePeriod)}
                />
              </div>

              <div className="flex-1 flex justify-center items-end">
                <DonutChartWithCenter
                  data={referralCommissionsData(transactionSummary, walletData || undefined, referralTimePeriod)}
                  total={referralCommissionsSummary(transactionSummary, walletData || undefined, referralTimePeriod).total}
                  label="Commissions"
                />
              </div>
            </div>
          </Card>

        </div>
      </div>
    );
  }
);

LineCharts.displayName = "LineCharts";

export default LineCharts;
