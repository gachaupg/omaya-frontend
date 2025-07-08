/**
 * Custom hook for managing live cryptocurrency market data
 */
import { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  fetchMarketsAsync,
  fetchTopMarketsAsync,
  fetchTrendingMarketsAsync,
  searchMarketsAsync,
  selectMarkets,
  selectMarketsLoading,
  selectMarketsError,
  selectMarketsLastUpdated,
  clearMarkets,
  clearError,
} from "../slices/marketSlice";
import { MarketDataParams } from "../types";

interface UseLiveMarketsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  initialParams?: MarketDataParams;
}

export const useLiveMarkets = (options: UseLiveMarketsOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds default
    initialParams = {},
  } = options;

  const dispatch = useDispatch<AppDispatch>();
  const markets = useSelector(selectMarkets);
  const loading = useSelector(selectMarketsLoading);
  const error = useSelector(selectMarketsError);
  const lastUpdated = useSelector(selectMarketsLastUpdated);

  // Fetch markets with custom parameters
  const fetchMarkets = useCallback(
    (params: MarketDataParams = {}) => {
      dispatch(fetchMarketsAsync({ ...initialParams, ...params }));
    },
    [dispatch, initialParams]
  );

  // Fetch top markets
  const fetchTopMarkets = useCallback(
    (limit: number = 20, currency: string = "usd") => {
      dispatch(fetchTopMarketsAsync({ limit, currency }));
    },
    [dispatch]
  );

  // Fetch trending markets
  const fetchTrendingMarkets = useCallback(
    (currency: string = "usd") => {
      dispatch(fetchTrendingMarketsAsync(currency));
    },
    [dispatch]
  );

  // Search markets
  const searchMarkets = useCallback(
    (query: string, currency: string = "usd") => {
      if (query.trim()) {
        dispatch(searchMarketsAsync({ query: query.trim(), currency }));
      }
    },
    [dispatch]
  );

  // Clear markets
  const clearMarketsData = useCallback(() => {
    dispatch(clearMarkets());
  }, [dispatch]);

  // Clear error
  const clearErrorData = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Initialize data fetch and auto refresh
  useEffect(() => {
    // Initial fetch
    dispatch(fetchMarketsAsync({ ...initialParams }));

    // Set up auto refresh if enabled
    if (autoRefresh) {
      const timer = setInterval(() => {
        dispatch(fetchMarketsAsync({ ...initialParams }));
      }, refreshInterval);

      // Cleanup function
      return () => {
        clearInterval(timer);
      };
    }
  }, [dispatch, initialParams, autoRefresh, refreshInterval]);

  return {
    // Data
    markets,
    loading,
    error,
    lastUpdated,

    // Actions
    fetchMarkets,
    fetchTopMarkets,
    fetchTrendingMarkets,
    searchMarkets,
    clearMarkets: clearMarketsData,
    clearError: clearErrorData,

    // Auto refresh controls (simplified)
    startAutoRefresh: () => {
      dispatch(fetchMarketsAsync({ ...initialParams }));
    },
    stopAutoRefresh: () => {
      // Auto refresh is handled by the useEffect cleanup
    },
    isAutoRefreshing: autoRefresh,
  };
};

// Specialized hooks for common use cases
export const useTopMarkets = (limit: number = 20, currency: string = "usd") => {
  const dispatch = useDispatch<AppDispatch>();
  const markets = useSelector(selectMarkets);
  const loading = useSelector(selectMarketsLoading);
  const error = useSelector(selectMarketsError);
  const lastUpdated = useSelector(selectMarketsLastUpdated);

  const fetchTopMarkets = useCallback(() => {
    dispatch(fetchTopMarketsAsync({ limit, currency }));
  }, [dispatch, limit, currency]);

  useEffect(() => {
    dispatch(fetchTopMarketsAsync({ limit, currency }));
  }, [dispatch, limit, currency]);

  return {
    markets,
    loading,
    error,
    lastUpdated,
    refetch: fetchTopMarkets,
  };
};

export const useTrendingMarkets = (currency: string = "usd") => {
  const dispatch = useDispatch<AppDispatch>();
  const markets = useSelector(selectMarkets);
  const loading = useSelector(selectMarketsLoading);
  const error = useSelector(selectMarketsError);
  const lastUpdated = useSelector(selectMarketsLastUpdated);

  const fetchTrendingMarkets = useCallback(() => {
    dispatch(fetchTrendingMarketsAsync(currency));
  }, [dispatch, currency]);

  useEffect(() => {
    dispatch(fetchTrendingMarketsAsync(currency));
  }, [dispatch, currency]);

  return {
    markets,
    loading,
    error,
    lastUpdated,
    refetch: fetchTrendingMarkets,
  };
};
