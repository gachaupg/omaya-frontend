"use client";

import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SupportedAsset } from "@/features/swap/types";
import { getHighResAssetIcon } from "../../utils/imageHelpers";

export type AssetDropdownRow =
  | { type: "section"; key: string; label: string }
  | { type: "divider"; key: string }
  | { type: "asset"; key: string; asset: SupportedAsset };

const SECTION_H = 36;
const DIVIDER_H = 10;
const ASSET_H = 76;
const OVERSCAN = 6;
const VIEWPORT_H = 240; /* max-h-60 */

function rowHeight(row: AssetDropdownRow): number {
  if (row.type === "section") return SECTION_H;
  if (row.type === "divider") return DIVIDER_H;
  return ASSET_H;
}

function buildPrefixHeights(rows: AssetDropdownRow[]): number[] {
  const prefix: number[] = [0];
  for (let i = 0; i < rows.length; i++) {
    prefix.push(prefix[i] + rowHeight(rows[i]));
  }
  return prefix;
}

function visibleSlice(
  prefix: number[],
  scrollTop: number,
  viewport: number
): { start: number; end: number } {
  const n = prefix.length - 1;
  if (n === 0) return { start: 0, end: 0 };
  const v = Math.max(viewport, 120);
  const bottom = scrollTop + v;
  let start = 0;
  while (start < n && prefix[start + 1] <= scrollTop) start++;
  start = Math.max(0, start - OVERSCAN);
  let end = start;
  while (end < n && prefix[end] < bottom) end++;
  end = Math.min(n, end + OVERSCAN);
  if (end <= start) end = Math.min(n, start + 1);
  return { start, end };
}

const getNetworkDisplayName = (network: string) => {
  const networkMap: Record<string, string> = {
    bsc: "BSC",
    matic: "Polygon",
    avaxc: "Avalanche",
    eth: "Ethereum",
    osmo: "Osmosis",
    band: "Band Protocol",
    sol: "Solana",
    nano: "Nano",
    sxp: "Solar",
    luna: "Terra",
    base: "Base",
    trc20: "TRON",
    trx: "TRON",
  };
  return networkMap[network?.toLowerCase()] || network || "Unknown";
};

const AssetRow = React.memo(function AssetRow({
  asset,
  selected,
  onSelect,
}: {
  asset: SupportedAsset;
  selected: boolean;
  onSelect: (a: SupportedAsset) => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 text-black dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-[#A2A4A9FF] dark:border-[#35353E] transition-colors duration-150 h-[76px] box-border ${
        selected ? "bg-blue-50 dark:bg-blue-900/20" : ""
      }`}
      onClick={() => onSelect(asset)}
    >
      <img
        src={getHighResAssetIcon(asset, 72)}
        alt={
          asset?.name || asset?.ticker || asset?.symbol || "Asset"
        }
        className="w-6 h-6 rounded-full object-cover shrink-0"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = getHighResAssetIcon(null, 72);
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[#1F2937] dark:text-[#ffffff] font-medium text-sm flex items-center gap-2 flex-wrap">
          {(asset.ticker || asset.symbol || asset.name || "Unknown").toUpperCase()}
          <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-[10px] font-normal px-2 py-0.5 rounded-full shrink-0">
            {getNetworkDisplayName(asset.network || "")}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {asset.name ||
            (asset.ticker || "").toUpperCase() ||
            (asset.symbol || "").toUpperCase() ||
            "Unknown Asset"}
          {asset.legacy_ticker && (
            <span className="text-[10px] text-[#f7c624] dark:text-[#f7c624] bg-[#f7c6241a] px-1 py-0.5 rounded-full ml-1">
              {asset.legacy_ticker}
            </span>
          )}
        </div>
      </div>
      {selected && (
        <div className="w-2 h-2 bg-[#1D8751] rounded-full shrink-0" />
      )}
    </div>
  );
});

function renderRowNode(
  row: AssetDropdownRow,
  selectedAsset: SupportedAsset | null,
  onSelect: (a: SupportedAsset) => void,
  index: number
): React.ReactNode {
  if (row.type === "section") {
    return (
      <div
        key={`${row.key}-${index}`}
        className="px-3 py-2 bg-[#F5F6F7] dark:bg-[#23232B] border-b border-[#A2A4A9FF] dark:border-[#35353E] flex items-center h-[36px] box-border shrink-0"
      >
        <span className="text-xs font-semibold text-[#788099] uppercase tracking-wider">
          {row.label}
        </span>
      </div>
    );
  }
  if (row.type === "divider") {
    return (
      <div
        key={`${row.key}-${index}`}
        className="border-t-2 border-[#D1D2D4FF] dark:border-[#35353E] h-[10px] shrink-0"
      />
    );
  }
  const sel =
    selectedAsset?.asset_id === row.asset.asset_id ||
    (selectedAsset?.ticker === row.asset.ticker &&
      selectedAsset?.network === row.asset.network);
  return (
    <AssetRow
      key={`${row.key}-${index}`}
      asset={row.asset}
      selected={!!sel}
      onSelect={onSelect}
    />
  );
}

/** Above this count, use virtual scrolling (below: simple list — most reliable). */
const VIRTUALIZE_THRESHOLD = 80;

export const AssetDropdownVirtualized = React.memo(function AssetDropdownVirtualized({
  rows,
  selectedAsset,
  onAssetSelect,
}: {
  rows: AssetDropdownRow[];
  selectedAsset: SupportedAsset | null;
  onAssetSelect: (asset: SupportedAsset) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prefixRef = useRef<number[]>([0]);
  const [slice, setSlice] = useState(() => ({
    start: 0,
    end: Math.min(32, Math.max(rows.length, 1)),
  }));

  const prefix = useMemo(() => buildPrefixHeights(rows), [rows]);
  prefixRef.current = prefix;
  const totalH = prefix[prefix.length] ?? 0;
  const useVirtual = rows.length > VIRTUALIZE_THRESHOLD;

  const updateSlice = useCallback(() => {
    const el = scrollRef.current;
    const pref = prefixRef.current;
    if (rows.length === 0) {
      setSlice({ start: 0, end: 0 });
      return;
    }
    if (!el) return;
    const h = el.getBoundingClientRect().height || VIEWPORT_H;
    const { start, end } = visibleSlice(pref, el.scrollTop, h);
    setSlice((s) => (s.start !== start || s.end !== end ? { start, end } : s));
  }, [rows.length]);

  useLayoutEffect(() => {
    if (!useVirtual || rows.length === 0) return;
    setSlice((s) => {
      const nextEnd = Math.min(rows.length, Math.max(s.end, 24));
      if (s.start === 0 && s.end < nextEnd) return { start: 0, end: nextEnd };
      return s;
    });
  }, [rows.length, useVirtual]);

  useLayoutEffect(() => {
    if (!useVirtual) return;
    updateSlice();
  }, [rows, useVirtual, updateSlice]);

  useLayoutEffect(() => {
    if (!useVirtual) return;
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => updateSlice());
    ro.observe(el);
    return () => ro.disconnect();
  }, [useVirtual, updateSlice]);

  const onScroll = useCallback(() => {
    if (useVirtual) updateSlice();
  }, [useVirtual, updateSlice]);

  const virtualItems = useMemo(() => {
    if (!useVirtual) return null;
    const out: React.ReactNode[] = [];
    for (let i = slice.start; i < slice.end; i++) {
      const row = rows[i];
      const top = prefix[i];
      if (!row) continue;
      if (row.type === "section") {
        out.push(
          <div
            key={`${row.key}-v-${i}`}
            className="px-3 py-2 bg-[#F5F6F7] dark:bg-[#23232B] border-b border-[#A2A4A9FF] dark:border-[#35353E] flex items-center h-[36px] box-border absolute left-0 right-0 z-[1]"
            style={{ top }}
          >
            <span className="text-xs font-semibold text-[#788099] uppercase tracking-wider">
              {row.label}
            </span>
          </div>
        );
      } else if (row.type === "divider") {
        out.push(
          <div
            key={`${row.key}-v-${i}`}
            className="border-t-2 border-[#D1D2D4FF] dark:border-[#35353E] absolute left-0 right-0 h-[10px] box-border z-[1]"
            style={{ top }}
          />
        );
      } else {
        const sel =
          selectedAsset?.asset_id === row.asset.asset_id ||
          (selectedAsset?.ticker === row.asset.ticker &&
            selectedAsset?.network === row.asset.network);
        out.push(
          <div
            key={`${row.key}-v-${i}`}
            className="absolute left-0 right-0 overflow-hidden z-[1]"
            style={{ top, height: ASSET_H }}
          >
            <AssetRow
              asset={row.asset}
              selected={!!sel}
              onSelect={onAssetSelect}
            />
          </div>
        );
      }
    }
    return out;
  }, [
    useVirtual,
    rows,
    slice.start,
    slice.end,
    prefix,
    selectedAsset,
    onAssetSelect,
  ]);

  if (rows.length === 0) {
    return (
      <div className="p-4 text-center text-[#7e7e8f] dark:text-[#788099]">
        No assets available
      </div>
    );
  }

  if (!useVirtual) {
    return (
      <div
        className="max-h-60 overflow-y-auto overflow-x-hidden flex flex-col"
        style={{ maxHeight: VIEWPORT_H }}
      >
        {rows.map((row, i) => renderRowNode(row, selectedAsset, onAssetSelect, i))}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="h-60 overflow-y-auto overflow-x-hidden"
      style={{ height: VIEWPORT_H, minHeight: VIEWPORT_H }}
      onScroll={onScroll}
    >
      <div
        className="relative w-full isolate"
        style={{
          height: Math.max(totalH, VIEWPORT_H),
          minHeight: Math.max(totalH, VIEWPORT_H),
        }}
      >
        {virtualItems}
      </div>
    </div>
  );
});

/** Build row model for the asset dropdown (single scroll region, virtualized). */
export function buildAssetDropdownRows(
  sortedSwapAssets: SupportedAsset[],
  assetSearchTerm: string,
  whitelistAssets: SupportedAsset[],
  allAssetsList: SupportedAsset[],
  popularAssets?: SupportedAsset[]
): AssetDropdownRow[] {
  const rows: AssetDropdownRow[] = [];
  if (!sortedSwapAssets.length) return rows;

  if (assetSearchTerm) {
    sortedSwapAssets.forEach((asset, i) => {
      rows.push({
        type: "asset",
        key: `s-${asset.asset_id}-${i}`,
        asset,
      });
    });
    return rows;
  }

  const effectivePopularAssets =
    Array.isArray(popularAssets) && popularAssets.length > 0
      ? popularAssets
      : sortedSwapAssets.slice(0, 3);

  if (sortedSwapAssets.length <= 3) {
    effectivePopularAssets.forEach((asset, i) => {
      rows.push({
        type: "asset",
        key: `short-${asset.asset_id}-${i}`,
        asset,
      });
    });
    return rows;
  }

  rows.push({ type: "section", key: "pop-h", label: "Popular" });
  effectivePopularAssets.forEach((asset, i) => {
    rows.push({
      type: "asset",
      key: `pop-${asset.asset_id}-${i}`,
      asset,
    });
  });

  if (whitelistAssets.length > 0) {
    rows.push({ type: "section", key: "wl-h", label: "Whitelist" });
    whitelistAssets.forEach((asset, i) => {
      rows.push({
        type: "asset",
        key: `wl-${asset.asset_id}-${i}`,
        asset,
      });
    });
  }

  rows.push({ type: "divider", key: "div" });
  rows.push({ type: "section", key: "all-h", label: "All Assets" });
  allAssetsList.forEach((asset, i) => {
    rows.push({
      type: "asset",
      key: `all-${asset.asset_id}-${asset.ticker}-${asset.network}-${i}`,
      asset,
    });
  });

  return rows;
}
