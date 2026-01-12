"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch } from "@/store";
import {
  fetchPublicPaymentMethods,
  fetchAdminPaymentMethods,
} from "@/features/p2p/slices/paymentMethodsSlice";
import {
  createMoneyXTransaction,
  updateMoneyXTransaction,
} from "../slices/moneyXSlice";
import { useTheme } from "@/context/theme";
import CustomSelect from "@/components/ui/HomeCommonSelect";
import { showToast } from "@/lib/utils/toast";
import { usePaymentMethodsDisplay } from "@/features/express/hooks/useDataDisplay";
import { setAuthRedirectPath } from "@/lib/utils/authRedirect";

interface TransferFormProps {
  isHomePage?: boolean;
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

export default function TransferForm({ isHomePage = false, onTransfer }: TransferFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
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

  const { isAuthenticated } = useSelector((state: any) => state.auth);
  const requiresLoginRedirect = isHomePage && !isAuthenticated;

  // Use state to hold payment methods - will trigger re-render when updated
  const [stablePaymentMethods, setStablePaymentMethods] = useState<any[]>([]);

  // Use appropriate payment methods data based on isHomePage
  const paymentMethodsData = isHomePage ? publicPaymentMethods : adminMethods;
  const paymentMethodsLoading = isHomePage ? publicMethodsLoading : adminMethodsLoading;
  const paymentMethodsError = isHomePage ? publicMethodsError : adminMethodsError;

  const paymentMethodsDisplay = usePaymentMethodsDisplay(
    paymentMethodsData,
    paymentMethodsLoading,
    paymentMethodsError
  );

  // Fetch payment methods on mount
  useEffect(() => {
    if (isHomePage) {
      dispatch(fetchPublicPaymentMethods());
    } else {
      dispatch(fetchAdminPaymentMethods());
    }
  }, [dispatch, isHomePage]);

  // Process payment methods similar to deposit form
  useEffect(() => {
    const methodsToProcess = isHomePage ? publicPaymentMethods : adminMethods;
    
    // Handle public payment methods structure (similar to ExchangeForm)
    let processedMethods: any[] = [];
    if (isHomePage && publicPaymentMethods) {
      // Check for providers array (new structure)
      if (Array.isArray(publicPaymentMethods?.data?.providers)) {
        processedMethods = publicPaymentMethods.data.providers;
      }
      // Check for payment_methods array (older structure)
      else if (Array.isArray(publicPaymentMethods?.data?.payment_methods)) {
        processedMethods = publicPaymentMethods.data.payment_methods;
      }
      // Check if publicPaymentMethods itself is an array (fallback)
      else if (Array.isArray(publicPaymentMethods)) {
        processedMethods = publicPaymentMethods;
      }
    } else if (adminMethods && Array.isArray(adminMethods)) {
      processedMethods = adminMethods;
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
          // Extract provider_name for public methods
          provider_name: payment.provider_name || payment.provider?.provider_name || payment.method?.method_name || payment.payment_method_name,
        }));

      if (activeMethods.length > 0) {
        setStablePaymentMethods(activeMethods);
      }
    }
  }, [adminMethods, publicPaymentMethods, isHomePage]);


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

  // Helper function to get provider name from payment method (cleaned - removes method suffixes)
  // Removes method suffixes like "- Bank", "- Mobile", "- Crypto", etc.
  const getProviderName = useCallback((payment: any) => {
    let providerName = payment?.provider_name || payment?.provider?.provider_name || payment?.provider || payment?.method?.method_name || payment?.payment_method_name || "";
    
    // Remove common method suffixes (case-insensitive)
    // Matches patterns like "- Bank", "- Mobile", "- Crypto", "- Forex", "- Marchant", "- Money Transfer", etc.
    providerName = providerName.replace(/\s*-\s*(Bank|Mobile|Crypto|Forex|Marchant|Money\s*Transfer|Merchant)\s*$/i, "").trim();
    
    return providerName;
  }, []);

  // Helper function to check if a payment method is a bank
  const isBankMethod = useCallback((method: any) => {
    if (!method) return false;
    const providerName = getProviderName(method).toLowerCase();
    const paymentMethod = (method?.payment_method || "").toLowerCase();
    const paymentMethodType = (method?.payment_method_type || "").toLowerCase();
    const provider = (method?.provider || "").toLowerCase();
    
    return (
      providerName.includes("bank") ||
      paymentMethod.includes("bank") ||
      paymentMethodType.includes("bank") ||
      provider.includes("bank")
    );
  }, [getProviderName]);

  // Restore state from localStorage after login (only for home page)
  const hasRestoredState = useRef(false);
  const paymentMethodRestoreAttempted = useRef(false);
  
  useEffect(() => {
    if (!isHomePage || hasRestoredState.current || !isAuthenticated) {
      return;
    }

    try {
      const savedState = localStorage.getItem("moneyx_form_state");
      if (savedState) {
        const state = JSON.parse(savedState);
        
        console.log("Restoring moneyx form state:", state);
        
        // Restore amounts immediately
        if (state.amountInput !== undefined && state.amountInput !== null) {
          setPayAmountInput(state.amountInput);
          setPayAmount(state.amountValue || parseFloat(state.amountInput) || 0);
        }
        if (state.receiveAmountInput !== undefined && state.receiveAmountInput !== null) {
          setGetAmountInput(state.receiveAmountInput);
          setGetAmount(state.receiveAmountValue || parseFloat(state.receiveAmountInput) || 0);
        }

        // Store payment method data for later restoration (after payment methods are loaded)
        if (state.fromPaymentMethod || state.toPaymentMethod) {
          localStorage.setItem("moneyx_restore_from", state.fromPaymentMethod || "");
          localStorage.setItem("moneyx_restore_to", state.toPaymentMethod || "");
          if (state.fromPaymentDetail) {
            localStorage.setItem("moneyx_restore_from_detail", JSON.stringify(state.fromPaymentDetail));
          }
          if (state.toPaymentDetail) {
            localStorage.setItem("moneyx_restore_to_detail", JSON.stringify(state.toPaymentDetail));
          }
        }

        // Clear the saved state
        localStorage.removeItem("moneyx_form_state");
        hasRestoredState.current = true;
      }
    } catch (error) {
      console.error("Failed to restore moneyx form state:", error);
    }
  }, [isHomePage, isAuthenticated]);

  // Restore payment methods after they're loaded
  useEffect(() => {
    if (!isHomePage || !isAuthenticated || !Array.isArray(finalPaymentMethods) || finalPaymentMethods.length === 0) {
      return;
    }

    // Only attempt restoration once
    if (paymentMethodRestoreAttempted.current) {
      return;
    }

    const restoreFrom = localStorage.getItem("moneyx_restore_from");
    const restoreTo = localStorage.getItem("moneyx_restore_to");
    
    if (restoreFrom || restoreTo) {
      console.log("Restoring payment methods - From:", restoreFrom, "To:", restoreTo);
      paymentMethodRestoreAttempted.current = true;
      
      // Restore "from" payment method
      if (restoreFrom) {
        const savedFromDetail = localStorage.getItem("moneyx_restore_from_detail");
        let matchedFromMethod = null;

        if (savedFromDetail) {
          try {
            const fromDetail = JSON.parse(savedFromDetail);
            console.log("Trying to match from payment detail:", fromDetail);
            
            // Try multiple matching strategies
            matchedFromMethod = finalPaymentMethods.find(
              (m: any) => {
                const providerName = getProviderName(m);
                return (
                  (m.id && m.id === fromDetail.id) ||
                  (m.provider_id && m.provider_id === fromDetail.provider_id) ||
                  (m.providerId && m.providerId === fromDetail.providerId) ||
                  (providerName === restoreFrom) ||
                  (providerName === fromDetail.provider_name) ||
                  (m.provider_name === fromDetail.provider_name)
                );
              }
            );
          } catch (e) {
            console.error("Failed to parse from payment detail:", e);
          }
        }

        // If no match by ID, try by name
        if (!matchedFromMethod) {
          matchedFromMethod = finalPaymentMethods.find(
            (m: any) => getProviderName(m) === restoreFrom
          );
        }

        if (matchedFromMethod) {
          console.log("Matched from payment method:", matchedFromMethod);
          setFromPaymentMethod(restoreFrom);
          setSelectedFromPaymentDetail(matchedFromMethod);
        } else {
          console.warn("Could not match from payment method:", restoreFrom);
        }
      }

      // Restore "to" payment method
      if (restoreTo) {
        const savedToDetail = localStorage.getItem("moneyx_restore_to_detail");
        let matchedToMethod = null;

        if (savedToDetail) {
          try {
            const toDetail = JSON.parse(savedToDetail);
            console.log("Trying to match to payment detail:", toDetail);
            
            // Try multiple matching strategies
            matchedToMethod = finalPaymentMethods.find(
              (m: any) => {
                const providerName = getProviderName(m);
                return (
                  (m.id && m.id === toDetail.id) ||
                  (m.provider_id && m.provider_id === toDetail.provider_id) ||
                  (m.providerId && m.providerId === toDetail.providerId) ||
                  (providerName === restoreTo) ||
                  (providerName === toDetail.provider_name) ||
                  (m.provider_name === toDetail.provider_name)
                );
              }
            );
          } catch (e) {
            console.error("Failed to parse to payment detail:", e);
          }
        }

        // If no match by ID, try by name
        if (!matchedToMethod) {
          matchedToMethod = finalPaymentMethods.find(
            (m: any) => getProviderName(m) === restoreTo
          );
        }

        if (matchedToMethod) {
          console.log("Matched to payment method:", matchedToMethod);
          setToPaymentMethod(restoreTo);
          setSelectedToPaymentDetail(matchedToMethod);
        } else {
          console.warn("Could not match to payment method:", restoreTo);
        }
      }

      // Clear restoration keys after attempting restoration
      localStorage.removeItem("moneyx_restore_from");
      localStorage.removeItem("moneyx_restore_to");
      localStorage.removeItem("moneyx_restore_from_detail");
      localStorage.removeItem("moneyx_restore_to_detail");
    }
  }, [finalPaymentMethods, isHomePage, isAuthenticated, getProviderName]);

  // Auto-select first payment method for "from" when payment methods are loaded (only if not restored)
  useEffect(() => {
    if (!Array.isArray(finalPaymentMethods) || finalPaymentMethods.length === 0) {
      return;
    }

    // Skip auto-selection if we're restoring state or if restoration was attempted
    const isRestoring = localStorage.getItem("moneyx_restore_from") || localStorage.getItem("moneyx_restore_to");
    if (isRestoring || paymentMethodRestoreAttempted.current) {
      return;
    }

    // Check if current selection still exists in the latest list (using cleaned names)
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
    // Skip auto-selection if we're restoring state or if restoration was attempted
    const isRestoring = localStorage.getItem("moneyx_restore_from") || localStorage.getItem("moneyx_restore_to");
    if (isRestoring || paymentMethodRestoreAttempted.current) {
      return;
    }

    // Only run if we have payment methods, "from" is selected, and "to" is not selected
    const methodsToCheck = Array.isArray(finalPaymentMethods) && finalPaymentMethods.length > 0
      ? finalPaymentMethods
      : (Array.isArray(stablePaymentMethods) && stablePaymentMethods.length > 0
        ? stablePaymentMethods
        : null);
    
    if (methodsToCheck && methodsToCheck.length > 1 && fromPaymentMethod && !toPaymentMethod) {
      // Filter for banks first
      const bankMethods = methodsToCheck.filter(isBankMethod);
      
      // Select the second bank (index 1) if it exists, otherwise select the second method overall
      let methodToSelect;
      if (bankMethods.length > 1) {
        // Select the second bank in the array (index 1)
        methodToSelect = bankMethods[1];
      } else if (bankMethods.length === 1 && methodsToCheck.length > 1) {
        // If only one bank exists, select the second method overall (index 1) if it's different from "from"
        if (methodsToCheck[1] && getProviderName(methodsToCheck[1]) !== fromPaymentMethod) {
          methodToSelect = methodsToCheck[1];
        } else {
          // Find first method that's different from "from"
          methodToSelect = methodsToCheck.find(
            (method) => getProviderName(method) !== fromPaymentMethod
          );
        }
      } else {
        // No banks or only one method, select the second method (index 1) if it's different from "from"
        if (methodsToCheck[1] && getProviderName(methodsToCheck[1]) !== fromPaymentMethod) {
          methodToSelect = methodsToCheck[1];
        } else {
          // Find first method that's different from "from"
          methodToSelect = methodsToCheck.find(
            (method) => getProviderName(method) !== fromPaymentMethod
          );
        }
      }
      
      const providerName = getProviderName(methodToSelect);
      if (providerName) {
        setToPaymentMethod(providerName);
        setSelectedToPaymentDetail(methodToSelect);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalPaymentMethods, stablePaymentMethods, fromPaymentMethod, adminMethods, getProviderName]);

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

    // Get provider name - handle both admin and public payment methods structure
    let providerName = payment.provider_name || payment.provider?.provider_name || payment.method?.method_name || payment.payment_method_name || "";
    const paymentMethod = payment.payment_method || payment.payment_method_type || payment.method?.method_display || payment.method?.method_name || "";

    // Clean provider name - remove "- Bank" suffix if present
    providerName = providerName.replace(/\s*-\s*Bank\s*$/i, "").trim();
    
    // Create subtitle: Provider - Method
    const subtitle = paymentMethod ? `${providerName} - ${paymentMethod}` : null;

    return {
      value: providerName,
      // Show only provider name (remove - {method} part) for cleaner display
      label: providerName,
      subtitle: subtitle || undefined,
      logo: logoUrl,
      raw: payment,
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
    // Check if user needs to login first
    if (requiresLoginRedirect) {
      // Save state to localStorage for restoration after login
      // Get the base provider name (without suffix) for better matching
      const fromProviderBase = selectedFromPaymentDetail?.provider || getProviderName(selectedFromPaymentDetail) || fromPaymentMethod;
      const toProviderBase = selectedToPaymentDetail?.provider || getProviderName(selectedToPaymentDetail) || toPaymentMethod;
      
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
        fromPaymentDetail: selectedFromPaymentDetail ? { ...selectedFromPaymentDetail } : null,
        toPaymentDetail: selectedToPaymentDetail ? { ...selectedToPaymentDetail } : null,
      };
      
      console.log("💾 [Home] Saving moneyx form state before login:", state);
      console.log("💾 [Home] From payment detail:", selectedFromPaymentDetail);
      console.log("💾 [Home] To payment detail:", selectedToPaymentDetail);
      
      // Save to localStorage
      localStorage.setItem("moneyx_form_state", JSON.stringify(state));
      
      // Set redirect path - redirect to moneyX in dashboard
      const redirectPath = `/dashboard/exchange?mode=moneyx&source=public-express`;
      setAuthRedirectPath(redirectPath);
      
      // Redirect to login
      router.push("/auth/login");
      return;
    }

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
      <div className="mb-2" />
    
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
      
      
      <div className={`w-full ${isDark ? "text-white" : "text-[#1F2937]"}`}>
        {/* Top Section - Amount and From Payment Method in one card */}
        <div className="relative mb-4">
          {/* Top Card Container */}
          <div
            data-asset-card="true"
            data-select-card="true"
            className={`relative flex flex-col sm:flex-row gap-4 rounded-2xl p-3 sm:p-4 overflow-visible ${
              isDark ? "bg-[#0F0F17] border border-[#2F2F3A]" : "bg-white border border-[#E2E8F0] shadow-sm"
            }`}
          >
            {/* Amount Section */}
            <div className="flex-1 min-w-0">
              <label
                className={`block text-[15px] mb-2 font-semibold flex items-center gap-2 ${
                  isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                }`}
              >
                You Send
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
              </label>
              <div className={`text-xs mb-1 ${
                isDark ? "text-[#788099]" : "text-[#64748B]"
              }`}>
                Amount
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={payAmountInput}
                  onChange={(e) => {
                    handleAmountChange(e.target.value, true);
                  }}
                  placeholder="Enter amount"
                  className={`w-full rounded-2xl px-4 py-2 pr-16 text-lg focus:outline-none border appearance-none bg-transparent ${
                    isDark ? "border-white/10 text-white" : "border-gray-200 text-[#111827]"
                  }`}
                />
              </div>
            </div>

            {/* From Payment Method Section */}
            <div className="flex-1 min-w-0">
              <div className={`text-xs mb-1 mt-[30px] ${
                isDark ? "text-[#788099]" : "text-[#64748B]"
              }`}>
                Payment Method
              </div>
              <div className="relative">
                <CustomSelect
                  options={paymentMethodOptions}
                  value={fromPaymentMethod}
                  className="w-full"
                  placeholderClassName="text-white dark:text-white"
                  triggerClassName={`px-4 py-2 text-lg border rounded-2xl bg-transparent ${
                    isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200"
                  }`}
                  onChange={(value) => {
                    const selectedPayment = finalPaymentMethods?.find(
                      (payment: any) => {
                        const providerName = getProviderName(payment);
                        return providerName === value;
                      }
                    );
                    setFromPaymentMethod(value);
                    setSelectedFromPaymentDetail(selectedPayment || null);
                    setValidationErrors([]);
                  }}
                  placeholder={
                    paymentMethodsDisplay.isLoading && finalPaymentMethods.length === 0
                      ? "Loading payment methods..."
                      : "Payment Method"
                  }
                  disabled={paymentMethodsDisplay.isLoading && finalPaymentMethods.length === 0}
                  loading={paymentMethodsDisplay.isLoading && finalPaymentMethods.length === 0}
                  loadingText="Loading payment methods..."
                  emptyText="No payment methods available"
                  searchable={true}
                  dropdownTitle="Payment method"
                  dropdownOffsetY={-68}
                  dropdownOffsetX={20}
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
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105"
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
                className="w-10 h-10 dark:hidden"
              />
              {/* Dark mode image */}
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1755500509/Frame_36261_ledmyw.png"
                alt="swap icon"
                className="w-10 h-10 hidden dark:block"
              />
            </button>
          </div>
        </div>

        {/* Bottom Section - You Receive and To Payment Method in one card */}
        <div className="relative mb-3">
          <div
            data-asset-card="true"
            className={`relative flex flex-col sm:flex-row gap-4 rounded-2xl p-3 sm:p-4 overflow-visible ${
              isDark ? "bg-[#0F0F17] border border-[#2F2F3A]" : "bg-white border border-[#E2E8F0] shadow-sm"
            }`}
          >
            {/* You Receive Section */}
            <div className="flex-1 min-w-0">
              <label
                className={`block text-[15px] mb-2 font-semibold flex items-center gap-2 ${
                  isDark ? "text-[#9CA3AF]" : "text-[#475569]"
                }`}
              >
                You Receive
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
              </label>
              <div className={`text-xs mb-1 ${
                isDark ? "text-[#788099]" : "text-[#64748B]"
              }`}>
                Amount
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={getAmountInput}
                  onChange={(e) => {
                    handleAmountChange(e.target.value, false);
                  }}
                  placeholder="Enter amount"
                  className={`w-full rounded-2xl px-4 py-2 pr-16 text-lg focus:outline-none border appearance-none bg-transparent ${
                    isDark ? "border-white/10 text-white" : "border-gray-200 text-[#111827]"
                  }`}
                />
              </div>
            </div>

            {/* To Payment Method Section */}
            <div className="flex-1 min-w-0">
              <div className={`text-xs mb-1 mt-[30px] ${
                isDark ? "text-[#788099]" : "text-[#64748B]"
              }`}>
                Payment Method
              </div>
              <div className="relative">
                <CustomSelect
                  options={paymentMethodOptions.filter(
                    (opt) => opt.value !== fromPaymentMethod
                  )}
                  value={toPaymentMethod}
                  className="w-full"
                  placeholderClassName="text-white dark:text-white"
                  triggerClassName={`px-4 py-2 text-lg border rounded-2xl bg-transparent ${
                    isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200"
                  }`}
                  onChange={(value) => {
                    const selectedPayment = finalPaymentMethods?.find(
                      (payment: any) => {
                        const providerName = getProviderName(payment);
                        return providerName === value;
                      }
                    );
                    setToPaymentMethod(value);
                    setSelectedToPaymentDetail(selectedPayment || null);
                    setValidationErrors([]);
                  }}
                  placeholder={
                    paymentMethodsDisplay.isLoading && finalPaymentMethods.length === 0
                      ? "Loading payment methods..."
                      : "Payment Method"
                  }
                  disabled={paymentMethodsDisplay.isLoading && finalPaymentMethods.length === 0}
                  loading={paymentMethodsDisplay.isLoading && finalPaymentMethods.length === 0}
                  loadingText="Loading payment methods..."
                  emptyText="No payment methods available"
                  searchable={true}
                  dropdownTitle="Payment method"
                  dropdownOffsetY={-68}
                  dropdownOffsetX={20}
                />
              </div>
              {adminMethodsError && (
                <p className="text-red-500 text-sm mt-1">{adminMethodsError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Validation Errors Display */}
        {validationErrors.length > 0 && (
          <div className="w-full px-2 mb-4">
            <div
              className={`border border-[#1D8751] rounded-2xl p-3 sm:p-4 ${
                isDark ? "bg-[#1D1D23]" : "bg-[#F8FAFF]"
              }`}
            >
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

        {/* Warning Message */}
        {!isFirstCardSubmitted && (
          <div className="mt-4 mb-3 flex items-center gap-3 p-3 rounded-2xl bg-transparent">
            <img
              src="https://res.cloudinary.com/pitz/image/upload/v1765784047/alert-circle_1_ujybne.png"
              alt="Warning"
              className="w-5 h-5 flex-shrink-0"
            />
            <p className={`text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
              This is only an estimated price based on current market rates. The final price will be confirmed when we receive the funds.
            </p>
          </div>
        )}

        {/* Submit Button for First Card */}
        {!isFirstCardSubmitted && (
          <div className="relative">
            <button
              type="button"
              className={`w-full text-base font-medium py-1.5 rounded-full flex items-center justify-center gap-2 transition-colors text-white ${
                isTransferDisabled
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#1D8751] hover:bg-[#1D8751]/80"
              }`}
              onClick={handleFirstCardSubmit}
              disabled={isTransferDisabled}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#35353e] dark:border-[#788099]"></div>
                  <span>Posting...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="text-base font-medium text-white">MoneyX</span>
                    
                </span>
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
            className="flex flex-col dark:bg-[#1D1D23] border-2 border-[#35353E] rounded-2xl p-3 sm:p-5 shadow-lg w-full text-[#35353e] dark:text-[#788099] mb-6"
          >
            {/* Bank Account Address Label */}
            <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
              Bank Account Address
            </label>
            {/* Input group */}
            <div className="flex items-center dark:bg-[#1D1D23] border border-[#39394a] dark:border-[#35353E] rounded-2xl px-2 sm:px-4 py-2 mb-0 overflow-hidden gap-1 sm:gap-2">
              {/* Left icon */}
              <span className="text-[#1D8751] flex-shrink-0">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" className="w-5 h-5 sm:w-[22px] sm:h-[22px]">
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
                className={`flex-1 min-w-0 bg-transparent border-none outline-none text-[#35353e] dark:text-[#788099] placeholder-[#788099] text-sm sm:text-base ${
                  bankAddressError
                    ? "border-red-500"
                    : bankAccountAddress.trim() && !bankAddressError
                      ? "border-green-500"
                      : ""
                }`}
              />
              {/* Bookmark icon - hidden on small screens */}
              <span className="hidden sm:block mx-1 sm:mx-2 text-[#788099] cursor-pointer flex-shrink-0">
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
                text-[#1D8751] rounded-full px-2 sm:px-3 py-1.5 sm:py-2 ml-1 sm:ml-2 font-semibold text-xs sm:text-sm hover:bg-[#1D8751] hover:text-white transition-colors min-h-[36px] sm:min-h-[44px] touch-manipulation flex-shrink-0 whitespace-nowrap"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="w-4 h-4 sm:w-[18px] sm:h-[18px]">
                  <path
                    d="M19 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-2h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="hidden sm:inline">Paste</span>
              </button>
            </div>

            {/* Show validation messages below the bank account address input */}
            {bankAddressError && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                ❌ {bankAddressError}
              </p>
            )}

            {/* MoneyX Terms and Conditions */}
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
                MoneyX – Terms & Conditions
              </span>
            </div>
            <div
              className={`border border-[#1D8751] rounded-xl p-4 ${
                isDark ? "bg-[#1D1D23]" : "bg-[#F8FAFF]"
              }`}
            >
              <p className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-sm mb-3`}>
                Before proceeding, please carefully read and agree to the following terms:
              </p>
              <ul className="list-none space-y-3">
                <li className="flex items-start">
                  <span className="w-2 h-2 mt-1.5 rounded-full bg-[#1D8751] inline-block mr-3 shrink-0"></span>
                  <div>
                    <span className={`${isDark ? "text-white" : "text-gray-900"} text-sm font-semibold block`}>Ownership of sending and receiving accounts</span>
                    <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-sm`}>
                      You must use a wallet, bank account, or mobile money number that you personally own and control. Third-party accounts are not allowed.
                    </span>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 mt-1.5 rounded-full bg-[#1D8751] inline-block mr-3 shrink-0"></span>
                  <div>
                    <span className={`${isDark ? "text-white" : "text-gray-900"} text-sm font-semibold block`}>Provide correct sending and receiving details</span>
                    <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-sm`}>
                      You must enter the correct details for the transaction. Always verify all details before confirming.
                    </span>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 mt-1.5 rounded-full bg-[#1D8751] inline-block mr-3 shrink-0"></span>
                  <div>
                    <span className={`${isDark ? "text-white" : "text-gray-900"} text-sm font-semibold block`}>Send funds only to our official accounts</span>
                    <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-sm`}>
                      You must send funds only to the OMAYA account displayed in the app. Sending to any other account is at your own risk.
                    </span>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 mt-1.5 rounded-full bg-[#1D8751] inline-block mr-3 shrink-0"></span>
                  <div>
                    <span className={`${isDark ? "text-white" : "text-gray-900"} text-sm font-semibold block`}>Irreversible transactions & user responsibility</span>
                    <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-sm`}>
                      Transactions are irreversible. If you enter incorrect details, funds may be permanently lost.
                    </span>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 mt-1.5 rounded-full bg-[#1D8751] inline-block mr-3 shrink-0"></span>
                  <div>
                    <span className={`${isDark ? "text-white" : "text-gray-900"} text-sm font-semibold block`}>Transaction time limit</span>
                    <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-sm`}>
                      You must send funds only while the transaction timer is active. Transactions sent after timer expiry may be rejected or lost.
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Warning Message */}
          <div className="mt-4 mb-3 flex items-center gap-3 p-3 rounded-2xl bg-transparent">
            <img
              src="https://res.cloudinary.com/pitz/image/upload/v1765784047/alert-circle_1_ujybne.png"
              alt="Warning"
              className="w-5 h-5 flex-shrink-0"
            />
            <p className={`text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
              This is only an estimated price based on current market rates. The final price will be confirmed when we receive the funds.
            </p>
          </div>

          {/* Final Submit Button */}
          <div className="flex flex-col gap-3 w-full px-2">
            <button
              className={`w-full text-base font-medium py-1.5 rounded-full flex items-center justify-center gap-2 transition-colors text-white ${
                !bankAccountAddress.trim() || bankAddressError || !isAddressConfirmed
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#1D8751] hover:bg-[#1D8751]/80"
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
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#35353e] dark:border-[#35353E]"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="text-base font-medium text-white">MoneyX</span>
                  <img
                    className="h-5 w-auto mt-3"
                    src="https://res.cloudinary.com/pitz/image/upload/v1752244135/Group_5_gkxzdz.png"
                    alt="MoneyX icon"
                  />
                </span>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
