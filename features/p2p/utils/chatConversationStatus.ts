export const normalizeChatStatusValue = (value: unknown): string => {
  const s = String(value ?? "").trim().toLowerCase();
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
    t.includes("conversation is now open") ||
    t.includes("chat is now open")
  ) {
    return "reopened";
  }

  if (
    t.includes("chat is now closed") ||
    t.includes("chat has been closed") ||
    t.includes("conversation has been closed") ||
    t.includes("this chat is closed") ||
    t.includes("conversation is now closed")
  ) {
    return "closed";
  }

  return null;
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

export const resolveReopenedChatStatus = (
  messageType?: string | null
): string => {
  const type = String(messageType ?? "").trim().toLowerCase();
  if (type === "support" || type === "appeal") return "open";
  return "matched";
};

export const mergeConversationStatus = (
  previousStatus: unknown,
  incomingStatus: unknown
): string => {
  const prev = normalizeChatStatusValue(previousStatus);
  const incoming = normalizeChatStatusValue(incomingStatus);
  if (!incoming) return prev;
  if (isOpenChatStatus(incoming)) return incoming;
  if (
    isTerminalChatStatusValue(prev) &&
    !isTerminalChatStatusValue(incoming)
  ) {
    return incoming;
  }
  return incoming || prev;
};
