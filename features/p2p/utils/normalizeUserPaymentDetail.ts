/** Normalize REST / WS user payment detail payloads into one shape for P2P UI. */
export type NormalizedUserPaymentDetail = {
  id: number | string;
  user_payment_detail_id?: string;
  payment_method_name: string;
  payment_provider_name: string;
  account_name: string;
  account_number: string;
  wallet_address?: string | null;
  provider_logo?: string | null;
  logo?: string;
  logo_url?: string;
  status?: string;
  rejection_reason?: string | null;
  rejectionReason?: string | null;
  reason?: string | null;
  comment?: string | null;
  note?: string | null;
  created_at?: string;
  updated_at?: string;
};

const coerceStatus = (raw: unknown): string => {
  if (typeof raw === "boolean") {
    return raw ? "approved" : "pending";
  }
  return String(raw ?? "").trim();
};

export function normalizeUserPaymentDetail(
  raw: Record<string, unknown> | null | undefined
): NormalizedUserPaymentDetail {
  const item = raw ?? {};
  const provider =
    item.provider && typeof item.provider === "object"
      ? (item.provider as Record<string, unknown>)
      : null;

  const id =
    item.id ??
    item.user_payment_detail_id ??
    item.payment_detail_id ??
    "";

  const status = coerceStatus(
    item.status ?? item.approval_status ?? item.approved ?? ""
  );

  return {
    id: typeof id === "number" || typeof id === "string" ? id : String(id),
    user_payment_detail_id:
      item.user_payment_detail_id != null
        ? String(item.user_payment_detail_id)
        : typeof id === "string"
          ? id
          : undefined,
    payment_method_name: String(
      item.payment_method_name ?? provider?.method ?? item.payment_method ?? ""
    ),
    payment_provider_name: String(
      item.payment_provider_name ??
        item.provider_name ??
        provider?.name ??
        item.provider ??
        ""
    ),
    account_name: String(item.account_name ?? ""),
    account_number: String(item.account_number ?? ""),
    wallet_address:
      item.wallet_address != null ? String(item.wallet_address) : null,
    provider_logo:
      (item.provider_logo as string | null | undefined) ??
      (provider?.logo as string | null | undefined) ??
      null,
    logo: item.logo as string | undefined,
    logo_url: item.logo_url as string | undefined,
    status,
    rejection_reason:
      (item.rejection_reason as string | null | undefined) ??
      (item.rejectionReason as string | null | undefined) ??
      null,
    rejectionReason: item.rejectionReason as string | null | undefined,
    reason: item.reason as string | null | undefined,
    comment: item.comment as string | null | undefined,
    note: item.note as string | null | undefined,
    created_at: item.created_at as string | undefined,
    updated_at: item.updated_at as string | undefined,
  };
}

export function normalizeUserPaymentDetails(
  payload: unknown
): NormalizedUserPaymentDetail[] {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    return payload.map((item) =>
      normalizeUserPaymentDetail(item as Record<string, unknown>)
    );
  }
  if (typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.results)) {
      return obj.results.map((item) =>
        normalizeUserPaymentDetail(item as Record<string, unknown>)
      );
    }
    if (Array.isArray(obj.data)) {
      return obj.data.map((item) =>
        normalizeUserPaymentDetail(item as Record<string, unknown>)
      );
    }
    return [normalizeUserPaymentDetail(obj)];
  }
  return [];
}

export function paymentDetailIdsMatch(
  a: number | string | undefined | null,
  b: number | string | undefined | null
): boolean {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}
