import React, { useState, useMemo } from "react";
import Button from "../../Common/Button";
import PaymentMethods from "./sections/PaymentMethods";
import Feedback from "./sections/Feedback";
import MyAdsTable from "./sections/MyAdsTable";

interface FilterTabsProps {
  transformedTrades: any[];
  loading: boolean;
}

const FilterTabs: React.FC<FilterTabsProps> = ({
  transformedTrades,
  loading,
}) => {
  /** Local state */
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({
    token: "Tether",
    type: "Type",
    status: "Status",
    date: "Date",
  });

  /** Tabs */
  const tabList = [
    { label: "Payment Methods" },
    { 
      label: (
        <>
          Feedback <span className="text-[#F79330]">(0)</span>
        </>
      )
    },
    {
      label: "My Ads",
      extra: (
        <span className="text-[#E23D3A]">({transformedTrades.length})</span>
      ),
    },
    { label: "+ Post New Ad" },
  ];

  const handleTabClick = (idx: number) => {
    setActiveTab(idx);
    if (idx === 3) window.location.href = "/adds?type=buy";
  };

  /** Derived — filtered trades */
  const filteredTrades = useMemo(() => {
    return transformedTrades.filter((trade: any) => {
      if (filters.token !== "Tether" && trade.currency !== filters.token)
        return false;
      if (
        filters.type !== "Type" &&
        trade.order_type.toLowerCase() !== filters.type.toLowerCase()
      )
        return false;
      if (
        filters.status !== "Status" &&
        trade.status.toLowerCase() !== filters.status.toLowerCase()
      )
        return false;
      if (filters.date !== "Date") {
        const tradeDate = new Date(trade.timestamp);
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
      }
      return true;
    });
  }, [transformedTrades, filters]);

  /** My-Ads filter bar */
  const MyAdsFilterBar = () => (
    <div className="flex flex-col mb-5 sm:flex-row gap-4 items-start sm:items-center justify-between w-full">
      {/* Token */}
      <div className="flex items-center bg-gray-100 dark:bg-[#23242A] rounded-full px-4 py-2 w-full sm:w-auto">
        <img
          src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
          alt="Tether"
          className="w-6 h-6 mr-2"
        />
        <span className="text-gray-900 dark:text-white mr-2">Tether</span>
        <span className="text-[#788099]">USDT</span>
        <select
          className="bg-transparent text-gray-900 dark:text-white ml-2 outline-none w-full sm:w-auto"
          value={filters.token}
          onChange={(e) => setFilters((p) => ({ ...p, token: e.target.value }))}
        >
          <option>Tether</option>
        </select>
      </div>
      {/* Type */}
      <select
        className="bg-gray-100 dark:bg-[#23242A] rounded-full px-4 py-2 text-gray-900 dark:text-white outline-none w-full sm:w-auto"
        value={filters.type}
        onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
      >
        <option>All</option>
        <option>Buy</option>
        <option>Sell</option>
      </select>
      {/* Status */}
      <select
        className="bg-gray-100 dark:bg-[#23242A] rounded-full px-4 py-2 text-gray-900 dark:text-white outline-none w-full sm:w-auto"
        value={filters.status}
        onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
      >
        <option>Status</option>
        <option>Published</option>
        <option>Offline</option>
      </select>
      {/* Date */}
      <select
        className="bg-gray-100 dark:bg-[#23242A] rounded-full px-4 py-2 text-gray-900 dark:text-white outline-none w-full sm:w-auto"
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
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <button className="w-full sm:w-auto px-4 py-2 rounded-full bg-[#1D8751] text-white">
          Publish
        </button>
        <button className="w-full sm:w-auto px-4 py-2 rounded-full border border-[#788099] text-[#788099] bg-transparent">
          Put Offline
        </button>
      </div>
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
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block"></span>
            <span className="text-[#A3A3C2]">Live Ads Exist</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#E23D3A] inline-block"></span>
            <span className="text-[#A3A3C2]">Offline Ads Exist</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        {activeTab === 0 && <PaymentMethods />}
        {activeTab === 1 && <Feedback />}
        {activeTab === 2 && (
          <>
            <MyAdsFilterBar />
            <MyAdsTable trades={filteredTrades} loading={loading} />
          </>
        )}
      </div>
    </div>
  );
};

export default FilterTabs;
