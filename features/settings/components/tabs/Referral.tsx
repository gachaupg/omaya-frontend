// src/features/p2p/components/ui/referral/Referral.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState, AppDispatch } from "@/store/rootReducer";

import { fetchReferredUsers } from "../../slices/referralSlice";
import { fetchReferralWallet } from "../../slices/referralWalletSlice";

import ReferralTabs from "./sections/ReferralTabs";
import ReferralMainCard from "./sections/ReferralMainCard";
import ReferralUsersList from "./sections/ReferralUsersList";
import ReferralWithdrawalHistory from "./sections/ReferralWithdrawalHistory";
import Withdraw from "./Withdraw";

// Application Submitted Success Modal Component
const ApplicationSubmittedModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-black rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
        {/* Success Icon */}
        <div className="flex justify-start mb-6">
          <div className="w-12 h-12 border-2 border-green-500 rounded-full flex items-center justify-center">
            <svg
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
              className="text-green-500"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>

        {/* Success Title */}
        <h2 className="text-white text-2xl font-bold mb-4 text-left">
          Application Submitted
        </h2>

        {/* Success Message */}
        <p className="text-gray-300 text-sm mb-8 text-left leading-relaxed">
          We received your application for verified advertiser. Upon our review, you will receive notification about the outcome of your application
        </p>

        {/* OK Button */}
        <button
          onClick={onClose}
          className="w-full bg-green-500 text-white py-3 rounded-xl text-lg font-medium hover:bg-green-600 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
};

const Referral: React.FC = () => {
  /* ───────────────────────────── state ───────────────────────────── */
  const [activeTab, setActiveTab] = useState<"Referral" | "History">(
    "Referral"
  );
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);
  const { referredUsers, loading: usersLoading } = useSelector(
    (s: RootState) => s.referral
  );
  const {
    data: wallet,
    loading: walletLoading,
    error: walletError,
  } = useSelector((s: RootState) => s.referralWallet);

  /* ───────────────────────── fetch side-effects ───────────────────── */
  const refCode = user?.referral_code;

  useEffect(() => {
    if (!isAuthenticated || !refCode) return;

    // always load referred users
    dispatch(fetchReferredUsers(refCode));

    // only load wallet on the referral tab
    if (activeTab === "Referral") {
      dispatch(fetchReferralWallet()).catch((e) =>
        console.warn("Referral wallet API not available:", e)
      );
    }
  }, [activeTab, dispatch, isAuthenticated, refCode]);

  /* ───────────────────────────── handlers ─────────────────────────── */
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Navigate to previous page
    router.back();
  };

  // Function to show success modal (call this after successful submission)
  const showApplicationSuccessModal = () => {
    setShowSuccessModal(true);
  };

  /* ───────────────────────────── early exit ───────────────────────── */
  if (showWithdraw) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-gray-50 text-gray-900 dark:bg-[#18181b] dark:text-white">
        <Withdraw />
      </div>
    );
  }

  /* ─────────────────────────────── render ─────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#18181b] dark:text-white w-full">
      <ReferralTabs
        tab={activeTab}
        setTab={setActiveTab as (tab: string) => void}
      />

      {activeTab === "Referral" && (
        <div className="flex flex-col border border-[#35353F] rounded-[18px] p-4">
          <ReferralMainCard
            user={user}
            walletData={wallet}
            walletLoading={walletLoading}
            walletError={walletError}
            setShowWithdrawPage={setShowWithdraw}
          />

          <ReferralUsersList
            referredUsers={referredUsers}
            loading={usersLoading}
          />
        </div>
      )}
      {activeTab === "History" && (
        <div className="border border-[#35353F] rounded-[18px] p-4">
          <ReferralWithdrawalHistory />
        </div>
      )}

      

      {/* Application Submitted Success Modal */}
      <ApplicationSubmittedModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
      />
    </div>
  );
};

export default Referral;
