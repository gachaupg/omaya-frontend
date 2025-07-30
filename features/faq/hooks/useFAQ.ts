import { useEffect, useState } from "react";

export interface FAQItem {
  _id: string;
  title: string;
  content: string;
  category: string;
  createdAt?: string;
  // Legacy fields for UI compatibility
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
          ? `/api/faq/read?category=${encodeURIComponent(category)}`
          : "/api/faq/read";

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Transform Sanity data to match UI expectations
        const transformedFaqs = data.map((faq: FAQItem, index: number) => ({
          ...faq,
          id: index + 1, // Generate numeric ID for UI compatibility
          question: faq.title, // Map title to question
          answer: faq.content, // Map content to answer
        }));

        setFaqs(transformedFaqs);
      } catch (err) {
        console.error("Error fetching FAQs:", err);

        // Provide fallback data instead of showing error to user
        const fallbackFaqs: FAQItem[] = [
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
        ];

        setFaqs(fallbackFaqs);
        // Set a user-friendly error message
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
