export interface ContactFormData {
  email_address: string;
  question: string;
  supporting_file?: File | null;
}

export interface ContactSubmission {
  id: string;
  email_address: string;
  question: string;
  supporting_file?: string;
  created_at: string;
}

export interface ContactState {
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  submissions: ContactSubmission[];
}

export interface ContactApiResponse {
  id: string;
  email_address: string;
  question: string;
  supporting_file?: string;
  created_at: string;
  message?: string;
}








