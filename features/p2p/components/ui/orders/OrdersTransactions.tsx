import React from "react";
import { Table } from "../../Common/Table";
import { TransactionType } from "@/features/p2p/types";

const OrdersTransactions = ({
  transformedData,
  loading,
  error,
  currentPage,
  handlePageChange,
  trades,
  hasActiveLocalFilters,
  filterBar,
}: {
  transformedData: TransactionType[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  handlePageChange: (page: number) => void;
  trades: { count: number };
  hasActiveLocalFilters: boolean;
  filterBar?: React.ReactNode;
}) => {
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
        hideToolbar
        hideP2PDateFilter
        hideP2PSearch
        dateFilter="ALL"
        headerSlot={filterBar}
      />
    </div>
  );
};

export default OrdersTransactions;
