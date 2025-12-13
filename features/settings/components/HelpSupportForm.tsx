'use client'

import { Upload } from 'lucide-react'
import React, { useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createSupportRequest } from '../slices/settingsSlice'
import { AppDispatch, RootState } from '@/store'

import { logger } from '@/lib/utils/logger';

interface FormData {
  email_address: string
  question: string
  supporting_file: File | null
}

const HelpSupportForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { supportRequestLoading, supportRequestError } = useSelector(
    (state: RootState) => state.settings
  )
  
  const [formData, setFormData] = useState<FormData>({
    email_address: '',
    question: '',
    supporting_file: null
  })
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData(prev => ({
      ...prev,
      supporting_file: file
    }))
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmitEmail = async () => {
    if (!formData.email_address || !formData.question) {
      return
    }

    try {
      await dispatch(
        createSupportRequest({
          email_address: formData.email_address,
          question: formData.question,
          supporting_file: formData.supporting_file,
        })
      ).unwrap()
      
      // Reset form on success
      setFormData({
        email_address: '',
        question: '',
        supporting_file: null
      })
    } catch (error) {
      logger.error('dashboard', 'Failed to submit support request:', error)
    }
  }

  const handleConnectLiveChat = () => {
    logger.debug('dashboard', 'Connect with Live Chat clicked')
    // Handle live chat connection logic here
  }

  return (
    <div className="min-h-screen">
      <div>
        <h1 className="text-base sm:text-lg font-medium text-[#788099] mb-3 sm:mb-4">Help & Support</h1>
        
        <div className="container mx-auto bg-white dark:bg-[var(--bg-color)] border border-[#E8EFF5] dark:border-[#35353E] rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {/* Email Address Field */}
          <div>
            <label htmlFor="email_address" className="block text-sm font-medium text-[#344054] dark:text-white mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email_address"
              name="email_address"
              value={formData.email_address}
              onChange={handleInputChange}
              placeholder="Your email address"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-[#E8EFF5]  dark:border-[#35353E] rounded-2xl focus:ring-2 focus:ring-[#1D8751] focus:border-transparent outline-none transition-colors text-sm sm:text-base"
            />
          </div>

          {/* Question Field */}
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-[#344054] dark:text-white mb-2">
              Your Question
            </label>
            <textarea
              id="question"
              name="question"
              value={formData.question}
              onChange={handleInputChange}
              placeholder="Please describe your question or issue..."
              rows={4}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-[#E8EFF5] dark:border-[#35353E] rounded-2xl focus:ring-2 focus:ring-[#1D8751] focus:border-transparent outline-none transition-colors resize-none text-sm sm:text-base"
            />
          </div>

          {/* Upload Section */}
          <div className="border-t border-[#E8EFF5] dark:border-[#35353E] pt-4 sm:pt-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-800 dark:text-white mb-2">
              Upload Supporting Files
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">
              You can attach supporting documents, screenshots, or other files that might help us understand your issue better. Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG
            </p>
            
            <div 
              onClick={handleUploadClick}
              className="border-2 border-dashed border-[#E8EFF5] dark:border-[#35353E] rounded-2xl p-4 sm:p-6 cursor-pointer hover:border-[#1D8751] transition-colors"
            >
              <div className='flex flex-col items-center gap-3'>
                <div className="p-3 bg-[#1D8751]/10 rounded-full">
                  <Upload className="h-6 w-6 text-[#1D8751]" />
                </div>
                <div className="text-center">
                  <p className="text-sm sm:text-base font-medium text-gray-800 dark:text-white mb-1">
                    Click to upload file
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                    PDF, DOC, DOCX, TXT, PNG, JPG, JPEG (Max 10MB)
                  </p>
                </div>
              </div>
              <input
                type="file"
                id="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              />
            </div>
            
            {formData.supporting_file && (
              <div className="mt-3 p-2 sm:p-3 bg-[#1D8751]/10 rounded-lg">
                <p className="text-xs sm:text-sm text-[#1D8751] font-medium">
                  ✓ Selected: {formData.supporting_file.name}
                </p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-[#E8EFF5] dark:border-[#35353E]">
            <button
              onClick={handleConnectLiveChat}
              className="flex-1 bg-[#1D8751] text-white font-medium py-2.5 sm:py-3 px-5 sm:px-6 rounded-full transition-colors text-sm sm:text-base"
            >
              Connect with Live Chat
            </button>
            <button
              onClick={handleSubmitEmail}
              disabled={supportRequestLoading || !formData.email_address || !formData.question}
              className="flex-1 bg-white dark:bg-[var(--bg-color)] hover:bg-gray-50 text-[#1D8751] font-medium py-2.5 sm:py-3 px-5 sm:px-6 rounded-full border border-[#1D8751] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {supportRequestLoading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HelpSupportForm;