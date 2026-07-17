import type { MoneyXPaymentProvider } from "../api";

/** Map MoneyX payment-providers API rows to the shape used by MoneyX forms. */
export function normalizeMoneyXPaymentProviders(
  providers: MoneyXPaymentProvider[]
): any[] {
  if (!Array.isArray(providers)) return [];

  return providers.map((provider) => ({
    provider_id: provider.provider_id,
    provider_name: provider.provider_name,
    method: provider.method,
    method_display: provider.method_display,
    payment_method: provider.method_display || provider.method,
    payment_method_type: provider.method,
    logo: provider.logo,
    provider_logo: provider.logo,
    is_active: true,
  }));
}
