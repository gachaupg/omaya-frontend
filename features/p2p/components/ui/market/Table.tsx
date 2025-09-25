import React, { useState } from "react";
import Button from "../../Common/Button";
import { FaCheckCircle, FaRegClock } from "react-icons/fa";
import { ThumbsUp } from "lucide-react";
import { TiArrowUnsorted } from "react-icons/ti";
import { MarketTableProps } from "./types";
import TradePreview from "./sections/tradePreview";
import Loader from "../../Common/Loader";

// Bank icons mapping
const BANK_ICONS: Record<string, string> = {
  "Salam Bank":
    "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png",
  "Premier Bank":
    "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png",
  "Dahabshiil Bank":
    "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png",
  "Salaam Bank":
    "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png",
  Bank: "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png",
  "Bank Transfer":
    "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png",
};

const MarketTable: React.FC<MarketTableProps> = ({
  data = [],
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
  loading = false,
  activeTab = "buy",
}) => {
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const handleTradeClick = (i: number) => setSelectedRowIndex(i);
  console.log("data in table", data);
  console.log("currentPage", currentPage);
  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key: string) => {
    return <TiArrowUnsorted className="w-3 h-3 ml-1 text-gray-400" />;
  };

  /* ------------------------------------------------------------------ */
  /* Loading state                                                      */
  /* ------------------------------------------------------------------ */
  if (loading) return <Loader />;

  /* ------------------------------------------------------------------ */
  /* Component                                                          */
  /* ------------------------------------------------------------------ */
  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-2xl">
        <div className="min-w-[800px] w-full overflow-hidden border bg-white border-gray-200 rounded-2xl dark:bg-[#1D1D23] dark:border-[#35353E]">
          {/* ---------------- header row ---------------- */}
          <div className="grid grid-cols-5 py-3 px-4 border-b bg-gray-50 border-gray-200 text-xs font-semibold text-gray-500 dark:bg-[#35353E] dark:border-[#35353E] dark:text-[#788099]">
            <div
              className="min-w-[200px] flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
              onClick={() => handleSort("advertiser")}
            >
              Advertiser {getSortIcon("advertiser")}
            </div>
            <div
              className="min-w-[120px] flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
              onClick={() => handleSort("commission")}
            >
              Commission {getSortIcon("commission")}
            </div>
            <div
              className="min-w-[180px] flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
              onClick={() => handleSort("available")}
            >
              Available/Order Limit {getSortIcon("available")}
            </div>
            <div
              className="min-w-[200px] flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
              onClick={() => handleSort("payment")}
            >
              Payment {getSortIcon("payment")}
            </div>
            <div className="min-w-[120px] text-right">Trade</div>
          </div>

          {/* ---------------- empty state --------------- */}
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-white dark:bg-transparent">
              <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-[#35353E] flex items-center justify-center">
                <FaRegClock className="text-gray-400 dark:text-[#788099] text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-500 dark:text-[#788099] mb-2">
                No Orders Found
              </h3>
              <p className="text-sm text-gray-400 dark:text-[#8C8CA1] text-center max-w-md">
                There are currently no {activeTab === "buy" ? "buy" : "sell"}{" "}
                orders available. Please check back later or try adjusting your
                filters.
              </p>
            </div>
          ) : (
            /* ---------------- table rows --------------- */
            data.map((row, idx) => (
              <React.Fragment key={idx}>
                <div className="grid grid-cols-5 items-center py-4 px-4 border-b last:border-b-0 bg-white hover:bg-gray-50 border-gray-200 dark:bg-[#18181D] dark:hover:bg-[#2d2d36] dark:border-[#35353E]">
                  {/* Advertiser */}
                  <div className="flex flex-col gap-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#1D8751] text-white h-10 w-10 rounded-[10px] text-xs font-bold flex items-center justify-center">
                        {row.advertiserInitials}
                      </span>
                      <span className="font-medium flex items-center text-sm text-gray-900 dark:text-[#E4E4E6]">
                        {row.advertiser}
                        <FaCheckCircle className="text-[#FFD600] ml-1" />
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-[#8C8CA1]">
                      <span className="text-[#1D8751]">{row.orders}</span>{" "}
                      Orders |{" "}
                      <span className="text-[#1D8751]">{row.completion}</span>{" "}
                      Completion
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-xs text-[#1D8751] font-semibold">
                        <ThumbsUp height={10} /> 95%
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[#1D8751] font-semibold">
                        <FaRegClock className="text-xs" /> 20 min
                      </span>
                    </div>
                  </div>
                  {/* Commission */}
                  <div className="text-sm font-semibold ml-7 text-gray-900 dark:text-[#E4E4E6] min-w-[120px]">
                    {row.commission}
                  </div>
                  {/* Available */}
                  <div className="flex flex-col min-w-[180px]">
                    <span className="font-semibold text-sm text-gray-900 dark:text-[#E4E4E6]">
                      {row.available}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-[#8C8CA1]">
                      Limit: {row.limit}
                    </span>
                  </div>
                  {/* Payment */}
                  <div className="flex flex-wrap gap-2 min-w-[200px]">
                    {row.payment.map((method, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-white w-1/2"
                      >
                        <img
                          src="https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                          alt={method}
                          className="w-4 h-4 rounded"
                        />
                        {method}
                      </span>
                    ))}
                  </div>
                  {/* Trade */}
                  <div className="flex justify-end min-w-[120px]">
                    <Button
                      width={116}
                      height={35}
                      borderRadius={10}
                      variant={activeTab === "sell" ? "secondary" : "primary"}
                      size="sm"
                      className="min-w-[90px] font-semibold"
                      onClick={() => handleTradeClick(idx)}
                    >
                      {activeTab === "sell" ? "SELL USDT" : "BUY USDT"}
                    </Button>
                  </div>
                </div>
                {selectedRowIndex === idx && (
                  <div className="mt-4 p-4 w-full">
                    <TradePreview
                      advertiserData={row}
                      onClose={() => setSelectedRowIndex(null)}
                      tradeType={activeTab as "buy" | "sell"}
                    />
                  </div>
                )}
              </React.Fragment>
            ))
          )}

          {/* ---------------- pagination --------------- */}
          {data.length > 0 && (
            <div className="flex justify-center items-center gap-2 py-4 bg-gray-50 dark:bg-transparent">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md text-sm font-medium border bg-white border-gray-200 text-gray-500 ${
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100"
                } dark:bg-[#23232B] dark:border-[#35353E] dark:text-[#8C8CA1] dark:hover:bg-[#35353E]`}
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => onPageChange(i + 1)}
                  className={`px-3 py-1 rounded-md text-sm font-medium border ${
                    currentPage === i + 1
                      ? "bg-[#1D8751] text-white border-[#1D8751]"
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-100 dark:bg-[#23232B] dark:text-[#8C8CA1] dark:border-[#35353E] dark:hover:bg-[#35353E]"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md text-sm font-medium border bg-white border-gray-200 text-gray-500 ${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100"
                } dark:bg-[#23232B] dark:border-[#35353E] dark:text-[#8C8CA1] dark:hover:bg-[#35353E]`}
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketTable;
