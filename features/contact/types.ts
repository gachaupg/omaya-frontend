export interface ContactFormData {
  email: string;
  question: string;
}

export interface ContactSubmission {
  contact_id: string;
  email: string;
  question: string;
  submitted_at: string;
}

export interface ContactState {
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  submissions: ContactSubmission[];
}

export interface ContactApiResponse {
  contact_id: string;
  email: string;
  question: string;
  submitted_at: string;
  message?: string;
}








