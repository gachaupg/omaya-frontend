/**
 * apiFallbacks.ts - Fallback data for API failures
 * Provides mock/fallback data when APIs are unavailable
 */

export const ApiFallbacks = {
  // Wallet fallbacks
  wallets: {
    empty: [],
    sample: [
      {
        currency: "USDT",
        balance: "0.00",
        network: "TRC20",
        address: "Loading...",
      },
      {
        currency: "BTC",
        balance: "0.00",
        network: "Bitcoin",
        address: "Loading...",
      },
    ],
  },

  // Transaction fallbacks
  transactions: {
    empty: {
      results: [],
      count: 0,
      next: null,
      previous: null,
    },
    loading: {
      results: [
        {
          id: "loading-1",
          type: "Loading...",
          amount: "0.00",
          currency: "USDT",
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ],
      count: 1,
      next: null,
      previous: null,
    },
  },

  // P2P Order fallbacks
  p2pOrders: {
    empty: {
      buy_orders: {
        results: [],
        count: 0,
        next: null,
        previous: null,
      },
      sell_orders: {
        results: [],
        count: 0,
        next: null,
        previous: null,
      },
    },
  },

  // Market data fallbacks
  markets: {
    empty: [],
    sample: [
      {
        id: "bitcoin",
        symbol: "btc",
        name: "Bitcoin",
        current_price: 0,
        market_cap: 0,
        market_cap_rank: 1,
        price_change_percentage_24h: 0,
        total_volume: 0,
        image:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23f97316'/%3E%3Ctext x='16' y='20' text-anchor='middle' fill='white' font-family='Arial' font-size='12' font-weight='bold'%3E₿%3C/text%3E%3C/svg%3E",
      },
    ],
  },

  // Swap data fallbacks
  swap: {
    supportedAssets: [],
    estimate: {
      estimated_amount: "0",
      network_fee: "0",
      service_fee: "0",
      total_fee: "0",
      rate: "0",
    },
  },

  // Exchange data fallbacks
  exchange: {
    assets: {
      results: [],
      count: 0,
    },
    statistics: {
      total_deposits: 0,
      total_withdrawals: 0,
      total_trades: 0,
      total_volume: 0,
    },
  },

  // User profile fallbacks
  profile: {
    empty: {
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      is_verified: false,
      kyc_status: "not_submitted",
    },
  },

  // Payment methods fallbacks
  paymentMethods: {
    empty: [],
    sample: [
      {
        id: "loading-1",
        name: "Loading...",
        type: "bank_transfer",
        fields: [],
      },
    ],
  },
};

// Helper function to get fallback data by type
export function getFallbackData(type: string, subtype: string = "empty"): any {
  const fallbackCategory = ApiFallbacks[type as keyof typeof ApiFallbacks];
  if (!fallbackCategory) {
    return null;
  }

  return fallbackCategory[subtype as keyof typeof fallbackCategory] || null;
}

// Check if data looks like fallback data
export function isFallbackData(data: any): boolean {
  if (!data) return false;

  // Check common fallback indicators
  if (Array.isArray(data) && data.length === 0) return true;
  if (
    typeof data === "object" &&
    data.results &&
    Array.isArray(data.results) &&
    data.results.length === 0
  )
    return true;
  if (
    typeof data === "object" &&
    data.id &&
    typeof data.id === "string" &&
    data.id.startsWith("loading-")
  )
    return true;

  return false;
}

export default ApiFallbacks;
