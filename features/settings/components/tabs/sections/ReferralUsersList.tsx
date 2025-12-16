// src/features/p2p/components/ui/referral/sections/ReferralUsersList.tsx
"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";

interface ReferredUser {
  id: number;
  user_id: number;
  user_type: string;
  created_at?: string;
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(dateString));
    } catch (error) {
      return "—";
    }
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
          className="animate-pulse h-16 w-full rounded-2xl bg-gray-200/70 dark:bg-[var(--card-color)]"
        />
      ))}
    </div>
  );

  const emptyState = (
    <div
      className="w-full flex flex-col items-center justify-center py-12 px-4
                    rounded-2xl border bg-gray-50 dark:bg-[var(--card-color)] border-gray-200
                     dark:border-[#35353F]"
    >
      <div
        className="w-20 h-20 mb-4 flex items-center justify-center rounded-full
                      bg-gray-100 dark:bg-[var(--card-color)] border border-gray-200
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
                           bg-white dark:bg-[var(--card-color)]
                           ${index !== referredUsers.length - 1 ? "border-b border-[#35353F]" : ""}`}
              >
                {/* OA Avatar */}
                <div
                  className="w-14 h-14 flex items-center justify-center rounded-2xl
                            bg-[#35353F] text-white dark:text-[#1D8751]
                            text-xl font-semibold tracking-tight"
                >
                  OA
                </div>

                {/* User Info */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-base font-semibold text-gray-900 dark:text-white truncate">
                    {maskEmail(u.email)}
                  </span>
                  <span className="text-sm font-semibold text-[#1D8751]">
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
                             border-[#35353F] text-[#1D8751] bg-[var(--bg-color)]
                             hover:bg-[#35353F]"
                >
                  {expandedUser === u.id ? "Close" : "Details"}
                </Button>
              </div>

              {/* Expanded Details */}
              {expandedUser === u.id && (
                <div className="px-6 py-6 bg-transparent dark:bg-[var(--card-color)] border-t border-[#DDE3EE] dark:border-[#35353F] rounded-b-[18px]">
                  <dl className="divide-y divide-[#DDE3EE] dark:divide-[#35353F]">
                    {[
                      {
                        label: "Client Email",
                        value: maskEmail(u.email),
                      },
                      {
                        label: "Client Name",
                        value: maskName(u.first_name, u.last_name),
                      },
                      {
                        label: "Client ID",
                        value: u.user_id,
                      },
                      {
                        label: "Date Joined",
                        value: formatDate(u.created_at),
                      },
                      {
                        label: "Profile Status",
                        value: getStatus(u.otp_verified, u.is_merchant),
                      },
                    ].map((field) => (
                      <div
                        key={field.label}
                        className="flex justify-between items-center py-3 first:pt-0 last:pb-0"
                      >
                        <dt className="text-sm font-semibold text-[#1D8751] tracking-tight">
                          {field.label}
                        </dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-[#B8C1D1] text-right">
                          {field.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
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
