import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import {
  getTradeStatusWebSocket,
  cleanupTradeStatusWebSocket,
  TradeStatus,
} from "../services/tradeStatusWebSocket";
import type { WebSocketMessage } from "../services/tradeStatusWebSocket";
import { cookieUtils } from "@/lib/utils/cookieUtils";

interface UseTradeStatusWebSocketOptions {
  tradeId: string;
  enabled?: boolean;
  onStatusUpdate?: (status: TradeStatus) => void;
}

export const useTradeStatusWebSocket = (options: UseTradeStatusWebSocketOptions) => {
  const { tradeId, enabled = true, onStatusUpdate } = options;
  const dispatch = useDispatch<AppDispatch>();
  const wsRef = useRef(getTradeStatusWebSocket(tradeId));
  const mountedRef = useRef(true);
  
  // Store callback in ref to prevent reconnections when it changes
  const onStatusUpdateRef = useRef(onStatusUpdate);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Update the callback ref when it changes (without triggering reconnection)
  useEffect(() => {
    onStatusUpdateRef.current = onStatusUpdate;
  }, [onStatusUpdate]);

  useEffect(() => {
    console.log('🎯 useTradeStatusWebSocket Hook Initialized:', { enabled, tradeId });
    
    if (!enabled || !tradeId) {
      console.log('⚠️ WebSocket NOT enabled or no tradeId:', { enabled, tradeId });
      return;
    }

    const getAccessToken = (): string | null => {
      // First try to get from cookies (primary storage)
      const cookieToken = cookieUtils.getCookie("access_token");
      if (cookieToken) {
        console.log('✅ Access token found in cookies');
        return cookieToken;
      }
      
      // Fallback to localStorage (for backward compatibility)
      if (typeof window !== "undefined") {
        const localToken = localStorage.getItem("access_token");
        if (localToken) {
          console.log('✅ Access token found in localStorage');
          return localToken;
        }
      }
      
      console.log('❌ No access token found!');
      return null;
    };

    const token = getAccessToken();

    if (!token) {
      console.log('❌ Cannot connect to WebSocket: No token available');
      return;
    }

    // Validate token format (basic check)
    if (!token.includes('.')) {
      console.log('❌ Invalid token format (not a JWT)');
      return;
    }

    console.log('🚀 Connecting to WebSocket...', { tradeId, tokenLength: token.length });
    const ws = wsRef.current;

    // Handle WebSocket messages
    const unsubscribeMessage = ws.onMessage((message: WebSocketMessage) => {
      if (!mountedRef.current) return;

      console.log('📨 WebSocket Message Received:', { type: message.type, message });

      try {
        switch (message.type) {
          case "connection_established":
            console.log('✅ WebSocket Connection Established!');
            break;

          case "status_update":
          case "trade_update":
            const data = message.data || message;
            console.log('📊 Status/Trade Update Data:', data);
            
            if (data && data.status) {
              const tradeStatus: TradeStatus = {
                id: data.id || data.trade_id || tradeId,
                status: data.status,
                amount: data.amount,
                buyer: data.buyer || data.buyer_id,
                seller: data.seller || data.seller_id,
                ...data,
              };
              
              console.log('🔔 Calling onStatusUpdate with:', tradeStatus);
              if (onStatusUpdateRef.current) {
                onStatusUpdateRef.current(tradeStatus);
              }
            } else {
              console.log('⚠️ No status in data:', data);
            }
            break;

          case "error":
            console.log('❌ WebSocket Error Message:', message);
            break;

          default:
            console.log('ℹ️ Unknown message type:', message.type);
            break;
        }
      } catch (error) {
        console.error('❌ Error handling WebSocket message:', error);
      }
    });

    // Handle WebSocket errors
    const unsubscribeError = ws.onError((error) => {
      console.error('❌ WebSocket Error:', error);
    });

    // Handle WebSocket close
    const unsubscribeClose = ws.onClose(() => {
      if (!mountedRef.current) return;
      console.log('🔌 WebSocket Connection Closed');
    });

    // Handle WebSocket open
    const unsubscribeOpen = ws.onOpen(() => {
      if (!mountedRef.current) return;
      console.log('✅ WebSocket Connection Opened!');
    });

    // Connect to WebSocket
    ws.connect(tradeId, token);

    // Cleanup function
    return () => {
      unsubscribeMessage();
      unsubscribeError();
      unsubscribeClose();
      unsubscribeOpen();
      cleanupTradeStatusWebSocket(tradeId);
    };
  }, [enabled, tradeId]); // Removed onStatusUpdate from deps - using ref instead

  return {
    isConnected: wsRef.current.isConnected(),
  };
};

