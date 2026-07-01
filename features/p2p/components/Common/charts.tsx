/* src/components/Common/charts.tsx */
import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import {
  P2PChartTimeFilter,
  buildP2PChartDisplayData,
} from "@/features/p2p/utils/p2pTradeChartAggregation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type TimeFilter = P2PChartTimeFilter;

interface ChartProps {
  title?: string;
  timeFrame?: string;
  data?: any[];
  /** Preloaded trades for the chart (parent fetches once). */
  chartTrades?: unknown[];
  /** When true, show loader instead of empty chart/table flash. */
  chartLoading?: boolean;
  onTimeFilterChange?: (filter: TimeFilter) => void;
  selectedTimeFilter?: TimeFilter;
  showTimeFilter?: boolean;
}

function quantile(sortedAsc: number[], q: number): number {
  if (!sortedAsc.length) return 0;
  const qq = Math.min(1, Math.max(0, q));
  const pos = (sortedAsc.length - 1) * qq;
  const base = Math.floor(pos);
  const rest = pos - base;
  const a = sortedAsc[base] ?? 0;
  const b = sortedAsc[base + 1] ?? a;
  return a + rest * (b - a);
}

function roundUpNice(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  const pow = Math.pow(10, Math.floor(Math.log10(n)));
  const scaled = n / pow;
  const nice = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
  return nice * pow;
}

function getRobustYMax(values: number[]): number {
  const clean = values
    .map((v) => (Number.isFinite(v) ? v : 0))
    .filter((v) => v > 0)
    .sort((a, b) => a - b);

  if (!clean.length) return 0;
  if (clean.length < 8) return clean[clean.length - 1] ?? 0;

  const rawMax = clean[clean.length - 1] ?? 0;
  const p95 = quantile(clean, 0.95);
  // Only cap when a spike is clearly abnormal.
  const capBase = rawMax > p95 * 8 ? p95 : rawMax;
  return roundUpNice(capBase * 1.1);
}

const Charts: React.FC<ChartProps> = ({
  title = "P2P Overview (USD)",
  timeFrame = "Month",
  data,
  chartTrades = [],
  chartLoading = false,
  onTimeFilterChange,
  selectedTimeFilter = "All Time",
  showTimeFilter = true,
}) => {
  const [filter, setFilter] = useState<"All" | "Sells" | "Buys">("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { trades } = useSelector((s: RootState) => s.userTrades);
  const currentUserEmail = useSelector(
    (s: RootState) => s.auth?.user?.email || ""
  );

  const [chartDataRaw, setChartDataRaw] = useState<
    { name: string; buyValue: number; sellValue: number }[]
  >([]);

  /* ------------------- Click-outside for dropdown ----------- */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setIsDropdownOpen(false);
    };
    if (isDropdownOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  /* ------------------- Build chart data -------------------- */
  useEffect(() => {
    if (chartLoading) return;

    const raw =
      chartTrades.length > 0
        ? chartTrades
        : data?.length
          ? data
          : trades?.results || [];

    setChartDataRaw(
      buildP2PChartDisplayData(raw, currentUserEmail, selectedTimeFilter)
    );
  }, [
    chartLoading,
    data,
    trades,
    selectedTimeFilter,
    chartTrades,
    currentUserEmail,
  ]);

  const { chartData, yAxisMax } = React.useMemo(() => {
    const values: number[] = [];
    for (const row of chartDataRaw) {
      if (filter !== "Sells") values.push(row.buyValue);
      if (filter !== "Buys") values.push(row.sellValue);
    }

    const yMax = getRobustYMax(values);
    if (!yMax) return { chartData: chartDataRaw, yAxisMax: 0 };

    const clamped = chartDataRaw.map((row) => ({
      ...row,
      buyValueDisplay: Math.min(row.buyValue, yMax),
      sellValueDisplay: Math.min(row.sellValue, yMax),
    }));

    return { chartData: clamped, yAxisMax: yMax };
  }, [chartDataRaw, filter]);

  /* ------------------- Tooltip ----------------------------- */
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !Array.isArray(payload) || payload.length === 0) return null;

    const datum = payload?.[0]?.payload || {};
    const buyValue = Number(datum.buyValue || 0);
    const sellValue = Number(datum.sellValue || 0);
    const buyWasCapped =
      typeof datum.buyValueDisplay === "number" && datum.buyValueDisplay < buyValue;
    const sellWasCapped =
      typeof datum.sellValueDisplay === "number" && datum.sellValueDisplay < sellValue;

    return (
      <div
        className="rounded-lg border p-2 bg-white border-gray-200 text-gray-800 dark:bg-[#18181D] dark:border-[#35353E] dark:text-white"
      >
        <p className="font-medium">{label}</p>
        {filter !== "Sells" && (
          <p className="text-[#1D8751]">{`Buys: ${buyValue.toLocaleString()} USD${buyWasCapped ? " (capped on chart)" : ""}`}</p>
        )}
        {filter !== "Buys" && (
          <p className="text-[#FF4D4D]">{`Sells: ${sellValue.toLocaleString()} USD${sellWasCapped ? " (capped on chart)" : ""}`}</p>
        )}
      </div>
    );
  };

  /* ------------------- Time filter dropdown ---------------- */
  const timeFilterOptions: TimeFilter[] = [
    "Today",
    "Last Week",
    "Last Month",
    "Last 6 Months",
    "All Time",
  ];
  const handleTimeFilterSelect = (opt: TimeFilter) => {
    onTimeFilterChange?.(opt);
    setIsDropdownOpen(false);
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        {/* Title + buy/sell buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h3 className="text-base font-medium text-gray-900 dark:text-white whitespace-nowrap">
            {title}
          </h3>

          <div className="flex gap-2">
            {(["All", "Sells", "Buys"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors border ${filter === t
                  ? "bg-[#1D8751] text-white border-[#1D8751]"
                  : "bg-transparent text-[#1D8751] dark:text-[#1D8751] border-[#1D8751]"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Time-filter dropdown */}
        <div className="relative" ref={dropdownRef}>
          {showTimeFilter ? (
            <>
              <button
                onClick={() => setIsDropdownOpen((o) => !o)}
                className="flex items-center gap-2 px-4 py-1.5 text-sm text-muted-foreground transition whitespace-nowrap"
              >
                {selectedTimeFilter}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-1 z-10 min-w-[140px] bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-[#1D1D23] dark:border-[#35353E]">
                  {timeFilterOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleTimeFilterSelect(opt)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#35353E] ${selectedTimeFilter === opt
                        ? "text-[#1D8751] bg-gray-50 dark:bg-[#35353E]"
                        : "text-gray-700 dark:text-white"
                        } ${opt === timeFilterOptions[0] ? "rounded-t-lg" : ""
                        } ${opt === timeFilterOptions[timeFilterOptions.length - 1]
                          ? "rounded-b-lg"
                          : ""
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <button className="flex items-center gap-2 px-4 py-1.5 text-sm text-gray-700 dark:text-white whitespace-nowrap">
              {timeFrame}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Chart card */}
      <div className="w-full rounded-2xl p-6 bg-white border border-[#E8EFF5] dark:border-[#35353E] dark:bg-[#18181D]">
        <div className="h-48 sm:h-64 md:h-80">
          {chartLoading ? (
            <div className="flex h-full items-center justify-center text-gray-500 dark:text-[#788099]">
              Loading...
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D8751" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#1D8751" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSell" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4D4D" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FF4D4D" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="8 4"
                stroke="var(--tw-border-opacity)"
                className="stroke-gray-200 dark:stroke-white/10"
                vertical={false}
              />

              <XAxis
                dataKey="name"
                className="text-gray-700 dark:text-white"
              />
              <YAxis
                className="text-gray-700 dark:text-white"
                tickFormatter={(v) => v.toLocaleString()}
                domain={[0, yAxisMax || "auto"]}
              />

              <Tooltip content={<CustomTooltip />} />

              {(filter === "All" || filter === "Buys") && (
                <Area
                  type="monotone"
                  dataKey={yAxisMax ? "buyValueDisplay" : "buyValue"}
                  stroke="#1D8751"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorBuy)"
                />
              )}
              {(filter === "All" || filter === "Sells") && (
                <Area
                  type="monotone"
                  dataKey={yAxisMax ? "sellValueDisplay" : "sellValue"}
                  stroke="#FF4D4D"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSell)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Charts;