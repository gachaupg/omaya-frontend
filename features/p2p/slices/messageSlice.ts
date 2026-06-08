import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  dedupeTradeMessages,
  isBlankMediaShell,
  isTempMessageId,
  mergeChatMessageRow,
  normalizeTradeMessageForDedupe,
  tradeMessagesAreDuplicates,
} from "@/features/p2p/utils/tradeMessageDedupe";

export interface TradeMessage {
  id: string;
  trade: number | string;
  trade_id?: string;
  sender: number | string;
  sender_name: string;
  sender_username?: string;
  sender_photo?: string | null;
  message: string;
  images: any[];
  audios?: any[];
  audio_url?: string;
  audio?: string;
  timestamp: string;
  seller_photo: string;
}

interface MessageState {
  message: string;
  messages: { [tradeId: string]: TradeMessage[] };
}

const initialState: MessageState = {
  message: "",
  messages: {},
};

const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    setMessage(state, action: PayloadAction<string>) {
      state.message = action.payload;
    },
    clearMessage(state) {
      state.message = "";
    },
    // WebSocket actions
    setMessages(
      state,
      action: PayloadAction<{
        tradeId: string;
        messages: TradeMessage[];
        /** When true, drop existing rows for this trade (trade switch / full API list). */
        replace?: boolean;
      }>
    ) {
      const { tradeId, messages, replace } = action.payload;

      const normalizedIncoming = messages.map((msg) =>
        normalizeTradeMessageForDedupe(msg)
      );

      if (replace) {
        state.messages[tradeId] = dedupeTradeMessages(
          [...normalizedIncoming].sort(
            (a, b) =>
              new Date(String(a.timestamp || 0)).getTime() -
              new Date(String(b.timestamp || 0)).getTime()
          )
        );
        return;
      }

      const existing = state.messages[tradeId] || [];

      // Merge instead of replace so websocket-delivered messages are not lost
      // when API polling returns stale data that hasn't indexed the latest message yet.
      const byId = new Map<string, TradeMessage>();
      for (const msg of existing) {
        byId.set(String(msg.id), msg);
      }
      for (const msg of normalizedIncoming) {
        const id = String(msg.id);
        const prev = byId.get(id);
        if (!prev) {
          byId.set(id, msg);
          continue;
        }
        byId.set(id, mergeChatMessageRow(prev, msg));
      }

      state.messages[tradeId] = dedupeTradeMessages(
        Array.from(byId.values()).sort(
          (a, b) =>
            new Date(String(a.timestamp || 0)).getTime() -
            new Date(String(b.timestamp || 0)).getTime()
        )
      );
    },
    addMessageFromWS(state, action: PayloadAction<{ tradeId: string; message: TradeMessage }>) {
      const { tradeId, message: rawMessage } = action.payload;
      const message = normalizeTradeMessageForDedupe(rawMessage);
      if (!state.messages[tradeId]) {
        state.messages[tradeId] = [];
      }

      const incomingIsTemp = isTempMessageId(message.id);
      if (!incomingIsTemp) {
        state.messages[tradeId] = state.messages[tradeId].filter((existing) => {
          if (!isTempMessageId(existing.id)) return true;
          if (!tradeMessagesAreDuplicates(existing, message)) return true;
          if (isBlankMediaShell(message)) return true;
          return false;
        });
      } else {
        const hasRealEcho = state.messages[tradeId].some(
          (existing) =>
            !isTempMessageId(existing.id) &&
            tradeMessagesAreDuplicates(message, existing)
        );
        if (hasRealEcho) return;
      }

      const existingIndex = state.messages[tradeId].findIndex((m) => m.id === message.id);
      if (existingIndex === -1) {
        state.messages[tradeId].push(message);
      } else {
        state.messages[tradeId][existingIndex] = mergeChatMessageRow(
          state.messages[tradeId][existingIndex],
          message
        );
      }

      state.messages[tradeId] = dedupeTradeMessages(state.messages[tradeId]);
    },
    replaceOptimisticMessage(
      state,
      action: PayloadAction<{
        tradeId: string;
        tempId: string;
        message: TradeMessage;
      }>
    ) {
      const { tradeId, tempId, message: rawMessage } = action.payload;
      const message = normalizeTradeMessageForDedupe({
        ...rawMessage,
        trade_id: rawMessage.trade_id || tradeId,
      });
      const list = state.messages[tradeId] || [];
      const withoutTemp = list.filter((m) => String(m.id) !== String(tempId));
      const idx = withoutTemp.findIndex((m) => String(m.id) === String(message.id));
      if (idx === -1) {
        withoutTemp.push(message);
      } else {
        withoutTemp[idx] = mergeChatMessageRow(withoutTemp[idx], message);
      }
      state.messages[tradeId] = dedupeTradeMessages(withoutTemp);
    },
    clearMessagesForTrade(state, action: PayloadAction<string>) {
      delete state.messages[action.payload];
    },
  },
});

export const {
  setMessage,
  clearMessage,
  setMessages,
  addMessageFromWS,
  replaceOptimisticMessage,
  clearMessagesForTrade,
} = messageSlice.actions;
export default messageSlice.reducer;
