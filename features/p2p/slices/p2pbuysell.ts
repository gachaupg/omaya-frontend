/**
 * orderSlice.ts – auto‑generated placeholder
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllP2PBuyandSell } from "../api";
import { P2PMyOrders } from "../types";
import { handleP2PError } from "@/lib/utils/errorHandler";

import { logger } from '@/lib/utils/logger';

interface P2PBuySellState {
  orders: P2PMyOrders;
  loading: boolean;
  error: string | null;
  currentPage: number;
}

const initialState: P2PBuySellState = {
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

export const p2pBuyandSell = createAsyncThunk<
  P2PMyOrders,
  number,
  { rejectValue: string }
>("buysell/p2pBuyandSell", async (page: number = 1, { rejectWithValue }) => {
  logger.debug('p2p', "Redux thunk p2pBuyandSell called with page:", page);
  try {
    const response = await getAllP2PBuyandSell(page);
    logger.debug('p2p', 
      "Redux thunk p2pBuyandSell success for page:",
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
    logger.debug('p2p', "Redux thunk p2pBuyandSell error for page:", page, err);
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
      logger.debug('p2p', 
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
        logger.debug('p2p', "p2pBuyandSell.pending for page:", state.currentPage);
        state.loading = true;
        state.error = null;
      })
      .addCase(p2pBuyandSell.fulfilled, (state, action) => {
        logger.debug('p2p', "p2pBuyandSell.fulfilled with data:", {
          buyOrdersCount: action.payload.buy_orders?.length || 0,
          sellOrdersCount: action.payload.sell_orders?.length || 0,
          totalOrders: (action.payload.buy_orders?.length || 0) + (action.payload.sell_orders?.length || 0),
          currentPage: state.currentPage,
        });
        state.loading = false;
        state.orders = action.payload;
        state.error = null;
      })
      .addCase(p2pBuyandSell.rejected, (state, action) => {
        logger.debug('p2p', "p2pBuyandSell.rejected:", action.payload);
        state.loading = false;
        state.error = (action.payload as string) || "An unexpected error occurred";
      });
  },
});

export const { setCurrentPage, clearError } = p2pBuySellSlice.actions;
export default p2pBuySellSlice.reducer;
