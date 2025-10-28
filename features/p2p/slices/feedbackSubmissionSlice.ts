import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { submitFeedback } from "../api";
import { FeedbackSubmission, P2PResponse } from "../types";
import { handleP2PError } from "@/lib/utils/errorHandler";
import { logger } from "@/lib/utils/logger";

interface FeedbackSubmissionState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: FeedbackSubmissionState = {
  loading: false,
  error: null,
  success: false,
};

export const submitFeedbackThunk = createAsyncThunk<
  P2PResponse,
  FeedbackSubmission,
  { rejectValue: string }
>(
  "feedbackSubmission/submitFeedback",
  async (feedbackData: FeedbackSubmission, { rejectWithValue }) => {
    logger.debug("p2p", "Submitting feedback:", feedbackData);
    try {
      const response = await submitFeedback(feedbackData);
      logger.debug("p2p", "Feedback submitted successfully:", response);
      return response;
    } catch (err) {
      logger.debug("p2p", "Feedback submission error:", err);
      try {
        handleP2PError(err);
      } catch (error) {
        return rejectWithValue(
          error instanceof Error ? error.message : "Failed to submit feedback"
        );
      }
      return rejectWithValue("Failed to submit feedback");
    }
  }
);

const feedbackSubmissionSlice = createSlice({
  name: "feedbackSubmission",
  initialState,
  reducers: {
    clearFeedbackSubmissionStatus: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
    clearFeedbackSubmissionError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitFeedbackThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(submitFeedbackThunk.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.error = null;
      })
      .addCase(submitFeedbackThunk.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload || "Failed to submit feedback";
      });
  },
});

export const { clearFeedbackSubmissionStatus, clearFeedbackSubmissionError } =
  feedbackSubmissionSlice.actions;
export default feedbackSubmissionSlice.reducer;
