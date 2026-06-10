import React, { useState, useMemo, useEffect } from "react";
import Button from "../../Common/Button";
import PaymentMethods from "./sections/PaymentMethods";
import Feedback from "./sections/Feedback";
import MyAdsTable from "./sections/MyAdsTable";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store/rootReducer";
import { fetchFeedback } from "@/features/p2p/slices/feedbackSlice";
import {
  MY_ADS_DATE_FILTER_OPTIONS,
  formatMyAdsCustomRangeLabel,
  matchesMyAdsDateFilter,
  type MyAdsDateFilterValue,
} from "@/features/p2p/utils/myAdsDateFilter";

interface FilterTabsProps {
  transformedTrades: any[];
  myOrders: any[];
  loading: boolean;
  myOrdersLoading: boolean;
}

const FilterTabs: React.FC<FilterTabsProps> = ({
  transformedTrades,
  myOrders,
  loading,
  myOrdersLoading,
}) => {
  /** Local state */
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({
    token: "Tether",
    type: "All",
    status: "All",
    date: "All Time" as MyAdsDateFilterValue,
    customDateFrom: "" as string,
    customDateTo: "" as string,
  });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [draftCustomDateFrom, setDraftCustomDateFrom] = useState("");
  const [draftCustomDateTo, setDraftCustomDateTo] = useState("");

  /** Store */
  const dispatch = useDispatch<AppDispatch>();
  const { data: feedbackData } = useSelector((state: RootState) => state.feedback);

  // Fetch feedback data on mount
  useEffect(() => {
    dispatch(fetchFeedback());
  }, [dispatch]);

  // Calculate feedback statistics (support both array and { feedbacks } response)
  const feedbackList = Array.isArray(feedbackData)
    ? feedbackData
    : ((feedbackData as { feedbacks?: any[] } | null | undefined)?.feedbacks ?? []);
  const feedbackStats = useMemo(() => {
    const total = feedbackList.length;
    const positive = feedbackList.filter((f: any) => f?.is_positive).length;
    const negative = total - positive;
    const positivePercentage = total > 0 ? (positive / total) * 100 : 0;
    const negativePercentage = total > 0 ? (negative / total) * 100 : 0;

    return { total, positive, negative, positivePercentage, negativePercentage };
  }, [feedbackList]);

  // Calculate ad status indicators
  const adStatusIndicators = useMemo(() => {
    // Ensure myOrders is an array before filtering
    const safeMyOrders = Array.isArray(myOrders) ? myOrders : [];
    const liveAds = safeMyOrders.filter(
      (order: any) =>
        order && typeof order === "object" && order.status === "published"
    );
    const offlineAds = safeMyOrders.filter((order: any) =>
      order && typeof order === 'object' && order.status === 'offline'
    );

    return {
      hasLiveAds: liveAds.length > 0,
      hasOfflineAds: offlineAds.length > 0,
    };
  }, [myOrders]);

  /** Tabs — order: My Ads (0) → + Post New Ad (1) → Payment Methods (2) → Feedback (3) */
  const tabList = [
    {
      label: "My Ads",
      extra: (
        <span className="text-[#E23D3A] font-bold">({myOrders.length})</span>
      ),
    },
    { label: "+ Post New Ad" },
    { label: "Payment Methods" },
    {
      label: (
        <>
          Feedback <span className="text-[#F79330] font-bold">({feedbackStats.total})</span>
        </>
      )
    },
  ];

  const handleTabClick = (idx: number) => {
    setActiveTab(idx);
    if (idx === 1) window.location.href = "/adds?type=buy";
  };

  /** Derived — filtered trades for My Ads */
  const filteredTrades = useMemo(() => {
    // Ensure myOrders is an array before filtering
    const safeMyOrders = Array.isArray(myOrders) ? myOrders : [];
    return safeMyOrders.filter((trade: any) => {
      // Skip invalid trades
      if (!trade || typeof trade !== 'object') return false;

      if (filters.token !== "Tether" && trade.currency !== filters.token)
        return false;
      if (
        filters.type !== "Type" &&
        filters.type !== "All" &&
        trade.order_type &&
        typeof trade.order_type === 'string' &&
        trade.order_type.toLowerCase() !== filters.type.toLowerCase()
      )
        return false;
      if (filters.status !== "Status" && filters.status !== "All") {
        const s =
          typeof trade.status === "string" ? trade.status.toLowerCase() : "";
        const selected = filters.status.toLowerCase();

        if (selected === "published" && s !== "published") return false;
        if (selected === "pending" && s !== "pending") return false;
        if (selected === "offline" && s !== "offline") return false;
      }
      if (
        !matchesMyAdsDateFilter(
          trade.created_on,
          filters.date,
          filters.customDateFrom || undefined,
          filters.customDateTo || undefined
        )
      ) {
        return false;
      }
      return true;
    });
  }, [myOrders, filters]);

  const handleDateFilterChange = (value: string) => {
    if (value === "Custom Range") {
      setDraftCustomDateFrom(filters.customDateFrom || "");
      setDraftCustomDateTo(filters.customDateTo || "");
      setShowCustomDatePicker(true);
      return;
    }
    setShowCustomDatePicker(false);
    setFilters((p) => ({
      ...p,
      date: value as MyAdsDateFilterValue,
      customDateFrom: "",
      customDateTo: "",
    }));
  };

  const handleCustomDateApply = () => {
    if (!draftCustomDateFrom || !draftCustomDateTo) return;
    if (draftCustomDateFrom > draftCustomDateTo) return;
    setFilters((p) => ({
      ...p,
      date: "Custom Range",
      customDateFrom: draftCustomDateFrom,
      customDateTo: draftCustomDateTo,
    }));
    setShowCustomDatePicker(false);
  };

  const dateSelectDisplayValue =
    filters.date === "Custom Range" && filters.customDateFrom && filters.customDateTo
      ? formatMyAdsCustomRangeLabel(filters.customDateFrom, filters.customDateTo)
      : filters.date;

  /** My-Ads filter bar */
  const MyAdsFilterBar = () => (
    <div className="flex flex-col mb-6 w-full gap-3">
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between w-full">
      {/* Token */}
      <div className="flex items-center justify-center bg-gray-100 dark:bg-[var(--card-color)] rounded-full px-5 py-2.5 w-full sm:w-auto gap-2.5">
        <img
          src="/images/tether.svg"
          alt=""
          className="w-7 h-7 shrink-0"
        />
        <span className="text-gray-900 dark:text-white text-base font-semibold">
          USDT
        </span>
        <select
          className="sr-only"
          value={filters.token}
          onChange={(e) => setFilters((p) => ({ ...p, token: e.target.value }))}
          aria-label="Token filter"
        >
          <option>Tether</option>
        </select>
      </div>
      {/* Type */}
      <select
        className="bg-gray-100 dark:bg-[var(--card-color)] rounded-full px-5 py-2.5 text-gray-900 dark:text-white outline-none w-full sm:w-auto text-base font-semibold"
        value={filters.type}
        onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
      >
        <option value="All">All</option>
        <option value="Buy">Buy</option>
        <option value="Sell">Sell</option>
      </select>
      {/* Status */}
      <select
        className="bg-gray-100 dark:bg-[var(--card-color)] rounded-full px-5 py-2.5 text-gray-900 dark:text-white outline-none w-full sm:w-auto text-base font-semibold"
        value={filters.status}
        onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
      >
        <option value="All">All</option>
        <option value="Published">Published</option>
        <option value="Offline">Offline</option>
      </select>
      {/* Date */}
      <select
        className="bg-gray-100 dark:bg-[var(--card-color)] rounded-full px-5 py-2.5 text-gray-900 dark:text-white outline-none w-full sm:w-auto text-base font-semibold min-w-[140px]"
        value={filters.date}
        onChange={(e) => handleDateFilterChange(e.target.value)}
        aria-label="Filter ads by date"
      >
        {MY_ADS_DATE_FILTER_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {filters.date === "Custom Range" &&
            opt.value === "Custom Range" &&
            filters.customDateFrom &&
            filters.customDateTo
              ? formatMyAdsCustomRangeLabel(
                  filters.customDateFrom,
                  filters.customDateTo
                )
              : opt.label}
          </option>
        ))}
      </select>
      {filters.date !== "All Time" && (
        <button
          type="button"
          onClick={() => handleDateFilterChange("All Time")}
          className="text-sm font-medium text-[#1D8751] hover:underline whitespace-nowrap"
        >
          Clear date
        </button>
      )}
      {/* Actions */}
      {/* <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <button className="w-full sm:w-auto px-4 py-2 rounded-full bg-[#1D8751] text-white">
          Publish
        </button>
        <button className="w-full sm:w-auto px-4 py-2 rounded-full border border-[#788099] text-[#788099] bg-transparent">
          Put Offline
        </button>
      </div> */}
    </div>

    {(showCustomDatePicker || filters.date === "Custom Range") && (
      <div className="w-full rounded-2xl border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Custom date range
          {dateSelectDisplayValue !== "Custom Range" &&
          dateSelectDisplayValue !== "Custom Date Range"
            ? ` · ${dateSelectDisplayValue}`
            : ""}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              From
            </label>
            <input
              type="date"
              value={draftCustomDateFrom}
              onChange={(e) => setDraftCustomDateFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#1D1D23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D8751] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:dark:invert"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              To
            </label>
            <input
              type="date"
              value={draftCustomDateTo}
              onChange={(e) => setDraftCustomDateTo(e.target.value)}
              min={draftCustomDateFrom || undefined}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#1D1D23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D8751] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:dark:invert"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setShowCustomDatePicker(false);
                if (filters.date === "Custom Range") {
                  setDraftCustomDateFrom(filters.customDateFrom);
                  setDraftCustomDateTo(filters.customDateTo);
                } else {
                  setDraftCustomDateFrom("");
                  setDraftCustomDateTo("");
                }
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#35353E] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#35353E] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCustomDateApply}
              disabled={
                !draftCustomDateFrom ||
                !draftCustomDateTo ||
                draftCustomDateFrom > draftCustomDateTo
              }
              className="px-4 py-2 rounded-lg bg-[#1D8751] text-white hover:bg-[#16663d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>
        {draftCustomDateFrom &&
          draftCustomDateTo &&
          draftCustomDateFrom > draftCustomDateTo && (
            <p className="text-red-500 text-sm mt-2">
              End date must be on or after start date.
            </p>
          )}
      </div>
    )}
    </div>
  );

  /** Render */
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center w-full">
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          {tabList.map((tab, idx) => (
            <Button
              key={typeof tab.label === 'string' ? tab.label : `tab-${idx}`}
              variant={activeTab === idx ? "primary" : "outline"}
              width={172}
              height={44}
              borderRadius={24}
              borderColor={activeTab === idx ? undefined : "#1D8751"}
              className={`${activeTab === idx ? "" : "text-[#1D8751]"
                } cursor-pointer min-w-[120px] sm:min-w-[172px]`}
              onClick={() => handleTabClick(idx)}
            >
              {tab.label} {tab.extra}
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-3 w-full sm:w-auto">
          {activeTab === 3 ? (
            <>
              {/* Positive Feedback Status - Only show when Feedback tab is active */}
              <div className="flex items-center gap-3">
                <ThumbsUp className="w-5 h-5 text-[#1D8751]" />
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 min-w-[120px]">
                  <div
                    className="bg-[#1D8751] h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${feedbackStats.positivePercentage}%` }}
                  ></div>
                </div>
                <span className="text-[#1D8751] text-base font-bold">({feedbackStats.positive})</span>
              </div>

              {/* Negative Feedback Status - Only show when Feedback tab is active */}
              <div className="flex items-center gap-3">
                <ThumbsDown className="w-5 h-5 text-[#FA615F]" />
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 min-w-[120px]">
                  <div
                    className="bg-[#FA615F] h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${feedbackStats.negativePercentage}%` }}
                  ></div>
                </div>
                <span className="text-[#FA615F] text-base font-bold">({feedbackStats.negative})</span>
              </div>
            </>
          ) : (
            <>
              {/* Live Ads Exist Legend - Show when other tabs are active */}
              {adStatusIndicators.hasLiveAds && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#1D8751] rounded"></div>
                  <span className="text-gray-900 dark:text-white text-sm font-medium">Live Ads Exist</span>
                </div>
              )}

              {/* Offline Ads Exist Legend - Show when other tabs are active */}
              {adStatusIndicators.hasOfflineAds && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#E23D3A] rounded"></div>
                  <span className="text-gray-900 dark:text-white text-sm font-medium">Offline Ads Exist</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        {activeTab === 0 && (
          <>
            <MyAdsFilterBar />
            <MyAdsTable trades={filteredTrades} loading={myOrdersLoading} />
          </>
        )}
        {activeTab === 2 && <PaymentMethods />}
        {activeTab === 3 && <Feedback />}
      </div>
    </div>
  );
};

export default FilterTabs;
