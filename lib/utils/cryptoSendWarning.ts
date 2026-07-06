import {
  getAssetPrimaryLabel,
  getAssetNetworkValue,
  getNetworkDisplayName,
  type AssetLike,
} from "@/lib/utils/networkDisplay";

const ADDRESS_HEADING_OVERRIDES: Record<string, string> = {
  BTC: "Bitcoin Address",
  ETH: "Ethereum Address",
  LTC: "Litecoin Address",
  XRP: "Ripple Address",
  TRX: "TRON Address",
  SOL: "Solana Address",
  BNB: "BNB Address",
};

/** Heading above the platform deposit address (e.g. "Bitcoin Address", "USDT Wallet Address"). */
export function getCryptoDepositAddressHeading(
  asset?: AssetLike | null
): string {
  if (!asset) return "Wallet Address";
  const ticker = getAssetPrimaryLabel(asset).toUpperCase();
  return ADDRESS_HEADING_OVERRIDES[ticker] || `${ticker} Wallet Address`;
}

export function getCryptoSendOnlyWarningParts(
  asset?: AssetLike | null,
  networkOverride?: string | null
) {
  const assetLabel = asset ? getAssetPrimaryLabel(asset) : "the selected asset";
  const networkRaw =
    networkOverride?.trim() ||
    (asset ? getAssetNetworkValue(asset) : "") ||
    "";
  const networkLabel = getNetworkDisplayName(networkRaw);
  const addressHeading = getCryptoDepositAddressHeading(asset);
  const assetNorm = assetLabel.trim().toLowerCase();
  const networkNorm = networkLabel.trim().toLowerCase();
  const showNetwork =
    Boolean(networkRaw) &&
    networkNorm !== assetNorm &&
    networkNorm !== "unknown" &&
    !networkNorm.includes(assetNorm);

  return {
    assetLabel,
    networkLabel,
    addressHeading,
    showNetwork,
  };
}
