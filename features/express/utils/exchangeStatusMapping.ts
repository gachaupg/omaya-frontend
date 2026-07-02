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

/** Backend statuses that should open the express success page for withdrawals. */
export const EXPRESS_WITHDRAWAL_SUCCESS_STATUSES = new Set([
  "completed",
  "finished",
  "approved",
  "agent_approve",
]);

export function isExpressWithdrawalSuccessStatus(
  status: string | undefined | null
): boolean {
  const normalized = String(status ?? "").trim().toLowerCase();
  return EXPRESS_WITHDRAWAL_SUCCESS_STATUSES.has(normalized);
}

/** When the exchanging page should transition to the success screen. */
export function shouldNavigateExpressToSuccessPage(input: {
  status?: string;
  uiStatus: string;
  transactionType?: string | null;
}): boolean {
  const type = String(input.transactionType ?? "").trim().toLowerCase();
  const status = String(input.status ?? "").trim().toLowerCase();
  const uiStatus = String(input.uiStatus ?? "").trim().toLowerCase();

  if (type === "withdrawal") {
    return isExpressWithdrawalSuccessStatus(status) || uiStatus === "completed";
  }

  return uiStatus === "completed" || status === "completed";
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
