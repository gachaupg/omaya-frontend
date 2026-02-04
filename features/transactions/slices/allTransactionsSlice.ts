import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllUserTransactions } from "../api";
import type { AllTransactionsResponse } from "../api";

interface AllTransactionsState {
  data: AllTransactionsResponse | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
}

const initialState: AllTransactionsState = {
  data: null,
  loading: false,
  error: null,
  currentPage: 1,
};

export const fetchAllUserTransactions = createAsyncThunk(
  "allTransactions/fetchAllUserTransactions",
  async (
    params?: { type?: string; page?: number; page_size?: number }
  ) => {
    return getAllUserTransactions(params);
  }
);

const allTransactionsSlice = createSlice({
  name: "allTransactions",
  initialState,
  reducers: {
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllUserTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUserTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.currentPage = action.payload.current_page;
      })
      .addCase(fetchAllUserTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to fetch all transactions";
      });
  },
});

export const { setCurrentPage } = allTransactionsSlice.actions;
export default allTransactionsSlice.reducer;
