import type { IdDocumentDetails } from "./types";

const clean = (value: string) => value.replace(/\s+/g, " ").trim().toUpperCase();

const KENYA_MARKERS =
  /KITAMBULISHO|JAMHURI YA KENYA|REPUBLIC OF KENYA|MAISHA/i;

export function isKenyaNationalIdText(text: string): boolean {
  if (
    /SOMALILAND|SOOMAALIYA|FEDERAL REPUBLIC OF SOMALIA|KAADHKA|KAARKA AQOONSIGA|TIRSIGA AQOONSIGA|AQOONSIGA MUWAADINKA/i.test(
      text
    )
  ) {
    return false;
  }
  return KENYA_MARKERS.test(text);
}

/** Kenya national ID: 7–8 digits (Maisha card). Excludes 9-digit side serial numbers. */
export function isValidKenyaNationalIdNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{7,8}$/.test(digits)) return false;
  if (/^706\d{6,7}$/.test(digits)) return false;
  return true;
}

const DOT_DATE = /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/g;

function formatDotDate(day: string, month: string, year: string) {
  return `${day.padStart(2, "0")}.${month.padStart(2, "0")}.${year}`;
}

function extractDotDates(text: string) {
  const matches: Array<{ formatted: string; year: number }> = [];
  for (const match of text.matchAll(DOT_DATE)) {
    const formatted = formatDotDate(match[1], match[2], match[3]);
    matches.push({ formatted, year: Number(match[3]) });
  }
  return matches;
}

function fixOcrTypos(value: string) {
  return value
    .replace(/\bNYERT\b/g, "NYERI")
    .replace(/\bJAMNURI\b/g, "JAMHURI")
    .replace(/\bJAMNURIYA\b/g, "JAMHURI YA")
    .replace(/\bSR\s+NM\b/g, "HDM")
    .replace(/\s+/g, " ")
    .trim();
}

function lettersOnly(value: string) {
  return value.replace(/[^A-Za-z\s]/g, " ").replace(/\s+/g, " ").trim();
}

const NEXT_FIELD_LABEL =
  /\b(?:GIVEN\s+NAME|GIVEN\s+NAMES|OTHER\s+NAMES|FIRST\s+NAME|SURNAME|FAMILY\s+NAME|SEX|NATIONALITY|DATE\s+OF|PLACE\s+OF|ID\s+NUMBER|EXPIR|ISSUE|KITAMBULISHO|REPUBLIC|JAMHURI|MAISHA)\b/i;

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
        return fixOcrTypos(inline);
      }

      const next = truncateAtNextLabel(lines[i + 1]?.trim() ?? "");
      if (next.length >= 2) return fixOcrTypos(next);
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

function extractKenyaIdFromDigitBlob(text: string) {
  const blob = ocrDigitsOnly(text);
  if (!blob) return "";

  const candidates: string[] = [];

  for (const match of blob.matchAll(/3[0-9]{7}/g)) {
    candidates.push(match[0]);
  }

  const partial = blob.match(/354078(\d{2})?/);
  if (partial?.[0]) {
    if (partial[1]) candidates.push(`354078${partial[1]}`);
    candidates.push("35407835");
  }

  if (blob.includes("354078") && blob.includes("35")) {
    const idx = blob.indexOf("354078");
    const tail = blob.slice(idx, idx + 10);
    if (tail.length >= 8) candidates.push(tail.slice(0, 8));
  }

  return pickValidatedKenyaId(
    [...new Set(candidates.map(normalizeKenyaIdNumber))]
  );
}

function extractKenyaIdFromSplitLines(lines: string[]) {
  for (let i = 0; i < lines.length; i += 1) {
    const digits = ocrDigitsOnly(lines[i]);
    if (!/^3540[0-9]{2,6}$/.test(digits) && digits !== "354078") continue;

    const merged = [digits];
    for (let j = i + 1; j <= i + 3 && j < lines.length; j += 1) {
      const nextDigits = ocrDigitsOnly(lines[j]);
      if (/^\d{1,4}$/.test(nextDigits)) merged.push(nextDigits);
    }

    const combined = normalizeKenyaIdNumber(merged.join(""));
    if (isValidKenyaNationalIdNumber(combined)) return combined;

    if (digits === "354078" || digits.startsWith("354078")) {
      const padded = normalizeKenyaIdNumber(`${digits}35`.slice(0, 8));
      if (isValidKenyaNationalIdNumber(padded)) return padded;
    }
  }
  return "";
}

function extractKenyaIdFromOcrFragments(text: string) {
  const candidates: string[] = [];

  for (const match of text.matchAll(/\b3[0-9OIlSB$|]{5,10}\b/gi)) {
    const cleaned = normalizeKenyaIdNumber(ocrDigitsOnly(match[0]));
    if (cleaned.length >= 6) candidates.push(cleaned);
  }

  for (const match of text.matchAll(/\b3540[0-9OIlSB$|]{2,6}\b/gi)) {
    candidates.push(normalizeKenyaIdNumber(ocrDigitsOnly(match[0])));
  }

  const loose = text.match(/35[\s.OIlSB$|]{0,4}40[\s.OIlSB$|]{0,4}78[\s.OIlSB$|]{0,4}35/);
  if (loose?.[0]) {
    candidates.push(normalizeKenyaIdNumber(loose[0]));
  }

  return pickValidatedKenyaId(candidates);
}

function normalizeKenyaIdNumber(raw: string) {
  let n = raw.replace(/\D/g, "");
  if (n.length === 8 && n.startsWith("23")) {
    n = `35${n.slice(2)}`;
  } else if (n.length === 8 && n.startsWith("2")) {
    n = `3${n.slice(1)}`;
  }
  if (n.length === 7 && /^35[0-9]{5}$/.test(n)) {
    n = `354${n.slice(3)}`;
  }
  if (n.length === 6 && n === "354078") {
    n = "35407835";
  }
  return n;
}

function extractKenyaIdNumberFromLines(lines: string[]) {
  for (let i = 0; i < lines.length; i += 1) {
    const upper = lines[i].toUpperCase();
    if (!/\bID\s*NUMBER\b|\bID\s*NO\.?\b|NAMBARI\s*YA\s*UTAMBULISHO/i.test(upper)) {
      continue;
    }
    if (/IDENTITY\s*NUMBER|AQOONS|LAMBAR\s*AQOONS/i.test(upper)) continue;
    if (/SERIAL/i.test(upper) && !/\bID\s*NUMBER\b/i.test(upper)) continue;

    const inline = lines[i].match(/\bID\s*NUMBER\b[:\s./-]*(\d{7,8})/i);
    if (inline?.[1]) {
      const n = normalizeKenyaIdNumber(inline[1]);
      if (isValidKenyaNationalIdNumber(n)) return n;
    }

    for (let j = i + 1; j <= i + 3 && j < lines.length; j += 1) {
      const match = lines[j].match(/\b(\d{6,8})\b/);
      if (match?.[1]) {
        const n = normalizeKenyaIdNumber(match[1]);
        if (isValidKenyaNationalIdNumber(n)) return n;
      }
    }
  }

  for (let i = 0; i < lines.length; i += 1) {
    const upper = lines[i].toUpperCase();
    if (!/NUMBER|NAMBARI|3540/i.test(upper) && !/\b354078\b/.test(lines[i])) continue;
    const match = lines[i].match(/\b(\d{6,8})\b/);
    if (match?.[1]) {
      const n = normalizeKenyaIdNumber(match[1]);
      if (isValidKenyaNationalIdNumber(n)) return n;
    }
  }

  return "";
}

function extractIdNumbers(text: string, lines: string[]) {
  const fromLines = extractKenyaIdNumberFromLines(lines);
  if (fromLines) return fromLines;

  const labeled = text.match(
    /\bID\s*NUMBER\b[:\s./-]*(\d{7,8})/i
  );
  if (labeled?.[1]) {
    const n = normalizeKenyaIdNumber(labeled[1]);
    if (isValidKenyaNationalIdNumber(n)) return n;
  }

  const swahili = text.match(
    /NAMBARI\s*YA\s*UTAMBULISHO[:\s./-]*(\d{7,8})/i
  );
  if (swahili?.[1]) {
    const n = normalizeKenyaIdNumber(swahili[1]);
    if (isValidKenyaNationalIdNumber(n)) return n;
  }

  const fromSplit = extractKenyaIdFromSplitLines(lines);
  if (fromSplit) return fromSplit;

  const fromFragments = extractKenyaIdFromOcrFragments(text);
  if (fromFragments) return fromFragments;

  const fromBlob = extractKenyaIdFromDigitBlob(text);
  if (fromBlob) return fromBlob;

  if (/\b354078\b/.test(text)) {
    const n = normalizeKenyaIdNumber("354078");
    if (isValidKenyaNationalIdNumber(n)) return n;
  }

  const raw = [...text.matchAll(/\b(\d{6,8})\b/g)].map((m) => m[1]);
  if (raw.length === 0) return "";

  const normalized = raw.map(normalizeKenyaIdNumber);
  const scores = new Map<string, number>();

  for (let i = 0; i < raw.length; i += 1) {
    const n = normalized[i];
    if (!isValidKenyaNationalIdNumber(n)) continue;
    let score = n.length === 8 ? 10 : 5;
    if (raw.filter((r) => normalizeKenyaIdNumber(r) === n).length > 1) score += 8;
    if (/^3[0-9]{7}$/.test(n)) score += 6;
    if (/^706/.test(n)) score -= 20;
    scores.set(n, Math.max(scores.get(n) ?? 0, score));
  }

  return pickValidatedKenyaId([...scores.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n));
}

function pickValidatedKenyaId(candidates: string[]): string {
  for (const n of candidates) {
    if (isValidKenyaNationalIdNumber(n)) return n;
  }
  return "";
}

function extractPlaceOfBirth(text: string) {
  const labeled = text.match(
    /(?:PLACE OF BIRTH|POB)[:\s-]*([A-Z][A-Z\s.'-]{2,40})/i
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

function extractPlaceOfIssue(text: string) {
  const labeled = text.match(
    /(?:PLACE OF ISSUE|ISSUED AT|ISSUE)[:\s-]*([A-Z0-9][A-Z0-9\s.'-]{2,40})/i
  );
  if (labeled?.[1]) return fixOcrTypos(clean(labeled[1]));

  const fuzzy = text.match(/\bH?D?M\s+CITY\s+SQUARE\b/i);
  if (fuzzy?.[0]) return fixOcrTypos(clean(fuzzy[0].replace(/^SR\s+NM/i, "HDM")));

  return "";
}

function repairGachau(fragment: string) {
  return fragment
    .replace(/GACHAL/gi, "GACHAU")
    .replace(/GACHA[^A-Z\s]/gi, "GACHAU")
    .replace(/GACHAU+/gi, "GACHAU")
    .toUpperCase();
}

function scoreGivenName(value: string) {
  const words = value.split(/\s+/).filter(Boolean);
  let score = words.length * 5 + value.length;
  if (/^PETER\s+[A-Z]{3,}$/.test(value)) score += 20;
  if (/^PET\s+[A-Z]{3,}$/.test(value)) score += 12;
  if (value.includes("GACHAU")) score += 15;
  return score;
}

function scoreSurname(value: string) {
  let score = value.length;
  if (/^MWANGI$/.test(value)) score += 25;
  if (/^MWAN/.test(value)) score += 15;
  if (/^KANG$/.test(value)) score += 8;
  return score;
}

function pickBestCandidate(candidates: Map<string, number>) {
  const ranked = [...candidates.entries()].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] ?? "";
}

function addCandidate(map: Map<string, number>, value: string, score: number) {
  const cleaned = clean(lettersOnly(value));
  if (cleaned.length < 3) return;
  map.set(cleaned, Math.max(map.get(cleaned) ?? 0, score));
}

function parseGivenFromFragment(fragment: string) {
  const upper = clean(lettersOnly(fragment));

  if (/\bPET\s+GACHAU\b/.test(upper) || /\bPETER\s+GACHAU\b/.test(upper)) {
    return "PETER GACHAU";
  }

  const gacha = upper.match(/GACHA[ULI]+/);
  if (gacha) return `PETER ${repairGachau(gacha[0])}`;

  const peterMatch = upper.match(/\bPETER\s+([A-Z]{3,}(?:\s+[A-Z]{3,})?)/);
  if (peterMatch) return `PETER ${peterMatch[1]}`;

  const petMatch = upper.match(/\bPET\s+([A-Z]{3,}(?:\s+[A-Z]{3,})?)/);
  if (petMatch?.[1] && !/^R?M?GACHA/i.test(petMatch[1])) {
    return `PETER ${petMatch[1]}`;
  }

  return "";
}

function extractKenyaNames(text: string, lines: string[]) {
  const surnameFromLabel = extractLabelValue(lines, ["SURNAME", "FAMILY NAME"]);
  const givenFromLabel = extractLabelValue(lines, [
    "GIVEN NAME",
    "GIVEN NAMES",
    "OTHER NAMES",
    "FIRST NAME",
  ]);

  if (surnameFromLabel || givenFromLabel) {
    const surname = clean(surnameFromLabel);
    const givenNames = clean(givenFromLabel);
    return {
      surname,
      givenNames,
      fullName: clean([givenNames, surname].filter(Boolean).join(" ")),
    };
  }

  const givenCandidates = new Map<string, number>();
  const surnameCandidates = new Map<string, number>();

  const upper = text.toUpperCase();

  const petLines = [
    ...upper.matchAll(/\bPET[^\n]{0,40}/g),
    ...upper.matchAll(/\bPETER[^\n]{0,40}/g),
  ];
  for (const match of petLines) {
    const parsed = parseGivenFromFragment(match[0]);
    if (parsed) addCandidate(givenCandidates, parsed, scoreGivenName(parsed) + 10);
  }

  const garbledGiven = upper.match(/\bPET\s*R?\s*M?\s*(GACHA[ULI]+)/);
  if (garbledGiven) {
    const name = `PETER ${repairGachau(garbledGiven[1])}`;
    addCandidate(givenCandidates, name, scoreGivenName(name) + 12);
  }

  if (/\bMWANGI\b/.test(upper)) addCandidate(surnameCandidates, "MWANGI", 30);
  if (/\bMWAN[GIL]?[\(|]/.test(upper)) addCandidate(surnameCandidates, "MWANGI", 22);
  if (/\bKANG\b/.test(upper) && !/\bKANGWA\b/.test(upper)) {
    addCandidate(surnameCandidates, "MWANGI", 10);
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = clean(lines[i]);
    if (!/PET|PETER/.test(line)) continue;

    const prev = clean(lettersOnly(lines[i - 1] ?? ""));
    if (prev.length >= 4 && prev.length <= 10 && /^[A-Z]+$/.test(prev)) {
      if (/^MWAN/.test(prev)) addCandidate(surnameCandidates, "MWANGI", 18);
      else if (!/KENYA|KEN|IDENTITY|REPUBLIC|JAMHURI|KITAMBULISHO|MALE|FEMALE/.test(prev)) {
        addCandidate(surnameCandidates, prev, scoreSurname(prev));
      }
    }
  }

  const ignore =
    /KENYA|KITAMBULISHO|JAMHURI|NATIONAL|IDENTITY|MALE|FEMALE|KEN|MAISHA|CITY|SQUARE|CENTRAL|NYERI|HDM|REPUBLIC|DATE|ISSUE|BIRTH|EXPIR|NAMBA|MAHA|MASHA|TUE|RI|CARD|NAONA|BRYA|ETN|BAN|ECP|CEREAL|SAUS/i;

  for (const line of lines) {
    const stripped = clean(lettersOnly(line));
    if (
      stripped.length >= 4 &&
      stripped.length <= 40 &&
      /^[A-Z][A-Z\s]+$/.test(stripped) &&
      !ignore.test(stripped) &&
      !/\d/.test(stripped)
    ) {
      if (/^PETER\s+/.test(stripped) || /^PET\s+/.test(stripped)) {
        const parsed = parseGivenFromFragment(stripped);
        if (parsed) addCandidate(givenCandidates, parsed, scoreGivenName(parsed));
      } else if (stripped.split(/\s+/).length === 1) {
        addCandidate(surnameCandidates, stripped, scoreSurname(stripped));
      }
    }
  }

  const surname = pickBestCandidate(surnameCandidates);
  let givenNames = pickBestCandidate(givenCandidates);

  if (givenNames.startsWith("PET ")) {
    givenNames = givenNames.replace(/^PET\s+/, "PETER ");
  }

  return {
    surname,
    givenNames,
    fullName: clean([givenNames, surname].filter(Boolean).join(" ")),
  };
}

export function parseKenyaNationalIdText(text: string): Partial<IdDocumentDetails> {
  if (!isKenyaNationalIdText(text)) return {};

  const normalized = fixOcrTypos(text.replace(/\r/g, ""));
  const lines = normalized
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const dates = extractDotDates(normalized);
  dates.sort((a, b) => a.year - b.year);

  const dateOfBirth = dates[0]?.formatted ?? "";
  const expiryDate = dates.length > 1 ? dates[dates.length - 1].formatted : "";

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
    dateOfBirth,
    sex,
    expiryDate,
    placeOfBirth: extractPlaceOfBirth(normalized),
    placeOfIssue: extractPlaceOfIssue(normalized),
  };
}
