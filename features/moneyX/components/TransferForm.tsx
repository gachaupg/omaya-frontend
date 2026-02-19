"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import {
  fetchPublicPaymentMethods,
  fetchAdminPaymentMethods,
} from "@/features/p2p/slices/paymentMethodsSlice";
import {
  createMoneyXTransaction,
  updateMoneyXTransaction,
  fetchMoneyXCommission,
} from "../slices/moneyXSlice";
import { useTheme } from "@/context/theme";
import CustomSelect from "@/components/ui/CustomSelect";
import { showToast } from "../../../lib/utils/toast";
import { useBookmarkedAddresses } from "@/features/express/hooks/useBookmarkedAddresses";
import { BookmarkDropdown } from "@/features/express/components/forms/BookmarkDropdown";
import { usePaymentMethodsDisplay } from "../../express/hooks/useDataDisplay";
import { useExpressI18n } from "@/lib/useExpressI18n";

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
  const { t } = useExpressI18n();

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

  const { isAuthenticated, user } = useSelector((state: any) => state.auth);

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
    console.log("🔍 [Dashboard] Processing admin payment methods:", {
      adminMethodsExists: !!adminMethods,
      isArray: Array.isArray(adminMethods),
      length: adminMethods?.length || 0
    });

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

      console.log("✅ [Dashboard] Processed payment methods:", activeMethods.length);
      console.log("📋 [Dashboard] Payment method names:", activeMethods.map((m: any) => m.provider_name || m.provider || "N/A"));

      if (activeMethods.length > 0) {
        setStablePaymentMethods(activeMethods);
      } else {
        console.warn("⚠️ [Dashboard] No active payment methods found");
      }
    } else {
      console.warn("⚠️ [Dashboard] Admin methods not loaded or empty");
    }
  }, [adminMethods]);


  // Fallback payment methods (only used if no real payment methods are loaded)
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
    () => {
      // Only use fallback if we have NO real payment methods
      if (effectivePaymentMethods.length > 0) {
        console.log("✅ [Dashboard] Using real payment methods:", effectivePaymentMethods.length);
        return effectivePaymentMethods;
      } else {
        console.log("⚠️ [Dashboard] No real payment methods, using fallback");
        return fallbackPaymentMethods;
      }
    },
    [effectivePaymentMethods, fallbackPaymentMethods]
  );

  // Form state - matching deposit form structure
  // Initialize with empty values to allow restoration to work properly
  const [payAmount, setPayAmount] = useState(0);
  const [payAmountInput, setPayAmountInput] = useState("");
  const [getAmount, setGetAmount] = useState(0);
  const [getAmountInput, setGetAmountInput] = useState("");
  const [isCalculatingFromPay, setIsCalculatingFromPay] = useState(true);
  const [fromPaymentMethod, setFromPaymentMethod] = useState<string>("");
  const [toPaymentMethod, setToPaymentMethod] = useState<string>("");
  const [selectedFromPaymentDetail, setSelectedFromPaymentDetail] = useState<any>(null);
  const [selectedToPaymentDetail, setSelectedToPaymentDetail] = useState<any>(null);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const bookmarkAnchorRef = useRef<HTMLSpanElement>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingTransaction, setIsUpdatingTransaction] = useState(false);
  const [apiValidationError, setApiValidationError] = useState<string | null>(null);
  const [isFirstCardSubmitted, setIsFirstCardSubmitted] = useState(false);
  const [bankAccountAddress, setBankAccountAddress] = useState<string>("");
  const [bankAddressError, setBankAddressError] = useState<string | null>(null);
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [expandedTerms, setExpandedTerms] = useState(false);
  const [apiCommission, setApiCommission] = useState<number | null>(null);
  const [accountNumberCopied, setAccountNumberCopied] = useState(false);
  const commissionFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const paymentDetailsRef = useRef<HTMLDivElement>(null);

  // Amount for commission API - use pay when from pay, else approx send from receive (getAmount/0.98)
  const commissionFetchAmount = isCalculatingFromPay ? payAmount : (getAmount > 0 ? getAmount / 0.98 : 0);

  // Fetch commission from API when amount changes (API returns % e.g. {"commission":"2.00"} = 2%)
  useEffect(() => {
    const amount = commissionFetchAmount || payAmount || getAmount;
    if (!amount || amount <= 0) {
      setApiCommission(null);
      return;
    }
    if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
    commissionFetchTimeoutRef.current = setTimeout(() => {
      dispatch(fetchMoneyXCommission(amount))
        .unwrap()
        .then((commissionStr) => {
          const val = parseFloat(commissionStr) || 0;
          setApiCommission(val);
        })
        .catch(() => setApiCommission(null));
    }, 150);
    return () => {
      if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
    };
  }, [payAmount, getAmount, isCalculatingFromPay, dispatch]);

  // Recalculate the other field when apiCommission updates (API returns % e.g. 2 = 2%)
  useEffect(() => {
    const rate = apiCommission ?? 2;
    if (isCalculatingFromPay && payAmount > 0) {
      const calculatedGetAmount = Math.max(0, payAmount * (1 - rate / 100));
      setGetAmount(calculatedGetAmount);
      setGetAmountInput(calculatedGetAmount.toString());
    } else if (!isCalculatingFromPay && getAmount > 0) {
      const calculatedPayAmount = getAmount / (1 - rate / 100);
      setPayAmount(calculatedPayAmount);
      setPayAmountInput(calculatedPayAmount.toString());
    }
  }, [apiCommission]);

  // Helper function to get provider name from payment method
  // Removes method suffixes like "- Bank", "- Mobile", "- Crypto", etc.
  const getProviderName = useCallback((payment: any) => {
    if (!payment) return "";

    // Priority order: provider_name (dashboard) > provider (home page) > provider.provider_name > method.method_name (fallback)
    // Dashboard API has: provider_name: "Equity Bank", method: "Bank"
    // Home page API has: provider_name: "Equity Bank - Bank", provider: "Equity Bank"
    let providerName = payment.provider_name || payment.provider || payment.provider?.provider_name || "";

    // Only use method_name as last resort if no provider name exists
    if (!providerName || providerName.trim() === "") {
      providerName = payment.method?.method_name || payment.payment_method_name || "";
    }

    // Remove common method suffixes (case-insensitive)
    // Matches patterns like "- Bank", "- Mobile", "- Crypto", "- Forex", "- Marchant", "- Money Transfer", etc.
    providerName = providerName.replace(/\s*-\s*(Bank|Mobile|Crypto|Forex|Marchant|Money\s*Transfer|Merchant)\s*$/i, "").trim();

    return providerName;
  }, []);

  const currentBankAsset = selectedToPaymentDetail ? getProviderName(selectedToPaymentDetail) : "";
  const {
    bookmarks,
    loading: bookmarksLoading,
    saving: bookmarkSaving,
    fetchBookmarks,
    saveBookmark,
  } = useBookmarkedAddresses(currentBankAsset || "BANK", "BANK");

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

  // Helper function to check if a payment method is mobile money
  const isMobileMethod = useCallback((method: any) => {
    if (!method) return false;
    const providerName = getProviderName(method).toLowerCase();
    const paymentMethod = (method?.payment_method || "").toLowerCase();
    const paymentMethodType = (method?.payment_method_type || "").toLowerCase();
    const provider = (method?.provider || "").toLowerCase();
    const methodType = (method?.method || "").toLowerCase();

    // Common mobile money keywords
    const mobileKeywords = ['mobile', 'mpesa', 'm-pesa', 'mtn', 'airtel', 'safaricom', 'vodafone', 'telesom', 'hormuud', 'golis', 'evc', 'zaad', 'sahal'];

    return mobileKeywords.some(keyword =>
      providerName.includes(keyword) ||
      paymentMethod.includes(keyword) ||
      paymentMethodType.includes(keyword) ||
      provider.includes(keyword) ||
      methodType.includes(keyword)
    );
  }, [getProviderName]);

  // Restore state from localStorage after login (when navigating from home page)
  const hasRestoredState = useRef(false);
  const paymentMethodRestoreAttempted = useRef(false);

  // Restore state on mount and when authentication changes
  useEffect(() => {
    // Only restore if user is authenticated and we haven't restored yet
    if (hasRestoredState.current) {
      return;
    }

    // Wait for authentication status to be available
    if (isAuthenticated === undefined) {
      return;
    }

    // Only restore if authenticated (user has logged in)
    if (!isAuthenticated) {
      return;
    }

    try {
      const savedState = localStorage.getItem("moneyx_form_state");
      if (savedState) {
        const state = JSON.parse(savedState);

        console.log("🔄 [Dashboard] Restoring moneyx form state:", state);

        // Restore amounts immediately
        if (state.amountInput !== undefined && state.amountInput !== null && state.amountInput !== "") {
          const sendAmount = state.amountValue || parseFloat(state.amountInput) || 0;
          setPayAmountInput(state.amountInput);
          setPayAmount(sendAmount);
          console.log("✅ [Dashboard] Restored send amount:", state.amountInput, "=", sendAmount);
        }
        if (state.receiveAmountInput !== undefined && state.receiveAmountInput !== null && state.receiveAmountInput !== "") {
          const receiveAmount = state.receiveAmountValue || parseFloat(state.receiveAmountInput) || 0;
          setGetAmountInput(state.receiveAmountInput);
          setGetAmount(receiveAmount);
          console.log("✅ [Dashboard] Restored receive amount:", state.receiveAmountInput, "=", receiveAmount);
        }

        // Store payment method data for later restoration (after payment methods are loaded)
        if (state.fromPaymentMethod || state.toPaymentMethod) {
          // Use base provider name if available (from home page API), otherwise use cleaned name
          const fromName = state.fromProviderBase || state.fromPaymentMethod || "";
          const toName = state.toProviderBase || state.toPaymentMethod || "";

          localStorage.setItem("moneyx_restore_from", fromName);
          localStorage.setItem("moneyx_restore_to", toName);
          localStorage.setItem("moneyx_restore_from_cleaned", state.fromPaymentMethod || "");
          localStorage.setItem("moneyx_restore_to_cleaned", state.toPaymentMethod || "");

          if (state.fromPaymentDetail) {
            localStorage.setItem("moneyx_restore_from_detail", JSON.stringify(state.fromPaymentDetail));
          }
          if (state.toPaymentDetail) {
            localStorage.setItem("moneyx_restore_to_detail", JSON.stringify(state.toPaymentDetail));
          }
          console.log("💾 [Dashboard] Stored payment methods for restoration");
          console.log("💾 [Dashboard] From (base):", fromName, "From (cleaned):", state.fromPaymentMethod);
          console.log("💾 [Dashboard] To (base):", toName, "To (cleaned):", state.toPaymentMethod);
        }

        // Clear the saved state
        localStorage.removeItem("moneyx_form_state");
        hasRestoredState.current = true;
      } else {
        console.log("ℹ️ [Dashboard] No saved moneyx form state found");
      }
    } catch (error) {
      console.error("❌ [Dashboard] Failed to restore moneyx form state:", error);
    }
  }, [isAuthenticated]);

  // Restore payment methods after they're loaded
  useEffect(() => {
    console.log("🔍 [Dashboard] Payment method restoration effect triggered", {
      isAuthenticated,
      finalPaymentMethodsLength: finalPaymentMethods.length,
      stablePaymentMethodsLength: stablePaymentMethods.length,
      paymentMethodRestoreAttempted: paymentMethodRestoreAttempted.current
    });

    // Wait for authentication status
    if (isAuthenticated === undefined) {
      console.log("⏳ [Dashboard] Waiting for authentication status...");
      return;
    }

    // Only restore if authenticated
    if (!isAuthenticated) {
      console.log("⏳ [Dashboard] User not authenticated, skipping restoration");
      return;
    }

    // Check if we have restoration data
    const restoreFrom = localStorage.getItem("moneyx_restore_from");
    const restoreTo = localStorage.getItem("moneyx_restore_to");
    const restoreFromCleaned = localStorage.getItem("moneyx_restore_from_cleaned");
    const restoreToCleaned = localStorage.getItem("moneyx_restore_to_cleaned");

    console.log("🔍 [Dashboard] Restoration data check:", {
      restoreFrom,
      restoreTo,
      restoreFromCleaned,
      restoreToCleaned
    });

    // If no restoration data, skip
    if (!restoreFrom && !restoreTo) {
      console.log("ℹ️ [Dashboard] No restoration data found");
      return;
    }

    // IMPORTANT: Only use stablePaymentMethods (real API data), NOT fallback methods
    // Fallback methods have generic names like "Bank", "Mobile Money" which will cause wrong matches
    const methodsToCheck = (Array.isArray(stablePaymentMethods) && stablePaymentMethods.length > 0)
      ? stablePaymentMethods
      : null;

    // Check if we're using fallback methods (they have generic names like "Bank", "Mobile Money")
    // We should NEVER restore using fallback methods - they don't have real provider names
    const isUsingFallback = methodsToCheck && methodsToCheck.length > 0 &&
      methodsToCheck.some((m: any) =>
        m.provider_name === "Bank" ||
        m.provider_name === "Mobile Money" ||
        m.provider_name === "Cryptocurrency"
      );

    console.log("🔍 [Dashboard] Payment methods check:", {
      finalPaymentMethodsLength: finalPaymentMethods.length,
      stablePaymentMethodsLength: stablePaymentMethods.length,
      methodsToCheckLength: methodsToCheck?.length || 0,
      isUsingFallback: isUsingFallback,
      hasRealMethods: stablePaymentMethods.length > 0
    });

    // If we're using fallback methods, don't attempt restoration - wait for real methods
    if (isUsingFallback || !methodsToCheck || methodsToCheck.length === 0) {
      console.log("⏳ [Dashboard] Waiting for real payment methods to load (not using fallback)...");
      paymentMethodRestoreAttempted.current = false; // Allow retry when real methods load
      return;
    }

    // Only attempt restoration once
    if (paymentMethodRestoreAttempted.current) {
      console.log("⏳ [Dashboard] Restoration already attempted, skipping");
      return;
    }



    paymentMethodRestoreAttempted.current = true;

    let matchedFromMethod = null;
    let matchedToMethod = null;

    // Restore "from" payment method
    if (restoreFrom) {
      const savedFromDetail = localStorage.getItem("moneyx_restore_from_detail");

      if (savedFromDetail) {
        try {
          const fromDetail = JSON.parse(savedFromDetail);
          console.log("Trying to match from payment detail:", fromDetail);

          // Try multiple matching strategies
          matchedFromMethod = methodsToCheck.find(
            (m: any) => {
              const providerName = getProviderName(m);
              const savedProviderName = getProviderName(fromDetail);
              const savedProvider = fromDetail.provider || fromDetail.provider_name || "";
              const cleanedSavedProvider = getProviderName({ provider_name: savedProvider });

              return (
                (m.id && m.id === fromDetail.id) ||
                (m.provider_id && m.provider_id === fromDetail.provider_id) ||
                (m.providerId && m.providerId === fromDetail.providerId) ||
                (providerName.toLowerCase() === restoreFrom.toLowerCase()) ||
                (providerName.toLowerCase() === savedProviderName.toLowerCase()) ||
                (providerName.toLowerCase() === cleanedSavedProvider.toLowerCase()) ||
                (m.provider_name && getProviderName(m).toLowerCase() === getProviderName(fromDetail).toLowerCase()) ||
                (m.provider && getProviderName({ provider_name: m.provider }).toLowerCase() === cleanedSavedProvider.toLowerCase())
              );
            }
          );
        } catch (e) {
          console.error("Failed to parse from payment detail:", e);
        }
      }

      // If no match by ID, try by name (use base name first, then cleaned name)
      if (!matchedFromMethod) {
        // Try with the base provider name first
        const baseName = restoreFrom || restoreFromCleaned || "";
        const cleanedBaseName = getProviderName({ provider_name: baseName });
        console.log("🔍 [Dashboard] Trying to match - Base:", baseName, "Cleaned:", cleanedBaseName);
        console.log("🔍 [Dashboard] Comparing against methods:", methodsToCheck.map((m: any) => ({
          provider_name: m.provider_name,
          provider: m.provider,
          method: m.method,
          id: m.id
        })));

        matchedFromMethod = methodsToCheck.find(
          (m: any) => {
            // Direct comparison of provider_name field (most reliable) - exact match
            const directMatch = m.provider_name && m.provider_name.toLowerCase().trim() === baseName.toLowerCase().trim();

            // Also try cleaned provider_name (removes "- Bank" suffix)
            const cleanedProviderName = m.provider_name ? getProviderName({ provider_name: m.provider_name }) : "";
            const cleanedMatch = cleanedProviderName && cleanedProviderName.toLowerCase().trim() === cleanedBaseName.toLowerCase().trim();

            // Try provider field if available
            const providerMatch = m.provider && m.provider.toLowerCase().trim() === baseName.toLowerCase().trim();

            const match = directMatch || cleanedMatch || providerMatch;

            if (match) {
              console.log("✅ [Dashboard] Found match!");
              console.log("   Method provider_name:", m.provider_name);
              console.log("   Method provider:", m.provider);
              console.log("   Method cleaned name:", cleanedProviderName);
              console.log("   Looking for:", baseName);
              console.log("   Match type:", directMatch ? "direct" : cleanedMatch ? "cleaned" : "provider");
            }
            return match;
          }
        );
      }

      // If still no match, try partial match on cleaned names
      if (!matchedFromMethod) {
        const baseName = restoreFrom || restoreFromCleaned || "";
        const cleanedRestoreFrom = getProviderName({ provider_name: baseName }).toLowerCase();
        matchedFromMethod = methodsToCheck.find(
          (m: any) => {
            const providerName = getProviderName(m).toLowerCase();
            return providerName.includes(cleanedRestoreFrom) || cleanedRestoreFrom.includes(providerName);
          }
        );
      }

      if (matchedFromMethod) {
        // Use the actual provider_name from the matched method for display
        // This ensures we show "Equity Bank" not "Bank"
        const matchedName = matchedFromMethod.provider_name || matchedFromMethod.provider || getProviderName(matchedFromMethod);
        console.log("✅ [Dashboard] Matched and restored from payment method:", restoreFrom, "→", matchedName);
        console.log("✅ [Dashboard] Matched method details:", {
          provider_name: matchedFromMethod.provider_name,
          provider: matchedFromMethod.provider,
          method: matchedFromMethod.method,
          method_display: matchedFromMethod.method_display,
          id: matchedFromMethod.id,
          provider_id: matchedFromMethod.provider_id
        });
        setFromPaymentMethod(matchedName);
        setSelectedFromPaymentDetail(matchedFromMethod);
      } else {

        console.warn("Available methods (raw provider):", methodsToCheck.map((m: any) => m.provider || "N/A"));
      }
    }

    // Restore "to" payment method
    if (restoreTo) {
      const savedToDetail = localStorage.getItem("moneyx_restore_to_detail");

      if (savedToDetail) {
        try {
          const toDetail = JSON.parse(savedToDetail);
          console.log("Trying to match to payment detail:", toDetail);

          // Try multiple matching strategies
          matchedToMethod = methodsToCheck.find(
            (m: any) => {
              const providerName = getProviderName(m);
              const savedProviderName = getProviderName(toDetail);
              const savedProvider = toDetail.provider || toDetail.provider_name || "";
              const cleanedSavedProvider = getProviderName({ provider_name: savedProvider });

              return (
                (m.id && m.id === toDetail.id) ||
                (m.provider_id && m.provider_id === toDetail.provider_id) ||
                (m.providerId && m.providerId === toDetail.providerId) ||
                (providerName.toLowerCase() === restoreTo.toLowerCase()) ||
                (providerName.toLowerCase() === savedProviderName.toLowerCase()) ||
                (providerName.toLowerCase() === cleanedSavedProvider.toLowerCase()) ||
                (m.provider_name && getProviderName(m).toLowerCase() === getProviderName(toDetail).toLowerCase()) ||
                (m.provider && getProviderName({ provider_name: m.provider }).toLowerCase() === cleanedSavedProvider.toLowerCase())
              );
            }
          );
        } catch (e) {
          console.error("Failed to parse to payment detail:", e);
        }
      }

      // If no match by ID, try by name (use base name first, then cleaned name)
      if (!matchedToMethod) {
        // Try with the base provider name first
        const baseName = restoreTo || restoreToCleaned || "";
        const cleanedBaseName = getProviderName({ provider_name: baseName });
        console.log("🔍 [Dashboard] Trying to match - Base:", baseName, "Cleaned:", cleanedBaseName);

        matchedToMethod = methodsToCheck.find(
          (m: any) => {
            // Direct comparison of provider_name field (most reliable) - exact match
            const directMatch = m.provider_name && m.provider_name.toLowerCase().trim() === baseName.toLowerCase().trim();

            // Also try cleaned provider_name (removes "- Bank" suffix)
            const cleanedProviderName = m.provider_name ? getProviderName({ provider_name: m.provider_name }) : "";
            const cleanedMatch = cleanedProviderName && cleanedProviderName.toLowerCase().trim() === cleanedBaseName.toLowerCase().trim();

            // Try provider field if available
            const providerMatch = m.provider && m.provider.toLowerCase().trim() === baseName.toLowerCase().trim();

            const match = directMatch || cleanedMatch || providerMatch;

            if (match) {
              console.log("✅ [Dashboard] Found match!");
              console.log("   Method provider_name:", m.provider_name);
              console.log("   Method provider:", m.provider);
              console.log("   Method cleaned name:", cleanedProviderName);
              console.log("   Looking for:", baseName);
              console.log("   Match type:", directMatch ? "direct" : cleanedMatch ? "cleaned" : "provider");
            }
            return match;
          }
        );
      }

      // If still no match, try partial match on cleaned names
      if (!matchedToMethod) {
        const baseName = restoreTo || restoreToCleaned || "";
        const cleanedRestoreTo = getProviderName({ provider_name: baseName }).toLowerCase();
        matchedToMethod = methodsToCheck.find(
          (m: any) => {
            const providerName = getProviderName(m).toLowerCase();
            return providerName.includes(cleanedRestoreTo) || cleanedRestoreTo.includes(providerName);
          }
        );
      }

      if (matchedToMethod) {
        // Use the actual provider_name from the matched method for display
        // This ensures we show "Equity Bank" not "Bank"
        const matchedName = matchedToMethod.provider_name || matchedToMethod.provider || getProviderName(matchedToMethod);
        console.log("✅ [Dashboard] Matched and restored to payment method:", restoreTo, "→", matchedName);
        console.log("✅ [Dashboard] Matched method details:", {
          provider_name: matchedToMethod.provider_name,
          provider: matchedToMethod.provider,
          method: matchedToMethod.method,
          method_display: matchedToMethod.method_display,
          id: matchedToMethod.id,
          provider_id: matchedToMethod.provider_id
        });
        setToPaymentMethod(matchedName);
        setSelectedToPaymentDetail(matchedToMethod);
      } else {
        console.warn("⚠️ [Dashboard] Could not match to payment method:", restoreTo);
        console.warn("Cleaned restore name:", getProviderName({ provider_name: restoreTo }));
        console.warn("Available methods (cleaned):", methodsToCheck.map((m: any) => getProviderName(m)));
        console.warn("Available methods (raw provider_name):", methodsToCheck.map((m: any) => m.provider_name || "N/A"));
        console.warn("Available methods (raw provider):", methodsToCheck.map((m: any) => m.provider || "N/A"));
      }
    }

    // Only clear restoration keys if we successfully restored at least one payment method
    // This allows retry if payment methods weren't loaded yet
    const restoredAny = (restoreFrom && matchedFromMethod) || (restoreTo && matchedToMethod);
    if (restoredAny || (!restoreFrom && !restoreTo)) {
      // Clear restoration keys after successful restoration or if there's nothing to restore
      localStorage.removeItem("moneyx_restore_from");
      localStorage.removeItem("moneyx_restore_to");
      localStorage.removeItem("moneyx_restore_from_cleaned");
      localStorage.removeItem("moneyx_restore_to_cleaned");
      localStorage.removeItem("moneyx_restore_from_detail");
      localStorage.removeItem("moneyx_restore_to_detail");
      console.log("✅ [Dashboard] Payment method restoration completed");
    } else {
      // Keep keys for retry if payment methods weren't loaded yet
      console.log("⏳ [Dashboard] Payment methods not fully loaded, keeping restoration keys for retry");
      paymentMethodRestoreAttempted.current = false; // Allow retry
    }
  }, [finalPaymentMethods, stablePaymentMethods, isAuthenticated, getProviderName]);

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
        // Only set default amounts if they're empty (no restoration happened)
        if (!payAmountInput || payAmountInput === "" || payAmount === 0) {
          setPayAmountInput("100");
          setPayAmount(100);
          setGetAmountInput("98");
          setGetAmount(98);
        }

        setFromPaymentMethod(providerName);
        setSelectedFromPaymentDetail(methodToSelect);

        // Immediately set "to" to second method (index 1) - run in next tick to ensure state is updated
        if (finalPaymentMethods.length > 1) {
          setTimeout(() => {
            const secondMethod = finalPaymentMethods[1];
            const secondProviderName = getProviderName(secondMethod);
            if (secondProviderName && secondProviderName !== providerName) {
              setToPaymentMethod(secondProviderName);
              setSelectedToPaymentDetail(secondMethod);
            } else if (finalPaymentMethods.length > 2) {
              // Find next different method
              for (let i = 2; i < finalPaymentMethods.length; i++) {
                const method = finalPaymentMethods[i];
                const methodProviderName = getProviderName(method);
                if (methodProviderName && methodProviderName !== providerName) {
                  setToPaymentMethod(methodProviderName);
                  setSelectedToPaymentDetail(method);
                  break;
                }
              }
            }
          }, 0);
        }
      }
    }
  }, [finalPaymentMethods, fromPaymentMethod, isBankMethod, getProviderName]);


  // Create a stable key from payment methods for dependency tracking
  const paymentMethodsKey = useMemo(() => {
    const methods = finalPaymentMethods.length > 0 ? finalPaymentMethods : stablePaymentMethods;
    return methods.length > 0 ? methods.map((m: any) => m?.provider_name || '').join(',') : '';
  }, [finalPaymentMethods, stablePaymentMethods]);

  // Auto-select second payment method for "to" - ALWAYS runs when "from" is set
  useEffect(() => {
    // Get the methods to check - use finalPaymentMethods first, then stablePaymentMethods
    const methodsToCheck = Array.isArray(finalPaymentMethods) && finalPaymentMethods.length > 0
      ? finalPaymentMethods
      : (Array.isArray(stablePaymentMethods) && stablePaymentMethods.length > 0
        ? stablePaymentMethods
        : null);

    // Must have at least 2 methods
    if (!methodsToCheck || methodsToCheck.length < 2) {
      return;
    }

    // Must have "from" selected
    if (!fromPaymentMethod || fromPaymentMethod === "") {
      return;
    }

    // Skip if "to" is already selected
    if (toPaymentMethod && toPaymentMethod !== "") {
      return;
    }

    // ALWAYS select the second payment method (index 1) from the original array
    const secondMethod = methodsToCheck[1];

    // If second method exists and is different from "from", use it immediately
    if (secondMethod?.provider_name && secondMethod.provider_name !== fromPaymentMethod) {
      setToPaymentMethod(secondMethod.provider_name);
      setSelectedToPaymentDetail(secondMethod);
      return;
    }

    // If second method is same as "from", find the next different method starting from index 2
    for (let i = 2; i < methodsToCheck.length; i++) {
      const method = methodsToCheck[i];
      if (method?.provider_name && method.provider_name !== fromPaymentMethod) {
        setToPaymentMethod(method.provider_name);
        setSelectedToPaymentDetail(method);
        return;
      }
    }

    // Final fallback: find ANY method that's different from "from"
    const methodToSelect = methodsToCheck.find(
      (method) => method?.provider_name && method.provider_name !== fromPaymentMethod
    );

    if (methodToSelect?.provider_name) {
      setToPaymentMethod(methodToSelect.provider_name);
      setSelectedToPaymentDetail(methodToSelect);
    }
  }, [paymentMethodsKey, fromPaymentMethod, toPaymentMethod]);

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

  // Calculate receive/send using commission from API (API returns % e.g. 2 = 2%)
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
      const rate = apiCommission ?? 2;

      if (isFromPay) {
        setPayAmountInput(value);
        setPayAmount(newAmount);
        setIsCalculatingFromPay(true);

        // Forward: receive = send * (1 - rate/100)
        const calculatedGetAmount = Math.max(0, newAmount * (1 - rate / 100));
        setGetAmount(calculatedGetAmount);
        setGetAmountInput(calculatedGetAmount.toString());
      } else {
        setGetAmountInput(value);
        setGetAmount(newAmount);
        setIsCalculatingFromPay(false);

        // Reverse: send = receive / (1 - rate/100)
        const calculatedPayAmount = newAmount / (1 - rate / 100);
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

      // Use logged-in user's full name for recipient_name
      const recipientName =
        user?.first_name && user?.last_name
          ? `${user.first_name} ${user.last_name}`.trim()
          : user?.first_name || user?.last_name || "";

      // Create MoneyX transaction
      const result = await dispatch(
        createMoneyXTransaction({
          amount: payAmount.toFixed(2),
          sender_provider: senderProviderId,
          receiver_provider: receiverProviderId,
          recipient_name: recipientName,
        })
      ).unwrap();

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
    <div className="flex flex-col dark:bg-[var(--bg-color)] pl-0 pr-2 sm:pr-0 mr-0 sm:mr-40 w-full mx-auto">
      {/* Money X Page Title */}
      <h1 className=" flex items-center text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-[#76777B] dark:text-white">
        Money <span>
          {isDark ? <img src="/images/xwhite.png" alt="MoneyX" /> : <img src="/images/x.png" alt="MoneyX" />}
        </span>
      </h1>

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
          <div className="relative flex flex-col sm:flex-row border border-border dark:border-[#35353E] rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 overflow-visible gap-2 sm:gap-3 md:gap-0 bg-white dark:bg-[#18181D]">
            {/* Amount Section */}
            <div className="flex-1 sm:pr-4">
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
                {t("express.youSend", "You Send")}
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
                  className="w-full h-[48px] text-[#35353e] dark:text-white bg-transparent dark:bg-transparent rounded-2xl px-4 pr-12 sm:pr-16 text-base sm:text-lg focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E] appearance-none"
                />
              </div>
            </div>

            {/* From Payment Method Section */}
            <div
              data-select-card="true"
              className="flex-1 sm:pl-4 border-t sm:border-t-0 sm:border-l border-border dark:border-[#35353E] pt-3 sm:pt-0 sm:border-none"
            >
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
                {t("express.fromPaymentMethod", "From Payment Method")}
                <div className="w-2 h-2 opacity-0"></div>
              </label>
              <div className="relative w-full">
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
                  triggerClassName="h-[48px] w-full"
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
          <div className="relative flex flex-col sm:flex-row border border-border dark:border-[#35353E] rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 overflow-visible gap-2 sm:gap-3 md:gap-0 bg-white dark:bg-[#18181D]">
            {/* You Receive Section */}
            <div className="flex-1 sm:pr-4">
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
                {t("express.youReceive", "You Receive")}
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
                  className="w-full h-[48px] text-[#35353e] dark:text-white bg-transparent dark:bg-transparent rounded-2xl px-4 pr-16 text-base sm:text-lg focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E] appearance-none"
                />
              </div>
            </div>

            {/* To Payment Method Section */}
            <div className="flex-1 sm:pl-4 border-t sm:border-t-0 sm:border-l border-border dark:border-[#35353E] pt-3 sm:pt-0 sm:border-none">
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
                {t("express.toPaymentMethod", "To Payment Method")}
                <div className="w-2 h-2 opacity-0"></div>
                {!isCalculatingFromPay && (
                  <span className="text-xs opacity-0 font-medium hidden sm:inline">
                    (Active)
                  </span>
                )}
              </label>
              <div className="relative w-full">
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
                  triggerClassName="h-[48px] w-full"
                />
              </div>
              {adminMethodsError && (
                <p className="text-red-500 text-sm mt-1">{adminMethodsError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="flex items-center rounded-2xl px-2 sm:px-3 md:px-4 py-2 sm:py-3 mb-2 sm:mb-4 bg-white dark:bg-[#18181D]">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[#E23D3A] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[#E23D3A] text-xs font-bold">i</span>
            </div>
            <span className="text-[#35353e] dark:text-[#788099] text-sm font-medium">
              This is only an estimated price based on current market rates. The final price will be confirmed when we receive the funds.
            </span>
          </div>
        </div>

        {/* Validation Errors Display */}
        {validationErrors.length > 0 && (
          <div className="w-full px-2 mb-4">
            <div className="bg-white dark:bg-[#18181D] border border-[#1D8751] rounded-2xl p-4">
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
              className={`w-full text-white dark:text-white text-sm sm:text-base font-medium py-3 sm:py-2 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-colors min-h-[44px] sm:min-h-0 ${isTransferDisabled
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
          {/* Account details - title outside, same style as "2- ... Account Details" */}
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-[#788099] inline-flex items-center gap-2">
            1- Account details
          </h2>

          {/* Card: instruction + account name/number with copy */}
          {(() => {
            const accountName =
              selectedToPaymentDetail?.account_name ??
              selectedToPaymentDetail?.payment_details?.[0]?.account_name ??
              getProviderName(selectedToPaymentDetail) ??
              "—";
            const accountNumber =
              bankAccountAddress.trim() ||
              selectedToPaymentDetail?.account_number ??
              selectedToPaymentDetail?.payment_details?.[0]?.account_number ??
              "—";
            const copyAccountNumber = () => {
              if (!accountNumber || accountNumber === "—") return;
              navigator.clipboard.writeText(accountNumber).then(
                () => {
                  setAccountNumberCopied(true);
                  showToast.success("Account number copied");
                  setTimeout(() => setAccountNumberCopied(false), 2000);
                },
                () => showToast.error("Failed to copy")
              );
            };
            return (
              <div className="bg-white dark:bg-[#18181D] border border-border dark:border-[#35353E] rounded-2xl p-4 mb-4 sm:mb-6">
                <p className="text-[#35353e] dark:text-[#788099] text-sm sm:text-base mb-4">
                  Copy the following account to deposit the <span className="font-semibold text-gray-900 dark:text-white">${payAmount.toFixed(2)}</span> amount
                </p>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 p-3 border border-border dark:border-[#35353E] rounded-xl">
                    <span className="text-[#788099] text-sm">Account name</span>
                    <span className="text-[#35353e] dark:text-white font-medium text-sm truncate">
                      {accountName}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border border-border dark:border-[#35353E] rounded-xl">
                    <span className="text-[#788099] text-sm">Account number</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[#35353e] dark:text-white font-medium text-sm truncate">
                        {accountNumber}
                      </span>
                      {accountNumber !== "—" && (
                        <button
                          type="button"
                          onClick={copyAccountNumber}
                          className="flex-shrink-0 p-1.5 rounded-lg bg-[#1D8751]/20 text-[#1D8751] hover:bg-[#1D8751]/30 transition-colors"
                          title="Copy account number"
                          aria-label="Copy account number"
                        >
                          {accountNumberCopied ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h2m8 0h2a2 2 0 012 2v2m2 4a2 2 0 01-2 2h-8a2 2 0 01-2-2v-8" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Bank Account Address Section - Dynamic Title */}
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-[#788099] inline-flex items-center gap-2">
            2- {isMobileMethod(selectedToPaymentDetail)
              ? `${getProviderName(selectedToPaymentDetail)} Details`
              : `${getProviderName(selectedToPaymentDetail)} Account Details`}
          </h2>


          <div
            ref={paymentDetailsRef}
            className="flex flex-col bg-white dark:bg-[#18181D] border-2 border-border dark:border-[#35353E] rounded-2xl p-3 sm:p-4 md:p-5 shadow-lg w-full text-[#35353e] dark:text-[#788099] mb-4 sm:mb-6"
          >
            {/* Dynamic Address Label */}
            <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
              {isMobileMethod(selectedToPaymentDetail)
                ? `${getProviderName(selectedToPaymentDetail)} Number`
                : `${getProviderName(selectedToPaymentDetail)} Account Number`}
            </label>
            {/* Input group */}
            <div className="flex items-center bg-white dark:bg-[#18181D] border border-border dark:border-[#35353E] rounded-2xl px-2 sm:px-4 py-2 mb-0 overflow-hidden gap-1 sm:gap-2">
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
                placeholder={
                  selectedToPaymentDetail?.payment_method?.toLowerCase().includes('mobile') ||
                    selectedToPaymentDetail?.payment_method_type?.toLowerCase().includes('mobile') ||
                    selectedToPaymentDetail?.method?.toLowerCase().includes('mobile')
                    ? `Enter your ${getProviderName(selectedToPaymentDetail)} Number`
                    : `Enter your ${getProviderName(selectedToPaymentDetail)} Account Number`
                }
                className={`flex-1 min-w-0 bg-transparent border-none outline-none text-[#35353e] dark:text-[#788099] placeholder-[#788099] text-sm sm:text-base ${bankAddressError
                  ? "border-red-500"
                  : bankAccountAddress.trim() && !bankAddressError
                    ? "border-green-500"
                    : ""
                  }`}
              />
              {/* Bookmark icon - clickable to load from bookmarks */}
              <span
                ref={bookmarkAnchorRef}
                className="relative mx-1 sm:mx-2 text-[#1D8751] cursor-pointer flex-shrink-0 hover:opacity-80 transition-opacity"
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
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <BookmarkDropdown
                  isOpen={bookmarkOpen}
                  onClose={() => setBookmarkOpen(false)}
                  bookmarks={bookmarks}
                  loading={bookmarksLoading}
                  saving={bookmarkSaving}
                  currentAddress={bankAccountAddress}
                  asset={currentBankAsset || "BANK"}
                  network="BANK"
                  onSelect={(addr) => {
                    setBankAccountAddress(addr);
                    setBankAddressError(null);
                  }}
                  onSaveCurrent={async () => {
                    if (!bankAccountAddress.trim() || !currentBankAsset) return;
                    await saveBookmark({
                      address: bankAccountAddress.trim(),
                      label: `My ${currentBankAsset} account`,
                      network: "BANK",
                      asset: currentBankAsset,
                    });
                  }}
                  anchorRef={bookmarkAnchorRef}
                  isDark={isDark}
                />
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
                className="flex items-center justify-center gap-2 bg-[#1D8751] hover:bg-[#166b3e]
                text-white rounded-xl px-4 py-2 font-semibold text-sm transition-colors min-h-[44px] touch-manipulation flex-shrink-0 whitespace-nowrap"
                title="Paste"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-white">
                  <path
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Show validation messages below the bank account address input */}
            {bankAddressError && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                ❌ {bankAddressError}
              </p>
            )}

            {/* Terms & Conditions */}
            <div className="flex items-center gap-2 mb-2 mt-4">
              <svg className="w-5 h-5 text-[#1D8751]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className={`font-medium text-sm sm:text-base ${isDark ? "text-white" : "text-gray-900"}`}>
                Terms & Conditions
              </h3>
            </div>
            <div className={`border border-[#1D8751] rounded-xl overflow-hidden transition-all duration-300 ${isDark ? "bg-[#1D1D23]" : "bg-[#F8FAFF]"}`}>
              <div className="p-4">
                <div className={`space-y-2 sm:space-y-3 ${expandedTerms ? "" : "line-clamp-3"}`}>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">1.</span>
                    <div>
                      <span className={`${isDark ? "text-white" : "text-gray-900"} text-xs sm:text-sm font-semibold block`}>Ownership of sending and receiving accounts</span>
                      <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-xs sm:text-sm`}>
                        Use only wallets, bank accounts, or mobile money numbers you personally own and control. Third-party accounts are not allowed.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">2.</span>
                    <div>
                      <span className={`${isDark ? "text-white" : "text-gray-900"} text-xs sm:text-sm font-semibold block`}>Provide correct sending and receiving details</span>
                      <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-xs sm:text-sm`}>
                        Enter correct receiving wallet, bank account, or mobile money number. Send funds only to our officially provided accounts shown in the app.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">3.</span>
                    <div>
                      <span className={`${isDark ? "text-white" : "text-gray-900"} text-xs sm:text-sm font-semibold block`}>Send funds only to our official accounts</span>
                      <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-xs sm:text-sm`}>
                        Send funds only to OMAYA accounts, mobile numbers, or merchants displayed in the app. Sending to other accounts is at your own risk.
                      </span>
                    </div>
                  </div>
                </div>

                {expandedTerms && (
                  <div className={`space-y-2 sm:space-y-3 mt-4 pt-4 border-t ${isDark ? "border-[#35353E]" : "border-gray-200"}`}>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">4.</span>
                      <div>
                        <span className={`${isDark ? "text-white" : "text-gray-900"} text-xs sm:text-sm font-semibold block`}>Irreversible transactions & user responsibility</span>
                        <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-xs sm:text-sm`}>
                          Transactions are irreversible. Incorrect details or wrong accounts may result in permanent fund loss—we cannot recover them.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">5.</span>
                      <div>
                        <span className={`${isDark ? "text-white" : "text-gray-900"} text-xs sm:text-sm font-semibold block`}>Transaction time limit</span>
                        <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-xs sm:text-sm`}>
                          Send funds only while the transaction timer is active. Transactions sent after timer expiry may be rejected or lost.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setExpandedTerms(!expandedTerms)}
                  className="mt-3 sm:mt-4 text-[#1D8751] hover:text-[#166b3e] font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                >
                  {expandedTerms ? (
                    <>
                      <span>Show Less</span>
                      <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Show More</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Acceptance checkbox */}
            <label className="flex mb-4 items-start gap-2 mt-4 text-sm text-[#35353e] dark:text-[#788099] cursor-pointer">
              <input
                type="checkbox"
                checked={isAddressConfirmed}
                onChange={(event) =>
                  setIsAddressConfirmed(event.target.checked)
                }
                className="w-4 h-4 mt-0.5 rounded border-[#1D8751] text-[#1D8751] accent-[#1D8751]"
              />
              <span>I have read and agreed to Omaya Exchange <a href="/legal/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-[#1D8751] underline">Terms of Use</a>, <a href="/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#1D8751] underline">Privacy Policy</a></span>
            </label>
          </div>

          {/* Final Submit Button */}
          <div className="flex flex-col gap-3 w-full px-2">
            <button
              className={`w-full text-white dark:text-white text-sm sm:text-base font-medium py-3 sm:py-2 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-colors min-h-[44px] sm:min-h-0 ${!bankAccountAddress.trim() || bankAddressError || !isAddressConfirmed
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

                  showToast.success("Transaction is successful", "Account updated successfully.");

                  // Scroll to top of page after successful submission
                  window.scrollTo({ top: 0, behavior: 'smooth' });

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
