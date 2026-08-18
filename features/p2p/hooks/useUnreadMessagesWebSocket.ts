import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import {
  getUnreadMessagesWebSocket,
  RecentMessage,
  WebSocketMessage,
} from "../services/unreadMessagesWebSocket";
import { updateUnreadCount, setRecentMessages } from "../slices/unreadMessagesSlice";
import { cookieUtils } from "@/lib/utils/cookieUtils";
import { logger } from "@/lib/utils/logger";
import { API_CONFIG } from "@/lib/appConfig";
import { logP2pWebSocketUrl } from "../utils/logP2pWebSocketUrl";

interface UseUnreadMessagesWebSocketOptions {
  enabled?: boolean;
  onNewMessage?: (count: number) => void;
  onRecentMessages?: (messages: RecentMessage[]) => void;
  onConnectionChange?: (connected: boolean) => void;
}

const applyRecentMessagesUpdate = (
  message: WebSocketMessage,
  dispatch: AppDispatch,
  onNewMessageRef: MutableRefObject<
    UseUnreadMessagesWebSocketOptions["onNewMessage"]
  >,
  onRecentMessagesRef: MutableRefObject<
    UseUnreadMessagesWebSocketOptions["onRecentMessages"]
  >
) => {
  const count = message.data?.count ?? 0;
  const recentMessagesList = message.data?.messages ?? [];
  logger.debug("unread-messages", "Received unread messages update:", {
    count,
    messagesLength: recentMessagesList.length,
  });

  dispatch(updateUnreadCount(count));
  dispatch(setRecentMessages(recentMessagesList));

  onNewMessageRef.current?.(count);
  onRecentMessagesRef.current?.(recentMessagesList);
};

/**
 * Hook for managing unread messages WebSocket connection
 *
 * @param options Configuration options
 * @returns Connection state and control functions
 */
export const useUnreadMessagesWebSocket = (
  options: UseUnreadMessagesWebSocketOptions = {}
) => {
  const { enabled = true, onNewMessage, onRecentMessages, onConnectionChange } =
    options;
  const dispatch = useDispatch<AppDispatch>();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef(getUnreadMessagesWebSocket());
  const mountedRef = useRef(true);
  const onNewMessageRef = useRef(onNewMessage);
  const onRecentMessagesRef = useRef(onRecentMessages);
  const onConnectionChangeRef = useRef(onConnectionChange);

  onNewMessageRef.current = onNewMessage;
  onRecentMessagesRef.current = onRecentMessages;
  onConnectionChangeRef.current = onConnectionChange;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const getAccessToken = (): string | null => {
      const cookieToken = cookieUtils.getCookie("access_token");
      if (cookieToken) {
        logger.debug("unread-messages", "✅ Access token found in cookies");
        return cookieToken;
      }

      if (typeof window !== "undefined") {
        const localToken = localStorage.getItem("access_token");
        if (localToken) {
          logger.debug("unread-messages", "✅ Access token found in localStorage");
          return localToken;
        }
      }

      return null;
    };

    const token = getAccessToken();

    if (!token) {
      logger.warn("unread-messages", "⚠️ No access token found, cannot connect to WebSocket");
      setConnectionError("No access token");
      return;
    }

    if (!token.includes(".")) {
      logger.error("unread-messages", "⚠️ Invalid token format (not a JWT)");
      setConnectionError("Invalid token format");
      return;
    }

    const ws = wsRef.current;

    const unsubscribeMessage = ws.onMessage((message: WebSocketMessage) => {
      if (!mountedRef.current) return;

      try {
        const msgType = String(message.type ?? "").toLowerCase();

        switch (msgType) {
          case "connection_established":
            setIsConnected(true);
            setConnectionError(null);
            onConnectionChangeRef.current?.(true);
            logger.debug("unread-messages", "Connection established:", {
              connection_id: message.data?.connection_id,
              user_id: message.data?.user_id,
            });
            break;

          case "recent_messages":
            applyRecentMessagesUpdate(
              message,
              dispatch,
              onNewMessageRef,
              onRecentMessagesRef
            );
            break;

          case "new_message":
          case "message_received": {
            const data = message.data;
            if (data?.messages && Array.isArray(data.messages)) {
              applyRecentMessagesUpdate(
                message,
                dispatch,
                onNewMessageRef,
                onRecentMessagesRef
              );
              break;
            }
            const single = data as RecentMessage | undefined;
            if (single?.entity_id != null) {
              dispatch(updateUnreadCount((message.data?.count as number) ?? 1));
              onNewMessageRef.current?.((message.data?.count as number) ?? 1);
              onRecentMessagesRef.current?.([single]);
            } else {
              onNewMessageRef.current?.((message.data?.count as number) ?? 1);
            }
            break;
          }

          case "error":
            logger.error("unread-messages", "WebSocket error:", message.data);
            setConnectionError(message.data?.message || "WebSocket error");
            break;

          default:
            if (process.env.NODE_ENV === "development") {
              logger.debug("unread-messages", "Unknown message type:", message.type);
            }
        }
      } catch (error) {
        logger.error("unread-messages", "Error handling WebSocket message:", error);
      }
    });

    const unsubscribeOpen = ws.onOpen(() => {
      if (!mountedRef.current) return;
      logger.debug("unread-messages", "WebSocket connected");
      setIsConnected(true);
      setConnectionError(null);
      onConnectionChangeRef.current?.(true);
    });

    const unsubscribeClose = ws.onClose(() => {
      if (!mountedRef.current) return;
      logger.debug("unread-messages", "WebSocket disconnected");
      setIsConnected(false);
      onConnectionChangeRef.current?.(false);
    });

    const unsubscribeError = ws.onError(() => {
      if (!mountedRef.current) return;
      setConnectionError("Connection error");
    });

    const wsUrl = API_CONFIG.P2P.SOCKETS.RECENT_MESSAGES(token);
    logP2pWebSocketUrl("unread-messages", wsUrl);
    ws.connect({ token });

    return () => {
      unsubscribeMessage();
      unsubscribeOpen();
      unsubscribeClose();
      unsubscribeError();
    };
  }, [enabled, dispatch]);

  return {
    isConnected,
    connectionError,
    reconnect: () => {
      logger.debug("unread-messages", "Reconnecting WebSocket");
      const token =
        cookieUtils.getCookie("access_token") ||
        localStorage.getItem("access_token");
      if (token) {
        wsRef.current.connect({ token });
      }
    },
  };
};
