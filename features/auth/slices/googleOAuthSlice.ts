import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { logger } from '@/lib/utils/logger';
import { 
  GOOGLE_API_ENDPOINTS, 
  GOOGLE_OAUTH_CONFIG,
  GoogleOAuthResponse,
  AuthTokens,
} from "@/utils/googleOAuthConfig";
import { storage } from "@/features/auth/utils/storage";

// Types
export interface GoogleOAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthTokens['user'] | null;
  error: string | null;
  isRedirecting: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

// Initial state
const initialState: GoogleOAuthState = {
  isLoading: false,
  isAuthenticated: false,
  user: null,
  error: null,
  isRedirecting: false,
  accessToken: null,
  refreshToken: null,
};

// Helper function to store tokens in localStorage
const storeTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }
};

// Helper function to clear tokens from localStorage
const clearTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }
};

// Async thunk to initiate Google OAuth
export const initiateGoogleOAuth = createAsyncThunk(
  "googleOAuth/initiate",
  async (_, { rejectWithValue }) => {
    try {
      logger.debug('auth', '🔐 Initiating Google OAuth...');
      
      // Add state parameter to prevent CSRF
      const state = Math.random().toString(36).substring(2);
      if (typeof window !== 'undefined') {
        localStorage.setItem('oauth_state', state);
      }
      
      // Build the OAuth URL
      const authUrl = new URL(GOOGLE_API_ENDPOINTS.auth);
      authUrl.searchParams.append('client_id', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '');
      // Use the frontend callback route as the redirect URI
      authUrl.searchParams.append('redirect_uri', GOOGLE_OAUTH_CONFIG.redirectUri);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid'
      ].join(' '));
      authUrl.searchParams.append('state', state);
      authUrl.searchParams.append('access_type', 'offline');
      authUrl.searchParams.append('prompt', 'consent');
      
      // Redirect to Google OAuth
      window.location.href = authUrl.toString();
      
      return { success: true };
    } catch (error: any) {
      logger.error('auth', '❌ Failed to initiate Google OAuth:', error);
      return rejectWithValue('Failed to initiate Google OAuth');
    }
  }
);

// Async thunk to handle OAuth callback
export const handleOAuthCallback = createAsyncThunk(
  'googleOAuth/handleCallback',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      logger.debug('auth', '🔄 Handling OAuth callback...');
      
      // Get the authorization code from the URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      
      // Check for errors
      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }
      
      if (!code) {
        throw new Error('No authorization code received');
      }
      
      // Verify state to prevent CSRF
      const storedState = typeof window !== 'undefined' ? localStorage.getItem('oauth_state') : null;
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }
      
      // Exchange the authorization code with our backend (securely uses client secret server-side)
      const backendResponse = await axios.post(
        GOOGLE_OAUTH_CONFIG.backendAuthUrl,
        { code },
        { withCredentials: true }
      );

      const { access, refresh, user } = backendResponse.data as { access: string; refresh?: string; user: any };

      if (access) {
        storeTokens(access, refresh || '');
        return {
          accessToken: access,
          refreshToken: refresh || null,
          user,
        };
      }

      throw new Error('Failed to retrieve tokens');
      
    } catch (error: any) {
      logger.error('auth', '❌ OAuth callback error:', error);
      // Clear any stored state on error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('oauth_state');
      }
      return rejectWithValue(error.message || 'Authentication failed');
    }
  }
);

// Async thunk to check authentication status
export const checkAuthStatus = createAsyncThunk(
  'googleOAuth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      // Skip if we're on the login page
      if (typeof window !== 'undefined' && window.location.pathname === '/auth/login') {
        return { isAuthenticated: false, user: null };
      }
      
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      if (!accessToken) {
        return { isAuthenticated: false, user: null };
      }
      
      // Validate token with backend and fetch current user profile
      const response = await axios.get(GOOGLE_API_ENDPOINTS.profile, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
      });

      if (response.data && (response.data.id || response.data.email)) {
        return {
          isAuthenticated: true,
          user: response.data,
        };
      }
      
      // If we get here, the token is invalid
      clearTokens();
      return { isAuthenticated: false, user: null };
      
    } catch (error: any) {
      // If the token is invalid or expired, clear it
      if (error.response?.status === 401) {
        clearTokens();
      }
      return rejectWithValue('Authentication check failed');
    }
  }
);

// Async thunk to log out
export const logout = createAsyncThunk(
  'googleOAuth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Clear local storage
      clearTokens();
      
      // Redirect to Django logout
      const logoutUrl = new URL(GOOGLE_API_ENDPOINTS.djangoLogout);
      logoutUrl.searchParams.append('next', window.location.origin);
      
      // Use replace to prevent the back button from returning to the logged-in state
      window.location.replace(logoutUrl.toString());
      
      return { success: true };
    } catch (error: any) {
      logger.error('auth', '❌ Logout error:', error);
      return rejectWithValue('Logout failed');
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
    // Set redirecting state
    setIsRedirecting: (state, action: PayloadAction<boolean>) => {
      state.isRedirecting = action.payload;
    },
    // Reset state
    resetGoogleOAuth: (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
      state.isRedirecting = false;
      state.accessToken = null;
      state.refreshToken = null;
      
      // Clear tokens from localStorage
      clearTokens();
    },
    // Set user data
    setUser: (state, action: PayloadAction<AuthTokens['user']>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Initiate Google OAuth
    builder.addCase(initiateGoogleOAuth.pending, (state) => {
      state.isLoading = true;
      state.error = null;
      state.isRedirecting = true;
    });
    
    builder.addCase(initiateGoogleOAuth.fulfilled, (state) => {
      state.isLoading = false;
      state.isRedirecting = true;
    });
    
    builder.addCase(initiateGoogleOAuth.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
      state.isRedirecting = false;
    });
    
    // Handle OAuth callback
    builder.addCase(handleOAuthCallback.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    
    builder.addCase(handleOAuthCallback.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.error = null;
      state.isRedirecting = false;
      
      // Store user data in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        // Persist profile for apiClient auth header
        storage.setProfile({
          user: action.payload.user as any,
          tokens: {
            access: action.payload.accessToken,
            refresh: action.payload.refreshToken || '',
          },
        });
      }
    });
    
    builder.addCase(handleOAuthCallback.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload as string;
      state.isRedirecting = false;
      
      // Clear any stored data on error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('oauth_state');
      }
    });
    
    // Check authentication status
    builder.addCase(checkAuthStatus.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    
    builder.addCase(checkAuthStatus.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = action.payload.isAuthenticated;
      state.user = action.payload.user;
      state.error = null;
      
      // Update access token from localStorage
      if (typeof window !== 'undefined') {
        state.accessToken = localStorage.getItem('access_token');
        state.refreshToken = localStorage.getItem('refresh_token');
        // Ensure storage profile exists for apiClient
        const userStr = localStorage.getItem('user');
        if (userStr && state.accessToken) {
          try {
            const user = JSON.parse(userStr);
            storage.setProfile({
              user,
              tokens: {
                access: state.accessToken,
                refresh: state.refreshToken || '',
              },
            });
          } catch {}
        }
      }
    });
    
    builder.addCase(checkAuthStatus.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload as string;
      state.accessToken = null;
      state.refreshToken = null;
    });
    
    // Logout
    builder.addCase(logout.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    
    builder.addCase(logout.fulfilled, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isRedirecting = false;
    });
    
    builder.addCase(logout.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

// Export actions
export const { 
  setError, 
  setIsRedirecting, 
  resetGoogleOAuth, 
  setUser 
} = googleOAuthSlice.actions;

// Export selectors
export const selectGoogleOAuth = (state: any) => state.googleOAuth;
export const selectGoogleOAuthLoading = (state: any) => state.googleOAuth.isLoading;
export const selectGoogleOAuthUser = (state: any) => state.googleOAuth.user;
export const selectGoogleOAuthError = (state: any) => state.googleOAuth.error;
export const selectGoogleOAuthAuthenticated = (state: any) => state.googleOAuth.isAuthenticated;
export const selectGoogleOAuthRedirecting = (state: any) => state.googleOAuth.isRedirecting;
export const selectAccessToken = (state: any) => state.googleOAuth.accessToken;

export default googleOAuthSlice.reducer;
