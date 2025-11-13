export interface OrderStatus {
  pending: number;
  completed: number;
  canceled: number;
  offline: number;
}

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
  total_buy_orders_by_status: OrderStatus;
  total_sell_orders_by_status: OrderStatus;
  total_buy_orders: number;
  total_sell_orders: number;
  total_p2p_orders: number;
  total_trades: number;
  avg_release_time: string;
  avg_payment_time: string;
  rating: string;
  total_volume: string;
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
  total_sell_orders_by_status: {
    pending: 0,
    completed: 0,
    canceled: 0,
    offline: 0,
  },
  total_buy_orders: 0,
  total_sell_orders: 0,
  total_p2p_orders: 0,
  total_trades: 0,
  avg_release_time: "0 Min",
  avg_payment_time: "0 Min",
  rating: "0%",
  total_volume: "0 USD",
};
