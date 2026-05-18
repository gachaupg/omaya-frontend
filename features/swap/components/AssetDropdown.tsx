import React from "react";
import { SupportedAsset } from "../types";
import { assetMatchesSearchTerm } from "@/lib/utils/assetSearch";
import {
  handleSwapAssetIconError,
  resolveSwapAssetIconSrc,
} from "../utils/swapAssetIcon";

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
    onToggle(); // Close the dropdown after selection
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
        className={`w-full cursor-pointer flex items-center justify-between ${
          className ||
          "dark:bg-[var(--card-color)] bg-gray-100 dark:border-[#35353E] border-gray-300 border rounded-[18px] px-3 py-2 dark:text-white text-gray-900"
        }`}
      >
        {selectedAsset ? (
          <div className="flex items-center">
            <img
              src={resolveSwapAssetIconSrc(selectedAsset)}
              alt={selectedAsset.name || "Asset"}
              className="w-6 h-6 mr-3 rounded-full object-cover"
              onError={(e) => handleSwapAssetIconError(e, selectedAsset)}
            />
            <div className="flex flex-col">
              <span className="dark:text-white text-gray-900 text-xs font-medium">
                {selectedAsset.ticker?.toUpperCase()}
              </span>
              <span className="dark:text-[#8C8CA1] text-gray-500 text-xs">
                {selectedAsset.name}
              </span>
            </div>
          </div>
        ) : (
          <span className="dark:text-[#8C8CA1] text-gray-500">
            {placeholder}
          </span>
        )}
        <svg
          className={`w-4 h-4 dark:text-[#8C8CA1] text-gray-500 transition-transform ${
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
            {assets
              .filter((asset) => assetMatchesSearchTerm(asset, searchTerm))
              .map((asset, index) => (
                <div
                  key={asset.asset_id || `asset-${index}`}
                  onClick={() => handleAssetSelect(asset)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAssetSelect(asset);
                    }
                  }}
                  role="option"
                  tabIndex={0}
                  className="flex items-center px-3 py-2 text-xs sm:text-sm dark:hover:bg-[#35353E] hover:bg-gray-100 cursor-pointer"
                >
                  <img
                    src={resolveSwapAssetIconSrc(asset)}
                    alt={asset.name || "Asset"}
                    className="w-6 h-6 mr-3 rounded-full object-cover"
                    onError={(e) => handleSwapAssetIconError(e, asset)}
                  />
                  <div className="flex flex-col">
                    <span className="dark:text-white text-gray-900 text-xs sm:text-sm font-medium">
                      {asset.ticker?.toUpperCase()}
                    </span>
                    <span className="dark:text-[#8C8CA1] text-gray-500 text-xs">
                      {asset.name}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetDropdown;
