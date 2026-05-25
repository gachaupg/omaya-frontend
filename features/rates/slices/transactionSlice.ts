import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { TransactionState, Transaction } from "../types";
import { transactionApi } from "../api";
import { normalizeSystemTransaction } from "../utils/transactionUtils";

const initialState: TransactionState = {
  transactions: [],
  loading: false,
  error: null,
  count: 0,
  next: null,
  previous: null,
};

export const fetchTransactions = createAsyncThunk(
  "transaction/fetchTransactions",
  async (page: number | undefined, { rejectWithValue }) => {
    try {
      const response = await transactionApi.fetchTransactions(page || 1);
      const results = Array.isArray(response.results)
        ? response.results.map((r) =>
            normalizeSystemTransaction(r as unknown as Record<string, unknown>)
          )
        : [];
      return {
        ...response,
        results,
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch transactions"
      );
    }
  }
);

const transactionSlice = createSlice({
  name: "transaction",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    prependTransaction: (state, action: PayloadAction<Transaction>) => {
      const exists = state.transactions.some(
        (t) => t.transaction_id === action.payload.transaction_id
      );
      if (!exists) {
        state.transactions.unshift(action.payload);
        state.transactions.splice(100, state.transactions.length); // Keep last 100
      }
    },
    setTransactionsFromWebSocket: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchTransactions.fulfilled,
        (state, action) => {
          state.loading = false;
          state.transactions = action.payload.results;
          state.count = action.payload.count;
          state.next = action.payload.next;
          state.previous = action.payload.previous;
        }
      )
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, prependTransaction, setTransactionsFromWebSocket } =
  transactionSlice.actions;
export default transactionSlice.reducer;
