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
  const { data: wallets = [], loading: walletLoading } = useSelector(
    (state: RootState) => state.wallets
  );

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchTransactionSummary());
      dispatch(fetchWallets());
    }
  }, [dispatch, isAuthenticated]);

  // Find USDT wallet with null check
  const usdtWallet = wallets?.find(
    (wallet: Wallet) => wallet.currency === "USDT"
  );
  const walletBalance = usdtWallet ? parseFloat(usdtWallet.balance) : 0;

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
        className={`rounded-[24px] border border-[${tokens.colors.dark.border}] overflow-hidden bg-[${tokens.colors.dark.card}]`}
        style={{ height: 110 }}
      >
        <div className="w-full h-full">
          {/* Header */}
          <div
            className={`grid grid-cols-3 px-6  py-3 `}
            style={{ background: "#35353E" }}
          >
            <div
              className={`text-sm text-[${tokens.colors.dark.textBody}] font-medium`}
            >
              Asset
            </div>
            <div
              className={`text-sm text-right text-[${tokens.colors.dark.textBody}] font-medium`}
            >
              Available
            </div>
            <div
              className={`text-sm text-right text-[${tokens.colors.dark.textBody}] font-medium`}
            >
              In Escrow / Locked
            </div>
          </div>

          {/* Asset Row */}
          <div
            className={`grid grid-cols-3 px-6 py-4 bg-[${tokens.colors.dark.card}]`}
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
                <div
                  className={`font-medium text-base text-[${tokens.colors.dark.textTitle}]`}
                >
                  USDT
                </div>
                <div
                  className={`text-xs text-[${tokens.colors.dark.textBody}] mt-0.5`}
                >
                  Tether US
                </div>
              </div>
            </div>
            {/* Available */}
            <div
              className={`text-right self-center text-base text-[${tokens.colors.dark.textTitle}] font-medium`}
            >
              {formatNumber(availableBalance)}
            </div>
            {/* Locked */}
            <div
              className={`text-right self-center text-base text-[${tokens.colors.dark.textTitle}] font-medium`}
            >
              {formatNumber(lockedAmount)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Available;
