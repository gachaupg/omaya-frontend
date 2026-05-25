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

/** Home success page: USD for deposit/withdrawal receive + net rows. */
export function resolveHomeExpressSuccessReceiveCurrency(
  transactionType: string | undefined,
  toCurrency: string | undefined
): string {
  const type = String(transactionType ?? "").toLowerCase();
  if (type === "deposit" || type === "withdrawal") {
    return "USD";
  }
  return String(toCurrency ?? "USD").trim().toUpperCase() || "USD";
}
