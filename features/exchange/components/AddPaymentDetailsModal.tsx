import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../store";
import { ChevronDown, X } from "lucide-react";
import { PaymentMethod, PaymentProvider, UserPaymentDetail } from "../types";
import {
  fetchPaymentMethods,
  fetchPaymentProviders,
  addUserPaymentDetail,
} from "../slices/paymentSlice";
import toast from "react-hot-toast";

interface AddPaymentDetailsModalProps {
  onClose: () => void;
  onAddPaymentDetail: (detail: UserPaymentDetail) => void;
}

const AddPaymentDetailsModal: React.FC<AddPaymentDetailsModalProps> = ({
  onClose,
  onAddPaymentDetail,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { paymentMethods, paymentProviders } = useSelector(
    (state: any) => state.payment
  );

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [selectedProvider, setSelectedProvider] =
    useState<PaymentProvider | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchPaymentMethods());
  }, [dispatch]);

  useEffect(() => {
    if (selectedMethod) {
      dispatch(fetchPaymentProviders(selectedMethod.name));
    } else {
      setSelectedProvider(null); // Reset provider if method is unselected
    }
  }, [dispatch, selectedMethod]);

  const handleAdd = async () => {
    setFormError(null);

    if (
      !selectedMethod ||
      !selectedProvider ||
      !accountName ||
      !accountNumber
    ) {
      setFormError("Please fill all required fields.");
      return;
    }

    try {
      const resultAction = await dispatch(
        addUserPaymentDetail({
          provider_name: selectedProvider.provider_name,
          account_name: accountName,
          account_number: accountNumber,
          wallet_address: walletAddress || undefined,
        })
      ).unwrap();
      onAddPaymentDetail(resultAction);
      toast.success("Payment detail added successfully!");
      onClose();
    } catch (error: any) {
      setFormError(error || "Failed to add payment detail.");
      toast.error(`Failed to add payment detail: ${error}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1D1D23] rounded-lg p-6 w-full max-w-md border border-[#35353E]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            Add payment details
          </h2>
          <button onClick={onClose} className="text-[#788099] hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          {/* Payment Method Select */}
          <div className="relative">
            <label className="block text-sm mb-1 text-[#788099]">
              Payment Method
            </label>
            <select
              value={selectedMethod?.payment_method_id || ""}
              onChange={(e) => {
                const selected = paymentMethods.find(
                  (method: PaymentMethod) =>
                    method.payment_method_id === e.target.value
                );
                setSelectedMethod(selected || null);
              }}
              className="w-full bg-[#18181D] border border-[#35353E] rounded-xl text-white py-2 pl-3 pr-8 text-sm font-medium appearance-none focus:outline-none h-12"
            >
              <option value="" disabled>
                Select Payment Method
              </option>
              {paymentMethods.map((method: PaymentMethod) => (
                <option
                  key={method.payment_method_id}
                  value={method.payment_method_id}
                >
                  {method.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDown className="h-4 w-4 text-[#788099]" />
            </div>
          </div>

          {/* Payment Provider Select */}
          <div className="relative">
            <label className="block text-sm mb-1 text-[#788099]">
              Payment Provider
            </label>
            <select
              value={selectedProvider?.provider_id || ""}
              onChange={(e) => {
                const selected = paymentProviders.find(
                  (provider: PaymentProvider) =>
                    provider.provider_id === e.target.value
                );
                setSelectedProvider(selected || null);
              }}
              className="w-full bg-[#18181D] border border-[#35353E] rounded-xl text-white py-2 pl-3 pr-8 text-sm font-medium appearance-none focus:outline-none h-12"
              disabled={!selectedMethod || paymentProviders.length === 0}
            >
              <option value="" disabled>
                Select Payment Provider
              </option>
              {paymentProviders.map((provider: PaymentProvider) => (
                <option key={provider.provider_id} value={provider.provider_id}>
                  {provider.provider_name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDown className="h-4 w-4 text-[#788099]" />
            </div>
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-sm mb-1 text-[#788099]">
              Account Name
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full p-3 rounded-lg text-sm bg-[#18181D] text-white border border-[#35353E] focus:outline-none h-12"
              placeholder="Sonnie"
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm mb-1 text-[#788099]">
              Account Number
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full p-3 rounded-lg text-sm bg-[#18181D] text-white border border-[#35353E] focus:outline-none h-12"
              placeholder="123456"
            />
          </div>

          {/* Wallet Address (Conditional) */}
          {selectedMethod?.name.toLowerCase().includes("crypto") && (
            <div>
              <label className="block text-sm mb-1 text-[#788099]">
                Wallet Address
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full p-3 rounded-lg text-sm bg-[#18181D] text-white border border-[#35353E] focus:outline-none h-12"
                placeholder="Your wallet address"
              />
            </div>
          )}

          {formError && (
            <p className="text-red-500 text-sm mt-2">{formError}</p>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-full text-white border border-[#788099] hover:bg-[#35353E] transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="px-6 py-2 rounded-full bg-[#1D8751] text-white hover:bg-[#17693e] transition"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPaymentDetailsModal;
