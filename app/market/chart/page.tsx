"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
import { div } from "framer-motion/client";
import { Button } from "@headlessui/react";

// Utility functions for formatting (copied from MarketTable)
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

const MarketChartPage = () => {
  const searchParams = useSearchParams();
  const coinId = searchParams?.get("id");
  
  const [coinDetails, setCoinDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("1");

  useEffect(() => {
    if (!coinId) return;

    const loadData = async () => {
      try {
        setLoadingDetails(true);
        setLoadingChart(true);
        
        const [details, chart] = await Promise.all([
          fetchCoinDetailsPublic(coinId),
          fetchCoinMarketChartPublic(coinId, Number(timeRange))
        ]);

        setCoinDetails(details);
        
        if (chart.prices && Array.isArray(chart.prices)) {
          const processedChartData = chart.prices.map(
            ([timestamp, price]: [number, number]) => ({
              time: new Date(timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              price: Number(price),
            })
          );
          setChartData(processedChartData);
        }
      } catch (err) {
        setError("Failed to load data. Please try again.");
        console.error(err);
      } finally {
        setLoadingDetails(false);
        setLoadingChart(false);
      }
    };

    loadData();
  }, [coinId, timeRange]);

  if (!coinId) {
    return (
      <div className="p-4 text-red-500">
        No coin ID provided. Please go back and select a coin.
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#18181D] min-h-screen py-8 text-gray-900 dark:text-[#788099]">
      <div className="max-w-[1000px] mx-auto px-6">
        <Link 
          href="/dashboard/market" 
          className="flex items-center gap-2 text-[#13B562] mb-6"
        >
          <ArrowLeft size={18} />
        </Link>

        <h1 className="text-2xl text-[#051015] dark:text-white">Asset Details</h1>

        {loadingDetails ? (
          <div className="flex items-center gap-2 text-[#13B562]">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#13B562]"></div>
            Loading details...
          </div>
        ) : coinDetails && (
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <img
                src={coinDetails.image?.large}
                alt={coinDetails.name}
                className="w-16 h-16 rounded-full"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {coinDetails.name} ({coinDetails.symbol.toUpperCase()})
                </h1>
                <div className="text-sm text-[#13B562]">
                  Rank #{coinDetails.market_cap_rank}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-[#1D1D23] p-4 rounded-lg">
                <div className="text-gray-600 dark:text-[#788099] text-sm">Current Price</div>
                <div className="text-xl font-bold text-[#13B562]">
                  {formatPrice(coinDetails.market_data?.current_price?.usd || 0)}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-[#1D1D23] p-4 rounded-lg">
                <div className="text-gray-600 dark:text-[#788099] text-sm">24h Change</div>
                <div className={`text-xl font-bold ${
                  coinDetails.market_data?.price_change_percentage_24h >= 0 
                    ? "text-[#13B562]" 
                    : "text-[#FF6B6B]"
                }`}>
                  {formatPercentage(coinDetails.market_data?.price_change_percentage_24h || 0)}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-[#1D1D23] p-4 rounded-lg">
                <div className="text-gray-600 dark:text-[#788099] text-sm">Market Cap</div>
                <div className="text-xl font-bold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }).format(coinDetails.market_data?.market_cap?.usd || 0)}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-[#1D1D23] p-4 rounded-lg">
                <div className="text-gray-600 dark:text-[#788099] text-sm">24h Volume</div>
                <div className="text-xl font-bold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }).format(coinDetails.market_data?.total_volume?.usd || 0)}
                </div>
              </div>
            </div>

            {/* Time range selector */}
            <div className="flex gap-2 mb-4">
              {["1", "7", "30", "90", "365"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    timeRange === range
                      ? "bg-[#13B562] text-white"
                      : "bg-gray-100 dark:bg-[#1D1D23] text-gray-700 dark:text-[#788099]"
                  }`}
                >
                  {range === "1" ? "24h" : `${range}d`}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-50 dark:bg-[#1D1D23] p-4 rounded-lg" style={{ height: "500px" }}>
          {loadingChart ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2 text-[#13B562]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#13B562]"></div>
                Loading chart...
              </div>
            </div>
          ) : chartData.length > 0 ? (
            <div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <XAxis
                  dataKey="time"
                  tick={{ fill: "#788099", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "#788099", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip
                  contentStyle={{
                    background: "#23232a",
                    border: "none",
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#13B562" }}
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
            <div className="flex items-center gap-2 mt-4">
          <Link href="/dashboard/express-exchange">
          <Button className="border border-[#1D8751] rounded-full p-2 px-4 text-[#1D8751] flex gap-2 items-center cursor-pointer">
            <ArrowLeftRight className="w-4 h-5"/>
              <p>Exchange</p>
            </Button>
          </Link>
          <Link href="/dashboard/p2p">
            <Button className="border border-[#1D8751] rounded-full p-2 px-4 text-[#1D8751] flex gap-2 items-center cursor-pointer">
            <Users className="w-4 h-5"/>
              <p>P2P</p>
            </Button>
          </Link>
            <Link href="/dashboard/swap">
            <Button className="border border-[#1D8751] rounded-full p-2 px-4 text-[#1D8751] flex gap-2 items-center cursor-pointer">
            <Repeat className="w-4 h-5"/>
              <p>Swap</p>
            </Button>
            </Link>
            </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-red-500">
              No chart data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketChartPage;