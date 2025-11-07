import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAdminPaymentDetails,
  addUserPaymentDetail,
  getUserPaymentDetails,
  deletePaymentMethod,
  getPublicPaymentMethods,
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

export const postUserPaymentDetail = createAsyncThunk<
  unknown,
  {
    account_name: string;
    account_number: string;
    payment_method_name: string;
    payment_provider_name: string;
    provider_name: string;
    wallet_address?: string | null;
  },
  { rejectValue: string }
>(
  "paymentMethods/postUserPaymentDetail",
  async (data, { rejectWithValue }) => {
    try {
      return await addUserPaymentDetail(data);
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to add payment detail");
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
      return rejectWithValue(err.message || "Failed to delete payment detail");
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
      });
  },
});

export const { clearPostStatus } = paymentMethodsSlice.actions;
export default paymentMethodsSlice.reducer;
