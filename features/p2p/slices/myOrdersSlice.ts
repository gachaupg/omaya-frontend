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

export const fetchMyOrders = createAsyncThunk<
  P2PMyOrders,
  number,
  { rejectValue: string }
>("myOrders/fetchMyOrders", async (page: number = 1, { rejectWithValue }) => {
  console.log("Redux thunk fetchMyOrders called with page:", page);
  try {
    const response = await getMyP2POrders(page);
    console.log(
      "Redux thunk fetchMyOrders success for page:",
      page,
      "with data:",
      {
        count: response.count,
        resultsCount: response.results?.results?.length,
      }
    );
    return response;
  } catch (err) {
    console.log("Redux thunk fetchMyOrders error for page:", page, err);
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
      console.log(
        "myOrders setCurrentPage action dispatched:",
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
      .addCase(fetchMyOrders.pending, (state) => {
        console.log("fetchMyOrders.pending for page:", state.currentPage);
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        console.log("fetchMyOrders.fulfilled with data:", {
          count: action.payload.count,
          resultsCount: action.payload.results?.results?.length,
          currentPage: state.currentPage,
        });
        state.loading = false;
        state.orders = action.payload;
        state.error = null;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        console.log("fetchMyOrders.rejected:", action.payload);
        state.loading = false;
        state.error = (action.payload as string) || "An unexpected error occurred";
      });
  },
});

export const { setCurrentPage, clearError } = myOrdersSlice.actions;
export default myOrdersSlice.reducer;
