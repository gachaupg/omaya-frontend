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
  fetchUserPaymentDetails,
} from "@/features/p2p/slices/paymentMethodsSlice";
import {
  createMoneyXTransaction,
  fetchMoneyXCommission,
} from "@/features/express/home/components/moneyX/slices/moneyXSlice";
import { clearMoneyXError } from "@/features/moneyX/slices/moneyXSlice";
import { buildMoneyXTransactionPayload } from "@/features/moneyX/utils/buildMoneyXTransactionPayload";
import { useTheme } from "@/context/theme";
import { showToast } from "@/lib/utils/toast";
import { normalizeExpressApiErrorMessage } from "@/lib/utils/expressMinAmount";
import { resolveScamFlagDisplayError, isScamFlagUserMessage } from "@/lib/utils/scamFlagError";
import ScamFlagSubmitBanner from "@/features/express/components/ScamFlagSubmitBanner";
import ExpressSubmitAlertBanner from "@/features/express/components/ExpressSubmitAlertBanner";
import { scrollAppToTop } from "@/lib/utils/scrollAppToTop";
import { usePaymentMethodsDisplay } from "@/features/express/hooks/useDataDisplay";
import { useMoneyXPaymentMethodLists } from "@/features/express/hooks/useMoneyXPaymentMethodLists";
import { pickDefaultMoneyXFromMethod } from "@/features/express/utils/defaultMoneyXFromProvider";
import {
  matchMoneyXMethodById,
  isMoneyXBankPaymentMethod,
  getMoneyXPaymentMethodSearchBlob,
} from "@/features/express/utils/moneyXPaymentMethodUtils";
import { setAuthRedirectPath } from "@/lib/utils/authRedirect";
import { ExpressLegalTermsLinks } from "@/features/express/components/legal/ExpressLegalTermsLinks";
import { FiChevronDown, FiInfo } from "react-icons/fi";
import { AlertCircle } from "lucide-react";
import { useRatesI18n } from "@/lib/useRatesI18n";
import Exchanging from "@/features/express/home/components/moneyX/components/Exchanging";
import { checkKYCStatus, openKYCModal } from "@/features/auth/slices/authSlice";
import { useBookmarkedAddresses } from "@/features/express/hooks/useBookmarkedAddresses";
import { BookmarkDropdown } from "@/features/express/components/forms/BookmarkDropdown";
import PaymentMethodsModal from "@/features/p2p/components/ui/p2pdashboard/sections/PaymentMethodsModal";
import ProviderPaymentDetailsCard from "@/components/ui/ProviderPaymentDetailsCard";
import { getHighResPaymentLogo } from "@/features/express/utils/imageHelpers";
import {
  getCleanPaymentProviderLabel,
  getPaymentMethodDisplayTitle,
  getPaymentMethodSelectLabels,
} from "@/lib/utils/paymentProviderLabel";
import {
  clampMoneyXAmountNumber,
  getMoneyXMaxAmountErrorMessage,
  isMoneyXAmountOverHardLimit,
  MONEYX_MAX_AMOUNT_INPUT_DIGITS,
  normalizeMoneyXAmountInputForRestore,
  prepareMoneyXAmountFieldValue,
  toMoneyXClampedInputString,
} from "@/lib/utils/moneyXAmountInput";
import {
  ratesFieldClass,
  ratesFieldLabelClass,
} from "../utils/ratesFieldStyles";

const RATES_MONEYX_FORM_STATE_KEY = "rates_moneyx_form_state";

/** Public payment payloads often nest logos under `provider` or `payment_details[0]`. */
const resolvePaymentMethodLogo = (payment: any): string | undefined => {
  if (!payment || typeof payment !== "object") return undefined;
  const d0 = Array.isArray(payment.admin_payment_details)
    ? payment.admin_payment_details[0]
    : Array.isArray(payment.payment_details)
      ? payment.payment_details[0]
      : undefined;
  const candidates = [
    payment.provider_logo,
    payment.logo,
    payment.image_url,
    payment.icon_url,
    payment.provider?.provider_logo,
    payment.provider?.logo,
    payment.provider?.image_url,
    payment.method?.logo,
    payment.method?.icon,
    d0?.provider_logo,
    d0?.logo,
    d0?.bank_logo,
    d0?.image_url,
    d0?.icon_url,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return undefined;
};

const MoneyXRates = ({
  commissionType = "deposit",
}: {
  commissionType?: "deposit" | "withdrawal";
}) => {
    const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useRatesI18n();
  const { user } = useSelector((state: RootState) => state.auth);

  const {
    userPaymentDetails,
  } = useSelector((state: RootState) => state.paymentMethods);

  const {
    transaction: moneyXTransaction,
    loading: moneyXLoading,
    error: moneyXError,
  } = useSelector((state: RootState) => state.moneyX);

  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

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

  const {
    fromMethods: rawFromMethods,
    toMethods: rawToMethods,
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

  const enrichPaymentMethod = useCallback((payment: any) => {
    const resolvedLogo = resolvePaymentMethodLogo(payment);
    return {
      ...payment,
      short_name: payment.short_name || payment.provider?.short_name || "",
      logo: resolvedLogo || payment.logo || payment.provider_logo || undefined,
      provider_logo:
        resolvedLogo || payment.provider_logo || payment.logo || undefined,
      provider_name:
        payment.provider_name ||
        payment.provider?.provider_name ||
        payment.method?.method_name ||
        payment.payment_method_name,
    };
  }, []);

  const fromPaymentMethods = useMemo(
    () => rawFromMethods.map(enrichPaymentMethod),
    [rawFromMethods, enrichPaymentMethod]
  );

  const toPaymentMethods = useMemo(
    () => rawToMethods.map(enrichPaymentMethod),
    [rawToMethods, enrichPaymentMethod]
  );

  const effectiveToPaymentMethods = useMemo(
    () => (toPaymentMethods.length > 0 ? toPaymentMethods : fromPaymentMethods),
    [toPaymentMethods, fromPaymentMethods]
  );

  const moneyXInitializedRef = useRef(false);

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
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
  const [fromSearchTerm, setFromSearchTerm] = useState("");
  const [toSearchTerm, setToSearchTerm] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFirstCardSubmitted, setIsFirstCardSubmitted] = useState(false);
  const [bankAccountAddress, setBankAccountAddress] = useState<string>("");
  const [bankAddressError, setBankAddressError] = useState<string | null>(null);
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [isUpdatingTransaction, setIsUpdatingTransaction] = useState(false);
  const [showExchanging, setShowExchanging] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [apiCommission, setApiCommission] = useState<number | null>(null);
  const [apiCommissionIsPercentage, setApiCommissionIsPercentage] = useState(true);
  const [isCalculatingFromPay, setIsCalculatingFromPay] = useState(true);
  const [isStateHydrated, setIsStateHydrated] = useState(false);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const bookmarkAnchorRef = useRef<HTMLSpanElement>(null);
  const commissionFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const paymentDetailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(RATES_MONEYX_FORM_STATE_KEY);
      if (!saved) {
        setIsStateHydrated(true);
        return;
      }
      const state = JSON.parse(saved);

      const restoredPayInput = normalizeMoneyXAmountInputForRestore(
        state?.amountInput
      );
      if (restoredPayInput) setPayAmountInput(restoredPayInput);
      if (
        restoredPayInput &&
        state?.amountValue != null &&
        !Number.isNaN(Number(state.amountValue))
      ) {
        setPayAmount(
          clampMoneyXAmountNumber(Number(state.amountValue))
        );
      }

      const restoredGetInput = normalizeMoneyXAmountInputForRestore(
        state?.receiveAmountInput
      );
      if (restoredGetInput) setGetAmountInput(restoredGetInput);
      if (
        restoredGetInput &&
        state?.receiveAmountValue != null &&
        !Number.isNaN(Number(state.receiveAmountValue))
      ) {
        setGetAmount(
          clampMoneyXAmountNumber(Number(state.receiveAmountValue))
        );
      }

      if (state?.fromPaymentMethod) setFromPaymentMethod(String(state.fromPaymentMethod));
      if (state?.toPaymentMethod) setToPaymentMethod(String(state.toPaymentMethod));
      if (state?.fromPaymentDetail) setSelectedFromPaymentDetail(state.fromPaymentDetail);
      if (state?.toPaymentDetail) setSelectedToPaymentDetail(state.toPaymentDetail);
      if (state?.bankAccountAddress) setBankAccountAddress(String(state.bankAccountAddress));
      if (state?.isAddressConfirmed !== undefined) {
        setIsAddressConfirmed(Boolean(state.isAddressConfirmed));
      }
      if (state?.isFirstCardSubmitted !== undefined) {
        setIsFirstCardSubmitted(Boolean(state.isFirstCardSubmitted));
      }
    } catch {
      window.localStorage.removeItem(RATES_MONEYX_FORM_STATE_KEY);
    } finally {
      setIsStateHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isStateHydrated) return;
    const state = {
      mode: "moneyx",
      amountInput: normalizeMoneyXAmountInputForRestore(payAmountInput),
      amountValue: payAmount,
      receiveAmountInput: normalizeMoneyXAmountInputForRestore(getAmountInput),
      receiveAmountValue: getAmount,
      fromPaymentMethod,
      toPaymentMethod,
      fromPaymentDetail: selectedFromPaymentDetail ? { ...selectedFromPaymentDetail } : null,
      toPaymentDetail: selectedToPaymentDetail ? { ...selectedToPaymentDetail } : null,
    };
    window.localStorage.setItem(RATES_MONEYX_FORM_STATE_KEY, JSON.stringify(state));
  }, [
    payAmountInput,
    payAmount,
    getAmountInput,
    getAmount,
    fromPaymentMethod,
    toPaymentMethod,
    selectedFromPaymentDetail,
    selectedToPaymentDetail,
    isStateHydrated,
  ]);

  const handleBeforeLegalNavigate = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        RATES_MONEYX_FORM_STATE_KEY,
        JSON.stringify({
          mode: "moneyx",
          amountInput: normalizeMoneyXAmountInputForRestore(payAmountInput),
          amountValue: payAmount,
          receiveAmountInput: normalizeMoneyXAmountInputForRestore(getAmountInput),
          receiveAmountValue: getAmount,
          fromPaymentMethod,
          toPaymentMethod,
          fromPaymentDetail: selectedFromPaymentDetail
            ? { ...selectedFromPaymentDetail }
            : null,
          toPaymentDetail: selectedToPaymentDetail
            ? { ...selectedToPaymentDetail }
            : null,
          bankAccountAddress,
          isAddressConfirmed,
          isFirstCardSubmitted,
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, [
    payAmountInput,
    payAmount,
    getAmountInput,
    getAmount,
    fromPaymentMethod,
    toPaymentMethod,
    selectedFromPaymentDetail,
    selectedToPaymentDetail,
    bankAccountAddress,
    isAddressConfirmed,
    isFirstCardSubmitted,
  ]);

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

  const calculateReceiveAmount = (
    send: number,
    commission: number,
    isPercentage: boolean
  ) => {
    if (isPercentage) {
      return Math.max(0, send - (send * commission) / 100);
    }
    return Math.max(0, send - commission);
  };

  const calculateSendAmount = (
    receive: number,
    commission: number,
    isPercentage: boolean
  ) => {
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
      setGetAmountInput(calculatedGetAmount.toFixed(2));
    } else if (!isCalculatingFromPay && getAmount > 0) {
      const calculatedPayAmount = clampMoneyXAmountNumber(
        calculateSendAmount(
          getAmount,
          rate,
          apiCommissionIsPercentage
        )
      );
      setPayAmount(calculatedPayAmount);
      setPayAmountInput(calculatedPayAmount.toFixed(2));
    }
  }, [apiCommission, apiCommissionIsPercentage]);

  // Primary label — short_name first (matches Exchange payment method dropdowns)
  const getProviderName = useCallback((payment: any) => {
    if (!payment) return "";
    return (
      getPaymentMethodDisplayTitle(payment) ||
      getCleanPaymentProviderLabel(payment)
    );
  }, []);

  const handleFromPaymentChange = useCallback(
    async (method: any) => {
      restoreFromFullList();
      const fromId = getProviderId(method);
      const matchedFrom =
        matchMoneyXMethodById(allFromMethods, fromId) ??
        matchMoneyXMethodById(fromPaymentMethods, fromId) ??
        method;

      const providerName = getProviderName(matchedFrom);
      if (!providerName) return;

      setFromPaymentMethod(providerName);
      setSelectedFromPaymentDetail(matchedFrom);

      const matchedTo = await refreshToForFrom(matchedFrom, selectedToPaymentDetail, {
        force: true,
      });
      if (matchedTo) {
        setToPaymentMethod(getProviderName(matchedTo));
        setSelectedToPaymentDetail(matchedTo);
      }
    },
    [
      allFromMethods,
      fromPaymentMethods,
      selectedToPaymentDetail,
      getProviderName,
      getProviderId,
      restoreFromFullList,
      refreshToForFrom,
    ]
  );

  const handleToPaymentChange = useCallback(
    async (method: any) => {
      const providerName = getProviderName(method);
      if (!providerName) return;

      setToPaymentMethod(providerName);
      setSelectedToPaymentDetail(method);

      const matchedFrom = await refreshFromForTo(
        method,
        selectedFromPaymentDetail,
        { force: true }
      );
      if (matchedFrom) {
        setFromPaymentMethod(getProviderName(matchedFrom));
        setSelectedFromPaymentDetail(matchedFrom);
      }
    },
    [
      selectedFromPaymentDetail,
      getProviderName,
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
      setFromPaymentMethod(getProviderName(newFromDetail));
      setSelectedFromPaymentDetail(newFromDetail);
    }
    if (newToDetail) {
      setToPaymentMethod(getProviderName(newToDetail));
      setSelectedToPaymentDetail(newToDetail);
    }

    const matchedTo = await refreshToForFrom(newFromDetail, newToDetail, {
      force: true,
    });
    if (matchedTo) {
      setToPaymentMethod(getProviderName(matchedTo));
      setSelectedToPaymentDetail(matchedTo);
    }
  }, [
    allFromMethods,
    selectedFromPaymentDetail,
    selectedToPaymentDetail,
    getProviderName,
    getProviderId,
    restoreFromFullList,
    refreshToForFrom,
  ]);

  useEffect(() => {
    if (!allFromReady || fromPaymentMethods.length === 0) return;
    if (moneyXInitializedRef.current) return;
    if (!isStateHydrated) return;

    moneyXInitializedRef.current = true;

    if (fromPaymentMethod) {
      const fromDetail =
        selectedFromPaymentDetail ??
        fromPaymentMethods.find(
          (m: any) => getProviderName(m) === fromPaymentMethod
        );
      if (fromDetail) {
        void refreshToForFrom(fromDetail, selectedToPaymentDetail, {
          force: true,
        }).then((matchedTo) => {
          if (matchedTo) {
            setToPaymentMethod(getProviderName(matchedTo));
            setSelectedToPaymentDetail(matchedTo);
          }
        });
      }
      return;
    }

    const defaultFrom = pickDefaultMoneyXFromMethod(fromPaymentMethods);
    if (!defaultFrom) return;

    void handleFromPaymentChange(defaultFrom);
  }, [
    allFromReady,
    fromPaymentMethods,
    fromPaymentMethod,
    selectedFromPaymentDetail,
    selectedToPaymentDetail,
    isStateHydrated,
    getProviderName,
    handleFromPaymentChange,
    refreshToForFrom,
  ]);

  const currentBankAsset = selectedToPaymentDetail
    ? getProviderName(selectedToPaymentDetail)
    : "";
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
    const approvedDetails = Array.isArray(userPaymentDetails)
      ? userPaymentDetails
      : [];
    const assetFilter = String(currentBankAsset || "").trim().toLowerCase();

    const approvedAsBookmarks = approvedDetails
      .filter((detail: any) => {
        const raw = String(detail?.status ?? detail?.approved ?? "")
          .trim()
          .toLowerCase();
        const isApproved =
          raw === "approved" ||
          raw === "active" ||
          raw === "success" ||
          raw === "true";
        if (!isApproved) return false;
        const provider = String(
          detail?.payment_provider_name ??
            detail?.provider_name ??
            detail?.payment_method_name ??
            ""
        )
          .trim()
          .toLowerCase();
        if (!assetFilter) return true;
        return provider.includes(assetFilter) || assetFilter.includes(provider);
      })
      .map((detail: any, idx: number) => {
        const address = String(
          detail?.account_number ?? detail?.wallet_address ?? ""
        ).trim();
        const providerName = String(
          detail?.payment_provider_name ??
            detail?.provider_name ??
            detail?.payment_method_name ??
            "Approved payment"
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
    return isMoneyXBankPaymentMethod(method);
  }, []);

  // Calculate amounts using commission percentage (receive = send - send*rate/100)
  const handleAmountChange = (value: string, isFromPay: boolean) => {
    const prep = prepareMoneyXAmountFieldValue(value);
    if (!prep.ok) {
      if (prep.invalidPattern) return;
      if (prep.error) setValidationErrors([prep.error]);
      return;
    }
    const v = prep.v;
    if (v === "") {
      setPayAmountInput("");
      setPayAmount(0);
      setGetAmountInput("");
      setGetAmount(0);
      setValidationErrors([]);
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
      setGetAmountInput(calculatedGetAmount.toFixed(2));
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
      setPayAmountInput(calculatedPayAmount.toFixed(2));
    }
    setValidationErrors([]);
  };

  // Commission from API can be percentage OR fixed amount.
  const amountNum = parseFloat(payAmountInput) || 0;
  const commissionRate = apiCommission ?? 0;
  const commissionAmount = apiCommissionIsPercentage
    ? (amountNum * commissionRate) / 100
    : commissionRate;
  const networkFee = 0;
  const totalFees = commissionAmount;
  const amountIncludingFees = amountNum;
  const commissionDisplayValue = apiCommissionIsPercentage
    ? `${commissionRate.toFixed(2).replace(/\.?0+$/, "")}%`
    : `$${commissionRate.toFixed(2)}`;

  // Filter payment methods based on search
  const filteredFromMethods = fromPaymentMethods.filter((method: any) => {
    const blob = getMoneyXPaymentMethodSearchBlob(method);
    return blob.includes(fromSearchTerm.toLowerCase());
  });

  const filteredToMethods = effectiveToPaymentMethods.filter((method: any) => {
    const blob = getMoneyXPaymentMethodSearchBlob(method);
    return blob.includes(toSearchTerm.toLowerCase());
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

      // Persist only on rates-scoped key so home MoneyX does not pick up this draft.
      localStorage.setItem(RATES_MONEYX_FORM_STATE_KEY, JSON.stringify(state));

      // Set redirect path - return to public rates page
      const redirectPath = `/rates`;
      setAuthRedirectPath(redirectPath);

      // Redirect to login
      router.push("/auth/login");
      return;
    }

    // Strict KYC gate for rates moneyX submit.
    try {
      const kycResult = await dispatch(checkKYCStatus()).unwrap();
      const kycStatus = kycResult as any;
      if (!kycStatus || kycStatus.is_verified !== true) {
        dispatch(openKYCModal());
        return;
      }
    } catch {
      dispatch(openKYCModal());
      return;
    }

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

    // Scroll to the bank account address section
    setTimeout(() => {
      if (paymentDetailsRef.current) {
        paymentDetailsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  // Handle bank account address update and proceed to exchanging
  const handleBankAccountSubmit = async () => {
    // Strict KYC gate for final submit.
    if (isAuthenticated) {
      try {
        const kycResult = await dispatch(checkKYCStatus()).unwrap();
        const kycStatus = kycResult as any;
        if (!kycStatus || kycStatus.is_verified !== true) {
          dispatch(openKYCModal());
          return;
        }
      } catch {
        dispatch(openKYCModal());
        return;
      }
    }

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
        (user as any)?.full_name ||
        [((user as any)?.first_name || "").trim(), ((user as any)?.last_name || "").trim()]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        (user as any)?.name ||
        (user as any)?.username ||
        (user as any)?.email ||
        "Unknown User";

      const payload = buildMoneyXTransactionPayload({
        amount: payAmount,
        senderProvider: selectedFromPaymentDetail,
        receiverProvider: selectedToPaymentDetail,
        recipientName,
        recipientAccountNumber: bankAccountAddress,
      });

      const result = await dispatch(createMoneyXTransaction(payload)).unwrap();

      showToast.success("Transaction is successful", "Account updated successfully.");

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

      const txId = result.moneyx_transaction_id || "";
      scrollAppToTop();
      router.push(
        `/dashboard/exchange/exchanging${txId ? `?transactionId=${encodeURIComponent(txId)}` : ""}`
      );
    } catch (error: any) {
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
          error?.message ||
            error ||
            "An error occurred while updating the transaction.",
          error?.response?.data,
          error
        )
      );
    } finally {
      setIsUpdatingTransaction(false);
    }
  };

  // If showing exchanging component, render it
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("rates-flow-visibility", {
        detail: { active: showExchanging && !!transactionData },
      })
    );
    // Clear persisted moneyx form state once transaction flow starts,
    // so old form progress is not replayed after completion.
    if (showExchanging && transactionData) {
      localStorage.removeItem(RATES_MONEYX_FORM_STATE_KEY);
    }
    return () => {
      window.dispatchEvent(
        new CustomEvent("rates-flow-visibility", { detail: { active: false } })
      );
    };
  }, [showExchanging, transactionData]);

  if (showExchanging && transactionData) {
    return (
      <div className="bg-white dark:bg-[#18181D] p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-xl lg:rounded-2xl border-[1.5px] border-gray-200 dark:border-[#35353E] shadow-md container mx-auto w-full max-w-5xl flex flex-col items-center">
        <Exchanging
          transactionData={transactionData}
          onBackToTransfer={() => {
            setShowExchanging(false);
            setTransactionData(null);
            setIsFirstCardSubmitted(false);
            setBankAccountAddress("");
            setIsAddressConfirmed(false);
            // Clear localStorage when going back
            localStorage.removeItem("moneyx_transaction_data");
            localStorage.removeItem("express_transaction_data");
            localStorage.removeItem(RATES_MONEYX_FORM_STATE_KEY);
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#18181D] p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-xl lg:rounded-2xl border-[1.5px] border-gray-200 dark:border-[#35353E] shadow-md container mx-auto w-full max-w-5xl">
      <div className="mb-2" />

      <div className={`w-full ${isDark ? "text-white" : "text-[#1F2937]"}`}>
        {/* Top Section - You Send: Amount and Bank/Payment Method in one card */}
        <div className="relative mb-0 pb-2">
          <div
            className={`relative flex flex-col sm:flex-row gap-6 rounded-2xl p-4 sm:p-6 overflow-visible border-[1.5px] ${isDark ? "border-[#2F2F3A]" : "border-[#E2E8F0] shadow-sm"
              } bg-transparent`}
          >
            {/* Amount Section */}
            <div className="flex-1 min-w-0">
              <label className={`${ratesFieldLabelClass} gap-2`}>
                {t("rates.youSend", "You Send")}
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={payAmountInput}
                  maxLength={MONEYX_MAX_AMOUNT_INPUT_DIGITS + 1}
                  onChange={(e) => handleAmountChange(e.target.value, true)}
                  placeholder="Enter amount"
                  className={ratesFieldClass(isDark, "pr-16")}
                />
              </div>
            </div>

            {/* Bank/Payment Method Section */}
            <div className="flex-1 min-w-0" ref={fromDropdownRef}>
              <label className={ratesFieldLabelClass}>
                Bank/Payment Method
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsFromDropdownOpen(!isFromDropdownOpen);
                    setIsToDropdownOpen(false);
                  }}
                  className={`${ratesFieldClass(isDark, "flex items-center justify-between gap-2")}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {resolvePaymentMethodLogo(selectedFromPaymentDetail) ? (
                      <img
                        src={getHighResPaymentLogo(
                          resolvePaymentMethodLogo(selectedFromPaymentDetail),
                          null,
                          64
                        )}
                        alt={fromPaymentMethod || "Bank"}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#1D8751] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {fromPaymentMethod?.charAt(0) || "B"}
                      </div>
                    )}
                    <span className="truncate">{fromPaymentMethod || t("rates.selectPaymentMethod", "Select payment method")}</span>
                  </div>
                  <FiChevronDown className="w-5 h-5 flex-shrink-0" />
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
                      {filteredFromMethods.length === 0 ? (
                        <p className={`px-3 py-2 text-sm ${isDark ? "text-[#788099]" : "text-gray-500"}`}>
                          No payment methods available
                        </p>
                      ) : (
                        filteredFromMethods.map((method: any, index: number) => {
                          const { label, subtitle } = getPaymentMethodSelectLabels(method);
                          return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setIsFromDropdownOpen(false);
                              setFromSearchTerm("");
                              void handleFromPaymentChange(method);
                            }}
                            className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 hover:bg-opacity-50 ${isDark ? "hover:bg-[#2F2F3A]" : "hover:bg-gray-100"
                              }`}
                          >
                            {resolvePaymentMethodLogo(method) ? (
                              <img
                                src={getHighResPaymentLogo(
                                  resolvePaymentMethodLogo(method),
                                  null,
                                  64
                                )}
                                alt={label}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#1D8751] flex items-center justify-center text-white text-xs font-semibold">
                                {label?.charAt(0) || "B"}
                              </div>
                            )}
                            <div className="flex flex-col items-start min-w-0">
                              <span className="text-[14px] truncate">{label}</span>
                              {subtitle ? (
                                <span className={`text-xs truncate ${isDark ? "text-[#788099]" : "text-gray-500"}`}>
                                  {subtitle}
                                </span>
                              ) : null}
                            </div>
                          </button>
                        );})
                      )}
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
                void handleSwapPaymentMethods();
              }}
              className="flex items-center justify-center p-0 bg-transparent border-none shadow-none"
            >
              <img
                src={
                  isDark
                    ? "/assets/Frame_36261_ledmyw.png"
                    : "/assets/Frame_36261_1_d9cnq1.png"
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
              <label className={`${ratesFieldLabelClass} gap-2`}>
                {t("rates.youGet", "You Receive")}
                <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={getAmountInput}
                  onChange={(e) => handleAmountChange(e.target.value, false)}
                  placeholder="Enter amount"
                  className={ratesFieldClass(isDark, "pr-16")}
                />
              </div>
            </div>

            {/* Provider Section */}
            <div className="flex-1 min-w-0" ref={toDropdownRef}>
              <label className={ratesFieldLabelClass}>
                Bank/Payment Method
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsToDropdownOpen(!isToDropdownOpen);
                    setIsFromDropdownOpen(false);
                  }}
                  className={`${ratesFieldClass(isDark, "flex items-center justify-between gap-2")}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {resolvePaymentMethodLogo(selectedToPaymentDetail) ? (
                      <img
                        src={getHighResPaymentLogo(
                          resolvePaymentMethodLogo(selectedToPaymentDetail),
                          null,
                          64
                        )}
                        alt={toPaymentMethod || "Bank"}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#1D8751] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {toPaymentMethod?.charAt(0) || "P"}
                      </div>
                    )}
                    <span className="truncate">{toPaymentMethod || t("rates.selectProviderPlaceholder", "Select provider")}</span>
                  </div>
                  <FiChevronDown className="w-5 h-5 flex-shrink-0" />
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
                      {filteredToMethods.length === 0 ? (
                        <p className={`px-3 py-2 text-sm ${isDark ? "text-[#788099]" : "text-gray-500"}`}>
                          No payment methods available
                        </p>
                      ) : (
                        filteredToMethods.map((method: any, index: number) => {
                          const { label, subtitle } = getPaymentMethodSelectLabels(method);
                          return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setIsToDropdownOpen(false);
                              setToSearchTerm("");
                              void handleToPaymentChange(method);
                            }}
                            className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 hover:bg-opacity-50 ${isDark ? "hover:bg-[#2F2F3A]" : "hover:bg-gray-100"
                              }`}
                          >
                            {resolvePaymentMethodLogo(method) ? (
                              <img
                                src={getHighResPaymentLogo(
                                  resolvePaymentMethodLogo(method),
                                  null,
                                  64
                                )}
                                alt={label}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#1D8751] flex items-center justify-center text-white text-xs font-semibold">
                                {label?.charAt(0) || "P"}
                              </div>
                            )}
                            <div className="flex flex-col items-start min-w-0">
                              <span className="text-[14px] truncate">{label}</span>
                              {subtitle ? (
                                <span className={`text-xs truncate ${isDark ? "text-[#788099]" : "text-gray-500"}`}>
                                  {subtitle}
                                </span>
                              ) : null}
                            </div>
                          </button>
                        );})
                      )}
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
                  {t("rates.commission", "Commission:")} {commissionDisplayValue}
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
          <div className="flex flex-col gap-3">
            {(actionError || moneyXError || validationErrors.length > 0) && (
              <div className="text-center px-1">
                <ScamFlagSubmitBanner message={actionError || moneyXError} />
                {(actionError || moneyXError) &&
                !isScamFlagUserMessage(actionError || moneyXError) ? (
                  <ExpressSubmitAlertBanner
                    title="Unable to continue"
                    message={normalizeExpressApiErrorMessage(
                      actionError || moneyXError
                    )}
                    showSupportLink={false}
                  />
                ) : null}
                {!actionError &&
                  !moneyXError &&
                  validationErrors.map((error, index) => (
                    <p key={index} className="text-red-500 text-sm font-medium">
                      {error}
                    </p>
                  ))}
              </div>
            )}
            <button
              onClick={() => {
                setActionError(null);
                setValidationErrors([]);
                dispatch(clearMoneyXError());
                handleExchange();
              }}
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-white bg-[#1D8751] hover:bg-[#0f8f4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              {isSubmitting ? t("rates.processing", "Processing...") : "Submit"}
            </button>
          </div>
        )}

        {/* Show after first card is submitted: 1- Account details, then 2- Bank Account Address */}
        {isFirstCardSubmitted && (
          <>
            {/* 1- Account details: display provider's account (where user sends money) - fixed, not user input */}
            <h2 className={`text-xl font-semibold mb-2 ${isDark ? "text-[#788099]" : "text-gray-900"} inline-flex items-center gap-2`}>
              1- {t("rates.accountDetails", "Account details")}
            </h2>
            <ProviderPaymentDetailsCard
              paymentDetail={selectedFromPaymentDetail}
              fallbackProviderName={getProviderName(selectedFromPaymentDetail)}
              className={`rounded-2xl p-4 mb-4 border ${isDark ? "bg-[#18181D] border-[#35353E]" : "bg-white border-[#E2E8F0]"}`}
              rowClassName={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 p-3 rounded-xl border ${isDark ? "border-[#35353E]" : "border-[#E2E8F0]"}`}
              instruction={
                <>
                  {t("rates.copyAccountToDeposit", "Copy the following account to deposit the")}{" "}
                  <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                    ${payAmount.toFixed(2)}
                  </span>{" "}
                  {t("rates.amount", "amount")}
                </>
              }
            />

            {/* 2- Bank Account Address (user's receiving account) */}
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
                {selectedToPaymentDetail
                  ? `${t("rates.toBankAccountLabel", "To")} ${getProviderName(
                      selectedToPaymentDetail
                    )} ${t("rates.accountNumber", "Account Number")}`
                  : t("rates.toBankAccountAddress", "To Bank Account Address")}
              </label>

              {/* Input group */}
              <div
                className={`flex items-center h-[44px] min-h-[44px] box-border ${isDark ? "bg-[#1D1D23]" : "bg-white"} border ${isDark ? "border-[#35353E]" : "border-[#E2E8F0]"} rounded-2xl px-4 mb-2 overflow-visible gap-2`}
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
                    clearSaveBookmarkError();
                    const value = e.target.value;
                    setBankAccountAddress(value);
                    setIsAddressConfirmed(false);
                    setBankAddressError(null);
                  }}
                  placeholder={
                    selectedToPaymentDetail
                      ? `${t("rates.pasteToAccountNumber", "Paste here your")} ${getProviderName(
                          selectedToPaymentDetail
                        )} ${t("rates.accountNumber", "Account Number")}`
                      : t(
                          "rates.pasteToBankAccountAddressPlaceholder",
                          "Paste here your To Bank Account Address"
                        )
                  }
                  className={`flex-1 min-w-0 h-full bg-transparent border-none outline-none ${isDark ? "text-[#788099]" : "text-[#475569]"} placeholder-[#788099] text-sm ${bankAddressError
                    ? "border-red-500"
                    : bankAccountAddress.trim() && !bankAddressError
                      ? "border-green-500"
                      : ""
                    }`}
                />
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
                      isAuthenticated
                        ? dispatch(fetchUserPaymentDetails())
                            .unwrap()
                            .catch(() => undefined)
                        : Promise.resolve(),
                    ]);
                  }}
                  title="Load from saved addresses"
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
                      } catch {
                        /* handled by hook */
                      }
                    }}
                    saveError={saveBookmarkError}
                    onDelete={(b) => deleteBookmark(b.id)}
                    anchorRef={bookmarkAnchorRef}
                    isDark={isDark}
                    saveDisabled={!!bankAddressError || !bankAccountAddress.trim()}
                    providerDisplayName={currentProviderLabel}
                    defaultLabel={currentProviderLabel}
                    onAddPaymentMethod={() => setShowAddPaymentModal(true)}
                    labelKind="account"
                  />
                </span>
                {/* Paste button */}
                <button
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      setBankAccountAddress(text);
                    } catch (err) {
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
              {saveBookmarkError && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                  ❌ {saveBookmarkError}
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
                <ExpressLegalTermsLinks
                  className={`text-sm ${isDark ? "text-[#788099]" : "text-[#475569]"}`}
                  onBeforeNavigate={handleBeforeLegalNavigate}
                />
              </label>
            </div>

            {/* Final Submit Button */}
            <div className="flex flex-col gap-3 w-full">
              <ScamFlagSubmitBanner message={actionError || moneyXError} />
              {(actionError || moneyXError) &&
              !isScamFlagUserMessage(actionError || moneyXError) ? (
                <ExpressSubmitAlertBanner
                  title="Unable to continue"
                  message={normalizeExpressApiErrorMessage(actionError || moneyXError)}
                  showSupportLink={false}
                />
              ) : null}
              <button
              className={`w-full text-base font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-white ${!bankAccountAddress.trim() ||
                bankAddressError ||
                !isAddressConfirmed ||
                isUpdatingTransaction
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-[#1D8751] hover:bg-[#166b3e]"
                }`}
              onClick={() => {
                setActionError(null);
                dispatch(clearMoneyXError());
                handleBankAccountSubmit();
              }}
              disabled={
                !bankAccountAddress.trim() ||
                !!bankAddressError ||
                !isAddressConfirmed ||
                isUpdatingTransaction
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
            </div>
          </>
        )}
      </div>

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
};

export default MoneyXRates;
