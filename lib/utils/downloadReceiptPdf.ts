import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDateTimeEastAfrica } from "@/lib/globalFormatter";

const OMAYA_LOGO_URL =
  "/assets/bad9edd9da5201cb8f8f9cea35bf46f4fb541bd6_lplbyc.png";

type DownloadReceiptPdfOptions = {
  fileName: string;
  isDark?: boolean;
};

const DATE_FIELD_LABEL =
  /date|time|when|created|exported|generated|timestamp/i;

function formatPdfFieldValue(label: string, value: string): string {
  const trimmed = value.trim();
  if (!trimmed || !DATE_FIELD_LABEL.test(label.trim())) return value;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return value;

  if (
    /^\d{4}-\d{2}-\d{2}/.test(trimmed) ||
    trimmed.includes("T") ||
    /GMT|UTC|Z$/.test(trimmed)
  ) {
    return formatDateTimeEastAfrica(parsed);
  }

  return value;
}

const cleanText = (value: string | null | undefined): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const isSkippable = (el: Element): boolean =>
  el.matches("button, svg, img, hr, script, style, [aria-hidden='true']");

function valueText(el: Element): string {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("button").forEach((btn) => btn.remove());
  return cleanText(clone.textContent);
}

function isLabelValuePair(div: HTMLElement): boolean {
  const direct = Array.from(div.children).filter((c) => !isSkippable(c));
  if (direct.length !== 2) return false;
  const label = cleanText(direct[0].textContent);
  const value = valueText(direct[1]);
  return (
    label.length > 0 &&
    label.length <= 80 &&
    value.length > 0 &&
    value.length <= 600 &&
    label !== value
  );
}

function hasPairContainerAncestor(el: HTMLElement): boolean {
  let parent = el.parentElement;
  while (parent) {
    if (isLabelValuePair(parent)) return true;
    parent = parent.parentElement;
  }
  return false;
}

/** Extract label/value rows from receipt DOM (no html2canvas — avoids oklch CSS parse errors). */
export function extractReceiptRowsFromElement(
  root: HTMLElement
): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  const seen = new Set<string>();

  const push = (label: string, value: string) => {
    const l = cleanText(label);
    const v = cleanText(value);
    if (!l || !v || l === v) return;
    const key = `${l}\0${v}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push([l, v]);
  };

  root.querySelectorAll("h2, h3").forEach((heading) => {
    const title = cleanText(heading.textContent);
    if (title) push("Section", title);
  });

  root.querySelectorAll("div").forEach((div) => {
    if (!isLabelValuePair(div) || hasPairContainerAncestor(div)) return;
    const [labelEl, valueEl] = Array.from(div.children).filter(
      (c) => !isSkippable(c)
    );
    push(cleanText(labelEl.textContent), valueText(valueEl));
  });

  root.querySelectorAll("div").forEach((flex) => {
    const className = flex.className?.toString() || "";
    if (!className.includes("flex") || !className.includes("justify-between")) {
      return;
    }
    const cols = Array.from(flex.children).filter(
      (c): c is HTMLElement => c instanceof HTMLElement && !isSkippable(c)
    );
    if (cols.length !== 2) return;

    cols.forEach((col) => {
      const lines = Array.from(col.children)
        .filter((c) => !isSkippable(c))
        .map((c) => cleanText(c.textContent))
        .filter(Boolean);
      if (lines.length >= 2) {
        push(lines[0], lines.slice(1).join(" · "));
      }
    });
  });

  if (rows.length === 0) {
    const fallback = cleanText(root.innerText);
    if (fallback) push("Receipt", fallback.slice(0, 2000));
  }

  return rows;
}

async function drawOmayaPdfHeader(
  doc: jsPDF,
  title: string
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;
  let currentY = 12;

  try {
    const imgResponse = await fetch(OMAYA_LOGO_URL);
    const imgBlob = await imgResponse.blob();
    const imgDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(imgBlob);
    });
    const natural = await new Promise<{ w: number; h: number }>(
      (resolve, reject) => {
        const img = new Image();
        img.onload = () =>
          resolve({
            w: img.naturalWidth || 1,
            h: img.naturalHeight || 1,
          });
        img.onerror = reject;
        img.src = imgDataUrl;
      }
    );
    const maxLogoW = 52;
    const maxLogoH = 20;
    const aspect = natural.w / natural.h;
    let logoW = maxLogoW;
    let logoH = logoW / aspect;
    if (logoH > maxLogoH) {
      logoH = maxLogoH;
      logoW = logoH * aspect;
    }
    doc.addImage(imgDataUrl, "PNG", centerX - logoW / 2, currentY, logoW, logoH);
    currentY += logoH + 10;
  } catch {
    doc.setFontSize(16);
    doc.setTextColor(29, 135, 81);
    doc.text("OMAYA", centerX, currentY + 6, { align: "center" });
    currentY += 16;
  }

  doc.setFontSize(15);
  doc.setTextColor(0, 0, 0);
  doc.text(title, centerX, currentY, { align: "center" });
  currentY += 8;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Generated: ${formatDateTimeEastAfrica(new Date())}`,
    centerX,
    currentY,
    { align: "center" }
  );

  return currentY + 10;
}

export async function downloadReceiptPdfFromRows(
  rows: Array<[string, string]>,
  fileName: string,
  title = "Transaction receipt"
): Promise<void> {
  if (rows.length === 0) {
    throw new Error("No receipt data to export");
  }

  const doc = new jsPDF();
  const startY = await drawOmayaPdfHeader(doc, title);
  const formattedRows = rows.map(([label, value]) => [
    label,
    formatPdfFieldValue(label, value),
  ]) as Array<[string, string]>;

  autoTable(doc, {
    startY,
    head: [["Field", "Value"]],
    body: formattedRows,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: [29, 135, 81], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 52, fontStyle: "bold" },
      1: { cellWidth: "auto" },
    },
  });

  const safeName = fileName.replace(/\.pdf$/i, "");
  doc.save(`${safeName}.pdf`);
}

/**
 * Builds a receipt PDF from the DOM element (text only — no html2canvas / oklch).
 */
export async function downloadElementAsReceiptPdf(
  element: HTMLElement,
  { fileName, isDark: _isDark = false }: DownloadReceiptPdfOptions
): Promise<void> {
  const rows = extractReceiptRowsFromElement(element);
  const title =
    element.querySelector("h2")?.textContent?.trim() ||
    element.querySelector("h3")?.textContent?.trim() ||
    "Transaction receipt";

  await downloadReceiptPdfFromRows(rows, fileName, title);
}
