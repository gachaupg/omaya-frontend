const CLOUDINARY_UPLOAD_SEGMENT = "/upload/";
const DEFAULT_PROVIDER_LOGO = "/default-provider-logo.svg";
const DEFAULT_ASSET_ICON = "/images/asset-default.svg";

const CLOUDINARY_TRANSFORM = (size: number) =>
  `f_auto,q_auto,w_${size},h_${size},c_fit`;

const LOCAL_ASSET_ICON_MAP: Record<string, string> = {
  usdt: "/images/tether.svg",
  tether: "/images/tether.svg",
  btc: "/images/Bitcoin.svg",
  bitcoin: "/images/Bitcoin.svg",
  eth: "/images/eth.svg",
  ethereum: "/images/eth.svg",
};

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

export type { AssetLike };

export const PAYMENT_LOGO_SIZE = 36;
export const ASSET_ICON_SIZE = 52;
export const PAYMENT_LOGO_BASE_CLASS =
  "rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#0F1115] p-1 object-contain shadow-sm";
export const ASSET_ICON_BASE_CLASS =
  "rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#0F1115] p-1 object-contain";

