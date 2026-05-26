import React from "react";
import { useDepositLogic } from "./useDepositLogic";
import AssetSelector from "./AssetSelector";
import DepositForm from "./DepositForm";
import WithdrawalModal from "../WithdrawalModal";
import { Asset } from "../../types";
import { ChevronDown } from "lucide-react";

interface DepositModalProps {
  asset: Asset;
  assetType: "Crypto" | "Forex";
  onClose: () => void;
}

const DepositModal: React.FC<DepositModalProps> = ({
  asset,
  assetType,
  onClose,
}) => {
  const logic = useDepositLogic(asset, assetType, onClose);

  return (
    <div className="min-h-screen bg-[#18181D] md:p-4">
      {/* Top Row: Asset Class and Transaction Type toggles */}
      <div className="flex flex-row justify-between items-start mb-4 gap-4">
        {/* Asset Class Toggle */}
        <div className="flex flex-col">
          <h1 className="text-xl text-white mb-2">Asset Class</h1>
          <div className="flex w-full border border-[#1D8751] rounded-lg p-1 gap-2">
            <button
              className={`flex-1 px-2 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                logic.currentAssetType === "Crypto"
                  ? "bg-[#1D8751] text-white"
                  : "bg-[#35353E] text-[#788099]"
              }`}
              onClick={() => logic.setCurrentAssetType("Crypto")}
            >
              Crypto
            </button>
            <button
              className={`flex-1 px-2 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                logic.currentAssetType === "Forex"
                  ? "bg-[#1D8751] text-white"
                  : "bg-[#35353E] text-[#788099]"
              }`}
              onClick={() => logic.setCurrentAssetType("Forex")}
            >
              Forex
            </button>
          </div>
        </div>
        {/* Transaction Type Toggle */}
        <div className="flex flex-col items-center md:items-end w-full md:w-auto">
          <h1 className="text-white mb-2">Transaction Type</h1>
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2 items-center">
              {/* <span className="text-white capitalize">Transaction Type</span> */}
            </div>
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-full font-semibold text-sm text-white border flex items-center gap-2 ${
                  !logic.showWithdraw
                    ? "bg-[#1D8751] text-white border-[#1D8751]"
                    : "bg-transparent border-[#1D8751] text-[#1D8751]"
                }`}
                onClick={() => logic.setShowWithdraw(false)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={!logic.showWithdraw ? "#FFFFFF" : "#1D8751"}
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
                className={`px-4 py-2 rounded-full font-semibold text-sm border flex items-center gap-2 ${
                  logic.showWithdraw
                    ? "bg-[#E23D3A] text-white border-[#E23D3A]"
                    : "bg-transparent border-[#E23D3A] text-[#E23D3A]"
                }`}
                onClick={() => logic.setShowWithdraw(true)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={logic.showWithdraw ? "#FFFFFF" : "#E23D3A"}
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
      {/* Withdraw Modal */}
      {logic.showWithdraw ? (
        <WithdrawalModal
          asset={logic.currentAsset!}
          assetType={logic.currentAssetType}
          onClose={onClose}
        />
      ) : (
        <>
          {/* Asset Selector (Transaction Info) */}
          <AssetSelector
            currentAsset={logic.currentAsset}
            setCurrentAsset={logic.setCurrentAsset}
            currentAssetType={logic.currentAssetType}
            setCurrentAssetType={logic.setCurrentAssetType}
            selectedNetwork={logic.selectedNetwork}
            setSelectedNetwork={logic.setSelectedNetwork}
            assets={logic.assets?.assets || []}
            amount={logic.amount}
            setAmount={logic.setAmount}
            assetAmount={logic.assetAmount}
            amountNum={logic.amountNum}
            commission={logic.commission}
            commissionRate={logic.commissionRate}
            networkFee={logic.networkFee}
            totalFees={logic.totalFees}
          />
          {/* Deposit Form */}
          <DepositForm
            walletAddress={logic.walletAddress}
            setWalletAddress={logic.setWalletAddress}
            walletError={logic.walletError}
            confirmAddress={logic.confirmAddress}
            setConfirmAddress={logic.setConfirmAddress}
            confirmPayment={logic.confirmPayment}
            setConfirmPayment={logic.setConfirmPayment}
            acceptTerms={logic.acceptTerms}
            setAcceptTerms={logic.setAcceptTerms}
            notes={logic.notes}
            setNotes={logic.setNotes}
            selectedFile={logic.selectedFile}
            handleFileUpload={logic.handleFileUpload}
            handleUploadClick={logic.handleUploadClick}
            fileError={logic.fileError}
            fileInputRef={
              logic.fileInputRef as React.RefObject<HTMLInputElement>
            }
            handlePasteClick={logic.handlePasteClick}
            handleWalletAddressChange={logic.handleWalletAddressChange}
            handleSubmit={logic.handleSubmit}
            submitError={logic.submitError}
            paymentMethods={logic.currentPaymentMethods}
            selectedMethod={logic.selectedMethod}
            setSelectedMethod={logic.setSelectedMethod}
            paymentProviders={logic.currentPaymentProviders}
            selectedProvider={logic.selectedProvider}
            setSelectedProvider={logic.setSelectedProvider}
            currentAdminPaymentDetails={logic.currentAdminPaymentDetails}
            amount={logic.amount}
            setAmount={logic.setAmount}
            amountNum={logic.amountNum}
            commission={logic.commission}
            commissionRate={logic.commissionRate}
            networkFee={logic.networkFee}
            totalFees={logic.totalFees}
            assetAmount={logic.assetAmount}
          />
        </>
      )}
    </div>
  );
};

export default DepositModal;
