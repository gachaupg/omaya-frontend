/** Resolve display account / wallet / mobile from a payment method payload. */
import { getCleanPaymentProviderLabel } from "@/lib/utils/paymentProviderLabel";

export const resolvePaymentAccountNumber = (pm: any): string => {
  if (!pm) return "";
  const admin = Array.isArray(pm?.admin_payment_details)
    ? pm.admin_payment_details[0]
    : null;
  const nested = pm?.payment_details?.[0];
  const pick = (...values: unknown[]): string => {
    for (const v of values) {
      const s = String(v ?? "").trim();
      if (s) return s;
    }
    return "";
  };
  return pick(
    pm.account_number,
    nested?.account_number,
    admin?.account_number,
    pm.mobile_number,
    nested?.mobile_number,
    admin?.mobile_number,
    pm.wallet_address,
    nested?.wallet_address,
    admin?.wallet_address
  );
};

export const resolvePaymentProviderName = (pm: any): string =>
  getCleanPaymentProviderLabel(pm) ||
  String(
    pm?.provider_name || pm?.provider || pm?.name || pm?.method_display || ""
  ).trim();
