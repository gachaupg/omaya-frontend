/**
 * moneyXSlice.ts – MoneyX transactions state management
 */
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { API_CONFIG } from "@/lib/appConfig";
import { API_BASE_URL } from "@/config/api";
import { post, patch, get } from "@/lib/apiClient";
import axios from "axios";
import { logger } from '@/lib/utils/logger';
import {
  normalizeExpressApiErrorMessage,
} from "@/lib/utils/expressMinAmount";
import {
  resolveScamFlagDisplayError,
  SCAM_FLAG_USER_MESSAGE,
} from "@/lib/utils/scamFlagError";

import {
  CreateMoneyXTransactionPayload,
  UpdateMoneyXTransactionPayload,
  MoneyXTransaction,
  MoneyXState,
} from "../types";

const initialState: MoneyXState = {
  transaction: null,
  loading: false,
  error: null,
};

function getErrorResponseData(error: unknown): unknown {
  if (!error || typeof error !== "object") return undefined;
  return (error as { response?: { data?: unknown } }).response?.data;
}

/** Prefer scam-flag copy; never surface repeated DRF "This field is required." for scam keys. */
const handleApiError = (error: unknown): string => {
  const responseData = getErrorResponseData(error);

  // Django DEBUG HTML IntegrityError (MoneyX / exchange scam_flag null)
  if (
    typeof responseData === "string" &&
    (responseData.includes("scam_flag_confirmed") ||
      (responseData.includes("IntegrityError") &&
        responseData.includes("moneyx_moneyxtransaction")))
  ) {
    return SCAM_FLAG_USER_MESSAGE;
  }

  const scamMsg = resolveScamFlagDisplayError(error, responseData);
  if (scamMsg) return scamMsg;

  if (responseData && typeof responseData === "object" && !Array.isArray(responseData)) {
    for (const key of Object.keys(responseData as Record<string, unknown>)) {
      if (/scam[_\s-]?flag/i.test(key)) {
        return SCAM_FLAG_USER_MESSAGE;
      }
    }
  }

  let message = "An unexpected error occurred";
  if (responseData !== undefined) {
    const data = responseData;
    if (data && typeof data === "object") {
      const messages: string[] = [];
      Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
        if (/scam[_\s-]?flag/i.test(key)) {
          messages.push(SCAM_FLAG_USER_MESSAGE);
          return;
        }
        if (Array.isArray(value)) {
          messages.push(...value.map(String));
        } else if (typeof value === "string") {
          messages.push(value);
        }
      });
      if (messages.some((m) => m === SCAM_FLAG_USER_MESSAGE)) {
        return SCAM_FLAG_USER_MESSAGE;
      }
      if (messages.length > 0) {
        message = [...new Set(messages)].join("\n");
      } else {
        const record = data as Record<string, unknown>;
        message =
          String(record.message || record.error || record.details || record.non_field_errors || "") ||
          (error instanceof Error ? error.message : message) ||
          message;
      }
    } else {
      message =
        (typeof data === "string" && data) ||
        (error instanceof Error ? error.message : message) ||
        message;
    }
    return normalizeExpressApiErrorMessage(message, data, error);
  }
  return normalizeExpressApiErrorMessage(message, error);
};

// Range commission API response (no auth required)
export interface RangeCommissionResult {
  commission: string;
  is_percentage: boolean;
  range_min: string;
  range_max: string;
}

export interface RangeCommissionResponse {
  count: number;
  results: RangeCommissionResult[];
}

export type MoneyXCommissionType = "deposit" | "withdrawal";

export const fetchMoneyXCommission = createAsyncThunk<
  { commission: number; isPercentage: boolean },
  { amount: number; commissionType?: MoneyXCommissionType }
>(
  "moneyX/fetchCommission",
  async ({ amount, commissionType = "deposit" }, { rejectWithValue }) => {
    try {
      const url = `${API_BASE_URL}${API_CONFIG.MONEYX.RANGE_COMMISSION(amount, commissionType)}`;
      const response = await axios.get<RangeCommissionResponse>(url);
      const result = response.data?.results?.[0];
      if (result) {
        return {
          commission: parseFloat(result.commission) || 0,
          isPercentage: result.is_percentage ?? true,
        };
      }
      return { commission: 0, isPercentage: true };
    } catch (error) {
      logger.error('moneyX', "Failed to fetch range commission:", error);
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Async thunks
export const createMoneyXTransaction = createAsyncThunk<
  MoneyXTransaction,
  CreateMoneyXTransactionPayload
>(
  "moneyX/createTransaction",
  async (payload, { rejectWithValue }) => {
    try {
      logger.debug('moneyX', "Creating MoneyX transaction:", payload);
      const response = await post<MoneyXTransaction>(
        API_CONFIG.MONEYX.TRANSACTIONS,
        payload
      );
      logger.debug('moneyX', "MoneyX transaction created:", response.data);
      return response.data;
    } catch (error) {
      logger.error('moneyX', "Failed to create MoneyX transaction:", error);
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateMoneyXTransaction = createAsyncThunk<
  MoneyXTransaction,
  { transactionId: string; payload: UpdateMoneyXTransactionPayload }
>(
  "moneyX/updateTransaction",
  async ({ transactionId, payload }, { rejectWithValue }) => {
    try {
      logger.debug('moneyX', "Updating MoneyX transaction:", { transactionId, payload });
      const response = await patch<MoneyXTransaction>(
        API_CONFIG.MONEYX.UPDATE_TRANSACTION(transactionId),
        payload
      );
      logger.debug('moneyX', "MoneyX transaction updated:", response.data);
      return response.data;
    } catch (error) {
      logger.error('moneyX', "Failed to update MoneyX transaction:", error);
      return rejectWithValue(handleApiError(error));
    }
  }
);

const moneyXSlice = createSlice({
  name: "moneyX",
  initialState,
  reducers: {
    clearMoneyXError(state) {
      state.error = null;
    },
    resetMoneyXState() {
      return initialState;
    },
    setTransaction(state, action: PayloadAction<MoneyXTransaction | null>) {
      state.transaction = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Create Transaction
    builder.addCase(createMoneyXTransaction.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      createMoneyXTransaction.fulfilled,
      (state, action: PayloadAction<MoneyXTransaction>) => {
        state.loading = false;
        state.transaction = action.payload;
      }
    );
    builder.addCase(createMoneyXTransaction.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update Transaction
    builder.addCase(updateMoneyXTransaction.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      updateMoneyXTransaction.fulfilled,
      (state, action: PayloadAction<MoneyXTransaction>) => {
        state.loading = false;
        state.transaction = action.payload;
      }
    );
    builder.addCase(updateMoneyXTransaction.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const {
  clearMoneyXError,
  resetMoneyXState,
  setTransaction,
} = moneyXSlice.actions;

export default moneyXSlice.reducer;






