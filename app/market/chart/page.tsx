"use client";
import React, { useState, useEffect, Suspense } from "react";
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

const MarketChartContent = () => {
  const searchParams = useSearchParams();
  const coinId = searchParams?.get("id");
  
  const [coinDetails, setCoinDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("1");
  const [usingFallbackData, setUsingFallbackData] = useState(false);

  useEffect(() => {
    if (!coinId) return;

    const loadData = async () => {
      try {
        setLoadingDetails(true);
        setLoadingChart(true);
        setError(null);
        setUsingFallbackData(false);
        
        const [details, chart] = await Promise.all([
          fetchCoinDetailsPublic(coinId),
          fetchCoinMarketChartPublic(coinId, Number(timeRange))
        ]);

        // Check if we're using fallback data by looking at the response
        // Fallback data will have a market_cap_rank that's randomly generated
        // and the image URL will be a generic pattern
        const isFallbackData = details.image?.large?.includes('assets.coingecko.com/coins/images/1/large/') ||
                              (details.market_cap_rank && details.market_cap_rank > 0 && details.market_cap_rank <= 100);
        
        if (isFallbackData) {
          setUsingFallbackData(true);
        }

        setCoinDetails(details);
        
        if (chart && Array.isArray(chart)) {
          const processedChartData = chart.map(
            ([timestamp, price]: [number, number]) => ({
              time: new Date(timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              price: Number(price),
            })
          );
          setChartData(processedChartData);
        } else {
          console.warn("Invalid chart data received");
          setChartData([]);
        }
      } catch (err) {
        console.error("Error loading chart data:", err);
        setError("Failed to load data. Please try again.");
        setUsingFallbackData(true);
        // Set some basic data to prevent complete failure
        setCoinDetails({
          id: coinId,
          symbol: coinId.toUpperCase(),
          name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
          image: { large: "" },
          market_cap_rank: 1,
          market_data: {
            current_price: { usd: 0 },
            price_change_percentage_24h: 0,
            market_cap: { usd: 0 },
            total_volume: { usd: 0 }
          }
        });
        setChartData([]);
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
      <div className="bg-white dark:bg-[#18181D] min-h-screen py-8 text-gray-900 dark:text-[#788099]">
        <div className="max-w-[1000px] mx-auto px-6">
          <Link 
            href="/dashboard/market" 
            className="flex items-center gap-2 text-[#13B562] mb-6"
          >
            <ArrowLeft size={18} />
            Back to Markets
          </Link>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h2 className="text-xl font-semibold mb-2">Unable to Load Chart Data</h2>
              <p className="text-sm">{error}</p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setError(null);
                  // Trigger reload by changing timeRange temporarily
                  const currentRange = timeRange;
                  setTimeRange("0");
                  setTimeout(() => setTimeRange(currentRange), 100);
                }}
                className="bg-[#13B562] text-white px-6 py-2 rounded-lg hover:bg-[#0f9f4f] transition-colors"
              >
                Try Again
              </button>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p>This might be due to:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Temporary API service issues</li>
                  <li>• Network connectivity problems</li>
                  <li>• Rate limiting from the data provider</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
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

        {usingFallbackData && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
             
            </div>
          </div>
        )}

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
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-lg font-medium mb-2">No Chart Data Available</p>
              <p className="text-sm text-center max-w-md">
                Chart data is currently unavailable for this cryptocurrency. 
                This might be due to temporary API issues or the coin not being actively traded.
              </p>
              <button
                onClick={() => {
                  // Trigger reload
                  const currentRange = timeRange;
                  setTimeRange("0");
                  setTimeout(() => setTimeRange(currentRange), 100);
                }}
                className="mt-4 bg-[#13B562] text-white px-4 py-2 rounded-lg hover:bg-[#0f9f4f] transition-colors"
              >
                Refresh Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MarketChartPage = () => {
  return (
    <Suspense fallback={
      <div className="bg-white dark:bg-[#18181D] min-h-screen py-8 flex items-center justify-center">
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