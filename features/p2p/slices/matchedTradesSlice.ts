import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { getMatchedTrades } from "../api";
import { MatchedTrade, MatchedTradesResponse } from "../types";
import {
  filterPendingMatchedTradeNotifications,
  isPendingMatchedTradeNotification,
  isTerminalMatchedTradeNotificationStatus,
  sortMatchedTradeNotificationsNewestFirst,
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

function sortTradesNewestFirst(trades: MatchedTrade[]): MatchedTrade[] {
  return sortMatchedTradeNotificationsNewestFirst(trades);
}

/** Merge HTTP page rows into existing pending list (avoids wipe on poll/refresh). */
function mergeHttpPageIntoState(
  state: MatchedTradesState,
  payload: MatchedTradesResponse
): MatchedTradesResponse {
  const merged = mergePendingTrades(
    state.data?.results || [],
    payload.results || []
  );
  return {
    ...payload,
    results: merged,
    count: merged.length,
  };
}

/** WS `initial_data` / `trades_update` — server snapshot replaces pending list. */
function replacePendingTradesFromSnapshot(trades: MatchedTrade[]): MatchedTrade[] {
  return sortTradesNewestFirst(
    filterPendingMatchedTradeNotifications(trades)
  );
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

function ensureMatchedTradesData(state: MatchedTradesState): MatchedTradesResponse {
  if (!state.data) {
    state.data = { results: [], count: 0, next: null, previous: null };
  }
  return state.data;
}

/** Keep results pending-only and sync badge count with list length. */
function syncPendingNotificationCount(state: MatchedTradesState) {
  if (!state.data) return;
  state.data.results = filterPendingMatchedTradeNotifications(
    state.data.results
  );
  state.data.count = state.data.results.length;
}

function markMatchedTradesReady(state: MatchedTradesState) {
  state.hasLoaded = true;
  state.loading = false;
  state.refreshing = false;
}

function applyTradeListToState(
  state: MatchedTradesState,
  trades: MatchedTrade[],
  options?: { replace?: boolean }
) {
  const results = options?.replace
    ? replacePendingTradesFromSnapshot(trades)
    : mergePendingTrades(state.data?.results || [], trades);

  state.data = {
    ...(state.data ?? { next: null, previous: null, count: 0 }),
    results,
    /** Badge/list count = pending rows only (not server total trade history). */
    count: results.length,
    next: state.data?.next ?? null,
    previous: state.data?.previous ?? null,
  };
  markMatchedTradesReady(state);
}

function upsertMatchedTradeFromWSReducer(
  state: MatchedTradesState,
  action: PayloadAction<MatchedTrade>
) {
  const trade = action.payload;
  const tradeId = String(trade.id ?? "").trim();
  if (!tradeId) return;

  const data = ensureMatchedTradesData(state);
  const index = data.results.findIndex((t) => String(t.id) === tradeId);
  const pending = isPendingMatchedTradeNotification(trade);

  if (!pending) {
    if (index !== -1) {
      data.results.splice(index, 1);
    }
    syncPendingNotificationCount(state);
    markMatchedTradesReady(state);
    return;
  }

  if (index !== -1) {
    data.results[index] = trade;
  } else {
    data.results = sortTradesNewestFirst([...data.results, trade]);
  }
  syncPendingNotificationCount(state);
  markMatchedTradesReady(state);
}

function removeMatchedTradeFromWSReducer(
  state: MatchedTradesState,
  action: PayloadAction<string>
) {
  const tradeId = String(action.payload ?? "").trim();
  if (!tradeId || !state.data?.results) return;
  const before = state.data.results.length;
  state.data.results = state.data.results.filter(
    (trade) => String(trade.id) !== tradeId
  );
  if (state.data.results.length !== before) {
    syncPendingNotificationCount(state);
    markMatchedTradesReady(state);
  }
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
      applyTradeListToState(state, trades, {
        replace: action.payload.replace !== false,
      });
    },
    /** Single trade from matched-trades WS `trade_update` (+1 / update / -1 when terminal). */
    upsertMatchedTradeFromWS: upsertMatchedTradeFromWSReducer,
    addMatchedTradeFromWS: upsertMatchedTradeFromWSReducer,
    updateSingleTradeFromWS: upsertMatchedTradeFromWSReducer,
    removeMatchedTradeFromWS: removeMatchedTradeFromWSReducer,
    removeMatchedTradeByStatusFromWS: (
      state,
      action: PayloadAction<{ tradeId: string; status?: string }>
    ) => {
      const tradeId = String(action.payload.tradeId ?? "").trim();
      const { status } = action.payload;
      if (!tradeId) return;
      if (status && !isTerminalMatchedTradeNotificationStatus(status)) return;
      removeMatchedTradeFromWSReducer(state, {
        type: "matchedTrades/removeMatchedTradeFromWS",
        payload: tradeId,
      });
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
      state.data = mergeHttpPageIntoState(state, payload);
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
  upsertMatchedTradeFromWS,
  addMatchedTradeFromWS,
  updateSingleTradeFromWS,
  removeMatchedTradeFromWS,
  removeMatchedTradeByStatusFromWS,
} = matchedTradesSlice.actions;
export default matchedTradesSlice.reducer;
