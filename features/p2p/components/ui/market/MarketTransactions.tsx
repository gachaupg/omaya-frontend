import React, { useState, useEffect, useMemo, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Input from "../../Common/Input";
import Select from "../../Common/Select";
import Button from "../../Common/Button";
import { FaFilter, FaSyncAlt } from "react-icons/fa";
import Image from "next/image";
import { tokens } from "@/styles/tokens";
import MarketTable from "./Table";
import {
  fetchAllP2PBuyandSell,
  setCurrentPage,
} from "@/features/p2p/slices/orderSlice";
import { RootState } from "@/store/rootReducer";
import { useP2POrdersWebSocket } from "@/features/p2p/hooks/useP2POrdersWebSocket";
import { selectAllP2POrders } from "@/features/p2p/selectors";
import { P2PMarketTableSkeleton } from "@/components/ui/Skeletons";

import { logger } from "@/lib/utils/logger";

interface Option {
  label: string;
  value: string;
}

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
  if (!orders?.buy_orders?.results) return [{ label: "USDT", value: "USDT" }];

  const currencies = new Set(
    orders.buy_orders.results.map((order: any) => order.currency)
  );
  return Array.from(currencies).map((currency) => ({
    label: currency as string,
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

interface MarketRow {
  id: string;
  advertiser: string;
  advertiserInitials: string;
  orders: number;
  advertiser_photo: string;
  completion: string;
  exchange_rate: string;
  completion_time: string;
  online: boolean;
  commission: string;
  available: string;
  limit: string;
  payment: string[];
  minAmount: number;
  maxAmount: number;
  currency: string;
  paymentType: string;
  timeLimit: string;
  avgRealiseTime: string;
  terms_and_conditions: string;
  autoReply?: string;
  payment_details?: Array<{
    id: number;
    provider: string;
    payment_method: string;
    account_name: string;
    account_number: string;
  }>;
}

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

  // Log component render and Redux state
  logger.debug("p2p", "🎨 [Component] MarketTransactions render:", {
    buyOrdersCount: buy_orders?.results?.length || 0,
    sellOrdersCount: sell_orders?.results?.length || 0,
    totalBuyCount,
    totalSellCount,
    currentPage,
    activeTab,
    isAuthenticated,
    timestamp: new Date().toISOString(),
  });

  const [mounted, setMounted] = useState(false);
  const [amount, setAmount] = useState("");
  const currency = "USDT"; // Fixed to USDT
  const [paymentType, setPaymentType] = useState("");
  const [provider, setProvider] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Initialize WebSocket connection for real-time P2P orders updates
  logger.debug("p2p", "🔌 [Component] Initializing WebSocket connection:", {
    isAuthenticated,
  });
  const { isConnected: wsConnected, connectionError: wsError } =
    useP2POrdersWebSocket({
      enabled: isAuthenticated,
      fallbackToPolling: true, // Enable automatic fallback to polling if WebSocket fails
      pollingInterval: 30000, // Poll every 30 seconds if WebSocket is unavailable
    });

  logger.debug("p2p", "🔌 [Component] WebSocket status:", {
    wsConnected,
    wsError,
    willUsePolling: !wsConnected && isAuthenticated,
  });

  useEffect(() => {
    setMounted(true);
    // Fetch initial data only once on mount
    if (isAuthenticated) {
      logger.debug("p2p", "🚀 [Component] Fetching initial P2P orders");
      dispatch(fetchAllP2PBuyandSell(1) as any);
    }
  }, []); // Only run once on mount

  // Track Redux state changes
  useEffect(() => {
    logger.debug("p2p", "🔄 [Component] Redux state changed:", {
      buyOrdersCount: buy_orders?.results?.length || 0,
      sellOrdersCount: sell_orders?.results?.length || 0,
      timestamp: new Date().toISOString(),
    });
  }, [buy_orders, sell_orders]);

  const providerOptions = useMemo(() => getProviderOptions(orders), [orders]);
  const paymentMethodOptions = useMemo(
    () => getPaymentMethodOptions(orders),
    [orders]
  );

  // Debug: Log available options
  logger.debug("p2p", "Filter options:", {
    providerOptions,
    paymentMethodOptions,
  });

  const getActiveOrders = useMemo(() => {
    if (!orders) {
      logger.debug("p2p", "⚠️ [ActiveOrders] No orders object");
      return [];
    }

    // When user is on "buy" tab (wants to buy), show sell orders (people selling)
    // When user is on "sell" tab (wants to sell), show buy orders (people buying)
    let activeOrdersList = [];

    if (activeTab === "buy") {
      // User wants to buy, so show sell orders
      activeOrdersList = orders.sell_orders?.results || [];
      logger.debug(
        "p2p",
        "📋 [ActiveOrders] Showing sell orders for buy tab:",
        activeOrdersList.length
      );
    } else if (activeTab === "sell") {
      // User wants to sell, so show buy orders
      activeOrdersList = orders.buy_orders?.results || [];
      logger.debug(
        "p2p",
        "📋 [ActiveOrders] Showing buy orders for sell tab:",
        activeOrdersList.length
      );
    } else {
      // Default: combine both
      activeOrdersList = [
        ...(orders.buy_orders?.results || []),
        ...(orders.sell_orders?.results || []),
      ];
      logger.debug(
        "p2p",
        "📋 [ActiveOrders] Showing combined orders:",
        activeOrdersList.length
      );
    }

    logger.debug("p2p", "📊 [ActiveOrders] Active orders list:", {
      activeTab,
      buyOrdersCount: orders.buy_orders?.results?.length || 0,
      sellOrdersCount: orders.sell_orders?.results?.length || 0,
      activeOrdersCount: activeOrdersList.length,
      firstOrderType: activeOrdersList[0]?.order_type,
      firstOrderId: activeOrdersList[0]?.id,
    });

    return activeOrdersList;
  }, [orders, activeTab, buy_orders, sell_orders]); // Add direct dependencies

  const transformedData: MarketRow[] = useMemo(() => {
    logger.debug(
      "p2p",
      "🔄 [TransformedData] Recalculating with",
      getActiveOrders.length,
      "orders"
    );

    if (!getActiveOrders || getActiveOrders.length === 0) {
      logger.debug("p2p", "⚠️ [TransformedData] No active orders to transform");
      return [];
    }

    const data = getActiveOrders
      .map((order: any, index: number) => {
        // Debug: Log the first order to understand the structure
        if (index === 0) {
          logger.debug(
            "p2p",
            "📄 [TransformedData] Sample order structure:",
            order
          );
        }

        const firstName = order.advertiser_first_name || "";
        const lastName = order.advertiser_last_name || "";
        const initials = `${firstName.charAt(0)}${lastName.charAt(
          0
        )}`.toUpperCase();
        const fullName = `${firstName} ${lastName}`.toLowerCase();

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
          online: true,
          commission: `${order.commission_rate || 0}%`,
          available: `${parseFloat(order.amount || 0).toFixed(2)} ${order.currency}`,
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
          minAmount: parseFloat(order.min_order_amount || 0),
          maxAmount: parseFloat(order.max_order_amount || 0),
          currency: order.currency,
          timeLimit: formatLimitDuration(order.limit_duration),
          avgRealiseTime: formatLimitDuration(
            order.completion_time || "00:02:00"
          ),
          terms_and_conditions: order.terms_and_conditions || "",
          autoReply: order.auto_reply,
          payment_details: order.payment_details || [],
        };
      })
      .filter((row: MarketRow) => {
        if (currency && row.currency !== currency) return false;

        // Filter by payment method - check if any payment detail has the selected payment method
        if (paymentType && paymentType !== "") {
          const hasPaymentMethod = row.payment_details?.some((detail: any) => {
            // Handle predefined payment method mappings
            if (
              paymentType === "bank_transfer" &&
              (detail.payment_method?.toLowerCase().includes("bank") ||
                detail.payment_method?.toLowerCase().includes("transfer"))
            ) {
              return true;
            }
            if (
              paymentType === "mobile_money" &&
              (detail.payment_method?.toLowerCase().includes("mobile") ||
                detail.payment_method?.toLowerCase().includes("money"))
            ) {
              return true;
            }
            // Direct match
            return detail.payment_method === paymentType;
          });
          if (!hasPaymentMethod) return false;
        }

        // Filter by provider - check if any payment detail has the selected provider
        if (provider && provider !== "") {
          const hasProvider = row.payment_details?.some((detail: any) => {
            // Handle predefined provider mappings
            if (
              provider === "salaam_bank" &&
              detail.provider?.toLowerCase().includes("salaam")
            ) {
              return true;
            }
            if (
              provider === "evc_plus" &&
              detail.provider?.toLowerCase().includes("evc")
            ) {
              return true;
            }
            if (
              provider === "equity_premier_bank" &&
              detail.provider?.toLowerCase().includes("equity")
            ) {
              return true;
            }
            if (
              provider === "premier_bank" &&
              detail.provider?.toLowerCase().includes("premier")
            ) {
              return true;
            }
            // Direct match
            return detail.provider === provider;
          });
          if (!hasProvider) return false;
        }

        if (amount) {
          const amountValue = parseFloat(amount);
          if (amountValue < row.minAmount || amountValue > row.maxAmount)
            return false;
        }
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          if (!row.advertiser.toLowerCase().includes(query)) return false;
        }
        return true;
      });

    logger.debug("p2p", "✅ [TransformedData] Transformed data:", {
      originalCount: getActiveOrders.length,
      filteredCount: data.length,
      filters: { currency, provider, paymentType, amount, searchQuery },
      timestamp: new Date().toISOString(),
    });

    return data;
  }, [
    getActiveOrders,
    currency,
    provider,
    paymentType,
    amount,
    searchQuery,
    activeTab,
    buy_orders,
    sell_orders,
  ]); // Add direct Redux state dependencies to ensure re-calculation

  const handlePageChange = (newPage: number) => {
    dispatch(setCurrentPage(newPage));
    // Fetch orders for the new page
    dispatch(fetchAllP2PBuyandSell(newPage) as any);
  };

  const handleRefresh = () => {
    // Always fetch fresh data on manual refresh, even if WebSocket is connected
    dispatch(fetchAllP2PBuyandSell(currentPage) as any);
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
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
          <div className="flex items-center w-full sm:w-auto bg-gray-100 dark:bg-[#18181D] border border-gray-300 dark:border-[#35353E] rounded-lg px-3 py-2 gap-2">
            <div className="flex items-center gap-2">
              <Input
                bgColor="transparent"
                borderColor="transparent"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white w-full sm:w-36 text-sm"
              />
              <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                |
              </span>
              <span className="text-gray-900 dark:text-white text-sm font-semibold px-1">
                USDT
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#18181D] border border-gray-300 dark:border-[#35353E] rounded-lg px-3 py-2">
            <Image
              src="https://res.cloudinary.com/pitz/image/upload/v1746710370/coins-rotate_d278mb.png"
              alt="Payment Method"
              width={18}
              height={18}
              className="text-[#1D8751]"
            />
            <Select
              bgColor="transparent"
              borderColor="transparent"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              options={paymentMethodOptions}
              placeholder="Payment Method"
              className="text-gray-900 dark:bg-[#18181D] border border-gray-300 dark:border-[#35353E] dark:text-white w-full sm:w-44 bg-transparent border-none focus:ring-0 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#18181D] border border-gray-300 dark:border-[#35353E] rounded-lg px-3 py-2">
            <Image
              src="https://res.cloudinary.com/pitz/image/upload/v1746710370/coins-rotate_d278mb.png"
              alt="Bank Provider"
              width={18}
              height={18}
              className="text-[#1D8751]"
            />
            <Select
              bgColor="transparent"
              borderColor="transparent"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              options={providerOptions}
              placeholder="Select Bank/Provider"
              className="bg-transparent border-none dark:bg-[#18181D] border border-gray-300 dark:border-[#35353E] focus:ring-0 text-gray-900 dark:text-white w-full sm:w-44 text-sm"
            />
          </div>
          <button
            className="w-11 h-10 bg-gray-100 dark:bg-[#18181D] border border-gray-300 dark:border-[#35353E] rounded-lg flex items-center justify-center"
            onClick={() => setShowSearch((prev) => !prev)}
            type="button"
          >
            <FaFilter className="text-[#1D8751]" size={22} />
          </button>
          {showSearch && (
            <Input
              bgColor="transparent"
              borderColor="transparent"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search advertiser"
              className="bg-transparent h-[8px] border-none focus:ring-0 text-gray-900 dark:text-white w-full sm:w-36"
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* WebSocket Connection Status */}
          {wsConnected && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="hidden sm:inline">Live</span>
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
      <div className="w-full overflow-x-auto">
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
