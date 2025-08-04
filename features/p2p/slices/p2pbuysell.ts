/**
 * orderSlice.ts – auto‑generated placeholder
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllP2PBuyandSell } from "../api";
import { P2PState, P2PBuySellResponse } from "../types";
import { handleP2PError } from "@/lib/utils/errorHandler";

const initialState: P2PState = {
  orders: {
    count: 0,
    next: null,
    previous: null,
    results: {
      total_orders_count: 0,
      results: [],
    },
  },
  loading: false,
  error: null,
  currentPage: 1,
};

export const p2pBuyandSell = createAsyncThunk<
  P2PBuySellResponse,
  number,
  { rejectValue: string }
>("buysell/p2pBuyandSell", async (page: number = 1, { rejectWithValue }) => {
  console.log("Redux thunk p2pBuyandSell called with page:", page);
  try {
    const response = await getAllP2PBuyandSell(page);
    console.log(
      "Redux thunk p2pBuyandSell success for page:",
      page,
      "with data:",
      {
        count: response.count,
        resultsCount: response.results?.results?.length,
      }
    );
    return response;
  } catch (err) {
    console.log("Redux thunk p2pBuyandSell error for page:", page, err);
    try {
      handleP2PError(err);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
    return rejectWithValue("An unexpected error occurred");
  }
});

const p2pBuySellSlice = createSlice({
  name: "buysell",
  initialState,
  reducers: {
    setCurrentPage: (state, action) => {
      console.log(
        "setCurrentPage action dispatched:",
        action.payload,
        "Previous page:",
        state.currentPage
      );
      state.currentPage = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(p2pBuyandSell.pending, (state) => {
        console.log("p2pBuyandSell.pending for page:", state.currentPage);
        state.loading = true;
        state.error = null;
      })
      .addCase(p2pBuyandSell.fulfilled, (state, action) => {
        console.log("p2pBuyandSell.fulfilled with data:", {
          count: action.payload.count,
          resultsCount: action.payload.results?.results?.length,
          currentPage: state.currentPage,
        });
        state.loading = false;
        state.orders = action.payload;
        state.error = null;
      })
      .addCase(p2pBuyandSell.rejected, (state, action) => {
        console.log("p2pBuyandSell.rejected:", action.payload);
        state.loading = false;
        state.error = action.payload || "An unexpected error occurred";
      });
  },
});

export const { setCurrentPage, clearError } = p2pBuySellSlice.actions;
export default p2pBuySellSlice.reducer;
