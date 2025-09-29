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
import { Button } from "@headlessui/react";
import { ArrowLeftRight, Plus, Repeat, Search, Users, X } from "lucide-react";
import Link from "next/link";
import { TiArrowUnsorted } from "react-icons/ti";
import {
  fetchAssets,
  addFavoriteAsset,
  removeFavoriteAsset,
  getFavoriteAssets,
} from "../../exchange/slices/exchangeSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { toast } from "sonner";
import { Asset, FavoriteAsset } from "../../exchange/types";
import { useMarketsI18n } from "@/lib/useMarketsI18n";

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

const formatPercentage = (percentage: number | null | undefined): string => {
  if (
    percentage === null ||
    percentage === undefined ||
    !isFinite(percentage as number)
  ) {
    return "0.00%";
  }
  const sign = (percentage as number) >= 0 ? "+" : "";
  return `${sign}${(percentage as number).toFixed(2)}%`;
};

// Dynamic coin icon component
const CoinIcon = ({
  image,
  symbol,
  size = 32,
}: {
  image: string | null | undefined;
  symbol: string;
  size?: number;
}) => {
  const [imageError, setImageError] = useState(false);

  if (!image || imageError) {
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

const tableHeadersKeys = [
  "markets.table.name",
  "markets.table.price",
  "markets.table.change24h",
  "markets.table.volume24h",
  "markets.table.marketCap",
  "markets.table.more",
];

const filterTags = ["Hot", "Gainers", "Losers", "New", "Market Cap"];

const MarketTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    assets: allAvailableAssets,
    favoriteAssets,
    loading: loadingAssets,
  } = useSelector((state: RootState) => state.exchange);
  const { markets, loading, error, lastUpdated, refetch, clearError } =
    useSimpleMarkets(100);
  const { t } = useMarketsI18n();

  const [activeFilter, setActiveFilter] = useState<string>("Hot");
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null);
  const [coinDetails, setCoinDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingRemoveAsset, setPendingRemoveAsset] =
    useState<FavoriteAsset | null>(null);

  useEffect(() => {
    if (!allAvailableAssets) {
      dispatch(fetchAssets());
    }
    dispatch(getFavoriteAssets());
    // eslint-disable-next-line
  }, []);

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
  // const favoriteAssets = useMemo(() => {
  //   return markets.slice(0, 3);
  // }, [markets]);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    setSearchTerm("");
  };

  const handleAddToFavorites = async (assetId: string) => {
    try {
      await dispatch(addFavoriteAsset({ asset_id: assetId })).unwrap();
      toast.success("Asset added to favorites!");
      setShowDropdown(false);
      dispatch(fetchAssets());
    } catch (error: any) {
      toast.error(
        `Failed to add asset to favorites: ${
          error || "Unknown error" || "unexpected error occured"
        }`
      );
    }
  };

  const handleRemoveFromFavorites = async (assetId: string) => {
    try {
      await dispatch(removeFavoriteAsset({ asset_id: assetId })).unwrap();
      toast.success("Asset removed from favorites!");
      dispatch(getFavoriteAssets()); // Refresh the favorites list
    } catch (error: any) {
      toast.error(
        `Failed to remove asset from favorites: ${
          error || "Unknown error" || "unexpected error occured"
        }`
      );
    }
  };

  // Helper function to find asset ID from asset name
  const getAssetIdFromName = (assetName: string): string | null => {
    const asset = allAvailableAssets?.assets?.find(
      (asset: Asset) => asset.name === assetName || asset.symbol === assetName
    );
    return asset?.asset_id || null;
  };

  const filteredAvailableAssets =
    allAvailableAssets?.assets?.filter((asset: Asset) =>
      asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Dummy data for missing fields
  const DUMMY_ASSET_DATA: Record<
    string,
    { symbol: string; price: number; change: string }
  > = {
    "USDT Tether": { symbol: "USDT", price: 0.99, change: "+0.01%" },
    FXPRIMUS: { symbol: "FXP", price: 1.0, change: "+0.00%" },
  };

  const handleFilterClick = useCallback((filter: string) => {
    setActiveFilter(filter);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Handle row click to fetch and show details
  const handleRowClick = async (id: string) => {
    if (selectedCoinId === id) {
      setSelectedCoinId(null);
      setCoinDetails(null);
      return;
    }
    setSelectedCoinId(id);
    setLoadingDetails(true);

    try {
      const detailsResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}`
      ).then(async (res) => {
        if (!res.ok) {
          throw new Error(`Details API error: ${res.status}`);
        }
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          console.warn("Invalid JSON in details response");
          return { error: "Invalid JSON" };
        }
      });

      // Set coin details with error checking
      if (
        detailsResponse &&
        !detailsResponse.error &&
        !detailsResponse.status?.error_code
      ) {
        setCoinDetails(detailsResponse);
      } else {
        console.warn("Coin details API error:", detailsResponse);
        setCoinDetails(null);
      }
    } catch (error) {
      console.warn("Network error fetching coin data:", error);
      setCoinDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (error) {
    return (
      <div className="bg-white dark:bg-[#18181D] min-h-screen py-8 text-gray-900 dark:text-[#788099] font-sans">
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
    <div className="bg-[#EEF1F4] dark:bg-[#18181D] min-h-screen py-8 text-gray-900 dark:text-[#788099] font-sans">
      {/* Top Section */}
      <div className="container mx-auto mb-6 px-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-gray-900 dark:text-[#fff] text-2xl font-bold">
            {t("markets.title", "Market Review")}
          </h1>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-600 dark:text-[#788099]">
                {t("markets.lastUpdated", "Last updated:")}{" "}
                {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-3 py-1 bg-gray-100 dark:bg-[#1D1D23] text-gray-700 dark:text-[#788099] rounded border border-gray-300 dark:border-[#35353E] hover:bg-gray-200 dark:hover:bg-[#35353E] disabled:opacity-50"
            >
              {loading ? "Loading..." : t("markets.refresh", "Refresh")}
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {filterTags.map((tag) => (
            <span
              key={tag}
              onClick={() => handleFilterClick(tag)}
              className={`bg-gray-100 dark:bg-[#1D1D23] text-gray-700 dark:text-[#788099] rounded-2xl px-4 py-1 text-sm font-medium border border-gray-300 dark:border-[#35353E] cursor-pointer transition-colors ${
                activeFilter === tag
                  ? "bg-gray-200 dark:bg-[#35353E] text-gray-900 dark:text-[#fff]"
                  : "hover:bg-gray-200 dark:hover:bg-[#35353E]"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="text-sm text-gray-600 dark:text-[#788099] mb-2">
          {t(
            "markets.intro1",
            "Gain a comprehensive overview of all cryptocurrencies through OMAYA Express. This webpage presents the most recent prices, 24-hour trade volumes, price fluctuations, and market capitalizations for every cryptocurrency available on global markets."
          )}
        </div>
        <div className="text-sm text-gray-600 dark:text-[#788099] mb-6">
          {t(
            "markets.intro2",
            "Users can readily obtain crucial details about these digital assets and directly navigate to the trading platform from this point."
          )}
        </div>

        {/* Favourite Assets Header Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-[#fff] text-lg">
            {t("markets.topFavorites", "Top Favorite Assets")}
            <button
              className="bg-none border-none text-[#1D8751] text-xl cursor-pointer p-0 ml-2"
              onClick={() => {
                document
                  .getElementById("fav-scroll")
                  ?.scrollBy({ left: -300, behavior: "smooth" });
              }}
            >
              &lt;
            </button>
            <button
              className="bg-none border-none text-[#1D8751] text-xl cursor-pointer p-0 ml-1"
              onClick={() => {
                document
                  .getElementById("fav-scroll")
                  ?.scrollBy({ left: 300, behavior: "smooth" });
              }}
            >
              &gt;
            </button>
          </div>
          <div className="relative">
            <button
              className="flex items-center text-gray-900 dark:text-[#fff] font-medium text-base cursor-pointer gap-1"
              onClick={toggleDropdown}
            >
              {t("markets.addAsset", "Add Asset")}
              <Plus className="w-3 h-3 text-[#1D8751]" />
            </button>
            {/* Dropdown Content */}
            {showDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#23242B] rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                <div className="relative mt-2 item-center ml-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#1D8751] w-4 h-4" />
                  <input
                    type="text"
                    placeholder={t("markets.search", "Search")}
                    className="bg-transparent border border-[#2D2E3A] rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#10B981] w-44"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <ul className="py-1">
                  {filteredAvailableAssets?.length > 0 ? (
                    filteredAvailableAssets?.map((asset: Asset) => (
                      <li
                        key={asset.asset_id}
                        className="px-4 py-2 text-sm text-[#9CA3AF] hover:bg-[#35353E] cursor-pointer"
                        onClick={() => handleAddToFavorites(asset.asset_id)}
                      >
                        <span className="text-white mr-2">{asset.symbol}</span>
                        {asset.name}
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-2 text-sm text-[#9CA3AF]">
                      {t("markets.noAssetsFound", "No assets found")}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Favourite Assets Cards Row */}
        <div
          id="fav-scroll"
          className="
            flex gap-4 mb-8 w-full overflow-x-auto scrollbar-hide scroll-smooth
          "
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {loadingAssets ? (
            <div className="flex items-center justify-center min-w-[250px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#13B562]"></div>
            </div>
          ) : favoriteAssets?.length === 0 ? (
            <div className="col-span-3 text-center text-gray-500">
              {t(
                "markets.noFavorites",
                "No favorite assets found. Add some to see them here."
              )}
            </div>
          ) : (
            favoriteAssets?.map((asset: FavoriteAsset) => {
              const dummyData = DUMMY_ASSET_DATA[asset.asset_symbol] || {
                symbol: (asset.asset_symbol ?? "").split(" ")[0],
                price: 0,
                change: "+0.00%",
              };

              return (
                <div
                  key={asset.favorite_asset_id}
                  className="bg-white dark:bg-[#1D1D23] rounded-2xl p-4 flex items-center gap-3 border border-[#E8EFF5] dark:border-[#35353E] relative flex-shrink-0 w-[80%] sm:w-[45%] md:w-[30%]"
                >
                  <button
                    onClick={() => {
                      setPendingRemoveAsset(asset);
                      setShowConfirmModal(true);
                    }}
                    className="absolute top-0 right-2 p-1 rounded-full hover:[#E8EFF5] dark:hover:bg-[#35353E] transition-colors"
                    title="Remove from favorites"
                  >
                    <X className="w-3 h-3 text-[#9CA3AF] hover:text-white" />
                  </button>
                  <div className="w-8 h-8 rounded-full">
                    {asset.asset_image &&
                    typeof asset.asset_image === "string" &&
                    asset.asset_image.trim() !== "" ? (
                      <img
                        src={asset.asset_image}
                        alt={asset.asset_symbol}
                        className="object-cover w-8 h-8 rounded-full"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <CoinIcon
                        image={null}
                        symbol={asset.asset_symbol || ""}
                        size={32}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#051015] dark:text-white truncate">
                      {dummyData.symbol}
                    </div>
                    <div className="text-xs text-[#788099] dark:text-[#788099] truncate">
                      {asset.asset_symbol}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text:[#051015] dark:text-white whitespace-nowrap">
                      $
                      {dummyData.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 8,
                      })}
                    </div>
                    <div
                      className={`text-xs whitespace-nowrap ${
                        dummyData.change.startsWith("+")
                          ? "text-[#1D8751]"
                          : "text-[#1D8751]"
                      }`}
                    >
                      {dummyData.change}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Table Section with rounded border */}
        <div className="rounded-2xl border border-gray-200 dark:border-[#35353E] overflow-hidden bg-white dark:bg-[#18181D] shadow-lg container mx-auto">
          {loading && markets.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#13B562]"></div>
              <span className="ml-3 text-gray-900 dark:text-[#fff]">
                {t("markets.loading", "Loading market data...")}
              </span>
            </div>
          ) : (
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  {tableHeadersKeys.map((key, idx) => (
                    <th
                      key={key}
                      className="text-gray-900 dark:text-[#fff] bg-gray-50 dark:bg-[#35353E] px-2 py-4 text-left font-semibold border-b-2 border-gray-200 dark:border-[#35353E] text-base"
                    >
                      <div className="flex items-center gap-1">
                        {t(key, key)}
                        {idx !== 0 && idx !== tableHeadersKeys.length - 1 && (
                          <TiArrowUnsorted className="w-3 h-3 ml-1 text-gray-400" />
                        )}
                      </div>
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
                          ? "bg-gray-100 dark:bg-[#23232a] border-l-4 border-[#13B562]"
                          : idx % 2 === 0
                            ? "bg-gray-50 dark:bg-[#1D1D23]"
                            : "bg-white dark:bg-[#18181D]")
                      }
                    >
                      <td className="flex items-center gap-3 px-2 py-3 text-gray-900 dark:text-[#fff]">
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
                          <div className="text-xs text-gray-600 dark:text-[#788099]">
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
                          colSpan={tableHeadersKeys.length}
                          className="bg-gray-100 dark:bg-[#23232a] px-6 py-4 border-t border-gray-200 dark:border-[#35353E]"
                        >
                          {/* Coin details */}
                          {loadingDetails ? (
                            <div className="flex items-center gap-2 text-[#13B562]">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#13B562]"></div>
                              Loading details...
                            </div>
                          ) : coinDetails ? (
                            <div className="">
                              {/* Action Buttons */}
                              <div className="flex justify-center gap-4">
                                <Link
                                  href={{
                                    pathname: "/market/chart",
                                    query: { id: market.id },
                                  }}
                                  className="border border-[#1D8751] rounded-full p-2 px-4 text-[#1D8751] flex gap-2 items-center cursor-pointer hover:bg-[#1D8751]/10"
                                >
                                  <ChartIcon />
                                  <p>View Chart</p>
                                </Link>
                                <Link href="/dashboard/express-exchange">
                                  <Button className="border border-[#1D8751] rounded-full p-2 px-4 text-[#1D8751] flex gap-2 items-center cursor-pointer">
                                    <ArrowLeftRight className="w-4 h-5" />
                                    <p>Exchange</p>
                                  </Button>
                                </Link>
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
      {showConfirmModal && pendingRemoveAsset && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[999]"
            style={{ background: "rgba(0,0,0,0.6)" }}
          />
          {/* Modal */}
          <div className="fixed inset-0 z-[1000] flex items-center justify-center">
            <div className="bg-[#23242B] rounded-xl p-6 shadow-lg w-full max-w-sm">
              <h2 className="text-lg font-semibold text-white mb-2">
                Remove Favorite
              </h2>
              <p className="text-[#9CA3AF] mb-4">
                Are you sure you want to remove{" "}
                <span className="font-bold text-white">
                  {pendingRemoveAsset.asset_symbol}
                </span>{" "}
                from your favorites?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingRemoveAsset(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-[#1D8751] text-white hover:bg-[#166c3a]"
                  onClick={() => {
                    const assetId = getAssetIdFromName(
                      pendingRemoveAsset.asset_symbol
                    );
                    if (assetId) {
                      handleRemoveFromFavorites(assetId);
                    } else {
                      toast.error("Could not find asset ID for removal");
                    }
                    setShowConfirmModal(false);
                    setPendingRemoveAsset(null);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MarketTable;
