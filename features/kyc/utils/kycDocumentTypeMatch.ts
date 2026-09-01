import type { IdDocumentDetails, IdDocumentType } from "@/lib/ocr/types";
import { isKenyaNationalIdText } from "@/lib/ocr/parseKenyaIdText";
import { isSomaliaNationalIdText } from "@/lib/ocr/parseSomaliaIdText";
import { isNationalIdDocumentText } from "@/lib/ocr/parsePassportText";

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

  // Passport — MRZ or clear passport booklet wording (not bare OCR noise)
  if (/P<[A-Z]{3}/.test(compact)) {
    return { kind: "passport", confidence: "high" };
  }
  if (
    /<<\s*/.test(upper) &&
    /P<[A-Z]{3}/.test(compact) &&
    /[A-Z0-9<]{28,}/.test(compact)
  ) {
    return { kind: "passport", confidence: "high" };
  }
  if (
    /\bPASSPORT\b/i.test(upper) &&
    /(?:NATIONALITY|DATE OF BIRTH|DATE OF ISSUE|AUTHORITY)/i.test(upper)
  ) {
    return { kind: "passport", confidence: "high" };
  }

  // National ID — strong regional / layout markers (before soft passport signals)
  if (isKenyaNationalIdText(rawText)) {
    return { kind: "national_id", confidence: "high" };
  }
  if (isSomaliaNationalIdText(rawText)) {
    return { kind: "national_id", confidence: "high" };
  }
  if (isNationalIdDocumentText(rawText)) {
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
    message: `We detected this might be a ${KIND_LABELS[detected]}, but you selected ${KIND_LABELS[selected]}. If your selection is correct, review the extracted details below and continue.`,
  };
}

export function getKycDocumentKindLabel(kind: KycDocumentKind): string {
  return KIND_LABELS[kind];
}
