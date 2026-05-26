import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { AppDispatch } from '@/store';
import { REAL_ASSETS_CACHE_TTL_MS } from '@/lib/constants/realAssetsCache';
import { logger } from '@/lib/utils/logger';
import {
  clearSupportedTokensCachesOnReload,
  shouldForceSupportedTokensRefetch,
} from '@/lib/utils/supportedTokensCache';
import { idbDel, idbGet, idbSet } from '@/features/express/utils/indexedDbKv';
import { fetchAssets } from '@/features/exchange/slices/exchangeSlice';
import { fetchSupportedAssets } from '@/features/swap/slices/swapSlice';

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
  const dispatch = useDispatch<AppDispatch>();
  const ASSETS_CACHE_KEY = "omaya_real_assets_cache_v1";
  const ASSETS_CACHE_TTL_MS = REAL_ASSETS_CACHE_TTL_MS;
  // Keep localStorage payload bounded to avoid QuotaExceededError crashes.
  const ASSETS_CACHE_MAX_ITEMS = 500;

  const areSameAssetIds = (a: any[], b: any[]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (String(a[i]?.asset_id || "") !== String(b[i]?.asset_id || "")) {
        return false;
      }
    }
    return true;
  };

  const getAssetNetwork = (asset: any): string => {
    const direct = String(asset?.network || "").trim().toLowerCase();
    if (direct) return direct;
    const fromNetworks = String(
      asset?.networks?.[0]?.network_type || asset?.networks?.[0]?.network_id || ""
    )
      .trim()
      .toLowerCase();
    return fromNetworks;
  };

  const getAssetTicker = (asset: any): string =>
    String(asset?.ticker || asset?.symbol || "").trim().toLowerCase();

  const getPinnedOrderRank = (asset: any): number => {
    const ticker = getAssetTicker(asset);
    const network = getAssetNetwork(asset);
    if (ticker === "usdt" && network === "bsc") return 0;
    if (ticker === "usdc" && network === "bsc") return 1;
    if (ticker === "fxp") return 2;
    return 99;
  };

  const normalizeDisplayAsset = (asset: any) => {
    const ticker = String(asset?.ticker || asset?.symbol || "").trim().toUpperCase();
    const network = getAssetNetwork(asset);
    return {
      ...asset,
      ticker: ticker || asset?.ticker,
      symbol: ticker || asset?.symbol,
      network: network || asset?.network || "",
    };
  };

  const shrinkAssetForCache = (asset: any) => {
    const ticker = String(asset?.ticker || asset?.symbol || "").trim().toUpperCase();
    const network = getAssetNetwork(asset);
    return {
      asset_id: asset?.asset_id,
      ticker: ticker || asset?.ticker || asset?.symbol,
      symbol: ticker || asset?.symbol || asset?.ticker,
      name: asset?.name,
      network: network || asset?.network || "",
      image_url: asset?.image_url ?? asset?.asset_image ?? asset?.icon ?? asset?.icon_url ?? (asset as any)?.image ?? null,
      range_commissions: Array.isArray(asset?.range_commissions)
        ? asset.range_commissions.map((c: any) => ({ commission: c?.commission }))
        : undefined,
    };
  };

  const safeWriteAssetsCache = async (assetsToCache: any[]) => {
    const ok = await idbSet(ASSETS_CACHE_KEY, { ts: Date.now(), assets: assetsToCache });
    if (!ok) {
      logger.warn("general", "Assets cache write failed (IndexedDB)", {
        key: ASSETS_CACHE_KEY,
      });
    }
  };

  // Combine both asset sources
  const combinedAssets = useMemo(() => {
    const assets: any[] = [];
    
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
    
    const normalized = assets.map(normalizeDisplayAsset);

    return normalized.sort((a, b) => {
      const rankA = getPinnedOrderRank(a);
      const rankB = getPinnedOrderRank(b);
      if (rankA !== rankB) return rankA - rankB;
      return 0;
    });
  }, [exchangeAssets, swapAssets]);

  // Load real cached assets (never synthetic fallback assets)
  const [cachedAssets, setCachedAssets] = useState<any[]>([]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    (async () => {
      if (shouldForceSupportedTokensRefetch()) {
        await clearSupportedTokensCachesOnReload();
        dispatch(fetchAssets(true));
        dispatch(fetchSupportedAssets({ forceRefresh: true, feature: "exchange" }));
        dispatch(fetchSupportedAssets({ forceRefresh: true, feature: "swap" }));
        return;
      }

      // 1) Try IndexedDB cache first
      const parsed = await idbGet<{ ts?: number; assets?: any[] }>(ASSETS_CACHE_KEY);
      if (!cancelled && parsed) {
        const ts = Number(parsed?.ts || 0);
        const assets = Array.isArray(parsed?.assets) ? parsed.assets : [];
        const isFresh = Date.now() - ts <= ASSETS_CACHE_TTL_MS;
        if (!isFresh) {
          await idbDel(ASSETS_CACHE_KEY);
          dispatch(fetchAssets(true));
        } else {
          const uuidAssets = assets.filter((a: any) =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              String(a?.asset_id || "")
            )
          );
          if (uuidAssets.length > 0) {
            setCachedAssets((prev) => (areSameAssetIds(prev, uuidAssets) ? prev : uuidAssets));
            return;
          }
        }
      }

      // 2) One-time migration from localStorage (older builds)
      try {
        const raw = localStorage.getItem(ASSETS_CACHE_KEY);
        if (!raw) return;
        const legacy = JSON.parse(raw) as { ts?: number; assets?: any[] };
        const ts = Number(legacy?.ts || 0);
        const assets = Array.isArray(legacy?.assets) ? legacy.assets : [];
        const isFresh = Date.now() - ts <= ASSETS_CACHE_TTL_MS;
        if (!isFresh) {
          localStorage.removeItem(ASSETS_CACHE_KEY);
          dispatch(fetchAssets(true));
          return;
        }
        const uuidAssets = assets
          .filter((a: any) =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              String(a?.asset_id || "")
            )
          )
          .slice(0, ASSETS_CACHE_MAX_ITEMS)
          .map(shrinkAssetForCache);

        if (uuidAssets.length > 0) {
          await idbSet(ASSETS_CACHE_KEY, { ts, assets: uuidAssets });
          localStorage.removeItem(ASSETS_CACHE_KEY);
          if (!cancelled) {
            setCachedAssets((prev) => (areSameAssetIds(prev, uuidAssets) ? prev : uuidAssets));
          }
        } else {
          localStorage.removeItem(ASSETS_CACHE_KEY);
        }
      } catch {
        // Ignore legacy cache issues
        try {
          localStorage.removeItem(ASSETS_CACHE_KEY);
        } catch {}
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

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
    // NOTE: don't write to localStorage inside setState updater (errors won't be caught).
    const bounded = uuidAssets.slice(0, ASSETS_CACHE_MAX_ITEMS).map(shrinkAssetForCache);
    setCachedAssets((prev) => (areSameAssetIds(prev, bounded) ? prev : bounded));
    void safeWriteAssetsCache(bounded);
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
