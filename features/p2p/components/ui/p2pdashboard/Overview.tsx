import React, { useEffect, useState } from "react";
import { tokens } from "@/styles/tokens";
import Card from "../../Common/Card";
import { useDispatch, useSelector } from "react-redux";
import { selectTransactionSummary } from "@/features/p2p/slices/transactionSummarySlice";
import { fetchTransactionSummary } from "@/features/p2p/slices/transactionSummarySlice";
import { RootState } from "@/store/rootReducer";
import { getAllP2POrders } from "@/features/p2p/api";
import { P2POrder } from "@/features/p2p/types";

const Overview = () => {
  const dispatch = useDispatch();
  const summary = useSelector(selectTransactionSummary);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Add state for date filters and order data
  const [buyDateFilter, setBuyDateFilter] = useState("ALL");
  const [sellDateFilter, setSellDateFilter] = useState("ALL");
  const [orderData, setOrderData] = useState<{
    buyOrders: P2POrder[];
    sellOrders: P2POrder[];
  }>({ buyOrders: [], sellOrders: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch<any>(fetchTransactionSummary());
      fetchOrderData();
    }
  }, [dispatch, isAuthenticated]);

  const fetchOrderData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllP2POrders(1);
      setOrderData({ 
        buyOrders: response.buy_orders?.results || [], 
        sellOrders: response.sell_orders?.results || [] 
      });
    } catch (error) {
      console.error("Error fetching order data:", error);
      setError("Failed to load order data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals for the pie chart using API data
  const deposits = summary?.total_approved_p2p_deposits || 0;
  const withdrawals = summary?.total_approved_p2p_withdrawals || 0;
  const inProgress =
    (summary?.total_pending_p2p_deposits || 0) +
    (summary?.total_pending_p2p_withdrawals || 0);
  const p2p = summary?.total_p2p_orders || 0;
  const chartTotal = deposits + withdrawals + inProgress + p2p;
  const transactionTotal = deposits + withdrawals + p2p;
  const circumference = 2 * Math.PI * 90;
  const depositsDash = (deposits / chartTotal) * circumference;
  const withdrawalsDash = (withdrawals / chartTotal) * circumference;
  const inProgressDash = (inProgress / chartTotal) * circumference;
  const p2pDash = (p2p / chartTotal) * circumference;

  // Calculate safe values to prevent NaN
  const safeTotal = chartTotal || 1; // Prevent division by zero
  const safeDeposits = deposits || 0;
  const safeInProgress = inProgress || 0;
  const safeWithdrawals = withdrawals || 0;

  // Calculate stroke dash values safely
  const calculateStrokeDash = (value: number) => {
    const percentage = (value / safeTotal) * 691;
    return `${Math.max(0, percentage)} ${Math.max(0, 691 - percentage)}`;
  };

  // Calculate stroke dash offset safely
  const calculateStrokeDashOffset = (value: number) => {
    return Math.max(0, 173 - (value / safeTotal) * 691);
  };

  // Helper function to get filtered data based on date range
  const getFilteredData = (data: P2POrder[], dateFilter: string) => {
    if (dateFilter === "ALL") return data;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return data.filter((item) => {
      const itemDate = new Date(item.created_on);

      switch (dateFilter) {
        case "Today":
          const itemDay = new Date(itemDate);
          itemDay.setHours(0, 0, 0, 0);
          return itemDay.getTime() === today.getTime();
        case "Week":
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          return itemDate >= weekAgo;
        case "Month":
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          return itemDate >= monthAgo;
        case "Year":
          const yearAgo = new Date(today);
          yearAgo.setFullYear(today.getFullYear() - 1);
          return itemDate >= yearAgo;
        default:
          return true;
      }
    });
  };

  // Calculate filtered totals for buy orders
  const getFilteredBuyTotals = () => {
    if (buyDateFilter === "ALL") {
      return {
        total: summary?.total_buy_orders || 0,
        completed: summary?.total_buy_orders_by_status?.completed || 0,
        pending: summary?.total_buy_orders_by_status?.pending || 0,
      };
    }

    const filteredBuyOrders = getFilteredData(
      orderData.buyOrders,
      buyDateFilter
    );

    const total = filteredBuyOrders.reduce(
      (sum, order) => sum + parseFloat(order.amount || "0"),
      0
    );
    const completed = filteredBuyOrders
      .filter((order) => order.status === "completed")
      .reduce((sum, order) => sum + parseFloat(order.amount || "0"), 0);
    const pending = filteredBuyOrders
      .filter((order) => order.status === "pending")
      .reduce((sum, order) => sum + parseFloat(order.amount || "0"), 0);

    return { total, completed, pending };
  };

  // Calculate filtered totals for sell orders
  const getFilteredSellTotals = () => {
    if (sellDateFilter === "ALL") {
      return {
        total: summary?.total_sell_orders || 0,
        completed: summary?.total_sell_orders_by_status?.completed || 0,
        pending: summary?.total_sell_orders_by_status?.pending || 0,
      };
    }

    const filteredSellOrders = getFilteredData(
      orderData.sellOrders,
      sellDateFilter
    );

    const total = filteredSellOrders.reduce(
      (sum, order) => sum + parseFloat(order.amount || "0"),
      0
    );
    const completed = filteredSellOrders
      .filter((order) => order.status === "completed")
      .reduce((sum, order) => sum + parseFloat(order.amount || "0"), 0);
    const pending = filteredSellOrders
      .filter((order) => order.status === "pending")
      .reduce((sum, order) => sum + parseFloat(order.amount || "0"), 0);

    return { total, completed, pending };
  };

  const buyTotals = getFilteredBuyTotals();
  const sellTotals = getFilteredSellTotals();

  // Calculate progress percentages for buy/sell
  const buyProgressPercentage =
    buyTotals.total && summary?.total_p2p_orders
      ? (buyTotals.total / summary.total_p2p_orders) * 100
      : 0;

  const sellProgressPercentage =
    sellTotals.total && summary?.total_p2p_orders
      ? (sellTotals.total / summary.total_p2p_orders) * 100
      : 0;

  // Check if there's no data
  const hasNoData = transactionTotal === 0 || chartTotal === 0;

  return (
    <div className="w-full">
     
      <h3 className="dark:text-white text-[#0D0D0D] mb-2 text-xs sm:text-sm font-medium">
        Overview Total
      </h3>
      <Card
        borderColor="border-[#E8EFF5] dark:border-[#35353E]"
        width="w-full"
        bgColor="dark:bg-[#18181D] bg-white"
        borderRadius="rounded-[20px]"
        className="p-3 sm:p-4 md:p-6 flex flex-col items-center justify-center"
      >
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-60 md:h-60 flex items-center justify-center">
          {hasNoData ? (
            <svg className="w-full h-full" viewBox="0 0 220 220">
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke="#35353E"
                strokeWidth="18"
                fill="none"
              />
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke="#35353E"
                strokeWidth="18"
                fill="none"
                strokeDasharray="565.48 565.48"
                strokeDashoffset="0"
                strokeLinecap="butt"
              />
            </svg>
          ) : (
            <svg className="w-full h-full" viewBox="0 0 220 220">
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke="#2D2D37"
                strokeWidth="18"
                fill="none"
              />
              {/* Deposits - Green */}
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke="#1D8751"
                strokeWidth="18"
                fill="none"
                strokeDasharray={`${depositsDash} ${
                  circumference - depositsDash
                }`}
                strokeDashoffset="0"
                strokeLinecap="butt"
              />
              {/* Withdrawals - Red */}
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke="#E23D3A"
                strokeWidth="18"
                fill="none"
                strokeDasharray={`${withdrawalsDash} ${
                  circumference - withdrawalsDash
                }`}
                strokeDashoffset={`-${depositsDash}`}
                strokeLinecap="butt"
              />
              {/* In Progress - Yellow */}
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke="#FFD600"
                strokeWidth="18"
                fill="none"
                strokeDasharray={`${inProgressDash} ${
                  circumference - inProgressDash
                }`}
                strokeDashoffset={`-${depositsDash + withdrawalsDash}`}
                strokeLinecap="butt"
              />
              {/* P2P - Blue */}
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke="#386AB5"
                strokeWidth="18"
                fill="none"
                strokeDasharray={`${p2pDash} ${circumference - p2pDash}`}
                strokeDashoffset={`-${
                  depositsDash + withdrawalsDash + inProgressDash
                }`}
                strokeLinecap="butt"
              />
            </svg>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
           
            <span className="text-xs sm:text-sm md:text-[15px] font-bold dark:text-white text-[#0D0D0D]">
              {transactionTotal.toLocaleString()} USD
            </span>
            <span className="dark:text-[#A0A0A0] text-[#788099] text-[10px] sm:text-xs md:text-base">
              Transactions
            </span>
          </div>
        </div>
        <div className="mt-3 sm:mt-4 md:mt-6 w-full flex flex-col gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 rounded-full bg-[#1D8751] inline-block flex-shrink-0" />
            <span className="dark:text-white text-[#0D0D0D] text-xs sm:text-sm md:text-base">Deposits</span>
            <span className="ml-auto text-white/80 dark:text-white/80 text-xs sm:text-sm md:text-base">
              {deposits.toLocaleString()} USD
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 rounded-full bg-[#E23D3A] inline-block flex-shrink-0" />
            <span className="dark:text-white text-[#0D0D0D] text-xs sm:text-sm md:text-base">Withdrawals</span>
            <span className="ml-auto text-white/80 dark:text-white/80 text-xs sm:text-sm md:text-base">
              {withdrawals.toLocaleString()} USD
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 rounded-full bg-[#FFD600] inline-block flex-shrink-0" />
            <span className="dark:text-white text-[#0D0D0D] text-xs sm:text-sm md:text-base">In Progress</span>
            <span className="ml-auto text-white/80 dark:text-white/80 text-xs sm:text-sm md:text-base">
              {inProgress.toLocaleString()} USD
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 rounded-full bg-[#386AB5] inline-block flex-shrink-0" />
            <span className="dark:text-white text-[#0D0D0D] text-xs sm:text-sm md:text-base">P2P</span>
            <span className="ml-auto text-white/80 dark:text-white/80 text-xs sm:text-sm md:text-base">
              {p2p.toLocaleString()} USD
            </span>
          </div>
        </div>
      </Card>

      <div className="flex gap-3 sm:gap-4 flex-col mt-3 sm:mt-4">
        {/* P2P Buys Card */}
        <Card
          borderColor="border-[#E8EFF5] dark:border-[#35353E]"
          width="w-full"
          bgColor="dark:bg-[#18181D] bg-white"
          borderRadius="rounded-[14px]"
          className="p-3 sm:p-4"
        >
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
              <h3 className="font-medium text-sm sm:text-base dark:text-white text-[#0D0D0D]">
                P2P Buys
              </h3>
              <div className="relative flex-shrink-0">
                <select
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm appearance-none pr-6 sm:pr-8 dark:bg-[#18181D] bg-white dark:text-[#A0A0A0] text-[#788099]"
                  value={buyDateFilter}
                  onChange={(e) => setBuyDateFilter(e.target.value)}
                  disabled={loading}
                >
                  <option value="ALL">ALL</option>
                  <option value="Today">Today</option>
                  <option value="Week">Week</option>
                  <option value="Month">Month</option>
                  <option value="Year">Year</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-1 sm:pr-2 pointer-events-none">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 dark:text-white text-[#0D0D0D]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="mb-2 sm:mb-3">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-2">
                <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">
                  P2P Trading amount
                </span>
                <span className="text-sm sm:text-lg font-semibold text-white/90 dark:text-white/90">
                  {buyTotals.total.toLocaleString()} USD
                </span>
              </div>
              <div className="w-full bg-[#2D2D37] rounded-r-full h-2 sm:h-3">
                <div
                  className="bg-[#1D8751] h-2 sm:h-3 rounded-r-full transition-all duration-300"
                  style={{ width: `${Math.min(buyProgressPercentage, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#1D8751] inline-block flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">
                    Completed:
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white/80 dark:text-white/80">
                  {buyTotals.completed.toLocaleString()} USD
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FFD600] inline-block flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">
                    Pending:
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white/80 dark:text-white/80">
                  {buyTotals.pending.toLocaleString()} USD
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* P2P Sells Card */}
        <Card
          borderColor="border-[#E8EFF5] dark:border-[#35353E]"
          width="w-full"
          bgColor="dark:bg-[#18181D] bg-white"
          borderRadius="rounded-[14px]"
          className="p-3 sm:p-4"
        >
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
              <h3 className="font-medium text-sm sm:text-base dark:text-white text-[#0D0D0D]">
                P2P Sells
              </h3>
              <div className="relative flex-shrink-0">
                <select
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm appearance-none pr-6 sm:pr-8 dark:bg-[#18181D] bg-white dark:text-[#A0A0A0] text-[#788099]"
                  value={sellDateFilter}
                  onChange={(e) => setSellDateFilter(e.target.value)}
                  disabled={loading}
                >
                  <option value="ALL">ALL</option>
                  <option value="Today">Today</option>
                  <option value="Week">Week</option>
                  <option value="Month">Month</option>
                  <option value="Year">Year</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-1 sm:pr-2 pointer-events-none">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 dark:text-white text-[#0D0D0D]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="mb-2 sm:mb-3">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">
                  P2P Trading amount
                </span>
                <span className="text-sm sm:text-lg font-semibold text-white/90 dark:text-white/90">
                  {sellTotals.total.toLocaleString()} USD
                </span>
              </div>
              <div className="w-full bg-[#2D2D37] rounded-r-full h-2.5 sm:h-3">
                <div
                  className="bg-[#E23D3A] h-2.5 sm:h-3 rounded-r-full transition-all duration-300"
                  style={{ width: `${Math.min(sellProgressPercentage, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#1D8751] inline-block flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">
                    Completed:
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white/80 dark:text-white/80">
                  {sellTotals.completed.toLocaleString()} USD
                </span>
              </div>
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FFD600] inline-block flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">
                    Pending:
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white/80 dark:text-white/80">
                  {sellTotals.pending.toLocaleString()} USD
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
