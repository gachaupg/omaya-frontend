import React, { useState, useEffect, useRef, useMemo, createRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../../../store/index';
import { fetchPaymentMethods, fetchPaymentProviders, fetchUserPaymentDetails } from '../../slices/paymentSlice';
import { fetchAssets, createWithdrawal } from '../../slices/exchangeSlice';
import toast from 'react-hot-toast';
import { Asset, Network, PaymentMethod, PaymentProvider, UserPaymentDetail, AdminPaymentDetail } from '../../types';
// Import utility functions for calculations and validation
// Adjust these import paths as needed
import { calculateCommission } from '../utils/calculations/commissionCalculator';
import { calculateNetworkFee, calculateTotalFees } from '../utils/calculations/feeCalculator';
import { AxiosRequestConfig } from '@/lib/apiClient';

export function useWithdrawLogic(
  asset?: Asset,
  assetType?: 'Crypto' | 'Forex',
  onClose?: () => void
) {
  const dispatch = useDispatch<AppDispatch>();
  const { paymentMethods, paymentProviders, userPaymentDetails } = useSelector((state: any) => state.payment);
  const { assets } = useSelector((state: any) => state.exchange);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(asset?.networks?.[0] || null);
  const [amount, setAmount] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [confirmPayment, setConfirmPayment] = useState<boolean>(false);
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<PaymentProvider | null>(null);
  const [confirmAddress, setConfirmAddress] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = React.createRef<HTMLInputElement>();
  const [adminWalletAddress, setAdminWalletAddress] = useState<string>('');
  const [selectedAdminPaymentDetail, setSelectedAdminPaymentDetail] = useState<AdminPaymentDetail | null>(null);
  const [selectedUserPaymentDetail, setSelectedUserPaymentDetail] = useState<UserPaymentDetail | null>(null);
  const [showAddPaymentDetailsModal, setShowAddPaymentDetailsModal] = useState<boolean>(false);
  const [sendingFrom, setSendingFrom] = useState<string>('');
  const [selectedAdminBankDetail, setSelectedAdminBankDetail] = useState<AdminPaymentDetail | null>(null);
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(asset || null);
  const [currentAssetType, setCurrentAssetType] = useState<'Crypto' | 'Forex'>(assetType || 'Crypto');

  // Filtered user payment details
  const filteredForexUserPaymentDetails = useMemo<UserPaymentDetail[]>(() => userPaymentDetails?.filter((detail: UserPaymentDetail) =>
    !detail.wallet_address &&
    selectedPaymentMethod && detail.payment_method_name === selectedPaymentMethod.name &&
    selectedPaymentProvider && detail.payment_provider_name === selectedPaymentProvider.provider_name
  ) || [], [userPaymentDetails, selectedPaymentMethod, selectedPaymentProvider]);

  const filteredCryptoUserPaymentDetails = useMemo<UserPaymentDetail[]>(() => userPaymentDetails?.filter((detail: UserPaymentDetail) =>
    !!detail.wallet_address &&
    selectedPaymentMethod && detail.payment_method_name === selectedPaymentMethod.name
  ) || [], [userPaymentDetails, selectedPaymentMethod]);

  useEffect(() => {
    dispatch(fetchPaymentMethods()).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (selectedPaymentMethod) {
      dispatch(fetchPaymentProviders(selectedPaymentMethod.name)).catch(() => {});
    }
  }, [dispatch, selectedPaymentMethod]);

  useEffect(() => {
    if (currentAssetType === 'Crypto' && currentAsset && selectedNetwork) {
      const matchingAdminAccount = currentAsset.admin_accounts?.find((account: AdminPaymentDetail) =>
        account.network === selectedNetwork.network_type && account.asset === currentAsset.symbol
      );
      setAdminWalletAddress(matchingAdminAccount?.wallet_address || '');
    } else if (currentAssetType === 'Crypto') {
      setAdminWalletAddress('');
    } else if (currentAssetType === 'Forex' && currentAsset) {
      const matchingAccount = currentAsset.admin_accounts?.find((account: AdminPaymentDetail) =>
        account.payment_type === 'Forex' && account.payment_type === currentAssetType
      );
      setAdminWalletAddress(matchingAccount?.wallet_address || matchingAccount?.account_number || '');
    }
  }, [currentAsset, selectedNetwork, currentAssetType]);

  useEffect(() => {
    dispatch(fetchUserPaymentDetails()).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (!assets) {
      dispatch(fetchAssets());
    }
  }, [dispatch, assets]);

  useEffect(() => {
    if (assets?.assets && assets.assets.length > 0) {
      const CRYPTO_ASSETS = ['USDT Tether', 'USDC', 'BTC', 'ETH', 'BNB', 'DOGE', 'ADA', 'SOL', 'XRP', 'USD'];
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

  const amountNum: number = parseFloat(amount) || 0;
  const { commission, commissionRate }: { commission: number; commissionRate: number } = currentAsset
    ? calculateCommission(currentAsset, amountNum)
    : { commission: 0, commissionRate: 0 };
  const networkFee: number = calculateNetworkFee(currentAssetType, selectedNetwork, amountNum);
  const totalFees: number = calculateTotalFees(commission, networkFee);
  const assetAmount: number = amountNum + totalFees;

  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) return;
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
    withdrawalPayload.append('additional_info', notes);
    withdrawalPayload.append('currency', currentAssetType === 'Crypto' ? 'USDT' : 'USD');
    if (selectedNetwork) {
      withdrawalPayload.append('network_id', selectedNetwork.network_id);
    }
    withdrawalPayload.append('user_payment_detail_id', selectedUserPaymentDetail?.id?.toString() || '');
    if (currentAsset) {
      withdrawalPayload.append('asset', currentAsset.asset_id);
    }
    withdrawalPayload.append('sent_from', sendingFrom || '');
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
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onClose) onClose();
    } catch (error: any) {
      setSubmitError('Withdrawal submission failed.');
    }
  };

  return {
    paymentMethods,
    paymentProviders,
    userPaymentDetails,
    assets,
    selectedNetwork,
    setSelectedNetwork,
    amount,
    setAmount,
    notes,
    setNotes,
    confirmPayment,
    setConfirmPayment,
    acceptTerms,
    setAcceptTerms,
    showDepositModal,
    setShowDepositModal,
    showAddPaymentDetailsModal,
    setShowAddPaymentDetailsModal,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    selectedPaymentProvider,
    setSelectedPaymentProvider,
    confirmAddress,
    setConfirmAddress,
    submitError,
    setSubmitError,
    selectedFile,
    setSelectedFile,
    fileError,
    setFileError,
    fileInputRef,
    adminWalletAddress,
    setAdminWalletAddress,
    selectedAdminPaymentDetail,
    setSelectedAdminPaymentDetail,
    selectedUserPaymentDetail,
    setSelectedUserPaymentDetail,
    sendingFrom,
    setSendingFrom,
    selectedAdminBankDetail,
    setSelectedAdminBankDetail,
    currentAsset,
    setCurrentAsset,
    currentAssetType,
    setCurrentAssetType,
    amountNum,
    commission,
    commissionRate,
    networkFee,
    totalFees,
    assetAmount,
    handleFileUpload,
    handleUploadClick,
    handleSubmit,
    handleRemovePaymentDetail,
    filteredForexUserPaymentDetails,
    filteredCryptoUserPaymentDetails,
  };
}
 