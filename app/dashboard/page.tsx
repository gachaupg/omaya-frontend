"use client";
import UserCard from "@/components/dashboard/ui/UserCard";
import PriceCards from "@/components/charts/PriceChart";
import VolumeChart from "@/components/charts/VolumeChart";
import LineCharts from "@/components/charts/LineCharts";
import Transactions from "@/components/dashboard/ui/Transactions";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTransactionSummary,
  selectTransactionSummary,
} from "@/features/p2p/slices/transactionSummarySlice";
import { useKYC } from "@/features/kyc";
import { openKYCModal } from "@/features/auth/slices/authSlice";
import { AppDispatch } from "@/store";
import { emptyTransactionSummary } from "@/components/types";
import { logger } from "@/lib/utils/logger";
import { storage } from "@/features/auth/utils/storage";

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const transactionSummary = useSelector(selectTransactionSummary);
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
    // Check KYC status on dashboard load
    checkStatus();
  }, [dispatch, checkStatus, accessToken]);

  // Log KYC status when it changes and show modal if not verified
  useEffect(() => {
    // Only show KYC modal if we have a definitive false response and not loading
    if (isVerified === false && !loading && !error) {
      dispatch(openKYCModal());
    } else if (isVerified === true) {
    }
  }, [isVerified, loading, error, dispatch]);

  return (
    <div className="pt-0 mb-4 flex flex-col gap-4 xl:max-w-[1000px] mx-auto rounded-lg w-full">
      <UserCard />
      <PriceCards />

      <VolumeChart
        transactionSummary={transactionSummary || emptyTransactionSummary}
      />
      <LineCharts
        transactionSummary={transactionSummary || emptyTransactionSummary}
      />
      <Transactions />
    </div>
  );
}
