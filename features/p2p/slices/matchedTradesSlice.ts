import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { getMatchedTrades } from "../api";
import { MatchedTrade, MatchedTradesResponse } from "../types";
import {
  filterPendingMatchedTradeNotifications,
  isPendingMatchedTradeNotification,
  isTerminalMatchedTradeNotificationStatus,
} from "../utils/matchedTradeNotifications";
import {
  fetchLatestMatchedTradesPage as fetchLatestMatchedTradesPageApi,
  getMatchedTradesPageSize,
  getMatchedTradesTotalPages,
} from "../utils/matchedTradesPagination";

interface MatchedTradesState {
  data: MatchedTradesResponse | null;
  loading: boolean;
  refreshing: boolean;
  hasLoaded: boolean;
  error: string | null;
  activePage: number;
  totalPages: number;
}

const initialState: MatchedTradesState = {
  data: null,
  loading: false,
  refreshing: false,
  hasLoaded: false,
  error: null,
  activePage: 1,
  totalPages: 1,
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
  };
}

function sortTradesNewestFirst(trades: MatchedTrade[]): MatchedTrade[] {
  return [...trades].sort((a, b) => {
    const timeA = new Date(String(a.timestamp || 0)).getTime();
    const timeB = new Date(String(b.timestamp || 0)).getTime();
    return timeB - timeA;
  });
}

function mergePendingTrades(
  existing: MatchedTrade[],
  incoming: MatchedTrade[]
): MatchedTrade[] {
  const byId = new Map<string, MatchedTrade>();
  for (const trade of existing) {
    if (isPendingMatchedTradeNotification(trade)) {
      byId.set(String(trade.id), trade);
    }
  }
  for (const trade of incoming) {
    const id = String(trade.id);
    if (!id) continue;
    if (isPendingMatchedTradeNotification(trade)) {
      byId.set(id, trade);
    } else {
      byId.delete(id);
    }
  }
  return sortTradesNewestFirst(Array.from(byId.values()));
}

function applyTradeListToState(
  state: MatchedTradesState,
  trades: MatchedTrade[],
  options?: { count?: number; replace?: boolean }
) {
  const incoming = filterPendingMatchedTradeNotifications(trades);
  const results = options?.replace
    ? sortTradesNewestFirst(incoming)
    : mergePendingTrades(state.data?.results || [], incoming);

  state.data = {
    ...(state.data ?? { next: null, previous: null, count: 0 }),
    results,
    count: options?.count ?? state.data?.count ?? results.length,
    next: state.data?.next ?? null,
    previous: state.data?.previous ?? null,
  };
}

export const fetchMatchedTrades = createAsyncThunk(
  "matchedTrades/fetchMatchedTrades",
  async (page: number = 1) => {
    const response = await getMatchedTrades(page);
    return { response, page };
  }
);

/** One HTTP round-trip to the latest page — avoids page-1 flash on notification center. */
export const fetchLatestMatchedTradesPage = createAsyncThunk(
  "matchedTrades/fetchLatestMatchedTradesPage",
  async () => {
    return fetchLatestMatchedTradesPageApi();
  }
);

const matchedTradesSlice = createSlice({
  name: "matchedTrades",
  initialState,
  reducers: {
    clearMatchedTrades: (state) => {
      state.data = null;
      state.error = null;
      state.hasLoaded = false;
      state.activePage = 1;
      state.totalPages = 1;
    },
    updateMatchedTradesFromWS: (state, action) => {
      const trades: MatchedTrade[] =
        action.payload.trades || action.payload.results || [];
      if (!trades.length) return;
      applyTradeListToState(state, trades, {
        count: action.payload.count,
        replace: action.payload.replace === true,
      });
    },
    addMatchedTradeFromWS: (state, action: PayloadAction<MatchedTrade>) => {
      if (!isPendingMatchedTradeNotification(action.payload)) return;
      if (state.data?.results) {
        const exists = state.data.results.some((t) => t.id === action.payload.id);
        if (exists) return;
        state.data.results = sortTradesNewestFirst([
          action.payload,
          ...state.data.results,
        ]);
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
        return;
      }

      const index = state.data.results.findIndex((t) => t.id === tradeId);
      if (index !== -1) {
        state.data.results[index] = trade;
      } else {
        state.data.results = sortTradesNewestFirst([trade, ...state.data.results]);
      }
    },
    removeMatchedTradeFromWS: (state, action: PayloadAction<string>) => {
      if (!state.data?.results) return;
      state.data.results = state.data.results.filter(
        (trade) => trade.id !== action.payload
      );
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
    },
  },
  extraReducers: (builder) => {
    const onPending = (state: MatchedTradesState) => {
      state.error = null;
      if (state.data?.results?.length) {
        state.refreshing = true;
      } else {
        state.loading = true;
      }
    };
    const onRejected = (state: MatchedTradesState, message?: string) => {
      state.loading = false;
      state.refreshing = false;
      state.error = message || "Failed to fetch matched trades";
    };
    const onFulfilled = (
      state: MatchedTradesState,
      payload: MatchedTradesResponse,
      page: number,
      totalPages?: number
    ) => {
      state.loading = false;
      state.refreshing = false;
      state.hasLoaded = true;
      state.activePage = page;
      if (totalPages != null) state.totalPages = totalPages;
      state.data = withFilteredResults(payload);
    };

    builder
      .addCase(fetchMatchedTrades.pending, (state) => {
        onPending(state);
      })
      .addCase(fetchMatchedTrades.fulfilled, (state, action) => {
        const { response, page } = action.payload;
        const pageSize = getMatchedTradesPageSize(response);
        state.totalPages = getMatchedTradesTotalPages(response.count ?? 0, pageSize);
        onFulfilled(state, response, page);
      })
      .addCase(fetchMatchedTrades.rejected, (state, action) => {
        onRejected(state, action.error.message);
      })
      .addCase(fetchLatestMatchedTradesPage.pending, (state) => {
        onPending(state);
      })
      .addCase(fetchLatestMatchedTradesPage.fulfilled, (state, action) => {
        const { data, page, totalPages } = action.payload;
        onFulfilled(state, data, page, totalPages);
      })
      .addCase(fetchLatestMatchedTradesPage.rejected, (state, action) => {
        onRejected(state, action.error.message);
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
