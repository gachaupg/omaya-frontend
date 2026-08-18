"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { useFAQ } from "@/features/faq/hooks/useFAQ";
import { decodeHtml } from "@/lib/utils/html";
import { useContactI18n } from "@/lib/useContactI18n";

const FAQ_PER_PAGE = 5;

const CARD_BORDER = "border-gray-200 dark:border-gray-600";

export default function ContactFAQSection() {
  const { t } = useContactI18n();
  const { faqs, loading, error } = useFAQ();
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const [faqPage, setFaqPage] = useState(1);

  useEffect(() => {
    const totalPages = Math.ceil((faqs?.length ?? 0) / FAQ_PER_PAGE) || 1;
    if (faqPage > totalPages) setFaqPage(totalPages);
  }, [faqs?.length, faqPage]);

  const totalPages = Math.ceil(faqs.length / FAQ_PER_PAGE) || 1;
  const pageItems = faqs.slice(
    (faqPage - 1) * FAQ_PER_PAGE,
    faqPage * FAQ_PER_PAGE
  );

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section className="mt-12 sm:mt-16">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 bg-[#1D8751]/10 border border-[#1D8751]/30 text-[#1D8751] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
          <HelpCircle className="w-4 h-4" />
          {t("contact.faq.badge", "FAQ")}
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("contact.faq.titleStart", "Frequently Asked")}{" "}
          <span className="text-[#1D8751]">
            {t("contact.faq.titleAccent", "Questions")}
          </span>
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t(
            "contact.faq.subtitle",
            "Find answers to common questions about OMAYA.io, trading, security, and more"
          )}
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className={`h-14 rounded-xl border ${CARD_BORDER} bg-white dark:bg-[#1a1a1f] animate-pulse`}
            />
          ))
        ) : error && faqs.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#1a1a1f] px-5 py-6 text-center">
            <p className="text-gray-900 dark:text-white font-medium mb-2">
              {t("contact.faq.unavailableTitle", "Service Temporarily Unavailable")}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t(
                "contact.faq.unavailableBody",
                "Our FAQ service is currently experiencing technical difficulties. Please try again later or contact support for assistance."
              )}
            </p>
          </div>
        ) : faqs.length === 0 ? (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
            {t("contact.faq.empty", "No FAQs available at the moment.")}
          </p>
        ) : (
          <>
            {pageItems.map((item, index) => {
              const globalIndex = (faqPage - 1) * FAQ_PER_PAGE + index;
              const isOpen = openFAQ === globalIndex;
              const answerHtml =
                decodeHtml(item.answer || item.content || "") || "";

              return (
                <div
                  key={item._id || item.id || globalIndex}
                  className={`rounded-xl border overflow-hidden bg-white dark:bg-[#1a1a1f] ${CARD_BORDER} ${
                    isOpen ? "border-[#1D8751]/40 dark:border-[#1D8751]/40" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFAQ(globalIndex)}
                    className="w-full flex justify-between items-center gap-3 px-4 sm:px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-[#23232B] transition-colors"
                  >
                    <span className="text-gray-900 dark:text-white font-medium text-sm sm:text-base pr-2">
                      {item.question || item.title}
                    </span>
                    <span
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isOpen
                          ? "bg-[#1D8751] text-white"
                          : "bg-gray-100 dark:bg-[#2A2A2A] text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </button>
                  {isOpen && answerHtml ? (
                    <div className="px-4 sm:px-5 pb-4 pt-0 border-t border-gray-200 dark:border-gray-600">
                      <div
                        className="pt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-2"
                        dangerouslySetInnerHTML={{ __html: answerHtml }}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}

            {faqs.length > FAQ_PER_PAGE && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setFaqPage((p) => Math.max(1, p - 1))}
                  disabled={faqPage <= 1}
                  className={`px-3 py-2 rounded-lg border ${CARD_BORDER} bg-white dark:bg-[#1a1a1f] text-gray-700 dark:text-gray-300 text-sm font-medium disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-[#23232B] transition-colors`}
                >
                  {t("contact.faq.prev", "Prev")}
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFaqPage(i + 1)}
                    className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition-colors ${
                      faqPage === i + 1
                        ? "bg-[#1D8751] text-white"
                        : `border ${CARD_BORDER} bg-white dark:bg-[#1a1a1f] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#23232B]`
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setFaqPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={faqPage >= totalPages}
                  className={`px-3 py-2 rounded-lg border ${CARD_BORDER} bg-white dark:bg-[#1a1a1f] text-gray-700 dark:text-gray-300 text-sm font-medium disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-[#23232B] transition-colors`}
                >
                  {t("contact.faq.next", "Next")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
