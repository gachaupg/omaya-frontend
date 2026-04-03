'use client';

import { useEffect, useMemo, useState } from "react";

import { API_CONFIG, CHANGE_NOW_PUBLIC_ASSET_ID_OVERRIDES } from "@/lib/appConfig";

const CHANGE_NOW_API_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.SWAP.SUPPORTED_ASSETS_PUBLIC}`;

interface ChangeNowApiAsset {
  ticker?: string;
  name?: string;
  image?: string;
  network?: string;
  asset_id?: string | null;
  legacyTicker?: string;
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

// Cache for public supported-tokens response.
// This avoids refetching when the user revisits deposit/withdraw dropdowns.
const PUBLIC_ASSETS_CACHE_KEY =
  "omaya_changenow_public_supported_tokens_v3";
const PUBLIC_ASSETS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let inMemoryPublicAssetsCache:
  | { ts: number; assets: ChangeNowMappedAsset[] }
  | null = null;

function readPublicAssetsCacheFromLocalStorage(): {
  ts: number;
  assets: ChangeNowMappedAsset[];
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PUBLIC_ASSETS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      ts?: number;
      assets?: ChangeNowMappedAsset[];
    };
    if (!parsed.ts || !Array.isArray(parsed.assets)) return null;
    return { ts: parsed.ts, assets: parsed.assets };
  } catch {
    return null;
  }
}

function writePublicAssetsCacheToLocalStorage(assets: ChangeNowMappedAsset[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PUBLIC_ASSETS_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), assets })
    );
  } catch {
    // ignore cache write failures (quota, privacy mode, etc.)
  }
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

const isUuid = (value: unknown): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim()
  );

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

  // Prefer explicit network from API payload (e.g. { ticker: "usdc", network: "bsc" }).
  if (!network && asset.network) {
    const explicit = asset.network.toLowerCase();
    network = networkNameMap[explicit] || explicit.replace(/[\s_-]/g, "");
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

  const rawChangeNowTicker =
    asset.legacyTicker?.trim().toLowerCase() || rawTicker;
  const apiAssetId = String(asset.asset_id || "").trim();
  const overrideKey = `${ticker.toLowerCase()}-${networkId}`;
  const overrideAssetId = String(
    CHANGE_NOW_PUBLIC_ASSET_ID_OVERRIDES[overrideKey] || ""
  ).trim();
  const resolvedAssetId = isUuid(apiAssetId)
    ? apiAssetId
    : isUuid(overrideAssetId)
      ? overrideAssetId
      : "";

  return {
    // Prefer API UUID; else backend override map for this ticker+network.
    asset_id: resolvedAssetId,
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
    original_ticker: rawChangeNowTicker,
    change_now_ticker: rawChangeNowTicker,
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

    // Serve cached data immediately (public assets are relatively stable).
    // If cache is fresh, we don't refetch.
    const now = Date.now();
    const cached =
      (inMemoryPublicAssetsCache &&
        now - inMemoryPublicAssetsCache.ts < PUBLIC_ASSETS_CACHE_TTL_MS
        ? inMemoryPublicAssetsCache
        : null) ||
      readPublicAssetsCacheFromLocalStorage();
    const staleCached = cached && Array.isArray(cached.assets) ? cached.assets : [];
    const cachedHasOnlyUuidAssetIds =
      !!cached &&
      Array.isArray(cached.assets) &&
      cached.assets.every((item) => isUuid(item?.asset_id));

    const isFresh =
      !!cached &&
      now - cached.ts < PUBLIC_ASSETS_CACHE_TTL_MS &&
      cachedHasOnlyUuidAssetIds;

    if (isFresh) {
      setAssets(cached!.assets);
      setLoading(false);
      setError(null);
      return () => controller.abort();
    }

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

        const finalAssets = mappedAssets;
        setAssets(finalAssets);

        // Save cache after successful fetch.
        inMemoryPublicAssetsCache = { ts: Date.now(), assets: finalAssets };
        writePublicAssetsCacheToLocalStorage(finalAssets);
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") {
          return;
        }

        const message =
          err instanceof Error
            ? err.message
            : "Unknown error while fetching ChangeNOW assets";

        setError(message);
        // Never inject fake fallback assets; prefer already loaded assets,
        // then stale cache, otherwise keep empty and surface error.
        setAssets((prev) =>
          prev.length ? prev : staleCached.length ? staleCached : []
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();

    return () => controller.abort();
  }, [shouldFetch]);

  return {
    // IMPORTANT: return the full asset list so dropdown search can find
    // assets that might otherwise fall outside an arbitrary slice window.
    assets,
    loading,
    error,
  };
}



