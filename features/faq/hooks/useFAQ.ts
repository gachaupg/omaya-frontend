import { useEffect, useState } from "react";

import { logger } from "@/lib/utils/logger";
import { fetchContentReadApi } from "@/lib/utils/contentReadApiUrl";
import {
  isSystemFallbackFaqItem,
  type FAQItem,
} from "@/features/faq/utils/faqFallback";

export type { FAQItem };

export const useFAQ = (category?: string) => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true);
        setError(null);

        const path = category
          ? `/api/faq/read/?category=${encodeURIComponent(category)}`
          : "/api/faq/read/";

        const response = await fetchContentReadApi(path);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const transformedFaqs = (Array.isArray(data) ? data : []).map(
          (faq: FAQItem, index: number) => ({
            ...faq,
            id: index + 1,
            question: faq.title,
            answer: faq.content,
          })
        );

        setFaqs(transformedFaqs);
      } catch (err) {
        logger.error("general", "Error fetching FAQs:", err);
        setFaqs([]);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, [category]);

  return {
    faqs,
    loading,
    error,
    isFallback: faqs.length > 0 && faqs.every(isSystemFallbackFaqItem),
  };
};
