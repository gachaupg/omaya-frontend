export type IdDocumentType = "passport" | "national_id" | "unknown";

export type IdDocumentDetails = {
  documentType: IdDocumentType;
  fullName: string;
  givenNames: string;
  surname: string;
  documentNumber: string;
  nationality: string;
  dateOfBirth: string;
  sex: string;
  expiryDate: string;
  issueDate: string;
  placeOfBirth: string;
  placeOfIssue: string;
  address: string;
  rawText: string;
};

export const EMPTY_ID_DOCUMENT_DETAILS: IdDocumentDetails = {
  documentType: "unknown",
  fullName: "",
  givenNames: "",
  surname: "",
  documentNumber: "",
  nationality: "",
  dateOfBirth: "",
  sex: "",
  expiryDate: "",
  issueDate: "",
  placeOfBirth: "",
  placeOfIssue: "",
  address: "",
  rawText: "",
};
