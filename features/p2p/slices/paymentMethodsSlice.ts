import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAdminPaymentDetails,
  addUserPaymentDetail,
  getUserPaymentDetails,
  deletePaymentMethod,
  getPublicPaymentMethods,
  updateUserPaymentDetail,
  getUserPaymentDetail,
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

export const fetchPublicPaymentMethods = createAsyncThunk<
  any,
  void,
  { rejectValue: string }
>(
  "paymentMethods/fetchPublicPaymentMethods",
  async (_, { rejectWithValue }) => {
    try {
      return await getPublicPaymentMethods();
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch public payment methods");
    }
  }
);

const extractPaymentDetailError = (error: any): string => {
  const fallbackMessage = "Failed to operate on payment detail";

  if (!error) return fallbackMessage;

  // 1. Try to get the data from the response
  const responseData = error?.response?.data ?? error?.data ?? null;
  console.log("🔥 [PaymentMethods] Raw Error:", error);
  console.log("🔥 [PaymentMethods] Response Data:", responseData);

  // 2. If data is a simple string, return it
  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  // 3. If data is an object, look for known error keys
  if (responseData && typeof responseData === "object") {
    // Check for specific field errors first (like allow_auto_send)
    const allowAutoSendError = responseData.allow_auto_send;
    if (Array.isArray(allowAutoSendError) && allowAutoSendError.length > 0) {
      const message = allowAutoSendError.find(
        (item) => typeof item === "string" && item.trim()
      );
      if (message) return message;
    }

    // Check common error keys: "detail", "message", "error"
    const errorKeys = ["detail", "message", "error"];
    for (const key of errorKeys) {
      const value = responseData[key];
      
      // Case A: Value is a string (e.g. { error: "Cannot delete..." })
      if (typeof value === "string" && value.trim()) {
        return value;
      }
      
      // Case B: Value is an array of strings (e.g. { error: ["Invalid id"] })
      if (Array.isArray(value) && value.length > 0) {
        const message = value.find((item) => typeof item === "string" && item.trim());
        if (message) return message;
      }
      
      // Case C: Value is an object (unexpected but possible) -> Try to stringify or get message from it
      if (value && typeof value === 'object' && !Array.isArray(value)) {
         if (value.message && typeof value.message === 'string') return value.message;
         if (value.detail && typeof value.detail === 'string') return value.detail;
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

export const fetchUserPaymentDetails = createAsyncThunk<
  P2PResponse[],
  void,
  { rejectValue: string }
>(
  "paymentMethods/fetchUserPaymentDetails",
  async (_, { rejectWithValue }) => {
    try {
      return await getUserPaymentDetails();
    } catch (err: any) {
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
        state.publicMethodsLoading = true;
        state.publicMethodsError = null;
      })
      .addCase(fetchPublicPaymentMethods.fulfilled, (state, action) => {
        state.publicMethodsLoading = false;
        state.publicPaymentMethods = action.payload;
        console.log("🎯 Redux: Public payment methods stored:", action.payload);
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
      .addCase(sendPaymentDetailEditOtp.fulfilled, () => {})
      .addCase(sendPaymentDetailEditOtp.rejected, () => {})
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
