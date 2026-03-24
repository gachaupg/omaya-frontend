import { isP2PTradeCanceledStatus } from "./normalizeP2PTradeStatus";

const CHAT_MESSAGE_TYPES = new Set([
  "new_message",
  "message_received",
  "messages_list",
  "initial_messages",
  "recent_messages",
  "pong",
  "connection_established",
  "error",
  "send_message",
]);

function normalizeEventType(t: unknown): string {
  return String(t ?? "")
    .trim()
    .toLowerCase();
}

function pickString(o: Record<string, unknown> | undefined, key: string): string | undefined {
  if (!o) return undefined;
  const v = o[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return undefined;
}

/**
 * Reads status / message from flat or nested trade-messages websocket payloads.
 */
export function parseTradeMessagesCancelPayload(
  msg: Record<string, unknown>,
  currentTradeId?: string
): {
  shouldNotify: boolean;
  status?: string;
  message?: string;
} {
  const msgType = normalizeEventType(msg.type);

  const inner =
    msg.data && typeof msg.data === "object" && !Array.isArray(msg.data)
      ? (msg.data as Record<string, unknown>)
      : undefined;

  const statusRaw =
    pickString(inner, "status") ||
    pickString(inner, "trade_status") ||
    pickString(inner, "state") ||
    pickString(msg, "status") ||
    pickString(msg, "trade_status") ||
    pickString(msg, "state");

  const messageText =
    pickString(inner, "message") || pickString(msg, "message");

  const canceled = statusRaw ? isP2PTradeCanceledStatus(statusRaw) : false;

  const statusishTypes = new Set([
    "status_update",
    "trade_status_update",
    "trade_update",
    "trade_status",
  ]);

  // Only trust explicit status-style events or a completely untyped flat payload (legacy).
  // Avoid arbitrary message types with a `status` field → false "canceled" on new trades.
  const looksLikeStatusEvent =
    statusishTypes.has(msgType) || (msgType === "" && Boolean(statusRaw));

  let shouldNotify = canceled && looksLikeStatusEvent && !CHAT_MESSAGE_TYPES.has(msgType);

  const payloadTradeId =
    pickString(msg, "trade_id") || pickString(inner, "trade_id") || undefined;
  if (
    shouldNotify &&
    currentTradeId &&
    payloadTradeId &&
    String(payloadTradeId).trim().toLowerCase() !== String(currentTradeId).trim().toLowerCase()
  ) {
    shouldNotify = false;
  }

  return { shouldNotify, status: statusRaw, message: messageText };
}
