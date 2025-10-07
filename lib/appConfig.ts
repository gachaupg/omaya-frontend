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
    WALLETS: "api/wallet/wallets/",
    DEPOSITS: "/trading_engine/p2p/deposits/",
    DEPOSIT_ADDRESSES: "/trading_engine/p2p/deposit/addresses/",
    WITHDRAWS: "trading_engine/p2p-withdraw/",
    P2P_WITHDRAW: "/trading_engine/p2p-withdraw/",
    P2P_DEPOSIT_CREATE: "/trading_engine/p2p/deposit/create/",
    BUY_ADS: "/ads/buy/",
    SELL_ADS: "/ads/sell/",
    ASSETS: "/administration/admin/fronted-all-asset-network-range/",
    ADMIN_PAYMENT_DETAILS: "/payments/admin/payment-details/",
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
    REFERRAL_USERS: (code: string) => `/api/referred-users/${code}/`,
    REFERRAL_WALLET: "/api/wallet/referral-wallet/",
    REFERRAL_WITHDRAW: "/trading_engine/referral/withdraw/",
    WITHDRAWAL_OTP: "/trading_engine/p2pwithdraw-otp/",
    WITHDRAWAL_ADDRESSES: "/trading_engine/withdrawal/addresses/",
    MATCHED_TRADE: "/trading_engine/p2p/trades/",
    MERCHANT_SUBMIT: "/trading_engine/merchant/submit/",
    MERCHANT_APPLICATION: "/trading_engine/merchant/application/",
  },
  SWAP: {
    SUPPORTED_ASSETS: "api/changenow/supported-tokens/",
    ESTIMATE_SWAP: "/api/changenow/estimate/",
    CREATE_SWAP: "/api/changenow/create/",
    SWAP_STATUS: "/api/changenow/status/",
    SWAP_STATUS_WS: (swapId: string) =>
      `${getWebSocketBaseUrl()}/ws/changenow/status/${swapId}/`,
  },
  RATES: {
    TRANSACTIONS: "/trading_engine/detail-transactions/",
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
    SOCKETS: {
      WITHDRAWAL_STATUS: (transactionId: string) =>
        `${getWebSocketBaseUrl()}/ws/withdrawal-status/${transactionId}/`,
    },
  },
  GOOGLE_AUTH: {
    GOOGLE_AUTH: "/api/auth/google/",
  },
  CONTACT: {
    SUBMIT_CONTACT: "/trading_engine/contact/",
  },
};
