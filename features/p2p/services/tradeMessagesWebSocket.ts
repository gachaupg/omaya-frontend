import { API_CONFIG } from "@/lib/appConfig";

import { logger } from '@/lib/utils/logger';
import { normalizeWebSocketUrl } from "@/lib/utils/websocketUtils";
import { logP2pWebSocketUrl } from "@/features/p2p/utils/logP2pWebSocketUrl";

export interface TradeMessage {
  id: string;
  trade: number | string;
  trade_id?: string;
  sender: number | string;
  sender_name: string;
  sender_username?: string;
  sender_photo?: string | null;
  message: string;
  images: any[];
  audios?: any[];
  audio_url?: string;
  audio?: string;
  timestamp: string;
  seller_photo: string;
}

export interface WebSocketMessage {
  type:
    | "connection_established"
    | "message_received"
    | "new_message"
    | "messages_list"
    | "initial_messages"
    | "recent_messages"
    | "error"
    | "pong"
    | "status_update";
  data?: any;
  /** Flat payloads on the same socket (e.g. trade canceled) */
  status?: string;
  trade_id?: string;
  message?: string;
  [key: string]: unknown;
}

type MessageHandler = (message: WebSocketMessage) => void;
type ErrorHandler = (error: Event) => void;
type CloseHandler = () => void;
type OpenHandler = () => void;

export class TradeMessagesWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private messageHandlers: Set<MessageHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private closeHandlers: Set<CloseHandler> = new Set();
  private openHandlers: Set<OpenHandler> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  private url: string = "";
  private lastTradeId: string = "";
  private lastToken: string = "";
  private hasPermanentFailure: boolean = false;

  connect(tradeId: string, token: string): void {
    // Check for permanent failure
    if (this.hasPermanentFailure) {
      logger.warn('p2p', "⚠️ WebSocket has permanent failure, skipping connection attempt");
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

    // If connecting or connected to different trade, close existing connection
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
        API_CONFIG.P2P.SOCKETS.TRADE_MESSAGES(tradeId, token)
      );

      logP2pWebSocketUrl("trade-messages", this.url);
      logger.debug('p2p', "🔌 Connecting to Trade Messages WebSocket...");
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        if (this.reconnectAttempts === 0) {
          logger.debug('p2p', "✅ Trade Messages WebSocket connected");
        }
        this.reconnectAttempts = 0;
        this.hasPermanentFailure = false;
        this.openHandlers.forEach((handler) => handler());
        
        // Start ping interval to keep connection alive (every 30 seconds)
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const rawStr = typeof event.data === "string" ? event.data : String(event.data);
                    const message: WebSocketMessage = JSON.parse(rawStr) as WebSocketMessage;
                    this.messageHandlers.forEach((handler) => handler(message));
        } catch (error) {
                  }
      };

      this.ws.onerror = (error) => {
        // Silent error handling - errors will be reported via onclose event
        // Only log on first failure for debugging
        if (this.reconnectAttempts === 0) {
                  }
        
        this.errorHandlers.forEach((handler) => handler(error));
      };

      this.ws.onclose = (event) => {
        // Handle different close codes silently
        switch (event.code) {
          case 1000: // Normal closure - completely silent
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
          case 1006: // Abnormal closure - silent, will retry
          default:
            // Silent for common connection issues
            break;
        }
        
        this.closeHandlers.forEach((handler) => handler());

        // Only reconnect if not intentionally closed, not permanently failed, and under max attempts
        if (!this.isIntentionallyClosed && 
            !this.hasPermanentFailure && 
            this.reconnectAttempts < this.maxReconnectAttempts) {
          // Silent reconnection
          this.scheduleReconnect(tradeId, token);
        }
      };
    } catch (error) {
      // Silent error handling, will retry if needed
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

  private startPingInterval(): void {
    // Clear any existing ping interval
    this.stopPingInterval();
    
    // Send ping every 30 seconds to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: "ping" }));
        } catch (error) {
          // Silent error - connection might be broken
        }
      }
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopPingInterval();

    if (this.ws) {
      // Close with normal closure code
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

  sendMessage(message: string, images: File[] = []): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const payload = {
        type: "send_message",
        message,
        images: images.length > 0 ? images.map(f => f.name) : []
      };
      this.ws.send(JSON.stringify(payload));
    }
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
const tradeWSInstances = new Map<string, TradeMessagesWebSocket>();
const tradeWSSubscriberCounts = new Map<string, number>();

export const getTradeMessagesWebSocket = (tradeId: string): TradeMessagesWebSocket => {
  if (!tradeWSInstances.has(tradeId)) {
    tradeWSInstances.set(tradeId, new TradeMessagesWebSocket());
  }
  return tradeWSInstances.get(tradeId)!;
};

/** Increment shared-socket ref count (Chats tab + in-trade ChatBox may share one trade). */
export const retainTradeMessagesWebSocket = (tradeId: string): void => {
  if (!tradeId?.trim()) return;
  tradeWSSubscriberCounts.set(
    tradeId,
    (tradeWSSubscriberCounts.get(tradeId) ?? 0) + 1
  );
};

/** Decrement ref count; disconnect only when no subscribers remain. */
export const releaseTradeMessagesWebSocket = (tradeId: string): void => {
  if (!tradeId?.trim()) return;
  const next = (tradeWSSubscriberCounts.get(tradeId) ?? 1) - 1;
  if (next <= 0) {
    tradeWSSubscriberCounts.delete(tradeId);
    cleanupTradeMessagesWebSocket(tradeId);
  } else {
    tradeWSSubscriberCounts.set(tradeId, next);
  }
};

export const cleanupTradeMessagesWebSocket = (tradeId: string): void => {
  const instance = tradeWSInstances.get(tradeId);
  if (instance) {
    instance.disconnect();
    tradeWSInstances.delete(tradeId);
  }
  tradeWSSubscriberCounts.delete(tradeId);
};

