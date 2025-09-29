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
  if (!orders?.buy_orders?.results)
    return [{ label: "Select Provider", value: "" }];

  const providers = new Set<string>();
  orders.buy_orders.results.forEach((order: any) => {
    order.payment_details.forEach((detail: any) => {
      providers.add(detail.provider);
    });
  });

  return [
    { label: "Select Provider", value: "" },
    ...Array.from(providers).map((provider) => ({
      label: provider,
      value: provider,
    })),
  ];
};

const getPaymentMethodOptions = (orders: any): Option[] => {
  if (!orders?.buy_orders?.results && !orders?.sell_orders?.results)
    return [{ label: "All Types", value: "" }];

  const paymentMethods = new Set<string>();

  // Check buy orders
  if (orders?.buy_orders?.results) {
    orders.buy_orders.results.forEach((order: any) => {
      order.payment_details.forEach((detail: any) => {
        paymentMethods.add(detail.payment_method);
      });
    });
  }

  // Check sell orders
  if (orders?.sell_orders?.results) {
    orders.sell_orders.results.forEach((order: any) => {
      order.payment_details.forEach((detail: any) => {
        paymentMethods.add(detail.payment_method);
      });
    });
  }

  return [
    { label: "All Types", value: "" },
    ...Array.from(paymentMethods).map((method) => ({
      label: method,
      value: method,
    })),
  ];
};

interface MarketRow {
  id: string;
  advertiser: string;
  advertiserInitials: string;
  orders: number;
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
    buyOrders: p2pBuyOrders,
    sellOrders: p2pSellOrders
  });
  const [mounted, setMounted] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USDT");
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

  const currencyOptions = useMemo(() => getCurrencyOptions(orders), [orders]);
  const providerOptions = useMemo(() => getProviderOptions(orders), [orders]);
  const paymentMethodOptions = useMemo(
    () => getPaymentMethodOptions(orders),
    [orders]
  );

  const getActiveOrders = useMemo(() => {
    if (!orders) {
      return [];
    }
    // For now, since API only returns buy orders, show buy orders for both tabs
    // TODO: Fix API to return proper sell orders when needed
    const orderType = "buy_orders"; // activeTab === "buy" ? "sell_orders" : "buy_orders";
    const activeOrders = orders[orderType]?.results || [];
    console.log("getActiveOrders:", { activeTab, orderType, activeOrders: activeOrders.length });
    return activeOrders;
  }, [orders, activeTab]);

  const transformedData: MarketRow[] = useMemo(() => {
    if (!getActiveOrders) {
      return [];
    }

    const data = getActiveOrders
      .map((order: any) => {
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
            activeTab === "buy"
              ? order.user_total_buy_orders
              : order.user_total_sell_orders || 0,
          completion: `${(order.completion_rate || 0) * 100}%`,
          online: true,
          commission: `${order.commission_rate}%`,
          available: `${parseFloat(order.amount).toFixed(2)} ${order.currency}`,
          limit: `${parseFloat(order.min_order_amount).toFixed(
            2
          )} - ${parseFloat(order.max_order_amount).toFixed(2)} ${
            order.currency
          }`,
          payment: order.payment_details.map((detail: any) => detail.provider),
          paymentType: order.payment_details.map(
            (detail: any) => detail.payment_method
          ),
          minAmount: parseFloat(order.min_order_amount),
          maxAmount: parseFloat(order.max_order_amount),
          currency: order.currency,
          timeLimit: "10 Minutes",
          avgRealiseTime: "2 Minutes",
          terms_and_conditions: order.terms_and_conditions || "",
          autoReply: order.auto_reply,
          payment_details: order.payment_details,
        };
      })
      .filter((row: MarketRow) => {
        if (currency && row.currency !== currency) return false;

        // Filter by payment method - check if any payment detail has the selected payment method
        if (paymentType && paymentType !== "") {
          const hasPaymentMethod = row.payment_details?.some(
            (detail: any) => detail.payment_method === paymentType
          );
          if (!hasPaymentMethod) return false;
        }

        // Filter by provider - check if any payment detail has the selected provider
        if (provider && provider !== "") {
          const hasProvider = row.payment_details?.some(
            (detail: any) => detail.provider === provider
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
    (activeTab === "buy"
      ? orders?.sell_orders?.total_orders_count
      : orders?.buy_orders?.total_orders_count || 0) / 10
  );

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
          <div className="flex items-center w-full sm:w-auto bg-gray-100 dark:bg-[#18181D] border border-gray-300 dark:border-[#35353E] rounded-lg px-2 py-1 gap-2">
            <div className="">
              <Input
                bgColor="transparent"
                borderColor="transparent"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="bg-transparent h-[8px]  border-none focus:ring-0 text-gray-900 dark:text-white w-full sm:w-36"
              />
            </div>
            <Select
              bgColor="transparent"
              borderColor="transparent"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={currencyOptions}
              placeholder="USDT"
              className="bg-transparent border-none  dark:bg-[#18181D] focus:ring-0 text-gray-900 dark:text-white w-full sm:w-16"
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#18181D] border border-gray-300 dark:border-[#35353E] rounded-lg px-2 py-1">
            <Image
              src="https://res.cloudinary.com/pitz/image/upload/v1746710370/coins-rotate_d278mb.png"
              alt="Filter"
              width={20}
              height={20}
              className="text-[#1D8751]"
            />
            <Select
              bgColor="bg-gray-100 dark:bg-[#23232B]"
              borderColor="border-gray-300 dark:border-[#35353E]"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              options={providerOptions}
              placeholder="Payment Type"
              className="text-gray-900 dark:text-white w-full sm:w-40 bg-[#18181D] border-none focus:ring-0"
            />
          </div>

          <div className="px-2 py-1">
            <Select
              bgColor="bg-gray-100 dark:bg-[#23232B]"
              borderColor="border-gray-300 dark:border-[#35353E]"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              options={providerOptions}
              placeholder="Select Provider"
              className="bg-gray-100 dark:bg-[#18181D] border border-gray-300 dark:border-[#35353E] rounded-lg text-gray-900 dark:text-white w-full sm:w-40"
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
