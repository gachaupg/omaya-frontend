import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../store";
import { RootState } from '../../../store/rootReducer';
import DepositModal from "./DepositModal/index";
import WithdrawModal from "./WithdrawalModal";

import { Asset, Network } from "../types";
import { fetchAssets, clearExchangeError } from "../slices/exchangeSlice";
import toast, { Toaster } from 'react-hot-toast';


// Define asset types based on the choices
const CRYPTO_ASSETS = ['USDT Tether', 'BTC', 'ETH', 'BNB', 'DOGE', 'ADA', 'SOL', 'XRP', 'USD'];

const FOREX_BROKER_INFO: Record<string, { country: string; logo: string }> = {
  FXP: { country: 'Cyprus', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/FXPRIMUS_logo.png' },
  EUR: { country: 'Eurozone', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg' },
  GBP: { country: 'United Kingdom', logo: 'https://upload.wikimedia.org/wikipedia/en/a/ae/Flag_of_the_United_Kingdom.svg' },
  KES: { country: 'Kenya', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Flag_of_Kenya.svg' },
  ICM: { country: 'UAE', logo: 'https://seeklogo.com/images/I/icm-capital-logo-6B1B6B6B2B-seeklogo.com.png' },
  PM: { country: 'Russia', logo: 'https://seeklogo.com/images/P/perfect-money-logo-6B1B6B6B2B-seeklogo.com.png' },
};

type Props = {
  selectedAction: "deposit" | "withdraw";
  selectedType: "crypto" | "forex";
  onTypeChange: (type: "crypto" | "forex") => void;
  onBack: () => void;
  onActionChange: (action: "deposit" | "withdraw") => void;
};

const TransactionTypePanel: React.FC<Props> = ({
  selectedAction,
  selectedType,
  onTypeChange,
  onBack,
  onActionChange,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { assets, loading, error } = useSelector((state: RootState) => state.exchange);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    if (!assets) {
      void dispatch(fetchAssets());
    }
  }, [dispatch, assets]);

  useEffect(() => {
    if (error) {
      toast.dismiss();
      toast.error(error);
      dispatch(clearExchangeError());
    }
  }, [error, dispatch]);

  // Filter assets based on selected type
  const filteredAssets = useMemo(() => {
    if (!assets?.assets) return [];
    return assets.assets.filter((asset: Asset) => {
      const isCrypto = CRYPTO_ASSETS.includes(asset.symbol);
      return selectedType === "crypto" ? isCrypto : !isCrypto;
    });
  }, [assets, selectedType]);

  if (error) {
    return (
      <div className="w-full rounded-lg p-4 text-center text-red-500">
        Error loading assets: {error}
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg">
      <Toaster />
      {showDepositModal && selectedAsset && (
        <DepositModal asset={selectedAsset} assetType={selectedType === 'crypto' ? 'Crypto' : 'Forex'} onClose={() => { setShowDepositModal(false); setSelectedAsset(null); }} />
      )}
      {showWithdrawModal && selectedAsset && (
        <WithdrawModal asset={selectedAsset} assetType={selectedType === 'crypto' ? 'Crypto' : 'Forex'} onClose={() => { setShowWithdrawModal(false); setSelectedAsset(null); }} />
      )}
      {!showDepositModal && !showWithdrawModal && (
        <>
          {selectedAsset ? (
            <div className="mb-4">
              <div className="text-white text-sm">
                {selectedAsset.symbol}
              </div>
            </div>
          ) : (
            <button
              className={`mb-4 text-[#1D8751] hover:bg-[#1D8751] hover:text-white transition-colors`}
              onClick={onBack}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 12H5M12 19L5 12L12 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <div className="w-full flex flex-col md:flex-row md justify-between items-center sm:items-start">
            <div className="flex flex-col  mb-4 gap-2">
              <div className="flex gap-2 items-center">
                <span className="text-white capitalize">{selectedAction} To</span>
              </div>
              <div className="flex gap-2 p-1 rounded-lg border border-[#1D8751]">
                <button
                  className={`px-4 py-2 rounded-lg font-semibold text-sm ${selectedType === "crypto" ? "bg-[#1D8751] text-white border-[#1D8751]" : "bg-transparent text-[#1D8751] border-[#1D8751]"}`}
                  onClick={() => onTypeChange("crypto")}
                >
                  Crypto
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-semibold text-sm ${selectedType === "forex" ? "bg-[#1D8751] text-white " : "bg-transparent text-[#1D8751]"}`}
                  onClick={() => onTypeChange("forex")}
                >
                  Forex
                </button>
              </div>
            </div>
            <div className="flex flex-col  mb-4 gap-2">
              <div className="flex gap-2 items-center">
                <span className="text-white capitalize">Transaction Type</span>
              </div>
              <div className="flex gap-2">
                <button
                  className={`px-4 py-2 rounded-full font-semibold text-sm text-white border flex items-center gap-2 ${
                    selectedAction === "deposit" 
                    ? "bg-[#1D8751] text-white border-[#1D8751]" 
                    : "bg-transparent border-[#1D8751] text-[#1D8751]"
                  }`}
                  onClick={() => onActionChange("deposit")}
                >
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke={selectedAction === "deposit" ? "white" : "#1D8751"}
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7,7 17,7 17,17"></polyline>
                  </svg>
                  Deposit
                </button>
                <button
                  className={`px-4 py-2 rounded-full font-semibold text-sm border flex items-center gap-2 text-white ${
                    selectedAction === "withdraw" 
                    ? "bg-[#E23D3A] border-[#E23D3A]" 
                    : "bg-transparent border-red-900  hover:bg-red-900/10"
                  }`}
                  onClick={() => onActionChange("withdraw")}
                >
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke={selectedAction === "withdraw" ? "white" : "#E23D3A"}
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <line x1="17" y1="7" x2="7" y2="17"></line>
                    <polyline points="17,17 7,17 7,7"></polyline>
                  </svg>
                  Withdraw
                </button>
              </div>
            </div>
          </div>
          <p className="text-[#9CA3AF] text-sm mb-4">
            To {selectedAction} funds, please select your transaction type: Crypto or Forex.<br />
            Choose from the cryptocurrencies or Forex assets listed below to proceed.
          </p>
          <div className="overflow-x-auto rounded-2xl">
            {selectedType === 'crypto' ? (
              <table className="min-w-full b rounded-2xl">
                <thead className="bg-[#35353E] mb-1">
                  <tr className="text-[#9CA3AF] text-left text-sm">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Network</th>
                    <th className="py-3 px-4">Favorite</th>
                  </tr>
                </thead>
                <tbody className="bg-[#1D1D23]">
                  {loading?(
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-white">
                        Loading assets...
                      </td>
                    </tr>
                  ) :(
                    filteredAssets?.map((asset: Asset) => (
                      <tr 
                        key={asset.asset_id} 
                        className="border-b border-[#23242B] hover:bg-[#35353E] transition-colors cursor-pointer" 
                        onClick={() => {
                          setSelectedAsset(asset);
                          if (selectedAction === "deposit") {
                            setShowDepositModal(true);
                          } else {
                            setShowWithdrawModal(true);
                          }
                        }}
                      >
                        <td className="py-3 px-4 flex items-center gap-3">
                          {asset.asset_image ? (
                            <img 
                              src={asset.asset_image}
                              alt={asset.symbol} 
                              className="w-7 h-7 rounded-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                const name = (asset.symbol || '?')[0].toUpperCase();
                                target.src = `data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"28\" height=\"28\" viewBox=\"0 0 28 28\"><circle cx=\"14\" cy=\"14\" r=\"14\" fill=\"%231D8751\"/><text x=\"14\" y=\"18\" font-family=\"Arial\" font-size=\"14\" fill=\"white\" text-anchor=\"middle\">${name}</text></svg>`;
                              }}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#1D8751] flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {(asset.symbol || '?')[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="text-white font-medium text-sm">{asset.symbol}</div>
                            <div className="text-[#9CA3AF] text-xs">{asset.description}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#F79330] font-semibold text-sm">
                          {/* Show price if available, otherwise show N/A */}
                          {typeof (asset as any).price === 'number' ? `$${(asset as any).price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-[#9CA3AF] text-sm">
                          {asset?.networks?.map((network: Network) => network.network_type).join(', ')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[#F79330] text-lg cursor-pointer">☆</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full b rounded-2xl">
                <thead className="bg-[#35353E] mb-1">
                  <tr className="text-[#9CA3AF] text-left text-sm">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Country</th>
                    <th className="py-3 px-4">More</th>
                  </tr>
                </thead>
                <tbody className="bg-[#1D1D23]">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="text-center py-4 text-white">
                        Loading assets...
                      </td>
                    </tr>
                  ):(
                    filteredAssets?.map((asset: Asset) => {
                      // Prefer asset.asset_image, fallback to mapping logo
                      const info = {
                        country: (FOREX_BROKER_INFO[asset.symbol]?.country) || asset.description || 'N/A',
                        logo: asset.asset_image || FOREX_BROKER_INFO[asset.symbol]?.logo || null
                      };
                      return (
                        <tr 
                          key={asset.asset_id} 
                          className="border-b border-[#23242B] hover:bg-[#35353E] transition-colors cursor-pointer" 
                          onClick={() => {
                            setSelectedAsset(asset);
                            if (selectedAction === "deposit") {
                              setShowDepositModal(true);
                            } else {
                              setShowWithdrawModal(true);
                            }
                          }}
                        >
                          <td className="py-3 px-4 flex items-center gap-3">
                            {info.logo ? (
                              <img 
                                src={info.logo}
                                alt={asset.symbol} 
                                className="w-7 h-7 rounded-full"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  const name = (asset.symbol || '?')[0].toUpperCase();
                                  target.src = `data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"28\" height=\"28\" viewBox=\"0 0 28 28\"><circle cx=\"14\" cy=\"14\" r=\"14\" fill=\"%231D8751\"/><text x=\"14\" y=\"18\" font-family=\"Arial\" font-size=\"14\" fill=\"white\" text-anchor=\"middle\">${name}</text></svg>`;
                                }}
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[#1D8751] flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {(asset.symbol || '?')[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="text-white font-medium text-sm">{asset.symbol}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#9CA3AF] text-sm">{info.country}</td>
                          <td className="py-3 px-4">
                            <span className="text-[#F79330] text-lg cursor-pointer">★</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-4 h-4">
              <img src="https://res.cloudinary.com/dam1sxczj/image/upload/v1748601844/Icon_1_yzegcg.png" alt=""/>
            </div>  
            <p className="text-[#1D8751] text-sm cursor-pointer">For more {selectedType === "crypto" ? "crypto assets" : "forex assets"}, please contact us via Customer Support</p>
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionTypePanel; 