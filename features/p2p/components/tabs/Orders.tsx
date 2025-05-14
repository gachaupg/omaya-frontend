import React from "react";
import Filters from "../ui/orders/Filters";
import OrdersTransactions from "../ui/orders/OrdersTransactions";

const Orders = () => {
  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <Filters />
      <div className="flex flex-col  w-full">
        <OrdersTransactions />
      </div>
    </div>
  );
};

export default Orders;
