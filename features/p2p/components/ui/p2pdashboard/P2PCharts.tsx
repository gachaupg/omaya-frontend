import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Charts from "../../Common/charts";
import { Table } from "../../Common/Table";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { p2pBuyandSell } from "@/features/p2p/slices/p2pbuysell";
import { P2POrder, TransactionType } from "@/features/p2p/types";

const P2PCharts = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading, error, currentPage } = useSelector(
    (state: RootState) => state.p2pBuySell
  );
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(p2pBuyandSell(currentPage));
    }
  }, [dispatch, currentPage, isAuthenticated]);

  // Handlers for table functionality
  const handleExport = () => {
    console.log("Exporting transactions...");
  };

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
  };

  const handlePageChange = (page: number) => {
    dispatch(p2pBuyandSell(page));
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
      logo: "", // You might want to add a default logo or get it from somewhere
    })),
    username: `${order.advertiser_first_name} ${order.advertiser_last_name}`,
    limit: `${order.min_order_amount} - ${order.max_order_amount}`,
    price: order.exchange_rate,
    commission: order.commission_rate,
    lastUpdate: order.created_on,
  }));

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
            data={transformedData}
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
