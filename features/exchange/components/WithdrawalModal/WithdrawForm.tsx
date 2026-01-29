import React from 'react';
import { Toaster } from 'react-hot-toast';
import AssetsSelector from './AssetsSelector';
import { AlertCircle, Upload, Copy, QrCodeIcon, ChevronDown } from 'lucide-react';
import { Asset, Network, PaymentMethod, PaymentProvider, UserPaymentDetail } from '../../types';

interface WithdrawFormProps {
  currentAsset: Asset | null;
  currentAssetType: 'Crypto' | 'Forex';
  setCurrentAssetType: (type: 'Crypto' | 'Forex') => void;
  selectedNetwork: Network | null;
  setSelectedNetwork: (network: Network | null) => void;
  amount: string;
  setAmount: (amount: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  confirmPayment: boolean;
  setConfirmPayment: (val: boolean) => void;
  acceptTerms: boolean;
  setAcceptTerms: (val: boolean) => void;
  selectedPaymentMethod: PaymentMethod | null;
  setSelectedPaymentMethod: (method: PaymentMethod | null) => void;
  selectedPaymentProvider: PaymentProvider | null;
  setSelectedPaymentProvider: (provider: PaymentProvider | null) => void;
  paymentMethods: PaymentMethod[];
  paymentProviders: PaymentProvider[];
  selectedUserPaymentDetail: UserPaymentDetail | null;
  setSelectedUserPaymentDetail: (detail: UserPaymentDetail | null) => void;
  filteredForexUserPaymentDetails: UserPaymentDetail[];
  filteredCryptoUserPaymentDetails: UserPaymentDetail[];
  adminWalletAddress: string;
  confirmAddress: boolean;
  setConfirmAddress: (val: boolean) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUploadClick: () => void;
  selectedFile: File | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  fileError: string | null;
  handleRemovePaymentDetail: (id: number) => void;
  commission: number;
  commissionRate: number;
  networkFee: number;
  totalFees: number;
  assetAmount: number;
  amountNum: number;
  showAddPaymentDetailsModal: boolean;
  setShowAddPaymentDetailsModal: (val: boolean) => void;
  submitError: string | null;
  handleSubmit: () => void;
  onShowDepositModal: () => void;
}

const WithdrawForm: React.FC<WithdrawFormProps> = (props) => {
  const {
    currentAssetType,
    notes,
    setNotes,
    confirmPayment,
    setConfirmPayment,
    acceptTerms,
    setAcceptTerms,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    selectedPaymentProvider,
    setSelectedPaymentProvider,
    paymentMethods,
    paymentProviders,
    selectedUserPaymentDetail,
    setSelectedUserPaymentDetail,
    filteredForexUserPaymentDetails,
    adminWalletAddress,
    confirmAddress,
    setConfirmAddress,
    handleFileUpload,
    handleUploadClick,
    selectedFile,
    fileInputRef,
    fileError,
    handleRemovePaymentDetail,
    setShowAddPaymentDetailsModal,
    submitError,
    handleSubmit,
  } = props;

  return (
    <>
      <Toaster />
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
                onClick={() => navigator.clipboard.writeText(adminWalletAddress)}
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
                        (method) => method.name === e.target.value
                      );
                      setSelectedPaymentMethod(selected || null);
                      setSelectedPaymentProvider(null);
                      setSelectedUserPaymentDetail(null);
                    }}
                    className="w-full bg-[#18181D] border border-[#35353E] rounded-xl text-white py-2 pl-3 pr-8 text-sm font-medium appearance-none focus:outline-none h-12"
                  >
                    <option value="" disabled>Select Payment Method</option>
                    {paymentMethods.map((method) => (
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
                        (provider) => provider.provider_name === e.target.value
                      );
                      setSelectedPaymentProvider(selected || null);
                      setSelectedUserPaymentDetail(null);
                    }}
                    className="w-full bg-[#18181D] border border-[#35353E] rounded-xl text-white py-2 pl-3 pr-8 text-sm font-medium appearance-none focus:outline-none h-12"
                    disabled={!selectedPaymentMethod || paymentProviders.length === 0}
                  >
                    <option value="" disabled>Select Provider</option>
                    {paymentProviders.map((provider) => (
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
                    <p className="text-white text-sm"><span className="text-[#788099]">Account Number:</span> {selectedUserPaymentDetail.account_number}</p>
                    <p className="text-white text-sm"><span className="text-[#788099]">Account Name:</span> {selectedUserPaymentDetail.account_name}</p>
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
            {/* User Payment Details List for Forex */}
            {selectedPaymentMethod && selectedPaymentProvider && filteredForexUserPaymentDetails.length > 0 ? (
              <div className="space-y-4 mb-4">
                <label className="block text-sm mb-1 text-[#788099]">Available Bank Details</label>
                {filteredForexUserPaymentDetails
                  .filter((detail) => !selectedUserPaymentDetail || detail.id !== selectedUserPaymentDetail.id)
                  .map((detail) => (
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
                          e.stopPropagation();
                          setSelectedUserPaymentDetail(detail);
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
          {submitError && (
            <div className="flex items-center mt-2 text-[#E23D3A] text-sm mb-4">
              <AlertCircle className="w-4 h-4 mr-1" />
              {submitError}
            </div>
          )}
          <button 
            onClick={handleSubmit}
            className="w-full py-2 rounded-full text-white font-semibold text-lg bg-[#1D8751] mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={(() => {
              const isCryptoDisabled = currentAssetType === 'Crypto' && (!selectedUserPaymentDetail || !confirmAddress || !confirmPayment || !acceptTerms || !selectedFile);
              const isForexDisabled = currentAssetType === 'Forex' && (!selectedUserPaymentDetail || !confirmPayment || !acceptTerms || !selectedFile);
              return isCryptoDisabled || isForexDisabled;
            })()}
          >
            Submit
          </button>
        </div>
      </div>
    </>
  );
};

export default WithdrawForm;
