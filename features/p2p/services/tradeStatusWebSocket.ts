import { API_CONFIG } from "@/lib/appConfig";

import { logger } from '@/lib/utils/logger';
import { normalizeWebSocketUrl } from "@/lib/utils/websocketUtils";
import { logP2pWebSocketUrl } from "@/features/p2p/utils/logP2pWebSocketUrl";

export interface TradeStatus {
  id: string;
  status: "matched" | "half-matched" | "completed" | "cancelled";
  amount?: string;
  buyer?: string;
  seller?: string;
  [key: string]: any;
}

export interface WebSocketMessage {
  type: "connection_established" | "status_update" | "trade_update" | "error";
  data?: any;
  // Support flat structure from backend
  status?: "matched" | "half-matched" | "completed" | "cancelled";
  trade_id?: string;
  id?: string;
  buyer_id?: string | null;
  seller_id?: string | null;
  amount?: string;
  currency?: string;
  timestamp?: string;
  [key: string]: any;
}

type MessageHandler = (message: WebSocketMessage) => void;
type ErrorHandler = (error: Event) => void;
type CloseHandler = () => void;
type OpenHandler = () => void;

export class TradeStatusWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageHandlers: Set<MessageHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private closeHandlers: Set<CloseHandler> = new Set();
  private openHandlers: Set<OpenHandler> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  private url: string = "";
  private lastTradeId: string = "";
  private lastToken: string = "";
  private hasPermanentFailure: boolean = false;

  connect(tradeId: string, token: string): void {
    // Check for permanent failure
    if (this.hasPermanentFailure) {
      logger.warn('p2p', "⚠️ Trade Status WebSocket has permanent failure, skipping connection attempt");
      return;
    }

    // If already connecting or connected to same trade, skip
    if (
      this.ws?.readyState === WebSocket.CONNECTING &&
      this.lastTradeId === tradeId
    ) {
      return;
    }
    if (this.ws?.readyState === WebSocket.OPEN && this.lastTradeId === tradeId) {
      return;
    }

    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING) &&
      this.lastTradeId !== tradeId
    ) {
      logger.debug('p2p', "🔄 Switching to different trade, closing current connection");
      this.disconnect();
    }

    this.isIntentionallyClosed = false;
    this.lastTradeId = tradeId;
    this.lastToken = token;
    
    // Validate inputs silently
    if (!tradeId || !token || token.length < 10) {
      this.hasPermanentFailure = true;
      return;
    }

    // Check if token looks like a JWT
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      this.hasPermanentFailure = true;
      return;
    }

    try {
      this.url = normalizeWebSocketUrl(
        API_CONFIG.P2P.SOCKETS.TRADE_STATUS(tradeId, token)
      );

      logP2pWebSocketUrl("trade-status", this.url);

      // Only log on first connection attempt
      if (this.reconnectAttempts === 0) {
        logger.debug('p2p', "🔌 Connecting to Trade Status WebSocket...");
        logger.debug('p2p', "🆔 Trade ID:", tradeId);
      }

      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        if (this.reconnectAttempts === 0) {
          logger.debug('p2p', "✅ Trade Status WebSocket connected");
        }
        this.reconnectAttempts = 0;
        this.hasPermanentFailure = false;
        this.openHandlers.forEach((handler) => handler());
      };

      this.ws.onmessage = (event) => {
        try {
          logger.debug('p2p', "📨 Raw WebSocket message received:", event.data);
          const message: WebSocketMessage = JSON.parse(event.data);
          logger.debug('p2p', "📨 Parsed Trade Status Update:", message);
          logger.debug('p2p', "📊 Message type:", message.type);
          logger.debug('p2p', "📊 Message status:", message.status || message.data?.status);
          this.messageHandlers.forEach((handler) => handler(message));
        } catch (error) {
                            }
      };

      this.ws.onerror = (error) => {
        if (this.reconnectAttempts === 0) {
                            }
        
        this.errorHandlers.forEach((handler) => handler(error));
      };

      this.ws.onclose = (event) => {
        // Handle different close codes silently
        switch (event.code) {
          case 1000: // Normal closure
            break;
          case 1008: // Policy violation
            this.hasPermanentFailure = true;
            if (this.reconnectAttempts === 0) {
                          }
            break;
          case 4001: // Unauthorized
          case 4003: // Forbidden
            this.hasPermanentFailure = true;
            if (this.reconnectAttempts === 0) {
                          }
            break;
          case 1006: // Abnormal closure
          default:
            break;
        }
        
        this.closeHandlers.forEach((handler) => handler());

        // Only reconnect if not intentionally closed, not permanently failed, and under max attempts
        if (!this.isIntentionallyClosed && 
            !this.hasPermanentFailure && 
            this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(tradeId, token);
        }
      };
    } catch (error) {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect(tradeId, token);
      }
    }
  }

  private scheduleReconnect(tradeId: string, token: string): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5);

    this.reconnectTimeout = setTimeout(() => {
      this.connect(tradeId, token);
    }, delay);
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, "Client disconnect");
      }
      this.ws = null;
    }
  }

  resetPermanentFailure(): void {
    this.hasPermanentFailure = false;
    this.reconnectAttempts = 0;
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  onClose(handler: CloseHandler): () => void {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  onOpen(handler: OpenHandler): () => void {
    this.openHandlers.add(handler);
    return () => this.openHandlers.delete(handler);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getReadyState(): number | null {
    return this.ws?.readyState ?? null;
  }

  hasFailed(): boolean {
    return this.hasPermanentFailure;
  }

  getConnectionInfo(): {
    isConnected: boolean;
    readyState: number | null;
    hasPermanentFailure: boolean;
    reconnectAttempts: number;
  } {
    return {
      isConnected: this.isConnected(),
      readyState: this.getReadyState(),
      hasPermanentFailure: this.hasPermanentFailure,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Create a map to store WebSocket instances per trade
const tradeStatusWSInstances = new Map<string, TradeStatusWebSocket>();
const tradeStatusWSSubscriberCounts = new Map<string, number>();

export const getTradeStatusWebSocket = (tradeId: string): TradeStatusWebSocket => {
  if (!tradeStatusWSInstances.has(tradeId)) {
    tradeStatusWSInstances.set(tradeId, new TradeStatusWebSocket());
  }
  return tradeStatusWSInstances.get(tradeId)!;
};

export const retainTradeStatusWebSocket = (tradeId: string): void => {
  if (!tradeId?.trim()) return;
  tradeStatusWSSubscriberCounts.set(
    tradeId,
    (tradeStatusWSSubscriberCounts.get(tradeId) ?? 0) + 1
  );
};

export const releaseTradeStatusWebSocket = (tradeId: string): void => {
  if (!tradeId?.trim()) return;
  const next = (tradeStatusWSSubscriberCounts.get(tradeId) ?? 1) - 1;
  if (next <= 0) {
    tradeStatusWSSubscriberCounts.delete(tradeId);
    cleanupTradeStatusWebSocket(tradeId);
  } else {
    tradeStatusWSSubscriberCounts.set(tradeId, next);
  }
};

export const cleanupTradeStatusWebSocket = (tradeId: string): void => {
  const instance = tradeStatusWSInstances.get(tradeId);
  if (instance) {
    instance.disconnect();
    tradeStatusWSInstances.delete(tradeId);
  }
  tradeStatusWSSubscriberCounts.delete(tradeId);
};

