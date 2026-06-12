import React from "react";
import { API_CONFIG } from "@/lib/appConfig";
import { appendTokenToWebSocketUrl } from "@/lib/utils/websocketUtils";

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
      | "error"
      | "rejected"
      | "failed"
      | "stopped";
    message?: string;
    reason?: string | null;
    stages?: string | null;
    error_message?: string | null;
    comment_text?: string | null;
    timestamp: string;
    transaction_id: string;
    moneyx_transaction_id?: string;
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
    created_at?: string;
    updated_at?: string;
    // Final status indicator
    is_final?: boolean;
    /** Human-readable rejection explanation from backend (may be used instead of message) */
    rejection_reason?: string | null;
    failure_reason?: string | null;
    /** Rejected/canceled flows often send detail here */
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
          reject(error);
          return;
        }

        // Validate URL format
        if (!this.wsUrl.startsWith('ws://') && !this.wsUrl.startsWith('wss://')) {
          const error = new Error(`WebSocket URL must start with ws:// or wss://, got: ${this.wsUrl}`);
          reject(error);
          return;
        }

        const finalUrl = appendTokenToWebSocketUrl(this.wsUrl, this.options.token);
        console.log("[Exchange] Connecting WebSocket URL:", finalUrl);
        this.ws = new WebSocket(finalUrl);

        // Add connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            this.ws.close();
          }
        }, 10000); // 10 second timeout

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
        
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data: TransactionStatusMessage = JSON.parse(event.data);

            // Handle database errors gracefully
            if (
              (data.type === "error" &&
                data.data?.message?.includes("database")) ||
              data.data?.message?.includes("column")
            ) {
              
              // Don't crash the frontend, just log the error
              return;
            }

            this.onMessageCallback?.(data);
          } catch (error) {
          }
        };

        this.ws.onerror = (error) => {
          const target = error.target as WebSocket | null;
          
          // Simple, focused error logging
          
          if (target?.readyState !== undefined) {
            const states = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
            
          }
          
          if (this.wsUrl) {
          }
          
        
          
          // Only log additional details if this is a repeated failure
          if (this.reconnectAttempts > 2) {
            
          }

          // Don't reject immediately on error - let the onclose handler deal with reconnection
          // Only call error callback for logging purposes
          this.onErrorCallback?.(error);

          // Don't reject the promise here - let onclose handle the reconnection logic
          // This prevents the initial connection attempt from failing immediately
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          

          this.onCloseCallback?.();

          // Auto-reconnect logic
          if (
            this.options.autoReconnect &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            this.reconnectAttempts++;
          

            setTimeout(() => {
              this.connect().catch((error) => {
                
              });
            }, this.reconnectDelay * this.reconnectAttempts);
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
           
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
    
    // Check if URL is valid
    if (!this.wsUrl || typeof this.wsUrl !== 'string') {
      return false;
    }

    // Check if URL format is correct
    if (!this.wsUrl.startsWith('ws://') && !this.wsUrl.startsWith('wss://')) {
      return false;
    }

    // Check transaction ID
    if (!this.transactionId) {
      return false;
    }

    // Check connection state
    if (!this.isConnected()) {
      return false;
    }

   
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
    if (!transactionId) return;

  

    // Create appropriate WebSocket class based on transaction type
    const WebSocketClass =
      transactionType === "deposit"
        ? DepositStatusWebSocket
        : WithdrawalStatusWebSocket;

    const ws = new WebSocketClass(transactionId, wsUrl, {
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
