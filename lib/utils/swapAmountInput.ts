import { stripLeadingZerosFromDecimalInput } from "@/lib/utils/decimalAmountInput";

const MAX_SWAP_AMOUNT_DECIMALS = 12;

/**
 * Parse amount strings for swap UI (supports decimals and scientific notation from APIs).
 */
export function parseSwapAmountNumber(value: string): number {
  const t = String(value ?? "")
    .trim()
    .replace(/,/g, "");
  if (t === "" || t === ".") return NaN;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

/** True when amount is a finite number strictly greater than zero. */
export function isPositiveSwapAmount(value: string): boolean {
  const n = parseSwapAmountNumber(value);
  return Number.isFinite(n) && n > 0;
}

/**
 * User is still typing a small decimal that starts with "0." (e.g. 0.000133).
 * Do not treat intermediate "0.0" / "0.00" as a final zero amount.
 */
export function isSwapAmountEntryInProgress(value: string): boolean {
  const t = String(value ?? "").trim();
  if (t === "" || t === ".") return true;
  if (t.endsWith(".")) return true;
  if (/^0\.0*$/i.test(t) && !/[1-9]/.test(t)) return true;
  return false;
}

/**
 * Normalize values bound to swap amount text inputs.
 */
export function normalizeSwapAmountOnChange(value: string): string {
  if (value === "" || value === ".") return value;
  return stripLeadingZerosFromDecimalInput(value);
}

function formatDecimalNoScientific(n: number, maxDecimals: number): string {
  if (n === 0) return "0";
  const abs = Math.abs(n);
  let decimals = maxDecimals;
  if (abs > 0 && abs < 1) {
    const needed = Math.ceil(-Math.log10(abs)) + 2;
    decimals = Math.min(maxDecimals, Math.max(needed, 4));
  }
  let s = n.toFixed(decimals);
  s = s.replace(/(\.\d*?[1-9])0+$/i, "$1").replace(/\.0+$/i, "");
  if (s === "" || s === "-0") return "0";
  return s;
}

/** Format API/estimate numbers for text inputs without scientific notation. */
export function formatSwapAmountForInput(
  value: unknown,
  maxDecimals: number = MAX_SWAP_AMOUNT_DECIMALS
): string {
  if (value == null) return "";

  if (typeof value === "string") {
    const raw = value.trim();
    if (raw === "" || raw === ".") return raw;
    const n = parseSwapAmountNumber(raw);
    if (!Number.isFinite(n)) return raw;
    if (n !== 0) return formatDecimalNoScientific(n, maxDecimals);
    if (/[1-9]/.test(raw)) return raw;
    return "0";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (value !== 0) return formatDecimalNoScientific(value, maxDecimals);
    return "0";
  }

  const raw = String(value).trim();
  if (raw === "") return "";
  const n = parseSwapAmountNumber(raw);
  if (!Number.isFinite(n)) return raw;
  if (n !== 0) return formatDecimalNoScientific(n, maxDecimals);
  if (/[1-9]/.test(raw)) return raw;
  return "0";
}

export function swapAmountToInputString(value: unknown): string {
  return formatSwapAmountForInput(value);
}

/** True when persisted "You Send" should reset to default on load (not user-editing). */
export function isBadPersistedSwapSendAmount(value: unknown): boolean {
  if (value == null) return false;
  const str =
    typeof value === "number" && Number.isFinite(value)
      ? formatSwapAmountForInput(value)
      : String(value).trim();
  if (str === "") return false;
  if (isSwapAmountEntryInProgress(str)) return false;
  return !isPositiveSwapAmount(str);
}

/**
 * User entered a non-empty amount that is exactly zero (0, 0.0, -0, 000).
 * Not true while still typing a decimal (e.g. "0." → 0.000133) or for positive fractions.
 */
export function isNonEmptyInvalidZeroSwapAmount(value: string): boolean {
  const t = String(value ?? "").trim();
  if (t === "" || t === ".") return false;
  if (isSwapAmountEntryInProgress(t)) return false;
  if (isPositiveSwapAmount(t)) return false;
  const n = parseSwapAmountNumber(t);
  if (!Number.isFinite(n)) return false;
  return n === 0;
}
