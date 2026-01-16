import { useState, useEffect, useRef, useCallback } from 'react';
import { storage } from '@/features/auth/utils/storage';
import { API_BASE_URL } from '@/config/api';
import { API_CONFIG } from '@/lib/appConfig';
import { logger } from '@/lib/utils/logger';

export interface ChatMessage {
  id?: string;
  sender_name: string;
  sender_role: 'user' | 'agent';
  message: string;
  timestamp: string;
}

export interface ChatSession {
  session_id: string;
  status: 'waiting' | 'active' | 'closed';
  queue_position?: number;
  created_at: string;
}

export interface QueueStatus {
  waiting_count: number;
  average_wait_time?: number;
}

type WebSocketMessage =
  | { type: 'chat_message'; data: ChatMessage }
  | { type: 'typing_indicator'; user_name: string; is_typing: boolean }
  | { type: 'agent_joined'; agent_name: string; session_id: string; message: string }
  | { type: 'chat_transferred'; message: string }
  | { type: 'chat_closed'; closed_by: string; message: string }
  | { type: 'chat_history'; messages: ChatMessage[] };

export const useLiveChat = () => {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [typingIndicator, setTypingIndicator] = useState<{ user_name: string; is_typing: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const getAccessToken = (): string | null => {
    const profile = storage.getProfile();
    return profile?.tokens?.access || null;
  };

  const createSession = useCallback(async (): Promise<ChatSession> => {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await fetch(`${API_BASE_URL}${API_CONFIG.LIVE_CHAT.CREATE_SESSION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create chat session');
      }

      const data = await response.json();
      logger.debug('live-chat', 'Session created:', data);
      return data.session;
    } catch (err) {
      logger.error('live-chat', 'Failed to create session:', err);
      throw err;
    }
  }, []);

  const getQueueStatus = useCallback(async (): Promise<QueueStatus> => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.LIVE_CHAT.QUEUE_STATUS}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get queue status');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      logger.error('live-chat', 'Failed to get queue status:', err);
      return { waiting_count: 0 };
    }
  }, []);

  const connectWebSocket = useCallback((sessionId: string) => {
    const token = getAccessToken();
    if (!token) {
      setError('Authentication required');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const wsUrl = API_CONFIG.LIVE_CHAT.SOCKETS.CHAT(sessionId, token);
      
      logger.debug('live-chat', 'Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        logger.debug('live-chat', 'WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          logger.debug('live-chat', 'WebSocket message received:', data);

          switch (data.type) {
            case 'chat_message':
              setMessages((prev) => [...prev, data.data]);
              break;

            case 'typing_indicator':
              setTypingIndicator({
                user_name: data.user_name,
                is_typing: data.is_typing,
              });
              if (!data.is_typing) {
                setTimeout(() => setTypingIndicator(null), 1000);
              }
              break;

            case 'agent_joined':
              setSession((prev) => prev ? { ...prev, status: 'active' } : null);
              setMessages((prev) => [
                ...prev,
                {
                  sender_name: 'System',
                  sender_role: 'agent',
                  message: data.message,
                  timestamp: new Date().toISOString(),
                },
              ]);
              break;

            case 'chat_transferred':
              setMessages((prev) => [
                ...prev,
                {
                  sender_name: 'System',
                  sender_role: 'agent',
                  message: data.message,
                  timestamp: new Date().toISOString(),
                },
              ]);
              break;

            case 'chat_closed':
              setSession((prev) => prev ? { ...prev, status: 'closed' } : null);
              setMessages((prev) => [
                ...prev,
                {
                  sender_name: 'System',
                  sender_role: 'agent',
                  message: data.message,
                  timestamp: new Date().toISOString(),
                },
              ]);
              break;

            case 'chat_history':
              setMessages(data.messages || []);
              break;
          }
        } catch (err) {
          logger.error('live-chat', 'Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        logger.error('live-chat', 'WebSocket error:', error);
        setError('Connection error. Please try again.');
        setIsConnecting(false);
      };

      ws.onclose = (event) => {
        logger.debug('live-chat', 'WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);

        // Attempt to reconnect if not a normal closure and session exists
        if (event.code !== 1000 && sessionId && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          logger.debug('live-chat', `Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket(sessionId);
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Connection lost. Please refresh and try again.');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      logger.error('live-chat', 'Failed to create WebSocket:', err);
      setError('Failed to connect. Please try again.');
      setIsConnecting(false);
    }
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('Not connected. Please wait...');
      return false;
    }

    if (!message.trim()) {
      return false;
    }

    try {
      const messageData = {
        type: 'chat_message',
        message: message.trim(),
      };

      wsRef.current.send(JSON.stringify(messageData));
      
      // Add user message to local state immediately
      setMessages((prev) => [
        ...prev,
        {
          sender_name: 'You',
          sender_role: 'user',
          message: message.trim(),
          timestamp: new Date().toISOString(),
        },
      ]);

      return true;
    } catch (err) {
      logger.error('live-chat', 'Failed to send message:', err);
      setError('Failed to send message. Please try again.');
      return false;
    }
  }, []);

  const startChat = useCallback(async () => {
    try {
      setError(null);
      setIsConnecting(true);

      // Get queue status first
      const queue = await getQueueStatus();
      setQueueStatus(queue);

      // Create session
      const newSession = await createSession();
      setSession(newSession);

      // Connect WebSocket
      connectWebSocket(newSession.session_id);
    } catch (err: any) {
      logger.error('live-chat', 'Failed to start chat:', err);
      setError(err.message || 'Failed to start chat. Please try again.');
      setIsConnecting(false);
    }
  }, [createSession, connectWebSocket, getQueueStatus]);

  const closeChat = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User closed chat');
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setSession(null);
    setMessages([]);
    setIsConnected(false);
    setIsConnecting(false);
    setTypingIndicator(null);
    setError(null);
    setQueueStatus(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closeChat();
    };
  }, [closeChat]);

  return {
    session,
    messages,
    isConnected,
    isConnecting,
    queueStatus,
    typingIndicator,
    error,
    startChat,
    sendMessage,
    closeChat,
  };
};

