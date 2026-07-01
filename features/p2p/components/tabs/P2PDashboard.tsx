"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import P2PCharts from "../ui/p2pdashboard/P2PCharts";
import Overview from "../ui/p2pdashboard/Overview";
import P2pWallet from "../ui/p2pdashboard/P2pWallet";
import UserCard from "../ui/p2pdashboard/UserCard";
import Express from "../ui/express/components/express";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { selectP2PWalletAmounts, selectTransactionSummary } from "../../selectors";
import {
  P2PWalletBalanceProvider,
  useP2PWalletBalanceContext,
} from "@/features/p2p/context/P2PWalletBalanceProvider";
import { useSidebarSectionReset } from "@/lib/utils/sidebarNavigationReset";
import { fetchAllUserTradesPages } from "@/features/p2p/utils/fetchAllUserTradesPages";
import type { UserTrade } from "@/features/p2p/types";
import type { P2PChartTimeFilter } from "@/features/p2p/utils/p2pTradeChartAggregation";

const P2P_EXPRESS_STATE_KEY = "omaya_p2p_express_state";
const RETURNING_FROM_LEGAL_KEY = "omaya_returning_from_legal";

function P2PDashboardContent() {
  const [isOpenForm, setIsOpenForm] = useState("");
  const wsWallet = useP2PWalletBalanceContext();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [allTrades, setAllTrades] = useState<UserTrade[]>([]);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [chartTimeFilter, setChartTimeFilter] =
    useState<P2PChartTimeFilter>("All Time");
  const tradesFetchStartedRef = useRef(false);

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

  const handleSidebarReset = useCallback(() => {
    setIsOpenForm("");
  }, []);

  useSidebarSectionReset("p2p", handleSidebarReset);

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

  const summary = useSelector(selectTransactionSummary);
  const { availableAmount } = useSelector(selectP2PWalletAmounts);
  const availableBalance =
    wsWallet.available ?? (summary != null ? availableAmount : 0);

  useEffect(() => {
    if (!isAuthenticated) {
      setTradesLoading(false);
      return;
    }
    if (tradesFetchStartedRef.current) return;
    tradesFetchStartedRef.current = true;
    setTradesLoading(true);
    fetchAllUserTradesPages({ fetchAll: true })
      .then((rows) => setAllTrades(rows as UserTrade[]))
      .catch(() => {
        // Overview/chart fall back to summary API when trades fail to load.
      })
      .finally(() => setTradesLoading(false));
  }, [isAuthenticated]);

  return (
    <div className="flex flex-col gap-4">
      <UserCard />
      <div className="flex flex-col lg:flex-row  gap-4">
        {isOpenForm === "deposit" || isOpenForm === "withdraw" ? (
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
                  <P2PCharts
                    chartTrades={allTrades}
                    tradesLoading={tradesLoading}
                    chartTimeFilter={chartTimeFilter}
                    onChartTimeFilterChange={setChartTimeFilter}
                  />
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
}

const P2PDashboard = () => (
  <P2PWalletBalanceProvider>
    <P2PDashboardContent />
  </P2PWalletBalanceProvider>
);

export default P2PDashboard;
