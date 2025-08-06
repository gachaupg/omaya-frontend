import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { getP2PProfileThunk } from "@/features/p2p/slices/orderSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { fetchWallets } from "@/features/p2p/slices/walletSlice";
import {
  fetchTransactionSummary,
  selectTransactionSummary,
  selectTransactionSummaryLoading,
} from "@/features/p2p/slices/transactionSummarySlice";
import { fetchMatchedTrades } from "@/features/p2p/slices/matchedTradesSlice";
import { formatNumber } from "@/utils/formatters";
import { useRouter } from "next/navigation";

const Stats = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const summary = useSelector(selectTransactionSummary);
  const { data: matchedTrades } = useSelector(
    (state: RootState) => state.matchedTrades
  );
  console.log("summary", summary);
  const [profileImage, setProfileImage] = useState("");
  const [depositsTimeFilter, setDepositsTimeFilter] = useState("Month");
  const [withdrawalsTimeFilter, setWithdrawalsTimeFilter] = useState("Month");
  const [showDepositsDropdown, setShowDepositsDropdown] = useState(false);
  const [showWithdrawalsDropdown, setShowWithdrawalsDropdown] = useState(false);

  const depositsDropdownRef = useRef<HTMLDivElement>(null);
  const withdrawalsDropdownRef = useRef<HTMLDivElement>(null);

  const timeFilterOptions = [
    "All",
    "Today",
    "Last Week",
    "Last Month",
    "Last 6 Months",
  ];

  // Calculate filtered amounts based on time period
  const getFilteredAmount = (baseAmount: number, timeFilter: string) => {
    switch (timeFilter) {
      case "All":
        return baseAmount;
      case "Today":
        return baseAmount * 0.1; // Example: 10% of total for today
      case "Last Week":
        return baseAmount * 0.3; // Example: 30% of total for last week
      case "Last Month":
        return baseAmount; // Current implementation shows monthly data
      case "Last 6 Months":
        return baseAmount * 2; // Example: 2x for 6 months
      default:
        return baseAmount;
    }
  };

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        depositsDropdownRef.current &&
        !depositsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowDepositsDropdown(false);
      }
      if (
        withdrawalsDropdownRef.current &&
        !withdrawalsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowWithdrawalsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (user) {
      dispatch(getP2PProfileThunk())
        .unwrap()
        .then((response) => {
          if (response?.profile?.photo) {
            setProfileImage(response.profile.photo);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch profile:", error);
        });
    }
  }, [dispatch, user]);

  // Format numbers with commas and 2 decimal places
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchTransactionSummary());
      dispatch(fetchWallets());
      dispatch(fetchMatchedTrades(1));
    }
  }, [dispatch, isAuthenticated]);

  return (
    <Card className="w-full p-2 dark:bg-[#1D1D23] bg-gray-50 rounded-2xl dark:border-[#35353E] border-gray-300 border-2 dark:text-white text-gray-900 shadow-lg">
      {/* Header */}
      <div className="flex w-full items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {profileImage ? (
            <div className="w-14 h-14 rounded-full overflow-hidden">
              <Image
                src={profileImage}
                alt="User avatar"
                width={56}
                height={56}
                className="object-cover w-full h-full"
                unoptimized={true}
              />
            </div>
          ) : (
            <div className="w-14 h-14 dark:bg-[#35353E] bg-gray-300 rounded-full flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                  className="stroke-[#788099]"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="7"
                  r="4"
                  className="stroke-[#788099]"
                  strokeWidth="2"
                />
              </svg>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold">
              {user?.first_name}
            </span>
            <span className="flex items-center gap-1 text-[#1D8751] text-xs font-medium">
              Verified Profile
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <div
            className="relative cursor-pointer"
            onClick={() => router.push("/dashboard/notifications")}
          >
            <img
              src="https://res.cloudinary.com/pitz/image/upload/v1750165834/Frame_34659_2_gmkz6l.png"
              alt="notifications"
              width={80}
            />
            {matchedTrades?.results && matchedTrades.results.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#E23D3A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {matchedTrades.results.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Total Transactions */}
      <div className="mb-6">
        <div className="dark:text-[#788099] text-gray-600 text-sm font-medium">
          Total Transactions
        </div>
        <div className="text-[15px] font-semibold mt-1 mb-2">
          {(summary?.total_approved_p2p_combined || 0) +
            (summary?.total_p2p_orders || 0)}{" "}
          USDT
        </div>
        <div className="border-b dark:border-[#35353E] border-gray-300 mt-2" />
      </div>

      {/* Deposits & Withdrawals */}
      <div className="mb-6">
        {/* Deposits */}
        <div className="mb-4">
          <div className="flex w-full items-center justify-between mb-2">
            <div className="dark:text-[#788099] text-gray-600 font-medium">
              Deposits
            </div>
            <div
              className="relative w-32 flex justify-end"
              ref={depositsDropdownRef}
            >
              <span
                className="dark:text-[#788099] text-gray-600 text-sm cursor-pointer flex items-center gap-1"
                onClick={() => setShowDepositsDropdown(!showDepositsDropdown)}
              >
                <span>{depositsTimeFilter}</span>
                <svg
                  className={`transition-transform duration-200 ${
                    showDepositsDropdown ? "rotate-180" : ""
                  }`}
                  width="12"
                  height="12"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M6 8L10 12L14 8"
                    stroke="#788099"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {showDepositsDropdown && (
                <div className="absolute top-6 right-0 dark:bg-[#2A2A35] bg-white dark:border-[#35353E] border-gray-300 rounded-lg shadow-lg z-10 w-full border">
                  {timeFilterOptions.map((option) => (
                    <div
                      key={option}
                      className="px-3 py-2 text-sm dark:text-white text-gray-900 dark:hover:bg-[#35353E] hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setDepositsTimeFilter(option);
                        setShowDepositsDropdown(false);
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="dark:text-white text-gray-900 font-medium mb-2">
            {formatNumber(
              getFilteredAmount(
                summary?.total_approved_p2p_deposits || 0,
                depositsTimeFilter
              )
            )}{" "}
            USD
          </div>
        </div>
        <div className="w-full h-3 dark:bg-[#35353E] bg-gray-300 rounded-full mb-4">
          <div
            className={`h-3 rounded-full ${
              (summary?.total_approved_p2p_deposits || 0) > 0
                ? "bg-[#1D8751]"
                : "bg-[#788099]"
            }`}
            style={{
              width: `${
                ((summary?.total_approved_p2p_deposits || 0) /
                  ((summary?.total_approved_p2p_deposits || 0) +
                    (summary?.total_approved_p2p_withdrawals || 0))) *
                100
              }%`,
            }}
          />
        </div>
        {/* Withdrawals */}
        <div className="mb-4">
          <div className="flex w-full items-center justify-between mb-2">
            <div className="dark:text-[#788099] text-gray-600 font-medium">
              Withdrawals
            </div>
            <div
              className="relative w-32 flex justify-end"
              ref={withdrawalsDropdownRef}
            >
              <span
                className="dark:text-[#788099] text-gray-600 text-sm cursor-pointer flex items-center gap-1"
                onClick={() =>
                  setShowWithdrawalsDropdown(!showWithdrawalsDropdown)
                }
              >
                <span>{withdrawalsTimeFilter}</span>
                <svg
                  className={`transition-transform duration-200 ${
                    showWithdrawalsDropdown ? "rotate-180" : ""
                  }`}
                  width="12"
                  height="12"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M6 8L10 12L14 8"
                    stroke="#788099"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {showWithdrawalsDropdown && (
                <div className="absolute top-6 right-0 dark:bg-[#2A2A35] bg-white dark:border-[#35353E] border-gray-300 rounded-lg shadow-lg z-10 w-full border">
                  {timeFilterOptions.map((option) => (
                    <div
                      key={option}
                      className="px-3 py-2 text-sm dark:text-white text-gray-900 dark:hover:bg-[#35353E] hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setWithdrawalsTimeFilter(option);
                        setShowWithdrawalsDropdown(false);
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="dark:text-white text-gray-900 font-medium mb-2">
            {formatNumber(
              getFilteredAmount(
                summary?.total_approved_p2p_withdrawals || 0,
                withdrawalsTimeFilter
              )
            )}{" "}
            USD
          </div>
        </div>
        <div className="w-full h-3 dark:bg-[#35353E] bg-gray-300 rounded-full mb-4">
          <div
            className={`h-3 rounded-full ${
              (summary?.total_approved_p2p_withdrawals || 0) > 0
                ? "bg-[#E23D3A]"
                : "bg-[#788099]"
            }`}
            style={{
              width: `${
                ((summary?.total_approved_p2p_withdrawals || 0) /
                  ((summary?.total_approved_p2p_deposits || 0) +
                    (summary?.total_approved_p2p_withdrawals || 0))) *
                100
              }%`,
            }}
          />
        </div>
        <div className="border-b dark:border-[#35353E] border-gray-300 mt-2" />
      </div>

      {/* Referral Section */}
      <div className="mb-2">
        <div className="text-lg font-semibold mb-1">Referral</div>
        <div className="dark:text-[#788099] text-gray-600 text-sm mb-3">
          Invite friends to earn commission money
        </div>
        <div className="border-b dark:border-[#35353E] border-gray-300 mb-3" />
        <div className="flex items-center justify-between mb-2">
          <span className="dark:text-[#788099] text-gray-600 text-sm">
            Users Invited:
          </span>
          <span className="text-[#1D8751] font-semibold">0 Users</span>
        </div>
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block" />
              Deposits
            </span>
            <span className="font-medium">{formatNumber(0)} USD</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#E23D3A] inline-block" />
              Withdrawals
            </span>
            <span className="font-medium">{formatNumber(0)} USD</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#3B82F6] inline-block" />
              Total
            </span>
            <span className="font-medium">{formatNumber(0)} USD</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Stats;
