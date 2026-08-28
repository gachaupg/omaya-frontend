import { NextResponse } from "next/server";
import { loadServerPublicRuntimeConfig } from "@/lib/serverRuntimeConfigScript";

export const dynamic = "force-dynamic";

/** Public runtime config — ECS env + AWS Secrets Manager at request time (production-safe). */
export async function GET() {
  return NextResponse.json(await loadServerPublicRuntimeConfig());
}
