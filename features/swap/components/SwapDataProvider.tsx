"use client";
import { useEffect, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchSupportedAssets } from "../slices/swapSlice";
import { logger } from "@/lib/logger";

interface SwapDataProviderProps {
  children: ReactNode;
}

/**
 * SwapDataProvider - Centralized data fetching for Swap feature
 *
 * This provider fetches all common Swap data once at the parent level,
 * preventing duplicate API calls from child components.
 *
 * Benefits:
 * - Eliminates duplicate API calls
 * - Caches supported assets for fast navigation
 * - Single source of truth for swap data
 * - Child components just consume from Redux
 */
export const SwapDataProvider = ({ children }: SwapDataProviderProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { supportedAssets, loading } = useSelector(
    (state: RootState) => state.swap
  );

  useEffect(() => {
    // Only fetch if we don't have assets and we're not already loading
    const needsData = supportedAssets.length === 0 && !loading;

    if (needsData) {
      logger.info("[SwapDataProvider] Fetching swap supported assets...");

      // Add timeout to prevent infinite loading
      const fetchPromise = dispatch(fetchSupportedAssets(false));
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Asset fetch timeout")), 10000)
      );

      Promise.race([fetchPromise, timeoutPromise])
        .then(() => {
          logger.info("[SwapDataProvider] Swap assets loaded successfully");
        })
        .catch((error) => {
          logger.error("[SwapDataProvider] Error loading swap assets", error);
        });
    } else {
      logger.debug(
        "[SwapDataProvider] Swap assets already available, using cached data"
      );
    }
  }, [dispatch, supportedAssets, loading]);

  return <>{children}</>;
};
