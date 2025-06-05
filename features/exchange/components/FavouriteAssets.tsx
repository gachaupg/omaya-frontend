import React, { useState } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react"

type Asset = {
  id:string;
  symbol: string;
  name: string;
  price: number;
  change: string;
};

type FavouriteAssetsProps = {
  assets: Asset[];
};

const FavouriteAssets: React.FC<FavouriteAssetsProps> = ({ assets }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative">
        <h2 className="text-white text-xl font-semibold">Favourite Assets</h2>
        <button 
          className="flex items-center gap-1 text-xs rounded-md text-white self-start sm:self-auto"
          onClick={toggleDropdown}
        >
          Add Asset
          <Plus className="w-3 h-3 text-[#1D8751]" />
        </button>
        {/* Dropdown Content */}
        {showDropdown && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-[#23242B] rounded-md shadow-lg z-10">
            <div className="relative mt-2 item-center ml-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#1D8751] w-4 h-4" />
              <input
                type="text"
                placeholder="Search"
                className="bg-transparent border border-[#2D2E3A] rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#10B981] w-44"
              />
            </div>
            <ul className="py-1">
              <li className="px-4 py-2 text-sm text-[#9CA3AF] hover:bg-[#35353E] cursor-pointer"><span className="text-white mr-2">XRP</span>Repo</li>
              <li className="px-4 py-2 text-sm text-[#9CA3AF] hover:bg-[#35353E] cursor-pointer"><span className="text-white mr-2">BTC</span>Bitcoin</li>
              <li className="px-4 py-2 text-sm text-[#9CA3AF] hover:bg-[#35353E] cursor-pointer"><span className="text-white mr-2">TRX</span>Tron</li>
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-4">
          <div className="flex gap-2">
            <button>
              <ChevronLeft className="w-4 h-4 text-[#1D8751]" />
            </button>
            <button>
              <ChevronRight className="w-4 h-4 text-[#1D8751]" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.slice(0, 3).map((asset, index) => (
          <div key={index} className="bg-[#1D1D23] rounded-2xl p-4 flex items-center gap-3 border border-[#35353E]">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                asset.symbol === "BTC"
                  ? "bg-orange-500"
                  : asset.symbol === "ETH"
                    ? "bg-blue-500"
                    : "bg-red-500"
              }`}
            >
              <span className="text-white text-xs font-bold">{asset.symbol.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white truncate">{asset.symbol}</div>
              <div className="text-xs text-[#788099] truncate">{asset.name}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-white whitespace-nowrap">
                {asset.price}
              </div>
              <div
                className={`text-xs whitespace-nowrap ${asset.change?.startsWith("+") ? "text-[#1D8751]" : "text-[#1D8751]"}`}
              >
                {asset.change || "+0.00%"} %
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavouriteAssets; 