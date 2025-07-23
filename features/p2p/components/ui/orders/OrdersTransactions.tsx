import React, { useState } from "react";
import { Table } from "../../Common/Table";
import { TransactionType } from "@/features/p2p/types";
import TransactionModal from "@/components/ui/TransactionModal";

const OrdersTransactions = ({
  transformedData,
  loading,
  error,
  currentPage,
  handlePageChange,
  trades,
}: {
  transformedData: TransactionType[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  handlePageChange: (page: number) => void;
  trades: { count: number };
}) => {
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionType | null>(null);

  const handleViewTransaction = (tx: TransactionType) => {
    setSelectedTransaction(tx);
  };

  const handleCloseModal = () => {
    setSelectedTransaction(null);
  };

  // Debug log for selectedTransaction
  console.log("selectedTransaction:", selectedTransaction);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D8751]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-8">
        <p className="text-red-500 mb-2">Error loading orders</p>
        <p className="dark:text-gray-400 text-gray-500 text-sm">{error}</p>
      </div>
    );
  }

  if (!transformedData || transformedData.length === 0) {
    return (
      <div className="w-full text-center py-8">
        <p className="dark:text-gray-400 text-gray-500 mb-2">No orders found</p>
        <p className="dark:text-[#788099] text-gray-400 text-sm">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table
        type="orders"
        title=""
        data={transformedData}
        loading={loading}
        error={error}
        currentPage={currentPage}
        totalPages={Math.ceil(trades.count / 10)}
        onPageChange={handlePageChange}
        onViewTransaction={handleViewTransaction}
      />
    </div>
  );
};

export default OrdersTransactions;
