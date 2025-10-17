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
import { useTradeMessagesWebSocket } from "@/features/p2p/hooks/useTradeMessagesWebSocket";

interface MessageImage {
  id: string;
  image: string;
  image_url: string;
}

interface Message {
  id: string;
  trade: number;
  sender: number | string;
  sender_name: string;
  message: string;
  images: any[];
  timestamp: string;
  seller_photo: string;
}

// Type guard to check if image is a MessageImage object
const isMessageImage = (img: any): img is MessageImage => {
  return img && typeof img === 'object' && ('image_url' in img || 'image' in img);
};

const ChatBox: React.FC<{
  tradeId: string;
  userId: string;
  userName: string;
  autoreply: string;
  seller_photo: string;
  buyer_photo?: string;
  buyer?: string;
  seller?: string;
  currentUserEmail?: string;
  owner: string;
  buyerName?: string;
  sellerName?: string;
}> = ({ tradeId, userId, userName, autoreply, seller_photo, buyer_photo, buyer, seller, currentUserEmail, owner, buyerName, sellerName }) => {
  
  // Determine which photo and email to show for the other person
  const otherPersonData = React.useMemo(() => {
    if (currentUserEmail && owner) {
      // If current user is the owner, show buyer's info (the other person)
      if (currentUserEmail === owner) {
        return {
          photo: buyer_photo,
          email: buyer || buyerName || userName || "Buyer"
        };
      }
      // If current user is not the owner, show seller's info (the owner's info)
      return {
        photo: seller_photo,
        email: seller || sellerName || userName || "Seller"
      };
    }
    // Fallback
    return {
      photo: seller_photo || buyer_photo,
      email: userName || seller || buyer || "Unknown"
    };
  }, [currentUserEmail, owner, seller_photo, buyer_photo, buyer, seller, buyerName, sellerName, userName]);
  const dispatch = useDispatch();
  const message = useSelector((state: RootState) => state.message.message);
  const uploaded_images = useSelector(
    (state: RootState) => state.message.uploaded_images
  );
  
  // Get messages from Redux (populated by WebSocket) and sort by timestamp
  const messagesFromRedux = useSelector(
    (state: RootState) => state.message.messages[tradeId] || []
  );
  
  // Sort messages by timestamp (oldest first, newest last)
  const sortedMessages = React.useMemo(() => {
    return [...messagesFromRedux].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }, [messagesFromRedux]);
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add file input ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  // Use WebSocket for real-time messages
  console.log("💬 Messages WebSocket Config:", {
    tradeId,
    enabled: isAuthenticated,
    tradeIdType: typeof tradeId,
    tradeIdValue: tradeId
  });
  
  const { isConnected: wsConnected } = useTradeMessagesWebSocket({
    tradeId,
    enabled: isAuthenticated,
  });

  // Ref for auto-scroll
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesListRef = React.useRef<HTMLDivElement>(null);
  const [userHasScrolled, setUserHasScrolled] = React.useState(false);
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const prevMessageCountRef = React.useRef(0);

  // Track user scroll behavior
  const handleScroll = React.useCallback(() => {
    if (messagesListRef.current) {
      const container = messagesListRef.current;
      const scrollThreshold = 50; // pixels from bottom
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      const isNearBottom = distanceFromBottom < scrollThreshold;
      
      setIsAtBottom(isNearBottom);
      
      // If user scrolls up significantly, mark as manually scrolled
      if (distanceFromBottom > scrollThreshold) {
        setUserHasScrolled(true);
      } else {
        // If user scrolls back to bottom, reset flag
        setUserHasScrolled(false);
      }
    }
  }, []);

  // Attach scroll listener
  useEffect(() => {
    const container = messagesListRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Smart auto-scroll when messages update
  useEffect(() => {
    const messageCountChanged = prevMessageCountRef.current !== sortedMessages.length;
    prevMessageCountRef.current = sortedMessages.length;
    
    // Only auto-scroll if:
    // 1. User hasn't manually scrolled up OR is already at bottom
    // 2. There are new messages (count changed)
    if (messageCountChanged && (!userHasScrolled || isAtBottom)) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
    }
  }, [sortedMessages, userHasScrolled, isAtBottom]);

  // Fetch messages initially (WebSocket will keep them updated)
  const fetchMessages = async () => {
    if (isAuthenticated && tradeId) {
      setIsRefreshing(true);
      try {
        const data = await getTradeMessages(tradeId);
        // Dispatch to Redux instead of local state
        const { setMessages } = await import("@/features/p2p/slices/messageSlice");
        if (data && (data as any).results) {
          dispatch(setMessages({
            tradeId,
            messages: (data as any).results,
          }));
        }
      } catch (error) {
        // Silent error
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    // Fetch initial messages once on mount
    // WebSocket will then keep them updated in real-time
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

  // Update handleSend to include images and sender email
  const handleSend = async () => {
    if (!message.trim() && uploaded_images.length === 0) return;
    
    const messageContent = message;
    const images = uploaded_images;
    
    // Create optimistic message to show immediately
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      trade: parseInt(tradeId),
      sender: currentUserEmail || '',
      sender_name: currentUserEmail || '',
      message: messageContent,
      images: images.map(file => URL.createObjectURL(file)), // Create preview URLs
      timestamp: new Date().toISOString(),
      seller_photo: '',
    };
    
    // Add optimistic message to Redux immediately
    const { addMessageFromWS } = await import("@/features/p2p/slices/messageSlice");
    dispatch(addMessageFromWS({ tradeId, message: optimisticMessage }));
    
    // Clear input and images immediately for better UX
    dispatch(clearMessage());
    dispatch(setUploadedImages([]));
    
    try {
      // Send via HTTP
      const response = await postTradeMessage(tradeId, { 
        message: messageContent || '', 
        uploaded_images: images,
        sender_name: currentUserEmail || ""
      });
      
      console.log("Message sent successfully, response:", response);
      
      // Refresh messages to get the real message with proper IDs and S3 URLs
      setTimeout(() => {
        fetchMessages();
      }, 500);
    } catch (e) {
      // On error, restore the message and images
      dispatch(setMessage(messageContent));
      dispatch(setUploadedImages(images));
      console.error("Failed to send message:", e);
      
      // Remove the optimistic message
      fetchMessages();
    }
  };

  // Function to scroll to bottom manually
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    setUserHasScrolled(false);
  };

  return (
    <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-2">
            <span>Chat with {otherPersonData.email}</span>
          {wsConnected ? (
            <span className="text-[10px] text-[#1D8751] flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#1D8751] rounded-full animate-pulse"></span>
              Live
            </span>
          ) : (
            <span className="text-[10px] text-[#F79330] flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#F79330] rounded-full"></span>
              Reconnecting...
            </span>
          )}
          <span className="text-[10px] text-[#788099]">
            ({sortedMessages.length} msgs)
          </span>
        </div>
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
      <div className="chat-container mt-6 flex flex-col pr-10 mb-2 h-96 bg-white dark:bg-[#18181D] border border-[#E8EFF5] dark:border-[#35353E] rounded-[18px] p-2 md:p-4 relative">
        <div>
          <div className="flex items-center justify-center gap-2">
            {otherPersonData.photo ? <img className="w-8 h-8 rounded-full object-cover" src={otherPersonData.photo} alt={otherPersonData.email} /> : <MdAccountCircle  className="w-6 h-6 text-[#1D8751]"/>}
            <div className="flex-1">
              <div className="font-semibold text-md">{otherPersonData.email}</div>
            </div>
          </div>
        </div>
        <hr className="border-[#E8EFF5] dark:border-[#35353E] mt-2" />
        <div 
          ref={messagesListRef}
          className="messages-list flex-1 flex flex-col gap-2 overflow-y-auto mb-2"
        >
          {autoreply && (
            <p className="text-[#051015] dark:text-white bg-[#F5F5F5] dark:bg-[#23232B] p-2 rounded-lg text-sm italic">
              {autoreply}
            </p>
          )}
          {sortedMessages.map((msg) => {
            console.log("Message in list:", { 
              id: msg.id, 
              hasImages: msg.images && msg.images.length > 0,
              imageCount: msg.images?.length || 0,
              message: msg.message,
              images: msg.images,
              timestamp: msg.timestamp
            });
            
            // Use sender_name (email) to determine if this is the current user's message
            const isSender = msg.sender_name?.trim() === currentUserEmail?.trim();
            
            // Determine photo and email for this specific message based on sender_name
            let messagePhoto = otherPersonData.photo;
            let messageEmail = msg.sender_name; // Always use email from message
            
            if (!isSender && msg.sender_name) {
              // This is the other person's message - determine which photo to show
              if (msg.sender_name === seller) {
                // Message is from seller
                messagePhoto = seller_photo;
                messageEmail = msg.sender_name; // Use email
              } else if (msg.sender_name === buyer) {
                // Message is from buyer
                messagePhoto = buyer_photo;
                messageEmail = msg.sender_name; // Use email
              }
            }
            
            return (
              <div
                key={msg.id}
                className={`flex gap-2 items-end ${isSender ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Show photo only for receiver messages */}
                {!isSender && (
                  <div className="flex-shrink-0">
                    {messagePhoto ? (
                      <img 
                        className="w-8 h-8 rounded-full object-cover" 
                        src={messagePhoto} 
                        alt={messageEmail} 
                      />
                    ) : (
                      <MdAccountCircle className="w-8 h-8 text-[#1D8751]" />
                    )}
                  </div>
                )}
                
                <div
                  className={
                    isSender
                      ? "bg-[#1D8751] text-white rounded-lg p-3 max-w-xs"
                      : "dark:bg-[#23232B] bg-gray-200 dark:text-white text-gray-900 rounded-lg p-3 max-w-xs"
                  }
                >
                  {/* Show sender email - "You" for own messages, email for their messages */}
                  <div className={`text-xs font-semibold mb-1 ${isSender ? "text-green-100" : "text-[#1D8751] dark:text-[#1D8751]"}`}>
                    {isSender ? "You" : messageEmail}
                  </div>
                  {msg.message && <div className="text-sm break-words">{msg.message}</div>}
                  
                  {/* DEBUG: Show if images exist */}
                  {msg.images && msg.images.length > 0 ? (
                    <div className="mt-2 p-3 bg-yellow-100 dark:bg-yellow-900 rounded border-2 border-yellow-500">
                      <div className="text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                        📷 {msg.images.length} image(s) attached
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {msg.images.map((img: any, idx: number) => {
                          // Handle both string URLs and image objects
                          const imageUrl = isMessageImage(img) ? (img.image_url || img.image) : img;
                          const imageKey = isMessageImage(img) ? img.id : idx;
                          console.log("🖼️ Rendering image:", { img, imageUrl, isObject: isMessageImage(img) });
                          return (
                            <div key={imageKey} className="relative">
                              <img
                                src={imageUrl}
                          alt="attachment"
                                className="w-24 h-24 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity border-2 border-[#1D8751] bg-white"
                                onClick={() => window.open(imageUrl, '_blank')}
                                onLoad={(e) => {
                                  console.log("✅ Image loaded successfully:", imageUrl);
                                }}
                                onError={(e) => {
                                  console.error("❌ Image failed to load:", imageUrl);
                                  (e.target as HTMLImageElement).style.border = "4px solid red";
                                  (e.target as HTMLImageElement).style.backgroundColor = "pink";
                                }}
                              />
                              <div className="text-xs mt-1 text-center">
                                <a 
                                  href={imageUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 underline"
                                >
                                  Open
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                  <div className={`text-xs mt-1 ${isSender ? "text-green-100" : "text-gray-500 dark:text-gray-400"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Scroll to bottom button - only show when user has scrolled up */}
        {userHasScrolled && !isAtBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-20 right-14 bg-[#1D8751] text-white rounded-full p-2 shadow-lg hover:bg-[#166339] transition-colors z-10 animate-bounce"
            title="Scroll to bottom"
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        
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
