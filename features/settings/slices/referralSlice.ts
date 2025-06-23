import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getReferredUsers } from "@/features/p2p/api";
import { ReferredUser } from "@/features/p2p/types";

interface ReferralState {
  referredUsers: ReferredUser[];
  loading: boolean;
  error: string | null;
}

const initialState: ReferralState = {
  referredUsers: [],
  loading: false,
  error: null,
};

export const fetchReferredUsers = createAsyncThunk(
  "referral/fetchReferredUsers",
  async (code: string) => {
    const response = await getReferredUsers(code);
    return response;
  }
);

const referralSlice = createSlice({
  name: "referral",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReferredUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReferredUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.referredUsers = action.payload;
      })
      .addCase(fetchReferredUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch referred users";
      });
  },
});

export default referralSlice.reducer;
