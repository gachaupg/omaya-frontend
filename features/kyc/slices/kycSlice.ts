/**
 * kycSlice.ts – KYC state management
 */
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { API_CONFIG } from "@/lib/appConfig";
import { get, post, AxiosError } from "@/lib/apiClient";
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

// Helper to handle API errors
const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
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
      // If kyc_images are provided, send as FormData
      if (payload.kyc_images && payload.kyc_images.length > 0) {
        const formData = new FormData();
        formData.append('user_id', payload.user_id);
        formData.append('status', payload.status.toString());
        
        if (payload.verification_method) {
          formData.append('verification_method', payload.verification_method);
        }
        if (payload.country) {
          formData.append('country', payload.country);
        }
        if (payload.document_type) {
          formData.append('document_type', payload.document_type);
        }
        if (payload.document_number) {
          formData.append('document_number', payload.document_number);
        }
        if (payload.face_data) {
          formData.append('face_data', JSON.stringify(payload.face_data));
        }
        if (payload.facial_id) {
          formData.append('facial_id', payload.facial_id);
        }
        
        // Append all images
        payload.kyc_images.forEach((image, index) => {
          if (image) {
            formData.append('kyc_images', image);
          }
        });
        
        // Send FormData
        const response = await post<KYCVerificationResponse>(
          API_CONFIG.AUTH.KYC_VERIFY,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        return response.data;
      } else {
        // Send as JSON if no images
        const response = await post<KYCVerificationResponse>(
          API_CONFIG.AUTH.KYC_VERIFY,
          payload
        );
        return response.data;
      }
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
