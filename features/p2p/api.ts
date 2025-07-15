/**
 * api.ts – auto‑generated placeholder
 */
import { del, get, patch, post, put } from "@/lib/apiClient";
import { withRetry } from "@/lib/utils/retry";
import {
  P2PDeposit,
  CreateP2PWithdrawRequest,
  P2PListResponse,
  P2PResponse,
  WithdrawalResponse,
  P2PAd,
  CreateP2PAdRequest,
  AssetsResponse,
  Wallet,
  P2PBuySellResponse,
  TransactionSummary,
  OrderMatchRequest,
  P2POrder,
  MatchedTradesResponse,
  Feedback,
  P2PTransactionResponse,
  Profile,
  ReferredUser,
  ReferralWallet,
  WithdrawalAddressesResponse,
} from "./types";
import { API_CONFIG } from "@/lib/appConfig";

// Deposit API calls
export const getDeposits = async (): Promise<P2PListResponse> => {
  return withRetry(async () => {
    const response = await get<P2PListResponse>(API_CONFIG.P2P.DEPOSITS);
    return response.data;
  });
};

export const createDeposit = async (
  formData: FormData
): Promise<P2PResponse> => {
  return withRetry(async () => {
    const response = await post<P2PResponse>(
      API_CONFIG.P2P.DEPOSITS,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  });
};

export const getDepositDetails = async (id: string): Promise<P2PDeposit> => {
  return withRetry(async () => {
    const response = await get<P2PDeposit>(`${API_CONFIG.P2P.DEPOSITS}${id}/`);
    return response.data;
  });
};

export const updateDeposit = async (
  id: string,
  data: Partial<P2PDeposit>
): Promise<{ message: string }> => {
  return withRetry(async () => {
    const response = await put<{ message: string }>(
      `${API_CONFIG.P2P.DEPOSITS}${id}/`,
      data
    );
    return response.data;
  });
};

// Withdraw API calls
export const getWithdrawals = async (): Promise<P2PListResponse> => {
  return withRetry(async () => {
    const response = await get<P2PListResponse>(API_CONFIG.P2P.WITHDRAWS);
    return response.data;
  });
};

export const createWithdrawal = async (
  data: CreateP2PWithdrawRequest
): Promise<WithdrawalResponse> => {
  return withRetry(async () => {
    const response = await post<WithdrawalResponse>(
      API_CONFIG.P2P.WITHDRAWS,
      data
    );
    return response.data;
  });
};

export const verifyWithdrawal = async (data: {
  withdrawal_id: string;
  otp: string;
}): Promise<P2PResponse> => {
  return withRetry(async () => {
    const response = await post<P2PResponse>(API_CONFIG.P2P.WITHDRAWAL_OTP, {
      withdrawal_id: data.withdrawal_id,
      otp: data.otp,
    });
    return response.data;
  });
};

// P2P Ads API calls
export const getBuyAds = async (): Promise<{
  results: P2PAd[];
  count: number;
}> => {
  return withRetry(async () => {
    const response = await get<{ results: P2PAd[]; count: number }>(
      API_CONFIG.P2P.BUY_ADS
    );
    return response.data;
  });
};

export const getSellAds = async (): Promise<{
  results: P2PAd[];
  count: number;
}> => {
  return withRetry(async () => {
    const response = await get<{ results: P2PAd[]; count: number }>(
      API_CONFIG.P2P.SELL_ADS
    );
    return response.data;
  });
};

export const createBuyAd = async (data: CreateP2PAdRequest): Promise<P2PAd> => {
  return withRetry(async () => {
    const response = await post<P2PAd>(API_CONFIG.P2P.BUY_ADS, data);
    return response.data;
  });
};

export const createSellAd = async (
  data: CreateP2PAdRequest
): Promise<P2PAd> => {
  return withRetry(async () => {
    const response = await post<P2PAd>(API_CONFIG.P2P.SELL_ADS, data);
    return response.data;
  });
};

// Assets API calls
export const getAssets = async (): Promise<AssetsResponse> => {
  return withRetry(async () => {
    const response = await get<AssetsResponse>(API_CONFIG.P2P.ASSETS);
    return response.data;
  });
};

// Wallet API calls
export const getWallets = async (): Promise<Wallet[]> => {
  return withRetry(async () => {
    const response = await get<Wallet[]>(API_CONFIG.P2P.WALLETS);
    return response.data;
  });
};

// Payment API calls
export const getAdminPaymentDetails = async (): Promise<P2PResponse> => {
  return withRetry(async () => {
    const response = await get<P2PResponse>(
      API_CONFIG.P2P.ADMIN_PAYMENT_DETAILS
    );
    return response.data;
  });
};

export const addUserPaymentDetail = async (data: {
  account_name: string;
  account_number: string;
  payment_method_name: string;
  payment_provider_name: string;
  provider_name: string;
  wallet_address?: string | null;
}): Promise<P2PResponse> => {
  return withRetry(async () => {
    const response = await post<P2PResponse>(
      API_CONFIG.P2P.USER_PAYMENT_DETAILS,
      data
    );
    return response.data;
  });
};

export const getUserPaymentDetails = async (): Promise<P2PResponse> => {
  return withRetry(async () => {
    const response = await get<P2PResponse>(
      API_CONFIG.P2P.USER_PAYMENT_DETAILS
    );
    return response.data;
  });
};

// P2P Orders API calls
export const postP2POrder = async (data: any): Promise<P2PResponse> => {
  return withRetry(async () => {
    const response = await post<P2PResponse>(API_CONFIG.P2P.ORDERS, data);
    return response.data;
  });
};

export const getAllP2POrders = async (
  page: number = 1
): Promise<P2PBuySellResponse> => {
  return withRetry(async () => {
    const response = await get<P2PBuySellResponse>(
      `${API_CONFIG.P2P.ALL_ORDERS}?page=${page}`
    );
    return response.data;
  });
};

export const getAllP2PBuyandSell = async (
  page: number = 1
): Promise<P2PBuySellResponse> => {
  return withRetry(async () => {
    const response = await get<P2PBuySellResponse>(
      `${API_CONFIG.P2P.BUY_SELL_ORDERS}?page=${page}&my_orders=true`
    );
    return response.data;
  });
};

export const getTransactionSummary = async (): Promise<TransactionSummary> => {
  return withRetry(async () => {
    const response = await get<TransactionSummary>(
      API_CONFIG.P2P.TRANSACTION_SUMMARY
    );
    return response.data;
  });
};

export const matchP2POrder = async (
  id: string,
  data: OrderMatchRequest
): Promise<{ message: string }> => {
  return withRetry(async () => {
    const response = await post<{ message: string }>(
      `${API_CONFIG.P2P.ORDER_MATCH}${id}/match/`,
      data
    );
    return response.data;
  });
};

export const getConfirmOrder = async (id: string): Promise<P2POrder> => {
  return withRetry(async () => {
    const response = await get<P2POrder>(
      `${API_CONFIG.P2P.GET_CONFIRM_ORDER}${id}/confirm/`
    );
    return response.data;
  });
};

export const SingleOrder = async (id: string): Promise<P2POrder> => {
  return withRetry(async () => {
    const response = await get<P2POrder>(
      `${API_CONFIG.P2P.SINGLE_ORDER}${id}/`
    );
    return response.data;
  });
};

export const cancelP2POrder = async (id: string): Promise<P2PResponse> => {
  return withRetry(async () => {
    const response = await post<P2PResponse>(
      `${API_CONFIG.P2P.CANCEL_ORDER}${id}/cancel/`
    );
    return response.data;
  });
};

export const createAppeal = async (data: FormData): Promise<any> => {
  return withRetry(async () => {
    const response = await post<any>(API_CONFIG.P2P.APPEALS, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  });
};

export const confirmP2PTrade = async (
  id: string
): Promise<{ message: string }> => {
  return withRetry(async () => {
    const response = await post<{ message: string }>(
      `${API_CONFIG.P2P.GET_CONFIRM_ORDER}${id}/confirm/`
    );
    return response.data;
  });
};

export const getTradeMessages = async (tradeId: string) => {
  return withRetry(async () => {
    const response = await get(`${API_CONFIG.P2P.TRADE_MESSAGES(tradeId)}`);
    return response.data;
  });
};

export const postTradeMessage = async (
  tradeId: string,
  payload: { message: string; uploaded_images: string[] }
) => {
  return withRetry(async () => {
    const response = await post(
      `${API_CONFIG.P2P.TRADE_MESSAGES(tradeId)}`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  });
};

// Matched Trades API calls
export const getMatchedTrades = async (
  page: number = 1
): Promise<MatchedTradesResponse> => {
  return withRetry(async () => {
    const response = await get<MatchedTradesResponse>(
      `${API_CONFIG.P2P.MATCHED_TRADES}?page=${page}`
    );
    return response.data;
  });
};

export const confirmTrade = async (id: string): Promise<P2PResponse> => {
  return withRetry(async () => {
    const response = await post<P2PResponse>(
      `${API_CONFIG.P2P.CONFIRM_TRADES}${id}/complete/`
    );
    return response.data;
  });
};

export const getUserTrades = async (
  queryParams: string = ""
): Promise<{
  count: number;
  next: string | null;
  previous: string | null;
  results: any[];
}> => {
  return withRetry(async () => {
    const response = await get<{
      count: number;
      next: string | null;
      previous: string | null;
      results: any[];
    }>(`${API_CONFIG.P2P.USER_TRADES}${queryParams}`);
    return response.data;
  });
};

export const getFeedbackReviews = async (): Promise<Feedback[]> => {
  return withRetry(async () => {
    const response = await get<Feedback[]>(API_CONFIG.P2P.FEEDBACK_REVIEW);
    return response.data;
  });
};

export const getAllP2PTransactions = async (
  page: number = 1
): Promise<P2PTransactionResponse> => {
  return withRetry(async () => {
    const response = await get<P2PTransactionResponse>(
      `${API_CONFIG.P2P.ALL_TRANSACTIONS}?page=${page}`
    );
    return response.data;
  });
};

export const deleteP2POrder = async (id: string): Promise<P2PResponse> => {
  return withRetry(async () => {
    const response = await del<P2PResponse>(
      `${API_CONFIG.P2P.DELETE_ORDER}${id}/`
    );
    return response.data;
  });
};

export const toggleP2POrderStatus = async (
  id: string,
  status: string
): Promise<P2PResponse> => {
  return withRetry(async () => {
    const response = await patch<P2PResponse>(
      `${API_CONFIG.P2P.TOGGLE_ORDER_STATUS}${id}/toggle-status/`,
      { status }
    );
    return response.data;
  });
};

export const duplicateP2POrder = async (id: string): Promise<P2PResponse> => {
  return withRetry(async () => {
    const response = await post<P2PResponse>(
      `${API_CONFIG.P2P.DUPLICATE_ORDER}${id}/duplicate/`
    );
    return response.data;
  });
};
export const editP2POrder = async (
  id: string,
  data: any
): Promise<P2PResponse> => {
  return withRetry(async () => {
    const response = await patch<P2PResponse>(
      `${API_CONFIG.P2P.EDIT_AD}${id}/`,
      data
    );
    return response.data;
  });
};

export const deletePaymentMethod = async (id: string): Promise<P2PResponse> => {
  return withRetry(async () => {
    const response = await del<P2PResponse>(
      `${API_CONFIG.P2P.DELETE_PAYMENT_METHOD}${id}/`
    );
    return response.data;
  });
};

export const updateProfile = async (data: FormData): Promise<P2PResponse> => {
  return withRetry(async () => {
    const response = await patch<P2PResponse>(
      API_CONFIG.P2P.UPDATE_PROFILE,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  });
};

export const getP2PProfile = async (): Promise<P2PResponse> => {
  return withRetry(async () => {
    const response = await get<P2PResponse>(API_CONFIG.P2P.UPDATE_PROFILE);
    return response.data;
  });
};

export const getReferredUsers = async (
  code: string
): Promise<ReferredUser[]> => {
  return withRetry(async () => {
    const response = await get<ReferredUser[]>(
      API_CONFIG.P2P.REFERRAL_USERS(code)
    );
    return response.data;
  });
};

export const getReferralWallet = async (): Promise<ReferralWallet> => {
  return withRetry(async () => {
    const response = await get<ReferralWallet>(API_CONFIG.P2P.REFERRAL_WALLET);
    return response.data;
  });
};

export const createReferralWithdraw = async (data: {
  requested_amount: string;
  wallet_address: string;
}) => {
  return withRetry(async () => {
    const response = await post(API_CONFIG.P2P.REFERRAL_WITHDRAW, data);
    return response.data;
  });
};

export const getWithdrawalAddresses =
  async (): Promise<WithdrawalAddressesResponse> => {
    return withRetry(async () => {
      const response = await get<WithdrawalAddressesResponse>(
        API_CONFIG.P2P.WITHDRAWAL_ADDRESSES
      );
      return response.data;
    });
  };
