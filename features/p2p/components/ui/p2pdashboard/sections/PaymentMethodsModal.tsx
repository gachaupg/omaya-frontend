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
  console.log("adminMethods", adminMethods);
  console.log("Redux state", {
    loading,
    error,
    postLoading,
    postError,
    postSuccess,
  });
  console.log("Auth state", { isAuthenticated, user });
  const [method, setMethod] = useState("");
  const [provider, setProvider] = useState("");
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch payment methods when modal opens
  useEffect(() => {
    if (open && isClient) {
      dispatch(fetchAdminPaymentMethods() as any);
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

  // Unique method types for dropdown
  const methodTypes = Array.from(
    new Set((adminMethods || []).map((m: any) => m.payment_method_type))
  ) as string[];

  // Providers for selected method
  const providers = (adminMethods || []).filter(
    (m: any) => m.payment_method_type === method
  );

  // Handle Add
  const handleAdd = () => {
    console.log("handleAdd called", { method, provider, name, account });
    if (!isAuthenticated) {
      console.log("User not authenticated");
      showToast.error("Please log in to add payment methods");
      return;
    }
    if (!method || !provider || !name || !account) {
      console.log("Validation failed", { method, provider, name, account });
      showToast.error("Please fill all required fields");
      return;
    }
    const selectedProvider = providers.find(
      (p: any) => p.provider_name === provider
    );
    console.log("Selected provider", selectedProvider);
    const payload = {
      account_name: name,
      account_number: account,
      payment_method_name: method,
      payment_provider_name: provider,
      provider_name: provider,
      wallet_address: selectedProvider?.wallet_address || null,
    };
    console.log("Dispatching payload", payload);
    dispatch(postUserPaymentDetail(payload));
  };

  // Close modal on success
  useEffect(() => {
    console.log("postSuccess effect triggered", postSuccess);
    if (postSuccess) {
      console.log("Payment method added successfully!");
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
      console.log("Post error occurred:", postError);
      showToast.error(postError);
    }
  }, [postError]);

  if (!open) return null;

  // Show loading state during SSR or initial client render
  if (!isClient) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-[#19191D] rounded-2xl p-6 w-full max-w-xs shadow-lg pointer-events-auto">
          <div className="text-white text-base font-semibold mb-4">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-[#19191D] rounded-2xl p-6 w-full max-w-xs shadow-lg pointer-events-auto">
        <div className="text-white text-base font-semibold mb-4">
          Add payment details
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
            <label className="block text-[#788099] text-sm mb-1">
              Payment Method
            </label>
            <select
              className="w-full p-3 rounded-[24px] bg-[#18181D] border border-[#35353E] text-white"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              disabled={loading}
            >
              <option value="">Select Method</option>
              {methodTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Provider Dropdown */}
          {method && (
            <div>
              <label className="block text-[#788099] text-sm mb-1">
                Provider
              </label>
              <select
                className="w-full p-3 rounded-[24px] bg-[#18181D] border border-[#35353E] text-white"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                disabled={loading}
              >
                <option value="">Select Provider</option>
                {providers.map((p: any) => (
                  <option key={p.provider_name} value={p.provider_name}>
                    {p.provider_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Name Input */}
          <div>
            <label className="block text-[#788099] text-sm mb-1">
              Account Name (Auto-filled)
            </label>
            <input
              className="w-full bg-[#23232B] text-white rounded-lg px-4 py-3 focus:outline-none placeholder:text-[#788099]"
              placeholder="Your name will be auto-filled"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          {/* Account Number Input */}
          <div>
            <label className="block text-[#788099] text-sm mb-1">
              Account Number
            </label>
            <input
              className="w-full bg-[#23232B] text-white rounded-lg px-4 py-3 focus:outline-none placeholder:text-[#788099]"
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
          <div className="flex gap-4 mt-2">
            <button
              className="flex-1 rounded-lg border border-[#35353E] bg-transparent text-white py-2 font-medium hover:bg-[#23232B] transition"
              onClick={onClose}
              type="button"
              disabled={loading || postLoading}
            >
              Cancel
            </button>
            <button
              className="flex-1 rounded-lg bg-[#1D8751] text-white py-2 font-medium hover:bg-[#17693f] transition disabled:opacity-50 disabled:cursor-not-allowed"
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
