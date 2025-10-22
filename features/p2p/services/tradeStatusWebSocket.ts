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

  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      
      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp;
      
      if (!exp) return false; // If no exp claim, assume it's valid
      
      const now = Math.floor(Date.now() / 1000);
      const isExpired = now >= exp;
      
      if (isExpired) {
        const expiredAgo = now - exp;
        console.warn(`⚠️ Token expired ${expiredAgo} seconds ago`);
      } else {
        const expiresIn = exp - now;
        console.log(`✅ Token valid for ${expiresIn} seconds (${Math.floor(expiresIn / 60)} minutes)`);
      }
      
      return isExpired;
    } catch (error) {
      console.error('❌ Error checking token expiration:', error);
      return true; // Assume expired if we can't parse it
    }
  }

  connect(tradeId: string, token: string): void {
    // Check for permanent failure
    if (this.hasPermanentFailure) {
      console.warn('⚠️ Skipping connection - permanent failure state');
      return;
    }

    // If already connecting or connected to same trade, skip
    if (this.ws?.readyState === WebSocket.CONNECTING || 
        (this.ws?.readyState === WebSocket.OPEN && this.lastTradeId === tradeId)) {
      console.log('ℹ️ Already connected or connecting to this trade');
      return;
    }

    // If connected to different trade, close existing connection
    if (this.ws?.readyState === WebSocket.OPEN && this.lastTradeId !== tradeId) {
      console.log('🔄 Switching to different trade, closing existing connection');
      this.disconnect();
    }

    this.isIntentionallyClosed = false;
    this.lastTradeId = tradeId;
    this.lastToken = token;
    
    // Validate inputs
    if (!tradeId || !token || token.length < 10) {
      console.error('❌ Invalid tradeId or token');
      this.hasPermanentFailure = true;
      return;
    }

    // Check if token looks like a JWT
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('❌ Token is not a valid JWT format');
      this.hasPermanentFailure = true;
      return;
    }

    // Check if token is expired
    if (this.isTokenExpired(token)) {
      console.error('❌ Token is expired - cannot establish WebSocket connection');
      console.log('💡 Tip: Refresh the page or re-login to get a new token');
      this.hasPermanentFailure = true;
      return;
    }

    try {
      this.url = API_CONFIG.P2P.SOCKETS.TRADE_STATUS(tradeId, token);
      
      console.log('🔗 Attempting WebSocket connection to:', this.url.split('?')[0]); // Log without full token
      
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('✅ WebSocket OPEN - Connection established successfully');
        this.reconnectAttempts = 0;
        this.hasPermanentFailure = false;
        this.openHandlers.forEach((handler) => handler());
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.messageHandlers.forEach((handler) => handler(message));
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error: Event) => {
        console.error('❌ WebSocket ERROR:', {
          type: error.type,
          target: error.target instanceof WebSocket ? {
            readyState: error.target.readyState,
            url: error.target.url?.split('?')[0] // Hide token in logs
          } : 'unknown'
        });
        
        // Check if this might be a token issue
        if (this.ws?.readyState === WebSocket.CLOSED) {
          console.warn('⚠️ Connection closed immediately - possible token/auth issue');
        }
        
        this.errorHandlers.forEach((handler) => handler(error));
      };

      this.ws.onclose = (event: CloseEvent) => {
        console.log('🔌 WebSocket CLOSE:', {
          code: event.code,
          reason: event.reason || 'No reason provided',
          wasClean: event.wasClean,
          reconnectAttempts: this.reconnectAttempts
        });
        
        // Handle different close codes
        switch (event.code) {
          case 1000: // Normal closure
            console.log('✅ Normal closure');
            break;
          case 1001: // Going away
            console.log('ℹ️ Going away');
            break;
          case 1006: // Abnormal closure (no close frame)
            console.warn('⚠️ Abnormal closure - connection failed or was interrupted');
            break;
          case 1008: // Policy violation
            console.error('❌ Policy violation - permanent failure');
            this.hasPermanentFailure = true;
            break;
          case 4001: // Custom: Unauthorized
            console.error('❌ Unauthorized (4001) - check token validity');
            this.hasPermanentFailure = true;
            break;
          case 4003: // Custom: Forbidden
            console.error('❌ Forbidden (4003) - access denied');
            this.hasPermanentFailure = true;
            break;
          case 4004: // Custom: Not found
            console.error('❌ Trade not found (4004)');
            this.hasPermanentFailure = true;
            break;
          default:
            console.warn(`⚠️ Close code ${event.code}: ${event.reason || 'Unknown reason'}`);
            break;
        }
        
        this.closeHandlers.forEach((handler) => handler());

        // Only reconnect if not intentionally closed, not permanently failed, and under max attempts
        if (!this.isIntentionallyClosed && 
            !this.hasPermanentFailure && 
            this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);
          this.scheduleReconnect(tradeId, token);
        } else if (this.hasPermanentFailure) {
          console.error('❌ Permanent failure - not reconnecting');
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('❌ Max reconnect attempts reached');
        }
      };
    } catch (error) {
      console.error('❌ Error creating WebSocket:', error);
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
      const currentState = this.ws.readyState;
      
      // Only close if OPEN or CONNECTING (but not yet CLOSING or CLOSED)
      if (currentState === WebSocket.OPEN) {
        this.ws.close(1000, "Client disconnect");
      } else if (currentState === WebSocket.CONNECTING) {
        // For CONNECTING state, we need to wait for it to open before closing
        // or just set to null and let it close naturally
        const wsToClose = this.ws;
        wsToClose.onopen = () => {
          if (wsToClose.readyState === WebSocket.OPEN) {
            wsToClose.close(1000, "Client disconnect");
          }
        };
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

