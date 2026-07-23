"use client";

import FinalBuy from "@/features/p2p/components/ui/market/sections/buyform";
import FinalSell from "@/features/p2p/components/ui/market/sections/sellform";
import TradeBuyOwner from "@/features/p2p/components/ui/market/sections/TradeBuyOwner";
import TradeSellerOwner from "@/features/p2p/components/ui/market/sections/TradeSellerOwner";
import { useSearchParams } from "next/navigation";
import React from "react";

const MatchedOrderPage = () => {
  const searchParams = useSearchParams();
  const orderData = searchParams?.get("orderData");
  const orderId = searchParams?.get("order_type");
  const trade = searchParams?.get("trade");

  let orderType = null;
  if (orderData) {
    try {
      const parsedData = JSON.parse(orderData);
      orderType = parsedData.order_type;
    } catch (e) {
          }
  }

  if (trade && trade !== "") {
    return orderId === "sell" ? <TradeBuyOwner /> : <TradeSellerOwner />;
  } else {
    return orderType === "sell" ? <FinalBuy /> : <FinalSell />;
  }
};

export default MatchedOrderPage;
