"use client";

import React, { useState } from "react";
import {
  getPaymentDetailDisplayRows,
  type PaymentDetailDisplayRow,
} from "@/features/express/utils/paymentDetailDisplay";
import { showToast } from "@/lib/utils/toast";

type ProviderPaymentDetailsCardProps = {
  paymentDetail: unknown;
  fallbackProviderName?: string;
  instruction?: React.ReactNode;
  className?: string;
  rowClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
};

const copyValue = async (value: string, label: string) => {
  try {
    await navigator.clipboard.writeText(value);
    showToast.success(`${label} copied`);
  } catch {
    showToast.error("Failed to copy");
  }
};

const CopyButton = ({
  row,
  copiedKey,
  onCopy,
}: {
  row: PaymentDetailDisplayRow;
  copiedKey: string | null;
  onCopy: (row: PaymentDetailDisplayRow) => void;
}) => (
  <button
    type="button"
    onClick={() => onCopy(row)}
    className="flex-shrink-0 p-1.5 rounded-lg bg-[#1D8751]/20 text-[#1D8751] hover:bg-[#1D8751]/30 transition-colors"
    title={`Copy ${row.label.toLowerCase()}`}
    aria-label={`Copy ${row.label.toLowerCase()}`}
  >
    {copiedKey === row.label ? (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ) : (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h2m8 0h2a2 2 0 012 2v2m2 4a2 2 0 01-2 2h-8a2 2 0 01-2-2v-8"
        />
      </svg>
    )}
  </button>
);

const AccountDetailColumnLine = ({
  row,
  copiedKey,
  onCopy,
  labelClassName,
  valueClassName,
}: {
  row: PaymentDetailDisplayRow;
  copiedKey: string | null;
  onCopy: (row: PaymentDetailDisplayRow) => void;
  labelClassName: string;
  valueClassName: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <span className={labelClassName}>{row.label}</span>
    <div className="flex items-center justify-between gap-2 min-w-0">
      <span className={`${valueClassName} min-w-0 break-all`}>{row.value}</span>
      {row.copyable !== false ? (
        <CopyButton row={row} copiedKey={copiedKey} onCopy={onCopy} />
      ) : null}
    </div>
  </div>
);

export default function ProviderPaymentDetailsCard({
  paymentDetail,
  fallbackProviderName,
  instruction,
  className = "bg-white dark:bg-[#18181D] border border-border dark:border-[#35353E] rounded-2xl p-4 mb-4 sm:mb-6",
  rowClassName = "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 p-3 border border-border dark:border-[#35353E] rounded-xl",
  labelClassName = "text-[#788099] text-sm",
  valueClassName = "text-[#35353e] dark:text-white font-medium text-sm truncate",
}: ProviderPaymentDetailsCardProps) {
  const rows = getPaymentDetailDisplayRows(paymentDetail, {
    fallbackName: fallbackProviderName,
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (row: PaymentDetailDisplayRow) => {
    void copyValue(row.value, row.label).then(() => {
      setCopiedKey(row.label);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const accountNameRow = rows.find((row) => row.label === "Account name");
  const accountNumberRow = rows.find((row) => row.label === "Account number");
  const otherRows = rows.filter(
    (row) => row.label !== "Account name" && row.label !== "Account number"
  );

  return (
    <div className={className}>
      {instruction ? (
        <div className="text-[#35353e] dark:text-[#788099] text-sm sm:text-base mb-4">
          {instruction}
        </div>
      ) : null}
      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className={`${labelClassName} text-center py-2`}>
            Payment details are not available for this provider. Please contact
            support or choose another payment method.
          </p>
        ) : (
          <>
            {(accountNameRow || accountNumberRow) && (
              <div className="p-3 border border-border dark:border-[#35353E] rounded-xl space-y-3">
                {accountNameRow ? (
                  <AccountDetailColumnLine
                    row={accountNameRow}
                    copiedKey={copiedKey}
                    onCopy={handleCopy}
                    labelClassName={labelClassName}
                    valueClassName={valueClassName}
                  />
                ) : null}
                {accountNameRow && accountNumberRow ? (
                  <div className="border-t border-dashed border-[#E3E6F0] dark:border-[#35353E]" />
                ) : null}
                {accountNumberRow ? (
                  <AccountDetailColumnLine
                    row={accountNumberRow}
                    copiedKey={copiedKey}
                    onCopy={handleCopy}
                    labelClassName={labelClassName}
                    valueClassName={valueClassName}
                  />
                ) : null}
              </div>
            )}
            {otherRows.map((row) => (
              <div key={row.label} className={rowClassName}>
                <AccountDetailColumnLine
                  row={row}
                  copiedKey={copiedKey}
                  onCopy={handleCopy}
                  labelClassName={labelClassName}
                  valueClassName={valueClassName}
                />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
