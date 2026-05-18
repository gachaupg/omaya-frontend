/** Passport only needs the main photo/data page — not front + back like card IDs. */
export function isPassportDocumentType(documentType: string): boolean {
  return documentType.trim().toLowerCase() === "passport";
}

export function requiresDocumentBackSide(documentType: string): boolean {
  const normalized = documentType.trim().toLowerCase();
  return normalized !== "" && !isPassportDocumentType(normalized);
}
