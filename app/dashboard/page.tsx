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
import { AppDispatch } from "@/store";
import {
  emptyTransactionSummary,
} from "@/components/types";

export default function DashboardPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const transactionSummary = useSelector(selectTransactionSummary);

  useEffect(() => {
    dispatch(fetchTransactionSummary());
  }, [dispatch]);

  return (
    <div className="pt-0 mb-4 flex flex-col gap-4 rounded-lg w-full">
      <UserCard />
      <PriceCards />
      <VolumeChart
        transactionSummary={transactionSummary || emptyTransactionSummary}
      />
      <LineCharts transactionSummary={transactionSummary || emptyTransactionSummary} />
      <Transactions />
    </div>
  );
}
