"use client";



import { parseIdDocumentText } from "./parseIdDocumentText";

import { preprocessIdImageForOcr } from "./preprocessIdImage";

import type { IdDocumentDetails } from "./types";



export type OcrProgress = {

  status: string;

  progress: number;

};



type RunIdDocumentOcrOptions = {

  onProgress?: (progress: OcrProgress) => void;

};



function scoreOcrText(text: string) {

  const dates = (text.match(/\d{1,2}\.\s*\d{1,2}\.\s*\d{4}/g) ?? []).length;

  const idNumbers = (text.match(/\b\d{7,8}\b/g) ?? []).length;

  const labels = (text.match(/SURNAME|GIVEN NAME|ID NUMBER|MALE|FEMALE|KEN\b/gi) ?? []).length;

  const kenya = /KITAMBULISHO|JAMHURI|JAMNURI|MAISHA/i.test(text) ? 5 : 0;

  return text.length * 0.05 + dates * 8 + idNumbers * 10 + labels * 6 + kenya;

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

): Promise<IdDocumentDetails> {

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

    await worker.setParameters({

      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,

    });



    const variants = await preprocessIdImageForOcr(file);

    objectUrls.push(URL.createObjectURL(file));

    for (const variant of variants) {

      objectUrls.push(URL.createObjectURL(variant));

    }



    const texts: string[] = [];

    const total = objectUrls.length;



    for (let i = 0; i < objectUrls.length; i += 1) {

      options.onProgress?.({

        status: `recognizing text (${i + 1}/${total})`,

        progress: i / total,

      });



      const { data } = await worker.recognize(objectUrls[i]);

      if (data.text?.trim()) texts.push(data.text);

    }



    const combinedText = pickBestOcrText(texts);

    return parseIdDocumentText(combinedText);

  } finally {

    for (const url of objectUrls) URL.revokeObjectURL(url);

    await worker.terminate();

  }

}

