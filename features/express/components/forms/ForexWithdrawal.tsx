"use client";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch } from "../../../../store";
import { createForexExchangeThunk } from "../../slices/forexSlice";
import { showToast } from "../../../../lib/utils/toast";

// FXP Withdrawal: User sends FXP from forex account, receives USD in bank
// Exchange rate: FXP to USD = 1 FXP : 1.1 USD (inverse of deposit rate 1.06)
const FXP_TO_USD_RATE = 1.1;

interface ForexWithdrawalProps {
  payAmount: number;
  getAmount: number;
  selectedPaymentDetails: any[];
}

export default function ForexWithdrawal({ 
  payAmount, 
  getAmount, 
  selectedPaymentDetails 
}: ForexWithdrawalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  
  // Redux state
  const { loading: forexLoading, error: forexError } = useSelector((state: any) => state.forex);

  // Form state - Only additional info needed
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [userNotes, setUserNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!payAmount || payAmount <= 0) {
      showToast.error("Please enter a valid FXP amount");
      return;
    }

    if (!selectedPaymentDetails || selectedPaymentDetails.length === 0) {
      showToast.error("Please select your bank account where you want to receive USD");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        transaction_type: "withdrawal" as const,
        user_payment_detail_id: selectedPaymentDetails[0].user_payment_detail_id || selectedPaymentDetails[0].id,
        from_currency: "FXP",
        from_amount: payAmount.toFixed(2),
        to_currency: "USD",
        to_amount: getAmount.toFixed(2),
        exchange_rate: (1 / FXP_TO_USD_RATE).toFixed(4), // Inverse rate for consistency
        additional_info: additionalInfo.trim() || "Bank transfer from my EUR forex account",
        user_notes: userNotes.trim() || "Please send USD to my bank account",
      };

      console.log("🚀 Forex Withdrawal Payload:", payload);

      const result = await dispatch(createForexExchangeThunk(payload)).unwrap();
      
      // Store exchange data in localStorage
      localStorage.setItem('currentForexExchange', JSON.stringify(result));
      
      showToast.success("Forex withdrawal created successfully!");
      
      // Navigate to forex status page
      router.push(`/dashboard/express-exchange/forex-status?transactionId=${result.forex_transaction_id}`);
    } catch (error: any) {
      console.error("Failed to create forex withdrawal:", error);
      showToast.error(error || "Failed to create forex withdrawal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col dark:bg-[#18181D] mt-0 pl-4 mr-40" style={{ width: 'calc(100% - 12rem)' }}>
      <form onSubmit={handleSubmit}>
        <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
          <span className="text-[#7e7e8f] dark:text-[#788099]">2-</span> Confirm FXP Withdrawal
        </h2>

        <div className="w-full mb-4">
          <div className="border border-[#D1D2D4FF] dark:border-[#35353E] rounded-2xl p-5 bg-white dark:bg-[#1D1D23]">
            {/* Company FXPRIMUS Address - Where to send FXP */}
            <div className="mb-4 p-4 border-2 border-[#F79330] rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="#F79330" strokeWidth="2" />
                  <line x1="12" y1="8" x2="12" y2="12" stroke="#F79330" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="16" r="1" fill="#F79330" />
                </svg>
                <span className="text-base font-bold text-[#F79330]">Send FXP to FXPRIMUS Company Account</span>
              </div>
              <div className="space-y-2 bg-white dark:bg-[#23232B] p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#7e7e8f] dark:text-[#788099]">Forex Broker:</span>
                  <span className="text-base font-bold text-[#35353e] dark:text-white">FXPRIMUS</span>
                </div>
                <div className="border-t border-[#35353E] my-2"></div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#7e7e8f] dark:text-[#788099]">Account Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-[#35353e] dark:text-white">EUR1234567890</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("EUR1234567890");
                        showToast.success("Account number copied!");
                      }}
                      className="text-[#F79330] hover:text-[#d67d1f] transition-colors p-1 rounded"
                      title="Copy Account Number"
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                        <rect x="3" y="3" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="border-t border-[#35353E] my-2"></div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#7e7e8f] dark:text-[#788099]">Account Name:</span>
                  <span className="text-base font-semibold text-[#35353e] dark:text-white">OMAYA EXCHANGE LTD</span>
                </div>
              </div>
              <div className="mt-3 p-2 border border-[#F79330] rounded-lg">
                <p className="text-xs text-[#35353e] dark:text-[#D1D2D4] font-medium">
                  ⚠️ Important: Please send {payAmount.toFixed(2)} FXP from your forex account to the above FXPRIMUS account before submitting this form.
                </p>
              </div>
            </div>

            {/* Summary Info Badge */}
            <div className="mb-4 p-4 border-2 border-[#1D8751] rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#7e7e8f] dark:text-[#788099]">You Send:</span>
                  <span className="text-base font-bold text-[#1D8751]">{payAmount.toFixed(2)} FXP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#7e7e8f] dark:text-[#788099]">You Receive:</span>
                  <span className="text-base font-bold text-[#1D8751]">{getAmount.toFixed(2)} USD</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#1D8751] border-opacity-30">
                  <span className="text-sm font-medium text-[#7e7e8f] dark:text-[#788099]">Exchange Rate:</span>
                  <span className="text-sm font-semibold text-[#1D8751]">1 FXP = {FXP_TO_USD_RATE} USD</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#7e7e8f] dark:text-[#788099]">Bank Account:</span>
                  <span className="text-sm font-semibold text-[#1D8751]">
                    {selectedPaymentDetails[0]?.payment_provider_name || selectedPaymentDetails[0]?.provider_name} - 
                    {selectedPaymentDetails[0]?.account_number && ` ****${selectedPaymentDetails[0].account_number.slice(-4)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="mb-4">
              <label className="block text-sm text-[#7e7e8f] dark:text-[#A2A4A9] mb-1.5 font-medium">
                Additional Notes (Optional)
              </label>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="Add any special instructions or notes..."
                rows={3}
                className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#D1D2D4] rounded-2xl px-4 py-2 text-base focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="w-full mt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white text-base font-medium py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors ${
              isSubmitting
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-[#1D8751] hover:bg-[#166b3e]"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating Withdrawal...</span>
              </div>
            ) : (
              <span>Submit FXP Withdrawal</span>
            )}
          </button>
          {forexError && (
            <div className="text-red-500 text-sm mt-2 text-center">
              {typeof forexError === "string" ? forexError : JSON.stringify(forexError)}
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="w-full mt-4">
          <div className="border border-[#1D8751] dark:border-[#1D8751] rounded-2xl p-4">
            <div className="flex items-center mb-2">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="mr-2">
                <circle cx="12" cy="12" r="10" stroke="#1D8751" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="12" stroke="#1D8751" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1" fill="#1D8751" />
              </svg>
              <span className="text-base font-semibold text-[#7e7e8f] dark:text-[#788099]">
                Important Notes
              </span>
            </div>
            <ul className="list-none space-y-2">
              <li className="flex items-start">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-[#1D8751] inline-block mr-2"></span>
                <span className="text-[#35353e] dark:text-[#788099] text-sm">
                  USD will be sent to your selected bank account
                </span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-[#1D8751] inline-block mr-2"></span>
                <span className="text-[#35353e] dark:text-[#788099] text-sm">
                  Fixed exchange rate: 1 FXP = {FXP_TO_USD_RATE} USD
                </span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-[#1D8751] inline-block mr-2"></span>
                <span className="text-[#35353e] dark:text-[#788099] text-sm">
                  Processing time: 1-3 business days
                </span>
              </li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  );
}
