import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { settingsApi } from "../api";

// Types for referral withdrawal history
export interface ReferralWithdrawalUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  role: string;
  phone_number: string | null;
  is_verified: boolean;
  photo: string | null;
  is_deactivated: boolean;
  freeze: boolean;
}

export interface ReferralWithdrawalHistoryItem {
  id: number;
  user: ReferralWithdrawalUser;
  referral_withdrawal_id: string;
  wallet_address: string;
  timestamp: string;
  status: "pending" | "approved" | "rejected" | "completed" | "otp_pending";
  requested_amount: string;
  otp_created_at: string;
  assign_to: string | null;
  timezone: string;
  phone: string;
  email: string;
  client_name: string;
  client_photo: string | null;
  currency: string;
}

export interface ReferralWithdrawalHistoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReferralWithdrawalHistoryItem[];
}

interface ReferralWithdrawalHistoryState {
  data: ReferralWithdrawalHistoryResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: ReferralWithdrawalHistoryState = {
  data: null,
  loading: false,
  error: null,
};

// Async thunk to fetch referral withdrawal history
export const fetchReferralWithdrawalHistory = createAsyncThunk(
  "referralWithdrawalHistory/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsApi.getReferralWithdrawalHistory();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch withdrawal history"
      );
    }
  }
);

const referralWithdrawalHistorySlice = createSlice({
  name: "referralWithdrawalHistory",
  initialState,
  reducers: {
    clearHistory: (state) => {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReferralWithdrawalHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchReferralWithdrawalHistory.fulfilled,
        (state, action: PayloadAction<ReferralWithdrawalHistoryResponse>) => {
          state.loading = false;
          state.data = action.payload;
          state.error = null;
        }
      )
      .addCase(fetchReferralWithdrawalHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearHistory } = referralWithdrawalHistorySlice.actions;
export default referralWithdrawalHistorySlice.reducer;

