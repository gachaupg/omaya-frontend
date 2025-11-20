"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchCoinDetailsPublic, fetchCoinMarketChartPublic } from "../../../features/markets/api";
import Link from "next/link";
import { ArrowLeft, ArrowLeftRight, Repeat, Users } from "lucide-react";
import { Button } from "@headlessui/react";
import RatesTransactionHistory from "@/features/rates/components/RatesTransactionHistory";

const MarketTable = dynamic(
  () => import("../../../features/markets/components/MarketTable"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full rounded-xl border border-[#E8EFF5] dark:border-[#35353E] bg-white dark:bg-[#1D1D23] p-6 text-center text-sm sm:text-base lg:text-base text-[#788099]">
        Loading Omaya transactions...
      </div>
    ),
  }
);

// Utility functions for formatting
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const formatPercentage = (percentage: number): string => {
  const sign = percentage >= 0 ? "+" : "";
  return `${sign}${percentage.toFixed(2)}%`;
};

const MarketChartContent = () => {
  const searchParams = useSearchParams();
  const coinId = searchParams?.get("id");
  
  const [coinDetails, setCoinDetails] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("1");

  useEffect(() => {
    if (!coinId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [details, chart] = await Promise.all([
          fetchCoinDetailsPublic(coinId).catch(e => {
            console.warn("Failed to fetch details:", e);
            return null;
          }),
          fetchCoinMarketChartPublic(coinId, Number(timeRange)).catch(e => {
            console.error("Failed to fetch chart:", e);
            throw e;
          })
        ]);

        setCoinDetails(details);
        
        if (chart?.prices && Array.isArray(chart.prices)) {
          const processedChartData = chart.prices.map(
            ([timestamp, price]: [number, number]) => ({
              time: Number(timeRange) === 1 
                ? new Date(timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : new Date(timestamp).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  }),
              price: Number(price),
              fullTime: new Date(timestamp).toLocaleString(),
            })
          );
          setChartData(processedChartData);
        } else {
          throw new Error("No chart data received from API");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load data";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [coinId, timeRange]);

  if (!coinId) {
    return (
      <div className="bg-white dark:bg-[#18181D] min-h-screen py-4 sm:py-6 lg:py-8">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6">
          <div className="p-4 text-red-500 text-sm sm:text-base lg:text-base">
        No coin ID provided. Please go back and select a coin.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#18181D] min-h-screen py-4 sm:py-6 lg:py-8">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center gap-2 text-[#13B562] mb-4 sm:mb-6 lg:mb-6 text-sm sm:text-base lg:text-base">
            <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 lg:h-6 lg:w-6 border-b-2 border-[#13B562]"></div>
            Loading chart data...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-[#18181D] min-h-screen py-4 sm:py-6 lg:py-8">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6">
          <div className="text-red-500 mb-4 text-sm sm:text-base lg:text-base">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2.5 sm:py-2 lg:py-2 bg-[#13B562] text-white rounded hover:bg-[#0f8f4d] text-sm sm:text-base lg:text-base min-h-[44px] sm:min-h-0 lg:min-h-0"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#18181D] min-h-screen py-4 sm:py-6 lg:py-8 text-gray-900 dark:text-[#788099]">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6">
        <Link 
          href="/market" 
          className="flex items-center gap-2 text-[#13B562] mb-4 sm:mb-6 lg:mb-6 hover:underline text-sm sm:text-base lg:text-base"
        >
          <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px] lg:w-[18px] lg:h-[18px]" />
          Back to Markets
        </Link>

        <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold text-[#051015] dark:text-white mb-4 sm:mb-6 lg:mb-6">Asset Overview</h1>

        {coinDetails && (
          <div className="bg-gray-50 dark:bg-[#1D1D23] rounded-xl sm:rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 mb-4 sm:mb-6 lg:mb-8 border border-[#E8EFF5] dark:border-[#35353E]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-4 lg:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-4">
                <img
                  src={coinDetails.image?.large}
                  alt={coinDetails.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 lg:w-12 lg:h-12 rounded-full flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/api/placeholder/48/48';
                  }}
                />
                <div>
                  <h2 className="font-bold text-[#051015] dark:text-white text-base sm:text-lg lg:text-lg">
                    {coinDetails.name} ({coinDetails.symbol.toUpperCase()})
                  </h2>
                  <div className="text-xs sm:text-sm lg:text-sm text-[#13B562]">
                    Rank #{coinDetails.market_cap_rank}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 w-full sm:w-auto lg:w-auto">
                <div>
                  <p className="text-gray-600 dark:text-[#788099] text-xs sm:text-sm lg:text-sm">Price</p>
                  <p className="font-bold text-[#13B562] text-sm sm:text-base lg:text-base">
                    {formatPrice(coinDetails.market_data?.current_price?.usd || 0)}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-600 dark:text-[#788099] text-xs sm:text-sm lg:text-sm">24h Change</p>
                  <p className={`font-bold text-sm sm:text-base lg:text-base ${
                    coinDetails.market_data?.price_change_percentage_24h >= 0 
                      ? "text-[#13B562]" 
                      : "text-[#FF6B6B]"
                  }`}>
                    {formatPercentage(coinDetails.market_data?.price_change_percentage_24h || 0)}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-600 dark:text-[#788099] text-xs sm:text-sm lg:text-sm">Market Cap</p>
                  <p className="font-bold text-sm sm:text-base lg:text-base">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    }).format(coinDetails.market_data?.market_cap?.usd || 0)}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-600 dark:text-[#788099] text-xs sm:text-sm lg:text-sm">24h Volume</p>
                  <p className="font-bold text-sm sm:text-base lg:text-base">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    }).format(coinDetails.market_data?.total_volume?.usd || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 dark:bg-[#1D1D23] rounded-lg p-3 sm:p-4 lg:p-6 border border-[#E8EFF5] dark:border-[#35353E]">
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-5 lg:mb-6">
            {["1", "7", "30", "90", "365"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 sm:px-4 lg:px-4 py-2 rounded-md text-xs sm:text-sm lg:text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 lg:min-h-0 ${
                  timeRange === range
                    ? "bg-[#13B562] text-white"
                    : "bg-gray-100 dark:bg-[#2D2D33] text-gray-700 dark:text-[#788099] hover:bg-gray-200 dark:hover:bg-[#3D3D43]"
                }`}
              >
                {range === "1" ? "24h" : `${range}d`}
              </button>
            ))}
          </div>

          <div style={{ height: "300px" }} className="sm:h-[350px] lg:h-[400px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -10,
                    bottom: 0,
                  }}
                >
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#788099", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fill: "#788099", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#23232a",
                      border: "none",
                      color: "#fff",
                    }}
                    labelStyle={{ color: "#13B562" }}
                    formatter={(value: number) => [formatPrice(value), "Price"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#13B562"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                No chart data available
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 lg:gap-4 justify-center mt-6 sm:mt-7 lg:mt-8">
            <Link href="/dashboard/express-exchange" className="w-full sm:w-auto lg:w-auto">
              <Button className="w-full sm:w-auto lg:w-auto border border-[#1D8751] rounded-full p-2.5 sm:p-2.5 lg:p-3 px-5 sm:px-5 lg:px-6 text-[#1D8751] flex gap-2 items-center justify-center cursor-pointer hover:bg-[#1D8751] hover:text-white transition-colors text-sm sm:text-base lg:text-base min-h-[44px] sm:min-h-0 lg:min-h-0">
                <ArrowLeftRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5"/>
                <span>Exchange</span>
              </Button>
            </Link>
            <Link href="/dashboard/p2p" className="w-full sm:w-auto lg:w-auto">
              <Button className="w-full sm:w-auto lg:w-auto border border-[#1D8751] rounded-full p-2.5 sm:p-2.5 lg:p-3 px-5 sm:px-5 lg:px-6 text-[#1D8751] flex gap-2 items-center justify-center cursor-pointer hover:bg-[#1D8751] hover:text-white transition-colors text-sm sm:text-base lg:text-base min-h-[44px] sm:min-h-0 lg:min-h-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5"/>
                <span>P2P</span>
              </Button>
            </Link>
            <Link href="/dashboard/swap" className="w-full sm:w-auto lg:w-auto">
              <Button className="w-full sm:w-auto lg:w-auto border border-[#1D8751] rounded-full p-2.5 sm:p-2.5 lg:p-3 px-5 sm:px-5 lg:px-6 text-[#1D8751] flex gap-2 items-center justify-center cursor-pointer hover:bg-[#1D8751] hover:text-white transition-colors text-sm sm:text-base lg:text-base min-h-[44px] sm:min-h-0 lg:min-h-0">
                <Repeat className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5"/>
                <span>Swap</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 lg:mt-12">
          <div className="flex flex-col gap-2 mb-4 sm:mb-6 lg:mb-8">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#051015] dark:text-white">
              Omaya Transactions
            </h2>
            
          </div>
          <RatesTransactionHistory/>
          {/* <MarketTable showFullLayout={false} /> */}
        </div>
      </div>
    </div>
  );
};

const MarketChartPage = () => {
  return (
    <Suspense fallback={
      <div className="bg-white dark:bg-[#18181D] min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#13B562]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#13B562]"></div>
          Loading chart...
        </div>
      </div>
    }>
      <MarketChartContent />
    </Suspense>
  );
};

export default MarketChartPage;