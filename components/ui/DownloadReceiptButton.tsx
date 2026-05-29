"use client";

import { useCallback, useState, type RefObject } from "react";
import { Download } from "lucide-react";
import { useTheme } from "@/context/theme";
import { downloadElementAsReceiptPdf } from "@/lib/utils/downloadReceiptPdf";

export type DownloadReceiptButtonProps = {
  receiptRef: RefObject<HTMLElement | null>;
  fileNamePrefix?: string;
  transactionId?: string;
  className?: string;
};

export default function DownloadReceiptButton({
  receiptRef,
  fileNamePrefix = "OMAYA_Receipt",
  transactionId = "transaction",
  className = "",
}: DownloadReceiptButtonProps) {
  const { isDark } = useTheme();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    const el = receiptRef.current;
    if (!el) return;
    setIsDownloading(true);
    try {
      const safeId =
        String(transactionId).replace(/[^\w-]/g, "").slice(0, 12) || "transaction";
      await downloadElementAsReceiptPdf(el, {
        fileName: `${fileNamePrefix}_${safeId}`,
        isDark,
      });
    } catch (err) {
      console.error("Receipt PDF download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  }, [receiptRef, isDark, fileNamePrefix, transactionId]);

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isDownloading}
      className={`w-full mt-3 flex items-center justify-center gap-2 rounded-xl border-2 border-[#1D8751] bg-[#1D8751]/10 hover:bg-[#1D8751]/20 dark:bg-[#1D8751]/15 dark:hover:bg-[#1D8751]/25 text-[#1D8751] font-semibold text-sm py-3 px-4 transition-colors disabled:opacity-60 ${className}`}
    >
      <Download className="h-4 w-4 shrink-0" aria-hidden />
      {isDownloading ? "Preparing PDF…" : "Download receipt (PDF)"}
    </button>
  );
}
