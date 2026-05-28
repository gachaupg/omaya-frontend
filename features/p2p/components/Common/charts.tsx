/* src/components/Common/charts.tsx */
import React, { useEffect, useState, useRef } from "react";
import { tokens } from "@/styles/tokens";
import Button from "./Button";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { getUserTrades } from "@/features/p2p/api";
import { normalizeP2PTradeStatus } from "@/features/p2p/utils/normalizeP2PTradeStatus";
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
type TimeFilter =
  | "Today"
  | "Last Week"
  | "Last Month"
  | "Last 6 Months"
  | "All Time";

interface ChartProps {
  title?: string;
  timeFrame?: string;
  data?: any[];
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

const normalizeRangeCurrency = (value: unknown): "USD" | "KES" => {
  const upper = String(value || "").trim().toUpperCase();
  return upper === "KES" ? "KES" : "USD";
};

const transformTradeForChart = (
  item: any,
  currentUserEmail?: string
): {
  amount: number;
  type: "buy" | "sell";
  timestamp: string;
  rangeCurrency: "USD" | "KES";
} | null => {
  const timestamp = String(item?.lastUpdate || item?.timestamp || item?.date || "");
  const ts = new Date(timestamp);
  if (isNaN(ts.getTime())) return null;

  const rawOrderType = String(item?.type || item?.order_type || "")
    .trim()
    .toLowerCase();
  if (rawOrderType !== "buy" && rawOrderType !== "sell") {
    return null;
  }

  const ownerEmail = String(item?.owner || "").trim().toLowerCase();
  const userEmail = String(currentUserEmail || "").trim().toLowerCase();
  const isOwner = Boolean(userEmail && ownerEmail && ownerEmail === userEmail);

  const displayType = item?.type
    ? rawOrderType
    : isOwner
      ? rawOrderType
      : rawOrderType === "buy"
        ? "sell"
        : "buy";

  const parsedAmount = Number.parseFloat(
    String(item?.amount ?? item?.net_amount ?? 0)
  );
  const amount = Number.isFinite(parsedAmount) ? parsedAmount : 0;
  const rangeCurrency = normalizeRangeCurrency(item?.range_currency);
  const normalizedStatus = normalizeP2PTradeStatus(item?.status);
  if (!normalizedStatus) return null;

  return {
    amount,
    type: displayType as "buy" | "sell",
    timestamp,
    rangeCurrency,
  };
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
const Charts: React.FC<ChartProps> = ({
  title = "P2P Overview (USD)",
  timeFrame = "Month",
  data,
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
  /** All pages for the graph (no currency filter on API). */
  const [chartTrades, setChartTrades] = useState<any[]>([]);

  /* ------------------- Load all user-trades pages for chart ------------------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all: any[] = [];
      try {
        for (let page = 1; page <= 100; page++) {
          const response = await getUserTrades(`?page=${page}`);
          const results = response?.results || [];
          if (results.length === 0) break;
          all.push(...results);
          if (!response?.next) break;
        }
      } catch {
        /* keep partial/all empty */
      }
      if (!cancelled) setChartTrades(all);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    const raw =
      chartTrades.length > 0
        ? chartTrades
        : data?.length
          ? data
          : trades?.results || [];
    // Include any trade with a valid timestamp (API may use canceled/cancelled/pending/etc.;
    // filtering to "completed" only hid all rows when every trade was canceled.)
    const src = raw
      .map((item: any) => transformTradeForChart(item, currentUserEmail))
      .filter(
        (
          item
        ): item is {
          amount: number;
          type: "buy" | "sell";
          timestamp: string;
          rangeCurrency: "USD" | "KES";
        } => Boolean(item)
      );
    if (!src.length) {
      setChartDataRaw([]);
      return;
    }

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");

    let newData: { name: string; buyValue: number; sellValue: number }[] = [];

    const addToSlot = (idx: number, amt: number, rawType: string) => {
      const t = String(rawType).toLowerCase();
      if (newData[idx]) {
        if (t === "buy") newData[idx].buyValue += amt;
        else if (t === "sell") newData[idx].sellValue += amt;
      }
    };

    if (selectedTimeFilter === "Today") {
      for (let i = 0; i < 24; i++) {
        newData.push({ name: `${pad(i)}:00`, buyValue: 0, sellValue: 0 });
      }
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      src.forEach((item: any) => {
        const ts = new Date(item.timestamp);
        if (isNaN(ts.getTime())) return;
        if (ts.getTime() < todayStart) return;
        const hour = ts.getHours();
        addToSlot(hour, item.amount, item.type);
      });
    } else if (selectedTimeFilter === "Last Week") {
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        newData.push({ name: months[d.getMonth()].slice(0, 3) + " " + d.getDate(), buyValue: 0, sellValue: 0 });
      }
      src.forEach((item: any) => {
        const ts = new Date(item.timestamp);
        if (isNaN(ts.getTime())) return;
        const diffDays = Math.floor((now.getTime() - ts.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          const idx = 6 - diffDays;
          addToSlot(idx, item.amount, item.type);
        }
      });
    } else if (selectedTimeFilter === "Last Month" || selectedTimeFilter === "Last 6 Months" || selectedTimeFilter === "All Time") {
      const slots = selectedTimeFilter === "Last Month" ? 4 : selectedTimeFilter === "Last 6 Months" ? 6 : 12;
      for (let i = 0; i < slots; i++) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - (slots - 1 - i), 1);
        const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        const monthName = months[monthDate.getMonth()];
        const isCurrentMonth =
          monthDate.getFullYear() === now.getFullYear() &&
          monthDate.getMonth() === now.getMonth();
        // Do not project the current month to month-end; cap at today's date.
        const day = isCurrentMonth ? now.getDate() : lastDay.getDate();
        const isDifferentYear = monthDate.getFullYear() !== now.getFullYear();
        const label = isDifferentYear
          ? `${monthName} ${day}, '${String(monthDate.getFullYear()).slice(-2)}`
          : `${monthName} ${day}`;
        newData.push({ name: label, buyValue: 0, sellValue: 0 });
      }
      src.forEach((item: any) => {
        const ts = new Date(item.timestamp);
        if (isNaN(ts.getTime())) return;
        const diffMonths = (now.getFullYear() - ts.getFullYear()) * 12 + (now.getMonth() - ts.getMonth());
        if (diffMonths >= 0 && diffMonths < slots) {
          const idx = slots - 1 - diffMonths;
          addToSlot(idx, item.amount, item.type);
        }
      });
    }

    setChartDataRaw(newData);
  }, [data, trades, selectedTimeFilter, chartTrades, currentUserEmail]);

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
        </div>
      </div>
    </div>
  );
};

export default Charts;