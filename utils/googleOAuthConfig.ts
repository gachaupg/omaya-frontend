import { API_CONFIG } from "@/lib/appConfig";

// Google OAuth Configuration Utility
export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  uxMode: 'popup' | 'redirect';
  flow: 'auth-code' | 'implicit';
}

export interface GoogleOAuthResponse {
  code: string;
  scope: string;
  authuser: string;
  prompt: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

// Default configuration
export const GOOGLE_OAUTH_CONFIG: GoogleOAuthConfig = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "271869110142-pipollidmfj2v26dvgt9oumru543v84p.apps.googleusercontent.com",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "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",
  redirectUri: typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'),
  scope: "email profile",
  uxMode: "popup",
  flow: "auth-code",
};

// API endpoints
export const GOOGLE_API_ENDPOINTS = {
  auth: "https://accounts.google.com/o/oauth2/v2/auth",
  token: "https://oauth2.googleapis.com/token",
  userInfo: "https://www.googleapis.com/oauth2/v2/userinfo",
  backendAuth: `${API_CONFIG.BASE_URL}${API_CONFIG.GOOGLE_AUTH.GOOGLE_AUTH}`,
};

// Debug function to log URL construction
export const debugGoogleOAuthUrls = () => {
  console.group("🔧 Google OAuth URL Debug");
  console.log("API_CONFIG.BASE_URL:", API_CONFIG.BASE_URL);
  console.log("API_CONFIG.GOOGLE_AUTH.GOOGLE_AUTH:", API_CONFIG.GOOGLE_AUTH.GOOGLE_AUTH);
  console.log("Constructed backendAuth URL:", GOOGLE_API_ENDPOINTS.backendAuth);
  console.log("Environment NEXT_PUBLIC_BASE_URL:", process.env.NEXT_PUBLIC_BASE_URL);
  console.groupEnd();
};

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
export const GOOGLE_OAUTH_ERROR_MESSAGES = {
  [GoogleOAuthErrorType.POPUP_BLOCKED]: "Popup was blocked by the browser. Please allow popups for this site.",
  [GoogleOAuthErrorType.ACCESS_DENIED]: "Access was denied. Please try again.",
  [GoogleOAuthErrorType.INVALID_CLIENT]: "Invalid client configuration. Please contact support.",
  [GoogleOAuthErrorType.NETWORK_ERROR]: "Network error occurred. Please check your connection.",
  [GoogleOAuthErrorType.SERVER_ERROR]: "Server error occurred. Please try again later.",
  [GoogleOAuthErrorType.UNKNOWN_ERROR]: "An unknown error occurred. Please try again.",
};

// Helper functions
export const getGoogleOAuthUrl = (state?: string): string => {
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CONFIG.clientId,
    redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
    response_type: "code",
    scope: GOOGLE_OAUTH_CONFIG.scope,
    access_type: "offline",
    prompt: "consent",
  });

  if (state) {
    params.append("state", state);
  }

  return `${GOOGLE_API_ENDPOINTS.auth}?${params.toString()}`;
};

export const validateGoogleOAuthResponse = (response: any): GoogleOAuthResponse => {
  if (!response) {
    throw new Error("No response received from Google OAuth");
  }

  if (response.error) {
    throw new Error(response.error_description || response.error);
  }

  if (!response.code) {
    throw new Error("No authorization code received from Google OAuth");
  }

  return response as GoogleOAuthResponse;
};

export const logGoogleOAuthResponse = (response: any, context: string = "Google OAuth") => {
  console.group(`${context} Response Log`);
  console.log("Timestamp:", new Date().toISOString());
  console.log("Response:", response);
  
  if (response.code) {
    console.log("Authorization Code:", response.code);
    console.log("Code Length:", response.code.length);
  }
  
  if (response.scope) {
    console.log("Scope:", response.scope);
  }
  
  if (response.authuser) {
    console.log("Auth User:", response.authuser);
  }
  
  if (response.prompt) {
    console.log("Prompt:", response.prompt);
  }
  
  console.groupEnd();
};

export const logGoogleOAuthError = (error: any, context: string = "Google OAuth Error") => {
  console.group(`${context} Error Log`);
  console.log("Timestamp:", new Date().toISOString());
  console.log("Error:", error);
  
  if (error.code) {
    console.log("Error Code:", error.code);
  }
  
  if (error.message) {
    console.log("Error Message:", error.message);
  }
  
  if (error.response) {
    console.log("Response Status:", error.response.status);
    console.log("Response Data:", error.response.data);
  }
  
  console.groupEnd();
};
