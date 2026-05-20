"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useMarketingI18n } from "@/lib/useMarketingI18n";
import { useContact } from "../hooks/useContact";
import type { ContactFormData } from "../types";
import { User, Mail, MessageCircle, Send } from "lucide-react";
import { RootState } from "@/store/rootReducer";

interface ContactFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  /** Marketing contact page: 2-col name/email, darker fields, no redirect after send */
  layout?: "default" | "marketing";
}

const ContactForm: React.FC<ContactFormProps> = ({
  onSuccess,
  onError,
  layout = "default",
}) => {
  const isMarketing = layout === "marketing";
  const { t } = useMarketingI18n();
  const router = useRouter();
  const { isAuthenticated, user, profile } = useSelector((state: RootState) => state.auth);
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

  // Clear any stale success/error state on mount and unmount
  useEffect(() => {
    clearContactSuccess();
    clearContactError();
    return () => {
      clearContactSuccess();
      clearContactError();
    };
  }, []);

  // Auto-dismiss success and error messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        clearContactSuccess();
      }, 5000); // Auto-dismiss after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [success, clearContactSuccess]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearContactError();
      }, 5000); // Auto-dismiss after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error, clearContactError]);

  // Prefill name/email for authenticated users; guests enter manually.
  useEffect(() => {
    if (!isAuthenticated) return;

    let fallbackEmail = "";
    let fallbackName = "";
    if (typeof window !== "undefined") {
      try {
        const rawProfile = localStorage.getItem("profile");
        if (rawProfile) {
          const parsed = JSON.parse(rawProfile);
          fallbackEmail = parsed?.user?.email || "";
          const first = parsed?.user?.first_name || "";
          const last = parsed?.user?.last_name || "";
          fallbackName = `${first} ${last}`.trim();
        }
      } catch {
        // Ignore malformed local storage payload.
      }
    }

    const firstName = user?.first_name || "";
    const lastName = user?.last_name || "";
    const authName = `${firstName} ${lastName}`.trim();
    const nextName = authName || fallbackName;
    const nextEmail = user?.email || fallbackEmail;

    setFormData((prev) => ({
      ...prev,
      name: nextName || prev.name || "",
      email_address: nextEmail || prev.email_address || "",
    }));
  }, [isAuthenticated, user?.first_name, user?.last_name, user?.email, profile?.country]);

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

      if (!isMarketing) {
        setTimeout(() => {
          router.back();
        }, 3000);
      }
    } else {
      onError?.(result.error || "Failed to submit support request");
    }
  };

  const labelClass = isMarketing
    ? "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
    : "block text-sm font-medium text-[#344054] dark:text-white mb-2";
  const inputClass = isMarketing
    ? "w-full bg-white dark:bg-[#14141a] border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#1D8751] focus:border-[#1D8751] dark:focus:border-gray-500 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
    : "w-full bg-gray-50 dark:bg-[#1A1A1F] border border-border dark:border-accent rounded-2xl text-gray-900 dark:text-gray-100 placeholder-muted-foreground focus:ring-2 focus:ring-[#1D8751] focus:border-transparent outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base";

  return (
    <form onSubmit={handleSubmit} className={isMarketing ? "space-y-5" : "space-y-6"}>
      {/* Success Message */}
      {success && (
        <div className="bg-[#D1FAE5] dark:bg-[#064E3B] border border-[#10B981] rounded-2xl p-4 flex items-start space-x-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <svg
            className="w-6 h-6 text-[#10B981]shrink-0 mt-0.5"
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
            className="w-6 h-6 text-error shrink-0 mt-0.5"
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

      {isMarketing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label htmlFor="name" className={labelClass}>
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ""}
              onChange={handleInputChange}
              placeholder="John Doe"
              disabled={isSubmitting || isAuthenticated}
              className={`${inputClass} px-4 py-3`}
            />
          </div>
          <div>
            <label htmlFor="email_address" className={labelClass}>
              Email Address
            </label>
            <input
              type="email"
              id="email_address"
              name="email_address"
              value={formData.email_address}
              onChange={handleInputChange}
              placeholder="john@example.com"
              required
              disabled={isSubmitting || isAuthenticated}
              className={`${inputClass} px-4 py-3`}
            />
          </div>
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="name" className={labelClass}>
              Your Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name || ""}
                onChange={handleInputChange}
                placeholder="Enter your name"
                disabled={isSubmitting || isAuthenticated}
                className={`${inputClass} pl-10 pr-4 py-2.5 sm:py-3`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="email_address" className={labelClass}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                id="email_address"
                name="email_address"
                value={formData.email_address}
                onChange={handleInputChange}
                placeholder="your@email.com"
                required
                disabled={isSubmitting || isAuthenticated}
                className={`${inputClass} pl-10 pr-4 py-2.5 sm:py-3`}
              />
            </div>
          </div>
        </>
      )}

      {/* Subject Field */}
      <div>
        <label htmlFor="subject" className={labelClass}>
          Subject
        </label>
        <div className="relative">
          {!isMarketing && (
            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          )}
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject || ""}
            onChange={handleInputChange}
            placeholder={isMarketing ? "Subject" : "How can we help?"}
            disabled={isSubmitting}
            className={`${inputClass} ${isMarketing ? "px-4 py-3" : "pl-10 pr-4 py-2.5 sm:py-3"}`}
          />
        </div>
      </div>

      {/* Message Field */}
      <div>
        <label htmlFor="question" className={labelClass}>
          Message
        </label>
        <textarea
          id="question"
          name="question"
          value={formData.question}
          onChange={handleInputChange}
          placeholder={
            isMarketing
              ? "Please describe your inquiry in detail..."
              : "Tell us more about your inquiry..."
          }
          rows={isMarketing ? 5 : 4}
          required
          disabled={isSubmitting}
          className={`${inputClass} px-4 py-3 resize-none`}
        />
      </div>

      {/* Submit Button */}
      <div className={isMarketing ? "pt-1" : "pt-2"}>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-[#1D8751] text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#166b42] flex items-center justify-center gap-2 ${
            isMarketing
              ? "py-3.5 rounded-xl text-sm"
              : "py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl text-sm sm:text-base"
          }`}
        >
          {isSubmitting ? (
            "Sending..."
          ) : (
            <>
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              Send Message
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
