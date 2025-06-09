import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Input from "../../Common/Input";
import Select from "../../Common/Select";
import Button from "../../Common/Button";
import { FaFilter, FaSyncAlt } from "react-icons/fa";
import { tokens } from "@/styles/tokens";
import MarketTable from "./Table";
import {
  fetchAllP2POrders,
  setCurrentPage,
} from "@/features/p2p/slices/orderSlice";
import { RootState } from "@/store/rootReducer";

interface Option {
  label: string;
  value: string;
}

// Get unique currencies from the orders
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

// Get unique payment providers from the orders
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
  const [mounted, setMounted] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USDT");
  const [paymentType, setPaymentType] = useState("");
  const [provider, setProvider] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch orders only after component is mounted and user is authenticated
  useEffect(() => {
    if (mounted && isAuthenticated) {
      const fetchOrders = async () => {
        dispatch(fetchAllP2POrders(currentPage) as any);
      };
      fetchOrders();
    }
  }, [dispatch, mounted, currentPage, isAuthenticated]);

  // Get dynamic options based on available data
  const currencyOptions = useMemo(() => getCurrencyOptions(orders), [orders]);
  const providerOptions = useMemo(() => getProviderOptions(orders), [orders]);

  // Get the appropriate orders based on activeTab
  const getActiveOrders = useMemo(() => {
    if (!orders) {
      return [];
    }
    const orderType = activeTab === "buy" ? "buy_orders" : "sell_orders";
   
    return orders[orderType]?.results || [];
  }, [orders, activeTab]);

  // Payment type options (example, update as needed)
  const paymentTypeOptions = [
    { label: "All Types", value: "" },
    { label: "Bank Transfer", value: "Bank Transfer" },
    { label: "Mobile Money", value: "Mobile Money" },
    { label: "Merchant", value: "Merchant" },
  ];

  // Transform and filter the data
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
          paymentType: order.payment_details[0]?.type || "",
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
        // Filter by currency
        if (currency && row.currency !== currency) return false;

        // Filter by payment type
        if (paymentType && row.paymentType !== paymentType) return false;

        // Filter by provider
        if (provider && !row.payment.includes(provider)) return false;

        // Filter by amount
        if (amount) {
          const amountValue = parseFloat(amount);
          if (amountValue < row.minAmount || amountValue > row.maxAmount)
            return false;
        }

        // Filter by search query (advertiser name)
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
    dispatch(fetchAllP2POrders(currentPage) as any);
  };

  // Calculate total pages based on the active tab
  const totalPages = Math.ceil(
    (activeTab === "buy"
      ? orders?.buy_orders?.total_orders_count
      : orders?.sell_orders?.total_orders_count || 0) / 10
  );

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
          <div
            className={`flex items-center w-full sm:w-auto bg-[${tokens.colors.dark.card}] border border-[${tokens.colors.dark.border}] rounded-lg px-2 py-1 gap-2`}
          >
           <div className="">
           <Input
              bgColor={tokens.colors.dark.card}
              borderColor={tokens.colors.dark.card}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className={`bg-transparent h-[8px] border-none focus:ring-0 text-[${tokens.colors.dark.textTitle}] w-full sm:w-28`}
            />
           </div>
            <Select
              bgColor={tokens.colors.dark.card}
              borderColor={tokens.colors.dark.card}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={currencyOptions}
              placeholder="USDT"
              className={`bg-transparent border-none focus:ring-0 text-[${tokens.colors.dark.textTitle}] w-full sm:w-16`}
            />
          </div>
          <Select
            bgColor={tokens.colors.dark.card}
            borderColor={tokens.colors.dark.border}
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            options={paymentTypeOptions}
            placeholder="Payment Type"
            className={`bg-[${tokens.colors.dark.card}] border border-[${tokens.colors.dark.border}] rounded-lg text-[${tokens.colors.dark.textBody}] w-full sm:w-40`}
          />
          <Select
            bgColor={tokens.colors.dark.card}
            borderColor={tokens.colors.dark.border}
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            options={providerOptions}
            placeholder="Select Provider"
            className={`bg-[${tokens.colors.dark.card}] border border-[${tokens.colors.dark.border}] rounded-lg text-[${tokens.colors.dark.textBody}] w-full sm:w-40`}
          />
          <Button
            borderColor={tokens.colors.dark.border}
            width={44}
            height={40}
            borderRadius={10}
            variant="outline"
            size="md"
            className={`!bg-[${tokens.colors.dark.card}] !border-[${tokens.colors.dark.border}] border rounded-lg`}
            icon={
              <FaFilter
                className={`text-[${tokens.colors.brand.primary}]`}
                size={26}
              />
            }
          />
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
