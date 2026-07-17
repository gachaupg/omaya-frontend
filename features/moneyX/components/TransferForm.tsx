"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import {
  fetchUserPaymentDetails,
} from "@/features/p2p/slices/paymentMethodsSlice";
import { useMoneyXPaymentMethodLists } from "@/features/express/hooks/useMoneyXPaymentMethodLists";
import { matchMoneyXMethodById } from "@/features/express/utils/moneyXPaymentMethodUtils";
import {
  createMoneyXTransaction,
  fetchMoneyXCommission,
  clearMoneyXError,
} from "../slices/moneyXSlice";
import { buildMoneyXTransactionPayload } from "../utils/buildMoneyXTransactionPayload";
import { useTheme } from "@/context/theme";
import CustomSelect from "@/components/ui/CustomSelect";
import { showToast } from "../../../lib/utils/toast";
import { normalizeExpressApiErrorMessage } from "@/lib/utils/expressMinAmount";
import {
  resolveScamFlagDisplayError,
} from "@/lib/utils/scamFlagError";
import { scrollAppToTop } from "@/lib/utils/scrollAppToTop";
import { useBookmarkedAddresses } from "@/features/express/hooks/useBookmarkedAddresses";
import { BookmarkDropdown } from "@/features/express/components/forms/BookmarkDropdown";
import PaymentMethodsModal from "@/features/p2p/components/ui/p2pdashboard/sections/PaymentMethodsModal";
import ProviderPaymentDetailsCard from "@/components/ui/ProviderPaymentDetailsCard";
import { usePaymentMethodsDisplay } from "../../express/hooks/useDataDisplay";
import { pickDefaultMoneyXFromMethod } from "@/features/express/utils/defaultMoneyXFromProvider";
import { useExpressI18n } from "@/lib/useExpressI18n";
import {
  clampMoneyXAmountNumber,
  getMoneyXMaxAmountErrorMessage,
  isMoneyXAmountOverHardLimit,
  MONEYX_MAX_AMOUNT_INPUT_DIGITS,
  normalizeMoneyXAmountInputForRestore,
  prepareMoneyXAmountFieldValue,
  toMoneyXClampedInputString,
} from "@/lib/utils/moneyXAmountInput";
import { getCleanPaymentProviderLabel, getPaymentMethodDisplayTitle, getPaymentMethodSelectLabels, stripPaymentMethodTypeSuffix } from "@/lib/utils/paymentProviderLabel";

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
  initialState?: Record<string, any>;
  /** Used for range-commissions API: commission_type=deposit | withdrawal */
  commissionType?: "deposit" | "withdrawal";
}

export default function TransferForm({ onTransfer, initialState, commissionType = "deposit" }: TransferFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { isDark } = useTheme();
  const { t } = useExpressI18n();

  const { userPaymentDetails } = useSelector((state: any) => state.paymentMethods);

  const {
    transaction: moneyXTransaction,
    loading: moneyXLoading,
    error: moneyXError,
  } = useSelector((state: any) => state.moneyX);

  const { isAuthenticated, user } = useSelector((state: any) => state.auth);

  const {
    fromMethods: fromPaymentMethods,
    toMethods: toPaymentMethods,
    allFromReady,
    fromLoading,
    toLoading,
    fromError: paymentMethodsError,
    toError: toPaymentMethodsError,
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

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserPaymentDetails());
    }
  }, [dispatch, isAuthenticated]);

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
  const [apiCommission, setApiCommission] = useState<number | null>(null);
  const [apiCommissionIsPercentage, setApiCommissionIsPercentage] = useState(true);
  const commissionFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const paymentDetailsRef = useRef<HTMLDivElement>(null);

  const MONEYX_LEGAL_RETURN_STATE_KEY = "omaya_moneyx_legal_return_state";
  const RETURNING_FROM_LEGAL_KEY = "omaya_returning_from_legal";

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
  // Skip when we've just restored from login - keep form expanded with bank account
  const fromKey = selectedFromPaymentDetail?.id ?? selectedFromPaymentDetail?.provider_id ?? fromPaymentMethod ?? "";
  const toKey = selectedToPaymentDetail?.id ?? selectedToPaymentDetail?.provider_id ?? toPaymentMethod ?? "";
  const isRestoringRef = useRef(false);
  useEffect(() => {
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }
    if (hasRestoredState.current) return; // Never collapse after restore
    setIsFirstCardSubmitted(false);
  }, [fromKey, toKey, payAmount, getAmount]);

  // Helper function to get provider name from payment method
  const getProviderName = useCallback((payment: any) => {
    if (!payment) return "";
    return (
      getPaymentMethodDisplayTitle(payment) ||
      getCleanPaymentProviderLabel(payment) ||
      stripPaymentMethodTypeSuffix(
        payment.provider_name ||
          payment.provider ||
          payment.provider?.provider_name ||
          payment.method?.method_name ||
          payment.payment_method_name ||
          ""
      )
    );
  }, []);

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

  const effectiveToPaymentMethods = useMemo(
    () => (toPaymentMethods.length > 0 ? toPaymentMethods : fromPaymentMethods),
    [toPaymentMethods, fromPaymentMethods]
  );

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

      setFromPaymentMethod(getPaymentMethodKey(matchedFrom));
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
        effectiveToPaymentMethods?.find(
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
      effectiveToPaymentMethods,
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

  const handleBeforeLegalNavigate = useCallback(() => {
    try {
      const fromName = selectedFromPaymentDetail ? getProviderName(selectedFromPaymentDetail) : fromPaymentMethod;
      const toName = selectedToPaymentDetail ? getProviderName(selectedToPaymentDetail) : toPaymentMethod;
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
    fromPaymentMethod,
    toPaymentMethod,
    selectedFromPaymentDetail,
    selectedToPaymentDetail,
    getProviderName,
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

  // Restore state on mount - from initialState (URL/sessionStorage) or localStorage
  useEffect(() => {
    if (hasRestoredState.current) return;
    if (isAuthenticated === undefined) return;
    if (!isAuthenticated) return;

    const state = initialState || (() => {
      try {
        const saved = localStorage.getItem("moneyx_form_state");
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    })();

    if (state) {
      try {
        console.log("🔄 [Dashboard] Restoring moneyx form state:", state);

        isRestoringRef.current = true;

        const restoredPayInput = normalizeMoneyXAmountInputForRestore(
          state.amountInput
        );
        if (restoredPayInput) {
          const sendAmount = clampMoneyXAmountNumber(
            state.amountValue || parseFloat(restoredPayInput) || 0
          );
          setPayAmountInput(restoredPayInput);
          setPayAmount(sendAmount);
        }
        const restoredGetInput = normalizeMoneyXAmountInputForRestore(
          state.receiveAmountInput
        );
        if (restoredGetInput) {
          const receiveAmount = clampMoneyXAmountNumber(
            state.receiveAmountValue || parseFloat(restoredGetInput) || 0
          );
          setGetAmountInput(restoredGetInput);
          setGetAmount(receiveAmount);
        }

        if (state.bankAccountAddress) {
          setBankAccountAddress(state.bankAccountAddress);
          setIsFirstCardSubmitted(true);
        }

        if (state.fromPaymentMethod || state.toPaymentMethod) {
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
        }

        localStorage.removeItem("moneyx_form_state");
        hasRestoredState.current = true;
      } catch (error) {
        console.error("❌ [Dashboard] Failed to restore moneyx form state:", error);
      }
    }
  }, [isAuthenticated, initialState]);

  // Restore state when returning from legal pages (Terms, Privacy, etc.)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isAuthenticated === undefined || !isAuthenticated) return;
    try {
      const returning = sessionStorage.getItem(RETURNING_FROM_LEGAL_KEY);
      if (!returning) return;

      const saved = sessionStorage.getItem(MONEYX_LEGAL_RETURN_STATE_KEY);
      if (!saved) {
        sessionStorage.removeItem(RETURNING_FROM_LEGAL_KEY);
        return;
      }

      const state = JSON.parse(saved);
      isRestoringRef.current = true;

      const restoredPayInput = normalizeMoneyXAmountInputForRestore(
        state.payAmountInput
      );
      if (restoredPayInput) {
        setPayAmountInput(restoredPayInput);
        setPayAmount(
          clampMoneyXAmountNumber(
            state.payAmount ?? (parseFloat(restoredPayInput) || 0)
          )
        );
      }
      const restoredGetInput = normalizeMoneyXAmountInputForRestore(
        state.getAmountInput
      );
      if (restoredGetInput) {
        setGetAmountInput(restoredGetInput);
        setGetAmount(
          clampMoneyXAmountNumber(
            state.getAmount ?? (parseFloat(restoredGetInput) || 0)
          )
        );
      }
      if (state.bankAccountAddress !== undefined) {
        setBankAccountAddress(state.bankAccountAddress || "");
      }
      if (state.isAddressConfirmed !== undefined) {
        setIsAddressConfirmed(state.isAddressConfirmed);
      }
      setIsFirstCardSubmitted(true);
      setExpandedTerms(Boolean(state.expandedTerms ?? true));

      if (state.fromPaymentMethod || state.toPaymentMethod) {
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
  }, [isAuthenticated]);

  // Restore payment methods after they're loaded
  useEffect(() => {
    if (isAuthenticated === undefined || !isAuthenticated) return;
    if (!allFromReady || fromPaymentMethods.length === 0) return;
    if (paymentMethodRestoreAttempted.current) return;

    const restoreFrom = localStorage.getItem("moneyx_restore_from");
    const restoreTo = localStorage.getItem("moneyx_restore_to");
    if (!restoreFrom && !restoreTo) return;

    paymentMethodRestoreAttempted.current = true;
    isRestoringRef.current = true;

    void (async () => {
      let matchedFromMethod: any = null;
      let matchedToMethod: any = null;
      let savedToDetail: any = null;

      if (restoreTo) {
        const savedToDetailRaw = localStorage.getItem("moneyx_restore_to_detail");
        if (savedToDetailRaw) {
          try {
            savedToDetail = JSON.parse(savedToDetailRaw);
          } catch {
            savedToDetail = null;
          }
        }
      }

      if (restoreFrom) {
        const savedFromDetailRaw = localStorage.getItem("moneyx_restore_from_detail");
        if (savedFromDetailRaw) {
          try {
            const fromDetail = JSON.parse(savedFromDetailRaw);
            matchedFromMethod = fromPaymentMethods.find((m: any) => {
              const providerName = getProviderName(m);
              return (
                (m.id && m.id === fromDetail.id) ||
                (m.provider_id && m.provider_id === fromDetail.provider_id) ||
                (providerName === restoreFrom) ||
                getPaymentMethodKey(m) === restoreFrom
              );
            });
          } catch {
            // ignore parse errors
          }
        }

        if (!matchedFromMethod) {
          matchedFromMethod = fromPaymentMethods.find(
            (m: any) =>
              getProviderName(m) === restoreFrom ||
              getPaymentMethodKey(m) === restoreFrom
          );
        }

        if (matchedFromMethod) {
          setFromPaymentMethod(getPaymentMethodKey(matchedFromMethod) || restoreFrom);
          setSelectedFromPaymentDetail(matchedFromMethod);
          matchedToMethod = await refreshToForFrom(
            matchedFromMethod,
            savedToDetail,
            { force: true }
          );
          if (matchedToMethod) {
            setToPaymentMethod(getPaymentMethodKey(matchedToMethod) || restoreTo || "");
            setSelectedToPaymentDetail(matchedToMethod);
          }
        }
      }

      if (restoreTo && !matchedToMethod) {
        const methodsToCheck = effectiveToPaymentMethods;
        if (savedToDetail) {
          matchedToMethod = methodsToCheck.find((m: any) => {
            const providerName = getProviderName(m);
            return (
              (m.id && m.id === savedToDetail.id) ||
              (m.provider_id && m.provider_id === savedToDetail.provider_id) ||
              (providerName === restoreTo) ||
              getPaymentMethodKey(m) === restoreTo
            );
          });
        }
        if (!matchedToMethod) {
          matchedToMethod = methodsToCheck.find(
            (m: any) =>
              getProviderName(m) === restoreTo ||
              getPaymentMethodKey(m) === restoreTo
          );
        }
        if (matchedToMethod) {
          setToPaymentMethod(getPaymentMethodKey(matchedToMethod) || restoreTo);
          setSelectedToPaymentDetail(matchedToMethod);
        }
      }

      setIsFirstCardSubmitted(true);

      const restoredFrom = !restoreFrom || !!matchedFromMethod;
      const restoredTo = !restoreTo || !!matchedToMethod;
      if (restoredFrom && restoredTo) {
        localStorage.removeItem("moneyx_restore_from");
        localStorage.removeItem("moneyx_restore_to");
        localStorage.removeItem("moneyx_restore_from_cleaned");
        localStorage.removeItem("moneyx_restore_to_cleaned");
        localStorage.removeItem("moneyx_restore_from_detail");
        localStorage.removeItem("moneyx_restore_to_detail");
      } else {
        paymentMethodRestoreAttempted.current = false;
      }
    })();
  }, [
    allFromReady,
    fromPaymentMethods,
    effectiveToPaymentMethods,
    isAuthenticated,
    getProviderName,
    getPaymentMethodKey,
    refreshToForFrom,
  ]);

  // Initial default: Salaam From + scoped To (mobile parity)
  useEffect(() => {
    if (!allFromReady || fromPaymentMethods.length === 0) return;
    if (moneyXInitializedRef.current) return;

    const isRestoring =
      localStorage.getItem("moneyx_restore_from") ||
      localStorage.getItem("moneyx_restore_to");
    if (isRestoring) return;
    if (fromPaymentMethod) return;

    moneyXInitializedRef.current = true;
    const defaultFrom = pickDefaultMoneyXFromMethod(fromPaymentMethods);
    if (!defaultFrom) return;

    const fromKey = getPaymentMethodKey(defaultFrom);
    setFromPaymentMethod(fromKey);
    setSelectedFromPaymentDetail(defaultFrom);

    if (!payAmountInput || payAmountInput === "" || payAmount === 0) {
      setPayAmountInput("100");
      setPayAmount(100);
      setGetAmountInput("98");
      setGetAmount(98);
    }

    void refreshToForFrom(defaultFrom, null, { force: true }).then((matchedTo) => {
      if (!matchedTo) return;
      setToPaymentMethod(getPaymentMethodKey(matchedTo));
      setSelectedToPaymentDetail(matchedTo);
    });
  }, [
    allFromReady,
    fromPaymentMethods,
    fromPaymentMethod,
    payAmountInput,
    payAmount,
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
        logo: logoUrl,
      };
    });
  }, [getProviderName, getPaymentMethodKey]);

  const fromPaymentMethodOptions = useMemo(
    () => buildPaymentMethodOptions(fromPaymentMethods),
    [fromPaymentMethods, buildPaymentMethodOptions]
  );

  const toPaymentMethodOptions = useMemo(
    () => buildPaymentMethodOptions(effectiveToPaymentMethods),
    [effectiveToPaymentMethods, buildPaymentMethodOptions]
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

  // First button: validate and show next section only (no API post)
  const handleFirstCardSubmit = () => {
    setValidationErrors([]);
    setApiValidationError(null);

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
    !fromPaymentMethod ||
    !toPaymentMethod ||
    !payAmount ||
    payAmount <= 0 ||
    fromPaymentMethod === toPaymentMethod ||
    !selectedFromPaymentDetail ||
    !selectedToPaymentDetail;

  return (
    <div className="flex flex-col dark:bg-[var(--bg-color)] w-full box-border">
      {/* Money X Page Title */}
      <h1 className="flex items-center text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-[#76777B] dark:text-white [.deem_&]:text-white uppercase">
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
                  maxLength={MONEYX_MAX_AMOUNT_INPUT_DIGITS + 1}
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
                  options={fromPaymentMethodOptions}
                  value={fromPaymentMethod}
                  sizeMode="card"
                  onChange={(value) => {
                    void handleFromPaymentChange(value);
                  }}
                  placeholder={
                    paymentMethodsDisplay.isLoading &&
                      fromPaymentMethods.length === 0
                      ? "Loading payment methods..."
                      : fromPaymentMethods.length > 0
                        ? "Select From Payment Method"
                        : "No payment methods available"
                  }
                  disabled={
                    paymentMethodsDisplay.isLoading &&
                    fromPaymentMethods.length === 0
                  }
                  loading={
                    paymentMethodsDisplay.isLoading &&
                    fromPaymentMethods.length === 0
                  }
                  loadingText="Loading payment methods..."
                  emptyText="No payment methods available"
                  searchable={true}
                  className="w-full"
                  triggerClassName="h-[48px] w-full"
                />
              </div>
              {(paymentMethodsError || toPaymentMethodsError) && (
                <p className="text-red-500 text-sm mt-1">{paymentMethodsError || toPaymentMethodsError}</p>
              )}
            </div>
          </div>

          {/* Swap Circle - positioned to touch both borders equally */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full -translate-y-1/3 z-10">
            <button
              className="w-10 h-10 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105 sm:min-h-0 touch-manipulation"
              onClick={() => {
                void handleSwapPaymentMethods();
              }}
            >
              {/* Light mode image */}
              <img
                src="/assets/Frame_36261_1_d9cnq1.png"
                alt="swap icon"
                className="w-10 h-10 sm:w-10 sm:h-10 dark:hidden"
              />
              {/* Dark mode image */}
              <img
                src="/assets/Frame_36261_ledmyw.png"
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
                  options={toPaymentMethodOptions.filter(
                    (opt) => opt.value !== fromPaymentMethod
                  )}
                  value={toPaymentMethod}
                  sizeMode="card"
                  onChange={(value) => {
                    void handleToPaymentChange(value);
                  }}
                  placeholder={
                    toLoading || (fromLoading && fromPaymentMethods.length === 0)
                      ? "Loading payment methods..."
                      : effectiveToPaymentMethods.length > 0
                        ? "Select To Payment Method"
                        : "No payment methods available"
                  }
                  disabled={
                    toLoading ||
                    !selectedFromPaymentDetail ||
                    (fromLoading && fromPaymentMethods.length === 0)
                  }
                  loading={toLoading}
                  loadingText="Loading payment methods..."
                  emptyText="No payment methods available"
                  searchable={true}
                  className="w-full"
                  triggerClassName="h-[48px] w-full"
                />
              </div>
              {(paymentMethodsError || toPaymentMethodsError) && (
                <p className="text-red-500 text-sm mt-1">{paymentMethodsError || toPaymentMethodsError}</p>
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
          <div className="mt-4 relative flex flex-col gap-3">
            {(actionError || moneyXError) && (
              <p className="text-red-500 text-sm font-medium text-center px-1">
                {normalizeExpressApiErrorMessage(actionError || moneyXError)}
              </p>
            )}
            <button
              className={`w-full text-white dark:text-white text-sm sm:text-base font-medium py-3 sm:py-2 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-colors min-h-[44px] sm:min-h-0 ${isTransferDisabled
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-[#1D8751] hover:bg-[#166b3e]"
                }`}
              onClick={() => {
                setActionError(null);
                dispatch(clearMoneyXError());
                handleFirstCardSubmit();
              }}
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
            <label className="block text-sm text-[#7e7e8f] mb-2 font-semibold">
              {isMobileMethod(selectedToPaymentDetail)
                ? `${getProviderName(selectedToPaymentDetail)} Number`
                : `${getProviderName(selectedToPaymentDetail)} Account Number`}
            </label>
            {/* Input group */}
            <div className="flex items-center bg-white dark:bg-[#18181D] border border-border dark:border-[#35353E] rounded-2xl px-2 sm:px-4 py-2 mb-0 gap-1 sm:gap-2">
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

            {saveBookmarkError && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                ❌ {saveBookmarkError}
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
                    <span className="text-[#1D8751] font-bold text-sm sm:text-base shrink-0">3.</span>
                    <div>
                      <span className={`${isDark ? "text-white" : "text-gray-900"} text-xs sm:text-sm font-semibold block`}>Send funds only to our official accounts</span>
                      <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-xs sm:text-sm`}>
                        Send funds only to OMAYA accounts, mobile numbers, or merchants displayed in the app. Sending to other accounts is at your own risk.
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
                          Transactions are irreversible. Incorrect details or wrong accounts may result in permanent fund loss—we cannot recover them.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-[#1D8751] font-bold text-sm sm:text-base shrink-0">5.</span>
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
            <div className="flex mb-4 items-start gap-2 mt-4 text-sm text-[#35353e] dark:text-[#788099]">
              <input
                type="checkbox"
                checked={isAddressConfirmed}
                onChange={(event) =>
                  setIsAddressConfirmed(event.target.checked)
                }
                className="w-4 h-4 mt-0.5 rounded border-[#1D8751] text-[#1D8751] accent-[#1D8751] cursor-pointer"
              />
              <span>I have read and agreed to OMAYA.io <Link href="/legal/terms-of-service" rel="noopener noreferrer" className="text-[#1D8751] underline" onClick={(e) => { e.stopPropagation(); handleBeforeLegalNavigate(); }}>Terms of Use</Link>, <Link href="/legal/privacy-policy" rel="noopener noreferrer" className="text-[#1D8751] underline" onClick={(e) => { e.stopPropagation(); handleBeforeLegalNavigate(); }}>Privacy Policy</Link></span>
            </div>
          </div>

          {/* Final Submit Button */}
          <div className="flex flex-col gap-3 w-full px-2">
            {(actionError || moneyXError) && (
              <p className="text-red-500 text-sm font-medium text-center px-1">
                {normalizeExpressApiErrorMessage(actionError || moneyXError)}
              </p>
            )}
            <button
              className={`w-full text-white dark:text-white text-sm sm:text-base font-medium py-3 sm:py-2 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-colors min-h-[44px] sm:min-h-0 ${!bankAccountAddress.trim() || bankAddressError || !isAddressConfirmed
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-[#1D8751] hover:bg-[#166b3e]"
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

                setIsUpdatingTransaction(true);

                try {
                  const recipientName =
                    user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`.trim()
                      : user?.first_name || user?.last_name || user?.email || "User";

                  const payload = buildMoneyXTransactionPayload({
                    amount: payAmount,
                    senderProvider: selectedFromPaymentDetail,
                    receiverProvider: selectedToPaymentDetail,
                    recipientName,
                    recipientAccountNumber: bankAccountAddress,
                  });

                  const result = await dispatch(
                    createMoneyXTransaction(payload)
                  ).unwrap();

                  showToast.success("Transaction is successful", "Account updated successfully.");

                  scrollAppToTop();

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
