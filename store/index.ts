/**
 * index.ts – Redux store with persistence configuration
 *
 * Redux Persist saves critical data to localStorage to survive page refreshes
 * This eliminates the "first render delay" after hard refresh (Cmd+R)
 */

import { configureStore } from "@reduxjs/toolkit";
import type { ThunkDispatch } from "@reduxjs/toolkit";
import type { AnyAction } from "redux";
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux";
import rootReducer, { RootState } from "./rootReducer";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  type PersistConfig,
  type PersistState,
} from "redux-persist";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web

/** Persisted root blob includes redux-persist’s own slice (migrate must not strip it). */
type PersistedRootState = RootState & { _persist: PersistState };

// Configure which slices to persist
const persistConfig: PersistConfig<RootState> = {
  key: "omaya_root",
  version: 2,
  storage,
  // Drop legacy `swap` from any stored blob so old localStorage cannot rehydrate stale swap UI
  migrate: async (state) => {
    if (state == null || typeof state !== "object") {
      return state as PersistedRootState | undefined;
    }
    const s = state as Record<string, unknown>;
    if (!("swap" in s)) {
      return state as PersistedRootState;
    }
    const { swap: _strip, ...rest } = s;
    // `_persist` stays on `rest` when present; cast satisfies redux-persist’s PersistedState
    return rest as PersistedRootState;
  },
  // Swap is intentionally NOT persisted: full page reload should show default amounts/pair,
  // and stale estimate / "0.0" send amounts were sticking in localStorage.
  // Whitelist: slices to persist (keep between page refreshes)
  whitelist: [
    "auth", // User authentication state
    "wallets", // Wallet balances
    "matchedTrades", // P2P matched trades
    "transactionSummary", // Transaction summary
    "exchange", // Exchange data
    "settings", // User settings
    "p2pMarket", // P2P market orders
  ],
  // Blacklist: slices NOT to persist
  blacklist: [
    "message", // Chat messages (too large, use WebSocket)
    "appeal", // Appeals (temporary)
    "feedback", // Feedback (temporary)
  ],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
      immutableCheck: false, // Keep disabled for now (will fix in Week 2)
    }),
});

export const persistor = persistStore(store);

export type AppDispatch = ThunkDispatch<RootState, unknown, AnyAction>;
export type { RootState };
export { store };

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
