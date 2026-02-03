"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  Repeat,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import toast from "react-hot-toast";
import { Asset, FavoriteAsset } from "../../exchange/types";

import { logger } from "@/lib/utils/logger";
import { Chats } from "./chats";

const ITEMS_PER_PAGE = 20;

// Utility functions for formatting
const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined || isNaN(price)) {
    return "$0.00";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
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

const formatPercentage = (percentage: number | null | undefined): string => {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return "0.00%";
  }
  const sign = percentage >= 0 ? "+" : "";
  return `${sign}${percentage.toFixed(2)}%`;
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

const tableHeaders = [
  "Name",
  "Price",
  "24h Change", // Will be split into "24h" and "Change"
  "24 Volume",
  "Market Cap",
  "More",
];

const filterTags = ["Hot", "Gainers", "Losers", "New", "Market Cap"];

interface MarketTableProps {
  showFullLayout?: boolean;
}

const MarketTable = ({ showFullLayout = true }: MarketTableProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    assets: allAvailableAssets,
    favoriteAssets,
    loading: loadingAssets,
  } = useSelector((state: RootState) => state.exchange);
  const { markets, loading, error, lastUpdated, refetch, clearError } =
    useSimpleMarkets(100);

  const [activeFilter, setActiveFilter] = useState<string>("Hot");
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null);
  const [coinDetails, setCoinDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingRemoveAsset, setPendingRemoveAsset] =
    useState<FavoriteAsset | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc" | null;
  } | null>(null);
  const [favoritesUpdateTrigger, setFavoritesUpdateTrigger] = useState(0);
  const [localFavorites, setLocalFavorites] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const favScrollRef = useRef<HTMLDivElement>(null);

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
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setLocalFavorites(getStoredFavorites());
  }, [getStoredFavorites]);

  // Sync localStorage favorites when assets are loaded
  useEffect(() => {
    if (allAvailableAssets?.assets && favoriteAssets) {
      if (typeof window !== "undefined") {
        try {
          const localFavorites = localStorage.getItem("market_favorites");
          if (localFavorites) {
            const favorites = JSON.parse(localFavorites);
            // Try to add any localStorage favorites that aren't in Redux
            favorites.forEach((symbol: string) => {
              const asset = allAvailableAssets.assets?.find(
                (a: Asset) =>
                  a.symbol.toLowerCase() === symbol.toLowerCase() ||
                  a.name.toLowerCase() === symbol.toLowerCase()
              );
              if (asset?.asset_id) {
                const isFavorited = favoriteAssets.some(
                  (fav: FavoriteAsset) =>
                    fav.asset_symbol.toLowerCase() === symbol.toLowerCase()
                );
                if (!isFavorited) {
                  // Silently try to sync, don't show toast
                  dispatch(addFavoriteAsset({ asset_id: asset.asset_id })).catch(
                    () => {
                      // Ignore errors during sync
                    }
                  );
                }
              }
            });
          }
        } catch (error) {
          console.warn("Error syncing favorites from localStorage:", error);
        }
      }
    }
    // eslint-disable-next-line
  }, [allAvailableAssets, favoriteAssets, favoritesUpdateTrigger]);

  // Make debug functions available globally for testing
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).debugChartAPI = debugChartAPI;
      (window as any).debugDetailsAPI = debugDetailsAPI;
      (window as any).testPublicAPI = async () => {
        try {
          logger.debug("general", "Testing public API endpoints...");
          const response = await fetch(
            "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1&interval=hourly"
          );
          const data = await response.json();
          logger.debug("general", "Public API test result:", data);
          return data;
        } catch (error) {
          console.error("Public API test failed:", error);
        }
      };
      logger.debug(
        "general",
        "Debug functions available: window.debugChartAPI, window.debugDetailsAPI, window.testPublicAPI"
      );
    }
  }, []);

  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        // Cycle through: asc -> desc -> null
        if (prev.direction === "asc") {
          return { key, direction: "desc" };
        } else if (prev.direction === "desc") {
          return null;
        }
      }
      return { key, direction: "asc" };
    });
  };

  // Get sort icon
  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return <TiArrowUnsorted className="w-3 h-3 text-gray-400" />;
    }
    if (sortConfig.direction === "asc") {
      return <ArrowUpRight className="w-3 h-3 text-gray-600 dark:text-gray-300" />;
    } else if (sortConfig.direction === "desc") {
      return <ArrowDownRight className="w-3 h-3 text-gray-600 dark:text-gray-300" />;
    }
    return <TiArrowUnsorted className="w-3 h-3 text-gray-400" />;
  };

  // Filter and sort markets - memoized to prevent unnecessary recalculations
  const filteredMarkets = useMemo(() => {
    if (!markets.length) return [];

    let result: typeof markets = [];

    // Apply filters first
    switch (activeFilter) {
      case "Gainers":
        result = markets.filter(
          (market) =>
            market.price_change_percentage_24h !== null &&
            market.price_change_percentage_24h > 0
        );
        break;
      case "Losers":
        result = markets.filter(
          (market) =>
            market.price_change_percentage_24h !== null &&
            market.price_change_percentage_24h < 0
        );
        break;
      case "New":
        // Filter for coins with recent activity (you can customize this logic)
        result = markets.slice(0, 10);
        break;
      case "Market Cap":
        result = [...markets].sort((a, b) => {
          const aCap = a.market_cap || 0;
          const bCap = b.market_cap || 0;
          return bCap - aCap;
        });
        break;
      default:
        result = [...markets];
    }

    // Apply sorting if configured
    if (sortConfig && sortConfig.direction) {
      result = [...result].sort((a, b) => {
        let aValue: number = 0;
        let bValue: number = 0;

        switch (sortConfig.key) {
          case "24h_volume":
            aValue = a.total_volume || 0;
            bValue = b.total_volume || 0;
            break;
          case "change":
            aValue = a.price_change_percentage_24h || 0;
            bValue = b.price_change_percentage_24h || 0;
            break;
          case "price":
            aValue = a.current_price || 0;
            bValue = b.current_price || 0;
            break;
          case "market_cap":
            aValue = a.market_cap || 0;
            bValue = b.market_cap || 0;
            break;
          default:
            return 0;
        }

        if (sortConfig.direction === "asc") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
    }

    return result;
  }, [markets, activeFilter, sortConfig]);

  // Reset to page 1 when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, sortConfig]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredMarkets.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const paginatedMarkets = filteredMarkets.slice(indexOfFirstItem, indexOfLastItem);

  const localFavoriteMarkets = useMemo(() => {
    if (!localFavorites.length || !markets.length) return [];

    const seen = new Set<string>();

    return localFavorites
      .map((favoriteSymbol) => {
        const normalizedFavorite = favoriteSymbol.toLowerCase();
        const matchingMarket = markets.find(
          (market) =>
            market.symbol.toLowerCase() === normalizedFavorite ||
            market.name.toLowerCase() === normalizedFavorite
        );

        if (matchingMarket && !seen.has(matchingMarket.id)) {
          seen.add(matchingMarket.id);
          return matchingMarket;
        }

        return null;
      })
      .filter(
        (market): market is (typeof markets)[number] => market !== null
      );
  }, [localFavorites, markets, favoritesUpdateTrigger]);

  const hasRemoteFavoriteAssets = Boolean(favoriteAssets?.length);
  // Combine remote and local favorites - show local favorites even if remote favorites exist
  const allFavoriteMarketsToShow = useMemo(() => {
    const remoteSymbols = new Set(
      (favoriteAssets ?? []).map((fav: FavoriteAsset) => fav.asset_symbol.toLowerCase())
    );
    // Only include local favorites that aren't already in remote favorites
    const uniqueLocalFavorites = localFavoriteMarkets.filter(
      (market) => !remoteSymbols.has(market.symbol.toLowerCase()) && !remoteSymbols.has(market.name.toLowerCase())
    );
    return uniqueLocalFavorites;
  }, [favoriteAssets, localFavoriteMarkets]);

  const showLocalFavoriteFallback = allFavoriteMarketsToShow.length > 0;

  // Get top 3 markets for favorite assets - memoized
  // const favoriteAssets = useMemo(() => {
  //   return markets.slice(0, 3);
  // }, [markets]);

  const handleRemoveFromFavorites = async (assetId: string) => {
    try {
      await dispatch(removeFavoriteAsset({ asset_id: assetId })).unwrap();
      toast.success("Asset removed from favorites!");
      dispatch(getFavoriteAssets()); // Refresh the favorites list
    } catch (error: any) {
      toast.error(
        `Failed to remove asset from favorites: ${error || "Unknown error" || "unexpected error occured"
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

  // Helper function to get asset_id from market symbol
  const getAssetIdFromMarket = (marketSymbol: string, marketName: string): string | null => {
    if (!allAvailableAssets?.assets) return null;

    // Try exact symbol match first
    let asset = allAvailableAssets.assets.find(
      (asset: Asset) => asset.symbol.toLowerCase() === marketSymbol.toLowerCase()
    );

    // If not found, try name match
    if (!asset) {
      asset = allAvailableAssets.assets.find(
        (asset: Asset) => asset.name.toLowerCase() === marketName.toLowerCase()
      );
    }

    // If still not found, try partial matches
    if (!asset) {
      asset = allAvailableAssets.assets.find(
        (asset: Asset) =>
          asset.symbol.toLowerCase().includes(marketSymbol.toLowerCase()) ||
          marketSymbol.toLowerCase().includes(asset.symbol.toLowerCase())
      );
    }

    return asset?.asset_id || null;
  };

  // Helper function to check if market is favorited
  const isMarketFavorited = (
    marketSymbol: string,
    marketName: string
  ): boolean => {
    const normalizedSymbol = marketSymbol.toUpperCase();
    const normalizedName = marketName.toUpperCase();
    if (
      localFavorites.some(
        (fav) =>
          fav.toUpperCase() === normalizedSymbol || fav.toUpperCase() === normalizedName
      )
    ) {
      return true;
    }
    // Check Redux state first
    const isInRedux = favoriteAssets?.some(
      (fav: FavoriteAsset) =>
        fav.asset_symbol.toLowerCase() === marketSymbol.toLowerCase() ||
        fav.asset_symbol.toLowerCase() === marketName.toLowerCase()
    );

    if (isInRedux) return true;

    // Check localStorage as fallback
    if (typeof window !== "undefined") {
      try {
        const localFavorites = localStorage.getItem("market_favorites");
        if (localFavorites) {
          const favorites = JSON.parse(localFavorites);
          return favorites.some(
            (fav: string) =>
              fav.toLowerCase() === marketSymbol.toLowerCase() ||
              fav.toLowerCase() === marketName.toLowerCase()
          );
        }
      } catch (error) {
        console.warn("Error reading favorites from localStorage:", error);
      }
    }

    return false;
  };

  // LocalStorage utilities
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

  // Toggle favorite function
  const handleToggleFavorite = async (
    e: React.MouseEvent,
    marketSymbol: string,
    marketName: string
  ) => {
    e.stopPropagation(); // Prevent row click

    const assetId = getAssetIdFromMarket(marketSymbol, marketName);
    const isFavorited = isMarketFavorited(marketSymbol, marketName);

    if (!assetId) {
      // If asset not found in exchange assets, use localStorage only
      updateLocalStorageFavorites(marketSymbol, !isFavorited);
      toast.success(
        !isFavorited
          ? `${marketSymbol.toUpperCase()} added to favorites!`
          : `${marketSymbol.toUpperCase()} removed from favorites!`
      );
      // Force re-render by updating state
      await dispatch(getFavoriteAssets());
      // Force component re-render
      setFavoritesUpdateTrigger((prev) => prev + 1);
      handleReloadFavorites();
      return;
    }

    try {
      if (isFavorited) {
        await dispatch(removeFavoriteAsset({ asset_id: assetId })).unwrap();
        updateLocalStorageFavorites(marketSymbol, false);
        toast.success(`${marketSymbol.toUpperCase()} removed from favorites!`);
      } else {
        const result = await dispatch(addFavoriteAsset({ asset_id: assetId })).unwrap();
        updateLocalStorageFavorites(marketSymbol, true);
        toast.success(`${marketSymbol.toUpperCase()} added to favorites!`);
      }
      // Refresh favorites list immediately
      await dispatch(getFavoriteAssets());
      // Force component re-render
      setFavoritesUpdateTrigger((prev) => prev + 1);
      // Also reload to ensure UI updates
      handleReloadFavorites();
    } catch (error: any) {
      // Fallback to localStorage if API fails
      updateLocalStorageFavorites(marketSymbol, !isFavorited);
      const errorMessage = error?.message || error?.toString() || "Unknown error";
      toast.error(
        `Failed to ${isFavorited ? "remove" : "add"} favorite: ${errorMessage}. Using local storage.`
      );
      await dispatch(getFavoriteAssets());
      setFavoritesUpdateTrigger((prev) => prev + 1);
      handleReloadFavorites();
    }
  };

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

  const handleReloadFavorites = useCallback(() => {
    dispatch(fetchAssets());
    dispatch(getFavoriteAssets());
    setLocalFavorites(getStoredFavorites());
  }, [dispatch, getStoredFavorites]);

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
      <div className="bg-white dark:bg-background min-h-screen py-8 text-gray-900 dark:text-[#788099] font-sans">
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

  const renderFilterTags = (className = "") => (
    <div className={`flex flex-wrap gap-1.5 sm:gap-2 ${className}`}>
      {filterTags.map((tag) => (
        <span
          key={tag}
          onClick={() => handleFilterClick(tag)}
          className={`bg-gray-100 rounded-lg sm:rounded-xl lg:rounded-2xl px-2.5 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-1 text-[11px] sm:text-xs lg:text-sm font-medium border cursor-pointer transition-colors min-h-[36px] sm:min-h-[40px] lg:min-h-0 flex items-center justify-center whitespace-nowrap ${activeFilter === tag
            ? "bg-gray-100 dark:bg-[#35353E] text-green-700 border-green-700 "
            : "text-gray-700 hover:bg-gray-200 dark:hover:bg-[#35353E] dark:bg-[#1D1D23] dark:text-[#788099] border-gray-300 dark:border-[#35353E]"
            }`}
        >
          {tag}
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={`text-gray-900 dark:text-[#788099] font-sans ${showFullLayout ? "bg-[#EEF1F4] dark:bg-background min-h-screen py-4 sm:py-6 lg:py-8" : ""
        }`}
    >
      <div className={showFullLayout ? "max-w-[1400px] mx-auto" : ""}>
        {showFullLayout ? (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 sm:gap-0">
              <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold text-gray-900 dark:text-[#fff]">
                Market Review
              </h1>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {lastUpdated && (
                  <span className="text-xs text-gray-600 dark:text-[#788099]">
                    Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                  </span>
                )}
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="px-3 py-1.5 sm:py-1 lg:py-1 bg-gray-100 dark:bg-[#1D1D23] text-gray-700 dark:text-[#788099] rounded border border-gray-300 dark:border-[#35353E] hover:bg-gray-200 dark:hover:bg-[#35353E] disabled:opacity-50 text-xs sm:text-sm lg:text-sm min-h-[44px] sm:min-h-0 lg:min-h-0"
                >
                  {loading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>

            {renderFilterTags("mb-4")}

            <div className="text-xs sm:text-sm lg:text-sm text-gray-600 dark:text-[#788099] mb-2 leading-relaxed">
              Gain a comprehensive overview of all cryptocurrencies through OMAYA
              Express. This webpage presents the most recent prices, 24-hour trade
              volumes, price fluctuations, and market capitalizations for every
              cryptocurrency available on global markets.
            </div>
            <div className="text-xs sm:text-sm lg:text-sm text-gray-600 dark:text-[#788099] mb-4 sm:mb-6 lg:mb-6 leading-relaxed">
              Users can readily obtain crucial details about these digital assets
              and directly navigate to the trading platform from this point.
            </div>

            {/* Favourite Assets Header Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-3 sm:gap-0">
              <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-[#fff] text-base sm:text-lg lg:text-lg">
                Favourite Assets
                {((favoriteAssets && favoriteAssets.length > 0) || (allFavoriteMarketsToShow && allFavoriteMarketsToShow.length > 0)) && (
                  <>
                    <button
                      type="button"
                      className="bg-none border-none text-[#1D8751] text-xl sm:text-2xl lg:text-2xl font-semibold leading-none cursor-pointer px-1 sm:px-2 lg:px-2 ml-1 sm:ml-2 lg:ml-2 min-h-[44px] sm:min-h-0 lg:min-h-0 flex items-center justify-center hover:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (favScrollRef.current) {
                          const scrollAmount = favScrollRef.current.clientWidth * 0.8;
                          favScrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
                        }
                      }}
                      title="Scroll left"
                    >
                      &lt;
                    </button>
                    <button
                      type="button"
                      className="bg-none border-none text-[#1D8751] text-xl sm:text-2xl lg:text-2xl font-semibold leading-none cursor-pointer px-1 sm:px-2 lg:px-2 ml-1 min-h-[44px] sm:min-h-0 lg:min-h-0 flex items-center justify-center hover:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (favScrollRef.current) {
                          const scrollAmount = favScrollRef.current.clientWidth * 0.8;
                          favScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
                        }
                      }}
                      title="Scroll right"
                    >
                      &gt;
                    </button>
                  </>
                )}
              </div>
              <button
                className="flex items-center text-gray-900 dark:text-[#fff] font-medium text-sm sm:text-base lg:text-base cursor-pointer gap-2 min-h-[44px] sm:min-h-0 lg:min-h-0"
                onClick={handleReloadFavorites}
                disabled={loadingAssets}
              >
                Reload
                <Repeat className="w-4 h-4 text-[#1D8751]" />
              </button>
            </div>

            {/* Favourite Assets Cards Row */}
            <div
              ref={favScrollRef}
              id="fav-scroll"
              className="
                flex gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8 w-full overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2
              "
              style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
            >
              {loadingAssets ? (
                <div className="flex items-center justify-center min-w-[250px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#13B562]"></div>
                </div>
              ) : hasRemoteFavoriteAssets || showLocalFavoriteFallback ? (
                <>
                  {/* Render remote favorites first */}
                  {(favoriteAssets ?? []).map((asset: FavoriteAsset) => {
                    const dummyData = DUMMY_ASSET_DATA[asset.asset_symbol] || {
                      symbol: (asset.asset_symbol ?? "").split(" ")[0],
                      price: 0,
                      change: "+0.00%",
                    };

                    return (
                      <div
                        key={asset.favorite_asset_id}
                        className="bg-white dark:bg-[#1D1D23] rounded-xl sm:rounded-2xl lg:rounded-2xl p-3 sm:p-4 lg:p-4 flex items-center gap-2 sm:gap-3 lg:gap-3 border border-[#E8EFF5] dark:border-[#35353E] relative flex-shrink-0 min-w-[200px] sm:min-w-[220px] lg:min-w-[250px]"
                      >
                        <div className="w-8 h-8 sm:w-8 sm:h-8 lg:w-8 lg:h-8 rounded-full flex-shrink-0">
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
                          <div className="font-medium text-[#051015] dark:text-white truncate text-sm sm:text-base lg:text-base">
                            {dummyData.symbol}
                          </div>
                          <div className="text-xs text-[#788099] dark:text-[#788099] truncate">
                            {asset.asset_symbol}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text:[#051015] dark:text-white whitespace-nowrap text-sm sm:text-base lg:text-base">
                            $
                            {dummyData.price.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 8,
                            })}
                          </div>
                          <div
                            className={`text-xs whitespace-nowrap ${dummyData.change.startsWith("+")
                              ? "text-[#1D8751]"
                              : "text-[#1D8751]"
                              }`}
                          >
                            {dummyData.change}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Then render local favorites that aren't in remote favorites */}
                  {allFavoriteMarketsToShow.map((market) => {
                    const priceChange = market.price_change_percentage_24h ?? 0;
                    const isPositive = priceChange >= 0;

                    return (
                      <div
                        key={`local-${market.id}`}
                        className="bg-white dark:bg-[#1D1D23] rounded-xl sm:rounded-2xl lg:rounded-2xl p-3 sm:p-4 lg:p-4 flex items-center gap-2 sm:gap-3 lg:gap-3 border border-[#E8EFF5] dark:border-[#35353E] relative flex-shrink-0 min-w-[200px] sm:min-w-[220px] lg:min-w-[250px]"
                      >
                        <div className="w-8 h-8 sm:w-8 sm:h-8 lg:w-8 lg:h-8 rounded-full flex-shrink-0">
                          <CoinIcon image={market.image} symbol={market.symbol} size={32} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[#051015] dark:text-white truncate text-sm sm:text-base lg:text-base">
                            {market.symbol.toUpperCase()}
                          </div>
                          <div className="text-xs text-[#788099] dark:text-[#788099] truncate">
                            {market.name}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text:[#051015] dark:text-white whitespace-nowrap text-sm sm:text-base lg:text-base">
                            {formatPrice(market.current_price)}
                          </div>
                          <div
                            className={`text-xs whitespace-nowrap ${isPositive ? "text-[#1D8751]" : "text-[#FF6B6B]"
                              }`}
                          >
                            {formatPercentage(priceChange)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="col-span-3 text-center text-gray-500 text-sm sm:text-base lg:text-base">
                  No favorite assets found. Add some to see them here.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="mb-4">{renderFilterTags()}</div>
        )}

        {/* Table Section with rounded border */}
        <div
          className={`rounded-xl sm:rounded-xl lg:rounded-2xl border border-gray-200 dark:border-[#35353E] overflow-hidden bg-white dark:bg-[#18181D] shadow-lg ${showFullLayout ? "max-w-[1400px] mx-auto" : ""
            }`}
        >
          {loading && markets.length === 0 ? (
            <div className="flex items-center justify-center py-8 sm:py-10 lg:py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#13B562]"></div>
              <span className="ml-3 text-gray-900 dark:text-[#fff] text-xs sm:text-sm lg:text-base">
                Loading market data...
              </span>
            </div>
          ) : (
            <>
              {/* Mobile: Card-based layout */}
              <div className="block sm:hidden space-y-3 p-2 sm:p-3">
                {paginatedMarkets.map((market, idx) => (
                  <div
                    key={market.id}
                    onClick={() => handleRowClick(market.id)}
                    className={`bg-white dark:bg-[#1D1D23] rounded-lg p-4 border border-gray-200 dark:border-[#35353E] cursor-pointer transition-colors ${selectedCoinId === market.id
                      ? "border-l-4 border-[#13B562] bg-gray-50 dark:bg-[#23232a]"
                      : ""
                      }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <CoinIcon
                          image={market.image}
                          symbol={market.symbol}
                          size={32}
                        />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {market.symbol.toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-[#788099]">
                            {market.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="cursor-pointer">
                          <ChartIcon />
                        </span>
                        <span
                          className="cursor-pointer hover:opacity-70 transition-opacity"
                          onClick={(e) =>
                            handleToggleFavorite(e, market.symbol, market.name)
                          }
                          title={
                            isMarketFavorited(market.symbol, market.name)
                              ? "Remove from favorites"
                              : "Add to favorites"
                          }
                        >
                          <StarIcon
                            filled={isMarketFavorited(market.symbol, market.name)}
                          />
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-600 dark:text-[#788099] mb-1">Price</div>
                        <div className="text-[#1D8751] font-medium">{formatPrice(market.current_price)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 dark:text-[#788099] mb-1">24h Change</div>
                        <div className={`font-medium ${market.price_change_percentage_24h !== null &&
                          market.price_change_percentage_24h >= 0
                          ? "text-[#13B562]"
                          : "text-[#FF6B6B]"
                          }`}>
                          {formatPercentage(market.price_change_percentage_24h)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 dark:text-[#788099] mb-1">24h Volume</div>
                        <div className="text-gray-900 dark:text-white">{formatVolume(market.total_volume)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 dark:text-[#788099] mb-1">Market Cap</div>
                        <div className="text-gray-900 dark:text-white">{formatMarketCap(market.market_cap)}</div>
                      </div>
                    </div>
                    {/* Expanded details for mobile */}
                    {selectedCoinId === market.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#35353E]">
                        {loadingDetails ? (
                          <div className="flex items-center gap-2 text-[#13B562] text-sm">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#13B562]"></div>
                            Loading details...
                          </div>
                        ) : coinDetails ? (
                          <div className="flex flex-col gap-3">
                            <Link
                              href={{
                                pathname: "/market/chart",
                                query: { id: market.id },
                              }}
                              className="border border-[#1D8751] rounded-full p-2.5 px-4 text-[#1D8751] flex gap-2 items-center justify-center cursor-pointer hover:bg-[#1D8751]/10 min-h-[44px] text-sm"
                            >
                              <ChartIcon />
                              <p>View Chart</p>
                            </Link>
                            <Link href="/dashboard/express-exchange" className="w-full">
                              <Button className="w-full border border-[#1D8751] rounded-full p-2.5 px-4 text-[#1D8751] flex gap-2 items-center justify-center cursor-pointer hover:bg-[#1D8751]/10 transition-colors min-h-[44px] text-sm">
                                <ArrowLeftRight className="w-4 h-5" />
                                <p>Exchange</p>
                              </Button>
                            </Link>
                            <Link href="/dashboard/p2p" className="w-full">
                              <Button className="w-full border border-[#1D8751] rounded-full p-2.5 px-4 text-[#1D8751] flex gap-2 items-center justify-center cursor-pointer hover:bg-[#1D8751]/10 transition-colors min-h-[44px] text-sm">
                                <Users className="w-4 h-4" />
                                <p>P2P</p>
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <div className="text-red-500 flex items-center gap-2 text-sm">
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
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop: Table layout */}
              <div className="hidden sm:block overflow-x-auto scrollbar-thin scroll-smooth">
                <table className="w-full border-collapse min-w-[800px] table-fixed">
                  <thead>
                    <tr>
                      <th className="text-gray-900 dark:text-[#fff] bg-gray-50 dark:bg-[#35353E] px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-4 text-left font-semibold border-b-2 border-gray-200 dark:border-[#35353E] text-xs sm:text-sm lg:text-base">
                        Name
                      </th>
                      <th className="text-gray-900 dark:text-[#fff] bg-gray-50 dark:bg-[#35353E] px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-4 text-right font-semibold border-b-2 border-gray-200 dark:border-[#35353E] text-xs sm:text-sm lg:text-base">
                        <div className="flex items-center justify-end gap-1 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" onClick={() => handleSort("price")}>
                          Price
                          {getSortIcon("price")}
                        </div>
                      </th>
                      <th className="text-gray-900 dark:text-[#fff] bg-gray-50 dark:bg-[#35353E] px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-4 text-center font-semibold border-b-2 border-gray-200 dark:border-[#35353E] text-xs sm:text-sm lg:text-base">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" onClick={() => handleSort("24h_volume")}>
                            24h
                            {getSortIcon("24h_volume")}
                          </div>
                          <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" onClick={() => handleSort("change")}>
                            Change
                            {getSortIcon("change")}
                          </div>
                        </div>
                      </th>
                      <th className="text-gray-900 dark:text-[#fff] bg-gray-50 dark:bg-[#35353E] px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-4 text-left font-semibold border-b-2 border-gray-200 dark:border-[#35353E] text-xs sm:text-sm lg:text-base">
                        <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" onClick={() => handleSort("24h_volume")}>
                          24 Volume
                          {getSortIcon("24h_volume")}
                        </div>
                      </th>
                      <th className="text-gray-900 dark:text-[#fff] bg-gray-50 dark:bg-[#35353E] px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-4 text-left font-semibold border-b-2 border-gray-200 dark:border-[#35353E] text-xs sm:text-sm lg:text-base">
                        <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" onClick={() => handleSort("market_cap")}>
                          Market Cap
                          {getSortIcon("market_cap")}
                        </div>
                      </th>
                      <th className="text-gray-900 dark:text-[#fff] bg-gray-50 dark:bg-[#35353E] px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-4 text-left font-semibold border-b-2 border-gray-200 dark:border-[#35353E] text-xs sm:text-sm lg:text-base">
                        More
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMarkets.map((market, idx) => {
                      const priceChange = market.price_change_percentage_24h;
                      const isPositiveChange =
                        priceChange !== null && priceChange >= 0;

                      return (
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
                            <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-3 text-gray-900 dark:text-[#fff] align-middle">
                              <div className="flex items-center gap-2 sm:gap-3 lg:gap-3">
                                <span className="w-6 h-6 sm:w-7 sm:h-7 lg:w-7 lg:h-7 flex items-center flex-shrink-0">
                                  <CoinIcon
                                    image={market.image}
                                    symbol={market.symbol}
                                    size={28}
                                  />
                                </span>
                                <div className="min-w-0">
                                  <div className="font-semibold flex flex-row text-xs sm:text-sm lg:text-base items-center gap-1">
                                    <div>
                                      {market.symbol.toUpperCase()}
                                    </div>
                                    <div className="text-[10px] sm:text-xs lg:text-xs text-gray-600 dark:text-[#788099] ">
                                      {market.name}
                                    </div>
                                  </div>

                                </div>
                              </div>
                            </td>
                            <td className="text-right text-[#1D8751] font-medium px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-3 text-xs sm:text-sm lg:text-base whitespace-nowrap align-middle">
                              {formatPrice(market.current_price)}
                            </td>
                            <td
                              className={`font-medium px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-3 text-xs sm:text-sm lg:text-base whitespace-nowrap text-center align-middle ${isPositiveChange ? "text-[#13B562]" : "text-[#FF6B6B]"
                                }`}
                            >
                              <div className="flex items-center justify-center gap-1">
                                {priceChange !== null && (
                                  isPositiveChange ? (
                                    <ArrowUpRight className="w-4 h-4" />
                                  ) : (
                                    <ArrowDownRight className="w-4 h-4" />
                                  )
                                )}
                                {formatPercentage(priceChange)}
                              </div>
                            </td>
                            <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-3 text-xs sm:text-sm lg:text-base whitespace-nowrap">
                              {formatVolume(market.total_volume)}
                            </td>
                            <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-3 text-xs sm:text-sm lg:text-base whitespace-nowrap">
                              {formatMarketCap(market.market_cap)}
                            </td>
                            <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-3 flex items-center gap-2 sm:gap-3 lg:gap-3">
                              <span className="cursor-pointer">
                                <ChartIcon />
                              </span>
                              <span
                                className="cursor-pointer"
                                onClick={(e) =>
                                  handleToggleFavorite(e, market.symbol, market.name)
                                }
                              >
                                <StarIcon
                                  filled={isMarketFavorited(market.symbol, market.name)}
                                />
                              </span>
                            </td>
                          </tr>
                          {/* Details row */}
                          {selectedCoinId === market.id && (
                            <tr>
                              <td
                                colSpan={tableHeaders.length}
                                className="bg-gray-100 dark:bg-[#23232a] px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-4 border-t border-gray-200 dark:border-[#35353E]"
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
                                    <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 lg:gap-4">
                                      <Link
                                        href={{
                                          pathname: "/market/chart",
                                          query: { id: market.id },
                                        }}
                                        className="border border-[#1D8751] rounded-full p-2.5 sm:p-2 lg:p-2 px-4 text-[#1D8751] flex gap-2 items-center justify-center cursor-pointer hover:bg-[#1D8751]/10 text-sm sm:text-base lg:text-base min-h-[44px] sm:min-h-0 lg:min-h-0"
                                      >
                                        <ChartIcon />
                                        <p>View Chart</p>
                                      </Link>
                                      <Link href="/dashboard/express-exchange">
                                        <Button className="border border-[#1D8751] rounded-full p-2.5 sm:p-2 lg:p-2 px-4 text-[#1D8751] flex gap-2 items-center justify-center cursor-pointer hover:bg-[#1D8751]/10 transition-colors text-sm sm:text-base lg:text-base min-h-[44px] sm:min-h-0 lg:min-h-0">
                                          <ArrowLeftRight className="w-4 h-4 sm:w-4 sm:h-5 lg:w-4 lg:h-5" />
                                          <p>Exchange</p>
                                        </Button>
                                      </Link>
                                      <Link href="/dashboard/p2p">
                                        <Button className="border border-[#1D8751] rounded-full p-2.5 sm:p-2 lg:p-2 px-4 text-[#1D8751] flex gap-2 items-center justify-center cursor-pointer hover:bg-[#1D8751]/10 transition-colors text-sm sm:text-base lg:text-base min-h-[44px] sm:min-h-0 lg:min-h-0">
                                          <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5" />
                                          <p>P2P</p>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-[#35353E] bg-white dark:bg-[#18181D]">
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredMarkets.length)} of {filteredMarkets.length} markets
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${currentPage === 1
                        ? "opacity-50 cursor-not-allowed border-gray-300 dark:border-[#35353E] bg-gray-100 dark:bg-[#161B22] text-gray-400 dark:text-gray-500"
                        : "border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#161B22] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]"
                        }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          // Show first page, last page, current page, and pages around current
                          if (page === 1 || page === totalPages) return true;
                          if (Math.abs(page - currentPage) <= 1) return true;
                          return false;
                        })
                        .map((page, index, array) => {
                          // Add ellipsis if there's a gap
                          const prevPage = array[index - 1];
                          const showEllipsisBefore = prevPage && page - prevPage > 1;

                          return (
                            <React.Fragment key={page}>
                              {showEllipsisBefore && (
                                <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
                              )}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${currentPage === page
                                  ? "bg-[#1D8751] text-white border-[#1D8751]"
                                  : "border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#161B22] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]"
                                  }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          );
                        })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${currentPage === totalPages
                        ? "opacity-50 cursor-not-allowed border-gray-300 dark:border-[#35353E] bg-gray-100 dark:bg-[#161B22] text-gray-400 dark:text-gray-500"
                        : "border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#161B22] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]"
                        }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
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
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="bg-[#23242B] rounded-xl p-4 sm:p-6 lg:p-6 shadow-lg w-full max-w-sm">
              <h2 className="text-base sm:text-lg lg:text-lg font-semibold text-white mb-2">
                Remove Favorite
              </h2>
              <p className="text-sm sm:text-base lg:text-base text-[#9CA3AF] mb-4 leading-relaxed">
                Are you sure you want to remove{" "}
                <span className="font-bold text-white">
                  {pendingRemoveAsset.asset_symbol}
                </span>{" "}
                from your favorites?
              </p>
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 lg:gap-3">
                <button
                  className="px-4 py-2.5 sm:py-2 lg:py-2 rounded bg-gray-700 text-white hover:bg-gray-600 text-sm sm:text-base lg:text-base min-h-[44px] sm:min-h-0 lg:min-h-0"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingRemoveAsset(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2.5 sm:py-2 lg:py-2 rounded bg-[#1D8751] text-white hover:bg-[#166c3a] text-sm sm:text-base lg:text-base min-h-[44px] sm:min-h-0 lg:min-h-0"
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
