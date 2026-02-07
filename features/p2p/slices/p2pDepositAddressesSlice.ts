import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getP2PDepositAddresses, getDepositAddress } from "../api";
import type { P2PDepositAddress } from "../api";

export const fetchP2PDepositAddresses = createAsyncThunk<
  P2PDepositAddress[],
  void,
  { rejectValue: string }
>(
  "p2pDepositAddresses/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return await getP2PDepositAddresses();
    } catch (err: any) {
      return rejectWithValue(err?.message || "Failed to fetch P2P deposit addresses");
    }
  }
);

export const createP2PDepositAddress = createAsyncThunk<
  P2PDepositAddress,
  { asset: string; network: string },
  { rejectValue: string }
>(
  "p2pDepositAddresses/create",
  async ({ asset, network }, { rejectWithValue }) => {
    try {
      const response = await getDepositAddress(asset, network);
      const data = (response as any)?.data ?? response;
      if (data?.address) {
        return {
          id: data.id,
          address: data.address,
          chain: data.chain || network,
          network_name: data.network_name || network,
          is_default: data.is_default ?? false,
          is_active: data.is_active ?? false,
          created_at: data.created_at || new Date().toISOString(),
        };
      }
      return rejectWithValue("Invalid response from server");
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Failed to create deposit address"
      );
    }
  }
);

interface P2PDepositAddressesState {
  addresses: P2PDepositAddress[];
  loading: boolean;
  error: string | null;
  createLoading: boolean;
  createError: string | null;
  createSuccess: boolean;
}

const initialState: P2PDepositAddressesState = {
  addresses: [],
  loading: false,
  error: null,
  createLoading: false,
  createError: null,
  createSuccess: false,
};

const p2pDepositAddressesSlice = createSlice({
  name: "p2pDepositAddresses",
  initialState,
  reducers: {
    clearCreateError(state) {
      state.createError = null;
    },
    clearCreateStatus(state) {
      state.createError = null;
      state.createSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchP2PDepositAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchP2PDepositAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload;
      })
      .addCase(fetchP2PDepositAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch";
      })
      .addCase(createP2PDepositAddress.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createP2PDepositAddress.fulfilled, (state, action) => {
        state.createLoading = false;
        state.createError = null;
        if (!state.addresses.some((a) => a.id === action.payload.id)) {
          state.addresses = [action.payload, ...state.addresses];
        }
      })
      .addCase(createP2PDepositAddress.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload || "Failed to create";
      });
  },
});

export const { clearCreateError, clearCreateStatus } = p2pDepositAddressesSlice.actions;
export default p2pDepositAddressesSlice.reducer;
