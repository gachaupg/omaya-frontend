import type { AllTransactionItem } from "@/features/transactions/api";
import { normalizeExchangeSubType } from "@/lib/utils/exchangeTransactionDisplay";
import {
  getExchangeCryptoTicker,
  getExchangeFiatTicker,
  isChangeNowLabel,
  isFiatTicker,
  isStablecoinTicker,
} from "@/lib/utils/exchangeCurrencyDisplay";
import { formatP2pCryptoLabel } from "@/lib/utils/transactionFromTo";

export type DashboardTransactionAmountDisplay = {
  /** Crypto amount, or USD/USDT when asset is fiat (mirrors USD value column). */
  assetAmount: string | null;
  /** Fiat payout, e.g. "$25.50 USD" */
  usdValue: string | null;
};

export type DashboardTransactionAmountOptions = {
  /** USDT equivalent per transaction id (from commission-lookup; 1 USDT ≈ $1 USD). */
  transactionUsdValues?: Record<string, number>;
};

const parseAmount = (value: string | number | undefined | null): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
  return Number.isFinite(n) ? n : null;
};

const normalizeSymbol = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toUpperCase();

const isUsdtSymbol = (symbol: unknown): boolean =>
  normalizeSymbol(symbol) === "USDT";

const isUsdSymbol = (symbol: unknown): boolean =>
  normalizeSymbol(symbol) === "USD";

const isFiatLikeSymbol = (symbol: unknown): boolean =>
  isFiatTicker(normalizeSymbol(symbol));

/** USD / USDT: same numeric amount in asset + USD value columns. */
function fiatDualColumn(
  amount: number,
  symbol: "USD" | "USDT"
): DashboardTransactionAmountDisplay {
  return {
    assetAmount: formatTokenAmount(amount, symbol),
    usdValue: formatDashboardUsdValue(amount),
  };
}

function pickFiatDisplayAmount(
  symbol: string,
  ...candidates: Array<number | null | undefined>
): DashboardTransactionAmountDisplay | null {
  const qty = pickUsdAmount(...candidates);
  if (qty == null) return null;
  if (isUsdtSymbol(symbol)) return fiatDualColumn(qty, "USDT");
  if (isUsdSymbol(symbol)) return fiatDualColumn(qty, "USD");
  return null;
}

const formatTokenAmount = (amount: number, symbol: string): string => {
  const sym = normalizeSymbol(symbol) || "—";
  const decimals = isFiatLikeSymbol(sym) ? 2 : amount >= 1 ? 4 : 8;
  const trimmed = amount
    .toFixed(decimals)
    .replace(/\.?0+$/, "")
    .replace(/\.$/, "");
  return `${trimmed} ${sym}`.trim();
};

export const formatDashboardUsdValue = (amount: number): string => {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${formatted} USD`;
};

function pickUsdAmount(
  ...candidates: Array<number | null | undefined>
): number | null {
  for (const c of candidates) {
    if (c != null && c > 0) return c;
  }
  return null;
}

const isUsdPeggedSymbol = (symbol: string): boolean =>
  isUsdtSymbol(symbol) ||
  isUsdSymbol(symbol) ||
  isStablecoinTicker(normalizeSymbol(symbol)) ||
  // ChangeNOW legs are settled in USDT; the backend sometimes stores
  // "changenow" in the asset field of that leg.
  isChangeNowLabel(symbol);

/** Convert a non-USDT crypto qty to USD using API price or the USD/USDT leg. */
function resolveCryptoUsdAmount(
  cryptoAmount: number,
  cryptoSymbol: string,
  tx: AllTransactionItem,
  context?: { isDeposit?: boolean; isWithdrawal?: boolean },
  options?: DashboardTransactionAmountOptions
): number | null {
  if (isUsdPeggedSymbol(cryptoSymbol)) {
    return cryptoAmount;
  }

  const txUsdtEquivalent = options?.transactionUsdValues?.[tx.id];
  if (txUsdtEquivalent != null && txUsdtEquivalent > 0) {
    return txUsdtEquivalent;
  }

  const unitPrice = parseAmount(tx.price);
  if (unitPrice != null && unitPrice > 0) {
    return cryptoAmount * unitPrice;
  }

  const toAmount = parseAmount(tx.to_amount);
  const fromAmount = parseAmount(tx.amount);
  const toSym = normalizeSymbol(tx.to_asset || tx.to_currency);
  const fromSym = normalizeSymbol(tx.from_asset || tx.from_currency);

  if (context?.isDeposit && isUsdPeggedSymbol(toSym) && toAmount != null) {
    return toAmount;
  }
  if (context?.isWithdrawal && isUsdPeggedSymbol(fromSym) && fromAmount != null) {
    return fromAmount;
  }

  if (isUsdPeggedSymbol(toSym) && toAmount != null) {
    return toAmount;
  }
  if (isUsdPeggedSymbol(fromSym) && fromAmount != null) {
    return fromAmount;
  }

  return null;
}

function cryptoWithUsdColumn(
  cryptoAmount: number,
  cryptoSymbol: string,
  tx: AllTransactionItem,
  context?: { isDeposit?: boolean; isWithdrawal?: boolean },
  options?: DashboardTransactionAmountOptions
): DashboardTransactionAmountDisplay {
  if (isUsdtSymbol(cryptoSymbol)) {
    return fiatDualColumn(cryptoAmount, "USDT");
  }
  if (isUsdSymbol(cryptoSymbol)) {
    return fiatDualColumn(cryptoAmount, "USD");
  }
  if (isStablecoinTicker(cryptoSymbol)) {
    return {
      assetAmount: formatTokenAmount(cryptoAmount, cryptoSymbol),
      usdValue: formatDashboardUsdValue(cryptoAmount),
    };
  }

  const usd = resolveCryptoUsdAmount(
    cryptoAmount,
    cryptoSymbol,
    tx,
    context,
    options
  );
  return {
    assetAmount: formatTokenAmount(cryptoAmount, cryptoSymbol),
    usdValue: usd != null ? formatDashboardUsdValue(usd) : null,
  };
}

function exchangeAmounts(
  tx: AllTransactionItem,
  options?: DashboardTransactionAmountOptions
): DashboardTransactionAmountDisplay {
  const subType = normalizeExchangeSubType(tx.sub_type);
  const isDeposit = subType === "deposit";
  const isWithdrawal = subType === "withdrawal";

  const cryptoSymbol = getExchangeCryptoTicker(tx);
  const fiatSymbol = getExchangeFiatTicker(tx);
  const amount = parseAmount(tx.amount);
  const toAmount = parseAmount(tx.to_amount);
  const netAmount = parseAmount(tx.net_amount);

  const cryptoAmount = (() => {
    if (!cryptoSymbol) return null;
    if (isDeposit && amount != null) return amount;
    if (isWithdrawal && toAmount != null) return toAmount;
    if (amount != null && !isFiatTicker(normalizeSymbol(tx.currency || tx.asset))) {
      return amount;
    }
    if (toAmount != null) return toAmount;
    return amount;
  })();

  if (!cryptoSymbol) {
    if (fiatSymbol === "USDT") {
      const row = pickFiatDisplayAmount(
        "USDT",
        isDeposit ? amount : toAmount,
        netAmount,
        toAmount
      );
      if (row) return row;
    }
    if (fiatSymbol === "USD") {
      const row = pickFiatDisplayAmount(
        "USD",
        isDeposit ? amount : toAmount,
        netAmount,
        toAmount
      );
      if (row) return row;
    }
  }

  if (cryptoSymbol && cryptoAmount != null) {
    return cryptoWithUsdColumn(
      cryptoAmount,
      cryptoSymbol,
      tx,
      { isDeposit, isWithdrawal },
      options
    );
  }

  const usdAmount = pickUsdAmount(
    isDeposit ? toAmount : null,
    fiatSymbol === "USD" && isWithdrawal ? amount : null,
    fiatSymbol === "USD" && isWithdrawal ? toAmount : null,
    fiatSymbol === "USD" && !isDeposit ? netAmount : null
  );

  return {
    assetAmount: null,
    usdValue: usdAmount != null ? formatDashboardUsdValue(usdAmount) : null,
  };
}

function swapAmounts(
  tx: AllTransactionItem,
  options?: DashboardTransactionAmountOptions
): DashboardTransactionAmountDisplay {
  const fromSym = normalizeSymbol(
    tx.from_asset || tx.from_currency || tx.currency || tx.asset
  );
  const toSym = normalizeSymbol(tx.to_asset || tx.to_currency);
  const amount = parseAmount(tx.amount);
  const toAmount = parseAmount(tx.to_amount);
  const netAmount = parseAmount(tx.net_amount);

  const singleLegFiat = (sym: string, qty: number | null) => {
    if (qty == null) return null;
    if (isUsdtSymbol(sym)) return fiatDualColumn(qty, "USDT");
    if (isUsdSymbol(sym)) return fiatDualColumn(qty, "USD");
    return null;
  };

  if ((isUsdtSymbol(fromSym) || isUsdSymbol(fromSym)) && amount != null && !toSym) {
    const row = singleLegFiat(fromSym, amount);
    if (row) return row;
  }
  if ((isUsdtSymbol(toSym) || isUsdSymbol(toSym)) && toAmount != null && !fromSym) {
    const row = singleLegFiat(toSym, toAmount);
    if (row) return row;
  }
  if (
    (isUsdtSymbol(fromSym) || isUsdSymbol(fromSym)) &&
    (isUsdtSymbol(toSym) || isUsdSymbol(toSym))
  ) {
    const sym = isUsdtSymbol(fromSym) ? "USDT" : "USD";
    const row = pickFiatDisplayAmount(sym, amount, toAmount, netAmount);
    if (row) return row;
  }

  if (fromSym && !isFiatLikeSymbol(fromSym) && amount != null) {
    return cryptoWithUsdColumn(amount, fromSym, tx, undefined, options);
  }
  if (toSym && !isFiatLikeSymbol(toSym) && toAmount != null) {
    return cryptoWithUsdColumn(toAmount, toSym, tx, undefined, options);
  }

  const usdAmount = pickUsdAmount(
    netAmount,
    isUsdtSymbol(fromSym) ? amount : null,
    isUsdtSymbol(toSym) ? toAmount : null,
    isUsdSymbol(fromSym) ? amount : null,
    isUsdSymbol(toSym) ? toAmount : null,
    isFiatLikeSymbol(fromSym) && !isUsdtSymbol(fromSym) && !isUsdSymbol(fromSym)
      ? amount
      : null,
    isFiatLikeSymbol(toSym) && !isUsdtSymbol(toSym) && !isUsdSymbol(toSym)
      ? toAmount
      : null
  );

  return {
    assetAmount: null,
    usdValue: usdAmount != null ? formatDashboardUsdValue(usdAmount) : null,
  };
}

function simpleTokenAmounts(
  tx: AllTransactionItem,
  symbolOverride?: string,
  options?: DashboardTransactionAmountOptions
): DashboardTransactionAmountDisplay {
  const symbol = normalizeSymbol(
    symbolOverride ||
      tx.currency ||
      tx.asset ||
      tx.from_asset ||
      tx.to_asset
  );
  const amount = parseAmount(tx.amount);
  const toAmount = parseAmount(tx.to_amount);
  const netAmount = parseAmount(tx.net_amount);

  if (isUsdtSymbol(symbol) || isUsdSymbol(symbol)) {
    const row = pickFiatDisplayAmount(
      symbol,
      amount,
      netAmount,
      toAmount,
      isUsdtSymbol(tx.to_currency) || isUsdSymbol(tx.to_currency) ? toAmount : null
    );
    if (row) return row;
  }

  if (
    !symbol ||
    (isFiatLikeSymbol(symbol) && !isUsdtSymbol(symbol) && !isUsdSymbol(symbol))
  ) {
    const usd = pickUsdAmount(
      netAmount,
      isFiatLikeSymbol(symbol) && !isUsdtSymbol(symbol) && !isUsdSymbol(symbol)
        ? amount
        : null,
      isFiatLikeSymbol(tx.to_currency) &&
        !isUsdtSymbol(tx.to_currency) &&
        !isUsdSymbol(tx.to_currency)
        ? toAmount
        : null
    );
    return {
      assetAmount: null,
      usdValue: usd != null ? formatDashboardUsdValue(usd) : null,
    };
  }

  if (amount != null) {
    return cryptoWithUsdColumn(amount, symbol, tx, undefined, options);
  }

  return { assetAmount: null, usdValue: null };
}

/** Resolve asset + USD lines for dashboard Recent Transactions (all tabs). */
export function getDashboardTransactionAmounts(
  tx: AllTransactionItem,
  options?: DashboardTransactionAmountOptions
): DashboardTransactionAmountDisplay {
  if (tx.type === "exchange") {
    return exchangeAmounts(tx, options);
  }
  if (tx.type === "swap") {
    return swapAmounts(tx, options);
  }
  if (tx.type === "moneyx") {
    return simpleTokenAmounts(tx, "USD", options);
  }
  if (tx.type === "p2p") {
    const cryptoLabel = formatP2pCryptoLabel({
      currency: tx.currency,
      asset: tx.asset,
      network: tx.network,
      from_network: tx.from_network,
      to_network: tx.to_network,
    });
    const sym = normalizeSymbol(cryptoLabel.split("(")[0].trim() || tx.currency);
    return simpleTokenAmounts(tx, sym || undefined, options);
  }

  return simpleTokenAmounts(tx, undefined, options);
}
