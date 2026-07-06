"use client";

import React from "react";
import { DollarSign, Users, TrendingUp, Shield, Globe } from "lucide-react";
import { GoDotFill } from "react-icons/go";
import { useMarketingI18n } from "@/lib/useMarketingI18n";

/** Home Key Achievements — values are fixed in code (not from API). */
const HOME_STATS = {
  volume: { amount: 100_000_000, suffix: "+" },
  clients: { amount: 50_000, suffix: "+" },
  transactions: { amount: 300_000, suffix: "+" },
  years: { amount: 8, suffix: "" },
} as const;

function formatAchievementValue(
  amount: number,
  suffix = "",
  options?: { compactMillions?: boolean }
): string {
  if (options?.compactMillions && amount >= 1_000_000) {
    const n = amount / 1_000_000;
    const label = Number.isInteger(n) ? String(n) : parseFloat(n.toFixed(1)).toString();
    return `${label}M${suffix}`;
  }
  return `${amount.toLocaleString("en-US")}${suffix}`;
}

export default function KeyAchievementsSection() {
  const { t } = useMarketingI18n();

  return (
    <div
      id="key-achievements"
      data-stats-version="2026-07-06-fee"
      className="pt-4 sm:pt-6 md:pt-8 pb-12 sm:pb-16 md:pb-20 px-4 md:px-10 lg:px-16 xl:px-[100px] bg-white dark:bg-(--card-color) relative z-10 overflow-hidden"
    >
      <div className="absolute top-0 left-90 w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] bg-[#1D8751]/10 blur-3xl rounded-full hidden sm:block pointer-events-none" aria-hidden />

      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-1 hidden sm:block" aria-hidden>
        <div className="absolute w-[280px] sm:w-[300px] h-[600px] right-90 bottom-25 sm:h-24 blur-3xl bg-[#9810FA] rounded-full opacity-15" />
      </div>

      <div className="container mx-auto max-w-6xl 2xl:max-w-screen-2xl">
        <div className="flex justify-center mb-4 sm:mb-6">
          <span className=" flex justify-center items-center gap-1 bg-[#1D8751]/10 border-2 border-secondary/20 text-secondary/60 px-4 py-1.5 sm:px-5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold">
            <GoDotFill className="text-secondary text-lg" />
            {t("marketing.trusted.badge", "Trusted by Thousands")}
          </span>
        </div>

        <div className="mx-auto mb-8 sm:mb-10 md:mb-12 max-w-5xl px-2">
          
          <div className="relative flex justify-center mb-3 sm:mb-4">
            <h2 className="text-center text-xl sm:text-2xl md:text-3xl lg:text-4xl 2xl:text-5xl font-bold">
              <span className="text-gray-900 dark:text-white">
                {t("marketing.achievements.title.leading", "Celebrating Success:")}{" "}
                <span className="text-secondary">
                  {t("marketing.achievements.title.highlight", "Key Achievements")}
                </span>
              </span>
            </h2>
          </div>

          <p className="text-center text-[#99A1AF] text-sm sm:text-base md:text-lg px-4">
            {t(
              "marketing.achievements.subtitle",
              "Join the fastest-growing crypto exchange platform in Somalia."
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8 md:mb-10 max-w-7xl mx-auto">
          <AchievementCard
            icon={DollarSign}
            value={formatAchievementValue(
              HOME_STATS.volume.amount,
              HOME_STATS.volume.suffix,
              { compactMillions: true }
            )}
            title={t("marketing.achievements.card1.title", "USD Fiat Transactions")}
            description={t("marketing.achievements.card1.desc", "Total Trading Volume")}
          />
          <AchievementCard
            icon={Users}
            value={formatAchievementValue(
              HOME_STATS.clients.amount,
              HOME_STATS.clients.suffix
            )}
            title={t("marketing.achievements.card2.title", "Satisfied Users")}
            description={t(
              "marketing.achievements.card2.desc",
              "Active traders worldwide."
            )}
          />
          <AchievementCard
            icon={TrendingUp}
            value={formatAchievementValue(
              HOME_STATS.transactions.amount,
              HOME_STATS.transactions.suffix
            )}
            title={t(
              "marketing.achievements.card3.title",
              "Completed Total Trades"
            )}
            description={t(
              "marketing.achievements.card3.desc",
              "All-time completed transactions."
            )}
          />
          <AchievementCard
            icon={Shield}
            value={formatAchievementValue(
              HOME_STATS.years.amount,
              HOME_STATS.years.suffix
            )}
            title={t("marketing.achievements.card4.title", "Years Of Experience")}
            description={t(
              "marketing.achievements.card4.desc",
              "Industry leadership."
            )}
          />
        </div>

        <div className="relative mt-6 sm:mt-8 md:mt-10 max-w-7xl mx-auto">
          <div className="bg-gray-100 dark:bg-[#1D8751]/7 rounded-2xl p-4 md:p-6 border border-border dark:border-[#1D8751]/10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              <div className="flex flex-col items-center justify-center py-2">
                <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-linear-to-br from-orange-400 to-orange-500 flex items-center justify-center mb-3 shadow-lg">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <span className="text-gray-900 dark:text-white text-xs sm:text-sm md:text-base font-medium text-center">
                  Lowest Exchange Fee
                </span>
              </div>

              <div className="flex flex-col items-center justify-center py-2">
                <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-linear-to-br from-[#1D8751] to-[#13B562] flex items-center justify-center mb-3 shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-gray-900 dark:text-white text-xs sm:text-sm md:text-base font-medium text-center">
                  Bank-Grade Security
                </span>
              </div>

              <div className="flex flex-col items-center justify-center py-2">
                <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-linear-to-br from-pink-400 to-pink-500 flex items-center justify-center mb-3 shadow-lg">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <span className="text-gray-900 dark:text-white text-xs sm:text-sm md:text-base font-medium text-center">
                  24/7 Support
                </span>
              </div>

              <div className="flex flex-col items-center justify-center py-2">
                <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-linear-to-br from-[#1D8751] to-[#13B562] flex items-center justify-center mb-3 shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-gray-900 dark:text-white text-xs sm:text-sm md:text-base font-medium text-center">
                  Real-Time Charts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AchievementCard({
  icon: Icon,
  value,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-50 dark:bg-[#141419] sm:dark:bg-white/2 rounded-lg sm:rounded-3xl p-4 sm:p-5 md:p-6 flex flex-col relative overflow-hidden isolate border border-gray-200 dark:border-white/10 marketing-step-card">
      <div className="absolute inset-0 bg-linear-to-b from-white/5 via-white/2 to-transparent pointer-events-none rounded-lg sm:rounded-3xl hidden sm:block" />
      <div className="absolute top-2 right-7 w-25 h-25 bg-[#1D8751] opacity-45 blur-3xl rounded-full pointer-events-none hidden sm:block" aria-hidden />

      <div className="relative z-10 flex flex-col">
        <div className="relative mb-3 sm:mb-4 self-start">
          <div
            className="bg-[#1D8751] rounded-xl p-2 sm:p-2.5 md:p-3 flex items-center justify-center shadow-md"
            style={{ boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)" }}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
        </div>

        <div className="text-[#1D8751] text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3">
          {value}
        </div>

        <div className="text-gray-900 dark:text-muted text-sm sm:text-base md:text-lg mb-1 sm:mb-2">
          {title}
        </div>

        <div className="text-gray-700 dark:text-[#99A1AF] text-xs sm:text-sm">
          {description}
        </div>
      </div>
    </div>
  );
}
