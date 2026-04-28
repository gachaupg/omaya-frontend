"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { loadAllP2PTransactions } from "@/features/p2p/slices/p2pTransactionsSlice";
import { formatDistanceToNow } from "date-fns";
import { P2PTransaction } from "@/features/p2p/types";
import { NoDataFound } from "../ui/Transactions";
import { useDashboardI18n } from "@/lib/useDashboardI18n";
import { SortArrowsIcon } from "@/components/ui/SortArrowsIcon";
import { getHighResAssetIcon } from "@/features/express/utils/imageHelpers";

interface RootState {
  p2pTransactions: {
    transactions: {
      results: P2PTransaction[];
      count: number;
      next: string | null;
      previous: string | null;
    } | null;
    loading: boolean;
    error: string | null;
    currentPage: number;
    allTransactions: any[];
    hasLoadedAll: boolean;
  };
}

const formatRecentTime = (dateValue: string) => {
  const v = formatDistanceToNow(new Date(dateValue), { addSuffix: true });
  return /less than (a|1) minute ago/i.test(v) ? "now" : v;
};

// Format amount to 4 decimal places
const formatAmount = (amount: string | number | undefined | null): string => {
  if (amount === undefined || amount === null || amount === "") return "0.0000";
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "0.0000";
  return numAmount.toFixed(4);
};

const getAssetName = (symbol: string) => {
  switch (symbol) {
    case "BTC":
      return "Bitcoin";
    case "ETH":
      return "Ethereum";
    case "USDT":
      return "Tether";
    default:
      return symbol;
  }
};

const normalizeSubType = (value: unknown): string => {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "withdraw" || v === "withdrwal") return "withdrawal";
  return v;
};

const extractPaymentInfo = (tx: any) => {
  const paymentDetails = Array.isArray(tx?.payment_details)
    ? tx.payment_details
    : [];

  const detailWithLogo =
    paymentDetails.find(
      (detail: any) => detail?.provider_logo || detail?.logo
    ) || paymentDetails[0];

  // Prefer explicit provider logos for payment method visuals, then fall back to asset image
  const providerLogoFromDetails =
    detailWithLogo?.provider_logo || detailWithLogo?.logo || null;
  const providerLogoFromTransaction = tx?.provider_logo || null;
  const displayImage =
    providerLogoFromDetails ||
    providerLogoFromTransaction ||
    null; // Don't fall back to asset_image - it might be a profile photo

  // Helper function to check if a value is a UUID
  const isUUID = (value: string | null | undefined): boolean => {
    if (!value) return false;
    // UUIDs have format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  };

  // Reject values that look like technical IDs (uuid/hash/id tokens), not user-facing addresses.
  const isLikelyTechnicalId = (value: string | null | undefined): boolean => {
    if (!value) return false;
    const v = String(value).trim();
    if (!v) return false;
    if (isUUID(v)) return true;
    if (/^(tx_|trade_|order_|msg_)/i.test(v)) return true;
    // Pure long hex strings are often hashes/ids rather than wallet/account addresses.
    if (/^[a-f0-9]{24,}$/i.test(v)) return true;
    // Numeric-only long identifiers are likely DB/system IDs.
    if (/^\d{8,}$/.test(v)) return true;
    return false;
  };

  // Helper to filter out invalid values (undefined string, empty, technical IDs)
  const sanitizeValue = (
    value: string | null | undefined,
    txContext?: any
  ): string | null => {
    if (!value) return null;
    const v = String(value).trim();
    if (!v || v === "undefined" || v === "null") return null;
    if (isLikelyTechnicalId(v)) return null;
    // If value equals known transaction identifiers, reject it.
    const knownIds = [
      txContext?.transaction_id,
      txContext?.id,
      txContext?.trade_id,
      txContext?.order_id,
    ]
      .map((x: any) => String(x ?? "").trim())
      .filter(Boolean);
    if (knownIds.includes(v)) return null;
    return v;
  };

  // Get provider name with proper fallbacks, filter out 'undefined' string and UUIDs
  const rawProviderName =
    detailWithLogo?.provider_name ||
    detailWithLogo?.provider ||
    tx?.payment_provider ||
    tx?.payment_provider_display ||
    tx?.sender_provider ||
    tx?.receiver_provider ||
    null;
  
  const providerName = sanitizeValue(rawProviderName, tx);

  const rawMethodLabel =
    tx?.payment_method ||
    tx?.payment_method_display ||
    detailWithLogo?.payment_method_name ||
    detailWithLogo?.payment_method ||
    detailWithLogo?.method ||
    null;
  
  const methodLabel = sanitizeValue(rawMethodLabel, tx);

  // Extract asset info for To column
  const assetSymbol = tx?.currency || tx?.asset_symbol || "USDT";
  // Prefer human-readable network label (network_name) over UUID-like network IDs.
  const assetNetwork =
    sanitizeValue(tx?.network_name, tx) ||
    sanitizeValue(tx?.asset_network, tx) ||
    sanitizeValue(tx?.network, tx) ||
    "BSC";
  
  // Exchange rows should prefer address by subtype:
  // - deposit -> deposit_address
  // - withdrawal -> withdrawal_address
  const txSubType = normalizeSubType(tx?.sub_type || tx?.transaction_type || "");

  const parseAdditionalInfo = (raw: unknown): Record<string, any> | null => {
    if (!raw) return null;
    if (typeof raw === "object") return raw as Record<string, any>;
    if (typeof raw !== "string") return null;
    const text = raw.trim();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      // Backend sometimes sends python-style single quotes.
      try {
        const normalized = text
          .replace(/([{,]\s*)'([^']+?)'\s*:/g, '$1"$2":')
          .replace(/:\s*'([^']*?)'(\s*[,}])/g, ': "$1"$2');
        return JSON.parse(normalized);
      } catch {
        return null;
      }
    }
  };
  const additionalInfo = parseAdditionalInfo(tx?.additional_info);
  const prioritizedAddressCandidates =
    txSubType === "deposit"
      ? [tx?.deposit_address, tx?.wallet_address, tx?.destination_address]
      : txSubType === "withdrawal"
      ? [tx?.withdrawal_address, tx?.wallet_address, tx?.destination_address]
      : [tx?.wallet_address, tx?.destination_address, tx?.deposit_address, tx?.withdrawal_address];

  // Fallback candidates if primary subtype address is empty.
  const walletAddressCandidates = [
    ...prioritizedAddressCandidates,
    tx?.changenow_payin_address,
    tx?.sent_from,
    additionalInfo?.wallet_address,
    additionalInfo?.deposit_address,
    additionalInfo?.withdrawal_address,
    additionalInfo?.address,
    tx?.payout_address,
    tx?.address,
    tx?.to_address,
    tx?.from_address,
    tx?.payment_details?.[0]?.wallet_address,
    tx?.payment_details?.[0]?.account_number,
    tx?.payment_details?.[0]?.mobile_number,
  ];
  const walletAddress =
    walletAddressCandidates
      .map((candidate) => sanitizeValue(candidate, tx))
      .find((candidate) => !!candidate) || null;
  // For the badge fallback, show a transaction identifier when address is missing.
  // Keep this independent from sanitizeValue's "knownIds" rejection.
  const transactionIdentifier =
    String(tx?.id || tx?.exchange_transaction_id || tx?.transaction_id || "").trim() || null;

  return {
    displayImage,
    providerName,
    methodLabel,
    assetSymbol,
    assetNetwork,
    assetImage: null, // Don't expose asset_image as it might be a profile photo
    walletAddress,
    transactionIdentifier,
  };
};

const getFromToDisplay = (tx: any, paymentInfo: any) => {
  // P2P (unified recent transactions): direction must follow sub_type and use from_asset/to_asset when present.
  if (String(tx?.type || "").toLowerCase() === "p2p") {
    const sub = normalizeSubType(tx?.sub_type || tx?.transaction_type || "");
    const fromAsset = String(tx?.from_asset || "").trim();
    const toAsset = String(tx?.to_asset || "").trim();
    const fromLogo =
      String(tx?.from_asset_logo || "").trim() ||
      (fromAsset ? getHighResAssetIcon({ ticker: fromAsset }) : null) ||
      null;
    const toLogo =
      String(tx?.to_asset_logo || "").trim() ||
      (toAsset ? getHighResAssetIcon({ ticker: toAsset }) : null) ||
      null;

    // If backend provides explicit from/to, always use them.
    if (fromAsset && toAsset) {
      return {
        from: { label: fromAsset, logo: fromLogo || getHighResAssetIcon({ ticker: fromAsset }) },
        to: { label: toAsset, logo: toLogo || getHighResAssetIcon({ ticker: toAsset }) },
      };
    }

    // Fallback mapping based on buy/sell when from/to missing.
    if (sub === "buy") {
      return {
        from: { label: "USD", logo: getHighResAssetIcon({ ticker: "USD" }) },
        to: { label: "USDT", logo: getHighResAssetIcon({ ticker: "USDT" }) },
      };
    }
    if (sub === "sell") {
      return {
        from: { label: "USDT", logo: getHighResAssetIcon({ ticker: "USDT" }) },
        to: { label: "USD", logo: getHighResAssetIcon({ ticker: "USD" }) },
      };
    }
  }

  const fromSymbol = tx?.currency || paymentInfo?.assetSymbol || "USDT";
  const fromLogo = tx?.asset_image || getHighResAssetIcon({ ticker: fromSymbol });

  const toLabel =
    paymentInfo?.providerName ||
    paymentInfo?.methodLabel ||
    tx?.payment_provider_display ||
    tx?.payment_provider ||
    tx?.payment_method_display ||
    tx?.payment_method ||
    "Bank / Wallet";

  // Keep logo visible even when provider logo is missing.
  const toLogo = paymentInfo?.displayImage || fromLogo;

  return {
    from: { label: fromSymbol, logo: fromLogo },
    to: { label: toLabel, logo: toLogo },
  };
};

const swapToFallbackImage = (
  e: React.SyntheticEvent<HTMLImageElement>,
  fallbackSrc?: string | null
) => {
  const img = e.currentTarget;
  const fallback = String(fallbackSrc || "").trim();
  if (fallback && img.src !== fallback) {
    img.src = fallback;
    return;
  }
  img.style.display = "none";
};

const ExchangeTransactions = ({ itemsPerPage = 10 }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useDashboardI18n();
  const { transactions, loading, error } = useSelector(
    (state: RootState) => state.p2pTransactions
  );
  const [currentPage, setCurrentPage] = useState(1);
  // const itemsPerPage = 10;
  const containerRef = React.useRef<HTMLDivElement>(null);

  /* -------------------------- fetch data ----------------------------- */
  useEffect(() => {
    // Load all transactions immediately
    dispatch(loadAllP2PTransactions());
  }, [dispatch]);

  // Debug: print exchange tab data as JSON when this tab is opened/rendered.
  useEffect(() => {
    if (!transactions?.results) return;
    try {
      console.log(
        "[Dashboard Exchange Tab] transactions JSON:",
        JSON.stringify(transactions.results, null, 2)
      );
    } catch {
      console.log("[Dashboard Exchange Tab] transactions:", transactions.results);
    }
  }, [transactions?.results]);

  /* --------------------------- loading / error ----------------------- */
  if (loading) {
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
  if (
    !transactions ||
    !transactions.results ||
    transactions.results.length === 0
  ) {
    return (
      <NoDataFound
        title={t(
          "transactions.noTransactions",
          "No Exchange Transactions Found"
        )}
        message={t(
          "transactions.noTransactions",
          "There are currently no exchange transactions to display. Please check back later or try adjusting your filters."
        )}
      />
    );
  }

  // Show all transactions without filtering by user, sorted by created_at (newest first)
  // Ensure transactions.results is an array before spreading
  const resultsArray = Array.isArray(transactions.results) ? transactions.results : [];
  const allResults = [...resultsArray].sort((a: any, b: any) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA; // Sort in descending order (newest first)
  });
  const totalPages = Math.ceil(allResults.length / itemsPerPage);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const filteredResults = allResults.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentPage(pageNumber);
    // Scroll to the top of the container
    if (containerRef.current) {
      // Calculate offset to account for fixed headers if any (approx 100px)
      const yOffset = -100;
      const element = containerRef.current;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        {/* Show count info */}
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center px-2">
          {t("transactions.showing", "Showing")} {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, allResults.length)} {t("transactions.of", "of")} {allResults.length} {t("transactions.transactions", "transactions")}
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
          <button
            onClick={(e) => handlePageChange(currentPage - 1, e)}
            disabled={currentPage === 1}
            className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-md border transition-colors duration-150 text-xs sm:text-sm min-h-[44px] sm:min-h-0 lg:min-h-0
              ${currentPage > 1
                ? "bg-transparent text-gray-600 dark:text-gray-400 border-[#d1d5db] dark:border-accent hover:bg-[#1D8751] hover:text-white"
                : "bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed border-transparent"
              }`}
          >
            {t("common.previous", "Previous")}
          </button>

          {startPage > 1 && <span className="text-gray-500 text-xs sm:text-sm">…</span>}
          {pageNumbers.map((pageNum) => (
            <button
              key={pageNum}
              onClick={(e) => handlePageChange(pageNum, e)}
              className={`mx-0.5 sm:mx-1 px-2 sm:px-3 py-1.5 sm:py-1 rounded-md border transition-colors duration-150 text-xs sm:text-sm min-h-[44px] sm:min-h-0 lg:min-h-0
                ${pageNum === currentPage
                  ? "bg-[#1D8751] text-white border-[#1D8751]"
                  : "bg-transparent text-gray-600 dark:text-gray-400 border-[#d1d5db] dark:border-accent hover:bg-[#1D8751] hover:text-white"
                }`}
            >
              {pageNum}
            </button>
          ))}
          {endPage < totalPages && <span className="text-gray-500 text-xs sm:text-sm">…</span>}

          <button
            onClick={(e) => handlePageChange(currentPage + 1, e)}
            disabled={currentPage === totalPages}
            className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-md border transition-colors duration-150 text-xs sm:text-sm min-h-[44px] sm:min-h-0 lg:min-h-0
              ${currentPage < totalPages
                ? "bg-transparent text-gray-600 dark:text-gray-400 border-[#d1d5db] dark:border-accent hover:bg-[#1D8751] hover:text-white"
                : "bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed border-transparent"
              }`}
          >
            {t("common.next", "Next")}
          </button>
        </div>
      </div>
    );
  };

  /* ------------------------------ table ------------------------------ */
  return (
    <div className="w-full" ref={containerRef}>
      {/* Mobile Card Layout */}
      <div className="block sm:hidden space-y-3">
        {filteredResults.map((tx: any, index: number) => {
          const transactionType = normalizeSubType(tx.transaction_type || tx.sub_type || "");
          const paymentInfo = extractPaymentInfo(tx);
          const fromTo = getFromToDisplay(tx, paymentInfo);

          return (
            <div
              key={tx.transaction_id || `tx-${index}`}
              className="bg-transparent border border-[#E8EFF5] dark:border-accent rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={tx?.asset_image || getHighResAssetIcon({ ticker: tx.currency })}
                    alt={tx.currency || "Asset"}
                    className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0"
                    onError={(e) => {
                      swapToFallbackImage(
                        e,
                        getHighResAssetIcon({ ticker: tx.currency || "USDT" })
                      );
                    }}
                  />
                  <div>
                    <div className="font-semibold text-sm uppercase tracking-wide text-gray-900 dark:text-white">
                      {tx.currency || "USDT"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {getAssetName(tx.currency || "USDT")}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${tx.status === "completed"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : tx.status === "pending" || tx.status === "pending_address" || tx.status === "pending_approval"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : tx.status === "rejected" || tx.status === "error"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : tx.status === "waiting" || tx.status === "awaiting_payment"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                    }`}
                >
                  {tx.status?.replace(/_/g, " ").toUpperCase() || "N/A"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">From</div>
                  <div className="flex items-center gap-2">
                    <img
                      src={fromTo.from.logo}
                      alt={fromTo.from.label || "Asset"}
                    className="w-6 h-6 rounded-full object-cover"
                      onError={(e) => {
                        swapToFallbackImage(
                          e,
                          getHighResAssetIcon({ ticker: tx.currency || "USDT" })
                        );
                      }}
                    />
                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                      {fromTo.from.label}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">To</div>
                  <div className="flex items-center gap-2">
                    <img
                      src={fromTo.to.logo}
                      alt={fromTo.to.label || "Payment"}
                    className="w-6 h-6 rounded-full object-cover"
                      onError={(e) => {
                        swapToFallbackImage(
                          e,
                          tx?.asset_image || getHighResAssetIcon({ ticker: tx.currency || "USDT" })
                        );
                      }}
                    />
                    <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {fromTo.to.label}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">Amount</div>
                  <div
                    className={`font-semibold text-sm sm:text-base ${transactionType === "deposit"
                      ? "text-[#1D8751]"
                      : "text-red-500 dark:text-red-400"
                      }`}
                  >
                    {formatAmount(tx.amount || tx.requested_amount || tx.total_amount_due)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">
                    Payment
                  </div>
                  <div className="flex items-center gap-3">
                    {paymentInfo.displayImage && (
                      <img
                        src={paymentInfo.displayImage}
                        alt={paymentInfo.providerName || "Payment method"}
                        className="w-8 h-8 rounded-full border border-[#E8EFF5] dark:border-accent bg-white dark:bg-[#1D1D23]"
                        onError={(e) => {
                          swapToFallbackImage(
                            e,
                            tx?.asset_image || getHighResAssetIcon({ ticker: tx.currency || "USDT" })
                          );
                        }}
                      />
                    )}
                    <div className="flex flex-col min-w-0">
                      <div className="font-medium text-sm dark:text-white text-gray-900">
                        {paymentInfo.methodLabel ||
                          t("transactions.notAvailable", "N/A")}
                      </div>
                      {paymentInfo.providerName && (
                        <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mt-0.5">
                          {paymentInfo.providerName}
                        </div>
                      )}
                    </div>
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
        })}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-[#d1d5db] dark:divide-accent">
          <thead className="bg-transparent">
            <tr className="border-b border-gray-200 dark:border-accent">
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

          <tbody className="divide-y divide-[#d1d5db] dark:divide-accent">
            {filteredResults.map((tx: any, index: number) => {
              const transactionType = normalizeSubType(tx.transaction_type || tx.sub_type || "");
              const paymentInfo = extractPaymentInfo(tx);
              const fromTo = getFromToDisplay(tx, paymentInfo);

              return (
                <tr
                  key={tx.transaction_id || `tx-${index}`}
                  className="hover:bg-gray-100 dark:hover:bg-[#23232A] transition-colors"
                >
                  {/* Asset */}
                  <td className="px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-accent">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <img
                        src={tx?.asset_image || getHighResAssetIcon({ ticker: tx.currency })}
                        alt={tx.currency || "Asset"}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-sm shrink-0"
                        onError={(e) => {
                          swapToFallbackImage(
                            e,
                            getHighResAssetIcon({ ticker: tx.currency || "USDT" })
                          );
                        }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                          {tx.currency || "USDT"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-[#A0A3BC] truncate">
                          {getAssetName(tx.currency || "USDT")}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* From - Bank/Mobile or Asset based on transaction type */}
                  <td className="px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-accent">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={fromTo.from.logo}
                        alt={fromTo.from.label || "Asset"}
                        className="w-7 h-7 rounded-full shadow-sm shrink-0"
                        onError={(e) => {
                          swapToFallbackImage(
                            e,
                            getHighResAssetIcon({ ticker: tx.currency || "USDT" })
                          );
                        }}
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-sm text-gray-900 dark:text-white">
                            {fromTo.from.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* To - Asset or Bank based on transaction type */}
                  <td className="px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-accent">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={fromTo.to.logo}
                        alt={fromTo.to.label || "Payment method"}
                        className="w-7 h-7 rounded-full border border-[#E8EFF5] dark:border-accent bg-white dark:bg-[#1D1D23] shrink-0"
                        onError={(e) => {
                          swapToFallbackImage(
                            e,
                            tx?.asset_image || getHighResAssetIcon({ ticker: tx.currency || "USDT" })
                          );
                        }}
                      />
                      <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {fromTo.to.label}
                      </span>
                    </div>
                  </td>

                  {/* Amount */}
                  <td
                    className={`px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-accent text-sm sm:text-base font-semibold ${transactionType === "deposit"
                      ? "text-[#1D8751]"
                      : "text-red-500 dark:text-red-400"
                      }`}
                  >
                    {formatAmount(tx.amount || tx.requested_amount || tx.total_amount_due)}
                  </td>

                  {/* Status */}
                  <td className="px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-accent">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${tx.status === "completed"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : tx.status === "pending" || tx.status === "pending_address" || tx.status === "pending_approval"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : tx.status === "rejected" || tx.status === "error"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : tx.status === "waiting" || tx.status === "awaiting_payment"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                        }`}
                    >
                      {tx.status?.replace(/_/g, " ").toUpperCase() || "N/A"}
                    </span>
                  </td>

                  {/* When */}
                  <td className="px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-accent text-sm sm:text-base text-gray-500 dark:text-[#A0A3BC]">
                    {formatRecentTime(tx.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="mt-4">{renderPagination()}</div>
    </div>
  );
};

export default ExchangeTransactions;
