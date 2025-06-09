import dynamic from "next/dynamic";

// Dynamically import the MarketTransactions component with SSR disabled
const MarketTransactions = dynamic(() => import("./MarketTransactions"), {
  ssr: false,
});

export default function MarketTransactionsWrapper() {
  return <MarketTransactions activeTab="buy" />;
}
