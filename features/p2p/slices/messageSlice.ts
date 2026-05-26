import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  dedupeTradeMessages,
  isTempMessageId,
  tradeMessagesAreDuplicates,
} from "@/features/p2p/utils/tradeMessageDedupe";

export interface TradeMessage {
  id: string;
  trade: number | string;
  trade_id?: string;
  sender: number | string;
  sender_name: string;
  sender_username?: string;
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
    setMessages(state, action: PayloadAction<{ tradeId: string; messages: TradeMessage[] }>) {
      const { tradeId, messages } = action.payload;
      const existing = state.messages[tradeId] || [];

      // Merge instead of replace so websocket-delivered messages are not lost
      // when API polling returns stale data that hasn't indexed the latest message yet.
      const byId = new Map<string, TradeMessage>();
      for (const msg of existing) {
        byId.set(String(msg.id), msg);
      }
      for (const msg of messages) {
        const id = String(msg.id);
        const prev = byId.get(id);
        if (!prev) {
          byId.set(id, msg);
          continue;
        }
        byId.set(id, {
          ...prev,
          ...msg,
          message:
            String((msg as any).message ?? "").trim() !== ""
              ? msg.message
              : prev.message,
          images:
            Array.isArray((msg as any).images) && (msg as any).images.length > 0
              ? (msg as any).images
              : prev.images || [],
          audios:
            Array.isArray((msg as any).audios) && (msg as any).audios.length > 0
              ? (msg as any).audios
              : (prev as any).audios || [],
          audio_url: (msg as any).audio_url || (prev as any).audio_url,
          audio: (msg as any).audio || (prev as any).audio,
        } as TradeMessage);
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
      const { tradeId, message } = action.payload;
      if (!state.messages[tradeId]) {
        state.messages[tradeId] = [];
      }

      const incomingIsTemp = isTempMessageId(message.id);
      if (!incomingIsTemp) {
        state.messages[tradeId] = state.messages[tradeId].filter(
          (existing) =>
            !isTempMessageId(existing.id) ||
            !tradeMessagesAreDuplicates(existing, message)
        );
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
        const current = state.messages[tradeId][existingIndex] as any;
        const incoming = message as any;
        state.messages[tradeId][existingIndex] = {
          ...current,
          ...incoming,
          message:
            (incoming.message != null && String(incoming.message).trim() !== "")
              ? incoming.message
              : current.message,
          images:
            Array.isArray(incoming.images) && incoming.images.length > 0
              ? incoming.images
              : current.images || [],
          audios:
            Array.isArray(incoming.audios) && incoming.audios.length > 0
              ? incoming.audios
              : current.audios || [],
          audio_url: incoming.audio_url || current.audio_url,
          audio: incoming.audio || current.audio,
        } as any;
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
      const { tradeId, tempId, message } = action.payload;
      const list = state.messages[tradeId] || [];
      const withoutTemp = list.filter((m) => String(m.id) !== String(tempId));
      const idx = withoutTemp.findIndex((m) => String(m.id) === String(message.id));
      if (idx === -1) {
        withoutTemp.push(message);
      } else {
        withoutTemp[idx] = { ...withoutTemp[idx], ...message };
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
