"use client";
import { useEffect, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  getFavoriteAssets,
  fetchExchangeStatistics,
} from "../slices/exchangeSlice";
import { logger } from "@/lib/logger";

interface ExchangeDataProviderProps {
  children: ReactNode;
}

/**
 * ExchangeDataProvider - Centralized data fetching for Exchange feature
 *
 * This provider fetches all common Exchange data once at the parent level,
 * preventing duplicate API calls from child components.
 *
 * Benefits:
 * - Eliminates duplicate API calls
 * - Parallel API calls for faster loading
 * - Single source of truth for exchange data
 * - Child components just consume from Redux
 */
export const ExchangeDataProvider = ({
  children,
}: ExchangeDataProviderProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { statistics, loading } = useSelector(
    (state: RootState) => state.exchange
  );

  useEffect(() => {
    if (!isAuthenticated) {
      logger.debug(
        "[ExchangeDataProvider] User not authenticated, skipping data fetch"
      );
      return;
    }

    // Only fetch if we don't have statistics and we're not already loading
    const needsData = !statistics && !loading;

    if (needsData) {
      logger.info("[ExchangeDataProvider] Fetching exchange data...");

      // Parallel API calls for maximum speed
      Promise.all([
        dispatch(getFavoriteAssets()),
        dispatch(fetchExchangeStatistics()),
      ])
        .then(() => {
          logger.info(
            "[ExchangeDataProvider] All exchange data loaded successfully"
          );
        })
        .catch((error) => {
          logger.error(
            "[ExchangeDataProvider] Error loading exchange data",
            error
          );
        });
    } else {
      logger.debug(
        "[ExchangeDataProvider] Exchange data already available, using cached data"
      );
    }
  }, [isAuthenticated, dispatch, statistics, loading]);

  return <>{children}</>;
};
