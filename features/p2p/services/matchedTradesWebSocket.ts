import { API_CONFIG } from "@/lib/appConfig";
import {
  SingletonWebSocket,
  WebSocketMessage as BaseWebSocketMessage,
} from "@/lib/utils/baseWebSocket";

export interface MatchedTrade {
  id: string;
  buy_order: number | null;
  sell_order: number | null;
  owner: string;
  advertiser_name: string;
  auto_reply: string;
  terms_and_conditions: string;
  completion_rate: number;
  completion_time: string;
  limit: string;
  buyer: string;
  seller: string;
  price: string;
  amount: string;
  timestamp: string;
  associated_trade: number;
  order_type: string;
  status: string;
  rate: string;
  payment_details: Array<{
    provider: string;
    account_name: string;
    account_number: string;
  }>;
  buyer_photo: string;
  seller_photo: string;
  commission_amount: string;
  net_amount: string;
}

// MatchedTrades-specific WebSocket message interface
export interface WebSocketMessage extends BaseWebSocketMessage {
  type:
    | "connection_established"
    | "initial_data"
    | "trades_update"
    | "trade_update";
  data: any;
}

export interface MatchedTradesData {
  trades: MatchedTrade[];
  count: number;
  timestamp?: string;
}

type MessageHandler = (message: WebSocketMessage) => void;
type ErrorHandler = (error: Event) => void;
type CloseHandler = () => void;
type OpenHandler = () => void;

/**
 * MatchedTradesWebSocket - Production-ready WebSocket for matched trades updates
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
export class MatchedTradesWebSocket extends SingletonWebSocket<{
  token: string;
}> {
  private lastToken: string = "";
  // Type-safe handler sets for MatchedTrades-specific messages
  private matchedTradesMessageHandlers: Set<MessageHandler> = new Set();
  private matchedTradesErrorHandlers: Set<ErrorHandler> = new Set();
  private matchedTradesCloseHandlers: Set<CloseHandler> = new Set();
  private matchedTradesOpenHandlers: Set<OpenHandler> = new Set();

  constructor() {
    super({
      maxReconnectAttempts: 5,
      reconnectDelay: 3000,
      pingInterval: 30000,
      loggerModule: "p2p",
      validateToken: true,
    });

    // Bridge base handlers to MatchedTrades-specific handlers
    super.onMessage((baseMessage) => {
      const matchedTradesMessage = baseMessage as unknown as WebSocketMessage;
      this.matchedTradesMessageHandlers.forEach((handler) =>
        handler(matchedTradesMessage)
      );
    });

    super.onError((error) => {
      this.matchedTradesErrorHandlers.forEach((handler) => handler(error));
    });

    super.onClose(() => {
      this.matchedTradesCloseHandlers.forEach((handler) => handler());
    });

    super.onOpen(() => {
      this.matchedTradesOpenHandlers.forEach((handler) => handler());
    });
  }

  /**
   * Build WebSocket URL from token
   */
  protected buildUrl(params: { token: string }): string {
    return API_CONFIG.P2P.SOCKETS.MATCHED_TRADES(params.token);
  }

  /**
   * Get instance key for singleton pattern
   */
  protected getInstanceKey(params: { token: string }): string {
    // Single instance for all matched trades (not per token)
    return "matched-trades";
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

  // Override handler methods to use MatchedTrades-specific types
  onMessage(handler: MessageHandler): () => void {
    this.matchedTradesMessageHandlers.add(handler);
    return () => this.matchedTradesMessageHandlers.delete(handler);
  }

  onError(handler: ErrorHandler): () => void {
    this.matchedTradesErrorHandlers.add(handler);
    return () => this.matchedTradesErrorHandlers.delete(handler);
  }

  onClose(handler: CloseHandler): () => void {
    this.matchedTradesCloseHandlers.add(handler);
    return () => this.matchedTradesCloseHandlers.delete(handler);
  }

  onOpen(handler: OpenHandler): () => void {
    this.matchedTradesOpenHandlers.add(handler);
    return () => this.matchedTradesOpenHandlers.delete(handler);
  }
}

// Singleton instance
let matchedTradesWSInstance: MatchedTradesWebSocket | null = null;

export const getMatchedTradesWebSocket = (): MatchedTradesWebSocket => {
  if (!matchedTradesWSInstance) {
    matchedTradesWSInstance = new MatchedTradesWebSocket();
  }
  return matchedTradesWSInstance;
};
