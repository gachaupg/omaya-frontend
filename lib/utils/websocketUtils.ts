/**
 * WebSocket URL utilities - append auth token to WebSocket URLs
 */

/**
 * Appends ?token= or &token= to a WebSocket URL when token is provided.
 * Safe to call with null/undefined token - returns original URL unchanged.
 */
export function appendTokenToWebSocketUrl(
  url: string,
  token: string | null | undefined
): string {
  if (!url || typeof url !== "string") return url;
  if (!token || typeof token !== "string" || token.length < 10) return url;

  try {
    const separator = url.includes("?") ? "&" : "?";
    const encodedToken = encodeURIComponent(token);
    return `${url}${separator}token=${encodedToken}`;
  } catch {
    return url;
  }
}

function asUserText(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

/**
 * Parse `notification` when backend sends a JSON string, or use object as-is.
 */
function normalizeNotificationObj(n: unknown): Record<string, unknown> | undefined {
  if (n == null) return undefined;
  if (typeof n === "string") {
    try {
      const p = JSON.parse(n) as unknown;
      if (p && typeof p === "object" && !Array.isArray(p)) return p as Record<string, unknown>;
    } catch {
      const t = n.trim();
      return t ? { message: t } : undefined;
    }
    return undefined;
  }
  if (typeof n === "object" && !Array.isArray(n)) return n as Record<string, unknown>;
  return undefined;
}

/**
 * Backend often sends `{ notification: { reason, message } }` on rejected status updates.
 */
function resolveNotificationBlock(obj: Record<string, unknown> | undefined): string | undefined {
  if (!obj) return undefined;
  const rawN =
    obj.notification ??
    (obj as { Notification?: unknown }).Notification ??
    (obj as { notifications?: unknown }).notifications;

  let blocks: unknown[] = [];
  if (Array.isArray(rawN)) blocks = rawN;
  else if (rawN != null) blocks = [rawN];

  for (const entry of blocks) {
    const notif = normalizeNotificationObj(entry);
    if (!notif) continue;
    const reason = asUserText(notif.reason ?? (notif as { rejection_reason?: unknown }).rejection_reason);
    const msg = asUserText(notif.message ?? (notif as { detail?: unknown }).detail);
    if (reason && msg && reason !== msg) return `${reason}\n\n${msg}`;
    if (reason) return reason;
    if (msg) return msg;
  }
  return undefined;
}

function collectPayloadLayers(raw: Record<string, unknown>): Record<string, unknown>[] {
  const layers: Record<string, unknown>[] = [];
  const seen = new Set<unknown>();

  const push = (o: unknown) => {
    if (!o || typeof o !== "object" || seen.has(o)) return;
    seen.add(o);
    layers.push(o as Record<string, unknown>);
  };

  push(raw);
  const inner = raw.data;
  if (inner && typeof inner === "object") {
    push(inner);
    const innerData = (inner as Record<string, unknown>).data;
    if (innerData && typeof innerData === "object") push(innerData);
  }
  const payload = raw.payload;
  if (payload && typeof payload === "object") push(payload);

  return layers;
}

/**
 * Best-effort user-visible failure/rejection line from transaction status WebSocket payloads.
 * Handles nested `data` / `payload`, `notification.reason` / `notification.message`, and flat objects.
 */
export function resolveExpressTransactionFailureMessage(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;

  for (const layer of collectPayloadLayers(r)) {
    const fromNotify = resolveNotificationBlock(layer);
    if (fromNotify) return fromNotify;
  }

  for (const layer of collectPayloadLayers(r)) {
    const candidates: unknown[] = [
      layer.rejection_reason,
      layer.failure_reason,
      layer.message,
      layer.reason,
      layer.error_message,
      layer.comment_text,
      layer.error,
    ];

    for (const c of candidates) {
      const t = asUserText(c);
      if (t) return t;
    }
  }

  const rootCandidates: unknown[] = [r.message, r.rejection_reason, r.error];
  for (const c of rootCandidates) {
    const t = asUserText(c);
    if (t) return t;
  }

  return undefined;
}
