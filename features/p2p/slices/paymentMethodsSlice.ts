import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAdminPaymentDetails,
  addUserPaymentDetail,
  getUserPaymentDetails,
  deletePaymentMethod,
} from "../api";

export const fetchAdminPaymentMethods = createAsyncThunk(
  "paymentMethods/fetchAdminPaymentMethods",
  async (_, { rejectWithValue }) => {
    try {
      return await getAdminPaymentDetails();
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch payment methods");
    }
  }
);

export const postUserPaymentDetail = createAsyncThunk(
  "paymentMethods/postUserPaymentDetail",
  async (
    data: {
      account_name: string;
      account_number: string;
      payment_method_name: string;
      payment_provider_name: string;
      provider_name: string;
      wallet_address?: string | null;
    },
    { rejectWithValue }
  ) => {
    try {
      return await addUserPaymentDetail(data);
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to add payment detail");
    }
  }
);

export const fetchUserPaymentDetails = createAsyncThunk(
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

export const deleteUserPaymentDetail = createAsyncThunk(

  "paymentMethods/deleteUserPaymentDetail",
  async (id: string, { rejectWithValue }) => {
    try {
      return await deletePaymentMethod(id);
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to delete payment detail");
    }
  }
);

const paymentMethodsSlice = createSlice({
  name: "paymentMethods",
  initialState: {
    adminMethods: [],
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
  } as any,
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
        state.error = action.payload;
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
        state.postError = action.payload;
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
        state.userDetailsError = action.payload;
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
        state.deleteError = action.payload;
      });
  },
});

export const { clearPostStatus } = paymentMethodsSlice.actions;
export default paymentMethodsSlice.reducer;
