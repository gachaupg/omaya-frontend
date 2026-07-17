"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppDispatch } from "@/store";
import {
  fetchUserPaymentDetails,
} from "@/features/p2p/slices/paymentMethodsSlice";
import {
  createMoneyXTransaction,
} from "../slices/moneyXSlice";
import {
  fetchMoneyXCommission,
  clearMoneyXError,
} from "@/features/moneyX/slices/moneyXSlice";
import { buildMoneyXTransactionPayload } from "@/features/moneyX/utils/buildMoneyXTransactionPayload";
import { useTheme } from "@/context/theme";
import CustomSelect from "@/components/ui/HomeCommonSelect";
import { showToast } from "@/lib/utils/toast";
import { getCleanPaymentProviderLabel, getPaymentMethodDisplayTitle, getPaymentMethodSelectLabels } from "@/lib/utils/paymentProviderLabel";
import { normalizeExpressApiErrorMessage } from "@/lib/utils/expressMinAmount";
import { resolveScamFlagDisplayError } from "@/lib/utils/scamFlagError";
import { useExpressI18n } from "@/lib/useExpressI18n";
import { useBookmarkedAddresses } from "@/features/express/hooks/useBookmarkedAddresses";
import { BookmarkDropdown } from "@/features/express/components/forms/BookmarkDropdown";
import PaymentMethodsModal from "@/features/p2p/components/ui/p2pdashboard/sections/PaymentMethodsModal";
import ProviderPaymentDetailsCard from "@/components/ui/ProviderPaymentDetailsCard";
import { usePaymentMethodsDisplay } from "@/features/express/hooks/useDataDisplay";
import { useMoneyXPaymentMethodLists } from "@/features/express/hooks/useMoneyXPaymentMethodLists";
import { pickDefaultMoneyXFromMethod } from "@/features/express/utils/defaultMoneyXFromProvider";
import {
  matchMoneyXMethodById,
} from "@/features/express/utils/moneyXPaymentMethodUtils";
import { setAuthRedirectPath, buildMoneyXRedirectPath, setMoneyXPrefillState } from "@/lib/utils/authRedirect";
import { openKYCModal, checkKYCStatus } from "@/features/auth/slices/authSlice";
import {
  getHighResPaymentLogo,
  PAYMENT_LOGO_BASE_CLASS,
  PAYMENT_LOGO_SIZE,
} from "@/features/express/utils/imageHelpers";
import { homeCardAmountFieldClass, homeCardSelectTriggerClass } from "@/features/swap/components/swapFieldStyles";
import {
  clampMoneyXAmountNumber,
  getMoneyXMaxAmountErrorMessage,
  isMoneyXAmountOverHardLimit,
  MONEYX_MAX_AMOUNT_INPUT_DIGITS,
  normalizeMoneyXAmountInputForRestore,
  prepareMoneyXAmountFieldValue,
  toMoneyXClampedInputString,
} from "@/lib/utils/moneyXAmountInput";

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
  /** Used for range-commissions API: commission_type=deposit | withdrawal */
  commissionType?: "deposit" | "withdrawal";
}

export default function TransferForm({ isHomePage = false, onTransfer, commissionType = "deposit" }: TransferFormProps) {
  const { t } = useExpressI18n();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isDark } = useTheme();

  const {
    userPaymentDetails,
  } = useSelector((state: any) => state.paymentMethods);

  const {
    transaction: moneyXTransaction,
    loading: moneyXLoading,
    error: moneyXError,
  } = useSelector((state: any) => state.moneyX);

  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const requiresLoginRedirect = isHomePage && !isAuthenticated;

  const [selectedFromPaymentDetail, setSelectedFromPaymentDetail] = useState<any>(null);
  const [selectedToPaymentDetail, setSelectedToPaymentDetail] = useState<any>(null);

  const {
    fromMethods: fromPaymentMethods,
    toMethods: toPaymentMethods,
    allFromReady,
    fromLoading,
    toLoading,
    fromError: paymentMethodsError,
    toError: toPaymentMethodsError,
    isLoading: paymentMethodsLoading,
    restoreFromFullList,
    refreshToForFrom,
    refreshFromForTo,
    allFromMethods,
    getProviderId,
  } = useMoneyXPaymentMethodLists({
    flow: commissionType,
  });

  const paymentMethodsDisplay = usePaymentMethodsDisplay(
    fromPaymentMethods,
    fromLoading,
    paymentMethodsError
  );

  // Fetch user payment details on mount when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserPaymentDetails());
    }
  }, [dispatch, isAuthenticated]);
  const [payAmount, setPayAmount] = useState(100);
  const [payAmountInput, setPayAmountInput] = useState("100");
  const [getAmount, setGetAmount] = useState(98);
  const [getAmountInput, setGetAmountInput] = useState("98");
  const [isCalculatingFromPay, setIsCalculatingFromPay] = useState(true);
  const [fromPaymentMethod, setFromPaymentMethod] = useState<string>("");
  const [toPaymentMethod, setToPaymentMethod] = useState<string>("");
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const bookmarkAnchorRef = useRef<HTMLSpanElement>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingTransaction, setIsUpdatingTransaction] = useState(false);
  const [apiValidationError, setApiValidationError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isFirstCardSubmitted, setIsFirstCardSubmitted] = useState(false);
  const [bankAccountAddress, setBankAccountAddress] = useState<string>("");
  const [bankAddressError, setBankAddressError] = useState<string | null>(null);
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [expandedTerms, setExpandedTerms] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [apiCommission, setApiCommission] = useState<number | null>(null);
  const [apiCommissionIsPercentage, setApiCommissionIsPercentage] = useState(true);
  const commissionFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const paymentDetailsRef = useRef<HTMLDivElement>(null);
  const MONEYX_LEGAL_RETURN_STATE_KEY = "omaya_moneyx_legal_return_state";
  const RETURNING_FROM_LEGAL_KEY = "omaya_returning_from_legal";

  // Auto-confirm bank address when it's non-empty and has no validation error (so the second-step submit can enable)
  useEffect(() => {
    if (bankAccountAddress.trim() && !bankAddressError) {
      setIsAddressConfirmed(true);
    } else {
      setIsAddressConfirmed(false);
    }
  }, [bankAccountAddress, bankAddressError]);

  // Fetch commission percentage from range-commissions API (no auth, returns percentage e.g. 3%)
  useEffect(() => {
    const amount = isCalculatingFromPay ? payAmount : getAmount;
    if (!amount || amount <= 0) {
      setApiCommission(null);
      return;
    }
    if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
    commissionFetchTimeoutRef.current = setTimeout(() => {
      dispatch(fetchMoneyXCommission({ amount, commissionType }))
        .unwrap()
        .then((result) => {
          setApiCommission(result.commission);
          setApiCommissionIsPercentage(result.isPercentage);
        })
        .catch(() => {
          setApiCommission(null);
          setApiCommissionIsPercentage(true);
        });
    }, 150);
    return () => {
      if (commissionFetchTimeoutRef.current) clearTimeout(commissionFetchTimeoutRef.current);
    };
  }, [payAmount, getAmount, isCalculatingFromPay, commissionType, dispatch]);

  const calculateReceiveAmount = (send: number, commission: number, isPercentage: boolean) => {
    if (isPercentage) {
      return Math.max(0, send - (send * commission) / 100);
    }
    return Math.max(0, send - commission);
  };

  const calculateSendAmount = (receive: number, commission: number, isPercentage: boolean) => {
    if (isPercentage) {
      return commission >= 100 ? receive : receive / (1 - commission / 100);
    }
    return receive + commission;
  };

  // Recalculate the other field when commission config updates.
  useEffect(() => {
    const rate = apiCommission ?? 0;
    if (isCalculatingFromPay && payAmount > 0) {
      const calculatedGetAmount = clampMoneyXAmountNumber(
        calculateReceiveAmount(
          payAmount,
          rate,
          apiCommissionIsPercentage
        )
      );
      setGetAmount(calculatedGetAmount);
      setGetAmountInput(calculatedGetAmount.toString());
    } else if (!isCalculatingFromPay && getAmount > 0) {
      const calculatedPayAmount = clampMoneyXAmountNumber(
        calculateSendAmount(
          getAmount,
          rate,
          apiCommissionIsPercentage
        )
      );
      setPayAmount(calculatedPayAmount);
      setPayAmountInput(toMoneyXClampedInputString(calculatedPayAmount));
    }
  }, [apiCommission, apiCommissionIsPercentage]);

  // When user changes payment methods or amount, minimise the expanded form (they must submit again)
  // Skip during restore - we want to keep form expanded with restored bank account
  const fromKey = selectedFromPaymentDetail?.id ?? selectedFromPaymentDetail?.provider_id ?? fromPaymentMethod ?? "";
  const toKey = selectedToPaymentDetail?.id ?? selectedToPaymentDetail?.provider_id ?? toPaymentMethod ?? "";
  const isRestoringRef = useRef(false);
  const hasRestoredFromLegalRef = useRef(false);
  const hasStartedLegalRestore = useRef(false);
  useEffect(() => {
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }
    if (hasRestoredFromLegalRef.current) {
      return;
    }
    setIsFirstCardSubmitted(false);
  }, [fromKey, toKey, payAmount, getAmount]);

  // Normalize provider labels for dropdowns (prefer short_name, then provider_name).
  const getProviderName = useCallback((payment: any) => {
    return getPaymentMethodDisplayTitle(payment) || getCleanPaymentProviderLabel(payment);
  }, []);

  // Use a stable unique key so methods with same provider name don't collide in selects.
  const getPaymentMethodKey = useCallback((payment: any) => {
    if (!payment) return "";
    const idPart =
      payment?.id ??
      payment?.provider_id ??
      payment?.providerId ??
      payment?.method_id ??
      "";
    const provider = getProviderName(payment);
    const method =
      payment?.method_display ||
      payment?.method ||
      payment?.payment_method ||
      payment?.payment_method_type ||
      payment?.method?.method_display ||
      payment?.method?.method_name ||
      "";
    return idPart
      ? `${String(idPart)}`
      : `${provider}::${String(method).trim().toLowerCase()}`;
  }, [getProviderName]);

  const moneyXInitializedRef = useRef(false);

  const handleFromPaymentChange = useCallback(
    async (value: string) => {
      const selectedPayment =
        fromPaymentMethods?.find(
          (payment: any) => getPaymentMethodKey(payment) === value
        ) ?? null;

      restoreFromFullList();
      const fromId = getProviderId(selectedPayment);
      const matchedFrom =
        matchMoneyXMethodById(allFromMethods, fromId) ??
        matchMoneyXMethodById(fromPaymentMethods, fromId) ??
        selectedPayment;

      if (!matchedFrom) return;

      const fromKey = getPaymentMethodKey(matchedFrom);
      setFromPaymentMethod(fromKey);
      setSelectedFromPaymentDetail(matchedFrom);
      setValidationErrors([]);

      const matchedTo = await refreshToForFrom(matchedFrom, selectedToPaymentDetail, {
        force: true,
      });
      if (matchedTo) {
        setToPaymentMethod(getPaymentMethodKey(matchedTo));
        setSelectedToPaymentDetail(matchedTo);
      }
    },
    [
      allFromMethods,
      fromPaymentMethods,
      selectedToPaymentDetail,
      getPaymentMethodKey,
      getProviderId,
      restoreFromFullList,
      refreshToForFrom,
    ]
  );

  const handleToPaymentChange = useCallback(
    async (value: string) => {
      const selectedPayment =
        toPaymentMethods?.find(
          (payment: any) => getPaymentMethodKey(payment) === value
        ) ?? null;

      if (!selectedPayment) return;

      setToPaymentMethod(value);
      setSelectedToPaymentDetail(selectedPayment);
      setValidationErrors([]);

      const matchedFrom = await refreshFromForTo(
        selectedPayment,
        selectedFromPaymentDetail,
        { force: true }
      );
      if (matchedFrom) {
        setFromPaymentMethod(getPaymentMethodKey(matchedFrom));
        setSelectedFromPaymentDetail(matchedFrom);
      }
    },
    [
      toPaymentMethods,
      selectedFromPaymentDetail,
      getPaymentMethodKey,
      refreshFromForTo,
    ]
  );

  const handleSwapPaymentMethods = useCallback(async () => {
    const newToDetail = selectedFromPaymentDetail;
    const newFromId = getProviderId(selectedToPaymentDetail);
    const newFromDetail =
      matchMoneyXMethodById(allFromMethods, newFromId) ?? selectedToPaymentDetail;

    restoreFromFullList();

    if (newFromDetail) {
      setFromPaymentMethod(getPaymentMethodKey(newFromDetail));
      setSelectedFromPaymentDetail(newFromDetail);
    }
    if (newToDetail) {
      setToPaymentMethod(getPaymentMethodKey(newToDetail));
      setSelectedToPaymentDetail(newToDetail);
    }

    const matchedTo = await refreshToForFrom(newFromDetail, newToDetail, {
      force: true,
    });
    if (matchedTo) {
      setToPaymentMethod(getPaymentMethodKey(matchedTo));
      setSelectedToPaymentDetail(matchedTo);
    }
  }, [
    allFromMethods,
    selectedFromPaymentDetail,
    selectedToPaymentDetail,
    getPaymentMethodKey,
    getProviderId,
    restoreFromFullList,
    refreshToForFrom,
  ]);

  const currentBankAsset = selectedToPaymentDetail ? getProviderName(selectedToPaymentDetail) : "";
  const {
    bookmarks,
    loading: bookmarksLoading,
    saving: bookmarkSaving,
    fetchBookmarks,
    saveBookmark,
    deleteBookmark,
    saveBookmarkError,
    clearSaveBookmarkError,
  } = useBookmarkedAddresses(currentBankAsset || "BANK", "BANK");

  const mergedSavedAddresses = useMemo(() => {
    const approvedDetails = Array.isArray(userPaymentDetails) ? userPaymentDetails : [];
    const assetFilter = String(currentBankAsset || "").trim().toLowerCase();

    const approvedAsBookmarks = approvedDetails
      .filter((detail: any) => {
        const raw = String(detail?.status ?? detail?.approved ?? "").trim().toLowerCase();
        const isApproved =
          raw === "approved" ||
          raw === "active" ||
          raw === "success" ||
          raw === "true";
        if (!isApproved) return false;
        const provider = String(
          detail?.payment_provider_name ?? detail?.provider_name ?? detail?.payment_method_name ?? ""
        )
          .trim()
          .toLowerCase();
        if (!assetFilter) return true;
        return provider.includes(assetFilter) || assetFilter.includes(provider);
      })
      .map((detail: any, idx: number) => {
        const address = String(
          detail?.account_number ?? detail?.mobile_number ?? detail?.wallet_address ?? ""
        ).trim();
        const providerName = String(
          detail?.payment_provider_name ?? detail?.provider_name ?? detail?.payment_method_name ?? "Approved payment"
        ).trim();
        return {
          id: `approved-${detail?.id ?? idx}-${address}`,
          address,
          label: `${providerName} (Approved)`,
          asset: currentBankAsset || "BANK",
          network: "BANK",
        };
      })
      .filter((b: any) => b.address);

    const deduped = new Map<string, any>();
    [...approvedAsBookmarks, ...bookmarks].forEach((b: any) => {
      const key = String(b?.address ?? "").trim().toLowerCase();
      if (!key || deduped.has(key)) return;
      deduped.set(key, b);
    });
    return Array.from(deduped.values());
  }, [userPaymentDetails, currentBankAsset, bookmarks]);

  const currentProviderLabel = selectedToPaymentDetail
    ? getProviderName(selectedToPaymentDetail)
    : "";

  // Helper function to check if a payment method is a bank
  const isBankMethod = useCallback((method: any) => {
    if (!method) return false;
    const providerName = getProviderName(method).toLowerCase();
    const baseMethod = (method?.method || "").toLowerCase();
    const baseMethodDisplay = (method?.method_display || "").toLowerCase();
    const paymentMethod = (method?.payment_method || "").toLowerCase();
    const paymentMethodType = (method?.payment_method_type || "").toLowerCase();
    const provider = (method?.provider || "").toLowerCase();

    return (
      providerName.includes("bank") ||
      baseMethod.includes("bank") ||
      baseMethodDisplay.includes("bank") ||
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

        isRestoringRef.current = true;

        // Restore amounts immediately
        const restoredPayInput = normalizeMoneyXAmountInputForRestore(
          state.amountInput
        );
        if (restoredPayInput) {
          setPayAmountInput(restoredPayInput);
          setPayAmount(
            clampMoneyXAmountNumber(
              state.amountValue || parseFloat(restoredPayInput) || 0
            )
          );
        }
        const restoredGetInput = normalizeMoneyXAmountInputForRestore(
          state.receiveAmountInput
        );
        if (restoredGetInput) {
          setGetAmountInput(restoredGetInput);
          setGetAmount(
            clampMoneyXAmountNumber(
              state.receiveAmountValue || parseFloat(restoredGetInput) || 0
            )
          );
        }

        // Restore bank account address and expand form
        if (state.bankAccountAddress) {
          setBankAccountAddress(state.bankAccountAddress);
          setIsFirstCardSubmitted(true);
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
    if (!isHomePage || !isAuthenticated || !Array.isArray(fromPaymentMethods) || fromPaymentMethods.length === 0) {
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

      // Prevent minimise effect from collapsing when we set selected payment details
      isRestoringRef.current = true;
      let matchedFromMethod: any = null;
      let matchedToMethod: any = null;

      // Restore "from" payment method
      if (restoreFrom) {
        const savedFromDetail = localStorage.getItem("moneyx_restore_from_detail");

        if (savedFromDetail) {
          try {
            const fromDetail = JSON.parse(savedFromDetail);
            console.log("Trying to match from payment detail:", fromDetail);

            // Try multiple matching strategies
            matchedFromMethod = fromPaymentMethods.find(
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
          matchedFromMethod = fromPaymentMethods.find(
            (m: any) => getProviderName(m) === restoreFrom
          );
        }

        if (matchedFromMethod) {
          console.log("Matched from payment method:", matchedFromMethod);
          setFromPaymentMethod(getPaymentMethodKey(matchedFromMethod) || restoreFrom);
          setSelectedFromPaymentDetail(matchedFromMethod);
        } else {
          console.warn("Could not match from payment method:", restoreFrom);
        }
      }

      // Restore "to" payment method (filtered list for selected from provider)
      if (restoreTo && toPaymentMethods.length > 0) {
        const savedToDetail = localStorage.getItem("moneyx_restore_to_detail");

        if (savedToDetail) {
          try {
            const toDetail = JSON.parse(savedToDetail);
            console.log("Trying to match to payment detail:", toDetail);

            matchedToMethod = toPaymentMethods.find(
              (m: any) => {
                const providerName = getProviderName(m);
                return (
                  (m.id && m.id === toDetail.id) ||
                  (m.provider_id && m.provider_id === toDetail.provider_id) ||
                  (m.providerId && m.providerId === toDetail.providerId) ||
                  (providerName === restoreTo) ||
                  (providerName === toDetail.provider_name) ||
                  (m.provider_name === toDetail.provider_name) ||
                  getPaymentMethodKey(m) === restoreTo
                );
              }
            );
          } catch (e) {
            console.error("Failed to parse to payment detail:", e);
          }
        }

        if (!matchedToMethod) {
          matchedToMethod = toPaymentMethods.find(
            (m: any) => getProviderName(m) === restoreTo || getPaymentMethodKey(m) === restoreTo
          );
        }

        if (matchedToMethod) {
          console.log("Matched to payment method:", matchedToMethod);
          setToPaymentMethod(getPaymentMethodKey(matchedToMethod) || restoreTo);
          setSelectedToPaymentDetail(matchedToMethod);
        } else {
          console.warn("Could not match to payment method:", restoreTo);
        }
      }

      const restoredFrom = !restoreFrom || !!matchedFromMethod;
      const restoredTo = !restoreTo || !!matchedToMethod;

      // Keep the form expanded when returning from legal pages and restoration is in progress/completed.
      setIsFirstCardSubmitted(true);

      // Only clear restore keys once matching is successful.
      if (restoredFrom && restoredTo) {
        paymentMethodRestoreAttempted.current = true;
        localStorage.removeItem("moneyx_restore_from");
        localStorage.removeItem("moneyx_restore_to");
        localStorage.removeItem("moneyx_restore_from_detail");
        localStorage.removeItem("moneyx_restore_to_detail");
      }
    }
  }, [fromPaymentMethods, toPaymentMethods, isHomePage, isAuthenticated, getProviderName, getPaymentMethodKey, refreshToForFrom]);

  // Initial default: Salaam From + scoped To (mobile parity)
  useEffect(() => {
    if (!allFromReady || fromPaymentMethods.length === 0) return;
    if (moneyXInitializedRef.current) return;

    const isRestoring =
      typeof window !== "undefined" &&
      (localStorage.getItem("moneyx_restore_from") ||
        localStorage.getItem("moneyx_restore_to"));
    if (isRestoring) return;
    if (fromPaymentMethod) return;

    moneyXInitializedRef.current = true;
    const defaultFrom = pickDefaultMoneyXFromMethod(fromPaymentMethods);
    if (!defaultFrom) return;

    const fromKey = getPaymentMethodKey(defaultFrom);
    setFromPaymentMethod(fromKey);
    setSelectedFromPaymentDetail(defaultFrom);

    void refreshToForFrom(defaultFrom, null, { force: true }).then((matchedTo) => {
      if (!matchedTo) return;
      setToPaymentMethod(getPaymentMethodKey(matchedTo));
      setSelectedToPaymentDetail(matchedTo);
    });
  }, [
    allFromReady,
    fromPaymentMethods,
    fromPaymentMethod,
    getPaymentMethodKey,
    refreshToForFrom,
  ]);

  const buildPaymentMethodOptions = useCallback((methods: any[]) => {
    return methods.map((payment: any) => {
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

      const { label, subtitle } = getPaymentMethodSelectLabels(payment);
      return {
        value: getPaymentMethodKey(payment),
        label: label || getProviderName(payment),
        subtitle,
        logo: getHighResPaymentLogo(logoUrl, undefined, PAYMENT_LOGO_SIZE),
        raw: payment,
      };
    });
  }, [getProviderName, getPaymentMethodKey]);

  const fromPaymentMethodOptions = useMemo(
    () => buildPaymentMethodOptions(fromPaymentMethods),
    [fromPaymentMethods, buildPaymentMethodOptions]
  );

  const toPaymentMethodOptions = useMemo(
    () =>
      buildPaymentMethodOptions(
        toPaymentMethods.length > 0 ? toPaymentMethods : fromPaymentMethods
      ),
    [toPaymentMethods, fromPaymentMethods, buildPaymentMethodOptions]
  );

  // Calculate receive/send using commission percentage from API (receive = send - send*rate/100)
  const handleAmountChange = (value: string, isFromPay: boolean) => {
    const prep = prepareMoneyXAmountFieldValue(value);
    if (!prep.ok) {
      if (prep.invalidPattern) return;
      setApiValidationError(prep.error ?? null);
      return;
    }
    const v = prep.v;
    if (v === "") {
      setPayAmountInput("");
      setPayAmount(0);
      setGetAmountInput("");
      setGetAmount(0);
      setApiValidationError(null);
      return;
    }

    const rate = apiCommission ?? 0;

    if (isFromPay) {
      const parsedPay = parseFloat(v) || 0;
      const clampedPay = clampMoneyXAmountNumber(parsedPay);
      const payDisplay =
        clampedPay !== parsedPay ? toMoneyXClampedInputString(clampedPay) : v;
      setPayAmountInput(payDisplay);
      setPayAmount(clampedPay);
      setIsCalculatingFromPay(true);
      const calculatedGetAmount = clampMoneyXAmountNumber(
        calculateReceiveAmount(
          clampedPay,
          rate,
          apiCommissionIsPercentage
        )
      );
      setGetAmount(calculatedGetAmount);
      setGetAmountInput(calculatedGetAmount.toString());
      setApiValidationError(null);
      if (clampedPay > 15000) {
        // You can add an info modal here similar to deposit form
      }
    } else {
      const parsedRecv = parseFloat(v) || 0;
      const clampedRecv = clampMoneyXAmountNumber(parsedRecv);
      const recvDisplay =
        clampedRecv !== parsedRecv ? toMoneyXClampedInputString(clampedRecv) : v;
      setGetAmountInput(recvDisplay);
      setGetAmount(clampedRecv);
      setIsCalculatingFromPay(false);
      const calculatedPayAmount = clampMoneyXAmountNumber(
        calculateSendAmount(
          clampedRecv,
          rate,
          apiCommissionIsPercentage
        )
      );
      setPayAmount(calculatedPayAmount);
      setPayAmountInput(toMoneyXClampedInputString(calculatedPayAmount));
      setApiValidationError(null);
      if (clampedRecv > 15000) {
        // You can add an info modal here similar to deposit form
      }
    }
  };

  const handleFirstCardSubmit = async () => {
    // First button: expand only (login redirect happens on final submit after bank account)
    // Clear previous errors
    setValidationErrors([]);
    setApiValidationError(null);

    // Validation
    const errors: string[] = [];

    if (!payAmountInput || payAmountInput.trim() === "" || !payAmount || payAmount <= 0) {
      errors.push("Please enter a valid amount");
    }

    if (isMoneyXAmountOverHardLimit(payAmount)) {
      errors.push(getMoneyXMaxAmountErrorMessage());
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
      setActionError(errors[0] || null);
      return;
    }

    setActionError(null);

    // Check if user is verified (KYC check) - verify with API
    if (isAuthenticated && user) {
      // Check KYC status from API to get the latest status
      try {
        const kycResult = await dispatch(checkKYCStatus()).unwrap();
        const kycStatus = kycResult as any;

        // Strict KYC gate: only explicit verified=true can proceed.
        if (!kycStatus || kycStatus.is_verified !== true) {
          dispatch(openKYCModal());
          return;
        }
      } catch (error) {
        // On verification check failure, block progression and show KYC modal.
        dispatch(openKYCModal());
        return;
      }
    }

    // First button: only expand (no API post); post happens on final submit
    setIsFirstCardSubmitted(true);

    setTimeout(() => {
      if (paymentDetailsRef.current) {
        paymentDetailsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  const isTransferDisabled =
    isSubmitting ||
    // For home page (unauthenticated users), allow button click to trigger login redirect
    // Only require basic validation: from and to must be different if both are selected
    (!isHomePage && (
      !fromPaymentMethod ||
      !toPaymentMethod ||
      !payAmount ||
      payAmount <= 0 ||
      !selectedFromPaymentDetail ||
      !selectedToPaymentDetail
    )) ||
    // Always prevent same-method transfers when both are selected
    (fromPaymentMethod && toPaymentMethod && fromPaymentMethod === toPaymentMethod);

  const handleBeforeLegalNavigate = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const fromName = selectedFromPaymentDetail
        ? getProviderName(selectedFromPaymentDetail)
        : fromPaymentMethod;
      const toName = selectedToPaymentDetail
        ? getProviderName(selectedToPaymentDetail)
        : toPaymentMethod;

      sessionStorage.setItem(
        MONEYX_LEGAL_RETURN_STATE_KEY,
        JSON.stringify({
          isFirstCardSubmitted: true,
          payAmount,
          payAmountInput,
          getAmount,
          getAmountInput,
          bankAccountAddress,
          isAddressConfirmed,
          fromPaymentMethod: fromName,
          toPaymentMethod: toName,
          fromProviderBase: fromName,
          toProviderBase: toName,
          fromPaymentDetail: selectedFromPaymentDetail,
          toPaymentDetail: selectedToPaymentDetail,
          expandedTerms: true,
          isTermsAccepted,
          returnPath:
            typeof window !== "undefined"
              ? `${window.location.pathname}${window.location.search}${window.location.hash}`
              : "/",
        })
      );
      sessionStorage.setItem(RETURNING_FROM_LEGAL_KEY, "1");
    } catch {
      // Ignore storage errors
    }
  }, [
    payAmount,
    payAmountInput,
    getAmount,
    getAmountInput,
    bankAccountAddress,
    isAddressConfirmed,
    isTermsAccepted,
    fromPaymentMethod,
    toPaymentMethod,
    selectedFromPaymentDetail,
    selectedToPaymentDetail,
    getProviderName,
  ]);

  // Restore state when returning from legal pages (Terms, Privacy, etc.)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasStartedLegalRestore.current) return;
    try {
      const returning = sessionStorage.getItem(RETURNING_FROM_LEGAL_KEY);
      if (!returning) return;

      const saved = sessionStorage.getItem(MONEYX_LEGAL_RETURN_STATE_KEY);
      if (!saved) {
        sessionStorage.removeItem(RETURNING_FROM_LEGAL_KEY);
        return;
      }

      hasStartedLegalRestore.current = true;
      const state = JSON.parse(saved);
      isRestoringRef.current = true;

      if (state.payAmountInput !== undefined && state.payAmountInput !== null) {
        const payIn = normalizeMoneyXAmountInputForRestore(state.payAmountInput);
        setPayAmountInput(payIn);
        setPayAmount(
          clampMoneyXAmountNumber(
            state.payAmount ?? (parseFloat(payIn) || 0)
          )
        );
      }
      if (state.getAmountInput !== undefined && state.getAmountInput !== null) {
        const getIn = normalizeMoneyXAmountInputForRestore(state.getAmountInput);
        setGetAmountInput(getIn);
        setGetAmount(
          clampMoneyXAmountNumber(
            state.getAmount ?? (parseFloat(getIn) || 0)
          )
        );
      }
      if (state.bankAccountAddress !== undefined) {
        setBankAccountAddress(state.bankAccountAddress || "");
      }
      if (state.isAddressConfirmed !== undefined) {
        setIsAddressConfirmed(Boolean(state.isAddressConfirmed));
      }

      // Ensure user returns to expanded step with terms visible.
      setIsFirstCardSubmitted(
        state.isFirstCardSubmitted === undefined ? true : Boolean(state.isFirstCardSubmitted)
      );
      hasRestoredFromLegalRef.current = true;
      setExpandedTerms(Boolean(state.expandedTerms));
      // Restore exactly what user had before navigating.
      setIsTermsAccepted(Boolean(state.isTermsAccepted));

      if (state.fromPaymentMethod || state.toPaymentMethod) {
        const fromName = state.fromProviderBase || state.fromPaymentMethod || "";
        const toName = state.toProviderBase || state.toPaymentMethod || "";
        localStorage.setItem("moneyx_restore_from", fromName);
        localStorage.setItem("moneyx_restore_to", toName);
        if (state.fromPaymentDetail) {
          localStorage.setItem("moneyx_restore_from_detail", JSON.stringify(state.fromPaymentDetail));
        }
        if (state.toPaymentDetail) {
          localStorage.setItem("moneyx_restore_to_detail", JSON.stringify(state.toPaymentDetail));
        }
      }

      sessionStorage.removeItem(RETURNING_FROM_LEGAL_KEY);
      hasRestoredState.current = true;

      window.setTimeout(() => {
        sessionStorage.removeItem(MONEYX_LEGAL_RETURN_STATE_KEY);
      }, 1000);
    } catch {
      sessionStorage.removeItem(RETURNING_FROM_LEGAL_KEY);
      sessionStorage.removeItem(MONEYX_LEGAL_RETURN_STATE_KEY);
    }
  }, []);

  return (
    <div className="w-full flex flex-col dark:bg-[#18181D]">
      <div className="mb-2" />

      {/* API Validation Error - Show as simple red text */}
      {apiValidationError && (
        <div className="mb-4 text-red-500 text-sm font-medium">
          {apiValidationError}
        </div>
      )}


      <div className={`w-full ${isDark ? "text-white" : "text-[#1F2937]"}`}>
        {/* Top Section - Amount and From Payment Method in one card */}
        <div className="relative mb-4">
          {/* Top Card Container */}
          <div
            data-asset-card="true"
            data-select-card="true"
            className={`relative flex flex-col sm:flex-row gap-4 rounded-2xl p-3 sm:p-4 overflow-visible ${isDark ? "bg-[#0F0F17] border border-[#2F2F3A]" : "bg-white border border-[#E2E8F0] shadow-sm"
              }`}
          >
            {/* Amount Section */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
                {t("express.youSend", "You Send")}
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
              </label>
              <div className={`text-xs mb-1 ${isDark ? "text-[#788099]" : "text-[#64748B]"
                }`}>
                {t("express.amount", "Amount")}
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={payAmountInput}
                  maxLength={MONEYX_MAX_AMOUNT_INPUT_DIGITS + 1}
                  onChange={(e) => {
                    handleAmountChange(e.target.value, true);
                  }}
                  placeholder={t("express.enterAmount", "Enter amount")}
                  className={homeCardAmountFieldClass(isDark)}
                />
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
                {t("express.fromPaymentMethod", "From Payment Method")}
                <div className="w-2 h-2 opacity-0" aria-hidden />
              </label>
              <div
                className={`text-xs mb-1 invisible select-none ${isDark ? "text-[#788099]" : "text-[#64748B]"}`}
                aria-hidden
              >
                Amount
              </div>
              <div className="relative">
                <CustomSelect
                  options={fromPaymentMethodOptions}
                  value={fromPaymentMethod}
                  logoSize={PAYMENT_LOGO_SIZE}
                  logoClassName={`${PAYMENT_LOGO_BASE_CLASS} rounded-full`}
                  dropdownMatchTriggerWidth={true}
                  dropdownMinWidth={460}
                  dropdownMaxWidth={460}
                  className="w-full"
                  placeholderClassName="text-white dark:text-white"
                  triggerClassName={homeCardSelectTriggerClass(isDark)}
                  onChange={(value) => {
                    void handleFromPaymentChange(value);
                  }}
                  placeholder={
                    paymentMethodsDisplay.isLoading && fromPaymentMethods.length === 0
                      ? "Loading payment methods..."
                      : "Select From Payment Method"
                  }
                  disabled={paymentMethodsDisplay.isLoading && fromPaymentMethods.length === 0}
                  loading={paymentMethodsDisplay.isLoading && fromPaymentMethods.length === 0}
                  loadingText="Loading payment methods..."
                  emptyText="No payment methods available"
                  searchable={true}
                  dropdownTitle="From payment method"
                  dropdownOffsetY={-68}
                  dropdownOffsetX={0}
                />
              </div>
              {paymentMethodsError && (
                <p className="text-red-500 text-sm mt-1">{paymentMethodsError}</p>
              )}
            </div>
          </div>

          {/* Swap Circle - positioned to touch both borders equally */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full -translate-y-1/3 z-10">
            <button
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105"
              onClick={() => {
                void handleSwapPaymentMethods();
              }}
            >
              {/* Light mode image */}
              <img
                src="/assets/Frame_36261_1_d9cnq1.png"
                alt="swap icon"
                className="w-10 h-10 dark:hidden"
              />
              {/* Dark mode image */}
              <img
                src="/assets/Frame_36261_ledmyw.png"
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
            className={`relative flex flex-col sm:flex-row gap-4 rounded-2xl p-3 sm:p-4 overflow-visible ${isDark ? "bg-[#0F0F17] border border-[#2F2F3A]" : "bg-white border border-[#E2E8F0] shadow-sm"
              }`}
          >
            {/* You Receive Section */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
                {t("express.youReceive", "You Receive")}
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
              </label>
              <div className={`text-xs mb-1 ${isDark ? "text-[#788099]" : "text-[#64748B]"
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
                  className={homeCardAmountFieldClass(isDark)}
                />
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold flex items-center gap-2">
                {t("express.toPaymentMethod", "To Payment Method")}
                <div className="w-2 h-2 opacity-0" aria-hidden />
              </label>
              <div
                className={`text-xs mb-1 invisible select-none ${isDark ? "text-[#788099]" : "text-[#64748B]"}`}
                aria-hidden
              >
                Amount
              </div>
              <div className="relative">
                <CustomSelect
                  options={toPaymentMethodOptions.filter(
                    (opt) => opt.value !== fromPaymentMethod
                  )}
                  value={toPaymentMethod}
                  logoSize={PAYMENT_LOGO_SIZE}
                  logoClassName={`${PAYMENT_LOGO_BASE_CLASS} rounded-full`}
                  dropdownMatchTriggerWidth={true}
                  dropdownMinWidth={460}
                  dropdownMaxWidth={460}
                  className="w-full"
                  placeholderClassName="text-white dark:text-white"
                  triggerClassName={homeCardSelectTriggerClass(isDark)}
                  onChange={(value) => {
                    void handleToPaymentChange(value);
                  }}
                  placeholder={
                    toLoading || (fromLoading && fromPaymentMethods.length === 0)
                      ? "Loading payment methods..."
                      : "Select To Payment Method"
                  }
                  disabled={toLoading || !selectedFromPaymentDetail}
                  loading={toLoading}
                  loadingText="Loading payment methods..."
                  emptyText="No payment methods available"
                  searchable={true}
                  dropdownTitle="To payment method"
                  dropdownOffsetY={-68}
                  dropdownOffsetX={0}
                />
              </div>
              {(paymentMethodsError || toPaymentMethodsError) && (
                <p className="text-red-500 text-sm mt-1">{paymentMethodsError || toPaymentMethodsError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Validation Errors Display */}
        {validationErrors.length > 0 && (
          <div className="w-full px-2 mb-4">
            <div
              className={`border border-[#1D8751] rounded-2xl p-3 sm:p-4 ${isDark ? "bg-[#1D1D23]" : "bg-[#F8FAFF]"
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
              src="/assets/alert-circle_1_ujybne.png"
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
          <div className="relative flex flex-col gap-3">
            {(actionError || moneyXError) && (
              <p className="text-red-500 text-sm font-medium text-center px-1">
                {normalizeExpressApiErrorMessage(actionError || moneyXError)}
              </p>
            )}
            <button
              type="button"
              className={`w-full text-base font-medium py-1.5 rounded-full flex items-center justify-center gap-2 transition-colors text-white ${isTransferDisabled
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#1D8751] hover:bg-[#1D8751]/80"
                }`}
              onClick={() => {
                setActionError(null);
                dispatch(clearMoneyXError());
                handleFirstCardSubmit();
              }}
              disabled={!!isTransferDisabled}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#35353e] dark:border-[#788099]"></div>
                  <span>Submiting...</span>
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
          {/* 1- Account details: display provider's account (where user sends money) - do not use what user types */}
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-[#788099] inline-flex items-center gap-2">
            1- Account details
          </h2>
          <ProviderPaymentDetailsCard
            paymentDetail={selectedFromPaymentDetail}
            fallbackProviderName={getProviderName(selectedFromPaymentDetail)}
            instruction={
              <>
                Copy the following account to deposit the{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${payAmount.toFixed(2)}
                </span>{" "}
                amount
              </>
            }
          />

          {/* 2- Bank Account Address (user's receiving account) */}
          <h2 className="text-xl font-bold mb-2 text-[#788099] dark:text-[#788099] inline-flex items-center gap-2">
            <span className="text-[#7e7e8f] dark:text-[#788099]">2-</span>
            {getProviderName(selectedToPaymentDetail)
              ? `${getProviderName(selectedToPaymentDetail)} Account Number`
              : "Bank Account Number"}
          </h2>

          {/* Important Warning Banner - same style as swap/deposit */}
          <div className="mb-4 p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl">
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                <span className="font-bold">Important:</span> Please send only the agreed amount from your own bank or mobile money account. Sending from a third-party account or to wrong details may result in <span className="font-bold">delays or permanent loss</span>.
              </p>
            </div>
          </div>

          <div
            ref={paymentDetailsRef}
            className="flex flex-col dark:bg-[#0F0F17] border-1 border-[#35353E] rounded-2xl p-3 sm:p-5 shadow-lg w-full text-[#35353e] dark:text-[#788099] mb-6"
          >
            {/* Bank Account Address Label */}
            <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
              {getProviderName(selectedToPaymentDetail)
                ? `${getProviderName(selectedToPaymentDetail)} Account Number`
                : "Bank Account Number"}
            </label>
            {/* Input group */}
            <div className="flex items-center dark:bg-[#1D1D23] border border-[#39394a] dark:border-[#35353E] rounded-2xl px-2 sm:px-4 py-2 mb-0 overflow-visible gap-1 sm:gap-2">
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
                  clearSaveBookmarkError();
                  setBankAccountAddress(value);
                  setIsAddressConfirmed(false);
                  setBankAddressError(null);
                }}
                placeholder={
                  getProviderName(selectedToPaymentDetail)
                    ? `Paste here your ${getProviderName(selectedToPaymentDetail)} Account Number`
                    : "Paste here your Bank Account Number"
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
                  await Promise.all([
                    fetchBookmarks(),
                    dispatch(fetchUserPaymentDetails() as any),
                  ]);
                }}
                title="Saved accounts & payment methods"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <BookmarkDropdown
                  isOpen={bookmarkOpen}
                  onClose={() => setBookmarkOpen(false)}
                  bookmarks={mergedSavedAddresses}
                  loading={bookmarksLoading}
                  saving={bookmarkSaving}
                  currentAddress={bankAccountAddress}
                  asset={currentBankAsset || "BANK"}
                  network="BANK"
                  onSelect={(addr) => {
                    clearSaveBookmarkError();
                    setBankAccountAddress(addr);
                    setBankAddressError(null);
                  }}
                  onSaveCurrent={async (label) => {
                    try {
                      if (!bankAccountAddress.trim() || !currentBankAsset) return;
                      await saveBookmark({
                        address: bankAccountAddress.trim(),
                        label,
                        network: "BANK",
                        asset: currentBankAsset,
                      });
                    } catch { /* handled by hook */ }
                  }}
                  labelKind="account"
                  defaultLabel={currentProviderLabel}
                  saveError={saveBookmarkError}
                  onDelete={(b) => deleteBookmark(b.id)}
                  anchorRef={bookmarkAnchorRef}
                  isDark={isDark}
                  saveDisabled={!!bankAddressError || !bankAccountAddress.trim()}
                  providerDisplayName={currentProviderLabel}
                  onAddPaymentMethod={() => setShowAddPaymentModal(true)}
                />
              </span>
              {/* Paste button */}
              <button
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    clearSaveBookmarkError();
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

            {saveBookmarkError && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                ❌ {saveBookmarkError}
              </p>
            )}

            {/* MoneyX Terms & Conditions */}
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
                <p className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-sm mb-3`}>
                  Before proceeding, please carefully read and agree to the following terms:
                </p>
                <div className={`space-y-2 sm:space-y-3 ${expandedTerms ? "" : "line-clamp-3"}`}>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">1.</span>
                    <div>
                      <span className={`${isDark ? "text-white" : "text-gray-900"} text-xs sm:text-sm font-semibold block`}>Ownership of sending and receiving accounts</span>
                      <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-xs sm:text-sm`}>
                        You must use a wallet, bank account, or mobile money number that you personally own and control. Third-party accounts are not allowed.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">2.</span>
                    <div>
                      <span className={`${isDark ? "text-white" : "text-gray-900"} text-xs sm:text-sm font-semibold block`}>Provide correct sending and receiving details</span>
                      <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-xs sm:text-sm`}>
                        You must enter the correct details for the transaction. Always verify all details before confirming.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-[#1D8751] font-bold text-sm sm:text-base shrink-0">3.</span>
                    <div>
                      <span className={`${isDark ? "text-white" : "text-gray-900"} text-xs sm:text-sm font-semibold block`}>Send funds only to our official accounts</span>
                      <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-xs sm:text-sm`}>
                        You must send funds only to the OMAYA account displayed in the app. Sending to any other account is at your own risk.
                      </span>
                    </div>
                  </div>
                </div>

                {expandedTerms && (
                  <div className={`space-y-2 sm:space-y-3 mt-4 ${isDark ? "border-accent" : "border-gray-200"}`}>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-[#1D8751] font-bold text-sm sm:text-base shrink-0">4.</span>
                      <div>
                        <span className={`${isDark ? "text-white" : "text-gray-900"} text-xs sm:text-sm font-semibold block`}>Irreversible transactions & user responsibility</span>
                        <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-xs sm:text-sm`}>
                          Transactions are irreversible. If you enter incorrect details, funds may be permanently lost.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-[#1D8751] font-bold text-sm sm:text-base shrink-0">5.</span>
                      <div>
                        <span className={`${isDark ? "text-white" : "text-gray-900"} text-xs sm:text-sm font-semibold block`}>Transaction time limit</span>
                        <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-xs sm:text-sm`}>
                          You must send funds only while the transaction timer is active. Transactions sent after timer expiry may be rejected or lost.
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
          </div>

          {/* Terms Acceptance Checkbox */}
          <div className="flex items-start gap-3 mt-4">
            <style>{`
              input[type="checkbox"].terms-checkbox-green:checked {
                background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
              }
            `}</style>
            <input
              type="checkbox"
              id="moneyx-terms-accept"
              className="terms-checkbox-green mt-1 mr-3 w-4 h-4 rounded border-2 border-[#1D8751] focus:ring-[#1D8751] appearance-none bg-transparent checked:bg-[#1D8751] checked:border-[#1D8751] flex-shrink-0"
              checked={isTermsAccepted}
              onChange={(e) => setIsTermsAccepted(e.target.checked)}
            />
            <div className="flex items-center gap-1 whitespace-nowrap">
              <label
                htmlFor="moneyx-terms-accept"
                className={`text-sm cursor-pointer ${isDark ? "text-[#788099]" : "text-gray-700"}`}
              >
                I agree to the
              </label>
              <Link
                href="/legal/terms-of-service"
                onClick={handleBeforeLegalNavigate}
                className="text-[#1D8751] text-sm cursor-pointer hover:underline"
              >
                Terms of Use
              </Link>
            </div>
          </div>

          {/* Warning Message */}
          <div className="mt-4 mb-3 flex items-center gap-3 p-3 rounded-2xl bg-transparent">
            <img
              src="/assets/alert-circle_1_ujybne.png"
              alt="Warning"
              className="w-5 h-5 flex-shrink-0"
            />
            <p className={`text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
              This is only an estimated price based on current market rates. The final price will be confirmed when we receive the funds.
            </p>
          </div>

          {/* Final Submit Button */}
          <div className="flex flex-col gap-3 w-full px-2">
            {(actionError || moneyXError) && (
              <p className="text-red-500 text-sm font-medium text-center px-1">
                {normalizeExpressApiErrorMessage(actionError || moneyXError)}
              </p>
            )}
            <button
              className={`w-full text-base font-medium py-1.5 rounded-full flex items-center justify-center gap-2 transition-colors text-white ${!bankAccountAddress.trim() || bankAddressError || !isAddressConfirmed || !isTermsAccepted
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#1D8751] hover:bg-[#1D8751]/80"
                }`}
              onClick={async () => {
                setActionError(null);
                dispatch(clearMoneyXError());
                if (!bankAccountAddress.trim()) {
                  setActionError("Please enter a bank account address");
                  return;
                }
                if (bankAddressError) {
                  setActionError("Please enter a valid bank account address");
                  return;
                }
                if (!isAddressConfirmed) {
                  setActionError("Please confirm the bank account address");
                  return;
                }
                if (!isTermsAccepted) {
                  setActionError("Please accept the Terms of Use to continue");
                  return;
                }

                // Redirect to login when not authenticated (save state including bank account)
                if (requiresLoginRedirect) {
                  const fromProviderBase = selectedFromPaymentDetail?.provider || getProviderName(selectedFromPaymentDetail) || fromPaymentMethod;
                  const toProviderBase = selectedToPaymentDetail?.provider || getProviderName(selectedToPaymentDetail) || toPaymentMethod;
                  const state = {
                    mode: "moneyx",
                    amountInput: payAmountInput,
                    amountValue: payAmount,
                    receiveAmountInput: getAmountInput,
                    receiveAmountValue: getAmount,
                    fromPaymentMethod: fromPaymentMethod,
                    toPaymentMethod: toPaymentMethod,
                    fromProviderBase,
                    toProviderBase,
                    fromPaymentDetail: selectedFromPaymentDetail ? { ...selectedFromPaymentDetail } : null,
                    toPaymentDetail: selectedToPaymentDetail ? { ...selectedToPaymentDetail } : null,
                    bankAccountAddress: bankAccountAddress.trim(),
                  };
                  localStorage.setItem("moneyx_form_state", JSON.stringify(state));
                  setAuthRedirectPath(buildMoneyXRedirectPath(state));
                  setMoneyXPrefillState(state);
                  router.push("/auth/login");
                  return;
                }

                // Check if user is verified (KYC check) - verify with API
                if (isAuthenticated && user) {
                  try {
                    const kycResult = await dispatch(checkKYCStatus()).unwrap();
                    const kycStatus = kycResult as any;
                    if (!kycStatus || kycStatus.is_verified !== true) {
                      dispatch(openKYCModal());
                      return;
                    }
                  } catch (error) {
                    dispatch(openKYCModal());
                    return;
                  }
                }

                setIsUpdatingTransaction(true);

                try {
                  const recipientName =
                    user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`.trim()
                      : user?.first_name || user?.last_name || "";

                  const payload = buildMoneyXTransactionPayload({
                    amount: payAmount,
                    senderProvider: selectedFromPaymentDetail,
                    receiverProvider: selectedToPaymentDetail,
                    recipientName: recipientName || "User",
                    recipientAccountNumber: bankAccountAddress,
                  });

                  const result = await dispatch(
                    createMoneyXTransaction(payload)
                  ).unwrap();

                  showToast.success("Transaction is successful", "Account updated successfully.");

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
                  const scamMsg = resolveScamFlagDisplayError(
                    error,
                    error?.response?.data,
                    typeof error === "string" ? error : error?.message
                  );
                  if (scamMsg) {
                    setActionError(scamMsg);
                    return;
                  }
                  setActionError(
                    normalizeExpressApiErrorMessage(
                      error || "An error occurred while updating the transaction.",
                      error?.response?.data,
                      error
                    )
                  );
                } finally {
                  setIsUpdatingTransaction(false);
                }
              }}
              disabled={!bankAccountAddress.trim() || !!bankAddressError || !isAddressConfirmed || !isTermsAccepted || isSubmitting || isUpdatingTransaction || moneyXLoading}
            >
              {isSubmitting || isUpdatingTransaction ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#35353e] dark:border-[#35353E]"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="text-base font-medium text-white">MoneyX</span>

                </span>
              )}
            </button>
          </div>
        </>
      )}
      <PaymentMethodsModal
        open={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
        filterByProviderName={currentProviderLabel || undefined}
        initialAccountNumber={bankAccountAddress.trim()}
        onAddSuccess={() => {
          setShowAddPaymentModal(false);
          dispatch(fetchUserPaymentDetails() as any);
          fetchBookmarks();
        }}
      />
    </div>
  );
}
