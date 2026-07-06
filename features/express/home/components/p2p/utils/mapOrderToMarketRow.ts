import type { MarketRow } from "@/features/p2p/components/ui/market/types";
import {
  formatDurationForDisplay,
  formatMarketTimeLimit,
} from "@/features/p2p/components/Common/utils";

export function mapOrderToMarketRow(order: unknown): MarketRow | null {
  if (!order || typeof order !== "object") return null;

  const raw = order as Record<string, unknown>;
  const firstName = String(raw.advertiser_first_name || "").trim();
  const lastName = String(raw.advertiser_last_name || "").trim();
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "TR";

  const paymentDetails = Array.isArray(raw.payment_details)
    ? raw.payment_details.map((pd: Record<string, unknown>) => ({
        id: Number(pd.id),
        provider: String(pd.provider || ""),
        payment_method: String(pd.payment_method || ""),
        account_name: String(pd.account_name || ""),
        account_number: String(pd.account_number || ""),
        provider_logo:
          typeof pd.provider_logo === "string" ? pd.provider_logo : "",
      }))
    : [];

  const availableAmount = parseFloat(String(raw.available_amount || 0));
  const minAmount = parseFloat(String(raw.min_order_amount || 0));
  const maxAmount = parseFloat(String(raw.max_order_amount || 0));
  const orderCurrency = String(raw.asset || raw.currency || "USDT");
  const rangeCurrency =
    typeof raw.range_currency === "string" ? raw.range_currency : null;
  const limitSuffix =
    rangeCurrency?.toUpperCase() === "KES" ? "KES" : "USD";
  const commissionSuffix = limitSuffix;

  return {
    id: String(raw.id || ""),
    advertiser: `${firstName} ${lastName}`.trim() || "Trader",
    advertiserInitials: initials,
    orders:
      Number(raw.user_total_buy_orders || raw.user_total_sell_orders || 0) ||
      0,
    advertiser_photo: String(raw.advertiser_photo || ""),
    completion: `${(parseFloat(String(raw.completion_rate || 0)) || 0) * 100}%`,
    exchange_rate: `${(parseFloat(String(raw.exchange_rate || 0)) * 100).toFixed(0)}`,
    completion_time: formatDurationForDisplay(
      String(raw.completion_time || "00:00:00")
    ),
    online:
      typeof raw.advertiser_online === "boolean"
        ? raw.advertiser_online
        : raw.status !== "offline",
    commission: `${raw.commission_rate || 0} ${commissionSuffix}`,
    available: `${availableAmount.toFixed(2)} ${orderCurrency}`,
    availableAmount,
    limit: `${minAmount.toFixed(2)} - ${maxAmount.toFixed(2)} ${limitSuffix}`,
    payment: paymentDetails.map((detail) => detail.provider),
    paymentType: paymentDetails.map((detail) => detail.payment_method),
    isMerchant: Boolean(
      raw.is_verified_merchant ?? raw.is_merchant ?? raw.verified_merchant
    ),
    isMerchantBusiness: Boolean(raw.is_merchant_business),
    minAmount,
    maxAmount,
    currency: orderCurrency,
    range_currency: rangeCurrency,
    timeLimit: formatMarketTimeLimit(raw as { limit_duration?: string }),
    avgRealiseTime: formatDurationForDisplay(
      String(raw.completion_time || "00:02:00")
    ),
    terms_and_conditions: String(raw.terms_and_conditions || ""),
    autoReply: typeof raw.auto_reply === "string" ? raw.auto_reply : undefined,
    payment_details: paymentDetails,
  };
}
