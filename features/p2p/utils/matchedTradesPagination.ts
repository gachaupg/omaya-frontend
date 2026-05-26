import { getMatchedTrades } from "../api";
import type { MatchedTradesResponse } from "../types";

/** Resolve API page size from the first page (fallback 10). */
export function getMatchedTradesPageSize(firstPage: MatchedTradesResponse): number {
  const len = firstPage.results?.length ?? 0;
  return len > 0 ? len : 10;
}

export function getMatchedTradesTotalPages(
  count: number,
  pageSize: number
): number {
  if (!count || count <= 0) return 1;
  return Math.max(1, Math.ceil(count / pageSize));
}

/** Fetch the page that contains the most recent matched trades. */
export async function fetchLatestMatchedTradesPage(): Promise<{
  data: MatchedTradesResponse;
  page: number;
  totalPages: number;
}> {
  const first = await getMatchedTrades(1);
  const pageSize = getMatchedTradesPageSize(first);
  const totalPages = getMatchedTradesTotalPages(first.count ?? 0, pageSize);
  if (totalPages <= 1) {
    return { data: first, page: 1, totalPages: 1 };
  }
  const latest = await getMatchedTrades(totalPages);
  return { data: latest, page: totalPages, totalPages };
}
