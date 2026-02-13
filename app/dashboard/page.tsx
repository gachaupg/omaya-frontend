"use client";
import UserCard from "@/components/dashboard/ui/UserCard";
import PriceCards from "@/components/charts/PriceChart";
import VolumeChart from "@/components/charts/VolumeChart";
import LineCharts from "@/components/charts/LineCharts";
import Transactions from "@/components/dashboard/ui/Transactions";
import CongratulationsModal from "@/components/dashboard/ui/CongratulationsModal";
import { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTransactionSummary,
  selectTransactionSummary,
} from "@/features/p2p/slices/transactionSummarySlice";
import { useKYC } from "@/features/kyc";
import { openKYCModal } from "@/features/auth/slices/authSlice";
import { AppDispatch, RootState } from "@/store";
import { emptyTransactionSummary } from "@/components/types";
import { logger } from "@/lib/utils/logger";
import { storage } from "@/features/auth/utils/storage";

const CONGRATULATIONS_SHOWN_KEY = "omaya_congratulations_shown";
// Track users who were previously unverified in this session
const PREVIOUSLY_UNVERIFIED_KEY = "omaya_previously_unverified";

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const transactionSummary = useSelector(selectTransactionSummary);
  const { user } = useSelector((state: RootState) => state.auth);
  const [showCongratulations, setShowCongratulations] = useState(false);
  // Track if we've seen the user as unverified in this session
  const wasUnverifiedRef = useRef(false);
  // Read token once client-side; effects will no-op if missing
  const accessToken = useMemo(() => (typeof window !== 'undefined' ? storage.getToken() : null), []);

  // KYC hook usage example
  const { isVerified, loading, checkStatus, error } = useKYC();

  useEffect(() => {
    if (!accessToken) {
      logger.warn("auth", "Skipping dashboard API calls: no access token yet");
      return;
    }
    dispatch(fetchTransactionSummary());
    checkStatus();
  }, [dispatch, checkStatus, accessToken]);

  // Track when user is unverified (will show congratulations when they become verified)
  useEffect(() => {
    if (isVerified === false && !loading && !error) {
      // User is currently unverified - mark this so we can show congrats when verified
      wasUnverifiedRef.current = true;
      const userId = user?.id?.toString() || '';
      if (userId) {
        sessionStorage.setItem(PREVIOUSLY_UNVERIFIED_KEY, userId);
      }
      dispatch(openKYCModal());
    } else if (isVerified === true && !loading) {
      const userId = user?.id?.toString() || '';
      const shownForUser = localStorage.getItem(CONGRATULATIONS_SHOWN_KEY);
      const previouslyUnverifiedUser = sessionStorage.getItem(PREVIOUSLY_UNVERIFIED_KEY);
      
      // Only show congratulations if:
      // 1. User was previously unverified in this session (just got verified)
      // 2. Congratulations hasn't been shown for this user yet
      if (previouslyUnverifiedUser === userId && shownForUser !== userId && userId) {
        setShowCongratulations(true);
        // Clear the session flag
        sessionStorage.removeItem(PREVIOUSLY_UNVERIFIED_KEY);
      }
    }
  }, [isVerified, loading, error, dispatch, user?.id]);

  const handleCloseCongratulations = () => {
    setShowCongratulations(false);
    // Mark as shown for this user
    const userId = user?.id?.toString() || '';
    if (userId) {
      localStorage.setItem(CONGRATULATIONS_SHOWN_KEY, userId);
    }
  };

  const userName = user?.first_name || user?.email?.split('@')[0] || '';

  return (
    <div className="w-full min-h-screen pt-0 pb-4 flex flex-col gap-0 sm:gap-4 overflow-x-hidden px-3   md:px-6">
      <UserCard />
      <div className="w-full flex flex-col gap-4">
        <PriceCards />
        <VolumeChart
          transactionSummary={transactionSummary || emptyTransactionSummary}
        />
        <LineCharts
          transactionSummary={transactionSummary || emptyTransactionSummary}
        />
        <Transactions />
      </div>
      
      {/* Congratulations Modal for newly verified users */}
      <CongratulationsModal
        isOpen={showCongratulations}
        onClose={handleCloseCongratulations}
        userName={userName}
      />
    </div>
  );
}
