import type { IdDocumentDetails } from "@/lib/ocr/types";
import { getKycDocumentNumberFieldLabel } from "@/features/kyc/utils/kycOcrManualFallback";

export const KYC_OCR_ROW_FIELDS: Array<{
  key: keyof IdDocumentDetails;
  label: string;
}> = [
  { key: "documentType", label: "Document type" },
  { key: "fullName", label: "Full name" },
  { key: "givenNames", label: "Given names" },
  { key: "surname", label: "Surname" },
  { key: "documentNumber", label: "Document number" },
  { key: "nationality", label: "Nationality" },
  { key: "dateOfBirth", label: "Date of birth" },
  { key: "sex", label: "Sex" },
  { key: "expiryDate", label: "Expiry date" },
  { key: "issueDate", label: "Issue date" },
  { key: "placeOfBirth", label: "Place of birth" },
  { key: "placeOfIssue", label: "Place of issue" },
  { key: "occupation", label: "Occupation" },
  { key: "address", label: "Address" },
];

export function buildKycUserDetails(
  extracted: IdDocumentDetails,
  context: { country: string; documentType: string }
): Record<string, unknown> {
  const selectedType = context.documentType.trim();
  const ocrType = extracted.documentType;

  return {
    ...extracted,
    country: context.country,
    selected_document_type: selectedType,
    // Prefer the type the user selected — OCR can mislabel ID cards as passport
    documentType: selectedType || ocrType,
  };
}

function formatDisplayValue(key: keyof IdDocumentDetails, value: string): string {
  if (key === "documentType") {
    if (value === "national_id") return "National ID";
    if (value === "passport") return "Passport";
    if (value === "drivers_license") return "Driver's license";
  }
  return value;
}

export function getKycOcrDisplayRows(
  details: Record<string, unknown>
): Array<{ key: keyof IdDocumentDetails; label: string; value: string }> {
  const country = String(details.country ?? "");
  const documentType = String(
    details.selected_document_type ?? details.documentType ?? ""
  );
  const documentNumberLabel = getKycDocumentNumberFieldLabel(
    country,
    documentType
  );

  return KYC_OCR_ROW_FIELDS.map(({ key, label }) => ({
    key,
    label: key === "documentNumber" ? documentNumberLabel : label,
    value: formatDisplayValue(
      key,
      String(details[key] ?? "").trim()
    ),
  })).filter((row) => row.value.length > 0);
}

export const KYC_OCR_READONLY_FIELDS = new Set<keyof IdDocumentDetails>([
  "documentType",
]);
