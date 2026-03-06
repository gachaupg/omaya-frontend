"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../../store";
import { fetchWallets } from "../../slices/walletSlice";
import { fetchMatchedTrades } from "../../slices/matchedTradesSlice";
import { fetchTransactionSummary } from "../../slices/transactionSummarySlice";
import { selectP2PWalletAmounts, selectTransactionSummary } from "../../selectors";
import { AppDispatch } from "../../../../store";

const P2P_EXPRESS_STATE_KEY = "omaya_p2p_express_state";
const RETURNING_FROM_LEGAL_KEY = "omaya_returning_from_legal";

const P2PDashboard = () => {
  const [isOpenForm, setIsOpenForm] = useState("");
  const dispatch = useDispatch<AppDispatch>();

  const handleBeforeLegalNavigate = useCallback(() => {
    try {
      sessionStorage.setItem(
        P2P_EXPRESS_STATE_KEY,
        JSON.stringify({ isOpenForm })
      );
      sessionStorage.setItem(RETURNING_FROM_LEGAL_KEY, "1");
    } catch {
      // Ignore storage errors
    }
  }, [isOpenForm]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const returning = sessionStorage.getItem(RETURNING_FROM_LEGAL_KEY);
      if (!returning) return;

      const saved = sessionStorage.getItem(P2P_EXPRESS_STATE_KEY);
      if (!saved) {
        sessionStorage.removeItem(RETURNING_FROM_LEGAL_KEY);
        return;
      }

      const { isOpenForm: savedForm } = JSON.parse(saved);
      if (savedForm === "deposit" || savedForm === "withdraw") {
        setIsOpenForm(savedForm);
      }

      sessionStorage.removeItem(RETURNING_FROM_LEGAL_KEY);
      sessionStorage.removeItem(P2P_EXPRESS_STATE_KEY);
    } catch {
      sessionStorage.removeItem(RETURNING_FROM_LEGAL_KEY);
      sessionStorage.removeItem(P2P_EXPRESS_STATE_KEY);
    }
  }, []);
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

  // Available and escrow from transaction summary API when loaded
  const summary = useSelector(selectTransactionSummary);
  const { availableAmount, escrow } = useSelector(selectP2PWalletAmounts);
  const availableBalance = summary != null ? availableAmount : 0;

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
                onBeforeLegalNavigate={handleBeforeLegalNavigate}
              />
            )}
            {isOpenForm === "withdraw" && (
              <Express
                balance={availableBalance}
                mode="withdrawal"
                onCancel={() => setIsOpenForm("")}
                onBeforeLegalNavigate={handleBeforeLegalNavigate}
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
