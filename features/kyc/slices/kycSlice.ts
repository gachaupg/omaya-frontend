/**
 * kycSlice.ts – KYC state management
 */
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { API_CONFIG } from "@/lib/appConfig";
import { get, post, put, AxiosError } from "@/lib/apiClient";
import { logger } from '@/lib/utils/logger';
import { getKYCContextData } from "@/features/settings/utils/sessionUtils";

import {
  KYCStatusResponse,
  KYCState,
  KYCVerificationPayload,
  KYCVerificationResponse,
  SumSubInitiatePayload,
  SumSubInitiateResponse,
  SumSubTokenPayload,
  SumSubTokenResponse,
} from "../types";

const initialState: KYCState = {
  isVerified: undefined,
  loading: false,
  error: null,
  lastChecked: null,
};

/** Multipart KYC submit (documents + selfie) needs longer than default 20s. */
const KYC_SUBMIT_TIMEOUT_MS = 120_000;
const KYC_CONTEXT_COLLECT_TIMEOUT_MS = 8_000;

const defaultKycContextFields = (): Record<string, string> => ({
  device_type: "Unknown",
  device_model: "Unknown",
  browser_type: "Unknown",
  screen_resolution: "Unknown",
  device_timezone: "Unknown",
  ip_address: "Unknown",
  ip_country: "Unknown",
  ip_region: "Unknown",
  ip_city: "Unknown",
  is_vpn: "false",
  isp: "Unknown",
  device_fingerprint: "unknown",
  unique_device_id: "unknown",
  login_patterns: "{}",
  session_duration: "0",
  failed_login_attempts: "0",
  suspicious_behavior_detected: "false",
});

// Helper to handle API errors
const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const isTimeout =
      error.code === "ECONNABORTED" ||
      /timeout.*exceeded/i.test(String(error.message || ""));
    if (isTimeout) {
      return "Upload timed out. Your face verification is still saved — please check your internet connection and tap Submit Verification again. If the problem continues, try smaller photos or contact support.";
    }

    const data = error.response?.data;
    if (data && typeof data === "object") {
      const messages: string[] = [];
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          messages.push(...value);
        } else if (typeof value === "string") {
          messages.push(value);
        }
      });
      if (messages.length > 0) {
        return messages.join("\n");
      }
    }
    return (
      data?.message ||
      data?.error ||
      data?.details ||
      data?.non_field_errors ||
      error.message ||
      "An error occurred"
    );
  }
  return "An unexpected error occurred";
};

// Async thunks
export const checkKYCStatus = createAsyncThunk<KYCStatusResponse>(
  "kyc/checkStatus",
  async (_, { rejectWithValue }) => {
    try {
      const response = await get<KYCStatusResponse>(API_CONFIG.AUTH.KYC_STATUS);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const verifyKYCStatus = createAsyncThunk<KYCVerificationResponse, KYCVerificationPayload>(
  "kyc/verifyStatus",
  async (payload, { rejectWithValue }) => {
    try {
      // The backend expects a multipart/form-data PUT to /api/kyc/submit/
      const formData = new FormData();

      // Required string fields
      if (payload.country) {
        formData.append("country", payload.country);
      }
      if (payload.document_type) {
        formData.append("document_type", payload.document_type);
      }
      if (payload.document_number) {
        formData.append("document_number", payload.document_number);
      }

      // Map kyc_images to API fields: [front, back?, selfie] for card IDs; [front, selfie] for passport
      const images = (payload.kyc_images || []).filter(
        (img): img is File => img instanceof File
      );
      const isPassport =
        String(payload.document_type || "").trim().toLowerCase() === "passport";

      let frontImage: File | undefined;
      let backImage: File | undefined;
      let selfieImage: File | undefined;

      if (isPassport && images.length === 2) {
        frontImage = images[0];
        selfieImage = images[1];
      } else {
        frontImage = images[0];
        backImage = images[1];
        selfieImage = images[2];
      }

      if (frontImage instanceof File) {
        formData.append("document_image", frontImage);
      }

      if (selfieImage instanceof File) {
        formData.append("selfie_image", selfieImage);
      }

      // Optionally send all images again as uploaded_images + image_types
      const uploadedImages: File[] = [];
      const imageTypes: string[] = [];

      if (frontImage instanceof File) {
        uploadedImages.push(frontImage);
        imageTypes.push("front");
      }
      if (backImage instanceof File) {
        uploadedImages.push(backImage);
        imageTypes.push("back");
      }
      if (selfieImage instanceof File) {
        uploadedImages.push(selfieImage);
        imageTypes.push("selfie");
      }

      if (payload.face_video instanceof File) {
        formData.append("face_video", payload.face_video);
        imageTypes.push("face_video");
      }

      uploadedImages.forEach((file) => {
        formData.append("uploaded_images", file);
      });
      if (imageTypes.length > 0) {
        imageTypes.forEach((type) => formData.append("image_types", type));
      }

      // Append device/context data for KYC (cap wait so IP lookup cannot block submit indefinitely)
      try {
        const kycContextFallback = {
          device_type: "Unknown",
          device_model: "Unknown",
          browser_type: "Unknown",
          screen_resolution: "Unknown",
          device_timezone: "Unknown",
          ip_address: "Unknown",
          ip_country: "Unknown",
          ip_region: "Unknown",
          ip_city: "Unknown",
          is_vpn: false,
          isp: "Unknown",
          device_fingerprint: "unknown",
          unique_device_id: "unknown",
          login_patterns: {},
          session_duration: 0,
          failed_login_attempts: 0,
          suspicious_behavior_detected: false,
        };
        const kycContext = await Promise.race([
          getKYCContextData().catch(() => kycContextFallback),
          new Promise<typeof kycContextFallback>((resolve) =>
            setTimeout(() => resolve(kycContextFallback), KYC_CONTEXT_COLLECT_TIMEOUT_MS)
          ),
        ]);
        formData.append("device_type", String(kycContext.device_type ?? "Unknown"));
        formData.append("device_model", String(kycContext.device_model ?? "Unknown"));
        formData.append("browser_type", String(kycContext.browser_type ?? "Unknown"));
        formData.append("screen_resolution", String(kycContext.screen_resolution ?? "Unknown"));
        formData.append("device_timezone", String(kycContext.device_timezone ?? "Unknown"));
        formData.append("ip_address", String(kycContext.ip_address ?? "Unknown"));
        formData.append("ip_country", String(kycContext.ip_country ?? "Unknown"));
        formData.append("ip_region", String(kycContext.ip_region ?? "Unknown"));
        formData.append("ip_city", String(kycContext.ip_city ?? "Unknown"));
        formData.append("is_vpn", String(kycContext.is_vpn ?? false));
        formData.append("isp", String(kycContext.isp ?? "Unknown"));
        formData.append("device_fingerprint", String(kycContext.device_fingerprint ?? "unknown"));
        formData.append("unique_device_id", String(kycContext.unique_device_id ?? "unknown"));
        formData.append("login_patterns", JSON.stringify(kycContext.login_patterns ?? {}));
        formData.append("session_duration", String(kycContext.session_duration ?? 0));
        formData.append("failed_login_attempts", String(kycContext.failed_login_attempts ?? 0));
        formData.append("suspicious_behavior_detected", String(kycContext.suspicious_behavior_detected ?? false));
      } catch (err) {
        logger.warn('kyc', "Failed to collect KYC context data:", err);
        const fallback = defaultKycContextFields();
        Object.entries(fallback).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const response = await put<any>(API_CONFIG.AUTH.KYC_SUBMIT, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: KYC_SUBMIT_TIMEOUT_MS,
      });

      // Normalise backend response into KYCVerificationResponse shape
      const data = response.data;
      const isVerified =
        typeof data?.is_verified === "boolean"
          ? data.is_verified
          : typeof data?.data?.is_verified === "boolean"
          ? data.data.is_verified
          : false;

      return {
        message: data?.message ?? "KYC details submitted successfully.",
        is_verified: isVerified,
      };
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const initiateKYCVerification = createAsyncThunk<
  SumSubInitiateResponse,
  SumSubInitiatePayload
>("kyc/initiateVerification", async (payload, { rejectWithValue }) => {
  try {
    const response = await post<SumSubInitiateResponse>(
      API_CONFIG.AUTH.SUMSUB_INITIATE,
      payload
    );
    return response.data;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const getSumSubToken = createAsyncThunk<
  SumSubTokenResponse,
  SumSubTokenPayload
>("kyc/getSumSubToken", async (payload, { rejectWithValue }) => {
  try {
    const response = await post<SumSubTokenResponse>(
      API_CONFIG.AUTH.SUMSUB_TOKEN,
      payload
    );
    return response.data;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

const kycSlice = createSlice({
  name: "kyc",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setKYCStatus(state, action: PayloadAction<boolean>) {
      state.isVerified = action.payload;
    },
    resetKYCState(state) {
      state.isVerified = undefined;
      state.loading = false;
      state.error = null;
      state.lastChecked = null;
    },
  },
  extraReducers: (builder) => {
    // Check KYC Status
    builder.addCase(checkKYCStatus.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      checkKYCStatus.fulfilled,
      (state, action: PayloadAction<KYCStatusResponse>) => {
        state.loading = false;
        state.isVerified = action.payload.is_verified;
        state.lastChecked = new Date().toISOString();
      }
    );
    builder.addCase(checkKYCStatus.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Verify KYC Status
    builder.addCase(verifyKYCStatus.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      verifyKYCStatus.fulfilled,
      (state, action: PayloadAction<KYCVerificationResponse>) => {
        state.loading = false;
        state.isVerified = action.payload.is_verified;
        state.lastChecked = new Date().toISOString();
      }
    );
    builder.addCase(verifyKYCStatus.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Initiate KYC Verification
    builder.addCase(initiateKYCVerification.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(initiateKYCVerification.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(initiateKYCVerification.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Get SumSub Token
    builder.addCase(getSumSubToken.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getSumSubToken.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(getSumSubToken.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, setKYCStatus, resetKYCState } = kycSlice.actions;
export default kycSlice.reducer;
