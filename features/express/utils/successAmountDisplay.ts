const assetTicker = (tx: any): string =>
  String(
    tx?.asset?.ticker || tx?.asset?.symbol || tx?.asset?.name || ""
  )
    .trim()
    .toUpperCase();

/** Fiat/crypto the user sends on the express status page. */
export function resolveExpressSendCurrency(
  tx: any,
  wsFallback?: string
): string {
  const type = String(tx?.type ?? "").toLowerCase();
  if (type === "deposit") return "USD";

  const fromDetails = String(tx?.details?.from_currency ?? "")
    .trim()
    .toUpperCase();
  const ws = String(wsFallback ?? "")
    .trim()
    .toUpperCase();
  if (fromDetails) return fromDetails;
  if (ws) return ws;
  if (type === "withdrawal") return assetTicker(tx) || "USDT";
  return assetTicker(tx) || "USD";
}

/** Send currency on status UI; deposits always USD (ignores socket asset ticker). */
export function resolveExpressStatusSendCurrency(
  tx: any,
  liveCurrency?: string | null,
  wsFallback?: string
): string {
  if (String(tx?.type ?? "").toLowerCase() === "deposit") return "USD";
  const live = String(liveCurrency ?? "")
    .trim()
    .toUpperCase();
  if (live) return live;
  return resolveExpressSendCurrency(tx, wsFallback);
}

/** Fiat/crypto the user receives on the express status page. */
export function resolveExpressReceiveCurrency(
  tx: any,
  wsFallback?: string
): string {
  const type = String(tx?.type ?? "").toLowerCase();
  if (type === "withdrawal") return "USD";

  const toDetails = String(tx?.details?.to_currency ?? "")
    .trim()
    .toUpperCase();
  const ws = String(wsFallback ?? "")
    .trim()
    .toUpperCase();
  if (toDetails) return toDetails;
  if (ws) return ws;
  if (type === "deposit") return assetTicker(tx) || "USDT";
  return assetTicker(tx) || "USD";
}

/** Receive currency on status UI; withdrawals always USD (ignores socket crypto ticker). */
export function resolveExpressStatusReceiveCurrency(
  tx: any,
  liveNetCurrency?: string | null,
  wsFallback?: string
): string {
  if (String(tx?.type ?? "").toLowerCase() === "withdrawal") return "USD";
  const live = String(liveNetCurrency ?? "")
    .trim()
    .toUpperCase();
  if (live) return live;
  return resolveExpressReceiveCurrency(tx, wsFallback);
}

export type ExpressStatusNetDisplayInput = {
  transactionType?: string;
  paidAmount?: number;
  commission?: string | number | null;
  socketNetAmount?: number;
  liveNetCurrency?: string | null;
  payinMethod?: string;
  payoutMethod?: string;
  toCurrency?: string;
  /** Home express status/success: label net receive amount as USD, not crypto ticker */
  preferFiatUsd?: boolean;
};

export type ExpressStatusNetDisplay = {
  amount: number;
  currency: string;
};

function parseCommission(value: string | number | null | undefined): number {
  if (value == null || value === "") return 0;
  const parsed =
    typeof value === "number" ? value : parseFloat(String(value).trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseExpressSocketNumberish(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed =
    typeof value === "number" ? value : parseFloat(String(value).trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export type ExpressSocketReceiveFields = {
  net_amount?: unknown;
  amount_to?: unknown;
  estimated_amount?: unknown;
  amount_expected_to?: unknown;
};

/** Unwrap status_update payload from express websocket messages. */
export function unwrapExpressWsStatusPayload(
  message: unknown
): Record<string, unknown> {
  if (!message || typeof message !== "object") return {};
  const root = message as Record<string, unknown>;
  const rootData =
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : {};

  if (
    root.type === "status_update" &&
    rootData.data &&
    typeof rootData.data === "object" &&
    !Array.isArray(rootData.data)
  ) {
    return rootData.data as Record<string, unknown>;
  }

  return rootData;
}

/**
 * Resolve the receive amount from express websocket status updates.
 * Withdrawals pay out fiat: prefer `net_amount` (after commission).
 * Deposits receive crypto: prefer `amount_to` (swap output).
 */
export function resolveExpressSocketReceiveAmount(
  wsData: ExpressSocketReceiveFields | null | undefined,
  transactionType?: string
): number | null {
  if (!wsData) return null;

  const netAmount = parseExpressSocketNumberish(wsData.net_amount);
  const amountTo = parseExpressSocketNumberish(wsData.amount_to);
  const estimatedAmount = parseExpressSocketNumberish(wsData.estimated_amount);
  const expectedAmountTo = parseExpressSocketNumberish(wsData.amount_expected_to);

  const type = String(transactionType ?? "").toLowerCase();
  if (type === "withdrawal") {
    return netAmount ?? amountTo ?? estimatedAmount ?? expectedAmountTo;
  }

  return amountTo ?? netAmount ?? estimatedAmount ?? expectedAmountTo;
}

/** Resolves amount + currency for status / exchanging "net receive" rows. */
export function resolveExpressStatusNetDisplay(
  input: ExpressStatusNetDisplayInput
): ExpressStatusNetDisplay {
  const paid = Number(input.paidAmount ?? 0);
  const commission = parseCommission(input.commission);

  let amount = Number(input.socketNetAmount ?? NaN);
  if (!Number.isFinite(amount) || amount <= 0) {
    amount = Math.max(0, paid - commission);
  }

  const type = String(input.transactionType ?? "").toLowerCase();
  if (type === "withdrawal") {
    return { amount, currency: "USD" };
  }

  const live = String(input.liveNetCurrency ?? "")
    .trim()
    .toUpperCase();
  const to = String(input.toCurrency ?? "")
    .trim()
    .toUpperCase();

  let currency = live || to || "USD";
  if (input.preferFiatUsd) {
    currency = "USD";
  }

  return { amount, currency };
}

/** Home success page receive currency label. */
export function resolveHomeExpressSuccessReceiveCurrency(
  transactionType: string | undefined,
  toCurrency: string | undefined,
  tx?: any
): string {
  if (tx) {
    return resolveExpressReceiveCurrency(tx, toCurrency);
  }
  const type = String(transactionType ?? "").toLowerCase();
  if (type === "withdrawal") return "USD";
  if (type === "deposit") {
    return String(toCurrency ?? "USDT").trim().toUpperCase() || "USDT";
  }
  return String(toCurrency ?? "USD").trim().toUpperCase() || "USD";
}
