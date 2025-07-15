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
}

const initialState: ReferralWalletState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchReferralWallet = createAsyncThunk(
  "referralWallet/fetch",
  async () => {
    const response = await getReferralWallet();
    return response;
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
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReferralWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReferralWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchReferralWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch referral wallet";
      })
      .addCase(createReferralWithdraw.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReferralWithdraw.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally update state.data if API returns updated wallet
      })
      .addCase(createReferralWithdraw.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          "Failed to withdraw from referral wallet";
      });
  },
});

export default referralWalletSlice.reducer;
