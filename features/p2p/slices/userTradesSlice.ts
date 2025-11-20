import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getUserTrades } from "../api";
import { handleP2PError } from "@/lib/utils/errorHandler";

import { logger } from '@/lib/utils/logger';

interface UserTrade {
  id: string;
  buy_order: number | null;
  sell_order: number | null;
  owner: string;
  advertiser_name: string;
  auto_reply: string;
  terms_and_conditions: string;
  completion_rate: number;
  completion_time: string;
  limit: string;
  buyer: string;
  seller: string;
  price: string;
  amount: string;
  timestamp: string;
  associated_trade: number;
  order_type: string;
  status: string;
  rate: number;
  currency?: string;
  payment_details: Array<{
    provider: string;
    account_name: string;
    account_number: string;
  }>;
  buyer_photo: string | null;
  seller_photo: string | null;
  commission_amount: number;
  net_amount: number;
}

interface UserTradesState {
  trades: {
    count: number;
    next: string | null;
    previous: string | null;
    results: UserTrade[];
  };
  loading: boolean;
  error: string | null;
  currentPage: number;
}

interface FetchUserTradesParams {
  page: number;
  type?: string;
  status?: string;
  date?: string;
  currency?: string;
}

const initialState: UserTradesState = {
  trades: {
    count: 0,
    next: null,
    previous: null,
    results: [],
  },
  loading: false,
  error: null,
  currentPage: 1,
};

export const fetchUserTrades = createAsyncThunk(
  "userTrades/fetchUserTrades",
  async (params: FetchUserTradesParams, { rejectWithValue }) => {
    try {
      const { page, type, status, date, currency } = params;
      let url = `?page=${page}`;

      // Map filter values to API parameters
      if (type && type !== "all") {
        url += `&order_type=${type}`;
      }

      if (status && status !== "all" && status !== "processing") {
        // Don't send status filter for "processing" - let client-side filtering handle it
        // Processing includes pending, matched, and half-matched which need client-side filtering
        url += `&status=${status}`;
      }

      if (date && date !== "all") {
        const today = new Date();
        let startDate = new Date();

        switch (date) {
          case "today":
            startDate.setHours(0, 0, 0, 0);
            break;
          case "week":
            startDate.setDate(today.getDate() - 7);
            break;
          case "month":
            startDate.setMonth(today.getMonth() - 1);
            break;
        }

        url += `&start_date=${startDate.toISOString()}`;
        url += `&end_date=${today.toISOString()}`;
      }

      if (currency && currency !== "all") {
        url += `&currency=${currency.toUpperCase()}`;
      }

      logger.debug('p2p', "Fetching trades with URL:", url);
      const response = await getUserTrades(url);
      logger.debug('p2p', "API Response:", response);
      return response;
    } catch (err: any) {
      console.error("Error fetching trades:", err);
      handleP2PError(err);
      return rejectWithValue(err.message || "Failed to fetch user trades");
    }
  }
);

const userTradesSlice = createSlice({
  name: "userTrades",
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
      .addCase(fetchUserTrades.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserTrades.fulfilled, (state, action) => {
        state.loading = false;
        state.trades = action.payload;
        state.error = null;
      })
      .addCase(fetchUserTrades.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentPage, clearError } = userTradesSlice.actions;
export default userTradesSlice.reducer;
