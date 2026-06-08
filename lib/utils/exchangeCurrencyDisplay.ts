import type { AllTransactionItem } from "@/features/transactions/api";
import {
  extractExchangePaymentInfo,
  normalizeExchangeSubType,
} from "@/lib/utils/exchangeTransactionDisplay";

const FIAT_TICKERS = new Set([
  "USD",
  "USDT",
  "USDC",
  "BUSD",
  "DAI",
  "TUSD",
  "USDP",
  "FDUSD",
]);

/** Stablecoins sent/received as the on-chain leg of an exchange (not bank payout). */
const STABLECOIN_TICKERS = new Set([
  "USDT",
  "USDC",
  "BUSD",
  "DAI",
  "TUSD",
  "USDP",
  "FDUSD",
]);

const PAYMENT_NAME_PATTERN =
  /\b(bank|mobile|money|wallet|salaam|equity|hormuud|evc|zaad|premier|cooperative|transfer)\b/i;

const normalize = (v: unknown) => String(v ?? "").trim();

export const isFiatTicker = (symbol: string): boolean => {
  const s = normalize(symbol).toUpperCase();
  if (!s) return false;
  if (FIAT_TICKERS.has(s)) return true;
  return s.includes("USD");
};

export const isStablecoinTicker = (symbol: string): boolean =>
  STABLECOIN_TICKERS.has(normalize(symbol).toUpperCase());

/** Read provider fields that may be a string or `{ name, provider, ... }` from the API. */
export function resolveProviderDisplay(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return normalize(value);
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    return normalize(
      o.provider_name ?? o.name ?? o.provider ?? o.label ?? o.display_name
    );
  }
  return normalize(value);
}

/** Bank / mobile-money labels mistakenly stored in asset fields. */
export function isLikelyPaymentProviderName(value: unknown): boolean {
  const raw = normalize(value);
  if (!raw) return false;

  if (PAYMENT_NAME_PATTERN.test(raw)) return true;

  const firstToken = raw.split(/[\s(/\-]+/)[0]?.trim() ?? "";
  if (firstToken && firstToken.length <= 10 && /^[A-Z0-9]+$/i.test(firstToken)) {
    return false;
  }

  if (raw.includes(" ") && raw.length > 8) return true;
  if (raw.length > 14) return true;

  return false;
}

/** Parse a field into a short ticker (e.g. "USDT (BSC)" → "USDT"). */
export function parseExchangeTicker(value: unknown): string {
  const raw = normalize(value);
  if (!raw || isLikelyPaymentProviderName(raw)) return "";

  const beforeParen = raw.split("(")[0]?.trim() ?? raw;
  const token = (beforeParen.split(/[\s\-/]+/)[0] ?? "").toUpperCase();
  if (!token || token.length > 12) return "";
  if (!/^[A-Z0-9]+$/.test(token)) return "";
  return token;
}

/** Parse API asset slugs such as `usdt_bsc_0x55d398` → `USDT`. */
export function parseExchangeAssetSlug(value: unknown): string {
  const raw = normalize(value);
  if (!raw || isLikelyPaymentProviderName(raw)) return "";

  const fromTicker = parseExchangeTicker(raw);
  if (fromTicker) return fromTicker;

  const head = raw.split(/[_\-\s(/]+/)[0]?.trim().toUpperCase() ?? "";
  if (head.length >= 2 && head.length <= 12 && /^[A-Z0-9]+$/.test(head)) {
    return head;
  }
  return "";
}

function parseFieldTicker(value: unknown): string {
  return parseExchangeTicker(value) || parseExchangeAssetSlug(value);
}

/** Crypto the client sent (deposit) or receives (withdrawal). */
export function getExchangeCryptoTicker(tx: AllTransactionItem): string {
  const sub = normalizeExchangeSubType(tx.sub_type);
  const isDeposit = sub === "deposit";
  const isWithdrawal = sub === "withdrawal";

  const ordered = isDeposit
    ? [tx.currency, tx.asset, tx.from_currency, tx.from_asset]
    : isWithdrawal
      ? [tx.to_asset, tx.to_currency, tx.currency, tx.asset, tx.from_asset]
      : [
          tx.currency,
          tx.asset,
          tx.from_currency,
          tx.from_asset,
          tx.to_currency,
          tx.to_asset,
        ];

  for (const c of ordered) {
    if (isLikelyPaymentProviderName(c)) continue;
    const t = parseFieldTicker(c);
    if (!t) continue;
    if (isStablecoinTicker(t)) return t;
    if (!isFiatTicker(t)) return t;
  }
  return "";
}

/** Best ticker for the From column (crypto or fiat leg). */
export function getExchangeFromAssetTicker(tx: AllTransactionItem): string {
  const sub = normalizeExchangeSubType(tx.sub_type);
  const isDeposit = sub === "deposit";
  if (isDeposit) return "";

  const crypto = getExchangeCryptoTicker(tx);
  if (crypto) return crypto;

  const fiat = getExchangeFiatTicker(tx);
  if (fiat) return fiat;

  for (const c of [tx.from_asset, tx.from_currency, tx.currency, tx.asset]) {
    const t = parseFieldTicker(c);
    if (t) return t;
  }
  return "";
}

/** Best ticker for the To column (crypto destination on deposit). */
export function getExchangeToAssetTicker(tx: AllTransactionItem): string {
  const sub = normalizeExchangeSubType(tx.sub_type);
  const isWithdrawal = sub === "withdrawal";
  if (isWithdrawal) return "";

  const crypto = getExchangeCryptoTicker(tx);
  if (crypto) return crypto;

  const fiat = getExchangeFiatTicker(tx);
  if (fiat) return fiat;

  for (const c of [tx.to_asset, tx.to_currency, tx.currency, tx.asset]) {
    const t = parseFieldTicker(c);
    if (t) return t;
  }
  return "";
}

/** USD / USDT leg of an exchange (payout or pay-in). */
export function getExchangeFiatTicker(tx: AllTransactionItem): string {
  const sub = normalizeExchangeSubType(tx.sub_type);
  const isDeposit = sub === "deposit";
  const isWithdrawal = sub === "withdrawal";

  const ordered = isDeposit
    ? [tx.to_currency, tx.to_asset]
    : isWithdrawal
      ? [tx.from_currency, tx.from_asset]
      : [
          tx.to_currency,
          tx.to_asset,
          tx.from_currency,
          tx.from_asset,
          tx.currency,
          tx.asset,
        ];

  for (const c of ordered) {
    if (isLikelyPaymentProviderName(c)) continue;
    const t = parseFieldTicker(c);
    if (!t || !isFiatTicker(t) || isStablecoinTicker(t)) continue;
    return t;
  }

  if (isDeposit && normalize(tx.to_amount)) return "USD";
  return "";
}

/** Asset column: crypto ticker + network (never bank name). */
export function getExchangeAssetColumnLabels(tx: AllTransactionItem): {
  title: string;
  subtitle?: string;
} {
  const crypto = getExchangeCryptoTicker(tx);
  const fiat = getExchangeFiatTicker(tx);
  const network = normalize(tx.network || tx.asset_name)
    .replace(new RegExp(`^${crypto}$`, "i"), "")
    .trim();

  const title = crypto || fiat || "—";
  const subtitle =
    network && network.toUpperCase() !== title.toUpperCase()
      ? network.toUpperCase()
      : undefined;

  return subtitle ? { title, subtitle } : { title };
}

/** Payment provider label for from/to bank side (not conflated with currency). */
export function getExchangePaymentProviderLabel(
  tx: AllTransactionItem
): string {
  const info = extractExchangePaymentInfo(tx as unknown as Record<string, unknown>);
  const fromRaw = normalize(tx.from_asset);
  const toRaw = normalize(tx.to_asset);

  return (
    info.providerName ||
    info.methodLabel ||
    (info.paymentLabel !== "Bank / Payment" ? info.paymentLabel : "") ||
    resolveProviderDisplay(tx.sender_provider) ||
    resolveProviderDisplay(tx.receiver_provider) ||
    normalize(tx.payment_method?.provider) ||
    (isLikelyPaymentProviderName(fromRaw) ? fromRaw : "") ||
    (isLikelyPaymentProviderName(toRaw) ? toRaw : "") ||
    info.paymentLabel ||
    "Bank / Payment"
  );
}
