// Google OAuth Configuration Utility

// Type Definitions
export interface GoogleOAuthConfig {
  clientId: string;
  redirectUri: string;
  backendAuthUrl: string;
  scope: string;
  apiUrl: string;
  frontendUrl: string;
}

export interface GoogleOAuthResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    auth_provider: string;
  };
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    auth_provider: string;
  };
}

// Environment Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Base URL for OAuth callbacks
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : FRONTEND_URL;

// API Endpoints Configuration
const ENDPOINTS = {
  // Google OAuth endpoints
  auth: "https://accounts.google.com/o/oauth2/v2/auth",
  token: "https://oauth2.googleapis.com/token",
  userInfo: "https://www.googleapis.com/oauth2/v2/userinfo",
  revoke: "https://oauth2.googleapis.com/revoke",
  
  // Django Allauth endpoints
  djangoLogin: `${API_URL}/accounts/google/login/`,
  djangoCallback: `${API_URL}/accounts/google/login/callback/`,
  djangoLogout: `${API_URL}/accounts/logout/`,
  
  // Frontend routes
  frontendCallback: `${BASE_URL}/auth/google/callback`,
  
  // API endpoints
  profile: `${API_URL}/api/auth/user/`,
  tokenRefresh: `${API_URL}/api/token/refresh/`,
  authStatus: `${API_URL}/api/auth/status/`,
} as const;

// Export the endpoints with proper typing
export const GOOGLE_API_ENDPOINTS: Readonly<typeof ENDPOINTS> = ENDPOINTS;

// Google OAuth Configuration
export const GOOGLE_OAUTH_CONFIG: GoogleOAuthConfig = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  // IMPORTANT: Use the Next.js callback route as the redirect URI (no trailing slash)
  redirectUri: `${BASE_URL}/auth/google/callback`,
  backendAuthUrl: `${API_URL}/api/auth/google/`,
  apiUrl: API_URL,
  frontendUrl: FRONTEND_URL,
  scope: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid'
  ].join(' ')
};


// Log the OAuth configuration for debugging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Google OAuth Config:', {
    clientId: GOOGLE_OAUTH_CONFIG.clientId ? '***' + GOOGLE_OAUTH_CONFIG.clientId.slice(-4) : 'not set',
    redirectUri: GOOGLE_OAUTH_CONFIG.redirectUri,
    backendAuthUrl: GOOGLE_OAUTH_CONFIG.backendAuthUrl,
    scope: GOOGLE_OAUTH_CONFIG.scope
  });
}

// Error types
export enum GoogleOAuthErrorType {
  POPUP_BLOCKED = "popup_blocked",
  ACCESS_DENIED = "access_denied",
  INVALID_CLIENT = "invalid_client",
  NETWORK_ERROR = "network_error",
  SERVER_ERROR = "server_error",
  UNKNOWN_ERROR = "unknown_error",
}

// Error messages
export const GOOGLE_OAUTH_ERROR_MESSAGES: Record<GoogleOAuthErrorType, string> = {
  [GoogleOAuthErrorType.POPUP_BLOCKED]: "Popup was blocked by the browser. Please allow popups for this site.",
  [GoogleOAuthErrorType.ACCESS_DENIED]: "Access was denied. Please try again.",
  [GoogleOAuthErrorType.INVALID_CLIENT]: "Invalid client configuration. Please contact support.",
  [GoogleOAuthErrorType.NETWORK_ERROR]: "Network error occurred. Please check your connection.",
  [GoogleOAuthErrorType.SERVER_ERROR]: "Server error occurred. Please try again later.",
  [GoogleOAuthErrorType.UNKNOWN_ERROR]: "An unknown error occurred. Please try again.",
};

// Helper function to get Google OAuth URL
export const getGoogleOAuthUrl = (state?: string): string => {
  try {
    // Create URL object to ensure proper encoding
    const authUrl = new URL(GOOGLE_API_ENDPOINTS.auth);
    
    // Set required parameters
    const params = new URLSearchParams({
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
      response_type: 'code',
      scope: GOOGLE_OAUTH_CONFIG.scope,
      access_type: 'offline',
      prompt: 'select_account consent',
      include_granted_scopes: 'true',
      nonce: Math.random().toString(36).substring(2), // Add nonce for security
      ...(state && { state }) // Add state if provided
    });

    // Add parameters to URL
    authUrl.search = params.toString();
    
    // Log the generated URL (without sensitive parameters)
    const debugUrl = new URL(authUrl.toString());
    if (debugUrl.searchParams.has('client_id')) {
      const clientId = debugUrl.searchParams.get('client_id') || '';
      debugUrl.searchParams.set('client_id', '***' + clientId.slice(-4));
    }
    console.log('🔗 Generated Google OAuth URL:', debugUrl.toString());
    
    return authUrl.toString();
  } catch (error) {
    console.error('Error generating Google OAuth URL:', error);
    throw new Error('Failed to generate Google OAuth URL');
  }
};

// Helper function to validate Google OAuth response
export const validateGoogleOAuthResponse = (response: any): { code: string } => {
  console.log('Received OAuth response:', response); // For debugging
  
  if (!response) {
    const error = new Error("No response received from Google OAuth");
    logGoogleOAuthError(error, 'validateGoogleOAuthResponse');
    throw error;
  }

  // Handle error responses
  if (response.error) {
    const error = new Error(response.error_description || response.error);
    error.name = 'GoogleOAuthError';
    
    // Map common OAuth errors to our error types
    if (response.error === 'redirect_uri_mismatch') {
      error.message = 'The redirect URI in the request does not match the ones authorized for the OAuth client.';
    } else if (response.error === 'invalid_grant') {
      error.message = 'The authorization code is invalid or has expired.';
    }
    
    logGoogleOAuthError(error, 'validateGoogleOAuthResponse');
    throw error;
  }

  if (!response.code) {
    const error = new Error("No authorization code received from Google OAuth");
    logGoogleOAuthError(error, 'validateGoogleOAuthResponse');
    throw error;
  }

  return response;
};

// Helper function to exchange code for tokens
export const exchangeCodeForTokens = async (code: string): Promise<AuthTokens> => {
  const response = await fetch(GOOGLE_OAUTH_CONFIG.backendAuthUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to authenticate with Google');
  }

  const data: AuthTokens = await response.json();
  
  if (!data.access || !data.refresh || !data.user) {
    throw new Error('Invalid response from authentication server');
  }

  return data;
};

// Store auth data in localStorage
export const storeAuthData = (data: AuthTokens): void => {
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
  localStorage.setItem('user', JSON.stringify(data.user));
};

// Get stored auth data
export const getStoredAuthData = (): { accessToken: string | null; refreshToken: string | null; user: any } => {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  const userStr = localStorage.getItem('user');
  
  return {
    accessToken,
    refreshToken,
    user: userStr ? JSON.parse(userStr) : null,
  };
};

// Clear auth data
export const clearAuthData = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const isAuthenticated = (): boolean => {
  const { accessToken } = getStoredAuthData();
  return !!accessToken;
};

// Debug function to log OAuth URLs
export function debugGoogleOAuthUrls() {
  if (process.env.NODE_ENV === 'development') {
    console.log('Google OAuth Configuration:');
    console.log('- Client ID:', GOOGLE_OAUTH_CONFIG.clientId);
    console.log('- Redirect URI:', GOOGLE_OAUTH_CONFIG.redirectUri);
    console.log('- Backend Auth URL:', GOOGLE_OAUTH_CONFIG.backendAuthUrl);
    console.log('- Scope:', GOOGLE_OAUTH_CONFIG.scope);
    console.log('- OAuth URL:', getGoogleOAuthUrl());
  }
}

// Logging utilities
export function logGoogleOAuthResponse(response: any, context: string = "Google OAuth") {
  console.group(`${context} Response Log`);
  console.log("Timestamp:", new Date().toISOString());
  console.log("Response:", response);
  
  if (response.code) {
    console.log("Code Length:", response.code.length);
  }
  
  console.groupEnd();
};

export const logGoogleOAuthError = (error: any, context: string = "Google OAuth Error") => {
  console.group(`${context} Error Log`);
  console.log("Timestamp:", new Date().toISOString());
  console.log("Error:", error);
  
  if (error.message) {
    console.log("Error Message:", error.message);
  }
  
  console.groupEnd();
};