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
706258347
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

console.log("Kenya ideal:", parseKenyaNationalIdText(kenyaIdeal));
console.log("Kenya merge:", parseIdDocumentText(kenyaIdeal));
console.log("Somalia ideal:", parseSomaliaNationalIdText(somaliaIdeal));
console.log("Somalia merge:", parseIdDocumentText(somaliaIdeal));
console.log("Valid Kenya 35407835:", isValidKenyaNationalIdNumber("35407835"));
console.log("Valid Kenya serial:", isValidKenyaNationalIdNumber("706258347"));
console.log("Valid Somalia 23654789221:", isValidSomaliaNationalIdNumber("23654789221"));
