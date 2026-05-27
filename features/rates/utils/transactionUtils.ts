import { formatRecentTransactionWhen } from "@/lib/globalFormatter";
import { normalizeExchangeSubType } from "@/lib/utils/exchangeTransactionDisplay";
import {
  getDefaultAssetIcon,
  getHighResAssetIcon,
} from "@/features/express/utils/imageHelpers";
import { Transaction } from "../types";

export const formatTransactionType = (type: string): string => {
  const typeMap: Record<string, string> = {
    deposit: "Deposit",
    withdrawal: "Withdrawal",
    p2p_buy: "P2P Buy",
    p2p_sell: "P2P Sell",
    swap: "Swap",
    exchange: "Exchange",
    moneyx: "MoneyX",
    forex: "Forex",
  };

  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

export const formatAmount = (amount: number | string, currency: string): string => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return `$${numAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/** OMAYA / rates transaction history “When” — relative if ≤7 days, else calendar date. */
export const formatTimeAgo = (timestamp: string): string =>
  formatRecentTransactionWhen(timestamp);

export const getCurrencyIcon = (currency: string): string => {
  const iconMap: Record<string, string> = {
    BTC: "₿",
    ETH: "Ξ",
    USDT: "₮",
    BNB: "BNB",
    ADA: "₳",
    DOT: "●",
    LINK: "🔗",
    LTC: "Ł",
    XRP: "✕",
  };

  return iconMap[currency] || currency;
};

export const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    approved: "text-[#1D8751]",
    pending: "text-yellow-500",
    rejected: "text-red-500",
    cancelled: "text-gray-500",
  };

  return statusMap[status] || "text-gray-500";
};

export const resolveHttpLogo = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("http") || trimmed.startsWith("/")) return trimmed;
  return null;
};

/** US flag for fiat USD in live transaction lists (not USDT). */
export const USD_FLAG_LOGO = "https://flagcdn.com/w80/us.png";

const FIAT_FLAG_LOGOS: Record<string, string> = {
  USD: USD_FLAG_LOGO,
  EUR: "https://flagcdn.com/w80/eu.png",
  GBP: "https://flagcdn.com/w80/gb.png",
  KES: "https://flagcdn.com/w80/ke.png",
};

export const withFiatCurrencyFlag = (
  currency: string,
  logo: string | null
): string | null => {
  if (logo) return logo;
  const code = currency.trim().toUpperCase();
  return FIAT_FLAG_LOGOS[code] ?? null;
};

const resolveKnownCurrencyLogo = (currency: string): string | null => {
  const code = currency.trim().toUpperCase();
  if (!code) return null;
  const icon = getHighResAssetIcon({ ticker: code });
  return icon && icon !== getDefaultAssetIcon() ? icon : null;
};

const resolveSystemTypeAndSubType = (
  merged: Record<string, unknown>
): { systemType: string; subType: string } => {
  const transactionType = pickStr(
    merged.transaction_type,
    merged.system_type
  ).toLowerCase();
  const legacyType = pickStr(merged.type).toLowerCase();
  const subTypeField = pickStr(merged.sub_type).toLowerCase();

  if (transactionType) {
    if (
      transactionType === "exchange" &&
      (legacyType === "buy" || legacyType === "sell")
    ) {
      return { systemType: "exchange", subType: subTypeField || legacyType };
    }
    return {
      systemType: transactionType,
      subType: subTypeField || legacyType,
    };
  }

  if (legacyType === "buy" || legacyType === "sell") {
    return { systemType: "exchange", subType: subTypeField || legacyType };
  }

  return { systemType: legacyType, subType: subTypeField };
};

const currencyMatches = (a: string, b: string) =>
  a.trim().toUpperCase() === b.trim().toUpperCase();

const INSTITUTION_LABEL_HINT =
  /bank|salaam|equity|hormuud|premier|dahabshiil|crypto|forex|mobile|merchant|money|transfer|evc|waafi|sahal|golis|fxprimus|fxp/i;

/** Hide client names, emails, wallets, and user avatars on public live feeds. */
export const isLikelyPersonalIdentifier = (label: string): boolean => {
  const s = label.trim();
  if (!s || /^user$/i.test(s) || /^unknown$/i.test(s)) return true;
  if (s.includes("@")) return true;
  const compact = s.replace(/\s/g, "");
  if (/^0x[a-f0-9]{8,}$/i.test(compact)) return true;
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,}$/.test(compact)) return true;
  if (/\btest\s*\d*\b/i.test(s) || /test\d+/i.test(s)) return true;
  if (/^[A-Z]{2,10}$/.test(s.replace(/[^A-Za-z]/g, "").toUpperCase()) && s.length <= 12) {
    return false;
  }
  if (INSTITUTION_LABEL_HINT.test(s)) return false;
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return true;
  return false;
};

const pickStr = (...values: unknown[]): string => {
  for (const value of values) {
    const s = String(value ?? "").trim();
    if (s && s !== "-" && s.toLowerCase() !== "null" && s.toLowerCase() !== "undefined") {
      return s;
    }
  }
  return "";
};

/** Flatten nested API shapes from `/trading_engine/all-system-transactions/`. */
export const flattenTransactionRaw = (
  raw: Record<string, unknown>
): Record<string, unknown> => {
  const details =
    raw.details && typeof raw.details === "object" && !Array.isArray(raw.details)
      ? (raw.details as Record<string, unknown>)
      : {};
  const paymentMethod =
    raw.payment_method && typeof raw.payment_method === "object"
      ? (raw.payment_method as Record<string, unknown>)
      : {};
  return { ...details, ...paymentMethod, ...raw };
};

export const formatLiveAssetLabel = (currency: string, network?: string): string => {
  const code = String(currency || "").trim().toUpperCase();
  if (!code) return "";
  const net = String(network || "").trim();
  if (net && !/\([^)]+\)/.test(code)) {
    return `${code} (${net.toUpperCase()})`;
  }
  return code;
};

const getPublicPaymentLabel = (tx: Transaction): string | null => {
  for (const candidate of [
    tx.payment_provider,
    tx.sender_provider,
    tx.receiver_provider,
    tx.to_provider,
    tx.from_provider,
  ]) {
    const value = String(candidate ?? "").trim();
    if (value && !isLikelyPersonalIdentifier(value)) {
      return value;
    }
  }
  return null;
};

const assetLogoForCurrency = (
  currency: string,
  tx: Transaction
): string | null => {
  const assetLogo = resolveHttpLogo(tx.asset_image);
  if (!assetLogo) return null;
  const primary = pickStr(tx.currency, tx.asset);
  const fromCur = pickStr(tx.from_currency, tx.from_asset);
  const toCur = pickStr(tx.to_currency, tx.to_asset);
  if (primary && currencyMatches(currency, primary)) return assetLogo;
  if (fromCur && currencyMatches(currency, fromCur)) return assetLogo;
  if (toCur && currencyMatches(currency, toCur)) return assetLogo;
  return null;
};

const resolveCurrencySideLogo = (
  currency: string,
  tx: Transaction,
  side: "from" | "to"
): string | null => {
  const fromCur = pickStr(tx.from_currency, tx.from_asset);
  const toCur = pickStr(tx.to_currency, tx.to_asset);
  const fromLogo = resolveHttpLogo(tx.from_asset_logo);
  const toLogo = resolveHttpLogo(tx.to_asset_logo);
  const code = currency.trim().toUpperCase();

  if (side === "from") {
    if (fromCur && code && currencyMatches(currency, fromCur) && fromLogo) {
      return fromLogo;
    }
    return (
      fromLogo ??
      resolveHttpLogo(tx.from_provider_logo) ??
      resolveHttpLogo(tx.sender_provider_logo) ??
      assetLogoForCurrency(currency, tx) ??
      (toCur && code && currencyMatches(currency, toCur) ? toLogo : null)
    );
  }

  if (toCur && code && currencyMatches(currency, toCur) && toLogo) {
    return toLogo;
  }
  return (
    toLogo ??
    resolveHttpLogo(tx.to_provider_logo) ??
    resolveHttpLogo(tx.receiver_provider_logo) ??
    assetLogoForCurrency(currency, tx) ??
    (fromCur && code && currencyMatches(currency, fromCur) ? fromLogo : null)
  );
};

const buildCurrencySide = (
  currency: string,
  tx: Transaction,
  side: "from" | "to",
  network?: string
): { name: string; logo: string | null } => {
  const code = currency.trim().toUpperCase() || "USD";
  const label = formatLiveAssetLabel(code, network);
  const logo =
    withFiatCurrencyFlag(code, resolveCurrencySideLogo(code, tx, side)) ??
    resolveKnownCurrencyLogo(code);
  return { name: label || code, logo };
};

const buildProviderSide = (
  label: string,
  logo: string | null
): { name: string; logo: string | null } => ({
  name: label.trim() || "—",
  logo: logo || null,
});

const resolveP2pFromToAssets = (tx: Transaction): { from: string; to: string } | null => {
  const sub = String(tx.sub_type ?? tx.transaction_type ?? "").toLowerCase();
  const fromAsset = pickStr(tx.from_currency, tx.from_asset);
  const toAsset = pickStr(tx.to_currency, tx.to_asset);
  const primary = pickStr(tx.currency, tx.asset, "USDT");

  if (fromAsset && toAsset) {
    return { from: fromAsset, to: toAsset };
  }
  if (sub.includes("buy")) {
    return { from: fromAsset || "USD", to: toAsset || primary };
  }
  if (sub.includes("sell")) {
    return { from: fromAsset || primary, to: toAsset || "USD" };
  }
  if (fromAsset || toAsset) {
    return {
      from: fromAsset || primary,
      to: toAsset || primary,
    };
  }
  return null;
};

const buildPublicExchangeFromTo = (
  tx: Transaction
): { from: { name: string; logo: string | null }; to: { name: string; logo: string | null } } => {
  const sub = normalizeExchangeSubType(tx.sub_type || tx.transaction_type);
  const isDeposit = sub === "deposit";
  const assetLabel = formatLiveAssetLabel(
    pickStr(tx.currency, tx.asset, tx.to_currency, tx.from_currency, "USDT"),
    pickStr(tx.network, tx.to_network, tx.from_network, "BSC")
  );
  const assetLogo = withFiatCurrencyFlag(
    pickStr(tx.currency, tx.asset, "USDT").toUpperCase(),
    resolveHttpLogo(tx.asset_image) ??
      resolveHttpLogo(tx.to_asset_logo) ??
      resolveHttpLogo(tx.from_asset_logo)
  );
  const payment = getPublicPaymentLabel(tx);
  const paymentLogo =
    resolveHttpLogo(tx.from_provider_logo) ??
    resolveHttpLogo(tx.to_provider_logo) ??
    resolveHttpLogo(tx.sender_provider_logo) ??
    resolveHttpLogo(tx.receiver_provider_logo);

  if (isDeposit) {
    return {
      from: buildProviderSide(payment ?? "Payment", payment ? paymentLogo : null),
      to: buildCurrencySide(
        pickStr(tx.currency, tx.asset, tx.to_currency, "USDT"),
        tx,
        "to",
        pickStr(tx.network, tx.to_network)
      ),
    };
  }

  return {
    from: buildCurrencySide(
      pickStr(tx.currency, tx.asset, tx.from_currency, "USDT"),
      tx,
      "from",
      pickStr(tx.network, tx.from_network)
    ),
    to: buildProviderSide(
      payment ?? assetLabel,
      payment ? paymentLogo : assetLogo
    ),
  };
};

/** Public live transactions: assets/payment methods only — no client PII. */
export const getTransactionFromTo = (
  tx: Transaction
): { from: { name: string; logo: string | null }; to: { name: string; logo: string | null } } => {
  const rawSystemType = String(
    tx.system_type ?? tx.transaction_type ?? ""
  )
    .trim()
    .toLowerCase();
  const systemType =
    rawSystemType === "buy" || rawSystemType === "sell"
      ? "exchange"
      : rawSystemType.startsWith("p2p_")
        ? "p2p"
        : rawSystemType;
  const subType = String(tx.sub_type ?? "").trim().toLowerCase();

  const fromCurrency = pickStr(tx.from_currency, tx.from_asset);
  const toCurrency = pickStr(tx.to_currency, tx.to_asset);
  const primaryCurrency = pickStr(tx.currency, tx.asset, "USD");

  if (fromCurrency && toCurrency) {
    return {
      from: buildCurrencySide(
        fromCurrency,
        tx,
        "from",
        pickStr(tx.from_network, tx.network)
      ),
      to: buildCurrencySide(toCurrency, tx, "to", pickStr(tx.to_network)),
    };
  }

  if (systemType === "swap" || systemType === "exchange") {
    if (fromCurrency || toCurrency) {
      return {
        from: buildCurrencySide(
          fromCurrency || primaryCurrency,
          tx,
          "from",
          pickStr(tx.from_network, tx.network)
        ),
        to: buildCurrencySide(
          toCurrency || primaryCurrency,
          tx,
          "to",
          pickStr(tx.to_network)
        ),
      };
    }
    if (systemType === "exchange") {
      return buildPublicExchangeFromTo(tx);
    }
    const single = formatLiveAssetLabel(primaryCurrency, pickStr(tx.network, tx.from_network));
    const logo = withFiatCurrencyFlag(
      primaryCurrency.toUpperCase(),
      resolveHttpLogo(tx.asset_image)
    );
    return {
      from: { name: single, logo },
      to: { name: single, logo },
    };
  }

  if (systemType === "p2p") {
    const p2pAssets = resolveP2pFromToAssets(tx);
    if (p2pAssets) {
      return {
        from: buildCurrencySide(p2pAssets.from, tx, "from", tx.from_network),
        to: buildCurrencySide(p2pAssets.to, tx, "to", tx.to_network),
      };
    }
  }

  if (systemType === "moneyx") {
    const sender = pickStr(tx.sender_provider, tx.from_provider, tx.payment_provider);
    const receiver = pickStr(
      tx.receiver_provider,
      tx.to_provider,
      getPublicPaymentLabel(tx)
    );
    const senderLogo =
      resolveHttpLogo(tx.sender_provider_logo) ??
      resolveHttpLogo(tx.from_provider_logo);
    const receiverLogo =
      resolveHttpLogo(tx.receiver_provider_logo) ??
      resolveHttpLogo(tx.to_provider_logo);
    if (sender || receiver) {
      return {
        from: buildProviderSide(
          sender || primaryCurrency,
          sender ? senderLogo : withFiatCurrencyFlag(primaryCurrency, resolveHttpLogo(tx.asset_image))
        ),
        to: buildProviderSide(receiver || primaryCurrency, receiver ? receiverLogo : null),
      };
    }
  }

  if (systemType === "forex") {
    const fromFx = pickStr(tx.from_currency, "FXP");
    const toFx = pickStr(tx.to_currency, "USD");
    return {
      from: buildCurrencySide(fromFx, tx, "from"),
      to: buildCurrencySide(toFx, tx, "to"),
    };
  }

  const assetName = primaryCurrency.toUpperCase() || "USD";
  const assetLogo = withFiatCurrencyFlag(
    assetName,
    resolveHttpLogo(tx.asset_image)
  );
  const publicPayment = getPublicPaymentLabel(tx);
  const paymentLogo =
    resolveHttpLogo(tx.from_provider_logo) ??
    resolveHttpLogo(tx.to_provider_logo) ??
    resolveHttpLogo(tx.sender_provider_logo) ??
    resolveHttpLogo(tx.receiver_provider_logo);

  const flowType = subType || systemType;

  if (flowType === "deposit" || flowType === "moneyx") {
    return {
      from: {
        name: publicPayment ?? assetName,
        logo: publicPayment ? paymentLogo : assetLogo,
      },
      to: { name: assetName, logo: assetLogo },
    };
  }

  if (flowType === "withdrawal") {
    return {
      from: { name: assetName, logo: assetLogo },
      to: {
        name: publicPayment ?? assetName,
        logo: publicPayment ? paymentLogo : assetLogo,
      },
    };
  }

  return {
    from: { name: assetName, logo: assetLogo },
    to: { name: assetName, logo: assetLogo },
  };
};

/** Normalize all-system-transactions API / WebSocket payload. */
export const normalizeSystemTransaction = (
  raw: Record<string, unknown>
): Transaction => {
  const merged = flattenTransactionRaw(raw);
  const { systemType, subType } = resolveSystemTypeAndSubType(merged);
  const id =
    pickStr(merged.transaction_id, merged.id) || `tx-${Date.now()}`;
  const amount = pickStr(merged.amount, merged.total_amount_due, "0");
  const total_amount_due = pickStr(merged.total_amount_due, merged.amount, amount);
  const timestamp = pickStr(
    merged.timestamp,
    merged.created_at,
    merged.updated_at,
    new Date().toISOString()
  );
  const currency = pickStr(merged.currency, merged.asset, "USD");
  const status = pickStr(merged.status, "completed");
  const asset_image = resolveHttpLogo(
    pickStr(merged.asset_image, merged.currency_image, merged.asset_logo)
  );
  const from_currency = pickStr(
    merged.from_currency,
    merged.from_asset,
    merged.sender_currency
  );
  const to_currency = pickStr(
    merged.to_currency,
    merged.to_asset,
    merged.receiver_currency
  );
  let from_asset_logo =
    resolveHttpLogo(merged.from_asset_logo as string) ??
    resolveHttpLogo(merged.from_asset_image as string) ??
    resolveHttpLogo(merged.from_currency_image as string);
  let to_asset_logo =
    resolveHttpLogo(merged.to_asset_logo as string) ??
    resolveHttpLogo(merged.to_asset_image as string) ??
    resolveHttpLogo(merged.to_currency_image as string);

  if (
    !from_asset_logo &&
    asset_image &&
    from_currency &&
    currencyMatches(from_currency, currency)
  ) {
    from_asset_logo = asset_image;
  }
  if (
    !to_asset_logo &&
    asset_image &&
    to_currency &&
    currencyMatches(to_currency, currency)
  ) {
    to_asset_logo = asset_image;
  }

  const user: Transaction["user"] = {
    id: 0,
    name: "User",
    email: "",
    photo: null,
  };
  const payment_provider = pickStr(
    merged.payment_provider,
    merged.payment_provider_name,
    merged.from_provider,
    merged.to_provider
  );

  return {
    transaction_type: systemType || subType || "transaction",
    transaction_id: id,
    user,
    amount,
    currency,
    asset_image,
    total_amount_due,
    payment_provider,
    status,
    stages: pickStr(merged.stages),
    timestamp,
    system_type: systemType || undefined,
    sub_type:
      subType && subType !== systemType ? subType : undefined,
    asset: pickStr(merged.asset) || undefined,
    network: pickStr(merged.network, merged.asset_network, merged.network_name) || undefined,
    from_network: pickStr(merged.from_network) || undefined,
    to_network: pickStr(merged.to_network) || undefined,
    from_asset: pickStr(merged.from_asset) || undefined,
    to_asset: pickStr(merged.to_asset) || undefined,
    from_currency: from_currency || undefined,
    to_currency: to_currency || undefined,
    from_asset_logo,
    to_asset_logo,
    from_provider: pickStr(merged.from_provider) || undefined,
    to_provider: pickStr(merged.to_provider) || undefined,
    sender_provider: pickStr(merged.sender_provider) || undefined,
    receiver_provider: pickStr(merged.receiver_provider) || undefined,
    from_provider_logo: resolveHttpLogo(merged.from_provider_logo as string),
    to_provider_logo: resolveHttpLogo(merged.to_provider_logo as string),
    sender_provider_logo: resolveHttpLogo(merged.sender_provider_logo as string),
    receiver_provider_logo: resolveHttpLogo(merged.receiver_provider_logo as string),
    photo: null,
  };
};
