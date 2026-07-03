/** @jsxImportSource react */
import React, { memo } from "react";
import { tokens } from "@/styles/tokens";
import Card from "../../Common/Card";
import Button from "../../Common/Button";
import { useSelector } from "react-redux";
import { formatCurrency } from "@/lib/globalFormatter";
import {
  selectWalletBalance,
  selectP2PWalletAmounts,
  selectTransactionSummary,
} from "@/features/p2p/selectors";
import { useP2PWalletBalanceContext } from "@/features/p2p/context/P2PWalletBalanceProvider";
import { getP2PEscrowDisplay } from "@/features/p2p/walletAmounts";

import { logger } from "@/lib/utils/logger";

const USDT_ICON = "/images/tether.svg";

const P2pWallet = memo(
  ({
    isOpenForm,
    setIsOpenForm,
  }: {
    isOpenForm: string;
    setIsOpenForm: (isOpenForm: string) => void;
  }) => {
    const { balance: walletBalance, currency, loading } = useSelector(selectWalletBalance);
    const summary = useSelector(selectTransactionSummary);
    const { balance: summaryBalance, availableAmount } =
      useSelector(selectP2PWalletAmounts);

    const wsWallet = useP2PWalletBalanceContext();

    const balance =
      wsWallet.balance ?? (summary != null ? summaryBalance : walletBalance);

    const availableDisplay =
      wsWallet.available ?? (summary != null ? availableAmount : 0);
    const escrowDisplay = getP2PEscrowDisplay(
      wsWallet.escrow,
      wsWallet.overviewSummary ?? summary
    );

    const displayCurrency =
      (wsWallet.currency && wsWallet.currency.trim()) ||
      currency ||
      "USDT";

    logger.debug("p2p", "P2pWallet render", {
      balance,
      availableDisplay,
      escrowDisplay,
      loading,
    });

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
          borderColor="border-border dark:border-accent"
          width="w-full"
          bgColor="bg-transparent"
          borderRadius="rounded-[24px]"
          className="p-0 mb-2 shadow-none dark:bg-[#18181D] bg-white border "
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
                    {formatCurrency(balance ?? 0, displayCurrency)}
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

            {/* Asset breakdown — WebSocket-first (same source as balance), REST summary as fallback */}
            <div
              className="mt-1 rounded-2xl border dark:border-[#35353E] border-gray-200 overflow-hidden"
              aria-label="P2P wallet balances by asset"
            >
              <div className="grid grid-cols-3 px-3 sm:px-4 py-2 dark:bg-[#35353E]/80 bg-gray-50">
                <div className="text-xs sm:text-sm dark:text-[#788099] text-gray-600 font-medium">
                  Asset
                </div>
                <div className="text-xs sm:text-sm text-center dark:text-[#788099] text-gray-600 font-medium">
                  Available
                </div>
                <div className="text-xs sm:text-sm text-center dark:text-[#788099] text-gray-600 font-medium whitespace-normal leading-tight">
                  In Escrow / Locked
                </div>
              </div>
              <div className="grid grid-cols-3 px-3 sm:px-4 py-3 sm:py-3.5 bg-transparent">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <img
                    src={USDT_ICON}
                    alt="USDT"
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
                      {displayCurrency}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-600 dark:text-[#788099] mt-0.5 truncate">
                      Tether USD
                    </div>
                  </div>
                </div>
                <div className="text-center self-center text-sm sm:text-base text-gray-900 dark:text-white font-medium tabular-nums">
                  {formatCurrency(availableDisplay, displayCurrency)}
                </div>
                <div className="text-center self-center text-sm sm:text-base text-gray-900 dark:text-white font-medium tabular-nums">
                  {formatCurrency(escrowDisplay, displayCurrency)}
                </div>
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
