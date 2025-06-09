/**
 * orderSlice.ts – auto‑generated placeholder
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAllP2POrders,
  matchP2POrder,
  getConfirmOrder,
  SingleOrder,
  cancelP2POrder,
  confirmP2PTrade,
  confirmTrade,
} from "../api";
import { OrderMatchRequest, P2POrderList, P2POrder } from "../types";
import { handleP2PError } from "../../../lib/utils/errorHandler";
import { fetchWallets } from "./walletSlice";
import { logger } from "@/lib/logger";

interface P2PState {
  p2pBuyOrders: P2POrderList;
  p2pSellOrders: P2POrderList;
  loading: boolean;
  error: string | null;
  currentPage: number;
  matchLoading: boolean;
  matchError: string | null;
  matchSuccess: boolean;
  confirmOrder: P2POrder | null;
  confirmOrderLoading: boolean;
  confirmOrderError: string | null;
  singleOrder: P2POrder | null;
  singleOrderLoading: boolean;
  singleOrderError: string | null;
  cancelLoading?: boolean;
  cancelError?: string | null;
  cancelSuccess?: boolean;
  confirmTradeLoading?: boolean;
  confirmTradeError?: string | null;
  confirmTradeSuccess?: boolean;
}

export const fetchAllP2POrders = createAsyncThunk(
  "p2pMarket/fetchAllP2POrders",
  async (page: number = 1, { rejectWithValue }) => {
    try {
      return await getAllP2POrders(page);
    } catch (err: any) {
      handleP2PError(err);
      return rejectWithValue(err.message || "Failed to fetch all orders");
    }
  }
);

export const matchP2POrderThunk = createAsyncThunk(
  "p2p/matchOrder",
  async (
    { id, orderData }: { id: string; orderData: OrderMatchRequest },
    { rejectWithValue }
  ) => {
    try {
      const response = await matchP2POrder(id, orderData);
      return response;
    } catch (error: any) {
      handleP2PError(error);
      return rejectWithValue(error.message || "An error occurred");
    }
  }
);

export const fetchConfirmOrder = createAsyncThunk(
  "p2p/fetchConfirmOrder",
  async (id: string, { rejectWithValue }) => {
    try {
      return await getConfirmOrder(id);
    } catch (err: any) {
      handleP2PError(err);
      return rejectWithValue(err.message || "Failed to fetch confirm order");
    }
  }
);

export const fetchSingleOrder = createAsyncThunk(
  "p2p/fetchSingleOrder",
  async (id: string, { rejectWithValue }) => {
    try {
      return await SingleOrder(id);
    } catch (err: any) {
      handleP2PError(err);
      return rejectWithValue(err.message || "Failed to fetch single order");
    }
  }
);

export const cancelP2POrderThunk = createAsyncThunk(
  "p2p/cancelOrder",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await cancelP2POrder(id);
      return response;
    } catch (error: any) {
      handleP2PError(error);
      return rejectWithValue(error.message || "An error occurred");
    }
  }
);

// File: features/p2p/slices/orderSlice.ts
export const confirmP2PTradeThunk = createAsyncThunk(
  "p2p/confirmTrade",
  async (id: string, { dispatch, rejectWithValue, getState }) => {
    try {
      // Step 1: Confirm the trade
      const response = await confirmP2PTrade(id);

      // Step 2: Wait for order data to be refreshed
      const refreshResult = await dispatch(fetchConfirmOrder(id));

      // Step 3: Verify the refresh succeeded
      if (fetchConfirmOrder.rejected.match(refreshResult)) {
        logger.warn("Trade confirmed but failed to refresh order data", {
          tradeId: id,
          error: refreshResult.error,
        });
        // Don't fail the entire operation, just log the warning
      }

      // Step 4: Update related data if needed
      await dispatch(fetchWallets()); // Refresh wallet balances

      return response;
    } catch (error: any) {
      handleP2PError(error);
      return rejectWithValue(error.message || "An error occurred");
    }
  }
);

export const completeP2PTradeThunk = createAsyncThunk(
  "p2p/completeTrade",
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await confirmTrade(id);
      await dispatch(fetchConfirmOrder(id));
      return response;
    } catch (error: any) {
      handleP2PError(error);
      return rejectWithValue(error.message || "An error occurred");
    }
  }
);

const p2pMarketSlice = createSlice({
  name: "p2pMarket",
  initialState: {
    p2pBuyOrders: {
      next: null,
      previous: null,
      total_orders_count: 0,
      results: [],
    },
    p2pSellOrders: {
      next: null,
      previous: null,
      total_orders_count: 0,
      results: [],
    },
    loading: false,
    error: null,
    currentPage: 1,
    matchLoading: false,
    matchError: null,
    matchSuccess: false,
    confirmOrder: null,
    confirmOrderLoading: false,
    confirmOrderError: null,
    singleOrder: null,
    singleOrderLoading: false,
    singleOrderError: null,
    cancelLoading: false,
    cancelError: null,
    cancelSuccess: false,
    confirmTradeLoading: false,
    confirmTradeError: null,
    confirmTradeSuccess: false,
  } as P2PState,
  reducers: {
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    resetMatchState: (state) => {
      state.matchLoading = false;
      state.matchError = null;
      state.matchSuccess = false;
    },
    resetConfirmOrderState: (state) => {
      state.confirmOrder = null;
      state.confirmOrderLoading = false;
      state.confirmOrderError = null;
    },
    resetSingleOrderState: (state) => {
      state.singleOrder = null;
      state.singleOrderLoading = false;
      state.singleOrderError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllP2POrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllP2POrders.fulfilled, (state, action) => {
        state.loading = false;
        const { buy_orders, sell_orders } = action.payload as any;
        state.p2pBuyOrders = buy_orders;
        state.p2pSellOrders = sell_orders;
      })
      .addCase(fetchAllP2POrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(matchP2POrderThunk.pending, (state) => {
        state.matchLoading = true;
        state.matchError = null;
        state.matchSuccess = false;
      })
      .addCase(matchP2POrderThunk.fulfilled, (state) => {
        state.matchLoading = false;
        state.matchSuccess = true;
      })
      .addCase(matchP2POrderThunk.rejected, (state, action) => {
        state.matchLoading = false;
        state.matchError = action.payload as string;
      })
      .addCase(fetchConfirmOrder.pending, (state) => {
        state.confirmOrderLoading = true;
        state.confirmOrderError = null;
      })
      .addCase(fetchConfirmOrder.fulfilled, (state, action) => {
        state.confirmOrderLoading = false;
        state.confirmOrder = action.payload;
      })
      .addCase(fetchConfirmOrder.rejected, (state, action) => {
        state.confirmOrderLoading = false;
        state.confirmOrderError = action.payload as string;
      })
      .addCase(fetchSingleOrder.pending, (state) => {
        state.singleOrderLoading = true;
        state.singleOrderError = null;
      })
      .addCase(fetchSingleOrder.fulfilled, (state, action) => {
        state.singleOrderLoading = false;
        state.singleOrder = action.payload;
      })
      .addCase(fetchSingleOrder.rejected, (state, action) => {
        state.singleOrderLoading = false;
        state.singleOrderError = action.payload as string;
      })
      .addCase(cancelP2POrderThunk.pending, (state) => {
        state.cancelLoading = true;
        state.cancelError = null;
        state.cancelSuccess = false;
      })
      .addCase(cancelP2POrderThunk.fulfilled, (state) => {
        state.cancelLoading = false;
        state.cancelSuccess = true;
      })
      .addCase(cancelP2POrderThunk.rejected, (state, action) => {
        state.cancelLoading = false;
        state.cancelError = action.payload as string;
      })
      .addCase(confirmP2PTradeThunk.pending, (state) => {
        state.confirmTradeLoading = true;
        state.confirmTradeError = null;
        state.confirmTradeSuccess = false;
      })
      .addCase(confirmP2PTradeThunk.fulfilled, (state) => {
        state.confirmTradeLoading = false;
        state.confirmTradeSuccess = true;
      })
      .addCase(confirmP2PTradeThunk.rejected, (state, action) => {
        state.confirmTradeLoading = false;
        state.confirmTradeError = action.payload as string;
      })
      .addCase(completeP2PTradeThunk.pending, (state) => {
        state.confirmTradeLoading = true;
        state.confirmTradeError = null;
        state.confirmTradeSuccess = false;
      })
      .addCase(completeP2PTradeThunk.fulfilled, (state) => {
        state.confirmTradeLoading = false;
        state.confirmTradeSuccess = true;
      })
      .addCase(completeP2PTradeThunk.rejected, (state, action) => {
        state.confirmTradeLoading = false;
        state.confirmTradeError = action.payload as string;
      });
  },
});

export const {
  setCurrentPage,
  resetMatchState,
  resetConfirmOrderState,
  resetSingleOrderState,
} = p2pMarketSlice.actions;
export default p2pMarketSlice.reducer;
