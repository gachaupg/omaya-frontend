import React from 'react';
import { Asset, Network } from '../../types';
import { ChevronDown } from 'lucide-react';

interface AssetsSelectorProps {
  currentAsset: Asset | null;
  selectedNetwork: Network | null;
  setSelectedNetwork: (network: Network | null) => void;
  currentAssetType: 'Crypto' | 'Forex';
  amount: string;
  setAmount: (amount: string) => void;
  assetAmount: number;
  commission: number;
  commissionRate: number;
  networkFee: number;
  totalFees: number;
  amountNum: number;
}

const AssetsSelector: React.FC<AssetsSelectorProps> = ({
  currentAsset,
  selectedNetwork,
  setSelectedNetwork,
  currentAssetType,
  amount,
  setAmount,
  assetAmount,
  commission,
  commissionRate,
  networkFee,
  totalFees,
  amountNum,
}) => {
  if (!currentAsset) return null;

  return (
    <div className="p-4 rounded-lg bg-[#1D1D23] border border-[#35353E] mb-4">
      <div className={currentAssetType === 'Crypto' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2 items-stretch" : "grid grid-cols-1 md:grid-cols-2 gap-4 mb-2 items-stretch"}>
        {/* Asset */}
        <div className="h-16 flex flex-col justify-end">
          <label className="block text-xs mb-1 text-[#788099]">Asset</label>
          <div className="relative flex items-center bg-[#18181D] rounded-xl px-2 py-1 border border-[#35353E] h-full">
            {currentAsset?.asset_image ? (
              <img src={currentAsset.asset_image} alt={currentAsset.symbol} className="w-6 h-6 rounded-full mr-2" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#1D8751] flex items-center justify-center mr-2">
                <span className="text-white text-xs font-medium">{currentAsset?.symbol?.[0]}</span>
              </div>
            )}
            <span className="text-white text-sm font-medium">{currentAsset?.symbol}</span>
          </div>
        </div>
        {/* Network (Crypto only) */}
        {currentAssetType === 'Crypto' && (
          <div className="h-16 flex flex-col justify-end">
            <label className="block text-xs mb-1 text-[#788099]">Network</label>
            <div className="relative flex items-center bg-[#18181D] rounded-xl px-2 py-1 border border-[#35353E] h-full">
              <select
                value={selectedNetwork?.network_id || ''}
                onChange={(e) => {
                  const selected = currentAsset?.networks.find(
                    (network: Network) => network.network_id === e.target.value
                  );
                  setSelectedNetwork(selected || null);
                }}
                className="w-full bg-[#1D1D23] text-white text-sm font-medium appearance-none focus:outline-none h-full pr-8"
              >
                {currentAsset?.networks.map((network: Network) => (
                  <option key={network.network_id} value={network.network_id}>
                    {network.network_type}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronDown className="h-4 w-4 text-[#788099]" />
              </div>
            </div>
          </div>
        )}
        {/* I want to Receive Net */}
        <div className="h-16 flex flex-col justify-end">
          <label className="block text-xs mb-1 text-[#788099]">I want to Recieve Net</label>
          <div className="flex items-center bg-[#18181D] rounded-xl px-2 py-1 border border-[#35353E] h-full">
            <span className="text-[#1D8751] text-lg font-bold mr-1">$</span>
            <input
              type="text"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="bg-transparent text-white text-sm font-medium w-16 focus:outline-none h-full"
            />
            <select className="bg-transparent text-[#9CA3AF] text-xs font-medium focus:outline-none ml-1 h-full">
              <option>USD</option>
            </select>
          </div>
        </div>
        {/* Asset Amount (Crypto only) */}
        {currentAssetType === "Crypto" && (
          <div className="h-16 flex flex-col justify-end">
            <label className="block text-xs mb-1 text-[#788099]">Asset Amount</label>
            <input
              type="text"
              value={amountNum > 0 ? assetAmount.toFixed(2) : '0.00'}
              readOnly
              className="bg-[#18181D] text-white text-sm font-medium rounded-xl px-3 py-1 border border-[#35353E] w-full h-full focus:outline-none"
            />
          </div>
        )}
      </div>
      {/* Info Row */}
      <div className="flex items-center text-[#F79330] text-xs mt-2 mb-2">
        <svg className="w-4 h-4 text-[#E23D3A] mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#E23D3A" strokeWidth="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="#E23D3A" strokeWidth="2"/><circle cx="12" cy="16" r="1" fill="#E23D3A"/></svg>
        <span className='text-white'>This is only estimated price and its based on current Market Price.  We will fix the price when we receive the funds .</span>
      </div>
      {/* Mode Selection */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 mb-4 mt-4">
        <h1 className="text-white text-sm font-medium">Mode</h1>
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <div className="flex flex-col items-start sm:items-center gap-2 flex-1 sm:flex-initial">
            <div className="flex items-center gap-2 border-b border-[#1D8751] pb-2 w-full">
              <input type="radio" checked readOnly className="accent-[#1D8751] w-4 h-4" />
              <span className="text-white text-sm font-medium">Normal</span>
            </div>
            <span className="text-xs text-[#1D8751] px-2">Can take 1 hour</span>
          </div>
          <div className="flex flex-col items-start sm:items-center gap-2 flex-1 sm:flex-initial">
            <div className="flex items-center gap-2 border-b border-white pb-2 w-full">
              <input type="radio" readOnly className="accent-[#35353E] w-4 h-4" />
              <span className="text-white text-sm font-medium">Express</span>
            </div>
            <span className="text-xs text-[#F79330] px-2">In 5 Minutes</span>
          </div>
        </div>
      </div>
      {/* Amount & Fees */}
      <div className="border border-[#35353E] rounded-xl p-4 bg-transparent mb-4">
        <p className="text-[#788099] text-sm font-medium mb-2">Amount & Fees</p>
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
          <div className="flex-1 flex flex-col justify-start">
            <span className="text-white text-sm mb-2">Net Amount to Transfer</span>
            <div className="w-full">
              <div className="w-full bg-[#35353E] rounded-2xl flex items-center px-2 py-2">
                <button className="flex-1 flex items-center justify-center bg-transparent">
                  <span className="text-[#BDF4D8] text-sm ml-4">Amount including Total Fees</span>
                  <span className="bg-[#1D8751] text-white text-lg font-semibold rounded-full px-8 py-1 ml-2">
                    ${amountNum > 0 ? assetAmount.toFixed(2) : '0.00'}
                  </span>
                </button>
              </div>
            </div>
          </div>
          {/* Right: Fee Breakdown */}
          <div className="flex flex-col justify-between min-w-[220px] bg-[#1D1D23] border border-[#35353E] rounded-lg px-4 py-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#E8EFF5]">
                Commission: {amountNum > 0 ? `${commissionRate}%` : '0%'}
              </span>
              <span className="text-[#1D8751]">
                {amountNum > 0 ? `$${commission.toFixed(2)}` : '$0.00'}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#E8EFF5]">Network Fee:</span>
              <span className="text-[#1D8751]">
                {amountNum > 0 ? `$${networkFee.toFixed(2)}` : '$0.00'}
              </span>
            </div>
            <div className="border-t border-[#35353E] mt-2 pt-2 flex justify-between text-sm">
              <span className="text-[#F79330] font-semibold">Total Fees</span>
              <span className="text-[#F79330] font-semibold">
                {amountNum > 0 ? `$${totalFees.toFixed(2)}` : '$0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom Info Row */}
      <div className="flex items-center text-[#F79330] text-xs mt-4">
      <svg className="w-4 h-4 text-[#F79330] mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#F79330" strokeWidth="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="#F79330" strokeWidth="2"/><circle cx="12" cy="16" r="1" fill="#F79330"/></svg>
        <span className='text-white'>Transactions are subject to commission, above is the information on the commission rates</span>
      </div>
    </div>
  );
};

export default AssetsSelector;
