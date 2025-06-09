import { Metadata } from "next";
import MatchedOrder from "@/features/p2p/components/matchedOrder";
export const metadata: Metadata = {
  title: "Matched Order | OMAYA Exchange",
  description: "View your matched P2P order details",
};

// This tells Next.js that this is a dynamic route that should be generated at request time
export const dynamic = "force-dynamic";

// Since we're using force-dynamic, we don't need to generate static params
export function generateStaticParams() {
  return [];
}

export default function MatchedOrderPage() {
  return <MatchedOrder />;
}
