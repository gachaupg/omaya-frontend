"use client";
import UserCard from "@/components/dashboard/ui/UserCard";
import PriceCards from "@/components/charts/PriceChart";
import VolumeChart from "@/components/charts/VolumeChart";
import LineCharts from "@/components/charts/LineCharts";
import Transactions from "@/components/dashboard/ui/Transactions";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTransactionSummary,
  selectTransactionSummary,
} from "@/features/p2p/slices/transactionSummarySlice";
import { useKYC } from "@/features/kyc";
import { openKYCModal } from "@/features/auth/slices/authSlice";
import { AppDispatch } from "@/store";
import { emptyTransactionSummary } from "@/components/types";


export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const transactionSummary = useSelector(selectTransactionSummary);
  
  // KYC hook usage example
  const { isVerified, loading, checkStatus, error } = useKYC();

  useEffect(() => {
    dispatch(fetchTransactionSummary());
    // Check KYC status on dashboard load
    checkStatus();
  }, [dispatch, checkStatus]);

  // Log KYC status when it changes and show modal if not verified
  useEffect(() => {
    console.log('KYC Status:', { isVerified, loading, error });
    
    // Only show KYC modal if we have a definitive false response and not loading
    if (isVerified === false && !loading && !error) {
      console.log('Opening KYC modal - user is not verified');
      dispatch(openKYCModal());
    } else if (isVerified === true) {
      console.log('User is verified - no modal needed');
    }
  }, [isVerified, loading, error, dispatch]);

  return (
    <div className="pt-0 mb-4 flex flex-col gap-4 rounded-lg w-full">
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
