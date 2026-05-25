export type MyAdsDateFilterValue =
  | "All Time"
  | "Today"
  | "Yesterday"
  | "Last 7 Days"
  | "Last 30 Days"
  | "Last 90 Days"
  | "Last 180 Days"
  | "Custom Range";

export const MY_ADS_DATE_FILTER_OPTIONS: { value: MyAdsDateFilterValue; label: string }[] =
  [
    { value: "All Time", label: "All Time" },
    { value: "Today", label: "Today" },
    { value: "Yesterday", label: "Yesterday" },
    { value: "Last 7 Days", label: "Last 7 Days" },
    { value: "Last 30 Days", label: "Last 30 Days" },
    { value: "Last 90 Days", label: "Last 90 Days" },
    { value: "Last 180 Days", label: "Last 180 Days" },
    { value: "Custom Range", label: "Custom Date Range" },
  ];

export function matchesMyAdsDateFilter(
  createdOn: string | undefined,
  dateFilter: string,
  customDateFrom?: string,
  customDateTo?: string
): boolean {
  const date =
    dateFilter === "All" || dateFilter === "Date" ? "All Time" : dateFilter;

  if (date === "All Time" || !createdOn) {
    return date === "All Time";
  }

  const tradeDate = new Date(createdOn);
  if (Number.isNaN(tradeDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (date) {
    case "Today": {
      const d = new Date(tradeDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }
    case "Yesterday": {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      const d = new Date(tradeDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === y.getTime();
    }
    case "Last 7 Days": {
      const start = new Date(today);
      start.setDate(today.getDate() - 7);
      return tradeDate >= start;
    }
    case "Last 30 Days": {
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      return tradeDate >= start;
    }
    case "Last 90 Days": {
      const start = new Date(today);
      start.setDate(today.getDate() - 90);
      return tradeDate >= start;
    }
    case "Last 180 Days": {
      const start = new Date(today);
      start.setDate(today.getDate() - 180);
      return tradeDate >= start;
    }
    case "Custom Range": {
      if (!customDateFrom || !customDateTo) {
        return true;
      }
      const from = new Date(customDateFrom);
      from.setHours(0, 0, 0, 0);
      const to = new Date(customDateTo);
      to.setHours(23, 59, 59, 999);
      return tradeDate >= from && tradeDate <= to;
    }
    default:
      return true;
  }
}

export function formatMyAdsCustomRangeLabel(from: string, to: string): string {
  try {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return "Custom Date Range";
    }
    const fmt = (d: Date) =>
      d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    return `${fmt(fromDate)} – ${fmt(toDate)}`;
  } catch {
    return "Custom Date Range";
  }
}
