// File: features/p2p/slices/standardSliceTemplate.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { StandardError, ErrorHandler } from "@/lib/types/error";

interface StandardState<T> {
  data: T | null;
  loading: boolean;
  error: StandardError | null;
  lastUpdated: number | null;
}

export const createStandardAsyncThunk = <TReturned, TArg = void>(
  typePrefix: string,
  apiCall: (arg: TArg) => Promise<TReturned>
) => {
  return createAsyncThunk<TReturned, TArg, { rejectValue: StandardError }>(
    typePrefix,
    async (arg, { rejectWithValue }) => {
      try {
        return await apiCall(arg);
      } catch (error) {
        const standardError = ErrorHandler.fromApiError(error);
        return rejectWithValue(standardError);
      }
    }
  );
};

export const createStandardSlice = <T>(
  name: string,
  initialData: T | null = null,
  extraReducers?: any
) => {
  const initialState: StandardState<T> = {
    data: initialData,
    loading: false,
    error: null,
    lastUpdated: null,
  };

  return createSlice({
    name,
    initialState,
    reducers: {
      clearError: (state) => {
        state.error = null;
      },
      setLoading: (state, action: PayloadAction<boolean>) => {
        state.loading = action.payload;
      },
    },
    extraReducers: (builder) => {
      // Standard async thunk handlers
      if (extraReducers) {
        extraReducers(builder);
      }
    },
  });
};
