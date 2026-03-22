/**
 * Normalize values bound to swap amount text inputs.
 * Persist/API sometimes store "0.0" / "0.00" which makes editing awkward;
 * pure-zero forms become "0" so users can clear and type freely.
 */
export function swapAmountToInputString(value: unknown): string {
  if (value == null) return "";
  const raw =
    typeof value === "number" && Number.isFinite(value)
      ? String(value)
      : String(value).trim();
  if (raw === "" || raw === ".") return raw;
  const n = parseFloat(raw);
  if (!Number.isFinite(n) || n !== 0) return raw;
  // Still zero but string has a significant digit (e.g. 0.05) — keep as-is
  if (/[1-9]/i.test(raw)) return raw;
  return "0";
}

/** True when persisted "You Send" should reset to default on load (not user-editing). */
export function isBadPersistedSwapSendAmount(value: unknown): boolean {
  if (value == null) return false;
  const str =
    typeof value === "number" && Number.isFinite(value)
      ? String(value)
      : String(value).trim();
  if (str === "") return false;
  const n = parseFloat(str);
  return (
    str === "0.0" ||
    /^0\.0+$/i.test(str) ||
    /^0+$/i.test(str) ||
    (Number.isFinite(n) && n === 0)
  );
}

/**
 * User entered a non-empty amount that is exactly zero (0, 0.0, -0, 000).
 * Not true while still typing a decimal (e.g. "0." → 0.5) or for empty field.
 */
export function isNonEmptyInvalidZeroSwapAmount(s: string): boolean {
  const t = String(s ?? "").trim();
  if (t === "" || t === ".") return false;
  if (t.endsWith(".")) return false;
  const n = parseFloat(t);
  if (!Number.isFinite(n) || n !== 0) return false;
  if (/[1-9]/i.test(t)) return false;
  return true;
}
