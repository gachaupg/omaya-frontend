"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../../../store";
import { fetchAdminPaymentDetails } from "../../../../exchange/slices/paymentSlice";
import { createForexExchangeThunk } from "../../../slices/forexSlice";
import { showToast } from "../../../../../lib/utils/toast";

// Forex Deposit: We send forex to user, they send us USD
// We need: admin bank account (where they send USD), user forex account (where we send forex)
export default function ForexDeposit() {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const { loading: forexLoading, error: forexError } = useSelector((state: any) => state.forex);
  const { adminPaymentDetails, loading: adminLoading } = useSelector((state: any) => state.payment);

  // Form state
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [fromAmount, setFromAmount] = useState("");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [toAmount, setToAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState("0.95");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [userNotes, setUserNotes] = useState("");
  const [userForexAccount, setUserForexAccount] = useState("");
  const [selectedAdminBankId, setSelectedAdminBankId] = useState<string | null>(null);

  // Load admin payment details - try cache first
  useEffect(() => {
    dispatch(fetchAdminPaymentDetails(false)); // false = use cache if available
  }, [dispatch]);

  // Update exchange rate when currencies change (placeholder - adjust as needed)
  useEffect(() => {
    // You can implement rate fetching here or use a fixed rate
    setExchangeRate("0.95");
  }, [fromCurrency, toCurrency]);

  // Calculate toAmount
  useEffect(() => {
    if (fromAmount && exchangeRate) {
      const calculated = (Number(fromAmount) * Number(exchangeRate)).toFixed(2);
      setToAmount(calculated);
    } else {
      setToAmount("");
    }
  }, [fromAmount, exchangeRate]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromAmount || Number(fromAmount) <= 0) {
      showToast.error("Please enter a valid amount");
      return;
    }

    if (!userForexAccount || userForexAccount.trim() === "") {
      showToast.error("Please enter your forex account number");
      return;
    }

    if (!selectedAdminBankId) {
      showToast.error("Please select an admin bank account");
      return;
    }

    const payload = {
      transaction_type: "deposit" as const,
      from_currency: fromCurrency,
      from_amount: fromAmount,
      to_currency: toCurrency,
      to_amount: toAmount,
      exchange_rate: exchangeRate,
      additional_info: additionalInfo,
      user_notes: userNotes,
      user_forex_account: userForexAccount,
      admin_payment_detail_id: selectedAdminBankId,
    };

    try {
      const result = await dispatch(createForexExchangeThunk(payload)).unwrap();
      showToast.success("Forex deposit created successfully!");
      // You can navigate or reset form here
    } catch (error: any) {
      showToast.error(error || "Failed to create forex deposit");
    }
  };

  // Filter admin payment details for bank/mobile accounts (where user sends USD)
  const adminBankAccounts = (adminPaymentDetails || []).filter(
    (detail: any) =>
      detail.payment_type?.toLowerCase() === 'bank' ||
      detail.payment_type?.toLowerCase() === 'mobile' ||
      detail.payment_type?.toLowerCase() === 'marchant'
  );

  return (
    <div className="w-full flex flex-col dark:bg-[#18181D]">
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
                  From
                </label>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
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

              <div>
                <label className="block text-sm text-[#7e7e8f] dark:text-[#A2A4A9] mb-1.5 font-medium">
                  To
                </label>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
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
            </div>

            {/* Amount Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-[#7e7e8f] dark:text-[#A2A4A9] mb-1.5 font-medium">
                  From
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
                  To
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
                placeholder="0.95"
                className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#D1D2D4] rounded-xl px-3 py-2.5 text-base focus:outline-none border border-[#D1D2D4FF] dark:border-[#35353E]"
              />
              <p className="text-xs text-[#788099] mt-1.5">
                Rate: 1 {fromCurrency} = {exchangeRate} {toCurrency}
              </p>
            </div>

            {/* User Forex Account */}
            <div className="mb-4">
              <label className="block text-sm text-[#7e7e8f] dark:text-[#A2A4A9] mb-1.5 font-medium">
                Your Forex Account Number (Where We Send {toCurrency})
              </label>
              <input
                type="text"
                value={userForexAccount}
                onChange={(e) => setUserForexAccount(e.target.value)}
                placeholder="Enter your forex account number"
                className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#D1D2D4] rounded-xl px-3 py-2.5 text-base focus:outline-none border border-[#D1D2D4FF] dark:border-[#35353E]"
              />
            </div>

            {/* Select Admin Bank Account (where user sends USD) */}
            <div className="mb-4">
              <label className="block text-sm text-[#7e7e8f] dark:text-[#A2A4A9] mb-1.5 font-medium">
                Send {fromCurrency} To (Admin Bank Account)
              </label>
              {adminLoading ? (
                <div className="text-[#788099] text-sm">Loading bank accounts...</div>
              ) : adminBankAccounts.length > 0 ? (
                <select
                  value={selectedAdminBankId || ""}
                  onChange={(e) => setSelectedAdminBankId(e.target.value)}
                  className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#D1D2D4] rounded-xl px-3 py-2.5 text-base focus:outline-none border border-[#D1D2D4FF] dark:border-[#35353E]"
                >
                  <option value="" className="bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff]">Select admin bank account</option>
                  {adminBankAccounts.map((account: any) => (
                    <option key={account.id} value={account.admin_payment_detail_id} className="bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff]">
                      {account.payment_method_type} - {account.provider_name}
                      {account.account_number && ` (${account.account_number})`}
                      {account.mobile_number && ` (${account.mobile_number})`}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-[#788099] text-sm">No admin bank accounts available</div>
              )}
            </div>

            {/* Show selected admin bank account details */}
            {selectedAdminBankId && adminBankAccounts.length > 0 && (
              <div className="mb-4">
                <div className="border border-[#1D8751] dark:border-[#1D8751] rounded-xl p-3">
                  {adminBankAccounts
                    .filter((acc: any) => acc.admin_payment_detail_id === selectedAdminBankId)
                    .map((account: any) => (
                      <div key={account.id}>
                        <div className="text-[#35353e] dark:text-[#D1D2D4] font-medium mb-2 text-sm">
                          {account.payment_method_type} - {account.provider_name}
                        </div>
                        {account.account_number && (
                          <div className="text-[#788099] text-xs mb-1">
                            Account Number: {account.account_number}
                          </div>
                        )}
                        {account.mobile_number && (
                          <div className="text-[#788099] text-xs mb-1">
                            Mobile Number: {account.mobile_number}
                          </div>
                        )}
                        {account.account_name && (
                          <div className="text-[#788099] text-xs mb-1">
                            Account Name: {account.account_name}
                          </div>
                        )}
                        {account.how_to_send && (
                          <div className="text-[#788099] text-xs">
                            How to Send: {account.how_to_send}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="mb-4">
              <label className="block text-sm text-[#7e7e8f] dark:text-[#A2A4A9] mb-1.5 font-medium">
                Additional Information (Optional)
              </label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Wire transfer from Chase Bank"
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
                placeholder="Please send EUR to my forex account"
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
              <span>Submit Forex Deposit</span>
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
                  Send {fromCurrency} from your own account only
                </span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#1D8751] inline-block mr-2"></span>
                <span className="text-[#788099] dark:text-[#A2A4A9] text-xs">
                  Put transaction ID in the description field
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

