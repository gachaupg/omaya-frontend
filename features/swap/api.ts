/**
 * api.ts – auto‑generated placeholder
 */
import { del, get, patch, post, put } from "@/lib/apiClient";
import { cachedGet } from "@/lib/cachedApiClient";
import { withRetry } from "@/lib/utils/retry";
import { API_CONFIG } from "@/lib/appConfig";
import { logger } from '@/lib/utils/logger';
import { resolveSwapCreateErrorMessage } from "@/lib/utils/swapAssetValidation";
import {
  clearSupportedTokensCachesOnReload,
  shouldBypassSupportedTokensCache,
  shouldForceSupportedTokensRefetch,
} from "@/lib/utils/supportedTokensCache";

import {
  SupportedAsset,
  SwapEstimate,
  CreateSwapRequest,
  CreateSwapResponse,
  SwapStatus,
} from "./types";

type PublicAssetLike = {
  asset_id?: string;
  ticker?: string;
  symbol?: string;
  name?: string;
  image?: string;
  image_url?: string;
  network?: string;
  network_image?: string;
  network_icon?: string;
  network_icon_url?: string;
  chain_image?: string;
  legacyTicker?: string;
  legacy_ticker?: string;
  hasExternalId?: boolean;
  has_external_id?: boolean;
  isExtraIdSupported?: boolean;
  is_extra_id_supported?: boolean;
  isFiat?: boolean;
  is_fiat?: boolean;
  isStable?: boolean;
  is_stable?: boolean;
  featured?: boolean;
  supportsFixedRate?: boolean;
  supports_fixed_rate?: boolean;
};

type SupportedAssetsFeature = "swap" | "exchange";
type PaginatedResponse<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

// De-dupe concurrent pagination fetches (multiple components can mount at once).
const inFlightFetchAllPages: Partial<Record<string, Promise<any[]>>> = {};

const SWAP_PUBLIC_ASSETS_CACHE_KEY_BY_FEATURE: Record<
  SupportedAssetsFeature,
  string
> = {
  swap: "omaya_changenow_public_supported_tokens_swap_v1",
  exchange: "omaya_changenow_public_supported_tokens_exchange_v1",
};
const SWAP_PUBLIC_ASSETS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const mapPublicAssetToSupportedAsset = (
  asset: PublicAssetLike
): SupportedAsset | null => {
  const ticker = String(asset.ticker || asset.symbol || "").trim();
  if (!ticker) return null;
  const normalizedTicker = ticker.toUpperCase();
  const network = String(asset.network || "").trim().toLowerCase() || "mainnet";
  const image = String(asset.image || asset.image_url || "").trim();

  return {
    asset_id: asset.asset_id,
    ticker: normalizedTicker,
    symbol: normalizedTicker,
    name: String(asset.name || normalizedTicker).trim(),
    image_url: image || undefined,
    image: image || undefined,
    network,
    network_image: String(asset.network_image || asset.network_icon || "").trim() || undefined,
    network_icon: String(asset.network_icon || "").trim() || undefined,
    network_icon_url: String(asset.network_icon_url || "").trim() || undefined,
    chain_image: String(asset.chain_image || "").trim() || undefined,
    has_external_id: Boolean(asset.hasExternalId ?? asset.has_external_id),
    is_extra_id_supported: Boolean(
      asset.isExtraIdSupported ?? asset.is_extra_id_supported
    ),
    is_fiat: Boolean(asset.isFiat ?? asset.is_fiat),
    featured: Boolean(asset.featured),
    is_stable: Boolean(asset.isStable ?? asset.is_stable),
    supports_fixed_rate: Boolean(
      asset.supportsFixedRate ?? asset.supports_fixed_rate
    ),
    legacy_ticker: String(
      asset.legacyTicker || asset.legacy_ticker || ticker
    ).trim(),
    is_changenow_asset: true,
  };
};

const readSwapPublicAssetsCache = (
  allowStale: boolean,
  feature: SupportedAssetsFeature
): SupportedAsset[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(
      SWAP_PUBLIC_ASSETS_CACHE_KEY_BY_FEATURE[feature]
    );
    if (!raw) return [];
    const parsed = JSON.parse(raw) as {
      ts?: number;
      assets?: PublicAssetLike[];
    };
    if (!parsed || !Array.isArray(parsed.assets)) return [];

    const isFresh =
      typeof parsed.ts === "number" &&
      Date.now() - parsed.ts < SWAP_PUBLIC_ASSETS_CACHE_TTL_MS;
    if (!allowStale && !isFresh) return [];

    return parsed.assets
      .map(mapPublicAssetToSupportedAsset)
      .filter((item): item is SupportedAsset => Boolean(item));
  } catch {
    return [];
  }
};

const writeSwapPublicAssetsCache = (
  assets: PublicAssetLike[],
  feature: SupportedAssetsFeature
) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      SWAP_PUBLIC_ASSETS_CACHE_KEY_BY_FEATURE[feature],
      JSON.stringify({
        ts: Date.now(),
        assets,
      })
    );
  } catch {
    // ignore storage quota/privacy failures
  }
};

const toRelativeApiUrl = (url: string): string => {
  if (!/^https?:\/\//i.test(url)) return url;
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
};

const buildSupportedAssetsUrl = (
  endpoint: string,
  feature: SupportedAssetsFeature,
  page: number,
  pageSize: number,
  search?: string
) => {
  const query = new URLSearchParams();
  if (feature === "exchange") query.set("feature", "exchange");
  query.set("page", String(page));
  query.set("page_size", String(pageSize));
  if (search && search.trim()) query.set("search", search.trim());
  return `${endpoint}?${query.toString()}`;
};

const fetchAllPages = async <T>({
  endpoint,
  feature,
  timeout,
  search,
}: {
  endpoint: string;
  feature: SupportedAssetsFeature;
  timeout: number;
  search?: string;
}): Promise<T[]> => {
  const key = `supportedTokens:${endpoint}:${feature}:${(search || "").trim().toLowerCase() || "all"}`;
  if (inFlightFetchAllPages[key]) {
    return (await inFlightFetchAllPages[key]) as T[];
  }

  // Use a large page_size so this is usually one request.
  const pageSize = 2000;
  let nextUrl: string | null = buildSupportedAssetsUrl(
    endpoint,
    feature,
    1,
    pageSize,
    search
  );
  inFlightFetchAllPages[key] = (async () => {
    const items: T[] = [];
    while (nextUrl) {
      const response = await cachedGet<T[] | PaginatedResponse<T>>(
        toRelativeApiUrl(nextUrl),
        {
          timeout,
          cache: !shouldForceSupportedTokensRefetch(),
        }
      );
      const payload = response?.data as T[] | PaginatedResponse<T>;
      if (Array.isArray(payload)) {
        items.push(...payload);
        nextUrl = null;
        continue;
      }
      const pageItems = Array.isArray(payload?.results) ? payload.results : [];
      items.push(...pageItems);
      nextUrl = payload?.next || null;
    }
    return items;
  })().finally(() => {
    delete inFlightFetchAllPages[key];
  });

  return (await inFlightFetchAllPages[key]) as T[];
};

const fetchPublicSupportedAssetsFallback = async (
  feature: SupportedAssetsFeature = "swap"
): Promise<SupportedAsset[]> => {
  if (shouldForceSupportedTokensRefetch()) {
    await clearSupportedTokensCachesOnReload();
  }

  const freshCached = shouldForceSupportedTokensRefetch()
    ? []
    : readSwapPublicAssetsCache(false, feature);
  if (freshCached.length > 0) {
    logger.debug(
      "swap",
      `Using cached public supported-assets (${freshCached.length} assets)`
    );
    return freshCached;
  }

  try {
    const payload = await fetchAllPages<PublicAssetLike>({
      endpoint: API_CONFIG.SWAP.SUPPORTED_ASSETS_PUBLIC,
      feature,
      timeout: 180000,
    });

    const mapped = payload
      .map(mapPublicAssetToSupportedAsset)
      .filter((item): item is SupportedAsset => Boolean(item));

    if (mapped.length > 0) {
      writeSwapPublicAssetsCache(payload, feature);
      logger.warn(
        "swap",
        `Using public supported-assets fallback (${mapped.length} assets)`
      );
    }
    return mapped;
  } catch (fallbackError) {
    logger.error("swap", "Public supported-assets fallback failed", fallbackError);
    const staleCached = readSwapPublicAssetsCache(true, feature);
    return staleCached;
  }
};

export const getSupportedAssets = async (
  feature: SupportedAssetsFeature = "swap"
): Promise<SupportedAsset[]> => {
  if (shouldForceSupportedTokensRefetch()) {
    await clearSupportedTokensCachesOnReload();
  }

  // Fast path: same caching behavior as Express public assets hook.
  // Serve cached list immediately and avoid blocking UI on network timeout.
  const cachedPublicAssets = shouldForceSupportedTokensRefetch()
    ? []
    : readSwapPublicAssetsCache(false, feature);
  if (cachedPublicAssets.length > 0) {
    logger.debug(
      "swap",
      `Loaded supported assets from 1h cache (${cachedPublicAssets.length})`
    );
    return cachedPublicAssets;
  }

  return withRetry(async () => {
    try {
      const allResults = await fetchAllPages<SupportedAsset>({
        endpoint: API_CONFIG.SWAP.SUPPORTED_ASSETS,
        feature,
        timeout: 180000,
      });
      if (allResults.length > 0) {
        logger.debug('swap', `Successfully retrieved ${allResults.length} ChangeNow tokens`);
        return allResults;
      }
      return await fetchPublicSupportedAssetsFallback(feature);
    } catch (error: any) {
      console.error("Failed to fetch supported assets:", error);

      // Handle different error scenarios
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND" || error.message?.includes("Network Error")) {
        console.warn("Network connection issue, returning empty assets list");
        return [];
      }

      if (error.response?.status === 500) {
        console.warn("Server error, returning empty assets list");
        return [];
      }

      if (error.response?.status === 404) {
        console.warn("Endpoint not found, returning empty assets list");
        return await fetchPublicSupportedAssetsFallback(feature);
      }

      // For other errors, use public endpoint fallback (Express-style source)
      console.warn("Unknown error, trying public assets fallback");
      return await fetchPublicSupportedAssetsFallback(feature);
    }
  });
};

// Helper function to extract error message from API response
const extractErrorMessage = (errorData: any): string => {
  if (!errorData) return "";
  if (typeof errorData === "string") return errorData.trim();

  // Nested: { data: { message, error } }
  if (errorData.data && typeof errorData.data === "object") {
    const inner = extractErrorMessage(errorData.data);
    if (inner) return inner;
  }

  const rdTop = errorData.response_data;
  if (rdTop && typeof rdTop === "object") {
    if (typeof rdTop.message === "string" && rdTop.message.trim())
      return rdTop.message.trim();
    if (typeof rdTop.error === "string" && rdTop.error.trim())
      return rdTop.error.trim();
    if (rdTop.detail && typeof rdTop.detail === "string")
      return rdTop.detail.trim();
  }

  // Handle format: { "error": { "amount": ["Error message"] } }
  if (errorData.error && typeof errorData.error === 'object') {
    const errorFields = Object.entries(errorData.error);
    if (errorFields.length > 0) {
      const messages: string[] = [];
      for (const [field, value] of errorFields) {
        if (Array.isArray(value)) {
          messages.push(...value);
        } else if (typeof value === 'string') {
          messages.push(value);
        }
      }
      if (messages.length > 0) {
        return messages.join('. ');
      }
    }
  }
  
  // Handle format: { "error": "Exchange service error: deposit_too_small", "response_data": {...} }
  if (typeof errorData.error === "string") {
    return errorData.error;
  }

  // Handle format: { "message": "Error message" }
  if (errorData.message) {
    return errorData.message;
  }
  
  // Handle format: { "detail": "Error message" }
  if (errorData.detail) {
    return errorData.detail;
  }
  
  // Handle format: { "errors": ["Error message"] }
  if (Array.isArray(errorData.errors)) {
    return errorData.errors.join('. ');
  }

  return "";
};

export const isSwapBelowMinAmountError = (text: string): boolean =>
  /deposit_too_small|too_small|below minimum|out of min amount/i.test(
    String(text || "")
  );

import {
  formatExpressMinAmountMessage,
  normalizeExpressErrorBody,
  resolveExpressMinAmountDisplayError,
} from "@/lib/utils/expressMinAmount";

export { formatExpressMinAmountMessage as formatSwapMinAmountMessage } from "@/lib/utils/expressMinAmount";

function getSwapMinAmountFromPayload(body: any): string | number | null {
  if (!body || typeof body !== "object") return null;
  const root =
    body?.response_data && typeof body.response_data === "object"
      ? body.response_data
      : body;
  const range = root?.range ?? root?.payload?.range;
  const min = range?.minAmount ?? range?.min_amount;
  if (min == null || String(min).trim() === "") return null;
  return min;
}

/** User-visible line for swap estimate failures (min amount, etc.) */
export const buildSwapEstimateDisplayMessage = (
  body: any,
  extracted: string
): string => {
  const normalized = normalizeExpressErrorBody(body) ?? body;
  const minMsg = resolveExpressMinAmountDisplayError(normalized, {
    message: extracted,
  });
  if (minMsg) return minMsg;

  let msg = (extracted || "").trim();
  const root =
    normalized?.response_data && typeof normalized.response_data === "object"
      ? normalized.response_data
      : normalized;
  const rootMessage =
    typeof root?.message === "string" ? root.message.trim() : "";
  const rootError = typeof root?.error === "string" ? root.error.trim() : "";
  if (!msg && rootMessage) {
    msg = rootMessage;
  }
  const min =
    getSwapMinAmountFromPayload(normalized) ?? getSwapMinAmountFromPayload(root);
  const errStr =
    (typeof normalized?.error === "string" ? normalized.error : "") +
    (msg || "") +
    rootError;

  if (isSwapBelowMinAmountError(errStr) || isSwapBelowMinAmountError(msg)) {
    if (min != null) return formatExpressMinAmountMessage(min);
    if (isSwapBelowMinAmountError(msg)) {
      return "Minimum amount required for this pair.";
    }
  }

  return msg;
};

const buildSwapEstimateErrorFromBody = (data: any): string => {
  const normalized = normalizeExpressErrorBody(data) ?? data;
  const minMsg = resolveExpressMinAmountDisplayError(normalized);
  if (minMsg) return minMsg;

  const responseData =
    normalized?.response_data && typeof normalized.response_data === "object"
      ? normalized.response_data
      : null;
  const messageFromResponse =
    typeof responseData?.message === "string" ? responseData.message : "";
  const messageFromError =
    typeof normalized?.error === "string" ? normalized.error : "";
  const messageFromCode =
    typeof responseData?.error === "string" ? responseData.error : "";
  const raw = (
    messageFromResponse ||
    messageFromError ||
    messageFromCode ||
    ""
  ).trim();
  return (
    buildSwapEstimateDisplayMessage(normalized, raw) ||
    raw ||
    "Exchange service error"
  ).trim();
};

const attachSwapEstimateResponseData = (
  err: Error & { response_data?: any },
  body: unknown
) => {
  const normalized = normalizeExpressErrorBody(body);
  err.response_data =
    normalized?.response_data ??
    (normalized && typeof normalized === "object" ? normalized : undefined);
};

/** Build Error with min-amount message when API returns deposit_too_small. */
const createSwapEstimateError = (
  body: unknown,
  fallbackMessage?: string
): Error & { response_data?: any } => {
  const normalized = normalizeExpressErrorBody(body);
  const minMsg = resolveExpressMinAmountDisplayError(normalized, body);
  const extracted = extractErrorMessage(normalized ?? body);
  const message =
    minMsg ||
    buildSwapEstimateDisplayMessage(normalized ?? body, extracted) ||
    extracted ||
    fallbackMessage ||
    "Unable to calculate swap estimate. Please try again later.";

  const err = new Error(message) as Error & { response_data?: any };
  attachSwapEstimateResponseData(err, normalized ?? body);
  return err;
};

export const getEstimateSwap = async (
  fromCurrency: string,
  fromNetwork: string,
  toCurrency: string,
  toNetwork: string,
  amount: number
): Promise<SwapEstimate> => {
  return withRetry(async () => {
    try {
      const response = await get<SwapEstimate>(
        API_CONFIG.SWAP.ESTIMATE_SWAP +
          `?from_currency=${fromCurrency}&from_network=${fromNetwork}&to_currency=${toCurrency}&to_network=${toNetwork}&amount=${amount}`
      );
      // Support both Axios response (response.data) and direct body (e.g. some proxies)
      const raw = (response?.data !== undefined ? response.data : response) as any;
      // Unwrap if backend returns { data: { ... } } or use as-is
      const data = raw?.data !== undefined && typeof raw.data === "object" ? raw.data : raw;
      // Backend can return 200 OK with error in body (e.g. deposit_too_small) – treat as error so UI shows it in red
      if (data?.error || data?.response_data?.error) {
        const err = createSwapEstimateError(data) as Error & {
          response_data?: any;
          response?: { status: number };
        };
        err.response = { status: 400 }; // so withRetry does not retry (only retries on !response or 5xx)
        throw err;
      }
      return data;
    } catch (error: any) {
      const body = error.response?.data ?? error?.response_data ?? error;
      const minFromBody = resolveExpressMinAmountDisplayError(body, error);

      // Re-throw our own error (200-with-error-body) — ensure min-amount copy wins
      if (error?.response_data !== undefined) {
        if (minFromBody) error.message = minFromBody;
        throw error;
      }

      console.error("Failed to fetch swap estimate:", error);
      console.error("Error response data:", error.response?.data);

      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        throw new Error(
          "Network connection issue. Please check your internet connection and try again."
        );
      }

      if (minFromBody) {
        throw createSwapEstimateError(body);
      }

      const status =
        error.response?.status ??
        (normalizeExpressErrorBody(body)?.status_code as number | undefined);

      if (status === 500) {
        throw createSwapEstimateError(
          body,
          "Server Error: Unable to calculate swap estimate. Please try again later."
        );
      }
      if (status === 400 || status === 422) {
        throw createSwapEstimateError(
          body,
          status === 400
            ? "Invalid swap parameters. Please check your input."
            : "Validation error. Please check your input."
        );
      }
      if (status === 404) {
        throw createSwapEstimateError(
          body,
          "Swap service not available. Please try again later."
        );
      }

      throw createSwapEstimateError(body);
    }
  });
};

export const getPublicEstimateSwap = async (
  fromCurrency: string,
  fromNetwork: string,
  toCurrency: string,
  toNetwork: string,
  amount: number
): Promise<SwapEstimate> => {
  return withRetry(async () => {
    try {
      const response = await get<SwapEstimate>(
        API_CONFIG.SWAP.PUBLIC_ESTIMATE_SWAP +
          `?from_currency=${fromCurrency}&from_network=${fromNetwork}&to_currency=${toCurrency}&to_network=${toNetwork}&amount=${amount}`
      );
      const raw = (response?.data !== undefined ? response.data : response) as any;
      const data = raw?.data !== undefined && typeof raw.data === "object" ? raw.data : raw;
      // Backend can return 200 OK with error in body (e.g. deposit_too_small) – treat as error so UI shows it in red
      if (data?.error || data?.response_data?.error) {
        const err = createSwapEstimateError(data) as Error & {
          response_data?: any;
          response?: { status: number };
        };
        err.response = { status: 400 }; // so withRetry does not retry
        throw err;
      }
      return data;
    } catch (error: any) {
      const body = error.response?.data ?? error?.response_data ?? error;
      const minFromBody = resolveExpressMinAmountDisplayError(body, error);

      if (error?.response_data !== undefined) {
        if (minFromBody) error.message = minFromBody;
        throw error;
      }

      console.error("Failed to fetch public swap estimate:", error);
      console.error("Error response data:", error.response?.data);

      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        throw new Error(
          "Network connection issue. Please check your internet connection and try again."
        );
      }

      if (minFromBody) {
        throw createSwapEstimateError(body);
      }

      const status =
        error.response?.status ??
        (normalizeExpressErrorBody(body)?.status_code as number | undefined);

      if (status === 500) {
        throw createSwapEstimateError(
          body,
          "Server Error: Unable to calculate swap estimate. Please try again later."
        );
      }
      if (status === 400 || status === 422) {
        throw createSwapEstimateError(
          body,
          status === 400
            ? "Invalid swap parameters. Please check your input."
            : "Validation error. Please check your input."
        );
      }
      if (status === 404) {
        throw createSwapEstimateError(
          body,
          "Swap service not available. Please try again later."
        );
      }

      throw createSwapEstimateError(body);
    }
  });
};

export const createSwap = async (
  swapData: CreateSwapRequest
): Promise<CreateSwapResponse> => {
  return withRetry(async () => {
    logger.debug('swap', "Creating swap with data:", swapData);
    logger.debug('swap', "API endpoint:", API_CONFIG.SWAP.CREATE_SWAP);

    try {
      const response = await post<CreateSwapResponse>(
        API_CONFIG.SWAP.CREATE_SWAP,
        swapData
      );
      logger.debug('swap', "Swap response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Swap creation error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      // Provide user-friendly error messages for different status codes
      if (error.response?.status === 500) {
        throw new Error(
          "Server Error: Unable to create swap. Please try again later."
        );
      } else if (error.response?.status === 400) {
        const rawMessage =
          extractErrorMessage(error.response?.data) ||
          (typeof error.response?.data?.message === "string"
            ? error.response.data.message
            : "") ||
          "Invalid swap request. Please check your input.";
        const errorMessage =
          resolveSwapCreateErrorMessage({ message: rawMessage }) || rawMessage;
        throw new Error(errorMessage);
      } else if (error.response?.status === 401) {
        throw new Error("Authentication required. Please log in to continue.");
      } else if (error.response?.status === 403) {
        throw new Error(
          "Access denied. You don't have permission to perform this action."
        );
      } else if (error.response?.status === 429) {
        throw new Error(
          "Too many requests. Please wait a moment before trying again."
        );
      } else if (error.response?.status === 422) {
        const errorMessage =
          error.response?.data?.message || "Invalid transaction data.";
        throw new Error(`Validation Error: ${errorMessage}`);
      } else if (!error.response) {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      } else {
        const errorMessage =
          error.response?.data?.message || "An unexpected error occurred.";
        throw new Error(`Error ${error.response.status}: ${errorMessage}`);
      }
    }
  });
};

export const getSwapStatus = async (swapId: string): Promise<SwapStatus> => {
  return withRetry(async () => {
    try {
      const response = await get<SwapStatus>(
        `${API_CONFIG.SWAP.SWAP_STATUS}${swapId}/`
      );
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch swap status:", error);
      if (error.response?.status === 500) {
        throw new Error(
          "Server Error: Unable to fetch swap status. Please try again later."
        );
      } else if (error.response?.status === 404) {
        throw new Error("Swap not found. Please check the swap ID.");
      }
      throw error;
    }
  });
};

// Helper functions for processing ChangeNow assets
export const getFilteredAssets = async (options?: {
  canBuy?: boolean;
  canSell?: boolean;
  network?: string;
  isFiat?: boolean;
  featured?: boolean;
}): Promise<SupportedAsset[]> => {
  const allAssets = await getSupportedAssets();
  
  return allAssets.filter(asset => {
    if (options?.canBuy !== undefined && asset.can_buy !== options.canBuy) return false;
    if (options?.canSell !== undefined && asset.can_sell !== options.canSell) return false;
    if (options?.network && asset.network !== options.network) return false;
    if (options?.isFiat !== undefined && asset.is_fiat !== options.isFiat) return false;
    if (options?.featured !== undefined && asset.featured !== options.featured) return false;
    return true;
  });
};

export const getAssetsByNetwork = async (network: string): Promise<SupportedAsset[]> => {
  return getFilteredAssets({ network });
};

export const getBuyableAssets = async (): Promise<SupportedAsset[]> => {
  return getFilteredAssets({ canBuy: true });
};

export const getSellableAssets = async (): Promise<SupportedAsset[]> => {
  return getFilteredAssets({ canSell: true });
};

export const getFeaturedAssets = async (): Promise<SupportedAsset[]> => {
  return getFilteredAssets({ featured: true });
};

export const getSwapHistory = async (
  params: { page?: number; limit?: number } = {}
): Promise<any> => {
  return withRetry(async () => {
    try {
      const { page = 1, limit = 10 } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      const response = await get<any>(
        `${API_CONFIG.SWAP.SWAP_HISTORY}?${queryParams.toString()}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch swap history:", error);
      
      // Handle network errors gracefully
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        throw new Error(
          "Network connection issue. Please check your internet connection and try again."
        );
      }

      if (error.response?.status === 500) {
        throw new Error(
          "Server Error: Unable to fetch swap history. Please try again later."
        );
      } else if (error.response?.status === 404) {
        throw new Error("Swap history not available. Please try again later.");
      } else if (error.response?.status === 401) {
        throw new Error("Authentication required. Please log in to continue.");
      }

      // For other errors, provide a generic message
      throw new Error(
        "Unable to fetch swap history. Please try again later."
      );
    }
  });
};