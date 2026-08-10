import type { CreateSwapResponse } from "../types";

/** Backend may return snake_case; normalize for UI + WebSocket. */
export function normalizeCreateSwapResponse(
  payload: Record<string, unknown> | CreateSwapResponse | null | undefined
): CreateSwapResponse | null {
  if (!payload || typeof payload !== "object") return null;

  const raw = payload as Record<string, unknown>;

  return {
    id: String(raw.id ?? raw.swap_id ?? raw.transaction_id ?? ""),
    payinAddress: String(raw.payinAddress ?? raw.payin_address ?? ""),
    payoutAddress: String(raw.payoutAddress ?? raw.payout_address ?? ""),
    fromCurrency: String(raw.fromCurrency ?? raw.from_currency ?? ""),
    toCurrency: String(raw.toCurrency ?? raw.to_currency ?? ""),
    fromNetwork: String(raw.fromNetwork ?? raw.from_network ?? ""),
    toNetwork: String(raw.toNetwork ?? raw.to_network ?? ""),
    fromAmount: Number(raw.fromAmount ?? raw.from_amount ?? 0),
    toAmount: Number(raw.toAmount ?? raw.to_amount ?? 0),
    directedAmount: Number(raw.directedAmount ?? raw.directed_amount ?? 0),
    flow: String(raw.flow ?? ""),
    type: String(raw.type ?? ""),
  };
}

export function resolveSwapId(
  response: CreateSwapResponse | Record<string, unknown> | null | undefined
): string {
  if (!response || typeof response !== "object") return "";
  const raw = response as Record<string, unknown>;
  return String(raw.id ?? raw.swap_id ?? raw.transaction_id ?? "");
}

export function resolvePayinAddress(
  response: CreateSwapResponse | Record<string, unknown> | null | undefined
): string {
  if (!response || typeof response !== "object") return "";
  const raw = response as Record<string, unknown>;
  return String(raw.payinAddress ?? raw.payin_address ?? "");
}
