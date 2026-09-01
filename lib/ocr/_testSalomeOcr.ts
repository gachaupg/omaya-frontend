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

const result = parseKenyaNationalIdText(liveOcr);
console.log(JSON.stringify(result, null, 2));
console.log("fullName empty?", result.fullName === "");
