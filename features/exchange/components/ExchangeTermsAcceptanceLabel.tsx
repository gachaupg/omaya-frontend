import Link from "next/link";
import type { MouseEvent } from "react";

type ExchangeTermsAcceptanceLabelProps = {
  textClassName?: string;
  linkClassName?: string;
};

const stopLabelToggle = (event: MouseEvent<HTMLAnchorElement>) => {
  event.stopPropagation();
};

export function ExchangeTermsAcceptanceLabel({
  textClassName = "text-white text-sm leading-relaxed",
  linkClassName = "text-[#1D8751] underline hover:text-[#166b3e]",
}: ExchangeTermsAcceptanceLabelProps) {
  return (
    <span className={textClassName}>
      I&apos;ve read and agree to OMAYA.io{" "}
      <Link
        href="/legal/terms-of-service"
        className={linkClassName}
        onClick={stopLabelToggle}
      >
        Terms of Use
      </Link>
      ,{" "}
      <Link
        href="/legal/privacy-policy"
        className={linkClassName}
        onClick={stopLabelToggle}
      >
        Privacy Policy
      </Link>
      ,{" "}
      <Link
        href="/legal/payment-policy"
        className={linkClassName}
        onClick={stopLabelToggle}
      >
        Payment Policy
      </Link>
      ,{" "}
      <Link
        href="/legal/aml-kyc-policy"
        className={linkClassName}
        onClick={stopLabelToggle}
      >
        AML/KYC Policy
      </Link>
      ,{" "}
      <Link
        href="/legal/risk-disclosure-statement"
        className={linkClassName}
        onClick={stopLabelToggle}
      >
        Risk Disclosure Statement
      </Link>
      .
    </span>
  );
}
