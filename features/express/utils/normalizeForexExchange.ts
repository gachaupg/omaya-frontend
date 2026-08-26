import type { ForexExchangeResponse } from "../types/forex";

const REJECTION_PLACEHOLDER = "no reason provided";

function asTrimmedText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

/** Resolve admin rejection text from API / cache / websocket payloads. */
export function resolveForexRejectionReason(
  source:
    | Record<string, unknown>
    | ForexExchangeResponse
    | null
    | undefined
): string | null {
  if (!source) return null;

  const record = source as Record<string, unknown>;

  const candidates: unknown[] = [
    record.rejection_reason,
    record.rejectionReason,
    record.reject_reason,
    record.rejected_reason,
    record.admin_rejection_reason,
    record.reason,
    record.admin_notes,
    record.admin_note,
    record.notes,
    record.comment,
    record.comment_text,
    record.message,
  ];

  for (const candidate of candidates) {
    const text = asTrimmedText(candidate);
    if (!text || text.toLowerCase() === REJECTION_PLACEHOLDER) continue;
    return text;
  }

  return null;
}

export const forexExchangeMatchesId = (
  exchange:
    | {
        forex_transaction_id?: string;
        transaction_id?: string;
        id?: string;
      }
    | null
    | undefined,
  transactionId: string
): boolean => {
  if (!exchange || !transactionId) return false;
  const ids = [
    exchange.forex_transaction_id,
    exchange.transaction_id,
    exchange.id,
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
  return ids.includes(transactionId);
};

const EMPTY_REJECTION_FIELDS = [
  "rejection_reason",
  "rejectionReason",
  "reject_reason",
  "rejected_reason",
  "admin_rejection_reason",
] as const;

function omitEmptyRejectionFields(
  source: Record<string, unknown>
): Record<string, unknown> {
  const next = { ...source };
  for (const key of EMPTY_REJECTION_FIELDS) {
    if (key in next && !asTrimmedText(next[key])) {
      delete next[key];
    }
  }
  return next;
}

export const normalizeForexExchange = (
  payload: unknown,
  fallbackTransactionId?: string
): ForexExchangeResponse => {
  const source =
    payload && typeof payload === "object"
      ? (payload as Partial<ForexExchangeResponse> & Record<string, unknown>)
      : {};
  const sanitizedSource = omitEmptyRejectionFields(source);
  const resolvedId = String(
    sanitizedSource.forex_transaction_id ||
      sanitizedSource.transaction_id ||
      sanitizedSource.id ||
      fallbackTransactionId ||
      ""
  ).trim();

  const rejectionReason = resolveForexRejectionReason(sanitizedSource);

  return {
    ...(sanitizedSource as unknown as ForexExchangeResponse),
    forex_transaction_id: resolvedId,
    transaction_id: String(sanitizedSource.transaction_id || resolvedId || ""),
    ...(rejectionReason ? { rejection_reason: rejectionReason } : {}),
  };
};

export type ForexUiStep = "pending" | "processing" | "completed";

export const mapForexStatusToUiStep = (status: unknown): ForexUiStep => {
  const normalized = String(status ?? "").toLowerCase();
  if (["completed", "success", "finished", "complete"].includes(normalized)) {
    return "completed";
  }
  if (
    [
      "processing",
      "pending_review",
      "approved",
      "admin_approved",
      "in_progress",
      "processing_payment",
      "confirmed",
      "reviewing",
      "accepted",
    ].includes(normalized)
  ) {
    return "processing";
  }
  return "pending";
};
