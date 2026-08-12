import type { IdDocumentDetails } from "@/lib/ocr/types";

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
  { key: "address", label: "Address" },
];

export function buildKycUserDetails(
  extracted: IdDocumentDetails,
  context: { country: string; documentType: string }
): Record<string, unknown> {
  return {
    ...extracted,
    country: context.country,
    selected_document_type: context.documentType,
  };
}

export function getKycOcrDisplayRows(
  details: Record<string, unknown>
): Array<{ label: string; value: string }> {
  return KYC_OCR_ROW_FIELDS.map(({ key, label }) => ({
    label,
    value: String(details[key] ?? "").trim(),
  })).filter((row) => row.value.length > 0);
}
