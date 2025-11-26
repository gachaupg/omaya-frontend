/**
 * moneyXStatusWebSocket.ts – MoneyX transaction status WebSocket handler
 */
import React from "react";
import { API_CONFIG } from "@/lib/appConfig";
import {
  BaseTransactionStatusWebSocket,
  TransactionStatusMessage,
} from "@/features/express/websockets";

/**
 * MoneyX Status WebSocket class
 * Extends BaseTransactionStatusWebSocket for MoneyX transactions
 */
export class MoneyXStatusWebSocket extends BaseTransactionStatusWebSocket {
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
    // Build WebSocket URL if not provided
    const finalWsUrl =
      wsUrl || API_CONFIG.MONEYX.SOCKETS.STATUS(transactionId);
    super(transactionId, finalWsUrl, options);
  }
}

/**
 * Hook for MoneyX transaction status WebSocket
 */
export const useMoneyXStatusWebSocket = (
  transactionId: string,
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
  const wsRef = React.useRef<MoneyXStatusWebSocket | null>(null);

  React.useEffect(() => {
    if (!transactionId) return;

    // Build WebSocket URL if not provided
    const finalWsUrl = wsUrl || API_CONFIG.MONEYX.SOCKETS.STATUS(transactionId);

    const ws = new MoneyXStatusWebSocket(transactionId, finalWsUrl, {
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
  }, [transactionId, wsUrl]);

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

