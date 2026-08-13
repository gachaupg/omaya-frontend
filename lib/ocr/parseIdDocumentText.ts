import type { IdDocumentDetails, IdDocumentType } from "./types";
import { EMPTY_ID_DOCUMENT_DETAILS } from "./types";
import { isKenyaNationalIdText, parseKenyaNationalIdText } from "./parseKenyaIdText";
import {
  isSomaliaNationalIdText,
  parseSomaliaNationalIdText,
} from "./parseSomaliaIdText";
import {
  isPassportDocumentText,
  isNationalIdDocumentText,
  isPassportNumberFormat,
  isNationalIdNumberFormat,
  normalizePassportNumber,
  parsePassportVisualText,
} from "./parsePassportText";
import { normalizeSex, resolveDocumentSex } from "./extractSex";

const clean = (value: string) => value.replace(/\s+/g, " ").trim();

const formatMrzDate = (value: string) => {
  if (!/^\d{6}$/.test(value)) return "";
  const year = Number(value.slice(0, 2));
  const month = value.slice(2, 4);
  const day = value.slice(4, 6);
  const fullYear = year >= 50 ? 1900 + year : 2000 + year;
  return `${fullYear}-${month}-${day}`;
};

const normalizeMrzLine = (line: string) =>
  line.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9<]/g, "");

const parseMrzName = (segment: string) => {
  const trimmed = segment.replace(/<+$/, "");
  const [surnamePart, givenPart = ""] = trimmed.split("<<");
  const surname = (surnamePart ?? "").replace(/</g, " ").trim();
  const givenNames = givenPart.replace(/</g, " ").trim();
  const fullName = [givenNames, surname].filter(Boolean).join(" ").trim();
  return { surname, givenNames, fullName };
};

function findMrzLines(rawText: string): { line1: string; line2: string } | null {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => normalizeMrzLine(line))
    .filter((line) => line.length >= 30);

  let line1 = lines.find((line) => line.startsWith("P<") && line.includes("<<"));
  let line2 = lines.find(
    (line) =>
      line !== line1 &&
      /^[A-Z0-9<]{30,}$/.test(line) &&
      /\d{6}/.test(line) &&
      !line.startsWith("P<")
  );

  if (line1 && line2) {
    return { line1, line2 };
  }

  const compact = normalizeMrzLine(rawText);
  const blockMatch = compact.match(
    /(P<[A-Z]{3}[A-Z<]{5,}<<[A-Z<]{5,})([A-Z0-9<]{30,})/
  );
  if (!blockMatch) return null;

  line1 = blockMatch[1];
  line2 = blockMatch[2];

  if (!line1.includes("<<") || !/\d{6}/.test(line2)) return null;
  return { line1, line2 };
}

function parseMrz(rawText: string): Partial<IdDocumentDetails> | null {
  const mrzLines = findMrzLines(rawText);
  if (!mrzLines) return null;

  const { line1, line2 } = mrzLines;
  const nameSegment = line1.slice(5);
  const { surname, givenNames, fullName } = parseMrzName(nameSegment);

  const documentNumber = normalizePassportNumber(
    line2.slice(0, 10).replace(/</g, "")
  );
  const nationality = line2.slice(10, 13).replace(/</g, "").trim();
  const dateOfBirth = formatMrzDate(line2.slice(13, 19));
  const sex = normalizeSex(line2.slice(20, 21).replace(/</g, ""));
  const expiryDate = formatMrzDate(line2.slice(21, 27));

  return {
    documentType: "passport",
    fullName,
    givenNames,
    surname,
    documentNumber: isPassportNumberFormat(documentNumber) ? documentNumber : "",
    nationality,
    dateOfBirth,
    sex,
    expiryDate,
  };
}

function pickFirstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return clean(match[1]);
  }
  return "";
}

function resolvePassportDocumentNumber(
  merged: Partial<IdDocumentDetails>,
  sources: {
    mrz?: Partial<IdDocumentDetails> | null;
    passportVisual?: Partial<IdDocumentDetails>;
    generic?: Partial<IdDocumentDetails>;
  }
): string {
  const scored: Array<{ value: string; score: number }> = [];

  const add = (raw: string | undefined, score: number) => {
    if (!raw) return;
    const normalized = normalizePassportNumber(raw);
    if (isPassportNumberFormat(normalized)) {
      scored.push({ value: normalized, score });
    }
  };

  add(sources.mrz?.documentNumber, 70);
  add(sources.passportVisual?.documentNumber, 60);
  add(sources.generic?.documentNumber, 40);
  add(merged.documentNumber, 30);

  const ranked = scored.sort((a, b) => b.score - a.score);
  if (ranked[0]) return ranked[0].value;

  if (
    merged.documentNumber &&
    !isNationalIdNumberFormat(merged.documentNumber)
  ) {
    return merged.documentNumber;
  }

  return "";
}

function parseGenericId(text: string): Partial<IdDocumentDetails> {
  const upper = text.toUpperCase();
  const isPassport = isPassportDocumentText(text);
  const isKenya = isKenyaNationalIdText(text);
  const isSomalia = isSomaliaNationalIdText(text);

  const documentNumber = pickFirstMatch(
    upper,
    isPassport
      ? [
          /(?:PASSPORT|BAASABOOR|DOCUMENT)\s*(?:NO|NUMBER|#)?[:\s-]*([A-Z0-9-]{5,20})/i,
          /\b([A-Z]{1,2}\d{6,12})\b/,
        ]
      : isKenya
        ? [
            /\bID\s*NUMBER\b[:\s-]*(\d{7,8})/i,
          ]
        : isSomalia
          ? [
              /\bIDENTITY\s*NUMBER\b[:\s-]*(\d{8,14})/i,
              /(?:LAMBAR(?:KA)?\s*AQOONSIGA|AQOONSIGA\s*(?:NO|NUMBER|#)?)[:\s-]*(\d{8,14})/i,
            ]
          : [
              /(?:IDENTITY\s*NUMBER|ID\s*NUMBER|I\.D\.?\s*(?:NO|NUMBER|#)?|DOCUMENT|DOC)\s*(?:NO|NUMBER|#)?[:\s-]*([A-Z0-9-]{5,20})/i,
              /\b([A-Z]{1,2}\d{6,12})\b/,
              /\b(\d{8,14})\b/,
            ]
  );

  const dateOfBirth = pickFirstMatch(text, [
    /(?:DOB|D\.O\.B|DATE OF BIRTH|BIRTH|TAARIIKHDA DHALASHADA)[:\s-]*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
    /(?:DOB|D\.O\.B|DATE OF BIRTH|BIRTH)[:\s-]*(\d{1,2}\s+[A-Z]{3,9}\s+\d{4})/i,
  ]);

  const expiryDate = pickFirstMatch(text, [
    /(?:EXP|EXPIRY|EXPIRES|DATE OF EXPIRY|TAARIIKHDA UU DHACAYO)[:\s-]*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
    /(?:EXP|EXPIRY|EXPIRES|DATE OF EXPIRY)[:\s-]*(\d{1,2}\s+[A-Z]{3,9}\s+\d{4})/i,
  ]);

  const issueDate = pickFirstMatch(text, [
    /(?:ISS|ISSUE|DATE OF ISSUE|TAARIIKHDA LA BIXIYAY)[:\s-]*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
  ]);

  const nationality = pickFirstMatch(upper, [
    /(?:NATIONALITY|NAT|UTAIFA)[:\s-]*([A-Z]{2,3})/i,
    /(?:NATIONALITY|NAT)[:\s-]*([A-Z][A-Z\s]{2,24})/i,
  ]);

  const sexRaw = pickFirstMatch(upper, [
    /(?:SEX|GENDER|JINSIGA|JINSIA|LAB\s*DHEDDIG)[:\s-]*([MF]|MALE|FEMALE)/i,
  ]);
  const sex = normalizeSex(sexRaw);

  const fullName = pickFirstMatch(text, [
    /(?:NAME|FULL NAME|MAGACA|SURNAME\/GIVEN NAMES?)[:\s-]*([A-Z][A-Za-z.'\-\s]{2,60})/i,
  ]);

  const address = pickFirstMatch(text, [
    /(?:ADDRESS|RESIDENCE)[:\s-]*([A-Za-z0-9,\-\s]{8,120})/i,
  ]);

  const placeOfBirth = pickFirstMatch(text, [
    /(?:MEESHA\s*DHALASHADA|PLACE\s*OF\s*BIRTH|POB|MAHALI\s*PA\s*KUZALIWA)[:\s/\-|]+([A-Z][A-Z .'-]{2,40})(?:\n|$)/im,
  ]);

  const placeOfIssue = pickFirstMatch(text, [
    /(?:MEESHA\s*LAGA\s*BIXIYEY|PLACE\s*OF\s*ISSUE|ISSUED\s*AT)[:\s/\-|]+([A-Z][A-Z .'-]{2,40})(?:\n|$)/im,
  ]);

  const occupation = pickFirstMatch(text, [
    /(?:SHAQADA|OCCUPATION|PROFESSION|MAHALI\s*PA\s*KAZI)[:\s/\-|]+([A-Z][A-Z .'-]{2,40})(?:\n|$)/im,
  ]);

  const documentType: IdDocumentType = /PASSPORT|BAASABOOR/i.test(text)
    ? "passport"
    : isNationalIdDocumentText(text) ||
        /(?:NATIONAL ID|IDENTITY CARD|ID CARD|I\.D\.|AQOONSIGA|KAARKA)/i.test(text)
      ? "national_id"
      : "unknown";

  return {
    documentType,
    fullName,
    documentNumber,
    nationality,
    dateOfBirth,
    sex,
    expiryDate,
    issueDate,
    placeOfBirth,
    placeOfIssue,
    occupation,
    address,
  };
}

function preferNonEmpty(
  primary: Partial<IdDocumentDetails>,
  fallback: Partial<IdDocumentDetails>
): Partial<IdDocumentDetails> {
  const merged: Partial<IdDocumentDetails> = { ...fallback, ...primary };
  for (const key of [
    "fullName",
    "givenNames",
    "surname",
    "documentNumber",
    "nationality",
    "dateOfBirth",
    "sex",
    "expiryDate",
    "issueDate",
    "placeOfBirth",
    "placeOfIssue",
    "occupation",
  ] as const) {
    if (!merged[key] && fallback[key]) {
      merged[key] = fallback[key];
    }
  }
  return merged;
}

export function parseIdDocumentText(rawText: string): IdDocumentDetails {
  const raw = rawText.trim();
  if (!raw) return { ...EMPTY_ID_DOCUMENT_DETAILS };

  const isPassport = isPassportDocumentText(raw);
  const mrz = parseMrz(raw);
  const kenyaParsed =
    !isPassport && isKenyaNationalIdText(raw)
      ? parseKenyaNationalIdText(raw)
      : {};
  const somaliaParsed =
    !isPassport && !kenyaParsed.documentType && isSomaliaNationalIdText(raw)
      ? parseSomaliaNationalIdText(raw)
      : {};
  const passportVisual = isPassport ? parsePassportVisualText(raw) : {};
  const generic = parseGenericId(raw);

  const merged: IdDocumentDetails = {
    ...EMPTY_ID_DOCUMENT_DETAILS,
    ...generic,
    ...preferNonEmpty(kenyaParsed, generic),
    ...preferNonEmpty(somaliaParsed, preferNonEmpty(kenyaParsed, generic)),
    ...preferNonEmpty(passportVisual, {}),
    ...preferNonEmpty(mrz ?? {}, passportVisual),
    rawText: raw,
  };

  if (mrz?.documentType === "passport") {
    merged.documentType = "passport";
  } else if (somaliaParsed.documentType) {
    merged.documentType = somaliaParsed.documentType;
  } else if (kenyaParsed.documentType) {
    merged.documentType = kenyaParsed.documentType;
  } else if (passportVisual.documentType) {
    merged.documentType = passportVisual.documentType;
  }

  if (!merged.fullName && merged.givenNames && merged.surname) {
    merged.fullName = `${merged.givenNames} ${merged.surname}`.trim();
  }

  if (!merged.givenNames && !merged.surname && merged.fullName) {
    const parts = merged.fullName.split(/\s+/);
    merged.surname = parts.length > 1 ? parts[parts.length - 1] : "";
    merged.givenNames =
      parts.length > 1 ? parts.slice(0, -1).join(" ") : merged.fullName;
  }

  if (
    !isNationalIdDocumentText(raw) &&
    somaliaParsed.documentType !== "national_id" &&
    kenyaParsed.documentType !== "national_id" &&
    (merged.documentType === "passport" || isPassport || mrz?.documentType === "passport")
  ) {
    merged.documentType = "passport";
    merged.documentNumber = resolvePassportDocumentNumber(merged, {
      mrz,
      passportVisual,
      generic,
    });
  }

  merged.sex = resolveDocumentSex(raw, [
    { sex: mrz?.sex, score: 70 },
    { sex: passportVisual.sex, score: 60 },
    { sex: somaliaParsed.sex, score: 55 },
    { sex: kenyaParsed.sex, score: 55 },
    { sex: generic.sex, score: 40 },
    { sex: merged.sex, score: 30 },
  ]);

  return merged;
}
