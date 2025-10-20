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

type PaymentDetailPayload = {
  account_name: string;
  account_number: string;
  payment_method_name: string;
  payment_provider_name: string;
  provider_name: string;
  wallet_address?: string | null;
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
 
  const [method, setMethod] = useState("");
  const [provider, setProvider] = useState("");
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
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
         // Silent error handling
       }
       setMethod("");
       setProvider("");
       // Auto-populate name with user's full name
       const fullName = user
         ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
         : "";
       setName(fullName);
       setAccount("");
       dispatch(clearPostStatus());
     }
   }, [open, dispatch, isClient, user]);

   // Hardcoded payment methods for testing
   const hardcodedMethods = ["Bank Transfer", "Mobile Money", "Credit Card"];
   const hardcodedProviders = {
     "Bank Transfer": ["Chase Bank", "Wells Fargo", "Bank of America"],
     "Mobile Money": ["PayPal", "Venmo", "Cash App"],
     "Credit Card": ["Visa", "Mastercard", "American Express"]
   };

   // Use hardcoded data if adminMethods is empty or loading
   const methodTypes = adminMethods && adminMethods.length > 0 
     ? Array.from(new Set((adminMethods || []).map((m: any) => m.payment_method_type))).filter(Boolean) as string[]
     : hardcodedMethods;

   // Providers for selected method
   const providers = method && hardcodedProviders[method as keyof typeof hardcodedProviders]
     ? hardcodedProviders[method as keyof typeof hardcodedProviders].map(name => ({ provider_name: name }))
     : (adminMethods || []).filter((m: any) => m.payment_method_type === method);


     // Handle Add
   const handleAdd = () => {
     if (!isAuthenticated) {
       showToast.error("Please log in to add payment methods");
       return;
     }
     if (!method || !provider || !name || !account) {
       showToast.error("Please fill all required fields");
       return;
     }
     
     const selectedProvider = providers.find(
       (p: any) => p.provider_name === provider
     );
     const payload = {
       account_name: name,
       account_number: account,
       payment_method_name: method,
       payment_provider_name: provider,
       provider_name: provider,
       wallet_address: selectedProvider?.wallet_address || null,
     };
     dispatch(postUserPaymentDetail(payload));
   };

  // Close modal on success
  useEffect(() => {
    if (postSuccess) {
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      style={{ pointerEvents: 'auto' }}
    >
      <div 
        className="bg-white dark:bg-[#19191D] rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-200 dark:border-[#35353E] mx-4 relative z-[10000]"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-gray-900 dark:text-white text-lg font-semibold">
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
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
               className="w-full p-3 rounded-[24px] bg-white dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D8751]"
               value={method}
               onChange={(e) => setMethod(e.target.value)}
               disabled={loading}
             >
               <option value="">Select Method</option>
               {methodTypes.map((type, index: number) => (
                 <option key={`${type}-${index}`} value={type}>
                   {type}
                 </option>
               ))}
             </select>
           </div>

                     {/* Provider Dropdown */}
           {method && (
             <div>
               <label className="block text-gray-600 dark:text-[#788099] text-sm mb-1">
                 Provider
               </label>
               <select
                 className="w-full p-3 rounded-[24px] bg-white dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D8751]"
                 value={provider}
                 onChange={(e) => setProvider(e.target.value)}
                 disabled={loading}
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
             </div>
           )}

                     {/* Name Input */}
           <div>
             <label className="block text-gray-600 dark:text-[#788099] text-sm mb-1">
               Account Name (Auto-filled)
             </label>
             <input
               className="w-full bg-gray-100 dark:bg-[#2A2A30] text-gray-500 dark:text-[#788099] rounded-lg px-4 py-3 cursor-not-allowed"
               placeholder="Your name will be auto-filled"
               value={name}
               readOnly
               disabled
             />
           </div>
                     {/* Account Number Input */}
           <div>
             <label className="block text-gray-600 dark:text-[#788099] text-sm mb-1">
               Account Number
             </label>
             <input
               className="w-full bg-gray-50 dark:bg-[#23232B] text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1D8751] placeholder:text-gray-400 dark:placeholder:text-[#788099]"
               placeholder="Enter account number"
               value={account}
               onChange={(e) => setAccount(e.target.value)}
               disabled={loading}
             />
           </div>
          {/* Error/Loading */}
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {postError && <div className="text-red-500 text-sm">{postError}</div>}
          {postLoading && (
            <div className="text-blue-500 text-sm">
              Adding payment method...
            </div>
          )}

                                           {/* Buttons */}
            <div className="flex gap-3 mt-4">
                             <button
                 className="flex-1 rounded-xl border border-gray-200 dark:border-[#35353E] bg-transparent text-gray-700 dark:text-white py-3 font-medium hover:bg-gray-50 dark:hover:bg-[#23232B] transition-colors"
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
              className="flex-1 rounded-xl bg-[#1D8751] text-white py-3 font-medium hover:bg-[#17693f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
