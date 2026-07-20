// Payment Methods API Response Types
export interface PaymentMethodResponse {
  success: boolean;
  message: string;
  data: {
    payment_methods: PaymentMethod[];
    summary: {
      total_payment_methods: number;
      total_providers: number;
      total_payment_details: number;
      available_methods: string[];
    };
  };
}

export interface PaymentMethod {
  method_id: string;
  method_name: string;
  method_display: string;
  providers: PaymentProvider[];
}

export interface PaymentProvider {
  provider_id: string;
  provider_name: string;
  short_name?: string;
  logo: string;
  payment_details: PaymentDetail[];
}

export interface PaymentDetail {
  account_name: string;
  account_number: string;
  mobile_number: string | null;
  wallet_address: string | null;
  how_to_send: string | null;
  account_type: string;
  asset: {
    symbol: string;
    name: string;
  } | null;
  network: {
    network_id: string;
    network_type: string;
    display_name: string;
  } | null;
}

// Legacy types for backward compatibility
export interface UserPaymentDetail {
  id: number;
  payment_method_name: string;
  payment_provider_name: string;
  account_name: string;
  account_number: string;
  provider_logo?: string;
  logo?: string;
  logo_url?: string;
  wallet_address?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

// Admin payment method type for existing components
export interface AdminPaymentMethod {
  id: string;
  payment_method_type: string;
  provider_name: string;
  short_name?: string;
  logo?: string;
  logo_url?: string | null;
  provider_logo?: string | null;
  wallet_address?: string | null;
  linked_bank_provider?: string | null;

  // Bank / mobile / crypto details (optional, shape mirrors backend)
  account_name?: string | null;
  account_number?: string | null;
  mobile_number?: string | null;
  account_type?: string | null;
  payment_type?: string | null;
  how_to_send?: string | null;

  // Raw admin payment details from backend (can contain multiple accounts)
  admin_payment_details?: any[] | null;
  payment_details?: any[] | null;
}
