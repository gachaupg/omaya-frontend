"use client";
import React, { useState, useEffect, lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import {
  getFavoriteAssets,
  fetchExchangeStatistics,
} from "@/features/exchange/slices/exchangeSlice";
import { storage } from "@/features/auth/utils/storage";
import { User } from "@/features/auth/types";
import { ExchangeDataProvider } from "../ExchangeDataProvider";
import {
  CardSkeleton,
  ChartSkeleton,
  TableSkeleton,
  UserProfileSkeleton,
} from "@/components/ui/Skeletons";

// Lazy load all major components
const UserProfileCard = lazy(
  () => import("@/features/exchange/components/UserProfileCard")
);
const FavouriteAssets = lazy(
  () => import("@/features/exchange/components/FavouriteAssets")
);
const TransactionOverview = lazy(
  () => import("@/features/exchange/components/TransactionOverviewChart")
);
const TransactionHistoryTable = lazy(
  () => import("@/features/exchange/components/TransactionHistoryTable/index")
);
const OverviewTotal = lazy(
  () => import("@/features/exchange/components/OverviewTotal")
);
const ExchangeDepositWithdraw = lazy(
  () => import("@/features/exchange/components/ExchangeDepositWithdraw")
);
const ActionPanel = lazy(
  () => import("@/features/exchange/components/ActionPanel")
);
const TransactionTypePanel = lazy(
  () => import("@/features/exchange/components/TransactionTypePanel")
);

const ExchangeLayout = () => {
  const [selectedAction, setSelectedAction] = useState<
    "deposit" | "withdraw" | null
  >(null);
  const [selectedType, setSelectedType] = useState<"crypto" | "forex">(
    "crypto"
  );

  const dispatch = useDispatch<AppDispatch>();
  const { statistics } = useSelector((state: RootState) => state.exchange);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // ✅ Data fetching moved to ExchangeDataProvider (parent component)
  // This eliminates duplicate API calls and improves performance
  // useEffect(() => {
  //   dispatch(getFavoriteAssets());
  //   dispatch(fetchExchangeStatistics());
  // }, []);

  useEffect(() => {
    const profile = storage.getProfile();
    if (profile?.user) {
      setCurrentUser(profile.user);
    }
  }, []);

  return (
    <ExchangeDataProvider>
      <div className="w-full px-4 sm:px-0">
        {selectedAction ? (
          <div className="grid grid-cols-1 gap-4 lg:gap-6">
            <div className="w-full">
              <Suspense
                fallback={
                  <div className="text-center text-white">
                    <CardSkeleton />
                  </div>
                }
              >
                <TransactionTypePanel
                  selectedAction={selectedAction}
                  selectedType={selectedType}
                  onTypeChange={setSelectedType}
                  onBack={() => setSelectedAction(null)}
                  onActionChange={setSelectedAction}
                />
              </Suspense>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Left/Main Section */}
            <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-6">
              <Suspense fallback={<UserProfileSkeleton />}>
                <UserProfileCard
                  name={currentUser?.first_name || ""}
                  userId={currentUser?.user_id || ""}
                  userType={currentUser?.user_type || ""}
                  profileImage=""
                />
              </Suspense>
              <Suspense fallback={<CardSkeleton />}>
                <FavouriteAssets />
              </Suspense>
              <Suspense fallback={<ChartSkeleton height="h-64" />}>
                <TransactionOverview />
              </Suspense>
              <Suspense fallback={<TableSkeleton />}>
                <TransactionHistoryTable />
              </Suspense>
            </div>
            {/* Right/Sidebar Section */}
            <div className="flex flex-col gap-4 lg:gap-6">
              <Suspense fallback={<CardSkeleton />}>
                <ActionPanel
                  selectedAction={selectedAction}
                  selectedType={selectedType}
                  onActionChange={setSelectedAction}
                  onTypeChange={setSelectedType}
                />
              </Suspense>
              <Suspense fallback={<CardSkeleton />}>
                <OverviewTotal
                  total={statistics?.total_approved_volume || statistics?.total_approved_exchange_combined || 0}
                  deposits={statistics?.total_approved_exchange_deposits || 0}
                  withdrawals={
                    statistics?.total_approved_exchange_withdrawals || 0
                  }
                  inProgress={
                    (statistics?.total_pending_exchange_deposits || 0) +
                    (statistics?.total_pending_exchange_withdrawals || 0)
                  }
                  exchange={statistics?.total_approved_exchange_net || statistics?.total_approved_exchange_combined || 0}
                />
              </Suspense>
              <Suspense fallback={<CardSkeleton />}>
                <ExchangeDepositWithdraw
                  title="Exchange Deposit"
                  total={
                    (statistics?.total_approved_exchange_deposits || 0) +
                    (statistics?.total_pending_exchange_deposits || 0)
                  }
                  completed={statistics?.total_approved_exchange_deposits || 0}
                  inEscrow={statistics?.total_pending_exchange_deposits || 0}
                  color="primary"
                />
              </Suspense>
              <Suspense
                fallback={
                  <div className="text-center text-white">
                    <CardSkeleton />
                  </div>
                }
              >
                <ExchangeDepositWithdraw
                  title="Exchange Withdraw"
                  total={
                    (statistics?.total_approved_exchange_withdrawals || 0) +
                    (statistics?.total_pending_exchange_withdrawals || 0)
                  }
                  completed={
                    statistics?.total_approved_exchange_withdrawals || 0
                  }
                  inEscrow={statistics?.total_pending_exchange_withdrawals || 0}
                  color="secondary"
                />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </ExchangeDataProvider>
  );
};

export default ExchangeLayout;
