import { get } from "@/lib/apiClient";
import { API_CONFIG } from "@/lib/appConfig";

export interface MoneyXPaymentProvider {
  id?: number;
  provider_id: string;
  provider_name: string;
  method: string | number;
  method_display: string | number;
  logo: string | null;
  account_name?: string;
  account_number?: string;
  admin_payment_details?: Array<{
    id?: number;
    account_name?: string;
    account_number?: string;
    mobile_number?: string;
    wallet_address?: string;
    how_to_send?: string;
    payment_type?: string;
    is_active?: boolean;
  }>;
  payment_details?: Array<Record<string, unknown>>;
}

export async function getMoneyXPaymentProviders(
  senderProviderId?: string
): Promise<MoneyXPaymentProvider[]> {
  const params = new URLSearchParams();
  if (senderProviderId) {
    params.set("sender_provider_id", senderProviderId);
  }
  const qs = params.toString();
  const path = `${API_CONFIG.MONEYX.PAYMENT_PROVIDERS}${qs ? `?${qs}` : ""}`;

  const response = await get<MoneyXPaymentProvider[] | { results: MoneyXPaymentProvider[] }>(
    path,
    { skipAuth: true }
  );

  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}
