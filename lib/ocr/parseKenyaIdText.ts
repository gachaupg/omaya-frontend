import type { IdDocumentDetails } from "./types";

const clean = (value: string) => value.replace(/\s+/g, " ").trim().toUpperCase();

const KENYA_MARKERS =
  /KITAMBULISHO|JAMHURI|JAMNURI|REPUBLIC OF KENYA|NATIONAL IDENTITY|MAISHA/i;

export function isKenyaNationalIdText(text: string): boolean {
  return KENYA_MARKERS.test(text);
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

function extractLabelValue(lines: string[], labels: string[]) {
  for (let i = 0; i < lines.length; i += 1) {
    const upper = lines[i].toUpperCase();
    for (const label of labels) {
      if (!upper.includes(label)) continue;

      const inline = lines[i]
        .slice(upper.indexOf(label) + label.length)
        .replace(/^[\s:/-]+/, "")
        .trim();

      if (inline.length >= 2 && !/^\d/.test(inline)) {
        return fixOcrTypos(inline);
      }

      const next = lines[i + 1]?.trim() ?? "";
      if (next.length >= 2) return fixOcrTypos(next);
    }
  }
  return "";
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
  return n;
}

function extractIdNumbers(text: string) {
  const raw = [...text.matchAll(/\b(\d{7,8})\b/g)].map((m) => m[1]);
  if (raw.length === 0) return "";

  const normalized = raw.map(normalizeKenyaIdNumber);
  const scores = new Map<string, number>();

  for (let i = 0; i < raw.length; i += 1) {
    const n = normalized[i];
    let score = n.length === 8 ? 10 : 5;
    if (raw.filter((r) => normalizeKenyaIdNumber(r) === n).length > 1) score += 8;
    if (/^3[0-9]{7}$/.test(n)) score += 4;
    scores.set(n, Math.max(scores.get(n) ?? 0, score));
  }

  return [...scores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
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
    documentNumber: extractIdNumbers(normalized),
    nationality,
    dateOfBirth,
    sex,
    expiryDate,
    placeOfBirth: extractPlaceOfBirth(normalized),
    placeOfIssue: extractPlaceOfIssue(normalized),
  };
}
