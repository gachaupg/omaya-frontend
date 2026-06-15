"use client";

import React, { useState } from "react";
import { X, CheckCircle, Shield } from "lucide-react";

interface TermsAndConditionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
}

const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({
    isOpen,
    onClose,
    onAccept,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Dark overlay background */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-xs"
                onClick={onClose}
            />

            {/* Modal content */}
            <div className="relative z-10 w-full max-w-4xl max-h-[90vh] mx-4 bg-(--card-color) dark:bg-linear-to-b dark:from-[#0A0A0F] dark:via-[#18181D] dark:to-[#0A0A0F] rounded-md shadow-md border border-border dark:border-accent overflow-hidden flex flex-col">
                {/* Header with close button */}
                <div className="sticky top-0 z-20 bg-(--card-color) dark:bg-[#0A0A0F] px-2 py-4 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#1D8751] flex items-center justify-center shrink-0">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold  text-[#051015] dark:text-white">
                                P2P Trading Terms & Conditions
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Last updated: November 30, 2024
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-muted- rounded-lg"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="overflow-y-auto flex-1">
                    <div className="px-6 py-6 space-y-6 text-sm dark:text-white text-[#051015]">
                        {/* Section 1 */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#1D8751] mb-3">
                                1. Introduction
                            </h3>
                            <p className="leading-relaxed ">
                                Welcome to OMAYA P2P Trading Platform. These Terms and Conditions govern your use of our
                                peer-to-peer trading services. By using our platform, you agree to comply with and be bound by
                                these terms.
                            </p>
                        </div>

                        {/* Section 2 */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#1D8751] mb-3">
                                2. User Responsibilities
                            </h3>
                            <p className="leading-relaxed mb-2">Users are responsible for:</p>
                            <ul className="space-y-2 ml-4">
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Providing accurate and truthful information</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Maintaining the security of their account credentials</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Conducting trades in good faith</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Complying with all applicable laws and regulations</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Respecting other users and maintaining professional communication</span>
                                </li>
                            </ul>
                        </div>

                        {/* Section 3 */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#1D8751] mb-3">
                                3. Trading Rules
                            </h3>
                            <p className="leading-relaxed mb-2">All trades must be conducted according to the following rules:</p>
                            <ul className="space-y-2 ml-4">
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Complete transactions within the specified time frame</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Provide accurate payment information</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Confirm receipt of funds before releasing assets</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Report any disputes or issues immediately</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Do not engage in fraudulent or suspicious activities</span>
                                </li>
                            </ul>
                        </div>

                        {/* Section 4 */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#1D8751] mb-3">
                                4. Communication Guidelines
                            </h3>
                            <p className="leading-relaxed mb-2">When communicating with other traders:</p>
                            <ul className="space-y-2 ml-4">
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Maintain professional and respectful communication</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Do not share sensitive personal information</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Report any inappropriate behavior</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Use the platform's messaging system for all trade-related communications</span>
                                </li>
                            </ul>
                        </div>

                        {/* Section 5 */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#1D8751] mb-3">
                                5. Dispute Resolution
                            </h3>
                            <p className="leading-relaxed mb-2">In case of disputes:</p>
                            <ul className="space-y-2 ml-4">
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Contact our support team immediately</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Provide all relevant transaction details</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Cooperate with the investigation process</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Accept the final decision of our dispute resolution team</span>
                                </li>
                            </ul>
                        </div>

                        {/* Section 6 */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#1D8751] mb-3">
                                6. Prohibited Activities
                            </h3>
                            <p className="leading-relaxed mb-2">The following activities are strictly prohibited:</p>
                            <ul className="space-y-2 ml-4">
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Money laundering or financing illegal activities</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Fraudulent transactions or chargebacks</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Creating multiple accounts to circumvent limits</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Harassment or abuse of other users</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Sharing false or misleading information</span>
                                </li>
                            </ul>
                        </div>

                        {/* Section 7 */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#1D8751] mb-3">
                                7. Account Security
                            </h3>
                            <p className="leading-relaxed mb-2">Users must:</p>
                            <ul className="space-y-2 ml-4">
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Use strong, unique passwords</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Enable two-factor authentication when available</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Report any suspicious account activity immediately</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Not share account credentials with anyone</span>
                                </li>
                            </ul>
                        </div>

                        {/* Section 8 */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#1D8751] mb-3">
                                8. Limitation of Liability
                            </h3>
                            <p className="leading-relaxed mb-2">OMAYA is not liable for:</p>
                            <ul className="space-y-2 ml-4">
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Losses due to user error or negligence</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Disputes between traders</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Technical issues beyond our control</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#1D8751] shrink-0">•</span>
                                    <span>Unauthorized access due to compromised credentials</span>
                                </li>
                            </ul>
                        </div>

                        {/* Section 9 */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#1D8751] mb-3">
                                9. Changes to Terms
                            </h3>
                            <p className="leading-relaxed">
                                We reserve the right to modify these terms at any time. Users will be notified of significant
                                changes. Continued use of the platform constitutes acceptance of the updated terms.
                            </p>
                        </div>

                        {/* Section 10 */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#1D8751] mb-3">
                                10. Contact Information
                            </h3>
                            <p className="leading-relaxed">
                                For questions or concerns regarding these terms, please contact our support team through the
                                platform or at support@omaya.io.
                            </p>
                        </div>

                        {/* Important warning */}
                        <div className="bg-[#1D8751]/10 border-l-4 border-[#1D8751] rounded-sm p-4">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-[#1D8751]" />
                                Important:
                            </h4>
                            <p className="text-sm">
                                By clicking "I Accept", you confirm that you have read, understood, and agree
                                to be bound by these Terms and Conditions. Failure to comply may result in
                                account suspension or permanent ban.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer with buttons */}
                <div className="sticky bottom-0 z-20  px-6 py-4 border-t  flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-[#1D8751] text-[#1D8751] font-medium hover:bg-[#1D8751]/10 transition-colors text-sm"
                    >
                        Close
                    </button>
                    <button
                        onClick={onAccept}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-[#1D8751] text-white font-medium hover:bg-[#15803D] transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <CheckCircle className="w-4 h-4" />
                        I Accept
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditionsModal;
