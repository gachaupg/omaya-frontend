import type { MarketRow } from "@/features/p2p/components/ui/market/types";

export type HomeP2PMode = "buy" | "sell";

export type HomeP2PBadge = "top-trader" | "elite";

export type HomeP2POffer = {
  id: string;
  displayName: string;
  advertiserInitials: string;
  advertiserPhoto?: string;
  avatarColor: string;
  badge?: HomeP2PBadge;
  rating: string;
  tradesCount: number;
  paymentProvider: string;
  paymentLogo: string;
  assetIcon: string;
  assetTicker: string;
  online: boolean;
  marketRow: MarketRow;
};