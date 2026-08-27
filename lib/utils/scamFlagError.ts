/**
 * Shared scam-flag error copy and detection.
 * Reuse anywhere an API may return `scam_flag_confirmed` (or related) failures.
 *
 * MoneyX / exchange often return Django DEBUG HTML IntegrityError pages, e.g.:
 *   null value in column "scam_flag_confirmed" of relation "moneyx_moneyxtransaction"
 */

export const SCAM_FLAG_USER_MESSAGE =
  "Your account has been flagged and is on hold. You cannot create new transactions until this is resolved by an admin.";

export const SCAM_FLAG_BANNER_TITLE = "Account On Hold";

const LEGACY_SCAM_FLAG_USER_MESSAGE =
  "Your account has been flagged for suspected scam activity.";

function getResponseData(error: unknown): unknown {
  if (!error || typeof error !== "object") return undefined;
  const e = error as Record<string, unknown>;
  const response = e.response as Record<string, unknown> | undefined;
  if (response && "data" in response) return response.data;
  if ("data" in e) return e.data;
  return undefined;
}

function flattenErrorText(...sources: unknown[]): string {
  const parts: string[] = [];

  const push = (value: unknown, depth = 0) => {
    if (value == null || depth > 5) return;
    if (typeof value === "string") {
      parts.push(value);
      return;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      parts.push(String(value));
      return;
    }
    if (typeof value !== "object") return;

    if (value instanceof Error) {
      parts.push(value.name, value.message, String(value));
    }

    const responseData = getResponseData(value);
    if (responseData !== undefined && responseData !== value) {
      push(responseData, depth + 1);
    }

    if (Array.isArray(value)) {
      for (const item of value) push(item, depth + 1);
      return;
    }

    const obj = value as Record<string, unknown>;
    for (const [key, nested] of Object.entries(obj)) {
      parts.push(key);
      // Avoid re-walking huge axios internals beyond useful fields
      if (
        key === "config" ||
        key === "request" ||
        key === "headers" ||
        key === "__proto__"
      ) {
        continue;
      }
      push(nested, depth + 1);
    }
  };

  for (const source of sources) push(source);
  return parts.join("\n");
}

/** True when any error source mentions a scam-flag constraint / field. */
export function isScamFlagConfirmedError(...sources: unknown[]): boolean {
  const text = flattenErrorText(...sources);
  if (!text.trim()) return false;

  // Exact Django IntegrityError column / relation (MoneyX + exchange)
  if (text.includes("scam_flag_confirmed")) return true;
  if (/scam[_\s-]?flag/i.test(text)) return true;
  if (/flagged and is on hold/i.test(text)) return true;
  if (/cannot create new transactions until this is resolved/i.test(text)) {
    return true;
  }

  // P2P trade create — backend masks scam blocks as generic create / amount errors
  if (/failed to create trade\.?\s*please try again/i.test(text)) return true;
  if (/amount is required/i.test(text)) return true;

  // DRF field errors on amount (e.g. {"amount":["This field is required."]})
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    const rawData = getResponseData(source) ?? source;
    if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) continue;
    const data = rawData as Record<string, unknown>;
    const amountErr = data.amount;
    if (amountErr != null) {
      const amountText = Array.isArray(amountErr)
        ? amountErr.map(String).join(" ")
        : String(amountErr);
      if (/this field is required/i.test(amountText)) {
        return true;
      }
    }
  }

  if (
    /IntegrityError/i.test(text) &&
    (/moneyx_moneyxtransaction/i.test(text) ||
      /trading_engine_exchangetransaction/i.test(text))
  ) {
    return true;
  }

  return false;
}

/**
 * Returns the reusable user message when the error is a scam flag;
 * otherwise `null`.
 */
export function resolveScamFlagDisplayError(
  ...sources: unknown[]
): string | null {
  if (isScamFlagConfirmedError(...sources)) return SCAM_FLAG_USER_MESSAGE;
  for (const source of sources) {
    if (isScamFlagUserMessage(source)) return SCAM_FLAG_USER_MESSAGE;
  }
  return null;
}

/** True when a normalized/submitted error should show the on-hold banner. */
export function isScamFlagUserMessage(message: unknown): boolean {
  const text = String(message ?? "").trim();
  if (!text) return false;
  if (text === SCAM_FLAG_USER_MESSAGE || text === LEGACY_SCAM_FLAG_USER_MESSAGE) {
    return true;
  }
  return isScamFlagConfirmedError(text);
}

/**
 * If the error is a scam flag, return the shared user message.
 * Prefer showing {@link ScamFlagSubmitBanner} above submit — not a toast.
 */
export function showScamFlagToastIfNeeded(...sources: unknown[]): boolean {
  return isScamFlagConfirmedError(...sources);
}
