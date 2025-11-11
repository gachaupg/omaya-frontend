import React from "react";
import Button from "@/features/p2p/components/Common/Button";
import Select from "@/features/p2p/components/Common/Select";
import {
  orderStatusTabs,
  currencyOptions,
  typeOptions,
  statusOptions,
  dateOptions,
} from "@/features/p2p/data";
import Image from "next/image";
import { GrStatusGood } from "react-icons/gr";

import { logger } from '@/lib/utils/logger';

interface FiltersProps {
  filters: {
    type: string;
    status: string;
    date: string;
    currency: string;
  };
  onFilterChange: (filters: {
    type: string;
    status: string;
    date: string;
    currency: string;
  }) => void;
  loading?: boolean;
  orderStatusTabs: Array<{ id: string; label: string; count?: number }>;
  onUnreadMessagesClick?: () => void;
  showUnreadMessages?: boolean;
  totalUnreadCount?: number;
}

/**
 * Re-styled for **light ↔ dark** support.  All Tailwind dark-prefixed classes keep the
 * previous colours, while the default (light) state now uses neutral greys & whites.
 * No business logic touched.
 */
const Filters: React.FC<FiltersProps> = ({
  filters,
  onFilterChange,
  loading = false,
  onUnreadMessagesClick,
  showUnreadMessages = false,
  totalUnreadCount = 0,
}) => {
  const handleTypeChange = (value: string) => {
    if (loading) return;
    onFilterChange({ ...filters, type: value });
  };

  const handleStatusChange = (value: string) => {
    if (loading) return;
    onFilterChange({ ...filters, status: value });
  };

  const handleDateChange = (value: string) => {
    if (loading) return;
    onFilterChange({ ...filters, date: value });
  };

  const handleCurrencyChange = (value: string) => {
    if (loading) return;
    onFilterChange({ ...filters, currency: value });
  };

  logger.debug('p2p', "Order Status Tabs:", orderStatusTabs);
  return (
    <div className="w-full flex flex-col">
      {/* ───────────────────────── Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-0 bg-transparent rounded-[10px] border border-[#1D8751] w-full sm:w-fit px-1 py-1 overflow-x-auto snap-x snap-mandatory scrollbar-none">
          {orderStatusTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={filters.status === tab.id ? "primary" : "ghost"}
              size="md"
              borderRadius={10}
              disabled={loading}
              className={`px-4 py-2 font-medium text-sm transition-all flex items-center gap-1 shadow-none border-none min-w-[100px] snap-start shrink-0 ${
                filters.status === tab.id
                  ? "bg-[#1D8751] text-white"
                  : "bg-transparent text-[#788099] hover:bg-[#788099]/10"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => handleStatusChange(tab.id)}
            >
              {tab.label}
              {tab.count && (
                <span className="ml-1 text-xs text-[#F79330] px-2 py-0.5 rounded-full">
                  ({tab.count})
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* unread button */}
        <button
          className={`w-full sm:w-auto rounded-[24px] flex items-center justify-center gap-2 border border-[#1D8751] text-[#1D8751] px-4 py-2 font-medium text-sm hover:bg-[#1D8751]/10 transition-all relative ${
            showUnreadMessages ? "bg-[#1D8751] text-white" : "bg-transparent"
          } ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
          onClick={onUnreadMessagesClick}
        >
          <svg width="28" height="19" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="mr-1">
            <rect width="100" height="100" fill="#1A1A1D"/>
            <path d="M20 10 H80 V70 H35 L25 95 L25 70 H20 Z" fill="#F79330"/>
            <rect x="35" y="25" width="40" height="10" fill="#1A1A1D"/>
            <rect x="35" y="45" width="40" height="10" fill="#1A1A1D"/>
          </svg>

          <span className={showUnreadMessages ? "text-white" : "text-[#1D8751]"}>Unread Message(s)</span>
          
          {/* Unread count badge */}
          {totalUnreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </span>
          )}
        </button>
      </div>

      {/* ───────────────────────── Filter bar */}
      <div className="flex w-full flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center justify-between bg-transparent mt-4">
        {/* token selector */}
        <div
          className={`flex items-center gap-2 bg-white dark:bg-[#1D1D23] border border-gray-300 dark:border-[#444454] p-1 rounded-[24px] w-full sm:w-auto min-w-[200px] ${
            loading ? "opacity-50" : ""
          }`}
        >
          <Image
            src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
            alt="Tether"
            width={20}
            height={20}
          />
          <span className="text-gray-900 dark:text-white font-medium text-sm">
            Tether
          </span>
          <Select
            options={currencyOptions}
            value={filters.currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="bg-transparent w-full border-none text-gray-900 dark:text-white text-sm focus:ring-0 focus:outline-none rounded-[24px]"
            borderColor="#444454"
            bgColor="#35353e"
            disabled={loading}
          />
        </div>

        {/* type selector */}
        <div
          className={`flex items-center gap-2 bg-white dark:bg-[#1D1D23] border border-gray-300 dark:border-[#444454] p-1 rounded-[24px] w-full sm:w-auto min-w-[200px] ${
            loading ? "opacity-50" : ""
          }`}
        >
          <Image
            src="https://res.cloudinary.com/pitz/image/upload/v1746710370/coins-rotate_d278mb.png"
            alt="Filter"
            width={20}
            height={20}
            className="text-[#1D8751]"
          />
          <Select
            options={typeOptions}
            value={filters.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="bg-transparent w-full border-none text-gray-900 dark:text-white text-sm focus:ring-0 focus:outline-none rounded-[24px]"
            borderColor="#444454"
            bgColor="#35353e"
            disabled={loading}
          />
        </div>

        {/* status selector */}
        <div
          className={`flex items-center gap-2 bg-white dark:bg-[#1D1D23] border border-gray-300 dark:border-[#444454] p-1 rounded-[24px] w-full sm:w-auto min-w-[200px] ${
            loading ? "opacity-50" : ""
          }`}
        >
          <GrStatusGood className="text-[#1D8751]" />
          <Select
            options={statusOptions}
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-transparent w-full border-none text-gray-900 dark:text-[#788099] text-sm focus:ring-0 focus:outline-none rounded-[24px]"
            borderColor="#444454"
            bgColor="#35353e"
            disabled={loading}
          />
        </div>

        {/* date selector */}
        <div
          className={`flex items-center gap-2 bg-white dark:bg-[#1D1D23] border border-gray-300 dark:border-[#444454] p-1 rounded-[24px] w-full sm:w-auto min-w-[200px] ${
            loading ? "opacity-50" : ""
          }`}
        >
          <svg
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#1D8751"
          >
            <rect
              x="3"
              y="4"
              width="18"
              height="18"
              rx="2"
              stroke="#1D8751"
              strokeWidth="2"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M16 2v4M8 2v4M3 10h18"
            />
          </svg>
          <Select
            options={dateOptions}
            value={filters.date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-transparent border-none text-gray-900 dark:text-[#788099] text-sm w-full focus:ring-0 focus:outline-none rounded-[24px]"
            borderColor="#444454"
            bgColor="#35353e"
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default Filters;
