import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { marketingApi } from "../api";
import { HighlightStatistics, HighlightStatisticsState } from "../types";
import { MARKETING_HIGHLIGHT_STATS } from "@/lib/constants/marketingHighlightStats";

// Initial state
const initialState: HighlightStatisticsState = {
  statistics: MARKETING_HIGHLIGHT_STATS,
  loading: false,
  error: null,
};

// Async thunk to fetch highlight statistics
export const fetchHighlightStatistics = createAsyncThunk(
  "marketing/fetchHighlightStatistics",
  async () => MARKETING_HIGHLIGHT_STATS
);

// Create the slice
const statisticsSlice = createSlice({
  name: "statistics",
  initialState,
  reducers: {
    // Clear statistics
    clearStatistics: (state) => {
      state.statistics = null;
      state.error = null;
    },
    // Set statistics manually (for testing or fallback)
    setStatistics: (state, action: PayloadAction<HighlightStatistics>) => {
      state.statistics = action.payload;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch highlight statistics
      .addCase(fetchHighlightStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHighlightStatistics.fulfilled, (state) => {
        state.loading = false;
        state.statistics = MARKETING_HIGHLIGHT_STATS;
        state.error = null;
      })
      .addCase(fetchHighlightStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.statistics = MARKETING_HIGHLIGHT_STATS;
      });
  },
});

// Export actions
export const { clearStatistics, setStatistics } = statisticsSlice.actions;

// Export reducer
export default statisticsSlice.reducer;


