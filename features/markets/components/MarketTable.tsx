"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSimpleMarkets } from "../hooks/useSimpleMarkets";
import { MarketData } from "../types";
import { tokens } from "../../../styles/tokens";
import {
  fetchCoinDetailsPublic,
  fetchCoinMarketChartPublic,
  debugChartAPI,
  debugDetailsAPI,
} from "../api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Utility functions for formatting
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const formatVolume = (volume: number): string => {
  if (volume >= 1e12) {
    return `$${(volume / 1e12).toFixed(2)}T`;
  } else if (volume >= 1e9) {
    return `$${(volume / 1e9).toFixed(2)}B`;
  } else if (volume >= 1e6) {
    return `$${(volume / 1e6).toFixed(2)}M`;
  } else if (volume >= 1e3) {
    return `$${(volume / 1e3).toFixed(2)}K`;
  }
  return `$${volume.toFixed(2)}`;
};

const formatMarketCap = (marketCap: number): string => {
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(2)}T`;
  } else if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`;
  } else if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`;
  }
  return `$${marketCap.toFixed(2)}`;
};

const formatPercentage = (percentage: number): string => {
  const sign = percentage >= 0 ? "+" : "";
  return `${sign}${percentage.toFixed(2)}%`;
};

// Dynamic coin icon component
const CoinIcon = ({
  image,
  symbol,
  size = 32,
}: {
  image: string;
  symbol: string;
  size?: number;
}) => {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    // Fallback to a generic coin icon
    return (
      <div
        className="rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-sm"
        style={{ width: size, height: size }}
      >
        {symbol.toUpperCase().slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={symbol}
      width={size}
      height={size}
      className="rounded-full"
      onError={() => setImageError(true)}
    />
  );
};

// Inline SVGs for coins
const BTCIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#F7931A" />
    <text
      x="16"
      y="21"
      textAnchor="middle"
      fontSize="16"
      fill="#fff"
      fontWeight="bold"
    >
      ₿
    </text>
  </svg>
);
const ETHIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#627EEA" />
    <polygon points="16,7 24,16 16,29 8,16" fill="#fff" />
  </svg>
);
const TRXIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#EC0928" />
    <polygon points="10,10 24,10 16,24" fill="#fff" />
  </svg>
);

// Inline SVGs for actions
const ChartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M3 17V9M9 17V5M15 17V13M21 19H1"
      stroke="#1D8751"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
const StarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M11 3l2.09 6.26H19l-5.18 3.76L15.91 19 11 14.77 6.09 19l1.09-5.98L2 9.26h5.91z"
      stroke="#788099"
      strokeWidth="1.5"
      fill="none"
    />
  </svg>
);

const tableHeaders = [
  "Name",
  "Price",
  "24h Change",
  "24 Volume",
  "Market Cap",
  "More",
];

// Sample data removed - now using live data from API
const sampleRows = [
  {
    icon: <BTCIcon />,
    name: "BTC",
    fullName: "Bitcoin",
    price: "$29,799.28",
    change: "+2.11%",
    volume: "$12.94B",
    cap: "$570.43B",
  },
  {
    icon: <ETHIcon />,
    name: "ETH",
    fullName: "Ethereum",
    price: "$29,799.28",
    change: "+2.11%",
    volume: "$12.94B",
    cap: "$570.43B",
  },
  {
    icon: <TRXIcon />,
    name: "TRX",
    fullName: "Tron",
    price: "$29,799.28",
    change: "+2.11%",
    volume: "$12.94B",
    cap: "$570.43B",
  },
];

const favouriteAssets = [
  {
    icon: <BTCIcon />,
    name: "BTC",
    fullName: "Bitcoin",
    price: "32,349.00 USD",
    change: "+4.66%",
  },
  {
    icon: <ETHIcon />,
    name: "ETH",
    fullName: "Ethereum",
    price: "32,349.00 USD",
    change: "+4.66%",
  },
  {
    icon: <TRXIcon />,
    name: "TRX",
    fullName: "Tron",
    price: "32,349.00 USD",
    change: "+4.66%",
  },
];

const filterTags = ["Hot", "Gainers", "Losers", "New", "Market Cap"];

const MarketTable = () => {
  const { markets, loading, error, lastUpdated, refetch, clearError } =
    useSimpleMarkets(100);

  const [activeFilter, setActiveFilter] = useState<string>("Hot");
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null);
  const [coinDetails, setCoinDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);

  // Make debug functions available globally for testing
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).debugChartAPI = debugChartAPI;
      (window as any).debugDetailsAPI = debugDetailsAPI;
      (window as any).testPublicAPI = async () => {
        try {
          console.log("Testing public API endpoints...");
          const response = await fetch(
            "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1&interval=hourly"
          );
          const data = await response.json();
          console.log("Public API test result:", data);
          return data;
        } catch (error) {
          console.error("Public API test failed:", error);
        }
      };
      console.log(
        "Debug functions available: window.debugChartAPI, window.debugDetailsAPI, window.testPublicAPI"
      );
    }
  }, []);

  // Filter markets based on active filter - memoized to prevent unnecessary recalculations
  const filteredMarkets = useMemo(() => {
    if (!markets.length) return [];

    switch (activeFilter) {
      case "Gainers":
        return markets.filter(
          (market) => market.price_change_percentage_24h > 0
        );
      case "Losers":
        return markets.filter(
          (market) => market.price_change_percentage_24h < 0
        );
      case "New":
        // Filter for coins with recent activity (you can customize this logic)
        return markets.slice(0, 10);
      case "Market Cap":
        return [...markets].sort((a, b) => b.market_cap - a.market_cap);
      default:
        return markets;
    }
  }, [markets, activeFilter]);

  // Get top 3 markets for favorite assets - memoized
  const favoriteAssets = useMemo(() => {
    return markets.slice(0, 3);
  }, [markets]);

  const handleFilterClick = useCallback((filter: string) => {
    setActiveFilter(filter);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Handle row click to fetch and show details and chart
  const handleRowClick = async (id: string) => {
    if (selectedCoinId === id) {
      setSelectedCoinId(null);
      setCoinDetails(null);
      setChartData([]);
      return;
    }
    setSelectedCoinId(id);
    setLoadingDetails(true);
    setLoadingChart(true);

    try {
      // Use direct fetch calls to avoid API key issues
      const [detailsResponse, chartResponse] = await Promise.all([
        fetch(`https://api.coingecko.com/api/v3/coins/${id}`).then((res) =>
          res.json()
        ),
        fetch(
          `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=1&interval=hourly`
        ).then((res) => res.json()),
      ]);

      // Set coin details
      setCoinDetails(detailsResponse);

      // Process chart data - ensure it's an array and has the expected format
      if (
        chartResponse.prices &&
        Array.isArray(chartResponse.prices) &&
        chartResponse.prices.length > 0
      ) {
        const processedChartData = chartResponse.prices.map(
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
        console.error("Invalid chart data format:", chartResponse);
        setChartData([]);
      }
    } catch (error) {
      console.error("Error fetching coin data:", error);
      setCoinDetails(null);
      setChartData([]);
    } finally {
      setLoadingDetails(false);
      setLoadingChart(false);
    }
  };

  if (error) {
    return (
      <div className="bg-[#18181D] min-h-screen py-8 text-[#788099] font-sans">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-4">
            <p className="text-red-400">Error loading market data: {error}</p>
            <button
              onClick={clearError}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#18181D] min-h-screen py-8 text-[#788099] font-sans">
      {/* Top Section */}
      <div className="max-w-[1000px] mx-auto mb-6 px-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[#fff] text-2xl font-bold">Market Review</h1>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-[#788099]">
                Last updated: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-3 py-1 bg-[#1D1D23] text-[#788099] rounded border border-[#35353E] hover:bg-[#35353E] disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {filterTags.map((tag) => (
            <span
              key={tag}
              onClick={() => handleFilterClick(tag)}
              className={`bg-[#1D1D23] text-[#788099] rounded-2xl px-4 py-1 text-sm font-medium border border-[#35353E] cursor-pointer transition-colors ${
                activeFilter === tag
                  ? "bg-[#35353E] text-[#fff]"
                  : "hover:bg-[#35353E]"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="text-sm text-[#788099] mb-2">
          Gain a comprehensive overview of all cryptocurrencies through OMAYA
          Express. This webpage presents the most recent prices, 24-hour trade
          volumes, price fluctuations, and market capitalizations for every
          cryptocurrency available on global markets.
        </div>
        <div className="text-sm text-[#788099] mb-6">
          Users can readily obtain crucial details about these digital assets
          and directly navigate to the trading platform from this point.
        </div>

        {/* Favourite Assets Header Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 font-semibold text-[#fff] text-lg">
            Favourite Assets
            <button className="bg-none border-none text-[#788099] text-xl cursor-pointer p-0 ml-2">
              &lt;
            </button>
            <button className="bg-none border-none text-[#788099] text-xl cursor-pointer p-0 ml-1">
              &gt;
            </button>
          </div>
          <div className="flex items-center text-[#fff] font-medium text-base cursor-pointer gap-1">
            Add Asset{" "}
            <span className="text-lg font-bold ml-1 flex items-center">+</span>
          </div>
        </div>

        {/* Favourite Assets Cards Row */}
        <div className="flex gap-4 mb-8">
          {favoriteAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-[#1D1D23] rounded-xl px-2 py-2 min-w-[160px] min-h-[56px] flex flex-col items-start shadow-sm border border-[#35353E] gap-0.5"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-7 h-7 flex items-center">
                  <CoinIcon
                    image={asset.image}
                    symbol={asset.symbol}
                    size={28}
                  />
                </span>
                <span className="font-semibold text-[#fff] text-base">
                  {asset.symbol.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-[#788099] mb-0.5">{asset.name}</div>
              <div className="font-semibold text-[#fff] text-sm">
                {formatPrice(asset.current_price)}
              </div>
              <div
                className={`text-xs font-medium ${
                  asset.price_change_percentage_24h >= 0
                    ? "text-[#13B562]"
                    : "text-[#FF6B6B]"
                }`}
              >
                {formatPercentage(asset.price_change_percentage_24h)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table Section with rounded border */}
      <div className="rounded-2xl border border-[#35353E] overflow-hidden bg-[#18181D] shadow-lg max-w-[1000px] mx-auto">
        {loading && markets.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#13B562]"></div>
            <span className="ml-3 text-[#fff]">Loading market data...</span>
          </div>
        ) : (
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                {tableHeaders.map((header) => (
                  <th
                    key={header}
                    className="text-[#fff] bg-[#1D1D23] px-2 py-4 text-left font-semibold border-b-2 border-[#35353E] text-base"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMarkets.map((market, idx) => (
                <React.Fragment key={market.id}>
                  <tr
                    onClick={() => handleRowClick(market.id)}
                    className={
                      "cursor-pointer transition-colors " +
                      (selectedCoinId === market.id
                        ? "bg-[#23232a] border-l-4 border-[#13B562]"
                        : idx % 2 === 0
                        ? "bg-[#1D1D23]"
                        : "bg-[#18181D]")
                    }
                  >
                    <td className="flex items-center gap-3 px-2 py-3 text-[#fff]">
                      <span className="w-7 h-7 flex items-center">
                        <CoinIcon
                          image={market.image}
                          symbol={market.symbol}
                          size={28}
                        />
                      </span>
                      <div>
                        <div className="font-semibold">
                          {market.symbol.toUpperCase()}
                        </div>
                        <div className="text-xs text-[#788099]">
                          {market.name}
                        </div>
                      </div>
                    </td>
                    <td className="text-[#1D8751] font-medium px-2 py-3">
                      {formatPrice(market.current_price)}
                    </td>
                    <td
                      className={`font-medium px-2 py-3 ${
                        market.price_change_percentage_24h >= 0
                          ? "text-[#13B562]"
                          : "text-[#FF6B6B]"
                      }`}
                    >
                      {formatPercentage(market.price_change_percentage_24h)}
                    </td>
                    <td className="px-2 py-3">
                      {formatVolume(market.total_volume)}
                    </td>
                    <td className="px-2 py-3">
                      {formatMarketCap(market.market_cap)}
                    </td>
                    <td className="px-2 py-3 flex items-center gap-3">
                      <span className="cursor-pointer">
                        <ChartIcon />
                      </span>
                      <span className="cursor-pointer">
                        <StarIcon />
                      </span>
                    </td>
                  </tr>
                  {/* Details row */}
                  {selectedCoinId === market.id && (
                    <tr>
                      <td
                        colSpan={tableHeaders.length}
                        className="bg-[#23232a] px-6 py-4 border-t border-[#35353E]"
                      >
                        {/* Chart */}
                        <div className="w-full mb-4" style={{ height: 260 }}>
                          {loadingChart ? (
                            <div className="flex items-center gap-2 text-[#13B562]">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#13B562]"></div>
                              Loading chart...
                            </div>
                          ) : chartData.length > 0 ? (
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
                          ) : (
                            <div className="text-red-500 flex items-center gap-2">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                              >
                                <path
                                  d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 10.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
                                  fill="currentColor"
                                />
                              </svg>
                              No chart data available
                            </div>
                          )}
                        </div>
                        {/* Coin details */}
                        {loadingDetails ? (
                          <div className="flex items-center gap-2 text-[#13B562]">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#13B562]"></div>
                            Loading details...
                          </div>
                        ) : coinDetails ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-4">
                              <img
                                src={coinDetails.image?.large}
                                alt={coinDetails.name}
                                className="w-12 h-12 rounded-full"
                              />
                              <div>
                                <div className="text-lg font-bold text-white">
                                  {coinDetails.name} (
                                  {coinDetails.symbol.toUpperCase()})
                                </div>
                                <div className="text-sm text-[#13B562]">
                                  Rank #{coinDetails.market_cap_rank}
                                </div>
                              </div>
                            </div>
                            <div
                              className="text-sm text-[#fff] mt-2"
                              dangerouslySetInnerHTML={{
                                __html:
                                  coinDetails.description?.en?.slice(0, 300) +
                                  "...",
                              }}
                            />
                            <div className="flex flex-wrap gap-4 mt-2">
                              <div>
                                <span className="font-semibold text-[#fff]">
                                  Genesis:
                                </span>{" "}
                                {coinDetails.genesis_date || "N/A"}
                              </div>
                              <div>
                                <span className="font-semibold text-[#fff]">
                                  Hashing:
                                </span>{" "}
                                {coinDetails.hashing_algorithm || "N/A"}
                              </div>
                              <div>
                                <span className="font-semibold text-[#fff]">
                                  Block Time:
                                </span>{" "}
                                {coinDetails.block_time_in_minutes} min
                              </div>
                              <div>
                                <span className="font-semibold text-[#fff]">
                                  Homepage:
                                </span>{" "}
                                <a
                                  href={coinDetails.links?.homepage?.[0]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#13B562] underline"
                                >
                                  {coinDetails.links?.homepage?.[0]}
                                </a>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-red-500 flex items-center gap-2">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                            >
                              <path
                                d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 10.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
                                fill="currentColor"
                              />
                            </svg>
                            Failed to load details. Please try again.
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MarketTable;
