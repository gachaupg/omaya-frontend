import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createForexExchange } from '../api';
import { ForexExchangePayload, ForexExchangeResponse } from '../types';

export interface ForexState {
  loading: boolean;
  error: string | null;
  success: boolean;
  transaction: ForexExchangeResponse | null;
}

const initialState: ForexState = {
  loading: false,
  error: null,
  success: false,
  transaction: null,
};

// Create forex exchange transaction
export const createForexTransaction = createAsyncThunk(
  'forex/createExchange',
  async (payload: ForexExchangePayload, { rejectWithValue }) => {
    try {
      const response = await createForexExchange(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to create forex exchange transaction'
      );
    }
  }
);

const forexSlice = createSlice({
  name: 'forex',
  initialState,
  reducers: {
    resetForexState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.transaction = null;
    },
    clearForexError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createForexTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createForexTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.transaction = action.payload;
      })
      .addCase(createForexTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });
  },
});

export const { resetForexState, clearForexError } = forexSlice.actions;
export default forexSlice.reducer;

