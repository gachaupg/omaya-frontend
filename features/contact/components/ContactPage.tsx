'use client';

import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import ContactForm from './ContactForm';

interface ContactPageProps {
  showFileUpload?: boolean;
}

const ContactPage: React.FC<ContactPageProps> = ({ showFileUpload = true }) => {
  const [formData, setFormData] = useState({
    email: '',
    description: '',
    file: null as File | null,
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      file,
    }));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleConnectLiveChat = () => {
    console.log('Connect with Live Chat clicked');
    // Handle live chat connection logic here
  };

  const handleContactSuccess = () => {
    setShowSuccess(true);
    setShowError(false);
    setFormData({ email: '', description: '', file: null });
    
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
    <div className="min-h-screen">
      <div>
        <h1 className="text-lg font-medium text-[#788099] mb-4">Help & Support</h1>
        
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

        <div className="container mx-auto bg-white dark:bg-[#18181D] border border-[#E8EFF5] dark:border-[#35353E] rounded-2xl shadow-sm p-8 space-y-6">
          {/* Contact Form */}
          <ContactForm 
            onSuccess={handleContactSuccess}
            onError={handleContactError}
          />

          {/* File Upload Section (Optional) */}
          {showFileUpload && (
            <div className="border-t border-[#E8EFF5] dark:border-[#35353E] pt-6">
              <div className='flex items-center gap-2 mb-4' onClick={handleUploadClick}>
                <h3 className="text-lg font-medium text-gray-800 dark:text-white cursor-pointer">Upload Supporting Files</h3>
                <button
                  className="hover:bg-gray-50 dark:hover:bg-[#2C2C32] transition-colors"
                  type="button"
                >
                  <Upload className="h-5 w-5 text-[#1D8751]" />
                </button>
                <input
                  type="file"
                  id="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                />
              </div>
              <p className="text-sm text-gray-500 mb-4">
                You can attach supporting documents, screenshots, or other files that might help us understand your issue better.
                Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG
              </p>
              {formData.file && (
                <div className="mt-2 text-sm text-[#1D8751]">
                  Selected file: {formData.file.name}
                </div>
              )}
            </div>
          )}

          {/* Live Chat Button */}
          <div className="border-t border-[#E8EFF5] dark:border-[#35353E] pt-6">
            <button
              onClick={handleConnectLiveChat}
              className="w-full bg-[#1D8751] text-white font-medium py-3 px-6 rounded-full transition-colors hover:bg-[#166b42]"
            >
              Connect with Live Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;








