/**
 * swapSlice.ts – auto‑generated placeholder
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  SupportedAsset,
  SwapEstimate,
  CreateSwapRequest,
  CreateSwapResponse,
} from "../types";
import {
  getSupportedAssets,
  getEstimateSwap,
  getPublicEstimateSwap,
  createSwap,
  buildSwapEstimateDisplayMessage,
  formatSwapMinAmountMessage,
  isSwapBelowMinAmountError,
  resolveSwapCreateFailureMessage,
} from "../api";
import {
  isExpressBelowMinAmountError,
  resolveExpressMinAmountDisplayError,
} from "@/lib/utils/expressMinAmount";
import { sliceCache } from "@/lib/utils/sliceCache";
import { normalizeCreateSwapResponse } from "../utils/swapResponseUtils";
import {
  clearSupportedTokensCachesOnReload,
  consumeSupportedTokensReloadRefetch,
  shouldForceSupportedTokensRefetch,
} from "@/lib/utils/supportedTokensCache";

import { logger } from '@/lib/utils/logger';

/** Backend validation (min/max amount, etc.) – not a real failure; avoid console noise */
function isSwapEstimateValidationError(error: any): boolean {
  const msg = String(error?.message ?? "");
  if (
    /deposit_too_small|deposit_too_large|too small|too large|out of min amount/i.test(
      msg
    )
  )
    return true;
  const rd =
    error?.response_data ??
    (error?.response?.data && typeof error.response.data === "object"
      ? (error.response.data as any)?.response_data ?? error.response.data
      : undefined);
  const errVal = rd?.error;
  if (
    typeof errVal === "string" &&
    /deposit_too_small|deposit_too_large|out of min amount/i.test(errVal)
  )
    return true;
  if (typeof rd?.message === "string" && isSwapBelowMinAmountError(rd.message)) return true;
  return false;
}

/** Always a non-empty string for Redux (payload from rejectWithValue can be odd shapes) */
function estimateErrorStringFromRejectAction(action: {
  payload: unknown;
  error: { message?: string };
}): string {
  const p = action.payload as any;
  const minFromPayload = resolveExpressMinAmountDisplayError(
    action.payload,
    p?.response_data,
    action
  );
  if (minFromPayload) return minFromPayload;
  const fromResponseData = (rd: unknown): string => {
    if (!rd || typeof rd !== "object") return "";
    const o = rd as Record<string, unknown>;
    const range = (o.range ?? (o.payload as any)?.range) as
      | { minAmount?: string; min_amount?: string }
      | undefined;
    const min = range?.minAmount ?? range?.min_amount;
    const err = typeof o.error === "string" ? o.error : "";
    const message = typeof o.message === "string" ? o.message : "";
    if (isSwapBelowMinAmountError(err) || isSwapBelowMinAmountError(message)) {
      if (min != null && String(min).trim()) return formatSwapMinAmountMessage(min);
      return "Minimum amount required for this pair.";
    }
    if (typeof o.message === "string" && o.message.trim()) return o.message.trim();
    if (typeof o.error === "string" && o.error.trim()) return o.error.trim();
    return "";
  };

  if (typeof p === "string" && p.trim()) {
    if (/request failed with status code/i.test(p)) {
      return "Could not get a swap estimate. Please adjust amount or pair.";
    }
    if (isSwapBelowMinAmountError(p)) {
      return "Minimum amount required for this pair.";
    }
    return p.trim();
  }
  if (p && typeof p === "object") {
    const m = p.message;
    if (typeof m === "string" && m.trim()) {
      if (/request failed with status code/i.test(m)) {
        const rd = p.response_data;
        const alt = fromResponseData(rd);
        if (alt) return alt;
        return "Could not get a swap estimate. Please adjust amount or pair.";
      }
      const friendly = buildSwapEstimateDisplayMessage(
        { response_data: p.response_data, message: m },
        m.trim()
      );
      if (friendly && friendly !== m.trim()) return friendly;
      if (isSwapBelowMinAmountError(m)) {
        const rd = p.response_data;
        const range = (rd as any)?.range ?? (rd as any)?.payload?.range;
        const min = range?.minAmount ?? range?.min_amount;
        if (min != null && String(min).trim()) return formatSwapMinAmountMessage(min);
        return "Minimum amount required for this pair.";
      }
      return m.trim();
    }
    if (m != null && typeof m !== "object") return String(m).trim();
    const rd = p.response_data;
    if (rd && typeof rd === "object") {
      const s = fromResponseData(rd);
      if (s) return s;
      if (typeof (rd as any).message === "string" && (rd as any).message.trim())
        return (rd as any).message.trim();
      if (typeof (rd as any).error === "string" && (rd as any).error.trim()) {
        const e = (rd as any).error.trim();
        const min =
          (rd as any).range?.minAmount ?? (rd as any).range?.min_amount;
        if (isSwapBelowMinAmountError(e) || isExpressBelowMinAmountError(e)) {
          const minMsg = resolveExpressMinAmountDisplayError(rd, p, min);
          if (minMsg) return minMsg;
        }
        return e;
      }
    }
  }
  const em = action.error?.message;
  if (typeof em === "string" && em.trim() && em !== "Rejected") {
    if (
      /request failed with status code|unable to calculate swap estimate/i.test(
        em
      )
    ) {
      const minMsg = resolveExpressMinAmountDisplayError(p, p?.response_data, action);
      if (minMsg) return minMsg;
      return "Could not get a swap estimate. Please adjust amount or pair.";
    }
    const minFromEm = resolveExpressMinAmountDisplayError(em, p, p?.response_data);
    if (minFromEm) return minFromEm;
    return em.trim();
  }
  return "Failed to fetch swap estimate";
}

/** Skip list refetch in UI when Redux already has data (avoids pending/loading + IndexedDB on every mount). */
export const SUPPORTED_ASSETS_CLIENT_TTL_MS = 10 * 60 * 1000;

interface SwapState {
  fromAsset: SupportedAsset | null;
  toAsset: SupportedAsset | null;
  fromAmount: string;
  toAmount: string;
  supportedAssets: SupportedAsset[];
  /** Set when `supportedAssets` was last filled from a successful fetch (non-empty). */
  supportedAssetsFetchedAt: number | null;
  loading: boolean;
  error: string | null;
  estimate: SwapEstimate | null;
  estimateLoading: boolean;
  estimateError: string | null;
  /** Used to ignore stale estimate responses (e.g. user cleared input mid-request). */
  estimateRequestKey: string | null;
  swapResponse: CreateSwapResponse | null;
  swapLoading: boolean;
  swapError: string | null;
  // Track if error toast has been shown to prevent duplicates
  hasShownErrorToast: boolean;
}

const initialState: SwapState = {
  fromAsset: null,
  toAsset: null,
  fromAmount: "0.01",
  toAmount: "0",
  supportedAssets: [],
  supportedAssetsFetchedAt: null,
  loading: false,
  error: null,
  estimate: null,
  estimateLoading: false,
  estimateError: null,
  estimateRequestKey: null,
  swapResponse: null,
  swapLoading: false,
  swapError: null,
  hasShownErrorToast: false,
};

export const fetchSupportedAssets = createAsyncThunk<
  SupportedAsset[],
  | boolean
  | undefined
  | { forceRefresh?: boolean; feature?: "swap" | "exchange" },
  { state: { swap: SwapState } }
>(
  "swap/fetchSupportedAssets",
  async (arg, { rejectWithValue, getState }) => {
    try {
      const forceRefresh =
        (typeof arg === "object" && arg !== null
          ? Boolean(arg.forceRefresh)
          : Boolean(arg)) || shouldForceSupportedTokensRefetch();
      const feature =
        typeof arg === "object" && arg !== null && arg.feature === "exchange"
          ? "exchange"
          : "swap";
      const cacheKey = `fetchSupportedAssets_${feature}`;

      logger.debug('swap', "🔄 Starting fetchSupportedAssets...");

      if (forceRefresh) {
        await clearSupportedTokensCachesOnReload();
      }

      // Serve fresh Redux state as a fulfilled result so callers using `.unwrap()`
      // do not treat cache hits as failures and trigger unnecessary force refreshes.
      if (!forceRefresh) {
        const state = getState();
        const n = Array.isArray(state.swap.supportedAssets)
          ? state.swap.supportedAssets.length
          : 0;
        if (
          n > 0 &&
          typeof state.swap.supportedAssetsFetchedAt === "number" &&
          Date.now() - state.swap.supportedAssetsFetchedAt <
            SUPPORTED_ASSETS_CLIENT_TTL_MS
        ) {
          logger.debug(
            "swap",
            `✅ Returning fresh Redux supported assets (${n})`
          );
          return state.swap.supportedAssets;
        }
      }
      
      let data;
      
      if (forceRefresh) {
        logger.debug('swap', "🔄 Force refresh - bypassing cache...");
        // Clear cache first
        await sliceCache.delete('swap', cacheKey);
        // Fetch fresh data
        const response = await getSupportedAssets(feature);
        logger.debug('swap', "✅ Force refresh API response received:", response?.length || 0, "assets");
        // Cache the fresh data
        await sliceCache.set('swap', cacheKey, response, { feature }, 10 * 60 * 1000);
        data = response;
      } else {
        data = await sliceCache.getOrSet(
          'swap',
          cacheKey,
          async () => {
            logger.debug('swap', "🔄 Cache miss - fetching from API...");
            const response = await getSupportedAssets(feature);
            logger.debug('swap', "✅ API response received:", response?.length || 0, "assets");
            return response;
          },
          { feature },
          10 * 60 * 1000 // 10 minute cache
        );
      }
      
      logger.debug('swap', "✅ fetchSupportedAssets completed:", data?.length || 0, "assets");
      if (shouldForceSupportedTokensRefetch()) {
        consumeSupportedTokensReloadRefetch();
      }
      return data;
    } catch (error) {
            
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch supported assets"
      ) as any;
    }
  }
);

export const fetchSwapEstimate = createAsyncThunk(
  "swap/fetchSwapEstimate",
  async (
    {
      fromCurrency,
      fromNetwork,
      toCurrency,
      toNetwork,
      amount,
      usePublicApi = false,
    }: {
      fromCurrency: string;
      fromNetwork: string;
      toCurrency: string;
      toNetwork: string;
      amount: number;
      usePublicApi?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const params = {
        fromCurrency,
        fromNetwork,
        toCurrency,
        toNetwork,
        amount,
        usePublicApi,
      };
      
      const data = await sliceCache.getOrSet(
        'swap',
        'fetchSwapEstimate',
        async () => {
          const fetchFn = usePublicApi ? getPublicEstimateSwap : getEstimateSwap;
          const response = await fetchFn(
            fromCurrency,
            fromNetwork,
            toCurrency,
            toNetwork,
            amount
          );
          return response;
        },
        params, // cache based on all parameters
        5 * 60 * 1000 // 5 minutes cache for estimates (shorter TTL since they're more dynamic)
      );
      return data;
    } catch (error: any) {
      if (!isSwapEstimateValidationError(error)) {
              }
      // Pass full error so UI can show response_data (e.g. minAmount for deposit_too_small)
      const responseData = error?.response_data ?? (error?.response?.data && typeof error.response.data === "object" ? (error.response.data as any)?.response_data ?? error.response.data : undefined);
      const payload =
        error && typeof error === "object"
          ? { message: error?.message || String(error), response_data: responseData }
          : { message: String(error), response_data: undefined };
      return rejectWithValue(payload);
    }
  },
  {
    // Avoid hitting the API with 0 / NaN (and skip duplicate pending noise)
    condition: (arg) => {
      const n = typeof arg.amount === "number" ? arg.amount : Number(arg.amount);
      return Number.isFinite(n) && n > 0;
    },
  }
);

export const createSwapTransaction = createAsyncThunk(
  "swap/createSwapTransaction",
  async (swapData: CreateSwapRequest, { rejectWithValue }) => {
    try {
      const response = await createSwap(swapData);
      return response;
    } catch (error) {
            return rejectWithValue(resolveSwapCreateFailureMessage(error));
    }
  }
);

const swapSlice = createSlice({
  name: "swap",
  initialState,
  reducers: {
    setFromAsset: (state, action) => {
      state.fromAsset = action.payload;
    },
    setToAsset: (state, action) => {
      state.toAsset = action.payload;
    },
    setFromAmount: (state, action) => {
      const v = action.payload;
      state.fromAmount =
        v == null ? "" : typeof v === "string" ? v : String(v);
    },
    setToAmount: (state, action) => {
      const v = action.payload;
      state.toAmount =
        v == null ? "" : typeof v === "string" ? v : String(v);
    },
    swapAssets: (state) => {
      const temp = state.fromAsset;
      state.fromAsset = state.toAsset;
      state.toAsset = temp;
      const tempAmount = state.fromAmount;
      state.fromAmount = state.toAmount;
      state.toAmount = tempAmount;
    },
    clearEstimate: (state) => {
      state.estimate = null;
      state.estimateError = null;
      state.estimateLoading = false;
      state.estimateRequestKey = null;
    },
    clearEstimateError: (state) => {
      state.estimateError = null;
    },
    clearSwapResponse: (state) => {
      state.swapResponse = null;
      state.swapError = null;
      state.hasShownErrorToast = false; // Reset error toast flag
    },
    setSwapResponse: (state, action: { payload: CreateSwapResponse | null }) => {
      state.swapResponse = action.payload
        ? normalizeCreateSwapResponse(action.payload)
        : null;
      state.swapError = null;
    },
    resetErrorToastFlag: (state) => {
      state.hasShownErrorToast = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSupportedAssets.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.hasShownErrorToast = false;
      })
      .addCase(fetchSupportedAssets.fulfilled, (state, action) => {
        logger.debug('swap', "🎯 Redux: fetchSupportedAssets.fulfilled", {
          payloadLength: action.payload?.length || 0,
          payload: action.payload
        });
        state.loading = false;
        state.supportedAssets = action.payload;
        if (Array.isArray(action.payload) && action.payload.length > 0) {
          state.supportedAssetsFetchedAt = Date.now();
        }
        logger.debug('swap', "🎯 Redux: supportedAssets set to:", state.supportedAssets?.length || 0, "assets");
        
        // Set default assets if not set - BTC for fromAsset, ETH for toAsset
        if (!state.fromAsset && action.payload.length > 0) {
          // Find BTC asset, fallback to first asset if BTC not found
          const btcAsset = action.payload.find(asset => 
            asset?.ticker?.toLowerCase() === 'btc' || 
            asset?.symbol?.toLowerCase() === 'btc'
          );
          state.fromAsset = btcAsset || action.payload[0];
          logger.debug('swap', "🎯 Redux: fromAsset set to:", state.fromAsset);
        }
        if (!state.toAsset && action.payload.length > 1) {
          // Find ETH asset, fallback to second asset if ETH not found
          const ethAsset = action.payload.find(asset => 
            asset?.ticker?.toLowerCase() === 'eth' || 
            asset?.symbol?.toLowerCase() === 'eth'
          );
          state.toAsset = ethAsset || action.payload[1];
          logger.debug('swap', "🎯 Redux: toAsset set to:", state.toAsset);
        }
      })
      .addCase(fetchSupportedAssets.rejected, (state, action) => {
        state.loading = false;
        // Thunk was skipped because we already have fresh assets in state (see condition callback)
        if ((action as { meta?: { condition?: boolean } }).meta?.condition) {
          return;
        }
        state.error =
          action.error.message || "Failed to fetch supported assets";
        state.hasShownErrorToast = true; // Mark that error toast has been shown
      })
      .addCase(fetchSwapEstimate.pending, (state, action) => {
        state.estimateLoading = true;
        state.estimateError = null;
        state.hasShownErrorToast = false;

        const a = (action as any)?.meta?.arg as
          | {
              fromCurrency: string;
              fromNetwork: string;
              toCurrency: string;
              toNetwork: string;
              amount: number;
              usePublicApi?: boolean;
            }
          | undefined;
        if (a) {
          state.estimateRequestKey = [
            a.fromCurrency,
            a.fromNetwork,
            a.toCurrency,
            a.toNetwork,
            String(a.amount),
            a.usePublicApi ? "public" : "auth",
          ].join("|");
        } else {
          state.estimateRequestKey = null;
        }
      })
      .addCase(fetchSwapEstimate.fulfilled, (state, action) => {
        state.estimateLoading = false;
        const a = (action as any)?.meta?.arg as
          | {
              fromCurrency: string;
              fromNetwork: string;
              toCurrency: string;
              toNetwork: string;
              amount: number;
              usePublicApi?: boolean;
            }
          | undefined;
        const key = a
          ? [
              a.fromCurrency,
              a.fromNetwork,
              a.toCurrency,
              a.toNetwork,
              String(a.amount),
              a.usePublicApi ? "public" : "auth",
            ].join("|")
          : null;

        // If user cleared the inputs (or moved on), ignore late responses.
        if ((state.fromAmount === "" && state.toAmount === "") || (key && state.estimateRequestKey && key !== state.estimateRequestKey)) {
          return;
        }

        state.estimate = action.payload;
      })
      .addCase(fetchSwapEstimate.rejected, (state, action) => {
        state.estimateLoading = false;
        // Ignore stale rejected responses as well.
        const a = (action as any)?.meta?.arg as
          | {
              fromCurrency: string;
              fromNetwork: string;
              toCurrency: string;
              toNetwork: string;
              amount: number;
              usePublicApi?: boolean;
            }
          | undefined;
        const key = a
          ? [
              a.fromCurrency,
              a.fromNetwork,
              a.toCurrency,
              a.toNetwork,
              String(a.amount),
              a.usePublicApi ? "public" : "auth",
            ].join("|")
          : null;
        if ((state.fromAmount === "" && state.toAmount === "") || (key && state.estimateRequestKey && key !== state.estimateRequestKey)) {
          return;
        }
        state.estimateError = estimateErrorStringFromRejectAction(action);
        state.hasShownErrorToast = true;
      })
      .addCase(createSwapTransaction.pending, (state) => {
        state.swapLoading = true;
        state.swapError = null;
        state.hasShownErrorToast = false;
      })
      .addCase(createSwapTransaction.fulfilled, (state, action) => {
        state.swapLoading = false;
        state.swapResponse = normalizeCreateSwapResponse(action.payload);
      })
      .addCase(createSwapTransaction.rejected, (state, action) => {
        state.swapLoading = false;
        const payload = action.payload;
        state.swapError =
          typeof payload === "string" && payload.trim()
            ? payload
            : action.error.message || "Failed to create swap transaction";
        state.hasShownErrorToast = true;
      });
  },
});

export const {
  setFromAsset,
  setToAsset,
  setFromAmount,
  setToAmount,
  swapAssets,
  clearEstimate,
  clearEstimateError,
  clearSwapResponse,
  setSwapResponse,
  resetErrorToastFlag,
} = swapSlice.actions;

export default swapSlice.reducer;
