"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch } from "../../../../store";
import { fetchUserPaymentDetails } from "../../../exchange/slices/paymentSlice";
import { createForexExchangeThunk } from "../../slices/forexSlice";
import { showToast } from "../../../../lib/utils/toast";

// FXP Withdrawal: User sends FXP from forex account, receives USD in bank
// Exchange rate: FXP to USD = 1 FXP : 1.1 USD (inverse of deposit rate 1.06)
const FXP_TO_USD_RATE = 1.1;

export default function ForexWithdrawal() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  
  // Redux state
  const { loading: forexLoading, error: forexError } = useSelector((state: any) => state.forex);
  const { userPaymentDetails, loading: adminLoading } = useSelector((state: any) => state.payment);

  // Form state - Fixed currencies for FXP withdrawal
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [userNotes, setUserNotes] = useState("");
  const [selectedUserPaymentId, setSelectedUserPaymentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user payment details
  useEffect(() => {
    dispatch(fetchUserPaymentDetails() as any);
  }, [dispatch]);

  // Calculate toAmount (USD) from fromAmount (FXP)
  useEffect(() => {
    if (fromAmount) {
      const calculated = (Number(fromAmount) * FXP_TO_USD_RATE).toFixed(2);
      setToAmount(calculated);
    } else {
      setToAmount("");
    }
  }, [fromAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromAmount || Number(fromAmount) <= 0) {
      showToast.error("Please enter a valid FXP amount");
      return;
    }

    if (!selectedUserPaymentId) {
      showToast.error("Please select your bank account where you want to receive USD");
      return;
    }

    setIsSubmitting(true);

    try {
    const payload = {
      transaction_type: "withdrawal" as const,
      user_payment_detail_id: selectedUserPaymentId,
        from_currency: "FXP",
        from_amount: Number(fromAmount).toFixed(2),
        to_currency: "USD",
      to_amount: toAmount,
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

  // Filter user payment details (non-crypto accounts, approved only)
  const filteredUserPayments = (userPaymentDetails || []).filter(
    (detail: any) =>
      detail.payment_method_name?.toLowerCase() !== 'crypto' &&
      detail.status?.toLowerCase() === 'approved'
  );

  return (
    <div className="w-full flex flex-col dark:bg-[#18181D]">
      <form onSubmit={handleSubmit}>
        <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
          <span className="text-[#7e7e8f] dark:text-[#788099]">1-</span> FXP Withdrawal Info
        </h2>

        <div className="w-full mb-4">
          <div className="border border-[#D1D2D4FF] dark:border-[#35353E] rounded-2xl p-5 bg-white dark:bg-[#1D1D23]">
            {/* Exchange Info Badge */}
            <div className="mb-4 p-3 bg-[#1D8751] bg-opacity-10 border border-[#1D8751] rounded-lg">
              <div className="flex items-center gap-2 text-[#1D8751]">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="#1D8751" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="12" stroke="#1D8751" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="1" fill="#1D8751"/>
                </svg>
                <span className="text-sm font-medium">
                  Exchange Rate: 1 FXP = {FXP_TO_USD_RATE} USD
                </span>
              </div>
            </div>

            {/* Amount Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                  You Send (FXP)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={fromAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      setFromAmount(value);
                    }
                  }}
                  placeholder="1000.00"
                  className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#D1D2D4] rounded-2xl px-4 py-2 text-lg focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E]"
                />
              </div>

              <div>
                <label className="block text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                  You Receive (USD)
                </label>
                <div className="flex items-center bg-white dark:bg-[#1D1D23] border border-[#A2A4A9FF] dark:border-[#35353E] rounded-2xl px-4 py-2">
                  <span className="text-[#1D8751] text-lg font-bold">
                    {toAmount || "0.00"} USD
                  </span>
                </div>
              </div>
            </div>

            {/* Select Your Bank Account to Receive USD */}
            <div className="mb-4">
              <label className="block text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                Your Bank Account (Where you'll receive USD)
              </label>
              {adminLoading ? (
                <div className="text-[#788099] text-sm">Loading payment methods...</div>
              ) : filteredUserPayments.length > 0 ? (
                <select
                  value={selectedUserPaymentId || ""}
                  onChange={(e) => setSelectedUserPaymentId(e.target.value)}
                  className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#D1D2D4] rounded-2xl px-4 py-2 text-lg focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E]"
                >
                  <option value="" className="bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff]">Select your bank account</option>
                  {filteredUserPayments.map((detail: any) => (
                    <option key={detail.id} value={detail.user_payment_detail_id} className="bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff]">
                      {detail.payment_provider_name} - {detail.payment_method_name}
                      {detail.account_number && ` (**** ${detail.account_number.slice(-4)})`}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 bg-[#F79330] bg-opacity-10 border border-[#F79330] rounded-lg">
                  <p className="text-[#F79330] text-sm">
                    No bank accounts found. Please add your bank account first in Settings → Payment Methods.
                  </p>
                </div>
              )}
            </div>

            {/* Additional Notes */}
            <div className="mb-4">
              <label className="block text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
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
            disabled={isSubmitting || !fromAmount || !selectedUserPaymentId}
            className={`w-full text-white text-base font-medium py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors ${
              isSubmitting || !fromAmount || !selectedUserPaymentId
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

