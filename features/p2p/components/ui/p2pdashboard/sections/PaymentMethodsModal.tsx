import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {  AppDispatch } from "@/store";
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
  console.log("adminMethods", adminMethods);
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
      setName("");
      setAccount("");
      dispatch(clearPostStatus());
    }
  }, [open, dispatch, isClient]);

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
    if (!method || !provider || !name || !account) return;
    const selectedProvider = providers.find(
      (p: any) => p.provider_name === provider
    );
    dispatch(
      postUserPaymentDetail({
        account_name: name,
        account_number: account,
        payment_method_name: method,
        payment_provider_name: provider,
        provider_name: provider,
        wallet_address: selectedProvider?.wallet_address || null,
      })
    );
  };

  // Close modal on success
  useEffect(() => {
    if (postSuccess) {
      showToast.success("Payment method added!");
      if (onAdd) onAdd();
      onClose();
    }
  }, [postSuccess, onAdd, onClose]);

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
        <div className="flex flex-col gap-3">
         
          {/* Name Input */}
          <input
            className="w-full bg-[#23232B] text-white rounded-lg px-4 py-3 focus:outline-none placeholder:text-[#788099]"
            placeholder="Peter"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
          {/* Account Number Input */}
          <input
            className="w-full bg-[#23232B] text-white rounded-lg px-4 py-3 focus:outline-none placeholder:text-[#788099]"
            placeholder="Account Number"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            disabled={loading}
          />
          {/* Error/Loading */}
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {postError && <div className="text-red-500 text-sm">{postError}</div>}
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
              className="flex-1 rounded-lg bg-[#1D8751] text-white py-2 font-medium hover:bg-[#17693f] transition"
              onClick={handleAdd}
              type="button"
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
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsModal;
