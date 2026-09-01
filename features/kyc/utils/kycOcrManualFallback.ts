import { isKenyaNationalIdText } from "@/lib/ocr/parseKenyaIdText";
import { isSomaliaNationalIdText } from "@/lib/ocr/parseSomaliaIdText";

function normalizeCountry(country: string): string {
  return country.trim().toLowerCase();
}

export type KycIdDocumentCountryContext = {
  rawText?: string;
  nationality?: string;
};

/** Detect issuing country from OCR text — overrides dropdown when markers are clear. */
export function detectKycIdDocumentCountry(
  rawText: string,
  context: KycIdDocumentCountryContext = {}
): string | null {
  const text = rawText.trim();
  if (!text) return null;

  if (isKenyaNationalIdText(text)) return "Kenya";
  if (isSomaliaNationalIdText(text)) return "Somalia";

  const nationality = (context.nationality ?? "").trim().toUpperCase();
  if (nationality === "KEN") return "Kenya";
  if (nationality === "SOM") return "Somalia";

  if (
    /\bID\s*NUMBER\b/i.test(text) &&
    /KITAMBULISHO|JAMHURI YA KENYA|REPUBLIC OF KENYA|MAISHA/i.test(text)
  ) {
    return "Kenya";
  }

  if (
    /\bIDENTITY\s*NUMBER\b/i.test(text) &&
    /SOOMAALIYA|SOMALIA|JAMHUURIYADDA|AQOONSIGA|FEDERAL REPUBLIC OF SOMALIA/i.test(
      text
    )
  ) {
    return "Somalia";
  }

  return null;
}

/** Country used for ID labels, hints, and number validation after OCR. */
export function resolveKycEffectiveCountry(
  selectedCountry: string,
  context: KycIdDocumentCountryContext = {}
): string {
  return (
    detectKycIdDocumentCountry(context.rawText ?? "", context) ??
    (selectedCountry.trim() || "Somalia")
  );
}

export function getKycDocumentNumberFieldLabel(
  country: string,
  documentType: string
): string {
  const type = documentType.trim().toLowerCase();
  const countryName = normalizeCountry(country);

  if (type === "passport") return "Passport number";
  if (countryName.includes("kenya")) return "ID Number";
  if (countryName.includes("somalia")) return "Identity Number";
  return "Document number";
}

export function getKycManualIdNumberHint(country: string): string {
  const countryName = normalizeCountry(country);

  if (countryName.includes("kenya")) {
    return "Enter the 8-digit ID Number from your card (labelled “ID NUMBER”).";
  }
  if (countryName.includes("somalia")) {
    return "Enter the 11-digit Identity Number from your card (labelled “Identity Number”).";
  }
  return "Enter the number shown on your ID card.";
}

export function getKycManualFallbackMessage(
  country: string,
  documentType: string,
  lowConfidenceFields?: string[]
): string {
  const type = documentType.trim().toLowerCase();
  const fieldLabel = getKycDocumentNumberFieldLabel(country, documentType);

  if (type === "passport") {
    if (lowConfidenceFields && lowConfidenceFields.length > 0) {
      return "Some passport details couldn't be read reliably. Review the fields below, fill in any blanks, and correct anything that looks wrong before submitting.";
    }
    return "Enter your passport number below to continue, or upload a clearer photo with the MRZ lines visible at the bottom.";
  }

  return `We couldn't read your document reliably. Please fill in all the fields below manually. You can also upload a clearer photo.`;
}

export function getKycDocumentNumberPlaceholder(
  country: string,
  documentType: string,
  manualFallback: boolean
): string {
  const type = documentType.trim().toLowerCase();
  const countryName = normalizeCountry(country);

  if (!manualFallback) return "Auto-filled from document or enter manually";
  if (type === "passport") return "Enter your passport number manually";

  if (countryName.includes("kenya")) {
    return "Enter ID Number (8 digits)";
  }
  if (countryName.includes("somalia")) {
    return "Enter Identity Number (11 digits)";
  }
  return "Enter your ID number manually";
}
