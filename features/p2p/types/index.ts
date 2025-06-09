export interface PaymentDetail {
  id: number;
  provider: string;
  payment_method: string;
  account_name: string;
  account_number: string;
}

export interface P2POrder {
  id: string;
  advertiser_first_name: string;
  advertiser_last_name: string;
  advertiser_email: string;
  asset: string;
  order_type: string;
  currency: string;
  amount: string;
  min_order_amount: string;
  max_order_amount: string;
  commission_rate: string;
  exchange_rate: string;
  status: string;
  created_on: string;
  limit_duration: string;
  completion_time: string;
  completion_rate: string | null;
  terms_and_conditions: string;
  auto_reply: string;
  user_total_sell_orders: number | null;
  user_total_buy_orders: number | null;
  total_trades_as_buyer: number;
  total_trades_as_seller: number;
  payment_details: PaymentDetail[];
  sell_order: string | null;
  buy_order: string | null;
}

export interface P2POrderList {
  next: string | null;
  previous: string | null;
  total_orders_count: number;
  results: P2POrder[];
}

export interface P2PBuySellResponse {
  buy_orders: P2POrderList;
  sell_orders: P2POrderList;
}

export interface P2PState {
  orders: P2PBuySellResponse;
  loading: boolean;
  error: string | null;
  currentPage: number;
}
