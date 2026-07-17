import { get } from "@/lib/apiClient";
import { API_CONFIG } from "@/lib/appConfig";

export interface MoneyXPaymentProvider {
  provider_id: string;
  provider_name: string;
  method: string;
  method_display: string;
  logo: string;
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
