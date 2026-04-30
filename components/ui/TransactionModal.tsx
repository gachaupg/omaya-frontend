import React from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";

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
      className={`rounded-2xl bg-[#191A1F] p-4 sm:p-6 max-w-md w-full mx-auto ${className}`}
    >
      {" "}
      {/* Modal container */}
      {/* Header */}
      <div className="flex flex-col items-center mb-4 sm:mb-6">
        {/* Logo/Title can be slotted here if needed */}
      </div>
      {/* Transaction Info */}
      <div className="rounded-xl bg-[#23242B] p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            {/* Currency Icon Placeholder */}
            <span className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1D8751] rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold text-white flex-shrink-0">
              {currency[0]}
            </span>
            <div className="min-w-0">
              <div className="font-semibold text-white text-sm sm:text-base">
                <span className="truncate">{currency}</span>{" "}
                <span className="text-[#788099] font-normal">{type}</span>
              </div>
              <div className="text-xs text-[#788099]">{date}</div>
            </div>
          </div>
          <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 sm:gap-1">
            <button
              onClick={onShare}
              className="text-xs sm:text-sm text-[#1D8751] hover:underline flex items-center gap-1 whitespace-nowrap"
            >
              Share <span>↗️</span>
            </button>
            <button
              onClick={onViewNote}
              className="text-xs sm:text-sm text-[#1D8751] hover:underline flex items-center gap-1 whitespace-nowrap"
            >
              Transaction Note <span>👁️</span>
            </button>
          </div>
        </div>
        <div className="border-b border-[#31323A] my-2" />
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <div>
            <div className="text-xs sm:text-sm text-[#788099]">Total Amount</div>
            <div className="text-xl sm:text-2xl text-[#1D8751] font-semibold">
              {totalAmount}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs sm:text-sm text-[#788099]">
              Total Fee <span className="text-white">{totalFee}</span>
            </div>
            <div className="text-xs sm:text-sm text-[#788099]">
              Network Fee <span className="text-white">{networkFee}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Payment Info */}
      <div className="rounded-xl bg-[#23242B] p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-2">
          <span className="text-xs sm:text-sm text-[#788099]">Payment:</span>
          <span className="flex items-center gap-1 text-[#1D8751] font-medium text-xs sm:text-sm">
            <span className="truncate">{paymentInfo.bankName}</span>{" "}
            {paymentInfo.bankIconUrl && (
              <img
                src={paymentInfo.bankIconUrl}
                alt="bank"
                className="w-4 h-4 sm:w-5 sm:h-5 inline-block flex-shrink-0"
              />
            )}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-2">
          <span className="text-xs sm:text-sm text-[#788099]">Account Number:</span>
          <span className="text-[#1D8751] font-medium text-xs sm:text-sm break-all sm:break-normal">
            {paymentInfo.accountNumber}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
          <span className="text-xs sm:text-sm text-[#788099]">Account Name:</span>
          <span className="text-white font-medium text-xs sm:text-sm break-words">
            {paymentInfo.accountName}
          </span>
        </div>
      </div>
      {/* Deposit Sent To */}
      <div className="rounded-xl bg-[#23242B] p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-2">
          <span className="text-xs sm:text-sm text-[#788099]">Deposit Sent to</span>
          <span className="text-[#1D8751] font-medium text-xs sm:text-sm break-all">{depositSentTo}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
          <span className="text-xs sm:text-sm text-[#788099]">
            Transaction Hash: <span title="Transaction Hash Info">ⓘ</span>
          </span>
          <span className="text-[#1D8751] font-medium text-xs sm:text-sm break-all text-left sm:text-right">
            {transactionHash}
          </span>
        </div>
      </div>
      {/* Status & Rating */}
      <div className="rounded-xl bg-[#23242B] p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-2">
          <span className="text-xs sm:text-sm text-[#788099]">Status:</span>
          <StatusBadge status={status} className="ml-auto sm:ml-0" />
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-2">
          <span className="text-xs sm:text-sm text-[#788099]">Receipt:</span>
          {receiptUrl ? (
            <button
              onClick={onViewReceipt}
              className="text-[#1D8751] hover:underline flex items-center gap-1 text-xs sm:text-sm"
            >
              {" "}
              <span>👁️</span>{" "}
            </button>
          ) : (
            <span className="text-[#788099] text-xs sm:text-sm">-</span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
          <span className="text-xs sm:text-sm text-[#788099]">Service Rating:</span>
          <span className="flex items-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={
                  i <= (serviceRating || 0)
                    ? "text-[#1D8751] text-lg sm:text-xl"
                    : "text-[#788099] text-lg sm:text-xl"
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
