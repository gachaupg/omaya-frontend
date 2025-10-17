import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { settingsApi } from "../api";
import { CashWithdrawalRequest, CashWithdrawalResponse, ReferralFeeCalculation } from "../types";

interface CashWithdrawalState {
  loading: boolean;
  error: string | null;
  success: boolean;
  message: string | null;
  withdrawalData: CashWithdrawalResponse | null;
  fees: ReferralFeeCalculation | null;
  feesLoading: boolean;
  feesError: string | null;
}

const initialState: CashWithdrawalState = {
  loading: false,
  error: null,
  success: false,
  message: null,
  withdrawalData: null,
  fees: null,
  feesLoading: false,
  feesError: null,
};

export const createCashWithdrawal = createAsyncThunk(
  "cashWithdrawal/create",
  async (data: CashWithdrawalRequest, { rejectWithValue }) => {
    try {
      const response = await settingsApi.createCashWithdrawal(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const calculateCashWithdrawalFees = createAsyncThunk(
  "cashWithdrawal/calculateFees",
  async (requestedAmount: string, { rejectWithValue }) => {
    try {
      const response = await settingsApi.calculateReferralFees(requestedAmount);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const cashWithdrawalSlice = createSlice({
  name: "cashWithdrawal",
  initialState,
  reducers: {
    clearSuccess: (state) => {
      state.success = false;
      state.message = null;
      state.withdrawalData = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearAll: (state) => {
      state.success = false;
      state.error = null;
      state.message = null;
      state.withdrawalData = null;
    },
    clearFees: (state) => {
      state.fees = null;
      state.feesError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCashWithdrawal.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.message = null;
        state.withdrawalData = null;
      })
      .addCase(createCashWithdrawal.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message || "Cash withdrawal request submitted successfully";
        state.withdrawalData = action.payload;
      })
      .addCase(createCashWithdrawal.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to submit cash withdrawal request";
        state.success = false;
        state.message = null;
        state.withdrawalData = null;
      })
      .addCase(calculateCashWithdrawalFees.pending, (state) => {
        state.feesLoading = true;
        state.feesError = null;
      })
      .addCase(calculateCashWithdrawalFees.fulfilled, (state, action) => {
        state.feesLoading = false;
        state.fees = action.payload;
      })
      .addCase(calculateCashWithdrawalFees.rejected, (state, action) => {
        state.feesLoading = false;
        state.feesError =
          (action.payload as string) ||
          "Failed to calculate fees";
      });
  },
});

export const { clearSuccess, clearError, clearAll, clearFees } = cashWithdrawalSlice.actions;

export default cashWithdrawalSlice.reducer;


