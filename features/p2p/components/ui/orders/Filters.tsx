import React from "react";
import Button from "@/features/p2p/components/Common/Button";
import Select from "@/features/p2p/components/Common/Select";
import {
  orderStatusTabs,
  tokenOptions,
  currencyOptions,
  typeOptions,
  statusOptions,
  dateOptions,
} from "@/features/p2p/data";
import Image from "next/image";
import { GrStatusGood } from "react-icons/gr";

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
}

const Filters: React.FC<FiltersProps> = ({
  filters,
  onFilterChange,
  loading = false,
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

  return (
    <div className="w-full flex flex-col">
      {/* Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-0 bg-transparent rounded-[10px] border border-[#1D8751] w-full sm:w-fit px-1 py-1 overflow-x-auto">
          {orderStatusTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={filters.status === tab.id ? "primary" : "ghost"}
              size="md"
              borderRadius={10}
              disabled={loading}
              className={`px-4 py-2 font-medium text-sm transition-all flex items-center gap-1 shadow-none border-none min-w-[100px] ${
                filters.status === tab.id
                  ? "bg-[#1D8751] text-white"
                  : "bg-transparent text-[#1D8751] hover:bg-[#1D8751]/10"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => handleStatusChange(tab.id)}
            >
              {tab.label}
              {tab.count && (
                <span className="ml-1 text-xs bg-[#23272F] text-[#FBBF24] px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </Button>
          ))}
        </div>
        <button
          className={`w-full sm:w-auto rounded-[24px] flex items-center justify-center gap-2 border border-[#1D8751] text-[#1D8751] px-4 py-2 font-medium text-sm hover:bg-[#1D8751]/10 transition-all bg-transparent ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          <svg
            width="18"
            height="18"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#FBBF24"
            className="mr-1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z"
            />
          </svg>
          <span className="text-[#1D8751]">Unread Message(s)</span>
        </button>
      </div>
      {/* Filters Bar */}
      <div className="flex w-full flex-wrap gap-4 items-center justify-between bg-transparent mt-4">
        {/* Token Selector */}
        <div
          className={`flex items-center gap-2 bg-[#1D1D23] border border-[#444454] p-1 rounded-[24px] w-full sm:w-auto min-w-[200px] ${
            loading ? "opacity-50" : ""
          }`}
        >
          <span className="flex items-center justify-center">
            <Image
              src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
              alt="Tether"
              width={20}
              height={20}
            />
          </span>
          <span className="text-white font-medium text-sm">Tether</span>
          <Select
            options={currencyOptions}
            value={filters.currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="bg-transparent w-full border-none text-white text-sm focus:ring-0 focus:outline-none rounded-[24px]"
            borderColor="#444454"
            bgColor="#35353e"
            disabled={loading}
          />
        </div>
        {/* Type Dropdown */}
        <div
          className={`flex items-center gap-2 bg-[#1D1D23] border border-[#444454] p-1 rounded-[24px] w-full sm:w-auto min-w-[200px] ${
            loading ? "opacity-50" : ""
          }`}
        >
          <span className="text-[#1D8751]">
            <Image
              src="https://res.cloudinary.com/pitz/image/upload/v1746710370/coins-rotate_d278mb.png"
              alt="Filter"
              width={20}
              height={20}
            />
          </span>
          <Select
            options={typeOptions}
            value={filters.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="bg-transparent w-full border-none text-white text-sm focus:ring-0 focus:outline-none rounded-[24px]"
            borderColor="#444454"
            bgColor="#35353e"
            disabled={loading}
          />
        </div>
        {/* Status Dropdown */}
        <div
          className={`flex items-center gap-2 bg-[#1D1D23] border border-[#444454] p-1 rounded-[24px] w-full sm:w-auto min-w-[200px] ${
            loading ? "opacity-50" : ""
          }`}
        >
          <span className="text-[#1D8751]">
            <GrStatusGood />
          </span>
          <Select
            options={statusOptions}
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-transparent border-none text-[#788099] text-sm w-full focus:ring-0 focus:outline-none rounded-[24px]"
            borderColor="#444454"
            bgColor="#35353e"
            disabled={loading}
          />
        </div>
        {/* Date Dropdown */}
        <div
          className={`flex items-center gap-2 bg-[#1D1D23] border border-[#444454] p-1 rounded-[24px] w-full sm:w-auto min-w-[200px] ${
            loading ? "opacity-50" : ""
          }`}
        >
          <span className="text-[#1D8751]">
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
          </span>
          <Select
            options={dateOptions}
            value={filters.date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-transparent border-none text-[#788099] text-sm w-full focus:ring-0 focus:outline-none rounded-[24px]"
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
