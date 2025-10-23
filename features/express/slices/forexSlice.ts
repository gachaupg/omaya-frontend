import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createForexExchange, getForexExchange } from "../api/forex";
import {
  ForexDepositPayload,
  ForexWithdrawalPayload,
  ForexExchangeResponse,
  ForexState,
} from "../types/forex";

const initialState: ForexState = {
  currentExchange: null,
  loading: false,
  error: null,
};

// Async thunk to create forex exchange
export const createForexExchangeThunk = createAsyncThunk<
  ForexExchangeResponse,
  ForexDepositPayload | ForexWithdrawalPayload
>(
  "forex/createExchange",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await createForexExchange(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to create forex exchange"
      );
    }
  }
);

// Async thunk to fetch forex exchange by transaction ID
export const fetchForexExchangeThunk = createAsyncThunk<
  ForexExchangeResponse,
  string
>(
  "forex/fetchExchange",
  async (transactionId, { rejectWithValue }) => {
    try {
      const response = await getForexExchange(transactionId);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to load forex exchange details"
      );
    }
  }
);

const forexSlice = createSlice({
  name: "forex",
  initialState,
  reducers: {
    clearForexExchange: (state) => {
      state.currentExchange = null;
      state.error = null;
    },
    setForexExchangeFromCache: (state, action) => {
      state.currentExchange = action.payload;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createForexExchangeThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createForexExchangeThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.currentExchange = action.payload;
        state.error = null;
      })
      .addCase(createForexExchangeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchForexExchangeThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchForexExchangeThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.currentExchange = action.payload;
        state.error = null;
      })
      .addCase(fetchForexExchangeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearForexExchange, setForexExchangeFromCache } = forexSlice.actions;
export default forexSlice.reducer;
