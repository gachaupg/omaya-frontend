"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  isOtpPendingStatus,
  normalizeTransactionStatusForBadge,
} from "@/lib/utils/transactionFromTo";

type TransactionStatusCellProps = {
  status: unknown;
  transactionId?: string | null;
};

export function TransactionStatusCell({
  status,
  transactionId,
}: TransactionStatusCellProps) {
  const otpPending = isOtpPendingStatus(status);
  const badgeStatus = normalizeTransactionStatusForBadge(status);

  return (
    <div className="flex flex-col gap-1.5 items-start">
      <StatusBadge
        status={badgeStatus}
        title={
          otpPending
            ? "Enter the verification code sent to your email to complete this withdrawal."
            : undefined
        }
      />
      {otpPending && (
        <div className="text-[11px] leading-snug text-gray-500 dark:text-[#A0A3BC] max-w-[200px]">
          <p>Verification code required to complete this withdrawal.</p>
          <Link
            href={
              transactionId
                ? `/dashboard/account?tab=referral&resumeWithdrawal=${encodeURIComponent(transactionId)}`
                : "/dashboard/account?tab=referral"
            }
            className="text-[#1D8751] font-medium hover:underline mt-0.5 inline-block"
          >
            Complete OTP →
          </Link>
        </div>
      )}
    </div>
  );
}
