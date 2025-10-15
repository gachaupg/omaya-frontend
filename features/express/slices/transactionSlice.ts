import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { post } from '@/lib/apiClient';
import { API_CONFIG } from '@/lib/appConfig';

export interface TransactionState {
  loading: boolean;
  error: string | null;
  success: boolean;
  cancelledTransactionId: string | null;
}

const initialState: TransactionState = {
  loading: false,
  error: null,
  success: false,
  cancelledTransactionId: null,
};

// Cancel deposit transaction
export const cancelDepositTransaction = createAsyncThunk(
  'expressTransaction/cancelDeposit',
  async (transactionId: string, { rejectWithValue }) => {
    try {
      const response = await post(API_CONFIG.EXPRESS.CANCEL_DEPOSIT(transactionId), {});
      return { transactionId, data: response };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to cancel deposit transaction'
      );
    }
  }
);

// Cancel withdrawal transaction
export const cancelWithdrawalTransaction = createAsyncThunk(
  'expressTransaction/cancelWithdrawal',
  async (transactionId: string, { rejectWithValue }) => {
    try {
      const response = await post(API_CONFIG.EXPRESS.CANCEL_WITHDRAWAL(transactionId), {});
      return { transactionId, data: response };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to cancel withdrawal transaction'
      );
    }
  }
);

// Cancel P2P deposit transaction
export const cancelP2PDepositTransaction = createAsyncThunk(
  'expressTransaction/cancelP2PDeposit',
  async (transactionId: string, { rejectWithValue }) => {
    try {
      const response = await post(API_CONFIG.EXPRESS.CANCEL_P2P_DEPOSIT(transactionId), {});
      return { transactionId, data: response };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to cancel P2P deposit transaction'
      );
    }
  }
);

const transactionSlice = createSlice({
  name: 'expressTransaction',
  initialState,
  reducers: {
    resetTransactionState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.cancelledTransactionId = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Cancel deposit transaction
    builder
      .addCase(cancelDepositTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(cancelDepositTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.cancelledTransactionId = action.payload.transactionId;
      })
      .addCase(cancelDepositTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // Cancel withdrawal transaction
    builder
      .addCase(cancelWithdrawalTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(cancelWithdrawalTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.cancelledTransactionId = action.payload.transactionId;
      })
      .addCase(cancelWithdrawalTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // Cancel P2P deposit transaction
    builder
      .addCase(cancelP2PDepositTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(cancelP2PDepositTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.cancelledTransactionId = action.payload.transactionId;
      })
      .addCase(cancelP2PDepositTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });
  },
});

export const { resetTransactionState, clearError } = transactionSlice.actions;
export default transactionSlice.reducer;

