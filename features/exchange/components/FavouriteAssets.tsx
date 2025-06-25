import React, { useState, useEffect } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react"
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { fetchAssets, addFavoriteAsset, getFavoriteAssets } from "../slices/exchangeSlice";
import toast from 'react-hot-toast';
import { FavoriteAsset, Asset } from "../types";

// Dummy data for missing fields
const DUMMY_ASSET_DATA: Record<string, { symbol: string; price: number; change: string }> = {
  "USDT Tether": { symbol: "USDT", price: 0.99, change: "+0.01%" },
  "USD Coin": { symbol: "USDC", price: 1.00, change: "+0.02%" },
  "FXPRIMUS": { symbol: "FXP", price: 1.00, change: "+0.00%" },
};

const FavouriteAssets: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { assets: allAvailableAssets, favoriteAssets, loading } = useSelector((state: RootState) => state.exchange);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!allAvailableAssets) {
      dispatch(fetchAssets());
    }
    dispatch(getFavoriteAssets());
    // eslint-disable-next-line
  }, []);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    setSearchTerm(''); // Clear search term when opening/closing
  };

  const handleAddToFavorites = async (assetId: string) => {
    try {
      await dispatch(addFavoriteAsset({ asset_id: assetId })).unwrap();
      toast.success('Asset added to favorites!');
      setShowDropdown(false);
      dispatch(fetchAssets());
    } catch (error: any) {
      toast.error(`Failed to add asset to favorites: ${error || 'Unknown error' || 'unexpected error occured'}`);
    }
  };

  const filteredAvailableAssets = allAvailableAssets?.assets?.filter((asset: Asset) => 
    asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <ul className="py-1">
              {filteredAvailableAssets.length > 0 ? (
                filteredAvailableAssets.map((asset: Asset) => (
                  <li 
                    key={asset.asset_id} 
                    className="px-4 py-2 text-sm text-[#9CA3AF] hover:bg-[#35353E] cursor-pointer"
                    onClick={() => handleAddToFavorites(asset.asset_id)}
                  >
                    <span className="text-white mr-2">{asset.symbol}</span>{asset.name}
                  </li>
                ))
              ) : (
                <li className="px-4 py-2 text-sm text-[#9CA3AF]">No assets found</li>
              )}
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
        {loading ? (
          <div className="col-span-3 text-center text-white">Loading...</div>
        ) : favoriteAssets?.slice(0, 3).map((asset: FavoriteAsset) => {
          const dummyData = DUMMY_ASSET_DATA[asset.asset_name] || { 
            symbol: asset.asset_name.split(' ')[0], 
            price: 0, 
            change: "+0.00%" 
          };
          return (
            <div key={asset.favorite_asset_id} className="bg-[#1D1D23] rounded-2xl p-4 flex items-center gap-3 border border-[#35353E]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  dummyData.symbol === "BTC"
                    ? "bg-orange-500"
                    : dummyData.symbol === "ETH"
                      ? "bg-blue-500"
                      : "bg-red-500"
                }`}
              >
                <span className="text-white text-xs font-bold">{dummyData.symbol.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">{dummyData.symbol}</div>
                <div className="text-xs text-[#788099] truncate">{asset.asset_name}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-bold text-white whitespace-nowrap">
                  ${dummyData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                </div>
                <div
                  className={`text-xs whitespace-nowrap ${dummyData.change.startsWith("+") ? "text-[#1D8751]" : "text-[#1D8751]"}`}
                >
                  {dummyData.change}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FavouriteAssets; 