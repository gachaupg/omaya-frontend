import React, { useEffect, useState } from "react";
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
import { formatNumber } from "@/utils/formatters";
const Stats = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const summary = useSelector(selectTransactionSummary);
  console.log("summary", summary);
  const [profileImage, setProfileImage] = useState("");

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
    }
  }, [dispatch, isAuthenticated]);

  return (
    <Card className="w-full p-2 bg-[#18181D] rounded-2xl border border-[#35353E] text-white shadow-lg">
      {/* Header */}
      <div className="flex w-full items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {profileImage ? (
            <Image
              src={profileImage}
              alt="User avatar"
              width={56}
              height={56}
              className="object-cover rounded-full"
              unoptimized={true}
            />
          ) : (
            <div className="w-14 h-14 bg-[#35353E] rounded-full flex items-center justify-center">
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
          <img
            src="https://res.cloudinary.com/pitz/image/upload/v1750165834/Frame_34659_2_gmkz6l.png"
            alt="notifications"
            width={80}
          />
        </div>
      </div>

      {/* Total Transactions */}
      <div className="mb-6">
        <div className="text-[#788099] text-sm font-medium">
          Total Transactions
        </div>
        <div className="text-[15px] font-semibold mt-1 mb-2">
          {(summary?.total_approved_p2p_combined || 0) +
            (summary?.total_p2p_orders || 0)}{" "}
          USDT
        </div>
        <div className="border-b border-[#35353E] mt-2" />
      </div>

      {/* Deposits & Withdrawals */}
      <div className="mb-6">
        {/* Deposits */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[#788099] font-medium">Deposits</span>
              <span className="text-[#788099] text-sm">
                Month{" "}
                <svg
                  className="inline ml-1"
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
            </div>
            <span className="text-white font-medium">
              {formatNumber(summary?.total_approved_p2p_deposits || 0)} USD
            </span>
          </div>
        </div>
        <div className="w-full h-3 bg-[#35353E] rounded-full mb-4">
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
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center flex-col gap-2">
            <div className="flex items-center gap-2 justify-between">
              <span className="text-[#788099] font-medium">Withdrawals</span>

              <span className="text-[#788099] text-sm">
                Month{" "}
                <svg
                  className="inline ml-1"
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
            </div>
            <span className="text-white font-medium">
              {formatNumber(summary?.total_approved_p2p_withdrawals || 0)} USD
            </span>
          </div>
        </div>
        <div className="w-full h-3 bg-[#35353E] rounded-full mb-4">
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
        <div className="border-b border-[#35353E] mt-2" />
      </div>

      {/* Referral Section */}
      <div className="mb-2">
        <div className="text-lg font-semibold mb-1">Referral</div>
        <div className="text-[#788099] text-sm mb-3">
          Invite friends to earn commission money
        </div>
        <div className="border-b border-[#35353E] mb-3" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#788099] text-sm">Users Invited:</span>
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
