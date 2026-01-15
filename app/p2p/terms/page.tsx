"use client";

import React from "react";
import { useRouter } from "next/navigation";

const P2PTermsPage = () => {
  const router = useRouter();

  const handleAccept = () => {
    // Set acceptance in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("p2p_terms_accepted", "true");
    }
    // Navigate back to chats
    router.push("/dashboard/p2p?tab=chats");
  };

  const handleClose = () => {
    // Just navigate back without accepting
    router.push("/dashboard/p2p?tab=chats");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1D1D23] rounded-2xl border border-[#E8EFF5] dark:border-[#35353E] w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E8EFF5] dark:border-[#35353E]">
          <h1 className="text-xl sm:text-2xl font-bold text-[#051015] dark:text-white">
            P2P Trading Terms & Conditions
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Last updated: 1/14/2026
          </p>
        </div>
        

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="prose dark:prose-invert max-w-none">
            <div className="text-sm sm:text-base text-gray-700 dark:text-gray-300 space-y-4">
            <section>
              <h2 className="text-lg font-semibold text-[#051015] dark:text-white mb-2">
                1. Introduction
              </h2>
              <p>
                Welcome to OMAYA P2P Trading Platform. These Terms and Conditions govern your use of our
                peer-to-peer trading services. By using our platform, you agree to comply with and be bound by
                these terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#051015] dark:text-white mb-2">
                2. User Responsibilities
              </h2>
              <p>
                Users are responsible for:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Providing accurate and truthful information</li>
                <li>Maintaining the security of their account credentials</li>
                <li>Conducting trades in good faith</li>
                <li>Complying with all applicable laws and regulations</li>
                <li>Respecting other users and maintaining professional communication</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#051015] dark:text-white mb-2">
                3. Trading Rules
              </h2>
              <p>
                All trades must be conducted according to the following rules:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Complete transactions within the specified time frame</li>
                <li>Provide accurate payment information</li>
                <li>Confirm receipt of funds before releasing assets</li>
                <li>Report any disputes or issues immediately</li>
                <li>Do not engage in fraudulent or suspicious activities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#051015] dark:text-white mb-2">
                4. Communication Guidelines
              </h2>
              <p>
                When communicating with other traders:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Maintain professional and respectful communication</li>
                <li>Do not share sensitive personal information</li>
                <li>Report any inappropriate behavior</li>
                <li>Use the platform's messaging system for all trade-related communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#051015] dark:text-white mb-2">
                5. Dispute Resolution
              </h2>
              <p>
                In case of disputes:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Contact our support team immediately</li>
                <li>Provide all relevant transaction details</li>
                <li>Cooperate with the investigation process</li>
                <li>Accept the final decision of our dispute resolution team</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#051015] dark:text-white mb-2">
                6. Prohibited Activities
              </h2>
              <p>
                The following activities are strictly prohibited:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Money laundering or financing illegal activities</li>
                <li>Fraudulent transactions or chargebacks</li>
                <li>Creating multiple accounts to circumvent limits</li>
                <li>Harassment or abuse of other users</li>
                <li>Sharing false or misleading information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#051015] dark:text-white mb-2">
                7. Account Security
              </h2>
              <p>
                Users must:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Use strong, unique passwords</li>
                <li>Enable two-factor authentication when available</li>
                <li>Report any suspicious account activity immediately</li>
                <li>Not share account credentials with anyone</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#051015] dark:text-white mb-2">
                8. Limitation of Liability
              </h2>
              <p>
                OMAYA is not liable for:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Losses due to user error or negligence</li>
                <li>Disputes between traders</li>
                <li>Technical issues beyond our control</li>
                <li>Unauthorized access due to compromised credentials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#051015] dark:text-white mb-2">
                9. Changes to Terms
              </h2>
              <p>
                We reserve the right to modify these terms at any time. Users will be notified of significant
                changes. Continued use of the platform constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#051015] dark:text-white mb-2">
                10. Contact Information
              </h2>
              <p>
                For questions or concerns regarding these terms, please contact our support team through the
                platform or at support@omaya.io.
              </p>
            </section>
          </div>
        </div>
      </div>

        {/* Footer with Accept and Close buttons */}
        <div className="px-6 py-4 border-t border-[#E8EFF5] dark:border-[#35353E] flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-[#35353E] text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-[#2A2A31] transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleAccept}
            className="px-6 py-2.5 rounded-lg bg-[#1D8751] text-white font-medium hover:bg-[#15803D] transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default P2PTermsPage;

