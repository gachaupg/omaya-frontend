"use client";

import React from "react";
import Link from "next/link";

const P2PTermsPage = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 mt-8 sm:mt-12">
      <div className="bg-white dark:bg-[#1D1D23] rounded-2xl border border-[#E8EFF5] dark:border-[#35353E] p-6 sm:p-8">
        <div className="mb-6">
          <Link
            href="/dashboard/p2p?tab=chats"
            className="text-sm text-[#1D8751] hover:underline inline-flex items-center gap-1"
          >
            ← Back to Chats
          </Link>
        </div>
        

        <h1 className="text-2xl sm:text-3xl font-bold text-[#051015] dark:text-white mb-6">
          P2P Trading Terms & Conditions
        </h1>

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

        <div className="mt-8 pt-6 border-t border-[#E8EFF5] dark:border-[#35353E]">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default P2PTermsPage;

