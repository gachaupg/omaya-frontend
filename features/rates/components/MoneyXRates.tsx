"use client";

import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import {
  fetchPublicPaymentMethods,
  fetchAdminPaymentMethods,
} from "@/features/p2p/slices/paymentMethodsSlice";
import {
  createMoneyXTransaction,
  updateMoneyXTransaction,
} from "@/features/express/home/components/moneyX/slices/moneyXSlice";
import { useTheme } from "@/context/theme";
import { showToast } from "@/lib/utils/toast";
import { usePaymentMethodsDisplay } from "@/features/express/hooks/useDataDisplay";
import { setAuthRedirectPath } from "@/lib/utils/authRedirect";
import { FiChevronDown, FiInfo } from "react-icons/fi";
import { AlertCircle } from "lucide-react";
import { useRatesI18n } from "@/lib/useRatesI18n";
import Exchanging from "@/features/moneyX/components/Exchanging";

const MoneyXRates = () => {
  console.log("MoneyXRates component rendering");
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useRatesI18n();
  const { user } = useSelector((state: RootState) => state.auth);

  const {
    adminMethods,
    loading: adminMethodsLoading,
    error: adminMethodsError,
    publicPaymentMethods,
    publicMethodsLoading,
    publicMethodsError,
  } = useSelector((state: RootState) => state.paymentMethods);

  const {
    transaction: moneyXTransaction,
    loading: moneyXLoading,
    error: moneyXError,
  } = useSelector((state: RootState) => state.moneyX);

  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Use state to hold payment methods
  const [stablePaymentMethods, setStablePaymentMethods] = useState<any[]>([]);

  // Use public payment methods for rates calculator
  const paymentMethodsData = publicPaymentMethods;
  const paymentMethodsLoading = publicMethodsLoading;
  const paymentMethodsError = publicMethodsError;

  const paymentMethodsDisplay = usePaymentMethodsDisplay(
    paymentMethodsData,
    paymentMethodsLoading,
    paymentMethodsError
  );

  // Fetch payment methods on mount
  useEffect(() => {
    dispatch(fetchPublicPaymentMethods());
  }, [dispatch]);

  // Process payment methods
  useEffect(() => {
    let processedMethods: any[] = [];
    if (publicPaymentMethods) {
      // Check if it's an array first
      if (Array.isArray(publicPaymentMethods)) {
        processedMethods = publicPaymentMethods;
      }
      // Check if it has a data property with providers
      else if (
        publicPaymentMethods &&
        typeof publicPaymentMethods === "object" &&
        "data" in publicPaymentMethods
      ) {
        const data = (publicPaymentMethods as any).data;
        if (data) {
          if (Array.isArray(data.providers)) {
            processedMethods = data.providers;
          } else if (Array.isArray(data.payment_methods)) {
            processedMethods = data.payment_methods;
          }
        }
      }
    }

    if (processedMethods.length > 0) {
      const activeMethods = processedMethods
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
          provider_name:
            payment.provider_name ||
            payment.provider?.provider_name ||
            payment.method?.method_name ||
            payment.payment_method_name,
        }));

      if (activeMethods.length > 0) {
        setStablePaymentMethods(activeMethods);
      }
    }
  }, [publicPaymentMethods]);

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
    ],
    []
  );

  const effectivePaymentMethods = stablePaymentMethods;

  const finalPaymentMethods = useMemo(
    () =>
      effectivePaymentMethods.length > 0
        ? effectivePaymentMethods
        : fallbackPaymentMethods,
    [effectivePaymentMethods, fallbackPaymentMethods]
  );

  // Form state
  const [payAmount, setPayAmount] = useState(100);
  const [payAmountInput, setPayAmountInput] = useState("100");
  const [getAmount, setGetAmount] = useState(98);
  const [getAmountInput, setGetAmountInput] = useState("98");
  const [fromPaymentMethod, setFromPaymentMethod] = useState<string>("");
  const [toPaymentMethod, setToPaymentMethod] = useState<string>("");
  const [selectedFromPaymentDetail, setSelectedFromPaymentDetail] =
    useState<any>(null);
  const [selectedToPaymentDetail, setSelectedToPaymentDetail] =
    useState<any>(null);
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
  const [fromSearchTerm, setFromSearchTerm] = useState("");
  const [toSearchTerm, setToSearchTerm] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFirstCardSubmitted, setIsFirstCardSubmitted] = useState(false);
  const [bankAccountAddress, setBankAccountAddress] = useState<string>("");
  const [bankAddressError, setBankAddressError] = useState<string | null>(null);
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [isUpdatingTransaction, setIsUpdatingTransaction] = useState(false);
  const [moneyXTransactionResult, setMoneyXTransactionResult] =
    useState<any>(null);
  const [showExchanging, setShowExchanging] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);
  const paymentDetailsRef = useRef<HTMLDivElement>(null);

  // Helper function to get provider name
  const getProviderName = useCallback((payment: any) => {
    if (!payment) return "";

    let providerName =
      payment?.provider_name ||
      payment?.provider?.provider_name ||
      payment?.provider ||
      payment?.method?.method_name ||
      payment?.payment_method_name ||
      "";

    // Convert to string if it's not already
    providerName = String(providerName || "");

    // Remove common method suffixes (case-insensitive)
    providerName = providerName
      .replace(
        /\s*-\s*(Bank|Mobile|Crypto|Forex|Marchant|Money\s*Transfer|Merchant)\s*$/i,
        ""
      )
      .trim();

    return providerName;
  }, []);

  // Helper function to check if a payment method is a bank
  const isBankMethod = useCallback(
    (method: any) => {
      if (!method) return false;
      const providerName = getProviderName(method).toLowerCase();
      const paymentMethod = (method?.payment_method || "").toLowerCase();
      const paymentMethodType = (
        method?.payment_method_type || ""
      ).toLowerCase();
      const provider = (method?.provider || "").toLowerCase();

      return (
        providerName.includes("bank") ||
        paymentMethod.includes("bank") ||
        paymentMethodType.includes("bank") ||
        provider.includes("bank")
      );
    },
    [getProviderName]
  );

  // Auto-select first bank for "from" when payment methods are loaded
  useEffect(() => {
    if (
      !Array.isArray(finalPaymentMethods) ||
      finalPaymentMethods.length === 0
    ) {
      return;
    }

    // Check if current selection still exists in the latest list
    const currentExists = fromPaymentMethod
      ? finalPaymentMethods.some(
        (m: any) => getProviderName(m) === fromPaymentMethod
      )
      : false;

    // If nothing selected OR the current selection no longer exists, (re)auto-select
    if (!fromPaymentMethod || !currentExists) {
      const bankMethods = finalPaymentMethods.filter(isBankMethod);

      // If banks exist, pick the first bank; otherwise pick the very first method
      const methodToSelect =
        bankMethods.length > 0 ? bankMethods[0] : finalPaymentMethods[0];

      const providerName = getProviderName(methodToSelect);
      if (providerName) {
        setFromPaymentMethod(providerName);
        setSelectedFromPaymentDetail(methodToSelect);
      }
    }
  }, [finalPaymentMethods, fromPaymentMethod, isBankMethod, getProviderName]);

  // Auto-select second payment method for "to"
  useEffect(() => {
    // Only run if we have payment methods, "from" is selected, and "to" is not selected
    if (
      !Array.isArray(finalPaymentMethods) ||
      finalPaymentMethods.length === 0
    ) {
      return;
    }

    if (
      finalPaymentMethods.length > 1 &&
      fromPaymentMethod &&
      !toPaymentMethod
    ) {
      // Filter for banks first
      const bankMethods = finalPaymentMethods.filter(isBankMethod);

      // Select the second bank (index 1) if it exists, otherwise select the second method overall
      let methodToSelect;
      if (bankMethods.length > 1) {
        // Select the second bank in the array (index 1)
        methodToSelect = bankMethods[1];
      } else if (bankMethods.length === 1 && finalPaymentMethods.length > 1) {
        // If only one bank exists, select the second method overall (index 1) if it's different from "from"
        if (
          finalPaymentMethods[1] &&
          getProviderName(finalPaymentMethods[1]) !== fromPaymentMethod
        ) {
          methodToSelect = finalPaymentMethods[1];
        } else {
          // Find first method that's different from "from"
          methodToSelect = finalPaymentMethods.find(
            (method) => getProviderName(method) !== fromPaymentMethod
          );
        }
      } else {
        // No banks or only one method, select the second method (index 1) if it's different from "from"
        if (
          finalPaymentMethods[1] &&
          getProviderName(finalPaymentMethods[1]) !== fromPaymentMethod
        ) {
          methodToSelect = finalPaymentMethods[1];
        } else {
          // Find first method that's different from "from"
          methodToSelect = finalPaymentMethods.find(
            (method) => getProviderName(method) !== fromPaymentMethod
          );
        }
      }

      if (methodToSelect) {
        const providerName = getProviderName(methodToSelect);
        if (providerName) {
          setToPaymentMethod(providerName);
          setSelectedToPaymentDetail(methodToSelect);
        }
      }
    }
  }, [
    finalPaymentMethods,
    fromPaymentMethod,
    toPaymentMethod,
    isBankMethod,
    getProviderName,
  ]);

  // Calculate amounts
  const handleAmountChange = (value: string, isFromPay: boolean) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      if (value.includes(".")) {
        const decimalPart = value.split(".")[1];
        if (decimalPart && decimalPart.length > 8) {
          return;
        }
      }

      const newAmount = parseFloat(value) || 0;

      if (isFromPay) {
        setPayAmountInput(value);
        setPayAmount(newAmount);
        const calculatedGetAmount =
          newAmount < 2 ? newAmount : Math.max(0, newAmount - 2);
        setGetAmount(calculatedGetAmount);
        setGetAmountInput(calculatedGetAmount.toFixed(2));
      } else {
        setGetAmountInput(value);
        setGetAmount(newAmount);
        const calculatedPayAmount = newAmount < 2 ? newAmount : newAmount + 2;
        setPayAmount(calculatedPayAmount);
        setPayAmountInput(calculatedPayAmount.toFixed(2));
      }
    }
  };

  // Calculate fees
  const amountNum = parseFloat(payAmountInput) || 0;
  const commissionRate = 1; // 1% commission
  const networkFee = 1; // $1 network fee
  const commissionAmount = (amountNum * commissionRate) / 100;
  const totalFees = networkFee + commissionAmount;
  const amountIncludingFees = amountNum + totalFees;

  // Filter payment methods based on search
  const filteredFromMethods = finalPaymentMethods.filter((method: any) => {
    const providerName = getProviderName(method).toLowerCase();
    return providerName.includes(fromSearchTerm.toLowerCase());
  });

  const filteredToMethods = finalPaymentMethods.filter((method: any) => {
    const providerName = getProviderName(method).toLowerCase();
    return providerName.includes(toSearchTerm.toLowerCase());
  });

  // Dropdown refs
  const fromDropdownRef = useRef<HTMLDivElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        fromDropdownRef.current &&
        !fromDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFromDropdownOpen(false);
      }
      if (
        toDropdownRef.current &&
        !toDropdownRef.current.contains(event.target as Node)
      ) {
        setIsToDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleExchange = async () => {
    // Clear previous errors
    setValidationErrors([]);

    // Validation
    const errors: string[] = [];

    if (
      !payAmountInput ||
      payAmountInput.trim() === "" ||
      !payAmount ||
      payAmount <= 0
    ) {
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
      errors.forEach((error) => showToast.error(error));
      return;
    }

    // Check if user needs to login first
    if (!isAuthenticated) {
      // Save state to localStorage for restoration after login
      // Get the base provider name (without suffix) for better matching
      const fromProviderBase =
        selectedFromPaymentDetail?.provider ||
        getProviderName(selectedFromPaymentDetail) ||
        fromPaymentMethod;
      const toProviderBase =
        selectedToPaymentDetail?.provider ||
        getProviderName(selectedToPaymentDetail) ||
        toPaymentMethod;

      const state = {
        mode: "moneyx",
        // Send amounts (You Send)
        amountInput: payAmountInput,
        amountValue: payAmount,
        // Receive amounts (You Receive)
        receiveAmountInput: getAmountInput,
        receiveAmountValue: getAmount,
        // Payment methods - save cleaned names and base provider names for better matching
        fromPaymentMethod: fromPaymentMethod, // Cleaned name (already cleaned by getProviderName)
        toPaymentMethod: toPaymentMethod, // Cleaned name
        fromProviderBase: fromProviderBase, // Base provider name from API
        toProviderBase: toProviderBase, // Base provider name from API
        fromPaymentDetail: selectedFromPaymentDetail
          ? { ...selectedFromPaymentDetail }
          : null,
        toPaymentDetail: selectedToPaymentDetail
          ? { ...selectedToPaymentDetail }
          : null,
      };

      console.log("💾 [Rates] Saving moneyx form state before login:", state);
      console.log("💾 [Rates] From payment detail:", selectedFromPaymentDetail);
      console.log("💾 [Rates] To payment detail:", selectedToPaymentDetail);

      // Save to localStorage
      localStorage.setItem("moneyx_form_state", JSON.stringify(state));

      // Set redirect path - redirect to moneyX in dashboard
      const redirectPath = `/dashboard/exchange?mode=moneyx&source=public-rates`;
      setAuthRedirectPath(redirectPath);

      // Redirect to login
      router.push("/auth/login");
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

      // Store the transaction result
      setMoneyXTransactionResult(result);
      setIsFirstCardSubmitted(true);

      // Scroll to the bank account address section
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
      const errorMessage =
        error?.message || error || "An error occurred. Please try again.";
      setValidationErrors([errorMessage]);
      showToast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle bank account address update and proceed to exchanging
  const handleBankAccountSubmit = async () => {
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

    if (!moneyXTransactionResult?.moneyx_transaction_id) {
      showToast.error(
        "Transaction not found. Please submit the transfer form first."
      );
      return;
    }

    setIsUpdatingTransaction(true);

    try {
      // Update MoneyX transaction with account number
      const result = await dispatch(
        updateMoneyXTransaction({
          transactionId: moneyXTransactionResult.moneyx_transaction_id,
          payload: {
            recipient_account_number: bankAccountAddress.trim(),
          },
        })
      ).unwrap();

      showToast.success("Account number updated successfully!");

      // Create transaction data for Exchanging component
      const moneyxTransactionData = {
        type: "deposit" as const,
        amount: payAmount,
        receiveAmount: getAmount,
        asset: {
          ticker: "USD",
          symbol: "USD",
          name: "US Dollar",
        },
        paymentDetail: selectedFromPaymentDetail,
        toPaymentDetail: selectedToPaymentDetail,
        walletAddress: bankAccountAddress.trim(),
        network: { network_type: "Bank Transfer" },
        fromPaymentMethod: selectedFromPaymentDetail,
        toPaymentMethod: selectedToPaymentDetail,
        transactionId: result.moneyx_transaction_id || "",
        moneyxTransactionId: result.moneyx_transaction_id || "",
        isMoneyX: true,
        moneyXTransaction: result,
      };

      // Store in localStorage for persistence
      localStorage.setItem(
        "moneyx_transaction_data",
        JSON.stringify(moneyxTransactionData)
      );
      localStorage.setItem(
        "express_transaction_data",
        JSON.stringify(moneyxTransactionData)
      );

      // Set transaction data and show exchanging component
      setTransactionData(moneyxTransactionData);
      setShowExchanging(true);
    } catch (error: any) {
      console.error("Update transaction error:", error);
      const errorMessage =
        error?.message ||
        error ||
        "An error occurred while updating the transaction.";
      showToast.error(errorMessage);
    } finally {
      setIsUpdatingTransaction(false);
    }
  };

  // If showing exchanging component, render it
  if (showExchanging && transactionData) {
    return (
      <div className="bg-white dark:bg-[#18181D] p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-xl lg:rounded-2xl border-[1.5px] border-gray-200 dark:border-[#35353E] shadow-md container mx-auto">
        <Exchanging
          transactionData={transactionData}
          onBackToTransfer={() => {
            setShowExchanging(false);
            setTransactionData(null);
            // Clear localStorage when going back
            localStorage.removeItem("moneyx_transaction_data");
            localStorage.removeItem("express_transaction_data");
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#18181D] p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-xl lg:rounded-2xl border-[1.5px] border-gray-200 dark:border-[#35353E] shadow-md container mx-auto">
      <div className="mb-2" />

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-4">
          {validationErrors.map((error, index) => (
            <div key={index} className="text-red-500 text-sm font-medium mb-1">
              {error}
            </div>
          ))}
        </div>
      )}

      {/* MoneyX API Error Display */}
      {moneyXError && (
        <div className="mb-4 text-red-500 text-sm font-medium">
          {moneyXError}
        </div>
      )}

      <div className={`w-full ${isDark ? "text-white" : "text-[#1F2937]"}`}>
        {/* Top Section - You Send: Amount and Bank/Payment Method in one card */}
        <div className="relative mb-0 pb-2">
          <div
            className={`relative flex flex-col sm:flex-row gap-6 rounded-2xl p-4 sm:p-6 overflow-visible border-[1.5px] ${isDark ? "border-[#2F2F3A]" : "border-[#E2E8F0] shadow-sm"
              } bg-transparent`}
          >
            {/* Amount Section */}
            <div className="flex-1 min-w-0">
              <label
                className={`block text-sm mb-2 font-semibold flex items-center gap-2 ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                  }`}
              >
                {t("rates.youSend", "You Send")}
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={payAmountInput}
                  onChange={(e) => handleAmountChange(e.target.value, true)}
                  placeholder="Enter amount"
                  className={`w-full rounded-2xl px-4 py-2 pr-16 text-lg focus:outline-none border appearance-none bg-transparent ${isDark
                    ? "border-white/10 text-white"
                    : "border-gray-200 text-[#111827]"
                    }`}
                />
              </div>
            </div>

            {/* Bank/Payment Method Section */}
            <div className="flex-1 min-w-0" ref={fromDropdownRef}>
              <label
                className={`block text-[15px] mb-2 font-semibold ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                  }`}
              >
                Bank/Payment Method
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsFromDropdownOpen(!isFromDropdownOpen);
                    setIsToDropdownOpen(false);
                  }}
                  className={`w-full rounded-2xl px-4 py-2 text-lg focus:outline-none border appearance-none bg-transparent flex items-center justify-between ${isDark
                    ? "border-white/10 text-white"
                    : "border-gray-200 text-[#111827]"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {selectedFromPaymentDetail?.provider_logo ||
                      selectedFromPaymentDetail?.logo ? (
                      <img
                        src={
                          selectedFromPaymentDetail.provider_logo ||
                          selectedFromPaymentDetail.logo
                        }
                        alt={fromPaymentMethod || "Bank"}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#1D8751] flex items-center justify-center text-white text-xs font-semibold">
                        {fromPaymentMethod?.charAt(0) || "B"}
                      </div>
                    )}
                    <span>{fromPaymentMethod || t("rates.selectPaymentMethod", "Select payment method")}</span>
                  </div>
                  <FiChevronDown className="w-5 h-5" />
                </button>

                {isFromDropdownOpen && (
                  <div
                    className={`absolute z-50 w-full mt-1 rounded-xl shadow-lg border ${isDark
                      ? "bg-[#1D1D23] border-[#35353E]"
                      : "bg-white border-[#E2E8F0]"
                      } max-h-60 overflow-y-auto`}
                  >
                    <div className="p-2">
                      <div className="relative mb-2">
                        <input
                          type="text"
                          placeholder={t("rates.searchPlaceholder", "Search...")}
                          value={fromSearchTerm}
                          onChange={(e) => setFromSearchTerm(e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border ${isDark
                            ? "bg-[#18181D] border-[#35353E] text-white"
                            : "bg-white border-[#E2E8F0] text-gray-900"
                            } focus:outline-none`}
                        />
                      </div>
                      {filteredFromMethods.map((method: any, index: number) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            const providerName = getProviderName(method);
                            setFromPaymentMethod(providerName);
                            setSelectedFromPaymentDetail(method);
                            setIsFromDropdownOpen(false);
                            setFromSearchTerm("");
                          }}
                          className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 hover:bg-opacity-50 ${isDark ? "hover:bg-[#2F2F3A]" : "hover:bg-gray-100"
                            }`}
                        >
                          {method.provider_logo || method.logo ? (
                            <img
                              src={method.provider_logo || method.logo}
                              alt={getProviderName(method)}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#1D8751] flex items-center justify-center text-white text-xs font-semibold">
                              {getProviderName(method)?.charAt(0) || "B"}
                            </div>
                          )}
                          <span>{getProviderName(method)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Swap Indicator - Clickable */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full -translate-y-[60%] sm:-translate-y-[45%] z-10">
            <button
              type="button"
              onClick={() => {
                // Swap the payment methods
                const tempPaymentMethod = fromPaymentMethod;
                const tempPaymentDetail = selectedFromPaymentDetail;

                setFromPaymentMethod(toPaymentMethod);
                setSelectedFromPaymentDetail(selectedToPaymentDetail);

                setToPaymentMethod(tempPaymentMethod);
                setSelectedToPaymentDetail(tempPaymentDetail);

                // Swap the amounts
                const tempPayAmount = payAmountInput;
                setPayAmountInput(getAmountInput);
                setPayAmount(getAmount);

                setGetAmountInput(tempPayAmount);
                setGetAmount(payAmount);
              }}
              className="flex items-center justify-center p-0 bg-transparent border-none shadow-none"
            >
              <img
                src={
                  isDark
                    ? "https://res.cloudinary.com/pitz/image/upload/v1755500509/Frame_36261_ledmyw.png"
                    : "https://res.cloudinary.com/pitz/image/upload/v1756579504/Frame_36261_1_d9cnq1.png"
                }
                alt="swap"
                className="w-11 h-11"
              />
            </button>
          </div>
        </div>

        {/* Bottom Section - You Get: Amount and Provider in one card */}
        <div className="relative mb-0 pb-2">
          <div
            className={`relative flex flex-col sm:flex-row gap-6 rounded-2xl p-4 sm:p-6 overflow-visible border-[1.5px] ${isDark ? "border-[#2F2F3A]" : "border-[#E2E8F0] shadow-sm"
              } bg-transparent`}
          >
            {/* Amount Section */}
            <div className="flex-1 min-w-0">
              <label
                className={`block text-sm mb-2 font-semibold flex items-center gap-2 ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                  }`}
              >
                {t("rates.youGet", "You Get")}
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={getAmountInput}
                  onChange={(e) => handleAmountChange(e.target.value, false)}
                  placeholder="Enter amount"
                  className={`w-full rounded-2xl px-4 py-2 pr-16 text-lg focus:outline-none border appearance-none bg-transparent ${isDark
                    ? "border-white/10 text-white"
                    : "border-gray-200 text-[#111827]"
                    }`}
                />
              </div>
            </div>

            {/* Provider Section */}
            <div className="flex-1 min-w-0" ref={toDropdownRef}>
              <label
                className={`block text-[15px] mb-2 font-semibold ${isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                  }`}
              >
                Bank/Payment Method
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsToDropdownOpen(!isToDropdownOpen);
                    setIsFromDropdownOpen(false);
                  }}
                  className={`w-full rounded-2xl px-4 py-2 text-lg focus:outline-none border appearance-none bg-transparent flex items-center justify-between ${isDark
                    ? "border-white/10 text-white"
                    : "border-gray-200 text-[#111827]"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {selectedToPaymentDetail?.provider_logo ||
                      selectedToPaymentDetail?.logo ? (
                      <img
                        src={
                          selectedToPaymentDetail.provider_logo ||
                          selectedToPaymentDetail.logo
                        }
                        alt={toPaymentMethod || "Bank"}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#1D8751] flex items-center justify-center text-white text-xs font-semibold">
                        {toPaymentMethod?.charAt(0) || "P"}
                      </div>
                    )}
                    <span>{toPaymentMethod || t("rates.selectProviderPlaceholder", "Select provider")}</span>
                  </div>
                  <FiChevronDown className="w-5 h-5" />
                </button>

                {isToDropdownOpen && (
                  <div
                    className={`absolute z-50 w-full mt-1 rounded-xl shadow-lg border ${isDark
                      ? "bg-[#1D1D23] border-[#35353E]"
                      : "bg-white border-[#E2E8F0]"
                      } max-h-60 overflow-y-auto`}
                  >
                    <div className="p-2">
                      <div className="relative mb-2">
                        <input
                          type="text"
                          placeholder={t("rates.searchPlaceholder", "Search...")}
                          value={toSearchTerm}
                          onChange={(e) => setToSearchTerm(e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border ${isDark
                            ? "bg-[#18181D] border-[#35353E] text-white"
                            : "bg-white border-[#E2E8F0] text-gray-900"
                            } focus:outline-none`}
                        />
                      </div>
                      {filteredToMethods.map((method: any, index: number) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            const providerName = getProviderName(method);
                            setToPaymentMethod(providerName);
                            setSelectedToPaymentDetail(method);
                            setIsToDropdownOpen(false);
                            setToSearchTerm("");
                          }}
                          className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 hover:bg-opacity-50 ${isDark ? "hover:bg-[#2F2F3A]" : "hover:bg-gray-100"
                            }`}
                        >
                          {method.provider_logo || method.logo ? (
                            <img
                              src={method.provider_logo || method.logo}
                              alt={getProviderName(method)}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#1D8751] flex items-center justify-center text-white text-xs font-semibold">
                              {getProviderName(method)?.charAt(0) || "P"}
                            </div>
                          )}
                          <span>{getProviderName(method)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Estimated Price Warning */}
        <div
          className={`flex items-start ${isDark ? "text-white" : "text-[#1F2937]"} text-xs sm:text-sm lg:text-sm mt-2 mb-4`}
        >
          <AlertCircle className="w-4 h-4 text-[#E23D3A] mr-2 mt-0.5 flex-shrink-0" />
          <span>
            {t(
              "rates.alert.estimate",
              "This is only estimated price and its based on current Market Price. We will fix the price when we receive the funds."
            )}
          </span>
        </div>

        {/* Amount & Fees */}
        <div
          className={`border ${isDark ? "border-[#35353E]" : "border-[#E8EFF5]"} rounded-xl p-4 bg-transparent mb-4`}
        >
          <p
            className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-sm font-medium mb-2`}
          >
            {t("rates.amountAndFees", "Amount & Fees")}
          </p>
          <div className="flex flex-col lg:flex-row gap-7 items-center">
            <div className="flex-1 flex flex-col justify-start">
              <span
                className={`${isDark ? "text-white" : "text-[#1F2937]"} text-sm mb-2`}
              >
                {t("rates.netAmount", "Net Amount to Transfer")}
              </span>
              <div className="max-w-xl">
                <div
                  className={`w-full ${isDark ? "bg-[#35353E]" : "bg-white"} border ${isDark ? "border-[#35353E]" : "border-[#E8EFF5]"} rounded-2xl flex items-center px-2 py-2`}
                >
                  <button className="flex-1 flex items-center justify-center bg-transparent">
                    <span
                      className={`${isDark ? "text-[#BDF4D8]" : "text-[#051015]"} text-sm ml-4`}
                    >
                      {t(
                        "rates.amountIncludingFees",
                        "Amount including Total Fees"
                      )}
                    </span>
                    <span className="bg-[#1D8751] text-white text-lg font-semibold rounded-full px-8 py-1 ml-2">
                      ${amountIncludingFees.toFixed(2)}
                    </span>
                  </button>
                </div>
              </div>
            </div>
            {/* Right: Fee Breakdown */}
            <div
              className={`max-w-lg flex flex-col justify-between ${isDark ? "bg-[#1D1D23]" : "bg-white"} border ${isDark ? "border-accent" : "border-[#E8EFF5]"} rounded-md px-4 py-3`}
            >
              <div className="flex justify-between gap-20 text-sm mb-1">
                <span className={isDark ? "text-[#E8EFF5]" : "text-[#051015]"}>
                  {t("rates.commission", "Commission:")} {commissionRate}%
                </span>
                <span className="text-[#1D8751]">
                  ${commissionAmount.toFixed(2)}
                </span>
              </div>
              <div
                className={`border-t ${isDark ? "border-[#35353E]" : "border-[#E8EFF5]"} mt-2 pt-2 flex justify-between text-sm`}
              >
                <span className="text-[#F79330] font-semibold">
                  {t("rates.totalFees", "Total Fees")}
                </span>
                <span className="text-[#F79330] font-semibold">
                  ${commissionAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start sm:items-center text-[#F79330] text-sm sm:text-lg mb-6 p-3 rounded-md gap-2 sm:gap-0">
          <FiInfo className="text-[#F79330] flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 mt-0.5 sm:mt-0" />
          <p className="ml-0 sm:ml-2 text-gray-700 dark:text-gray-300 text-xs sm:text-base">
            {t(
              "rates.feeInfo",
              "Transactions are subject to commission, above is the information on the commission rates"
            )}
          </p>
        </div>

        {/* Exchange Now Button - Only show if first card not submitted */}
        {!isFirstCardSubmitted && (
          <button
            onClick={handleExchange}
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-white bg-[#1D8751] hover:bg-[#0f8f4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {isSubmitting ? t("rates.processing", "Processing...") : "Submit"}
          </button>
        )}

        {/* Bank Account Address Section - Show after first card is submitted */}
        {isFirstCardSubmitted && (
          <>
            <div
              ref={paymentDetailsRef}
              className={`flex flex-col ${isDark ? "bg-[#1D1D23]" : "bg-white"} border-2 ${isDark ? "border-[#35353E]" : "border-[#E2E8F0]"} rounded-2xl p-4 sm:p-5 shadow-lg w-full mb-4`}
            >
              <h2
                className={`text-xl font-bold mb-4 ${isDark ? "text-[#788099]" : "text-[#475569]"} inline-flex items-center gap-2`}
              >
                <span className={isDark ? "text-[#788099]" : "text-[#475569]"}>
                  2-
                </span>
                Bank Account Address
              </h2>

              {/* Bank Account Address Label */}
              <label
                className={`block text-base ${isDark ? "text-[#788099]" : "text-[#475569]"} mb-2 font-semibold`}
              >
                {t("rates.bankAccountAddress", "Bank Account Address")}
              </label>

              {/* Input group */}
              <div
                className={`flex items-center ${isDark ? "bg-[#1D1D23]" : "bg-white"} border ${isDark ? "border-[#35353E]" : "border-[#E2E8F0]"} rounded-2xl px-4 py-2 mb-2 overflow-hidden gap-2`}
              >
                {/* Left icon */}
                <span className="text-[#1D8751] flex-shrink-0">
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
                  placeholder={t("rates.pasteAccountAddressPlaceholder", "Paste here your Bank Account Address")}
                  className={`flex-1 min-w-0 bg-transparent border-none outline-none ${isDark ? "text-[#788099]" : "text-[#475569]"} placeholder-[#788099] text-sm sm:text-base ${bankAddressError
                    ? "border-red-500"
                    : bankAccountAddress.trim() && !bankAddressError
                      ? "border-green-500"
                      : ""
                    }`}
                />
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
                  className={`flex items-center justify-center gap-1 ${isDark ? "bg-[#1D1D23]" : "bg-white"} border border-[#1D8751] text-[#1D8751] rounded-full p-0 w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 ml-2 font-semibold text-sm hover:bg-[#1D8751] hover:text-white transition-colors flex-shrink-0 whitespace-nowrap`}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M19 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-2h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="hidden sm:inline">{t("rates.paste", "Paste")}</span>
                </button>
              </div>

              {/* Show validation messages */}
              {bankAddressError && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                  ❌ {bankAddressError}
                </p>
              )}

              {/* Terms and Conditions Summary */}
              <div className="flex items-center mb-2 mt-4 gap-2">
                <span className="text-[#1D8751] flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24">
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
                <span
                  className={`text-sm sm:text-base font-semibold ${isDark ? "text-[#788099]" : "text-[#475569]"}`}
                >
                  {t("rates.termsSummary", "Terms and Conditions Summary")}
                </span>
              </div>
              <div
                className={`border border-[#1D8751] rounded-xl p-3 sm:p-4 ${isDark ? "bg-[#1D1D23]" : "bg-[#F8FAFF]"
                  }`}
              >
                <ul className="list-none space-y-1.5 sm:space-y-2">
                  <li className="flex items-start gap-2 sm:gap-3">
                    <span className="w-2 h-2 sm:w-3 sm:h-3 mt-0.5 sm:mt-1 rounded-full bg-[#1D8751] inline-block shrink-0"></span>
                    <span
                      className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-xs sm:text-sm leading-relaxed`}
                    >
                      {t("rates.termsOwnAccount", "Please send the money from your own account Only")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3">
                    <span className="w-2 h-2 sm:w-3 sm:h-3 mt-0.5 sm:mt-1 rounded-full bg-[#1D8751] inline-block shrink-0"></span>
                    <span
                      className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-xs sm:text-sm leading-relaxed`}
                    >
                      {t("rates.termsTransactionId", "Put transaction ID in the description field of the bank")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3">
                    <span className="w-2 h-2 sm:w-3 sm:h-3 mt-0.5 sm:mt-1 rounded-full bg-[#1D8751] inline-block shrink-0"></span>
                    <span
                      className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-xs sm:text-sm leading-relaxed`}
                    >
                      {t("rates.termsReject", "Please note, If you do not follow above conditions, we will reject your transaction and send you back your money.")}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Acceptance checkbox */}
              <label
                className={`flex mb-4 items-start gap-2 mt-4 text-sm cursor-pointer ${isDark ? "text-[#788099]" : "text-[#475569]"}`}
              >
                <div className="relative flex items-center pr-2">
                  <input
                    type="checkbox"
                    checked={isAddressConfirmed}
                    onChange={(event) =>
                      setIsAddressConfirmed(event.target.checked)
                    }
                    className="
                      peer appearance-none w-5 h-5 rounded border border-gray-300 dark:border-gray-500 bg-transparent
                      checked:bg-[#1D8751] checked:border-[#1D8751]
                      focus:outline-none transition-colors cursor-pointer mt-0.5
                    "
                  />
                  <svg
                    className="absolute w-3.5 h-3.5 mt-0.5 left-[3px] pointer-events-none opacity-0 peer-checked:opacity-100 text-white transition-opacity duration-200"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span>I have read and agreed to Omaya Exchange <a href="/terms" className="text-[#1D8751] underline">Terms of Use</a>, <a href="/privacy" className="text-[#1D8751] underline">Privacy Policy</a></span>
              </label>
            </div>

            {/* Final Submit Button */}
            <button
              className={`w-full text-base font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-white ${!bankAccountAddress.trim() ||
                bankAddressError ||
                !isAddressConfirmed ||
                isUpdatingTransaction ||
                !user?.is_verified
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-[#1D8751] hover:bg-[#166b3e]"
                }`}
              onClick={handleBankAccountSubmit}
              disabled={
                !bankAccountAddress.trim() ||
                !!bankAddressError ||
                !isAddressConfirmed ||
                isUpdatingTransaction ||
                !user?.is_verified
              }
            >
              {isUpdatingTransaction ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{t("rates.processing", "Processing...")}</span>
                </div>
              ) : (
                <span className="text-base font-medium text-white">
                  Submit
                </span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MoneyXRates;
