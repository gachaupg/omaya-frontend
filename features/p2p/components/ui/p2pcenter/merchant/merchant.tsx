"use client";
import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import { submitMerchantApplicationThunk, clearMerchantError, clearMerchantSuccess, fetchMerchantApplicationStatusThunk } from '@/features/p2p/slices/merchantSlice'

import { logger } from '@/lib/utils/logger';

const Merchant = () => {
  const dispatch = useDispatch()
  const { loading, error, success, status, statusLoading } = useSelector((state: RootState) => state.merchant)
  
  const [files, setFiles] = useState<{
    bank_account_ownership_proof: File | null
    business_registration_certificate: File | null
    tax_identification_number_certificate: File | null
    articles_of_association: File | null
    proof_of_address: File | null
  }>({
    bank_account_ownership_proof: null,
    business_registration_certificate: null,
    tax_identification_number_certificate: null,
    articles_of_association: null,
    proof_of_address: null
  })

  const [currentUploadType, setCurrentUploadType] = useState<keyof typeof files | null>(null)

  // Fetch merchant application status on component mount
  useEffect(() => {
    dispatch(fetchMerchantApplicationStatusThunk() as any)
  }, [dispatch])

  const documentTypes = [
    {
      key: 'bank_account_ownership_proof' as keyof typeof files,
      title: 'Bank Account Ownership Proof',
      description: 'Bank statement showing your name & account number',
      image: 'https://res.cloudinary.com/pitz/image/upload/v1746710370/coins-rotate_d278mb.png',
      required: true
    },
    {
      key: 'business_registration_certificate' as keyof typeof files,
      title: 'Business Registration Certificate',
      description: 'Required if applying as a company',
      image: 'https://res.cloudinary.com/pitz/image/upload/v1746710370/coins-rotate_d278mb.png'
    },
    {
      key: 'tax_identification_number_certificate' as keyof typeof files,
      title: 'Tax Identification Number (TIN) or VAT Certificate',
      description: 'Official tax identification document',
      image: 'https://res.cloudinary.com/pitz/image/upload/v1746710370/coins-rotate_d278mb.png'
    },
    {
      key: 'articles_of_association' as keyof typeof files,
      title: 'Articles of Association / Constitution',
      description: 'To verify who owns and controls the business',
      image: 'https://res.cloudinary.com/pitz/image/upload/v1746710370/coins-rotate_d278mb.png'
    },
    {
      key: 'proof_of_address' as keyof typeof files,
      title: 'Proof of Address',
      description: 'Utility bill, bank statement, or government document showing your address',
      image: 'https://res.cloudinary.com/pitz/image/upload/v1746710370/coins-rotate_d278mb.png',
      required: true
    }
  ]

  const handleFileChange = (file: File | null) => {
    if (currentUploadType && file) {
      // Check for duplicate file names
      const existingFiles = Object.values(files).filter(f => f !== null)
      const duplicateFile = existingFiles.find(existingFile => existingFile?.name === file.name)
      
      if (duplicateFile) {
        alert(`File "${file.name}" has already been uploaded for another document type. Please choose a different file.`)
        return
      }
      
      setFiles(prev => ({
        ...prev,
        [currentUploadType]: file
      }))
    }
  }

  const getCurrentDocument = () => {
    if (!currentUploadType) return null
    return documentTypes.find(doc => doc.key === currentUploadType)
  }

  const handleSubmit = async () => {
    // Check if application already submitted
    if (status && status.status !== 'not_submitted') {
      alert(`You have already submitted a merchant application. Status: ${status.status_display}`)
      return
    }

    const formData = new FormData()
    
    // Add files to FormData
    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        logger.debug('p2p', 'Adding file to FormData:', key, file.name)
        formData.append(key, file)
      } else {
        logger.debug('p2p', 'No file for:', key)
      }
    })

    // Debug: Log all FormData entries
    logger.debug('p2p', 'FormData entries:')
    for (let [key, value] of formData.entries()) {
      logger.debug('p2p', key, value)
    }

    // Check if required files are missing
    const requiredFiles = ['bank_account_ownership_proof', 'proof_of_address']
    const missingFiles = requiredFiles.filter(fileKey => !files[fileKey as keyof typeof files])
    
    if (missingFiles.length > 0) {
      alert(`Please upload the following required documents: ${missingFiles.join(', ')}`)
      return
    }

    try {
      await dispatch(submitMerchantApplicationThunk(formData) as any)
      // Refresh status after successful submission
      dispatch(fetchMerchantApplicationStatusThunk() as any)
    } catch (err) {
      console.error('Error submitting merchant application:', err)
    }
  }

  const handleCancel = () => {
    setFiles({
      bank_account_ownership_proof: null,
      business_registration_certificate: null,
      tax_identification_number_certificate: null,
      articles_of_association: null,
      proof_of_address: null
    })
    setCurrentUploadType(null)
    dispatch(clearMerchantError())
    dispatch(clearMerchantSuccess())
  }

  // Show loading state while fetching status
  if (statusLoading && !status) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1D8751] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading application status...</p>
        </div>
      </div>
    )
  }

  // Show status banner if already submitted
  const showStatusBanner = status && status.status !== 'not_submitted'

  return (
    <div className="min-h-screen  text-white ">
      {/* Background with subtle chart pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full bg-gradient-to-br from-[#1D8751]/10 to-transparent"></div>
      </div>
      
      <div className="relative mt-20 max-full mx-auto">
        {/* Header Section */}
        <div className="text-center mb-1">
        <img src="https://res.cloudinary.com/pitz/image/upload/v1759434631/Frame_35585_okqbnr.png" alt="logo" />
        </div>

        {/* Status Banner */}
        {showStatusBanner && (
          <div className="mb-6 pl-6 pr-6">
            <div className={`p-4 rounded-lg border-2 ${
              status.status === 'pending' ? 'bg-yellow-900/20 border-yellow-500' :
              status.status === 'approved' ? 'bg-green-900/20 border-green-500' :
              status.status === 'rejected' ? 'bg-red-900/20 border-red-500' :
              'bg-gray-800/20 border-gray-500'
            }`}>
              <div className="flex items-start gap-3">
                {status.status === 'pending' && (
                  <svg className="w-6 h-6 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                )}
                {status.status === 'approved' && (
                  <svg className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                )}
                {status.status === 'rejected' && (
                  <svg className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                )}
                <div className="flex-1">
                  <p className={`font-semibold mb-1 ${
                    status.status === 'pending' ? 'text-yellow-400' :
                    status.status === 'approved' ? 'text-green-400' :
                    status.status === 'rejected' ? 'text-red-400' :
                    'text-gray-400'
                  }`}>
                    Application Status: {status.status_display}
                  </p>
                  <p className="text-gray-300 text-sm">
                    {status.status === 'pending' && 'Your application is currently under review. We will notify you once a decision is made.'}
                    {status.status === 'approved' && 'Congratulations! Your merchant application has been approved. You now have merchant privileges.'}
                    {status.status === 'rejected' && 'Your application has been rejected. Please contact support for more information or submit a new application.'}
                  </p>
                  {status.application?.rejection_reason && (
                    <p className="text-red-300 text-sm mt-2">
                      <strong>Reason:</strong> {status.application.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="mb-4 pl-6 pr-6">
          <h2 className="text-2xl font-semibold mb-2">P2P Merchant Application</h2>
          <div className="space-y-4 text-gray-300">
            <p>The P2P Merchant Program allows experienced traders to provide liquidity in our marketplace and earn profits by connecting with buyers and sellers directly. As a merchant, you'll receive exclusive benefits such as increased visibility, higher trade limits, and a verified badge that builds user confidence.</p>
          </div>
        </div>

        {/* Four Cards Section */}
        <div className="grid grid-cols-1 pl-6 pr-6 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Box 1: Verified Identity */}
          <div className="border border-[#1D8751] rounded-lg p-6 bg-[#1D8751]/5 dark:bg-[#1D8751]/10">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Verified Identity</h3>
              <p className="text-sm text-gray-400">Gain trust and credibility with a merchant badge after successful verification.</p>
            </div>
          </div>

          {/* Box 2: Higher Limits */}
          <div className="border border-[#1D8751] rounded-lg p-6 bg-[#1D8751]/5 dark:bg-[#1D8751]/10">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 4V2c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v2h4c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h-1v10c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V10H3c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h4zm2 0h6V2H9v2z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Higher Limits</h3>
              <p className="text-sm text-gray-400">Enjoy increased daily and monthly trading volume once approved.</p>
            </div>
          </div>

          {/* Box 3: Exclusive Badge */}
          <div className="border border-[#1D8751] rounded-lg p-6 bg-[#1D8751]/5 dark:bg-[#1D8751]/10">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Exclusive Badge</h3>
              <p className="text-sm text-gray-400">Stand out in the marketplace with a visible merchant verification badge.</p>
            </div>
          </div>

          {/* Box 4: Priority Support */}
          <div className="border border-[#1D8751] rounded-lg p-6 bg-[#1D8751]/5 dark:bg-[#1D8751]/10">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Priority Support</h3>
              <p className="text-sm text-gray-400">Get faster customer support to resolve trading-related issues quickly.</p>
            </div>
          </div>
        </div>


        {/* Profile Info and Requirements Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 pl-6 pr-6">
          {/* Profile Info */}
          <div className="border border-[#1D8751] rounded-lg p-6 bg-[#1D8751]/5 dark:bg-[#1D8751]/10">
            <h3 className="text-xl font-semibold mb-6">Profile Info</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Name</label>
                <p className="text-white">Advertiser User Name</p>
              </div>
    <div>
                <label className="text-sm text-gray-400">Country</label>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="text-white">Somalia</span>
                </div>
              </div>
              <div className="pt-4">
                <p className="text-sm text-gray-400">Available Currencies: USD</p>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="border border-[#1D8751] rounded-lg p-6 bg-[#1D8751]/5 dark:bg-[#1D8751]/10">
            <h3 className="text-xl font-semibold mb-6">Requirements</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <p className="text-sm text-gray-300">Minimum 30 days of account activity</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <p className="text-sm text-gray-300">Completed KYC (ID & face verification)</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <p className="text-sm text-gray-300">No record of fraudulent or suspicious activity</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
                <div>
                  <p className="text-sm text-gray-300">At least $10,000 equivalent trading volume in the last 30 days</p>
                  <p className="text-xs text-red-400 mt-1">Current: $0.01 USDT (Required: $10,000 USDT)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
                <p className="text-sm text-gray-300">Supporting documents required (see below)</p>
              </div>
            </div>
          </div>
        </div>

          {/* Upload Documents Section - Disable if already submitted */}
        <div className={`mb-12 pl-6 pr-6 ${showStatusBanner && status.status !== 'rejected' ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="text-xl font-semibold mb-6">
            Upload Supporting Documents
            {showStatusBanner && status.status !== 'rejected' && (
              <span className="text-sm text-gray-400 ml-2">(Application already submitted)</span>
            )}
          </h3>
          <div className="mb-6">
            <p className="text-gray-300 mb-4">
              To complete your application, please upload the following documents (in addition to your KYC documents submitted during registration):
            </p>
            <p className="text-gray-400 text-sm">
              (Accepted formats: PDF, JPG, PNG. Max file size: 10MB)
            </p>
          </div>

          {/* Document Type Selector */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-200 mb-4">Select Document Type</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {documentTypes.map((doc) => (
                <button
                  key={doc.key}
                  onClick={() => setCurrentUploadType(doc.key)}
                  className={`p-4 rounded-lg border-2 text-center transition-all flex flex-col items-center gap-3 ${
                    currentUploadType === doc.key
                      ? 'border-[#1D8751] bg-[#1D8751]/20 dark:bg-[#1D8751]/10'
                      : files[doc.key]
                      ? 'border-[#1D8751] bg-[#1D8751]/10 dark:bg-[#1D8751]/5'
                      : 'border-gray-600 dark:border-[#35353E] bg-gray-800/30 dark:bg-[#18181D] hover:border-[#1D8751] hover:bg-[#1D8751]/5'
                  }`}
                >
                  <div className="w-12 h-12 flex items-center justify-center">
                    <img 
                      src={doc.image} 
                      alt={doc.title}
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <h5 className="font-medium text-white text-xs text-center leading-tight">{doc.title}</h5>
                      {doc.required && (
                        <span className="text-red-400 text-xs">*</span>
                      )}
                    </div>
                    {files[doc.key] && (
                      <div className="flex items-center gap-1 mt-2">
                        <svg className="w-4 h-4 text-[#1D8751]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        <span className="text-[#1D8751] text-xs">Uploaded</span>
                      </div>
                    )}
                    {!files[doc.key] && doc.required && (
                      <span className="text-red-400 text-xs mt-1">Required</span>
                    )}
                    {currentUploadType === doc.key && (
                      <div className="w-2 h-2 bg-[#1D8751] rounded-full mt-2"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Single File Upload Area */}
          {currentUploadType && (
            <div className="mb-6">
              <div className="border-2 border-dashed border-[#1D8751] rounded-lg p-8 text-center bg-[#1D8751]/5 dark:bg-[#1D8751]/10 hover:border-[#1D8751] hover:bg-[#1D8751]/10 transition-colors">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-4 flex items-center justify-center">
                    <img 
                      src={getCurrentDocument()?.image} 
                      alt={getCurrentDocument()?.title}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">
                    Upload {getCurrentDocument()?.title}
                  </h4>
                  <p className="text-gray-400 mb-4">
                    {getCurrentDocument()?.description}
                  </p>
                  
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    className="hidden"
                    id={`file-upload-${currentUploadType}`}
                  />
                  <label
                    htmlFor={`file-upload-${currentUploadType}`}
                    className="px-6 py-3 bg-[#1D8751] text-white rounded-lg hover:bg-[#1D8751] hover:border-[#1D8751] border-2 border-[#1D8751] transition-all duration-200 cursor-pointer font-medium"
                  >
                    {files[currentUploadType] ? 'Change File' : 'Choose File'}
                  </label>
                  
                  
                  {files[currentUploadType] && (
                    <div className="mt-4 p-3 bg-[#1D8751]/20 border border-[#1D8751] rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-[#1D8751]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                          <div>
                            <span className="text-[#1D8751] font-medium">
                              {files[currentUploadType]?.name}
                            </span>
                            <p className="text-gray-400 text-sm">
                              {(files[currentUploadType]?.size || 0) / 1024 / 1024 < 1 
                                ? `${Math.round((files[currentUploadType]?.size || 0) / 1024)} KB`
                                : `${Math.round((files[currentUploadType]?.size || 0) / 1024 / 1024 * 10) / 10} MB`
                              }
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setFiles(prev => ({ ...prev, [currentUploadType]: null }))}
                          className="text-[#1D8751] hover:text-[#1D8751] hover:bg-[#1D8751]/10 p-1 rounded transition-all duration-200"
                          title="Remove file"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Uploaded Files Summary */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-200 mb-4">Uploaded Documents</h4>
            <div className="space-y-2">
              {Object.entries(files).map(([key, file]) => {
                const doc = documentTypes.find(d => d.key === key)
                if (!file) return null
                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-[#1D8751]/5 dark:bg-[#1D8751]/10 rounded-lg border border-[#1D8751] dark:border-[#1D8751]">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-[#1D8751]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                      <div>
                        <p className="text-white font-medium text-sm">{doc?.title}</p>
                        <p className="text-gray-400 text-xs">{file.name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFiles(prev => ({ ...prev, [key]: null }))}
                      className="text-[#1D8751] hover:text-[#1D8751] hover:bg-[#1D8751]/10 p-1 rounded transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </button>
                  </div>
                )
              })}
              {Object.values(files).every(file => !file) && (
                <p className="text-gray-500 text-center py-8">No documents uploaded yet</p>
              )}
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-4 bg-[#1D8751]/20 border border-[#1D8751] rounded-lg">
              <p className="text-[#1D8751]">✓ Merchant application submitted successfully!</p>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <div className="flex-1">
                  <p className="text-red-400 font-medium mb-2">Application Failed</p>
                  <div className="text-red-300 text-sm">
                    {typeof error === 'string' ? (
                      <p>{error}</p>
                    ) : error?.detail ? (
                      <div>
                        <p className="font-medium mb-2">{error.detail}</p>
                        {error.errors && Array.isArray(error.errors) && (
                          <ul className="list-disc list-inside space-y-1">
                            {error.errors.map((err: string, index: number) => (
                              <li key={index}>{err}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <p>An unexpected error occurred. Please try again.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pl-6 pr-6">
          <button 
            onClick={handleCancel}
            className="px-8 py-3 border-2 border-[#1D8751] text-[#1D8751] rounded-lg hover:bg-[#1D8751] hover:text-white transition-all duration-200 font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading || (!!showStatusBanner && status?.status !== 'rejected')}
            className="px-8 py-3 bg-[#1D8751] text-white rounded-lg hover:bg-[#1D8751] hover:border-[#1D8751] border-2 border-[#1D8751] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"    
          >
            {loading ? 'Submitting...' : showStatusBanner && status?.status !== 'rejected' ? 'Already Submitted' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Merchant