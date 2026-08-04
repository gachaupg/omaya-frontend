import type {
  MoneyXPaymentProvider,
  MoneyXPaymentProviderDetail,
} from "../api";
import { coercePaymentMethodText } from "@/features/express/utils/moneyXPaymentMethodUtils";
import { getCleanPaymentProviderLabel } from "@/lib/utils/paymentProviderLabel";

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
    const method = coercePaymentMethodText(provider.method);
    const methodDisplay =
      coercePaymentMethodText(provider.method_display) || method;
    const providerName = coercePaymentMethodText(provider.provider_name);
    const shortName = coercePaymentMethodText(provider.short_name);
    const logo = coercePaymentMethodText(provider.logo);

    const adminPaymentDetails = provider.admin_payment_details ?? [];
    const paymentDetails = provider.payment_details ?? [];
    const firstDetail: MoneyXPaymentProviderDetail | undefined =
      paymentDetails[0] ?? adminPaymentDetails[0];

    const account_name = pickFirst(provider.account_name, firstDetail?.account_name);
    const account_number = pickFirst(
      provider.account_number,
      firstDetail?.account_number,
      firstDetail?.mobile_number,
      provider.mobile_number
    );
    const mobile_number = pickFirst(provider.mobile_number, firstDetail?.mobile_number);
    const wallet_address = pickFirst(
      provider.wallet_address,
      firstDetail?.wallet_address
    );
    const how_to_send = pickFirst(provider.how_to_send, firstDetail?.how_to_send);

    return {
      id: provider.id,
      provider_id:
        coercePaymentMethodText(provider.provider_id) || pickFirst(provider.id),
      provider_name: providerName,
      short_name: shortName,
      provider: getCleanPaymentProviderLabel({
        short_name: shortName,
        provider_name: providerName,
      }),
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
