import React from "react";
import { AlertCircle, Upload, Copy } from "lucide-react";
import {
  PaymentMethod,
  PaymentProvider,
  AdminPaymentDetail,
} from "../../types";

interface DepositFormProps {
  walletAddress: string;
  setWalletAddress: (v: string) => void;
  walletError: string | null;
  confirmAddress: boolean;
  setConfirmAddress: (v: boolean) => void;
  confirmPayment: boolean;
  setConfirmPayment: (v: boolean) => void;
  acceptTerms: boolean;
  setAcceptTerms: (v: boolean) => void;
  notes: string;
  setNotes: (v: string) => void;
  selectedFile: File | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUploadClick: () => void;
  fileError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handlePasteClick: () => void;
  handleWalletAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => void;
  submitError: string | null;
  paymentMethods: PaymentMethod[];
  selectedMethod: PaymentMethod | null;
  setSelectedMethod: (m: PaymentMethod | null) => void;
  paymentProviders: PaymentProvider[];
  selectedProvider: PaymentProvider | null;
  setSelectedProvider: (p: PaymentProvider | null) => void;
  currentAdminPaymentDetails: AdminPaymentDetail[];
  amount: string;
  setAmount: (v: string) => void;
  amountNum: number;
  commission: number;
  commissionRate: number;
  networkFee: number;
  totalFees: number;
  assetAmount: number;
}

const DepositForm: React.FC<DepositFormProps> = ({
  walletAddress,
  walletError,
  confirmAddress,
  setConfirmAddress,
  confirmPayment,
  setConfirmPayment,
  acceptTerms,
  setAcceptTerms,
  notes,
  setNotes,
  selectedFile,
  handleFileUpload,
  handleUploadClick,
  fileError,
  fileInputRef,
  handlePasteClick,
  handleWalletAddressChange,
  handleSubmit,
  submitError,
  paymentMethods,
  selectedMethod,
  setSelectedMethod,
  paymentProviders,
  selectedProvider,
  setSelectedProvider,
  currentAdminPaymentDetails,
}) => {
  return (
    <>
      {/* Wallet Address */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4 text-white">
          2- Your Wallet Address
        </h2>
        <div className="mb-8 bg-[#1D1D23] border border-[#35353E] p-4 rounded-xl">
          <label className="block text-sm mb-2 text-[#788099]">
            Wallet/Account Address
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div
              className={`flex items-center w-full bg-[#18181D] rounded-full px-4 py-2 ${
                walletError
                  ? "border border-[#E23D3A]"
                  : "border border-[#35353E]"
              }`}
            >
              <div
                className={`w-3 h-3 mr-2 rounded-full ${
                  walletError ? "bg-[#E23D3A]" : "bg-[#1D8751]"
                }`}
              ></div>
              <input
                type="text"
                value={walletAddress}
                onChange={handleWalletAddressChange}
                placeholder="Paste your crypto address"
                className="flex-1 bg-transparent text-[#788099] text-sm font-medium focus:outline-none"
              />
              <Copy className="text-white w-4 h-4" />
            </div>
            <button
              className="bg-[#35353E] py-2 px-3 rounded-full sm:ml-2 flex gap-2 w-full sm:w-auto justify-center"
              onClick={handlePasteClick}
            >
              <p className="text-[#1D8751]">Paste</p>
              <img
                src="/assets/Vector_se1lvr.png"
                alt=""
                className="w-5 h-5"
              />
            </button>
          </div>
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
            <span className="text-xs text-[#F79330]">
              I Confirm that the above submitted address is correct Address for
              the Cryptocurrency I chose, and not other Crypto *
            </span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4 text-white">
          3- OMAYA Exchange Payment Details
        </h2>
        <div className="bg-[#1D1D23] border border-[#35353E] p-4 rounded-xl mb-8">
          <div className="flex items-start mb-4">
            <AlertCircle className="w-5 h-5 text-[#F79330] mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-white text-sm">
              Please SEND the Funds to the preferred Payment Method below
            </span>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Payment Method */}
            <div className="flex-1">
              <label className="block text-sm mb-2 text-[#788099]">
                Payment Method
              </label>
              <div className="flex items-center bg-[#18181D] rounded-lg px-4 py-2 border border-[#35353E]">
                <svg
                  className="w-6 h-6 text-[#1D8751] mr-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="2"
                    y="7"
                    width="20"
                    height="10"
                    rx="2"
                    stroke="#1D8751"
                    strokeWidth="2"
                  />
                  <path d="M2 11h20" stroke="#1D8751" strokeWidth="2" />
                </svg>
                <select
                  className="bg-[#18181D] text-white text-sm font-medium focus:outline-none flex-1 rounded-lg"
                  value={selectedMethod?.payment_method_id || ""}
                  onChange={(e) => {
                    const method = paymentMethods.find(
                      (m: PaymentMethod) =>
                        m.payment_method_id === e.target.value
                    );
                    setSelectedMethod(method || null);
                    setSelectedProvider(null);
                  }}
                >
                  <option value="" disabled>
                    Select Payment Method
                  </option>
                  {paymentMethods?.map((method: PaymentMethod) => (
                    <option
                      key={method.payment_method_id}
                      value={method.payment_method_id}
                    >
                      {method.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Payment Provider */}
            <div className="flex-1">
              <label className="block text-sm mb-2 text-[#788099]">
                Payment Provider
              </label>
              <div className="flex items-center bg-[#18181D] rounded-lg px-4 py-2 border border-[#35353E]">
                {selectedProvider?.logo && (
                  <img
                    src={selectedProvider?.logo}
                    alt={selectedProvider?.provider_name}
                    className="w-6 h-6 rounded-full mr-2"
                  />
                )}
                <select
                  className="bg-[#18181D] text-white text-sm font-medium focus:outline-none flex-1 rounded-lg"
                  value={selectedProvider?.provider_name || ""}
                  onChange={(e) => {
                    const provider = paymentProviders?.find(
                      (p: PaymentProvider) => p.provider_name === e.target.value
                    );
                    setSelectedProvider(provider || null);
                  }}
                  disabled={!selectedMethod}
                >
                  <option value="" disabled>
                    {selectedMethod
                      ? "Select Payment Provider"
                      : "Select Payment Method First"}
                  </option>
                  {paymentProviders?.map((provider: PaymentProvider) => (
                    <option
                      key={provider.provider_name}
                      value={provider.provider_name}
                    >
                      {provider.provider_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex items-end justify-end">
            {!selectedProvider && (
              <button className="bg-[#1D8751] text-white px-6 py-2 rounded-full font-medium text-sm ml-2">
                + Add Payment Method
              </button>
            )}
          </div>
          {currentAdminPaymentDetails &&
            currentAdminPaymentDetails.length > 0 &&
            selectedProvider && (
              <div className="mt-4 border border-[#35353E] rounded-xl p-4 bg-[#18181D]">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Account Details for {selectedProvider.provider_name}
                </h3>
                {currentAdminPaymentDetails
                  .filter(
                    (detail: AdminPaymentDetail) =>
                      detail.provider_name === selectedProvider.provider_name
                  )
                  .map((detail: AdminPaymentDetail) => (
                    <div
                      key={`${detail.provider_name}-${detail.account_name}-${detail.account_number}`}
                      className="mb-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <label className="block text-xs mb-1 text-[#788099]">
                            Wallet Name
                          </label>
                          <div className="flex items-center w-full bg-[#18181D] rounded-full px-4 py-2 border border-[#35353E]">
                            <span className="w-3 h-3 mr-2 rounded-full bg-[#1D8751]"></span>
                            <span className="flex-1 text-white text-sm font-medium">
                              {detail.account_name}
                            </span>
                            <button
                              className="flex items-center gap-2 bg-[#35353E] py-1 px-2 rounded-full text-[#1D8751] hover:bg-[#4a4a55] text-sm"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  detail.account_name
                                );
                              }}
                            >
                              Copy
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <label className="block text-xs mb-1 text-[#788099]">
                            Wallet Number
                          </label>
                          <div className="flex items-center w-full bg-[#18181D] rounded-full px-4 py-2 border border-[#35353E]">
                            <span className="w-3 h-3 mr-2 rounded-full bg-[#1D8751]"></span>
                            <span className="flex-1 text-white text-sm font-medium">
                              {detail.account_number}
                            </span>
                            <button
                              className="flex items-center gap-2 bg-[#35353E] py-1 px-2 rounded-full text-[#1D8751] hover:bg-[#4a4a55] text-sm"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  detail.account_number
                                );
                              }}
                            >
                              Copy
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {detail.how_to_send && (
                          <div className="flex flex-col">
                            <label className="block text-xs mb-1 text-[#788099]">
                              How To Send
                            </label>
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
            <span className="text-[#1D8751] text-sm font-medium">
              Transfer Details
            </span>
          </div>
          <div className="mt-4 bg-transparent border border-[#1D8751] rounded-xl p-4">
            <ul className="space-y-1 mt-2">
              <li className="flex items-start text-white text-sm">
                <span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block mr-2 mt-1 shrink-0"></span>
                Please send the money from your own account Only
              </li>
              <li className="flex items-start text-white text-sm">
                <span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block mr-2 mt-1 shrink-0"></span>
                Put transaction ID in the description field of the bank
              </li>
              <li className="flex items-start text-white text-sm">
                <span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block mr-2 mt-1 shrink-0"></span>
                Please note, If you do not follow above conditions, we will
                reject your transaction and send you back your money.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-white">
          4- Additional Info
        </h2>
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
            Please upload the screenshot of your payment here.
            <br />
            This is necessary for verification purposes.
            <br />
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
                onChange={(e) => setConfirmPayment(e.target.checked)}
                className="sr-only"
              />
              <span
                className={`w-5 h-5 flex items-center justify-center rounded-lg border-2 border-[#1D8751] transition mt-0.5 flex-shrink-0`}
              >
                {confirmPayment && (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    className="text-[#1D8751]"
                  >
                    <polyline
                      points="4.5 9.5 8 13 13.5 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className="text-white text-sm">
                I confirm that I sent the payment
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="sr-only"
              />
              <span
                className={`w-5 h-5 flex items-center justify-center rounded-lg border-2 border-[#1D8751] transition mt-0.5 flex-shrink-0`}
              >
                {acceptTerms && (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    className="text-[#1D8751]"
                  >
                    <polyline
                      points="4.5 9.5 8 13 13.5 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className="text-white text-sm">
                I accept Terms and condition
              </span>
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
            disabled={
              !!walletError ||
              !confirmAddress ||
              !confirmPayment ||
              !acceptTerms ||
              !selectedFile ||
              !selectedMethod ||
              !selectedProvider
            }
          >
            Submit
          </button>
        </div>
      </div>
    </>
  );
};

export default DepositForm;
