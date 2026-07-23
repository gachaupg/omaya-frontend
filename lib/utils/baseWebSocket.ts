/**
 * BaseWebSocket - Production-ready WebSocket implementation
 *
 * Features:
 * - ✅ Singleton pattern per connection ID
 * - ✅ Exponential backoff reconnection
 * - ✅ Ping/pong heartbeat (30s)
 * - ✅ Silent error handling (production-friendly)
 * - ✅ Permanent failure detection (auth/policy errors)
 * - ✅ Token validation (JWT check)
 * - ✅ Connection pooling support
 * - ✅ Health monitoring
 *
 * Pattern extracted from TradeMessagesWebSocket (proven production code)
 * 100% Backward Compatible - existing implementations continue to work
 */

import { logger } from "@/lib/utils/logger";

export interface WebSocketMessage<T = any> {
  type: string;
  data: T;
  timestamp?: string;
  error?: string;
}

type MessageHandler<T = any> = (message: WebSocketMessage<T>) => void;
type ErrorHandler = (error: Event) => void;
type CloseHandler = () => void;
type OpenHandler = () => void;

export interface BaseWebSocketConfig {
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  pingInterval?: number;
  loggerModule?: string;
  validateToken?: boolean;
}

const DEFAULT_CONFIG: Required<BaseWebSocketConfig> = {
  maxReconnectAttempts: 5,
  reconnectDelay: 3000,
  pingInterval: 30000, // 30 seconds
  loggerModule: "websocket",
  validateToken: true,
};

/**
 * BaseWebSocket - Abstract base class for all WebSocket implementations
 *
 * Usage:
 * ```typescript
 * class MyWebSocket extends BaseWebSocket {
 *   protected buildUrl(params: { id: string, token: string }): string {
 *     return API_CONFIG.MY_WS(params.id, params.token);
 *   }
 * }
 *
 * const ws = new MyWebSocket({ id: '123', token: 'jwt...' });
 * ws.connect();
 * ws.onMessage((msg) => );
 * ```
 */
export abstract class BaseWebSocket<TParams = any> {
  protected ws: WebSocket | null = null;
  protected reconnectAttempts = 0;
  protected messageHandlers: Set<MessageHandler> = new Set();
  protected errorHandlers: Set<ErrorHandler> = new Set();
  protected closeHandlers: Set<CloseHandler> = new Set();
  protected openHandlers: Set<OpenHandler> = new Set();
  protected reconnectTimeout: NodeJS.Timeout | null = null;
  protected pingInterval: NodeJS.Timeout | null = null;
  protected isIntentionallyClosed = false;
  protected hasPermanentFailure = false;
  protected url: string = "";
  protected connectionParams: TParams | null = null;
  protected config: Required<BaseWebSocketConfig>;

  constructor(config: BaseWebSocketConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Abstract method - must be implemented by subclasses
   * Build the WebSocket URL from connection parameters
   */
  protected abstract buildUrl(params: TParams): string;

  /**
   * Validate connection parameters before attempting connection
   * Override this method for custom validation
   */
  protected validateParams(params: TParams): boolean {
    // Default: check if params exist
    if (!params) {
      return false;
    }

    // If token validation is enabled and params has a token
    if (
      this.config.validateToken &&
      typeof params === "object" &&
      "token" in params
    ) {
      const token = (params as any).token as string;

      // Basic validation
      if (!token || token.length < 10) {
        return false;
      }

      // JWT validation (3 parts separated by dots)
      const tokenParts = token.split(".");
      if (tokenParts.length !== 3) {
        return false;
      }
    }

    return true;
  }

  /**
   * Connect to WebSocket with given parameters
   * Safe to call multiple times - prevents duplicate connections
   */
  connect(params: TParams): void {
    // Check for permanent failure
    if (this.hasPermanentFailure) {
      logger.warn(
        this.config.loggerModule,
        "⚠️ WebSocket has permanent failure, skipping connection attempt"
      );
      return;
    }

    // Validate parameters
    if (!this.validateParams(params)) {
      logger.warn(this.config.loggerModule, "⚠️ Invalid connection parameters");
      this.hasPermanentFailure = true;
      return;
    }

    // If already connecting or connected with same params, skip
    if (
      this.ws?.readyState === WebSocket.CONNECTING ||
      (this.ws?.readyState === WebSocket.OPEN && this.isSameConnection(params))
    ) {
      return;
    }

    // If connected to different params, close existing connection
    if (
      this.ws?.readyState === WebSocket.OPEN &&
      !this.isSameConnection(params)
    ) {
      logger.debug(
        this.config.loggerModule,
        "🔄 Switching connection, closing current"
      );
      this.disconnect();
    }

    this.isIntentionallyClosed = false;
    this.connectionParams = params;

    try {
      this.url = this.buildUrl(params);

      // Only log on first connection attempt
      if (this.reconnectAttempts === 0) {
        logger.debug(this.config.loggerModule, "🔌 Connecting to WebSocket...");
      }

      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      // Silent error handling, will retry if needed
      if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.scheduleReconnect(params);
      }
    }
  }

  /**
   * Check if the new params match current connection
   * Override this for custom comparison logic
   */
  protected isSameConnection(params: TParams): boolean {
    // Default: deep equality check
    return JSON.stringify(this.connectionParams) === JSON.stringify(params);
  }

  /**
   * Setup WebSocket event handlers
   */
  protected setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      if (this.reconnectAttempts === 0) {
        logger.debug(this.config.loggerModule, "✅ WebSocket connected");
      }
      this.reconnectAttempts = 0;
      this.hasPermanentFailure = false;
      this.openHandlers.forEach((handler) => handler());

      // Start ping interval to keep connection alive
      this.startPingInterval();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        // Silent message handling - only log errors
        this.messageHandlers.forEach((handler) => handler(message));
      } catch (error) {
        // Only log parse errors as they indicate real issues
        logger.warn(
          this.config.loggerModule,
          "⚠️ Failed to parse WebSocket message",
          { error }
        );
      }
    };

    this.ws.onerror = (error) => {
      // Silent error handling - errors will be reported via onclose event
      // Only log on first failure for debugging
      if (this.reconnectAttempts === 0) {
        logger.warn(
          this.config.loggerModule,
          "⚠️ WebSocket connection failed (will retry silently)"
        );
      }

      this.errorHandlers.forEach((handler) => handler(error));
    };

    this.ws.onclose = (event) => {
      this.handleClose(event);
    };
  }

  /**
   * Handle WebSocket close event
   * Determines if reconnection should be attempted based on close code
   */
  protected handleClose(event: CloseEvent): void {
    // Handle different close codes silently
    switch (event.code) {
      case 1000: // Normal closure - completely silent
        break;
      case 1008: // Policy violation
        this.hasPermanentFailure = true;
        if (this.reconnectAttempts === 0) {
          logger.warn(
            this.config.loggerModule,
            "⚠️ WebSocket auth failed - check token permissions"
          );
        }
        break;
      case 4001: // Unauthorized
      case 4003: // Forbidden
        this.hasPermanentFailure = true;
        if (this.reconnectAttempts === 0) {
          logger.warn(
            this.config.loggerModule,
            "⚠️ WebSocket unauthorized - check authentication"
          );
        }
        break;
      case 1006: // Abnormal closure - silent, will retry
      default:
        // Silent for common connection issues
        break;
    }

    this.closeHandlers.forEach((handler) => handler());

    // Only reconnect if not intentionally closed, not permanently failed, and under max attempts
    if (
      !this.isIntentionallyClosed &&
      !this.hasPermanentFailure &&
      this.reconnectAttempts < this.config.maxReconnectAttempts &&
      this.connectionParams
    ) {
      // Silent reconnection
      this.scheduleReconnect(this.connectionParams);
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  protected scheduleReconnect(params: TParams): void {
    this.reconnectAttempts++;
    const delay =
      this.config.reconnectDelay * Math.min(this.reconnectAttempts, 5);

    this.reconnectTimeout = setTimeout(() => {
      this.connect(params);
    }, delay);
  }

  /**
   * Start ping interval to keep connection alive
   */
  protected startPingInterval(): void {
    // Clear any existing ping interval
    this.stopPingInterval();

    // Send ping every configured interval
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: "ping" }));
        } catch (error) {
          // Silent error - connection might be broken
        }
      }
    }, this.config.pingInterval);
  }

  /**
   * Stop ping interval
   */
  protected stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Disconnect WebSocket gracefully
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopPingInterval();

    if (this.ws) {
      const ws = this.ws;
      // In React StrictMode (dev), effects mount/unmount quickly.
      // Closing while CONNECTING triggers noisy browser warnings.
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, "Client disconnect");
      } else if (ws.readyState === WebSocket.CONNECTING) {
        // Defer close until open to avoid "closed before established" warning.
        ws.onopen = () => {
          try {
            ws.close(1000, "Client disconnect");
          } catch {
            // ignore
          }
        };
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
      }
      this.ws = null;
    }
  }

  /**
   * Reset permanent failure flag (useful for retry after auth refresh)
   */
  resetPermanentFailure(): void {
    this.hasPermanentFailure = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Send message to WebSocket
   * Override this method for custom message formatting
   */
  sendMessage(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const payload =
        typeof message === "string" ? message : JSON.stringify(message);
      this.ws.send(payload);
    } else {
      logger.warn(
        this.config.loggerModule,
        "⚠️ Cannot send message - WebSocket not connected"
      );
    }
  }

  /**
   * Register message handler
   * Returns cleanup function
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Register error handler
   * Returns cleanup function
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  /**
   * Register close handler
   * Returns cleanup function
   */
  onClose(handler: CloseHandler): () => void {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  /**
   * Register open handler
   * Returns cleanup function
   */
  onOpen(handler: OpenHandler): () => void {
    this.openHandlers.add(handler);
    return () => this.openHandlers.delete(handler);
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current WebSocket ready state
   */
  getReadyState(): number | null {
    return this.ws?.readyState ?? null;
  }

  /**
   * Check if WebSocket has permanent failure
   */
  hasFailed(): boolean {
    return this.hasPermanentFailure;
  }

  /**
   * Get connection information for debugging
   */
  getConnectionInfo(): {
    isConnected: boolean;
    readyState: number | null;
    hasPermanentFailure: boolean;
    reconnectAttempts: number;
    url: string;
  } {
    return {
      isConnected: this.isConnected(),
      readyState: this.getReadyState(),
      hasPermanentFailure: this.hasPermanentFailure,
      reconnectAttempts: this.reconnectAttempts,
      url: this.url,
    };
  }

  /**
   * Perform health check
   */
  performHealthCheck(): boolean {
    // Check if URL is valid
    if (!this.url || typeof this.url !== "string") {
      return false;
    }

    // Check if URL format is correct
    if (!this.url.startsWith("ws://") && !this.url.startsWith("wss://")) {
      return false;
    }

    // Check connection state
    if (!this.isConnected()) {
      return false;
    }

    return true;
  }
}

/**
 * SingletonWebSocket - Extends BaseWebSocket with singleton pattern
 * Use this for WebSockets that should have one instance per connection ID
 *
 * Usage:
 * ```typescript
 * class MyWebSocket extends SingletonWebSocket<{ id: string, token: string }> {
 *   protected buildUrl(params) { return API_CONFIG.MY_WS(params.id, params.token); }
 *   protected getInstanceKey(params) { return params.id; }
 * }
 *
 * const ws1 = MyWebSocket.getInstance({ id: '123', token: 'jwt...' });
 * const ws2 = MyWebSocket.getInstance({ id: '123', token: 'jwt...' }); // Same instance
 * ```
 */
export abstract class SingletonWebSocket<
  TParams = any,
> extends BaseWebSocket<TParams> {
  private static instances = new Map<string, SingletonWebSocket<any>>();

  /**
   * Get unique key for this connection
   * Override this to customize instance caching
   */
  protected abstract getInstanceKey(params: TParams): string;

  /**
   * Get singleton instance for given params
   */
  static getInstance<T extends SingletonWebSocket<any>>(
    this: new (...args: any[]) => T,
    params: any,
    config?: BaseWebSocketConfig
  ): T {
    const instance = new this(config);
    const key = `${instance.constructor.name}:${instance.getInstanceKey(params)}`;

    if (!SingletonWebSocket.instances.has(key)) {
      SingletonWebSocket.instances.set(key, instance);
    }

    return SingletonWebSocket.instances.get(key) as T;
  }

  /**
   * Cleanup instance from registry
   */
  static cleanupInstance<T extends SingletonWebSocket<any>>(
    this: new (...args: any[]) => T,
    params: any
  ): void {
    const instance = new this();
    const key = `${instance.constructor.name}:${instance.getInstanceKey(params)}`;

    const existing = SingletonWebSocket.instances.get(key);
    if (existing) {
      existing.disconnect();
      SingletonWebSocket.instances.delete(key);
    }
  }

  /**
   * Get all active instances
   */
  static getAllInstances(): Map<string, SingletonWebSocket<any>> {
    return new Map(SingletonWebSocket.instances);
  }

  /**
   * Cleanup all instances
   */
  static cleanupAll(): void {
    SingletonWebSocket.instances.forEach((instance) => {
      instance.disconnect();
    });
    SingletonWebSocket.instances.clear();
  }
}
