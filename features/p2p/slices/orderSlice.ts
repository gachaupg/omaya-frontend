/**
 * orderSlice.ts – auto‑generated placeholder
 */
import { createSlice, createAsyncThunk, Draft } from "@reduxjs/toolkit";
import {
  getAllP2POrders,
  getAllP2PBuyandSell,
  matchP2POrder,
  getConfirmOrder,
  SingleOrder,
  SingleOrder1,
  cancelP2POrder,
  confirmP2PTrade,
  confirmTrade,
  deleteP2POrder,
  toggleP2POrderStatus,
  duplicateP2POrder,
  editP2POrder,
  updateProfile,
  getP2PProfile,
  getWithdrawalAddresses,
} from "../api";
import {
  OrderMatchRequest,
  P2POrderList,
  P2POrder,
  MatchedTrade,
  Profile,
  P2PResponse,
  WithdrawalAddressesResponse,
  PaymentDetail,
} from "../types";
import { handleP2PErrorSafe } from "../../../lib/utils/errorHandler";
import { fetchWallets } from "./walletSlice";
import { logger } from "@/lib/logger";

interface P2PState {
  p2pBuyOrders: P2POrderList;
  p2pSellOrders: P2POrderList;
  paymentLogoCache: Record<string, string | null>;
  loading: boolean;
  error: string | null;
  currentPage: number;
  matchLoading: boolean;
  matchError: string | null;
  matchSuccess: boolean;
  confirmOrder: MatchedTrade | null;
  confirmOrderLoading: boolean;
  confirmOrderError: string | null;
  singleOrder: P2POrder | null;
  singleOrderLoading: boolean;
  singleOrderError: string | null;
  cancelLoading?: boolean;
  cancelError?: string | null;
  cancelSuccess?: boolean;
  confirmTradeLoading?: boolean;
  confirmTradeError?: string | null;
  confirmTradeSuccess?: boolean;
  deleteLoading?: boolean;
  deleteError?: string | null;
  deleteSuccess?: boolean;
  toggleLoading?: boolean;
  toggleError?: string | null;
  toggleSuccess?: boolean;
  duplicateLoading?: boolean;
  duplicateError?: string | null;
  duplicateSuccess?: boolean;
  editLoading?: boolean;
  editError?: string | null;
  editSuccess?: boolean;
  updateProfileLoading?: boolean;
  updateProfileError?: string | null;
  updateProfileSuccess?: boolean;
  getP2PProfileLoading?: boolean;
  getP2PProfileError?: string | null;
  getP2PProfileSuccess?: boolean;
  getP2PProfile?: P2PResponse;
  getWithdrawalAddressesLoading?: boolean;
  getWithdrawalAddressesError?: string | null;
  getWithdrawalAddressesSuccess?: boolean;
  getWithdrawalAddresses?: WithdrawalAddressesResponse | null;
}

const resolvePaymentDetails = (
  state: Draft<P2PState>,
  paymentDetails?: PaymentDetail[]
): PaymentDetail[] => {
  // Ensure paymentDetails is a valid array
  if (!Array.isArray(paymentDetails) || paymentDetails.length === 0) {
    return [];
  }

  // Filter out any undefined/null elements and ensure they're PaymentDetail objects
  const validPaymentDetails = paymentDetails.filter(
    (detail): detail is PaymentDetail => 
      detail != null && 
      typeof detail.id === 'number' &&
      typeof detail.provider === 'string' &&
      typeof detail.payment_method === 'string' &&
      typeof detail.account_name === 'string' &&
      typeof detail.account_number === 'string'
  );

  // If no valid details after filtering, return empty array
  if (validPaymentDetails.length === 0) {
    return [];
  }

  // Ensure state exists
  if (!state) {
    // If state is not available, return payment details without caching, ensuring provider_logo is a string
    return validPaymentDetails.map((detail) => ({
      ...detail,
      provider_logo: (typeof detail?.provider_logo === "string" && detail.provider_logo.trim()
        ? detail.provider_logo.trim()
        : '') as string,
    }));
  }

  // Ensure paymentLogoCache exists - use safe assignment
  try {
    if (!state.paymentLogoCache || typeof state.paymentLogoCache !== 'object') {
      state.paymentLogoCache = {};
    }
  } catch (error) {
    // If we can't set the cache, continue without caching
    console.warn('Failed to initialize paymentLogoCache:', error);
  }

  // Get a safe reference to the cache
  const cache = state.paymentLogoCache || {};

  return validPaymentDetails.map((detail) => {
    const detailId =
      detail?.id !== undefined && detail?.id !== null
        ? String(detail.id)
        : undefined;
    const rawLogo =
      typeof detail?.provider_logo === "string" && detail.provider_logo.trim()
        ? detail.provider_logo.trim()
        : null;
    const cachedLogo = detailId ? (cache[detailId] || null) : null;
    const resolvedLogo = rawLogo || cachedLogo || null;

    // Try to update cache if possible
    if (detailId && resolvedLogo) {
      try {
        if (state.paymentLogoCache) {
          state.paymentLogoCache[detailId] = resolvedLogo;
        }
      } catch (error) {
        // Silently fail if cache update fails
        console.warn('Failed to update paymentLogoCache:', error);
      }
    }

    return {
      ...detail,
      provider_logo: resolvedLogo || '',
    } as PaymentDetail;
  }) as PaymentDetail[];
};

const resolveOrder = (
  state: Draft<P2PState>,
  order?: P2POrder | null
) => {
  if (!order) return order;
  return {
    ...order,
    payment_details: resolvePaymentDetails(state, order.payment_details),
  };
};

const resolveOrderList = (
  state: Draft<P2PState>,
  orderList?: P2POrderList | null
): P2POrderList => {
  if (!orderList) {
    return {
      next: null,
      previous: null,
      total_orders_count: 0,
      results: [],
    };
  }

  return {
    ...orderList,
    results: orderList.results?.map((order) => resolveOrder(state, order)).filter((order): order is P2POrder => order != null) || [],
  };
};

export const fetchAllP2POrders = createAsyncThunk(
  "p2pMarket/fetchAllP2POrders",
  async (page: number = 1, { rejectWithValue }) => {
    try {
      return await getAllP2POrders(page);
    } catch (err: any) {
      const msg = handleP2PErrorSafe(err);
      return rejectWithValue(msg || err.message || "Failed to fetch all orders");
    }
  }
);

export const fetchAllP2PBuyandSell = createAsyncThunk(
  "p2pMarket/fetchAllP2PBuyandSell",
  async (page: number = 1, { rejectWithValue }) => {
    try {
      return await getAllP2PBuyandSell(page);
    } catch (err: any) {
      const msg = handleP2PErrorSafe(err);
      return rejectWithValue(msg || err.message || "Failed to fetch buy and sell orders");
    }
  }
);

export const fetchWithdrawalAddresses = createAsyncThunk(
  "p2p/fetchWithdrawalAddresses",
  async (_, { rejectWithValue }) => {
    try {
      return await getWithdrawalAddresses();
    } catch (err: any) {
      const msg = handleP2PErrorSafe(err);
      return rejectWithValue(msg || err.message || "Failed to fetch withdrawal addresses");
    }
  }
);

export const matchP2POrderThunk = createAsyncThunk(
  "p2p/matchOrder",
  async (
    { id, orderData }: { id: string; orderData: OrderMatchRequest },
    { rejectWithValue }
  ) => {
    try {
      const response = await matchP2POrder(id, orderData);
      return response;
    } catch (error: any) {
      const msg = handleP2PErrorSafe(error);
      return rejectWithValue(msg || error.message || "An error occurred");
    }
  }
);

export const fetchConfirmOrder = createAsyncThunk(
  "p2p/fetchConfirmOrder",
  async (id: string, { rejectWithValue }) => {
    try {
      return await getConfirmOrder(id);
    } catch (err: any) {
      const msg = handleP2PErrorSafe(err);
      return rejectWithValue(msg || err.message || "Failed to fetch confirm order");
    }
  }
);

export const fetchSingleOrder = createAsyncThunk(
  "p2p/fetchSingleOrder",
  async (id: string, { rejectWithValue }) => {
    // Since the error suggests we're getting a P2PTrade object,
    // and the ID format looks like a UUID that could be either trade or order,
    // let's try the trade endpoint first as it's more likely to be correct
    try {
      return await SingleOrder1(id);
    } catch (err: any) {
      // If we get a 500 error from trade endpoint, it might be an order ID
      if (err.response?.status === 500) {
        try {
          return await SingleOrder(id);
        } catch (orderErr: any) {
          // If both fail with 500 errors, this might be a backend issue
          if (orderErr.response?.status === 500) {
            return rejectWithValue(
              "Backend server error. Please try again later or contact support."
            );
          }

          const msg = handleP2PErrorSafe(orderErr);
          return rejectWithValue(msg || orderErr.message || "Failed to fetch single order");
        }
      } else {
        // For non-500 errors from trade endpoint, try order endpoint as fallback
        try {
          return await SingleOrder(id);
        } catch (orderErr: any) {
          const msg = handleP2PErrorSafe(orderErr);
          return rejectWithValue(msg || orderErr.message || "Failed to fetch single order");
        }
      }
    }
  }
);

export const cancelP2POrderThunk = createAsyncThunk(
  "p2p/cancelOrder",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await cancelP2POrder(id);
      return response;
    } catch (error: any) {
      const msg = handleP2PErrorSafe(error);
      return rejectWithValue(msg || error.message || "An error occurred");
    }
  }
);

// File: features/p2p/slices/orderSlice.ts
export const confirmP2PTradeThunk = createAsyncThunk(
  "p2p/confirmTrade",
  async (id: string, { dispatch, rejectWithValue, getState }) => {
    try {
      // Step 1: Confirm the trade
      const response = await confirmP2PTrade(id);

      // Step 2: Wait for order data to be refreshed
      const refreshResult = await dispatch(fetchConfirmOrder(id));

      // Step 3: Update related data if needed
      await dispatch(fetchWallets()); // Refresh wallet balances

      return response;
    } catch (error: any) {
      // Handle specific backend errors
      if (error.message?.includes("created_at")) {
        return rejectWithValue("Trade confirmation failed due to a backend configuration issue. Please contact support.");
      }
      
      const msg = handleP2PErrorSafe(error);
      return rejectWithValue(msg || error.message || "An error occurred");
    }
  }
);

export const completeP2PTradeThunk = createAsyncThunk(
  "p2p/completeTrade",
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await confirmTrade(id);
      await dispatch(fetchConfirmOrder(id));
      return response;
    } catch (error: any) {
      // Handle specific backend errors
      if (error.message?.includes("created_at")) {
        return rejectWithValue("Trade completion failed due to a backend configuration issue. Please contact support.");
      }
      
      const msg = handleP2PErrorSafe(error);
      return rejectWithValue(msg || error.message || "An error occurred");
    }
  }
);

export const deleteP2POrderThunk = createAsyncThunk(
  "p2p/deleteOrder",
  async (id: string, { rejectWithValue }) => {
    try {
      return await deleteP2POrder(id);
    } catch (error: any) {
      const msg = handleP2PErrorSafe(error);
      return rejectWithValue(msg || error.message || "An error occurred");
    }
  }
);

export const toggleP2POrderStatusThunk = createAsyncThunk(
  "p2p/toggleOrderStatus",
  async (
    { id, status }: { id: string; status: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await toggleP2POrderStatus(id, status);
      return response;
    } catch (error: any) {
      const msg = handleP2PErrorSafe(error);
      return rejectWithValue(msg || error.message || "An error occurred");
    }
  }
);

export const duplicateP2POrderThunk = createAsyncThunk(
  "p2p/duplicateOrder",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await duplicateP2POrder(id);
      return response;
    } catch (error: any) {
      const msg = handleP2PErrorSafe(error);
      return rejectWithValue(msg || error.message || "An error occurred");
    }
  }
);

export const editP2POrderThunk = createAsyncThunk(
  "p2p/editOrder",
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      return await editP2POrder(id, data);
    } catch (error: any) {
      const msg = handleP2PErrorSafe(error);
      return rejectWithValue(msg || error.message || "An error occurred");
    }
  }
);

export const updateProfileThunk = createAsyncThunk(
  "p2p/updateProfile",
  async (data: FormData, { rejectWithValue }) => {
    try {
      return await updateProfile(data);
    } catch (error: any) {
      const msg = handleP2PErrorSafe(error);
      return rejectWithValue(msg || error.message || "An error occurred");
    }
  }
);

export const getP2PProfileThunk = createAsyncThunk(
  "p2p/getP2PProfile",
  async (_, { rejectWithValue }) => {
    try {
      return await getP2PProfile();
    } catch (error: any) {
      const msg = handleP2PErrorSafe(error);
      return rejectWithValue(msg || error.message || "An error occurred");
    }
  }
);

const p2pMarketSlice = createSlice({
  name: "p2pMarket",
  initialState: {
    p2pBuyOrders: {
      next: null,
      previous: null,
      total_orders_count: 0,
      results: [],
    },
    p2pSellOrders: {
      next: null,
      previous: null,
      total_orders_count: 0,
      results: [],
    },
    paymentLogoCache: {},
    loading: false,
    error: null,
    currentPage: 1,
    matchLoading: false,
    matchError: null,
    matchSuccess: false,
    confirmOrder: null,
    confirmOrderLoading: false,
    confirmOrderError: null,
    singleOrder: null,
    singleOrderLoading: false,
    singleOrderError: null,
    cancelLoading: false,
    cancelError: null,
    cancelSuccess: false,
    confirmTradeLoading: false,
    confirmTradeError: null,
    confirmTradeSuccess: false,
    getWithdrawalAddressesLoading: false,
    getWithdrawalAddressesError: null,
    getWithdrawalAddressesSuccess: false,
    getWithdrawalAddresses: null,
  } as P2PState,
  reducers: {
    setCurrentPage: (state, action) => {
      const newPage = action.payload;
      const oldPage = state.currentPage;
      console.log('🔴 [Redux] setCurrentPage called:', { oldPage, newPage, stack: new Error().stack });
      state.currentPage = newPage;
    },
    resetMatchState: (state) => {
      state.matchLoading = false;
      state.matchError = null;
      state.matchSuccess = false;
    },
    resetConfirmOrderState: (state) => {
      state.confirmOrder = null;
      state.confirmOrderLoading = false;
      state.confirmOrderError = null;
    },
    resetSingleOrderState: (state) => {
      state.singleOrder = null;
      state.singleOrderLoading = false;
      state.singleOrderError = null;
    },
    resetWithdrawalAddressesState: (state) => {
      state.getWithdrawalAddresses = null;
      state.getWithdrawalAddressesLoading = false;
      state.getWithdrawalAddressesError = null;
      state.getWithdrawalAddressesSuccess = false;
    },
    // WebSocket actions - intelligently merge new/updated orders
    updateOrdersFromWS: (state, action) => {
      const { buy_orders, sell_orders, pagination, full_refresh } = action.payload;
      
      // CRITICAL: Block ALL WebSocket updates when user is NOT on page 1
      // This prevents WebSocket from overwriting paginated data
      if (state.currentPage !== 1) {
        console.log('🚫 [Redux] BLOCKED ALL WebSocket updates - user on page', state.currentPage, 'not page 1');
        // Only update total counts, don't touch results at all
        if (buy_orders && pagination?.total_buy_orders !== undefined) {
          state.p2pBuyOrders = {
            ...state.p2pBuyOrders,
            total_orders_count: pagination.total_buy_orders,
          };
        }
        if (sell_orders && pagination?.total_sell_orders !== undefined) {
          state.p2pSellOrders = {
            ...state.p2pSellOrders,
            total_orders_count: pagination.total_sell_orders,
          };
        }
        return; // Exit early, don't replace ANY results
      }
      
      console.log('✅ [Redux] Applying WebSocket update - user on page 1');
      
      // Helper function to merge payment_details preserving provider_logo
      const mergePaymentDetails = (existing: PaymentDetail[], incoming: PaymentDetail[]): PaymentDetail[] => {
        if (!incoming || incoming.length === 0) {
          return existing || [];
        }
        if (!existing || existing.length === 0) {
          return incoming;
        }
        
        // Create a map of existing payment details by id
        const existingMap = new Map(existing.map(pd => [pd.id, pd]));
        
        // Merge incoming details, preserving provider_logo from existing if missing
        return incoming.map(incomingPd => {
          const existingPd = existingMap.get(incomingPd.id);
          if (existingPd) {
            // If incoming has null/missing provider_logo, preserve existing one
            return {
              ...incomingPd,
              provider_logo: incomingPd.provider_logo || existingPd.provider_logo || '',
            } as PaymentDetail;
          }
          return incomingPd;
        });
      };
      
      // Helper function to merge orders intelligently
      const mergeOrders = (existingOrders: P2POrder[], newOrders: P2POrder[]) => {
        if (!existingOrders || existingOrders.length === 0) {
          return newOrders.map((order) => resolveOrder(state, order)).filter((order): order is P2POrder => order != null);
        }
        
        const orderMap = new Map(existingOrders.map(order => [order.id, order]));
        
        // Update existing orders and add new ones, preserving payment_details
        newOrders.forEach(newOrder => {
          const existingOrder = orderMap.get(newOrder.id);
          if (existingOrder) {
            // Merge order, preserving payment_details with provider_logo
            const mergedOrder: P2POrder = {
              ...existingOrder,
              ...newOrder,
              payment_details: mergePaymentDetails(
                existingOrder.payment_details as PaymentDetail[],
                newOrder.payment_details as PaymentDetail[]
              ),
            };

            // Preserve existing advertiser photo if websocket payload omits it
            if (
              (newOrder.advertiser_photo === undefined ||
                newOrder.advertiser_photo === null ||
                newOrder.advertiser_photo === "") &&
              existingOrder.advertiser_photo
            ) {
              mergedOrder.advertiser_photo = existingOrder.advertiser_photo;
            }

            const resolved = resolveOrder(state, mergedOrder);
            if (resolved) {
              orderMap.set(newOrder.id, resolved);
            }
          } else {
            // New order, add as-is
            const resolved = resolveOrder(state, newOrder);
            if (resolved) {
              orderMap.set(newOrder.id, resolved);
            }
          }
        });
        
        const mergedResults = Array.from(orderMap.values());
        return mergedResults;
      };
      
      if (buy_orders) {
        if (full_refresh) {
          // Full refresh - replace all (only happens when on page 1)
          state.p2pBuyOrders = {
            next: null,
            previous: null,
            total_orders_count: pagination?.total_buy_orders || buy_orders.length,
            results: buy_orders.map((order: P2POrder) => resolveOrder(state, order)).filter((order: P2POrder | null | undefined): order is P2POrder => order != null),
          };
        } else {
          // Incremental update - merge new/updated orders
          const mergedOrders = mergeOrders(state.p2pBuyOrders?.results || [], buy_orders);
          state.p2pBuyOrders = {
            ...state.p2pBuyOrders,
            total_orders_count: pagination?.total_buy_orders || mergedOrders.length,
            results: mergedOrders,
          };
        }
      }
      
      if (sell_orders) {
        if (full_refresh) {
          // Full refresh - replace all (only happens when on page 1)
          state.p2pSellOrders = {
            next: null,
            previous: null,
            total_orders_count: pagination?.total_sell_orders || sell_orders.length,
            results: sell_orders.map((order: P2POrder) => resolveOrder(state, order)).filter((order: P2POrder | null | undefined): order is P2POrder => order != null),
          };
        } else {
          // Incremental update - merge new/updated orders
          const mergedOrders = mergeOrders(state.p2pSellOrders?.results || [], sell_orders);
          state.p2pSellOrders = {
            ...state.p2pSellOrders,
            total_orders_count: pagination?.total_sell_orders || mergedOrders.length,
            results: mergedOrders,
          };
        }
      }
    },
    // Action to remove a specific order (e.g., when deleted or completed)
    removeOrderFromWS: (state, action) => {
      const { orderId, orderType } = action.payload;
      
      if (orderType === 'buy') {
        state.p2pBuyOrders = {
          ...state.p2pBuyOrders,
          results: state.p2pBuyOrders?.results?.filter(order => order.id !== orderId) || [],
          total_orders_count: (state.p2pBuyOrders?.total_orders_count || 1) - 1,
        };
      } else if (orderType === 'sell') {
        state.p2pSellOrders = {
          ...state.p2pSellOrders,
          results: state.p2pSellOrders?.results?.filter(order => order.id !== orderId) || [],
          total_orders_count: (state.p2pSellOrders?.total_orders_count || 1) - 1,
        };
      }
    },
    // Action to update confirmOrder status from WebSocket
    updateConfirmOrderStatus: (state, action) => {
      const { status } = action.payload;
      
      if (state.confirmOrder) {
        state.confirmOrder = {
          ...state.confirmOrder,
          status: status,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllP2POrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllP2POrders.fulfilled, (state, action) => {
        state.loading = false;
        const { buy_orders, sell_orders } = action.payload as any;
        state.p2pBuyOrders = resolveOrderList(state, buy_orders);
        state.p2pSellOrders = resolveOrderList(state, sell_orders);
      })
      .addCase(fetchAllP2POrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAllP2PBuyandSell.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllP2PBuyandSell.fulfilled, (state, action) => {
        state.loading = false;
        const response = action.payload as any;
        
        // Log the page being fetched and current page in state
        const requestedPage = action.meta.arg || 1;
        const currentPageBeforeUpdate = state.currentPage;
        console.log('📥 [Redux] fetchAllP2PBuyandSell.fulfilled - requested page:', requestedPage, 'currentPage BEFORE update:', currentPageBeforeUpdate);
        
        // CRITICAL: Always sync currentPage with requested page
        // This ensures the page number matches what was actually fetched
        if (requestedPage !== currentPageBeforeUpdate) {
          console.log('⚠️ [Redux] Page mismatch detected! Requested:', requestedPage, 'but state had:', currentPageBeforeUpdate);
          console.log('⚠️ [Redux] Updating currentPage to match requested page:', requestedPage);
        }
        state.currentPage = requestedPage; // Always sync with requested page
        
        // The API returns buy_orders and sell_orders objects
        const buyOrders = response.buy_orders || {
          next: null,
          previous: null,
          total_orders_count: 0,
          results: []
        };
        
        const sellOrders = response.sell_orders || {
          next: null,
          previous: null,
          total_orders_count: 0,
          results: []
        };
        
        // Log the first order ID to verify we got the right page's data
        const firstBuyOrderId = buyOrders.results?.[0]?.id;
        const firstSellOrderId = sellOrders.results?.[0]?.id;
        console.log('📦 [Redux] Received orders - buy count:', buyOrders.results?.length || 0, 'sell count:', sellOrders.results?.length || 0);
        console.log('📦 [Redux] First buy order ID:', firstBuyOrderId, 'First sell order ID:', firstSellOrderId);
        
        // IMPORTANT: Update orders data
        state.p2pBuyOrders = resolveOrderList(state, buyOrders);
        state.p2pSellOrders = resolveOrderList(state, sellOrders);
        
        console.log('✅ [Redux] Updated orders, currentPage AFTER update:', state.currentPage);
      })
      .addCase(fetchAllP2PBuyandSell.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(matchP2POrderThunk.pending, (state) => {
        state.matchLoading = true;
        state.matchError = null;
        state.matchSuccess = false;
      })
      .addCase(matchP2POrderThunk.fulfilled, (state) => {
        state.matchLoading = false;
        state.matchSuccess = true;
      })
      .addCase(matchP2POrderThunk.rejected, (state, action) => {
        state.matchLoading = false;
        state.matchError = action.payload as string;
      })
      .addCase(fetchConfirmOrder.pending, (state) => {
        state.confirmOrderLoading = true;
        state.confirmOrderError = null;
      })
      .addCase(fetchConfirmOrder.fulfilled, (state, action) => {
        state.confirmOrderLoading = false;
        state.confirmOrder = action.payload;
      })
      .addCase(fetchConfirmOrder.rejected, (state, action) => {
        state.confirmOrderLoading = false;
        state.confirmOrderError = action.payload as string;
      })
      .addCase(fetchSingleOrder.pending, (state) => {
        state.singleOrderLoading = true;
        state.singleOrderError = null;
      })
      .addCase(fetchSingleOrder.fulfilled, (state, action) => {
        state.singleOrderLoading = false;
        state.singleOrder = action.payload;
      })
      .addCase(fetchSingleOrder.rejected, (state, action) => {
        state.singleOrderLoading = false;
        state.singleOrderError = action.payload as string;
      })
      .addCase(cancelP2POrderThunk.pending, (state) => {
        state.cancelLoading = true;
        state.cancelError = null;
        state.cancelSuccess = false;
      })
      .addCase(cancelP2POrderThunk.fulfilled, (state) => {
        state.cancelLoading = false;
        state.cancelSuccess = true;
      })
      .addCase(cancelP2POrderThunk.rejected, (state, action) => {
        state.cancelLoading = false;
        state.cancelError = action.payload as string;
      })
      .addCase(confirmP2PTradeThunk.pending, (state) => {
        state.confirmTradeLoading = true;
        state.confirmTradeError = null;
        state.confirmTradeSuccess = false;
      })
      .addCase(confirmP2PTradeThunk.fulfilled, (state) => {
        state.confirmTradeLoading = false;
        state.confirmTradeSuccess = true;
      })
      .addCase(confirmP2PTradeThunk.rejected, (state, action) => {
        state.confirmTradeLoading = false;
        state.confirmTradeError = action.payload as string;
      })
      .addCase(completeP2PTradeThunk.pending, (state) => {
        state.confirmTradeLoading = true;
        state.confirmTradeError = null;
        state.confirmTradeSuccess = false;
      })
      .addCase(completeP2PTradeThunk.fulfilled, (state) => {
        state.confirmTradeLoading = false;
        state.confirmTradeSuccess = true;
      })
      .addCase(completeP2PTradeThunk.rejected, (state, action) => {
        state.confirmTradeLoading = false;
        state.confirmTradeError = action.payload as string;
      })
      .addCase(deleteP2POrderThunk.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
        state.deleteSuccess = false;
      })
      .addCase(deleteP2POrderThunk.fulfilled, (state) => {
        state.deleteLoading = false;
        state.deleteSuccess = true;
      })
      .addCase(deleteP2POrderThunk.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload as string;
      })
      .addCase(toggleP2POrderStatusThunk.pending, (state) => {
        state.toggleLoading = true;
        state.toggleError = null;
        state.toggleSuccess = false;
      })
      .addCase(toggleP2POrderStatusThunk.fulfilled, (state) => {
        state.toggleLoading = false;
        state.toggleSuccess = true;
      })
      .addCase(toggleP2POrderStatusThunk.rejected, (state, action) => {
        state.toggleLoading = false;
        state.toggleError = action.payload as string;
      })
      .addCase(duplicateP2POrderThunk.pending, (state) => {
        state.duplicateLoading = true;
        state.duplicateError = null;
        state.duplicateSuccess = false;
      })
      .addCase(duplicateP2POrderThunk.fulfilled, (state) => {
        state.duplicateLoading = false;
        state.duplicateSuccess = true;
      })
      .addCase(duplicateP2POrderThunk.rejected, (state, action) => {
        state.duplicateLoading = false;
        state.duplicateError = action.payload as string;
      })
      .addCase(editP2POrderThunk.pending, (state) => {
        state.editLoading = true;
        state.editError = null;
        state.editSuccess = false;
      })
      .addCase(editP2POrderThunk.fulfilled, (state) => {
        state.editLoading = false;
        state.editSuccess = true;
      })
      .addCase(editP2POrderThunk.rejected, (state, action) => {
        state.editLoading = false;
        state.editError = action.payload as string;
      })
      .addCase(updateProfileThunk.pending, (state) => {
        state.updateProfileLoading = true;
        state.updateProfileError = null;
        state.updateProfileSuccess = false;
      })
      .addCase(updateProfileThunk.fulfilled, (state) => {
        state.updateProfileLoading = false;
        state.updateProfileSuccess = true;
      })
      .addCase(updateProfileThunk.rejected, (state, action) => {
        state.updateProfileLoading = false;
        state.updateProfileError = action.payload as string;
      })
      .addCase(getP2PProfileThunk.pending, (state) => {
        state.getP2PProfileLoading = true;
        state.getP2PProfileError = null;
      })
      .addCase(getP2PProfileThunk.fulfilled, (state, action) => {
        state.getP2PProfileLoading = false;
        state.getP2PProfile = action.payload;
      })
      .addCase(getP2PProfileThunk.rejected, (state, action) => {
        state.getP2PProfileLoading = false;
        state.getP2PProfileError = action.payload as string;
      })
      .addCase(fetchWithdrawalAddresses.pending, (state) => {
        state.getWithdrawalAddressesLoading = true;
        state.getWithdrawalAddressesError = null;
      })
      .addCase(fetchWithdrawalAddresses.fulfilled, (state, action) => {
        state.getWithdrawalAddressesLoading = false;
        state.getWithdrawalAddresses = action.payload;
        state.getWithdrawalAddressesSuccess = true;
      })
      .addCase(fetchWithdrawalAddresses.rejected, (state, action) => {
        state.getWithdrawalAddressesLoading = false;
        state.getWithdrawalAddressesError = action.payload as string;
      });
  },
});

export const {
  setCurrentPage,
  resetMatchState,
  resetConfirmOrderState,
  resetSingleOrderState,
  resetWithdrawalAddressesState,
  updateOrdersFromWS,
  removeOrderFromWS,
  updateConfirmOrderStatus,
} = p2pMarketSlice.actions;
export default p2pMarketSlice.reducer;
