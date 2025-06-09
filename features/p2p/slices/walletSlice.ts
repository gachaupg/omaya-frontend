// File: features/p2p/slices/walletSlice.ts
import { getWallets } from '../api';
import { Wallet } from '../types';
import { createStandardAsyncThunk, createStandardSlice } from './standardSliceTemplate';

export const fetchWallets = createStandardAsyncThunk(
  'wallets/fetchWallets',
  getWallets
);

const walletSlice = createStandardSlice<Wallet[]>(
  'wallets',
  [],
  (builder: any) => {
    builder
      .addCase(fetchWallets.pending, (state: any) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWallets.fulfilled, (state: any, action: any) => {
        state.loading = false;
        state.data = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchWallets.rejected, (state: any, action: any) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
);

export const { clearError, setLoading } = walletSlice.actions;
export default walletSlice.reducer;