"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchAllUserTransactions, setCurrentPage } from "@/features/transactions/slices/allTransactionsSlice";
import { formatDistanceToNow } from "date-fns";
import { NoDataFound } from "../ui/Transactions";
import { useDashboardI18n } from "@/lib/useDashboardI18n";
import { SortArrowsIcon } from "@/components/ui/SortArrowsIcon";
import { FaUniversity } from "react-icons/fa";
import { getHighResAssetIcon } from "@/features/express/utils/imageHelpers";
import type { AllTransactionItem } from "@/features/transactions/api";

const formatAmount = (amount: string | number | undefined | null): string => {
  if (amount === undefined || amount === null || amount === "") return "0.0000";
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "0.0000";
  return numAmount.toFixed(4);
};

const formatRecentTime = (dateValue: string) => {
  const v = formatDistanceToNow(new Date(dateValue), { addSuffix: true });
  return /less than (a|1) minute ago/i.test(v) ? "now" : v;
};

const getAssetName = (symbol: string) => {
  switch (symbol) {
    case "BTC":
      return "Bitcoin";
    case "ETH":
      return "Ethereum";
    case "USDT":
      return "Tether";
    case "USD":
      return "";
    default:
      return symbol;
  }
};

const getTypeLabel = (type: string, subType: string) => {
  if (type === "exchange") {
    return subType === "deposit" ? "Deposit" : subType === "withdrawal" ? "Withdrawal" : type;
  }
  if (type === "moneyx") return "MoneyX";
  if (type === "p2p") return "P2P";
  if (type === "swap") return "Swap";
  return type;
};

/** USDT (BSC) style label for unified “all” feed when API omits from_/to_ currency fields */
const formatP2pCryptoLabel = (tx: AllTransactionItem): string => {
  const sym = (tx.currency || tx.asset || "USDT").toUpperCase();
  const net = tx.network || tx.from_network || tx.to_network;
  return net ? `${sym} (${net})` : sym;
};

const truncateAddress = (addr: string, lead = 6, tail = 4): string => {
  if (!addr || addr.length <= lead + tail + 2) return addr;
  return `${addr.slice(0, lead)}...${addr.slice(-tail)}`;
};

// Format status for user-friendly display
const formatStatus = (status: string | undefined | null): string => {
  if (!status) return "N/A";

  // Map database status values to user-friendly labels
  const statusMap: Record<string, string> = {
    'otp_pending': 'Pending',
    'OTP_PENDING': 'Pending',
    'pending': 'Pending',
    'pending_address': 'Pending',
    'pending_approval': 'Pending Approval',
    'completed': 'Completed',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'error': 'Error',
    'failed': 'Failed',
    'cancelled': 'Cancelled',
    'processing': 'Processing',
    'waiting': 'Waiting',
    'new': 'New',
  };

  const lowerStatus = status.toLowerCase();
  if (statusMap[lowerStatus]) {
    return statusMap[lowerStatus];
  }

  // Fallback: Replace underscores with spaces and capitalize first letter of each word
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const AllTransactions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useDashboardI18n();
  const { data, loading, error } = useSelector(
    (state: RootState) => state.allTransactions
  );
  const [currentPage, setCurrentPageLocal] = useState(1);
  const itemsPerPage = 50;
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(
      fetchAllUserTransactions({
        type: "all",
        page: currentPage,
        page_size: itemsPerPage,
      })
    );
  }, [dispatch, currentPage]);

  const handlePageChange = (pageNumber: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentPageLocal(pageNumber);
    dispatch(setCurrentPage(pageNumber));
    if (containerRef.current) {
      const yOffset = -100;
      const element = containerRef.current;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1D8751]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {t("common.error", "Error")}: {error}
      </div>
    );
  }

  const rawResults = data?.results ?? [];
  const results = [...rawResults].sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateB - dateA;
  });
  const totalCount = data?.count ?? 0;
  const totalPages = data?.total_pages ?? 1;

  if (!results.length) {
    return (
      <NoDataFound
        title={t("transactions.noTransactions", "No Transactions Found")}
        message={t(
          "transactions.noTransactionsDescription",
          "There are currently no transactions to display. Please check back later."
        )}
      />
    );
  }

  const getFromToDisplay = (tx: AllTransactionItem) => {
    const clean = (v: unknown): string | null => {
      const s = String(v ?? "").trim();
      if (!s || s === "-" || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") {
        return null;
      }
      return s;
    };
    const paymentProvider = clean((tx as any)?.payment_method?.provider);
    const senderProvider = clean((tx as any)?.sender_provider);
    const receiverProvider = clean((tx as any)?.receiver_provider);
    const recipientName = clean((tx as any)?.recipient_name);
    const fallbackAsset = clean(tx.currency || tx.asset) || "USD";

    if (tx.type === "swap") {
      return {
        from: `${tx.from_currency || tx.currency} (${tx.from_network || tx.network || "-"})`,
        to: `${tx.to_currency || "-"} (${tx.to_network || "-"})`,
      };
    }
    if (tx.type === "exchange") {
      const isDeposit = tx.sub_type === "deposit";
      return {
        from: isDeposit
          ? paymentProvider || senderProvider || "Bank / Payment"
          : `${tx.currency || "USDT"} (${tx.network || "-"})`,
        to: isDeposit
          ? `${tx.currency || "USDT"} (${tx.network || "-"})`
          : paymentProvider || receiverProvider || recipientName || "Bank / Wallet",
      };
    }
    if ((tx as any)?.type === "forex") {
      const fromCurrency = clean((tx as any)?.from_currency);
      const toCurrency = clean((tx as any)?.to_currency);
      return {
        from: fromCurrency || fallbackAsset,
        to: paymentProvider || receiverProvider || recipientName || toCurrency || "Bank / Wallet",
      };
    }
    if (tx.type === "moneyx") {
      return {
        from: senderProvider || paymentProvider || "Sender Provider",
        to: receiverProvider || recipientName || paymentProvider || "Receiver Provider",
      };
    }
    if (tx.type === "p2p" && (tx.from_currency || tx.to_currency)) {
      return {
        from: `${tx.from_currency || tx.currency} (${tx.from_network || tx.network || "-"})`,
        to: `${tx.to_currency || "-"} (${tx.to_network || "-"})`,
      };
    }
    const p2pSub = (tx.sub_type || "").toLowerCase();
    if (tx.type === "p2p" && p2pSub === "withdrawal") {
      const cryptoLabel = formatP2pCryptoLabel(tx);
      return {
        from: cryptoLabel,
        to: tx.withdrawal_address
          ? truncateAddress(tx.withdrawal_address)
          : "Wallet",
      };
    }
    if (tx.type === "p2p" && p2pSub === "deposit") {
      return {
        from: tx.deposit_address ? truncateAddress(tx.deposit_address) : "Source",
        to: formatP2pCryptoLabel(tx),
      };
    }
    if (tx.type === "p2p" && p2pSub === "buy") {
      const cryptoLabel = formatP2pCryptoLabel(tx);
      return {
        from: "Fiat (P2P)",
        to: `${cryptoLabel} · Wallet`,
      };
    }
    if (tx.type === "p2p" && p2pSub === "sell") {
      const cryptoLabel = formatP2pCryptoLabel(tx);
      return {
        from: `${cryptoLabel} · Wallet`,
        to: "Fiat (P2P)",
      };
    }
    if (tx.type === "p2p") {
      const cryptoLabel = formatP2pCryptoLabel(tx);
      return {
        from: "P2P",
        to: `${cryptoLabel} · Wallet`,
      };
    }
    return {
      from: senderProvider || paymentProvider || fallbackAsset,
      to: receiverProvider || recipientName || paymentProvider || "Bank / Wallet",
    };
  };

const extractAssetSymbolFromLabel = (label: string): string | null => {
  const raw = String(label || "").trim();
  if (!raw) return null;
  // Common non-asset labels in From/To columns
  const lower = raw.toLowerCase();
  if (
    lower.includes("bank") ||
    lower.includes("wallet") ||
    lower.includes("provider") ||
    lower.includes("payment")
  ) {
    return null;
  }
  // Matches "USDT (bep20)" or "USDT" at start of label
  const m = raw.match(/^([A-Za-z0-9]{2,12})\s*(?:\(|$)/);
  if (!m) return null;
  const symbol = String(m[1] || "").toUpperCase();
  // Avoid accidentally treating addresses/ids as symbols
  if (symbol.length > 8) return null;
  return symbol;
};

const getFromToLogos = (tx: AllTransactionItem, fromLabel: string, toLabel: string): { fromLogo: string | null; toLogo: string | null } => {
  const paymentMethodLogo = String((tx as any)?.payment_method?.logo_url || "").trim() || null;
  const senderLogo = String((tx as any)?.sender_provider_logo || "").trim() || null;
  const receiverLogo = String((tx as any)?.receiver_provider_logo || "").trim() || null;
  const providerLogo = String((tx as any)?.provider_logo || "").trim() || null;
  const paymentDetailLogo =
    (Array.isArray((tx as any)?.payment_details)
      ? ((tx as any).payment_details.find(
          (detail: any) => detail?.provider_logo || detail?.logo || detail?.logo_url
        )?.provider_logo ||
        (tx as any).payment_details.find(
          (detail: any) => detail?.provider_logo || detail?.logo || detail?.logo_url
        )?.logo ||
        (tx as any).payment_details.find(
          (detail: any) => detail?.provider_logo || detail?.logo || detail?.logo_url
        )?.logo_url)
      : null) || null;
  const genericLogo = paymentMethodLogo || paymentDetailLogo || providerLogo;

  const fromAssetSymbol = tx.from_currency || extractAssetSymbolFromLabel(fromLabel);
  const toAssetSymbol = tx.to_currency || extractAssetSymbolFromLabel(toLabel);
  const fromAssetLogo = fromAssetSymbol ? getHighResAssetIcon({ ticker: fromAssetSymbol }) : null;
  const toAssetLogo = toAssetSymbol ? getHighResAssetIcon({ ticker: toAssetSymbol }) : null;

  if (tx.type === "exchange") {
    const isDeposit = tx.sub_type === "deposit";
    return {
      // Exchange deposit: From is bank/provider, To is asset
      // Exchange withdrawal: From is asset, To is bank/provider
      fromLogo: isDeposit ? (genericLogo || fromAssetLogo) : (fromAssetLogo || genericLogo),
      toLogo: isDeposit ? (toAssetLogo || genericLogo) : (genericLogo || toAssetLogo),
    };
  }

  if (tx.type === "moneyx") {
    return {
      // MoneyX is provider-based; still prefer asset logo when label looks like a currency.
      fromLogo: fromAssetLogo || senderLogo || genericLogo,
      toLogo: toAssetLogo || receiverLogo || genericLogo,
    };
  }

  if (tx.type === "swap") {
    return {
      fromLogo: fromAssetLogo,
      toLogo: toAssetLogo,
    };
  }

  if (tx.type === "p2p" && (fromAssetLogo || toAssetLogo)) {
    return {
      fromLogo: fromAssetLogo,
      toLogo: toAssetLogo,
    };
  }

  // For "all" feed rows where backend provides payment details on other types,
  // prefer showing at least one provider logo in the payment side.
  if ((tx as any)?.sub_type === "withdrawal") {
    return { fromLogo: fromAssetLogo, toLogo: toAssetLogo || genericLogo };
  }
  if ((tx as any)?.sub_type === "deposit") {
    return { fromLogo: fromAssetLogo || genericLogo, toLogo: toAssetLogo };
  }

  return {
    fromLogo: fromAssetLogo || genericLogo,
    toLogo: toAssetLogo || genericLogo,
  };
};

const renderFromToValue = (label: string, logoUrl?: string | null) => {
  if (!logoUrl) {
    return (
      <span className="font-medium text-sm text-gray-900 dark:text-white truncate block">
        {label}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      <img
        src={logoUrl}
        alt={label}
        className="w-5 h-5 rounded-full object-cover flex-shrink-0"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <span className="font-medium text-sm text-gray-900 dark:text-white truncate block">
        {label}
      </span>
    </div>
  );
};

  const renderAssetIcon = (tx: AllTransactionItem) => {
    if (tx.type === "moneyx" && !tx.currency && !tx.asset) {
      return (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1D8751] flex items-center justify-center flex-shrink-0">
          <FaUniversity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </div>
      );
    }
    // Use getHighResAssetIcon based on currency/ticker for proper asset logos
    const ticker = tx.currency || tx.asset;
    if (ticker) {
      return (
        <img
          src={getHighResAssetIcon({ ticker })}
          alt={ticker}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shadow-sm flex-shrink-0"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      );
    }
    return (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1D8751] flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-semibold text-white">
          {(tx.currency || tx.asset || "?").slice(0, 1)}
        </span>
      </div>
    );
  };

  const renderRow = (tx: AllTransactionItem, index: number) => {
    const isExchange = tx.type === "exchange";
    const isDeposit = tx.sub_type === "deposit";
    const { from: fromDisplay, to: toDisplay } = getFromToDisplay(tx);
    const { fromLogo, toLogo } = getFromToLogos(tx, fromDisplay, toDisplay);

    const assetName = getAssetName(tx.currency || tx.asset || "USDT");
    return (
      <tr
        key={tx.id || `tx-${index}`}
        className="hover:bg-gray-100 dark:hover:bg-[#23232A] transition-colors"
      >
        <td className="px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-[#35353E]">
          <div className="flex items-center gap-2 sm:gap-3">
            {renderAssetIcon(tx)}
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                {tx.currency || tx.asset || "USDT"}
              </span>
              {assetName && (
                <span className="text-xs text-gray-500 dark:text-[#A0A3BC] truncate">
                  {assetName}
                </span>
              )}
            </div>
          </div>
        </td>
        <td className="px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-[#35353E]">
          {renderFromToValue(fromDisplay, fromLogo)}
        </td>
        <td className="px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-[#35353E]">
          {renderFromToValue(toDisplay, toLogo)}
        </td>
        <td
          className={`px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-[#35353E] text-sm sm:text-base font-semibold ${isExchange && isDeposit ? "text-[#1D8751]" : "text-red-500 dark:text-red-400"
            }`}
        >
          {formatAmount(tx.amount)}
        </td>
        <td className="px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-[#35353E]">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${tx.status === "completed"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : tx.status === "pending" ||
                  tx.status === "pending_address" ||
                  tx.status === "pending_approval" ||
                  tx.status?.toLowerCase() === "otp_pending"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : tx.status === "rejected" || tx.status === "error"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
              }`}
          >
            {formatStatus(tx.status)}
          </span>
        </td>
        <td className="px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-[#35353E] text-sm sm:text-base text-gray-500 dark:text-[#A0A3BC]">
          {formatRecentTime(tx.created_at)}
        </td>
      </tr>
    );
  };

  const renderMobileCard = (tx: AllTransactionItem, index: number) => {
    const isExchange = tx.type === "exchange";
    const isDeposit = tx.sub_type === "deposit";
    const { from: fromDisplay, to: toDisplay } = getFromToDisplay(tx);
    const { fromLogo, toLogo } = getFromToLogos(tx, fromDisplay, toDisplay);

    const renderMobileAssetIcon = () => {
      if (tx.type === "moneyx" && !tx.asset_image) {
        return (
          <div className="w-10 h-10 rounded-full bg-[#1D8751] flex items-center justify-center flex-shrink-0">
            <FaUniversity className="w-5 h-5 text-white" />
          </div>
        );
      }
      if (tx.asset_image) {
        return (
          <img
            src={tx.asset_image}
            alt={tx.currency || "Asset"}
            className="w-10 h-10 rounded-full shadow-sm flex-shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        );
      }
      return (
        <div className="w-10 h-10 rounded-full bg-[#1D8751] flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-white">
            {(tx.currency || tx.asset || "?").slice(0, 1)}
          </span>
        </div>
      );
    };

    return (
      <div
        key={tx.id || `tx-${index}`}
        className="bg-transparent border border-[#E8EFF5] dark:border-[#35353E] rounded-xl p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {renderMobileAssetIcon()}
            <div>
              <div className="font-semibold text-sm uppercase tracking-wide text-gray-900 dark:text-white">
                {tx.currency || tx.asset || "USDT"}
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1D8751]/10 text-[#1D8751]">
                {getTypeLabel(tx.type, tx.sub_type)}
              </span>
            </div>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${tx.status === "completed"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : tx.status === "pending" ||
                  tx.status?.toLowerCase() === "otp_pending"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
              }`}
          >
            {formatStatus(tx.status)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">From</div>
            {renderFromToValue(fromDisplay, fromLogo)}
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">To</div>
            {renderFromToValue(toDisplay, toLogo)}
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">Amount</div>
            <div
              className={`font-semibold text-sm ${isExchange && isDeposit ? "text-[#1D8751]" : "text-red-500 dark:text-red-400"
                }`}
            >
              {formatAmount(tx.amount)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">When</div>
            <div className="font-medium text-sm text-gray-500 dark:text-[#A0A3BC]">
              {formatRecentTime(tx.created_at)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const indexOfFirstItem = (currentPage - 1) * itemsPerPage + 1;
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div className="w-full" ref={containerRef}>
      {/* Mobile Card Layout */}
      <div className="block sm:hidden space-y-3">
        {results.map((tx, index) => renderMobileCard(tx, index))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-[#d1d5db] dark:divide-[#35353E]">
          <thead className="bg-transparent">
            <tr className="border-b border-gray-200 dark:border-[#35353E]">
              {[
                t("transactions.asset", "Asset"),
                t("transactions.from", "From"),
                t("transactions.to", "To"),
                t("transactions.amount", "Amount"),
                t("transactions.status", "Status"),
                t("transactions.when", "When"),
              ].map((h) => (
                <th
                  key={h}
                  className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-600 dark:text-[#788099]"
                >
                  <span className="inline-flex items-center">
                    {h}
                    <SortArrowsIcon />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d1d5db] dark:divide-[#35353E]">
            {results.map((tx, index) => renderRow(tx, index))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 sm:gap-4 mt-4">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center px-2">
            {t("transactions.showing", "Showing")} {indexOfFirstItem}-
            {indexOfLastItem} {t("transactions.of", "of")} {totalCount}{" "}
            {t("transactions.transactions", "transactions")}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
            <button
              onClick={(e) => handlePageChange(currentPage - 1, e)}
              disabled={currentPage === 1}
              className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-md border transition-colors duration-150 text-xs sm:text-sm min-h-[44px] sm:min-h-0
                ${currentPage > 1
                  ? "bg-transparent text-gray-600 dark:text-gray-400 border-[#d1d5db] dark:border-[#35353E] hover:bg-[#1D8751] hover:text-white"
                  : "bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed border-transparent"
                }`}
            >
              {t("common.previous", "Previous")}
            </button>
            {(() => {
              const maxButtons = 5;
              let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
              let endPage = Math.min(totalPages, startPage + maxButtons - 1);
              if (endPage - startPage < maxButtons - 1) {
                startPage = Math.max(1, endPage - maxButtons + 1);
              }
              const pageNumbers = [];
              for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
              return (
                <>
                  {startPage > 1 && <span className="text-gray-500 text-xs sm:text-sm">…</span>}
                  {pageNumbers.map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={(e) => handlePageChange(pageNum, e)}
                      className={`mx-0.5 sm:mx-1 px-2 sm:px-3 py-1.5 sm:py-1 rounded-md border transition-colors duration-150 text-xs sm:text-sm min-h-[44px] sm:min-h-0
                        ${pageNum === currentPage
                          ? "bg-[#1D8751] text-white border-[#1D8751]"
                          : "bg-transparent text-gray-600 dark:text-gray-400 border-[#d1d5db] dark:border-[#35353E] hover:bg-[#1D8751] hover:text-white"
                        }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  {endPage < totalPages && <span className="text-gray-500 text-xs sm:text-sm">…</span>}
                </>
              );
            })()}
            <button
              onClick={(e) => handlePageChange(currentPage + 1, e)}
              disabled={currentPage === totalPages}
              className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-md border transition-colors duration-150 text-xs sm:text-sm min-h-[44px] sm:min-h-0
                ${currentPage < totalPages
                  ? "bg-transparent text-gray-600 dark:text-gray-400 border-[#d1d5db] dark:border-[#35353E] hover:bg-[#1D8751] hover:text-white"
                  : "bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed border-transparent"
                }`}
            >
              {t("common.next", "Next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllTransactions;