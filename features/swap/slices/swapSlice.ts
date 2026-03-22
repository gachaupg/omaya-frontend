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
import { getSupportedAssets, getEstimateSwap, getPublicEstimateSwap, createSwap } from "../api";
import { sliceCache } from "@/lib/utils/sliceCache";

import { logger } from '@/lib/utils/logger';

/** Backend validation (min/max amount, etc.) – not a real failure; avoid console noise */
function isSwapEstimateValidationError(error: any): boolean {
  const msg = String(error?.message ?? "");
  if (/deposit_too_small|deposit_too_large|too small|too large/i.test(msg)) return true;
  const rd =
    error?.response_data ??
    (error?.response?.data && typeof error.response.data === "object"
      ? (error.response.data as any)?.response_data ?? error.response.data
      : undefined);
  const errVal = rd?.error;
  if (typeof errVal === "string" && /deposit_too_small|deposit_too_large/i.test(errVal)) return true;
  return false;
}

/** Always a non-empty string for Redux (payload from rejectWithValue can be odd shapes) */
function estimateErrorStringFromRejectAction(action: {
  payload: unknown;
  error: { message?: string };
}): string {
  const p = action.payload as any;
  const fromResponseData = (rd: unknown): string => {
    if (!rd || typeof rd !== "object") return "";
    const o = rd as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim()) return o.message.trim();
    if (typeof o.error === "string" && o.error.trim()) return o.error.trim();
    const range = (o.range ?? (o.payload as any)?.range) as
      | { minAmount?: string; min_amount?: string }
      | undefined;
    const min = range?.minAmount ?? range?.min_amount;
    const err = typeof o.error === "string" ? o.error : "";
    if (min != null && String(min).trim() && /deposit_too_small|too_small/i.test(err))
      return `Amount below minimum. Minimum: ${min}.`;
    return "";
  };

  if (typeof p === "string" && p.trim()) {
    if (/request failed with status code/i.test(p)) {
      return "Could not get a swap estimate. Please adjust amount or pair.";
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
        if (/deposit_too_small/i.test(e) && min != null)
          return `Amount below minimum. Minimum: ${min}.`;
        return e;
      }
    }
  }
  const em = action.error?.message;
  if (typeof em === "string" && em.trim() && em !== "Rejected") {
    if (/request failed with status code/i.test(em))
      return "Could not get a swap estimate. Please adjust amount or pair.";
    return em.trim();
  }
  return "Failed to fetch swap estimate";
}

interface SwapState {
  fromAsset: SupportedAsset | null;
  toAsset: SupportedAsset | null;
  fromAmount: string;
  toAmount: string;
  supportedAssets: SupportedAsset[];
  loading: boolean;
  error: string | null;
  estimate: SwapEstimate | null;
  estimateLoading: boolean;
  estimateError: string | null;
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
  loading: false,
  error: null,
  estimate: null,
  estimateLoading: false,
  estimateError: null,
  swapResponse: null,
  swapLoading: false,
  swapError: null,
  hasShownErrorToast: false,
};

export const fetchSupportedAssets = createAsyncThunk<SupportedAsset[], boolean | undefined>(
  "swap/fetchSupportedAssets",
  async (forceRefresh: boolean = false, { rejectWithValue }) => {
    try {
      logger.debug('swap', "🔄 Starting fetchSupportedAssets...");
      
      let data;
      
      if (forceRefresh) {
        logger.debug('swap', "🔄 Force refresh - bypassing cache...");
        // Clear cache first
        await sliceCache.delete('swap', 'fetchSupportedAssets');
        // Fetch fresh data
        const response = await getSupportedAssets();
        logger.debug('swap', "✅ Force refresh API response received:", response?.length || 0, "assets");
        // Cache the fresh data
        await sliceCache.set('swap', 'fetchSupportedAssets', response, undefined, 2 * 60 * 60 * 1000);
        data = response;
      } else {
        data = await sliceCache.getOrSet(
          'swap',
          'fetchSupportedAssets',
          async () => {
            logger.debug('swap', "🔄 Cache miss - fetching from API...");
            const response = await getSupportedAssets();
            logger.debug('swap', "✅ API response received:", response?.length || 0, "assets");
            return response;
          },
          undefined, // no params
          2 * 60 * 60 * 1000 // 2 hours cache
        );
      }
      
      logger.debug('swap', "✅ fetchSupportedAssets completed:", data?.length || 0, "assets");
      return data;
    } catch (error) {
      console.error("❌ Failed to fetch supported assets:", error);
      
      // Provide fallback assets if API fails
      const fallbackAssets: SupportedAsset[] = [
        {
          asset_id: "fallback-usdt-bsc",
          symbol: "USDT",
          name: "Tether USD",
          description: "Tether USD on BSC",
          asset_image: null,
          image_url: "",
          ticker: "USDT",
          has_external_id: false,
          is_extra_id_supported: false,
          is_fiat: false,
          featured: true,
          is_stable: true,
          supports_fixed_rate: true,
          network: "BSC",
          token_contract: "",
          can_buy: true,
          can_sell: true,
          legacy_ticker: "usdt",
          is_changenow_asset: false,
        },
        {
          asset_id: "fallback-btc",
          symbol: "BTC",
          name: "Bitcoin",
          description: "Bitcoin",
          asset_image: null,
          image_url: "",
          ticker: "BTC",
          has_external_id: false,
          is_extra_id_supported: false,
          is_fiat: false,
          featured: true,
          is_stable: false,
          supports_fixed_rate: true,
          network: "BTC",
          token_contract: "",
          can_buy: true,
          can_sell: true,
          legacy_ticker: "btc",
          is_changenow_asset: false,
        }
      ];
      
      logger.debug('swap', "🔄 Using fallback assets:", fallbackAssets.length);
      
      // Return fallback assets instead of rejecting
      return fallbackAssets;
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
        console.error("Failed to fetch swap estimate:", error);
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
      console.error("Failed to create swap transaction:", error);

      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to create swap transaction"
      );
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
    },
    clearEstimateError: (state) => {
      state.estimateError = null;
    },
    clearSwapResponse: (state) => {
      state.swapResponse = null;
      state.swapError = null;
      state.hasShownErrorToast = false; // Reset error toast flag
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
        state.error =
          action.error.message || "Failed to fetch supported assets";
        state.hasShownErrorToast = true; // Mark that error toast has been shown
      })
      .addCase(fetchSwapEstimate.pending, (state) => {
        state.estimateLoading = true;
        state.estimateError = null;
        state.hasShownErrorToast = false;
      })
      .addCase(fetchSwapEstimate.fulfilled, (state, action) => {
        state.estimateLoading = false;
        state.estimate = action.payload;
      })
      .addCase(fetchSwapEstimate.rejected, (state, action) => {
        state.estimateLoading = false;
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
        state.swapResponse = action.payload;
      })
      .addCase(createSwapTransaction.rejected, (state, action) => {
        state.swapLoading = false;
        state.swapError =
          action.error.message || "Failed to create swap transaction";
        state.hasShownErrorToast = true; // Mark that error toast has been shown
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
  resetErrorToastFlag,
} = swapSlice.actions;

export default swapSlice.reducer;
