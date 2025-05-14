import React from "react";
import Charts from "../../Common/charts";
import { Table } from "../../Common/Table";
import { transactionData } from "@/features/p2p/data";

const P2PCharts = () => {
  // Handlers for table functionality
  const handleExport = () => {
    console.log("Exporting transactions...");
  };

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
  };

  return (
    <div className="w-full pt-4">
      <Charts title="P2P Overview (USD)" timeFrame="Month" />
      <Table
        type="p2p"
        title="P2P History"
        data={transactionData}
        onExport={handleExport}
        onSearch={handleSearch}
      />
    </div>
  );
};

export default P2PCharts;
