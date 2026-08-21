export const normalizeChatStatusValue = (value: unknown): string => {  const s = String(value ?? "").trim().toLowerCase();
  if (!s) return "";
  if (s === "canceled") return "cancelled";
  if (s === "complete") return "completed";
  return s;
};

export type ChatLifecycleSignal = "reopened" | "closed";

export const detectChatLifecycleFromText = (
  text: unknown
): ChatLifecycleSignal | null => {
  const t = String(text ?? "").trim().toLowerCase();
  if (!t) return null;

  if (
    t.includes("reopened") ||
    t.includes("re-opened") ||
    t.includes("has been reopened") ||
    t.includes("reopened by support") ||
    t.includes("conversation is now open") ||
    t.includes("chat is now open") ||
    t.includes("chat has been reopened")
  ) {
    return "reopened";
  }

  if (
    t.includes("chat is now closed") ||
    t.includes("chat has been closed") ||
    t.includes("conversation has been closed") ||
    t.includes("this chat is closed") ||
    t.includes("conversation is now closed") ||
    t.includes("has been resolved") ||
    t.includes("marked as resolved") ||
    t.includes("is now resolved") ||
    t.includes("now resolved") ||
    t.includes("conversation resolved") ||
    t.includes("support conversation has been resolved") ||
    t.includes("support request has been resolved") ||
    t.includes("ticket has been resolved") ||
    t.includes("has been completed") ||
    t.includes("marked as completed") ||
    t.includes("has been cancelled") ||
    t.includes("marked as cancelled")
  ) {
    return "closed";
  }

  return null;
};

export const detectTerminalStatusFromText = (text: unknown): string | null => {
  const t = String(text ?? "").trim().toLowerCase();
  if (!t) return null;
  if (t.includes("resolved")) return "resolved";
  if (t.includes("completed") || t.includes("complete")) return "completed";
  if (t.includes("cancelled") || t.includes("canceled")) return "cancelled";
  return null;
};

export type ChatLifecycleMatch = {
  lifecycle: ChatLifecycleSignal;
  messageId: string;
  timestamp: number;
};

/** Most recent open/close system message wins (supports reopen-after-close in history). */
export const findLatestChatLifecycleInMessages = (
  messages: Array<{
    id?: unknown;
    content?: unknown;
    message?: unknown;
    timestamp?: unknown;
  }>
): ChatLifecycleMatch | null => {
  let best: ChatLifecycleMatch | null = null;

  for (const msg of messages) {
    const lifecycle = detectChatLifecycleFromText(msg.content ?? msg.message);
    if (!lifecycle) continue;

    const timestamp = new Date(String(msg.timestamp ?? 0)).getTime();
    const messageId = String(msg.id ?? "").trim();
    if (!best || timestamp >= best.timestamp) {
      best = { lifecycle, messageId, timestamp };
    }
  }

  return best;
};

export type ChatLifecycleMessage = {
  id?: unknown;
  content?: unknown;
  message?: unknown;
  timestamp?: unknown;
};

const findLatestLifecycleOfType = (
  messages: ChatLifecycleMessage[],
  lifecycle: ChatLifecycleSignal
): ChatLifecycleMatch | null => {
  let best: ChatLifecycleMatch | null = null;

  for (const msg of messages) {
    const detected = detectChatLifecycleFromText(msg.content ?? msg.message);
    if (detected !== lifecycle) continue;

    const timestamp = new Date(String(msg.timestamp ?? 0)).getTime();
    const messageId = String(msg.id ?? "").trim();
    if (!best || timestamp >= best.timestamp) {
      best = { lifecycle, messageId, timestamp };
    }
  }

  return best;
};

export const findLatestMessageTimestamp = (
  messages: ChatLifecycleMessage[]
): number => {
  let latest = 0;
  for (const msg of messages) {
    const timestamp = new Date(String(msg.timestamp ?? 0)).getTime();
    if (timestamp > latest) latest = timestamp;
  }
  return latest;
};

/**
 * Reopen applies only when it is the newest thread event (or tied with the latest row).
 * Prevents an old "reopened by support" row from hiding resolved/completed/closed UI.
 */
export const isActiveReopenLifecycle = (
  messages: ChatLifecycleMessage[]
): boolean => {
  const latestReopen = findLatestLifecycleOfType(messages, "reopened");
  if (!latestReopen) return false;

  const latestClosed = findLatestLifecycleOfType(messages, "closed");
  if (latestClosed && latestClosed.timestamp > latestReopen.timestamp) {
    return false;
  }

  const latestMessageTs = findLatestMessageTimestamp(messages);
  if (!latestMessageTs) return true;

  return latestReopen.timestamp >= latestMessageTs - 2000;
};

const STATUS_FIELD_KEYS = [
  "status",
  "trade_status",
  "order_status",
  "conversation_status",
  "thread_status",
  "support_status",
  "request_status",
] as const;

export const isLikelyConversationStatusValue = (value: unknown): boolean => {
  const normalized = normalizeChatStatusValue(value);
  if (!normalized) return false;
  if (/^\d+$/.test(normalized)) return false;
  if (isTerminalChatStatusValue(normalized) || normalized === "closed") {
    return true;
  }
  if (isOpenChatStatus(normalized)) return true;
  return [
    "pending",
    "responded",
    "in progress",
    "in-progress",
    "flagged",
  ].includes(normalized);
};

/** Map lookup in entity_groups, then treat remaining sources as literal status values. */
export const resolveConversationStatusFromSources = (
  entityGroupStatuses: Record<string, string> | null | undefined,
  ...sources: Array<string | undefined>
): string => {
  for (const source of sources) {
    const trimmed = String(source ?? "").trim();
    if (!trimmed) continue;

    if (entityGroupStatuses) {
      const fromMap =
        entityGroupStatuses[trimmed] ??
        entityGroupStatuses[trimmed.toLowerCase()];
      const mapNormalized = normalizeChatStatusValue(fromMap);
      if (mapNormalized && isLikelyConversationStatusValue(mapNormalized)) {
        return mapNormalized;
      }
    }

    const direct = normalizeChatStatusValue(trimmed);
    if (direct && isLikelyConversationStatusValue(direct)) {
      return direct;
    }
  }
  return "";
};

export const isTerminalChatStatusValue = (value: unknown): boolean => {
  const s = normalizeChatStatusValue(value);
  return s === "completed" || s === "resolved" || s === "cancelled";
};

export const isClosedChatStatus = (
  value: unknown,
  messageType?: string | null
): boolean => {
  const s = normalizeChatStatusValue(value);
  const type = String(messageType ?? "").trim().toLowerCase();

  if (s === "closed") return true;
  if (isTerminalChatStatusValue(s)) return true;

  // Support threads may stay open with empty status until explicitly closed.
  if ((type === "support" || type === "appeal") && !s) return false;

  return false;
};

export const getConversationGroupStatus = (
  userObj: unknown,
  override?: unknown
): string => {
  const overrideNorm = normalizeChatStatusValue(override);

  // WS lifecycle handlers set overrides — apply instantly, don't wait for API poll.
  if (overrideNorm) {
    if (isTerminalChatStatusValue(overrideNorm) || overrideNorm === "closed") {
      return overrideNorm;
    }
    if (isOpenChatStatus(overrideNorm)) {
      return overrideNorm;
    }
  }

  const record =
    userObj && typeof userObj === "object"
      ? (userObj as Record<string, unknown>)
      : null;

  if (record) {
    for (const key of STATUS_FIELD_KEYS) {
      const normalized = normalizeChatStatusValue(record[key]);
      if (!normalized) continue;
      if (isTerminalChatStatusValue(normalized) || normalized === "closed") {
        return normalized;
      }
    }
    for (const key of STATUS_FIELD_KEYS) {
      const normalized = normalizeChatStatusValue(record[key]);
      if (normalized) return normalized;
    }
  }

  return overrideNorm;
};

export const isConversationUiClosed = (
  userObj: unknown,
  messages: ChatLifecycleMessage[],
  override?: unknown
): boolean => {
  const record =
    userObj && typeof userObj === "object"
      ? (userObj as Record<string, unknown>)
      : null;

  if (record?.is_closed === true) {
    return true;
  }

  const overrideNorm = normalizeChatStatusValue(override);
  const messageType = record?.message_type;

  if (
    overrideNorm &&
    (overrideNorm === "closed" || isTerminalChatStatusValue(overrideNorm))
  ) {
    return true;
  }

  const latestLifecycle = findLatestChatLifecycleInMessages(messages);
  if (latestLifecycle?.lifecycle === "closed") {
    return true;
  }

  const terminal = findTerminalStatusInConversation(userObj);
  if (terminal) return true;

  const groupStatus = getConversationGroupStatus(userObj, undefined);
  if (isClosedChatStatus(groupStatus, messageType as string | null | undefined)) {
    return true;
  }

  if (isActiveReopenLifecycle(messages)) {
    return false;
  }

  if (overrideNorm && isOpenChatStatus(overrideNorm)) {
    return false;
  }

  return false;
};

export const isOpenChatStatus = (value: unknown): boolean => {
  const s = normalizeChatStatusValue(value);
  return (
    s === "open" ||
    s === "active" ||
    s === "reopened" ||
    s === "matched" ||
    s === "half-matched" ||
    s === "pending" ||
    s === "waiting"
  );
};

export const collectConversationStatusValues = (
  userObj: unknown
): string[] => {
  if (!userObj || typeof userObj !== "object") return [];

  const values: string[] = [];
  const record = userObj as Record<string, unknown>;

  for (const key of STATUS_FIELD_KEYS) {
    const normalized = normalizeChatStatusValue(record[key]);
    if (normalized) values.push(normalized);
  }

  const messages = Array.isArray(record.messages) ? record.messages : [];
  for (const message of messages) {
    if (!message || typeof message !== "object") continue;
    const msg = message as Record<string, unknown>;
    for (const key of STATUS_FIELD_KEYS) {
      const normalized = normalizeChatStatusValue(msg[key]);
      if (normalized) values.push(normalized);
    }
  }

  return values;
};

/** Resolved/completed/cancelled from any conversation field — wins over stale open overrides. */
export const findTerminalStatusInConversation = (
  userObj: unknown
): string | null => {
  for (const value of collectConversationStatusValues(userObj)) {
    if (isTerminalChatStatusValue(value)) return value;
  }
  return null;
};

export const resolveEffectiveConversationStatus = (
  userObj: unknown,
  override?: unknown
): string => {
  const messageType = (userObj as Record<string, unknown> | null)?.message_type;
  const messages = Array.isArray((userObj as Record<string, unknown> | null)?.messages)
    ? ((userObj as Record<string, unknown>).messages as ChatLifecycleMessage[])
    : [];

  const overrideNorm = normalizeChatStatusValue(override);
  if (
    overrideNorm &&
    (overrideNorm === "closed" || isTerminalChatStatusValue(overrideNorm))
  ) {
    return overrideNorm;
  }

  const latestLifecycle = findLatestChatLifecycleInMessages(messages);
  if (latestLifecycle?.lifecycle === "closed") {
    return findTerminalStatusInConversation(userObj) || "closed";
  }

  const terminal = findTerminalStatusInConversation(userObj);
  if (terminal) return terminal;

  const groupStatus = getConversationGroupStatus(userObj, undefined);
  if (isClosedChatStatus(groupStatus, messageType as string | null | undefined)) {
    return normalizeChatStatusValue(groupStatus);
  }

  if (isActiveReopenLifecycle(messages)) {
    return resolveReopenedChatStatus(
      messageType as string | null | undefined
    );
  }

  if (overrideNorm && isOpenChatStatus(overrideNorm)) {
    return overrideNorm;
  }

  if (overrideNorm) return overrideNorm;

  const values = collectConversationStatusValues(userObj);
  return values[0] ?? "";
};

export const resolveReopenedChatStatus = (
  messageType?: string | null
): string => {
  const type = String(messageType ?? "").trim().toLowerCase();
  if (type === "support" || type === "appeal") return "open";
  return "matched";
};

export const resolveStatusFromRecentPayload = (recent: unknown): string => {
  if (!recent || typeof recent !== "object") return "";
  const record = recent as Record<string, unknown>;
  for (const key of STATUS_FIELD_KEYS) {
    const normalized = normalizeChatStatusValue(record[key]);
    if (normalized) return normalized;
  }
  return "";
};

export const applyEntityGroupStatuses = <
  T extends { entity_id: string; status?: string }
>(
  users: T[],
  entityGroupStatuses?: Record<string, string> | null
): T[] => {
  if (!entityGroupStatuses || Object.keys(entityGroupStatuses).length === 0) {
    return users;
  }

  const statusByKey = new Map<string, string>();
  for (const [key, value] of Object.entries(entityGroupStatuses)) {
    const normalized = normalizeChatStatusValue(value);
    if (normalized && isLikelyConversationStatusValue(normalized)) {
      statusByKey.set(key.trim().toLowerCase(), normalized);
    }
  }
  if (statusByKey.size === 0) return users;

  return users.map((user) => {
    const entityId = String(user.entity_id ?? "").trim().toLowerCase();
    const status = statusByKey.get(entityId);
    if (status) return { ...user, status };
    return user;
  });
};

export const mergeConversationStatus = (
  previousStatus: unknown,
  incomingStatus: unknown
): string => {
  const prev = normalizeChatStatusValue(previousStatus);
  const incoming = normalizeChatStatusValue(incomingStatus);
  if (!incoming) return prev;

  const prevIsClosed =
    prev === "closed" || isTerminalChatStatusValue(prev);

  // Once closed/terminal, ignore stale non-terminal poll data (e.g. matched/pending).
  if (prevIsClosed) {
    if (incoming === "closed" || isTerminalChatStatusValue(incoming)) {
      return incoming;
    }
    if (isOpenChatStatus(incoming)) {
      return incoming;
    }
    return prev;
  }

  if (isOpenChatStatus(incoming)) return incoming;
  return incoming || prev;
};
