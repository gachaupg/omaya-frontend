import Image from "next/image";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/rootReducer";
import { fetchReferralWithdrawalHistory, ReferralWithdrawalHistoryItem } from "@/features/settings/slices/referralWithdrawalHistorySlice";

const ReferralWithdrawalHistory: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector(
    (state: RootState) => state.referralWithdrawalHistory
  );

  useEffect(() => {
    dispatch(fetchReferralWithdrawalHistory());
  }, [dispatch]);

  // Get asset full name
  const getAssetName = (symbol: string) => {
    const assetMap: Record<string, string> = {
      BTC: "Bitcoin",
      ETH: "Ethereum",
      USDT: "Tether",
      BNB: "Binance Coin",
      ADA: "Cardano",
      DOT: "Polkadot",
      LINK: "Chainlink",
      LTC: "Litecoin",
      XRP: "Ripple",
    };
    return assetMap[symbol?.toUpperCase()] || symbol;
  };

  // Format timestamp to "X min ago" format
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMs = now.getTime() - time.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    
    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins} min ago`;
    
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  };

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "completed":
        return "text-green-500 bg-green-500/10 border-green-500/30";
      case "pending":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      case "rejected":
        return "text-red-500 bg-red-500/10 border-red-500/30";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1D8751]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!data || data.results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          No Withdrawal History
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          You haven't made any withdrawal requests yet.
        </p>
      </div>
    );
  }

  type WithdrawalWithCurrency = ReferralWithdrawalHistoryItem & {
    currency?: string;
  };

  const withdrawals = data.results as WithdrawalWithCurrency[];

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          History of Withdrawal
        </h2>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <div className="bg-white dark:bg-[#1D1D23] border border-[#E8EFF5] dark:border-[#35353F] rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 dark:bg-[#35353E]">
              <tr className="border-b border-[#E8EFF5] dark:border-[#35353F]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 dark:text-gray-500">
                  Asset
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 dark:text-gray-500">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 dark:text-gray-500">
                  Payment Method
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 dark:text-gray-500">
                  When
                </th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((withdrawal) => (
                <tr
                  key={withdrawal.id}
                  className="border-b border-[#E8EFF5] dark:border-[#35353F] last:border-b-0 hover:bg-gray-50 dark:hover:bg-[#23232B] transition-colors"
                >
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#F79330] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {withdrawal.currency?.substring(0, 3) || "BTC"}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {withdrawal.currency} {getAssetName(withdrawal.currency || "")}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm font-semibold text-red-500">
                    ${parseFloat(withdrawal.requested_amount).toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-bold">S</span>
                      </div>
                      <span className="text-sm text-gray-800 dark:text-gray-200">
                        Salam Bank
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(withdrawal.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {withdrawals.map((withdrawal) => (
          <div
            key={withdrawal.id}
            className="bg-white dark:bg-[#1D1D23] border border-[#E8EFF5] dark:border-[#35353F] rounded-xl p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <Image
                    src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
                    alt={`${withdrawal.currency} icon`}
                    width={32}
                    height={32}
                    className="rounded-full bg-gray-100 dark:bg-[#2A2A32] p-1"
                  />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {withdrawal.currency}
                  </span>
                </div>
                <div className="text-sm font-mono text-gray-700 dark:text-gray-300">
                  {withdrawal.referral_withdrawal_id.slice(0, 12)}...
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                  withdrawal.status
                )}`}
              >
                {withdrawal.status.toUpperCase()}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Amount:
                </span>
                <span className="text-sm font-semibold text-[#1D8751]">
                  ${parseFloat(withdrawal.requested_amount).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Wallet:
                </span>
                <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                  {withdrawal.wallet_address.slice(0, 6)}...
                  {withdrawal.wallet_address.slice(-4)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination (if needed) */}
      {(data.next || data.previous) && (
        <div className="flex items-center justify-between mt-6">
          <button
            disabled={!data.previous}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-[#35353F] text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-[#2A2A32] transition-colors"
          >
            Previous
          </button>
          <button
            disabled={!data.next}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-[#35353F] text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-[#2A2A32] transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReferralWithdrawalHistory;

