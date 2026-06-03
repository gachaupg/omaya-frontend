import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import LegalPolicyMarkdown from "@/components/legal/LegalPolicyMarkdown";
import {
  getAllLegalPolicySlugs,
  resolveLegalPolicy,
} from "@/lib/legal/legalPolicies";
import { loadPolicyMarkdown } from "@/lib/legal/loadPolicyMarkdown";

type LegalPageParams = {
  slug?: string | string[];
};

interface PolicyPageProps {
  params?: Promise<LegalPageParams>;
}

export function generateStaticParams() {
  return getAllLegalPolicySlugs().map((slug) => ({ slug }));
}

export default async function LegalPolicyPage({ params }: PolicyPageProps) {
  const resolvedParams = params ? await params : {};
  const slugValue = Array.isArray(resolvedParams.slug)
    ? resolvedParams.slug[0]
    : resolvedParams.slug;

  if (!slugValue) {
    notFound();
  }

  const policy = resolveLegalPolicy(slugValue);
  if (!policy) {
    notFound();
  }

  const markdown = await loadPolicyMarkdown(policy.fileName);
  if (!markdown) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-(--bg-color) pt-32 pb-16 px-4">
      <div className="max-w-4xl mx-auto bg-(--card-color) rounded-3xl shadow-xl border border-gray-200 dark:border-accent p-8 md:p-12">
        <BackButton />

        <header className="mb-8">
          <p className="text-sm text-[#1D8751] font-semibold uppercase tracking-wide">
            Legal Policy
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
            {policy.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-[#788099] mt-3">
            Last updated: {policy.lastUpdated}
          </p>
        </header>

        <LegalPolicyMarkdown content={markdown} />

        <footer className="mt-10 border-t border-gray-200 dark:border-[#2A2A30] pt-6 text-sm text-gray-500 dark:text-[#788099]">
          <p>
            For questions about this policy, please contact our support team at{" "}
            <a
              href="mailto:support@omaya.io"
              className="text-[#1D8751] hover:underline"
            >
              support@omaya.io
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
