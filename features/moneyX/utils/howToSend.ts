import { get } from "@/lib/apiClient";
import { API_CONFIG } from "@/lib/appConfig";

type BankPaymentInfoResponse = {
  how_to_send?: string | null;
  data?: {
    how_to_send?: string | null;
  };
};

const TRAILING_USSD_AMOUNT_PATTERN = /\*[0-9]+(?:\.[0-9]+)?#\s*$/;

const normalizeAmount = (amount: number | string): string => {
  const raw = typeof amount === "number" ? String(amount) : String(amount ?? "").trim();
  if (!raw) return "0";
  const parsed = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return raw;
  return Number.isInteger(parsed) ? String(parsed) : String(parsed);
};

export const replaceTrailingUssdAmount = (
  code: string | null | undefined,
  amount: number | string
): string | null => {
  if (!code || typeof code !== "string") return null;
  const trimmed = code.trim();
  if (!trimmed) return null;
  if (!TRAILING_USSD_AMOUNT_PATTERN.test(trimmed)) return trimmed;
  return trimmed.replace(TRAILING_USSD_AMOUNT_PATTERN, `*${normalizeAmount(amount)}#`);
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
