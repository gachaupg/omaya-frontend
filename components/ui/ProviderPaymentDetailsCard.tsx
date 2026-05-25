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
          rows.map((row) => (
            <div key={row.label} className={rowClassName}>
              <span className={labelClassName}>{row.label}</span>
              <div className="flex items-center gap-2 min-w-0">
                <span className={`${valueClassName} min-w-0`}>{row.value}</span>
                {row.copyable ? (
                  <button
                    type="button"
                    onClick={() => handleCopy(row)}
                    className="flex-shrink-0 p-1.5 rounded-lg bg-[#1D8751]/20 text-[#1D8751] hover:bg-[#1D8751]/30 transition-colors"
                    title={`Copy ${row.label.toLowerCase()}`}
                    aria-label={`Copy ${row.label.toLowerCase()}`}
                  >
                    {copiedKey === row.label ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h2m8 0h2a2 2 0 012 2v2m2 4a2 2 0 01-2 2h-8a2 2 0 01-2-2v-8"
                        />
                      </svg>
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
