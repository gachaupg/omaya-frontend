// Export types
export type { HighlightStatistics, HighlightStatisticsState } from "./types";

// Export API
export { marketingApi } from "./api";

// Export hooks
export { useHighlightStatistics } from "./hooks/useHighlightStatistics";

// Export slice actions and reducer
export {
  fetchHighlightStatistics,
  clearStatistics,
  setStatistics,
} from "./slices/statisticsSlice";
export { default as statisticsReducer } from "./slices/statisticsSlice";


