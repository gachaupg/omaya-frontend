/**
 * exchangeSlice.ts – auto‑generated placeholder
 */
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { post, get, del, AxiosError, AxiosRequestConfig } from '../../../lib/apiClient';
import { EXCHANGE_ENDPOINTS } from '../api';
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
} from '../types';

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
    let errorMessage = 'An unexpected error occurred';
    if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message || error.response?.data?.error || error.response?.data?.details || 'An error occurred';
    }

    // Always remove "Withdrawal failed: " prefix if present
    if (errorMessage.startsWith('Withdrawal failed: ')) {
        return errorMessage.replace('Withdrawal failed: ', '');
    }

    return errorMessage;
};

// Async thunks
export const fetchAssets = createAsyncThunk<AssetsResponse, void>(
    'exchange/fetchAssets',
    async (_, { rejectWithValue }) => {
        try {
            const response = await get<AssetsResponse>(EXCHANGE_ENDPOINTS.ASSETS);
            return response.data;
        } catch (error) {
            return rejectWithValue(handleApiError(error));
        }
    }
);

export const getDeposits = createAsyncThunk<TransactionsResponse, void>(
    'exchange/getDeposits',
    async (_, { rejectWithValue }) => {
        try {
            const response = await post<TransactionsResponse>(EXCHANGE_ENDPOINTS.DEPOSITS);
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
    'exchange/createDeposit',
    async ({ payload, config }, { rejectWithValue }) => {
        try {
            const response = await post<Transaction>(EXCHANGE_ENDPOINTS.DEPOSITS, payload, config);
            return response.data;
        } catch (error) {
            return rejectWithValue(handleApiError(error));
        }
    }
);

export const getWithdrawals = createAsyncThunk<TransactionsResponse, void>(
    'exchange/getWithdrawals',
    async (_, { rejectWithValue }) => {
        try {
            const response = await get<TransactionsResponse>(EXCHANGE_ENDPOINTS.WITHDRAWALS);
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
    'exchange/createWithdrawal',
    async ({ payload, config }, { rejectWithValue }) => {
        try {
            const response = await post<Transaction>(EXCHANGE_ENDPOINTS.WITHDRAWALS, payload, config);
            return response.data;
        } catch (error) {
            return rejectWithValue(handleApiError(error));
        }
    }
);

export const getFavoriteAssets = createAsyncThunk<FavoriteAsset[], void>(
    'exchange/getFavoriteAssets',
    async (_, { rejectWithValue }) => {
        try {
            const response = await get<FavoriteAsset[]>(EXCHANGE_ENDPOINTS.FAVORITES);
            return response.data;
        } catch (error) {
            return rejectWithValue(handleApiError(error));
        }
    }
);

export const addFavoriteAsset = createAsyncThunk<ManageFavoriteResponse, ManageFavoritePayload>(
    'exchange/addFavoriteAsset',
    async (payload, { rejectWithValue }) => {
        try {
            const response = await post<ManageFavoriteResponse>(EXCHANGE_ENDPOINTS.FAVORITES, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(handleApiError(error));
        }
    }
);

export const removeFavoriteAsset = createAsyncThunk<ManageFavoriteResponse, ManageFavoritePayload>(
    'exchange/removeFavoriteAsset',
    async (payload, { rejectWithValue }) => {
        try {
            const response = await del<ManageFavoriteResponse>(EXCHANGE_ENDPOINTS.FAVORITES, { data: payload });
            return response.data;
        } catch (error) {
            return rejectWithValue(handleApiError(error));
        }
    }
);

export const fetchExchangeStatistics = createAsyncThunk<ExchangeStatistics, void>(
    'exchange/fetchStatistics',
    async (_, { rejectWithValue }) => {
        try {
            const response = await get<ExchangeStatistics>(EXCHANGE_ENDPOINTS.STATISTICS);
            return response.data;
        } catch (error) {
            return rejectWithValue(handleApiError(error));
        }
    }
);

export const fetchTransactions = createAsyncThunk<TransactionsResponse, void>(
    'exchange/fetchTransactions',
    async (_, { rejectWithValue }) => {
        try {
            const response = await get<TransactionsResponse>(EXCHANGE_ENDPOINTS.TRANSACTIONS);
            return response.data;
        } catch (error) {
            console.error('Error fetching transactions:', error);
            return rejectWithValue(handleApiError(error));
        }
    }
);

export const searchTransactions = createAsyncThunk<TransactionsResponse, TransactionSearchParams>(
    'exchange/searchTransactions',
    async (params, { rejectWithValue }) => {
        try {
            const response = await get<TransactionsResponse>(EXCHANGE_ENDPOINTS.TRANSACTIONSEARCH(params));
            return response.data;
        } catch (error) {
            return rejectWithValue(handleApiError(error));
        }
    }
);

const exchangeSlice = createSlice({
    name: 'exchange',
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
        builder.addCase(fetchAssets.fulfilled, (state, action: PayloadAction<AssetsResponse>) => {
            state.loading = false;
            state.assets = action.payload;
        });
        builder.addCase(fetchAssets.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
        // Get Deposits
        builder.addCase(getDeposits.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(getDeposits.fulfilled, (state, action: PayloadAction<TransactionsResponse>) => {
            state.loading = false;
            state.deposits = action.payload;
        });
        builder.addCase(getDeposits.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Create Deposit
        builder.addCase(createDeposit.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(createDeposit.fulfilled, (state, action: PayloadAction<Transaction>) => {
            state.loading = false;
            if (!state.deposits) {
                state.deposits = [];
            }
            state.deposits = [action.payload, ...state.deposits];
        });
        builder.addCase(createDeposit.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Get Withdrawals
        builder.addCase(getWithdrawals.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(getWithdrawals.fulfilled, (state, action: PayloadAction<TransactionsResponse>) => {
            state.loading = false;
            state.withdrawals = action.payload;
        });
        builder.addCase(getWithdrawals.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Create Withdrawal
        builder.addCase(createWithdrawal.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(createWithdrawal.fulfilled, (state, action: PayloadAction<Transaction>) => {
            state.loading = false;
            if (!state.withdrawals) {
                state.withdrawals = [];
            }
            state.withdrawals = [action.payload, ...state.withdrawals];
        });
        builder.addCase(createWithdrawal.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Get Favorite Assets
        builder.addCase(getFavoriteAssets.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(getFavoriteAssets.fulfilled, (state, action: PayloadAction<FavoriteAsset[]>) => {
            state.loading = false;
            state.favoriteAssets = action.payload;
        });
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
        builder.addCase(fetchExchangeStatistics.fulfilled, (state, action: PayloadAction<ExchangeStatistics>) => {
            state.loading = false;
            state.statistics = action.payload;
        });
        builder.addCase(fetchExchangeStatistics.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Fetch Transactions
        builder.addCase(fetchTransactions.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchTransactions.fulfilled, (state, action: PayloadAction<TransactionsResponse>) => {
            state.loading = false;
            state.transactions = action.payload;
        });
        builder.addCase(fetchTransactions.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Search Transactions
        builder.addCase(searchTransactions.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(searchTransactions.fulfilled, (state, action: PayloadAction<TransactionsResponse>) => {
            state.loading = false;
            state.transactions = action.payload;
        });
        builder.addCase(searchTransactions.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
    },
});

export const { clearExchangeError, resetExchangeState } = exchangeSlice.actions;
export default exchangeSlice.reducer;