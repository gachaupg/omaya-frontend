/** Payment provider / wallet fields for dashboard exchange transaction rows */

export type ExchangePaymentInfo = {
  displayImage: string | null;
  providerName: string | null;
  methodLabel: string | null;
  /** Best user-facing payment label (provider + method fallbacks) */
  paymentLabel: string;
  /** Bank account / mobile reference (not treated as on-chain wallet) */
  paymentAccountReference: string | null;
  assetSymbol: string;
  assetNetwork: string;
  walletAddress: string | null;
  subType: "deposit" | "withdrawal" | string;
};

/** On-chain or external crypto wallet — not bank account numbers. */
export function isLikelyOnChainWalletAddress(value: unknown): boolean {
  const s = String(value ?? "").trim();
  if (!s) return false;
  if (/^0x[a-fA-F0-9]{20,}$/i.test(s)) return true;
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,}$/.test(s)) return true;
  if (/^T[a-zA-Z0-9]{20,}$/.test(s)) return true;
  return false;
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

function readPaymentMethodObject(tx: Record<string, unknown>): {
  provider: string | null;
  methodName: string | null;
  logo: string | null;
} {
  const raw = tx?.payment_method;
  if (!raw || typeof raw !== "object") {
    return { provider: null, methodName: null, logo: null };
  }
  const pm = raw as Record<string, unknown>;
  return {
    provider: sanitizeValue(
      String(
        pm.provider ??
          pm.provider_name ??
          pm.payment_provider ??
          pm.payment_provider_name ??
          ""
      ),
      tx
    ),
    methodName: sanitizeValue(
      String(
        pm.name ??
          pm.method_name ??
          pm.payment_method_name ??
          pm.display_name ??
          ""
      ),
      tx
    ),
    logo:
      String(pm.logo_url ?? pm.logo ?? pm.provider_logo ?? "").trim() || null,
  };
}

/** True when the API includes a fiat/mobile bank destination (not crypto-only). */
export function hasExchangePaymentDestination(
  tx: Record<string, unknown>,
  info?: Pick<
    ExchangePaymentInfo,
    "providerName" | "methodLabel" | "paymentAccountReference" | "paymentLabel"
  >
): boolean {
  if (info?.providerName || info?.methodLabel || info?.paymentAccountReference) {
    return true;
  }
  const paymentLabel = String(info?.paymentLabel ?? "").trim();
  if (
    paymentLabel &&
    paymentLabel !== "Bank / Payment" &&
    !isLikelyOnChainWalletAddress(paymentLabel)
  ) {
    return true;
  }

  const candidates = [
    tx?.payment_provider,
    tx?.payment_provider_display,
    tx?.payment_provider_name,
    tx?.receiver_provider,
    tx?.sender_provider,
    tx?.recipient_name,
    tx?.recipient_account,
    tx?.account_number,
    tx?.mobile_number,
  ];
  if (
    candidates.some(
      (c) => !!sanitizeValue(c != null ? String(c) : null, tx)
    )
  ) {
    return true;
  }

  const paymentDetails = Array.isArray(tx?.payment_details)
    ? tx.payment_details
    : [];
  return paymentDetails.length > 0;
}

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

  const paymentMethodObj = readPaymentMethodObject(tx);
  const subType = normalizeExchangeSubType(tx?.sub_type || tx?.transaction_type || "");
  const isWithdrawal = subType === "withdrawal";

  const displayImage =
    String(detailWithLogo?.provider_logo || detailWithLogo?.logo || "").trim() ||
    paymentMethodObj.logo ||
    String(tx?.provider_logo || "").trim() ||
    String(tx?.receiver_provider_logo || "").trim() ||
    String(tx?.sender_provider_logo || "").trim() ||
    null;

  const rawProviderName =
    (isWithdrawal ? tx?.receiver_provider : null) ||
    detailWithLogo?.provider_name ||
    detailWithLogo?.provider ||
    paymentMethodObj.provider ||
    tx?.payment_provider ||
    tx?.payment_provider_display ||
    tx?.payment_provider_name ||
    tx?.sender_provider ||
    (!isWithdrawal ? tx?.receiver_provider : null) ||
    null;

  const providerName = sanitizeValue(
    rawProviderName != null ? String(rawProviderName) : null,
    tx
  );

  const rawMethodLabel =
    paymentMethodObj.methodName ||
    tx?.payment_method_display ||
    detailWithLogo?.payment_method_name ||
    detailWithLogo?.payment_method ||
    detailWithLogo?.method ||
    (typeof tx?.payment_method === "string" ? tx.payment_method : null) ||
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
  ];

  const walletAddress =
    walletAddressCandidates
      .map((candidate) =>
        sanitizeValue(candidate != null ? String(candidate) : null, tx)
      )
      .filter((candidate): candidate is string => !!candidate)
      .find((candidate) => isLikelyOnChainWalletAddress(candidate)) || null;

  const paymentAccountReference =
    sanitizeValue(
      (paymentDetails[0] as Record<string, unknown> | undefined)?.account_number !=
        null
        ? String(
            (paymentDetails[0] as Record<string, unknown>).account_number
          )
        : null,
      tx
    ) ||
    sanitizeValue(
      (paymentDetails[0] as Record<string, unknown> | undefined)?.mobile_number !=
        null
        ? String(
            (paymentDetails[0] as Record<string, unknown>).mobile_number
          )
        : null,
      tx
    ) ||
    sanitizeValue(
      tx?.account_number != null ? String(tx.account_number) : null,
      tx
    ) ||
    sanitizeValue(
      tx?.mobile_number != null ? String(tx.mobile_number) : null,
      tx
    ) ||
    sanitizeValue(
      tx?.recipient_account != null ? String(tx.recipient_account) : null,
      tx
    ) ||
    null;

  const paymentLabel =
    providerName ||
    methodLabel ||
    sanitizeValue(
      (isWithdrawal ? tx?.receiver_provider : tx?.sender_provider) != null
        ? String(isWithdrawal ? tx?.receiver_provider : tx?.sender_provider)
        : null,
      tx
    ) ||
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
      tx?.payment_provider_name != null ? String(tx.payment_provider_name) : null,
      tx
    ) ||
    sanitizeValue(
      tx?.payment_method_display != null ? String(tx.payment_method_display) : null,
      tx
    ) ||
    sanitizeValue(
      tx?.recipient_name != null ? String(tx.recipient_name) : null,
      tx
    ) ||
    "Bank / Payment";

  return {
    displayImage,
    providerName,
    methodLabel,
    paymentLabel,
    paymentAccountReference,
    assetSymbol,
    assetNetwork,
    walletAddress,
    subType,
  };
}
