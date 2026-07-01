import {
  isP2PTradeCanceledStatus,
  normalizeP2PTradeStatus,
} from "@/features/p2p/utils/normalizeP2PTradeStatus";

export type P2PChartTimeFilter =
  | "Today"
  | "Last Week"
  | "Last Month"
  | "Last 6 Months"
  | "All Time";

export type P2PStatusBuckets = {
  completed: number;
  pending: number;
  offline: number;
  canceled: number;
};

export type P2PTradeSideAggregation = {
  buy: P2PStatusBuckets;
  sell: P2PStatusBuckets;
};

const emptyBuckets = (): P2PStatusBuckets => ({
  completed: 0,
  pending: 0,
  offline: 0,
  canceled: 0,
});

export function resolveUserTradeDisplayType(
  item: Record<string, unknown>,
  currentUserEmail?: string
): "buy" | "sell" | null {
  const rawOrderType = String(item?.type || item?.order_type || "")
    .trim()
    .toLowerCase();
  if (rawOrderType !== "buy" && rawOrderType !== "sell") {
    return null;
  }

  const ownerEmail = String(item?.owner || "").trim().toLowerCase();
  const userEmail = String(currentUserEmail || "").trim().toLowerCase();
  const isOwner = Boolean(userEmail && ownerEmail && ownerEmail === userEmail);

  if (item?.type) {
    return rawOrderType as "buy" | "sell";
  }

  if (isOwner) return rawOrderType as "buy" | "sell";
  return rawOrderType === "buy" ? "sell" : "buy";
}

export function parseP2PTradeChartAmount(item: Record<string, unknown>): number {
  const parsedAmount = Number.parseFloat(
    String(item?.amount ?? item?.net_amount ?? 0)
  );
  return Number.isFinite(parsedAmount) ? parsedAmount : 0;
}

export function bucketP2PTradeStatus(status: unknown): keyof P2PStatusBuckets {
  if (isP2PTradeCanceledStatus(String(status ?? ""))) return "canceled";

  const normalized = normalizeP2PTradeStatus(String(status ?? ""))?.toLowerCase();
  if (normalized === "completed" || normalized === "complete") return "completed";
  if (normalized === "offline") return "offline";
  return "pending";
}

export function isTradeInP2PChartTimeWindow(
  timestamp: string,
  filter: P2PChartTimeFilter,
  now = new Date()
): boolean {
  const ts = new Date(timestamp);
  if (Number.isNaN(ts.getTime())) return false;

  if (filter === "Today") {
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    return ts.getTime() >= todayStart;
  }

  if (filter === "Last Week") {
    const diffDays = Math.floor(
      (now.getTime() - ts.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays >= 0 && diffDays < 7;
  }

  const slots =
    filter === "Last Month" ? 4 : filter === "Last 6 Months" ? 6 : 12;
  const diffMonths =
    (now.getFullYear() - ts.getFullYear()) * 12 +
    (now.getMonth() - ts.getMonth());
  return diffMonths >= 0 && diffMonths < slots;
}

export function getChartEligibleBucketTotal(buckets: P2PStatusBuckets): number {
  return buckets.completed + buckets.pending + buckets.offline;
}

export function aggregateP2PTradesForChart(
  trades: unknown[],
  currentUserEmail?: string,
  timeFilter: P2PChartTimeFilter = "All Time"
): P2PTradeSideAggregation {
  const result: P2PTradeSideAggregation = {
    buy: emptyBuckets(),
    sell: emptyBuckets(),
  };

  for (const raw of trades) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;

    const timestamp = String(
      item.lastUpdate || item.timestamp || item.date || ""
    );
    if (!isTradeInP2PChartTimeWindow(timestamp, timeFilter)) continue;

    const displayType = resolveUserTradeDisplayType(item, currentUserEmail);
    if (!displayType) continue;

    const normalizedStatus = normalizeP2PTradeStatus(String(item.status ?? ""));
    if (!normalizedStatus) continue;

    const amount = parseP2PTradeChartAmount(item);
    if (amount <= 0) continue;

    const bucket = bucketP2PTradeStatus(item.status);
    result[displayType][bucket] += amount;
  }

  return result;
}

export function transformTradeForChartPoint(
  item: unknown,
  currentUserEmail?: string
): {
  amount: number;
  type: "buy" | "sell";
  timestamp: string;
} | null {
  if (!item || typeof item !== "object") return null;
  const trade = item as Record<string, unknown>;

  const timestamp = String(
    trade.lastUpdate || trade.timestamp || trade.date || ""
  );
  const ts = new Date(timestamp);
  if (Number.isNaN(ts.getTime())) return null;

  const displayType = resolveUserTradeDisplayType(trade, currentUserEmail);
  if (!displayType) return null;

  if (isP2PTradeCanceledStatus(String(trade.status ?? ""))) return null;

  const normalizedStatus = normalizeP2PTradeStatus(String(trade.status ?? ""));
  if (!normalizedStatus) return null;

  const amount = parseP2PTradeChartAmount(trade);
  return {
    amount,
    type: displayType,
    timestamp,
  };
}

const CHART_MONTH_BUCKETS = 12;

/** Monthly buy/sell buckets from P2P user-trades (excludes canceled). */
export function buildP2PMonthlyChartBuckets(
  trades: unknown[],
  currentUserEmail?: string,
  monthCount = CHART_MONTH_BUCKETS
): { buys: number[]; sells: number[] } {
  const buys = Array(monthCount).fill(0);
  const sells = Array(monthCount).fill(0);
  const currentDate = new Date();

  for (const raw of trades) {
    const point = transformTradeForChartPoint(raw, currentUserEmail);
    if (!point || point.amount <= 0) continue;

    const tradeDate = new Date(point.timestamp);
    if (Number.isNaN(tradeDate.getTime())) continue;

    const monthDiff =
      (currentDate.getFullYear() - tradeDate.getFullYear()) * 12 +
      (currentDate.getMonth() - tradeDate.getMonth());
    if (monthDiff < 0 || monthDiff >= monthCount) continue;

    const monthIndex = monthCount - 1 - monthDiff;
    if (point.type === "buy") buys[monthIndex] += point.amount;
    else sells[monthIndex] += point.amount;
  }

  return { buys, sells };
}

export type P2PChartDisplayRow = {
  name: string;
  buyValue: number;
  sellValue: number;
};

/** Rolling month labels aligned with buildP2PMonthlyChartBuckets slot order. */
export function getRollingMonthLabels(
  monthCount: number,
  now = new Date()
): string[] {
  const labels: string[] = [];
  for (let offset = monthCount - 1; offset >= 0; offset--) {
    const target = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    labels.push(
      target.toLocaleString("en-US", { month: "short" }).toUpperCase()
    );
  }
  return labels;
}

const DAY_LABEL_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Build buy/sell series for the P2P area chart (hour/day/month buckets). */
export function buildP2PChartDisplayData(
  trades: unknown[],
  currentUserEmail: string | undefined,
  filter: P2PChartTimeFilter,
  now = new Date()
): P2PChartDisplayRow[] {
  if (filter === "Today") {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const rows: P2PChartDisplayRow[] = Array.from({ length: 24 }, (_, i) => ({
      name: `${pad(i)}:00`,
      buyValue: 0,
      sellValue: 0,
    }));
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();

    for (const raw of trades) {
      const point = transformTradeForChartPoint(raw, currentUserEmail);
      if (!point || point.amount <= 0) continue;
      const ts = new Date(point.timestamp);
      if (Number.isNaN(ts.getTime()) || ts.getTime() < todayStart) continue;
      const hour = ts.getHours();
      if (point.type === "buy") rows[hour].buyValue += point.amount;
      else rows[hour].sellValue += point.amount;
    }
    return rows;
  }

  if (filter === "Last Week") {
    const rows: P2PChartDisplayRow[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      rows.push({
        name: `${DAY_LABEL_MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`,
        buyValue: 0,
        sellValue: 0,
      });
    }

    for (const raw of trades) {
      const point = transformTradeForChartPoint(raw, currentUserEmail);
      if (!point || point.amount <= 0) continue;
      const ts = new Date(point.timestamp);
      if (Number.isNaN(ts.getTime())) continue;
      const diffDays = Math.floor(
        (now.getTime() - ts.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays < 0 || diffDays >= 7) continue;
      const idx = 6 - diffDays;
      if (point.type === "buy") rows[idx].buyValue += point.amount;
      else rows[idx].sellValue += point.amount;
    }
    return rows;
  }

  const slots =
    filter === "Last Month" ? 4 : filter === "Last 6 Months" ? 6 : 12;
  const { buys, sells } = buildP2PMonthlyChartBuckets(
    trades,
    currentUserEmail,
    slots
  );
  const labels = getRollingMonthLabels(slots, now);

  return labels.map((name, i) => ({
    name,
    buyValue: buys[i] ?? 0,
    sellValue: sells[i] ?? 0,
  }));
}
