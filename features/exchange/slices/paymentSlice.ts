import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { get, post, del } from '../../../lib/apiClient';
import { EXCHANGE_ENDPOINTS } from '../api';
import { sliceCache } from '../../../lib/utils/sliceCache';
import {
  PaymentMethod,
  PaymentProvider,
  UserPaymentDetail,
  AdminPaymentDetail,
  CreatePaymentMethodData,
  CreatePaymentProviderData,
  AddUserPaymentDetailData,
} from '../types';

// Cache invalidation functions using the new system
export const invalidateAdminPaymentDetailsCache = async (): Promise<void> => {
  await sliceCache.delete('payment', 'fetchAdminPaymentDetails');
};

export const invalidateUserPaymentDetailsCache = async (): Promise<void> => {
  await sliceCache.delete('payment', 'fetchUserPaymentDetails');
};

export const invalidatePaymentMethodsCache = async (): Promise<void> => {
  await sliceCache.delete('payment', 'fetchPaymentMethods');
};

export const invalidatePaymentProvidersCache = async (): Promise<void> => {
  await sliceCache.delete('payment', 'fetchPaymentProviders');
};

export const invalidateAllPaymentCaches = async (): Promise<void> => {
  await sliceCache.clearSlice('payment');
};

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
      const data = await sliceCache.getOrSet(
        'payment',
        'fetchPaymentMethods',
        async () => {
          const response = await get<PaymentMethod[]>(EXCHANGE_ENDPOINTS.PAYMENT_METHODS);
          return response.data;
        },
        undefined, // no params
        60 * 60 * 1000 // 1 hour cache - payment methods don't change often
      );
      return data;
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
      const data = await sliceCache.getOrSet(
        'payment',
        'fetchPaymentProviders',
        async () => {
          const response = await get<PaymentProvider[]>(EXCHANGE_ENDPOINTS.PAYMENT_PROVIDERS(methodName));
          return response.data;
        },
        { methodName }, // cache based on method name
        60 * 60 * 1000 // 1 hour cache - payment providers don't change often
      );
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch payment providers');
    }
  }
);

// Fetch user payment details with caching
export const fetchUserPaymentDetails = createAsyncThunk<UserPaymentDetail[], boolean | undefined>(
  'payment/fetchUserPaymentDetails',
  async (forceRefresh = false, { rejectWithValue }) => {
    try {
      // If forcing refresh, delete cache first
      if (forceRefresh) {
        await sliceCache.delete('payment', 'fetchUserPaymentDetails');
      }

      const data = await sliceCache.getOrSet(
        'payment',
        'fetchUserPaymentDetails',
        async () => {
          console.log('Fetching user payment details from API');
          const response = await get<UserPaymentDetail[]>(EXCHANGE_ENDPOINTS.USER_PAYMENT_DETAILS);
          return response.data;
        },
        undefined, // no params
        5 * 60 * 1000 // 5 minutes cache - user payment details change more frequently
      );
      
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user payment details');
    }
  }
);

// Fetch admin payment details with caching
export const fetchAdminPaymentDetails = createAsyncThunk<AdminPaymentDetail[], boolean | undefined>(
  'payment/fetchAdminPaymentDetails',
  async (forceRefresh = false, { rejectWithValue }) => {
    try {
      // If forcing refresh, delete cache first
      if (forceRefresh) {
        await sliceCache.delete('payment', 'fetchAdminPaymentDetails');
      }

      const data = await sliceCache.getOrSet(
        'payment',
        'fetchAdminPaymentDetails',
        async () => {
          console.log('Fetching admin payment details from API');
          const response = await get<AdminPaymentDetail[]>(EXCHANGE_ENDPOINTS.ADMIN_PAYMENT_DETAILS);
          return response.data;
        },
        undefined, // no params
        5 * 60 * 1000 // 5 minutes cache - admin payment details change more frequently
      );
      
      return data;
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
      
      // Invalidate user payment details cache since we added new data
      await sliceCache.delete('payment', 'fetchUserPaymentDetails');
      
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
      
      // Invalidate user payment details cache since we deleted data
      await sliceCache.delete('payment', 'fetchUserPaymentDetails');
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
