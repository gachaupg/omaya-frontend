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
  WalletResponse,
  P2PBuySellResponse,
  P2PMyOrders,
  TransactionSummary,
  OrderMatchRequest,
  P2POrder,
  MatchedTrade,
  MatchedTradesResponse,
  Feedback,
  FeedbackSubmission,
  P2PTransactionResponse,
  Profile,
  ReferredUser,
  ReferralWallet,
  WithdrawalAddressesResponse,
  DepositAddressResponse,
  MerchantApplicationStatus,
} from "./types";
import { AdminPaymentMethod } from "./types/paymentMethods";
import { UnreadMessagesResponse } from "./slices/unreadMessagesSlice";
import { API_CONFIG } from "@/lib/appConfig";

import { logger } from '@/lib/utils/logger';

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

export const getDepositAddress = async (asset: string, network: string): Promise<DepositAddressResponse> => {
  return withRetry(async () => {
    const response = await post<DepositAddressResponse>(API_CONFIG.P2P.DEPOSIT_ADDRESSES, {
      asset,
      network
    });
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

export const resendWithdrawalOTP = async (data: {
  withdrawal_id: string;
}): Promise<P2PResponse> => {
  return withRetry(async () => {
    const response = await post<P2PResponse>(
      API_CONFIG.P2P.WITHDRAWAL_OTP_RESEND(data.withdrawal_id),
      {}
    );
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
export const getWallets = async (): Promise<WalletResponse> => {
  return withRetry(async () => {
    const response = await get<WalletResponse>(API_CONFIG.P2P.WALLETS);
    return response.data;
  });
};

// Payment API calls
const normalizeAdminPaymentProviders = (
  payload: any
): AdminPaymentMethod[] => {
  const possibleLists: any[] = [];

  if (Array.isArray(payload)) {
    possibleLists.push(payload);
  }
  if (Array.isArray(payload?.data)) {
    possibleLists.push(payload.data);
  }
  if (Array.isArray(payload?.results)) {
    possibleLists.push(payload.results);
  }
  if (Array.isArray(payload?.payment_providers)) {
    possibleLists.push(payload.payment_providers);
  }

  const providersSource = possibleLists.find((list) => list.length) || [];

  return providersSource
    .map((item: any) => {
      const paymentMethodType =
        item?.method || item?.payment_method_type || item?.payment_method_name;
      const providerName = item?.provider_name || item?.name || "";

      return {
        id:
          item?.provider_id ||
          item?.id ||
          `${providerName || "provider"}-${paymentMethodType || "method"}`,
        payment_method_type: paymentMethodType || "",
        provider_name: providerName,
        logo: item?.logo_url ?? item?.logo ?? item?.provider_logo ?? null,
        wallet_address: item?.wallet_address ?? null,
        linked_bank_provider: item?.linked_bank_provider ?? null,
      } as AdminPaymentMethod;
    })
    .filter(
      (item: AdminPaymentMethod) =>
        Boolean(item.payment_method_type) && Boolean(item.provider_name)
    );
};

export const getAdminPaymentDetails = async (): Promise<AdminPaymentMethod[]> => {
  return withRetry(async () => {
    const response = await get<any>(API_CONFIG.P2P.ADMIN_PAYMENT_DETAILS);
    const normalized = normalizeAdminPaymentProviders(response.data);
    logger.debug('p2p', "API: Normalized admin payment providers", normalized);
    return normalized;
  });
};

export const getPublicPaymentMethods = async (): Promise<P2PResponse> => {
  console.log("🌐 API: Calling getPublicPaymentMethods...");
  return withRetry(async () => {
    const response = await get<P2PResponse>(
      API_CONFIG.P2P.PUBLIC_PAYMENT_METHODS
    );
    console.log("🌐 API: Public payment methods response:", response.data);
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
  allow_auto_send?: boolean;
}): Promise<P2PResponse> => {
  logger.debug('p2p', "API: addUserPaymentDetail called with data:", data);
  logger.debug('p2p', "API: endpoint:", API_CONFIG.P2P.USER_PAYMENT_DETAILS);
  return withRetry(async () => {
    logger.debug('p2p', "API: Making POST request...");
    const response = await post<P2PResponse>(
      API_CONFIG.P2P.USER_PAYMENT_DETAILS,
      data
    );
    logger.debug('p2p', "API: Response received:", response);
    return response.data;
  });
};

export const getUserPaymentDetails = async (): Promise<P2PResponse[]> => {
  return withRetry(async () => {
    const response = await get<P2PResponse | P2PResponse[] | { results?: P2PResponse[] }>(
      API_CONFIG.P2P.USER_PAYMENT_DETAILS
    );

    const data = response.data;

    if (Array.isArray(data)) {
      return data;
    }

    if (
      data &&
      typeof data === "object" &&
      "results" in data &&
      Array.isArray((data as { results?: P2PResponse[] }).results)
    ) {
      return (data as { results: P2PResponse[] }).results;
    }

    if (data && typeof data === "object") {
      return [data as P2PResponse];
    }

    return [];
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
): Promise<P2PMyOrders> => {
  console.log('🌐 [API] getAllP2PBuyandSell called with page:', page);
  logger.debug('p2p', "API call getAllP2PBuyandSell with page:", page);
  return withRetry(async () => {
    const url = `${API_CONFIG.P2P.ALL_ORDERS}?page=${page}`;
    console.log('🌐 [API] Making request to:', url);
    logger.debug('p2p', "Making API request to:", url);
    const response = await get<P2PMyOrders>(url);
    
    // Log the actual response structure
    console.log('🌐 [API] Response structure:', {
      hasBuyOrders: !!response.data.buy_orders,
      hasSellOrders: !!response.data.sell_orders,
      buyOrdersType: typeof response.data.buy_orders,
      sellOrdersType: typeof response.data.sell_orders,
      buyOrdersIsArray: Array.isArray(response.data.buy_orders),
      sellOrdersIsArray: Array.isArray(response.data.sell_orders),
      buyOrdersKeys: response.data.buy_orders ? Object.keys(response.data.buy_orders) : [],
      sellOrdersKeys: response.data.sell_orders ? Object.keys(response.data.sell_orders) : [],
    });
    
    // Check if buy_orders has results property
    if (response.data.buy_orders && !Array.isArray(response.data.buy_orders)) {
      const buyOrdersObj = response.data.buy_orders as { results?: P2POrder[] };
      console.log('🌐 [API] buy_orders.results count:', buyOrdersObj?.results?.length || 0);
      console.log('🌐 [API] First buy order ID:', buyOrdersObj?.results?.[0]?.id);
    }
    if (response.data.sell_orders && !Array.isArray(response.data.sell_orders)) {
      const sellOrdersObj = response.data.sell_orders as { results?: P2POrder[] };
      console.log('🌐 [API] sell_orders.results count:', sellOrdersObj?.results?.length || 0);
      console.log('🌐 [API] First sell order ID:', sellOrdersObj?.results?.[0]?.id);
    }
    
    logger.debug('p2p', "API response for page", page, ":", {
      buyOrdersCount: response.data.buy_orders?.length || 0,
      sellOrdersCount: response.data.sell_orders?.length || 0,
      totalOrders: (response.data.buy_orders?.length || 0) + (response.data.sell_orders?.length || 0),
      buyPagination: response.data.buy_pagination,
      sellPagination: response.data.sell_pagination,
      firstBuyOrderId: response.data.buy_orders?.[0]?.id,
      firstSellOrderId: response.data.sell_orders?.[0]?.id,
    });
    return response.data;
  });
};

export const getMyP2POrders = async (
  page: number = 1
): Promise<P2PMyOrders> => {
  logger.debug('p2p', "API call getMyP2POrders with page:", page);
  return withRetry(async () => {
    const url = `${API_CONFIG.P2P.MY_ORDERS}?my_orders=true&page=${page}`;
    logger.debug('p2p', "Making API request to:", url);
    const response = await get<P2PMyOrders>(url);
    logger.debug('p2p', "API response for My Orders page", page, ":", {
      buyOrdersCount: response.data.buy_orders?.length || 0,
      sellOrdersCount: response.data.sell_orders?.length || 0,
      totalOrders: (response.data.buy_orders?.length || 0) + (response.data.sell_orders?.length || 0),
      buyPagination: response.data.buy_pagination,
      sellPagination: response.data.sell_pagination,
      firstBuyOrderId: response.data.buy_orders?.[0]?.id,
      firstSellOrderId: response.data.sell_orders?.[0]?.id,
    });
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
    logger.debug('p2p', "=== API REQUEST DEBUG ===");
    logger.debug('p2p', "URL:", `${API_CONFIG.P2P.ORDER_MATCH}${id}/match/`);
    logger.debug('p2p', "Data:", data);
    logger.debug('p2p', "Full URL:", `${API_CONFIG.BASE_URL}${API_CONFIG.P2P.ORDER_MATCH}${id}/match/`);
    logger.debug('p2p', "========================");
    
    const response = await post<{ message: string }>(
      `${API_CONFIG.P2P.ORDER_MATCH}${id}/match/`,
      data
    );
    return response.data;
  });
};

export const getConfirmOrder = async (id: string): Promise<MatchedTrade> => {
  return withRetry(async () => {
    const response = await get<MatchedTrade>(
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

    logger.debug('p2p', "SingleOrder API response:", {
      status: response.status,
      data: response.data,
      headers: response.headers,
    });

    return response.data;
  });
};

export const SingleOrder1 = async (id: string): Promise<P2POrder> => {
  return withRetry(async () => {
    logger.debug('p2p', "SingleOrder1 API call:", {
      url: `${API_CONFIG.P2P.MATCHED_TRADE}${id}/`,
      id,
      timestamp: new Date().toISOString(),
    });

    const response = await get<P2POrder>(
      `${API_CONFIG.P2P.MATCHED_TRADE}${id}/`
    );

    logger.debug('p2p', "SingleOrder1 API response:", {
      status: response.status,
      data: response.data,
      headers: response.headers,
    });

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
  if (!tradeId || tradeId.trim() === '') {
    throw new Error('Trade ID is required');
  }
  return withRetry(async () => {
    const response = await get(`${API_CONFIG.P2P.TRADE_MESSAGES(tradeId)}`);
    return response.data;
  });
};

export const postTradeMessage = async (
  tradeId: string,
  payload: { message: string; uploaded_images: File[]; sender_name?: string }
) => {
  if (!tradeId || tradeId.trim() === '') {
    throw new Error('Trade ID is required');
  }
  return withRetry(async () => {
    const formData = new FormData();
    formData.append('message', payload.message);
    
    // Append sender_name if provided
    if (payload.sender_name) {
      formData.append('sender_name', payload.sender_name);
    }
    
    // Append each file to FormData
    payload.uploaded_images.forEach((file, index) => {
      formData.append(`uploaded_images`, file);
    });

    const response = await post(
      `${API_CONFIG.P2P.TRADE_MESSAGES(tradeId)}`,
      formData,
      { 
        headers: { 
          "Content-Type": "multipart/form-data" 
        } 
      }
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

export const submitFeedback = async (feedbackData: FeedbackSubmission): Promise<P2PResponse> => {
  return withRetry(async () => {
    const response = await post<P2PResponse>(
      API_CONFIG.P2P.FEEDBACK_SUBMIT(feedbackData.trade_id),
      feedbackData
    );
    return response.data;
  });
};

export const getAllP2PTransactions = async (
  page: number = 1
): Promise<P2PTransactionResponse | any[]> => {
  return withRetry(async () => {
    const response = await get<P2PTransactionResponse | any[]>(
      `${API_CONFIG.P2P.USER_TRANSACTIONS}`
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
    // Use the correct profile endpoint; UPDATE_PROFILE is a PATCH route
    const response = await get<P2PResponse>(API_CONFIG.AUTH.PROFILE);
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
  withdrawal_method: string;
}) => {
  return withRetry(async () => {
    const response = await post(API_CONFIG.P2P.REFERRAL_WITHDRAW, data);
    return response.data;
  });
};

export const verifyReferralOtp = async (data: {
  withdrawal_id: string;
  otp: string;
}) => {
  return withRetry(async () => {
    const response = await post(API_CONFIG.P2P.REFERRAL_VERIFY_OTP, data);
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

// Merchant Application API calls
export const submitMerchantApplication = async (data: FormData): Promise<P2PResponse> => {
  return withRetry(async () => {
    const response = await post<P2PResponse>(
      API_CONFIG.P2P.MERCHANT_SUBMIT,
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

export const getMerchantApplicationStatus = async (): Promise<MerchantApplicationStatus> => {
  return withRetry(async () => {
    const response = await get<MerchantApplicationStatus>(
      API_CONFIG.P2P.MERCHANT_APPLICATION
    );
    return response.data;
  });
};

// Unread Messages API calls
export const getUnreadMessages = async (
  page: number = 1,
  limit: number = 20
): Promise<UnreadMessagesResponse> => {
  return withRetry(async () => {
    logger.debug("p2p", "Fetching unread messages:", { page, limit });
    const response = await get<UnreadMessagesResponse>(
      `${API_CONFIG.P2P.BASE}/messages/unread/?page=${page}&limit=${limit}`
    );
    logger.debug("p2p", "Unread messages API response:", {
      status: response.status,
      count: response.data.count,
      resultsCount: response.data.results.length,
    });
    return response.data;
  });
};

export const markMessageAsRead = async (
  messageId: string,
  tradeId: string
): Promise<P2PResponse> => {
  return withRetry(async () => {
    logger.debug("p2p", "Marking message as read:", { messageId, tradeId });
    const response = await patch<P2PResponse>(
      `${API_CONFIG.P2P.BASE}/messages/${messageId}/read/`,
      { trade_id: tradeId }
    );
    logger.debug("p2p", "Message marked as read response:", {
      status: response.status,
      data: response.data,
    });
    return response.data;
  });
};

export const markAllMessagesAsRead = async (): Promise<P2PResponse> => {
  return withRetry(async () => {
    logger.debug("p2p", "Marking all messages as read");
    const response = await patch<P2PResponse>(
      `${API_CONFIG.P2P.BASE}/messages/mark-all-read/`
    );
    logger.debug("p2p", "All messages marked as read response:", {
      status: response.status,
      data: response.data,
    });
    return response.data;
  });
};

export const getUnreadMessageCount = async (): Promise<{ count: number }> => {
  return withRetry(async () => {
    logger.debug("p2p", "Fetching unread message count");
    const response = await get<{ count: number }>(
      `${API_CONFIG.P2P.BASE}/messages/unread-count/`
    );
    logger.debug("p2p", "Unread message count response:", {
      status: response.status,
      count: response.data.count,
    });
    return response.data;
  });
};

// New API for fetching messages grouped by user
export interface GroupedMessageImage {
  id: string;
  image: string;
  image_url: string;
}

export interface GroupedMessage {
  id: string;
  content: string;
  timestamp: string;
  images: GroupedMessageImage[] | string[];
  sender_id: number | null;
  sender_name: string | null;
  sender_photo?: string | null;
  is_admin?: boolean;
  sender_role?: string;
  sender_type?: string;
  support_document?: string;
}

export interface GroupedUser {
  messages: GroupedMessage[];
  sender_id: number;
  sender_name: string;
  sender_email: string;
  sender_photo?: string | null;
  entity_id: string;
  message_type: string;
  peer_id?: number;
  peer_name?: string;
  peer_email?: string;
  peer_photo?: string | null;
}

export interface GroupedMessagesResponse {
  type: string;
  data: {
    users: GroupedUser[];
    summary: {
      total_conversations: number;
      total_messages: number;
      entity_groups: Record<string, string>;
    };
  };
}

export const getGroupedMessages = async (
  limit: number = 100
): Promise<GroupedMessagesResponse> => {
  return withRetry(async () => {
    logger.debug("p2p", "Fetching grouped messages:", { limit });
    const response = await get<GroupedMessagesResponse>(
      `/trading_engine/messages/?limit=${limit}`
    );
    logger.debug("p2p", "Grouped messages API response:", {
      status: response.status,
      usersCount: response.data.data.users.length,
      totalMessages: response.data.data.summary.total_messages,
    });
    return response.data;
  });
};