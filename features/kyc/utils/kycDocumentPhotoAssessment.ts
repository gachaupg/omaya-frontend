import type { IdDocumentDetails } from "@/lib/ocr/types";
import { getKycOcrDisplayRows } from "@/features/kyc/utils/kycOcrDisplay";

export type DocumentPhotoAssessment = {
  likelyDummy: boolean;
  confidence: "high" | "low" | "none";
  message?: string;
};

const DUMMY_MARKERS =
  /(?:SAMPLE|SPECIMEN|FAKE|DUMMY|NOT\s+VALID|FOR\s+TEST(?:ING)?|VOID|PLACEHOLDER|EXAMPLE\s+ONLY)/i;

const ID_TEXT_SIGNALS: RegExp[] = [
  /(?:PASSPORT|IDENTITY|NATIONAL|ID\s*(?:NO|NUMBER|CARD)|SURNAME|GIVEN\s*NAME|DATE\s*OF\s*BIRTH|DOB|EXPIR|NATIONALITY|AUTHORITY)/i,
  /(?:DRIV(?:ING|ER'?S?)\s*(?:LICEN[CS]E|PERMIT))/i,
  /P<[A-Z]{3}/,
  /<<+/,
  /\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}/,
  /\b\d{7,12}\b/,
  /(?:MALE|FEMALE|SEX)/i,
  /KITAMBULISHO|JAMHURI|MAISHA|SOOMAALIYA|SOMALIA|SOMALILAND|AQOONSIGA|KAARKA|KAADHKA|TIRSIGA|MUWAADINKA|BAASABOOR|P<[A-Z]{3}/i,
];

function countIdTextSignals(text: string): number {
  return ID_TEXT_SIGNALS.filter((pattern) => pattern.test(text)).length;
}

function hasParsedIdFields(extracted: IdDocumentDetails): boolean {
  if (extracted.documentNumber?.trim()) return true;
  if (extracted.fullName?.trim() || extracted.surname?.trim()) return true;
  if (extracted.dateOfBirth?.trim() || extracted.expiryDate?.trim()) return true;
  if (extracted.documentType !== "unknown") return true;
  return getKycOcrDisplayRows(extracted as Record<string, unknown>).length > 0;
}

/**
 * Guess whether an upload is a non-ID / dummy image vs a real document OCR
 * just failed to read. Only flags dummy on high-confidence signals — lenient.
 */
export function assessKycDocumentPhoto(
  extracted: IdDocumentDetails
): DocumentPhotoAssessment {
  const raw = (extracted.rawText ?? "").trim();
  const compact = raw.replace(/\s+/g, "");
  const signalCount = countIdTextSignals(raw);
  const hasFields = hasParsedIdFields(extracted);

  if (hasFields || signalCount >= 2) {
    return { likelyDummy: false, confidence: "none" };
  }

  if (DUMMY_MARKERS.test(raw) && signalCount === 0 && !hasFields) {
    return {
      likelyDummy: true,
      confidence: "high",
      message:
        "This image doesn't look like a valid ID. Please upload a clear photo of your real document.",
    };
  }

  // Almost no readable text and zero ID cues — likely not an ID photo at all.
  if (compact.length < 15 && signalCount === 0) {
    return {
      likelyDummy: true,
      confidence: "high",
      message:
        "We couldn't detect an ID in this image. Please upload a clear photo of your real document.",
    };
  }

  // Default: treat as a real document with poor OCR — manual entry is fine.
  return { likelyDummy: false, confidence: "none" };
}
