import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getReferralWallet,
  createReferralWithdraw as apiCreateReferralWithdraw,
} from "@/features/p2p/api";
import { ReferralWallet } from "@/features/p2p/types";

interface ReferralWalletState {
  data: ReferralWallet | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: ReferralWalletState = {
  data: null,
  loading: false,
  error: null,
  success: false,
};

export const fetchReferralWallet = createAsyncThunk(
  "referralWallet/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getReferralWallet();
      return response;
    } catch (error: any) {
      // Handle 404 errors gracefully
      if (error.response?.status === 404) {
        console.warn("Referral wallet endpoint not available");
        return rejectWithValue("Referral wallet not available");
      }
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createReferralWithdraw = createAsyncThunk(
  "referralWallet/withdraw",
  async (
    data: { requested_amount: string; wallet_address: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiCreateReferralWithdraw(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const referralWalletSlice = createSlice({
  name: "referralWallet",
  initialState,
  reducers: {
    clearSuccess: (state) => {
      state.success = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReferralWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchReferralWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchReferralWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch referral wallet";
        state.success = false;
      })
      .addCase(createReferralWithdraw.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createReferralWithdraw.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Optionally update state.data if API returns updated wallet
      })
      .addCase(createReferralWithdraw.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          "Failed to withdraw from referral wallet";
        state.success = false;
      });
  },
});

export const { clearSuccess, clearError } = referralWalletSlice.actions;

export default referralWalletSlice.reducer;
