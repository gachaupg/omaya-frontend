/** Shared helpers for p2p-trade-confirm WebSocket payloads (pending_acceptance, flags, decline). */

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

/** True when owner has accepted — via status or confirm flags from REST/WS. */
export function isTradeAcceptedFromWsSnapshot(snap: WsTradeSnapshot): boolean {
  if (snap.can_confirm_payment === true || snap.can_confirm_receipt === true) {
    return true;
  }
  const s = snap.rawStatus.trim().toLowerCase();
  if (!s || isPendingAcceptanceStatus(s) || TERMINAL_REJECT_STATUSES.has(s)) {
    return false;
  }
  return true;
}

export function isTradeAcceptedFromConfirmOrder(order: {
  status?: string | null;
  can_confirm_payment?: boolean;
  can_confirm_receipt?: boolean;
}): boolean {
  if (order.can_confirm_payment === true || order.can_confirm_receipt === true) {
    return true;
  }
  const st = String(order.status ?? "").trim();
  if (!st || isPendingAcceptanceStatus(st)) return false;
  const lowered = st.toLowerCase();
  if (TERMINAL_REJECT_STATUSES.has(lowered)) return false;
  return true;
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

export function formatCountdownSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
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
