import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import {
  setMessages,
  addMessageFromWS,
  clearMessagesForTrade,
} from "../slices/messageSlice";
import {
  getTradeMessagesWebSocket,
  cleanupTradeMessagesWebSocket,
  TradeMessage,
} from "../services/tradeMessagesWebSocket";
import type { WebSocketMessage } from "../services/tradeMessagesWebSocket";
import { cookieUtils } from "@/lib/utils/cookieUtils";

import { logger } from '@/lib/utils/logger';

interface UseTradeMessagesWebSocketOptions {
  tradeId: string;
  enabled?: boolean;
}

export const useTradeMessagesWebSocket = (options: UseTradeMessagesWebSocketOptions) => {
  const { tradeId, enabled = true } = options;
  const dispatch = useDispatch<AppDispatch>();
  const mountedRef = useRef(true);
  const [isConnected, setIsConnected] = useState(false);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get or create WebSocket instance when tradeId changes
  const wsRef = useRef(getTradeMessagesWebSocket(tradeId));
  
  // Update wsRef when tradeId changes
  useEffect(() => {
    wsRef.current = getTradeMessagesWebSocket(tradeId);
  }, [tradeId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Periodic connection check
  useEffect(() => {
    if (!enabled || !tradeId) return;

    // Check connection status every 5 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      const ws = wsRef.current;
      const connected = ws.isConnected();
      
      if (mountedRef.current) {
        setIsConnected(connected);
      }

      // If disconnected and not permanently failed, try to reconnect
      if (!connected && !ws.hasFailed()) {
        const getAccessToken = (): string | null => {
          const cookieToken = cookieUtils.getCookie("access_token");
          if (cookieToken) return cookieToken;
          if (typeof window !== "undefined") {
            const localToken = localStorage.getItem("access_token");
            if (localToken) return localToken;
          }
          return null;
        };

        const token = getAccessToken();
        if (token && token.includes('.')) {
          ws.resetPermanentFailure();
          ws.connect(tradeId, token);
        }
      }
    }, 5000);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [enabled, tradeId]);

  useEffect(() => {
    if (!enabled || !tradeId) {
      return;
    }

    const getAccessToken = (): string | null => {
      // First try to get from cookies (primary storage)
      const cookieToken = cookieUtils.getCookie("access_token");
      if (cookieToken) {
        return cookieToken;
      }
      
      // Fallback to localStorage (for backward compatibility)
      if (typeof window !== "undefined") {
        const localToken = localStorage.getItem("access_token");
        if (localToken) {
          return localToken;
        }
      }
      
      return null;
    };

    const token = getAccessToken();

    if (!token) {
      return;
    }

    // Validate token format (basic check)
    if (!token.includes('.')) {
      return;
    }

    const ws = wsRef.current;

    // Handle WebSocket messages
    const unsubscribeMessage = ws.onMessage((message: WebSocketMessage) => {
      if (!mountedRef.current) return;

      try {
        switch (message.type) {
          case "connection_established":
            // Silent - connection established
            setIsConnected(true);
            break;

          case "pong":
            // Pong response - connection is alive
            setIsConnected(true);
            break;

          case "messages_list":
          case "initial_messages":
          case "recent_messages":
            // Initial list of messages - handle both formats
            const messagesList = message.data.messages || message.data;
            if (messagesList && Array.isArray(messagesList)) {
              logger.debug('p2p', "📨 Received message list via WebSocket:", messagesList.length, "messages");
              dispatch(
                setMessages({
                  tradeId,
                  messages: messagesList as TradeMessage[],
                })
              );
            }
            setIsConnected(true);
            break;

          case "new_message":
          case "message_received":
            // New message received - the data IS the message itself
            if (message.data && message.data.id) {
              // Log detailed info about incoming message
              logger.debug('p2p', "📨 New message received via WebSocket:", {
                id: message.data.id,
                hasText: !!message.data.message,
                text: message.data.message?.substring(0, 30) || '(no text)',
                hasImages: Array.isArray(message.data.images) && message.data.images.length > 0,
                imageCount: message.data.images?.length || 0,
                images: message.data.images,
              });
              
              const newMessage: TradeMessage = {
                id: message.data.id,
                trade: message.data.trade || parseInt(tradeId),
                sender: message.data.sender,
                sender_name: message.data.sender_name,
                message: message.data.message,
                // IMPORTANT: Set images array even if empty - this signals that refresh is needed
                images: message.data.images || [],
                timestamp: message.data.timestamp,
                seller_photo: message.data.seller_photo || "",
              };
              
              dispatch(
                addMessageFromWS({
                  tradeId,
                  message: newMessage,
                })
              );
              
              // If message has images but no valid URLs, log warning
              if (newMessage.images && newMessage.images.length > 0) {
                const hasValidUrls = newMessage.images.some((img: any) => {
                  const url = (img?.image_url || img?.image || img);
                  return url && typeof url === 'string' && url.trim() !== '' && !url.startsWith('blob:');
                });
                
                if (!hasValidUrls) {
                  console.warn("⚠️ WebSocket message has images but no valid S3 URLs yet - auto-refresh should trigger");
                }
              }
            }
            setIsConnected(true);
            break;

          case "error":
            // Silent error handling
            console.warn("⚠️ WebSocket error message:", message.data);
            break;

          default:
            // Log unknown message types for debugging
            logger.debug('p2p', "❓ Unknown WebSocket message type:", message.type, message.data);
            break;
        }
      } catch (error) {
        // Silent error handling
      }
    });

    // Handle WebSocket errors
    const unsubscribeError = ws.onError((error) => {
      // Silent error handling
    });

    // Handle WebSocket close
    const unsubscribeClose = ws.onClose(() => {
      if (!mountedRef.current) return;
      setIsConnected(false);
      // Silent close handling
    });

    // Handle WebSocket open
    const unsubscribeOpen = ws.onOpen(() => {
      if (!mountedRef.current) return;
      setIsConnected(true);
      // Silent open handling
    });

    // Connect to WebSocket
    ws.connect(tradeId, token);

    // Cleanup function
    return () => {
      unsubscribeMessage();
      unsubscribeError();
      unsubscribeClose();
      unsubscribeOpen();
      cleanupTradeMessagesWebSocket(tradeId);
      dispatch(clearMessagesForTrade(tradeId));
    };
  }, [enabled, tradeId, dispatch]);

  return {
    sendMessage: (message: string, images: File[] = []) => {
      wsRef.current.sendMessage(message, images);
    },
    isConnected,
  };
};

