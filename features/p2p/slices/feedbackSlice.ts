import {
  createStandardAsyncThunk,
  createStandardSlice,
} from "./standardSliceTemplate";
import { Feedback } from "../types";
import { getFeedbackReviews } from "../api";

export const fetchFeedback = createStandardAsyncThunk<Feedback[]>(
  "feedback/fetchFeedback",
  async () => await getFeedbackReviews()
);

const feedbackSlice = createStandardSlice<Feedback[]>(
  "feedback",
  [],
  (builder: any) => {
    builder
      .addCase(fetchFeedback.pending, (state: any) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeedback.fulfilled, (state: any, action: any) => {
        state.loading = false;
        state.data = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchFeedback.rejected, (state: any, action: any) => {
        state.loading = false;
        state.error = action.payload || null;
      });
  }
);

export const { clearError, setLoading } = feedbackSlice.actions;
export default feedbackSlice.reducer;
