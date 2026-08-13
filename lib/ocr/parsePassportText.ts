import type { IdDocumentDetails } from "./types";
import { extractSexFromText } from "./extractSex";

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const upperClean = (value: string) => clean(value).toUpperCase();

const PASSPORT_MARKERS =
  /PASSPORT|BAASABOOR|جواز|P<[A-Z]{3}|JAMHURI YA KENYA|REPUBLIQUE DE KENYA/i;

/** TD3 passport numbers: letter + digits (e.g. P01447848, AK1067169). Strips MRZ check digit when OCR merges it. */
export function normalizePassportNumber(raw: string): string {
  let value = upperClean(raw).replace(/</g, "");
  value = value.replace(/^P([0-9O])/i, (_, d) => `P${String(d).replace(/O/g, "0")}`);
  value = value.replace(/([0-9])O([0-9])/g, "$10$2");
  value = value.replace(/O/g, "0");

  if (/^[A-Z0-9]{10}$/.test(value) && /^[A-Z]\d{8}\d$/.test(value)) {
    return value.slice(0, 9);
  }
  if (/^[A-Z]\d{7,9}$/.test(value)) {
    return value.length > 9 ? value.slice(0, 9) : value;
  }
  if (/^[A-Z0-9]{9}$/.test(value)) {
    return value;
  }
  return value.slice(0, 9);
}

export function isPassportNumberFormat(value: string): boolean {
  const normalized = normalizePassportNumber(value);
  return /^[A-Z]\d{6,9}$/.test(normalized);
}

export function isNationalIdNumberFormat(value: string): boolean {
  return /^\d{11,14}$/.test(value.replace(/\D/g, ""));
}

export function isNationalIdDocumentText(text: string): boolean {
  return /(?:IDENTITY CARD|NATIONAL ID(?:ENTITY)?|KAADHKA|KAARKA AQOONSIGA|AQOONSIGA|KITAMBULISHO|TIRSIGA AQOONSIGA|LAMBAR(?:KA)?\s*AQOONSIGA|KAARKA|ENTTY)/i.test(
    text
  ) || /\bAQOONS/i.test(text);
}

export function isPassportDocumentText(text: string): boolean {
  if (isNationalIdDocumentText(text)) {
    return false;
  }

  const compact = text.replace(/\s+/g, "");
  return (
    PASSPORT_MARKERS.test(text) ||
    /P<[A-Z]{3}/.test(compact) ||
    (text.includes("<<") && /[A-Z0-9<]{28,}/.test(compact))
  );
}

function isLikelyPassportFieldValue(
  value: string,
  field: "place" | "occupation"
): boolean {
  const v = clean(value);
  if (v.length < 2 || v.length > 40) return false;
  if (/[\u0600-\u06FF]/.test(v)) return false;
  if (!/[A-Za-z]/.test(v)) return false;
  if (/^\d{1,2}\s+[A-Z]{3,9}\s+\d{4}$/i.test(v)) return false;
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(v)) return false;
  if (
    /\b(?:OCCUPATION|PROFESSION|SEX|GENDER|PLACE\s*OF|DATE\s*OF|ISSUE|SURNAME|GIVEN|NAMES|PASSPORT|BAASABOOR|NATIONALITY|JINSIYADA)\b/i.test(
      v
    )
  ) {
    return false;
  }
  if (
    /^(?:MALE|FEMALE|M|F|P|SOM|SOMALI|REPUBLIC|GOVERNMENT)$/i.test(v) &&
    field === "place"
  ) {
    return false;
  }
  if (
    /^(?:PLACE|DATE|ISSUE|BIRTH|SEX|TYPE|NO|NID|MAGACA|NAME|SURNAME|GIVEN|NATIONALITY|JINSIYADA|TAARIIKH|MEESHA|SHAQADA|XAFIISKA|LAB|DHEDDIG)/i.test(
      v
    )
  ) {
    return false;
  }
  if (/^[/\\|:\-–—]+$/.test(v)) return false;
  if (field === "occupation" && /^(?:MOGADISHU|NAIROBI|LASANOD|MOMBASA|KISUMU)$/i.test(v)) {
    return false;
  }
  return true;
}

function extractPassportField(
  text: string,
  lines: string[],
  options: {
    labels: string[];
    inlinePatterns: RegExp[];
    field: "place" | "occupation";
  }
): string {
  for (let i = 0; i < lines.length; i += 1) {
    const upper = lines[i].toUpperCase();
    for (const label of options.labels) {
      if (!upper.includes(label)) continue;

      const inline = lines[i]
        .slice(upper.indexOf(label) + label.length)
        .replace(/^[\s:/\-|–—]+/, "")
        .trim();

      if (isLikelyPassportFieldValue(inline, options.field)) {
        return upperClean(inline);
      }

      for (let j = i + 1; j <= i + 3 && j < lines.length; j += 1) {
        const next = clean(lines[j]);
        if (isLikelyPassportFieldValue(next, options.field)) {
          return upperClean(next);
        }
      }
    }
  }

  for (const line of lines) {
    for (const pattern of options.inlinePatterns) {
      const match = line.match(pattern);
      if (match?.[1] && isLikelyPassportFieldValue(match[1], options.field)) {
        return upperClean(match[1]);
      }
    }
  }

  for (const pattern of options.inlinePatterns) {
    const match = text.match(pattern);
    if (match?.[1] && isLikelyPassportFieldValue(match[1], options.field)) {
      return upperClean(match[1]);
    }
  }

  return "";
}

function extractPassportPlaceOfBirth(text: string, lines: string[]) {
  return extractPassportField(text, lines, {
    field: "place",
    labels: [
      "MEESHA DHALASHADA",
      "PLACE OF BIRTH",
      "MAHALI PA KUZALIWA",
      "DHALASHADA",
      "POB",
      "LIEU DE NAISSANCE",
      "BIRTH PLACE",
    ],
    inlinePatterns: [
      /(?:MEESHA\s*DHALASHADA|PLACE\s*OF\s*BIRTH|MAHALI\s*PA\s*KUZALIWA|POB)[:\s/\-|]+([A-Z][A-Z .'-]{2,40})/i,
    ],
  });
}

function extractPassportPlaceOfIssue(text: string, lines: string[]) {
  return extractPassportField(text, lines, {
    field: "place",
    labels: [
      "MEESHA LAGA BIXIYEY",
      "PLACE OF ISSUE",
      "ISSUED AT",
      "ISSUE PLACE",
      "LAGA BIXIYEY",
    ],
    inlinePatterns: [
      /(?:MEESHA\s*LAGA\s*BIXIYEY|PLACE\s*OF\s*ISSUE|ISSUED\s*AT)[:\s/\-|]+([A-Z][A-Z .'-]{2,40})/i,
    ],
  });
}

function extractPassportOccupation(text: string, lines: string[]) {
  return extractPassportField(text, lines, {
    field: "occupation",
    labels: [
      "SHAQADA",
      "OCCUPATION",
      "PROFESSION",
      "UTAIFU WA KAZI",
      "MAHALI PA KAZI",
      "KAZI",
    ],
    inlinePatterns: [
      /(?:SHAQADA|OCCUPATION|PROFESSION|MAHALI\s*PA\s*KAZI)[:\s/\-|]+([A-Z][A-Z .'-]{2,40})/i,
    ],
  });
}

function extractLabelValue(lines: string[], labels: string[]) {
  for (let i = 0; i < lines.length; i += 1) {
    const upper = lines[i].toUpperCase();
    for (const label of labels) {
      if (!upper.includes(label)) continue;

      const inline = lines[i]
        .slice(upper.indexOf(label) + label.length)
        .replace(/^[\s:/\-|]+/, "")
        .trim();

      if (inline.length >= 2 && !/^\d+$/.test(inline)) {
        return clean(inline);
      }

      for (let j = i + 1; j <= i + 2 && j < lines.length; j += 1) {
        const next = clean(lines[j]);
        if (next.length >= 2 && /[A-Za-z0-9]/.test(next)) {
          return next;
        }
      }
    }
  }
  return "";
}

function addPassportCandidate(
  candidates: Map<string, number>,
  raw: string,
  score: number
) {
  const normalized = normalizePassportNumber(raw);
  if (!isPassportNumberFormat(normalized)) return;
  candidates.set(normalized, Math.max(candidates.get(normalized) ?? 0, score));
}

function extractPassportNumber(text: string, lines: string[]) {
  const candidates = new Map<string, number>();
  const upper = text.toUpperCase();

  const labeledPatterns = [
    /(?:PASSPORT\s*(?:NO|NUMBER|#)?|NAMBARI YA PASI|N[ºO°]\s*DE PASSEPORT|LAMBAR(?:KA)?\s*BAASABOOR|BAASABOOR\s*(?:NO|NUMBER)?|NOOCA)[:\s\-]*([A-Z0-9]{6,12})/gi,
    /(?:PASSPORT|BAASABOOR)[^\n]{0,40}?([A-Z][0-9O]{7,9})/gi,
  ];
  for (const pattern of labeledPatterns) {
    for (const match of upper.matchAll(pattern)) {
      addPassportCandidate(candidates, match[1], 55);
    }
  }

  for (let i = 0; i < lines.length; i += 1) {
    const lineUpper = lines[i].toUpperCase();
    if (
      /PASSPORT|BAASABOOR|NAMBARI YA PASI|LAMBAR.*BAASABOOR|NOOCA|TYPE/i.test(
        lineUpper
      )
    ) {
      for (let j = i; j <= i + 3 && j < lines.length; j += 1) {
        const token = lines[j].match(/\b([A-Z][0-9O]{7,9})\b/i);
        if (token?.[1]) addPassportCandidate(candidates, token[1], 48);
      }
    }
  }

  for (const match of upper.matchAll(/\b([A-Z][0-9O]{7,9})\b/g)) {
    const idx = match.index ?? 0;
    const context = upper.slice(Math.max(0, idx - 40), idx + match[0].length + 20);
    if (/\bNID\b|N\.I\.D|NATIONAL ID|PERSONAL NO|2950/i.test(context)) {
      continue;
    }
    addPassportCandidate(candidates, match[1], 40);
  }

  const mrzLine2 = upper.replace(/\s+/g, "").match(
    /([A-Z0-9<]{9})[0-9]?[A-Z]{3}\d{6}[A-Z0-9<]{5,}/
  );
  if (mrzLine2?.[1]) {
    addPassportCandidate(candidates, mrzLine2[1], 65);
  }

  const ranked = [...candidates.entries()].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] ?? "";
}

function extractNationalIdNumber(text: string) {
  const labeled = text.match(
    /(?:NID|N\.I\.D|NATIONAL ID(?:ENTITY)?(?:\s*(?:NO|NUMBER))?|PERSONAL\s*(?:NO|NUMBER)|NAMBARI YA KIBINSI)[:\s\-#]*(\d{6,14})/i
  );
  if (labeled?.[1]) return labeled[1];

  const longNumeric = [...text.matchAll(/\b(\d{11,14})\b/g)].map((m) => m[1]);
  if (longNumeric.length === 0) return "";

  return longNumeric.sort((a, b) => b.length - a.length)[0] ?? "";
}

function extractPassportNames(text: string, lines: string[]) {
  const surname = upperClean(
    extractLabelValue(lines, [
      "SURNAME",
      "JINA LA UKOO",
      "NOM",
      "FAMILY NAME",
    ])
  );
  const givenNames = upperClean(
    extractLabelValue(lines, [
      "GIVEN NAME",
      "GIVEN NAMES",
      "MAJINA ALIYOPEWA",
      "PRENOMS",
      "PRENOM",
      "OTHER NAMES",
      "FIRST NAME",
    ])
  );

  if (surname || givenNames) {
    return {
      surname,
      givenNames,
      fullName: upperClean([givenNames, surname].filter(Boolean).join(" ")),
    };
  }

  const fullNameLabel = extractLabelValue(lines, ["NAME", "MAGACA", "FULL NAME"]);
  if (fullNameLabel && /[A-Za-z]/.test(fullNameLabel)) {
    const parts = upperClean(fullNameLabel).split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return {
        fullName: parts.join(" "),
        givenNames: parts.slice(0, -1).join(" "),
        surname: parts[parts.length - 1],
      };
    }
    return { fullName: parts[0] ?? "", givenNames: parts[0] ?? "", surname: "" };
  }

  const inlineName = text.match(
    /(?:^|\n)\s*NAME[:\s]+([A-Z][A-Z\s.'-]{4,60})/im
  );
  if (inlineName?.[1]) {
    const parts = upperClean(inlineName[1]).split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return {
        fullName: parts.join(" "),
        givenNames: parts.slice(0, -1).join(" "),
        surname: parts[parts.length - 1],
      };
    }
  }

  return { fullName: "", givenNames: "", surname: "" };
}

function extractPassportDates(text: string) {
  const monthDate =
    /(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s+(\d{4})/gi;
  const dashDate = /(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/g;

  const parsed: Array<{ formatted: string; year: number }> = [];

  for (const match of text.matchAll(monthDate)) {
    parsed.push({
      formatted: `${match[1].padStart(2, "0")} ${match[2].slice(0, 3).toUpperCase()} ${match[3]}`,
      year: Number(match[3]),
    });
  }

  for (const match of text.matchAll(dashDate)) {
    parsed.push({
      formatted: `${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}-${match[3]}`,
      year: Number(match[3]),
    });
  }

  parsed.sort((a, b) => a.year - b.year);
  return {
    dateOfBirth: parsed[0]?.formatted ?? "",
    expiryDate: parsed.length > 1 ? parsed[parsed.length - 1]?.formatted ?? "" : "",
    issueDate: parsed.length > 2 ? parsed[1]?.formatted ?? "" : "",
  };
}

export function parsePassportVisualText(text: string): Partial<IdDocumentDetails> {
  if (!isPassportDocumentText(text)) return {};

  const lines = text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const names = extractPassportNames(text, lines);
  const passportNumber = extractPassportNumber(text, lines);
  const nationalIdNumber = extractNationalIdNumber(text);
  const dates = extractPassportDates(text);

  const nationalityMatch = text.match(
    /(?:NATIONALITY|UTAIFA|NATIONALITE)[:\s-]*([A-Z]{2,12})/i
  );
  const nationality = nationalityMatch?.[1]
    ? upperClean(nationalityMatch[1]).slice(0, 12)
    : "";

  const sex = extractSexFromText(text, lines);

  const placeOfBirth = extractPassportPlaceOfBirth(text, lines);
  const placeOfIssue = extractPassportPlaceOfIssue(text, lines);
  const occupation = extractPassportOccupation(text, lines);

  return {
    documentType: "passport",
    ...names,
    documentNumber: passportNumber,
    nationality,
    dateOfBirth: dates.dateOfBirth,
    issueDate: dates.issueDate,
    expiryDate: dates.expiryDate,
    sex,
    placeOfBirth,
    placeOfIssue,
    occupation,
  };
}
