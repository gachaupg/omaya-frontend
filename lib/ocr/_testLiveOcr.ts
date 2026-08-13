import { createWorker, PSM } from "tesseract.js";
import { parseIdDocumentText } from "./parseIdDocumentText";
import { parseKenyaNationalIdText } from "./parseKenyaIdText";
import { isValidKenyaNationalIdNumber } from "./parseKenyaIdText";
import { isTrustedOcrDocumentNumber } from "../../features/kyc/utils/kycOcrDocumentNumber";

const imagePath =
  process.argv[2] ??
  "C:/Users/PETER/.cursor/projects/c-Users-PETER-Desktop-projects-omaya-OMAYAExchangeFronted/assets/c__Users_PETER_AppData_Roaming_Cursor_User_workspaceStorage_88e4845c5da14a016eb9cfce2695141c_images_WhatsApp_Image_2026-07-31_at_6.25.49_PM__1_-8d726397-6b45-414e-bed9-c8619f1afff8.png";

function scoreOcrText(text: string) {
  const dates = (text.match(/\d{1,2}[.\-/]\s*\d{1,2}[.\-/]\s*\d{4}/g) ?? []).length;
  const idNumbers = (text.match(/\b\d{6,14}\b/g) ?? []).length;
  const labels = (
    text.match(/SURNAME|GIVEN NAME|ID NUMBER|354078|KITAMBULISHO|JAMHURI|MALE|KEN\b/gi) ?? []
  ).length;
  const kenya = /KITAMBULISHO|JAMHURI|MAISHA/i.test(text) ? 5 : 0;
  return text.length * 0.05 + dates * 8 + idNumbers * 10 + labels * 6 + kenya;
}

function pickBestOcrText(texts: string[]) {
  const unique = [...new Set(texts.map((t) => t.trim()).filter(Boolean))];
  if (unique.length === 0) return "";
  const ranked = unique.sort((a, b) => scoreOcrText(b) - scoreOcrText(a));
  return `${ranked[0]}\n${ranked.slice(1).join("\n")}`.trim();
}

async function main() {
  const worker = await createWorker("eng");
  const psmModes = [PSM.SINGLE_BLOCK, PSM.SPARSE_TEXT, PSM.AUTO];
  const texts: string[] = [];

  for (const psm of psmModes) {
    await worker.setParameters({ tessedit_pageseg_mode: psm });
    const { data } = await worker.recognize(imagePath);
    if (data.text?.trim()) texts.push(data.text);
  }

  await worker.setParameters({
    tessedit_pageseg_mode: PSM.SPARSE_TEXT,
    tessedit_char_whitelist: "0123456789",
  });
  const digitsOnly = await worker.recognize(imagePath);
  if (digitsOnly.data.text?.trim()) texts.push(digitsOnly.data.text);

  await worker.terminate();

  const combined = pickBestOcrText(texts);
  const parsed = parseIdDocumentText(combined);
  const kenya = parseKenyaNationalIdText(combined);
  const trusted = isTrustedOcrDocumentNumber("national_id", "Kenya", parsed.documentNumber ?? "");

  console.log("=== COMBINED OCR (first 2000 chars) ===\n");
  console.log(combined.slice(0, 2000));
  console.log("\n=== PARSED documentNumber ===", parsed.documentNumber);
  console.log("=== KENYA documentNumber ===", kenya.documentNumber);
  console.log("=== TRUSTED for KYC ===", trusted);
  console.log("=== Expected === 35407835");
}

main().catch(console.error);
