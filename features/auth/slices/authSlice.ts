/**
 * authSlice.ts – auto‑generated placeholder
 */
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import {
  User,
  AuthTokens,
  RegisterPayload,
  LoginPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  AuthResponse,
  RegisterResponse,
  AuthState,
  OTPPayload,
  OTPResponse,
  ApiError
} from '../types';
import { API_ENDPOINTS } from '../api';
import { post, AxiosError } from '../../../lib/apiClient';

const initialState: AuthState = {
  user: null,
  tokens: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

// Helper to handle API errors
const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.response?.data?.error || error.response?.data?.details || error.response?.data?.email || 'An error occurred';
  }
  return 'An unexpected error occurred';
};

// Async thunks
export const registerUser = createAsyncThunk<RegisterResponse, RegisterPayload>(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await post<RegisterResponse>(API_ENDPOINTS.REGISTER, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const loginUser = createAsyncThunk<AuthResponse, LoginPayload>(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await post<AuthResponse>(API_ENDPOINTS.LOGIN, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const forgotPassword = createAsyncThunk<string, ForgotPasswordPayload>(
  'auth/forgotPassword',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await post<{ message: string }>(API_ENDPOINTS.FORGOT_PASSWORD, payload);
      return response.data.message;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const resetPassword = createAsyncThunk<string, ResetPasswordPayload>(
  'auth/resetPassword',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await post<{ message: string }>(API_ENDPOINTS.RESET_PASSWORD, payload);
      return response.data.message;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const verifyOTP = createAsyncThunk<OTPResponse, OTPPayload>(
  'auth/verifyOTP',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await post<OTPResponse>(API_ENDPOINTS.VERIFY_OTP, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      localStorage.removeItem('profile')
    },
    clearError(state) {
      state.error = null;
    },
    initializeAuth(state) {
        const authData = localStorage.getItem('profile');
        if (authData) {
          const parsedData = JSON.parse(authData);
          state.user = parsedData.user;
          state.tokens = parsedData.tokens;
          state.isAuthenticated = true;
        }
      },
  },
  extraReducers: (builder) => {
    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action: PayloadAction<RegisterResponse>) => {
      state.loading = false;
      state.user = action.payload.user;
      state.isAuthenticated = false; // User not authenticated until email verification
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
      state.loading = false;
      state.user = action.payload.user;
      state.tokens = {
        access: action.payload.access,
        refresh: action.payload.refresh,
      };
      state.isAuthenticated = true;

      localStorage.setItem('profile', JSON.stringify(
        {
            user: action.payload.user,
            tokens: {
              access: action.payload.access,
              refresh: action.payload.refresh,
            }
          }

      ))
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Forgot Password
    builder.addCase(forgotPassword.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(forgotPassword.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(forgotPassword.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Reset Password
    builder.addCase(resetPassword.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(resetPassword.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(resetPassword.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Verify OTP
    builder.addCase(verifyOTP.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(verifyOTP.fulfilled, (state, action: PayloadAction<OTPResponse>) => {
      state.loading = false;
      if (state.user) {
        state.user.is_verified = action.payload.user.is_verified;
      }
    });
    builder.addCase(verifyOTP.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { logout, clearError, initializeAuth } = authSlice.actions;
export default authSlice.reducer;