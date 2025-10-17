import { apiClient } from '@/lib/apiClient';
import { API_CONFIG } from '@/lib/appConfig';
import type { ContactFormData, ContactApiResponse } from './types';

export const contactApi = {
  /**
   * Submit a support request (contact form)
   */
  submitContact: async (data: ContactFormData): Promise<ContactApiResponse> => {
    try {
      // Create FormData for file upload support
      const formData = new FormData();
      formData.append('email_address', data.email_address);
      formData.append('question', data.question);
      
      // Add file if provided
      if (data.supporting_file) {
        formData.append('supporting_file', data.supporting_file);
      }

      const response = await apiClient.post<ContactApiResponse>(
        API_CONFIG.CONTACT.SUBMIT_CONTACT,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting support request:', error);
      throw error;
    }
  },

  /**
   * Get contact submissions (if needed for admin)
   */
  getContactSubmissions: async (): Promise<ContactApiResponse[]> => {
    try {
      const response = await apiClient.get<ContactApiResponse[]>(
        API_CONFIG.CONTACT.SUBMIT_CONTACT
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching contact submissions:', error);
      throw error;
    }
  },
};

// Highlight Statistics API (for marketing page)
export interface HighlightStatistics {
  total_transactions_usdt: string;
  satisfied_clients: string;
  successful_transactions: string;
  years_of_experience: string;
}

export const marketingApi = {
  /**
   * Get highlight statistics for the marketing page
   */
  getHighlightStatistics: async (): Promise<HighlightStatistics> => {
    try {
      const response = await apiClient.get<HighlightStatistics>(
        API_CONFIG.MARKETING.HIGHLIGHT_STATISTICS
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching highlight statistics:', error);
      throw error;
    }
  },
};
