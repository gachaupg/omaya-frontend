/** Shared From/To display rules for dashboard transaction tables */

import {
  extractExchangePaymentInfo,
  hasExchangePaymentDestination,
  isLikelyOnChainWalletAddress,
  normalizeExchangeSubType,
} from "@/lib/utils/exchangeTransactionDisplay";
import {
  getExchangeFromAssetTicker,
  getExchangePaymentProviderLabel,
  getExchangeToAssetTicker,
  isChangeNowLabel,
  isLikelyPaymentProviderName,
} from "@/lib/utils/exchangeCurrencyDisplay";
import {
  getHighResAssetIcon,
  resolveCurrencyOrAssetLogo,
} from "@/features/express/utils/imageHelpers";

export type FromToCellModel = {
  label: string;
  /** Secondary line (truncated address, account ref, etc.) */
  subLabel?: string | null;
  /** Full value for clipboard; omit for asset/provider labels */
  copyValue?: string | null;
  /** Provider or asset logo URL when available */
  iconUrl?: string | null;
};

export const DEFAULT_PROVIDER_LOGO = "/default-provider-logo.svg";

/** US flag for the USD leg (same source as UsdFlagIcon). */
export const USD_FLAG_ICON_URL = "https://flagcdn.com/w80/us.png";

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

  const paymentLogo = resolvePaymentMethodLogo(tx);

  if (txType.includes("withdraw")) {
    const toAddr = String(
      fullTo || tx?.withdrawal_address || tx?.receiver_wallet || ""
    ).trim();
    return {
      from: textFromToCell(cryptoLabel, resolveAssetIconForLabel(cryptoLabel)),
      to: toAddr
        ? assetAddressFromToCell(cryptoLabel, toAddr)
        : textFromToCell(cryptoLabel, resolveAssetIconForLabel(cryptoLabel)),
    };
  }

  if (txType.includes("deposit")) {
    const fromAddr = String(
      fullFrom || tx?.from_address || tx?.deposit_address || ""
    ).trim();
    return {
      from: fromAddr
        ? isLikelyOnChainWalletAddress(fromAddr)
          ? assetAddressFromToCell(cryptoLabel, fromAddr)
          : providerDetailFromToCell(
              String(tx?.payment_provider || "Payment"),
              fromAddr,
              paymentLogo
            )
        : providerDetailFromToCell(
            String(tx?.payment_provider || "Payment"),
            null,
            paymentLogo
          ),
      to: textFromToCell(cryptoLabel, resolveAssetIconForLabel(cryptoLabel)),
    };
  }

  return {
    from: textFromToCell(cryptoLabel, resolveAssetIconForLabel(cryptoLabel)),
    to: fullTo
      ? assetAddressFromToCell(cryptoLabel, String(fullTo))
      : textFromToCell("—"),
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

export function resolveAssetIconForLabel(assetLabel: string): string | null {
  return getHighResAssetIcon({ ticker: getBaseTickerForIcon(assetLabel) });
}

/** Human-readable network line under ticker (e.g. DOGE + Dogecoin network). */
export function formatExchangeNetworkSubLabel(
  network: string | null | undefined,
  assetName?: string | null
): string | undefined {
  const name = String(assetName ?? "").trim();
  if (name) return name;
  const net = String(network ?? "").trim();
  if (!net) return undefined;
  if (/network$/i.test(net)) {
    return net.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const pretty = net
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return `${pretty} network`;
}

/** Crypto asset headline with optional network / asset name below. */
export function assetNetworkFromToCell(
  symbol: string,
  network?: string | null,
  assetName?: string | null,
  walletAddress?: string | null
): FromToCellModel {
  const ticker = String(symbol || "USDT").trim().toUpperCase() || "USDT";
  const networkLine = formatExchangeNetworkSubLabel(network, assetName);
  const addr = String(walletAddress ?? "").trim();

  if (addr && isLikelyOnChainWalletAddress(addr)) {
    return {
      label: ticker,
      subLabel: networkLine || formatAddressForDisplay(addr),
      copyValue: addr,
      iconUrl: resolveAssetIconForLabel(ticker),
    };
  }

  if (networkLine) {
    return {
      label: ticker,
      subLabel: networkLine,
      iconUrl: resolveAssetIconForLabel(ticker),
    };
  }

  return textFromToCell(ticker, resolveAssetIconForLabel(ticker));
}

/** Asset name on top, wallet address below (e.g. AAVE (ETH) + 0x7E12...25Fc). */
export function assetAddressFromToCell(
  assetLabel: string,
  addr: string | null | undefined
): FromToCellModel {
  const asset = String(assetLabel || "").trim() || "—";
  const full = String(addr ?? "").trim();
  if (!full) {
    return textFromToCell(asset, resolveAssetIconForLabel(asset));
  }
  return {
    label: asset,
    subLabel: formatAddressForDisplay(full),
    copyValue: full,
    iconUrl: resolveAssetIconForLabel(asset),
  };
}

/** Provider / bank on top, account or truncated address below. */
export function providerDetailFromToCell(
  providerLabel: string,
  detail?: string | null,
  iconUrl?: string | null
): FromToCellModel {
  let provider = String(providerLabel || "").trim() || "—";
  let detailStr = String(detail ?? "").trim();
  let logo = iconUrl || DEFAULT_PROVIDER_LOGO;

  // ChangeNOW is the swap backend, not a payment provider — show the USD leg
  // with the US flag, no provider/recipient name underneath.
  if (isChangeNowLabel(provider)) {
    return {
      label: "USD",
      subLabel: null,
      copyValue: null,
      iconUrl: USD_FLAG_ICON_URL,
    };
  }
  if (isChangeNowLabel(detailStr)) {
    detailStr = "";
  }

  if (!detailStr) {
    return textFromToCell(provider, logo);
  }

  if (isLikelyOnChainWalletAddress(detailStr)) {
    return {
      label: provider,
      subLabel: formatAddressForDisplay(detailStr),
      copyValue: detailStr,
      iconUrl: logo,
    };
  }

  return {
    label: provider,
    subLabel: detailStr,
    copyValue: null,
    iconUrl: logo,
  };
}

/** First non-empty image URL from API fields. */
export function pickFirstAssetLogo(...values: unknown[]): string | null {
  for (const value of values) {
    const url = String(value ?? "").trim();
    if (url) return url;
  }
  return null;
}

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

  if (type === "exchange" || type === "swap") {
    const fromLogo = pickFirstAssetLogo(
      (tx as { from_asset_logo?: string }).from_asset_logo
    );
    const toLogo = pickFirstAssetLogo((tx as { to_asset_logo?: string }).to_asset_logo);
    const assetImage = pickFirstAssetLogo((tx as { asset_image?: string }).asset_image);

    if (fromLogo || toLogo || assetImage) {
      const isDeposit = subType === "deposit";
      if (type === "swap") {
        return {
          fromLogo: fromLogo || assetImage,
          toLogo: toLogo,
        };
      }
      return {
        fromLogo: fromLogo || (isDeposit ? genericLogo : assetImage),
        toLogo: toLogo || (isDeposit ? assetImage : genericLogo),
      };
    }
  }

  if (type === "moneyx") {
    const currency = String(
      (tx as { currency?: string }).currency ||
        (tx as { asset?: string }).asset ||
        "USD"
    ).trim();
    const currencyLogo = resolveCurrencyOrAssetLogo(
      currency,
      pickFirstAssetLogo((tx as { asset_image?: string }).asset_image)
    );
    const senderLogo =
      String((tx as { sender_provider_logo?: string }).sender_provider_logo || "").trim() ||
      String((tx as { sender_provider?: { logo?: string } }).sender_provider?.logo || "").trim() ||
      genericLogo ||
      currencyLogo;
    const receiverLogo =
      String((tx as { receiver_provider_logo?: string }).receiver_provider_logo || "").trim() ||
      String((tx as { receiver_provider?: { logo?: string } }).receiver_provider?.logo || "").trim() ||
      genericLogo ||
      currencyLogo;
    return { fromLogo: senderLogo || null, toLogo: receiverLogo || null };
  }

  if (type === "p2p") {
    return {
      fromLogo: p2pFromLogo,
      toLogo: p2pToLogo,
    };
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
  // Address-only rows (no asset/provider headline) stay text-only.
  if (cell.copyValue && !cell.subLabel) {
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

/** ChangeNOW / API swap rows (from_asset → to_asset with logos). */
export function buildSwapFromTo(tx: Record<string, unknown>): {
  from: FromToCellModel;
  to: FromToCellModel;
} {
  const fromLabel = String(
    tx.from_asset || tx.from_currency || tx.currency || "—"
  ).trim();
  const toLabel = String(tx.to_asset || tx.to_currency || "—").trim();
  const fromNetwork = String(tx.from_network || tx.network || "").trim();
  const toNetwork = String(tx.to_network || "").trim();
  const depositAddr = String(tx.deposit_address ?? "").trim();
  const payoutAddr = String(tx.withdrawal_address ?? "").trim();

  const fromNetworkLine = fromNetwork
    ? formatExchangeNetworkSubLabel(fromNetwork)
    : undefined;
  const toNetworkLine = toNetwork
    ? formatExchangeNetworkSubLabel(toNetwork)
    : undefined;

  const usdLegCell = (): FromToCellModel => ({
    label: "USD",
    subLabel: null,
    copyValue: null,
    iconUrl: USD_FLAG_ICON_URL,
  });

  return {
    from: isChangeNowLabel(fromLabel)
      ? usdLegCell()
      : {
          label: fromLabel.toUpperCase(),
          subLabel:
            fromNetworkLine ||
            (depositAddr ? formatAddressForDisplay(depositAddr) : undefined),
          copyValue: depositAddr || null,
          iconUrl: pickFirstAssetLogo(tx.from_asset_logo, tx.asset_image),
        },
    to: isChangeNowLabel(toLabel)
      ? usdLegCell()
      : {
          label: toLabel.toUpperCase(),
          subLabel:
            toNetworkLine ||
            (payoutAddr ? formatAddressForDisplay(payoutAddr) : undefined),
          copyValue: payoutAddr || null,
          iconUrl: pickFirstAssetLogo(tx.to_asset_logo),
        },
  };
}

/** Exchange rows when API sends from_asset / to_asset (unified all-transactions feed). */
function buildExchangeFromToApiAssets(tx: Record<string, unknown>): {
  from: FromToCellModel;
  to: FromToCellModel;
} {
  const sub = normalizeExchangeSubType(tx?.sub_type);
  const isDeposit = sub === "deposit";
  const txItem = tx as unknown as import("@/features/transactions/api").AllTransactionItem;
  const paymentLabel = getExchangePaymentProviderLabel(txItem);
  const fromRaw = String(tx.from_asset ?? "").trim();
  const toRaw = String(tx.to_asset ?? "").trim();
  const cryptoFromTicker = getExchangeFromAssetTicker(txItem) || "—";
  const cryptoToTicker = getExchangeToAssetTicker(txItem) || "—";
  const pm =
    tx.payment_method && typeof tx.payment_method === "object"
      ? (tx.payment_method as Record<string, unknown>)
      : null;
  const accountRef =
    pm?.account_number != null
      ? String(pm.account_number).trim()
      : pm?.account_name != null
        ? String(pm.account_name).trim()
        : null;

  const fromLogo = pickFirstAssetLogo(tx.from_asset_logo);
  const toLogo = pickFirstAssetLogo(tx.to_asset_logo);
  const assetImage = pickFirstAssetLogo(tx.asset_image);
  const networkLine = formatExchangeNetworkSubLabel(String(tx.network || ""));

  const toAddr = String(
    tx.to_address || tx.deposit_address || tx.withdrawal_address || ""
  ).trim();
  const fromAddr = String(tx.from_address || "").trim();

  const depositFromLabel =
    paymentLabel ||
    (isLikelyPaymentProviderName(fromRaw) ? fromRaw : "") ||
    "Bank / Payment";

  if (isDeposit) {
    return {
      from: providerDetailFromToCell(
        depositFromLabel,
        accountRef || (fromAddr && !isLikelyOnChainWalletAddress(fromAddr) ? fromAddr : null),
        fromLogo || resolvePaymentMethodLogo(tx) || DEFAULT_PROVIDER_LOGO
      ),
      to: {
        label: cryptoToTicker,
        subLabel:
          networkLine ||
          (toAddr && isLikelyOnChainWalletAddress(toAddr)
            ? formatAddressForDisplay(toAddr)
            : undefined),
        copyValue: toAddr && isLikelyOnChainWalletAddress(toAddr) ? toAddr : null,
        iconUrl:
          toLogo ||
          assetImage ||
          resolveAssetIconForLabel(cryptoToTicker),
      },
    };
  }

  return {
    from: {
      label: cryptoFromTicker,
      subLabel: networkLine,
      iconUrl:
        fromLogo || assetImage || resolveAssetIconForLabel(cryptoFromTicker),
    },
    to: providerDetailFromToCell(
      paymentLabel ||
        (isLikelyPaymentProviderName(toRaw) ? toRaw : "") ||
        "Bank / Payment",
      accountRef || (toAddr && !isLikelyOnChainWalletAddress(toAddr) ? toAddr : null),
      toLogo || resolvePaymentMethodLogo(tx) || DEFAULT_PROVIDER_LOGO
    ),
  };
}

/** Express / unified exchange rows — same rules on All and Exchange tabs */
export function buildExchangeFromTo(tx: Record<string, unknown>): {
  from: FromToCellModel;
  to: FromToCellModel;
} {
  const fromAsset = String(tx?.from_asset ?? "").trim();
  const toAsset = String(tx?.to_asset ?? "").trim();
  if (fromAsset && toAsset) {
    return buildExchangeFromToApiAssets(tx);
  }

  const info = extractExchangePaymentInfo(tx);
  const sub = normalizeExchangeSubType(info.subType || tx?.sub_type);
  const isDeposit = sub === "deposit";
  const paymentLogo =
    info.displayImage || resolvePaymentMethodLogo(tx) || DEFAULT_PROVIDER_LOGO;
  const recipientName = String(tx?.recipient_name ?? "").trim() || null;

  const cryptoFrom = () =>
    assetNetworkFromToCell(
      info.assetSymbol,
      info.assetNetwork,
      String(tx?.asset_name ?? "").trim() || null
    );

  const cryptoTo = (wallet?: string | null) =>
    assetNetworkFromToCell(
      info.assetSymbol,
      info.assetNetwork,
      String(tx?.asset_name ?? "").trim() || null,
      wallet ?? info.walletAddress
    );

  const paymentTo = () =>
    providerDetailFromToCell(
      info.paymentLabel || recipientName || "Bank / Wallet",
      info.paymentAccountReference,
      paymentLogo
    );

  const paymentFrom = () =>
    providerDetailFromToCell(
      info.paymentLabel || recipientName || "Bank / Wallet",
      info.paymentAccountReference,
      paymentLogo
    );

  const hasPayment = hasExchangePaymentDestination(tx, info);

  if (isDeposit) {
    const fromPayment = paymentFrom();
    const toCell = info.walletAddress ? cryptoTo(info.walletAddress) : cryptoTo(null);
    return {
      from: {
        ...fromPayment,
        iconUrl:
          fromPayment.iconUrl ||
          pickFirstAssetLogo(tx.from_asset_logo) ||
          resolvePaymentMethodLogo(tx),
      },
      to: {
        ...toCell,
        iconUrl:
          toCell.iconUrl ||
          pickFirstAssetLogo(tx.to_asset_logo, tx.asset_image) ||
          null,
      },
    };
  }

  // Withdrawal: crypto → bank/payment when API includes a payment destination
  if (hasPayment) {
    const fromCrypto = cryptoFrom();
    const toPayment = paymentTo();
    return {
      from: {
        ...fromCrypto,
        iconUrl:
          fromCrypto.iconUrl ||
          pickFirstAssetLogo(tx.from_asset_logo, tx.asset_image) ||
          null,
      },
      to: {
        ...toPayment,
        iconUrl:
          toPayment.iconUrl ||
          pickFirstAssetLogo(tx.to_asset_logo) ||
          resolvePaymentMethodLogo(tx),
      },
    };
  }

  const toIsOnChainWallet =
    info.walletAddress && isLikelyOnChainWalletAddress(info.walletAddress);

  return {
    from: cryptoFrom(),
    to: toIsOnChainWallet
      ? assetAddressFromToCell(
          formatP2pCryptoLabel({
            currency: info.assetSymbol,
            asset: tx?.asset as string,
            network: info.assetNetwork,
          }),
          info.walletAddress
        )
      : paymentTo(),
  };
}
