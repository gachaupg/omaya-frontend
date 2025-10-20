import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
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
     
       // Debug URL construction
       debugGoogleOAuthUrls();
       

      // Log the Google OAuth response

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

      return response.data;
    } catch (error: any) {
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
      const response = await axios.get(GOOGLE_API_ENDPOINTS.userInfo, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error: any) {
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
    },

    // Clear auth code
    clearAuthCode: (state) => {
      state.authCode = null;
    },

    // Set error
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Reset state
    resetGoogleOAuth: (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
      state.authCode = null;
      state.backendResponse = null;
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
      
    });

    builder.addCase(authenticateWithGoogle.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.error = action.payload as string;
    });

    // getGoogleUserInfo
    builder.addCase(getGoogleUserInfo.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(getGoogleUserInfo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
    });

    builder.addCase(getGoogleUserInfo.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
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
} = googleOAuthSlice.actions;

// Export selectors
export const selectGoogleOAuth = (state: any) => state.googleOAuth;
export const selectGoogleOAuthLoading = (state: any) => state.googleOAuth.isLoading;
export const selectGoogleOAuthUser = (state: any) => state.googleOAuth.user;
export const selectGoogleOAuthError = (state: any) => state.googleOAuth.error;
export const selectGoogleOAuthAuthenticated = (state: any) => state.googleOAuth.isAuthenticated;

export default googleOAuthSlice.reducer;
