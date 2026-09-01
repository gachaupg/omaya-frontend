"use client";



import { parseIdDocumentTextWithMeta } from "./parseIdDocumentText";

import { preprocessIdImageForOcr } from "./preprocessIdImage";

import type { IdDocumentDetails } from "./types";

export type IdDocumentOcrResult = IdDocumentDetails & {
  ocrLowConfidenceFields: string[];
  ocrMrzUsed: boolean;
};



export type OcrProgress = {

  status: string;

  progress: number;

};



type RunIdDocumentOcrOptions = {

  onProgress?: (progress: OcrProgress) => void;

};



function scoreOcrText(text: string) {
  const dates = (text.match(/\d{1,2}[.\-/]\s*\d{1,2}[.\-/]\s*\d{4}/g) ?? []).length;
  const monthDates = (text.match(/\d{1,2}\s+[A-Z]{3}\s+\d{4}/gi) ?? []).length;
  const idNumbers = (text.match(/\b\d{7,14}\b/g) ?? []).length;
  const labels = (
    text.match(
      /SURNAME|GIVEN NAME|ID NUMBER|IDENTITY NUMBER|NID|PASSPORT|NAME|MAGACA|LAMBAR|MALE|FEMALE|KEN\b|SOM\b|<<|P<[A-Z]{3}/gi
    ) ?? []
  ).length;
  const kenya = /KITAMBULISHO|JAMHURI|JAMNURI|MAISHA/i.test(text) ? 5 : 0;
  const somalia = /SOOMAALIYA|SOMALIA|JAMHUURIYADDA|AQOONSIGA|KAARKA/i.test(text)
    ? 8
    : 0;
  const passport = /PASSPORT|BAASABOOR|P<[A-Z]{3}|<<</i.test(text) ? 8 : 0;
  return (
    text.length * 0.05 +
    dates * 8 +
    monthDates * 8 +
    idNumbers * 10 +
    labels * 6 +
    kenya +
    somalia +
    passport
  );
}



function pickBestOcrText(texts: string[]) {

  const unique = [...new Set(texts.map((t) => t.trim()).filter(Boolean))];

  if (unique.length === 0) return "";

  if (unique.length === 1) return unique[0];



  const ranked = unique.sort((a, b) => scoreOcrText(b) - scoreOcrText(a));

  const best = ranked[0];

  const extras = ranked.slice(1).join("\n");

  return `${best}\n${extras}`.trim();

}



/** Fully client-side OCR — image never leaves the browser. */

export async function runIdDocumentOcr(

  file: File,

  options: RunIdDocumentOcrOptions = {}

): Promise<IdDocumentOcrResult> {

  const { createWorker, PSM } = await import("tesseract.js");

  const worker = await createWorker("eng", undefined, {

    logger: (message) => {

      if (message.status) {

        options.onProgress?.({

          status: message.status,

          progress: typeof message.progress === "number" ? message.progress : 0,

        });

      }

    },

  });



  const objectUrls: string[] = [];



    try {
    const psmModes = [PSM.SINGLE_BLOCK, PSM.SPARSE_TEXT, PSM.AUTO];

    const variants = await preprocessIdImageForOcr(file);
    objectUrls.push(URL.createObjectURL(file));
    for (const variant of variants) {
      objectUrls.push(URL.createObjectURL(variant));
    }

    const texts: string[] = [];
    const total = objectUrls.length * psmModes.length;

    let step = 0;
    for (let i = 0; i < objectUrls.length; i += 1) {
      for (const psm of psmModes) {
        step += 1;
        options.onProgress?.({
          status: `recognizing text (${step}/${total})`,
          progress: step / total,
        });

        await worker.setParameters({
          tessedit_pageseg_mode: psm,
        });

        const { data } = await worker.recognize(objectUrls[i]);
        if (data.text?.trim()) texts.push(data.text);
      }
    }

    if (objectUrls.length > 1) {
      options.onProgress?.({
        status: "recognizing ID number",
        progress: 0.95,
      });
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        tessedit_char_whitelist: "0123456789",
      });
      for (let i = 1; i < Math.min(objectUrls.length, 3); i += 1) {
        const { data } = await worker.recognize(objectUrls[i]);
        if (data.text?.trim()) texts.push(data.text);
      }
      await worker.setParameters({
        tessedit_char_whitelist: "",
      });
    }

    const combinedText = pickBestOcrText(texts);
    const parsed = parseIdDocumentTextWithMeta(combinedText);

    return {
      ...parsed.details,
      ocrLowConfidenceFields: parsed.lowConfidenceFields,
      ocrMrzUsed: parsed.mrzUsed,
    };

  } finally {

    for (const url of objectUrls) URL.revokeObjectURL(url);

    await worker.terminate();

  }

}

