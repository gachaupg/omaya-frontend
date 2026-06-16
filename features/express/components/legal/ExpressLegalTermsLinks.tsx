"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

type ExpressLegalTermsLinksProps = {
  className?: string;
  linkClassName?: string;
  prefix?: ReactNode;
  onBeforeNavigate?: () => void;
};

const handleLinkClick = (
  event: MouseEvent<HTMLAnchorElement>,
  onBeforeNavigate?: () => void
) => {
  event.stopPropagation();
  onBeforeNavigate?.();
};

export function ExpressLegalTermsLinks({
  className = "text-[#35353e] dark:text-[#788099] text-sm leading-relaxed",
  linkClassName = "text-[#1D8751] underline hover:text-[#166b3e]",
  prefix = "I've read and agree to the ",
  onBeforeNavigate,
}: ExpressLegalTermsLinksProps) {
  return (
    <span className={className}>
      {prefix}
      <Link
        href="/legal/terms-of-service"
        className={linkClassName}
        onClick={(event) => handleLinkClick(event, onBeforeNavigate)}
      >
        Terms of Use
      </Link>
      ,{" "}
      <Link
        href="/legal/privacy-policy"
        className={linkClassName}
        onClick={(event) => handleLinkClick(event, onBeforeNavigate)}
      >
        Privacy Policy
      </Link>
      ,{" "}
      <Link
        href="/legal/payment-policy"
        className={linkClassName}
        onClick={(event) => handleLinkClick(event, onBeforeNavigate)}
      >
        Payment Policies
      </Link>
      ,{" "}
      <Link
        href="/legal/aml-kyc-policy"
        className={linkClassName}
        onClick={(event) => handleLinkClick(event, onBeforeNavigate)}
      >
        AML
      </Link>
      ,{" "}
      <Link
        href="/legal/risk-disclosure-statement"
        className={linkClassName}
        onClick={(event) => handleLinkClick(event, onBeforeNavigate)}
      >
        Risk Disclosure Statements
      </Link>
      .
    </span>
  );
}
