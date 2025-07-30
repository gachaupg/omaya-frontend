import React from "react";
import { formatNumber } from "@/utils/formatters";

const P2pProfile = ({
  user,
  wallets,
  summary,
  loading,
}: {
  user: any;
  wallets: any;
  summary: any;
  loading: any;
}) => {
  return (
    <div className="w-full h-[130px] rounded-[24px] border-2 bg-white dark:bg-[#1D1D23] border-gray-200 dark:border-[#35353E] flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 sm:p-4 box-border gap-4 sm:gap-0">
      {/* Left Section */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Avatar */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1D8751] flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
          {user?.first_name?.charAt(0)}
          {user?.last_name?.charAt(0)}
        </div>
        {/* User Info */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-900 dark:text-white text-base sm:text-lg font-medium">
              {user?.first_name}
            </span>
            {/* Edit Icon (simple pencil SVG) */}
            <svg
              className="w-4 h-4 text-[#1D8751] cursor-pointer"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 019 17H7v-2a2 2 0 01.586-1.414z"
              />
            </svg>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
            <span className="flex items-center text-xs text-[#1D8751] bg-[#E0F2E8] dark:bg-[#384B41] rounded-full px-3 py-1">
              <svg
                className="w-3 h-3 mr-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Verified Merchant
            </span>
            <button className="bg-[#1D8751] text-white text-xs font-semibold rounded-full px-4 sm:px-5 py-2">
              Become Merchant PRO
            </button>
          </div>
        </div>
      </div>
      {/* Right Section */}
      <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
        <span className="text-[#1D8751] text-base sm:text-lg font-medium">
          P2P Balance
        </span>
        <div className="flex items-end gap-2">
          <span className="text-gray-900 dark:text-white text-lg sm:text-xl font-semibold">
            {wallets && wallets.length > 0
              ? formatNumber(Number(wallets[0].balance)).toString()
              : "0"}{" "}
            USDT
          </span>
          <span className="text-gray-500 dark:text-[#7B8191] text-base sm:text-lg">
            ≈{" "}
            {wallets && wallets.length > 0
              ? formatNumber(Number(wallets[0].balance)).toString()
              : "0"}{" "}
            USD
          </span>
        </div>
        <span className="text-gray-500 dark:text-[#7B8191] text-sm">
          In escrow:{" "}
          <span className="text-gray-900 dark:text-white font-medium">
            800 USD
          </span>
        </span>
      </div>
    </div>
  );
};

export default P2pProfile;
