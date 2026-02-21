import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { TransactionState, Transaction, TransactionUser } from "../types";
import { transactionApi } from "../api";

const initialState: TransactionState = {
  transactions: [],
  loading: false,
  error: null,
  count: 0,
  next: null,
  previous: null,
};

/** Normalize API result to Transaction; preserves asset_image and supports p2p (buyer/seller) and moneyx shapes */
function normalizeApiTransaction(raw: Record<string, unknown>): Transaction {
  const type = (raw.transaction_type as string) || (raw.type as string) || "transaction";
  const isP2P = String(type).toLowerCase().includes("p2p");
  const isMoneyx = String(type).toLowerCase() === "moneyx";

  const id = (raw.transaction_id as string) || (raw.id as string) || `tx-${Date.now()}`;
  const amount = (raw.amount as string) || (raw.total_amount_due as string) || "0";
  const timestamp = (raw.timestamp as string) || new Date().toISOString();
  const currency = (raw.currency as string) || "USD";
  const status = (raw.status as string) || "completed";
  const asset_image = (raw.asset_image as string) || null;

  let user: TransactionUser;
  let payment_provider: string;
  let photo: string | null = null;

  if (isP2P && (raw.buyer || raw.seller)) {
    const buyer = raw.buyer as { id?: number; name?: string; email?: string; photo?: string } | undefined;
    const seller = raw.seller as { id?: number; name?: string; email?: string; photo?: string } | undefined;
    user = {
      id: buyer?.id ?? seller?.id ?? 0,
      name: buyer?.name ?? seller?.name ?? "User",
      email: buyer?.email ?? seller?.email ?? "",
      photo: buyer?.photo ?? seller?.photo ?? null,
    };
    payment_provider = seller?.name ?? buyer?.name ?? "";
    photo = seller?.photo ?? buyer?.photo ?? null;
  } else if (isMoneyx && raw.user) {
    const u = raw.user as { id?: number; name?: string; email?: string; photo?: string };
    user = {
      id: u.id ?? 0,
      name: u.name ?? "User",
      email: u.email ?? "",
      photo: u.photo ?? null,
    };
    payment_provider = (raw.from_provider as string) ?? "";
    photo = (raw.from_provider_logo as string) ?? null;
  } else {
    const u = raw.user as { id?: number; name?: string; email?: string; photo?: string } | undefined;
    user = {
      id: u?.id ?? 0,
      name: u?.name ?? (raw.user_name as string) ?? "User",
      email: u?.email ?? "",
      photo: u?.photo ?? null,
    };
    payment_provider = (raw.payment_provider as string) ?? (raw.from_provider as string) ?? "";
    photo = (raw.from_provider_logo as string) ?? user.photo;
  }

  return {
    transaction_type: type,
    transaction_id: id,
    user,
    amount,
    currency,
    asset_image,
    total_amount_due: amount,
    payment_provider,
    status,
    stages: (raw.stages as string) ?? "",
    timestamp,
    to_provider: raw.to_provider as string | undefined,
    from_provider_logo: (raw.from_provider_logo as string) ?? null,
    to_provider_logo: (raw.to_provider_logo as string) ?? null,
    photo: photo ?? null,
  };
}

export const fetchTransactions = createAsyncThunk(
  "transaction/fetchTransactions",
  async (page: number | undefined, { rejectWithValue }) => {
    try {
      const response = await transactionApi.fetchTransactions(page || 1);
      const results = Array.isArray(response.results)
        ? response.results.map((r) => normalizeApiTransaction(r as unknown as Record<string, unknown>))
        : [];
      return {
        ...response,
        results,
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch transactions"
      );
    }
  }
);

const transactionSlice = createSlice({
  name: "transaction",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    prependTransaction: (state, action: PayloadAction<Transaction>) => {
      const exists = state.transactions.some(
        (t) => t.transaction_id === action.payload.transaction_id
      );
      if (!exists) {
        state.transactions.unshift(action.payload);
        state.transactions.splice(100, state.transactions.length); // Keep last 100
      }
    },
    setTransactionsFromWebSocket: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchTransactions.fulfilled,
        (state, action) => {
          state.loading = false;
          state.transactions = action.payload.results;
          state.count = action.payload.count;
          state.next = action.payload.next;
          state.previous = action.payload.previous;
        }
      )
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, prependTransaction, setTransactionsFromWebSocket } =
  transactionSlice.actions;
export default transactionSlice.reducer;
