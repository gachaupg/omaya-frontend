import { API_CONFIG } from "@/lib/appConfig";
import { HighlightStatistics } from "./types";

import { logger } from '@/lib/utils/logger';

export const marketingApi = {
  /**
   * Fetch highlight statistics from the API
   */
  getHighlightStatistics: async (): Promise<HighlightStatistics> => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.MARKETING.HIGHLIGHT_STATISTICS}`,
        {
          method: "GET",
          headers: API_CONFIG.headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('general', "Error fetching highlight statistics:", error);
      throw error;
    }
  },
};


