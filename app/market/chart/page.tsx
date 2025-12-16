"use client";
import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { fetchCoinDetailsPublic, fetchCoinMarketChartPublic } from "../../../features/markets/api";
import Link from "next/link";
import { ArrowLeft, ArrowLeftRight, Repeat, Users } from "lucide-react";
import { Button } from "@headlessui/react";
import RatesTransactionHistory from "@/features/rates/components/RatesTransactionHistory";
import { Chats } from "@/features/markets/components/chats";
import {
  fetchAssets,
  addFavoriteAsset,
  removeFavoriteAsset,
  getFavoriteAssets,
} from "../../../features/exchange/slices/exchangeSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import toast from "react-hot-toast";
import { Asset } from "../../../features/exchange/types";

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

const formatMarketCap = (marketCap: number | null | undefined): string => {
  if (marketCap === null || marketCap === undefined || isNaN(marketCap)) {
    return "$0.00";
  }
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(2)}T`;
  } else if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`;
  } else if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`;
  }
  return `$${marketCap.toFixed(2)}`;
};

const formatVolume = (volume: number | null | undefined): string => {
  if (volume === null || volume === undefined || isNaN(volume)) {
    return "$0.00";
  }
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

// Star Icon Component
const StarIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M11 3l2.09 6.26H19l-5.18 3.76L15.91 19 11 14.77 6.09 19l1.09-5.98L2 9.26h5.91z"
      stroke={filled ? "#FFD700" : "#788099"}
      strokeWidth="1.5"
      fill={filled ? "#FFD700" : "none"}
    />
  </svg>
);

const MarketChartContent = () => {
  const searchParams = useSearchParams();
  const coinId = searchParams?.get("id");
  const dispatch = useDispatch<AppDispatch>();
  const {
    assets: allAvailableAssets,
    favoriteAssets,
  } = useSelector((state: RootState) => state.exchange);
  
  const [coinDetails, setCoinDetails] = useState<any>(null);
  const [chartData, setChartData] = useState<{ prices?: [number, number][]; total_volumes?: [number, number][] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("1");
  const [localFavorites, setLocalFavorites] = useState<string[]>([]);

  // Load favorites from localStorage
  const getStoredFavorites = useCallback((): string[] => {
    if (typeof window === "undefined") return [];
    try {
      const localFavoritesValue = localStorage.getItem("market_favorites");
      if (!localFavoritesValue) return [];
      const parsed = JSON.parse(localFavoritesValue);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Error reading favorites from localStorage:", error);
      return [];
    }
  }, []);

  useEffect(() => {
    if (!allAvailableAssets) {
      dispatch(fetchAssets());
    }
    dispatch(getFavoriteAssets());
    setLocalFavorites(getStoredFavorites());
  }, [dispatch, getStoredFavorites, allAvailableAssets]);

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
          setChartData({
            prices: chart.prices,
            total_volumes: chart.total_volumes || [],
          });
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

  // Check if asset is favorited
  const isFavorited = (symbol: string, name: string): boolean => {
    const normalizedSymbol = symbol.toUpperCase();
    const normalizedName = name.toUpperCase();
    
    if (
      localFavorites.some(
        (fav) =>
          fav.toUpperCase() === normalizedSymbol || fav.toUpperCase() === normalizedName
      )
    ) {
      return true;
    }
    
    const isInRedux = favoriteAssets?.some(
      (fav: any) =>
        fav.asset_symbol?.toLowerCase() === symbol.toLowerCase() ||
        fav.asset_symbol?.toLowerCase() === name.toLowerCase()
    );
    
    if (isInRedux) return true;

    if (typeof window !== "undefined") {
      try {
        const storedFavorites = localStorage.getItem("market_favorites");
        if (storedFavorites) {
          const favorites = JSON.parse(storedFavorites);
          return favorites.some(
            (fav: string) =>
              fav.toLowerCase() === symbol.toLowerCase() ||
              fav.toLowerCase() === name.toLowerCase()
          );
        }
      } catch (error) {
        console.warn("Error reading favorites from localStorage:", error);
      }
    }
    
    return false;
  };

  // Get asset ID from symbol/name
  const getAssetIdFromCoin = (symbol: string, name: string): string | null => {
    if (!allAvailableAssets?.assets) return null;
    
    let asset = allAvailableAssets.assets.find(
      (asset: Asset) => asset.symbol.toLowerCase() === symbol.toLowerCase()
    );
    
    if (!asset) {
      asset = allAvailableAssets.assets.find(
        (asset: Asset) => asset.name.toLowerCase() === name.toLowerCase()
      );
    }
    
    if (!asset) {
      asset = allAvailableAssets.assets.find(
        (asset: Asset) => 
          asset.symbol.toLowerCase().includes(symbol.toLowerCase()) ||
          symbol.toLowerCase().includes(asset.symbol.toLowerCase())
      );
    }
    
    return asset?.asset_id || null;
  };

  // Update localStorage favorites
  const updateLocalStorageFavorites = (symbol: string, add: boolean) => {
    if (typeof window !== "undefined") {
      try {
        const normalizedSymbol = symbol.toUpperCase();
        let favorites = getStoredFavorites();

        if (add) {
          const hasSymbol = favorites
            .map((fav) => fav.toUpperCase())
            .includes(normalizedSymbol);
          if (!hasSymbol) {
            favorites.push(normalizedSymbol);
          }
        } else {
          favorites = favorites.filter(
            (fav) => fav.toUpperCase() !== normalizedSymbol
          );
        }

        localStorage.setItem("market_favorites", JSON.stringify(favorites));
        setLocalFavorites(favorites);
      } catch (error) {
        console.warn("Error updating favorites in localStorage:", error);
      }
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!coinDetails) return;
    
    const symbol = coinDetails.symbol;
    const name = coinDetails.name;
    const assetId = getAssetIdFromCoin(symbol, name);
    const favorited = isFavorited(symbol, name);

    if (!assetId) {
      updateLocalStorageFavorites(symbol, !favorited);
      toast.success(
        !favorited
          ? `${symbol.toUpperCase()} added to favorites!`
          : `${symbol.toUpperCase()} removed from favorites!`
      );
      await dispatch(getFavoriteAssets());
      return;
    }

    try {
      if (favorited) {
        await dispatch(removeFavoriteAsset({ asset_id: assetId })).unwrap();
        updateLocalStorageFavorites(symbol, false);
        toast.success(`${symbol.toUpperCase()} removed from favorites!`);
      } else {
        await dispatch(addFavoriteAsset({ asset_id: assetId })).unwrap();
        updateLocalStorageFavorites(symbol, true);
        toast.success(`${symbol.toUpperCase()} added to favorites!`);
      }
      await dispatch(getFavoriteAssets());
    } catch (error: any) {
      updateLocalStorageFavorites(symbol, !favorited);
      const errorMessage = error?.message || error?.toString() || "Unknown error";
      toast.error(
        `Failed to ${favorited ? "remove" : "add"} favorite: ${errorMessage}. Using local storage.`
      );
      await dispatch(getFavoriteAssets());
    }
  };

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
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-4 flex-1">
                <img
                  src={coinDetails.image?.large}
                  alt={coinDetails.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 lg:w-12 lg:h-12 rounded-full flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/api/placeholder/48/48';
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 sm:gap-4 lg:gap-4">
                    <div>
                      <h2 className="font-bold text-[#051015] dark:text-white text-base sm:text-lg lg:text-lg">
                        {coinDetails.name} ({coinDetails.symbol.toUpperCase()})
                      </h2>
                      <div className="text-xs sm:text-sm lg:text-sm text-[#13B562]">
                        Rank #{coinDetails.market_cap_rank}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#13B562] text-lg sm:text-xl lg:text-2xl">
                        {formatPrice(coinDetails.market_data?.current_price?.usd || 0)}
                      </p>
                      <span
                        className="cursor-pointer hover:opacity-70 transition-opacity flex-shrink-0"
                        onClick={handleToggleFavorite}
                        title={
                          isFavorited(coinDetails.symbol, coinDetails.name)
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                      >
                        <StarIcon filled={isFavorited(coinDetails.symbol, coinDetails.name)} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 w-full sm:w-auto lg:w-auto">
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
                    {formatMarketCap(coinDetails.market_data?.market_cap?.usd || 0)}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-600 dark:text-[#788099] text-xs sm:text-sm lg:text-sm">24h Volume</p>
                  <p className="font-bold text-sm sm:text-base lg:text-base">
                    {formatVolume(coinDetails.market_data?.total_volume?.usd || 0)}
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

          <div 
            className="w-full"
            style={{ 
              height: "400px",
              minHeight: "400px"
            }}
          >
            {chartData && chartData.prices && chartData.prices.length > 0 ? (
              <div className="w-full h-full">
                <Chats
                  data={chartData}
                  symbol={coinDetails ? `${coinDetails.symbol.toUpperCase()}/USD` : 'BTC/USD'}
                  timeRange={timeRange}
                  height={400}
                  width="100%"
                />
              </div>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 sm:mb-6 lg:mb-8">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#051015] dark:text-white">
                Omaya Transactions
              </h2>
            <Link 
              href="/market/live-transactions"
              className="text-[#13B562] hover:text-[#0f8f4d] font-medium text-sm sm:text-base flex items-center gap-1 transition-colors"
            >
              Live Transactions →
            </Link>
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