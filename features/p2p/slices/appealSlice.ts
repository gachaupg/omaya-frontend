import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createAppeal } from "../api";
import { CreateAppealRequest, AppealState } from "../types";
import { AxiosError } from "axios";

export const createAppealThunk = createAsyncThunk(
  "appeal/createAppeal",
  async (data: FormData, { rejectWithValue }) => {
    try {
      return await createAppeal(data);
    } catch (err: any) {
      if (err instanceof AxiosError && err.response?.data) {
        return rejectWithValue(
          err.response.data.error ||
            err.response.data.message ||
            "Failed to create appeal"
        );
      }
      return rejectWithValue(err.message || "Failed to create appeal");
    }
  }
);

const initialState: AppealState = {
  loading: false,
  error: null,
  success: false,
};

const appealSlice = createSlice({
  name: "appeal",
  initialState,
  reducers: {
    resetAppealState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAppealThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createAppealThunk.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(createAppealThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetAppealState } = appealSlice.actions;
export default appealSlice.reducer;
export { createAppealThunk };
