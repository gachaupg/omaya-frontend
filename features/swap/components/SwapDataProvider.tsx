"use client";
import { useEffect, ReactNode, useRef } from "react";
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
  const staleRefreshTriggeredRef = useRef(false);
  const { supportedAssets, loading } = useSelector(
    (state: RootState) => state.swap
  );

  useEffect(() => {
    const hasAssets = supportedAssets.length > 0;
    if (hasAssets) {
      staleRefreshTriggeredRef.current = false;
      logger.debug(
        "[SwapDataProvider] Swap assets already available, using cached data"
      );
      return;
    }

    // Normal initial load path
    if (!loading) {
      logger.info("[SwapDataProvider] Fetching swap supported assets...");
      dispatch(fetchSupportedAssets(false))
        .unwrap()
        .then(() => {
          logger.info("[SwapDataProvider] Swap assets loaded successfully");
        })
        .catch((error) => {
          logger.error("[SwapDataProvider] Error loading swap assets", error);
        });
      return;
    }

    // Recovery path: when Redux rehydrates with loading=true and empty assets,
    // force one refresh so the widget does not stay on skeleton forever.
    if (loading && !staleRefreshTriggeredRef.current) {
      staleRefreshTriggeredRef.current = true;
      logger.warn(
        "[SwapDataProvider] Detected stale swap loading state, forcing refresh"
      );
      dispatch(fetchSupportedAssets(true))
        .unwrap()
        .catch((error) => {
          logger.error(
            "[SwapDataProvider] Forced refresh failed for supported assets",
            error
          );
        })
        .finally(() => {
          staleRefreshTriggeredRef.current = false;
        });
    }
  }, [dispatch, supportedAssets, loading]);

  return <>{children}</>;
};
