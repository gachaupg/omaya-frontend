import React from "react";
import { TransactionType } from "@/features/p2p/types";
import { formatDate, formatNumber } from "@/utils/formatters";

interface PdfTransactionReceiptProps {
  transaction: TransactionType;
}

const PdfTransactionReceipt: React.FC<PdfTransactionReceiptProps> = ({
  transaction,
}) => {
  // Always use the provided TRC20 icon for Tron
  const assetIcon =
    transaction.asset === "Tron"
      ? "/images/tether.svg"
      : "https://cryptologos.cc/logos/bitcoin-btc-logo.png";

  // Color for type
  const typeColor =
    transaction.type === "buy"
      ? "text-[#1D8751]"
      : transaction.type === "sell"
        ? "text-[#FF4D4D]"
        : "text-black";

  return (
    <div className="w-full max-w-md mx-auto bg-white text-black rounded-xl shadow-lg p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <img
          src={assetIcon}
          alt={transaction.asset}
          className="w-16 h-16 mb-2"
        />
        <h2 className="text-2xl font-bold mb-1">Transaction Receipt</h2>
        <div className="text-sm text-gray-600">
          {formatDate(transaction.date)}
        </div>
      </div>
      {/* Details */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="font-semibold">Asset:</span>
          <span>{transaction.asset}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="font-semibold">Type:</span>
          <span className={typeColor}>{transaction.type}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="font-semibold">Amount:</span>
          <span>{formatNumber(Number(transaction.amount ?? 0))} USD</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="font-semibold">Status:</span>
          <span>{transaction.status}</span>
        </div>
        {transaction.id && (
          <div className="flex justify-between mb-2">
            <span className="font-semibold">Transaction ID:</span>
            <span>{transaction.id}</span>
          </div>
        )}
      </div>
      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-500">
        Powered by OMAYA.io
      </div>
    </div>
  );
};

export default PdfTransactionReceipt;
