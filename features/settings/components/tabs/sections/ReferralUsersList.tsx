// src/features/p2p/components/ui/referral/sections/ReferralUsersList.tsx
"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";

interface ReferredUser {
  id: number;
  user_id: number;
  user_type: string;
  company_name: string | null;
  first_name: string;
  country: string | null;
  last_name: string;
  company_established: string | null;
  phone_number: string;
  email: string;
  role: string;
  referral_code: string;
  otp_verified: boolean;
  device: string;
  is_merchant: boolean;
}

interface Props {
  referredUsers: ReferredUser[];
  loading: boolean;
}

const ReferralUsersList: React.FC<Props> = ({ referredUsers, loading }) => {
  const [expandedUser, setExpandedUser] = useState<number | string | null>(
    null
  );

  /* ───────── helpers ───────── */
  const maskEmail = (email: string) => {
    if (!email) return "Email***@gmail.com";
    const [username, domain] = email.split("@");
    const maskedUsername =
      username.length > 3
        ? username.substring(0, 3) + "***"
        : username.substring(0, 1) + "***";
    return `${maskedUsername}@${domain}`;
  };

  const maskName = (firstName: string, lastName: string) => {
    if (!firstName && !lastName) return "Name ***";
    const maskedFirst = firstName ? `${firstName.substring(0, 2)}***` : "***";
    const maskedLast = lastName ? `${lastName.substring(0, 2)}***` : "***";
    return `${maskedFirst} ${maskedLast}`;
  };

  const getFullName = (firstName: string, lastName: string) => {
    return `${firstName} ${lastName}`.trim();
  };

  const getStatus = (otpVerified: boolean, isMerchant: boolean) => {
    if (isMerchant) return "Merchant";
    return otpVerified ? "Active" : "Pending Verification";
  };
  const skeleton = (
    <div className="space-y-2 w-full">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse h-16 w-full rounded-2xl bg-gray-200/70 dark:bg-[#2A2A32]"
        />
      ))}
    </div>
  );

  const emptyState = (
    <div
      className="w-full flex flex-col items-center justify-center py-12 px-4
                    rounded-2xl border bg-gray-50 dark:bg-[#1D1D23] border-gray-200
                     dark:border-[#35353F]"
    >
      <div
        className="w-20 h-20 mb-4 flex items-center justify-center rounded-full
                      bg-gray-100 dark:bg-[#18181B] border border-gray-200
                      dark:border-[#35353F]"
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1D8751"
          strokeWidth="2"
          className="flex-shrink-0"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
        No Referred Users Yet
      </h3>
      <p className="text-center text-gray-500 dark:text-[#A3A3A3] max-w-md">
        Share your referral code with friends and start earning rewards when
        they sign up.
      </p>
    </div>
  );

  /* ───────── render ───────── */
  return (
    <section className="flex-1 w-full">
      <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
        Users Registered With Your Code
      </h2>

      {loading && skeleton}

      {!loading && referredUsers.length === 0 && emptyState}

      {!loading && referredUsers.length > 0 && (
        <div className="space-y-0 border border-[#35353F] rounded-[18px] pl-2 pr-3 w-full">
          {referredUsers.map((u, index) => (
            <div key={u.id} className="w-full">
              {/* User Row */}
              <div
                className={`flex items-center gap-4 w-full px-6 py-4
                           bg-white dark:bg-transparent
                           ${index !== referredUsers.length - 1 ? "border-b border-[#35353F]" : ""}`}
              >
                {/* OA Avatar */}
                <div
                  className="w-12 h-12 flex items-center justify-center rounded-lg
                            bg-[#35353F] text-[#1D8751] text-lg font-bold"
                >
                  OA
                </div>

                {/* User Info */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium text-gray-800 dark:text-white truncate">
                    {maskEmail(u.email)}
                  </span>
                  <span className="text-sm font-medium text-[#1D8751]">
                    Profile status: {getStatus(u.otp_verified, u.is_merchant)}
                  </span>
                </div>

                {/* Details Button */}
                <Button
                  onClick={() =>
                    setExpandedUser(expandedUser === u.id ? null : u.id)
                  }
                  variant="ghost"
                  size="sm"
                  className="rounded-lg border px-4 py-2
                             border-[#35353F] text-[#1D8751] bg-[#18181B]
                             hover:bg-[#35353F]"
                >
                  {expandedUser === u.id ? "Close" : "Details"}
                </Button>
              </div>

              {/* Expanded Details */}
              {expandedUser === u.id && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-[#18181B] border-b border-gray-200 dark:border-[#35353F]">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[#1D8751] font-medium">
                        Client Email:
                      </span>
                      <span className="text-gray-800 dark:text-white">
                        {maskEmail(u.email)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[#1D8751] font-medium">
                        Client Name:
                      </span>
                      <span className="text-gray-800 dark:text-white">
                        {maskName(u.first_name, u.last_name)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[#1D8751] font-medium">
                        Client ID:
                      </span>
                      <span className="text-gray-800 dark:text-white">
                        {u.user_id}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[#1D8751] font-medium">
                        Phone Number:
                      </span>
                      <span className="text-gray-800 dark:text-white">
                        {u.phone_number}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[#1D8751] font-medium">
                        User Type:
                      </span>
                      <span className="text-gray-800 dark:text-white capitalize">
                        {u.user_type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[#1D8751] font-medium">
                        Referral Code:
                      </span>
                      <span className="text-gray-800 dark:text-white">
                        {u.referral_code}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[#1D8751] font-medium">
                        Profile Status:
                      </span>
                      <span className="text-gray-800 dark:text-white">
                        {getStatus(u.otp_verified, u.is_merchant)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ReferralUsersList;
