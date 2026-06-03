import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

const markdownComponents = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-6">
      {children}
    </h2>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6">
      {children}
    </h3>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mt-5">
      {children}
    </h4>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mt-3">{children}</p>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="list-disc pl-6 mt-3 space-y-2">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="list-decimal pl-6 mt-3 space-y-2">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
  a: ({
    children,
    href,
  }: {
    children?: ReactNode;
    href?: string;
  }) => (
    <a
      href={href}
      className="text-[#1D8751] hover:underline break-words"
      rel="noopener noreferrer"
      target={href?.startsWith("http") ? "_blank" : undefined}
    >
      {children}
    </a>
  ),
  table: ({ children }: { children?: ReactNode }) => (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full border border-gray-200 dark:border-[#2A2A30] text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children?: ReactNode }) => (
    <thead className="bg-gray-50 dark:bg-[#1D1D23]">{children}</thead>
  ),
  th: ({ children }: { children?: ReactNode }) => (
    <th className="text-left font-semibold px-3 py-2 border-b border-gray-200 dark:border-[#2A2A30]">
      {children}
    </th>
  ),
  td: ({ children }: { children?: ReactNode }) => (
    <td className="px-3 py-2 align-top border-b border-gray-200 dark:border-[#2A2A30]">
      {children}
    </td>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="border-l-4 border-[#1D8751] pl-4 py-2 my-4 bg-gray-50/50 dark:bg-[#1D1D23]/40 rounded-r-lg">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-gray-200 dark:border-[#2A2A30]" />,
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="text-gray-900 dark:text-white font-semibold">
      {children}
    </strong>
  ),
};

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

        <article className="space-y-5 text-gray-600 dark:text-[#9CA3AF] leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {markdown}
          </ReactMarkdown>
        </article>

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
