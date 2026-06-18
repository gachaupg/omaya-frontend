"use client";

import React from "react";
import OTPModal from "@/features/p2p/components/ui/express/components/forms/OTPModal";

interface P2PTradeCompleteOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => void;
  onResend: () => void;
  isLoading?: boolean;
  error?: string;
}

const P2PTradeCompleteOtpModal: React.FC<P2PTradeCompleteOtpModalProps> = (
  props
) => (
  <OTPModal
    {...props}
    title="Verify Payment Received"
    description="Enter the 6-digit code sent to your email to confirm you received the payment."
    verifyButtonLabel="Confirm Payment Received"
    usePortal
  />
);

export default P2PTradeCompleteOtpModal;
