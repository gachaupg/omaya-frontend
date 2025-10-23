/**
 * authSlice.ts – auto‑generated placeholder
 */
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import {
  User,
  AuthTokens,
  RegisterPayload,
  LoginPayload,
  Login2FAPayload,
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
import { storage } from "../utils/storage";
import { cookieUtils } from "@/lib/utils/cookieUtils";

const initialState: AuthState = {
  user: null,
  tokens: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  profile: null,
  kycModalOpen: false,
  twoFAModalOpen: false,
  twoFAEmail: "",
  twoFAPassword: "",
};

// Helper to handle API errors
const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (data && typeof data === "object") {
      const messages: string[] = [];
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          messages.push(...value);
        } else if (typeof value === "string") {
          messages.push(value);
        }
      });
      if (messages.length > 0) {
        return messages.join("\n");
      }
    }
    return (
      data?.message ||
      data?.error ||
      data?.details ||
      data?.non_field_errors ||
      error.message ||
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
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response = await post<AuthResponse>(API_ENDPOINTS.LOGIN, payload);

      // Check if 2FA is required
      if (response.data.require_2fa) {
        // Dispatch action to open 2FA modal with credentials
        dispatch(
          open2FAModal({ email: payload.email, password: payload.password })
        );
        // Return a special response to indicate 2FA is needed
        return { ...response.data, require_2fa: true };
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const loginWith2FA = createAsyncThunk<AuthResponse, Login2FAPayload>(
  "auth/loginWith2FA",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await post<AuthResponse>(
        API_ENDPOINTS.LOGIN_2FA,
        payload
      );
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
      // If kyc_images are provided, send as FormData
      if (payload.kyc_images && payload.kyc_images.length > 0) {
        const formData = new FormData();
        formData.append("user_id", payload.user_id);
        formData.append("status", payload.status.toString());

        // Add is_verified field
        if (payload.is_verified !== undefined) {
          formData.append("is_verified", payload.is_verified.toString());
        }

        if (payload.verification_method) {
          formData.append("verification_method", payload.verification_method);
        }
        if (payload.country) {
          formData.append("country", payload.country);
        }
        if (payload.document_type) {
          formData.append("document_type", payload.document_type);
        }
        if (payload.document_number) {
          formData.append("document_number", payload.document_number);
        }
        if (payload.face_data) {
          formData.append("face_data", JSON.stringify(payload.face_data));
        }
        if (payload.facial_id) {
          formData.append("facial_id", payload.facial_id);
        }

        // Append all images
        payload.kyc_images.forEach((image) => {
          if (image) {
            formData.append("kyc_images", image);
          }
        });

      

        // Send FormData
        const response = await post<{ message: string }>(
          API_ENDPOINTS.KYC_VERIFY,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        return response.data.message;
      } else {
        // Send as JSON if no images
        const response = await post<{ message: string }>(
          API_ENDPOINTS.KYC_VERIFY,
          payload
        );
        return response.data.message;
      }
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

// Enable 2FA
export const enable2FA = createAsyncThunk<any>(
  "auth/enable2FA",
  async (_, { rejectWithValue }) => {
    try {
      const response = await post<any>(API_ENDPOINTS.ENABLE_2FA, {});
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Verify 2FA setup
export const verify2FASetup = createAsyncThunk<any, { code: string }>(
  "auth/verify2FASetup",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await post<any>(API_ENDPOINTS.VERIFY_2FA_SETUP, payload);
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
      storage.removeProfile();
      // Clear access token cookie
      cookieUtils.removeCookie("access_token");

      // Broadcast logout to other tabs
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("logoutTriggered"));
      }
    },
    clearError(state) {
      state.error = null;
    },
    initializeAuth(state) {
      const authData = storage.getProfile();
      if (authData) {
        state.user = authData.user;
        state.tokens = authData.tokens;
        state.isAuthenticated = true;
        state.profile = authData.profile || null;
      }
    },
    openKYCModal(state) {
      state.kycModalOpen = true;
    },
    closeKYCModal(state) {
      state.kycModalOpen = false;
    },
    open2FAModal(
      state,
      action: PayloadAction<{ email: string; password: string }>
    ) {
      state.twoFAModalOpen = true;
      state.twoFAEmail = action.payload.email;
      state.twoFAPassword = action.payload.password;
    },
    close2FAModal(state) {
      state.twoFAModalOpen = false;
      state.twoFAEmail = "";
      state.twoFAPassword = "";
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

        // If 2FA is required, don't authenticate yet
        if (action.payload.require_2fa) {
          return;
        }

        state.user = action.payload.user;
        state.tokens = {
          access: action.payload.access,
          refresh: action.payload.refresh,
        };
        state.isAuthenticated = true;
        state.profile = action.payload.profile;

        // Store in localStorage
        storage.setProfile({
          user: action.payload.user,
          tokens: {
            access: action.payload.access,
            refresh: action.payload.refresh,
          },
          profile: action.payload.profile,
        });

        // Set access token as cookie
        cookieUtils.setCookie("access_token", action.payload.access, {
          maxAge: 86400,
          secure: true,
          sameSite: "strict",
        });
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

    // Login with 2FA
    builder.addCase(loginWith2FA.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      loginWith2FA.fulfilled,
      (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.tokens = {
          access: action.payload.access,
          refresh: action.payload.refresh,
        };
        state.isAuthenticated = true;
        state.profile = action.payload.profile;
        state.twoFAModalOpen = false;
        state.twoFAEmail = "";
        state.twoFAPassword = "";

        // Store in localStorage
        storage.setProfile({
          user: action.payload.user,
          tokens: {
            access: action.payload.access,
            refresh: action.payload.refresh,
          },
          profile: action.payload.profile,
        });

        // Set access token as cookie
        cookieUtils.setCookie("access_token", action.payload.access, {
          maxAge: 86400,
          secure: true,
          sameSite: "strict",
        });
      }
    );
    builder.addCase(loginWith2FA.rejected, (state, action) => {
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
  open2FAModal,
  close2FAModal,
} = authSlice.actions;
export default authSlice.reducer;
