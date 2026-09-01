const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const upperClean = (value: string) => clean(value).toUpperCase();

const SEX_LABEL =
  /(?:SEX|GENDER|JINSIGA|JINSIA|SEXE|LAB\s*DHEDDIG|LABDHEDDIG|JINSI|JINSI\s*\/)/i;

export function normalizeSex(raw: string): string {
  const value = upperClean(raw);
  if (!value) return "";
  if (value === "M" || value === "MALE" || /^LAB\s*\/?\s*M(ALE)?$/i.test(value)) return "M";
  if (value === "F" || value === "FEMALE" || /^LAB\s*\/?\s*F(EMALE)?$/i.test(value)) return "F";
  if (value === "X" || value.startsWith("UNSPEC")) return "X";
  if (/^MA[LI][EK]?$/.test(value)) return "M";
  if (/^FE?MA[LI][EK]?$/.test(value) || /^FEMAL[EK]?$/.test(value)) return "F";
  return "";
}

export function extractSexFromText(text: string, lines?: string[]): string {
  const normalizedLines =
    lines ??
    text
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean);

  const inlineMatch = text.match(
    /(?:SEX|GENDER|JINSIGA|JINSIA|SEXE|LAB\s*DHEDDIG|JINSI)[:\s/\-|]+(?:LAB\s*\/)?\s*([MF]|MALE|FEMALE)\b/i
  );
  if (inlineMatch?.[1]) {
    const sex = normalizeSex(inlineMatch[1]);
    if (sex) return sex;
  }

  for (let i = 0; i < normalizedLines.length; i += 1) {
    const line = normalizedLines[i];
    if (!SEX_LABEL.test(line)) continue;

    const inlineOnLine = line.match(
      /(?:SEX|GENDER|JINSIGA|JINSIA|SEXE|LAB\s*DHEDDIG|JINSI)[:\s/\-|]+([A-Za-z]+)/i
    );
    if (inlineOnLine?.[1]) {
      const sex = normalizeSex(inlineOnLine[1]);
      if (sex) return sex;
    }

    for (let j = i + 1; j <= i + 2 && j < normalizedLines.length; j += 1) {
      const sex = normalizeSex(normalizedLines[j]);
      if (sex) return sex;
    }
  }

  const mrzSex = text.replace(/\s+/g, "").match(
    /[A-Z0-9<]{9}\d?[A-Z]{3}\d{6}\d?([MF<X])/
  );
  if (mrzSex?.[1]) {
    const sex = normalizeSex(mrzSex[1]);
    if (sex) return sex;
  }

  const standalone = text.match(/\b(MALE|FEMALE)\b/i);
  if (standalone?.[1]) return normalizeSex(standalone[1]);

  return "";
}

export function resolveDocumentSex(
  rawText: string,
  sources: Array<{ sex?: string; score: number }>,
  options?: { allowStandaloneSex?: boolean }
): string {
  const scored: Array<{ value: string; score: number }> = [];

  for (const source of sources) {
    const sex = normalizeSex(source.sex ?? "");
    if (sex) scored.push({ value: sex, score: source.score });
  }

  if (options?.allowStandaloneSex !== false) {
    const fromText = extractSexFromText(rawText);
    if (fromText) scored.push({ value: fromText, score: 45 });
  }

  const ranked = scored.sort((a, b) => b.score - a.score);
  return ranked[0]?.value ?? "";
}
