import type { GroupedUser } from "@/features/p2p/api";

const BUCKET_ENTITY_IDS = new Set(["support", "appeal"]);

export const isBucketEntityId = (value: unknown): boolean =>
  BUCKET_ENTITY_IDS.has(String(value ?? "").trim().toLowerCase());

const isUuid = (value: unknown): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value ?? "").trim()
  );

/** Real thread/trade id — rejects API bucket placeholders like "support" / "appeal". */
export const isValidThreadId = (value: unknown): boolean => {
  const v = String(value ?? "").trim();
  if (!v) return false;
  const lower = v.toLowerCase();
  if (
    lower === "undefined" ||
    lower === "null" ||
    BUCKET_ENTITY_IDS.has(lower)
  ) {
    return false;
  }
  return isUuid(v) || /^[0-9]+$/.test(v) || /^[0-9a-z-]+$/i.test(v);
};

export const extractIdFromMessageId = (value: unknown): string => {
  const v = String(value ?? "").trim();
  if (!v) return "";
  if (v.includes("_initial")) {
    const candidate = v.split("_initial")[0]?.trim();
    if (isValidThreadId(candidate)) return candidate;
  }
  return "";
};

export const getMessageThreadId = (
  msg: any,
  messageType: string
): string => {
  const type = messageType.toLowerCase();
  const safeEntityId = isBucketEntityId(msg?.entity_id) ? "" : msg?.entity_id;

  if (type === "support") {
    return String(
      msg?.support_request_id ??
        safeEntityId ??
        extractIdFromMessageId(msg?.id) ??
        ""
    ).trim();
  }
  if (type === "appeal") {
    return String(
      msg?.appeal_id ?? safeEntityId ?? extractIdFromMessageId(msg?.id) ?? ""
    ).trim();
  }
  if (type === "p2p") {
    return String(msg?.trade_id ?? msg?.trade ?? "").trim();
  }
  return "";
};

const collectThreadIdCandidates = (group: any, messageType: string): string[] => {
  const type = messageType.toLowerCase();
  const fromMessages = Array.isArray(group?.messages)
    ? group.messages.flatMap((m: any) => {
        const threadId = getMessageThreadId(m, type);
        return [
          threadId,
          m?.support_request_id,
          m?.appeal_id,
          m?.trade_id,
          m?.trade,
          extractIdFromMessageId(m?.id),
        ];
      })
    : [];

  return [
    group?.support_request_id,
    group?.appeal_id,
    group?.trade_id,
    ...fromMessages,
    isBucketEntityId(group?.entity_id) ? "" : group?.entity_id,
  ]
    .map((c) => String(c ?? "").trim())
    .filter((c) => isValidThreadId(c));
};

/** Resolve POST target id for support/appeal/p2p grouped conversations. */
export const resolveThreadIdFromGroup = (group: GroupedUser | null): string => {
  if (!group) return "";
  const messageType = String(group.message_type || "")
    .trim()
    .toLowerCase();

  const candidates = collectThreadIdCandidates(group, messageType);
  return candidates[0] ?? "";
};

/**
 * API groups all support under entity_id "support" and appeals under "appeal".
 * Expand into one sidebar conversation per real thread id.
 */
export const expandBucketGroupedUsers = (
  users: GroupedUser[] | null | undefined
): GroupedUser[] => {
  if (!Array.isArray(users)) return [];

  const expanded: GroupedUser[] = [];

  for (const group of users) {
    const messageType = String(group.message_type || "")
      .trim()
      .toLowerCase();
    const entityId = String(group.entity_id ?? "").trim();

    if (
      !isBucketEntityId(entityId) ||
      (messageType !== "support" && messageType !== "appeal")
    ) {
      expanded.push(group);
      continue;
    }

    const messages = Array.isArray(group.messages) ? group.messages : [];
    if (messages.length === 0) {
      expanded.push(group);
      continue;
    }

    const byThread = new Map<string, any[]>();
    for (const msg of messages) {
      const threadId = getMessageThreadId(msg, messageType);
      if (!isValidThreadId(threadId)) continue;
      const bucket = byThread.get(threadId) ?? [];
      bucket.push(msg);
      byThread.set(threadId, bucket);
    }

    if (byThread.size === 0) {
      expanded.push(group);
      continue;
    }

    for (const [threadId, threadMessages] of byThread) {
      const sorted = [...threadMessages].sort(
        (a, b) =>
          new Date(String(b?.timestamp || 0)).getTime() -
          new Date(String(a?.timestamp || 0)).getTime()
      );

      expanded.push({
        ...group,
        entity_id: threadId,
        messages: sorted,
        ...(messageType === "support"
          ? { support_request_id: threadId }
          : { appeal_id: threadId }),
      } as GroupedUser);
    }
  }

  return expanded.sort((a, b) => {
    const aTs = new Date(String(a?.messages?.[0]?.timestamp || 0)).getTime();
    const bTs = new Date(String(b?.messages?.[0]?.timestamp || 0)).getTime();
    return bTs - aTs;
  });
};
