"use client";

import React, { useState } from "react";
import { useMarketingI18n } from "@/lib/useMarketingI18n";
import { useContact } from "../hooks/useContact";
import type { ContactFormData } from "../types";
import { User, Mail, MessageCircle, Send } from "lucide-react";

interface ContactFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ onSuccess, onError }) => {
  const { t } = useMarketingI18n();
  const [formData, setFormData] = useState<ContactFormData & { name?: string; subject?: string }>({
    name: "",
    email_address: "",
    subject: "",
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
      onError?.("Message is required");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email_address)) {
      onError?.("Please enter a valid email address");
      return;
    }

    // Prepare data for submission (map to backend format)
    const submitData: ContactFormData = {
      email_address: formData.email_address,
      question: formData.subject ? `${formData.subject}\n\n${formData.question}` : formData.question,
      supporting_file: formData.supporting_file,
    };

    const result = await submitContact(submitData);

    if (result.success) {
      setFormData({ name: "", email_address: "", subject: "", question: "", supporting_file: null });
      onSuccess?.();
    } else {
      onError?.(result.error || "Failed to submit support request");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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

      {/* Your Name Field */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
        >
          Your Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name || ""}
            onChange={handleInputChange}
            placeholder="Enter your name"
            disabled={isSubmitting}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-transparent border border-gray-300 dark:border-[#2A2A2A] rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#1D8751] focus:border-transparent outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Email Address Field */}
      <div>
        <label
          htmlFor="email_address"
          className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
        >
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="email"
            id="email_address"
            name="email_address"
            value={formData.email_address}
            onChange={handleInputChange}
            placeholder="your@email.com"
            required
            disabled={isSubmitting}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-transparent border border-gray-300 dark:border-[#2A2A2A] rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#1D8751] focus:border-transparent outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Subject Field */}
      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
        >
          Subject
        </label>
        <div className="relative">
          <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject || ""}
            onChange={handleInputChange}
            placeholder="How can we help?"
            disabled={isSubmitting}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-transparent border border-gray-300 dark:border-[#2A2A2A] rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#1D8751] focus:border-transparent outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Message Field */}
      <div>
        <label
          htmlFor="question"
          className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
        >
          Message
        </label>
        <textarea
          id="question"
          name="question"
          value={formData.question}
          onChange={handleInputChange}
          placeholder="Tell us more about your inquiry..."
          rows={4}
          required
          disabled={isSubmitting}
          className="w-full px-4 py-3 bg-white dark:bg-transparent border border-gray-300 dark:border-[#2A2A2A] rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#1D8751] focus:border-transparent outline-none transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#1D8751] text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#167a47] flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            "Sending..."
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send Message
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
