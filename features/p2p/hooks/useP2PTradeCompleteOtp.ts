"use client";

import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { completeP2PTradeThunk } from "@/features/p2p/slices/orderSlice";
import { showToast } from "@/lib/utils/toast";

type UseP2PTradeCompleteOtpOptions = {
  tradeId?: string;
  onComplete?: () => void;
};

export function useP2PTradeCompleteOtp({
  tradeId,
  onComplete,
}: UseP2PTradeCompleteOtpOptions) {
  const dispatch = useDispatch<AppDispatch>();
  const confirmTradeLoading = useSelector(
    (state: RootState) => state.p2pMarket?.confirmTradeLoading ?? false
  );

  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);

  const requestOtp = useCallback(async () => {
    if (!tradeId) return;

    setOtpError("");
    try {
      const result = await dispatch(
        completeP2PTradeThunk({ id: tradeId })
      ).unwrap();

      const message =
        result.message ||
        "An OTP has been sent to your email. Please verify to confirm payment received.";
      showToast.success(message);
      setOtpModalOpen(true);
    } catch (error: any) {
      const message =
        typeof error === "string"
          ? error
          : error?.message || "Failed to send OTP. Please try again.";
      showToast.error("Failed to request verification", message);
    }
  }, [dispatch, tradeId]);

  const verifyOtp = useCallback(
    async (otp: string) => {
      if (!tradeId) return;

      setOtpError("");
      setOtpVerifying(true);
      try {
        const result = await dispatch(
          completeP2PTradeThunk({ id: tradeId, otp })
        ).unwrap();

        setOtpModalOpen(false);
        showToast.success(
          result.message || "Trade completed successfully!",
          "Payment received confirmed"
        );
        onComplete?.();
      } catch (error: any) {
        const message =
          typeof error === "string"
            ? error
            : error?.message || "Invalid OTP. Please try again.";
        setOtpError(message);
        throw error;
      } finally {
        setOtpVerifying(false);
      }
    },
    [dispatch, onComplete, tradeId]
  );

  const resendOtp = useCallback(async () => {
    if (!tradeId) return;

    setOtpError("");
    try {
      const result = await dispatch(
        completeP2PTradeThunk({ id: tradeId })
      ).unwrap();
      showToast.success(
        result.message || "A new OTP has been sent to your email."
      );
    } catch (error: any) {
      const message =
        typeof error === "string"
          ? error
          : error?.message || "Failed to resend OTP. Please try again.";
      setOtpError(message);
    }
  }, [dispatch, tradeId]);

  return {
    otpModalOpen,
    setOtpModalOpen,
    otpError,
    otpVerifying,
    confirmTradeLoading,
    requestOtp,
    verifyOtp,
    resendOtp,
  };
}
