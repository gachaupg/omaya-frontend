import type { TradeMessage } from "@/features/p2p/slices/messageSlice";
import {
  getRememberedSenderPhotoByEmail,
  rememberSenderPhotoByEmail,
} from "@/features/p2p/utils/tradeMessageDedupe";
import {
  getTradePartyPhotoByEmail,
  type TradePhotoContext,
} from "@/features/p2p/utils/matchedTradeNotifications";

const normalizeEmail = (value: string | null | undefined) =>
  String(value ?? "").trim().toLowerCase();

export function looksLikeEmail(value: string | null | undefined): boolean {
  const v = String(value ?? "").trim();
  return v.includes("@");
}

/** Counterparty email in a two-party trade (buyer vs seller). */
export function getCounterpartyEmail(
  currentUserEmail: string | null | undefined,
  trade: { buyer?: string | null; seller?: string | null }
): string | undefined {
  const user = normalizeEmail(currentUserEmail);
  if (!user) return undefined;
  if (normalizeEmail(trade.buyer) === user) {
    return String(trade.seller ?? "").trim() || undefined;
  }
  if (normalizeEmail(trade.seller) === user) {
    return String(trade.buyer ?? "").trim() || undefined;
  }
  return undefined;
}

/**
 * Whether this row was sent by the logged-in user.
 * Primary match: sender_name (email) vs logged-in email.
 */
export function isCurrentUserChatMessage(
  msg: Pick<TradeMessage, "sender_name"> & Partial<Pick<TradeMessage, "sender">>,
  currentUserEmail?: string | null,
  currentUserId?: string | number | null
): boolean {
  const email = normalizeEmail(currentUserEmail);
  const senderEmail = normalizeEmail(msg.sender_name);

  if (email && senderEmail && looksLikeEmail(msg.sender_name)) {
    return email === senderEmail;
  }

  const userId = String(currentUserId ?? "").trim();
  const senderId = String(msg.sender ?? "").trim();
  return Boolean(userId && senderId && senderId === userId);
}

export function resolveChatSenderDisplayName(
  msg: Pick<TradeMessage, "sender_name" | "sender_username">,
  options: {
    isCurrentUser: boolean;
    buyerName?: string;
    sellerName?: string;
    buyerEmail?: string;
    sellerEmail?: string;
    counterpartyDisplayName?: string;
  }
): string {
  if (options.isCurrentUser) return "You";

  const username = String(msg.sender_username ?? "").trim();
  if (username && !looksLikeEmail(username)) return username;

  const senderEmail = String(msg.sender_name ?? "").trim();
  if (
    senderEmail &&
    options.buyerEmail &&
    normalizeEmail(senderEmail) === normalizeEmail(options.buyerEmail)
  ) {
    const name = String(options.buyerName ?? "").trim();
    if (name && !looksLikeEmail(name)) return name;
  }
  if (
    senderEmail &&
    options.sellerEmail &&
    normalizeEmail(senderEmail) === normalizeEmail(options.sellerEmail)
  ) {
    const name = String(options.sellerName ?? "").trim();
    if (name && !looksLikeEmail(name)) return name;
  }

  const counterparty = String(options.counterpartyDisplayName ?? "").trim();
  if (counterparty && !looksLikeEmail(counterparty)) return counterparty;

  if (username) return username;
  if (looksLikeEmail(senderEmail)) {
    const local = senderEmail.split("@")[0]?.trim();
    if (local) return local;
  }
  return "User";
}

/**
 * Avatar for an incoming message: compare logged-in email to message sender_name,
 * then use that row's sender_photo, then trade buyer/seller photo for that email.
 */
export function resolveChatSenderPhoto(
  msg: Pick<TradeMessage, "sender_name" | "sender_photo">,
  options: {
    currentUserEmail?: string | null;
    tradePhotoContext: TradePhotoContext;
  }
): string | undefined {
  if (isCurrentUserChatMessage(msg, options.currentUserEmail)) {
    return undefined;
  }

  const fromMessage = String(msg.sender_photo ?? "").trim();
  if (fromMessage) {
    rememberSenderPhotoByEmail(msg.sender_name, fromMessage);
    return fromMessage;
  }

  const remembered = getRememberedSenderPhotoByEmail(msg.sender_name);
  if (remembered) return remembered;

  const fromTradeParty = getTradePartyPhotoByEmail(
    msg.sender_name,
    options.tradePhotoContext
  );
  if (fromTradeParty?.trim()) {
    rememberSenderPhotoByEmail(msg.sender_name, fromTradeParty);
    return fromTradeParty.trim();
  }

  return undefined;
}

/** Header avatar: counterparty email + latest chat row from that email. */
export function resolveCounterpartyChatPhoto(
  messages: Array<Pick<TradeMessage, "sender_name" | "sender_photo">>,
  currentUserEmail: string | null | undefined,
  tradePhotoContext: TradePhotoContext
): string | undefined {
  const counterpartyEmail = getCounterpartyEmail(currentUserEmail, tradePhotoContext);
  const normalizedCounterparty = normalizeEmail(counterpartyEmail);

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (isCurrentUserChatMessage(msg, currentUserEmail)) continue;
    if (
      normalizedCounterparty &&
      normalizeEmail(msg.sender_name) !== normalizedCounterparty
    ) {
      continue;
    }
    const photo =
      String(msg.sender_photo ?? "").trim() ||
      getRememberedSenderPhotoByEmail(msg.sender_name);
    if (photo) {
      rememberSenderPhotoByEmail(msg.sender_name, photo);
      return photo;
    }
  }

  if (counterpartyEmail) {
    const fromTrade = getTradePartyPhotoByEmail(
      counterpartyEmail,
      tradePhotoContext
    );
    if (fromTrade?.trim()) return fromTrade.trim();
  }

  return undefined;
}

const isStaffChatMessage = (msg: any): boolean => {
  if (msg?.is_admin === true) return true;
  const senderType = String(msg?.sender_type ?? "").trim().toLowerCase();
  const senderRole = String(msg?.sender_role ?? "").trim().toLowerCase();
  return (
    senderType === "staff" ||
    senderType === "admin" ||
    senderRole === "staff" ||
    senderRole === "admin"
  );
};

/** Display name for support/appeal rows in the P2P Trading Chat tab. */
export function resolveGroupedChatSenderDisplayName(
  msg: any,
  messageType?: string
): string {
  if (isStaffChatMessage(msg)) return "Support";

  const name = String(msg?.sender_name ?? "").trim();
  if (name) return name;

  const email = String(msg?.sender_email ?? "").trim();
  if (email) return email.split("@")[0];

  const type = String(messageType ?? "").trim().toLowerCase();
  if (type === "support" || type === "appeal") return "Support";

  return "Unknown User";
}
