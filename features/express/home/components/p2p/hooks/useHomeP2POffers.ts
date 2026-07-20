"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllP2PBuyandSellPublic } from "@/features/p2p/api";
import type { HomeP2PMode, HomeP2POffer } from "../types";
import {
  collectOrdersForMode,
  mapHomeP2POffers,
} from "../utils/mapHomeP2POffers";

type OrderSide = {
  results: unknown[];
  total_orders_count: number;
};

const EMPTY_ORDERS: { buy_orders: OrderSide; sell_orders: OrderSide } = {
  buy_orders: { results: [], total_orders_count: 0 },
  sell_orders: { results: [], total_orders_count: 0 },
};

function normalizeOrderSide(raw: unknown): OrderSide {
  if (Array.isArray(raw)) {
    return { results: raw, total_orders_count: raw.length };
  }

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const results = Array.isArray(obj.results) ? obj.results : [];
    const total =
      typeof obj.total_orders_count === "number"
        ? obj.total_orders_count
        : results.length;
    return { results, total_orders_count: total };
  }

  return { results: [], total_orders_count: 0 };
}

export function useHomeP2POffers(mode: HomeP2PMode) {
  const [marketData, setMarketData] = useState(EMPTY_ORDERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await getAllP2PBuyandSellPublic(1);
        if (cancelled) return;

        const payload = data as {
          buy_orders?: unknown;
          sell_orders?: unknown;
        };

        setMarketData({
          buy_orders: normalizeOrderSide(payload.buy_orders),
          sell_orders: normalizeOrderSide(payload.sell_orders),
        });
      } catch {
        if (!cancelled) {
          setMarketData(EMPTY_ORDERS);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const { buy_orders, sell_orders } = marketData;

  const offers: HomeP2POffer[] = useMemo(() => {
    const orders = collectOrdersForMode(buy_orders, sell_orders, mode);
    return mapHomeP2POffers(orders, mode, 4);
  }, [buy_orders, sell_orders, mode]);

  const activeTradersLabel = useMemo(() => {
    const total =
      (buy_orders.total_orders_count || 0) + (sell_orders.total_orders_count || 0);
    if (total >= 500) return "500+";
    if (total > 0) return `${total}+`;
    return "500+";
  }, [buy_orders.total_orders_count, sell_orders.total_orders_count]);

  return {
    offers,
    loading,
    activeTradersLabel,
  };
}
