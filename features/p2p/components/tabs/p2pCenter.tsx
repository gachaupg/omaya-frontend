import React, { useEffect, useMemo } from "react";
import P2pProfile from "../ui/p2pcenter/P2pProfile";
import Stats from "../ui/p2pcenter/Stats";
import { fetchWallets } from "../../slices/walletSlice";
import { useSelector,useDispatch } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { selectTransactionSummary, fetchTransactionSummary } from "../../slices/transactionSummarySlice";
import { AppDispatch } from "@/store";
import { p2pBuyandSell } from "../../slices/p2pbuysell";
import { fetchMyOrders } from "../../slices/myOrdersSlice";
import FiterTabs from "../ui/p2pcenter/FilterTabs";

const P2PCenter: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const { data: wallets, loading } = useSelector(
    (state: RootState) => state.wallets
  );
  const summary = useSelector(selectTransactionSummary);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const {
    orders,
    loading: ordersLoading,
    error,
    currentPage,
  } = useSelector((state: RootState) => state.p2pBuySell);

  const {
    orders: myOrders,
    loading: myOrdersLoading,
  } = useSelector((state: RootState) => state.myOrders);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWallets());
      dispatch(p2pBuyandSell(1));
      dispatch(fetchMyOrders(1));
      dispatch(fetchTransactionSummary());
    }
  }, [dispatch, isAuthenticated]);

  // Transform the trades data to include commission, payment, and last update
  const transformedTrades = useMemo(() => {
    const buyOrders = (orders as any)?.buy_orders?.results || [];
    const sellOrders = (orders as any)?.sell_orders?.results || [];
    const allOrders = [...buyOrders, ...sellOrders];

    return allOrders.map((trade: any) => ({
      ...trade,
      commission_rate: `${trade.commission_rate || 0}%`,
      payment:
        trade.payment_details?.map((detail: any) => ({
          bank: detail.provider,
          logo: `/banks/${detail.provider
            .toLowerCase()
            .replace(/\s+/g, "")}.png`,
        })) || [],
      lastUpdate: new Date(trade.timestamp).toLocaleString(),
    }));
  }, [orders]);

  // Transform the "My Orders" data
  const transformedMyOrders = useMemo(() => {
    // My orders come in a different structure: { count, next, previous, results: { total_orders_count, results: [] } }
    const ordersArray = (myOrders as any)?.results?.results || [];

    return ordersArray.map((trade: any) => ({
      ...trade,
      assetSymbol: trade.currency,
      assetImage: trade.asset_image || "https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png",
      commission_rate: trade.commission_rate || 0,
      payment:
        trade.payment_details?.map((detail: any) => ({
          bank: detail.provider,
          logo: detail.provider_logo || "https://res.cloudinary.com/dam1sxczj/image/upload/v1748884335/image_7_dqkxkj.png",
        })) || [],
      provider_logo: trade.payment_details?.[0]?.provider_logo,
      lastUpdate: new Date(trade.created_on).toLocaleString(),
    }));
  }, [myOrders]);

  return (
    <div className="flex flex-col gap-6 w-full h-full min-h-screen px-0 sm:px-1 lg:px-2 overflow-x-hidden">
      <P2pProfile
        wallets={wallets}
        summary={summary}
        loading={loading}
      />
      <Stats summary={summary} />
      <FiterTabs
        transformedTrades={transformedTrades}
        myOrders={transformedMyOrders}
        loading={ordersLoading}
        myOrdersLoading={myOrdersLoading}
      />
    </div>
  );
};

export default P2PCenter;
