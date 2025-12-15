/** @jsxImportSource react */
import React, { useEffect, memo } from "react";
import { tokens } from "@/styles/tokens";
import Card from "../../Common/Card";
import Button from "../../Common/Button";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { AppDispatch } from "@/store";
import { fetchWallets } from "@/features/p2p/slices/walletSlice";
import { fetchMatchedTrades } from "@/features/p2p/slices/matchedTradesSlice";
import { FinancialCalculator } from "@/lib/utils/financial";
import { toNumber } from "@/lib/finanacial";
import { fetchTransactionSummary } from "@/features/p2p/slices/transactionSummarySlice";
import { formatCurrency } from "@/lib/globalFormatter";
import { selectWalletBalance } from "@/features/p2p/selectors";

import { logger } from "@/lib/utils/logger";

interface Wallet {
  currency: string;
  balance: string;
}

const formatBalance = (value: number, isUsdt: boolean = false) => {
  if (isUsdt) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 12,
      maximumFractionDigits: 12,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 12,
    maximumFractionDigits: 12,
  }).format(value);
};

const P2pWallet = memo(
  ({
    isOpenForm,
    setIsOpenForm,
  }: {
    isOpenForm: string;
    setIsOpenForm: (isOpenForm: string) => void;
  }) => {
    const dispatch = useDispatch<AppDispatch>();

    // Use memoized selector for better performance
    const { balance, currency, loading } = useSelector(selectWalletBalance);
    const { data: matchedTrades, loading: matchedTradesLoading } = useSelector(
      (state: RootState) => state.matchedTrades
    );

    const transactionSummaryState = useSelector(
      (state: RootState) => state.transactionSummary
    );
    const summary = transactionSummaryState.summary;
    const summaryLoading = transactionSummaryState.loading;
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    logger.debug("p2p", "P2pWallet render", { balance, currency, loading });

    const usdValue = balance;

    const getTitle = () => {
      if (isOpenForm === "deposit") return "P2P Deposit";
      if (isOpenForm === "withdraw") return "P2P Withdrawal";
      return "P2P Wallet";
    };
    return (
      <div>
        <p className={`text-xl font-bold dark:text-white text-black mb-1`}>
          {getTitle()}
        </p>
        <Card
          borderColor="border-[#35353E]"
          width="w-full"
          bgColor="bg-transparent"
          borderRadius="rounded-[24px]"
          className="p-0 mb-2 shadow-none dark:bg-[#18181D] bg-white border border-[#35353E]"
        >
          <div className="flex flex-col gap-2 sm:gap-3 px-2 sm:px-3 md:px-4 py-2 sm:py-3">
            <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between items-start sm:items-center w-full gap-3">
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <p
                  className={`text-xs sm:text-sm font-medium opacity-70 dark:text-[${tokens.colors.dark.textBody}] text-gray-600`}
                >
                  Balance
                </p>
                <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                  <span
                    className={`text-base sm:text-lg font-bold dark:text-[${tokens.colors.dark.textTitle}] text-gray-900 truncate`}
                  >
                    {formatCurrency(balance ?? 0, "USDT")}
                  </span>
                  <span
                    className={`text-sm sm:text-base font-semibold dark:text-[${tokens.colors.dark.textBody}] text-gray-600 opacity-80 flex items-center`}
                  >
                    <span className="mx-0.5 sm:mx-1 opacity-50 text-base sm:text-lg">
                      ≈
                    </span>
                    {formatCurrency(balance ?? 0, "USD")}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                <Button
                  onClick={() => setIsOpenForm("deposit")}
                  width={120}
                  height={40}
                  borderRadius={24}
                  variant={isOpenForm === "deposit" ? "primary" : "outline"}
                  borderColor={tokens.colors.brand.primary}
                  size="md"
                  className={`transition-all duration-150 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm min-h-[44px] sm:min-h-[40px] px-3 sm:px-4 flex-1 sm:flex-initial justify-center ${
                    isOpenForm === "deposit"
                      ? "bg-[" + tokens.colors.brand.primary + "] text-white"
                      : "bg-transparent text-[" +
                        tokens.colors.brand.primary +
                        "]"
                  }`}
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={isOpenForm === "deposit" ? "white" : "#1D8751"}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 17L17 7" />
                      <path d="M7 7h10v10" />
                    </svg>
                  }
                >
                  <span
                    className={`font-medium ${
                      isOpenForm === "deposit"
                        ? "text-white"
                        : `text-[${tokens.colors.brand.primary}]`
                    }`}
                  >
                    Deposit
                  </span>
                </Button>

                <Button
                  onClick={() => setIsOpenForm("withdraw")}
                  width={120}
                  height={40}
                  borderRadius={24}
                  variant={isOpenForm === "withdraw" ? "secondary" : "outline"}
                  borderColor={tokens.colors.brand.secondary}
                  size="md"
                  className={`transition-all duration-150 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm min-h-[44px] sm:min-h-[40px] px-3 sm:px-4 flex-1 sm:flex-initial justify-center ${
                    isOpenForm === "withdraw"
                      ? "bg-[" + tokens.colors.brand.secondary + "] text-white"
                      : "bg-transparent text-[" +
                        tokens.colors.brand.secondary +
                        "]"
                  }`}
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={isOpenForm === "withdraw" ? "white" : "#E23D3A"}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 7L7 17" />
                      <path d="M17 17H7V7" />
                    </svg>
                  }
                >
                  <span
                    className={`font-medium ${
                      isOpenForm === "withdraw"
                        ? "text-white"
                        : `text-[${tokens.colors.brand.secondary}]`
                    }`}
                  >
                    Withdraw
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }
);

P2pWallet.displayName = "P2pWallet";

export default P2pWallet;
