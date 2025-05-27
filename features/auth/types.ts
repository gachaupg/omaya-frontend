/**
 * types.ts – auto‑generated placeholder
 */
// User type
export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    is_verified: boolean;
    user_id: string;
    referral_code: string;
    user_type?: 'individual' | 'business';
    phone_number?: string;
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
    user_type: 'individual' | 'business';
    phone_number: string;
    referred_by?: string;
  }
  
  // Login payload
  export interface LoginPayload {
    email: string;
    password: string;
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
  }
  
  // Successful auth response
  export interface AuthResponse {
    refresh: string;
    access: string;
    user: User;
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
    user: Pick<User, 'id' | 'email' | 'is_verified'>;
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