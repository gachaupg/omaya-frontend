import React, { useState, useEffect, useMemo } from "react";
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

interface Option {
  label: string;
  value: string;
}

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
    { label: "Other", value: "other" }
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
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Add predefined providers first, then add any additional providers from data
  const additionalProviders = Array.from(providers)
    .filter(provider => !predefinedProviders.some(pre => pre.value === provider))
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
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Add predefined methods first, then add any additional methods from data
  const additionalMethods = Array.from(paymentMethods)
    .filter(method => !predefinedPaymentMethods.some(pre => pre.value === method))
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

const MarketTransactions = ({ activeTab }: { activeTab: string }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { p2pBuyOrders, p2pSellOrders, loading, error, currentPage } =
    useSelector((state: RootState) => state.p2pMarket || {});
  const orders = { buy_orders: p2pBuyOrders, sell_orders: p2pSellOrders };
  console.log("orders object:", { 
    buyOrdersCount: p2pBuyOrders?.results?.length || 0, 
    sellOrdersCount: p2pSellOrders?.results?.length || 0,
    totalOrdersCount: p2pBuyOrders?.total_orders_count || 0,
    currentPage: currentPage,
    buyOrders: p2pBuyOrders,
    sellOrders: p2pSellOrders
  });
  const [mounted, setMounted] = useState(false);
  const [amount, setAmount] = useState("");
  const currency = "USDT"; // Fixed to USDT
  const [paymentType, setPaymentType] = useState("");
  const [provider, setProvider] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      const fetchOrders = async () => {
        dispatch(fetchAllP2PBuyandSell(currentPage) as any);
      };
      fetchOrders();
    }
  }, [dispatch, mounted, currentPage, isAuthenticated]);

  const providerOptions = useMemo(() => getProviderOptions(orders), [orders]);
  const paymentMethodOptions = useMemo(
    () => getPaymentMethodOptions(orders),
    [orders]
  );

  // Debug: Log available options
  console.log("Filter options:", {
    providerOptions,
    paymentMethodOptions
  });

  const getActiveOrders = useMemo(() => {
    if (!orders) {
      return [];
    }
    // Since API returns all orders in both buy_orders and sell_orders
    // We'll use buy_orders.results which contains all orders and filter by order_type
    const allOrders = orders.buy_orders?.results || [];
    
    // Filter orders based on activeTab
    const filteredOrders = allOrders.filter((order: any) => {
      if (activeTab === "buy") {
        return order.order_type === "sell";
      } else if (activeTab === "sell") {
        return order.order_type === "buy";
      }
      return true; // fallback to show all if activeTab is neither buy nor sell
    });
    
    console.log("getActiveOrders:", { 
      activeTab, 
      allOrdersCount: allOrders.length,
      filteredOrdersCount: filteredOrders.length,
      orderTypes: allOrders.map((o: any) => o.order_type)
    });
    return filteredOrders;
  }, [orders, activeTab]);

  const transformedData: MarketRow[] = useMemo(() => {
    if (!getActiveOrders) {
      return [];
    }

    const data = getActiveOrders
      .map((order: any, index: number) => {
        // Debug: Log the first order to understand the structure
        if (index === 0) {
          console.log("Sample order structure:", order);
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
          orders: order.user_total_buy_orders || order.user_total_sell_orders || 0,
          advertiser_photo: order.advertiser_photo || "",
          completion: `${(order.completion_rate || 0) * 100}%`,
          online: true,
          commission: `${order.commission_rate || 0}%`,
          available: `${parseFloat(order.amount || 0).toFixed(2)} ${order.currency}`,
          limit: `${parseFloat(order.min_order_amount || 0).toFixed(
            2
          )} - ${parseFloat(order.max_order_amount || 0).toFixed(2)} ${
            order.currency
          }`,
          payment: order.payment_details?.map((detail: any) => detail.provider) || [],
          paymentType: order.payment_details?.map(
            (detail: any) => detail.payment_method
          ) || [],
          minAmount: parseFloat(order.min_order_amount || 0),
          maxAmount: parseFloat(order.max_order_amount || 0),
          currency: order.currency,
          timeLimit: "10 Minutes",
          avgRealiseTime: "2 Minutes",
          terms_and_conditions: order.terms_and_conditions || "",
          autoReply: order.auto_reply,
          payment_details: order.payment_details || [],
        };
      })
      .filter((row: MarketRow) => {
        if (currency && row.currency !== currency) return false;

        // Filter by payment method - check if any payment detail has the selected payment method
        if (paymentType && paymentType !== "") {
          const hasPaymentMethod = row.payment_details?.some(
            (detail: any) => {
              // Handle predefined payment method mappings
              if (paymentType === "bank_transfer" && 
                  (detail.payment_method?.toLowerCase().includes("bank") || 
                   detail.payment_method?.toLowerCase().includes("transfer"))) {
                return true;
              }
              if (paymentType === "mobile_money" && 
                  (detail.payment_method?.toLowerCase().includes("mobile") || 
                   detail.payment_method?.toLowerCase().includes("money"))) {
                return true;
              }
              // Direct match
              return detail.payment_method === paymentType;
            }
          );
          if (!hasPaymentMethod) return false;
        }

        // Filter by provider - check if any payment detail has the selected provider
        if (provider && provider !== "") {
          const hasProvider = row.payment_details?.some(
            (detail: any) => {
              // Handle predefined provider mappings
              if (provider === "salaam_bank" && 
                  detail.provider?.toLowerCase().includes("salaam")) {
                return true;
              }
              if (provider === "evc_plus" && 
                  detail.provider?.toLowerCase().includes("evc")) {
                return true;
              }
              if (provider === "equity_premier_bank" && 
                  detail.provider?.toLowerCase().includes("equity")) {
                return true;
              }
              if (provider === "premier_bank" && 
                  detail.provider?.toLowerCase().includes("premier")) {
                return true;
              }
              // Direct match
              return detail.provider === provider;
            }
          );
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

    console.log("Transformed data:", {
      originalCount: getActiveOrders.length,
      filteredCount: data.length,
      filters: { currency, provider, paymentType, amount, searchQuery }
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
  ]);

  const handlePageChange = (newPage: number) => {
    dispatch(setCurrentPage(newPage));
  };

  const handleRefresh = () => {
    dispatch(fetchAllP2PBuyandSell(currentPage) as any);
  };

  const totalPages = Math.ceil(
    (orders?.buy_orders?.total_orders_count || 0) / 10
  );

  if (!mounted) {
    return null;
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
              <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">|</span>
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

        <Button
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
        </Button>
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
};

export default MarketTransactions;
