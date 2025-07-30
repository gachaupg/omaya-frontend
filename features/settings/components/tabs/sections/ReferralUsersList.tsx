// src/features/p2p/components/ui/referral/sections/ReferralUsersList.tsx
"use client";

import React from "react";
import Button from "@/components/ui/Button";

interface Props {
  referredUsers: Array<{
    id: number | string;
    name: string;
    email: string;
    status: string;
  }>;
  loading: boolean;
}

const ReferralUsersList: React.FC<Props> = ({ referredUsers, loading }) => {
  /* ───────── helpers ───────── */
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
                    rounded-2xl border bg-gray-50 border-gray-200
                    dark:bg-[#23232B] dark:border-[#35353F]"
    >
      <div
        className="w-20 h-20 mb-4 flex items-center justify-center rounded-full
                      bg-gray-100 border border-gray-200
                      dark:bg-[#18181B] dark:border-[#35353F]"
      >
        <svg
          width="40"
          height="40"
          fill="none"
          stroke="#1D8751"
          strokeWidth="2"
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

      {!loading &&
        referredUsers.length > 0 &&
        referredUsers.map((u) => (
          <div
            key={u.id}
            className="flex items-center gap-4 w-full mb-2
                       rounded-2xl border px-6 py-4
                       bg-white border-gray-200
                       dark:bg-[#23232B] dark:border-[#35353F]"
          >
            <div
              className="w-14 h-14 flex items-center justify-center rounded-full
                            bg-gray-200 text-gray-600 text-2xl font-bold
                            dark:bg-[#35353F] dark:text-[#A3A3A3]"
            >
              {u.name?.charAt(0).toUpperCase()}
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-gray-800 dark:text-white truncate">
                {u.email}
              </span>
              <span className="text-sm font-medium text-[#1D8751]">
                Profile status: {u.status}
              </span>
            </div>

            <Button
              variant="ghost"
              size="md"
              className="ml-auto rounded-full border px-6 py-2
                         border-gray-300 text-gray-500 bg-gray-50
                         hover:bg-gray-200
                         dark:border-[#35353F] dark:bg-[#18181B] dark:text-[#A3A3A3]
                         dark:hover:bg-[#35353F]"
            >
              Close
            </Button>
          </div>
        ))}
    </section>
  );
};

export default ReferralUsersList;
