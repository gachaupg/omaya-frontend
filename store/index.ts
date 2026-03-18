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
  createTransform,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web

/** Old persisted swap.estimateError could be { message, response_data } — breaks toasts / React children */
const sanitizeSwapPersist = createTransform<
  Record<string, unknown> | undefined,
  Record<string, unknown> | undefined,
  RootState
>(
  (state) => state,
  (state) => {
    if (!state || typeof state !== "object") return state;
    const ee = state.estimateError as unknown;
    if (ee != null && typeof ee === "object" && !Array.isArray(ee)) {
      const p = ee as {
        message?: unknown;
        response_data?: { message?: string; error?: string };
      };
      let s =
        typeof p.message === "string"
          ? p.message.trim()
          : p.message != null && typeof p.message !== "object"
            ? String(p.message).trim()
            : "";
      const rd = p.response_data;
      if (!s && rd && typeof rd === "object") {
        if (typeof rd.message === "string" && rd.message.trim())
          s = rd.message.trim();
        else if (typeof rd.error === "string" && rd.error.trim())
          s = rd.error.trim();
      }
      return { ...state, estimateError: s || null };
    }
    return state;
  },
  { whitelist: ["swap"] }
);

// Configure which slices to persist
const persistConfig = {
  key: "omaya_root",
  version: 1,
  storage,
  transforms: [sanitizeSwapPersist],
  // Whitelist: slices to persist (keep between page refreshes)
  whitelist: [
    "auth", // User authentication state
    "wallets", // Wallet balances
    "matchedTrades", // P2P matched trades
    "transactionSummary", // Transaction summary
    "exchange", // Exchange data
    "swap", // Swap assets
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
