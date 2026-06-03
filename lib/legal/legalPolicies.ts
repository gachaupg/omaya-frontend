/**
 * Canonical legal policies for OMAYA.io — footer and /legal/[slug] routes.
 */

export type LegalPolicyDefinition = {
  slug: string;
  title: string;
  lastUpdated: string;
  fileName: string;
  /** Alternate URL slugs that resolve to this policy */
  aliases?: string[];
};

export const LEGAL_POLICIES: readonly LegalPolicyDefinition[] = [
  {
    slug: "terms-of-service",
    title: "Terms of Service",
    lastUpdated: "31 May 2026",
    fileName: "OMAYA-Terms-of-Service-v1.5.md",
    aliases: ["terms"],
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    lastUpdated: "31 May 2026",
    fileName: "OMAYA-Privacy-Policy-v1.2.md",
    aliases: ["data-use-policy"],
  },
  {
    slug: "cookies-policy",
    title: "Cookie Policy",
    lastUpdated: "31 May 2026",
    fileName: "OMAYA-Cookie-Policy-v1.1.md",
    aliases: ["cookie-use"],
  },
  {
    slug: "aml-kyc-policy",
    title: "AML/KYC Policy",
    lastUpdated: "31 May 2026",
    fileName: "OMAYA-AML-KYC-Policy-v1.1.md",
    aliases: ["aml-policy"],
  },
  {
    slug: "risk-disclosure-statement",
    title: "Risk Disclosure Statement",
    lastUpdated: "31 May 2026",
    fileName: "OMAYA-Risk-Disclosure-Statement-v1.1.md",
  },
  {
    slug: "law-enforcement-request-guidelines",
    title: "Law Enforcement Request Guidelines",
    lastUpdated: "31 May 2026",
    fileName: "OMAYA-Law-Enforcement-Request-Guidelines-v1.1.md",
  },
  {
    slug: "payment-policy",
    title: "Payment Policy",
    lastUpdated: "31 May 2026",
    fileName: "OMAYA-Payment-Policy-v1.1.md",
  },
  {
    slug: "referral-program-terms",
    title: "Referral Program Terms",
    lastUpdated: "31 May 2026",
    fileName: "OMAYA-Referral-Program-Terms-v1.1.md",
  },
] as const;

const SLUG_LOOKUP = new Map<string, LegalPolicyDefinition>();

for (const policy of LEGAL_POLICIES) {
  SLUG_LOOKUP.set(policy.slug, policy);
  for (const alias of policy.aliases ?? []) {
    SLUG_LOOKUP.set(alias, policy);
  }
}

export function resolveLegalPolicy(slug: string): LegalPolicyDefinition | null {
  const key = String(slug || "").trim().toLowerCase();
  if (!key) return null;
  return SLUG_LOOKUP.get(key) ?? null;
}

export function getAllLegalPolicySlugs(): string[] {
  const slugs = new Set<string>();
  for (const policy of LEGAL_POLICIES) {
    slugs.add(policy.slug);
    for (const alias of policy.aliases ?? []) {
      slugs.add(alias);
    }
  }
  return Array.from(slugs);
}

/** Legacy filenames kept in repo before OMAYA versioned names were added */
export const LEGAL_POLICY_LEGACY_FILES: Record<string, string> = {
  "OMAYA-Terms-of-Service-v1.5.md": "terms-of-service.md",
  "OMAYA-Cookie-Policy-v1.1.md": "cookie-policy.md",
  "OMAYA-AML-KYC-Policy-v1.1.md": "aml-kyc-policy.md",
  "OMAYA-Risk-Disclosure-Statement-v1.1.md": "risk-disclosure-statement.md",
};
