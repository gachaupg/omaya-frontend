import React from "react";
import { API_CONFIG } from "@/lib/appConfig";
import { appendTokenToWebSocketUrl } from "@/lib/utils/websocketUtils";
import { logger } from '@/lib/utils/logger';

export interface TransactionStatusMessage {
  type: "status_update" | "error" | "connection_established" | "final_status";
  data: {
    status:
      | "pending"
      | "confirmed"
      | "failed"
      | "completed"
      | "awaiting_payment"
      | "awaiting_deposit"
      | "pending_blockchain"
      | "processing"
      | "exchanging"
      | "sending"
      | "transaction_created"
      | "processing_transfer"
      | "approval_required"
      | "finished"
      | "waiting"
      | "confirming"
      | "admin_approval_required"
      | "agent_approve"
      | "error";
    message: string;
    timestamp: string;
    transaction_id: string;
    currency?: string;
    amount?: string;
    error?: string;
    block_number?: number;
    confirmations?: number;
    // Additional fields for withdrawal status
    requested_amount?: string;
    total_amount_due?: string;
    gas_fee?: string;
    from_address?: string;
    to_address?: string;
    blockchain_hash?: string;
    event_id?: string;
    // Deposit-specific fields
    asset?: string;
    net_amount?: string;
    deposit_address?: string;
    deposit_code?: string;
    type?: string;
    network?: string;
    fees?: {
      commission?: string;
      network_fee?: string;
      total_fees?: string;
    };
    // New deposit status update format fields
    transaction_type?: "deposit" | "withdrawal";
    tx_hash?: string;
    transaction_hash?: string;
    created_at?: string;
    updated_at?: string;
    // Final status indicator
    is_final?: boolean;
    rejection_reason?: string | null;
    failure_reason?: string | null;
    notification?: {
      message?: string;
      reason?: string;
    };
  };
  // Legacy fields for backward compatibility
  tx_hash?: string;
  block_number?: number;
  confirmations?: number;
  status?: string;
  timestamp?: string;
  error?: string;
  // Final status indicator
  is_final?: boolean;
}

// Base WebSocket class for transaction status
export class BaseTransactionStatusWebSocket {
  protected ws: WebSocket | null = null;
  protected reconnectAttempts = 0;
  protected maxReconnectAttempts = 5;
  protected reconnectDelay = 1000;
  protected onMessageCallback?: (data: TransactionStatusMessage) => void;
  protected onErrorCallback?: (error: Event) => void;
  protected onCloseCallback?: () => void;

  constructor(
    protected transactionId: string,
    protected wsUrl: string,
    protected options: {
      onMessage?: (data: TransactionStatusMessage) => void;
      onError?: (error: Event) => void;
      onClose?: () => void;
      autoReconnect?: boolean;
      token?: string;
    } = {}
  ) {
    this.onMessageCallback = options.onMessage;
    this.onErrorCallback = options.onError;
    this.onCloseCallback = options.onClose;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Validate WebSocket URL
        if (!this.wsUrl || typeof this.wsUrl !== 'string') {
          const error = new Error(`Invalid WebSocket URL: ${this.wsUrl}`);
          logger.error('p2p', "WebSocket connection failed:", error.message);
          reject(error);
          return;
        }

        // Validate URL format
        if (!this.wsUrl.startsWith('ws://') && !this.wsUrl.startsWith('wss://')) {
          const error = new Error(`WebSocket URL must start with ws:// or wss://, got: ${this.wsUrl}`);
          logger.error('p2p', "WebSocket connection failed:", error.message);
          reject(error);
          return;
        }

        const finalUrl = appendTokenToWebSocketUrl(this.wsUrl, this.options.token);
        console.log("[Exchange] Connecting WebSocket URL:", finalUrl);
        logger.debug('p2p', "WebSocket connecting:", { transactionId: this.transactionId, url: finalUrl });
        
        this.ws = new WebSocket(finalUrl);

        // Add connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket connection timeout");
            this.ws.close();
          }
        }, 10000); // 10 second timeout

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          logger.debug('p2p', 
            `WebSocket connected for transaction: ${this.transactionId}`
          );
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data: TransactionStatusMessage = JSON.parse(event.data);
            console.log("[P2P Status] WebSocket data received:", data);

            // Handle database errors gracefully
            if (
              (data.type === "error" &&
                data.data?.message?.includes("database")) ||
              data.data?.message?.includes("column")
            ) {
              // Don't crash the frontend, just ignore database errors
              return;
            }

            this.onMessageCallback?.(data);
          } catch (error) {
            // Silent error handling
          }
        };

        this.ws.onerror = (error) => {
          const target = error.target as WebSocket | null;
          
          // Simple, focused error logging
          console.warn("WebSocket connection error occurred");
          
          if (target?.readyState !== undefined) {
            const states = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
            console.warn(`State: ${states[target.readyState] || target.readyState}`);
          }
          
          if (this.wsUrl) {
            console.warn(`URL: ${this.wsUrl}`);
          }
          
          console.warn(`Reconnect attempt: ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);
          
          // Only log additional details if this is a repeated failure
          if (this.reconnectAttempts > 2) {
            console.warn("Multiple connection failures - check network and server status");
            console.warn(`Online: ${navigator.onLine}`);
          }

          // Don't reject immediately on error - let the onclose handler deal with reconnection
          // Only call error callback for logging purposes
          this.onErrorCallback?.(error);

          // Don't reject the promise here - let onclose handle the reconnection logic
          // This prevents the initial connection attempt from failing immediately
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          logger.debug('p2p', "WebSocket closed:", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            reconnectAttempts: this.reconnectAttempts,
          });

          this.onCloseCallback?.();

          // Auto-reconnect logic
          if (
            this.options.autoReconnect &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            this.reconnectAttempts++;
            logger.debug('p2p', 
              `Attempting to reconnect (${this.reconnectAttempts}/${
                this.maxReconnectAttempts
              }) in ${this.reconnectDelay * this.reconnectAttempts}ms...`
            );

            setTimeout(() => {
              this.connect().catch((error) => {
                console.error(
                  `Reconnection attempt ${this.reconnectAttempts} failed:`,
                  error
                );
              });
            }, this.reconnectDelay * this.reconnectAttempts);
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.warn(
              "Max reconnection attempts reached. WebSocket will not reconnect automatically."
            );
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected");
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionDiagnostics(): object {
    return {
      wsUrl: this.wsUrl,
      transactionId: this.transactionId,
      readyState: this.ws?.readyState,
      readyStateName: this.ws?.readyState !== undefined ? {
        0: 'CONNECTING',
        1: 'OPEN',
        2: 'CLOSING', 
        3: 'CLOSED'
      }[this.ws.readyState] : 'unknown',
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      autoReconnect: this.options.autoReconnect,
      timestamp: new Date().toISOString()
    };
  }

  // Method to perform connection health check
  performHealthCheck(): boolean {
    const diagnostics = this.getConnectionDiagnostics();
    logger.debug('p2p', "WebSocket Health Check:", diagnostics);
    
    // Check if URL is valid
    if (!this.wsUrl || typeof this.wsUrl !== 'string') {
      console.error("Health Check Failed: Invalid WebSocket URL");
      return false;
    }

    // Check if URL format is correct
    if (!this.wsUrl.startsWith('ws://') && !this.wsUrl.startsWith('wss://')) {
      console.error("Health Check Failed: Invalid WebSocket protocol");
      return false;
    }

    // Check transaction ID
    if (!this.transactionId) {
      console.error("Health Check Failed: Missing transaction ID");
      return false;
    }

    // Check connection state
    if (!this.isConnected()) {
      console.warn("Health Check: WebSocket not connected");
      return false;
    }

    logger.debug('p2p', "Health Check Passed: WebSocket connection is healthy");
    return true;
  }
}

// Withdrawal status WebSocket class
export class WithdrawalStatusWebSocket extends BaseTransactionStatusWebSocket {
  constructor(
    transactionId: string,
    wsUrl?: string,
    options: {
      onMessage?: (data: TransactionStatusMessage) => void;
      onError?: (error: Event) => void;
      onClose?: () => void;
      autoReconnect?: boolean;
    } = {}
  ) {
    // Use provided WebSocket URL or fall back to default
    // Only use provided URL if it's not empty or undefined
    const finalWsUrl = (wsUrl && wsUrl.trim() !== "") 
      ? wsUrl 
      : API_CONFIG.EXCHANGE.SOCKETS.TRANSACTION_STATUS(transactionId);
    
    logger.debug('p2p', "DEBUG: WithdrawalStatusWebSocket constructor - wsUrl:", wsUrl);
    logger.debug('p2p', "DEBUG: WithdrawalStatusWebSocket constructor - finalWsUrl:", finalWsUrl);
    logger.debug('p2p', "DEBUG: Using provided URL:", !!wsUrl);
    logger.debug('p2p', "DEBUG: URL is empty/undefined:", !wsUrl || wsUrl.trim() === "");
    super(transactionId, finalWsUrl, options);
  }
}

// Deposit status WebSocket class
export class DepositStatusWebSocket extends BaseTransactionStatusWebSocket {
  constructor(
    transactionId: string,
    wsUrl?: string,
    options: {
      onMessage?: (data: TransactionStatusMessage) => void;
      onError?: (error: Event) => void;
      onClose?: () => void;
      autoReconnect?: boolean;
    } = {}
  ) {
    // Use provided WebSocket URL or fall back to default
    // Only use provided URL if it's not empty or undefined
    const finalWsUrl = (wsUrl && wsUrl.trim() !== "") 
      ? wsUrl 
      : API_CONFIG.EXCHANGE.SOCKETS.DEPOSIT_STATUS(transactionId);
    
    logger.debug('p2p', "DEBUG: DepositStatusWebSocket constructor - wsUrl:", wsUrl);
    logger.debug('p2p', "DEBUG: DepositStatusWebSocket constructor - finalWsUrl:", finalWsUrl);
    logger.debug('p2p', "DEBUG: Using provided URL:", !!wsUrl);
    logger.debug('p2p', "DEBUG: URL is empty/undefined:", !wsUrl || wsUrl.trim() === "");
    super(transactionId, finalWsUrl, options);
  }
}

// Legacy class for backward compatibility
export class TransactionStatusWebSocket extends WithdrawalStatusWebSocket {
  // This class now extends WithdrawalStatusWebSocket for backward compatibility
}

// Hook for React components - supports both deposit and withdrawal
export const useTransactionStatusWebSocket = (
  transactionId: string,
  transactionType: "deposit" | "withdrawal" = "withdrawal",
  wsUrl?: string,
  options: {
    onMessage?: (data: TransactionStatusMessage) => void;
    onError?: (error: Event) => void;
    onClose?: () => void;
    autoReconnect?: boolean;
    token?: string;
  } = {}
) => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [lastMessage, setLastMessage] =
    React.useState<TransactionStatusMessage | null>(null);
  const wsRef = React.useRef<BaseTransactionStatusWebSocket | null>(null);

  React.useEffect(() => {
    // Allow connection without transaction ID if a WebSocket URL is provided (P2P deposits)
    if (!transactionId && !wsUrl) {
      return;
    }

    // Create appropriate WebSocket class based on transaction type
    const WebSocketClass =
      transactionType === "deposit"
        ? DepositStatusWebSocket
        : WithdrawalStatusWebSocket;

    const ws = new WebSocketClass(transactionId || "p2p-deposit", wsUrl, {
      ...options,
      onMessage: (data) => {
        setLastMessage(data);
        options.onMessage?.(data);
      },
      onError: (error) => {
        setIsConnected(false);
        options.onError?.(error);
      },
      onClose: () => {
        setIsConnected(false);
        options.onClose?.();
      },
    });

    wsRef.current = ws;

    ws.connect()
      .then(() => setIsConnected(true))
      .catch(console.error);

    return () => {
      ws.disconnect();
      wsRef.current = null;
    };
  }, [transactionId, transactionType, wsUrl]);

  const sendMessage = React.useCallback((message: any) => {
    wsRef.current?.send(message);
  }, []);

  const disconnect = React.useCallback(() => {
    wsRef.current?.disconnect();
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    disconnect,
  };
};

// Specific hooks for deposit and withdrawal
export const useDepositStatusWebSocket = (
  transactionId: string,
  wsUrl?: string,
  options: {
    onMessage?: (data: TransactionStatusMessage) => void;
    onError?: (error: Event) => void;
    onClose?: () => void;
    autoReconnect?: boolean;
  } = {}
) => {
  return useTransactionStatusWebSocket(transactionId, "deposit", wsUrl, options);
};

export const useWithdrawalStatusWebSocket = (
  transactionId: string,
  wsUrl?: string,
  options: {
    onMessage?: (data: TransactionStatusMessage) => void;
    onError?: (error: Event) => void;
    onClose?: () => void;
    autoReconnect?: boolean;
  } = {}
) => {
  return useTransactionStatusWebSocket(transactionId, "withdrawal", wsUrl, options);
};
