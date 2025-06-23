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
  mode: "light" | "dark" | "system";
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
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  country?: string;
  city?: string;
  address?: string;
  postal_code?: string;
}

export interface SettingsState {
  profile: UserProfile | null;
  theme: ThemeSettings;
  security: SecuritySettings;
  privacy: PrivacySettings;
  loading: boolean;
  error: string | null;
  success: string | null;
  updating: boolean;
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
