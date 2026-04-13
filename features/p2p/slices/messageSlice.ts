import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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
  uploaded_images: File[];
  messages: { [tradeId: string]: TradeMessage[] };
}

const initialState: MessageState = {
  message: "",
  uploaded_images: [],
  messages: {},
};

const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    setMessage(state, action: PayloadAction<string>) {
      state.message = action.payload;
    },
    setUploadedImages(state, action: PayloadAction<File[]>) {
      state.uploaded_images = action.payload;
    },
    clearMessage(state) {
      state.message = "";
      state.uploaded_images = [];
    },
    // WebSocket actions
    setMessages(state, action: PayloadAction<{ tradeId: string; messages: TradeMessage[] }>) {
      state.messages[action.payload.tradeId] = action.payload.messages;
    },
    addMessageFromWS(state, action: PayloadAction<{ tradeId: string; message: TradeMessage }>) {
      const { tradeId, message } = action.payload;
      if (!state.messages[tradeId]) {
        state.messages[tradeId] = [];
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
    },
    clearMessagesForTrade(state, action: PayloadAction<string>) {
      delete state.messages[action.payload];
    },
  },
});

export const {
  setMessage,
  setUploadedImages,
  clearMessage,
  setMessages,
  addMessageFromWS,
  clearMessagesForTrade,
} = messageSlice.actions;
export default messageSlice.reducer;
