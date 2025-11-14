"use client";

import React, { useState } from "react";
import { Upload } from "lucide-react";
import ContactForm from "./ContactForm";
import { useContactI18n } from "@/lib/useContactI18n";

import { logger } from '@/lib/utils/logger';

interface ContactPageProps {
  showFileUpload?: boolean;
}

const ContactPage: React.FC<ContactPageProps> = ({ showFileUpload = true }) => {
  const [formData, setFormData] = useState({
    email_address: "",
    question: "",
    supporting_file: null as File | null,
  });
  const { t } = useContactI18n();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({
      ...prev,
      supporting_file: file,
    }));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleConnectLiveChat = () => {
    logger.debug('general', "Connect with Live Chat clicked");
    // Handle live chat connection logic here
  };

  const handleContactSuccess = () => {
    setShowSuccess(true);
    setShowError(false);
    setFormData({ email_address: "", question: "", supporting_file: null });

    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  const handleContactError = (error: string) => {
    setErrorMessage(error);
    setShowError(true);
    setShowSuccess(false);

    // Hide error message after 5 seconds
    setTimeout(() => {
      setShowError(false);
    }, 5000);
  };

  return (
    <div className="w-full relative z-10">
      <div className="w-full">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 lg:mb-8">
          {t("contact.title", "Help & Support")}
        </h1>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-4 sm:mb-6 lg:mb-6 p-3 sm:p-4 lg:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl sm:rounded-xl lg:rounded-2xl">
            <p className="text-green-800 dark:text-green-200 text-sm sm:text-sm lg:text-base">
              {t(
                "contact.success",
                "Thank you! Your message has been submitted successfully. We'll get back to you soon."
              )}
            </p>
          </div>
        )}

        {/* Error Message */}
        {showError && (
          <div className="mb-4 sm:mb-6 lg:mb-6 p-3 sm:p-4 lg:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl sm:rounded-xl lg:rounded-2xl">
            <p className="text-red-800 dark:text-red-200 text-sm sm:text-sm lg:text-base">
              {errorMessage ||
                t(
                  "contact.error.generic",
                  "Something went wrong. Please try again."
                )}
            </p>
          </div>
        )}

        <div className="bg-white dark:bg-[#18181D] border border-[#E8EFF5] dark:border-[#35353E] rounded-xl sm:rounded-xl lg:rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-5 lg:space-y-6">
          {/* Contact Form */}
          <ContactForm
            onSuccess={handleContactSuccess}
            onError={handleContactError}
          />

          {/* Live Chat Button */}
          <div className="border-t border-[#E8EFF5] dark:border-[#35353E] pt-4 sm:pt-5 lg:pt-6">
            <button
              onClick={handleConnectLiveChat}
              className="w-full bg-[#1D8751] text-white font-medium py-2.5 sm:py-3 lg:py-3 px-6 rounded-full transition-colors hover:bg-[#166b42] text-sm sm:text-base lg:text-base min-h-[44px] sm:min-h-0 lg:min-h-0"
            >
              {t("contact.liveChat", "Connect with Live Chat")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
