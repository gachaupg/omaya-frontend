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
  total_approved_exchange_combined?: number; // Deprecated, use total_approved_exchange_net
  total_approved_exchange_net?: number;
  total_approved_exchange_volume?: number;
  total_pending_p2p_deposits: number;
  total_pending_p2p_withdrawals: number;
  total_approved_p2p_deposits: number;
  total_approved_p2p_withdrawals: number;
  total_approved_p2p_combined?: number; // Deprecated, use total_approved_p2p_net
  total_approved_p2p_net?: number;
  total_approved_p2p_volume?: number;
  total_approved_all?: number; // Deprecated, use total_approved_volume
  total_approved_volume?: number;
  total_approved_net?: number;
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
  /** From transaction summary API – total balance */
  total_balance?: string;
  /** From transaction summary API – available to use */
  available_amount?: string;
  /** From transaction summary API – in escrow / locked */
  escrow?: string;
  /** Alternate API field for P2P funding volume */
  total_approved_p2p_funding_volume?: number;
  /** Matched P2P trades by status (dashboard charts) */
  total_buy_trades_by_status?: OrderStatus;
  total_sell_trades_by_status?: OrderStatus;
  total_buy_trades?: number;
  total_sell_trades?: number;
  total_moneyx_by_status?: unknown;
  total_approved_moneyx_volume?: number;
  total_moneyx_volume?: number;
  total_approved_changenow_swap_volume?: number;
  total_changenow_swap_volume?: number;
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
