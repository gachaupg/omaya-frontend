import { API_BASE_URL } from "@/config/api";

function getWebSocketBaseUrl() {
  if (API_BASE_URL.startsWith("https")) {
    return API_BASE_URL.replace(/^https/, "wss");
  }
  return API_BASE_URL.replace(/^http/, "ws");
}
// Create lib/apiConfig.ts
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  AUTH: {
    LOGIN: "/api/login/",
    LOGIN_2FA: "/api/login-2fa/",
    REGISTER: "/api/register/",
    FORGOT_PASSWORD: "/api/forget-password/",
    RESET_PASSWORD: "/api/reset-password/",
    VERIFY_OTP: "/api/verify-otp/",
    LOGOUT: "/api/logout/",
    REFRESH_TOKEN: "/api/token/refresh/",
    PROFILE: "/api/profile/",
    KYC_STATUS: "/api/kyc/status/",
    KYC_VERIFY: "/api/kyc/verify/",
    SUMSUB_INITIATE: "/api/sumsub/initiate/",
    SUMSUB_TOKEN: "/api/sumsub/token/",
    ENABLE_2FA: "/api/2fa/enable/",
    VERIFY_2FA_SETUP: "/api/2fa/verify-setup/",
  },
  BLOG: {
    BLOGS: "/administration/blogs/blog/",
    NEWS: "/administration/blogs/news/",
  },
  P2P: {
    BASE: "/trading_engine/p2p/",
    WALLETS: "api/wallet/wallets/",
    DEPOSITS: "/trading_engine/p2p/deposits/",
    DEPOSIT_ADDRESSES: "/trading_engine/p2p/deposit/addresses/",
    WITHDRAWS: "trading_engine/p2p-withdraw/",
    P2P_WITHDRAW: "/trading_engine/p2p-withdraw/",
    P2P_DEPOSIT_CREATE: "/trading_engine/p2p/deposit/create/",
    BUY_ADS: "/ads/buy/",
    SELL_ADS: "/ads/sell/",
    ASSETS: "/administration/admin/fronted-all-asset-network-range/",
    ADMIN_PAYMENT_DETAILS: "/administration/admin/payment-providers/",
    ADMIN_PAYMENT_PROVIDERS: "/administration/admin/payment-providers/",
    USER_PAYMENT_DETAILS: "/payments/user-payment-details/",
    PUBLIC_PAYMENT_METHODS: "/payments/public/payment-methods/",
    ORDERS: "/trading_engine/p2p/orders/",
    ALL_ORDERS: "/trading_engine/p2p/all-orders/",
    MY_ORDERS: "/trading_engine/p2p/all-orders/",
    BUY_SELL_ORDERS: "trading_engine/p2p/all-orders/?my_orders=true",
    TRANSACTION_SUMMARY: "/trading_engine/transactionsummaryview/",
    ORDER_MATCH: "/trading_engine/p2p/orders/",
    GET_CONFIRM_ORDER: "/trading_engine/p2p/trades/",
    SINGLE_ORDER: "/trading_engine/p2porders/",
    CANCEL_ORDER: "/trading_engine/p2p/trades/",
    APPEALS: "/trading_engine/appeals/create/",
    MATCHED_TRADES: "/trading_engine/trades/matched/",
    CONFIRM_TRADES: "/trading_engine/p2p/trades/",
    USER_TRADES: "/trading_engine/p2p/user-trades/",
    FEEDBACK_REVIEW: "/trading_engine/feedback_review/",
    FEEDBACK_SUBMIT: (tradeId: string) => `/trading_engine/trades/${tradeId}/feedback/`,
    ALL_TRANSACTIONS: "/trading_engine/all-transactions/",
    USER_TRANSACTIONS: "/trading_engine/transactions/",
    DELETE_ORDER: "/trading_engine/p2p/orders/",
    TOGGLE_ORDER_STATUS: "/trading_engine/p2p/orders/",
    DUPLICATE_ORDER: "/trading_engine/p2p/orders/",
    EDIT_AD: "/trading_engine/p2p/orders/",
    UPDATE_PROFILE: "/api/update/profile/",
    DELETE_PAYMENT_METHOD: "/payments/user-payment-details/",
    TRADE_MESSAGES: (tradeId: string) =>
      `/trading_engine/trades/${tradeId}/messages/`,
    REFERRAL_USERS: (code: string) => `/api/referred-users/${code}/`,
    REFERRAL_WALLET: "/api/wallet/referral-wallet/",
    REFERRAL_WITHDRAW: "/trading_engine/referral/withdraw/",
    REFERRAL_VERIFY_OTP: "/trading_engine/verify-referral/otp/",
    WITHDRAWAL_OTP: "/trading_engine/p2pwithdraw-otp/",
    WITHDRAWAL_OTP_RESEND: (withdrawalId: string) => 
      `/trading_engine/p2pwithdraw/resend-otp/${withdrawalId}/`,
    WITHDRAWAL_ADDRESSES: "/trading_engine/withdrawal/addresses/",
    MATCHED_TRADE: "/trading_engine/p2p/trades/",
    MERCHANT_SUBMIT: "/trading_engine/merchant/submit/",
    MERCHANT_APPLICATION: "/trading_engine/merchant/application/",
    SOCKETS: {
      MATCHED_TRADES: (token: string) =>
        `${getWebSocketBaseUrl()}/ws/matched-trades/?token=${token}`,
      TRADE_MESSAGES: (tradeId: string, token: string) =>
        `${getWebSocketBaseUrl()}/ws/p2p-trade-messages/${tradeId}/?token=${token}`,
      TRADE_STATUS: (tradeId: string, token: string) =>
        `${getWebSocketBaseUrl()}/ws/p2p-trade-confirm/${tradeId}/?token=${token}`,
      P2P_ORDERS: (token: string) =>
        `${getWebSocketBaseUrl()}/ws/p2p-orders/?token=${token}`,
      RECENT_MESSAGES: (token: string) =>
        `${getWebSocketBaseUrl()}/ws/messages/?token=${token}`,
    },
  },
  SWAP: {
    SUPPORTED_ASSETS: "api/changenow/supported-tokens/",
    ESTIMATE_SWAP: "/api/changenow/estimate/",
    PUBLIC_ESTIMATE_SWAP: "/api/changenow/public/estimate/",
    CREATE_SWAP: "/api/changenow/create/",
    SWAP_STATUS: "/api/changenow/status/",
    SWAP_HISTORY: "/api/changenow/user/history/",
    VALIDATE_ADDRESS: "/api/changenow/validate-address/",
    SWAP_STATUS_WS: (swapId: string) =>
      `${getWebSocketBaseUrl()}/ws/changenow/status/${swapId}/`,
  },
  RATES: {
    TRANSACTIONS: "/trading_engine/all-system-transactions/",
    SOCKETS: {
      ALL_SYSTEM_TRANSACTIONS: () =>
        `${getWebSocketBaseUrl()}/ws/all-system-transactions/`,
    },
  },
  P2P_WITHDRAWAL_DEPOSIT: {
    MY_TRANSACTIONS: "/trading_engine/my-transactions/",
  },
  SETTINGS: {
    CREATE_DEVICE: "/api/devices/create/",
    GET_DEVICE: "/api/device-sessions/",
    LOGOUT_DEVICE: (sessionId: string) =>
      `/api/device-sessions/logout/${sessionId}/`,
    LOGOUT_ALL_DEVICES: "/api/device-sessions/logout-all/",
  },
  EXCHANGE: {
    DEPOSIT: "/trading_engine/deposits/",
    WITHDRAW: "/trading_engine/withdraw/",
    SOCKETS: {
      TRANSACTION_STATUS: (txHash: string) =>
        `${getWebSocketBaseUrl()}/ws/withdrawal-status/${txHash}/`,
      DEPOSIT_STATUS: (transactionId: string) =>
        `${getWebSocketBaseUrl()}/ws/deposit-status/${transactionId}/`,
    },
  },
  EXPRESS: {
    WITHDRAW: "/trading_engine/withdraw/",
    CANCEL_DEPOSIT: (transactionId: string) => 
      `/trading_engine/transactions/cancel/exchange_deposit/${transactionId}/`,
    CANCEL_WITHDRAWAL: (transactionId: string) => 
      `/trading_engine/transactions/cancel/exchange_withdrawal/${transactionId}/`,
    CANCEL_P2P_DEPOSIT: (transactionId: string) => 
      `/trading_engine/transactions/cancel/p2p_deposit/${transactionId}/`,
    SOCKETS: {
      WITHDRAWAL_STATUS: (transactionId: string) =>
        `${getWebSocketBaseUrl()}/ws/withdrawal-status/${transactionId}/`,
    },
  },
  FOREX: {
    CREATE_EXCHANGE: "/trading_engine/forex/create-exchange/",
    GET_EXCHANGE: (transactionId: string) => `/trading_engine/forex/exchanges/${transactionId}/`,
    SOCKETS: {
      FOREX_STATUS: (transactionId: string, token: string) =>
        `${getWebSocketBaseUrl()}/ws/forex/status/${transactionId}/?token=${token}`,
    },
  },
  GOOGLE_AUTH: {
    LOGIN: "/accounts/google/login/",
    LOGIN_CALLBACK: "/accounts/google/login/callback/",
    LOGOUT: "/accounts/logout/",
  },
  CONTACT: {
    SUBMIT_CONTACT: "/trading_engine/support-requests/create/",
  },
  LIVE_CHAT: {
    BASE: "/api/live-chat/",
    CREATE_SESSION: "/api/live-chat/sessions/",
    GET_SESSION: (sessionId: string) => `/api/live-chat/sessions/${sessionId}/`,
    GET_MESSAGES: (sessionId: string) => `/api/live-chat/sessions/${sessionId}/messages/`,
    QUEUE_STATUS: "/api/live-chat/queue/status/",
    SOCKETS: {
      CHAT: (sessionId: string, token: string) =>
        `${getWebSocketBaseUrl()}/ws/live-chat/${sessionId}/?token=${token}`,
    },
  },
  MARKETING: {
    HIGHLIGHT_STATISTICS: "/trading_engine/highlight-statistics/",
  },
  REFERRAL: {
    CALCULATE_FEES: "/trading_engine/referral/calculate-fees/",
  },
  MONEYX: {
    TRANSACTIONS: "/api/moneyx/transactions/",
    UPDATE_TRANSACTION: (transactionId: string) => `/api/moneyx/transactions/${transactionId}/`,
    SOCKETS: {
      STATUS: (transactionId: string) =>
        `${getWebSocketBaseUrl()}/ws/moneyx/status/${transactionId}/`,
    },
  },
};
