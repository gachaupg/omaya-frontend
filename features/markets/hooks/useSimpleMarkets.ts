/**
 * Simplified markets hook without complex state management
 * This version avoids the infinite re-render issues
 */
import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import {
  fetchTopMarketsAsync,
  selectMarkets,
  selectMarketsLoading,
  selectMarketsError,
  selectMarketsLastUpdated,
  clearError,
} from "../slices/marketSlice";

export const useSimpleMarkets = (limit: number = 100) => {
  const dispatch = useDispatch<AppDispatch>();
  const markets = useSelector(selectMarkets);
  const loading = useSelector(selectMarketsLoading);
  const error = useSelector(selectMarketsError);
  const lastUpdated = useSelector(selectMarketsLastUpdated);

  // Fetch markets function
  const fetchMarkets = useCallback(() => {
    dispatch(fetchTopMarketsAsync({ limit, currency: "usd" }));
  }, [dispatch, limit]);

  // Clear error function
  const clearErrorData = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Initial fetch
  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMarkets();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchMarkets]);

  return {
    markets,
    loading,
    error,
    lastUpdated,
    refetch: fetchMarkets,
    clearError: clearErrorData,
  };
};
