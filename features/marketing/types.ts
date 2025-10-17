export interface HighlightStatistics {
  total_transactions_usdt: string;
  satisfied_clients: string;
  successful_transactions: string;
  years_of_experience: string;
}

export interface HighlightStatisticsState {
  statistics: HighlightStatistics | null;
  loading: boolean;
  error: string | null;
}


