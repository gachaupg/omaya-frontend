import React, { useState, useMemo } from "react";
import Button from "../../Common/Button";
import PaymentMethods from "./sections/PaymentMethods";
import Feedback from "./sections/Feedback";
import MyAdsTable from "./sections/MyAdsTable";

interface FilterTabsProps {
  transformedTrades: any[];
  loading: boolean;
}

const FilterTabs = ({ transformedTrades, loading }: FilterTabsProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({
    token: "Tether",
    type: "Type",
    status: "Status",
    date: "Date",
  });

  const tabList = [
    { label: "Payment Methods" },
    { label: "Feedback (0)" },
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
    if (idx === 3) {
      window.location.href = "/adds?type=buy";
    }
  };

  // Filter trades based on selected filters
  const filteredTrades = useMemo(() => {
    return transformedTrades.filter((trade: any) => {
      // Token filter
      if (filters.token !== "Tether" && trade.currency !== filters.token) {
        return false;
      }

      // Type filter
      if (
        filters.type !== "Type" &&
        trade.order_type.toLowerCase() !== filters.type.toLowerCase()
      ) {
        return false;
      }

      // Status filter
      if (
        filters.status !== "Status" &&
        trade.status.toLowerCase() !== filters.status.toLowerCase()
      ) {
        return false;
      }

      // Date filter
      if (filters.date !== "Date") {
        const tradeDate = new Date(trade.timestamp);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (filters.date) {
          case "Today":
            const tradeDay = new Date(tradeDate);
            tradeDay.setHours(0, 0, 0, 0);
            if (tradeDay.getTime() !== today.getTime()) {
              return false;
            }
            break;
          case "Yesterday":
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const tradeYesterday = new Date(tradeDate);
            tradeYesterday.setHours(0, 0, 0, 0);
            if (tradeYesterday.getTime() !== yesterday.getTime()) {
              return false;
            }
            break;
          case "Last 7 Days":
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            if (tradeDate < weekAgo) {
              return false;
            }
            break;
          case "Last 30 Days":
            const monthAgo = new Date(today);
            monthAgo.setDate(today.getDate() - 30);
            if (tradeDate < monthAgo) {
              return false;
            }
            break;
          case "Last 90 Days":
            const threeMonthsAgo = new Date(today);
            threeMonthsAgo.setDate(today.getDate() - 90);
            if (tradeDate < threeMonthsAgo) {
              return false;
            }
            break;
          case "Last 180 Days":
            const sixMonthsAgo = new Date(today);
            sixMonthsAgo.setDate(today.getDate() - 180);
            if (tradeDate < sixMonthsAgo) {
              return false;
            }
            break;
        }
      }

      return true;
    });
  }, [transformedTrades, filters]);

  // Filter bar for My Ads
  const MyAdsFilterBar = () => (
    <div className="flex flex-col mb-5 sm:flex-row gap-4 items-start sm:items-center justify-between w-full">
      {/* Token Filter */}
      <div className="flex items-center bg-[#23242A] rounded-full px-4 py-2 w-full sm:w-auto">
        <img
          src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
          alt="Tether"
          className="w-6 h-6 mr-2"
        />
        <span className="text-white mr-2">Tether</span>
        <span className="text-[#788099]">USDT</span>
        <select
          className="bg-transparent text-white ml-2 outline-none w-full sm:w-auto"
          value={filters.token}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, token: e.target.value }))
          }
        >
          <option>Tether</option>
        </select>
      </div>
      {/* Type Filter */}
      <select
        className="bg-[#23242A] rounded-full px-4 py-2 text-white outline-none w-full sm:w-auto"
        value={filters.type}
        onChange={(e) =>
          setFilters((prev) => ({ ...prev, type: e.target.value }))
        }
      >
        <option>All</option>
        <option>Buy</option>
        <option>Sell</option>
      </select>
      {/* Status Filter */}
      <select
        className="bg-[#23242A] rounded-full px-4 py-2 text-white outline-none w-full sm:w-auto"
        value={filters.status}
        onChange={(e) =>
          setFilters((prev) => ({ ...prev, status: e.target.value }))
        }
      >
        <option>Status</option>
        <option>Published</option>
        <option>Offline</option>
      </select>
      {/* Date Filter */}
      <select
        className="bg-[#23242A] rounded-full px-4 py-2 text-white outline-none w-full sm:w-auto"
        value={filters.date}
        onChange={(e) =>
          setFilters((prev) => ({ ...prev, date: e.target.value }))
        }
      >
        <option>All</option>
        <option>Today</option>
        <option>Yesterday</option>
        <option>Last 7 Days</option>
        <option>Last 30 Days</option>
        <option>Last 90 Days</option>
        <option>Last 180 Days</option>
      </select>
      {/* Action Buttons */}
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

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center w-full">
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          {tabList.map((tab, idx) => (
            <Button
              key={tab.label}
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
