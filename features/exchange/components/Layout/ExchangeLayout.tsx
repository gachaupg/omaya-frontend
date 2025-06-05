"use client";
import React, { useState } from "react";
import UserProfileCard from "@/features/exchange/components/UserProfileCard";
import FavouriteAssets from "@/features/exchange/components/FavouriteAssets";
import TransactionOverview from "@/features/exchange/components/TransactionOverviewChart";
import TransactionHistoryTable from "@/features/exchange/components/TransactionHistoryTable";
import OverviewTotal from "@/features/exchange/components/OverviewTotal";
import ExchangeDepositWithdraw from "@/features/exchange/components/ExchangeDepositWithdraw";
import ActionPanel from "@/features/exchange/components/ActionPanel";
import TransactionTypePanel from "@/features/exchange/components/TransactionTypePanel";
import {
  userInfo,
  favouriteAssets,
  transactionHistory,
  overviewTotal,
  exchangeDeposit,
  exchangeWithdraw,
} from "@/features/exchange/components/dummyData";

// Dummy forex brokers data
const forexBrokers = [
  {
    broker_id: "1",
    name: "FXTM",
    description: "ForexTime Broker",
    broker_image: "https://res.cloudinary.com/dam1sxczj/image/upload/v1749040264/ad8ca6c12336f925642e6fda58ff6c0e1c260143_wopd2d.jpg",
    price: 1.0,
    network: "MetaTrader",
    isFavourite: false,
  },
  {
    broker_id: "2",
    name: "IC Markets",
    description: "IC Markets Broker",
    broker_image: "https://res.cloudinary.com/dam1sxczj/image/upload/v1749040264/e53c0bce69341205e18912ed81dcbfceb41d296d_wjzuvi.png",
    price: 1.0,
    network: "MetaTrader",
    isFavourite: true,
  },
];

const ExchangeLayout = () => {
  const [selectedAction, setSelectedAction] = useState<"deposit" | "withdraw" | null>(null);
  const [selectedType, setSelectedType] = useState<"crypto" | "forex">("crypto");

  return (
    <div className="w-full px-4 sm:px-0 lg:px-8">
      {selectedAction ? (
        <div className="grid grid-cols-1 gap-4 lg:gap-6">
          <div className="w-full">
            <TransactionTypePanel
              selectedAction={selectedAction}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              assets={favouriteAssets}
              brokers={forexBrokers}
              onBack={() => setSelectedAction(null)}
              onActionChange={setSelectedAction}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Left/Main Section */}
          <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-6">
            <UserProfileCard {...userInfo} />
            <FavouriteAssets 
              assets={favouriteAssets.map(asset => ({
                id: asset.asset_id,
                name: asset.description,
                symbol: asset.symbol,
                image: asset.asset_image,
                price: asset.price,
                network: asset.network,
                isFavourite: asset.isFavourite,
                change: "0"
              }))} 
            />
            <TransactionOverview/>
            <TransactionHistoryTable transactions={transactionHistory} />
          </div>
          {/* Right/Sidebar Section */}
          <div className="flex flex-col gap-4 lg:gap-6">
            <ActionPanel
              selectedAction={selectedAction}
              selectedType={selectedType}
              onActionChange={setSelectedAction}
              onTypeChange={setSelectedType}
            />
            <OverviewTotal {...overviewTotal} />
            <ExchangeDepositWithdraw
              title="Exchange Deposit"
              total={exchangeDeposit.total}
              completed={exchangeDeposit.completed}
              inEscrow={exchangeDeposit.inEscrow}
              color="primary"
            />
            <ExchangeDepositWithdraw
              title="Exchange Withdraw"
              total={exchangeWithdraw.total}
              completed={exchangeWithdraw.completed}
              inEscrow={exchangeWithdraw.inEscrow}
              color="secondary"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangeLayout;
