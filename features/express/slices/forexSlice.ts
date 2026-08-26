import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createForexExchange, getForexExchange } from "../api/forex";
import {
  ForexDepositPayload,
  ForexWithdrawalPayload,
  ForexExchangeResponse,
  ForexState,
} from "../types/forex";
import { normalizeForexExchange, resolveForexRejectionReason } from "../utils/normalizeForexExchange";

const initialState: ForexState = {
  currentExchange: null,
  loading: false,
  error: null,
};

const extractForexErrorMessage = (error: any, fallback: string): string => {
  const data = error?.response?.data;
  const direct =
    data?.message ||
    data?.error ||
    data?.response_data?.message ||
    data?.response_data?.error ||
    data?.detail ||
    data?.details;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  if (typeof error?.message === "string" && error.message.trim()) {
    if (/request failed with status code 400/i.test(error.message)) return fallback;
    return error.message.trim();
  }
  return fallback;
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
        extractForexErrorMessage(error, "Failed to create forex exchange")
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
        extractForexErrorMessage(error, "Failed to load forex exchange details")
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
      const payload = action.payload;
      state.currentExchange =
        payload && typeof payload === "object"
          ? normalizeForexExchange(
              payload,
              String(
                (payload as ForexExchangeResponse).forex_transaction_id ||
                  (payload as ForexExchangeResponse).transaction_id ||
                  ""
              )
            )
          : payload;
      state.loading = false;
      state.error = null;
    },
    patchForexExchangeFromWs: (
      state,
      action: {
        payload: {
          status?: string;
          stages?: string;
          status_display?: string;
          stage_display?: string;
          [key: string]: unknown;
        };
      }
    ) => {
      if (!state.currentExchange) return;
      const existingReason = resolveForexRejectionReason(
        state.currentExchange as Record<string, unknown>
      );
      const incomingReason = resolveForexRejectionReason(action.payload);
      state.currentExchange = normalizeForexExchange(
        {
          ...state.currentExchange,
          ...action.payload,
          ...(incomingReason || existingReason
            ? { rejection_reason: incomingReason || existingReason }
            : {}),
        },
        state.currentExchange.forex_transaction_id ||
          state.currentExchange.transaction_id
      );
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
        state.currentExchange = normalizeForexExchange(
          action.payload,
          action.payload.forex_transaction_id || action.payload.transaction_id
        );
        state.error = null;
      })
      .addCase(createForexExchangeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchForexExchangeThunk.pending, (state) => {
        if (!state.currentExchange) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchForexExchangeThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.currentExchange = normalizeForexExchange(
          action.payload,
          action.payload.forex_transaction_id || action.payload.transaction_id
        );
        state.error = null;
      })
      .addCase(fetchForexExchangeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearForexExchange,
  setForexExchangeFromCache,
  patchForexExchangeFromWs,
} = forexSlice.actions;
export default forexSlice.reducer;
