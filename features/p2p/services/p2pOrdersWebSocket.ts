import { API_CONFIG } from "@/lib/appConfig";
import { P2POrder } from "../types";

export interface WebSocketMessage {
  type: "connection_established" | "orders_update" | "initial_data" | "error";
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

export class P2POrdersWebSocket {
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
      console.warn("⚠️ Invalid token provided to P2P Orders WebSocket");
      return;
    }

    // Check if token looks like a JWT
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.warn("⚠️ Token does not appear to be a valid JWT");
      return;
    }

    this.url = API_CONFIG.P2P.SOCKETS.P2P_ORDERS(token);

    if (process.env.NODE_ENV === 'development') {
      console.log("🔌 Connecting to P2P Orders WebSocket...");
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        if (process.env.NODE_ENV === 'development') {
          console.log("✅ P2P Orders WebSocket connected");
        }
        this.reconnectAttempts = 0;
        this.openHandlers.forEach((handler) => handler());
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          if (process.env.NODE_ENV === 'development') {
            console.log("📨 P2P Orders WebSocket message:", message.type);
          }
          
          this.messageHandlers.forEach((handler) => handler(message));
        } catch (error) {
          console.error("❌ Error parsing P2P Orders WebSocket message:", error);
        }
      };

      this.ws.onerror = (error) => {
        if (this.ws?.readyState !== WebSocket.CONNECTING) {
          console.error("❌ P2P Orders WebSocket error:", error);
          
          if (this.ws?.readyState === WebSocket.CLOSED) {
            console.error("WebSocket is closed");
          }
        }
        
        this.errorHandlers.forEach((handler) => handler(error));
      };

      this.ws.onclose = (event) => {
        if (event.code !== 1000 && event.code !== 1001) {
          console.warn(`⚠️ P2P Orders WebSocket closed with code ${event.code}`);
          
          if (event.reason) {
            console.warn("Close reason:", event.reason);
          }
          
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
            console.warn(`Description: ${closeCodeDescriptions[event.code]}`);
          }
        }
        
        this.closeHandlers.forEach((handler) => handler());

        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(token);
        }
      };
    } catch (error) {
      console.error("❌ Error creating P2P Orders WebSocket:", error);
      this.scheduleReconnect(token);
    }
  }

  private scheduleReconnect(token: string): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5);

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 Reconnecting P2P Orders WebSocket in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    }

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
      this.ws.close();
      this.ws = null;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log("🔌 P2P Orders WebSocket disconnected");
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



