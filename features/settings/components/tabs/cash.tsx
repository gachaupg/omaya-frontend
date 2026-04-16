import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import Button from "@/components/ui/Button"
import { createCashWithdrawal, clearSuccess, clearError, calculateCashWithdrawalFees, clearFees } from '../../slices/cashWithdrawalSlice'
import { fetchReferralWallet } from '../../slices/referralWalletSlice'
import { fetchUserPaymentDetails, fetchAdminPaymentMethods } from '@/features/p2p/slices/paymentMethodsSlice'
import { AppDispatch } from '@/store/rootReducer'
import UserPaymentSelector, { UserPaymentDetail } from '@/features/p2p/components/ui/p2pdashboard/sections/UserPaymentSelector'
import PaymentMethodsModal from '@/features/p2p/components/ui/p2pdashboard/sections/PaymentMethodsModal'
import { showToast } from '@/lib/utils/toast'
import { useDebounce } from '@/hooks/useDebounce'

import { logger } from '@/lib/utils/logger';

interface CashProps {
  sharedFeesError?: string | null;
}

function Cash({ sharedFeesError }: CashProps) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { loading, error, success, message, withdrawalData, fees, feesLoading, feesError } = useSelector((state: any) => state.cashWithdrawal)
  const { userPaymentDetails, userDetailsLoading, adminMethods } = useSelector((state: any) => state.paymentMethods)
  const referralWalletBalance = Number(
    useSelector((state: any) => state.referralWallet?.data?.balance ?? 0)
  )
  
  const [amount, setAmount] = useState("")
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<UserPaymentDetail[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isTermsAccepted, setIsTermsAccepted] = useState(false)
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false)
  const [errors, setErrors] = useState<{
    amount?: string;
    paymentMethod?: string;
  }>({})

  // Debounce amount to avoid too many API calls
  const debouncedAmount = useDebounce(amount, 500)

  const commission = fees?.commission_fee ? Number(fees.commission_fee) : 0
  const networkFee = fees?.network_fee ? Number(fees.network_fee) : 0
  const totalFees = fees?.total_fees ? Number(fees.total_fees) : 0
  const netAmount = fees?.net_amount ? Number(fees.net_amount) : amount ? Number(amount) : 0
  const totalWithFees = fees?.requested_amount
    ? Number(fees.requested_amount)
    : amount
      ? Number(amount)
      : 0
  const enteredAmount = Number(amount || 0)
  const exceedsReferralBalance =
    Number.isFinite(enteredAmount) &&
    enteredAmount > 0 &&
    enteredAmount > referralWalletBalance

  // Load user payment details and admin methods on component mount
  useEffect(() => {
    dispatch(fetchReferralWallet() as any)
    dispatch(fetchUserPaymentDetails() as any)
    dispatch(fetchAdminPaymentMethods() as any)
  }, [dispatch])

  const normalizedFeesError =
    typeof feesError === 'object' && feesError !== null
      ? feesError.error || feesError.message || Object.values(feesError)[0]
      : feesError
  const effectiveFeesError = normalizedFeesError || sharedFeesError || null

  useEffect(() => {
    const trimmedAmount = String(amount || "").trim()
    if (!trimmedAmount) {
      setErrors((prev) => ({ ...prev, amount: undefined }))
      return
    }

    const numericAmount = Number(trimmedAmount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrors((prev) => ({
        ...prev,
        amount: "Please enter a valid amount",
      }))
      return
    }

    if (numericAmount > referralWalletBalance) {
      setErrors((prev) => ({
        ...prev,
        amount: `Amount exceeds your referral wallet balance of $${referralWalletBalance.toFixed(2)}`,
      }))
      return
    }

    setErrors((prev) => ({ ...prev, amount: undefined }))
  }, [amount, referralWalletBalance])

  // Fetch fees when amount changes
  useEffect(() => {
    const trimmedAmount = debouncedAmount.trim()

    if (!trimmedAmount) {
      dispatch(clearFees())
      return
    }

    const parsedAmount = Number(trimmedAmount)

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      dispatch(clearFees())
      return
    }

    dispatch(calculateCashWithdrawalFees(trimmedAmount))
  }, [debouncedAmount, dispatch])

  const handleSelectPaymentDetail = (detail: UserPaymentDetail) => {
    setSelectedPaymentDetails((prev) =>
      prev.some((d) => d.id === detail.id) ? prev : [...prev, detail]
    )
  }

  const handleRemovePaymentDetail = (detail: UserPaymentDetail) => {
    setSelectedPaymentDetails((prev) => prev.filter((d) => d.id !== detail.id))
  }

  const validateForm = () => {
    const newErrors: {
      amount?: string;
      paymentMethod?: string;
    } = {}
    let isValid = true

    if (!amount || Number(amount) <= 0) {
      newErrors.amount = "Please enter a valid amount"
      isValid = false
    }
    if (Number(amount) > referralWalletBalance) {
      newErrors.amount = `Amount exceeds your referral wallet balance of $${referralWalletBalance.toFixed(2)}`
      isValid = false
    }

    if (selectedPaymentDetails.length === 0) {
      newErrors.paymentMethod = "Select at least one payment method"
      isValid = false
    }

    setErrors(newErrors)

    const firstErrorField = ["amount", "paymentMethod"].find(
      (field) => newErrors[field as keyof typeof newErrors]
    );

    if (firstErrorField) {
      setTimeout(() => {
        const element = document.getElementById(`cash-${firstErrorField}-section`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          const input = element.querySelector("input");
          if (input) {
            input.focus({ preventScroll: true });
          }
        }
      }, 100);
    }

    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true) // Set submitting flag to true

    const withdrawalPayload = {
      requested_amount: amount,
      withdrawal_method: "cash",
      user_payment_detail_id: selectedPaymentDetails[0]?.id
    }

    dispatch(createCashWithdrawal(withdrawalPayload))
  }


  // Clear payment methods success state immediately on component mount
  useEffect(() => {
    dispatch({ type: 'paymentMethods/clearPostStatus' })
  }, [dispatch])

  // Handle success - show modal
  useEffect(() => {
    logger.debug('dashboard', "Cash withdrawal success effect:", { success, withdrawalData })
    if (success && withdrawalData) {
      logger.debug('dashboard', "Showing success modal with data:", withdrawalData)
      showToast.success(withdrawalData.message || "Withdrawal submitted successfully!")
      setShowSuccessModal(true)
      setAmount("")
      setSelectedPaymentDetails([])
      setErrors({})
      setIsSubmitting(false)
    }
  }, [success, withdrawalData])

  // Handle errors - show toast with better error message
  useEffect(() => {
    if (error) {
      console.error("Cash withdrawal error:", error)
      // Extract meaningful error message
      let errorMessage = "Failed to submit withdrawal";
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object") {
        // Handle different error formats
        if ('error' in error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('detail' in error && typeof error.detail === 'string') {
          errorMessage = error.detail;
        }
      }
      showToast.error(errorMessage)
      setIsSubmitting(false)
    }
  }, [error])

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    dispatch(clearSuccess())
    router.push("/dashboard/account?tab=referral&view=history")
  }

  return (
    <>
      {/* Success Modal */}
      {showSuccessModal && withdrawalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-color)] border border-[#1D8751] rounded-2xl p-8 max-w-md mx-4">
            <div className="mb-4">
              <svg
                className="w-16 h-16 text-[#1D8751] mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 text-center">
              Withdrawal Submitted Successfully!
            </h3>
            <p className="text-[#A3A3A3] mb-4 text-center text-sm">
              {withdrawalData.message}
            </p>
            
            {/* Withdrawal Details */}
            <div className="bg-[var(--bg-color)] border border-[#35353F] rounded-xl p-4 mb-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#A3A3A3] text-sm">Withdrawal ID:</span>
                <span className="text-gray-800 dark:text-white text-sm font-mono">{withdrawalData.withdrawal_id?.substring(0, 8)}...</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#A3A3A3] text-sm">Requested Amount:</span>
                <span className="text-[#1D8751] font-semibold">${withdrawalData.requested_amount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#A3A3A3] text-sm">Commission Fee:</span>
                <span className="text-gray-800 dark:text-white text-sm">${withdrawalData.commission_fee}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#A3A3A3] text-sm">Network Fee:</span>
                <span className="text-gray-800 dark:text-white text-sm">${withdrawalData.network_fee}</span>
              </div>
              <div className="border-t border-[#35353F] pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#A3A3A3] font-semibold">Total Amount Due:</span>
                  <span className="text-[#EF4444] font-bold text-lg">${withdrawalData.total_amount_due}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCloseSuccessModal}
              className="w-full bg-[#1D8751] text-white py-3 rounded-xl text-lg font-medium hover:bg-[#166b3e] transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
          {/* 1- Transaction Info */}
          <div className="text-md font-bold mb-2 text-[#788099] dark:text-[#788099]">1- Transaction Info</div>

          <div className="mb-3 p-3 border border-[#E8EFF5] dark:border-[#35353F] bg-white dark:bg-[var(--card-color)] rounded-lg">
            <div className="flex flex-col md:flex-row gap-4 mb-2">
              <div className="flex-1" id="cash-amount-section">
                <label className="block text-sm text-[#788099] dark:text-[#A3A3A3] mb-1">Amount</label>
                <input
                  className={`w-full bg-white dark:bg-[var(--bg-color)] border border-[#E8EFF5] dark:border-[#35353F] rounded-[18px] px-1 py-1 text-[#788099] dark:text-white text-lg focus:outline-none ${
                    errors.amount ? "border-red-500" : ""
                  }`}
                  placeholder="100"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    setErrors((prev) => ({ ...prev, amount: undefined }))
                  }}
                />
                {errors.amount && (
                  <div className="text-red-500 text-xs mt-1 ml-2">
                    {errors.amount}
                  </div>
                )}
                {effectiveFeesError && (
                  <div className="text-red-500 text-xs mt-1 ml-2">
                    {effectiveFeesError}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm text-[#788099] dark:text-[#A3A3A3] mb-1">
                  I want to Recieve Net
                </label>
                <div className="flex items-center bg-white dark:bg-[var(--bg-color)] border border-[#E8EFF5] dark:border-[#35353F] rounded-[18px] px-1 py-1">
                  <span className="text-[#1D8751] text-2xl font-bold mr-2">
                    $ {Number.isFinite(netAmount) ? netAmount.toFixed(2) : "0.00"}
                  </span>
                  <span className="ml-auto text-[#A3A3A3] flex items-center">
                    USD
                    <svg
                      className="ml-1 w-4 h-4 text-[#A3A3A3]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center text-sm mb-2 mt-1">
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                className="mr-1 shrink-0"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#EF4444"
                  strokeWidth="2"
                />
                <path
                  d="M12 8v4"
                  stroke="#EF4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="16" r="1" fill="#EF4444" />
              </svg>
              <span className="text-[#fffff]">
                This is only estimated price and its based on current Market
                Price. We will fix the price when we receive the funds.
              </span>
            </div>

            {/* Amount & Fees */}
            <div className="border border-[#E8EFF5] dark:border-[#35353F] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center mb-2">
              <div className="flex-1 flex flex-col">
                <div className="text-[#051015] dark:text-[#A3A3A3] mb-1 text-sm">
                  Net Amount to Transfer
                </div>
                <button className="w-full bg-[#EEF1F4] dark:bg-[#35353F] text-[#051015] dark:text-white font-medium text-sm rounded-[18px] px-2 py-2">
                  Amount including Total Fees{" "}
                  <span className="bg-[#1D8751] rounded-full px-4 py-1 text-white text-12">
                    {feesLoading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      `$${totalWithFees.toFixed(2)}`
                    )}
                  </span>
                </button>
              </div>
              <div className="flex-1 border rounded-lg border-[#E8EFF5] dark:border-[#35353F] p-3 flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#051015] dark:text-[#A3A3A3]">Commission:</span>
                  <span className="text-[#1D8751]">
                    {feesLoading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      `$${commission.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#051015] dark:text-[#A3A3A3]">Network Fee:</span>
                  <span className="text-[#1D8751]">
                    {feesLoading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      `$${networkFee.toFixed(2)}`
                    )}
                  </span>
                </div>

                {/* Divider line between Network Fee and Total Fees */}
                <div className="border-t border-[#E8EFF5] dark:border-[#35353F] my-2"></div>

                <div className="flex justify-between font-bold">
                  <span className="text-[#051015] dark:text-[#A3A3A3]">Total Fees</span>
                  <span className="text-[#EF4444]">
                    {feesLoading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      `$${totalFees.toFixed(2)}`
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start text-[#F79330] text-xs mb-1">
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                className="mr-1 mt-0.5 flex-shrink-0"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#F79330"
                  strokeWidth="2"
                />
                <path
                  d="M12 8v4"
                  stroke="#F79330"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="16" r="1" fill="#F79330" />
              </svg>
              <span className="text-[#A3A3A3]">
                Transactions are subject to commission, above is the
                information on the commission rates
              </span>
            </div>
            <div className="text-xs text-[#788099] dark:text-[#A3A3A3] mt-2">
              Available referral balance: ${referralWalletBalance.toFixed(2)}
            </div>
          </div>

          {/* 2- Your Bank / Mobile Payment Details */}
          <div>
            <div className="text-md font-bold mb-2 text-[#788099] dark:text-[#788099]">
              2- Your Bank / Mobile Payment Details
            </div>
            <div className="mb-2 border border-[#E8EFF5] dark:border-[#35353F] text_highbg-dark bg-[white] dark:bg-[var(--card-color)] p-3 rounded-[18px]" id="cash-paymentMethod-section">
              
              {/* User Payment Selector - Same as Adds.tsx */}
              <UserPaymentSelector
                userPaymentDetails={(userPaymentDetails || []).filter(
                  (detail: UserPaymentDetail) => detail.payment_method_name?.toLowerCase() !== 'crypto'
                )}
                adminMethods={adminMethods || []}
                onSelect={handleSelectPaymentDetail}
                onRemove={handleRemovePaymentDetail}
                selectedDetails={selectedPaymentDetails}
                onAddPaymentMethod={() => setShowAddPaymentModal(true)}
              />
              
              {errors.paymentMethod && (
                <div className="text-red-500 text-xs mt-2">
                  {errors.paymentMethod}
                </div>
              )}

              {/* Transfer Details */}
              <div className="flex items-center mb-2 text-[#1D8751] font-semibold text-base">
                  <span className="text-[#051015] dark:text-[#A3A3A3] ml-2 text-sm">Transfer Details</span>{" "}
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="mr-1"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="#1D8751"
                      strokeWidth="2"
                    />
                    <path
                      d="M12 8v4"
                      stroke="#1D8751"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx="12" cy="16" r="1" fill="#1D8751" />
                  </svg>
                </div>
              <div className="bg-[#F5F7FA] dark:bg-[#1A1A1F] border border-[#1D8751]/30 rounded-lg p-4 mb-4">
                <style jsx>{`
                  .custom-bullet-list li::marker {
                    color: #1D8751;
                    font-size: 1.2rem;
                  }
                `}</style>
                <ul className="custom-bullet-list list-disc pl-5 text-[#788099] dark:text-[#C1C1C1] text-[13px] leading-relaxed space-y-1 marker:text-[#1D8751] font-normal">
                  <li>Please send the money from your own account Only</li>
                  <li>Put transaction ID in the description field of the bank</li>
                  <li>Please note, If you do not follow above conditions, we will reject your transaction and send you back your money.</li>
                </ul>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 mt-4 mb-4">
                <input
                  type="checkbox"
                  id="withdrawal-terms"
                  checked={isTermsAccepted}
                  onChange={(e) => setIsTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[#1D8751] cursor-pointer"
                />
                <label
                  htmlFor="withdrawal-terms"
                  className="text-sm text-[#788099] dark:text-[#A3A3A3] cursor-pointer"
                >
                  I confirm that I have read and agree to the withdrawal conditions above and understand that failing to comply may result in transaction rejection.
                </label>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full bg-error hover:bg-[#d32f2f] text-white font-semibold text-[14px] rounded-[18px] py-3 mt-4 flex items-center justify-center transition-all duration-200 transform hover:scale-[1.02] disabled:bg-[#4B5563] disabled:hover:bg-[#4B5563] disabled:text-white/70 disabled:cursor-not-allowed disabled:transform-none"
                type="submit"
                disabled={loading || Boolean(effectiveFeesError) || !isTermsAccepted || exceedsReferralBalance}
              >
                {loading && (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                )}
                {loading ? "Processing..." : "Withdraw"}
              </Button>
              {error && (
                <div className="text-red-500 text-xs mt-2 text-center">
                  {(() => {
                    // Parse and format the error message for better readability
                    if (typeof error === "string") {
                      try {
                        const parsed = JSON.parse(error);
                        if (parsed.error) {
                          let message = parsed.error;
                          if (parsed.balance !== undefined) {
                            const balance = parseFloat(parsed.balance) || 0;
                            message += ` Your current balance is $${balance.toFixed(2)}.`;
                          }
                          if (parsed.requested !== undefined) {
                            const requested = parseFloat(parsed.requested) || 0;
                            message += ` You requested $${requested.toFixed(2)}.`;
                          }
                          return message;
                        }
                        return error;
                      } catch {
                        return error;
                      }
                    }
                    if (typeof error === "object" && error !== null) {
                      if (error.error) {
                        let message = error.error;
                        if (error.balance !== undefined) {
                          const balance = parseFloat(error.balance) || 0;
                          message += ` Your current balance is $${balance.toFixed(2)}.`;
                        }
                        if (error.requested !== undefined) {
                          const requested = parseFloat(error.requested) || 0;
                          message += ` You requested $${requested.toFixed(2)}.`;
                        }
                        return message;
                      }
                      return error.message || JSON.stringify(error);
                    }
                    return String(error);
                  })()}
                </div>
              )}
            </div>
          </div>
        </form>

      <PaymentMethodsModal
        open={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
        onAdd={() => {
          dispatch(fetchUserPaymentDetails() as any)
          setShowAddPaymentModal(false)
        }}
      />
    </>
  )
}

export default Cash