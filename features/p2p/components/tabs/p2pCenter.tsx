import React, { useEffect } from "react";
import P2pProfile from "../ui/p2pcenter/P2pProfile";
import Stats from "../ui/p2pcenter/Stats";
import FiterTabs from "../ui/p2pcenter/FilterTabs";
import { fetchMatchedTrades } from "../../slices/matchedTradesSlice";
import { fetchWallets } from "../../slices/walletSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { selectTransactionSummary } from "../../slices/transactionSummarySlice";
import { AppDispatch } from "@/store";
import { useDispatch } from "react-redux";

const P2PCenter = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const dispatch = useDispatch<AppDispatch>();
  const { data: wallets, loading } = useSelector(
    (state: RootState) => state.wallets
  );
  const summary = useSelector(selectTransactionSummary);

  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWallets());
      dispatch(fetchMatchedTrades(1));
    }
  }, [dispatch, isAuthenticated]);
  return (
    <div className="flex flex-col gap-6 w-full h-full min-h-screen px-0 sm:px-1 lg:px-2 overflow-x-hidden">
      <P2pProfile
        user={user}
        wallets={wallets}
        summary={summary}
        loading={loading}
      />
      <Stats summary={summary} />
      <FiterTabs />
    </div>
  );
};

export default P2PCenter;
