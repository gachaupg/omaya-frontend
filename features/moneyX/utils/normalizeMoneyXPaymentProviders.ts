import type { MoneyXPaymentProvider } from "../api";
import { coercePaymentMethodText } from "@/features/express/utils/moneyXPaymentMethodUtils";

/** Map MoneyX payment-providers API rows to the shape used by MoneyX forms. */
export function normalizeMoneyXPaymentProviders(
  providers: MoneyXPaymentProvider[]
): any[] {
  if (!Array.isArray(providers)) return [];

  return providers.map((provider) => {
    const method = coercePaymentMethodText(provider.method);
    const methodDisplay =
      coercePaymentMethodText(provider.method_display) || method;
    const providerName = coercePaymentMethodText(provider.provider_name);
    const logo = coercePaymentMethodText(provider.logo);

    return {
      provider_id: coercePaymentMethodText(provider.provider_id),
      provider_name: providerName,
      method,
      method_display: methodDisplay,
      payment_method: methodDisplay || method,
      payment_method_type: method,
      logo,
      provider_logo: logo,
      is_active: true,
    };
  });
}
