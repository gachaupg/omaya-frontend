import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface MessageState {
  message: string;
  uploaded_images: string[];
}

const initialState: MessageState = {
  message: "",
  uploaded_images: [],
};

const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    setMessage(state, action: PayloadAction<string>) {
      state.message = action.payload;
    },
    setUploadedImages(state, action: PayloadAction<string[]>) {
      state.uploaded_images = action.payload;
    },
    clearMessage(state) {
      state.message = "";
      state.uploaded_images = [];
    },
  },
});

export const { setMessage, setUploadedImages, clearMessage } =
  messageSlice.actions;
export default messageSlice.reducer;
