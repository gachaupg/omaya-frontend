import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getMyTransactions } from "../api";

interface MyTransaction {
  transaction_id: string;
  amount: number;
  asset_image: string | null;
  currency: string;
  status: string;
  stages: string;
  transaction_harsh: string | null;
  payment_method: string;
  payment_provider: string;
  account_name: string;
  account_number: string;
  transaction_type: string;
  timestamp: string;
  additional_info: string | null;
  screenshot: string | null;
  reason: string | null;
  user_id: number;
  total_amount: number;
  user_email: string;
  user_names: string;
  user_photo: string;
  withdrawal_address: string | null;
  commission: number;
  assigned_to: any[];
  deposit_code: string;
  bank_confirmed: boolean;
  bank_confirmed_at: string | null;
  bank_reference: string | null;
  bank_amount_received: number | null;
  bank_transaction_id: string | null;
  asset: string;
  asset_symbol: string;
  network: string;
  network_type: string;
  net_amount: number;
  deposit_address: string | null;
  is_verified: boolean;
  requires_manual_review: boolean;
  admin_approved: boolean;
  screening_status: string;
  screening_source: string | null;
  screening_description: string | null;
}

interface MyTransactionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MyTransaction[];
}

interface P2PWithdrawalDepositState {
  transactions: MyTransactionsResponse | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
}

const initialState: P2PWithdrawalDepositState = {
  transactions: null,
  loading: false,
  error: null,
  currentPage: 1,
};

export const fetchMyTransactions = createAsyncThunk(
  "p2pWithdrawalDeposit/fetchMyTransactions",
  async (payload: { page: number; transactionType?: "deposit" | "withdrawal" } | number) => {
    const page = typeof payload === "number" ? payload : payload.page;
    const transactionType = typeof payload === "object" ? payload.transactionType : undefined;
    const response = await getMyTransactions(page, transactionType);
    return response;
  }
);

const p2pWithdrawalDepositSlice = createSlice({
  name: "p2pWithdrawalDeposit",
  initialState,
  reducers: {
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    resetTransactions: (state) => {
      state.transactions = null;
      state.currentPage = 1;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchMyTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch transactions";
      });
  },
});

export const { setCurrentPage, resetTransactions } = p2pWithdrawalDepositSlice.actions;
export default p2pWithdrawalDepositSlice.reducer;

