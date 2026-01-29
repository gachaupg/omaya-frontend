/**
 * WithdrawModal.tsx – auto‑generated placeholder
 * WithdrawModal.tsx – auto‑generated placeholder
 */
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector} from 'react-redux'
import { AppDispatch} from '../../../store'
import { ChevronDown, Upload, AlertCircle, Copy, QrCodeIcon } from 'lucide-react';
import DepositModal from './DepositModal';
import AddPaymentDetailsModal from './AddPaymentDetailsModal';
import { Asset, Network, PaymentMethod, PaymentProvider, UserPaymentDetail, AdminPaymentDetail } from '../types';
import { deleteUserPaymentDetail, fetchPaymentMethods, fetchPaymentProviders, fetchUserPaymentDetails } from '../slices/paymentSlice';
import { fetchAssets, createWithdrawal } from '../slices/exchangeSlice';
import toast, { Toaster } from 'react-hot-toast';
import { AxiosRequestConfig } from '../../../lib/apiClient';

import { logger } from '@/lib/utils/logger';

interface WithdrawalModalProps {
  asset?: Asset;
  assetType?: 'Crypto' | 'Forex';
  onClose: () => void;
}

const CRYPTO_ASSETS = ['USDT Tether', 'BTC', 'ETH', 'BNB', 'DOGE', 'ADA', 'SOL', 'XRP', 'USD'];

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ asset, assetType, onClose }) => {
  const dispatch = useDispatch<AppDispatch>()
  const {paymentMethods, paymentProviders, userPaymentDetails} =  useSelector((state: any) => state.payment);
  const { assets } = useSelector((state: any) => state.exchange);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(asset?.networks[0] || null);
  const [amount, setAmount] = useState('0');
  const [notes, setNotes] = useState('');
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<PaymentProvider | null>(null);
  const [confirmAddress, setConfirmAddress] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [adminWalletAddress, setAdminWalletAddress] = useState<string>('');
  const [selectedAdminPaymentDetail, setSelectedAdminPaymentDetail] = useState<AdminPaymentDetail | null>(null);
  const [selectedUserPaymentDetail, setSelectedUserPaymentDetail] = useState<UserPaymentDetail | null>(null);
  const [showAddPaymentDetailsModal, setShowAddPaymentDetailsModal] = useState(false);
  const [sendingFrom, setSendingFrom] = useState('');
  const [selectedAdminBankDetail, setSelectedAdminBankDetail] = useState<AdminPaymentDetail | null>(null);
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(asset || null);
  const [currentAssetType, setCurrentAssetType] = useState<'Crypto' | 'Forex'>(assetType || 'Crypto');

  const filteredForexUserPaymentDetails = userPaymentDetails.filter((detail: UserPaymentDetail) => 
    !detail.wallet_address && 
    selectedPaymentMethod && detail.payment_method_name === selectedPaymentMethod.name &&
    selectedPaymentProvider && detail.payment_provider_name === selectedPaymentProvider.provider_name
  );

  const filteredCryptoUserPaymentDetails = userPaymentDetails.filter((detail: UserPaymentDetail) => 
    !!detail.wallet_address &&
    selectedPaymentMethod && detail.payment_method_name === selectedPaymentMethod.name 
  );

  useEffect(() => {
    dispatch(fetchPaymentMethods())
      .unwrap()
      .catch((error) => {
        toast.error(`Failed to fetch payment methods: ${error}`);
      });
  }, [dispatch]);

  useEffect(() => {
    if (selectedPaymentMethod) {
      dispatch(fetchPaymentProviders(selectedPaymentMethod.name))
        .unwrap()
        .catch((error) => {
          toast.error(`Failed to fetch payment providers: ${error}`);
        });
    }
  }, [dispatch, selectedPaymentMethod]);

  useEffect(() => {
    if (currentAssetType === 'Forex' && currentAsset && selectedPaymentMethod && selectedPaymentProvider) {
      const matchingAdminAccount = currentAsset.admin_accounts.find(account => 
        account.payment_method === selectedPaymentMethod.name &&
        account.provider_name === selectedPaymentProvider.provider_name &&
        account.asset === currentAsset.symbol && 
        account.payment_type === 'Forex'
      );
      setSelectedAdminBankDetail(matchingAdminAccount || null);
    } else if (currentAssetType === 'Forex') {
      setSelectedAdminBankDetail(null);
    }
  }, [currentAsset, selectedPaymentMethod, selectedPaymentProvider, currentAssetType]);

  useEffect(() => {
    if (currentAssetType === 'Crypto' && currentAsset && selectedNetwork) {
      const matchingAdminAccount = currentAsset.admin_accounts.find(account => 
        account.network === selectedNetwork.network_type && account.asset === currentAsset.symbol
      );
      if (matchingAdminAccount) {
        setAdminWalletAddress(matchingAdminAccount.wallet_address);
      } else {
        setAdminWalletAddress('');
      }
    } else if (currentAssetType === 'Crypto') {
      setAdminWalletAddress('');
    }
    else if (currentAssetType === 'Forex' && currentAsset) {
      // For Forex, we look for the first admin account that matches the asset
      const matchingAccount = currentAsset.admin_accounts.find(account => 
        account.payment_type === 'Forex' && account.payment_type === currentAssetType
      );
      if (matchingAccount) {
        setAdminWalletAddress(matchingAccount.wallet_address || matchingAccount.account_number || '');
      } else {
        setAdminWalletAddress('');
      }
    }
  }, [currentAsset, selectedNetwork, currentAssetType]);

  useEffect(() => {
    dispatch(fetchUserPaymentDetails())
      .unwrap()
      .then((details: UserPaymentDetail[]) => {
      })
      .catch((error) => {
        toast.error(`Failed to fetch user payment details: ${error}`);
        setSelectedUserPaymentDetail(null);
      });
  }, [dispatch]);

  useEffect(() => {
    if (!assets) {
      dispatch(fetchAssets()); 
    }
  }, [dispatch, assets]);

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

  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0 && !selectedPaymentMethod) {
      // setSelectedPaymentMethod(paymentMethods[0]); // REMOVED AUTO-SELECTION
    }
  }, [paymentMethods, selectedPaymentMethod]);

  useEffect(() => {
    if (paymentProviders && paymentProviders.length > 0 && !selectedPaymentProvider) {
      // setSelectedPaymentProvider(paymentProviders[0]); // REMOVED AUTO-SELECTION
    }
  }, [paymentProviders, selectedPaymentProvider]);

  const amountNum = parseFloat(amount) || 0;

  let commission = 0;
  let commissionRate = 0;
  if (currentAsset?.range_commissions && amountNum > 0) {
    const commissionObj = currentAsset.range_commissions.find(
      (rc) => rc.commission_type === 'withdrawal' &&
        amountNum >= parseFloat(rc.range_min) &&
        amountNum <= parseFloat(rc.range_max)
    );
    if (commissionObj) {
      commissionRate = parseFloat(commissionObj.commission);
      commission = (amountNum * commissionRate) / 100;
    }
  }

  const networkFee = (currentAssetType === 'Crypto' && selectedNetwork && amountNum > 0)
    ? parseFloat(selectedNetwork.withdrawal_fee)
    : 0;

  const totalFees = commission + networkFee;

  const assetAmount = amountNum + totalFees;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    
    if (!file) {
      return;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setFileError('Invalid file type. Please upload an image or PDF.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File too large. Maximum size is 5MB.');
      return;
    }
    
    setSelectedFile(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePaymentDetail = async (paymentDetailId: number) => {
    try {
      if (selectedUserPaymentDetail?.id === paymentDetailId) {
        setSelectedUserPaymentDetail(null);
      }
      dispatch(fetchUserPaymentDetails());
    } catch (error: any) {
      toast.error(`Failed to remove payment detail: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    
    if (currentAssetType === 'Crypto' && !adminWalletAddress) {
      setSubmitError('Wallet address is required');
      return;
    }
    
    if (currentAssetType === 'Crypto' && !confirmAddress) {
      setSubmitError('Please confirm the wallet address');
      return;
    }

    if (currentAssetType === 'Forex' && !selectedUserPaymentDetail) {
      setSubmitError('Please select your bank details or add new ones.');
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

    const withdrawalPayload = new FormData();
    withdrawalPayload.append('requested_amount', amount);
    withdrawalPayload.append('payment_provider', selectedUserPaymentDetail?.payment_provider_name || '');
    withdrawalPayload.append('payment_method', selectedUserPaymentDetail?.payment_method_name || '');
    withdrawalPayload.append('additional_info', notes);
    withdrawalPayload.append('currency', currentAssetType === 'Crypto' ? 'USDT' : 'USD');
    if (selectedNetwork) {
    withdrawalPayload.append('network', selectedNetwork.network_id);
    }
    withdrawalPayload.append('user_payment_detail_id', selectedUserPaymentDetail?.id.toString() || '');
    if (currentAsset) {
      withdrawalPayload.append('asset', currentAsset.asset_id);
    }
    
    if (selectedFile) {
      withdrawalPayload.append('screenshot', selectedFile);
    }

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    try {
      await dispatch(createWithdrawal({ payload: withdrawalPayload, config })).unwrap();
      toast.success('Withdrawal request submitted successfully!');
      onClose();
    } catch (error: any) {
      logger.error('exchange', 'Withdrawal submission error:', error);
    }
  };

  if (!currentAsset) {
    return <div className="min-h-screen bg-[#18181D] md:p-4 text-white">Loading asset details...</div>;
  }

  if (showDepositModal) {
    return <DepositModal asset={currentAsset!} assetType={currentAssetType} onClose={onClose} />;
  }

  if (showAddPaymentDetailsModal) {
    return <AddPaymentDetailsModal 
      onClose={() => setShowAddPaymentDetailsModal(false)}
      onAddPaymentDetail={(detail) => {
        setSelectedUserPaymentDetail(detail);
        setShowAddPaymentDetailsModal(false);
      }}
    />;
  }

  return (
    <>
      {showDepositModal ? (
        <DepositModal asset={currentAsset} assetType={currentAssetType} onClose={onClose} />
      ) : showAddPaymentDetailsModal ? (
        <AddPaymentDetailsModal 
          onClose={() => setShowAddPaymentDetailsModal(false)}
          onAddPaymentDetail={(detail) => {
            setSelectedUserPaymentDetail(detail);
            setShowAddPaymentDetailsModal(false);
          }}
        />
      ) : (
        <div className="min-h-screen bg-[#18181D] md:p-4">
          <Toaster />
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
            {/* Crypto/Forex Toggle */}
            <div className="flex flex-col">
              <h1 className="text-xl text-white mb-2">Withdrawal</h1>  
              <div className="flex w-full border border-[#1D8751] rounded-lg p-1 gap-2">
              <button 
                className={`flex-1 px-2 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  currentAssetType === 'Crypto' 
                    ? 'bg-[#1D8751] text-white' 
                    : 'bg-[#35353E] text-[#788099]'
                }`}
                onClick={() => {
                  setCurrentAssetType('Crypto');
                  // Reset payment method selections when switching
                  setSelectedPaymentMethod(null);
                  setSelectedPaymentProvider(null);
                  setSelectedUserPaymentDetail(null);
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
                  // Reset payment method selections when switching
                  setSelectedPaymentMethod(null);
                  setSelectedPaymentProvider(null);
                  setSelectedUserPaymentDetail(null);
                }}
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
                    <select
                      value={selectedNetwork?.network_id || ''}
                      onChange={(e) => {
                        const selected = currentAsset?.networks.find(
                          (network) => network.network_id === e.target.value
                        );
                        setSelectedNetwork(selected || null);
                      }}
                      className="w-full bg-transparent text-white text-sm font-medium appearance-none focus:outline-none h-full pr-8"
                    >
                      {currentAsset?.networks.map((network) => (
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
                    value={amountNum > 0 ? assetAmount.toFixed(2) : '0.00'}
                    readOnly
                    className="bg-[#18181D] text-white text-sm font-medium rou  nded-xl px-3 py-1 border border-[#35353E] w-full h-full focus:outline-none"
                  />
                </div>
              </div>
            ):
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
            }

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
              <AlertCircle className="w-4 h-4 mr-2 text-[#F79330]" />
              <span className='text-white'>Transactions are subject to commission, above is the information on the commission rates</span>
            </div>
          </div>

          {/* Wallet Details Section (Crypto) */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-white">2- OMAYA Exchange Account Detail</h2>
            <div className="bg-[#1D1D23] border border-[#35353E] p-4 rounded-xl">
                  <label className="block text-sm mb-2 text-[#788099]">Address</label>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="flex items-center w-full sm:flex-1 bg-[#18181D] rounded-full px-4 py-2 border border-[#1D8751]">
                      <svg className="w-5 h-5 text-[#1D8751] mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="7" rx="2" stroke="#1D8751" strokeWidth="2"/><path d="M7 11V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4" stroke="#1D8751" strokeWidth="2"/></svg>
                      <input
                        type="text"
                        value={adminWalletAddress}
                        readOnly
                        className="flex-1 bg-transparent text-[#1D8751] text-sm font-medium focus:outline-none"
                      />
                      <QrCodeIcon className='text-[#1D8751] w-4 h-4'/>
                    </div>
                    <button 
                        onClick={() => navigator.clipboard.writeText(selectedUserPaymentDetail?.wallet_address || adminWalletAddress)}
                        className="bg-[#35353E] py-2 px-3 rounded-full sm:ml-2 flex gap-2 w-full sm:w-auto justify-center"
                    >
                      <p className='text-[#1D8751]'>Copy</p>
                      <Copy className='text-[#1D8751] w-4 h-4'/>
                    </button>
                  </div>
                  <div className="flex items-center mt-2">
                    <AlertCircle className="w-4 h-4 text-[#F79330] mr-2" />
                    <span className="text-xs text-white">Please ensure you only send the selected Cryptocurrency and its correct Network to this address.<br/>Sending the wrong crypto will result in permanent loss.</span>
                  </div>
            </div>
          </div>

          {/* Bank Details Section (Forex) */}
          <div className="mb-4">
              <h2 className="text-lg font-semibold mb-4 text-white">3- Your Bank Details</h2>
              <div className="bg-[#1D1D23] border border-[#35353E] p-4 rounded-xl mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Payment Method Dropdown */}
                  <div>
                    <label className="block text-xs mb-1 text-[#788099]">Payment Method</label>
                    <div className="relative">
                      <select
                        value={selectedPaymentMethod?.name || ''}
                        onChange={(e) => {
                          const selected = paymentMethods.find(
                            (method: PaymentMethod) => method.name === e.target.value
                          );
                          setSelectedPaymentMethod(selected || null);
                          setSelectedPaymentProvider(null);
                          setSelectedUserPaymentDetail(null);
                        }}
                        className="w-full bg-[#18181D] border border-[#35353E] rounded-xl text-white py-2 pl-3 pr-8 text-sm font-medium appearance-none focus:outline-none h-12"
                      >
                        <option value="" disabled>Select Payment Method</option>
                        {paymentMethods.map((method: PaymentMethod) => (
                          <option key={method.name} value={method.name}>
                              {method.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDown className="h-4 w-4 text-[#788099]" />
                      </div>
                    </div>
                  </div>

                  {/* Provider Dropdown */}
                  <div>
                    <label className="block text-xs mb-1 text-[#788099]">Provider</label>
                    <div className="relative">
                      <select
                        value={selectedPaymentProvider?.provider_name || ''}
                        onChange={(e) => {
                          const selected = paymentProviders.find(
                            (provider: PaymentProvider) => provider.provider_name === e.target.value
                          );
                          setSelectedPaymentProvider(selected || null);
                          setSelectedUserPaymentDetail(null);
                        }}
                        className="w-full bg-[#18181D] border border-[#35353E] rounded-xl text-white py-2 pl-3 pr-8 text-sm font-medium appearance-none focus:outline-none h-12"
                        disabled={!selectedPaymentMethod || paymentProviders.length === 0}
                      >
                        <option value="" disabled>Select Provider</option>
                        {paymentProviders.map((provider: PaymentProvider) => (
                          <option key={provider.provider_name} value={provider.provider_name}>
                              {provider.provider_name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDown className="h-4 w-4 text-[#788099]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Payment Detail Section */}
                {selectedUserPaymentDetail && (
                  <div className="mb-6 p-4 bg-[#18181D] rounded-xl border border-[#1D8751]">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-white text-sm font-medium mb-2">Selected Payment Method</h3>
                        {currentAssetType === 'Forex' ? (
                          <>
                            <p className="text-white text-sm"><span className="text-[#788099]">Account Number:</span> {selectedUserPaymentDetail.account_number}</p>
                            <p className="text-white text-sm"><span className="text-[#788099]">Account Name:</span> {selectedUserPaymentDetail.account_name}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-white text-sm"><span className="text-[#788099]">Wallet Address:</span> {selectedUserPaymentDetail.wallet_address}</p>
                            <p className="text-white text-sm"><span className="text-[#788099]">Account Name:</span> {selectedUserPaymentDetail.account_name}</p>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemovePaymentDetail(selectedUserPaymentDetail.id)}
                        className="bg-[#E23D3A] text-white px-4 py-2 rounded-full font-medium text-sm hover:bg-[#c23331] transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {currentAssetType === 'Forex' && (
                  <>
                    {/* User Payment Details List for Forex */}
                    {selectedPaymentMethod && selectedPaymentProvider && filteredForexUserPaymentDetails.length > 0 ? (
                      <div className="space-y-4 mb-4">
                        <label className="block text-sm mb-1 text-[#788099]">Available Bank Details</label>
                        {filteredForexUserPaymentDetails
                          .filter((detail: { id: number; }) => !selectedUserPaymentDetail || detail.id !== selectedUserPaymentDetail.id)
                          .map((detail: UserPaymentDetail) => (
                            <div
                              key={detail.id}
                              className="flex justify-between items-center bg-[#18181D] rounded-xl px-4 py-3 border border-[#35353E] hover:border-[#1D8751] transition cursor-pointer"
                              onClick={() => setSelectedUserPaymentDetail(detail)}
                            >
                              <div>
                                <p className="text-white text-sm"><span className="text-[#788099]">Account Number:</span> {detail.account_number}</p>
                                <p className="text-white text-sm"><span className="text-[#788099]">Account Name:</span> {detail.account_name}</p>
                              </div>
                              <button
                                onClick={(e) => {
                                ()=>setSelectedUserPaymentDetail(detail)
                                }}
                                className="bg-[#18181D] text-white px-3 py-1 rounded-full font-medium text-xs transition"
                              >
                                Select
                              </button>
                            </div>
                          ))}
                      </div>
                    ) : selectedPaymentMethod && selectedPaymentProvider && filteredForexUserPaymentDetails.length === 0 ? (
                      <div className="flex items-center justify-center p-4 text-[#788099]">
                        No bank details found for the selected method and provider. Please add new details.
                      </div>
                    ) : null}
                  </>
                )}

                {currentAssetType === 'Crypto' && (
                  <>
                    {/* User Crypto Wallet Details List */}
                    {selectedNetwork && selectedPaymentMethod && filteredCryptoUserPaymentDetails.length > 0 ? (
                      <div className="space-y-4 mb-4">
                        <label className="block text-sm mb-1 text-[#788099]">Available Crypto Wallets</label>
                        {filteredCryptoUserPaymentDetails
                        .filter((detail: { id: number }) => !selectedUserPaymentDetail || detail.id !== selectedUserPaymentDetail.id)
                        .map((detail: UserPaymentDetail) => (
                          <div
                            key={detail.id}
                            className="flex justify-between items-center bg-[#18181D] rounded-xl px-4 py-3 border border-[#35353E] hover:border-[#1D8751] transition cursor-pointer"
                            onClick={() => setSelectedUserPaymentDetail(detail)}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
                              {/* Account Name Field Style */}
                              <div className="flex flex-col items-start bg-[#18181D] w-full sm:w-1/2">
                                <span className="w-40 text-[#788099] text-sm">Account Name</span>
                                <div className='border border-[#35353E] rounded-xl px-3 py-2 w-full mt-2'>
                                 <span className="text-white text-sm">{detail.account_name}</span>
                                </div>
                              </div>

                              {/* Wallet Number / Mobile Number Field Style */}
                              <div className="flex flex-col items-start bg-[#18181D] w-full sm:w-1/2">
                                <span className="w-40 text-[#788099] text-sm">Wallet Number</span>
                                <div className='border border-[#35353E] rounded-xl px-3 py-2 w-full mt-2'>
                                <span className="text-white text-sm">{detail.wallet_address}</span>
                                </div>
                              </div>
                            </div>

                            {/* Select Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUserPaymentDetail(detail);
                              }}
                              className="ml-4 bg-[#1D8751] text-white px-3 py-2 rounded-full font-medium text-xs transition"
                            >
                              Select
                            </button>
                          </div>
                      ))}

                      </div>
                    ) : selectedNetwork && filteredCryptoUserPaymentDetails.length === 0 ? (
                      <div className="flex items-center justify-center p-4 text-[#788099]">
                        No crypto wallet details found for the selected network. Please add new details.
                      </div>
                    ) : null}
                  </>
                )}

                <div className="flex justify-end mt-4">
                  <button 
                    onClick={() => setShowAddPaymentDetailsModal(true)}
                    className="bg-[#1D8751] text-white px-6 py-2 rounded-full font-medium text-sm hover:bg-[#17693e] transition"
                  >
                    + Add New Payment Method
                  </button>
                </div>
                        
                        {/* Transfer Details */}
                        <div className="mt-4 bg-transparent">
                          <div className="flex items-center mb-2">
                            <span className="text-[#788099] text-sm font-medium mr-2">Transfer Details</span>
                            <AlertCircle className="w-4 h-4 text-[#1D8751]" />
                          </div>
                          <ul className="space-y-1 mt-2 border border-[#1D8751] rounded-xl p-4">
                            <li className="flex items-center text-white text-sm"><span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block mr-2 shrink-0"></span>Please send the money from your own account Only</li>
                            <li className="flex items-center text-white text-sm"><span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block mr-2 shrink-0"></span>Put transaction ID in the description field of the bank</li>
                            <li className="flex items-center text-white text-sm"><span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block mr-2 shrink-0"></span>Please note, If you do not follow above conditions, we will reject your transaction and send you back your money.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

          {/* Additional Info */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-white">4- Additional Information</h2>
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
                    checked={confirmAddress}
                    onChange={e => setConfirmAddress(e.target.checked)}
                    className="sr-only"
                  />
                  <span className={`w-5 h-5 flex items-center justify-center rounded-lg border-2 border-[#1D8751] transition mt-0.5 flex-shrink-0`}>
                    {confirmAddress && (
                      <svg width="18" height="18" viewBox="0 0 18 18" className="text-[#1D8751]">
                        <polyline points="4.5 9.5 8 13 13.5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  <span className="text-white text-sm">I confirm the wallet address</span>
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
                  <span className="text-white text-sm">I accept the terms and conditions</span>
                </label>
              </div>
              {/* Show submit error if exists */}
              {/* {submitError && (
                <div className="flex items-center mt-2 text-[#E23D3A] text-sm mb-4">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {submitError}
                </div>
              )} */}
              <button 
                onClick={handleSubmit}
                className="w-full py-2 rounded-full text-white font-semibold text-lg bg-[#1D8751] mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  (() => {
                    const isCryptoDisabled = currentAssetType === 'Crypto' && (!selectedUserPaymentDetail || !selectedUserPaymentDetail.wallet_address || !confirmAddress || !confirmPayment || !acceptTerms || !selectedFile);
                    const isForexDisabled = currentAssetType === 'Forex' && (!selectedUserPaymentDetail || !confirmPayment || !acceptTerms || !selectedFile);
                    return isCryptoDisabled || isForexDisabled;
                  })()
                }
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WithdrawalModal;