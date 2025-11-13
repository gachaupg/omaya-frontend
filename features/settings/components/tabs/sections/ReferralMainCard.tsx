// src/features/p2p/components/ui/referral/sections/ReferralMainCard.tsx
"use client";

import React from "react";
import { QrCode } from "lucide-react";

import Button from "@/components/ui/Button";
import CopyButton from "@/components/ui/CopyButton";
import { DonutChartWithCenter } from "@/components/ui/DonutChartWithCenter";
import { formatCurrency } from "@/lib/globalFormatter";

interface Props {
  user: any;
  walletData: any;
  walletLoading: boolean;
  walletError: any;
  setShowWithdrawPage: (v: boolean) => void;
}

const ReferralMainCard: React.FC<Props> = ({
  user,
  walletData,
  walletLoading,
  walletError,
  setShowWithdrawPage,
}) => {
  /* ───────────── helpers ───────────── */
  const deposits = walletData?.total_earned ?? 0;
  const withdrawals = walletData?.total_withdrawn ?? 0;
  const balance = walletData?.balance ?? 0;
  const total = deposits + withdrawals;

  const chartData =
    total === 0
      ? []
      : [
          { label: "Income from deposits", value: deposits, color: "#1D8751" },
          {
            label: "Income from withdrawals",
            value: withdrawals,
            color: "#EF4444",
          },
        ];

  /* ───────────── render ───────────── */
  return (
    <>
      <div
        className="w-full rounded-2xl p-3 mb-4 flex flex-col lg:flex-row gap-4
                    shadow-lg bg-white border-gray-200
                    dark:bg-transparent dark:border-[#35353E]"
      >
        {/* ───────── left column ───────── */}
        <div className="flex-1 flex flex-col justify-between gap-4">
          {/* copy blurb */}
          <div>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-[#A3A3A3] mb-2">
              Earn commissions by referring friends to our platform. Share your unique referral code and start earning rewards.
            </p>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-[#A3A3A3] mb-2">
              You'll receive a percentage of trading fees from users who sign up using your referral code.
            </p>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-[#A3A3A3]">
              Track your earnings and withdraw your commissions anytime.
            </p>
          </div>

          {/* withdraw btn */}
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowWithdrawPage(true)}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl py-2 flex items-center justify-center gap-2"
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <path d="M8 12h8M12 8v8" />
            </svg>
            Withdraw
          </Button>
        </div>

        {/* ───────── right column ───────── */}
        <div className="flex-1 flex items-center justify-center">
          <div
            className="w-full max-w-[370px] rounded-2xl px-4 sm:px-6 py-4
                        border bg-gray-50 border-gray-200
                        dark:bg-transparent dark:border-[#35353F]"
          >
            {walletError && (
              <p className="text-center text-red-500">
                Failed to load wallet data
              </p>
            )}

            {walletLoading && !walletError && (
              <p className="text-center text-gray-500 dark:text-[#A3A3A3]">
                Loading…
              </p>
            )}

            {!walletLoading && !walletError && (
              <>
                {/* donut */}
                <div className="flex flex-col items-center mb-4">
                  <DonutChartWithCenter
                    data={chartData}
                    total={total}
                    label="Commissions"
                    centerValue={balance}
                  />

                  {/* legend */}
                  <div className="flex flex-col gap-2 mt-4 w-full">
                    {chartData.map(({ label, value, color }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between w-full"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            className="w-4 h-4 rounded inline-block flex-shrink-0"
                            style={{ background: color }}
                          />
                          <span className="text-xs sm:text-sm truncate text-gray-600 dark:text-[#A3A3A3]">
                            {label}
                          </span>
                        </div>
                        <span
                          className={`${
                            value ? "text-white" : "text-gray-500"
                          } font-semibold text-sm sm:text-base ml-2`}
                        >
                          {formatCurrency(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* stats */}
                <div className="space-y-1">
                  <StatRow label="Total Earned" value={deposits} />
                  <StatRow label="Total Withdrawals" value={withdrawals} />
                  <StatRow
                    label="Available Balance"
                    value={balance}
                    highlight
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium text-[#1D8751] mb-1">
          Your Referral Code
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 w-full justify-between rounded-[24px] border px-3 py-2
                    border-[#1D8751] overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <p className="w-3 h-3 rounded-full bg-[#1D8751] flex-shrink-0" > </p>
                <span className="font-mono text-sm tracking-widest text-[#1D8751] truncate">
                  {user?.referral_code}
                </span>
              </div>
              <div>
                 <QrCode size={18} className="text-[#1D8751] flex-shrink-0" />
              </div>
            </div>
          </div>
          <CopyButton
            value={user?.referral_code ?? ""}
            className="bg-[#E8EFF5] dark:bg-[#35353E] border-[#1D8751] text-[#1D8751] hover:text-white
                   hover:bg-[#1D8751] rounded-full px-3 py-2 text-sm"
            showIcon={true}
          >
            Copy
          </CopyButton>
        </div>
      </div>
    </>
  );
};

/* small sub-component for clarity */
const StatRow: React.FC<{
  label: string;
  value: number;
  highlight?: boolean;
}> = ({ label, value, highlight = false }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-sm sm:text-base text-gray-600 dark:text-[#A3A3A3]">
      {label}
    </span>
    <span
      className={`font-semibold text-sm sm:text-lg ${
        highlight ? "text-[#1D8751]" : "text-gray-900 dark:text-white"
      }`}
    >
      {formatCurrency(value)}
    </span>
  </div>
);

export default ReferralMainCard;
