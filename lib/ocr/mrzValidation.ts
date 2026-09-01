/** ICAO 9303 TD3 MRZ check-digit validation for passport line 2. */

const WEIGHTS = [7, 3, 1] as const;

function mrzCharValue(char: string): number {
  if (char === "<") return 0;
  if (/\d/.test(char)) return Number(char);
  const code = char.charCodeAt(0);
  if (code >= 65 && code <= 90) return code - 55;
  return 0;
}

export function mrzCheckDigit(data: string): number {
  let sum = 0;
  for (let i = 0; i < data.length; i += 1) {
    sum += mrzCharValue(data[i]) * WEIGHTS[i % 3];
  }
  return sum % 10;
}

function validateDigitField(data: string, digitChar: string): boolean {
  if (!/^\d$/.test(digitChar)) return false;
  return mrzCheckDigit(data) === Number(digitChar);
}

export type MrzValidationResult = {
  valid: boolean;
  line1: string;
  line2: string;
  documentNumberValid: boolean;
  dateOfBirthValid: boolean;
  expiryDateValid: boolean;
  compositeValid: boolean;
  /** All individual + composite checks pass */
  fullyValid: boolean;
};

/** Pad or trim MRZ line to exactly 44 characters. */
export function normalizeMrzLine(line: string): string {
  const cleaned = line.toUpperCase().replace(/[^A-Z0-9<]/g, "");
  if (cleaned.length >= 44) return cleaned.slice(0, 44);
  return cleaned.padEnd(44, "<");
}

export function validateTd3MrzLine2(line2: string): Omit<
  MrzValidationResult,
  "line1" | "line2" | "valid"
> {
  const line = normalizeMrzLine(line2);
  const documentNumber = line.slice(0, 9);
  const documentNumberCheck = line.slice(9, 10);
  const nationality = line.slice(10, 13);
  const dateOfBirth = line.slice(13, 19);
  const dateOfBirthCheck = line.slice(19, 20);
  const sex = line.slice(20, 21);
  const expiryDate = line.slice(21, 27);
  const expiryDateCheck = line.slice(27, 28);
  const optionalData = line.slice(28, 42);
  const optionalDataCheck = line.slice(42, 43);
  const compositeCheck = line.slice(43, 44);

  const documentNumberValid = validateDigitField(
    documentNumber,
    documentNumberCheck
  );
  const dateOfBirthValid = validateDigitField(dateOfBirth, dateOfBirthCheck);
  const expiryDateValid = validateDigitField(expiryDate, expiryDateCheck);
  const optionalDataValid =
    optionalData.replace(/</g, "").length === 0 ||
    validateDigitField(optionalData, optionalDataCheck);

  const compositeData =
    documentNumber +
    documentNumberCheck +
    nationality +
    dateOfBirth +
    dateOfBirthCheck +
    sex +
    expiryDate +
    expiryDateCheck +
    optionalData +
    optionalDataCheck;
  const compositeValid = validateDigitField(compositeData, compositeCheck);

  const fullyValid =
    documentNumberValid &&
    dateOfBirthValid &&
    expiryDateValid &&
    optionalDataValid &&
    /^[A-Z0-9<]{9}$/.test(documentNumber) &&
    /^[A-Z]{3}$/.test(nationality.replace(/</g, "")) &&
    /^\d{6}$/.test(dateOfBirth) &&
    /^[MF<X]$/.test(sex) &&
    /^\d{6}$/.test(expiryDate);

  return {
    documentNumberValid,
    dateOfBirthValid,
    expiryDateValid,
    compositeValid,
    fullyValid,
  };
}

export function validateTd3Mrz(line1: string, line2: string): MrzValidationResult {
  const normalized1 = normalizeMrzLine(line1);
  const normalized2 = normalizeMrzLine(line2);
  const checks = validateTd3MrzLine2(normalized2);
  const valid =
    normalized1.startsWith("P<") &&
    normalized1.includes("<<") &&
    checks.fullyValid;

  return {
    valid,
    line1: normalized1,
    line2: normalized2,
    ...checks,
  };
}
