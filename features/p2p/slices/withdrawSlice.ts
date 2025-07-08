import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { P2PWithdraw, CreateP2PWithdrawRequest } from "../types";
import * as api from "../api";

interface WithdrawState {
  withdrawals: P2PWithdraw[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

const initialState: WithdrawState = {
  withdrawals: [],
  loading: false,
  error: null,
  totalCount: 0,
};

// Async thunks
export const fetchWithdrawals = createAsyncThunk(
  "withdrawals/fetchWithdrawals",
  async () => {
    const response = await api.getWithdrawals();
    return response;
  }
);

export const createWithdrawal = createAsyncThunk(
  "withdrawals/createWithdrawal",
  async (data: CreateP2PWithdrawRequest) => {
    const response = await api.createWithdrawal(data);
    return response;
  }
);

export const verifyWithdrawal = createAsyncThunk(
  "withdrawals/verifyWithdrawal",
  async (data: { withdrawal_id: string; otp: string }) => {
    const response = await api.verifyWithdrawal(data);
    return response;
  }
);

const withdrawSlice = createSlice({
  name: "withdrawals",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Withdrawals
      .addCase(fetchWithdrawals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWithdrawals.fulfilled, (state, action) => {
        state.loading = false;
        state.withdrawals = action.payload.results as P2PWithdraw[];
        state.totalCount = action.payload.count;
      })
      .addCase(fetchWithdrawals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch withdrawals";
      })
      // Create Withdrawal
      .addCase(createWithdrawal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWithdrawal.fulfilled, (state, action) => {
        state.loading = false;
        state.withdrawals = [
          ...state.withdrawals,
          action.payload as P2PWithdraw,
        ];
      })
      .addCase(createWithdrawal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create withdrawal";
      })
      // Verify Withdrawal
      .addCase(verifyWithdrawal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyWithdrawal.fulfilled, (state, action) => {
        state.loading = false;
        // Handle successful verification
      })
      .addCase(verifyWithdrawal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to verify withdrawal";
      });
  },
});

export const { clearError } = withdrawSlice.actions;
export default withdrawSlice.reducer;
