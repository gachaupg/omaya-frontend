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
        className="w-full bg-transparent text-[#0B0F23]
                    flex flex-col gap-8 lg:flex-row lg:items-stretch
 dark:text-white"
      >
        {/* ───────── left column ───────── */}
        <div className="flex-1 flex flex-col justify-between gap-6">
          <div className="space-y-4 text-sm leading-6 text-[#4C526A] dark:text-[#A3AED0]">
            <p>
              Earn lifetime commissions whenever traders you invite close a deal. Share your code, let them complete their first order, and the platform automatically adds your percentage to this wallet.
            </p>
            <p>
              Withdraw whenever you’re ready—no need to track spreadsheets or manual payouts. Everything syncs in real time so you can focus on growing your network.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowWithdrawPage(true)}
            className="w-full sm:w-auto px-10 h-[48px] bg-[#FF5E5B] hover:bg-[#ff4946]
                       rounded-[999px]
                       text-white font-semibold tracking-wide flex items-center justify-center gap-2"
          >
            <img
              src="https://res.cloudinary.com/pitz/image/upload/v1763908134/Group_3_ocyc3p.png"
              alt="Withdraw icon"
              width={22}
              height={22}
              className="flex-shrink-0"
            />
            Withdraw
          </Button>
        </div>

        <div className="flex-1 flex items-stretch">
          <div
            className="w-full rounded-[26px] border border-[#E2E8F0FF] bg-transparent
                       px-4 py-4 flex flex-col dark:border-[#35353e]"
          >

            {walletError && (
              <p className="text-center text-red-400">Failed to load wallet data</p>
            )}

            {walletLoading && !walletError && (
              <p className="text-center text-[#8C92B2]">Loading…</p>
            )}

            {!walletLoading && !walletError && (
              <>
                <div className="flex flex-col items-center gap-4 mb-4">
                  <DonutChartWithCenter
                    data={chartData}
                    total={total}
                    label="Commissions"
                    centerValue={balance}
                  />
                </div>
                <div className="flex flex-col gap-3 mt-2">
                  {chartData.map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className="w-3.5 h-3.5 rounded-full inline-flex flex-shrink-0"
                          style={{ background: color }}
                        />
                        <span className="text-sm text-[#4C526A] dark:text-[#E2E6FF] truncate">
                          {label}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-[#0B0F23] dark:text-white">
                        {formatCurrency(value)}
                      </span>
                    </div>
                  ))}
                </div>

              </>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 mt-10">
        <div className="text-sm font-medium text-[#1D8751] mb-3">
          Your Referral Code
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className="flex items-center gap-3 rounded-[28px] border border-[#1D8751]
                       bg-transparent px-4 py-3 min-w-[260px] flex-1 w-full"
          >
            <span className="w-3 h-3 rounded-full bg-[#1D8751] flex-shrink-0" />
            <span className="font-mono text-sm sm:text-base tracking-[0.4em] text-[#1D8751] uppercase truncate flex-1">
              {user?.referral_code || "123456789"}
            </span>
            <QrCode size={18} className="text-[#1D8751] flex-shrink-0" strokeWidth={2} />
          </div>
          <CopyButton
            value={user?.referral_code ?? ""}
            className="bg-[#1D1D23] border border-[#35353E] text-[#1D8751]
                       hover:opacity-80 rounded-[999px] px-4 py-3 text-sm font-semibold transition-opacity flex-shrink-0"
            showIcon={true}
          >
            Copy
          </CopyButton>
        </div>
      </div>
    </>
  );
};

export default ReferralMainCard;
