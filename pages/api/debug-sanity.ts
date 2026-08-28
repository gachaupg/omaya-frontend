import { getServerClient } from "@/sanity/lib/client";
import {
  loadSanitySecrets,
  sanityEnvPresence,
} from "@/sanity/lib/loadSanitySecrets";
import { NextApiRequest, NextApiResponse } from "next";

/** Production diagnostics — same as admin `/api/debug-sanity`. */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const envPresent = sanityEnvPresence();
  let secretsSummary: Record<string, unknown> | null = null;

  try {
    const secrets = await loadSanitySecrets();
    secretsSummary = {
      projectId: secrets.projectId || null,
      dataset: secrets.dataset,
      apiVersion: secrets.apiVersion,
      hasToken: Boolean(secrets.token && secrets.token.startsWith("sk")),
      tokenPrefix: secrets.token ? `${secrets.token.slice(0, 8)}…` : null,
      tokenCandidateCount: secrets.tokenCandidates.length,
      envPresent,
      secretIdConfigured: envPresent.SANITY_SECRET_NAME,
      sourceHint: envPresent.SANITY_SECRET_NAME
        ? "env+secrets-manager"
        : "env (ECS-injected keys expected)",
    };

    const serverClient = await getServerClient();
    const [blogs, faqs] = await Promise.all([
      serverClient.fetch('*[_type == "blog"][0...3]{ _id, title, status }'),
      serverClient.fetch('*[_type == "faq"][0...3]{ _id, title }'),
    ]);

    res.status(200).json({
      config: secretsSummary,
      blogs: { sample: blogs, count: Array.isArray(blogs) ? blogs.length : 0 },
      faqs: { sample: faqs, count: Array.isArray(faqs) ? faqs.length : 0 },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: message,
      config: secretsSummary,
      envPresent,
      hint:
        "Session not found = Sanity rejected the API token. In AWS SM, confirm SANITY_TOKEN is a valid sk… token. ECS must inject SANITY_PROJECT_ID, SANITY_DATASET=production, and SANITY_TOKEN (or SANITY_SECRET_NAME). Same secret as admin.",
    });
  }
}
