"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../../store";
import { fetchAdminPaymentDetails, fetchUserPaymentDetails } from "../../../exchange/slices/paymentSlice";
import { createForexTransaction, resetForexState } from "../../slices/forexSlice";
import { showToast } from "../../../../lib/utils/toast";
import { useForexRates } from "../../hooks/useForexRates";
import ForexSuccessModal from "../ForexSuccessModal";

// Forex Withdrawal: User sends forex to us, we send them USD
// We need: user payment detail (their bank), admin forex account (where they send forex)
export default function ForexWithdrawal() {
  const dispatch = useDispatch<AppDispatch>();
  const { getRate } = useForexRates();
  
  // Redux state
  const { loading: forexLoading, error: forexError, success: forexSuccess } = useSelector((state: any) => state.forex);
  const { adminPaymentDetails, userPaymentDetails, loading: adminLoading } = useSelector((state: any) => state.payment);

  // Form state
  const [fromCurrency, setFromCurrency] = useState("EUR");
  const [fromAmount, setFromAmount] = useState("");
  const [toCurrency, setToCurrency] = useState("USD");
  const [toAmount, setToAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState("1.10");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [userNotes, setUserNotes] = useState("");
  const [selectedUserPaymentId, setSelectedUserPaymentId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load payment details - try cache first
  useEffect(() => {
    dispatch(fetchAdminPaymentDetails(false)); // false = use cache if available
    dispatch(fetchUserPaymentDetails() as any);
  }, [dispatch]);

  // Update exchange rate when currencies change
  useEffect(() => {
    const rate = getRate(fromCurrency, toCurrency);
    setExchangeRate(rate.toFixed(4));
  }, [fromCurrency, toCurrency, getRate]);

  // Calculate toAmount
  useEffect(() => {
    if (fromAmount && exchangeRate) {
      const calculated = (Number(fromAmount) * Number(exchangeRate)).toFixed(2);
      setToAmount(calculated);
    } else {
      setToAmount("");
    }
  }, [fromAmount, exchangeRate]);

  // Handle success
  useEffect(() => {
    if (forexSuccess) {
      showToast.success("Forex withdrawal submitted successfully!");
      setShowSuccess(true);
      // Reset form
      setFromAmount("");
      setToAmount("");
      setAdditionalInfo("");
      setUserNotes("");
      setSelectedUserPaymentId(null);
    }
  }, [forexSuccess]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setShowSuccess(false);
      dispatch(resetForexState());
    };
  }, [dispatch]);

  const handleModalClose = () => {
    setShowSuccess(false);
    dispatch(resetForexState());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromAmount || Number(fromAmount) <= 0) {
      showToast.error("Please enter a valid amount");
      return;
    }

    if (!selectedUserPaymentId) {
      showToast.error("Please select your payment method");
      return;
    }

    const payload = {
      transaction_type: "withdrawal" as const,
      user_payment_detail_id: selectedUserPaymentId,
      from_currency: fromCurrency,
      from_amount: fromAmount,
      to_currency: toCurrency,
      to_amount: toAmount,
      exchange_rate: exchangeRate,
      additional_info: additionalInfo,
      user_notes: userNotes,
    };

    dispatch(createForexTransaction(payload));
  };

  // Filter user payment details (non-crypto accounts, approved only)
  const filteredUserPayments = (userPaymentDetails || []).filter(
    (detail: any) =>
      detail.payment_method_name?.toLowerCase() !== 'crypto' &&
      detail.status?.toLowerCase() === 'approved'
  );

  // Filter admin payment details for forex accounts (where user sends forex to us)
  const adminForexAccounts = (adminPaymentDetails || []).filter(
    (detail: any) => detail.payment_type?.toLowerCase() === 'forex'
  );


  return (
    <div className="w-full flex flex-col dark:bg-[#18181D]">
      {/* Success Modal */}
      <ForexSuccessModal
        isOpen={showSuccess}
        onClose={handleModalClose}
        transactionType="withdrawal"
        fromCurrency={fromCurrency}
        fromAmount={fromAmount}
        toCurrency={toCurrency}
        toAmount={toAmount}
        exchangeRate={exchangeRate}
      />

      <form onSubmit={handleSubmit}>
        <h2 className="text-lg font-semibold mb-3 text-[#788099] inline-flex items-center gap-2">
          <span className="text-[#7e7e8f] dark:text-[#788099]">1-</span> Forex Exchange Info
        </h2>

        <div className="w-full max-w-4xl mx-auto mb-4">
          <div className="border border-[#D1D2D4FF] dark:border-[#35353E] rounded-2xl p-4 bg-white dark:bg-[#1D1D23]">
            {/* Currency Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-[#7e7e8f] dark:text-[#A2A4A9] mb-1.5 font-medium">
                  From Currency (You Send)
                </label>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#D1D2D4] rounded-xl px-3 py-2.5 text-base focus:outline-none border border-[#D1D2D4FF] dark:border-[#35353E]"
                >
                  <option value="EUR" className="bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff]">EUR</option>
                  <option value="USD" className="bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff]">USD</option>
                  <option value="GBP" className="bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff]">GBP</option>
                  <option value="JPY" className="bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff]">JPY</option>
                  <option value="AUD" className="bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff]">AUD</option>
                  <option value="CAD" className="bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff]">CAD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#7e7e8f] dark:text-[#A2A4A9] mb-1.5 font-medium">
                  To Currency (You Receive)
                </label>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#D1D2D4] rounded-xl px-3 py-2.5 text-base focus:outline-none border border-[#D1D2D4FF] dark:border-[#35353E]"
                >
                  <option value="USD" className="bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff]">USD</option>
                  <option value="EUR" className="bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff]">EUR</option>
                  <option value="GBP" className="bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff]">GBP</option>
                  <option value="JPY" className="bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff]">JPY</option>
                  <option value="AUD" className="bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff]">AUD</option>
                  <option value="CAD" className="bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff]">CAD</option>
                </select>
              </div>
            </div>

            {/* Amount Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-[#7e7e8f] dark:text-[#A2A4A9] mb-1.5 font-medium">
                  You Send
                </label>
                <input
                  type="text"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="1000.00"
                  className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#D1D2D4] rounded-xl px-3 py-2.5 text-base focus:outline-none border border-[#D1D2D4FF] dark:border-[#35353E]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#7e7e8f] dark:text-[#A2A4A9] mb-1.5 font-medium">
                  You Receive
                </label>
                <div className="flex items-center bg-white dark:bg-[#1D1D23] border border-[#D1D2D4FF] dark:border-[#35353E] rounded-xl px-3 py-2.5">
                  <span className="text-[#1D8751] text-lg font-bold">
                    {toAmount || "0.00"} {toCurrency}
                  </span>
                </div>
              </div>
            </div>

            {/* Exchange Rate */}
            <div className="mb-4">
              <label className="block text-sm text-[#7e7e8f] dark:text-[#A2A4A9] mb-1.5 font-medium">
                Exchange Rate
              </label>
              <input
                type="text"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder="1.10"
                className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#D1D2D4] rounded-xl px-3 py-2.5 text-base focus:outline-none border border-[#D1D2D4FF] dark:border-[#35353E]"
              />
              <p className="text-xs text-[#788099] mt-1.5">
                Rate: 1 {fromCurrency} = {exchangeRate} {toCurrency}
              </p>
            </div>

            {/* Select Your Payment Method */}
            <div className="mb-4">
              <label className="block text-sm text-[#7e7e8f] dark:text-[#A2A4A9] mb-1.5 font-medium">
                Select Your Payment Method (Your Bank Account)
              </label>
              {adminLoading ? (
                <div className="text-[#788099] text-sm">Loading payment methods...</div>
              ) : filteredUserPayments.length > 0 ? (
                <select
                  value={selectedUserPaymentId || ""}
                  onChange={(e) => setSelectedUserPaymentId(e.target.value)}
                  className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#D1D2D4] rounded-xl px-3 py-2.5 text-base focus:outline-none border border-[#D1D2D4FF] dark:border-[#35353E]"
                >
                  <option value="" className="bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff]">Select your bank account</option>
                  {filteredUserPayments.map((detail: any) => (
                    <option key={detail.id} value={detail.user_payment_detail_id} className="bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff]">
                      {detail.payment_method_name} - {detail.payment_provider_name}
                      {detail.account_number && ` (${detail.account_number})`}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-[#788099] text-sm">No payment methods available. Please add one first.</div>
              )}
            </div>

            {/* Show Admin Forex Accounts (where user sends forex) */}
            <div className="mb-4">
              <label className="block text-sm text-[#7e7e8f] dark:text-[#A2A4A9] mb-1.5 font-medium">
                Send Forex To (Admin Account)
              </label>
              {adminLoading ? (
                <div className="text-[#788099] text-sm">Loading admin accounts...</div>
              ) : adminForexAccounts.length > 0 ? (
                <div className="border border-[#1D8751] dark:border-[#1D8751] rounded-xl p-3">
                  {adminForexAccounts.map((account: any, index: number) => (
                    <div key={account.id} className={index > 0 ? "mt-3 pt-3 border-t border-[#D1D2D4FF] dark:border-[#35353E]" : ""}>
                      <div className="text-[#35353e] dark:text-[#D1D2D4] font-medium mb-2 text-sm">
                        {account.payment_method_type} - {account.provider_name}
                      </div>
                      {account.account_number && (
                        <div className="text-[#788099] text-xs mb-1">
                          <span className="font-medium">Account:</span> {account.account_number}
                        </div>
                      )}
                      {account.account_name && (
                        <div className="text-[#788099] text-xs mb-1">
                          <span className="font-medium">Name:</span> {account.account_name}
                        </div>
                      )}
                      {account.wallet_address && (
                        <div className="text-[#788099] text-xs">
                          <span className="font-medium">Address:</span> {account.wallet_address}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[#F79330] text-sm">
                  No admin forex accounts configured. Please contact support.
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="mb-4">
              <label className="block text-sm text-[#7e7e8f] dark:text-[#A2A4A9] mb-1.5 font-medium">
                Additional Information (Optional)
              </label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Bank transfer from my EUR forex account"
                rows={3}
                className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#D1D2D4] rounded-xl px-3 py-2.5 text-sm focus:outline-none border border-[#D1D2D4FF] dark:border-[#35353E] resize-none"
              />
            </div>

            {/* User Notes */}
            <div className="mb-4">
              <label className="block text-sm text-[#7e7e8f] dark:text-[#A2A4A9] mb-1.5 font-medium">
                User Notes (Optional)
              </label>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="Please send USD to my bank account"
                rows={3}
                className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#D1D2D4] rounded-xl px-3 py-2.5 text-sm focus:outline-none border border-[#D1D2D4FF] dark:border-[#35353E] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="w-full max-w-4xl mx-auto mt-4">
          <button
            type="submit"
            disabled={forexLoading}
            className={`w-full text-white text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors ${
              forexLoading ? "bg-gray-500 cursor-not-allowed" : "bg-[#1D8751] hover:bg-[#166b3e]"
            }`}
          >
            {forexLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <span>Submit Forex Withdrawal</span>
            )}
          </button>
          {forexError && (
            <div className="text-red-500 text-xs mt-2 text-center">
              {typeof forexError === "string" ? forexError : JSON.stringify(forexError)}
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="w-full max-w-4xl mx-auto mt-4">
          <div className="border border-[#1D8751] dark:border-[#1D8751] rounded-xl p-3">
            <div className="flex items-center mb-2">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="mr-2">
                <circle cx="12" cy="12" r="10" stroke="#1D8751" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="12" stroke="#1D8751" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1" fill="#1D8751" />
              </svg>
              <span className="text-sm font-medium text-[#7e7e8f] dark:text-[#788099]">
                Important Notes
              </span>
            </div>
            <ul className="list-none space-y-1.5">
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#1D8751] inline-block mr-2"></span>
                <span className="text-[#788099] dark:text-[#A2A4A9] text-xs">
                  Send forex from your registered bank account only
                </span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#1D8751] inline-block mr-2"></span>
                <span className="text-[#788099] dark:text-[#A2A4A9] text-xs">
                  Exchange rate may vary at the time of processing
                </span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#1D8751] inline-block mr-2"></span>
                <span className="text-[#788099] dark:text-[#A2A4A9] text-xs">
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

