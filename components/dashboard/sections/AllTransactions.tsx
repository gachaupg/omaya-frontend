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
import { getMyTransactions as getMyP2PTransactions } from "@/features/p2p/api";
import { TransactionFromToCell } from "@/components/dashboard/ui/TransactionFromToCell";
import { TransactionStatusCell } from "@/components/dashboard/ui/TransactionStatusCell";
import {
  isPendingAddressDashboardStatus,
  shouldOmitExchangeWithoutDepositOrWithdrawal,
} from "@/lib/utils/dashboardTransactionFilters";
import {
  type FromToCellModel,
  buildExchangeFromTo,
  buildP2pWithdrawalDepositFromTo,
  formatP2pCryptoLabel,
  textFromToCell,
  withFromToLogos,
} from "@/lib/utils/transactionFromTo";

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

const normalizeStatusForBadge = (status: unknown): string => {
  const s = String(status ?? "").trim();
  if (!s) return "n/a";
  const map: Record<string, string> = {
    otp_pending: "pending",
    pending_address: "pending",
    pending_approval: "pending approval",
    admin_approval_required: "processing",
  };
  const key = s.toLowerCase();
  return map[key] ?? key.replace(/_/g, " ");
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
    'admin_approval_required': 'Processing',
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
  const itemsPerPage = 10;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [p2pAddressById, setP2pAddressById] = useState<Record<string, { from?: string | null; to?: string | null; receiver?: string | null }>>({});
  const [p2pAddressByFingerprint, setP2pAddressByFingerprint] = useState<Record<string, { from?: string | null; to?: string | null; receiver?: string | null }>>({});

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

  const rawResults = data?.results ?? [];
  const results = [...rawResults]
    .filter((tx) => !isPendingAddressDashboardStatus(tx.status))
    .filter((tx) => !shouldOmitExchangeWithoutDepositOrWithdrawal(tx))
    .sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateB - dateA;
  });

  const buildP2PFingerprint = (input: {
    kind?: string;
    amount?: unknown;
    currency?: unknown;
    network?: unknown;
    ts?: unknown;
  }): string => {
    const kind = String(input.kind || "").toLowerCase().trim();
    const amount = String(input.amount ?? "").trim();
    const currency = String(input.currency ?? "").toUpperCase().trim();
    const network = String(input.network ?? "").toUpperCase().trim();
    const t = input.ts ? new Date(String(input.ts)) : null;
    // Minute precision to avoid tiny backend differences.
    const timeKey = t && !Number.isNaN(t.getTime()) ? t.toISOString().slice(0, 16) : "";
    return [kind, amount, currency, network, timeKey].filter(Boolean).join("|");
  };

  // Enrich "All" feed P2P deposit/withdraw rows with on-chain from/to addresses.
  // The all-transactions API often only provides deposit_address/withdrawal_address, while P2P endpoint provides from_address/to_address/receiver_wallet.
  useEffect(() => {
    const needsEnrichment = results.some((r) => r?.type === "p2p" && ["deposit", "withdrawal"].includes(String(r?.sub_type || (r as any)?.transaction_type || "").toLowerCase()));
    if (!needsEnrichment) return;
    if (Object.keys(p2pAddressById).length > 0 || Object.keys(p2pAddressByFingerprint).length > 0) return;

    let cancelled = false;
    (async () => {
      try {
        const map: Record<string, { from?: string | null; to?: string | null; receiver?: string | null }> = {};
        const fpMap: Record<string, { from?: string | null; to?: string | null; receiver?: string | null }> = {};
        // Load multiple pages so "All" can be enriched even when the matching P2P row isn't on page 1.
        let page = 1;
        let hasMore = true;
        while (hasMore && page <= 20) {
          const resp = await getMyP2PTransactions(page);
          const rows = Array.isArray(resp?.results) ? resp.results : [];
          for (const tx of rows) {
            const id = String((tx as any)?.transaction_id || (tx as any)?.id || "").trim();
            const kind = String((tx as any)?.transaction_type || (tx as any)?.type || "").toLowerCase();
            const entry = {
              from: (tx as any)?.from_address ? String((tx as any).from_address) : null,
              to: (tx as any)?.to_address ? String((tx as any).to_address) : null,
              receiver: (tx as any)?.receiver_wallet ? String((tx as any).receiver_wallet) : null,
            };
            if (id && !map[id]) {
              map[id] = entry;
            }
            const fp = buildP2PFingerprint({
              kind,
              amount: (tx as any)?.amount,
              currency: (tx as any)?.currency,
              network: (tx as any)?.network,
              ts: (tx as any)?.timestamp,
            });
            if (fp && !fpMap[fp]) {
              fpMap[fp] = entry;
            }
          }
          hasMore = !!resp?.next;
          page++;
        }
        if (!cancelled) {
          setP2pAddressById(map);
          setP2pAddressByFingerprint(fpMap);
        }
      } catch {
        // Ignore enrichment failure; UI will fall back to legacy fields.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [results, p2pAddressById, p2pAddressByFingerprint]);

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

    // P2P Withdrawal/Deposit sometimes arrive in the "all" feed without stable `type/sub_type`.
    // Use wallet_type + transaction_type as a strong hint when present.
    const walletType = (clean((tx as any)?.wallet_type) || "").toLowerCase();
    const txTypeHint = (clean((tx as any)?.transaction_type) || "").toLowerCase();
    if (
      (walletType === "crypto" && txTypeHint.includes("withdraw")) ||
      (walletType === "p2p" && txTypeHint.includes("deposit"))
    ) {
      return buildP2pWithdrawalDepositFromTo({
        ...tx,
        transaction_type: txTypeHint || tx.sub_type,
      } as Record<string, unknown>);
    }

    if (tx.type === "swap") {
      return {
        from: textFromToCell(
          `${tx.from_currency || tx.currency} (${tx.from_network || tx.network || "-"})`
        ),
        to: textFromToCell(
          `${tx.to_currency || "-"} (${tx.to_network || "-"})`
        ),
      };
    }
    if (tx.type === "exchange") {
      return buildExchangeFromTo(tx as unknown as Record<string, unknown>);
    }
    if ((tx as any)?.type === "forex") {
      const fromCurrency = clean((tx as any)?.from_currency);
      const toCurrency = clean((tx as any)?.to_currency);
      return {
        from: textFromToCell(fromCurrency || fallbackAsset),
        to: textFromToCell(
          paymentProvider || receiverProvider || recipientName || toCurrency || "Bank / Wallet"
        ),
      };
    }
    if (tx.type === "moneyx") {
      return {
        from: textFromToCell(senderProvider || paymentProvider || "Sender Provider"),
        to: textFromToCell(
          receiverProvider || recipientName || paymentProvider || "Receiver Provider"
        ),
      };
    }
    if (tx.type === "p2p" && (tx.from_currency || tx.to_currency)) {
      return {
        from: textFromToCell(
          `${tx.from_currency || tx.currency} (${tx.from_network || tx.network || "-"})`
        ),
        to: textFromToCell(
          `${tx.to_currency || "-"} (${tx.to_network || "-"})`
        ),
      };
    }
    const p2pSub = (tx.sub_type || "").toLowerCase();
    const p2pTxType = String((tx as any)?.transaction_type || "").toLowerCase();
    const idKey = String(tx.id || "").trim();
    // Fingerprint uses raw subtype/transaction_type when present (more stable than inferred kind).
    const fpKey = buildP2PFingerprint({
      kind: p2pSub || p2pTxType,
      amount: (tx as any)?.amount,
      currency: (tx as any)?.currency || (tx as any)?.asset,
      network: (tx as any)?.network,
      ts: (tx as any)?.created_at,
    });
    const enrich =
      (idKey ? p2pAddressById[idKey] : null) ||
      (fpKey ? p2pAddressByFingerprint[fpKey] : null) ||
      null;

    const inferP2PKind = (): string => {
      const raw = (p2pSub || p2pTxType || "").trim();
      if (raw.includes("withdraw")) return "withdrawal";
      if (raw.includes("deposit")) return "deposit";
      if (raw.includes("buy")) return "buy";
      if (raw.includes("sell")) return "sell";
      // If enrichment exists but has only receiver_wallet (no from/to), it's a withdrawal payload.
      if (enrich && !enrich.from && !enrich.to && !!enrich.receiver) return "withdrawal";
      // Some "all" feed rows include wallet_type but not sub_type.
      const walletType = String((tx as any)?.wallet_type || "").toLowerCase().trim();
      if (walletType === "crypto") return "withdrawal";
      if (walletType === "p2p") return "deposit";
      // Heuristic: legacy "all" feed often only sets address fields
      if (tx.withdrawal_address) return "withdrawal";
      if (tx.deposit_address) return "deposit";
      return raw;
    };
    const p2pKind = inferP2PKind(); // "deposit"/"withdrawal"/"buy"/"sell"

    if (tx.type === "p2p" && (p2pKind === "withdrawal" || p2pKind === "deposit")) {
      return buildP2pWithdrawalDepositFromTo(
        {
          ...tx,
          transaction_type: p2pKind,
        } as Record<string, unknown>,
        enrich
      );
    }
    if (tx.type === "p2p" && p2pSub === "buy") {
      const fromAsset = String((tx as any)?.from_asset || "USD").trim() || "USD";
      const toAsset =
        String((tx as any)?.to_asset || formatP2pCryptoLabel(tx) || "USDT").trim() || "USDT";
      return { from: textFromToCell(fromAsset), to: textFromToCell(toAsset) };
    }
    if (tx.type === "p2p" && p2pSub === "sell") {
      const fromAsset =
        String((tx as any)?.from_asset || formatP2pCryptoLabel(tx) || "USDT").trim() || "USDT";
      const toAsset = String((tx as any)?.to_asset || "USD").trim() || "USD";
      return { from: textFromToCell(fromAsset), to: textFromToCell(toAsset) };
    }
    if (tx.type === "p2p") {
      const cryptoLabel = formatP2pCryptoLabel(tx);
      return {
        from: textFromToCell("P2P"),
        to: textFromToCell(`${cryptoLabel} · Wallet`),
      };
    }
    return {
      from: textFromToCell(senderProvider || paymentProvider || fallbackAsset),
      to: textFromToCell(
        receiverProvider || recipientName || paymentProvider || "Bank / Wallet"
      ),
    };
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
    const display = getFromToDisplay(tx);
    const { from: fromCell, to: toCell } = withFromToLogos(
      tx as unknown as Record<string, unknown>,
      display.from,
      display.to
    );

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
          <TransactionFromToCell
            label={fromCell.label}
            copyValue={fromCell.copyValue}
            iconUrl={fromCell.iconUrl}
          />
        </td>
        <td className="px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-[#35353E]">
          <TransactionFromToCell
            label={toCell.label}
            copyValue={toCell.copyValue}
            iconUrl={toCell.iconUrl}
          />
        </td>
        <td
          className={`px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-[#35353E] text-sm sm:text-base font-semibold ${isExchange && isDeposit ? "text-[#1D8751]" : "text-red-500 dark:text-red-400"
            }`}
        >
          {formatAmount(tx.amount)}
        </td>
        <td className="px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-[#35353E]">
          <TransactionStatusCell
            status={tx.status}
            transactionId={
              (tx as any)?.referral_withdrawal_id ||
              (tx as any)?.withdrawal_id ||
              tx.id
            }
          />
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
    const display = getFromToDisplay(tx);
    const { from: fromCell, to: toCell } = withFromToLogos(
      tx as unknown as Record<string, unknown>,
      display.from,
      display.to
    );

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
          <TransactionStatusCell
            status={tx.status}
            transactionId={
              (tx as any)?.referral_withdrawal_id ||
              (tx as any)?.withdrawal_id ||
              tx.id
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">From</div>
            <TransactionFromToCell
              label={fromCell.label}
              copyValue={fromCell.copyValue}
              iconUrl={fromCell.iconUrl}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">To</div>
            <TransactionFromToCell
              label={toCell.label}
              copyValue={toCell.copyValue}
              iconUrl={toCell.iconUrl}
            />
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