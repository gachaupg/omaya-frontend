"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../store";
import {
  fetchPublicPaymentMethods,
  fetchAdminPaymentMethods,
} from "../../p2p/slices/paymentMethodsSlice";
import {
  createMoneyXTransaction,
  updateMoneyXTransaction,
} from "../slices/moneyXSlice";
import { useTheme } from "@/context/theme";
import CustomSelect from "@/components/ui/CustomSelect";
import { showToast } from "../../../lib/utils/toast";
import { usePaymentMethodsDisplay } from "../../express/hooks/useDataDisplay";

interface TransferFormProps {
  onTransfer?: (transactionData: {
    fromPaymentMethod: any;
    toPaymentMethod: any;
    amount: number;
    receiveAmount: number;
    bankAccountAddress?: string;
    moneyxTransactionId?: string;
    moneyXTransaction?: any;
  }) => void;
}

export default function TransferForm({ onTransfer }: TransferFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { isDark } = useTheme();

  const {
    adminMethods,
    loading: adminMethodsLoading,
    error: adminMethodsError,
    publicPaymentMethods,
    publicMethodsLoading,
    publicMethodsError,
  } = useSelector((state: any) => state.paymentMethods);

  const {
    transaction: moneyXTransaction,
    loading: moneyXLoading,
    error: moneyXError,
  } = useSelector((state: any) => state.moneyX);

  // Use state to hold payment methods - will trigger re-render when updated
  const [stablePaymentMethods, setStablePaymentMethods] = useState<any[]>([]);

  // Use appropriate payment methods data
  const paymentMethodsData = adminMethods;
  const paymentMethodsLoading = adminMethodsLoading;
  const paymentMethodsError = adminMethodsError;

  const paymentMethodsDisplay = usePaymentMethodsDisplay(
    paymentMethodsData,
    paymentMethodsLoading,
    paymentMethodsError
  );

  // Fetch payment methods on mount
  useEffect(() => {
    dispatch(fetchAdminPaymentMethods());
  }, [dispatch]);

  // Process payment methods similar to deposit form
  useEffect(() => {
    if (adminMethods && Array.isArray(adminMethods) && adminMethods.length > 0) {
      const activeMethods = adminMethods
        .filter((payment: any) => {
          if (payment.is_active === undefined || payment.is_active === null)
            return true;
          return (
            payment.is_active === true ||
            payment.is_active === "true" ||
            payment.is_active === 1 ||
            payment.is_active === "1"
          );
        })
        .map((payment: any) => ({
          ...payment,
          logo: payment.logo || payment.provider_logo || undefined,
          provider_logo: payment.provider_logo || payment.logo || undefined,
        }));

      if (activeMethods.length > 0) {
        setStablePaymentMethods(activeMethods);
      }
    }
  }, [adminMethods]);

  // Fallback payment methods
  const fallbackPaymentMethods = useMemo(
    () => [
      {
        provider_name: "Bank",
        payment_method: "Bank Transfer",
        is_active: true,
      },
      {
        provider_name: "Mobile Money",
        payment_method: "Mobile Money",
        is_active: true,
      },
      {
        provider_name: "Cryptocurrency",
        payment_method: "Crypto",
        is_active: true,
      },
    ],
    []
  );

  // Use stable state - React will properly render this
  const effectivePaymentMethods = stablePaymentMethods;

  const finalPaymentMethods = useMemo(
    () =>
      effectivePaymentMethods.length > 0
        ? effectivePaymentMethods
        : fallbackPaymentMethods,
    [effectivePaymentMethods, fallbackPaymentMethods]
  );

  // Form state - matching deposit form structure
  const [payAmount, setPayAmount] = useState(100);
  const [payAmountInput, setPayAmountInput] = useState("100");
  const [getAmount, setGetAmount] = useState(98);
  const [getAmountInput, setGetAmountInput] = useState("98");
  const [isCalculatingFromPay, setIsCalculatingFromPay] = useState(true);
  const [fromPaymentMethod, setFromPaymentMethod] = useState<string>("");
  const [toPaymentMethod, setToPaymentMethod] = useState<string>("");
  const [selectedFromPaymentDetail, setSelectedFromPaymentDetail] = useState<any>(null);
  const [selectedToPaymentDetail, setSelectedToPaymentDetail] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingTransaction, setIsUpdatingTransaction] = useState(false);
  const [apiValidationError, setApiValidationError] = useState<string | null>(null);
  const [isFirstCardSubmitted, setIsFirstCardSubmitted] = useState(false);
  const [bankAccountAddress, setBankAccountAddress] = useState<string>("");
  const [bankAddressError, setBankAddressError] = useState<string | null>(null);
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const paymentDetailsRef = useRef<HTMLDivElement>(null);

  // Auto-select first payment method for "from"
  useEffect(() => {
    if (finalPaymentMethods && finalPaymentMethods.length > 0 && !fromPaymentMethod) {
      const firstMethod = finalPaymentMethods[0];
      if (firstMethod?.provider_name) {
        setFromPaymentMethod(firstMethod.provider_name);
        setSelectedFromPaymentDetail(firstMethod);
      }
    }
  }, [finalPaymentMethods, fromPaymentMethod]);

  // Auto-select second payment method for "to" (different from "from")
  useEffect(() => {
    if (finalPaymentMethods && finalPaymentMethods.length > 1 && !toPaymentMethod && fromPaymentMethod) {
      // Find the first method that's different from the selected "from" method
      const secondMethod = finalPaymentMethods.find(
        (method: any) => method.provider_name !== fromPaymentMethod
      );
      if (secondMethod?.provider_name) {
        setToPaymentMethod(secondMethod.provider_name);
        setSelectedToPaymentDetail(secondMethod);
      }
    } else if (finalPaymentMethods && finalPaymentMethods.length === 1 && !toPaymentMethod && fromPaymentMethod) {
      // If there's only one method, don't auto-select "to" (they can't be the same)
      // This case will show validation error if user tries to submit
    }
  }, [finalPaymentMethods, toPaymentMethod, fromPaymentMethod]);

  // Prepare options for CustomSelect
  const paymentMethodOptions = finalPaymentMethods.map((payment: any) => {
    let logoUrl: string | undefined = undefined;

    if (
      payment.provider_logo &&
      typeof payment.provider_logo === "string" &&
      payment.provider_logo.trim()
    ) {
      logoUrl = payment.provider_logo.trim();
    } else if (
      payment.logo &&
      typeof payment.logo === "string" &&
      payment.logo.trim()
    ) {
      logoUrl = payment.logo.trim();
    }

    return {
      value: payment.provider_name,
      label: `${payment.provider_name} - ${payment.payment_method || payment.payment_method_type || ""}`,
      logo: logoUrl,
    };
  });

  // Simple calculation: subtract 2 from send amount (matching deposit form logic)
  const handleAmountChange = (value: string, isFromPay: boolean) => {
    // Only allow numbers and decimals
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      if (value.includes(".")) {
        const decimalPart = value.split(".")[1];
        if (decimalPart && decimalPart.length > 8) {
          setApiValidationError("Number cannot have more than 8 decimal places.");
          return;
        }
      }

      const newAmount = parseFloat(value) || 0;

      if (isFromPay) {
        setPayAmountInput(value);
        setPayAmount(newAmount);
        setIsCalculatingFromPay(true);
        
        // Calculate receive amount (simple: subtract 2)
        const calculatedGetAmount = newAmount < 2 ? newAmount : Math.max(0, newAmount - 2);
        setGetAmount(calculatedGetAmount);
        setGetAmountInput(calculatedGetAmount.toString());
      } else {
        setGetAmountInput(value);
        setGetAmount(newAmount);
        setIsCalculatingFromPay(false);
        
        // Calculate send amount (reverse: add 2)
        const calculatedPayAmount = newAmount < 2 ? newAmount : newAmount + 2;
        setPayAmount(calculatedPayAmount);
        setPayAmountInput(calculatedPayAmount.toString());
      }

      setApiValidationError(null);
      
      // Show info modal if amount exceeds $15,000
      if (newAmount > 15000) {
        // You can add an info modal here similar to deposit form
      }
    }
  };

  const handleFirstCardSubmit = async () => {
    // Clear previous errors
    setValidationErrors([]);
    setApiValidationError(null);

    // Validation
    const errors: string[] = [];

    if (!payAmountInput || payAmountInput.trim() === "" || !payAmount || payAmount <= 0) {
      errors.push("Please enter a valid amount");
    }

    if (!fromPaymentMethod || !selectedFromPaymentDetail) {
      errors.push("Please select a 'From' payment method");
    }

    if (!toPaymentMethod || !selectedToPaymentDetail) {
      errors.push("Please select a 'To' payment method");
    }

    if (fromPaymentMethod === toPaymentMethod) {
      errors.push("From and To payment methods cannot be the same");
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      errors.forEach(error => showToast.error(error));
      return;
    }

    setIsSubmitting(true);

    try {
      // Extract provider IDs from selected payment methods
      const senderProviderId = 
        selectedFromPaymentDetail?.id || 
        selectedFromPaymentDetail?.provider_id || 
        selectedFromPaymentDetail?.providerId;
      
      const receiverProviderId = 
        selectedToPaymentDetail?.id || 
        selectedToPaymentDetail?.provider_id || 
        selectedToPaymentDetail?.providerId;

      if (!senderProviderId || !receiverProviderId) {
        throw new Error("Provider IDs not found in payment methods");
      }

      // Create MoneyX transaction
      const result = await dispatch(
        createMoneyXTransaction({
          amount: payAmount.toFixed(2),
          sender_provider: senderProviderId,
          receiver_provider: receiverProviderId,
          recipient_name: "John Doe", // TODO: Add recipient name input field if needed
        })
      ).unwrap();

      // Show success message
      showToast.success("Transfer request submitted successfully!");

      setIsFirstCardSubmitted(true);
      
      // Scroll to the next section
      setTimeout(() => {
        if (paymentDetailsRef.current) {
          paymentDetailsRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    } catch (error: any) {
      console.error("Transfer error:", error);
      const errorMessage = error || "An error occurred. Please try again.";
      setValidationErrors([errorMessage]);
      showToast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTransferDisabled =
    isSubmitting ||
    !fromPaymentMethod ||
    !toPaymentMethod ||
    !payAmount ||
    payAmount <= 0 ||
    fromPaymentMethod === toPaymentMethod ||
    !selectedFromPaymentDetail ||
    !selectedToPaymentDetail;

  return (
    <div className="w-full flex flex-col dark:bg-[#18181D]">
      <h2 className="text-xl font-bold mb-2 text-[#788099] dark:text-[#788099] inline-flex items-center gap-2">
        <span className="text-[#7e7e8f] dark:text-[#788099]">1-</span>
        Transfer Information
      </h2>

      {/* API Validation Error - Show as simple red text */}
      {apiValidationError && (
        <div className="mb-4 text-red-500 text-sm font-medium">
          {apiValidationError}
        </div>
      )}

      {/* MoneyX API Error Display */}
      {moneyXError && (
        <div className="mb-4 text-red-500 text-sm font-medium">
          {moneyXError}
        </div>
      )}

      <div className="w-full text-white">
        {/* Top Section - Amount and From Payment Method in one card */}
        <div className="relative mb-4">
          {/* Top Card Container */}
          <div className="relative flex flex-col sm:flex-row border border-[#D1D2D4FF] dark:border-[#35353E] rounded-xl sm:rounded-2xl p-3 sm:p-4 overflow-visible gap-3 sm:gap-0">
            {/* Amount Section */}
            <div className="flex-1 sm:pr-4">
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
                You Send
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={payAmountInput}
                  onChange={(e) => {
                    handleAmountChange(e.target.value, true);
                  }}
                  placeholder="Enter amount"
                  className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff] rounded-2xl px-4 py-3 pr-12 sm:pr-16 text-base sm:text-lg focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E] appearance-none min-h-[60px]"
                />
              </div>
            </div>

            {/* From Payment Method Section */}
            <div
              data-select-card="true"
              className="flex-1 sm:pl-4 border-t sm:border-t-0 sm:border-l border-[#D1D2D4FF] dark:border-[#35353E] pt-3 sm:pt-0 sm:border-none"
            >
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                From Payment Method
              </label>
              <div className="relative">
                <CustomSelect
                  options={paymentMethodOptions}
                  value={fromPaymentMethod}
                  sizeMode="card"
                  onChange={(value) => {
                    const selectedPayment = finalPaymentMethods?.find(
                      (payment: any) => payment.provider_name === value
                    );
                    setFromPaymentMethod(value);
                    setSelectedFromPaymentDetail(selectedPayment || null);
                    setValidationErrors([]);
                  }}
                  placeholder={
                    paymentMethodsDisplay.isLoading &&
                    finalPaymentMethods.length === 0
                      ? "Loading payment methods..."
                      : finalPaymentMethods && finalPaymentMethods.length > 0
                        ? "Select Payment Method"
                        : "No payment methods available"
                  }
                  disabled={
                    paymentMethodsDisplay.isLoading &&
                    finalPaymentMethods.length === 0
                  }
                  loading={
                    paymentMethodsDisplay.isLoading &&
                    finalPaymentMethods.length === 0
                  }
                  loadingText="Loading payment methods..."
                  emptyText="No payment methods available"
                  searchable={true}
                  className="w-full"
                  triggerClassName="min-h-[60px]"
                />
              </div>
              {adminMethodsError && (
                <p className="text-red-500 text-sm mt-1">{adminMethodsError}</p>
              )}
            </div>
          </div>

          {/* Swap Circle - positioned to touch both borders equally */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full -translate-y-1/3 z-10">
            <button
              className="w-10 h-10 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105 sm:min-h-0 touch-manipulation"
              onClick={() => {
                // Swap from and to payment methods
                const tempFrom = fromPaymentMethod;
                const tempFromDetail = selectedFromPaymentDetail;
                setFromPaymentMethod(toPaymentMethod);
                setSelectedFromPaymentDetail(selectedToPaymentDetail);
                setToPaymentMethod(tempFrom);
                setSelectedToPaymentDetail(tempFromDetail);
              }}
            >
              {/* Light mode image */}
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1756579504/Frame_36261_1_d9cnq1.png"
                alt="swap icon"
                className="w-10 h-10 sm:w-10 sm:h-10 dark:hidden"
              />
              {/* Dark mode image */}
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1755500509/Frame_36261_ledmyw.png"
                alt="swap icon"
                className="w-10 h-10 sm:w-10 sm:h-10 hidden dark:block"
              />
            </button>
          </div>
        </div>

        {/* Bottom Section - You Receive and To Payment Method in one card */}
        <div className="relative mb-3">
          <div className="relative flex flex-col sm:flex-row border border-[#D1D2D4FF] dark:border-[#35353E] rounded-xl sm:rounded-2xl p-3 sm:p-4 overflow-visible gap-3 sm:gap-0">
            {/* You Receive Section */}
            <div className="flex-1 sm:pr-4">
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
                You Receive
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
                {!isCalculatingFromPay && (
                  <span className="text-xs text-[#1D8751] font-medium hidden sm:inline">
                    (Active)
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={getAmountInput}
                  onChange={(e) => {
                    handleAmountChange(e.target.value, false);
                  }}
                  placeholder="Enter amount"
                  className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff] rounded-2xl px-4 py-3 pr-16 text-base sm:text-lg focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E] appearance-none min-h-[60px]"
                />
              </div>
            </div>

            {/* To Payment Method Section */}
            <div className="flex-1 sm:pl-4 border-t sm:border-t-0 sm:border-l border-[#D1D2D4FF] dark:border-[#35353E] pt-3 sm:pt-0 sm:border-none">
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold">
                To Payment Method
              </label>
              <div className="relative">
                <CustomSelect
                  options={paymentMethodOptions.filter(
                    (opt) => opt.value !== fromPaymentMethod
                  )}
                  value={toPaymentMethod}
                  sizeMode="card"
                  onChange={(value) => {
                    const selectedPayment = finalPaymentMethods?.find(
                      (payment: any) => payment.provider_name === value
                    );
                    setToPaymentMethod(value);
                    setSelectedToPaymentDetail(selectedPayment || null);
                    setValidationErrors([]);
                  }}
                  placeholder={
                    paymentMethodsDisplay.isLoading &&
                    finalPaymentMethods.length === 0
                      ? "Loading payment methods..."
                      : finalPaymentMethods && finalPaymentMethods.length > 0
                        ? "Select Payment Method"
                        : "No payment methods available"
                  }
                  disabled={
                    paymentMethodsDisplay.isLoading &&
                    finalPaymentMethods.length === 0
                  }
                  loading={
                    paymentMethodsDisplay.isLoading &&
                    finalPaymentMethods.length === 0
                  }
                  loadingText="Loading payment methods..."
                  emptyText="No payment methods available"
                  searchable={true}
                  className="w-full"
                  triggerClassName="min-h-[60px]"
                />
              </div>
              {adminMethodsError && (
                <p className="text-red-500 text-sm mt-1">{adminMethodsError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="flex items-center rounded-2xl px-4 py-3 mb-4 dark:bg-[#1D1D23]">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path
                  d="M12 8v4m0 4h.01"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            <span className="text-[#35353e] dark:text-[#788099] text-sm font-medium">
              This is only an estimated price based on current market rates. The final price will be confirmed when we receive the funds.
            </span>
          </div>
        </div>

        {/* Validation Errors Display */}
        {validationErrors.length > 0 && (
          <div className="w-full px-2 mb-4">
            <div className="dark:bg-[#1D1D23] border border-[#1D8751] rounded-2xl p-4">
              <h3 className="text-[#1D8751] font-semibold mb-2">
                Please fix the following errors:
              </h3>
              <ul className="list-disc list-inside text-[#1D8751] space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Submit Button for First Card */}
        {!isFirstCardSubmitted && (
          <div className="mt-4 relative">
            <button
              className={`w-full text-white dark:text-white text-sm sm:text-base font-medium py-3 sm:py-2 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-colors min-h-[44px] sm:min-h-0 ${
                isTransferDisabled
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#1D8751] hover:bg-[#166b3e]"
              }`}
              onClick={handleFirstCardSubmit}
              disabled={isTransferDisabled}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <span>Submit</span>
              )}
            </button>
          </div>
        )}
      </div>

      {isFirstCardSubmitted && (
        <>
          {/* Bank Account Address Section */}
          <h2 className="text-xl font-bold mb-2 text-[#788099] dark:text-[#788099] inline-flex items-center gap-2">
            <span className="text-[#7e7e8f] dark:text-[#788099]">2-</span>
            Bank Account Address
          </h2>
          <div
            ref={paymentDetailsRef}
            className="flex flex-col dark:bg-[#1D1D23] border-2 border-[#35353E] rounded-2xl p-5 shadow-lg w-full text-[#35353e] dark:text-[#788099] mb-6"
          >
            {/* Bank Account Address Label */}
            <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
              Bank Account Address
            </label>
            {/* Input group */}
            <div className="flex items-center dark:bg-[#1D1D23] border border-[#39394a] dark:border-[#35353E] rounded-2xl px-4 py-2 mb-0">
              {/* Left icon */}
              <span className="mr-2 text-[#1D8751]">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M7 17v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
                    stroke="#1D8751"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="3"
                    y="3"
                    width="12"
                    height="12"
                    rx="2"
                    stroke="#1D8751"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <input
                type="text"
                value={bankAccountAddress}
                onChange={(e) => {
                  const value = e.target.value;
                  setBankAccountAddress(value);
                  setIsAddressConfirmed(false);
                  setBankAddressError(null);
                }}
                placeholder="Paste here your Bank Account Address"
                className={`flex-1 bg-transparent border-none outline-none text-[#35353e] dark:text-[#788099] placeholder-[#788099] text-base ${
                  bankAddressError
                    ? "border-red-500"
                    : bankAccountAddress.trim() && !bankAddressError
                      ? "border-green-500"
                      : ""
                }`}
              />
              {/* Bookmark icon */}
              <span className="mx-2 text-[#788099] cursor-pointer">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                    stroke="#788099"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {/* Paste button */}
              <button
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setBankAccountAddress(text);
                  } catch (err) {
                    console.error("Failed to read clipboard:", err);
                    showToast.error("Failed to paste from clipboard");
                  }
                }}
                className="flex items-center gap-1 dark:bg-[#1D1D23] border border-[#1D8751] 
                text-[#1D8751] rounded-full px-3 sm:px-1 py-2 sm:py-1 ml-2 font-semibold text-sm sm:text-base hover:bg-[#1D8751] hover:text-white transition-colors min-h-[44px] sm:min-h-0 touch-manipulation"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M19 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-2h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Paste
              </button>
            </div>

            {/* Show validation messages below the bank account address input */}
            {bankAddressError && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                ❌ {bankAddressError}
              </p>
            )}

            <label className="flex mb-4 items-center gap-2 mt-4 text-sm text-[#35353e] dark:text-[#788099]">
              <input
                type="checkbox"
                checked={isAddressConfirmed}
                onChange={(event) =>
                  setIsAddressConfirmed(event.target.checked)
                }
                className="w-4 h-4 rounded border-[#1D8751] text-[#1D8751] focus:ring-[#1D8751]"
              />
              <span>I confirm that this bank account address is correct.</span>
            </label>

            {/* Terms and Conditions Summary */}
            <div className="flex items-center mb-2 mt-4">
              <span className="mr-2 text-[#1D8751]">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#1D8751"
                    strokeWidth="2"
                  />
                  <line
                    x1="12"
                    y1="8"
                    x2="12"
                    y2="12"
                    stroke="#1D8751"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="16" r="1" fill="#1D8751" />
                </svg>
              </span>
              <span className="text-base font-semibold text-[#7e7e8f] dark:text-[#788099]">
                Terms and Conditions Summary
              </span>
            </div>
            <div className="dark:bg-[#1D1D23] border border-[#1D8751] rounded-xl p-4">
              <ul className="list-none space-y-2">
                <li className="flex items-start">
                  <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] inline-block mr-3"></span>
                  <span className="text-[#35353e] dark:text-[#788099] text-sm">
                    Please send the money from your own account Only
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] inline-block mr-3"></span>
                  <span className="text-[#35353e] dark:text-[#788099] text-sm">
                    Put transaction ID in the description field of the bank
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] inline-block mr-3"></span>
                  <span className="text-[#35353e] dark:text-[#788099] text-sm">
                    Please note, If you do not follow above conditions, we will
                    reject your transaction and send you back your money.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Final Submit Button */}
          <div className="flex flex-col gap-3 w-full px-2">
            <button
              className={`w-full text-white dark:text-white text-sm sm:text-base font-medium py-3 sm:py-2 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-colors min-h-[44px] sm:min-h-0 ${
                !bankAccountAddress.trim() || bankAddressError || !isAddressConfirmed
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#1D8751] hover:bg-[#166b3e]"
              }`}
              onClick={async () => {
                if (!bankAccountAddress.trim()) {
                  showToast.error("Please enter a bank account address");
                  return;
                }
                if (bankAddressError) {
                  showToast.error("Please enter a valid bank account address");
                  return;
                }
                if (!isAddressConfirmed) {
                  showToast.error("Please confirm the bank account address");
                  return;
                }

                if (!moneyXTransaction?.moneyx_transaction_id) {
                  showToast.error("Transaction not found. Please submit the transfer form first.");
                  return;
                }

                setIsUpdatingTransaction(true);

                try {
                  // Update MoneyX transaction with account number
                  const result = await dispatch(
                    updateMoneyXTransaction({
                      transactionId: moneyXTransaction.moneyx_transaction_id,
                      payload: {
                        recipient_account_number: bankAccountAddress.trim(),
                      },
                    })
                  ).unwrap();

                  showToast.success("Account number updated successfully!");
                  
                  // Call onTransfer callback with transaction data including MoneyX transaction ID
                  if (onTransfer) {
                    onTransfer({
                      fromPaymentMethod: selectedFromPaymentDetail,
                      toPaymentMethod: selectedToPaymentDetail,
                      amount: payAmount,
                      receiveAmount: getAmount,
                      bankAccountAddress: bankAccountAddress,
                      moneyxTransactionId: result.moneyx_transaction_id,
                      moneyXTransaction: result,
                    });
                  }
                } catch (error: any) {
                  console.error("Update transaction error:", error);
                  const errorMessage = error || "An error occurred while updating the transaction.";
                  showToast.error(errorMessage);
                } finally {
                  setIsUpdatingTransaction(false);
                }
              }}
              disabled={!bankAccountAddress.trim() || !!bankAddressError || !isAddressConfirmed || isSubmitting || isUpdatingTransaction || moneyXLoading}
            >
              {isSubmitting || isUpdatingTransaction ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <span>Submit</span>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
