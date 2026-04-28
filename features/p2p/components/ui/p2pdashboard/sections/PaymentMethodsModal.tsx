import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import {
  fetchPublicPaymentMethods,
  postUserPaymentDetail,
  sendPaymentDetailAddOtp,
  verifyPaymentDetailAddOtp,
  clearPostStatus,
} from "../../../../slices/paymentMethodsSlice";
import { showToast } from "../../../../../../lib/utils/toast";
import { logger } from '@/lib/utils/logger';
import {
  getHighResPaymentLogo,
  getHighResAssetIcon,
  PAYMENT_LOGO_SIZE,
} from "@/features/express/utils/imageHelpers";
import CustomSelect from "@/components/ui/CustomSelect";

type PaymentDetailPayload = {
  account_name: string;
  account_number: string;
  payment_method_name: string;
  payment_provider_name: string;
  provider_name: string;
  wallet_address?: string | null;
  allow_auto_send?: boolean;
};
type PaymentTab = "crypto" | "bank" | "forex";

interface PaymentMethodsModalProps {
  open: boolean;
  onClose: () => void;
  onAdd?: () => void;
  /** When set (e.g. from trade preview "Add new X payment method"), only show payment methods/providers matching this name */
  filterByProviderName?: string;
  /** When provided, called on success instead of onClose - allows parent to show OTP modal etc. */
  onAddSuccess?: () => void;
}

const PaymentMethodsModal: React.FC<PaymentMethodsModalProps> = ({
  open,
  onClose,
  onAdd,
  filterByProviderName,
  onAddSuccess,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { publicPaymentMethods, publicMethodsLoading, publicMethodsError, postLoading, postError, postSuccess } =
    useSelector((state: RootState) => state.paymentMethods);
  const userPaymentDetails = useSelector(
    (state: RootState) => state.paymentMethods.userPaymentDetails
  );
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );
  logger.debug('p2p', "publicPaymentMethods", publicPaymentMethods);
  logger.debug('p2p', "Redux state", {
    loading: publicMethodsLoading,
    error: publicMethodsError,
    postLoading,
    postError,
    postSuccess,
  });
  logger.debug('p2p', "Auth state", { isAuthenticated, user });
  const [method, setMethod] = useState("");
  const [methodTab, setMethodTab] = useState<PaymentTab>("crypto");
  const [provider, setProvider] = useState("");
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [allowAutoSend, setAllowAutoSend] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpCode, setOtpCode] = useState("");
  // Forex now uses broker + MT4/MT5 number (no address modal)
  const [pendingPayload, setPendingPayload] = useState<PaymentDetailPayload | null>(null);
  const [sendOtpLoading, setSendOtpLoading] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpFeedback, setOtpFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const RESEND_COOLDOWN_SECONDS = 60;
  const autoSendPreviouslyEnabled = React.useMemo(
    () =>
      Array.isArray(userPaymentDetails) &&
      userPaymentDetails.some((detail: any) => {
        const raw = detail?.allow_auto_send;
        if (typeof raw === "boolean") return raw;
        if (typeof raw === "string") return raw.trim().toLowerCase() === "true";
        return false;
      }),
    [userPaymentDetails]
  );

  // Set isClient to true after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // Start resend cooldown when OTP step is shown
  useEffect(() => {
    if (step === "otp") {
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } else {
      setResendCooldown(0);
    }
  }, [step]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

     // Fetch public payment methods when modal opens
   useEffect(() => {
     if (open && isClient) {
       // Try to fetch public payment methods, but don't block the UI
       try {
         dispatch(fetchPublicPaymentMethods() as any);
       } catch (error) {
         logger.debug('p2p', "Error fetching public payment methods:", error);
       }
      setMethod("");
      setMethodTab("crypto");
       setProvider("");
       // Auto-populate name with user's full name
       const fullName = user
         ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
         : "";
       setName(fullName);
       setAccount("");
       setAllowAutoSend(false);
       setStep("form");
       setOtpCode("");
       setPendingPayload(null);
       dispatch(clearPostStatus());
     }
   }, [open, dispatch, isClient, user]);

  // A user that has already had auto-send enabled should not re-enable it
  // while adding a new payment method.
  useEffect(() => {
    if (autoSendPreviouslyEnabled && allowAutoSend) {
      setAllowAutoSend(false);
    }
  }, [autoSendPreviouslyEnabled, allowAutoSend]);

  // Process public payment methods to extract method types and providers
  const processedProviders = React.useMemo(() => {
    if (!publicPaymentMethods) return [];

    const payload = publicPaymentMethods as any;
    const data = payload?.data || payload;
    const listCandidates = [
      data?.providers,
      data?.payment_providers,
      data?.payment_methods,
      data?.results,
      payload?.providers,
      payload?.payment_providers,
      payload?.payment_methods,
      payload?.results,
      Array.isArray(data) ? data : null,
      Array.isArray(payload) ? payload : null,
    ].filter(Array.isArray) as any[][];

    const sourceList = listCandidates.find((list) => list.length > 0) || [];
    const flattened: any[] = [];

    sourceList.forEach((item: any) => {
      // Shape A: method container with nested providers
      if (Array.isArray(item?.providers)) {
        const methodType =
          item?.method_name ||
          item?.method_display ||
          item?.payment_method_type ||
          item?.method?.method_name ||
          item?.method?.method_display ||
          item?.method ||
          "Bank";

        item.providers.forEach((provider: any) => {
          flattened.push({
            provider_name: provider?.provider_name || provider?.name || provider?.provider || "",
            provider: provider?.provider || provider?.provider_name || provider?.name || "",
            payment_method_type: methodType,
            logo: provider?.logo || provider?.provider_logo || provider?.logo_url,
            wallet_address: provider?.payment_details?.[0]?.wallet_address || provider?.wallet_address || null,
          });
        });
        return;
      }

      // Shape B: provider item already flat / semi-flat
      const methodType =
        item?.payment_method_type ||
        item?.payment_method_name ||
        item?.method?.method_name ||
        item?.method?.method_display ||
        item?.method ||
        "Bank";

      flattened.push({
        provider_name: item?.provider_name || item?.name || item?.provider || "",
        provider: item?.provider || item?.provider_name || item?.name || "",
        payment_method_type: methodType,
        logo: item?.logo || item?.provider_logo || item?.logo_url,
        wallet_address: item?.payment_details?.[0]?.wallet_address || item?.wallet_address || null,
      });
    });

    return flattened.filter(
      (p: any) => Boolean((p?.provider_name || "").trim())
    );
  }, [publicPaymentMethods]);

  // When opened from trade preview with a selected payment method (e.g. "Salaam Bank"),
  // only show payment method types and providers that match that name.
  const processedProvidersFiltered = React.useMemo(() => {
    if (!filterByProviderName?.trim()) return processedProviders;
    const term = filterByProviderName.trim().toLowerCase();
    return processedProviders.filter((p: any) => {
      const name = (p.provider_name || "").toLowerCase();
      const prov = (p.provider || "").toLowerCase();
      return name.includes(term) || prov.includes(term) || term.includes(name) || term.includes(prov);
    });
  }, [processedProviders, filterByProviderName]);

  const methodTypes = Array.from(
    new Set(
      processedProvidersFiltered
        .map((p: any) => p.payment_method_type)
        .filter(Boolean)
    )
  ) as string[];

  const isMethodInTab = (methodType: string, tab: PaymentTab) => {
    const m = (methodType || "").toLowerCase();
    if (tab === "crypto") {
      return m.includes("crypto");
    }
    if (tab === "forex") {
      // Forex must match Forex only; do NOT allow generic "wallet" here,
      // otherwise "Crypto Wallet" can be incorrectly treated as Forex and
      // backend validation will require a wallet address.
      return m.includes("forex");
    }
    return (
      m.includes("bank") ||
      m.includes("account") ||
      m.includes("mobile") ||
      m.includes("money") ||
      (!m.includes("crypto") && !m.includes("forex") && !m.includes("wallet"))
    );
  };

  const providersForTab = processedProvidersFiltered.filter((p: any) =>
    isMethodInTab(String(p?.payment_method_type || ""), methodTab)
  );
  const forexBrokerOptions = React.useMemo(() => {
    const forex = processedProvidersFiltered.filter((p: any) => {
      const methodName = String(
        p?.payment_method_type || p?.payment_method_name || ""
      ).toLowerCase();
      return methodName.includes("forex");
    });
    if (forex.length > 0) return forex;

    // Fallback so Forex tab always works even if backend omits forex providers.
    return [
      {
        provider_name: "FXPRIMUS",
        provider: "FXPRIMUS",
        payment_method_type: "Forex",
        wallet_address: null,
      },
    ];
  }, [processedProvidersFiltered]);

  const providers = methodTab === "forex" ? forexBrokerOptions : providersForTab;

  // When filtered to a single provider, auto-select its method and provider
  const singleFilteredProvider = processedProvidersFiltered.length === 1 ? processedProvidersFiltered[0] : null;
  useEffect(() => {
    if (!open || !filterByProviderName?.trim() || !singleFilteredProvider) return;
    if (singleFilteredProvider.payment_method_type) {
      const singleType = String(singleFilteredProvider.payment_method_type);
      setMethod(singleType);
      setMethodTab(
        singleType.toLowerCase().includes("crypto")
          ? "crypto"
          : singleType.toLowerCase().includes("forex")
            ? "forex"
            : "bank"
      );
    }
    if (singleFilteredProvider.provider_name) setProvider(singleFilteredProvider.provider_name);
  }, [open, filterByProviderName, singleFilteredProvider?.payment_method_type, singleFilteredProvider?.provider_name]);

  const normalizedMethod = method.trim().toLowerCase();
  // Use the selected tab as source of truth (method string may lag/omit "crypto").
  const isCryptoMethod = methodTab === "crypto" || normalizedMethod.includes("crypto");
  const isForexMethod = normalizedMethod.includes("forex");
  const isMobileMethod =
    normalizedMethod.includes("mobile") || normalizedMethod.includes("money") || normalizedMethod.includes("mpesa");
  // Treat tab as the source of truth for the account field type:
  // - Crypto tab => wallet_address
  // - Bank tab => account_number / mobile number
  // - Forex tab => MT4/MT5 number (account_number)
  const shouldUseWalletAddressField = methodTab === "crypto";

  const accountFieldLabel =
    methodTab === "forex"
      ? "MT4/MT5 Number"
      : shouldUseWalletAddressField
        ? "Wallet Address"
        : isMobileMethod
          ? "Mobile Number"
          : "Account Number";
  const accountFieldPlaceholder =
    methodTab === "forex"
      ? "Enter MT4/MT5 number"
      : shouldUseWalletAddressField
        ? "Enter wallet address"
        : isMobileMethod
          ? "0712345678"
          : "Enter account number";

   logger.debug('p2p', "DEBUG: publicPaymentMethods:", publicPaymentMethods);
   logger.debug('p2p', "DEBUG: processedProviders:", processedProviders);
   logger.debug('p2p', "DEBUG: methodTypes:", methodTypes);
   logger.debug('p2p', "DEBUG: selected method:", method);
   logger.debug('p2p', "DEBUG: providers for method:", providers);

     // Handle Add - first send OTP, then show OTP step
   const handleAdd = async () => {
     logger.debug('p2p', "handleAdd called", { method, provider, name, account });
    if (!isAuthenticated) {
      logger.debug('p2p', "User not authenticated");
      setOtpFeedback({ type: "error", text: "Please log in to add payment methods" });
      return;
    }
   if (!provider || !account || (methodTab !== "forex" && !name)) {
      logger.debug('p2p', "Validation failed", { method, provider, name, account });
      setOtpFeedback({ type: "error", text: "Please fill all required fields" });
      return;
    }
     
   const selectedProvider = providers.find(
     (p: any) => p.provider_name === provider
   );
    logger.debug('p2p', "Selected provider", selectedProvider);
    
    // Use the provider field (e.g., "Cooperative Bank") instead of provider_name
    const providerField = selectedProvider?.provider || provider;
    
    const resolvedMethod =
      selectedProvider?.payment_method_type ||
      selectedProvider?.payment_method_name ||
      method ||
      (methodTab === "crypto"
        ? "Crypto Wallet"
        : methodTab === "forex"
          ? "Forex Wallet"
          : "Bank Wallet");

    const payload: PaymentDetailPayload = {
      account_name:
        methodTab === "forex"
          ? (name || "FOREX")
          : name || (methodTab === "crypto" ? "Crypto Wallet" : ""),
      account_number: shouldUseWalletAddressField ? "" : account,
      payment_method_name: resolvedMethod,
      payment_provider_name: providerField,
      provider_name: providerField,
      // Backend validation may require `wallet_address` for some "wallet" method types.
      // For Forex brokers, we treat MT4/MT5 number as the wallet identifier as well.
      wallet_address:
        methodTab === "forex"
          ? account
          : shouldUseWalletAddressField
            ? account
            : null,
    };
    if (methodTab === "forex") {
      payload.account_number = account;
    }
    payload.allow_auto_send = autoSendPreviouslyEnabled ? false : allowAutoSend;

    setSendOtpLoading(true);
    try {
      const result = await dispatch(sendPaymentDetailAddOtp() as any);
      if (sendPaymentDetailAddOtp.fulfilled.match(result)) {
        setOtpFeedback({ type: "success", text: "OTP sent to your email address" });
        setPendingPayload(payload);
        setStep("otp");
      } else if (sendPaymentDetailAddOtp.rejected.match(result)) {
        setOtpFeedback({ type: "error", text: (result.payload as string) || "Failed to send OTP" });
      }
    } finally {
      setSendOtpLoading(false);
    }
   };

   // Handle resend OTP
   const handleResendOtp = async () => {
     if (resendCooldown > 0 || sendOtpLoading) return;
     setSendOtpLoading(true);
     try {
       const result = await dispatch(sendPaymentDetailAddOtp() as any);
       if (sendPaymentDetailAddOtp.fulfilled.match(result)) {
         setOtpFeedback({ type: "success", text: "OTP resent to your email address" });
         setResendCooldown(RESEND_COOLDOWN_SECONDS);
         setOtpCode("");
       } else if (sendPaymentDetailAddOtp.rejected.match(result)) {
         setOtpFeedback({ type: "error", text: (result.payload as string) || "Failed to resend OTP" });
       }
     } finally {
       setSendOtpLoading(false);
     }
   };

   // Handle OTP verify - then add payment detail
   const handleVerifyOtp = async () => {
     if (!pendingPayload || !otpCode.trim() || otpCode.length < 6) {
       setOtpFeedback({ type: "error", text: "Please enter a valid 6-digit OTP" });
       return;
     }
     setVerifyOtpLoading(true);
     try {
       const verifyResult = await dispatch(verifyPaymentDetailAddOtp(otpCode) as any);
       if (verifyPaymentDetailAddOtp.fulfilled.match(verifyResult)) {
         setOtpFeedback({ type: "success", text: "OTP verified successfully. Adding your payment method..." });
         dispatch(postUserPaymentDetail(pendingPayload));
       } else if (verifyPaymentDetailAddOtp.rejected.match(verifyResult)) {
         setOtpFeedback({ type: "error", text: (verifyResult.payload as string) || "Invalid OTP" });
       }
     } finally {
       setVerifyOtpLoading(false);
     }
   };

  // Close modal on success (or hand off to onAddSuccess for OTP flow)
  useEffect(() => {
    logger.debug('p2p', "postSuccess effect triggered", postSuccess);
    if (postSuccess) {
      logger.debug('p2p', "Payment method added successfully!");
      setOtpFeedback({ type: "success", text: "Payment method added!" });
      if (onAdd) onAdd();
      if (onAddSuccess) {
        onAddSuccess();
      } else {
        onClose();
      }
      dispatch(clearPostStatus());
    }
  }, [postSuccess, onAdd, onClose, onAddSuccess, dispatch]);

  // Handle errors
  useEffect(() => {
    if (postError) {
      logger.debug('p2p', "Post error occurred:", postError);
      setOtpFeedback({ type: "error", text: postError });
    }
  }, [postError]);

  if (!open) return null;

  // Show loading state during SSR or initial client render
  if (!isClient) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="dark:bg-[#19191D] bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-200 dark:border-[#35353E] mx-4 relative z-[10000]">
          <div className="dark:text-white text-gray-900 text-lg font-semibold mb-4">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4"
      onClick={onClose}
      style={{ pointerEvents: 'auto' }}
    >
      <div 
        className="bg-white dark:bg-[#13151E] rounded-[28px] p-4 sm:p-6 w-full max-w-[620px] shadow-xl border border-[#E3E6F0] dark:border-[#2A2F40] relative z-[10000] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-gray-900 dark:text-white text-2xl leading-[1.1] font-semibold">
            {methodTab === "forex" ? "Add FOREX Broker" : "Add Payment Method"}
          </div>
                     <button
             onClick={(e) => {
               e.preventDefault();
               e.stopPropagation();
               onClose();
             }}
             className="text-gray-400 hover:text-white transition-colors p-1"
             type="button"
           >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>
        {step === "otp" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600 dark:text-[#788099]">
              We&apos;ve sent a verification code to your email address. Enter it below to continue.
            </p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter 6-digit OTP"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full p-2.5 sm:p-3 rounded-[24px] bg-white dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] text-gray-900 dark:text-white text-center text-lg tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-[#1D8751] placeholder:text-gray-400 dark:placeholder:text-[#788099]"
              maxLength={6}
            />
            {otpFeedback && (
              <div
                className={`text-sm ${
                  otpFeedback.type === "success"
                    ? "text-[#1D8751]"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {otpFeedback.text}
              </div>
            )}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || sendOtpLoading}
                className={`text-sm font-medium disabled:cursor-not-allowed ${
                  // Keep "Sending..." green (not gray/blue) even while disabled.
                  sendOtpLoading && resendCooldown === 0
                    ? "text-[#1D8751] opacity-70"
                    : "text-[#1D8751] hover:text-[#156b3f] disabled:opacity-50 disabled:text-gray-400 dark:disabled:text-gray-500"
                }`}
              >
                {resendCooldown > 0
                  ? `Resend OTP in ${resendCooldown}s`
                  : sendOtpLoading
                    ? "Sending..."
                    : "Resend OTP"}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setOtpCode("");
                  setPendingPayload(null);
                  setOtpFeedback(null);
                }}
                className="flex-1 rounded-xl border border-gray-200 dark:border-[#35353E] bg-transparent text-gray-700 dark:text-white py-2.5 sm:py-3 font-medium hover:bg-gray-50 dark:hover:bg-[#23232B] transition-colors text-sm sm:text-base"
                disabled={verifyOtpLoading}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={verifyOtpLoading || otpCode.length !== 6}
                className="flex-1 rounded-xl bg-[#1D8751] text-white py-2.5 sm:py-3 font-medium hover:bg-[#17693f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {verifyOtpLoading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          </div>
        ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          className="flex flex-col gap-3"
        >
                     {/* Payment Method Dropdown */}
           <div>
             <label className="block text-gray-900 dark:text-white text-base mb-2 font-medium">
               Payment Type
             </label>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
               {[
                 { key: "crypto", label: "Crypto Wallet" },
                 { key: "bank", label: "Bank Wallet" },
                 { key: "forex", label: "Forex Wallet" },
               ].map((tab) => {
                 const active = methodTab === (tab.key as PaymentTab);
                 return (
                   <button
                     key={tab.key}
                     type="button"
                     onClick={() => {
                       const nextTab = tab.key as PaymentTab;
                       setMethodTab(nextTab);
                       setProvider("");
                       if (nextTab === "forex") {
                         setMethod("Forex");
                       } else {
                         const firstForTab = processedProvidersFiltered.find((p: any) =>
                           isMethodInTab(String(p?.payment_method_type || ""), nextTab)
                         );
                         setMethod(firstForTab?.payment_method_type || "");
                       }
                     }}
                     disabled={publicMethodsLoading}
                    className={`rounded-[14px] border px-3 py-2 text-sm font-medium transition-colors ${
                       active
                         ? "bg-[#1D8751] border-[#1D8751] text-white"
                         : "bg-[#F8FAFC] dark:bg-[#060913] border-[#E3E6F0] dark:border-[#2A2F40] text-[#4B5563] dark:text-[#9EA7BE] hover:text-gray-900 dark:hover:text-white"
                     }`}
                   >
                     {tab.label}
                   </button>
                 );
               })}
             </div>
            {!publicMethodsLoading && methodTypes.length === 0 && (
              <p className="mt-2 text-sm text-[#788099]">
                No payment methods available.
              </p>
            )}
           </div>

          {/* Provider / Asset Dropdown */}
           {methodTab !== "forex" && (methodTab || method) && (
             <div>
               <label className="block text-gray-900 dark:text-white text-sm mb-2">
                Provider
               </label>
               <div className="relative">
                 <CustomSelect
                   options={[
                     { value: "", label: "Select Provider" },
                     ...providers.map((p: any, index: number) => ({
                       value: String(p.provider_name || ""),
                       label: String(p.provider_name || "Unknown"),
                       subtitle: String(p.payment_method_type || p.method_display || p.method || "").trim() || undefined,
                       logo: getHighResPaymentLogo(
                         p.logo || p.provider_logo || undefined,
                         undefined,
                         PAYMENT_LOGO_SIZE
                       ),
                       disabled: !p.provider_name,
                     })),
                   ].filter((opt: any) => opt.value !== null)}
                   value={provider}
                   onChange={(value) => setProvider(String(value || ""))}
                   disabled={publicMethodsLoading || providers.length === 0}
                   searchable={true}
                   emptyText="No providers found"
                   loading={publicMethodsLoading}
                   loadingText="Loading providers..."
                   dropdownTitle="Select Provider"
                   sizeMode="card"
                   logoSize={PAYMENT_LOGO_SIZE}
                   logoClassName="rounded-full object-cover"
                   className="w-full"
                   triggerClassName="w-full p-3 rounded-[14px] bg-white dark:bg-[#060913] border border-[#E3E6F0] dark:border-[#2A2F40] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D8751] text-sm"
                   largeDropdownItems={true}
                 />
               </div>
               
               {/* Provider Preview with Logo */}
              {provider && (
                 <div className="mt-2 p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#171C2A] border border-[#E3E6F0] dark:border-[#2A2F40]">
                   <div className="flex items-center gap-3">
                     {(() => {
                       const selectedProvider = providers.find(
                         (p: any) => p.provider_name === provider
                       );
                       return (
                         <>
                          <span
                            className="rounded-full overflow-hidden flex-shrink-0"
                            style={{ width: PAYMENT_LOGO_SIZE, height: PAYMENT_LOGO_SIZE }}
                          >
                            <img
                              src={getHighResPaymentLogo(
                                selectedProvider?.logo,
                                undefined,
                                PAYMENT_LOGO_SIZE
                              )}
                              alt={`${provider} logo`}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.src = "/default-provider-logo.svg";
                              }}
                            />
                          </span>
                           <div>
                             <p className="text-sm font-medium text-gray-900 dark:text-white">
                               {provider}
                             </p>
                             <p className="text-xs text-[#788099]">
                               Selected Provider
                             </p>
                           </div>
                         </>
                       );
                     })()}
                   </div>
                 </div>
               )}
              {!publicMethodsLoading && providers.length === 0 && (
                <p className="mt-2 text-sm text-gray-500 dark:text-[#788099]">
                  No providers found for the selected method.
                </p>
              )}
             </div>
           )}

          {methodTab === "forex" && (
            <>
              <div>
                <label className="block text-gray-900 dark:text-white text-sm mb-2">
                  FOREX Broker
                </label>
                <div className="relative">
                  <CustomSelect
                    options={[
                      { value: "", label: "Select broker" },
                      ...providers.map((p: any, idx: number) => {
                        const label = String(p?.provider || p?.provider_name || "").trim() || "Unknown";
                        const value = String(p?.provider_name || p?.provider || label).trim();
                        const normalized = value.toLowerCase().replace(/\s+/g, "");
                        const logo =
                          normalized === "fxprimus" ||
                          normalized === "fxp" ||
                          normalized.includes("fxprimus")
                            ? getHighResAssetIcon({ ticker: "fxp" }, 72)
                            : "/default-provider-logo.svg";
                        return {
                          value,
                          label,
                          logo,
                          disabled: !value,
                        };
                      }),
                    ]}
                    value={provider}
                    onChange={(value) => setProvider(String(value || ""))}
                    disabled={publicMethodsLoading || providers.length === 0}
                    searchable={true}
                    emptyText="No brokers found"
                    loading={publicMethodsLoading}
                    loadingText="Loading brokers..."
                    dropdownTitle="Select broker"
                    sizeMode="card"
                    logoSize={PAYMENT_LOGO_SIZE}
                    logoClassName="rounded-full object-cover"
                    className="w-full"
                    triggerClassName="w-full p-3 rounded-[14px] bg-white dark:bg-[#060913] border border-[#E3E6F0] dark:border-[#2A2F40] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D8751] text-sm"
                    placeholderClassName="text-gray-500 dark:text-gray-400"
                    largeDropdownItems={true}
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-900 dark:text-white text-sm mb-2">
                  MT4/MT5 Number
                </label>
                <input
                  className="w-full bg-white dark:bg-[#060913] text-gray-900 dark:text-white rounded-[14px] border border-[#E3E6F0] dark:border-[#2A2F40] px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-[#1D8751] placeholder:text-gray-400 dark:placeholder:text-[#6F7893] text-sm"
                  placeholder="Enter MT4/MT5 number"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  disabled={publicMethodsLoading}
                  inputMode="numeric"
                />
              </div>
            </>
          )}

          {/* Name Input */}
          {methodTab !== "forex" && (
           <div>
              <label className="block text-gray-900 dark:text-white text-sm mb-2">
               Account Name (Auto-filled)
             </label>
             <input
                className="w-full rounded-[14px] px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-[#F8FAFC] dark:bg-[#171C2A] text-[#6B7280] dark:text-[#788099] border border-[#E3E6F0] dark:border-transparent cursor-not-allowed"
               placeholder="Your name will be auto-filled"
               value={name}
               readOnly
               disabled
             />
           </div>
          )}
                     {/* Account Number / Mobile Number / Wallet - dynamic based on payment method */}
          {methodTab !== "forex" && (
          <div>
            <label className="block text-gray-900 dark:text-white text-sm mb-2">
              {accountFieldLabel}
            </label>
             <input
               className="w-full bg-white dark:bg-[#060913] text-gray-900 dark:text-white rounded-[14px] border border-[#E3E6F0] dark:border-[#2A2F40] px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-[#1D8751] placeholder:text-gray-400 dark:placeholder:text-[#6F7893] text-sm"
               placeholder={accountFieldPlaceholder}
               value={account}
               onChange={(e) => setAccount(e.target.value)}
               disabled={publicMethodsLoading}
               maxLength={20}
             />
           </div>
          )}

          {methodTab !== "forex" && (methodTab || method) && (
            <div className="rounded-2xl border border-[#1D8751] bg-[linear-gradient(90deg,rgba(29,135,81,0.14)_0%,rgba(29,135,81,0.02)_100%)] dark:bg-[linear-gradient(90deg,rgba(29,135,81,0.18)_0%,rgba(29,135,81,0.04)_100%)] p-4">
              <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allowAutoSend"
                checked={allowAutoSend}
                onChange={(e) => {
                  if (autoSendPreviouslyEnabled) {
                    setAllowAutoSend(false);
                    return;
                  }
                  setAllowAutoSend(e.target.checked);
                }}
                className="w-4 h-4 text-[#1D8751] bg-white dark:bg-[#0D1320] border-[#C7D2E5] dark:border-[#2A2F40] rounded focus:ring-2 focus:ring-[#1D8751] cursor-pointer"
                disabled={publicMethodsLoading || autoSendPreviouslyEnabled}
              />
              <label
                htmlFor="allowAutoSend"
                className={`text-lg leading-none ${
                  autoSendPreviouslyEnabled
                    ? "text-[#5f6576] cursor-not-allowed"
                    : "text-gray-900 dark:text-white cursor-pointer"
                }`}
              >
                Automatic Transaction
              </label>
            </div>
              <p className="mt-3 text-sm text-gray-700 dark:text-[#D3D7E0]">
                We will use this address for all your <span className="text-[#1D8751]">USDT DEPOSITS</span>, ensuring seamless automatic processing! <span className="text-[#1D8751]">learn more!</span>
              </p>
            </div>
          )}
          {(methodTab || method) && autoSendPreviouslyEnabled && (
            <p className="mt-1 inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
              Auto send has already been used on your account and cannot be enabled again here.
            </p>
          )}
           
          {/* Error/Loading */}
          {publicMethodsError && <div className="text-red-500 text-sm">{publicMethodsError}</div>}
          {postError && <div className="text-red-500 text-sm">{postError}</div>}
          {(sendOtpLoading || postLoading) && (
            <div className="text-[#1D8751] text-sm">
              {sendOtpLoading ? "Sending OTP..." : "Adding payment method..."}
            </div>
          )}

          {/* Login Message for Unauthenticated Users */}
          {!isAuthenticated && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                Please log in to add a payment account
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              className="flex-1 rounded-xl border border-gray-200 dark:border-[#35353E] bg-transparent text-gray-700 dark:text-white py-2.5 sm:py-3 font-medium hover:bg-gray-50 dark:hover:bg-[#23232B] transition-colors text-sm sm:text-base"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              type="button"
              disabled={publicMethodsLoading || postLoading || sendOtpLoading}
            >
              Cancel
            </button>
            {isAuthenticated ? (
              methodTab === "forex" ? (
                <button
                  className="flex-1 rounded-xl bg-[#1D8751] text-white py-2.5 sm:py-3 font-medium hover:bg-[#17693f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAdd();
                  }}
                  disabled={publicMethodsLoading || postLoading || sendOtpLoading || !provider || !account}
                >
                  {sendOtpLoading ? "Sending OTP..." : postLoading ? "Adding..." : "Add"}
                </button>
              ) : (
              <button
                className="flex-1 rounded-xl bg-[#1D8751] text-white py-2.5 sm:py-3 font-medium hover:bg-[#17693f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                type="submit"
                disabled={
                  publicMethodsLoading ||
                  postLoading ||
                  sendOtpLoading ||
                  !provider ||
                  !name ||
                  !account
                }
              >
                {sendOtpLoading
                  ? "Sending OTP..."
                  : postLoading
                    ? "Adding..."
                    : "Add"}
              </button>
              )
            ) : (
              <button
                className="flex-1 rounded-xl bg-[#1D8751] text-white py-2.5 sm:py-3 font-medium hover:bg-[#17693f] transition-colors text-sm sm:text-base"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                  router.push("/auth/login");
                }}
              >
                Login to Add
              </button>
            )}
          </div>
        </form>
        )}
        {/* Forex address modal removed */}
      </div>
    </div>
  );
};

export default PaymentMethodsModal;
