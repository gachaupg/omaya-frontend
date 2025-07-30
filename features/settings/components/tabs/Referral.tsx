// src/features/p2p/components/ui/referral/Referral.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store/rootReducer";

import { fetchReferredUsers } from "../../slices/referralSlice";
import { fetchReferralWallet } from "../../slices/referralWalletSlice";

import ReferralTabs from "./sections/ReferralTabs";
import ReferralMainCard from "./sections/ReferralMainCard";
import ReferralUsersList from "./sections/ReferralUsersList";
import Withdraw from "./Withdraw";

const Referral: React.FC = () => {
  /* ───────────────────────────── state ───────────────────────────── */
  const [activeTab, setActiveTab] = useState<"Referral" | "History">(
    "Referral"
  );
  const [showWithdraw, setShowWithdraw] = useState(false);

  const dispatch = useDispatch<AppDispatch>();

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
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#18181b] dark:text-white">
      <ReferralTabs
        tab={activeTab}
        setTab={setActiveTab as (tab: string) => void}
      />

      {activeTab === "Referral" && (
        <>
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
        </>
      )}

      {activeTab === "History" && (
        <div className="py-12 text-center text-lg text-gray-500 dark:text-gray-400">
          History page content goes here.
        </div>
      )}
    </div>
  );
};

export default Referral;
