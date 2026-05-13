/**
 * merchantSlice.ts – Merchant Application Redux Slice
 */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { P2PResponse, MerchantApplicationStatus } from "../types";
import * as api from "../api";

/** Axios / fetch client timeouts often surface as raw messages; avoid showing those to users. */
function isRequestTimeoutError(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  if (e?.code === "ECONNABORTED") return true;
  if (typeof e?.message === "string" && e.message.toLowerCase().includes("timeout")) {
    return true;
  }
  return false;
}

interface MerchantApplicationState {
  loading: boolean;
  error: string | { detail: string; errors: string[] } | null;
  success: boolean;
  applicationData: any | null;
  status: MerchantApplicationStatus | null;
  statusLoading: boolean;
}

const initialState: MerchantApplicationState = {
  loading: false,
  error: null,
  success: false,
  applicationData: null,
  status: null,
  statusLoading: false,
};

// Async thunk for submitting merchant application
export const submitMerchantApplicationThunk = createAsyncThunk(
  "merchant/submitApplication",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await api.submitMerchantApplication(formData);
      return response;
    } catch (err: any) {
      // Handle API error response structure
      if (err.response?.data) {
        return rejectWithValue(err.response.data);
      }
      if (isRequestTimeoutError(err)) {
        return rejectWithValue(
          "Application could not be submitted. Please try again later."
        );
      }
      return rejectWithValue(err.message || "Failed to submit merchant application");
    }
  }
);

// Async thunk for fetching merchant application status
export const fetchMerchantApplicationStatusThunk = createAsyncThunk(
  "merchant/fetchStatus",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getMerchantApplicationStatus();
      return response;
    } catch (err: any) {
      if (err.response?.data) {
        return rejectWithValue(err.response.data);
      }
      if (isRequestTimeoutError(err)) {
        return rejectWithValue(
          "Application status could not be loaded. Please try again later."
        );
      }
      return rejectWithValue(err.message || "Failed to fetch merchant application status");
    }
  }
);

const merchantSlice = createSlice({
  name: "merchant",
  initialState,
  reducers: {
    clearMerchantError: (state) => {
      state.error = null;
    },
    clearMerchantSuccess: (state) => {
      state.success = false;
    },
    resetMerchantState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.applicationData = null;
      state.status = null;
      state.statusLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitMerchantApplicationThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(submitMerchantApplicationThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.applicationData = action.payload;
        state.error = null;
      })
      .addCase(submitMerchantApplicationThunk.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string | { detail: string; errors: string[] }) || "Failed to submit merchant application";
      })
      // Fetch status reducers
      .addCase(fetchMerchantApplicationStatusThunk.pending, (state) => {
        state.statusLoading = true;
      })
      .addCase(fetchMerchantApplicationStatusThunk.fulfilled, (state, action) => {
        state.statusLoading = false;
        state.status = action.payload;
      })
      .addCase(fetchMerchantApplicationStatusThunk.rejected, (state, action) => {
        state.statusLoading = false;
        state.error = (action.payload as string | { detail: string; errors: string[] }) || "Failed to fetch merchant application status";
      });
  },
});

export const { clearMerchantError, clearMerchantSuccess, resetMerchantState } = merchantSlice.actions;
export default merchantSlice.reducer;
