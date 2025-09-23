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
import { sliceCache } from "../../../lib/utils/sliceCache";
import {
  Transaction,
  TransactionsResponse,
  DepositTransactionPayload,
  ManageFavoritePayload,
  ManageFavoriteResponse,
  AssetsResponse,
  Asset,
  ExchangeStatistics,
  TransactionSearchParams,
  FavoriteAsset,
} from "../types";

interface ExchangeState {
  deposits: TransactionsResponse | null;
  withdrawals: TransactionsResponse | null;
  favoriteAssets: FavoriteAsset[] | null;
  statistics: ExchangeStatistics | null;
  assets: AssetsResponse | null;
  transactions: TransactionsResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: ExchangeState = {
  deposits: null,
  withdrawals: null,
  favoriteAssets: null,
  statistics: null,
  assets: null,
  transactions: null,
  loading: false,
  error: null,
};

// Helper to handle API errors
const handleApiError = (error: unknown): string => {
  let errorMessage = "An unexpected error occurred";
  if (error instanceof AxiosError) {
    console.error("DEBUG: API Error details:", {
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

// Async thunks
export const fetchAssets = createAsyncThunk<AssetsResponse, boolean | undefined>(
  "exchange/fetchAssets",
  async (forceRefresh: boolean = false, { rejectWithValue }) => {
    const endpoint = EXCHANGE_ENDPOINTS.ASSETS;

    // Check circuit breaker before making the call
    if (!CircuitBreaker.isCallAllowed(endpoint)) {
      console.warn(
        `Circuit breaker OPEN for ${endpoint} - returning empty assets`
      );
      return { total_wallet_balance: "0.00", assets: [] };
    }

    try {
      let data;
      
      if (forceRefresh) {
        console.log("🔄 Force refresh - bypassing cache for exchange assets...");
        // Clear cache first
        await sliceCache.delete('exchange', 'fetchAssets');
        // Fetch fresh data
        const response = await cachedGet<AssetsResponse>(endpoint, {
          timeout: 30000,
          ttl: 2 * 60 * 60 * 1000, // 2 hours cache for assets
          cache: true
        });
        console.log("✅ Force refresh API response received:", response?.data?.assets?.length || 0, "assets");
        // Cache the fresh data
        await sliceCache.set('exchange', 'fetchAssets', response.data, undefined, 2 * 60 * 60 * 1000);
        data = response.data;
      } else {
        // Use cached data if available, otherwise fetch fresh
        data = await sliceCache.getOrSet(
          'exchange',
          'fetchAssets',
          async () => {
            console.log("🔄 Cache miss - fetching exchange assets from API...");
            const response = await cachedGet<AssetsResponse>(endpoint, {
              timeout: 30000,
              ttl: 2 * 60 * 60 * 1000, // 2 hours cache for assets
              cache: true
            });
            console.log("✅ API response received:", response?.data?.assets?.length || 0, "assets");
            return response.data;
          },
          undefined, // no params
          2 * 60 * 60 * 1000 // 2 hours cache
        );
      }

      CircuitBreaker.onSuccess(endpoint);
      console.log("✅ Fetched Assets:", data?.assets?.length || 0, "assets");
      return data;
    } catch (error: any) {
      CircuitBreaker.onFailure(endpoint, error);

      console.warn(`Exchange assets API failed:`, {
        endpoint,
        error: error.message,
        status: error.response?.status,
      });

      // Return empty assets instead of throwing
      return { total_wallet_balance: "0.00", assets: [] };
    }
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
    payload: FormData;
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
      console.log("DEBUG: Update deposit address endpoint:", endpoint);
      console.log("DEBUG: Transaction ID:", transactionId);
      console.log("DEBUG: Deposit address:", depositAddress);
      
      // Use the exact payload format you specified
      const payload = {
        exchange_transaction_id: transactionId,
        deposit_address: depositAddress
      };
      
      console.log("DEBUG: Payload being sent:", payload);
      
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
  ManageFavoritePayload
>("exchange/addFavoriteAsset", async (payload, { rejectWithValue }) => {
  try {
    const response = await post<ManageFavoriteResponse>(
      EXCHANGE_ENDPOINTS.FAVORITES,
      payload
    );
    return response.data;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const removeFavoriteAsset = createAsyncThunk<
  ManageFavoriteResponse,
  ManageFavoritePayload
>("exchange/removeFavoriteAsset", async (payload, { rejectWithValue }) => {
  try {
    const response = await del<ManageFavoriteResponse>(
      EXCHANGE_ENDPOINTS.FAVORITES,
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
    console.warn(
      `Circuit breaker OPEN for ${endpoint} - returning empty statistics`
    );
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
    return response.data;
  } catch (error: any) {
    CircuitBreaker.onFailure(endpoint, error);

    console.warn(`Exchange statistics API failed:`, {
      endpoint,
      error: error.message,
      status: error.response?.status,
    });

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
      console.warn(
        `Circuit breaker OPEN for ${endpoint} - returning empty transactions`
      );
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

      console.warn(`Exchange transactions API failed:`, {
        endpoint,
        error: error.message,
        status: error.response?.status,
        code: error.code,
      });

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
        state.statistics = action.payload;
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
