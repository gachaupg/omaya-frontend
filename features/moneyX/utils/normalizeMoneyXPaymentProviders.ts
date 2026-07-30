import type { MoneyXPaymentProvider } from "../api";
import { coercePaymentMethodText } from "@/features/express/utils/moneyXPaymentMethodUtils";

const pickFirst = (...values: unknown[]): string => {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
};

/** Map MoneyX payment-providers API rows to the shape used by MoneyX forms. */
export function normalizeMoneyXPaymentProviders(
  providers: MoneyXPaymentProvider[]
): any[] {
  if (!Array.isArray(providers)) return [];

  return providers.map((provider) => {
    const raw = provider as Record<string, unknown>;
    const method = coercePaymentMethodText(provider.method);
    const methodDisplay =
      coercePaymentMethodText(provider.method_display) || method;
    const providerName = coercePaymentMethodText(provider.provider_name);
    const logo = coercePaymentMethodText(provider.logo);

    const adminPaymentDetails = Array.isArray(raw.admin_payment_details)
      ? raw.admin_payment_details
      : [];
    const paymentDetails = Array.isArray(raw.payment_details)
      ? raw.payment_details
      : [];
    const firstDetail =
      (paymentDetails[0] as Record<string, unknown> | undefined) ||
      (adminPaymentDetails[0] as Record<string, unknown> | undefined) ||
      {};

    const account_name = pickFirst(raw.account_name, firstDetail.account_name);
    const account_number = pickFirst(
      raw.account_number,
      firstDetail.account_number,
      firstDetail.mobile_number,
      raw.mobile_number
    );
    const mobile_number = pickFirst(raw.mobile_number, firstDetail.mobile_number);
    const wallet_address = pickFirst(
      raw.wallet_address,
      firstDetail.wallet_address
    );
    const how_to_send = pickFirst(raw.how_to_send, firstDetail.how_to_send);

    return {
      id: raw.id,
      provider_id:
        coercePaymentMethodText(provider.provider_id) || pickFirst(raw.id),
      provider_name: providerName,
      method,
      method_display: methodDisplay,
      payment_method: methodDisplay || method,
      payment_method_type: method,
      logo,
      provider_logo: logo,
      is_active: true,
      admin_payment_details: adminPaymentDetails,
      payment_details:
        paymentDetails.length > 0 ? paymentDetails : adminPaymentDetails,
      account_name,
      account_number,
      mobile_number,
      wallet_address,
      how_to_send,
    };
  });
}
