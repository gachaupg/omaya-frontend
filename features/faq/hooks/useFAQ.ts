import { useEffect, useState } from "react";

import { logger } from "@/lib/utils/logger";

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

export const useFAQ = (category?: string) => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = category
          ? `/api/faq/read/?category=${encodeURIComponent(category)}`
          : "/api/faq/read/";

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const transformedFaqs = data.map((faq: FAQItem, index: number) => ({
          ...faq,
          id: index + 1,
          question: faq.title,
          answer: faq.content,
        }));

        setFaqs(transformedFaqs);
      } catch (err) {
        logger.error("general", "Error fetching FAQs:", err);

        setFaqs([
          {
            _id: "fallback-1",
            id: 1,
            title: "Service Temporarily Unavailable",
            content:
              "Our FAQ service is currently experiencing technical difficulties. Please try again later or contact support for assistance.",
            question: "Service Temporarily Unavailable",
            answer:
              "Our FAQ service is currently experiencing technical difficulties. Please try again later or contact support for assistance.",
            category: category || "general",
          },
        ]);
        setError(
          "FAQ service is temporarily unavailable. Please try again later."
        );
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
  };
};
