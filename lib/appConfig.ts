import { API_BASE_URL } from "@/config/api";

// Create lib/apiConfig.ts
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  AUTH: {
    LOGIN: "/api/login",
    // ...
  },
  P2P: {
    WALLETS: "/wallet/wallets/",
    DEPOSITS: "/trading_engine/p2p/deposit/",
    WITHDRAWS: "trading_engine/p2p-withdraw/",
    BUY_ADS: "/ads/buy/",
    SELL_ADS: "/ads/sell/",
    ASSETS: "/administration/admin/fronted-all-asset-network-range/",
    ADMIN_PAYMENT_DETAILS: "/payments/admin-payment-details/",
    USER_PAYMENT_DETAILS: "/payments/user-payment-details/",
    ORDERS: "/trading_engine/p2p/orders/",
    ALL_ORDERS: "/trading_engine/p2p/all-orders/",
    BUY_SELL_ORDERS: "trading_engine/p2p/all-orders/?my_orders=true",
    TRANSACTION_SUMMARY: "/trading_engine/transactionsummaryview/",
    ORDER_MATCH: "/trading_engine/p2p/orders/",
    GET_CONFIRM_ORDER: "/trading_engine/p2p/trades/",
    SINGLE_ORDER: "/trading_engine/p2p/orders/",
    CANCEL_ORDER: "/trading_engine/p2p/trades/",
    APPEALS: "/trading_engine/appeals/create/",
    MATCHED_TRADES: "/trading_engine/trades/matched/",
    CONFIRM_TRADES: "/trading_engine/p2p/trades/",
    USER_TRADES: "/trading_engine/p2p/user-trades/",
    FEEDBACK_REVIEW: "/trading_engine/feedback_review/",
    ALL_TRANSACTIONS: "/trading_engine/all-transactions/",
    DELETE_ORDER: "/trading_engine/p2p/orders/",
    TOGGLE_ORDER_STATUS: "/trading_engine/orders/",
    DUPLICATE_ORDER: "/trading_engine/p2p/orders/",
    EDIT_AD: "/trading_engine/p2p/orders/",
    UPDATE_PROFILE: "/api/update/profile/",
    DELETE_PAYMENT_METHOD: "/payments/user-payment-details/",
    TRADE_MESSAGES: (tradeId: string) =>
      `/trading_engine/trades/${tradeId}/messages/`,
  },
};
