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

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_KEYS = {
  ADMIN_PAYMENT_DETAILS: 'admin_payment_details_cache',
  USER_PAYMENT_DETAILS: 'user_payment_details_cache',
};

// Cache utility functions
const getCachedData = <T>(key: string): { data: T; timestamp: number; expiresAt: number } | null => {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.expiresAt > Date.now()) {
        return parsed;
      } else {
        // Cache expired, remove it
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn('Failed to parse cached data:', error);
    localStorage.removeItem(key);
  }
  return null;
};

const setCachedData = <T>(key: string, data: T): void => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION,
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
};

// Cache invalidation functions
export const invalidateAdminPaymentDetailsCache = (): void => {
  localStorage.removeItem(CACHE_KEYS.ADMIN_PAYMENT_DETAILS);
};

export const invalidateUserPaymentDetailsCache = (): void => {
  localStorage.removeItem(CACHE_KEYS.USER_PAYMENT_DETAILS);
};

export const invalidateAllPaymentCaches = (): void => {
  invalidateAdminPaymentDetailsCache();
  invalidateUserPaymentDetailsCache();
};

interface PaymentState {
  paymentMethods: PaymentMethod[];
  paymentProviders: PaymentProvider[];
  userPaymentDetails: UserPaymentDetail[];
  adminPaymentDetails: AdminPaymentDetail[];
  loading: boolean;
  error: string | null;
  // Cache metadata
  cache: {
    adminPaymentDetails: {
      data: AdminPaymentDetail[];
      timestamp: number;
      expiresAt: number;
    } | null;
    userPaymentDetails: {
      data: UserPaymentDetail[];
      timestamp: number;
      expiresAt: number;
    } | null;
  };
}

const initialState: PaymentState = {
  paymentMethods: [],
  paymentProviders: [],
  userPaymentDetails: [],
  adminPaymentDetails: [],
  loading: false,
  error: null,
  cache: {
    adminPaymentDetails: null,
    userPaymentDetails: null,
  },
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

// Fetch user payment details with caching
export const fetchUserPaymentDetails = createAsyncThunk<UserPaymentDetail[], boolean | undefined>(
  'payment/fetchUserPaymentDetails',
  async (forceRefresh = false, { rejectWithValue }) => {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cached = getCachedData<UserPaymentDetail[]>(CACHE_KEYS.USER_PAYMENT_DETAILS);
        if (cached) {
          console.log('Using cached user payment details');
          return cached.data;
        }
      }

      // Fetch from API
      console.log('Fetching user payment details from API');
      const response = await get<UserPaymentDetail[]>(EXCHANGE_ENDPOINTS.USER_PAYMENT_DETAILS);
      
      // Cache the response
      setCachedData(CACHE_KEYS.USER_PAYMENT_DETAILS, response.data);
      
      return response.data;
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
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cached = getCachedData<AdminPaymentDetail[]>(CACHE_KEYS.ADMIN_PAYMENT_DETAILS);
        if (cached) {
          console.log('Using cached admin payment details');
          return cached.data;
        }
      }

      // Fetch from API
      console.log('Fetching admin payment details from API');
      const response = await get<AdminPaymentDetail[]>(EXCHANGE_ENDPOINTS.ADMIN_PAYMENT_DETAILS);
      
      // Cache the response
      setCachedData(CACHE_KEYS.ADMIN_PAYMENT_DETAILS, response.data);
      
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
        // Update cache metadata
        state.cache.userPaymentDetails = {
          data: action.payload,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_DURATION,
        };
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
        // Update cache metadata
        state.cache.adminPaymentDetails = {
          data: action.payload,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_DURATION,
        };
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
        // Invalidate cache since we added new data
        state.cache.userPaymentDetails = null;
      })
      .addCase(addUserPaymentDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default paymentSlice.reducer;
