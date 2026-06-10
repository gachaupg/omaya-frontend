"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { formatDashboardTransactionWhen } from "@/lib/globalFormatter";
import { NoDataFound } from "../ui/Transactions";
import { useDashboardI18n } from "@/lib/useDashboardI18n";
import { SortArrowsIcon } from "@/components/ui/SortArrowsIcon";
import {
  DashboardTransactionDetailsModal,
  type DashboardTransactionDetailView,
} from "@/components/dashboard/ui/DashboardTransactionDetailsModal";
import { resolveDashboardTransactionAssetImage } from "@/features/express/utils/imageHelpers";
import {
  UsdFlagIcon,
  isUsdOrMoneyXTransaction,
} from "@/components/dashboard/ui/UsdFlagIcon";
import type {
  AllTransactionItem,
  AllTransactionsResponse,
} from "@/features/transactions/api";
import { getAllUserTransactions } from "@/features/transactions/api";
import { getMyTransactions as getMyP2PTransactions } from "@/features/p2p/api";
import { TransactionFromToCell } from "@/components/dashboard/ui/TransactionFromToCell";
import { TransactionStatusCell } from "@/components/dashboard/ui/TransactionStatusCell";
import { TransactionAmountCell } from "@/components/dashboard/ui/TransactionAmountCell";
import { useDashboardTransactionUsdValues } from "@/features/transactions/hooks/useDashboardTransactionUsdValues";
import {
  isPendingAddressDashboardStatus,
  shouldOmitExchangeWithoutDepositOrWithdrawal,
} from "@/lib/utils/dashboardTransactionFilters";
import { getExchangeAssetColumnLabels } from "@/lib/utils/exchangeCurrencyDisplay";
import {
  type FromToCellModel,
  buildExchangeFromTo,
  buildP2pWithdrawalDepositFromTo,
  buildSwapFromTo,
  formatP2pCryptoLabel,
  pickFirstAssetLogo,
  textFromToCell,
  withFromToLogos,
} from "@/lib/utils/transactionFromTo";

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

const normalizeTransactionSubType = (tx: AllTransactionItem): string =>
  String(tx.sub_type || (tx as { transaction_type?: string }).transaction_type || "")
    .trim()
    .toLowerCase();

const matchesSubTypeFilter = (
  tx: AllTransactionItem,
  includeSubTypes?: string[],
  excludeSubTypes?: string[]
): boolean => {
  const sub = normalizeTransactionSubType(tx);
  if (includeSubTypes?.length) {
    return includeSubTypes.some((s) => sub.includes(s.trim().toLowerCase()));
  }
  if (excludeSubTypes?.length) {
    return !excludeSubTypes.some((s) => sub.includes(s.trim().toLowerCase()));
  }
  return true;
};

const getTypeLabel = (type: string, subType: string) => {
  const sub = (subType || "").toLowerCase();
  if (type === "exchange") {
    return sub === "deposit" ? "Deposit" : sub === "withdrawal" ? "Withdrawal" : type;
  }
  if (type === "p2p") {
    if (sub === "buy") return "Buy";
    if (sub === "sell") return "Sell";
    if (sub === "deposit") return "Deposit";
    if (sub === "withdrawal") return "Withdrawal";
    return "P2P";
  }
  if (type === "moneyx") return "MoneyX";
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

type AllTransactionsProps = {
  /** API filter — `exchange` tab uses same feed as All with type=exchange */
  apiType?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  /** Only rows whose sub_type contains one of these values (client-side) */
  includeSubTypes?: string[];
  /** Exclude rows whose sub_type contains any of these values (client-side) */
  excludeSubTypes?: string[];
};

// Per-tab caches so switching Recent Transactions tabs shows data instantly
// (stale-while-revalidate) instead of refetching with a spinner every time.
const pageResponseCache = new Map<string, AllTransactionsResponse>();
const allPagesResultsCache = new Map<string, AllTransactionItem[]>();

const pageCacheKey = (apiType: string, page: number, pageSize: number) =>
  `${apiType}|${page}|${pageSize}`;

const getAssetColumnLabels = (tx: AllTransactionItem): { title: string; subtitle?: string } => {
  if (tx.type === "exchange") {
    return getExchangeAssetColumnLabels(tx);
  }
  const title = String(
    tx.currency || tx.asset || (tx.type === "moneyx" ? "USD" : "USDT")
  ).trim();
  const subtitle = getAssetName(title);
  return { title, subtitle: subtitle || undefined };
};

const AllTransactions = ({
  apiType = "all",
  emptyTitle,
  emptyMessage,
  includeSubTypes,
  excludeSubTypes,
}: AllTransactionsProps) => {
  const { t } = useDashboardI18n();
  const [currentPage, setCurrentPageLocal] = useState(1);
  const itemsPerPage = 10;
  const [pageData, setPageData] = useState<AllTransactionsResponse | null>(
    () => pageResponseCache.get(pageCacheKey(apiType, 1, itemsPerPage)) ?? null
  );
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [p2pAddressById, setP2pAddressById] = useState<Record<string, { from?: string | null; to?: string | null; receiver?: string | null }>>({});
  const [p2pAddressByFingerprint, setP2pAddressByFingerprint] = useState<Record<string, { from?: string | null; to?: string | null; receiver?: string | null }>>({});
  const [transactionDetail, setTransactionDetail] =
    useState<DashboardTransactionDetailView | null>(null);
  const [allPagesData, setAllPagesData] = useState<AllTransactionItem[] | null>(null);
  const [loadingAllPages, setLoadingAllPages] = useState(false);

  const needsClientPagination =
    (includeSubTypes?.length ?? 0) > 0 || (excludeSubTypes?.length ?? 0) > 0;

  const subTypeFilterKey = [
    apiType,
    ...(includeSubTypes ?? []),
    ...(excludeSubTypes ?? []),
  ].join("|");

  useEffect(() => {
    setCurrentPageLocal(1);
    setP2pAddressById({});
    setP2pAddressByFingerprint({});
  }, [subTypeFilterKey]);

  // Server-paginated tabs: show cached page instantly, refresh in background.
  useEffect(() => {
    if (needsClientPagination) return;

    const key = pageCacheKey(apiType, currentPage, itemsPerPage);
    const cached = pageResponseCache.get(key) ?? null;
    if (cached) {
      setPageData(cached);
    } else {
      setPageLoading(true);
    }
    setPageError(null);

    let cancelled = false;
    (async () => {
      try {
        const resp = await getAllUserTransactions({
          type: apiType,
          page: currentPage,
          page_size: itemsPerPage,
        });
        pageResponseCache.set(key, resp);
        if (!cancelled) setPageData(resp);
      } catch (err) {
        if (!cancelled && !cached) {
          setPageError(
            err instanceof Error ? err.message : "Failed to fetch transactions"
          );
        }
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiType, currentPage, needsClientPagination]);

  // Client-paginated tabs (sub_type filters): same stale-while-revalidate.
  useEffect(() => {
    if (!needsClientPagination) {
      setAllPagesData(null);
      return;
    }

    const cached = allPagesResultsCache.get(subTypeFilterKey) ?? null;
    if (cached) {
      setAllPagesData(cached);
    } else {
      setLoadingAllPages(true);
      setAllPagesData(null);
    }

    let cancelled = false;
    (async () => {
      try {
        const all: AllTransactionItem[] = [];
        let page = 1;
        let hasMore = true;
        while (hasMore && page <= 50) {
          const resp = await getAllUserTransactions({
            type: apiType,
            page,
            page_size: 50,
          });
          const batch = resp?.results ?? [];
          if (batch.length === 0) break;
          all.push(...batch);
          hasMore = !!resp?.next;
          page += 1;
        }
        allPagesResultsCache.set(subTypeFilterKey, all);
        if (!cancelled) {
          setAllPagesData(all);
        }
      } catch {
        if (!cancelled && !cached) {
          setAllPagesData([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingAllPages(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiType, needsClientPagination, subTypeFilterKey]);

  const handlePageChange = (pageNumber: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentPageLocal(pageNumber);
    if (containerRef.current) {
      const yOffset = -100;
      const element = containerRef.current;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const rawResults = needsClientPagination
    ? (allPagesData ?? [])
    : (pageData?.results ?? []);
  const filteredResults = [...rawResults]
    .filter((tx) => !isPendingAddressDashboardStatus(tx.status))
    .filter((tx) => !shouldOmitExchangeWithoutDepositOrWithdrawal(tx))
    .filter((tx) => matchesSubTypeFilter(tx, includeSubTypes, excludeSubTypes))
    .sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

  const totalCount = needsClientPagination
    ? filteredResults.length
    : (pageData?.count ?? 0);
  const totalPages = needsClientPagination
    ? Math.max(1, Math.ceil(filteredResults.length / itemsPerPage))
    : (pageData?.total_pages ?? 1);

  const results = needsClientPagination
    ? filteredResults.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : filteredResults;

  const transactionUsdValues = useDashboardTransactionUsdValues(results);

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

  const getFromToDisplay = useCallback(
    (tx: AllTransactionItem) => {
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
        return buildSwapFromTo(tx as unknown as Record<string, unknown>);
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
          from: {
            label: senderProvider || paymentProvider || "Sender Provider",
            iconUrl: pickFirstAssetLogo(
              (tx as { sender_provider_logo?: string }).sender_provider_logo
            ),
          },
          to: {
            label:
              receiverProvider ||
              recipientName ||
              paymentProvider ||
              "Receiver Provider",
            iconUrl: pickFirstAssetLogo(
              (tx as { receiver_provider_logo?: string }).receiver_provider_logo
            ),
          },
        };
      }
      if (tx.type === "p2p" && (tx.from_currency || tx.to_currency || (tx as any).from_asset)) {
        return buildSwapFromTo(tx as unknown as Record<string, unknown>);
      }
      const p2pSub = (tx.sub_type || "").toLowerCase();
      const p2pTxType = String((tx as any)?.transaction_type || "").toLowerCase();
      const idKey = String(tx.id || "").trim();
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
        if (enrich && !enrich.from && !enrich.to && !!enrich.receiver) return "withdrawal";
        const walletTypeInner = String((tx as any)?.wallet_type || "").toLowerCase().trim();
        if (walletTypeInner === "crypto") return "withdrawal";
        if (walletTypeInner === "p2p") return "deposit";
        if (tx.withdrawal_address) return "withdrawal";
        if (tx.deposit_address) return "deposit";
        return raw;
      };
      const p2pKind = inferP2PKind();

      if (tx.type === "p2p" && (p2pKind === "withdrawal" || p2pKind === "deposit")) {
        return buildP2pWithdrawalDepositFromTo(
          {
            ...tx,
            transaction_type: p2pKind,
          } as Record<string, unknown>,
          enrich
        );
      }
      if (tx.type === "p2p" && (p2pSub === "buy" || p2pSub === "sell")) {
        const hasPair =
          String((tx as any)?.from_asset || "").trim() ||
          String((tx as any)?.to_asset || "").trim();
        if (hasPair) {
          return buildSwapFromTo(tx as unknown as Record<string, unknown>);
        }
        const fromAsset =
          String((tx as any)?.from_asset || (p2pSub === "buy" ? "USD" : formatP2pCryptoLabel(tx))).trim() ||
          "USD";
        const toAsset =
          String((tx as any)?.to_asset || (p2pSub === "buy" ? formatP2pCryptoLabel(tx) : "USD")).trim() ||
          "USDT";
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
    },
    [p2pAddressById, p2pAddressByFingerprint]
  );

  const buildTransactionDetailView = useCallback(
    (tx: AllTransactionItem): DashboardTransactionDetailView => {
      const display = getFromToDisplay(tx);
      const { from, to } = withFromToLogos(
        tx as unknown as Record<string, unknown>,
        display.from,
        display.to
      );
      const assetLabels = getAssetColumnLabels(tx);
      return {
        tx,
        from,
        to,
        assetTitle: assetLabels.title,
        assetSubtitle: assetLabels.subtitle,
        assetImageUrl: resolveDashboardTransactionAssetImage(tx),
        typeLabel: getTypeLabel(tx.type, tx.sub_type),
      };
    },
    [getFromToDisplay]
  );

  const openTransactionDetails = useCallback(
    (tx: AllTransactionItem) => {
      setTransactionDetail(buildTransactionDetailView(tx));
    },
    [buildTransactionDetailView]
  );

  const closeTransactionDetails = useCallback(() => {
    setTransactionDetail(null);
  }, []);

  const transactionDetailsModal = (
    <DashboardTransactionDetailsModal
      open={!!transactionDetail}
      onClose={closeTransactionDetails}
      detail={transactionDetail}
    />
  );

  const isLoading =
    (!needsClientPagination && pageLoading && !pageData) ||
    (needsClientPagination && loadingAllPages && allPagesData === null);

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1D8751]" />
        </div>
        {transactionDetailsModal}
      </>
    );
  }

  if (pageError && !pageData) {
    return (
      <>
        <div className="text-red-500 text-center p-4">
          {t("common.error", "Error")}: {pageError}
        </div>
        {transactionDetailsModal}
      </>
    );
  }

  if (!results.length) {
    return (
      <>
        <NoDataFound
          title={
            emptyTitle ??
            t("transactions.noTransactions", "No Transactions Found")
          }
          message={
            emptyMessage ??
            t(
              "transactions.noTransactionsDescription",
              "There are currently no transactions to display. Please check back later."
            )
          }
        />
        {transactionDetailsModal}
      </>
    );
  }

  const renderViewDetailsButton = (
    tx: AllTransactionItem,
    extraClassName = ""
  ) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openTransactionDetails(tx);
      }}
      className={`inline-flex flex-row items-center justify-center gap-1.5 px-3 py-2 min-w-0 rounded-lg text-xs sm:text-sm font-semibold text-white bg-[#1D8751] border border-[#1D8751] hover:bg-[#17693F] active:bg-[#16663d] transition-colors whitespace-nowrap shadow-sm ${extraClassName}`}
      aria-label={t("transactions.viewDetails", "View transaction details")}
    >
      <Eye className="w-4 h-4 shrink-0" aria-hidden />
      <span>{t("transactions.viewDetails", "View details")}</span>
    </button>
  );

  const renderAssetIcon = (tx: AllTransactionItem) => {
    const label = tx.currency || tx.asset || (tx.type === "moneyx" ? "USD" : "Asset");
    if (isUsdOrMoneyXTransaction(tx, label)) {
      return <UsdFlagIcon size={32} className="w-7 h-7 sm:w-8 sm:h-8 shadow-sm" alt={label} />;
    }
    const iconSrc = resolveDashboardTransactionAssetImage(tx);
    return (
      <img
        src={iconSrc}
        alt={label}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shadow-sm flex-shrink-0"
      />
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

    const assetLabels = getAssetColumnLabels(tx);
    return (
      <tr
        key={tx.id || `tx-${index}`}
        className="hover:bg-gray-100 dark:hover:bg-[#23232A] transition-colors cursor-pointer"
        onClick={() => openTransactionDetails(tx)}
        onDoubleClick={() => openTransactionDetails(tx)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openTransactionDetails(tx);
          }
        }}
        aria-label={t("transactions.viewDetailsRow", "View transaction details")}
      >
        <td className="px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-[#35353E] align-middle">
          <div className="flex items-center gap-2 sm:gap-3">
            {renderAssetIcon(tx)}
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                {assetLabels.title}
              </span>
              {assetLabels.subtitle && (
                <span className="text-xs text-gray-500 dark:text-[#A0A3BC] truncate">
                  {assetLabels.subtitle}
                </span>
              )}
            </div>
          </div>
        </td>
        <td className="px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-[#35353E] align-middle">
          <TransactionFromToCell
            label={fromCell.label}
            subLabel={fromCell.subLabel}
            iconUrl={fromCell.iconUrl}
          />
        </td>
        <td className="px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-[#35353E] align-middle">
          <TransactionFromToCell
            label={toCell.label}
            subLabel={toCell.subLabel}
            iconUrl={toCell.iconUrl}
          />
        </td>
        <td className="px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-[#35353E] align-middle whitespace-nowrap">
          <TransactionAmountCell
            tx={tx}
            variant="asset"
            amountTone={
              isExchange ? (isDeposit ? "positive" : "negative") : "neutral"
            }
            transactionUsdValues={transactionUsdValues}
          />
        </td>
        <td className="px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-[#35353E] align-middle whitespace-nowrap">
          <TransactionAmountCell
            tx={tx}
            variant="usd"
            transactionUsdValues={transactionUsdValues}
          />
        </td>
        <td
          className="px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-[#35353E] align-middle"
          onClick={(e) => e.stopPropagation()}
        >
          <TransactionStatusCell
            status={tx.status}
            transactionId={
              (tx as any)?.referral_withdrawal_id ||
              (tx as any)?.withdrawal_id ||
              tx.id
            }
          />
        </td>
        <td className="px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-[#35353E] text-sm sm:text-base text-gray-500 dark:text-[#A0A3BC] whitespace-nowrap align-middle">
          {formatDashboardTransactionWhen(tx.created_at)}
        </td>
        <td
          className="px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-[#35353E] whitespace-nowrap align-middle"
          onClick={(e) => e.stopPropagation()}
        >
          {renderViewDetailsButton(tx)}
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

    const assetLabels = getAssetColumnLabels(tx);

    const renderMobileAssetIcon = () => {
      const label = tx.currency || tx.asset || (tx.type === "moneyx" ? "USD" : "Asset");
      if (isUsdOrMoneyXTransaction(tx, label)) {
        return <UsdFlagIcon size={40} className="w-10 h-10 shadow-sm" alt={label} />;
      }
      const iconSrc = resolveDashboardTransactionAssetImage(tx);
      return (
        <img
          src={iconSrc}
          alt={label}
          className="w-10 h-10 rounded-full object-cover shadow-sm flex-shrink-0"
        />
      );
    };

    return (
      <div
        key={tx.id || `tx-${index}`}
        className="bg-transparent border border-[#E8EFF5] dark:border-[#35353E] rounded-xl p-4 space-y-3 cursor-pointer hover:border-[#1D8751]/40 transition-colors"
        onClick={() => openTransactionDetails(tx)}
        onDoubleClick={() => openTransactionDetails(tx)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openTransactionDetails(tx);
          }
        }}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3 min-w-0">
            {renderMobileAssetIcon()}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm uppercase tracking-wide text-gray-900 dark:text-white truncate">
                {assetLabels.title}
              </div>
              {assetLabels.subtitle && (
                <div className="text-xs text-gray-500 dark:text-[#A0A3BC] truncate">
                  {assetLabels.subtitle}
                </div>
              )}
            </div>
          </div>
          <div
            className="flex flex-nowrap items-center gap-2 pt-2 border-t border-gray-200 dark:border-[#35353E] overflow-x-auto scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-[#1D8751]/10 text-[#1D8751] flex-shrink-0 whitespace-nowrap">
              {getTypeLabel(tx.type, tx.sub_type)}
            </span>
            <div className="flex-shrink-0">
              <TransactionStatusCell
                status={tx.status}
                transactionId={
                  (tx as any)?.referral_withdrawal_id ||
                  (tx as any)?.withdrawal_id ||
                  tx.id
                }
              />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-[#A0A3BC] whitespace-nowrap flex-shrink-0">
              {formatDashboardTransactionWhen(tx.created_at)}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">From</div>
            <TransactionFromToCell
              label={fromCell.label}
              subLabel={fromCell.subLabel}
              iconUrl={fromCell.iconUrl}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">To</div>
            <TransactionFromToCell
              label={toCell.label}
              subLabel={toCell.subLabel}
              iconUrl={toCell.iconUrl}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">
              {t("transactions.assetAmount", "Asset amount")}
            </div>
            <TransactionAmountCell
              tx={tx}
              variant="asset"
              amountTone={
                isExchange ? (isDeposit ? "positive" : "negative") : "neutral"
              }
              transactionUsdValues={transactionUsdValues}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">
              {t("transactions.usdValue", "USD value")}
            </div>
            <TransactionAmountCell
              tx={tx}
              variant="usd"
              transactionUsdValues={transactionUsdValues}
            />
          </div>
        </div>
        <div className="pt-2" onClick={(e) => e.stopPropagation()}>
          {renderViewDetailsButton(tx, "w-full min-w-0")}
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
                t("transactions.assetAmount", "Asset amount"),
                t("transactions.usdValue", "USD value"),
                t("transactions.status", "Status"),
                t("transactions.when", "When"),
                t("transactions.actions", "Actions"),
              ].map((h) => (
                <th
                  key={h}
                  className={`px-3 sm:px-4 lg:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-600 dark:text-[#788099] whitespace-nowrap ${
                    h === t("transactions.actions", "Actions")
                      ? "min-w-[120px]"
                      : ""
                  }`}
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

      {transactionDetailsModal}
    </div>
  );
};

export default AllTransactions;