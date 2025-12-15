import React, { useState } from "react";
import { tokens } from "@/styles/tokens";
import { TransactionType } from "@/features/p2p/types";
import Button from "./Button";
import { MoreHorizontal } from "lucide-react";
import { useTheme } from "@/context/theme";

type TableProps = {
  title?: string;
  type?: string;
  data?: TransactionType[];
  onExport?: () => void;
  onSearch?: (query: string) => void;
  withBorder?: boolean;
};

export const Table: React.FC<TableProps> = ({
  title = "P2P History",
  data = [],
  type = "",
  onExport,
  onSearch,
  withBorder = false,
}) => {
  const { isDark } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Direct color values - card background for body, #35353E for header
  const headerBg = isDark ? '#35353E' : '#f9fafb';
  const bodyBg = isDark ? 'var(--card-color)' : '#ffffff';
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "Completed") return `text-[${tokens.colors.brand.primary}]`;
    if (status === "Processing") return "text-yellow-400";
    return `text-[${tokens.colors.brand.secondary}]`;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  let tableRows;
  if (type === "transactions") {
    tableRows = paginatedData.map((row: any, index: number) => (
      <div
        key={index}
        className={`w-full grid grid-cols-3 sm:grid-cols-5 py-4 px-4 border-b last:border-b-0 items-center border-[${tokens.colors.dark.border}]`}
        style={{ backgroundColor: bodyBg }}
      >
        {/* Asset */}
        <div className="flex items-center gap-2">
          {row.assetSymbol === "BTC" && (
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F7931A]">
              <span className="font-bold text-lg text-white">₿</span>
            </div>
          )}
          {row.assetSymbol === "ETH" && (
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#627EEA]">
              <span className="font-bold text-lg text-white">Ξ</span>
            </div>
          )}
          {row.assetSymbol === "USDT" && (
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#26A17B]">
              <span className="font-bold text-lg text-white">₮</span>
            </div>
          )}
          <span
            className={`text-sm font-medium text-[${tokens.colors.dark.textTitle}]`}
          >
            {row.assetSymbol}{" "}
            <span className="text-[#788099] font-normal">{row.asset}</span>
          </span>
        </div>
        {/* Transaction Type */}
        <div
          className={`text-sm font-medium ${
            row.type === "Deposit" || row.type === "P2P Buy"
              ? `text-[${tokens.colors.brand.primary}]`
              : row.type === "Withdrawal" || row.type === "P2P Sell"
              ? `text-[${tokens.colors.brand.secondary}]`
              : `text-[${tokens.colors.dark.textTitle}]`
          }`}
        >
          {row.type}
        </div>
        {/* Amount */}
        <div
          className={`text-sm font-medium ${
            row.amount.startsWith("+")
              ? `text-[${tokens.colors.brand.primary}]`
              : `text-[${tokens.colors.brand.secondary}]`
          }`}
        >
          ${row.amount}
        </div>
        {/* Payment Method */}
        <div className="hidden sm:flex items-center gap-2">
          {row.payment?.logo && (
            <img
              src={row.payment.logo}
              alt={row.payment.bank}
              className="w-6 h-6 rounded-full"
            />
          )}
          <span className="text-sm font-medium text-[${tokens.colors.dark.textTitle}]">
            {row.payment?.bank}
          </span>
        </div>
        {/* When */}
        <div className="text-sm font-medium text-[${tokens.colors.dark.textTitle}]">
          {row.when}
        </div>
      </div>
    ));
  } else {
    tableRows = null;
  }

  return (
    <div className="mt-8  rounded-[24px]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <h3 className={`font-medium text-[${tokens.colors.dark.textTitle}]`}>
          {title}
        </h3>

        {type === "p2p" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-60">
              <input
                type="text"
                placeholder="Search"
                onChange={handleSearch}
                className={`py-2 pl-9 pr-4 rounded-[24px] text-sm w-full border focus:outline-none bg-[${tokens.colors.dark.card}] text-[${tokens.colors.dark.textTitle}] border-[${tokens.colors.dark.border}]`}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`text-[${tokens.colors.dark.textBody}]`}
                >
                  <path
                    d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 21L16.65 16.65"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              className="text-sm "
            >
              <p className="text-[#1D8751]">Export Transactions</p>
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-[24px]">
        <div
          className={`min-w-[800px] w-full overflow-hidden`}
          style={{
            backgroundColor: bodyBg,
            ...(withBorder
              ? { border: `1px solid ${tokens.colors.dark.border}` }
              : {}),
          }}
        >          {type === "transactions" ? (
            <div 
              className="grid grid-cols-3 sm:grid-cols-5 py-3 px-4 border-b border-[${tokens.colors.dark.border}]"
              style={{ backgroundColor: headerBg }}
            >
              <div className="text-sm font-medium text-[${tokens.colors.dark.textTitle}]">
                Asset
              </div>
              <div className="text-sm font-medium text-[${tokens.colors.dark.textTitle}]">
                Transaction Type
              </div>
              <div className="text-sm font-medium text-[${tokens.colors.dark.textTitle}]">
                Amount
              </div>
              <div className="hidden sm:block text-sm font-medium text-[${tokens.colors.dark.textTitle}]">
                Payment Method
              </div>
              <div className="text-sm font-medium text-[${tokens.colors.dark.textTitle}]">
                When
              </div>
            </div>
          ) : (
            <div
              className={`grid grid-cols-4 sm:grid-cols-7 md:grid-cols-8 py-3 px-4 border-b border-[${tokens.colors.dark.border}]`}
              style={{ backgroundColor: headerBg }}
            >
              <div
                className={`text-sm font-medium text-[${tokens.colors.dark.textTitle}]`}
              >
                {type === "orders" ? "Coin" : "Asset"}
              </div>
              {type === "p2p" && (
                <>
                  {" "}
                  <div
                    className={`hidden sm:block text-sm font-medium text-[${tokens.colors.dark.textTitle}]`}
                  >
                    ID
                  </div>
                </>
              )}
              <div
                className={`text-sm font-medium text-[${tokens.colors.dark.textTitle}]`}
              >
                Type
              </div>
              <div
                className={`text-sm font-medium text-[${tokens.colors.dark.textTitle}]`}
              >
                Amount
              </div>
              {type === "orders" && (
                <div
                  className={`hidden sm:block text-sm font-medium text-[${tokens.colors.dark.textTitle}]`}
                >
                  Rate
                </div>
              )}

              <div className={`hidden sm:block text-sm font-medium text-[${tokens.colors.dark.textTitle}]`}>
                Date
              </div>
              <div
                className={`text-sm font-medium text-[${tokens.colors.dark.textTitle}]`}
              >
                Status
              </div>

              {type === "p2p" ? (
                <>
                  <div
                    className={`hidden sm:flex text-sm font-medium text-[${tokens.colors.dark.textTitle}] items-center gap-1`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`text-[${tokens.colors.dark.textTitle}]`}
                    >
                      <path
                        d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Receipt
                  </div>
                  <div className={`hidden sm:block text-sm font-medium text-[${tokens.colors.dark.textTitle}]`}>
                    More
                  </div>
                </>
              ) : (
                <div
                  className={`hidden sm:block text-sm font-medium text-[${tokens.colors.dark.textTitle}]`}
                >
                  Payments
                </div>
              )}
            </div>
          )}

          {/* Table Body */}
          <div>{tableRows}</div>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 select-none">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-[#7C8493] hover:bg-[#E6E8EC]"
              }`}
            >
              <span className="text-xl">&#60;</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-8 h-8 flex items-center justify-center rounded-[8px] font-medium text-base transition-colors ${
                  currentPage === page
                    ? "bg-[#1D8751] text-white"
                    : "text-[#7C8493] hover:bg-[#E6E8EC]"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-[#7C8493] hover:bg-[#E6E8EC]"
              }`}
            >
              <span className="text-xl">&#62;</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
