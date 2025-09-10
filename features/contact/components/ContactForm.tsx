'use client';

import React, { useState } from 'react';
import { useContact } from '../hooks/useContact';
import type { ContactFormData } from '../types';

interface ContactFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState<ContactFormData>({
    email: '',
    question: '',
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
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors/success
    clearContactError();
    clearContactSuccess();

    // Validate form
    if (!formData.email.trim()) {
      onError?.('Email is required');
      return;
    }

    if (!formData.question.trim()) {
      onError?.('Question is required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      onError?.('Please enter a valid email address');
      return;
    }

    const result = await submitContact(formData);
    
    if (result.success) {
      setFormData({ email: '', question: '' });
      onSuccess?.();
    } else {
      onError?.(result.error || 'Failed to submit contact form');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Field */}
      <div>
        <label 
          htmlFor="email" 
          className="block text-sm font-medium text-[#344054] dark:text-white mb-2"
        >
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="your.email@example.com"
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
          Your Question *
        </label>
        <textarea
          id="question"
          name="question"
          value={formData.question}
          onChange={handleInputChange}
          placeholder="Please describe your question or issue..."
          rows={4}
          required
          disabled={isSubmitting}
          className="w-full px-4 py-3 border border-[#E8EFF5] dark:border-[#35353E] rounded-2xl focus:ring-2 focus:ring-[#1D8751] focus:border-transparent outline-none transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#1D8751] text-white font-medium py-3 px-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#166b42]"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Contact Form'}
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
