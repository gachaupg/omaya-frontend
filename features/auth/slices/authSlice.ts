/**
 * authSlice.ts – auto‑generated placeholder
 */
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
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
  KYCResponse,
  KYCVerifyPayload,
  SumSubInitiatePayload,
  SumSubInitiateResponse,
  SumSubTokenPayload,
  SumSubTokenResponse,
  ApiError,
  UserProfile,
  ProfileResponse,
} from "../types";
import { API_ENDPOINTS } from "../api";
import { post, get, AxiosError } from "../../../lib/apiClient";

const initialState: AuthState = {
  user: null,
  tokens: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  profile: null,
  kycModalOpen: false,
};

// Helper to handle API errors
const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.data?.details ||
      error.response?.data?.email ||
      "An error occurred"
    );
  }
  return "An unexpected error occurred";
};

// Async thunks
export const registerUser = createAsyncThunk<RegisterResponse, RegisterPayload>(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await post<RegisterResponse>(
        API_ENDPOINTS.REGISTER,
        payload
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const loginUser = createAsyncThunk<AuthResponse, LoginPayload>(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await post<AuthResponse>(API_ENDPOINTS.LOGIN, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const checkKYCStatus = createAsyncThunk<KYCResponse>(
  "auth/checkKYCStatus",
  async (_, { rejectWithValue }) => {
    try {
      const response = await get<KYCResponse>(API_ENDPOINTS.KYC);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const initiateKYCVerification = createAsyncThunk<
  SumSubInitiateResponse,
  SumSubInitiatePayload
>("auth/initiateKYCVerification", async (payload, { rejectWithValue }) => {
  try {
    const response = await post<SumSubInitiateResponse>(
      API_ENDPOINTS.SUMSUB_INITIATE,
      payload
    );
    return response.data;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const getSumSubToken = createAsyncThunk<
  SumSubTokenResponse,
  SumSubTokenPayload
>("auth/getSumSubToken", async (payload, { rejectWithValue }) => {
  try {
    const response = await post<SumSubTokenResponse>(
      API_ENDPOINTS.SUMSUB_TOKEN,
      payload
    );
    return response.data;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const verifyKYCStatus = createAsyncThunk<string, KYCVerifyPayload>(
  "auth/verifyKYCStatus",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await post<{ message: string }>(
        API_ENDPOINTS.KYC_VERIFY,
        payload
      );
      return response.data.message;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const forgotPassword = createAsyncThunk<string, ForgotPasswordPayload>(
  "auth/forgotPassword",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await post<{ message: string }>(
        API_ENDPOINTS.FORGOT_PASSWORD,
        payload
      );
      return response.data.message;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const resetPassword = createAsyncThunk<string, ResetPasswordPayload>(
  "auth/resetPassword",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await post<{ message: string }>(
        API_ENDPOINTS.RESET_PASSWORD,
        payload
      );
      return response.data.message;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const verifyOTP = createAsyncThunk<OTPResponse, OTPPayload>(
  "auth/verifyOTP",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await post<OTPResponse>(
        API_ENDPOINTS.VERIFY_OTP,
        payload
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const getUserProfile = createAsyncThunk<ProfileResponse>(
  "auth/getUserProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await get<ProfileResponse>(API_ENDPOINTS.PROFILE);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.profile = null;
      state.kycModalOpen = false;
      localStorage.removeItem("profile");
      // Clear access token cookie
      document.cookie =
        "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict";
    },
    clearError(state) {
      state.error = null;
    },
    initializeAuth(state) {
      const authData = localStorage.getItem("profile");
      if (authData) {
        const parsedData = JSON.parse(authData);
        state.user = parsedData.user;
        state.tokens = parsedData.tokens;
        state.isAuthenticated = true;
        state.profile = parsedData.profile || null;
      }
    },
    openKYCModal(state) {
      state.kycModalOpen = true;
    },
    closeKYCModal(state) {
      state.kycModalOpen = false;
    },
  },
  extraReducers: (builder) => {
    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      registerUser.fulfilled,
      (state, action: PayloadAction<RegisterResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = false; // User not authenticated until email verification
      }
    );
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      loginUser.fulfilled,
      (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.tokens = {
          access: action.payload.access,
          refresh: action.payload.refresh,
        };
        state.isAuthenticated = true;
        state.profile = action.payload.profile;

        // Store in localStorage
        localStorage.setItem(
          "profile",
          JSON.stringify({
            user: action.payload.user,
            tokens: {
              access: action.payload.access,
              refresh: action.payload.refresh,
            },
            profile: action.payload.profile,
          })
        );

        // Set access token as cookie
        document.cookie = `access_token=${action.payload.access}; path=/; max-age=86400; secure; samesite=strict`;
      }
    );
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Check KYC Status
    builder.addCase(checkKYCStatus.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      checkKYCStatus.fulfilled,
      (state, action: PayloadAction<KYCResponse>) => {
        state.loading = false;
        if (state.user) {
          state.user.is_verified = action.payload.is_verified;
          // Show KYC modal if user is not verified
          if (!action.payload.is_verified) {
            state.kycModalOpen = true;
          }
        }
      }
    );
    builder.addCase(checkKYCStatus.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Initiate KYC Verification
    builder.addCase(initiateKYCVerification.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(initiateKYCVerification.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(initiateKYCVerification.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Get SumSub Token
    builder.addCase(getSumSubToken.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getSumSubToken.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(getSumSubToken.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Verify KYC Status
    builder.addCase(verifyKYCStatus.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(verifyKYCStatus.fulfilled, (state) => {
      state.loading = false;
      if (state.user) {
        state.user.is_verified = true;
      }
      state.kycModalOpen = false;
    });
    builder.addCase(verifyKYCStatus.rejected, (state, action) => {
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
    builder.addCase(
      verifyOTP.fulfilled,
      (state, action: PayloadAction<OTPResponse>) => {
        state.loading = false;
        if (state.user) {
          state.user.otp_verified = action.payload.user.otp_verified;
        }
      }
    );
    builder.addCase(verifyOTP.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Get User Profile
    builder.addCase(getUserProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      getUserProfile.fulfilled,
      (state, action: PayloadAction<ProfileResponse>) => {
        state.loading = false;
        state.profile = action.payload.profile;
      }
    );
    builder.addCase(getUserProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const {
  logout,
  clearError,
  initializeAuth,
  openKYCModal,
  closeKYCModal,
} = authSlice.actions;
export default authSlice.reducer;
