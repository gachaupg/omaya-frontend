import type { TradeMessage } from "@/features/p2p/slices/messageSlice";

const normalize = (v: unknown) => String(v ?? "").trim().toLowerCase();

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

export const isSameSender = (
  a: TradeMessage,
  b: TradeMessage,
  currentUserEmail?: string
): boolean => {
  const aName = normalize(a.sender_name);
  const bName = normalize(b.sender_name);
  const aSender = normalize(a.sender);
  const bSender = normalize(b.sender);
  if (aName && bName && aName === bName) return true;
  if (aSender && bSender && aSender === bSender) return true;

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
  windowMs = 15000
): boolean => {
  const timeDiff = Math.abs(
    new Date(String(a.timestamp || 0)).getTime() -
      new Date(String(b.timestamp || 0)).getTime()
  );
  if (timeDiff >= windowMs) return false;

  const oneIsTemp = isTempMessageId(a.id) !== isTempMessageId(b.id);
  if (!oneIsTemp && !isSameSender(a, b, currentUserEmail)) return false;

  const textA = normalize(a.message);
  const textB = normalize(b.message);
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

  if (imageOnly || audioOnly) return true;

  const contentMatch =
    sameText &&
    imageCountA === imageCountB &&
    audioCountA === audioCountB;

  if (!contentMatch) return false;
  if (oneIsTemp) return true;
  return isSameSender(a, b, currentUserEmail);
};

/** Drop optimistic rows once a matching real message exists; collapse near-identical echoes. */
export const dedupeTradeMessages = (
  messages: TradeMessage[],
  currentUserEmail?: string
): TradeMessage[] => {
  const real = messages.filter((m) => !isTempMessageId(m.id));
  const temps = messages.filter((m) => isTempMessageId(m.id));

  const filteredTemps = temps.filter(
    (temp) => !real.some((r) => tradeMessagesAreDuplicates(temp, r, currentUserEmail))
  );

  const combined = [...real, ...filteredTemps].sort(
    (a, b) =>
      new Date(String(a.timestamp || 0)).getTime() -
      new Date(String(b.timestamp || 0)).getTime()
  );

  const seen = new Map<string, number>();
  return combined.filter((msg) => {
    const systemText = normalize((msg as any)?.message);
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

    const baseKey = `${normalize(msg.sender_name)}|${normalize(msg.sender)}|${normalize(msg.message)}|${getMessageImageCount(msg)}|${getAudioCount(msg)}|${imageKey}`;
    const ts = new Date(String(msg.timestamp || 0)).getTime();
    const prev = seen.get(baseKey);
    if (prev != null && Math.abs(ts - prev) < 15000) return false;
    seen.set(baseKey, ts);
    return true;
  });
};
