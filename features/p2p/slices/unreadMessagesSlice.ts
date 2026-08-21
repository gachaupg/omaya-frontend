import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { applyEntityGroupStatuses } from "../utils/chatConversationStatus";
import { getUnreadMessages, markMessageAsRead, getGroupedMessages, GroupedUser } from "../api";
import { logger } from "@/lib/utils/logger";
import { RecentMessage } from "../services/unreadMessagesWebSocket";

export interface UnreadMessage {
  id: string;
  trade_id: string;
  sender_id: string;
  sender_name: string;
  sender_username?: string;
  message: string;
  timestamp: string;
  is_read: boolean;
  trade_status: string;
  trade_type: "buy" | "sell";
  counterparty_name: string;
  counterparty_photo?: string;
  amount: string;
  currency: string;
}

export interface UnreadMessagesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: UnreadMessage[];
}

interface UnreadMessagesState {
  messages: UnreadMessagesResponse;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalUnreadCount: number;
  recentMessages: RecentMessage[];
  groupedUsers: GroupedUser[];
  entityGroupStatuses: Record<string, string>;
  groupedMessagesLoading: boolean;
  groupedMessagesError: string | null;
}

const initialState: UnreadMessagesState = {
  messages: {
    count: 0,
    next: null,
    previous: null,
    results: [],
  },
  loading: false,
  error: null,
  currentPage: 1,
  totalUnreadCount: 0,
  recentMessages: [],
  groupedUsers: [],
  entityGroupStatuses: {},
  groupedMessagesLoading: false,
  groupedMessagesError: null,
};

// Async thunk to fetch unread messages
export const fetchUnreadMessages = createAsyncThunk<
  UnreadMessagesResponse,
  { page?: number; limit?: number },
  { rejectValue: string }
>(
  "unreadMessages/fetchUnreadMessages",
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      logger.debug("p2p", "Fetching unread messages for page:", page);
      const response = await getUnreadMessages(page, limit);
      logger.debug("p2p", "Unread messages fetched successfully:", {
        count: response.count,
        resultsCount: response.results.length,
      });
      return response;
    } catch (error) {
      logger.error("p2p", "Error fetching unread messages:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch unread messages"
      );
    }
  }
);

// Async thunk to mark message as read
export const markAsRead = createAsyncThunk<
  { messageId: string; tradeId: string },
  { messageId: string; tradeId: string },
  { rejectValue: string }
>(
  "unreadMessages/markAsRead",
  async ({ messageId, tradeId }, { rejectWithValue }) => {
    try {
      logger.debug("p2p", "Marking message as read:", { messageId, tradeId });
      await markMessageAsRead(messageId, tradeId);
      logger.debug("p2p", "Message marked as read successfully");
      return { messageId, tradeId };
    } catch (error) {
      logger.error("p2p", "Error marking message as read:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to mark message as read"
      );
    }
  }
);

// Async thunk to mark all messages as read
export const markAllAsRead = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  "unreadMessages/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      logger.debug("p2p", "Marking all messages as read");
      // This would be implemented in the API
      logger.debug("p2p", "All messages marked as read successfully");
      return;
    } catch (error) {
      logger.error("p2p", "Error marking all messages as read:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to mark all messages as read"
      );
    }
  }
);

// Async thunk to fetch grouped messages
export const fetchGroupedMessages = createAsyncThunk<
  { users: GroupedUser[]; entityGroupStatuses: Record<string, string> },
  { limit?: number },
  { rejectValue: string }
>(
  "unreadMessages/fetchGroupedMessages",
  async ({ limit = 100 }, { rejectWithValue }) => {
    try {
      logger.debug("p2p", "Fetching grouped messages:", { limit });
      const response = await getGroupedMessages(limit);
      const entityGroupStatuses = response.data.summary?.entity_groups ?? {};
      const users = applyEntityGroupStatuses(
        response.data.users,
        entityGroupStatuses
      );
      logger.debug("p2p", "Grouped messages fetched successfully:", {
        usersCount: users.length,
        totalMessages: response.data.summary.total_messages,
        entityGroupStatusCount: Object.keys(entityGroupStatuses).length,
      });
      return { users, entityGroupStatuses };
    } catch (error) {
      logger.error("p2p", "Error fetching grouped messages:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch grouped messages"
      );
    }
  }
);

const unreadMessagesSlice = createSlice({
  name: "unreadMessages",
  initialState,
  reducers: {
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUnreadCount: (state, action: PayloadAction<number>) => {
      state.totalUnreadCount = action.payload;
    },
    // WebSocket action to add new unread message
    addUnreadMessage: (state, action: PayloadAction<UnreadMessage>) => {
      const newMessage = action.payload;
      // Check if message already exists
      const exists = state.messages.results.find(m => m.id === newMessage.id);
      if (!exists) {
        state.messages.results.unshift(newMessage);
        state.messages.count += 1;
        state.totalUnreadCount += 1;
      }
    },
    // WebSocket action to remove message when read
    removeUnreadMessage: (state, action: PayloadAction<string>) => {
      const messageId = action.payload;
      const index = state.messages.results.findIndex(m => m.id === messageId);
      if (index !== -1) {
        state.messages.results.splice(index, 1);
        state.messages.count -= 1;
        state.totalUnreadCount = Math.max(0, state.totalUnreadCount - 1);
      }
    },
    // WebSocket action to set recent messages
    setRecentMessages: (state, action: PayloadAction<RecentMessage[]>) => {
      state.recentMessages = action.payload;
    },
    // Set grouped users
    setGroupedUsers: (state, action: PayloadAction<GroupedUser[]>) => {
      state.groupedUsers = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch unread messages
      .addCase(fetchUnreadMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUnreadMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
        state.totalUnreadCount = action.payload.count;
        state.error = null;
      })
      .addCase(fetchUnreadMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch unread messages";
      })
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const { messageId } = action.payload;
        const message = state.messages.results.find(m => m.id === messageId);
        if (message) {
          message.is_read = true;
          // Remove from unread list
          state.messages.results = state.messages.results.filter(m => m.id !== messageId);
          state.messages.count -= 1;
          state.totalUnreadCount = Math.max(0, state.totalUnreadCount - 1);
        }
      })
      // Mark all as read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.messages.results = [];
        state.messages.count = 0;
        state.totalUnreadCount = 0;
      })
      // Fetch grouped messages
      .addCase(fetchGroupedMessages.pending, (state) => {
        state.groupedMessagesLoading = true;
        state.groupedMessagesError = null;
      })
      .addCase(fetchGroupedMessages.fulfilled, (state, action) => {
        state.groupedMessagesLoading = false;
        state.groupedUsers = action.payload.users;
        state.entityGroupStatuses = action.payload.entityGroupStatuses;
        state.groupedMessagesError = null;
        const totalMessages = action.payload.users.reduce(
          (sum, user) => sum + user.messages.length,
          0
        );
        state.totalUnreadCount = totalMessages;
      })
      .addCase(fetchGroupedMessages.rejected, (state, action) => {
        state.groupedMessagesLoading = false;
        state.groupedMessagesError = action.payload || "Failed to fetch grouped messages";
      });
  },
});

export const {
  setCurrentPage,
  clearError,
  updateUnreadCount,
  addUnreadMessage,
  removeUnreadMessage,
  setRecentMessages,
  setGroupedUsers,
} = unreadMessagesSlice.actions;

export default unreadMessagesSlice.reducer;
