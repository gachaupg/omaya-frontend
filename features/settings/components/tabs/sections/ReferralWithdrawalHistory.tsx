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

  // Handle pagination
  const handlePageChange = (pageUrl: string | null) => {
    if (pageUrl) {
      dispatch(fetchReferralWithdrawalHistory(pageUrl));
    }
  };

  // Determine transaction mode/type
  const getTransactionMode = (withdrawal: ReferralWithdrawalHistoryItem) => {
    // Check if it has wallet_address (crypto) or not (cash)
    if (withdrawal.wallet_address) {
      return "Crypto";
    }
    // Could be cash withdrawal or other types
    if (withdrawal.withdrawal_method) {
      return withdrawal.withdrawal_method === "crypto" ? "Crypto" : 
             withdrawal.withdrawal_method === "cash" ? "Cash" : 
             withdrawal.withdrawal_method;
    }
    // Default based on presence of wallet
    return "Cash";
  };

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

  // Relative time for recent rows; absolute date from 4+ days to avoid overlap
  const formatWithdrawalDate = (timestamp: string) => {
    if (!timestamp) return "—";

    const time = new Date(timestamp);
    if (Number.isNaN(time.getTime())) return "—";

    const now = new Date();
    const diffInMs = now.getTime() - time.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins} min ago`;

    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 4) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(time);
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

  const withdrawals = data.results as ReferralWithdrawalHistoryItem[];

  // Calculate pagination info
  const getCurrentPage = () => {
    if (data.next) {
      try {
        const url = new URL(data.next);
        const page = parseInt(url.searchParams.get("page") || "2");
        return page - 1;
      } catch {
        return 1;
      }
    }
    if (data.previous) {
      try {
        const url = new URL(data.previous);
        const page = parseInt(url.searchParams.get("page") || "1");
        return page + 1;
      } catch {
        return 2;
      }
    }
    return 1;
  };

  const currentPage = getCurrentPage();
  const itemsPerPage = withdrawals.length || 10;
  const totalPages = Math.ceil(data.count / itemsPerPage);

  return (
    <div className="space-y-4 w-full">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          History of Withdrawal
        </h2>
      </div>

      {/* Desktop Table View - with proper horizontal scroll */}
      <div className="hidden md:block overflow-x-auto -mx-2 px-2">
        <div className="bg-white dark:bg-[var(--card-color)] border border-[#E8EFF5] dark:border-[#35353F] rounded-xl overflow-hidden min-w-[760px]">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 dark:bg-[#35353E]">
              <tr className="border-b border-[#E8EFF5] dark:border-[#35353F]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 dark:text-gray-500">
                  Transaction ID
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 dark:text-gray-500">
                  Asset
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 dark:text-gray-500">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 dark:text-gray-500">
                  Mode
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 dark:text-gray-500">
                  Wallet Address
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 dark:text-gray-500">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 dark:text-gray-500 min-w-[120px] whitespace-nowrap">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((withdrawal) => (
                <tr
                  key={withdrawal.referral_withdrawal_id}
                  className="border-b border-[#E8EFF5] dark:border-[#35353F] last:border-b-0 hover:bg-gray-50 dark:hover:bg-[var(--card-color)] transition-colors"
                >
                  <td className="py-4 px-4 text-xs font-mono text-gray-600 dark:text-gray-400">
                    {withdrawal.referral_withdrawal_id.slice(0, 8)}...
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#F79330] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {withdrawal.currency?.substring(0, 3) || "USD"}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {withdrawal.currency || "USDT"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm font-semibold text-[#1D8751]">
                    ${parseFloat(withdrawal.requested_amount || "0").toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                      {getTransactionMode(withdrawal)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-xs font-mono text-gray-600 dark:text-gray-400 max-w-[120px] truncate">
                    {withdrawal.wallet_address ? (
                      <span title={withdrawal.wallet_address}>
                        {withdrawal.wallet_address.slice(0, 6)}...{withdrawal.wallet_address.slice(-4)}
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                        withdrawal.status
                      )}`}
                    >
                      {withdrawal.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500 dark:text-gray-400 min-w-[120px] whitespace-nowrap">
                    {formatWithdrawalDate(withdrawal.timestamp)}
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
            key={withdrawal.referral_withdrawal_id}
            className="bg-white dark:bg-[var(--card-color)] border border-[#E8EFF5] dark:border-[#35353F] rounded-xl p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-full bg-[#F79330] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {withdrawal.currency?.substring(0, 3) || "USD"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 block">
                      {withdrawal.currency || "USDT"}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium mt-1 inline-block">
                      {getTransactionMode(withdrawal)}
                    </span>
                  </div>
                </div>
                <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-1">
                  Transaction ID: {withdrawal.referral_withdrawal_id.slice(0, 12)}...
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
            <div className="space-y-2 border-t border-[#E8EFF5] dark:border-[#35353F] pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Amount:
                </span>
                <span className="text-sm font-semibold text-[#1D8751]">
                  ${parseFloat(withdrawal.requested_amount || "0").toFixed(2)}
                </span>
              </div>
              {withdrawal.wallet_address && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Wallet:
                  </span>
                  <span className="text-xs font-mono text-gray-600 dark:text-gray-400" title={withdrawal.wallet_address}>
                    {withdrawal.wallet_address.slice(0, 6)}...{withdrawal.wallet_address.slice(-4)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Date:
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {formatWithdrawalDate(withdrawal.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {(data.next || data.previous || data.count > 0) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-[#E8EFF5] dark:border-[#35353F]">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {withdrawals.length} of {data.count} withdrawal{data.count !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(data.previous)}
              disabled={!data.previous || loading}
              className="px-4 py-2 rounded-lg bg-white dark:bg-[#35353F] border border-[#E8EFF5] dark:border-[#35353F] text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#2A2A32] transition-colors font-medium"
            >
              Previous
            </button>
            <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} {totalPages > 1 && `of ${totalPages}`}
            </div>
            <button
              onClick={() => handlePageChange(data.next)}
              disabled={!data.next || loading}
              className="px-4 py-2 rounded-lg bg-white dark:bg-[#35353F] border border-[#E8EFF5] dark:border-[#35353F] text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#2A2A32] transition-colors font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralWithdrawalHistory;

