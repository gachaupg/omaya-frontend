import React from "react";
import { API_CONFIG } from "@/lib/appConfig";

export interface TransactionStatusMessage {
  type: "status_update" | "error";
  data: {
    status:
      | "pending"
      | "confirmed"
      | "failed"
      | "completed"
      | "awaiting_payment"
      | "processing"
      | "exchanging"
      | "sending";
    message: string;
    timestamp: string;
    transaction_id: string;
    currency?: string;
    error?: string;
    block_number?: number;
    confirmations?: number;
  };
  // Legacy fields for backward compatibility
  tx_hash?: string;
  block_number?: number;
  confirmations?: number;
  status?: string;
  timestamp?: string;
  error?: string;
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
    } = {}
  ) {
    this.onMessageCallback = options.onMessage;
    this.onErrorCallback = options.onError;
    this.onCloseCallback = options.onClose;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
                 console.log(
           "DEBUG: WebSocket connecting with transactionId:",
           this.transactionId
         );
         console.log("DEBUG: WebSocket URL:", this.wsUrl);
         console.log("DEBUG: WebSocket URL type:", this.wsUrl.includes("changenow.io") ? "ChangeNow" : "Backend");
         console.log("DEBUG: WebSocket protocol:", this.wsUrl.startsWith('ws://') ? 'ws://' : this.wsUrl.startsWith('wss://') ? 'wss://' : 'unknown');
         this.ws = new WebSocket(this.wsUrl);

        // Add connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket connection timeout");
            this.ws.close();
          }
        }, 10000); // 10 second timeout

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log(
            `WebSocket connected for transaction: ${this.transactionId}`
          );
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data: TransactionStatusMessage = JSON.parse(event.data);
            console.log("Transaction status update:", data);

            // Handle database errors gracefully
            if (
              (data.type === "error" &&
                data.data?.message?.includes("database")) ||
              data.data?.message?.includes("column")
            ) {
              console.warn(
                "Database error received from WebSocket:",
                data.data?.message
              );
              // Don't crash the frontend, just log the error
              return;
            }

            this.onMessageCallback?.(data);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);

          // Don't reject immediately on error - let the onclose handler deal with reconnection
          // Only call error callback for logging purposes
          this.onErrorCallback?.(error);

          // Don't reject the promise here - let onclose handle the reconnection logic
          // This prevents the initial connection attempt from failing immediately
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log("WebSocket closed:", {
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
            console.log(
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
    
    console.log("DEBUG: WithdrawalStatusWebSocket constructor - wsUrl:", wsUrl);
    console.log("DEBUG: WithdrawalStatusWebSocket constructor - finalWsUrl:", finalWsUrl);
    console.log("DEBUG: Using provided URL:", !!wsUrl);
    console.log("DEBUG: URL is empty/undefined:", !wsUrl || wsUrl.trim() === "");
    super(transactionId, finalWsUrl, options);
  }
}

// Deposit status WebSocket class
export class DepositStatusWebSocket extends BaseTransactionStatusWebSocket {
  constructor(
    transactionId: string,
    options: {
      onMessage?: (data: TransactionStatusMessage) => void;
      onError?: (error: Event) => void;
      onClose?: () => void;
      autoReconnect?: boolean;
    } = {}
  ) {
    const wsUrl = API_CONFIG.EXCHANGE.SOCKETS.DEPOSIT_STATUS(transactionId);
    super(transactionId, wsUrl, options);
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
  } = {}
) => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [lastMessage, setLastMessage] =
    React.useState<TransactionStatusMessage | null>(null);
  const wsRef = React.useRef<BaseTransactionStatusWebSocket | null>(null);

  React.useEffect(() => {
    if (!transactionId) return;

    console.log("DEBUG: useTransactionStatusWebSocket - transactionId:", transactionId);
    console.log("DEBUG: useTransactionStatusWebSocket - wsUrl:", wsUrl);
    console.log("DEBUG: useTransactionStatusWebSocket - transactionType:", transactionType);

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
