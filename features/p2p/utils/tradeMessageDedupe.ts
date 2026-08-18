import type { TradeMessage } from "@/features/p2p/slices/messageSlice";

const normalize = (v: unknown) => String(v ?? "").trim().toLowerCase();

/** API rows may use `message`, `content`, or both. */
export const getTradeMessageText = (msg: unknown): string => {
  const m = msg as Record<string, unknown> | null | undefined;
  return String(m?.message ?? m?.content ?? "").trim();
};

const senderPhotoByEmail = new Map<string, string>();

export function rememberSenderPhotoByEmail(
  email: string | null | undefined,
  photo: string | null | undefined
): void {
  const key = normalize(String(email ?? ""));
  const url = String(photo ?? "").trim();
  if (key && url) senderPhotoByEmail.set(key, url);
}

export function getRememberedSenderPhotoByEmail(
  email: string | null | undefined
): string | undefined {
  const key = normalize(String(email ?? ""));
  return key ? senderPhotoByEmail.get(key) : undefined;
}

/** Merge API/WS rows without wiping sender profile fields when refresh omits them. */
export function mergeChatMessageRow(
  prev: TradeMessage,
  incoming: TradeMessage
): TradeMessage {
  const senderPhoto =
    incoming.sender_photo != null && String(incoming.sender_photo).trim() !== ""
      ? String(incoming.sender_photo)
      : prev.sender_photo ||
        getRememberedSenderPhotoByEmail(incoming.sender_name) ||
        getRememberedSenderPhotoByEmail(prev.sender_name);

  const merged: TradeMessage = {
    ...prev,
    ...incoming,
    message:
      String(incoming.message ?? "").trim() !== ""
        ? incoming.message
        : prev.message,
    images:
      Array.isArray(incoming.images) && incoming.images.length > 0
        ? incoming.images
        : prev.images || [],
    audios:
      Array.isArray(incoming.audios) && incoming.audios.length > 0
        ? (incoming.audios as TradeMessage["audios"])
        : prev.audios || [],
    audio_url: incoming.audio_url || prev.audio_url,
    audio: incoming.audio || prev.audio,
    sender_username:
      String(incoming.sender_username ?? "").trim() !== ""
        ? incoming.sender_username
        : prev.sender_username,
    sender_photo: senderPhoto,
  };

  rememberSenderPhotoByEmail(merged.sender_name, merged.sender_photo);
  return merged;
}

export const normalizeTradeMessageForDedupe = (msg: unknown): TradeMessage => {
  const m = msg as Record<string, unknown> | null | undefined;
  const text = getTradeMessageText(msg);
  const senderName = String(m?.sender_name ?? m?.sender_email ?? "");
  const senderPhotoRaw =
    m?.sender_photo != null && String(m.sender_photo).trim() !== ""
      ? String(m.sender_photo)
      : getRememberedSenderPhotoByEmail(senderName);
  const normalized: TradeMessage = {
    ...(msg as TradeMessage),
    id: String(m?.id ?? ""),
    sender: (m?.sender_id ?? m?.sender ?? "") as string | number,
    sender_name: senderName,
    sender_username: String(m?.sender_username ?? ""),
    sender_photo: senderPhotoRaw,
    message: text,
    images: (Array.isArray(m?.images) ? m.images : []) as any[],
    audios: (Array.isArray(m?.audios) ? m.audios : []) as any[],
    timestamp: String(m?.timestamp ?? ""),
    seller_photo: String(m?.seller_photo ?? ""),
  };
  rememberSenderPhotoByEmail(normalized.sender_name, normalized.sender_photo);
  return normalized;
};

const extractImageUrl = (img: unknown): string => {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (typeof img === "object" && img !== null) {
    const o = img as Record<string, unknown>;
    return String(
      o.image_url || o.image || o.url || o.src || o.file || o.attachment || o.path || ""
    );
  }
  return "";
};

export const getMessageImageCount = (msg: unknown): number => {
  const m = msg as Record<string, unknown> | null | undefined;
  const primary = Array.isArray(m?.images) ? m.images.length : 0;
  const secondary = Array.isArray(m?.uploaded_images) ? m.uploaded_images.length : 0;
  return Math.max(primary, secondary);
};

const getAudioCount = (msg: unknown): number => {
  const m = msg as Record<string, unknown> | null | undefined;
  if (Array.isArray(m?.audios) && m.audios.length > 0) return m.audios.length;
  if (Array.isArray(m?.uploaded_audios) && m.uploaded_audios.length > 0) {
    return m.uploaded_audios.length;
  }
  if (m?.audio_url || m?.audio || m?.recording_url) return 1;
  return 0;
};

export const isTempMessageId = (id: unknown): boolean =>
  String(id ?? "").startsWith("temp-");

/** Drop rows explicitly tagged for a different trade; trust the Redux bucket otherwise. */
export const messageBelongsToTrade = (
  msg: TradeMessage,
  tradeId: string
): boolean => {
  const tid = String(tradeId ?? "").trim();
  if (!tid) return false;
  if (isTempMessageId(msg.id)) return true;

  const msgTradeId = String(msg.trade_id ?? "").trim();
  if (msgTradeId && msgTradeId !== tid) return false;

  return true;
};

/** Server/WS placeholder before text or media URLs are attached. */
export const isBlankMediaShell = (msg: TradeMessage): boolean => {
  if (normalize(getTradeMessageText(msg))) return false;
  return getMessageImageCount(msg) === 0 && getAudioCount(msg) === 0;
};

export const isSameChatSender = (
  a: TradeMessage,
  b: TradeMessage,
  currentUserEmail?: string,
  currentUserId?: string | number
): boolean => {
  const aName = normalize(a.sender_name);
  const bName = normalize(b.sender_name);
  const aSender = normalize(a.sender);
  const bSender = normalize(b.sender);
  if (aName && bName && aName === bName) return true;
  if (aSender && bSender && aSender === bSender) return true;

  const userId = normalize(currentUserId);
  if (userId) {
    const isMineById = (msg: TradeMessage) => normalize(msg.sender) === userId;
    if (isMineById(a) && isMineById(b)) return true;
  }

  const user = normalize(currentUserEmail);
  if (!user) return false;
  const isMine = (msg: TradeMessage) => {
    const name = normalize(msg.sender_name);
    const sender = normalize(msg.sender);
    return name === user || sender === user;
  };
  return isMine(a) && isMine(b);
};

/** True when optimistic row and server echo represent the same user message. */
export const tradeMessagesAreDuplicates = (
  a: TradeMessage,
  b: TradeMessage,
  currentUserEmail?: string,
  windowMs = 15000,
  currentUserId?: string | number
): boolean => {
  const timeDiff = Math.abs(
    new Date(String(a.timestamp || 0)).getTime() -
      new Date(String(b.timestamp || 0)).getTime()
  );
  if (timeDiff >= windowMs) return false;

  const oneIsTemp = isTempMessageId(a.id) !== isTempMessageId(b.id);
  if (!oneIsTemp && !isSameChatSender(a, b, currentUserEmail, currentUserId)) return false;

  const textA = normalize(getTradeMessageText(a));
  const textB = normalize(getTradeMessageText(b));
  const sameText = textA === textB;

  const imageCountA = getMessageImageCount(a);
  const imageCountB = getMessageImageCount(b);
  const audioCountA = getAudioCount(a);
  const audioCountB = getAudioCount(b);

  const imageOnly =
    !textA &&
    !textB &&
    imageCountA > 0 &&
    imageCountB > 0 &&
    imageCountA === imageCountB;

  const audioOnly =
    !textA &&
    !textB &&
    imageCountA === 0 &&
    imageCountB === 0 &&
    audioCountA > 0 &&
    audioCountA === audioCountB;

  if ((imageOnly || audioOnly) && oneIsTemp) return true;

  const contentMatch =
    sameText &&
    imageCountA === imageCountB &&
    audioCountA === audioCountB;

  if (!contentMatch) return false;
  if (oneIsTemp) return true;
  return isSameChatSender(a, b, currentUserEmail, currentUserId);
};

/** Drop optimistic rows once a matching real message exists; collapse near-identical echoes. */
export const dedupeTradeMessages = (
  messages: TradeMessage[],
  currentUserEmail?: string,
  currentUserId?: string | number
): TradeMessage[] => {
  const real = messages.filter((m) => !isTempMessageId(m.id));
  const temps = messages.filter((m) => isTempMessageId(m.id));

  const filteredTemps = temps.filter((temp) => {
    const matchingReals = real.filter((r) =>
      tradeMessagesAreDuplicates(temp, r, currentUserEmail, 15000, currentUserId)
    );
    if (matchingReals.length === 0) return true;
    // Keep the optimistic row until a matching server row has visible content.
    return !matchingReals.some((r) => !isBlankMediaShell(r));
  });

  const combined = [...real, ...filteredTemps].sort(
    (a, b) =>
      new Date(String(a.timestamp || 0)).getTime() -
      new Date(String(b.timestamp || 0)).getTime()
  );

  const seen = new Map<string, number>();
  return combined.filter((msg) => {
    const systemText = normalize(getTradeMessageText(msg));
    const senderName = normalize(msg.sender_name);
    const isSystemConnectionRow =
      systemText === "websocket connected for p2p trade messages" ||
      systemText === "websocket connected" ||
      (senderName === "unknown user" &&
        (systemText.includes("websocket connected") ||
          systemText.includes("connection established")));
    if (isSystemConnectionRow) return false;

    const imageKey = (Array.isArray(msg.images) ? msg.images : [])
      .map((img) => extractImageUrl(img).split("?")[0].toLowerCase())
      .filter((u) => u && !u.startsWith("blob:"))
      .join(",");

    const baseKey = `${normalize(msg.sender_name)}|${normalize(getTradeMessageText(msg))}|${getMessageImageCount(msg)}|${getAudioCount(msg)}|${imageKey}`;
    const ts = new Date(String(msg.timestamp || 0)).getTime();
    const prev = seen.get(baseKey);
    if (prev != null && Math.abs(ts - prev) < 15000) return false;
    seen.set(baseKey, ts);
    return true;
  });
};

/** Normalize mixed API/chat-tab rows then dedupe optimistic + server echoes. */
export const dedupeMixedChatMessages = (
  messages: unknown[],
  currentUserEmail?: string,
  currentUserId?: string | number
): TradeMessage[] =>
  dedupeTradeMessages(
    messages.map((m) => normalizeTradeMessageForDedupe(m)),
    currentUserEmail,
    currentUserId
  );

/** Resolve a stable message id from WS/API payloads that may omit `id`. */
export const resolveTradeMessageId = (
  payload: Record<string, unknown>,
  fallbackTradeId?: string
): string => {
  const direct =
    payload.id ?? payload.message_id ?? payload.uuid;
  if (direct != null && String(direct).trim()) {
    return String(direct);
  }
  return `${String(
    payload.trade_id ?? payload.trade ?? fallbackTradeId ?? "unknown"
  )}-${String(payload.timestamp ?? new Date().toISOString())}-${String(
    payload.sender_id ?? payload.sender ?? payload.sender_name ?? "unknown"
  )}`;
};
