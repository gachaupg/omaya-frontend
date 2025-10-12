import { apiClient } from "@/lib/apiClient";
import { withRetry } from "@/lib/utils/retry";
import {
  ProfileUpdateRequest,
  PasswordChangeRequest,
  ThemeSettings,
  SecuritySettings,
  PrivacySettings,
  ProfileUpdateResponse,
  PasswordChangeResponse,
  ThemeUpdateResponse,
  SecurityUpdateResponse,
  PrivacyUpdateResponse,
  SessionsResponse,
  CreateDeviceSessionPayload,
  DeviceSessionsResponse,
  LogoutDeviceResponse,
  LogoutAllDevicesResponse,
  SupportRequestPayload,
  SupportRequestResponse,
  CashWithdrawalRequest,
  CashWithdrawalResponse,
} from "./types";

const SETTINGS_API_BASE = "/api";

export const settingsApi = {
  // Profile Management
  getProfile: async (): Promise<ProfileUpdateResponse> => {
    return withRetry(async () => {
      const response = await apiClient.get(`${SETTINGS_API_BASE}/profile`);
      return response.data;
    });
  },

  updateProfile: async (
    data: ProfileUpdateRequest
  ): Promise<ProfileUpdateResponse> => {
    return withRetry(async () => {
      const response = await apiClient.put(
        `${SETTINGS_API_BASE}/profile`,
        data
      );
      return response.data;
    });
  },

  updateProfilePhoto: async (photo: File): Promise<ProfileUpdateResponse> => {
    return withRetry(async () => {
      const formData = new FormData();
      formData.append("photo", photo);

      const response = await apiClient.put(
        `${SETTINGS_API_BASE}/profile/photo`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    });
  },

  // Password Management
  changePassword: async (
    data: PasswordChangeRequest
  ): Promise<PasswordChangeResponse> => {
    return withRetry(async () => {
      const response = await apiClient.put(
        `${SETTINGS_API_BASE}/password`,
        data
      );
      return response.data;
    });
  },

  // Theme Management
  getTheme: async (): Promise<ThemeUpdateResponse> => {
    return withRetry(async () => {
      const response = await apiClient.get(`${SETTINGS_API_BASE}/theme`);
      return response.data;
    });
  },

  updateTheme: async (theme: ThemeSettings): Promise<ThemeUpdateResponse> => {
    return withRetry(async () => {
      const response = await apiClient.put(`${SETTINGS_API_BASE}/theme`, theme);
      return response.data;
    });
  },

  // Security Settings
  getSecuritySettings: async (): Promise<SecurityUpdateResponse> => {
    return withRetry(async () => {
      const response = await apiClient.get(`${SETTINGS_API_BASE}/security`);
      return response.data;
    });
  },

  updateSecuritySettings: async (
    settings: SecuritySettings
  ): Promise<SecurityUpdateResponse> => {
    return withRetry(async () => {
      const response = await apiClient.put(
        `${SETTINGS_API_BASE}/security`,
        settings
      );
      return response.data;
    });
  },

  toggleTwoFactor: async (
    enabled: boolean
  ): Promise<SecurityUpdateResponse> => {
    return withRetry(async () => {
      if (enabled) {
        // Enable 2FA
        const response = await apiClient.post("/api/2fa/enable/");
        return response.data;
      } else {
        // Disable 2FA
        const response = await apiClient.post("/api/2fa/disable/");
        return response.data;
      }
    });
  },

  // Privacy Settings
  getPrivacySettings: async (): Promise<PrivacyUpdateResponse> => {
    return withRetry(async () => {
      const response = await apiClient.get(`${SETTINGS_API_BASE}/privacy`);
      return response.data;
    });
  },

  updatePrivacySettings: async (
    settings: PrivacySettings
  ): Promise<PrivacyUpdateResponse> => {
    return withRetry(async () => {
      const response = await apiClient.put(
        `${SETTINGS_API_BASE}/privacy`,
        settings
      );
      return response.data;
    });
  },

  // Session Management
  getActiveSessions: async (): Promise<SessionsResponse> => {
    return withRetry(async () => {
      const response = await apiClient.get(`${SETTINGS_API_BASE}/sessions`);
      return response.data;
    });
  },

  terminateSession: async (sessionId: string): Promise<SessionsResponse> => {
    return withRetry(async () => {
      const response = await apiClient.delete(
        `${SETTINGS_API_BASE}/sessions/${sessionId}`
      );
      return response.data;
    });
  },

  terminateAllSessions: async (): Promise<SessionsResponse> => {
    return withRetry(async () => {
      const response = await apiClient.delete(`${SETTINGS_API_BASE}/sessions`);
      return response.data;
    });
  },

  // KYC Management
  getKYCStatus: async (): Promise<any> => {
    return withRetry(async () => {
      const response = await apiClient.get(`${SETTINGS_API_BASE}/kyc`);
      return response.data;
    });
  },

  submitKYC: async (kycData: FormData): Promise<any> => {
    return withRetry(async () => {
      const response = await apiClient.post(
        `${SETTINGS_API_BASE}/kyc`,
        kycData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    });
  },

  // Device Session Management
  createDeviceSession: async (
    payload: CreateDeviceSessionPayload
  ): Promise<DeviceSessionsResponse> => {
    return withRetry(async () => {
      const response = await apiClient.post(
        `${SETTINGS_API_BASE}/devices/create/`,
        payload
      );
      return response.data;
    });
  },

  getDeviceSessions: async (): Promise<DeviceSessionsResponse> => {
    return withRetry(async () => {
      const response = await apiClient.get(
        `${SETTINGS_API_BASE}/device-sessions/`
      );
      return response.data;
    });
  },

  logoutDevice: async (sessionId: string): Promise<LogoutDeviceResponse> => {
    return withRetry(async () => {
      const response = await apiClient.post(
        `${SETTINGS_API_BASE}/device-sessions/logout/${sessionId}/`
      );
      return response.data;
    });
  },

  logoutAllDevices: async (): Promise<LogoutAllDevicesResponse> => {
    return withRetry(async () => {
      const response = await apiClient.post(
        `${SETTINGS_API_BASE}/device-sessions/logout-all/`
      );
      return response.data;
    });
  },

  // Support Request
  createSupportRequest: async (
    payload: SupportRequestPayload
  ): Promise<SupportRequestResponse> => {
    return withRetry(async () => {
      const formData = new FormData();
      formData.append("email_address", payload.email_address);
      formData.append("question", payload.question);
      
      if (payload.supporting_file) {
        formData.append("supporting_file", payload.supporting_file);
      }

      const response = await apiClient.post(
        "/trading_engine/support-requests/create/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    });
  },

  // Cash Withdrawal
  createCashWithdrawal: async (
    data: CashWithdrawalRequest
  ): Promise<CashWithdrawalResponse> => {
    return withRetry(async () => {
      const response = await apiClient.post(
        "/trading_engine/referral/withdraw/",
        data
      );
      return response.data;
    });
  },
};
