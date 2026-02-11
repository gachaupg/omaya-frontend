import React, { useEffect, useState } from "react";
import { tokens } from "@/styles/tokens";
import Card from "../../Common/Card";
import { formatCurrency } from "@/lib/globalFormatter";
import { useDispatch, useSelector } from "react-redux";
import { selectTransactionSummary } from "@/features/p2p/slices/transactionSummarySlice";
import { fetchTransactionSummary } from "@/features/p2p/slices/transactionSummarySlice";
import { RootState } from "@/store/rootReducer";
import { getAllP2POrders } from "@/features/p2p/api";
import { P2POrder } from "@/features/p2p/types";

const Overview = () => {
  const dispatch = useDispatch();
  const summary = useSelector(selectTransactionSummary);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

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
      let allOrders: any[] = [];
      let currentPage = 1;
      let hasMorePages = true;

      // Fetch all pages
      while (hasMorePages) {
        const response: any = await getAllP2POrders(currentPage);
        
        // Handle the new API structure with flat results array
        const results = response.results || [];
        allOrders = [...allOrders, ...results];

        // Check if there are more pages
        hasMorePages = response.next !== null;
        
        currentPage++;
        
        // Safety limit to prevent infinite loops
        if (currentPage > 100) break;
      }

      // Process all orders and categorize based on ownership
      const processedBuyOrders: P2POrder[] = [];
      const processedSellOrders: P2POrder[] = [];

      // Get logged-in user's email from auth state
      const loggedUserEmail = user?.email || '';

      allOrders.forEach((order: any) => {
        const isOwner = order.owner === loggedUserEmail;
        let orderType = order.order_type;

        // If user is not the owner, flip the order type
        if (!isOwner) {
          orderType = orderType === 'sell' ? 'buy' : 'sell';
        }

        // Categorize based on the processed order type
        if (orderType === 'buy') {
          processedBuyOrders.push({ ...order, order_type: orderType });
        } else {
          processedSellOrders.push({ ...order, order_type: orderType });
        }
      });

      setOrderData({
        buyOrders: processedBuyOrders,
        sellOrders: processedSellOrders
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
  // Order: Pending, Deposits, Withdrawals, P2P
  const pendingDash = (inProgress / chartTotal) * circumference;
  const depositsDash = (deposits / chartTotal) * circumference;
  const withdrawalsDash = (withdrawals / chartTotal) * circumference;
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
      const itemDate = new Date((item as any).timestamp || item.created_on);

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
      .filter((order) => order.status !== "completed")
      .reduce((sum, order) => sum + parseFloat(order.amount || "0"), 0);

    return { total, completed, pending };
  };

  // Calculate filtered totals for sell orders
  const getFilteredSellTotals = () => {
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
      .filter((order) => order.status !== "completed")
      .reduce((sum, order) => sum + parseFloat(order.amount || "0"), 0);

    return { total, completed, pending };
  };

  const buyTotals = getFilteredBuyTotals();
  const sellTotals = getFilteredSellTotals();

  // Calculate the total for progress bars based on filtered data
  const filteredP2PTotal = buyTotals.total + sellTotals.total;
  const safeFilteredTotal = filteredP2PTotal || 1; // Prevent division by zero

  // Calculate progress percentages for buy/sell using filtered totals
  const buyProgressPercentage = (buyTotals.total / safeFilteredTotal) * 100;
  const sellProgressPercentage = (sellTotals.total / safeFilteredTotal) * 100;

  // Check if there's no data (chartTotal includes pending, deposits, withdrawals, p2p)
  const hasNoData = chartTotal === 0;

  return (
    <div className="w-full">

      <h3 className="dark:text-white text-[#0D0D0D] mb-2 text-xs sm:text-sm font-medium">
        Overview Total
      </h3>
      <Card
        borderColor="border-[#E8EFF5] dark:border-[#35353E]"
        width="w-full"
        bgColor="dark:bg-[var(--card-color)] bg-white"
        borderRadius="rounded-[20px]"
        className="p-2 md:p-4 flex flex-col items-stretch justify-center border"
      >
        <div className="relative w-full max-w-[220px] aspect-square mx-auto flex items-center justify-center">
          {hasNoData ? (
            <svg className="w-full h-full overflow-visible" viewBox="0 0 220 220">
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
            <svg className="w-full h-full overflow-visible" viewBox="0 0 220 220">
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke="#2D2D37"
                strokeWidth="18"
                fill="none"
              />
              {/* Pending - Yellow */}
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke="#FFD600"
                strokeWidth="18"
                fill="none"
                strokeDasharray={`${pendingDash} ${circumference - pendingDash}`}
                strokeDashoffset="0"
                strokeLinecap="butt"
              />
              {/* Deposits - Green */}
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke="#1D8751"
                strokeWidth="18"
                fill="none"
                strokeDasharray={`${depositsDash} ${circumference - depositsDash}`}
                strokeDashoffset={`-${pendingDash}`}
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
                strokeDasharray={`${withdrawalsDash} ${circumference - withdrawalsDash}`}
                strokeDashoffset={`-${pendingDash + depositsDash}`}
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
                strokeDashoffset={`-${pendingDash + depositsDash + withdrawalsDash}`}
                strokeLinecap="butt"
              />
            </svg>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center">

            <span className="text-xs sm:text-sm md:text-[15px] font-bold text-gray-900 dark:text-white">
              {formatCurrency(summary?.total_volume ?? 0, "USD")}
            </span>
            <span className="text-[10px] sm:text-xs md:text-base text-gray-500 dark:text-gray-400">
              Total Volume
            </span>
          </div>
        </div>
        <div className="mt-3 sm:mt-4 md:mt-6 w-full flex flex-col gap-1.5 sm:gap-2">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#FFD600] inline-block flex-shrink-0" />
            <span className="text-neutral-500 text-xs sm:text-sm md:text-base">Pending</span>
            <span className="text-right text-[#0D0D0D] dark:text-white/80 text-xs sm:text-sm">
              {inProgress.toLocaleString()} USD
            </span>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#1D8751] inline-block flex-shrink-0" />
            <span className="text-neutral-500 text-xs sm:text-sm md:text-base">Deposits</span>
            <span className="text-right text-[#0D0D0D] dark:text-white/80 text-xs sm:text-sm">
              {deposits.toLocaleString()} USD
            </span>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#E23D3A] inline-block flex-shrink-0" />
            <span className="text-neutral-500 text-xs sm:text-sm md:text-base truncate max-w-20 sm:max-w-[120px]">Withdrawals</span>
            <span className="text-[#0D0D0D] dark:text-white/80 text-xs sm:text-sm">
              {withdrawals.toLocaleString()} USD
            </span>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#386AB5] inline-block flex-shrink-0" />
            <span className="text-neutral-500 text-xs sm:text-sm md:text-base">P2P</span>
            <span className="text-[#0D0D0D] dark:text-white/80 text-xs sm:text-sm">
              {p2p.toLocaleString()} USD
            </span>
          </div>
        </div>
      </Card>

      <div className="flex  flex-col mt-3 sm:mt-4">
        {/* P2P Buys Card */}
        <h3 className="mb-3 font-medium text-sm sm:text-base dark:text-white text-[#0D0D0D]">
          P2P Buys
        </h3>
        <Card
          borderColor="border-[#E8EFF5] dark:border-[#35353E]"
          width="w-full"
          bgColor="dark:bg-[var(--card-color)] bg-white"
          borderRadius="rounded-[14px]"
          className="p-2 md:p-4 mb-2 sm:mb-4 border"
        >
          <div className="flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[13px] sm:text-base md:text-lg text-[#0D0D0D] dark:text-white/90">
                {buyTotals.total.toLocaleString()} USD
              </span>

              <div className="relative flex-shrink-0">
                <select
                  className="
            px-2 sm:px-3 
            py-1 sm:py-1.5 
            rounded 
            text-[10px] sm:text-xs md:text-sm 
            appearance-none 
            pr-5 sm:pr-7 
            dark:bg-[var(--card-color)] bg-white 
            dark:text-[#A0A0A0] text-[#788099]
          "
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

            {/* Progress */}
            <div className="mb-2 sm:mb-3">
              <div className="w-full bg-[#2D2D37] rounded-r-full h-2 sm:h-2.5 md:h-3">
                <div
                  className="bg-[#1D8751] h-2 sm:h-2.5 md:h-3 rounded-r-full transition-all duration-300"
                  style={{ width: `${Math.min(buyProgressPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col gap-1.5 sm:gap-2">

              {/* Completed */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#1D8751]" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">
                    Completed:
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm dark:text-white/80 text-muted-foreground">
                  {buyTotals.completed.toLocaleString()} USD
                </span>
              </div>

              {/* Pending */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#FFD600]" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">
                    Pending:
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm dark:text-white/80 text-muted-foreground">
                  {buyTotals.pending.toLocaleString()} USD
                </span>
              </div>

            </div>

          </div>
        </Card>


        {/* P2P Sells Card */}
        <h3 className="mb-3 font-medium text-sm sm:text-base dark:text-white text-[#0D0D0D]">
          P2P Sells
        </h3>
        <Card
          borderColor="border-[#E8EFF5] dark:border-[#35353E]"
          width="w-full"
          bgColor="dark:bg-[var(--card-color)] bg-white"
          borderRadius="rounded-[14px]"
          className="p-2 sm:p-3 md:p-4 border"
        >
          <div className="flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[13px] sm:text-base md:text-lg text-[#0D0D0D] dark:text-white/90">
                {sellTotals.total.toLocaleString()} USD
              </span>

              <div className="relative flex-shrink-0">
                <select
                  className="
            px-2 sm:px-3 
            py-1 sm:py-1.5 
            rounded 
            text-[10px] sm:text-xs md:text-sm 
            appearance-none 
            pr-5 sm:pr-7 
            dark:bg-[var(--card-color)] bg-white 
            dark:text-[#A0A0A0] text-[#788099]
          "
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
              <div className="w-full bg-[#2D2D37] h-2 sm:h-2.5 md:h-3 rounded-r-full">
                <div
                  className="bg-[#E23D3A] h-2 sm:h-2.5 md:h-3 rounded-r-full transition-all duration-300"
                  style={{ width: `${Math.min(sellProgressPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col gap-1.5 sm:gap-2">

              {/* Completed */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#1D8751]" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">
                    Completed:
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm dark:text-white/80 text-muted-foreground">
                  {sellTotals.completed.toLocaleString()} USD
                </span>
              </div>

              {/* Pending */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#FFD600]" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">
                    Pending:
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm dark:text-white/80 text-muted-foreground">
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
