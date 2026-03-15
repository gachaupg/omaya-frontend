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
import { useValidateAddress } from "@/hooks/useValidateAddress";
import { useBookmarkedAddresses } from "@/features/express/hooks/useBookmarkedAddresses";
import { BookmarkDropdown } from "@/features/express/components/forms/BookmarkDropdown";
import { useTheme } from "@/context/theme";

const Withdraw = () => {
  const [activeTab, setActiveTab] = useState<"usdt" | "cash">("usdt");
  const [walletAddress, setWalletAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [confirmAddress, setConfirmAddress] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array.from({ length: 6 }, () => "")
  );
  const otp = otpDigits.join("");
  const [resendTimer, setResendTimer] = useState(0); // Timer in seconds (5 minutes = 300 seconds)
  const [isResending, setIsResending] = useState(false);
  const [errors, setErrors] = useState<{
    amount?: string;
    walletAddress?: string;
    confirmAddress?: string;
  }>({});
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isDark } = useTheme();
  const { loading, error, success, showOtpModal, withdrawalId, otpVerifying, otpError, fees, feesLoading, feesError } = useSelector(
    (state: any) => state.referralWallet
  );

  // Cache for fees by amount to avoid redundant API calls
  const feesCacheRef = useRef<Map<string, ReferralFeeCalculation>>(new Map());
  const lastCalculatedAmountRef = useRef<string>("");
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Debounce amount to avoid too many API calls
  const debouncedAmount = useDebounce(amount, 500);

  // Address validation (USDT BSC/BEP20)
  const {
    result: addressValidationResult,
    isValidating: isAddressValidating,
    validate: validateAddress,
    reset: resetAddressValidation,
  } = useValidateAddress({ currency: "usdt", network: "bsc", debounceMs: 500 });

  // Bookmarked addresses
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const bookmarkAnchorRef = useRef<HTMLSpanElement>(null);
  const { bookmarks, loading: bookmarksLoading, saving: bookmarkSaving, fetchBookmarks, saveBookmark } =
    useBookmarkedAddresses("usdt", "bsc");

  // Validate address when wallet address changes
  useEffect(() => {
    if (walletAddress.trim()) {
      validateAddress(walletAddress.trim(), "usdt", "bsc");
    } else {
      resetAddressValidation();
    }
  }, [walletAddress, validateAddress, resetAddressValidation]);


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

    const firstErrorField = ["amount", "walletAddress", "confirmAddress"].find(
      (field) => errorObj[field as keyof typeof errorObj]
    );

    if (firstErrorField) {
      setTimeout(() => {
        const element = document.getElementById(`${firstErrorField}-section`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          const input = element.querySelector("input");
          if (input) {
            input.focus({ preventScroll: true });
          }
        }
      }, 100);
    }

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
    const isCompleteOtp = otpDigits.every((d) => d.length === 1);
    if (withdrawalId && isCompleteOtp) {
      dispatch(verifyReferralOtp({ withdrawal_id: withdrawalId, otp }));
    }
  };

  const handleOtpDigitChange = useCallback((index: number, value: string) => {
    const raw = (value || "").replace(/\D/g, "");

    // Handle paste of multiple digits
    if (raw.length > 1) {
      setOtpDigits((prev) => {
        const next = [...prev];
        for (let i = 0; i < raw.length && index + i < 6; i++) {
          next[index + i] = raw[i];
        }
        return next;
      });

      const nextFocusIndex = Math.min(index + raw.length, 5);
      otpInputRefs.current[nextFocusIndex]?.focus();
      return;
    }

    const digit = raw.slice(-1); // keep last digit only
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleOtpDigitKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Backspace") return;

      // If current box has a value, clear it
      if (otpDigits[index]) {
        setOtpDigits((prev) => {
          const next = [...prev];
          next[index] = "";
          return next;
        });
        return;
      }

      // Otherwise move focus to previous and clear it
      if (index > 0) {
        otpInputRefs.current[index - 1]?.focus();
        setOtpDigits((prev) => {
          const next = [...prev];
          next[index - 1] = "";
          return next;
        });
      }
    },
    [otpDigits]
  );

  // Handle success
  useEffect(() => {
    if (success) {
      setShowSuccess(true);
      // Reset form
      setAmount("");
      setWalletAddress("");
      setConfirmAddress(false);
      setErrors({});
      setResendTimer(0);
    }
  }, [success]);

  // Extract error message from API response (string or { error: string })
  const getOtpErrorMessage = (err: unknown): string => {
    if (!err) return "";
    if (typeof err === "string") return err;
    if (typeof err === "object" && err !== null) {
      const obj = err as Record<string, unknown>;
      return (obj.error as string) || (obj.message as string) || "";
    }
    return "";
  };

  // Start countdown timer when OTP modal opens
  useEffect(() => {
    if (showOtpModal) {
      setResendTimer(300); // 5 minutes = 300 seconds
    } else {
      setResendTimer(0);
    }
  }, [showOtpModal]);

  // When "account locked for 30 minutes" error, set resend timer to 30 min
  useEffect(() => {
    const msg = getOtpErrorMessage(otpError);
    if (
      msg &&
      (msg.toLowerCase().includes("locked for 30 minutes") ||
        msg.toLowerCase().includes("too many failed attempts"))
    ) {
      setResendTimer(30 * 60); // 30 minutes
    }
  }, [otpError]);

  // Countdown timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [resendTimer]);

  // Format timer as MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isResending) return;

    setIsResending(true);
    try {
      // Resend by creating a new withdrawal request (this will send a new OTP)
      await dispatch(
        createReferralWithdraw({
          requested_amount: amount,
          wallet_address: walletAddress,
          withdrawal_method: "crypto",
        })
      ).unwrap();

      // Reset timer to 5 minutes
      setResendTimer(300);
      setOtpDigits(Array.from({ length: 6 }, () => "")); // Clear current OTP input
    } catch (error) {
      // Error is handled by Redux state
    } finally {
      setIsResending(false);
    }
  };

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
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--bg-color)] text-[#0D0D0D] dark:text-white flex flex-col">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white dark:bg-[#1A1A1F] border border-[#1D8751] rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl pointer-events-auto">
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
            <h3 className="text-xl font-bold text-[#0D0D0D] dark:text-white mb-2">
              Withdrawal Successful!
            </h3>
            <p className="text-[#788099] dark:text-[#A3A3A3] mb-6">
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

      <div className="w-full flex flex-col">
        {/* Withdraw Form Card */}
        <div className="w-full max-w-4xl lg:max-w-5xl rounded-xl p-2 sm:p-6 mx-auto">
          {/* Tabs for USDT BEP20 / Cash */}
          <div className="flex gap-2 mb-6 border border-[#EF4444] bg-white dark:bg-[#1A1A1F] rounded-lg p-1 w-fit flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab("usdt")}
              className={`px-6 py-2 rounded-lg font-semibold text-base ${activeTab === "usdt"
                ? "bg-[#EF4444] text-white"
                : "bg-transparent text-[#A3A3A3]"
                }`}
            >
              USDT TRC20
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("cash")}
              className={`px-6 py-2 rounded-lg font-semibold text-base ${activeTab === "cash"
                ? "bg-[#EF4444] text-white"
                : "bg-transparent text-[#A3A3A3]"
                }`}
            >
              Cash
            </button>
          </div>

          {activeTab === "usdt" ? (
            <form onSubmit={handleWithdraw}>
              {/* 1- Transaction Info */}
              <div className="text-md font-bold mb-2 text-[#788099] dark:text-[#788099]">1- Transaction Info</div>

              <div className="mb-3 p-3 border border-[#E8EFF5] dark:border-[#35353F] bg-white dark:bg-[#1A1A1F] rounded-[18px] shadow-sm">
                <div className="flex  flex-col md:flex-row gap-4 mb-2">
                  <div className="flex-1" id="amount-section">
                    <label className="block text-sm text-[#788099] dark:text-[#A3A3A3] mb-1">Amount</label>
                    <input
                      className={`w-full  bg-white dark:bg-[var(--bg-color)] border border-[#E8EFF5] dark:border-[#35353F] rounded-[18px] px-1 py-1 text-[#788099] dark:text-white text-lg focus:outline-none ${errors.amount ? "border-red-500" : ""
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
                      <span className="text-error">
                        {feesLoading ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          `$${totalFees.toFixed(2)}`
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start text-warning text-xs mb-1">
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="mr-1 mt-0.5 shrink-0"
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
                <div className="text-md font-bold mb-2 text-[#788099] dark:text-[#788099]">
                  2- Your Wallet Address
                </div>
                <div className="mb-2 border border-[#E8EFF5] dark:border-[#35353F] bg-white dark:bg-[#1A1A1F] p-3 rounded-[18px] shadow-sm" id="walletAddress-section">
                  <label className="block text-[#A3A3A3] mb-1">
                    Wallet/Account Address
                  </label>
                  <div className="flex gap-2 mb-2">
                    <div className="flex min-w-0 items-center dark:bg-(--bg-color) border border-[#E8EFF5] dark:border-[#35353F] rounded-[18px] px-4 py-2 flex-1 overflow-hidden relative">
                      <span className="text-[#1D8751] mr-2">📋</span>
                      <input
                        className="bg-transparent text:dark:text-white text-sm sm:text-base lg:text-lg focus:outline-none flex-1 min-w-0"
                        placeholder="Paste your crypto address"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        onPaste={(e) => {
                          e.preventDefault();
                          const text = e.clipboardData.getData("text");
                          setWalletAddress(text);
                        }}
                      />
                      <span
                        ref={bookmarkAnchorRef}
                        className="ml-2 text-[#1D8751] cursor-pointer shrink-0 hover:opacity-80 transition-opacity"
                        onClick={async () => {
                          if (bookmarkOpen) {
                            setBookmarkOpen(false);
                            return;
                          }
                          setBookmarkOpen(true);
                          await fetchBookmarks();
                        }}
                        title="Load from bookmarks"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      </span>
                      <BookmarkDropdown
                        isOpen={bookmarkOpen}
                        onClose={() => setBookmarkOpen(false)}
                        bookmarks={bookmarks}
                        loading={bookmarksLoading}
                        saving={bookmarkSaving}
                        currentAddress={walletAddress}
                        onSelect={(addr) => {
                          setWalletAddress(addr);
                          if (addr.trim()) validateAddress(addr.trim(), "usdt", "bsc");
                          else resetAddressValidation();
                        }}
                        onSaveCurrent={async () => {
                          try {
                            if (!walletAddress.trim()) return;
                            await saveBookmark({
                              address: walletAddress.trim(),
                              label: "My USDT wallet",
                              network: "bsc",
                              asset: "usdt",
                            });
                          } catch { /* handled by hook */ }
                        }}
                        anchorRef={bookmarkAnchorRef}
                        isDark={isDark}
                        saveDisabled={isAddressValidating || !(addressValidationResult?.isValid)}
                      />
                    </div>
                    <button
                      className="text-[#1D8751] px-1 sm:px-4 sm:py-1 text-sx sm:text-base rounded-xl bg-white dark:bg-[#35353F] text-sm border border-border dark:border-accent dark:hover:bg-[#2A2A32] transition-colors"
                      type="button"
                      onClick={handlePaste}
                    >
                      Paste
                    </button>
                  </div>
                  {isAddressValidating && (
                    <p className="text-xs text-[#788099] dark:text-[#A3A3A3] mb-1">Validating address...</p>
                  )}
                  {!isAddressValidating && addressValidationResult && (
                    <p className={`text-xs mb-1 ${addressValidationResult.isValid ? "text-[#1D8751]" : "text-red-500"}`}>
                      {addressValidationResult.isValid ? "✓ Valid address" : (addressValidationResult.message || "Invalid address")}
                    </p>
                  )}
                  {errors.walletAddress && (
                    <div className="text-red-500 text-xs mb-2 ml-2">
                      {errors.walletAddress}
                    </div>
                  )}
                  <div className="flex items-start text-[#1D8751] text-xs mb-2" id="confirmAddress-section">
                    <input
                      type="checkbox"
                      className="mr-2 mt-1 accent-[#1D8751] shrink-0"
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
          ) : (
            <Cash sharedFeesError={normalizedFeesError} />
          )}

          {/* OTP Modal */}
          {showOtpModal && (
            <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
              <div className="bg-white dark:bg-[#1A1A1F] border-2 border-[#1D8751] rounded-2xl p-6 sm:p-8 w-full max-w-lg mx-4 shadow-2xl pointer-events-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-[#0D0D0D] dark:text-white">Enter OTP</h3>
                  <button
                    type="button"
                    onClick={() => dispatch(closeOtpModal())}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-[#788099] dark:text-[#A3A3A3] mb-4 text-sm">
                  Please enter the OTP sent to verify your withdrawal.
                </p>
                <form onSubmit={handleOtpSubmit}>
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpInputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6} // allow paste into any box
                        value={otpDigits[index] || ""}
                        onChange={(e) =>
                          handleOtpDigitChange(index, e.target.value)
                        }
                        onKeyDown={(e) => handleOtpDigitKeyDown(index, e)}
                        className="w-11 h-12 sm:w-12 sm:h-14 bg-white dark:bg-[var(--bg-color)] border-2 border-[#E8EFF5] dark:border-[#35353F] rounded-xl text-[#0D0D0D] dark:text-white text-lg text-center focus:outline-none focus:border-[#1D8751]"
                        aria-label={`OTP digit ${index + 1}`}
                      />
                    ))}
                  </div>
                  {otpError && (
                    <div className="text-red-500 text-sm mb-4 text-center">
                      {getOtpErrorMessage(otpError)}
                    </div>
                  )}

                  {/* Resend OTP Section */}
                  <div className="mb-4 text-center">
                    {resendTimer > 0 ? (
                      <p className="text-sm text-[#788099] dark:text-[#A3A3A3]">
                        Resend OTP in{" "}
                        <span className="font-semibold text-[#1D8751] dark:text-[#1D8751]">
                          {formatTimer(resendTimer)}
                        </span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isResending}
                        className="text-sm text-[#1D8751] dark:text-[#1D8751] font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                      >
                        {isResending ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4"
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
                            Resending...
                          </>
                        ) : (
                          "Resend OTP"
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => dispatch(closeOtpModal())}
                      className="flex-1 bg-[#E8EFF5] dark:bg-[#35353F] text-[#0D0D0D] dark:text-white py-3 rounded-xl text-base font-medium hover:bg-[#D1D9E6] dark:hover:bg-[#2A2A32] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={otpVerifying || !otpDigits.every((d) => d.length === 1)}
                      className="flex-1 bg-[#1D8751] text-white py-3 rounded-xl text-base font-medium hover:bg-[#166b3e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
