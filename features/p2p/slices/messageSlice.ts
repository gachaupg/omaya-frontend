import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface TradeMessage {
  id: string;
  trade: number;
  sender: number | string;
  sender_name: string;
  message: string;
  images: string[];
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
      // Check if message already exists (prevent duplicates)
      const exists = state.messages[tradeId].find(m => m.id === message.id);
      if (!exists) {
        state.messages[tradeId].push(message);
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
