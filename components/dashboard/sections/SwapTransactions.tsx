import React from "react";
import { Table } from "@/components/ui/Table";

const SwapTransactions = () => {
  return (
    <div className="overflow-x-auto">
    <div className="w-full text-center py-8">
      <div className="flex flex-col items-center justify-center border border-[#35353E] rounded-[24px] p-8 bg-[#23232B]">
        <div className="w-16 h-16 mb-4 rounded-full bg-[#35353E] flex items-center justify-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-[#788099]"
          >
            <path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 8V12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 16H12.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#788099] mb-2">
          No Swap Transactions Found
        </h3>
        <p className="text-sm text-[#8C8CA1] text-center max-w-md">
          There are currently no swap transactions to display. Please check
          back later or try adjusting your filters.
        </p>
      </div>
    </div>
  </div>
  );
};

export default SwapTransactions;
