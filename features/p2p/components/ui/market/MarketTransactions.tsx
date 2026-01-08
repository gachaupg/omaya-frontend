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

interface Option {
  label: string;
  value: string;
}

const formatCurrencyLabel = (currency?: string | null) => {
  if (!currency) return "USD";
  return currency.toUpperCase() === "USDT" ? "USD" : currency;
};

const formatLimitDuration = (duration: string): string => {
  if (!duration) return "10 Minutes";

  try {
    const parts = duration.split(":");
    const hours = parseInt(parts[0] || "0");
    const minutes = parseInt(parts[1] || "0");
    const seconds = parseInt(parts[2] || "0");

    // If there are hours, convert to minutes
    if (hours > 0) {
      const totalMinutes = hours * 60 + minutes;
      return `${totalMinutes} Minutes`;
    }

    // If there are minutes, show minutes
    if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? "Minute" : "Minutes"}`;
    }

    // Otherwise show seconds as minutes (keeping the number, changing the word)
    if (seconds > 0) {
      return `${seconds} ${seconds === 1 ? "Minute" : "Minutes"}`;
    }

    return "0 Minutes";
  } catch (error) {
    return "10 Minutes";
  }
};

const getCurrencyOptions = (orders: any): Option[] => {
  if (!orders?.buy_orders?.results)
    return [{ label: "USD", value: "USDT" }];

  const currencies = new Set(
    orders.buy_orders.results.map((order: any) => order.currency)
  );
  return Array.from(currencies).map((currency) => ({
    label: formatCurrencyLabel(currency as string),
    value: currency as string,
  }));
};

const getProviderOptions = (orders: any): Option[] => {
  // Predefined providers that should always be available
  const predefinedProviders = [
    { label: "All Banks/Providers", value: "" },
    { label: "Salaam Bank", value: "salaam_bank" },
    { label: "EVC Plus", value: "evc_plus" },
    { label: "Equity Premier Bank", value: "equity_premier_bank" },
    { label: "Hormuud", value: "hormuud" },
    { label: "Somtel", value: "somtel" },
    { label: "Golis", value: "golis" },
    { label: "Amal Bank", value: "amal_bank" },
    { label: "Premier Bank", value: "premier_bank" },
    { label: "Other", value: "other" },
  ];

  const providers = new Set<string>();

  if (orders?.buy_orders?.results) {
    orders.buy_orders.results.forEach((order: any) => {
      if (order.payment_details) {
        order.payment_details.forEach((detail: any) => {
          if (detail.provider) {
            providers.add(detail.provider);
          }
        });
      }
    });
  }

  // Format provider names to be more user-friendly
  const formatProviderName = (provider: string): string => {
    return provider
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Add predefined providers first, then add any additional providers from data
  const additionalProviders = Array.from(providers)
    .filter(
      (provider) => !predefinedProviders.some((pre) => pre.value === provider)
    )
    .map((provider) => ({
      label: formatProviderName(provider),
      value: provider,
    }));

  return [...predefinedProviders, ...additionalProviders];
};

const getPaymentMethodOptions = (orders: any): Option[] => {
  // Predefined payment methods that should always be available
  const predefinedPaymentMethods = [
    { label: "All Payment Methods", value: "" },
    { label: "Bank Transfer", value: "bank_transfer" },
    { label: "Mobile Money", value: "mobile_money" },
  ];

  const paymentMethods = new Set<string>();

  // Check buy orders
  if (orders?.buy_orders?.results) {
    orders.buy_orders.results.forEach((order: any) => {
      if (order.payment_details) {
        order.payment_details.forEach((detail: any) => {
          if (detail.payment_method) {
            paymentMethods.add(detail.payment_method);
          }
        });
      }
    });
  }

  // Check sell orders
  if (orders?.sell_orders?.results) {
    orders.sell_orders.results.forEach((order: any) => {
      if (order.payment_details) {
        order.payment_details.forEach((detail: any) => {
          if (detail.payment_method) {
            paymentMethods.add(detail.payment_method);
          }
        });
      }
    });
  }

  // Format payment method names to be more user-friendly
  const formatPaymentMethod = (method: string): string => {
    return method
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Add predefined methods first, then add any additional methods from data
  const additionalMethods = Array.from(paymentMethods)
    .filter(
      (method) => !predefinedPaymentMethods.some((pre) => pre.value === method)
    )
    .map((method) => ({
      label: formatPaymentMethod(method),
      value: method,
    }));

  return [...predefinedPaymentMethods, ...additionalMethods];
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

 

  const [mounted, setMounted] = useState(false);
  const hasInitializedRef = useRef(false);
  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USDT");
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

  const { isConnected: wsConnected, connectionError: wsError } =
    useP2POrdersWebSocket({
      enabled: isAuthenticated && currentPage === 1, // Only enable WebSocket on page 1 to prevent overwrites
      fallbackToPolling: false, // Disable polling to prevent overwrites when on other pages
      pollingInterval: 30000,
    });



  useEffect(() => {
    console.log('🔵 [MarketTransactions] Component mounted/remounted');
    setMounted(true);
    
    // Only fetch on FIRST mount if no data exists AND user is authenticated
    // This prevents automatic resets but ensures initial data loads
    if (!hasInitializedRef.current && isAuthenticated) {
      hasInitializedRef.current = true;
      const currentPageInState = store.getState()?.p2pMarket?.currentPage || 1;
      const hasBuyOrders = store.getState()?.p2pMarket?.p2pBuyOrders?.results?.length > 0;
      const hasSellOrders = store.getState()?.p2pMarket?.p2pSellOrders?.results?.length > 0;
      
      console.log('🔵 [MarketTransactions] FIRST mount - currentPage:', currentPageInState, 'hasData:', hasBuyOrders || hasSellOrders);
      
      // Only fetch if we have NO data at all (first visit)
      if (!hasBuyOrders && !hasSellOrders) {
        console.log('🔵 [MarketTransactions] No data found, fetching page:', currentPageInState);
        dispatch(fetchAllP2PBuyandSell(currentPageInState) as any);
      } else {
        console.log('🔵 [MarketTransactions] Data already exists, skipping fetch');
      }
    } else {
      console.log('🔵 [MarketTransactions] Skipping fetch - already initialized or not authenticated');
    }
  }, []); // Only run once on mount

  // Track Redux state changes - but don't reset page
  useEffect(() => {
    console.log('🟡 [MarketTransactions] Orders changed, currentPage:', currentPage);
    // Don't reset page when orders change - this was causing the issue
  }, [buy_orders, sell_orders, currentPage]);

  const providerOptions = useMemo(() => getProviderOptions(orders), [orders]);
  const paymentMethodOptions = useMemo(
    () => getPaymentMethodOptions(orders),
    [orders]
  );
  const currencyOptions = useMemo(() => getCurrencyOptions(orders), [orders]);
  const paymentSummary = useMemo(
    () => formatSelectionSummary(paymentTypes, paymentMethodOptions, "Payment Method"),
    [paymentTypes, paymentMethodOptions]
  );
  const providerSummary = useMemo(
    () => formatSelectionSummary(providers, providerOptions, "Select Provider"),
    [providers, providerOptions]
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

    // Log to verify we're getting the right data for the current page
    console.log('📊 [MarketTransactions] getActiveOrders - currentPage:', currentPage, 'activeTab:', activeTab, 'orders count:', activeOrdersList.length);
    if (activeOrdersList.length > 0) {
      console.log('📊 [MarketTransactions] First order ID:', activeOrdersList[0]?.id, 'Last order ID:', activeOrdersList[activeOrdersList.length - 1]?.id);
    }

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

        return {
          id: order.id,
          advertiser: `${firstName} ${lastName}`,
          advertiserInitials: initials,
          orders:
            order.user_total_buy_orders || order.user_total_sell_orders || 0,
          advertiser_photo: order.advertiser_photo || "",
          completion: `${(order.completion_rate || 0) * 100}%`,
          exchange_rate: `${(parseFloat(order.exchange_rate || 0) * 100).toFixed(0)}`,
          completion_time: formatLimitDuration(
            order.completion_time || "00:00:00"
          ),
          // Check online status from API - status "offline" means offline, otherwise online
          online: order.status !== 'offline',
          commission: `${order.commission_rate || 0}`,
          available: `${parseFloat(order.available_amount || 0).toFixed(2)} ${order.currency}`,
          availableAmount: parseFloat(order.available_amount || 0),
          limit: `${parseFloat(order.min_order_amount || 0).toFixed(
            2
          )} - ${parseFloat(order.max_order_amount || 0).toFixed(2)} ${
            order.currency
          }`,
          payment:
            order.payment_details?.map((detail: any) => detail.provider) || [],
          paymentType:
            order.payment_details?.map(
              (detail: any) => detail.payment_method
            ) || [],
          isMerchant: Boolean(order.is_merchant),
          isMerchantBusiness: Boolean(order.is_merchant_business),
          minAmount: parseFloat(order.min_order_amount || 0),
          maxAmount: parseFloat(order.max_order_amount || 0),
          currency: order.currency,
          timeLimit: formatLimitDuration(order.limit_duration),
          avgRealiseTime: formatLimitDuration(
            order.completion_time || "00:02:00"
          ),
          terms_and_conditions: order.terms_and_conditions || "",
          autoReply: order.auto_reply,
          payment_details: paymentDetails,
        };
      })
      .filter((row: MarketRow) => {
        if (selectedCurrency && row.currency !== selectedCurrency) return false;

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

        // Filter by payment method - check if any payment detail has the selected payment method(s)
        if (paymentTypes.length > 0) {
          const hasPaymentMethod = row.payment_details?.some((detail: any) => {
            return paymentTypes.some((method) => {
            if (
                method === "bank_transfer" &&
              (detail.payment_method?.toLowerCase().includes("bank") ||
                detail.payment_method?.toLowerCase().includes("transfer"))
            ) {
              return true;
            }
            if (
                method === "mobile_money" &&
              (detail.payment_method?.toLowerCase().includes("mobile") ||
                detail.payment_method?.toLowerCase().includes("money"))
            ) {
              return true;
            }
              return detail.payment_method === method;
            });
          });
          if (!hasPaymentMethod) return false;
        }

        // Filter by provider - check if any payment detail has the selected provider(s)
        if (providers.length > 0) {
          const hasProvider = row.payment_details?.some((detail: any) => {
            return providers.some((selectedProvider) => {
            if (
                selectedProvider === "salaam_bank" &&
              detail.provider?.toLowerCase().includes("salaam")
            ) {
              return true;
            }
            if (
                selectedProvider === "evc_plus" &&
              detail.provider?.toLowerCase().includes("evc")
            ) {
              return true;
            }
            if (
                selectedProvider === "equity_premier_bank" &&
              detail.provider?.toLowerCase().includes("equity")
            ) {
              return true;
            }
            if (
                selectedProvider === "premier_bank" &&
              detail.provider?.toLowerCase().includes("premier")
            ) {
              return true;
            }
              return detail.provider === selectedProvider;
            });
          });
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

  const handlePageChange = useCallback((newPage: number) => {
    // Get current page from Redux state directly (most up-to-date)
    const currentPageInState = store.getState()?.p2pMarket?.currentPage || 1;
    
    // Prevent unnecessary page changes
    if (newPage === currentPageInState) {
      console.log('⏭️ [MarketTransactions] Skipping page change - already on page', newPage);
      return;
    }
    
    console.log('🔄 [MarketTransactions] ========== PAGE CHANGE START ==========');
    console.log('🔄 [MarketTransactions] Requesting page:', newPage, 'from:', currentPageInState);
    
    // CRITICAL: Set page FIRST, then fetch
    dispatch(setCurrentPage(newPage));
    console.log('✅ [MarketTransactions] Set currentPage to:', newPage);
    
    // Small delay to ensure state update, then fetch
    setTimeout(() => {
      const verifyPage = store.getState()?.p2pMarket?.currentPage;
      console.log('📡 [MarketTransactions] Verifying page before fetch:', verifyPage, 'requested:', newPage);
      if (verifyPage === newPage) {
        console.log('📡 [MarketTransactions] Fetching page:', newPage);
        dispatch(fetchAllP2PBuyandSell(newPage) as any);
      } else {
        console.error('❌ [MarketTransactions] Page mismatch! State:', verifyPage, 'Requested:', newPage);
      }
    }, 10);
  }, [dispatch]);

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
    let totalCount = 0;
    if (activeTab === "buy") {
      // User wants to buy, showing sell orders
      totalCount = orders?.sell_orders?.total_orders_count || 0;
    } else if (activeTab === "sell") {
      // User wants to sell, showing buy orders
      totalCount = orders?.buy_orders?.total_orders_count || 0;
    } else {
      // Default: sum both
      totalCount =
        (orders?.buy_orders?.total_orders_count || 0) +
        (orders?.sell_orders?.total_orders_count || 0);
    }
    return Math.ceil(totalCount / 10);
  }, [orders, activeTab]);

  if (!mounted) {
    return null;
  }

  // Show skeleton while loading initial data
  if (loading && transformedData.length === 0) {
    return <P2PMarketTableSkeleton rows={8} />;
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-1">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full md:w-auto">
          <div className="flex items-center w-full sm:w-auto bg-gray-100 dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] rounded-[22px] px-4 py-2.5 gap-3 min-h-[48px]">
            <div className="flex items-center gap-3 w-full">
              <Input
                bgColor="transparent"
                borderColor="transparent"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white w-full text-[15px] font-medium placeholder:text-gray-400 dark:placeholder:text-[#6E7081]"
              />
              <span className="w-px h-6 bg-gray-200 dark:bg-[#35353E]" />
              <div className="relative" ref={currencyDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCurrencyDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 text-gray-900 dark:text-white text-[15px] font-semibold whitespace-nowrap"
                >
                  {formatCurrencyLabel(selectedCurrency)}
                  <svg
                    className="w-4 h-4 text-gray-500 dark:text-[#788099]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isCurrencyDropdownOpen && (
                  <div className="absolute right-0 mt-3 rounded-2xl border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--bg-color)] shadow-2xl z-30 min-w-[140px]">
                    {currencyOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSelectedCurrency(option.value);
                          setIsCurrencyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-[15px] font-medium hover:bg-gray-50 dark:hover:bg-[#1b1b22] transition-colors ${
                          option.value === selectedCurrency ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-[#C7CAD1]"
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
          <div
            className="flex items-center gap-3 bg-gray-100 dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] rounded-[22px] px-4 py-2.5 w-full sm:w-[260px] min-h-[48px]"
            ref={paymentDropdownRef}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-[#F5F7FB]/80 border-gray-200 dark:bg-[#1B1E2B]/80 dark:border-white/10 flex-shrink-0">
              <Image
                src="https://res.cloudinary.com/pitz/image/upload/v1746710370/coins-rotate_d278mb.png"
                alt="Payment Method"
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
            <div className="relative w-full min-w-[180px] sm:min-w-[210px]">
              <button
                type="button"
                onClick={() => setIsPaymentDropdownOpen((prev) => !prev)}
                className={`w-full rounded-lg bg-transparent border-none focus:outline-none py-0 pr-8 text-[15px] font-semibold text-left flex items-center justify-between gap-2 ${
                  isPaymentSummaryDefault
                    ? "text-gray-500 dark:text-[#7F889F]"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                <span className="truncate">{paymentSummary}</span>
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-[#788099]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isPaymentDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-3 rounded-2xl border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--bg-color)] shadow-2xl z-30 max-h-72 overflow-y-auto">
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
                        className={`w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-[#1b1b22] transition-colors ${
                          isSelected ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-[#C7CAD1]"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            isSelected ? "border-[#1D8751] bg-[#1D8751]" : "border-gray-300 dark:border-[#4A4A56]"
                          }`}
                        >
                          {isSelected && (
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
                        <span className="text-[15px] font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div
            className="flex items-center gap-3 bg-gray-100 dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] rounded-[22px] px-4 py-2.5 w-full sm:w-[260px] min-h-[48px]"
            ref={providerDropdownRef}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-[#F5F7FB]/80 border-gray-200 dark:bg-[#1B1E2B]/80 dark:border-white/10 flex-shrink-0">
              <Image
                src="https://res.cloudinary.com/pitz/image/upload/v1763535952/tdesign_undertake-transaction_s00yks.png"
                alt="Bank Provider"
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
            <div className="relative w-full min-w-[180px] sm:min-w-[210px]">
              <button
                type="button"
                onClick={() => setIsProviderDropdownOpen((prev) => !prev)}
                className={`w-full rounded-lg bg-transparent border-none focus:outline-none py-0 pr-8 text-[15px] font-semibold text-left flex items-center justify-between gap-2 ${
                  isProviderSummaryDefault
                    ? "text-gray-500 dark:text-[#7F889F]"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                <span className="truncate">{providerSummary}</span>
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-[#788099]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isProviderDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-3 rounded-2xl border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--bg-color)] shadow-2xl z-30 max-h-72 overflow-y-auto">
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
                        className={`w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-[#1b1b22] transition-colors ${
                          isSelected ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-[#C7CAD1]"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            isSelected ? "border-[#1D8751] bg-[#1D8751]" : "border-gray-300 dark:border-[#4A4A56]"
                          }`}
                        >
                          {isSelected && (
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
                        <span className="text-[15px] font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="relative w-full sm:w-auto" ref={filterDropdownRef}>
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
              className="w-12 h-12 bg-gray-100 dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] rounded-[22px] flex items-center justify-center text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D8751] transition-all hover:border-[#1D8751]"
            >
              <FaFilter className="text-[#1D8751]" size={20} />
            </button>
            {isFilterDropdownOpen && (
              <div className="absolute top-full right-0 mt-3 border border-gray-200 dark:border-[#35353E] rounded-2xl bg-white dark:bg-[var(--bg-color)] text-gray-900 dark:text-white shadow-2xl z-40 w-[calc(100vw-2rem)] sm:w-auto sm:min-w-[280px] max-w-[320px] p-4 space-y-4 overflow-hidden">
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
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          showMerchantOnly ? "border-[#1D8751] bg-[#1D8751]" : "border-gray-300 dark:border-[#4A4A56]"
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
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          showMerchantBusinessOnly ? "border-[#1D8751] bg-[#1D8751]" : "border-gray-300 dark:border-[#4A4A56]"
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
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          !showMerchantOnly && !showMerchantBusinessOnly ? "border-[#1D8751] bg-[#1D8751]" : "border-gray-300 dark:border-[#4A4A56]"
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
          totalPages={totalPages}
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
