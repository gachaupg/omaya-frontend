import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { marketingApi } from "../api";
import { HighlightStatistics, HighlightStatisticsState } from "../types";

// Initial state
const initialState: HighlightStatisticsState = {
  statistics: null,
  loading: false,
  error: null,
};

// Async thunk to fetch highlight statistics
export const fetchHighlightStatistics = createAsyncThunk(
  "marketing/fetchHighlightStatistics",
  async (_, { rejectWithValue }) => {
    try {
      const data = await marketingApi.getHighlightStatistics();
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch highlight statistics"
      );
    }
  }
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
      .addCase(
        fetchHighlightStatistics.fulfilled,
        (state, action: PayloadAction<HighlightStatistics>) => {
          state.loading = false;
          state.statistics = action.payload;
          state.error = null;
        }
      )
      .addCase(fetchHighlightStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // Set fallback statistics on error
        state.statistics = {
          total_transactions_usdt: "50M+",
          satisfied_clients: "5500+",
          successful_transactions: "50,000+",
          years_of_experience: "5+",
        };
      });
  },
});

// Export actions
export const { clearStatistics, setStatistics } = statisticsSlice.actions;

// Export reducer
export default statisticsSlice.reducer;


