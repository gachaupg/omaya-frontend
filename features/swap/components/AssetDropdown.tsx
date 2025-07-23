import React from "react";
import { SupportedAsset } from "../types";

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
        className="w-full dark:bg-[#181820] bg-white border dark:border-[#35353E] border-gray-300 rounded-[18px] px-3 py-2 dark:text-white text-[#0D0D0D] cursor-pointer flex items-center justify-between"
      >
        {selectedAsset ? (
          <div className="flex items-center">
            <img
              src={selectedAsset.image || undefined}
              alt={selectedAsset.name || "Asset"}
              className="w-6 h-6 mr-3"
            />
            <div className="flex flex-col">
              <span className="dark:text-white text-[#0D0D0D] text-xs font-medium">
                {selectedAsset.ticker?.toUpperCase()}
              </span>
              <span className="dark:text-[#8C8CA1] text-[#788099] text-xs">
                {selectedAsset.name}
              </span>
            </div>
          </div>
        ) : (
          <span className="dark:text-[#8C8CA1] text-[#788099]">
            {placeholder}
          </span>
        )}
        <svg
          className={`w-4 h-4 dark:text-[#8C8CA1] text-[#788099] transition-transform ${
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
        <div className="absolute top-full left-0 right-0 mt-1 dark:bg-[#181820] bg-white border dark:border-[#35353E] border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full dark:bg-[#35353E] bg-gray-100 border dark:border-[#40404A] border-gray-300 rounded-lg px-3 py-2 dark:text-white text-[#0D0D0D] text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {assets
              .filter(
                (asset) =>
                  !searchTerm ||
                  asset.name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  asset.ticker?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => handleAssetSelect(asset)}
                  className="px-3 py-2 dark:hover:bg-[#35353E] hover:bg-gray-100 cursor-pointer flex items-center"
                >
                  <img
                    src={asset.image || undefined}
                    alt={asset.name || "Asset"}
                    className="w-6 h-6 mr-3"
                  />
                  <div className="flex flex-col">
                    <span className="dark:text-white text-[#0D0D0D] text-sm font-medium">
                      {asset.ticker?.toUpperCase()}
                    </span>
                    <span className="dark:text-[#8C8CA1] text-[#788099] text-xs">
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
