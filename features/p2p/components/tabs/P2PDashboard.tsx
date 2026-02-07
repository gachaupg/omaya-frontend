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
import { usePendingTotal } from "@/utils/pending";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../store";

const P2PDashboard = () => {
  const [isOpenForm, setIsOpenForm] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  useEffect(() => {
    if (isAuthenticated) {
      // Use catch to prevent errors from crashing the app
      dispatch(fetchWallets()).catch(() => {
        // Silently handle errors - wallet slice will set safe defaults
      });
      dispatch(fetchMatchedTrades(1)).catch(() => {
        // Silently handle errors
      });
      dispatch(fetchTransactionSummary()).catch(() => {
        // Silently handle errors
      });
    }
  }, [dispatch, isAuthenticated]);

  // Get available balance from usePendingTotal (matches Available.tsx - balance minus escrow/locked)
  const { availableBalance } = usePendingTotal();

  return (
    <div className="flex flex-col gap-4">
      <UserCard />
      <div className="flex flex-col lg:flex-row  gap-4">
        {(isOpenForm === "deposit" || isOpenForm === "withdraw") ? (
          <div className="w-full">
            <P2pWallet isOpenForm={isOpenForm} setIsOpenForm={setIsOpenForm} />
            {isOpenForm === "deposit" && (
              <Express
                mode="deposit"
                balance={availableBalance}
                skipAmountValidation={true}
                onCancel={() => setIsOpenForm("")}
              />
            )}
            {isOpenForm === "withdraw" && (
              <Express
                balance={availableBalance}
                mode="withdrawal"
                onCancel={() => setIsOpenForm("")}
              />
            )}
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
