import { useState, useEffect, useRef, useCallback } from "react";
import { API_CONFIG } from "@/lib/appConfig";
import { cookieUtils } from "@/lib/utils/cookieUtils";
import { storage } from "@/features/auth/utils/storage";
import { logger } from "@/lib/utils/logger";
import { ChatMessage } from "../services/liveChatApi";

export interface LiveChatWebSocketMessage {
  type: "chat_message" | "agent_joined" | "chat_transferred" | "chat_closed" | "typing_indicator";
  data?: {
    sender_name?: string;
    sender_role?: "user" | "agent";
    message?: string;
    timestamp?: string;
  };
  agent_name?: string;
  session_id?: string;
  message?: string;
  user_name?: string;
  is_typing?: boolean;
  closed_by?: string;
}

interface UseLiveChatWebSocketOptions {
  sessionId: string;
  enabled?: boolean;
  onMessage?: (message: LiveChatWebSocketMessage) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
  autoReconnect?: boolean;
}

export const useLiveChatWebSocket = ({
  sessionId,
  enabled = true,
  onMessage,
  onError,
  onClose,
  autoReconnect = true,
}: UseLiveChatWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<LiveChatWebSocketMessage | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState<{ userName: string; isTyping: boolean } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;
  const historyLoadedRef = useRef(false);
  
  // Use refs for callbacks to prevent re-creation of connect function
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onCloseRef = useRef(onClose);
  
  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
    onCloseRef.current = onClose;
  }, [onMessage, onError, onClose]);

  const getAccessToken = useCallback((): string | null => {
    // Try to get token from cookie first
    let token = cookieUtils.getCookie("access_token");
    
    if (!token && typeof window !== "undefined") {
      // Fallback to localStorage
      token = localStorage.getItem("access_token");
    }

    if (!token) {
      // Try from storage
      const profile = storage.getProfile();
      token = profile?.tokens?.access || null;
    }

    return token;
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !sessionId) return;

    // Prevent multiple connections
    if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
      logger.debug("live-chat", "WebSocket already connecting, skipping...");
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      logger.debug("live-chat", "WebSocket already connected, skipping...");
      return;
    }

    // Clean up existing connection if any
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        // Ignore errors during cleanup
      }
      wsRef.current = null;
    }

    const token = getAccessToken();
    if (!token) {
      logger.warn("live-chat", "No access token available for WebSocket connection");
      return;
    }

    // Build WebSocket URL
    const wsUrl = API_CONFIG.LIVE_CHAT.SOCKETS.CHAT(sessionId, token);

    try {
      logger.debug("live-chat", `Connecting to WebSocket: ${wsUrl.substring(0, 50)}...`);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        logger.debug("live-chat", "WebSocket connected");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        
        // Reset history loaded flag when reconnecting
        if (!historyLoadedRef.current) {
          historyLoadedRef.current = false;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data: LiveChatWebSocketMessage = JSON.parse(event.data);
          logger.debug("live-chat", "WebSocket message received:", data);
          
          setLastMessage(data);
          
          // Handle different message types
          if (data.type === "chat_message" && data.data) {
            const chatMessage: ChatMessage = {
              sender_name: data.data.sender_name || "Unknown",
              sender_role: data.data.sender_role || "user",
              message: data.data.message || "",
              timestamp: data.data.timestamp || new Date().toISOString(),
            };
            setMessages((prev) => [...prev, chatMessage]);
          } else if (data.type === "typing_indicator") {
            setIsTyping({
              userName: data.user_name || "Agent",
              isTyping: data.is_typing || false,
            });
            // Clear typing indicator after 3 seconds
            if (data.is_typing) {
              setTimeout(() => {
                setIsTyping(null);
              }, 3000);
            }
          } else if (data.type === "agent_joined") {
            // Add system message when agent joins
            const systemMessage: ChatMessage = {
              sender_name: "System",
              sender_role: "agent",
              message: data.message || `${data.agent_name || "Agent"} has joined the chat`,
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, systemMessage]);
          } else if (data.type === "chat_transferred") {
            // Add system message when chat is transferred
            const systemMessage: ChatMessage = {
              sender_name: "System",
              sender_role: "agent",
              message: data.message || "This chat has been transferred to another agent",
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, systemMessage]);
          } else if (data.type === "chat_closed") {
            // Add system message when chat is closed
            const systemMessage: ChatMessage = {
              sender_name: "System",
              sender_role: "agent",
              message: data.message || `This chat has been closed${data.closed_by ? ` by ${data.closed_by}` : ""}`,
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, systemMessage]);
          }

          onMessageRef.current?.(data);
        } catch (error) {
          logger.error("live-chat", "Failed to parse WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        logger.debug("live-chat", "WebSocket error:", error);
        setIsConnected(false);
        // Don't call onError during reconnection attempts to avoid toast spam
        if (reconnectAttemptsRef.current === 0) {
          onErrorRef.current?.(error);
        }
      };

      ws.onclose = (event) => {
        logger.debug("live-chat", "WebSocket closed", { code: event.code, reason: event.reason });
        setIsConnected(false);
        
        // Only call onClose for intentional disconnections (not during reconnect attempts)
        if (reconnectAttemptsRef.current === 0) {
          onCloseRef.current?.();
        }

        // Clear the ref so we can reconnect
        wsRef.current = null;

        // Auto-reconnect logic - only if not intentionally closed
        if (
          autoReconnect &&
          reconnectAttemptsRef.current < maxReconnectAttempts &&
          enabled &&
          sessionId
        ) {
          reconnectAttemptsRef.current++;
          logger.debug(
            "live-chat",
            `Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
          );
          
          // Clear any existing reconnect timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (enabled && sessionId && wsRef.current === null) {
              connect();
            }
          }, reconnectDelay * reconnectAttemptsRef.current);
        }
      };
    } catch (error) {
      logger.error("live-chat", "Failed to create WebSocket:", error);
      setIsConnected(false);
      wsRef.current = null;
    }
  }, [sessionId, enabled, autoReconnect, getAccessToken]);

  useEffect(() => {
    if (!enabled || !sessionId) {
      return;
    }

    // Call connect function
    connect();

    return () => {
      // Cleanup function - properly close WebSocket
      // Clear any pending reconnection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Don't attempt reconnection on cleanup
      reconnectAttemptsRef.current = maxReconnectAttempts;
      
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, "Component unmounted");
        } catch (e) {
          // Ignore errors during cleanup
        }
        wsRef.current = null;
      }
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sessionId]); // Only depend on enabled and sessionId, connect is stable via refs

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const messageData = {
        type: "chat_message",
        message: message,
      };
      wsRef.current.send(JSON.stringify(messageData));
      
      // Add user message to local state immediately (optimistic update)
      const userMessage: ChatMessage = {
        sender_name: "You",
        sender_role: "user",
        message: message,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
    } else {
      logger.warn("live-chat", "Cannot send message: WebSocket not connected");
    }
  }, []);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const typingData = {
        type: "typing_indicator",
        is_typing: isTyping,
      };
      wsRef.current.send(JSON.stringify(typingData));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const setInitialMessages = useCallback((initialMessages: ChatMessage[]) => {
    setMessages(initialMessages);
    historyLoadedRef.current = true;
  }, []);

  return {
    isConnected,
    lastMessage,
    messages,
    isTyping,
    sendMessage,
    sendTypingIndicator,
    disconnect,
    setInitialMessages,
  };
};

