import type { IdDocumentDetails } from "./types";

const clean = (value: string) => value.replace(/\s+/g, " ").trim().toUpperCase();

const KENYA_MARKERS =
  /KITAMBULISHO|JAMHURI YA KENYA|REPUBLIC OF KENYA|MAISHA|DISTRICT OF BIRTH|SERIAL NUMBER|FULL NAMES?/i;

export function isKenyaNationalIdText(text: string): boolean {
  if (/\bPASSPORT\b|\bBAASABOOR\b|P<[A-Z]{3}/i.test(text)) {
    return false;
  }
  if (
    /SOMALILAND|SOOMAALIYA|FEDERAL REPUBLIC OF SOMALIA|KAADHKA|KAARKA AQOONSIGA|TIRSIGA AQOONSIGA|AQOONSIGA MUWAADINKA/i.test(
      text
    )
  ) {
    return false;
  }
  if (KENYA_MARKERS.test(text)) return true;
  if (/\bJAMHURI\b/i.test(text) && /\bKENYA\b/i.test(text)) return true;
  if (/\bID\s*NUMBER\b/i.test(text) && /\b(?:DATE OF BIRTH|DATE OF ISSUE|BIRTH)\b/i.test(text)) {
    return true;
  }
  if (
    /\b\d{9,10}\b/.test(text) &&
    /\b\d{7,8}\b/.test(text) &&
    /\b(?:FEMALE|MALE|KEN\b|HOLDER'?S?\s*SIGN)/i.test(text)
  ) {
    return true;
  }
  return false;
}

/** Kenya national ID: 7–8 digits. Excludes 9+ digit serial numbers. */
export function isValidKenyaNationalIdNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{7,8}$/.test(digits)) return false;
  return true;
}

function isLikelyKenyaSerialNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return /^\d{9,10}$/.test(digits);
}

const DATE_VALUE = /(\d{1,2})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{4})/;

function formatKenyaDate(day: string, month: string, year: string) {
  return `${day.padStart(2, "0")}.${month.padStart(2, "0")}.${year}`;
}

function parseDateMatch(match: RegExpMatchArray | null) {
  if (!match?.[1]) return "";
  return formatKenyaDate(match[1], match[2], match[3]);
}

function extractLabeledDate(
  text: string,
  lines: string[],
  labels: string[]
): string {
  for (let i = 0; i < lines.length; i += 1) {
    const upper = lines[i].toUpperCase();
    for (const label of labels) {
      const labelIndex = upper.indexOf(label);
      if (labelIndex < 0) continue;

      const inline = lines[i].slice(labelIndex + label.length);
      const inlineDate = parseDateMatch(inline.match(DATE_VALUE));
      if (inlineDate) return inlineDate;

      for (let j = i + 1; j <= i + 2 && j < lines.length; j += 1) {
        const nextDate = parseDateMatch(lines[j].match(DATE_VALUE));
        if (nextDate) return nextDate;
      }
    }
  }

  for (const label of labels) {
    const pattern = new RegExp(
      `${label.replace(/\s+/g, "\\s+")}[\\s:/\\-|]*${DATE_VALUE.source}`,
      "i"
    );
    const match = text.match(pattern);
    const parsed = parseDateMatch(match);
    if (parsed) return parsed;
  }

  return "";
}

const DOT_DATE = /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/g;

function extractDotDates(text: string) {
  const matches: Array<{ formatted: string; year: number }> = [];
  for (const match of text.matchAll(DOT_DATE)) {
    const formatted = formatKenyaDate(match[1], match[2], match[3]);
    matches.push({ formatted, year: Number(match[3]) });
  }
  return matches;
}

function isInvalidKenyaPersonName(value: string): boolean {
  const cleaned = clean(value);
  if (!cleaned || cleaned.length < 3) return true;
  if (/^SER[\s-]/i.test(cleaned)) return true;
  if (/\d/.test(cleaned)) return true;
  if (
    /^(MALE|FEMALE|KEN|KENYA|MAISHA|JAMHURI|REPUBLIC|NATIONAL|IDENTITY|CARD|SERIAL|SQUARE|CENTRAL|KITAMBULISHO|NAMBARI)/i.test(
      cleaned
    )
  ) {
    return true;
  }
  return false;
}

function splitKenyaFullName(fullName: string) {
  const parts = clean(fullName).split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { fullName: "", givenNames: "", surname: "" };
  }
  if (parts.length === 1) {
    return { fullName: parts[0], givenNames: parts[0], surname: "" };
  }
  return {
    fullName: parts.join(" "),
    givenNames: parts.slice(0, -1).join(" "),
    surname: parts[parts.length - 1],
  };
}

function fixOcrTypos(value: string) {
  return value
    .replace(/\bNYERT\b/g, "NYERI")
    .replace(/\bJAMNURI\b/g, "JAMHURI")
    .replace(/\bJAMNURIYA\b/g, "JAMHURI YA")
    .replace(/\bSR\s+NM\b/g, "HDM")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function lettersOnly(value: string) {
  return value.replace(/[^A-Za-z\s]/g, " ").replace(/\s+/g, " ").trim();
}

const NEXT_FIELD_LABEL =
  /\b(?:FULL\s+NAMES?|GIVEN\s+NAME|GIVEN\s+NAMES|OTHER\s+NAMES|FIRST\s+NAME|SURNAME|FAMILY\s+NAME|SEX|NATIONALITY|DATE\s+OF|PLACE\s+OF|DISTRICT\s+OF|ID\s+NUMBER|SERIAL|EXPIR|ISSUE|KITAMBULISHO|REPUBLIC|JAMHURI|MAISHA|HOLDER)\b/i;

function truncateAtNextLabel(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(NEXT_FIELD_LABEL);
  if (!match || match.index === undefined || match.index === 0) {
    return trimmed;
  }
  return trimmed.slice(0, match.index).trim();
}

function extractLabelValue(lines: string[], labels: string[]) {
  for (let i = 0; i < lines.length; i += 1) {
    const upper = lines[i].toUpperCase();
    for (const label of labels) {
      const labelIndex = upper.indexOf(label);
      if (labelIndex < 0) continue;

      const inline = truncateAtNextLabel(
        lines[i].slice(labelIndex + label.length).replace(/^[\s:/-]+/, "")
      );

      if (inline.length >= 2 && !/^\d/.test(inline)) {
        const value = fixOcrTypos(inline);
        if (!isInvalidKenyaPersonName(value)) return value;
      }

      const next = truncateAtNextLabel(lines[i + 1]?.trim() ?? "");
      if (next.length >= 2 && !isInvalidKenyaPersonName(next)) {
        return fixOcrTypos(next);
      }
    }
  }
  return "";
}

function ocrDigitsOnly(value: string) {
  return value
    .replace(/[OQ]/g, "0")
    .replace(/[Il|]/g, "1")
    .replace(/[S$]/g, "5")
    .replace(/[Bb]/g, "8")
    .replace(/[Zz]/g, "2")
    .replace(/\D/g, "");
}

function normalizeKenyaIdNumber(raw: string): string {
  return ocrDigitsOnly(raw);
}

function collectExcludedIdNumbers(lines: string[]): Set<string> {
  const excluded = new Set<string>();

  for (let i = 0; i < lines.length; i += 1) {
    const upper = lines[i].toUpperCase();
    const isSerialLine =
      /\bSERIAL\s*(?:NO\.?|NUMBER)?\b/.test(upper) || /\b\d{9,10}\b/.test(lines[i]);

    if (!isSerialLine) continue;

    const inline = lines[i].match(/\b(\d{8,10})\b/);
    if (inline?.[1]) excluded.add(normalizeKenyaIdNumber(inline[1]));

    for (let j = i + 1; j <= i + 2 && j < lines.length; j += 1) {
      const next = lines[j].match(/\b(\d{8,10})\b/);
      if (next?.[1] && isLikelyKenyaSerialNumber(next[1])) {
        excluded.add(normalizeKenyaIdNumber(next[1]));
      }
    }
  }

  return excluded;
}

function extractDigitsNearLabel(lines: string[], labels: string[]): string {
  for (let i = 0; i < lines.length; i += 1) {
    const upper = lines[i].toUpperCase();
    for (const label of labels) {
      const labelIndex = upper.indexOf(label);
      if (labelIndex < 0) continue;

      const inline = lines[i].slice(labelIndex + label.length);
      const inlineMatch = inline.match(/[:\s./-]*([0-9OIlSB$|ZzBbQ]{6,10})/);
      if (inlineMatch?.[1]) {
        const normalized = normalizeKenyaIdNumber(inlineMatch[1]);
        if (isValidKenyaNationalIdNumber(normalized)) return normalized;
      }

      for (let j = i + 1; j <= i + 3 && j < lines.length; j += 1) {
        const nextLine = lines[j];
        if (
          /SERIAL|DATE|BIRTH|ISSUE|NAME|SEX|DISTRICT|PLACE|HOLDER|SIGN|FULL|SURNAME|GIVEN/i.test(
            nextLine
          )
        ) {
          break;
        }
        const match = nextLine.match(/\b([0-9OIlSB$|ZzBbQ]{6,10})\b/);
        if (!match?.[1]) continue;
        const normalized = normalizeKenyaIdNumber(match[1]);
        if (isValidKenyaNationalIdNumber(normalized)) return normalized;
      }
    }
  }

  return "";
}

function extractKenyaIdNumberFromLines(lines: string[], excluded: Set<string>): string {
  const fromIdLabel = extractDigitsNearLabel(lines, [
    "ID NUMBER",
    "ID NO.",
    "ID NO",
    "NAMBARI YA UTAMBULISHO",
  ]);
  if (fromIdLabel && !excluded.has(fromIdLabel)) return fromIdLabel;

  return "";
}

function extractKenyaIdFromSplitLines(lines: string[], excluded: Set<string>): string {
  for (let i = 0; i < lines.length; i += 1) {
    if (/\bSERIAL\b/i.test(lines[i])) continue;

    const digits = normalizeKenyaIdNumber(lines[i]);
    if (!/^\d{3,7}$/.test(digits)) continue;

    const merged = [digits];
    for (let j = i + 1; j <= i + 2 && j < lines.length; j += 1) {
      if (/SERIAL|DATE|BIRTH|ISSUE|NAME|SEX|DISTRICT|PLACE|HOLDER|SIGN/i.test(lines[j])) {
        break;
      }
      const nextDigits = normalizeKenyaIdNumber(lines[j]);
      if (/^\d{1,5}$/.test(nextDigits)) merged.push(nextDigits);
    }

    const combined = merged.join("");
    if (isValidKenyaNationalIdNumber(combined) && !excluded.has(combined)) {
      return combined;
    }
  }

  return "";
}

function scoreKenyaIdCandidate(
  value: string,
  context: {
    excluded: Set<string>;
    nearIdLabel: boolean;
    onSerialLine: boolean;
  }
): number {
  if (!isValidKenyaNationalIdNumber(value)) return -999;
  if (context.excluded.has(value)) return -999;
  if (context.onSerialLine) return -999;

  let score = value.length === 8 ? 15 : 10;
  if (context.nearIdLabel) score += 40;
  return score;
}

function extractIdNumbers(text: string, lines: string[]) {
  const excluded = collectExcludedIdNumbers(lines);

  const fromLines = extractKenyaIdNumberFromLines(lines, excluded);
  if (fromLines) return fromLines;

  const labeled = text.match(
    /\b(?:ID\s*NUMBER|ONSEN|UTAMBULISHO)\b[:\s./-]*([0-9OIlSB$|ZzBbQ]{6,10})/i
  );
  if (labeled?.[1]) {
    const normalized = normalizeKenyaIdNumber(labeled[1]);
    if (isValidKenyaNationalIdNumber(normalized) && !excluded.has(normalized)) {
      return normalized;
    }
  }

  const swahili = text.match(
    /NAMBARI\s*YA\s*UTAMBULISHO[:\s./-]*([0-9OIlSB$|ZzBbQ]{6,10})/i
  );
  if (swahili?.[1]) {
    const normalized = normalizeKenyaIdNumber(swahili[1]);
    if (isValidKenyaNationalIdNumber(normalized) && !excluded.has(normalized)) {
      return normalized;
    }
  }

  const fromSplit = extractKenyaIdFromSplitLines(lines, excluded);
  if (fromSplit) return fromSplit;

  const scores = new Map<string, number>();

  for (let i = 0; i < lines.length; i += 1) {
    const upper = lines[i].toUpperCase();
    if (/\bSERIAL\b/.test(upper) || /\b\d{9,10}\b/.test(lines[i])) continue;
    const onSerialLine = false;
    const nearIdLabel = /\bID\s*NUMBER\b|\bID\s*NO\.?\b|NAMBARI\s*YA\s*UTAMBULISHO|ONSEN|UTAMBULISHO/i.test(upper);
    const context = { excluded, nearIdLabel, onSerialLine };

    for (const match of lines[i].matchAll(/\b(\d{7,8})\b/g)) {
      const normalized = normalizeKenyaIdNumber(match[1]);
      const score = scoreKenyaIdCandidate(normalized, context);
      if (score > -999) {
        scores.set(normalized, Math.max(scores.get(normalized) ?? 0, score));
      }
    }
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] ?? "";
}

function extractPlaceOfBirth(text: string, lines: string[]) {
  const fromLabel = extractLabelValue(lines, [
    "DISTRICT OF BIRTH",
    "PLACE OF BIRTH",
    "POB",
  ]);
  if (fromLabel) return fixOcrTypos(clean(fromLabel));

  const labeled = text.match(
    /(?:DISTRICT OF BIRTH|PLACE OF BIRTH|POB)[:\s-]+([A-Z][A-Z\s.'-]{2,40})/i
  );
  if (labeled?.[1]) return fixOcrTypos(clean(labeled[1]));

  const fuzzy = text.match(/\b(NYERI|NAIROBI|MOMBASA|KISUMU|NAKURU|ELDORET)[A-Z\s]{0,20}/i);
  if (fuzzy?.[0]) {
    let place = fixOcrTypos(clean(fuzzy[0]));
    place = place.replace(/\s+(YS|Y\)|~).*$/i, "").trim();
    return place;
  }

  return "";
}

function extractPlaceOfIssue(text: string, lines: string[]) {
  const fromLabel = extractLabelValue(lines, ["PLACE OF ISSUE", "ISSUED AT"]);
  if (fromLabel) {
    const value = fixOcrTypos(clean(fromLabel));
    if (!DATE_VALUE.test(value) && !/^SER[\s-]/i.test(value)) {
      return value;
    }
  }

  const labeled = text.match(
    /(?:PLACE OF ISSUE|ISSUED AT)[:\s-]+([A-Z][A-Z0-9\s.'-]{2,40})/i
  );
  if (labeled?.[1]) {
    const value = fixOcrTypos(clean(labeled[1]));
    if (!DATE_VALUE.test(value) && !/^SER[\s-]/i.test(value)) {
      return value;
    }
  }

  const fuzzy = text.match(/\bH?D?M\s+CITY\s+SQUARE\b/i);
  if (fuzzy?.[0]) return fixOcrTypos(clean(fuzzy[0].replace(/^SR\s+NM/i, "HDM")));

  return "";
}

function pickBestCandidate(candidates: Map<string, number>) {
  const ranked = [...candidates.entries()].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] ?? "";
}

function isIgnoredKenyaNameLine(value: string): boolean {
  return /KENYA|KITAMBULISHO|JAMHURI|NATIONAL|IDENTITY|MALE|FEMALE|KEN\b|MAISHA|HOLDER|SIGN|SERIAL|DISTRICT|PLACE|DATE|ISSUE|BIRTH|EXPIR|REPUBLIC|CARD|NAMBARI|SER[\s-]|THIKA|JUJA|NYERI|NAIROBI|MOMBASA|KISUMU|NAKURU|ELDORET|WEST|SQUARE|CENTRAL|HDM/i.test(
    value
  );
}

function parsePersonNameLine(line: string): string {
  const stripped = clean(lettersOnly(line));
  if (stripped.length < 4 || stripped.length > 60) return "";
  if (!/^[A-Z][A-Z\s'-]+$/.test(stripped)) return "";
  if (isIgnoredKenyaNameLine(stripped)) return "";
  if (isInvalidKenyaPersonName(stripped)) return "";

  const words = stripped.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 5) return "";
  return stripped;
}

function extractNameNearIdNumber(lines: string[]): string {
  for (let i = 0; i < lines.length; i += 1) {
    if (/\bSERIAL\b/i.test(lines[i])) continue;
    if (/\b\d{9,10}\b/.test(lines[i])) continue;

    const idMatch = lines[i].match(/\b(\d{7,8})\b/);
    if (!idMatch) continue;
    const idDigits = normalizeKenyaIdNumber(idMatch[1]);
    if (!isValidKenyaNationalIdNumber(idDigits)) continue;

    for (let j = i + 1; j <= i + 5 && j < lines.length; j += 1) {
      if (/DATE|BIRTH|SEX|DISTRICT|SERIAL|HOLDER|JAMHURI|REPUBLIC|PLACE/i.test(lines[j])) {
        break;
      }
      const name = parsePersonNameLine(lines[j]);
      if (name) return name;
    }
  }
  return "";
}

function extractNameBeforeBirth(lines: string[]): string {
  for (let i = 0; i < lines.length; i += 1) {
    if (!/\bBIRTH\b|DATE OF BIRTH/i.test(lines[i])) continue;

    for (let j = i - 1; j >= Math.max(0, i - 4); j -= 1) {
      const name = parsePersonNameLine(lines[j]);
      if (name) return name;
    }
  }
  return "";
}

function extractNameFromTextScan(text: string): string {
  const candidates = new Map<string, number>();

  for (const match of text.matchAll(/\b([A-Z][A-Z]{1,}(?:\s+[A-Z][A-Z]{1,}){1,4})\b/g)) {
    const name = parsePersonNameLine(match[1]);
    if (!name) continue;
    const score = name.split(/\s+/).length * 10 + name.length;
    candidates.set(name, Math.max(candidates.get(name) ?? 0, score));
  }

  const ranked = [...candidates.entries()].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] ?? "";
}

function scoreKenyaNameLine(name: string, lineIndex: number, lines: string[]): number {
  let score = name.split(/\s+/).length * 10 + name.length;
  const prev = lines[lineIndex - 1] ?? "";
  const next = lines[lineIndex + 1] ?? "";
  if (/\b\d{7,8}\b/.test(prev) && !/\b\d{9,10}\b/.test(prev)) score += 40;
  if (/\b(?:DATE OF BIRTH|BIRTH|DOB)\b/i.test(next)) score += 40;
  if (/\b(?:FULL NAMES?|SURNAME|GIVEN NAME)\b/i.test(prev)) score += 30;
  return score;
}

function extractKenyaNames(_text: string, lines: string[]) {
  const fullNameFromLabel = extractLabelValue(lines, [
    "FULL NAMES",
    "FULL NAME",
    "FULLNAME",
  ]);
  if (fullNameFromLabel && !isInvalidKenyaPersonName(fullNameFromLabel)) {
    const parsed = parsePersonNameLine(fullNameFromLabel);
    if (parsed) return splitKenyaFullName(parsed);
  }

  const surnameFromLabel = extractLabelValue(lines, ["SURNAME", "FAMILY NAME"]);
  const givenFromLabel = extractLabelValue(lines, [
    "GIVEN NAME",
    "GIVEN NAMES",
    "OTHER NAMES",
    "FIRST NAME",
  ]);

  if (surnameFromLabel || givenFromLabel) {
    const surname = parsePersonNameLine(surnameFromLabel) || clean(surnameFromLabel);
    const givenNames = parsePersonNameLine(givenFromLabel) || clean(givenFromLabel);
    const validSurname = surname && !isInvalidKenyaPersonName(surname);
    const validGiven = givenNames && !isInvalidKenyaPersonName(givenNames);
    const combinedName = clean(
      [validGiven ? givenNames : "", validSurname ? surname : ""]
        .filter(Boolean)
        .join(" ")
    );
    if (combinedName.split(/\s+/).length >= 2) {
      const split = splitKenyaFullName(combinedName);
      if (split.fullName) return split;
    }
  }

  const fullNameCandidates = new Map<string, number>();
  for (let i = 0; i < lines.length; i += 1) {
    const name = parsePersonNameLine(lines[i]);
    if (!name) continue;
    const score = scoreKenyaNameLine(name, i, lines);
    fullNameCandidates.set(name, Math.max(fullNameCandidates.get(name) ?? 0, score));
  }

  const bestFullName = pickBestCandidate(fullNameCandidates);
  if (bestFullName) {
    return splitKenyaFullName(bestFullName);
  }

  const positionalName =
    extractNameNearIdNumber(lines) ||
    extractNameBeforeBirth(lines) ||
    extractNameFromTextScan(_text);
  if (positionalName) {
    return splitKenyaFullName(positionalName);
  }

  return { surname: "", givenNames: "", fullName: "" };
}

export function parseKenyaNationalIdText(text: string): Partial<IdDocumentDetails> {
  if (!isKenyaNationalIdText(text)) return {};

  const normalized = fixOcrTypos(text.replace(/\r/g, ""));
  const lines = normalized
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const dateOfBirth =
    extractLabeledDate(normalized, lines, [
      "DATE OF BIRTH",
      "DOB",
      "D.O.B",
    ]) || "";
  const issueDate =
    extractLabeledDate(normalized, lines, [
      "DATE OF ISSUE",
      "ISSUE DATE",
      "ISSUED ON",
    ]) || "";
  let expiryDate =
    extractLabeledDate(normalized, lines, [
      "DATE OF EXPIRY",
      "EXPIRY DATE",
      "EXPIRES",
      "EXP",
    ]) || "";

  const dates = extractDotDates(normalized);
  dates.sort((a, b) => a.year - b.year);

  const resolvedDateOfBirth =
    dateOfBirth || dates[0]?.formatted || "";
  if (!expiryDate && dates.length > 0) {
    const expiryCandidates = dates
      .map((entry) => entry.formatted)
      .filter(
        (value) => value !== resolvedDateOfBirth && value !== issueDate
      );
    if (expiryCandidates.length > 0) {
      expiryDate = expiryCandidates[expiryCandidates.length - 1];
    }
  }

  const nationalityMatch = normalized.match(/\bKEN\b/) ?? normalized.match(/\bMA\s+KEN\b/i);
  const nationality = nationalityMatch ? "KEN" : "";

  const sexMatch =
    normalized.match(/\b(MALE|FEMALE)\b/i) ??
    normalized.match(/\bMAIK\b/i) ??
    normalized.match(/\bM[AO][LI][EK]\b/i);
  const sex = sexMatch?.[0]?.toUpperCase().startsWith("F") ? "F" : sexMatch ? "M" : "";

  const names = extractKenyaNames(normalized, lines);

  return {
    documentType: "national_id",
    ...names,
    documentNumber: extractIdNumbers(normalized, lines),
    nationality,
    dateOfBirth: resolvedDateOfBirth,
    sex,
    expiryDate,
    issueDate,
    placeOfBirth: extractPlaceOfBirth(normalized, lines),
    placeOfIssue: extractPlaceOfIssue(normalized, lines),
  };
}
