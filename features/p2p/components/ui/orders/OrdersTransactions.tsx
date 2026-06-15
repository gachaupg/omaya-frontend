import React from "react";
import { Table } from "../../Common/Table";
import { TransactionType } from "@/features/p2p/types";
import { NoDataFound } from "@/components/dashboard/ui/Transactions";

const OrdersTransactions = ({
  transformedData,
  loading,
  error,
  currentPage,
  handlePageChange,
  trades,
  hasActiveLocalFilters,
}: {
  transformedData: TransactionType[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  handlePageChange: (page: number) => void;
  trades: { count: number };
  hasActiveLocalFilters: boolean;
}) => {
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
      <NoDataFound
        title="No Orders Found"
        message="There are currently no orders to display. Try adjusting your filters or check back later."
      />
    );
  }

  const totalPages = hasActiveLocalFilters ? 1 : Math.ceil(trades.count / 10);

  return (
    <div className="w-full overflow-x-auto">
      <Table
        type="p2p"
        title=""
        data={transformedData}
        loading={loading}
        error={error}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        showExportButton={false}
        hideP2PDateFilter
        hideP2PSearch
        dateFilter="ALL"
      />
    </div>
  );
};

export default OrdersTransactions;
