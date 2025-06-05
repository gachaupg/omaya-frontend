import React, { useState } from "react";
import DepositModal from "./DepositModal";

interface Asset {
  asset_id: string;
  symbol: string;
  description: string;
  asset_image: string;
  price: number;
  network: string;
  isFavourite?: boolean;
}

interface Broker {
  broker_id: string;
  name: string;
  description: string;
  broker_image: string;
  price: number;
  network: string;
  isFavourite?: boolean;
}

type Props = {
  selectedAction: "deposit" | "withdraw";
  selectedType: "crypto" | "forex";
  onTypeChange: (type: "crypto" | "forex") => void;
  assets: Asset[];
  brokers: Broker[];
  onBack: () => void;
  onActionChange: (action: "deposit" | "withdraw") => void;
};

const TransactionTypePanel: React.FC<Props> = ({
  selectedAction,
  selectedType,
  onTypeChange,
  assets,
  brokers,
  onBack,
  onActionChange,
}) => {
  const options = selectedType === "crypto" ? assets : brokers;

  const [selectedAsset, setSelectedAsset] = useState<Asset | Broker | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);

  return (
    <div className="w-full rounded-lg">
      {showDepositModal && selectedAsset && (
        <DepositModal />
      )}
      {!showDepositModal && (
        <>
          {selectedAsset ? (
            <div className="mb-4">
              <div className="text-white text-sm">
                {selectedType === "crypto" ? (selectedAsset as Asset).symbol : (selectedAsset as Broker).name}
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
            Choose from the cryptocurrencies or Forex brokers listed below to proceed.
          </p>
          <div className="overflow-x-auto rounded-2xl">
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
                {options.map((item: any) => (
                  <tr 
                    key={item.asset_id || item.broker_id} 
                    className="border-b border-[#23242B] hover:bg-[#35353E] transition-colors cursor-pointer" 
                    onClick={() => {
                      setSelectedAsset(item);
                      setShowDepositModal(true);
                    }}
                  >
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img 
                        src={item.asset_image || item.broker_image} 
                        alt={item.symbol || item.name} 
                        className="w-7 h-7 rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null; // Prevent infinite loop
                          // Fallback to a simple colored circle with the first letter of the asset/broker name
                          const name = (item.symbol || item.name || '?')[0].toUpperCase();
                          target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="14" fill="%231D8751"/><text x="14" y="18" font-family="Arial" font-size="14" fill="white" text-anchor="middle">${name}</text></svg>`;
                        }}
                      />
                      <div>
                        <div className="text-white font-medium text-sm">{item.symbol || item.name}</div>
                        <div className="text-[#9CA3AF] text-xs">{item.description}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#F79330] font-semibold text-sm">${item.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</td>
                    <td className="py-3 px-4 text-[#9CA3AF] text-sm">{item.network}</td>
                    <td className="py-3 px-4">
                      <span className="text-[#F79330] text-lg cursor-pointer">{item.isFavourite ? "★" : "☆"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-4 h-4">
              <img src="https://res.cloudinary.com/dam1sxczj/image/upload/v1748601844/Icon_1_yzegcg.png" alt=""/>
            </div>  
            <p className="text-[#1D8751] text-sm cursor-pointer">For more {selectedType === "crypto" ? "crypto assets" : "forex brokers"}, please contact us via Customer Support</p>
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionTypePanel; 