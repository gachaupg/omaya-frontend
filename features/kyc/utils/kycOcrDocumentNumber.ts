import { isValidSomaliaNationalIdNumber } from "@/lib/ocr/parseSomaliaIdText";
import { isValidKenyaNationalIdNumber } from "@/lib/ocr/parseKenyaIdText";
import { isPassportNumberFormat } from "@/lib/ocr/parsePassportText";

/** Only auto-fill OCR document numbers that match expected format for the selected type. */
export function isTrustedOcrDocumentNumber(
  documentType: string,
  country: string,
  documentNumber: string
): boolean {
  const value = documentNumber.trim();
  if (!value) return false;

  const type = documentType.trim().toLowerCase();
  const countryName = country.trim().toLowerCase();

  if (type === "national_id" && countryName.includes("kenya")) {
    return isValidKenyaNationalIdNumber(value);
  }

  if (type === "national_id" && countryName.includes("somalia")) {
    return isValidSomaliaNationalIdNumber(value);
  }

  if (type === "passport") {
    return isPassportNumberFormat(value);
  }

  if (type === "national_id") {
    return /^\d{7,14}$/.test(value.replace(/\D/g, ""));
  }

  return value.length >= 6;
}
