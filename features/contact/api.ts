import { apiClient } from '@/lib/apiClient';
import { API_CONFIG } from '@/lib/appConfig';
import type { ContactFormData, ContactApiResponse } from './types';

export const contactApi = {
  /**
   * Submit a contact form
   */
  submitContact: async (data: ContactFormData): Promise<ContactApiResponse> => {
    try {
      const response = await apiClient.post<ContactApiResponse>(
        API_CONFIG.CONTACT.SUBMIT_CONTACT,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting contact form:', error);
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


