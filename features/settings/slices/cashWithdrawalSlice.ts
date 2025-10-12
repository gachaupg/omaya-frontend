import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { settingsApi } from "../api";
import { CashWithdrawalRequest, CashWithdrawalResponse } from "../types";

interface CashWithdrawalState {
  loading: boolean;
  error: string | null;
  success: boolean;
  message: string | null;
}

const initialState: CashWithdrawalState = {
  loading: false,
  error: null,
  success: false,
  message: null,
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

const cashWithdrawalSlice = createSlice({
  name: "cashWithdrawal",
  initialState,
  reducers: {
    clearSuccess: (state) => {
      state.success = false;
      state.message = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearAll: (state) => {
      state.success = false;
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCashWithdrawal.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.message = null;
      })
      .addCase(createCashWithdrawal.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.data?.message || "Cash withdrawal request submitted successfully";
      })
      .addCase(createCashWithdrawal.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to submit cash withdrawal request";
        state.success = false;
        state.message = null;
      });
  },
});

export const { clearSuccess, clearError, clearAll } = cashWithdrawalSlice.actions;

export default cashWithdrawalSlice.reducer;


