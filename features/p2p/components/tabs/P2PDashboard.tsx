"use client";

import React, { useState, useEffect } from "react";
import { tokens } from "@/styles/tokens";
import Card from "../Common/Card";
import Available from "../ui/p2pdashboard/Available";
import P2PCharts from "../ui/p2pdashboard/P2PCharts";
import Overview from "../ui/p2pdashboard/Overview";
import P2pWallet from "../ui/p2pdashboard/P2pWallet";
import UserCard from "../ui/p2pdashboard/UserCard";
import Deposit from "../ui/p2pdashboard/sections/Deposit";
import Withdraw from "../ui/p2pdashboard/sections/Withdraw";
import Express from "../ui/express/components/express";
import { useSelector } from "react-redux";
import { RootState } from "../../../../store";
import { fetchWallets } from "../../slices/walletSlice";
import { fetchMatchedTrades } from "../../slices/matchedTradesSlice";
import { fetchTransactionSummary } from "../../slices/transactionSummarySlice";
import { toNumber } from "lodash";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../store";

const P2PDashboard = () => {
  const [isOpenForm, setIsOpenForm] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const { data: wallets } = useSelector((state: RootState) => state.wallets);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWallets());
      dispatch(fetchMatchedTrades(1));
      dispatch(fetchTransactionSummary())
    }
  }, [dispatch, isAuthenticated]);

  // Get balance from wallet response - try multiple sources
  const totalBalance = wallets?.total_balance ? toNumber(wallets.total_balance) : 0;
  const walletBalance = wallets?.wallet?.balance ? parseFloat(wallets.wallet.balance) : 0;
  
  // For USDT wallets, prioritize the individual wallet balance
  // This handles cases where total_balance might not be accurate
  const isUSDTWallet = wallets?.wallet?.currency === "USDT";
  const balance = isUSDTWallet && walletBalance > 0 ? walletBalance : 
                  (totalBalance && !isNaN(totalBalance) && totalBalance > 0) ? totalBalance : walletBalance;
  
  // Debug logging for balance
  console.log("P2PDashboard - wallets:", wallets);
  console.log("P2PDashboard - total_balance:", wallets?.total_balance);
  console.log("P2PDashboard - wallet.balance:", wallets?.wallet?.balance);
  console.log("P2PDashboard - wallet.currency:", wallets?.wallet?.currency);
  console.log("P2PDashboard - totalBalance (toNumber):", totalBalance);
  console.log("P2PDashboard - walletBalance (parseFloat):", walletBalance);
  console.log("P2PDashboard - isUSDTWallet:", isUSDTWallet);
  console.log("P2PDashboard - final calculated balance:", balance);
  
  return (
    <div className="flex flex-col gap-4">
      <UserCard />
      <div className="flex flex-col lg:flex-row  gap-4">
        {(isOpenForm === "deposit" || isOpenForm === "withdraw") ? (
          <div className="w-full">
            <P2pWallet isOpenForm={isOpenForm} setIsOpenForm={setIsOpenForm} />
            {isOpenForm === "deposit" && <Express mode="deposit" balance={balance} skipAmountValidation={true} />}
            {isOpenForm === "withdraw" && <Express balance={balance} mode="withdrawal" />}
          </div>
        ) : (
          <>
            <div className="w-full lg:w-[70%] lg:flex-1">
              <P2pWallet isOpenForm={isOpenForm} setIsOpenForm={setIsOpenForm} />
              {isOpenForm === "" && (
                <>
                  {" "}
                  <Available />
                  <P2PCharts />
                </>
              )}
            </div>
            {isOpenForm === "" && (
              <div className="w-full lg:w-[28%] lg:flex-shrink-0">
                <Overview />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default P2PDashboard;
