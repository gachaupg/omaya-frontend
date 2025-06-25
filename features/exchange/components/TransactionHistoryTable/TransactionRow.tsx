import React from 'react';
import { Eye, MoreHorizontal } from 'lucide-react';
import { Transaction } from '@/features/exchange/types';

const BitcoinIcon = () => (
  <div className="w-8 h-8 bg-gradient-to-br from-[#F7931A] to-[#FF8C00] rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
    <span className="text-white font-bold text-sm">₿</span>
  </div>
);

interface TransactionRowProps {
  tx: Transaction;
  handleEyeClick: (tx: Transaction) => void;
}

const TransactionRow: React.FC<TransactionRowProps> = ({ tx, handleEyeClick }) => {
  return (
    <div className="border-b border-[#2D2E3A] last:border-b-0 hover:bg-[#232430] transition-colors group">
      <div className="px-4 sm:px-6 py-4">
        <div className="grid grid-cols-12 items-center w-[800px]">
          {/* ID with Bitcoin Icon and colored left border */}
          <div className="col-span-2 flex items-center gap-3 relative">
            <div className={`absolute left-[-16px] sm:left-[-24px] top-0 bottom-0 w-1 rounded-r ${
              tx.transaction_type === "deposit" ? "bg-[#10B981]" : "bg-[#EF4444]"
            }`}></div>
            <BitcoinIcon />
            <span className="text-[#788099] text-sm font-medium truncate">{tx.transaction_id}</span>
          </div>
          {/* Type */}
          <div className="col-span-2">
            <span className="text-white text-sm truncate">
              {tx.transaction_type.charAt(0).toUpperCase() + tx.transaction_type.slice(1)}
            </span>
          </div>
          {/* Date */}
          <div className="col-span-2">
            <span className="text-[#788099] text-sm truncate">
              {new Date(tx.timestamp).toLocaleDateString()}
            </span>
          </div>
          {/* Amount */}
          <div className="col-span-2">
            <span className={`text-sm font-medium truncate ${
              tx.transaction_type === 'deposit' ? "text-[#10B981]" : "text-[#EF4444]"
            }`}>
              {tx.transaction_type === 'deposit' ? '+' : '-'}{tx.amount.toFixed(2)} <span className="text-[#788099] ml-1">{tx.currency}</span>
            </span>
          </div>
          {/* Status */}
          <div className="col-span-2">
            <span className="text-[#788099] text-sm rounded-md text-xs truncate">
              {tx.status}
            </span>
          </div>
          {/* Receipt */}
          <div className="col-span-1">
            <button className="text-[#10B981] hover:text-[#059669] transition-colors p-1 rounded" onClick={() => handleEyeClick(tx)}>
              <Eye className="w-4 h-4" />
            </button>
          </div>
          {/* More */}
          <div className="col-span-1">
            <button className="text-[#9CA3AF] hover:text-white transition-colors p-1 rounded">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionRow;
