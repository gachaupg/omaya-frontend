import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { fetchTransactionSummary } from "@/features/p2p/slices/transactionSummarySlice";
import { formatNumber } from "@/utils/formatters";
import { fetchWallets } from "@/features/p2p/slices/walletSlice";
import { usePendingTotal } from "@/utils/pending";

const USDT_ICON =
  "https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png";

const Available = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // Get all exportable values: pending total, balance, available balance, and total locked
  const { total: pendingTotal, balance: walletBalance, availableBalance, totalLocked } = usePendingTotal();

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchTransactionSummary());
      dispatch(fetchWallets());
    }
  }, [dispatch, isAuthenticated]);

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
              {formatNumber(totalLocked)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Available;
