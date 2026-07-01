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

/** Receive currency on status UI; simple deposits USD; ChangeNow deposits use asset ticker. */
export function resolveExpressStatusReceiveCurrency(
  tx: any,
  liveNetCurrency?: string | null,
  wsFallback?: string
): string {
  const type = String(tx?.type ?? "").toLowerCase();
  if (type === "withdrawal") return "USD";
  if (type === "deposit" && isExpressChangeNowDeposit(tx)) {
    const live = String(liveNetCurrency ?? "")
      .trim()
      .toUpperCase();
    if (live && live !== "USD") return live;
    const ws = String(wsFallback ?? "")
      .trim()
      .toUpperCase();
    if (ws && ws !== "USD") return ws;
    return assetTicker(tx) || "USDT";
  }
  if (type === "deposit") return "USD";
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

  let inner = rootData;
  if (
    rootData.data &&
    typeof rootData.data === "object" &&
    !Array.isArray(rootData.data)
  ) {
    inner = rootData.data as Record<string, unknown>;
  }

  // Merge outer + inner so amount fields on either level are available.
  return { ...rootData, ...inner };
}

/**
 * Resolve the receive amount from express websocket status updates.
 * Withdrawals and deposits display fiat net in USD: prefer `net_amount`.
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
  if (type === "deposit") {
    return netAmount;
  }
  if (type === "withdrawal") {
    return netAmount ?? amountTo ?? estimatedAmount ?? expectedAmountTo;
  }

  return amountTo ?? netAmount ?? estimatedAmount ?? expectedAmountTo;
}

/** ChangeNow / estimate-API deposit: form "You Receive" is crypto, not USD net. */
export function isExpressChangeNowDeposit(tx: any): boolean {
  if (!tx || String(tx.type ?? "").toLowerCase() !== "deposit") return false;
  if (
    tx.changenowId ||
    tx.changenow_id ||
    tx.details?.changenow_id ||
    tx.asset?.is_changenow_asset === true
  ) {
    return true;
  }
  const paid = Number(tx.amount ?? tx.payAmount ?? 0);
  const recv = parseExpressSocketNumberish(tx.receiveAmount);
  if (paid >= 1 && recv != null && recv < Math.max(paid * 0.01, 0.01)) {
    return true;
  }
  return false;
}

/** Exchanging page deposit receive row: form amounts (crypto for ChangeNow, USD for simple). */
export function resolveExpressDepositExchangingReceiveDisplay(input: {
  transactionData?: any;
  liveNetAmount?: number | null;
  liveNetCurrency?: string | null;
  websocketData?: unknown;
}): ExpressStatusNetDisplay {
  const tx = input.transactionData ?? {};
  const wsPayload = unwrapExpressWsStatusPayload(input.websocketData);

  if (isExpressChangeNowDeposit(tx)) {
    const fromLive =
      input.liveNetAmount != null && input.liveNetAmount > 0
        ? input.liveNetAmount
        : null;
    const fromSocket =
      parseExpressSocketNumberish(wsPayload.amount_to) ??
      parseExpressSocketNumberish(wsPayload.estimated_amount) ??
      parseExpressSocketNumberish(wsPayload.amount_expected_to);
    const fromForm = parseExpressSocketNumberish(tx.receiveAmount);
    const amount = fromLive ?? fromSocket ?? fromForm ?? 0;
    let currency = String(input.liveNetCurrency ?? "")
      .trim()
      .toUpperCase();
    if (!currency || currency === "USD") {
      currency = assetTicker(tx) || "USDT";
    }
    return { amount, currency };
  }

  const amount = resolveExpressDepositStatusReceiveAmount({
    websocketData: input.websocketData,
    transactionData: tx,
    liveNetAmount: input.liveNetAmount,
  });
  return { amount, currency: "USD" };
}

/** USD net for simple deposits; crypto receive for ChangeNow (matches exchanging page). */
export function resolveExpressDepositSuccessProcessingAmount(
  tx: any,
  depositNetSnapshot?: number | null,
  liveNetAmount?: number | null
): number | null {
  if (isExpressChangeNowDeposit(tx)) {
    if (liveNetAmount != null && liveNetAmount > 0) return liveNetAmount;
    return parseExpressSocketNumberish(tx?.receiveAmount);
  }
  if (depositNetSnapshot != null && depositNetSnapshot > 0) {
    return depositNetSnapshot;
  }
  const fromFormUsd = parseExpressSocketNumberish(tx?.usdNetReceive);
  if (fromFormUsd != null) return fromFormUsd;
  return liveNetAmount != null && liveNetAmount > 0 ? liveNetAmount : null;
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
  if (type === "withdrawal" || type === "deposit") {
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

export type ExpressDepositStatusReceiveInput = {
  websocketData?: unknown;
  transactionData: {
    amount?: number;
    payAmount?: number;
    totalAmountDue?: number;
    receiveAmount?: unknown;
    netAmount?: unknown;
    net_amount?: unknown;
    expectedAmount?: unknown;
    usdNetReceive?: unknown;
    commission?: string | number | null;
    commissionAmount?: number | null;
  };
  liveNetAmount?: number | null;
  processingReceiveAmount?: number | null;
};

/** USD net receive computed on the deposit form (pay − commission). */
export function resolveExpressDepositFormUsdNetReceive(input: {
  payAmount: number;
  commission?: string | number | null;
  commissionAmount?: number | null;
  apiNetAmount?: unknown;
}): number {
  const paid = Number(input.payAmount);
  if (!Number.isFinite(paid) || paid <= 0) return 0;

  const comm = parseCommission(input.commission ?? input.commissionAmount);
  const fromApi = parseExpressSocketNumberish(input.apiNetAmount);
  if (fromApi != null && comm > 0 && fromApi < paid) return fromApi;
  if (fromApi != null && comm <= 0 && fromApi <= paid * 1.05) return fromApi;

  const derived = paid - comm;
  return Number.isFinite(derived) && derived > 0 ? derived : 0;
}

function depositPaidUsd(
  tx: {
    amount?: number;
    payAmount?: number;
    totalAmountDue?: number;
    net_amount?: unknown;
    usdNetReceive?: unknown;
    commission?: string | number | null;
    commissionAmount?: number | null;
  },
  wsPayload: Record<string, unknown>
): number {
  const candidates: unknown[] = [
    tx.amount,
    tx.payAmount,
    tx.totalAmountDue,
    wsPayload.amount,
    wsPayload.amount_from,
    wsPayload.amountFrom,
    wsPayload.amount_expected_from,
    wsPayload.paid_amount,
  ];
  for (const value of candidates) {
    const parsed = parseExpressSocketNumberish(value);
    if (parsed != null && parsed >= 0.01) return parsed;
  }
  return 0;
}

/** ChangeNow deposit "You Receive" is crypto; only treat amounts as USD when fiat-plausible. */
function isPlausibleUsdDepositNet(
  candidate: number,
  paidUsd: number,
  commission = 0
): boolean {
  if (!Number.isFinite(candidate) || candidate <= 0) return false;
  if (!Number.isFinite(paidUsd) || paidUsd <= 0) {
    return candidate >= 0.01;
  }
  if (commission > 0 && candidate >= paidUsd - 0.001) return false;
  const minRatio = Math.max(paidUsd * 0.01, 0.01);
  return candidate >= minRatio && candidate <= paidUsd * 1.05;
}

/** Deposit USD net only — never ChangeNow `amount_to` / crypto receive field. */
export function resolveExpressDepositUsdNetAmount(input: {
  wsPayload?: Record<string, unknown> | null;
  transactionData?: {
    amount?: number;
    payAmount?: number;
    totalAmountDue?: number;
    receiveAmount?: unknown;
    netAmount?: unknown;
    net_amount?: unknown;
    expectedAmount?: unknown;
    usdNetReceive?: unknown;
    commission?: string | number | null;
    commissionAmount?: number | null;
  };
  processingReceiveAmount?: number | null;
}): number {
  const tx = input.transactionData ?? {};
  const wsPayload = input.wsPayload ?? {};
  const paidUsd = depositPaidUsd(tx, wsPayload);
  const comm = parseCommission(
    tx.commission ??
      tx.commissionAmount ??
      (wsPayload.commission as string | number | null)
  );

  const tryCandidate = (value: unknown): number | null => {
    const parsed = parseExpressSocketNumberish(value);
    if (parsed == null) return null;
    return isPlausibleUsdDepositNet(parsed, paidUsd, comm) ? parsed : null;
  };

  const fromProcessing = tryCandidate(input.processingReceiveAmount);
  if (fromProcessing != null) return fromProcessing;

  const fromSocketNet =
    tryCandidate(wsPayload.net_amount) ?? tryCandidate(wsPayload.netAmount);
  if (fromSocketNet != null) return fromSocketNet;

  const fromFormUsdNet = tryCandidate(tx.usdNetReceive);
  if (fromFormUsdNet != null) return fromFormUsdNet;

  const fromTxNet =
    tryCandidate(tx.netAmount) ?? tryCandidate(tx.net_amount);
  if (fromTxNet != null) return fromTxNet;

  const fromExpected = tryCandidate(tx.expectedAmount);
  if (fromExpected != null) return fromExpected;

  const fromForm = tryCandidate(tx.receiveAmount);
  if (fromForm != null) return fromForm;

  const derived = paidUsd - comm;
  if (Number.isFinite(derived) && derived > 0) return derived;

  return resolveExpressDepositFormUsdNetReceive({
    payAmount: paidUsd,
    commission: tx.commission,
    commissionAmount: tx.commissionAmount,
    apiNetAmount: tx.netAmount ?? tx.net_amount,
  });
}

/** Deposit status/success: net receive in USD (socket net_amount, else form receiveAmount). */
export function resolveExpressDepositStatusReceiveAmount(
  input: ExpressDepositStatusReceiveInput
): number {
  const wsPayload = unwrapExpressWsStatusPayload(input.websocketData);
  return resolveExpressDepositUsdNetAmount({
    wsPayload,
    transactionData: input.transactionData,
    processingReceiveAmount:
      input.processingReceiveAmount ?? input.liveNetAmount,
  });
}

/** Home success page receive currency label. */
export function resolveHomeExpressSuccessReceiveCurrency(
  transactionType: string | undefined,
  toCurrency: string | undefined,
  tx?: any
): string {
  const type = String(transactionType ?? tx?.type ?? "").toLowerCase();
  if (type === "withdrawal") return "USD";
  if (type === "deposit" && isExpressChangeNowDeposit(tx)) {
    return assetTicker(tx) || String(toCurrency ?? "USDT").trim().toUpperCase() || "USDT";
  }
  if (type === "deposit") return "USD";
  return String(toCurrency ?? "USD").trim().toUpperCase() || "USD";
}

export type HomeDepositSuccessAmountInput = {
  wsPayload?: Record<string, unknown> | null;
  transactionData?: {
    amount?: number;
    receiveAmount?: unknown;
    netAmount?: unknown;
    net_amount?: unknown;
    commission?: string | number | null;
  };
  /** Net / you-receive amount shown on the processing (exchanging) page. */
  processingReceiveAmount?: number | null;
  receiveAmount?: unknown;
  paidAmount?: unknown;
  commission?: string | number | null;
};

function firstPositiveNumberish(...values: unknown[]): number | null {
  for (const value of values) {
    const parsed = parseExpressSocketNumberish(value);
    if (parsed != null) return parsed;
  }
  return null;
}

/** Deposit success: USD net receive from socket, tx payload, or processing page. */
export function resolveHomeDepositSuccessReceiveAmount(
  input: HomeDepositSuccessAmountInput
): number {
  return resolveExpressDepositUsdNetAmount({
    wsPayload: input.wsPayload ?? {},
    transactionData: input.transactionData,
    processingReceiveAmount: input.processingReceiveAmount,
  });
}

export type ExpressDepositSuccessDisplayInput = {
  websocketData?: unknown;
  transactionData: {
    amount?: number;
    receiveAmount?: unknown;
    netAmount?: unknown;
    net_amount?: unknown;
    commission?: string | number | null;
    currency?: string;
    asset?: {
      ticker?: string;
      symbol?: string;
      name?: string;
    };
    details?: {
      from_currency?: string;
      to_currency?: string;
    };
  };
  /** Net / you-receive amount from the processing (exchanging) page. */
  processingReceiveAmount?: number | null;
};

/** Asset/currency selected in the express form (deposit pay-in or withdrawal receive label). */
export function resolveExpressSelectedAssetCurrency(tx: {
  currency?: string;
  fromCurrency?: string;
  toCurrency?: string;
  asset?: { ticker?: string; symbol?: string; name?: string };
  details?: { from_currency?: string; to_currency?: string };
}): string {
  const toDetails = String(tx?.details?.to_currency ?? tx?.toCurrency ?? "")
    .trim()
    .toUpperCase();
  if (toDetails && toDetails !== "USD") return toDetails;

  const fromDetails = String(tx?.details?.from_currency ?? tx?.fromCurrency ?? "")
    .trim()
    .toUpperCase();
  if (fromDetails && fromDetails !== "USD") return fromDetails;

  const asset = assetTicker(tx);
  if (asset) return asset;

  const txCurrency = String(tx?.currency ?? "")
    .trim()
    .toUpperCase();
  if (txCurrency && txCurrency !== "USD") return txCurrency;

  return toDetails || fromDetails || txCurrency || "USDT";
}

/** @deprecated Use resolveExpressSelectedAssetCurrency */
export function resolveExpressDepositPaidCurrency(tx: {
  currency?: string;
  asset?: { ticker?: string; symbol?: string; name?: string };
  details?: { from_currency?: string; to_currency?: string };
}): string {
  return resolveExpressSelectedAssetCurrency(tx);
}

/** Deposit success: paid USD via bank; receive matches exchanging page (crypto or USD net). */
export function resolveExpressDepositSuccessDisplay(
  input: ExpressDepositSuccessDisplayInput
): {
  paidAmount: number;
  receiveAmount: number;
  paidCurrency: string;
  receiveCurrency: string;
} {
  const wsPayload = unwrapExpressWsStatusPayload(input.websocketData);
  const paidFromSocket = parseExpressSocketNumberish(wsPayload?.amount);
  const paidAmount =
    paidFromSocket ??
    parseExpressSocketNumberish(input.transactionData.amount) ??
    0;

  if (isExpressChangeNowDeposit(input.transactionData)) {
    const receiveDisplay = resolveExpressDepositExchangingReceiveDisplay({
      transactionData: input.transactionData,
      liveNetAmount: input.processingReceiveAmount,
      liveNetCurrency: assetTicker(input.transactionData),
      websocketData: input.websocketData,
    });
    return {
      paidAmount,
      receiveAmount: receiveDisplay.amount,
      paidCurrency: "USD",
      receiveCurrency: receiveDisplay.currency,
    };
  }

  const receiveAmount = resolveHomeDepositSuccessReceiveAmount({
    wsPayload,
    transactionData: input.transactionData,
    paidAmount,
    processingReceiveAmount: input.processingReceiveAmount,
  });

  return {
    paidAmount,
    receiveAmount,
    paidCurrency: "USD",
    receiveCurrency: "USD",
  };
}

export type ExpressWithdrawalSuccessDisplayInput = {
  websocketData?: unknown;
  transactionData: {
    amount?: number;
    receiveAmount?: unknown;
    netAmount?: unknown;
    net_amount?: unknown;
    commission?: string | number | null;
    currency?: string;
    asset?: {
      ticker?: string;
      symbol?: string;
      name?: string;
    };
    details?: {
      from_currency?: string;
      to_currency?: string;
      estimated_amount?: number;
    };
  };
  /** USD net from the processing (exchanging) page. */
  processingReceiveAmount?: number | null;
  /** Crypto send amount from the processing (exchanging) page. */
  processingSendAmount?: number | null;
};

/** Withdrawal success: You Paid USD (fiat net); You Received selected asset (crypto sent). */
export function resolveHomeWithdrawalSuccessPaidAmount(
  input: HomeDepositSuccessAmountInput
): number {
  const tx = input.transactionData ?? {};
  const wsPayload = input.wsPayload ?? {};

  const fromSocketNet = firstPositiveNumberish(
    wsPayload.net_amount,
    wsPayload.netAmount
  );
  if (fromSocketNet != null) return fromSocketNet;

  const fromProcessing = parseExpressSocketNumberish(
    input.processingReceiveAmount
  );
  if (fromProcessing != null) return fromProcessing;

  const fromTxNet = firstPositiveNumberish(tx.netAmount, tx.net_amount);
  if (fromTxNet != null) return fromTxNet;

  const fromForm = parseExpressSocketNumberish(
    input.receiveAmount ?? tx.receiveAmount
  );
  if (fromForm != null) return fromForm;

  const fromSocketReceive = resolveExpressSocketReceiveAmount(
    wsPayload as ExpressSocketReceiveFields,
    "withdrawal"
  );
  if (fromSocketReceive != null && fromSocketReceive > 0) {
    return fromSocketReceive;
  }

  const sent = Number(input.paidAmount ?? tx.amount ?? 0);
  const comm = parseCommission(input.commission ?? tx.commission);
  const derived = sent - comm;
  return Number.isFinite(derived) && derived > 0 ? derived : 0;
}

/** Crypto amount for withdrawal success (You Received / selected asset side). */
export function resolveHomeWithdrawalSuccessCryptoAmount(input: {
  wsPayload?: Record<string, unknown> | null;
  transactionData?: {
    amount?: number;
    details?: { estimated_amount?: number };
  };
  processingSendAmount?: number | null;
}): number {
  const tx = input.transactionData ?? {};
  const wsPayload = input.wsPayload ?? {};

  const fromSocket = firstPositiveNumberish(
    wsPayload.amount_from,
    wsPayload.amountFrom,
    wsPayload.amount
  );
  if (fromSocket != null) return fromSocket;

  const fromProcessing = parseExpressSocketNumberish(input.processingSendAmount);
  if (fromProcessing != null) return fromProcessing;

  const fromForm = parseExpressSocketNumberish(tx.amount);
  if (fromForm != null) return fromForm;

  const estimated = parseExpressSocketNumberish(tx.details?.estimated_amount);
  if (estimated != null) return estimated;

  return 0;
}

export function resolveExpressWithdrawalSuccessDisplay(
  input: ExpressWithdrawalSuccessDisplayInput
): {
  paidAmount: number;
  receiveAmount: number;
  paidCurrency: "USD";
  receiveCurrency: string;
} {
  const wsPayload = unwrapExpressWsStatusPayload(input.websocketData);
  const paidAmount = resolveHomeWithdrawalSuccessPaidAmount({
    wsPayload,
    transactionData: input.transactionData,
    processingReceiveAmount: input.processingReceiveAmount,
  });
  const receiveAmount = resolveHomeWithdrawalSuccessCryptoAmount({
    wsPayload,
    transactionData: input.transactionData,
    processingSendAmount: input.processingSendAmount,
  });

  return {
    paidAmount,
    receiveAmount,
    paidCurrency: "USD",
    receiveCurrency: resolveExpressSelectedAssetCurrency(input.transactionData),
  };
}
