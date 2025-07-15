
export interface DepositTransactionPayload {
    requested_amount: string | number;
    deposit_address: string;
    payment_provider: string;
    payment_method: string;
    additional_info?: string;
    currency: string;
    network: string;
    asset: string;
    sent_from?: string;
    screenshot?: File;
    }
    
    export interface WithdrawalFormData {
      requested_amount: number | string;
      payment_provider: string;
      payment_method: string;
      additional_info?: string;
      network: string;
      asset: string;
      user_payment_detail_id: string;
      currency: string;
      screenshot?: File;
  }
  