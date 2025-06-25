import React from 'react';
import { Asset, Network } from '../../types';
import { ChevronDown } from 'lucide-react';

interface AssetSelectorProps {
  currentAsset: Asset | null;
  setCurrentAsset: (asset: Asset) => void;
  currentAssetType: 'Crypto' | 'Forex';
  setCurrentAssetType: (type: 'Crypto' | 'Forex') => void;
  selectedNetwork: Network | null;
  setSelectedNetwork: (network: Network) => void;
  assets: Asset[];
  amount: string;
  setAmount: (v: string) => void;
  assetAmount: number;
  amountNum: number;
  commission: number;
  commissionRate: number;
  networkFee: number;
  totalFees: number;
}

const CRYPTO_ASSETS = ['USDT Tether', 'USDC', 'BTC', 'ETH', 'BNB', 'DOGE', 'ADA', 'SOL', 'XRP', 'USD'];

const AssetSelector: React.FC<AssetSelectorProps> = ({
  currentAsset,
  setCurrentAsset,
  currentAssetType,
  setCurrentAssetType,
  selectedNetwork,
  setSelectedNetwork,
  assets,
  amount,
  setAmount,
  assetAmount,
  amountNum,
  commission,
  commissionRate,
  networkFee,
  totalFees,
}) => {
  // Filter assets by type
  const filteredAssets = assets.filter((a) =>
    currentAssetType === 'Crypto' ? CRYPTO_ASSETS.includes(a.symbol) : !CRYPTO_ASSETS.includes(a.symbol)
  );

  return (
    <>
      {/* Asset Class Toggle */}
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        {/* <div className="flex flex-col">
          <h1 className="text-xl text-white mb-2">Asset Class</h1>
          <div className="flex w-full border border-[#1D8751] rounded-lg p-1 gap-2">
            <button
              className={`flex-1 px-2 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                currentAssetType === 'Crypto'
                  ? 'bg-[#1D8751] text-white'
                  : 'bg-[#35353E] text-[#788099]'
              }`}
              onClick={() => setCurrentAssetType('Crypto')}
            >
              Crypto
            </button>
            <button
              className={`flex-1 px-2 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                currentAssetType === 'Forex'
                  ? 'bg-[#1D8751] text-white'
                  : 'bg-[#35353E] text-[#788099]'
              }`}
              onClick={() => setCurrentAssetType('Forex')}
            >
              Forex
            </button>
          </div>
        </div> */}
      </div>
      {/* Transaction Info Fields */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-white">1- Transaction Info</h2>
        <div className='mb-8 bg-[#1D1D23] border border-[#35353E] p-4 rounded-xl'>
        {currentAssetType === 'Crypto' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2 items-stretch">
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
                  <select
                    value={currentAsset?.asset_id || ''}
                    onChange={e => {
                      const asset = filteredAssets.find(a => a.asset_id === e.target.value);
                      if (asset) setCurrentAsset(asset);
                    }}
                    className="bg-[#18181D] text-white text-sm font-medium focus:outline-none appearance-none pr-6 w-full h-full"
                  >
                    {filteredAssets.map(asset => (
                      <option key={asset.asset_id} value={asset.asset_id}>{asset.symbol}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                </div>
              </div>
              {/* Network */}
              <div className="h-16 flex flex-col justify-end">
                <label className="block text-xs mb-1 text-[#788099]">Network</label>
                <div className="relative flex items-center bg-[#18181D] rounded-xl px-2 py-1 border border-[#35353E] h-full">
                  {selectedNetwork && selectedNetwork.logo ? (
                    <img src={selectedNetwork.logo} alt={selectedNetwork.network_type} className="w-6 h-6 rounded-full mr-2" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#1D8751] flex items-center justify-center mr-2">
                      <span className="text-white text-xs font-medium">{selectedNetwork?.network_type?.[0]}</span>
                    </div>
                  )}
                  <select
                    value={selectedNetwork?.network_id || ''}
                    onChange={e => {
                      const net = currentAsset?.networks.find(n => n.network_id === e.target.value);
                      if (net) setSelectedNetwork(net);
                    }}
                    className="bg-[#18181D] text-white text-sm font-medium focus:outline-none appearance-none pr-6 w-full h-full"
                  >
                    {currentAsset?.networks.map(network => (
                      <option key={network.network_id} value={network.network_id}>{network.network_type}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                </div>
              </div>
              {/* I want to Receive Net */}
              <div className="h-16 flex flex-col justify-end">
                <label className="block text-xs mb-1 text-[#788099]">I want to Receive Net</label>
                <div className="flex items-center bg-[#18181D] rounded-xl px-2 py-1 border border-[#35353E] h-full">
                  <span className="text-[#1D8751] text-lg font-bold mr-1">$</span>
                  <input
                    type="text"
                    value={amount ?? ""}
                    onChange={e => setAmount(e.target.value)}
                    className="bg-transparent text-white text-sm font-medium w-16 focus:outline-none h-full"
                  />
                  <select className="bg-transparent text-[#9CA3AF] text-xs font-medium focus:outline-none ml-1 h-full">
                    <option>USD</option>
                  </select>
                </div>
              </div>
              {/* Asset Amount */}
              <div className="h-16 flex flex-col justify-end">
                <label className="block text-xs mb-1 text-[#788099]">Asset Amount</label>
                <input
                  type="text"
                  value={assetAmount !== undefined && assetAmount !== null ? assetAmount : ""}
                  readOnly
                  className="bg-[#18181D] text-white text-sm font-medium rounded-xl px-3 py-1 border border-[#35353E] w-full h-full focus:outline-none"
                />
              </div>
            </div>
            {/* Info Row */}
            <div className="flex items-start text-white text-xs mt-2 mb-2">
              <svg className="w-4 h-4 text-[#E23D3A] mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#E23D3A" strokeWidth="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="#E23D3A" strokeWidth="2"/><circle cx="12" cy="16" r="1" fill="#E23D3A"/></svg>
              <span>This is only estimated price and its based on current Market Price. We will fix the price when we receive the funds.</span>
            </div>
            {/* Mode Selection */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 mb-4 mt-4">
              <h1 className="text-white text-sm font-medium">Mode</h1>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div className="flex flex-col items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2 border-b border-[#1D8751] pb-2 w-full">
                    <input type="radio" checked readOnly className="accent-[#1D8751] w-4 h-4" />
                    <span className="text-white text-sm font-medium">Normal</span>
                  </div>
                  <span className="text-xs text-[#1D8751] px-2">Can take 1 hour</span>
                </div>
                <div className="flex flex-col items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2 border-b border-white pb-2 w-full">
                    <input type="radio" readOnly className="accent-[#35353E] w-4 h-4" />
                    <span className="text-white text-sm font-medium">Express</span>
                  </div>
                  <span className="text-xs text-[#F79330] px-2">As soon as possible</span>
                </div>
              </div>
            </div>
            {/* Amount & Fees Breakdown */}
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
            <div className="flex items-start text-[#F79330] text-xs mt-4">
              <svg className="w-4 h-4 text-[#F79330] mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#F79330" strokeWidth="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="#F79330" strokeWidth="2"/><circle cx="12" cy="16" r="1" fill="#F79330"/></svg>
              <span className='text-white'>Transactions are subject to commission, above is the information on the commission rates</span>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2 items-stretch">
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
                  <select
                    value={currentAsset?.asset_id || ''}
                    onChange={e => {
                      const asset = filteredAssets.find(a => a.asset_id === e.target.value);
                      if (asset) setCurrentAsset(asset);
                    }}
                    className="bg-[#18181D] text-white text-sm font-medium focus:outline-none appearance-none pr-6 w-full h-full"
                  >
                    {filteredAssets.map(asset => (
                      <option key={asset.asset_id} value={asset.asset_id}>{asset.symbol}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                </div>
              </div>
              {/* I want to Receive Net */}
              <div className="h-16 flex flex-col justify-end">
                <label className="block text-xs mb-1 text-[#788099]">I want to Receive Net</label>
                <div className="flex items-center justify-between bg-[#18181D] rounded-xl px-2 py-1 border border-[#35353E] h-full">
                  <div>
                    <span className="text-[#1D8751] text-lg font-bold mr-1">$</span>
                    <input
                      type="text"
                      value={amount ?? ""}
                      onChange={e => setAmount(e.target.value)}
                      className="bg-transparent text-white text-sm font-medium w-16 focus:outline-none h-full"
                    />
                  </div>
                  <select className="bg-transparent text-[#9CA3AF] text-xs font-medium focus:outline-none ml-1 h-full">
                    <option>USD</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Info Row */}
            <div className="flex items-start text-white text-xs mt-2 mb-2">
              <svg className="w-4 h-4 text-[#E23D3A] mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#E23D3A" strokeWidth="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="#E23D3A" strokeWidth="2"/><circle cx="12" cy="16" r="1" fill="#E23D3A"/></svg>
              <span>This is only estimated price and its based on current Market Price. We will fix the price when we receive the funds.</span>
            </div>
            {/* Mode Selection */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 mb-4 mt-4">
              <h1 className="text-white text-sm font-medium">Mode</h1>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div className="flex flex-col items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2 border-b border-[#1D8751] pb-2 w-full">
                    <input type="radio" checked readOnly className="accent-[#1D8751] w-4 h-4" />
                    <span className="text-white text-sm font-medium">Normal</span>
                  </div>
                  <span className="text-xs text-[#1D8751] px-2">Can take 1 hour</span>
                </div>
                <div className="flex flex-col items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2 border-b border-white pb-2 w-full">
                    <input type="radio" readOnly className="accent-[#35353E] w-4 h-4" />
                    <span className="text-white text-sm font-medium">Express</span>
                  </div>
                  <span className="text-xs text-[#F79330] px-2">As soon as possibl</span>
                </div>
              </div>
            </div>
            {/* Amount & Fees Breakdown */}
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
            <div className="flex items-start text-[#F79330] text-xs mt-4">
              <svg className="w-4 h-4 text-[#F79330] mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#F79330" strokeWidth="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="#F79330" strokeWidth="2"/><circle cx="12" cy="16" r="1" fill="#F79330"/></svg>
              <span className='text-white'>Transactions are subject to commission, above is the information on the commission rates</span>
            </div>
          </>
        )}
        </div>
      </div>
    </>
  );
};

export default AssetSelector;
