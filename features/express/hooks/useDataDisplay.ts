import { useEffect, useMemo, useState } from 'react';

import { logger } from '@/lib/utils/logger';

interface UseDataDisplayProps<T> {
  data: T[] | null | undefined;
  loading: boolean;
  error: string | null;
  fallbackData?: T[];
  dataName: string;
}

interface UseDataDisplayReturn<T> {
  displayData: T[];
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  isEmpty: boolean;
  shouldShowLoading: boolean;
  shouldShowData: boolean;
}

/**
 * Custom hook to handle consistent data display logic
 * Always shows cached data when available, regardless of loading state
 */
export function useDataDisplay<T>({
  data,
  loading,
  error,
  fallbackData = [],
  dataName,
}: UseDataDisplayProps<T>): UseDataDisplayReturn<T> {
  return useMemo(() => {
    // Determine what data to display
    // Important: `data` can be an empty array (`[]`), which is truthy.
    // If we treat it as "real data", `displayData` becomes `[]` and we never show fallback assets.
    // So: when `data` is an array but empty, use fallbackData instead.
    const displayData = Array.isArray(data)
      ? data.length
        ? data
        : fallbackData
      : data || fallbackData;
    const hasData = displayData && displayData.length > 0;
    const hasError = !!error;
    const isEmpty = !hasData;
    
    // Show loading only if no cached data is available and we're currently loading
    const shouldShowLoading = loading && !hasData;
    
    // Show data if we have any data available (cached or fresh)
    const shouldShowData = hasData;
    
    logger.debug('general', `📊 ${dataName} Display State:`, {
      hasData,
      hasError,
      isEmpty,
      shouldShowLoading,
      shouldShowData,
      dataLength: data?.length || 0,
      fallbackLength: fallbackData?.length || 0,
      displayLength: displayData?.length || 0,
      loading,
    });

    return {
      displayData: displayData || [],
      isLoading: shouldShowLoading,
      hasError,
      errorMessage: error,
      isEmpty,
      shouldShowLoading,
      shouldShowData,
    };
  }, [data, loading, error, fallbackData, dataName]);
}

/**
 * Hook specifically for assets data with common fallback assets
 */
export function useAssetsDisplay(
  exchangeAssets: any[] | null | undefined,
  swapAssets: any[] | null | undefined,
  exchangeLoading: boolean,
  swapLoading: boolean,
  exchangeError: string | null,
  swapError: string | null
) {
  const ASSETS_CACHE_KEY = "omaya_real_assets_cache_v1";
  const ASSETS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
  const areSameAssetIds = (a: any[], b: any[]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (String(a[i]?.asset_id || "") !== String(b[i]?.asset_id || "")) {
        return false;
      }
    }
    return true;
  };

  // Combine both asset sources
  const combinedAssets = useMemo(() => {
    const assets = [];
    
    // Add exchange assets if available
    if (exchangeAssets && exchangeAssets.length > 0) {
      assets.push(...exchangeAssets);
    }
    
    // Add swap assets if available (avoid duplicates)
    if (swapAssets && swapAssets.length > 0) {
      const existingSymbols = new Set(assets.map(asset => asset?.ticker || asset?.symbol));
      const uniqueSwapAssets = swapAssets.filter(asset => 
        !existingSymbols.has(asset?.ticker || asset?.symbol)
      );
      assets.push(...uniqueSwapAssets);
    }
    
    return assets;
  }, [exchangeAssets, swapAssets]);

  // Load real cached assets (never synthetic fallback assets)
  const [cachedAssets, setCachedAssets] = useState<any[]>([]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(ASSETS_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { ts?: number; assets?: any[] };
      const ts = Number(parsed?.ts || 0);
      const assets = Array.isArray(parsed?.assets) ? parsed.assets : [];
      const isFresh = Date.now() - ts <= ASSETS_CACHE_TTL_MS;
      if (!isFresh) {
        localStorage.removeItem(ASSETS_CACHE_KEY);
        return;
      }
      // Keep only assets that look like real backend rows (UUID asset_id).
      const uuidAssets = assets.filter((a: any) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          String(a?.asset_id || "")
        )
      );
      if (uuidAssets.length > 0) {
        setCachedAssets((prev) =>
          areSameAssetIds(prev, uuidAssets) ? prev : uuidAssets
        );
      }
    } catch {
      // Ignore bad cache entries
    }
  }, []);

  // Persist fresh real assets to cache.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!Array.isArray(combinedAssets) || combinedAssets.length === 0) return;
    const uuidAssets = combinedAssets.filter((a: any) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        String(a?.asset_id || "")
      )
    );
    if (uuidAssets.length === 0) return;
    try {
      setCachedAssets((prev) => {
        if (areSameAssetIds(prev, uuidAssets)) {
          return prev;
        }
        localStorage.setItem(
          ASSETS_CACHE_KEY,
          JSON.stringify({ ts: Date.now(), assets: uuidAssets })
        );
        return uuidAssets;
      });
    } catch {
      // Ignore storage errors
    }
  }, [combinedAssets]);

  const isAnyLoading = exchangeLoading || swapLoading;
  const hasAnyError = !!exchangeError || !!swapError;
  const errorMessage = exchangeError || swapError;
  const dataToDisplay =
    Array.isArray(combinedAssets) && combinedAssets.length > 0
      ? combinedAssets
      : cachedAssets;

  return useDataDisplay({
    data: dataToDisplay,
    loading: isAnyLoading,
    error: hasAnyError ? errorMessage : null,
    fallbackData: [],
    dataName: 'Assets',
  });
}

/**
 * Hook specifically for payment methods data
 * Shows fallback data immediately to prevent UI delays
 */
export function usePaymentMethodsDisplay(
  paymentMethods: any[] | null | undefined,
  loading: boolean,
  error: string | null
) {
  // Common fallback payment methods - empty array to avoid showing fake data
  const fallbackPaymentMethods = useMemo(() => [], []);

  const result = useDataDisplay({
    data: paymentMethods,
    loading,
    error,
    fallbackData: fallbackPaymentMethods,
    dataName: 'Payment Methods',
  });

  // Override isLoading to be false if we have any data (even cached)
  // This prevents the select from being disabled when showing cached data
  return {
    ...result,
    isLoading: loading && !paymentMethods?.length,
  };
}
