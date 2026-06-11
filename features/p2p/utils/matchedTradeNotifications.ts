import { isP2PTradeCanceledStatus } from "./normalizeP2PTradeStatus";

const TERMINAL_MATCHED_TRADE_STATUSES = new Set([
  "cancelled",
  "canceled",
  "completed",
  "declined",
  "rejected",
  "refused",
  "failed",
  "expired",
]);

/** True when a matched-trade row should no longer appear in the notification bell / center. */
export function isTerminalMatchedTradeNotificationStatus(
  status: string | undefined | null
): boolean {
  if (status == null || typeof status !== "string") return false;
  const s = status.trim().toLowerCase();
  if (!s) return false;
  return TERMINAL_MATCHED_TRADE_STATUSES.has(s) || isP2PTradeCanceledStatus(s);
}

/** Whether this trade should count toward notification badge / list. */
export function isPendingMatchedTradeNotification(trade: {
  status?: string | null;
}): boolean {
  return !isTerminalMatchedTradeNotificationStatus(trade.status);
}

export function filterPendingMatchedTradeNotifications<
  T extends { status?: string | null },
>(trades: T[]): T[] {
  return trades.filter(isPendingMatchedTradeNotification);
}

export type MatchedTradeNotificationCategory = "incoming" | "buy" | "sell";

/** Navbar dropdown / notification center filter bucket for a pending trade. */
export function getMatchedTradeNotificationCategory(
  trade: {
    owner?: string | null;
    order_type?: string | null;
    status?: string | null;
  },
  userEmail: string | null | undefined
): MatchedTradeNotificationCategory {
  const isOwner =
    Boolean(userEmail && trade.owner) &&
    normalizeEmail(userEmail) === normalizeEmail(trade.owner);

  if (isOwner) return "incoming";
  if (trade.order_type?.trim().toLowerCase() === "sell") return "buy";
  return "sell";
}

export function groupPendingMatchedTradeNotificationsByCategory<
  T extends {
    owner?: string | null;
    order_type?: string | null;
    status?: string | null;
  },
>(trades: T[], userEmail: string | null | undefined) {
  const groups: Record<MatchedTradeNotificationCategory, T[]> = {
    incoming: [],
    buy: [],
    sell: [],
  };
  for (const trade of trades) {
    groups[getMatchedTradeNotificationCategory(trade, userEmail)].push(trade);
  }
  return groups;
}

export function filterPendingMatchedTradeNotificationsByCategory<
  T extends {
    owner?: string | null;
    order_type?: string | null;
    status?: string | null;
  },
>(
  trades: T[],
  userEmail: string | null | undefined,
  category: MatchedTradeNotificationCategory | null | undefined
): T[] {
  if (!category) return trades;
  return trades.filter(
    (trade) =>
      getMatchedTradeNotificationCategory(trade, userEmail) === category
  );
}

/** Newest first; tie-break by id so list order stays stable across WS/HTTP updates. */
export function sortMatchedTradeNotificationsNewestFirst<
  T extends { id?: string | number | null; timestamp?: string | null },
>(trades: T[]): T[] {
  return [...trades].sort((a, b) => {
    const timeA = new Date(String(a.timestamp || 0)).getTime();
    const timeB = new Date(String(b.timestamp || 0)).getTime();
    if (timeB !== timeA) return timeB - timeA;
    return String(b.id ?? "").localeCompare(String(a.id ?? ""));
  });
}

export type MatchedTradeNotificationStatus = {
  text: string;
  color: string;
};

type MatchedTradeForDisplayName = {
  owner?: string;
  order_type?: string;
  buyer?: string;
  seller?: string;
  buyer_full_name?: string | null;
  seller_full_name?: string | null;
  advertiser_name?: string | null;
};

const normalizeEmail = (e: string | null | undefined) =>
  String(e ?? "").trim().toLowerCase();

const emailLocalPart = (email: string | undefined | null): string => {
  if (!email) return "";
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : email;
};

const pickDisplayName = (
  fullName: string | null | undefined,
  email: string | undefined | null,
  fallback?: string | null
): string => {
  const fromFull = fullName?.trim();
  if (fromFull) return fromFull;
  const fromFallback = fallback?.trim();
  if (fromFallback) return fromFallback;
  const fromEmail = emailLocalPart(email);
  return fromEmail || "Unknown";
};

/** Counterparty / advertiser label for notification rows (full name when API provides it). */
export function getMatchedTradeNotificationDisplayName(
  trade: MatchedTradeForDisplayName,
  userEmail: string | null | undefined
): string {
  const isOwner =
    Boolean(userEmail && trade.owner) &&
    normalizeEmail(userEmail) === normalizeEmail(trade.owner);

  const orderType = trade.order_type?.trim().toLowerCase();

  if (isOwner) {
    if (orderType === "sell") {
      return pickDisplayName(trade.buyer_full_name, trade.buyer);
    }
    return pickDisplayName(trade.seller_full_name, trade.seller);
  }

  if (orderType === "sell") {
    return pickDisplayName(
      trade.seller_full_name,
      trade.seller,
      trade.advertiser_name
    );
  }
  return pickDisplayName(
    trade.buyer_full_name,
    trade.buyer,
    trade.advertiser_name
  );
}

export type TradeNameSource = {
  buyer?: string | null;
  seller?: string | null;
  buyer_full_name?: string | null;
  seller_full_name?: string | null;
};

const toTradeNameSource = (src: unknown): TradeNameSource | undefined => {
  if (src == null || typeof src !== "object") return undefined;
  const o = src as Record<string, unknown>;
  const str = (key: string) => {
    const v = o[key];
    return typeof v === "string" ? v : undefined;
  };
  return {
    buyer: str("buyer"),
    seller: str("seller"),
    buyer_full_name: str("buyer_full_name"),
    seller_full_name: str("seller_full_name"),
  };
};

const pickPartyDisplayName = (
  fullName: string | null | undefined,
  shortName: string | null | undefined
): string => {
  const fromFull = fullName?.trim();
  if (fromFull) return fromFull;
  const fromShort = shortName?.trim();
  if (fromShort) return fromShort;
  return "";
};

/** Counterparty buyer on sell-ad owner trade screens (TradeBuyOwner). */
export function getSellAdOwnerCounterpartyBuyerName(
  ...sources: unknown[]
): string {
  for (const raw of sources) {
    const src = toTradeNameSource(raw);
    const name = pickPartyDisplayName(src?.buyer_full_name, src?.buyer);
    if (name) return name;
  }
  return "—";
}

export type TradePhotoContext = {
  buyer?: string | null;
  seller?: string | null;
  buyer_photo?: string | null;
  seller_photo?: string | null;
  owner?: string | null;
  order_type?: string | null;
};

/** Profile photo for a trade party identified by email (buyer or seller). */
export function getTradePartyPhotoByEmail(
  email: string | null | undefined,
  trade: TradePhotoContext
): string | null | undefined {
  const normalized = normalizeEmail(email);
  if (!normalized) return undefined;
  if (normalizeEmail(trade.buyer) === normalized) return trade.buyer_photo;
  if (normalizeEmail(trade.seller) === normalized) return trade.seller_photo;
  return undefined;
}

/** Counterparty profile photo for the logged-in user in a trade chat. */
export function getTradeCounterpartyPhoto(
  currentUserEmail: string | null | undefined,
  trade: TradePhotoContext
): string | null | undefined {
  const user = normalizeEmail(currentUserEmail);
  if (!user) return undefined;
  if (normalizeEmail(trade.buyer) === user) return trade.seller_photo;
  if (normalizeEmail(trade.seller) === user) return trade.buyer_photo;
  return getMatchedTradeNotificationProfileImage(trade, currentUserEmail);
}

/** Profile photo for the person shown in getMatchedTradeNotificationDisplayName. */
export function getMatchedTradeNotificationProfileImage(
  trade: Pick<
    TradePhotoContext,
    "owner" | "order_type" | "buyer_photo" | "seller_photo"
  >,
  userEmail: string | null | undefined
): string | null | undefined {
  const isOwner =
    Boolean(userEmail && trade.owner) &&
    normalizeEmail(userEmail) === normalizeEmail(trade.owner);

  const orderType = trade.order_type?.trim().toLowerCase();

  if (isOwner) {
    return orderType === "sell" ? trade.buyer_photo : trade.seller_photo;
  }
  return orderType === "sell" ? trade.seller_photo : trade.buyer_photo;
}

/** Display label for a pending matched-trade notification row. */
export function getMatchedTradeNotificationStatus(
  trade: { owner?: string; order_type?: string; status?: string | null },
  userEmail: string
): MatchedTradeNotificationStatus {
  const status = trade.status?.trim().toLowerCase() ?? "";
  if (isP2PTradeCanceledStatus(status)) {
    return { text: "Cancelled", color: "text-red-400" };
  }
  if (status === "completed") {
    return { text: "Completed", color: "text-gray-400" };
  }
  if (status === "pending_acceptance") {
    return { text: "Awaiting acceptance", color: "text-yellow-500" };
  }
  if (
    userEmail &&
    trade.owner &&
    normalizeEmail(userEmail) === normalizeEmail(trade.owner)
  ) {
    return { text: "Pending Incoming Trade", color: "text-[#1D8751]" };
  }
  return {
    text: `Pending ${trade.order_type === "sell" ? "Buy" : "Sell"} Trade`,
    color: "text-yellow-500",
  };
}
