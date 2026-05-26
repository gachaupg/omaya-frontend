import type { AllTransactionItem } from "@/features/transactions/api";
import { normalizeExchangeSubType } from "@/lib/utils/exchangeTransactionDisplay";
import {
  getExchangeCryptoTicker,
  getExchangeFiatTicker,
  isFiatTicker,
} from "@/lib/utils/exchangeCurrencyDisplay";
import { formatP2pCryptoLabel } from "@/lib/utils/transactionFromTo";

export type DashboardTransactionAmountDisplay = {
  /** Crypto amount, or USD/USDT when asset is fiat (mirrors USD value column). */
  assetAmount: string | null;
  /** Fiat payout, e.g. "$25.50 USD" */
  usdValue: string | null;
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

function exchangeAmounts(tx: AllTransactionItem): DashboardTransactionAmountDisplay {
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
        isDeposit ? toAmount : amount,
        toAmount,
        netAmount
      );
      if (row) return row;
    }
    if (fiatSymbol === "USD") {
      const row = pickFiatDisplayAmount(
        "USD",
        isDeposit ? toAmount : amount,
        toAmount,
        netAmount
      );
      if (row) return row;
    }
  }

  const usdAmount = pickUsdAmount(
    netAmount,
    fiatSymbol === "USDT" ? (isDeposit ? toAmount : amount) : null,
    fiatSymbol === "USDT" ? toAmount : null,
    fiatSymbol === "USD" ? (isDeposit ? toAmount : amount) : null,
    fiatSymbol === "USD" ? toAmount : null
  );

  return {
    assetAmount:
      cryptoSymbol && cryptoAmount != null
        ? formatTokenAmount(cryptoAmount, cryptoSymbol)
        : null,
    usdValue: usdAmount != null ? formatDashboardUsdValue(usdAmount) : null,
  };
}

function swapAmounts(tx: AllTransactionItem): DashboardTransactionAmountDisplay {
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

  let assetAmount: string | null = null;
  if (fromSym && !isFiatLikeSymbol(fromSym) && amount != null) {
    assetAmount = formatTokenAmount(amount, fromSym);
  } else if (toSym && !isFiatLikeSymbol(toSym) && toAmount != null) {
    assetAmount = formatTokenAmount(toAmount, toSym);
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
    assetAmount,
    usdValue: usdAmount != null ? formatDashboardUsdValue(usdAmount) : null,
  };
}

function simpleTokenAmounts(
  tx: AllTransactionItem,
  symbolOverride?: string
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
      netAmount,
      amount,
      toAmount,
      isUsdtSymbol(tx.to_currency) || isUsdSymbol(tx.to_currency) ? toAmount : null
    );
    if (row) return row;
  }

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

  if (
    !symbol ||
    (isFiatLikeSymbol(symbol) && !isUsdtSymbol(symbol) && !isUsdSymbol(symbol))
  ) {
    return {
      assetAmount: null,
      usdValue: usd != null ? formatDashboardUsdValue(usd) : null,
    };
  }

  return {
    assetAmount: amount != null ? formatTokenAmount(amount, symbol) : null,
    usdValue: usd != null ? formatDashboardUsdValue(usd) : null,
  };
}

/** Resolve asset + USD lines for dashboard Recent Transactions (all tabs). */
export function getDashboardTransactionAmounts(
  tx: AllTransactionItem
): DashboardTransactionAmountDisplay {
  if (tx.type === "exchange") {
    return exchangeAmounts(tx);
  }
  if (tx.type === "swap") {
    return swapAmounts(tx);
  }
  if (tx.type === "moneyx") {
    return simpleTokenAmounts(tx, "USD");
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
    return simpleTokenAmounts(tx, sym || undefined);
  }

  return simpleTokenAmounts(tx);
}
