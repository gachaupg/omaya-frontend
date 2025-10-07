'use client'

import { Upload } from 'lucide-react'
import React, { useRef, useState } from 'react'

interface FormData {
  email: string
  description: string
  file: File | null
}

const HelpSupportForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    description: '',
    file: null
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
      file
    }))
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmitEmail = () => {
    console.log('Submit Email clicked', formData)
    // Handle email submission logic here
  }

  const handleConnectLiveChat = () => {
    console.log('Connect with Live Chat clicked')
    // Handle live chat connection logic here
  }

  return (
    <div className="min-h-screen">
      <div>
        <h1 className="text-lg font-medium text-[#788099] mb-4">Help & Support</h1>
        
        <div className="container mx-auto bg-white dark:bg-[#18181D] border border-[#E8EFF5] dark:border-[#35353E] rounded-2xl shadow-sm p-8 space-y-6">
          {/* Subject/Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#344054] dark:text-white mb-2">
              Subject
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Your email address"
              className="w-full px-4 py-3 border border-[#E8EFF5]  dark:border-[#35353E] rounded-2xl focus:ring-2 focus:ring-[#1D8751] focus:border-transparent outline-none transition-colors"
            />
          </div>

          {/* Text/Description Field */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[#344054] dark:text-white mb-2">
              Text
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Description"
              rows={4}
              className="w-full px-4 py-3 border border-[#E8EFF5] dark:border-[#35353E] rounded-2xl focus:ring-2 focus:ring-[#1D8751] focus:border-transparent outline-none transition-colors resize-none"
            />
          </div>

          {/* Upload Section */}
          <div>
            <div className='flex items-center gap-2 mb-4'  onClick={handleUploadClick}>
                <h3 className="text-lg font-medium text-gray-800 dark:text-white cursor-pointer">Upload</h3>
                <button
                className="hover:bg-gray-50 dark:hover:bg-[#2C2C32] transition-colors"
                >
                <Upload className="h-5 w-5 text-[#1D8751]" />
                </button>
            <input
              type="file"
              id="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            </div>
            <p className="text-sm text-gray-500 mb-4">
              Upload relevant files such as screenshots, documents, or error logs to help us better understand and resolve your issue. 
              Supported formats include images (PNG, JPG), documents (PDF, DOC), and text files.
            </p>
              {formData.file && (
                <div className="mt-2 text-sm text-[#1D8751]">
                    Selected file: {formData.file.name}
                </div>
                )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={handleConnectLiveChat}
              className="flex-1 bg-[#1D8751] text-white font-medium py-3 px-6 rounded-full transition-colors"
            >
              Connect with Live Chat
            </button>
            <button
              onClick={handleSubmitEmail}
              className="flex-1 bg-white dark:bg-[#18181D] hover:bg-gray-50 text-[#1D8751] font-medium py-3 px-6 rounded-full border border-[#1D8751] transition-colors"
            >
              Submit Email
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HelpSupportForm;