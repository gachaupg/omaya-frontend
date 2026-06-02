import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import path from "path";
import { readFile } from "fs/promises";

type PolicyConfig = {
  title: string;
  description: string;
  sections: { heading: string; body: string }[];
  lastUpdated?: string;
};

type MarkdownPolicyConfig = {
  title: string;
  description?: string;
  lastUpdated?: string;
  filePath: string;
};

const markdownPolicies: Record<string, MarkdownPolicyConfig> = {
  "terms-of-service": {
    title: "Terms of Service",
    lastUpdated: "31 May 2026",
    filePath: "content/legal/terms-of-service.md",
  },
  "cookies-policy": {
    title: "Cookie Policy",
    lastUpdated: "31 May 2026",
    filePath: "content/legal/cookie-policy.md",
  },
  // Existing URL uses `/legal/aml-policy` — keep it working but render AML/KYC content.
  "aml-policy": {
    title: "AML/KYC Policy",
    lastUpdated: "31 May 2026",
    filePath: "content/legal/aml-kyc-policy.md",
  },
  "risk-disclosure-statement": {
    title: "Risk Disclosure Statement",
    lastUpdated: "31 May 2026",
    filePath: "content/legal/risk-disclosure-statement.md",
  },
};

const policyContent: Record<string, PolicyConfig> = {
  "terms-of-service": {
    title: "Terms of Service",
    description:
      "These Terms of Service outline the rules and regulations for using OMAYA.io products and services.",
    lastUpdated: "October 1, 2024",
    sections: [
      {
        heading: "Acceptance of Terms",
        body:
          "By creating an account or engaging with OMAYA.io services, you agree to comply with these terms and all applicable laws and regulations.",
      },
      {
        heading: "Eligible Users",
        body:
          "You must be at least 18 years old and legally permitted to use digital asset services in your jurisdiction. We may request verification documents at any time.",
      },
      {
        heading: "Account Responsibilities",
        body:
          "You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.",
      },
    ],
  },
  "privacy-policy": {
    title: "Privacy Policy",
    description:
      "Our Privacy Policy explains how OMAYA.io collects, uses, and protects your personal information.",
    lastUpdated: "October 1, 2024",
    sections: [
      {
        heading: "Information We Collect",
        body:
          "We collect information you provide directly, such as contact details, identification documents, and transaction information required for compliance.",
      },
      {
        heading: "How We Use Data",
        body:
          "Your data is used to deliver services, comply with legal obligations, enhance security, and improve the customer experience.",
      },
      {
        heading: "Data Protection",
        body:
          "We implement technical and organizational measures to safeguard your data from unauthorized access, alteration, or disclosure.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    description:
      "These Terms of Service outline the rules and regulations for using OMAYA.io products and services.",
    lastUpdated: "October 1, 2024",
    sections: [
      { heading: "Acceptance of Terms", body: "By creating an account or engaging with OMAYA.io services, you agree to comply with these terms and all applicable laws and regulations." },
      { heading: "Eligible Users", body: "You must be at least 18 years old and legally permitted to use digital asset services in your jurisdiction. We may request verification documents at any time." },
      { heading: "Account Responsibilities", body: "You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account." },
    ],
  },
  "cookie-use": {
    title: "Cookie Use",
    description:
      "This policy describes how OMAYA.io uses cookies and similar technologies on our digital channels.",
    lastUpdated: "October 1, 2024",
    sections: [
      { heading: "What Are Cookies?", body: "Cookies are small text files stored on your device that help us remember your preferences and understand how you interact with our services." },
      { heading: "Types of Cookies We Use", body: "We use essential cookies for authentication, analytical cookies to improve performance, and preference cookies to store settings like language." },
      { heading: "Managing Cookies", body: "You can adjust your browser settings to refuse cookies or alert you when cookies are being sent. Some features may not function properly without cookies." },
    ],
  },
  "data-use-policy": {
    title: "Data Use Policy",
    description:
      "Our Data Use Policy explains how OMAYA.io collects, uses, stores, and protects your personal data.",
    lastUpdated: "October 1, 2024",
    sections: [
      { heading: "Data We Collect", body: "We collect information you provide directly (contact details, identification documents, transaction information) and technical data such as IP address and device information." },
      { heading: "How We Use Your Data", body: "Your data is used to deliver services, comply with legal obligations, enhance security, prevent fraud, and improve the customer experience." },
      { heading: "Data Sharing", body: "We do not sell your personal data. We may share data with service providers, regulators, or law enforcement when required by law." },
      { heading: "Data Security", body: "We implement technical and organizational measures to safeguard your data from unauthorized access, alteration, or disclosure." },
    ],
  },
  "cookies-policy": {
    title: "Cookies Policy",
    description:
      "This Cookies Policy describes how OMAYA.io uses cookies and similar technologies on our digital channels.",
    lastUpdated: "October 1, 2024",
    sections: [
      {
        heading: "What Are Cookies?",
        body:
          "Cookies are small text files stored on your device that help us remember your preferences and understand how you interact with our services.",
      },
      {
        heading: "Types of Cookies We Use",
        body:
          "We use essential cookies for authentication, analytical cookies to improve performance, and preference cookies to store settings like language.",
      },
      {
        heading: "Managing Cookies",
        body:
          "You can adjust your browser settings to refuse cookies or alert you when cookies are being sent. Some features may not function properly without cookies.",
      },
    ],
  },
  "disclaimer-policy": {
    title: "Disclaimer Policy",
    description:
      "Our Disclaimer Policy clarifies the limitations of liability and the scope of information provided by OMAYA.io.",
    lastUpdated: "October 1, 2024",
    sections: [
      {
        heading: "Information Accuracy",
        body:
          "While we strive for accuracy, OMAYA.io does not guarantee that all information is complete, current, or error-free.",
      },
      {
        heading: "No Financial Advice",
        body:
          "Content provided on our platform is for informational purposes only and should not be interpreted as financial, investment, or legal advice.",
      },
      {
        heading: "Third-Party Links",
        body:
          "We may reference third-party websites or services. OMAYA.io is not responsible for the content or privacy practices of external sites.",
      },
    ],
  },
  "payment-policy": {
    title: "Payment Policy",
    description:
      "This Payment Policy explains how payments, settlements, and refunds are handled on OMAYA.io.",
    lastUpdated: "October 1, 2024",
    sections: [
      {
        heading: "Supported Payment Methods",
        body:
          "We support a range of crypto and forex settlement methods. Available options depend on your region and compliance status.",
      },
      {
        heading: "Fees and Charges",
        body:
          "Transaction fees are disclosed prior to confirmation and may vary based on market conditions, liquidity, and regulatory requirements.",
      },
      {
        heading: "Refunds & Disputes",
        body:
          "Refund eligibility is assessed on a case-by-case basis. Please contact support within 7 days of a disputed transaction for assistance.",
      },
    ],
  },
  "aml-policy": {
    title: "AML Policy",
    description: "Our Anti-Money Laundering (AML) policy outlines the measures we take to prevent financial crimes.",
    lastUpdated: "October 1, 2024",
    sections: [
      {
        heading: "Compliance Commitment",
        body: "OMAYA.io is committed to the highest standards of Anti-Money Laundering (AML) compliance and requires management and employees to adhere to these standards to prevent the use of our products and services for money laundering purposes.",
      },
      {
        heading: "Identity Verification",
        body: "We implement robust Know Your Customer (KYC) procedures to verify the identity of our users and ensure the legitimacy of transaction sources.",
      },
    ],
  },
  "express-terms": {
    title: "Deposit, Withdrawal & Swap Terms",
    description:
      "These terms apply to deposit, withdrawal, and swap transactions on OMAYA.io. By using these services, you agree to comply with these terms.",
    lastUpdated: "February 3, 2025",
    sections: [
      {
        heading: "Deposit Terms",
        body:
          "When depositing, you must send funds from your own account only to the specified provider account. Include the transaction ID in the bank description field. Failure to follow these conditions may result in transaction rejection and refund.",
      },
      {
        heading: "Withdrawal Terms",
        body:
          "When withdrawing, we will send funds to your specified provider account. Please ensure the account details are correct and belong to you. Incorrect account information may result in delayed or failed payouts.",
      },
      {
        heading: "Swap Terms",
        body:
          "Swap transactions are subject to market rates and network conditions. Ensure you send the correct asset and network. Transactions sent to wrong addresses or networks cannot be recovered.",
      },
      {
        heading: "General Conditions",
        body:
          "All deposit, withdrawal, and swap transactions must comply with our Terms of Service, Payment Policy, and AML requirements. We reserve the right to reject or hold transactions for compliance review.",
      },
    ],
  },
  "risk-disclosure-statement": {
    title: "Risk Disclosure Statement",
    description: "This Risk Disclosure Statement provides you with information about the risks associated with trading digital assets.",
    lastUpdated: "October 1, 2024",
    sections: [
      {
        heading: "Market Risk",
        body: "Digital asset trading involves significant risk and can result in the loss of your invested capital. You should not invest more than you can afford to lose and should ensure that you fully understand the risks involved.",
      },
      {
        heading: "Volatility",
        body: "The prices of digital assets can be extremely volatile and may be affected by external factors such as financial regulatory activity or government policies.",
      },
    ],
  },
};

type LegalPageParams = {
  slug?: string | string[];
};

interface PolicyPageProps {
  params?: Promise<LegalPageParams>;
}

export default async function LegalPolicyPage({ params }: PolicyPageProps) {
  const resolvedParams = params ? await params : {};
  const slugValue = Array.isArray(resolvedParams.slug)
    ? resolvedParams.slug[0]
    : resolvedParams.slug;

  if (!slugValue) {
    notFound();
  }

  const markdownPolicy = markdownPolicies[slugValue];
  const policy = policyContent[slugValue];

  if (!markdownPolicy && !policy) {
    notFound();
  }

  const markdown = markdownPolicy
    ? await readFile(
        path.join(process.cwd(), markdownPolicy.filePath),
        "utf8",
      )
    : null;

  return (
    <div className="min-h-screen bg-(--bg-color) pt-32 pb-16 px-4">
      <div className="max-w-4xl mx-auto bg-(--card-color) rounded-3xl shadow-xl border border-gray-200 dark:border-accent p-8 md:p-12">
        {/* Back Button */}
        <BackButton />

        <header className="mb-8">
          <p className="text-sm text-[#1D8751] font-semibold uppercase tracking-wide">
            Legal Policy
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
            {(markdownPolicy ?? policy).title}
          </h1>
          {(markdownPolicy ?? policy).lastUpdated && (
            <p className="text-sm text-gray-500 dark:text-[#788099] mt-3">
              Last updated: {(markdownPolicy ?? policy).lastUpdated}
            </p>
          )}
          {(markdownPolicy?.description ?? policy?.description) && (
            <p className="mt-4 text-gray-600 dark:text-[#9CA3AF] leading-relaxed">
              {markdownPolicy?.description ?? policy?.description}
            </p>
          )}
        </header>

        {markdown ? (
          <article className="space-y-5 text-gray-600 dark:text-[#9CA3AF] leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-6">
                    {children}
                  </h2>
                ),
                h2: ({ children }) => (
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6">
                    {children}
                  </h3>
                ),
                h3: ({ children }) => (
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mt-5">
                    {children}
                  </h4>
                ),
                p: ({ children }) => <p className="mt-3">{children}</p>,
                ul: ({ children }) => (
                  <ul className="list-disc pl-6 mt-3 space-y-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-6 mt-3 space-y-2">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li>{children}</li>,
                a: ({ children, href }) => (
                  <a
                    href={href}
                    className="text-[#1D8751] hover:underline break-words"
                    rel="noopener noreferrer"
                    target={href?.startsWith("http") ? "_blank" : undefined}
                  >
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto mt-4">
                    <table className="min-w-full border border-gray-200 dark:border-[#2A2A30] text-sm">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-50 dark:bg-[#1D1D23]">
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th className="text-left font-semibold px-3 py-2 border-b border-gray-200 dark:border-[#2A2A30]">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 align-top border-b border-gray-200 dark:border-[#2A2A30]">
                    {children}
                  </td>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-[#1D8751] pl-4 py-2 my-4 bg-gray-50/50 dark:bg-[#1D1D23]/40 rounded-r-lg">
                    {children}
                  </blockquote>
                ),
                hr: () => (
                  <hr className="my-6 border-gray-200 dark:border-[#2A2A30]" />
                ),
                strong: ({ children }) => (
                  <strong className="text-gray-900 dark:text-white font-semibold">
                    {children}
                  </strong>
                ),
              }}
            >
              {markdown}
            </ReactMarkdown>
          </article>
        ) : (
          <div className="space-y-8">
            {policy.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {section.heading}
                </h2>
                <p className="text-gray-600 dark:text-[#9CA3AF] leading-relaxed">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        )}

        <footer className="mt-10 border-t border-gray-200 dark:border-[#2A2A30] pt-6 text-sm text-gray-500 dark:text-[#788099]">
          <p>
            For questions about this policy, please contact our support team at
            {" "}
            <a href="mailto:support@omaya.io" className="text-[#1D8751] hover:underline">
              support@omaya.io
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}

