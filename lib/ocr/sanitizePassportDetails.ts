import type { IdDocumentDetails } from "./types";
import { EMPTY_ID_DOCUMENT_DETAILS } from "./types";
import { isPassportNumberFormat, normalizePassportNumber } from "./parsePassportText";
import { normalizeSex } from "./extractSex";

const KNOWN_NATIONALITY_CODES = new Set([
  "AFG", "ALB", "DZA", "AND", "AGO", "ATG", "ARG", "ARM", "AUS", "AUT", "AZE",
  "BHS", "BHR", "BGD", "BRB", "BLR", "BEL", "BLZ", "BEN", "BTN", "BOL", "BIH",
  "BWA", "BRA", "BRN", "BGR", "BFA", "BDI", "KHM", "CMR", "CAN", "CPV", "CAF",
  "TCD", "CHL", "CHN", "COL", "COM", "COG", "COD", "CRI", "CIV", "HRV", "CUB",
  "CYP", "CZE", "DNK", "DJI", "DMA", "DOM", "ECU", "EGY", "SLV", "GNQ", "ERI",
  "EST", "SWZ", "ETH", "FJI", "FIN", "FRA", "GAB", "GMB", "GEO", "DEU", "GHA",
  "GRC", "GRD", "GTM", "GIN", "GNB", "GUY", "HTI", "HND", "HUN", "ISL", "IND",
  "IDN", "IRN", "IRQ", "IRL", "ISR", "ITA", "JAM", "JPN", "JOR", "KAZ", "KEN",
  "KIR", "PRK", "KOR", "KWT", "KGZ", "LAO", "LVA", "LBN", "LSO", "LBR", "LBY",
  "LIE", "LTU", "LUX", "MDG", "MWI", "MYS", "MDV", "MLI", "MLT", "MHL", "MRT",
  "MUS", "MEX", "FSM", "MDA", "MCO", "MNG", "MNE", "MAR", "MOZ", "MMR", "NAM",
  "NRU", "NPL", "NLD", "NZL", "NIC", "NER", "NGA", "MKD", "NOR", "OMN", "PAK",
  "PLW", "PAN", "PNG", "PRY", "PER", "PHL", "POL", "PRT", "QAT", "ROU", "RUS",
  "RWA", "KNA", "LCA", "VCT", "WSM", "SMR", "STP", "SAU", "SEN", "SRB", "SYC",
  "SLE", "SGP", "SVK", "SVN", "SLB", "SOM", "ZAF", "SSD", "ESP", "LKA", "SDN",
  "SUR", "SWE", "CHE", "SYR", "TWN", "TJK", "TZA", "THA", "TLS", "TGO", "TON",
  "TTO", "TUN", "TUR", "TKM", "TUV", "UGA", "UKR", "ARE", "GBR", "USA", "URY",
  "UZB", "VUT", "VAT", "VEN", "VNM", "YEM", "ZMB", "ZWE", "XXX", "UNO", "UNA",
]);

const OCR_GARBAGE_TOKENS =
  /^(?:PASSPORT|BAASABOOR|REPUBLIC|GOVERNMENT|NATIONALITY|IDENTITY|SURNAME|GIVEN|NAMES|DATE|ISSUE|EXPIRY|SEX|GENDER|MALE|FEMALE|TYPE|NO|NUMBER|KENYA|SOMALIA|SOMALI|JAMHURI|KENYA)$/i;

function isLikelyPersonName(value: string): boolean {
  const v = value.trim().toUpperCase();
  if (v.length < 2 || v.length > 60) return false;
  if (!/^[A-Z][A-Z\s'.-]*[A-Z]$/.test(v) && !/^[A-Z]{2,}$/.test(v)) return false;
  if (/\d/.test(v)) return false;
  const parts = v.split(/\s+/).filter(Boolean);
  if (parts.some((part) => part.length < 2 || OCR_GARBAGE_TOKENS.test(part))) {
    return false;
  }
  return parts.length >= 1;
}

function isValidNationality(value: string, fromMrz: boolean): boolean {
  const v = value.trim().toUpperCase().replace(/</g, "");
  if (!v) return false;
  if (fromMrz) {
    return /^[A-Z]{3}$/.test(v);
  }
  if (/^[A-Z]{3}$/.test(v) && KNOWN_NATIONALITY_CODES.has(v)) {
    return true;
  }
  // Visual OCR: alphabetic country name, no digits or label noise
  return /^[A-Z][A-Z\s-]{2,24}$/.test(v) && !OCR_GARBAGE_TOKENS.test(v);
}

function parseDateParts(value: string): { year: number; month: number; day: number } | null {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return {
      year: Number(iso[1]),
      month: Number(iso[2]),
      day: Number(iso[3]),
    };
  }

  const dmy = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) {
    return {
      day: Number(dmy[1]),
      month: Number(dmy[2]),
      year: Number(dmy[3]),
    };
  }

  const monthName = value.match(
    /^(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s+(\d{4})$/i
  );
  if (monthName) {
    const months: Record<string, number> = {
      JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
      JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
    };
    return {
      day: Number(monthName[1]),
      month: months[monthName[2].slice(0, 3).toUpperCase()] ?? 0,
      year: Number(monthName[3]),
    };
  }

  return null;
}

function isPlausibleDate(value: string, kind: "birth" | "expiry" | "issue"): boolean {
  const parts = parseDateParts(value);
  if (!parts) return false;
  const { year, month, day } = parts;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const nowYear = new Date().getFullYear();
  if (kind === "birth") {
    return year >= 1920 && year <= nowYear;
  }
  if (kind === "expiry") {
    return year >= 2000 && year <= nowYear + 20;
  }
  return year >= 1990 && year <= nowYear + 1;
}

export type PassportFieldTrust = {
  documentNumber: boolean;
  fullName: boolean;
  givenNames: boolean;
  surname: boolean;
  nationality: boolean;
  dateOfBirth: boolean;
  sex: boolean;
  expiryDate: boolean;
  issueDate: boolean;
  placeOfBirth: boolean;
  placeOfIssue: boolean;
  occupation: boolean;
};

export type SanitizedPassportResult = {
  details: IdDocumentDetails;
  trust: PassportFieldTrust;
  lowConfidenceFields: string[];
  mrzUsed: boolean;
};

function blankIfUntrusted(value: string, trusted: boolean): string {
  return trusted ? value.trim() : "";
}

/**
 * Keep only passport fields that pass validation. Untrusted fields are cleared
 * so the KYC form shows blanks instead of random OCR noise.
 */
export function sanitizePassportDetails(
  raw: Partial<IdDocumentDetails>,
  options: {
    mrzFullyValid: boolean;
    mrzFields?: Partial<IdDocumentDetails>;
    visualOnly?: boolean;
  }
): SanitizedPassportResult {
  const mrz = options.mrzFields ?? {};
  const visualOnly = options.visualOnly ?? !options.mrzFullyValid;

  const docRaw = normalizePassportNumber(raw.documentNumber ?? "");
  const docFromMrz =
    options.mrzFullyValid &&
    isPassportNumberFormat(mrz.documentNumber ?? "", { fromMrz: true });
  const docFromVisual =
    !docFromMrz &&
    isPassportNumberFormat(docRaw) &&
    Boolean(
      raw.rawText?.match(
        /(?:PASSPORT\s*(?:NO|NUMBER|#)?|NAMBARI YA PASI|LAMBAR(?:KA)?\s*BAASABOOR|BAASABOOR\s*(?:NO|NUMBER)?)[:\s\-]*[A-Z0-9]/i
      )
    );

  const surnameTrusted =
    (options.mrzFullyValid && isLikelyPersonName(mrz.surname ?? "")) ||
    (!visualOnly &&
      !mrz.surname &&
      isLikelyPersonName(raw.surname ?? "") &&
      Boolean(raw.rawText?.match(/\bSURNAME\b/i)));
  const givenTrusted =
    (options.mrzFullyValid && isLikelyPersonName(mrz.givenNames ?? "")) ||
    (!visualOnly &&
      !mrz.givenNames &&
      isLikelyPersonName(raw.givenNames ?? "") &&
      Boolean(raw.rawText?.match(/\bGIVEN\s*NAME/i)));
  const fullNameTrusted =
    (surnameTrusted && givenTrusted) ||
    (options.mrzFullyValid && isLikelyPersonName(mrz.fullName ?? ""));

  const nationalityTrusted =
    (options.mrzFullyValid && isValidNationality(mrz.nationality ?? "", true)) ||
    isValidNationality(raw.nationality ?? "", false);

  const dobTrusted =
    (options.mrzFullyValid && isPlausibleDate(mrz.dateOfBirth ?? "", "birth")) ||
    isPlausibleDate(raw.dateOfBirth ?? "", "birth");

  const expiryTrusted =
    (options.mrzFullyValid && isPlausibleDate(mrz.expiryDate ?? "", "expiry")) ||
    isPlausibleDate(raw.expiryDate ?? "", "expiry");

  const issueTrusted = isPlausibleDate(raw.issueDate ?? "", "issue");

  const sexRaw = normalizeSex(
    options.mrzFullyValid ? mrz.sex ?? raw.sex ?? "" : raw.sex ?? ""
  );
  const sexTrusted =
    sexRaw !== "" &&
    (options.mrzFullyValid ||
      Boolean(raw.rawText?.match(/\b(?:SEX|GENDER|JINSIGA|JINSIA)\b/i)));

  const placeTrusted = (value: string) =>
    value.length >= 2 &&
    value.length <= 40 &&
    /^[A-Z][A-Z\s'.-]{1,39}$/i.test(value) &&
    !OCR_GARBAGE_TOKENS.test(value.trim());

  const trust: PassportFieldTrust = {
    documentNumber: docFromMrz || docFromVisual,
    surname: surnameTrusted,
    givenNames: givenTrusted,
    fullName: fullNameTrusted,
    nationality: nationalityTrusted,
    dateOfBirth: dobTrusted,
    sex: sexTrusted,
    expiryDate: expiryTrusted,
    issueDate: issueTrusted,
    placeOfBirth: placeTrusted(raw.placeOfBirth ?? ""),
    placeOfIssue: placeTrusted(raw.placeOfIssue ?? ""),
    occupation: placeTrusted(raw.occupation ?? ""),
  };

  const surname = blankIfUntrusted(raw.surname ?? mrz.surname ?? "", trust.surname);
  const givenNames = blankIfUntrusted(
    raw.givenNames ?? mrz.givenNames ?? "",
    trust.givenNames
  );
  let fullName = blankIfUntrusted(raw.fullName ?? mrz.fullName ?? "", trust.fullName);
  if (!fullName && givenNames && surname) {
    fullName = `${givenNames} ${surname}`.trim();
  }

  const details: IdDocumentDetails = {
    ...EMPTY_ID_DOCUMENT_DETAILS,
    documentType: "passport",
    rawText: raw.rawText ?? "",
    documentNumber: blankIfUntrusted(docRaw, trust.documentNumber),
    surname,
    givenNames,
    fullName,
    nationality: blankIfUntrusted(
      (options.mrzFullyValid ? mrz.nationality : raw.nationality) ?? "",
      trust.nationality
    ),
    dateOfBirth: blankIfUntrusted(
      (options.mrzFullyValid ? mrz.dateOfBirth : raw.dateOfBirth) ?? "",
      trust.dateOfBirth
    ),
    sex: blankIfUntrusted(sexRaw, trust.sex),
    expiryDate: blankIfUntrusted(
      (options.mrzFullyValid ? mrz.expiryDate : raw.expiryDate) ?? "",
      trust.expiryDate
    ),
    issueDate: blankIfUntrusted(raw.issueDate ?? "", trust.issueDate),
    placeOfBirth: blankIfUntrusted(raw.placeOfBirth ?? "", trust.placeOfBirth),
    placeOfIssue: blankIfUntrusted(raw.placeOfIssue ?? "", trust.placeOfIssue),
    occupation: blankIfUntrusted(raw.occupation ?? "", trust.occupation),
    address: "",
  };

  const lowConfidenceFields = (
    Object.entries(trust) as Array<[keyof PassportFieldTrust, boolean]>
  )
    .filter(([, trusted]) => !trusted)
    .map(([field]) => field);

  return {
    details,
    trust,
    lowConfidenceFields,
    mrzUsed: options.mrzFullyValid,
  };
}
