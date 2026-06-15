/** Fixed 8-decimal formatting for dashboard transaction receipts (e.g. 4.00000000). */
export function formatDashboardDetailAmount(
  amount: string | number | undefined | null
): string {
  if (amount === undefined || amount === null || amount === "") return "—";
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(numAmount)) return String(amount);
  return numAmount.toFixed(8);
}
