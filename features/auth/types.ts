/**
 * types.ts – auto‑generated placeholder
 */
// User type
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  otp_verified: boolean;
  is_verified: boolean;
  user_id: string;
  referral_code: string;
  user_type?: "individual" | "business";
  phone_number?: string;
}

export interface UserProfile {
  date_of_birth: string | null;
  country: string | null;
  photo: string | null;
}

// Auth tokens
export interface AuthTokens {
  access: string;
  refresh: string;
}

// Register payload
export interface RegisterPayload {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  user_type: "individual" | "business";
  phone_number: string;
  referred_by?: string;
}

// Login payload
export interface LoginPayload {
  email: string;
  password: string;
}

// 2FA Login payload
export interface Login2FAPayload {
  email: string;
  password: string;
  code: string;
}

// Forgot password payload
export interface ForgotPasswordPayload {
  email: string;
}

// Reset password payload
export interface ResetPasswordPayload {
  email: string;
  password: string;
  confirm_password: string;
}

// Auth state
export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  profile: UserProfile | null;
  kycModalOpen: boolean;
  twoFAModalOpen: boolean;
  twoFAEmail: string;
  twoFAPassword: string;
}

// Successful auth response
export interface AuthResponse {
  refresh: string;
  access: string;
  user: User;
  profile: UserProfile;
  require_2fa?: boolean;
  message?: string;
}

export interface ProfileResponse {
  user: User;
  profile: UserProfile;
}

// Successful register response
export interface RegisterResponse {
  message: string;
  user: User;
}

export interface OTPPayload {
  email: string;
  otp: string;
}

export interface OTPResponse {
  message: string;
  user: Pick<User, "id" | "email" | "otp_verified">;
}

export interface KYCResponse {
  is_verified: boolean;
}

export interface KYCVerifyPayload {
  user_id: string;
  status: boolean;
}

export interface SumSubInitiatePayload {
  user_id: string;
}

export interface SumSubInitiateResponse {
  applicant_id: string;
}

export interface SumSubTokenPayload {
  applicant_id: string;
}

export interface SumSubTokenResponse {
  access_token: string;
}

export interface SumSubMessage {
  type: string;
  payload: {
    reviewStatus?: string;
    [key: string]: any;
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

export interface ApiErrorResponse {
  data: ApiError;
  status: number;
  statusText: string;
}
