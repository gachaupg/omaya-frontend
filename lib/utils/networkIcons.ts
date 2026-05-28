import { resolveAssetNetwork } from "@/lib/utils/assetSearch";
import { enhanceCloudinaryUrl } from "@/features/express/utils/imageHelpers";

export type NetworkIconAssetLike = {
  network?: string | null;
  network_image?: string | null;
  network_icon?: string | null;
  networkImage?: string | null;
  network_icon_url?: string | null;
  chain_image?: string | null;
  chain_icon?: string | null;
};

const LOCAL_NETWORK_ICONS: Record<string, string> = {
  trc20: "/assets/TRC20_ffibtg.png",
  trx: "/assets/TRC20_ffibtg.png",
  tron: "/assets/TRC20_ffibtg.png",
  bsc: "/images/bnb.png",
  bep20: "/images/bnb.png",
  bep2: "/images/bnb.png",
  binancesmartchain: "/images/bnb.png",
  eth: "/images/eth.svg",
  erc20: "/images/eth.svg",
  ethereum: "/images/eth.svg",
};

/** Trust Wallet assets repo — chain folder names. */
const TRUSTWALLET_CHAIN_BY_NETWORK: Record<string, string> = {
  apt: "aptos",
  aptos: "aptos",
  arb: "arbitrum",
  arbitrum: "arbitrum",
  arbitrumone: "arbitrum",
  avax: "avalanchec",
  avaxc: "avalanchec",
  avalanche: "avalanchec",
  assethub: "polkadot",
  bsc: "smartchain",
  bep20: "smartchain",
  bep2: "smartchain",
  binancesmartchain: "smartchain",
  btc: "bitcoin",
  bitcoin: "bitcoin",
  eth: "ethereum",
  erc20: "ethereum",
  ethereum: "ethereum",
  trx: "tron",
  trc20: "tron",
  tron: "tron",
  matic: "polygon",
  polygon: "polygon",
  pol: "polygon",
  sol: "solana",
  solana: "solana",
  base: "base",
  op: "optimism",
  optimism: "optimism",
  ton: "ton",
  near: "near",
  atom: "cosmos",
  cosmos: "cosmos",
  osmo: "osmosis",
  osmosis: "osmosis",
  luna: "terra",
  terra: "terra",
  doge: "doge",
  ltc: "litecoin",
  xrp: "ripple",
  ada: "cardano",
  zksync: "zksyncera",
  zksyncera: "zksyncera",
  linea: "linea",
  scroll: "scroll",
  sui: "sui",
};

function normalizeNetworkKey(network?: string | null): string {
  return String(network ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_()-]+/g, "");
}

function sanitizeUrl(value?: string | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function pickNetworkImageFromAsset(
  asset?: NetworkIconAssetLike | null
): string | undefined {
  if (!asset) return undefined;
  const candidates = [
    asset.network_image,
    asset.network_icon,
    asset.networkImage,
    asset.network_icon_url,
    asset.chain_image,
    asset.chain_icon,
  ];
  for (const raw of candidates) {
    const url = sanitizeUrl(raw);
    if (url) return enhanceCloudinaryUrl(url, 48) || url;
  }
  return undefined;
}

function trustWalletChainIcon(chain: string): string {
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chain}/info/logo.png`;
}

/**
 * Icon URL for the blockchain/network badge (bottom-right overlay).
 * Prefers API-provided network image, then local map, then Trust Wallet assets.
 */
export function resolveNetworkIconSrc(
  asset?: NetworkIconAssetLike | null,
  size = 48
): string | undefined {
  const fromApi = pickNetworkImageFromAsset(asset);
  if (fromApi) return fromApi;

  const network = normalizeNetworkKey(
    resolveAssetNetwork(asset) || asset?.network || ""
  );
  if (!network) return undefined;

  const local = LOCAL_NETWORK_ICONS[network];
  if (local) return local;

  const chain = TRUSTWALLET_CHAIN_BY_NETWORK[network];
  if (chain) return trustWalletChainIcon(chain);

  // Partial match (e.g. "arbitrumone" → "arbitrum")
  for (const [key, chainName] of Object.entries(TRUSTWALLET_CHAIN_BY_NETWORK)) {
    if (network.includes(key) || key.includes(network)) {
      return trustWalletChainIcon(chainName);
    }
  }

  return undefined;
}
