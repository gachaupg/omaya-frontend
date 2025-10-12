import { useEffect, useRef } from "react";
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

interface UseTradeMessagesWebSocketOptions {
  tradeId: string;
  enabled?: boolean;
}

export const useTradeMessagesWebSocket = (options: UseTradeMessagesWebSocketOptions) => {
  const { tradeId, enabled = true } = options;
  const dispatch = useDispatch<AppDispatch>();
  const wsRef = useRef(getTradeMessagesWebSocket(tradeId));
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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
            break;

          case "messages_list":
          case "initial_messages":
            // Initial list of messages - handle both formats
            const messagesList = message.data.messages || message.data;
            if (messagesList && Array.isArray(messagesList)) {
              dispatch(
                setMessages({
                  tradeId,
                  messages: messagesList as TradeMessage[],
                })
              );
            }
            break;

          case "new_message":
          case "message_received":
            // New message received - the data IS the message itself
            if (message.data && message.data.id) {
              const newMessage: TradeMessage = {
                id: message.data.id,
                trade: message.data.trade || parseInt(tradeId),
                sender: message.data.sender,
                sender_name: message.data.sender_name,
                message: message.data.message,
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
            }
            break;

          case "error":
            // Silent error handling
            break;

          default:
            // Silent - unknown message type
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
      // Silent close handling
    });

    // Handle WebSocket open
    const unsubscribeOpen = ws.onOpen(() => {
      if (!mountedRef.current) return;
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
    isConnected: wsRef.current.isConnected(),
  };
};

