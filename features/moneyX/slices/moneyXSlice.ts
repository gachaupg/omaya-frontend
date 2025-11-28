/**
 * moneyXSlice.ts – MoneyX transactions state management
 */
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { API_CONFIG } from "@/lib/appConfig";
import { post, patch, AxiosError } from "@/lib/apiClient";
import { logger } from '@/lib/utils/logger';

import {
  CreateMoneyXTransactionPayload,
  UpdateMoneyXTransactionPayload,
  MoneyXTransaction,
  MoneyXState,
} from "../types";

const initialState: MoneyXState = {
  transaction: null,
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

// Async thunks
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



