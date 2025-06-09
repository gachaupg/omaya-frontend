/**
 * rootReducer.ts – auto‑generated placeholder
 */

import { combineReducers } from "@reduxjs/toolkit";
import type { ThunkDispatch } from "@reduxjs/toolkit";
import type { AnyAction } from "redux";
import depositReducer from "../features/p2p/slices/depositSlice";
import withdrawReducer from "../features/p2p/slices/withdrawSlice";
import adReducer from "../features/p2p/slices/adSlice";
import assetsReducer from "../features/p2p/slices/assetsSlice";
import walletReducer from "../features/p2p/slices/walletSlice";
import paymentMethodsReducer from "../features/p2p/slices/paymentMethodsSlice";
import p2pMarketReducer from "../features/p2p/slices/orderSlice";
import p2pBuySellReducer from "../features/p2p/slices/p2pbuysell";
import authReducer from "../features/auth/slices/authSlice";
import transactionSummaryReducer from "@/features/p2p/slices/transactionSummarySlice";
import appealReducer from "../features/p2p/slices/appealSlice";
import messageReducer from "../features/p2p/slices/messageSlice";
import matchedTradesReducer from "../features/p2p/slices/matchedTradesSlice";
import userTradesReducer from "../features/p2p/slices/userTradesSlice";

const rootReducer = combineReducers({
  deposits: depositReducer,
  withdrawals: withdrawReducer,
  p2pAds: adReducer,
  assets: assetsReducer,
  wallets: walletReducer,
  paymentMethods: paymentMethodsReducer,
  p2pMarket: p2pMarketReducer,
  p2pBuySell: p2pBuySellReducer,
  auth: authReducer,
  transactionSummary: transactionSummaryReducer,
  appeal: appealReducer,
  message: messageReducer,
  matchedTrades: matchedTradesReducer,
  userTrades: userTradesReducer,
  // Add other reducers here
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ThunkDispatch<RootState, unknown, AnyAction>;
export default rootReducer;
