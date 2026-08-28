import { useEffect, useState } from "react";

import { logger } from "@/lib/utils/logger";
import { fetchPublicFaqsWithFallback } from "@/lib/content/publicContentFetch";
import {
  isSystemFallbackFaqItem,
  type FAQItem,
} from "@/features/faq/utils/faqFallback";

export type { FAQItem };

/**
 * FAQs: same-origin `/api/faq/read/` first, then direct Sanity (mobile path).
 */
export const useFAQ = (category?: string) => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchPublicFaqsWithFallback(category);

        if (cancelled) return;

        const transformedFaqs = data.map((faq, index) => ({
          ...faq,
          id: index + 1,
          question: faq.title,
          answer: faq.content,
        }));

        setFaqs(transformedFaqs);
      } catch (err) {
        if (cancelled) return;
        logger.error("general", "Error fetching FAQs:", err);
        setFaqs([]);
        setError(err instanceof Error ? err.message : "Failed to load FAQs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [category]);

  return {
    faqs,
    loading,
    error,
    isFallback: faqs.length > 0 && faqs.every(isSystemFallbackFaqItem),
  };
};
