import React from "react";
import { SupportedAsset } from "../types";
import {
  assetMatchesSearchTerm,
  sortAssetsForDisplay,
} from "@/lib/utils/assetSearch";
import { AssetWithNetworkIcon } from "@/components/ui/AssetWithNetworkIcon";
import {
  handleSwapAssetIconError,
  resolveSwapAssetIconSrc,
} from "../utils/swapAssetIcon";
import { SwapAssetOptionDisplay } from "./SwapAssetOptionDisplay";

interface AssetDropdownProps {
  assets: SupportedAsset[];
  selectedAsset: SupportedAsset | null;
  onAssetSelect: (asset: SupportedAsset) => void;
  isOpen: boolean;
  onToggle: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder: string;
  label: string;
  className?: string;
}

const AssetDropdown: React.FC<AssetDropdownProps> = ({
  assets,
  selectedAsset,
  onAssetSelect,
  isOpen,
  onToggle,
  searchTerm,
  onSearchChange,
  placeholder,
  label,
  className,
}) => {
  const handleAssetSelect = (asset: SupportedAsset) => {
    onAssetSelect(asset);
    onSearchChange("");
    onToggle();
  };

  return (
    <div className="relative asset-dropdown">
      <div
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={0}
        className={`w-full cursor-pointer flex items-center justify-between h-[44px] ${
          className ||
          "dark:bg-[var(--card-color)] bg-gray-100 dark:border-[#35353E] border-gray-300 border rounded-2xl px-4 py-2 dark:text-white text-gray-900"
        }`}
      >
        {selectedAsset ? (
          <div className="flex items-center min-w-0 flex-1">
            <AssetWithNetworkIcon
              asset={selectedAsset}
              size={24}
              className="mr-3"
              assetIconSrc={resolveSwapAssetIconSrc(selectedAsset)}
              onAssetIconError={(e) => handleSwapAssetIconError(e, selectedAsset)}
            />
            <SwapAssetOptionDisplay
              asset={selectedAsset}
              showSubtitle
              primaryClassName="dark:text-white text-gray-900 text-sm font-semibold"
              subtitleClassName="text-[10px] leading-tight dark:text-[#788099] text-[#64748B] truncate"
            />
          </div>
        ) : (
          <span className="dark:text-[#8C8CA1] text-gray-500">{placeholder}</span>
        )}
        <svg
          className={`w-4 h-4 shrink-0 dark:text-[#8C8CA1] text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1 dark:bg-[var(--card-color)] bg-white dark:border-[#35353E] border-gray-300 border rounded-xl z-50 max-h-[70vh] sm:max-h-60 overflow-y-auto"
          role="listbox"
          aria-label={`${label} options`}
        >
          <div className="p-2 sm:p-3 dark:border-[#35353E] border-gray-200 border-b">
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full dark:bg-[var(--card-color)] bg-gray-50 dark:border-[#35353E] border-gray-300 border rounded-lg px-3 py-1.5 sm:py-2 text-xs sm:text-sm dark:text-white text-gray-900 dark:placeholder-[#8C8CA1] placeholder-gray-500 outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="py-1 sm:py-2 max-h-[50vh] sm:max-h-60 overflow-y-auto">
            {sortAssetsForDisplay(
              assets.filter((asset) => assetMatchesSearchTerm(asset, searchTerm)),
              searchTerm
            ).map((asset, index) => (
                <div
                  key={asset.asset_id || `asset-${index}`}
                  onClick={() => handleAssetSelect(asset)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAssetSelect(asset);
                  }}
                  role="option"
                  tabIndex={0}
                  className="flex items-center px-3 py-2 text-xs sm:text-sm dark:hover:bg-[#35353E] hover:bg-gray-100 cursor-pointer"
                >
                  <AssetWithNetworkIcon
                    asset={asset}
                    size={24}
                    className="mr-3"
                    assetIconSrc={resolveSwapAssetIconSrc(asset)}
                    onAssetIconError={(e) => handleSwapAssetIconError(e, asset)}
                  />
                  <SwapAssetOptionDisplay
                    asset={asset}
                    showSubtitle={true}
                    primaryClassName="dark:text-white text-gray-900 text-xs sm:text-sm font-medium"
                    subtitleClassName="dark:text-[#8C8CA1] text-gray-500 text-xs truncate"
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetDropdown;
