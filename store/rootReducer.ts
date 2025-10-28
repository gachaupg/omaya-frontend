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
import paymentReducer from "../features/exchange/slices/paymentSlice";
import p2pMarketReducer from "../features/p2p/slices/orderSlice";
import p2pBuySellReducer from "../features/p2p/slices/p2pbuysell";
import myOrdersReducer from "../features/p2p/slices/myOrdersSlice";
import authReducer from "../features/auth/slices/authSlice";
import transactionSummaryReducer from "@/features/p2p/slices/transactionSummarySlice";
import appealReducer from "../features/p2p/slices/appealSlice";
import messageReducer from "../features/p2p/slices/messageSlice";
import matchedTradesReducer from "../features/p2p/slices/matchedTradesSlice";
import userTradesReducer from "../features/p2p/slices/userTradesSlice";
import feedbackReducer from "../features/p2p/slices/feedbackSlice";
import feedbackSubmissionReducer from "../features/p2p/slices/feedbackSubmissionSlice";
import p2pTransactionsReducer from "../features/p2p/slices/p2pTransactionsSlice";
import exchangeReducer from "../features/exchange/slices/exchangeSlice";
import referralReducer from "@/features/settings/slices/referralSlice";
import referralWalletReducer from "@/features/settings/slices/referralWalletSlice";
import referralWithdrawalHistoryReducer from "@/features/settings/slices/referralWithdrawalHistorySlice";
import settingsReducer from "@/features/settings/slices/settingsSlice";
import cashWithdrawalReducer from "@/features/settings/slices/cashWithdrawalSlice";
import swapReducer from "@/features/swap/slices/swapSlice";
import marketReducer from "@/features/markets/slices/marketSlice";

import blogReducer from "@/features/blogs/slices/blog";
import transactionReducer from "@/features/rates/slices/transactionSlice";
import googleOAuthReducer from "@/features/auth/slices/googleOAuthSlice";
import contactReducer from "@/features/contact/slices/contactSlice";
import kycReducer from "@/features/kyc/slices/kycSlice";
import merchantReducer from "@/features/p2p/slices/merchantSlice";
import expressTransactionReducer from "@/features/express/slices/transactionSlice";
import forexReducer from "@/features/express/slices/forexSlice";
import statisticsReducer from "@/features/marketing/slices/statisticsSlice";
import unreadMessagesReducer from "@/features/p2p/slices/unreadMessagesSlice";

const rootReducer = combineReducers({
  deposits: depositReducer,
  withdrawals: withdrawReducer,
  p2pAds: adReducer,
  assets: assetsReducer,
  wallets: walletReducer,
  paymentMethods: paymentMethodsReducer,
  payment: paymentReducer,
  p2pMarket: p2pMarketReducer,
  p2pBuySell: p2pBuySellReducer,
  myOrders: myOrdersReducer,
  auth: authReducer,
  transactionSummary: transactionSummaryReducer,
  appeal: appealReducer,
  message: messageReducer,
  matchedTrades: matchedTradesReducer,
  userTrades: userTradesReducer,
  feedback: feedbackReducer,
  feedbackSubmission: feedbackSubmissionReducer,
  p2pTransactions: p2pTransactionsReducer,
  exchange: exchangeReducer,
  referral: referralReducer,
  referralWallet: referralWalletReducer,
  referralWithdrawalHistory: referralWithdrawalHistoryReducer,
  settings: settingsReducer,
  cashWithdrawal: cashWithdrawalReducer,
  swap: swapReducer,
  markets: marketReducer,
  blog: blogReducer,
  transaction: transactionReducer,
  googleOAuth: googleOAuthReducer,
  contact: contactReducer,
  kyc: kycReducer,
  merchant: merchantReducer,
  expressTransaction: expressTransactionReducer,
  forex: forexReducer,
  statistics: statisticsReducer,
  unreadMessages: unreadMessagesReducer,
  // Add other reducers here
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ThunkDispatch<RootState, unknown, AnyAction>;
export default rootReducer;
