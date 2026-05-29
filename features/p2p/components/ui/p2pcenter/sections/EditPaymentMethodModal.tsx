"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import Button from "@/features/p2p/components/Common/Button";
import Input from "@/features/p2p/components/Common/Input";
import {
  sendPaymentDetailEditOtp,
  updatePaymentDetailWithOtp,
  clearPatchStatus,
  fetchUserPaymentDetails,
} from "@/features/p2p/slices/paymentMethodsSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/rootReducer";
import { showToast } from "@/lib/utils/toast";
import { logger } from "@/lib/utils/logger";
import {
  isCryptoPaymentMethodForAutoSend,
  isForexPaymentMethodForAutoSend,
  parseAllowAutoSend,
  shouldShowEditAllowAutoSendCheckbox,
} from "@/features/p2p/utils/paymentAutoSend";

interface EditPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod: {
    id: number | string;
    account_name: string;
    account_number: string;
    wallet_address?: string | null;
    allow_auto_send?: boolean;
    payment_method_name?: string;
    payment_provider_name?: string;
    provider_name?: string;
    user_payment_detail_id?: string; // UUID if backend uses it
  } | null;
}

const EditPaymentMethodModal: React.FC<EditPaymentMethodModalProps> = ({
  isOpen,
  onClose,
  paymentMethod,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { patchLoading, patchError, patchSuccess, userPaymentDetails } =
    useSelector((state: RootState) => state.paymentMethods);

  const [formData, setFormData] = useState({
    account_name: "",
    account_number: "",
    wallet_address: "",
    allow_auto_send: false,
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [sendOtpLoading, setSendOtpLoading] = useState(false);
  const [sendOtpError, setSendOtpError] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Send OTP: payload uses user_payment_detail_id (uuid)
  const otpPayloadId = paymentMethod?.user_payment_detail_id ?? "";
  // PATCH URL uses numeric id
  const patchId = paymentMethod?.id != null ? String(paymentMethod.id) : "";

  // Initialize form data from props when payment method changes
  useEffect(() => {
    if (paymentMethod) {
      const isCrypto = isCryptoPaymentMethodForAutoSend(paymentMethod);
      const isForex = isForexPaymentMethodForAutoSend(paymentMethod);
      const walletValue = paymentMethod.wallet_address || paymentMethod.account_number || "";
      const accountValue = paymentMethod.account_number || "";

      setFormData({
        account_name: paymentMethod.account_name || "",
        account_number: isCrypto || isForex ? walletValue : accountValue,
        wallet_address: isCrypto || isForex ? walletValue : (paymentMethod.wallet_address || ""),
        allow_auto_send: parseAllowAutoSend(paymentMethod.allow_auto_send),
      });
      dispatch(clearPatchStatus());
    }
    return () => {
      setOtpSent(false);
      setOtp("");
      setSendOtpError(null);
      setCooldownRemaining(0);
    };
  }, [paymentMethod, dispatch]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const t = setInterval(() => setCooldownRemaining((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldownRemaining]);

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

  const isCryptoMethod = isCryptoPaymentMethodForAutoSend(paymentMethod);
  const isForexMethod = isForexPaymentMethodForAutoSend(paymentMethod);

  const showAllowAutoSendCheckbox = useMemo(
    () => shouldShowEditAllowAutoSendCheckbox(paymentMethod, userPaymentDetails),
    [paymentMethod, userPaymentDetails]
  );

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchUserPaymentDetails() as any);
    }
  }, [isOpen, dispatch]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSendOtp = async () => {
    if (!paymentMethod || !otpPayloadId) {
      showToast.error("Payment detail ID is required. Please refresh and try again.");
      return;
    }
    setSendOtpLoading(true);
    setSendOtpError(null);
    try {
      const result = await dispatch(sendPaymentDetailEditOtp(otpPayloadId)).unwrap();
      setOtpSent(true);
      setCooldownRemaining(result.cooldown_seconds ?? 60);
      showToast.success(result.message || "OTP sent to your email address");
    } catch (err: unknown) {
      const msg = typeof err === "string" ? err : (err as { message?: string })?.message || "Failed to send OTP";
      setSendOtpError(msg);
      showToast.error(msg);
    } finally {
      setSendOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentMethod) {
      showToast.error("No payment method selected");
      return;
    }

    const isCryptoMethod = isCryptoPaymentMethodForAutoSend(paymentMethod);
    const isForexMethod = isForexPaymentMethodForAutoSend(paymentMethod);

    if (!patchId) {
      showToast.error("Payment method ID is required. Please refresh and try again.");
      return;
    }
    if (!otpSent || !otp.trim()) {
      showToast.error("Please request and enter the OTP first");
      return;
    }

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

    const updateData: {
      otp: string;
      account_name?: string;
      account_number?: string;
      wallet_address?: string | null;
      allow_auto_send?: boolean;
      provider_name?: string;
    } = { otp: otp.trim() };

    if (formData.account_name.trim()) updateData.account_name = formData.account_name.trim();

    if (isCryptoMethod || isForexMethod) {
      const walletValue = formData.wallet_address.trim();
      updateData.wallet_address = walletValue || null;
      updateData.account_number = walletValue;
    } else {
      updateData.account_number = formData.account_number.trim();
      updateData.wallet_address = null;
    }

    if (showAllowAutoSendCheckbox) {
      updateData.allow_auto_send = Boolean(formData.allow_auto_send);
    }

    try {
      await dispatch(
        updatePaymentDetailWithOtp({
          id: patchId,
          data: updateData,
        })
      ).unwrap();
    } catch (error: unknown) {
      const errMsg =
        typeof error === "string"
          ? error
          : (error as { message?: string })?.message || "Failed to update payment method";
      logger.error("p2p", "Failed to update payment method:", error);
      showToast.error(errMsg);
      if (
        /OTP is required|request an OTP first|request a new OTP/i.test(errMsg)
      ) {
        setOtpSent(false);
        setOtp("");
      }
    }
  };

  if (!isOpen || !paymentMethod) return null;

  const hasValidOtpId = Boolean(otpPayloadId && otpPayloadId.length > 10);

  // Check if account number or wallet address is filled based on payment method type
  const hasAccountOrWallet = isCryptoMethod || isForexMethod
    ? formData.wallet_address.trim().length > 0
    : formData.account_number.trim().length > 0;

  const canSendOtp = hasValidOtpId && !sendOtpLoading && cooldownRemaining <= 0 && hasAccountOrWallet;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4 py-6 sm:py-8">
      <div className="flex w-full max-w-md flex-col max-h-[min(100vh-2rem,720px)] my-auto rounded-2xl border border-gray-200 dark:border-accent bg-white dark:bg-[#1D1D23] shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 dark:border-accent p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Edit Payment Method
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={patchLoading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              {!hasValidOtpId && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm">
                  Cannot edit: payment detail UUID is missing for OTP. Please refresh the page.
                </div>
              )}
              {/* Payment Provider Name (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Provider
                </label>
                <div className="px-4 py-2 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-accent rounded-xl text-sm text-gray-900 dark:text-white">
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
                  className="w-full text-gray-900 dark:text-white disabled:opacity-50"
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
                    className="w-full text-gray-900 dark:text-white disabled:opacity-50"
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
                    className="w-full text-gray-900 dark:text-white"
                  />
                </div>
              )}

              {/* Allow auto-send: hidden if another account already has it (only one allowed) */}
              {showAllowAutoSendCheckbox && (
                <>
                  <style jsx global>{`
                .terms-checkbox-green:checked {
                  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L4.5 10.586l6.293-6.293a1 1 0 011.414 0z'/%3e%3c/svg%3e") !important;
                  background-size: 14px 14px !important;
                  background-repeat: no-repeat !important;
                  background-position: center !important;
                }
              `}</style>
                  <div className="rounded-xl border border-[#1D8751]/30 bg-[#1D8751]/5 dark:bg-[#1D8751]/10 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="allow_auto_send"
                        checked={Boolean(formData.allow_auto_send)}
                        onChange={(e) =>
                          handleInputChange("allow_auto_send", e.target.checked)
                        }
                        disabled={patchLoading}
                        className="terms-checkbox-green w-5 h-5 rounded border-2 border-[#1D8751] focus:ring-[#1D8751] appearance-none bg-transparent checked:bg-[#1D8751] checked:border-[#1D8751] shrink-0"
                      />
                      <label
                        htmlFor="allow_auto_send"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        Allow auto-send
                      </label>
                    </div>
                    {formData.allow_auto_send ? (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Uncheck to turn off automatic transactions for this account.
                      </p>
                    ) : (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Enable automatic processing for USDT deposits on this account.
                        Only one payment method can use auto-send at a time.
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* OTP input - shown after Request OTP is clicked */}
              {otpSent && (
                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Enter OTP from email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="6-digit OTP"
                    disabled={patchLoading}
                    className="w-full text-gray-900 dark:text-white"
                  />
                  {cooldownRemaining > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Resend in {cooldownRemaining}s
                    </p>
                  )}
                  {cooldownRemaining <= 0 && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendOtpLoading}
                      className="text-xs text-[#1D8751] hover:underline mt-1"
                    >
                      {sendOtpLoading ? "Sending..." : "Resend OTP"}
                    </button>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={patchLoading || sendOtpLoading}
                  className="flex-1 py-3 text-base"
                >
                  Cancel
                </Button>
                {!otpSent ? (
                  <Button
                    type="button"
                    variant="primary"
                    disabled={!canSendOtp}
                    onClick={handleSendOtp}
                    className="flex-1 py-3 text-base"
                  >
                    {sendOtpLoading
                      ? "Sending..."
                      : cooldownRemaining > 0
                        ? `Wait ${cooldownRemaining}s`
                        : "Request OTP"}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={patchLoading || !otp.trim()}
                    className="flex-1 py-3 text-base"
                  >
                    {patchLoading ? "Confirming..." : "Confirm"}
                  </Button>
                )}
              </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPaymentMethodModal;

