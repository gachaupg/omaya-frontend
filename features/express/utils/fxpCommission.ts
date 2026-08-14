import type { CommissionLookupResponse } from "@/features/express/api";

/** Fallback rate when FXP commission API is unavailable (404 / zero amounts). */
export const FXP_FALLBACK_EXCHANGE_RATE = 1.06;

export function isValidFxpBackendAmount(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function parseFxpBackendAmount(
  raw: string | number | null | undefined
): number | null {
  const value = Number(raw);
  return isValidFxpBackendAmount(value) ? value : null;
}

export function buildFxpCommissionFallback(
  amount: number
): CommissionLookupResponse {
  const safe = Math.max(0, amount);
  return {
    commission_rate: "0",
    is_percentage: true,
    calculated_fee: "0",
    range_min: "0",
    range_max: "0",
    commission_mode: "percentage",
    fee: "0",
    from_amount: String(safe),
    to_amount: String(safe),
  };
}

export function resolveFxpForwardReceiveAmount(
  details: CommissionLookupResponse | null | undefined,
  payAmount: number,
  apiCommission: number | null = null
): number {
  const backendTo = parseFxpBackendAmount(details?.to_amount);
  if (backendTo != null) return backendTo;

  const fee = Number(details?.calculated_fee ?? details?.fee);
  if (Number.isFinite(fee) && fee >= 0 && payAmount > 0) {
    return Math.max(0, payAmount - fee);
  }

  const rate = Number(details?.commission_rate ?? apiCommission ?? 0);
  if (Number.isFinite(rate) && rate > 0 && rate < 100 && payAmount > 0) {
    return Math.max(0, payAmount * (1 - rate / 100));
  }

  return payAmount > 0 ? payAmount : 0;
}

export function resolveFxpReversePayAmount(
  details: CommissionLookupResponse | null | undefined,
  receiveAmount: number,
  apiCommission: number | null = null
): number {
  if (!Number.isFinite(receiveAmount)) return 0;

  const backendFrom = parseFxpBackendAmount(details?.from_amount);
  const backendTo = parseFxpBackendAmount(details?.to_amount);
  if (backendFrom != null && backendTo != null && receiveAmount > 0) {
    return receiveAmount * (backendFrom / backendTo);
  }
  if (backendFrom != null && receiveAmount > 0) {
    return backendFrom;
  }

  const fee = Number(details?.calculated_fee ?? details?.fee);
  if (Number.isFinite(fee) && fee >= 0) {
    return receiveAmount + fee;
  }

  const mode = (details?.commission_mode || "").toString().toLowerCase();
  const isPercentageFlag = details?.is_percentage;
  const treatAsFlatFee = mode === "flat_fee" || isPercentageFlag === false;
  if (treatAsFlatFee) {
    return receiveAmount;
  }

  const rate = Number(details?.commission_rate ?? apiCommission ?? 0);
  if (Number.isFinite(rate) && rate > 0 && rate < 100) {
    return receiveAmount / (1 - rate / 100);
  }

  return receiveAmount > 0 ? receiveAmount : 0;
}
