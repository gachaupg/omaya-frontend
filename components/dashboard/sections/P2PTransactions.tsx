import React, { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import {
  fetchUserTrades,
  setCurrentPage,
} from "@/features/p2p/slices/userTradesSlice";
import { TransactionType } from "@/features/p2p/types";
// TODO: If not instaplled, run: npm install date-fns
import { formatDistanceToNow } from "date-fns";
import { NoDataFound } from "../ui/Transactions";
import { useDashboardI18n } from "@/lib/useDashboardI18n";
import { SortArrowsIcon } from "@/components/ui/SortArrowsIcon";
import { getHighResAssetIcon } from "@/features/express/utils/imageHelpers";

const BANK_ICONS: Record<string, string> = {
  "Salam Bank": "/banks/salam.png",
  "Premier Bank": "/banks/premier.png",
  "Dahabshiil Bank": "/banks/dahabshiil.png",
};

/** `TransactionType.payment` may be a single entry or an array — normalize for safe access. */
const normalizeP2PPayment = (
  payment: TransactionType["payment"]
): { bank: string; logo: string } | undefined => {
  if (!payment) return undefined;
  if (Array.isArray(payment)) return payment[0];
  return payment;
};

const P2PTransactions = () => {
  const formatRecentTime = (dateValue: string) => {
    const v = formatDistanceToNow(new Date(dateValue), { addSuffix: true });
    return /less than (a|1) minute ago/i.test(v) ? "now" : v;
  };

  const { t } = useDashboardI18n();
  const dispatch = useDispatch<AppDispatch>();
  const { trades, loading, error, currentPage } = useSelector(
    (state: RootState) => state.userTrades
  );
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;
  // Ensure trades.results is an array
  const tradesArray = Array.isArray(trades?.results) ? trades.results : [];
  const totalPages = Math.ceil(tradesArray.length / itemsPerPage);
  const paginatedData = tradesArray.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const fetchTrades = useCallback(() => {
    if (isAuthenticated) {
      dispatch(fetchUserTrades({ page: currentPage }));
    }
  }, [dispatch, currentPage, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrades();
    }
  }, [fetchTrades]);

  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page));
  };

  const transformedData: TransactionType[] = paginatedData.map((trade) => {
    const currentUserEmail = String(user?.email || "").toLowerCase();
    const tradeOwnerEmail = String(trade?.owner || "").toLowerCase();
    const rawOrderType =
      typeof trade.order_type === "string"
        ? trade.order_type.toLowerCase()
        : "";
    const normalizedOrderType =
      tradeOwnerEmail && currentUserEmail && tradeOwnerEmail !== currentUserEmail
        ? rawOrderType === "buy"
          ? "sell"
          : rawOrderType === "sell"
            ? "buy"
            : rawOrderType
        : rawOrderType;

    // P2P trades are always USDT-based in this UI.
    // Some APIs omit `currency`, so force consistent Asset display.
    const assetSymbol = "USDT";
    const asset = "Tether";
    let payment = undefined;
    if (Array.isArray(trade.payment_details) && trade.payment_details[0]) {
      payment = {
        bank: trade.payment_details[0].provider,
        logo: BANK_ICONS[trade.payment_details[0].provider] || "",
      };
    }
    return {
      id: trade.id,
      type: normalizedOrderType,
      date: trade.timestamp,
      amount: parseFloat(trade.amount).toFixed(4),
      status:
        typeof trade.status === "string" ? trade.status.toLowerCase() : "",
      asset,
      assetSymbol,
      payment,
      rawData: trade as any,
    };
  });

  const getFiatTicker = (tx: TransactionType): "USD" | "KES" => {
    const rc = String((tx as any)?.rawData?.range_currency || "").trim().toUpperCase();
    return rc === "KES" ? "KES" : "USD";
  };

  const getDirection = (tx: TransactionType) => {
    const fiat = getFiatTicker(tx);
    const t = String(tx.type || "").toLowerCase().trim();
    if (t === "sell") return { from: "USDT", to: fiat };
    if (t === "buy") return { from: fiat, to: "USDT" };
    return { from: "USDT", to: fiat };
  };

  const getTickerIcon = (ticker: string) => {
    const t = String(ticker || "").trim().toUpperCase();
    if (t === "USDT") return getHighResAssetIcon({ ticker: "USDT" });
    if (t === "USD") return getHighResAssetIcon({ ticker: "USD" });
    // No dedicated icon yet (KES etc.)
    return "/default-provider-logo.svg";
  };

  if (!paginatedData.length) {
    return (
      <NoDataFound
        title={t("transactions.noTransactionsFound", "No P2P Transactions Found")}
        message={t(
          "transactions.noTransactionsMessage",
          "There are currently no P2P transactions to display. Please check back later or try adjusting your filters."
        )}
      />
    );
  }

  return (
    <div className="w-full h-full bg-transparent rounded-xl sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6">
      {/* Mobile Card Layout */}
      <div className="block sm:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-600 dark:text-white">
            Loading...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
        ) : transformedData.length === 0 ? (
          <div className="text-center py-8 dark:text-white text-gray-900">
            No transactions found.
          </div>
        ) : (
          transformedData.map((transaction) => {
            const paymentInfo = normalizeP2PPayment(transaction.payment);
            const dir = getDirection(transaction);
            return (
            <div
              key={transaction.id}
              className="bg-transparent border border-[#E8EFF5] dark:border-[#35353E] rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={getHighResAssetIcon({ ticker: transaction.assetSymbol })}
                    alt={transaction.assetSymbol}
                    className="w-10 h-10 rounded-full bg-white flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = "/default-provider-logo.svg";
                    }}
                  />
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">
                      {transaction.assetSymbol}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mt-0.5">
                      {transaction.asset}
                    </div>
                  </div>
                </div>
                <span
                  className={
                    typeof transaction.type === "string" &&
                      transaction.type === "buy"
                      ? "text-[#1D8751] font-semibold text-sm"
                      : "text-[#E23D3A] font-semibold text-sm"
                  }
                >
                  {typeof transaction.type === "string"
                    ? transaction.type.charAt(0).toUpperCase() +
                    transaction.type.slice(1)
                    : ""}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">Amount</div>
                  <div
                    className="text-base sm:text-lg font-semibold"
                    style={{
                      color:
                        typeof transaction.type === "string" &&
                          transaction.type === "buy"
                          ? "#1D8751"
                          : "#E23D3A",
                    }}
                  >
                    {transaction.amount} USDT
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">Payment</div>
                  <div className="flex items-center gap-2">
                    {paymentInfo?.logo ? (
                        <img
                          src={paymentInfo.logo}
                          alt={paymentInfo.bank}
                          className="w-6 h-6 rounded-full bg-white flex-shrink-0"
                        />
                      ) : null}
                    <span className="text-gray-900 dark:text-white text-sm">
                      {paymentInfo?.bank ?? "N/A"}
                    </span>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">When</div>
                  <div className="text-sm text-gray-900 dark:text-[#A0A3BC]">
                    {formatRecentTime(transaction.date)}
                  </div>
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full text-sm text-left bg-transparent">
          <thead>
            <tr className="border-b border-gray-200 dark:border-[#35353E]">
              <th className="px-3 sm:px-4 lg:px-4 py-3 font-medium text-xs sm:text-sm text-gray-600 dark:text-[#788099]"><span className="inline-flex items-center">Asset<SortArrowsIcon /></span></th>
              <th className="px-3 sm:px-4 lg:px-4 py-3 font-medium text-xs sm:text-sm text-gray-600 dark:text-[#788099]"><span className="inline-flex items-center">From<SortArrowsIcon /></span></th>
              <th className="px-3 sm:px-4 lg:px-4 py-3 font-medium text-xs sm:text-sm text-gray-600 dark:text-[#788099]"><span className="inline-flex items-center">To<SortArrowsIcon /></span></th>
              <th className="px-3 sm:px-4 lg:px-4 py-3 font-medium text-xs sm:text-sm text-gray-600 dark:text-[#788099]"><span className="inline-flex items-center">Amount<SortArrowsIcon /></span></th>
              <th className="px-3 sm:px-4 lg:px-4 py-3 font-medium text-xs sm:text-sm text-gray-600 dark:text-[#788099]"><span className="inline-flex items-center">Status<SortArrowsIcon /></span></th>
              <th className="px-3 sm:px-4 lg:px-4 py-3 font-medium text-xs sm:text-sm text-gray-600 dark:text-[#788099]"><span className="inline-flex items-center">When<SortArrowsIcon /></span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-600 dark:text-white">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-red-500">
                  {error}
                </td>
              </tr>
            ) : transformedData.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 dark:text-white text-gray-900">
                  No transactions found.
                </td>
              </tr>
            ) : (
              transformedData.map((transaction) => {
                const paymentInfo = normalizeP2PPayment(transaction.payment);
                const dir = getDirection(transaction);
                return (
                <tr
                  key={transaction.id}
                  className="border-b border-gray-200 dark:border-[#35353E] hover:bg-gray-50 dark:hover:bg-[#28293d] transition-colors"
                >
                  {/* Asset */}
                  <td className="px-3 sm:px-4 lg:px-4 py-3 border-b border-gray-200 dark:border-[#35353E]">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <img
                        src={getHighResAssetIcon({ ticker: transaction.assetSymbol })}
                        alt={transaction.assetSymbol}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = "/default-provider-logo.svg";
                        }}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                          {transaction.assetSymbol}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-[#A0A3BC] truncate">
                          {transaction.asset}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* From */}
                  <td className="px-3 sm:px-4 lg:px-4 py-3 border-b border-gray-200 dark:border-[#35353E]">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={getTickerIcon(dir.from)}
                        alt={dir.from}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover bg-white flex-shrink-0 border border-[#E8EFF5] dark:border-[#35353E]"
                        onError={(e) => {
                          e.currentTarget.src = "/default-provider-logo.svg";
                        }}
                      />
                      <span className="text-gray-900 dark:text-white text-sm sm:text-base truncate">
                        {dir.from}
                      </span>
                    </div>
                  </td>

                  {/* To */}
                  <td className="px-3 sm:px-4 lg:px-4 py-3 border-b border-gray-200 dark:border-[#35353E]">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={getTickerIcon(dir.to)}
                        alt={dir.to}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover bg-white flex-shrink-0 border border-[#E8EFF5] dark:border-[#35353E]"
                        onError={(e) => {
                          e.currentTarget.src = "/default-provider-logo.svg";
                        }}
                      />
                      <span className="text-gray-900 dark:text-white text-sm sm:text-base truncate">
                        {dir.to}
                      </span>
                    </div>
                  </td>

                  {/* Amount */}
                  <td
                    className="px-3 sm:px-4 lg:px-4 py-3 border-b border-gray-200 dark:border-[#35353E] text-sm sm:text-base font-semibold"
                    style={{
                      color:
                        typeof transaction.type === "string" &&
                          transaction.type === "buy"
                          ? "#1D8751"
                          : "#E23D3A",
                    }}
                  >
                    {transaction.amount} USDT
                  </td>
                  {/* Status */}
                  <td className="px-3 sm:px-4 lg:px-4 py-3 border-b border-gray-200 dark:border-[#35353E]">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                      {(transaction.status || "N/A").toString().replace(/_/g, " ").toUpperCase()}
                    </span>
                  </td>
                  {/* When */}
                  <td className="px-3 sm:px-4 lg:px-4 py-3 border-b border-gray-200 dark:border-[#35353E] text-sm sm:text-base text-gray-500 dark:text-[#A0A3BC]">
                    {formatRecentTime(transaction.date)}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 sm:gap-2 mt-4 flex-wrap">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPage(page - 1);
            }}
            disabled={page === 1}
            className="px-2 sm:px-3 py-1.5 sm:py-1 rounded-full border border-[#35353E] text-gray-900 dark:text-white bg-white dark:bg-[#23232b] hover:bg-gray-100 dark:hover:bg-[#35353E] transition disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm min-h-[44px] sm:min-h-0 lg:min-h-0"
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPage(idx + 1);
              }}
              className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-full border text-xs sm:text-sm min-h-[44px] sm:min-h-0 lg:min-h-0 ${page === idx + 1
                ? "bg-[#1D8751] text-white border-[#1D8751]"
                : "border-[#35353E] text-gray-600 dark:text-[#A0A3BC] bg-white dark:bg-[#23232b] hover:bg-gray-100 dark:hover:bg-[#35353E]"
                } transition`}
            >
              {idx + 1}
            </button>
          ))}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPage(page + 1);
            }}
            disabled={page === totalPages}
            className="px-2 sm:px-3 py-1.5 sm:py-1 rounded-full border border-[#35353E] text-gray-900 dark:text-white bg-white dark:bg-[#23232b] hover:bg-gray-100 dark:hover:bg-[#35353E] transition disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm min-h-[44px] sm:min-h-0 lg:min-h-0"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default P2PTransactions;
