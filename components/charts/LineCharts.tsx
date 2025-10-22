"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { loadAllP2PTransactions } from "@/features/p2p/slices/p2pTransactionsSlice";
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
import { RootState } from "@/store";
import { fetchReferralWallet } from "@/features/settings/slices/referralWalletSlice";
import { storage } from "@/features/auth/utils/storage";
import { logger } from "@/lib/utils/logger";

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

function getDynamicYTicks(data: number[], minTicks = 5) {
  const max = Math.max(...data, 0);
  let step = 1000;
  if (max > 0) {
    const roughStep = max / (minTicks - 1);
    // Round step to nearest 1000, 500, 100, etc.
    const pow = Math.pow(10, Math.floor(Math.log10(roughStep)));
    step = Math.ceil(roughStep / pow) * pow;
  }
  const ticks = [];
  for (let i = 0; i < minTicks; i++) {
    ticks.push(step * (minTicks - 1 - i));
  }
  return ticks;
}

const GradientLineChart = React.memo(
  ({
    data1,
    data2,
    color1 = "#1D8751",
    color2 = "#FF4D4D",
    showData1 = true,
    showData2 = true,
  }: {
    data1: LineChartData;
    data2: LineChartData;
    color1?: string;
    color2?: string;
    showData1?: boolean;
    showData2?: boolean;
  }) => {
    // Memoize chart dimensions (constants)
    const chartDimensions = React.useMemo(
      () => ({
        width: "100%",
        height: 240,
        left: 60,
        right: 400,
        top: 40,
        bottom: 200,
      }),
      []
    );

    // Memoize min/max calculations
    const { min, max } = React.useMemo(
      () => ({
        min: 0,
        max: Math.max(...data1.data, ...data2.data, 0),
      }),
      [data1.data, data2.data]
    );

    // Memoize y-axis ticks
    const yTicks = React.useMemo(
      () => getDynamicYTicks([...data1.data, ...data2.data]),
      [data1.data, data2.data]
    );

    // Memoize point calculations
    const points1 = React.useMemo(
      () =>
        data1.data.map((v, i) => ({
          x:
            chartDimensions.left +
            (i / 11) * (chartDimensions.right - chartDimensions.left),
          y:
            chartDimensions.top +
            (chartDimensions.bottom - chartDimensions.top) -
            ((v - min) / (max - min || 1)) *
              (chartDimensions.bottom - chartDimensions.top),
        })),
      [data1.data, min, max, chartDimensions]
    );

    const points2 = React.useMemo(
      () =>
        data2.data.map((v, i) => ({
          x:
            chartDimensions.left +
            (i / 11) * (chartDimensions.right - chartDimensions.left),
          y:
            chartDimensions.top +
            (chartDimensions.bottom - chartDimensions.top) -
            ((v - min) / (max - min || 1)) *
              (chartDimensions.bottom - chartDimensions.top),
        })),
      [data2.data, min, max, chartDimensions]
    );

    // Memoize path generation function
    const generateSmoothPath = React.useCallback(
      (points: { x: number; y: number }[]) => {
        if (points.length < 2) return "";
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
    const areaPoints1 = React.useMemo(
      () =>
        `${chartDimensions.left},${chartDimensions.bottom} ${points1
          .map((p) => `${p.x},${p.y}`)
          .join(" ")} ${chartDimensions.right},${chartDimensions.bottom}`,
      [points1, chartDimensions]
    );

    const areaPoints2 = React.useMemo(
      () =>
        `${chartDimensions.left},${chartDimensions.bottom} ${points2
          .map((p) => `${p.x},${p.y}`)
          .join(" ")} ${chartDimensions.right},${chartDimensions.bottom}`,
      [points2, chartDimensions]
    );

    return (
      <div className="w-full overflow-x-auto">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 440 240"
          preserveAspectRatio="none"
          className="block w-full h-full"
          style={{ display: "block" }}
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
          {yTicks.map((y) => (
            <g key={y}>
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
                x={chartDimensions.left - 10}
                y={
                  chartDimensions.top +
                  (chartDimensions.bottom - chartDimensions.top) -
                  ((y - min) / (max - min || 1)) *
                    (chartDimensions.bottom - chartDimensions.top) +
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
          {months.map((m, i) =>
            i % 2 === 0 ? (
              <text
                key={m}
                x={
                  chartDimensions.left +
                  (i / 11) * (chartDimensions.right - chartDimensions.left)
                }
                y={chartDimensions.bottom + 22}
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
    <svg width="100" height="100" viewBox="0 0 100 100">
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

  // Calculate total from actual data values
  const actualTotal = data.reduce((sum, item) => sum + item.value, 0);

  // Check if all values are 0
  const allZero = actualTotal === 0;

  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
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
        fill="currentColor"
        fontSize="13"
        fontWeight="bold"
        className="dark:fill-white fill-black"
      >
        {allZero ? "00" : `${formatLargeNumber(actualTotal)} USD`}
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
      className="appearance-none bg-transparent text-[#A3A3A3] rounded-full px-5 py-1.5 text-base pr-8 focus:outline-none"
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
            borderRadius: "20%",
          }}
        ></span>
        <span className="dark:text-[#A3A3A3] font-medium flex-1">
          {d.label}
        </span>
        <span className="dark:text-white font-semibold ml-auto min-w-[70px] text-right">
          {d.value.toLocaleString()} USD
        </span>
      </div>
    ))}
  </div>
);

const LineCharts = React.memo(
  ({ transactionSummary }: { transactionSummary: TransactionSummary }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [filter, setFilter] = useState<"All" | "Deposits" | "Withdrawals">(
      "Deposits"
    );
    const [p2pFilter, setP2pFilter] = useState<"All" | "Sells" | "Buys">(
      "Sells"
    );
    const [period, setPeriod] = useState("Month");
    const [selectedTimePeriod, setSelectedTimePeriod] = useState("All");
    const [activeTab, setActiveTab] = useState<"exchange" | "p2p" | "swap">(
      "exchange"
    );
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [chartData, setChartData] = useState<{
      depositData: LineChartData;
      withdrawalData: LineChartData;
    }>({
      depositData: {
        label: "Deposits",
        data: Array(12).fill(0),
      },
      withdrawalData: {
        label: "Withdrawals",
        data: Array(12).fill(0),
      },
    });
    const [p2pChartData, setP2pChartData] = useState<{
      buyData: LineChartData;
      sellData: LineChartData;
    }>({
      buyData: {
        label: "P2P Buys",
        data: Array(12).fill(0),
      },
      sellData: {
        label: "P2P Sells",
        data: Array(12).fill(0),
      },
    });

    // Memoize filter functions to prevent recreation on every render
    const getFilteredChartData = React.useCallback(
      (data: LineChartData) => {
        if (selectedTimePeriod === "All") {
          return data;
        }

        const currentDate = new Date();
        const filteredData = Array(12).fill(0);

        switch (selectedTimePeriod) {
          case "Last Week":
            // Show only the last week data (last 7 days)
            const lastWeekIndex = 11; // Most recent month
            filteredData[lastWeekIndex] = data.data[lastWeekIndex];
            break;
          case "Month":
            // Show only the current month data
            const currentMonthIndex = 11; // Most recent month
            filteredData[currentMonthIndex] = data.data[currentMonthIndex];
            break;
          case "One Year":
            // Show all 12 months data
            return data;
          default:
            return data;
        }

        return {
          ...data,
          data: filteredData,
        };
      },
      [selectedTimePeriod]
    );

    const getFilteredP2PChartData = React.useCallback(
      (data: LineChartData) => {
        if (selectedTimePeriod === "All") {
          return data;
        }

        const currentDate = new Date();
        const filteredData = Array(12).fill(0);

        switch (selectedTimePeriod) {
          case "Last Week":
            // Show only the last week data (last 7 days)
            const lastWeekIndex = 11; // Most recent month
            filteredData[lastWeekIndex] = data.data[lastWeekIndex];
            break;
          case "Month":
            // Show only the current month data
            const currentMonthIndex = 11; // Most recent month
            filteredData[currentMonthIndex] = data.data[currentMonthIndex];
            break;
          case "One Year":
            // Show all 12 months data
            return data;
          default:
            return data;
        }

        return {
          ...data,
          data: filteredData,
        };
      },
      [selectedTimePeriod]
    );

    // Get user email from storage
    useEffect(() => {
      const profile = storage.getProfile();
      const email = profile?.user?.email || "";
      setUserEmail(email);
    }, []);

    const { transactions: p2pTransactions } = useSelector(
      (state: any) => state.p2pTransactions
    );
    const userTrades = useSelector((state: any) => state.userTrades.trades);

    // Fetch all transactions on mount
    useEffect(() => {
      dispatch(loadAllP2PTransactions());
      dispatch(fetchUserTrades({ page: 1, currency: "usdt" }));
    }, [dispatch]);

    // Process exchange transactions for Exchange Overview
    useEffect(() => {
      if (p2pTransactions?.results && userEmail) {
        const depositData = Array(12).fill(0);
        const withdrawalData = Array(12).fill(0);
        const currentDate = new Date();

        // Show all transactions (no filtering by user)
        const allTransactions = p2pTransactions.results;

        allTransactions.forEach((transaction: any) => {
          const transactionDate = new Date(transaction.timestamp);
          const monthDiff =
            (currentDate.getFullYear() - transactionDate.getFullYear()) * 12 +
            (currentDate.getMonth() - transactionDate.getMonth());
          if (monthDiff < 12) {
            const monthIndex = 11 - monthDiff;
            const amount = parseFloat(
              transaction.amount ||
                transaction.requested_amount ||
                transaction.total_amount_due ||
                "0"
            );

            if (transaction.transaction_type === "deposit") {
              depositData[monthIndex] += amount;
            } else if (transaction.transaction_type === "withdrawal") {
              withdrawalData[monthIndex] += amount;
            }
          }
        });

        setChartData({
          depositData: {
            label: "Deposits",
            data: depositData,
          },
          withdrawalData: {
            label: "Withdrawals",
            data: withdrawalData,
          },
        });
      }
    }, [p2pTransactions, userEmail]);

    // Process P2P transactions for P2P Overview
    useEffect(() => {
      if (userTrades?.results) {
        const buyData = Array(12).fill(0);
        const sellData = Array(12).fill(0);
        const currentDate = new Date();

        userTrades.results.forEach((trade: any) => {
          const tradeDate = new Date(trade.timestamp);
          const monthDiff =
            (currentDate.getFullYear() - tradeDate.getFullYear()) * 12 +
            (currentDate.getMonth() - tradeDate.getMonth());
          if (monthDiff < 12) {
            const monthIndex = 11 - monthDiff;
            if (trade.order_type === "buy") {
              buyData[monthIndex] += parseFloat(trade.amount);
            } else if (trade.order_type === "sell") {
              sellData[monthIndex] += parseFloat(trade.amount);
            }
          }
        });

        setP2pChartData({
          buyData: {
            label: "P2P Buys",
            data: buyData,
          },
          sellData: {
            label: "P2P Sells",
            data: sellData,
          },
        });
      }
    }, [userTrades]);

    const {
      data: walletData,
      loading: walletLoading,
      error: walletError,
    } = useSelector((state: RootState) => state.referralWallet);
    const { user, isAuthenticated } = useSelector(
      (state: RootState) => state.auth
    );

    // Only log walletData if it exists and is not null
    if (walletData) {
      logger.debug("dashboard", "Wallet data loaded", { walletData });
    }

    useEffect(() => {
      const fetchData = async () => {
        if (user?.referral_code && isAuthenticated) {
          try {
            await Promise.all([
              dispatch(fetchReferralWallet()).catch((error) => {
                logger.warn(
                  "dashboard",
                  "Referral wallet API not available in LineCharts",
                  { error }
                );
                return null;
              }),
            ]);
            await Promise.all([dispatch(fetchReferralWallet())]);
          } catch (error) {
            logger.error("dashboard", "Error fetching referral data", {
              error,
            });
          }
        }
      };
      fetchData();
    }, [user?.referral_code, dispatch, isAuthenticated]);

    return (
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 w-full">
          {/* Exchange Overview */}
          <Card className="w-full rounded-none lg:rounded-2xl dark:bg-[#1D1D23] bg-white">
            <h3 className="text-black dark:text-white text-[14px] mb-2 font-semibold">
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
                <div className="ml-6">
                  <Dropdown
                    value={selectedTimePeriod}
                    options={["All", "Last Week", "Month", "One Year"]}
                    onChange={setSelectedTimePeriod}
                  />
                </div>
              </div>
            </div>
            <div className="w-full">
              <GradientLineChart
                data1={getFilteredChartData(chartData.depositData)}
                data2={getFilteredChartData(chartData.withdrawalData)}
                showData1={filter === "All" || filter === "Deposits"}
                showData2={filter === "All" || filter === "Withdrawals"}
              />
            </div>
          </Card>
          {/* P2P Overview */}
          <Card className="w-full rounded-none lg:rounded-2xl dark:bg-[#1D1D23] bg-white">
            <h3 className="dark:text-wh text-[#051015] dark:text-white text-[14px] mb-2 font-semibold">
              P2P Overview (USD)
            </h3>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant={p2pFilter === "All" ? "primary" : "outline"}
                  onClick={() => setP2pFilter("All")}
                  className="whitespace-nowrap rounded-3xl"
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={p2pFilter === "Sells" ? "primary" : "outline"}
                  onClick={() => setP2pFilter("Sells")}
                  className="whitespace-nowrap rounded-3xl"
                >
                  Sells
                </Button>
                <Button
                  size="sm"
                  variant={p2pFilter === "Buys" ? "primary" : "outline"}
                  onClick={() => setP2pFilter("Buys")}
                  className="whitespace-nowrap rounded-3xl"
                >
                  Buys
                </Button>
                <div className="ml-6">
                  <Dropdown
                    value={selectedTimePeriod}
                    options={["All", "Last Week", "Month", "One Year"]}
                    onChange={setSelectedTimePeriod}
                  />
                </div>
              </div>
            </div>
            <div className="w-full">
              <GradientLineChart
                data1={getFilteredP2PChartData(p2pChartData.buyData)}
                data2={getFilteredP2PChartData(p2pChartData.sellData)}
                showData1={p2pFilter === "All" || p2pFilter === "Buys"}
                showData2={p2pFilter === "All" || p2pFilter === "Sells"}
              />
            </div>
          </Card>
          {/* Overview Total */}
          <Card className="w-full rounded-none lg:rounded-2xl flex flex-col lg:flex-row items-center h-full relative dark:bg-[#1D1D23] bg-white">
            <div className="absolute left-0 top-0 px-2 pt-2 flex flex-wrap w-full justify-between items-center gap-2">
              <h3 className="dark:text-white text-[18px] font-semibold">
                Overview Total
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`${
                    activeTab === "exchange"
                      ? "bg-[#1D8751] text-white"
                      : "bg-transparent border border-[#1D8751] text-[#1D8751]"
                  } px-3 py-1 rounded-full text-[13px] font-semibold whitespace-nowrap`}
                  onClick={() => setActiveTab("exchange")}
                >
                  Exchange
                </button>
                <button
                  className={`${
                    activeTab === "p2p"
                      ? "bg-[#1D8751] text-white"
                      : "bg-transparent border border-[#1D8751] text-[#1D8751]"
                  } px-3 py-1 rounded-full text-[13px] font-semibold whitespace-nowrap`}
                  onClick={() => setActiveTab("p2p")}
                >
                  P2P
                </button>
                <button
                  className={`${
                    activeTab === "swap"
                      ? "bg-[#1D8751] text-white"
                      : "bg-transparent border border-[#1D8751] text-[#1D8751]"
                  } px-3 py-1 rounded-full text-[13px] font-semibold whitespace-nowrap`}
                  onClick={() => setActiveTab("swap")}
                >
                  Swap
                </button>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row w-full pt-10">
              <Legend data={overviewTotalData(transactionSummary, activeTab)} />
              <div className="flex-1 flex flex-col items-center justify-center mt-4 lg:mt-0">
                <DonutChartWithCenter
                  data={overviewTotalData(transactionSummary, activeTab)}
                  total={
                    overviewTotalSummary(transactionSummary, activeTab).total
                  }
                  label={activeTab === "swap" ? "Swaps" : "Transactions"}
                />
              </div>
            </div>
          </Card>
          {/* Referral Commissions */}
          <Card className="w-full rounded-none lg:rounded-2xl flex flex-col lg:flex-row items-center h-full relative dark:bg-[#1D1D23] bg-white">
            <div className="absolute left-0 top-0 px-2 pt-2 flex flex-wrap w-full justify-between items-center gap-2">
              <h3 className="dark:text-white text-[14px] mb-2 font-semibold">
                Your Referral Commissions
              </h3>
              <Dropdown
                value={selectedTimePeriod}
                options={["All", "Last Week", "Month", "One Year"]}
                onChange={setSelectedTimePeriod}
              />
            </div>
            <div className="flex flex-col lg:flex-row w-full pt-10">
              <Legend
                data={referralCommissionsData(
                  transactionSummary,
                  walletData || undefined
                )}
              />
              <div className="flex-1 flex flex-col items-center justify-center mt-4 lg:mt-0">
                <DonutChartWithCenter
                  data={referralCommissionsData(
                    transactionSummary,
                    walletData || undefined
                  )}
                  total={
                    referralCommissionsSummary(
                      transactionSummary,
                      walletData || undefined
                    ).total
                  }
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
