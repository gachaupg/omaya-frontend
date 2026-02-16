import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  getUserPaymentDetailsWebSocket,
  WebSocketMessage,
} from "../services/userPaymentDetailsWebSocket";
import { fetchUserPaymentDetails as fetchP2PPaymentDetails } from "../slices/paymentMethodsSlice";
import { fetchUserPaymentDetails as fetchExchangePaymentDetails } from "@/features/exchange/slices/paymentSlice";
import { cookieUtils } from "@/lib/utils/cookieUtils";
import { logger } from "@/lib/utils/logger";

interface UseUserPaymentDetailsWebSocketOptions {
  enabled?: boolean;
}

/**
 * Hook for managing user payment details WebSocket connection.
 * When payment_detail_updated is received, refetches user payment details in both
 * P2P (paymentMethods) and Exchange (payment) slices.
 */
export const useUserPaymentDetailsWebSocket = (
  options: UseUserPaymentDetailsWebSocketOptions = {}
) => {
  const { enabled = true } = options;
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, tokens } = useSelector((state: RootState) => state.auth);
  const wsRef = useRef(getUserPaymentDetailsWebSocket());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      return;
    }

    // Prefer token from Redux (source of truth when authenticated), then cookie, then localStorage
    const token =
      tokens?.access ||
      cookieUtils.getCookie("access_token") ||
      (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);

    if (!token || !token.includes(".")) {
      logger.debug("user-payment-details", "No valid token, skipping WebSocket connection");
      return;
    }

    const ws = wsRef.current;

    const unsubscribeMessage = ws.onMessage((message: WebSocketMessage) => {
      if (!mountedRef.current) return;

      try {
        if (message.type === "payment_detail_updated") {
          logger.debug(
            "user-payment-details",
            "Payment detail updated, refetching user payment details",
            message.data
          );
          // Refetch P2P payment methods (used by UserPaymentSelector, Adds, etc.)
          dispatch(fetchP2PPaymentDetails() as any);
          // Refetch exchange payment details (with cache invalidation)
          dispatch(fetchExchangePaymentDetails(true));
        }
      } catch (error) {
        logger.error("user-payment-details", "Error handling WebSocket message:", error);
      }
    });

    logger.debug("user-payment-details", "Connecting to user payment details WebSocket");
    ws.connect({ token });

    return () => {
      unsubscribeMessage();
    };
  }, [enabled, isAuthenticated, tokens?.access, dispatch]);
};
