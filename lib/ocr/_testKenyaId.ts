import { parseIdDocumentText } from "./parseIdDocumentText";
import { parseKenyaNationalIdText, isValidKenyaNationalIdNumber } from "./parseKenyaIdText";
import {
  parseSomaliaNationalIdText,
  isValidSomaliaNationalIdNumber,
} from "./parseSomaliaIdText";

const kenyaIdeal = `
JAMHURI YA KENYA
REPUBLIC OF KENYA
KITAMBULISHO CHA TAIFA
NATIONAL IDENTITY CARD
Surname
MWANGI
Given Name
PETER GACHAU
Sex
MALE
Nationality
KEN
Date of Birth
24.08.1998
Place of Birth
NYERI CENTRAL
ID NUMBER
35407835
Date of Expiry
08.01.2034
Place of Issue
HDM CITY SQUARE
SERIAL NUMBER
706258347
`;

const kenyaLegacySalome = `
JAMHURI YA KENYA
REPUBLIC OF KENYA
SERIAL NUMBER
251518078
ID NUMBER
39935744
FULL NAMES
SALOME GATHONI MWATI
DATE OF BIRTH
20. 05. 2002
SEX
FEMALE
DISTRICT OF BIRTH
THIKA WEST
PLACE OF ISSUE
JUJA
DATE OF ISSUE
26. 07. 2021
`;

const kenyaMaisha = `
JAMHURI YA KENYA
REPUBLIC OF KENYA
MAISHA CARD
NATIONAL IDENTITY CARD
Full name
SALOME GATHONI MWATI
Sex Female
Nationality KEN
Date of Birth 20.05.2002
ID Number 39935744
Serial No. 251518078
Date of Issue 26.07.2021
`;

const somaliaIdeal = `
Federal Republic of Somalia
IDENTITY CARD
Magaca / Name
Shufti Ahmed Mahammud
Sex
Female
Date of Birth
22-02-1980
Identity Number
23654789221
Date of Issue
15-11-2022
Date of Expiry
12-06-2027
`;

console.log("Kenya legacy Salome:", parseKenyaNationalIdText(kenyaLegacySalome));
console.log("Kenya legacy merge:", parseIdDocumentText(kenyaLegacySalome));
console.log("Kenya Maisha:", parseKenyaNationalIdText(kenyaMaisha));
console.log("Kenya Maisha merge:", parseIdDocumentText(kenyaMaisha));
console.log("Kenya ideal:", parseKenyaNationalIdText(kenyaIdeal));
console.log("Kenya merge:", parseIdDocumentText(kenyaIdeal));
console.log("Somalia ideal:", parseSomaliaNationalIdText(somaliaIdeal));
console.log("Somalia merge:", parseIdDocumentText(somaliaIdeal));
console.log("Valid Kenya 39935744:", isValidKenyaNationalIdNumber("39935744"));
console.log("Valid Kenya 35407835:", isValidKenyaNationalIdNumber("35407835"));
console.log("Valid Kenya serial 251518078:", isValidKenyaNationalIdNumber("251518078"));
console.log("Valid Somalia 23654789221:", isValidSomaliaNationalIdNumber("23654789221"));
