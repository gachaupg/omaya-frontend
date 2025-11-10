'use client';

import { useEffect, useMemo, useState } from "react";

const CHANGE_NOW_API_URL =
  "https://api.changenow.io/v1/currencies?active=true&fixedRate=true";

interface ChangeNowApiAsset {
  ticker?: string;
  name?: string;
  image?: string;
  hasExternalId?: boolean;
  isExtraIdSupported?: boolean;
  isFiat?: boolean;
  isStable?: boolean;
  featured?: boolean;
  supportsFixedRate?: boolean;
}

export interface ChangeNowMappedAsset {
  asset_id: string;
  ticker: string;
  symbol: string;
  name: string;
  network: string;
  networks: Array<{ network_id: string; network_type: string }>;
  image_url: string;
  icon: string;
  is_stable: boolean;
  is_fiat: boolean;
  supportsFixedRate: boolean;
  hasExternalId: boolean;
  is_extra_id_supported: boolean;
  range_commissions: Array<{ commission: string }>;
  commission: string;
  fee_rate: string;
  original_ticker: string;
  change_now_ticker: string;
  featured?: boolean;
}

const suffixToNetwork = [
  { suffix: "erc20", network: "eth" },
  { suffix: "trc20", network: "trc20" },
  { suffix: "bsc", network: "bsc" },
  { suffix: "bep20", network: "bsc" },
  { suffix: "bep2", network: "bep2" },
  { suffix: "matic", network: "matic" },
  { suffix: "sol", network: "sol" },
  { suffix: "avaxc", network: "avaxc" },
  { suffix: "avax", network: "avaxc" },
  { suffix: "arc20", network: "avaxc" },
  { suffix: "arb", network: "arb" },
  { suffix: "op", network: "op" },
  { suffix: "base", network: "base" },
  { suffix: "linea", network: "linea" },
  { suffix: "lna", network: "linea" },
  { suffix: "zksync", network: "zksync" },
  { suffix: "manta", network: "manta" },
  { suffix: "ton", network: "ton" },
  { suffix: "celo", network: "celo" },
] as const;

const networkNameMap: Record<string, string> = {
  "binance smart chain": "bsc",
  "binance chain": "bep2",
  bsc: "bsc",
  bep2: "bep2",
  ethereum: "eth",
  eth: "eth",
  erc20: "eth",
  polygon: "matic",
  matic: "matic",
  solana: "sol",
  sol: "sol",
  "avax c-chain": "avaxc",
  avalanche: "avaxc",
  arbitrum: "arb",
  "arbitrum one": "arb",
  optimism: "op",
  op: "op",
  base: "base",
  linea: "linea",
  "zk sync era": "zksync",
  "zksync era": "zksync",
  zksync: "zksync",
  manta: "manta",
  tron: "trc20",
  trc20: "trc20",
  ton: "ton",
  celo: "celo",
};

const networkCleanupLabels: Record<string, string[]> = {
  bsc: ["BSC", "Binance Smart Chain", "BEP20", "Binance Chain"],
  bep2: ["BEP2", "Binance Chain"],
  eth: ["ETH", "Ethereum", "ERC20"],
  matic: ["MATIC", "Polygon"],
  sol: ["SOL", "Solana"],
  avaxc: ["AVAX", "Avalanche", "AVAX C-CHAIN", "ARC20"],
  arb: ["ARB", "Arbitrum", "Arbitrum One"],
  op: ["OP", "Optimism"],
  base: ["BASE"],
  linea: ["LINEA"],
  zksync: ["ZKSYNC", "ZkSync Era"],
  manta: ["MANTA"],
  trc20: ["TRC20", "TRON", "TRX"],
  ton: ["TON"],
  celo: ["CELO"],
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const cleanAssetName = (
  rawName: string | undefined,
  ticker: string,
  networkId: string
) => {
  if (!rawName) {
    return ticker;
  }

  let cleaned = rawName;
  const labels = [
    ...new Set([
      networkId,
      networkId.toUpperCase(),
      ...(networkCleanupLabels[networkId] || []),
    ]),
  ].filter(Boolean);

  labels.forEach((label) => {
    const regex = new RegExp(`\\s*\\(${escapeRegExp(label)}\\)`, "gi");
    cleaned = cleaned.replace(regex, "");
  });

  cleaned = cleaned.replace(/\s*\(\s*\)\s*/g, " ");
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();

  return cleaned || ticker;
};

const FALLBACK_ASSETS: ChangeNowMappedAsset[] = [
  {
    asset_id: "usdt-bsc",
    ticker: "USDT",
    symbol: "USDT",
    name: "Tether",
    network: "bsc",
    networks: [{ network_id: "bsc", network_type: "bsc" }],
    image_url:
      "https://content-api.changenow.io/uploads/usdtbsc_b8f3d8f316.svg",
    icon: "https://content-api.changenow.io/uploads/usdtbsc_b8f3d8f316.svg",
    is_stable: true,
    is_fiat: false,
    supportsFixedRate: true,
    hasExternalId: false,
    is_extra_id_supported: false,
    range_commissions: [{ commission: "2.0" }],
    commission: "2.0",
    fee_rate: "2.0",
    original_ticker: "usdtbsc",
    change_now_ticker: "usdtbsc",
    featured: true,
  },
  {
    asset_id: "usdc-matic",
    ticker: "USDC",
    symbol: "USDC",
    name: "USD Coin",
    network: "matic",
    networks: [{ network_id: "matic", network_type: "matic" }],
    image_url:
      "https://content-api.changenow.io/uploads/usdcmatic_e5834ebb53.svg",
    icon: "https://content-api.changenow.io/uploads/usdcmatic_e5834ebb53.svg",
    is_stable: true,
    is_fiat: false,
    supportsFixedRate: true,
    hasExternalId: false,
    is_extra_id_supported: false,
    range_commissions: [{ commission: "2.0" }],
    commission: "2.0",
    fee_rate: "2.0",
    original_ticker: "usdcmatic",
    change_now_ticker: "usdcmatic",
  },
  {
    asset_id: "btc-btc",
    ticker: "BTC",
    symbol: "BTC",
    name: "Bitcoin",
    network: "btc",
    networks: [{ network_id: "btc", network_type: "btc" }],
    image_url:
      "https://content-api.changenow.io/uploads/btc_1_527dc9ec3c.svg",
    icon: "https://content-api.changenow.io/uploads/btc_1_527dc9ec3c.svg",
    is_stable: false,
    is_fiat: false,
    supportsFixedRate: true,
    hasExternalId: false,
    is_extra_id_supported: false,
    range_commissions: [{ commission: "2.0" }],
    commission: "2.0",
    fee_rate: "2.0",
    original_ticker: "btc",
    change_now_ticker: "btc",
    featured: true,
  },
];

const normalizeNetworkFromName = (name?: string): string => {
  if (!name) return "";
  const matches = [...name.matchAll(/\(([^)]+)\)/g)];
  if (!matches.length) return "";
  const lastMatch = matches[matches.length - 1][1].trim().toLowerCase();
  return (
    networkNameMap[lastMatch] ||
    lastMatch.replace(/[\s_-]/g, "").toLowerCase()
  );
};

const mapChangeNowAsset = (
  asset: ChangeNowApiAsset
): ChangeNowMappedAsset | null => {
  const rawTicker = asset.ticker?.trim().toLowerCase();
  if (!rawTicker) {
    return null;
  }

  let baseTicker = rawTicker;
  let network = "";

  for (const { suffix, network: networkCode } of suffixToNetwork) {
    if (rawTicker.endsWith(suffix) && rawTicker.length > suffix.length) {
      baseTicker = rawTicker.slice(0, rawTicker.length - suffix.length);
      network = networkCode;
      break;
    }
  }

  if (!network) {
    network = normalizeNetworkFromName(asset.name);
  }

  if (!network) {
    network = baseTicker;
  }

  const ticker =
    baseTicker && baseTicker.length >= 2
      ? baseTicker.toUpperCase()
      : rawTicker.toUpperCase();

  const networkId = network.toLowerCase();
  const commissionValue = asset.isStable ? "1.5" : "2.0";
  const iconUrl =
    asset.image ||
    `https://cryptoicons.org/api/icon/${ticker.toLowerCase()}/200`;
  const displayName = cleanAssetName(asset.name, ticker, networkId);

  return {
    asset_id: `${ticker.toLowerCase()}-${networkId}`,
    ticker,
    symbol: ticker,
    name: displayName,
    network: networkId,
    networks: [{ network_id: networkId, network_type: networkId }],
    image_url: iconUrl,
    icon: iconUrl,
    is_stable: Boolean(asset.isStable),
    is_fiat: Boolean(asset.isFiat),
    supportsFixedRate: Boolean(asset.supportsFixedRate),
    hasExternalId: Boolean(asset.hasExternalId),
    is_extra_id_supported: Boolean(asset.isExtraIdSupported),
    range_commissions: [{ commission: commissionValue }],
    commission: commissionValue,
    fee_rate: commissionValue,
    original_ticker: rawTicker,
    change_now_ticker: rawTicker,
    featured: asset.featured,
  };
};

export function useChangeNowAssets(shouldFetch: boolean) {
  const [assets, setAssets] = useState<ChangeNowMappedAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldFetch) {
      return;
    }

    const controller = new AbortController();

    const fetchAssets = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(CHANGE_NOW_API_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `ChangeNOW request failed with status ${response.status}`
          );
        }

        const data = (await response.json()) as ChangeNowApiAsset[];

        if (!Array.isArray(data)) {
          throw new Error("Invalid response format from ChangeNOW");
        }

        const uniqueAssets = new Map<string, ChangeNowMappedAsset>();

        for (const item of data) {
          const mappedAsset = mapChangeNowAsset(item);
          if (!mappedAsset) {
            continue;
          }

          const key = `${mappedAsset.ticker}-${mappedAsset.network}`;
          if (!uniqueAssets.has(key)) {
            uniqueAssets.set(key, mappedAsset);
          }
        }

        const mappedAssets = Array.from(uniqueAssets.values());

        setAssets(mappedAssets.length ? mappedAssets : FALLBACK_ASSETS);
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") {
          return;
        }

        const message =
          err instanceof Error
            ? err.message
            : "Unknown error while fetching ChangeNOW assets";

        setError(message);
        setAssets((prev) => (prev.length ? prev : FALLBACK_ASSETS));
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();

    return () => controller.abort();
  }, [shouldFetch]);

  const limitedAssets = useMemo(() => {
    if (!assets.length) {
      return assets;
    }

    return assets.slice(0, 200);
  }, [assets]);

  return {
    assets: limitedAssets,
    loading,
    error,
  };
}



