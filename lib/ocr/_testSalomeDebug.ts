import { parseKenyaNationalIdText } from "./parseKenyaIdText";

const liveOcr = `
JAMHURI YA KENYA
REPUBLIC OF KENYA
women: 251518078
onsen: 39935744
SALOME GATHONI MWATT
BIRTH
SEX
20. 05. 2002
FEMALE
DISTRICT OF BIRTH
THIKA WEST
PLACE OF ISSUE
JUJA
DATE OF ISSUE
26.07.2021
`;

const lines = liveOcr.trim().split("\n").map((l) => l.trim()).filter(Boolean);
const labels = [
  "FULL NAMES",
  "FULL NAME",
  "FULLNAME",
  "SURNAME",
  "FAMILY NAME",
  "GIVEN NAME",
  "GIVEN NAMES",
  "OTHER NAMES",
  "FIRST NAME",
];

for (let i = 0; i < lines.length; i += 1) {
  const upper = lines[i].toUpperCase();
  for (const label of labels) {
    const idx = upper.indexOf(label);
    if (idx >= 0) {
      console.log("MATCH", { label, line: lines[i], next: lines[i + 1] ?? "" });
    }
  }
}

console.log("parsed fullName:", parseKenyaNationalIdText(liveOcr).fullName);
