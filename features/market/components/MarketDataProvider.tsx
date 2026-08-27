"use client";

import { useEffect, useRef, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { fetchAssets } from "@/features/exchange/slices/exchangeSlice";
import {
  fetchAdminPaymentDetails,
  fetchUserPaymentDetails,
} from "@/features/exchange/slices/paymentSlice";
import { fetchSupportedAssets } from "@/features/swap/slices/swapSlice";
import { fetchPublicPaymentMethods } from "@/features/p2p/slices/paymentMethodsSlice";
import { hydratePaymentCacheFromIndexedDB } from "@/lib/utils/hydrateMarketDataCache";
import { logger } from "@/lib/utils/logger";

interface MarketDataProviderProps {
  children: ReactNode;
}

/**
 * Preloads and caches assets + payment methods app-wide.
 *
 * - Hydrates IndexedDB payment cache instantly (no network wait)
 * - Shows redux-persist / IndexedDB asset data via useAssetsDisplay in forms
 * - Refreshes stale data in the background without blocking the UI
 */
export function MarketDataProvider({ children }: MarketDataProviderProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const hydratedRef = useRef(false);
  const publicPreloadedRef = useRef(false);
  const authPreloadedRef = useRef(false);

  // Instant payment hydration — runs once on first client mount
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    void hydratePaymentCacheFromIndexedDB(dispatch);
  }, [dispatch]);

  // Public asset lists + payment catalog (no auth) — preload on every app entry
  useEffect(() => {
    if (publicPreloadedRef.current) return;
    publicPreloadedRef.current = true;

    logger.debug("market-data", "Preloading public supported assets + payment catalog");

    dispatch(
      fetchSupportedAssets({ forceRefresh: false, feature: "exchange" })
    ).catch(() => {});
    dispatch(
      fetchSupportedAssets({ forceRefresh: false, feature: "swap" })
    ).catch(() => {});
    dispatch(fetchPublicPaymentMethods()).catch(() => {});
  }, [dispatch]);

  // Authenticated warm-cache — thunks skip network when Redux/IndexedDB is fresh
  useEffect(() => {
    if (!isAuthenticated) {
      authPreloadedRef.current = false;
      return;
    }
    if (authPreloadedRef.current) return;
    authPreloadedRef.current = true;

    logger.debug("market-data", "Preloading authenticated market data");

    dispatch(fetchAssets(false)).catch(() => {});
    dispatch(
      fetchSupportedAssets({ forceRefresh: false, feature: "exchange" })
    ).catch(() => {});
    dispatch(fetchAdminPaymentDetails(false)).catch(() => {});
    dispatch(fetchUserPaymentDetails(false)).catch(() => {});
    dispatch(fetchPublicPaymentMethods()).catch(() => {});
  }, [isAuthenticated, dispatch]);

  return <>{children}</>;
}

export default MarketDataProvider;
