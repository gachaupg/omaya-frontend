import type { DashboardTransactionDetailView } from "@/components/dashboard/ui/DashboardTransactionDetailsModal";
import type { AllTransactionItem } from "@/features/transactions/api";
import type { TransactionType } from "@/features/p2p/types";
import { formatP2pCryptoLabel } from "@/lib/utils/transactionFromTo";
import { getNetworkDisplayName } from "@/lib/utils/networkDisplay";

const FIAT_LABEL = "Fiat (P2P)";

function getP2pTypeLabel(subType: string): string {
  const sub = subType.toLowerCase();
  if (sub === "buy") return "Buy";
  if (sub === "sell") return "Sell";
  return "P2P";
}

function resolveTradeNetwork(trade: Record<string, unknown>): string | null {
  const network =
    trade.network ??
    trade.network_name ??
    trade.from_network ??
    trade.to_network;
  const value = String(network ?? "").trim();
  return value || null;
}

export function userTradeToAllTransactionItem(
  row: TransactionType
): AllTransactionItem {
  const trade = (row.rawData ?? {}) as Record<string, unknown>;
  const subType =
    typeof row.type === "string" ? row.type.toLowerCase() : "p2p";
  const payment = Array.isArray(trade.payment_details)
    ? (trade.payment_details[0] as Record<string, unknown> | undefined)
    : undefined;
  const currency = String(
    trade.currency || row.assetSymbol || "USDT"
  ).trim();

  return {
    id: row.id,
    type: "p2p",
    sub_type: subType,
    amount: String(trade.amount ?? row.amount ?? ""),
    currency,
    asset: currency,
    asset_name: null,
    asset_image: null,
    network: resolveTradeNetwork(trade),
    status: String(row.status ?? trade.status ?? ""),
    commission: String(trade.commission_amount ?? row.commission ?? 0),
    net_amount: String(trade.net_amount ?? trade.amount ?? row.amount ?? ""),
    price: trade.price != null ? String(trade.price) : null,
    created_at: String(trade.timestamp ?? row.date ?? ""),
    updated_at: String(trade.timestamp ?? row.date ?? ""),
    deposit_address: null,
    withdrawal_address: null,
    transaction_hash: null,
    screenshot: null,
    reason: null,
    payment_method: payment
      ? {
          provider: String(payment.provider ?? ""),
          account_name: String(payment.account_name ?? ""),
          account_number: String(payment.account_number ?? ""),
        }
      : undefined,
  };
}

export function buildP2pTradeDetailView(
  row: TransactionType
): DashboardTransactionDetailView {
  const tx = userTradeToAllTransactionItem(row);
  const subType = tx.sub_type.toLowerCase();
  const cryptoLabel = formatP2pCryptoLabel(tx);
  const fromAsset =
    subType === "buy" ? FIAT_LABEL : cryptoLabel;
  const toAsset =
    subType === "buy" ? cryptoLabel : FIAT_LABEL;

  const assetTitle = String(tx.currency || tx.asset || "USDT").trim();
  const assetSubtitle = tx.network
    ? getNetworkDisplayName(tx.network)
    : undefined;

  return {
    tx,
    from: { label: fromAsset },
    to: { label: toAsset },
    assetTitle,
    assetSubtitle,
    typeLabel: getP2pTypeLabel(subType),
  };
}
