"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/rootReducer";
import {
  setMessage,
  setUploadedImages,
  clearMessage,
  TradeMessage,
  setMessages,
} from "@/features/p2p/slices/messageSlice";
import { getTradeMessages, postTradeMessage, GroupedMessage } from "@/features/p2p/api";
import { MdAccountCircle } from "react-icons/md";
import { useTradeMessagesWebSocket } from "@/features/p2p/hooks/useTradeMessagesWebSocket";
import { Copy, RefreshCw } from "lucide-react";

interface MessageImage {
  id: string;
  image: string;
  image_url: string;
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
  messageType?: 'p2p' | 'support';
  peerName?: string;
  supportMessages?: GroupedMessage[];
  onClose?: () => void;
}> = ({ tradeId, userId, userName, autoreply, seller_photo, buyer_photo, buyer, seller, currentUserEmail, owner, buyerName, sellerName, messageType = 'p2p', peerName, supportMessages, onClose }) => {

  // Determine which photo and display name to show for the other person
  const otherPersonData = React.useMemo(() => {
    // For P2P messages, use peerName from API if available, otherwise use existing logic
    if (messageType === 'p2p' && peerName) {
      if (currentUserEmail && owner) {
        // If current user is the owner, show buyer's info (the other person)
        if (currentUserEmail === owner) {
          return {
            photo: buyer_photo,
            displayName: peerName || buyerName || userName || buyer || "Buyer"
          };
        }
        // If current user is not the owner, show seller's info (the owner's info)
        return {
          photo: seller_photo,
          displayName: peerName || sellerName || userName || seller || "Seller"
        };
      }
      // Fallback with peerName
      return {
        photo: seller_photo || buyer_photo,
        displayName: peerName || userName || sellerName || buyerName || seller || buyer || "Unknown"
      };
    }

    // Support messages - use peerName if available
    if (messageType === 'support' && peerName) {
      return {
        photo: seller_photo || buyer_photo,
        displayName: peerName || "Support"
      };
    }

    // Original logic for P2P messages without peerName
    if (currentUserEmail && owner) {
      // If current user is the owner, show buyer's info (the other person)
      if (currentUserEmail === owner) {
        return {
          photo: buyer_photo,
          displayName: buyerName || userName || buyer || "Buyer"
        };
      }
      // If current user is not the owner, show seller's info (the owner's info)
      return {
        photo: seller_photo,
        displayName: sellerName || userName || seller || "Seller"
      };
    }
    // Fallback
    return {
      photo: seller_photo || buyer_photo,
      displayName: userName || sellerName || buyerName || seller || buyer || "Unknown"
    };
  }, [currentUserEmail, owner, seller_photo, buyer_photo, buyer, seller, buyerName, sellerName, userName, messageType, peerName]);
  const dispatch = useDispatch();
  const message = useSelector((state: RootState) => state.message.message);
  const uploaded_images = useSelector(
    (state: RootState) => state.message.uploaded_images
  );

  // Get messages from Redux (populated by WebSocket) and sort by timestamp
  const messagesFromRedux = useSelector(
    (state: RootState) => state.message.messages[tradeId] || []
  );

  // Sort messages by timestamp and filter out duplicate optimistic messages
  const sortedMessages = React.useMemo(() => {
    const messages = [...messagesFromRedux];

    // Separate temp messages from real messages
    const tempMessages = messages.filter(msg => msg.id.toString().startsWith('temp-'));
    const realMessages = messages.filter(msg => !msg.id.toString().startsWith('temp-'));

    // Remove temp messages that have a matching real message (same content and similar timestamp)
    const filteredTempMessages = tempMessages.filter(tempMsg => {
      const hasDuplicate = realMessages.some(realMsg => {
        const isSameSender = realMsg.sender_name === tempMsg.sender_name;
        const isSameMessage = realMsg.message === tempMsg.message;
        const timeDiff = Math.abs(
          new Date(realMsg.timestamp).getTime() - new Date(tempMsg.timestamp).getTime()
        );
        // Consider it a duplicate if sent within 10 seconds
        return isSameSender && isSameMessage && timeDiff < 10000;
      });
      return !hasDuplicate;
    });

    // Combine and sort
    return [...realMessages, ...filteredTempMessages].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }, [messagesFromRedux]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedChatId, setCopiedChatId] = useState(false);

  const handleCopyChatId = () => {
    if (tradeId) {
      navigator.clipboard.writeText(tradeId);
      setCopiedChatId(true);
      setTimeout(() => setCopiedChatId(false), 2000);
    }
  };

  // Add file input ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  // Use WebSocket for real-time messages only for P2P messages
  // For support messages, use API polling instead
  const { isConnected: wsConnected } = useTradeMessagesWebSocket({
    tradeId,
    enabled: isAuthenticated && messageType === 'p2p', // Only enable WebSocket for P2P messages
  });

  // Ref for auto-scroll
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesListRef = React.useRef<HTMLDivElement>(null);
  const [userHasScrolled, setUserHasScrolled] = React.useState(false);
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const prevMessageCountRef = React.useRef(0);
  const [imageLoadingStates, setImageLoadingStates] = React.useState<Record<string, boolean>>({});

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
  const fetchMessages = React.useCallback(async () => {
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
  }, [isAuthenticated, tradeId, dispatch]);

  // Polling interval for support messages (API-based)
  const pollingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If support messages are passed as props, use them directly (don't fetch)
    if (messageType === 'support' && supportMessages && supportMessages.length > 0) {
      // Convert GroupedMessage[] to TradeMessage[] format and set in Redux
      const convertedMessages: TradeMessage[] = supportMessages.map((msg) => ({
        id: msg.id,
        trade: parseInt(tradeId) || 0,
        sender: msg.sender_id ?? 0,
        sender_name: msg.sender_name || '',
        message: msg.content,
        images: Array.isArray(msg.images) ? msg.images.map((img: any) =>
          typeof img === 'string' ? img : img.image_url || img.image
        ) : [],
        timestamp: msg.timestamp,
        seller_photo: seller_photo || '',
      }));
      dispatch(setMessages({
        tradeId,
        messages: convertedMessages,
      }));
      return;
    }

    // Fetch initial messages once on mount
    if (messageType === 'p2p') {
      // For P2P: WebSocket will keep them updated in real-time, use API
      fetchMessages();
    } else if (messageType === 'support') {
      // For support: Use API polling every 5 seconds (only if not passed as props)
      if (!supportMessages || supportMessages.length === 0) {
        fetchMessages();
        pollingIntervalRef.current = setInterval(() => {
          fetchMessages();
        }, 5000);
      }
    } else {
      fetchMessages();
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [tradeId, messageType, fetchMessages, supportMessages, dispatch]);

  // Auto-refresh when new messages with images arrive via WebSocket
  const lastMessageIdRef = React.useRef<string | null>(null);
  const refreshTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if the latest message has images and needs refresh
    if (sortedMessages.length > 0) {
      const latestMessage = sortedMessages[sortedMessages.length - 1];

      // Only process if this is a new message (different ID from last processed)
      if (latestMessage.id !== lastMessageIdRef.current) {
        lastMessageIdRef.current = latestMessage.id;

        // Only refresh for temporary messages or if images are completely missing
        const hasTemporaryId = latestMessage.id && latestMessage.id.toString().startsWith('temp-');
        const hasNoImages = !latestMessage.images || latestMessage.images.length === 0;

        if (hasTemporaryId || hasNoImages) {
          // Clear any existing timeout
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }

          // Schedule a single refresh after a short delay
          refreshTimeoutRef.current = setTimeout(() => {
            fetchMessages();
          }, 1000);
        }
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [sortedMessages.length, fetchMessages]); // Only trigger when message count changes

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
    const optimisticMessage: TradeMessage = {
      id: `temp-${Date.now()}`,
      trade: parseInt(tradeId),
      sender: currentUserEmail || '',
      sender_name: currentUserEmail || '',
      sender_username: userName || '',
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



      // Refresh messages to get the real message with proper IDs and S3 URLs
      setTimeout(() => {
        fetchMessages();
      }, 500);
    } catch (e) {
      // On error, restore the message and images
      dispatch(setMessage(messageContent));
      dispatch(setUploadedImages(images));

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
      <div className="flex items-center justify-between gap-2 text-xs mb-2">
        <span className="truncate">Chat with {otherPersonData.displayName}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center px-1 py-1  dark:bg-[#1D8751] bg-[#1D8751] text-white rounded hover:bg-[#166b3e] transition-colors disabled:opacity-50 text-xs font-medium shrink-0"
            title="Refresh messages and load images"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-accent transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 shrink-0"
              aria-label="Close chat"
              title="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="chat-container mt-4 sm:mt-6 flex flex-col pr-2 sm:pr-10 mb-2 h-80 sm:h-96 bg-card border border-[#E8EFF5] dark:border-[#35353E] rounded-[18px] p-2 sm:p-4 relative">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {otherPersonData.photo ? <img className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0" src={otherPersonData.photo} alt={otherPersonData.displayName} /> : <MdAccountCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#1D8751] flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm sm:text-md truncate">{otherPersonData.displayName}</div>
                {tradeId && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-[#788099]">ID: {tradeId}</span>
                    <button
                      onClick={handleCopyChatId}
                      className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-[#35353E] transition-colors text-[#1D8751] flex-shrink-0"
                      title={copiedChatId ? "Copied!" : "Copy chat ID"}
                      aria-label="Copy chat ID"
                    >
                      <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                    {copiedChatId && (
                      <span className="text-[10px] text-[#1D8751] font-medium">Copied!</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <hr className="border-[#E8EFF5] dark:border-[#35353E] mt-2" />
        <div
          ref={messagesListRef}
          className="messages-list flex-1 flex flex-col gap-2 overflow-y-auto mb-2"
        >
          {autoreply && (
            <p className="text-[#051015] dark:text-white bg-gray-100 dark:bg-[var(--card-color)] p-2 rounded-lg text-sm italic">
              {autoreply}
            </p>
          )}
          {sortedMessages.map((msg) => {
            // Use sender_name (email) to determine if this is the current user's message
            const isSender = msg.sender_name?.trim() === currentUserEmail?.trim();

            // Determine photo and display name for this specific message
            let messagePhoto = otherPersonData.photo;

            // For consistency, always extract username from email (part before @)
            let displayName = msg.sender_name
              ? msg.sender_name.split('@')[0]
              : "Unknown User";

            if (!isSender && msg.sender_name) {
              // This is the other person's message - determine which photo to show
              if (msg.sender_name === seller) {
                messagePhoto = seller_photo;
              } else if (msg.sender_name === buyer) {
                messagePhoto = buyer_photo;
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
                        alt={displayName}
                      />
                    ) : (
                      <MdAccountCircle className="w-8 h-8 text-[#1D8751]" />
                    )}
                  </div>
                )}

                <div
                  className={
                    isSender
                      ? "bg-[#1D8751] text-white rounded-lg p-2 sm:p-3 max-w-[85%] sm:max-w-xs min-w-[100px] sm:min-w-[120px]"
                      : "dark:bg-[var(--card-color)] bg-gray-200 dark:text-white text-gray-900 rounded-lg p-2 sm:p-3 max-w-[85%] sm:max-w-xs min-w-[100px] sm:min-w-[120px]"
                  }
                >
                  {/* Show sender username - "You" for own messages, username for their messages */}
                  <div className={`text-xs font-semibold mb-1 ${isSender ? "text-green-100" : "text-[#1D8751] dark:text-[#1D8751]"}`}>
                    {isSender ? "You" : displayName}
                  </div>
                  {msg.message && msg.message.trim() && <div className="text-xs sm:text-sm break-words mb-2">{msg.message}</div>}

                  {/* Image attachments */}
                  {msg.images && msg.images.length > 0 && (
                    <div className="text-xs text-gray-500 mb-1">Images: {msg.images.length}</div>
                  )}
                  {msg.images && msg.images.length > 0 && (
                    <div className={msg.message && msg.message.trim() ? "mt-0" : "mt-0"}>
                      <div className="flex gap-2 flex-wrap justify-start">
                        {msg.images.map((img: any, idx: number) => {
                          // Handle different image data structures
                          let imageUrl = '';

                          if (typeof img === 'string') {
                            // Direct string URL
                            imageUrl = img;
                          } else if (img && typeof img === 'object') {
                            // Try multiple possible properties for image URL
                            imageUrl = img.image_url || img.image || img.url || img.src || img.file || img.attachment || '';
                          }

                          // Debug: Show image data
                          console.log(`Image ${idx}:`, { img, imageUrl, type: typeof img });

                          const imageKey = isMessageImage(img) ? img.id : `img-${idx}`;

                          // If no valid URL, show a simple placeholder
                          if (!imageUrl || imageUrl.trim() === '') {
                            return (
                              <div key={imageKey} className="relative inline-block">
                                <div className="w-24 h-24 rounded bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-[#1D8751] flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">No Image</div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={imageKey} className="relative inline-block">
                              {/* Loading spinner overlay */}
                              {imageLoadingStates[imageKey] && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded z-10">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D8751]"></div>
                                </div>
                              )}
                              <div className="relative w-24 h-24">
                                <img
                                  src={imageUrl}
                                  alt={`attachment-${idx + 1}`}
                                  className="w-full h-full rounded object-cover cursor-pointer hover:opacity-80 transition-opacity border-2 border-[#1D8751] bg-white dark:bg-gray-800"
                                  onClick={() => window.open(imageUrl, '_blank')}
                                  onLoadStart={() => {
                                    setImageLoadingStates(prev => ({ ...prev, [imageKey]: true }));
                                  }}
                                  onLoad={(e) => {
                                    setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }));
                                  }}
                                  onError={(e) => {
                                    setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }));
                                  }}
                                  style={{ display: 'block' }}
                                />
                              </div>
                              <div className="text-xs mt-1 text-center">
                                <a
                                  href={imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#1D8751] dark:text-[#1D8751] hover:underline font-medium"
                                >
                                  View Full
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
            className="absolute bottom-16 sm:bottom-20 right-2 sm:right-14 bg-[#1D8751] text-white rounded-full p-1.5 sm:p-2 shadow-lg hover:bg-[#166339] transition-colors z-10 animate-bounce"
            title="Scroll to bottom"
          >
            <svg
              width="16"
              height="16"
              className="sm:w-5 sm:h-5"
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
        <div className="flex gap-1.5 sm:gap-2 mt-2">
          <input
            className="flex-1 rounded px-2 py-1.5 sm:py-1 text-xs sm:text-sm text-[#788099] dark:text-white border-none outline-none"
            value={message}
            onChange={(e) => dispatch(setMessage(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Enter your message"
          />
          {/* Paperclip icon for image upload */}
          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 dark:bg-[var(--card-color)] bg-gray-100 rounded-lg flex-shrink-0"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            title="Attach image"
          >
            <svg width="18" height="18" className="sm:w-6 sm:h-6" fill="#1D8751" viewBox="0 0 24 24">
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
            className="rounded-full h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center bg-[#1D8751] text-white disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <svg
              width="18"
              height="18"
              className="sm:w-6 sm:h-6"
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
              <div key={idx} className="relative w-12 h-12">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`preview-${idx}`}
                  className="w-full h-full object-cover rounded border border-[#35353E]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newImages = uploaded_images.filter((_, i) => i !== idx);
                    dispatch(setUploadedImages(newImages));
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  title="Remove image"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBox;


