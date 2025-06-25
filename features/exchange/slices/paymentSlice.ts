import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { get, post, del } from '../../../lib/apiClient';
import { EXCHANGE_ENDPOINTS } from '../api';
import {
  PaymentMethod,
  PaymentProvider,
  UserPaymentDetail,
  AdminPaymentDetail,
  CreatePaymentMethodData,
  CreatePaymentProviderData,
  AddUserPaymentDetailData,
} from '../types';

interface PaymentState {
  paymentMethods: PaymentMethod[];
  paymentProviders: PaymentProvider[];
  userPaymentDetails: UserPaymentDetail[];
  adminPaymentDetails: AdminPaymentDetail[];
  loading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  paymentMethods: [],
  paymentProviders: [],
  userPaymentDetails: [],
  adminPaymentDetails: [],
  loading: false,
  error: null,
};

// Fetch payment methods
export const fetchPaymentMethods = createAsyncThunk<PaymentMethod[]>(
  'payment/fetchPaymentMethods',
  async (_, { rejectWithValue }) => {
    try {
      const response = await get<PaymentMethod[]>(EXCHANGE_ENDPOINTS.PAYMENT_METHODS);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch payment methods');
    }
  }
);

// Fetch payment providers by method name
export const fetchPaymentProviders = createAsyncThunk<PaymentProvider[], string>(
  'payment/fetchPaymentProviders',
  async (methodName, { rejectWithValue }) => {
    try {
      const response = await get<PaymentProvider[]>(EXCHANGE_ENDPOINTS.PAYMENT_PROVIDERS(methodName));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch payment providers');
    }
  }
);

// Fetch user payment details
export const fetchUserPaymentDetails = createAsyncThunk<UserPaymentDetail[]>(
  'payment/fetchUserPaymentDetails',
  async (_, { rejectWithValue }) => {
    try {
      const response = await get<UserPaymentDetail[]>(EXCHANGE_ENDPOINTS.USER_PAYMENT_DETAILS);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user payment details');
    }
  }
);

// Fetch admin payment details
export const fetchAdminPaymentDetails = createAsyncThunk<AdminPaymentDetail[]>(
  'payment/fetchAdminPaymentDetails',
  async (_, { rejectWithValue }) => {
    try {
      const response = await get<AdminPaymentDetail[]>(EXCHANGE_ENDPOINTS.ADMIN_PAYMENT_DETAILS);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch admin payment details');
    }
  }
);

// Add user payment detail
export const addUserPaymentDetail = createAsyncThunk<UserPaymentDetail, AddUserPaymentDetailData>(
  'payment/addUserPaymentDetail',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await post<UserPaymentDetail>(EXCHANGE_ENDPOINTS.USER_PAYMENT_DETAILS, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add user payment detail');
    }
  }
);

export const deleteUserPaymentDetail = createAsyncThunk<void, number>(
  'payment/deleteUserPaymentDetail',
  async (paymentDetailId, { rejectWithValue }) => {
    try {
      await del(`${EXCHANGE_ENDPOINTS.USER_PAYMENT_DETAILS}${paymentDetailId}/`);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete payment detail');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Payment Methods
      .addCase(fetchPaymentMethods.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentMethods.fulfilled, (state, action: PayloadAction<PaymentMethod[]>) => {
        state.loading = false;
        state.paymentMethods = action.payload;
      })
      .addCase(fetchPaymentMethods.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Payment Providers
      .addCase(fetchPaymentProviders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentProviders.fulfilled, (state, action: PayloadAction<PaymentProvider[]>) => {
        state.loading = false;
        state.paymentProviders = action.payload;
      })
      .addCase(fetchPaymentProviders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // User Payment Details
      .addCase(fetchUserPaymentDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPaymentDetails.fulfilled, (state, action: PayloadAction<UserPaymentDetail[]>) => {
        state.loading = false;
        state.userPaymentDetails = action.payload;
      })
      .addCase(fetchUserPaymentDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Admin Payment Details
      .addCase(fetchAdminPaymentDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminPaymentDetails.fulfilled, (state, action: PayloadAction<AdminPaymentDetail[]>) => {
        state.loading = false;
        state.adminPaymentDetails = action.payload;
      })
      .addCase(fetchAdminPaymentDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add User Payment Detail
      .addCase(addUserPaymentDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUserPaymentDetail.fulfilled, (state, action: PayloadAction<UserPaymentDetail>) => {
        state.loading = false;
        state.userPaymentDetails.push(action.payload);
      })
      .addCase(addUserPaymentDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default paymentSlice.reducer;
