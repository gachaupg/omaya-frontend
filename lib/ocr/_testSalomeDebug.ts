import { parseKenyaNationalIdText } from "./parseKenyaIdText";

const clean = (value: string) => value.replace(/\s+/g, " ").trim().toUpperCase();
const lettersOnly = (value: string) =>
  value.replace(/[^A-Za-z\s]/g, " ").replace(/\s+/g, " ").trim();

function isIgnoredKenyaNameLine(value: string): boolean {
  return /KENYA|KITAMBULISHO|JAMHURI|NATIONAL|IDENTITY|MALE|FEMALE|KEN\b|MAISHA|HOLDER|SIGN|SERIAL|DISTRICT|PLACE|DATE|ISSUE|BIRTH|EXPIR|REPUBLIC|CARD|NAMBARI|SER[\s-]|THIKA|JUJA|NYERI|NAIROBI|MOMBASA|KISUMU|NAKURU|ELDORET|WEST|SQUARE|CENTRAL|HDM/i.test(
    value
  );
}

function parsePersonNameLine(line: string): string {
  const stripped = clean(lettersOnly(line));
  console.log("parsePersonNameLine", JSON.stringify(line), "->", JSON.stringify(stripped), {
    ignored: isIgnoredKenyaNameLine(stripped),
    regex: /^[A-Z][A-Z\s'-]+$/.test(stripped),
    words: stripped.split(/\s+/).length,
  });
  if (stripped.length < 4 || stripped.length > 60) return "";
  if (!/^[A-Z][A-Z\s'-]+$/.test(stripped)) return "";
  if (isIgnoredKenyaNameLine(stripped)) return "";
  const words = stripped.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 5) return "";
  return stripped;
}

const lines = `
JAMHURI YA KENYA
REPUBLIC OF KENYA
women: 251518078
onsen: 39935744
SALOME GATHONI MWATT
BIRTH
`.trim().split("\n");

console.log("direct parse:", parsePersonNameLine("SALOME GATHONI MWATT"));
console.log("kenya parse:", parseKenyaNationalIdText(lines.join("\n")).fullName);
