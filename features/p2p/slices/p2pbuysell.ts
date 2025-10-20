/**
 * orderSlice.ts – auto‑generated placeholder
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllP2PBuyandSell } from "../api";
import { P2PMyOrders } from "../types";
import { handleP2PError } from "@/lib/utils/errorHandler";

interface P2PBuySellState {
  orders: P2PMyOrders;
  loading: boolean;
  error: string | null;
  currentPage: number;
}

const initialState: P2PBuySellState = {
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
  P2PMyOrders,
  number,
  { rejectValue: string }
>("buysell/p2pBuyandSell", async (page: number = 1, { rejectWithValue }) => {
 
  try {
    const response = await getAllP2PBuyandSell(page);
   
    return response;
  } catch (err) {
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
      
      state.currentPage = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(p2pBuyandSell.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(p2pBuyandSell.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
        state.error = null;
      })
      .addCase(p2pBuyandSell.rejected, (state, action) => {
          state.loading = false;
        state.error = (action.payload as string) || "An unexpected error occurred";
      });
  },
});

export const { setCurrentPage, clearError } = p2pBuySellSlice.actions;
export default p2pBuySellSlice.reducer;
