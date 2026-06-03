/**
 * Express exchanging UI uses 4 steps: pending → confirming → exchanging → sending.
 * Backend may emit `processing` for deposits after `pending`; treat it as still pending.
 */

export function isExpressDepositTransaction(
  transactionType?: string | null,
  wsTransactionType?: string | null
): boolean {
  const fromTx = String(transactionType || "")
    .trim()
    .toLowerCase();
  const fromWs = String(wsTransactionType || "")
    .trim()
    .toLowerCase();
  return fromTx === "deposit" || fromWs === "deposit";
}

/** Map backend status to exchanging UI status (deposit `processing` → `pending`). */
export function mapExpressBackendStatusToUi(
  backendStatus: string,
  options?: {
    transactionType?: string | null;
    wsTransactionType?: string | null;
  }
): string {
  const status = String(backendStatus || "").trim().toLowerCase();
  if (
    status === "processing" &&
    isExpressDepositTransaction(
      options?.transactionType,
      options?.wsTransactionType
    )
  ) {
    return "pending";
  }
  return status;
}
