"use client";

import React, { useState } from "react";
import { useMarketingI18n } from "@/lib/useMarketingI18n";
import { useContact } from "../hooks/useContact";
import type { ContactFormData } from "../types";

interface ContactFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ onSuccess, onError }) => {
  const { t } = useMarketingI18n();
  const [formData, setFormData] = useState<ContactFormData>({
    email_address: "",
    question: "",
    supporting_file: null,
  });

  const {
    isSubmitting,
    error,
    success,
    submitContact,
    clearContactError,
    clearContactSuccess,
  } = useContact();

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
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/png',
        'image/jpeg',
        'image/jpg'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        onError?.("Invalid file type. Please upload PDF, DOC, DOCX, TXT, PNG, JPG, or JPEG files only.");
        e.target.value = '';
        return;
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        onError?.("File size must be less than 10MB");
        e.target.value = '';
        return;
      }
      
      setFormData((prev) => ({
        ...prev,
        supporting_file: file,
      }));
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({
      ...prev,
      supporting_file: null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors/success
    clearContactError();
    clearContactSuccess();

    // Validate form
    if (!formData.email_address.trim()) {
      onError?.("Email is required");
      return;
    }

    if (!formData.question.trim()) {
      onError?.("Question is required");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email_address)) {
      onError?.("Please enter a valid email address");
      return;
    }

    const result = await submitContact(formData);

    if (result.success) {
      setFormData({ email_address: "", question: "", supporting_file: null });
      onSuccess?.();
    } else {
      onError?.(result.error || "Failed to submit support request");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="bg-[#D1FAE5] dark:bg-[#064E3B] border border-[#10B981] rounded-2xl p-4 flex items-start space-x-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <svg
            className="w-6 h-6 text-[#10B981] flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[#065F46] dark:text-[#D1FAE5] mb-1">
              {t("marketing.contact.successTitle", "Message Sent Successfully!")}
            </h3>
            <p className="text-sm text-[#047857] dark:text-[#A7F3D0]">
              {t("marketing.contact.successMessage", "Thank you for contacting us! We've received your message and will get back to you as soon as possible.")}
            </p>
          </div>
          <button
            type="button"
            onClick={clearContactSuccess}
            className="text-[#065F46] dark:text-[#D1FAE5] hover:text-[#047857] transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-[#FEE2E2] dark:bg-[#7F1D1D] border border-[#EF4444] rounded-2xl p-4 flex items-start space-x-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <svg
            className="w-6 h-6 text-[#EF4444] flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[#991B1B] dark:text-[#FEE2E2] mb-1">
              {t("marketing.contact.errorTitle", "Submission Failed")}
            </h3>
            <p className="text-sm text-[#B91C1C] dark:text-[#FCA5A5]">
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={clearContactError}
            className="text-[#991B1B] dark:text-[#FEE2E2] hover:text-[#B91C1C] transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-[#344054] dark:text-white mb-2"
        >
          {t("marketing.contact.emailLabel", "Email Address *")}
        </label>
        <input
          type="email"
          id="email_address"
          name="email_address"
          value={formData.email_address}
          onChange={handleInputChange}
          placeholder={t(
            "marketing.contact.emailPlaceholder",
            "your.email@example.com"
          )}
          required
          disabled={isSubmitting}
          className="w-full px-4 py-3 border border-[#E8EFF5] dark:border-[#35353E] rounded-2xl focus:ring-2 focus:ring-[#1D8751] focus:border-transparent outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Question Field */}
      <div>
        <label
          htmlFor="question"
          className="block text-sm font-medium text-[#344054] dark:text-white mb-2"
        >
          {t("marketing.contact.questionLabel", "Your Question *")}
        </label>
        <textarea
          id="question"
          name="question"
          value={formData.question}
          onChange={handleInputChange}
          placeholder={t(
            "marketing.contact.questionPlaceholder",
            "Please describe your question or issue..."
          )}
          rows={4}
          required
          disabled={isSubmitting}
          className="w-full px-4 py-3 border border-[#E8EFF5] dark:border-[#35353E] rounded-2xl focus:ring-2 focus:ring-[#1D8751] focus:border-transparent outline-none transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* File Upload Field */}
      <div>
        <label className="block text-sm font-medium text-[#344054] dark:text-white mb-2">
          {t("marketing.contact.supportingFilesLabel", "Supporting Files")}
        </label>
        <p className="text-xs text-[#667085] dark:text-[#98A2B3] mb-3">
          {t("marketing.contact.supportingFilesDescription", "You can attach supporting documents, screenshots, or other files that might help us understand your issue better. Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG")}
        </p>
        
        {!formData.supporting_file ? (
          <div className="relative">
            <input
              type="file"
              id="supporting_file"
              name="supporting_file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              disabled={isSubmitting}
              className="hidden"
            />
            <label
              htmlFor="supporting_file"
              className={`flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed border-[#E8EFF5] dark:border-[#35353E] rounded-2xl cursor-pointer transition-colors hover:border-[#1D8751] dark:hover:border-[#1D8751] ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg
                className="w-8 h-8 mb-2 text-[#667085] dark:text-[#98A2B3]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-sm text-[#344054] dark:text-white font-medium">
                {t("marketing.contact.clickToUpload", "Click to upload file")}
              </span>
              <span className="text-xs text-[#667085] dark:text-[#98A2B3] mt-1">
                {t("marketing.contact.maxFileSize", "Maximum file size: 10MB")}
              </span>
            </label>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-3 border border-[#E8EFF5] dark:border-[#35353E] rounded-2xl">
            <div className="flex items-center space-x-3">
              <svg
                className="w-5 h-5 text-[#1D8751]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div>
                <p className="text-sm text-[#344054] dark:text-white font-medium">
                  {formData.supporting_file.name}
                </p>
                <p className="text-xs text-[#667085] dark:text-[#98A2B3]">
                  {(formData.supporting_file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              disabled={isSubmitting}
              className="text-[#F04438] hover:text-[#D92D20] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#1D8751] text-white font-medium py-3 px-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#166b42]"
        >
          {isSubmitting
            ? t("marketing.contact.submitting", "Submitting...")
            : t("marketing.contact.submit", "Submit Contact Form")}
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
