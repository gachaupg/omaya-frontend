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
const USSD_LIKE_PATTERN = /\*/;

const normalizeAmount = (amount: number | string): string => {
  const raw = typeof amount === "number" ? String(amount) : String(amount ?? "").trim();
  if (!raw) return "0";
  const parsed = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return raw;
  return Number.isInteger(parsed) ? String(parsed) : String(parsed);
};

const paymentDetailsNested = (pd: any) => pd?.payment_details?.[0];

const pickNonEmpty = (v: unknown): string =>
  v != null && String(v).trim() !== "" ? String(v).trim() : "";

/** Resolve raw `how_to_send` from a payment method / payment detail object. */
export const resolveHowToSendFromPaymentDetail = (pd: any): string => {
  if (!pd) return "";
  const n = paymentDetailsNested(pd);
  const admin = Array.isArray(pd?.admin_payment_details)
    ? pd.admin_payment_details[0]
    : null;
  return (
    pickNonEmpty(pd.how_to_send) ||
    pickNonEmpty(n?.how_to_send) ||
    pickNonEmpty(admin?.how_to_send) ||
    ""
  );
};

/** Resolve `how_to_send` from MoneyX transaction payload (from payment method first). */
export const resolveHowToSendFromTx = (tx: any): string => {
  const ordered = [
    tx?.fromPaymentMethod,
    tx?.paymentDetails?.[0],
    tx?.paymentDetail,
  ].filter(Boolean);
  for (const pd of ordered) {
    const value = resolveHowToSendFromPaymentDetail(pd);
    if (value) return value;
  }
  return "";
};

export const isEvmWalletHowToSend = (value: string): boolean =>
  /^0x[a-fA-F0-9]{40}$/i.test(String(value || "").trim());

/**
 * Formats MoneyX "how_to_send" codes with the real amount (express deposit parity).
 */
export const formatHowToSend = (
  code: string | null | undefined,
  amount: number | string | null | undefined
): string => {
  const base = String(code || "").trim();
  if (!base) return "";

  if (/^0x[a-fA-F0-9]{40}#?$/.test(base)) {
    return base.replace(/#$/, "");
  }

  const parsedAmt =
    typeof amount === "number"
      ? amount
      : amount != null && String(amount).trim() !== ""
        ? Number(String(amount))
        : NaN;
  const amt = Number.isFinite(parsedAmt) ? String(parsedAmt) : "";
  if (!amt) return base;

  if (AMOUNT_PLACEHOLDER_PATTERN.test(base)) {
    return base.replace(AMOUNT_PLACEHOLDER_PATTERN, amt);
  }
  if (!USSD_LIKE_PATTERN.test(base)) {
    return base;
  }
  if (TRAILING_USSD_AMOUNT_PATTERN.test(base)) {
    return base.replace(TRAILING_USSD_AMOUNT_PATTERN, `*${amt}#`);
  }
  if (base.endsWith("#")) {
    return base.slice(0, -1) + `*${amt}#`;
  }
  return base + `*${amt}#`;
};

// Backwards-compatible name used by older components.
export const replaceTrailingUssdAmount = formatHowToSend;

/** Formatted how-to-send for status UI; empty when missing or EVM-only wallet text. */
export const resolveFormattedHowToSendForTx = (
  tx: any,
  amount: number | string | null | undefined,
  bankFallback?: string | null
): string => {
  const raw =
    resolveHowToSendFromTx(tx) || pickNonEmpty(bankFallback);
  if (!raw) return "";
  const formatted = formatHowToSend(raw, amount);
  if (!formatted || isEvmWalletHowToSend(formatted)) return "";
  return formatted;
};

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
