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

type PaymentDetailPayload = {
  account_name: string;
  account_number: string;
  payment_method_name: string;
  payment_provider_name: string;
  provider_name: string;
  wallet_address?: string | null;
  allow_auto_send?: boolean;
};

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
  const [provider, setProvider] = useState("");
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [allowAutoSend, setAllowAutoSend] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpCode, setOtpCode] = useState("");
  const [pendingPayload, setPendingPayload] = useState<PaymentDetailPayload | null>(null);
  const [sendOtpLoading, setSendOtpLoading] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const RESEND_COOLDOWN_SECONDS = 60;

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

  // Process public payment methods to extract method types and providers
  const processedProviders = React.useMemo(() => {
    if (!publicPaymentMethods) return [];
    
    // Handle new API structure: data.providers
    const data = (publicPaymentMethods as any)?.data || publicPaymentMethods;
    if (Array.isArray(data?.providers)) {
      return data.providers.map((provider: any) => ({
        provider_name: provider.provider_name, // For display in dropdown
        provider: provider.provider || provider.provider_name, // Actual provider field for API
        payment_method_type: provider.method?.method_name || provider.method?.method_display || '',
        logo: provider.logo || provider.provider_logo,
        wallet_address: provider.payment_details?.[0]?.wallet_address || null,
      }));
    }
    // Handle old structure: data.payment_methods
    if (Array.isArray(data?.payment_methods)) {
      const flattened: any[] = [];
      data.payment_methods.forEach((method: any) => {
        if (Array.isArray(method.providers)) {
          method.providers.forEach((provider: any) => {
            flattened.push({
              provider_name: provider.provider_name, // For display in dropdown
              provider: provider.provider || provider.provider_name, // Actual provider field for API
              payment_method_type: method.method_name || method.method_display || '',
              logo: provider.logo || provider.provider_logo,
              wallet_address: provider.payment_details?.[0]?.wallet_address || null,
            });
          });
        }
      });
      return flattened;
    }
    return [];
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

  const providers = processedProvidersFiltered.filter(
    (p: any) => p.payment_method_type === method
  );

  // When filtered to a single provider, auto-select its method and provider
  const singleFilteredProvider = processedProvidersFiltered.length === 1 ? processedProvidersFiltered[0] : null;
  useEffect(() => {
    if (!open || !filterByProviderName?.trim() || !singleFilteredProvider) return;
    if (singleFilteredProvider.payment_method_type) setMethod(singleFilteredProvider.payment_method_type);
    if (singleFilteredProvider.provider_name) setProvider(singleFilteredProvider.provider_name);
  }, [open, filterByProviderName, singleFilteredProvider?.payment_method_type, singleFilteredProvider?.provider_name]);

  const normalizedMethod = method.trim().toLowerCase();
  const isCryptoMethod = normalizedMethod.includes("crypto");
  const isForexMethod = normalizedMethod.includes("forex");
  const isMobileMethod =
    normalizedMethod.includes("mobile") || normalizedMethod.includes("money") || normalizedMethod.includes("mpesa");
  const shouldUseWalletAddressField = isCryptoMethod || isForexMethod;

  const accountFieldLabel = shouldUseWalletAddressField
    ? "Wallet Address"
    : isMobileMethod
      ? "Mobile Number"
      : "Account Number";
  const accountFieldPlaceholder = shouldUseWalletAddressField
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
       showToast.error("Please log in to add payment methods");
       return;
     }
     if (!method || !provider || !name || !account) {
       logger.debug('p2p', "Validation failed", { method, provider, name, account });
       showToast.error("Please fill all required fields");
       return;
     }
     
   const selectedProvider = providers.find(
     (p: any) => p.provider_name === provider
   );
    logger.debug('p2p', "Selected provider", selectedProvider);
    
    // Use the provider field (e.g., "Cooperative Bank") instead of provider_name
    const providerField = selectedProvider?.provider || provider;
    
    const payload: PaymentDetailPayload = {
      account_name: name,
      account_number: account,
      payment_method_name: method,
      payment_provider_name: providerField,
      provider_name: providerField,
      wallet_address: shouldUseWalletAddressField
        ? account
        : selectedProvider?.wallet_address || null,
    };
    payload.allow_auto_send = allowAutoSend;

    setSendOtpLoading(true);
    try {
      const result = await dispatch(sendPaymentDetailAddOtp() as any);
      if (sendPaymentDetailAddOtp.fulfilled.match(result)) {
        showToast.success("OTP sent to your email address");
        setPendingPayload(payload);
        setStep("otp");
      } else if (sendPaymentDetailAddOtp.rejected.match(result)) {
        showToast.error((result.payload as string) || "Failed to send OTP");
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
         showToast.success("OTP resent to your email address");
         setResendCooldown(RESEND_COOLDOWN_SECONDS);
         setOtpCode("");
       } else if (sendPaymentDetailAddOtp.rejected.match(result)) {
         showToast.error((result.payload as string) || "Failed to resend OTP");
       }
     } finally {
       setSendOtpLoading(false);
     }
   };

   // Handle OTP verify - then add payment detail
   const handleVerifyOtp = async () => {
     if (!pendingPayload || !otpCode.trim() || otpCode.length < 6) {
       showToast.error("Please enter a valid 6-digit OTP");
       return;
     }
     setVerifyOtpLoading(true);
     try {
       const verifyResult = await dispatch(verifyPaymentDetailAddOtp(otpCode) as any);
       if (verifyPaymentDetailAddOtp.fulfilled.match(verifyResult)) {
         showToast.success("OTP verified successfully. You can now add your payment method.");
         dispatch(postUserPaymentDetail(pendingPayload));
       } else if (verifyPaymentDetailAddOtp.rejected.match(verifyResult)) {
         showToast.error((verifyResult.payload as string) || "Invalid OTP");
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
      showToast.success("Payment method added!");
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
      showToast.error(postError);
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
        className="bg-white dark:bg-[#19191D] rounded-2xl p-4 sm:p-6 w-full max-w-sm shadow-xl border border-gray-200 dark:border-[#35353E] relative z-[10000] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-gray-900 dark:text-white text-base sm:text-lg font-semibold">
            Add Payment Details
          </div>
                     <button
             onClick={(e) => {
               e.preventDefault();
               e.stopPropagation();
               onClose();
             }}
             className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
             type="button"
           >
             <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || sendOtpLoading}
                className="text-sm text-[#1D8751] hover:text-[#156b3f] font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 dark:disabled:text-gray-500"
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
             <label className="block text-gray-600 dark:text-[#788099] text-sm mb-1">
               Payment Method
             </label>
             <select
               className="w-full p-2.5 sm:p-3 rounded-[24px] bg-white dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D8751] text-sm sm:text-base [&_option]:bg-white dark:[&_option]:bg-[#18181D] [&_option]:text-gray-900 dark:[&_option]:text-white"
               value={method}
               onChange={(e) => setMethod(e.target.value)}
               disabled={publicMethodsLoading || methodTypes.length === 0}
             >
               <option value="">Select Method</option>
               {methodTypes.map((type, index: number) => (
                 <option key={`${type}-${index}`} value={type}>
                   {type}
                 </option>
               ))}
             </select>
            {!publicMethodsLoading && methodTypes.length === 0 && (
              <p className="mt-2 text-sm text-gray-500 dark:text-[#788099]">
                No payment methods available.
              </p>
            )}
           </div>

                     {/* Provider Dropdown */}
           {method && (
             <div>
               <label className="block text-gray-600 dark:text-[#788099] text-sm mb-1">
                 Provider
               </label>
               <div className="relative">
                 <select
                   className="w-full p-2.5 sm:p-3 rounded-[24px] bg-white dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D8751] appearance-none pr-10 text-sm sm:text-base [&_option]:bg-white dark:[&_option]:bg-[#18181D] [&_option]:text-gray-900 dark:[&_option]:text-white"
                   value={provider}
                   onChange={(e) => setProvider(e.target.value)}
                  disabled={publicMethodsLoading || providers.length === 0}
                 >
                   <option value="">Select Provider</option>
                  {providers.map((p: any, index: number) => (
                     <option
                       key={`${p.provider_name}-${index}`}
                       value={p.provider_name}
                     >
                       {p.provider_name}
                     </option>
                   ))}
                 </select>
                 <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                   <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                   </svg>
                 </div>
               </div>
               
               {/* Provider Preview with Logo */}
              {provider && (
                 <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-[#23232B] border border-gray-200 dark:border-[#35353E]">
                   <div className="flex items-center gap-3">
                     {(() => {
                       const selectedProvider = providers.find(
                         (p: any) => p.provider_name === provider
                       );
                       return (
                         <>
                           <img
                             src={selectedProvider?.logo || "/default-provider-logo.svg"}
                             alt={`${provider} logo`}
                             className="w-8 h-8 rounded-full object-cover"
                             onError={(e) => {
                               e.currentTarget.src = "/default-provider-logo.svg";
                             }}
                           />
                           <div>
                             <p className="text-sm font-medium text-gray-900 dark:text-white">
                               {provider}
                             </p>
                             <p className="text-xs text-gray-500 dark:text-[#788099]">
                               Selected Provider
                             </p>
                           </div>
                         </>
                       );
                     })()}
                   </div>
                 </div>
               )}
              {!publicMethodsLoading && method && providers.length === 0 && (
                <p className="mt-2 text-sm text-gray-500 dark:text-[#788099]">
                  No providers found for the selected method.
                </p>
              )}
             </div>
           )}

                     {/* Name Input */}
           <div>
             <label className="block text-gray-600 dark:text-[#788099] text-sm mb-1">
               Account Name (Auto-filled)
             </label>
             <input
               className="w-full bg-gray-100 dark:bg-[#2A2A30] text-gray-500 dark:text-[#788099] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 cursor-not-allowed text-sm sm:text-base"
               placeholder="Your name will be auto-filled"
               value={name}
               readOnly
               disabled
             />
           </div>
                     {/* Account Number / Mobile Number / Wallet - dynamic based on payment method */}
          <div>
            <label className="block text-gray-600 dark:text-[#788099] text-sm mb-1">
              {accountFieldLabel}
            </label>
             <input
               className="w-full bg-gray-50 dark:bg-[#23232B] text-gray-900 dark:text-white rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-[#1D8751] placeholder:text-gray-400 dark:placeholder:text-[#788099] text-sm sm:text-base"
               placeholder={accountFieldPlaceholder}
               value={account}
               onChange={(e) => setAccount(e.target.value)}
               disabled={publicMethodsLoading}
               maxLength={20}
             />
           </div>

          {method && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allowAutoSend"
                checked={allowAutoSend}
                onChange={(e) => setAllowAutoSend(e.target.checked)}
                className="w-4 h-4 text-[#1D8751] bg-gray-100 dark:bg-[#23232B] border-gray-300 dark:border-[#35353E] rounded focus:ring-2 focus:ring-[#1D8751] cursor-pointer"
                disabled={publicMethodsLoading}
              />
              <label
                htmlFor="allowAutoSend"
                className="text-sm text-gray-700 dark:text-[#788099] cursor-pointer"
              >
                Allow auto send
              </label>
            </div>
          )}
           
          {/* Error/Loading */}
          {publicMethodsError && <div className="text-red-500 text-sm">{publicMethodsError}</div>}
          {postError && <div className="text-red-500 text-sm">{postError}</div>}
          {(sendOtpLoading || postLoading) && (
            <div className="text-blue-500 text-sm">
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
              <button
                className="flex-1 rounded-xl bg-[#1D8751] text-white py-2.5 sm:py-3 font-medium hover:bg-[#17693f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                type="submit"
                disabled={
                  publicMethodsLoading ||
                  postLoading ||
                  sendOtpLoading ||
                  !method ||
                  !provider ||
                  !name ||
                  !account
                }
              >
                {sendOtpLoading ? "Sending OTP..." : postLoading ? "Adding..." : "Add"}
              </button>
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
      </div>
    </div>
  );
};

export default PaymentMethodsModal;
