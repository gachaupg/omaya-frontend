/**
 * moneyXSlice.ts – MoneyX transactions state management
 */
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { API_CONFIG } from "@/lib/appConfig";
import { API_BASE_URL } from "@/config/api";
import { post, patch, get, AxiosError } from "@/lib/apiClient";
import axios from "axios";
import { logger } from '@/lib/utils/logger';

import {
  CreateMoneyXTransactionPayload,
  UpdateMoneyXTransactionPayload,
  MoneyXTransaction,
  MoneyXState,
} from "../types";

interface ExtendedMoneyXState extends MoneyXState {
  transactions: MoneyXTransaction[] | null;
}

const initialState: ExtendedMoneyXState = {
  transaction: null,
  transactions: null,
  loading: false,
  error: null,
};

// Helper to handle API errors
const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (data && typeof data === "object") {
      const messages: string[] = [];
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          messages.push(...value);
        } else if (typeof value === "string") {
          messages.push(value);
        }
      });
      if (messages.length > 0) {
        return messages.join("\n");
      }
    }
    return (
      data?.message ||
      data?.error ||
      data?.details ||
      data?.non_field_errors ||
      error.message ||
      "An error occurred"
    );
  }
  return "An unexpected error occurred";
};

// Range commission API response (no auth required)
export interface RangeCommissionResult {
  commission: string;
  is_percentage: boolean;
  range_min: string;
  range_max: string;
}

export interface RangeCommissionResponse {
  count: number;
  results: RangeCommissionResult[];
}

export type MoneyXCommissionType = "deposit" | "withdrawal";

export const fetchMoneyXCommission = createAsyncThunk<
  { commission: number; isPercentage: boolean },
  { amount: number; commissionType?: MoneyXCommissionType }
>(
  "moneyX/fetchCommission",
  async ({ amount, commissionType = "deposit" }, { rejectWithValue }) => {
    try {
      const url = `${API_BASE_URL}${API_CONFIG.MONEYX.RANGE_COMMISSION(amount, commissionType)}`;
      const response = await axios.get<RangeCommissionResponse>(url);
      const result = response.data?.results?.[0];
      if (result) {
        return {
          commission: parseFloat(result.commission) || 0,
          isPercentage: result.is_percentage ?? true,
        };
      }
      return { commission: 0, isPercentage: true };
    } catch (error) {
      logger.error('moneyX', "Failed to fetch range commission:", error);
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Async thunks
export const fetchMoneyXTransactions = createAsyncThunk<
  MoneyXTransaction[],
  void
>(
  "moneyX/fetchTransactions",
  async (_, { rejectWithValue }) => {
    try {
      logger.debug('moneyX', "Fetching MoneyX transactions");
      const response = await get<MoneyXTransaction[] | { results: MoneyXTransaction[] }>(
        API_CONFIG.MONEYX.TRANSACTIONS
      );
      logger.debug('moneyX', "MoneyX transactions fetched:", response.data);
      // Handle both array response and paginated response
      const transactions = Array.isArray(response.data) 
        ? response.data 
        : response.data?.results || [];
      return transactions;
    } catch (error) {
      logger.error('moneyX', "Failed to fetch MoneyX transactions:", error);
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const createMoneyXTransaction = createAsyncThunk<
  MoneyXTransaction,
  CreateMoneyXTransactionPayload
>(
  "moneyX/createTransaction",
  async (payload, { rejectWithValue }) => {
    try {
      logger.debug('moneyX', "Creating MoneyX transaction:", payload);
      const response = await post<MoneyXTransaction>(
        API_CONFIG.MONEYX.TRANSACTIONS,
        payload
      );
      logger.debug('moneyX', "MoneyX transaction created:", response.data);
      return response.data;
    } catch (error) {
      logger.error('moneyX', "Failed to create MoneyX transaction:", error);
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateMoneyXTransaction = createAsyncThunk<
  MoneyXTransaction,
  { transactionId: string; payload: UpdateMoneyXTransactionPayload }
>(
  "moneyX/updateTransaction",
  async ({ transactionId, payload }, { rejectWithValue }) => {
    try {
      logger.debug('moneyX', "Updating MoneyX transaction:", { transactionId, payload });
      const response = await patch<MoneyXTransaction>(
        API_CONFIG.MONEYX.UPDATE_TRANSACTION(transactionId),
        payload
      );
      logger.debug('moneyX', "MoneyX transaction updated:", response.data);
      return response.data;
    } catch (error) {
      logger.error('moneyX', "Failed to update MoneyX transaction:", error);
      return rejectWithValue(handleApiError(error));
    }
  }
);

const moneyXSlice = createSlice({
  name: "moneyX",
  initialState,
  reducers: {
    clearMoneyXError(state) {
      state.error = null;
    },
    resetMoneyXState() {
      return initialState;
    },
    setTransaction(state, action: PayloadAction<MoneyXTransaction | null>) {
      state.transaction = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Transactions
    builder.addCase(fetchMoneyXTransactions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchMoneyXTransactions.fulfilled,
      (state, action: PayloadAction<MoneyXTransaction[]>) => {
        state.loading = false;
        state.transactions = action.payload;
      }
    );
    builder.addCase(fetchMoneyXTransactions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create Transaction
    builder.addCase(createMoneyXTransaction.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      createMoneyXTransaction.fulfilled,
      (state, action: PayloadAction<MoneyXTransaction>) => {
        state.loading = false;
        state.transaction = action.payload;
      }
    );
    builder.addCase(createMoneyXTransaction.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update Transaction
    builder.addCase(updateMoneyXTransaction.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      updateMoneyXTransaction.fulfilled,
      (state, action: PayloadAction<MoneyXTransaction>) => {
        state.loading = false;
        state.transaction = action.payload;
      }
    );
    builder.addCase(updateMoneyXTransaction.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const {
  clearMoneyXError,
  resetMoneyXState,
  setTransaction,
} = moneyXSlice.actions;

export default moneyXSlice.reducer;






