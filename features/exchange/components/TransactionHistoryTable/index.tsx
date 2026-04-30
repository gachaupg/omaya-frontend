import React from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import TransactionRow from './TransactionRow';
import { useTransactionHistory } from './useTransactionHistroy';
import { Transaction } from '@/features/exchange/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

const ReceiptModal = ({ isOpen, onClose, transaction }: { isOpen: boolean; onClose: () => void; transaction: Transaction | null }) => {
  if (!isOpen || !transaction) return null;
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 sm:p-1 overflow-y-auto max-h-[100vh]" style={{ background: "rgba(24, 24, 29, 0.7)" }} onClick={onClose}>
      <div className="bg-[#18181D] rounded-3xl w-full max-w-md relative border border-[#3A3B45] overflow-x-hidden mt-56 max-w-[80vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="relative z-10 p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <img src="/assets/Omaya_green-logo_yva2ah.png" alt="" />
            <button onClick={onClose} className="text-[#9CA3AF] hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <div className="p-2 border border-[#35353E] rounded-lg">
            <div className="flex items-center justify-between mb-2 border-b border-[#35353E] p-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#F7931A] to-[#FF8C00] rounded-full flex items-center justify-center shadow-lg flex-shrink-0"><span className="text-white font-bold text-sm">₿</span></div>
                <div>
                  <p className="text-white font-medium">{transaction.currency} <span className="text-[#788099] text-sm">{transaction.transaction_type}</span></p>
                  <p className="text-[#788099] text-sm">{formatDate(transaction.timestamp)}</p>
                </div>
              </div>
              <div className="flex flex-col text-[#788099]">
                <div className="flex gap-2 text-right"><span className="text-sm text-right">Share</span></div>
                {transaction.screenshot && (
                  <div className="flex gap-2"><p className="text-sm">Transaction Screenshot</p></div>
                )}
              </div>
            </div>
            <div className="mb-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-[#9CA3AF] text-sm mb-1">Total Amount</p>
                  <p className={`${transaction.transaction_type === 'deposit' ? 'text-[#10B981]' : 'text-[#EF4444]'} text-lg font-medium`}>
                    {transaction.transaction_type === 'deposit' ? '+' : '-'}{transaction.total_amount.toFixed(2)} {transaction.currency}
                  </p>
                </div>
                <div className="text-right space-y-2">
                  <div className="flex justify-between items-center gap-8"><span className="text-[#9CA3AF] text-sm">Commission</span><span className="text-white text-sm">{transaction.commission.toFixed(2)} {transaction.currency}</span></div>
                  <div className="flex justify-between items-center gap-8"><span className="text-[#9CA3AF] text-sm">Net Amount</span><span className="text-white text-sm">{transaction.amount.toFixed(2)} {transaction.currency}</span></div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative z-10 rounded-lg mt-2">
            <div className="flex flex-col gap-2 mb-6 border border-[#35353E] p-2 rounded-lg">
              <div className="flex justify-between border-b border-dotted border-[#35353E]"><p className="text-white text-sm mb-1">Payment Method:</p><p className="text-[#788099] text-sm">{transaction.payment_method}</p></div>
              <div className="flex justify-between border-b border-dotted border-[#35353E]"><p className="text-white text-sm mb-1">Payment Provider:</p><p className="text-[#788099] text-sm">{transaction.payment_provider}</p></div>
              <div className="flex justify-between border-b border-dotted border-[#35353E]"><p className="text-white text-sm mb-1">Account Name:</p><p className="text-[#788099] text-sm">{transaction.account_name}</p></div>
              <div className="flex justify-between"><p className="text-white text-sm mb-1">Account Number:</p><p className="text-[#788099] text-sm">{transaction.account_number}</p></div>
            </div>
            <div className="flex flex-col gap-2 p-2 border border-[#35353E] rounded-lg mb-6">
              {transaction.withdrawal_address && (<div className="flex justify-between border-b border-dotted border-[#35353E]"><p className="text-white text-sm mb-1">Withdrawal Address</p><p className="text-[#788099] text-sm break-all">{transaction.withdrawal_address}</p></div>)}
              {transaction.transaction_harsh && (<div className="flex justify-between"><p className="text-white text-sm mb-1">Transaction Hash:</p><p className="text-[#788099] text-sm break-all">{transaction.transaction_harsh}</p></div>)}
            </div>
            <div className="flex flex-col gap-2 p-2 border border-[#35353E] rounded-lg">
              <div className="flex justify-between items-center border-b border-dotted border-[#35353E]">
                <span className="text-white text-sm">Status:</span>
                <StatusBadge status={transaction.status} />
              </div>
              {transaction.stages && (<div className="flex justify-between items-center border-b border-dotted border-[#35353E]"><span className="text-white text-sm">Stage:</span><span className="text-[#788099] text-sm">{transaction.stages}</span></div>)}
              {transaction.reason && (<div className="flex justify-between items-center border-b border-dotted border-[#35353E]"><span className="text-white text-sm">Reason:</span><span className="text-[#788099] text-sm">{transaction.reason}</span></div>)}
              {transaction.additional_info && (<div className="flex justify-between items-center border-b border-dotted border-[#35353E]"><span className="text-white text-sm">Additional Info:</span><span className="text-[#788099] text-sm">{transaction.additional_info}</span></div>)}
              {transaction.assigned_to && transaction.assigned_to.length > 0 && (<div className="flex justify-between items-center"><span className="text-white text-sm">Assigned To:</span><span className="text-[#788099] text-sm">{transaction.assigned_to.join(', ')}</span></div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TransactionHistoryTable: React.FC = () => {
  const {
    loading,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    isReceiptModalOpen,
    selectedTransaction,
    handleEyeClick,
    closeModal,
    filteredTransactions,
    currentTransactions,
    itemsPerPage,
  } = useTransactionHistory();

  return (
    <div className="bg-white dark:bg-[#1A1B23] rounded-lg p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-[#1D8751] text-xl font-medium">Transaction History</h1>
          <div className="flex items-center gap-2 text-gray-500 dark:text-[#9CA3AF] cursor-pointer hover:text-gray-700 dark:hover:text-white transition-colors">
            <span className="text-sm">Month</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none sm:w-44">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#1D8751] w-4 h-4" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border border-gray-300 dark:border-[#2D2E3A] rounded-full pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#9CA3AF] focus:outline-none focus:border-[#10B981]"
            />
          </div>
          {/* Export Button */}
          <button className="w-full sm:w-auto text-[#1D8751] rounded-lg text-sm font-medium transition-colors">
            Export Transactions
          </button>
        </div>
      </div>
      {/* Table Container */}
      <div className="bg-gray-50 dark:bg-[#1D1D23] rounded-2xl border border-gray-200 dark:border-[#2D2E3A] overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-[#35353E] scrollbar-track-transparent"
             style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Table Header */}
          <div className="bg-gray-100 dark:bg-[#35353E] border-b border-gray-200 dark:border-[#35353E] px-4 sm:px-6 py-4 sticky top-0 z-10">
            <div className="grid grid-cols-12 items-center min-w-[800px]">
              <div className="col-span-2 text-gray-600 dark:text-[#9CA3AF] text-sm font-medium flex items-center gap-1">ID <ChevronDown className="w-3 h-3" /></div>
              <div className="col-span-2 text-gray-600 dark:text-[#9CA3AF] text-sm font-medium flex items-center gap-1">Type <ChevronDown className="w-3 h-3" /></div>
              <div className="col-span-2 text-gray-600 dark:text-[#9CA3AF] text-sm font-medium flex items-center gap-1">Date <ChevronDown className="w-3 h-3" /></div>
              <div className="col-span-2 text-gray-600 dark:text-[#9CA3AF] text-sm font-medium flex items-center gap-1">Amount <ChevronDown className="w-3 h-3" /></div>
              <div className="col-span-2 text-gray-600 dark:text-[#9CA3AF] text-sm font-medium">Status</div>
              <div className="col-span-1 text-gray-600 dark:text-[#9CA3AF] text-sm font-medium">Receipt</div>
              <div className="col-span-1 text-gray-600 dark:text-[#9CA3AF] text-sm font-medium">More</div>
            </div>
          </div>
          {/* Table Body */}
          <div>
            {currentTransactions.length > 0 ? (
              currentTransactions.map((tx) => (
                <TransactionRow key={tx.transaction_id} tx={tx} handleEyeClick={handleEyeClick} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-[#788099]">
                {loading ? "Loading transactions..." : "No transactions found"}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-center mt-6 gap-2">
        <button 
          className="p-2 text-gray-500 dark:text-[#9CA3AF] hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#232430] transition-colors disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.ceil(filteredTransactions.length / itemsPerPage) }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-sm font-medium transition-colors ${
              currentPage === i + 1
                ? "bg-[#10B981] text-white"
                : "text-gray-500 dark:text-[#9CA3AF] hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#232430]"
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button 
          className="p-2 text-gray-500 dark:text-[#9CA3AF] hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#232430] transition-colors disabled:opacity-50"
          disabled={currentPage === Math.ceil(filteredTransactions.length / itemsPerPage)}
          onClick={() => setCurrentPage(Math.min(Math.ceil(filteredTransactions.length / itemsPerPage), currentPage + 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <ReceiptModal 
        isOpen={isReceiptModalOpen} 
        onClose={closeModal} 
        transaction={selectedTransaction} 
      />
    </div>
  );
};

export default TransactionHistoryTable;
