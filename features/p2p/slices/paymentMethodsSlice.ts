import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAdminPaymentDetails,
  addUserPaymentDetail,
  getUserPaymentDetails,
  deletePaymentMethod,
  getPublicPaymentMethods,
  updateUserPaymentDetail,
  getUserPaymentDetail,
  sendPaymentDetailAddOtp as apiSendPaymentDetailAddOtp,
  verifyPaymentDetailAddOtp as apiVerifyPaymentDetailAddOtp,
  sendPaymentDetailEditOtp as apiSendPaymentDetailEditOtp,
  updatePaymentDetailWithOtp as apiUpdatePaymentDetailWithOtp,
} from "../api";
import { AdminPaymentMethod } from "../types/paymentMethods";
import { P2PResponse } from "../types";

export const fetchAdminPaymentMethods = createAsyncThunk<
  AdminPaymentMethod[],
  void,
  { rejectValue: string }
>("paymentMethods/fetchAdminPaymentMethods", async (_, { rejectWithValue }) => {
  try {
    return await getAdminPaymentDetails();
  } catch (err: any) {
    return rejectWithValue(err.message || "Failed to fetch payment methods");
  }
});

// ─── Public payment-methods cache ────────────────────────────────────────────
/** Cache TTL: 5 minutes in ms */
const PUBLIC_PM_TTL = 5 * 60 * 1000;

/** In-memory cache entry (survives re-renders, resets on hard refresh) */
let _publicPMCache: { data: any; fetchedAt: number } | null = null;

/** In-flight promise deduplication – all concurrent dispatches share ONE request */
let _publicPMInFlight: Promise<any> | null = null;

/**
 * Fetch public payment methods with a 5-minute cache.
 *
 * - If cached data is < 5 min old → returns it immediately (no network call).
 * - If a request is already in flight → awaits the same promise (no duplicate requests).
 * - Otherwise → fetches fresh data, stores it in cache, and updates Redux.
 *
 * Pass `forceRefresh: true` to bypass the cache (used by the background refetch hook).
 */
export const fetchPublicPaymentMethods = createAsyncThunk<
  any,
  { forceRefresh?: boolean } | void,
  { rejectValue: string }
>(
  "paymentMethods/fetchPublicPaymentMethods",
  async (arg, { rejectWithValue }) => {
    const forceRefresh = (arg as { forceRefresh?: boolean } | undefined)?.forceRefresh ?? false;

    // ── 1. Return from cache if still fresh ──────────────────────────────────
    if (
      !forceRefresh &&
      _publicPMCache &&
      Date.now() - _publicPMCache.fetchedAt < PUBLIC_PM_TTL
    ) {
      return _publicPMCache.data;
    }

    // ── 2. Deduplicate concurrent requests ───────────────────────────────────
    if (_publicPMInFlight) {
      try {
        return await _publicPMInFlight;
      } catch (err: any) {
        return rejectWithValue(err.message || "Failed to fetch public payment methods");
      }
    }

    // ── 3. Fire the real network request ─────────────────────────────────────
    _publicPMInFlight = getPublicPaymentMethods().finally(() => {
      _publicPMInFlight = null;
    });

    try {
      const data = await _publicPMInFlight;
      // Store in in-memory cache
      _publicPMCache = { data, fetchedAt: Date.now() };
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch public payment methods");
    }
  }
);

/** Manually invalidate the in-memory cache (e.g. after adding a payment method). */
export const invalidatePublicPaymentMethodsCache = () => {
  _publicPMCache = null;
  _publicPMInFlight = null;
};

const extractPaymentDetailError = (error: any): string => {
  const fallbackMessage = "Failed to operate on payment detail";

  if (!error) return fallbackMessage;

  // 1. Try to get the data from the response
  const responseData = error?.response?.data ?? error?.data ?? null;

  // 2. If data is a simple string, return it
  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  // 3. If data is an object, look for ANY string or array of strings
  if (responseData && typeof responseData === "object") {
    // Priority keys
    const priorityKeys = ["detail", "message", "error"];

    // Check priority keys first
    for (const key of priorityKeys) {
      const val = responseData[key];
      if (typeof val === "string" && val.trim()) return val;
      if (Array.isArray(val) && typeof val[0] === "string" && val[0].trim()) return val[0];
    }

    // Check ALL other keys (django field errors like account_number)
    for (const key in responseData) {
      if (priorityKeys.includes(key)) continue;
      const val = responseData[key];
      // DRF typically sends { field: ["error"] }
      if (Array.isArray(val) && typeof val[0] === "string" && val[0].trim()) {
        return val[0];
      }
      if (typeof val === "string" && val.trim()) {
        return val;
      }
    }
  }

  // 4. Fallback to the error object's message property
  const errorMessage = error?.message;
  if (typeof errorMessage === "string" && errorMessage.trim()) {
    return errorMessage;
  }

  return fallbackMessage;
};

export const postUserPaymentDetail = createAsyncThunk<
  unknown,
  {
    account_name: string;
    account_number: string;
    payment_method_name: string;
    payment_provider_name: string;
    provider_name: string;
    wallet_address?: string | null;
    allow_auto_send?: boolean;
  },
  { rejectValue: string }
>(
  "paymentMethods/postUserPaymentDetail",
  async (data, { rejectWithValue }) => {
    try {
      return await addUserPaymentDetail(data);
    } catch (err: any) {
      return rejectWithValue(extractPaymentDetailError(err));
    }
  }
);

// In-flight promise so multiple concurrent dispatches result in a single request
let userPaymentDetailsInFlightP2P: Promise<P2PResponse[]> | null = null;

export const fetchUserPaymentDetails = createAsyncThunk<
  P2PResponse[],
  void,
  { rejectValue: string }
>(
  "paymentMethods/fetchUserPaymentDetails",
  async (_, { rejectWithValue }) => {
    try {
      if (!userPaymentDetailsInFlightP2P) {
        userPaymentDetailsInFlightP2P = getUserPaymentDetails().finally(
          () => {
            userPaymentDetailsInFlightP2P = null;
          }
        );
      }
      return await userPaymentDetailsInFlightP2P;
    } catch (err: any) {
      userPaymentDetailsInFlightP2P = null;
      return rejectWithValue(
        err.message || "Failed to fetch user payment details"
      );
    }
  }
);




export const fetchUserPaymentDetail = createAsyncThunk<
  P2PResponse,
  string | number,
  { rejectValue: string }
>(
  "paymentMethods/fetchUserPaymentDetail",
  async (id, { rejectWithValue }) => {
    try {
      return await getUserPaymentDetail(id);
    } catch (err: any) {
      return rejectWithValue(
        err.message || "Failed to fetch payment detail"
      );
    }
  }
);

export const deleteUserPaymentDetail = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  "paymentMethods/deleteUserPaymentDetail",
  async (id, { rejectWithValue }) => {
    try {
      await deletePaymentMethod(id);
      return;
    } catch (err: any) {
      return rejectWithValue(extractPaymentDetailError(err));
    }
  }
);

export const patchUserPaymentDetail = createAsyncThunk<
  unknown,
  {
    id: string | number;
    data: {
      account_name?: string;
      account_number?: string;
      wallet_address?: string | null;
      allow_auto_send?: boolean;
      provider_name?: string;
    };
  },
  { rejectValue: string }
>(
  "paymentMethods/patchUserPaymentDetail",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await updateUserPaymentDetail(id, data);
    } catch (err: any) {
      return rejectWithValue(extractPaymentDetailError(err));
    }
  }
);

/** Send OTP for adding payment detail (required before postUserPaymentDetail). */
export const sendPaymentDetailAddOtp = createAsyncThunk<
  { message: string },
  void,
  { rejectValue: string }
>(
  "paymentMethods/sendPaymentDetailAddOtp",
  async (_, { rejectWithValue }) => {
    try {
      return await apiSendPaymentDetailAddOtp();
    } catch (err: any) {
      return rejectWithValue(extractPaymentDetailError(err));
    }
  }
);

/** Verify OTP for adding payment detail (required before postUserPaymentDetail). */
export const verifyPaymentDetailAddOtp = createAsyncThunk<
  { message: string },
  string,
  { rejectValue: string }
>(
  "paymentMethods/verifyPaymentDetailAddOtp",
  async (otp, { rejectWithValue }) => {
    try {
      return await apiVerifyPaymentDetailAddOtp(otp);
    } catch (err: any) {
      return rejectWithValue(extractPaymentDetailError(err));
    }
  }
);

/** Send OTP for editing payment detail (required before updatePaymentDetailWithOtp). */
export const sendPaymentDetailEditOtp = createAsyncThunk<
  { message: string; cooldown_seconds?: number },
  string,
  { rejectValue: string }
>(
  "paymentMethods/sendPaymentDetailEditOtp",
  async (paymentDetailId, { rejectWithValue }) => {
    try {
      return await apiSendPaymentDetailEditOtp(paymentDetailId);
    } catch (err: any) {
      return rejectWithValue(extractPaymentDetailError(err));
    }
  }
);

/** Update payment detail with OTP (after sendPaymentDetailEditOtp). */
export const updatePaymentDetailWithOtp = createAsyncThunk<
  P2PResponse,
  {
    id: string | number;
    data: {
      otp: string;
      account_name?: string;
      account_number?: string;
      wallet_address?: string | null;
      allow_auto_send?: boolean;
      provider_name?: string;
    };
  },
  { rejectValue: string }
>(
  "paymentMethods/updatePaymentDetailWithOtp",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await apiUpdatePaymentDetailWithOtp(id, data);
    } catch (err: any) {
      return rejectWithValue(extractPaymentDetailError(err));
    }
  }
);

interface PaymentMethodsState {
  adminMethods: AdminPaymentMethod[];
  publicPaymentMethods: any[];
  userPaymentDetails: any[];
  loading: boolean;
  error: string | null;
  postLoading: boolean;
  postError: string | null;
  postSuccess: boolean;
  userDetailsLoading: boolean;
  userDetailsError: string | null;
  deleteLoading: boolean;
  deleteError: string | null;
  publicMethodsLoading: boolean;
  publicMethodsError: string | null;
  /** Unix timestamp (ms) of the last successful public-methods fetch, or null if never fetched. */
  publicMethodsLastFetchedAt: number | null;
  patchLoading: boolean;
  patchError: string | null;
  patchSuccess: boolean;
  currentPaymentDetail: any | null;
  detailLoading: boolean;
  detailError: string | null;
}

const initialState: PaymentMethodsState = {
  adminMethods: [],
  publicPaymentMethods: [],
  userPaymentDetails: [],
  loading: false,
  error: null,
  postLoading: false,
  postError: null,
  postSuccess: false,
  userDetailsLoading: false,
  userDetailsError: null,
  deleteLoading: false,
  deleteError: null,
  publicMethodsLoading: false,
  publicMethodsError: null,
  publicMethodsLastFetchedAt: null,
  patchLoading: false,
  patchError: null,
  patchSuccess: false,
  currentPaymentDetail: null,
  detailLoading: false,
  detailError: null,
};

const paymentMethodsSlice = createSlice({
  name: "paymentMethods",
  initialState,
  reducers: {
    clearPostStatus(state) {
      state.postLoading = false;
      state.postError = null;
      state.postSuccess = false;
    },
    clearPatchStatus(state) {
      state.patchLoading = false;
      state.patchError = null;
      state.patchSuccess = false;
    },
    clearCurrentPaymentDetail(state) {
      state.currentPaymentDetail = null;
      state.detailLoading = false;
      state.detailError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminPaymentMethods.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminPaymentMethods.fulfilled, (state, action) => {
        state.loading = false;
        state.adminMethods = action.payload;
      })
      .addCase(fetchAdminPaymentMethods.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch payment methods";
      })
      .addCase(postUserPaymentDetail.pending, (state) => {
        state.postLoading = true;
        state.postError = null;
        state.postSuccess = false;
      })
      .addCase(postUserPaymentDetail.fulfilled, (state) => {
        state.postLoading = false;
        state.postSuccess = true;
      })
      .addCase(postUserPaymentDetail.rejected, (state, action) => {
        state.postLoading = false;
        state.postError = action.payload ?? null;
        state.postSuccess = false;
      })
      .addCase(fetchUserPaymentDetails.pending, (state) => {
        state.userDetailsLoading = true;
        state.userDetailsError = null;
      })
      .addCase(fetchUserPaymentDetails.fulfilled, (state, action) => {
        state.userDetailsLoading = false;
        state.userPaymentDetails = action.payload;
      })
      .addCase(fetchUserPaymentDetails.rejected, (state, action) => {
        state.userDetailsLoading = false;
        state.userDetailsError = action.payload ?? null;
      })
      .addCase(fetchUserPaymentDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchUserPaymentDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentPaymentDetail = action.payload;
      })
      .addCase(fetchUserPaymentDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload ?? null;
      })
      .addCase(deleteUserPaymentDetail.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteUserPaymentDetail.fulfilled, (state) => {
        state.deleteLoading = false;
      })
      .addCase(deleteUserPaymentDetail.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload ?? null;
      })
      .addCase(fetchPublicPaymentMethods.pending, (state) => {
        // Only show the loading spinner when we have no data yet
        if (!state.publicPaymentMethods || (state.publicPaymentMethods as any[]).length === 0) {
          state.publicMethodsLoading = true;
        }
        state.publicMethodsError = null;
      })
      .addCase(fetchPublicPaymentMethods.fulfilled, (state, action) => {
        state.publicMethodsLoading = false;
        state.publicPaymentMethods = action.payload;
        state.publicMethodsLastFetchedAt = Date.now();
      })
      .addCase(fetchPublicPaymentMethods.rejected, (state, action) => {
        state.publicMethodsLoading = false;
        state.publicMethodsError = action.payload ?? null;
      })
      .addCase(patchUserPaymentDetail.pending, (state) => {
        state.patchLoading = true;
        state.patchError = null;
        state.patchSuccess = false;
      })
      .addCase(patchUserPaymentDetail.fulfilled, (state) => {
        state.patchLoading = false;
        state.patchSuccess = true;
      })
      .addCase(patchUserPaymentDetail.rejected, (state, action) => {
        state.patchLoading = false;
        state.patchError = action.payload ?? null;
        state.patchSuccess = false;
      })
      .addCase(sendPaymentDetailEditOtp.fulfilled, () => { })
      .addCase(sendPaymentDetailEditOtp.rejected, () => { })
      .addCase(updatePaymentDetailWithOtp.pending, (state) => {
        state.patchLoading = true;
        state.patchError = null;
        state.patchSuccess = false;
      })
      .addCase(updatePaymentDetailWithOtp.fulfilled, (state) => {
        state.patchLoading = false;
        state.patchSuccess = true;
      })
      .addCase(updatePaymentDetailWithOtp.rejected, (state, action) => {
        state.patchLoading = false;
        state.patchError = action.payload ?? null;
        state.patchSuccess = false;
      });
  },
});

export const { clearPostStatus, clearPatchStatus, clearCurrentPaymentDetail } = paymentMethodsSlice.actions;
export default paymentMethodsSlice.reducer;
