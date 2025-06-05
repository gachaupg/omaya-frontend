/**
 * WithdrawModal.tsx – auto‑generated placeholder
 */
import React, { useState } from 'react';
import { ChevronDown, Upload, AlertCircle,Copy,QrCodeIcon } from 'lucide-react';
import DepositModal from './DepositModal';

interface WithdrawalModalProps {
  onSwitchModal?: () => void;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ onSwitchModal }) => {
  const [assetType, setAssetType] = useState('Crypto');
  const [selectedAsset, setSelectedAsset] = useState('Bitcoin');
  const [selectedNetwork, setSelectedNetwork] = useState('TRC20');
  const [amount, setAmount] = useState('100');
  const [walletAddress, setWalletAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false)

  if(showDepositModal){
    return <DepositModal/>
  }

  return (
    <div className="min-h-screen bg-[#18181D] md:p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        {/* Crypto/Forex Toggle */}
        <div className="flex flex-col">
          <h1 className="text-xl text-white mb-2">Withdrawal</h1>  
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
        {/* Transaction Type Tabs */}
        <div className="flex flex-col items-center mb-2">
          <div className="flex flex-col mb-4 gap-2 w-full">
            <div className="flex gap-2 items-center">
              <span className="text-white capitalize">Transaction Type</span>
            </div>
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-full font-semibold text-sm border flex items-center gap-2 text-white bg-transparent border-[#1D8751] text-[#1D8751]`}
                onClick={() => setShowDepositModal(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D8751" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7,7 17,7 17,17"></polyline>
                </svg>
                Deposit
              </button>
              <button
                className={`px-4 py-2 rounded-full font-semibold text-sm border flex items-center gap-2 text-white bg-[#E23D3A] border-[#E23D3A]`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <img src="https://res.cloudinary.com/dam1sxczj/image/upload/v1748532872/TRC20_ffibtg.png" alt="Bitcoin" className="w-6 h-6 rounded-full mr-2 flex-shrink-0" />
                <select 
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="bg-transparent text-white text-sm font-medium focus:outline-none appearance-none pr-6 w-full h-full"
                >
                  <option>Bitcoin</option>
                  <option>USDT (Tether)</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#788099] pointer-events-none flex-shrink-0" />
              </div>
            </div>
            {/* Network */}
            <div className="h-16 flex flex-col justify-end">
              <label className="block text-xs mb-1 text-[#788099]">Network</label>
              <div className="relative flex items-center bg-[#18181D] rounded-xl px-2 py-1 border border-[#35353E] h-full">
                <img src="https://res.cloudinary.com/dam1sxczj/image/upload/v1748532872/TRC20_ffibtg.png" alt="TRC20" className="w-6 h-6 rounded-full mr-2 flex-shrink-0" />
                <select 
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                  className="bg-transparent text-white text-sm font-medium focus:outline-none appearance-none pr-6 w-full h-full"
                >
                  <option>TRC20</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#788099] pointer-events-none flex-shrink-0" />
              </div>
            </div>
            {/* I want to Receive Net */}
            <div className="h-16 flex flex-col justify-end">
              <label className="block text-xs mb-1 text-[#788099]">I want to Recieve Net</label>
              <div className="flex items-center bg-[#18181D] rounded-xl px-2 py-1 border border-[#35353E] h-full">
                <span className="text-[#1D8751] text-lg font-bold mr-1 flex-shrink-0">$</span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-transparent text-white text-sm font-medium w-16 focus:outline-none h-full flex-1"
                />
                <select className="bg-transparent text-[#788099] text-xs font-medium focus:outline-none ml-1 h-full flex-shrink-0">
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
              <div className="relative flex items-center bg-[#18181D] rounded-xl px-2 py-1 border border-[#35353E] h-full">
                <img src="https://res.cloudinary.com/dam1sxczj/image/upload/v1748532872/TRC20_ffibtg.png" alt="Perfect Money" className="w-6 h-6 rounded-full mr-2 flex-shrink-0" />
                <select 
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="bg-transparent text-white text-sm font-medium focus:outline-none appearance-none pr-6 w-full h-full"
                >
                  <option>Perfect Money</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#788099] pointer-events-none flex-shrink-0" />
              </div>
            </div>
            {/* I want to Receive Net */}
            <div className="h-16 flex flex-col justify-end">
              <label className="block text-xs mb-1 text-[#788099]">I want to Recieve Net</label>
              <div className="flex items-center justify-between bg-[#18181D] rounded-xl px-2 py-1 border border-[#35353E] h-full">
                <div className="flex items-center flex-1 min-w-0">
                  <span className="text-[#1D8751] text-lg font-bold mr-1 flex-shrink-0">$</span>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-transparent text-white text-sm font-medium w-16 focus:outline-none h-full flex-1"
                  />
                </div>
                <select className="bg-transparent text-[#788099] text-xs font-medium focus:outline-none ml-1 h-full flex-shrink-0">
                  <option>USD</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Info Row */}
        <div className="flex items-center text-[#F79330] text-xs mt-2 mb-2">
          <AlertCircle className="w-4 h-4 mr-2 text-[#E23D3A]" />
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
            {/* Left: Net Amount to Transfer */}
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
        <div className="flex items-center text-[#F79330] text-xs mt-4">
          <AlertCircle className="w-4 h-4 mr-2 text-[#F79330]" />
          <span className='text-white'>Transactions are subject to commission, above is the information on the commission rates</span>
        </div>
      </div>

      {/* Wallet Details Section */}
      <div className="">
        <h2 className="text-lg font-semibold mb-4 text-white">2- OMAYA Exchange Crypto Wallet Details</h2>
        <div className="mb-8 bg-[#1D1D23] border border-[#35353E] p-4 rounded-xl">
          <label className="block text-sm mb-2 text-[#788099]">Address</label>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center w-full sm:flex-1 bg-[#18181D] rounded-full px-4 py-2 border border-[#1D8751]">
              <svg className="w-5 h-5 text-[#1D8751] mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="7" rx="2" stroke="#1D8751" strokeWidth="2"/><path d="M7 11V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4" stroke="#1D8751" strokeWidth="2"/></svg>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="34ArWPE1ZNpDvju2t8TZSCHmKyHMmigGoB§s"
                className="flex-1 bg-transparent text-[#1D8751] text-sm font-medium focus:outline-none"
              />
              <QrCodeIcon className='text-[#1D8751] w-4 h-4'/>
            </div>
            <button className="bg-[#35353E] py-2 px-3 rounded-full sm:ml-2 flex gap-2 w-full sm:w-auto justify-center">
              <p className='text-[#1D8751]'>Copy</p>
              <Copy className='text-[#1D8751] w-4 h-4'/>
            </button>
          </div>
          <div className="flex items-center mt-2">
            <AlertCircle className="w-4 h-4 text-[#F79330] mr-2" />
            <span className="text-xs text-[#F79330]">Please ensure you only send the selected Cryptocurrency and its correct Network to this address.<br/>Sending the wrong crypto will result in permanent loss.</span>
          </div>
        </div>
      </div>

      {/* Bank Details Section */}
      <div className="">
        <h2 className="text-lg font-semibold mb-4 text-white">3- Your Bank Details</h2>
        <div className="bg-[#1D1D23] border border-[#35353E] p-4 rounded-xl mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Payment Method */}
            <div className="flex-1">
              <label className="block text-sm mb-2 text-[#788099]">Payment Method</label>
              <div className="flex items-center bg-[#18181D] rounded-xl px-4 py-2 border border-[#35353E]">
                <svg className="w-6 h-6 text-[#1D8751] mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="2" stroke="#1D8751" strokeWidth="2"/><path d="M2 11h20" stroke="#1D8751" strokeWidth="2"/></svg>
                <select className="bg-transparent text-white text-sm font-medium focus:outline-none flex-1">
                  <option>Bank Transfer</option>
                </select>
              </div>
            </div>
            {/* Payment Provider */}
            <div className="flex-1">
              <label className="block text-sm mb-2 text-[#788099]">Provider</label>
              <div className="flex items-center bg-[#18181D] rounded-xl px-4 py-2 border border-[#35353E]">
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
          <div className="mt-4 bg-transparent">
            <div className="flex items-center mb-2">
              <span className="text-[#788099] text-sm font-medium mr-2">Transfer Details</span>
              <AlertCircle className="w-4 h-4 text-[#1D8751]" />
            </div>
            <ul className="space-y-1 mt-2 border border-[#1D8751] rounded-xl p-4">
              <li className="flex items-center text-white text-sm"><span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block mr-2"></span>Please send the money from your own account Only</li>
              <li className="flex items-center text-white text-sm"><span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block mr-2"></span>Put transaction ID in the description field of the bank</li>
              <li className="flex items-center text-white text-sm"><span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block mr-2"></span>Please note, If you do not follow above conditions, we will reject your transaction and send you back your money.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="">
        <h2 className="text-lg font-semibold mb-4 text-white">4- Additional Info</h2>
        <div className="bg-[#1D1D23] border border-[#35353E] p-4 rounded-xl">
          <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
            <label className="text-sm text-white">Upload Screenshot *</label>
            <button className="bg-[#1D8751] rounded-xl px-4 py-2 flex items-center justify-center"><Upload className="w-4 h-4 text-white" /></button>
          </div>
          <div className="text-[#788099] text-xs mb-4">Please upload the screenshot of your payment here.<br/>This is necessary for verification purposes.</div>
          <label className="block text-sm mb-2 text-white">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Please type here any extra information you want to share with us"
            className="w-full p-3 rounded-xl text-sm bg-[#18181D] text-[#788099] border border-[#35353E] mb-4 focus:outline-none"
          />
          <div className="flex flex-col gap-2 mb-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmPayment}
                onChange={e => setConfirmPayment(e.target.checked)}
                className="sr-only"
              />
              <span className={`w-6 h-6 flex items-center justify-center rounded-lg border-2 border-[#1D8751] transition`}>
                {confirmPayment && (
                  <svg width="18" height="18" viewBox="0 0 18 18" className="text-[#1D8751]">
                    <polyline points="4.5 9.5 8 13 13.5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span className="text-white text-sm">I confirm that I sent the payment</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={e => setAcceptTerms(e.target.checked)}
                className="sr-only"
              />
              <span className={`w-6 h-6 flex items-center justify-center rounded-lg border-2 border-[#1D8751] transition`}>
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

export default WithdrawalModal;