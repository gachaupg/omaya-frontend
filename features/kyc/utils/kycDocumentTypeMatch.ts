import type { IdDocumentDetails, IdDocumentType } from "@/lib/ocr/types";
import { isKenyaNationalIdText } from "@/lib/ocr/parseKenyaIdText";
import { isSomaliaNationalIdText } from "@/lib/ocr/parseSomaliaIdText";

export type KycDocumentKind =
  | "passport"
  | "national_id"
  | "drivers_license"
  | "unknown";

export type DocumentTypeMatchResult = {
  mismatch: boolean;
  detected: KycDocumentKind;
  confidence: "high" | "low" | "none";
  message?: string;
};

const KIND_LABELS: Record<KycDocumentKind, string> = {
  passport: "passport",
  national_id: "national ID",
  drivers_license: "driver's license",
  unknown: "document",
};

function normalizeSelectedDocumentType(type: string): KycDocumentKind {
  const normalized = type.trim().toLowerCase();
  if (normalized === "passport") return "passport";
  if (normalized === "national_id") return "national_id";
  if (normalized === "drivers_license") return "drivers_license";
  return "unknown";
}

function detectDocumentKind(
  rawText: string,
  ocrDocumentType: IdDocumentType
): { kind: KycDocumentKind; confidence: "high" | "low" | "none" } {
  const upper = rawText.toUpperCase();
  const compact = upper.replace(/\s+/g, "");

  // Passport — MRZ or clear passport booklet wording
  if (/P<[A-Z]{3}/.test(compact)) {
    return { kind: "passport", confidence: "high" };
  }
  if (
    upper.includes("<<") &&
    /[A-Z0-9<]{28,}/.test(compact) &&
    /\d{6}/.test(compact)
  ) {
    return { kind: "passport", confidence: "high" };
  }
  if (
    /PASSPORT/i.test(upper) &&
    /(?:NATIONALITY|DATE OF BIRTH|DATE OF ISSUE|AUTHORITY)/i.test(upper)
  ) {
    return { kind: "passport", confidence: "high" };
  }

  // National ID — strong regional / layout markers
  if (isKenyaNationalIdText(rawText)) {
    return { kind: "national_id", confidence: "high" };
  }
  if (isSomaliaNationalIdText(rawText)) {
    return { kind: "national_id", confidence: "high" };
  }
  if (
    /(?:NATIONAL IDENTITY|IDENTITY CARD|NATIONAL ID CARD|ID CARD|KITAMBULISHO|MAISHA CARD|KAARKA AQOONSIGA|AQOONSIGA)/i.test(
      upper
    )
  ) {
    return { kind: "national_id", confidence: "high" };
  }

  // Driver's license — only when both driving + license cues appear
  if (
    /(?:DRIV(?:ING|ER'?S?)\s*(?:LICEN[CS]E|PERMIT)|DRIVING LICEN[CS]E|DRIVER'?S? LICEN[CS]E)/i.test(
      upper
    )
  ) {
    return { kind: "drivers_license", confidence: "high" };
  }

  // Soft signals from generic OCR parser — never treat as hard mismatch alone
  if (ocrDocumentType === "passport") {
    return { kind: "passport", confidence: "low" };
  }
  if (ocrDocumentType === "national_id") {
    return { kind: "national_id", confidence: "low" };
  }

  return { kind: "unknown", confidence: "none" };
}

/** Card-like IDs — lenient cross-match (many layouts look similar). */
function areCardLikeKinds(a: KycDocumentKind, b: KycDocumentKind): boolean {
  const cardKinds = new Set<KycDocumentKind>([
    "national_id",
    "drivers_license",
  ]);
  return cardKinds.has(a) && cardKinds.has(b);
}

function isCompatible(selected: KycDocumentKind, detected: KycDocumentKind): boolean {
  if (detected === "unknown") return true;
  if (selected === "unknown") return true;
  if (selected === detected) return true;
  if (areCardLikeKinds(selected, detected)) return true;
  return false;
}

/**
 * Compare OCR-detected document kind with the user's selection.
 * Only flags a mismatch on high-confidence signals — stays lenient otherwise.
 */
export function checkKycDocumentTypeMatch(
  selectedType: string,
  extracted: IdDocumentDetails
): DocumentTypeMatchResult {
  const selected = normalizeSelectedDocumentType(selectedType);
  const { kind: detected, confidence } = detectDocumentKind(
    extracted.rawText,
    extracted.documentType
  );

  if (confidence !== "high" || isCompatible(selected, detected)) {
    return { mismatch: false, detected, confidence };
  }

  return {
    mismatch: true,
    detected,
    confidence,
    message: `This photo looks like a ${KIND_LABELS[detected]}, not the ${KIND_LABELS[selected]} you selected. Please re-upload the correct document, or go back and change the document type.`,
  };
}

export function getKycDocumentKindLabel(kind: KycDocumentKind): string {
  return KIND_LABELS[kind];
}
