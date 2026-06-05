import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import {
  setMessages,
  addMessageFromWS,
  clearMessagesForTrade,
} from "../slices/messageSlice";
import {
  getTradeMessagesWebSocket,
  cleanupTradeMessagesWebSocket,
  TradeMessage,
} from "../services/tradeMessagesWebSocket";
import type { WebSocketMessage } from "../services/tradeMessagesWebSocket";
import { cookieUtils } from "@/lib/utils/cookieUtils";
import { API_CONFIG } from "@/lib/appConfig";

import { logger } from '@/lib/utils/logger';
import { parseTradeMessagesCancelPayload } from "../utils/tradeMessagesCancelDetection";
import { P2P_TRADE_CANCELED_EVENT } from "../constants/tradeSocketEvents";

interface UseTradeMessagesWebSocketOptions {
  tradeId: string;
  enabled?: boolean;
  /** Fired when the trade-messages socket pushes `status_update` with canceled/cancelled. */
  onTradeCanceled?: (info: { message?: string; status?: string }) => void;
}

export const useTradeMessagesWebSocket = (options: UseTradeMessagesWebSocketOptions) => {
  const { tradeId, enabled = true } = options;
  const onTradeCanceledRef = useRef(options.onTradeCanceled);
  onTradeCanceledRef.current = options.onTradeCanceled;
  const dispatch = useDispatch<AppDispatch>();
  const mountedRef = useRef(true);
  const [isConnected, setIsConnected] = useState(false);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cancelModalFiredRef = useRef(false);

  // Get or create WebSocket instance when tradeId changes
  const wsRef = useRef(getTradeMessagesWebSocket(tradeId));

  // Update wsRef when tradeId changes
  useEffect(() => {
    wsRef.current = getTradeMessagesWebSocket(tradeId);
    cancelModalFiredRef.current = false;
  }, [tradeId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Periodic connection check
  useEffect(() => {
    if (!enabled || !tradeId) return;

    // Check connection status frequently for faster recovery.
    heartbeatIntervalRef.current = setInterval(() => {
      const ws = wsRef.current;
      const connected = ws.isConnected();
      
      if (mountedRef.current) {
        setIsConnected(connected);
      }

      // If disconnected and not permanently failed, try to reconnect
      if (!connected && !ws.hasFailed()) {
        const getAccessToken = (): string | null => {
          const cookieToken = cookieUtils.getCookie("access_token");
          if (cookieToken) return cookieToken;
          if (typeof window !== "undefined") {
            const localToken = localStorage.getItem("access_token");
            if (localToken) return localToken;
          }
          return null;
        };

        const token = getAccessToken();
        if (token && token.includes('.')) {
          ws.resetPermanentFailure();
          ws.connect(tradeId, token);
        }
      }
    }, 1000);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [enabled, tradeId]);

  useEffect(() => {
    if (!enabled || !tradeId) {
      return;
    }

    cancelModalFiredRef.current = false;

    const getAccessToken = (): string | null => {
      // First try to get from cookies (primary storage)
      const cookieToken = cookieUtils.getCookie("access_token");
      if (cookieToken) {
        return cookieToken;
      }
      
      // Fallback to localStorage (for backward compatibility)
      if (typeof window !== "undefined") {
        const localToken = localStorage.getItem("access_token");
        if (localToken) {
          return localToken;
        }
      }
      
      return null;
    };

    const token = getAccessToken();

    if (!token) {
      return;
    }

    // Validate token format (basic check)
    if (!token.includes('.')) {
      return;
    }

    const ws = wsRef.current;

    // Handle WebSocket messages
    const unsubscribeMessage = ws.onMessage((message: WebSocketMessage) => {
      if (!mountedRef.current) return;

      try {
        const msgAny = message as Record<string, unknown>;
        console.log("[P2P trade-messages WS] handler tradeId=%s payload=", tradeId, msgAny);
        const candidatePayload: any =
          (message as any)?.data && typeof (message as any).data === "object"
            ? (message as any).data
            : (message as any);
        const normalizeStatus = (value: unknown): string => {
          const s = String(value ?? "").trim().toLowerCase();
          if (!s) return "";
          if (s === "canceled") return "cancelled";
          if (s === "complete") return "completed";
          return s;
        };
        const statusNow = normalizeStatus(
          candidatePayload?.status ??
            candidatePayload?.trade_status ??
            candidatePayload?.order_status ??
            (message as any)?.status ??
            (message as any)?.trade_status ??
            (message as any)?.order_status
        );
        const isTerminalStatus =
          statusNow === "cancelled" ||
          statusNow === "resolved" ||
          statusNow === "completed";
        const payloadTradeId = String(
          candidatePayload?.trade_id ??
            candidatePayload?.trade ??
            (message as any)?.trade_id ??
            ""
        ).trim();
        const isForCurrentTrade =
          !payloadTradeId ||
          !tradeId ||
          payloadTradeId.toLowerCase() === String(tradeId).trim().toLowerCase();
        if (isTerminalStatus && isForCurrentTrade && statusNow === "cancelled" && tradeId?.trim()) {
          if (!cancelModalFiredRef.current) {
            cancelModalFiredRef.current = true;
            const terminalDetail = String(
              candidatePayload?.message ?? (message as any)?.message ?? ""
            ).trim();
            onTradeCanceledRef.current?.({
              status: statusNow,
              message: terminalDetail || undefined,
            });
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent(P2P_TRADE_CANCELED_EVENT, {
                  detail: {
                    tradeId,
                    message: terminalDetail || undefined,
                    source: "trade-messages-ws-fastpath",
                  },
                })
              );
            }
          }
        }

        const { shouldNotify, status: statusRaw, message: detail } =
          parseTradeMessagesCancelPayload(msgAny, tradeId);
        if (shouldNotify && tradeId?.trim()) {
          if (cancelModalFiredRef.current) {
            console.log("[P2P trade-messages WS] skip duplicate cancel modal for trade", tradeId);
          } else {
            cancelModalFiredRef.current = true;
            console.log("[P2P trade-messages WS] trade canceled → modal + event", {
              tradeId,
              statusRaw,
              detail,
            });
            onTradeCanceledRef.current?.({ status: statusRaw, message: detail });
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent(P2P_TRADE_CANCELED_EVENT, {
                  detail: { tradeId, message: detail, source: "trade-messages-ws" },
                })
              );
            }
          }
        }

        // Accept message payloads even when backend uses non-standard `type`
        // or puts message fields at root instead of `data`.
        const hasMessageBodyOrMedia =
          candidatePayload &&
          (candidatePayload.message != null ||
            candidatePayload.content != null ||
            Array.isArray(candidatePayload.images) ||
            Array.isArray(candidatePayload.uploaded_images) ||
            Array.isArray(candidatePayload.audios) ||
            Array.isArray(candidatePayload.uploaded_audios) ||
            candidatePayload.audio_url != null ||
            candidatePayload.audio != null);
        const rawType = String((message as any)?.type ?? "").trim().toLowerCase();
        const payloadMessageText = String(
          candidatePayload?.message ?? candidatePayload?.content ?? ""
        )
          .trim()
          .toLowerCase();
        const isSystemConnectionPayload =
          rawType === "connection_established" ||
          payloadMessageText === "websocket connected for p2p trade messages" ||
          payloadMessageText === "websocket connected";
        const looksLikeChatMessage = Boolean(
          hasMessageBodyOrMedia && !isSystemConnectionPayload
        );
        const handledByTypedMessageCase =
          rawType === "new_message" ||
          rawType === "message_received" ||
          rawType === "messages_list" ||
          rawType === "initial_messages" ||
          rawType === "recent_messages";
        if (looksLikeChatMessage && !handledByTypedMessageCase) {
          const resolvedId =
            candidatePayload.id ??
            candidatePayload.message_id ??
            candidatePayload.uuid ??
            `${String(
              candidatePayload.trade_id ?? candidatePayload.trade ?? tradeId
            )}-${String(
              candidatePayload.timestamp ?? new Date().toISOString()
            )}-${String(
              candidatePayload.sender_id ??
                candidatePayload.sender ??
                candidatePayload.sender_name ??
                "unknown"
            )}`;
          const normalized: TradeMessage = {
            id: String(resolvedId),
            trade:
              candidatePayload.trade ||
              candidatePayload.trade_id ||
              parseInt(tradeId),
            trade_id: candidatePayload.trade_id ?? tradeId,
            sender:
              candidatePayload.sender ??
              candidatePayload.sender_id ??
              candidatePayload.sender_name ??
              "",
            sender_name:
              candidatePayload.sender_name ??
              candidatePayload.sender_email ??
              String(candidatePayload.sender ?? ""),
            message: String(
              candidatePayload.message ?? candidatePayload.content ?? ""
            ),
            images:
              candidatePayload.images ||
              candidatePayload.uploaded_images ||
              [],
            audios:
              candidatePayload.audios ||
              candidatePayload.uploaded_audios ||
              [],
            audio_url: candidatePayload.audio_url,
            audio: candidatePayload.audio,
            timestamp: candidatePayload.timestamp || new Date().toISOString(),
            seller_photo: candidatePayload.seller_photo || "",
          };
          dispatch(
            addMessageFromWS({
              tradeId,
              message: normalized,
            })
          );
          setIsConnected(true);
        }

        switch (message.type) {
          case "connection_established":
            // Silent - connection established
            setIsConnected(true);
            break;

          case "pong":
            // Pong response - connection is alive
            setIsConnected(true);
            break;

          case "messages_list":
          case "initial_messages":
          case "recent_messages":
            // Initial list of messages - handle both formats
            const messagesList = message.data.messages || message.data;
            if (messagesList && Array.isArray(messagesList)) {
              logger.debug('p2p', "📨 Received message list via WebSocket:", messagesList.length, "messages");
              dispatch(
                setMessages({
                  tradeId,
                  messages: messagesList as TradeMessage[],
                })
              );
            }
            setIsConnected(true);
            break;

          case "new_message":
          case "message_received":
            // New message received - the data IS the message itself
            if (
              message.data &&
              (message.data.id != null ||
                message.data.message_id != null ||
                message.data.uuid != null)
            ) {
              // Log detailed info about incoming message
              logger.debug('p2p', "📨 New message received via WebSocket:", {
                id: message.data.id,
                hasText: !!message.data.message,
                text: message.data.message?.substring(0, 30) || '(no text)',
                hasImages: Array.isArray(message.data.images) && message.data.images.length > 0,
                imageCount: message.data.images?.length || 0,
                images: message.data.images,
              });
              
              const newMessage: TradeMessage = {
                id: String(
                  message.data.id ??
                    message.data.message_id ??
                    message.data.uuid
                ),
                trade: message.data.trade || parseInt(tradeId),
                trade_id: message.data.trade_id ?? tradeId,
                sender:
                  message.data.sender ??
                  message.data.sender_id ??
                  message.data.sender_name ??
                  "",
                sender_name:
                  message.data.sender_name ??
                  message.data.sender_email ??
                  String(message.data.sender ?? ""),
                message: String(
                  message.data.message ?? message.data.content ?? ""
                ),
                // IMPORTANT: Set images array even if empty - this signals that refresh is needed
                images: message.data.images || [],
                audios: message.data.audios || message.data.uploaded_audios || [],
                audio_url: message.data.audio_url,
                audio: message.data.audio,
                timestamp: message.data.timestamp,
                seller_photo: message.data.seller_photo || "",
              };
              
              dispatch(
                addMessageFromWS({
                  tradeId,
                  message: newMessage,
                })
              );
              
              // If message has images but no valid URLs, log warning
              if (newMessage.images && newMessage.images.length > 0) {
                const hasValidUrls = newMessage.images.some((img: any) => {
                  const url = (img?.image_url || img?.image || img);
                  return url && typeof url === 'string' && url.trim() !== '' && !url.startsWith('blob:');
                });
                
                if (!hasValidUrls) {
                  console.warn("⚠️ WebSocket message has images but no valid S3 URLs yet - auto-refresh should trigger");
                }
              }
            }
            setIsConnected(true);
            break;

          case "error":
            // Silent error handling
            console.warn("⚠️ WebSocket error message:", message.data);
            break;

          case "status_update":
            // Handled above (canceled → callback). No-op here for chat message types.
            break;

          default:
            // Unknown types are tolerated; message-like payloads are handled above.
            break;
        }
      } catch (error) {
        console.error("[P2P trade-messages WS] onMessage handler error:", error);
      }
    });

    // Handle WebSocket errors
    const unsubscribeError = ws.onError((error) => {
      // Silent error handling
    });

    // Handle WebSocket close
    const unsubscribeClose = ws.onClose(() => {
      if (!mountedRef.current) return;
      setIsConnected(false);
      // Silent close handling
    });

    // Handle WebSocket open
    const unsubscribeOpen = ws.onOpen(() => {
      if (!mountedRef.current) return;
      setIsConnected(true);
      // Silent open handling
    });

    // Log and connect to WebSocket (helps verify exact socket endpoint in runtime).
    try {
      const wsUrl = API_CONFIG.P2P.SOCKETS.TRADE_MESSAGES(tradeId, token);
      console.log("[P2P trade-messages WS] connecting URL:", wsUrl);
    } catch (e) {
      console.warn("[P2P trade-messages WS] failed to build URL for logging");
    }
    ws.connect(tradeId, token);

    // Cleanup function
    return () => {
      unsubscribeMessage();
      unsubscribeError();
      unsubscribeClose();
      unsubscribeOpen();
      cleanupTradeMessagesWebSocket(tradeId);
      dispatch(clearMessagesForTrade(tradeId));
    };
  }, [enabled, tradeId, dispatch]);

  return {
    sendMessage: (message: string, images: File[] = []) => {
      wsRef.current.sendMessage(message, images);
    },
    isConnected,
  };
};

