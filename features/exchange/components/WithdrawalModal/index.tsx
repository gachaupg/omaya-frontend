import React from 'react';
import WithdrawForm from './WithdrawForm';
import { useWithdrawLogic } from './useWithdrawLogic';
import DepositModal from '../DepositModal';
import AddPaymentDetailsModal from '../AddPaymentDetailsModal';
import { Asset } from '../../types';
import AssetsSelector from './AssetsSelector';

interface WithdrawalModalProps {
  asset?: Asset;
  assetType?: 'Crypto' | 'Forex';
  onClose: () => void;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ asset, assetType, onClose }) => {
  const logic = useWithdrawLogic(asset, assetType, onClose);

  if (logic.showDepositModal && logic.currentAsset) {
    return <DepositModal asset={logic.currentAsset} assetType={logic.currentAssetType} onClose={onClose} />;
  }
  if (logic.showAddPaymentDetailsModal) {
    return (
      <AddPaymentDetailsModal
        onClose={() => logic.setShowAddPaymentDetailsModal(false)}
        onAddPaymentDetail={(detail) => {
          logic.setSelectedUserPaymentDetail(detail);
          logic.setShowAddPaymentDetailsModal(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#18181D] md:p-4">
      {/* Top Section: Asset/Network Selector and Transaction Type Tabs */}
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        {/* Crypto/Forex Toggle */}
        <div className="flex flex-col">
          <h1 className="text-xl text-white mb-2">Withdrawal</h1>
          <div className="flex w-full border border-[#1D8751] rounded-lg p-1 gap-2">
            <button
              className={`flex-1 px-2 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${logic.currentAssetType === 'Crypto' ? 'bg-[#1D8751] text-white' : 'bg-[#35353E] text-[#788099]'}`}
              onClick={() => {
                logic.setCurrentAssetType('Crypto');
                logic.setSelectedPaymentMethod(null);
                logic.setSelectedPaymentProvider(null);
                logic.setSelectedUserPaymentDetail(null);
              }}
            >
              Crypto
            </button>
            <button
              className={`flex-1 px-2 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${logic.currentAssetType === 'Forex' ? 'bg-[#1D8751] text-white' : 'bg-[#35353E] text-[#788099]'}`}
              onClick={() => {
                logic.setCurrentAssetType('Forex');
                logic.setSelectedPaymentMethod(null);
                logic.setSelectedPaymentProvider(null);
                logic.setSelectedUserPaymentDetail(null);
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
                onClick={() => logic.setShowDepositModal(true)}
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
      {/* Transaction Info Section (AssetSelector) */}
      <AssetsSelector
        currentAsset={logic.currentAsset}
        selectedNetwork={logic.selectedNetwork}
        setSelectedNetwork={logic.setSelectedNetwork}
        currentAssetType={logic.currentAssetType}
        amount={logic.amount}
        setAmount={logic.setAmount}
        assetAmount={logic.assetAmount}
        commission={logic.commission}
        commissionRate={logic.commissionRate}
        networkFee={logic.networkFee}
        totalFees={logic.totalFees}
        amountNum={logic.amountNum}
      />
      {/* Withdraw Form (form content only) */}
      <WithdrawForm
        {...logic}
        fileInputRef={logic.fileInputRef as React.RefObject<HTMLInputElement>}
        onShowDepositModal={() => logic.setShowDepositModal(true)}
      />
    </div>
  );
};

export default WithdrawalModal;
