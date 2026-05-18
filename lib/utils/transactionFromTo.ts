/** Shared From/To display rules for dashboard transaction tables */

import {
  extractExchangePaymentInfo,
  normalizeExchangeSubType,
} from "@/lib/utils/exchangeTransactionDisplay";

export type FromToCellModel = {
  label: string;
  /** Full value for clipboard; omit for asset/provider labels */
  copyValue?: string | null;
  /** Provider or asset logo URL when available */
  iconUrl?: string | null;
};

export const DEFAULT_PROVIDER_LOGO = "/default-provider-logo.svg";

export function isAssetNetworkLabel(value: unknown): boolean {
  const s = String(value ?? "").trim();
  if (!s) return false;
  return /^[A-Za-z0-9]+\s*\([A-Za-z0-9]+\)$/i.test(s);
}

export function getBaseTickerForIcon(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "USDT";
  const idxParen = s.indexOf("(");
  const base = (idxParen >= 0 ? s.slice(0, idxParen) : s).trim();
  return (base.split(/[-_\s]+/)[0] || base).toUpperCase();
}

export function formatAddressForDisplay(
  addr: string | null | undefined,
  start = 6,
  end = 4
): string {
  if (!addr) return "—";
  const s = String(addr).trim();
  if (!s) return "—";
  if (isAssetNetworkLabel(s)) return s;
  if (s.length <= start + end + 3) return s;
  return `${s.slice(0, start)}...${s.slice(-end)}`;
}

export function formatP2pCryptoLabel(parts: {
  currency?: string | null;
  asset?: string | null;
  network?: string | null;
  from_network?: string | null;
  to_network?: string | null;
}): string {
  const sym = String(parts.currency || parts.asset || "USDT").toUpperCase();
  const net =
    parts.network || parts.from_network || parts.to_network || null;
  return net ? `${sym} (${String(net).toUpperCase()})` : sym;
}

export function isOtpPendingStatus(status: unknown): boolean {
  const s = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  return s === "otp_pending";
}

export function normalizeTransactionStatusForBadge(status: unknown): string {
  const s = String(status ?? "").trim();
  if (!s) return "n/a";
  const key = s.toLowerCase().replace(/\s+/g, "_");
  const map: Record<string, string> = {
    pending_address: "pending",
    pending_approval: "pending approval",
    admin_approval_required: "processing",
  };
  if (key === "otp_pending") return "otp pending";
  return map[key] ?? key.replace(/_/g, " ");
}

/** P2P deposit/withdraw rows: From = source, To = destination (asset label vs address). */
export function buildP2pWithdrawalDepositFromTo(
  tx: Record<string, unknown>,
  enrich?: {
    from?: string | null;
    to?: string | null;
    receiver?: string | null;
  } | null
): { from: FromToCellModel; to: FromToCellModel } {
  const txType = String(
    tx?.transaction_type || tx?.sub_type || ""
  ).toLowerCase();
  const cryptoLabel = formatP2pCryptoLabel({
    currency: tx?.currency as string,
    asset: tx?.asset as string,
    network: tx?.network as string,
  });

  const fullFrom =
    enrich?.from ||
    tx?.from_address ||
    tx?.deposit_address ||
    null;
  const fullTo =
    enrich?.to ||
    tx?.to_address ||
    tx?.withdrawal_address ||
    enrich?.receiver ||
    tx?.receiver_wallet ||
    null;

  if (txType.includes("withdraw")) {
    const toAddr = String(
      fullTo || tx?.withdrawal_address || tx?.receiver_wallet || ""
    ).trim();
    return {
      from: { label: cryptoLabel, copyValue: null },
      to: {
        label: formatAddressForDisplay(toAddr),
        copyValue: toAddr || null,
      },
    };
  }

  if (txType.includes("deposit")) {
    const fromAddr = String(
      fullFrom || tx?.from_address || tx?.deposit_address || ""
    ).trim();
    return {
      from: {
        label: formatAddressForDisplay(fromAddr),
        copyValue: fromAddr || null,
      },
      to: { label: cryptoLabel, copyValue: null },
    };
  }

  return {
    from: { label: cryptoLabel, copyValue: null },
    to: {
      label: formatAddressForDisplay(String(fullTo || "")),
      copyValue: fullTo ? String(fullTo) : null,
    },
  };
}

export const textFromToCell = (
  label: string,
  iconUrl?: string | null
): FromToCellModel => ({
  label: String(label || "—").trim() || "—",
  copyValue: null,
  iconUrl: iconUrl || null,
});

export function resolvePaymentMethodLogo(tx: Record<string, unknown>): string | null {
  const paymentMethodLogo = String(
    (tx as { payment_method?: { logo_url?: string } })?.payment_method?.logo_url || ""
  ).trim();
  const senderLogo = String((tx as { sender_provider_logo?: string }).sender_provider_logo || "").trim();
  const receiverLogo = String((tx as { receiver_provider_logo?: string }).receiver_provider_logo || "").trim();
  const providerLogo = String((tx as { provider_logo?: string }).provider_logo || "").trim();
  const senderProviderObj = (tx as { sender_provider?: { logo?: string } }).sender_provider;
  const receiverProviderObj = (tx as { receiver_provider?: { logo?: string } }).receiver_provider;
  const paymentDetailLogo =
    (Array.isArray((tx as { payment_details?: unknown[] }).payment_details)
      ? (
          (tx as { payment_details: Array<Record<string, unknown>> }).payment_details.find(
            (detail) => detail?.provider_logo || detail?.logo || detail?.logo_url
          )?.provider_logo ||
          (tx as { payment_details: Array<Record<string, unknown>> }).payment_details.find(
            (detail) => detail?.provider_logo || detail?.logo || detail?.logo_url
          )?.logo ||
          (tx as { payment_details: Array<Record<string, unknown>> }).payment_details.find(
            (detail) => detail?.provider_logo || detail?.logo || detail?.logo_url
          )?.logo_url
        )
      : null) || null;

  return (
    paymentMethodLogo ||
    senderLogo ||
    receiverLogo ||
    String(senderProviderObj?.logo || "").trim() ||
    String(receiverProviderObj?.logo || "").trim() ||
    providerLogo ||
    String(paymentDetailLogo || "").trim() ||
    null
  );
}

/** Resolve From/To column logos for unified dashboard transaction rows */
export function resolveFromToLogos(
  tx: Record<string, unknown>,
  _fromLabel?: string,
  _toLabel?: string
): { fromLogo: string | null; toLogo: string | null } {
  const type = String(tx?.type || "").toLowerCase();
  const subType = String(tx?.sub_type || "").toLowerCase();
  const genericLogo = resolvePaymentMethodLogo(tx);

  const p2pFromLogo = String((tx as { from_asset_logo?: string }).from_asset_logo || "").trim() || null;
  const p2pToLogo = String((tx as { to_asset_logo?: string }).to_asset_logo || "").trim() || null;

  if (type === "exchange") {
    const isDeposit = subType === "deposit";
    // Deposit: payment on From, asset/address on To. Withdrawal: asset on From, payment/address on To.
    return {
      fromLogo: isDeposit ? genericLogo : null,
      toLogo: isDeposit ? null : genericLogo,
    };
  }

  if (type === "moneyx") {
    const senderLogo = String((tx as { sender_provider_logo?: string }).sender_provider_logo || "").trim() ||
      String((tx as { sender_provider?: { logo?: string } }).sender_provider?.logo || "").trim() ||
      genericLogo;
    const receiverLogo =
      String((tx as { receiver_provider_logo?: string }).receiver_provider_logo || "").trim() ||
      String((tx as { receiver_provider?: { logo?: string } }).receiver_provider?.logo || "").trim() ||
      genericLogo;
    return { fromLogo: senderLogo || null, toLogo: receiverLogo || null };
  }

  if (type === "p2p" && (p2pFromLogo || p2pToLogo)) {
    return { fromLogo: p2pFromLogo, toLogo: p2pToLogo };
  }

  if (subType === "withdrawal") {
    return { fromLogo: null, toLogo: genericLogo };
  }
  if (subType === "deposit") {
    return { fromLogo: genericLogo, toLogo: null };
  }

  return { fromLogo: genericLogo, toLogo: genericLogo };
}

const attachLogoToCell = (
  cell: FromToCellModel,
  logo: string | null
): FromToCellModel => {
  // Copyable values are wallet/on-chain addresses — never use payment-method icons.
  if (cell.copyValue) {
    return { ...cell, iconUrl: null };
  }
  return { ...cell, iconUrl: cell.iconUrl || logo };
};

export function withFromToLogos(
  tx: Record<string, unknown>,
  from: FromToCellModel,
  to: FromToCellModel
): { from: FromToCellModel; to: FromToCellModel } {
  const logos = resolveFromToLogos(tx, from.label, to.label);
  return {
    from: attachLogoToCell(from, logos.fromLogo),
    to: attachLogoToCell(to, logos.toLogo),
  };
}

export const addressFromToCell = (addr: string | null | undefined): FromToCellModel => {
  const s = String(addr ?? "").trim();
  if (!s) return textFromToCell("—");
  return { label: formatAddressForDisplay(s), copyValue: s };
};

/** Express / unified exchange rows — same rules on All and Exchange tabs */
export function buildExchangeFromTo(tx: Record<string, unknown>): {
  from: FromToCellModel;
  to: FromToCellModel;
} {
  const info = extractExchangePaymentInfo(tx);
  const sub = normalizeExchangeSubType(info.subType || tx?.sub_type);
  const isDeposit = sub === "deposit";
  const assetLabel = formatP2pCryptoLabel({
    currency: info.assetSymbol,
    asset: tx?.asset as string,
    network: info.assetNetwork,
  });
  const paymentLogo =
    info.displayImage || resolvePaymentMethodLogo(tx) || DEFAULT_PROVIDER_LOGO;
  const recipientName = String(tx?.recipient_name ?? "").trim() || null;

  if (isDeposit) {
    return {
      from: textFromToCell(info.paymentLabel, paymentLogo),
      to: info.walletAddress
        ? addressFromToCell(info.walletAddress)
        : textFromToCell(assetLabel),
    };
  }
  return {
    from: textFromToCell(assetLabel),
    to: info.walletAddress
      ? addressFromToCell(info.walletAddress)
      : textFromToCell(
          info.paymentLabel || recipientName || "Bank / Wallet",
          paymentLogo
        ),
  };
}
