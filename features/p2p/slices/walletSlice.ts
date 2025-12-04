// File: features/p2p/slices/walletSlice.ts
import { getWallets } from '../api';
import { WalletResponse } from '../types';
import { createStandardAsyncThunk, createStandardSlice } from './standardSliceTemplate';

export const fetchWallets = createStandardAsyncThunk(
  'wallets/fetchWallets',
  getWallets
);

const walletSlice = createStandardSlice<WalletResponse>(
  'wallets',
  {} as WalletResponse,
  (builder: any) => {
    builder
      .addCase(fetchWallets.pending, (state: any) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWallets.fulfilled, (state: any, action: any) => {
        state.loading = false;
        // Ensure data is always an object, even if payload is null/undefined
        state.data = action.payload || {
          total_balance: '0',
          wallet: {
            id: 0,
            currency: 'USDT',
            balance: '0',
            deposit_address: '',
            created_on: new Date().toISOString(),
          },
          deposit_addresses: {
            tron: {
              address: null,
              status: 'inactive',
            },
            bsc: {
              address: '',
              status: 'inactive',
            },
          },
        };
        state.lastUpdated = Date.now();
      })
      .addCase(fetchWallets.rejected, (state: any, action: any) => {
        state.loading = false;
        state.error = action.payload;
        // Keep existing data or set safe default to prevent crashes
        if (!state.data) {
          state.data = {
            total_balance: '0',
            wallet: {
              id: 0,
              currency: 'USDT',
              balance: '0',
              deposit_address: '',
              created_on: new Date().toISOString(),
            },
            deposit_addresses: {
              tron: {
                address: null,
                status: 'inactive',
              },
              bsc: {
                address: '',
                status: 'inactive',
              },
            },
          };
        }
      });
  }
);

export const { clearError, setLoading } = walletSlice.actions;
export default walletSlice.reducer;