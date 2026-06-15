/**
 * types.ts – auto‑generated placeholder
 */

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  photo?: string;
  date_of_birth?: string;
  country?: string;
  city?: string;
  address?: string;
  postal_code?: string;
  kyc_status?: "pending" | "approved" | "rejected" | "not_submitted";
  two_factor_enabled: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ThemeSettings {
  mode: "light" | "dark" | "deem" | "system";
  primary_color?: string;
  accent_color?: string;
}

export interface SecuritySettings {
  two_factor_enabled: boolean;
  login_notifications: boolean;
  trade_notifications: boolean;
  withdrawal_notifications: boolean;
  session_timeout: number; // in minutes
  max_login_attempts: number;
}

export interface PrivacySettings {
  profile_visibility: "public" | "private" | "friends";
  show_email: boolean;
  show_phone: boolean;
  allow_marketing_emails: boolean;
  allow_push_notifications: boolean;
}

export interface PasswordChangeRequest {
  old_password: string;
  new_password: string;
}

export interface PasswordResetOtpVerifyRequest extends PasswordChangeRequest {
  otp: string;
}

export interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  /** Included on the second PATCH to `/api/update/profile/` after OTP is received. */
  otp?: string;
  phone_number?: string;
  date_of_birth?: string;
  country?: string;
  city?: string;
  address?: string;
  postal_code?: string;
}

/** Response from PATCH `/api/update/profile/` (name change flow). */
export type ProfilePatchUpdateResponse =
  | { otp_required: true; message: string }
  | { user: Record<string, unknown> };

export type UpdateProfileThunkResult =
  | { outcome: "otp_required"; message: string }
  | { outcome: "success"; user?: Record<string, unknown>; profilePayload?: unknown };

export interface SettingsState {
  profile: UserProfile | null;
  theme: ThemeSettings;
  security: SecuritySettings;
  privacy: PrivacySettings;
  loading: boolean;
  error: string | null;
  success: string | null;
  updating: boolean;
  // Device Session Management
  deviceSessions: DeviceSession[];
  deviceSessionsLoading: boolean;
  deviceSessionsError: string | null;
  // Support Request
  supportRequestLoading: boolean;
  supportRequestError: string | null;
}

export interface SettingsApiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface ProfileUpdateResponse extends SettingsApiResponse {
  data: UserProfile;
}

export interface PasswordChangeResponse extends SettingsApiResponse {
  data: {
    message: string;
  };
}

export interface ThemeUpdateResponse extends SettingsApiResponse {
  data: ThemeSettings;
}

export interface SecurityUpdateResponse extends SettingsApiResponse {
  data: SecuritySettings;
}

export interface PrivacyUpdateResponse extends SettingsApiResponse {
  data: PrivacySettings;
}

export interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  ip_address: string;
  location: string;
  last_activity: string;
  is_current: boolean;
}

export interface SessionsResponse extends SettingsApiResponse {
  data: SessionInfo[];
}

// Device Session Management Types
export interface DeviceSession {
  id: number;
  session_id: string;
  ip_address: string;
  location: string;
  browser: string;
  sign_in_time: string;
  is_active: boolean;
  /** e.g. "Windows - Chrome" from backend / WebSocket */
  description?: string;
  // Optional fields that might be present in some responses
  last_activity?: string;
  is_current?: boolean;
  user_agent?: string;
  device_type?: string;
}

export interface CreateDeviceSessionPayload {
  ip_address: string;
  location: string;
  browser: string;
  sign_in_time: string;
  user_agent: string;
  device_type: string;
  description?: string;
  device_data?: Record<string, unknown>;
  network_data?: Record<string, unknown>;
  fingerprint_data?: Record<string, unknown>;
  browser_capabilities?: Record<string, unknown>;
  login_patterns?: Record<string, unknown>;
  session_duration?: number;
  failed_login_attempts?: number;
  suspicious_behavior_detected?: boolean;
}

export interface DeviceSessionsResponse extends SettingsApiResponse {
  data: DeviceSession[];
}

export interface LogoutDeviceResponse extends SettingsApiResponse {
  data: {
    message: string;
    logged_out_session_id: string;
  };
}

export interface LogoutAllDevicesResponse extends SettingsApiResponse {
  data: {
    message: string;
    logged_out_count: number;
  };
}

// Support Request Types
export interface SupportRequestPayload {
  email_address: string;
  question: string;
  supporting_file?: File | null;
}

export interface SupportRequestResponse extends SettingsApiResponse {
  data: {
    message: string;
    ticket_id?: string;
  };
}

// Cash Withdrawal Types
export interface CashWithdrawalRequest {
  requested_amount: string;
  wallet_address?: string;
  withdrawal_method: string;
  user_payment_detail_id?: number;
}

export interface CashWithdrawalResponse extends SettingsApiResponse {
  data: {
    message: string;
    success: boolean;
  };
}

// Referral Fee Calculation Types
export interface ReferralFeeCalculation {
  requested_amount?: string;
  commission_fee: string;
  network_fee: string;
  total_fees: string;
  net_amount?: string;
}

export interface ReferralFeeCalculationResponse {
  requested_amount?: string;
  commission_fee: string;
  network_fee: string;
  total_fees: string;
  net_amount?: string;
}

export const MIN_REFERRAL_WITHDRAWAL_AMOUNT = 10;