import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Charts from "../../Common/charts";
import { Table } from "../../Common/Table";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { p2pBuyandSell } from "@/features/p2p/slices/p2pbuysell";
import { P2POrder, TransactionType } from "@/features/p2p/types";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type TimeFilter =
  | "Today"
  | "Last Week"
  | "Last Month"
  | "Last 6 Months"
  | "All Time";

const P2PCharts = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading, error, currentPage } = useSelector(
    (state: RootState) => state.p2pBuySell
  );
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("Last Month");

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(p2pBuyandSell(currentPage));
    }
  }, [dispatch, currentPage, isAuthenticated]);

  // Filter data based on time filter
  const filterDataByTime = (
    data: TransactionType[],
    filter: TimeFilter
  ): TransactionType[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return data.filter((item) => {
      if (!item.lastUpdate) return false;

      // Parse the date string - handle different formats
      let itemDate: Date;
      try {
        // Try parsing as ISO string first
        itemDate = new Date(item.lastUpdate);

        // Check if the date is valid
        if (isNaN(itemDate.getTime())) {
          return false;
        }
      } catch (error) {
        return false;
      }

      switch (filter) {
        case "Today":
          return itemDate >= today;

        case "Last Week":
          const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return itemDate >= lastWeek;

        case "Last Month":
          const lastMonth = new Date(
            today.getTime() - 30 * 24 * 60 * 60 * 1000
          );
          return itemDate >= lastMonth;

        case "Last 6 Months":
          const last6Months = new Date(
            today.getTime() - 180 * 24 * 60 * 60 * 1000
          );
          return itemDate >= last6Months;

        case "All Time":
          return true;

        default:
          return true;
      }
    });
  };

  // Transform orders data
  const transformedData: TransactionType[] = [
    ...(orders?.results?.results || []),
  ].map((order: P2POrder) => ({
    id: order.id,
    type: order.order_type,
    date: order.created_on,
    amount: order.amount,
    status: order.status,
    asset: order.asset,
    assetSymbol: order.currency,
    rate: order.exchange_rate,
    payment: order.payment_details.map((payment) => ({
      bank: payment.provider,
      logo: "",
    })),
    username: `${order.advertiser_first_name} ${order.advertiser_last_name}`,
    limit: `${order.min_order_amount} - ${order.max_order_amount}`,
    price: order.exchange_rate,
    commission: order.commission_rate,
    lastUpdate: order.created_on,
  }));

  // Apply time filter to transformed data
  const timeFilteredData = filterDataByTime(transformedData, timeFilter);

  // Filter data based on search query
  const filteredData = searchQuery.trim()
    ? timeFilteredData.filter(
        (item) =>
          String(item.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(item.type).toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(item.status)
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          String(item.asset)
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          String(item.username)
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    : timeFilteredData;

  // Handlers for table functionality
  const handleExport = (format: "csv" | "pdf") => {
    if (format === "csv") {
      // Export as CSV
      const worksheet = XLSX.utils.json_to_sheet(
        filteredData.map((item) => ({
          ID: item.id,
          Type: item.type,
          Amount: item.amount,
          Status: item.status,
          Asset: item.asset,
          Date: item.date,
          Username: item.username,
          Rate: item.rate,
          Commission: item.commission,
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
      XLSX.writeFile(workbook, "p2p_transactions.csv");
    } else {
      // Export as PDF
      const doc = new jsPDF();
      doc.text("P2P Transactions", 14, 15);

      const tableData = filteredData.map((item) => [
        String(item.id || ""),
        String(item.type || ""),
        String(item.amount || ""),
        String(item.status || ""),
        String(item.asset || ""),
        new Date(item.date || "").toLocaleDateString(),
        String(item.username || ""),
      ]);

      autoTable(doc, {
        head: [["ID", "Type", "Amount", "Status", "Asset", "Date", "Username"]],
        body: tableData,
        startY: 25,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [29, 135, 81],
          textColor: 255,
        },
      });

      doc.save("p2p_transactions.pdf");
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handlePageChange = (page: number) => {
    dispatch(p2pBuyandSell(page));
  };

  const handleTimeFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter);
  };

  const totalOrders = orders?.results?.total_orders_count || 0;

  return (
    <div className="w-full pt-4">
      <Charts
        title="P2P Overview (USD)"
        timeFrame="Month"
        data={timeFilteredData}
        onTimeFilterChange={handleTimeFilterChange}
        selectedTimeFilter={timeFilter}
        showTimeFilter={true}
      />

      {/* Orders Table */}
      <div className="mt-8">
        {!filteredData || filteredData.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className=" border w-full border-gray-600 rounded-lg  p-8 shadow-sm">
              {/* Empty state icon */}
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>

              {/* Main message */}
              <h3 className="text-lg font-semibold text-white mb-2">
                No Orders Found
              </h3>

              {/* Description */}
              <p className="text-gray-500 mb-6">
                {searchQuery.trim()
                  ? `No orders match your search "${searchQuery}" for the selected time period.`
                  : `There are currently no orders to display for the selected time period (${timeFilter}).`}
              </p>

              {/* Action buttons */}
              {searchQuery.trim() && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setSearchQuery("")}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Table
            type="p2p"
            title="P2P Orders"
            data={filteredData}
            loading={loading}
            error={error}
            currentPage={currentPage}
            totalPages={Math.ceil(totalOrders / 10)}
            onPageChange={handlePageChange}
            onExport={handleExport}
            onSearch={handleSearch}
          />
        )}
      </div>
    </div>
  );
};

export default P2PCharts;
