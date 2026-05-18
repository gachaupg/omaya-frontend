/** Payment provider / wallet fields for dashboard exchange transaction rows */

export type ExchangePaymentInfo = {
  displayImage: string | null;
  providerName: string | null;
  methodLabel: string | null;
  /** Best user-facing payment label (provider + method fallbacks) */
  paymentLabel: string;
  assetSymbol: string;
  assetNetwork: string;
  walletAddress: string | null;
  subType: "deposit" | "withdrawal" | string;
};

export function normalizeExchangeSubType(value: unknown): string {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "withdraw" || v === "withdrwal") return "withdrawal";
  return v;
}

const isUUID = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const isLikelyTechnicalId = (value: string): boolean => {
  if (isUUID(value)) return true;
  if (/^(tx_|trade_|order_|msg_)/i.test(value)) return true;
  if (/^[a-f0-9]{24,}$/i.test(value)) return true;
  if (/^\d{8,}$/.test(value)) return true;
  return false;
};

const sanitizeValue = (
  value: string | null | undefined,
  txContext?: Record<string, unknown>
): string | null => {
  if (!value) return null;
  const v = String(value).trim();
  if (!v || v === "undefined" || v === "null") return null;
  if (isLikelyTechnicalId(v)) return null;
  const knownIds = [
    txContext?.transaction_id,
    txContext?.id,
    txContext?.trade_id,
    txContext?.order_id,
  ]
    .map((x) => String(x ?? "").trim())
    .filter(Boolean);
  if (knownIds.includes(v)) return null;
  return v;
};

const parseAdditionalInfo = (raw: unknown): Record<string, unknown> | null => {
  if (!raw) return null;
  if (typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    try {
      const normalized = text
        .replace(/([{,]\s*)'([^']+?)'\s*:/g, '$1"$2":')
        .replace(/:\s*'([^']*?)'(\s*[,}])/g, ': "$1"$2');
      return JSON.parse(normalized);
    } catch {
      return null;
    }
  }
};

/** Same provider / wallet resolution as the Exchange tab (single source of truth). */
export function extractExchangePaymentInfo(
  tx: Record<string, unknown>
): ExchangePaymentInfo {
  const paymentDetails = Array.isArray(tx?.payment_details)
    ? (tx.payment_details as Array<Record<string, unknown>>)
    : [];

  const detailWithLogo =
    paymentDetails.find((detail) => detail?.provider_logo || detail?.logo) ||
    paymentDetails[0];

  const displayImage =
    String(detailWithLogo?.provider_logo || detailWithLogo?.logo || "").trim() ||
    String(tx?.provider_logo || "").trim() ||
    String(
      (tx as { payment_method?: { logo_url?: string } })?.payment_method?.logo_url || ""
    ).trim() ||
    null;

  const rawProviderName =
    detailWithLogo?.provider_name ||
    detailWithLogo?.provider ||
    tx?.payment_provider ||
    tx?.payment_provider_display ||
    tx?.sender_provider ||
    tx?.receiver_provider ||
    (tx as { payment_method?: { provider?: string } })?.payment_method?.provider ||
    null;

  const providerName = sanitizeValue(
    rawProviderName != null ? String(rawProviderName) : null,
    tx
  );

  const rawMethodLabel =
    tx?.payment_method ||
    tx?.payment_method_display ||
    detailWithLogo?.payment_method_name ||
    detailWithLogo?.payment_method ||
    detailWithLogo?.method ||
    null;

  const methodLabel = sanitizeValue(
    rawMethodLabel != null ? String(rawMethodLabel) : null,
    tx
  );

  const assetSymbol = String(tx?.currency || tx?.asset_symbol || "USDT");
  const assetNetwork =
    sanitizeValue(
      tx?.network_name != null ? String(tx.network_name) : null,
      tx
    ) ||
    sanitizeValue(
      tx?.asset_network != null ? String(tx.asset_network) : null,
      tx
    ) ||
    sanitizeValue(tx?.network != null ? String(tx.network) : null, tx) ||
    "BSC";

  const subType = normalizeExchangeSubType(tx?.sub_type || tx?.transaction_type || "");
  const additionalInfo = parseAdditionalInfo(tx?.additional_info);

  const prioritizedAddressCandidates =
    subType === "deposit"
      ? [tx?.deposit_address, tx?.wallet_address, tx?.destination_address]
      : subType === "withdrawal"
        ? [tx?.withdrawal_address, tx?.wallet_address, tx?.destination_address]
        : [
            tx?.wallet_address,
            tx?.destination_address,
            tx?.deposit_address,
            tx?.withdrawal_address,
          ];

  const walletAddressCandidates = [
    ...prioritizedAddressCandidates,
    tx?.changenow_payin_address,
    tx?.sent_from,
    additionalInfo?.wallet_address,
    additionalInfo?.deposit_address,
    additionalInfo?.withdrawal_address,
    additionalInfo?.address,
    tx?.payout_address,
    tx?.address,
    tx?.to_address,
    tx?.from_address,
    (paymentDetails[0] as Record<string, unknown> | undefined)?.wallet_address,
    (paymentDetails[0] as Record<string, unknown> | undefined)?.account_number,
    (paymentDetails[0] as Record<string, unknown> | undefined)?.mobile_number,
  ];

  const walletAddress =
    walletAddressCandidates
      .map((candidate) =>
        sanitizeValue(candidate != null ? String(candidate) : null, tx)
      )
      .find((candidate) => !!candidate) || null;

  const paymentLabel =
    providerName ||
    methodLabel ||
    sanitizeValue(
      tx?.payment_provider_display != null
        ? String(tx.payment_provider_display)
        : null,
      tx
    ) ||
    sanitizeValue(
      tx?.payment_provider != null ? String(tx.payment_provider) : null,
      tx
    ) ||
    sanitizeValue(
      tx?.payment_method_display != null
        ? String(tx.payment_method_display) : null,
      tx
    ) ||
    sanitizeValue(
      tx?.payment_method != null ? String(tx.payment_method) : null,
      tx
    ) ||
    "Bank / Payment";

  return {
    displayImage,
    providerName,
    methodLabel,
    paymentLabel,
    assetSymbol,
    assetNetwork,
    walletAddress,
    subType,
  };
}
