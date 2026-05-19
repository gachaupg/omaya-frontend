/**
 * Copy for Express / P2P crypto withdrawal (USDT on BEP20) — dashboard, home, and rates.
 */

export const EXPRESS_P2P_WITHDRAWAL_TERMS_INTRO =
  "Before proceeding with a P2P Withdrawal transaction, please carefully read and agree to the following terms:";

export const EXPRESS_P2P_WITHDRAWAL_TERMS_SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "Use your own wallet only",
    body: "You must provide a wallet address that you personally own and control. Third-party or intermediary wallets are not allowed.",
  },
  {
    heading: "Correct asset and network required",
    body: "You must provide a USDT wallet address on the BEP20 (BNB Smart Chain) network only. Providing any other asset address or using a different network may result in permanent loss of funds.",
  },
  {
    heading: "Provide the correct receiving address",
    body: "You must enter the correct USDT (BEP20) receiving wallet address. Ensure the address is accurate and fully compatible with the BEP20 network before confirming the transaction.",
  },
  {
    heading: "Irreversible transactions & user responsibility",
    body:
      "Blockchain transactions are irreversible.\nIf you provide:\n• an incorrect wallet address, or\n• a wallet address on the wrong network,\n\nthe funds will be permanently lost, and we will not be able to recover or assist in any way.",
  },
  {
    heading: "Acceptance of terms",
    body:
      "Before submitting the withdrawal, you must confirm that you have read and accepted:\n\nall the terms and conditions listed above, and\n\nour full Terms of Service.",
  },
];

/** Long-form content for the “Terms of Service” modal from the withdrawal checkbox. */
export const EXPRESS_P2P_WITHDRAWAL_TERMS_OF_SERVICE_MODAL: string[] = [
  ...EXPRESS_P2P_WITHDRAWAL_TERMS_SECTIONS.map(
    (s) => `${s.heading}: ${s.body}`
  ),
  "By using this withdrawal service, you confirm that all payment details and receiving wallet information submitted by you are true, accurate, and belong to you. You are solely responsible for ensuring the wallet address, asset, and network (BEP20 / USDT) are correct before submitting any request.",
  "You agree to provide complete transaction information, including required references such as transaction identifiers where requested. If mandatory information is missing or incorrect, your transaction may be delayed, placed under review, rejected, or returned according to operational and compliance procedures.",
  "Processing times, fees, commissions, exchange rates, and applicable limits may vary depending on network conditions, liquidity, provider availability, security checks, and market volatility. Any estimate shown before completion is indicative only and does not constitute a final guaranteed settlement amount.",
  "You acknowledge that OMAYA may perform verification, compliance, and fraud-prevention checks at any stage of the transaction lifecycle. Transactions that appear suspicious, violate policy, or conflict with AML/KYC requirements may be paused, restricted, cancelled, or escalated for manual review without prior notice.",
  "By proceeding, you confirm that you have read and accepted these Terms of Service and related legal documents, including the Privacy Policy, Payment Policies, AML Policy, and Risk Disclosure Statements. Continued use of this service indicates your consent to be bound by current terms and any lawful updates published by OMAYA.",
];
