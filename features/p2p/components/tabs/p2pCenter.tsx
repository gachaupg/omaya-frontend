import React, { useEffect, useMemo } from "react";
import P2pProfile from "../ui/p2pcenter/P2pProfile";
import Stats from "../ui/p2pcenter/Stats";
import { fetchWallets } from "../../slices/walletSlice";
import { useSelector,useDispatch } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { selectTransactionSummary, fetchTransactionSummary } from "../../slices/transactionSummarySlice";
import { AppDispatch } from "@/store";
import { p2pBuyandSell } from "../../slices/p2pbuysell";
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

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWallets());
      dispatch(p2pBuyandSell(1));
      dispatch(fetchTransactionSummary());
    }
  }, [dispatch, isAuthenticated]);

  // Transform the trades data to include commission, payment, and last update
  const transformedTrades = useMemo(() => {
    if (!orders?.results?.results) return [];

    return orders.results.results.map((trade: any) => ({
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
  }, [orders?.results?.results]);

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
        loading={ordersLoading}
      />
    </div>
  );
};

export default P2PCenter;
