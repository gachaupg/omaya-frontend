import React, { useState, useMemo, useEffect } from "react";
import Button from "../../Common/Button";
import PaymentMethods from "./sections/PaymentMethods";
import Feedback from "./sections/Feedback";
import MyAdsTable from "./sections/MyAdsTable";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store/rootReducer";
import { fetchFeedback } from "@/features/p2p/slices/feedbackSlice";

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
    type: "Type",
    status: "Status",
    date: "Date",
  });

  /** Store */
  const dispatch = useDispatch<AppDispatch>();
  const { data: feedbackData } = useSelector((state: RootState) => state.feedback);

  // Fetch feedback data on mount
  useEffect(() => {
    dispatch(fetchFeedback());
  }, [dispatch]);

  // Calculate feedback statistics
  const feedbackStats = useMemo(() => {
    const total = feedbackData?.length || 0;
    const positive = feedbackData?.filter((f) => f.is_positive).length || 0;
    const negative = total - positive;
    const positivePercentage = total > 0 ? (positive / total) * 100 : 0;
    const negativePercentage = total > 0 ? (negative / total) * 100 : 0;
    
    return { total, positive, negative, positivePercentage, negativePercentage };
  }, [feedbackData]);

  // Calculate ad status indicators
  const adStatusIndicators = useMemo(() => {
    // Ensure myOrders is an array before filtering
    const safeMyOrders = Array.isArray(myOrders) ? myOrders : [];
    const liveAds = safeMyOrders.filter((order: any) => 
      order && typeof order === 'object' && (order.status === 'published' || order.status === 'pending')
    );
    const offlineAds = safeMyOrders.filter((order: any) => 
      order && typeof order === 'object' && order.status === 'offline'
    );
    
    return {
      hasLiveAds: liveAds.length > 0,
      hasOfflineAds: offlineAds.length > 0,
    };
  }, [myOrders]);

  /** Tabs */
  const tabList = [
    { label: "Payment Methods" },
    { 
      label: (
        <>
          Feedback <span className="text-[#F79330] font-bold">({feedbackStats.total})</span>
        </>
      )
    },
    {
      label: "My Ads",
      extra: (
        <span className="text-[#E23D3A] font-bold">({myOrders.length})</span>
      ),
    },
    { label: "+ Post New Ad" },
  ];

  const handleTabClick = (idx: number) => {
    setActiveTab(idx);
    if (idx === 3) window.location.href = "/adds?type=buy";
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
        trade.order_type &&
        typeof trade.order_type === 'string' &&
        trade.order_type.toLowerCase() !== filters.type.toLowerCase()
      )
        return false;
      if (
        filters.status !== "Status" &&
        trade.status &&
        typeof trade.status === 'string' &&
        trade.status.toLowerCase() !== filters.status.toLowerCase()
      )
        return false;
      if (filters.date !== "Date" && trade.created_on) {
        try {
          const tradeDate = new Date(trade.created_on);
          if (isNaN(tradeDate.getTime())) return false; // Invalid date
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          switch (filters.date) {
            case "Today": {
              const d = new Date(tradeDate);
              d.setHours(0, 0, 0, 0);
              if (d.getTime() !== today.getTime()) return false;
              break;
            }
            case "Yesterday": {
              const y = new Date(today);
              y.setDate(today.getDate() - 1);
              const d = new Date(tradeDate);
              d.setHours(0, 0, 0, 0);
              if (d.getTime() !== y.getTime()) return false;
              break;
            }
            case "Last 7 Days": {
              const weekAgo = new Date(today);
              weekAgo.setDate(today.getDate() - 7);
              if (tradeDate < weekAgo) return false;
              break;
            }
            case "Last 30 Days": {
              const mAgo = new Date(today);
              mAgo.setDate(today.getDate() - 30);
              if (tradeDate < mAgo) return false;
              break;
            }
            case "Last 90 Days": {
              const qAgo = new Date(today);
              qAgo.setDate(today.getDate() - 90);
              if (tradeDate < qAgo) return false;
              break;
            }
            case "Last 180 Days": {
              const hAgo = new Date(today);
              hAgo.setDate(today.getDate() - 180);
              if (tradeDate < hAgo) return false;
              break;
            }
          }
        } catch (e) {
          // If date parsing fails, skip this trade
          return false;
        }
      }
      return true;
    });
  }, [myOrders, filters]);

  /** My-Ads filter bar */
  const MyAdsFilterBar = () => (
    <div className="flex flex-col mb-6 sm:flex-row gap-4 items-start sm:items-center justify-between w-full">
      {/* Token */}
      <div className="flex items-center bg-gray-100 dark:bg-[#23242A] rounded-full px-5 py-2.5 w-full sm:w-auto">
        <img
          src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
          alt="Tether"
          className="w-7 h-7 mr-2.5"
        />
        <span className="text-gray-900 dark:text-white mr-2 text-base font-semibold">Tether</span>
        <span className="text-[#788099] text-base font-medium">USDT</span>
        <select
          className="bg-transparent text-gray-900 dark:text-white ml-2 outline-none w-full sm:w-auto text-base font-medium"
          value={filters.token}
          onChange={(e) => setFilters((p) => ({ ...p, token: e.target.value }))}
        >
          <option>Tether</option>
        </select>
      </div>
      {/* Type */}
      <select
        className="bg-gray-100 dark:bg-[#23242A] rounded-full px-5 py-2.5 text-gray-900 dark:text-white outline-none w-full sm:w-auto text-base font-semibold"
        value={filters.type}
        onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
      >
        <option>All</option>
        <option>Buy</option>
        <option>Sell</option>
      </select>
      {/* Status */}
      <select
        className="bg-gray-100 dark:bg-[#23242A] rounded-full px-5 py-2.5 text-gray-900 dark:text-white outline-none w-full sm:w-auto text-base font-semibold"
        value={filters.status}
        onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
      >
        <option>Status</option>
        <option>Published</option>
        <option>Offline</option>
      </select>
      {/* Date */}
      <select
        className="bg-gray-100 dark:bg-[#23242A] rounded-full px-5 py-2.5 text-gray-900 dark:text-white outline-none w-full sm:w-auto text-base font-semibold"
        value={filters.date}
        onChange={(e) => setFilters((p) => ({ ...p, date: e.target.value }))}
      >
        <option>All</option>
        <option>Today</option>
        <option>Yesterday</option>
        <option>Last 7 Days</option>
        <option>Last 30 Days</option>
        <option>Last 90 Days</option>
        <option>Last 180 Days</option>
      </select>
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
              className={`${
                activeTab === idx ? "" : "text-[#1D8751]"
              } cursor-pointer min-w-[120px] sm:min-w-[172px]`}
              onClick={() => handleTabClick(idx)}
            >
              {tab.label} {tab.extra}
            </Button>
          ))}
        </div>
    <div className="flex flex-col gap-3 w-full sm:w-auto">
      {activeTab === 1 ? (
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
        {activeTab === 0 && <PaymentMethods />}
        {activeTab === 1 && <Feedback />}
        {activeTab === 2 && (
          <>
            <MyAdsFilterBar />
            <MyAdsTable trades={filteredTrades} loading={myOrdersLoading} />
          </>
        )}
      </div>
    </div>
  );
};

export default FilterTabs;
