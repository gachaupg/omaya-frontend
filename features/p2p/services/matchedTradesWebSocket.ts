import { API_CONFIG } from "@/lib/appConfig";

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
  commission_rate?: number;
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

export interface WebSocketMessage {
  type: "connection_established" | "initial_data" | "trades_update" | "trade_update";
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

export class MatchedTradesWebSocket {
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

  connect(token: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isIntentionallyClosed = false;
    
    // Validate token before attempting connection
    if (!token || token.length < 10) {
      return;
    }

    // Check if token looks like a JWT
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return;
    }

    this.url = API_CONFIG.P2P.SOCKETS.MATCHED_TRADES(token);

    // Reduced logging in production
    if (process.env.NODE_ENV === 'development') {
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        if (process.env.NODE_ENV === 'development') {
        }
        this.reconnectAttempts = 0;
        this.openHandlers.forEach((handler) => handler());
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          // Only log non-routine messages
          if (message.type !== 'trades_update' || process.env.NODE_ENV === 'development') {
          }
          this.messageHandlers.forEach((handler) => handler(message));
        } catch (error) {
        }
      };

      this.ws.onerror = (error) => {
        // Only log errors for non-transient connection issues
        // Skip logging for React StrictMode's double-mount behavior
        if (this.ws?.readyState !== WebSocket.CONNECTING) {
         
          
          
          // Additional debugging for actual connection failures
          if (this.ws?.readyState === WebSocket.CLOSED) {
          
          }
        }
        
        this.errorHandlers.forEach((handler) => handler(error));
      };

      this.ws.onclose = (event) => {
        // Only log non-normal closures (avoid React StrictMode noise)
        if (event.code !== 1000 && event.code !== 1001) {
          
          
          if (event.reason) {
          }
          
          // Provide helpful close code descriptions for errors
          const closeCodeDescriptions: Record<number, string> = {
            1002: "Protocol error",
            1003: "Unsupported data",
            1006: "Abnormal closure (no close frame received)",
            1007: "Invalid frame payload data",
            1008: "Policy violation",
            1009: "Message too big",
            1010: "Missing extension",
            1011: "Internal server error",
            1015: "TLS handshake failure"
          };
          
          if (closeCodeDescriptions[event.code]) {
           
          }
        }
        
        this.closeHandlers.forEach((handler) => handler());

        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(token);
        }
      };
    } catch (error) {
      this.scheduleReconnect(token);
    }
  }

  private getReadyStateText(): string {
    if (!this.ws) return "NO_SOCKET";
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return "CONNECTING (0)";
      case WebSocket.OPEN: return "OPEN (1)";
      case WebSocket.CLOSING: return "CLOSING (2)";
      case WebSocket.CLOSED: return "CLOSED (3)";
      default: return `UNKNOWN (${this.ws.readyState})`;
    }
  }

  private scheduleReconnect(token: string): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5);


    this.reconnectTimeout = setTimeout(() => {
      this.connect(token);
    }, delay);
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      const currentState = this.ws.readyState;
      
      // Only close if OPEN (avoid closing while CONNECTING)
      if (currentState === WebSocket.OPEN) {
        this.ws.close(1000, "Client disconnect");
      } else if (currentState === WebSocket.CONNECTING) {
        // For CONNECTING state, wait for open then close
        const wsToClose = this.ws;
        wsToClose.onopen = () => {
          if (wsToClose.readyState === WebSocket.OPEN) {
            wsToClose.close(1000, "Client disconnect");
          }
        };
      }
      this.ws = null;
    }

    // Suppress disconnect logs (normal React cleanup)
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
}

// Singleton instance
let matchedTradesWSInstance: MatchedTradesWebSocket | null = null;

export const getMatchedTradesWebSocket = (): MatchedTradesWebSocket => {
  if (!matchedTradesWSInstance) {
    matchedTradesWSInstance = new MatchedTradesWebSocket();
  }
  return matchedTradesWSInstance;
};

