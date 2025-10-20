import { API_CONFIG } from "@/lib/appConfig";

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
      return;
    }

    // If already connecting or connected to same trade, skip
    if (this.ws?.readyState === WebSocket.CONNECTING || 
        (this.ws?.readyState === WebSocket.OPEN && this.lastTradeId === tradeId)) {
      return;
    }

    // If connected to different trade, close existing connection
    if (this.ws?.readyState === WebSocket.OPEN && this.lastTradeId !== tradeId) {
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
      this.url = API_CONFIG.P2P.SOCKETS.TRADE_STATUS(tradeId, token);
      
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.hasPermanentFailure = false;
        this.openHandlers.forEach((handler) => handler());
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.messageHandlers.forEach((handler) => handler(message));
        } catch (error) {
          // Silent error handling
        }
      };

      this.ws.onerror = (error) => {
        this.errorHandlers.forEach((handler) => handler(error));
      };

      this.ws.onclose = (event) => {
        // Handle different close codes silently
        switch (event.code) {
          case 1000: // Normal closure
            break;
          case 1008: // Policy violation
            this.hasPermanentFailure = true;
            break;
          case 4001: // Unauthorized
          case 4003: // Forbidden
            this.hasPermanentFailure = true;
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

export const getTradeStatusWebSocket = (tradeId: string): TradeStatusWebSocket => {
  if (!tradeStatusWSInstances.has(tradeId)) {
    tradeStatusWSInstances.set(tradeId, new TradeStatusWebSocket());
  }
  return tradeStatusWSInstances.get(tradeId)!;
};

export const cleanupTradeStatusWebSocket = (tradeId: string): void => {
  const instance = tradeStatusWSInstances.get(tradeId);
  if (instance) {
    instance.disconnect();
    tradeStatusWSInstances.delete(tradeId);
  }
};

