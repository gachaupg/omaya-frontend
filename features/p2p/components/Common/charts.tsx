/* src/components/Common/charts.tsx (or wherever you keep it) */
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

    const monthly: { buyValue: number; sellValue: number }[] = Array(12)
      .fill(0)
      .map(() => ({ buyValue: 0, sellValue: 0 }));

    const now = new Date();

    src.forEach((item: any) => {
      const ts = new Date(item.lastUpdate || item.timestamp);
      if (isNaN(ts.getTime())) return;

      const diff =
        (now.getFullYear() - ts.getFullYear()) * 12 +
        (now.getMonth() - ts.getMonth());

      if (diff < 12) {
        const idx = 11 - diff;
        const amt = parseFloat(item.amount) || 0;
        if ((item.type || item.order_type) === "sell")
          monthly[idx].sellValue += amt;
        else monthly[idx].buyValue += amt;
      }
    });

    setChartData(
      monthly.map((m, i) => ({
        name: months[i],
        buyValue: m.buyValue,
        sellValue: m.sellValue,
      }))
    );
  }, [data, trades]);

  /* ------------------- Tooltip ----------------------------- */
  const CustomTooltip = ({ active, payload, label }: any) =>
    active && payload?.length ? (
      <div
        className={`rounded-lg border p-2
          bg-white border-gray-200 text-gray-800
          dark:bg-[#18181D] dark:border-[${tokens.colors.dark.border}] dark:text-[${tokens.colors.dark.textBody}]`}
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
      <div className="flex justify-between items-center mb-6">
        {/* Title + buy/sell buttons */}
        <div className="flex items-center gap-6">
          <h3 className="text-gray-900 dark:text-white font-medium">
            {title}
          </h3>

          <div className="flex gap-2">
            {(["All", "Sells", "Buys"] as const).map((t) => (
              <Button
                key={t}
                borderRadius={24}
                height={36}
                variant={filter === t ? "primary" : "outline"}
                size="sm"
                onClick={() => setFilter(t)}
                className={`border border-[#1D8751]
                  ${filter === t ? "bg-[#1D8751] text-white" : "text-[#1D8751]"}
                  dark:text-[#1D8751]}]`}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>

        {/* Time-filter dropdown */}
        <div className="relative" ref={dropdownRef}>
          {showTimeFilter ? (
            <>
              <button
                onClick={() => setIsDropdownOpen((o) => !o)}
                className="flex items-center gap-1 px-4 py-1.5 text-sm
                  text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50
                  dark:text-[${tokens.colors.dark.textBody}]
                  dark:border-[${tokens.colors.dark.border}]
                  dark:hover:bg-[${tokens.colors.dark.card}] transition"
              >
                {selectedTimeFilter}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-4 h-4 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
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
                <div
                  className="absolute right-0 mt-1 z-10 min-w-[140px]
                    bg-white border border-gray-200 rounded-lg shadow-lg
                    dark:bg-[${tokens.colors.dark.card}]
                    dark:border-[${tokens.colors.dark.border}]"
                >
                  {timeFilterOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleTimeFilterSelect(opt)}
                      className={`block w-full text-left px-4 py-2 text-sm
                        hover:bg-gray-100 dark:hover:bg-[${
                          tokens.colors.dark.border
                        }]
                        ${
                          selectedTimeFilter === opt
                            ? "text-[#1D8751] dark:bg-[${tokens.colors.dark.border}]"
                            : "text-gray-700 dark:text-[${tokens.colors.dark.textBody}]"
                        } ${
                        opt === timeFilterOptions[0] ? "rounded-t-lg" : ""
                      } ${
                        opt === timeFilterOptions[timeFilterOptions.length - 1]
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
            <button className="flex items-center gap-1 px-4 py-1.5 text-sm text-gray-700 dark:text-[${tokens.colors.dark.textBody}]">
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
      <div
        className={`w-full rounded-2xl p-6 
          bg-white border border-[#E8EFF5] dark:border-[#35353E]
          dark:bg-[#18181D]
          dark:border-[${tokens.colors.dark.border}]`}
      >
        <div className="h-[320px]">
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
                className="text-gray-700 dark:text-[${tokens.colors.dark.textBody}]"
              />
              <YAxis
                className="text-gray-700 dark:text-[${tokens.colors.dark.textBody}]"
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