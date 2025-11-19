import { GOOGLE_OAUTH_CONFIG, GOOGLE_API_ENDPOINTS } from '../utils/googleOAuthConfig';

// Re-export types and configuration from the main utility file
export {
  GOOGLE_OAUTH_CONFIG,
  GOOGLE_API_ENDPOINTS,
  type UserData,
  type AuthTokens,
  type GoogleOAuthResponse
} from '../utils/googleOAuthConfig';

// Google OAuth API endpoints
export const GOOGLE_OAUTH_ENDPOINTS = {
  auth: "https://accounts.google.com/o/oauth2/v2/auth",
  token: "https://oauth2.googleapis.com/token",
  userInfo: "https://www.googleapis.com/oauth2/v2/userinfo",
};

// Common Google OAuth scopes
export const GOOGLE_SCOPES = {
  EMAIL: "email",
  PROFILE: "profile",
  OPENID: "openid",
};

// Error messages for Google OAuth
export const GOOGLE_OAUTH_ERRORS = {
  POPUP_BLOCKED: "Popup was blocked by the browser. Please allow popups for this site.",
  ACCESS_DENIED: "Access was denied. Please try again.",
  INVALID_CLIENT: "Invalid client configuration. Please contact support.",
  NETWORK_ERROR: "Network error occurred. Please check your connection and try again.",
  UNKNOWN_ERROR: "An unknown error occurred. Please try again.",
};

// Helper function to get Google OAuth URL
export const getGoogleOAuthUrl = (state?: string) => {
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CONFIG.clientId,
    redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
    response_type: "code",
    scope: GOOGLE_OAUTH_CONFIG.scope,
    access_type: GOOGLE_OAUTH_CONFIG.accessType,
    prompt: GOOGLE_OAUTH_CONFIG.prompt,
  });

  if (state) {
    params.append("state", state);
  }

  return `${GOOGLE_OAUTH_ENDPOINTS.auth}?${params.toString()}`;
};

// Helper function to validate Google OAuth response
export const validateGoogleOAuthResponse = (response: any) => {
  if (!response) {
    throw new Error("No response received from Google OAuth");
  }

  if (response.error) {
    throw new Error(response.error_description || response.error);
  }

  if (!response.code) {
    throw new Error("No authorization code received from Google OAuth");
  }

  return response;
};
