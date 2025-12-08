import { logger } from "@/lib/utils/logger";
import { API_CONFIG } from "@/lib/appConfig";

type TransactionMessage = {
  type: string;
  data: any;
  timestamp?: string;
};

type MessageHandler = (message: TransactionMessage) => void;
type ErrorHandler = (error: Event) => void;
type CloseHandler = () => void;
type OpenHandler = () => void;

export class AllSystemTransactionsWebSocket {
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
  private hasPermanentFailure: boolean = false;

  constructor(
    private wsUrl: string = API_CONFIG.RATES.SOCKETS.ALL_SYSTEM_TRANSACTIONS()
  ) {
    this.url = wsUrl;
  }

  connect(): void {
    // Check for permanent failure
    if (this.hasPermanentFailure) {
      logger.warn('markets', "⚠️ WebSocket has permanent failure, skipping connection attempt");
      return;
    }

    // If already connecting or connected, skip
    if (this.ws?.readyState === WebSocket.CONNECTING || 
        this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isIntentionallyClosed = false;

    try {
      logger.debug('markets', `🔌 Connecting to WebSocket: ${this.url}`);
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        logger.debug('markets', "✅ WebSocket connected successfully");
        this.openHandlers.forEach((handler) => handler());

        // Start ping interval to keep connection alive (every 30 seconds)
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: TransactionMessage = JSON.parse(event.data);
          logger.debug('markets', "📨 Transaction message received", { type: message.type });
          this.messageHandlers.forEach((handler) => handler(message));
        } catch (error) {
          logger.warn('markets', "❌ Failed to parse message", { error, rawData: event.data });
        }
      };

      this.ws.onerror = (error) => {
        logger.warn('markets', "❌ WebSocket error occurred", { 
          error,
          readyState: this.ws?.readyState,
          url: this.url
        });
        this.errorHandlers.forEach((handler) => handler(error));
      };

      this.ws.onclose = (event) => {
        logger.debug('markets', "🔌 WebSocket closed", { 
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
      logger.warn('markets', "❌ Failed to create WebSocket", { error });
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      }
    }
  }

  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: "ping" }));
        } catch (error) {
          logger.warn('markets', "Failed to send ping", { error });
        }
      }
    }, 30000); // 30 seconds
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.warn('markets', "❌ Max reconnection attempts reached");
      this.hasPermanentFailure = true;
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000);
    
    logger.debug('markets', `🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect(): void {
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
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  onClose(handler: CloseHandler): () => void {
    this.closeHandlers.add(handler);
    return () => {
      this.closeHandlers.delete(handler);
    };
  }

  onOpen(handler: OpenHandler): () => void {
    this.openHandlers.add(handler);
    return () => {
      this.openHandlers.delete(handler);
    };
  }

  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

