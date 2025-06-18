import React from "react";

interface PaymentInfo {
  bankName: string;
  bankIconUrl?: string;
  accountNumber: string;
  accountName: string;
}

interface TransactionModalProps {
  currency: string;
  type: string;
  date: string;
  totalAmount: string;
  totalFee: string;
  networkFee: string;
  paymentInfo: PaymentInfo;
  depositSentTo: string;
  transactionHash: string;
  status: string;
  receiptUrl?: string;
  serviceRating?: number; // 1-5
  onShare?: () => void;
  onViewNote?: () => void;
  onViewReceipt?: () => void;
  className?: string;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  currency,
  type,
  date,
  totalAmount,
  totalFee,
  networkFee,
  paymentInfo,
  depositSentTo,
  transactionHash,
  status,
  receiptUrl,
  serviceRating,
  onShare,
  onViewNote,
  onViewReceipt,
  className = "",
}) => {
  return (
    <div
      className={`rounded-2xl bg-[#191A1F] p-6 max-w-md w-full mx-auto ${className}`}
    >
      {" "}
      {/* Modal container */}
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        {/* Logo/Title can be slotted here if needed */}
      </div>
      {/* Transaction Info */}
      <div className="rounded-xl bg-[#23242B] p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Currency Icon Placeholder */}
            <span className="w-10 h-10 bg-[#1D8751] rounded-full flex items-center justify-center text-2xl font-bold text-white">
              {currency[0]}
            </span>
            <div>
              <div className="font-semibold text-white">
                {currency}{" "}
                <span className="text-[#788099] font-normal">{type}</span>
              </div>
              <div className="text-xs text-[#788099]">{date}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={onShare}
              className="text-sm text-[#1D8751] hover:underline flex items-center gap-1"
            >
              Share <span>↗️</span>
            </button>
            <button
              onClick={onViewNote}
              className="text-sm text-[#1D8751] hover:underline flex items-center gap-1"
            >
              Transaction Note <span>👁️</span>
            </button>
          </div>
        </div>
        <div className="border-b border-[#31323A] my-2" />
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-[#788099]">Total Amount</div>
            <div className="text-2xl text-[#1D8751] font-semibold">
              {totalAmount}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-[#788099]">
              Total Fee <span className="text-white">{totalFee}</span>
            </div>
            <div className="text-sm text-[#788099]">
              Network Fee <span className="text-white">{networkFee}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Payment Info */}
      <div className="rounded-xl bg-[#23242B] p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[#788099]">Payment:</span>
          <span className="flex items-center gap-1 text-[#1D8751] font-medium">
            {paymentInfo.bankName}{" "}
            {paymentInfo.bankIconUrl && (
              <img
                src={paymentInfo.bankIconUrl}
                alt="bank"
                className="w-5 h-5 inline-block"
              />
            )}
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[#788099]">Account Number:</span>
          <span className="text-[#1D8751] font-medium">
            {paymentInfo.accountNumber}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#788099]">Account Name:</span>
          <span className="text-white font-medium">
            {paymentInfo.accountName}
          </span>
        </div>
      </div>
      {/* Deposit Sent To */}
      <div className="rounded-xl bg-[#23242B] p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[#788099]">Deposit Sent to</span>
          <span className="text-[#1D8751] font-medium">{depositSentTo}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#788099]">
            Transaction Hash: <span title="Transaction Hash Info">ⓘ</span>
          </span>
          <span className="text-[#1D8751] font-medium break-all">
            {transactionHash}
          </span>
        </div>
      </div>
      {/* Status & Rating */}
      <div className="rounded-xl bg-[#23242B] p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[#788099]">Status:</span>
          <span className="text-[#1D8751] font-medium">{status}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[#788099]">Receipt:</span>
          {receiptUrl ? (
            <button
              onClick={onViewReceipt}
              className="text-[#1D8751] hover:underline flex items-center gap-1"
            >
              {" "}
              <span>👁️</span>{" "}
            </button>
          ) : (
            <span className="text-[#788099]">-</span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#788099]">Service Rating:</span>
          <span>
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={
                  i <= (serviceRating || 0)
                    ? "text-[#1D8751] text-xl"
                    : "text-[#788099] text-xl"
                }
              >
                ★
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;
