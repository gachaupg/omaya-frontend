"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/rootReducer";
import {
  setMessage,
  setUploadedImages,
  clearMessage,
} from "@/features/p2p/slices/messageSlice";
import { getTradeMessages, postTradeMessage } from "@/features/p2p/api";
import { MdAccountCircle } from "react-icons/md";

interface Message {
  id: string;
  trade: number;
  sender: number | string;
  sender_name: string;
  message: string;
  images: string[];
  timestamp: string;
  seller_photo: string;
}

const ChatBox: React.FC<{
  tradeId: string;
  userId: string;
  userName: string;
  autoreply: string;
  seller_photo: string;
}> = ({ tradeId, userId, userName, autoreply, seller_photo }) => {
  const dispatch = useDispatch();
  const message = useSelector((state: RootState) => state.message.message);
  const uploaded_images = useSelector(
    (state: RootState) => state.message.uploaded_images
  );
  const [messages, setMessages] = useState<{ results: Message[] }>({
    results: [],
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add file input ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  // Fetch messages
  const fetchMessages = async () => {
    if (isAuthenticated && tradeId) {
      setIsRefreshing(true);
      try {
        const data = await getTradeMessages(tradeId);
        setMessages(data as { results: Message[] });
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [tradeId]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchMessages();
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      // Store File objects directly for FormData upload
      dispatch(setUploadedImages(filesArray));
      // Clear the input to allow selecting the same files again
      e.target.value = '';
    }
  };

  // Update handleSend to include images
  const handleSend = async () => {
    if (!message.trim() && uploaded_images.length === 0) return;
    try {
      await postTradeMessage(tradeId, { message: message || '', uploaded_images });
      dispatch(clearMessage());
      const data = await getTradeMessages(tradeId);
      setMessages(data as { results: Message[] });
    } catch (e) {
      // handle error (optional)
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-2">
        <span>Chat with Advertiser</span>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center w-6 h-6 dark:bg-[#23232B] bg-gray-200 rounded dark:hover:bg-[#35353E] hover:bg-gray-300 transition-colors disabled:opacity-50"
          title="Refresh messages"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="#1D8751"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className={`${isRefreshing ? "animate-spin" : ""}`}
          >
            <path
              d="M1 4v6h6M23 20v-6h-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className="chat-container mt-6 flex flex-col pr-10 mb-2 h-96 bg-white dark:bg-[#18181D] border border-[#E8EFF5] dark:border-[#35353E] rounded-[18px] p-2 md:p-4">
        <div>
          <div className="flex items-center justify-center gap-2">
            {seller_photo ? <img className="w-8 h-8 rounded-full" src={seller_photo || ""} alt="" /> : <MdAccountCircle  className="w-6 h-6 text-[#1D8751]"/>}
            <div className="flex-1">
              <div className="font-semibold text-md">{userName}</div>
            </div>
          </div>
        </div>
        <hr className="border-[#E8EFF5] dark:border-[#35353E] mt-2" />
        <div className="messages-list flex-1 flex flex-col gap-2 overflow-y-auto mb-2">
          <p className="text-[#051015] dark:text-white">{autoreply}</p>
          {messages.results.map((msg) => (
            <div
              key={msg.id}
              className={
                Number(msg.sender) === Number(userId)
                  ? "bg-[#1D8751] text-[#051015] dark:text-white rounded-lg p-2 self-end max-w-xs"
                  : "dark:bg-[#23232B] bg-gray-200 dark:text-white text-gray-900 rounded-lg p-2 self-start max-w-xs"
              }
            >
              <div>{msg.message}</div>
              {msg.images && msg.images.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {msg.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt="attachment"
                      className="w-8 h-8 rounded"
                    />
                  ))}
                </div>
              )}
              <div className="text-xs text-gray-400 mt-1">
                {new Date(msg.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        <hr className="border-[#E8EFF5] dark:border-[#35353E] mt-2" />
        <div className="flex gap-2 mt-2">
          <input
            className="flex-1 rounded px-2 py-1 text-[#788099] dark:text-white border-none outline-none"
            value={message}
            onChange={(e) => dispatch(setMessage(e.target.value))}
            placeholder="Enter your message"
          />
          {/* Paperclip icon for image upload */}
          <button
            type="button"
            className="flex items-center justify-center w-10 h-10 dark:bg-[#23232B] bg-gray-100 rounded-lg"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            title="Attach image"
          >
            <svg width="24" height="24" fill="#1D8751" viewBox="0 0 24 24">
              <path
                d="M16.5 6.5l-7.8 7.8a3 3 0 104.2 4.2l7.1-7.1a5 5 0 00-7.1-7.1l-8.5 8.5"
                stroke="#1D8751"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim() && uploaded_images.length === 0}
            className="rounded-full h-10 w-10 flex items-center justify-center bg-[#1D8751] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M5 12h14M12 5l7 7-7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        {/* Preview selected images */}
        {uploaded_images.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {uploaded_images.map((file, idx) => (
              <img
                key={idx}
                src={URL.createObjectURL(file)}
                alt={`preview-${idx}`}
                className="w-12 h-12 object-cover rounded border border-[#35353E]"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBox;
