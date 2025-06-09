import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getMatchedTrades } from "../api";
import { MatchedTradesResponse } from "../types";

interface MatchedTradesState {
  data: MatchedTradesResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: MatchedTradesState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchMatchedTrades = createAsyncThunk(
  "matchedTrades/fetchMatchedTrades",
  async (page: number = 1) => {
    const response = await getMatchedTrades(page);
    return response;
  }
);

const matchedTradesSlice = createSlice({
  name: "matchedTrades",
  initialState,
  reducers: {
    clearMatchedTrades: (state) => {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatchedTrades.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMatchedTrades.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchMatchedTrades.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch matched trades";
      });
  },
});

export const { clearMatchedTrades } = matchedTradesSlice.actions;
export default matchedTradesSlice.reducer;
