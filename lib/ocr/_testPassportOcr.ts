import { validateTd3Mrz, mrzCheckDigit } from "./mrzValidation";
import { parseIdDocumentText } from "./parseIdDocumentText";
import { sanitizePassportDetails } from "./sanitizePassportDetails";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

/** ICAO 9303 sample passport (valid check digits). */
const ICAO_SAMPLE = `
REPUBLIC OF UTOPIA
PASSPORT
SURNAME: ERIKSSON
GIVEN NAMES: ANNA MARIA
P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<
L898902C36UTO7408122F1204159ZE184226B<<<<<10
`;

/** Kenya-style passport with computed check digits. */
function buildKenyaPassportMrz() {
  const line1 = "P<KENMWATI<<SALOME<GATHONI<<<<<<<<<<<<<<<<<<<<";
  const doc = "AK1067169";
  const docCheck = mrzCheckDigit(doc);
  const nationality = "KEN";
  const dob = "020502";
  const dobCheck = mrzCheckDigit(dob);
  const sex = "F";
  const expiry = "250726";
  const expiryCheck = mrzCheckDigit(expiry);
  const optional = "<<<<<<<<<<<<<<";
  const optionalCheck = mrzCheckDigit(optional);
  const compositeData =
    doc +
    String(docCheck) +
    nationality +
    dob +
    String(dobCheck) +
    sex +
    expiry +
    String(expiryCheck) +
    optional +
    String(optionalCheck);
  const compositeCheck = mrzCheckDigit(compositeData);
  const line2 =
    doc +
    String(docCheck) +
    nationality +
    dob +
    String(dobCheck) +
    sex +
    expiry +
    String(expiryCheck) +
    optional +
    String(optionalCheck) +
    String(compositeCheck);
  return { line1, line2 };
}

const kenyaMrz = buildKenyaPassportMrz();
const KENYA_PASSPORT = `
REPUBLIC OF KENYA
PASSPORT
SURNAME: MWATI
GIVEN NAMES: SALOME GATHONI
NATIONALITY: KEN
DATE OF BIRTH: 02-05-2002
SEX: F
${kenyaMrz.line1}
${kenyaMrz.line2}
`;

/** Somalia passport with valid MRZ. */
function buildSomaliaPassportMrz() {
  const line1 = "P<SOMALI<<MOHAMED<ABDI<<<<<<<<<<<<<<<<<<<<<<<<";
  const doc = "P12345678";
  const docCheck = mrzCheckDigit(doc);
  const nationality = "SOM";
  const dob = "900115";
  const dobCheck = mrzCheckDigit(dob);
  const sex = "M";
  const expiry = "280630";
  const expiryCheck = mrzCheckDigit(expiry);
  const optional = "<<<<<<<<<<<<<<";
  const optionalCheck = mrzCheckDigit(optional);
  const compositeData =
    doc +
    String(docCheck) +
    nationality +
    dob +
    String(dobCheck) +
    sex +
    expiry +
    String(expiryCheck) +
    optional +
    String(optionalCheck);
  const compositeCheck = mrzCheckDigit(compositeData);
  const line2 =
    doc +
    String(docCheck) +
    nationality +
    dob +
    String(dobCheck) +
    sex +
    expiry +
    String(expiryCheck) +
    optional +
    String(optionalCheck) +
    String(compositeCheck);
  return { line1, line2 };
}

const somaliaMrz = buildSomaliaPassportMrz();
const SOMALIA_PASSPORT = `
JAMHUURIYADDA SOOMAALIYA
PASSPORT
SURNAME: ALI
GIVEN NAMES: MOHAMED ABDI
${somaliaMrz.line1}
${somaliaMrz.line2}
`;

/** Noisy OCR without valid MRZ — should not invent random passport fields. */
const GARBLED_PASSPORT_OCR = `
PASSPORT
BAASABOOR
MALE FEMALE SOM KEN 12345678
12-05-1999 26-07-2025 01-01-2010
RANDOM NOISE ABC DEF GHI
`;

/** Corrupt MRZ (wrong check digits). */
const CORRUPT_MRZ = `
PASSPORT
P<KENSMITH<<JOHN<PAUL<<<<<<<<<<<<<<<<<<<<<<<<
AK1067169X9KEN0205022F2507261<<<<<<<<<<<<<<99
`;

console.log("=== MRZ validation ===");
const icaoValidation = validateTd3Mrz(
  "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<",
  "L898902C36UTO7408122F1204159ZE184226B<<<<<10"
);
console.log("ICAO sample valid:", icaoValidation.fullyValid);
assert(icaoValidation.fullyValid, "ICAO sample MRZ should validate");

const kenyaValidation = validateTd3Mrz(kenyaMrz.line1, kenyaMrz.line2);
console.log("Kenya MRZ valid:", kenyaValidation.fullyValid);
assert(kenyaValidation.fullyValid, "Kenya sample MRZ should validate");

console.log("\n=== Passport parsing ===");

const icaoParsed = parseIdDocumentText(ICAO_SAMPLE);
console.log("ICAO:", {
  name: icaoParsed.fullName,
  doc: icaoParsed.documentNumber,
  nat: icaoParsed.nationality,
  dob: icaoParsed.dateOfBirth,
  sex: icaoParsed.sex,
  exp: icaoParsed.expiryDate,
});
assert(icaoParsed.fullName.includes("ANNA"), "ICAO name should extract");
assert(icaoParsed.documentNumber === "L898902C3", "ICAO doc number");
assert(icaoParsed.nationality === "UTO", "ICAO nationality");
assert(icaoParsed.sex === "F", "ICAO sex");
assert(icaoParsed.dateOfBirth === "1974-08-12", "ICAO DOB");

const kenyaParsed = parseIdDocumentText(KENYA_PASSPORT);
console.log("Kenya:", {
  name: kenyaParsed.fullName,
  doc: kenyaParsed.documentNumber,
  nat: kenyaParsed.nationality,
  dob: kenyaParsed.dateOfBirth,
  sex: kenyaParsed.sex,
});
assert(kenyaParsed.fullName.includes("SALOME"), "Kenya name");
assert(kenyaParsed.surname === "MWATI" || kenyaParsed.fullName.includes("MWATI"), "Kenya surname");
assert(kenyaParsed.documentNumber === "AK1067169", "Kenya doc");
assert(kenyaParsed.nationality === "KEN", "Kenya nationality");
assert(kenyaParsed.sex === "F", "Kenya sex");

const somaliaParsed = parseIdDocumentText(SOMALIA_PASSPORT);
console.log("Somalia:", {
  name: somaliaParsed.fullName,
  doc: somaliaParsed.documentNumber,
  nat: somaliaParsed.nationality,
  sex: somaliaParsed.sex,
});
assert(somaliaParsed.nationality === "SOM", "Somalia nationality");
assert(somaliaParsed.sex === "M", "Somalia sex");

const garbledParsed = parseIdDocumentText(GARBLED_PASSPORT_OCR);
console.log("Garbled (should be mostly empty):", {
  name: garbledParsed.fullName,
  nat: garbledParsed.nationality,
  sex: garbledParsed.sex,
  dob: garbledParsed.dateOfBirth,
  doc: garbledParsed.documentNumber,
});
assert(!garbledParsed.fullName, "Garbled OCR should not invent name");
assert(!garbledParsed.sex, "Garbled OCR should not invent sex from standalone MALE/FEMALE");
assert(!garbledParsed.nationality || garbledParsed.nationality === "", "Garbled should not invent nationality");

assert(!garbledParsed.documentNumber, "Garbled should not invent passport number");

const corruptParsed = parseIdDocumentText(CORRUPT_MRZ);
console.log("Corrupt MRZ (should reject MRZ fields):", {
  name: corruptParsed.fullName,
  doc: corruptParsed.documentNumber,
  nat: corruptParsed.nationality,
});
assert(!corruptParsed.fullName || corruptParsed.fullName.length < 3, "Corrupt MRZ should not trust names");
assert(!corruptParsed.documentNumber, "Corrupt MRZ should not trust document number");

console.log("\n=== Sanitize low confidence ===");
const noisy = sanitizePassportDetails(
  {
    documentType: "passport",
    fullName: "RANDOM GARBAGE",
    givenNames: "RANDOM",
    surname: "GARBAGE",
    nationality: "RANDOM NOISE",
    sex: "M",
    dateOfBirth: "01-01-1800",
    documentNumber: "X99999999",
    rawText: "PASSPORT noise",
  },
  { mrzFullyValid: false }
);
assert(!noisy.details.fullName, "Untrusted name cleared");
assert(!noisy.details.sex, "Untrusted sex cleared");
assert(!noisy.details.nationality, "Unknown nationality cleared");
assert(noisy.lowConfidenceFields.length > 0, "Should report low confidence fields");

console.log("\nAll passport OCR tests passed.");
