/**
 * adSlice.ts – auto‑generated placeholder
 */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { P2PAd, CreateP2PAdRequest } from "../types";
import * as api from "../api";

interface P2PAdsState {
  buyAds: P2PAd[];
  sellAds: P2PAd[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  postOrderLoading: boolean;
  postOrderError: string | null;
  postOrderSuccess: boolean;
}

const initialState: P2PAdsState = {
  buyAds: [],
  sellAds: [],
  loading: false,
  error: null,
  totalCount: 0,
  postOrderLoading: false,
  postOrderError: null,
  postOrderSuccess: false,
};

// Async thunks
export const fetchBuyAds = createAsyncThunk("p2p/fetchBuyAds", async () => {
  const response = await api.getBuyAds();
  return response;
});

export const fetchSellAds = createAsyncThunk("p2p/fetchSellAds", async () => {
  const response = await api.getSellAds();
  return response;
});

export const createBuyAd = createAsyncThunk(
  "p2p/createBuyAd",
  async (data: CreateP2PAdRequest) => {
    const response = await api.createBuyAd(data);
    return response;
  }
);

export const createSellAd = createAsyncThunk(
  "p2p/createSellAd",
  async (data: CreateP2PAdRequest) => {
    const response = await api.createSellAd(data);
    return response;
  }
);

export const postP2POrderThunk = createAsyncThunk(
  "p2p/postP2POrder",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await api.postP2POrder(data);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to post order");
    }
  }
);

const p2pAdsSlice = createSlice({
  name: "p2pAds",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPostOrderStatus: (state) => {
      state.postOrderLoading = false;
      state.postOrderError = null;
      state.postOrderSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Buy Ads
      .addCase(fetchBuyAds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBuyAds.fulfilled, (state, action) => {
        state.loading = false;
        state.buyAds = action.payload.results;
        state.totalCount = action.payload.count;
      })
      .addCase(fetchBuyAds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch buy ads";
      })
      // Create Buy Ad
      .addCase(createBuyAd.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBuyAd.fulfilled, (state, action) => {
        state.loading = false;
        state.buyAds = [...state.buyAds, action.payload];
      })
      .addCase(createBuyAd.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create buy ad";
      })
      // Fetch Sell Ads
      .addCase(fetchSellAds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellAds.fulfilled, (state, action) => {
        state.loading = false;
        state.sellAds = action.payload.results;
        state.totalCount = action.payload.count;
      })
      .addCase(fetchSellAds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch sell ads";
      })
      // Create Sell Ad
      .addCase(createSellAd.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSellAd.fulfilled, (state, action) => {
        state.loading = false;
        state.sellAds = [...state.sellAds, action.payload];
      })
      .addCase(createSellAd.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create sell ad";
      })
      .addCase(postP2POrderThunk.pending, (state) => {
        state.postOrderLoading = true;
        state.postOrderError = null;
        state.postOrderSuccess = false;
      })
      .addCase(postP2POrderThunk.fulfilled, (state) => {
        state.postOrderLoading = false;
        state.postOrderSuccess = true;
      })
      .addCase(postP2POrderThunk.rejected, (state, action) => {
        state.postOrderLoading = false;
        state.postOrderError =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to post order";
        state.postOrderSuccess = false;
      });
  },
});

export const { clearError, clearPostOrderStatus } = p2pAdsSlice.actions;
export default p2pAdsSlice.reducer;
