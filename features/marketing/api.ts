import { MARKETING_HIGHLIGHT_STATS } from "@/lib/constants/marketingHighlightStats";
import { HighlightStatistics } from "./types";

/** Public marketing stats — fixed values for the home page (not API-driven). */
export const marketingApi = {
  getHighlightStatistics: async (): Promise<HighlightStatistics> => {
    return MARKETING_HIGHLIGHT_STATS;
  },
};


