import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { logger } from '@/lib/utils/logger';

import { 
  GOOGLE_API_ENDPOINTS, 
  logGoogleOAuthResponse, 
  logGoogleOAuthError,
  debugGoogleOAuthUrls,
  GoogleOAuthResponse,
  GoogleUserInfo,
  GoogleOAuthErrorType,
  GOOGLE_OAUTH_ERROR_MESSAGES
} from "../../../utils/googleOAuthConfig";

// Types
export interface GoogleOAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: GoogleUserInfo | null;
  error: string | null;
  isRedirecting: boolean;
}

// Initial state
const initialState: GoogleOAuthState = {
  isLoading: false,
  isAuthenticated: false,
  user: null,
  error: null,
  isRedirecting: false,
};

// Async thunk to initiate Google OAuth with Django Allauth
export const initiateGoogleOAuth = createAsyncThunk(
  "googleOAuth/initiate",
  async (_, { rejectWithValue }) => {
    try {
      logger.debug('auth', "🔐 Initiating Google OAuth with Django Allauth...");
      
      // Debug URL construction
      debugGoogleOAuthUrls();
      
      // Redirect to Django Allauth Google login
      window.location.href = GOOGLE_API_ENDPOINTS.djangoLogin;
      
      return { success: true };
    } catch (error: any) {
      logger.error('auth', "❌ Failed to initiate Google OAuth:", error);
      return rejectWithValue("Failed to initiate Google OAuth");
    }
  }
);

// Async thunk to check authentication status after OAuth callback
export const checkAuthStatus = createAsyncThunk(
  "googleOAuth/checkStatus",
  async (_, { rejectWithValue }) => {
    try {
      logger.debug('auth', "🔍 Checking authentication status...");
      
      const response = await axios.get(
        GOOGLE_API_ENDPOINTS.profile,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      logger.debug('auth', "✅ Profile response received:", response.data);
      
      if (response.data && response.data.id) {
        return {
          isAuthenticated: true,
          user: response.data,
        };
      } else {
        return {
          isAuthenticated: false,
          user: null,
        };
      }
    } catch (error: any) {
      logger.debug('auth', "🔍 User not authenticated or profile check failed");
      return {
        isAuthenticated: false,
        user: null,
      };
    }
  }
);

// Async thunk to logout
export const logoutGoogle = createAsyncThunk(
  "googleOAuth/logout",
  async (_, { rejectWithValue }) => {
    try {
      logger.debug('auth', "🚪 Logging out...");
      
      // Redirect to Django Allauth logout
      window.location.href = GOOGLE_API_ENDPOINTS.djangoLogout;
      
      return { success: true };
    } catch (error: any) {
      logger.error('auth', "❌ Failed to logout:", error);
      return rejectWithValue("Failed to logout");
    }
  }
);

// Google OAuth slice
const googleOAuthSlice = createSlice({
  name: "googleOAuth",
  initialState,
  reducers: {
    // Set error
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
      logger.debug('auth', "🧹 Google OAuth error cleared");
    },

    // Reset state
    resetGoogleOAuth: (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
      state.isRedirecting = false;
      logger.debug('auth', "🔄 Google OAuth state reset");
    },

    // Set redirecting state
    setRedirecting: (state, action: PayloadAction<boolean>) => {
      state.isRedirecting = action.payload;
    },

    // Set user data (for when we get it from Django Allauth)
    setUser: (state, action: PayloadAction<GoogleUserInfo>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },

    // Log Google OAuth response
    logResponse: (state, action: PayloadAction<GoogleOAuthResponse>) => {
      logGoogleOAuthResponse(action.payload, "Google OAuth Response");
    },
  },
  extraReducers: (builder) => {
    // initiateGoogleOAuth
    builder.addCase(initiateGoogleOAuth.pending, (state) => {
      state.isLoading = true;
      state.isRedirecting = true;
      state.error = null;
      logger.debug('auth', "⏳ Initiating Google OAuth...");
    });

    builder.addCase(initiateGoogleOAuth.fulfilled, (state) => {
      state.isLoading = false;
      state.isRedirecting = true; // Keep redirecting true since we're redirecting
      logger.debug('auth', "✅ Google OAuth initiated, redirecting...");
    });

    builder.addCase(initiateGoogleOAuth.rejected, (state, action) => {
      state.isLoading = false;
      state.isRedirecting = false;
      state.error = action.payload as string;
    });

    // checkAuthStatus
    builder.addCase(checkAuthStatus.pending, (state) => {
      state.isLoading = true;
      state.error = null;
      logger.debug('auth', "⏳ Checking authentication status...");
    });

    builder.addCase(checkAuthStatus.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = action.payload.isAuthenticated;
      state.user = action.payload.user;
      state.isRedirecting = false;
      logger.debug('auth', "✅ Authentication status checked:", action.payload);
    });

    builder.addCase(checkAuthStatus.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.isRedirecting = false;
      state.error = action.payload as string;
    });

    // logoutGoogle
    builder.addCase(logoutGoogle.pending, (state) => {
      state.isLoading = true;
      state.isRedirecting = true;
      state.error = null;
      logger.debug('auth', "⏳ Logging out...");
    });

    builder.addCase(logoutGoogle.fulfilled, (state) => {
      state.isLoading = false;
      state.isRedirecting = true; // Keep redirecting true since we're redirecting
      logger.debug('auth', "✅ Logout initiated, redirecting...");
    });

    builder.addCase(logoutGoogle.rejected, (state, action) => {
      state.isLoading = false;
      state.isRedirecting = false;
      state.error = action.payload as string;
    });
  },
});

// Export actions
export const {
  setError,
  clearError,
  resetGoogleOAuth,
  setRedirecting,
  setUser,
} = googleOAuthSlice.actions;

// Export selectors
export const selectGoogleOAuth = (state: any) => state.googleOAuth;
export const selectGoogleOAuthLoading = (state: any) => state.googleOAuth.isLoading;
export const selectGoogleOAuthUser = (state: any) => state.googleOAuth.user;
export const selectGoogleOAuthError = (state: any) => state.googleOAuth.error;
export const selectGoogleOAuthAuthenticated = (state: any) => state.googleOAuth.isAuthenticated;
export const selectGoogleOAuthRedirecting = (state: any) => state.googleOAuth.isRedirecting;

export default googleOAuthSlice.reducer;