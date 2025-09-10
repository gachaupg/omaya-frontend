'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import ContactForm from './ContactForm';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const ContactModal: React.FC<ContactModalProps> = ({ 
  isOpen, 
  onClose, 
  title = "Contact Us" 
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleContactSuccess = () => {
    setShowSuccess(true);
    setShowError(false);
    
    // Hide success message after 3 seconds and close modal
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-[#18181D] rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E8EFF5] dark:border-[#35353E]">
          <h2 className="text-xl font-semibold text-[#344054] dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#2C2C32] rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-[#788099]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
              <p className="text-green-800 dark:text-green-200 text-sm">
                Thank you! Your message has been submitted successfully. We'll get back to you soon.
              </p>
            </div>
          )}

          {/* Error Message */}
          {showError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
              <p className="text-red-800 dark:text-red-200 text-sm">
                {errorMessage}
              </p>
            </div>
          )}

          <ContactForm 
            onSuccess={handleContactSuccess}
            onError={handleContactError}
          />
        </div>
      </div>
    </div>
  );
};

export default ContactModal;


