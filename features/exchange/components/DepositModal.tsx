/**
 * DepositModal.tsx – responsive version
 */
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../../store';
import { ChevronDown, Upload, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import WithdrawalModal from './WithdrawalModal';
import { Asset, Network, PaymentMethod, PaymentProvider, AdminPaymentDetail, DepositTransactionPayload } from '../types';
import { fetchPaymentMethods, fetchPaymentProviders, fetchAdminPaymentDetails } from '../slices/paymentSlice';
import { createDeposit, fetchAssets } from '../slices/exchangeSlice';
import toast, { Toaster } from 'react-hot-toast';
import { validateWalletAddress } from './utils/validation/walletValidation';
import { calculateCommission } from './utils/calculations/commissionCalculator';
import { calculateNetworkFee, calculateTotalFees } from './utils/calculations/feeCalculator';

import { logger } from '@/lib/utils/logger';

// Define asset types based on the choices, matching TransactionTypePanel
const CRYPTO_ASSETS = ['USDT Tether', 'BTC', 'ETH', 'BNB', 'DOGE', 'ADA', 'SOL', 'XRP', 'USD'];

interface DepositModalProps {
  asset: Asset;
  assetType: 'Crypto' | 'Forex';
  onClose: () => void;
}

const DepositModal: React.FC<DepositModalProps> = ({ asset, assetType, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { paymentMethods, paymentProviders, loading, adminPaymentDetails } = useSelector((state: any) => state.payment);
  const { assets } = useSelector((state: any) => state.exchange);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(asset.networks[0] || null);
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [confirmAddress, setConfirmAddress] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { adminPaymentDetails: currentAdminPaymentDetails, paymentMethods: currentPaymentMethods, paymentProviders: currentPaymentProviders } = useSelector((state: any) => state.payment);
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(asset);
  const [currentAssetType, setCurrentAssetType] = useState<'Crypto' | 'Forex'>(assetType);

  useEffect(() => {
    let error: string | null = null;
    if (currentAssetType === 'Crypto' && currentAsset?.symbol === 'USDT') {
      // Use utility function
      error = validateWalletAddress(walletAddress, selectedNetwork?.network_type, currentAsset?.symbol);
    } else if (walletAddress.trim() !== '') {
      error = null;
    }
    setWalletError(error);
  }, [walletAddress, selectedNetwork, currentAsset?.symbol, currentAssetType]);

  const handleWalletAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWalletAddress(e.target.value);
  };

  const handlePasteClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setWalletAddress(text);
    } catch (err) {
      logger.error('exchange', 'Failed to read clipboard:', err);
    }
  };

  // Fetch payment methods on mount
  useEffect(() => {
    dispatch(fetchPaymentMethods())
      .unwrap()
      .catch((error) => {
        toast.error(`Failed to fetch payment methods: ${error}`);
      });
  }, [dispatch]);

  // Fetch providers when a method is selected
  useEffect(() => {
    if (selectedMethod) {
      dispatch(fetchPaymentProviders(selectedMethod.name))
        .unwrap()
        .catch((error) => {
          toast.error(`Failed to fetch payment providers: ${error}`);
        });
    }
  }, [dispatch, selectedMethod]);

  // Fetch admin payment details when both method and provider are selected
  useEffect(() => {
    if (selectedMethod && selectedProvider) {
      dispatch(fetchAdminPaymentDetails())
        .unwrap()
        .catch((error) => {
          // Silent - no error display
        });
    }
  }, [dispatch, selectedMethod, selectedProvider]);

  // Fetch assets and set currentAsset based on currentAssetType
  useEffect(() => {
    dispatch(fetchAssets()); // Fetch all assets
  }, [dispatch]);

  useEffect(() => {
    if (assets?.assets && assets.assets.length > 0) {
      const filteredAssets = assets.assets.filter((a: Asset) => 
        currentAssetType === 'Crypto' 
          ? CRYPTO_ASSETS.includes(a.symbol) 
          : !CRYPTO_ASSETS.includes(a.symbol)
      );
      
      if (filteredAssets.length > 0) {
        const firstAsset = filteredAssets[0];
        setCurrentAsset(firstAsset);
        
        if (currentAssetType === 'Crypto' && firstAsset.networks?.length > 0) {
          setSelectedNetwork(firstAsset.networks[0]);
        } else {
          setSelectedNetwork(null);
        }
      } else {
        setCurrentAsset(null);
        setSelectedNetwork(null);
      }
    }
  }, [assets, currentAssetType]);

  const amountNum = parseFloat(amount) || 0;

  // Use utility for commission
  const { commission, commissionRate } = currentAsset
    ? calculateCommission(currentAsset, amountNum)
    : { commission: 0, commissionRate: 0 };

  // Use utility for network fee
  const networkFee = calculateNetworkFee(currentAssetType, selectedNetwork, amountNum);

  // Use utility for total fees
  const totalFees = calculateTotalFees(commission, networkFee);

  const assetAmount = amountNum + totalFees;

  if (showWithdraw) {
    return <WithdrawalModal asset={currentAsset!} assetType={currentAssetType} onClose={onClose} />;
  }

  if (!currentAsset) {
    return <div className="min-h-screen bg-[#18181D] md:p-4 text-white">Loading asset details...</div>;
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    
    if (!file) {
      return;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setFileError('Invalid file type. Please upload an image or PDF.');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File too large. Maximum size is 5MB.');
      return;
    }
    
    setSelectedFile(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = () => {
    setSubmitError(null);
    
    // Validate all required fields
    if (!walletAddress) {
      setSubmitError('Wallet address is required');
      return;
    }
    
    if (walletError) {
      setSubmitError('Please fix the wallet address errors');
      return;
    }
    
    if (!confirmAddress) {
      setSubmitError('Please confirm the wallet address');
      return;
    }
    
    if (!confirmPayment) {
      setSubmitError('Please confirm that you sent the payment');
      return;
    }
    
    if (!acceptTerms) {
      setSubmitError('Please accept the terms and conditions');
      return;
    }

    if (!selectedFile) {
      setSubmitError('Please upload a payment screenshot');
      return;
    }

    if (!selectedMethod) {
      setSubmitError('Please select a payment method');
      return;
    }

    if (!selectedProvider) {
      setSubmitError('Please select a payment provider');
      return;
    }

    const depositPayload = new FormData();
    depositPayload.append('requested_amount', amountNum.toString());
    depositPayload.append('deposit_address', walletAddress);
    depositPayload.append('payment_provider', selectedProvider.provider_name);
    depositPayload.append('payment_method', selectedMethod.name);
    depositPayload.append('currency', currentAsset?.symbol === 'USDT Tether' ? 'USDT' : currentAsset?.symbol || ''); // If USDT Tether, send as USDT, otherwise use asset.symbol or empty string
    if (currentAssetType === 'Crypto' && selectedNetwork && selectedNetwork.network_id) {
      depositPayload.append('network', selectedNetwork.network_id);
    }
    if (currentAsset?.asset_id) {
      depositPayload.append('asset', currentAsset.asset_id); 
    }
    if (notes) {
      depositPayload.append('additional_info', notes);
    }
    if (selectedFile) {
      depositPayload.append('screenshot', selectedFile);
    }

    const config = selectedFile ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;

    dispatch(createDeposit({ payload: depositPayload, config }))
      .unwrap()
      .then(() => {
        toast.success('Deposit request submitted successfully!');
        onClose();
      })
      .catch((error) => {
        toast.error(`Deposit submission failed: ${error}`);
      });
  };

  return (
    <div className="min-h-screen bg-[#18181D] md:p-4">
      <Toaster />
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        {/* Crypto/Forex Toggle */}
        <div className="flex flex-col">
          <h1 className="text-xl text-white mb-2">Asset Class</h1>
          <div className="flex w-full border border-[#1D8751] rounded-lg p-1 gap-2">
          <button 
                className={`flex-1 px-2 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  currentAssetType === 'Crypto' 
                    ? 'bg-[#1D8751] text-white' 
                    : 'bg-[#35353E] text-[#788099]'
                }`}
                onClick={() => {
                  setCurrentAssetType('Crypto');
                }}
              >
                Crypto
              </button>
              <button 
                className={`flex-1 px-2 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  currentAssetType === 'Forex' 
                    ? 'bg-[#1D8751] text-white' 
                    : 'bg-[#35353E] text-[#788099]'
                }`}
                onClick={() => {
                  setCurrentAssetType('Forex');
                }}
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
                    ? 'bg-[#1D8751] text-white border-[#1D8751]' 
                    : 'bg-transparent border-[#1D8751] text-[#1D8751]'
                }`}
                onClick={() => setShowWithdraw(false)}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={!showWithdraw ? '#FFFFFF' : '#1D8751'}
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
                    ? 'bg-[#E23D3A] border-[#E23D3A]' 
                    : 'bg-transparent border-[#E23D3A] text-[#E23D3A]'
                }`}
                onClick={() => setShowWithdraw(true)}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={showWithdraw ? '#FFFFFF' : '#E23D3A'}
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
        {currentAssetType === 'Crypto' ? (
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
                <span className="text-white text-sm font-medium">{currentAsset?.symbol}</span>
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
                    <span className="text-white text-xs font-medium">{selectedNetwork?.network_type[0]}</span>
                  </div>
                )}
                <select
                  value={selectedNetwork?.network_type || ''}
                  onChange={e => {
                    const net = currentAsset?.networks.find(n => n.network_type === e.target.value);
                    setSelectedNetwork(net || null);
                  }}
                  className="bg-[#18181D] text-white text-sm font-medium focus:outline-none appearance-none pr-6 w-full h-full"
                >
                  {currentAsset?.networks.map(network => (
                    <option key={network.network_id} value={network.network_type}>{network.network_type}</option>
                  ))}
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
                value={assetAmount}
                readOnly
                className="bg-[#18181D] text-white text-sm font-medium rounded-xl px-3 py-1 border border-[#35353E] w-full h-full focus:outline-none"
              />
            </div>
          </div>
        ):(
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
              <span className="text-white text-sm font-medium">{currentAsset?.symbol}</span>
            </div>
          </div>
          {/* I want to Receive Net */}
          <div className="h-16 flex flex-col justify-end">
            <label className="block text-xs mb-1 text-[#788099]">I want to Recieve Net</label>
            <div className="flex items-center justify-between bg-[#18181D] rounded-xl px-2 py-1 border border-[#35353E] h-full">
              <div>
              <span className="text-[#1D8751] text-lg font-bold mr-1">$</span>
              <input
                type="text"
                value={amount}
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
        )
        }

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
            <div className={`flex items-center w-full bg-[#18181D] rounded-full px-4 py-2 ${
              walletError ? 'border border-[#E23D3A]' : 'border border-[#35353E]'
            }`}>
              <div className={`w-3 h-3 mr-2 rounded-full ${
                walletError ? 'bg-[#E23D3A]' : 'bg-[#1D8751]'
              }`}></div>
              <input
                type="text"
                value={walletAddress}
                onChange={handleWalletAddressChange}
                placeholder="Paste your crypto address"
                className="flex-1 bg-transparent text-[#788099] text-sm font-medium focus:outline-none"
              />
              <Copy className='text-white w-4 h-4'/>
            </div>
            <button 
              className="bg-[#35353E] py-2 px-3 rounded-full sm:ml-2 flex gap-2 w-full sm:w-auto justify-center"
              onClick={handlePasteClick}
              title="Paste"
            >
              <img src="/assets/Vector_se1lvr.png" alt="Paste" className='w-5 h-5' />
            </button>
          </div>

          {/* Show validation error if exists */}
          {walletError && (
            <div className="flex items-center mt-2 text-[#E23D3A] text-xs">
              <AlertCircle className="w-4 h-4 mr-1" />
              {walletError}
            </div>
          )}
          <div className="flex items-start mt-2">
            <input 
              type="checkbox" 
              checked={confirmAddress}
              onChange={(e) => setConfirmAddress(e.target.checked)}
              className="w-4 h-4 rounded border-2 border-[#F79330] accent-[#18181D] mr-2 mt-1 flex-shrink-0" 
            />
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
              <div className="flex items-center bg-[#18181D] rounded-lg px-4 py-2 border border-[#35353E]">
                <svg className="w-6 h-6 text-[#1D8751] mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="2" stroke="#1D8751" strokeWidth="2"/><path d="M2 11h20" stroke="#1D8751" strokeWidth="2"/></svg>
                <select
                  className="bg-[#18181D] text-white text-sm font-medium focus:outline-none flex-1 rounded-lg"
                  value={selectedMethod?.payment_method_id || ''}
                  onChange={e => {
                    const method = currentPaymentMethods.find((m: PaymentMethod) => m.payment_method_id === e.target.value);
                    setSelectedMethod(method || null);
                    setSelectedProvider(null);
                  }}
                >
                  <option value="" disabled>Select Payment Method</option>
                  {currentPaymentMethods?.map((method: PaymentMethod) => (
                    <option key={method.payment_method_id} value={method.payment_method_id}>{method.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Payment Provider */}
            <div className="flex-1">
              <label className="block text-sm mb-2 text-[#788099]">Payment Provider</label>
              <div className="flex items-center bg-[#18181D] rounded-lg px-4 py-2 border border-[#35353E]">
                {selectedProvider?.logo && (
                  <img src={selectedProvider?.logo} alt={selectedProvider?.provider_name} className="w-6 h-6 rounded-full mr-2" />
                )}
                <select
                  className="bg-[#18181D] text-white text-sm font-medium focus:outline-none flex-1 rounded-lg"
                  value={selectedProvider?.provider_name || ''}
                  onChange={e => {
                    const provider = currentPaymentProviders?.find((p: PaymentProvider) => p.provider_name === e.target.value);
                    setSelectedProvider(provider || null);
                  }}
                  disabled={!selectedMethod}
                >
                  <option value="" disabled>{selectedMethod ? 'Select Payment Provider' : 'Select Payment Method First'}</option>
                  {currentPaymentProviders?.map((provider: PaymentProvider) => (
                    <option key={provider.provider_name} value={provider.provider_name}>{provider.provider_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex items-end justify-end">
            {!selectedProvider && (
              <button className="bg-[#1D8751] text-white px-6 py-2 rounded-full font-medium text-sm ml-2">+ Add Payment Method</button>
            )}
          </div>
          {currentAdminPaymentDetails && currentAdminPaymentDetails.length > 0 && selectedProvider && (
            <div className="mt-4 border border-[#35353E] rounded-xl p-4 bg-[#18181D]">
              <h3 className="text-sm font-semibold text-white mb-4">
                Account Details for {selectedProvider.provider_name}
              </h3>
              {currentAdminPaymentDetails
                .filter((detail: AdminPaymentDetail) => detail.provider_name === selectedProvider.provider_name)
                .map((detail: AdminPaymentDetail) => (
                  <div key={`${detail.provider_name}-${detail.account_name}-${detail.account_number}`} className="mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="block text-xs mb-1 text-[#788099]">Wallet Name</label>
                        <div className="flex items-center w-full bg-[#18181D] rounded-full px-4 py-2 border border-[#35353E]">
                          <span className="w-3 h-3 mr-2 rounded-full bg-[#1D8751]"></span>
                          <span className="flex-1 text-white text-sm font-medium">{detail.account_name}</span>
                          <button
                            className="flex items-center gap-2 bg-[#35353E] py-1 px-2 rounded-full text-[#1D8751] hover:bg-[#4a4a55] text-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(detail.account_name);
                              toast.success('Wallet Name copied!');
                            }}
                          >
                            Copy
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <label className="block text-xs mb-1 text-[#788099]">Wallet Number</label>
                        <div className="flex items-center w-full bg-[#18181D] rounded-full px-4 py-2 border border-[#35353E]">
                          <span className="w-3 h-3 mr-2 rounded-full bg-[#1D8751]"></span>
                          <span className="flex-1 text-white text-sm font-medium">{detail.account_number}</span>
                          <button
                            className="flex items-center gap-2 bg-[#35353E] py-1 px-2 rounded-full text-[#1D8751] hover:bg-[#4a4a55] text-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(detail.account_number);
                              toast.success('Wallet Number copied!');
                            }}
                          >
                            Copy
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {detail.how_to_send && (
                        <div className="flex flex-col">
                          <label className="block text-xs mb-1 text-[#788099]">How To Send</label>
                          <div className="flex items-center w-full bg-[#18181D] rounded-full px-4 py-2 border border-[#35353E]">
                            <span className="w-3 h-3 mr-2 rounded-full bg-[#1D8751]"></span>
                            <span className="flex-1 text-white text-sm font-medium">
                              {detail.how_to_send.startsWith("#")
                                ? detail.how_to_send
                                : /^\d+$/.test(detail.how_to_send.trim())
                                  ? `#${detail.how_to_send}`
                                  : detail.how_to_send}
                            </span>
                            <button
                              className="flex items-center gap-2 bg-[#35353E] py-1 px-2 rounded-full text-[#1D8751] hover:bg-[#4a4a55] text-sm"
                              onClick={() => {
                                const val = detail.how_to_send || "";
                                const toCopy = val.startsWith("#")
                                  ? val
                                  : /^\d+$/.test(val.trim())
                                    ? `#${val}`
                                    : val;
                                navigator.clipboard.writeText(toCopy);
                                toast.success('How To Send details copied!');
                              }}
                            >
                              Copy
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
          {/* Transfer Details */}
          <div className="flex items-center mb-2">
            <AlertCircle className="w-4 h-4 text-[#1D8751] mr-2" />
            <span className="text-[#1D8751] text-sm font-medium">Transfer Details</span>
          </div>
          <div className="mt-4 bg-transparent border border-[#1D8751] rounded-xl p-4">
            <ul className="space-y-1 mt-2">
              <li className="flex items-start text-white text-sm"><span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block mr-2 mt-1 shrink-0"></span>Please send the money from your own account Only</li>
              <li className="flex items-start text-white text-sm"><span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block mr-2 mt-1 shrink-0"></span>Put transaction ID in the description field of the bank</li>
              <li className="flex items-start text-white text-sm"><span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block mr-2 mt-1 shrink-0"></span>Please note, If you do not follow above conditions, we will reject your transaction and send you back your money.</li>
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
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={handleUploadClick}
                className="bg-[#1D8751] rounded-lg px-4 py-2 flex items-center justify-center hover:bg-[#176e43] transition-colors"
              >
                <Upload className="w-4 h-4 text-white mr-2" />
              
              </button>
              {selectedFile && (
                <span className="text-[#1D8751] text-sm">
                  {selectedFile.name}
                </span>
              )}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept=".jpg,.jpeg,.png,.gif,.pdf"
                className="hidden"
              />
            </div>
          </div>
          {fileError && (
            <div className="flex items-center mt-2 text-[#E23D3A] text-xs">
              <AlertCircle className="w-4 h-4 mr-1" />
              {fileError}
            </div>
          )}
          <div className="text-[#788099] text-xs mb-4">
            Please upload the screenshot of your payment here.<br/>
            This is necessary for verification purposes.<br/>
            Supported formats: JPG, PNG, GIF, PDF (max 5MB)
          </div>
          <label className="block text-sm mb-2 text-white">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Please type here any extra information you want to share with us"
            className="w-full p-3 rounded-lg text-sm bg-[#18181D] text-[#788099] border border-[#35353E] mb-4 focus:outline-none"
          />
          <div className="flex flex-col gap-2 mb-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmPayment}
                onChange={e => setConfirmPayment(e.target.checked)}
                className="sr-only"
              />
              <span className={`w-5 h-5 flex items-center justify-center rounded-lg border-2 border-[#1D8751] transition mt-0.5 flex-shrink-0`}>
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
              <span className={`w-5 h-5 flex items-center justify-center rounded-lg border-2 border-[#1D8751] transition mt-0.5 flex-shrink-0`}>
                {acceptTerms && (
                  <svg width="18" height="18" viewBox="0 0 18 18" className="text-[#1D8751]">
                    <polyline points="4.5 9.5 8 13 13.5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span className="text-white text-sm">I accept Terms and condition</span>
            </label>
          </div>
          {/* Show submit error if exists */}
          {submitError && (
            <div className="flex items-center mt-2 text-[#E23D3A] text-sm mb-4">
              <AlertCircle className="w-4 h-4 mr-1" />
              {submitError}
            </div>
          )}
          <button 
            onClick={handleSubmit}
            className="w-full py-2 rounded-full text-white font-semibold text-lg bg-[#1D8751] mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!!walletError || !confirmAddress || !confirmPayment || !acceptTerms || !selectedFile || !selectedMethod || !selectedProvider}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepositModal;