import type { AllTransactionItem } from "@/features/transactions/api";

const PROCESSING_STATUS_KEYS = new Set([
  "waiting",
  "admin waiting",
  "awaiting payment",
  "half matched",
  "matched",
  "processing",
  "admin approval required",
]);

function normalizeStatusKey(status: unknown): string {
  return String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ");
}

/** Lowercase label for badge tone logic and display normalization. */
export function resolveDashboardTransactionStatusLabel(status: unknown): string {
  const key = normalizeStatusKey(status);
  if (!key) return "n/a";

  if (PROCESSING_STATUS_KEYS.has(key)) return "processing";

  const map: Record<string, string> = {
    otp_pending: "otp pending",
    pending_address: "pending",
    pending_approval: "pending approval",
    admin_approval_required: "processing",
  };

  const underscored = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (map[underscored]) return map[underscored];

  return key;
}

/** Recent Transactions status — uppercase; in-progress states show as PROCESSING. */
export function formatDashboardTransactionStatus(status: unknown): string {
  return resolveDashboardTransactionStatusLabel(status).toUpperCase();
}

export type DashboardTransactionTypeSide = {
  typeLabel: string;
  sideLabel: string;
};

export function getDashboardTransactionTypeSide(
  tx: Pick<AllTransactionItem, "type" | "sub_type">
): DashboardTransactionTypeSide {
  if (tx.type === "moneyx") {
    return { typeLabel: "MONEY X", sideLabel: "MONEY X" };
  }

  const typeLabel = tx.type.toUpperCase();
  const sub = String(tx.sub_type || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ");

  let sideLabel = sub ? sub.toUpperCase() : typeLabel;

  if (tx.type === "exchange") {
    if (sub === "deposit") sideLabel = "DEPOSIT";
    else if (sub === "withdrawal") sideLabel = "WITHDRAWAL";
  } else if (tx.type === "p2p") {
    if (sub === "buy") sideLabel = "BUY";
    else if (sub === "sell") sideLabel = "SELL";
    else if (sub === "deposit") sideLabel = "DEPOSIT";
    else if (sub === "withdrawal") sideLabel = "WITHDRAWAL";
  } else if (tx.type === "swap") {
    sideLabel = sub ? sub.toUpperCase() : "SWAP";
  }

  return { typeLabel, sideLabel };
}
