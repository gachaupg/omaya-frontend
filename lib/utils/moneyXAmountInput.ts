/**
 * MoneyX "You Send" / amount hard limits — caps input digit count and parsed value
 * to avoid oversized payloads and database overflow.
 */

/** Total count of digit characters (0–9) allowed in one amount field (incl. fractional). */
export const MONEYX_MAX_AMOUNT_INPUT_DIGITS = 12;

/**
 * Maximum parsed send/receive amount (USD). Matches a 12-digit integer ceiling
 * (e.g. 999_999_999_999) so it stays consistent with {@link MONEYX_MAX_AMOUNT_INPUT_DIGITS}.
 */
export const MONEYX_MAX_SEND_AMOUNT_VALUE = 999_999_999_999;

const MAX_SEND_ERR =
  "Amount cannot exceed $999,999,999,999. Please enter a smaller amount.";

/**
 * Validates decimal shape, applies digit limit. Empty string → ok with `v: ""`.
 * Invalid pattern → `ok: false` (caller ignores keystroke).
 */
export function prepareMoneyXAmountFieldValue(
  value: string,
  maxDecimalPlaces = 8
):
  | { ok: true; v: string }
  | { ok: false; error?: string; invalidPattern?: true } {
  if (value === "") return { ok: true, v: "" };
  if (!/^\d*\.?\d*$/.test(value)) return { ok: false, invalidPattern: true };
  const v = enforceMoneyXAmountDigitLimit(value);
  if (v.includes(".")) {
    const decimalPart = v.split(".")[1];
    if (decimalPart && decimalPart.length > maxDecimalPlaces) {
      return {
        ok: false,
        error: `Number cannot have more than ${maxDecimalPlaces} decimal places.`,
      };
    }
  }
  return { ok: true, v };
}

/** Keeps only digits and at most one `.`; drops excess digits after {@link MONEYX_MAX_AMOUNT_INPUT_DIGITS}. */
export function enforceMoneyXAmountDigitLimit(
  raw: string,
  maxDigits: number = MONEYX_MAX_AMOUNT_INPUT_DIGITS
): string {
  let out = "";
  let digitCount = 0;
  let dotSeen = false;
  for (const ch of raw) {
    if (ch === "." && !dotSeen) {
      dotSeen = true;
      out += ".";
      continue;
    }
    if (/\d/.test(ch)) {
      if (digitCount >= maxDigits) continue;
      out += ch;
      digitCount++;
    }
  }
  return out;
}

export function clampMoneyXAmountNumber(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, MONEYX_MAX_SEND_AMOUNT_VALUE);
}

/**
 * Display string for a clamped numeric amount (avoids scientific notation; respects digit cap).
 */
export function toMoneyXClampedInputString(n: number): string {
  const c = clampMoneyXAmountNumber(n);
  if (!Number.isFinite(c) || c === 0) return "0";
  let s = c.toFixed(8);
  s = s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  return enforceMoneyXAmountDigitLimit(s);
}

export function isMoneyXAmountOverHardLimit(n: number): boolean {
  return Number.isFinite(n) && n > MONEYX_MAX_SEND_AMOUNT_VALUE;
}

export function getMoneyXMaxAmountErrorMessage(): string {
  return MAX_SEND_ERR;
}

/**
 * Clamp persisted/restored raw input for MoneyX amount fields.
 */
export function normalizeMoneyXAmountInputForRestore(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  if (/^0+(\.0+)?$/.test(s)) return "";
  let v = enforceMoneyXAmountDigitLimit(s);
  const parsed = parseFloat(v) || 0;
  const clamped = clampMoneyXAmountNumber(parsed);
  if (clamped !== parsed) {
    v = toMoneyXClampedInputString(clamped);
  }
  return v;
}
