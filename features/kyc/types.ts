/**
 * types.ts – KYC related types
 */

export interface KYCStatusResponse {
  is_verified: boolean;
}

export interface KYCState {
  isVerified: boolean | undefined;
  loading: boolean;
  error: string | null;
  lastChecked: string | null;
}

export interface KYCVerificationPayload {
  user_id: string;
  status: boolean;
  is_verified?: boolean;
  facial_id?: string;
  face_data?: any;
  verification_method?: string;
  kyc_images?: (File | null)[];
  face_video?: File | null;
  country?: string;
  document_type?: string;
  document_number?: string;
}

export interface KYCVerificationResponse {
  message: string;
  is_verified: boolean;
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
