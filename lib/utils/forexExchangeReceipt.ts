import { formatDateTimeEastAfrica } from "@/lib/globalFormatter";

export type ForexExchangeReceiptData = {
  from_amount?: string | number;
  from_currency?: string;
  to_amount?: string | number;
  to_currency?: string;
  exchange_rate?: string | number;
  transaction_reference?: string;
  transaction_id?: string;
  forex_transaction_id?: string;
  user_forex_account?: string;
  updated_at?: string;
  timestamp?: string;
};

function row(
  label: string,
  value: string | null | undefined
): [string, string] | null {
  const v = String(value ?? "").trim();
  if (!v) return null;
  return [label, v];
}

export function buildForexExchangeReceiptRows(
  data: ForexExchangeReceiptData
): Array<[string, string]> {
  const shouldHideExchangeRate =
    String(data.to_currency || "").toUpperCase() === "FXP" ||
    String(data.from_currency || "").toUpperCase() === "FXP";

  const reference =
    data.transaction_reference ||
    data.transaction_id ||
    data.forex_transaction_id ||
    "";

  const completedAt = data.updated_at || data.timestamp;
  const completedLabel = completedAt
    ? formatDateTimeEastAfrica(completedAt)
    : formatDateTimeEastAfrica(new Date());

  const rows: Array<[string, string] | null> = [
    row("Status", "Completed"),
    row(
      "Exchange",
      `${data.from_amount} ${data.from_currency} → ${data.to_amount} ${data.to_currency}`
    ),
    row("Reference number", reference),
    !shouldHideExchangeRate
      ? row(
          "Exchange rate",
          `1 ${data.from_currency} = ${data.exchange_rate} ${data.to_currency}`
        )
      : null,
    row("Forex account", data.user_forex_account),
    row("Completed at", completedLabel),
  ];

  return rows.filter((entry): entry is [string, string] => entry != null);
}
