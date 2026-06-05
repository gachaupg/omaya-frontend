/** Shared helpers for p2p-trade-confirm WebSocket payloads (pending_acceptance, flags, decline). */

import {
  isHalfMatchedTradeStatus,
  normalizeP2PTradeStatus,
} from "@/features/p2p/utils/normalizeP2PTradeStatus";

export const PENDING_ACCEPTANCE_AUTO_CANCEL_MS = 3 * 60 * 1000;

export type TradeLifecycleBanner = {
  tone: "info" | "warning" | "danger";
  message: string;
};

export type WsTradeSnapshot = {
  rawStatus: string;
  can_confirm_payment?: boolean;
  can_confirm_receipt?: boolean;
};

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Prefer live WS status over stale REST confirm snapshot for phase/button gates. */
export function getEffectiveTradeStatus(
  confirmStatus: string | undefined | null,
  snap: WsTradeSnapshot
): string {
  const ws = snap.rawStatus.trim();
  const raw = ws || String(confirmStatus ?? "").trim();
  return normalizeP2PTradeStatus(raw) ?? raw;
}

/** Sell-ad owner may confirm fiat received (step 3 button). */
export function canSellerConfirmReceipt(
  effectiveStatus: string,
  flags: { can_confirm_receipt?: boolean },
  inPendingAcceptance: boolean
): boolean {
  if (flags.can_confirm_receipt === false) return false;
  if (inPendingAcceptance && flags.can_confirm_receipt !== true) return false;
  if (flags.can_confirm_receipt === true) return true;
  return isHalfMatchedTradeStatus(effectiveStatus);
}

export function getEffectiveConfirmFlags(
  order:
    | {
        can_confirm_payment?: boolean;
        can_confirm_receipt?: boolean;
      }
    | null
    | undefined,
  snap: WsTradeSnapshot
): {
  can_confirm_payment?: boolean;
  can_confirm_receipt?: boolean;
} {
  return {
    can_confirm_payment:
      snap.can_confirm_payment !== undefined
        ? snap.can_confirm_payment
        : order?.can_confirm_payment,
    can_confirm_receipt:
      snap.can_confirm_receipt !== undefined
        ? snap.can_confirm_receipt
        : order?.can_confirm_receipt,
  };
}

/** Refetch confirm when status or confirm flags change on the wire (not only status string). */
export function shouldRefreshConfirmOrderFromWs(
  order:
    | {
        status?: string | null;
        can_confirm_payment?: boolean;
        can_confirm_receipt?: boolean;
      }
    | null
    | undefined,
  snap: WsTradeSnapshot
): boolean {
  const curStatus = String(order?.status ?? "").trim();
  const newStatus = snap.rawStatus.trim();
  if (newStatus && curStatus !== newStatus) return true;
  if (
    snap.can_confirm_payment !== undefined &&
    snap.can_confirm_payment !== order?.can_confirm_payment
  ) {
    return true;
  }
  if (
    snap.can_confirm_receipt !== undefined &&
    snap.can_confirm_receipt !== order?.can_confirm_receipt
  ) {
    return true;
  }
  return false;
}

export function wsPayloadToSnapshot(payload: Record<string, unknown>): WsTradeSnapshot {
  const data = (payload?.data && typeof payload.data === "object"
    ? (payload.data as Record<string, unknown>)
    : payload) as Record<string, unknown>;
  const rawStatus = str(data.status ?? payload.status);
  const can_confirm_payment =
    typeof data.can_confirm_payment === "boolean"
      ? data.can_confirm_payment
      : typeof (payload as { can_confirm_payment?: boolean }).can_confirm_payment === "boolean"
        ? (payload as { can_confirm_payment: boolean }).can_confirm_payment
        : undefined;
  const can_confirm_receipt =
    typeof data.can_confirm_receipt === "boolean"
      ? data.can_confirm_receipt
      : typeof (payload as { can_confirm_receipt?: boolean }).can_confirm_receipt === "boolean"
        ? (payload as { can_confirm_receipt: boolean }).can_confirm_receipt
        : undefined;
  return { rawStatus, can_confirm_payment, can_confirm_receipt };
}

export function isPendingAcceptanceStatus(raw: string): boolean {
  return raw.trim().toLowerCase() === "pending_acceptance";
}

const TERMINAL_REJECT_STATUSES = new Set([
  "cancelled",
  "canceled",
  "declined",
  "rejected",
  "refused",
]);

const ACCEPTED_TRADE_STATUSES = new Set([
  "matched",
  "half-matched",
  "half_matched",
  "accepted",
]);

/** True when owner has accepted — explicit flags or known post-acceptance statuses only. */
export function isTradeAcceptedFromWsSnapshot(snap: WsTradeSnapshot): boolean {
  if (isPendingAcceptanceStatus(snap.rawStatus)) return false;
  if (snap.can_confirm_payment === true || snap.can_confirm_receipt === true) {
    return true;
  }
  const s = snap.rawStatus.trim().toLowerCase();
  if (!s || TERMINAL_REJECT_STATUSES.has(s)) return false;
  return ACCEPTED_TRADE_STATUSES.has(s);
}

export function isTradeAcceptedFromConfirmOrder(order: {
  status?: string | null;
  can_confirm_payment?: boolean;
  can_confirm_receipt?: boolean;
}): boolean {
  const st = String(order.status ?? "").trim();
  if (isPendingAcceptanceStatus(st)) return false;
  if (order.can_confirm_payment === true || order.can_confirm_receipt === true) {
    return true;
  }
  if (!st) return false;
  const lowered = st.toLowerCase();
  if (TERMINAL_REJECT_STATUSES.has(lowered)) return false;
  return ACCEPTED_TRADE_STATUSES.has(lowered);
}

/** trade_id / id from flat or nested p2p-trade-confirm WebSocket payload */
export function getTradeIdFromWsStatusPayload(payload: Record<string, unknown>): string {
  const data =
    payload.data && typeof payload.data === "object"
      ? (payload.data as Record<string, unknown>)
      : (payload as Record<string, unknown>);
  const id =
    data.trade_id ??
    data.tradeId ??
    data.id ??
    payload.trade_id ??
    payload.tradeId ??
    payload.id;
  return id != null ? String(id).trim() : "";
}

/** When payload includes a trade id, it must match the page trade (avoids acting on a previous trade after navigation). */
export function wsStatusPayloadMatchesTrade(
  payload: Record<string, unknown>,
  currentTradeId: string | null | undefined
): boolean {
  const tid = getTradeIdFromWsStatusPayload(payload);
  const cur = String(currentTradeId ?? "").trim();
  if (!cur) return false;
  if (!tid) return true;
  return tid === cur;
}

/** Match WS payloads while resolving trade id from a market order id (preview wait modal). */
export function wsStatusPayloadMatchesTradeOrOrder(
  payload: Record<string, unknown>,
  tradeId: string | null | undefined,
  orderId?: string | null | undefined
): boolean {
  const tid = getTradeIdFromWsStatusPayload(payload);
  const cur = String(tradeId ?? "").trim();
  const order = String(orderId ?? "").trim();
  if (!cur && !order) return false;
  if (!tid) return true;
  if (cur && tid === cur) return true;
  if (order && tid === order) return true;
  return false;
}

export function formatCountdownSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

const TRANSACTION_TIMER_TERMINAL_STATUSES = new Set([
  "cancelled",
  "canceled",
  "completed",
  "released",
  "declined",
  "rejected",
  "refused",
  "failed",
]);

export function isTerminalTradeStatusForTimer(
  status: string | undefined | null
): boolean {
  return TRANSACTION_TIMER_TERMINAL_STATUSES.has(
    String(status ?? "").trim().toLowerCase()
  );
}

/** Start limit_duration countdown on the order screen (no trade-acceptance gate). */
export function isTransactionCountdownActive(
  displaySeconds: number,
  tradeId: string | undefined | null,
  status: string | undefined | null
): boolean {
  return (
    displaySeconds > 0 &&
    Boolean(tradeId) &&
    !isTerminalTradeStatusForTimer(status)
  );
}

export function isDeclinedLikeStatus(payload: Record<string, unknown>): boolean {
  const snap = wsPayloadToSnapshot(payload);
  const s = snap.rawStatus.toLowerCase();
  if (s === "declined" || s === "rejected" || s === "refused") return true;
  const msg = str(
    (payload.message as string) ??
      ((payload.data as Record<string, unknown> | undefined)?.message as string)
  ).toLowerCase();
  return msg.includes("declined") || msg.includes("rejected");
}
