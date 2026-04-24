/**
 * exchangeSlice.ts – auto‑generated placeholder
 */
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import {
  post,
  patch,
  get,
  del,
  AxiosError,
  AxiosRequestConfig,
} from "../../../lib/apiClient";
import { cachedGet } from "../../../lib/cachedApiClient";
import { EXCHANGE_ENDPOINTS } from "../api";
import NetworkFallback from "../../../lib/utils/networkFallback";
import CircuitBreaker from "../../../lib/utils/circuitBreaker";
import { sliceCache } from "@/lib/utils/sliceCache";
import { logger } from '@/lib/utils/logger';

import {
  Transaction,
  TransactionsResponse,
  DepositTransactionPayload,
  ManageFavoriteResponse,
  AssetsResponse,
  Asset,
  ExchangeStatistics,
  TransactionSearchParams,
  FavoriteAsset,
  AddFavoritePayload,
  RemoveFavoritePayload,
} from "../types";

/** Skip exchange asset list refetch when Redux already has rows and TTL not expired. */
export const EXCHANGE_ASSETS_CLIENT_TTL_MS = 10 * 60 * 1000;

interface ExchangeState {
  deposits: TransactionsResponse | null;
  withdrawals: TransactionsResponse | null;
  favoriteAssets: FavoriteAsset[] | null;
  statistics: ExchangeStatistics | null;
  assets: AssetsResponse | null;
  /** Last time `assets.assets` was filled from a successful non-empty fetch. */
  assetsFetchedAt: number | null;
  transactions: TransactionsResponse | null;
  loading: boolean;
  error: string | null;
}

type PaginatedResponse<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

type SupportedTokenApiAsset = {
  asset_id?: string;
  ticker?: string;
  symbol?: string;
  name?: string;
  image?: string;
  image_url?: string;
  network?: string;
};

const initialState: ExchangeState = {
  deposits: null,
  withdrawals: null,
  favoriteAssets: null,
  statistics: null,
  assets: null,
  assetsFetchedAt: null,
  transactions: null,
  loading: false,
  error: null,
};

// Helper to normalize numeric values from API (handles string numbers)
const normalizeNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Helper to normalize exchange statistics
const normalizeStatistics = (stats: any): ExchangeStatistics => {
  return {
    total_pending_exchange_deposits: normalizeNumber(stats?.total_pending_exchange_deposits),
    total_pending_exchange_withdrawals: normalizeNumber(stats?.total_pending_exchange_withdrawals),
    total_approved_exchange_deposits: normalizeNumber(stats?.total_approved_exchange_deposits),
    total_approved_exchange_withdrawals: normalizeNumber(stats?.total_approved_exchange_withdrawals),
    total_approved_exchange_combined: stats?.total_approved_exchange_combined !== undefined ? normalizeNumber(stats.total_approved_exchange_combined) : undefined,
    total_approved_exchange_net: stats?.total_approved_exchange_net !== undefined ? normalizeNumber(stats.total_approved_exchange_net) : undefined,
    total_approved_exchange_volume: stats?.total_approved_exchange_volume !== undefined ? normalizeNumber(stats.total_approved_exchange_volume) : undefined,
    total_pending_p2p_deposits: stats?.total_pending_p2p_deposits !== undefined ? normalizeNumber(stats.total_pending_p2p_deposits) : undefined,
    total_pending_p2p_withdrawals: stats?.total_pending_p2p_withdrawals !== undefined ? normalizeNumber(stats.total_pending_p2p_withdrawals) : undefined,
    total_approved_p2p_deposits: stats?.total_approved_p2p_deposits !== undefined ? normalizeNumber(stats.total_approved_p2p_deposits) : undefined,
    total_approved_p2p_withdrawals: stats?.total_approved_p2p_withdrawals !== undefined ? normalizeNumber(stats.total_approved_p2p_withdrawals) : undefined,
    total_approved_p2p_combined: stats?.total_approved_p2p_combined !== undefined ? normalizeNumber(stats.total_approved_p2p_combined) : undefined,
    total_approved_p2p_net: stats?.total_approved_p2p_net !== undefined ? normalizeNumber(stats.total_approved_p2p_net) : undefined,
    total_approved_p2p_volume: stats?.total_approved_p2p_volume !== undefined ? normalizeNumber(stats.total_approved_p2p_volume) : undefined,
    total_approved_all: stats?.total_approved_all !== undefined ? normalizeNumber(stats.total_approved_all) : undefined,
    total_approved_volume: stats?.total_approved_volume !== undefined ? normalizeNumber(stats.total_approved_volume) : undefined,
    total_approved_net: stats?.total_approved_net !== undefined ? normalizeNumber(stats.total_approved_net) : undefined,
    total_buy_orders_by_status: stats?.total_buy_orders_by_status ? {
      pending: normalizeNumber(stats.total_buy_orders_by_status.pending),
      completed: normalizeNumber(stats.total_buy_orders_by_status.completed),
      canceled: normalizeNumber(stats.total_buy_orders_by_status.canceled),
      offline: normalizeNumber(stats.total_buy_orders_by_status.offline),
    } : undefined,
    total_sell_orders_by_status: stats?.total_sell_orders_by_status ? {
      pending: normalizeNumber(stats.total_sell_orders_by_status.pending),
      completed: normalizeNumber(stats.total_sell_orders_by_status.completed),
      canceled: normalizeNumber(stats.total_sell_orders_by_status.canceled),
      offline: normalizeNumber(stats.total_sell_orders_by_status.offline),
    } : undefined,
    total_buy_orders: stats?.total_buy_orders !== undefined ? normalizeNumber(stats.total_buy_orders) : undefined,
    total_sell_orders: stats?.total_sell_orders !== undefined ? normalizeNumber(stats.total_sell_orders) : undefined,
    total_p2p_orders: stats?.total_p2p_orders !== undefined ? normalizeNumber(stats.total_p2p_orders) : undefined,
    total_trades: stats?.total_trades !== undefined ? normalizeNumber(stats.total_trades) : undefined,
    avg_release_time: stats?.avg_release_time,
    avg_payment_time: stats?.avg_payment_time,
    rating: stats?.rating,
    total_volume: stats?.total_volume,
    total_pending_changenow_swaps: stats?.total_pending_changenow_swaps !== undefined ? normalizeNumber(stats.total_pending_changenow_swaps) : undefined,
    total_completed_changenow_swaps: stats?.total_completed_changenow_swaps !== undefined ? normalizeNumber(stats.total_completed_changenow_swaps) : undefined,
    total_failed_changenow_swaps: stats?.total_failed_changenow_swaps !== undefined ? normalizeNumber(stats.total_failed_changenow_swaps) : undefined,
    total_changenow_swaps: stats?.total_changenow_swaps !== undefined ? normalizeNumber(stats.total_changenow_swaps) : undefined,
    created: stats?.created,
  };
};

// Helper to handle API errors
const handleApiError = (error: unknown): string => {
  let errorMessage = "An unexpected error occurred";
  if (error instanceof AxiosError) {
    logger.error('exchange', "DEBUG: API Error details:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    // Handle specific status codes
    if (error.response?.status === 400) {
      const responseData = error.response.data;
      if (responseData && typeof responseData === "object") {
        // Try to extract field-specific errors
        const fieldErrors = Object.entries(responseData)
          .filter(
            ([key, value]) =>
              key !== "message" && key !== "error" && Array.isArray(value)
          )
          .map(
            ([key, value]) =>
              `${key}: ${
                Array.isArray(value) ? value.join(", ") : String(value)
              }`
          )
          .join("; ");

        if (fieldErrors) {
          errorMessage = `Validation errors: ${fieldErrors}`;
        } else {
          errorMessage =
            responseData.message ||
            responseData.error ||
            responseData.details ||
            "Bad request - please check your input";
        }
      } else if (typeof responseData === "string") {
        errorMessage = responseData;
      } else {
        errorMessage = "Bad request - please check your input";
      }
    } else {
      errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.details ||
        "An error occurred";
    }
  }

  // Always remove "Withdrawal failed: " prefix if present
  if (errorMessage.startsWith("Withdrawal failed: ")) {
    return errorMessage.replace("Withdrawal failed: ", "");
  }

  return errorMessage;
};

const toRelativeApiUrl = (url: string): string => {
  if (!/^https?:\/\//i.test(url)) return url;
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
};

const mapSupportedTokenToExchangeAsset = (item: SupportedTokenApiAsset): Asset => {
  const ticker = String(item.ticker || item.symbol || "").trim().toUpperCase();
  const network = String(item.network || "mainnet").trim().toLowerCase();
  const name = String(item.name || ticker || "Unknown Asset").trim();
  const image = String(item.image || item.image_url || "").trim();
  const assetId = String(item.asset_id || "").trim() || `${ticker}-${network}`;

  return {
    asset_id: assetId,
    symbol: ticker,
    ticker,
    network,
    description: name,
    asset_image: image,
    networks: [
      {
        network_id: network,
        network_type: network,
        deposit_fee: "0",
        withdrawal_fee: "0",
        logo: image,
      },
    ],
    range_commissions: [],
    admin_accounts: [],
    name,
  };
};

const normalizeAssetsPayload = (payload: unknown): AssetsResponse => {
  const asAssetsResponse = payload as AssetsResponse;
  if (Array.isArray(asAssetsResponse?.assets)) {
    return {
      total_wallet_balance: String(asAssetsResponse.total_wallet_balance || "0.00"),
      assets: asAssetsResponse.assets,
    };
  }

  const asPaginated = payload as PaginatedResponse<SupportedTokenApiAsset>;
  if (Array.isArray(asPaginated?.results)) {
    return {
      total_wallet_balance: "0.00",
      assets: asPaginated.results.map(mapSupportedTokenToExchangeAsset),
    };
  }

  if (Array.isArray(payload)) {
    return {
      total_wallet_balance: "0.00",
      assets: (payload as SupportedTokenApiAsset[]).map(
        mapSupportedTokenToExchangeAsset
      ),
    };
  }

  return { total_wallet_balance: "0.00", assets: [] };
};

const fetchAllExchangeAssetPages = async (
  endpoint: string
): Promise<AssetsResponse> => {
  // Use a large page_size so this is usually one request.
  const pageSize = 2000;
  let nextUrl: string | null = `${endpoint}?feature=exchange&page=1&page_size=${pageSize}`;
  const results: SupportedTokenApiAsset[] = [];

  while (nextUrl) {
    const response = await cachedGet<
      AssetsResponse | SupportedTokenApiAsset[] | PaginatedResponse<SupportedTokenApiAsset>
    >(toRelativeApiUrl(nextUrl), {
      timeout: 30000,
      ttl: 10 * 60 * 1000,
      cache: true,
    });
    const normalized = normalizeAssetsPayload(response.data);
    if (Array.isArray(normalized.assets) && normalized.assets.length > 0) {
      // If backend already responds in AssetsResponse shape, use it directly.
      const data = response.data as AssetsResponse;
      if (Array.isArray(data?.assets)) {
        return normalized;
      }
      results.push(
        ...normalized.assets.map((asset) => ({
          asset_id: asset.asset_id,
          ticker: asset.symbol,
          symbol: asset.symbol,
          name: asset.name,
          image: asset.asset_image,
          network: asset.networks?.[0]?.network_id,
        }))
      );
    }

    const paginated = response.data as PaginatedResponse<SupportedTokenApiAsset>;
    if (Array.isArray(paginated?.results)) {
      nextUrl = paginated.next || null;
    } else {
      nextUrl = null;
    }
  }

  return {
    total_wallet_balance: "0.00",
    assets: results.map(mapSupportedTokenToExchangeAsset),
  };
};

// Async thunks
let exchangeAssetsInFlight: Promise<AssetsResponse> | null = null;
export const fetchAssets = createAsyncThunk<AssetsResponse, boolean | undefined>(
  "exchange/fetchAssets",
  async (forceRefresh: boolean = false, { rejectWithValue }) => {
    const endpoint = EXCHANGE_ENDPOINTS.ASSETS;

    // Check circuit breaker before making the call
    if (!CircuitBreaker.isCallAllowed(endpoint)) {
      logger.warn('exchange', 
        `Circuit breaker OPEN for ${endpoint} - returning empty assets`
      );
      return { total_wallet_balance: "0.00", assets: [] };
    }

    try {
      let data;
      
      if (forceRefresh) {
        logger.debug('exchange', "🔄 Force refresh - bypassing cache for exchange assets...");
        // Clear cache first
        await sliceCache.delete('exchange', 'fetchAssets');
        // Fetch fresh data
        const response = await fetchAllExchangeAssetPages(endpoint);
        logger.debug('exchange', "✅ Force refresh API response received:", response?.assets?.length || 0, "assets");
        // Cache the fresh data
        await sliceCache.set('exchange', 'fetchAssets', response, undefined, 10 * 60 * 1000);
        data = response;
      } else {
        // Dedupe concurrent callers (multiple components dispatching before first resolves).
        if (exchangeAssetsInFlight) {
          return await exchangeAssetsInFlight;
        }

        // Use cached data if available; only refetch after 1 hour to avoid refetching at all cost
        exchangeAssetsInFlight = sliceCache
          .getOrSet(
            'exchange',
            'fetchAssets',
            async () => {
              logger.debug('exchange', "🔄 Cache miss - fetching exchange assets from API...");
              const response = await fetchAllExchangeAssetPages(endpoint);
              logger.debug('exchange', "✅ API response received:", response?.assets?.length || 0, "assets");
              return response;
            },
            undefined, // no params
            10 * 60 * 1000 // 10 minute cache – refetch only after TTL
          )
          .finally(() => {
            exchangeAssetsInFlight = null;
          });
        data = await exchangeAssetsInFlight;
      }

      CircuitBreaker.onSuccess(endpoint);
      return data;
    } catch (error: any) {
      exchangeAssetsInFlight = null;
      CircuitBreaker.onFailure(endpoint, error);

      // Suppress console warnings for 401s
      if (error.response?.status !== 401) {
       
      }

      // Return empty assets instead of throwing
      return { total_wallet_balance: "0.00", assets: [] };
    }
  },
  {
    condition: (forceRefresh, { getState }) => {
      if (forceRefresh) return true;
      if (exchangeAssetsInFlight) return false;
      const state = getState() as { exchange: ExchangeState };
      const rows = state.exchange.assets?.assets;
      const n = Array.isArray(rows) ? rows.length : 0;
      const at = state.exchange.assetsFetchedAt;
      if (
        n > 0 &&
        typeof at === "number" &&
        Date.now() - at < EXCHANGE_ASSETS_CLIENT_TTL_MS
      ) {
        return false;
      }
      return true;
    },
  }
);

export const getDeposits = createAsyncThunk<TransactionsResponse, void>(
  "exchange/getDeposits",
  async (_, { rejectWithValue }) => {
    try {
      const response = await post<TransactionsResponse>(
        EXCHANGE_ENDPOINTS.DEPOSITS
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const createDeposit = createAsyncThunk<
  Transaction,
  {
    payload: FormData | Record<string, any>;
    config?: AxiosRequestConfig;
  }
>(
  "exchange/createDeposit",
  async ({ payload, config }, { rejectWithValue }) => {
    try {
      const response = await post<Transaction>(
        EXCHANGE_ENDPOINTS.DEPOSITS,
        payload,
        config
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const getWithdrawals = createAsyncThunk<TransactionsResponse, void>(
  "exchange/getWithdrawals",
  async (_, { rejectWithValue }) => {
    try {
      const response = await get<TransactionsResponse>(
        EXCHANGE_ENDPOINTS.WITHDRAWALS
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const createWithdrawal = createAsyncThunk<
  Transaction,
  { payload: FormData; config?: AxiosRequestConfig }
>(
  "exchange/createWithdrawal",
  async ({ payload, config }, { rejectWithValue }) => {
    try {
      const response = await post<Transaction>(
        EXCHANGE_ENDPOINTS.WITHDRAWALS,
        payload,
        config
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateDepositAddress = createAsyncThunk<
  { message: string; exchange_transaction_id: string; status: string },
  { transactionId: string; depositAddress: string }
>(
  "exchange/updateDepositAddress",
  async ({ transactionId, depositAddress }, { rejectWithValue }) => {
    try {
      // Debug logging
      const endpoint = EXCHANGE_ENDPOINTS.UPDATE_DEPOSIT_ADDRESS;
      logger.debug('exchange', "DEBUG: Update deposit address endpoint:", endpoint);
      logger.debug('exchange', "DEBUG: Transaction ID:", transactionId);
      logger.debug('exchange', "DEBUG: Deposit address:", depositAddress);
      
      // Use the exact payload format you specified
      const payload = {
        exchange_transaction_id: transactionId,
        deposit_address: depositAddress
      };
      
      logger.debug('exchange', "DEBUG: Payload being sent:", payload);
      
      const response = await post<{ message: string; exchange_transaction_id: string; status: string }>(
        endpoint,
        payload
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const getFavoriteAssets = createAsyncThunk<FavoriteAsset[], void>(
  "exchange/getFavoriteAssets",
  async (_, { rejectWithValue }) => {
    try {
      const response = await get<FavoriteAsset[]>(EXCHANGE_ENDPOINTS.FAVORITES);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const addFavoriteAsset = createAsyncThunk<
  ManageFavoriteResponse,
  AddFavoritePayload
>("exchange/addFavoriteAsset", async (payload, { rejectWithValue }) => {
  try {
    const response = await post<ManageFavoriteResponse>(
      EXCHANGE_ENDPOINTS.ADDFAVORITE,
      payload
    );
    return response.data;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const removeFavoriteAsset = createAsyncThunk<
  ManageFavoriteResponse,
  RemoveFavoritePayload
>("exchange/removeFavoriteAsset", async (payload, { rejectWithValue }) => {
  try {
    const response = await del<ManageFavoriteResponse>(
      EXCHANGE_ENDPOINTS.REMOVEFAVORITE,
      { data: payload }
    );
    return response.data;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const fetchExchangeStatistics = createAsyncThunk<
  ExchangeStatistics,
  void
>("exchange/fetchStatistics", async (_, { rejectWithValue }) => {
  const endpoint = EXCHANGE_ENDPOINTS.STATISTICS;

  // Check circuit breaker before making the call
  if (!CircuitBreaker.isCallAllowed(endpoint)) {
   
    return {
      total_pending_exchange_deposits: 0,
      total_pending_exchange_withdrawals: 0,
      total_approved_exchange_deposits: 0,
      total_approved_exchange_withdrawals: 0,
      total_approved_exchange_combined: 0,
    };
  }

  try {
    const response = await get<ExchangeStatistics>(endpoint, {
      timeout: 10000,
    });

    CircuitBreaker.onSuccess(endpoint);
    // Normalize the response to ensure all numbers are actually numbers
    return normalizeStatistics(response.data);
  } catch (error: any) {
    CircuitBreaker.onFailure(endpoint, error);

   
    // Return empty statistics instead of throwing
    return {
      total_pending_exchange_deposits: 0,
      total_pending_exchange_withdrawals: 0,
      total_approved_exchange_deposits: 0,
      total_approved_exchange_withdrawals: 0,
      total_approved_exchange_combined: 0,
    };
  }
});

export const fetchTransactions = createAsyncThunk<TransactionsResponse, void>(
  "exchange/fetchTransactions",
  async (_, { rejectWithValue }) => {
    const endpoint = EXCHANGE_ENDPOINTS.TRANSACTIONS;

    // Check circuit breaker before making the call
    if (!CircuitBreaker.isCallAllowed(endpoint)) {
     
      return []; // Return empty array for TransactionsResponse
    }

    try {
      const response = await get<TransactionsResponse>(endpoint, {
        timeout: 10000, // 10 second timeout
      });

      // Record success with circuit breaker
      CircuitBreaker.onSuccess(endpoint);
      return response.data;
    } catch (error: any) {
      // Record failure with circuit breaker
      CircuitBreaker.onFailure(endpoint, error);

     
      // Return empty array instead of throwing to prevent infinite retries
      return [];
    }
  }
);

export const searchTransactions = createAsyncThunk<
  TransactionsResponse,
  TransactionSearchParams
>("exchange/searchTransactions", async (params, { rejectWithValue }) => {
  try {
    const response = await get<TransactionsResponse>(
      EXCHANGE_ENDPOINTS.TRANSACTIONSEARCH(params)
    );
    return response.data;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

const exchangeSlice = createSlice({
  name: "exchange",
  initialState,
  reducers: {
    clearExchangeError(state) {
      state.error = null;
    },
    resetExchangeState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Fetch Assets
    builder.addCase(fetchAssets.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchAssets.fulfilled,
      (state, action: PayloadAction<AssetsResponse>) => {
        state.loading = false;
        state.assets = action.payload;
        const n = Array.isArray(action.payload?.assets)
          ? action.payload.assets.length
          : 0;
        if (n > 0) {
          state.assetsFetchedAt = Date.now();
        }
      }
    );
    builder.addCase(fetchAssets.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    // Get Deposits
    builder.addCase(getDeposits.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      getDeposits.fulfilled,
      (state, action: PayloadAction<TransactionsResponse>) => {
        state.loading = false;
        state.deposits = action.payload;
      }
    );
    builder.addCase(getDeposits.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create Deposit
    builder.addCase(createDeposit.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      createDeposit.fulfilled,
      (state, action: PayloadAction<Transaction>) => {
        state.loading = false;
        if (!state.deposits) {
          state.deposits = [];
        }
        state.deposits = [action.payload, ...state.deposits];
      }
    );
    builder.addCase(createDeposit.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Get Withdrawals
    builder.addCase(getWithdrawals.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      getWithdrawals.fulfilled,
      (state, action: PayloadAction<TransactionsResponse>) => {
        state.loading = false;
        state.withdrawals = action.payload;
      }
    );
    builder.addCase(getWithdrawals.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create Withdrawal
    builder.addCase(createWithdrawal.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      createWithdrawal.fulfilled,
      (state, action: PayloadAction<Transaction>) => {
        state.loading = false;
        if (!state.withdrawals) {
          state.withdrawals = [];
        }
        state.withdrawals = [action.payload, ...state.withdrawals];
      }
    );
    builder.addCase(createWithdrawal.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update Deposit Address
    builder.addCase(updateDepositAddress.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      updateDepositAddress.fulfilled,
      (state, action: PayloadAction<{ message: string; exchange_transaction_id: string; status: string }>) => {
        state.loading = false;
        // Update the deposit in the deposits array if it exists
        if (state.deposits && Array.isArray(state.deposits)) {
          const index = state.deposits.findIndex(
            (deposit) => deposit.transaction_id === action.payload.exchange_transaction_id
          );
          if (index !== -1) {
            state.deposits[index] = { ...state.deposits[index], status: action.payload.status };
          }
        }
      }
    );
    builder.addCase(updateDepositAddress.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Get Favorite Assets
    builder.addCase(getFavoriteAssets.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      getFavoriteAssets.fulfilled,
      (state, action: PayloadAction<FavoriteAsset[]>) => {
        state.loading = false;
        state.favoriteAssets = action.payload;
      }
    );
    builder.addCase(getFavoriteAssets.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Add Favorite Asset
    builder.addCase(addFavoriteAsset.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addFavoriteAsset.fulfilled, (state) => {
      state.loading = false;
      // You might want to trigger a refetch of favorites here
    });
    builder.addCase(addFavoriteAsset.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Remove Favorite Asset
    builder.addCase(removeFavoriteAsset.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(removeFavoriteAsset.fulfilled, (state) => {
      state.loading = false;
      // You might want to trigger a refetch of favorites here
    });
    builder.addCase(removeFavoriteAsset.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Exchange Stats
    builder.addCase(fetchExchangeStatistics.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchExchangeStatistics.fulfilled,
      (state, action: PayloadAction<ExchangeStatistics>) => {
        state.loading = false;
        // Ensure statistics are normalized (already done in thunk, but double-check)
        state.statistics = normalizeStatistics(action.payload);
      }
    );
    builder.addCase(fetchExchangeStatistics.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Transactions
    builder.addCase(fetchTransactions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchTransactions.fulfilled,
      (state, action: PayloadAction<TransactionsResponse>) => {
        state.loading = false;
        state.transactions = action.payload;
      }
    );
    builder.addCase(fetchTransactions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Search Transactions
    builder.addCase(searchTransactions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      searchTransactions.fulfilled,
      (state, action: PayloadAction<TransactionsResponse>) => {
        state.loading = false;
        state.transactions = action.payload;
      }
    );
    builder.addCase(searchTransactions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearExchangeError, resetExchangeState } = exchangeSlice.actions;
export default exchangeSlice.reducer;
