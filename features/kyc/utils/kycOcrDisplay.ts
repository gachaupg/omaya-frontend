import type { IdDocumentDetails } from "@/lib/ocr/types";
import { getKycDocumentNumberFieldLabel } from "@/features/kyc/utils/kycOcrManualFallback";
import { isPassportDocumentType } from "@/features/kyc/utils/kycDocumentUtils";

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

/** Fields shown as empty editable inputs when OCR confidence is low. */
export const KYC_PASSPORT_ENTRY_FIELDS: Array<keyof IdDocumentDetails> = [
  "fullName",
  "givenNames",
  "surname",
  "documentNumber",
  "nationality",
  "dateOfBirth",
  "sex",
  "expiryDate",
  "issueDate",
];

export const KYC_NATIONAL_ID_ENTRY_FIELDS: Array<keyof IdDocumentDetails> = [
  "fullName",
  "givenNames",
  "surname",
  "documentNumber",
  "dateOfBirth",
  "sex",
  "issueDate",
  "placeOfBirth",
  "placeOfIssue",
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

function getEntryFieldsForDocumentType(documentType: string): Array<keyof IdDocumentDetails> {
  if (isPassportDocumentType(documentType)) {
    return KYC_PASSPORT_ENTRY_FIELDS;
  }
  return KYC_NATIONAL_ID_ENTRY_FIELDS;
}

export type KycOcrDisplayRow = {
  key: keyof IdDocumentDetails;
  label: string;
  value: string;
  placeholder: string;
  needsManualEntry: boolean;
};

const MANUAL_ENTRY_PLACEHOLDERS: Partial<Record<keyof IdDocumentDetails, string>> = {
  fullName: "Enter full name as on document",
  givenNames: "Enter given name(s)",
  surname: "Enter surname",
  documentNumber: "Enter document number",
  nationality: "Enter nationality (e.g. KEN, SOM)",
  dateOfBirth: "Enter date of birth",
  sex: "M, F, or X",
  expiryDate: "Enter expiry date",
  issueDate: "Enter issue date",
  placeOfBirth: "Enter place of birth",
  placeOfIssue: "Enter place of issue",
  occupation: "Enter occupation",
  address: "Enter address",
};

function resolveDocumentType(
  details: Record<string, unknown>,
  selectedDocumentType?: string
): string {
  return String(
    selectedDocumentType ??
      details.selected_document_type ??
      details.documentType ??
      ""
  ).trim();
}

export function getKycOcrDisplayRows(
  details: Record<string, unknown>,
  options?: {
    /** When true, show all core fields as editable inputs (blank if not read). */
    manualEntryMode?: boolean;
    lowConfidenceFields?: string[];
    selectedDocumentType?: string;
  }
): KycOcrDisplayRow[] {
  const country = String(details.country ?? "");
  const documentType = resolveDocumentType(details, options?.selectedDocumentType);
  const documentNumberLabel = getKycDocumentNumberFieldLabel(
    country,
    documentType
  );
  const lowConfidence = new Set(options?.lowConfidenceFields ?? []);
  const entryFields = getEntryFieldsForDocumentType(documentType);

  const rows = KYC_OCR_ROW_FIELDS.map(({ key, label }) => {
    const rawValue =
      key === "documentType" && options?.selectedDocumentType
        ? options.selectedDocumentType
        : String(details[key] ?? "").trim();
    const value = formatDisplayValue(key, rawValue);
    const forceBlank =
      options?.manualEntryMode &&
      entryFields.includes(key) &&
      (lowConfidence.has(key) || !value);
    const needsManualEntry = forceBlank || (options?.manualEntryMode && !value);
    return {
      key,
      label: key === "documentNumber" ? documentNumberLabel : label,
      value: forceBlank ? "" : value,
      placeholder:
        key === "documentNumber"
          ? getKycDocumentNumberPlaceholder(country, documentType, true)
          : (MANUAL_ENTRY_PLACEHOLDERS[key] ?? "Enter manually"),
      needsManualEntry: Boolean(options?.manualEntryMode && entryFields.includes(key)),
    };
  });

  if (options?.manualEntryMode) {
    const manualKeys = new Set<keyof IdDocumentDetails>([
      "documentType",
      ...entryFields,
    ]);
    return rows.filter((row) => manualKeys.has(row.key));
  }

  return rows.filter((row) => row.value.length > 0);
}

function getKycDocumentNumberPlaceholder(
  country: string,
  documentType: string,
  manualFallback: boolean
): string {
  const type = documentType.trim().toLowerCase();
  const countryName = country.trim().toLowerCase();
  if (!manualFallback) return "Auto-filled from document or enter manually";
  if (type === "passport") return "Enter passport number";
  if (countryName.includes("kenya")) return "Enter ID Number (8 digits)";
  if (countryName.includes("somalia")) return "Enter Identity Number (11 digits)";
  return "Enter document number";
}

export const KYC_OCR_READONLY_FIELDS = new Set<keyof IdDocumentDetails>([
  "documentType",
]);
