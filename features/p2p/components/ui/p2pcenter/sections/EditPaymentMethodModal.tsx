"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import Button from "@/features/p2p/components/Common/Button";
import Input from "@/features/p2p/components/Common/Input";
import {
  patchUserPaymentDetail,
  clearPatchStatus,
  fetchUserPaymentDetails,
} from "@/features/p2p/slices/paymentMethodsSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/rootReducer";
import { showToast } from "@/lib/utils/toast";
import { logger } from "@/lib/utils/logger";

interface EditPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod: {
    id: number;
    account_name: string;
    account_number: string;
    wallet_address?: string | null;
    allow_auto_send?: boolean;
    payment_method_name?: string;
    payment_provider_name?: string;
    provider_name?: string;
  } | null;
}

const EditPaymentMethodModal: React.FC<EditPaymentMethodModalProps> = ({
  isOpen,
  onClose,
  paymentMethod,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { patchLoading, patchError, patchSuccess } = useSelector(
    (state: RootState) => state.paymentMethods
  );

  const [formData, setFormData] = useState({
    account_name: "",
    account_number: "",
    wallet_address: "",
    allow_auto_send: false,
  });

  // Initialize form data when payment method changes
  useEffect(() => {
    if (paymentMethod) {
      const isCrypto = paymentMethod.payment_method_name?.toLowerCase().includes("crypto") ||
        paymentMethod.payment_method_name?.toLowerCase().includes("wallet");
      const isForex = paymentMethod.payment_method_name?.toLowerCase().includes("forex");
      
      // For crypto/forex, wallet_address is the primary field
      // For regular methods, account_number is used
      const walletValue = paymentMethod.wallet_address || paymentMethod.account_number || "";
      const accountValue = paymentMethod.account_number || "";
      
      setFormData({
        account_name: paymentMethod.account_name || "",
        account_number: isCrypto || isForex ? walletValue : accountValue,
        wallet_address: isCrypto || isForex ? walletValue : (paymentMethod.wallet_address || ""),
        allow_auto_send: paymentMethod.allow_auto_send ?? false,
      });
      dispatch(clearPatchStatus());
    }
  }, [paymentMethod, dispatch]);

  // Handle success
  useEffect(() => {
    if (patchSuccess) {
      showToast.success("Payment method updated successfully!");
      dispatch(fetchUserPaymentDetails() as any);
      dispatch(clearPatchStatus());
      onClose();
    }
  }, [patchSuccess, dispatch, onClose]);

  // Handle errors
  useEffect(() => {
    if (patchError) {
      showToast.error(patchError);
      dispatch(clearPatchStatus());
    }
  }, [patchError, dispatch]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentMethod) {
      showToast.error("No payment method selected");
      return;
    }

    // Validate required fields based on payment method type
    if (!formData.account_name.trim()) {
      showToast.error("Account name is required");
      return;
    }
    
    if (isCryptoMethod || isForexMethod) {
      if (!formData.wallet_address.trim()) {
        showToast.error("Wallet address is required");
        return;
      }
    } else {
      if (!formData.account_number.trim()) {
        showToast.error("Account number is required");
        return;
      }
    }

    // Prepare update payload - only include changed fields
    const updateData: {
      account_name?: string;
      account_number?: string;
      wallet_address?: string | null;
      allow_auto_send?: boolean;
      provider_name?: string;
    } = {};

    // Only include fields that have changed
    if (formData.account_name !== paymentMethod.account_name) {
      updateData.account_name = formData.account_name.trim();
    }
    
    // Handle account_number vs wallet_address based on payment method type
    if (isCryptoMethod || isForexMethod) {
      // For crypto/forex, wallet_address is the primary field
      // The account_number should match wallet_address
      const walletValue = formData.wallet_address.trim();
      const currentWallet = (paymentMethod.wallet_address || "").trim();
      const currentAccount = (paymentMethod.account_number || "").trim();
      
      if (walletValue !== currentWallet) {
        updateData.wallet_address = walletValue || null;
        // Update account_number to match wallet_address
        if (walletValue !== currentAccount) {
          updateData.account_number = walletValue;
        }
      }
    } else {
      // For regular payment methods, update account_number
      if (formData.account_number.trim() !== (paymentMethod.account_number || "").trim()) {
        updateData.account_number = formData.account_number.trim();
      }
      // Keep wallet_address as null for non-crypto methods (if it was set)
      if (paymentMethod.wallet_address) {
        updateData.wallet_address = null;
      }
    }
    
    if (formData.allow_auto_send !== (paymentMethod.allow_auto_send ?? false)) {
      updateData.allow_auto_send = formData.allow_auto_send;
    }

    // Check if there are any changes
    if (Object.keys(updateData).length === 0) {
      showToast.error("No changes detected");
      return;
    }

    try {
      logger.debug(
        "p2p",
        "Updating payment method:",
        paymentMethod.id,
        updateData
      );
      await dispatch(
        patchUserPaymentDetail({
          id: paymentMethod.id,
          data: updateData,
        })
      ).unwrap();
    } catch (error: any) {
      logger.error("p2p", "Failed to update payment method:", error);
    }
  };

  if (!isOpen || !paymentMethod) return null;

  const isCryptoMethod =
    paymentMethod.payment_method_name?.toLowerCase().includes("crypto") ||
    paymentMethod.payment_method_name?.toLowerCase().includes("wallet");
  const isForexMethod =
    paymentMethod.payment_method_name?.toLowerCase().includes("forex");

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1D1D23] rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-[#35353E]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-[#35353E]">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Edit Payment Method
          </h2>
          <button
            onClick={onClose}
            disabled={patchLoading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Payment Provider Name (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Provider
            </label>
            <div className="px-4 py-2 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#35353E] rounded-xl text-sm text-gray-900 dark:text-white">
              {paymentMethod.payment_provider_name || paymentMethod.provider_name || "—"}
            </div>
          </div>

          {/* Account Name */}
          <div>
            <label
              htmlFor="account_name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Account Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="account_name"
              type="text"
              value={formData.account_name}
              onChange={(e) => handleInputChange("account_name", e.target.value)}
              placeholder="Enter account name"
              disabled={patchLoading}
              required
              className="w-full"
            />
          </div>

          {/* Account Number / Wallet Address */}
          {isCryptoMethod || isForexMethod ? (
            <div>
              <label
                htmlFor="wallet_address"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Wallet Address <span className="text-red-500">*</span>
              </label>
              <Input
                id="wallet_address"
                type="text"
                value={formData.wallet_address}
                onChange={(e) => handleInputChange("wallet_address", e.target.value)}
                placeholder="Enter wallet address"
                disabled={patchLoading}
                required
                className="w-full"
              />
            </div>
          ) : (
            <div>
              <label
                htmlFor="account_number"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Account Number <span className="text-red-500">*</span>
              </label>
              <Input
                id="account_number"
                type="text"
                value={formData.account_number}
                onChange={(e) => handleInputChange("account_number", e.target.value)}
                placeholder="Enter account number"
                disabled={patchLoading}
                required
                className="w-full"
              />
            </div>
          )}

          {/* Allow Auto Send (if applicable) */}
          {!isCryptoMethod && !isForexMethod && (
            <>
              <style jsx global>{`
                .terms-checkbox-green:checked {
                  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L4.5 10.586l6.293-6.293a1 1 0 011.414 0z'/%3e%3c/svg%3e") !important;
                  background-size: 14px 14px !important;
                  background-repeat: no-repeat !important;
                  background-position: center !important;
                }
              `}</style>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allow_auto_send"
                  checked={formData.allow_auto_send}
                  onChange={(e) => handleInputChange("allow_auto_send", e.target.checked)}
                  disabled={patchLoading}
                  className="terms-checkbox-green w-5 h-5 rounded border-2 border-[#1D8751] focus:ring-[#1D8751] appearance-none bg-transparent checked:bg-[#1D8751] checked:border-[#1D8751] flex-shrink-0"
                />
                <label
                  htmlFor="allow_auto_send"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Allow auto-send
                </label>
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={patchLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              disabled={patchLoading}
              className="flex-1"
            >
              {patchLoading ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPaymentMethodModal;

