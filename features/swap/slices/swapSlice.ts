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
import { getSupportedAssets, getEstimateSwap, createSwap } from "../api";

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
}

const initialState: SwapState = {
  fromAsset: null,
  toAsset: null,
  fromAmount: "0",
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
};

export const fetchSupportedAssets = createAsyncThunk(
  "swap/fetchSupportedAssets",
  async () => {
    const response = await getSupportedAssets();
    return response;
  }
);

export const fetchSwapEstimate = createAsyncThunk(
  "swap/fetchSwapEstimate",
  async ({
    fromCurrency,
    fromNetwork,
    toCurrency,
    toNetwork,
    amount,
  }: {
    fromCurrency: string;
    fromNetwork: string;
    toCurrency: string;
    toNetwork: string;
    amount: number;
  }) => {
    const response = await getEstimateSwap(
      fromCurrency,
      fromNetwork,
      toCurrency,
      toNetwork,
      amount
    );
    return response;
  }
);

export const createSwapTransaction = createAsyncThunk(
  "swap/createSwapTransaction",
  async (swapData: CreateSwapRequest) => {
    const response = await createSwap(swapData);
    return response;
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
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSupportedAssets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSupportedAssets.fulfilled, (state, action) => {
        state.loading = false;
        state.supportedAssets = action.payload;
        // Set default assets if not set
        if (!state.fromAsset && action.payload.length > 0) {
          state.fromAsset = action.payload[0];
        }
        if (!state.toAsset && action.payload.length > 1) {
          state.toAsset = action.payload[1];
        }
      })
      .addCase(fetchSupportedAssets.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to fetch supported assets";
      })
      .addCase(fetchSwapEstimate.pending, (state) => {
        state.estimateLoading = true;
        state.estimateError = null;
      })
      .addCase(fetchSwapEstimate.fulfilled, (state, action) => {
        state.estimateLoading = false;
        state.estimate = action.payload;
      })
      .addCase(fetchSwapEstimate.rejected, (state, action) => {
        state.estimateLoading = false;
        state.estimateError =
          action.error.message || "Failed to fetch swap estimate";
      })
      .addCase(createSwapTransaction.pending, (state) => {
        state.swapLoading = true;
        state.swapError = null;
      })
      .addCase(createSwapTransaction.fulfilled, (state, action) => {
        state.swapLoading = false;
        state.swapResponse = action.payload;
      })
      .addCase(createSwapTransaction.rejected, (state, action) => {
        state.swapLoading = false;
        state.swapError =
          action.error.message || "Failed to create swap transaction";
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
} = swapSlice.actions;

export default swapSlice.reducer;
