import React, { useEffect } from "react";
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

interface Wallet {
  currency: string;
  balance: string;
}

const formatBalance = (value: number, isUsdt: boolean = false) => {
  if (isUsdt) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const P2pWallet = ({
  isOpenForm,
  setIsOpenForm,
}: {
  isOpenForm: string;
  setIsOpenForm: (isOpenForm: string) => void;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { data: wallets = [], loading } = useSelector(
    (state: RootState) => state.wallets
  );
  const { data: matchedTrades, loading: matchedTradesLoading } = useSelector(
    (state: RootState) => state.matchedTrades
  );

  const transactionSummaryState = useSelector(
    (state: RootState) => state.transactionSummary
  );
  const summary = transactionSummaryState.summary;
  const summaryLoading = transactionSummaryState.loading;
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWallets());
      dispatch(fetchMatchedTrades(1));
      dispatch(fetchTransactionSummary())
    }
  }, [dispatch, isAuthenticated]);

  // Find USDT wallet with null check
  const usdtWallet = Array.isArray(wallets)
    ? wallets.find((wallet: Wallet) => wallet.currency === "USDT")
    : null;
  // const balance = usdtWallet ? toNumber(usdtWallet.balance) : 0;
  const balance = summary && summary.total_approved_p2p_combined
  const usdValue = balance;

  return (
    <div>
      <p
        className={`text-sm font-medium dark:text-[${tokens.colors.dark.textTitle}] text-black mb-1`}
      >
        P2P Balance
      </p>
      <Card
        borderColor={`border-[${tokens.colors.dark.border}]`}
        width="w-full"
        bgColor={`bg-[${tokens.colors.dark.card}]`}
        borderRadius="rounded-[24px]"
        className="p-0 mb-2 shadow-none dark:bg-[#18181D] bg-white"
      >
        <div className="flex flex-col gap-3 pl-4 py-2 px-2">
          <div className="flex flex-wrap justify-between items-center w-full">
            <div className="flex flex-col gap-2">
              <p
                className={`text-sm font-medium opacity-70 dark:text-[${tokens.colors.dark.textBody}] text-gray-600`}
              >
                Balance
              </p>
              <div className="flex flex-wrap items-baseline gap-2">
                <span
                  className={`text-lg font-bold dark:text-[${tokens.colors.dark.textTitle}] text-gray-900`}
                >
                  {`${formatBalance(balance ?? 0, true)} USDT`}
                </span>
                <span
                  className={`text-base font-semibold dark:text-[${tokens.colors.dark.textBody}] text-gray-600 opacity-80 flex items-center`}
                >
                  <span className="mx-1 opacity-50 text-lg">≈</span>
                  {loading ? "..." : formatBalance(usdValue ?? 0)}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setIsOpenForm("deposit")}
                width={120}
                height={35}
                borderRadius={24}
                variant={isOpenForm === "deposit" ? "primary" : "outline"}
                borderColor={tokens.colors.brand.primary}
                size="md"
                className={`transition-all duration-150 flex items-center gap-2 ${
                  isOpenForm === "deposit"
                    ? "bg-[" + tokens.colors.brand.primary + "] text-white"
                    : "bg-transparent text-[" +
                      tokens.colors.brand.primary +
                      "]"
                }`}
                icon={
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="text-white"
                  >
                  <path d="M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5"/>
                  <path d="m16 19 3 3 3-3"/>
                  <path d="M18 12h.01"/><path d="M19 16v6"/>
                  <path d="M6 12h.01"/>
                  <circle cx="12" cy="12" r="2"/>
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
                className={`transition-all duration-150 flex items-center gap-2 ${
                  isOpenForm === "withdraw"
                    ? "bg-[" + tokens.colors.brand.secondary + "] text-white"
                    : "bg-transparent text-[" +
                      tokens.colors.brand.secondary +
                      "]"
                }`}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="text-white"
                  >
                  <path d="M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5"/>
                  <path d="M18 12h.01"/><path d="M19 22v-6"/><path d="m22 19-3-3-3 3"/>
                  <path d="M6 12h.01"/><circle cx="12" cy="12" r="2"/>
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
};

export default P2pWallet;
