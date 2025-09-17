import { tokens } from "@/styles/tokens";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import {
  fetchTransactionSummary,
  selectTransactionSummary,
  selectTransactionSummaryLoading,
} from "@/features/p2p/slices/transactionSummarySlice";
import { formatNumber } from "@/utils/formatters";
import { fetchWallets } from "@/features/p2p/slices/walletSlice";

interface Wallet {
  currency: string;
  balance: string;
}

const USDT_ICON =
  "https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png";

const Available = () => {
  const dispatch = useDispatch<AppDispatch>();
  const summary = useSelector(selectTransactionSummary);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { data: wallets, loading: walletLoading } = useSelector(
    (state: RootState) => state.wallets
  );

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchTransactionSummary());
      dispatch(fetchWallets());
    }
  }, [dispatch, isAuthenticated]);

  // Get USDT wallet balance from the new wallet response structure
  const walletBalance = wallets?.wallet?.currency === "USDT" 
    ? parseFloat(wallets.wallet.balance) 
    : 0;

  // Calculate available balance (total approved - pending withdrawals)
  const availableBalance = summary
    ? walletBalance -
      summary.total_pending_p2p_withdrawals -
      summary.total_sell_orders_by_status.pending
    : 0;

  // Calculate locked amount (pending deposits + pending withdrawals)
  const lockedAmount = 0;

  return (
    <div className="mt-3">
      <div
        className="rounded-[24px] border dark:border-[#35353E] border-gray-300 overflow-hidden dark:bg-[#35353E] bg-[#F5F5F5]"
        style={{ height: 110 }}
      >
        <div className="w-full h-full">
          {/* Header */}
          <div className="grid grid-cols-3 px-6 py-3 dark:bg-[#35353E] bg-gray-200">
            <div className="text-sm dark:text-[#788099] text-[#788099] font-medium">
              Asset
            </div>
            <div className="text-sm text-right dark:text-[#788099] text-[#788099] font-medium">
              Available
            </div>
            <div className="text-sm text-right dark:text-[#788099] text-[#788099] font-medium">
              In Escrow / Locked
            </div>
          </div>

          {/* Asset Row */}
          <div
            className="grid grid-cols-3 px-6 py-4 dark:bg-[#18181D] bg-[#FFFFFF]"
            style={{ minHeight: 70 }}
          >
            {/* Asset */}
            <div className="flex items-center gap-3">
              <img
                src={USDT_ICON}
                alt="USDT"
                className="w-7 h-7 rounded-full bg-white"
              />
              <div>
                <div className="font-medium text-base dark:text-white text-[#0D0D0D]">
                  USDT
                </div>
                <div className="text-xs dark:text-[#788099] text-[#788099] mt-0.5">
                  Tether US
                </div>
              </div>
            </div>
            {/* Available */}
            <div className="text-right self-center text-base dark:text-white text-[#0D0D0D] font-medium">
              {formatNumber(availableBalance)}
            </div>
            {/* Locked */}
            <div className="text-right self-center text-base dark:text-white text-[#0D0D0D] font-medium">
              {formatNumber(lockedAmount)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Available;
