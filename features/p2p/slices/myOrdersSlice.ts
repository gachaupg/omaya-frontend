/**
 * myOrdersSlice.ts - Redux slice for fetching user's own P2P orders
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getMyP2POrders } from "../api";
import { P2PMyOrders } from "../types";
import { handleP2PError } from "@/lib/utils/errorHandler";

interface MyOrdersState {
  orders: P2PMyOrders;
  loading: boolean;
  error: string | null;
  currentPage: number;
}

const initialState: MyOrdersState = {
  orders: {
    buy_orders: [],
    sell_orders: [],
    buy_pagination: {
      count: 0,
      next: null,
      previous: null,
      current_page: 1,
      total_pages: 0,
    },
    sell_pagination: {
      count: 0,
      next: null,
      previous: null,
      current_page: 1,
      total_pages: 0,
    },
  },
  loading: false,
  error: null,
  currentPage: 1,
};

export const fetchMyOrders = createAsyncThunk<
  P2PMyOrders,
  number,
  { rejectValue: string }
>("myOrders/fetchMyOrders", async (page: number = 1, { rejectWithValue }) => {
  try {
    const response = await getMyP2POrders(page);
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

const myOrdersSlice = createSlice({
  name: "myOrders",
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
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
        state.error = null;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "An unexpected error occurred";
      });
  },
});

export const { setCurrentPage, clearError } = myOrdersSlice.actions;
export default myOrdersSlice.reducer;
