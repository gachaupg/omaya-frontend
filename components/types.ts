export interface TransactionSummary {
  total_pending_exchange_deposits: number;
  total_pending_exchange_withdrawals: number;
  total_approved_exchange_deposits: number;
  total_approved_exchange_withdrawals: number;
  total_approved_exchange_combined: number;
  total_pending_p2p_deposits: number;
  total_pending_p2p_withdrawals: number;
  total_approved_p2p_deposits: number;
  total_approved_p2p_withdrawals: number;
  total_approved_p2p_combined: number;
  total_approved_all: number;
  total_pending_changenow_swaps: number;
  total_completed_changenow_swaps: number;
  total_failed_changenow_swaps: number;
  total_changenow_swaps: number;
  total_buy_orders_by_status: {
    pending: number;
    completed: number;
    canceled: number;
    offline: number;
  };
}

export const emptyTransactionSummary: TransactionSummary = {
  total_pending_exchange_deposits: 0,
  total_pending_exchange_withdrawals: 0,
  total_approved_exchange_deposits: 0,
  total_approved_exchange_withdrawals: 0,
  total_approved_exchange_combined: 0,
  total_pending_p2p_deposits: 0,
  total_pending_p2p_withdrawals: 0,
  total_approved_p2p_deposits: 0,
  total_approved_p2p_withdrawals: 0,
  total_approved_p2p_combined: 0,
  total_approved_all: 0,
  total_pending_changenow_swaps: 0,
  total_completed_changenow_swaps: 0,
  total_failed_changenow_swaps: 0,
  total_changenow_swaps: 0,
  total_buy_orders_by_status: {
    pending: 0,
    completed: 0,
    canceled: 0,
    offline: 0,
  },
};
