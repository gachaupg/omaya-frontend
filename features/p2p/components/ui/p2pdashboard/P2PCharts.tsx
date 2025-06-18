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

const P2PCharts = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading, error, currentPage } = useSelector(
    (state: RootState) => state.p2pBuySell
  );
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(p2pBuyandSell(currentPage));
    }
  }, [dispatch, currentPage, isAuthenticated]);

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

  // Filter data based on search query
  const filteredData = searchQuery.trim()
    ? transformedData.filter(
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
    : transformedData;

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

  const totalOrders = orders?.results?.total_orders_count || 0;

  return (
    <div className="w-full pt-4">
      <Charts
        title="P2P Overview (USD)"
        timeFrame="Month"
        data={transformedData}
      />

      {/* Orders Table */}
      <div className="mt-8">
        {!transformedData || transformedData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No Orders Available
            <p className="text-sm mt-2">
              There are currently no orders to display.
            </p>
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
