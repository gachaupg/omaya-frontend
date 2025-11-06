import { API_CONFIG } from "@/lib/appConfig";
import { P2POrder } from "../types";
import {
  SingletonWebSocket,
  WebSocketMessage as BaseWebSocketMessage,
} from "@/lib/utils/baseWebSocket";

// P2P-specific WebSocket message interface
export interface WebSocketMessage extends BaseWebSocketMessage {
  type: "connection_established" | "orders_update" | "initial_data" | "error" | "pong";
  data: {
    buy_orders?: P2POrder[];
    sell_orders?: P2POrder[];
    pagination?: {
      current_page: number;
      total_pages: number;
      has_next: boolean;
      has_previous: boolean;
      total_buy_orders: number;
      total_sell_orders: number;
      orders_per_page: number;
    };
    my_orders_only?: boolean;
    search_query?: string;
    timestamp?: string;
    full_refresh?: boolean;
    message?: string;
  };
}

type MessageHandler = (message: WebSocketMessage) => void;
type ErrorHandler = (error: Event) => void;
type CloseHandler = () => void;
type OpenHandler = () => void;

/**
 * P2POrdersWebSocket - Production-ready WebSocket for P2P order updates
 *
 * Now extends BaseWebSocket with:
 * - ✅ Ping/pong heartbeat (30s)
 * - ✅ Silent error handling
 * - ✅ Permanent failure detection
 * - ✅ Singleton pattern
 * - ✅ Connection pooling
 *
 * 100% Backward Compatible - All existing code continues to work
 */
export class P2POrdersWebSocket extends SingletonWebSocket<{ token: string }> {
  private lastToken: string = "";
  // Type-safe handler sets for P2P-specific messages
  private p2pMessageHandlers: Set<MessageHandler> = new Set();
  private p2pErrorHandlers: Set<ErrorHandler> = new Set();
  private p2pCloseHandlers: Set<CloseHandler> = new Set();
  private p2pOpenHandlers: Set<OpenHandler> = new Set();

  constructor() {
    super({
      maxReconnectAttempts: 5,
      reconnectDelay: 3000,
      pingInterval: 30000,
      loggerModule: "p2p",
      validateToken: true,
    });

    // Bridge base handlers to P2P-specific handlers
    super.onMessage((baseMessage) => {
      const p2pMessage = baseMessage as unknown as WebSocketMessage;
      this.p2pMessageHandlers.forEach((handler) => handler(p2pMessage));
    });

    super.onError((error) => {
      this.p2pErrorHandlers.forEach((handler) => handler(error));
    });

    super.onClose(() => {
      this.p2pCloseHandlers.forEach((handler) => handler());
    });

    super.onOpen(() => {
      this.p2pOpenHandlers.forEach((handler) => handler());
    });
  }

  /**
   * Build WebSocket URL from token
   */
  protected buildUrl(params: { token: string }): string {
    return API_CONFIG.P2P.SOCKETS.P2P_ORDERS(params.token);
  }

  /**
   * Get instance key for singleton pattern
   */
  protected getInstanceKey(params: { token: string }): string {
    // Single instance for all P2P orders (not per token)
    return "p2p-orders";
  }

  /**
   * Check if connection params match
   */
  protected isSameConnection(params: { token: string }): boolean {
    return this.lastToken === params.token;
  }

  /**
   * Connect method - accepts params object (base class signature)
   */
  connect(params: { token: string }): void;
  /**
   * Backward compatible connect method - accepts token string directly
   */
  connect(token: string): void;
  /**
   * Implementation
   */
  connect(tokenOrParams: string | { token: string }): void {
    const token =
      typeof tokenOrParams === "string" ? tokenOrParams : tokenOrParams.token;
    this.lastToken = token;
    super.connect({ token });
  }

  // Override handler methods to use P2P-specific types
  onMessage(handler: MessageHandler): () => void {
    this.p2pMessageHandlers.add(handler);
    return () => this.p2pMessageHandlers.delete(handler);
  }

  onError(handler: ErrorHandler): () => void {
    this.p2pErrorHandlers.add(handler);
    return () => this.p2pErrorHandlers.delete(handler);
  }

  onClose(handler: CloseHandler): () => void {
    this.p2pCloseHandlers.add(handler);
    return () => this.p2pCloseHandlers.delete(handler);
  }

  onOpen(handler: OpenHandler): () => void {
    this.p2pOpenHandlers.add(handler);
    return () => this.p2pOpenHandlers.delete(handler);
  }
}

// Singleton instance
let p2pOrdersWSInstance: P2POrdersWebSocket | null = null;

export const getP2POrdersWebSocket = (): P2POrdersWebSocket => {
  if (!p2pOrdersWSInstance) {
    p2pOrdersWSInstance = new P2POrdersWebSocket();
  }
  return p2pOrdersWSInstance;
};

export const cleanupP2POrdersWebSocket = (): void => {
  if (p2pOrdersWSInstance) {
    p2pOrdersWSInstance.disconnect();
    p2pOrdersWSInstance = null;
  }
};
