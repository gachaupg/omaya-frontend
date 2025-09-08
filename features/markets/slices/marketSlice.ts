/**
 * Market slice for managing cryptocurrency market data
 */
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { MarketData, MarketDataParams, MarketDataState } from "../types";
import {
  fetchMarketData,
  fetchTopMarkets,
  fetchTrendingMarkets,
  searchMarkets,
} from "../api";
import { sliceCache } from "../../../lib/utils/sliceCache";

// Async thunks
export const fetchMarketsAsync = createAsyncThunk(
  "markets/fetchMarkets",
  async (params: MarketDataParams = {}, { rejectWithValue }) => {
    try {
      const data = await sliceCache.getOrSet(
        'markets',
        'fetchMarkets',
        async () => {
          const response = await fetchMarketData(params);
          if (!response.success) {
            throw new Error(response.error || "Failed to fetch markets");
          }
          return response.data;
        },
        params, // cache based on params
        60 * 60 * 1000 // 1 hour cache
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

export const fetchTopMarketsAsync = createAsyncThunk(
  "markets/fetchTopMarkets",
  async (
    {
      limit = 20,
      currency = "usd",
    }: { limit?: number; currency?: string } = {},
    { rejectWithValue }
  ) => {
    try {
      const params = { limit, currency };
      const data = await sliceCache.getOrSet(
        'markets',
        'fetchTopMarkets',
        async () => {
          const response = await fetchTopMarkets(limit, currency);
          if (!response.success) {
            throw new Error(response.error || "Failed to fetch top markets");
          }
          return response.data;
        },
        params, // cache based on params
        60 * 60 * 1000 // 1 hour cache
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

export const fetchTrendingMarketsAsync = createAsyncThunk(
  "markets/fetchTrendingMarkets",
  async (currency: string = "usd", { rejectWithValue }) => {
    try {
      const response = await fetchTrendingMarkets(currency);
      if (!response.success) {
        return rejectWithValue(
          response.error || "Failed to fetch trending markets"
        );
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

export const searchMarketsAsync = createAsyncThunk(
  "markets/searchMarkets",
  async (
    { query, currency = "usd" }: { query: string; currency?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await searchMarkets(query, currency);
      if (!response.success) {
        return rejectWithValue(response.error || "Failed to search markets");
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

// Initial state
const initialState: MarketDataState = {
  markets: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

// Market slice
const marketSlice = createSlice({
  name: "markets",
  initialState,
  reducers: {
    clearMarkets: (state) => {
      state.markets = [];
      state.error = null;
      state.lastUpdated = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setMarkets: (state, action: PayloadAction<MarketData[]>) => {
      state.markets = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    // fetchMarketsAsync
    builder
      .addCase(fetchMarketsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMarketsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.markets = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchMarketsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch markets";
      });

    // fetchTopMarketsAsync
    builder
      .addCase(fetchTopMarketsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTopMarketsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.markets = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchTopMarketsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch top markets";
      });

    // fetchTrendingMarketsAsync
    builder
      .addCase(fetchTrendingMarketsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrendingMarketsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.markets = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchTrendingMarketsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch trending markets";
      });

    // searchMarketsAsync
    builder
      .addCase(searchMarketsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchMarketsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.markets = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(searchMarketsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to search markets";
      });
  },
});

// Export actions
export const { clearMarkets, clearError, setMarkets } = marketSlice.actions;

// Export selectors
export const selectMarkets = (state: { markets: MarketDataState }) =>
  state.markets.markets;
export const selectMarketsLoading = (state: { markets: MarketDataState }) =>
  state.markets.loading;
export const selectMarketsError = (state: { markets: MarketDataState }) =>
  state.markets.error;
export const selectMarketsLastUpdated = (state: { markets: MarketDataState }) =>
  state.markets.lastUpdated;

// Export reducer
export default marketSlice.reducer;
