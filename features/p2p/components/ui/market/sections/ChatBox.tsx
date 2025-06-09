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
}

const ChatBox: React.FC<{
  tradeId: string;
  userId: string;
  userName: string;
  autoreply: string;
}> = ({ tradeId, userId, userName, autoreply }) => {
  const dispatch = useDispatch();
  const message = useSelector((state: RootState) => state.message.message);
  const uploaded_images = useSelector(
    (state: RootState) => state.message.uploaded_images
  );
  const [messages, setMessages] = useState<{ results: Message[] }>({
    results: [],
  });

  // Add file input ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  // Fetch messages
  useEffect(() => {
    if (isAuthenticated && tradeId) {
      getTradeMessages(tradeId)
        .then((data) => setMessages(data as { results: Message[] }))
        .catch(console.error);
    }
  }, [tradeId]);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      // Convert to base64 for preview and sending (or use File objects if backend expects FormData)
      Promise.all(
        filesArray.map((file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      ).then((base64Images) => {
        dispatch(setUploadedImages(base64Images));
      });
    }
  };

  // Update handleSend to include images
  const handleSend = async () => {
    if (!message.trim() && uploaded_images.length === 0) return;
    try {
      await postTradeMessage(tradeId, { message, uploaded_images });
      dispatch(clearMessage());
      const data = await getTradeMessages(tradeId);
      setMessages(data as { results: Message[] });
    } catch (e) {
      // handle error (optional)
    }
  };

  return (
    <div>
      <div className="f text-xs mb-2">Chat with Advertiser</div>
      <div className="chat-container mt-6 flex flex-col mb-2 h-96 border border-[#35353E] rounded-[18px] p-2 md:p-4">
        <div>
          <div className="flex items-center justify-center gap-2">
            <MdAccountCircle />
            <div className="flex-1">
              <div className="font-semibold text-xs">{userName}</div>
            </div>
          </div>
        </div>
        <hr className="border-[#35353E] mt-2" />
        <div className="messages-list flex-1 flex flex-col gap-2 overflow-y-auto mb-2">
          <p className="text-white">{autoreply}</p>
          {messages.results.map((msg) => (
            <div
              key={msg.id}
              className={
                Number(msg.sender) === Number(userId)
                  ? "bg-[#1D8751] text-white rounded-lg p-2 self-end max-w-xs"
                  : "bg-[#23232B] text-white rounded-lg p-2 self-start max-w-xs"
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
        <hr className="border-[#35353E] mt-2" />
        <div className="flex gap-2 mt-2">
          <input
            className="flex-1 rounded px-2 py-1  text-white border-none outline-none"
            value={message}
            onChange={(e) => dispatch(setMessage(e.target.value))}
            placeholder="Enter your message"
          />
          {/* Paperclip icon for image upload */}
          <button
            type="button"
            className="flex items-center justify-center w-10 h-10 bg-[#23232B] rounded-lg"
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
            className="rounded-full h-10 w-10 flex items-center justify-center bg-[#1D8751] text-white"
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
            {uploaded_images.map((img, idx) => (
              <img
                key={idx}
                src={img}
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
