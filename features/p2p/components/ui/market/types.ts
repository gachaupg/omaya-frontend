export interface MarketRow {
  id: string;
  advertiser: string;
  advertiserInitials: string;
  orders: number;
  advertiser_photo: string;
  completion: string;
  exchange_rate: string;
  completion_time: string;
  online: boolean;
  commission: string;
  available: string;
  availableAmount: number;
  limit: string;
  payment: string[];
  minAmount: number;
  maxAmount: number;
  currency: string;
  range_currency?: string | null; // KES, USD, etc. - for limit/commission display
  originalCurrency?: string; // Original currency before conversion (for filtering)
  paymentType: string[];
  isMerchant?: boolean;
  isMerchantBusiness?: boolean;
  timeLimit: string;
  avgRealiseTime: string;
  terms_and_conditions: string;
  autoReply?: string;
  payment_details?: Array<{
    id: number;
    provider: string;
    payment_method: string;
    account_name: string;
    account_number: string;
    provider_logo: string;
  }>;
}

export interface MarketTableProps {
  data: MarketRow[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading: boolean;
  activeTab: string;
}
