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
    checkStatus();
  }, [dispatch, checkStatus, accessToken]);

  useEffect(() => {
    if (isVerified === false && !loading && !error) {
      dispatch(openKYCModal());
    } else if (isVerified === true) {
    }
  }, [isVerified, loading, error, dispatch]);

  return (
    <div className="w-full min-h-screen pt-0 pb-4 flex flex-col gap-0 sm:gap-4 overflow-x-hidden">
      <UserCard />
      <div className="w-full px-2 sm:px-6 md:px-8 flex flex-col gap-4">
        <PriceCards />
        <VolumeChart
          transactionSummary={transactionSummary || emptyTransactionSummary}
        />
        <LineCharts
          transactionSummary={transactionSummary || emptyTransactionSummary}
        />
        <Transactions />
      </div>
    </div>
  );
}
