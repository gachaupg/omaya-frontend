import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getReferralWallet,
  createReferralWithdraw as apiCreateReferralWithdraw,
  verifyReferralOtp as apiVerifyReferralOtp,
} from "@/features/p2p/api";
import { ReferralWallet } from "@/features/p2p/types";
import { settingsApi } from "@/features/settings/api";
import { ReferralFeeCalculation } from "@/features/settings/types";

import { logger } from '@/lib/utils/logger';

interface ReferralWalletState {
  data: ReferralWallet | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  withdrawalId: string | null;
  showOtpModal: boolean;
  otpVerifying: boolean;
  otpError: string | null;
  fees: ReferralFeeCalculation | null;
  feesLoading: boolean;
  feesError: string | null;
}

const initialState: ReferralWalletState = {
  data: null,
  loading: false,
  error: null,
  success: false,
  withdrawalId: null,
  showOtpModal: false,
  otpVerifying: false,
  otpError: null,
  fees: null,
  feesLoading: false,
  feesError: null,
};

export const fetchReferralWallet = createAsyncThunk<ReferralWallet>(
  "referralWallet/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getReferralWallet();
      return response as ReferralWallet;
    } catch (error: any) {
      // Handle 404 errors gracefully
      if (error.response?.status === 404) {
        logger.warn('dashboard', "Referral wallet endpoint not available");
        return rejectWithValue("Referral wallet not available");
      }
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createReferralWithdraw = createAsyncThunk<
  { withdrawal_id?: string; id?: string },
  { requested_amount: string; wallet_address: string; withdrawal_method: string }
>(
  "referralWallet/withdraw",
  async (
    data: { requested_amount: string; wallet_address: string; withdrawal_method: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiCreateReferralWithdraw(data);
      return response as { withdrawal_id?: string; id?: string };
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const verifyReferralOtp = createAsyncThunk<
  any,
  { withdrawal_id: string; otp: string }
>(
  "referralWallet/verifyOtp",
  async (
    data: { withdrawal_id: string; otp: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiVerifyReferralOtp(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const calculateReferralFees = createAsyncThunk<
  ReferralFeeCalculation,
  string
>(
  "referralWallet/calculateFees",
  async (requestedAmount: string, { rejectWithValue }) => {
    try {
      const response = await settingsApi.calculateReferralFees(requestedAmount);
      return response as ReferralFeeCalculation;
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
    closeOtpModal: (state) => {
      state.showOtpModal = false;
      state.otpError = null;
    },
    clearFees: (state) => {
      state.fees = null;
      state.feesError = null;
      state.feesLoading = false;
    },
    setFeesFromCache: (state, action) => {
      state.fees = action.payload;
      state.feesLoading = false;
      state.feesError = null;
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
        state.data = action.payload as ReferralWallet;
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
        const payload = action.payload as { withdrawal_id?: string; id?: string };
        state.withdrawalId = payload.withdrawal_id || payload.id || null;
        state.showOtpModal = true;
      })
      .addCase(createReferralWithdraw.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          "Failed to withdraw from referral wallet";
        state.success = false;
      })
      .addCase(verifyReferralOtp.pending, (state) => {
        state.otpVerifying = true;
        state.otpError = null;
      })
      .addCase(verifyReferralOtp.fulfilled, (state) => {
        state.otpVerifying = false;
        state.showOtpModal = false;
        state.success = true;
        state.withdrawalId = null;
      })
      .addCase(verifyReferralOtp.rejected, (state, action) => {
        state.otpVerifying = false;
        state.otpError =
          (action.payload as string) ||
          "Failed to verify OTP";
      })
      .addCase(calculateReferralFees.pending, (state) => {
        state.feesLoading = true;
        state.feesError = null;
      })
      .addCase(calculateReferralFees.fulfilled, (state, action) => {
        state.feesLoading = false;
        state.fees = action.payload as ReferralFeeCalculation;
      })
      .addCase(calculateReferralFees.rejected, (state, action) => {
        state.feesLoading = false;
        state.fees = null;
        state.feesError =
          (action.payload as string) ||
          "Failed to calculate fees";
      });
  },
});

export const { clearSuccess, clearError, closeOtpModal, clearFees, setFeesFromCache } = referralWalletSlice.actions;

export default referralWalletSlice.reducer;
