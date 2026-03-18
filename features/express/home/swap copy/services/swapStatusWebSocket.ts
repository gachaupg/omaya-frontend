import { API_CONFIG } from "@/lib/appConfig";
import {
  SingletonWebSocket,
  WebSocketMessage as BaseWebSocketMessage,
} from "@/lib/utils/baseWebSocket";

// Swap-specific WebSocket message interface
export interface WebSocketMessage extends BaseWebSocketMessage {
  type:
    | "connection_established"
    | "status_update"
    | "swap_complete"
    | "swap_failed"
    | "error";
  data: {
    swap_id: string;
    status: string;
    message?: string;
    details?: any;
    timestamp?: string;
  };
}

type MessageHandler = (message: WebSocketMessage) => void;
type ErrorHandler = (error: Event) => void;
type CloseHandler = () => void;
type OpenHandler = () => void;

/**
 * SwapStatusWebSocket - Production-ready WebSocket for swap status updates
 *
 * Now extends BaseWebSocket with:
 * - ✅ Ping/pong heartbeat (30s)
 * - ✅ Silent error handling
 * - ✅ Permanent failure detection
 * - ✅ Singleton pattern (one instance per swap ID)
 * - ✅ Connection pooling
 * - ✅ Automatic reconnection
 *
 * Replaces the broken 6-line implementation
 */
export class SwapStatusWebSocket extends SingletonWebSocket<{
  swapId: string;
  token?: string;
}> {
  private lastSwapId: string = "";
  // Type-safe handler sets for Swap-specific messages
  private swapMessageHandlers: Set<MessageHandler> = new Set();
  private swapErrorHandlers: Set<ErrorHandler> = new Set();
  private swapCloseHandlers: Set<CloseHandler> = new Set();
  private swapOpenHandlers: Set<OpenHandler> = new Set();

  constructor() {
    super({
      maxReconnectAttempts: 5,
      reconnectDelay: 3000,
      pingInterval: 30000,
      loggerModule: "swap",
      validateToken: false, // Swap doesn't use JWT tokens
    });

    // Bridge base handlers to Swap-specific handlers
    super.onMessage((baseMessage) => {
      const swapMessage = baseMessage as unknown as WebSocketMessage;
      this.swapMessageHandlers.forEach((handler) => handler(swapMessage));
    });

    super.onError((error) => {
      this.swapErrorHandlers.forEach((handler) => handler(error));
    });

    super.onClose(() => {
      this.swapCloseHandlers.forEach((handler) => handler());
    });

    super.onOpen(() => {
      this.swapOpenHandlers.forEach((handler) => handler());
    });
  }

  /**
   * Build WebSocket URL from swap ID and optional token
   */
  protected buildUrl(params: { swapId: string; token?: string }): string {
    const url = API_CONFIG.SWAP.SWAP_STATUS_WS(params.swapId, params.token);
    console.log("[Exchange/Swap] Connecting WebSocket URL:", url);
    return url;
  }

  /**
   * Get instance key for singleton pattern
   */
  protected getInstanceKey(params: { swapId: string; token?: string }): string {
    // One instance per swap ID
    return `swap-${params.swapId}`;
  }

  /**
   * Check if connection params match
   */
  protected isSameConnection(params: { swapId: string; token?: string }): boolean {
    return this.lastSwapId === params.swapId;
  }

  /**
   * Validate params - override to skip token validation
   */
  protected validateParams(params: { swapId: string; token?: string }): boolean {
    return !!params && !!params.swapId;
  }

  /**
   * Connect method - accepts params object (base class signature)
   */
  connect(params: { swapId: string; token?: string }): void;
  /**
   * Backward compatible connect method - accepts swapId string and optional token
   */
  connect(swapId: string, token?: string): void;
  /**
   * Implementation
   */
  connect(swapIdOrParams: string | { swapId: string; token?: string }, token?: string): void {
    const swapId =
      typeof swapIdOrParams === "string"
        ? swapIdOrParams
        : swapIdOrParams.swapId;
    const tokenParam = typeof swapIdOrParams === "object" && swapIdOrParams.token
      ? swapIdOrParams.token
      : token;
    this.lastSwapId = swapId;
    super.connect({ swapId, token: tokenParam });
  }

  // Override handler methods to use Swap-specific types
  onMessage(handler: MessageHandler): () => void {
    this.swapMessageHandlers.add(handler);
    return () => this.swapMessageHandlers.delete(handler);
  }

  onError(handler: ErrorHandler): () => void {
    this.swapErrorHandlers.add(handler);
    return () => this.swapErrorHandlers.delete(handler);
  }

  onClose(handler: CloseHandler): () => void {
    this.swapCloseHandlers.add(handler);
    return () => this.swapCloseHandlers.delete(handler);
  }

  onOpen(handler: OpenHandler): () => void {
    this.swapOpenHandlers.add(handler);
    return () => this.swapOpenHandlers.delete(handler);
  }
}

// Singleton instance getter - one instance per swap ID
export const getSwapStatusWebSocket = (swapId: string): SwapStatusWebSocket => {
  return SwapStatusWebSocket.getInstance({ swapId });
};

export const cleanupSwapStatusWebSocket = (swapId: string): void => {
  SwapStatusWebSocket.cleanupInstance({ swapId });
};

/**
 * Backward compatible function - returns a WebSocket-compatible wrapper
 * This allows legacy code to work without changes
 * @deprecated Use getSwapStatusWebSocket() for new code
 */
export function connectSwapStatusWebSocket(
  swapId: string,
  {
    onMessage,
    onOpen,
    onError,
    onClose,
    token,
  }: {
    onMessage?: (event: MessageEvent) => void;
    onOpen?: (event: Event) => void;
    onError?: (event: Event) => void;
    onClose?: (event: CloseEvent) => void;
    token?: string;
  } = {}
): any {
  const ws = getSwapStatusWebSocket(swapId);

  // Create a WebSocket-like wrapper for backward compatibility
  const wrapper: any = {
    // WebSocket properties
    readyState: WebSocket.CONNECTING,
    binaryType: "blob" as BinaryType,
    bufferedAmount: 0,
    extensions: "",
    protocol: "",
    url: "",

    // WebSocket methods
    send: (data: any) => ws.sendMessage(data),
    close: () => ws.disconnect(),

    // WebSocket event handlers (set by the component)
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null,

    // EventTarget methods
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,

    // Internal reference to actual WebSocket
    _actualWebSocket: ws,
  };

  // Update readyState based on actual connection
  Object.defineProperty(wrapper, "readyState", {
    get: () => {
      if (ws.isConnected()) return WebSocket.OPEN;
      return WebSocket.CONNECTING;
    },
  });

  // Convert old event-based handlers to new message-based handlers
  if (onMessage) {
    ws.onMessage((msg) => {
      // Create a MessageEvent-like object for backward compatibility
      const event = {
        data: JSON.stringify(msg),
        type: "message",
      } as MessageEvent;
      onMessage(event);
      if (wrapper.onmessage) {
        wrapper.onmessage(event);
      }
    });
  }

  if (onError) {
    ws.onError((error) => {
      onError(error);
      if (wrapper.onerror) {
        wrapper.onerror(error);
      }
    });
  }

  if (onClose) {
    ws.onClose(() => {
      const event = {
        code: 1000,
        reason: "Normal closure",
        wasClean: true,
        type: "close",
      } as CloseEvent;
      onClose(event);
      if (wrapper.onclose) {
        wrapper.onclose(event);
      }
    });
  }

  if (onOpen) {
    ws.onOpen(() => {
      const event = { type: "open" } as Event;
      onOpen(event);
      if (wrapper.onopen) {
        wrapper.onopen(event);
      }
    });
  }

  ws.connect(swapId, token);

  return wrapper as WebSocket;
}
