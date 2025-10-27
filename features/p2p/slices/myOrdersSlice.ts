/**
 * myOrdersSlice.ts - Redux slice for fetching user's own P2P orders
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getMyP2POrders } from "../api";
import { P2PMyOrders } from "../types";
import { handleP2PError } from "@/lib/utils/errorHandler";

import { logger } from '@/lib/utils/logger';

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
      total_pages: 1,
    },
    sell_pagination: {
      count: 0,
      next: null,
      previous: null,
      current_page: 1,
      total_pages: 1,
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
  logger.debug('p2p', "Redux thunk fetchMyOrders called with page:", page);
  try {
    const response = await getMyP2POrders(page);
    logger.debug('p2p', 
      "Redux thunk fetchMyOrders success for page:",
      page,
      "with data:",
      {
        buyOrdersCount: response.buy_orders?.length || 0,
        sellOrdersCount: response.sell_orders?.length || 0,
        totalOrders: (response.buy_orders?.length || 0) + (response.sell_orders?.length || 0),
        buyPagination: response.buy_pagination,
        sellPagination: response.sell_pagination,
      }
    );
    return response;
  } catch (err) {
    logger.debug('p2p', "Redux thunk fetchMyOrders error for page:", page, err);
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
      logger.debug('p2p', 
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
        logger.debug('p2p', "fetchMyOrders.pending for page:", state.currentPage);
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        logger.debug('p2p', "fetchMyOrders.fulfilled with data:", {
          buyOrdersCount: action.payload.buy_orders?.length || 0,
          sellOrdersCount: action.payload.sell_orders?.length || 0,
          totalOrders: (action.payload.buy_orders?.length || 0) + (action.payload.sell_orders?.length || 0),
          currentPage: state.currentPage,
        });
        state.loading = false;
        state.orders = action.payload;
        state.error = null;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        logger.debug('p2p', "fetchMyOrders.rejected:", action.payload);
        state.loading = false;
        state.error = (action.payload as string) || "An unexpected error occurred";
      });
  },
});

export const { setCurrentPage, clearError } = myOrdersSlice.actions;
export default myOrdersSlice.reducer;
