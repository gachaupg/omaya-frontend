/**
 * DepositModal.tsx – responsive version
 */
import React, { useState } from 'react';
import { ChevronDown, Upload, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import WithdrawalModal from './WithdrawModal';

const DepositModal = () => {
  const [assetType, setAssetType] = useState('Crypto');
  const [selectedAsset, setSelectedAsset] = useState('Perfect Money');
  const [selectedNetwork, setSelectedNetwork] = useState('TRC20');
  const [amount, setAmount] = useState('100');
  const [walletAddress, setWalletAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  if (showWithdraw) {
    return <WithdrawalModal />;
  }

  return (
    <div className="min-h-screen bg-[#18181D] md:p-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        {/* Crypto/Forex Toggle */}
        <div className="flex flex-col">
          <h1 className="text-xl text-white mb-2">Asset Class</h1>
          <div className="flex w-full border border-[#1D8751] rounded-lg p-1 gap-2">
            <button 
              onClick={() => setAssetType('Crypto')}
              className={`flex-1 px-2 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                assetType === 'Crypto' 
                  ? 'bg-[#1D8751] text-white' 
                  : 'bg-[#35353E] text-[#788099]'
              }`}
            >
              Crypto
            </button>
            <button 
              onClick={() => setAssetType('Forex')}
              className={`flex-1 px-2 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                assetType === 'Forex' 
                  ? 'bg-[#1D8751] text-white' 
                  : 'bg-[#35353E] text-[#788099]'
              }`}
            >
              Forex
            </button>
          </div>
        </div>

        {/* Transaction Type */}
        <div className="flex flex-col items-center md:items-end">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2 items-center">
              <span className="text-white capitalize">Transaction Type</span>
            </div>
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-full font-semibold text-sm text-white border flex items-center gap-2 ${
                  !showWithdraw 
                    ? "bg-[#1D8751] text-white border-[#1D8751]" 
                    : "bg-transparent border-[#1D8751] text-[#1D8751]"
                }`}
                onClick={() => setShowWithdraw(false)}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={!showWithdraw ? "#FFFFFF" : "#1D8751"}
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
                  showWithdraw 
                    ? "bg-[#E23D3A] border-[#E23D3A]" 
                    : "bg-transparent border-[#E23D3A] text-[#E23D3A]"
                }`}
                onClick={() => setShowWithdraw(true)}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={showWithdraw ? "#FFFFFF" : "#E23D3A"}
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
      </div>

      {/* Transaction Info */}
      <div className="p-4 rounded-lg bg-[#1D1D23] border border-[#35353E] mb-4">
        {assetType === 'Crypto' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2 items-stretch">
            {/* Asset */}
            <div className="h-16 flex flex-col justify-end">
              <label className="block text-xs mb-1 text-[#788099]">Asset</label>
              <div className="relative flex items-center bg-[#18181D] rounded-xl px-2 py-1 border border-[#35353E] h-full">
                <img src="https://res.cloudinary.com/dam1sxczj/image/upload/v1748532872/TRC20_ffibtg.png" alt="USDT" className="w-6 h-6 rounded-full mr-2" />
                <select 
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="bg-transparent text-white text-sm font-medium focus:outline-none appearance-none pr-6 w-full h-full"
                >
                  <option>USDT (Tether)</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
              </div>
            </div>
            {/* Network */}
            <div className="h-16 flex flex-col justify-end">
              <label className="block text-xs mb-1 text-[#788099]">Network</label>
              <div className="relative flex items-center bg-[#18181D] rounded-xl px-2 py-1 border border-[#35353E] h-full">
                <img src="https://res.cloudinary.com/dam1sxczj/image/upload/v1748532872/TRC20_ffibtg.png" alt="TRC20" className="w-6 h-6 rounded-full mr-2" />
                <select 
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                  className="bg-transparent text-white text-sm font-medium focus:outline-none appearance-none pr-6 w-full h-full"
                >
                  <option>TRC20</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
              </div>
            </div>
            {/* I want to Receive Net */}
            <div className="h-16 flex flex-col justify-end">
              <label className="block text-xs mb-1 text-[#788099]">I want to Recieve Net</label>
              <div className="flex items-center bg-[#18181D] rounded-xl px-2 py-1 border border-[#35353E] h-full">
                <span className="text-[#1D8751] text-lg font-bold mr-1">$</span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
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
                value="102"
                readOnly
                className="bg-[#18181D] text-white text-sm font-medium rounded-xl px-3 py-1 border border-[#35353E] w-full h-full focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2 items-stretch">
            {/* Asset */}
            <div className="h-16 flex flex-col justify-end">
              <label className="block text-xs mb-1 text-[#788099]">Asset</label>
              <div className="relative flex items-center bg-[#18181D] rounded-full px-2 py-1 border border-[#35353E] h-full">
                <img src="https://res.cloudinary.com/dam1sxczj/image/upload/v1748532872/TRC20_ffibtg.png" alt="Perfect Money" className="w-6 h-6 rounded-full mr-2" />
                <select 
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="bg-transparent text-white text-sm font-medium focus:outline-none appearance-none pr-6 w-full h-full"
                >
                  <option>Perfect Money</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
              </div>
            </div>
            {/* I want to Receive Net */}
            <div className="h-16 flex flex-col justify-end">
              <label className="block text-xs mb-1 text-[#788099]">I want to Recieve Net</label>
              <div className="flex items-center justify-between bg-[#18181D] rounded-full px-2 py-1 border border-[#35353E] h-full">
                <div>
                  <span className="text-[#1D8751] text-lg font-bold mr-1">$</span>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-transparent text-white text-sm font-medium w-16 focus:outline-none h-full"
                  />
                </div>
                <select className="bg-transparent text-[#9CA3AF] text-xs font-medium focus:outline-none ml-1 h-full">
                  <option>USD</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Info Row */}
        <div className="flex items-start text-white text-xs mt-2 mb-2">
          <AlertCircle className="w-4 h-4 text-[#E23D3A] mr-2 mt-0.5 flex-shrink-0" />
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
                    <span className="bg-[#1D8751] text-white text-lg font-semibold rounded-full px-8 py-1 ml-2">$102</span>
                  </button>
                </div>
              </div>
            </div>
            {/* Right: Fee Breakdown */}
            <div className="flex flex-col justify-between min-w-[220px] bg-[#1D1D23] border border-[#35353E] rounded-lg px-4 py-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#E8EFF5]">Commission: 1%</span>
                <span className="text-[#1D8751]">$1</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#E8EFF5]">Network Fee:</span>
                <span className="text-[#1D8751]">$1</span>
              </div>
              <div className="border-t border-[#35353E] mt-2 pt-2 flex justify-between text-sm">
                <span className="text-[#F79330] font-semibold">Total Fees</span>
                <span className="text-[#F79330] font-semibold">$2</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info Row */}
        <div className="flex items-start text-[#F79330] text-xs mt-4">
          <AlertCircle className="w-4 h-4 text-[#F79330] mr-2 mt-0.5 flex-shrink-0" />
          <span className='text-white'>Transactions are subject to commission, above is the information on the commission rates</span>
        </div>
      </div>

      {/* Wallet Address */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4 text-white">2- Your Wallet Address</h2>
        <div className="mb-8 bg-[#1D1D23] border border-[#35353E] p-4 rounded-xl">
          <label className="block text-sm mb-2 text-[#788099]">Wallet/Account Address</label>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center w-full bg-[#18181D] rounded-full px-4 py-2">
              <div className='w-3 h-3 mr-2 rounded-full bg-[#1D8751]'></div>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Paste here your Crypto address"
                className="flex-1 bg-transparent text-[#788099] text-sm font-medium focus:outline-none"
              />
              <Copy className='text-white w-4 h-4'/>
            </div>
            <button className="bg-[#35353E] py-2 px-3 rounded-full sm:ml-2 flex gap-2 w-full sm:w-auto justify-center">
              <p className='text-[#1D8751]'>Paste</p>
              <img src="https://res.cloudinary.com/dam1sxczj/image/upload/v1748885082/Vector_se1lvr.png" alt="" className='w-5 h-5' />
            </button>
          </div>
          <div className="flex items-start mt-2">
            <input type="checkbox" className="w-4 h-4 rounded border-2 border-[#F79330] accent-[#18181D] mr-2 mt-1 flex-shrink-0" />
            <span className="text-xs text-[#F79330]">I Confirm that the above submitted address is correct Address for the Cryptocurrency I chose, and not other Crypto *</span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4 text-white">3- OMAYA Exchange Payment Details</h2>
        <div className="bg-[#1D1D23] border border-[#35353E] p-4 rounded-xl mb-8">
          <div className="flex items-start mb-4">
            <AlertCircle className="w-5 h-5 text-[#F79330] mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-white text-sm">Please SEND the Funds to the preferred Payment Method below</span>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Payment Method */}
            <div className="flex-1">
              <label className="block text-sm mb-2 text-[#788099]">Payment Method</label>
              <div className="flex items-center bg-[#23242B] rounded-lg px-4 py-2 border border-[#35353E]">
                <svg className="w-6 h-6 text-[#1D8751] mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="2" stroke="#1D8751" strokeWidth="2"/><path d="M2 11h20" stroke="#1D8751" strokeWidth="2"/></svg>
                <select className="bg-transparent text-white text-sm font-medium focus:outline-none flex-1">
                  <option>Bank Transfer</option>
                </select>
              </div>
            </div>
            {/* Payment Provider */}
            <div className="flex-1">
              <label className="block text-sm mb-2 text-[#788099]">Payment Provider</label>
              <div className="flex items-center bg-[#23242B] rounded-lg px-4 py-2 border border-[#35353E]">
                <img src="https://res.cloudinary.com/dam1sxczj/image/upload/v1748884335/image_7_dqkxkj.png" alt="Salam Bank" className="w-6 h-6 rounded-full mr-2" />
                <select className="bg-transparent text-white text-sm font-medium focus:outline-none flex-1">
                  <option>Salam Bank</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex items-end justify-end">
            <button className="bg-[#1D8751] text-white px-6 py-2 rounded-full font-medium text-sm ml-2">+ Add Payment Method</button>
          </div>
          {/* Transfer Details */}
          <div className="flex items-center mb-2">
            <AlertCircle className="w-4 h-4 text-[#1D8751] mr-2" />
            <span className="text-[#1D8751] text-sm font-medium">Transfer Details</span>
          </div>
          <div className="mt-4 bg-transparent border border-[#1D8751] rounded-xl p-4">
            <ul className="space-y-1 mt-2">
              <li className="flex items-start text-white text-sm"><span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block mr-2 mt-1 flex-shrink-0"></span>Please send the money from your own account Only</li>
              <li className="flex items-start text-white text-sm"><span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block mr-2 mt-1 flex-shrink-0"></span>Put transaction ID in the description field of the bank</li>
              <li className="flex items-start text-white text-sm"><span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block mr-2 mt-1 flex-shrink-0"></span>Please note, If you do not follow above conditions, we will reject your transaction and send you back your money.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-white">4- Additional Info</h2>
        <div className="bg-[#1D1D23] border border-[#35353E] p-4 rounded-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
            <label className="text-sm text-white">Upload Screenshot *</label>
            <button className="bg-[#1D8751] rounded-lg px-4 py-2 flex items-center justify-center"><Upload className="w-4 h-4 text-white" /></button>
          </div>
          <div className="text-[#788099] text-xs mb-4">Please upload the screenshot of your payment here.<br/>This is necessary for verification purposes.</div>
          <label className="block text-sm mb-2 text-white">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Please type here any extra information you want to share with us"
            className="w-full p-3 rounded-lg text-sm bg-[#18181D] text-[#788099] border border-[#35353E] mb-4 focus:outline-none"
          />
          <div className="flex flex-col gap-2 mb-4">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmPayment}
                onChange={e => setConfirmPayment(e.target.checked)}
                className="sr-only"
              />
              <span className={`w-6 h-6 flex items-center justify-center rounded-lg border-2 border-[#1D8751] transition mt-0.5 flex-shrink-0`}>
                {confirmPayment && (
                  <svg width="18" height="18" viewBox="0 0 18 18" className="text-[#1D8751]">
                    <polyline points="4.5 9.5 8 13 13.5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span className="text-white text-sm">I confirm that I sent the payment</span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={e => setAcceptTerms(e.target.checked)}
                className="sr-only"
              />
              <span className={`w-6 h-6 flex items-center justify-center rounded-lg border-2 border-[#1D8751] transition mt-0.5 flex-shrink-0`}>
                {acceptTerms && (
                  <svg width="18" height="18" viewBox="0 0 18 18" className="text-[#1D8751]">
                    <polyline points="4.5 9.5 8 13 13.5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span className="text-white text-sm">I accept Terms and condition</span>
            </label>
          </div>
          <button className="w-full py-2 rounded-full text-white font-semibold text-lg bg-[#1D8751] mt-2">Submit</button>
        </div>
      </div>
    </div>
  );
};

export default DepositModal;