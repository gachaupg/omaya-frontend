import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllP2PTransactions } from "../api";
import { P2PTransactionResponse } from "../types";

interface P2PTransactionsState {
  transactions: P2PTransactionResponse | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  allTransactions: any[]; // Store all loaded transactions
  hasLoadedAll: boolean; // Track if all pages have been loaded
}

const initialState: P2PTransactionsState = {
  transactions: null,
  loading: false,
  error: null,
  currentPage: 1,
  allTransactions: [],
  hasLoadedAll: false,
};

export const fetchP2PTransactions = createAsyncThunk(
  "p2pTransactions/fetchP2PTransactions",
  async (page: number = 1) => {
    const response = await getAllP2PTransactions(page);
    return response;
  }
);

export const loadAllP2PTransactions = createAsyncThunk(
  "p2pTransactions/loadAllP2PTransactions",
  async (_, { getState }) => {
    const state = getState() as { p2pTransactions: P2PTransactionsState };
    const { allTransactions, hasLoadedAll } = state.p2pTransactions;
    
    if (hasLoadedAll) {
      return { transactions: allTransactions, count: allTransactions.length };
    }

    const allTxns = [...allTransactions];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await getAllP2PTransactions(page);
      allTxns.push(...response.results);
      
      if (!response.next) {
        hasMore = false;
      } else {
        page++;
      }
    }

    return { transactions: allTxns, count: allTxns.length };
  }
);

const p2pTransactionsSlice = createSlice({
  name: "p2pTransactions",
  initialState,
  reducers: {
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    toggleViewAll: (state) => {
      // Toggle between paginated and all transactions view
      if (state.allTransactions.length > 0) {
        state.transactions = {
          count: state.allTransactions.length,
          next: null,
          previous: null,
          results: state.allTransactions,
        };
      }
    },
    resetTransactions: (state) => {
      state.allTransactions = [];
      state.hasLoadedAll = false;
      state.currentPage = 1;
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
      })
      .addCase(loadAllP2PTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadAllP2PTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.allTransactions = action.payload.transactions;
        state.hasLoadedAll = true;
        state.transactions = {
          count: action.payload.count,
          next: null,
          previous: null,
          results: action.payload.transactions,
        };
      })
      .addCase(loadAllP2PTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to load all P2P transactions";
      });
  },
});

export const { setCurrentPage, toggleViewAll, resetTransactions } = p2pTransactionsSlice.actions;
export default p2pTransactionsSlice.reducer;
