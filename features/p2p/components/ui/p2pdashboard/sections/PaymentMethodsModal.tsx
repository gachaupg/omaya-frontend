import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import {
  fetchAdminPaymentMethods,
  postUserPaymentDetail,
  clearPostStatus,
} from "../../../../slices/paymentMethodsSlice";
import { showToast } from "../../../../../../lib/utils/toast";
import { AdminPaymentMethod } from "../../../../types/paymentMethods";

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
}

const PaymentMethodsModal: React.FC<PaymentMethodsModalProps> = ({
  open,
  onClose,
  onAdd,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { adminMethods, loading, error, postLoading, postError, postSuccess } =
    useSelector((state: RootState) => state.paymentMethods);
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );
  logger.debug('p2p', "adminMethods", adminMethods);
  logger.debug('p2p', "Redux state", {
    loading,
    error,
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

     // Fetch payment methods when modal opens
   useEffect(() => {
     if (open && isClient) {
       // Try to fetch admin methods, but don't block the UI
       try {
         dispatch(fetchAdminPaymentMethods() as any);
       } catch (error) {
         logger.debug('p2p', "Error fetching admin methods:", error);
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
       dispatch(clearPostStatus());
     }
   }, [open, dispatch, isClient, user]);

  const methodTypes = Array.from(
    new Set(
      (adminMethods || [])
        .map((m: AdminPaymentMethod) => m.payment_method_type)
        .filter(Boolean)
    )
  ) as string[];

  const providers = (adminMethods || []).filter(
    (m: AdminPaymentMethod) => m.payment_method_type === method
  );

  const normalizedMethod = method.trim().toLowerCase();
  const isCryptoMethod = normalizedMethod.includes("crypto");
  const isForexMethod = normalizedMethod.includes("forex");
  const shouldUseWalletAddressField = isCryptoMethod || isForexMethod;

   logger.debug('p2p', "DEBUG: adminMethods:", adminMethods);
   logger.debug('p2p', "DEBUG: methodTypes:", methodTypes);
   logger.debug('p2p', "DEBUG: selected method:", method);
   logger.debug('p2p', "DEBUG: providers for method:", providers);

     // Handle Add
   const handleAdd = () => {
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
     (p: AdminPaymentMethod) => p.provider_name === provider
   );
    logger.debug('p2p', "Selected provider", selectedProvider);
    const payload: PaymentDetailPayload = {
      account_name: name,
      account_number: account,
      payment_method_name: method,
      payment_provider_name: provider,
      provider_name: provider,
      wallet_address: shouldUseWalletAddressField
        ? account
        : selectedProvider?.wallet_address || null,
    };

    payload.allow_auto_send = allowAutoSend;
    logger.debug('p2p', "Dispatching payload", payload);
    dispatch(postUserPaymentDetail(payload));
   };

  // Close modal on success
  useEffect(() => {
    logger.debug('p2p', "postSuccess effect triggered", postSuccess);
    if (postSuccess) {
      logger.debug('p2p', "Payment method added successfully!");
      showToast.success("Payment method added!");
      if (onAdd) onAdd();
      onClose();
      // Clear the success state to prevent multiple toasts
      dispatch(clearPostStatus());
    }
  }, [postSuccess, onAdd, onClose, dispatch]);

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
               className="w-full p-2.5 sm:p-3 rounded-[24px] bg-white dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D8751] text-sm sm:text-base"
               value={method}
               onChange={(e) => setMethod(e.target.value)}
               disabled={loading || methodTypes.length === 0}
             >
               <option value="">Select Method</option>
               {methodTypes.map((type, index: number) => (
                 <option key={`${type}-${index}`} value={type}>
                   {type}
                 </option>
               ))}
             </select>
            {!loading && methodTypes.length === 0 && (
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
                   className="w-full p-2.5 sm:p-3 rounded-[24px] bg-white dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D8751] appearance-none pr-10 text-sm sm:text-base"
                   value={provider}
                   onChange={(e) => setProvider(e.target.value)}
                  disabled={loading || providers.length === 0}
                 >
                   <option value="">Select Provider</option>
                  {providers.map((p: AdminPaymentMethod, index: number) => (
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
                         (p: AdminPaymentMethod) => p.provider_name === provider
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
              {!loading && method && providers.length === 0 && (
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
                     {/* Account Number Input */}
          <div>
            <label className="block text-gray-600 dark:text-[#788099] text-sm mb-1">
              {shouldUseWalletAddressField ? "Wallet Address" : "Account Number"}
            </label>
             <input
               className="w-full bg-gray-50 dark:bg-[#23232B] text-gray-900 dark:text-white rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-[#1D8751] placeholder:text-gray-400 dark:placeholder:text-[#788099] text-sm sm:text-base"
               placeholder={
                 shouldUseWalletAddressField
                   ? "Enter wallet address"
                   : "Enter account number"
               }
               value={account}
               onChange={(e) => setAccount(e.target.value)}
               disabled={loading}
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
                disabled={loading}
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
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {postError && <div className="text-red-500 text-sm">{postError}</div>}
          {postLoading && (
            <div className="text-blue-500 text-sm">
              Adding payment method...
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
                 disabled={loading || postLoading}
               >
                 Cancel
               </button>
            <button
              className="flex-1 rounded-xl bg-[#1D8751] text-white py-2.5 sm:py-3 font-medium hover:bg-[#17693f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              type="submit"
              disabled={
                loading ||
                postLoading ||
                !method ||
                !provider ||
                !name ||
                !account
              }
            >
              {postLoading ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentMethodsModal;
