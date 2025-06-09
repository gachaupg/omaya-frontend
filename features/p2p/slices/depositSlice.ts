import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { P2PDeposit, CreateP2PDepositRequest } from "../types";
import * as api from "../api";

interface DepositState {
  deposits: P2PDeposit[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

const initialState: DepositState = {
  deposits: [],
  loading: false,
  error: null,
  totalCount: 0,
};

// Async thunks
export const fetchDeposits = createAsyncThunk(
  "deposits/fetchDeposits",
  async () => {
    const response = await api.getDeposits();
    return response;
  }
);

export const createDeposit = createAsyncThunk(
  "deposits/createDeposit",
  async (data: CreateP2PDepositRequest) => {
    const formData = new FormData();
    formData.append("amount", data.amount.toString());
    formData.append("currency", data.currency);
    formData.append("network", data.network);
    formData.append("wallet_type", data.wallet_type);
    formData.append("document", data.document);

    const response = await api.createDeposit(formData);
    return response;
  }
);

export const updateDeposit = createAsyncThunk(
  "deposits/updateDeposit",
  async ({ id, data }: { id: string; data: Partial<P2PDeposit> }) => {
    const response = await api.updateDeposit(id, data);
    return response;
  }
);

const depositSlice = createSlice({
  name: "deposits",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Deposits
      .addCase(fetchDeposits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeposits.fulfilled, (state, action) => {
        state.loading = false;
        state.deposits = action.payload.results as P2PDeposit[];
        state.totalCount = action.payload.count;
      })
      .addCase(fetchDeposits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch deposits";
      })
      // Create Deposit
      .addCase(createDeposit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDeposit.fulfilled, (state, action) => {
        state.loading = false;
        state.deposits = [...state.deposits, action.payload as P2PDeposit];
      })
      .addCase(createDeposit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create deposit";
      })
      // Update Deposit
      .addCase(updateDeposit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDeposit.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateDeposit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update deposit";
      });
  },
});

export const { clearError } = depositSlice.actions;
export default depositSlice.reducer;
