import type { IdDocumentDetails } from "./types";
import { extractSexFromText, normalizeSex } from "./extractSex";

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const upperClean = (value: string) => clean(value).toUpperCase();

const SOMALIA_ID_MARKERS =
  /SOOMAALIYA|SOMALIA|SOMALILAND|JAMHUURIYADDA|FEDERAL REPUBLIC OF SOMALIA|KAARKA AQOONSIGA|KAADHKA|MUWAADINKA|IDENTITY CARD|AQOONSIGA|LAMBAR(?:KA)?\s*AQOONSIGA|TIRSIGA|MAGACA\b|TAARIIKHDA|TAAR\.\s*DHAL|\bAQOONS|KAARKA|\bENTTY\b|LAMBAR(?:KA)?/i;

export function isSomaliaNationalIdText(text: string): boolean {
  if (/\bPASSPORT\b|\bBAASABOOR\b|P<[A-Z]{3}/i.test(text)) {
    return false;
  }
  if (/KITAMBULISHO|JAMHURI YA KENYA|REPUBLIC OF KENYA|MAISHA\s*NAMBA|\bKENYA\b/i.test(text)) {
    return false;
  }
  return SOMALIA_ID_MARKERS.test(text);
}

const DASH_DATE =
  /(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/g;

function formatDashDate(day: string, month: string, year: string) {
  return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
}

function extractDashDates(text: string) {
  const matches: Array<{ formatted: string; year: number }> = [];
  for (const match of text.matchAll(DASH_DATE)) {
    matches.push({
      formatted: formatDashDate(match[1], match[2], match[3]),
      year: Number(match[3]),
    });
  }
  return matches;
}

function isLabelNoise(value: string): boolean {
  return /^(?:NAME|SEX|GENDER|DATE|ISSUE|EXPIRY|NUMBER|IDENTITY|FATHER|MALE|FEMALE|BIRTH|CARD|HOLDER|SIGNATURE)$/i.test(
    clean(value)
  );
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

      if (
        inline.length >= 2 &&
        /[A-Za-z]/.test(inline) &&
        !/^(?:MALE|FEMALE|M|F)$/i.test(inline) &&
        !isLabelNoise(inline)
      ) {
        return clean(inline);
      }

      for (let j = i + 1; j <= i + 2 && j < lines.length; j += 1) {
        const next = clean(lines[j]);
        if (
          next.length >= 2 &&
          /[A-Za-z]/.test(next) &&
          !/^(?:MALE|FEMALE|M|F)$/i.test(next) &&
          !/^(?:FATHER|AABBaha|MAGACA AABBAHA)/i.test(next) &&
          !isLabelNoise(next)
        ) {
          return next;
        }
      }
    }
  }
  return "";
}

function isLikelyName(value: string) {
  const cleaned = upperClean(value);
  if (cleaned.length < 3 || cleaned.length > 80) return false;
  if (/\d/.test(cleaned)) return false;
  if (
    /SOMALIA|SOOMAALIYA|SOMALILAND|JAMHUURI|REPUBLIC|IDENTITY|AQOONSIGA|KAADHKA|TIRSIGA|FEDERAL|CARD|MAGACA|TAARIIKH|LAMBAR|FATHER|AABBaha|JINSIGA|SEX|DATE|ISSUE|EXPIR|HOLDER|SIGNATURE|MUWAADINKA|TIC|OF|ERA|FEDERAL/i.test(
      cleaned
    )
  ) {
    return false;
  }
  return /^[A-Z][A-Z\s.'-]+$/.test(cleaned);
}

function splitFullName(fullName: string) {
  const parts = clean(fullName).split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { fullName: "", givenNames: "", surname: "" };
  }
  if (parts.length === 1) {
    return { fullName: parts[0], givenNames: parts[0], surname: "" };
  }
  const surname = parts[parts.length - 1];
  const givenNames = parts.slice(0, -1).join(" ");
  return {
    fullName: parts.join(" "),
    givenNames,
    surname,
  };
}

/** Somalia national ID: 11 digits, starts with 2 then 3–9. */
export function isValidSomaliaNationalIdNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return /^2[3-9]\d{9}$/.test(digits);
}

function pickValidatedSomaliaId(candidates: string[]): string {
  const scored = candidates
    .map((raw) => raw.replace(/\D/g, ""))
    .filter((digits) => isValidSomaliaNationalIdNumber(digits))
    .map((digits) => {
      let score = 0;
      if (digits.length === 11) score += 20;
      if (/^236\d{8}$/.test(digits)) score += 10;
      return { digits, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored[0]?.digits ?? "";
}

function extractSomaliaIdentityNumberFromLines(lines: string[]) {
  for (let i = 0; i < lines.length; i += 1) {
    const upper = lines[i].toUpperCase();
    if (
      !/\bIDENTITY\s*NUMBER\b|LAMBAR(?:KA)?\s*AQOONS|AQOONSIGA\s*(?:NO|NUMBER|#)?|TIRSIGA\s*AQOONS|LAMBAR\s*AQOONS|\bAQOONSIGA\b/i.test(
        upper
      )
    ) {
      continue;
    }
    if (/\bID\s*NUMBER\b/i.test(upper) && !/\bIDENTITY\s*NUMBER\b/i.test(upper)) {
      continue;
    }

    const inline = lines[i].match(
      /\bIDENTITY\s*NUMBER\b[:\s./\-|]*(\d{8,14})/i
    );
    if (inline?.[1]) {
      const validated = pickValidatedSomaliaId([inline[1]]);
      if (validated) return validated;
    }

    for (let j = i; j <= i + 4 && j < lines.length; j += 1) {
      const line = lines[j];
      const exact = line.replace(/\D/g, "");
      if (isValidSomaliaNationalIdNumber(exact)) return exact;
      const embedded = line.match(/2[3-9]\d{9}/);
      if (embedded?.[0] && isValidSomaliaNationalIdNumber(embedded[0])) {
        return embedded[0];
      }
    }
  }
  return "";
}

function extractSomaliaIdentityNumber(text: string, lines: string[]) {
  const fromLines = extractSomaliaIdentityNumberFromLines(lines);
  if (fromLines) return fromLines;

  const hyphenated = text.match(
    /(?:TIRSIGA\s*AQOONSIGA|IDENTITY\s*(?:NO|NUMBER|#)?|LAMBAR(?:KA)?\s*AQOONSIGA|AQOONSIGA\s*(?:NO|NUMBER|#)?|ID\s*(?:NO|NUMBER|#)?)[:\s.\-]*(\d{6}-\d{8})/i
  );
  if (hyphenated?.[1]) return hyphenated[1];

  const standaloneHyphen = text.match(/\b(\d{6}-\d{8})\b/);
  if (standaloneHyphen?.[1]) return standaloneHyphen[1];

  const labeled = text.match(
    /(?:LAMBAR(?:KA)?\s*AQOONSIGA|Lambarka\s*aqoonsiga|\bIDENTITY\s*NUMBER\b|AQOONSIGA\s*(?:NO|NUMBER|#)?)[:\s.\-/|]*(\d{8,14})/i
  );
  if (labeled?.[1]) {
    const validated = pickValidatedSomaliaId([labeled[1]]);
    if (validated) return validated;
  }

  const candidates = [...text.matchAll(/\b(\d{8,14})\b/g)].map((m) => m[1]);
  const digitBlob = text.replace(/\D/g, "");
  for (const match of digitBlob.matchAll(/2[3-9]\d{9}/g)) {
    candidates.push(match[0]);
  }

  return pickValidatedSomaliaId(candidates);
}

function extractSomalilandSplitNames(lines: string[]) {
  for (let i = 0; i < lines.length; i += 1) {
    if (!/\bMAGACA\b/i.test(lines[i])) continue;

    const nameLines: string[] = [];
    for (let j = i + 1; j <= i + 4 && j < lines.length; j += 1) {
      const candidate = upperClean(lines[j]);
      if (!isLikelyName(candidate)) break;
      if (candidate.split(/\s+/).length <= 4) {
        nameLines.push(candidate);
      }
    }

    if (nameLines.length >= 2) {
      const surname = nameLines[0];
      const givenNames = nameLines.slice(1).join(" ");
      return {
        surname,
        givenNames,
        fullName: [givenNames, surname].filter(Boolean).join(" "),
      };
    }
  }
  return null;
}

function extractSomaliaNames(text: string, lines: string[]) {
  const splitNames = extractSomalilandSplitNames(lines);
  if (splitNames) return splitNames;
  const fromLabel = extractLabelValue(lines, [
    "MAGACA",
    "NAME",
    "FULL NAME",
    "SURNAME",
  ]);

  if (fromLabel && isLikelyName(fromLabel)) {
    if (/SURNAME/i.test(text) && /GIVEN/i.test(text)) {
      const surname = extractLabelValue(lines, ["SURNAME", "FAMILY NAME"]);
      const givenNames = extractLabelValue(lines, [
        "GIVEN NAME",
        "GIVEN NAMES",
        "OTHER NAMES",
      ]);
      if (surname || givenNames) {
        return {
          surname: upperClean(surname),
          givenNames: upperClean(givenNames),
          fullName: upperClean([givenNames, surname].filter(Boolean).join(" ")),
        };
      }
    }
    return splitFullName(upperClean(fromLabel));
  }

  const inlineName = text.match(
    /(?:Magaca|NAME)[:\s/\n]+([A-Za-z][A-Za-z\s.'-]{3,60})/i
  );
  if (inlineName?.[1] && isLikelyName(inlineName[1])) {
    return splitFullName(upperClean(inlineName[1]));
  }

  for (const line of lines) {
    const candidate = upperClean(line);
    if (isLikelyName(candidate) && candidate.split(/\s+/).length >= 2) {
      return splitFullName(candidate);
    }
  }

  return { fullName: "", givenNames: "", surname: "" };
}

export function parseSomaliaNationalIdText(text: string): Partial<IdDocumentDetails> {
  if (!isSomaliaNationalIdText(text)) return {};

  const normalized = text.replace(/\r/g, "");
  const lines = normalized
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const dates = extractDashDates(normalized);
  dates.sort((a, b) => a.year - b.year);

  const dateOfBirth = dates[0]?.formatted ?? "";
  const issueDate =
    dates.length === 2
      ? dates[1]?.formatted ?? ""
      : dates.length > 2
        ? dates[1]?.formatted ?? ""
        : "";
  const expiryDate =
    dates.length > 2 ? dates[dates.length - 1]?.formatted ?? "" : "";

  const sexMatch =
    normalized.match(/(?:JINSIGA|SEX|GENDER|LAB\s*DHEDDIG)[:\s-]*([MF]|MALE|FEMALE)/i) ??
    normalized.match(/\b(FEMALE|MALE)\b/i);
  const sex = extractSexFromText(normalized, lines) || normalizeSex(sexMatch?.[1] ?? sexMatch?.[0] ?? "");

  const names = extractSomaliaNames(normalized, lines);

  return {
    documentType: "national_id",
    ...names,
    documentNumber: extractSomaliaIdentityNumber(normalized, lines),
    nationality: "SOM",
    dateOfBirth,
    sex,
    issueDate,
    expiryDate,
  };
}
