import { API_CONFIG } from "@/lib/appConfig";
import {
  SingletonWebSocket,
  WebSocketMessage as BaseWebSocketMessage,
} from "@/lib/utils/baseWebSocket";

// Message interface based on the WebSocket response structure
export interface MessageImage {
  id: string;
  image: string;
  image_url: string;
}

export interface RecentMessage {
  id: string;
  type: string;
  content: string | null;
  sender_id: number;
  sender_name: string;
  sender_email: string;
  timestamp: string;
  message_type: string;
  entity_id: number;
  images: MessageImage[];
}

export interface RecentMessagesData {
  messages: RecentMessage[];
  count: number;
  message_type: string | null;
  entity_id: number | null;
}

// P2P-specific WebSocket message interface for recent messages
export interface WebSocketMessage extends BaseWebSocketMessage {
  type: "connection_established" | "recent_messages" | "error";
  data: {
    messages?: RecentMessage[];
    count?: number;
    message_type?: string | null;
    entity_id?: number | null;
    message?: string;
    connection_id?: string;
    user_id?: number;
    group_name?: string;
    timestamp?: string;
  };
}

type MessageHandler = (message: WebSocketMessage) => void;
type ErrorHandler = (error: Event) => void;
type CloseHandler = () => void;
type OpenHandler = () => void;

/**
 * UnreadMessagesWebSocket - WebSocket for unread messages updates
 *
 * Extends BaseWebSocket with:
 * - ✅ Ping/pong heartbeat (30s)
 * - ✅ Silent error handling
 * - ✅ Permanent failure detection
 * - ✅ Singleton pattern
 * - ✅ Connection pooling
 */
export class UnreadMessagesWebSocket extends SingletonWebSocket<{ token: string }> {
  private lastToken: string = "";
  // Type-safe handler sets for unread messages
  private messagesMessageHandlers: Set<MessageHandler> = new Set();
  private messagesErrorHandlers: Set<ErrorHandler> = new Set();
  private messagesCloseHandlers: Set<CloseHandler> = new Set();
  private messagesOpenHandlers: Set<OpenHandler> = new Set();

  constructor() {
    super({
      maxReconnectAttempts: 5,
      reconnectDelay: 3000,
      pingInterval: 30000,
      loggerModule: "unread-messages",
      validateToken: true,
    });

    // Bridge base handlers to unread-messages-specific handlers
    super.onMessage((baseMessage) => {
      const wsMessage = baseMessage as unknown as WebSocketMessage;
      this.messagesMessageHandlers.forEach((handler) => handler(wsMessage));
    });

    super.onError((error) => {
      this.messagesErrorHandlers.forEach((handler) => handler(error));
    });

    super.onClose(() => {
      this.messagesCloseHandlers.forEach((handler) => handler());
    });

    super.onOpen(() => {
      this.messagesOpenHandlers.forEach((handler) => handler());
    });
  }

  /**
   * Build WebSocket URL from token
   */
  protected buildUrl(params: { token: string }): string {
    return API_CONFIG.P2P.SOCKETS.RECENT_MESSAGES(params.token);
  }

  /**
   * Get instance key for singleton pattern
   */
  protected getInstanceKey(params: { token: string }): string {
    // Single instance for all unread messages (not per token)
    return "unread-messages";
  }

  /**
   * Check if connection params match
   */
  protected isSameConnection(params: { token: string }): boolean {
    return this.lastToken === params.token;
  }

  /**
   * Connect to WebSocket
   */
  override connect(params: { token: string }): void {
    this.lastToken = params.token;
    super.connect(params);
  }

  /**
   * Register message handler
   * Returns cleanup function
   */
  override onMessage(handler: MessageHandler): () => void {
    this.messagesMessageHandlers.add(handler);
    return () => this.messagesMessageHandlers.delete(handler);
  }

  /**
   * Register error handler
   * Returns cleanup function
   */
  override onError(handler: ErrorHandler): () => void {
    this.messagesErrorHandlers.add(handler);
    return () => this.messagesErrorHandlers.delete(handler);
  }

  /**
   * Register close handler
   * Returns cleanup function
   */
  override onClose(handler: CloseHandler): () => void {
    this.messagesCloseHandlers.add(handler);
    return () => this.messagesCloseHandlers.delete(handler);
  }

  /**
   * Register open handler
   * Returns cleanup function
   */
  override onOpen(handler: OpenHandler): () => void {
    this.messagesOpenHandlers.add(handler);
    return () => this.messagesOpenHandlers.delete(handler);
  }
}

// Singleton instance
let unreadMessagesWSInstance: UnreadMessagesWebSocket | null = null;

export const getUnreadMessagesWebSocket = (): UnreadMessagesWebSocket => {
  if (!unreadMessagesWSInstance) {
    unreadMessagesWSInstance = new UnreadMessagesWebSocket();
  }
  return unreadMessagesWSInstance;
};

export const cleanupUnreadMessagesWebSocket = (): void => {
  if (unreadMessagesWSInstance) {
    unreadMessagesWSInstance.disconnect();
    unreadMessagesWSInstance = null;
  }
};

