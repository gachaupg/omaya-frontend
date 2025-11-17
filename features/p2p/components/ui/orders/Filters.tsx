import React from "react";
import Button from "@/features/p2p/components/Common/Button";
import {
  orderStatusTabs,
  currencyOptions,
  typeOptions,
  statusOptions,
  dateOptions,
} from "@/features/p2p/data";
import Image from "next/image";
import CustomSelect from "@/components/ui/CustomSelect";

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

  logger.debug("p2p", "Order Status Tabs:", orderStatusTabs);

  const filterCardBase =
    "flex w-full items-center justify-between gap-3 rounded-[28px] border border-[#35353E] bg-transparent px-3 py-2";
  const triggerOverride =
    "!bg-transparent !border-0 !shadow-none px-0 py-0 text-transparent flex justify-end items-center min-w-[24px]";
  const iconWrapper =
    "flex h-8 w-8 items-center justify-center rounded-full bg-[#11141C] border border-[#1F2330]";
  const labelStyle = "text-sm font-semibold text-white";
  const valueStyle = "text-sm font-semibold text-[#9CA4C0]";

  const currencyMeta: Record<string, { name: string; code: string }> = {
    usdt: { name: "Tether", code: "USDT" },
  };

  const selectedCurrencyKey = filters.currency?.toLowerCase() || "usdt";
  const selectedCurrencyOption = currencyOptions.find(
    (option) => option.value === filters.currency
  );

  const currencyInfo =
    currencyMeta[selectedCurrencyKey] || {
      name:
        selectedCurrencyOption?.label ||
        selectedCurrencyKey.toUpperCase(),
      code:
        selectedCurrencyOption?.label ||
        selectedCurrencyKey.toUpperCase(),
    };

  const typeOptionLabel =
    typeOptions.find((option) => option.value === filters.type)?.label ||
    "Type";
  const statusOptionLabel =
    statusOptions.find((option) => option.value === filters.status)?.label ||
    "Status";
  const dateOptionLabel =
    dateOptions.find((option) => option.value === filters.date)?.label ||
    "Date";

  const typeValueDisplay = filters.type !== "all" ? typeOptionLabel : "";
  const statusValueDisplay =
    filters.status !== "all" ? statusOptionLabel : "";
  const dateValueDisplay = filters.date !== "all" ? dateOptionLabel : "";

  return (
    <div className="w-full flex flex-col">
      {/* ───────────────────────── Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-0 bg-transparent rounded-[14px] border border-[#1D8751]/60 w-full sm:w-fit px-1.5 py-1.5 overflow-x-auto snap-x snap-mandatory scrollbar-none shadow-[0_6px_24px_rgba(4,10,7,0.35)]">
          {orderStatusTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={filters.status === tab.id ? "primary" : "ghost"}
              size="md"
              borderRadius={10}
              disabled={loading}
              className={`px-4 py-2 font-semibold text-[13px] md:text-sm transition-all flex items-center gap-1 shadow-none border-none min-w-[120px] snap-start shrink-0 ${
                filters.status === tab.id
                  ? "bg-[#1D8751] text-white"
                  : "bg-transparent text-[#9AA3BC] hover:bg-[#1D8751]/10"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => handleStatusChange(tab.id)}
            >
              {tab.label}
              {tab.count && (
                <span className="ml-1 text-[11px] font-semibold text-[#F79330] px-2 py-0.5 rounded-full bg-[#F79330]/10">
                  ({tab.count})
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* unread button */}
        <button
          className={`w-full sm:w-auto rounded-[28px] flex items-center justify-center gap-2 border border-[#1D8751] text-[#1D8751] px-5 py-3 font-semibold text-sm hover:bg-[#1D8751]/10 transition-all relative ${
            showUnreadMessages
              ? "bg-[#1D8751] text-white shadow-[0_12px_26px_rgba(29,135,81,0.35)]"
              : "bg-transparent"
          } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={loading}
          onClick={onUnreadMessagesClick}
        >
          <svg width="28" height="19" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="mr-1">
            <rect width="100" height="100" fill="#1A1A1D"/>
            <path d="M20 10 H80 V70 H35 L25 95 L25 70 H20 Z" fill="#F79330"/>
            <rect x="35" y="25" width="40" height="10" fill="#1A1A1D"/>
            <rect x="35" y="45" width="40" height="10" fill="#1A1A1D"/>
          </svg>

          <span className={`text-sm ${showUnreadMessages ? "text-white" : "text-[#1D8751]"}`}>
            Unread Message(s)
          </span>
          
          {/* Unread count badge */}
          {totalUnreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </span>
          )}
        </button>
      </div>

      {/* ───────────────────────── Filter bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mt-4">
        {/* Coin selector */}
        <div className={`${filterCardBase} ${loading ? "opacity-50" : ""}`}>
          <div className="flex items-center gap-3">
            <div className={iconWrapper}>
              <Image
                src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
                alt="Tether"
                width={22}
                height={22}
              />
            </div>
            <span className={labelStyle}>{currencyInfo.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={valueStyle}>{currencyInfo.code}</span>
            <CustomSelect
              options={currencyOptions}
              value={filters.currency}
              onChange={handleCurrencyChange}
              className="w-6"
              triggerClassName={triggerOverride}
              optionClassName="text-sm"
              disabled={loading}
              showSelectedCheck={false}
              hideSelectedLabel
            />
          </div>
        </div>

        {/* Type selector */}
        <div className={`${filterCardBase} ${loading ? "opacity-50" : ""}`}>
          <div className="flex items-center gap-3">
            <div className={iconWrapper}>
              <Image
                src="https://res.cloudinary.com/pitz/image/upload/v1763388449/Icon_1_kiuery.png"
                alt="Type icon"
                width={18}
                height={18}
              />
            </div>
            <span className={labelStyle}>Type</span>
          </div>
          <div className="flex items-center gap-3">
            {typeValueDisplay && (
              <span className={valueStyle}>{typeValueDisplay}</span>
            )}
            <CustomSelect
              options={typeOptions}
              value={filters.type}
              onChange={handleTypeChange}
              className="w-6"
              triggerClassName={triggerOverride}
              optionClassName="text-sm"
              disabled={loading}
              hideSelectedLabel
            />
          </div>
        </div>

        {/* Status selector */}
        <div className={`${filterCardBase} ${loading ? "opacity-50" : ""}`}>
          <div className="flex items-center gap-3">
            <div className={iconWrapper}>
              <Image
                src="https://res.cloudinary.com/pitz/image/upload/v1763388449/annotation-check_ergtxp.png"
                alt="Status icon"
                width={18}
                height={18}
              />
            </div>
            <span className={labelStyle}>Status</span>
          </div>
          <div className="flex items-center gap-3">
            {statusValueDisplay && (
              <span className={valueStyle}>{statusValueDisplay}</span>
            )}
            <CustomSelect
              options={statusOptions}
              value={filters.status}
              onChange={handleStatusChange}
              className="w-6"
              triggerClassName={triggerOverride}
              optionClassName="text-sm"
              disabled={loading}
              hideSelectedLabel
            />
          </div>
        </div>

        {/* Date selector */}
        <div className={`${filterCardBase} ${loading ? "opacity-50" : ""}`}>
          <div className="flex items-center gap-3">
            <div className={iconWrapper}>
              <Image
                src="https://res.cloudinary.com/pitz/image/upload/v1763388449/calendar-03_rnsmmq.png"
                alt="Date icon"
                width={18}
                height={18}
              />
            </div>
            <span className={labelStyle}>Date</span>
          </div>
          <div className="flex items-center gap-3">
            {dateValueDisplay && (
              <span className={valueStyle}>{dateValueDisplay}</span>
            )}
            <CustomSelect
              options={dateOptions}
              value={filters.date}
              onChange={handleDateChange}
              className="w-6"
              triggerClassName={triggerOverride}
              optionClassName="text-sm"
              disabled={loading}
              hideSelectedLabel
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filters;
