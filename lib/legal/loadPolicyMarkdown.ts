import path from "path";
import { readFile } from "fs/promises";
import { LEGAL_POLICY_LEGACY_FILES } from "./legalPolicies";

const LEGAL_DIR = path.join(process.cwd(), "content", "legal");

export async function loadPolicyMarkdown(fileName: string): Promise<string | null> {
  const candidates = [
    fileName,
    LEGAL_POLICY_LEGACY_FILES[fileName],
  ].filter((name): name is string => Boolean(name));

  for (const name of candidates) {
    try {
      return await readFile(path.join(LEGAL_DIR, name), "utf8");
    } catch {
      // try next candidate
    }
  }
  return null;
}
