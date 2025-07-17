"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import {
  fetchP2PTransactions,
  setCurrentPage,
} from "@/features/p2p/slices/p2pTransactionsSlice";
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
import { TransactionSummary } from "../types";
import { fetchUserTrades } from "@/features/p2p/slices/userTradesSlice";
import { line, curveMonotoneX } from "d3-shape";
import { RootState } from "@/store";
import { fetchReferralWallet } from "@/features/settings/slices/referralWalletSlice";
import { fetchTransactions } from "@/features/exchange/slices/exchangeSlice";
import { storage } from "@/features/auth/utils/storage";

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

function GradientLineChart({
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
}) {
  const max = Math.max(...data1.data, ...data2.data, 0);
  const min = 0;
  const chartWidth = "100%";
  const chartHeight = 240;
  const chartLeft = 40;
  const chartRight = 360;
  const chartTop = 40;
  const chartBottom = 200;
  const yTicks = getDynamicYTicks([...data1.data, ...data2.data]);

  const points1 = data1.data.map((v, i) => ({
    x: chartLeft + (i / 11) * (chartRight - chartLeft),
    y:
      chartTop +
      (chartBottom - chartTop) -
      ((v - min) / (max - min || 1)) * (chartBottom - chartTop),
  }));

  const points2 = data2.data.map((v, i) => ({
    x: chartLeft + (i / 11) * (chartRight - chartLeft),
    y:
      chartTop +
      (chartBottom - chartTop) -
      ((v - min) / (max - min || 1)) * (chartBottom - chartTop),
  }));

  const generateSmoothPath = (points: { x: number; y: number }[]) => {
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
  };

  const linePath1 = generateSmoothPath(points1);
  const linePath2 = generateSmoothPath(points2);
  const areaPoints1 = `${chartLeft},${chartBottom} ${points1
    .map((p) => `${p.x},${p.y}`)
    .join(" ")} ${chartRight},${chartBottom}`;
  const areaPoints2 = `${chartLeft},${chartBottom} ${points2
    .map((p) => `${p.x},${p.y}`)
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
              x1={chartLeft}
              x2={chartRight}
              y1={
                chartTop +
                (chartBottom - chartTop) -
                ((y - min) / (max - min || 1)) * (chartBottom - chartTop)
              }
              y2={
                chartTop +
                (chartBottom - chartTop) -
                ((y - min) / (max - min || 1)) * (chartBottom - chartTop)
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
                ((y - min) / (max - min || 1)) * (chartBottom - chartTop) +
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
        fill="#fff"
        fontSize="13"
        fontWeight="bold"
      >
        {allZero ? "00" : `${(actualTotal || 0).toLocaleString()} USD`}
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

const LineCharts = ({
  transactionSummary,
}: {
  transactionSummary: TransactionSummary;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [filter, setFilter] = useState<"All" | "Deposits" | "Withdrawals">(
    "Deposits"
  );
  const [p2pFilter, setP2pFilter] = useState<"All" | "Sells" | "Buys">("Sells");
  const [period, setPeriod] = useState("Month");
  const [activeTab, setActiveTab] = useState<
    "exchange" | "p2p" | "buy" | "swap"
  >("exchange");
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

  // Get user email from storage
  useEffect(() => {
    const profile = storage.getProfile();
    const email = profile?.user?.email || "";
    console.log("=== USER PROFILE CHART ===", { profile, email });
    setUserEmail(email);
  }, []);

  const { transactions: p2pTransactions } = useSelector(
    (state: any) => state.p2pTransactions
  );
  const { transactions: exchangeTransactions } = useSelector(
    (state: RootState) => state.exchange
  );
  const userTrades = useSelector((state: any) => state.userTrades.trades);

  // Fetch exchange transactions when userEmail is set
  useEffect(() => {
    if (userEmail) {
      console.log("=== FETCHING EXCHANGE TRANSACTIONS CHART ===", {
        userEmail,
      });
      dispatch(fetchTransactions());
    }
  }, [dispatch, userEmail]);

  useEffect(() => {
    dispatch(fetchP2PTransactions(1));
    dispatch(fetchUserTrades({ page: 1, currency: "usdt" }));
  }, [dispatch]);

  // Process exchange transactions for Exchange Overview
  useEffect(() => {
    if (exchangeTransactions && userEmail) {
      const depositData = Array(12).fill(0);
      const withdrawalData = Array(12).fill(0);
      const currentDate = new Date();

      console.log("exchange transactions", exchangeTransactions);

      // Filter transactions for the current user
      const userTransactions = exchangeTransactions.filter(
        (transaction: any) => transaction.user_email === userEmail
      );

      console.log("Filtered exchange transactions for chart:", {
        totalTransactions: exchangeTransactions.length,
        userTransactions: userTransactions.length,
        userEmail,
      });

      userTransactions.forEach((transaction: any) => {
        const transactionDate = new Date(transaction.timestamp);
        const monthDiff =
          (currentDate.getFullYear() - transactionDate.getFullYear()) * 12 +
          (currentDate.getMonth() - transactionDate.getMonth());
        if (monthDiff < 12) {
          const monthIndex = 11 - monthDiff;
          if (transaction.transaction_type === "deposit") {
            depositData[monthIndex] += parseFloat(transaction.amount);
          } else if (transaction.transaction_type === "withdrawal") {
            withdrawalData[monthIndex] += parseFloat(transaction.amount);
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
  }, [exchangeTransactions, userEmail]);

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
    console.log("Wallet data:", walletData);
  }
  console.log(walletData);

  useEffect(() => {
    const fetchData = async () => {
      if (user?.referral_code && isAuthenticated) {
        try {
          await Promise.all([
            dispatch(fetchReferralWallet()).catch((error) => {
              console.warn(
                "Referral wallet API not available in LineCharts:",
                error
              );
              return null;
            }),
          ]);
          await Promise.all([dispatch(fetchReferralWallet())]);
        } catch (error) {
          console.error("Error fetching referral data:", error);
        }
      }
    };
    fetchData();
  }, [user?.referral_code, dispatch, isAuthenticated]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 w-full">
        {/* Exchange Overview */}
        <Card className="w-full rounded-none lg:rounded-2xl dark:bg-[#1D1D23] bg-[#F5F5F5]">
          <h3 className="dark:text-white text-[14px] mb-2 font-semibold">
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
            <GradientLineChart
              data1={chartData.depositData}
              data2={chartData.withdrawalData}
              showData1={filter === "All" || filter === "Deposits"}
              showData2={filter === "All" || filter === "Withdrawals"}
            />
          </div>
        </Card>
        {/* P2P Overview */}
        <Card className="w-full rounded-none lg:rounded-2xl dark:bg-[#1D1D23] bg-[#F5F5F5]">
          <h3 className="dark:text-white text-[14px] mb-2 font-semibold">
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
            <GradientLineChart
              data1={p2pChartData.buyData}
              data2={p2pChartData.sellData}
              showData1={p2pFilter === "All" || p2pFilter === "Buys"}
              showData2={p2pFilter === "All" || p2pFilter === "Sells"}
            />
          </div>
        </Card>
        {/* Overview Total */}
        <Card className="w-full rounded-none lg:rounded-2xl flex flex-col lg:flex-row items-center h-full relative dark:bg-[#1D1D23] bg-[#F5F5F5]">
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
              <button
                className={`${
                  activeTab === "buy"
                    ? "bg-[#1D8751] text-white"
                    : "bg-transparent border border-[#1D8751] text-[#1D8751]"
                } px-3 py-1 rounded-full text-[13px] font-semibold whitespace-nowrap`}
                onClick={() => setActiveTab("buy")}
              >
                Buy
              </button>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row w-full pt-10">
            {activeTab === "buy" || activeTab === "swap" ? (
              <div className="w-full text-center py-8">
                <div className="flex flex-col items-center justify-center border border-[#35353E] rounded-[24px] p-8 bg-[#23232B]">
                  <div className="w-16 h-16 mb-4 rounded-full bg-[#35353E] flex items-center justify-center">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-[#788099]"
                    >
                      <path
                        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 8V12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 16H12.01"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#788099] mb-2">
                    No Data Found
                  </h3>
                  <p className="text-sm text-[#8C8CA1] text-center max-w-md">
                    There are currently no {activeTab} transactions to display.
                    Please check back later.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Legend
                  data={overviewTotalData(transactionSummary, activeTab)}
                />
                <div className="flex-1 flex flex-col items-center justify-center mt-4 lg:mt-0">
                  <DonutChartWithCenter
                    data={overviewTotalData(transactionSummary, activeTab)}
                    total={
                      overviewTotalSummary(transactionSummary, activeTab).total
                    }
                    label="Transactions"
                  />
                </div>
              </>
            )}
          </div>
        </Card>
        {/* Referral Commissions */}
        <Card className="w-full rounded-none lg:rounded-2xl flex flex-col lg:flex-row items-center h-full relative dark:bg-[#1D1D23] bg-[#F5F5F5]">
          <div className="absolute left-0 top-0 px-2 pt-2 flex flex-wrap w-full justify-between items-center gap-2">
            <h3 className="dark:text-white text-[14px] mb-2 font-semibold">
              Your Referral Commissions
            </h3>
            <Dropdown
              value={period}
              options={["Month", "Week", "Year"]}
              onChange={setPeriod}
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
};

export default LineCharts;
