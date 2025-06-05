import React, { useState } from "react";
import { Search, ChevronDown, Eye, MoreHorizontal, ChevronLeft, ChevronRight, X, Share,Copy } from "lucide-react";
import { transactionHistory } from "./dummyData";

type Transaction = {
  id: number;
  type: string;
  date: string;
  amount: string;
  status: string;
  asset: string;
};

type TransactionHistoryTableProps = {
  transactions: Transaction[];
};

const ReceiptModal = ({ isOpen, onClose, transaction }: { isOpen: boolean; onClose: () => void; transaction: Transaction | null }) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 sm:p-1 overflow-y-auto max-h-[100vh]" style={{ background: "rgba(24, 24, 29, 0.7)" }} onClick={onClose}>
      <div className="bg-[#18181D] rounded-3xl w-full max-w-md relative border border-[#3A3B45] overflow-x-hidden mt-56 max-w-[80vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="relative z-10 p-6 pb-4">
          <div className="flex items-center justify-center mb-4">
            <img src="https://res.cloudinary.com/dam1sxczj/image/upload/v1747133499/Omaya_green-logo_yva2ah.png" alt="" /> 
          </div>

        <div className="p-2 border border-[#35353E] rounded-lg">
          {/* Bitcoin Transaction Header */}
          <div className="flex items-center justify-between mb-2 border-b border-[#35353E] p-2">
            <div className="flex items-center gap-3">
              <BitcoinIcon />
              <div>
                <p className="text-white font-medium ">Bitcoin <span className="text-[#788099] text-sm">Deposit</span></p>
                <p className="text-[#788099] text-sm">12 Jun 2023</p>
              </div>
            </div>
            <div className="flex flex-col text-[#788099] ">
              <div className="flex gap-2 text-right">
                <span className="text-sm text-right">Share</span>
                <Share className="w-4 h-4 text-[#9CA3AF]" />
              </div>
              <div className="flex gap-2 ">
                <p className="text-sm">Transaction Screenshot</p>
                <button className="text-[#10B981] hover:text-[#059669] transition-colors p-1 rounded">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          {/* Amount Section */}
          <div className="mb-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[#9CA3AF] text-sm mb-1">Total Amount</p>
                <p className="text-[#10B981] text-lg font-medium">120.00 USD</p>
              </div>
              <div className="text-right space-y-2">
                <div className="flex justify-between items-center gap-8">
                  <span className="text-[#9CA3AF] text-sm">Total Fee</span>
                  <span className="text-white text-sm">$3</span>
                </div>
                <div className="flex justify-between items-center gap-8">
                  <span className="text-[#9CA3AF] text-sm">Network Fee</span>
                  <span className="text-white text-sm">$2</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Details Section */}
        <div className="relative z-10 rounded-lg mt-2">
          <div className="flex flex-col gap-2 mb-6 border border-[#35353E] p-2 rounded-lg">
            <div className="flex justify-between border-b border-dotted border-[#35353E]">
              <p className="text-white text-sm mb-1">Payment:</p>
              <p className="text-[#788099] text-sm">Salam Bank 🏦</p>
            </div>
            <div className="flex justify-between border-b border-dotted border-[#35353E]">
              <p className="text-white text-sm mb-1">Account Number:</p>
              <p className="text-[#788099] text-sm">4856346129499050</p>
            </div>
            <div className="flex justify-between">
            <p className="text-white text-sm mb-1">Account Name:</p>
            <p className="text-[#788099] text-sm">Omar Ali Omar</p>
          </div>
          </div>

          <div className="flex flex-col gap-2 p-2 border border-[#35353E] rounded-lg mb-6">
            <div className="flex justify-between border-b border-dotted border-[#35353E]">
              <p className="text-white text-sm mb-1">Deposit Sent to</p>
              <p className="text-[#788099] text-sm break-all">3434343233</p>
            </div>
            <div className="flex justify-between">
              <p className="text-white text-sm mb-1">Transaction Hash:</p>
              <p className="text-[#788099] text-sm break-all">4673u9894B294r695893749339q</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 p-2 border border-[#35353E] rounded-lg">
            <div className="flex justify-between items-center border-b border-dotted border-[#35353E]">
              <span className="text-white text-sm">Status:</span>
              <span className="text-[#788099] text-sm font-medium">Completed</span>
            </div>

            <div className="flex justify-between items-center border-b border-dotted border-[#35353E]">
              <span className="text-white text-sm">Receipt:</span>
              <button className="text-[#10B981] hover:text-[#059669] transition-colors">
                <Eye className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-white text-sm">Service Rating:</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-[#F59E0B] text-lg">★</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>

      </div>
    </div>
  );
};



const BitcoinIcon = () => (
  <div className="w-8 h-8 bg-gradient-to-br from-[#F7931A] to-[#FF8C00] rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
    <span className="text-white font-bold text-sm">₿</span>
  </div>
);

const TransactionHistoryTable: React.FC<TransactionHistoryTableProps> = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const totalPages = 1;

  const handleEyeClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="w-full md:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-[#1D8751] text-xl font-medium">Transaction History</h1>
          <div className="flex items-center gap-2 text-[#9CA3AF] cursor-pointer hover:text-white transition-colors">
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border border-[#2D2E3A] rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#10B981]"
            />
          </div>
          
          {/* Export Button */}
          <button className="w-full sm:w-auto text-[#1D8751] rounded-lg text-sm font-medium transition-colors">
            Export Transactions
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#1D1D23] rounded-2xl border border-[#2D2E3A] overflow-hidden w-full">
        <div className="overflow-x-auto">
          {/* Table Header */}
          <div className="bg-[#35353E] border-b border-[#35353E] px-4 sm:px-6 py-4 sticky top-0 z-10">
            <div className="grid grid-cols-12 items-center w-[800px]">
              <div className="col-span-2 text-[#9CA3AF] text-sm font-medium flex items-center gap-1">
                ID <ChevronDown className="w-3 h-3" />
              </div>
              <div className="col-span-2 text-[#9CA3AF] text-sm font-medium flex items-center gap-1">
                Type <ChevronDown className="w-3 h-3" />
              </div>
              <div className="col-span-2 text-[#9CA3AF] text-sm font-medium flex items-center gap-1">
                Date <ChevronDown className="w-3 h-3" />
              </div>
              <div className="col-span-2 text-[#9CA3AF] text-sm font-medium flex items-center gap-1">
                Amount <ChevronDown className="w-3 h-3" />
              </div>
              <div className="col-span-2 text-[#9CA3AF] text-sm font-medium">
                Status
              </div>
              <div className="col-span-1 text-[#9CA3AF] text-sm font-medium">
                Receipt
              </div>
              <div className="col-span-1 text-[#9CA3AF] text-sm font-medium">
                More
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div>
            {transactions.map((tx, idx) => (
              <div key={idx} className="border-b border-[#2D2E3A] last:border-b-0 hover:bg-[#232430] transition-colors group">
                <div className="px-4 sm:px-6 py-4">
                  <div className="grid grid-cols-12 items-center w-[800px]">
                    {/* ID with Bitcoin Icon and colored left border */}
                    <div className="col-span-2 flex items-center gap-3 relative">
                      <div className={`absolute left-[-16px] sm:left-[-24px] top-0 bottom-0 w-1 rounded-r ${
                        tx.type === "Deposit" ? "bg-[#10B981]" : "bg-[#EF4444]"
                      }`}></div>
                      <BitcoinIcon />
                      <span className="text-[#788099] text-sm font-medium truncate">{tx.id}</span>
                    </div>
                    
                    {/* Type */}
                    <div className="col-span-2">
                      <span className="text-white text-sm truncate">{tx.type}</span>
                    </div>
                    
                    {/* Date */}
                    <div className="col-span-2">
                      <span className="text-[#788099] text-sm truncate">{tx.date}</span>
                    </div>
                    
                    {/* Amount */}
                    <div className="col-span-2">
                      <span className={`text-sm font-medium truncate ${
                        tx.amount.startsWith("+") ? "text-[#10B981]" : "text-[#EF4444]"
                      }`}>
                        {tx.amount} <span className="text-[#788099] ml-1">USD</span> 
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
            ))}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-center mt-6 gap-2">
        <button 
          className="p-2 text-[#9CA3AF] hover:text-white hover:bg-[#232430] transition-colors disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-sm font-medium transition-colors ${
              currentPage === page
                ? "bg-[#10B981] text-white"
                : "text-[#9CA3AF] hover:text-white hover:bg-[#232430]"
            }`}
          >
            {page}
          </button>
        ))}
        
        <button 
          className="p-2 text-[#9CA3AF] hover:text-white hover:bg-[#232430] transition-colors disabled:opacity-50"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <ReceiptModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        transaction={selectedTransaction} 
      />
    </div>
  );
};

export default TransactionHistoryTable;