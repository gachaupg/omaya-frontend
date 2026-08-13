"use client";

import React, { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { runIdDocumentOcr } from "@/lib/ocr/runIdDocumentOcr";
import type { IdDocumentDetails } from "@/lib/ocr/types";
import { EMPTY_ID_DOCUMENT_DETAILS } from "@/lib/ocr/types";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

const FIELD_LABELS: Array<{ key: keyof IdDocumentDetails; label: string }> = [
  { key: "documentType", label: "Document type" },
  { key: "fullName", label: "Full name" },
  { key: "givenNames", label: "Given names" },
  { key: "surname", label: "Surname" },
  { key: "documentNumber", label: "Document number" },
  { key: "nationality", label: "Nationality" },
  { key: "dateOfBirth", label: "Date of birth" },
  { key: "sex", label: "Sex" },
  { key: "expiryDate", label: "Expiry date" },
  { key: "issueDate", label: "Issue date" },
  { key: "placeOfBirth", label: "Place of birth" },
  { key: "placeOfIssue", label: "Place of issue" },
  { key: "occupation", label: "Occupation" },
  { key: "address", label: "Address" },
];

export default function IdDocumentOcrPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [details, setDetails] = useState<IdDocumentDetails>(EMPTY_ID_DOCUMENT_DETAILS);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progressPercent = useMemo(
    () => Math.min(100, Math.round(progress * 100)),
    [progress]
  );

  const resetPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WEBP image.");
      return;
    }

    resetPreview();
    setError(null);
    setDetails(EMPTY_ID_DOCUMENT_DETAILS);
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setLoading(true);
    setStatus("Initializing OCR...");
    setProgress(0);

    try {
      const extracted = await runIdDocumentOcr(file, {
        onProgress: ({ status: nextStatus, progress: nextProgress }) => {
          setStatus(nextStatus);
          setProgress(nextProgress);
        },
      });
      setDetails(extracted);
      setStatus("Done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR failed. Try a clearer photo.");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key: keyof IdDocumentDetails, value: string) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[var(--bg-color)] text-gray-900 dark:text-white pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">ID / Passport OCR</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-3xl">
            Upload a national ID or passport photo. OCR runs fully in your browser with
            tesseract.js — nothing is sent to a backend OCR service.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-gray-200 dark:border-[#35353E] bg-gray-50 dark:bg-[var(--card-color)] p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-[#1D8751] text-white font-medium hover:bg-[#166b3e] disabled:opacity-60"
              >
                {loading ? "Reading document..." : "Upload ID or passport"}
              </button>
              {fileName && (
                <span className="text-sm text-gray-500 dark:text-gray-400 self-center truncate max-w-full">
                  {fileName}
                </span>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="hidden"
              onChange={handleFileChange}
            />

            {previewUrl ? (
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 dark:border-[#35353E] bg-black/5">
                <Image
                  src={previewUrl}
                  alt="Uploaded document preview"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-full aspect-[4/3] rounded-xl border border-dashed border-gray-300 dark:border-[#35353E] flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                No image selected
              </div>
            )}

            {loading && (
              <div className="space-y-2">
                <div className="h-2 rounded-full bg-gray-200 dark:bg-[#35353E] overflow-hidden">
                  <div
                    className="h-full bg-[#1D8751] transition-all duration-200"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {status} {progressPercent > 0 ? `(${progressPercent}%)` : ""}
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-[#35353E] bg-gray-50 dark:bg-[var(--card-color)] p-4 sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold">Extracted details</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Review and edit fields before using them. OCR accuracy depends on photo quality,
              glare, and document layout.
            </p>

            <div className="space-y-3">
              {FIELD_LABELS.map(({ key, label }) => (
                <label key={key} className="block space-y-1">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {label}
                  </span>
                  <input
                    type="text"
                    value={String(details[key] ?? "")}
                    onChange={(e) => updateField(key, e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[#161B22] px-3 py-2 text-sm"
                    placeholder={`Enter ${label.toLowerCase()}`}
                  />
                </label>
              ))}
            </div>
          </section>
        </div>

        {details.rawText && (
          <section className="rounded-2xl border border-gray-200 dark:border-[#35353E] bg-gray-50 dark:bg-[var(--card-color)] p-4 sm:p-6 space-y-2">
            <h2 className="text-lg font-semibold">Raw OCR text</h2>
            <pre className="whitespace-pre-wrap break-words text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#35353E] rounded-xl p-4 max-h-64 overflow-y-auto">
              {details.rawText}
            </pre>
          </section>
        )}
      </div>
    </div>
  );
}
