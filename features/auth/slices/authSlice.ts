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
  PhoneSendOTPPayload,
  PhoneSendOTPResponse,
  PhoneVerifyOTPPayload,
  PhoneVerifyOTPResponse,
} from "../types";
import { API_ENDPOINTS } from "../api";
import { post, get, AxiosError } from "../../../lib/apiClient";
import { storage } from "../utils/storage";
import { cookieUtils } from "@/lib/utils/cookieUtils";

const CROSS_TAB_LOGOUT_FLAG = "__omayaCrossTabLogout";
const KYC_STATUS_CACHE_TTL_MS = 5 * 60 * 1000;

const initialState: AuthState = {
  user: null,
  tokens: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  profile: null,
  kycStatusCheckedAt: null,
  kycStatusLoading: false,
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

const getSuspensionMessage = (user?: User | null): string | null => {
  if (!user?.is_suspended) return null;
  const reason = user?.suspension_details?.reason?.trim();
  return reason
    ? `Your account is suspended. Reason: ${reason}`
    : "Your account is suspended. Please contact support.";
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
      // Check if error has field-specific validation errors
      if (error instanceof AxiosError && error.response?.data) {
        const data = error.response.data;
        // Preserve object structure for field errors (arrays or strings)
        if (typeof data === "object" && data !== null && !Array.isArray(data) && Object.keys(data).length > 0) {
          const hasFieldErrors = Object.values(data).some(
            (value) =>
              (Array.isArray(value) && value.length > 0) ||
              (typeof value === "string" && value.trim().length > 0)
          );
          if (hasFieldErrors) {
            return rejectWithValue(data);
          }
        }
      }
      // Otherwise, use the string format
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const loginUser = createAsyncThunk<AuthResponse, LoginPayload>(
  "auth/login",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response = await post<AuthResponse>(API_ENDPOINTS.LOGIN, payload);
      const suspensionMessage = getSuspensionMessage(response.data?.user);
      if (suspensionMessage) {
        return rejectWithValue(suspensionMessage);
      }

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
      const suspensionMessage = getSuspensionMessage(response.data?.user);
      if (suspensionMessage) {
        return rejectWithValue(suspensionMessage);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const checkKYCStatus = createAsyncThunk<
  KYCResponse,
  boolean | undefined,
  { state: { auth: AuthState } }
>(
  "auth/checkKYCStatus",
  async (forceRefresh = false, { rejectWithValue, getState }) => {
    try {
      const state = getState().auth;
      const now = Date.now();
      const cachedIsVerified = state.user?.is_verified === true;
      const hasFreshCachedStatus =
        !forceRefresh &&
        cachedIsVerified &&
        !!state.user &&
        typeof state.kycStatusCheckedAt === "number" &&
        now - state.kycStatusCheckedAt < KYC_STATUS_CACHE_TTL_MS;

      if (hasFreshCachedStatus) {
        return { is_verified: Boolean(state.user!.is_verified) };
      }

      const response = await get<KYCResponse>(API_ENDPOINTS.KYC);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    } 
  },
  {
    condition: (forceRefresh = false, { getState }) => {
      const state = getState() as { auth: AuthState };
      // Avoid duplicate in-flight KYC requests unless explicitly forced.
      if (!forceRefresh && state.auth.kycStatusLoading) {
        return false;
      }
      return true;
    },
  }
);

// Phone verification - Send OTP
export const sendPhoneOTP = createAsyncThunk<
  PhoneSendOTPResponse,
  PhoneSendOTPPayload
>("auth/sendPhoneOTP", async (_payload, { rejectWithValue }) => {
  try {
    const response = await post<PhoneSendOTPResponse>(
      API_ENDPOINTS.KYC_EMAIL_SEND_OTP || API_ENDPOINTS.KYC_PHONE_SEND_OTP,
      undefined
    );
    return response.data;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

// Phone verification - Verify OTP
export const verifyPhoneOTP = createAsyncThunk<
  PhoneVerifyOTPResponse,
  PhoneVerifyOTPPayload
>("auth/verifyPhoneOTP", async (payload, { rejectWithValue }) => {
  try {
    const response = await post<PhoneVerifyOTPResponse>(
      API_ENDPOINTS.KYC_EMAIL_VERIFY_OTP || API_ENDPOINTS.KYC_PHONE_VERIFY_OTP,
      payload
    );
    return response.data;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

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
  async (_payload, { rejectWithValue }) => {
    // KYC verify POST disabled - backend returns 403 Forbidden
    return rejectWithValue("KYC verification is currently unavailable.");
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
    setCredentials: (state, action: PayloadAction<{
      user: User | null;
      tokens: { access: string; refresh: string } | null;
      isAuthenticated: boolean;
    }>) => {
      const { user, tokens, isAuthenticated } = action.payload;
      state.user = user;
      state.tokens = tokens;
      state.isAuthenticated = isAuthenticated;
      
      // Persist to storage if authenticated
      if (isAuthenticated && user && tokens) {
        storage.setProfile({
          user,
          tokens,
          profile: state.profile || undefined
        });
        
        if (typeof window !== "undefined") {
          if (tokens.access) {
            localStorage.setItem("access_token", tokens.access);
          }
          if (tokens.refresh) {
            localStorage.setItem("refresh_token", tokens.refresh);
          }
        }
        
        cookieUtils.setCookie("access_token", tokens.access, {
          maxAge: 86400,
          secure: true,
          sameSite: "strict",
        });
      }
    },
    updateUser: (
      state,
      action: PayloadAction<{ email?: string; phone_number?: string }>
    ) => {
      if (!state.user) return;
      const { email, phone_number } = action.payload;
      if (email !== undefined) state.user.email = email;
      if (phone_number !== undefined) state.user.phone_number = phone_number;
      if (typeof window !== "undefined" && state.user) {
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
    updateTokens: (
      state,
      action: PayloadAction<{ access?: string; refresh?: string }>
    ) => {
      if (!state.tokens && !state.user) {
        return;
      }

      const nextTokens: AuthTokens = {
        access: action.payload.access || state.tokens?.access || "",
        refresh: action.payload.refresh || state.tokens?.refresh || "",
      };

      state.tokens = nextTokens;

      if (state.user) {
        storage.setProfile({
          user: state.user,
          tokens: nextTokens,
          profile: state.profile || undefined,
        });
      }

      if (typeof window !== "undefined") {
        if (action.payload.access) {
          localStorage.setItem("access_token", action.payload.access);
        }
        if (action.payload.refresh) {
          localStorage.setItem("refresh_token", action.payload.refresh);
        }
      }

      if (action.payload.access) {
        cookieUtils.setCookie("access_token", action.payload.access, {
          maxAge: 86400,
          secure: true,
          sameSite: "strict",
        });
      }
    },
    logout(state) {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.profile = null;
      state.kycStatusCheckedAt = null;
      state.kycStatusLoading = false;
      state.kycModalOpen = false;
      state.twoFAModalOpen = false;
      storage.removeProfile();
      // Clear access token cookie
      cookieUtils.removeCookie("access_token");

      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        // Don't clear p2p_terms_accepted on logout - it should persist across sessions
        // Terms acceptance is user-specific and should remain accepted
      }

      // Clear all cached data on logout
      if (typeof window !== "undefined") {
        import("@/lib/utils/sliceCache").then(({ sliceCache }) => {
          sliceCache.clear().catch(() => {
            // Silent fail if cache clear fails
          });
        });
      }

      // Broadcast logout to other tabs unless we're already handling a cross-tab logout
      if (typeof window !== "undefined") {
        const shouldBroadcast = !(window as typeof window & Record<string, any>)[
          CROSS_TAB_LOGOUT_FLAG
        ];

        if (shouldBroadcast) {
          window.dispatchEvent(new CustomEvent("logoutTriggered"));
        } else {
          delete (window as typeof window & Record<string, any>)[
            CROSS_TAB_LOGOUT_FLAG
          ];
        }
      }
    },
    clearError(state) {
      state.error = null;
    },
    initializeAuth(state) {
      // Ensure loading is set to false when initializing
      state.loading = false;
      state.error = null;
      
      const authData = storage.getProfile();
      
      // Valid auth requires BOTH token AND user data
      if (authData && authData.tokens?.access && authData.user) {
        const suspensionMessage = getSuspensionMessage(authData.user);
        if (suspensionMessage) {
          state.user = null;
          state.tokens = null;
          state.isAuthenticated = false;
          state.profile = null;
          state.error = suspensionMessage;
          storage.removeProfile();
          cookieUtils.removeCookie("access_token");
          if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user");
          }
          return;
        }
        state.user = authData.user;
        state.tokens = authData.tokens;
        state.isAuthenticated = true;
        state.profile = authData.profile || null;
        
        // Ensure access_token is in localStorage for WebSocket
        if (typeof window !== 'undefined' && authData.tokens?.access) {
          const storedToken = localStorage.getItem('access_token');
          if (!storedToken) {
            localStorage.setItem('access_token', authData.tokens.access);
          }
          if (authData.tokens.refresh) {
            const storedRefresh = localStorage.getItem('refresh_token');
            if (!storedRefresh) {
              localStorage.setItem('refresh_token', authData.tokens.refresh);
            }
          }
          // Ensure user is in localStorage
          const storedUser = localStorage.getItem('user');
          if (!storedUser && authData.user) {
            localStorage.setItem('user', JSON.stringify(authData.user));
          }
        }
      } else {
        // Check if we have tokens in localStorage as fallback (might be in transition)
        if (typeof window !== 'undefined') {
          const accessToken = localStorage.getItem('access_token');
          const refreshToken = localStorage.getItem('refresh_token');
          const userData = localStorage.getItem('user');
          
          // If we have all three, try to restore the profile
          if (accessToken && userData) {
            try {
              const user = JSON.parse(userData);
              const suspensionMessage = getSuspensionMessage(user);
              if (suspensionMessage) {
                state.user = null;
                state.tokens = null;
                state.isAuthenticated = false;
                state.profile = null;
                state.error = suspensionMessage;
                storage.removeProfile();
                cookieUtils.removeCookie("access_token");
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                localStorage.removeItem("user");
                return;
              }
              const tokens = {
                access: accessToken,
                refresh: refreshToken || '',
              };
              
              // Restore profile
              storage.setProfile({ user, tokens });
              
              // Update state
              state.user = user;
              state.tokens = tokens;
              state.isAuthenticated = true;
              state.profile = null;
              return;
            } catch (e) {
              console.error('Error restoring auth from localStorage:', e);
            }
          }
        }
        
        // Only clear if we're not on an auth page (user might be logging in)
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        const isAuthPage = currentPath.startsWith('/auth/') || 
                          currentPath === '/' ||
                          currentPath.includes('/about') ||
                          currentPath.includes('/contact');
        
        if (!isAuthPage) {
          // Invalid/incomplete profile - trigger automatic logout
          state.user = null;
          state.tokens = null;
          state.isAuthenticated = false;
          state.profile = null;
          state.loading = false;
          
          // Clear ALL localStorage and cookies (but preserve p2p_act)
          if (typeof window !== 'undefined') {
            // Preserve p2p_act before clearing localStorage
            const p2pAct = localStorage.getItem("p2p_act");
            localStorage.clear();
            if (p2pAct) {
              localStorage.setItem("p2p_act", p2pAct);
            }
            cookieUtils.removeCookie("access_token");
            
            console.log('🔒 Invalid or incomplete profile found, redirecting to login...');
            // Use setTimeout to ensure state is updated before redirect
            setTimeout(() => {
              window.location.href = '/auth/login';
            }, 100);
          }
        } else {
          // On auth pages, just clear state but don't clear localStorage
          // (user might be in the process of logging in)
          state.user = null;
          state.tokens = null;
          state.isAuthenticated = false;
          state.profile = null;
          state.loading = false;
        }
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

        // Store tokens separately for WebSocket and easy access
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', action.payload.access);
          localStorage.setItem('refresh_token', action.payload.refresh);
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        }

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
      state.kycStatusLoading = true;
      state.error = null;
    });
    builder.addCase(
      checkKYCStatus.fulfilled,
      (state, action: PayloadAction<KYCResponse>) => {
        state.loading = false;
        state.kycStatusLoading = false;
        state.kycStatusCheckedAt = Date.now();
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
      state.kycStatusLoading = false;
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

        // Store tokens separately for easy access
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', action.payload.access);
          localStorage.setItem('refresh_token', action.payload.refresh);
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        }

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

// Export the action creators
export const {
  logout,
  clearError,
  initializeAuth,
  openKYCModal,
  closeKYCModal,
  open2FAModal,
  close2FAModal,
  setCredentials,
  updateUser,
  updateTokens,
} = authSlice.actions;
export default authSlice.reducer;
