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
    const raw = data?.length ? data : trades?.results || [];
    // Graph only completed trades; exclude cancelled, pending, etc.
    const src = raw.filter((item: any) => {
      const s = String(item?.status ?? "").toLowerCase().trim();
      return s === "completed";
    });
    if (!src.length) {
      setChartData([]);
      return;
    }

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");

    let newData: { name: string; buyValue: number; sellValue: number }[] = [];

    // Add amount to the correct slot based on type
    const addToSlot = (idx: number, amt: number, rawType: string) => {
      if (newData[idx]) {
        if (rawType === "buy") newData[idx].buyValue += amt;
        else newData[idx].sellValue += amt;
      }
    };

    if (selectedTimeFilter === "Today") {
      for (let i = 0; i < 24; i++) {
        newData.push({ name: `${pad(i)}:00`, buyValue: 0, sellValue: 0 });
      }
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      src.forEach((item: any) => {
        const ts = new Date(item.lastUpdate || item.timestamp || item.date);
        if (isNaN(ts.getTime())) return;
        if (ts.getTime() < todayStart) return;
        const hour = ts.getHours();
        const amt = parseFloat(item.amount) || 0;
        const rawType = item.type || item.order_type || "";
        addToSlot(hour, amt, rawType);
      });
    } else if (selectedTimeFilter === "Last Week") {
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        newData.push({ name: months[d.getMonth()].slice(0, 3) + " " + d.getDate(), buyValue: 0, sellValue: 0 });
      }
      src.forEach((item: any) => {
        const ts = new Date(item.lastUpdate || item.timestamp || item.date);
        if (isNaN(ts.getTime())) return;
        const diffDays = Math.floor((now.getTime() - ts.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          const idx = 6 - diffDays;
          const amt = parseFloat(item.amount) || 0;
          const rawType = item.type || item.order_type || "";
          addToSlot(idx, amt, rawType);
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
        const ts = new Date(item.lastUpdate || item.timestamp || item.date);
        if (isNaN(ts.getTime())) return;
        const diffMonths = (now.getFullYear() - ts.getFullYear()) * 12 + (now.getMonth() - ts.getMonth());
        if (diffMonths >= 0 && diffMonths < slots) {
          const idx = slots - 1 - diffMonths;
          const amt = parseFloat(item.amount) || 0;
          const rawType = item.type || item.order_type || "";
          addToSlot(idx, amt, rawType);
        }
      });
    }

    setChartData(newData);
  }, [data, trades, selectedTimeFilter]);

  /* ------------------- Tooltip ----------------------------- */
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !Array.isArray(payload) || payload.length === 0) return null;

    const buyPoint = payload.find((p: any) => p?.dataKey === "buyValue");
    const sellPoint = payload.find((p: any) => p?.dataKey === "sellValue");

    const buyValue =
      typeof buyPoint?.value === "number"
        ? buyPoint.value
        : Number(buyPoint?.value || 0);
    const sellValue =
      typeof sellPoint?.value === "number"
        ? sellPoint.value
        : Number(sellPoint?.value || 0);

    return (
      <div
        className="rounded-lg border p-2 bg-white border-gray-200 text-gray-800 dark:bg-[#18181D] dark:border-[#35353E] dark:text-white"
      >
        <p className="font-medium">{label}</p>
        {filter !== "Sells" && (
          <p className="text-[#1D8751]">{`Buys: ${buyValue.toLocaleString()} USD`}</p>
        )}
        {filter !== "Buys" && (
          <p className="text-[#FF4D4D]">{`Sells: ${sellValue.toLocaleString()} USD`}</p>
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