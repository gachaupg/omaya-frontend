import React from "react";

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * Splits a plain-text message on any email addresses and renders those as
 * clickable, brand-colored `mailto:` links while leaving the rest as text.
 * Useful for error/help messages like "...or contact support at foo@bar.com."
 */
export function renderTextWithEmailLinks(text: string): React.ReactNode[] {
  const parts = text.split(EMAIL_PATTERN);
  const emails = text.match(EMAIL_PATTERN) ?? [];

  return parts.reduce<React.ReactNode[]>((nodes, part, index) => {
    nodes.push(<React.Fragment key={`text-${index}`}>{part}</React.Fragment>);
    const email = emails[index];
    if (email) {
      nodes.push(
        <a
          key={`email-${index}`}
          href={`mailto:${email}`}
          className="text-[#1D8751] hover:text-[#167a47] font-medium underline underline-offset-2"
        >
          {email}
        </a>
      );
    }
    return nodes;
  }, []);
}
