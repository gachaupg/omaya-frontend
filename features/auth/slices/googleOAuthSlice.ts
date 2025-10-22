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
  authCode: string | null;
  backendResponse: any | null;
}

// Initial state
const initialState: GoogleOAuthState = {
  isLoading: false,
  isAuthenticated: false,
  user: null,
  error: null,
  authCode: null,
  backendResponse: null,
};

// Async thunk for Google OAuth authentication
export const authenticateWithGoogle = createAsyncThunk(
  "googleOAuth/authenticate",
  async (authCode: string, { rejectWithValue }) => {
         try {
       logger.debug('auth', "🔐 Starting Google OAuth authentication...");
       logger.debug('auth', "📝 Auth Code:", authCode);
       
       // Debug URL construction
       debugGoogleOAuthUrls();
       
       logger.debug('auth', "🌐 Backend URL:", GOOGLE_API_ENDPOINTS.backendAuth);

      // Log the Google OAuth response
      logGoogleOAuthResponse({ code: authCode }, "Google OAuth Code Received");

      const response = await axios.post(
        GOOGLE_API_ENDPOINTS.backendAuth,
        {
          code: authCode,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 15000, // 15 second timeout
        }
      );

      logger.debug('auth', "✅ Backend response received:", response.data);
      
      // Log the backend response
      logGoogleOAuthResponse(response.data, "Backend Authentication Response");

      return response.data;
    } catch (error: any) {
      console.error("❌ Google OAuth authentication failed:", error);
      
      // Log the error
      logGoogleOAuthError(error, "Backend Authentication Error");

      let errorMessage = GOOGLE_OAUTH_ERROR_MESSAGES[GoogleOAuthErrorType.UNKNOWN_ERROR];

      if (error.code === "ERR_NETWORK") {
        errorMessage = GOOGLE_OAUTH_ERROR_MESSAGES[GoogleOAuthErrorType.NETWORK_ERROR];
      } else if (error.response?.status === 404) {
        errorMessage = "Google OAuth endpoint not found. Please check the API configuration.";
      } else if (error.response?.status === 500) {
        errorMessage = GOOGLE_OAUTH_ERROR_MESSAGES[GoogleOAuthErrorType.SERVER_ERROR];
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for getting Google user info
export const getGoogleUserInfo = createAsyncThunk(
  "googleOAuth/getUserInfo",
  async (accessToken: string, { rejectWithValue }) => {
    try {
      logger.debug('auth', "👤 Fetching Google user info...");
      
      const response = await axios.get(GOOGLE_API_ENDPOINTS.userInfo, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      logger.debug('auth', "✅ Google user info received:", response.data);
      
      // Log the user info
      logGoogleOAuthResponse(response.data, "Google User Info");

      return response.data;
    } catch (error: any) {
      console.error("❌ Failed to get Google user info:", error);
      
      // Log the error
      logGoogleOAuthError(error, "Google User Info Error");

      return rejectWithValue("Failed to get user information from Google");
    }
  }
);

// Google OAuth slice
const googleOAuthSlice = createSlice({
  name: "googleOAuth",
  initialState,
  reducers: {
    // Set auth code
    setAuthCode: (state, action: PayloadAction<string>) => {
      state.authCode = action.payload;
      state.error = null;
      logger.debug('auth', "🔑 Auth code set:", action.payload);
    },

    // Clear auth code
    clearAuthCode: (state) => {
      state.authCode = null;
      logger.debug('auth', "🧹 Auth code cleared");
    },

    // Set error
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
      console.error("❌ Google OAuth error set:", action.payload);
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
      state.authCode = null;
      state.backendResponse = null;
      logger.debug('auth', "🔄 Google OAuth state reset");
    },

    // Log Google OAuth response
    logResponse: (state, action: PayloadAction<GoogleOAuthResponse>) => {
      logGoogleOAuthResponse(action.payload, "Google OAuth Response");
    },
  },
  extraReducers: (builder) => {
    // authenticateWithGoogle
    builder.addCase(authenticateWithGoogle.pending, (state) => {
      state.isLoading = true;
      state.error = null;
      logger.debug('auth', "⏳ Google OAuth authentication started...");
    });

    builder.addCase(authenticateWithGoogle.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.backendResponse = action.payload;
      state.error = null;
      
      // If the backend response includes user data, set it
      if (action.payload.user) {
        state.user = action.payload.user;
      }
      
      logger.debug('auth', "✅ Google OAuth authentication successful:", action.payload);
    });

    builder.addCase(authenticateWithGoogle.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.error = action.payload as string;
      console.error("❌ Google OAuth authentication failed:", action.payload);
    });

    // getGoogleUserInfo
    builder.addCase(getGoogleUserInfo.pending, (state) => {
      state.isLoading = true;
      logger.debug('auth', "⏳ Fetching Google user info...");
    });

    builder.addCase(getGoogleUserInfo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
      logger.debug('auth', "✅ Google user info fetched:", action.payload);
    });

    builder.addCase(getGoogleUserInfo.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
      console.error("❌ Failed to get Google user info:", action.payload);
    });
  },
});

// Export actions
export const {
  setAuthCode,
  clearAuthCode,
  setError,
  clearError,
  resetGoogleOAuth,
  logResponse,
} = googleOAuthSlice.actions;

// Export selectors
export const selectGoogleOAuth = (state: any) => state.googleOAuth;
export const selectGoogleOAuthLoading = (state: any) => state.googleOAuth.isLoading;
export const selectGoogleOAuthUser = (state: any) => state.googleOAuth.user;
export const selectGoogleOAuthError = (state: any) => state.googleOAuth.error;
export const selectGoogleOAuthAuthenticated = (state: any) => state.googleOAuth.isAuthenticated;

export default googleOAuthSlice.reducer;
