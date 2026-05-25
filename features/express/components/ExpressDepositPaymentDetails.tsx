"use client";

import React from "react";
import { getPaymentDetailDisplayRows } from "@/features/express/utils/paymentDetailDisplay";
import { showToast } from "@/lib/utils/toast";

type ExpressDepositPaymentDetailsProps = {
  paymentDetail: unknown;
  fallbackProviderName?: string;
  isDark?: boolean;
  copiedField?: string | null;
  onCopiedField?: (field: string | null) => void;
};

const CopyIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
    <rect x="3" y="3" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export default function ExpressDepositPaymentDetails({
  paymentDetail,
  fallbackProviderName,
  isDark = false,
  copiedField,
  onCopiedField,
}: ExpressDepositPaymentDetailsProps) {
  const rows = getPaymentDetailDisplayRows(paymentDetail, {
    fallbackName: fallbackProviderName,
  });
  const divider = `${isDark ? "border-[#39394a]" : "border-[#E2E8F0]"} border-t border-dashed mb-2`;
  const labelClass = `${isDark ? "text-[#788099]" : "text-[#7e7e8f]"} text-base font-medium`;
  const valueClass = `${isDark ? "text-white" : "text-[#35353e]"} text-base font-medium`;

  if (rows.length === 0) {
    return (
      <p className={`${isDark ? "text-[#788099]" : "text-[#7e7e8f]"} text-sm py-2`}>
        Payment details are not available for this provider.
      </p>
    );
  }

  return (
    <>
      {rows.map((row, index) => (
        <React.Fragment key={row.label}>
          {index > 0 ? <div className={divider} /> : null}
          <div className="flex items-center justify-between mb-2">
            <span className={labelClass}>{row.label} :</span>
            <div className="flex items-center gap-2 min-w-0 max-w-[65%] justify-end">
              <span className={`${valueClass} truncate break-all text-right`}>
                {row.value}
              </span>
              {row.copyable ? (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(row.value);
                    onCopiedField?.(row.label);
                    if (!onCopiedField) {
                      showToast.success(`${row.label} copied!`);
                    } else {
                      setTimeout(() => onCopiedField(null), 2000);
                    }
                  }}
                  className="text-[#F79330] hover:text-white transition-colors p-2 sm:p-1 rounded min-h-[44px] sm:min-h-0 flex items-center justify-center touch-manipulation flex-shrink-0"
                  title={`Copy ${row.label}`}
                >
                  {copiedField === row.label ? (
                    <span className="text-xs text-[#1D8751] font-medium">copied!</span>
                  ) : (
                    <CopyIcon />
                  )}
                </button>
              ) : null}
            </div>
          </div>
        </React.Fragment>
      ))}
    </>
  );
}
