import React from "react";
import { Table } from "../../Common/Table";
import { ordersTransactionsData } from "@/features/p2p/data";

const OrdersTransactions = () => {
  return (
    <div className="w-full overflow-x-auto">
      <Table
        type="orders"
        title=""
        data={ordersTransactionsData}
      />
    </div>
  );
};

export default OrdersTransactions;
