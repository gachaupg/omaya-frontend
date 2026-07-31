import {
  getSanityConfigFromEnv,
  type SanityRuntimeConfig,
} from "@/config/sanity";

/** Same HTTP query path as OmayaExchangeMobile `SanityService.query`. */
export async function fetchSanityGroq<T>(
  groqQuery: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const config = getSanityConfigFromEnv();
  return fetchSanityGroqWithConfig<T>(config, groqQuery, params);
}

export async function fetchSanityGroqWithConfig<T>(
  config: SanityRuntimeConfig,
  groqQuery: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const { projectId, dataset, apiVersion, token } = config;
  if (!projectId || !dataset) {
    throw new Error("Sanity projectId/dataset not configured");
  }

  const encodedQuery = encodeURIComponent(groqQuery);
  let url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodedQuery}`;

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    url += `&$${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Sanity query failed (${response.status})${body ? `: ${body.slice(0, 200)}` : ""}`
    );
  }

  const data = (await response.json()) as { result?: T };
  return (data.result ?? []) as T;
}
