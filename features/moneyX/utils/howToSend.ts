import { get } from "@/lib/apiClient";
import { API_CONFIG } from "@/lib/appConfig";

type BankPaymentInfoResponse = {
  how_to_send?: string | null;
  data?: {
    how_to_send?: string | null;
  };
};

const TRAILING_USSD_AMOUNT_PATTERN = /\*[0-9]+(?:\.[0-9]+)?#\s*$/;
const AMOUNT_PLACEHOLDER_PATTERN = /\bamount\b/gi;

const normalizeAmount = (amount: number | string): string => {
  const raw = typeof amount === "number" ? String(amount) : String(amount ?? "").trim();
  if (!raw) return "0";
  const parsed = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return raw;
  return Number.isInteger(parsed) ? String(parsed) : String(parsed);
};

/**
 * Formats MoneyX "how_to_send" codes with the real amount:
 * - If code contains the word "Amount" (case-insensitive), replace it with the amount.
 * - Else if code ends with "*<number>#", replace the trailing number with the amount.
 * - Else inject "*{amount}#" at the end (before trailing "#", if present).
 */
export const formatHowToSend = (
  code: string | null | undefined,
  amount: number | string
): string | null => {
  if (!code || typeof code !== "string") return null;
  const trimmed = code.trim();
  if (!trimmed) return null;
  const amt = normalizeAmount(amount);

  if (AMOUNT_PLACEHOLDER_PATTERN.test(trimmed)) {
    return trimmed.replace(AMOUNT_PLACEHOLDER_PATTERN, amt);
  }
  if (TRAILING_USSD_AMOUNT_PATTERN.test(trimmed)) {
    return trimmed.replace(TRAILING_USSD_AMOUNT_PATTERN, `*${amt}#`);
  }
  if (trimmed.endsWith("#")) {
    return trimmed.slice(0, -1) + `*${amt}#`;
  }
  return trimmed + `*${amt}#`;
};

// Backwards-compatible name used by older components.
export const replaceTrailingUssdAmount = formatHowToSend;

export const fetchBankHowToSend = async (provider: string): Promise<string | null> => {
  const providerName = String(provider || "").trim();
  if (!providerName) return null;
  try {
    const response = await get<BankPaymentInfoResponse>(
      API_CONFIG.MONEYX.BANK_PAYMENT_INFO(providerName)
    );
    const payload = response?.data;
    return payload?.how_to_send || payload?.data?.how_to_send || null;
  } catch {
    return null;
  }
};
