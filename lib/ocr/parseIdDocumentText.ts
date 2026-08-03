import type { IdDocumentDetails, IdDocumentType } from "./types";
import { EMPTY_ID_DOCUMENT_DETAILS } from "./types";
import { isKenyaNationalIdText, parseKenyaNationalIdText } from "./parseKenyaIdText";

const clean = (value: string) => value.replace(/\s+/g, " ").trim();

const formatMrzDate = (value: string) => {
  if (!/^\d{6}$/.test(value)) return "";
  const year = Number(value.slice(0, 2));
  const month = value.slice(2, 4);
  const day = value.slice(4, 6);
  const fullYear = year >= 50 ? 1900 + year : 2000 + year;
  return `${fullYear}-${month}-${day}`;
};

const parseMrzName = (segment: string) => {
  const parts = segment.replace(/<+/g, " ").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { surname: "", givenNames: "", fullName: "" };
  const surname = parts[0] ?? "";
  const givenNames = parts.slice(1).join(" ");
  const fullName = [givenNames, surname].filter(Boolean).join(" ").trim();
  return { surname, givenNames, fullName };
};

function parseMrz(lines: string[]): Partial<IdDocumentDetails> | null {
  const normalized = lines
    .map((line) => line.toUpperCase().replace(/\s+/g, ""))
    .filter((line) => line.length >= 30);

  const td3Line1 = normalized.find((line) => line.startsWith("P<") || line.includes("<<"));
  const td3Line2 = normalized.find((line) => /[A-Z0-9<]{30,}/.test(line) && /\d{6}/.test(line));

  if (!td3Line1 || !td3Line2) return null;

  const nameSegment = td3Line1.slice(5);
  const { surname, givenNames, fullName } = parseMrzName(nameSegment);

  const documentNumber = td3Line2.slice(0, 9).replace(/</g, "").trim();
  const nationality = td3Line2.slice(10, 13).replace(/</g, "").trim();
  const dateOfBirth = formatMrzDate(td3Line2.slice(13, 19));
  const sex = td3Line2.slice(20, 21).replace(/</g, "").trim();
  const expiryDate = formatMrzDate(td3Line2.slice(21, 27));

  return {
    documentType: "passport",
    fullName,
    givenNames,
    surname,
    documentNumber,
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

function parseGenericId(text: string): Partial<IdDocumentDetails> {
  const upper = text.toUpperCase();

  const documentNumber = pickFirstMatch(upper, [
    /(?:ID|I\.D|PASSPORT|DOCUMENT|DOC)\s*(?:NO|NUMBER|#)?[:\s-]*([A-Z0-9-]{5,20})/i,
    /\b([A-Z]{1,2}\d{6,12})\b/,
    /\b(\d{8,12})\b/,
  ]);

  const dateOfBirth = pickFirstMatch(text, [
    /(?:DOB|D\.O\.B|DATE OF BIRTH|BIRTH)[:\s-]*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
    /(?:DOB|D\.O\.B|DATE OF BIRTH|BIRTH)[:\s-]*(\d{1,2}\s+[A-Z]{3,9}\s+\d{4})/i,
  ]);

  const expiryDate = pickFirstMatch(text, [
    /(?:EXP|EXPIRY|EXPIRES|DATE OF EXPIRY)[:\s-]*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
    /(?:EXP|EXPIRY|EXPIRES|DATE OF EXPIRY)[:\s-]*(\d{1,2}\s+[A-Z]{3,9}\s+\d{4})/i,
  ]);

  const issueDate = pickFirstMatch(text, [
    /(?:ISS|ISSUE|DATE OF ISSUE)[:\s-]*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
  ]);

  const nationality = pickFirstMatch(upper, [
    /(?:NATIONALITY|NAT)[:\s-]*([A-Z]{2,3})/i,
    /(?:NATIONALITY|NAT)[:\s-]*([A-Z][A-Z\s]{2,24})/i,
  ]);

  const sex = pickFirstMatch(upper, [
    /(?:SEX|GENDER)[:\s-]*([MF]|MALE|FEMALE)/i,
  ]);

  const fullName = pickFirstMatch(text, [
    /(?:NAME|FULL NAME|SURNAME\/GIVEN NAMES?)[:\s-]*([A-Z][A-Za-z.'\-\s]{2,60})/i,
  ]);

  const address = pickFirstMatch(text, [
    /(?:ADDRESS|RESIDENCE)[:\s-]*([A-Za-z0-9,\-\s]{8,120})/i,
  ]);

  const placeOfBirth = pickFirstMatch(text, [
    /(?:PLACE OF BIRTH|POB)[:\s-]*([A-Za-z0-9,\-\s]{3,60})/i,
  ]);

  const documentType: IdDocumentType = /PASSPORT/i.test(text)
    ? "passport"
    : /(?:NATIONAL ID|IDENTITY CARD|ID CARD|I\.D\.)/i.test(text)
      ? "national_id"
      : "unknown";

  return {
    documentType,
    fullName,
    documentNumber,
    nationality,
    dateOfBirth,
    sex: sex.slice(0, 1).toUpperCase(),
    expiryDate,
    issueDate,
    placeOfBirth,
    address,
  };
}

export function parseIdDocumentText(rawText: string): IdDocumentDetails {
  const raw = rawText.trim();
  if (!raw) return { ...EMPTY_ID_DOCUMENT_DETAILS };

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const mrz = parseMrz(lines);
  const kenya = isKenyaNationalIdText(raw) ? parseKenyaNationalIdText(raw) : {};
  const generic = parseGenericId(raw);

  const merged: IdDocumentDetails = {
    ...EMPTY_ID_DOCUMENT_DETAILS,
    ...generic,
    ...kenya,
    ...mrz,
    rawText: raw,
  };

  if (!merged.fullName && merged.givenNames && merged.surname) {
    merged.fullName = `${merged.givenNames} ${merged.surname}`.trim();
  }

  if (!merged.givenNames && !merged.surname && merged.fullName) {
    const parts = merged.fullName.split(/\s+/);
    merged.surname = parts.length > 1 ? parts[parts.length - 1] : "";
    merged.givenNames = parts.length > 1 ? parts.slice(0, -1).join(" ") : merged.fullName;
  }

  return merged;
}
