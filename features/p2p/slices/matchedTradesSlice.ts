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
  collectDismissedKeysForHints,
  isTradeInDismissedSet,
} from "../utils/resolveMatchedTradeRemoval";
import { isPendingAcceptanceStatus } from "../utils/tradeWsAcceptanceGate";
import {
  fetchLatestMatchedTradesPage as fetchLatestMatchedTradesPageApi,
  getMatchedTradesPageSize,
  getMatchedTradesTotalPages,
} from "../utils/matchedTradesPagination";
import { logout } from "@/features/auth/slices/authSlice";
import { cancelP2POrderThunk } from "./orderSlice";

interface MatchedTradesState {
  data: MatchedTradesResponse | null;
  loading: boolean;
  refreshing: boolean;
  hasLoaded: boolean;
  error: string | null;
  activePage: number;
  totalPages: number;
  /** Trade / order ids the user dismissed — never re-show in bell or notifications. */
  dismissedNotificationKeys: string[];
}

const initialState: MatchedTradesState = {
  data: null,
  loading: false,
  refreshing: false,
  hasLoaded: false,
  error: null,
  activePage: 1,
  totalPages: 1,
  dismissedNotificationKeys: [],
};

function dismissedKeySet(state: MatchedTradesState): Set<string> {
  return new Set(
    (state.dismissedNotificationKeys ?? [])
      .map((key) => String(key).trim())
      .filter(Boolean)
  );
}

function withoutDismissedTrades(
  state: MatchedTradesState,
  trades: MatchedTrade[]
): MatchedTrade[] {
  const dismissed = dismissedKeySet(state);
  if (!dismissed.size) return trades;
  return trades.filter((trade) => !isTradeInDismissedSet(trade, dismissed));
}

function sortTradesNewestFirst(trades: MatchedTrade[]): MatchedTrade[] {
  return sortMatchedTradeNotificationsNewestFirst(trades);
}

/** Merge HTTP page rows into existing list (pagination only — not used for latest-page refresh). */
function mergeHttpPageIntoState(
  state: MatchedTradesState,
  payload: MatchedTradesResponse
): MatchedTradesResponse {
  const merged = mergeTrades(
    state.data?.results || [],
    payload.results || [],
    dismissedKeySet(state)
  );
  return {
    ...payload,
    results: normalizeNotificationTrades(state, merged),
    count: payload.count ?? merged.length,
  };
}

/** Latest-page HTTP refresh replaces the list so stale persisted rows cannot stick after WS removals. */
function replaceHttpPageInState(
  state: MatchedTradesState,
  payload: MatchedTradesResponse
): MatchedTradesResponse {
  const results = normalizeNotificationTrades(state, payload.results || []);
  return {
    ...payload,
    results,
    count: payload.count ?? results.length,
  };
}

/** WS `initial_data` / `trades_update` — server snapshot replaces stored list. */
function replaceTradesFromSnapshot(
  trades: MatchedTrade[],
  dismissed: ReadonlySet<string>
): MatchedTrade[] {
  return sortTradesNewestFirst(
    trades
      .filter((trade) => !isTradeInDismissedSet(trade, dismissed))
      .filter(isPendingMatchedTradeNotification)
  );
}

function mergeTrades(
  existing: MatchedTrade[],
  incoming: MatchedTrade[],
  dismissed: ReadonlySet<string> = new Set()
): MatchedTrade[] {
  const byId = new Map<string, MatchedTrade>();
  for (const trade of existing) {
    const id = String(trade.id);
    if (!id || isTradeInDismissedSet(trade, dismissed)) continue;
    byId.set(id, trade);
  }
  for (const trade of incoming) {
    const id = String(trade.id);
    if (!id) continue;
    if (isTradeInDismissedSet(trade, dismissed)) {
      byId.delete(id);
      continue;
    }
    byId.set(id, trade);
  }
  return sortTradesNewestFirst(Array.from(byId.values()));
}

function ensureMatchedTradesData(state: MatchedTradesState): MatchedTradesResponse {
  if (!state.data) {
    state.data = { results: [], count: 0, next: null, previous: null };
  }
  return state.data;
}

/** Keep notification rows: not dismissed and still pending (terminal trades drop off immediately). */
function syncNotificationResults(state: MatchedTradesState) {
  if (!state.data) return;
  state.data.results = withoutDismissedTrades(state, state.data.results).filter(
    isPendingMatchedTradeNotification
  );
}

function normalizeNotificationTrades(
  state: MatchedTradesState,
  trades: MatchedTrade[]
): MatchedTrade[] {
  return sortTradesNewestFirst(
    withoutDismissedTrades(state, trades).filter(isPendingMatchedTradeNotification)
  );
}

function dismissMatchedTradesReducer(
  state: MatchedTradesState,
  action: PayloadAction<string[]>
) {
  const incoming = action.payload
    .map((key) => String(key).trim())
    .filter(Boolean);
  if (!incoming.length) return;

  const merged = new Set([
    ...(state.dismissedNotificationKeys ?? []),
    ...incoming,
  ]);
  state.dismissedNotificationKeys = Array.from(merged);

  if (state.data?.results) {
    const dismissed = dismissedKeySet(state);
    state.data.results = state.data.results.filter(
      (trade) => !isTradeInDismissedSet(trade, dismissed)
    );
    syncNotificationResults(state);
  }

  markMatchedTradesReady(state);
}

function markMatchedTradesReady(state: MatchedTradesState) {
  state.hasLoaded = true;
  state.loading = false;
  state.refreshing = false;
}

function applyTradeListToState(
  state: MatchedTradesState,
  trades: MatchedTrade[],
  options?: { replace?: boolean; serverCount?: number }
) {
  const dismissed = dismissedKeySet(state);
  const results = options?.replace
    ? replaceTradesFromSnapshot(trades, dismissed)
    : normalizeNotificationTrades(
        state,
        mergeTrades(state.data?.results || [], trades, dismissed)
      );

  const serverCount = options?.serverCount;
  state.data = {
    ...(state.data ?? { next: null, previous: null, count: 0 }),
    results,
    count:
      typeof serverCount === "number" && serverCount >= results.length
        ? serverCount
        : Math.max(state.data?.count ?? 0, results.length),
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
  const dismissed = dismissedKeySet(state);
  if (isTradeInDismissedSet(trade, dismissed)) {
    const index = data.results.findIndex((t) => String(t.id) === tradeId);
    if (index !== -1) data.results.splice(index, 1);
    syncNotificationResults(state);
    markMatchedTradesReady(state);
    return;
  }

  const index = data.results.findIndex((t) => String(t.id) === tradeId);
  const pending = isPendingMatchedTradeNotification(trade);

  if (!pending) {
    if (index !== -1) {
      data.results.splice(index, 1);
    }
    syncNotificationResults(state);
    markMatchedTradesReady(state);
    return;
  }

  if (index !== -1) {
    data.results[index] = trade;
  } else {
    data.results = sortTradesNewestFirst([...data.results, trade]);
  }
  syncNotificationResults(state);
  markMatchedTradesReady(state);
}

function removeMatchedTradeFromWSReducer(
  state: MatchedTradesState,
  action: PayloadAction<string>
) {
  dismissMatchedTradesReducer(state, {
    type: "matchedTrades/dismissMatchedTradesFromNotifications",
    payload: [String(action.payload ?? "").trim()].filter(Boolean),
  });
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

/** Drop notification rows whose confirm snapshot is already terminal (stale list / WS miss). */
export const reconcileCanceledMatchedNotifications = createAsyncThunk(
  "matchedTrades/reconcileCanceledMatchedNotifications",
  async (_, { getState, dispatch }) => {
    const state = getState() as { matchedTrades?: MatchedTradesState };
    const results = state.matchedTrades?.data?.results ?? [];
    const dismissed = new Set(
      (state.matchedTrades?.dismissedNotificationKeys ?? []).map(String)
    );
    const stalePending = results.filter(
      (trade) =>
        isPendingAcceptanceStatus(String(trade.status ?? "")) &&
        !isTradeInDismissedSet(trade, dismissed)
    );
    if (!stalePending.length) return;

    const keysToDismiss: string[] = [];
    const { fetchP2PTradeConfirmOnce } = await import(
      "../utils/resolveP2PTradeId"
    );
    await Promise.all(
      stalePending.map(async (trade) => {
        const confirm = await fetchP2PTradeConfirmOnce(String(trade.id), {
          force: true,
        });
        if (!confirm) return;
        const status = String(confirm.status ?? "").trim();
        if (!isTerminalMatchedTradeNotificationStatus(status)) return;
        keysToDismiss.push(
          ...collectDismissedKeysForHints([trade], { tradeId: trade.id })
        );
      })
    );

    const unique = Array.from(
      new Set(keysToDismiss.map((key) => String(key).trim()).filter(Boolean))
    );
    if (unique.length) {
      dispatch(dismissMatchedTradesFromNotifications(unique));
    }
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
      state.dismissedNotificationKeys = [];
    },
    updateMatchedTradesFromWS: (state, action) => {
      const trades: MatchedTrade[] =
        action.payload.trades || action.payload.results || [];
      const serverCount =
        typeof action.payload.count === "number"
          ? action.payload.count
          : undefined;
      applyTradeListToState(state, trades, {
        replace: action.payload.replace !== false,
        serverCount,
      });
    },
    /** Single trade from matched-trades WS `trade_update` (+1 / update / -1 when terminal). */
    upsertMatchedTradeFromWS: upsertMatchedTradeFromWSReducer,
    addMatchedTradeFromWS: upsertMatchedTradeFromWSReducer,
    updateSingleTradeFromWS: upsertMatchedTradeFromWSReducer,
    removeMatchedTradeFromWS: removeMatchedTradeFromWSReducer,
    dismissMatchedTradesFromNotifications: dismissMatchedTradesReducer,
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
        state.loading = false;
        state.refreshing = false;
        state.hasLoaded = true;
        state.activePage = page;
        state.totalPages = totalPages;
        state.data = replaceHttpPageInState(state, data);
      })
      .addCase(logout, () => initialState)
      .addCase(fetchLatestMatchedTradesPage.rejected, (state, action) => {
        onRejected(state, action.error.message);
      })
      .addCase(cancelP2POrderThunk.fulfilled, (state, action) => {
        const id = String(action.meta.arg ?? "").trim();
        if (!id) return;
        const keys = collectDismissedKeysForHints(state.data?.results, {
          tradeId: id,
        });
        if (!keys.includes(id)) keys.push(id);
        dismissMatchedTradesReducer(state, {
          type: "matchedTrades/dismissMatchedTradesFromNotifications",
          payload: keys,
        });
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
  dismissMatchedTradesFromNotifications,
  removeMatchedTradeByStatusFromWS,
} = matchedTradesSlice.actions;
export default matchedTradesSlice.reducer;
