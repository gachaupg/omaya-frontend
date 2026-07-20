"use client";

import React, { useState } from "react";
import { getHomeP2PPaymentLogo } from "../utils/paymentLogo";

const DUMMY_PAYMENT_LOGO = "/default-provider-logo.svg";
const PAYMENT_PREVIEW_COUNT = 1;

type PaymentMethod = {
  id?: number;
  provider?: string;
  provider_logo?: string | null;
};

type P2PPaymentMethodsProps = {
  paymentDetails?: PaymentMethod[];
};

function PaymentMethodPill({ method }: { method: PaymentMethod }) {
  const provider = method.provider?.trim() || "Payment";
  const logo =
    (typeof method.provider_logo === "string" && method.provider_logo.trim()) ||
    getHomeP2PPaymentLogo(provider);

  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-gray-200 dark:border-[#35353E] bg-gray-100 dark:bg-[#23232B] px-2 py-0.5">
      <img
        src={logo}
        alt=""
        className="h-3.5 w-3.5 shrink-0 rounded-full object-cover"
        onError={(event) => {
          event.currentTarget.src = DUMMY_PAYMENT_LOGO;
        }}
      />
      <span className="truncate text-[11px] font-medium text-gray-800 dark:text-[#E4E4E6]">
        {provider}
      </span>
    </span>
  );
}

export function P2PPaymentMethods({ paymentDetails }: P2PPaymentMethodsProps) {
  const [expanded, setExpanded] = useState(false);
  const methods = (paymentDetails ?? []).filter(
    (method) => method && typeof method === "object" && method.provider?.trim()
  );

  if (!methods.length) {
    return null;
  }

  const hiddenCount = Math.max(0, methods.length - PAYMENT_PREVIEW_COUNT);
  const displayList = expanded
    ? methods
    : methods.slice(0, PAYMENT_PREVIEW_COUNT);

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:mt-2">
      {displayList.map((method, index) => (
        <PaymentMethodPill
          key={method.id ?? `${method.provider}-${index}`}
          method={method}
        />
      ))}
      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="cursor-pointer inline-flex items-center rounded-full bg-gray-100 dark:bg-[#35353E] px-2 py-0.5 text-[10px] font-semibold text-[#1D8751] hover:opacity-80 transition-opacity"
          aria-expanded={expanded}
          aria-label={
            expanded
              ? "Hide extra payment methods"
              : `Show ${hiddenCount} more payment methods`
          }
        >
          {expanded ? "Show less" : `+${hiddenCount} more`}
        </button>
      ) : null}
    </div>
  );
}
