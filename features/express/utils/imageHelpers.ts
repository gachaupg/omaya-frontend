const CLOUDINARY_UPLOAD_SEGMENT = "/upload/";
const DEFAULT_PROVIDER_LOGO = "/default-provider-logo.svg";
const DEFAULT_ASSET_ICON = "/images/asset-default.svg";

const CLOUDINARY_TRANSFORM = (size: number) =>
  `f_auto,q_auto,w_${size},h_${size},c_fit`;

const LOCAL_ASSET_ICON_MAP: Record<string, string> = {
  usdt: "/images/tether.svg",
  tether: "/images/tether.svg",
  bnb: "/images/bnb.png",
  btc: "/images/Bitcoin.svg",
  bitcoin: "/images/Bitcoin.svg",
  eth: "/images/eth.svg",
  ethereum: "/images/eth.svg",
  fxp: "/assets/fx-primus-custom.svg",
  fxprimus: "/assets/fx-primus-custom.svg",
  "fx primus": "/assets/fx-primus-custom.svg",
  usd: "https://flagcdn.com/w80/us.png",
};

/** US flag for fiat USD (not USDT). CDN first; local SVG fallback via img onError. */
export const USD_FLAG_LOGO = LOCAL_ASSET_ICON_MAP.usd;
export const USD_FLAG_LOCAL_FALLBACK = "/assets/united_states_flag.svg";

const sanitizeUrl = (value?: string | null) => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const enhanceCloudinaryUrl = (url?: string | null, size = 96) => {
  const sanitized = sanitizeUrl(url);
  if (!sanitized) {
    return undefined;
  }

  if (
    !sanitized.includes(CLOUDINARY_UPLOAD_SEGMENT) ||
    sanitized.includes(`${CLOUDINARY_UPLOAD_SEGMENT}${CLOUDINARY_TRANSFORM(size)}`)
  ) {
    return sanitized;
  }

  const [prefix, suffix] = sanitized.split(CLOUDINARY_UPLOAD_SEGMENT);
  if (!suffix) {
    return sanitized;
  }

  return `${prefix}${CLOUDINARY_UPLOAD_SEGMENT}${CLOUDINARY_TRANSFORM(size)}/${suffix}`;
};

export const getHighResPaymentLogo = (
  primary?: string | null,
  secondary?: string | null,
  size = 96
) => {
  const preferred = sanitizeUrl(primary) || sanitizeUrl(secondary);
  const enhanced = enhanceCloudinaryUrl(preferred, size);
  return enhanced || DEFAULT_PROVIDER_LOGO;
};

type AssetLike = {
  ticker?: string | null;
  symbol?: string | null;
  name?: string | null;
  image_url?: string | null;
  asset_image?: string | null;
  image?: string | null;
};

export const getHighResAssetIcon = (asset?: AssetLike | null, size = 96) => {
  if (!asset) {
    return DEFAULT_ASSET_ICON;
  }

  const ticker =
    asset.ticker?.toLowerCase() ||
    asset.symbol?.toLowerCase() ||
    asset.name?.toLowerCase();

  if (ticker && LOCAL_ASSET_ICON_MAP[ticker]) {
    return LOCAL_ASSET_ICON_MAP[ticker];
  }

  const enhanced =
    enhanceCloudinaryUrl(asset.image_url, size) ||
    enhanceCloudinaryUrl(asset.asset_image, size) ||
    enhanceCloudinaryUrl(asset.image, size);

  return enhanced || DEFAULT_ASSET_ICON;
};

export const getDefaultAssetIcon = () => DEFAULT_ASSET_ICON;
export const getDefaultProviderLogo = () => DEFAULT_PROVIDER_LOGO;

/** Fiat / asset icon for dashboard rows (e.g. USD → US flag, USDT → tether). */
export const resolveCurrencyOrAssetLogo = (
  currency?: string | null,
  remoteUrl?: string | null
): string | null => {
  const code = String(currency ?? "").trim().toUpperCase();
  if (code === "USD") return USD_FLAG_LOGO;
  const remote = sanitizeUrl(remoteUrl);
  if (remote) return remote;
  if (!code) return null;
  const icon = getHighResAssetIcon({ ticker: code });
  return icon === DEFAULT_ASSET_ICON ? null : icon;
};

export type DashboardTransactionAssetLike = {
  type?: string | null;
  sub_type?: string | null;
  currency?: string | null;
  asset?: string | null;
  asset_image?: string | null;
  from_asset_logo?: string | null;
  to_asset_logo?: string | null;
};

/** Same logo resolution for table rows and transaction details modal. */
export const resolveDashboardTransactionAssetImage = (
  tx: DashboardTransactionAssetLike
): string => {
  const type = String(tx.type ?? "").toLowerCase();
  const exchangeIconUrl =
    type === "exchange"
      ? tx.sub_type === "deposit"
        ? tx.to_asset_logo || tx.from_asset_logo || tx.asset_image
        : tx.from_asset_logo || tx.to_asset_logo || tx.asset_image
      : null;
  const ticker =
    String(tx.currency || tx.asset || "").trim() ||
    (type === "moneyx" ? "USD" : "");
  if (type === "moneyx" || ticker.toUpperCase() === "USD") {
    return USD_FLAG_LOGO;
  }
  return (
    resolveCurrencyOrAssetLogo(ticker, exchangeIconUrl || tx.asset_image) ||
    (ticker ? getHighResAssetIcon({ ticker }) : getDefaultAssetIcon())
  );
};

export type { AssetLike };

export const PAYMENT_LOGO_SIZE = 22;
export const ASSET_ICON_SIZE = 40;
export const PAYMENT_LOGO_BASE_CLASS = "object-contain";
export const ASSET_ICON_BASE_CLASS = "object-contain";

