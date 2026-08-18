export interface FAQItem {
  _id: string;
  title: string;
  content: string;
  category: string;
  createdAt?: string;
  id?: number;
  question?: string;
  answer?: string;
}

export function isSystemFallbackFaqItem(
  faq: Pick<FAQItem, "_id" | "title"> | null | undefined
): boolean {
  if (!faq) return false;
  const id = String(faq._id ?? "");
  if (id.startsWith("fallback-")) return true;
  return String(faq.title ?? "").includes("Service Temporarily Unavailable");
}

export function createServiceUnavailableFaqItem(
  category = "general"
): FAQItem {
  return {
    _id: "fallback-1",
    id: 1,
    title: "Service Temporarily Unavailable",
    content:
      "Our FAQ service is currently experiencing technical difficulties. Please try again later or contact support for assistance.",
    question: "Service Temporarily Unavailable",
    answer:
      "Our FAQ service is currently experiencing technical difficulties. Please try again later or contact support for assistance.",
    category,
  };
}

export function withFaqListFallback(items: FAQItem[]): FAQItem[] {
  if (items.length > 0) return items;
  return [createServiceUnavailableFaqItem()];
}
