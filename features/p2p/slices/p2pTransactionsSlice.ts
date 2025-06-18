import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllP2PTransactions } from "../api";
import { P2PTransactionResponse } from "../types";

interface P2PTransactionsState {
  transactions: P2PTransactionResponse | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
}

const initialState: P2PTransactionsState = {
  transactions: null,
  loading: false,
  error: null,
  currentPage: 1,
};

export const fetchP2PTransactions = createAsyncThunk(
  "p2pTransactions/fetchP2PTransactions",
  async (page: number = 1) => {
    const response = await getAllP2PTransactions(page);
    return response;
  }
);

const p2pTransactionsSlice = createSlice({
  name: "p2pTransactions",
  initialState,
  reducers: {
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchP2PTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchP2PTransactions.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload)) {
          state.transactions = {
            count: action.payload.length,
            next: null,
            previous: null,
            results: action.payload,
          };
        } else {
          state.transactions = action.payload;
        }
      })
      .addCase(fetchP2PTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to fetch P2P transactions";
      });
  },
});

export const { setCurrentPage } = p2pTransactionsSlice.actions;
export default p2pTransactionsSlice.reducer;
