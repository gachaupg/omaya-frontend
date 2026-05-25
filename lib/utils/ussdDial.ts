/** USSD payment codes contain `*` (e.g. *799*account*amount#). */
export function isUssdDialable(code: string): boolean {
  const trimmed = String(code || "").trim();
  if (!trimmed || !/\*/.test(trimmed)) return false;
  if (/^0x[a-fA-F0-9]{40}$/i.test(trimmed)) return false;
  return true;
}

/** `tel:` link for mobile dialer — encode `#` so the full USSD string is pre-filled. */
export function toUssdTelHref(code: string): string {
  const trimmed = String(code || "").trim().replace(/\s/g, "");
  if (!trimmed) return "";
  return `tel:${trimmed.replace(/#/g, "%23")}`;
}

/** Raw string encoded inside QR images so scanners open the dialer for USSD. */
export function toQrScanPayload(value: string): string {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (isUssdDialable(trimmed)) {
    return toUssdTelHref(trimmed);
  }
  return trimmed;
}

/** URL-safe encoding for external QR image APIs (`data` query param). */
export function encodeQrScanData(value: string): string {
  return encodeURIComponent(toQrScanPayload(value));
}
