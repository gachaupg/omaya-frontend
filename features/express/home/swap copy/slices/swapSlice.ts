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
import { showToast } from "@/lib/utils/toast";
import { handleApiError } from "@/lib/utils/errorHandler";
import { sliceCache } from "@/lib/utils/sliceCache";

import { logger } from '@/lib/utils/logger';

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
      
      // Only show toast if it's a network error or server error
      if (error instanceof Error) {
        if (
          error.message.includes("Network error") ||
          error.message.includes("Server Error")
        ) {
          handleApiError(error);
        }
      }
      
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
    } catch (error) {
      console.error("Failed to fetch swap estimate:", error);
      // Only show toast for server errors or network issues
      if (error instanceof Error) {
        if (
          error.message.includes("Server Error") ||
          error.message.includes("Network error")
        ) {
          handleApiError(error);
        }
      }
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch swap estimate"
      );
    }
  }
);

export const createSwapTransaction = createAsyncThunk(
  "swap/createSwapTransaction",
  async (swapData: CreateSwapRequest, { rejectWithValue, getState }) => {
    try {
      const response = await createSwap(swapData);
      return response;
    } catch (error) {
      console.error("Failed to create swap transaction:", error);

      // Get current state to check if error toast has been shown
      const state = getState() as { swap: SwapState };
      const hasShownError = state.swap.hasShownErrorToast;

      // Only show toast if we haven't shown one for this error yet
      if (!hasShownError) {
        if (error instanceof Error) {
          if (
            error.message.includes("500") ||
            error.message.includes("Server Error")
          ) {
            showToast.error(
              "Server Error",
              "The server encountered an error. Please try again later."
            );
          } else if (
            error.message.includes("400") ||
            error.message.includes("Bad Request")
          ) {
            showToast.error(
              "Invalid Request",
              "Please check your input and try again"
            );
          } else if (
            error.message.includes("401") ||
            error.message.includes("Unauthorized")
          ) {
            showToast.error(
              "Authentication Required",
              "Please log in to continue"
            );
          } else if (
            error.message.includes("403") ||
            error.message.includes("Forbidden")
          ) {
            showToast.error(
              "Access Denied",
              "You don't have permission to perform this action"
            );
          } else if (
            error.message.includes("429") ||
            error.message.includes("Too Many Requests")
          ) {
            showToast.error(
              "Too Many Requests",
              "Please wait a moment before trying again"
            );
          } else {
            handleApiError(error);
          }
        } else {
          handleApiError(error);
        }
      }

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
      state.fromAmount = action.payload;
    },
    setToAmount: (state, action) => {
      state.toAmount = action.payload;
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
        
        // Set default assets - always first and second
        if (!state.fromAsset && action.payload.length > 0) {
          state.fromAsset = action.payload[0];
          logger.debug('swap', "🎯 Redux: fromAsset set to first:", state.fromAsset);
        }
        if (!state.toAsset && action.payload.length > 1) {
          state.toAsset = action.payload[1];
          logger.debug('swap', "🎯 Redux: toAsset set to second:", state.toAsset);
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
        state.estimateError =
          action.error.message || "Failed to fetch swap estimate";
        state.hasShownErrorToast = true; // Mark that error toast has been shown
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
  clearSwapResponse,
  resetErrorToastFlag,
} = swapSlice.actions;

export default swapSlice.reducer;
