/**
 * types.ts – auto‑generated placeholder
 */

/**
 * P2P feature type definitions
 */

export interface Tab {
  id: string;
  label: string;
  path?: string;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export type TransactionType = {
  id: string;
  type: string;
  date: string;
  amount: string;
  status: string;
  asset: string;
  assetSymbol: string;
  rate?: string;
  payment?: { bank: string; logo: string } | { bank: string; logo: string }[];
  username?: string;
  rating?: string;
  comment?: string;
  limit?: string;
  price?: string;
  commission?: string;
  lastUpdate?: string;
};

export interface TransactionType1 {}
