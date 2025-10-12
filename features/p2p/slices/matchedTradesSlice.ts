import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getMatchedTrades } from "../api";
import { MatchedTradesResponse } from "../types";

interface MatchedTradesState {
  data: MatchedTradesResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: MatchedTradesState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchMatchedTrades = createAsyncThunk(
  "matchedTrades/fetchMatchedTrades",
  async (page: number = 1) => {
    const response = await getMatchedTrades(page);
    return response;
  }
);

const matchedTradesSlice = createSlice({
  name: "matchedTrades",
  initialState,
  reducers: {
    clearMatchedTrades: (state) => {
      state.data = null;
      state.error = null;
    },
    // WebSocket updates
    updateMatchedTradesFromWS: (state, action) => {
      state.data = {
        ...action.payload,
        results: action.payload.trades || action.payload.results || [],
      };
    },
    addMatchedTradeFromWS: (state, action) => {
      if (state.data && state.data.results) {
        // Add new trade at the beginning
        state.data.results = [action.payload, ...state.data.results];
        state.data.count = (state.data.count || 0) + 1;
      } else {
        state.data = {
          results: [action.payload],
          count: 1,
          next: null,
          previous: null,
        };
      }
    },
    updateSingleTradeFromWS: (state, action) => {
      if (state.data && state.data.results) {
        const index = state.data.results.findIndex(
          (trade) => trade.id === action.payload.id
        );
        if (index !== -1) {
          state.data.results[index] = action.payload;
        } else {
          // If trade not found, add it
          state.data.results = [action.payload, ...state.data.results];
          state.data.count = (state.data.count || 0) + 1;
        }
      }
    },
    removeMatchedTradeFromWS: (state, action) => {
      if (state.data && state.data.results) {
        state.data.results = state.data.results.filter(
          (trade) => trade.id !== action.payload
        );
        state.data.count = Math.max(0, (state.data.count || 0) - 1);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatchedTrades.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMatchedTrades.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchMatchedTrades.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch matched trades";
      });
  },
});

export const {
  clearMatchedTrades,
  updateMatchedTradesFromWS,
  addMatchedTradeFromWS,
  updateSingleTradeFromWS,
  removeMatchedTradeFromWS,
} = matchedTradesSlice.actions;
export default matchedTradesSlice.reducer;
