import React, { useState } from "react";
import { tokens } from "@/styles/tokens";
import Button from "../../Common/Button";
import {
  FaCheckCircle,
  FaRegClock,
  FaCheck,
  FaUniversity,
  FaUser,
} from "react-icons/fa";
import { ThumbsUp } from "lucide-react";

interface MarketRow {
  advertiser: string;
  orders: number;
  completion: string;
  online: boolean;
  commission: string;
  available: string;
  limit: string;
  payment: string[];
}

interface MarketTableProps {
  data: MarketRow[];
}

const paymentColors = [
  tokens.colors.brand.primary,
  tokens.colors.brand.secondary,
  tokens.colors.dark.textSecondary,
  tokens.colors.brand.primary,
  tokens.colors.brand.secondary,
];

const MarketTable: React.FC<MarketTableProps> = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-2xl">
        <div
          className={`min-w-[800px] w-full border overflow-hidden bg-[${tokens.colors.dark.card}] border-[${tokens.colors.dark.border}]`}
        >
          {/* Table Header */}
          <div
            className={`grid grid-cols-5 py-3 px-4 border-b bg-[#35353E] border-[${tokens.colors.dark.border}]`}
          >
            <div className="text-xs font-semibold text-[#788099] min-w-[200px]">
              Advertiser
            </div>
            <div className="text-xs font-semibold text-[#788099] min-w-[120px]">
              Commission
            </div>
            <div className="text-xs font-semibold text-[#788099] min-w-[180px]">
              Available/Order Limit
            </div>
            <div className="text-xs font-semibold text-[#788099] min-w-[200px]">
              Payment
            </div>
            <div className="text-xs font-semibold text-right text-[#788099] min-w-[120px]">
              Trade
            </div>
          </div>
          {/* Table Body */}
          {paginatedData.map((row, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-5 items-center py-4 px-4 border-b last:border-b-0 border-[${tokens.colors.dark.border}]`}
            >
              {/* Advertiser */}
              <div className="flex flex-col gap-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <span className="bg-[#1D8751] text-white h-10 w-10 rounded-[10px] text-xs font-bold px-2 py-0.5 justify-center mr-1 flex items-center gap-1">
                    CA
                  </span>
                  <span
                    className={`font-medium flex items-center text-sm text-[${tokens.colors.dark.textTitle}]`}
                  >
                    {row.advertiser}{" "}
                    <FaCheckCircle
                      className="text-[#FFD600] ml-1"
                      title="Verified"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-[#8C8CA1]">
                    <span className="text-[#1D8751]">{row.orders}</span> Orders
                    | <span className="text-[#1D8751]">{row.completion}</span>{" "}
                    Completion
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 text-xs text-[#1D8751] font-semibold bg-[#1D8751]/10 px-2 py-0.5 rounded">
                    <ThumbsUp height={10} className="text-[#1D8751] text-xs" />{" "}
                    95%
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[#1D8751] font-semibold bg-[#1D8751]/10 px-2 py-0.5 rounded">
                    <FaRegClock className="text-[#1D8751] text-xs" /> 20 min
                  </span>
                </div>
              </div>
              {/* Commission */}
              <div
                className={`text-sm font-semibold ml-7 text-[${tokens.colors.dark.textTitle}] min-w-[120px]`}
              >
                {row.commission}
              </div>
              {/* Available/Order Limit */}
              <div className="flex flex-col min-w-[180px]">
                <span
                  className={`font-semibold text-sm text-[${tokens.colors.dark.textTitle}]`}
                >
                  {row.available}
                </span>
                <span className="text-xs text-[#8C8CA1]">
                  Limit:{row.limit}
                </span>
              </div>
              {/* Payment */}
              <div className="flex flex-wrap gap-2 min-w-[200px]">
                {row.payment.map((method, i) => (
                  <span
                    key={method}
                    className="flex items-center gap-1 text-[14px] font-medium text-white w-1/2"
                  >
                    <FaUniversity className="text-[#1D8751] text-xs" /> {method}
                  </span>
                ))}
              </div>
              {/* Trade */}
              <div className="flex justify-end min-w-[120px]">
                <Button
                  width={116}
                  height={35}
                  borderRadius={10}
                  variant="primary"
                  size="sm"
                  className="min-w-[90px] font-semibold"
                >
                  BUY USDT
                </Button>
              </div>
            </div>
          ))}
          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 py-4 bg-transparent">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md text-sm font-medium border border-[#35353E] bg-[#23232B] text-[#8C8CA1] ${
                currentPage === 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-[#35353E]"
              }`}
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded-md text-sm font-medium border border-[#35353E] ${
                  currentPage === i + 1
                    ? "bg-[#1D8751] text-white"
                    : "bg-[#23232B] text-[#8C8CA1] hover:bg-[#35353E]"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md text-sm font-medium border border-[#35353E] bg-[#23232B] text-[#8C8CA1] ${
                currentPage === totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-[#35353E]"
              }`}
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketTable;
