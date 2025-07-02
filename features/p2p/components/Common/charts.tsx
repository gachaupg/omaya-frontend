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

type TimeFilter =
  | "Today"
  | "Last Week"
  | "Last Month"
  | "Last 6 Months"
  | "All Time";

type ChartProps = {
  title?: string;
  timeFrame?: string;
  data?: any[];
  onTimeFilterChange?: (filter: TimeFilter) => void;
  selectedTimeFilter?: TimeFilter;
  showTimeFilter?: boolean;
};

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

const Charts: React.FC<ChartProps> = ({
  title = "P2P Overview (USD)",
  timeFrame = "Month",
  data,
  onTimeFilterChange,
  selectedTimeFilter = "Last Month",
  showTimeFilter = true,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [filter, setFilter] = useState<"All" | "Sells" | "Buys">("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { trades } = useSelector((state: RootState) => state.userTrades);
  const [chartData, setChartData] = useState<
    Array<{ name: string; buyValue: number; sellValue: number }>
  >([]);

  useEffect(() => {
    dispatch(fetchUserTrades({ page: 1, currency: "usdt" }));
  }, [dispatch]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (data && data.length > 0) {
      // Use the filtered data passed from P2PCharts
      const monthlyData = Array(12)
        .fill(0)
        .map(() => ({ buyValue: 0, sellValue: 0 }));
      const currentDate = new Date();

      data.forEach((item: any) => {
        if (!item.lastUpdate) return;

        const itemDate = new Date(item.lastUpdate);
        const monthDiff =
          (currentDate.getFullYear() - itemDate.getFullYear()) * 12 +
          (currentDate.getMonth() - itemDate.getMonth());

        if (monthDiff < 12) {
          const monthIndex = 11 - monthDiff;
          if (item.type === "sell") {
            monthlyData[monthIndex].sellValue += parseFloat(item.amount) || 0;
          } else if (item.type === "buy") {
            monthlyData[monthIndex].buyValue += parseFloat(item.amount) || 0;
          }
        }
      });

      const formattedData = monthlyData.map((data, index) => ({
        name: months[index],
        buyValue: data.buyValue,
        sellValue: data.sellValue,
      }));

      setChartData(formattedData);
    } else if (trades?.results) {
      // Fallback to trades data if no filtered data is provided
      const monthlyData = Array(12)
        .fill(0)
        .map(() => ({ buyValue: 0, sellValue: 0 }));
      const currentDate = new Date();

      trades.results.forEach((trade: any) => {
        const tradeDate = new Date(trade.timestamp);
        const monthDiff =
          (currentDate.getFullYear() - tradeDate.getFullYear()) * 12 +
          (currentDate.getMonth() - tradeDate.getMonth());

        if (monthDiff < 12) {
          const monthIndex = 11 - monthDiff;
          if (trade.order_type === "sell") {
            monthlyData[monthIndex].sellValue += parseFloat(trade.amount);
          } else if (trade.order_type === "buy") {
            monthlyData[monthIndex].buyValue += parseFloat(trade.amount);
          }
        }
      });

      const formattedData = monthlyData.map((data, index) => ({
        name: months[index],
        buyValue: data.buyValue,
        sellValue: data.sellValue,
      }));

      setChartData(formattedData);
    } else {
      // If no data available, set empty chart
      setChartData([]);
    }
  }, [data, trades]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`bg-[${tokens.colors.dark.card}] p-2 border border-[${tokens.colors.dark.border}] rounded-lg`}
        >
          <p className={`text-[${tokens.colors.dark.textBody}]`}>
            {`${label}:`}
          </p>
          {filter === "All" && (
            <>
              <p className={`text-[#1D8751]`}>
                {`Buys: ${payload[0].value.toLocaleString()} USD`}
              </p>
              <p className={`text-[#FF4D4D]`}>
                {`Sells: ${payload[1].value.toLocaleString()} USD`}
              </p>
            </>
          )}
          {filter === "Buys" && (
            <p className={`text-[#1D8751]`}>
              {`Buys: ${payload[0].value.toLocaleString()} USD`}
            </p>
          )}
          {filter === "Sells" && (
            <p className={`text-[#FF4D4D]`}>
              {`Sells: ${payload[0].value.toLocaleString()} USD`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const timeFilterOptions: TimeFilter[] = [
    "Today",
    "Last Week",
    "Last Month",
    "Last 6 Months",
    "All Time",
  ];

  const handleTimeFilterSelect = (filter: TimeFilter) => {
    onTimeFilterChange?.(filter);
    setIsDropdownOpen(false);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-6">
          <h3 className={`text-[${tokens.colors.dark.textTitle}] font-medium`}>
            {title}
          </h3>

          <div className="flex gap-2">
            <Button
              borderRadius={24}
              height={36}
              variant={filter === "All" ? "primary" : "outline"}
              size="sm"
              className={`border text-[#1D8751] border-[#1D8751] text-[${tokens.colors.dark.textBody}]`}
              onClick={() => setFilter("All")}
            >
              All
            </Button>
            <Button
              borderRadius={24}
              variant={filter === "Sells" ? "primary" : "outline"}
              size="sm"
              className={`border text-[#1D8751] border-[#1D8751] text-[${tokens.colors.dark.textBody}]`}
              onClick={() => setFilter("Sells")}
            >
              Sells
            </Button>
            <Button
              borderRadius={24}
              height={36}
              variant={filter === "Buys" ? "primary" : "outline"}
              size="sm"
              className={`border text-[#1D8751] border-[#1D8751] text-[${tokens.colors.dark.textBody}]`}
              onClick={() => setFilter("Buys")}
            >
              Buys
            </Button>
          </div>
        </div>

        <div className="relative">
          {showTimeFilter ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-1 px-4 py-1.5 text-[${tokens.colors.dark.textBody}] text-sm border border-[${tokens.colors.dark.border}] rounded-lg hover:bg-[${tokens.colors.dark.card}] transition-colors`}
              >
                {selectedTimeFilter}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-[${
                    tokens.colors.dark.textBody
                  }] transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div
                  className={`absolute right-0 top-full mt-1 bg-[${tokens.colors.dark.card}] border border-[${tokens.colors.dark.border}] rounded-lg shadow-lg z-10 min-w-[140px]`}
                >
                  {timeFilterOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleTimeFilterSelect(option)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[${
                        tokens.colors.dark.border
                      }] transition-colors ${
                        selectedTimeFilter === option
                          ? `text-[#1D8751] bg-[${tokens.colors.dark.border}]`
                          : `text-[${tokens.colors.dark.textBody}]`
                      } ${
                        option === timeFilterOptions[0] ? "rounded-t-lg" : ""
                      } ${
                        option ===
                        timeFilterOptions[timeFilterOptions.length - 1]
                          ? "rounded-b-lg"
                          : ""
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              className={`flex items-center gap-1 px-4 py-1.5 text-[${tokens.colors.dark.textBody}] text-sm`}
            >
              {timeFrame}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-[${tokens.colors.dark.textBody}]`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div
        className={`w-full rounded-2xl bg-[${tokens.colors.dark.card}] border-2 border-[${tokens.colors.dark.border}] p-6`}
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
                strokeDasharray="3 3"
                stroke={tokens.colors.dark.border}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke={tokens.colors.dark.textBody}
                tick={{ fill: tokens.colors.dark.textBody }}
              />
              <YAxis
                stroke={tokens.colors.dark.textBody}
                tick={{ fill: tokens.colors.dark.textBody }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              {(filter === "All" || filter === "Buys") && (
                <Area
                  type="monotone"
                  dataKey="buyValue"
                  stroke="#1D8751"
                  fillOpacity={1}
                  fill="url(#colorBuy)"
                  strokeWidth={3}
                />
              )}
              {(filter === "All" || filter === "Sells") && (
                <Area
                  type="monotone"
                  dataKey="sellValue"
                  stroke="#FF4D4D"
                  fillOpacity={1}
                  fill="url(#colorSell)"
                  strokeWidth={3}
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
