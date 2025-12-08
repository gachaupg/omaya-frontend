import React, { useState, useEffect, useRef, useCallback } from "react";
import Button from "@/components/ui/Button";
import { useDispatch, useSelector } from "react-redux";
import {
  createReferralWithdraw,
  clearSuccess,
  verifyReferralOtp,
  closeOtpModal,
  calculateReferralFees,
  setFeesFromCache,
  clearFees,
} from "@/features/settings/slices/referralWalletSlice";
import { AppDispatch } from "@/store/rootReducer";
import { validateWithdrawalForm } from "@/features/p2p/components/ui/p2pdashboard/sections/validation";
import { useRouter } from "next/navigation";
import Cash from "./cash";
import { useDebounce } from "@/hooks/useDebounce";
import { ReferralFeeCalculation } from "@/features/settings/types";

const Withdraw = () => {
  const [activeTab, setActiveTab] = useState<"usdt" | "cash">("usdt");
  const [walletAddress, setWalletAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [confirmAddress, setConfirmAddress] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<{
    amount?: string;
    walletAddress?: string;
    confirmAddress?: string;
  }>({});
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { loading, error, success, showOtpModal, withdrawalId, otpVerifying, otpError, fees, feesLoading, feesError } = useSelector(
    (state: any) => state.referralWallet
  );
  
  // Cache for fees by amount to avoid redundant API calls
  const feesCacheRef = useRef<Map<string, ReferralFeeCalculation>>(new Map());
  const lastCalculatedAmountRef = useRef<string>("");
  
  // Debounce amount to avoid too many API calls
  const debouncedAmount = useDebounce(amount, 500);


  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setWalletAddress(text);
    } catch (err) {
      // Optionally handle error (e.g., show a toast)
    }
  };

  const validate = () => {
    const validationErrors = validateWithdrawalForm(
      {
        amount,
        walletAddress,
        file: null,
        confirmPayment: true,
      },
      "BEP20"
    );
    const errorObj: {
      amount?: string;
      walletAddress?: string;
      confirmAddress?: string;
    } = {};

    validationErrors.forEach((err) => {
      if (err.field === "amount" || err.field === "walletAddress") {
        errorObj[err.field] = err.message;
      }
    });

    // Validate wallet address confirmation
    if (!confirmAddress) {
      errorObj.confirmAddress =
        "Please confirm that the wallet address is correct";
    }

    setErrors(errorObj);
    return validationErrors.length === 0 && confirmAddress;
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();

    // Handle regular USDT withdrawal
    if (!validate()) return;
    dispatch(
      createReferralWithdraw({
        requested_amount: amount,
        wallet_address: walletAddress,
        withdrawal_method: "crypto",
      })
    );
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawalId && otp) {
      dispatch(verifyReferralOtp({ withdrawal_id: withdrawalId, otp }));
    }
  };

  // Handle success
  useEffect(() => {
    if (success) {
      setShowSuccess(true);
      // Reset form
      setAmount("");
      setWalletAddress("");
      setConfirmAddress(false);
      setErrors({});
    }
  }, [success]);

  // Helper function to fetch fees with caching
  const fetchFeesWithCache = useCallback((amountValue: string) => {
    const amountKey = amountValue.trim();

    if (!amountKey) {
      lastCalculatedAmountRef.current = "";
      dispatch(clearFees());
      return;
    }

    const parsedAmount = Number(amountKey);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      lastCalculatedAmountRef.current = "";
      dispatch(clearFees());
      return;
    }
    
    // Check if we already have this amount in cache
    const cachedFees = feesCacheRef.current.get(amountKey);
    
    if (cachedFees) {
      // Use cached fees, update Redux state
      dispatch(setFeesFromCache(cachedFees));
      lastCalculatedAmountRef.current = amountKey;
      return;
    }
    
    // Only make API call if amount changed or not in cache
    if (lastCalculatedAmountRef.current !== amountKey) {
      lastCalculatedAmountRef.current = amountKey;
      dispatch(calculateReferralFees(amountKey)).then((result: any) => {
        // Cache the result if successful
        if (result.type === "referralWallet/calculateFees/fulfilled") {
          feesCacheRef.current.set(amountKey, result.payload);
        }
      });
    }
  }, [dispatch]);

  // Make API call first on mount if amount exists
  useEffect(() => {
    if (amount && Number(amount) > 0) {
      fetchFeesWithCache(amount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Fetch fees when amount changes - with caching
  useEffect(() => {
    fetchFeesWithCache(debouncedAmount);
  }, [debouncedAmount, fetchFeesWithCache]);

  const commission = fees?.commission_fee ? Number(fees.commission_fee) : 0;
  const networkFee = fees?.network_fee ? Number(fees.network_fee) : 0;
  const totalFees = fees?.total_fees ? Number(fees.total_fees) : 0;
  const netAmount = amount ? Number(amount) : 0;
  const totalWithFees = netAmount + totalFees;
  const normalizedFeesError =
    typeof feesError === "object" && feesError !== null
      ? feesError.error || feesError.message || Object.values(feesError)[0]
      : feesError;
  const disableSubmit = loading || Boolean(normalizedFeesError);

  return (
    <div className="min-h-screen text-white flex flex-col items-center">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-[var(--card-color)] border border-[#1D8751] rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl pointer-events-auto">
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
            <h3 className="text-xl font-bold text-white mb-2">
              Withdrawal Successful!
            </h3>
            <p className="text-[#A3A3A3] mb-6">
              Your withdrawal request has been submitted successfully.
            </p>
            <button
              onClick={() => {
                setShowSuccess(false);
                dispatch(clearSuccess());
                router.push("/dashboard/account");
              }}
              className="w-full bg-[#1D8751] text-white py-3 rounded-xl text-lg font-medium hover:bg-[#166b3e] transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen dark:text-white text-[#0D0D0D] flex flex-col items-center">
        {/* Withdraw Form Card */}
        <div className="w-full max-w-4xl lg:max-w-5xl rounded-2xl p-6 shadow-lg">
            {/* Tabs for USDT BEP20 / Cash */}
            <div className="flex gap-2 mb-6 border border-[#EF4444] rounded-lg p-1 w-fit flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab("usdt")}
              className={`px-6 py-2 rounded-lg font-semibold text-base ${
                activeTab === "usdt"
                  ? "bg-[#EF4444] text-white"
                  : "dark:bg-[var(--card-color)] bg-white text-[#A3A3A3]"
              }`}
            >
                USDT TRC20
              </button>
            <button
              type="button"
              onClick={() => setActiveTab("cash")}
              className={`px-6 py-2 rounded-lg font-semibold text-base ${
                activeTab === "cash"
                  ? "bg-[#EF4444] text-white"
                  : "dark:bg-[var(--card-color)] bg-white text-[#A3A3A3]"
              }`}
            >
                Cash
              </button>
            </div>

          {activeTab === "usdt" ? (
          <form onSubmit={handleWithdraw}>
            {/* 1- Transaction Info */}
            <div className="text-md font-bold mb-2">1- Transaction Info</div>

            <div className="mb-3 p-3 border border-[#E8EFF5] dark:border-[#35353F] bg-white dark:bg-[var(--card-color)] rounded-[18px]">
              <div className="flex  flex-col md:flex-row gap-4 mb-2">
                <div className="flex-1">
                  <label className="block text-sm text-[#788099] dark:text-[#A3A3A3] mb-1">Amount</label>
                  <input
                    className={`w-full  bg-white dark:bg-[var(--bg-color)] border border-[#E8EFF5] dark:border-[#35353F] rounded-[18px] px-1 py-1 text-[#788099] dark:text-white text-lg focus:outline-none ${
                      errors.amount ? "border-red-500" : ""
                    }`}
                    placeholder="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  {errors.amount && (
                    <div className="text-red-500 text-xs mt-1 ml-2">
                      {errors.amount}
                    </div>
                  )}
                {normalizedFeesError && (
                  <div className="text-red-500 text-xs mt-1 ml-2">
                    {normalizedFeesError}
                  </div>
                )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-[#788099] dark:text-[#A3A3A3] mb-1">
                    I want to Recieve Net
                  </label>
                  <div className="flex items-center bg-white dark:bg-[var(--bg-color)] border border-[#E8EFF5] dark:border-[#35353F] rounded-[18px] px-1 py-1">
                    <span className="text-[#1D8751] text-2xl font-bold mr-2">
                      $ {netAmount ? netAmount.toFixed(2) : "0.00"}
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
                  Price. We will fix the price when we receive the funds .
                </span>
              </div>
              {/* Amount & Fees */}
              <div className=" border border-[#E8EFF5] dark:border-[#35353F] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center mb-2">
                <div className="flex-1 flex flex-col ">
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
                    <span className="text:[#051015] dark:text-[#A3A3A3]">Total Fees</span>
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
            </div>

            {/* 2- Wallet Address */}
            <div>
              <div className="text-md font-bold mb-2">
                2- Your Wallet Address
              </div>
              <div className="mb-2 border border-[#E8EFF5] dark:border-[#35353F] text_highbg-dark bg-[white] dark:bg-[var(--card-color)] p-3 rounded-[18px]">
                <label className="block text-[#A3A3A3] mb-1">
                  Wallet/Account Address
                </label>
                <div className="flex gap-2 mb-2">
                  <div className="flex items-center dark:bg-[var(--bg-color)] border border-[#E8EFF5] dark:border-[#35353F] rounded-[18px] px-4 py-2 flex-1">
                    <span className="text-[#1D8751] mr-2">📋</span>
                    <input
                      className="flex-1 bg-transparent text:dark:text-white text-sm sm:text-base lg:text-lg focus:outline-none"
                      placeholder="Paste your crypto address"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                    />
                  </div>
                  <button
                    className="text-[#1D8751] px-4 py-2 rounded-[18px] bg-white dark:bg-[#35353F] text-sm border border:[#E8EFF5] dark:border-[#35353F] dark:hover:bg-[#2A2A32] transition-colors"
                    type="button"
                    onClick={handlePaste}
                  >
                    Paste
                  </button>
                </div>
                <div className="flex items-start text-[#F79330] text-xs mb-2">
                  <input
                    type="checkbox"
                    className="mr-2 mt-1 accent-[#F79330] flex-shrink-0"
                    checked={confirmAddress}
                    onChange={(e) => setConfirmAddress(e.target.checked)}
                  />
                  <span className="text-[#051015] dark:text-[#A3A3A3]">
                    I confirm that the above submitted address is correct
                    Address for the Cryptocurrency I chose, and not other Crypto
                    *
                  </span>
                </div>
                {errors.confirmAddress && (
                  <div className="text-red-500 text-xs mb-2">
                    {errors.confirmAddress}
                  </div>
                )}
                  <div className="flex items-center mb-2">
                    <span className="text-[#1D8751] dark:text-[#1D8751] text-xs font-medium">Transfer Details</span>{" "}
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="ml-1"
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
                <div className="bg-[var(--card-color)] dark:bg-[var(--card-color)] border border-[#1D8751]/30 rounded-lg p-4 mb-4">
                  <style jsx>{`
                    .custom-bullet-list li::marker {
                      color: #1D8751;
                      font-size: 1.2rem;
                    }
                  `}</style>
                  <ul className="custom-bullet-list list-disc pl-5 text-[#C1C1C1] dark:text-[#C1C1C1] text-[13px] leading-relaxed space-y-1 marker:text-[#1D8751] font-normal">
                    <li>Please send the money from your own account Only</li>
                    <li>Put transaction ID in the description field of the bank</li>
                    <li>Please note, If you do not follow above conditions, we will reject your transaction and send you back your money.</li>
                  </ul>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full bg-[#EF4444] hover:bg-[#d32f2f] text-white font-semibold text-[14px] rounded-[18px] py-3 mt-4 flex items-center justify-center transition-all duration-200 transform hover:scale-[1.02] disabled:bg-[#4B5563] disabled:hover:bg-[#4B5563] disabled:text-white/70 disabled:cursor-not-allowed disabled:transform-none"
                  type="submit"
                  disabled={disableSubmit}
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
          ) : (
            <Cash sharedFeesError={normalizedFeesError} />
          )}

          {/* OTP Modal */}
          {showOtpModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[var(--card-color)] border border-[#1D8751] rounded-2xl p-8 max-w-md mx-4">
                <h3 className="text-xl font-bold text-white mb-4">Enter OTP</h3>
                <p className="text-[#A3A3A3] mb-4">
                  Please enter the OTP sent to verify your withdrawal.
                </p>
                <form onSubmit={handleOtpSubmit}>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="w-full bg-[var(--bg-color)] border border-[#35353F] rounded-xl px-4 py-3 text-white text-lg text-center tracking-widest focus:outline-none focus:border-[#1D8751] mb-4"
                  />
                  {otpError && (
                    <div className="text-red-500 text-sm mb-4 text-center">
                      {typeof otpError === "string" ? otpError : JSON.stringify(otpError)}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => dispatch(closeOtpModal())}
                      className="flex-1 bg-[#35353F] text-white py-3 rounded-xl text-lg font-medium hover:bg-[#2A2A32] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={otpVerifying || !otp || otp.length !== 6}
                      className="flex-1 bg-[#1D8751] text-white py-3 rounded-xl text-lg font-medium hover:bg-[#166b3e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {otpVerifying && (
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
                      {otpVerifying ? "Verifying..." : "Verify OTP"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Withdraw;
                {/* Currency Selection */}
