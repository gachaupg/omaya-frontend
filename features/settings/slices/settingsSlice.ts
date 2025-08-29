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
} from "../types";
import { showToast } from "@/lib/utils/toast";

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
};

// Async thunks
export const fetchProfile = createAsyncThunk(
  "settings/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsApi.getProfile();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch profile");
    }
  }
);

export const updateProfile = createAsyncThunk(
  "settings/updateProfile",
  async (data: ProfileUpdateRequest, { rejectWithValue }) => {
    try {
      const response = await settingsApi.updateProfile(data);
      showToast.success("Profile updated successfully");
      return response.data;
    } catch (error: any) {
      showToast.error(error.message || "Failed to update profile");
      return rejectWithValue(error.message || "Failed to update profile");
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
  async (enabled: boolean, { rejectWithValue }) => {
    try {
      const response = await settingsApi.toggleTwoFactor(enabled);
      showToast.success(
        `Two-factor authentication ${enabled ? "enabled" : "disabled"}`
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
      showToast.error(error.message || "Failed to create device session");
      return rejectWithValue(
        error.message || "Failed to create device session"
      );
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
        error.message || "Failed to fetch device sessions"
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
      showToast.error(error.message || "Failed to logout device");
      return rejectWithValue(error.message || "Failed to logout device");
    }
  }
);

export const logoutAllDevices = createAsyncThunk(
  "settings/logoutAllDevices",
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsApi.logoutAllDevices();
      showToast.success("All devices logged out successfully");
      return response.data;
    } catch (error: any) {
      showToast.error(error.message || "Failed to logout all devices");
      return rejectWithValue(error.message || "Failed to logout all devices");
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
    setThemeMode: (
      state,
      action: PayloadAction<"light" | "dark" | "system">
    ) => {
      state.theme.mode = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setUpdating: (state, action: PayloadAction<boolean>) => {
      state.updating = action.payload;
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
        state.profile = action.payload;
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
        state.profile = action.payload;
        state.success = "Profile updated successfully";
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
        console.log(
          "Redux: fetchDeviceSessions.fulfilled payload:",
          action.payload
        );
        console.log("Redux: payload type:", typeof action.payload);
        console.log("Redux: is array:", Array.isArray(action.payload));
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
      .addCase(logoutAllDevices.fulfilled, (state, action) => {
        state.deviceSessions = [];
        state.success = "All devices logged out successfully";
      });
  },
});

export const {
  clearError,
  clearSuccess,
  setThemeMode,
  setLoading,
  setUpdating,
} = settingsSlice.actions;

export default settingsSlice.reducer;
