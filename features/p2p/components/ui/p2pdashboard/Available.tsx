import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { fetchTransactionSummary } from "@/features/p2p/slices/transactionSummarySlice";
import { formatCurrency } from "@/lib/globalFormatter";
import { fetchWallets } from "@/features/p2p/slices/walletSlice";
import { selectP2PWalletAmounts, selectTransactionSummary } from "@/features/p2p/selectors";

const USDT_ICON =
  "/images/tether.svg";

const Available = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const summary = useSelector(selectTransactionSummary);
  const { availableAmount, escrow } = useSelector(selectP2PWalletAmounts);
  const availableBalance = summary != null ? availableAmount : 0;
  const totalLocked = summary != null ? escrow : 0;

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchTransactionSummary());
      dispatch(fetchWallets());
    }
  }, [dispatch, isAuthenticated]);

  return (
    <div className="mt-3">
      <div
        className="rounded-[24px] border dark:border-[#35353E] border-gray-300 overflow-hidden bg-white dark:bg-black"
      >
        <div className="w-full h-full">
          {/* Header */}
          <div className="grid grid-cols-3 px-4 sm:px-6 py-2 sm:py-3 dark:bg-[#35353E] bg-gray-50">
            <div className="text-xs sm:text-sm dark:text-[#788099] text-gray-600 font-medium">
              Asset
            </div>
            <div className="text-xs sm:text-sm text-center dark:text-[#788099] text-gray-600 font-medium">
              Available
            </div>
            <div className="text-xs sm:text-sm text-center dark:text-[#788099] text-gray-600 font-medium whitespace-normal leading-tight">
              In Escrow / Locked
            </div>
          </div>

          {/* Asset Row */}
          <div
            className="grid grid-cols-3 px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-[var(--card-color)]"
          >
            {/* Asset */}
            <div className="flex items-center gap-3">
              <img
                src={USDT_ICON}
                alt="USDT"
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white"
              />
              <div>
                <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">
                  USDT
                </div>
                <div className="text-[10px] sm:text-xs text-gray-600 dark:text-[#788099] mt-0.5">
                  Tether US
                </div>
              </div>
            </div>
            {/* Available */}
            <div className="text-center self-center text-sm sm:text-base text-gray-900 dark:text-white font-medium">
              {formatCurrency(availableBalance, "USDT")}
            </div>
            {/* In Escrow / Locked */}
            <div className="text-center self-center text-sm sm:text-base text-gray-900 dark:text-white font-medium">
              {formatCurrency(totalLocked, "USDT")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Available;
