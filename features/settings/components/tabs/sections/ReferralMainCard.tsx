import React from "react";
import Button from "@/components/ui/Button";
import CopyButton from "@/components/ui/CopyButton";
import { QrCode } from "lucide-react";
import { DonutChartWithCenter } from "@/components/ui/DonutChartWithCenter";

interface ReferralMainCardProps {
  user: any;
  walletData: any;
  walletLoading: boolean;
  walletError: any;
  setShowWithdrawPage: (show: boolean) => void;
}

const ReferralMainCard: React.FC<ReferralMainCardProps> = ({
  user,
  walletData,
  walletLoading,
  walletError,
  setShowWithdrawPage,
}) => {
  return (
    <div className="w-full rounded-2xl bg-[#23232B] p-3 flex flex-col lg:flex-row gap-4 mb-4 shadow-lg border border-[#35353F]">
      {/* Left: Info */}
      <div className="flex-1 flex flex-col justify-between gap-4">
        <div>
          <p className="text-[#A3A3A3] mb-2 text-sm leading-relaxed break-words">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud.
          </p>
          <p className="text-[#A3A3A3] mb-2 text-sm leading-relaxed break-words">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud.
          </p>
          <p className="text-[#A3A3A3] mb-4 text-sm leading-relaxed break-words">
            Do eiusmod tempor incididunt ut labore
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          className="w-full bg-[#EF4444] hover:bg-[#d32f2f] text-white flex items-center justify-center gap-2 text-sm font-semibold rounded-xl py-2 mb-2"
          onClick={() => setShowWithdrawPage(true)}
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="mr-2"
          >
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <path d="M8 12h8M12 8v8" />
          </svg>
          Withdraw
        </Button>
        <div className="mt-2">
          <div className="text-[#1D8751] text-sm mb-1 font-medium">
            Your Referral Code
          </div>
          <div className="flex items-center gap-2 w-full justify-between rounded-lg px-3 py-2 border border-[#1D8751] overflow-hidden">
            <span className="w-3 h-3 rounded-full bg-[#1D8751] mr-2 flex-shrink-0"></span>
            <span className="text-[#1D8751] font-mono text-sm sm:text-base tracking-widest mr-2 truncate">
              {user?.referral_code}
            </span>
            <span className="text-[#1D8751] mr-2 flex-shrink-0">
              <QrCode size={18} />
            </span>
            <CopyButton
              value={user?.referral_code || ""}
              className="text-[#1D8751] hover:text-white px-2 py-1 rounded-[18px] transition-colors border border-[#22c55e] bg-transparent text-sm flex-shrink-0"
              showIcon={false}
            >
              Copy
            </CopyButton>
          </div>
        </div>
      </div>
      {/* Right: Chart */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[370px] rounded-2xl border border-[#35353F] px-4 sm:px-6 py-4 relative">
          {/* Wallet Stats */}
          <div className="flex flex-col gap-4">
            {walletError ? (
              <div className="text-[#EF4444] text-center">
                Failed to load wallet data
              </div>
            ) : (
              <>
                {walletLoading ? (
                  <div className="text-[#A3A3A3] text-center">Loading...</div>
                ) : (
                  <>
                    {/* Donut Chart */}
                    {(() => {
                      const deposits = walletData?.total_earned || 0;
                      const withdrawals = walletData?.total_withdrawn || 0;
                      const total = deposits + withdrawals;
                      const chartData =
                        total === 0
                          ? [
                              {
                                label: "No Data",
                                value: 0,
                                color: "#35353F",
                              },
                            ]
                          : [
                              {
                                label: "Income from deposits",
                                value: deposits,
                                color: "#1D8751",
                              },
                              {
                                label: "Income from withdrawals",
                                value: withdrawals,
                                color: "#EF4444",
                              },
                            ];
                      return (
                        <div className="flex flex-col items-center mb-4">
                          <DonutChartWithCenter
                            data={chartData}
                            total={total}
                            label="Commissions"
                          />
                          {/* Legend */}
                          <div className="flex flex-col gap-2 mt-4 w-full">
                            {total === 0 ? (
                              <>
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="w-4 h-4 rounded bg-[#35353F] inline-block flex-shrink-0"></span>
                                    <span className="text-[#A3A3A3] text-xs sm:text-sm truncate">
                                      Income from deposits
                                    </span>
                                  </div>
                                  <span className="text-[#A3A3A3] text-sm sm:text-base font-semibold ml-2 flex-shrink-0">
                                    0 USD
                                  </span>
                                </div>
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="w-4 h-4 rounded bg-[#35353F] inline-block flex-shrink-0"></span>
                                    <span className="text-[#A3A3A3] text-xs sm:text-sm truncate">
                                      Income from withdrawals
                                    </span>
                                  </div>
                                  <span className="text-[#A3A3A3] text-sm sm:text-base font-semibold ml-2 flex-shrink-0">
                                    0 USD
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="w-4 h-4 rounded bg-[#1D8751] inline-block flex-shrink-0"></span>
                                    <span className="text-[#A3A3A3] text-xs sm:text-sm truncate">
                                      Income from deposits
                                    </span>
                                  </div>
                                  <span className="text-white text-sm sm:text-base font-semibold ml-2 flex-shrink-0">
                                    {deposits.toLocaleString()} USD
                                  </span>
                                </div>
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="w-4 h-4 rounded bg-[#EF4444] inline-block flex-shrink-0"></span>
                                    <span className="text-[#A3A3A3] text-xs sm:text-sm truncate">
                                      Income from withdrawals
                                    </span>
                                  </div>
                                  <span className="text-white text-sm sm:text-base font-semibold ml-2 flex-shrink-0">
                                    {withdrawals.toLocaleString()} USD
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    {/* End Donut Chart */}
                    <div className="flex items-center justify-between">
                      <span className="text-[#A3A3A3] text-sm sm:text-base">
                        Total Earned
                      </span>
                      <span className="text-white font-semibold text-base sm:text-lg">
                        {`${
                          walletData?.total_earned?.toFixed(2) || "0.00"
                        } USD`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#A3A3A3] text-sm sm:text-base">
                        Total Withdrawn
                      </span>
                      <span className="text-white font-semibold text-base sm:text-lg">
                        {`${
                          walletData?.total_withdrawn?.toFixed(2) || "0.00"
                        } USD`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#A3A3A3] text-sm sm:text-base">
                        Available Balance
                      </span>
                      <span className="text-[#1D8751] font-semibold text-base sm:text-lg">
                        {`${walletData?.balance?.toFixed(2) || "0.00"} USD`}
                      </span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralMainCard;
