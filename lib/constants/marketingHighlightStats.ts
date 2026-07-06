/** Canonical home/marketing highlight statistics (Key Achievements section). */
export const MARKETING_HIGHLIGHT_STATS = {
  total_transactions_usdt: "6M",
  satisfied_clients: "169",
  successful_transactions: "459",
  years_of_experience: "7",
} as const;

/** Keep in sync with `HOME_STATS` in KeyAchievementsSection.tsx */
export const HOME_KEY_ACHIEVEMENT_VALUES = {
  volume: "100M+",
  clients: "50,000+",
  transactions: "300,000+",
  years: "8",
} as const;

export const HOME_ACHIEVEMENT_STATS = [
  {
    value: MARKETING_HIGHLIGHT_STATS.total_transactions_usdt,
    label: "USD Fiat Transactions",
  },
  {
    value: MARKETING_HIGHLIGHT_STATS.satisfied_clients,
    label: "Satisfied Users",
  },
  {
    value: MARKETING_HIGHLIGHT_STATS.successful_transactions,
    label: "Completed Total Trades",
  },
  {
    value: MARKETING_HIGHLIGHT_STATS.years_of_experience,
    label: "Years Of Experience",
  },
] as const;
