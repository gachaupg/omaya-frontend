import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { getMatchedTrades } from "../api";
import { MatchedTrade, MatchedTradesResponse } from "../types";
import {
  filterPendingMatchedTradeNotifications,
  isPendingMatchedTradeNotification,
  isTerminalMatchedTradeNotificationStatus,
} from "../utils/matchedTradeNotifications";

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

function withFilteredResults(
  payload: MatchedTradesResponse
): MatchedTradesResponse {
  const results = filterPendingMatchedTradeNotifications(
    payload.results || []
  );
  return {
    ...payload,
    results,
    count: results.length,
  };
}

function applyTradeListToState(
  state: MatchedTradesState,
  trades: MatchedTrade[],
  count?: number
) {
  const results = filterPendingMatchedTradeNotifications(trades);
  state.data = {
    ...(state.data ?? { next: null, previous: null }),
    results,
    count: count ?? results.length,
    next: state.data?.next ?? null,
    previous: state.data?.previous ?? null,
  };
}

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
      const trades: MatchedTrade[] =
        action.payload.trades || action.payload.results || [];
      applyTradeListToState(state, trades, action.payload.count);
    },
    addMatchedTradeFromWS: (state, action: PayloadAction<MatchedTrade>) => {
      if (!isPendingMatchedTradeNotification(action.payload)) return;
      if (state.data?.results) {
        const exists = state.data.results.some((t) => t.id === action.payload.id);
        if (exists) return;
        state.data.results = [action.payload, ...state.data.results];
        state.data.count = state.data.results.length;
      } else {
        state.data = {
          results: [action.payload],
          count: 1,
          next: null,
          previous: null,
        };
      }
    },
    updateSingleTradeFromWS: (state, action: PayloadAction<MatchedTrade>) => {
      const trade = action.payload;
      const tradeId = trade.id;
      if (!state.data?.results || !tradeId) return;

      if (!isPendingMatchedTradeNotification(trade)) {
        state.data.results = state.data.results.filter((t) => t.id !== tradeId);
        state.data.count = state.data.results.length;
        return;
      }

      const index = state.data.results.findIndex((t) => t.id === tradeId);
      if (index !== -1) {
        state.data.results[index] = trade;
      } else {
        state.data.results = [trade, ...state.data.results];
      }
      state.data.count = state.data.results.length;
    },
    removeMatchedTradeFromWS: (state, action: PayloadAction<string>) => {
      if (!state.data?.results) return;
      const before = state.data.results.length;
      state.data.results = state.data.results.filter(
        (trade) => trade.id !== action.payload
      );
      if (state.data.results.length !== before) {
        state.data.count = state.data.results.length;
      }
    },
    removeMatchedTradeByStatusFromWS: (
      state,
      action: PayloadAction<{ tradeId: string; status?: string }>
    ) => {
      const { tradeId, status } = action.payload;
      if (!tradeId) return;
      if (status && !isTerminalMatchedTradeNotificationStatus(status)) return;
      if (!state.data?.results) return;
      state.data.results = state.data.results.filter((t) => t.id !== tradeId);
      state.data.count = state.data.results.length;
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
        state.data = withFilteredResults(action.payload);
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
  removeMatchedTradeByStatusFromWS,
} = matchedTradesSlice.actions;
export default matchedTradesSlice.reducer;
