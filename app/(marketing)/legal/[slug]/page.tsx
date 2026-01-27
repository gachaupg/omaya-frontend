import { notFound } from "next/navigation";
import Link from "next/link";
import {ArrowLeft} from "lucide-react";

type PolicyConfig = {
  title: string;
  description: string;
  sections: { heading: string; body: string }[];
  lastUpdated?: string;
};

const policyContent: Record<string, PolicyConfig> = {
  "terms-of-service": {
    title: "Terms of Service",
    description:
      "These Terms of Service outline the rules and regulations for using OMAYA Exchange products and services.",
    lastUpdated: "October 1, 2024",
    sections: [
      {
        heading: "Acceptance of Terms",
        body:
          "By creating an account or engaging with OMAYA Exchange services, you agree to comply with these terms and all applicable laws and regulations.",
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
      "Our Privacy Policy explains how OMAYA Exchange collects, uses, and protects your personal information.",
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
  "cookies-policy": {
    title: "Cookies Policy",
    description:
      "This Cookies Policy describes how OMAYA Exchange uses cookies and similar technologies on our digital channels.",
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
      "Our Disclaimer Policy clarifies the limitations of liability and the scope of information provided by OMAYA Exchange.",
    lastUpdated: "October 1, 2024",
    sections: [
      {
        heading: "Information Accuracy",
        body:
          "While we strive for accuracy, OMAYA Exchange does not guarantee that all information is complete, current, or error-free.",
      },
      {
        heading: "No Financial Advice",
        body:
          "Content provided on our platform is for informational purposes only and should not be interpreted as financial, investment, or legal advice.",
      },
      {
        heading: "Third-Party Links",
        body:
          "We may reference third-party websites or services. OMAYA Exchange is not responsible for the content or privacy practices of external sites.",
      },
    ],
  },
  "payment-policy": {
    title: "Payment Policy",
    description:
      "This Payment Policy explains how payments, settlements, and refunds are handled on OMAYA Exchange.",
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
        body: "OMAYA Exchange is committed to the highest standards of Anti-Money Laundering (AML) compliance and requires management and employees to adhere to these standards to prevent the use of our products and services for money laundering purposes.",
      },
      {
        heading: "Identity Verification",
        body: "We implement robust Know Your Customer (KYC) procedures to verify the identity of our users and ensure the legitimacy of transaction sources.",
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

  const policy = policyContent[slugValue];

  if (!policy) {
    notFound();
  }


  return (
    <div className="min-h-screen bg-[#EEF1F4] dark:bg-[#18181D] pt-32 pb-16 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-[#18181D] rounded-3xl shadow-xl border border-gray-200 dark:border-accent p-8 md:p-12">
        <Link className="inline-block mb-2" href="/">
          <ArrowLeft className="text-muted-foreground cursor-pointer" size={20} />
        </Link>

        <header className="mb-8">
          <p className="text-sm text-[#1D8751] font-semibold uppercase tracking-wide">
            Legal Policy
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
            {policy.title}
          </h1>
          {policy.lastUpdated && (
            <p className="text-sm text-gray-500 dark:text-[#788099] mt-3">
              Last updated: {policy.lastUpdated}
            </p>
          )}
          <p className="mt-4 text-gray-600 dark:text-[#9CA3AF] leading-relaxed">
            {policy.description}
          </p>
        </header>

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

        <footer className="mt-10 border-t border-gray-200 dark:border-[#2A2A30] pt-6 text-sm text-gray-500 dark:text-[#788099]">
          <p>
            For questions about this policy, please contact our support team at
            {" "}
            <a href="mailto:info@OMAYAExpress.com" className="text-[#1D8751] hover:underline">
              info@OMAYAExpress.com
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}

