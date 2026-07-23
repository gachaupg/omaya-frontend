import { API_CONFIG } from "@/lib/appConfig";

export interface ForexStatusUpdate {
  type: "initial_status" | "status_update" | "connection_established" | "error" | "pong";
  transaction_id?: string;
  status?: string;
  stages?: string;
  data?: any;
  message?: string;
  timestamp?: string;
}

type MessageHandler = (message: ForexStatusUpdate) => void;
type ErrorHandler = (error: Event) => void;
type CloseHandler = () => void;
type OpenHandler = () => void;

export class ForexStatusWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageHandlers: Set<MessageHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private closeHandlers: Set<CloseHandler> = new Set();
  private openHandlers: Set<OpenHandler> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  private url: string = "";
  private lastTransactionId: string = "";
  private lastToken: string = "";
  private debugMode: boolean = true; // Enable debug logging

  private debug(message: string, data?: any): void {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      if (data) {
              } else {
              }
    }
  }

  connect(transactionId: string, token: string): void {
    this.debug("🔌 Attempting to connect", { transactionId, tokenLength: token?.length });

    // If already connecting or connected to same transaction, skip
    if (this.ws?.readyState === WebSocket.CONNECTING) {
      this.debug("⏳ Already connecting, skipping");
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN && this.lastTransactionId === transactionId) {
      this.debug("✅ Already connected to this transaction");
      return;
    }

    // If connected to different transaction, close existing connection
    if (this.ws?.readyState === WebSocket.OPEN && this.lastTransactionId !== transactionId) {
      this.debug("🔄 Switching to new transaction, closing old connection");
      this.disconnect();
    }

    this.isIntentionallyClosed = false;
    this.lastTransactionId = transactionId;
    this.lastToken = token;

    // Validate inputs
    if (!transactionId || !token) {
      this.debug("❌ Invalid inputs", { transactionId, hasToken: !!token });
      return;
    }

    try {
      this.url = API_CONFIG.FOREX.SOCKETS.FOREX_STATUS(transactionId, token);
      this.debug("🌐 WebSocket URL constructed", { url: this.url.replace(token, "TOKEN_HIDDEN") });

      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.debug("✅ WebSocket connected successfully");
        this.openHandlers.forEach((handler) => handler());

        // Start ping interval to keep connection alive (every 30 seconds)
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        this.debug("📨 Message received", { 
          data: event.data,
          type: typeof event.data 
        });

        try {
          const message: ForexStatusUpdate = JSON.parse(event.data);
          this.debug("📦 Parsed message", { type: message.type, data: message.data });
          this.messageHandlers.forEach((handler) => handler(message));
        } catch (error) {
          this.debug("❌ Failed to parse message", { error, rawData: event.data });
        }
      };

      this.ws.onerror = (error) => {
        this.debug("❌ WebSocket error occurred", { 
          error,
          readyState: this.ws?.readyState,
          url: this.url.replace(token, "TOKEN_HIDDEN")
        });
        this.errorHandlers.forEach((handler) => handler(error));
      };

      this.ws.onclose = (event) => {
        this.debug("🔌 WebSocket closed", { 
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          intentional: this.isIntentionallyClosed
        });

        this.stopPingInterval();
        this.closeHandlers.forEach((handler) => handler());

        // Attempt to reconnect if not intentionally closed
        if (!this.isIntentionallyClosed) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      this.debug("❌ Failed to create WebSocket", { error });
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.debug(`❌ Max reconnect attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    this.debug(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.lastTransactionId, this.lastToken);
    }, delay);
  }

  private startPingInterval(): void {
    this.stopPingInterval();

    this.debug("🏓 Starting ping interval (30s)");
    
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: "ping" }));
          this.debug("🏓 Ping sent");
        } catch (error) {
          this.debug("❌ Failed to send ping", { error });
        }
      }
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      this.debug("🏓 Stopping ping interval");
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  disconnect(): void {
    this.debug("🔌 Disconnecting WebSocket");
    
    this.isIntentionallyClosed = true;
    this.stopPingInterval();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.reconnectAttempts = 0;
    this.debug("✅ Disconnected successfully");
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    this.debug("📝 Message handler registered", { totalHandlers: this.messageHandlers.size });
    
    return () => {
      this.messageHandlers.delete(handler);
      this.debug("📝 Message handler unregistered", { totalHandlers: this.messageHandlers.size });
    };
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

  getConnectionState(): number | null {
    return this.ws?.readyState ?? null;
  }

  getConnectionStateString(): string {
    if (!this.ws) return "Not initialized";
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "Connecting";
      case WebSocket.OPEN:
        return "Open";
      case WebSocket.CLOSING:
        return "Closing";
      case WebSocket.CLOSED:
        return "Closed";
      default:
        return "Unknown";
    }
  }

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    this.debug(`Debug mode ${enabled ? "enabled" : "disabled"}`);
  }
}

// Singleton instance
export const forexStatusWebSocket = new ForexStatusWebSocket();

