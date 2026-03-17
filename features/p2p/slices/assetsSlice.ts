import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { AssetsResponse, Asset } from "../types";
import { getAssets } from "../api";
import { sliceCache } from "@/lib/utils/sliceCache";

const ASSETS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour – refetch only after TTL to avoid refetching at all cost

interface AssetsState {
  data: AssetsResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: AssetsState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchAssets = createAsyncThunk<
  AssetsResponse,
  boolean | undefined
>(
  "assets/fetchAssets",
  async (forceRefresh = false, { rejectWithValue }) => {
    try {
      if (forceRefresh) {
        await sliceCache.delete("p2pAssets", "fetchAssets");
      }
      const data = await sliceCache.getOrSet<AssetsResponse>(
        "p2pAssets",
        "fetchAssets",
        async () => {
          const response = await getAssets();
          return response;
        },
        undefined,
        ASSETS_CACHE_TTL_MS
      );
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch assets");
    }
  }
);

const assetsSlice = createSlice({
  name: "assets",
  initialState,
  reducers: {
    clearAssetsError: (state) => {
      state.error = null;
    },
    resetAssets: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssets.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAssets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAssetsError, resetAssets } = assetsSlice.actions;
export default assetsSlice.reducer;
