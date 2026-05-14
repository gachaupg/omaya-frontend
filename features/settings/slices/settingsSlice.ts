/**
 * settingsSlice.ts – auto‑generated placeholder
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { settingsApi } from "../api";
import {
  SettingsState,
  UserProfile,
  ThemeSettings,
  SecuritySettings,
  PrivacySettings,
  ProfileUpdateRequest,
  PasswordChangeRequest,
  SessionInfo,
  DeviceSession,
  CreateDeviceSessionPayload,
  SupportRequestPayload,
} from "../types";
import { showToast } from "@/lib/utils/toast";
import { updateUser } from "@/features/auth/slices/authSlice";

import { logger } from '@/lib/utils/logger';

/** Avoid showing raw "Request failed with status code 400" etc. on the UI. */
function normalizeApiErrorMessage(error: any, fallback: string): string {
  const msg = error?.message || error?.response?.data?.message || String(error || "");
  if (!msg || /request failed with status code \d+/i.test(msg) || /status code \d+/i.test(msg) || /^\d{3}\s/i.test(msg)) {
    return fallback;
  }
  return msg;
}

/** Extract user-facing error from API response (supports error, message, detail). */
function getApiErrorPayload(error: any): string | undefined {
  const data = error?.response?.data;
  if (!data || typeof data !== "object") return undefined;
  const msg = data.error ?? data.message ?? data.detail;
  if (typeof msg === "string") return msg;
  if (Array.isArray(msg) && msg.length > 0 && typeof msg[0] === "string") return msg[0];
  return undefined;
}

const initialState: SettingsState = {
  profile: null,
  theme: {
    mode: "dark",
    primary_color: "#1D8751",
    accent_color: "#35353E",
  },
  security: {
    two_factor_enabled: false,
    login_notifications: true,
    trade_notifications: true,
    withdrawal_notifications: true,
    session_timeout: 30,
    max_login_attempts: 5,
  },
  privacy: {
    profile_visibility: "private",
    show_email: false,
    show_phone: false,
    allow_marketing_emails: false,
    allow_push_notifications: true,
  },
  loading: false,
  error: null,
  success: null,
  updating: false,
  // Device Session Management
  deviceSessions: [],
  deviceSessionsLoading: false,
  deviceSessionsError: null,
  // Support Request
  supportRequestLoading: false,
  supportRequestError: null,
};

// Async thunks
export const fetchProfile = createAsyncThunk(
  "settings/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsApi.getProfile();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch profile");
    }
  }
);

export const updateProfile = createAsyncThunk(
  "settings/updateProfile",
  async (data: ProfileUpdateRequest, { rejectWithValue, dispatch }) => {
    try {
      const response = (await settingsApi.updateProfile(data)) as Record<
        string,
        unknown
      >;
      if (response?.otp_required === true) {
        return {
          outcome: "otp_required" as const,
          message: String(
            response.message ||
              "OTP sent to your email. Submit again with the OTP to confirm your name change."
          ),
        };
      }
      if (response?.user && typeof response.user === "object") {
        const u = response.user as Record<string, unknown>;
        dispatch(
          updateUser({
            ...(typeof u.first_name === "string"
              ? { first_name: u.first_name }
              : {}),
            ...(typeof u.last_name === "string" ? { last_name: u.last_name } : {}),
            ...(typeof u.email === "string" ? { email: u.email } : {}),
            ...(typeof u.phone_number === "string"
              ? { phone_number: u.phone_number }
              : {}),
          })
        );
        showToast.success("Profile updated successfully");
        return { outcome: "success" as const, user: response.user };
      }
      showToast.success("Profile updated successfully");
      return { outcome: "success" as const, profilePayload: response };
    } catch (error: any) {
      const msg =
        getApiErrorPayload(error) ||
        normalizeApiErrorMessage(error, "Failed to update profile");
      showToast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const requestProfileChange = createAsyncThunk(
  "settings/requestProfileChange",
  async (
    payload: { type: "email" | "phone"; value: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await settingsApi.requestProfileChange(
        payload.type,
        payload.value
      );
      return { ...response, type: payload.type, value: payload.value };
    } catch (error: any) {
      const payload = getApiErrorPayload(error) || error?.message || "Failed to send OTP";
      return rejectWithValue(payload);
    }
  }
);

export const verifyProfileChange = createAsyncThunk(
  "settings/verifyProfileChange",
  async (
    payload: { otp: string; value: string; field: "email" | "phone_number" },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await settingsApi.verifyProfileChange(
        payload.otp,
        payload.value
      );
      return { ...response, field: payload.field, value: payload.value };
    } catch (error: any) {
      const payload =
        getApiErrorPayload(error) ||
        error?.message ||
        "Failed to verify and apply change";
      return rejectWithValue(payload);
    }
  }
);

export const updateProfilePhoto = createAsyncThunk(
  "settings/updateProfilePhoto",
  async (photo: File, { rejectWithValue }) => {
    try {
      const response = await settingsApi.updateProfilePhoto(photo);
      showToast.success("Profile photo updated successfully");
      return response.data;
    } catch (error: any) {
      showToast.error(error.message || "Failed to update profile photo");
      return rejectWithValue(error.message || "Failed to update profile photo");
    }
  }
);

export const changePassword = createAsyncThunk(
  "settings/changePassword",
  async (data: PasswordChangeRequest, { rejectWithValue }) => {
    try {
      const response = await settingsApi.changePassword(data);
      showToast.success("Password changed successfully");
      return response.data;
    } catch (error: any) {
      showToast.error(error.message || "Failed to change password");
      return rejectWithValue(error.message || "Failed to change password");
    }
  }
);

export const resetPassword = createAsyncThunk(
  "settings/resetPassword",
  async (
    data: { email: string; password: string; confirm_password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await settingsApi.resetPassword(data);
      showToast.success(response.message || "Password has been reset successfully.");
      return response;
    } catch (error: any) {
      showToast.error(error.message || "Failed to reset password");
      return rejectWithValue(error.message || "Failed to reset password");
    }
  }
);

export const sendPasswordResetOTP = createAsyncThunk(
  "settings/sendPasswordResetOTP",
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsApi.sendPasswordResetOTP();
      // No toast here - PasswordSection shows it to avoid duplicate toasts
      return response;
    } catch (error: any) {
      showToast.error(error.message || "Failed to send OTP");
      return rejectWithValue(error.message || "Failed to send OTP");
    }
  }
);

export const verifyPasswordResetOTP = createAsyncThunk(
  "settings/verifyPasswordResetOTP",
  async (otp: string, { rejectWithValue }) => {
    try {
      const response = await settingsApi.verifyPasswordResetOTP(otp);
      if (response.otp_verified) {
        // No toast here - PasswordSection shows "OTP Verified" inline to avoid duplicate toasts
      } else {
        const errorMessage = response.message || "Invalid OTP";
        return rejectWithValue(errorMessage);
      }
      return response;
    } catch (error: any) {
      // Extract backend error - backend returns: {"error":"Invalid OTP. 4 attempts remaining."}
      let errorMessage = "Failed to verify OTP";
      if (error?.response?.data) {
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      // No toast here - PasswordSection shows error inline for better UX
      return rejectWithValue(errorMessage);
    }
  }
);

export const changePasswordWithOTP = createAsyncThunk(
  "settings/changePasswordWithOTP",
  async (
    data: { new_password: string; confirm_password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await settingsApi.changePasswordWithOTP(data);
      showToast.success(response.message || "Password changed successfully");
      return response;
    } catch (error: any) {
      // Extract backend error message - prioritize error field, then message, then default
      // Backend returns: {"error":"New password cannot be the same as your current password."}
      let errorMessage = "Failed to change password";
      
      if (error?.response?.data) {
        // Check for 'error' field first (backend format)
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } 
        // Then check for 'message' field
        else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        // Check for nested error object
        else if (typeof error.response.data === 'object') {
          const dataStr = JSON.stringify(error.response.data);
          if (dataStr.includes('error')) {
            errorMessage = error.response.data.detail || errorMessage;
          }
        }
      } 
      // Fallback to error message if no response data
      else if (error?.message) {
        errorMessage = error.message;
      }
      
      // No toast here - PasswordSection handles error display to avoid duplicate toasts
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchTheme = createAsyncThunk(
  "settings/fetchTheme",
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsApi.getTheme();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch theme");
    }
  }
);

export const updateTheme = createAsyncThunk(
  "settings/updateTheme",
  async (theme: ThemeSettings, { rejectWithValue }) => {
    try {
      const response = await settingsApi.updateTheme(theme);
      showToast.success("Theme updated successfully");
      return response.data;
    } catch (error: any) {
      showToast.error(error.message || "Failed to update theme");
      return rejectWithValue(error.message || "Failed to update theme");
    }
  }
);

export const fetchSecuritySettings = createAsyncThunk(
  "settings/fetchSecuritySettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsApi.getSecuritySettings();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch security settings"
      );
    }
  }
);

export const updateSecuritySettings = createAsyncThunk(
  "settings/updateSecuritySettings",
  async (settings: SecuritySettings, { rejectWithValue }) => {
    try {
      const response = await settingsApi.updateSecuritySettings(settings);
      showToast.success("Security settings updated successfully");
      return response.data;
    } catch (error: any) {
      showToast.error(error.message || "Failed to update security settings");
      return rejectWithValue(
        error.message || "Failed to update security settings"
      );
    }
  }
);

export const toggleTwoFactor = createAsyncThunk(
  "settings/toggleTwoFactor",
  async (payload: { enabled: boolean; code?: string }, { rejectWithValue }) => {
    try {
      const response = await settingsApi.toggleTwoFactor(payload.enabled, payload.code);
      showToast.success(
        `Two-factor authentication ${payload.enabled ? "enabled" : "disabled"}`
      );
      return response.data;
    } catch (error: any) {
      showToast.error(
        error.message || "Failed to toggle two-factor authentication"
      );
      return rejectWithValue(
        error.message || "Failed to toggle two-factor authentication"
      );
    }
  }
);

export const fetchPrivacySettings = createAsyncThunk(
  "settings/fetchPrivacySettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsApi.getPrivacySettings();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch privacy settings"
      );
    }
  }
);

export const updatePrivacySettings = createAsyncThunk(
  "settings/updatePrivacySettings",
  async (settings: PrivacySettings, { rejectWithValue }) => {
    try {
      const response = await settingsApi.updatePrivacySettings(settings);
      showToast.success("Privacy settings updated successfully");
      return response.data;
    } catch (error: any) {
      showToast.error(error.message || "Failed to update privacy settings");
      return rejectWithValue(
        error.message || "Failed to update privacy settings"
      );
    }
  }
);

export const fetchActiveSessions = createAsyncThunk(
  "settings/fetchActiveSessions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsApi.getActiveSessions();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch active sessions"
      );
    }
  }
);

export const terminateSession = createAsyncThunk(
  "settings/terminateSession",
  async (sessionId: string, { rejectWithValue }) => {
    try {
      await settingsApi.terminateSession(sessionId);
      showToast.success("Session terminated successfully");
      return sessionId;
    } catch (error: any) {
      showToast.error(error.message || "Failed to terminate session");
      return rejectWithValue(error.message || "Failed to terminate session");
    }
  }
);

export const terminateAllSessions = createAsyncThunk(
  "settings/terminateAllSessions",
  async (_, { rejectWithValue }) => {
    try {
      await settingsApi.terminateAllSessions();
      showToast.success("All sessions terminated successfully");
      return true;
    } catch (error: any) {
      showToast.error(error.message || "Failed to terminate all sessions");
      return rejectWithValue(
        error.message || "Failed to terminate all sessions"
      );
    }
  }
);

// Device Session Management Async Thunks
export const createDeviceSession = createAsyncThunk(
  "settings/createDeviceSession",
  async (payload: CreateDeviceSessionPayload, { rejectWithValue }) => {
    try {
      const response = await settingsApi.createDeviceSession(payload);
      return response.data;
    } catch (error: any) {
      const msg = normalizeApiErrorMessage(error, "Failed to create device session");
      showToast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const fetchDeviceSessions = createAsyncThunk(
  "settings/fetchDeviceSessions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsApi.getDeviceSessions();
      // The API returns the sessions directly as an array
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(
        normalizeApiErrorMessage(error, "Unable to load device sessions")
      );
    }
  }
);

export const logoutDevice = createAsyncThunk(
  "settings/logoutDevice",
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const response = await settingsApi.logoutDevice(sessionId);
      showToast.success("Device logged out successfully");
      return { sessionId, response: response.data };
    } catch (error: any) {
      const msg = normalizeApiErrorMessage(error, "Failed to logout device");
      showToast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const logoutAllDevices = createAsyncThunk(
  "settings/logoutAllDevices",
  async (payload: { password: string }, { rejectWithValue }) => {
    try {
      const data = await settingsApi.logoutAllDevices(payload.password);
      return data;
    } catch (error: any) {
      return rejectWithValue(
        getApiErrorPayload(error) ??
          normalizeApiErrorMessage(error, "Failed to logout all devices")
      );
    }
  }
);

// Support Request Async Thunk
export const createSupportRequest = createAsyncThunk(
  "settings/createSupportRequest",
  async (payload: SupportRequestPayload, { rejectWithValue }) => {
    try {
      const response = await settingsApi.createSupportRequest(payload);
      showToast.success("Support request submitted successfully");
      return response.data;
    } catch (error: any) {
      showToast.error(error.message || "Failed to submit support request");
      return rejectWithValue(
        error.message || "Failed to submit support request"
      );
    }
  }
);

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    clearDeviceSessionsError: (state) => {
      state.deviceSessionsError = null;
    },
    setThemeMode: (
      state,
      action: PayloadAction<"light" | "dark" | "deem" | "system">
    ) => {
      state.theme.mode = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setUpdating: (state, action: PayloadAction<boolean>) => {
      state.updating = action.payload;
    },
    setDeviceSessionsFromRealtime: (
      state,
      action: PayloadAction<DeviceSession[]>
    ) => {
      state.deviceSessions = action.payload;
      state.deviceSessionsError = null;
    },
  },
  extraReducers: (builder) => {
    // Profile
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        // API returns { user, profile, require_2fa }; store as-is for ProfileSettings
        state.profile = action.payload as any;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateProfile.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updating = false;
        const p = action.payload as {
          outcome: "otp_required" | "success";
          user?: Record<string, unknown>;
          profilePayload?: unknown;
        };
        if (p.outcome === "otp_required") {
          state.success = null;
          return;
        }
        state.success = "Profile updated successfully";
        if (p.user && typeof p.user === "object") {
          const u = p.user as Record<string, unknown>;
          if (state.profile && typeof state.profile === "object") {
            const prev = state.profile as Record<string, unknown>;
            const prevUser = prev.user as Record<string, unknown> | undefined;
            if (prevUser && typeof prevUser === "object") {
              state.profile = {
                ...prev,
                user: { ...prevUser, ...u },
              } as unknown as UserProfile;
            } else {
              state.profile = {
                ...prev,
                ...u,
              } as unknown as UserProfile;
            }
          } else {
            state.profile = { user: u } as unknown as UserProfile;
          }
        } else if (p.profilePayload !== undefined) {
          state.profile = p.profilePayload as unknown as UserProfile;
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })
      .addCase(updateProfilePhoto.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateProfilePhoto.fulfilled, (state, action) => {
        state.updating = false;
        state.profile = action.payload;
        state.success = "Profile photo updated successfully";
      })
      .addCase(updateProfilePhoto.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })
      .addCase(changePassword.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.updating = false;
        state.success = "Password changed successfully";
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })
      .addCase(resetPassword.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.updating = false;
        state.success = action.payload.message || "Password has been reset successfully.";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })
      .addCase(sendPasswordResetOTP.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(sendPasswordResetOTP.fulfilled, (state, action) => {
        state.updating = false;
        state.success = action.payload.message || "OTP sent successfully";
      })
      .addCase(sendPasswordResetOTP.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })
      .addCase(verifyPasswordResetOTP.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(verifyPasswordResetOTP.fulfilled, (state, action) => {
        state.updating = false;
        state.success = action.payload.message || "OTP verified successfully";
      })
      .addCase(verifyPasswordResetOTP.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })
      .addCase(changePasswordWithOTP.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(changePasswordWithOTP.fulfilled, (state, action) => {
        state.updating = false;
        state.success = action.payload.message || "Password changed successfully";
      })
      .addCase(changePasswordWithOTP.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })
      .addCase(requestProfileChange.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(requestProfileChange.fulfilled, (state) => {
        state.updating = false;
        state.success = "OTP sent successfully";
      })
      .addCase(requestProfileChange.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })
      .addCase(verifyProfileChange.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(verifyProfileChange.fulfilled, (state) => {
        state.updating = false;
        state.success = "Profile updated successfully";
      })
      .addCase(verifyProfileChange.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      });

    // Theme
    builder
      .addCase(fetchTheme.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTheme.fulfilled, (state, action) => {
        state.loading = false;
        state.theme = action.payload;
      })
      .addCase(fetchTheme.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateTheme.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateTheme.fulfilled, (state, action) => {
        state.updating = false;
        state.theme = action.payload;
        state.success = "Theme updated successfully";
      })
      .addCase(updateTheme.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      });

    // Security
    builder
      .addCase(fetchSecuritySettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSecuritySettings.fulfilled, (state, action) => {
        state.loading = false;
        state.security = action.payload;
      })
      .addCase(fetchSecuritySettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateSecuritySettings.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateSecuritySettings.fulfilled, (state, action) => {
        state.updating = false;
        state.security = action.payload;
        state.success = "Security settings updated successfully";
      })
      .addCase(updateSecuritySettings.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })
      .addCase(toggleTwoFactor.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(toggleTwoFactor.fulfilled, (state, action) => {
        state.updating = false;
        state.security = action.payload;
        state.success = "Two-factor authentication updated successfully";
      })
      .addCase(toggleTwoFactor.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      });

    // Privacy
    builder
      .addCase(fetchPrivacySettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrivacySettings.fulfilled, (state, action) => {
        state.loading = false;
        state.privacy = action.payload;
      })
      .addCase(fetchPrivacySettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updatePrivacySettings.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updatePrivacySettings.fulfilled, (state, action) => {
        state.updating = false;
        state.privacy = action.payload;
        state.success = "Privacy settings updated successfully";
      })
      .addCase(updatePrivacySettings.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      });

    // Sessions
    builder
      .addCase(fetchActiveSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveSessions.fulfilled, (state, action) => {
        state.loading = false;
        // Store sessions in a separate field if needed
      })
      .addCase(fetchActiveSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(terminateSession.fulfilled, (state) => {
        state.success = "Session terminated successfully";
      })
      .addCase(terminateAllSessions.fulfilled, (state) => {
        state.success = "All sessions terminated successfully";
      });

    // Device Sessions
    builder
      .addCase(createDeviceSession.pending, (state) => {
        state.deviceSessionsLoading = true;
        state.deviceSessionsError = null;
      })
      .addCase(createDeviceSession.fulfilled, (state, action) => {
        state.deviceSessionsLoading = false;
        if (Array.isArray(action.payload)) {
          state.deviceSessions.push(...action.payload);
        } else {
          state.deviceSessions.push(action.payload);
        }
      })
      .addCase(createDeviceSession.rejected, (state, action) => {
        state.deviceSessionsLoading = false;
        state.deviceSessionsError = action.payload as string;
      })
      .addCase(fetchDeviceSessions.pending, (state) => {
        state.deviceSessionsLoading = true;
        state.deviceSessionsError = null;
      })
      .addCase(fetchDeviceSessions.fulfilled, (state, action) => {
        state.deviceSessionsLoading = false;
        logger.debug('dashboard', 
          "Redux: fetchDeviceSessions.fulfilled payload:",
          action.payload
        );
        logger.debug('dashboard', "Redux: payload type:", typeof action.payload);
        logger.debug('dashboard', "Redux: is array:", Array.isArray(action.payload));
        state.deviceSessions = action.payload;
      })
      .addCase(fetchDeviceSessions.rejected, (state, action) => {
        state.deviceSessionsLoading = false;
        state.deviceSessionsError = action.payload as string;
      })
      .addCase(logoutDevice.fulfilled, (state, action) => {
        state.deviceSessions = state.deviceSessions.filter(
          (session) => session.session_id !== action.payload.sessionId
        );
        state.success = "Device logged out successfully";
      })
      .addCase(logoutAllDevices.fulfilled, (state) => {
        state.deviceSessions = [];
        state.deviceSessionsError = null;
        state.success = "All devices logged out successfully";
      })
      .addCase(logoutAllDevices.rejected, (state) => {
        state.deviceSessionsError = null;
      });

    // Support Request
    builder
      .addCase(createSupportRequest.pending, (state) => {
        state.supportRequestLoading = true;
        state.supportRequestError = null;
      })
      .addCase(createSupportRequest.fulfilled, (state, action) => {
        state.supportRequestLoading = false;
        state.success = "Support request submitted successfully";
      })
      .addCase(createSupportRequest.rejected, (state, action) => {
        state.supportRequestLoading = false;
        state.supportRequestError = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearSuccess,
  clearDeviceSessionsError,
  setThemeMode,
  setLoading,
  setUpdating,
  setDeviceSessionsFromRealtime,
} = settingsSlice.actions;

export default settingsSlice.reducer;
