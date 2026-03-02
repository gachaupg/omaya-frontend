import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { get, post, del } from "@/lib/apiClient";
import { API_CONFIG } from "@/lib/appConfig";

export interface AssetDetails {
  symbol: string;
  name: string;
  image: string | null;
}

export interface UserWalletAddress {
  id: number;
  user_wallet_address_id: string;
  address: string;
  account_name: string;
  label: string;
  network: string;
  asset: string;
  asset_details?: AssetDetails;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface ListResponse {
  count: number;
  results: UserWalletAddress[];
}

interface CreatePayload {
  address: string;
  account_name: string;
  label: string;
  asset: string;
  network?: string;
}

interface CreateResponse {
  message: string;
  data: UserWalletAddress;
}

export const fetchUserWalletAddresses = createAsyncThunk<
  UserWalletAddress[],
  void | { network?: string; asset?: string; status?: string },
  { rejectValue: string }
>(
  "userWalletAddresses/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const searchParams = new URLSearchParams();
      const opts = params && typeof params === "object" ? params : undefined;
      if (opts) {
        if (opts.network) searchParams.set("network", opts.network);
        if (opts.asset) searchParams.set("asset", opts.asset);
        if (opts.status) searchParams.set("status", opts.status);
      }
      const query = searchParams.toString();
      const url = query
        ? `${API_CONFIG.PAYMENTS.USER_WALLET_ADDRESSES}?${query}`
        : API_CONFIG.PAYMENTS.USER_WALLET_ADDRESSES;
      const response = await get<ListResponse>(url);
      const data = response.data;
      return data?.results ?? [];
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Failed to fetch wallet addresses"
      );
    }
  }
);

export const createUserWalletAddress = createAsyncThunk<
  UserWalletAddress,
  CreatePayload,
  { rejectValue: string }
>(
  "userWalletAddresses/create",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await post<CreateResponse>(
        API_CONFIG.PAYMENTS.USER_WALLET_ADDRESSES,
        payload
      );
      const data = response.data;
      if (!data?.data) {
        return rejectWithValue(data?.message || "Invalid response");
      }
      return data.data;
    } catch (err: any) {
      const errorData = err?.response?.data;
      // Handle validation errors like {"address":["Invalid address format"]}
      if (errorData?.address && Array.isArray(errorData.address)) {
        return rejectWithValue(errorData.address[0] || "Invalid address format");
      }
      if (typeof errorData === "object" && errorData !== null) {
        // Try to find first error message in object
        const firstError = Object.values(errorData).find((val) => 
          Array.isArray(val) && val.length > 0
        ) as string[] | undefined;
        if (firstError && firstError[0]) {
          return rejectWithValue(firstError[0]);
        }
      }
      return rejectWithValue(
        errorData?.message || err?.message || "Failed to create wallet address"
      );
    }
  }
);

export const deleteUserWalletAddress = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  "userWalletAddresses/delete",
  async (uuid, { rejectWithValue }) => {
    try {
      await del(API_CONFIG.PAYMENTS.USER_WALLET_ADDRESS(uuid));
      return uuid;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Failed to delete wallet address"
      );
    }
  }
);

interface UserWalletAddressesState {
  addresses: UserWalletAddress[];
  loading: boolean;
  error: string | null;
  createLoading: boolean;
  createError: string | null;
  createSuccess: boolean;
  deleteLoading: string | null;
}

const initialState: UserWalletAddressesState = {
  addresses: [],
  loading: false,
  error: null,
  createLoading: false,
  createError: null,
  createSuccess: false,
  deleteLoading: null,
};

const userWalletAddressesSlice = createSlice({
  name: "userWalletAddresses",
  initialState,
  reducers: {
    clearCreateStatus(state) {
      state.createError = null;
      state.createSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserWalletAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserWalletAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload;
      })
      .addCase(fetchUserWalletAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch";
      })
      .addCase(createUserWalletAddress.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createUserWalletAddress.fulfilled, (state, action) => {
        state.createLoading = false;
        state.createSuccess = true;
        if (!state.addresses.some((a) => a.user_wallet_address_id === action.payload.user_wallet_address_id)) {
          state.addresses = [action.payload, ...state.addresses];
        }
      })
      .addCase(createUserWalletAddress.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload ?? "Failed to create";
      })
      .addCase(deleteUserWalletAddress.pending, (state, action) => {
        state.deleteLoading = action.meta.arg;
      })
      .addCase(deleteUserWalletAddress.fulfilled, (state, action) => {
        state.deleteLoading = null;
        state.addresses = state.addresses.filter(
          (a) => a.user_wallet_address_id !== action.payload
        );
      })
      .addCase(deleteUserWalletAddress.rejected, (state) => {
        state.deleteLoading = null;
      });
  },
});

export const { clearCreateStatus } = userWalletAddressesSlice.actions;
export default userWalletAddressesSlice.reducer;
