"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const OMAYA_HOSTS = new Set(["omaya.io", "www.omaya.io", "dev.omaya.io"]);

function resolvePolicyHref(href?: string): { href: string; external: boolean } {
  if (!href) {
    return { href: "#", external: false };
  }

  if (href.startsWith("/")) {
    return { href, external: false };
  }

  if (href.startsWith("mailto:") || href.startsWith("tel:")) {
    return { href, external: false };
  }

  try {
    const url = new URL(href);
    if (OMAYA_HOSTS.has(url.hostname)) {
      return {
        href: `${url.pathname}${url.search}${url.hash}`,
        external: false,
      };
    }
  } catch {
    // Keep original href below.
  }

  return { href, external: href.startsWith("http") };
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
  }) => {
    const { href: resolvedHref, external } = resolvePolicyHref(href);
    const className = "text-[#1D8751] hover:underline break-words";

    if (!external) {
      return (
        <Link href={resolvedHref} className={className}>
          {children}
        </Link>
      );
    }

    return (
      <a
        href={resolvedHref}
        className={className}
        rel="noopener noreferrer"
        target="_blank"
      >
        {children}
      </a>
    );
  },
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

type Props = {
  content: string;
};

export default function LegalPolicyMarkdown({ content }: Props) {
  return (
    <article className="space-y-5 text-gray-600 dark:text-[#9CA3AF] leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
