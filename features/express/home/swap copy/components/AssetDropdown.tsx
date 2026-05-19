import React from "react";
import { SupportedAsset } from "../types";
import { assetMatchesSearchTerm } from "@/lib/utils/assetSearch";
import {
  handleSwapAssetIconError,
  resolveSwapAssetIconSrc,
} from "@/features/swap/utils/swapAssetIcon";
import { SwapAssetOptionDisplay } from "@/features/swap/components/SwapAssetOptionDisplay";
import { swapAssetTriggerClass } from "@/features/swap/components/swapFieldStyles";

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
  isDark?: boolean;
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
  isDark = false,
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
        className={className || swapAssetTriggerClass(isDark)}
      >
        {selectedAsset ? (
          <div className="flex items-center min-w-0 flex-1 gap-3">
            <img
              src={resolveSwapAssetIconSrc(selectedAsset)}
              alt={selectedAsset.name || "Asset"}
              className="w-6 h-6 rounded-full object-cover shrink-0"
              onError={(e) => handleSwapAssetIconError(e, selectedAsset)}
            />
            <SwapAssetOptionDisplay
              asset={selectedAsset}
              showSubtitle={false}
              primaryClassName={`text-sm ${isDark ? "text-white font-normal" : "text-[#1F2937] font-extrabold"}`}
            />
          </div>
        ) : (
          <span className={isDark ? "text-[#788099]" : "text-[#64748B]"}>
            {placeholder}
          </span>
        )}
        <svg
          className={`w-5 h-5 shrink-0 text-[#7e7e8f] transition-transform ${
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
          className="absolute top-full left-0 right-0 mt-1 dark:bg-[#23232b] bg-white dark:border-[#35353E] border-gray-300 border rounded-xl z-50 max-h-60 overflow-y-auto"
          role="listbox"
          aria-label={`${label} options`}
        >
          <div className="p-3 dark:border-[#35353E] border-gray-200 border-b">
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full dark:bg-[#181820] bg-gray-50 dark:border-[#35353E] border-gray-300 border rounded-lg px-3 py-2 dark:text-white text-gray-900 dark:placeholder-[#8C8CA1] placeholder-gray-500 outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="py-2">
            {assets
              .filter((asset) => assetMatchesSearchTerm(asset, searchTerm))
              .map((asset, index) => (
                <div
                  key={asset.asset_id || `asset-${index}`}
                  onClick={() => handleAssetSelect(asset)}
                  role="option"
                  tabIndex={0}
                  className="flex items-center px-3 py-2 hover:bg-[#35353E] cursor-pointer gap-3"
                >
                  <img
                    src={resolveSwapAssetIconSrc(asset)}
                    alt={asset.name || "Asset"}
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                    onError={(e) => handleSwapAssetIconError(e, asset)}
                  />
                  <SwapAssetOptionDisplay
                    asset={asset}
                    showSubtitle
                    primaryClassName={`text-sm ${isDark ? "text-white" : "text-[#1F2937]"}`}
                    subtitleClassName="text-sm text-gray-500 dark:text-gray-400 truncate"
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
