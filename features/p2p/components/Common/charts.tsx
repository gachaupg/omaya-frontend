/* src/components/Common/charts.tsx */
import React, { useEffect, useState, useRef } from "react";
import { tokens } from "@/styles/tokens";
import Button from "./Button";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { fetchUserTrades } from "@/features/p2p/slices/userTradesSlice";
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
  const dispatch = useDispatch<AppDispatch>();

  const [filter, setFilter] = useState<"All" | "Sells" | "Buys">("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { trades } = useSelector((s: RootState) => s.userTrades);

  const [chartData, setChartData] = useState<
    { name: string; buyValue: number; sellValue: number }[]
  >([]);

  /* ------------------- Fetch trades once ------------------- */
  useEffect(() => {
    dispatch(fetchUserTrades({ page: 1, currency: "usdt" }));
  }, [dispatch]);

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
    const src = data?.length ? data : trades?.results || [];
    if (!src.length) {
      setChartData([]);
      return;
    }

    const now = new Date();
    // Helper to zero-pad
    const pad = (n: number) => n.toString().padStart(2, "0");

    let newData: { name: string; buyValue: number; sellValue: number }[] = [];

    if (selectedTimeFilter === "Today") {
      // 0-23 hours of the current day? Or last 24h?
      // Based on usual UX, "Today" often means since 00:00.
      // But let's check if there's any data from yesterday.
      // If we use fixed 00:00-23:00 buckets:
      for (let i = 0; i < 24; i++) {
        const key = `${pad(i)}:00`;
        newData.push({ name: key, buyValue: 0, sellValue: 0 });
      }

      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      src.forEach((item: any) => {
        const ts = new Date(item.lastUpdate || item.timestamp);
        if (ts.getTime() >= startOfDay) {
          const h = ts.getHours();
          if (h >= 0 && h < 24) {
            const amt = parseFloat(item.amount) || 0;
            if ((item.type || item.order_type) === "sell") newData[h].sellValue += amt;
            else newData[h].buyValue += amt;
          }
        }
      });
      // Just slice to current hour + 1 to avoid empty future?
      // Typically "Today" shows full day or up to now. Let's show full day x-axis.

    } else if (selectedTimeFilter === "Last Week") {
      // Last 7 Days (including today)
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        // name: "Mon" or "Mon 12"? Let's use "Day DD"
        // Or just Day name if distinct? "Mon", "Tue"...
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dayName = days[d.getDay()];
        newData.push({ name: dayName, buyValue: 0, sellValue: 0 });
      }

      src.forEach((item: any) => {
        const ts = new Date(item.lastUpdate || item.timestamp);
        const diffDays = Math.floor((now.getTime() - ts.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          const idx = 6 - diffDays;
          if (newData[idx]) {
            const amt = parseFloat(item.amount) || 0;
            if ((item.type || item.order_type) === "sell") newData[idx].sellValue += amt;
            else newData[idx].buyValue += amt;
          }
        }
      });

    } else if (selectedTimeFilter === "Last Month") {
      // Last 30 Days
      // Show every day? Or maybe simplify?
      // Let's bucket by day, 30 buckets.
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = `${d.getDate()} ${months[d.getMonth()]}`;
        newData.push({ name: key, buyValue: 0, sellValue: 0 });
      }

      src.forEach((item: any) => {
        const ts = new Date(item.lastUpdate || item.timestamp);
        const diffDays = Math.floor((now.getTime() - ts.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 30) {
          const idx = 29 - diffDays;
          if (newData[idx]) {
            const amt = parseFloat(item.amount) || 0;
            if ((item.type || item.order_type) === "sell") newData[idx].sellValue += amt;
            else newData[idx].buyValue += amt;
          }
        }
      });

    } else if (selectedTimeFilter === "Last 6 Months") {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        newData.push({ name: months[d.getMonth()], buyValue: 0, sellValue: 0 });
      }
      src.forEach((item: any) => {
        const ts = new Date(item.lastUpdate || item.timestamp);
        const diffMonths = (now.getFullYear() - ts.getFullYear()) * 12 + (now.getMonth() - ts.getMonth());
        if (diffMonths >= 0 && diffMonths < 6) {
          const idx = 5 - diffMonths;
          if (newData[idx]) {
            const amt = parseFloat(item.amount) || 0;
            if ((item.type || item.order_type) === "sell") newData[idx].sellValue += amt;
            else newData[idx].buyValue += amt;
          }
        }
      });

    } else {
      // All Time - Default to 12 Months trailing
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        newData.push({ name: months[d.getMonth()], buyValue: 0, sellValue: 0 });
      }
      src.forEach((item: any) => {
        const ts = new Date(item.lastUpdate || item.timestamp);
        const diffMonths = (now.getFullYear() - ts.getFullYear()) * 12 + (now.getMonth() - ts.getMonth());
        if (diffMonths >= 0 && diffMonths < 12) {
          const idx = 11 - diffMonths;
          if (newData[idx]) {
            const amt = parseFloat(item.amount) || 0;
            if ((item.type || item.order_type) === "sell") newData[idx].sellValue += amt;
            else newData[idx].buyValue += amt;
          }
        }
      });
    }

    setChartData(newData);
  }, [data, trades, selectedTimeFilter]);

  /* ------------------- Tooltip ----------------------------- */
  const CustomTooltip = ({ active, payload, label }: any) =>
    active && payload?.length ? (
      <div
        className="rounded-lg border p-2 bg-white border-gray-200 text-gray-800 dark:bg-[#18181D] dark:border-[#35353E] dark:text-white"
      >
        <p className="font-medium">{label}</p>
        {filter !== "Sells" && (
          <p className="text-[#1D8751]">{`Buys: ${payload[0].value.toLocaleString()} USD`}</p>
        )}
        {filter !== "Buys" && (
          <p className="text-[#FF4D4D]">
            {`${filter === "All" ? "Sells" : "Sells"}: ${payload[
              filter === "All" ? 1 : 0
            ].value.toLocaleString()} USD`}
          </p>
        )}
      </div>
    ) : null;

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
              />

              <Tooltip content={<CustomTooltip />} />

              {(filter === "All" || filter === "Buys") && (
                <Area
                  type="monotone"
                  dataKey="buyValue"
                  stroke="#1D8751"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorBuy)"
                />
              )}
              {(filter === "All" || filter === "Sells") && (
                <Area
                  type="monotone"
                  dataKey="sellValue"
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