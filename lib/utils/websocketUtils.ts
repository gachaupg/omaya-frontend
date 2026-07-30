/**
 * WebSocket URL utilities - append auth token to WebSocket URLs
 */

/**
 * Appends ?token= or &token= to a WebSocket URL when token is provided.
 * Safe to call with null/undefined token - returns original URL unchanged.
 *
 * Some backend-issued URLs (e.g. MoneyX's `websocket_url` from the
 * transaction create/status response) already come with a `token` query
 * param baked in. Appending another would produce a duplicate
 * `?token=...&token=...` - the server likely just reads the first one, but
 * it's wasted bytes and leaks the token twice into logs/devtools, so skip
 * appending if the URL already has one.
 */
export function appendTokenToWebSocketUrl(
  url: string,
  token: string | null | undefined
): string {
  if (!url || typeof url !== "string") return url;
  if (!token || typeof token !== "string" || token.length < 10) return url;
  if (/[?&]token=/.test(url)) return url;

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

function isGenericFailureText(text: string): boolean {
  const t = text.trim().toLowerCase();
  return (
    t.includes("your transaction could not be completed") ||
    t.includes("please try again or contact support")
  );
}

function deepFindFirstText(
  value: unknown,
  preferredKeys: string[],
  maxDepth = 8
): string | undefined {
  const queue: Array<{ node: unknown; depth: number }> = [{ node: value, depth: 0 }];
  const seen = new Set<unknown>();

  while (queue.length > 0) {
    const { node, depth } = queue.shift()!;
    if (!node || typeof node !== "object" || seen.has(node)) continue;
    seen.add(node);

    const obj = node as Record<string, unknown>;

    for (const key of preferredKeys) {
      const txt = asUserText(obj[key]);
      if (txt) return txt;
    }

    if (depth >= maxDepth) continue;
    for (const v of Object.values(obj)) {
      if (v && typeof v === "object") queue.push({ node: v, depth: depth + 1 });
    }
  }

  return undefined;
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
    const innerPayload = (inner as Record<string, unknown>).payload;
    if (innerPayload && typeof innerPayload === "object") push(innerPayload);
    const innerDataPayload = (innerData as Record<string, unknown> | undefined)?.payload;
    if (innerDataPayload && typeof innerDataPayload === "object")
      push(innerDataPayload);
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

  let bestReason: string | undefined;
  let bestMessage: string | undefined;

  for (const layer of collectPayloadLayers(r)) {
    const fromNotify = resolveNotificationBlock(layer);
    if (fromNotify) return fromNotify;
  }

  for (const layer of collectPayloadLayers(r)) {
    const reasonCandidates: unknown[] = [
      layer.rejection_reason,
      layer.failure_reason,
      layer.reason,
      (layer as { rejected_reason?: unknown }).rejected_reason,
      (layer as { rejectionReason?: unknown }).rejectionReason,
    ];
    const messageCandidates: unknown[] = [
      layer.message,
      layer.error_message,
      layer.comment_text,
      layer.error,
    ];

    for (const c of reasonCandidates) {
      const t = asUserText(c);
      if (t) {
        bestReason = t;
        break;
      }
    }
    for (const c of messageCandidates) {
      const t = asUserText(c);
      if (t) {
        if (!bestMessage || (isGenericFailureText(bestMessage) && !isGenericFailureText(t))) {
          bestMessage = t;
        }
      }
    }

    // Last-resort deep search for nested reason-like keys.
    if (!bestReason) {
      const nestedReason = deepFindFirstText(layer, [
        "rejection_reason",
        "failure_reason",
        "reason",
        "rejected_reason",
        "rejectionReason",
      ]);
      if (nestedReason) bestReason = nestedReason;
    }
    if (!bestMessage) {
      const nestedMessage = deepFindFirstText(layer, [
        "message",
        "error_message",
        "comment_text",
        "error",
        "detail",
      ]);
      if (nestedMessage) bestMessage = nestedMessage;
    }
  }

  const rootReason = asUserText(r.rejection_reason ?? (r as { reason?: unknown }).reason);
  if (!bestReason && rootReason) bestReason = rootReason;

  const rootMessageCandidates: unknown[] = [r.message, r.error];
  for (const c of rootMessageCandidates) {
    const t = asUserText(c);
    if (!t) continue;
    if (!bestMessage || (isGenericFailureText(bestMessage) && !isGenericFailureText(t))) {
      bestMessage = t;
    }
  }

  return bestReason || bestMessage || undefined;
}
