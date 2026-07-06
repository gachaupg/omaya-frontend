const DUMMY_PAYMENT_LOGO = "/default-provider-logo.svg";

const PAYMENT_LOGOS: Record<string, string> = {
  "salam bank": "/images/salam.svg",
  "salaam bank": "/images/salam.svg",
  dahabshiil: "/assets/image_7_jijlik.png",
  "evc plus": "/assets/image_7_jijlik.png",
};

export function getHomeP2PPaymentLogo(provider?: string | null): string {
  if (!provider) return DUMMY_PAYMENT_LOGO;
  const normalized = provider.trim().toLowerCase();
  return PAYMENT_LOGOS[normalized] || DUMMY_PAYMENT_LOGO;
}

export function getHomeP2PAssetIcon(ticker?: string | null): string {
  const normalized = String(ticker || "USDT").trim().toUpperCase();
  if (normalized === "ETH") return "/images/eth.svg";
  if (normalized === "BTC") return "/images/Bitcoin.svg";
  return "/images/tether.svg";
}
