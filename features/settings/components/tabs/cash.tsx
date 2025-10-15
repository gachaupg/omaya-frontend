import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import Button from "@/components/ui/Button"
import { createCashWithdrawal, clearSuccess, clearError } from '../../slices/cashWithdrawalSlice'
import { fetchUserPaymentDetails } from '@/features/p2p/slices/paymentMethodsSlice'
import { AppDispatch } from '@/store/rootReducer'
import UserPaymentSelector, { UserPaymentDetail } from '@/features/p2p/components/ui/p2pdashboard/sections/UserPaymentSelector'

const Cash = () => {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { loading, error, success, message } = useSelector((state: any) => state.cashWithdrawal)
  const { userPaymentDetails, userDetailsLoading } = useSelector((state: any) => state.paymentMethods)
  
  const [amount, setAmount] = useState("102")
  const [netAmount, setNetAmount] = useState("100")
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<UserPaymentDetail[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{
    amount?: string;
    paymentMethod?: string;
  }>({})

  const commission = 0 // 0%
  const networkFee = 0
  const totalFees = commission + networkFee
  const totalWithFees = Number(amount || 0) + totalFees
  
  // Calculate net amount dynamically based on what user types
  const calculateNetAmount = () => {
    const amountValue = Number(amount || 0)
    return (amountValue - totalFees).toString()
  }

  // Load user payment details on component mount
  useEffect(() => {
    dispatch(fetchUserPaymentDetails() as any)
  }, [dispatch])

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

    if (selectedPaymentDetails.length === 0) {
      newErrors.paymentMethod = "Select at least one payment method"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true) // Set submitting flag to true

    const withdrawalData = {
      requested_amount: amount,
      withdrawal_method: "cash",
      user_payment_detail_id: selectedPaymentDetails[0]?.id
    }

    dispatch(createCashWithdrawal(withdrawalData))
  }


  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("Cash withdrawal error:", error)
    }
  }, [error])

  // Clear payment methods success state immediately on component mount
  useEffect(() => {
    dispatch({ type: 'paymentMethods/clearPostStatus' })
  }, [dispatch])

 

  return (
    <div className="min-h-screen text-white flex flex-col items-center">


      <div className="w-full max-w-2xl rounded-2xl p-6 shadow-lg">
        <form onSubmit={handleSubmit}>
          {/* 1- Transaction Info */}
          <div className="text-md font-bold mb-2">1- Transaction Info</div>

          <div className="mb-3 p-3 border border-[#E8EFF5] dark:border-[#35353F] bg-white dark:bg-[#1D1D23] rounded-lg">
            <div className="flex flex-col md:flex-row gap-4 mb-2">
              <div className="flex-1">
                <label className="block text-sm text-[#788099] dark:text-[#A3A3A3] mb-1">Amount</label>
                <input
                  className={`w-full bg-white dark:bg-[#18181B] border border-[#E8EFF5] dark:border-[#35353F] rounded-[18px] px-1 py-1 text-[#788099] dark:text-white text-lg focus:outline-none ${
                    errors.amount ? "border-red-500" : ""
                  }`}
                  placeholder="102"
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
              </div>
              <div className="flex-1">
                <label className="block text-sm text-[#788099] dark:text-[#A3A3A3] mb-1">
                  I want to Recieve Net
                </label>
                <div className="flex items-center bg-white dark:bg-[#18181B] border border-[#E8EFF5] dark:border-[#35353F] rounded-[18px] px-1 py-1">
                  <span className="text-[#1D8751] text-2xl font-bold mr-2">
                    $ {calculateNetAmount()}
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
            
            <div className="flex items-center text- text-sm mb-2 mt-1">
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
                    ${totalWithFees}
                  </span>
                </button>
              </div>
              <div className="flex-1 border rounded-lg border-[#E8EFF5] dark:border-[#35353F] p-3 flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#051015] dark:text-[#A3A3A3]">Commission:</span>
                  <span className="text-[#1D8751]">0%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#051015] dark:text-[#A3A3A3]">Network Fee:</span>
                  <span className="text-[#1D8751]">$0</span>
                </div>

                {/* Divider line between Network Fee and Total Fees */}
                <div className="border-t border-[#E8EFF5] dark:border-[#35353F] my-2"></div>

                <div className="flex justify-between font-bold">
                  <span className="text-[#051015] dark:text-[#A3A3A3]">Total Fees</span>
                  <span className="text-[#EF4444]">$0</span>
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
          </div>

          {/* 2- Your Bank / Mobile Payment Details */}
          <div>
            <div className="text-md font-bold mb-2">
              2- Your Bank / Mobile Payment Details
            </div>
            <div className="mb-2 border border-[#E8EFF5] dark:border-[#35353F] text_highbg-dark bg-[white] dark:bg-[#1D1D23] p-3 rounded-[18px]">
              
              {/* User Payment Selector - Same as Adds.tsx */}
              <UserPaymentSelector
                userPaymentDetails={(userPaymentDetails || []).filter(
                  (detail: UserPaymentDetail) => detail.payment_method_name?.toLowerCase() !== 'crypto'
                )}
                onSelect={handleSelectPaymentDetail}
                onRemove={handleRemovePaymentDetail}
                selectedDetails={selectedPaymentDetails}
              />
              
              {errors.paymentMethod && (
                <div className="text-red-500 text-xs mt-2">
                  {errors.paymentMethod}
                </div>
              )}

              {/* Transfer Details */}
              <div className="bg-white dark:bg-[#18181B] border border-[#1D8751] rounded-xl p-4 mb-4">
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
                <ul className="list-disc pl-6 text-[#051015] dark:text-[#A3A3A3] text-sm space-y-1">
                  <li className="dark:text-[#1D8751]">
                    Please send the money from your own account Only
                  </li>
                  <li>
                    Put transaction ID in the description field of the bank
                  </li>
                  <li>
                    Please note, If you do not follow above conditions, we
                    will reject your transaction and send you back your money.
                  </li>
                </ul>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full bg-[#EF4444] hover:bg-[#d32f2f] text-white font-semibold text-[14px] rounded-[18px] py-3 mt-4 flex items-center justify-center transition-all duration-200 transform hover:scale-[1.02]"
                type="submit"
                disabled={loading}
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
                  {typeof error === "string" ? error : JSON.stringify(error)}
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Cash