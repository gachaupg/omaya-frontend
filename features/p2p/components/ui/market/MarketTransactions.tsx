import React, { useState, useEffect, useMemo, memo, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Input from "../../Common/Input";
import Button from "../../Common/Button";
import { FaFilter, FaSyncAlt } from "react-icons/fa";
import Image from "next/image";
import { tokens } from "@/styles/tokens";
import MarketTable from "./Table";
import { MarketRow } from "./types";
import {
  fetchAllP2PBuyandSell,
  setCurrentPage,
} from "@/features/p2p/slices/orderSlice";
import { RootState } from "@/store/rootReducer";
import { store } from "@/store";
import { useP2POrdersWebSocket } from "@/features/p2p/hooks/useP2POrdersWebSocket";
import { selectAllP2POrders } from "@/features/p2p/selectors";
import { P2PMarketTableSkeleton } from "@/components/ui/Skeletons";

import { logger } from "@/lib/utils/logger";
import {
  formatDurationForDisplay,
  formatMarketTimeLimit,
} from "@/features/p2p/components/Common/utils";

interface Option {
  label: string;
  value: string;
}

const formatCurrencyLabel = (currency?: string | null) => {
  if (!currency) return "USDT";
  return currency.toUpperCase();
};

const getCurrencyOptions = (orders: any): Option[] => {
  // USDT (asset) + range currencies (KES, USD) for filtering
  const options: Option[] = [
    { label: "ALL", value: "ALL" },
    { label: "USD", value: "USD" },

    { label: "KES", value: "KES" },
  ];
  return options;
};

type MarketOrdersBundle = {
  buy_orders?: { results?: unknown[] };
  sell_orders?: { results?: unknown[] };
} | null | undefined;

/** Same order list as the market table for the active Buy / Sell tab. */
const collectMarketOrderResultsForTab = (
  orders: MarketOrdersBundle,
  activeTab: string
): any[] => {
  if (!orders) return [];
  if (activeTab === "buy") {
    return Array.isArray(orders.sell_orders?.results)
      ? orders.sell_orders.results
      : [];
  }
  if (activeTab === "sell") {
    return Array.isArray(orders.buy_orders?.results)
      ? orders.buy_orders.results
      : [];
  }
  const buy = Array.isArray(orders.buy_orders?.results)
    ? orders.buy_orders.results
    : [];
  const sell = Array.isArray(orders.sell_orders?.results)
    ? orders.sell_orders.results
    : [];
  return [...buy, ...sell];
};

const getMarketSideFilterCopy = (activeTab: string) => {
  if (activeTab === "buy") {
    return {
      providerAll: "All providers (Buy)",
      paymentAll: "All payment methods (Buy)",
      providerPlaceholder: "Provider (Buy)",
      paymentPlaceholder: "Payment method (Buy)",
    };
  }
  if (activeTab === "sell") {
    return {
      providerAll: "All providers (Sell)",
      paymentAll: "All payment methods (Sell)",
      providerPlaceholder: "Provider (Sell)",
      paymentPlaceholder: "Payment method (Sell)",
    };
  }
  return {
    providerAll: "All Banks/Providers",
    paymentAll: "All Payment Methods",
    providerPlaceholder: "Select Provider",
    paymentPlaceholder: "Payment Method",
  };
};

const normalizeMarketFilterKey = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const getProviderNameFromDetail = (detail: {
  provider?: string;
  payment_provider_name?: string;
  provider_name?: string;
}): string | null => {
  const name = String(
    detail?.provider ||
      detail?.payment_provider_name ||
      detail?.provider_name ||
      ""
  ).trim();
  return name || null;
};

const formatPaymentMethodLabel = (method: string): string =>
  method
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/** Providers on ads visible for the current Buy / Sell tab only. */
const getProviderOptions = (orders: any, activeTab: string): Option[] => {
  const copy = getMarketSideFilterCopy(activeTab);
  const byKey = new Map<string, string>();

  for (const order of collectMarketOrderResultsForTab(orders, activeTab)) {
    const details = Array.isArray(order?.payment_details)
      ? order.payment_details
      : [];
    for (const detail of details) {
      const name = getProviderNameFromDetail(detail);
      if (!name) continue;
      const key = normalizeMarketFilterKey(name);
      if (!byKey.has(key)) {
        byKey.set(key, name);
      }
    }
  }

  const fromOrders = Array.from(byKey.entries())
    .sort((a, b) => a[1].localeCompare(b[1], undefined, { sensitivity: "base" }))
    .map(([value, label]) => ({ label, value }));

  return [{ label: copy.providerAll, value: "" }, ...fromOrders];
};

/** Payment methods on ads visible for the current Buy / Sell tab only. */
const getPaymentMethodOptions = (orders: any, activeTab: string): Option[] => {
  const copy = getMarketSideFilterCopy(activeTab);
  const byKey = new Map<string, string>();

  for (const order of collectMarketOrderResultsForTab(orders, activeTab)) {
    const details = Array.isArray(order?.payment_details)
      ? order.payment_details
      : [];
    for (const detail of details) {
      const method = String(detail?.payment_method ?? "").trim();
      if (!method) continue;
      const key = normalizeMarketFilterKey(method);
      if (!byKey.has(key)) {
        byKey.set(key, formatPaymentMethodLabel(method));
      }
    }
  }

  const fromOrders = Array.from(byKey.entries())
    .sort((a, b) => a[1].localeCompare(b[1], undefined, { sensitivity: "base" }))
    .map(([value, label]) => ({ label, value }));

  return [{ label: copy.paymentAll, value: "" }, ...fromOrders];
};

const detailMatchesProviderFilter = (
  detail: { provider?: string; payment_provider_name?: string; provider_name?: string },
  selectedKey: string
): boolean => {
  const name = getProviderNameFromDetail(detail);
  if (!name) return false;
  return normalizeMarketFilterKey(name) === selectedKey;
};

const detailMatchesPaymentMethodFilter = (
  detail: { payment_method?: string },
  selectedKey: string
): boolean => {
  const method = String(detail?.payment_method ?? "").trim();
  if (!method) return false;
  return normalizeMarketFilterKey(method) === selectedKey;
};

const formatSelectionSummary = (
  selected: string[],
  options: Option[],
  fallbackLabel: string
) => {
  if (!selected.length) return fallbackLabel;
  const labels = options
    .filter((opt) => selected.includes(opt.value))
    .map((opt) => opt.label);
  if (labels.length <= 2) return labels.join(", ");
  return `${labels.length} selected`;
};

const MarketTransactions = memo(({ activeTab }: { activeTab: string }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Use memoized selector for better performance
  const { buy_orders, sell_orders, totalBuyCount, totalSellCount } =
    useSelector(selectAllP2POrders);
  const { loading, error, currentPage } = useSelector(
    (state: RootState) => state.p2pMarket || {}
  );
  const orders = { buy_orders, sell_orders };



  const hasInitializedRef = useRef(false);
  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("ALL");
  const [paymentTypes, setPaymentTypes] = useState<string[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const paymentDropdownRef = useRef<HTMLDivElement>(null);
  const providerDropdownRef = useRef<HTMLDivElement>(null);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const [showMerchantOnly, setShowMerchantOnly] = useState(false);
  const [showMerchantBusinessOnly, setShowMerchantBusinessOnly] = useState(false);
  const [minOrderLimit, setMinOrderLimit] = useState("");
  const [maxOrderLimit, setMaxOrderLimit] = useState("");

  // Use only REST API (all-orders endpoint) - no WebSocket to prevent overwriting data
  const { isConnected: wsConnected, connectionError: wsError } =
    useP2POrdersWebSocket({
      enabled: false, // Disabled - market data comes from REST API only
      fallbackToPolling: false,
      pollingInterval: 30000,
    });



  useEffect(() => {
    // Always fetch on mount when authenticated - ensures all data displays correctly by default
    if (!hasInitializedRef.current && isAuthenticated) {
      hasInitializedRef.current = true;
      const currentPageInState = store.getState()?.p2pMarket?.currentPage || 1;
      dispatch(fetchAllP2PBuyandSell(currentPageInState) as any);
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const refetchMarketData = () => {
      // Skip background tabs; refetch when user returns to this tab.
      if (typeof document !== "undefined" && document.hidden) return;
      dispatch(fetchAllP2PBuyandSell(currentPage) as any);
    };

    const intervalId = window.setInterval(refetchMarketData, 10000);
    return () => window.clearInterval(intervalId);
  }, [dispatch, isAuthenticated, currentPage]);


  const filterCopy = useMemo(
    () => getMarketSideFilterCopy(activeTab),
    [activeTab]
  );

  const providerOptions = useMemo(
    () => getProviderOptions(orders, activeTab),
    [orders, activeTab]
  );
  const paymentMethodOptions = useMemo(
    () => getPaymentMethodOptions(orders, activeTab),
    [orders, activeTab]
  );

  useEffect(() => {
    setProviders([]);
    setPaymentTypes([]);
  }, [activeTab]);

  useEffect(() => {
    const validProviders = new Set(
      providerOptions.map((o) => o.value).filter(Boolean)
    );
    setProviders((prev) => {
      const next = prev.filter((p) => validProviders.has(p));
      if (next.length === prev.length && next.every((p, i) => p === prev[i])) {
        return prev;
      }
      return next;
    });
  }, [providerOptions]);

  useEffect(() => {
    const validMethods = new Set(
      paymentMethodOptions.map((o) => o.value).filter(Boolean)
    );
    setPaymentTypes((prev) => {
      const next = prev.filter((m) => validMethods.has(m));
      if (next.length === prev.length && next.every((m, i) => m === prev[i])) {
        return prev;
      }
      return next;
    });
  }, [paymentMethodOptions]);
  const currencyOptions = useMemo(() => getCurrencyOptions(orders), [orders]);
  const paymentSummary = useMemo(
    () =>
      formatSelectionSummary(
        paymentTypes,
        paymentMethodOptions,
        filterCopy.paymentPlaceholder
      ),
    [paymentTypes, paymentMethodOptions, filterCopy.paymentPlaceholder]
  );
  const providerSummary = useMemo(
    () =>
      formatSelectionSummary(
        providers,
        providerOptions,
        filterCopy.providerPlaceholder
      ),
    [providers, providerOptions, filterCopy.providerPlaceholder]
  );
  const isPaymentSummaryDefault = paymentTypes.length === 0;
  const isProviderSummaryDefault = providers.length === 0;
  useEffect(() => {
    if (
      currencyOptions.length > 0 &&
      !currencyOptions.some((opt) => opt.value === selectedCurrency)
    ) {
      setSelectedCurrency(currencyOptions[0].value);
    }
  }, [currencyOptions, selectedCurrency]);

  // Reset to page 1 and refetch when filters change so currency-filtered data shows correctly
  const prevFiltersRef = useRef<string>("");
  useEffect(() => {
    const key = `${selectedCurrency}|${providers.join(",")}|${paymentTypes.join(",")}`;
    if (prevFiltersRef.current && prevFiltersRef.current !== key) {
      dispatch(setCurrentPage(1));
      dispatch(fetchAllP2PBuyandSell(1) as any);
    }
    prevFiltersRef.current = key;
  }, [selectedCurrency, providers, paymentTypes, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isPaymentDropdownOpen &&
        paymentDropdownRef.current &&
        !paymentDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPaymentDropdownOpen(false);
      }
      if (
        isProviderDropdownOpen &&
        providerDropdownRef.current &&
        !providerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProviderDropdownOpen(false);
      }
      if (
        isCurrencyDropdownOpen &&
        currencyDropdownRef.current &&
        !currencyDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyDropdownOpen(false);
      }
      if (
        isFilterDropdownOpen &&
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFilterDropdownOpen(false);
      }
    };

    if (
      isPaymentDropdownOpen ||
      isProviderDropdownOpen ||
      isCurrencyDropdownOpen ||
      isFilterDropdownOpen
    ) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPaymentDropdownOpen, isProviderDropdownOpen, isCurrencyDropdownOpen, isFilterDropdownOpen]);



  const getActiveOrders = useMemo(() => {
    if (!orders) {

      return [];
    }

    // When user is on "buy" tab (wants to buy), show sell orders (people selling)
    // When user is on "sell" tab (wants to sell), show buy orders (people buying)
    let activeOrdersList = [];

    if (activeTab === "buy") {
      // User wants to buy, so show sell orders
      activeOrdersList = orders.sell_orders?.results || [];

    } else if (activeTab === "sell") {
      // User wants to sell, so show buy orders
      activeOrdersList = orders.buy_orders?.results || [];

    } else {
      // Default: combine both
      activeOrdersList = [
        ...(orders.buy_orders?.results || []),
        ...(orders.sell_orders?.results || []),
      ];

    }

    // REMOVED FILTER - Show all orders regardless of status
    // No filtering applied - display all orders from the API response

    return activeOrdersList;
  }, [orders, activeTab, buy_orders, sell_orders, currentPage]); // Add currentPage to dependencies

  const transformedData: MarketRow[] = useMemo(() => {


    if (!getActiveOrders || getActiveOrders.length === 0) {
      return [];
    }

    const minLimitValue = parseFloat(minOrderLimit);
    const maxLimitValue = parseFloat(maxOrderLimit);

    const data = getActiveOrders
      .map((order: any, index: number) => {
        // Debug: Log the first order to understand the structure
        if (index === 0) {

        }

        const firstName = order.advertiser_first_name || "";
        const lastName = order.advertiser_last_name || "";
        const initials = `${firstName.charAt(0)}${lastName.charAt(
          0
        )}`.toUpperCase();
        const fullName = `${firstName} ${lastName}`.toLowerCase();

        // Ensure payment_details are properly preserved with all properties
        const paymentDetails = order.payment_details ? order.payment_details.map((pd: any) => ({
          id: pd.id,
          provider: pd.provider,
          payment_method: pd.payment_method,
          account_name: pd.account_name,
          account_number: pd.account_number,
          provider_logo: pd.provider_logo || null, // Explicitly preserve, even if null
        })) : [];

        // Use raw amounts - currency is a filter, not a conversion
        const availableAmount = parseFloat(order.available_amount || 0);
        const minAmount = parseFloat(order.min_order_amount || 0);
        const maxAmount = parseFloat(order.max_order_amount || 0);
        const orderCurrency = order.currency || "USDT";
        const rangeCurrency = order.range_currency || null;
        // Limit uses range_currency: KES → KES, USD/USDT/null → USD
        const limitSuffix = rangeCurrency?.toUpperCase() === "KES" ? "KES" : "USD";
        const commissionSuffix = limitSuffix;

        return {
          id: order.id,
          advertiser: `${firstName} ${lastName}`,
          advertiserInitials: initials,
          orders:
            order.user_total_buy_orders || order.user_total_sell_orders || 0,
          advertiser_photo: order.advertiser_photo || "",
          completion: `${(order.completion_rate || 0) * 100}%`,
          exchange_rate: `${(parseFloat(order.exchange_rate || 0) * 100).toFixed(0)}`,
          completion_time: formatDurationForDisplay(
            order.completion_time || "00:00:00"
          ),
          // Advertiser online flag from API; fall back for older payloads that only sent order.status
          online:
            typeof order.advertiser_online === "boolean"
              ? order.advertiser_online
              : order.status !== "offline",
          commission: `${order.commission_rate || 0} ${commissionSuffix}`,
          available: `${availableAmount.toFixed(2)} ${orderCurrency}`,
          availableAmount,
          limit: `${minAmount.toFixed(2)} - ${maxAmount.toFixed(2)} ${limitSuffix}`,
          payment:
            order.payment_details?.map((detail: any) => detail.provider) || [],
          paymentType:
            order.payment_details?.map(
              (detail: any) => detail.payment_method
            ) || [],
          // Merchant ads should be driven by the backend verified flag when available.
          // Fallback to older field names to avoid breaking if API response differs.
          isMerchant: Boolean(
            (order as any)?.is_verified_merchant ??
              (order as any)?.is_merchant ??
              (order as any)?.verified_merchant
          ),
          isMerchantBusiness: Boolean(order.is_merchant_business),
          minAmount,
          maxAmount,
          currency: orderCurrency,
          range_currency: rangeCurrency,
          timeLimit: formatMarketTimeLimit(order),
          avgRealiseTime: formatDurationForDisplay(
            order.completion_time || "00:02:00"
          ),
          terms_and_conditions: order.terms_and_conditions || "",
          autoReply: order.auto_reply,
          payment_details: paymentDetails,
        };
      })
      .filter((row: MarketRow) => {
        // Currency filter: ALL = show all, USDT = asset, KES/USD = range_currency
        if (selectedCurrency) {
          const sel = selectedCurrency.toUpperCase();
          if (sel === "ALL") {
            // Show all orders, no currency filter
          } else if (sel === "USDT") {
            if ((row.currency || "").toUpperCase() !== "USDT") return false;
          } else if (sel === "KES") {
            if ((row.range_currency || "").toUpperCase() !== "KES") return false;
          } else if (sel === "USD") {
            const rc = (row.range_currency || "").toUpperCase();
            if (rc === "KES") return false; // exclude KES, show USD/null
          }
        }

        if (showMerchantOnly && !row.isMerchant) {
          return false;
        }

        if (showMerchantBusinessOnly && !row.isMerchantBusiness) {
          return false;
        }

        if (!isNaN(minLimitValue) && row.minAmount < minLimitValue) {
          return false;
        }

        if (!isNaN(maxLimitValue) && row.maxAmount > maxLimitValue) {
          return false;
        }

        if (paymentTypes.length > 0) {
          const hasPaymentMethod = row.payment_details?.some((detail: any) =>
            paymentTypes.some((method) =>
              detailMatchesPaymentMethodFilter(detail, method)
            )
          );
          if (!hasPaymentMethod) return false;
        }

        if (providers.length > 0) {
          const hasProvider = row.payment_details?.some((detail: any) =>
            providers.some((selectedProvider) =>
              detailMatchesProviderFilter(detail, selectedProvider)
            )
          );
          if (!hasProvider) return false;
        }

        if (amount) {
          const amountValue = parseFloat(amount);
          if (amountValue < row.minAmount || amountValue > row.maxAmount)
            return false;
        }
        return true;
      });


    return data;
  }, [
    getActiveOrders,
    selectedCurrency,
    providers,
    paymentTypes,
    amount,
    showMerchantOnly,
    showMerchantBusinessOnly,
    minOrderLimit,
    maxOrderLimit,
    activeTab,
    buy_orders,
    sell_orders,
  ]); // Add direct Redux state dependencies to ensure re-calculation

  // Calculate total pages from the latest Redux state (p2pMarket uses p2pBuyOrders/p2pSellOrders)
  const getTotalPagesFromState = useCallback(() => {
    const market = store.getState()?.p2pMarket;
    const buyOrders = market?.p2pBuyOrders || { results: [], total_orders_count: 0 };
    const sellOrders = market?.p2pSellOrders || { results: [], total_orders_count: 0 };
    const buyCount = buyOrders.total_orders_count || 0;
    const sellCount = sellOrders.total_orders_count || 0;

    const activeCount =
      activeTab === "buy"
        ? sellCount
        : activeTab === "sell"
          ? buyCount
          : Math.max(buyCount, sellCount);

    let pages = Math.ceil(activeCount / 10);
    pages = pages > 0 ? pages : 1;

    return pages;
  }, [activeTab]);

  const handleRefresh = () => {
    // Always fetch fresh data on manual refresh, even if WebSocket is connected
    dispatch(fetchAllP2PBuyandSell(currentPage) as any);
  };

  const toggleSelection = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handlePaymentSelection = (value: string) => {
    if (value === "") {
      setPaymentTypes([]);
      return;
    }
    toggleSelection(value, setPaymentTypes);
  };

  const handleProviderSelection = (value: string) => {
    if (value === "") {
      setProviders([]);
      return;
    }
    toggleSelection(value, setProviders);
  };

  const totalPages = useMemo(() => {
    const buyCount = orders?.buy_orders?.total_orders_count || 0;
    const sellCount = orders?.sell_orders?.total_orders_count || 0;
    const activeCount =
      activeTab === "buy"
        ? sellCount
        : activeTab === "sell"
          ? buyCount
          : Math.max(buyCount, sellCount);

    let pages = Math.ceil(activeCount / 10);
    pages = pages > 0 ? pages : 1;

    // If current page has no data, cap to previous pageUSDT
    if (currentPage > 1 && getActiveOrders.length === 0) {
      pages = Math.min(pages, currentPage - 1);
      if (pages < 1) pages = 1;
    }

    return pages;
  }, [orders, activeTab, currentPage, getActiveOrders.length]);

  // Hide empty pages: if current page has no data, cap total pages to previous page
  const effectiveTotalPages = useMemo(() => {
    if (currentPage > 1 && getActiveOrders.length === 0) {
      const capped = Math.max(1, Math.min(totalPages, currentPage - 1));
      return capped;
    }
    return totalPages;
  }, [currentPage, getActiveOrders.length, totalPages]);

  const handlePageChange = useCallback((newPage: number) => {
    // Get current page from Redux state directly (most up-to-date)
    const currentPageInState = store.getState()?.p2pMarket?.currentPage || 1;
    const maxPages = Math.max(1, Math.min(getTotalPagesFromState(), effectiveTotalPages));

    if (newPage > maxPages || newPage < 1) return;
    if (newPage === currentPageInState) return;

    dispatch(setCurrentPage(newPage));
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      if (store.getState()?.p2pMarket?.currentPage === newPage) {
        dispatch(fetchAllP2PBuyandSell(newPage) as any);
      }
    }, 10);
  }, [dispatch, getTotalPagesFromState, effectiveTotalPages]);

  // If user navigated past available data (empty page), auto-reset back
  useEffect(() => {
    if (
      currentPage > 1 &&
      getActiveOrders.length === 0 &&
      effectiveTotalPages === Math.max(1, currentPage - 1)
    ) {
      const targetPage = Math.max(1, currentPage - 1);
      dispatch(setCurrentPage(targetPage));
      dispatch(fetchAllP2PBuyandSell(targetPage) as any);
    }
  }, [currentPage, getActiveOrders.length, effectiveTotalPages, dispatch]);

  // Show skeleton while loading initial data (no mounted gate - render immediately)
  if (loading && transformedData.length === 0) {
    return <P2PMarketTableSkeleton rows={8} />;
  }

  return (
    <div className="flex flex-col gap-1 w-full pr-3 sm:pr-0 max-w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-1 overflow-visible">
        <div className="flex flex-col lg:flex-row gap-1 sm:gap-2 w-full md:w-auto overflow-visible lg:items-center lg:flex-nowrap min-w-0">
          {/* Amount+Currency - stacked on small, row on lg */}
          <div className="flex items-center w-full lg:w-auto bg-gray-100 dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] rounded-lg sm:rounded-[22px] px-2.5 py-1.5 sm:px-4 sm:py-2.5 gap-1.5 sm:gap-3 min-h-[36px] sm:min-h-[48px]">
            <div className="flex items-center gap-1.5 sm:gap-3 w-full min-w-0">
              <Input
                bgColor="transparent"
                borderColor="transparent"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white w-full text-xs sm:text-[15px] font-medium placeholder:text-gray-400 dark:placeholder:text-[#6E7081] min-w-0"
              />
              <span className="w-px h-4 sm:h-6 bg-gray-200 dark:bg-[#35353E] flex-shrink-0" />
              <div className="relative flex-shrink-0" ref={currencyDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCurrencyDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-0.5 sm:gap-1 text-gray-900 dark:text-white text-xs sm:text-[15px] font-semibold whitespace-nowrap"
                >
                  {formatCurrencyLabel(selectedCurrency)}
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-[#788099]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isCurrencyDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 sm:mt-3 rounded-lg sm:rounded-2xl border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--bg-color)] shadow-2xl z-30 min-w-[100px] sm:min-w-[140px]">
                    {currencyOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSelectedCurrency(option.value);
                          setIsCurrencyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 sm:px-4 sm:py-3 text-xs sm:text-[15px] font-medium hover:bg-gray-50 dark:hover:bg-[#1b1b22] transition-colors ${option.value === selectedCurrency ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-[#C7CAD1]"
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Payment Method - stacked on small, row on lg */}
          <div
            className="flex items-center gap-1.5 sm:gap-3 bg-gray-100 dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] rounded-lg sm:rounded-[22px] px-2.5 py-1.5 sm:px-4 sm:py-2.5 w-full lg:w-[260px] min-h-[36px] sm:min-h-[48px]"
            ref={paymentDropdownRef}
          >
            <div className="flex h-5 w-5 sm:h-8 sm:w-8 items-center justify-center rounded-full border bg-[#F5F7FB]/80 border-gray-200 dark:bg-[#1B1E2B]/80 dark:border-white/10 flex-shrink-0">
              <Image
                src="/assets/coins-rotate_d278mb.png"
                alt="Payment Method"
                width={20}
                height={20}
                className="object-contain w-3.5 h-3.5 sm:w-5 sm:h-5"
              />
            </div>
            <div className="relative w-full min-w-0 sm:min-w-[210px]">
              <button
                type="button"
                onClick={() => setIsPaymentDropdownOpen((prev) => !prev)}
                className={`w-full rounded-md sm:rounded-lg bg-transparent border-none focus:outline-none py-0 pr-6 sm:pr-8 text-xs sm:text-[15px] font-semibold text-left flex items-center justify-between gap-2 min-w-0 ${isPaymentSummaryDefault
                    ? "text-gray-500 dark:text-[#7F889F]"
                    : "text-gray-900 dark:text-white"
                  }`}
              >
                <span className="truncate">{paymentSummary}</span>
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-[#788099] flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isPaymentDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 sm:mt-3 rounded-lg sm:rounded-2xl border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--bg-color)] shadow-2xl z-30 max-h-72 overflow-y-auto">
                  {paymentMethodOptions.map((option) => {
                    const isSelected =
                      option.value === ""
                        ? paymentTypes.length === 0
                        : paymentTypes.includes(option.value);
                    return (
                      <button
                        key={option.value || option.label}
                        type="button"
                        onClick={() => handlePaymentSelection(option.value)}
                        className={`w-full flex items-center gap-2 sm:gap-3 px-2.5 py-2 sm:px-5 sm:py-3.5 text-left hover:bg-gray-50 dark:hover:bg-[#1b1b22] transition-colors ${isSelected ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-[#C7CAD1]"
                          }`}
                      >
                        <span
                          className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "border-[#1D8751] bg-[#1D8751]" : "border-gray-300 dark:border-[#4A4A56]"
                            }`}
                        >
                          {isSelected && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className="text-xs sm:text-[15px] font-medium truncate">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {/* Bank Provider - stacked on small, row on lg */}
          <div
            className="flex items-center gap-1.5 sm:gap-3 bg-gray-100 dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] rounded-lg sm:rounded-[22px] px-2.5 py-1.5 sm:px-4 sm:py-2.5 w-full lg:w-[260px] min-h-[36px] sm:min-h-[48px] min-w-0"
            ref={providerDropdownRef}
          >
            <div className="flex h-5 w-5 sm:h-8 sm:w-8 items-center justify-center rounded-full border bg-[#F5F7FB]/80 border-gray-200 dark:bg-[#1B1E2B]/80 dark:border-white/10 flex-shrink-0">
              <Image
                src="/images/tdesign_undertake-transaction_s00yks.webp"
                alt="Bank Provider"
                width={20}
                height={20}
                className="object-contain w-3.5 h-3.5 sm:w-5 sm:h-5"
              />
            </div>
            <div className="relative w-full min-w-0 sm:min-w-[210px]">
              <button
                type="button"
                onClick={() => setIsProviderDropdownOpen((prev) => !prev)}
                className={`w-full rounded-md sm:rounded-lg bg-transparent border-none focus:outline-none py-0 pr-6 sm:pr-8 text-xs sm:text-[15px] font-semibold text-left flex items-center justify-between gap-2 min-w-0 ${isProviderSummaryDefault
                    ? "text-gray-500 dark:text-[#7F889F]"
                    : "text-gray-900 dark:text-white"
                  }`}
              >
                <span className="truncate">{providerSummary}</span>
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-[#788099] flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isProviderDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 sm:mt-3 rounded-lg sm:rounded-2xl border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--bg-color)] shadow-2xl z-30 max-h-72 overflow-y-auto">
                  {providerOptions.map((option) => {
                    const isSelected =
                      option.value === ""
                        ? providers.length === 0
                        : providers.includes(option.value);
                    return (
                      <button
                        key={option.value || option.label}
                        type="button"
                        onClick={() => handleProviderSelection(option.value)}
                        className={`w-full flex items-center gap-2 sm:gap-3 px-2.5 py-2 sm:px-5 sm:py-3.5 text-left hover:bg-gray-50 dark:hover:bg-[#1b1b22] transition-colors ${isSelected ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-[#C7CAD1]"
                          }`}
                      >
                        <span
                          className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "border-[#1D8751] bg-[#1D8751]" : "border-gray-300 dark:border-[#4A4A56]"
                            }`}
                        >
                          {isSelected && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className="text-xs sm:text-[15px] font-medium truncate">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {/* Filter button */}
          <div className="relative flex-shrink-0 overflow-visible" ref={filterDropdownRef}>
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
              className="w-9 h-9 sm:w-12 sm:h-12 bg-gray-100 dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] rounded-lg sm:rounded-[22px] flex items-center justify-center text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D8751] transition-all hover:border-[#1D8751]"
            >
              <FaFilter className="text-[#1D8751] w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
            {isFilterDropdownOpen && (
              <div
                className="absolute top-full left-0 sm:left-auto sm:right-0 mt-3 border border-gray-200 dark:border-[#35353E] rounded-2xl bg-white dark:bg-[#18181D] text-gray-900 dark:text-white shadow-2xl z-[100] w-[calc(100vw-2rem)] sm:w-[300px] max-w-[300px] p-4 space-y-4 overflow-y-auto max-h-[60vh]"
              >
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-[#7B7F92] font-semibold">Visibility</span>
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMerchantOnly((prev) => {
                          const next = !prev;
                          if (next) setShowMerchantBusinessOnly(false);
                          return next;
                        });
                      }}
                      className="flex items-center gap-3 text-left w-full py-1 hover:opacity-80 transition-opacity"
                    >
                      <span
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${showMerchantOnly ? "border-[#1D8751] bg-[#1D8751]" : "border-gray-300 dark:border-[#4A4A56]"
                          }`}
                      >
                        {showMerchantOnly && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className="text-[15px] font-medium text-gray-900 dark:text-white leading-tight">Show only Merchant ads</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMerchantBusinessOnly((prev) => {
                          const next = !prev;
                          if (next) setShowMerchantOnly(false);
                          return next;
                        });
                      }}
                      className="flex items-center gap-3 text-left w-full py-1 hover:opacity-80 transition-opacity"
                    >
                      <span
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${showMerchantBusinessOnly ? "border-[#1D8751] bg-[#1D8751]" : "border-gray-300 dark:border-[#4A4A56]"
                          }`}
                      >
                        {showMerchantBusinessOnly && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className="text-[15px] font-medium text-gray-900 dark:text-white leading-tight">Show only Merchant Business ads</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMerchantOnly(false);
                        setShowMerchantBusinessOnly(false);
                        setMinOrderLimit("");
                        setMaxOrderLimit("");
                      }}
                      className="flex items-center gap-3 text-left w-full py-1 hover:opacity-80 transition-opacity"
                    >
                      <span
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${!showMerchantOnly && !showMerchantBusinessOnly ? "border-[#1D8751] bg-[#1D8751]" : "border-gray-300 dark:border-[#4A4A56]"
                          }`}
                      >
                        {!showMerchantOnly && !showMerchantBusinessOnly && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className="text-[15px] font-medium text-gray-900 dark:text-white leading-tight">Show All</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-[#7B7F92] font-semibold">Order Limit</span>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={minOrderLimit}
                      onChange={(e) => setMinOrderLimit(e.target.value)}
                      placeholder="Min"
                      className="w-full rounded-xl bg-gray-50 dark:bg-[#14141B] border border-gray-200 dark:border-[#35353E] px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#6E7081] focus:outline-none focus:ring-2 focus:ring-[#1D8751]"
                    />
                    <input
                      type="number"
                      value={maxOrderLimit}
                      onChange={(e) => setMaxOrderLimit(e.target.value)}
                      placeholder="Max"
                      className="w-full rounded-xl bg-gray-50 dark:bg-[#14141B] border border-gray-200 dark:border-[#35353E] px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#6E7081] focus:outline-none focus:ring-2 focus:ring-[#1D8751]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* WebSocket Connection Status */}
          {wsConnected && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            </div>
          )}
          {wsError && !wsConnected && (
            <div className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="hidden sm:inline">Polling</span>
            </div>
          )}

          {/* <Button
            width={145}
            height={40}
            borderRadius={9}
            variant="primary"
            size="md"
            icon={<FaSyncAlt />}
            iconPosition="left"
            className="w-full sm:w-auto"
            onClick={handleRefresh}
          >
            Refresh
          </Button> */}
        </div>
      </div>
      <div className="w-full overflow-x-auto scrollbar-thin scroll-smooth">
        <MarketTable
          data={transformedData}
          currentPage={currentPage}
          totalPages={effectiveTotalPages}
          onPageChange={handlePageChange}
          loading={loading}
          activeTab={activeTab}
        />
      </div>
    </div>
  );
});

MarketTransactions.displayName = "MarketTransactions";

export default MarketTransactions;
