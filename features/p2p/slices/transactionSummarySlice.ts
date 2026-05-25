import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "@/store/rootReducer";
import { get } from "@/lib/apiClient";
import { handleP2PError } from "@/lib/utils/errorHandler";
import { API_CONFIG } from "@/lib/appConfig";
import { TransactionSummary, TransactionSummaryState } from "../types";
import { normalizeTransactionSummary } from "@/lib/utils/normalizeTransactionSummary";

const initialState: TransactionSummaryState = {
  summary: null,
  loading: false,
  error: null,
};

export const fetchTransactionSummary = createAsyncThunk<
  TransactionSummary,
  void,
  { rejectValue: string }
>("transactionSummary/fetchSummary", async (_, { rejectWithValue }) => {
  try {
    const response = await get<TransactionSummary>(
      API_CONFIG.P2P.TRANSACTION_SUMMARY
    );
    return normalizeTransactionSummary(response.data);
  } catch (error) {
    try {
      handleP2PError(error);
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
    return rejectWithValue("An unexpected error occurred");
  }
});

const transactionSummarySlice = createSlice({
  name: "transactionSummary",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetSummary: (state) => {
      state.summary = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactionSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchTransactionSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, resetSummary } = transactionSummarySlice.actions;

// Selectors
export const selectTransactionSummary = (state: RootState) =>
  state.transactionSummary.summary;
export const selectTransactionSummaryLoading = (state: RootState) =>
  state.transactionSummary.loading;
export const selectTransactionSummaryError = (state: RootState) =>
  state.transactionSummary.error;

export default transactionSummarySlice.reducer;
